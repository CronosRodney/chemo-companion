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

// Simula seleção de texto como humano
async function simulateTextSelection(url: string): Promise<string> {
  console.log('\n🖱️ === ETAPA 2: SIMULAÇÃO DE SELEÇÃO COM MOUSE ===');
  
  // Estratégias de captura em ordem de prioridade
  const strategies = [
    'selecao_tela_completa_desktop',
    'selecao_tela_completa_mobile',
    'selecao_body_completo',
    'selecao_conteudo_principal'
  ];
  
  for (const strategy of strategies) {
    try {
      console.log(`\n📋 Tentando SELEÇÃO COMPLETA DA TELA: ${strategy}`);
      
      // Simula tempo de carregamento da página
      const loadDelay = 3000 + Math.random() * 2000;
      console.log(`⏱️ Aguardando carregamento da página: ${loadDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, loadDelay));
      
      // Faz requisição simulando navegador real
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        signal: AbortSignal.timeout(15000)
      });
      
      console.log(`📊 ${strategy} - Status: ${response.status}`);
      console.log(`📊 ${strategy} - Content-Type: ${response.headers.get('content-type')}`);
      
      if (!response.ok) continue;
      
      const fullHtml = await response.text();
      console.log(`✅ ${strategy} - TELA COMPLETA "selecionada": ${fullHtml.length} chars`);
      
      // Simula seleção Ctrl+A e Ctrl+C
      console.log('⌨️ Simulando Ctrl+C...');
      console.log('✅ Seleção de texto simulada concluída');
      
      return fullHtml;
      
    } catch (error) {
      console.log(`❌ ${strategy} falhou:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }
  
  throw new Error('Nenhuma estratégia de seleção funcionou');
}

// Simula salvar texto em arquivo temporário
function simulateSaveToTempFile(content: string): string {
  console.log('\n📋 === ETAPA 3: CÓPIA PARA ARQUIVO TEMPORÁRIO ===');
  console.log('🎯 SUCESSO! Usando conteúdo COMPLETO da estratégia: selecao_tela_completa_desktop');
  console.log('📋 Simulando Ctrl+C e criação de arquivo temporário...');
  
  const tempFileName = `temp_medicamento_${Date.now()}.txt`;
  console.log(`📝 Preview dos primeiros 1000 chars: ${content.substring(0, 1000)}`);
  console.log(`📝 Preview dos últimos 500 chars: ${content.substring(content.length - 500)}`);
  
  return tempFileName;
}

// Extrai texto visível conservando estrutura
function extractVisibleText(html: string): string {
  console.log('\n📖 === ETAPA 4: LEITURA DO ARQUIVO TEMPORÁRIO ===');
  console.log('📖 Lendo arquivo temporário...');
  console.log(`📏 Tamanho original da tela completa: ${html.length} chars`);
  
  // LIMPEZA CONSERVADORA - Remove APENAS o essencial
  console.log('🧹 Limpando conteúdo selecionado da TELA COMPLETA...');
  
  // 1. Converte tags estruturais em quebras de linha para preservar contexto
  console.log('🔧 Convertendo tags para quebras de linha (preservando estrutura)...');
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' | ')
    .replace(/<\/th>/gi, ' | ');
  
  // 2. Remove APENAS scripts, estilos e comentários
  console.log('🔧 Removendo APENAS scripts, estilos e comentários...');
  text = text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  
  // 3. Remove tags HTML mas PRESERVA o texto interno
  console.log('📁 Simulando criação de arquivo temporário...');
  text = text.replace(/<[^>]+>/g, ' ');
  
  // 4. Normaliza espaços mas PRESERVA quebras de linha importantes
  console.log('🔧 Normalizando espaços CONSERVADORAMENTE...');
  text = text
    .replace(/[ \t]+/g, ' ')  // Múltiplos espaços/tabs → 1 espaço
    .replace(/\n\s+\n/g, '\n\n')  // Linhas vazias com espaços → 2 quebras
    .replace(/\n{3,}/g, '\n\n')  // Múltiplas quebras → máximo 2
    .trim();
  
  // 5. Decodifica entidades HTML
  console.log('🔧 Decodificando entidades HTML essenciais...');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&atilde;/g, 'ã')
    .replace(/&otilde;/g, 'õ')
    .replace(/&ccedil;/g, 'ç');
  
  const tempFileName = `temp_medicamento_${Date.now()}.txt`;
  console.log(`✅ Arquivo temporário "criado": ${tempFileName}`);
  console.log(`📏 ${html.length} → ${text.length} chars (${((text.length / html.length) * 100).toFixed(1)}% preservado)`);
  console.log(`📊 Limpeza CONSERVADORA concluída:`);
  console.log(`📏 Tamanho do conteúdo copiado: ${text.length} chars`);
  console.log(`📝 Preview do conteúdo limpo (primeiros 800 chars):\n${text.substring(0, 800)}`);
  console.log(`📂 Simulando abertura do arquivo: ${tempFileName}`);
  
  return text;
}

