const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const request = require("supertest");

const testDir = path.join(
  os.tmpdir(),
  `page-monitoring-auth-${Date.now()}-${Math.random()}`,
);
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-with-enough-length";
process.env.DATA_FILE = path.join(testDir, "users.json");
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.LOG_LEVEL = "silent";
process.env.EMAIL_DELIVERY_MODE = "memory";

const { createApp } = require("../app");
const userStore = require("../models/userStore");
const mailService = require("../services/mailService");

const app = createApp();

async function registerAndVerify(
  email = "Test.User@example.com",
  password = "Password123",
) {
  await request(app)
    .post("/api/register")
    .send({ email, password })
    .expect(201);
  const code = mailService.getOutbox().at(-1).code;
  const verifyResponse = await request(app)
    .post("/api/verify-email")
    .send({ email, code })
    .expect(200);
  return verifyResponse.body.token;
}

async function registerAndLogin(
  email = "Test.User@example.com",
  password = "Password123",
) {
  await registerAndVerify(email, password);
  const loginResponse = await request(app)
    .post("/api/login")
    .send({ email, password })
    .expect(200);
  return loginResponse.body.token;
}

beforeAll(async () => {
  await fs.mkdir(testDir, { recursive: true });
});

beforeEach(async () => {
  await userStore.writeUsers([]);
  mailService.clearOutbox();
});

afterAll(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});

describe("auth endpoints", () => {
  test("health endpoint returns 200", async () => {
    const response = await request(app).get("/health").expect(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  test("registers a user with a hashed password and normalized email", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({ email: "New.User@Example.com", password: "Password123" })
      .expect(201);

    expect(response.body).toEqual({
      msg: "User registered successfully. Verification code sent.",
      email: "new.user@example.com",
      emailVerificationRequired: true,
    });

    const users = await userStore.readUsers();
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("new.user@example.com");
    expect(users[0].emailVerified).toBe(false);
    expect(users[0].emailVerification.codeHash).toEqual(expect.any(String));
    expect(users[0].password).not.toBe("Password123");
    expect(users[0].password).toMatch(/^\$2[aby]\$/);
    expect(mailService.getOutbox()).toHaveLength(1);
  });

  test("requires email verification before login and verifies with sent code", async () => {
    await request(app)
      .post("/api/register")
      .send({ email: "verify@example.com", password: "Password123" })
      .expect(201);

    await request(app)
      .post("/api/login")
      .send({ email: "verify@example.com", password: "Password123" })
      .expect(403)
      .expect((response) => {
        expect(response.body.needsEmailVerification).toBe(true);
        expect(response.body.email).toBe("verify@example.com");
      });

    await request(app)
      .post("/api/verify-email")
      .send({ email: "verify@example.com", code: "000000" })
      .expect(400);

    const code = mailService.getOutbox().at(-1).code;
    await request(app)
      .post("/api/verify-email")
      .send({ email: "verify@example.com", code })
      .expect(200)
      .expect((response) => {
        expect(response.body.token).toEqual(expect.any(String));
        expect(response.body.user.emailVerified).toBe(true);
        expect(response.body.user).not.toHaveProperty("emailVerification");
      });

    await request(app)
      .post("/api/login")
      .send({ email: "verify@example.com", password: "Password123" })
      .expect(200);
  });

  test("resends verification code for unverified accounts", async () => {
    await request(app)
      .post("/api/register")
      .send({ email: "resend@example.com", password: "Password123" })
      .expect(201);

    await userStore.updateUsers((users) => {
      users[0].emailVerification.lastSentAt = new Date(Date.now() - 61000).toISOString();
    });

    await request(app)
      .post("/api/resend-verification-code")
      .send({ email: "resend@example.com" })
      .expect(200)
      .expect((response) => {
        expect(response.body.msg).toBe("Verification code sent.");
      });

    expect(mailService.getOutbox()).toHaveLength(2);
  });

  test("rejects weak passwords and duplicate registration", async () => {
    await request(app)
      .post("/api/register")
      .send({ email: "weak@example.com", password: "short" })
      .expect(400)
      .expect((response) => {
        expect(response.body.msg).toContain(
          "Password must be at least 8 characters",
        );
      });

    await request(app)
      .post("/api/register")
      .send({ email: "duplicate@example.com", password: "Password123" })
      .expect(201);

    await request(app)
      .post("/api/register")
      .send({ email: "Duplicate@Example.com", password: "Password123" })
      .expect(400)
      .expect((response) => {
        expect(response.body.msg).toBe("User already exists");
      });
  });

  test("logs in without exposing password and verifies token", async () => {
    const token = await registerAndLogin();

    const loginResponse = await request(app)
      .post("/api/login")
      .send({ email: "test.user@example.com", password: "Password123" })
      .expect(200);

    expect(loginResponse.body.token).toEqual(expect.any(String));
    expect(loginResponse.body.user).not.toHaveProperty("password");

    await request(app)
      .get("/api/verify")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.isValid).toBe(true);
        expect(response.body.user.email).toBe("test.user@example.com");
      });
  });

  test("change password invalidates old tokens", async () => {
    const token = await registerAndLogin("change@example.com", "Password123");

    await request(app)
      .post("/api/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password123", newPassword: "Password456" })
      .expect(200)
      .expect((response) => {
        expect(response.body.msg).toBe("Password changed successfully");
      });

    await request(app)
      .get("/api/verify")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);

    await request(app)
      .post("/api/login")
      .send({ email: "change@example.com", password: "Password456" })
      .expect(200);
  });
});

describe("protected URL and settings endpoints", () => {
  test("requires auth for user URLs and keeps endpoint response shapes", async () => {
    const token = await registerAndLogin("urls@example.com", "Password123");

    await request(app).get("/api/get-urls").expect(401);

    await request(app)
      .post("/api/save-url")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://example.com" })
      .expect(200)
      .expect((response) => {
        expect(response.body.msg).toBe("URL saved successfully.");
        expect(response.body.url.url).toBe("https://example.com");
      });

    await request(app)
      .get("/api/get-urls")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
      });

    await request(app)
      .get("/api/get-changes")
      .query({ url: "https://example.com" })
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({ changes: 0, lastDetectedMethod: null });
      });
  });

  test("validates and persists settings", async () => {
    const token = await registerAndLogin("settings@example.com", "Password123");

    await request(app)
      .post("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        monitoringInterval: 2,
        preferredMethod: "dom",
        logRetentionDays: 15,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.msg).toBe("Settings saved.");
      });

    await request(app)
      .get("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.monitoringInterval).toBe(2);
        expect(response.body.preferredMethod).toBe("DOM");
        expect(response.body.logRetentionDays).toBe(15);
      });
  });

  test("sends report through configured mail service", async () => {
    const token = await registerAndLogin("report@example.com", "Password123");
    mailService.clearOutbox();

    await request(app)
      .post("/api/save-url")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://example.com" })
      .expect(200);

    await request(app)
      .post("/api/send-report")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.sent).toBe(true);
        expect(response.body.deliveryMode).toBe("memory");
        expect(response.body.msg).toBe("Report sent to your email.");
      });

    const [report] = mailService.getOutbox();
    expect(report.to).toBe("report@example.com");
    expect(report.subject).toBe("Page Monitoring Report");
    expect(report.attachments[0].filename).toBe("page-monitoring-report.csv");
  });
});
