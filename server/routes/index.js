const express = require("express");
const authRoutes = require("./authRoutes");
const urlRoutes = require("./urlRoutes");
const settingsRoutes = require("./settingsRoutes");
const reportRoutes = require("./reportRoutes");

const router = express.Router();

router.use(authRoutes);
router.use(urlRoutes);
router.use(settingsRoutes);
router.use(reportRoutes);

module.exports = router;
