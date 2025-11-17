const LOG_ENABLED = process.env.REACT_SERVE_LOG !== "false";

export const logger = {
  info: (...args: unknown[]) => {
    if (LOG_ENABLED) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (LOG_ENABLED) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Always show errors
    console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production" && LOG_ENABLED)
      console.debug(...args);
  },
};

export default logger;
