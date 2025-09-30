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
  bulaFilesFound?: number;
}

// Helper function to search for bula download links in HTML
async function findBulaDownloadLinks(html: string, baseUrl: string): Promise<string[]> {
  console.log('🔍 Searching for bula download links...');
  const bulaLinks: string[] = [];
  
  // Regex patterns to find download links
  const linkPatterns = [
    /href=["']([^"']*bula[^"']*)["']/gi,
    /href=["']([^"']*\.pdf[^"']*)["']/gi,
    /href=["']([^"']*download[^"']*)["']/gi,
    /data-url=["']([^"']*bula[^"']*)["']/gi,
  ];
  
  for (const pattern of linkPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let link = match[1];
      
      // Check if link contains 'bula' or is a PDF
      if (link.toLowerCase().includes('bula') || link.toLowerCase().endsWith('.pdf')) {
        // Convert relative URLs to absolute
        if (!link.startsWith('http')) {
          const base = new URL(baseUrl);
          if (link.startsWith('/')) {
            link = `${base.origin}${link}`;
          } else {
            link = `${base.origin}/${link}`;
          }
        }
        
        if (!bulaLinks.includes(link)) {
          bulaLinks.push(link);
          console.log('📄 Found potential bula link:', link);
        }
      }
    }
  }
  
  return bulaLinks;
}

// Helper function to download and extract text from PDF
async function downloadAndExtractPDF(url: string): Promise<string> {
  console.log('📥 Downloading file from:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    console.log('📄 Content type:', contentType);
    
    // If it's a PDF, we'll need to extract text
    // For now, we'll try to get the text content if it's HTML or plain text
    if (contentType.includes('pdf')) {
      console.log('⚠️ PDF detected - using alternative text extraction');
      // For PDFs, we'd need a PDF parser library
      // As a workaround, we'll note this in the logs
      return '[PDF file detected but text extraction requires additional processing]';
    }
    
    const text = await response.text();
    console.log('✅ File downloaded, length:', text.length);
    return text;
    
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    return '';
  }
}

