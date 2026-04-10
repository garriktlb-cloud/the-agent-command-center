const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { placeId, sessionToken } = await req.json();

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: "placeId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "addressComponents,formattedAddress",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Place details error:", errText);
      return new Response(
        JSON.stringify({ error: "Google API error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const components = data.addressComponents || [];

    const get = (type: string) =>
      components.find((c: any) => c.types?.includes(type))?.longText || "";
    const getShort = (type: string) =>
      components.find((c: any) => c.types?.includes(type))?.shortText || "";

    const streetNumber = get("street_number");
    const route = get("route");
    const address = [streetNumber, route].filter(Boolean).join(" ");

    return new Response(
      JSON.stringify({
        address,
        city: get("locality") || get("sublocality"),
        state: getShort("administrative_area_level_1"),
        zip: get("postal_code"),
        formatted: data.formattedAddress || "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
