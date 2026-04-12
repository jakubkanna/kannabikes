import type { ReactNode } from "react";

type SectionPillProps = {
  children: ReactNode;
  tone?: "light" | "dark" | "success";
};

export function SectionPill({ children, tone = "light" }: SectionPillProps) {
  const toneClassName =
    tone === "dark"
      ? "border-white/28 text-gray-100"
      : tone === "success"
        ? "border-emerald-500 text-emerald-500"
        : "border-gray-500 text-gray-500";

  return (
    <span
      className={`inline-flex rounded-full border px-1 text-xs font-medium uppercase leading-none shadow-sm ${toneClassName}`}
      style={{ fontFamily: '"Lato", sans-serif' }}
    >
      {children}
    </span>
  );
}
