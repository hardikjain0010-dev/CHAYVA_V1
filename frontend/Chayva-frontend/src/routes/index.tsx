import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { HeartPulse, Sparkles, MoonStar, Dna, Compass, Brain, ArrowRight } from "lucide-react";
import { ArthyneLogo } from "@/components/ArthyneLogo";
import { BRAND_NAME } from "@/lib/brand";
import { useUser } from "@/lib/user-context";
import { isStandaloneMode } from "@/lib/pwa";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      {
        title: `${BRAND_NAME} — Behavioral Finance Coach`,
      },
      {
        name: "description",
        content:
          `Understand the emotions behind your spending and build mindful financial habits with ${BRAND_NAME}.`,
      },
      {
        property: "og:title",
        content: `${BRAND_NAME} — Behavioral Finance Coach`,
      },
      {
        property: "og:description",
        content:
          `Understand the emotions behind your spending with your AI behavioral finance coach ${BRAND_NAME}.`,
      },
    ],
  }),
});

const features = [
  {
    icon: HeartPulse,
    title: "Track Mood, Not Just Money",
    body: "Record how you feel whenever you spend. Discover emotional spending triggers.",
  },
  {
    icon: Dna,
    title: "Spend DNA",
    body: "Understand your unique financial personality and spending habits.",
  },
  {
    icon: MoonStar,
    title: "Daily Reflection",
    body: "End every day with mindful reflections and healthier intentions.",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    body: "Receive intelligent behavioural insights based on your financial patterns.",
  },
  {
    icon: Compass,
    title: "Your Journey",
    body: "Celebrate milestones of self-awareness instead of just saving money.",
  },
  {
    icon: Brain,
    title: "Mindfulness Score",
    body: "See how intentional your spending becomes over time.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useUser();

  // In standalone / installed PWA mode, launch directly into the application flow
  useEffect(() => {
    if (isStandaloneMode()) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <ArthyneLogo className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight text-gradient">{BRAND_NAME}</span>
        </Link>

        <div className="flex items-center gap-4">
          {!loading && user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:scale-105"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium hover:text-primary">
                Sign In
              </Link>

              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="rounded-lg bg-gradient-primary px-5 py-2 text-primary-foreground shadow-lg transition hover:scale-105"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:pt-12">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <h1 className="mt-4 text-5xl font-bold leading-tight md:text-7xl">
            Understand the
            <br />
            <span className="text-gradient">Why</span> Behind Your Money
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
            {BRAND_NAME} is your AI behavioural finance coach. Discover why you spend, understand
            emotional triggers, and build healthier financial habits with confidence.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {!loading && user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-lg transition hover:scale-105 text-base"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="rounded-xl bg-gradient-primary px-7 py-3 font-semibold text-primary-foreground shadow-lg transition hover:scale-105"
                >
                  Start Your Journey
                </Link>

                <Link
                  to="/auth"
                  className="glass rounded-xl px-7 py-3 font-semibold transition hover:scale-105"
                >
                  I Have an Account
                </Link>
              </>
            )}
          </div>
        </motion.section>

        {/* Features */}
        <section className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.08,
                duration: 0.4,
              }}
              whileHover={{
                y: -5,
              }}
              className="glass rounded-3xl p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                <Icon className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-xl font-semibold">{title}</h3>

              <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
            </motion.div>
          ))}
        </section>
      </main>

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <footer className="relative mt-12 overflow-hidden">
        {/* ── Divider ── */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="h-px w-full" style={{ background: "var(--divider)" }} />
        </div>

        {/* ── Navigation + brand ── */}
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand column */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <ArthyneLogo className="h-8 w-8" />
                <span className="text-xl font-bold tracking-tight">{BRAND_NAME}</span>
              </div>

              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Behavioral finance, reimagined.
              </p>
            </div>

            {/* Product column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                Product
              </p>
              <nav className="mt-4 flex flex-col gap-2.5">
                <Link
                  to="/dashboard"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
                <Link
                  to="/add"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Add Expense
                </Link>
                <Link
                  to="/week"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Weekly Insights
                </Link>
                <Link
                  to="/dna"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Spend DNA
                </Link>
              </nav>
            </div>

            {/* Experience column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                Experience
              </p>
              <nav className="mt-4 flex flex-col gap-2.5">
                <Link
                  to="/reflect"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Reflect
                </Link>
                <Link
                  to="/journey"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Journey
                </Link>
                <Link
                  to="/expenses"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Expense Journal
                </Link>
                <Link
                  to="/profile"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Profile
                </Link>
              </nav>
            </div>

            {/* Account column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                Account
              </p>
              <nav className="mt-4 flex flex-col gap-2.5">
                <Link
                  to="/auth"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Login
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Get Started
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="h-px w-full" style={{ background: "var(--divider)" }} />
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <ArthyneLogo className="h-5 w-5" />
            <span className="text-xs text-muted-foreground/70">
              Behavioral finance, reimagined.
            </span>
          </div>
          <p className="text-xs text-muted-foreground/50">© {new Date().getFullYear()} {BRAND_NAME}</p>
        </div>
      </footer>
    </div>
  );
}
