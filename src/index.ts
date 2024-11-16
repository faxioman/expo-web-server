import { EventEmitter } from "expo-modules-core";

import {
  WebCallback,
  HttpMethod,
  RequestEvent,
  StatusEvent,
  WebResponse,
} from "./ExpoWebServer.types";
import ExpoWebServerModule from "./ExpoWebServerModule";

const emitter = new EventEmitter(ExpoWebServerModule);
const requestCallbacks: WebCallback[] = [];

export const start = () => {
  emitter.addListener<RequestEvent>("onRequest", async (event) => {
    const responseHandler = requestCallbacks.find((c) => c.uuid === event.uuid);
    if (!responseHandler) {
      ExpoWebServerModule.respond(
        event.uuid,
        404,
        "Not Found",
        "application/json",
        {},
        JSON.stringify({ error: "Handler not found" }),
      );
      return;
    }
    const response = await responseHandler.callback(event);
    ExpoWebServerModule.respond(
      event.uuid,
      response.statusCode || 200,
      response.statusDescription || "OK",
      response.contentType || "application/json",
      response.headers || {},
      response.body || "{}",
      response.file,
    );
  });
  ExpoWebServerModule.start();
};

export const route = (
  path: string,
  method: HttpMethod,
  callback: (request: RequestEvent) => Promise<WebResponse>,
) => {
  const uuid = Math.random().toString(16).slice(2);
  requestCallbacks.push({
    method,
    path,
    uuid,
    callback,
  });
  ExpoWebServerModule.route(path, method, uuid);
};

export const setup = (
  port: number,
  onStatusUpdate?: (event: StatusEvent) => void,
) => {
  if (onStatusUpdate) {
    emitter.addListener<StatusEvent>("onStatusUpdate", async (event) => {
      onStatusUpdate(event);
    });
  }
  ExpoWebServerModule.setup(port);
};

export const stop = () => ExpoWebServerModule.stop();
