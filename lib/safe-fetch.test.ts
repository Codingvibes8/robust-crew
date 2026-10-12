import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isDisallowedIpv4, isDisallowedIpv6, FetchSecurityError } from "./safe-fetch";

describe("isDisallowedIpv4", () => {
  test("blocks loopback addresses", () => {
    assert.equal(isDisallowedIpv4("127.0.0.1"), true);
    assert.equal(isDisallowedIpv4("127.5.3.1"), true);
  });

  test("blocks private addresses", () => {
    assert.equal(isDisallowedIpv4("10.0.0.1"), true);
    assert.equal(isDisallowedIpv4("192.168.1.1"), true);
    assert.equal(isDisallowedIpv4("172.16.0.1"), true);
  });

  test("blocks link-local addresses", () => {
    assert.equal(isDisallowedIpv4("169.254.1.1"), true);
  });

  test("blocks CGNAT addresses", () => {
    assert.equal(isDisallowedIpv4("100.64.0.1"), true);
    assert.equal(isDisallowedIpv4("100.127.255.254"), true);
  });

  test("blocks multicast and reserved", () => {
    assert.equal(isDisallowedIpv4("224.0.0.1"), true);
    assert.equal(isDisallowedIpv4("240.0.0.1"), true);
  });

  test("allows public addresses", () => {
    assert.equal(isDisallowedIpv4("8.8.8.8"), false);
    assert.equal(isDisallowedIpv4("1.1.1.1"), false);
  });

  test("blocks invalid input", () => {
    assert.equal(isDisallowedIpv4("not-an-ip"), true);
    assert.equal(isDisallowedIpv4(""), true);
  });
});

describe("isDisallowedIpv6", () => {
  test("blocks loopback", () => {
    assert.equal(isDisallowedIpv6("::1"), true);
    assert.equal(isDisallowedIpv6("::"), true);
  });

  test("blocks IPv4-mapped private", () => {
    assert.equal(isDisallowedIpv6("::ffff:192.168.1.1"), true);
    assert.equal(isDisallowedIpv6("::ffff:10.0.0.1"), true);
  });

  test("blocks unique local addresses", () => {
    assert.equal(isDisallowedIpv6("fc00::1"), true);
    assert.equal(isDisallowedIpv6("fd00::1"), true);
  });

  test("blocks link-local", () => {
    assert.equal(isDisallowedIpv6("fe80::1"), true);
    assert.equal(isDisallowedIpv6("fe90::1"), true);
  });

  test("blocks multicast", () => {
    assert.equal(isDisallowedIpv6("ff02::1"), true);
  });

  test("allows public IPv6", () => {
    assert.equal(isDisallowedIpv6("2606:4700:4700::1111"), false);
  });
});

describe("FetchSecurityError", () => {
  test("has correct name and message", () => {
    const err = new FetchSecurityError("test message");
    assert.equal(err.name, "FetchSecurityError");
    assert.equal(err.message, "test message");
    assert.ok(err instanceof Error);
  });
});

describe("safeFetchHtml", () => {
  test("rejects non-HTTP protocols", async () => {
    const mod = await import("./safe-fetch");
    await assert.rejects(
      () => mod.safeFetchHtml("ftp://example.com/file"),
      (err: unknown) => {
        assert.ok(err instanceof FetchSecurityError);
        assert.ok((err as Error).message.includes("HTTP"));
        return true;
      }
    );
  });

  test("rejects invalid URLs", async () => {
    const mod = await import("./safe-fetch");
    await assert.rejects(
      () => mod.safeFetchHtml("not a url"),
      (err: unknown) => {
        assert.ok(err instanceof FetchSecurityError);
        return true;
      }
    );
  });

  test("rejects non-standard ports", async () => {
    const mod = await import("./safe-fetch");
    await assert.rejects(
      () => mod.safeFetchHtml("http://example.com:8080/path"),
      (err: unknown) => {
        assert.ok(err instanceof FetchSecurityError);
        assert.ok((err as Error).message.includes("port"));
        return true;
      }
    );
  });

  test("rejects private IP addresses", async () => {
    const mod = await import("./safe-fetch");
    await assert.rejects(
      () => mod.safeFetchHtml("http://192.168.1.1/admin"),
      (err: unknown) => {
        assert.ok(err instanceof FetchSecurityError);
        return true;
      }
    );
  });

  test("rejects loopback addresses", async () => {
    const mod = await import("./safe-fetch");
    await assert.rejects(
      () => mod.safeFetchHtml("http://127.0.0.1:3000"),
      (err: unknown) => {
        assert.ok(err instanceof FetchSecurityError);
        return true;
      }
    );
  });
});

