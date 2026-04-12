import type { Route } from "./+types/_index";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { HomeExploreSection } from "~/components/home-explore-section";
import { SITE_NAME, formatPageTitle } from "~/root";
import { attachBackgroundParallax } from "~/lib/parallax";
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
  const heroStageRef = useRef<HTMLElement | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const lowHeroVideoRef = useRef<HTMLVideoElement | null>(null);
  const fullHeroVideoRef = useRef<HTMLVideoElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const baseUrl = import.meta.env.BASE_URL;
  const lowHeroVideoSrc = `${baseUrl}kannabikes_ride_low.mp4`;
  const fullHeroVideoSrc = `${baseUrl}kannabikes_ride.mp4`;
  const popImageSrc = `${baseUrl}placeholder.jpg`;
  const { scrollYProgress: heroStageProgress } = useScroll({
    target: heroStageRef,
    offset: ["start start", "end end"],
  });
  const getHeroBlurFilter = (progress: number) => {
    if (progress < 0.04) return "none";
    if (progress < 0.24) {
      return `blur(${((progress - 0.04) / 0.2) * 10}px)`;
    }
    if (progress < 0.62) {
      return `blur(${10 + ((progress - 0.24) / 0.38) * 8}px)`;
    }
    return "blur(18px)";
  };
  const heroLogoScale = useTransform(
    heroStageProgress,
    [0, 0.032, 0.041],
    [1, 1, 0],
  );
  const heroBackgroundBlur = useTransform(
    heroStageProgress,
    getHeroBlurFilter,
  );
  const popImageWidth = useTransform(
    heroStageProgress,
    [0.04, 0.24, 0.62, 1],
    ["0vw", "48vw", "100vw", "100vw"],
  );
  const popImageHeight = useTransform(
    heroStageProgress,
    [0.04, 0.24, 0.62, 1],
    ["0svh", "48svh", "100svh", "100svh"],
  );
  const popImageLaneScale = useTransform(heroStageProgress, (progress) =>
    progress < 0.041 ? 0 : 1,
  );
  const popImageLaneBlur = useTransform(heroStageProgress, (progress) => {
    if (progress < 0.041) return "none";
    return "blur(12px)";
  });
  const popImageBlur = useTransform(heroStageProgress, (progress) => {
    if (progress < 0.041 || progress > 0.1) return "none";
    return "blur(12px)";
  });
  const popImageTopLaneRotate = useTransform(
    heroStageProgress,
    [0.08, 0.34, 0.62, 1],
    ["0deg", "-4deg", "3deg", "3deg"],
  );
  const popImageBottomLaneRotate = useTransform(
    heroStageProgress,
    [0.08, 0.34, 0.62, 1],
    ["0deg", "4deg", "-3deg", "-3deg"],
  );
  const popImageLeftLaneRotate = useTransform(
    heroStageProgress,
    [0.08, 0.34, 0.62, 1],
    ["0deg", "4deg", "-3deg", "-3deg"],
  );
  const popImageRightLaneRotate = useTransform(
    heroStageProgress,
    [0.08, 0.34, 0.62, 1],
    ["0deg", "-4deg", "3deg", "3deg"],
  );
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);
  const [shouldLoadFullHeroVideo, setShouldLoadFullHeroVideo] = useState(false);
  const [showHeroContent, setShowHeroContent] = useState(true);

  useEffect(() => {
    if (!backgroundRef.current) return;
    return attachBackgroundParallax(backgroundRef.current);
  }, []);

  useEffect(() => {
    setIsHeroVideoReady(false);
  }, [fullHeroVideoSrc, lowHeroVideoSrc]);

  useEffect(() => {
    setShouldLoadFullHeroVideo(false);
    setIsHeroVideoReady(false);

    const connection = (
      navigator as Navigator & {
        connection?: { effectiveType?: string; saveData?: boolean };
      }
    ).connection;
    const shouldSkipFullVideo =
      connection?.saveData === true ||
      /(^|-)2g$/.test(connection?.effectiveType ?? "");

    if (shouldSkipFullVideo) return;

    const loadTimer = window.setTimeout(() => {
      if (heroStageProgress.get() < 0.03) {
        setShouldLoadFullHeroVideo(true);
      }
    }, 10000);

    const unsubscribe = heroStageProgress.on("change", (progress) => {
      if (progress >= 0.04) {
        setShouldLoadFullHeroVideo(false);
        setIsHeroVideoReady(false);
      }
    });

    return () => {
      window.clearTimeout(loadTimer);
      unsubscribe();
    };
  }, [heroStageProgress, fullHeroVideoSrc]);

  useEffect(() => {
    return heroStageProgress.on("change", (progress) => {
      setShowHeroContent(progress < 0.041);
    });
  }, [heroStageProgress]);

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

  return (
    <div className="relative z-0 overflow-x-clip bg-black text-gray-900">
      <section ref={heroStageRef} className="relative h-[260svh] bg-black">
        <main className="sticky top-0 isolate mb-3 h-[calc(100svh-0.75rem)] overflow-hidden">
          <motion.div
            ref={backgroundRef}
            aria-hidden="true"
            className="absolute inset-0 z-0 pointer-events-none overflow-hidden will-change-transform translate-x-[var(--bg-x,0px)] translate-y-[var(--bg-y,0px)] scale-[1.08]"
            style={
              shouldReduceMotion ? undefined : { filter: heroBackgroundBlur }
            }
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
            {shouldLoadFullHeroVideo ? (
              <video
                ref={fullHeroVideoRef}
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${isHeroVideoReady ? "opacity-100" : "opacity-0"}`}
                src={fullHeroVideoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                onCanPlay={handleFullHeroVideoCanPlayThrough}
              />
            ) : null}
          </motion.div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          >
            <motion.div
              className="home-hero-pop-image relative"
              style={
                shouldReduceMotion
                  ? { height: "100svh", width: "100vw" }
                  : {
                      height: popImageHeight,
                      width: popImageWidth,
                    }
              }
            >
              <motion.div
                className="absolute inset-0 overflow-hidden"
                style={shouldReduceMotion ? undefined : { filter: popImageBlur }}
              >
                <img
                  src={popImageSrc}
                  alt=""
                  className="h-full w-full object-cover object-center"
                />
              </motion.div>
              <motion.div
                className="home-hero-pop-lane home-hero-pop-lane-horizontal home-hero-pop-lane-top"
                style={{
                  filter: popImageLaneBlur,
                  rotate: popImageTopLaneRotate,
                  scaleX: popImageLaneScale,
                  x: "-50%",
                }}
              />
              <motion.div
                className="home-hero-pop-lane home-hero-pop-lane-horizontal home-hero-pop-lane-bottom"
                style={{
                  filter: popImageLaneBlur,
                  rotate: popImageBottomLaneRotate,
                  scaleX: popImageLaneScale,
                  x: "-50%",
                }}
              />
              <motion.div
                className="home-hero-pop-lane home-hero-pop-lane-vertical home-hero-pop-lane-left"
                style={{
                  filter: popImageLaneBlur,
                  rotate: popImageLeftLaneRotate,
                  scaleY: popImageLaneScale,
                  y: "-50%",
                }}
              />
              <motion.div
                className="home-hero-pop-lane home-hero-pop-lane-vertical home-hero-pop-lane-right"
                style={{
                  filter: popImageLaneBlur,
                  rotate: popImageRightLaneRotate,
                  scaleY: popImageLaneScale,
                  y: "-50%",
                }}
              />
            </motion.div>
          </div>

          {showHeroContent ? (
            <motion.section
              className="relative z-20 flex h-full flex-col items-stretch justify-end text-center text-white"
              style={
                shouldReduceMotion
                  ? undefined
                  : {
                      filter: heroBackgroundBlur,
                    }
              }
            >
              <motion.div
                className="px-4 pb-28 md:px-6"
                style={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: heroLogoScale,
                        transformOrigin: "center center",
                      }
                }
              >
                <div className="block w-full">
                  <img
                    src={`${baseUrl}kannabikes_logotype.svg`}
                    alt={SITE_NAME}
                    className="hero-logo-image h-auto w-full"
                  />
                </div>
                <div className="mx-auto mt-14 h-[1.66px] w-[calc(100%-3rem)] bg-(--kanna-color)" />
              </motion.div>

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
            </motion.section>
          ) : null}
        </main>
      </section>
      <HomeExploreSection />
    </div>
  );
}
