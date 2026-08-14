import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { C as MoonStar, F as Dna, G as Brain, I as Compass, f as Sparkles, j as HeartPulse } from "../_libs/lucide-react.mjs";
import { t as motion } from "../_libs/framer-motion.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BWmbAHLR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90",
			outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		ref,
		type: !asChild ? type : void 0,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
});
Button.displayName = "Button";
function Dashboard() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			onClick: () => alert("Button works!"),
			children: "Click Me"
		})
	});
}
var features = [
	{
		icon: HeartPulse,
		title: "Track Mood, Not Just Money",
		body: "Record how you feel whenever you spend. Discover emotional spending triggers."
	},
	{
		icon: Dna,
		title: "Spend DNA",
		body: "Understand your unique financial personality and spending habits."
	},
	{
		icon: MoonStar,
		title: "Daily Reflection",
		body: "End every day with mindful reflections and healthier intentions."
	},
	{
		icon: Sparkles,
		title: "AI Insights",
		body: "Receive intelligent behavioural insights based on your financial patterns."
	},
	{
		icon: Compass,
		title: "Your Journey",
		body: "Celebrate milestones of self-awareness instead of just saving money."
	},
	{
		icon: Brain,
		title: "Mindfulness Score",
		body: "See how intentional your spending becomes over time."
	}
];
function Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mx-auto flex max-w-7xl items-center justify-between px-6 py-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "text-2xl font-bold text-gradient",
				children: "Chayva"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/auth",
					className: "text-sm font-medium hover:text-primary",
					children: "Sign In"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/auth",
					search: { mode: "signup" },
					className: "rounded-lg bg-gradient-primary px-5 py-2 text-primary-foreground shadow-lg transition hover:scale-105",
					children: "Get Started"
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-7xl px-6 pb-24 pt-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.section, {
					initial: {
						opacity: 0,
						y: 25
					},
					animate: {
						opacity: 1,
						y: 0
					},
					transition: { duration: .7 },
					className: "text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 text-accent" }), "Behavioral Finance Reimagined"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "mt-8 text-5xl font-bold leading-tight md:text-7xl",
							children: [
								"Understand the",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-gradient",
									children: "Why"
								}),
								" ",
								"Behind Your Money"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mx-auto mt-6 max-w-3xl text-lg text-muted-foreground",
							children: "Chayva is your AI behavioural finance coach. Discover why you spend, understand emotional triggers, and build healthier financial habits with confidence."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-10 flex flex-wrap justify-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/auth",
								search: { mode: "signup" },
								className: "rounded-xl bg-gradient-primary px-7 py-3 font-semibold text-primary-foreground shadow-lg transition hover:scale-105",
								children: "Start Your Journey"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/auth",
								className: "glass rounded-xl px-7 py-3 font-semibold transition hover:scale-105",
								children: "I Have an Account"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-3",
					children: features.map(({ icon: Icon, title, body }, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						initial: {
							opacity: 0,
							y: 25
						},
						whileInView: {
							opacity: 1,
							y: 0
						},
						viewport: { once: true },
						transition: {
							delay: index * .08,
							duration: .4
						},
						whileHover: { y: -5 },
						className: "glass rounded-3xl p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-6 w-6" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-5 text-xl font-semibold",
								children: title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 leading-relaxed text-muted-foreground",
								children: body
							})
						]
					}, title))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.section, {
					initial: { opacity: 0 },
					whileInView: { opacity: 1 },
					viewport: { once: true },
					className: "mt-24 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-10 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold uppercase tracking-[0.25em] text-accent",
						children: "Our Belief"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "mx-auto mt-6 max-w-3xl text-3xl font-semibold leading-relaxed",
						children: [
							"Progress isn't measured by spending less.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"It's measured by understanding yourself better."
						]
					})]
				})
			]
		})]
	});
}
//#endregion
export { Landing as component, Dashboard as default };
