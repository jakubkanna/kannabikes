import type { Route } from "./+types/_index";
import { useEffect, useRef, useState } from "react";
import { SITE_NAME } from "~/root";
import { attachBackgroundParallax } from "~/lib/parallax";

export function meta({}: Route.MetaArgs) {
  return [{ title: `${SITE_NAME} | Home` }];
}

export default function Home() {
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const baseUrl = import.meta.env.BASE_URL;
  const [bgSrc, setBgSrc] = useState(`${baseUrl}_DSF0937_low.jpg`);

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

  return (
    <main className="h-screen overflow-hidden px-6">
      <div
        ref={backgroundRef}
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none bg-cover bg-center will-change-transform translate-x-[var(--bg-x,0px)] translate-y-[var(--bg-y,0px)] scale-[1.05]"
        style={{ backgroundImage: `url(${bgSrc})` }}
      />
      <div className="fixed inset-0 flex flex-col items-center justify-center px-6 sm:px-0">
        <a
          href="https://instagram.com/kannabikes"
          target="_blank"
          rel="noreferrer"
          aria-label={`${SITE_NAME} on Instagram`}
        >
          <img
            src={`${baseUrl}kannabikes_logotype.svg`}
            alt={SITE_NAME}
            className="h-16 w-auto max-w-full md:h-24 drop-shadow-[0_2px_6px_rgba(0,0,0,0.33)]"
          />
        </a>
        <a
          href="https://instagram.com/kannabikes"
          className="mt-4 text-xs uppercase tracking-[0.35em] text-(--kanna-yellow) drop-shadow-[0_2px_6px_rgba(0,0,0,0.33)]"
          target="_blank"
          rel="noreferrer"
        >
          Coming soon
        </a>
      </div>
    </main>
  );
}
