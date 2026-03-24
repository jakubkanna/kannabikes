import { Link } from "react-router";
import type { Route } from "./+types/_index";
import { useEffect, useRef, useState } from "react";
import { SectionPill } from "~/components/section-pill";
import { SITE_NAME, formatPageTitle } from "~/root";
import { attachBackgroundParallax, attachPointerParallax } from "~/lib/parallax";

export function meta({}: Route.MetaArgs) {
  return [{ title: formatPageTitle("Home") }];
}

export default function Home() {
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
    <div className="overflow-x-clip bg-stone-100 text-slate-900">
      <main className="relative isolate mb-3 h-[calc(100svh-0.75rem)] overflow-hidden">
        <div
          ref={backgroundRef}
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center will-change-transform translate-x-[var(--bg-x,0px)] translate-y-[var(--bg-y,0px)] scale-[1.08]"
          style={{ backgroundImage: `url(${bgSrc})` }}
        />

        <section className="relative z-20 flex h-full flex-col items-stretch justify-end text-center text-white">
          <div className="px-4 pb-28 md:px-6">
            <div className="block w-full" style={{ opacity: heroLogoOpacity }}>
              <img
                src={`${baseUrl}kannabikes_logotype.svg`}
                alt={SITE_NAME}
                className="w-full h-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.42)]"
              />
            </div>
            <div
              className="mt-14 h-[1.66px] w-full bg-(--kanna-color)"
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
                <SectionPill>Custom Order</SectionPill>
                <h2
                  className="mt-4 max-w-3xl text-4xl tracking-tight text-slate-900 md:text-6xl"
                  style={{
                    fontFamily: "var(--font-kanna)",
                    fontVariationSettings: '"wdth" 125, "wght" 900',
                    fontWeight: 900,
                  }}
                >
                  Made-to-measure bicycles.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  We will build the bicycle you have been imagining around your
                  fit, riding style, and intended use.
                </p>
              </div>

              <div className="pt-8 lg:mt-auto">
                <div
                  ref={customOrderButtonRef}
                  className="h-[15rem] w-[15rem] overflow-hidden"
                >
                  <Link
                    to="/pre-order"
                    className={`reveal-button-up inline-flex h-[15rem] w-[15rem] min-h-[15rem] min-w-[15rem] shrink-0 items-center justify-center rounded-full border border-transparent bg-black p-0 text-center text-[3rem] font-semibold leading-[0.95] text-white uppercase transition hover:border-black hover:bg-white hover:text-black ${revealedSections.customOrderButton ? "is-visible" : ""}`}
                  >
                    Order custom bike
                  </Link>
                </div>
              </div>
            </div>

            <div
              ref={customOrderImageRef}
              className={`overflow-hidden border border-stone-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] reveal-slide-right ${revealedSections.customOrderImage ? "is-visible" : ""}`}
            >
              <Link to="/pre-order" className="block">
                <img
                  src={`${baseUrl}wikiimages-welding-67640.jpg`}
                  alt="Welding bicycle frame"
                  className="aspect-[4/5] w-full object-cover"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-black px-6 py-20 text-white">
        <div
          ref={walkerBackgroundRef}
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center will-change-transform translate-x-[var(--walker-bg-x,0px)] translate-y-[var(--walker-bg-y,0px)] scale-[1.04]"
          style={{
            backgroundImage: `url(${baseUrl}2013_DSF6372_jakubkanna.png)`,
          }}
        />
        <div className="relative z-10 w-full flex min-h-[34rem] items-start">
          <div
            ref={walkerTextRef}
            className={`max-w-3xl reveal-slide-left ${revealedSections.walkerText ? "is-visible" : ""}`}
          >
            <SectionPill tone="dark">New Bike</SectionPill>
            <h2
              className="mt-4 text-4xl tracking-tight text-white md:text-6xl"
              style={{
                fontFamily: "var(--font-kanna)",
                fontVariationSettings: '"wdth" 125, "wght" 900',
                fontWeight: 900,
              }}
            >
              Walker
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white md:text-base">
              32&quot;, Pinion / Effigear gearbox compatible, drop-bar mtb
            </p>
          </div>
          <p className="absolute bottom-0 left-0 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            Coming soon
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
              <SectionPill>Survivor Chainring</SectionPill>
              <h2
                className="mt-4 max-w-3xl text-4xl tracking-tight text-slate-900 md:text-6xl"
                style={{
                  fontFamily: "var(--font-kanna)",
                  fontVariationSettings: '"wdth" 125, "wght" 900',
                  fontWeight: 900,
                }}
              >
                Survivor Chainring
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Old steel fan? Resurrect your old 5-hole crankset with a new
                chainring.
              </p>
            </div>
          </div>
          <div
            ref={chainringImageRef}
            className={`flex items-center justify-end reveal-slide-right ${revealedSections.chainringImage ? "is-visible" : ""}`}
          >
            <img
              src={`${baseUrl}Survior_Chainring_v147_2024-Jan-10_05-04-08PM-000_CustomizedView27250563922.png`}
              alt="Survivor chainring"
              className="w-full max-w-xl object-contain"
            />
          </div>
          <p className="absolute bottom-6 left-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 md:left-8">
            Coming soon
          </p>
        </div>
      </section>
    </div>
  );
}
