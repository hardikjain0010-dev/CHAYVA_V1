import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { updateProfile, type UserProfilePayload } from "@/lib/profile";
import { useUser } from "@/lib/user-context";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

const SKIP_KEY = "chayva_onboarding_skip";

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

  const total = 8;
  const progress = Math.round((step / total) * 100);
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
      toast.success("Your Chayva profile is ready.");
      setStep(total);
    } catch {
      setError(
        "Chayva could not save your profile right now. Your answers are still here, so you can retry.",
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
      setError("Chayva could not update your profile state right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (step === total) {
    return (
      <OnboardingFrame>
        <div className="glass mx-auto w-full max-w-xl rounded-2xl p-6 shadow-[var(--glass-shadow-strong)] md:p-8">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Chayva profile is ready.</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {completionSummary(savedProfile ?? buildPayload(answers))}
          </p>
          <p className="mt-4 text-base font-medium">
            Now let's see what your spending actually tells us.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard", replace: true })}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Enter Chayva
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
          <Welcome onBegin={() => setStep(1)} onSkip={skipForNow} saving={saving} error={error} />
        ) : (
          <div className="glass rounded-2xl p-5 shadow-[var(--glass-shadow-strong)] md:p-7">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>{step} of 8</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-all"
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
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!canContinue || saving}
                onClick={() => (step === total - 1 ? submit() : setStep((current) => current + 1))}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {step === total - 1 ? "Finish" : "Continue"}
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
  return <main className="flex min-h-screen items-center px-4 py-8 md:px-6">{children}</main>;
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
    <section className="glass rounded-2xl p-6 shadow-[var(--glass-shadow-strong)] md:p-8">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Let's make Chayva understand you.</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        A few quick questions help Chayva recognize your spending patterns more personally. There
        are no right or wrong answers.
      </p>
      {error ? (
        <p className="mt-5 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBegin}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Let's begin
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onSkip}
          className="rounded-xl border border-foreground/10 px-5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
          <span className="text-sm text-muted-foreground">Tell Chayva a little more</span>
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
      <SingleQuestion title="What would you most like Chayva to help you understand?">
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
      <SingleQuestion title="How should Chayva talk to you?">
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
    <SingleQuestion title="How would you like Chayva to talk?">
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
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-6">{children}</div>
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
      className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-ring ${
        selected
          ? "border-primary bg-primary/15 text-foreground shadow-[var(--shadow-glow)]"
          : "border-foreground/10 bg-background/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span>{children}</span>
        {selected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
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
    : "You shared a little personal context with Chayva.";
}

function labelValues(values: string[], options: readonly { value: string; label: string }[]) {
  return values
    .map((value) => options.find((option) => option.value === value)?.label.toLowerCase())
    .filter(Boolean) as string[];
}

function article(value: string) {
  return /^[aeiou]/i.test(value) ? "an" : "a";
}
