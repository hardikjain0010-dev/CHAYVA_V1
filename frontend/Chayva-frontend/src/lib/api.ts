import { getToken } from "./auth";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const PRODUCTION_API_BASE_URL = "https://chayva-backend.onrender.com";

type RequestBody = BodyInit | Record<string, unknown> | unknown[] | null | undefined;
type ApiRequestInit = Omit<RequestInit, "body"> & { body?: RequestBody };

function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_BACKEND_URL ??
    (import.meta.env.MODE === "production" ? PRODUCTION_API_BASE_URL : DEFAULT_API_BASE_URL)
  ).replace(/\/$/, "");
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
    return response.json();
  }

  return response.text();
}

function errorMessageFromPayload(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const detail = record.detail ?? record.message ?? record.error;

    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map(String).join(", ");
  }

  if (typeof payload === "string" && payload.trim()) return payload;
  return fallback;
}

async function request<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { body, ...requestInit } = init;
  const response = await fetch(buildUrl(path), {
    ...requestInit,
    body: serializeBody(body),
    headers: buildHeaders(body, init.headers),
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      errorMessageFromPayload(payload, `Request failed with status ${response.status}`),
    );
  }

  return payload as T;
}

export function get<T>(path: string, init?: RequestInit) {
  return request<T>(path, { ...init, method: "GET" });
}

export function post<T>(path: string, body?: RequestBody, init?: RequestInit) {
  return request<T>(path, { ...init, method: "POST", body });
}

export function put<T>(path: string, body?: RequestBody, init?: RequestInit) {
  return request<T>(path, { ...init, method: "PUT", body });
}

export function patch<T>(path: string, body?: RequestBody, init?: RequestInit) {
  return request<T>(path, { ...init, method: "PATCH", body });
}

export function del<T>(path: string, init?: RequestInit) {
  return request<T>(path, { ...init, method: "DELETE" });
}
