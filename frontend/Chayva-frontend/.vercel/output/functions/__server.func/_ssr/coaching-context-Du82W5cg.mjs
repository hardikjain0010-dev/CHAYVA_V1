import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/coaching-context-Du82W5cg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
function getApiBaseUrl() {
	return DEFAULT_API_BASE_URL.replace(/\/$/, "");
}
function buildUrl(path) {
	if (/^https?:\/\//i.test(path)) return path;
	return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
function buildHeaders(body, headers) {
	const next = new Headers(headers);
	const token = getToken();
	if (token) next.set("Authorization", `Bearer ${token}`);
	if (body != null && !(body instanceof FormData) && !next.has("Content-Type")) next.set("Content-Type", "application/json");
	return next;
}
function serializeBody(body) {
	if (body == null || body instanceof FormData || typeof body === "string") return body;
	return JSON.stringify(body);
}
async function parseResponse(response) {
	if (response.status === 204) return null;
	if ((response.headers.get("content-type") ?? "").includes("application/json")) return response.json();
	return response.text();
}
function errorMessageFromPayload(payload, fallback) {
	if (payload && typeof payload === "object") {
		const record = payload;
		const detail = record.detail ?? record.message ?? record.error;
		if (typeof detail === "string") return detail;
		if (Array.isArray(detail)) return detail.map(String).join(", ");
	}
	if (typeof payload === "string" && payload.trim()) return payload;
	return fallback;
}
async function request(path, init = {}) {
	const { body, ...requestInit } = init;
	const response = await fetch(buildUrl(path), {
		...requestInit,
		body: serializeBody(body),
		headers: buildHeaders(body, init.headers)
	});
	const payload = await parseResponse(response);
	if (!response.ok) throw new Error(errorMessageFromPayload(payload, `Request failed with status ${response.status}`));
	return payload;
}
function get(path, init) {
	return request(path, {
		...init,
		method: "GET"
	});
}
function post(path, body, init) {
	return request(path, {
		...init,
		method: "POST",
		body
	});
}
function del(path, init) {
	return request(path, {
		...init,
		method: "DELETE"
	});
}
var TOKEN_KEY = "chayva_access_token";
function extractAccessToken(response) {
	const token = response.access_token ?? response.token;
	if (!token) throw new Error("Authentication response did not include an access token.");
	return token;
}
function getToken() {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
	if (typeof window === "undefined") return;
	window.localStorage.removeItem(TOKEN_KEY);
}
async function getCurrentUser() {
	if (!getToken()) return null;
	try {
		return await get("/auth/me");
	} catch (error) {
		clearToken();
		return null;
	}
}
/**
* UserContext — single source of truth for the authenticated user.
*
* Instead of every page calling `await getCurrentUser()` independently
* (which causes multiple network round-trips and race conditions),
* `UserProvider` fetches the user once and stores it here.
*
* All components call `useUser()` to read the current user.
*/
var UserContext = (0, import_react.createContext)(null);
function UserProvider({ children }) {
	const [state, setState] = (0, import_react.useState)({
		user: null,
		loading: true,
		error: null
	});
	const fetchUser = (0, import_react.useCallback)(async () => {
		setState((prev) => ({
			...prev,
			loading: true,
			error: null
		}));
		try {
			const user = await getCurrentUser();
			setState({
				user,
				loading: false,
				error: null
			});
			return user;
		} catch (err) {
			clearToken();
			setState({
				user: null,
				loading: false,
				error: err instanceof Error ? err.message : "Authentication failed"
			});
			return null;
		}
	}, []);
	(0, import_react.useEffect)(() => {
		fetchUser();
	}, [fetchUser]);
	const logout = (0, import_react.useCallback)(() => {
		clearToken();
		setState({
			user: null,
			loading: false,
			error: null
		});
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserContext.Provider, {
		value: {
			...state,
			refreshUser: fetchUser,
			logout
		},
		children
	});
}
function useUser() {
	const ctx = (0, import_react.useContext)(UserContext);
	if (!ctx) throw new Error("useUser() must be used inside <UserProvider>.");
	return ctx;
}
/**
* ExpenseContext — single source of truth for all expense data.
*
* This replaces the pattern of every page independently fetching expenses
* and maintaining its own local useState.
*
* Architecture:
*  - `ExpenseProvider` fetches expenses once when the user is available.
*  - `addExpense(data)` POSTs to the API, then merges the result into state.
*  - `removeExpense(id)` DELETEs from the API, then removes from state.
*  - `clearExpenses()` wipes state on logout to prevent cross-user data leakage.
*  - All pages call `useExpenses()` — they all read the same data.
*  - Any mutation instantly updates Dashboard, Expenses, DNA, Week, Journey.
*/
function reducer$1(state, action) {
	switch (action.type) {
		case "SET_LOADING": return {
			...state,
			loading: true,
			error: null
		};
		case "SET_EXPENSES": return {
			expenses: action.payload,
			loading: false,
			error: null
		};
		case "ADD_EXPENSE": return {
			...state,
			expenses: [action.payload, ...state.expenses]
		};
		case "REMOVE_EXPENSE": return {
			...state,
			expenses: state.expenses.filter((e) => e.id !== action.payload)
		};
		case "CLEAR_EXPENSES": return {
			expenses: [],
			loading: false,
			error: null
		};
		case "SET_ERROR": return {
			...state,
			loading: false,
			error: action.payload
		};
		default: return state;
	}
}
var ExpenseContext = (0, import_react.createContext)(null);
function ExpenseProvider({ children }) {
	const { user } = useUser();
	const [state, dispatch] = (0, import_react.useReducer)(reducer$1, {
		expenses: [],
		loading: false,
		error: null
	});
	const fetchExpenses = (0, import_react.useCallback)(async () => {
		if (!user) return;
		dispatch({ type: "SET_LOADING" });
		try {
			const data = await get("/expenses");
			dispatch({
				type: "SET_EXPENSES",
				payload: data
			});
		} catch (err) {
			dispatch({
				type: "SET_ERROR",
				payload: err instanceof Error ? err.message : "Failed to load expenses"
			});
		}
	}, [user]);
	(0, import_react.useEffect)(() => {
		if (user) {
			dispatch({ type: "CLEAR_EXPENSES" });
			fetchExpenses();
		} else dispatch({ type: "CLEAR_EXPENSES" });
	}, [user?.uid]);
	const addExpense = (0, import_react.useCallback)(async (data) => {
		if (!user) throw new Error("Not authenticated");
		const expense = await post("/expenses", {
			...data,
			source: data.source ?? "manual"
		});
		dispatch({
			type: "ADD_EXPENSE",
			payload: expense
		});
		return expense;
	}, [user]);
	const removeExpense = (0, import_react.useCallback)(async (id) => {
		await del(`/expenses/${id}`);
		dispatch({
			type: "REMOVE_EXPENSE",
			payload: id
		});
	}, []);
	const clearExpenses = (0, import_react.useCallback)(() => {
		dispatch({ type: "CLEAR_EXPENSES" });
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenseContext.Provider, {
		value: {
			...state,
			addExpense,
			removeExpense,
			clearExpenses,
			refetch: fetchExpenses
		},
		children
	});
}
function useExpenses() {
	const ctx = (0, import_react.useContext)(ExpenseContext);
	if (!ctx) throw new Error("useExpenses() must be used inside <ExpenseProvider>.");
	return ctx;
}
function reducer(state, action) {
	switch (action.type) {
		case "LOAD": return {
			...state,
			loading: true,
			error: null
		};
		case "SUCCESS": return {
			snapshot: action.payload,
			loading: false,
			error: null
		};
		case "ERROR": return {
			...state,
			loading: false,
			error: action.payload
		};
		case "CLEAR": return {
			snapshot: null,
			loading: false,
			error: null
		};
		default: return state;
	}
}
var CoachingContext = (0, import_react.createContext)(null);
function CoachingProvider({ children }) {
	const { user } = useUser();
	const { expenses } = useExpenses();
	const expenseSignature = expenses.map((e) => `${e.id}:${e.amount}`).join("|");
	const [state, dispatch] = (0, import_react.useReducer)(reducer, {
		snapshot: null,
		loading: false,
		error: null
	});
	const refetch = (0, import_react.useCallback)(async () => {
		if (!user?.uid) {
			dispatch({ type: "CLEAR" });
			return;
		}
		dispatch({ type: "LOAD" });
		try {
			const snapshot = await get("/insights/coaching");
			dispatch({
				type: "SUCCESS",
				payload: snapshot
			});
		} catch (error) {
			dispatch({
				type: "ERROR",
				payload: error instanceof Error ? error.message : "Unable to load AI coaching."
			});
		}
	}, [user?.uid]);
	(0, import_react.useEffect)(() => {
		refetch();
	}, [refetch, expenseSignature]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachingContext.Provider, {
		value: {
			...state,
			refetch
		},
		children
	});
}
function useCoaching() {
	const context = (0, import_react.useContext)(CoachingContext);
	if (!context) throw new Error("useCoaching() must be used inside <CoachingProvider>.");
	return context;
}
//#endregion
export { extractAccessToken as a, post as c, useExpenses as d, useUser as f, clearToken as i, setToken as l, ExpenseProvider as n, get as o, UserProvider as r, getCurrentUser as s, CoachingProvider as t, useCoaching as u };
