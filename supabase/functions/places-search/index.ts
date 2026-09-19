// supabase/functions/places-search/index.ts
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const DEFAULT_LAT = 33.749;
const DEFAULT_LNG = -84.388;

async function geocodeCity(city: string) {
  const url = `${GEOCODE_URL}?address=${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const result = json?.results?.[0];
  if (!result) return null;
  return { lat: result.geometry.location.lat, lng: result.geometry.location.lng };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  try {
    if (!GOOGLE_API_KEY) return new Response(JSON.stringify({ error: "GOOGLE_PLACES_API_KEY not configured" }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    const body = await req.json().catch(() => ({}));
    const { city, latitude, longitude, keyword, radiusMeters = 5000, maxResults = 20 } = body ?? {};
    let lat: number | null = latitude ?? null;
    let lng: number | null = longitude ?? null;
    if ((lat === null || lng === null) && city) {
      const geo = await geocodeCity(city);
      if (geo) { lat = geo.lat; lng = geo.lng; }
    }
    if (lat === null || lng === null) { lat = DEFAULT_LAT; lng = DEFAULT_LNG; }
    const fieldMask = ["places.id","places.displayName","places.formattedAddress","places.location","places.rating","places.userRatingCount","places.photos","places.types","places.currentOpeningHours.openNow"].join(",");
    const hasKeyword = keyword && typeof keyword === "string" && keyword.trim().length > 0;
    const url = hasKeyword ? TEXT_URL : NEARBY_URL;
    const payload: Record<string, unknown> = hasKeyword
      ? { textQuery: keyword!.trim(), maxResultCount: Math.min(20, maxResults), locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: Math.min(50000, radiusMeters) } } }
      : { maxResultCount: Math.min(20, maxResults), locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: Math.min(50000, radiusMeters) } } };
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_API_KEY, "X-Goog-FieldMask": fieldMask }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: "places_api_error", status: res.status, detail: text }), { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }
    const json = await res.json();
    const rawPlaces = json?.places ?? [];
    const places = rawPlaces.map((p: any) => ({ place_id: p.id, name: p.displayName?.text ?? "Unknown", address: p.formattedAddress ?? "", latitude: p.location?.latitude ?? null, longitude: p.location?.longitude ?? null, rating: p.rating ?? null, user_ratings_total: p.userRatingCount ?? null, photo_name: p.photos?.[0]?.name ?? null, types: p.types ?? [], open_now: p.currentOpeningHours?.openNow ?? null }));
    return new Response(JSON.stringify({ places, resolved_center: { latitude: lat, longitude: lng } }), { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", detail: String(err) }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});
