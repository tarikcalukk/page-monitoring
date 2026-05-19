const express = require("express");
const authController = require("../controllers/authController");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");
const { validateBody, schemas } = require("../middleware/validation");

const router = express.Router();

router.post(
  "/api/register",
  authLimiter,
  validateBody(schemas.register),
  asyncHandler(authController.register),
);
router.post(
  "/api/login",
  authLimiter,
  validateBody(schemas.login),
  asyncHandler(authController.login),
);
router.get("/api/verify", asyncHandler(authController.verify));
router.post(
  "/api/change-password",
  requireAuth,
  validateBody(schemas.changePassword),
  asyncHandler(authController.changePassword),
);
router.delete(
  "/api/delete-account",
  requireAuth,
  asyncHandler(authController.deleteAccount),
);

module.exports = router;
