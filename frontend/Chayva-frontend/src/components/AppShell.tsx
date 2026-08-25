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
  X,
  Compass,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "@/lib/theme";
import { useUser } from "@/lib/user-context";
import { CaayvaLogo } from "@/components/CaayvaLogo";

// ---------------------------------------------------------------------------
// Centralized Navigation Architecture (Single Source of Truth)
// ---------------------------------------------------------------------------

// Primary destinations (Bottom Navigation on Mobile)
export const PRIMARY_NAV_ITEMS = [
  { to: "/dashboard" as const, label: "Today", icon: LayoutDashboard },
  { to: "/expenses" as const, label: "Journal", icon: BookOpen },
  { to: "/add" as const, label: "Capture", icon: Plus, isAction: true },
  { to: "/reflect" as const, label: "Reflect", icon: MoonStar },
];

// Secondary destinations (Insights group inside More Bottom Sheet)
export const SECONDARY_INSIGHTS = [
  {
    to: "/week" as const,
    label: "This Week",
    description: "Your behavioral week",
    icon: CalendarDays,
  },
  {
    to: "/dna" as const,
    label: "Spend DNA",
    description: "Your spending identity",
    icon: Dna,
  },
  {
    to: "/journey" as const,
    label: "Journey",
    description: "How your awareness evolves",
    icon: MapPin,
  },
];

// Secondary destinations (Account group inside More Bottom Sheet)
export const SECONDARY_ACCOUNT = [
  {
    to: "/profile" as const,
    label: "Profile",
    description: "Personal context & settings",
    icon: UserRound,
  },
];

