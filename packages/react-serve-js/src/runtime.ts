import express, {
  Request,
  Response as ExpressResponse,
  RequestHandler,
  json,
} from "express";
import { ReactNode } from "react";
import { watch, readdirSync, statSync, existsSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import cors from "cors";
import { createRequire } from "module";

// Context to hold req/res for useRoute() and middleware context
let routeContext: {
  req: Request;
  res: ExpressResponse;
  params: any;
  query: any;
  body: any;
  middlewareContext: Map<string, any>;
} | null = null;

// Global context that can be used from anywhere
const globalContext = new Map<string, any>();

export function useRoute() {
  if (!routeContext) throw new Error("useRoute must be used inside a Route");
  return routeContext;
}

export function useSetContext(key: string, value: any) {
  if (routeContext) {
    // If we're inside a route/middleware, use the route context
    routeContext.middlewareContext.set(key, value);
  } else {
    // If we're outside a route/middleware, use the global context
    globalContext.set(key, value);
  }
}

export function useContext(key: string) {
  if (routeContext) {
    // If we're inside a route/middleware, check route context first, then global
    const routeValue = routeContext.middlewareContext.get(key);
    if (routeValue !== undefined) {
      return routeValue;
    }
    return globalContext.get(key);
  } else {
    // If we're outside a route/middleware, use the global context
    return globalContext.get(key);
  }
}

// Middleware type
export type Middleware = (req: Request, next: () => any) => any;

// Internal store for routes, middlewares and config
const routes: {
  method: string;
  path: string;
  handler: Function;
  middlewares: Middleware[];
}[] = [];
let appConfig: {
  port?: number;
  cors?: boolean | cors.CorsOptions;
  globalPrefix?: string;
} = {};

// --- File-based routing helpers ---
function toExpressSegment(dirName: string): string {
  // Route group directories are skipped in the URL path
  if (dirName.startsWith("(") && dirName.endsWith(")")) return "";

  // Catch-all segment: [...slug] -> :slug
  const catchAllMatch = dirName.match(/^\[\.\.\.(.+)\]$/);
  if (catchAllMatch) {
    return `:${catchAllMatch[1]}`;
  }

  // Optional catch-all: [[...slug]] -> :slug
  const optionalCatchAllMatch = dirName.match(/^\[\[\.\.\.(.+)\]\]$/);
  if (optionalCatchAllMatch) {
    return `:${optionalCatchAllMatch[1]}`;
  }

  // Dynamic segment: [id] -> :id
  const dynamicMatch = dirName.match(/^\[(.+)\]$/);
  if (dynamicMatch) {
    return `:${dynamicMatch[1]}`;
  }

  return dirName;
}

function withOptionalPrefix(
  prefix: string | undefined,
  urlPath: string
): string {
  const p = prefix ? (prefix.startsWith("/") ? prefix : `/${prefix}`) : "";
  const full = p + (urlPath === "/" ? "" : urlPath) || "/";
  return full.replace(/\/+/g, "/");
}

function fileExistsVariations(basePathWithoutExt: string): string | null {
  const candidates = [".tsx", ".ts", ".jsx", ".js"].map(
    (ext) => basePathWithoutExt + ext
  );
  for (const file of candidates) {
    if (existsSync(file)) return file;
  }
  return null;
}

type LoadedConfig = { sourceRoot: string; entry: string; routeFileBase: string };

function loadReactServeConfigSync(): LoadedConfig {
  const cwd = process.cwd();
  const base = path.join(cwd, "react-serve.config");
  const tryPaths = [
    base + ".ts",
    base + ".tsx",
    base + ".js",
    base + ".cjs",
    base + ".mjs",
  ];

  for (const cfgPath of tryPaths) {
    if (!existsSync(cfgPath)) continue;
    try {
      const requireFn = createRequire(__filename);
      // Prefer require() to keep this loader synchronous; works under tsx/ts-node
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = requireFn(cfgPath);
      const conf = (mod && (mod.default || mod)) || {};
      return {
        sourceRoot: conf.sourceRoot || "src",
        entry: conf.entry || "index",
        routeFileBase: conf.routeFileBase || "route",
      };
    } catch (e: unknown) {
      // Fallback to defaults on failure to load
      console.warn(
        "Warning: Failed to load react-serve.config from",
        cfgPath,
        "- using defaults. Error:",
        (e instanceof Error && e.message) ? e.message : e
      );
      return { sourceRoot: "src", entry: "index", routeFileBase: "route" };
    }
  }

  return { sourceRoot: "src", entry: "index", routeFileBase: "route" };
}

function createLazyMiddlewareFromModule(moduleFile: string): Middleware {
  let loadedMiddlewares: Middleware[] | null = null;
  return async (req, next) => {
    if (!loadedMiddlewares) {
      const url = pathToFileURL(moduleFile).href;
      const mod: any = await import(url);
      const exported =
        mod.default ?? mod.use ?? mod.middleware ?? mod.middlewares;
      if (!exported) {
        // No middleware exported, just continue
        return next();
      }
      loadedMiddlewares = Array.isArray(exported) ? exported : [exported];
    }

    let index = 0;
    const run = async (): Promise<any> => {
      if (index >= (loadedMiddlewares as Middleware[]).length) {
        return next();
      }
      const current = (loadedMiddlewares as Middleware[])[index++];
      return current(req, run);
    };
    return run();
  };
}

function createFileRouteHandler(moduleFile: string) {
  let cachedModule: any | null = null;
  let cachedAllowed: string[] | null = null;

  const load = async () => {
    if (!cachedModule) {
      const url = pathToFileURL(moduleFile).href;
      cachedModule = await import(url);
      const keys = Object.keys(cachedModule);
      const httpMethods = [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
        "HEAD",
        "ALL",
      ];
      cachedAllowed = keys
        .filter((k) => httpMethods.includes(k.toUpperCase()))
        .map((k) => k.toUpperCase());
      // Treat default export as GET if no explicit GET is provided
      if (
        !cachedAllowed.includes("GET") &&
        typeof cachedModule.default === "function"
      ) {
        cachedAllowed.push("GET");
      }
    }
  };

  return async function handler() {
    await load();
    const { req } = useRoute();
    const method = req.method.toUpperCase();

    const fn: Function | undefined =
      cachedModule[method] ||
      (method === "GET" ? cachedModule.default : undefined);

    if (!fn) {
      const allow = (cachedAllowed || []).filter((m) => m !== "ALL");
      return {
        type: "Response",
        props: {
          status: 405,
          headers: allow.length ? { Allow: allow.join(", ") } : undefined,
          json: {
            error: "Method Not Allowed",
            message: `Method ${method} is not allowed for this route`,
            allowed: allow.length ? allow : undefined,
          },
        },
      };
    }

    return await fn();
  };
}

function registerFileRoutesFromDirectory(
  rootDir: string,
  prefix: string | undefined,
  currentDir: string,
  urlSegments: string[],
  inheritedMiddlewares: Middleware[],
  routeFileBase: string
): void {
  // Load directory-level middleware if present
  const middlewareFile = fileExistsVariations(
    path.join(currentDir, "middleware")
  );
  const aggregatedMiddlewares = [...inheritedMiddlewares];
  if (middlewareFile) {
    aggregatedMiddlewares.push(createLazyMiddlewareFromModule(middlewareFile));
  }

  const routeFile = fileExistsVariations(
    path.join(currentDir, routeFileBase)
  );
  if (routeFile) {
    const expressPath = ("/" + urlSegments.filter(Boolean).join("/")).replace(
      /\/+/g,
      "/"
    );
    const fullPath = withOptionalPrefix(prefix, expressPath);

    routes.push({
      method: "all",
      path: fullPath,
      handler: createFileRouteHandler(routeFile),
      middlewares: aggregatedMiddlewares,
    });
  }

  // Traverse child directories
  const entries = readdirSync(currentDir);
  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry);
    if (!statSync(entryPath).isDirectory()) continue;
    if (entry.startsWith(".")) continue;

    const segment = toExpressSegment(entry);
    const nextSegments = segment ? [...urlSegments, segment] : [...urlSegments];
    registerFileRoutesFromDirectory(
      rootDir,
      prefix,
      entryPath,
      nextSegments,
      aggregatedMiddlewares,
      routeFileBase
    );
  }
}

