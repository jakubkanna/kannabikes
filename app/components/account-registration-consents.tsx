import { LocalizedLink } from "~/components/localized-link";
import { useMessages } from "~/components/locale-provider";

type AccountRegistrationConsentsProps = {
  errorMessage?: string | null;
  marketingAccepted: boolean;
  onMarketingAcceptedChange: (accepted: boolean) => void;
  onPrivacyAcceptedChange: (accepted: boolean) => void;
  privacyAccepted: boolean;
};

export function AccountRegistrationConsents({
  errorMessage,
  marketingAccepted,
  onMarketingAcceptedChange,
  onPrivacyAcceptedChange,
  privacyAccepted,
}: AccountRegistrationConsentsProps) {
  const messages = useMessages();
  const accountMessages = messages.account;
  const [privacyBeforeLink = "", privacyAfterLink = ""] =
    accountMessages.registrationPrivacyConsent.split(
      accountMessages.registrationPrivacyLink,
    );

  return (
    <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <label className="flex items-start gap-3 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(event) =>
            onPrivacyAcceptedChange(event.currentTarget.checked)
          }
          className="mt-0.5"
        />
        <span>
          {privacyBeforeLink}
          <LocalizedLink
            to="/privacy-terms"
            className="font-medium text-[var(--kanna-ink)] underline underline-offset-2"
          >
            {accountMessages.registrationPrivacyLink}
          </LocalizedLink>
          {privacyAfterLink}
        </span>
      </label>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <label className="flex items-start gap-3 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={marketingAccepted}
          onChange={(event) =>
            onMarketingAcceptedChange(event.currentTarget.checked)
          }
          className="mt-0.5"
        />
        <span>{accountMessages.registrationMarketingConsent}</span>
      </label>
    </div>
  );
}
