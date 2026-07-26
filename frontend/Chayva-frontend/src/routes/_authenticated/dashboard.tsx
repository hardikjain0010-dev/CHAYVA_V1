import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { get, post } from "@/lib/api";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Sparkles, TrendingUp, Wallet, Calendar, Dna, MoonStar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CountUp, PageTransition, CategoryIcon } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type Expense = {
  id: string;
  amount: number;
  category: string;
  note: string | null;
  mood: string | null;
  spent_at: string;
};

const COLORS = [
  "oklch(0.72 0.19 300)",
  "oklch(0.78 0.15 195)",
  "oklch(0.75 0.18 85)",
  "oklch(0.7 0.2 15)",
  "oklch(0.68 0.17 145)",
  "oklch(0.7 0.2 260)",
];

function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
     const rows = await get<Expense[]>("/expenses");
setExpenses(rows);
      
      try {
        const last = await get<{ content: string; created_at: string } | null>("/ai-insights/latest");
        if (last?.content) {
          setInsight(last.content);
        }
        
        // Auto-generate if none, or stale (>12h), and there are expenses
        const stale =
          !last ||
          (last.created_at && Date.now() - new Date(last.created_at).getTime() > 12 * 3600 * 1000);
        if (rows.length > 0 && stale) {
          void runInsight(true);
        }
      } catch (error) {
        console.error("Failed to load insights:", error);
      }
      
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const now = new Date();
    const thisMonth = expenses.filter((e) => {
      const d = new Date(e.spent_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
    const allTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const days = new Set(thisMonth.map((e) => e.spent_at)).size || 1;

    // Mindfulness = share of non-impulsive/regret purchases
    const moody = expenses.filter((e) => e.mood);
    const impulsive = moody.filter((e) => e.mood === "impulsive" || e.mood === "regret").length;
    const mindfulness = moody.length
      ? Math.round(((moody.length - impulsive) / moody.length) * 100)
      : 100;

    return {
      month: monthTotal,
      all: allTotal,
      count: thisMonth.length,
      avgPerDay: monthTotal / days,
      mindfulness,
    };
  }, [expenses]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    expenses.forEach((e) => {
      if (map.has(e.spent_at)) map.set(e.spent_at, (map.get(e.spent_at) ?? 0) + e.amount);
    });
    return Array.from(map, ([date, value]) => ({
      date: date.slice(5),
      value: Number(value.toFixed(2)),
    }));
  }, [expenses]);

  async function runInsight(silent = false) {
    setLoadingInsight(true);
    try {
      const { content } = await post<{ content: string }>("/ai-insights/generate", {});
      setInsight(content);
      if (!silent) toast.success("New insight generated");
    } catch (err) {
      if (!silent) toast.error(err instanceof Error ? err.message : "Failed to generate insight");
    } finally {
      setLoadingInsight(false);
    }
  }

  const topCat = byCategory[0];

  return (
    <PageTransition>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Your coach</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl">
              Good to see you.
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Chayva is reading your spending mood in real time.
            </p>
          </div>
          <Link
            to="/add"
            className="rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.03] active:scale-[0.98]"
          >
            + Add expense
          </Link>
        </header>

        {/* HERO: AI Insight */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent p-8 md:p-10"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                >
                  <Sparkles className="h-5 w-5" />
                </motion.span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-accent">AI Insight</p>
                  <h2 className="text-lg font-semibold">Today's reflection</h2>
                </div>
              </div>
              <button
                onClick={() => runInsight()}
                disabled={loadingInsight}
                aria-label="Refresh insight"
                className="rounded-full border border-foreground/10 bg-foreground/5 p-2 text-muted-foreground transition hover:text-foreground disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loadingInsight ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="mt-5 min-h-[6rem] text-lg leading-relaxed text-foreground/90 md:text-xl">
              {loadingInsight && !insight ? (
                <div className="space-y-2">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-foreground/10" />
                  <div className="h-4 w-3/5 animate-pulse rounded bg-foreground/10" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
                </div>
              ) : insight ? (
                <motion.p
                  key={insight.slice(0, 24)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  {insight}
                </motion.p>
              ) : loaded && expenses.length === 0 ? (
                <p className="text-muted-foreground">
                  Add a few expenses and I'll start noticing your patterns.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-foreground/10" />
                  <div className="h-4 w-3/5 animate-pulse rounded bg-foreground/10" />
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Secondary cards: Mindfulness + Spend DNA */}
        <section className="grid gap-4 md:grid-cols-2">
          <MindfulnessCard score={totals.mindfulness} />
          <DnaTeaser topCategory={topCat?.name ?? "—"} count={expenses.length} />
        </section>

        {/* Compact stats */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Wallet} label="This month" value={totals.month} prefix="₹" decimals={2} />
          <StatCard icon={Calendar} label="Avg / day" value={totals.avgPerDay} prefix="₹" decimals={2} />
          <StatCard icon={TrendingUp} label="Transactions" value={totals.count} />
          <StatCard icon={Wallet} label="All time" value={totals.all} prefix="₹" decimals={2} />
        </section>

        {/* Charts, lower */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-1 text-lg font-semibold">Spending trend</h2>
            <p className="mb-4 text-xs text-muted-foreground">Last 30 days</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={byDay}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.19 300)" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="oklch(0.72 0.19 300)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.6 0 0 / 0.1)" vertical={false} />
                  <XAxis dataKey="date" stroke="oklch(0.6 0.03 280)" fontSize={11} />
                  <YAxis stroke="oklch(0.6 0.03 280)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover, #1a1a2e)",
                      border: "1px solid oklch(0.6 0 0 / 0.2)",
                      borderRadius: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="oklch(0.72 0.19 300)"
                    strokeWidth={2.5}
                    fill="url(#g1)"
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="mb-1 text-lg font-semibold">By category</h2>
            <p className="mb-4 text-xs text-muted-foreground">Where your money flows</p>
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses yet.</p>
            ) : (
              <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="value"
                        innerRadius={50}
                        outerRadius={82}
                        paddingAngle={3}
                        animationDuration={900}
                      >
                        {byCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover, #1a1a2e)",
                          border: "1px solid oklch(0.6 0 0 / 0.2)",
                          borderRadius: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2 text-sm">
                  {byCategory.slice(0, 6).map((c, i) => (
                    <li key={c.name} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        <CategoryIcon name={c.name} className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.name}
                      </span>
                      <span className="text-muted-foreground">₹{c.value.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <h2 className="mb-1 text-lg font-semibold">Top categories</h2>
          <p className="mb-4 text-xs text-muted-foreground">Biggest levers</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory.slice(0, 8)}>
                <CartesianGrid stroke="oklch(0.6 0 0 / 0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="oklch(0.6 0.03 280)" fontSize={11} />
                <YAxis stroke="oklch(0.6 0.03 280)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover, #1a1a2e)",
                    border: "1px solid oklch(0.6 0 0 / 0.2)",
                    borderRadius: 12,
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="oklch(0.78 0.15 195)"
                  radius={[10, 10, 0, 0]}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  decimals = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  prefix?: string;
  decimals?: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/5">
          <Icon className="h-4 w-4 text-accent" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">
        <CountUp value={value} prefix={prefix} decimals={decimals} />
      </div>
    </motion.div>
  );
}

function MindfulnessCard({ score }: { score: number }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass relative overflow-hidden rounded-2xl p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Mindfulness</p>
          <h3 className="mt-1 text-xl font-semibold">How intentional you've been</h3>
        </div>
        <MoonStar className="h-5 w-5 text-accent" />
      </div>
      <div className="mt-6 flex items-center gap-5">
        <CircularScore value={score} size={110} />
        <div>
          <div className="text-4xl font-semibold tabular-nums">
            <CountUp value={score} />
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {score >= 80
              ? "Beautifully mindful. Keep going."
              : score >= 50
                ? "You're finding your rhythm."
                : "Notice what triggers impulsive spend."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function DnaTeaser({ topCategory, count }: { topCategory: string; count: number }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Spend DNA</p>
          <h3 className="mt-1 text-xl font-semibold">Your signature pattern</h3>
        </div>
        <Dna className="h-5 w-5 text-accent" />
      </div>
      <div className="mt-6">
        <div className="text-3xl font-semibold">{topCategory}</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Based on {count} tracked purchase{count === 1 ? "" : "s"}.
        </p>
        <Link
          to="/dna"
          className="mt-4 inline-flex text-sm text-primary hover:underline"
        >
          Explore your DNA →
        </Link>
      </div>
    </motion.div>
  );
}
export function CircularScore({ value, size = 120 }: { value: number; size?: number }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const clamp = Math.max(0, Math.min(100, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={8}
          className="fill-none stroke-foreground/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={8}
          strokeLinecap="round"
          className="fill-none"
          stroke="url(#scoreGradient)"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${(clamp / 100) * c} ${c}` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.19 300)" />
            <stop offset="100%" stopColor="oklch(0.78 0.15 195)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