// Component processor
function processElement(
  element: any,
  pathPrefix: string = "",
  middlewares: Middleware[] = []
): void {
  if (!element) return;

  if (Array.isArray(element)) {
    element.forEach((el) => processElement(el, pathPrefix, middlewares));
    return;
  }

  if (typeof element === "object") {
    // Handle React elements with function components
    if (typeof element.type === "function") {
      // Call the function component to get its JSX result
      const result = element.type(element.props || {});
      processElement(result, pathPrefix, middlewares);
      return;
    }

    if (element.type) {
      if (
        element.type === "App" ||
        (element.type && element.type.name === "App")
      ) {
        // Extract app configuration
        const props = element.props || {};
        appConfig = {
          port: props.port || 9000,
          cors: props.cors,
          globalPrefix: props.globalPrefix,
        };

        const layoutPrefix = props.globalPrefix
          ? `${pathPrefix}${props.globalPrefix}`
          : pathPrefix;
        const children = props.children;
        if (children) {
          if (Array.isArray(children)) {
            children.forEach((child: any) =>
              processElement(child, layoutPrefix, middlewares)
            );
          } else {
            processElement(children, layoutPrefix, middlewares);
          }
        }
        return;
      }

      if (
        element.type === "RouteGroup" ||
        (element.type && element.type.name === "RouteGroup")
      ) {
        // Handle RouteGroup component
        const props = element.props || {};
        const groupPrefix = props.prefix
          ? `${pathPrefix}${props.prefix}`
          : pathPrefix;

        // Process children to collect middlewares and routes
        if (props.children) {
          const children = Array.isArray(props.children)
            ? props.children
            : [props.children];

          // First pass: collect all middleware components in this group
          const groupMiddlewares = [...middlewares];
          children.forEach((child: any) => {
            if (
              child &&
              typeof child === "object" &&
              (child.type === "Middleware" ||
                (child.type && child.type.name === "Middleware"))
            ) {
              const middlewareProps = child.props || {};
              if (middlewareProps.use) {
                if (Array.isArray(middlewareProps.use)) {
                  groupMiddlewares.push(...middlewareProps.use);
                } else if (typeof middlewareProps.use === "function") {
                  groupMiddlewares.push(middlewareProps.use);
                }
              }
            }
          });

          // Second pass: process all children with the accumulated middlewares
          children.forEach((child: any) => {
            // Skip middleware components in second pass since we already processed them
            if (
              !(
                child &&
                typeof child === "object" &&
                (child.type === "Middleware" ||
                  (child.type && child.type.name === "Middleware"))
              )
            ) {
              processElement(child, groupPrefix, groupMiddlewares);
            }
          });
        }
        return;
      }


      if (
        element.type === "Route" ||
        (element.type && element.type.name === "Route")
      ) {
        const props = element.props || {};
        if (props.path && props.children) {
          if (!props.method) {
            throw new Error(
              `Route with path "${props.path}" is missing a required "method" property`
            );
          }
          const fullPath = `${pathPrefix}${props.path}`;

          // Combine RouteGroup middlewares with Route-level middlewares
          let routeMiddlewares = [...middlewares];

          if (props.middleware) {
            if (Array.isArray(props.middleware)) {
              routeMiddlewares.push(...props.middleware);
            } else {
              routeMiddlewares.push(props.middleware);
            }
          }

          routes.push({
            method: props.method.toLowerCase(),
            path: fullPath,
            handler: props.children,
            middlewares: routeMiddlewares,
          });
        }
        return;
      }
    }

    // Process children for non-RouteGroup elements
    if (element.props && element.props.children) {
      if (Array.isArray(element.props.children)) {
        element.props.children.forEach((child: any) =>
          processElement(child, pathPrefix, middlewares)
        );
      } else {
        processElement(element.props.children, pathPrefix, middlewares);
      }
    }
  }
}

