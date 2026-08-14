import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime, t as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { a as extractAccessToken, c as post, d as useExpenses, f as useUser, i as clearToken, l as setToken, r as UserProvider, s as getCurrentUser, u as useCoaching } from "./coaching-context-Du82W5cg.mjs";
import { A as Heart, B as ChevronDown, D as Leaf, G as Brain, R as Clock, V as Check, c as Trash2, f as Sparkles, g as Search, h as Shield, o as TrendingUp, t as Zap } from "../_libs/lucide-react.mjs";
import { n as AnimatePresence, t as motion } from "../_libs/framer-motion.mjs";
import { n as CountUp, r as PageTransition, t as CategoryIcon } from "./ui-helpers-DcHruk01.mjs";
import { A as redirect, c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as objectType, t as enumType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-vv0LVhk9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "glass max-w-md rounded-2xl p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-gradient text-7xl font-bold",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted-foreground",
					children: "This page could not be found."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/",
					className: "mt-6 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground",
					children: "Go Home"
				})
			]
		})
	});
}
function ErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "glass max-w-md rounded-2xl p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold",
					children: "Something went wrong"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted-foreground",
					children: error.message
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => window.location.reload(),
					className: "mt-6 rounded-lg bg-gradient-primary px-4 py-2 text-primary-foreground",
					children: "Reload Page"
				})
			]
		})
	});
}
var Route$10 = createRootRouteWithContext()({
	head: () => ({ meta: [
		{ charSet: "utf-8" },
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1"
		},
		{ title: "Chayva" },
		{
			name: "description",
			content: "AI-powered expense tracker"
		}
	] }),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$10.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
			position: "top-right",
			richColors: true
		})]
	});
}
var $$splitComponentImporter$5 = () => import("./routes-BWmbAHLR.mjs");
var Route$9 = createFileRoute("/")({
	component: lazyRouteComponent($$splitComponentImporter$5, "component"),
	head: () => ({ meta: [
		{ title: "Chayva — Behavioral Finance Coach" },
		{
			name: "description",
			content: "Understand the emotions behind your spending and build mindful financial habits with Chayva."
		},
		{
			property: "og:title",
			content: "Chayva — Behavioral Finance Coach"
		},
		{
			property: "og:description",
			content: "Understand the emotions behind your spending with your AI behavioral finance coach."
		}
	] })
});
var $$splitComponentImporter$4 = () => import("./route-DAUBFlm-.mjs");
var Route$8 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		if (!await getCurrentUser()) throw redirect({ to: "/auth" });
	},
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var searchSchema = objectType({ mode: enumType(["signin", "signup"]).optional() });
var Route$7 = createFileRoute("/auth")({
	validateSearch: searchSchema,
	component: AuthPage
});
function AuthPage() {
	const { mode: initialMode } = Route$7.useSearch();
	const navigate = useNavigate();
	const { user, refreshUser } = useUser();
	const [mode, setMode] = (0, import_react.useState)(initialMode ?? "signin");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (user) navigate({ to: "/dashboard" });
	}, [navigate, user]);
	(0, import_react.useEffect)(() => {
		const clientId = "592545301354-a504f836e7u63qssfe7sf8jds4tpgfhr.apps.googleusercontent.com";
		const script = document.createElement("script");
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		script.onload = () => {
			const google = window.google;
			if (google?.accounts?.id) google.accounts.id.initialize({
				client_id: clientId,
				callback: handleCredentialResponse
			});
		};
		document.body.appendChild(script);
		return () => {
			document.body.removeChild(script);
		};
	}, []);
	async function handleCredentialResponse(response) {
		setLoading(true);
		try {
			await completeAuthentication(await post("/auth/google", { credential: response.credential }), "Signed in with Google successfully!");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
		} finally {
			setLoading(false);
		}
	}
	async function handleSubmit(e) {
		e.preventDefault();
		setLoading(true);
		try {
			if (mode === "signup") await completeAuthentication(await post("/auth/signup", {
				email,
				password
			}), "Account created successfully!");
			else await completeAuthentication(await post("/auth/signin", {
				email,
				password
			}), "Signed in successfully!");
		} catch (err) {
			clearToken();
			toast.error(err instanceof Error ? err.message : "Authentication failed.");
		} finally {
			setLoading(false);
		}
	}
	async function completeAuthentication(response, successMessage) {
		setToken(extractAccessToken(response));
		if (!await refreshUser()) {
			clearToken();
			throw new Error("Could not verify your session. Please sign in again.");
		}
		toast.success(successMessage);
		navigate({
			to: "/dashboard",
			replace: true
		});
	}
	function handleGoogle() {
		const google = window.google;
		if (!google?.accounts?.id) {
			toast.error("Google Sign-In is not initialized.");
			return;
		}
		google.accounts.id.prompt();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "glass w-full max-w-md rounded-2xl p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "h-5 w-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-lg font-semibold",
						children: "Chayva"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-semibold",
					children: mode === "signup" ? "Create your account" : "Welcome back"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: mode === "signup" ? "Start understanding your money in seconds." : "Sign in to continue."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSubmit,
					className: "mt-6 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: handleGoogle,
							disabled: loading,
							className: "flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
								className: "h-4 w-4",
								viewBox: "0 0 24 24",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									fill: "#EA4335",
									d: "M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.5 14.7 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12S6.8 21.5 12 21.5c6.9 0 9.4-4.9 9.4-8.9 0-.6-.1-1.1-.2-1.6H12z"
								})
							}), "Continue with Google"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-white/10" }),
								"or",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-white/10" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm text-muted-foreground",
							children: "Email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "email",
							required: true,
							value: email,
							onChange: (e) => setEmail(e.target.value),
							placeholder: "you@example.com",
							className: "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm text-muted-foreground",
							children: "Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "password",
							required: true,
							minLength: 6,
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "At least 6 characters",
							className: "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: loading,
							className: "w-full rounded-lg bg-gradient-primary px-4 py-2.5 font-medium text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60",
							children: loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 text-center text-sm text-muted-foreground",
					children: [
						mode === "signup" ? "Already have an account?" : "New to Chayva?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMode(mode === "signup" ? "signin" : "signup"),
							className: "font-medium text-foreground underline underline-offset-4",
							children: mode === "signup" ? "Sign in" : "Create one"
						})
					]
				})
			]
		})
	});
}
var Route$6 = createFileRoute("/_authenticated/add")({ component: AddExpensePage });
var CATEGORIES = [
	"Food",
	"Groceries",
	"Transport",
	"Rent",
	"Utilities",
	"Shopping",
	"Entertainment",
	"Health",
	"Travel",
	"Subscriptions",
	"Other"
];
var MOODS = [
	{
		value: "happy",
		emoji: "😊"
	},
	{
		value: "stressed",
		emoji: "😣"
	},
	{
		value: "bored",
		emoji: "😐"
	},
	{
		value: "lonely",
		emoji: "🥺"
	},
	{
		value: "tired",
		emoji: "😴"
	},
	{
		value: "social",
		emoji: "🥳"
	}
];
function currentLocalDateTime() {
	const now = /* @__PURE__ */ new Date();
	const offsetMs = now.getTimezoneOffset() * 6e4;
	return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}
