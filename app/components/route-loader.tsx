import { useEffect, useState } from "react";

import { Spinner } from "./spinner";

const FADE_DURATION_MS = 200;

export function RouteLoader({
  isLoading,
  label,
}: {
  isLoading: boolean;
  label: string;
}) {
  const [isMounted, setIsMounted] = useState(isLoading);
  const [isVisible, setIsVisible] = useState(isLoading);

  useEffect(() => {
    let fadeFrame: number | undefined;
    let unmountTimer: number | undefined;

    if (isLoading) {
      setIsMounted(true);
      fadeFrame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      unmountTimer = window.setTimeout(() => {
        setIsMounted(false);
      }, FADE_DURATION_MS);
    }

    return () => {
      if (fadeFrame !== undefined) {
        window.cancelAnimationFrame(fadeFrame);
      }

      if (unmountTimer !== undefined) {
        window.clearTimeout(unmountTimer);
      }
    };
  }, [isLoading]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      aria-busy={isLoading}
      aria-live="polite"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/78 backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="status"
    >
      <div className="flex min-w-[12rem] flex-col items-center gap-4 text-center">
        <Spinner className="h-9 w-9 text-stone-300" />
      </div>
    </div>
  );
}
