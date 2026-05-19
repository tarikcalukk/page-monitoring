const express = require("express");
const urlController = require("../controllers/urlController");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const {
  validateBody,
  validateQuery,
  schemas,
} = require("../middleware/validation");

const router = express.Router();

router.post(
  "/api/validate-url",
  validateBody(schemas.urlBody),
  asyncHandler(urlController.validateUrl),
);
router.post(
  "/api/save-url",
  requireAuth,
  validateBody(schemas.urlBody),
  asyncHandler(urlController.saveUrl),
);
router.get("/api/get-urls", requireAuth, asyncHandler(urlController.getUrls));
router.post(
  "/api/fetch-content",
  validateBody(schemas.urlBody),
  asyncHandler(urlController.fetchContent),
);
router.delete(
  "/api/delete-url",
  requireAuth,
  validateBody(schemas.deleteUrl),
  asyncHandler(urlController.deleteUrl),
);
router.get(
  "/api/get-changes",
  requireAuth,
  validateQuery(schemas.changesQuery),
  asyncHandler(urlController.getChanges),
);
router.get(
  "/api/get-change-history",
  requireAuth,
  validateQuery(schemas.changeHistoryQuery),
  asyncHandler(urlController.getChangeHistory),
);
router.post(
  "/api/toggle-url-active",
  requireAuth,
  validateBody(schemas.toggleUrlActive),
  asyncHandler(urlController.toggleUrlActive),
);

module.exports = router;
