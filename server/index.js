const config = require("./config");
const { createApp } = require("./app");
const monitoringService = require("./services/monitoringService");
const logger = require("./utils/logger");

if (config.usingEphemeralJwtSecret) {
  logger.warn(
    "JWT_SECRET is not set. Using a temporary runtime secret; tokens expire after server restart.",
  );
}

const app = createApp();
const server = app.listen(config.port, () => {
  logger.info(`Server running on http://localhost:${config.port}`);
});

monitoringService.startMonitoringScheduler();

let shuttingDown = false;

async function shutdown(reason, error) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (error) logger.error({ err: error }, `Shutting down after ${reason}`);
  else logger.info(`Shutting down after ${reason}`);

  const forceExit = setTimeout(() => process.exit(1), 10000);
  forceExit.unref();

  await monitoringService.shutdownMonitoring().catch((err) => {
    logger.error({ err }, "Failed to stop monitoring cleanly");
  });

  server.close(() => {
    clearTimeout(forceExit);
    process.exit(error ? 1 : 0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) =>
  shutdown("unhandledRejection", error),
);
process.on("uncaughtException", (error) =>
  shutdown("uncaughtException", error),
);
