import { MiddlewareFunction } from "react-serve-js";

const loggingMiddleware: MiddlewareFunction = (req, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  return next();
};

const attachRequestMeta: MiddlewareFunction = (req, next) => {
  return next();
};

export default [loggingMiddleware, attachRequestMeta];
