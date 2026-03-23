import { NextRequest, NextResponse } from "next/server";

import { auth0, isAuth0Configured } from "./lib/auth0";

const auth0SetupMessage =
  "Auth0 is not configured. In .env.local set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, and APP_BASE_URL (e.g. http://localhost:3000). Register http://localhost:3000/auth/callback in the Auth0 application.";

/**
 * Authentication proxy (Next.js 16+): intercepts requests and mounts the OAuth flow.
 *
 * SDK routes: /auth/login, /auth/logout, /auth/callback, /auth/profile,
 * /auth/access-token (if enabled), /auth/backchannel-logout, etc.
 *
 * If you need to block requests, do that before calling `auth0.middleware()`.
 */
export async function proxy(request: Request) {
  if (!isAuth0Configured()) {
    return new NextResponse(auth0SetupMessage, {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // OAuth handlers must run without an app session.
  if (path.startsWith("/auth")) {
    const authResponse = await auth0.middleware(request);
    return authResponse;
  }

  const req = new NextRequest(request);
  const session = await auth0.getSession(req);
  if (!session) {
    const loginUrl = new URL("/auth/login", url.origin);
    const returnTo = path + url.search;
    if (returnTo !== "/") {
      loginUrl.searchParams.set("returnTo", returnTo);
    }
    return NextResponse.redirect(loginUrl);
  }

  const authResponse = await auth0.middleware(request);
  return authResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
