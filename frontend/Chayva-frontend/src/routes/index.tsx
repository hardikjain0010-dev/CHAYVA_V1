import { Button } from "@/components/ui/button";
export default function Dashboard() {
  return (
    <div className="p-10">

      <Button
        onClick={() => alert("Button works!")}
      >
        Click Me
      </Button>

    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Brain,
  HeartPulse,
  Sparkles,
  MoonStar,
  Dna,
  Compass,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      {
        title: "Chayva — Behavioral Finance Coach",
      },
      {
        name: "description",
        content:
          "Understand the emotions behind your spending and build mindful financial habits with Chayva.",
      },
      {
        property: "og:title",
        content: "Chayva — Behavioral Finance Coach",
      },
      {
        property: "og:description",
        content:
          "Understand the emotions behind your spending with your AI behavioral finance coach.",
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
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link
          to="/"
          className="text-2xl font-bold text-gradient"
        >
          Chayva
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/auth"
            className="text-sm font-medium hover:text-primary"
          >
            Sign In
          </Link>

          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-lg bg-gradient-primary px-5 py-2 text-primary-foreground shadow-lg transition hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            Behavioral Finance Reimagined
          </div>

          <h1 className="mt-8 text-5xl font-bold leading-tight md:text-7xl">
            Understand the
            <br />
            <span className="text-gradient">Why</span>
            {" "}Behind Your Money
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
            Chayva is your AI behavioural finance coach. Discover why you spend,
            understand emotional triggers, and build healthier financial habits
            with confidence.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
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
          </div>
        </motion.section>

        {/* Features */}
        <section className="mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

              <h3 className="mt-5 text-xl font-semibold">
                {title}
              </h3>

              <p className="mt-2 leading-relaxed text-muted-foreground">
                {body}
              </p>
            </motion.div>
          ))}
        </section>

        {/* Belief */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-10 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
            Our Belief
          </p>

          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold leading-relaxed">
            Progress isn't measured by spending less.
            <br />
            It's measured by understanding yourself better.
          </h2>
        </motion.section>
      </main>
    </div>
  );
}