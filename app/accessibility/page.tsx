export const metadata = {
  title: "Accessibility Statement — Plainread",
  description: "Our commitment to WCAG 2.2 AA compliance and accessible design.",
};

export default function AccessibilityPage() {
  return (
    <main className="main-content" style={{ maxWidth: "760px" }}>
      <div className="card" style={{ padding: "2rem" }}>
        <h1>Accessibility Statement</h1>
        <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <h2>Our Commitment</h2>
        <p>
          Plainread is committed to providing a digital experience that is accessible to everyone, including people with dyslexia, low vision, and other reading or visual processing differences. We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.
        </p>

        <h2>Accessibility Features</h2>
        <ul>
          <li>
            <strong>Guided calibration:</strong> Side-by-side comparisons replace technical sliders, making it easy to find comfortable settings without reading dense documentation.
          </li>
          <li>
            <strong>Reading profile:</strong> Customizable font family (including Atkinson Hyperlegible and Lexend), text size, letter spacing, word spacing, line height, and column width.
          </li>
          <li>
            <strong>Low-glare themes:</strong> Six carefully tinted color options avoiding harsh pure white and pure black.
          </li>
          <li>
            <strong>Reading ruler:</strong> A visual tracking aid that highlights the current reading line.
          </li>
          <li>
            <strong>Text-to-speech:</strong> Built-in listen tool with word-level highlighting.
          </li>
          <li>
            <strong>Keyboard navigation:</strong> Full keyboard support with visible focus indicators (3px solid outline).
          </li>
          <li>
            <strong>Skip links:</strong> Skip to main content link on every page.
          </li>
          <li>
            <strong>Reduced motion:</strong> Respects prefers-reduced-motion media query.
          </li>
          <li>
            <strong>Touch targets:</strong> All interactive elements minimum 44x44px.
          </li>
          <li>
            <strong>ARIA:</strong> Live regions for status updates, proper labelling for form controls, aria-pressed for toggles.
          </li>
        </ul>

        <h2>Known Limitations</h2>
        <ul>
          <li>AI simplification quality depends on the source text complexity and may not fully meet readability expectations for all users.</li>
          <li>Some third-party websites imported via URL may contain content that is not fully accessible.</li>
        </ul>

        <h2>Conformance Status</h2>
        <p>
          We target conformance with WCAG 2.2 Level AA. Rather than claiming conformance outright, here is what has actually been verified:
        </p>
        <ul>
          <li>
            <strong>Automated audit (axe-core):</strong> All public pages (home, calibrate, import, settings, account, privacy, terms, accessibility statement) pass axe-core with zero violations. This audit runs in CI on every pull request.
          </li>
          <li>
            <strong>Keyboard-only pass:</strong> Verified that the skip link is the first tab stop on every page, focus is always visible (3px outline), tab order follows the visual layout, and all controls (tabs, sliders, radio groups, toggles) are reachable and operable by keyboard alone.
          </li>
          <li>
            <strong>Screen reader:</strong> Landmarks (banner, navigation, main, contentinfo), a single H1 per page with ordered headings, labelled form controls, and live regions for status updates are in place. A full manual screen reader pass (NVDA / VoiceOver) is scheduled before any formal WCAG 2.2 AA conformance claim is made.
          </li>
        </ul>
        <p>
          We do not claim third-party certification. If you use a screen reader and hit a barrier, please report it — your report will be treated as a launch-blocking defect.
        </p>

        <h2>Feedback</h2>
        <p>
          If you encounter accessibility barriers, please open an issue on our GitHub repository. We aim to respond within 5 business days and prioritize fixes based on impact.
        </p>

        <h2>Technical Specifications</h2>
        <p>
          Plainread is built with Next.js and semantic HTML. Accessibility features are tested across modern browsers (Chrome, Firefox, Safari, Edge) and with screen readers including NVDA and VoiceOver.
        </p>
      </div>
    </main>
  );
}
