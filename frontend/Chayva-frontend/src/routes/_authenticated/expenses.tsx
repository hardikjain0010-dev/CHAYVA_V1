import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useExpenses } from "@/lib/expense-context";
import { CategoryIcon, PageTransition } from "@/lib/ui-helpers";
export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});
function ExpensesPage() {
  // ✅ Single source of truth — reads from shared ExpenseProvider context.
  // No independent fetch, no local expense state, no duplicate network calls.
  const { expenses, loading, removeExpense } = useExpenses();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
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
      if (
        category !== "all" &&
        expense.category !== category
      ) {
        return false;
      }
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
  const total = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Your log
            </p>
            <h1 className="text-3xl font-bold">
              Expenses
            </h1>
            <p className="mt-2 text-muted-foreground">
              {filteredExpenses.length}{" "}
              {filteredExpenses.length === 1
                ? "entry"
                : "entries"}{" "}
              · ₹{total.toFixed(2)}
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
            <option value="all">
              All Categories
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
          <div className="glass overflow-hidden rounded-3xl">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-xl font-semibold">
                No expenses found
              </h2>
              <p className="mt-2 text-muted-foreground">
                Start tracking your spending.
              </p>
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
                {filteredExpenses.map((expense) => (
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
                    className="flex items-center justify-between border-b border-border px-5 py-4 last:border-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-primary/10 p-3">
                        <CategoryIcon
                          name={expense.category}
                          className="h-5 w-5"
                        />
                      </div>
                      <div>
<div className="font-semibold">
                          {expense.category}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {expense.notes ?? "No note"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {expense.date}
                          {expense.mood
                            ? ` • ${expense.mood}`
                            : ""}
                        </div>
                      </div>
                    </div>
                     <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        ₹{expense.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() =>
                          deleteExpense(expense.id)
                        }
                        className="rounded-lg p-2 transition hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
export default ExpensesPage;