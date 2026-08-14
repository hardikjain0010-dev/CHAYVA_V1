import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LayoutDashboard, ListOrdered, Plus, LogOut, Brain, Sun, Moon, CalendarDays, Dna, MoonStar, MapPin, UserRound } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useUser } from "@/lib/user-context";
import type { ReactNode } from "react";
const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: ListOrdered },
  { to: "/add", label: "Add expense", icon: Plus },
  { to: "/week", label: "This Week", icon: CalendarDays },
  { to: "/dna", label: "Spend DNA", icon: Dna },
  { to: "/reflect", label: "Reflect", icon: MoonStar },
  { to: "/journey", label: "Journey", icon: MapPin },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // ✅ Use UserContext.logout() which clears token AND sets user=null,
  // triggering ExpenseProvider to clear its state — prevents cross-user data leakage.
  const { logout } = useUser();
  function signOut() {
    // Logout is purely client-side: clear token + user state.
    // No server call needed — JWTs are stateless. The old /auth/logout endpoint
    // did not exist and caused a silent error before token was cleared.
    logout();
    navigate({ to: "/auth", replace: true });
  }
   return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="glass hidden w-60 shrink-0 flex-col rounded-2xl p-4 md:flex">
          <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <Brain className="h-5 w-5" />
            </span>
            <span className="font-semibold tracking-tight text-lg">Chayva</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                     {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-gradient-primary shadow-[var(--shadow-glow)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </nav>
          <button
            onClick={toggle}
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>
         {/* Mobile bottom nav */}
        <div className="md:hidden fixed inset-x-0 bottom-0 z-20 glass-strong flex justify-around gap-1 overflow-x-auto py-2 px-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
          <button
            onClick={toggle}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs text-muted-foreground"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            onClick={signOut}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
        <main className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
