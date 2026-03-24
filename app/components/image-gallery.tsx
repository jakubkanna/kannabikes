import { useEffect, useState } from "react";

type GalleryImage = {
  alt: string;
  objectPosition?: string;
  src: string;
};

type ImageGalleryProps = {
  images: readonly GalleryImage[];
};

export function ImageGallery({ images }: ImageGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

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
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActiveImageIndex(index)}
            className="group relative aspect-square overflow-hidden bg-stone-200"
          >
            <img
              src={image.src}
              alt={image.alt}
              className="block h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
            />
          </button>
        ))}
      </div>

      {activeImageIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/86 px-4 py-6"
          onClick={() => setActiveImageIndex(null)}
        >
          <button
            type="button"
            aria-label="Close gallery"
            className="absolute right-4 top-4 text-sm font-semibold uppercase tracking-[0.14em] text-white"
            onClick={() => setActiveImageIndex(null)}
          >
            Close
          </button>

          <button
            type="button"
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold uppercase tracking-[0.14em] text-white"
            onClick={(event) => {
              event.stopPropagation();
              setActiveImageIndex(
                (activeImageIndex - 1 + images.length) % images.length,
              );
            }}
          >
            Prev
          </button>

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

          <button
            type="button"
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold uppercase tracking-[0.14em] text-white"
            onClick={(event) => {
              event.stopPropagation();
              setActiveImageIndex((activeImageIndex + 1) % images.length);
            }}
          >
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}
