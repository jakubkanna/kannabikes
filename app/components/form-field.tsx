import type { ComponentPropsWithoutRef } from "react";

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

export function getFieldClassName(hasError = false, className?: string) {
  return joinClassNames(
    "w-full rounded-md border bg-white px-4 py-3 text-[var(--kanna-ink)] outline-none transition",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-[3px] focus:ring-red-100"
      : "border-black/90 focus:border-[var(--kanna-color)] focus:ring-[3px] focus:ring-[color:color-mix(in_srgb,var(--kanna-color)_35%,transparent)]",
    className,
  );
}

export function getLockedFieldClassName(className?: string) {
  return joinClassNames(
    "w-full rounded-md border border-stone-200 bg-white px-4 py-3 text-gray-900 outline-none",
    "cursor-default select-text focus:border-stone-200 focus:ring-0",
    className,
  );
}

type InputFieldProps = ComponentPropsWithoutRef<"input"> & {
  hasError?: boolean;
};

export function InputField({
  className,
  hasError = false,
  ...props
}: InputFieldProps) {
  return (
    <input {...props} className={getFieldClassName(hasError, className)} />
  );
}

type LockedFieldProps = Omit<ComponentPropsWithoutRef<"input">, "readOnly">;

export function LockedField({ className, ...props }: LockedFieldProps) {
  return (
    <input
      {...props}
      readOnly
      aria-readonly="true"
      className={getLockedFieldClassName(className)}
    />
  );
}

type TextareaFieldProps = ComponentPropsWithoutRef<"textarea"> & {
  hasError?: boolean;
};

export function TextareaField({
  className,
  hasError = false,
  ...props
}: TextareaFieldProps) {
  return (
    <textarea {...props} className={getFieldClassName(hasError, className)} />
  );
}

type SelectFieldProps = ComponentPropsWithoutRef<"select"> & {
  hasError?: boolean;
};

export function SelectField({
  className,
  hasError = false,
  style,
  ...props
}: SelectFieldProps) {
  return (
    <select
      {...props}
      className={getFieldClassName(
        hasError,
        joinClassNames(
          "appearance-none bg-no-repeat pr-12 [background-position:right_1rem_center] [background-size:1rem_1rem]",
          className,
        ),
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M3 6l5 5 5-5' stroke='rgba(0,0,0,0.9)' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        ...style,
      }}
    />
  );
}
