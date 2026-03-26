import { Link } from "react-router";

import type { Route } from "./+types/blog._index";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { BlogIndexHydrateFallback } from "~/components/hydrate-fallbacks";
import { useMessages } from "~/components/locale-provider";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import {
  buildLocalizedMeta,
  getIntlLocale,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import {
  fetchWordpressPostsByCategory,
  type WordpressPost,
} from "~/lib/wordpress";
import { formatPageTitle } from "~/root";

function formatPublishedDate(value: string, locale: "en" | "pl") {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const locale = getLocaleFromPath(new URL(request.url).pathname);

  try {
    const result = await fetchWordpressPostsByCategory("blog", locale, 1, 24);
    return {
      alternatePaths: {
        en: "/blog",
        pl: "/pl/blog",
      },
      loadError: null,
      locale,
      posts: result.posts,
    };
  } catch {
    return {
      alternatePaths: {
        en: "/blog",
        pl: "/pl/blog",
      },
      loadError: getMessages(locale).blog.loadError,
      locale,
      posts: [] as WordpressPost[],
    };
  }
}

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.blog.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.meta.blog.title),
  });
}

export function HydrateFallback() {
  return <BlogIndexHydrateFallback />;
}

function BlogPostCard({
  locale,
  messages,
  post,
}: {
  locale: "en" | "pl";
  messages: ReturnType<typeof useMessages>;
  post: WordpressPost;
}) {
  return (
    <article className="overflow-hidden border border-stone-200 bg-white shadow-sm">
      <Link to={post.url ?? `/blog/${post.slug}`} className="block">
        <img
          src={post.image.src}
          srcSet={post.image.srcSet}
          sizes="(min-width: 1024px) 32vw, (min-width: 768px) 48vw, 100vw"
          alt={post.image.alt}
          className="aspect-[4/3] w-full object-cover"
        />
      </Link>

      <div className="p-6">
        {post.publishedAt ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            {formatPublishedDate(post.publishedAt, locale)}
          </p>
        ) : null}

        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--kanna-ink)]">
          <Link
            to={post.url ?? `/blog/${post.slug}`}
            className="transition hover:text-black/75"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt ? (
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {post.excerpt}
          </p>
        ) : null}

        <Link
          to={post.url ?? `/blog/${post.slug}`}
          className="mt-5 inline-flex text-sm font-semibold text-[var(--kanna-ink)] underline decoration-black/20 underline-offset-4 transition hover:decoration-black/70"
        >
          {messages.blog.readArticle}
        </Link>
      </div>
    </article>
  );
}

export default function BlogPage({ loaderData }: Route.ComponentProps) {
  const messages = useMessages();

  return (
    <PageShell>
      <PageContainer>
        <SectionPill>{messages.blog.pill}</SectionPill>
        <h1 className="mt-4 max-w-4xl">
          <ArchivoInkBleed
            className="block w-full"
            color="var(--kanna-ink)"
            fontSize={148}
            lines={[messages.blog.title]}
          />
        </h1>

        {loaderData.loadError ? (
          <section className="mt-6 border border-red-200 bg-white p-8 text-sm leading-6 text-red-700 shadow-sm">
            {loaderData.loadError}
          </section>
        ) : loaderData.posts.length > 0 ? (
          <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loaderData.posts.map((post) => (
              <BlogPostCard
                key={post.id}
                locale={loaderData.locale}
                messages={messages}
                post={post}
              />
            ))}
          </section>
        ) : (
          <section className="mt-6 border border-dashed border-stone-300 bg-white p-8 text-sm leading-6 text-stone-600 shadow-sm">
            {messages.blog.empty}
          </section>
        )}
      </PageContainer>
    </PageShell>
  );
}
