/**
 * UserContext — single source of truth for the authenticated user.
 *
 * Instead of every page calling `await getCurrentUser()` independently
 * (which causes multiple network round-trips and race conditions),
 * `UserProvider` fetches the user once and stores it here.
 *
 * All components call `useUser()` to read the current user.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type User, getCurrentUser, clearToken } from "./auth";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type UserState = {
  user: User | null;
  /** True while the initial /auth/me call is in-flight. */
  loading: boolean;
  /** Non-null when the /auth/me call returned an error. */
  error: string | null;
};
type UserContextValue = UserState & {
  /** Call after login to refresh the stored user without a full page reload. */
  refreshUser: () => Promise<void>;
  /**
   * Call on logout to clear the token and stored user.
   * Setting user to null triggers ExpenseProvider to clear its state,
   * preventing cross-user data leakage.
   */
  logout: () => void;
};
// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const UserContext = createContext<UserContextValue | null>(null);
// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>({
    user: null,
    loading: true,
    error: null,
  });
const fetchUser = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const user = await getCurrentUser();
      // getCurrentUser() returns null if no token — not an error, just unauthenticated.
      setState({ user, loading: false, error: null });
    } catch (err) {
          // Token was invalid or expired — clear it and treat as unauthenticated.
      clearToken();
      setState({
        user: null,
        loading: false,
        error: err instanceof Error ? err.message : "Authentication failed",
      });
    }
  }, []);
 // On mount: check if there is a stored token and validate it.
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  const logout = useCallback(() => {
    // Clear the stored JWT from localStorage.
    clearToken();
    // Setting user to null propagates to ExpenseProvider (which watches user?.uid),
    // causing it to dispatch CLEAR_EXPENSES — no stale data leaks to the next login.
    setState({ user: null, loading: false, error: null });
  }, []);
  return (
    <UserContext.Provider
      value={{
        ...state,
        refreshUser: fetchUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser() must be used inside <UserProvider>.");
  }
  return ctx;
}