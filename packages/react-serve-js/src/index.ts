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
}: {
  children: any;
  port?: number;
  cors?: boolean | CorsOptions;
}): React.ReactElement {
  return { type: "App", props: { children, port, cors } } as any;
}

export function Route({
  children,
  path,
  method,
  middleware,
}: {
  children: any;
  path: string;
  method: string;
  middleware?:
    | import("./runtime").Middleware
    | import("./runtime").Middleware[];
}): React.ReactElement {
  return {
    type: "Route",
    props: { children, path, method, middleware },
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
}: {
  children: any;
  prefix?: string;
}): React.ReactElement {
  return { type: "RouteGroup", props: { children, prefix } } as any;
}

export function FileRouter({
  routesDir,
  middleware,
}: {
  routesDir: string;
  middleware?:
    | import("./runtime").Middleware
    | import("./runtime").Middleware[];
}): React.ReactElement {
  return { type: "FileRouter", props: { routesDir, middleware } } as any;
}
