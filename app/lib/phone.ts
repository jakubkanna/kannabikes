import { Country } from "country-state-city";

export function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function normalizeDialCode(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");

  if (normalized === "") {
    return "";
  }

  if (normalized.startsWith("+")) {
    return `+${normalized.slice(1).replace(/\+/g, "")}`;
  }

  return `+${normalized.replace(/\+/g, "")}`;
}

export function isPhoneNumberWithCountryCode(value: string) {
  const normalized = normalizePhoneNumber(value.trim());

  if (!normalized.startsWith("+")) {
    return false;
  }

  if (normalized.indexOf("+", 1) !== -1) {
    return false;
  }

  return normalized.slice(1).length >= 7;
}

export type PhoneCountryOption = {
  countryCode: string;
  dialCode: string;
  label: string;
  name: string;
};

const PRIORITY_COUNTRY_CODES = ["PL", "DE", "FR", "GB", "US"];

let cachedPhoneCountryOptions: PhoneCountryOption[] | null = null;

export function getPhoneCountryOptions() {
  if (cachedPhoneCountryOptions) {
    return cachedPhoneCountryOptions;
  }

  cachedPhoneCountryOptions = Country.getAllCountries()
    .filter((country) => typeof country.phonecode === "string" && country.phonecode.trim() !== "")
    .map((country) => {
      const dialCode = normalizeDialCode(`+${country.phonecode.trim()}`);

      return {
        countryCode: country.isoCode,
        dialCode,
        label: `${country.isoCode} (${dialCode})`,
        name: country.name,
      };
    })
    .sort((left, right) => {
      const leftPriority = PRIORITY_COUNTRY_CODES.indexOf(left.countryCode);
      const rightPriority = PRIORITY_COUNTRY_CODES.indexOf(right.countryCode);

      if (leftPriority !== -1 || rightPriority !== -1) {
        if (leftPriority === -1) {
          return 1;
        }

        if (rightPriority === -1) {
          return -1;
        }

        return leftPriority - rightPriority;
      }

      return left.name.localeCompare(right.name);
    });

  return cachedPhoneCountryOptions;
}

export function parsePhoneNumberValue(
  value: string,
  defaultCountryCode = "PL",
) {
  const trimmedValue = value.trim();
  const normalized = normalizePhoneNumber(trimmedValue);
  const options = getPhoneCountryOptions();
  const defaultOption =
    options.find((option) => option.countryCode === defaultCountryCode) ??
    options[0];

  if (trimmedValue === "") {
    return {
      countryCode: defaultOption?.countryCode ?? "PL",
      dialCode: "",
      localNumber: "",
    };
  }

  if (trimmedValue.startsWith("+")) {
    const parts = trimmedValue.split(/\s+/, 2);
    const typedDialCode = normalizeDialCode(parts[0] ?? "");

    if (typedDialCode !== "" && parts.length > 1) {
      const matchedOption = options.find(
        (option) => option.dialCode === typedDialCode,
      );

      return {
        countryCode: matchedOption?.countryCode ?? defaultOption?.countryCode ?? "PL",
        dialCode: typedDialCode,
        localNumber: parts[1] ?? "",
      };
    }
  }

  if (!normalized.startsWith("+")) {
    return {
      countryCode: defaultOption?.countryCode ?? "PL",
      dialCode: "",
      localNumber: normalized,
    };
  }

  const match = [...options]
    .sort((left, right) => right.dialCode.length - left.dialCode.length)
    .find((option) => normalized.startsWith(option.dialCode));

  if (!match) {
    return {
      countryCode: defaultOption?.countryCode ?? "PL",
      dialCode: normalized,
      localNumber: "",
    };
  }

  return {
    countryCode: match.countryCode,
    dialCode: match.dialCode,
    localNumber: normalized.slice(match.dialCode.length),
  };
}

export function getDialCodeByCountryCode(countryCode: string) {
  const option = getPhoneCountryOptions().find(
    (item) => item.countryCode === countryCode,
  );

  return option?.dialCode ?? "+";
}

export function combinePhoneNumber(dialCode: string, localNumber: string) {
  const normalizedLocalNumber = localNumber.replace(/[^\d\s()-]/g, "").trim();
  const normalizedDialCode = normalizeDialCode(dialCode);

  if (!normalizedDialCode) {
    return normalizedLocalNumber;
  }

  return normalizedLocalNumber
    ? `${normalizedDialCode} ${normalizedLocalNumber}`
    : normalizedDialCode;
}
