import { Link, useLocation, useMatches } from "react-router";
import { getLocaleFromPath, localizePath, type Locale } from "~/lib/i18n";
import { useMessages } from "./locale-provider";

type MatchDataWithAlternatePaths = {
  alternatePaths?: Partial<Record<Locale, string>>;
};

export function LanguageSwitcher() {
  const location = useLocation();
  const messages = useMessages();
  const matches = useMatches();
  const currentLocale = getLocaleFromPath(location.pathname);
  const leafMatch = matches[matches.length - 1];
  const alternatePaths = (
    leafMatch?.data as MatchDataWithAlternatePaths | undefined
  )?.alternatePaths;
  const getLocaleUrl = (locale: Locale) => {
    const targetPath =
      alternatePaths?.[locale] ?? localizePath(location.pathname, locale);

    return `${targetPath}${location.search}${location.hash}`;
  };

  return (
    <div
      aria-label={messages.common.languageLabel}
      className="inline-flex items-center gap-1 rounded-full border border-current/30 p-1 text-[0.68rem] font-black uppercase tracking-[0.16em]"
      style={{
        fontFamily: "var(--font-kanna)",
        fontVariationSettings: '"wdth" 125, "wght" 900',
        fontWeight: 900,
      }}
    >
      <Link
        to={getLocaleUrl("en")}
        aria-current={currentLocale === "en" ? "page" : undefined}
        className={`rounded-full px-2 py-0.5 transition ${
          currentLocale === "en"
            ? "border border-current opacity-100"
            : "opacity-40 hover:opacity-100"
        }`}
      >
        EN
      </Link>
      <span aria-hidden="true" className="opacity-35">
        /
      </span>
      <Link
        to={getLocaleUrl("pl")}
        aria-current={currentLocale === "pl" ? "page" : undefined}
        className={`rounded-full px-2 py-0.5 transition ${
          currentLocale === "pl"
            ? "border border-current opacity-100"
            : "opacity-40 hover:opacity-100"
        }`}
      >
        PL
      </Link>
    </div>
  );
}
