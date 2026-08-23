import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Save, UserRound, Clock, Target, MessageSquare, AlertCircle } from "lucide-react";
import { PageTransition, LoadingSkeleton } from "@/lib/ui-helpers";
import { getProfile, updateProfile, type UserProfilePayload } from "@/lib/profile";

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
  const [selfReportedTriggers, setSelfReportedTriggers] = useState<string[]>([]);
  const [selfReportedContexts, setSelfReportedContexts] = useState<string[]>([]);

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
        setSelfReportedTriggers(data.self_reported_spending_triggers ?? []);
        setSelfReportedContexts(data.self_reported_spending_contexts ?? []);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unable to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await updateProfile(profile);
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
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-7">

        {/* ================================================================= */}
        {/* HEADER                                                             */}
        {/* ================================================================= */}
        <header>
          <p className="chayva-eyebrow">Context</p>
          <h1 className="chayva-headline mt-1 text-3xl text-foreground">Your Context</h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-lg">
            Help Chayva understand you better. This context shapes how it interprets your spending — it's not a survey, it's a conversation.
          </p>
        </header>

        {/* Loading */}
        {loading ? (
          <div className="glass rounded-2xl p-6 space-y-4">
            <LoadingSkeleton lines={4} />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">

            {/* ============================================================= */}
            {/* SECTION: About You                                             */}
            {/* ============================================================= */}
            <ProfileSection
              icon={UserRound}
              title="About You"
              delay={0}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    id="profile-name"
                    value={profile.display_name ?? ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, display_name: e.target.value }))
                    }
                    maxLength={60}
                    className="profile-input"
                    placeholder="How should Chayva address you?"
                  />
                </Field>
                <Field label="Life stage">
                  <select
                    id="profile-life-stage"
                    value={profile.life_stage ?? ""}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        life_stage: e.target.value
                          ? (e.target.value as UserProfilePayload["life_stage"])
                          : null,
                      }))
                    }
                    className="profile-input"
                  >
                    <option value="">Not specified</option>
                    <option value="student">College student</option>
                    <option value="working">Working professional</option>
                    <option value="student_working">Student + working</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="homemaker">Homemaker</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>
            </ProfileSection>

            {/* ============================================================= */}
            {/* SECTION: Life Rhythm                                           */}
            {/* ============================================================= */}
            <ProfileSection
              icon={Clock}
              title="Life Rhythm"
              subtitle="Context about your days helps Chayva interpret when and why you spend."
              delay={0.05}
            >
              <Field label="College or work context">
                <textarea
                  id="profile-work-context"
                  value={profile.college_or_work_context ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, college_or_work_context: e.target.value }))
                  }
                  maxLength={160}
                  rows={2}
                  className="profile-input resize-none"
                  placeholder="e.g. Engineering student, College 9am–5pm, remote worker…"
                />
              </Field>
              <Field label="Typical daily schedule">
                <textarea
                  id="profile-schedule"
                  value={profile.typical_daily_schedule ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, typical_daily_schedule: e.target.value }))
                  }
                  maxLength={240}
                  rows={2}
                  className="profile-input resize-none"
                  placeholder="e.g. College 9am–4pm, Active evenings…"
                />
              </Field>
            </ProfileSection>

            {/* ============================================================= */}
            {/* SECTION: Goals                                                 */}
            {/* ============================================================= */}
            <ProfileSection
              icon={Target}
              title="Goals"
              subtitle="What you're working toward — comma-separated."
              delay={0.10}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Spending priorities">
                  <input
                    id="profile-priorities"
                    value={(profile.spending_priorities ?? []).join(", ")}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        spending_priorities: splitList(e.target.value),
                      }))
                    }
                    className="profile-input"
                    placeholder="e.g. Food, experiences, health"
                  />
                </Field>
                <Field label="Financial goals">
                  <input
                    id="profile-goals"
                    value={(profile.financial_goals ?? []).join(", ")}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        financial_goals: splitList(e.target.value),
                      }))
                    }
                    className="profile-input"
                    placeholder="e.g. Save more, reduce impulse spending"
                  />
                </Field>
              </div>
            </ProfileSection>

            {/* ============================================================= */}
            {/* SECTION: How Chayva Talks to You                               */}
            {/* ============================================================= */}
            <ProfileSection
              icon={MessageSquare}
              title="How Chayva Talks to You"
              delay={0.15}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="AI tone">
                  <select
                    id="profile-ai-tone"
                    value={profile.preferred_ai_tone ?? "gentle"}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        preferred_ai_tone: e.target.value as UserProfilePayload["preferred_ai_tone"],
                      }))
                    }
                    className="profile-input"
                  >
                    <option value="gentle">Gentle</option>
                    <option value="direct">Direct</option>
                    <option value="encouraging">Encouraging</option>
                    <option value="analytical">Analytical</option>
                    <option value="friendly">Friendly</option>
                  </select>
                </Field>
                <Field label="Preferred language">
                  <select
                    id="profile-language"
                    value={profile.preferred_language ?? "english"}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        preferred_language: e.target.value as UserProfilePayload["preferred_language"],
                      }))
                    }
                    className="profile-input"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </Field>
              </div>
            </ProfileSection>

            {/* ============================================================= */}
            {/* SECTION: What You've Told Chayva                              */}
            {/* CRITICAL: explicitly labeled as user-reported, not proven fact */}
            {/* ============================================================= */}
            {(selfReportedTriggers.length > 0 || selfReportedContexts.length > 0) && (
              <ProfileSection
                icon={AlertCircle}
                title="What You've Told Chayva"
                delay={0.20}
              >
                <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3 mb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground/70">Note:</span> This is what you reported during onboarding — not what Chayva has observed from your actual expenses. Observed patterns may differ and will take precedence in AI analysis.
                  </p>
                </div>

                {selfReportedTriggers.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em] mb-2">
                      Self-reported triggers
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selfReportedTriggers.map((t) => (
                        <span key={t} className="behavior-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selfReportedContexts.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em] mb-2">
                      Self-reported contexts
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selfReportedContexts.map((c) => (
                        <span key={c} className="behavior-tag">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </ProfileSection>
            )}

            {/* ============================================================= */}
            {/* FEEDBACK + SAVE                                                */}
            {/* ============================================================= */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {message && (
              <p className="text-sm text-primary">{message}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60 transition hover:-translate-y-0.5"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save context"}
            </button>
          </form>
        )}
      </div>
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// ProfileSection — grouped section with icon
// ---------------------------------------------------------------------------

function ProfileSection({
  icon: Icon,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.26 }}
      className="glass rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2.5 pb-1 border-b border-foreground/8">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-sm)]">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Field — form field wrapper
// ---------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}
