import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import type { Route } from "./+types/blog.$slug";
import { fetchWordpressPostBySlug, type WordpressPost } from "~/lib/wordpress";
import { SITE_NAME, formatPageTitle } from "~/root";

function formatPublishedDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function meta({}: Route.MetaArgs) {
  return [{ title: formatPageTitle("Blog") }];
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<WordpressPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadPost = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const result = await fetchWordpressPostBySlug(slug ?? "", "blog");

        if (isCancelled) {
          return;
        }

        if (!result) {
          setPost(null);
          setLoadError("This blog post was not found.");
          document.title = `${SITE_NAME} – Blog`;
          return;
        }

        setPost(result);
        document.title = `${SITE_NAME} – ${result.title}`;
      } catch {
        if (!isCancelled) {
          setLoadError("We could not load this blog post right now.");
          document.title = `${SITE_NAME} – Blog`;
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPost();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 md:px-8 md:py-14">
        <article className="mx-auto max-w-3xl text-sm leading-6 text-slate-600">
          Loading post...
        </article>
      </main>
    );
  }

  if (loadError || !post) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 md:px-8 md:py-14">
        <article className="mx-auto max-w-3xl">
          <Link
            to="/blog"
            className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
          >
            Back to blog
          </Link>
          <p className="mt-6 text-sm leading-6 text-slate-600">
            {loadError ?? "This blog post was not found."}
          </p>
        </article>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-black px-4 pb-12 pt-10 text-white md:px-8 md:pb-16 md:pt-14">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/blog"
            className="text-sm font-semibold text-white/80 underline decoration-white/30 underline-offset-4 transition hover:text-white hover:decoration-white"
          >
            Back to blog
          </Link>

          {post.publishedAt ? (
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {formatPublishedDate(post.publishedAt)}
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
