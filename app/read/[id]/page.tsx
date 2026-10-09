import { notFound } from "next/navigation";
import { getAnonId, getServerProfile } from "@/lib/anon";
import { store } from "@/lib/store";
import { ReaderView } from "@/components/ReaderView";

export const dynamic = "force-dynamic";

interface ReadPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ReadPageProps) {
  const { id } = await params;
  const anonId = await getAnonId();
  const doc = await store.getDocument(id, anonId);

  if (!doc) {
    return {
      title: "Document Not Found — Plainread",
    };
  }

  return {
    title: `${doc.title} — Plainread`,
    description: `Reading mode for ${doc.title} (${doc.wordCount} words)`,
  };
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { id } = await params;
  const anonId = await getAnonId();

  // Strict ownership check: Must belong to this visitor's anonymous ID
  const doc = await store.getDocument(id, anonId);
  if (!doc) {
    notFound();
  }

  const profile = await getServerProfile();
  const today = new Date().toISOString().split("T")[0];
  const usage = await store.getDailyUsageCount(anonId, today);

  return (
    <ReaderView
      document={doc}
      initialProfile={profile}
      initialQuotaUsed={usage}
    />
  );
}
