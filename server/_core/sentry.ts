import * as Sentry from "@sentry/node";
import { ENV } from "./env";

export function initSentryServer() {
  const dsn = ENV.sentryDsn || process.env.SENTRY_DSN || "";
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: ENV.isProduction ? "production" : "development",
    tracesSampleRate: 0.05,
  });
}
