import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, ChevronDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useExpenses } from "@/lib/expense-context";
import { CategoryIcon, PageTransition } from "@/lib/ui-helpers";
export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});

function nestedString(value: Record<string, unknown> | null, key: string, child: string) {
  const nested = value?.[key];
  if (!nested || typeof nested !== "object") return null;
  const childValue = (nested as Record<string, unknown>)[child];
  return childValue == null ? null : String(childValue);
}

function ExpensesPage() {
  // ✅ Single source of truth — reads from shared ExpenseProvider context.
  // No independent fetch, no local expense state, no duplicate network calls.
  const { expenses, loading, error, removeExpense, refetch } = useExpenses();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  async function deleteExpense(id: string) {
    try {
      await removeExpense(id);
      toast.success("Expense deleted.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete expense.");
    }
  }
  const categories = useMemo(() => {
    return Array.from(new Set(expenses.map((e) => e.category)));
  }, [expenses]);
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (category !== "all" && expense.category !== category) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          expense.category.toLowerCase().includes(q) || expense.notes?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, query, category]);
  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your log</p>
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="mt-2 text-muted-foreground">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? "entry" : "entries"} · ₹
              {total.toFixed(2)}
            </p>
          </div>
          <Link
            to="/add"
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            + Add Expense
          </Link>
        </div>
        <div className="glass mb-6 flex flex-col gap-3 rounded-2xl p-4 md:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search expenses..."
              className="w-full bg-transparent py-3 outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-border px-4 py-3"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={() => void refetch()}
                className="rounded-lg border border-destructive/30 px-3 py-1"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}
        <div className="glass overflow-hidden rounded-3xl">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-xl font-semibold">No expenses found</h2>
              <p className="mt-2 text-muted-foreground">Start tracking your spending.</p>
              <Link
                to="/add"
                className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-primary-foreground"
              >
                Add First Expense
              </Link>
            </div>
          ) : (
            <ul>
              <AnimatePresence>
                {filteredExpenses.map((expense) => {
                  const insight =
                    expense.insight && typeof expense.insight === "object"
                      ? (expense.insight as Record<string, unknown>)
                      : null;
                  const classification =
                    nestedString(insight, "expense_classification", "classification") ??
                    nestedString(
                      expense as unknown as Record<string, unknown>,
                      "expense_classification",
                      "classification",
                    ) ??
                    "uncertain";
                  const significance =
                    nestedString(insight, "behavioral_significance", "level") ??
                    nestedString(
                      expense as unknown as Record<string, unknown>,
                      "behavioral_significance",
                      "level",
                    ) ??
                    "unknown";
                  return (
                    <motion.li
                      key={expense.id}
                      layout
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
                        x: -40,
                      }}
                      className="border-b border-border px-5 py-4 last:border-none"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl bg-primary/10 p-3">
                            <CategoryIcon name={expense.category} className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold">{expense.category}</div>
                            <div className="text-sm text-muted-foreground">
                              {expense.notes ?? "No note"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {expense.date}
                              {expense.mood ? ` • ${expense.mood}` : ""}
                              {insight?.spending_type ? ` • ${String(insight.spending_type)}` : ""}
                            </div>
                            <p className="mt-2 max-w-xl text-sm text-foreground/80">
                              {insight?.insight
                                ? String(insight.insight)
                                : "AI analysis unavailable for this expense."}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">₹{expense.amount.toFixed(2)}</span>
                          <button
                            onClick={() =>
                              setExpandedId(expandedId === expense.id ? null : expense.id)
                            }
                            className="rounded-lg p-2 transition hover:bg-foreground/10"
                            aria-label="Expand insight"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition ${expandedId === expense.id ? "rotate-180" : ""}`}
                            />
                          </button>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="rounded-lg p-2 transition hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <AnimatePresence initial={false}>
                        {expandedId === expense.id ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 rounded-2xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
                                <Sparkles className="h-3.5 w-3.5" />
                                Behavioral insight
                              </div>
                              <p className="mt-2 text-foreground">
                                {expense.insight &&
                                typeof expense.insight === "object" &&
                                "insight" in expense.insight
                                  ? String((expense.insight as Record<string, unknown>).insight)
                                  : "Your backend coach will produce a behavioral read once it has enough context from your expenses."}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                                  Behavior:{" "}
                                  {String(insight?.behavior ?? insight?.spending_type ?? "—")}
                                </span>
                                <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                                  Emotion: {String(insight?.emotion ?? expense.mood ?? "—")}
                                </span>
                                <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                                  Trigger: {String(insight?.detected_trigger ?? "—")}
                                </span>
                                <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                                  Suggestion: {String(insight?.suggestion ?? "—")}
                                </span>
                                <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                                  Pattern: {String(insight?.pattern_tag ?? "neutral")}
                                </span>
                                <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                                  Classification: {classification}
                                </span>
                                <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                                  Significance: {significance}
                                </span>
                                <span className="rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1">
                                  Confidence:{" "}
                                  {insight?.confidence != null ? String(insight.confidence) : "—"}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
export default ExpensesPage;
