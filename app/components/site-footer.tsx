import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { stripLocalePrefix } from "~/lib/i18n";
import { LocalizedLink } from "./localized-link";
import { useMessages } from "./locale-provider";

export function SiteFooter() {
  const { pathname } = useLocation();
  const messages = useMessages();
  const currentYear = new Date().getFullYear();
  const baseUrl = import.meta.env.BASE_URL;
  const footerHeadingSrc = pathname.startsWith("/pl")
    ? `${baseUrl}recznie-budowane-z-pasja-w-polsce-mark.svg`
    : `${baseUrl}handbuilt-with-poland-mark.svg`;
  const [useHomeKannaState, setUseHomeKannaState] = useState(
    stripLocalePrefix(pathname) === "/",
  );
  const footerHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const [isFooterHeadingVisible, setIsFooterHeadingVisible] = useState(false);

  useEffect(() => {
    if (stripLocalePrefix(pathname) !== "/") {
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
              <img
                src={footerHeadingSrc}
                alt={messages.footer.headingLines.join(" ")}
                className={`block w-full ${useHomeKannaState ? "brightness-0" : ""}`}
              />
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-right">
                <p className={`text-xs uppercase ${secondaryTextClassName}`}>
                  {messages.footer.products}
                </p>
                <div className="mt-3 flex flex-col items-end gap-0.5">
                  <LocalizedLink to="/pre-order" className={linkClassName}>
                    {messages.footer.customBikes}
                  </LocalizedLink>
                  <LocalizedLink to="/shop" className={linkClassName}>
                    {messages.footer.components}
                  </LocalizedLink>
                  <LocalizedLink to="/about" className={linkClassName}>
                    {messages.footer.framebuilding}
                  </LocalizedLink>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase ${secondaryTextClassName}`}>
                  {messages.footer.company}
                </p>
                <div className="mt-3 flex flex-col items-end gap-0.5">
                  <LocalizedLink to="/about" className={linkClassName}>
                    {messages.footer.about}
                  </LocalizedLink>
                  <LocalizedLink to="/blog" className={linkClassName}>
                    {messages.footer.blog}
                  </LocalizedLink>
                  <LocalizedLink to="/contact" className={linkClassName}>
                    {messages.footer.showroom}
                  </LocalizedLink>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs uppercase ${secondaryTextClassName}`}>
                  {messages.footer.support}
                </p>
                <div className="mt-3 flex flex-col items-end gap-0.5">
                  <LocalizedLink to="/contact" className={linkClassName}>
                    {messages.footer.contact}
                  </LocalizedLink>
                  <LocalizedLink to="/delivery" className={linkClassName}>
                    {messages.footer.delivery}
                  </LocalizedLink>
                  <LocalizedLink to="/warranty" className={linkClassName}>
                    {messages.footer.warranty}
                  </LocalizedLink>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div />
            <p
              className={`pt-4 self-start text-l text-right md:text-xl ${secondaryTextClassName}`}
            >
              {messages.footer.addressLines.map((line, index) => (
                <span key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>

        <div
          className={`flex flex-col gap-4 border-t pt-8 text-xs md:flex-row md:items-center md:justify-between ${dividerClassName} ${secondaryTextClassName}`}
        >
          <p className="flex flex-wrap items-center gap-2">
            <span>{`© Kanna Bikes ${currentYear}`}</span>
            <span aria-hidden="true">·</span>
            <span>{messages.footer.designedBy}</span>
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
            <LocalizedLink to="/privacy-terms" className={linkClassName}>
              {messages.footer.privacyTerms}
            </LocalizedLink>
            <a
              href="https://instagram.com/kannabikes"
              target="_blank"
              rel="noreferrer"
              className={linkClassName}
            >
              {messages.footer.instagram}
            </a>
            <a
              href="https://www.youtube.com/@kannabikes"
              target="_blank"
              rel="noreferrer"
              className={linkClassName}
            >
              {messages.footer.youtube}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
