import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SymptomData {
  symptom_description: string;
  severity: number;
  onset_date: string;
  duration?: string;
  frequency?: string;
  triggers?: string;
  relieving_factors?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { symptoms }: { symptoms: SymptomData } = await req.json();

    if (!symptoms || !symptoms.symptom_description) {
      return new Response(
        JSON.stringify({ error: 'Symptom description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Você é um assistente médico especializado em oncologia. Um paciente em tratamento oncológico está relatando os seguintes sintomas:

DESCRIÇÃO DOS SINTOMAS:
${symptoms.symptom_description}

INFORMAÇÕES ADICIONAIS:
- Intensidade (1-10): ${symptoms.severity}
- Data de início: ${symptoms.onset_date}
${symptoms.duration ? `- Duração: ${symptoms.duration}` : ''}
${symptoms.frequency ? `- Frequência: ${symptoms.frequency}` : ''}
${symptoms.triggers ? `- Fatores que pioram: ${symptoms.triggers}` : ''}
${symptoms.relieving_factors ? `- Fatores que aliviam: ${symptoms.relieving_factors}` : ''}

Por favor, analise esses sintomas considerando o contexto de um paciente em tratamento oncológico e forneça:

1. AVALIAÇÃO DE SEVERIDADE: Classifique como "low", "moderate", "high" ou "urgent"
2. POSSÍVEIS CAUSAS: Liste 2-4 causas possíveis relacionadas ao tratamento ou condição
3. RECOMENDAÇÕES: 3-5 recomendações práticas
4. QUANDO PROCURAR AJUDA: 2-3 sinais de alerta que indicam necessidade de atendimento médico imediato
5. DICAS DE AUTOCUIDADO: 2-4 dicas simples para aliviar os sintomas

IMPORTANTE: 
- Seja empático e use linguagem simples
- Sempre enfatize que esta análise NÃO substitui consulta médica
- Considere efeitos colaterais comuns de quimioterapia
- Seja cauteloso com sintomas que podem indicar emergência oncológica

Responda APENAS em formato JSON válido, seguindo exatamente esta estrutura:
{
  "severity_assessment": "low|moderate|high|urgent",
  "possible_causes": ["causa1", "causa2"],
  "recommendations": ["recomendação1", "recomendação2"],
  "when_to_seek_help": ["sinal1", "sinal2"],
  "self_care_tips": ["dica1", "dica2"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente médico especializado em oncologia. Responda APENAS em JSON válido.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to analyze symptoms');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let analysis;
    try {
      // Clean the response if it has markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return a default analysis if parsing fails
      analysis = {
        severity_assessment: symptoms.severity >= 7 ? 'high' : symptoms.severity >= 4 ? 'moderate' : 'low',
        possible_causes: ['Efeito colateral do tratamento oncológico', 'Resposta inflamatória'],
        recommendations: [
          'Registre seus sintomas diariamente',
          'Mantenha-se hidratado',
          'Converse com sua equipe médica na próxima consulta'
        ],
        when_to_seek_help: [
          'Febre acima de 38°C',
          'Sintomas que pioram rapidamente',
          'Dificuldade para respirar'
        ],
        self_care_tips: [
          'Descanse sempre que necessário',
          'Evite atividades que pioram os sintomas'
        ]
      };
    }

    console.log('Symptom analysis completed:', { severity: analysis.severity_assessment });

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-symptoms:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
