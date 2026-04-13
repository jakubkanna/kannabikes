import {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { getButtonClassName } from "~/components/button";
import { LocalizedLink } from "~/components/localized-link";
import { useMessages } from "~/components/locale-provider";
import { SectionPill } from "~/components/section-pill";

const LazyHomeChainringScene = lazy(
  () => import("~/components/home-chainring-scene"),
);

type ExploreCardProps = {
  action: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description: string;
  tone?: "dark" | "light";
  title: string;
  to?: string;
};

const ExploreCard = forwardRef<HTMLElement, ExploreCardProps>(
  function ExploreCard(
    {
      action,
      children,
      className = "",
      description,
      tone = "light",
      title,
      to,
    },
    ref,
  ) {
    const toneClassName =
      tone === "dark"
        ? "bg-[#050505] text-white"
        : "bg-white text-[var(--kanna-ink)]";
    const cardClassName = `overflow-hidden ${toneClassName} ${to ? "cursor-pointer" : ""} ${className}`;

    const cardContent = (
      <>
        {children}
        <h3 className="flex h-[7.5rem] items-start px-4 pt-4 md:h-[10rem]">
          <ArchivoInkBleed
            className="block h-full w-full max-w-[42rem]"
            color="currentColor"
            fontSize={150}
            lines={[title]}
            preserveAspectRatio="xMinYMin meet"
          />
        </h3>
        <div className="grid gap-5 px-4 pb-5 pt-4 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] md:items-start">
          <p className="max-w-2xl text-sm leading-7 opacity-75 md:text-base">
            {description}
          </p>
          <div className="flex md:justify-end">{action}</div>
        </div>
      </>
    );

    if (to) {
      return (
        <article ref={ref} className={cardClassName}>
          <LocalizedLink
            to={to}
            className="block h-full text-current no-underline"
          >
            {cardContent}
          </LocalizedLink>
        </article>
      );
    }

    return (
      <article ref={ref} className={cardClassName}>
        {cardContent}
      </article>
    );
  },
);

function ChainringCard() {
  const cardRef = useRef<HTMLElement | null>(null);
  const [isSceneRequested, setIsSceneRequested] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const handleModelReady = useCallback(() => {
    setIsModelReady(true);
  }, []);

  useEffect(() => {
    if (isSceneRequested) return;
    if (!cardRef.current) return;

    if (!("IntersectionObserver" in window)) {
      setIsSceneRequested(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsSceneRequested(true);
        observer.disconnect();
      },
      {
        rootMargin: "1400px 0px",
        threshold: 0.05,
      },
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [isSceneRequested]);

  return (
    <ExploreCard
      ref={cardRef}
      action={
        <span
          aria-hidden="true"
          className={getButtonClassName({
            className: "px-5",
            variant: "outline",
          })}
        >
          Coming soon
        </span>
      }
      description="On demand CNC and 3D printed parts for precise builds and small production runs."
      tone="dark"
      title="3D Components"
      to="/shop"
    >
      <div className="relative h-[min(70svh,600px)]">
        {isSceneRequested ? (
          <Suspense fallback={null}>
            <LazyHomeChainringScene onReady={handleModelReady} />
          </Suspense>
        ) : null}
        {isSceneRequested && !isModelReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
            <div
              aria-label="Loading 3D model"
              className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-[var(--kanna-color)]"
              role="status"
            />
          </div>
        ) : null}
      </div>
    </ExploreCard>
  );
}

export function HomeExploreSection() {
  const messages = useMessages();
  const baseUrl = import.meta.env.BASE_URL;
  const brandName = "Kanna Bikes";
  const aboutParagraphs = messages.pages.about.body.split("\n\n");
  const aboutClosingParagraph =
    aboutParagraphs[aboutParagraphs.length - 1] ?? "";
  const brandNameIndex = aboutClosingParagraph.lastIndexOf(brandName);
  const aboutHomeFragment =
    brandNameIndex >= 0
      ? aboutClosingParagraph.slice(brandNameIndex + brandName.length).trimStart()
      : aboutClosingParagraph;

  return (
    <section
      id="explore"
      className="relative z-40 -mt-[60.8svh] min-h-[80svh] bg-black px-4 py-16 text-white md:px-8"
    >
      <div className="mx-auto flex min-h-[calc(80svh-8rem)] max-w-[120rem] flex-col gap-10">
        <div className="self-start">
          <SectionPill tone="dark">Explore</SectionPill>
        </div>

        <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <ExploreCard
            action={
              <span
                aria-hidden="true"
                className={getButtonClassName({
                  variant: "outline",
                })}
              >
                Get custom bike
              </span>
            }
            description="Custom steel bicycles shaped around your fit, riding style, and final build."
            tone="dark"
            title="Made-to-measure"
            to="/pre-order"
          >
            <div className="relative h-[min(70svh,600px)]">
              <img
                src={`${baseUrl}welding-kanna.jpg`}
                alt="Welding bicycle frame"
                className="block h-full w-full object-cover"
                decoding="async"
                loading="lazy"
              />
            </div>
          </ExploreCard>

          <ChainringCard />
        </div>

        <div className="grid gap-8 pt-37.5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div />
          <div className="space-y-5 text-base  text-white/75 ">
            <p>
              <strong className="inline-flex items-center gap-1 text-white">
                <span
                  aria-hidden="true"
                  className="inline-block h-[1em] w-[1em] bg-current"
                  style={{
                    WebkitMask: `url(${baseUrl}kannabikes_logo.svg) center / contain no-repeat`,
                    mask: `url(${baseUrl}kannabikes_logo.svg) center / contain no-repeat`,
                  }}
                />
                {brandName}
              </strong>{" "}
              {aboutHomeFragment}
            </p>
            <LocalizedLink
              to="/about"
              className={getButtonClassName({
                className: "text-white",
                variant: "link",
              })}
            >
              Read more
            </LocalizedLink>
          </div>
        </div>
      </div>
    </section>
  );
}
