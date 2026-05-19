const urlService = require("../services/urlService");
const monitoringService = require("../services/monitoringService");

async function validateUrl(req, res) {
  res.json(await urlService.validateReachableUrl(req.body.url));
}

async function saveUrl(req, res) {
  res.json(await urlService.saveUrl(req.user.email, req.body.url));
}

async function getUrls(req, res) {
  res.json(await urlService.getUrls(req.user.email));
}

async function fetchContent(req, res) {
  res.json(await urlService.fetchContent(req.body.url));
}

async function deleteUrl(req, res) {
  res.json(await urlService.deleteUrl(req.user.email, req.body.url));
}

async function getChanges(req, res) {
  res.json(await urlService.getChanges(req.user.email, req.query.url));
}

async function getChangeHistory(req, res) {
  res.json(
    await urlService.getChangeHistory(
      req.user.email,
      req.query.url,
      req.query.method,
    ),
  );
}

async function toggleUrlActive(req, res) {
  const result = await urlService.setUrlActive(
    req.user.email,
    req.body.url,
    req.body.active,
  );

  if (req.body.active) {
    monitoringService
      .checkUrlForUser(req.user.email, req.body.url)
      .catch((err) => {
        req.log?.error(
          { err, url: req.body.url },
          "Initial monitoring check failed",
        );
      });
  }

  res.json(result);
}

module.exports = {
  validateUrl,
  saveUrl,
  getUrls,
  fetchContent,
  deleteUrl,
  getChanges,
  getChangeHistory,
  toggleUrlActive,
};
