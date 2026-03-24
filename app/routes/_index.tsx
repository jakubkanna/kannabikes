import { Link } from "react-router";
import type { Route } from "./+types/_index";
import { useEffect, useRef, useState } from "react";
import { SectionPill } from "~/components/section-pill";
import { SITE_NAME, formatPageTitle } from "~/root";
import {
  attachBackgroundParallax,
  attachSectionParallax,
} from "~/lib/parallax";

export function meta({}: Route.MetaArgs) {
  return [{ title: formatPageTitle("Home") }];
}

export default function Home() {
  const currentYear = new Date().getFullYear();
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const customOrderRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const baseUrl = import.meta.env.BASE_URL;
  const [bgSrc, setBgSrc] = useState(`${baseUrl}_DSF0937_low.jpg`);
  const [heroLogoOpacity, setHeroLogoOpacity] = useState(1);

  useEffect(() => {
    if (!backgroundRef.current) return;
    return attachBackgroundParallax(backgroundRef.current);
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
    const cleanups = [
      footerRef.current
        ? attachSectionParallax(footerRef.current, { distance: 56 })
        : null,
    ].filter((cleanup): cleanup is () => void => cleanup !== null);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

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
          <div className="px-2 pb-28 md:px-3">
            <a
              href="https://instagram.com/kannabikes"
              target="_blank"
              rel="noreferrer"
              aria-label={`${SITE_NAME} on Instagram`}
              className="block w-full"
              style={{ opacity: heroLogoOpacity }}
            >
              <img
                src={`${baseUrl}kannabikes_logotype.svg`}
                alt={SITE_NAME}
                className="w-full h-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.42)]"
              />
            </a>
            <div
              className="mt-14 h-[1.66px] w-full bg-(--kanna-color)"
              style={{ opacity: heroLogoOpacity }}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-[0.625rem] pb-9 md:px-[0.875rem]">
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
        className="relative bg-stone-100 px-4 py-20 md:px-8 md:py-28"
      >
        <div ref={customOrderRef} className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_33%] lg:items-stretch">
            <div className="flex h-full flex-col lg:justify-between">
              <div>
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
              </div>

              <div className="pt-8">
                <Link
                  to="/contact"
                  className="inline-flex h-40 w-40 items-center justify-center rounded-full border border-transparent bg-black px-6 text-center text-lg font-semibold leading-tight text-white transition hover:border-black hover:bg-white hover:text-black uppercase"
                >
                  Order custom bike
                </Link>
              </div>
            </div>

            <div className="overflow-hidden border border-stone-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <img
                src={`${baseUrl}wikiimages-welding-67640.jpg`}
                alt="Welding bicycle frame"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-black px-4 py-20 text-white md:px-8 md:py-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${baseUrl}2013_DSF6372_jakubkanna.png)`,
          }}
        />
        <div className="relative z-10 mx-auto min-h-[34rem] max-w-6xl" />
      </section>

      <section className="relative overflow-hidden bg-white px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto min-h-[28rem] max-w-6xl" />
      </section>

      <footer className="relative overflow-hidden bg-black px-4 py-20 text-white md:px-8 md:py-32">
        <div
          ref={footerRef}
          className="mx-auto flex min-h-[55svh] max-w-6xl flex-col justify-between gap-14"
          style={{ transform: "translate3d(0,var(--section-shift,0px),0)" }}
        >
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2
                className="max-w-4xl text-4xl tracking-tight md:text-7xl"
                style={{
                  fontFamily: "var(--font-kanna)",
                  fontVariationSettings: '"wdth" 125, "wght" 900',
                  fontWeight: 900,
                }}
              >
                Handbuilt with passion in Poland
              </h2>
            </div>

            <div className="space-y-14 text-sm leading-7 text-white">
              <div className="border-t border-white/10 pt-6 text-l text-right text-white md:text-2xl">
                <p>Kanna Bikes Studio</p>
                <p>Placeholder Street 12</p>
                <p>00-001 Warsaw</p>
                <p>Poland</p>
              </div>

              <div className="grid gap-8 sm:grid-cols-3">
                <div className="text-right">
                  <p className="text-xs uppercase text-white">Products</p>
                  <div className="mt-3 flex flex-col items-end gap-0.5">
                    <a href="#" className="transition hover:text-white">
                      Custom Road
                    </a>
                    <a href="#" className="transition hover:text-white">
                      All-Road
                    </a>
                    <a href="#" className="transition hover:text-white">
                      Commuter
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-white">Company</p>
                  <div className="mt-3 flex flex-col items-end gap-0.5">
                    <Link to="/about" className="transition hover:text-white">
                      About
                    </Link>
                    <Link to="/blog" className="transition hover:text-white">
                      Blog
                    </Link>
                    <a href="#" className="transition hover:text-white">
                      Studio
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-white">Support</p>
                  <div className="mt-3 flex flex-col items-end gap-0.5">
                    <Link to="/contact" className="transition hover:text-white">
                      Contact
                    </Link>
                    <a href="#" className="transition hover:text-white">
                      Delivery
                    </a>
                    <a href="#" className="transition hover:text-white">
                      Warranty
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white md:flex-row md:items-center md:justify-between">
            <p>{`© Kanna Bikes ${currentYear}`}</p>
            <div className="flex flex-wrap gap-5">
              <Link to="/privacy-terms" className="transition hover:text-white">
                Privacy & Terms
              </Link>
              <a
                href="https://instagram.com/kannabikes"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-white"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
