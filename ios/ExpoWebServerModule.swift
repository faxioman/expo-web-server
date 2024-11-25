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
  private var _server: GCDWebServer?
  private var _completionBlocks = [String: GCDWebServerCompletionBlock]()
  private let _completionBlocksLock = NSLock()

  public func definition() -> ModuleDefinition {
    Name("ExpoWebServer")

    Events("onRequest")

    Function("start", startHandler)
    Function("respond", respondHandler)
    Function("stop", stopHandler)
  }

  private func initRequestRecevier(server: GCDWebServer, method: String) {
    server.addDefaultHandler(
      forMethod: method, request: GCDWebServerDataRequest.self,
      asyncProcessBlock: { (request, completionBlock) in

        let milliseconds = Int64(Date().timeIntervalSince1970 * 1000.0)
        let randomValue = Int.random(in: 0..<1_000_000)
        let requestId = "\(milliseconds):\(randomValue)"

        self._completionBlocksLock.lock()
        self._completionBlocks[requestId] = completionBlock
        self._completionBlocksLock.unlock()

        if let dataRequest = request as? GCDWebServerDataRequest {
          //TODO: NSString* charset = GCDWebServerExtractHeaderValueParameter(self.contentType, @"charset"); for string parsing
          self.sendEvent(
            "onRequest",
            [
              "requestId": requestId,
              "method": method,
              "path": request.url.relativeString,
              "body":
                (request.method == "POST" || request.method == "PUT" || request.method == "PATCH")
                ? String(data: dataRequest.data, encoding: .utf8) : nil,
              "headersJson": request.headers.jsonString,
              "paramsJson": request.query?.jsonString ?? "{}",
            ])
        }
      })
  }

  private func startHandler(port: UInt) {
    DispatchQueue.main.sync {
      self._server = GCDWebServer()
      self.initRequestRecevier(server: self._server!, method: "GET")
      self.initRequestRecevier(server: self._server!, method: "POST")
      self.initRequestRecevier(server: self._server!, method: "PUT")
      self.initRequestRecevier(server: self._server!, method: "DELETE")
      self._server!.start(withPort: port, bonjourName: nil)
    }
  }

  private func stopHandler() {
    if self._server?.isRunning == true {
      self._server?.stop()
      self._server?.removeAllHandlers()
      self._server = nil
    }
  }

  private func respondHandler(
    requestId: String,
    statusCode: Int,
    statusDescription: String,
    contentType: String,
    headers: [String: String],
    body: String?,
    file: String?
  ) {
    self._completionBlocksLock.lock()
    let completionBlock: GCDWebServerCompletionBlock? = self._completionBlocks[requestId];
    self._completionBlocksLock.unlock()

    if completionBlock != nil {
      var response: GCDWebServerResponse?
      if let file = file {
        response = GCDWebServerFileResponse(
          file: file.replacingOccurrences(of: "file://", with: ""), isAttachment: false)
      } else if let responseData = body?.data(using: .utf8) {
        response = GCDWebServerDataResponse(data: responseData, contentType: contentType)
      } else {
        response = GCDWebServerResponse()
      }

      for (key, value) in headers {
        response!.setValue(value, forAdditionalHeader: key)
      }
      completionBlock!(response!)

      self._completionBlocksLock.lock()
      self._completionBlocks.removeValue(forKey: requestId)
      self._completionBlocksLock.unlock()
    }
  }
}
