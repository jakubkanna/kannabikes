import type { Route } from "./+types/privacy-terms";
import { SITE_NAME } from "~/root";

const BUSINESS = {
  controllerName: "Kanna Bikes",
  legalName: "Kanna Bikes Sp. z o.o.",
  address: "[replace with registered address]",
  email: "[replace with contact email]",
  phone: "[replace with phone number]",
  retentionPeriod:
    "[replace with your retention period for quote/contact requests, e.g. 12 months after the last contact unless a contract is concluded]",
  processors:
    "[replace with your real processors, e.g. hosting provider, email provider, CRM, payment processor]",
};

export function meta({}: Route.MetaArgs) {
  return [{ title: `${SITE_NAME} | Privacy & Terms` }];
}

export default function PrivacyTermsPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Legal
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Privacy & terms
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          This page sets out the privacy information and basic contact / quote
          terms for customers contacting {SITE_NAME} through the website.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-6 text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              1. Controller details
            </h2>
            <p className="mt-3">
              The controller of your personal data is {BUSINESS.legalName},
              operating under the brand name {BUSINESS.controllerName}.
            </p>
            <p className="mt-3">
              Registered address: {BUSINESS.address}
              <br />
              Contact email: {BUSINESS.email}
              <br />
              Contact phone: {BUSINESS.phone}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              2. What data we process
            </h2>
            <p className="mt-3">
              We may process the data you provide in the contact or quote form,
              including your full name, email address, phone number, topic of
              inquiry, message content, and any order-related information you
              choose to send us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              3. Purposes and legal bases
            </h2>
            <p className="mt-3">
              We process your data to answer your inquiry, prepare a quote,
              discuss a custom bicycle build, and take steps at your request
              before entering into a contract.
            </p>
            <p className="mt-3">
              For quote and order-preparation communication, the legal basis is
              Article 6(1)(b) GDPR: processing necessary to take steps at the
              request of the data subject prior to entering into a contract.
            </p>
            <p className="mt-3">
              If you separately agree to receive marketing updates, the legal
              basis for that processing is your consent under Article 6(1)(a)
              GDPR. You may withdraw that consent at any time without affecting
              the lawfulness of processing carried out before withdrawal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              4. Retention period
            </h2>
            <p className="mt-3">
              We keep contact and quote-request data for:{" "}
              {BUSINESS.retentionPeriod}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              5. Recipients of personal data
            </h2>
            <p className="mt-3">
              Your data may be disclosed to service providers supporting the
              operation of our business, including: {BUSINESS.processors}
            </p>
            <p className="mt-3">
              Where required, such entities process personal data on our behalf
              under appropriate contractual safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              6. Your rights
            </h2>
            <p className="mt-3">
              Subject to applicable law, you may request access to your data,
              rectification, erasure, restriction of processing, objection, and
              data portability. You may also lodge a complaint with the
              competent supervisory authority, including the President of the
              Personal Data Protection Office (Prezes UODO) in Poland.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              7. Contact and quote terms
            </h2>
            <p className="mt-3">
              Sending a contact form or quote request does not create a binding
              purchase agreement and does not reserve a production slot unless
              we expressly confirm that in a later step.
            </p>
            <p className="mt-3">
              Any quote, build proposal, estimated price, delivery estimate, or
              availability statement is non-binding unless confirmed in a later
              order stage in writing.
            </p>
            <p className="mt-3">
              If you receive a unique payment or order link from {SITE_NAME},
              it is intended only for the recipient to continue the pre-contract
              or order process. You should not share that link publicly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              8. Payments and deposits
            </h2>
            <p className="mt-3">
              If we invite you to continue with a deposit payment, the detailed
              deposit terms, payment method information, refund conditions, and
              order-specific obligations may be presented separately on the
              secure order page or in the individual offer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              9. Final note before production use
            </h2>
            <p className="mt-3">
              This page still contains placeholders and should be completed with
              your real company details, retention periods, processor list, and
              operational rules before being treated as production legal text.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
