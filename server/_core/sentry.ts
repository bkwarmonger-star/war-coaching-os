import * as Sentry from "@sentry/node";
import { ENV } from "./env";
import { execSync } from "child_process";

export function initSentryServer() {
  const dsn = ENV.sentryDsn || process.env.SENTRY_DSN || "";
  if (!dsn) return;

  let release = process.env.SENTRY_RELEASE || process.env.npm_package_version || "dev";
  try {
    const sha = execSync("git rev-parse --short HEAD").toString().trim();
    release = `${release}+${sha}`;
  } catch (err) {
    // ignore if git not available
  }

  Sentry.init({
    dsn,
    environment: ENV.isProduction ? "production" : "development",
    tracesSampleRate: 0.05,
    release,
  });

  // Capture unhandled errors so Sentry reports them
  process.on("uncaughtException", (err) => {
    try {
      Sentry.captureException(err);
      Sentry.flush(2000);
    } catch (e) {
      console.error("Sentry capture failed:", e);
    }
    // still rethrow to allow default behavior
    console.error("Uncaught Exception:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    try {
      Sentry.captureException(reason as any);
      Sentry.flush(2000);
    } catch (e) {
      console.error("Sentry capture failed:", e);
    }
    console.error("Unhandled Rejection:", reason);
  });
}
