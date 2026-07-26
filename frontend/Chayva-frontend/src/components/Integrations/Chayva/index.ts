import { post } from "@/lib/api";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
  credential?: string;
};

export const auth = {
  async signInWithOAuth(
    provider: "google" | "apple" | "microsoft",
    opts?: SignInOptions
  ) {
    if (provider !== "google" || !opts?.credential) {
      return { error: new Error("Google credential is required.") };
    }

    try {
      const data = await post("/auth/google", {
        credential: opts.credential,
      });

      return { data };
    } catch (error) {
      return { error };
    }
  },
};
