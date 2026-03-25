import type { ButtonHTMLAttributes } from "react";

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "md" | "sm";
  variant?: "primary" | "secondary";
};

export function Button({
  className,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={joinClassNames(
        "inline-flex cursor-pointer items-center justify-center rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "px-5 py-2.5 text-sm" : "px-6 py-3 text-sm",
        variant === "primary"
          ? "bg-[var(--kanna-ink)] text-white hover:bg-black"
          : "border border-[var(--kanna-ink)] text-[var(--kanna-ink)] hover:bg-white",
        className,
      )}
    />
  );
}
