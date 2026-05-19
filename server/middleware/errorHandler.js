const config = require("../config");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

function notFound(req, res, next) {
  next(new AppError("Route not found.", 404));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const statusCode = Number(err.statusCode || err.status || 500);
  const safeStatus = statusCode >= 400 && statusCode < 600 ? statusCode : 500;
  const message =
    safeStatus >= 500 && config.isProduction
      ? "Server error"
      : err.msg || err.message || "Server error";

  if (safeStatus >= 500) {
    req.log?.error({ err }, message);
    if (!req.log) logger.error({ err }, message);
  }

  return res.status(safeStatus).json({ msg: message });
}

module.exports = {
  notFound,
  errorHandler,
};
