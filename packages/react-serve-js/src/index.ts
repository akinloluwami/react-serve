export {
  serve,
  useRoute,
  useSetContext,
  useContext,
  type Middleware as MiddlewareFunction,
} from "./runtime";
import React from "react";
import type { CorsOptions } from "cors";

export function App({
  children,
  port,
  cors,
  parseBody,
}: {
  children: any;
  port?: number;
  cors?: boolean | CorsOptions;
  parseBody?: boolean;
}): React.ReactElement {
  return { type: "App", props: { children, port, cors, parseBody } } as any;
}

export function Route({
  children,
  path,
  method,
  middleware,
  parseBody,
}: {
  children: any;
  path: string;
  method: string;
  middleware?:
    | import("./runtime").Middleware
    | import("./runtime").Middleware[];
  parseBody?: boolean;
}): React.ReactElement {
  return {
    type: "Route",
    props: { children, path, method, middleware, parseBody },
  } as any;
}

export function Response({
  json,
  status,
  text,
  html,
  headers,
  redirect,
}: {
  json?: any;
  status?: number;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  redirect?: string;
}): React.ReactElement {
  return {
    type: "Response",
    props: { json, status, text, html, headers, redirect },
  } as any;
}

export function Middleware({
  use,
}: {
  use: import("./runtime").Middleware | import("./runtime").Middleware[];
}): React.ReactElement {
  return { type: "Middleware", props: { use } } as any;
}

export function RouteGroup({
  children,
  prefix,
  parseBody,
}: {
  children: any;
  prefix?: string;
  parseBody?: boolean;
}): React.ReactElement {
  return { type: "RouteGroup", props: { children, prefix, parseBody } } as any;
}
