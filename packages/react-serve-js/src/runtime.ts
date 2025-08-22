import express, {
  Request,
  Response as ExpressResponse,
  RequestHandler,
} from "express";
import { ReactNode } from "react";
import { watch } from "fs";
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
          (filename.endsWith(".ts") || filename.endsWith(".tsx")) &&
          !filename.includes("node_modules") &&
          !filename.includes(".git")
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
