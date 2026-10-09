import Link from "next/link";
import { getAnonId } from "@/lib/anon";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account — Plainread",
  description: "User accounts and syncing across devices are coming soon.",
};

export default async function AccountPage() {
  const anonId = await getAnonId();

  return (
    <main className="main-content" style={{ maxWidth: "680px" }}>
      <div className="card" style={{ padding: "2.5rem 2rem", textAlign: "left" }}>
        <span
          className="site-brand-badge"
          style={{ marginBottom: "1rem", display: "inline-block" }}
        >
          Coming Soon
        </span>

        <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>
          User Accounts & Cross-Device Sync
        </h1>

        <p style={{ lineHeight: 1.6, marginBottom: "1.25rem" }}>
          Plainread currently works seamlessly without any registration. Your reading profile and reading sessions are saved directly in your browser.
        </p>

        <p style={{ lineHeight: 1.6, marginBottom: "1.5rem" }}>
          In an upcoming update, you will be able to create an optional account to sync your calibrated reading profile and saved articles across your phone, tablet, and computer.
        </p>

        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.03)",
            padding: "1rem",
            borderRadius: "var(--ui-radius)",
            marginBottom: "2rem",
            fontSize: "0.85rem",
          }}
        >
          <strong>Your anonymous guest session ID:</strong>
          <div style={{ fontFamily: "monospace", marginTop: "0.25rem", wordBreak: "break-all" }}>
            {anonId}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/import" className="btn btn-primary">
            Import new text to read
          </Link>
          <Link href="/calibrate" className="btn btn-secondary">
            Tune reading profile
          </Link>
        </div>
      </div>
    </main>
  );
}
