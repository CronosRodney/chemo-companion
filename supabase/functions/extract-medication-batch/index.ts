import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getUserFromRequest } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimiter.ts';

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

interface BatchExtractionResult {
  success: boolean;
  data?: ExtractedMedicationData;
  confidence?: number;
  sources?: string[];
  error?: string;
}

serve(async (req) => {
  console.log('Batch extraction function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const { userId, error: authError } = await getUserFromRequest(req);
    if (authError || !userId) {
      console.log('❌ Autenticação falhou:', authError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Autenticação necessária'
      }), { headers: corsHeaders, status: 401 });
    }

    // Verificar rate limit (10 req/min por usuário)
    const rateLimitResult = checkRateLimit(userId, { maxRequests: 10, windowMs: 60000 });
    if (!rateLimitResult.allowed) {
      console.log('⚠️ Rate limit excedido para usuário:', userId);
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return new Response(JSON.stringify({
        success: false,
        error: `Limite de requisições excedido. Tente novamente em ${resetIn} segundos.`
      }), { headers: corsHeaders, status: 429 });
    }

    console.log(`✅ Usuário autenticado: ${userId} (${rateLimitResult.remaining} requisições restantes)`);

    const { url } = await req.json();
    console.log('Processing batch extraction for URL:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Start both processes in parallel
    console.log('Starting parallel extraction: page content + screenshot');
    
    const [pageResult, screenshotResult] = await Promise.allSettled([
      extractFromPageContent(url, openAIApiKey),
      extractFromScreenshot(url, openAIApiKey)
    ]);

    // Combine results from both sources
    const combinedData = await combineExtractionResults(
      pageResult.status === 'fulfilled' ? pageResult.value : null,
      screenshotResult.status === 'fulfilled' ? screenshotResult.value : null,
      openAIApiKey
    );

    const sources = [];
    if (pageResult.status === 'fulfilled' && pageResult.value) sources.push('page-content');
    if (screenshotResult.status === 'fulfilled' && screenshotResult.value) sources.push('screenshot');

    // Calculate confidence based on how much data was extracted and source count
    const fields = Object.values(combinedData).filter(value => 
      value !== null && value !== undefined && value !== ''
    );
    const baseConfidence = (fields.length / 15) * 100;
    const sourceBonus = sources.length > 1 ? 20 : 0; // Bonus for multiple sources
    const confidence = Math.min(95, Math.max(30, baseConfidence + sourceBonus));

    const result: BatchExtractionResult = {
      success: true,
      data: combinedData,
      confidence: Math.round(confidence),
      sources: sources
    };

    console.log('Batch extraction completed successfully:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Internal]', error); // Log detalhado apenas no servidor
    
    const errorResult: BatchExtractionResult = {
      success: false,
      error: 'Erro ao processar extração de medicamento'
    };

    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractFromPageContent(url: string, apiKey: string): Promise<ExtractedMedicationData | null> {
  try {
    console.log('Extracting from page content...');
    
    // Fetch page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }
    
    const pageContent = await response.text();
    console.log('Page content fetched, length:', pageContent.length);

    // Clean content
    const cleanContent = pageContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, " ")
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000);

    console.log('Cleaned content length:', cleanContent.length);

    // Use OpenAI to extract information
    return await analyzeWithOpenAI(cleanContent, 'page-content', apiKey);

  } catch (error) {
    console.error('Page content extraction failed:', error);
    return null;
  }
}

