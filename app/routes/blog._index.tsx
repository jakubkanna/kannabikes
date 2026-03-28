import { useState } from "react";
import { Link } from "react-router";

import type { Route } from "./+types/blog._index";
import { ArchivoInkBleed } from "~/components/archivo-ink-bleed";
import { SelectField } from "~/components/form-field";
import { BlogIndexHydrateFallback } from "~/components/hydrate-fallbacks";
import { useMessages } from "~/components/locale-provider";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import {
  getBlogCategories,
  getBlogCategorySlugs,
  type BlogCategorySlug,
} from "~/lib/blog";
import {
  buildLocalizedMeta,
  getIntlLocale,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import {
  BLOG_POST_CATEGORY_SLUGS,
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

export async function loader({ request }: Route.LoaderArgs) {
  const locale = getLocaleFromPath(new URL(request.url).pathname);
  const categories = getBlogCategories(locale);

  try {
    const result = await fetchWordpressPostsByCategory(
      BLOG_POST_CATEGORY_SLUGS,
      locale,
      1,
      24,
    );
    return {
      alternatePaths: {
        en: "/blog",
        pl: "/pl/blog",
      },
      categories,
      loadError: null,
      locale,
      posts: result.posts.map((post) => ({
        ...post,
        blogCategorySlugs: getBlogCategorySlugs(post),
      })),
    };
  } catch {
    return {
      alternatePaths: {
        en: "/blog",
        pl: "/pl/blog",
      },
      categories,
      loadError: getMessages(locale).blog.loadError,
      locale,
      posts: [] as Array<
        WordpressPost & { blogCategorySlugs: BlogCategorySlug[] }
      >,
    };
  }
}

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);
  return buildLocalizedMeta({
    description: messages.meta.blog.description,
    image: "/2013_DSF6372_jakubkanna.jpg",
    locale,
    pathname: location.pathname,
    socialDescription: messages.meta.blog.description,
    socialTitle: messages.meta.blog.title,
    title: formatPageTitle(messages.meta.blog.title),
  });
}

export function HydrateFallback() {
  return <BlogIndexHydrateFallback />;
}

function BlogPostCard({
  locale,
  post,
}: {
  locale: "en" | "pl";
  post: WordpressPost;
}) {
  const postPath = post.url ?? `/blog/${post.slug}`;

  return (
    <Link
      to={postPath}
      className="group block h-full overflow-hidden border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1"
    >
      <article className="h-full">
        <img
          src={post.image.src}
          srcSet={post.image.srcSet}
          sizes="(min-width: 1024px) 32vw, (min-width: 768px) 48vw, 100vw"
          alt={post.image.alt}
          className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />

        <div className="p-6">
          {post.publishedAt ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              {formatPublishedDate(post.publishedAt, locale)}
            </p>
          ) : null}

          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--kanna-ink)] transition group-hover:text-black/75">
            {post.title}
          </h2>

          {post.excerpt ? (
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

export default function BlogPage({ loaderData }: Route.ComponentProps) {
  const messages = useMessages();
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<
    "all" | BlogCategorySlug
  >("all");
  const filteredPosts = loaderData.posts.filter((post) => {
    return (
      selectedCategorySlug === "all" ||
      post.blogCategorySlugs.includes(selectedCategorySlug)
    );
  });

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
          <section className="mt-6">
            <div className="max-w-xs">
              <SelectField
                value={selectedCategorySlug}
                onChange={(event) =>
                  setSelectedCategorySlug(
                    event.target.value as "all" | BlogCategorySlug,
                  )
                }
                aria-label={messages.commerce.categories}
                className="bg-white"
              >
                <option value="all">{messages.blog.allCategories}</option>
                {loaderData.categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.label}
                  </option>
                ))}
              </SelectField>
            </div>

            {filteredPosts.length > 0 ? (
              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredPosts.map((post) => (
                  <BlogPostCard
                    key={post.id}
                    locale={loaderData.locale}
                    post={post}
                  />
                ))}
              </div>
            ) : (
              <section className="mt-6 border border-dashed border-stone-300 bg-white p-8 text-sm leading-6 text-stone-600 shadow-sm">
                {messages.blog.empty}
              </section>
            )}
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
