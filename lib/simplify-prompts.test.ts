import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getLevelSystemPrompt,
  buildUserPrompt,
  SimplificationLevel,
} from "./simplify-prompts";

describe("getLevelSystemPrompt", () => {
  test("lighter level includes shorter sentence guidance", () => {
    const prompt = getLevelSystemPrompt("lighter");
    assert.ok(prompt.includes("Lighter"));
    assert.ok(prompt.includes("shorter"));
  });

  test("simpler level includes plain vocabulary guidance", () => {
    const prompt = getLevelSystemPrompt("simpler");
    assert.ok(prompt.includes("Simpler"));
    assert.ok(prompt.includes("plain"));
  });

  test("summary level includes bullet point guidance", () => {
    const prompt = getLevelSystemPrompt("summary");
    assert.ok(prompt.includes("Summary"));
    assert.ok(prompt.includes("bullet"));
  });

  test("all levels include base safety prompt", () => {
    const base = getLevelSystemPrompt("lighter");
    assert.ok(base.includes("STRICTLY as passive reading material"));
    assert.ok(base.includes("NEVER add external commentary"));
  });
});

describe("buildUserPrompt", () => {
  const sampleParagraphs = [
    { index: 1, text: "First paragraph text." },
    { index: 2, text: "Second paragraph text." },
  ];

  test("lighter level includes paragraph indices", () => {
    const prompt = buildUserPrompt(sampleParagraphs, "lighter");
    // buildUserPrompt pretty-prints the paragraph payload (key: "index")
    assert.ok(prompt.includes('"index": 1'));
    assert.ok(prompt.includes('"index": 2'));
    assert.ok(prompt.includes("First paragraph text."));
  });

  test("summary level includes full text", () => {
    const prompt = buildUserPrompt(sampleParagraphs, "summary");
    assert.ok(prompt.includes("First paragraph text."));
    assert.ok(prompt.includes("Second paragraph text."));
  });

  test("summary level requests 4-8 bullet points", () => {
    const prompt = buildUserPrompt(sampleParagraphs, "summary");
    assert.ok(prompt.includes("4 to 8"));
  });

  test("all levels request JSON array output", () => {
    for (const level of ["lighter", "simpler", "summary"] as SimplificationLevel[]) {
      const prompt = buildUserPrompt(sampleParagraphs, level);
      assert.ok(prompt.includes("JSON array"), `Level ${level} should request JSON array`);
    }
  });
});
