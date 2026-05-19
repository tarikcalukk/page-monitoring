const urlService = require("../services/urlService");

async function getSettings(req, res) {
  res.json(await urlService.getSettings(req.user.email));
}

async function saveSettings(req, res) {
  res.json(await urlService.saveSettings(req.user.email, req.body));
}

module.exports = {
  getSettings,
  saveSettings,
};
