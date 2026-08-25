import { getToken, clearToken } from "./auth";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const PRODUCTION_API_BASE_URL = "https://chayva-backend.onrender.com";

export class ApiError extends Error {
  status?: number;
  code?: number | string;
  data?: unknown;
  isNetworkError?: boolean;
  isTimeout?: boolean;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: number | string;
      data?: unknown;
      isNetworkError?: boolean;
      isTimeout?: boolean;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status;
    this.code = options?.code;
    this.data = options?.data;
    this.isNetworkError = options?.isNetworkError;
    this.isTimeout = options?.isTimeout;
  }
}

type RequestBody = BodyInit | Record<string, unknown> | unknown[] | null | undefined;
type ApiRequestInit = Omit<RequestInit, "body"> & { body?: RequestBody; timeoutMs?: number };

export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return PRODUCTION_API_BASE_URL;
    }
  }

  return (import.meta.env.PROD || import.meta.env.MODE === "production")
    ? PRODUCTION_API_BASE_URL
    : DEFAULT_API_BASE_URL;
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildHeaders(body: RequestBody, headers?: HeadersInit) {
  const next = new Headers(headers);
  const token = getToken();

  if (token) {
    next.set("Authorization", `Bearer ${token}`);
  }

  if (body != null && !(body instanceof FormData) && !next.has("Content-Type")) {
    next.set("Content-Type", "application/json");
  }

  return next;
}

function serializeBody(body: RequestBody) {
  if (body == null || body instanceof FormData || typeof body === "string") {
    return body as BodyInit | null | undefined;
  }

  return JSON.stringify(body);
}

async function parseResponse(response: Response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

function errorMessageFromPayload(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const detail = record.detail ?? record.message ?? record.error;

    if (typeof detail === "string" && detail.trim()) return detail.trim();
    if (Array.isArray(detail)) return detail.map(String).join(", ");
  }

  if (typeof payload === "string" && payload.trim()) return payload.trim();
  return fallback;
}

async function request<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { body, timeoutMs = 35000, ...requestInit } = init;
  const url = buildUrl(path);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...requestInit,
      signal: init.signal ?? controller.signal,
      body: serializeBody(body),
      headers: buildHeaders(body, init.headers),
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && (err.name === "AbortError" || err.message?.includes("aborted"))) {
      throw new ApiError(
        "Server is waking up from sleep and took too long to respond. Please try again in a few seconds.",
        { isTimeout: true, isNetworkError: true }
      );
    }
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    const msg = isOffline
      ? "You appear to be offline. Please check your internet connection."
      : "Unable to reach Caayva server. The server may be waking up or temporarily unreachable. Please try again.";
    throw new ApiError(msg, { isNetworkError: true });
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/sign")) {
      clearToken();
    }
    const errorMessage = errorMessageFromPayload(
      payload,
      `Request failed with status ${response.status}`
    );
    throw new ApiError(errorMessage, {
      status: response.status,
      data: payload,
    });
  }

  return payload as T;
}

export function get<T>(path: string, init?: ApiRequestInit) {
  return request<T>(path, { ...init, method: "GET" });
}

export function post<T>(path: string, body?: RequestBody, init?: ApiRequestInit) {
  return request<T>(path, { ...init, method: "POST", body });
}

export function put<T>(path: string, body?: RequestBody, init?: ApiRequestInit) {
  return request<T>(path, { ...init, method: "PUT", body });
}

export function patch<T>(path: string, body?: RequestBody, init?: ApiRequestInit) {
  return request<T>(path, { ...init, method: "PATCH", body });
}

export function del<T>(path: string, init?: ApiRequestInit) {
  return request<T>(path, { ...init, method: "DELETE" });
}
