"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { loadGoogleMapsPlaces, isGoogleMapsConfigured } from "@/lib/google-maps-loader";
import {
  parseGoogleAddressComponents,
  type GoogleAddressComponent,
} from "@/lib/parse-google-address-components";

const inputClass =
  "w-full rounded border border-[#D5D5D5] p-2 outline-none focus:border-[#0099FF]";

type DefaultAddressValues = {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
};

/**
 * US address fields. With a Maps API key, line 1 uses Places predictions + getDetails
 * in a custom list (avoids Google's .pac-container bugs inside scrollable modals).
 */
export default function UsAddressFields({ defaultValues }: { defaultValues?: DefaultAddressValues }) {
  const mapsEnabled = isGoogleMapsConfigured();

  const address2Ref = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);

  const [line1, setLine1] = useState(defaultValues?.address1 ?? "");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [listOpen, setListOpen] = useState(false);
  const [placesReady, setPlacesReady] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const placesHostRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );
  const acServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureSession = useCallback(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        new google.maps.places.AutocompleteSessionToken();
    }
  }, []);

  useEffect(() => {
    if (!mapsEnabled) return;

    let cancelled = false;

    loadGoogleMapsPlaces()
      .then(() => {
        if (cancelled || !placesHostRef.current) return;
        acServiceRef.current = new google.maps.places.AutocompleteService();
        placesServiceRef.current = new google.maps.places.PlacesService(
          placesHostRef.current
        );
        setPlacesReady(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [mapsEnabled]);

  const fetchPredictions = useCallback(
    (input: string) => {
      const ac = acServiceRef.current;
      if (!ac || !placesReady) return;

      const q = input.trim();
      if (q.length < 3) {
        setPredictions([]);
        setListOpen(false);
        return;
      }

      ensureSession();
      ac.getPlacePredictions(
        {
          input: q,
          componentRestrictions: { country: "us" },
          types: ["address"],
          sessionToken: sessionTokenRef.current ?? undefined,
        },
        (results, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !results?.length
          ) {
            setPredictions([]);
            setListOpen(false);
            return;
          }
          setPredictions(results);
          setListOpen(true);
        }
      );
    },
    [ensureSession, placesReady]
  );

  function onLine1Change(val: string) {
    setLine1(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 200);
  }

  function onPickPrediction(p: google.maps.places.AutocompletePrediction) {
    const ps = placesServiceRef.current;
    if (!ps) return;

    setListOpen(false);
    setPredictions([]);

    ps.getDetails(
      {
        placeId: p.place_id,
        fields: ["address_components"],
        sessionToken: sessionTokenRef.current ?? undefined,
      },
      (place, status) => {
        sessionTokenRef.current = null;

        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !place?.address_components
        ) {
          setLine1(p.description);
          return;
        }

        const parsed = parseGoogleAddressComponents(
          place.address_components as unknown as GoogleAddressComponent[]
        );
        if (parsed) {
          setLine1(parsed.address1);
          if (address2Ref.current) address2Ref.current.value = parsed.address2;
          if (cityRef.current) cityRef.current.value = parsed.city;
          if (stateRef.current) stateRef.current.value = parsed.state;
          if (zipRef.current) zipRef.current.value = parsed.zipCode;
          if (countryRef.current) countryRef.current.value = parsed.country;
        } else {
          setLine1(p.description);
        }
      }
    );
  }

  useEffect(() => {
    if (!listOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setListOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [listOpen]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!mapsEnabled) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <p className="text-xs text-amber-800 sm:col-span-2">
          Add{" "}
          <code className="rounded bg-amber-100 px-1">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          to <code className="rounded bg-amber-100 px-1">.env.local</code> with Maps
          JavaScript API + Places API enabled to turn on address suggestions.
        </p>
        <div className="flex flex-col sm:col-span-2">
          <label className="mb-1 text-xs text-[#808080]">Address line 1</label>
          <input
            name="address1"
            type="text"
            defaultValue={defaultValues?.address1 ?? ""}
            className={inputClass}
            placeholder="Street address"
          />
        </div>
        <div className="flex flex-col sm:col-span-2">
          <label className="mb-1 text-xs text-[#808080]">Address line 2</label>
          <input
            name="address2"
            type="text"
            defaultValue={defaultValues?.address2 ?? ""}
            className={inputClass}
            placeholder="Suite, unit, etc."
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-[#808080]">City</label>
          <input name="city" type="text" defaultValue={defaultValues?.city ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-[#808080]">State</label>
          <input name="state" type="text" defaultValue={defaultValues?.state ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-[#808080]">ZIP code</label>
          <input name="zipCode" type="text" defaultValue={defaultValues?.zipCode ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-[#808080]">Country</label>
          <input
            name="country"
            type="text"
            defaultValue={defaultValues?.country ?? ""}
            className={inputClass}
            placeholder="United States"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* PlacesService requires a real DOM node; keep off-screen, not display:none */}
      <div ref={placesHostRef} className="sr-only" aria-hidden />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <p className="text-xs text-gray-500 sm:col-span-2">
        Start typing a US street address in line 1 — choose a suggestion to fill city,
        state, ZIP, and country automatically.
      </p>

      <div className="relative sm:col-span-2" ref={wrapperRef}>
        <label className="mb-1 block text-xs text-[#808080]">Address line 1</label>
        <input
          name="address1"
          type="text"
          autoComplete="off"
          value={line1}
          onChange={(e) => onLine1Change(e.target.value)}
          onFocus={() => {
            if (predictions.length > 0) setListOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setListOpen(false);
            }
          }}
          className={inputClass}
          placeholder="Start typing US address…"
        />
        {listOpen && predictions.length > 0 ? (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-[10050] mt-1 max-h-52 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            {predictions.map((p) => (
              <li key={p.place_id} role="option">
                <button
                  type="button"
                  className="flex w-full gap-2 px-3 py-2 text-left text-sm hover:bg-[#D5EEFF]"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onPickPrediction(p);
                  }}
                >
                  <span className="text-gray-400" aria-hidden>
                    📍
                  </span>
                  <span>{p.description}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col sm:col-span-2">
        <label className="mb-1 text-xs text-[#808080]">Address line 2</label>
        <input
          ref={address2Ref}
          name="address2"
          type="text"
          autoComplete="address-line2"
          defaultValue={defaultValues?.address2 ?? ""}
          className={inputClass}
          placeholder="Suite, unit, etc."
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-[#808080]">City</label>
        <input
          ref={cityRef}
          name="city"
          type="text"
          autoComplete="address-level2"
          defaultValue={defaultValues?.city ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-[#808080]">State</label>
        <input
          ref={stateRef}
          name="state"
          type="text"
          autoComplete="address-level1"
          defaultValue={defaultValues?.state ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-[#808080]">ZIP code</label>
        <input
          ref={zipRef}
          name="zipCode"
          type="text"
          autoComplete="postal-code"
          defaultValue={defaultValues?.zipCode ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-[#808080]">Country</label>
        <input
          ref={countryRef}
          name="country"
          type="text"
          autoComplete="country-name"
          defaultValue={defaultValues?.country ?? ""}
          className={inputClass}
          placeholder="United States"
        />
      </div>
    </div>
    </>
  );
}
