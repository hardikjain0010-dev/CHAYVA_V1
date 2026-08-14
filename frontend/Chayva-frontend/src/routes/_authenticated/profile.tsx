import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Save, UserRound } from "lucide-react";
import { PageTransition } from "@/lib/ui-helpers";
import { getProfile, saveProfile, type UserProfilePayload } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const EMPTY_PROFILE: UserProfilePayload = {
  display_name: "",
  life_stage: null,
  college_or_work_context: "",
  preferred_language: "english",
  typical_daily_schedule: "",
  spending_priorities: [],
  financial_goals: [],
  preferred_ai_tone: "gentle",
};

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfilePayload>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getProfile();
        if (cancelled) return;
        setProfile({
          display_name: data.display_name ?? "",
          life_stage: data.life_stage ?? null,
          college_or_work_context: data.college_or_work_context ?? "",
          preferred_language: data.preferred_language ?? "english",
          typical_daily_schedule: data.typical_daily_schedule ?? "",
          spending_priorities: data.spending_priorities ?? [],
          financial_goals: data.financial_goals ?? [],
          preferred_ai_tone: data.preferred_ai_tone ?? "gentle",
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await saveProfile(profile);
      setProfile({
        display_name: saved.display_name ?? "",
        life_stage: saved.life_stage ?? null,
        college_or_work_context: saved.college_or_work_context ?? "",
        preferred_language: saved.preferred_language ?? "english",
        typical_daily_schedule: saved.typical_daily_schedule ?? "",
        spending_priorities: saved.spending_priorities ?? [],
        financial_goals: saved.financial_goals ?? [],
        preferred_ai_tone: saved.preferred_ai_tone ?? "gentle",
      });
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Personal context</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl">Profile</h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            Optional details Chayva can use when they are relevant to your spending evidence.
          </p>
        </header>

        <form onSubmit={onSubmit} className="glass rounded-2xl p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 w-1/2 animate-pulse rounded bg-foreground/10" />
              <div className="h-32 animate-pulse rounded bg-foreground/10" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Your context</h2>
                  <p className="text-sm text-muted-foreground">Keep this short and factual.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <input
                    value={profile.display_name ?? ""}
                    onChange={(event) => setProfile((prev) => ({ ...prev, display_name: event.target.value }))}
                    maxLength={60}
                    className="profile-input"
                  />
                </Field>
                <Field label="Life stage">
                  <select
                    value={profile.life_stage ?? ""}
                    onChange={(event) => setProfile((prev) => ({ ...prev, life_stage: event.target.value ? (event.target.value as UserProfilePayload["life_stage"]) : null }))}
                    className="profile-input"
                  >
                    <option value="">Not specified</option>
                    <option value="student">Student</option>
                    <option value="working">Working</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="homemaker">Homemaker</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Preferred language">
                  <select
                    value={profile.preferred_language ?? "english"}
                    onChange={(event) => setProfile((prev) => ({ ...prev, preferred_language: event.target.value as UserProfilePayload["preferred_language"] }))}
                    className="profile-input"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </Field>
                <Field label="AI tone">
                  <select
                    value={profile.preferred_ai_tone ?? "gentle"}
                    onChange={(event) => setProfile((prev) => ({ ...prev, preferred_ai_tone: event.target.value as UserProfilePayload["preferred_ai_tone"] }))}
                    className="profile-input"
                  >
                    <option value="gentle">Gentle</option>
                    <option value="direct">Direct</option>
                    <option value="encouraging">Encouraging</option>
                    <option value="analytical">Analytical</option>
                  </select>
                </Field>
              </div>

              <Field label="College or work context">
                <textarea
                  value={profile.college_or_work_context ?? ""}
                  onChange={(event) => setProfile((prev) => ({ ...prev, college_or_work_context: event.target.value }))}
                  maxLength={160}
                  rows={3}
                  className="profile-input"
                />
              </Field>
              <Field label="Typical daily schedule">
                <textarea
                  value={profile.typical_daily_schedule ?? ""}
                  onChange={(event) => setProfile((prev) => ({ ...prev, typical_daily_schedule: event.target.value }))}
                  maxLength={240}
                  rows={3}
                  className="profile-input"
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Spending priorities">
                  <input
                    value={(profile.spending_priorities ?? []).join(", ")}
                    onChange={(event) => setProfile((prev) => ({ ...prev, spending_priorities: splitList(event.target.value) }))}
                    className="profile-input"
                  />
                </Field>
                <Field label="Financial goals">
                  <input
                    value={(profile.financial_goals ?? []).join(", ")}
                    onChange={(event) => setProfile((prev) => ({ ...prev, financial_goals: splitList(event.target.value) }))}
                    className="profile-input"
                  />
                </Field>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {message ? <p className="text-sm text-primary">{message}</p> : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
          )}
        </form>
      </div>
    </PageTransition>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}
