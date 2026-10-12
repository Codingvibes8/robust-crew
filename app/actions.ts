"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_PROFILE, MAX_FILE_SIZE_BYTES } from "@/lib/site-constants";
import { ReadingProfileSchema, serializeProfile } from "@/lib/profile";
import { getAnonId } from "@/lib/anon";
import { store } from "@/lib/store";
import { safeFetchHtml, FetchSecurityError } from "@/lib/safe-fetch";
import {
  extractFromPlainText,
  extractFromHtml,
  extractFromDocx,
  DocumentTooLargeError,
} from "@/lib/extract";
import { logError, trackAggregateEvent } from "@/lib/monitoring";

export interface ActionState {
  error?: string;
  success?: boolean;
}

/**
 * Saves reading profile directly into the user's cookie.
 */
export async function saveProfileCookieAction(profileData: unknown): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = ReadingProfileSchema.parse(profileData);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_PROFILE, serializeProfile(validated), {
      httpOnly: false, // Accessible by client JS for dynamic updates
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Action for importing text pasted directly by the user.
 */
export async function importPasteAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const text = (formData.get("text") as string)?.trim();
  const customTitle = (formData.get("title") as string)?.trim();

  if (!text) {
    return { error: "Please paste some text into the box before continuing." };
  }

  let docId: string;
  try {
    const anonId = await getAnonId();
    const { title, paragraphs, wordCount } = extractFromPlainText(
      text,
      customTitle || "Pasted Reading"
    );

    const doc = await store.saveDocument({
      id: "doc_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16),
      ownerId: anonId,
      title: customTitle || title,
      paragraphs,
      wordCount,
      sourceType: "paste",
    });
    docId = doc.id;
    trackAggregateEvent("import_paste", { words: wordCount });
  } catch (err: unknown) {
    if (err instanceof DocumentTooLargeError) {
      return { error: err.message };
    }
    logError(err as Error, { path: "/import", method: "action:importPasteAction" });
    return { error: (err as Error).message || "An unexpected error occurred while processing the text." };
  }

  redirect(`/read/${docId}`);
}

/**
 * Action for importing content from a public web URL.
 */
export async function importUrlAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const url = (formData.get("url") as string)?.trim();

  if (!url) {
    return { error: "Please enter a web page URL." };
  }

  let docId: string;
  try {
    const anonId = await getAnonId();
    const { html, finalUrl } = await safeFetchHtml(url);
    const { title, paragraphs, wordCount } = extractFromHtml(html, finalUrl);

    const doc = await store.saveDocument({
      id: "doc_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16),
      ownerId: anonId,
      title,
      paragraphs,
      wordCount,
      sourceType: "url",
      sourceUrl: finalUrl,
    });
    docId = doc.id;
    trackAggregateEvent("import_url", { words: wordCount });
  } catch (err: unknown) {
    if (err instanceof DocumentTooLargeError || err instanceof FetchSecurityError) {
      trackAggregateEvent("import_url", { blocked: err.name });
      return { error: err.message };
    }
    logError(err as Error, { path: "/import", method: "action:importUrlAction" });
    return { error: (err as Error).message || "Failed to import web page." };
  }

  redirect(`/read/${docId}`);
}

/**
 * Action for importing files (.txt and .docx).
 */
export async function importFileAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return { error: "Please select a .txt or .docx file to upload." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "The file exceeds the 2 MB maximum upload size." };
  }

  const filename = file.name || "Uploaded Document";
  const ext = filename.split(".").pop()?.toLowerCase();

  let docId: string;
  try {
    const anonId = await getAnonId();
    let title: string;
    let paragraphs;
    let wordCount: number;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (ext === "txt") {
      const text = buffer.toString("utf-8");
      const extracted = extractFromPlainText(text, filename.replace(/\.txt$/i, ""));
      title = extracted.title;
      paragraphs = extracted.paragraphs;
      wordCount = extracted.wordCount;
    } else if (ext === "docx") {
      const extracted = await extractFromDocx(buffer, filename);
      title = extracted.title;
      paragraphs = extracted.paragraphs;
      wordCount = extracted.wordCount;
    } else {
      return { error: "Unsupported file type. Please upload a .txt or .docx document." };
    }

    const doc = await store.saveDocument({
      id: "doc_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16),
      ownerId: anonId,
      title,
      paragraphs,
      wordCount,
      sourceType: "file",
    });
    docId = doc.id;
    trackAggregateEvent("import_file", { words: wordCount });
  } catch (err: unknown) {
    if (err instanceof DocumentTooLargeError) {
      return { error: err.message };
    }
    logError(err as Error, { path: "/import", method: "action:importFileAction" });
    return { error: (err as Error).message || "Failed to process the uploaded file." };
  }

  redirect(`/read/${docId}`);
}
