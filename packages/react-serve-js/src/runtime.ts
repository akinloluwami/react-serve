import express, { Request, Response as ExpressResponse, RequestHandler } from "express";
import { ReactNode } from "react";
import { watch } from "fs";

// Context to hold req/res for useRoute()
let routeContext: {
  req: Request;
  res: ExpressResponse;
  params: any;
  query: any;
  body: any;
} | null = null;

export function useRoute() {
  if (!routeContext) throw new Error("useRoute must be used inside a Route");
  return routeContext;
}

// Internal store for routes and config
const routes: { method: string; path: string; handler: Function }[] = [];
let appConfig: { port?: number } = {};

// Component processor
function processElement(element: any, pathPrefix: string = ""): void {
  if (!element) return;

  if (Array.isArray(element)) {
    element.forEach((el) => processElement(el, pathPrefix));
    return;
  }

  if (typeof element === "object") {
    // Handle React elements with function components
    if (typeof element.type === "function") {
      // Call the function component to get its JSX result
      const result = element.type(element.props || {});
      processElement(result, pathPrefix);
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

        // Process children with the new prefix
        if (props.children) {
          if (Array.isArray(props.children)) {
            props.children.forEach((child: any) =>
              processElement(child, groupPrefix)
            );
          } else {
            processElement(props.children, groupPrefix);
          }
        }
        return;
      }

      if (
        element.type === "Route" ||
        (element.type && element.type.name === "Route")
      ) {
        const props = element.props || {};
        if (props.method && props.path && props.children) {
          const fullPath = `${pathPrefix}${props.path}`;
          routes.push({
            method: props.method,
            path: fullPath,
            handler: props.children,
          });
        }
        return;
      }
    }

    // Process children
    if (element.props && element.props.children) {
      if (Array.isArray(element.props.children)) {
        element.props.children.forEach((child: any) =>
          processElement(child, pathPrefix)
        );
      } else {
        processElement(element.props.children, pathPrefix);
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

  // Unified output handler to reduce duplication across methods
  const sendResponseFromOutput = (
    res: ExpressResponse,
    output: any
  ): void => {
    if (!output) {
      if (!res.headersSent) {
        res.status(500).json({ error: "No response generated" });
      }
      return;
    }

    if (typeof output === "object") {
      const isResponseElement = Boolean(
        output.type && (output.type === "Response" || output.type?.name === "Response")
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
  const createExpressHandler = (handler: Function) => {
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
      };
      console.log(routeContext);
      try {
        const output = await handler();
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
  for (const route of routes) {
    const method = route.method.toLowerCase();
    console.log(method);
    const registrar: Record<string, (path: string, ...handlers: RequestHandler[]) => any> = {
      get: app.get.bind(app),
      post: app.post.bind(app),
      put: app.put.bind(app),
      patch: app.patch.bind(app),
      delete: app.delete.bind(app),
      options: app.options.bind(app),
      head: app.head.bind(app),
    };

    const register = registrar[method];
    if (register) {
      register(route.path, createExpressHandler(route.handler));
    } else {
      console.warn(`Unsupported HTTP method: ${route.method}`);
    }
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
