// supabase/functions/voice-order-capture/index.ts
// Accepts an audio file, transcribes it, and parses it into one or more
// structured order drafts using the Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SERVICE_TYPES = ["photography", "lockbox", "sign", "cleaning", "staging"] as const;

const SERVICE_HINTS = `
Service definitions and the JSON shape of "details" for each:
- photography: { shoot_type?: "Standard HDR"|"HDR + Drone"|"Twilight"|"Full package (HDR + Drone + Twilight + Tour)", preferred_date?: YYYY-MM-DD, preferred_time?: HH:MM, access_instructions?: string, special_instructions?: string }
- lockbox: { action?: "Install"|"Remove"|"Relocate", needed_by?: YYYY-MM-DD, gate_code?: string, placement?: string, key_location?: string }
- sign: { action?: "Install"|"Remove"|"Add rider", rider?: "None"|"Coming Soon"|"Open House"|"Under Contract"|"Sold", needed_by?: YYYY-MM-DD, placement?: string }
- cleaning: { clean_type?: "Standard"|"Deep clean"|"Move-out"|"Post-construction", preferred_date?: YYYY-MM-DD, sqft?: number, windows?: boolean, appliances?: boolean, special_instructions?: string }
- staging: { staging_type?: "Full"|"Partial"|"Vacant accent"|"Consultation only", preferred_date?: YYYY-MM-DD, duration_months?: number, rooms?: string, style_notes?: string }
`;

const SYSTEM_PROMPT = `You are an assistant that parses real estate agents' voice notes into one or more service order drafts.

The agent may request multiple services in one note (e.g. lockbox + photography). Return EVERY distinct service request.

${SERVICE_HINTS}

Rules:
- service_type MUST be one of: ${SERVICE_TYPES.join(", ")}.
- If the agent mentions a property address, put it in "property_hint" verbatim.
- If they reference a specific date in natural language (e.g. "Friday", "tomorrow"), convert to ISO date based on today's date provided in the user message.
- "notes" is a short free-text summary of anything not captured by the structured fields.
- "confidence" is 0–1 reflecting how confident you are in this parse.
- If you cannot identify any orders, return an empty array.`;

const TOOL = {
  type: "function" as const,
  function: {
    name: "parse_orders",
    description: "Return parsed order drafts.",
    parameters: {
      type: "object",
      properties: {
        orders: {
          type: "array",
          items: {
            type: "object",
            properties: {
              service_type: { type: "string", enum: [...SERVICE_TYPES] },
              property_hint: { type: "string", description: "Address or property reference mentioned" },
              details: { type: "object", description: "Service-specific structured fields" },
              notes: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["service_type", "details", "confidence"],
            additionalProperties: false,
          },
        },
      },
      required: ["orders"],
      additionalProperties: false,
    },
  },
};

interface ReqBody {
  audio_base64?: string;   // raw audio to transcribe
  mime_type?: string;      // e.g. "audio/webm"
  transcript?: string;     // OR provide a transcript directly
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;

    let transcript = body.transcript?.trim() || "";

    // Step 1 — transcribe if audio provided
    if (!transcript && body.audio_base64) {
      const mime = body.mime_type || "audio/webm";
      const transcribeResp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Transcribe this audio verbatim. Return only the transcription text, no commentary." },
                { type: "input_audio", input_audio: { data: body.audio_base64, format: mime.includes("mp3") ? "mp3" : "webm" } },
              ],
            },
          ],
        }),
      });

      if (!transcribeResp.ok) {
        const errText = await transcribeResp.text();
        console.error("Transcription failed:", transcribeResp.status, errText);
        if (transcribeResp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (transcribeResp.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Transcription failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const tdata = await transcribeResp.json();
      transcript = tdata?.choices?.[0]?.message?.content?.trim?.() || "";
    }

    if (!transcript) {
      return new Response(JSON.stringify({ error: "No transcript or audio provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2 — parse into structured orders
    const today = new Date().toISOString().slice(0, 10);
    const parseResp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Today is ${today}.\n\nAgent voice note:\n"""${transcript}"""` },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "parse_orders" } },
      }),
    });

    if (!parseResp.ok) {
      const errText = await parseResp.text();
      console.error("Parse failed:", parseResp.status, errText);
      if (parseResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (parseResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Order parsing failed", transcript }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const pdata = await parseResp.json();
    const toolCall = pdata?.choices?.[0]?.message?.tool_calls?.[0];
    let orders: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        orders = Array.isArray(parsed.orders) ? parsed.orders : [];
      } catch (e) {
        console.error("Tool args parse failed:", e);
      }
    }

    return new Response(JSON.stringify({ transcript, orders }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("voice-order-capture error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
