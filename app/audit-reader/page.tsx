import { notFound } from "next/navigation";
import { ReaderView } from "@/components/ReaderView";
import { DEFAULT_PROFILE } from "@/lib/profile";
import type { DocumentRecord } from "@/lib/store";

/**
 * Accessibility-audit fixture for the reader screen.
 *
 * The reader is the most complex surface (version switcher, TTS controls,
 * reading ruler, settings drawer), but reaching it normally requires creating
 * a document through a server action, which automated crawlers cannot do.
 * This route renders ReaderView against a static fixture so axe / CI can
 * audit it.
 *
 * It is only available when READ_AUDIT_FIXTURES=1, so it never ships as a
 * publicly reachable page.
 */
export const dynamic = "force-dynamic";

export default async function AuditReaderPage() {
  if (process.env.READ_AUDIT_FIXTURES !== "1") {
    notFound();
  }

  const fixtureDoc: DocumentRecord = {
    id: "doc_audit_fixture",
    ownerId: "anon_audit",
    title: "Morning Walk Notes",
    paragraphs: [
      { id: 1, type: "p", text: "The calm of an early morning walk settles the mind before the day begins." },
      // Deliberately starts at h2 (not h1) to catch heading-order regressions:
      // imported documents can begin at any heading level.
      { id: 2, type: "h2", text: "Why mornings feel different" },
      { id: 3, type: "p", text: "Walking before breakfast clears the mind more effectively than any cup of coffee." },
      { id: 4, type: "h3", text: "A short note on quiet streets" },
      { id: 5, type: "li", text: "Cool air and empty streets help thoughts settle." },
    ],
    wordCount: 40,
    sourceType: "paste",
    createdAt: new Date().toISOString(),
  };

  return (
    <ReaderView document={fixtureDoc} initialProfile={DEFAULT_PROFILE} initialQuotaUsed={1} />
  );
}
