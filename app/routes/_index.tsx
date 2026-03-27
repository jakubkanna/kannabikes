import type { Route } from "./+types/_index";
import { useEffect, useRef, useState } from "react";
import { attachBackgroundParallax } from "~/lib/parallax";
import { SITE_NAME } from "~/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: `${SITE_NAME} | Coming Soon` },
    { name: "description", content: "Kanna Bikes is coming soon." },
  ];
}

export default function Home() {
  const baseUrl = import.meta.env.BASE_URL;
  const instagramUrl = "https://instagram.com/kannabikes";
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const [bgSrc, setBgSrc] = useState(`${baseUrl}_DSF0937_low.jpg`);

  useEffect(() => {
    if (!backgroundRef.current) return;

    return attachBackgroundParallax(backgroundRef.current);
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = `${baseUrl}_DSF0937.jpg`;
    image.onload = () => setBgSrc(`${baseUrl}_DSF0937.jpg`);

    return () => {
      image.onload = null;
    };
  }, [baseUrl]);

  return (
    <main className="landing-shell">
      <div
        ref={backgroundRef}
        aria-hidden="true"
        className="landing-background"
        style={{ backgroundImage: `url(${bgSrc})` }}
      />
      <div className="landing-overlay" aria-hidden="true" />
      <a
        className="landing-panel"
        href={instagramUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`${SITE_NAME} on Instagram`}
      >
        <img
          src={`${baseUrl}kannabikes_logotype.svg`}
          alt={SITE_NAME}
          className="landing-logo"
        />
        <p className="landing-copy">Coming soon</p>
      </a>
    </main>
  );
}
