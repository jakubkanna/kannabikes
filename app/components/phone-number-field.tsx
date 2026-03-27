import { useEffect, useId, useMemo, useState } from "react";
import { InputField } from "~/components/form-field";
import { useMessages } from "~/components/locale-provider";
import {
  combinePhoneNumber,
  getPhoneCountryOptions,
  normalizeDialCode,
  parsePhoneNumberValue,
} from "~/lib/phone";

type PhoneNumberFieldProps = {
  className?: string;
  defaultCountryCode?: string;
  hasError?: boolean;
  inputClassName?: string;
  onChange: (value: string) => void;
  selectClassName?: string;
  value: string;
};

export function PhoneNumberField({
  className,
  defaultCountryCode = "PL",
  hasError = false,
  inputClassName,
  onChange,
  selectClassName,
  value,
}: PhoneNumberFieldProps) {
  const messages = useMessages();
  const suggestionListId = useId();
  const countryOptions = useMemo(() => getPhoneCountryOptions(), []);
  const parsedValue = useMemo(
    () => parsePhoneNumberValue(value, defaultCountryCode),
    [defaultCountryCode, value],
  );
  const [dialCode, setDialCode] = useState(parsedValue.dialCode);
  const [localNumber, setLocalNumber] = useState(parsedValue.localNumber);

  useEffect(() => {
    setDialCode(parsedValue.dialCode);
    setLocalNumber(parsedValue.localNumber);
  }, [parsedValue.dialCode, parsedValue.localNumber]);

  return (
    <div className={`grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)] ${className ?? ""}`}>
      <InputField
        aria-label={messages.common.phoneCountryCode}
        className={selectClassName}
        hasError={hasError}
        inputMode="tel"
        list={suggestionListId}
        placeholder="+48"
        type="tel"
        value={dialCode}
        onChange={(event) => {
          const nextDialCode = normalizeDialCode(event.currentTarget.value);
          setDialCode(nextDialCode);
          onChange(combinePhoneNumber(nextDialCode, localNumber));
        }}
      />
      <datalist id={suggestionListId}>
        {countryOptions.map((option) => (
          <option
            key={option.countryCode}
            value={option.dialCode}
            label={`${option.countryCode} - ${option.name}`}
          />
        ))}
      </datalist>
      <InputField
        aria-label={messages.common.phoneNumber}
        className={inputClassName}
        hasError={hasError}
        inputMode="tel"
        placeholder={messages.common.phoneNumberLocalExample}
        type="tel"
        value={localNumber}
        onChange={(event) => {
          const nextLocalNumber = event.currentTarget.value;
          setLocalNumber(nextLocalNumber);
          onChange(combinePhoneNumber(dialCode, nextLocalNumber));
        }}
      />
    </div>
  );
}
