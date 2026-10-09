import { ImportForms } from "@/components/ImportForms";

export const metadata = {
  title: "Import Content — Plainread",
  description: "Paste text, enter an article URL, or upload .txt / .docx files to read with your custom reading profile.",
};

export default function ImportPage() {
  return (
    <main className="main-content">
      <div style={{ maxWidth: "760px", margin: "0 auto 1.5rem" }}>
        <h1>Read Your Own Content</h1>
        <p>
          Bring in articles, study notes, or documents. Plainread formats them into your calibrated typography and lets you request AI simplification at any time.
        </p>
      </div>

      <ImportForms />
    </main>
  );
}
