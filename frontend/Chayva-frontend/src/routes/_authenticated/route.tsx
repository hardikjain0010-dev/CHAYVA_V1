import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { ExpenseProvider } from "@/lib/expense-context";
import { CoachingProvider } from "@/lib/coaching-context";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,

  beforeLoad: async () => {
    // Single auth check during navigation — if no valid token/user, redirect.
    const user = await getCurrentUser();

    if (!user) {
      throw redirect({ to: "/auth" });
    }
  },

  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  // UserProvider fetches /auth/me once and holds the user in context.
  // ExpenseProvider fetches /expenses once and holds all expenses in context.
  // All child pages read from these providers — no independent fetching.
  // On logout: UserProvider sets user=null → ExpenseProvider clears expenses.
  return (
    <ExpenseProvider>
      <CoachingProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </CoachingProvider>
    </ExpenseProvider>
  );
}
