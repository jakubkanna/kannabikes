import type { ReactNode } from "react";

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

export function GoogleAuthButton({
  children,
  className,
  disabled = false,
  href,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string | null;
}) {
  const classes = joinClassNames(
    "inline-flex min-h-12 items-center justify-center gap-3 border border-[var(--kanna-ink)] bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)] transition",
    disabled
      ? "cursor-not-allowed opacity-60"
      : "cursor-pointer hover:border-black hover:text-black",
    className,
  );

  const content = (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0"
      >
        <path
          d="M21.6 12.23c0-.7-.06-1.37-.18-2.02H12v3.82h5.39a4.62 4.62 0 0 1-2 3.03v2.52h3.23c1.9-1.75 2.98-4.34 2.98-7.35Z"
          fill="#4285F4"
        />
        <path
          d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.23-2.52c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.58-4.12H3.08v2.6A10 10 0 0 0 12 22Z"
          fill="#34A853"
        />
        <path
          d="M6.42 13.89A5.97 5.97 0 0 1 6.1 12c0-.66.11-1.3.32-1.89V7.5H3.08A10 10 0 0 0 2 12c0 1.6.38 3.1 1.08 4.5l3.34-2.61Z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.98c1.47 0 2.79.5 3.83 1.48l2.87-2.87C16.95 2.98 14.7 2 12 2A10 10 0 0 0 3.08 7.5l3.34 2.61C7.2 7.74 9.4 5.98 12 5.98Z"
          fill="#EA4335"
        />
      </svg>
      <span>{children}</span>
    </>
  );

  if (disabled || !href) {
    return (
      <span aria-disabled="true" className={classes}>
        {content}
      </span>
    );
  }

  return (
    <a href={href} className={classes}>
      {content}
    </a>
  );
}
