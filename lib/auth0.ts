import { Auth0Client } from "@auth0/nextjs-auth0/server";

/** All values must be set in `.env.local` or Auth0 routes throw (e.g. domain.startsWith). */
export function isAuth0Configured(): boolean {
  return Boolean(
    process.env.AUTH0_DOMAIN &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_SECRET &&
      (process.env.AUTH0_CLIENT_SECRET ||
        process.env.AUTH0_CLIENT_ASSERTION_SIGNING_KEY)
  );
}

let client: Auth0Client | undefined;

/** Avoid constructing `Auth0Client` at import time — missing env would log warnings on every dev boot. */
export function getAuth0(): Auth0Client {
  if (!isAuth0Configured()) {
    throw new Error(
      "Auth0 is not configured. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, and AUTH0_SECRET in .env.local."
    );
  }
  client ??= new Auth0Client();
  return client;
}

/**
 * Lazy `Auth0Client` — matches Auth0 quickstarts (`auth0.middleware(request)`).
 * Prefer not touching this until `isAuth0Configured()` is true.
 */
export const auth0 = new Proxy({} as Auth0Client, {
  get(_target, prop) {
    const c = getAuth0();
    const value = Reflect.get(c, prop as keyof Auth0Client);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(c)
      : value;
  },
});
