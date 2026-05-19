const AppError = require("../utils/AppError");
const authService = require("../services/authService");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      throw new AppError("Unauthorized", 401);

    req.user = await authService.authorizeToken(
      authHeader.slice("Bearer ".length),
    );
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireAuth,
};
