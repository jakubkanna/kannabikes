type CountryRecord = {
  isoCode: string;
  name: string;
  phonecode: string;
};

export type CountryDirectoryEntry = {
  code: string;
  name: string;
  phoneCode: string;
};

const PRIORITY_COUNTRY_CODES = ["PL", "DE", "FR", "GB", "US"];

let cachedCountryDirectory: CountryDirectoryEntry[] | null = null;
let countryDirectoryPromise: Promise<CountryDirectoryEntry[]> | null = null;

function sortCountryDirectory(options: CountryDirectoryEntry[]) {
  return options.sort((left, right) => {
    const leftPriority = PRIORITY_COUNTRY_CODES.indexOf(left.code);
    const rightPriority = PRIORITY_COUNTRY_CODES.indexOf(right.code);

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

export async function loadCountryDirectory() {
  if (cachedCountryDirectory) {
    return cachedCountryDirectory;
  }

  if (countryDirectoryPromise) {
    return countryDirectoryPromise;
  }

  countryDirectoryPromise = import("country-state-city/lib/assets/country.json")
    .then((module) => {
      const records = Array.isArray(module.default)
        ? (module.default as CountryRecord[])
        : [];

      cachedCountryDirectory = sortCountryDirectory(
        records.map((country) => ({
          code: country.isoCode,
          name: country.name,
          phoneCode: country.phonecode,
        })),
      );

      return cachedCountryDirectory;
    })
    .catch((error) => {
      countryDirectoryPromise = null;
      throw error;
    });

  return countryDirectoryPromise;
}

export function findCountryByCode(
  countryCode: string,
  options: CountryDirectoryEntry[] = [],
) {
  const normalizedCountryCode = countryCode.trim().toUpperCase();

  return options.find((option) => option.code === normalizedCountryCode);
}

export function findCountryByName(
  countryName: string,
  options: CountryDirectoryEntry[] = [],
) {
  const normalizedCountryName = countryName.trim().toLowerCase();

  return options.find(
    (option) => option.name.trim().toLowerCase() === normalizedCountryName,
  );
}
