import Link from "next/link";
import { MEDICAL_DISCLAIMER } from "@/lib/site-constants";

export default function HomePage() {
  return (
    <main className="main-content">
      {/* Hero Section */}
      <section style={{ maxWidth: "780px", margin: "2rem auto 3.5rem", textAlign: "left" }}>
        <div style={{ display: "inline-block", marginBottom: "0.75rem" }}>
          <span className="site-brand-badge" style={{ fontSize: "0.85rem", padding: "0.3rem 0.75rem" }}>
            Reading Aid for Dyslexia
          </span>
        </div>

        <h1
          style={{
            fontSize: "2.6rem",
            lineHeight: 1.2,
            marginBottom: "1.25rem",
            color: "var(--r-ink)",
          }}
        >
          Read any text with comfort and control.
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            lineHeight: 1.6,
            marginBottom: "2rem",
            opacity: 0.9,
          }}
        >
          Plainread helps you discover your ideal typography settings in two minutes, apply them instantly to any article or document, and simplify dense passages on demand.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
          <Link
            href="/calibrate"
            className="btn btn-primary"
            style={{ fontSize: "1.05rem", padding: "0.75rem 1.75rem" }}
          >
            Start 2-Minute Calibration
          </Link>
          <Link
            href="/import"
            className="btn btn-secondary"
            style={{ fontSize: "1.05rem", padding: "0.75rem 1.75rem" }}
          >
            Import an Article
          </Link>
        </div>

        <div
          style={{
            backgroundColor: "rgba(19, 111, 99, 0.08)",
            borderLeft: "4px solid var(--r-accent)",
            padding: "1rem 1.25rem",
            borderRadius: "0 var(--ui-radius) var(--ui-radius) 0",
            fontSize: "0.95rem",
            lineHeight: 1.5,
          }}
        >
          <strong>Notice:</strong> {MEDICAL_DISCLAIMER}
        </div>
      </section>

      {/* The 3 Core Differentiators */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          gap: "1.5rem",
          maxWidth: "1050px",
          margin: "0 auto 3.5rem",
        }}
      >
        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem", color: "var(--r-accent)" }}>
            01
          </div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Guided Calibration</h2>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.6, opacity: 0.85, margin: 0 }}>
            Never face a wall of confusing sliders. Side-by-side reading comparisons help you choose the font, spacing, and tint that let your eyes relax.
          </p>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem", color: "var(--r-accent)" }}>
            02
          </div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Works on Your Content</h2>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.6, opacity: 0.85, margin: 0 }}>
            Paste any text, import articles directly from web addresses, or upload .txt and Word .docx documents. Clutter is stripped away automatically.
          </p>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem", color: "var(--r-accent)" }}>
            03
          </div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Controllable AI Simplification</h2>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.6, opacity: 0.85, margin: 0 }}>
            Choose Lighter phrasing, Simpler vocabulary, or a Key Takeaway Summary. The original text is always one tap away, and AI rewriting is always clearly labelled.
          </p>
        </div>
      </section>

      {/* Built-in Reader Tools */}
      <section
        className="card"
        style={{
          maxWidth: "1050px",
          margin: "0 auto 2rem",
          padding: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
          Built-in Focus Tools
        </h2>
        <div
          style={{
            display: "grid",
            // min() keeps the minimum column from exceeding the container on
            // narrow screens, which would otherwise force horizontal scroll.
            gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
            gap: "1.5rem",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.1rem" }}>Reading Ruler</h3>
            <p style={{ fontSize: "0.9rem", opacity: 0.85 }}>
              A soft horizontal guide follows your pointer (or stays centered on touchscreens) while gently dimming the rest of the page to prevent losing your place.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem" }}>Listen (Text-to-Speech)</h3>
            <p style={{ fontSize: "0.9rem", opacity: 0.85 }}>
              Follow along with real-time word highlighting. Adjust speech speed to match your comfortable listening pace.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem" }}>Low-Glare Color Themes</h3>
            <p style={{ fontSize: "0.9rem", opacity: 0.85 }}>
              Six calibrated tints (Paper, Mist, Mint, Peach, Plain, and Dusk) avoid harsh pure whites and pure blacks that trigger visual stress.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
