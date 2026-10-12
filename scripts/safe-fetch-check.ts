/**
 * Integration check for DNS pinning in safe-fetch.
 * Not part of the unit test suite (needs network); run manually:
 *   npx tsx scripts/safe-fetch-check.ts
 *
 * Confirms that pinning the connection to the validated IP does NOT break
 * HTTPS certificate identity verification against the original hostname.
 */
import { safeFetchHtml, FetchSecurityError } from "../lib/safe-fetch";

async function main() {
  const url = "https://example.com/";
  const { html, finalUrl } = await safeFetchHtml(url);
  console.log(`OK  fetched ${finalUrl} (${html.length} bytes, contains "Example Domain": ${html.includes("Example Domain")})`);

  // SSRF still blocked
  try {
    await safeFetchHtml("http://169.254.169.254/latest/meta-data/");
    console.error("FAIL metadata endpoint was not blocked");
    process.exit(1);
  } catch (e) {
    if (e instanceof FetchSecurityError) {
      console.log(`OK  SSRF blocked: ${e.message}`);
    } else {
      throw e;
    }
  }

  try {
    await safeFetchHtml("http://localhost:3000/");
    console.error("FAIL localhost was not blocked");
    process.exit(1);
  } catch (e) {
    if (e instanceof FetchSecurityError) {
      console.log(`OK  localhost blocked: ${e.message}`);
    } else {
      throw e;
    }
  }

  console.log("All safe-fetch integration checks passed.");
}

main().catch((e) => {
  console.error("Integration check failed:", e);
  process.exit(1);
});
