type Cleanup = () => void;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function attachPointerParallax(
  target: HTMLElement,
  options?: {
    distance?: number;
    scrollFactor?: number;
    xProperty?: string;
    yProperty?: string;
  },
): Cleanup {
  const distance = options?.distance ?? 12;
  const scrollFactor = options?.scrollFactor ?? 0;
  const xProperty = options?.xProperty ?? "--bg-x";
  const yProperty = options?.yProperty ?? "--bg-y";
  let rafId = 0;
  let lastX = 0;
  let lastY = 0;
  let scrollY = 0;

  const update = () => {
    rafId = 0;
    target.style.setProperty(xProperty, `${lastX}px`);
    target.style.setProperty(yProperty, `${lastY + scrollY}px`);
  };

  const handlePointerMove = (event: PointerEvent) => {
    const { innerWidth, innerHeight } = window;
    if (!innerWidth || !innerHeight) return;

    const normX = (event.clientX / innerWidth - 0.5) * 2;
    const normY = (event.clientY / innerHeight - 0.5) * 2;

    const offsetX = clamp(normX, -1, 1) * distance;
    const offsetY = clamp(normY, -1, 1) * distance;

    lastX = offsetX;
    lastY = offsetY;

    if (!rafId) {
      rafId = window.requestAnimationFrame(update);
    }
  };

  const handlePointerLeave = () => {
    lastX = 0;
    lastY = 0;
    if (!rafId) {
      rafId = window.requestAnimationFrame(update);
    }
  };

  const handleScroll = () => {
    scrollY = window.scrollY * scrollFactor;
    if (!rafId) {
      rafId = window.requestAnimationFrame(update);
    }
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("blur", handlePointerLeave);
  window.addEventListener("scroll", handleScroll, { passive: true });

  handleScroll();

  return () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerleave", handlePointerLeave);
    window.removeEventListener("blur", handlePointerLeave);
    window.removeEventListener("scroll", handleScroll);
    if (rafId) window.cancelAnimationFrame(rafId);
  };
}

export function attachBackgroundParallax(target: HTMLElement): Cleanup {
  return attachPointerParallax(target, {
    distance: 12,
    scrollFactor: 0.18,
    xProperty: "--bg-x",
    yProperty: "--bg-y",
  });
}

export function attachSectionParallax(
  target: HTMLElement,
  options?: { distance?: number; property?: string },
): Cleanup {
  const distance = options?.distance ?? 64;
  const property = options?.property ?? "--section-shift";
  let rafId = 0;

  const update = () => {
    rafId = 0;
    const viewportHeight = window.innerHeight || 1;
    const rect = target.getBoundingClientRect();
    const progress = clamp(
      (viewportHeight - rect.top) / (viewportHeight + rect.height),
      0,
      1,
    );
    const shift = (progress - 0.5) * distance * 2;

    target.style.setProperty(property, `${shift.toFixed(2)}px`);
    target.style.setProperty("--section-progress", progress.toFixed(3));
  };

  const requestUpdate = () => {
    if (!rafId) {
      rafId = window.requestAnimationFrame(update);
    }
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  requestUpdate();

  return () => {
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", requestUpdate);
    if (rafId) window.cancelAnimationFrame(rafId);
  };
}
