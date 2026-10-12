export const metadata = {
  title: "Privacy Policy — Plainread",
  description: "How Plainread handles your data, cookies, and privacy.",
};

export default function PrivacyPage() {
  return (
    <main className="main-content" style={{ maxWidth: "760px" }}>
      <div className="card" style={{ padding: "2rem" }}>
        <h1>Privacy Policy</h1>
        <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <h2>1. What We Collect</h2>
        <p>
          Plainread is designed to collect as little data as possible. We do not require accounts, email addresses, or personal information.
        </p>
        <ul>
          <li>
            <strong>Anonymous session ID:</strong> A random identifier stored in your browser cookie to associate documents with your session.
          </li>
          <li>
            <strong>Reading profile:</strong> Your font, spacing, and theme preferences stored in a browser cookie.
          </li>
          <li>
            <strong>Imported documents:</strong> Text you paste, upload, or import from URLs, stored so you can read them with your settings.
          </li>
        </ul>

        <h2>2. What We Do NOT Collect</h2>
        <ul>
          <li>No health data, medical diagnoses, or disability information</li>
          <li>No reading habit analytics, time spent, or scroll tracking</li>
          <li>No advertising identifiers</li>
          <li>No third-party tracking pixels</li>
          <li>No IP addresses stored beyond transient rate-limiting hashes</li>
        </ul>

        <h2>3. AI Simplification & Anthropic</h2>
        <p>
          When you request AI simplification, the article text is sent to Anthropic&apos;s API for processing. Anthropic processes this text solely to generate your requested simplification level. We do not store the API response beyond caching it for your session.
        </p>
        <p>
          Article text transmitted to Anthropic is not used for training AI models per Anthropic&apos;s standard API data policy.
        </p>

        <h2>4. Cookies</h2>
        <p>We use only essential cookies:</p>
        <ul>
          <li>
            <strong>pr_anon_id</strong> (httpOnly, 1 year): Anonymous session identifier for document ownership.
          </li>
          <li>
            <strong>pr_profile</strong> (1 year): Your reading display preferences.
          </li>
        </ul>
        <p>Neither cookie contains personally identifiable information.</p>

        <h2>5. Data Retention</h2>
        <p>
          Documents are stored until you clear your browser cookies (which removes your ability to access them). We do not maintain backup copies of user documents beyond standard database backups.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          Because we collect minimal data and do not require accounts, there is no personal data profile to export or delete. Clearing your browser cookies removes your anonymous session ID and reading profile.
        </p>

        <h2>7. Contact</h2>
        <p>
          For privacy questions, contact us through our GitHub repository issues.
        </p>
      </div>
    </main>
  );
}
