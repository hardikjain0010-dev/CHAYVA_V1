import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,

  beforeLoad: async () => {
    const user = await getCurrentUser();

    if (!user) {
      throw redirect({ to: "/auth" });
    }
  },

  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const user = await getCurrentUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      setChecked(true);
    }

    checkUser();
  }, []);

  if (!checked) {
    return null;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}