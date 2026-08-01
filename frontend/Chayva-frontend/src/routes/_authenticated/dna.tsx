import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Zap,
  Leaf,
  Sparkles,
} from "lucide-react";
import { useExpenses } from "@/lib/expense-context";
import { CircularScore } from "./dashboard";
import {
  CountUp,
  PageTransition,
} from "@/lib/ui-helpers";
export const Route = createFileRoute(
  "/_authenticated/dna"
)({
  component: SpendDnaPage,
});
function SpendDnaPage() {
  // ✅ Single source of truth — reads from shared ExpenseProvider context.
  // Field mapping: backend returns `date` (not `spent_at`).
  const { expenses } = useExpenses();
const { mindfulness, traits } = useMemo(() => {
    const total =
      expenses.reduce((s, e) => s + e.amount, 0) || 1;
    const moodCount = new Map<string, number>();
    expenses.forEach((e) => {
      const mood = e.mood ?? "neutral";
      moodCount.set(
        mood,
        (moodCount.get(mood) ?? 0) + 1
      );
    });
     const categoryTotals = new Map<string, number>();
    expenses.forEach((e) => {
      categoryTotals.set(
        e.category,
        (categoryTotals.get(e.category) ?? 0) + e.amount
      );
    });
    const sortedCategories = Array.from(
      categoryTotals.entries()
    ).sort((a, b) => b[1] - a[1]);
    const topCategory =
      sortedCategories[0]?.[0] ?? "None";
    const topPercentage = Math.round(
      ((sortedCategories[0]?.[1] ?? 0) / total) * 100
    );
    const impulsivePercent = Math.round(
      (((moodCount.get("impulsive") ?? 0) +
        (moodCount.get("regret") ?? 0)) /
        Math.max(expenses.length, 1)) *
        100
    );
    const happyPercent = Math.round(
      ((moodCount.get("happy") ?? 0) /
        Math.max(expenses.length, 1)) *
        100
    );
    // Backend returns `date` field (ISO string). Slice to YYYY-MM-DD to count active days.
    const activeDays = new Set(
      expenses.map((e) => e.date.slice(0, 10))
    ).size;
    const consistency = Math.min(
      100,
      Math.round((activeDays / 30) * 100)
    );
return {
      mindfulness: 100 - impulsivePercent,
      traits: [
        {
          icon: Heart,
          title: "Emotional Driver",
          value:
            impulsivePercent >= 40
              ? "Impulse-led"
              : happyPercent >= 40
              ? "Joy-led"
              : "Steady & Considered",
          desc:
            impulsivePercent >= 40
              ? "Many purchases happen during impulsive or regretful moments. Try pausing for 60 seconds before checking out."
              : happyPercent >= 40
              ? "You often spend when you're happy. Celebrate—but keep an eye on frequency."
              : "Your spending is generally calm and intentional.",
        },
         {
          icon: Zap,
          title: "Signature Category",
          value: topCategory,
          desc: `Around ${topPercentage}% of your spending goes toward ${topCategory}. Small improvements here create the biggest impact.`,
        },
        {
          icon: Leaf,
          title: "Rhythm",
          value:
            consistency >= 70
              ? "Daily Spender"
              : consistency >= 40
              ? "Regular"
              : "Sporadic",
          desc:
            consistency >= 70
              ? "You spend on most days. Consider adding a weekly no-spend day."
              : consistency >= 40
              ? "Your spending is balanced across the month."
              : "Your spending comes in bursts. Try identifying what triggers them.",
        },
      ],
    };
  }, [expenses]);
  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-primary">
            Behavioral Profile
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            Your Spend DNA
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A reflection of the emotional and behavioural
            patterns that influence your spending.
            Understanding—not judgement.
          </p>
        </div>
 <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass relative overflow-hidden rounded-3xl p-8"
        >
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col items-center gap-8 md:flex-row">
            <CircularScore
              value={mindfulness}
              size={180}
            />
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
                <Sparkles className="h-4 w-4" />
                Mindfulness Score
              </div>
              <div className="mt-3 text-6xl font-bold">
                <CountUp value={mindfulness} />
                <span className="text-2xl text-muted-foreground">
                  /100
                </span>
                 </div>
              <p className="mt-4 max-w-md text-muted-foreground">
                Higher scores mean fewer impulsive
                purchases. Focus on gradual improvement
                instead of perfection.
              </p>
            </div>
          </div>
        </motion.section>

      <section className="grid gap-5 md:grid-cols-3">
          {traits.map((trait, index) => (
            <motion.div
              key={trait.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              whileHover={{ y: -5 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <trait.icon className="h-4 w-4 text-primary" />
                {trait.title}
              </div>
              <h2 className="mt-4 text-2xl font-semibold">
                {trait.value}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {trait.desc}
              </p>
            </motion.div>
          ))}
        </section>
      </div>
    </PageTransition>
  );
}
export default SpendDnaPage;

