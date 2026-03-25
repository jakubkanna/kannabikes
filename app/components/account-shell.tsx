import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/button";
import { LocalizedNavLink } from "~/components/localized-link";
import { PageContainer, PageShell } from "~/components/page-container";
import { SectionPill } from "~/components/section-pill";
import { useLocale, useMessages } from "./locale-provider";
import type { CustomerSession } from "~/lib/customer-account";
import { logoutCustomerSession } from "~/lib/customer-account";
import { localizePath } from "~/lib/i18n";

export function AccountShell({
  children,
  session,
  title,
}: {
  children: ReactNode;
  session: CustomerSession;
  title: string;
}) {
  const locale = useLocale();
  const messages = useMessages();
  const navigate = useNavigate();
  const navItems = [
    { label: messages.account.ordersTitle, to: "/account/orders" },
    { label: messages.account.profileTitle, to: "/account/profile" },
    { label: messages.account.addressesTitle, to: "/account/addresses" },
    { label: messages.account.reviewsTitle, to: "/account/reviews" },
  ] as const;

  return (
    <PageShell>
      <PageContainer>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <SectionPill>{messages.account.pill}</SectionPill>
            <h1 className="page-heading mt-4 text-[2.35rem] leading-[0.88] text-[var(--kanna-ink)] md:text-[3.8rem]">
              {title}
            </h1>
            {session.user ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {session.user.displayName || session.user.email}
              </p>
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