async function extractFromScreenshot(url: string, apiKey: string): Promise<ExtractedMedicationData | null> {
  try {
    console.log('Extracting from screenshot...');
    
    // Get screenshot using our screenshot service
    const screenshotUrl = `https://screenshotapi.net/api/v1/screenshot?url=${encodeURIComponent(url)}&width=1200&height=800&output=image&file_type=png&wait_for_event=load`;
    
    const response = await fetch(screenshotUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Screenshot service error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const screenshot = `data:image/png;base64,${base64}`;

    console.log('Screenshot captured successfully');

    // Use OpenAI Vision to analyze screenshot
    return await analyzeScreenshotWithOpenAI(screenshot, apiKey);

  } catch (error) {
    console.error('Screenshot extraction failed:', error);
    return null;
  }
}

async function analyzeWithOpenAI(content: string, source: string, apiKey: string): Promise<ExtractedMedicationData | null> {
  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em análise de medicamentos brasileiros. Extraia informações PRECISAS baseadas no exemplo:

EXEMPLO PADRÃO - "Toragesic 10mg com 20 comprimidos sublinguais EMS":
- name: "Toragesic" (apenas nome comercial)
- concentration: "10mg" 
- packageQuantity: "20 comprimidos"
- form: "Comprimido Sublingual"
- manufacturer: "EMS"
- route: "Sublingual"

REGRAS OBRIGATÓRIAS:
1. Nome = primeira palavra do título (ex: "Toragesic")
2. NUNCA use códigos numéricos como nome
3. Concentração = dosagem (ex: "10mg")
4. Quantidade = número + unidade (ex: "20 comprimidos")
5. Forma = tipo farmacêutico (ex: "Comprimido Sublingual")
6. Via baseada na forma (sublingual → "Sublingual")
7. Fabricante = laboratório (ex: "EMS")

Retorne APENAS JSON válido com os campos encontrados, use null para não encontrados.`
          },
          {
            role: 'user',
            content: `Analise este conteúdo de ${source} e extraia informações do medicamento:\n\n${content}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content_response = aiData.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = content_response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error(`AI analysis failed for ${source}:`, error);
    return null;
  }
}

async function analyzeScreenshotWithOpenAI(screenshot: string, apiKey: string): Promise<ExtractedMedicationData | null> {
  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analise esta imagem de medicamento brasileiro e extraia informações seguindo o padrão:

EXEMPLO: "Toragesic 10mg com 20 comprimidos sublinguais EMS"
Extrair: name="Toragesic", concentration="10mg", packageQuantity="20 comprimidos", form="Comprimido Sublingual", manufacturer="EMS", route="Sublingual"

Procure por título principal, dosagem, quantidade, forma farmacêutica e laboratório.
Retorne APENAS JSON válido.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta imagem e extraia as informações do medicamento:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: screenshot
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI Vision API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content_response = aiData.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = content_response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('AI screenshot analysis failed:', error);
    return null;
  }
}

async function combineExtractionResults(
  pageData: ExtractedMedicationData | null,
  screenshotData: ExtractedMedicationData | null,
  apiKey: string
): Promise<ExtractedMedicationData> {
  // If we have both results, use AI to intelligently combine them
  if (pageData && screenshotData) {
    try {
      console.log('Combining results from both sources...');
      
      const combinePrompt = `Você tem duas extrações do mesmo medicamento de fontes diferentes. Combine-as inteligentemente:

DADOS DA PÁGINA: ${JSON.stringify(pageData)}
DADOS DA IMAGEM: ${JSON.stringify(screenshotData)}

REGRAS PARA COMBINAR:
1. Use dados mais específicos/completos
2. Para nome, concentração, forma: prefira dados mais precisos
3. Para descrições longas: use versão mais completa
4. Se conflito: priorize dados da imagem para nome/dosagem, página para descrições

Retorne JSON combinado com melhor informação de cada campo.`;

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Combine os dados de medicamento de forma inteligente. Retorne APENAS JSON válido.' },
            { role: 'user', content: combinePrompt }
          ],
          temperature: 0.1,
          max_tokens: 1000
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error('AI combination failed, using manual merge:', error);
    }
  }

  // Fallback: manual merge (screenshot data prioritized for key fields)
  const combined: ExtractedMedicationData = {};
  
  // Priority order: screenshot first for visual fields, then page content
  const sources = [screenshotData, pageData].filter(Boolean);
  
  for (const source of sources) {
    if (source) {
      Object.entries(source).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '' && !combined[key as keyof ExtractedMedicationData]) {
          (combined as any)[key] = value;
        }
      });
    }
  }

  return combined;
}