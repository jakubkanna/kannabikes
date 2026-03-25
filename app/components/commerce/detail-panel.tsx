import type { ReactNode } from "react";

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

export function DetailPanel({
  children,
  className,
  description,
  title,
}: {
  children: ReactNode;
  className?: string;
  description?: string;
  title?: string;
}) {
  return (
    <div
      className={joinClassNames(
        "rounded-xl border border-stone-200 bg-stone-50 p-4",
        className,
      )}
    >
      {title ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
