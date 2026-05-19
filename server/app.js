const express = require("express");
const pinoHttp = require("pino-http");
const config = require("./config");
const routes = require("./routes");
const { configureSecurity } = require("./middleware/security");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const logger = require("./utils/logger");

function createApp() {
  const app = express();

  configureSecurity(app);
  app.use(express.json({ limit: config.jsonLimit }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: config.env !== "test",
    }),
  );

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use(routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
