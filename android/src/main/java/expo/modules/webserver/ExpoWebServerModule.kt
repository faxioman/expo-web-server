package expo.modules.webserver

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import io.ktor.http.*
import io.ktor.server.engine.*
import io.ktor.server.cio.*
import io.ktor.server.routing.*
import io.ktor.server.response.*
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap
import com.google.gson.Gson
import io.ktor.server.request.httpMethod
import io.ktor.server.request.receiveText
import io.ktor.server.request.uri
import io.ktor.util.toMap


class ExpoWebServerModule : Module() {
    private var server: EmbeddedServer<CIOApplicationEngine, CIOApplicationEngine.Configuration>? = null;
    private val pendingResponses = ConcurrentHashMap<String, CompletableDeferred<ResponseData>>()

    override fun definition() = ModuleDefinition {
        Name("ExpoWebServer")

        Events("onRequest")

        Function("start") { port: Int ->
            startServer(port)
        }

        Function("respond") { requestId: String, statusCode: Int, statusDescription: String, contentType: String, headers: Map<String, String>, body: String?, file: String? ->
            respondToRequest(requestId, statusCode, statusDescription, contentType, headers, body, file)
        }

        Function("stop") {
            stopServer()
        }
    }

    private fun startServer(port: Int) {
        server = embeddedServer(CIO, host = "0.0.0.0", port = port) {
            routing {
                route("{...}") {
                    handle {
                        val requestId = generateRequestId()
                        val deferredResponse = CompletableDeferred<ResponseData>()
                        pendingResponses[requestId] = deferredResponse

                        val method = call.request.httpMethod.value
                        val path = call.request.uri
                        val headers = call.request.headers.toMap()
                        val params = call.request.queryParameters.toMap()
                        val body = if (method in listOf("POST", "PUT", "PATCH")) {
                            call.receiveText()
                        } else {
                            null
                        }

                        val requestEvent = mapOf(
                            "requestId" to requestId,
                            "method" to method,
                            "path" to path,
                            "body" to body,
                            "headersJson" to Gson().toJson(headers),
                            "paramsJson" to Gson().toJson(params)
                        )

                        sendEvent("onRequest", requestEvent)

                        // Wait for the response from JavaScript
                        val responseData = deferredResponse.await()

                        // Send the response back to the client
                        val status = HttpStatusCode.fromValue(responseData.statusCode)
                        call.response.status(status)
                        responseData.headers.forEach { (key, value) ->
                            call.response.headers.append(key, value)
                        }

                        if (responseData.file != null) {
                            val filePath = responseData.file.replace("file://", "")
                            val fileToSend = java.io.File(filePath)
                            if (fileToSend.exists()) {
                                call.respondFile(fileToSend)
                            } else {
                                call.respond(HttpStatusCode.NotFound)
                            }
                        } else if (responseData.body != null) {
                            call.respondText(responseData.body, ContentType.parse(responseData.contentType))
                        } else {
                            call.respondText("", ContentType.parse(responseData.contentType))
                        }
                    }
                }
            }
        }

        server?.start(wait = false)
    }

    private fun respondToRequest(
        requestId: String,
        statusCode: Int,
        statusDescription: String,
        contentType: String,
        headers: Map<String, String>,
        body: String?,
        file: String?
    ) {
        val deferredResponse = pendingResponses.remove(requestId)
        if (deferredResponse != null) {
            deferredResponse.complete(
                ResponseData(
                    statusCode = statusCode,
                    statusDescription = statusDescription,
                    contentType = contentType,
                    headers = headers,
                    body = body,
                    file = file
                )
            )
        } else {
            println("No pending request found for requestId: $requestId")
        }
    }

    private fun stopServer() {
        server?.stop()
        server = null
        pendingResponses.clear()
    }

    private fun generateRequestId(): String {
        val milliseconds = System.currentTimeMillis()
        val randomValue = (0..1_000_000).random()
        return "$milliseconds:$randomValue"
    }

    data class ResponseData(
        val statusCode: Int,
        val statusDescription: String,
        val contentType: String,
        val headers: Map<String, String>,
        val body: String?,
        val file: String?
    )
}