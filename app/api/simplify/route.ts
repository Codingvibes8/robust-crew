import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnonId } from "@/lib/anon";
import { store } from "@/lib/store";
import {
  SimplificationLevel,
  getLevelSystemPrompt,
  buildUserPrompt,
  ParagraphInput,
} from "@/lib/simplify-prompts";
import { DAILY_FREE_SIMPLIFY_LIMIT } from "@/lib/site-constants";

export async function POST(req: NextRequest) {
  try {
    const anonId = await getAnonId();
    const body = await req.json();
    const { docId, level } = body as { docId: string; level: SimplificationLevel };

    if (!docId || !["lighter", "simpler", "summary"].includes(level)) {
      return NextResponse.json(
        { error: "Invalid request. 'docId' and a valid 'level' (lighter, simpler, summary) are required." },
        { status: 400 }
      );
    }

    // 1. Verify document ownership
    const doc = await store.getDocument(docId, anonId);
    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // 2. Check if already cached
    const cached = await store.getSimplification(docId, level);
    if (cached) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        start(controller) {
          for (const item of cached.items) {
            controller.enqueue(encoder.encode(JSON.stringify(item) + "\n"));
          }
          controller.close();
        },
      });

      return new Response(customReadable, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // 3. Check rate limits (5 unique articles per day per anonymous ID)
    const today = new Date().toISOString().split("T")[0];
    const currentUsage = await store.getDailyUsageCount(anonId, today);
    if (currentUsage >= DAILY_FREE_SIMPLIFY_LIMIT) {
      return NextResponse.json(
        {
          error: `Daily limit reached. You can simplify up to ${DAILY_FREE_SIMPLIFY_LIMIT} articles per day for free. Please try again tomorrow.`,
        },
        { status: 429 }
      );
    }

    // 4. Check API Key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Anthropic API key is not configured. Set the ANTHROPIC_API_KEY environment variable to enable AI simplification.",
        },
        { status: 503 }
      );
    }

    // 5. Prepare input paragraphs (only body paragraphs and list items, headings remain untouched)
    const targetParagraphs: ParagraphInput[] = doc.paragraphs
      .filter((p) => p.type === "p" || p.type === "li")
      .map((p) => ({ index: p.id, text: p.text }));

    if (targetParagraphs.length === 0) {
      return NextResponse.json(
        { error: "No body paragraphs available to simplify." },
        { status: 400 }
      );
    }

    // 6. Call Anthropic with streaming
    const anthropic = new Anthropic({ apiKey });
    const systemPrompt = getLevelSystemPrompt(level);
    const userPrompt = buildUserPrompt(targetParagraphs, level);

    // Record usage
    await store.recordDailyUsage(anonId, docId, today);

    const validIndices = new Set(targetParagraphs.map((p) => p.index));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let accumulatedRaw = "";
        const completedItems: Array<{ i: number; t: string }> = [];
        const streamedIndices = new Set<number>();

        try {
          const anthropicStream = await anthropic.messages.create({
            model: "claude-haiku-5-5",
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
            stream: true,
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              accumulatedRaw += chunk.delta.text;

              // Parse complete JSON objects as they arrive
              // Matches {"i": <number>, "t": "<string>"}
              const itemRegex = /\{\s*"i"\s*:\s*(\d+)\s*,\s*"t"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
              let match: RegExpExecArray | null;

              while ((match = itemRegex.exec(accumulatedRaw)) !== null) {
                const idx = parseInt(match[1], 10);
                if (streamedIndices.has(idx)) continue;

                // Validate index
                if (level !== "summary" && !validIndices.has(idx)) {
                  continue;
                }

                try {
                  const unescapedText = JSON.parse(`"${match[2]}"`);
                  const payload = { i: idx, t: unescapedText };
                  completedItems.push(payload);
                  streamedIndices.add(idx);
                  controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
                } catch {
                  // Partial escape sequence, wait for full chunk
                }
              }
            }
          }

          // If regex missed anything due to variations in whitespace or quotes, do a final JSON.parse pass
          if (completedItems.length === 0) {
            const jsonStart = accumulatedRaw.indexOf("[");
            const jsonEnd = accumulatedRaw.lastIndexOf("]");
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const jsonSlice = accumulatedRaw.slice(jsonStart, jsonEnd + 1);
              try {
                const parsed = JSON.parse(jsonSlice) as Array<{ i: number; t: string }>;
                for (const item of parsed) {
                  if (!streamedIndices.has(item.i)) {
                    if (level === "summary" || validIndices.has(item.i)) {
                      completedItems.push(item);
                      streamedIndices.add(item.i);
                      controller.enqueue(encoder.encode(JSON.stringify(item) + "\n"));
                    }
                  }
                }
              } catch {
                // Parsing fallback failed
              }
            }
          }

          // Cache only on complete success
          if (completedItems.length > 0) {
            await store.saveSimplification(docId, level, completedItems);
          }
        } catch (streamErr: unknown) {
          console.error("AI stream error:", streamErr);
          const errorMsg = {
            error: "Failed during AI generation. Original text will be preserved.",
          };
          controller.enqueue(encoder.encode(JSON.stringify(errorMsg) + "\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    console.error("Simplification handler error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error." },
      { status: 500 }
    );
  }
}
