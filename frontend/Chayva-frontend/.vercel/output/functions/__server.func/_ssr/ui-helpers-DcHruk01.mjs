import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { H as Car, P as Film, b as Plug, j as HeartPulse, k as House, m as ShoppingBag, p as ShoppingCart, r as Utensils, v as Receipt, x as Plane, z as CircleDollarSign } from "../_libs/lucide-react.mjs";
import { t as motion } from "../_libs/framer-motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ui-helpers-DcHruk01.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PageTransition({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		initial: {
			opacity: 0,
			y: 12
		},
		animate: {
			opacity: 1,
			y: 0
		},
		exit: {
			opacity: 0,
			y: 8
		},
		transition: {
			duration: .28,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		children
	});
}
function CountUp({ value, prefix = "", decimals = 0 }) {
	const [displayValue, setDisplayValue] = (0, import_react.useState)(value);
	(0, import_react.useEffect)(() => {
		let frame = 0;
		const start = displayValue;
		const delta = value - start;
		const totalFrames = 24;
		function tick() {
			frame += 1;
			const progress = Math.min(frame / totalFrames, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			setDisplayValue(start + delta * eased);
			if (progress < 1) window.requestAnimationFrame(tick);
		}
		const id = window.requestAnimationFrame(tick);
		return () => window.cancelAnimationFrame(id);
	}, [value]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [prefix, displayValue.toFixed(decimals)] });
}
function CategoryIcon({ name, ...props }) {
	const key = name.toLowerCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(key.includes("food") ? Utensils : key.includes("grocery") ? ShoppingCart : key.includes("transport") ? Car : key.includes("rent") ? House : key.includes("utilit") ? Plug : key.includes("shopping") ? ShoppingBag : key.includes("entertain") ? Film : key.includes("health") ? HeartPulse : key.includes("travel") ? Plane : key.includes("subscription") ? Receipt : CircleDollarSign, { ...props });
}
//#endregion
export { CountUp as n, PageTransition as r, CategoryIcon as t };
