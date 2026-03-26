import type { ReactNode } from "react";

import { PageContainer, PageShell } from "~/components/page-container";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={["rounded-3xl bg-white/80", className].filter(Boolean).join(" ")}
    />
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  return (
    <PageShell>
      <PageContainer>
        <div className="animate-pulse">{children}</div>
      </PageContainer>
    </PageShell>
  );
}

export function StoreGridHydrateFallback() {
  return (
    <ShellFrame>
      <SkeletonBlock className="h-8 w-28 rounded-full border border-black/10" />
      <div className="mt-6 max-w-4xl space-y-3">
        <SkeletonBlock className="h-14 w-full max-w-3xl" />
        <SkeletonBlock className="h-14 w-4/5 max-w-2xl" />
      </div>

      <section className="mt-12">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
        </div>

        <SkeletonBlock className="mt-8 h-3 w-32 rounded-full" />

        <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden border border-stone-200 bg-white shadow-sm"
            >
              <SkeletonBlock className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <SkeletonBlock className="h-6 w-4/5" />
                <SkeletonBlock className="h-4 w-2/5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </ShellFrame>
  );
}

export function ProductHydrateFallback() {
  return (
    <ShellFrame>
      <SkeletonBlock className="h-8 w-28 rounded-full border border-black/10" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <SkeletonBlock className="aspect-[4/5] w-full" />

        <div className="space-y-5">
          <div className="space-y-3">
            <SkeletonBlock className="h-5 w-28 rounded-full" />
            <SkeletonBlock className="h-12 w-full max-w-xl" />
            <SkeletonBlock className="h-12 w-3/4 max-w-lg" />
            <SkeletonBlock className="h-6 w-32 rounded-full" />
          </div>

          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonBlock className="h-14 w-full" />
            <SkeletonBlock className="h-14 w-full" />
          </div>

          <SkeletonBlock className="h-14 w-48" />
        </div>
      </div>

      <section className="mt-14 space-y-4">
        <SkeletonBlock className="h-4 w-24 rounded-full" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="h-4 w-20 rounded-full" />
              </div>
              <div className="mt-4 space-y-2">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-11/12" />
                <SkeletonBlock className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </ShellFrame>
  );
}

export function BlogIndexHydrateFallback() {
  return (
    <ShellFrame>
      <SkeletonBlock className="h-8 w-28 rounded-full border border-black/10" />
      <div className="mt-6 max-w-4xl space-y-3">
        <SkeletonBlock className="h-14 w-full max-w-3xl" />
        <SkeletonBlock className="h-14 w-4/5 max-w-2xl" />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={index}
            className="overflow-hidden border border-stone-200 bg-white shadow-sm"
          >
            <SkeletonBlock className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-4 p-6">
              <SkeletonBlock className="h-3 w-32 rounded-full" />
              <SkeletonBlock className="h-8 w-4/5" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-11/12" />
                <SkeletonBlock className="h-4 w-3/4" />
              </div>
              <SkeletonBlock className="h-4 w-28 rounded-full" />
            </div>
          </article>
        ))}
      </div>
    </ShellFrame>
  );
}

export function BlogPostHydrateFallback() {
  return (
    <ShellFrame>
      <div className="max-w-4xl">
        <SkeletonBlock className="h-4 w-24 rounded-full" />
        <div className="mt-6 space-y-4">
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-4/5" />
        </div>
        <SkeletonBlock className="mt-6 h-4 w-40 rounded-full" />
      </div>

      <SkeletonBlock className="mt-10 aspect-[16/9] w-full rounded-[2rem]" />

      <section className="mt-10 max-w-3xl space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonBlock
            key={index}
            className={index === 5 ? "h-4 w-3/5" : "h-4 w-full"}
          />
        ))}
      </section>

      <section className="mt-14 space-y-4">
        <SkeletonBlock className="h-5 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="border border-black/10 bg-white p-5">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="h-3 w-20 rounded-full" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-10/12" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </ShellFrame>
  );
}

export function AccountHydrateFallback({
  variant = "list",
}: {
  variant?: "form" | "list" | "split";
}) {
  return (
    <ShellFrame>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-4">
          <SkeletonBlock className="h-8 w-32 rounded-full border border-black/10" />
          <div className="space-y-3">
            <SkeletonBlock className="h-12 w-64" />
            <SkeletonBlock className="h-12 w-48" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <SkeletonBlock className="h-14 w-14 rounded-full" />
            <SkeletonBlock className="h-4 w-40 rounded-full" />
          </div>
        </div>

        <SkeletonBlock className="h-12 w-40" />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonBlock key={index} className="h-11 w-28 rounded-full" />
        ))}
      </div>

      <div className="mt-8">
        {variant === "form" ? <AccountFormSkeleton /> : null}
        {variant === "list" ? <AccountListSkeleton /> : null}
        {variant === "split" ? <AccountSplitSkeleton /> : null}
      </div>
    </ShellFrame>
  );
}

function AccountFormSkeleton() {
  return (
    <div className="max-w-3xl space-y-5 border border-black/15 bg-white p-6">
      <SkeletonBlock className="h-6 w-48" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-12 w-full rounded-2xl" />
          </div>
        ))}
      </div>
      <SkeletonBlock className="h-12 w-40" />
    </div>
  );
}

function AccountListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <article key={index} className="border border-black/15 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-24 rounded-full" />
              <SkeletonBlock className="h-4 w-20 rounded-full" />
            </div>
            <SkeletonBlock className="h-5 w-24" />
          </div>
          <div className="mt-4 space-y-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
          </div>
        </article>
      ))}
    </div>
  );
}

function AccountSplitSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4 border border-black/15 bg-white p-6">
        <SkeletonBlock className="h-6 w-40" />
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="h-32 w-full rounded-[1.5rem]" />
        </div>
        <SkeletonBlock className="h-12 w-40" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="border border-black/15 bg-white p-5">
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-4 w-24 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-11/12" />
              <SkeletonBlock className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
