import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Car,
  CircleDollarSign,
  Film,
  HeartPulse,
  Home,
  LucideProps,
  Plane,
  Plug,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Utensils,
} from "lucide-react";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({
  value,
  prefix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let frame = 0;
    const start = displayValue;
    const delta = value - start;
    const totalFrames = 24;

    function tick() {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + delta * eased);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    const id = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(id);
  }, [value]);

  return <>{prefix}{displayValue.toFixed(decimals)}</>;
}

export function CategoryIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const key = name.toLowerCase();
  const Icon =
    key.includes("food") ? Utensils :
    key.includes("grocery") ? ShoppingCart :
    key.includes("transport") ? Car :
    key.includes("rent") ? Home :
    key.includes("utilit") ? Plug :
    key.includes("shopping") ? ShoppingBag :
    key.includes("entertain") ? Film :
    key.includes("health") ? HeartPulse :
    key.includes("travel") ? Plane :
    key.includes("subscription") ? Receipt :
    CircleDollarSign;

  return <Icon {...props} />;
}
