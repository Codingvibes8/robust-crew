import dns from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import net from "node:net";
import { Agent, fetch as undiciFetch } from "undici";

export class FetchSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchSecurityError";
  }
}

/**
 * Checks if an IPv4 address is in a private, loopback, CGNAT, or reserved range.
 */
export function isDisallowedIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [b0, b1] = parts;

  // 0.0.0.0/8
  if (b0 === 0) return true;
  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;
  // 10.0.0.0/8 (Private)
  if (b0 === 10) return true;
  // 172.16.0.0/12 (Private)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (b0 === 192 && b1 === 168) return true;
  // 169.254.0.0/16 (Link-local)
  if (b0 === 169 && b1 === 254) return true;
  // 100.64.0.0/10 (CGNAT)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (b0 >= 224) return true;

  return false;
}

/**
 * Checks if an IPv6 address is private, loopback, link-local, multicast, or IPv4-mapped.
 */
export function isDisallowedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback & Unspecified
  if (normalized === "::1" || normalized === "::") return true;

  // IPv4 mapped IPv6 e.g. ::ffff:192.168.1.1
  if (normalized.startsWith("::ffff:")) {
    const v4 = normalized.substring(7);
    if (net.isIPv4(v4)) {
      return isDisallowedIpv4(v4);
    }
    return true;
  }

  // Unique local fc00::/7 (fc00 - fdff)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // Link local fe80::/10 (fe8, fe9, fea, feb)
  if (/^fe[89ab]/i.test(normalized)) return true;

  // Multicast ff00::/8
  if (normalized.startsWith("ff")) return true;

  return false;
}

/**
 * Validates the protocol, port, and resolved IP addresses of a given URL.
 * Returns the validated URL and a pinned connection target (IP + hostname for SNI).
 */
async function validateUrlSafety(urlStr: string): Promise<{ parsed: URL; pinnedIp: string; hostname: string }> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new FetchSecurityError("Invalid URL format.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new FetchSecurityError("Only HTTP and HTTPS protocols are allowed.");
  }

  const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === "https:" ? 443 : 80;
  if (port !== 80 && port !== 443) {
    throw new FetchSecurityError("Only standard ports 80 and 443 are supported.");
  }

  const hostname = parsed.hostname;
  if (!hostname) {
    throw new FetchSecurityError("Missing hostname in URL.");
  }
  // hostname stays in `parsed` — the original URL is used for the request so
  // TLS SNI and certificate identity verification use the real hostname.

  // Resolve hostname and verify resolved IPs against SSRF
  let addresses: LookupAddress[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new FetchSecurityError("Could not resolve domain name.");
    }
  } catch (err: unknown) {
    if (err instanceof FetchSecurityError) throw err;
    throw new FetchSecurityError("Failed to verify address safety for this domain.");
  }

  // Filter to only safe addresses
  const safeAddresses = addresses.filter((record) => {
    if (record.family === 4) return !isDisallowedIpv4(record.address);
    if (record.family === 6) return !isDisallowedIpv6(record.address);
    return false;
  });

  if (safeAddresses.length === 0) {
    throw new FetchSecurityError("Access to internal, local, or private IP addresses is blocked.");
  }

  // DNS Pinning: Pick the first safe address and use it directly for the connection.
  // This eliminates the TOCTOU DNS rebinding gap — we connect to the validated IP
  // and verify the TLS certificate matches the original hostname (SNI).
  const pinnedIp = safeAddresses[0].address;

  return { parsed, pinnedIp, hostname };
}

/**
 * Builds an undici Agent that pins every connection to `pinnedIp`.
 *
 * DNS pinning (closes the TOCTOU / DNS-rebinding gap): the hostname is resolved
 * and validated once in `validateUrlSafety`, then this agent makes every actual
 * TCP connection go to that exact validated IP via a custom DNS lookup — so a
 * rebind between check and use cannot redirect the request to an internal host.
 *
 * The URL keeps its original hostname, so TLS SNI and certificate identity
 * verification still happen against the real hostname, not the pinned IP.
 */
function createPinnedAgent(pinnedIp: string): Agent {
  const family = net.isIPv6(pinnedIp) ? 6 : 4;
  return new Agent({
    connect: {
      // Custom lookup: never consult the system resolver at connect time,
      // always return the pre-validated IP. undici may call this with
      // `all: true` and expect an array, so support both shapes.
      lookup: (
        _hostname: string,
        options: { all?: boolean } | undefined,
        callback: (
          err: Error | null,
          address: string | LookupAddress[],
          family?: number
        ) => void
      ) => {
        if (options?.all) {
          callback(null, [{ address: pinnedIp, family }]);
        } else {
          callback(null, pinnedIp, family);
        }
      },
    },
  });
}

export interface SafeFetchResult {
  html: string;
  finalUrl: string;
}

/**
 * Safely fetches HTML content with SSRF protection, manual redirect validation,
 * 10-second timeout, and 2 MB content cap.
 */
export async function safeFetchHtml(initialUrl: string): Promise<SafeFetchResult> {
  let currentUrl = initialUrl;
  const maxHops = 4;
  const maxBytes = 2 * 1024 * 1024; // 2 MB

  for (let hop = 0; hop <= maxHops; hop++) {
    const { parsed, pinnedIp } = await validateUrlSafety(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    // DNS Pinning: every connection in this request is pinned to the validated IP.
    // Re-validated from scratch on each redirect hop via validateUrlSafety above.
    const pinnedAgent = createPinnedAgent(pinnedIp);

    let res: Response;
    try {
      // Use undici's fetch (same package as the pinned Agent) — Node's global
      // fetch bundles a different undici version whose dispatcher contract
      // does not match, which would silently break pinning.
      res = (await undiciFetch(parsed.toString(), {
        method: "GET",
        headers: {
          "User-Agent": "Plainread/1.0 (+https://plainread.app; Reading Aid Content Importer)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
        signal: controller.signal,
        dispatcher: pinnedAgent,
      })) as unknown as Response;
    } catch (e: unknown) {
      clearTimeout(timeout);
      if ((e as { name?: string }).name === "AbortError") {
        throw new FetchSecurityError("Request timed out after 10 seconds.");
      }
      throw new FetchSecurityError("Failed to connect to the requested website.");
    } finally {
      clearTimeout(timeout);
    }

    // Handle redirects manually
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location) {
        throw new FetchSecurityError("Redirect response was missing Location header.");
      }
      if (hop === maxHops) {
        throw new FetchSecurityError("Too many redirects (exceeded 4 hops).");
      }
      // Resolve relative redirect against current URL
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!res.ok) {
      throw new FetchSecurityError(`Server returned an error status (${res.status} ${res.statusText}).`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new FetchSecurityError("URL did not return HTML content (expected text/html).");
    }

    // Check Content-Length if present
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      throw new FetchSecurityError("Content exceeds the 2 MB limit.");
    }

    // Stream and enforce 2MB limit
    if (!res.body) {
      throw new FetchSecurityError("Empty response body received.");
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        receivedBytes += value.length;
        if (receivedBytes > maxBytes) {
          reader.cancel();
          throw new FetchSecurityError("Content exceeds the 2 MB limit.");
        }
        chunks.push(value);
      }
    }

    const decoder = new TextDecoder("utf-8");
    const html = chunks.map((c) => decoder.decode(c, { stream: true })).join("") + decoder.decode();

    return {
      html,
      finalUrl: currentUrl,
    };
  }

  throw new FetchSecurityError("Exceeded maximum redirects.");
}
