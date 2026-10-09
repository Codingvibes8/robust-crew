import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getServerProfile } from "@/lib/anon";
import { profileToCssVars } from "@/lib/profile-to-css";
import { APP_NAME, APP_TAGLINE, MEDICAL_DISCLAIMER } from "@/lib/site-constants";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    "A reading aid for people with dyslexia. Guided calibration, support for your own articles, and controllable AI simplification.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getServerProfile();
  const cssVars = profileToCssVars(profile);

  return (
    <html lang="en" style={cssVars as React.CSSProperties}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <header className="site-header" role="banner">
          <Link href="/" className="site-brand" aria-label="Plainread Home">
            <span>{APP_NAME}</span>
            <span className="site-brand-badge">Reading Aid</span>
          </Link>

          <nav className="site-nav" aria-label="Main Navigation">
            <Link href="/calibrate">Calibrate</Link>
            <Link href="/import">Import text</Link>
            <Link href="/settings">Settings</Link>
            <Link href="/account">Account</Link>
          </nav>
        </header>

        <div id="main-content" tabIndex={-1}>
          {children}
        </div>

        <footer className="site-footer" role="contentinfo">
          <div className="site-footer-inner">
            <p>
              <strong>Notice:</strong> {MEDICAL_DISCLAIMER}
            </p>
            <p>
              <strong>Privacy note:</strong> When you request AI simplification, the article text is processed by Anthropic AI strictly to generate your chosen reading level. No health, diagnostic, or reading habit data is ever collected or stored.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
