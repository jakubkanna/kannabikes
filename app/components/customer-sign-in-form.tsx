import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "~/components/button";
import { InputField } from "~/components/form-field";
import { GoogleAuthButton } from "~/components/google-auth-button";
import { LocalizedLink } from "~/components/localized-link";
import { useMessages } from "~/components/locale-provider";
import {
  getForgotPasswordPath,
  getGoogleAuthUrl,
  normalizeFrontendRedirectPath,
} from "~/lib/auth";
import {
  loginCustomerSession,
  type CustomerSession,
} from "~/lib/customer-account";
import type { Locale } from "~/lib/i18n";

type CustomerSignInFormProps = {
  description?: ReactNode;
  googleRedirectTo?: string | null;
  initialLoginValue?: string;
  locale: Locale;
  onRequestSignUp?: () => void;
  onSuccess?: (session: CustomerSession) => void | Promise<void>;
  redirectTo?: string | null;
  secondaryDescription?: ReactNode;
  showSignUpPrompt?: boolean;
  title?: ReactNode;
  variant?: "inline" | "page";
};

export function CustomerSignInForm({
  description,
  googleRedirectTo,
  initialLoginValue = "",
  locale,
  onRequestSignUp,
  onSuccess,
  redirectTo,
  secondaryDescription,
  showSignUpPrompt = true,
  title,
  variant = "inline",
}: CustomerSignInFormProps) {
  const messages = useMessages();
  const [loginValue, setLoginValue] = useState(initialLoginValue);
  const [passwordValue, setPasswordValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isPageVariant = variant === "page";
  const normalizedRedirectTo = useMemo(
    () => normalizeFrontendRedirectPath(redirectTo),
    [redirectTo],
  );

  useEffect(() => {
    setLoginValue(initialLoginValue);
  }, [initialLoginValue]);

  const forgotPasswordPath = useMemo(
    () =>
      getForgotPasswordPath({
        locale,
        redirectTo,
      }),
    [locale, redirectTo],
  );
  const googleAuthUrl = useMemo(
    () =>
      getGoogleAuthUrl({
        intent: "sign-in",
        locale,
        redirectTo: googleRedirectTo ?? redirectTo,
      }),
    [googleRedirectTo, locale, redirectTo],
  );
  const signUpPath = useMemo(() => {
    if (!normalizedRedirectTo) {
      return "/sign-up";
    }

    return `/sign-up?redirect=${encodeURIComponent(normalizedRedirectTo)}`;
  }, [normalizedRedirectTo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const session = await loginCustomerSession({
        locale,
        login: loginValue,
        password: passwordValue,
      });

      setPasswordValue("");
      await onSuccess?.(session);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : messages.account.signInError,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {title ? (
        <h2 className="text-lg font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/75">
          {description}
        </p>
      ) : null}
      {secondaryDescription ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/75">
          {secondaryDescription}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className={isPageVariant ? "mt-8 space-y-6" : "mt-6 space-y-4"}
      >
        <label className="block">
          <span
            className={`mb-2 block font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)] ${
              isPageVariant ? "text-sm" : "text-xs"
            }`}
          >
            {messages.account.emailLabel}
          </span>
          <InputField
            autoComplete="username"
            name="log"
            type="text"
            value={loginValue}
            onChange={(event) => setLoginValue(event.currentTarget.value)}
            className={isPageVariant ? "text-base" : undefined}
          />
        </label>

        <label className="block">
          <span
            className={`mb-2 block font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)] ${
              isPageVariant ? "text-sm" : "text-xs"
            }`}
          >
            {messages.account.passwordLabel}
          </span>
          <InputField
            autoComplete="current-password"
            name="pwd"
            type="password"
            value={passwordValue}
            onChange={(event) => setPasswordValue(event.currentTarget.value)}
            className={isPageVariant ? "text-base" : undefined}
          />
        </label>

        <div
          className={
            isPageVariant
              ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              : "flex items-center justify-between gap-4"
          }
        >
          <LocalizedLink
            to={forgotPasswordPath}
            className="text-sm font-semibold text-[var(--kanna-ink)] transition hover:text-black"
          >
            {messages.account.forgotPassword}
          </LocalizedLink>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={
              isPageVariant
                ? "flex min-h-14 w-full items-center justify-center rounded-none text-base sm:w-auto sm:min-w-[15rem]"
                : "min-h-11 rounded-none px-5"
            }
          >
            {messages.account.signInCta}
          </Button>
        </div>

        {submitError ? (
          <p className="text-sm font-medium text-red-600">{submitError}</p>
        ) : null}
      </form>

      <div
        className={
          isPageVariant
            ? "mt-10 flex items-center gap-6"
            : "mt-6 flex items-center gap-4"
        }
      >
        <div className="h-px flex-1 bg-black/15" />
        <span
          className={`font-semibold uppercase  text-[var(--kanna-ink)] ${
            isPageVariant ? "text-sm" : "text-xs"
          }`}
        >
          {messages.account.or}
        </span>
        <div className="h-px flex-1 bg-black/15" />
      </div>

      <div className={isPageVariant ? "mt-10" : "mt-6 space-y-4"}>
        <GoogleAuthButton
          href={googleAuthUrl}
          className={
            isPageVariant
              ? "flex min-h-14 w-full justify-center text-base"
              : "flex min-h-11 w-full justify-center text-sm"
          }
        >
          {messages.account.continueWithGoogle}
        </GoogleAuthButton>

        {showSignUpPrompt ? (
          <p
            className={
              isPageVariant
                ? "mt-10 text-sm text-[var(--kanna-ink)]"
                : "text-sm text-[var(--kanna-ink)]"
            }
          >
            {messages.account.joinPrompt}{" "}
            {onRequestSignUp ? (
              <button
                type="button"
                onClick={onRequestSignUp}
                className="font-semibold underline underline-offset-2 transition hover:text-black"
              >
                {messages.account.signUpTitle}
              </button>
            ) : (
              <LocalizedLink
                to={signUpPath}
                className="font-semibold underline underline-offset-2 transition hover:text-black"
              >
                {messages.account.signUpTitle}
              </LocalizedLink>
            )}
          </p>
        ) : null}
      </div>
    </>
  );
}
