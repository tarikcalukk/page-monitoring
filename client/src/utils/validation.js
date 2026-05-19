export const PASSWORD_RULES = [
  {
    id: "length",
    label: "Minimum 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least one uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "At least one lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "At least one number",
    test: (value) => /[0-9]/.test(value),
  },
];

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function getPasswordChecks(password) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    valid: rule.test(password || ""),
  }));
}

export function isStrongPassword(password) {
  return getPasswordChecks(password).every((rule) => rule.valid);
}

export function normalizeUrlInput(url) {
  return String(url || "").trim();
}
