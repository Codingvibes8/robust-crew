import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";
import mammoth from "mammoth";
import { DocParagraph } from "./store";
import { MAX_DOC_WORDS } from "./site-constants";

export class DocumentTooLargeError extends Error {
  public wordCount: number;
  constructor(wordCount: number) {
    super(
      `This document has ${wordCount.toLocaleString()} words, which exceeds the 6,000-word limit. Plainread works best with articles and chapters up to 6,000 words. Please shorten or divide the text.`
    );
    this.name = "DocumentTooLargeError";
    this.wordCount = wordCount;
  }
}

export function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

export function validateWordCount(paragraphs: DocParagraph[]): number {
  const totalWords = paragraphs.reduce((acc, p) => acc + countWords(p.text), 0);
  if (totalWords > MAX_DOC_WORDS) {
    throw new DocumentTooLargeError(totalWords);
  }
  return totalWords;
}

/**
 * Extracts structured paragraphs from raw plain text.
 */
export function extractFromPlainText(
  rawText: string,
  defaultTitle = "Untitled Document"
): { title: string; paragraphs: DocParagraph[]; wordCount: number } {
  const lines = rawText.split(/\r?\n/);
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join(" "));
        currentBlock = [];
      }
    } else {
      currentBlock.push(trimmed);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join(" "));
  }

  if (blocks.length === 0) {
    throw new Error("The provided text is empty. Please paste some text to read.");
  }

  let title = defaultTitle;
  // If the first block is short (under 120 chars) and there are more blocks, use it as title
  let startIndex = 0;
  if (blocks.length > 1 && blocks[0].length < 120) {
    title = blocks[0];
    startIndex = 1;
  }

  const paragraphs: DocParagraph[] = [];
  let pId = 1;
  for (let i = startIndex; i < blocks.length; i++) {
    const text = blocks[i].trim();
    if (text) {
      paragraphs.push({
        id: pId++,
        type: "p",
        text,
      });
    }
  }

  if (paragraphs.length === 0) {
    paragraphs.push({
      id: 1,
      type: "p",
      text: title,
    });
  }

  const wordCount = validateWordCount(paragraphs);
  return { title, paragraphs, wordCount };
}

/**
 * Extracts structured paragraphs from HTML using linkedom and Readability.
 */
export function extractFromHtml(
  html: string,
  sourceUrl?: string
): { title: string; paragraphs: DocParagraph[]; wordCount: number } {
  const { document } = parseHTML(html);
  if (sourceUrl && document.head) {
    try {
      const baseEl = document.createElement("base");
      baseEl.setAttribute("href", sourceUrl);
      document.head.appendChild(baseEl);
    } catch {
      // ignore
    }
  }

  // Linkedom needs baseURI or URL for Readability
  const reader = new Readability(document, {
    charThreshold: 20,
  });

  const article = reader.parse();
  const rawTitle = article?.title?.trim() || document.querySelector("title")?.textContent?.trim() || "Web Article";
  const contentHtml = article?.content || html;

  // Parse readability content into structured elements
  const { document: contentDoc } = parseHTML(`<div>${contentHtml}</div>`);
  const root = contentDoc.querySelector("div") || contentDoc.body;

  const elements = root.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li");
  const paragraphs: DocParagraph[] = [];
  let pId = 1;

  for (const el of Array.from(elements)) {
    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim().replace(/\s+/g, " ") || "";
    if (!text || text.length < 2) continue;

    let type: DocParagraph["type"] = "p";
    if (tagName === "h1") type = "h1";
    else if (tagName === "h2") type = "h2";
    else if (tagName === "h3" || tagName === "h4" || tagName === "h5" || tagName === "h6") type = "h3";
    else if (tagName === "li") type = "li";

    paragraphs.push({
      id: pId++,
      type,
      text,
    });
  }

  // Fallback if readability or query returned few elements
  if (paragraphs.length === 0) {
    const textContent = article?.textContent || document.body?.textContent || "";
    return extractFromPlainText(textContent, rawTitle);
  }

  const wordCount = validateWordCount(paragraphs);
  return {
    title: rawTitle,
    paragraphs,
    wordCount,
  };
}

/**
 * Extracts structured paragraphs from a DOCX buffer using mammoth.
 */
export async function extractFromDocx(
  buffer: Buffer,
  filename = "Imported Document"
): Promise<{ title: string; paragraphs: DocParagraph[]; wordCount: number }> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;
  const title = filename.replace(/\.docx$/i, "").replace(/[-_]/g, " ").trim();

  if (!html || !html.trim()) {
    throw new Error("Could not extract any readable content from this Word document.");
  }

  const { document } = parseHTML(`<div>${html}</div>`);
  const elements = document.querySelectorAll("h1, h2, h3, h4, p, li");
  const paragraphs: DocParagraph[] = [];
  let pId = 1;

  for (const el of Array.from(elements)) {
    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim().replace(/\s+/g, " ") || "";
    if (!text) continue;

    let type: DocParagraph["type"] = "p";
    if (tagName === "h1") type = "h1";
    else if (tagName === "h2") type = "h2";
    else if (tagName === "h3" || tagName === "h4") type = "h3";
    else if (tagName === "li") type = "li";

    paragraphs.push({
      id: pId++,
      type,
      text,
    });
  }

  if (paragraphs.length === 0) {
    const rawText = await mammoth.extractRawText({ buffer });
    return extractFromPlainText(rawText.value, title);
  }

  const wordCount = validateWordCount(paragraphs);
  return {
    title,
    paragraphs,
    wordCount,
  };
}
