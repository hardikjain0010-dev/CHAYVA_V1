import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, ChevronDown, Plus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useExpenses, type Expense } from "@/lib/expense-context";
import {
  CategoryIcon,
  PageTransition,
  InsightFlow,
  BehaviorTag,
  MoodBadge,
  TimeWindowBadge,
  JournalDateHeader,
  EmptyLearningState,
  LoadingSkeleton,
} from "@/lib/ui-helpers";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nestedString(
  value: Record<string, unknown> | null,
  key: string,
  child: string
) {
  const nested = value?.[key];
  if (!nested || typeof nested !== "object") return null;
  const childValue = (nested as Record<string, unknown>)[child];
  return childValue == null ? null : String(childValue);
}

// Group expenses by calendar date (YYYY-MM-DD)
function groupByDate(expenses: Expense[]) {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const key = expense.date.slice(0, 10);
    const arr = groups.get(key) ?? [];
    arr.push(expense);
    groups.set(key, arr);
  }
  // Sort dates descending
  return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function ExpensesPage() {
  const { expenses, loading, error, removeExpense, refetch } = useExpenses();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  async function deleteExpense(id: string) {
    try {
      await removeExpense(id);
      toast.success("Entry removed.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove entry.");
    }
  }

  const categories = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.category))),
    [expenses]
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (category !== "all" && expense.category !== category) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          expense.category.toLowerCase().includes(q) ||
          expense.notes?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, query, category]);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const groupedByDate = useMemo(() => groupByDate(filteredExpenses), [filteredExpenses]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6">

        {/* ================================================================= */}
        {/* HEADER                                                             */}
        {/* ================================================================= */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="chayva-eyebrow">Understand</p>
            <h1 className="chayva-headline mt-1 text-3xl text-foreground">Your Journal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? "entry" : "entries"}
              {filteredExpenses.length > 0 && ` · ₹${totalFiltered.toFixed(0)} total`}
            </p>
          </div>
          <Link
            to="/add"
            className="flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add
          </Link>
        </header>

        {/* ================================================================= */}
        {/* SEARCH + FILTER                                                    */}
        {/* ================================================================= */}
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                id="journal-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search entries…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Search journal"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm transition ${
                showFilters || category !== "all"
                  ? "border-primary/30 bg-primary/8 text-primary"
                  : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-1">
                  {["all", ...categories].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                        category === cat
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-background/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat === "all" ? "All" : cat}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================================================================= */}
        {/* ERROR                                                              */}
        {/* ================================================================= */}
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <span>{error}</span>
            <button
              onClick={() => void refetch()}
              className="rounded-lg border border-destructive/30 px-3 py-1"
            >
              Retry
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* JOURNAL BODY                                                       */}
        {/* ================================================================= */}
        {loading ? (
          <div className="glass rounded-2xl p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} lines={2} />
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <EmptyLearningState
            icon={Search}
            title={expenses.length === 0 ? "Your journal is empty." : "No matching entries."}
            description={
              expenses.length === 0
                ? "Start logging expenses with mood and context. Chayva will start reading your behavioral patterns as you build your journal."
                : "Try a different search or filter."
            }
            action={
              expenses.length === 0 ? (
                <Link
                  to="/add"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
                >
                  <Plus className="h-4 w-4" />
                  Log first expense
                </Link>
              ) : undefined
            }
          />
        ) : (
          // ---------------------------------------------------------------
          // GROUPED BY DATE
          // ---------------------------------------------------------------
          <div className="space-y-6">
            {groupedByDate.map(([date, dayExpenses]) => {
              const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
              return (
                <div key={date}>
                  <JournalDateHeader date={date} total={dayTotal} />
                  <ul className="space-y-2">
                    <AnimatePresence>
                      {dayExpenses.map((expense) => (
                        <JournalEntry
                          key={expense.id}
                          expense={expense}
                          expanded={expandedId === expense.id}
                          onToggle={() =>
                            setExpandedId(
                              expandedId === expense.id ? null : expense.id
                            )
                          }
                          onDelete={() => deleteExpense(expense.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// JournalEntry — single expense in the behavioral journal
// ---------------------------------------------------------------------------

function JournalEntry({
  expense,
  expanded,
  onToggle,
  onDelete,
}: {
  expense: Expense;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const insight =
    expense.insight && typeof expense.insight === "object"
      ? (expense.insight as Record<string, unknown>)
      : null;

  const insightText = insight?.insight ? String(insight.insight) : null;

  const classification =
    nestedString(insight, "expense_classification", "classification") ??
    nestedString(
      expense as unknown as Record<string, unknown>,
      "expense_classification",
      "classification"
    );

  const significance =
    nestedString(insight, "behavioral_significance", "level") ??
    nestedString(
      expense as unknown as Record<string, unknown>,
      "behavioral_significance",
      "level"
    );

  const spendingType = insight?.spending_type ? String(insight.spending_type) : null;

  const hasInsight = !!insightText;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.22 }}
      className="overflow-hidden rounded-2xl border border-foreground/8 bg-background/40"
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Category icon */}
        <button
          onClick={onToggle}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8 transition hover:bg-primary/14"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${expense.category} entry`}
        >
          <CategoryIcon name={expense.category} className="h-4.5 w-4.5 text-primary" />
        </button>

        {/* Content */}
        <button
          onClick={onToggle}
          className="flex flex-1 min-w-0 flex-col text-left"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{expense.category}</span>
            {expense.notes && (
              <span className="text-xs text-muted-foreground truncate max-w-[14rem]">
                {expense.notes}
              </span>
            )}
          </div>

          {/* Time + mood + tags */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <TimeWindowBadge dateStr={expense.date} />
            <MoodBadge mood={expense.mood} />
            {/* Classification — neutral display, no judgment */}
            {classification && (
              <BehaviorTag label={classification} />
            )}
            {spendingType && spendingType !== classification && (
              <BehaviorTag label={spendingType} />
            )}
            {/* Insight available indicator */}
            {hasInsight && (
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-medium text-primary opacity-75">
                AI read available
              </span>
            )}
          </div>
        </button>

        {/* Amount + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold tabular-nums">
            ₹{expense.amount.toFixed(0)}
          </span>
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-foreground/8 hover:text-foreground"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete entry"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded — behavioral insight flow */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-foreground/8 px-4 pb-5 pt-4 space-y-3">
              {hasInsight ? (
                <>
                  <InsightFlow
                    compact
                    data={{
                      // LEVEL 1: What Chayva noticed
                      observation: insightText,
                      // LEVEL 2: Evidence
                      evidence: insight?.detected_trigger
                        ? `Trigger observed: ${String(insight.detected_trigger)}`
                        : null,
                      // LEVEL 3: Interpretation (cautious)
                      interpretation: insight?.emotion
                        ? `Emotional state logged: ${String(insight.emotion)}`
                        : null,
                      // LEVEL 4: Reflection
                      reflection: insight?.suggestion
                        ? String(insight.suggestion)
                        : null,
                    }}
                  />

                  {/* Behavioral metadata — neutral tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {significance && (
                      <BehaviorTag label={`significance: ${significance}`} />
                    )}
                    {insight?.confidence != null && (
                      <BehaviorTag
                        label={`confidence: ${Math.round(Number(insight.confidence) * 100)}%`}
                      />
                    )}
                    {insight?.pattern_tag != null && (
                      <BehaviorTag label={String(insight.pattern_tag)} />
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs italic text-muted-foreground">
                  Chayva will analyze this entry when more context is available.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export default ExpensesPage;
