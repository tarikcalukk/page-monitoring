const reportService = require("../services/reportService");
const urlService = require("../services/urlService");

async function statistics(req, res) {
  res.json(await urlService.getStatistics(req.user.email));
}

async function sendReport(req, res) {
  const result = await reportService.sendReportEmail(req.user);
  res.status(result.sent ? 200 : 202).json(result);
}

async function exportCsv(req, res) {
  const csv = reportService.buildCsvForUser(req.user);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=page-monitoring-report.csv",
  );
  res.send(csv);
}

module.exports = {
  statistics,
  sendReport,
  exportCsv,
};
