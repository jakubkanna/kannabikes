import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { ArchivoInkBleed } from "./archivo-ink-bleed";

export function SiteFooter() {
  const { pathname } = useLocation();
  const currentYear = new Date().getFullYear();
  const [useHomeKannaState, setUseHomeKannaState] = useState(pathname === "/");
  const footerHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const [isFooterHeadingVisible, setIsFooterHeadingVisible] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setUseHomeKannaState(false);
      return;
    }

    const updateHomeState = () => {
      const customOrderSection = document.getElementById("custom-order");

      if (!customOrderSection) {
        setUseHomeKannaState(true);
        return;
      }

      const fadeDistance = customOrderSection.offsetTop;

      if (fadeDistance <= 0) {
        setUseHomeKannaState(false);
        return;
      }

      const progress = Math.min(Math.max(window.scrollY / fadeDistance, 0), 1);
      setUseHomeKannaState(progress < 1);
    };

    updateHomeState();
    window.addEventListener("scroll", updateHomeState, { passive: true });
    window.addEventListener("resize", updateHomeState);

    return () => {
      window.removeEventListener("scroll", updateHomeState);
      window.removeEventListener("resize", updateHomeState);
    };
  }, [pathname]);

  useEffect(() => {
    const heading = footerHeadingRef.current;

    if (!heading) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      setIsFooterHeadingVisible(true);
      return;
    }

    const frameIds = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const outerFrame = window.requestAnimationFrame(() => {
            frameIds.delete(outerFrame);
            const innerFrame = window.requestAnimationFrame(() => {
              frameIds.delete(innerFrame);
              setIsFooterHeadingVisible(true);
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

    observer.observe(heading);

    return () => {
      observer.disconnect();
      frameIds.forEach((id) => window.cancelAnimationFrame(id));
      frameIds.clear();
    };
  }, []);

  const footerClassName = useHomeKannaState
    ? "relative overflow-hidden bg-[var(--kanna-color)] px-4 py-20 text-[var(--kanna-ink)]"
    : "relative overflow-hidden bg-[var(--kanna-ink)] px-4 py-20 text-white";
  const secondaryTextClassName = useHomeKannaState
    ? "text-[var(--kanna-ink)]"
    : "text-white";
  const dividerClassName = "border-white";
  const linkClassName = useHomeKannaState
    ? "transition hover:text-[var(--kanna-ink)]"
    : "transition hover:text-white";

  return (
    <footer className={footerClassName}>
      <div className="w-full md:px-4 flex min-h-[55svh] flex-col justify-between gap-14">
        <div
          className={`space-y-25 text-sm leading-7 ${secondaryTextClassName}`}
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <h2
              ref={footerHeadingRef}
              className={`max-w-4xl reveal-slide-left ${isFooterHeadingVisible ? "is-visible" : ""}`}
            >
              <ArchivoInkBleed
                className="block w-full"
                color={useHomeKannaState ? "var(--kanna-ink)" : "#f3f3ea"}
                lines={["Handbuilt with", "passion in Poland"]}
                fontSize={1255}
              />
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-right">
                <p className={`text-xs uppercase ${secondaryTextClassName}`}>
                  Products
                </p>
                <div className="mt-3 flex flex-col items-end gap-0.5">
                  <a href="#" className={linkClassName}>
                    Custom Road
                  </a>
                  <a href="#" className={linkClassName}>
                    All-Road
                  </a>
                  <a href="#" className={linkClassName}>
                    Commuter
                  </a>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase ${secondaryTextClassName}`}>
                  Company
                </p>
                <div className="mt-3 flex flex-col items-end gap-0.5">
                  <Link to="/about" className={linkClassName}>
                    About
                  </Link>
                  <Link to="/blog" className={linkClassName}>
                    Blog
                  </Link>
                  <a href="#" className={linkClassName}>
                    Studio
                  </a>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase ${secondaryTextClassName}`}>
                  Support
                </p>
                <div className="mt-3 flex flex-col items-end gap-0.5">
                  <Link to="/contact" className={linkClassName}>
                    Contact
                  </Link>
                  <a href="#" className={linkClassName}>
                    Delivery
                  </a>
                  <a href="#" className={linkClassName}>
                    Warranty
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div />
            <p
              className={`pt-4 self-start text-l text-right md:text-xl ${secondaryTextClassName}`}
            >
              Kanna Bikes Studio
              <br />
              Placeholder Street 12
              <br />
              00-001 Warsaw
              <br />
              Poland
            </p>
          </div>
        </div>

        <div
          className={`flex flex-col gap-4 border-t pt-8 text-xs md:flex-row md:items-center md:justify-between ${dividerClassName} ${secondaryTextClassName}`}
        >
          <p className="flex flex-wrap items-center gap-2">
            <span>{`© Kanna Bikes ${currentYear}`}</span>
            <span aria-hidden="true">·</span>
            <span>designed and developed by</span>
            <a
              href="https://studio.jakubkanna.com"
              target="_blank"
              rel="noreferrer"
              className={linkClassName}
            >
              STUDIO JKN
            </a>
          </p>
          <div className="flex flex-wrap gap-5">
            <Link to="/privacy-terms" className={linkClassName}>
              Privacy & Terms
            </Link>
            <a
              href="https://instagram.com/kannabikes"
              target="_blank"
              rel="noreferrer"
              className={linkClassName}
            >
              Instagram
            </a>
            <a
              href="https://www.youtube.com/@kannabikes"
              target="_blank"
              rel="noreferrer"
              className={linkClassName}
            >
              YouTube
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
