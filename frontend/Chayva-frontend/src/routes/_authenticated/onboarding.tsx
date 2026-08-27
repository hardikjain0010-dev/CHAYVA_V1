import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { updateProfile, type UserProfilePayload } from "@/lib/profile";
import { useUser } from "@/lib/user-context";
import { CaayvaLogo } from "@/components/CaayvaLogo";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

const SKIP_KEY = "caayva_onboarding_skip";

const lifeOptions = [
  { value: "student", label: "College student" },
  { value: "working", label: "Working professional" },
  { value: "student_working", label: "Student + working" },
  { value: "freelancer", label: "Building something / freelancing" },
  { value: "other", label: "Other" },
] as const;

const scheduleOptions = [
  {
    value: "mostly_college",
    label: "Mostly college",
    context: "Mostly college",
    schedule: "Most days are centered around college.",
  },
  {
    value: "mostly_work",
    label: "Mostly work",
    context: "Mostly work",
    schedule: "Most days are centered around work.",
  },
  {
    value: "college_commute",
    label: "College + commute",
    context: "College with commute",
    schedule: "College days usually include a commute.",
  },
  {
    value: "work_commute",
    label: "Work + commute",
    context: "Work with commute",
    schedule: "Work days usually include a commute.",
  },
  {
    value: "mostly_home",
    label: "Mostly at home",
    context: "Mostly at home",
    schedule: "Most days are spent at home.",
  },
  {
    value: "changes",
    label: "My schedule changes a lot",
    context: "Changing schedule",
    schedule: "Daily schedule changes often.",
  },
] as const;

const triggerOptions = [
  { value: "stress", label: "Stress" },
  { value: "boredom", label: "Boredom" },
  { value: "social_situations", label: "Social situations" },
  { value: "seeing_something_i_want", label: "Seeing something I want" },
  { value: "treating_or_rewarding_myself", label: "Treating/rewarding myself" },
  { value: "convenience", label: "Convenience" },
  { value: "unknown", label: "I don't really know" },
  { value: "other", label: "Something else" },
] as const;

const contextOptions = [
  { value: "morning", label: "Morning" },
  { value: "during_college_or_work", label: "During college/work" },
  { value: "after_college_or_work", label: "After college/work" },
  { value: "evening", label: "Evening" },
  { value: "late_night", label: "Late night" },
  { value: "weekends", label: "Weekends" },
  { value: "with_friends", label: "When I'm with friends" },
  { value: "online_scrolling", label: "Online while scrolling" },
  { value: "it_depends", label: "It depends" },
] as const;

const priorityOptions = [
  "Food",
  "Travel / petrol",
  "Shopping",
  "Entertainment",
  "Subscriptions",
  "Snacks / chai",
  "Social activities",
  "Education",
  "Rent / household",
  "Other",
];

const goalOptions = [
  "Why I make impulse purchases",
  "My emotional spending patterns",
  "Where my money usually goes",
  "My recurring spending habits",
  "Become more intentional with spending",
  "I'm still figuring it out",
];

const toneOptions = [
  { value: "gentle", label: "Gentle", description: "Calm, supportive and reflective." },
  {
    value: "direct",
    label: "Direct",
    description: "Honest and straightforward, without being judgmental.",
  },
  {
    value: "analytical",
    label: "Analytical",
    description: "Give me more reasoning behind my patterns.",
  },
  { value: "friendly", label: "Friendly", description: "Talk to me like a thoughtful friend." },
] as const;

const languageOptions = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "hinglish", label: "Hinglish" },
] as const;

type Answers = {
  life_stage: UserProfilePayload["life_stage"];
  schedule: string;
  schedule_note: string;
  triggers: string[];
  contexts: string[];
  priorities: string[];
  financial_goal: string;
  tone: UserProfilePayload["preferred_ai_tone"];
  language: UserProfilePayload["preferred_language"];
};

const initialAnswers: Answers = {
  life_stage: null,
  schedule: "",
  schedule_note: "",
  triggers: [],
  contexts: [],
  priorities: [],
  financial_goal: "",
  tone: null,
  language: null,
};

