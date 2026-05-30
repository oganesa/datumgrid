/**
 * Maps Google `address_components` into DatumGrid address fields.
 * Works with Places Autocomplete / Geocoder payloads.
 */
export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type ParsedUsAddressFields = {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export function parseGoogleAddressComponents(
  components: GoogleAddressComponent[] | undefined
): ParsedUsAddressFields | null {
  if (!components?.length) return null;

  let streetNumber = "";
  let route = "";
  let subpremise = "";
  let city = "";
  let state = "";
  let postal = "";
  let postalSuffix = "";
  let country = "";
  let countryShort = "";

  for (const c of components) {
    const t = c.types;
    if (t.includes("street_number")) streetNumber = c.long_name;
    if (t.includes("route")) route = c.long_name;
    if (t.includes("subpremise")) subpremise = c.long_name;
    if (t.includes("locality")) city = c.long_name;
    if (t.includes("administrative_area_level_1")) state = c.short_name;
    if (t.includes("postal_code")) postal = c.long_name;
    if (t.includes("postal_code_suffix")) postalSuffix = c.long_name;
    if (t.includes("country")) {
      country = c.long_name;
      countryShort = c.short_name;
    }
  }

  if (!city) {
    const fallback = components.find(
      (c) =>
        c.types.includes("sublocality") ||
        c.types.includes("sublocality_level_1") ||
        c.types.includes("neighborhood")
    );
    if (fallback) city = fallback.long_name;
  }

  const address1 = [streetNumber, route].filter(Boolean).join(" ").trim();
  if (!address1 && !city && !postal) return null;

  let zipCode = postal;
  if (postal && postalSuffix) zipCode = `${postal}-${postalSuffix}`;

  const isUS =
    countryShort === "US" ||
    country === "United States" ||
    country === "USA";

  return {
    address1: address1 || (placeFallbackLine(components) ?? ""),
    address2: subpremise,
    city,
    state,
    zipCode,
    country: isUS ? "United States" : country || "",
  };
}

/** When Google returns a premise without street_number + route. */
function placeFallbackLine(components: GoogleAddressComponent[]): string | null {
  const premise = components.find((c) => c.types.includes("premise"));
  if (premise) return premise.long_name;
  const establishment = components.find((c) =>
    c.types.includes("establishment")
  );
  return establishment?.long_name ?? null;
}
