"use client";

import React, { useState, useActionState } from "react";
import {
  importPasteAction,
  importUrlAction,
  importFileAction,
  ActionState,
} from "@/app/actions";

const initialState: ActionState = {};

export function ImportForms() {
  const [activeTab, setActiveTab] = useState<"paste" | "url" | "file">("paste");

  const [pasteState, pasteFormAction, isPastePending] = useActionState(
    importPasteAction,
    initialState
  );
  const [urlState, urlFormAction, isUrlPending] = useActionState(
    importUrlAction,
    initialState
  );
  const [fileState, fileFormAction, isFilePending] = useActionState(
    importFileAction,
    initialState
  );

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      {/* Tab Switcher */}
      <div
        role="tablist"
        aria-label="Import methods"
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "2px solid var(--r-border)",
          marginBottom: "1.5rem",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "paste"}
          aria-controls="panel-paste"
          id="tab-paste"
          className={`btn ${activeTab === "paste" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("paste")}
          style={{ borderRadius: "var(--ui-radius) var(--ui-radius) 0 0" }}
        >
          Paste text
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "url"}
          aria-controls="panel-url"
          id="tab-url"
          className={`btn ${activeTab === "url" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("url")}
          style={{ borderRadius: "var(--ui-radius) var(--ui-radius) 0 0" }}
        >
          Web page URL
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "file"}
          aria-controls="panel-file"
          id="tab-file"
          className={`btn ${activeTab === "file" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("file")}
          style={{ borderRadius: "var(--ui-radius) var(--ui-radius) 0 0" }}
        >
          Upload file (.txt / .docx)
        </button>
      </div>

      {/* Method 1: Paste Text */}
      <div
        id="panel-paste"
        role="tabpanel"
        aria-labelledby="tab-paste"
        hidden={activeTab !== "paste"}
      >
        <form action={pasteFormAction} className="card">
          <h2 style={{ fontSize: "1.3rem" }}>Paste your text</h2>
          <p style={{ fontSize: "0.95rem", opacity: 0.85 }}>
            Paste any article, chapter, essay, or email to read with your custom display settings.
          </p>

          {pasteState.error && (
            <div
              role="alert"
              style={{
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                color: "#B91C1C",
                padding: "0.75rem 1rem",
                borderRadius: "var(--ui-radius)",
                marginBottom: "1.25rem",
                fontWeight: 600,
                border: "1px solid rgba(220, 38, 38, 0.2)",
              }}
            >
              {pasteState.error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="paste-title" className="form-label">
              Document title (optional)
            </label>
            <input
              id="paste-title"
              name="title"
              type="text"
              placeholder="e.g., Biology Chapter 4"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="paste-text" className="form-label">
              Reading content *
            </label>
            <span className="form-help">Maximum 6,000 words per reading session</span>
            <textarea
              id="paste-text"
              name="text"
              required
              rows={8}
              placeholder="Paste article or text paragraphs here..."
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={isPastePending}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {isPastePending ? "Processing text..." : "Start reading"}
          </button>
        </form>
      </div>

      {/* Method 2: Web Page URL */}
      <div
        id="panel-url"
        role="tabpanel"
        aria-labelledby="tab-url"
        hidden={activeTab !== "url"}
      >
        <form action={urlFormAction} className="card">
          <h2 style={{ fontSize: "1.3rem" }}>Import from the web</h2>
          <p style={{ fontSize: "0.95rem", opacity: 0.85 }}>
            Enter a public article URL. Plainread extracts the main text, removes distracting sidebars and ads, and applies your reading layout.
          </p>

          {urlState.error && (
            <div
              role="alert"
              style={{
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                color: "#B91C1C",
                padding: "0.75rem 1rem",
                borderRadius: "var(--ui-radius)",
                marginBottom: "1.25rem",
                fontWeight: 600,
                border: "1px solid rgba(220, 38, 38, 0.2)",
              }}
            >
              {urlState.error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="import-url" className="form-label">
              Web page address *
            </label>
            <span className="form-help">Must start with http:// or https://</span>
            <input
              id="import-url"
              name="url"
              type="url"
              required
              placeholder="https://example.com/news/article-name"
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={isUrlPending}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {isUrlPending ? "Fetching and cleaning article..." : "Import article"}
          </button>
        </form>
      </div>

      {/* Method 3: File Upload */}
      <div
        id="panel-file"
        role="tabpanel"
        aria-labelledby="tab-file"
        hidden={activeTab !== "file"}
      >
        <form action={fileFormAction} className="card">
          <h2 style={{ fontSize: "1.3rem" }}>Upload document</h2>
          <p style={{ fontSize: "0.95rem", opacity: 0.85 }}>
            Upload a plain text (.txt) file or Microsoft Word (.docx) document (up to 2 MB and 6,000 words).
          </p>

          {fileState.error && (
            <div
              role="alert"
              style={{
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                color: "#B91C1C",
                padding: "0.75rem 1rem",
                borderRadius: "var(--ui-radius)",
                marginBottom: "1.25rem",
                fontWeight: 600,
                border: "1px solid rgba(220, 38, 38, 0.2)",
              }}
            >
              {fileState.error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="file-input" className="form-label">
              Select document (.txt or .docx) *
            </label>
            <input
              id="file-input"
              name="file"
              type="file"
              accept=".txt,.docx"
              required
              className="form-control"
              style={{ padding: "0.45rem" }}
            />
          </div>

          <button
            type="submit"
            disabled={isFilePending}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {isFilePending ? "Extracting document..." : "Upload and read"}
          </button>
        </form>
      </div>
    </div>
  );
}
