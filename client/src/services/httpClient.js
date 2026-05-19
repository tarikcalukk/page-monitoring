import { API_BASE_URL } from "../config/apiConfig";
import { clearStoredToken, getStoredToken } from "../utils/authStorage";
import { ApiError } from "../utils/errors";

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { msg: text } : null;
}

function notifyUnauthorized() {
  clearStoredToken();
  window.dispatchEvent(new Event("auth:unauthorized"));
}

export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = true,
    headers = {},
    signal,
  } = options;

  const requestHeaders = { ...headers };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";

  const token = getStoredToken();
  if (auth && token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError("Server is not available. Please try again later.", 0);
  }

  const data = await readResponse(response).catch(() => null);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) notifyUnauthorized();
    const message =
      response.status >= 500
        ? "Server error. Please try again later."
        : data?.msg || "Request failed. Please try again.";
    throw new ApiError(
      message,
      response.status,
      data,
    );
  }

  return data;
}

export { API_BASE_URL };
