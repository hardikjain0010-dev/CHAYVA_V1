/**
 * ExpenseContext — single source of truth for all expense data.
 *
 * This replaces the pattern of every page independently fetching expenses
 * and maintaining its own local useState.
 *
 * Architecture:
 *  - `ExpenseProvider` fetches expenses once when the user is available.
 *  - `addExpense(data)` POSTs to the API, then merges the result into state.
 *  - `removeExpense(id)` DELETEs from the API, then removes from state.
 *  - `clearExpenses()` wipes state on logout to prevent cross-user data leakage.
 *  - All pages call `useExpenses()` — they all read the same data.
 *  - Any mutation instantly updates Dashboard, Expenses, DNA, Week, Journey.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { get, post, del } from "./api";
import { useUser } from "./user-context";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  /** ISO date string — e.g. "2025-01-15" or "2025-01-15T08:30:00" */
  date: string;
  notes: string | null;
  mood: string | null;
  source: string;
  insight: Record<string, unknown> | null;
  expense_classification?: Record<string, unknown> | null;
  behavioral_significance?: Record<string, unknown> | null;
  classification_override?: Record<string, unknown> | null;
};
type ExpenseCreatePayload = {
  amount: number;
  category: string;
  notes?: string;
  mood?: string;
  date?: string;
  source?: string;
};
// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
type State = {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
};
type Action =
  | { type: "SET_LOADING" }
  | { type: "SET_EXPENSES"; payload: Expense[] }
  | { type: "ADD_EXPENSE"; payload: Expense }
  | { type: "REMOVE_EXPENSE"; payload: string }
  | { type: "CLEAR_EXPENSES" }
  | { type: "SET_ERROR"; payload: string };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: true, error: null };
    case "SET_EXPENSES":
      return { expenses: action.payload, loading: false, error: null };
    case "ADD_EXPENSE":
      // Prepend so the newest expense is first, matching the API sort order.
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case "REMOVE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
      };
    case "CLEAR_EXPENSES":
      // Called on logout or user change — prevents cross-user data leakage.
      return { expenses: [], loading: false, error: null };
    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}
// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
type ExpenseContextValue = State & {
  /**
   * Add a new expense for the current user.
   * Sends POST /expenses, then updates shared state.
   * Returns the created expense.
   */
  addExpense: (data: ExpenseCreatePayload) => Promise<Expense>;
  /**
   * Delete an expense by ID.
   * Sends DELETE /expenses/:id, then removes it from shared state.
   */
  removeExpense: (id: string) => Promise<void>;
  /**
   * Wipe all expense state immediately.
   * Called on logout to prevent stale data appearing for the next user.
   */
  clearExpenses: () => void;
  /**
   * Manually trigger a full re-fetch from the server.
   * Use this sparingly — state is normally kept in sync via mutations.
   */
  refetch: () => Promise<void>;
};
const ExpenseContext = createContext<ExpenseContextValue | null>(null);
// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [state, dispatch] = useReducer(reducer, {
    expenses: [],
    loading: false,
    error: null,
  });
  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    dispatch({ type: "SET_LOADING" });
    try {
      const data = await get<Expense[]>("/expenses");
      dispatch({ type: "SET_EXPENSES", payload: data });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "Failed to load expenses",
      });
    }
  }, [user]);
  // When user becomes available: fetch their expenses.
  // When user changes (logout → login as different user): clear stale data first,
  // then fetch the new user's expenses. This prevents cross-user data leakage.
  useEffect(() => {
    if (user) {
      // Clear any stale data from a previous session before fetching fresh data.
      dispatch({ type: "CLEAR_EXPENSES" });
      fetchExpenses();
    } else {
      // User logged out — clear expenses immediately.
      dispatch({ type: "CLEAR_EXPENSES" });
    }
  }, [user?.uid]); // Depend on uid, not the entire user object, to prevent re-runs on profile updates.
  const addExpense = useCallback(
    async (data: ExpenseCreatePayload): Promise<Expense> => {
      if (!user) throw new Error("Not authenticated");
      const expense = await post<Expense>("/expenses", {
        ...data,
        source: data.source ?? "manual",
      });
      dispatch({ type: "ADD_EXPENSE", payload: expense });
      return expense;
    },
    [user],
  );
  const removeExpense = useCallback(async (id: string): Promise<void> => {
    await del(`/expenses/${id}`);
    dispatch({ type: "REMOVE_EXPENSE", payload: id });
  }, []);
  const clearExpenses = useCallback(() => {
    dispatch({ type: "CLEAR_EXPENSES" });
  }, []);

  const contextValue = useMemo(
    () => ({
      ...state,
      addExpense,
      removeExpense,
      clearExpenses,
      refetch: fetchExpenses,
    }),
    [state, addExpense, removeExpense, clearExpenses, fetchExpenses],
  );

  return (
    <ExpenseContext.Provider value={contextValue}>
      {children}
    </ExpenseContext.Provider>
  );
}
// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useExpenses(): ExpenseContextValue {
  const ctx = useContext(ExpenseContext);
  if (!ctx) {
    throw new Error("useExpenses() must be used inside <ExpenseProvider>.");
  }
  return ctx;
}
