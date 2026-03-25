import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ORDER_LAYOUT_TRANSITION } from "./order-motion";

export function SectionStack({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      layout
      transition={shouldReduceMotion ? { duration: 0 } : { layout: ORDER_LAYOUT_TRANSITION }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-8"
    >
      {children}
    </motion.div>
  );
}
