import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === "production") {
    return level === "error" || level === "warn";
  }
  return true;
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog("debug")) return;
    if (meta) {
      console.debug(message, meta);
      return;
    }
    console.debug(message);
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog("info")) return;
    if (meta) {
      console.info(message, meta);
      return;
    }
    console.info(message);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (!shouldLog("warn")) return;
    if (meta) {
      console.warn(message, meta);
      return;
    }
    console.warn(message);
  },
  error(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.error(message, meta);
      return;
    }
    console.error(message);
  },
};
