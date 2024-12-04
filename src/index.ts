import { LegacyEventEmitter } from "expo-modules-core";

import { RequestEvent, WebResponse, Request } from "./ExpoWebServer.types";
import ExpoWebServerModule from "./ExpoWebServerModule";

const emitter = new LegacyEventEmitter(ExpoWebServerModule);

export const start = (port: number, callback) => {
  emitter.addListener<RequestEvent>("onRequest", async (event) => {
    const request: Request = {
      requestId: event.requestId,
      method: event.method,
      path: event.path,
      body: event.body,
      headers: JSON.parse(event.headersJson ?? "{}"),
      params: JSON.parse(event.paramsJson ?? "{}"),
    };
    const response: WebResponse = await callback(request);
    ExpoWebServerModule.respond(
      response.requestId,
      response.statusCode || 200,
      response.statusDescription || "OK",
      response.contentType || "application/json",
      response.headers || {},
      response.body,
      response.file
    );
  });
  ExpoWebServerModule.start(port);
};

export const stop = () => ExpoWebServerModule.stop();
