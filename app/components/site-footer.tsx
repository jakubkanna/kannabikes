import { Link } from "react-router";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-black px-4 py-20 text-white md:px-8 md:py-32">
      <div className="mx-auto flex min-h-[55svh] max-w-6xl flex-col justify-between gap-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2
              className="max-w-4xl text-4xl tracking-tight md:text-7xl"
              style={{
                fontFamily: "var(--font-kanna)",
                fontVariationSettings: '"wdth" 125, "wght" 900',
                fontWeight: 900,
              }}
            >
              Handbuilt with passion in Poland
            </h2>
          </div>

          <div className="space-y-14 text-sm leading-7 text-white">
            <div className="pt-4 text-l text-right text-white md:text-2xl">
              <p>Kanna Bikes Studio</p>
              <p>Placeholder Street 12</p>
              <p>00-001 Warsaw</p>
              <p>Poland</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-right">
                <p className="text-xs uppercase text-white">Products</p>
                <div className="mt-3 flex flex-col items-end gap-0.5">
                  <a href="#" className="transition hover:text-white">
                    Custom Road
                  </a>
                  <a href="#" className="transition hover:text-white">
                    All-Road
                  </a>
                  <a href="#" className="transition hover:text-white">
                    Commuter
                  </a>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-white">Company</p>
                <div className="mt-3 flex flex-col items-end gap-0.5">
                  <Link to="/about" className="transition hover:text-white">
                    About
                  </Link>
                  <Link to="/blog" className="transition hover:text-white">
                    Blog
                  </Link>
                  <a href="#" className="transition hover:text-white">
                    Studio
                  </a>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-white">Support</p>
                <div className="mt-3 flex flex-col items-end gap-0.5">
                  <Link to="/contact" className="transition hover:text-white">
                    Contact
                  </Link>
                  <a href="#" className="transition hover:text-white">
                    Delivery
                  </a>
                  <a href="#" className="transition hover:text-white">
                    Warranty
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white md:flex-row md:items-center md:justify-between">
          <p>{`© Kanna Bikes ${currentYear}`}</p>
          <div className="flex flex-wrap gap-5">
            <Link to="/privacy-terms" className="transition hover:text-white">
              Privacy & Terms
            </Link>
            <a
              href="https://instagram.com/kannabikes"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
