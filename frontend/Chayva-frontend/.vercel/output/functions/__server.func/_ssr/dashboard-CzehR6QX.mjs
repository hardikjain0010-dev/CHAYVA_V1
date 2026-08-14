import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { d as useExpenses, u as useCoaching } from "./coaching-context-Du82W5cg.mjs";
import { U as Calendar, _ as RefreshCw, a as TriangleAlert, f as Sparkles, n as Wallet, o as TrendingUp } from "../_libs/lucide-react.mjs";
import { t as motion } from "../_libs/framer-motion.mjs";
import { n as CountUp, r as PageTransition, t as CategoryIcon } from "./ui-helpers-DcHruk01.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Tooltip, i as ResponsiveContainer, n as Pie, r as Cell, t as PieChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-CzehR6QX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var COLORS = [
	"oklch(0.72 0.19 300)",
	"oklch(0.78 0.15 195)",
	"oklch(0.75 0.18 85)",
	"oklch(0.7 0.2 15)",
	"oklch(0.68 0.17 145)",
	"oklch(0.7 0.2 260)"
];
function localSpendTotals(expenses) {
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const weekAgo = Date.now() - 7 * 864e5;
	let todaySpend = 0;
	let weekSpend = 0;
	for (const expense of expenses) {
		if (expense.date.slice(0, 10) === today) todaySpend += expense.amount;
		const ts = new Date(expense.date).getTime();
		if (!Number.isNaN(ts) && ts >= weekAgo) weekSpend += expense.amount;
	}
	return {
		todaySpend,
		weekSpend
	};
}
function DashboardPage() {
	const { expenses } = useExpenses();
	const { snapshot, loading, error, refetch } = useCoaching();
	const [expandedExpenseId, setExpandedExpenseId] = (0, import_react.useState)(null);
	const localTotals = (0, import_react.useMemo)(() => localSpendTotals(expenses), [expenses]);
	const totals = (0, import_react.useMemo)(() => {
		return {
			all: snapshot?.stats.total_spent ?? expenses.reduce((s, e) => s + e.amount, 0),
			today: snapshot?.stats.today_spend ?? localTotals.todaySpend,
			week: snapshot?.stats.weekly_spend ?? localTotals.weekSpend,
			count: snapshot?.stats.expense_count ?? expenses.length,
			mindfulness: snapshot?.personality.mindfulness_score ?? snapshot?.spend_dna?.mindfulness_score ?? null
		};
	}, [
		expenses,
		localTotals,
		snapshot
	]);
	const byCategory = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		Object.entries(snapshot?.analytics.categories ?? {}).forEach(([category, amount]) => map.set(category, amount));
		if (map.size === 0) expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
		return Array.from(map, ([name, value]) => ({
			name,
			value
		})).sort((a, b) => b.value - a.value);
	}, [expenses, snapshot]);
	const coachHeadline = snapshot?.coach.headline ?? snapshot?.coach.behavior_insight ?? snapshot?.weekly.weekly_narrative ?? null;
	const personality = snapshot?.personality;
	const trigger = snapshot?.trigger;
	const nudge = snapshot?.nudge;
	const timeline = snapshot?.behavior_timeline ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTransition, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.2em] text-accent",
						children: "Your coach"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 text-4xl font-semibold tracking-tight md:text-5xl",
						children: "Good to see you."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-base text-muted-foreground",
						children: "Chayva is reading why you spend, not just what you spend."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/add",
					className: "rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.03] active:scale-[0.98]",
					children: "+ Add expense"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.section, {
				initial: {
					opacity: 0,
					y: 20
				},
				animate: {
					opacity: 1,
					y: 0
				},
				className: "relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent p-8 md:p-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-5 w-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs uppercase tracking-[0.2em] text-accent",
									children: "Today's Coach"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-xl font-semibold md:text-2xl",
									children: "Your behavioral read right now"
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => void refetch(),
								disabled: loading,
								"aria-label": "Refresh dashboard",
								className: "rounded-full border border-foreground/10 bg-foreground/5 p-2 text-muted-foreground transition hover:text-foreground disabled:opacity-60",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `h-4 w-4 ${loading ? "animate-spin" : ""}` })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-6 min-h-[5rem] text-lg leading-relaxed text-foreground/90 md:text-2xl",
							children: loading && !coachHeadline ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-5 w-4/5 animate-pulse rounded bg-foreground/10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-5 w-3/5 animate-pulse rounded bg-foreground/10" })]
							}) : coachHeadline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: coachHeadline }) : expenses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: "Add a few expenses and your coach will start explaining the why behind them."
							}) : null
						}),
						snapshot?.coach.behavior_insight && snapshot.coach.behavior_insight !== coachHeadline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-base text-muted-foreground",
							children: snapshot.coach.behavior_insight
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 text-sm text-muted-foreground",
							children: ["Suggestion: ", snapshot?.coach.coach_suggestion ?? nudge?.suggested_action ?? "Keep logging mood and notes with each expense."]
						})
					]
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-[0.2em] text-accent",
							children: "Prediction"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 text-lg font-semibold",
						children: "What your coach sees coming"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-base leading-relaxed",
						children: nudge?.prediction ?? snapshot?.coach.today_prediction ?? "No current prediction yet — add a few expenses with mood and notes so the backend coach can identify patterns."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Suggested action",
								value: nudge?.suggested_action ?? snapshot?.coach.coach_suggestion ?? "Keep logging mood and notes — the backend coach will turn that context into a more specific action."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Risk level",
								value: nudge?.risk_level ?? trigger?.current_trigger_risk
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Confidence",
								value: nudge?.confidence != null ? `${Math.round(nudge.confidence * 100)}%` : null
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Upcoming risk",
								value: nudge?.upcoming_risk ?? trigger?.top_trigger
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "glass rounded-2xl p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "Behavior overview"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Live read from your latest AI coaching snapshot"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Behavior trend",
								value: snapshot?.weekly.behavior_changes
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Mindfulness",
								value: totals.mindfulness != null ? `${totals.mindfulness}/100` : null
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Behavior pattern",
								value: snapshot?.spend_dna?.behavior_pattern ?? trigger?.recurring_pattern
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Coach advice",
								value: personality?.coach_advice ?? snapshot?.weekly.coach_recommendation
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "glass rounded-2xl p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "Current personality"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Type",
								value: personality?.type ?? personality?.personality_type
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Confidence",
								value: personality?.confidence != null ? `${Math.round(personality.confidence * 100)}%` : null
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Reason",
								value: personality?.confidence_reason
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
								label: "Last updated",
								value: personality?.last_updated ? new Date(personality.last_updated).toLocaleDateString() : null
							})
						]
					}),
					personality?.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm leading-relaxed text-muted-foreground",
						children: personality.description
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "glass rounded-2xl p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold",
					children: "Current trigger"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
							label: "Today's trigger",
							value: trigger?.today_trigger ?? trigger?.top_trigger
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
							label: "Most frequent",
							value: trigger?.most_frequent_trigger ?? trigger?.top_trigger
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
							label: "Trigger risk",
							value: trigger?.current_trigger_risk
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
							label: "Mood cue",
							value: trigger?.mood_trigger
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: Wallet,
						label: "Total spent",
						value: totals.all,
						prefix: "₹",
						decimals: 2
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: Calendar,
						label: "Today",
						value: totals.today,
						prefix: "₹",
						decimals: 2
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: TrendingUp,
						label: "Weekly spend",
						value: totals.week,
						prefix: "₹",
						decimals: 2
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: Wallet,
						label: "Expense count",
						value: totals.count
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "glass rounded-2xl p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold",
					children: "Spending by category"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "One chart to support the coach — not replace it"
				})] }), byCategory.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-64",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
								data: byCategory,
								dataKey: "value",
								innerRadius: 50,
								outerRadius: 82,
								paddingAngle: 3,
								children: byCategory.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: COLORS[i % COLORS.length] }, i))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
								background: "var(--popover, #1a1a2e)",
								border: "1px solid oklch(0.6 0 0 / 0.2)",
								borderRadius: 12
							} })] })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2 text-sm",
						children: byCategory.slice(0, 6).map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-2 rounded-xl border border-foreground/10 bg-background/40 px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "h-2.5 w-2.5 rounded-full",
										style: { background: COLORS[i % COLORS.length] }
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, {
										name: c.name,
										className: "h-3.5 w-3.5 text-muted-foreground"
									}),
									c.name
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground",
								children: ["₹", c.value.toFixed(2)]
							})]
						}, c.name))
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "Category patterns appear once you log a few expenses."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "glass rounded-2xl p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "Behavior timeline"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "How your spending mood has moved across the week"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-7",
						children: (timeline.length ? timeline : []).map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-foreground/10 bg-background/40 p-4 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs uppercase tracking-[0.15em] text-muted-foreground",
									children: entry.day
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-2xl",
									children: entry.emoji
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm font-medium",
									children: entry.label
								})
							]
						}, entry.date ?? entry.day))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "glass rounded-2xl p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "Recent expenses"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Latest moments your coach is reading"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/expenses",
						className: "text-sm text-primary hover:underline",
						children: "View all →"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-3",
					children: expenses.slice(0, 5).map((expense) => {
						const insight = expense.insight && typeof expense.insight === "object" ? expense.insight : null;
						const expanded = expandedExpenseId === expense.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-foreground/10 bg-background/40 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-semibold",
										children: [
											"₹",
											expense.amount.toFixed(2),
											" • ",
											expense.category
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-muted-foreground",
										children: expense.notes ?? "No note"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setExpandedExpenseId(expanded ? null : expense.id),
										className: "rounded-full border border-foreground/10 px-2.5 py-1 text-xs text-muted-foreground",
										children: expanded ? "Hide" : "Details"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-foreground/85",
									children: insight?.insight ? String(insight.insight) : "AI analysis pending for this expense."
								}),
								expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
											label: "Behavior",
											value: String(insight?.behavior ?? insight?.spending_type ?? "—")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
											label: "Emotion",
											value: String(insight?.emotion ?? expense.mood ?? "—")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
											label: "Trigger",
											value: String(insight?.detected_trigger ?? "—")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
											label: "Suggestion",
											value: String(insight?.suggestion ?? "—")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewField, {
											label: "Confidence",
											value: insight?.confidence != null ? `${Math.round(Number(insight.confidence) * 100)}%` : "—"
										})
									]
								}) : null
							]
						}, expense.id);
					})
				})]
			})
		]
	}) });
}
function StatCard({ icon: Icon, label, value, prefix = "", decimals = 0 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		whileHover: { y: -3 },
		className: "glass rounded-2xl p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs uppercase tracking-[0.15em] text-muted-foreground",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-lg bg-foreground/5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 text-accent" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 text-2xl font-semibold tabular-nums",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountUp, {
				value,
				prefix,
				decimals
			})
		})]
	});
}
function OverviewField({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-foreground/10 bg-background/40 p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-[0.16em] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-base font-medium leading-snug",
			children: value ?? "—"
		})]
	});
}
function CircularScore({ value, size = 120 }) {
	const r = size / 2 - 8;
	const c = 2 * Math.PI * r;
	const clamp = Math.max(0, Math.min(100, value));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "relative",
		style: {
			width: size,
			height: size
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			width: size,
			height: size,
			className: "-rotate-90",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: size / 2,
					cy: size / 2,
					r,
					strokeWidth: 8,
					className: "fill-none stroke-foreground/10"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.circle, {
					cx: size / 2,
					cy: size / 2,
					r,
					strokeWidth: 8,
					strokeLinecap: "round",
					className: "fill-none",
					stroke: "url(#scoreGradient)",
					initial: { strokeDasharray: `0 ${c}` },
					animate: { strokeDasharray: `${clamp / 100 * c} ${c}` },
					transition: {
						duration: 1.2,
						ease: [
							.22,
							1,
							.36,
							1
						]
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "scoreGradient",
					x1: "0",
					y1: "0",
					x2: "1",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "oklch(0.72 0.19 300)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "oklch(0.78 0.15 195)"
					})]
				}) })
			]
		})
	});
}
//#endregion
export { CircularScore, DashboardPage as component };
