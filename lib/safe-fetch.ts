import dns from "node:dns/promises";
import net from "node:net";

export class FetchSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchSecurityError";
  }
}

/**
 * Checks if an IPv4 address is in a private, loopback, CGNAT, or reserved range.
 */
function isDisallowedIpv4(ip: string): boolean {
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
function isDisallowedIpv6(ip: string): boolean {
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
 */
async function validateUrlSafety(urlStr: string): Promise<URL> {
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

  // Resolve hostname and verify resolved IPs against SSRF
  // NOTE: For enterprise production, integrate DNS pinning (connecting directly to resolved IP with SNI verification)
  // to eliminate Time-Of-Check to Time-Of-Use (TOCTOU) DNS rebinding risks.
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new FetchSecurityError("Could not resolve domain name.");
    }

    for (const record of addresses) {
      if (record.family === 4) {
        if (isDisallowedIpv4(record.address)) {
          throw new FetchSecurityError("Access to internal, local, or private IP addresses is blocked.");
        }
      } else if (record.family === 6) {
        if (isDisallowedIpv6(record.address)) {
          throw new FetchSecurityError("Access to internal, local, or private IP addresses is blocked.");
        }
      }
    }
  } catch (err: unknown) {
    if (err instanceof FetchSecurityError) throw err;
    throw new FetchSecurityError("Failed to verify address safety for this domain.");
  }

  return parsed;
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
    const parsed = await validateUrlSafety(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let res: Response;
    try {
      res = await fetch(parsed.toString(), {
        method: "GET",
        headers: {
          "User-Agent": "Plainread/1.0 (+https://plainread.app; Reading Aid Content Importer)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
        signal: controller.signal,
      });
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
