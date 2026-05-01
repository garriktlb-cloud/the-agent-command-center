// Edge function: parse-contract
// Extracts key fields from an uploaded Colorado Residential Contract PDF using Lovable AI.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedContract {
  mec_date: string | null;
  closing_date: string | null;
  possession_date: string | null;
  contract_price: number | null;
  earnest_money_amount: number | null;
  earnest_money_due: string | null;
  buyer_names: string[];
  seller_names: string[];
  property_address: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error("Supabase env vars missing");

    const { contract_path } = await req.json();
    if (!contract_path || typeof contract_path !== "string") {
      return new Response(JSON.stringify({ error: "contract_path required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download PDF from private bucket using service role
    const fileRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/contracts/${contract_path}`,
      { headers: { Authorization: `Bearer ${SERVICE_ROLE}` } }
    );
    if (!fileRes.ok) {
      const t = await fileRes.text();
      throw new Error(`Failed to fetch contract PDF (${fileRes.status}): ${t}`);
    }
    const pdfBytes = new Uint8Array(await fileRes.arrayBuffer());

    // base64 encode
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      binary += String.fromCharCode(...pdfBytes.subarray(i, i + chunkSize));
    }
    const b64 = btoa(binary);

    // Call Lovable AI gateway
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You extract structured fields from Colorado Residential Contract to Buy and Sell Real Estate (CBS) PDFs. Return only what is explicitly in the document. Use ISO date format YYYY-MM-DD. If a field is not present, return null.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the contract fields from this Colorado real estate contract PDF.",
              },
              {
                type: "image_url",
                image_url: { url: `data:application/pdf;base64,${b64}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_contract",
              description: "Return extracted Colorado contract fields.",
              parameters: {
                type: "object",
                properties: {
                  mec_date: {
                    type: ["string", "null"],
                    description: "Mutual Execution Date (acceptance date), YYYY-MM-DD",
                  },
                  closing_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
                  possession_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
                  contract_price: { type: ["number", "null"], description: "Purchase price USD" },
                  earnest_money_amount: { type: ["number", "null"] },
                  earnest_money_due: { type: ["string", "null"], description: "YYYY-MM-DD" },
                  buyer_names: { type: "array", items: { type: "string" } },
                  seller_names: { type: "array", items: { type: "string" } },
                  property_address: { type: ["string", "null"] },
                },
                required: [
                  "mec_date",
                  "closing_date",
                  "possession_date",
                  "contract_price",
                  "earnest_money_amount",
                  "earnest_money_due",
                  "buyer_names",
                  "seller_names",
                  "property_address",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_contract" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({
          error: "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call returned:", JSON.stringify(aiJson));
      return new Response(JSON.stringify({ error: "Could not extract contract fields" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted: ExtractedContract = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ data: extracted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-contract error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
