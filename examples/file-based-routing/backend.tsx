import {
  App,
  FileRouter,
  Middleware,
  Response,
  serve,
  type MiddlewareFunction,
} from "../../packages/react-serve-js/src";

// Logging middleware for file-based routes
const loggingMiddleware: MiddlewareFunction = (req, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  return next();
};

export default function Backend() {
  return (
    <App port={6969} cors={true}>
      <FileRouter routesDir="./src/routes" middleware={loggingMiddleware} />
    </App>
  );
}

// Start the server
serve(Backend());
