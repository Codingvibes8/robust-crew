"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ReadingProfile } from "@/lib/profile";
import {
  CALIBRATION_ROUNDS,
  CALIBRATION_SAMPLE_PARAGRAPHS,
} from "@/lib/calibration";
import { profileToCssVars, applyProfileToDocument } from "@/lib/profile-to-css";
import { SettingsEditor } from "./SettingsEditor";
import { saveProfileCookieAction } from "@/app/actions";

interface CalibrationFlowProps {
  initialProfile: ReadingProfile;
  /**
   * Pre-calculated order per round from server:
   * false means Option A is first (left), Option B is second (right).
   * true means Option B is first (left), Option A is second (right).
   */
  roundOrders: boolean[];
}

export function CalibrationFlow({
  initialProfile,
  roundOrders,
}: CalibrationFlowProps) {
  const router = useRouter();
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [profile, setProfile] = useState<ReadingProfile>(initialProfile);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const totalRounds = CALIBRATION_ROUNDS.length;
  const currentDef = CALIBRATION_ROUNDS[currentRoundIdx];

  const handleSelect = (chosenPatch: Partial<ReadingProfile>) => {
    const updated = { ...profile, ...chosenPatch };
    setProfile(updated);
    applyProfileToDocument(updated);

    if (currentRoundIdx + 1 < totalRounds) {
      setCurrentRoundIdx(currentRoundIdx + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleAboutTheSame = () => {
    // Keep current profile without changing this property
    if (currentRoundIdx + 1 < totalRounds) {
      setCurrentRoundIdx(currentRoundIdx + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleSkipTheRest = () => {
    setIsCompleted(true);
  };

  const handleSaveAndStartReading = async () => {
    setIsSaving(true);
    await saveProfileCookieAction(profile);
    router.push("/import");
  };

  if (isCompleted) {
    return (
      <div className="card" style={{ maxWidth: "800px", margin: "2rem auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span className="site-brand-badge" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
            Calibration Complete
          </span>
          <h1>Your Personal Reading Profile</h1>
          <p>
            Here are the settings that suited you best during calibration. You can fine-tune any detail now or begin reading with them right away.
          </p>
        </div>

        <SettingsEditor
          initialProfile={profile}
          showPreview={true}
          onSave={(p) => setProfile(p)}
        />

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleSaveAndStartReading}
            disabled={isSaving}
            className="btn btn-primary"
            style={{ fontSize: "1.1rem", padding: "0.75rem 2rem" }}
          >
            {isSaving ? "Saving..." : "Save and start reading"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentRoundIdx(0);
              setIsCompleted(false);
            }}
            className="btn btn-secondary"
          >
            Restart calibration
          </button>
        </div>
      </div>
    );
  }

  // Current round setup
  const variants = currentDef.getVariants(profile);
  const isSwapped = roundOrders[currentRoundIdx] ?? false;

  const firstOption = isSwapped
    ? { key: "B", patch: variants.optionB.patch, label: "Option 1" }
    : { key: "A", patch: variants.optionA.patch, label: "Option 1" };

  const secondOption = isSwapped
    ? { key: "A", patch: variants.optionA.patch, label: "Option 2" }
    : { key: "B", patch: variants.optionB.patch, label: "Option 2" };

  const profile1 = { ...profile, ...firstOption.patch };
  const profile2 = { ...profile, ...secondOption.patch };

  const vars1 = profileToCssVars(profile1);
  const vars2 = profileToCssVars(profile2);

  return (
    <div style={{ maxWidth: "1050px", margin: "1rem auto" }}>
      {/* Header and Progress Indicator */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontWeight: 600, color: "var(--r-accent)", fontSize: "0.95rem" }}>
            Round {currentRoundIdx + 1} of {totalRounds} — {currentDef.title}
          </span>
          <button
            type="button"
            onClick={handleSkipTheRest}
            className="btn btn-ghost"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.9rem" }}
          >
            Skip the rest
          </button>
        </div>
        <h1 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>{currentDef.question}</h1>
        <p style={{ opacity: 0.85, fontSize: "0.95rem", margin: 0 }}>
          Read a few sentences in each box below, then select which version feels more comfortable.
        </p>
      </div>

      {/* Comparison Grid (Side by side on wide, stacked on mobile) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Option 1 Box */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "2px solid var(--r-border)",
            margin: 0,
          }}
        >
          <div
            style={{
              ...(vars1 as React.CSSProperties),
              backgroundColor: "var(--r-bg)",
              color: "var(--r-ink)",
              fontFamily: "var(--r-font)",
              fontSize: "var(--r-size)",
              letterSpacing: "var(--r-letter-spacing)",
              wordSpacing: "var(--r-word-spacing)",
              lineHeight: "var(--r-line-height)",
              padding: "1rem",
              borderRadius: "var(--ui-radius)",
              marginBottom: "1.5rem",
              minHeight: "220px",
            }}
          >
            {CALIBRATION_SAMPLE_PARAGRAPHS.map((text, i) => (
              <p key={i} style={{ marginBottom: i === 0 ? "1em" : 0 }}>
                {text}
              </p>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleSelect(firstOption.patch)}
            className="btn btn-primary"
            style={{ width: "100%", fontSize: "1rem" }}
          >
            Option 1 is easier
          </button>
        </div>

        {/* Option 2 Box */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "2px solid var(--r-border)",
            margin: 0,
          }}
        >
          <div
            style={{
              ...(vars2 as React.CSSProperties),
              backgroundColor: "var(--r-bg)",
              color: "var(--r-ink)",
              fontFamily: "var(--r-font)",
              fontSize: "var(--r-size)",
              letterSpacing: "var(--r-letter-spacing)",
              wordSpacing: "var(--r-word-spacing)",
              lineHeight: "var(--r-line-height)",
              padding: "1rem",
              borderRadius: "var(--ui-radius)",
              marginBottom: "1.5rem",
              minHeight: "220px",
            }}
          >
            {CALIBRATION_SAMPLE_PARAGRAPHS.map((text, i) => (
              <p key={i} style={{ marginBottom: i === 0 ? "1em" : 0 }}>
                {text}
              </p>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleSelect(secondOption.patch)}
            className="btn btn-primary"
            style={{ width: "100%", fontSize: "1rem" }}
          >
            Option 2 is easier
          </button>
        </div>
      </div>

      {/* Neutral Choice and Skip Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "1rem 0",
        }}
      >
        <button
          type="button"
          onClick={handleAboutTheSame}
          className="btn btn-secondary"
          style={{ minWidth: "160px" }}
        >
          About the same
        </button>
        <button
          type="button"
          onClick={handleSkipTheRest}
          className="btn btn-ghost"
        >
          Skip the rest
        </button>
      </div>
    </div>
  );
}
