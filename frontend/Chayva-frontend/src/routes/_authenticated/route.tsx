import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { ExpenseProvider } from "@/lib/expense-context";
import { CoachingProvider } from "@/lib/coaching-context";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,

  beforeLoad: async ({ location }) => {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {
      user = null;
    }

    if (!user) {
      throw redirect({ to: "/auth" });
    }

    const isOnboarding = location.pathname === "/onboarding";
    const skipKey = `chayva_onboarding_skip:${user.uid}`;
    const skippedForSession =
      typeof window !== "undefined" && window.sessionStorage.getItem(skipKey) === "true";

    try {
      const profile = await getProfile();

      if (!profile.onboarding_completed && !isOnboarding && !skippedForSession) {
        throw redirect({ to: "/onboarding" });
      }

      if (profile.onboarding_completed && isOnboarding) {
        throw redirect({ to: "/dashboard" });
      }
    } catch (err) {
      // If it's a TanStack redirect, rethrow it so navigation happens
      if (err && typeof err === "object" && ("to" in err || "href" in err || "status" in err)) {
        throw err;
      }
      console.warn("Could not verify profile in beforeLoad:", err);
    }
  },

  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname === "/onboarding") {
    return <Outlet />;
  }

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
