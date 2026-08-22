import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { z } from "zod";
import { Brain, Check, X } from "lucide-react";
import { toast } from "sonner";
import { post } from "@/lib/api";
import {
  type AuthResponse,
  clearToken,
  extractAccessToken,
  setToken,
} from "@/lib/auth";
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

  const [mode, setMode] = useState<"signin" | "signup">(
    initialMode ?? "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate, user]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is missing.");
      return;
    }

    const initGoogle = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = "";
          google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            width: "384",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "center",
          });
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGoogle();
      return;
    }

    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      existingScript.addEventListener("load", initGoogle);
      return () => {
        existingScript.removeEventListener("load", initGoogle);
      };
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
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
      const errorMessage = err instanceof Error ? err.message : "Google sign-in failed.";
      
      // Provide user-friendly error messages
      if (errorMessage.includes("Google token missing email")) {
        toast.error("Google account information is incomplete. Please try again.");
      } else if (errorMessage.includes("Invalid Google token")) {
        toast.error("Google authentication failed. Please try again.");
      } else if (errorMessage.includes("Google Sign-In is not configured")) {
        toast.error("Google authentication is not available right now. Please use email/password.");
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (mode === "signup") {
      // Validate password strength
      const validation = validatePassword(password);
      if (!validation.isValid) {
        toast.error("Password must be at least 8 characters with uppercase, lowercase, and a number.");
        return;
      }
      // Validate password confirmation
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    }
    
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
      const errorMessage = err instanceof Error ? err.message : "Authentication failed.";
      
      // Provide user-friendly error messages
      if (errorMessage.includes("already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else if (errorMessage.includes("Invalid email or password")) {
        toast.error("Invalid email or password. Please try again.");
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error(errorMessage);
      }
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
    const user = await refreshUser();
    if (!user) {
      clearToken();
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
      console.warn("Could not fetch profile, proceeding to dashboard");
    }
    
    navigate({ to: "/dashboard", replace: true });
  }
function handleGoogle() {
  const google = (window as any).google;

  if (!google?.accounts?.id) {
    toast.error("Google Sign-In is loading. Please try again in a moment.");
    return;
  }

  const innerBtn = googleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
  if (innerBtn) {
    innerBtn.click();
    return;
  }

  google.accounts.id.prompt();
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
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
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
      <span className={met ? "text-foreground" : "text-muted-foreground/70"}>
        {label}
      </span>
    </div>
  );
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
          <div ref={googleButtonRef} className="w-full flex justify-center min-h-[40px]">
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
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="8+ characters"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {mode === "signup" && (
            <div>
              <label className="text-sm text-muted-foreground">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
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
