import { request } from "./httpClient";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json" },
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  delete global.fetch;
});

test("returns uniform network error when server is offline", async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("offline"));

  await expect(request("/api/login", { auth: false })).rejects.toMatchObject({
    message: "Server is not available. Please try again later.",
    status: 0,
  });
});

test("adds authorization header and clears token on unauthorized response", async () => {
  const listener = jest.fn();
  window.addEventListener("auth:unauthorized", listener);
  localStorage.setItem("token", "abc");
  global.fetch = jest.fn().mockResolvedValue(jsonResponse({ msg: "Invalid token" }, 401));

  await expect(request("/api/get-urls")).rejects.toMatchObject({
    message: "Invalid token",
    status: 401,
  });

  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:5000/api/get-urls",
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer abc" }),
    }),
  );
  expect(localStorage.getItem("token")).toBeNull();
  expect(listener).toHaveBeenCalled();
  window.removeEventListener("auth:unauthorized", listener);
});

test("does not expose raw server internals for 500 responses", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue(jsonResponse({ msg: "EPERM rename internal path" }, 500));

  await expect(request("/api/get-urls")).rejects.toMatchObject({
    message: "Server error. Please try again later.",
    status: 500,
  });
});
