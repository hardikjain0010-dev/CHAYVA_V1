import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { c as post, f as useUser, o as get, u as useCoaching } from "./coaching-context-Du82W5cg.mjs";
import { S as Moon, V as Check } from "../_libs/lucide-react.mjs";
import { n as AnimatePresence, t as motion } from "../_libs/framer-motion.mjs";
import { r as PageTransition } from "./ui-helpers-DcHruk01.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reflect-pAzuz3nG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MOODS = [
	{
		v: "great",
		e: "😄"
	},
	{
		v: "good",
		e: "😊"
	},
	{
		v: "okay",
		e: "😐"
	},
	{
		v: "low",
		e: "😔"
	},
	{
		v: "stressed",
		e: "😣"
	}
];
function ReflectPage() {
	const { user } = useUser();
	const { snapshot, refetch: refetchCoaching } = useCoaching();
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const [mood, setMood] = (0, import_react.useState)("okay");
	const [rating, setRating] = (0, import_react.useState)(3);
	const [triggers, setTriggers] = (0, import_react.useState)("");
	const [tomorrow, setTomorrow] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [past, setPast] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (!user?.uid) return;
		const loadReflections = async () => {
			setLoading(true);
			setError(null);
			try {
				const sorted = [...await get("/moods") ?? []].sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
				setPast(sorted);
				const todayRow = sorted.find((entry) => (entry.day ?? entry.timestamp?.slice(0, 10)) === today);
				if (todayRow) {
					setMood(todayRow.mood ?? "okay");
					setRating(todayRow.day_rating ?? 3);
					setTriggers(todayRow.triggers ?? "");
					setTomorrow(todayRow.tomorrow ?? "");
				}
			} catch (err) {
				console.error(err);
				setError(err instanceof Error ? err.message : "Unable to load reflections.");
			} finally {
				setLoading(false);
			}
		};
		loadReflections();
	}, [today, user?.uid]);
	async function save() {
		if (!user?.uid) {
			toast.error("Please sign in first.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await post("/mood", {
				mood,
				day: today,
				day_rating: rating,
				triggers: triggers || null,
				tomorrow: tomorrow || null,
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			});
			const sorted = [...await get("/moods") ?? []].sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
			setPast(sorted);
			setSaved(true);
			await refetchCoaching();
			toast.success("Reflection saved");
			setTimeout(() => setSaved(false), 2200);
			setTriggers("");
			setTomorrow("");
		} catch (err) {
			console.error(err);
			setError(err instanceof Error ? err.message : "Failed to save reflection");
			toast.error("Failed to save reflection");
		} finally {
			setSaving(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTransition, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "h-5 w-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.2em] text-accent",
					children: "Evening ritual"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-4xl font-semibold tracking-tight md:text-5xl",
					children: "Reflect"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 max-w-2xl text-base text-muted-foreground",
				children: "A quiet minute to notice how emotions shaped today's spending — and to set one gentle intention for tomorrow."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "glass relative space-y-6 rounded-3xl p-6 md:p-8",
				children: [
					snapshot?.reflection.summary ?? snapshot?.reflection.insight ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs uppercase tracking-[0.2em] text-accent",
							children: "AI reflection summary"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-foreground/85",
							children: snapshot.reflection.summary ?? snapshot.reflection.insight
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm font-medium",
							children: "How was your day?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: MOODS.map((m) => {
								const active = mood === m.v;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
									type: "button",
									onClick: () => setMood(m.v),
									whileHover: { y: -2 },
									whileTap: { scale: .94 },
									animate: active ? { scale: [
										1,
										1.15,
										1
									] } : { scale: 1 },
									transition: { duration: .3 },
									className: `rounded-xl border px-3 py-2 text-sm transition ${active ? "border-primary bg-primary/20 text-foreground shadow-[var(--shadow-glow)]" : "border-foreground/10 bg-foreground/5 text-muted-foreground hover:text-foreground"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mr-1 text-lg",
										children: m.e
									}), m.v]
								}, m.v);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2 flex items-center justify-between text-xs text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Day rating" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-lg font-semibold text-foreground tabular-nums",
									children: [rating, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-muted-foreground",
										children: "/5"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 1,
								max: 5,
								value: rating,
								onChange: (e) => setRating(Number(e.target.value)),
								className: "w-full accent-primary",
								style: {
									background: `linear-gradient(to right, oklch(0.72 0.19 300) 0%, oklch(0.78 0.15 195) ${(rating - 1) * 25}%, oklch(0.6 0 0 / 0.15) ${(rating - 1) * 25}%, oklch(0.6 0 0 / 0.15) 100%)`,
									height: 6,
									borderRadius: 999,
									appearance: "none",
									WebkitAppearance: "none"
								}
							})]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-medium",
						children: "What triggered your spending today?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: triggers,
						onChange: (e) => setTriggers(e.target.value),
						rows: 3,
						placeholder: "Stress, celebration, boredom, a sale…",
						className: "mt-2 w-full rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-foreground/[0.08] focus:ring-2 focus:ring-primary/30"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-medium",
						children: "What could you do differently tomorrow?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: tomorrow,
						onChange: (e) => setTomorrow(e.target.value),
						rows: 3,
						placeholder: "One small intention…",
						className: "mt-2 w-full rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-foreground/[0.08] focus:ring-2 focus:ring-primary/30"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						onClick: save,
						disabled: saving,
						whileHover: { scale: 1.01 },
						whileTap: { scale: .98 },
						className: "relative w-full overflow-hidden rounded-xl bg-gradient-primary px-4 py-3 font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
							mode: "wait",
							children: saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.span, {
								initial: {
									opacity: 0,
									y: 8
								},
								animate: {
									opacity: 1,
									y: 0
								},
								exit: {
									opacity: 0,
									y: -8
								},
								className: "flex items-center justify-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), " Reflection saved"]
							}, "saved") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
								initial: { opacity: 0 },
								animate: { opacity: 1 },
								exit: { opacity: 0 },
								children: saving ? "Saving…" : "Save reflection"
							}, "idle")
						})
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-sm italic text-muted-foreground",
						children: "Every reflection brings you one step closer to mindful spending."
					})
				]
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "glass rounded-2xl p-6 text-sm text-muted-foreground",
				children: "Loading reflections…"
			}) : past.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "glass rounded-2xl p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 text-lg font-semibold",
					children: "Recent reflections"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: past.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.li, {
						initial: {
							opacity: 0,
							x: -10
						},
						animate: {
							opacity: 1,
							x: 0
						},
						transition: { delay: i * .04 },
						className: "rounded-xl border border-foreground/10 bg-foreground/5 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-xs text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.day ?? r.timestamp?.slice(0, 10) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.mood })]
							}),
							r.triggers ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-sm",
								children: ["💭 ", r.triggers]
							}) : null,
							r.tomorrow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm",
								children: ["🌱 ", r.tomorrow]
							}) : null
						]
					}, r.id ?? `${r.day ?? "entry"}-${i}`))
				})]
			}) : null
		]
	}) });
}
//#endregion
export { ReflectPage as component };
