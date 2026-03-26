import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import {
  COOKIE_PREFERENCES_EVENT,
  applyAnalyticsConsent,
  clearGoogleAnalyticsCookies,
  initializeGoogleConsentMode,
  isAnalyticsConfigured,
  readAnalyticsConsent,
  trackClickEvent,
  trackPageView,
  writeAnalyticsConsent,
  type AnalyticsConsentStatus,
} from "~/lib/analytics";
import { LocalizedLink } from "./localized-link";
import { useLocale, useMessages } from "./locale-provider";

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "";
}

function getClickTargetDetails(element: Element) {
  if (typeof window === "undefined") {
    return null;
  }

  if (element instanceof HTMLAnchorElement) {
    const rawHref = element.getAttribute("href");

    if (!rawHref || rawHref === "#") {
      return null;
    }

    const resolvedUrl = new URL(rawHref, window.location.origin);

    return {
      clickTarget:
        resolvedUrl.origin === window.location.origin
          ? `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`
          : resolvedUrl.href,
      clickType: "link",
      isOutbound: resolvedUrl.origin !== window.location.origin,
    };
  }

  if (
    element instanceof HTMLInputElement &&
    element.type.toLowerCase() === "submit"
  ) {
    return {
      clickTarget: element.name || element.id || "submit",
      clickType: "submit",
      isOutbound: false,
    };
  }

  if (element instanceof HTMLButtonElement) {
    return {
      clickTarget: element.name || element.id || "button",
      clickType: "button",
      isOutbound: false,
    };
  }

  return {
    clickTarget:
      element.getAttribute("data-analytics-target") ??
      element.getAttribute("aria-label") ??
      element.id ??
      element.tagName.toLowerCase(),
    clickType: "button",
    isOutbound: false,
  };
}

export function CookieConsentBanner() {
  const location = useLocation();
  const locale = useLocale();
  const messages = useMessages();
  const [consentStatus, setConsentStatus] =
    useState<AnalyticsConsentStatus | null>(null);
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const analyticsEnabled = isAnalyticsConfigured();

  useEffect(() => {
    if (!analyticsEnabled) {
      return;
    }

    initializeGoogleConsentMode();

    const storedConsent = readAnalyticsConsent();
    setConsentStatus(storedConsent);
    setIsBannerOpen(storedConsent === null);

    if (storedConsent === "accepted") {
      applyAnalyticsConsent("accepted");
      return;
    }

    applyAnalyticsConsent("rejected");
  }, [analyticsEnabled]);

  useEffect(() => {
    if (!analyticsEnabled) {
      return;
    }

    const openPreferences = () => {
      setIsBannerOpen(true);
    };

    window.addEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);

    return () => {
      window.removeEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);
    };
  }, [analyticsEnabled]);

  useEffect(() => {
    if (!analyticsEnabled || consentStatus !== "accepted") {
      return;
    }

    trackPageView({
      locale,
      pagePath:
        location.pathname + location.search + location.hash,
      pageTitle: document.title,
    });
  }, [
    analyticsEnabled,
    consentStatus,
    locale,
    location.hash,
    location.pathname,
    location.search,
  ]);

  useEffect(() => {
    if (!analyticsEnabled || consentStatus !== "accepted") {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const interactiveElement = event.target.closest(
        'a[href], button, input[type="submit"], [role="button"]',
      );

      if (!interactiveElement) {
        return;
      }

      if (interactiveElement.closest('[data-analytics-ignore="true"]')) {
        return;
      }

      const targetDetails = getClickTargetDetails(interactiveElement);

      if (!targetDetails) {
        return;
      }

      const clickLabel =
        normalizeText(
          interactiveElement.getAttribute("data-analytics-label"),
        ) ||
        normalizeText(interactiveElement.getAttribute("aria-label")) ||
        normalizeText(
          interactiveElement instanceof HTMLInputElement
            ? interactiveElement.value
            : interactiveElement.textContent,
        ) ||
        targetDetails.clickTarget;

      trackClickEvent({
        clickLabel,
        clickTarget: targetDetails.clickTarget,
        clickType: targetDetails.clickType,
        isOutbound: targetDetails.isOutbound,
        section:
          interactiveElement.closest("[data-analytics-section]")?.getAttribute(
            "data-analytics-section",
          ) ?? "global",
      });
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [analyticsEnabled, consentStatus]);

  if (!analyticsEnabled) {
    return null;
  }

  const closeBanner = (status: AnalyticsConsentStatus) => {
    writeAnalyticsConsent(status);
    setConsentStatus(status);
    setIsBannerOpen(false);

    if (status === "accepted") {
      applyAnalyticsConsent("accepted");
      return;
    }

    applyAnalyticsConsent("rejected");
    clearGoogleAnalyticsCookies();
  };

  return isBannerOpen ? (
    <aside
      data-analytics-ignore="true"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-[28px] border border-stone-300 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.16)]"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={() => closeBanner("rejected")}
        className="absolute right-5 top-5 text-sm font-medium lowercase text-slate-500 transition hover:text-slate-900"
      >
        {messages.cookieConsent.rejectSimple}
      </button>

      <div className="flex flex-col gap-4 pb-24 pr-16 md:pb-8 md:pr-44">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">
            {messages.cookieConsent.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            {consentStatus === null
              ? messages.cookieConsent.title
              : messages.cookieConsent.manageTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {messages.cookieConsent.description}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {messages.cookieConsent.detailsBeforeLink}{" "}
            <LocalizedLink
              to="/privacy-terms"
              className="font-medium text-slate-900 underline underline-offset-4"
            >
              {messages.cookieConsent.privacyLink}
            </LocalizedLink>
            {messages.cookieConsent.detailsAfterLink}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => closeBanner("accepted")}
        className="absolute bottom-5 right-5 inline-flex items-center justify-center rounded-2xl bg-[var(--kanna-ink)] px-6 py-4 text-base font-semibold text-white transition hover:bg-black md:px-8 md:py-5 md:text-lg"
      >
        {messages.cookieConsent.accept}
      </button>
    </aside>
  ) : null;
}
