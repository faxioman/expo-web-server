export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
export type Status = "STARTED" | "STOPPED" | "ERROR";

export interface StatusEvent {
  status: Status;
  message: string;
}

export interface RequestEvent {
  uuid: string;
  method: string;
  path: string;
  body: string;
  headersJson: string;
  paramsJson: string;
}

export interface WebResponse {
  statusCode?: number;
  statusDescription?: string;
  contentType?: string;
  headers?: Record<string, string>;
  body?: string;
  file?: string;
}

export interface WebCallback {
  method: string;
  path: string;
  uuid: string;
  callback: (request: RequestEvent) => Promise<WebResponse>;
}
