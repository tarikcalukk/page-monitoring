const authService = require("../services/authService");

async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

async function login(req, res) {
  res.json(await authService.login(req.body));
}

async function verify(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ isValid: false, msg: "Unauthorized" });
  }

  try {
    const user = await authService.authorizeToken(
      authHeader.slice("Bearer ".length),
    );
    return res.json({ isValid: true, user: authService.publicUser(user) });
  } catch (err) {
    return res.status(err.statusCode || err.status || 401).json({
      isValid: false,
      msg: err.msg || "Invalid token",
    });
  }
}

async function changePassword(req, res) {
  res.json(
    await authService.changePassword(
      req.user.email,
      req.body.currentPassword,
      req.body.newPassword,
    ),
  );
}

async function deleteAccount(req, res) {
  res.json(await authService.deleteAccount(req.user.email));
}

module.exports = {
  register,
  login,
  verify,
  changePassword,
  deleteAccount,
};
