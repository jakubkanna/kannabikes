import type { Route } from "./+types/_index";
import { useEffect, useRef, useState } from "react";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { LocalizedLink } from "~/components/localized-link";
import { useMessages } from "~/components/locale-provider";
import { SectionPill } from "~/components/section-pill";
import { SITE_NAME, formatPageTitle } from "~/root";
import {
  attachBackgroundParallax,
  attachPointerParallax,
} from "~/lib/parallax";
import { buildLocalizedMeta, getLocaleFromPath, getMessages } from "~/lib/i18n";

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.home.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.home.title),
  });
}

export default function Home() {
  const messages = useMessages();
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const walkerBackgroundRef = useRef<HTMLDivElement | null>(null);
  const customOrderRef = useRef<HTMLDivElement | null>(null);
  const customOrderTextRef = useRef<HTMLDivElement | null>(null);
  const customOrderButtonRef = useRef<HTMLDivElement | null>(null);
  const customOrderImageRef = useRef<HTMLDivElement | null>(null);
  const walkerTextRef = useRef<HTMLDivElement | null>(null);
  const chainringTextRef = useRef<HTMLDivElement | null>(null);
  const chainringImageRef = useRef<HTMLDivElement | null>(null);
  const baseUrl = import.meta.env.BASE_URL;
  const [bgSrc, setBgSrc] = useState(`${baseUrl}_DSF0937_low.jpg`);
  const [heroLogoOpacity, setHeroLogoOpacity] = useState(1);
  const [revealedSections, setRevealedSections] = useState<
    Record<string, boolean>
  >({
    customOrderText: false,
    customOrderButton: false,
    customOrderImage: false,
    walkerText: false,
    chainringText: false,
    chainringImage: false,
  });

  useEffect(() => {
    if (!backgroundRef.current) return;
    return attachBackgroundParallax(backgroundRef.current);
  }, []);

  useEffect(() => {
    if (!walkerBackgroundRef.current) return;

    return attachPointerParallax(walkerBackgroundRef.current, {
      distance: 8,
      scrollFactor: 0,
      xProperty: "--walker-bg-x",
      yProperty: "--walker-bg-y",
    });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = `${baseUrl}_DSF0937.jpg`;
    img.onload = () => setBgSrc(`${baseUrl}_DSF0937.jpg`);
    return () => {
      img.onload = null;
    };
  }, [baseUrl]);

  useEffect(() => {
    const updateHeroLogoOpacity = () => {
      if (!customOrderRef.current) {
        setHeroLogoOpacity(1);
        return;
      }

      const fadeDistance = customOrderRef.current.offsetTop;

      if (fadeDistance <= 0) {
        setHeroLogoOpacity(0);
        return;
      }

      const progress = Math.min(Math.max(window.scrollY / fadeDistance, 0), 1);
      setHeroLogoOpacity(1 - progress);
    };

    updateHeroLogoOpacity();
    window.addEventListener("scroll", updateHeroLogoOpacity, { passive: true });
    window.addEventListener("resize", updateHeroLogoOpacity);

    return () => {
      window.removeEventListener("scroll", updateHeroLogoOpacity);
      window.removeEventListener("resize", updateHeroLogoOpacity);
    };
  }, []);

  useEffect(() => {
    const observedEntries = [
      { key: "customOrderText", ref: customOrderTextRef },
      { key: "customOrderButton", ref: customOrderButtonRef },
      { key: "customOrderImage", ref: customOrderImageRef },
      { key: "walkerText", ref: walkerTextRef },
      { key: "chainringText", ref: chainringTextRef },
      { key: "chainringImage", ref: chainringImageRef },
    ] as const;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      setRevealedSections({
        customOrderText: true,
        customOrderButton: true,
        customOrderImage: true,
        walkerText: true,
        chainringText: true,
        chainringImage: true,
      });
      return;
    }

    const frameIds = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const key = entry.target.getAttribute("data-reveal-key");
          if (!key) return;

          const outerFrame = window.requestAnimationFrame(() => {
            frameIds.delete(outerFrame);
            const innerFrame = window.requestAnimationFrame(() => {
              frameIds.delete(innerFrame);
              setRevealedSections((current) =>
                current[key] ? current : { ...current, [key]: true },
              );
            });

            frameIds.add(innerFrame);
          });

          frameIds.add(outerFrame);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observedEntries.forEach(({ key, ref }) => {
      if (!ref.current) return;
      ref.current.setAttribute("data-reveal-key", key);
      observer.observe(ref.current);
    });

    return () => {
      observer.disconnect();
      frameIds.forEach((id) => window.cancelAnimationFrame(id));
      frameIds.clear();
    };
  }, []);

  return (
    <div className="overflow-x-clip bg-stone-100 text-gray-900">
      <main className="relative isolate mb-3 h-[calc(100svh-0.75rem)] overflow-hidden">
        <div
          ref={backgroundRef}
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center will-change-transform translate-x-[var(--bg-x,0px)] translate-y-[var(--bg-y,0px)] scale-[1.08]"
          style={{ backgroundImage: `url(${bgSrc})` }}
        />

        <section className="relative z-20 flex h-full flex-col items-stretch justify-end text-center text-white">
          <div className="px-4 pb-28 md:px-6">
            <div className="block w-full">
              <img
                src={`${baseUrl}kannabikes_logotype.svg`}
                alt={SITE_NAME}
                className="hero-logo-image h-auto w-full"
                style={{ opacity: heroLogoOpacity }}
              />
            </div>
            <div
              className="mx-auto mt-14 h-[1.66px] w-[calc(100%-3rem)] bg-(--kanna-color)"
              style={{ opacity: heroLogoOpacity }}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-9 md:px-6">
            <div className="flex w-[1.15rem] justify-center">
              <div className="hero-chevron">
                <span className="hero-chevron-line" />
              </div>
            </div>
            <div className="flex w-[1.15rem] justify-center">
              <div className="hero-chevron">
                <span className="hero-chevron-line" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <section id="custom-order" className="relative bg-stone-100 px-6 py-20">
        <div ref={customOrderRef} className="w-full">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_33%] lg:items-stretch">
            <div className="flex h-full flex-col">
              <div
                ref={customOrderTextRef}
                className={`reveal-slide-left ${revealedSections.customOrderText ? "is-visible" : ""}`}
              >
                <SectionPill>{messages.home.customOrder.pill}</SectionPill>
                <h2 className="mt-4 max-w-3xl">
                  <ArchivoInkBleed
                    className="block w-full max-w-[54rem]"
                    color="var(--kanna-ink)"
                    lines={[...messages.home.customOrder.titleLines]}
                  />
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                  {messages.home.customOrder.description}
                </p>
              </div>

              <div className="pt-8 lg:mt-auto">
                <div
                  ref={customOrderButtonRef}
                  className="h-[15rem] w-[15rem] overflow-hidden"
                >
                  <LocalizedLink
                    to="/pre-order"
                    className={`reveal-button-up inline-flex h-[15rem] w-[15rem] min-h-[15rem] min-w-[15rem] shrink-0 items-center justify-center rounded-full border border-transparent bg-[var(--kanna-ink)] p-0 text-center text-[3rem] font-semibold leading-[0.95] text-white uppercase transition hover:border-black hover:bg-white hover:text-black ${revealedSections.customOrderButton ? "is-visible" : ""}`}
                  >
                    {messages.home.customOrder.button}
                  </LocalizedLink>
                </div>
              </div>
            </div>

            <div
              ref={customOrderImageRef}
              className={`overflow-hidden border border-stone-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] reveal-slide-right ${revealedSections.customOrderImage ? "is-visible" : ""}`}
            >
              <LocalizedLink to="/pre-order" className="block h-full">
                <img
                  src={`${baseUrl}welding-kanna.jpg`}
                  alt={messages.home.customOrder.imageAlt}
                  className="h-full w-full object-cover"
                />
              </LocalizedLink>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[var(--kanna-ink)] px-6 py-20 text-white">
        <div
          ref={walkerBackgroundRef}
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center will-change-transform translate-x-[var(--walker-bg-x,0px)] translate-y-[var(--walker-bg-y,0px)] scale-[1.04]"
          style={{
            backgroundImage: `url(${baseUrl}2013_DSF6372_jakubkanna.jpg)`,
          }}
        />
        <div className="relative z-10 w-full flex min-h-[34rem] items-start">
          <div
            ref={walkerTextRef}
            className={`max-w-3xl reveal-slide-left ${revealedSections.walkerText ? "is-visible" : ""}`}
          >
            <SectionPill tone="dark">{messages.home.walker.pill}</SectionPill>
            <h2 className="mt-4 max-w-3xl">
              <ArchivoInkBleed
                className="block w-full max-w-[34rem]"
                lines={[...messages.home.walker.titleLines]}
              />
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white md:text-base">
              {messages.home.walker.description}
            </p>
          </div>
          <p className="absolute bottom-0 left-0 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            {messages.common.comingSoon}
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white">
        <div className="relative grid min-h-[28rem] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex items-start px-6 py-20">
            <div
              ref={chainringTextRef}
              className={`reveal-slide-left ${revealedSections.chainringText ? "is-visible" : ""}`}
            >
              <SectionPill>{messages.home.chainring.pill}</SectionPill>
              <h2 className="mt-4 max-w-3xl">
                <ArchivoInkBleed
                  className="block w-full max-w-[54rem]"
                  color="var(--kanna-ink)"
                  lines={[...messages.home.chainring.titleLines]}
                />
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                {messages.home.chainring.description}
              </p>
            </div>
          </div>
          <div
            ref={chainringImageRef}
            className={`flex items-center justify-end reveal-slide-right ${revealedSections.chainringImage ? "is-visible" : ""}`}
          >
            <img
              src={`${baseUrl}Survior_Chainring_v147_2024-Jan-10_05-04-08PM-000_CustomizedView27250563922.webp`}
              alt={messages.home.chainring.imageAlt}
              className="w-full max-w-xl object-contain"
            />
          </div>
          <p className="absolute bottom-6 left-4 text-xs font-semibold uppercase tracking-[0.18em] text-gray-900 md:left-8">
            {messages.common.comingSoon}
          </p>
        </div>
      </section>
    </div>
  );
}
