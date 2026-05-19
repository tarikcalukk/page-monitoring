class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = statusCode;
    this.msg = message;
    this.isOperational = true;
  }
}

module.exports = AppError;
