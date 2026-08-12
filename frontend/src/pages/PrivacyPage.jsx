/**
 * PrivacyPage.jsx
 * 
 * Privacy Policy
 */

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ground py-12 px-4">
      <div className="max-w-4xl mx-auto bg-paper rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-display font-bold text-ink mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-lg max-w-none text-ink/80 space-y-6">
          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us when you create an account,
              subscribe to our service, or communicate with us. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email address</li>
              <li>Display name (optional)</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              2. How We Use Your Information
            </h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve our service</li>
              <li>Process your subscription and payments</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              3. Information Sharing
            </h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties.
              We share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>With service providers:</strong> We use Stripe for payment
                processing and Supabase for authentication and database services. These
                providers have access only to the information necessary to perform their
                functions.
              </li>
              <li>
                <strong>For legal reasons:</strong> We may disclose your information if
                required by law or in response to valid legal requests.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              4. Data Security
            </h2>
            <p>
              We take reasonable measures to help protect your personal information from
              loss, theft, misuse, unauthorized access, disclosure, alteration, and
              destruction. However, no internet or email transmission is ever fully secure
              or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              5. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as your account is active or
              as needed to provide you services. You may delete your account at any time
              from your account settings page, which will permanently remove all your
              personal data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              6. Your Rights
            </h2>
            <p>
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Object to processing of your personal information</li>
              <li>Export your data (contact us for assistance)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              7. Cookies and Tracking
            </h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our
              service and hold certain information. You can instruct your browser to refuse
              all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              8. Children's Privacy
            </h2>
            <p>
              Our service is not intended for anyone under the age of 18. We do not
              knowingly collect personal information from children under 18. If you are a
              parent or guardian and believe your child has provided us with personal
              information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              9. Changes to This Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the "Last
              updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-ink mb-3">
              10. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us.
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
