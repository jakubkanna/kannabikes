import { useEffect, useState } from "react";
import { Button } from "~/components/button";

const SEARCH_ICON_SRC = `${import.meta.env.BASE_URL}icons/search-outline.svg`;

type GalleryImage = {
  alt: string;
  objectPosition?: string;
  src: string;
};

type ImageGalleryProps = {
  className?: string;
  images: readonly GalleryImage[];
  variant?: "grid" | "product";
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

export function ImageGallery({
  className,
  images,
  variant = "grid",
}: ImageGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [images]);

  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImageIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveImageIndex((current) =>
          current === null ? current : (current + 1) % images.length,
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveImageIndex((current) =>
          current === null ? current : (current - 1 + images.length) % images.length,
        );
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImageIndex, images.length]);

  return (
    <>
      {variant === "product" ? (
        <div className={className}>
          <Button
            type="button"
            onClick={() => setActiveImageIndex(selectedImageIndex)}
            variant="secondary"
            className="group relative !block !min-h-0 aspect-square w-full overflow-hidden border-stone-200 bg-white p-0 shadow-sm"
          >
            <span className="pointer-events-none absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/92 shadow-sm backdrop-blur-sm">
              <img
                src={SEARCH_ICON_SRC}
                alt=""
                aria-hidden="true"
                className="h-4 w-4"
              />
            </span>
            <img
              src={images[selectedImageIndex]?.src}
              alt={images[selectedImageIndex]?.alt}
              className="block h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              style={
                images[selectedImageIndex]?.objectPosition
                  ? { objectPosition: images[selectedImageIndex].objectPosition }
                  : undefined
              }
            />
          </Button>

          {images.length > 1 ? (
            <div className="mt-4 grid grid-cols-4 gap-3 md:grid-cols-5">
              {images.map((image, index) => {
                const isSelected = selectedImageIndex === index;

                return (
                  <Button
                    key={image.src}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    variant="secondary"
                    className={joinClassNames(
                      "group relative !min-h-0 aspect-square overflow-hidden bg-white p-0 shadow-sm transition",
                      isSelected
                        ? "border-[var(--kanna-ink)]"
                        : "border-stone-200 hover:border-black/30",
                    )}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="block h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      style={
                        image.objectPosition
                          ? { objectPosition: image.objectPosition }
                        : undefined
                      }
                    />
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className={joinClassNames(
            "mt-12 grid gap-4 md:grid-cols-3",
            className,
          )}
        >
          {images.map((image, index) => (
            <Button
              key={image.src}
              type="button"
              onClick={() => setActiveImageIndex(index)}
              className="group relative !min-h-0 aspect-square overflow-hidden !border-0 bg-stone-200 p-0 shadow-none"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="block h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                style={
                  image.objectPosition
                    ? { objectPosition: image.objectPosition }
                  : undefined
                }
              />
            </Button>
          ))}
        </div>
      )}

      {activeImageIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/86 px-4 py-6"
          onClick={() => setActiveImageIndex(null)}
        >
          <Button
            type="button"
            aria-label="Close gallery"
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4 border-white/35 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
            onClick={() => setActiveImageIndex(null)}
          >
            Close
          </Button>

          <Button
            type="button"
            aria-label="Previous image"
            variant="secondary"
            size="sm"
            className="absolute left-4 top-1/2 -translate-y-1/2 border-white/35 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              setActiveImageIndex(
                (activeImageIndex - 1 + images.length) % images.length,
              );
            }}
          >
            Prev
          </Button>

          <div
            className="flex max-h-full max-w-6xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={images[activeImageIndex].src}
              alt={images[activeImageIndex].alt}
              className="block max-h-[86vh] w-auto max-w-full object-contain"
              style={
                images[activeImageIndex].objectPosition
                  ? { objectPosition: images[activeImageIndex].objectPosition }
                  : undefined
              }
            />
          </div>

          <Button
            type="button"
            aria-label="Next image"
            variant="secondary"
            size="sm"
            className="absolute right-4 top-1/2 -translate-y-1/2 border-white/35 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              setActiveImageIndex((activeImageIndex + 1) % images.length);
            }}
          >
            Next
          </Button>
        </div>
      ) : null}
    </>
  );
}
