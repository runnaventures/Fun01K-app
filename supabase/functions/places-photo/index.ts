// supabase/functions/places-photo/index.ts
// Proxy for Google Places photos. ?name=<photo_name>&maxWidth=800

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (!GOOGLE_API_KEY) {
      return new Response("GOOGLE_PLACES_API_KEY not configured", {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(req.url);
    const photoName = url.searchParams.get("name");
    const maxWidth = Math.min(
      1600,
      Math.max(100, parseInt(url.searchParams.get("maxWidth") || "800", 10))
    );

    if (!photoName) {
      return new Response("Missing ?name= parameter", {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const photoUrl =
      `https://places.googleapis.com/v1/${photoName}/media` +
      `?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;

    const upstream = await fetch(photoUrl);

    if (!upstream.ok) {
      console.error("photo upstream error:", upstream.status);
      return new Response("Upstream error", {
        status: 502,
        headers: CORS_HEADERS,
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("places-photo error:", err);
    return new Response("Internal error", { status: 500, headers: CORS_HEADERS });
  }
});