// Desktop Sidebar Navigation (All groups presented together)
export const DESKTOP_NAV_GROUPS = [
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

const SECONDARY_PATHS = ["/week", "/dna", "/journey", "/profile"];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout, user } = useUser();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  function signOut() {
    setMoreSheetOpen(false);
    logout();
    navigate({ to: "/auth", replace: true });
  }

  // Manage body scroll locking when mobile bottom sheet is open
  useEffect(() => {
    if (moreSheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreSheetOpen]);

  // Close sheet on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && moreSheetOpen) {
        setMoreSheetOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moreSheetOpen]);

  // Close sheet on route change
  useEffect(() => {
    setMoreSheetOpen(false);
  }, [pathname]);

  const displayName = (user as any)?.display_name ?? (user as any)?.email?.split("@")[0] ?? "You";
  const userEmail = (user as any)?.email ?? "";
  const isMoreActive = SECONDARY_PATHS.includes(pathname);

  return (
    <div className="min-h-screen">
      {/* ----------------------------------------------------------------- */}
      {/* MOBILE TOP BAR (Brand + Theme toggle only — No hamburger)         */}
      {/* ----------------------------------------------------------------- */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 glass-strong border-b border-border/60 px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <CaayvaLogo className="h-7 w-7" />
          <span className="text-lg font-bold tracking-tight text-gradient">Caayva</span>
        </Link>

        {/* Theme toggle only */}
        <button
          onClick={toggle}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground active:scale-95"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 md:px-6 lg:px-8">
        {/* ----------------------------------------------------------------- */}
        {/* SIDEBAR — Desktop                                                  */}
        {/* ----------------------------------------------------------------- */}
        <aside
          className="glass hidden w-56 shrink-0 flex-col rounded-2xl md:flex lg:w-60"
          style={{
            minHeight: "calc(100vh - 3rem)",
            maxHeight: "calc(100vh - 3rem)",
            position: "sticky",
            top: "1.5rem",
          }}
        >
          {/* Brand */}
          <div className="px-5 pt-6 pb-4">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <CaayvaLogo className="h-8 w-8" />
              <div>
                <span className="block text-base font-bold tracking-tight leading-none">Caayva</span>
                <span className="block text-[0.6rem] text-muted-foreground tracking-[0.14em] uppercase mt-0.5">
                  AI Companion
                </span>
              </div>
            </Link>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-border opacity-60" />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            {DESKTOP_NAV_GROUPS.map((group) => (
              <div key={group.label ?? "main"}>
                {group.label && <p className="nav-group-label">{group.label}</p>}
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
            <button onClick={toggle} className="nav-item w-full">
              {theme === "dark" ? (
                <Sun className="h-4 w-4 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 shrink-0" />
              )}
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
        <main className="min-w-0 flex-1 pt-14 pb-28 md:pt-0 md:pb-0">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </main>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MOBILE BOTTOM NAVIGATION (Primary Destinations)                     */}
      {/* ------------------------------------------------------------------- */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-30 glass-strong border-t border-border/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          {PRIMARY_NAV_ITEMS.map(({ to, label, icon: Icon, isAction }) => {
            const active = pathname === to && !moreSheetOpen;
            if (isAction) {
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative flex flex-col items-center justify-center p-1"
                  aria-label={label}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)] active:scale-95 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[0.65rem] font-medium text-foreground mt-0.5">{label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={to}
                to={to}
                className={`relative flex min-h-[44px] min-w-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-[0.65rem] font-medium transition-colors ${
                  active ? "text-primary font-semibold" : "text-muted-foreground"
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

          {/* More (Secondary Navigation Hub Trigger) */}
          <button
            onClick={() => setMoreSheetOpen((prev) => !prev)}
            aria-label="Open more options"
            className={`relative flex min-h-[44px] min-w-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-[0.65rem] font-medium transition-colors ${
              isMoreActive || moreSheetOpen
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {(isMoreActive || moreSheetOpen) && (
              <motion.span
                layoutId="mobile-more-active"
                className="absolute inset-0 rounded-xl bg-primary/10"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <Compass className="relative h-5 w-5" />
            <span className="relative">More</span>
          </button>
        </div>
      </nav>

      {/* ------------------------------------------------------------------- */}
      {/* MORE BOTTOM SHEET (Secondary Navigation Hub — No Duplicates)        */}
      {/* ------------------------------------------------------------------- */}
      <AnimatePresence>
        {moreSheetOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMoreSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-lg rounded-t-3xl glass-strong border-t border-border/70 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
              }}
            >
              {/* Drag Handle Indicator */}
              <div className="pt-3 pb-1 flex justify-center">
                <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Sheet Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-[var(--shadow-glow-sm)]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    {userEmail && (
                      <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setMoreSheetOpen(false)}
                  className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border/50 text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground active:scale-95"
                  aria-label="Close sheet"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sheet Body — Secondary Destinations */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 1. INSIGHTS GROUP */}
                <div>
                  <p className="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                    Insights
                  </p>
                  <div className="space-y-1.5">
                    {SECONDARY_INSIGHTS.map(({ to, label, description, icon: Icon }) => {
                      const active = pathname === to;
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setMoreSheetOpen(false)}
                          className={`flex items-center justify-between rounded-2xl p-3 text-sm font-medium transition ${
                            active
                              ? "bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-sm)]"
                              : "border border-border/40 bg-foreground/[0.02] text-foreground hover:bg-foreground/[0.06] active:bg-foreground/[0.08]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`grid h-8 w-8 place-items-center rounded-xl shrink-0 ${
                                active
                                  ? "bg-white/20 text-white"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm leading-tight">{label}</p>
                              <p
                                className={`text-xs truncate ${
                                  active ? "text-white/80" : "text-muted-foreground"
                                }`}
                              >
                                {description}
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 ${
                              active ? "text-white/80" : "text-muted-foreground/60"
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* 2. YOU / ACCOUNT GROUP */}
                <div>
                  <p className="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                    You
                  </p>
                  <div className="space-y-1.5">
                    {SECONDARY_ACCOUNT.map(({ to, label, description, icon: Icon }) => {
                      const active = pathname === to;
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setMoreSheetOpen(false)}
                          className={`flex items-center justify-between rounded-2xl p-3 text-sm font-medium transition ${
                            active
                              ? "bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-sm)]"
                              : "border border-border/40 bg-foreground/[0.02] text-foreground hover:bg-foreground/[0.06] active:bg-foreground/[0.08]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`grid h-8 w-8 place-items-center rounded-xl shrink-0 ${
                                active
                                  ? "bg-white/20 text-white"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm leading-tight">{label}</p>
                              <p
                                className={`text-xs truncate ${
                                  active ? "text-white/80" : "text-muted-foreground"
                                }`}
                              >
                                {description}
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 ${
                              active ? "text-white/80" : "text-muted-foreground/60"
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* 3. PREFERENCES & ACTIONS */}
                <div>
                  <p className="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                    Preferences
                  </p>
                  <div className="space-y-2">
                    {/* Appearance toggle */}
                    <button
                      onClick={toggle}
                      className="flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-border/40 bg-foreground/[0.02] px-3.5 py-2.5 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                          {theme === "dark" ? (
                            <Sun className="h-4 w-4" />
                          ) : (
                            <Moon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm leading-tight">Appearance</p>
                          <p className="text-xs text-muted-foreground">
                            Currently {theme === "dark" ? "Dark mode" : "Light mode"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                        {theme}
                      </span>
                    </button>

                    {/* Sign out */}
                    <button
                      onClick={signOut}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10 active:scale-[0.99]"
                    >
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/10 text-destructive shrink-0">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm leading-tight">Sign out</p>
                        <p className="text-xs text-destructive/70">End current session</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
