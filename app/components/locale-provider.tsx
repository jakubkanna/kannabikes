import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  getMessages,
  localizePath,
  type AppMessages,
  type Locale,
} from "~/lib/i18n";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useMessages(): AppMessages {
  return getMessages(useLocale());
}

export function useLocalizedPath(pathname: string) {
  return localizePath(pathname, useLocale());
}
