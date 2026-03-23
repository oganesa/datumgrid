import { NextRequest, NextResponse } from "next/server";

import { getAuth0, isAuth0Configured } from "./lib/auth0";

const auth0SetupMessage =
  "Auth0 is not configured. In .env.local set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, and APP_BASE_URL (e.g. http://localhost:3000). Register http://localhost:3000/auth/callback in the Auth0 application.";

export async function proxy(request: Request) {
  const req = new NextRequest(request);
  const path = req.nextUrl.pathname;

  if (!isAuth0Configured()) {
    return new NextResponse(auth0SetupMessage, {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const auth0 = getAuth0();

  if (path.startsWith("/auth")) {
    return auth0.middleware(req);
  }

  const session = await auth0.getSession(req);
  if (!session) {
    const loginUrl = new URL("/auth/login", req.nextUrl.origin);
    const returnTo = path + req.nextUrl.search;
    if (returnTo !== "/") {
      loginUrl.searchParams.set("returnTo", returnTo);
    }
    return NextResponse.redirect(loginUrl);
  }

  return auth0.middleware(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
