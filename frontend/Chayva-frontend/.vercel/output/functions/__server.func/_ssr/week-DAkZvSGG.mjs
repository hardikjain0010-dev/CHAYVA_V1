import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { d as useExpenses, u as useCoaching } from "./coaching-context-Du82W5cg.mjs";
import { L as Coffee, S as Moon, d as Sprout, l as Target, o as TrendingUp, s as TrendingDown } from "../_libs/lucide-react.mjs";
import { r as PageTransition } from "./ui-helpers-DcHruk01.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/week-DAkZvSGG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function WeekPage() {
	const { loading } = useExpenses();
	const { snapshot, loading: dataLoading, error, refetch } = useCoaching();
	const weekly = snapshot?.weekly;
	const metrics = (0, import_react.useMemo)(() => {
		return {
			totalSpend: snapshot?.stats.weekly_spend ?? 0,
			avgDailySpend: (snapshot?.stats.weekly_spend ?? 0) / 7,
			topCategory: snapshot?.personality.favorite_category ?? "—",
			topTrigger: weekly?.top_trigger ?? snapshot?.trigger.top_trigger ?? "—",
			mindfulness: snapshot?.personality.mindfulness_score ?? snapshot?.spend_dna?.mindfulness_score ?? null
		};
	}, [snapshot, weekly]);
	const sections = [
		{
			title: "Behavior summary",
			value: weekly?.behavior_summary ?? weekly?.weekly_narrative
		},
		{
			title: "Improvements",
			value: weekly?.improvements ?? weekly?.biggest_improvement
		},
		{
			title: "Regressions",
			value: weekly?.regressions
		},
		{
			title: "Trigger changes",
			value: weekly?.trigger_changes
		},
		{
			title: "Mood changes",
			value: weekly?.mood_changes
		},
		{
			title: "Category trends",
			value: weekly?.category_trends
		},
		{
			title: "Personality changes",
			value: weekly?.personality_changes
		},
		{
			title: "Coach recommendation",
			value: weekly?.coach_recommendation ?? weekly?.coach_advice
		}
	];
	if (loading || dataLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTransition, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-3xl font-semibold tracking-tight",
			children: "This Week"
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "grid gap-4 sm:grid-cols-2",
			children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "glass h-32 animate-pulse rounded-2xl" }, i))
		})]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTransition, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-semibold tracking-tight",
				children: "This Week"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted-foreground",
				children: "AI-first weekly coaching — what shifted, what improved, and what your coach recommends next."
			})] }),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => void refetch(),
						className: "rounded-lg border border-destructive/30 px-3 py-1",
						children: "Retry"
					})]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "glass rounded-2xl p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.2em] text-accent",
						children: "Weekly narrative"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 text-2xl font-semibold",
						children: weekly?.weekly_narrative ?? "Your weekly read will appear after a few logged days."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-base leading-relaxed text-foreground/85",
						children: weekly?.spending_pattern ?? weekly?.behavior_changes
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full border border-foreground/10 bg-background/40 px-3 py-1",
							children: ["Top category: ", metrics.topCategory]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full border border-foreground/10 bg-background/40 px-3 py-1",
							children: ["Top trigger: ", metrics.topTrigger]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid gap-4 md:grid-cols-2",
				children: sections.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass rounded-2xl p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold uppercase tracking-[0.15em] text-accent",
						children: section.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-base leading-relaxed text-foreground/85",
						children: section.value ?? "—"
					})]
				}, section.title))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						icon: Sprout,
						emoji: "🌱",
						title: "Mindfulness",
						value: metrics.mindfulness != null ? `${metrics.mindfulness}/100 mindfulness score this week.` : weekly?.mood_changes ?? "—",
						sub: "From your live coaching snapshot",
						positive: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						icon: Target,
						emoji: "💸",
						title: "Spend snapshot",
						value: `You spent ₹${metrics.totalSpend.toFixed(2)} this week.`,
						sub: `Average ₹${metrics.avgDailySpend.toFixed(2)} per day`,
						positive: metrics.totalSpend <= metrics.avgDailySpend * 7 + 1e3
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						icon: Moon,
						emoji: "🌙",
						title: "One win",
						value: weekly?.one_win ?? "—",
						sub: "Generated by summarize.py",
						positive: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
						icon: Coffee,
						emoji: "✨",
						title: "Coach recommendation",
						value: weekly?.coach_recommendation ?? weekly?.coach_advice ?? "—",
						sub: "Your next gentle behavioral nudge",
						positive: true
					})
				]
			})
		]
	}) });
}
function MetricCard({ icon: Icon, emoji, title, value, sub, positive }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "glass rounded-2xl p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xl",
						children: emoji
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold",
						children: title
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "grid h-8 w-8 place-items-center rounded-lg bg-foreground/5",
					children: [positive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "h-4 w-4 text-accent" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-4 w-4 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "hidden" })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-base leading-relaxed",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted-foreground",
				children: sub
			})
		]
	});
}
//#endregion
export { WeekPage as component };
