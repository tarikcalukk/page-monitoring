module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "services/**/*.js",
    "utils/**/*.js",
  ],
};
