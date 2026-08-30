import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { z } from "zod";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { ArthyneLogo } from "@/components/ArthyneLogo";
import { BRAND_NAME } from "@/lib/brand";
import { post, ApiError } from "@/lib/api";
import { type AuthResponse, clearToken, extractAccessToken, setToken } from "@/lib/auth";
import { useUser } from "@/lib/user-context";

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
  const { user, refreshUser } = useUser();

  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Sync mode with URL search parameters
  useEffect(() => {
    if (initialMode && initialMode !== mode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Only auto-redirect on mount if user ALREADY had an active session before submitting
  const isSubmittingRef = useRef(false);
  useEffect(() => {
    if (user && initialMode !== "signup" && !isSubmittingRef.current && !loading) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate, user, initialMode, loading]);

  function formatAuthError(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        return "Invalid email or password. Please check your credentials.";
      }
      if (err.status === 409) {
        return "This email is already registered. Please sign in instead.";
      }
      if (err.status === 403) {
        return "Access denied. Please check your account permissions.";
      }
      if (err.status === 422) {
        return "Please provide a valid email and password.";
      }
      if (err.status === 429) {
        return "Too many attempts. Please wait a moment before trying again.";
      }
      if (err.status && err.status >= 500) {
        return "Server error occurred. Please try again shortly.";
      }
      if (err.isTimeout) {
        return "Server is waking up from sleep. Please try again in a few seconds.";
      }
      if (err.isNetworkError) {
        return err.message;
      }
      return err.message || fallback;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return fallback;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (mode === "signup") {
      // Validate password strength
      const validation = validatePassword(password);
      if (!validation.isValid) {
        toast.error(
          "Password must be at least 8 characters with uppercase, lowercase, and a number.",
        );
        return;
      }
      // Validate password confirmation
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await post<AuthResponse>("/auth/signup", {
          email: normalizedEmail,
          password,
        });
        await completeAuthentication(res, "Account created successfully!");
      } else {
        const res = await post<AuthResponse>("/auth/signin", {
          email: normalizedEmail,
          password,
        });
        await completeAuthentication(res, "Signed in successfully!");
      }
    } catch (err) {
      isSubmittingRef.current = false;
      clearToken();
      toast.error(
        formatAuthError(err, "Authentication failed. Please check your connection or credentials."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function completeAuthentication(response: AuthResponse, successMessage: string) {
    const token = extractAccessToken(response);
    setToken(token);
    const user = await refreshUser();
    if (!user) {
      clearToken();
      isSubmittingRef.current = false;
      throw new Error("Could not verify your session. Please sign in again.");
    }
    toast.success(successMessage);

    // Check if user has completed onboarding
    const { getProfile } = await import("@/lib/profile");
    try {
      const profile = await getProfile();
      if (!profile.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
    } catch (error) {
      // If profile fetch fails, proceed to dashboard
      console.warn("Could not fetch profile, proceeding to dashboard", error);
    }

    navigate({ to: "/dashboard", replace: true });
  }

  function validatePassword(password: string): {
    isValid: boolean;
    strength: "weak" | "fair" | "strong";
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
  } {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    const metCount = Object.values(requirements).filter(Boolean).length;

    let strength: "weak" | "fair" | "strong" = "weak";
    if (metCount >= 4) strength = "strong";
    else if (metCount >= 2) strength = "fair";

    const isValid = metCount >= 3 && requirements.length;

    return { isValid, strength, requirements };
  }

  function RequirementItem({ met, label }: { met: boolean; label: string }) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {met ? (
          <Check className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <X className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
        <span className={met ? "text-foreground" : "text-muted-foreground/70"}>{label}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <ArthyneLogo className="h-9 w-9" />
          <span className="text-xl font-bold tracking-tight">{BRAND_NAME}</span>
        </div>
        <h1 className="text-2xl font-semibold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Start understanding your money in seconds."
            : "Sign in to continue."}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {mode === "signup" && (
            <div>
              <label className="text-sm text-muted-foreground">Confirm password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-primary px-4 py-2.5 font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : `New to ${BRAND_NAME}?`}{" "}
          <button
            type="button"
            onClick={() => {
              const nextMode = mode === "signup" ? "signin" : "signup";
              setMode(nextMode);
              navigate({ to: "/auth", search: { mode: nextMode } });
            }}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
export default AuthPage;