export function serve(element: ReactNode) {
  // Clear routes and config before processing
  routes.length = 0;
  appConfig = {};

  // Process the React element tree to extract routes and config
  processElement(element);

  // Auto-discover file-based routes
  const { sourceRoot, routeFileBase } = loadReactServeConfigSync();
  const sourceRootAbs = path.isAbsolute(sourceRoot)
    ? sourceRoot
    : path.join(process.cwd(), sourceRoot);

  const globalMiddlewares: Middleware[] = [];
  const globalMiddlewareFile = fileExistsVariations(
    path.join(sourceRootAbs, "middleware")
  );
  if (globalMiddlewareFile) {
    globalMiddlewares.push(
      createLazyMiddlewareFromModule(globalMiddlewareFile)
    );
  }

  // Determine the root directory for routes; scan only `${sourceRoot}/app`
  const routesRoot = path.join(sourceRootAbs, "app");

  // Register routes recursively starting at the selected root
  registerFileRoutesFromDirectory(
    routesRoot,
    appConfig.globalPrefix,
    routesRoot,
    [],
    globalMiddlewares,
    routeFileBase || "route"
  );

  const port = appConfig.port || 6969;

  // Express
  const app = express();
  app.use(express.json());

  // Apply CORS if enabled in App props
  if (appConfig.cors) {
    app.use(cors(appConfig.cors === true ? {} : appConfig.cors));
  }

  // Unified output handler to reduce duplication across methods
  const sendResponseFromOutput = (res: ExpressResponse, output: any): void => {
    if (!output) {
      if (!res.headersSent) {
        res.status(500).json({ error: "No response generated" });
      }
      return;
    }

    if (typeof output === "object") {
      const isResponseElement = Boolean(
        output.type &&
          (output.type === "Response" || output.type?.name === "Response")
      );

      if (isResponseElement) {
        const { status = 200, json, text, html, headers, redirect } = output.props || {};
        res.status(status);
        if (headers && typeof headers === "object") {
          res.set(headers);
        }
        if (redirect) {
          res.redirect(status, redirect);
          return;
        }
        if (json !== undefined) {
          res.json(json);
          return;
        }
        if (text !== undefined) {
          res.type("text/plain").send(String(text));
          return;
        }
        if (html !== undefined) {
          res.type("text/html").send(String(html));
          return;
        }
        res.end();
        return;
      }

      if (!res.headersSent) {
        res.status(500).json({ error: "Invalid response format" });
      }
      return;
    }

    // Primitive outputs are sent as text
    res.send(String(output));
  };

  // Shared request handler factory used for all HTTP methods
  const createExpressHandler = (
    handler: Function,
    middlewares: Middleware[] = []
  ) => {
    const wrapped: RequestHandler = async (
      req: Request,
      res: ExpressResponse
    ) => {
      routeContext = {
        req,
        res,
        params: req.params,
        query: req.query,
        body: req.body,
        middlewareContext: new Map<string, any>(),
      };

      try {
        // Execute middlewares in sequence
        let middlewareIndex = 0;

        const executeNextMiddleware = async (): Promise<any> => {
          if (middlewareIndex >= middlewares.length) {
            // All middlewares executed, run the main handler
            return await handler();
          }

          const currentMiddleware = middlewares[middlewareIndex++];
          return await currentMiddleware(req, executeNextMiddleware);
        };

        const output = await executeNextMiddleware();
        sendResponseFromOutput(res, output);
      } catch (error) {
        console.error("Route handler error:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Internal server error" });
        }
      } finally {
        routeContext = null;
      }
    };
    return wrapped;
  };

  // Register all routes for supported HTTP methods
  const regularRoutes = routes.filter((route) => route.path !== "*");
  const wildcardRoutes = routes.filter((route) => route.path === "*");

  // Collect allowed methods per path for 405 handling
  const methodsByPath: { [path: string]: string[] } = {};
  for (const route of regularRoutes) {
    if (!methodsByPath[route.path]) {
      methodsByPath[route.path] = [];
    }
    if (!methodsByPath[route.path].includes(route.method.toUpperCase())) {
      methodsByPath[route.path].push(route.method.toUpperCase());
    }
  }

  for (const route of regularRoutes) {
    const method = route.method.toLowerCase();

    const registrar: Record<
      string,
      (path: string, ...handlers: RequestHandler[]) => any
    > = {
      get: app.get.bind(app),
      post: app.post.bind(app),
      put: app.put.bind(app),
      patch: app.patch.bind(app),
      delete: app.delete.bind(app),
      options: app.options.bind(app),
      head: app.head.bind(app),
      all: app.all.bind(app),
    };

    const register = registrar[method];
    if (register) {
      register(
        route.path,
        createExpressHandler(route.handler, route.middlewares)
      );
    } else {
      console.warn(`Unsupported HTTP method: ${route.method}`);
    }
  }

  app.use((req: Request, res: ExpressResponse, next: any) => {
    const path = req.path;
    if (methodsByPath[path] && !methodsByPath[path].includes(req.method)) {
      res.set("Allow", methodsByPath[path].join(", "));

      console.log(
        `\n🚫  [405 Method Not Allowed]\n` +
          `   ✦ Path: ${path}\n` +
          `   ✦ Tried: ${req.method}\n` +
          `   ✦ Allowed: ${methodsByPath[path].join(", ")}\n`
      );

      res.status(405).json({
        error: "Method Not Allowed",
        message: `Method ${req.method} is not allowed for path ${path}`,
        path,
        method: req.method,
      });
    } else {
      next();
    }
  });

  const hasCustomWildcard = wildcardRoutes.length > 0;

  if (hasCustomWildcard) {
    for (const route of wildcardRoutes) {
      const method = route.method.toLowerCase();

      const methodSpecificWildcardHandler = async (
        req: Request,
        res: ExpressResponse,
        next: any
      ) => {
        if (method === "all" || req.method.toLowerCase() === method) {
          routeContext = {
            req,
            res,
            params: req.params,
            query: req.query,
            body: req.body,
            middlewareContext: new Map<string, any>(),
          };
          try {
            let middlewareIndex = 0;

            const executeNextMiddleware = async (): Promise<any> => {
              if (middlewareIndex >= route.middlewares.length) {
                return await route.handler();
              }
              const currentMiddleware = route.middlewares[middlewareIndex++];
              return await currentMiddleware(req, executeNextMiddleware);
            };

            const output = await executeNextMiddleware();
            sendResponseFromOutput(res, output);
          } catch (error) {
            console.error("Wildcard route handler error:", error);
            if (!res.headersSent)
              res.status(500).json({ error: "Internal server error" });
          } finally {
            routeContext = null;
          }
        } else {
          next();
        }
      };

      app.use(methodSpecificWildcardHandler);
    }
  } else {
    // Default 404 handler if no wildcard route is defined
    app.use((req: Request, res: ExpressResponse) => {
      res.status(404).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.originalUrl} not found`,
        path: req.originalUrl,
        method: req.method,
      });
    });
  }

  const server = app.listen(port, () => {
    console.log(`🚀 ReactServe running at http://localhost:${port}`);
    if (process.env.NODE_ENV !== "production") {
      console.log("🔥 Hot reload enabled - watching for file changes...");
    }
  });

  server.on("error", (err) => {
    console.error("Server error:", err);
  });

  // Hot reload
  if (process.env.NODE_ENV !== "production") {
    const watchPaths = ["."];
    watchPaths.forEach((watchPath) => {
      watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (
          filename &&
          (filename.endsWith(".ts") || filename.endsWith(".tsx"))
        ) {
          console.log(`🔄 File changed: ${filename} - Restarting server...`);
          server.close(() => {
            process.exit(0);
          });
        }
      });
    });
  }

  return server;
}
