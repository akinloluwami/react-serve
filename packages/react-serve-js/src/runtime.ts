import express, {
  Request,
  Response as ExpressResponse,
  RequestHandler,
} from "express";
import { ReactNode } from "react";
import { watch, readdirSync, statSync, existsSync } from "fs";
import { join, extname, basename, resolve } from "path";
import { fileURLToPath } from "url";
import cors from "cors";

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
let appConfig: { port?: number; cors?: boolean | cors.CorsOptions } = {};

// File-based routing utilities
function parseRouteFromFilename(filename: string): {
  path: string;
  method: string;
} {
  const name = basename(filename, extname(filename));

  // Handle dynamic routes [param]
  let path = name.replace(/\[([^\]]+)\]/g, ":$1");

  // Handle catch-all routes [...param]
  path = path.replace(/\[\.\.\.([^\]]+)\]/g, "*");

  // Handle optional catch-all routes [[...param]]
  path = path.replace(/\[\[\.\.\.([^\]]+)\]\]/g, "*");

  // Convert catch-all to Express.js format
  if (path.includes("*")) {
    path = "*";
  }

  // Default to GET method
  let method = "GET";

  // Check for method suffix (e.g., users.post.tsx -> POST)
  const methodMatch = name.match(
    /\.(get|post|put|patch|delete|options|head)$/i
  );
  if (methodMatch) {
    method = methodMatch[1].toUpperCase();
    // Remove method suffix from path
    path = path.replace(/\.(get|post|put|patch|delete|options|head)$/i, "");
  }

  return { path, method };
}

async function scanRoutesDirectory(
  dir: string,
  basePath: string = ""
): Promise<void> {
  // Resolve the directory path relative to current working directory
  const resolvedDir = resolve(dir);
  if (!existsSync(resolvedDir)) {
    console.warn(`FileRouter: Directory does not exist: ${resolvedDir}`);
    return;
  }

  // Process layout files for this directory
  const layoutMiddlewares = await processLayoutFiles(resolvedDir);

  const items = readdirSync(resolvedDir);

  for (const item of items) {
    const fullPath = join(resolvedDir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Handle route groups (directories)
      const newBasePath = basePath ? `${basePath}/${item}` : item;
      await scanRoutesDirectory(fullPath, newBasePath);
    } else if (stat.isFile()) {
      // Handle route files
      const ext = extname(item);
      if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
        const { path: routePath, method } = parseRouteFromFilename(item);
        const fullRoutePath = basePath ? `${basePath}/${routePath}` : routePath;

        // Skip hidden files but allow layout files
        if (item.startsWith(".")) continue;

        // Import and register the route
        try {
          // Convert to absolute path and use file:// protocol for ES modules
          const absolutePath = resolve(fullPath);
          const fileUrl = `file://${absolutePath}`;

          const routeModule = await import(fileUrl);
          const handler =
            routeModule.default || routeModule.handler || routeModule;

          if (typeof handler === "function") {
            // Handle index files properly - they should map to the directory path
            let routePath;
            if (fullRoutePath === "index") {
              routePath = "/";
            } else if (fullRoutePath.endsWith("/index")) {
              routePath = `/${fullRoutePath.replace("/index", "")}`;
            } else {
              routePath = `/${fullRoutePath}`;
            }
            routes.push({
              method,
              path: routePath,
              handler,
              middlewares: [...layoutMiddlewares],
            });
          }
        } catch (error) {
          console.warn(
            `FileRouter: Failed to load route from ${fullPath}:`,
            error
          );
        }
      }
    }
  }
}

// Process layout files in a directory
async function processLayoutFiles(dir: string): Promise<Middleware[]> {
  const layoutMiddlewares: Middleware[] = [];
  const resolvedDir = resolve(dir);

  if (!existsSync(resolvedDir)) return layoutMiddlewares;

  const items = readdirSync(resolvedDir);

  for (const item of items) {
    if (
      item === "_layout.tsx" ||
      item === "_layout.js" ||
      item === "_layout.ts" ||
      item === "_layout.jsx"
    ) {
      const fullPath = join(resolvedDir, item);
      try {
        const layoutModule = await import(`file://${resolve(fullPath)}`);
        if (
          layoutModule.layoutMiddleware &&
          typeof layoutModule.layoutMiddleware === "function"
        ) {
          layoutMiddlewares.push(layoutModule.layoutMiddleware);
        }
      } catch (error) {
        console.warn(
          `FileRouter: Failed to load layout from ${fullPath}:`,
          error
        );
      }
    }
  }

  return layoutMiddlewares;
}

// Component processor
async function processElement(
  element: any,
  pathPrefix: string = "",
  middlewares: Middleware[] = []
): Promise<void> {
  if (!element) return;

  if (Array.isArray(element)) {
    for (const el of element) {
      await processElement(el, pathPrefix, middlewares);
    }
    return;
  }

  if (typeof element === "object") {
    // Handle React elements with function components
    if (typeof element.type === "function") {
      // Call the function component to get its JSX result
      const result = element.type(element.props || {});
      await processElement(result, pathPrefix, middlewares);
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
        };
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
          for (const child of children) {
            // Skip middleware components in second pass since we already processed them
            if (
              !(
                child &&
                typeof child === "object" &&
                (child.type === "Middleware" ||
                  (child.type && child.type.name === "Middleware"))
              )
            ) {
              await processElement(child, groupPrefix, groupMiddlewares);
            }
          }
        }
        return;
      }

      if (
        element.type === "FileRouter" ||
        (element.type && element.type.name === "FileRouter")
      ) {
        // Handle FileRouter component
        const props = element.props || {};
        if (props.routesDir) {
          // Scan the routes directory for file-based routes
          await scanRoutesDirectory(props.routesDir);

          // Apply middleware to all file-based routes if provided
          if (props.middleware) {
            const fileRouterMiddlewares = Array.isArray(props.middleware)
              ? props.middleware
              : [props.middleware];

            routes.forEach((route) => {
              route.middlewares.push(...fileRouterMiddlewares);
            });
          }
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
        for (const child of element.props.children) {
          await processElement(child, pathPrefix, middlewares);
        }
      } else {
        await processElement(element.props.children, pathPrefix, middlewares);
      }
    }
  }
}

export async function serve(element: ReactNode) {
  // Clear routes and config before processing
  routes.length = 0;
  appConfig = {};

  // Process the React element tree to extract routes and config
  await processElement(element);

  const port = appConfig.port || 6969;

  // Express
  const app = express();
  app.use(express.json());

  // Apply CORS if enabled in App props
  if (appConfig.cors) {
    const corsOptions =
      appConfig.cors === true
        ? {
            origin: true, // Allow all origins in development
            credentials: true,
            methods: [
              "GET",
              "POST",
              "PUT",
              "DELETE",
              "OPTIONS",
              "PATCH",
              "HEAD",
            ],
            allowedHeaders: [
              "Content-Type",
              "Authorization",
              "X-Requested-With",
            ],
          }
        : appConfig.cors;
    app.use(cors(corsOptions));
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
        const { status = 200, json } = output.props || {};
        res.status(status);
        if (json !== undefined) {
          res.json(json);
        } else {
          res.end();
        }
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
