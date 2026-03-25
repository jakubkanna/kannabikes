import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useLocation } from "react-router";

import type { Route } from "./+types/blog.$slug";
import { Button } from "~/components/button";
import { CustomerSignInForm } from "~/components/customer-sign-in-form";
import { TextareaField } from "~/components/form-field";
import { PageContainer } from "~/components/page-container";
import { useLocale, useMessages } from "~/components/locale-provider";
import {
  buildLocalizedMeta,
  getIntlLocale,
  getLocaleFromPath,
  getMessages,
} from "~/lib/i18n";
import {
  createCustomerBlogComment,
  fetchCustomerSession,
  type CustomerSession,
  voteCustomerBlogComment,
} from "~/lib/customer-account";
import {
  fetchWordpressComments,
  fetchWordpressPostBySlug,
  type WordpressComment,
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

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  const locale = getLocaleFromPath(new URL(request.url).pathname);

  try {
    const post = await fetchWordpressPostBySlug(
      params.slug ?? "",
      locale,
      "blog",
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

  return buildLocalizedMeta({
    alternates: loaderData?.alternatePaths,
    description: loaderData?.post?.excerpt || messages.meta.blog.description,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(title),
  });
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

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-black px-4 pb-12 pt-10 text-white md:px-8 md:pb-16 md:pt-14">
        <PageContainer>
          <Link
            to={loaderData.locale === "pl" ? "/pl/blog" : "/blog"}
            className="text-sm font-semibold text-white/80 underline decoration-white/30 underline-offset-4 transition hover:text-white hover:decoration-white"
          >
            {messages.blog.backToBlog}
          </Link>

          {post.publishedAt ? (
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              {formatPublishedDate(post.publishedAt, loaderData.locale)}
            </p>
          ) : null}

          <h1 className="page-heading mt-3 max-w-4xl text-[2.7rem] leading-[0.9] text-white md:text-[4.8rem]">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/72 md:text-lg">
              {post.excerpt}
            </p>
          ) : null}
        </PageContainer>
      </section>

      <article className="px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-10">
        <PageContainer>
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
                  {comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="border border-black/15 bg-white p-5"
                    >
                      <div className="flex gap-4">
                        <div className="flex w-10 shrink-0 flex-col items-center">
                          <button
                            type="button"
                            aria-label={messages.blog.voteCommentUp}
                            disabled={
                              !customerSession?.authenticated ||
                              activeVoteCommentId === comment.id
                            }
                            className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center border border-black/15 text-[var(--kanna-ink)] transition hover:border-black ${comment.currentUserVote === 1 ? "bg-black text-white" : "bg-white"} disabled:cursor-not-allowed disabled:opacity-50`}
                            onClick={async () => {
                              if (
                                !customerSession?.authenticated ||
                                !customerSession.csrfToken
                              ) {
                                return;
                              }

                              setActiveVoteCommentId(comment.id);

                              try {
                                const response = await voteCustomerBlogComment({
                                  commentId: comment.id,
                                  csrfToken: customerSession.csrfToken,
                                  direction: "up",
                                  locale,
                                });

                                setComments((currentComments) =>
                                  currentComments.map((currentComment) =>
                                    currentComment.id === comment.id
                                      ? {
                                          ...currentComment,
                                          currentUserVote:
                                            response.currentUserVote,
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
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              className="h-4 w-4"
                            >
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
                            {comment.voteScore}
                          </p>
                          <button
                            type="button"
                            aria-label={messages.blog.voteCommentDown}
                            disabled={
                              !customerSession?.authenticated ||
                              activeVoteCommentId === comment.id
                            }
                            className={`mt-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center border border-black/15 text-[var(--kanna-ink)] transition hover:border-black ${comment.currentUserVote === -1 ? "bg-black text-white" : "bg-white"} disabled:cursor-not-allowed disabled:opacity-50`}
                            onClick={async () => {
                              if (
                                !customerSession?.authenticated ||
                                !customerSession.csrfToken
                              ) {
                                return;
                              }

                              setActiveVoteCommentId(comment.id);

                              try {
                                const response = await voteCustomerBlogComment({
                                  commentId: comment.id,
                                  csrfToken: customerSession.csrfToken,
                                  direction: "down",
                                  locale,
                                });

                                setComments((currentComments) =>
                                  currentComments.map((currentComment) =>
                                    currentComment.id === comment.id
                                      ? {
                                          ...currentComment,
                                          currentUserVote:
                                            response.currentUserVote,
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
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              className="h-4 w-4"
                            >
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
                            {comment.avatarUrl ? (
                              <img
                                src={comment.avatarUrl}
                                alt={comment.authorName}
                                className="h-9 w-9 border border-black/15 object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center border border-black/15 bg-stone-100 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                                {comment.authorName.slice(0, 1)}
                              </div>
                            )}
                            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                              {comment.authorName}
                            </p>
                            {comment.createdAt ? (
                              <p className="ml-auto text-xs uppercase tracking-[0.08em] text-black/45">
                                {new Intl.DateTimeFormat(
                                  getIntlLocale(loaderData.locale),
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                ).format(new Date(comment.createdAt))}
                              </p>
                            ) : null}
                          </div>
                          <div
                            className="blog-content mt-3 text-sm text-[var(--kanna-ink)]"
                            dangerouslySetInnerHTML={{
                              __html: comment.contentHtml,
                            }}
                          />
                        </div>
                      </div>
                    </article>
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
                          const response = await createCustomerBlogComment({
                            csrfToken: customerSession.csrfToken,
                            locale,
                            payload: {
                              content: commentBody,
                              postId: post.postId,
                            },
                          });

                          setCommentBody("");
                          setCommentStatus(
                            response.comment.status === "approved"
                              ? messages.blog.submitCommentSuccess
                              : messages.blog.submitCommentSuccess,
                          );
                          if (response.comment.status === "approved") {
                            const nextComments = await fetchWordpressComments(
                              post.postId,
                            );
                            setComments(nextComments);
                          } else {
                            setComments((currentComments) => currentComments);
                          }
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
          </div>
        </PageContainer>
      </article>
    </main>
  );
}