serve(async (req) => {
  console.log('🚀 Function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('🔗 Processing URL:', url);

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
      console.log('📡 Fetching page content...');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      pageContent = await response.text();
      console.log('✅ Page content fetched, length:', pageContent.length);
    } catch (error) {
      console.error('❌ Error fetching page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch page content: ${errorMessage}`);
    }

    // STEP 1: Search for bula download links
    const bulaLinks = await findBulaDownloadLinks(pageContent, url);
    let bulaContent = '';
    
    if (bulaLinks.length > 0) {
      console.log(`📋 Found ${bulaLinks.length} potential bula file(s)`);
      
      // Try to download and extract content from the first bula link
      for (const link of bulaLinks.slice(0, 2)) { // Try first 2 links max
        const content = await downloadAndExtractPDF(link);
        if (content && content.length > 100) {
          bulaContent += content + '\n\n';
          console.log('✅ Successfully extracted content from bula file');
          break; // Use first successful extraction
        }
      }
    } else {
      console.log('⚠️ No bula download links found, proceeding with page content extraction');
    }

    // STEP 2: Clean and prepare content for AI analysis
    console.log('🧹 Cleaning page content...');
    
    // Combine bula content with page content
    let combinedContent = '';
    if (bulaContent.length > 0) {
      console.log('📄 Using bula file content as primary source');
      combinedContent = `CONTEÚDO DA BULA:\n${bulaContent}\n\n`;
    }
    
    // Clean HTML content
    let cleanContent = pageContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, " ")
      .replace(/\s+/g, ' ')
      .trim();
    
    // Ensure we have meaningful content
    if (cleanContent.length < 200) {
      console.log('⚠️ Content too short, trying alternative extraction...');
      cleanContent = pageContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    combinedContent += `CONTEÚDO DA PÁGINA:\n${cleanContent}`;
    
    // Limit total content size
    combinedContent = combinedContent.substring(0, 20000);

    console.log('✅ Content prepared, total length:', combinedContent.length);

    // STEP 3: Use OpenAI to extract medication information
    console.log('🤖 Sending content to AI for analysis...');
    
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
            content: `Você é um especialista em análise de bulas e medicamentos brasileiros. Analise TODO o conteúdo fornecido (incluindo bulas em PDF quando disponíveis) e extraia informações COMPLETAS e PRECISAS.

EXEMPLO PERFEITO DE PADRÃO A SEGUIR:
Título: "Toragesic 10mg com 20 comprimidos sublinguais EMS"
Extração correta:
- name: "Toragesic" (apenas o nome comercial)
- concentration: "10mg" (dosagem)
- packageQuantity: "20 comprimidos" (quantidade na embalagem)
- form: "Comprimido Sublingual" (forma farmacêutica)
- manufacturer: "EMS" (laboratório)
- route: "Sublingual" (via de administração)

PADRÕES DE EXTRAÇÃO OBRIGATÓRIOS:

1. NOME DO MEDICAMENTO:
   - Extraia APENAS a primeira palavra do título que representa o nome comercial
   - Exemplos: "Toragesic 10mg..." → "Toragesic"
   - "Dipirona Sódica 500mg..." → "Dipirona"
   - "Amoxicilina 875mg..." → "Amoxicilina"
   - NUNCA use números de registro ou códigos

2. CONCENTRAÇÃO/DOSAGEM:
   - Padrões: "10mg", "500mg", "20mg/mL", "5%"
   - Extraia exatamente como aparece no título

3. QUANTIDADE NA EMBALAGEM:
   - Padrões: "20 comprimidos", "30 cápsulas", "100mL", "10 ampolas"
   - Procure "com X comprimidos", "caixa com X", "frasco com X"

4. FORMA FARMACÊUTICA:
   - Do título ou campo "Forma farmacêutica:"
   - Exemplos: "Comprimido Sublingual", "Cápsula", "Solução Oral", "Pomada"

5. VIA DE ADMINISTRAÇÃO:
   - Baseada na forma: "sublingual" → "Sublingual"
   - "oral" → "Oral", "injetável" → "Injetável", "tópica" → "Tópica"

6. FABRICANTE/LABORATÓRIO:
   - Procure "LABORATÓRIO:", "Fabricante:" ou no final do título
   - Exemplos: EMS, Medley, Eurofarma, Teuto, Germed

7. PRINCÍPIO ATIVO:
   - Procure "Princípio Ativo:", "Substância ativa:"
   - Exemplo: "trometamol cetorolaco"

8. CATEGORIA TERAPÊUTICA:
   - Da descrição: "anti-inflamatório", "analgésico", "antibiótico"

9. PRESCRIÇÃO MÉDICA:
   - Anti-inflamatórios, antibióticos: geralmente true
   - Analgésicos simples: pode ser false

INSTRUÇÕES ESPECÍFICAS:
- PRIORIZE conteúdo de bulas em PDF quando disponível (marcado como "CONTEÚDO DA BULA:")
- Analise TODO o conteúdo fornecido, incluindo bulas e página web
- Extraia informações completas de indicações, contraindicações, posologia e efeitos colaterais
- Use padrões regex para extrair informações precisas
- Para campos não encontrados, use null
- Seja consistente com a formatação
- Priorize informações do título principal para nome/concentração
- Use informações detalhadas da bula para campos clínicos

FORMATO DE RESPOSTA (JSON apenas):
{
  "name": "string ou null",
  "activeIngredient": "string ou null",
  "manufacturer": "string ou null", 
  "concentration": "string ou null",
  "form": "string ou null",
  "route": "string ou null",
  "category": "string ou null",
  "prescriptionRequired": boolean ou null,
  "registrationNumber": "string ou null",
  "storageInstructions": "string ou null",
  "packageQuantity": "string ou null",
  "indication": "string ou null",
  "contraindications": "string ou null",
  "dosage": "string ou null",
  "sideEffects": "string ou null"
}`
          },
          {
            role: 'user',
            content: `Analise este conteúdo (incluindo bulas em PDF quando disponíveis) e extraia TODAS as informações solicitadas:\n\n${combinedContent}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('✅ AI response received');

    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      throw new Error('Invalid AI response format');
    }

    // STEP 4: Parse and validate AI response
    let extractedData: ExtractedMedicationData;
    try {
      const content = aiData.choices[0].message.content.trim();
      console.log('📄 AI content received, length:', content.length);
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      extractedData = JSON.parse(jsonMatch[0]);
      console.log('✅ Extracted data:', JSON.stringify(extractedData, null, 2));
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      throw new Error(`Failed to parse AI response: ${errorMessage}`);
    }

    // Calculate confidence based on how much data was extracted
    const fields = Object.values(extractedData).filter(value => value !== null && value !== undefined && value !== '');
    const confidence = Math.min(95, Math.max(30, (fields.length / 15) * 100));
    
    // Bonus confidence if we used bula content
    const finalConfidence = bulaContent.length > 0 ? Math.min(95, confidence + 10) : confidence;

    const result: AIExtractionResult = {
      success: true,
      data: extractedData,
      confidence: Math.round(finalConfidence),
      ...(bulaLinks.length > 0 && { bulaFilesFound: bulaLinks.length })
    };

    console.log('🎉 Extraction completed successfully!');
    console.log('📊 Confidence:', result.confidence);
    console.log('📋 Fields extracted:', fields.length);

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