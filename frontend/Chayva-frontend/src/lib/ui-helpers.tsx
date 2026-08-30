import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  CircleDollarSign,
  Film,
  HeartPulse,
  Home,
  LucideProps,
  Plane,
  Plug,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  Sparkles,
  Eye,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

// ---------------------------------------------------------------------------
// Page transition
// ---------------------------------------------------------------------------

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// CountUp
// ---------------------------------------------------------------------------

export function CountUp({
  value,
  prefix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let frame = 0;
    const start = displayValue;
    const delta = value - start;
    const totalFrames = 24;

    function tick() {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + delta * eased);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    const id = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(id);
  }, [value]);

  return (
    <>
      {prefix}
      {displayValue.toFixed(decimals)}
    </>
  );
}

// ---------------------------------------------------------------------------
// CategoryIcon
// ---------------------------------------------------------------------------

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const key = name.toLowerCase();
  const Icon = key.includes("food")
    ? Utensils
    : key.includes("grocery")
      ? ShoppingCart
      : key.includes("transport")
        ? Car
        : key.includes("rent")
          ? Home
          : key.includes("utilit")
            ? Plug
            : key.includes("shopping")
              ? ShoppingBag
              : key.includes("entertain")
                ? Film
                : key.includes("health")
                  ? HeartPulse
                  : key.includes("travel")
                    ? Plane
                    : key.includes("subscription")
                      ? Receipt
                      : CircleDollarSign;

  return <Icon {...props} />;
}

// ---------------------------------------------------------------------------
// SectionHeading — editorial section header with eyebrow label
// ---------------------------------------------------------------------------

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="caayva-eyebrow mb-1">{eyebrow}</p>}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BehaviorTag — classification display, always visually neutral
// Classification ≠ judgment. Essential ≠ good. Discretionary ≠ bad.
// ---------------------------------------------------------------------------

export function BehaviorTag({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: "neutral" | "essential" | "discretionary" | "primary";
}) {
  // All variants use subdued, neutral styling — no color implies judgment
  const cls =
    variant === "primary"
      ? "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium border border-primary/25 bg-primary/10 text-primary"
      : "behavior-tag";

  return <span className={cls}>{label}</span>;
}

// ---------------------------------------------------------------------------
// EvidenceRow — compact behavioral evidence line
// ---------------------------------------------------------------------------

