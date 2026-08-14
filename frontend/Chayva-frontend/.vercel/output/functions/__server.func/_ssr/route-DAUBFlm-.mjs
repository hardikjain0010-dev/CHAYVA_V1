import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { f as useUser, n as ExpenseProvider, t as CoachingProvider } from "./coaching-context-Du82W5cg.mjs";
import { C as MoonStar, E as ListOrdered, F as Dna, G as Brain, O as LayoutDashboard, S as Moon, T as LogOut, W as CalendarDays, u as Sun, w as MapPin, y as Plus } from "../_libs/lucide-react.mjs";
import { t as motion } from "../_libs/framer-motion.mjs";
import { f as Outlet, g as Link, l as useRouterState, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-DAUBFlm-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var THEME_KEY = "chayva_theme";
function getInitialTheme() {
	if (typeof window === "undefined") return "dark";
	const stored = window.localStorage.getItem(THEME_KEY);
	if (stored === "light" || stored === "dark") return stored;
	return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
function applyTheme(theme) {
	if (typeof document === "undefined") return;
	document.documentElement.classList.toggle("dark", theme === "dark");
}
function useTheme() {
	const [theme, setTheme] = (0, import_react.useState)(getInitialTheme);
	(0, import_react.useEffect)(() => {
		applyTheme(theme);
		window.localStorage.setItem(THEME_KEY, theme);
	}, [theme]);
	return {
		theme,
		setTheme,
		toggle: () => setTheme((current) => current === "dark" ? "light" : "dark")
	};
}
var NAV = [
	{
		to: "/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard
	},
	{
		to: "/expenses",
		label: "Expenses",
		icon: ListOrdered
	},
	{
		to: "/add",
		label: "Add expense",
		icon: Plus
	},
	{
		to: "/week",
		label: "This Week",
		icon: CalendarDays
	},
	{
		to: "/dna",
		label: "Spend DNA",
		icon: Dna
	},
	{
		to: "/reflect",
		label: "Reflect",
		icon: MoonStar
	},
	{
		to: "/journey",
		label: "Journey",
		icon: MapPin
	}
];
function AppShell({ children }) {
	const navigate = useNavigate();
	const { theme, toggle } = useTheme();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { logout } = useUser();
	function signOut() {
		logout();
		navigate({
			to: "/auth",
			replace: true
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "glass hidden w-60 shrink-0 flex-col rounded-2xl p-4 md:flex",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/dashboard",
							className: "mb-6 flex items-center gap-2 px-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "h-5 w-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold tracking-tight text-lg",
								children: "Chayva"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "flex flex-col gap-1",
							children: NAV.map(({ to, label, icon: Icon }) => {
								const active = pathname === to;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to,
									className: `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "text-primary-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`,
									children: [
										active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
											layoutId: "nav-active",
											className: "absolute inset-0 rounded-xl bg-gradient-primary shadow-[var(--shadow-glow)]",
											transition: {
												type: "spring",
												stiffness: 380,
												damping: 32
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "relative h-4 w-4" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "relative",
											children: label
										})
									]
								}, to);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: toggle,
							className: "mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground",
							children: [theme === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "h-4 w-4" }), theme === "dark" ? "Light mode" : "Dark mode"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: signOut,
							className: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" }), "Sign out"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "md:hidden fixed inset-x-0 bottom-0 z-20 glass-strong flex justify-around gap-1 overflow-x-auto py-2 px-1",
					children: [
						NAV.map(({ to, label, icon: Icon }) => {
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to,
								className: `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs ${pathname === to ? "text-primary" : "text-muted-foreground"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" }), label]
							}, to);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: toggle,
							className: "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs text-muted-foreground",
							children: [theme === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "h-5 w-5" }), theme === "dark" ? "Light" : "Dark"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: signOut,
							className: "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-5 w-5" }), "Sign out"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 pb-24 md:pb-0",
					children
				})
			]
		})
	});
}
function AuthenticatedLayout() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenseProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachingProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }) });
}
//#endregion
export { AuthenticatedLayout as component };
