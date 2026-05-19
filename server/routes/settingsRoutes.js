const express = require("express");
const settingsController = require("../controllers/settingsController");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { validateBody, schemas } = require("../middleware/validation");

const router = express.Router();

router.get(
  "/api/settings",
  requireAuth,
  asyncHandler(settingsController.getSettings),
);
router.post(
  "/api/settings",
  requireAuth,
  validateBody(schemas.settings),
  asyncHandler(settingsController.saveSettings),
);

module.exports = router;
