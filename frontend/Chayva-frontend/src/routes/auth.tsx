import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Brain } from "lucide-react";
import { toast } from "sonner";
import { post } from "@/lib/api";
import {
  type AuthResponse,
  clearToken,
  extractAccessToken,
  getCurrentUser,
  setToken,
} from "@/lib/auth";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});
function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">(
    initialMode ?? "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const user = await getCurrentUser();
      if (user) {
        navigate({ to: "/dashboard" });
      }
    }
    checkSession();
  }, [navigate]);

   useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is missing.");
      return;
    }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const google = (window as any).google;
        if (google?.accounts?.id) {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
          });
        }
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    
  }, []);

    async function handleCredentialResponse(
    response: google.accounts.id.CredentialResponse
    ){
    setLoading(true);
    try {
      const res = await post<AuthResponse>("/auth/google", {
        credential: response.credential,
      });
      await completeAuthentication(res, "Signed in with Google successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Google sign-in failed."
      );
    } finally {
      setLoading(false);
    }
  }

   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await post<AuthResponse>("/auth/signup", {
          email,
          password,
        });
        await completeAuthentication(res, "Account created successfully!");
      } else {
        const res = await post<AuthResponse>("/auth/signin", {
          email,
          password,
        });
        await completeAuthentication(res, "Signed in successfully!");
      }
    } catch (err) {
      clearToken();
      toast.error(
        err instanceof Error
          ? err.message
          : "Authentication failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function completeAuthentication(
    response: AuthResponse,
    successMessage: string
  ) {
    const token = extractAccessToken(response);
    setToken(token);
    const user = await getCurrentUser();
    if (!user) {
      clearToken();
      throw new Error("Could not verify your session. Please sign in again.");
    }
    toast.success(successMessage);
    navigate({ to: "/dashboard", replace: true });
  }
function handleGoogle() {
  const google = (window as any).google;

  if (!google?.accounts?.id) {
    toast.error("Google Sign-In is not initialized.");
    return;
  }

  google.accounts.id.prompt();
}
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold">
            Chayva
          </span>
        </div>
        <h1 className="text-2xl font-semibold">
          {mode === "signup"
            ? "Create your account"
            : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Start understanding your money in seconds."
            : "Sign in to continue."}
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 disabled:opacity-60"
          >
          
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.5 14.7 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12S6.8 21.5 12 21.5c6.9 0 9.4-4.9 9.4-8.9 0-.6-.1-1.1-.2-1.6H12z"
              />
            </svg>
            Continue with Google
          </button>
<div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">
              Email
            </label>
             <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Password
            </label>
<input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="At least 6 characters"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
           <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-primary px-4 py-2.5 font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60"
          >
           {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create account"
              : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup"
            ? "Already have an account?"
            : "New to Chayva?"}{" "}
          <button
            type="button"
            onClick={() =>
              setMode(
                mode === "signup"
                  ? "signin"
                  : "signup"
              )
            }
            className="font-medium text-foreground underline underline-offset-4"
          >
            {mode === "signup"
              ? "Sign in"
              : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
export default AuthPage;