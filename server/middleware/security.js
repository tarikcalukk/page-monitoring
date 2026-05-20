const cors = require("cors");
const helmet = require("helmet");
const AppError = require("../utils/AppError");
const config = require("../config");

function configureSecurity(app) {
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests without origin header (same-origin, like Electron, mobile apps, etc)
        if (!origin) return callback(null, true);
        // Allow configured origins
        if (config.allowedOrigins.includes(origin))
          return callback(null, true);
        return callback(new AppError("CORS origin is not allowed.", 403));
      },
      credentials: true,
    }),
  );
}

module.exports = {
  configureSecurity,
};
