import ExpoModulesCore
import Foundation
import GCDWebServer

extension Dictionary {
  var jsonString: String {
    guard let data = try? JSONSerialization.data(withJSONObject: self) else {
      return "{}"
    }
    return String(data: data, encoding: .utf8) ?? "{}"
  }
}

public class ExpoWebServerModule: Module {
  private let server = GCDWebServer()
  private var port: UInt = 8000
  private var responseCallbacks = [String: GCDWebServerCompletionBlock]()
  private var bgTaskIdentifier = UIBackgroundTaskIdentifier.invalid

  public func definition() -> ModuleDefinition {
    Name("ExpoWebServer")

    Events("onStatusUpdate", "onRequest")

    Function("setup", setupHandler)
    Function("start", startHandler)
    Function("route", routeHandler)
    Function("respond", respondHandler)
    Function("stop", stopHandler)
  }

  private func setupHandler(port: UInt) {
    self.port = port
  }

  private func startHandler() {
    startServer(status: "STARTED", message: "Server started")
  }

  private func routeHandler(path: String, method: String, uuid: String) {

    server.addHandler(
      forMethod: method, path: path, request: GCDWebServerDataRequest.self,
      asyncProcessBlock: { (request, completionBlock) in
        if let dataRequest = request as? GCDWebServerDataRequest {
          self.responseCallbacks[uuid] = completionBlock
          //TODO: NSString* charset = GCDWebServerExtractHeaderValueParameter(self.contentType, @"charset"); for string parsing
          self.sendEvent(
            "onRequest",
            [
              "uuid": uuid,
              "method": request.method,
              "path": path,
              "body":
                (request.method == "POST" || request.method == "PUT" || request.method == "PATCH")
                ? String(data: dataRequest.data, encoding: .utf8) : nil,
              "headersJson": request.headers.jsonString,
              "paramsJson": request.query?.jsonString ?? "{}",
            ])
        }
      })
  }

  private func respondHandler(
    udid: String,
    statusCode: Int,
    statusDescription: String,
    contentType: String,
    headers: [String: String],
    body: String,
    file: String?
  ) {
    if let callback = self.responseCallbacks[udid] {
      var response: GCDWebServerResponse?
      if let file = file {
        response = GCDWebServerFileResponse(file: file.replacingOccurrences(of: "file://", with: ""), isAttachment: false)
      } else if let responseData = body.data(using: .utf8) {
        response = GCDWebServerDataResponse(data: responseData, contentType: contentType)
      }

      if let response = response {
        for (key, value) in headers {
          response.setValue(value, forAdditionalHeader: key)
        }
        callback(response)
        self.responseCallbacks.removeValue(forKey: udid)
      }
    }
  }

  private func stopHandler() {
    stopServer(status: "STOPPED", message: "Server stopped")
  }

  private func startServer(status: String, message: String) {
    stopServer()
    server.start(withPort: self.port, bonjourName: nil)
    if !server.isRunning {
      sendEvent(
        "onStatusUpdate",
        [
          "status": "ERROR",
          "message": "Unknown error starting server",
        ])
    } else {
      sendEvent(
        "onStatusUpdate",
        [
          "status": status,
          "message": message,
        ])
    }
  }

  private func stopServer(status: String? = nil, message: String? = nil) {
    if server.isRunning {
      server.stop()
    }
    if let status = status, let message = message {
      sendEvent(
        "onStatusUpdate",
        [
          "status": status,
          "message": message,
        ])
    }
  }
}
