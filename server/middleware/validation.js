const Joi = require("joi");
const AppError = require("../utils/AppError");
const {
  PASSWORD_MESSAGE,
  isStrongPassword,
  isValidHttpUrl,
  normalizePreferredMethod,
} = require("../utils/validators");

function strongPassword(value, helpers) {
  if (!isStrongPassword(value)) return helpers.message(PASSWORD_MESSAGE);
  return value;
}

function httpUrl(value, helpers) {
  if (!isValidHttpUrl(value))
    return helpers.message("A valid http/https URL is required");
  return value.trim();
}

function validate(source, schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return next(
        new AppError(
          error.details.map((detail) => detail.message).join(". "),
          400,
        ),
      );
    }

    req[source] = value;
    return next();
  };
}

const email = Joi.string().trim().lowercase().email().required().messages({
  "string.email": "Invalid email format",
  "string.empty": "Email and password are required",
  "any.required": "Email and password are required",
});

const password = Joi.string().required().custom(strongPassword).messages({
  "string.empty": "Email and password are required",
  "any.required": "Email and password are required",
});

const url = Joi.string().trim().required().custom(httpUrl);

const schemas = {
  register: Joi.object({ email, password }),
  login: Joi.object({
    email,
    password: Joi.string().required().messages({
      "string.empty": "Email and password are required",
      "any.required": "Email and password are required",
    }),
  }),
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "string.empty": "Current password is required",
      "any.required": "Current password is required",
    }),
    newPassword: Joi.string().required().custom(strongPassword),
  }),
  urlBody: Joi.object({ url }),
  deleteUrl: Joi.object({
    url: Joi.string()
      .trim()
      .required()
      .messages({ "any.required": "URL is required." }),
  }),
  toggleUrlActive: Joi.object({
    url,
    active: Joi.boolean()
      .required()
      .messages({ "any.required": "URL and active(boolean) are required." }),
  }),
  changesQuery: Joi.object({
    url: Joi.string()
      .trim()
      .required()
      .messages({ "any.required": "URL is required." }),
  }),
  changeHistoryQuery: Joi.object({
    url: Joi.string().trim().required(),
    method: Joi.string().valid("HASH", "DOM").required(),
  }).messages({
    "any.only": "URL and valid method (HASH or DOM) are required.",
  }),
  settings: Joi.object({
    emailNotifications: Joi.boolean(),
    monitoringInterval: Joi.number().integer().min(1).max(86400),
    maxErrors: Joi.number().integer().min(1).max(100),
    preferredMethod: Joi.string()
      .valid("both", "HASH", "DOM", "hash", "dom")
      .custom((value) => normalizePreferredMethod(value)),
    logRetentionDays: Joi.number().integer().min(1).max(365),
    monitoringPaused: Joi.boolean(),
    browserNotifications: Joi.boolean(),
  }).min(1),
};

module.exports = {
  validateBody: (schema) => validate("body", schema),
  validateQuery: (schema) => validate("query", schema),
  schemas,
};
