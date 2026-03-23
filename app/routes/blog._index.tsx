import { useEffect, useState } from "react";
import { Link } from "react-router";

import type { Route } from "./+types/blog._index";
import {
  fetchWordpressPostsByCategory,
  type WordpressPost,
} from "~/lib/wordpress";
import { formatPageTitle } from "~/root";

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

function BlogPostCard({ post }: { post: WordpressPost }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
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
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
            {formatPublishedDate(post.publishedAt)}
          </p>
        ) : null}

        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          <Link
            to={post.url ?? `/blog/${post.slug}`}
            className="transition hover:text-slate-700"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt ? (
          <p className="mt-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>
        ) : null}

        <Link
          to={post.url ?? `/blog/${post.slug}`}
          className="mt-5 inline-flex text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
        >
          Read article
        </Link>
      </div>
    </article>
  );
}

export default function BlogPage() {
  const [posts, setPosts] = useState<WordpressPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadPosts = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const result = await fetchWordpressPostsByCategory("blog", 1, 24);

        if (!isCancelled) {
          setPosts(result.posts);
        }
      } catch {
        if (!isCancelled) {
          setLoadError("We could not load the blog posts right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPosts();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Blog
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Notes from the workshop and the road.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            WordPress posts from the <code>blog</code> category are published
            here under the <code>/blog</code> path.
          </p>
        </section>

        {isLoading ? (
          <section className="mt-6 rounded-[28px] border border-stone-200 bg-white p-8 text-sm leading-6 text-slate-600 shadow-sm">
            Loading blog posts...
          </section>
        ) : loadError ? (
          <section className="mt-6 rounded-[28px] border border-red-200 bg-white p-8 text-sm leading-6 text-red-700 shadow-sm">
            {loadError}
          </section>
        ) : posts.length > 0 ? (
          <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </section>
        ) : (
          <section className="mt-6 rounded-[28px] border border-dashed border-stone-300 bg-white p-8 text-sm leading-6 text-slate-600 shadow-sm">
            No published WordPress posts were found in the <code>blog</code>{" "}
            category.
          </section>
        )}
      </div>
    </main>
  );
}
