import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ReadingProfileSchema, DEFAULT_PROFILE, parseProfile } from "./profile";

describe("ReadingProfileSchema", () => {
  test("accepts valid default profile", () => {
    const result = ReadingProfileSchema.safeParse(DEFAULT_PROFILE);
    assert.equal(result.success, true);
  });

  test("rejects font size below minimum", () => {
    const result = ReadingProfileSchema.safeParse({ ...DEFAULT_PROFILE, size: 15 });
    assert.equal(result.success, false);
  });

  test("rejects font size above maximum", () => {
    const result = ReadingProfileSchema.safeParse({ ...DEFAULT_PROFILE, size: 31 });
    assert.equal(result.success, false);
  });

  test("rejects invalid font choice", () => {
    const result = ReadingProfileSchema.safeParse({ ...DEFAULT_PROFILE, font: "comic-sans" });
    assert.equal(result.success, false);
  });

  test("rejects invalid theme choice", () => {
    const result = ReadingProfileSchema.safeParse({ ...DEFAULT_PROFILE, theme: "neon" });
    assert.equal(result.success, false);
  });

  test("rejects letter spacing above maximum", () => {
    const result = ReadingProfileSchema.safeParse({ ...DEFAULT_PROFILE, letterSpacing: 0.3 });
    assert.equal(result.success, false);
  });

  test("rejects line height below minimum", () => {
    const result = ReadingProfileSchema.safeParse({ ...DEFAULT_PROFILE, lineHeight: 1.0 });
    assert.equal(result.success, false);
  });

  test("rejects width above maximum", () => {
    const result = ReadingProfileSchema.safeParse({ ...DEFAULT_PROFILE, width: 100 });
    assert.equal(result.success, false);
  });

  test("rejects ttsRate above maximum", () => {
    const result = ReadingProfileSchema.safeParse({ ...DEFAULT_PROFILE, ttsRate: 2.0 });
    assert.equal(result.success, false);
  });

  test("coerces string numbers to actual numbers", () => {
    const result = ReadingProfileSchema.safeParse({
      ...DEFAULT_PROFILE,
      size: "22",
      lineHeight: "1.8",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.size, 22);
      assert.equal(result.data.lineHeight, 1.8);
    }
  });
});

describe("parseProfile", () => {
  test("returns default for null/undefined", () => {
    const profile = parseProfile(null);
    assert.deepEqual(profile, DEFAULT_PROFILE);
  });

  test("returns default for empty string", () => {
    const profile = parseProfile("");
    assert.deepEqual(profile, DEFAULT_PROFILE);
  });

  test("returns default for invalid JSON", () => {
    const profile = parseProfile("not json");
    assert.deepEqual(profile, DEFAULT_PROFILE);
  });

  test("returns default for invalid profile data", () => {
    const profile = parseProfile(JSON.stringify({ font: "invalid", size: 999 }));
    assert.deepEqual(profile, DEFAULT_PROFILE);
  });

  test("parses valid profile JSON", () => {
    const custom = { ...DEFAULT_PROFILE, size: 24, theme: "dusk" };
    const profile = parseProfile(JSON.stringify(custom));
    assert.equal(profile.size, 24);
    assert.equal(profile.theme, "dusk");
  });

  test("parses valid profile object", () => {
    const custom = { ...DEFAULT_PROFILE, font: "literata" };
    const profile = parseProfile(custom);
    assert.equal(profile.font, "literata");
  });
});
