import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { d as useExpenses, u as useCoaching } from "./coaching-context-Du82W5cg.mjs";
import { I as Compass, K as Award, M as Flame, N as Flag, f as Sparkles, i as Trophy, w as MapPin } from "../_libs/lucide-react.mjs";
import { t as motion } from "../_libs/framer-motion.mjs";
import { r as PageTransition } from "./ui-helpers-DcHruk01.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/journey-BHsPqIim.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function daysAgo(iso) {
	return Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
}
function bucketLabel(days) {
	if (days === 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days} days ago`;
	if (days < 14) return "1 week ago";
	if (days < 28) return `${Math.round(days / 7)} weeks ago`;
	if (days < 60) return "1 month ago";
	return `${Math.round(days / 30)} months ago`;
}
function JourneyPage() {
	const { expenses, loading: expensesLoading } = useExpenses();
	const { snapshot, loading, error, refetch } = useCoaching();
	const milestones = (0, import_react.useMemo)(() => {
		const iconFor = (title) => {
			if (title.includes("Started")) return Flag;
			if (title.includes("Streak")) return Flame;
			if (title.includes("Reflection")) return Compass;
			if (title.includes("Insight")) return Sparkles;
			if (title.includes("Personality") || title.includes("DNA")) return Trophy;
			if (title.includes("Summary") || title.includes("Expenses")) return Award;
			return MapPin;
		};
		return (snapshot?.journey.milestones ?? []).map((milestone, index) => ({
			icon: iconFor(milestone.title),
			when: milestone.date ? bucketLabel(daysAgo(milestone.date)) : "Now",
			title: milestone.title,
			desc: milestone.description ?? "A new step in your behavior journey.",
			tone: index % 3 === 0 ? "primary" : index % 3 === 1 ? "accent" : "success"
		}));
	}, [snapshot]);
	const toneClass = {
		primary: "bg-gradient-primary text-primary-foreground",
		accent: "bg-accent/20 text-accent border border-accent/30",
		success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTransition, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-5 w-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.2em] text-accent",
					children: "Milestones"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-4xl font-semibold tracking-tight md:text-5xl",
					children: "Your Journey"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 max-w-2xl text-base text-muted-foreground",
				children: "Every expense tells a story. These are the moments and habits that have shaped your financial behavior — how far you’ve come, and where you’re headed."
			})] }),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => void refetch(),
					className: "rounded-lg border border-foreground/10 px-3 py-1",
					children: "Retry"
				})]
			}) : null,
			expensesLoading || loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 sm:grid-cols-2",
				children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "glass h-32 animate-pulse rounded-2xl" }, i))
			}) : milestones.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "glass rounded-2xl p-10 text-center text-muted-foreground",
				children: "Log a few expenses and your journey will start writing itself here."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid gap-4 sm:grid-cols-2",
				children: milestones.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.article, {
					initial: {
						opacity: 0,
						y: 24
					},
					animate: {
						opacity: 1,
						y: 0
					},
					transition: {
						delay: i * .06,
						duration: .4,
						ease: [
							.22,
							1,
							.36,
							1
						]
					},
					whileHover: { y: -4 },
					className: "glass relative overflow-hidden rounded-2xl p-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `grid h-12 w-12 shrink-0 place-items-center rounded-xl shadow-[var(--shadow-glow)] ${toneClass[m.tone]}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.icon, { className: "h-5 w-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs uppercase tracking-[0.15em] text-muted-foreground",
								children: m.when
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-1 text-lg font-semibold",
								children: m.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-relaxed text-muted-foreground",
								children: m.desc
							})
						] })]
					})
				}, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-sm italic text-muted-foreground",
				children: "Progress isn't measured by spending less — it's measured by understanding yourself better."
			})
		]
	}) });
}
//#endregion
export { JourneyPage as component };
