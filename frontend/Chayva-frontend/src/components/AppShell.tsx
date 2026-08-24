import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Plus,
  LogOut,
  Sun,
  Moon,
  CalendarDays,
  Dna,
  MoonStar,
  MapPin,
  UserRound,
  BookOpen,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useUser } from "@/lib/user-context";
import { ChayvaLogo } from "@/components/ChayvaLogo";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Navigation definition — maps to the product journey
// ---------------------------------------------------------------------------

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: "/dashboard" as const, label: "Today", icon: LayoutDashboard },
      { to: "/add" as const, label: "Capture", icon: Plus },
      { to: "/expenses" as const, label: "Journal", icon: BookOpen },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/week" as const, label: "This Week", icon: CalendarDays },
      { to: "/dna" as const, label: "Spend DNA", icon: Dna },
      { to: "/reflect" as const, label: "Reflect", icon: MoonStar },
      { to: "/journey" as const, label: "Journey", icon: MapPin },
    ],
  },
  {
    label: "You",
    items: [
      { to: "/profile" as const, label: "Profile", icon: UserRound },
    ],
  },
];

// Mobile bottom nav shows curated 5 tabs
const MOBILE_TABS = [
  { to: "/dashboard" as const, label: "Today", icon: LayoutDashboard },
  { to: "/add" as const, label: "Capture", icon: Plus },
  { to: "/expenses" as const, label: "Journal", icon: BookOpen },
  { to: "/reflect" as const, label: "Reflect", icon: MoonStar },
  { to: "/profile" as const, label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout, user } = useUser();

  function signOut() {
    logout();
    navigate({ to: "/auth", replace: true });
  }

  const displayName = (user as any)?.display_name ?? (user as any)?.email?.split("@")[0] ?? "You";

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 md:px-6 lg:px-8">

        {/* ----------------------------------------------------------------- */}
        {/* SIDEBAR — desktop                                                  */}
        {/* ----------------------------------------------------------------- */}
        <aside className="glass hidden w-56 shrink-0 flex-col rounded-2xl md:flex lg:w-60" style={{ minHeight: "calc(100vh - 3rem)", maxHeight: "calc(100vh - 3rem)", position: "sticky", top: "1.5rem" }}>
          {/* Brand */}
          <div className="px-5 pt-6 pb-4">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <ChayvaLogo className="h-8 w-8" />
              <div>
                <span className="block text-base font-bold tracking-tight leading-none">Chayva</span>
                <span className="block text-[0.6rem] text-muted-foreground tracking-[0.14em] uppercase mt-0.5">AI Companion</span>
              </div>
            </Link>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-border opacity-60" />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.label ?? "main"}>
                {group.label && (
                  <p className="nav-group-label">{group.label}</p>
                )}
                {group.items.map(({ to, label, icon: Icon }) => {
                  const active = pathname === to;
                  return (
                    <Link key={to} to={to} className={`nav-item ${active ? "active" : ""}`}>
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl bg-gradient-primary shadow-[var(--shadow-glow-sm)]"
                          transition={{ type: "spring", stiffness: 400, damping: 34 }}
                        />
                      )}
                      <Icon className="relative h-4 w-4 shrink-0" />
                      <span className="relative">{label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Divider */}
          <div className="mx-4 h-px bg-border opacity-60" />

          {/* Footer — user + actions */}
          <div className="px-3 py-4 space-y-0.5">
            {/* User identity */}
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium truncate">{displayName}</span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="nav-item w-full"
            >
              {theme === "dark"
                ? <Sun className="h-4 w-4 shrink-0" />
                : <Moon className="h-4 w-4 shrink-0" />}
              <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>

            {/* Sign out */}
            <button onClick={signOut} className="nav-item w-full">
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* ----------------------------------------------------------------- */}
        {/* MAIN CONTENT                                                       */}
        {/* ----------------------------------------------------------------- */}
        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </main>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MOBILE BOTTOM NAV                                                    */}
      {/* ------------------------------------------------------------------- */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-30 glass-strong border-t border-border/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch justify-around px-2 py-2">
          {MOBILE_TABS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[0.65rem] font-medium transition-colors min-w-[3.5rem] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon className="relative h-5 w-5" />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
