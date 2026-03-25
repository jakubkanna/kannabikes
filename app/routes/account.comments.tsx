import { redirect } from "react-router";
import { AccountShell } from "~/components/account-shell";
import { LocalizedLink } from "~/components/localized-link";
import { useMessages } from "~/components/locale-provider";
import {
  fetchCustomerComments,
  fetchCustomerSession,
} from "~/lib/customer-account";
import { buildLocalizedMeta, getIntlLocale, getLocaleFromPath, getMessages } from "~/lib/i18n";
import { formatPageTitle } from "~/root";
import type { Route } from "./+types/account.comments";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const pathname = new URL(request.url).pathname;
  const locale = getLocaleFromPath(pathname);
  const session = await fetchCustomerSession(locale);

  if (!session.authenticated) {
    throw redirect(
      `${session.account_paths.sign_in}?redirect=${encodeURIComponent(pathname)}`,
    );
  }

  const { comments } = await fetchCustomerComments(locale);

  return { comments, locale, session };
}

export function meta({ location }: Route.MetaArgs) {
  const locale = getLocaleFromPath(location.pathname);
  const messages = getMessages(locale);

  return buildLocalizedMeta({
    description: messages.account.commentsBody,
    locale,
    pathname: location.pathname,
    title: formatPageTitle(messages.account.commentsTitle),
  });
}

export default function AccountCommentsPage({
  loaderData,
}: Route.ComponentProps) {
  const messages = useMessages();

  return (
    <AccountShell session={loaderData.session} title={messages.account.commentsTitle}>
      {loaderData.comments.length === 0 ? (
        <p className="text-sm text-slate-600">{messages.account.noComments}</p>
      ) : (
        <div className="space-y-4">
          {loaderData.comments.map((comment) => (
            <article key={comment.id} className="border border-black/15 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <LocalizedLink
                  to={comment.postPath || "/blog"}
                  className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)] underline decoration-black/20 underline-offset-4 transition hover:text-black hover:decoration-black"
                >
                  {comment.postTitle}
                </LocalizedLink>
                {comment.createdAt ? (
                  <p className="text-xs uppercase tracking-[0.08em] text-black/45">
                    {new Intl.DateTimeFormat(getIntlLocale(loaderData.locale), {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(comment.createdAt))}
                  </p>
                ) : null}
                {comment.status !== "approved" ? (
                  <p className="text-xs uppercase tracking-[0.08em] text-black/45">
                    {messages.account.commentPending}
                  </p>
                ) : null}
              </div>
              <div
                className="blog-content mt-3 text-sm leading-relaxed text-[var(--kanna-ink)]"
                dangerouslySetInnerHTML={{ __html: comment.contentHtml }}
              />
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
