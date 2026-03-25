import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PageContainer } from "~/components/page-container";
import { ORDER_LAYOUT_TRANSITION } from "./order-motion";

export function SectionStack({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <PageContainer>
      <motion.div
        layout
        transition={shouldReduceMotion ? { duration: 0 } : { layout: ORDER_LAYOUT_TRANSITION }}
        className="flex w-full flex-col gap-8"
      >
        {children}
      </motion.div>
    </PageContainer>
  );
}
