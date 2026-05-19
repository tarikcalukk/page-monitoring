export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getFriendlyErrorMessage(error) {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}
