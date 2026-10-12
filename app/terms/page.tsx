export const metadata = {
  title: "Terms of Service — Plainread",
  description: "Terms governing use of the Plainread reading aid service.",
};

export default function TermsPage() {
  return (
    <main className="main-content" style={{ maxWidth: "760px" }}>
      <div className="card" style={{ padding: "2rem" }}>
        <h1>Terms of Service</h1>
        <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <h2>1. Service Description</h2>
        <p>
          Plainread is a reading aid tool that helps users discover comfortable typography settings, import their own content, and optionally simplify text using AI. The service is provided as-is for personal, non-commercial use.
        </p>

        <h2>2. Not a Medical Device</h2>
        <p>
          Plainread is a reading aid, not a medical device, diagnostic tool, or therapeutic intervention. It does not diagnose, treat, or mitigate any medical condition including dyslexia or other reading difficulties. Consult qualified professionals for medical advice.
        </p>

        <h2>3. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the AI simplification feature to process content you do not have rights to use</li>
          <li>Attempt to circumvent rate limits or usage quotas</li>
          <li>Use the URL import feature to access private, internal, or non-public resources</li>
          <li>Scrape or systematically extract content from the service</li>
          <li>Use the service for any unlawful purpose</li>
        </ul>

        <h2>4. AI Simplification Disclaimer</h2>
        <p>
          AI-generated simplifications may omit nuance, introduce errors, or misrepresent the original text. Always verify important information against the original content. We are not liable for decisions made based on AI-simplified text.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          You retain all rights to content you import. We claim no ownership over your documents. The Plainread software and design are provided under the project&apos;s open-source license.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          The service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from use of the service.
        </p>

        <h2>7. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.
        </p>

        <h2>8. Contact</h2>
        <p>
          For questions about these terms, contact us through our GitHub repository.
        </p>
      </div>
    </main>
  );
}
