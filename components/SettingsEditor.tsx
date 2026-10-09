"use client";

import React, { useState, useRef } from "react";
import { ReadingProfile, DEFAULT_PROFILE, FONT_OPTIONS, FontId } from "@/lib/profile";
import { THEMES, ThemeId } from "@/lib/site-constants";
import { applyProfileToDocument, profileToCssVars } from "@/lib/profile-to-css";
import { saveProfileCookieAction } from "@/app/actions";

interface SettingsEditorProps {
  initialProfile: ReadingProfile;
  showPreview?: boolean;
  onSave?: (profile: ReadingProfile) => void;
  compact?: boolean;
}

export function SettingsEditor({
  initialProfile,
  showPreview = true,
  onSave,
  compact = false,
}: SettingsEditorProps) {
  const [profile, setProfile] = useState<ReadingProfile>(initialProfile);
  const [savedStatus, setSavedStatus] = useState<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [prevInitial, setPrevInitial] = useState<ReadingProfile>(initialProfile);

  // Synchronize initialProfile if it changes externally
  if (prevInitial !== initialProfile) {
    setPrevInitial(initialProfile);
    setProfile(initialProfile);
  }

  // Live apply to document & debounce persist to cookie
  const updateProfile = (patch: Partial<ReadingProfile>) => {
    const updated: ReadingProfile = { ...profile, ...patch };
    setProfile(updated);
    applyProfileToDocument(updated);

    if (onSave) {
      onSave(updated);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSavedStatus("Saving changes...");
    debounceTimerRef.current = setTimeout(async () => {
      await saveProfileCookieAction(updated);
      setSavedStatus("Saved to your browser");
      setTimeout(() => setSavedStatus(""), 2000);
    }, 400);
  };

  const handleReset = () => {
    updateProfile(DEFAULT_PROFILE);
    setSavedStatus("Reset to default settings");
    setTimeout(() => setSavedStatus(""), 2000);
  };

  const previewVars = profileToCssVars(profile);

  return (
    <div className={`settings-editor ${compact ? "settings-compact" : ""}`}>
      {/* Live status announcement for screen readers */}
      <div aria-live="polite" className="sr-only" style={{ position: "absolute", left: "-9999px" }}>
        {savedStatus}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: compact ? "1.2rem" : "1.4rem", margin: 0 }}>Reading Display Settings</h2>
          <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
            Changes apply instantly to your reading environment.
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-secondary"
          style={{ minHeight: "44px" }}
        >
          Reset to defaults
        </button>
      </div>

      {/* Font Family Selection */}
      <div className="form-group">
        <label htmlFor="setting-font" className="form-label">
          Font style
        </label>
        <span className="form-help">Selected specifically for clean distinction and ease of reading</span>
        <select
          id="setting-font"
          className="form-control"
          value={profile.font}
          onChange={(e) => updateProfile({ font: e.target.value as FontId })}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sliders Grid */}
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {/* Text Size Slider */}
        <div className="slider-container">
          <div className="slider-header">
            <label htmlFor="setting-size" className="form-label">
              Text size
            </label>
            <span className="slider-value">{profile.size}px</span>
          </div>
          <input
            id="setting-size"
            type="range"
            min={16}
            max={30}
            step={1}
            value={profile.size}
            onChange={(e) => updateProfile({ size: Number(e.target.value) })}
            aria-valuemin={16}
            aria-valuemax={30}
            aria-valuenow={profile.size}
            aria-valuetext={`${profile.size} pixels`}
          />
        </div>

        {/* Line Height Slider */}
        <div className="slider-container">
          <div className="slider-header">
            <label htmlFor="setting-line-height" className="form-label">
              Line spacing
            </label>
            <span className="slider-value">{profile.lineHeight.toFixed(1)}</span>
          </div>
          <input
            id="setting-line-height"
            type="range"
            min={1.3}
            max={2.4}
            step={0.1}
            value={profile.lineHeight}
            onChange={(e) => updateProfile({ lineHeight: Number(e.target.value) })}
            aria-valuemin={1.3}
            aria-valuemax={2.4}
            aria-valuenow={profile.lineHeight}
            aria-valuetext={`${profile.lineHeight.toFixed(1)} line height`}
          />
        </div>

        {/* Letter Spacing Slider */}
        <div className="slider-container">
          <div className="slider-header">
            <label htmlFor="setting-letter-spacing" className="form-label">
              Letter spacing
            </label>
            <span className="slider-value">{profile.letterSpacing.toFixed(2)}em</span>
          </div>
          <input
            id="setting-letter-spacing"
            type="range"
            min={0}
            max={0.2}
            step={0.01}
            value={profile.letterSpacing}
            onChange={(e) => updateProfile({ letterSpacing: Number(e.target.value) })}
            aria-valuemin={0}
            aria-valuemax={0.2}
            aria-valuenow={profile.letterSpacing}
            aria-valuetext={`${profile.letterSpacing.toFixed(2)} em`}
          />
        </div>

        {/* Word Spacing Slider */}
        <div className="slider-container">
          <div className="slider-header">
            <label htmlFor="setting-word-spacing" className="form-label">
              Word spacing
            </label>
            <span className="slider-value">{profile.wordSpacing.toFixed(2)}em</span>
          </div>
          <input
            id="setting-word-spacing"
            type="range"
            min={0}
            max={0.6}
            step={0.02}
            value={profile.wordSpacing}
            onChange={(e) => updateProfile({ wordSpacing: Number(e.target.value) })}
            aria-valuemin={0}
            aria-valuemax={0.6}
            aria-valuenow={profile.wordSpacing}
            aria-valuetext={`${profile.wordSpacing.toFixed(2)} em`}
          />
        </div>

        {/* Reading Column Width Slider */}
        <div className="slider-container">
          <div className="slider-header">
            <label htmlFor="setting-width" className="form-label">
              Column width
            </label>
            <span className="slider-value">{profile.width}ch</span>
          </div>
          <input
            id="setting-width"
            type="range"
            min={40}
            max={90}
            step={2}
            value={profile.width}
            onChange={(e) => updateProfile({ width: Number(e.target.value) })}
            aria-valuemin={40}
            aria-valuemax={90}
            aria-valuenow={profile.width}
            aria-valuetext={`${profile.width} characters per line`}
          />
        </div>

        {/* Text to Speech Speed Slider */}
        <div className="slider-container">
          <div className="slider-header">
            <label htmlFor="setting-tts-rate" className="form-label">
              Listening voice speed
            </label>
            <span className="slider-value">{profile.ttsRate.toFixed(1)}x</span>
          </div>
          <input
            id="setting-tts-rate"
            type="range"
            min={0.6}
            max={1.6}
            step={0.1}
            value={profile.ttsRate}
            onChange={(e) => updateProfile({ ttsRate: Number(e.target.value) })}
            aria-valuemin={0.6}
            aria-valuemax={1.6}
            aria-valuenow={profile.ttsRate}
            aria-valuetext={`${profile.ttsRate.toFixed(1)} speed multiplier`}
          />
        </div>
      </div>

      {/* Reading Ruler Toggle */}
      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label
          htmlFor="setting-ruler"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer",
            minHeight: "44px",
          }}
        >
          <input
            id="setting-ruler"
            type="checkbox"
            checked={profile.ruler}
            onChange={(e) => updateProfile({ ruler: e.target.checked })}
            style={{ width: "20px", height: "20px", accentColor: "var(--r-accent)" }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>Reading Ruler</div>
            <div className="form-help">
              Dim rest of screen and highlight current reading line
            </div>
          </div>
        </label>
      </div>

      {/* Theme Swatches Radio Group */}
      <div className="form-group" style={{ marginTop: "1.25rem" }}>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend className="form-label" style={{ marginBottom: "0.25rem" }}>
            Background tint & contrast
          </legend>
          <span className="form-help">
            Carefully tinted background surfaces to reduce glare and visual fatigue (no harsh pure white or pure black)
          </span>

          <div className="theme-swatches" role="radiogroup" aria-label="Background tone">
            {(Object.keys(THEMES) as ThemeId[]).map((tId) => {
              const t = THEMES[tId];
              const isSelected = profile.theme === tId;
              return (
                <label
                  key={tId}
                  className={`theme-swatch-label ${isSelected ? "active" : ""}`}
                  style={{
                    backgroundColor: t.bg,
                    color: t.ink,
                  }}
                >
                  <input
                    type="radio"
                    name="theme-choice"
                    value={tId}
                    checked={isSelected}
                    onChange={() => updateProfile({ theme: tId })}
                    aria-checked={isSelected}
                  />
                  <span>{t.name}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: "normal", opacity: 0.85, marginTop: "0.25rem" }}>
                    {tId === "dusk" ? "Dark" : "Light"}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Live Sample Preview Box */}
      {showPreview && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Live Preview</h3>
          <div
            style={{
              ...(previewVars as React.CSSProperties),
              backgroundColor: "var(--r-bg)",
              color: "var(--r-ink)",
              border: "1px solid var(--r-border)",
              borderRadius: "var(--ui-radius)",
              padding: "1.5rem",
              fontFamily: "var(--r-font)",
              fontSize: "var(--r-size)",
              letterSpacing: "var(--r-letter-spacing)",
              wordSpacing: "var(--r-word-spacing)",
              lineHeight: "var(--r-line-height)",
              maxWidth: "100%",
            }}
          >
            <p style={{ maxWidth: "var(--r-width)", margin: 0 }}>
              The calmest way to read is with the settings that fit you personally. Good typography gives each word room to breathe and makes every sentence easier to follow from beginning to end.
            </p>
          </div>
        </div>
      )}

      {savedStatus && (
        <div style={{ marginTop: "1rem", color: "var(--r-accent)", fontSize: "0.9rem", fontWeight: 600 }}>
          {savedStatus}
        </div>
      )}
    </div>
  );
}
