import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/button";
import { LocalizedNavLink } from "~/components/localized-link";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import { useLocale, useMessages } from "./locale-provider";
import type { CustomerSession, CustomerUser } from "~/lib/customer-account";
import {
  logoutCustomerSession,
  uploadCustomerAvatar,
} from "~/lib/customer-account";
import { localizePath } from "~/lib/i18n";

export function AccountShell({
  children,
  session,
  title,
  user,
}: {
  children: ReactNode;
  session: CustomerSession;
  title: string;
  user?: CustomerUser | null;
}) {
  const locale = useLocale();
  const messages = useMessages();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [displayUser, setDisplayUser] = useState(user ?? session.user);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const navItems = [
    { label: messages.account.ordersTitle, to: "/account/orders" },
    { label: messages.account.profileTitle, to: "/account/profile" },
    { label: messages.account.addressesTitle, to: "/account/addresses" },
    { label: messages.account.commentsTitle, to: "/account/comments" },
    { label: messages.account.reviewsTitle, to: "/account/reviews" },
  ] as const;

  useEffect(() => {
    setDisplayUser(user ?? session.user);
  }, [session.user, user]);

  return (
    <PageShell>
      <PageContainer>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <SectionPill>{messages.account.pill}</SectionPill>
            <h1 className="page-heading mt-4 text-[2.35rem] leading-[0.88] text-[var(--kanna-ink)] md:text-[3.8rem]">
              {title}
            </h1>
            {displayUser ? (
              <div className="mt-4 flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.currentTarget.files?.[0];

                    if (!file || !session.csrfToken) {
                      return;
                    }

                    setIsUploadingAvatar(true);

                    try {
                      const response = await uploadCustomerAvatar({
                        csrfToken: session.csrfToken,
                        file,
                        locale,
                      });
                      setDisplayUser(response.user);
                    } finally {
                      event.currentTarget.value = "";
                      setIsUploadingAvatar(false);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar || !session.csrfToken}
                  className="group relative flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden border border-black/15 bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={messages.account.avatarUpload}
                  title={messages.account.avatarUpload}
                >
                  {displayUser.avatarUrl ? (
                    <img
                      src={displayUser.avatarUrl}
                      alt={displayUser.displayName || displayUser.email}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
                      {(displayUser.displayName || displayUser.email).slice(
                        0,
                        1,
                      )}
                    </div>
                  )}

                  <span className="absolute inset-x-0 bottom-0 bg-black px-1 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white opacity-0 transition group-hover:opacity-100">
                    {isUploadingAvatar
                      ? messages.account.avatarUploading
                      : messages.account.avatarUpload}
                  </span>
                </button>

                <p className="text-sm leading-6 text-gray-600">
                  {displayUser.displayName || displayUser.email}
                </p>
              </div>
            ) : null}
          </div>

          <Button
            variant="secondary"
            className="min-h-12"
            onClick={async () => {
              if (!session.csrfToken) {
                navigate(localizePath("/sign-in", locale));
                return;
              }

              try {
                await logoutCustomerSession({
                  csrfToken: session.csrfToken,
                  locale,
                });
              } finally {
                navigate(localizePath("/sign-in", locale), { replace: true });
              }
            }}
          >
            {messages.account.logout}
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--kanna-ink)]">
          {navItems.map((item) => (
            <LocalizedNavLink
              key={item.to}
              to={item.to}
              className="border border-black/20 bg-white px-4 py-3 transition hover:border-black/60"
              style={({ isActive }) => ({
                backgroundColor: isActive ? "rgba(0, 0, 0, 0.9)" : "#fff",
                borderColor: isActive ? "rgba(0, 0, 0, 0.9)" : undefined,
                color: isActive ? "#fff" : "var(--kanna-ink)",
              })}
            >
              {item.label}
            </LocalizedNavLink>
          ))}
        </div>

        <div className="mt-8">{children}</div>
      </PageContainer>
    </PageShell>
  );
}
