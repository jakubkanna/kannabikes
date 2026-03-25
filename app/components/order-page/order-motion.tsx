import type { ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

export const ORDER_LAYOUT_TRANSITION = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1] as const,
};

const ORDER_ENTER_TRANSITION = {
  duration: 0.26,
  ease: [0.22, 1, 0.36, 1] as const,
};

type AnimatedOrderSectionProps = HTMLMotionProps<"section"> & {
  children: ReactNode;
};

export function AnimatedOrderSection({
  children,
  ...props
}: AnimatedOrderSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              layout: ORDER_LAYOUT_TRANSITION,
              opacity: ORDER_ENTER_TRANSITION,
              y: ORDER_ENTER_TRANSITION,
            }
      }
      {...props}
    >
      {children}
    </motion.section>
  );
}
