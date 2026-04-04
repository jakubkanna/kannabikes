import type { Route } from "./+types/_index";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
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
  const shouldReduceMotion = useReducedMotion();
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const lowHeroVideoRef = useRef<HTMLVideoElement | null>(null);
  const fullHeroVideoRef = useRef<HTMLVideoElement | null>(null);
  const walkerBackgroundRef = useRef<HTMLDivElement | null>(null);
  const customOrderRef = useRef<HTMLDivElement | null>(null);
  const customOrderTextRef = useRef<HTMLDivElement | null>(null);
  const customOrderButtonRef = useRef<HTMLDivElement | null>(null);
  const customOrderImageRef = useRef<HTMLDivElement | null>(null);
  const walkerTextRef = useRef<HTMLDivElement | null>(null);
  const chainringTextRef = useRef<HTMLDivElement | null>(null);
  const chainringImageRef = useRef<HTMLDivElement | null>(null);
  const baseUrl = import.meta.env.BASE_URL;
  const lowHeroVideoSrc = `${baseUrl}kannabikes_ride_low.mp4`;
  const fullHeroVideoSrc = `${baseUrl}kannabikes_ride.mp4`;
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);
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
    setIsHeroVideoReady(false);
  }, [fullHeroVideoSrc, lowHeroVideoSrc]);

  const handleFullHeroVideoCanPlayThrough = () => {
    const fullVideo = fullHeroVideoRef.current;
    if (!fullVideo) return;

    const lowVideo = lowHeroVideoRef.current;
    const currentTime = lowVideo?.currentTime ?? 0;

    if (currentTime > 0 && Number.isFinite(currentTime)) {
      try {
        fullVideo.currentTime = currentTime;
      } catch {
        // Ignore seek errors if the browser is still finalizing buffering.
      }
    }

    setIsHeroVideoReady(true);
    void fullVideo.play().catch(() => {});
  };

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
    <div className="overflow-x-clip bg-gray-300 text-gray-900">
      <main className="relative isolate mb-3 h-[calc(100svh-0.75rem)] overflow-hidden">
        <div
          ref={backgroundRef}
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden will-change-transform translate-x-[var(--bg-x,0px)] translate-y-[var(--bg-y,0px)] scale-[1.08]"
        >
          <video
            ref={lowHeroVideoRef}
            className="absolute inset-0 h-full w-full object-cover object-center"
            src={lowHeroVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
          <video
            ref={fullHeroVideoRef}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${isHeroVideoReady ? "opacity-100" : "opacity-0"}`}
            src={fullHeroVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlayThrough={handleFullHeroVideoCanPlayThrough}
          />
        </div>

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

      <section
        id="custom-order"
        className="relative h-[120vh] bg-gray-300 px-6 py-20"
      >
        <div ref={customOrderRef} className="h-full w-full">
          <div className="grid h-full gap-10 lg:grid-cols-[minmax(0,1fr)_33%] lg:items-stretch">
            <div className="flex h-full flex-col">
              <div
                ref={customOrderTextRef}
                className={`reveal-slide-left ${revealedSections.customOrderText ? "is-visible" : ""}`}
              >
                <SectionPill>{messages.home.customOrder.pill}</SectionPill>
                <h2 className="mt-6 max-w-3xl">
                  <ArchivoInkBleed
                    className="block w-full max-w-[54rem]"
                    color="var(--kanna-ink)"
                    lines={[...messages.home.customOrder.titleLines]}
                  />
                </h2>
              </div>

              <div className="pt-8 lg:mt-auto">
                <div
                  ref={customOrderButtonRef}
                  className="h-[15rem] w-[15rem] overflow-hidden"
                >
                  <LocalizedLink
                    to="/pre-order"
                    className={`reveal-button-up inline-flex h-[15rem] w-[15rem] min-h-[15rem] min-w-[15rem] shrink-0 items-center justify-center rounded-full border border-transparent bg-[var(--kanna-ink)] p-0 text-center text-[2.375rem] font-semibold leading-[0.95] text-white uppercase transition hover:border-black hover:bg-transparent hover:text-black ${revealedSections.customOrderButton ? "is-visible" : ""}`}
                  >
                    {messages.home.customOrder.button}
                  </LocalizedLink>
                </div>
              </div>
            </div>

            <div
              ref={customOrderImageRef}
              className="relative aspect-square w-full self-end overflow-hidden lg:w-[min(80vh,100%)] lg:justify-self-end"
            >
              <motion.div
                className="absolute inset-0 overflow-hidden"
                initial={
                  shouldReduceMotion ? false : { clipPath: "inset(0 0 0 100%)" }
                }
                animate={
                  shouldReduceMotion
                    ? { clipPath: "inset(0 0 0 0)" }
                    : revealedSections.customOrderImage
                      ? { clipPath: "inset(0 0 0 0)" }
                      : { clipPath: "inset(0 0 0 100%)" }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 1, ease: [0.22, 1, 0.36, 1] }
                }
                style={{ willChange: "clip-path" }}
              >
                <LocalizedLink to="/pre-order" className="block h-full w-full">
                  <img
                    src={`${baseUrl}welding-kanna.jpg`}
                    alt={messages.home.customOrder.imageAlt}
                    className="h-full w-full object-cover object-bottom-right"
                  />
                </LocalizedLink>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[var(--kanna-ink)] px-6 py-20 text-white">
        <motion.div
          ref={walkerBackgroundRef}
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center will-change-transform translate-x-[var(--walker-bg-x,0px)] translate-y-[var(--walker-bg-y,0px)] scale-[1.04]"
          initial={
            shouldReduceMotion ? false : { clipPath: "inset(0 0 100% 0)" }
          }
          animate={
            shouldReduceMotion
              ? { clipPath: "inset(0 0 0 0)" }
              : revealedSections.walkerText
                ? { clipPath: "inset(0 0 0 0)" }
                : { clipPath: "inset(0 0 100% 0)" }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 1, ease: [0.22, 1, 0.36, 1] }
          }
          style={{
            willChange: "clip-path",
            backgroundImage: `url(${baseUrl}2013_DSF6372_jakubkanna.jpg)`,
          }}
        />
        {/* Temporary teaser veil for Walker. Remove this layer to reveal the image fully. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-black/20 backdrop-blur-2xl"
        />
        <div className="relative z-10 flex min-h-[80vh] w-full items-start justify-center">
          <div className="absolute top-0 left-0">
            <SectionPill tone="dark">{messages.home.walker.pill}</SectionPill>
          </div>
          <div
            ref={walkerTextRef}
            className={`mx-auto max-w-3xl text-center reveal-slide-left ${revealedSections.walkerText ? "is-visible" : ""}`}
          >
            <h2 className="mx-auto mt-6 max-w-3xl">
              <ArchivoInkBleed
                align="center"
                className="mx-auto block w-full max-w-[34rem]"
                lines={[...messages.home.walker.titleLines]}
              />
            </h2>
          </div>
          <p className="absolute bottom-0 left-0 max-w-2xl text-sm leading-7 text-white md:text-base">
            {messages.home.walker.description}
          </p>
          <p className="absolute right-0 bottom-0 text-xs font-semibold uppercase text-white">
            {messages.common.comingSoon}
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-stone-100">
        <div className="relative grid  lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch">
          <div className="flex items-center px-6">
            <div
              ref={chainringTextRef}
              className={`relative max-w-3xl  reveal-slide-left ${revealedSections.chainringText ? "is-visible" : ""}`}
            >
              <SectionPill>{messages.home.chainring.pill}</SectionPill>
              <h2 className="mt-6 max-w-3xl">
                <ArchivoInkBleed
                  className="block w-full max-w-[34rem]"
                  color="var(--kanna-ink)"
                  lines={[...messages.home.chainring.titleLines]}
                />
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                {messages.home.chainring.description}
              </p>
              <p className="mt-8 text-xs font-semibold uppercase text-gray-900">
                {messages.common.comingSoon}
              </p>
            </div>
          </div>
          <div
            ref={chainringImageRef}
            className="relative aspect-square w-full self-center overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 overflow-hidden"
              initial={
                shouldReduceMotion ? false : { clipPath: "inset(0 0 0 100%)" }
              }
              animate={
                shouldReduceMotion
                  ? { clipPath: "inset(0 0 0 0)" }
                  : revealedSections.chainringImage
                    ? { clipPath: "inset(0 0 0 0)" }
                    : { clipPath: "inset(0 0 0 100%)" }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 1, ease: [0.22, 1, 0.36, 1] }
              }
              style={{ willChange: "clip-path" }}
            >
              <img
                src={`${baseUrl}Survior_Chainring_v147_2024-Jan-10_05-04-08PM-000_CustomizedView27250563922.webp`}
                alt={messages.home.chainring.imageAlt}
                className="h-full w-full object-cover object-left mix-blend-multiply"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
