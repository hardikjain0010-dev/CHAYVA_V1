import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { ExpenseProvider } from "@/lib/expense-context";
import { CoachingProvider } from "@/lib/coaching-context";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,

  beforeLoad: async ({ location }) => {
    const user = await getCurrentUser();

    if (!user) {
      throw redirect({ to: "/auth" });
    }

    const profile = await getProfile();
    const isOnboarding = location.pathname === "/onboarding";
    const skipKey = `chayva_onboarding_skip:${user.uid}`;
    const skippedForSession =
      typeof window !== "undefined" && window.sessionStorage.getItem(skipKey) === "true";

    if (!profile.onboarding_completed && !isOnboarding && !skippedForSession) {
      throw redirect({ to: "/onboarding" });
    }

    if (profile.onboarding_completed && isOnboarding) {
      throw redirect({ to: "/dashboard" });
    }
  },

  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = Route.useRouterState({ select: (state) => state.location.pathname });

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