function AddExpensePage() {
	const navigate = useNavigate();
	const { addExpense } = useExpenses();
	const [amount, setAmount] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("Food");
	const [note, setNote] = (0, import_react.useState)("");
	const [mood, setMood] = (0, import_react.useState)("happy");
	const [spentAt, setSpentAt] = (0, import_react.useState)(currentLocalDateTime);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [savedFeedback, setSavedFeedback] = (0, import_react.useState)(null);
	const [savedAnalysis, setSavedAnalysis] = (0, import_react.useState)(null);
	async function onSubmit(e) {
		e.preventDefault();
		const value = Number(amount);
		if (isNaN(value) || value <= 0) {
			toast.error("Please enter a valid amount.");
			return;
		}
		setLoading(true);
		try {
			const expense = await addExpense({
				amount: value,
				category,
				notes: note,
				mood,
				date: spentAt,
				source: "manual"
			});
			const insightPayload = expense.insight && typeof expense.insight === "object" ? expense.insight : null;
			const insightText = insightPayload && typeof insightPayload === "object" && "insight" in insightPayload ? String(insightPayload.insight) : null;
			setSavedAnalysis(insightPayload);
			setSavedFeedback(insightText ?? "Expense saved. AI insight will appear after the backend coach processes this transaction.");
			toast.success("Expense saved — your backend coach is analyzing it.");
			setTimeout(() => {
				navigate({ to: "/expenses" });
			}, 1200);
		} catch (error) {
			console.error(error);
			toast.error("Failed to save expense.");
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTransition, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm uppercase tracking-widest text-primary",
					children: "Quick log"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-3xl font-bold",
					children: "Add Expense"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted-foreground",
					children: "Log a transaction and let Chayva discover your spending patterns."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "glass space-y-6 rounded-3xl p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-medium",
						children: "Amount"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center rounded-xl border border-border bg-background px-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-lg",
							children: "₹"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							min: "0",
							step: "0.01",
							required: true,
							value: amount,
							onChange: (e) => setAmount(e.target.value),
							placeholder: "0.00",
							className: "w-full bg-transparent px-2 py-3 outline-none"
						})]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm font-medium",
							children: "Category"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: category,
							onChange: (e) => setCategory(e.target.value),
							className: "mt-2 w-full rounded-xl border border-border bg-background px-3 py-3",
							children: CATEGORIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: item,
								children: item
							}, item))
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm font-medium",
							children: "Date & time"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "datetime-local",
							value: spentAt,
							onChange: (e) => setSpentAt(e.target.value),
							className: "mt-2 w-full rounded-xl border border-border bg-background px-3 py-3"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-medium",
						children: "Mood"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: MOODS.map((item) => {
							const active = mood === item.value;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
								type: "button",
								whileHover: { scale: 1.05 },
								whileTap: { scale: .95 },
								onClick: () => setMood(item.value),
								className: `rounded-xl border px-4 py-2 transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`,
								children: [
									item.emoji,
									" ",
									item.value
								]
							}, item.value);
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-medium",
						children: "Note"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						rows: 3,
						value: note,
						onChange: (e) => setNote(e.target.value),
						placeholder: "Optional",
						className: "mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 outline-none"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.button, {
						whileHover: { scale: 1.02 },
						whileTap: { scale: .98 },
						type: "submit",
						disabled: loading,
						className: "w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground",
						children: loading ? "Saving..." : "Save Expense"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: savedFeedback && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				initial: {
					opacity: 0,
					y: 20
				},
				animate: {
					opacity: 1,
					y: 0
				},
				exit: { opacity: 0 },
				className: "glass flex gap-3 rounded-2xl p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 18 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-sm font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 16 }), "Chayva noticed"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: savedFeedback
					}),
					savedAnalysis ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
								children: [
									"Behavior:",
									" ",
									String(savedAnalysis.behavior ?? "forming")
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
								children: ["Emotion: ", String(savedAnalysis.emotion ?? mood)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
								children: [
									"Trigger:",
									" ",
									String(savedAnalysis.detected_trigger ?? "forming")
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
								children: [
									"Type:",
									" ",
									String(savedAnalysis.spending_type ?? "forming")
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
								children: [
									"Pattern:",
									" ",
									String(savedAnalysis.pattern_tag ?? "neutral")
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
								children: [
									"Confidence:",
									" ",
									String(savedAnalysis.confidence ?? "—")
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "basis-full rounded-2xl border border-foreground/10 bg-background/40 px-3 py-2",
								children: [
									"Suggestion:",
									" ",
									String(savedAnalysis.suggestion ?? "No suggestion returned.")
								]
							})
						]
					}) : null
				] })]
			}) })
		]
	}) });
}
var $$splitComponentImporter$3 = () => import("./dashboard-CzehR6QX.mjs");
var Route$5 = createFileRoute("/_authenticated/dashboard")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
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
var Route$4 = createFileRoute("/_authenticated/dna")({ component: SpendDnaPage });
function SpendDnaPage() {
	const { snapshot, loading, error, refetch } = useCoaching();
	const dna = snapshot?.spend_dna ?? {};
	const personality = snapshot?.personality ?? {};
	const mindfulness = dna.mindfulness_score ?? personality.mindfulness_score ?? null;
	const traits = (0, import_react.useMemo)(() => {
		return [
			{
				icon: Heart,
				title: "Personality",
				value: dna.personality_type ?? personality.type ?? "—",
				desc: personality.behavior_narrative ?? personality.description ?? "—"
			},
			{
				icon: Zap,
				title: "Top trigger",
				value: dna.dominant_trigger ?? personality.dominant_trigger ?? "—",
				desc: dna.behavior_pattern ? `Strongest signal: ${dna.behavior_pattern}.` : "—"
			},
			{
				icon: Leaf,
				title: "Favorite category",
				value: dna.favorite_category ?? personality.favorite_category ?? "—",
				desc: dna.favorite_category ? `${dna.favorite_category} is leading your current pattern.` : "—"
			},
			{
				icon: Clock,
				title: "Most active time",
				value: dna.most_active_time ?? personality.most_active_time ?? "—",
				desc: "When your spending behavior most often shows up."
			},
			{
				icon: Shield,
				title: "Risk level",
				value: dna.risk_level ?? personality.risk_level ?? "—",
				desc: "How reactive your current spending pattern looks."
			},
			{
				icon: TrendingUp,
				title: "Behavior evolution",
				value: "Trend",
				desc: dna.behavior_evolution ?? personality.behavior_evolution ?? "—"
			}
		];
	}, [dna, personality]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTransition, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm uppercase tracking-[0.25em] text-primary",
					children: "Behavioral Profile"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-4xl font-bold",
					children: "Your Spend DNA"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-2xl text-muted-foreground",
					children: "Your spending personality, triggers, and behavioral patterns in one readout."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.section, {
				initial: {
					opacity: 0,
					y: 20
				},
				animate: {
					opacity: 1,
					y: 0
				},
				className: "glass relative overflow-hidden rounded-3xl p-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex flex-col items-center gap-8 md:flex-row",
					children: [loading || mindfulness == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-[180px] w-[180px] animate-pulse rounded-full bg-foreground/10" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircularScore, {
						value: mindfulness,
						size: 180
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), "Mindfulness Score"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 text-6xl font-bold",
							children: [mindfulness != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountUp, { value: mindfulness }) : "—", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-2xl text-muted-foreground",
								children: "/100"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-md text-muted-foreground",
							children: dna.coach_advice ?? personality.coach_advice ?? "Coach advice will appear once your pattern map is clearer."
						}),
						dna.confidence != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: [
								"Confidence: ",
								Math.round(dna.confidence * 100),
								"%"
							]
						}) : null
					] })]
				})
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => void refetch(),
					className: "rounded-lg border border-foreground/10 px-3 py-1",
					children: "Retry"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid gap-5 md:grid-cols-3",
				children: traits.map((trait, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
					initial: {
						opacity: 0,
						y: 16
					},
					animate: {
						opacity: 1,
						y: 0
					},
					transition: { delay: index * .08 },
					whileHover: { y: -5 },
					className: "glass rounded-2xl p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(trait.icon, { className: "h-4 w-4 text-primary" }), trait.title]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-4 text-2xl font-semibold",
							children: trait.value
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-7 text-muted-foreground",
							children: trait.desc
						})
					]
				}, trait.title))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-5 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DnaList, {
						title: "Traits",
						items: dna.traits ?? personality.traits ?? []
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DnaList, {
						title: "Strengths",
						items: dna.strengths ?? personality.strengths ?? []
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DnaList, {
						title: "Growth areas",
						items: dna.growth_areas ?? personality.growth_areas ?? []
					})
				]
			})
		]
	}) });
}
function DnaList({ title, items }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "glass rounded-2xl p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-lg font-semibold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-2 text-sm text-muted-foreground",
			children: (items.length ? items : ["—"]).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2",
				children: item
			}, item))
		})]
	});
}
var Route$3 = createFileRoute("/_authenticated/expenses")({ component: ExpensesPage });
function ExpensesPage() {
	const { expenses, loading, error, removeExpense, refetch } = useExpenses();
	const [query, setQuery] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("all");
	const [expandedId, setExpandedId] = (0, import_react.useState)(null);
	async function deleteExpense(id) {
		try {
			await removeExpense(id);
			toast.success("Expense deleted.");
		} catch (error) {
			console.error(error);
			toast.error("Failed to delete expense.");
		}
	}
	const categories = (0, import_react.useMemo)(() => {
		return Array.from(new Set(expenses.map((e) => e.category)));
	}, [expenses]);
	const filteredExpenses = (0, import_react.useMemo)(() => {
		return expenses.filter((expense) => {
			if (category !== "all" && expense.category !== category) return false;
			if (query.trim()) {
				const q = query.toLowerCase();
				return expense.category.toLowerCase().includes(q) || expense.notes?.toLowerCase().includes(q);
			}
			return true;
		});
	}, [
		expenses,
		query,
		category
	]);
	const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTransition, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl px-6 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Your log"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-3xl font-bold",
						children: "Expenses"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-muted-foreground",
						children: [
							filteredExpenses.length,
							" ",
							filteredExpenses.length === 1 ? "entry" : "entries",
							" ",
							"· ₹",
							total.toFixed(2)
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/add",
					className: "rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground",
					children: "+ Add Expense"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass mb-6 flex flex-col gap-3 rounded-2xl p-4 md:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-1 items-center gap-2 rounded-xl border border-border px-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Search expenses...",
						className: "w-full bg-transparent py-3 outline-none"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: category,
					onChange: (e) => setCategory(e.target.value),
					className: "rounded-xl border border-border px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "all",
						children: "All Categories"
					}), categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: cat,
						children: cat
					}, cat))]
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => void refetch(),
						className: "rounded-lg border border-destructive/30 px-3 py-1",
						children: "Retry"
					})]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "glass overflow-hidden rounded-3xl",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3 p-5",
					children: Array.from({ length: 5 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-16 animate-pulse rounded-xl bg-muted" }, index))
				}) : filteredExpenses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-12 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-semibold",
							children: "No expenses found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-muted-foreground",
							children: "Start tracking your spending."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/add",
							className: "mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-primary-foreground",
							children: "Add First Expense"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: filteredExpenses.map((expense) => {
					const insight = expense.insight && typeof expense.insight === "object" ? expense.insight : null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.li, {
						layout: true,
						initial: {
							opacity: 0,
							y: 20
						},
						animate: {
							opacity: 1,
							y: 0
						},
						exit: {
							opacity: 0,
							x: -40
						},
						className: "border-b border-border px-5 py-4 last:border-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-xl bg-primary/10 p-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, {
										name: expense.category,
										className: "h-5 w-5"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold",
										children: expense.category
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm text-muted-foreground",
										children: expense.notes ?? "No note"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs text-muted-foreground",
										children: [
											expense.date,
											expense.mood ? ` • ${expense.mood}` : "",
											insight?.spending_type ? ` • ${String(insight.spending_type)}` : ""
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 max-w-xl text-sm text-foreground/80",
										children: insight?.insight ? String(insight.insight) : "AI analysis unavailable for this expense."
									})
								] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold",
										children: ["₹", expense.amount.toFixed(2)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setExpandedId(expandedId === expense.id ? null : expense.id),
										className: "rounded-lg p-2 transition hover:bg-foreground/10",
										"aria-label": "Expand insight",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `h-4 w-4 transition ${expandedId === expense.id ? "rotate-180" : ""}` })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => deleteExpense(expense.id),
										className: "rounded-lg p-2 transition hover:bg-red-500/10 hover:text-red-500",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
							initial: false,
							children: expandedId === expense.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
								initial: {
									height: 0,
									opacity: 0
								},
								animate: {
									height: "auto",
									opacity: 1
								},
								exit: {
									height: 0,
									opacity: 0
								},
								className: "overflow-hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 rounded-2xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }), "Behavioral insight"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-foreground",
											children: expense.insight && typeof expense.insight === "object" && "insight" in expense.insight ? String(expense.insight.insight) : "Your backend coach will produce a behavioral read once it has enough context from your expenses."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 flex flex-wrap gap-2 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
													children: ["Behavior: ", String(insight?.behavior ?? insight?.spending_type ?? "—")]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
													children: ["Emotion: ", String(insight?.emotion ?? expense.mood ?? "—")]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
													children: ["Trigger: ", String(insight?.detected_trigger ?? "—")]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
													children: ["Suggestion: ", String(insight?.suggestion ?? "—")]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
													children: ["Pattern: ", String(insight?.pattern_tag ?? "neutral")]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "rounded-full border border-foreground/10 bg-background/40 px-2.5 py-1",
													children: ["Confidence: ", insight?.confidence != null ? String(insight.confidence) : "—"]
												})
											]
										})
									]
								})
							}) : null
						})]
					}, expense.id);
				}) }) })
			})
		]
	}) });
}
var $$splitComponentImporter$2 = () => import("./journey-BHsPqIim.mjs");
var Route$2 = createFileRoute("/_authenticated/journey")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./reflect-pAzuz3nG.mjs");
var Route$1 = createFileRoute("/_authenticated/reflect")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./week-DAkZvSGG.mjs");
var Route = createFileRoute("/_authenticated/week")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var IndexRoute = Route$9.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$10
});
var AuthenticatedRouteRoute = Route$8.update({
	id: "/_authenticated",
	getParentRoute: () => Route$10
});
var AuthRoute = Route$7.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$10
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAddRoute: Route$6.update({
		id: "/add",
		path: "/add",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedDashboardRoute: Route$5.update({
		id: "/dashboard",
		path: "/dashboard",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedDnaRoute: Route$4.update({
		id: "/dna",
		path: "/dna",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedExpensesRoute: Route$3.update({
		id: "/expenses",
		path: "/expenses",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedJourneyRoute: Route$2.update({
		id: "/journey",
		path: "/journey",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedReflectRoute: Route$1.update({
		id: "/reflect",
		path: "/reflect",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedWeekRoute: Route.update({
		id: "/week",
		path: "/week",
		getParentRoute: () => AuthenticatedRouteRoute
	})
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AuthRoute
};
var routeTree = Route$10._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
