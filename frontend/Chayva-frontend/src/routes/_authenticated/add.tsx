import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useExpenses } from "@/lib/expense-context";
import { PageTransition } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/add")({
  component: AddExpensePage,
});

const CATEGORIES = [
  "Food",
  "Groceries",
  "Transport",
  "Rent",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Health",
  "Travel",
  "Subscriptions",
  "Other",
];

const MOODS = [
  { value: "happy", emoji: "😊" },
  { value: "stressed", emoji: "😣" },
  { value: "bored", emoji: "😐" },
  { value: "lonely", emoji: "🥺" },
  { value: "tired", emoji: "😴" },
  { value: "social", emoji: "🥳" },
];

function AddExpensePage() {
  const navigate = useNavigate();
  const { addExpense } = useExpenses();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("happy");
  const [spentAt, setSpentAt] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [loading, setLoading] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [savedAnalysis, setSavedAnalysis] = useState<Record<string, unknown> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const value = Number(amount);

    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    try {
      const expense = await addExpense({
        amount: value,
        category,
        notes: note,
        mood,
        date: spentAt,
        source: "manual",
      });

      const insightPayload = expense.insight && typeof expense.insight === "object" ? expense.insight : null;
      const insightText =
        insightPayload && typeof insightPayload === "object" && "insight" in insightPayload
          ? String((insightPayload as Record<string, unknown>).insight)
          : null;

      setSavedAnalysis(insightPayload);
      setSavedFeedback(insightText ?? "Expense saved. AI insight will appear after the backend coach processes this transaction.");
      toast.success("Expense saved — your backend coach is analyzing it.");

      setTimeout(() => {
        navigate({
          to: "/expenses",
        });
      }, 1200);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save expense.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-widest text-primary">
            Quick log
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Add Expense
          </h1>

          <p className="mt-2 text-muted-foreground">
            Log a transaction and let Chayva discover your spending patterns.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="glass space-y-6 rounded-3xl p-6"
        >
          <div>
            <label className="text-sm font-medium">
              Amount
            </label>

            <div className="mt-2 flex items-center rounded-xl border border-border bg-background px-3">
              <span className="text-lg">₹</span>

              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent px-2 py-3 outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">
                Date
              </label>

              <input
                type="date"
                value={spentAt}
                onChange={(e) => setSpentAt(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Mood
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              {MOODS.map((item) => {
                const active = mood === item.value;

                return (
                  <motion.button
                    key={item.value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMood(item.value)}
                    className={`rounded-xl border px-4 py-2 transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {item.emoji} {item.value}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Note
            </label>

            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 outline-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground"
          >
            {loading ? "Saving..." : "Save Expense"}
          </motion.button>
        </form>

        <AnimatePresence>
          {savedFeedback && (
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className="glass flex gap-3 rounded-2xl p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check size={18} />
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles size={16} />
                  Chayva noticed
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {savedFeedback}
                </p>
                {savedAnalysis ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                      Behavior: {String((savedAnalysis as Record<string, unknown>).behavior ?? "forming")}
                    </span>
                    <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                      Emotion: {String((savedAnalysis as Record<string, unknown>).emotion ?? mood)}
                    </span>
                    <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                      Trigger: {String((savedAnalysis as Record<string, unknown>).detected_trigger ?? "forming")}
                    </span>
                    <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                      Type: {String((savedAnalysis as Record<string, unknown>).spending_type ?? "forming")}
                    </span>
                    <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                      Pattern: {String((savedAnalysis as Record<string, unknown>).pattern_tag ?? "neutral")}
                    </span>
                    <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                      Confidence: {String((savedAnalysis as Record<string, unknown>).confidence ?? "—")}
                    </span>
                    <span className="basis-full rounded-2xl border border-foreground/10 bg-background/40 px-3 py-2">
                      Suggestion: {String((savedAnalysis as Record<string, unknown>).suggestion ?? "No suggestion returned.")}
                    </span>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

export default AddExpensePage;