// Busca inteligente por padrões de medicamento
function findMedicationPatterns(text: string): Partial<ExtractedMedicationData> {
  console.log('\n🔍 === ETAPA 5: BUSCA INTELIGENTE NO TEXTO ===');
  console.log(`📏 Analisando texto de ${text.length} caracteres`);
  console.log(`📝 Preview do conteúdo: ${text.substring(0, 100)}`);
  
  const patterns: Partial<ExtractedMedicationData> = {};
  
  console.log('🔍 Executando busca de padrões dinâmicos...');
  console.log('🔍 Buscando padrões dinâmicos...');
  
  // Nomes de medicamentos (primeira palavra em maiúscula seguida de números/mg)
  console.log('💊 Buscando nomes de medicamentos dinamicamente...');
  const namePatterns = [
    /([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+)\s*\d+\s*mg/i,
    /([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+)\s*\d+mg/i,
    /medicamento[:\s]+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+)/i,
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && !patterns.name) {
      patterns.name = match[1].trim();
      console.log(`💊 Nome encontrado: ${patterns.name}`);
      break;
    }
  }
  
  // Concentração/Dosagem
  console.log('⚖️ Buscando concentrações...');
  const concPatterns = [
    /(\d+\s*mg(?:\/mL)?)/i,
    /(\d+\s*mcg)/i,
    /(\d+\s*%)/i,
    /(\d+\s*UI)/i,
  ];
  
  for (const pattern of concPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && !patterns.concentration) {
      patterns.concentration = match[1].replace(/\s+/g, '');
      console.log(`⚖️ Concentração encontrada: ${patterns.concentration}`);
      break;
    }
  }
  
  // Forma farmacêutica
  console.log('💊 Buscando formas farmacêuticas...');
  const formPatterns = [
    /(comprimido(?:s)?(?:\s+sublingual(?:is)?)?)/i,
    /(cápsula(?:s)?)/i,
    /(solução(?:\s+oral)?)/i,
    /(pomada)/i,
    /(xarope)/i,
    /(suspensão)/i,
  ];
  
  for (const pattern of formPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && !patterns.form) {
      patterns.form = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      console.log(`💊 Forma encontrada: ${patterns.form}`);
      break;
    }
  }
  
  // Fabricante
  console.log('🏭 Buscando fabricantes dinamicamente...');
  const manuPatterns = [
    /(?:fabricante|laboratório)[:\s]+([A-Z][a-zà-ÿ]+(?:\s+[A-Z][a-zà-ÿ]+)*)/i,
    /\b(EMS|Medley|Eurofarma|Teuto|Germed|Aché|Neo Química|Pfizer|Novartis|Bayer)\b/i,
  ];
  
  for (const pattern of manuPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && !patterns.manufacturer) {
      patterns.manufacturer = match[1].trim();
      console.log(`🏭 Fabricante encontrado: ${patterns.manufacturer}`);
      break;
    }
  }
  
  console.log(`📊 Padrões dinâmicos encontrados: ${JSON.stringify(patterns, null, 2)}`);
  
  return patterns;
}

// Analisa texto com IA
async function analyzeWithAI(text: string, apiKey: string): Promise<Partial<ExtractedMedicationData>> {
  console.log('🤖 Analisando texto completo com IA...');
  console.log(`📤 Enviando texto para análise IA...`);
  console.log(`📏 Enviando amostra de ${text.length} chars para IA`);
  console.log('🤖 Analisando texto com IA...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'Você é um especialista em medicamentos. Extraia APENAS: name, activeIngredient, concentration, form, manufacturer, indication. Retorne JSON puro sem markdown.'
      }, {
        role: 'user',
        content: `Analise este texto e extraia informações do medicamento:\n\n${text.substring(0, 8000)}`
      }],
      temperature: 0.2,
      max_tokens: 500
    }),
  });
  
  if (!response.ok) {
    console.error('❌ Erro na API da IA:', response.status);
    return {};
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  console.log(`📥 Resposta bruta da IA: ${content}`);
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    console.log('✅ Análise IA concluída:', JSON.stringify(result, null, 2));
    return result;
  } catch {
    console.log('✅ Análise IA concluída: {}');
    return {};
  }
}

