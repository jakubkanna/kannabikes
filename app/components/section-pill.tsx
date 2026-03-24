import type { ReactNode } from "react";

type SectionPillProps = {
  children: ReactNode;
  tone?: "light" | "dark" | "success";
};

export function SectionPill({ children, tone = "light" }: SectionPillProps) {
  const toneClassName =
    tone === "dark"
      ? "border-white/28 text-slate-100"
      : tone === "success"
        ? "border-emerald-300 text-emerald-700"
        : "border-slate-400 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full border px-1 text-xs font-medium uppercase leading-none shadow-sm ${toneClassName}`}
    >
      {children}
    </span>
  );
}
