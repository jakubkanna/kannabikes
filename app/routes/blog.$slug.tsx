import { Link } from "react-router";

import type { Route } from "./+types/blog.$slug";
import { useMessages } from "~/components/locale-provider";
import {
  buildLocalizedMeta,
  getIntlLocale,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import { fetchWordpressPostBySlug, type WordpressPost } from "~/lib/wordpress";
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

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  const locale = getLocaleFromPath(new URL(request.url).pathname);

  try {
    const post = await fetchWordpressPostBySlug(params.slug ?? "", locale, "blog");

    return {
      alternatePaths: post?.translations ?? {
        en: "/blog",
        pl: "/pl/blog",
      },
      loadError: post ? null : getMessages(locale).blog.notFound,
      locale,
      post,
    };
  } catch {
    return {
      alternatePaths: {
        en: "/blog",
        pl: "/pl/blog",
      },
      loadError: getMessages(locale).blog.loadError,
      locale,
      post: null as WordpressPost | null,
    };
  }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  const title = loaderData?.post?.title ?? messages.meta.blog.title;

  return buildLocalizedMeta({
    alternates: loaderData?.alternatePaths,
    description: loaderData?.post?.excerpt || messages.meta.blog.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(title),
  });
}

export default function BlogPostPage({ loaderData }: Route.ComponentProps) {
  const messages = useMessages();

  if (!loaderData.post && !loaderData.loadError) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 md:px-8 md:py-14">
        <article className="mx-auto max-w-3xl text-sm leading-6 text-slate-600">
          {messages.blog.loadingPost}
        </article>
      </main>
    );
  }

  if (loaderData.loadError || !loaderData.post) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 md:px-8 md:py-14">
        <article className="mx-auto max-w-3xl">
          <Link
            to={loaderData.locale === "pl" ? "/pl/blog" : "/blog"}
            className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
          >
            {messages.blog.backToBlog}
          </Link>
          <p className="mt-6 text-sm leading-6 text-slate-600">
            {loaderData.loadError ?? messages.blog.notFound}
          </p>
        </article>
      </main>
    );
  }

  const post = loaderData.post;

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-black px-4 pb-12 pt-10 text-white md:px-8 md:pb-16 md:pt-14">
        <div className="mx-auto max-w-5xl">
          <Link
            to={loaderData.locale === "pl" ? "/pl/blog" : "/blog"}
            className="text-sm font-semibold text-white/80 underline decoration-white/30 underline-offset-4 transition hover:text-white hover:decoration-white"
          >
            {messages.blog.backToBlog}
          </Link>

          {post.publishedAt ? (
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {formatPublishedDate(post.publishedAt, loaderData.locale)}
            </p>
          ) : null}

          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </section>

      <article className="px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-10">
        <div className="mx-auto max-w-5xl">
          <img
            src={post.image.src}
            srcSet={post.image.srcSet}
            sizes="(min-width: 1024px) 64rem, 100vw"
            alt={post.image.alt}
            className="aspect-[16/9] w-full rounded-[28px] object-cover shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
          />

          <div className="mx-auto mt-10 max-w-3xl">
            <div
              className="blog-content text-base"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
          </div>
        </div>
      </article>
    </main>
  );
}