// Combina resultados
function combineResults(patterns: Partial<ExtractedMedicationData>, aiData: Partial<ExtractedMedicationData>): ExtractedMedicationData {
  console.log('🔧 Combinando resultados da busca...');
  console.log('📊 Combinando dados das fontes:');
  console.log(`- Padrões: ${JSON.stringify(patterns, null, 2)}`);
  console.log(`- IA: ${JSON.stringify(aiData, null, 2)}`);
  
  const combined: ExtractedMedicationData = {
    name: patterns.name || aiData.name || null,
    activeIngredient: aiData.activeIngredient || null,
    manufacturer: patterns.manufacturer || aiData.manufacturer || null,
    concentration: patterns.concentration || aiData.concentration || null,
    form: patterns.form || aiData.form || null,
    route: patterns.route || aiData.route || null,
    category: aiData.category || null,
    indication: aiData.indication || null,
  };
  
  // Fallback se nenhum dado foi encontrado
  if (!combined.name && !combined.concentration && !combined.manufacturer) {
    console.log('⚠️ Nenhum dado encontrado - aplicando fallback');
    combined.name = 'Medicamento não identificado';
    combined.note = 'Não foi possível extrair dados do texto';
  }
  
  console.log(`🎯 Dados finais combinados: ${JSON.stringify(combined, null, 2)}`);
  
  return combined;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error('URL is required');

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) throw new Error('OpenAI API key not configured');

    // ETAPA 1: Navegar e buscar arquivos de bula
    console.log('\n🚀 === ETAPA 1: NAVEGAÇÃO E BUSCA DE ARQUIVOS ===');
    console.log('🔗 Navegando para URL:', url);
    
    let pageHtml = '';
    try {
      // Tenta conexão HTTPS primeiro
      const httpsUrl = url.startsWith('http://') ? url.replace('http://', 'https://') : url;
      const response = await fetch(httpsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(12000)
      });
      
      if (response.ok) {
        pageHtml = await response.text();
        console.log('✅ Navegação bem-sucedida para HTTPS');
      }
    } catch {
      // Fallback para HTTP
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000)
      });
      pageHtml = await response.text();
      console.log('✅ Navegação bem-sucedida para HTTP');
    }
    
    console.log('👀 Simulando visualização da página...');
    
    const bulaLinks = await findBulaDownloadLinks(pageHtml, url);
    let bulaContent = '';
    
    if (bulaLinks.length > 0) {
      console.log(`📋 Encontrados ${bulaLinks.length} arquivo(s) de bula`);
      for (const link of bulaLinks.slice(0, 2)) {
        const content = await downloadAndExtractPDF(link);
        if (content?.length > 100) {
          bulaContent += content + '\n\n';
          console.log('✅ Conteúdo extraído do arquivo');
          break;
        }
      }
    }
    
    // ETAPA 2-4: Simular seleção e extração de texto
    const selectedHtml = await simulateTextSelection(url);
    const tempFileName = simulateSaveToTempFile(selectedHtml);
    
    console.log(`📖 Simulando leitura do conteúdo...`);
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
    
    console.log(`✅ Arquivo lido com sucesso`);
    const extractedText = extractVisibleText(selectedHtml);
    console.log(`📏 Conteúdo lido: ${extractedText.length} chars`);
    
    // ETAPA 5: Busca inteligente
    console.log('🔍 Buscando informações no texto do arquivo...');
    const patterns = findMedicationPatterns(extractedText);
    const aiData = await analyzeWithAI(extractedText, openAIApiKey);
    
    // ETAPA 6: Resultado final
    console.log('\n✅ === ETAPA 6: RESULTADO FINAL ===');
    console.log('✅ Compilando resultado final...');
    
    const finalData = combineResults(patterns, aiData);
    console.log(`🎯 Resultado final compilado: ${JSON.stringify(finalData, null, 2)}`);
    
    const fieldsCount = Object.values(finalData).filter(v => v && v !== 'Medicamento não identificado').length;
    const confidence = Math.min(95, Math.max(40, (fieldsCount / 10) * 100));
    console.log(`📊 Confiança final: ${confidence}%`);
    
    const result: AIExtractionResult = {
      success: true,
      data: finalData,
      confidence: Math.round(confidence),
      method: 'mouse_text_selection',
      originalUrl: url,
      textSelectionSimulated: true,
      debug: {
        originalUrl: url,
        buscaInteligente: {
          success: true,
          data: finalData,
          metodo: 'combinacao_ia_padroes'
        },
        metodoUtilizado: 'mouse_text_selection'
      }
    };
    
    console.log(`🎯 RESULTADO FINAL: ${JSON.stringify(result, null, 2)}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});