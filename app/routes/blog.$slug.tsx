import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Link } from "react-router";
import { useLocation } from "react-router";

import type { Route } from "./+types/blog.$slug";
import { Button } from "~/components/button";
import { CustomerSignInForm } from "~/components/customer-sign-in-form";
import { TextareaField } from "~/components/form-field";
import { BlogPostHydrateFallback } from "~/components/hydrate-fallbacks";
import { JsonLd } from "~/components/json-ld";
import { PageContainer } from "~/components/page-container";
import { useLocale, useMessages } from "~/components/locale-provider";
import {
  buildSiteUrl,
  buildLocalizedMeta,
  getIntlLocale,
  getLocaleFromPath,
  getMessages,
  localizePath,
} from "~/lib/i18n";
import {
  createCustomerBlogComment,
  fetchCustomerSession,
  type CustomerSession,
  voteCustomerBlogComment,
} from "~/lib/customer-account";
import {
  BLOG_POST_CATEGORY_SLUGS,
  fetchWordpressComments,
  fetchWordpressPostBySlug,
  type WordpressComment,
  type WordpressPost,
} from "~/lib/wordpress";
import { formatPageTitle } from "~/root";

type ThreadedWordpressComment = WordpressComment & {
  children: ThreadedWordpressComment[];
};

function buildCommentTree(comments: WordpressComment[]) {
  const nodes = new Map<number, ThreadedWordpressComment>();
  const roots: ThreadedWordpressComment[] = [];

  comments.forEach((comment) => {
    nodes.set(comment.id, { ...comment, children: [] });
  });

  comments.forEach((comment) => {
    const node = nodes.get(comment.id);

    if (!node) {
      return;
    }

    if (comment.parentId > 0) {
      const parentNode = nodes.get(comment.parentId);

      if (parentNode) {
        parentNode.children.push(node);
        return;
      }
    }

    roots.push(node);
  });

  return roots;
}

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

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = getLocaleFromPath(new URL(request.url).pathname);

  try {
    const post = await fetchWordpressPostBySlug(
      params.slug ?? "",
      locale,
      BLOG_POST_CATEGORY_SLUGS,
    );

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
  const description =
    loaderData?.post?.excerpt || messages.meta.blog.description;

  return buildLocalizedMeta({
    alternates: loaderData?.alternatePaths,
    description,
    image: loaderData?.post?.image.src,
    imageAlt: loaderData?.post?.image.alt,
    locale,
    pathname: location.pathname,
    socialDescription: description,
    socialTitle: title,
    title: formatPageTitle(title),
    type: "article",
  });
}

export function HydrateFallback() {
  return <BlogPostHydrateFallback />;
}

