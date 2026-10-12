import { test, describe } from "node:test";
import assert from "node:assert/strict";

// We need to test the MemoryStore. Since it's not directly exported,
// we test via the store singleton or re-implement the test.
// Let's test the store interface contract.

describe("Store interface", () => {
  test("MemoryStore implements all required methods", async () => {
    // Import the store module and check the singleton
    const mod = await import("./store");
    const store = mod.store;

    assert.equal(typeof store.saveDocument, "function");
    assert.equal(typeof store.getDocument, "function");
    assert.equal(typeof store.getSimplification, "function");
    assert.equal(typeof store.saveSimplification, "function");
    assert.equal(typeof store.getDailyUsageCount, "function");
    assert.equal(typeof store.recordDailyUsage, "function");
    assert.equal(typeof store.getDailySpend, "function");
    assert.equal(typeof store.recordSpend, "function");
    assert.equal(typeof store.getIpDailySpend, "function");
  });

  test("saveDocument and getDocument roundtrip", async () => {
    const mod = await import("./store");
    const store = mod.store;

    const doc = await store.saveDocument({
      id: "test_doc_1",
      ownerId: "anon_test",
      title: "Test Document",
      paragraphs: [{ id: 1, type: "p", text: "Hello world" }],
      wordCount: 2,
      sourceType: "paste",
    });

    assert.equal(doc.id, "test_doc_1");
    assert.equal(doc.title, "Test Document");

    const retrieved = await store.getDocument("test_doc_1", "anon_test");
    assert.ok(retrieved);
    assert.equal(retrieved?.title, "Test Document");
  });

  test("getDocument returns null for wrong owner", async () => {
    const mod = await import("./store");
    const store = mod.store;

    await store.saveDocument({
      id: "test_doc_2",
      ownerId: "anon_owner_a",
      title: "Private Doc",
      paragraphs: [{ id: 1, type: "p", text: "Secret" }],
      wordCount: 1,
      sourceType: "paste",
    });

    const result = await store.getDocument("test_doc_2", "anon_owner_b");
    assert.equal(result, null);
  });

  test("daily usage counting works correctly", async () => {
    const mod = await import("./store");
    const store = mod.store;

    const anonId = "anon_usage_test";
    const today = new Date().toISOString().split("T")[0];

    const count1 = await store.getDailyUsageCount(anonId, today);
    assert.equal(count1, 0);

    await store.recordDailyUsage(anonId, "doc_a", today);
    const count2 = await store.getDailyUsageCount(anonId, today);
    assert.equal(count2, 1);

    // Same doc again should not increase count
    await store.recordDailyUsage(anonId, "doc_a", today);
    const count3 = await store.getDailyUsageCount(anonId, today);
    assert.equal(count3, 1);

    // Different doc should increase count
    await store.recordDailyUsage(anonId, "doc_b", today);
    const count4 = await store.getDailyUsageCount(anonId, today);
    assert.equal(count4, 2);
  });

  test("spend tracking works correctly", async () => {
    const mod = await import("./store");
    const store = mod.store;

    const today = new Date().toISOString().split("T")[0];
    const ipHash = "test_ip_hash_123";

    const spend1 = await store.getDailySpend(today);
    assert.equal(spend1, 0);

    await store.recordSpend(today, 0.50, ipHash);
    const spend2 = await store.getDailySpend(today);
    assert.equal(spend2, 0.50);

    await store.recordSpend(today, 0.30, ipHash);
    const spend3 = await store.getDailySpend(today);
    assert.equal(spend3, 0.80);

    const ipSpend = await store.getIpDailySpend(ipHash, today);
    assert.equal(ipSpend, 0.80);
  });
});
