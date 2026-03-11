type Cleanup = () => void;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function attachBackgroundParallax(target: HTMLElement): Cleanup {
  let rafId = 0;
  let lastX = 0;
  let lastY = 0;

  const update = () => {
    rafId = 0;
    target.style.setProperty("--bg-x", `${lastX}px`);
    target.style.setProperty("--bg-y", `${lastY}px`);
  };

  const handlePointerMove = (event: PointerEvent) => {
    const { innerWidth, innerHeight } = window;
    if (!innerWidth || !innerHeight) return;

    const normX = (event.clientX / innerWidth - 0.5) * 2;
    const normY = (event.clientY / innerHeight - 0.5) * 2;

    const offsetX = clamp(normX, -1, 1) * 12;
    const offsetY = clamp(normY, -1, 1) * 12;

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

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("blur", handlePointerLeave);

  return () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerleave", handlePointerLeave);
    window.removeEventListener("blur", handlePointerLeave);
    if (rafId) window.cancelAnimationFrame(rafId);
  };
}
