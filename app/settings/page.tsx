import { getServerProfile } from "@/lib/anon";
import { SettingsEditor } from "@/components/SettingsEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings — Plainread",
  description: "Customize your font, text size, letter spacing, line height, background tint, and reading tools.",
};

export default async function SettingsPage() {
  const profile = await getServerProfile();

  return (
    <main className="main-content" style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Reading Settings</h1>
        <p>
          Fine-tune every visual dimension of your reading layout. All changes take effect immediately across all documents you read.
        </p>
      </div>

      <div className="card">
        <SettingsEditor initialProfile={profile} showPreview={true} />
      </div>
    </main>
  );
}
