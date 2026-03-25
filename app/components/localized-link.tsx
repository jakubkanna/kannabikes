import {
  Link,
  NavLink,
  type LinkProps,
  type NavLinkProps,
} from "react-router";
import { localizePath } from "~/lib/i18n";
import { useLocale } from "./locale-provider";

function localizeTo(to: LinkProps["to"] | NavLinkProps["to"], locale: "en" | "pl") {
  if (typeof to !== "string") {
    return to;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return to;
  }

  return localizePath(to, locale);
}

export function LocalizedLink(props: LinkProps) {
  const locale = useLocale();
  return <Link {...props} to={localizeTo(props.to, locale)} />;
}

export function LocalizedNavLink(props: NavLinkProps) {
  const locale = useLocale();
  return <NavLink {...props} to={localizeTo(props.to, locale)} />;
}