export function EvidenceRow({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground opacity-70 w-20 pt-0.5">
        {label}
      </span>
      <span className="text-foreground/85 leading-relaxed">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InsightFlow — 4-level behavioral hierarchy renderer
// What noticed → Evidence → Interpretation → Reflection
// ---------------------------------------------------------------------------

export type InsightData = {
  observation?: string | null; // What Caayva noticed
  evidence?: string | null; // Supporting data point
  interpretation?: string | null; // What it may mean (cautious)
  reflection?: string | null; // What to consider
};

export function buildInsightFlowData(
  insight: Record<string, unknown> | null | undefined,
): InsightData | null {
  if (!insight || typeof insight !== "object") return null;

  const observation = insight.insight
    ? String(insight.insight)
    : insight.observation
      ? String(insight.observation)
      : null;

  const evidence = insight.detected_trigger
    ? `Detected trigger: ${String(insight.detected_trigger)}`
    : null;

  const interpretation = insight.behavior
    ? `Spending pattern: ${String(insight.behavior)}`
    : insight.interpretation
      ? String(insight.interpretation)
      : null;

  const reflection = insight.suggestion
    ? String(insight.suggestion)
    : insight.reflection
      ? String(insight.reflection)
      : null;

  if (!observation && !evidence && !interpretation && !reflection) return null;

  return {
    observation,
    evidence,
    interpretation,
    reflection,
  };
}

export function InsightFlow({ data, compact = false }: { data: InsightData; compact?: boolean }) {
  const levels = [
    {
      icon: Eye,
      label: "Noticed",
      text: data.observation,
      color: "text-primary",
      border: "border-primary/30",
      bg: "bg-primary/5",
    },
    {
      icon: BookOpen,
      label: "Evidence",
      text: data.evidence,
      color: "text-accent",
      border: "border-accent/25",
      bg: "bg-accent/5",
    },
    {
      icon: Sparkles,
      label: "May mean",
      text: data.interpretation,
      color: "text-muted-foreground",
      border: "border-foreground/10",
      bg: "bg-foreground/[0.03]",
    },
  ];

  const visible = levels.filter((l) => l.text);
  if (visible.length === 0) return null;

  if (compact) {
    return (
      <div className="space-y-2">
        {visible.map((level) => (
          <div
            key={level.label}
            className={`flex gap-2.5 rounded-xl border px-3 py-2 ${level.border} ${level.bg}`}
          >
            <level.icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${level.color}`} />
            <div>
              <span
                className={`text-[0.6rem] font-semibold uppercase tracking-[0.14em] ${level.color}`}
              >
                {level.label}
              </span>
              <p className="text-xs leading-relaxed text-foreground/80 mt-0.5">{level.text}</p>
            </div>
          </div>
        ))}
        {data.reflection && (
          <p className="px-3 pt-1 text-xs italic text-muted-foreground leading-relaxed border-l-2 border-foreground/10 pl-3">
            {data.reflection}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((level, i) => (
        <motion.div
          key={level.label}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.25 }}
          className={`flex gap-3 rounded-xl border px-4 py-3 ${level.border} ${level.bg}`}
        >
          <level.icon className={`mt-0.5 h-4 w-4 shrink-0 ${level.color}`} />
          <div>
            <span
              className={`text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${level.color}`}
            >
              {level.label}
            </span>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">{level.text}</p>
          </div>
        </motion.div>
      ))}
      {data.reflection && (
        <div className="pl-3 border-l-2 border-primary/20">
          <p className="text-sm italic text-muted-foreground leading-relaxed">{data.reflection}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BehavioralHero — the dominant observation on a page
// ---------------------------------------------------------------------------

export function BehavioralHero({
  eyebrow,
  headline,
  subtext,
  action,
  children,
}: {
  eyebrow?: string;
  headline: string;
  subtext?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-hero p-7 md:p-9"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative">
        {eyebrow && (
          <div className="flex items-center gap-2 mb-3">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-3 w-3" />
            </span>
            <p className="caayva-eyebrow">{eyebrow}</p>
          </div>
        )}
        <h2 className="caayva-headline text-2xl text-foreground md:text-3xl">{headline}</h2>
        {subtext && (
          <p className="mt-3 text-base leading-relaxed text-foreground/75 max-w-xl">{subtext}</p>
        )}
        {children}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// EmptyLearningState — intentional state when data is insufficient
// Never show fake data. Show a beautiful, honest learning state instead.
// ---------------------------------------------------------------------------

export function EmptyLearningState({
  title,
  description,
  action,
  icon: Icon = Sparkles,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-8 py-14 text-center"
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)] mb-5">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AIInsightReveal — animated post-save insight reveal
// Shows user-safe synthesis only. Never internal chain-of-thought.
// ---------------------------------------------------------------------------

export function AIInsightReveal({
  show,
  data,
}: {
  show: boolean;
  data: {
    observation?: string | null;
    evidence?: string | null;
    interpretation?: string | null;
    suggestion?: string | null;
    tags?: Array<{ label: string }>;
  } | null;
}) {
  return (
    <AnimatePresence>
      {show && data && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-3xl p-6"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-sm)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="caayva-eyebrow">{BRAND_NAME} noticed</p>
            </div>
          </div>

          <InsightFlow
            data={{
              observation: data.observation,
              evidence: data.evidence,
              interpretation: data.interpretation,
              reflection: data.suggestion,
            }}
          />

          {data.tags && data.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <BehaviorTag key={tag.label} label={tag.label} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// QuickCaptureButton — floating action button
// ---------------------------------------------------------------------------

export function QuickCaptureButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:shadow-[var(--shadow-glow),var(--shadow-glow-sm)] hover:-translate-y-0.5 active:translate-y-0"
      aria-label="Add expense"
    >
      <span className="text-lg leading-none">+</span>
      <span>Log expense</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// LoadingSkeleton — uniform skeleton for loading states
// ---------------------------------------------------------------------------

export function LoadingSkeleton({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded-full bg-foreground/8"
          style={{ width: `${85 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JournalDateHeader — day group header in expense journal
// ---------------------------------------------------------------------------

export function JournalDateHeader({ date, total }: { date: string; total?: number }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isToday = d.toDateString() === today.toDateString();
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const label = isToday
    ? "Today"
    : isYesterday
      ? "Yesterday"
      : d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border w-6 opacity-50" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
      </div>
      {total != null && (
        <span className="text-xs text-muted-foreground tabular-nums">₹{total.toFixed(0)}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimeWindowBadge — Morning / Afternoon / Evening / Night from expense hour
// Pure frontend derivation from expense.date — no new API needed
// ---------------------------------------------------------------------------

export function getTimeWindow(dateStr: string): {
  label: string;
  icon: string;
} {
  const d = new Date(dateStr);
  const hour = d.getHours();
  if (hour >= 5 && hour < 12) return { label: "Morning", icon: "🌅" };
  if (hour >= 12 && hour < 17) return { label: "Afternoon", icon: "☀️" };
  if (hour >= 17 && hour < 21) return { label: "Evening", icon: "🌆" };
  return { label: "Night", icon: "🌙" };
}

export function TimeWindowBadge({ dateStr }: { dateStr: string }) {
  const { label, icon } = getTimeWindow(dateStr);
  return (
    <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
      <span>{icon}</span>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// MoodBadge — display mood from expense
// ---------------------------------------------------------------------------

const MOOD_MAP: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "Happy" },
  stressed: { emoji: "😣", label: "Stressed" },
  bored: { emoji: "😐", label: "Bored" },
  lonely: { emoji: "🥺", label: "Lonely" },
  tired: { emoji: "😴", label: "Tired" },
  social: { emoji: "🥳", label: "Social" },
  great: { emoji: "😄", label: "Great" },
  good: { emoji: "😊", label: "Good" },
  okay: { emoji: "😐", label: "Okay" },
  low: { emoji: "😔", label: "Low" },
};

export function MoodBadge({ mood }: { mood?: string | null }) {
  if (!mood) return null;
  const m = MOOD_MAP[mood.toLowerCase()] ?? { emoji: "•", label: mood };
  return (
    <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
      <span className="text-sm">{m.emoji}</span>
      {m.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// InlineLink — inline navigation shortcut
// ---------------------------------------------------------------------------

export function InlineLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </a>
  );
}

// ---------------------------------------------------------------------------
// CircularScore — SVG arc score visualization
// Used for behavioral mindfulness score. Purely decorative, no judgment.
// ---------------------------------------------------------------------------

export function CircularScore({ value, size = 96 }: { value: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circ = 2 * Math.PI * radius;
  const fill = Math.min(1, Math.max(0, value / 100));
  const offset = circ * (1 - fill);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        className="text-foreground/8"
      />
      {/* Arc — uses primary gradient via a linear approximation */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="oklch(0.62 0.19 300)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}
