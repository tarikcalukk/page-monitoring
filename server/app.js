const express = require("express");
const fs = require("fs");
const path = require("path");
const pinoHttp = require("pino-http");
const config = require("./config");
const routes = require("./routes");
const { configureSecurity } = require("./middleware/security");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const logger = require("./utils/logger");

function createApp() {
  const app = express();
  const clientBuildPath = path.resolve(__dirname, "client_build");
  const hasClientBuild = fs.existsSync(clientBuildPath);

  configureSecurity(app);
  app.use(express.json({ limit: config.jsonLimit }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: config.env !== "test",
    }),
  );

  if (hasClientBuild) {
    app.use(express.static(clientBuildPath));
  }

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use(routes);

  if (hasClientBuild) {
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        res.sendFile(path.join(clientBuildPath, "index.html"), (err) => {
          if (err) next();
        });
      } else {
        next();
      }
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
