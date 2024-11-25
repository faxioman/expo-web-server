export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";

export interface RequestEvent {
  requestId: string;
  method: HttpMethod;
  path: string;
  body: string;
  headersJson: string;
  paramsJson: string;
}

export interface Request {
  requestId: string;
  method: HttpMethod;
  path: string;
  body: string;
  headers: { [key: string]: string };
  params: { [key: string]: string };
}

export interface WebResponse {
  requestId: string;
  statusCode?: number;
  statusDescription?: string;
  contentType?: string;
  headers?: Record<string, string>;
  body?: string;
  file?: string;
}
