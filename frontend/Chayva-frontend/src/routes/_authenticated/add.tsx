import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useExpenses } from "@/lib/expense-context";
import { PageTransition, CategoryIcon, AIInsightReveal } from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/add")({
  component: AddExpensePage,
});

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

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
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "stressed", emoji: "😣", label: "Stressed" },
  { value: "bored", emoji: "😐", label: "Bored" },
  { value: "lonely", emoji: "🥺", label: "Lonely" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "social", emoji: "🥳", label: "Social" },
];

function currentLocalDateTime() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function AddExpensePage() {
  const navigate = useNavigate();
  const { addExpense } = useExpenses();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("happy");
  const [spentAt, setSpentAt] = useState(currentLocalDateTime);

  const [loading, setLoading] = useState(false);
  const [savedInsight, setSavedInsight] = useState<Record<string, unknown> | null>(null);
  const [showInsight, setShowInsight] = useState(false);

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

      const insightPayload =
        expense.insight && typeof expense.insight === "object"
          ? (expense.insight as Record<string, unknown>)
          : null;

      setSavedInsight(insightPayload);
      setShowInsight(true);

      if (insightPayload) {
        toast.success("Expense logged. Chayva is reflecting on this moment...");
      } else {
        toast.success("Expense logged. Chayva couldn't generate an insight right now.");
      }

      // Navigate after showing insight briefly
      setTimeout(
        () => {
          navigate({ to: "/expenses" });
        },
        insightPayload ? 3500 : 2000,
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to save expense. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Build insight data for AIInsightReveal from the expense.insight object
  const insightData = savedInsight
    ? {
        observation: savedInsight.insight ? String(savedInsight.insight) : null,
        evidence: savedInsight.detected_trigger
          ? `Detected trigger: ${String(savedInsight.detected_trigger)}`
          : null,
        interpretation: savedInsight.behavior
          ? `Spending type: ${String(savedInsight.behavior)}`
          : null,
        suggestion: savedInsight.suggestion ? String(savedInsight.suggestion) : null,
        tags: [
          savedInsight.spending_type && {
            label: String(savedInsight.spending_type),
          },
          savedInsight.pattern_tag && {
            label: String(savedInsight.pattern_tag),
          },
          (savedInsight.expense_classification as Record<string, unknown> | null)
            ?.classification && {
            label: String(
              (savedInsight.expense_classification as Record<string, unknown>).classification,
            ),
          },
          (savedInsight.behavioral_significance as Record<string, unknown> | null)?.level && {
            label: `significance: ${String(
              (savedInsight.behavioral_significance as Record<string, unknown>).level,
            )}`,
          },
        ].filter(Boolean) as Array<{ label: string }>,
      }
    : null;

  return (
    <PageTransition>
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-8">
          <button
            onClick={() => navigate({ to: "/expenses" })}
            className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <p className="caayva-eyebrow">Capture</p>
          <h1 className="caayva-headline mt-1 text-3xl text-foreground">What did you spend on?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every entry helps Caayva understand the why behind your spending.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {showInsight ? (
            // ---------------------------------------------------------------
            // AI INSIGHT REVEAL — after saving
            // ---------------------------------------------------------------
            <motion.div
              key="insight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/6 px-4 py-3">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">₹{amount} logged</p>
                  <p className="text-xs text-muted-foreground">
                    {category} · {mood}
                  </p>
                </div>
              </div>

              <AIInsightReveal show={showInsight} data={insightData} />

              {!insightData?.observation && (
                <p className="text-center text-sm text-muted-foreground">
                  Caayva will analyze this expense soon.
                </p>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Taking you to your journal…
              </p>
            </motion.div>
          ) : (
            // ---------------------------------------------------------------
            // CAPTURE FORM
            // ---------------------------------------------------------------
            <motion.form
              key="form"
              onSubmit={onSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-7"
            >
              {/* ----------------------------------------------------------- */}
              {/* AMOUNT — dominant input                                      */}
              {/* ----------------------------------------------------------- */}
              <div className="glass rounded-3xl p-7 text-center">
                <p className="caayva-eyebrow mb-4">Amount</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="font-outfit text-4xl font-bold text-muted-foreground">₹</span>
                  <input
                    id="amount-input"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="capture-input max-w-[200px]"
                    autoFocus
                  />
                </div>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* CATEGORY — icon grid                                         */}
              {/* ----------------------------------------------------------- */}
              <div>
                <p className="caayva-eyebrow mb-3">Category</p>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`category-tile ${category === cat ? "active" : ""}`}
                    >
                      <CategoryIcon name={cat} className="h-5 w-5" />
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* MOOD — emoji row                                             */}
              {/* ----------------------------------------------------------- */}
              <div>
                <p className="caayva-eyebrow mb-3">How were you feeling?</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <motion.button
                      key={m.value}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMood(m.value)}
                      className={`mood-pill ${mood === m.value ? "active" : ""}`}
                    >
                      <span className="text-base">{m.emoji}</span>
                      {m.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* DATE / TIME — secondary field                                */}
              {/* ----------------------------------------------------------- */}
              <div>
                <label className="caayva-eyebrow block mb-2" htmlFor="spent-at">
                  When
                </label>
                <input
                  id="spent-at"
                  type="datetime-local"
                  value={spentAt}
                  onChange={(e) => setSpentAt(e.target.value)}
                  className="profile-input"
                />
              </div>

              {/* ----------------------------------------------------------- */}
              {/* NOTE — optional context                                      */}
              {/* ----------------------------------------------------------- */}
              <div>
                <label className="caayva-eyebrow block mb-2" htmlFor="expense-note">
                  Note{" "}
                  <span className="normal-case tracking-normal text-muted-foreground opacity-70">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="expense-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What was the context? A quick note helps Caayva understand."
                  className="profile-input resize-none"
                />
              </div>

              {/* ----------------------------------------------------------- */}
              {/* SUBMIT                                                        */}
              {/* ----------------------------------------------------------- */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-primary py-3.5 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60 transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Saving…
                  </span>
                ) : (
                  "Log this expense"
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

export default AddExpensePage;
