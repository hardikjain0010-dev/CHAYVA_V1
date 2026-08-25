import { get } from "./api";

const TOKEN_KEY = "caayva_access_token";

export type User = {
  uid: string;
  email: string;
  provider?: string;
  display_name?: string | null;
  photo_url?: string | null;
  email_verified?: boolean;
};

export type AuthResponse = {
  access_token?: string;
  token_type?: string;
  user?: User;
  token?: string;
};

export function extractAccessToken(response: AuthResponse): string {
  const token = response.access_token ?? response.token;

  if (!token) {
    throw new Error("Authentication response did not include an access token.");
  }

  return token;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;

  try {
    return await get<User>("/auth/me");
  } catch (error) {
    clearToken();
    return null;
  }
}
