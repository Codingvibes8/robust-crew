import { cookies, headers } from "next/headers";
import { COOKIE_ANON_ID, HEADER_ANON_ID, COOKIE_PROFILE } from "./site-constants";
import { parseProfile, ReadingProfile } from "./profile";

export function generateAnonId(): string {
  return "anon_" + crypto.randomUUID().replace(/-/g, "");
}

/**
 * Server-side helper to read the anonymous user ID from request headers or cookies.
 */
export async function getAnonId(): Promise<string> {
  const headerList = await headers();
  const headerAnonId = headerList.get(HEADER_ANON_ID);
  if (headerAnonId) {
    return headerAnonId;
  }

  const cookieStore = await cookies();
  const cookieAnonId = cookieStore.get(COOKIE_ANON_ID)?.value;
  if (cookieAnonId) {
    return cookieAnonId;
  }

  // Fallback if accessed directly without middleware
  return "anon_guest";
}

/**
 * Server-side helper to read and validate the user's reading profile from cookie.
 */
export async function getServerProfile(): Promise<ReadingProfile> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_PROFILE)?.value;
  return parseProfile(raw);
}
