import { get, patch, put } from "./api";

export type UserProfile = {
  user_id: string;
  display_name?: string | null;
  life_stage?:
    "student" | "working" | "student_working" | "freelancer" | "homemaker" | "other" | null;
  college_or_work_context?: string | null;
  preferred_language?: "english" | "hindi" | "hinglish" | null;
  typical_daily_schedule?: string | null;
  spending_priorities: string[];
  financial_goals: string[];
  preferred_ai_tone?: "gentle" | "direct" | "encouraging" | "analytical" | "friendly" | null;
  self_reported_spending_triggers: string[];
  self_reported_spending_contexts: string[];
  onboarding_completed: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserProfilePayload = Partial<
  Omit<UserProfile, "user_id" | "created_at" | "updated_at">
>;

export function getProfile() {
  return get<UserProfile>("/profile");
}

export function saveProfile(payload: UserProfilePayload) {
  return put<UserProfile>("/profile", payload);
}

export function updateProfile(payload: UserProfilePayload) {
  return patch<UserProfile>("/profile", payload);
}
