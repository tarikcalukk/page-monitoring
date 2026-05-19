const express = require("express");
const reportController = require("../controllers/reportController");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/api/statistics",
  requireAuth,
  asyncHandler(reportController.statistics),
);
router.post(
  "/api/send-report",
  requireAuth,
  asyncHandler(reportController.sendReport),
);
router.get(
  "/api/export-csv",
  requireAuth,
  asyncHandler(reportController.exportCsv),
);

module.exports = router;
