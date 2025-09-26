import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedMedicationData {
  name?: string;
  activeIngredient?: string;
  manufacturer?: string;
  concentration?: string;
  form?: string;
  route?: string;
  category?: string;
  prescriptionRequired?: boolean;
  registrationNumber?: string;
  storageInstructions?: string;
  packageQuantity?: string;
  indication?: string;
  contraindications?: string;
  dosage?: string;
  sideEffects?: string;
}

interface AIExtractionResult {
  success: boolean;
  data?: ExtractedMedicationData;
  confidence?: number;
  error?: string;
}

serve(async (req) => {
  console.log('Function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Processing URL:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Fetch page content
    let pageContent = '';
    try {
      console.log('Fetching page content...');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      pageContent = await response.text();
      console.log('Page content fetched, length:', pageContent.length);
    } catch (error) {
      console.error('Error fetching page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch page content: ${errorMessage}`);
    }

    // Clean HTML content for AI processing - preserve important structure and titles
    let cleanContent = pageContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '') // Remove navigation
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Remove header
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footer
      .replace(/<\/?[^>]+(>|$)/g, " ") // Remove HTML tags but keep content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Ensure we have meaningful content
    if (cleanContent.length < 200) {
      console.log('Content too short, trying alternative extraction...');
      // Try to get just the text content with minimal cleaning
      cleanContent = pageContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Limit content size but keep more content for better analysis
    cleanContent = cleanContent.substring(0, 15000); // Increased limit

    console.log('Cleaned content length:', cleanContent.length);

    // Use OpenAI to extract medication information
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em análise de medicamentos brasileiros. Sua tarefa é extrair informações PRECISAS sobre medicamentos de páginas web brasileiras.

ATENÇÃO CRÍTICA: O NOME DO MEDICAMENTO deve ser o NOME COMERCIAL do produto farmacêutico, NÃO um número de registro ou código!

COMO IDENTIFICAR O NOME CORRETO:
- Procure por títulos principais como "h1" ou títulos em destaque
- O nome comercial geralmente aparece no início da página
- Exemplo: Se vir "Toragesic 10mg com 20 comprimidos sublinguais EMS", o nome é "Toragesic"
- NUNCA use códigos numéricos como "51601" como nome do medicamento
- IGNORE números de registro, códigos de barras ou IDs de produtos

ESTRUTURA DE EXTRAÇÃO PARA SARA.COM.BR:
1. NOME: Extraia do título principal (ex: "Toragesic 10mg..." → nome = "Toragesic")
2. CONCENTRAÇÃO: Do título (ex: "Toragesic 10mg..." → concentração = "10mg")  
3. PRINCÍPIO ATIVO: Procure "Princípio Ativo:" (ex: "trometamol cetorolaco")
4. LABORATÓRIO: Procure "LABORATÓRIO:" (ex: "EMS")
5. FORMA: Procure "Forma farmacêutica:" ou no título (ex: "comprimidos sublinguais")
6. QUANTIDADE: Do título (ex: "com 20 comprimidos" → "20 comprimidos")

REGRAS OBRIGATÓRIAS:
- NOME deve ser apenas o nome comercial do medicamento (ex: "Toragesic", "Dipirona", "Amoxicilina")
- NÃO inclua dosagem, quantidade ou laboratório no campo nome
- NÃO use números de registro como nome (ex: "51601" está ERRADO)
- Se a descrição menciona categoria (ex: "anti-inflamatório"), extraia para category
- Para anti-inflamatórios, prescriptionRequired = true
- Se form contém "sublingual", route = "Sublingual"

EXEMPLO DE EXTRAÇÃO CORRETA:
Título da página: "Toragesic 10mg com 20 comprimidos sublinguais EMS"
Resultado esperado:
{
  "name": "Toragesic",
  "activeIngredient": "trometamol cetorolaco",
  "manufacturer": "EMS", 
  "concentration": "10mg",
  "form": "Comprimido Sublingual",
  "route": "Sublingual",
  "category": "Anti-inflamatório",
  "prescriptionRequired": true,
  "packageQuantity": "20 comprimidos",
  "indication": "Controle da dor aguda de intensidade moderada a intensa",
  ...
}

Analise TODO o conteúdo fornecido e retorne APENAS um JSON válido com as informações extraídas. Use null para campos não encontrados.`
          },
          {
            role: 'user',
            content: `Analise este conteúdo da página de medicamento e extraia as informações solicitadas:\n\n${cleanContent}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      throw new Error('Invalid AI response format');
    }

    let extractedData: ExtractedMedicationData;
    try {
      const content = aiData.choices[0].message.content.trim();
      console.log('AI content:', content);
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      extractedData = JSON.parse(jsonMatch[0]);
      console.log('Extracted data:', extractedData);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      throw new Error(`Failed to parse AI response: ${errorMessage}`);
    }

    // Calculate confidence based on how much data was extracted
    const fields = Object.values(extractedData).filter(value => value !== null && value !== undefined && value !== '');
    const confidence = Math.min(95, Math.max(30, (fields.length / 15) * 100));

    const result: AIExtractionResult = {
      success: true,
      data: extractedData,
      confidence: Math.round(confidence)
    };

    console.log('Extraction completed successfully:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-medication-ai function:', error);
    
    const errorResult: AIExtractionResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});