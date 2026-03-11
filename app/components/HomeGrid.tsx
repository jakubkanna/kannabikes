import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ImageCard } from "./ImageCard";
import { fetchWordpressPosts, type WordpressPost } from "../lib/wordpress";

type PositionedPost = {
  col: number;
  layer: number;
  orderKey: number;
  row: number;
  shiftX: number;
  shiftY: number;
  post: WordpressPost;
  rotate: number;
};

const GRID_COLUMNS = 4;
const ROWS_PER_PACK = 3;
const PAGE_SIZE = GRID_COLUMNS * ROWS_PER_PACK;

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildPackSlots(packSize: number, startRow: number) {
  const slots: Array<{ col: number; row: number }> = [];
  let row = startRow;

  while (slots.length < packSize) {
    const countInRow = 1 + Math.floor(Math.random() * GRID_COLUMNS);
    const columns = shuffle([...Array(GRID_COLUMNS).keys()]).slice(0, countInRow);

    for (const col of columns) {
      if (slots.length >= packSize) break;
      slots.push({ col, row });
    }

    row += 1;
  }

  return { slots, nextRowStart: row };
}

function useMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function HomeGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const requestedPagesRef = useRef(new Set<number>());
  const nextRowStartRef = useRef(0);
  const parallaxTargetRef = useRef({ x: 0, y: 0 });
  const parallaxFrameRef = useRef<number | null>(null);

  const isMobile = useMobileBreakpoint();
  const [showDragHint, setShowDragHint] = useState(true);

  const [containerWidth, setContainerWidth] = useState(0);
  const [items, setItems] = useState<PositionedPost[]>([]);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowDragHint(false), 5000);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      setContainerWidth(element.clientWidth);
    });

    observer.observe(element);
    setContainerWidth(element.clientWidth);

    return () => observer.disconnect();
  }, []);

  const loadNextPack = useCallback(async () => {
    const page = nextPage;
    if (!hasMore || isLoadingRef.current) return;
    if (requestedPagesRef.current.has(page)) return;

    requestedPagesRef.current.add(page);
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetchWordpressPosts(page, PAGE_SIZE);
      const { slots, nextRowStart } = buildPackSlots(
        response.posts.length,
        nextRowStartRef.current,
      );
      nextRowStartRef.current = nextRowStart;

      const nextItems = response.posts.map((post, index) => {
        const slot = slots[index] ?? slots[slots.length - 1]!;

        return {
          col: slot.col,
          layer: 1 + Math.floor(Math.random() * 3),
          orderKey: Math.random(),
          row: slot.row,
          shiftX: -0.2 + Math.random() * 0.4,
          shiftY: -0.2 + Math.random() * 0.4,
          post,
          rotate: -3 + Math.random() * 6,
        } satisfies PositionedPost;
      });

      setItems((current) => {
        const seen = new Set(current.map((item) => item.post.id));
        const uniqueNextItems = nextItems.filter(
          (item) => !seen.has(item.post.id),
        );
        return [...current, ...uniqueNextItems];
      });
      setHasMore(response.hasMore);
      setNextPage(response.nextPage ?? page);
    } catch {
      requestedPagesRef.current.delete(page);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore, nextPage]);

  useEffect(() => {
    void loadNextPack();
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void loadNextPack();
        }
      },
      { rootMargin: "500px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPack]);

  useEffect(() => {
    if (isMobile) {
      setParallax({ x: 0, y: 0 });
      return;
    }

    let current = { x: 0, y: 0 };

    const tick = () => {
      const target = parallaxTargetRef.current;
      current = {
        x: current.x + (target.x - current.x) * 0.12,
        y: current.y + (target.y - current.y) * 0.12,
      };

      setParallax((prev) => {
        if (
          Math.abs(prev.x - current.x) < 0.001 &&
          Math.abs(prev.y - current.y) < 0.001
        ) {
          return prev;
        }
        return current;
      });

      if (
        Math.abs(target.x - current.x) > 0.001 ||
        Math.abs(target.y - current.y) > 0.001
      ) {
        parallaxFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        parallaxFrameRef.current = null;
      }
    };

    const startTicking = () => {
      if (parallaxFrameRef.current === null) {
        parallaxFrameRef.current = window.requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const element = containerRef.current;
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;

      const nx = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const ny = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;

      parallaxTargetRef.current = {
        x: clamp(nx, -1, 1),
        y: clamp(ny, -1, 1),
      };
      startTicking();
    };

    const onPointerLeave = () => {
      parallaxTargetRef.current = { x: 0, y: 0 };
      startTicking();
    };

    const element = containerRef.current;
    if (!element) return;
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerleave", onPointerLeave);

    return () => {
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerleave", onPointerLeave);
      if (parallaxFrameRef.current !== null) {
        window.cancelAnimationFrame(parallaxFrameRef.current);
        parallaxFrameRef.current = null;
      }
    };
  }, [isMobile]);

  const desktopGeometry = useMemo(() => {
    const width = Math.max(containerWidth, 320);
    const cellWidth = width / GRID_COLUMNS;
    const cellHeight = Math.max(220, Math.min(360, cellWidth * 0.86));
    const lastRow = items.reduce((maxRow, item) => Math.max(maxRow, item.row), -1);
    const totalRows = Math.max(1, lastRow + 1);

    return {
      cellHeight,
      cellWidth,
      totalHeight: totalRows * cellHeight + 24,
    };
  }, [containerWidth, items.length]);

  const mobileItems = useMemo(
    () => [...items].sort((a, b) => a.orderKey - b.orderKey),
    [items],
  );

  return (
    <section className="w-full px-3">
      <header className="mb-8 flex items-center justify-center gap-4 w-full">
        {showDragHint && !isMobile ? (
          <p className="inline-flex items-center gap-1.5 text-xs opacity-50 font-mono">
            <span>Drag images to move them</span>
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="m8 5 4-4 4 4" />
              <path d="M12 1v22" />
              <path d="m8 19 4 4 4-4" />
              <path d="m19 8 4 4-4 4" />
              <path d="M1 12h22" />
              <path d="m5 8-4 4 4 4" />
            </svg>
          </p>
        ) : null}
      </header>

      <div ref={containerRef}>
        {isMobile ? (
          <div className="grid gap-4">
            {mobileItems.map((item) => (
              <ImageCard
                draggableEnabled={false}
                key={item.post.id}
                post={item.post}
                sizes="(max-width: 767px) calc(100vw - 24px), 480px"
              />
            ))}
          </div>
        ) : (
          <div
            className="relative"
            style={{ minHeight: desktopGeometry.totalHeight }}
          >
            {items.map((item) => {
              const imageRatio = item.post.image.width / item.post.image.height;
              const height = desktopGeometry.cellHeight * 0.86;
              const width = height * imageRatio;
              const randomOffsetX = desktopGeometry.cellWidth * item.shiftX;
              const randomOffsetY = desktopGeometry.cellHeight * item.shiftY;
              const rawLeft =
                item.col * desktopGeometry.cellWidth +
                (desktopGeometry.cellWidth - width) / 2 +
                randomOffsetX;
              const rawTop =
                item.row * desktopGeometry.cellHeight +
                (desktopGeometry.cellHeight - height) / 2 +
                randomOffsetY;
              const left = clamp(
                rawLeft,
                12,
                desktopGeometry.cellWidth * GRID_COLUMNS - width - 12,
              );
              const top = clamp(
                rawTop,
                0,
                desktopGeometry.totalHeight - height,
              );
              const directionSeed = hashString(item.post.id);
              const directionX = (directionSeed & 1) === 0 ? 1 : -1;
              const directionY = (directionSeed & 2) === 0 ? 1 : -1;
              const parallaxStrength = 6 + item.layer * 2;
              const parallaxX = parallax.x * parallaxStrength * directionX;
              const parallaxY = parallax.y * parallaxStrength * directionY;

              return (
                <ImageCard
                  className="absolute"
                  draggableEnabled
                  key={item.post.id}
                  post={item.post}
                  sizes="(max-width: 1279px) 32vw, 28vw"
                  style={{
                    left,
                    top,
                    transform: `rotate(${item.rotate}deg) translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
                    width,
                    zIndex: item.layer,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      <div
        className="py-8 text-center text-sm text-slate-500"
        ref={sentinelRef}
      >
        {isLoading ? "Loading..." : hasMore ? "Scroll for more" : ""}
      </div>
    </section>
  );
}