function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [savedProfile, setSavedProfile] = useState<UserProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const TOTAL_QUESTIONS = 8;
  const progress = Math.round((Math.min(step, TOTAL_QUESTIONS) / TOTAL_QUESTIONS) * 100);
  const canContinue = useMemo(() => isStepValid(step, answers), [answers, step]);

  async function submit() {
    if (!isAllValid(answers)) {
      setError("Please answer the required questions before continuing.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload(answers);
      const saved = await updateProfile(payload);
      setSavedProfile(saved);
      if (user?.uid) {
        window.sessionStorage.removeItem(`${SKIP_KEY}:${user.uid}`);
      }
      toast.success("Your Caayva profile is ready.");
      setStep(TOTAL_QUESTIONS + 1);
    } catch {
      setError(
        "Caayva could not save your profile right now. Your answers are still here, so you can retry.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function skipForNow() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ onboarding_completed: false });
      if (user?.uid) {
        window.sessionStorage.setItem(`${SKIP_KEY}:${user.uid}`, "true");
      }
      navigate({ to: "/dashboard", replace: true });
    } catch {
      setError("Caayva could not update your profile state right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (step > TOTAL_QUESTIONS) {
    return (
      <OnboardingFrame>
        <div className="glass rounded-2xl p-7 shadow-[var(--glass-shadow-strong)] md:p-9 text-center">
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="caayva-eyebrow mb-3">Your profile is ready</p>
          <h1 className="caayva-headline text-2xl text-foreground md:text-3xl">
            Caayva now knows a little about you.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-sm mx-auto">
            {completionSummary(savedProfile ?? buildPayload(answers))}
          </p>
          <p className="mt-4 text-sm font-medium text-foreground/80">
            Now let's see what your spending actually tells us.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard", replace: true })}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Enter Caayva
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </OnboardingFrame>
    );
  }

  return (
    <OnboardingFrame>
      <div className="mx-auto w-full max-w-xl">
        {step === 0 ? (
          <Welcome
            onBegin={() => {
              setError(null);
              setStep(1);
            }}
            onSkip={skipForNow}
            saving={saving}
            error={error}
          />
        ) : (
          <div className="glass rounded-2xl p-5 shadow-[var(--glass-shadow-strong)] md:p-7">
            <div className="mb-7">
              <div className="mb-3 flex items-center justify-between">
                <p className="caayva-eyebrow">
                  Step {step} of {TOTAL_QUESTIONS}
                </p>
                <span className="text-xs font-semibold text-primary">{progress}%</span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-foreground/8"
                aria-label={`${progress}% complete`}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <Question step={step} answers={answers} setAnswers={setAnswers} />

            {error ? (
              <p className="mt-5 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-7 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep((current) => Math.max(0, current - 1));
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!canContinue || saving}
                onClick={() => {
                  setError(null);
                  if (step === TOTAL_QUESTIONS) {
                    submit();
                  } else {
                    setStep((current) => current + 1);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {step === TOTAL_QUESTIONS ? "Finish" : "Continue"}
                {!saving ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </div>
          </div>
        )}
      </div>
    </OnboardingFrame>
  );
}

function OnboardingFrame({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-4 py-10 md:px-6"
      style={{ background: "var(--gradient-app)", backgroundAttachment: "fixed" }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 -left-20 h-[480px] w-[480px] rounded-full bg-primary/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-accent/8 blur-[100px]"
      />
      <div className="relative z-10 w-full max-w-xl">
        {/* Brand mark */}
        <div className="mb-8 flex items-center gap-2.5 justify-center">
          <CaayvaLogo className="h-8 w-8" />
          <span className="text-base font-bold tracking-tight">Caayva</span>
        </div>
        {children}
      </div>
    </main>
  );
}

function Welcome({
  onBegin,
  onSkip,
  saving,
  error,
}: {
  onBegin: () => void;
  onSkip: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <section className="glass rounded-2xl p-7 shadow-[var(--glass-shadow-strong)] md:p-9">
      <div className="mb-6">
        <p className="caayva-eyebrow mb-3">The beginning of a relationship</p>
        <h1 className="caayva-headline text-3xl text-foreground">
          Let's make Caayva understand you.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-sm">
          A few questions help Caayva recognize your spending patterns more personally. There are no
          right or wrong answers — only your context.
        </p>
      </div>
      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBegin}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Let's begin
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onSkip}
          className="rounded-xl border border-foreground/12 px-5 py-3.5 text-sm font-medium text-muted-foreground transition hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </section>
  );
}

function Question({
  step,
  answers,
  setAnswers,
}: {
  step: number;
  answers: Answers;
  setAnswers: React.Dispatch<React.SetStateAction<Answers>>;
}) {
  if (step === 1) {
    return (
      <SingleQuestion title="What best describes you right now?">
        <OptionGrid>
          {lifeOptions.map((option) => (
            <Choice
              key={option.value}
              selected={answers.life_stage === option.value}
              onClick={() => setAnswers((prev) => ({ ...prev, life_stage: option.value }))}
            >
              {option.label}
            </Choice>
          ))}
        </OptionGrid>
      </SingleQuestion>
    );
  }

  if (step === 2) {
    return (
      <SingleQuestion title="What does a typical day look like for you?">
        <OptionGrid>
          {scheduleOptions.map((option) => (
            <Choice
              key={option.value}
              selected={answers.schedule === option.value}
              onClick={() => setAnswers((prev) => ({ ...prev, schedule: option.value }))}
            >
              {option.label}
            </Choice>
          ))}
        </OptionGrid>
        <label className="mt-5 block">
          <span className="text-sm text-muted-foreground">Tell Caayva a little more</span>
          <textarea
            value={answers.schedule_note}
            maxLength={120}
            rows={3}
            onChange={(event) =>
              setAnswers((prev) => ({ ...prev, schedule_note: event.target.value }))
            }
            className="profile-input mt-2"
          />
        </label>
      </SingleQuestion>
    );
  }

  if (step === 3) {
    return (
      <MultiQuestion title="What usually makes you spend when you didn't plan to?">
        {triggerOptions.map((option) => (
          <Choice
            key={option.value}
            selected={answers.triggers.includes(option.value)}
            onClick={() =>
              setAnswers((prev) => ({
                ...prev,
                triggers: toggleValue(prev.triggers, option.value, 4),
              }))
            }
          >
            {option.label}
          </Choice>
        ))}
      </MultiQuestion>
    );
  }

  if (step === 4) {
    return (
      <MultiQuestion title="When are you most likely to spend unexpectedly?">
        {contextOptions.map((option) => (
          <Choice
            key={option.value}
            selected={answers.contexts.includes(option.value)}
            onClick={() =>
              setAnswers((prev) => ({
                ...prev,
                contexts: toggleValue(prev.contexts, option.value, 5),
              }))
            }
          >
            {option.label}
          </Choice>
        ))}
      </MultiQuestion>
    );
  }

  if (step === 5) {
    return (
      <MultiQuestion title="Which areas take most of your everyday spending?">
        {priorityOptions.map((option) => (
          <Choice
            key={option}
            selected={answers.priorities.includes(option)}
            onClick={() =>
              setAnswers((prev) => ({
                ...prev,
                priorities: toggleValue(prev.priorities, option, 5),
              }))
            }
          >
            {option}
          </Choice>
        ))}
      </MultiQuestion>
    );
  }

  if (step === 6) {
    return (
      <SingleQuestion title="What would you most like Caayva to help you understand?">
        <OptionGrid>
          {goalOptions.map((option) => (
            <Choice
              key={option}
              selected={answers.financial_goal === option}
              onClick={() => setAnswers((prev) => ({ ...prev, financial_goal: option }))}
            >
              {option}
            </Choice>
          ))}
        </OptionGrid>
      </SingleQuestion>
    );
  }

  if (step === 7) {
    return (
      <SingleQuestion title="How should Caayva talk to you?">
        <div className="grid gap-3">
          {toneOptions.map((option) => (
            <Choice
              key={option.value}
              selected={answers.tone === option.value}
              onClick={() => setAnswers((prev) => ({ ...prev, tone: option.value }))}
            >
              <span className="font-medium">{option.label}</span>
              <span className="block text-sm text-muted-foreground">{option.description}</span>
            </Choice>
          ))}
        </div>
      </SingleQuestion>
    );
  }

  return (
    <SingleQuestion title="How would you like Caayva to talk?">
      <OptionGrid>
        {languageOptions.map((option) => (
          <Choice
            key={option.value}
            selected={answers.language === option.value}
            onClick={() => setAnswers((prev) => ({ ...prev, language: option.value }))}
          >
            {option.label}
          </Choice>
        ))}
      </OptionGrid>
    </SingleQuestion>
  );
}

function SingleQuestion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="caayva-headline text-xl text-foreground md:text-2xl">{title}</h1>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MultiQuestion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SingleQuestion title={title}>
      <p className="mb-4 text-sm text-muted-foreground">
        These are treated as self-reported context, not proof.
      </p>
      <OptionGrid>{children}</OptionGrid>
    </SingleQuestion>
  );
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-12 rounded-xl border px-4 py-3.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-ring ${
        selected
          ? "border-primary/40 bg-primary/10 text-foreground shadow-[var(--shadow-glow-sm)]"
          : "border-foreground/10 bg-background/30 text-muted-foreground hover:border-primary/30 hover:bg-background/50 hover:text-foreground"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span>{children}</span>
        {selected ? (
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gradient-primary mt-0.5">
            <Check className="h-2.5 w-2.5 text-primary-foreground" />
          </span>
        ) : null}
      </span>
    </button>
  );
}

function toggleValue(values: string[], value: string, maxItems: number) {
  if (values.includes(value)) {
    return values.filter((item) => item !== value);
  }
  if (values.length >= maxItems) {
    return values;
  }
  return [...values, value];
}

function isStepValid(step: number, answers: Answers) {
  if (step === 0) return true;
  if (step === 1) return Boolean(answers.life_stage);
  if (step === 2) return Boolean(answers.schedule);
  if (step === 3) return answers.triggers.length > 0;
  if (step === 4) return answers.contexts.length > 0;
  if (step === 5) return answers.priorities.length > 0;
  if (step === 6) return Boolean(answers.financial_goal);
  if (step === 7) return Boolean(answers.tone);
  return Boolean(answers.language);
}

function isAllValid(answers: Answers) {
  return Array.from({ length: 8 }, (_, index) => index + 1).every((step) =>
    isStepValid(step, answers),
  );
}

function buildPayload(answers: Answers): UserProfilePayload {
  const schedule = scheduleOptions.find((option) => option.value === answers.schedule);
  const note = answers.schedule_note.trim();
  return {
    life_stage: answers.life_stage,
    college_or_work_context: schedule?.context ?? null,
    typical_daily_schedule: note
      ? `${schedule?.schedule ?? ""} ${note}`.trim()
      : (schedule?.schedule ?? null),
    self_reported_spending_triggers: answers.triggers,
    self_reported_spending_contexts: answers.contexts,
    spending_priorities: answers.priorities,
    financial_goals: answers.financial_goal ? [answers.financial_goal] : [],
    preferred_ai_tone: answers.tone,
    preferred_language: answers.language,
    onboarding_completed: true,
  };
}

function completionSummary(profile: UserProfilePayload) {
  const parts = [];
  const life = lifeOptions.find((option) => option.value === profile.life_stage)?.label;
  const triggers = labelValues(profile.self_reported_spending_triggers ?? [], triggerOptions);
  const goals = profile.financial_goals ?? [];

  if (life) parts.push(`you're ${article(life)} ${life.toLowerCase()}`);
  if (triggers.length)
    parts.push(`that ${triggers.join(" and ")} can sometimes influence your spending`);
  if (goals.length) parts.push(`that you want to understand ${goals[0].toLowerCase()}`);

  return parts.length
    ? `You told us ${parts.join(", ")}.`
    : "You shared a little personal context with Caayva.";
}

function labelValues(values: string[], options: readonly { value: string; label: string }[]) {
  return values
    .map((value) => options.find((option) => option.value === value)?.label.toLowerCase())
    .filter(Boolean) as string[];
}

function article(value: string) {
  return /^[aeiou]/i.test(value) ? "an" : "a";
}
