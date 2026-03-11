import type { Route } from "./+types/_index";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { SITE_NAME } from "~/root";
import { attachBackgroundParallax } from "~/lib/parallax";

export function meta({}: Route.MetaArgs) {
  return [{ title: SITE_NAME }];
}

export default function Home() {
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!backgroundRef.current) return;
    return attachBackgroundParallax(backgroundRef.current);
  }, []);

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ "--kanna-yellow": "#ffd400" } as CSSProperties}
    >
      <div
        ref={backgroundRef}
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none bg-[url('/_DSF0937.jpg')] bg-cover bg-center will-change-transform translate-x-[var(--bg-x,0px)] translate-y-[var(--bg-y,0px)] scale-[1.05]"
      />
      <div className="flex flex-col items-center">
        <a
          href="https://instagram.com/kannabikes"
          target="_blank"
          rel="noreferrer"
          aria-label={`${SITE_NAME} on Instagram`}
        >
          <img
            src="/kannabikes_logotype.svg"
            alt={SITE_NAME}
            className="h-16 w-auto max-w-full md:h-24 drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
          />
        </a>
        <a
          href="https://instagram.com/kannabikes"
          className="mt-4 text-xs uppercase tracking-[0.35em] text-[var(--kanna-yellow)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
          target="_blank"
          rel="noreferrer"
        >
          Coming soon
        </a>
      </div>
    </main>
  );
}