export default function BlogPostPage({ loaderData }: Route.ComponentProps) {
  const locale = useLocale();
  const location = useLocation();
  const messages = useMessages();
  const [comments, setComments] = useState<WordpressComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [customerSession, setCustomerSession] =
    useState<CustomerSession | null>(null);
  const [customerSessionLoading, setCustomerSessionLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentStatus, setCommentStatus] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(
    null,
  );
  const [activeVoteCommentId, setActiveVoteCommentId] = useState<number | null>(
    null,
  );

  if (!loaderData.post && !loaderData.loadError) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 md:px-8 md:py-14">
        <PageContainer>
          <article className="max-w-3xl text-sm leading-6 text-stone-600">
            {messages.blog.loadingPost}
          </article>
        </PageContainer>
      </main>
    );
  }

  if (loaderData.loadError || !loaderData.post) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 md:px-8 md:py-14">
        <PageContainer>
          <article className="max-w-3xl">
            <Link
              to={loaderData.locale === "pl" ? "/pl/blog" : "/blog"}
              className="text-sm font-semibold text-[var(--kanna-ink)] underline decoration-black/20 underline-offset-4 transition hover:decoration-black/70"
            >
              {messages.blog.backToBlog}
            </Link>
            <p className="mt-6 text-sm leading-6 text-stone-600">
              {loaderData.loadError ?? messages.blog.notFound}
            </p>
          </article>
        </PageContainer>
      </main>
    );
  }

  const post = loaderData.post;
  const commentRedirectPath = `${location.pathname}${location.search}#comments`;
  const threadedComments = buildCommentTree(comments);
  const postUrl = buildSiteUrl(location.pathname);
  const hasRealFeaturedImage = Boolean(post.image.src);
  const gpxDownloadPath = post.route?.gpxDownloadUrl
    ? `${localizePath("/blog/download-gpx", locale)}?source=${encodeURIComponent(
        post.route.gpxDownloadUrl,
      )}&filename=${encodeURIComponent(`${post.slug}.gpx`)}`
    : null;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    author: {
      "@type": "Organization",
      name: "Kanna Bikes",
    },
    datePublished: post.publishedAt || undefined,
    description: post.excerpt || post.title,
    headline: post.title,
    image: post.image.src ? [post.image.src] : undefined,
    mainEntityOfPage: postUrl,
    publisher: {
      "@type": "Organization",
      logo: {
        "@type": "ImageObject",
        url: buildSiteUrl("/kannabikes_logo.svg"),
      },
      name: "Kanna Bikes",
    },
    url: postUrl,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: messages.blog.title,
        item: buildSiteUrl(localizePath("/blog", locale)),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  useEffect(() => {
    let cancelled = false;

    setCommentsLoading(true);
    setCommentsError(null);

    void fetchWordpressComments(post.postId)
      .then((nextComments) => {
        if (cancelled) {
          return;
        }

        setComments(nextComments);
        setCommentsLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setComments([]);
        setCommentsError(messages.blog.commentsLoadError);
        setCommentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [messages.blog.commentsLoadError, post.postId]);

  useEffect(() => {
    let cancelled = false;

    setCustomerSessionLoading(true);

    void fetchCustomerSession(locale)
      .then((session) => {
        if (cancelled) {
          return;
        }

        setCustomerSession(session);
        setCustomerSessionLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setCustomerSession(null);
        setCustomerSessionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const submitComment = async ({
    content,
    parentId = 0,
  }: {
    content: string;
    parentId?: number;
  }) => {
    if (!customerSession?.csrfToken) {
      return;
    }

    const response = await createCustomerBlogComment({
      csrfToken: customerSession.csrfToken,
      locale,
      payload: {
        content,
        parentId,
        postId: post.postId,
      },
    });

    const nextComments = await fetchWordpressComments(post.postId);
    const commentExists = nextComments.some(
      (comment) => comment.id === response.comment.id,
    );

    setComments(
      commentExists ? nextComments : [...nextComments, response.comment],
    );

    return response.comment;
  };

  return (
    <main className="min-h-screen bg-white">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <section className="relative overflow-hidden bg-black px-4 pb-12 pt-10 text-white md:px-8 md:pb-16 md:pt-14">
        {hasRealFeaturedImage ? (
          <>
            <img
              src={post.image.src}
              srcSet={post.image.srcSet}
              sizes="100vw"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
          </>
        ) : null}
        <PageContainer>
          <div className="relative z-10">
            {post.publishedAt ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                {formatPublishedDate(post.publishedAt, loaderData.locale)}
              </p>
            ) : null}

            <h1 className="page-heading mt-3 max-w-4xl text-[2.7rem] leading-[0.9] text-white md:text-[4.8rem]">
              {post.title}
            </h1>
          </div>
        </PageContainer>
      </section>

      <article className="px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-10">
        <PageContainer>
          <div className="mx-auto max-w-3xl">
            <div
              className="blog-content text-base"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />

            {post.route?.rideWithGpsEmbedUrl ? (
              <div className="mt-10 overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <iframe
                  src={post.route.rideWithGpsEmbedUrl}
                  title={`${post.title} Ride with GPS`}
                  className="h-[420px] w-full border-0 md:h-[560px]"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
                {gpxDownloadPath ? (
                  <div className="flex justify-end px-4 pb-4 pt-5 md:px-6 md:pb-6 md:pt-6">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        window.location.assign(gpxDownloadPath);
                      }}
                    >
                      {messages.blog.downloadGpx}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <section
              id="comments"
              className="mt-12 border-t border-black/15 pt-10"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                {messages.blog.comments}
              </p>

              {commentsLoading ? (
                <p className="mt-6 text-sm text-black/70">
                  {messages.blog.loadingComments}
                </p>
              ) : null}

              {!commentsLoading && commentsError ? (
                <p className="mt-6 text-sm text-red-700">{commentsError}</p>
              ) : null}

              {!commentsLoading && !commentsError && comments.length === 0 ? (
                <p className="mt-6 text-sm text-black/70">
                  {messages.blog.noComments}
                </p>
              ) : null}

              {!commentsLoading && !commentsError && comments.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {threadedComments.map((comment) => (
                    <CommentThread
                      key={comment.id}
                      activeVoteCommentId={activeVoteCommentId}
                      commentsLocale={loaderData.locale}
                      commentStatus={commentStatus}
                      customerSession={customerSession}
                      locale={locale}
                      messages={messages}
                      onReplyCancel={() => {
                        setReplyingToCommentId(null);
                        setReplyBody("");
                        setCommentStatus(null);
                      }}
                      onReplyChange={setReplyBody}
                      onReplyOpen={(commentId) => {
                        setReplyingToCommentId(commentId);
                        setReplyBody("");
                        setCommentStatus(null);
                      }}
                      onReplySubmit={async (parentId) => {
                        setCommentSubmitting(true);
                        setCommentStatus(null);

                        try {
                          await submitComment({
                            content: replyBody,
                            parentId,
                          });
                          setReplyBody("");
                          setReplyingToCommentId(null);
                          setCommentStatus(messages.blog.submitCommentSuccess);
                        } catch (error) {
                          setCommentStatus(
                            error instanceof Error
                              ? error.message
                              : messages.blog.submitCommentError,
                          );
                        } finally {
                          setCommentSubmitting(false);
                        }
                      }}
                      replyBody={replyBody}
                      replyingToCommentId={replyingToCommentId}
                      replySubmitting={commentSubmitting}
                      rootComment={comment}
                      setActiveVoteCommentId={setActiveVoteCommentId}
                      setComments={setComments}
                    />
                  ))}
                </div>
              ) : null}

              <div className="mt-8 border border-black/15 bg-white p-6">
                {!post.commentsOpen ? (
                  <p className="text-sm text-black/70">
                    {messages.blog.commentsClosed}
                  </p>
                ) : customerSessionLoading ? (
                  <p className="text-sm text-black/70">
                    {messages.blog.loadingComments}
                  </p>
                ) : !customerSession?.authenticated ? (
                  <>
                    <CustomerSignInForm
                      description={messages.blog.inlineSignInHint}
                      locale={locale}
                      redirectTo={commentRedirectPath}
                      title={messages.blog.signInToComment}
                      onSuccess={(session) => {
                        setCustomerSession(session);
                        setCommentStatus(null);
                      }}
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                      {messages.blog.leaveComment}
                    </h2>
                    {customerSession.user ? (
                      <p className="mt-3 text-sm text-black/75">
                        {customerSession.user.displayName ||
                          customerSession.user.email}
                      </p>
                    ) : null}
                    <form
                      className="mt-6 space-y-4"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        setCommentSubmitting(true);
                        setCommentStatus(null);

                        try {
                          await submitComment({ content: commentBody });
                          setCommentBody("");
                          setCommentStatus(messages.blog.submitCommentSuccess);
                        } catch (error) {
                          setCommentStatus(
                            error instanceof Error
                              ? error.message
                              : messages.blog.submitCommentError,
                          );
                        } finally {
                          setCommentSubmitting(false);
                        }
                      }}
                    >
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                          {messages.blog.commentBodyLabel}
                        </span>
                        <TextareaField
                          required
                          rows={6}
                          value={commentBody}
                          onChange={(event) =>
                            setCommentBody(event.currentTarget.value)
                          }
                        />
                      </label>

                      <Button
                        type="submit"
                        disabled={commentSubmitting}
                        className="rounded-none"
                      >
                        {messages.blog.submitComment}
                      </Button>

                      {commentStatus ? (
                        <p className="text-sm text-[var(--kanna-ink)]">
                          {commentStatus}
                        </p>
                      ) : null}
                    </form>
                  </>
                )}
              </div>
            </section>

            <div className="mt-12">
              <Link
                to={loaderData.locale === "pl" ? "/pl/blog" : "/blog"}
                className="text-sm font-semibold text-[var(--kanna-ink)] underline decoration-black/20 underline-offset-4 transition hover:decoration-black/70"
              >
                {messages.blog.backToBlog}
              </Link>
            </div>
          </div>
        </PageContainer>
      </article>
    </main>
  );
}

function CommentThread({
  activeVoteCommentId,
  commentsLocale,
  commentStatus,
  customerSession,
  locale,
  messages,
  onReplyCancel,
  onReplyChange,
  onReplyOpen,
  onReplySubmit,
  replyBody,
  replyingToCommentId,
  replySubmitting,
  rootComment,
  setActiveVoteCommentId,
  setComments,
}: {
  activeVoteCommentId: number | null;
  commentsLocale: "en" | "pl";
  commentStatus: string | null;
  customerSession: CustomerSession | null;
  locale: "en" | "pl";
  messages: ReturnType<typeof useMessages>;
  onReplyCancel: () => void;
  onReplyChange: (value: string) => void;
  onReplyOpen: (commentId: number) => void;
  onReplySubmit: (parentId: number) => Promise<void>;
  replyBody: string;
  replyingToCommentId: number | null;
  replySubmitting: boolean;
  rootComment: ThreadedWordpressComment;
  setActiveVoteCommentId: (commentId: number | null) => void;
  setComments: Dispatch<SetStateAction<WordpressComment[]>>;
}) {
  return (
    <CommentCard
      activeVoteCommentId={activeVoteCommentId}
      commentsLocale={commentsLocale}
      commentStatus={commentStatus}
      customerSession={customerSession}
      depth={0}
      locale={locale}
      messages={messages}
      node={rootComment}
      onReplyCancel={onReplyCancel}
      onReplyChange={onReplyChange}
      onReplyOpen={onReplyOpen}
      onReplySubmit={onReplySubmit}
      replyBody={replyBody}
      replyingToCommentId={replyingToCommentId}
      replySubmitting={replySubmitting}
      setActiveVoteCommentId={setActiveVoteCommentId}
      setComments={setComments}
    />
  );
}

function CommentCard({
  activeVoteCommentId,
  commentsLocale,
  commentStatus,
  customerSession,
  depth,
  locale,
  messages,
  node,
  onReplyCancel,
  onReplyChange,
  onReplyOpen,
  onReplySubmit,
  replyBody,
  replyingToCommentId,
  replySubmitting,
  setActiveVoteCommentId,
  setComments,
}: {
  activeVoteCommentId: number | null;
  commentsLocale: "en" | "pl";
  commentStatus: string | null;
  customerSession: CustomerSession | null;
  depth: number;
  locale: "en" | "pl";
  messages: ReturnType<typeof useMessages>;
  node: ThreadedWordpressComment;
  onReplyCancel: () => void;
  onReplyChange: (value: string) => void;
  onReplyOpen: (commentId: number) => void;
  onReplySubmit: (parentId: number) => Promise<void>;
  replyBody: string;
  replyingToCommentId: number | null;
  replySubmitting: boolean;
  setActiveVoteCommentId: (commentId: number | null) => void;
  setComments: Dispatch<SetStateAction<WordpressComment[]>>;
}) {
  const isReplying = replyingToCommentId === node.id;

  return (
    <div
      className={
        depth > 0
          ? "ml-6 mt-4 border-l border-black/10 pl-4 md:ml-10 md:pl-6"
          : ""
      }
    >
      <article className="border border-black/15 bg-white p-5">
        <div className="flex gap-4">
          <div className="flex w-10 shrink-0 flex-col items-center">
            <button
              type="button"
              aria-label={messages.blog.voteCommentUp}
              disabled={
                !customerSession?.authenticated ||
                activeVoteCommentId === node.id
              }
              className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center border border-black/15 text-[var(--kanna-ink)] transition hover:border-black ${node.currentUserVote === 1 ? "bg-black text-white" : "bg-white"} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={async () => {
                if (
                  !customerSession?.authenticated ||
                  !customerSession.csrfToken
                ) {
                  return;
                }

                setActiveVoteCommentId(node.id);

                try {
                  const response = await voteCustomerBlogComment({
                    commentId: node.id,
                    csrfToken: customerSession.csrfToken,
                    direction: "up",
                    locale,
                  });

                  setComments((currentComments) =>
                    currentComments.map((currentComment) =>
                      currentComment.id === node.id
                        ? {
                            ...currentComment,
                            currentUserVote: response.currentUserVote,
                            voteScore: response.voteScore,
                          }
                        : currentComment,
                    ),
                  );
                } catch {
                  // Keep the UI unchanged on vote errors; the server stays authoritative.
                } finally {
                  setActiveVoteCommentId(null);
                }
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
                <path
                  d="M4.5 12.5L10 7l5.5 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </button>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
              {node.voteScore}
            </p>
            <button
              type="button"
              aria-label={messages.blog.voteCommentDown}
              disabled={
                !customerSession?.authenticated ||
                activeVoteCommentId === node.id
              }
              className={`mt-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center border border-black/15 text-[var(--kanna-ink)] transition hover:border-black ${node.currentUserVote === -1 ? "bg-black text-white" : "bg-white"} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={async () => {
                if (
                  !customerSession?.authenticated ||
                  !customerSession.csrfToken
                ) {
                  return;
                }

                setActiveVoteCommentId(node.id);

                try {
                  const response = await voteCustomerBlogComment({
                    commentId: node.id,
                    csrfToken: customerSession.csrfToken,
                    direction: "down",
                    locale,
                  });

                  setComments((currentComments) =>
                    currentComments.map((currentComment) =>
                      currentComment.id === node.id
                        ? {
                            ...currentComment,
                            currentUserVote: response.currentUserVote,
                            voteScore: response.voteScore,
                          }
                        : currentComment,
                    ),
                  );
                } catch {
                  // Keep the UI unchanged on vote errors; the server stays authoritative.
                } finally {
                  setActiveVoteCommentId(null);
                }
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
                <path
                  d="M4.5 7.5L10 13l5.5-5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              {node.avatarUrl ? (
                <img
                  src={node.avatarUrl}
                  alt={node.authorName}
                  className="h-9 w-9 border border-black/15 object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center border border-black/15 bg-stone-100 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                  {node.authorName.slice(0, 1)}
                </div>
              )}
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                {node.authorName}
              </p>
              {node.status !== "approved" ? (
                <p className="text-xs uppercase tracking-[0.08em] text-black/45">
                  {messages.account.commentPending}
                </p>
              ) : null}
              {node.createdAt ? (
                <p className="ml-auto text-xs uppercase tracking-[0.08em] text-black/45">
                  {new Intl.DateTimeFormat(getIntlLocale(commentsLocale), {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(node.createdAt))}
                </p>
              ) : null}
            </div>
            <div
              className="blog-content mt-3 text-sm text-[var(--kanna-ink)]"
              dangerouslySetInnerHTML={{
                __html: node.contentHtml,
              }}
            />
            {customerSession?.authenticated ? (
              <div className="mt-4">
                {isReplying ? (
                  <form
                    className="space-y-4 border-t border-black/10 pt-4"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      await onReplySubmit(node.id);
                    }}
                  >
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                        {messages.blog.replyToComment}
                      </span>
                      <TextareaField
                        required
                        rows={4}
                        value={replyBody}
                        onChange={(event) =>
                          onReplyChange(event.currentTarget.value)
                        }
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="submit"
                        disabled={replySubmitting}
                        className="rounded-none"
                      >
                        {messages.blog.submitComment}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-none"
                        onClick={onReplyCancel}
                      >
                        {messages.blog.cancelReply}
                      </Button>
                    </div>
                    {commentStatus ? (
                      <p className="text-sm text-[var(--kanna-ink)]">
                        {commentStatus}
                      </p>
                    ) : null}
                  </form>
                ) : (
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)] underline decoration-black/20 underline-offset-4 transition hover:decoration-black"
                    onClick={() => onReplyOpen(node.id)}
                  >
                    {messages.blog.replyToComment}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {node.children.map((child) => (
        <CommentCard
          key={child.id}
          activeVoteCommentId={activeVoteCommentId}
          commentsLocale={commentsLocale}
          commentStatus={commentStatus}
          customerSession={customerSession}
          depth={depth + 1}
          locale={locale}
          messages={messages}
          node={child}
          onReplyCancel={onReplyCancel}
          onReplyChange={onReplyChange}
          onReplyOpen={onReplyOpen}
          onReplySubmit={onReplySubmit}
          replyBody={replyBody}
          replyingToCommentId={replyingToCommentId}
          replySubmitting={replySubmitting}
          setActiveVoteCommentId={setActiveVoteCommentId}
          setComments={setComments}
        />
      ))}
    </div>
  );
}
