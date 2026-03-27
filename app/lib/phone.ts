import { loadCountryDirectory } from "./countries";

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
let phoneCountryOptionsPromise: Promise<PhoneCountryOption[]> | null = null;

function sortPhoneCountryOptions(options: PhoneCountryOption[]) {
  return options.sort((left, right) => {
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
}

export async function loadPhoneCountryOptions() {
  if (cachedPhoneCountryOptions) {
    return cachedPhoneCountryOptions;
  }

  if (phoneCountryOptionsPromise) {
    return phoneCountryOptionsPromise;
  }

  phoneCountryOptionsPromise = loadCountryDirectory()
    .then((countries) => {
      cachedPhoneCountryOptions = sortPhoneCountryOptions(
        countries
          .filter(
            (country) =>
              typeof country.phoneCode === "string" &&
              country.phoneCode.trim() !== "",
          )
          .map((country) => {
            const dialCode = normalizeDialCode(`+${country.phoneCode.trim()}`);

            return {
              countryCode: country.code,
              dialCode,
              label: `${country.code} (${dialCode})`,
              name: country.name,
            };
          }),
      );

      return cachedPhoneCountryOptions;
    })
    .catch((error) => {
      phoneCountryOptionsPromise = null;
      throw error;
    });

  return phoneCountryOptionsPromise;
}

export function parsePhoneNumberValue(
  value: string,
  defaultCountryCode = "PL",
  options: PhoneCountryOption[] = [],
) {
  const trimmedValue = value.trim();
  const normalized = normalizePhoneNumber(trimmedValue);
  const defaultOption =
    options.find((option) => option.countryCode === defaultCountryCode) ??
    options[0] ?? {
      countryCode: defaultCountryCode,
      dialCode: "",
      label: defaultCountryCode,
      name: defaultCountryCode,
    };

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

export function getDialCodeByCountryCode(
  countryCode: string,
  options: PhoneCountryOption[] = [],
) {
  const option = options.find((item) => item.countryCode === countryCode);

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
