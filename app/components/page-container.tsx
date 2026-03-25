import type { ReactNode } from "react";

export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const classes = ["mx-auto w-full max-w-6xl", className].filter(Boolean).join(" ");

  return <div className={classes}>{children}</div>;
}

export function PageShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const classes = ["page-shell bg-stone-100", className].filter(Boolean).join(" ");

  return <main className={classes}>{children}</main>;
}
