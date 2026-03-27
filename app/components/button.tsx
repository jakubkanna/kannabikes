import type { ButtonHTMLAttributes } from "react";

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  shape?: "pill" | "square";
  size?: "md" | "sm";
  variant?: "primary" | "secondary";
};

export function getButtonClassName({
  className,
  shape = "square",
  size = "md",
  variant = "primary",
}: {
  className?: string;
  shape?: "pill" | "square";
  size?: "md" | "sm";
  variant?: "primary" | "secondary";
}) {
  return joinClassNames(
    "inline-flex cursor-pointer items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
    shape === "pill" ? "rounded-full" : "rounded-none",
    size === "sm"
      ? "min-h-11 px-5 py-2.5 text-sm"
      : "min-h-12 px-6 py-3 text-sm",
    variant === "primary"
      ? "bg-[var(--kanna-ink)] text-white hover:bg-black"
      : "border border-[var(--kanna-ink)] text-[var(--kanna-ink)] hover:border-black hover:bg-white",
    className,
  );
}

export function Button({
  className,
  shape = "square",
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={getButtonClassName(
        {
          className,
          shape,
          size,
          variant,
        },
      )}
    />
  );
}
