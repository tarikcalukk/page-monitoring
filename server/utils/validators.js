const PASSWORD_MESSAGE =
  "Password must be at least 8 characters long and contain uppercase, lowercase, and number characters";

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizePreferredMethod(method) {
  const normalized = String(method || "both").trim();
  if (normalized.toLowerCase() === "both") return "both";
  return normalized.toUpperCase();
}

module.exports = {
  PASSWORD_MESSAGE,
  normalizeEmail,
  isStrongPassword,
  isValidHttpUrl,
  normalizePreferredMethod,
};
