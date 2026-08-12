/**
 * TermsPage.jsx
 * 
 * Terms of Service
 */

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ground py-12 px-4">
      <div className="max-w-4xl mx-auto bg-paper rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-display font-bold text-ink mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-lg max-w-none text-ink/80 space-y-6">
          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using ATLAS, you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              2. Use License
            </h2>
            <p>
              Permission is granted to temporarily access the materials (information or
              software) on ATLAS for personal, non-commercial transitory viewing only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              3. Subscription Terms
            </h2>
            <p>
              Subscriptions are billed monthly. You may cancel your subscription at any
              time from your account page. Cancellation takes effect at the end of the
              current billing period.
            </p>
            <p className="mt-2">
              No refunds will be provided for partial subscription periods.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              4. Account Termination
            </h2>
            <p>
              You may delete your account at any time from your account settings page.
              Upon account deletion, all your data will be permanently removed, and any
              active subscription will be canceled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              5. Age Requirement
            </h2>
            <p>
              You must be at least 18 years of age to create an account and use ATLAS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              6. Disclaimer
            </h2>
            <p>
              The materials on ATLAS are provided on an 'as is' basis. ATLAS makes no
              warranties, expressed or implied, and hereby disclaims and negates all other
              warranties including, without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or non-infringement of
              intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              7. Limitations
            </h2>
            <p>
              In no event shall ATLAS or its suppliers be liable for any damages
              (including, without limitation, damages for loss of data or profit, or due to
              business interruption) arising out of the use or inability to use the
              materials on ATLAS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              8. Modifications
            </h2>
            <p>
              ATLAS may revise these terms of service at any time without notice. By using
              this service you are agreeing to be bound by the then current version of
              these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              9. Contact
            </h2>
            <p>
              If you have any questions about these Terms of Service, please contact us.
            </p>
          </section>

          <p className="text-sm text-ink/50 mt-8 pt-8 border-t border-ink/20">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
