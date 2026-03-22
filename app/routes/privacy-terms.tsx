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
          This page sets out the privacy information and order terms for
          customers contacting {SITE_NAME} through the website across three
          stages: contact and quote, deposit, and delivery.
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
              2. Stage 1: Contact form and quote request
            </h2>
            <p className="mt-3">
              At the contact stage, we process the data you provide in the
              contact form, including your full name, email address, phone
              number, topic of inquiry, and message content.
            </p>
            <p className="mt-3">
              We process this data to answer your inquiry, discuss your project,
              and prepare a custom quote for you.
            </p>
            <p className="mt-3">
              The legal basis for this processing is Article 6(1)(b) GDPR:
              processing necessary to take steps at your request before
              entering into a contract.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              3. Stage 2: Deposit
            </h2>
            <p className="mt-3">
              If you decide to continue after receiving a quote, we may process
              the data needed to open your order, issue a deposit request, and
              provide you with a secure order or payment link.
            </p>
            <p className="mt-3">
              By continuing to the deposit stage, you acknowledge that the
              deposit becomes non-refundable once your bicycle enters
              production.
            </p>
            <p className="mt-3">
              If you decide to withdraw from the project after work has already
              started, we may charge for the actual time spent on your project
              at a rate of 35 EUR per hour.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              4. Stage 3: Delivery and shipping
            </h2>
            <p className="mt-3">
              If your order moves to completion, we may process additional data
              needed for delivery, shipment, invoicing, handover, and
              after-sales communication.
            </p>
            <p className="mt-3">
              This may include your delivery address, shipping contact details,
              and communication with shipping or logistics partners where
              necessary to complete delivery.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              5. Retention period
            </h2>
            <p className="mt-3">
              We keep contact, quote, order, payment, and delivery-related data
              for: {BUSINESS.retentionPeriod}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              6. Recipients of personal data
            </h2>
            <p className="mt-3">
              Your data may be disclosed to service providers supporting the
              operation of our business, including: {BUSINESS.processors}
            </p>
            <p className="mt-3">
              Depending on the stage of your order, this may include hosting
              providers, email services, CRM tools, payment processors, and
              shipping or logistics providers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              7. Your rights
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
              8. Additional terms
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
              9. Order statuses used in the app
            </h2>
            <p className="mt-3">
              During the custom bike process, your order may appear in the app
              under one of the following statuses:
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="font-semibold text-slate-900">Waiting for deposit</p>
                <p>We are waiting for the initial deposit before review starts.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">In review</p>
                <p>
                  We are reviewing your deposit, measurements, order details,
                  or final payment, depending on the current stage.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Waiting for specification
                </p>
                <p>
                  Measurements have been received and the project is waiting for
                  the bike specification needed to move into design.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Design in progress</p>
                <p>
                  Review is complete and the order is queued for the design
                  phase.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Design waiting for approval
                </p>
                <p>
                  The design is prepared and waiting for your approval before
                  production starts.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Waiting for final payment
                </p>
                <p>
                  The design is approved and we are waiting for the remaining
                  payment before production begins.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">In production</p>
                <p>
                  Your frame and chosen configuration are in production.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Waiting for delivery
                </p>
                <p>
                  Production is complete and we are preparing shipment or
                  handoff.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Delivered</p>
                <p>The order has been delivered or handed over to you.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              10. Optional marketing consent
            </h2>
            <p className="mt-3">
              If you separately agree to receive marketing updates, the legal
              basis for that processing is your consent under Article 6(1)(a)
              GDPR. You may withdraw that consent at any time without affecting
              the lawfulness of processing carried out before withdrawal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              11. Final note before production use
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
