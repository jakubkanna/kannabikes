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
  const targetLocale: Locale = currentLocale === "en" ? "pl" : "en";
  const leafMatch = matches[matches.length - 1];
  const alternatePaths = (leafMatch?.data as MatchDataWithAlternatePaths | undefined)
    ?.alternatePaths;
  const targetPath =
    alternatePaths?.[targetLocale] ?? localizePath(location.pathname, targetLocale);
  const targetUrl = `${targetPath}${location.search}${location.hash}`;

  return (
    <Link
      to={targetUrl}
      aria-label={messages.common.languageLabel}
      className="inline-flex items-center gap-2 rounded-full border border-current/30 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] transition hover:scale-[1.08]"
      style={{
        fontFamily: "var(--font-kanna)",
        fontVariationSettings: '"wdth" 125, "wght" 900',
        fontWeight: 900,
      }}
    >
      <span className={currentLocale === "en" ? "opacity-100" : "opacity-40"}>
        EN
      </span>
      <span aria-hidden="true" className="opacity-35">
        /
      </span>
      <span className={currentLocale === "pl" ? "opacity-100" : "opacity-40"}>
        PL
      </span>
    </Link>
  );
}
