import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { getUserFromRequest } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_INSIGHT = {
  summary: "Análise diária concluída. Nenhuma alteração significativa detectada.",
  recommendations: [],
};

const SYSTEM_PROMPT = `Você é um assistente educacional oncológico.
Não forneça diagnóstico médico.
Não prescreva medicamentos.
Não substitua equipe médica.
Forneça apenas orientações educativas baseadas nos dados recebidos.
Nunca utilize linguagem alarmista.
Caso detecte padrão preocupante, use severity "warning" com texto moderado e educativo.
Nunca use termos como "grave", "risco imediato", "emergencial" ou "interrompa tratamento".
Máximo 3 recomendações.
Responda em português brasileiro.`;

async function sha256(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const { userId, error: authError } = await getUserFromRequest(req);
    if (authError || !userId) {
      return new Response(JSON.stringify({ error: authError || "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit
    const rl = checkRateLimit(userId, { maxRequests: 5, windowMs: 60000 });
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em breve." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { protocol, cycleCurrent, totalCycles, adherence, recentSymptoms, abnormalLabs } = body;

    // Sanitize — structured data only, no PII
    const sanitizedInput = {
      protocol: String(protocol || "").slice(0, 50),
      cycleCurrent: Number(cycleCurrent) || 0,
      totalCycles: Number(totalCycles) || 0,
      adherence: Number(adherence) || 0,
      abnormalLabs: (Array.isArray(abnormalLabs) ? abnormalLabs : [])
        .map((l: unknown) => String(l).slice(0, 60))
        .slice(0, 10),
      recentSymptoms: (Array.isArray(recentSymptoms) ? recentSymptoms : [])
        .map((s: unknown) => String(s).slice(0, 60))
        .slice(0, 10),
    };

    const stateString = JSON.stringify(sanitizedInput);
    const stateHash = await sha256(stateString);

    // Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Cache check: same hash today?
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: cached } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("user_id", userId)
      .eq("clinical_state_hash", stateHash)
      .gte("generated_at", todayStart.toISOString())
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      return new Response(JSON.stringify(cached.content_json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI Gateway (Gemini)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify(FALLBACK_INSIGHT), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Paciente em tratamento:
- Protocolo: ${sanitizedInput.protocol}
- Ciclo atual: ${sanitizedInput.cycleCurrent}/${sanitizedInput.totalCycles}
- Adesão: ${sanitizedInput.adherence}%
- Sintomas recentes: ${sanitizedInput.recentSymptoms.length > 0 ? sanitizedInput.recentSymptoms.join(", ") : "nenhum relatado"}
- Exames alterados: ${sanitizedInput.abnormalLabs.length > 0 ? sanitizedInput.abnormalLabs.join(", ") : "nenhum alterado"}

Gere 1 resumo breve e até 3 recomendações educativas.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_insights",
              description: "Gera insights oncológicos educativos estruturados",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                        severity: { type: "string", enum: ["info", "warning"] },
                      },
                      required: ["title", "content", "severity"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_insights" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("AI gateway error:", status, await aiResponse.text());

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições da IA excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fallback
      return new Response(JSON.stringify(FALLBACK_INSIGHT), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let insight = FALLBACK_INSIGHT;

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        // Validate schema
        if (
          typeof parsed.summary === "string" &&
          Array.isArray(parsed.recommendations) &&
          parsed.recommendations.length <= 3 &&
          parsed.recommendations.every(
            (r: any) =>
              typeof r.title === "string" &&
              typeof r.content === "string" &&
              (r.severity === "info" || r.severity === "warning")
          )
        ) {
          insight = {
            summary: parsed.summary.slice(0, 500),
            recommendations: parsed.recommendations.slice(0, 3),
          };
        }
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    // Save to DB with clinical state for auditing
    await supabase.from("ai_insights").insert({
      user_id: userId,
      content_json: insight,
      clinical_state: sanitizedInput,
      clinical_state_hash: stateHash,
    });

    return new Response(JSON.stringify(insight), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-onco-insights error:", e);
    return new Response(JSON.stringify(FALLBACK_INSIGHT), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
