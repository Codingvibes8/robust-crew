import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ANON_ID, HEADER_ANON_ID } from "./lib/site-constants";

export function proxy(request: NextRequest) {
  let anonId = request.cookies.get(COOKIE_ANON_ID)?.value;
  const isNew = !anonId;

  if (!anonId) {
    anonId = "anon_" + crypto.randomUUID().replace(/-/g, "");
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HEADER_ANON_ID, anonId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isNew) {
    response.cookies.set(COOKIE_ANON_ID, anonId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
