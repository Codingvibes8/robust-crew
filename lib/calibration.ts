import { ReadingProfile } from "./profile";

export interface CalibrationRoundDef {
  roundNumber: number;
  title: string;
  question: string;
  getVariants: (currentProfile: ReadingProfile) => {
    optionA: { label: string; patch: Partial<ReadingProfile> };
    optionB: { label: string; patch: Partial<ReadingProfile> };
  };
}

export const CALIBRATION_SAMPLE_PARAGRAPHS = [
  "The deep ocean remains one of the quietest frontiers on Earth. Beneath the sunlit surface, where daylight quickly fades, creatures navigate using gentle bioluminescent glows and delicate water vibrations. Every layer of the sea holds subtle adaptations honed over millions of years.",
  "Reading about remote places opens new perspectives in our minds. When sentences are arranged with comfortable spacing and distinct letterforms, words flow naturally, allowing ideas and stories to take shape without visual strain or unnecessary fatigue.",
];

export const CALIBRATION_ROUNDS: CalibrationRoundDef[] = [
  {
    roundNumber: 1,
    title: "Font style",
    question: "Which font feels more distinct and comfortable to read?",
    getVariants: () => ({
      optionA: {
        label: "Option A",
        patch: { font: "lexend" },
      },
      optionB: {
        label: "Option B",
        patch: { font: "atkinson" },
      },
    }),
  },
  {
    roundNumber: 2,
    title: "Text size",
    question: "Which text size gives your eyes more room to focus?",
    getVariants: () => ({
      optionA: {
        label: "Option A",
        patch: { size: 17 },
      },
      optionB: {
        label: "Option B",
        patch: { size: 22 },
      },
    }),
  },
  {
    roundNumber: 3,
    title: "Letter & word spacing",
    question: "Do you prefer standard or wider spacing between letters and words?",
    getVariants: () => ({
      optionA: {
        label: "Option A",
        patch: { letterSpacing: 0.01, wordSpacing: 0.05 },
      },
      optionB: {
        label: "Option B",
        patch: { letterSpacing: 0.06, wordSpacing: 0.18 },
      },
    }),
  },
  {
    roundNumber: 4,
    title: "Line spacing",
    question: "Which line height helps you track from one line to the next?",
    getVariants: () => ({
      optionA: {
        label: "Option A",
        patch: { lineHeight: 1.5 },
      },
      optionB: {
        label: "Option B",
        patch: { lineHeight: 1.9 },
      },
    }),
  },
  {
    roundNumber: 5,
    title: "Background tint",
    question: "Which surface tone feels calmer for your eyes?",
    getVariants: () => ({
      optionA: {
        label: "Option A",
        patch: { theme: "plain" },
      },
      optionB: {
        label: "Option B",
        patch: { theme: "paper" },
      },
    }),
  },
  {
    roundNumber: 6,
    title: "Refining contrast",
    question: "Compare your preferred tint against a cool soft-mist tone:",
    getVariants: (currentProfile) => ({
      optionA: {
        label: "Option A",
        patch: { theme: currentProfile.theme === "mist" ? "paper" : currentProfile.theme },
      },
      optionB: {
        label: "Option B",
        patch: { theme: "mist" },
      },
    }),
  },
];
