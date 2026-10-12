"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { DocumentRecord, DocParagraph } from "@/lib/store";
import { ReadingProfile } from "@/lib/profile";
import { SettingsEditor } from "./SettingsEditor";
import { SimplificationLevel } from "@/lib/simplify-prompts";
import { DAILY_FREE_SIMPLIFY_LIMIT } from "@/lib/site-constants";

interface ReaderViewProps {
  document: DocumentRecord;
  initialProfile: ReadingProfile;
  initialQuotaUsed: number;
}

export function ReaderView({
  document: doc,
  initialProfile,
  initialQuotaUsed,
}: ReaderViewProps) {
  const [profile, setProfile] = useState<ReadingProfile>(initialProfile);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Version management: 'original' | 'lighter' | 'simpler' | 'summary'
  const [currentVersion, setCurrentVersion] = useState<"original" | SimplificationLevel>("original");
  const [simplifiedParagraphs, setSimplifiedParagraphs] = useState<
    Record<SimplificationLevel, Record<number, string>>
  >({
    lighter: {},
    simpler: {},
    summary: {},
  });
  const [isStreamingAi, setIsStreamingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [quotaUsed, setQuotaUsed] = useState(initialQuotaUsed);

  // Per-paragraph toggle for showing original vs simplified
  const [perParagraphOriginal, setPerParagraphOriginal] = useState<Record<number, boolean>>({});

  // Reading Ruler State
  const [rulerActive, setRulerActive] = useState(profile.ruler);
  const [prevProfileRuler, setPrevProfileRuler] = useState(profile.ruler);
  if (prevProfileRuler !== profile.ruler) {
    setPrevProfileRuler(profile.ruler);
    setRulerActive(profile.ruler);
  }
  const [rulerY, setRulerY] = useState(300);

  // Speech (TTS) State
  const [speechState, setSpeechState] = useState<"idle" | "playing" | "paused">("idle");
  const [activeSpeechParaIndex, setActiveSpeechParaIndex] = useState<number | null>(null);
  const [speechWordRange, setSpeechWordRange] = useState<{ start: number; length: number } | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakParagraphRef = useRef<(index: number) => void>(() => {});

  // Initialize SpeechSynthesis on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Pointer tracking for Reading Ruler on desktop
  useEffect(() => {
    if (!rulerActive) return;

    const handlePointerMove = (e: MouseEvent) => {
      setRulerY(e.clientY);
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
    };
  }, [rulerActive]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Request AI simplification with streaming NDJSON
  const fetchSimplification = async (level: SimplificationLevel) => {
    setAiError(null);
    setIsStreamingAi(true);

    try {
      const res = await fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: doc.id, level }),
      });

      if (!res.ok) {
        let errMessage = "AI simplification is currently unavailable.";
        try {
          const json = await res.json();
          if (json.error) errMessage = json.error;
        } catch {
          // fallback message
        }
        setAiError(errMessage);
        setIsStreamingAi(false);
        return;
      }

      // Decrement remaining quota counter
      setQuotaUsed((prev) => Math.min(DAILY_FREE_SIMPLIFY_LIMIT, prev + 1));

      if (!res.body) {
        setAiError("Received empty response from server.");
        setIsStreamingAi(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const item = JSON.parse(trimmed);
            if (item.error) {
              setAiError(item.error);
              continue;
            }
            if (typeof item.i === "number" && typeof item.t === "string") {
              setSimplifiedParagraphs((prev) => ({
                ...prev,
                [level]: {
                  ...prev[level],
                  [item.i]: item.t,
                },
              }));
            }
          } catch {
            // Partial JSON line, ignore
          }
        }
      }
    } catch (err: unknown) {
      setAiError((err as Error).message || "An error occurred while streaming simplification.");
    } finally {
      setIsStreamingAi(false);
    }
  };

  const handleSelectVersion = (version: "original" | SimplificationLevel) => {
    setCurrentVersion(version);
    setAiError(null);

    if (version !== "original") {
      const currentItems = simplifiedParagraphs[version];
      // If we don't have simplified items yet, trigger streaming fetch
      if (!currentItems || Object.keys(currentItems).length === 0) {
        fetchSimplification(version);
      }
    }
  };

  // Text to Speech Controls
  const stopSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setSpeechState("idle");
    setActiveSpeechParaIndex(null);
    setSpeechWordRange(null);
  }, []);

  const speakParagraph = useCallback(
    (index: number) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();

      const para = doc.paragraphs[index];
      if (!para) {
        stopSpeech();
        return;
      }

      // Check if simplified or original
      let textToRead = para.text;
      if (currentVersion !== "original" && currentVersion !== "summary") {
        if (!perParagraphOriginal[para.id] && simplifiedParagraphs[currentVersion]?.[para.id]) {
          textToRead = simplifiedParagraphs[currentVersion][para.id];
        }
      }

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = profile.ttsRate;
      utteranceRef.current = utterance;

      setActiveSpeechParaIndex(index);
      setSpeechWordRange(null);
      setSpeechState("playing");

      utterance.onboundary = (e) => {
        if (e.name === "word") {
          setSpeechWordRange({
            start: e.charIndex,
            length: e.charLength || 5,
          });
        }
      };

      utterance.onend = () => {
        // Automatically progress to next paragraph
        if (index + 1 < doc.paragraphs.length) {
          speakParagraphRef.current(index + 1);
        } else {
          stopSpeech();
        }
      };

      utterance.onerror = () => {
        stopSpeech();
      };

      synthRef.current.speak(utterance);
    },
    [doc.paragraphs, currentVersion, perParagraphOriginal, simplifiedParagraphs, profile.ttsRate, stopSpeech]
  );

  useEffect(() => {
    speakParagraphRef.current = speakParagraph;
  }, [speakParagraph]);

  const handlePlaySpeech = () => {
    if (speechState === "paused") {
      if (synthRef.current) {
        synthRef.current.resume();
        setSpeechState("playing");
      }
    } else {
      speakParagraph(0);
    }
  };

  const handlePauseSpeech = () => {
    if (synthRef.current && speechState === "playing") {
      synthRef.current.pause();
      setSpeechState("paused");
    }
  };

  const remainingQuota = Math.max(0, DAILY_FREE_SIMPLIFY_LIMIT - quotaUsed);

  // Imported documents may start at any heading level (e.g. an article whose
  // first heading is an <h2>). Render headings relative to the lowest level
  // actually present so the outline never skips a level after the title <h1>.
  const headingLevel = (t: DocParagraph["type"]): number =>
    t === "h1" ? 1 : t === "h2" ? 2 : 3;
  const minHeadingLevel = doc.paragraphs.reduce(
    (min, p) => (["h1", "h2", "h3"].includes(p.type) ? Math.min(min, headingLevel(p.type)) : min),
    4
  );
  const renderedHeadingLevel = (t: DocParagraph["type"]): number =>
    Math.min(6, Math.max(2, 2 + (headingLevel(t) - minHeadingLevel)));

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Reading Ruler Overlay */}
      {rulerActive && (
        <div className="reading-ruler-overlay" aria-hidden="true">
          <div
            className="reading-ruler-curtain-top"
            style={{ top: 0, height: `${Math.max(0, rulerY - 29)}px` }}
          />
          <div
            className="reading-ruler-band"
            style={{ top: `${Math.max(0, rulerY - 29)}px` }}
          />
          <div
            className="reading-ruler-curtain-bottom"
            style={{ top: `${rulerY + 29}px`, bottom: 0 }}
          />
        </div>
      )}

      {/* Reader Control Toolbar */}
      <nav
        aria-label="Reader Tools"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "var(--r-surface)",
          borderBottom: "1px solid var(--r-border)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/import" className="btn btn-ghost" style={{ padding: "0.5rem 0.75rem" }}>
            ← Import new
          </Link>

          {/* Version Switcher */}
          <div
            role="group"
            aria-label="Article text level"
            style={{
              display: "inline-flex",
              border: "1px solid var(--r-border)",
              borderRadius: "var(--ui-radius)",
              overflow: "hidden",
            }}
          >
            {(["original", "lighter", "simpler", "summary"] as const).map((ver) => {
              const isSelected = currentVersion === ver;
              const labels: Record<string, string> = {
                original: "Original",
                lighter: "Lighter",
                simpler: "Simpler",
                summary: "Summary",
              };
              return (
                <button
                  key={ver}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectVersion(ver)}
                  className="btn"
                  style={{
                    backgroundColor: isSelected ? "var(--r-accent)" : "transparent",
                    color: isSelected ? "#FFFFFF" : "var(--r-ink)",
                    borderRadius: 0,
                    padding: "0.45rem 0.85rem",
                    fontSize: "0.9rem",
                    border: "none",
                  }}
                >
                  {labels[ver]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar Tools: Audio Player, Ruler Toggle, Display Settings */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Audio Controls */}
          <div style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center" }}>
            {speechState === "idle" && (
              <button
                type="button"
                onClick={handlePlaySpeech}
                className="btn btn-secondary"
                aria-label="Listen to article"
                title="Listen using voice reader"
              >
                Listen
              </button>
            )}
            {speechState === "playing" && (
              <>
                <button
                  type="button"
                  onClick={handlePauseSpeech}
                  className="btn btn-secondary"
                  aria-label="Pause listening"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={stopSpeech}
                  className="btn btn-ghost"
                  aria-label="Stop listening"
                >
                  Stop
                </button>
              </>
            )}
            {speechState === "paused" && (
              <>
                <button
                  type="button"
                  onClick={handlePlaySpeech}
                  className="btn btn-primary"
                  aria-label="Resume listening"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={stopSpeech}
                  className="btn btn-ghost"
                  aria-label="Stop listening"
                >
                  Stop
                </button>
              </>
            )}
          </div>

          {/* Reading Ruler Toggle Button */}
          <button
            type="button"
            aria-pressed={rulerActive}
            onClick={() => setRulerActive(!rulerActive)}
            className={`btn ${rulerActive ? "btn-primary" : "btn-secondary"}`}
            title="Toggle reading line guide"
          >
            Ruler {rulerActive ? "On" : "Off"}
          </button>

          {/* Display Settings Drawer Toggle */}
          <button
            type="button"
            aria-expanded={isSettingsOpen}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="btn btn-secondary"
          >
            Display {isSettingsOpen ? "✕" : "⚙"}
          </button>
        </div>
      </nav>

      {/* Slide-over Settings Panel */}
      {isSettingsOpen && (
        <aside
          role="dialog"
          aria-label="Display Settings Drawer"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            maxWidth: "420px",
            backgroundColor: "var(--r-surface)",
            boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.15)",
            zIndex: 9000,
            padding: "1.5rem",
            overflowY: "auto",
            borderLeft: "2px solid var(--r-border)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Reading Display</h2>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="btn btn-ghost"
              aria-label="Close settings"
            >
              Close ✕
            </button>
          </div>
          <SettingsEditor
            initialProfile={profile}
            showPreview={false}
            compact={true}
            onSave={(p) => setProfile(p)}
          />
        </aside>
      )}

      {/* Main Reader Content Area */}
      <main className="main-content" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        <article className="reader-container">
          {/* Article Header */}
          <header style={{ marginBottom: "2.5rem", borderBottom: "1px solid var(--r-border)", paddingBottom: "1.5rem" }}>
            <h1
              style={{
                fontFamily: "var(--r-font)",
                fontSize: "2.2rem",
                lineHeight: 1.25,
                color: "var(--r-ink)",
                marginBottom: "0.75rem",
              }}
            >
              {doc.title}
            </h1>
            <div style={{ display: "flex", gap: "1.5rem", opacity: 0.8, fontSize: "0.9rem", flexWrap: "wrap" }}>
              <span>{doc.wordCount.toLocaleString()} words</span>
              {doc.sourceUrl && (
                <a
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  Original Source ↗
                </a>
              )}
              <span>Daily simplifications remaining: {remainingQuota} of {DAILY_FREE_SIMPLIFY_LIMIT}</span>
            </div>
          </header>

          {/* AI Banner Notice if simplified version active */}
          {currentVersion !== "original" && (
            <div className="ai-notice-banner" role="status">
              <div>
                <strong>Notice:</strong> Simplified by AI ({currentVersion}). It can miss detail, so check the original for anything important.
              </div>
              {isStreamingAi && (
                <span style={{ fontWeight: 600, color: "var(--r-accent)", fontSize: "0.85rem" }}>
                  Generating simplification...
                </span>
              )}
            </div>
          )}

          {/* AI Error Alert */}
          {aiError && (
            <div
              role="alert"
              style={{
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                color: "#B91C1C",
                padding: "1rem",
                borderRadius: "var(--ui-radius)",
                marginBottom: "1.5rem",
                fontWeight: 600,
                border: "1px solid rgba(220, 38, 38, 0.2)",
              }}
            >
              {aiError}
            </div>
          )}

          {/* Summary Mode Display */}
          {currentVersion === "summary" ? (
            <div className="reader-article">
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.25rem" }}>Key Takeaways</h2>
              {isStreamingAi && Object.keys(simplifiedParagraphs.summary).length === 0 ? (
                <p style={{ opacity: 0.7 }}>Distilling key points...</p>
              ) : (
                <ol style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {Object.entries(simplifiedParagraphs.summary).map(([key, point]) => (
                    <li key={key} style={{ fontSize: "var(--r-size)", lineHeight: "var(--r-line-height)" }}>
                      {point}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : (
            /* Standard & Simplified Article Paragraphs */
            <div className="reader-article">
              {doc.paragraphs.map((para, idx) => {
                const isHeading = ["h1", "h2", "h3"].includes(para.type);
                const isSimplifiedActive = currentVersion !== "original" && !isHeading;
                const simplifiedText = isSimplifiedActive
                  ? simplifiedParagraphs[currentVersion]?.[para.id]
                  : undefined;
                const isShowingOriginal = isSimplifiedActive && (perParagraphOriginal[para.id] || !simplifiedText);
                const displayText = isShowingOriginal || !simplifiedText ? para.text : simplifiedText;

                const isCurrentSpeechPara = activeSpeechParaIndex === idx;

                // Word highlighting render helper
                const renderHighlightedText = () => {
                  if (!isCurrentSpeechPara || !speechWordRange) {
                    return displayText;
                  }
                  const { start, length } = speechWordRange;
                  if (start < 0 || start >= displayText.length) return displayText;

                  const before = displayText.slice(0, start);
                  const word = displayText.slice(start, start + length);
                  const after = displayText.slice(start + length);

                  return (
                    <>
                      {before}
                      <mark className="speech-highlight-word">{word}</mark>
                      {after}
                    </>
                  );
                };

                const paragraphClasses = isCurrentSpeechPara ? "speech-highlight-para" : "";

                if (para.type === "h1" || para.type === "h2" || para.type === "h3") {
                  const HeadingTag = `h${renderedHeadingLevel(para.type)}` as "h2" | "h3" | "h4";
                  return (
                    <HeadingTag key={para.id} className={paragraphClasses}>
                      {displayText}
                    </HeadingTag>
                  );
                }

                return (
                  <div
                    key={para.id}
                    style={{ position: "relative", marginBottom: "1.4em" }}
                    className={paragraphClasses}
                  >
                    <p style={{ margin: 0 }}>{renderHighlightedText()}</p>

                    {/* Per-paragraph toggle for AI versions */}
                    {isSimplifiedActive && simplifiedText && (
                      <div style={{ marginTop: "0.4rem" }}>
                        <button
                          type="button"
                          onClick={() =>
                            setPerParagraphOriginal((prev) => ({
                              ...prev,
                              [para.id]: !prev[para.id],
                            }))
                          }
                          className="btn btn-ghost"
                          style={{
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.8rem",
                            minHeight: "36px",
                            opacity: 0.85,
                          }}
                        >
                          {isShowingOriginal ? "Show simplified" : "Show original"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
