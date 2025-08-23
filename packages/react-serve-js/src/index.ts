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
  globalPrefix,
}: {
  children?: any;
  port?: number;
  cors?: boolean | CorsOptions;
  /**
   * Optional global URL prefix applied to all routes.
   * For example, set to "/api" to mount all routes under /api.
   */
  globalPrefix?: string;
}): React.ReactElement {
  return { type: "App", props: { children, port, cors, globalPrefix } } as any;
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
  return { type: "Response", props: { json, status, text, html, headers, redirect } } as any;
}

export function Middleware({
  use,
}: {
  use:
    | import("./runtime").Middleware
    | import("./runtime").Middleware[];
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

/**
 * ReactServe configuration file schema.
 *
 * Place a `react-serve.config.(ts|js)` at your project root to configure the runtime.
 */
export type ReactServeConfig = {
  /**
   * The source directory to scan for file-based routes and global middleware.
   * Default: "src". Can be a relative or absolute path.
   */
  sourceRoot?: string;
  /**
   * The entry file name (without extension) to import for the app entry.
   * Resolved from <sourceRoot>/<entry> with extensions .tsx, .ts, .jsx, .js in order.
   * Default: "index".
   */
  entry?: string;
  /**
   * The base filename used to detect route files in each directory.
   * For example, set to "server" to use server.ts files. Default: "route".
   */
  routeFileBase?: string;
};
