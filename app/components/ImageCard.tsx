import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { type WordpressPost } from "../lib/wordpress";

type ImageCardProps = {
  className?: string;
  draggableEnabled?: boolean;
  post: WordpressPost;
  sizes: string;
  style?: CSSProperties;
};

const PUBLIC_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const PLACEHOLDER_SRC = `${PUBLIC_BASE}/placeholder.png`;

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mostCommonColorFromImage(image: HTMLImageElement) {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const size = 32;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(image, 0, 0, size, size);

    const { data } = ctx.getImageData(0, 0, size, size);
    const buckets = new Map<string, number>();

    for (let i = 0; i < data.length; i += 16) {
      const alpha = data[i + 3] ?? 255;
      if (alpha < 40) continue;

      const r = Math.round((data[i] ?? 0) / 32) * 32;
      const g = Math.round((data[i + 1] ?? 0) / 32) * 32;
      const b = Math.round((data[i + 2] ?? 0) / 32) * 32;
      const key = `${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    let topKey: string | null = null;
    let topCount = -1;
    for (const [key, count] of buckets) {
      if (count > topCount) {
        topKey = key;
        topCount = count;
      }
    }

    if (!topKey) return null;
    const [r, g, b] = topKey.split(",").map(Number);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return null;
  }
}

function isDarkColor(color: string) {
  const rgbMatch = color.match(
    /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/i,
  );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 140;
  }

  const hexMatch = color.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    const value = hexMatch[1]!;
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 140;
  }

  return false;
}

function fallbackHoverColorForPost(postId: string) {
  const seed = hashString(postId);
  const hue = seed % 360;
  const saturation = 42 + (seed % 18);
  const lightness = 42 + (Math.floor(seed / 9) % 18);
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function ImageCard({
  className,
  draggableEnabled = true,
  post,
  sizes,
  style,
}: ImageCardProps) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);
  const clickSuppressRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageSrc, setImageSrc] = useState(post.image.src);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const fallbackHoverColor = useMemo(
    () => fallbackHoverColorForPost(post.id),
    [post.id],
  );
  const [dominantColor, setDominantColor] = useState(fallbackHoverColor);
  const shouldReduceMotion = useReducedMotion();

  const hoverSquare = useMemo(() => {
    const seed = hashString(post.id);
    const left = 28 + (seed % 44);
    const top = 28 + (Math.floor(seed / 13) % 44);

    return { left, top };
  }, [post.id]);
  const revealDelay = useMemo(
    () => (hashString(post.id) % 7) * 0.05,
    [post.id],
  );
  const hasPostUrl = Boolean(post.url?.trim());
  const isDescriptionOnDarkBg = useMemo(
    () => isDarkColor(dominantColor),
    [dominantColor],
  );
  const cardClassName = cx(
    "group block touch-pan-y overflow-hidden",
    draggableEnabled
      ? isDragging
        ? "cursor-grabbing"
        : "cursor-grab"
      : undefined,
    className,
  );
  const cardStyle = {
    ...style,
    transform: `${style?.transform ?? ""} translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
  };
  const postTitle = post.title?.trim() || `Post ${post.id}`;
  const cardContent = (
    <>
      <div
        className="relative shadow-md"
        style={{ aspectRatio: `${post.image.width} / ${post.image.height}` }}
      >
        {!isImageLoaded ? (
          <div className="pointer-events-none absolute inset-0 z-10 animate-pulse bg-slate-200/70" />
        ) : null}
        <motion.img
          alt={post.image.alt}
          className="h-full w-full object-cover"
          decoding="async"
          draggable={false}
          initial={false}
          loading="lazy"
          onError={() => {
            if (imageSrc !== PLACEHOLDER_SRC) {
              setImageSrc(PLACEHOLDER_SRC);
              setLoadedSrc(null);
              setIsImageLoaded(false);
              return;
            }
            setLoadedSrc(PLACEHOLDER_SRC);
            setIsImageLoaded(true);
          }}
          onLoad={(event) => {
            setLoadedSrc(imageSrc);
            setIsImageLoaded(true);
            const color = mostCommonColorFromImage(event.currentTarget);
            setDominantColor(color ?? fallbackHoverColor);
          }}
          animate={{ opacity: loadedSrc === imageSrc ? 1 : 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  delay: revealDelay,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
          sizes={sizes}
          src={imageSrc}
          srcSet={imageSrc === post.image.src ? post.image.srcSet : undefined}
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-50"
          style={{ backgroundColor: dominantColor }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div
            className="absolute flex aspect-square w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center p-2 text-center shadow-lg md:w-36"
            style={{
              backgroundColor: dominantColor,
              left: `${hoverSquare.left}%`,
              top: `${hoverSquare.top}%`,
            }}
          >
            {hasPostUrl ? (
              <span
                aria-hidden="true"
                className={cx(
                  "absolute right-2 top-1 text-sm leading-none md:right-2.5 md:top-1.5 md:text-base",
                  isDescriptionOnDarkBg ? "text-white" : "text-black",
                )}
              >
                ↗
              </span>
            ) : null}
            <p
              className={cx(
                "max-h-full overflow-hidden text-[11px] leading-tight md:text-xs",
                isDescriptionOnDarkBg ? "text-white" : "text-black",
              )}
            >
              {post.excerpt}
            </p>
          </div>
        </div>
      </div>
      <p
        className="px-2 py-2 text-xs leading-tight text-white opacity-50 transition-opacity duration-200 group-hover:opacity-100"
        style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)" }}
      >
        {postTitle}
      </p>
    </>
  );

  if (hasPostUrl) {
    return (
      <a
        className={cardClassName}
        draggable={false}
        href={post.url ?? undefined}
        onClick={(event) => {
          if (clickSuppressRef.current) {
            event.preventDefault();
            clickSuppressRef.current = false;
            return;
          }
          const shouldOpen = window.confirm(
            "Do you want to leave this website?",
          );
          if (!shouldOpen) {
            event.preventDefault();
          }
        }}
        onPointerDown={(event) => {
          if (!draggableEnabled) return;
          if (event.button !== 0) return;
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            x: dragOffset.x,
            y: dragOffset.y,
          };
          clickSuppressRef.current = false;
          setIsDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!draggableEnabled) return;
          if (!dragRef.current || dragRef.current.pointerId !== event.pointerId)
            return;

          const dx = event.clientX - dragRef.current.startX;
          const dy = event.clientY - dragRef.current.startY;

          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
            clickSuppressRef.current = true;
          }

          setDragOffset({
            x: dragRef.current.x + dx,
            y: dragRef.current.y + dy,
          });
        }}
        onPointerUp={(event) => {
          if (!draggableEnabled) return;
          if (!dragRef.current || dragRef.current.pointerId !== event.pointerId)
            return;
          dragRef.current = null;
          setIsDragging(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          if (!draggableEnabled) return;
          dragRef.current = null;
          setIsDragging(false);
        }}
        rel="noopener noreferrer"
        style={cardStyle}
        target="_blank"
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div
      className={cardClassName}
      onPointerDown={(event) => {
        if (!draggableEnabled) return;
        if (event.button !== 0) return;
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          x: dragOffset.x,
          y: dragOffset.y,
        };
        clickSuppressRef.current = false;
        setIsDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!draggableEnabled) return;
        if (!dragRef.current || dragRef.current.pointerId !== event.pointerId)
          return;

        const dx = event.clientX - dragRef.current.startX;
        const dy = event.clientY - dragRef.current.startY;

        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          clickSuppressRef.current = true;
        }

        setDragOffset({
          x: dragRef.current.x + dx,
          y: dragRef.current.y + dy,
        });
      }}
      onPointerUp={(event) => {
        if (!draggableEnabled) return;
        if (!dragRef.current || dragRef.current.pointerId !== event.pointerId)
          return;
        dragRef.current = null;
        setIsDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        if (!draggableEnabled) return;
        dragRef.current = null;
        setIsDragging(false);
      }}
      style={cardStyle}
    >
      {cardContent}
    </div>
  );
}
