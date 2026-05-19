import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json" },
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

function mockApi(handler) {
  global.fetch = jest.fn((url, options = {}) => {
    const path = String(url).replace("http://localhost:5000", "");
    return Promise.resolve(handler(path, options));
  });
}

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
  jest.clearAllMocks();
});

afterEach(() => {
  delete global.fetch;
});

test("renders login screen", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
});

test("login flow stores token and opens protected home", async () => {
  mockApi((path) => {
    if (path === "/api/login") {
      return jsonResponse({
        token: "valid-token",
        user: { email: "user@example.com", createdAt: "2026-05-19T00:00:00.000Z" },
      });
    }
    if (path === "/api/get-urls") return jsonResponse([]);
    return jsonResponse({ msg: "not found" }, 404);
  });

  render(<App />);
  await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
  await userEvent.type(screen.getByLabelText(/password/i), "Password123");
  await userEvent.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => {
    expect(localStorage.getItem("token")).toBe("valid-token");
  });
  expect(await screen.findByText(/site monitoring/i)).toBeInTheDocument();
});

test("registration validates password confirmation before calling API", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("link", { name: /sign up/i }));

  await userEvent.type(screen.getByLabelText(/^email$/i), "new@example.com");
  await userEvent.type(screen.getByLabelText(/^password$/i), "Password123");
  await userEvent.type(screen.getByLabelText(/confirm password/i), "Password456");
  await userEvent.click(screen.getByRole("button", { name: /register/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(/passwords do not match/i);
  expect(global.fetch).toBeUndefined();
});

test("registration shows server offline message", async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

  render(<App />);
  await userEvent.click(screen.getByRole("link", { name: /sign up/i }));
  await userEvent.type(screen.getByLabelText(/^email$/i), "new@example.com");
  await userEvent.type(screen.getByLabelText(/^password$/i), "Password123");
  await userEvent.type(screen.getByLabelText(/confirm password/i), "Password123");
  await userEvent.click(screen.getByRole("button", { name: /register/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(/server is not available/i);
});

test("protected home redirects to login when token is invalid", async () => {
  localStorage.setItem("token", "expired-token");
  window.history.pushState({}, "", "/home");
  mockApi((path) => {
    if (path === "/api/verify") {
      return jsonResponse({ isValid: false, msg: "Invalid token" }, 401);
    }
    return jsonResponse([]);
  });

  render(<App />);

  expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  expect(localStorage.getItem("token")).toBeNull();
});
