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
  Menu,
  X,
  Compass,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "@/lib/theme";
import { useUser } from "@/lib/user-context";
import { ChayvaLogo } from "@/components/ChayvaLogo";

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

// Mobile bottom navigation tabs
const MOBILE_BOTTOM_TABS = [
  { to: "/dashboard" as const, label: "Today", icon: LayoutDashboard },
  { to: "/expenses" as const, label: "Journal", icon: BookOpen },
  { to: "/add" as const, label: "Capture", icon: Plus, isAction: true },
  { to: "/reflect" as const, label: "Reflect", icon: MoonStar },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout, user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function signOut() {
    setMobileMenuOpen(false);
    logout();
    navigate({ to: "/auth", replace: true });
  }

  // Manage body scroll locking when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const displayName = (user as any)?.display_name ?? (user as any)?.email?.split("@")[0] ?? "You";
  const userEmail = (user as any)?.email ?? "";

  return (
    <div className="min-h-screen">
      {/* ----------------------------------------------------------------- */}
      {/* MOBILE TOP BAR (visible on mobile < md)                            */}
      {/* ----------------------------------------------------------------- */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 glass-strong border-b border-border/60 px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <ChayvaLogo className="h-7 w-7" />
          <span className="text-lg font-bold tracking-tight text-gradient">Chayva</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {/* Quick theme toggle */}
          <button
            onClick={toggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Menu / Drawer button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/50 text-foreground transition hover:bg-foreground/5 active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 md:px-6 lg:px-8">
        {/* ----------------------------------------------------------------- */}
        {/* SIDEBAR — desktop                                                  */}
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
              <ChayvaLogo className="h-8 w-8" />
              <div>
                <span className="block text-base font-bold tracking-tight leading-none">Chayva</span>
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
            {NAV_GROUPS.map((group) => (
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
      {/* MOBILE BOTTOM NAV                                                    */}
      {/* ------------------------------------------------------------------- */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-30 glass-strong border-t border-border/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          {MOBILE_BOTTOM_TABS.map(({ to, label, icon: Icon, isAction }) => {
            const active = pathname === to;
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

          {/* More / Menu Drawer trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`relative flex min-h-[44px] min-w-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-[0.65rem] font-medium transition-colors ${
              ["/week", "/dna", "/journey", "/profile"].includes(pathname)
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {["/week", "/dna", "/journey", "/profile"].includes(pathname) && (
              <span className="absolute top-1.5 right-3.5 h-2 w-2 rounded-full bg-primary" />
            )}
            <Compass className="relative h-5 w-5" />
            <span className="relative">More</span>
          </button>
        </div>
      </nav>

      {/* ------------------------------------------------------------------- */}
      {/* MOBILE SLIDE-OVER NAVIGATION DRAWER                                */}
      {/* ------------------------------------------------------------------- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Drawer Pane */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative ml-auto flex h-full w-[85vw] max-w-sm flex-col glass-strong border-l border-border/60 shadow-2xl"
              style={{
                paddingTop: "env(safe-area-inset-top, 1rem)",
                paddingBottom: "env(safe-area-inset-bottom, 1rem)",
              }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/50">
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
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-4">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label ?? "main"}>
                    {group.label && (
                      <p className="px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                        {group.label}
                      </p>
                    )}
                    <div className="space-y-1">
                      {group.items.map(({ to, label, icon: Icon }) => {
                        const active = pathname === to;
                        return (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                              active
                                ? "bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow-sm)] font-semibold"
                                : "text-foreground/80 hover:bg-foreground/5 active:bg-foreground/10"
                            }`}
                          >
                            <Icon className="h-4.5 w-4.5 shrink-0" />
                            <span>{label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-border/50 space-y-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggle}
                  className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-border/60 bg-foreground/[0.03] px-3.5 py-2.5 text-sm font-medium text-foreground transition hover:bg-foreground/[0.07] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? (
                      <Sun className="h-4.5 w-4.5 text-primary" />
                    ) : (
                      <Moon className="h-4.5 w-4.5 text-primary" />
                    )}
                    <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    {theme}
                  </span>
                </button>

                {/* Sign Out */}
                <button
                  onClick={signOut}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10 active:scale-[0.99]"
                >
                  <LogOut className="h-4.5 w-4.5 shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
