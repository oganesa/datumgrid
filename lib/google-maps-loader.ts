/**
 * Loads the Maps JavaScript API with the Places library once per page load.
 *
 * Setup (you need a Google Cloud account — we cannot create this for you):
 * 1. Google Cloud Console → APIs & Services → enable **Maps JavaScript API** and **Places API**.
 * 2. Credentials → create an API key → restrict it (HTTP referrers for local + production).
 * 3. Add to `.env.local`: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here`
 */
let loadPromise: Promise<void> | null = null;

export function isGoogleMapsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
}

export function loadGoogleMapsPlaces(): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!apiKey) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
  }
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }
  if (!loadPromise) {
    loadPromise = (async () => {
      const { setOptions, importLibrary } = await import(
        "@googlemaps/js-api-loader"
      );
      setOptions({ key: apiKey, v: "weekly" });
      await importLibrary("places");
    })().catch((err) => {
      loadPromise = null;
      throw err;
    });
  }
  return loadPromise;
}
