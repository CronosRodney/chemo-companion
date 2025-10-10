import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ESTRATÉGIA: Download e análise de arquivos de medicamento

interface ExtractedMedicationData {
  name?: string;
  activeIngredient?: string;
  concentration?: string;
  form?: string;
  manufacturer?: string;
  route?: string;
  indication?: string;
  contraindications?: string;
  dosage?: string;
  sideEffects?: string;
  packageQuantity?: string;
  note?: string;
}

interface ArquivoBaixado {
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  contentType: string;
}

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const body = await req.json();
    const url = body.url;
    
    console.log('📁 === ESTRATÉGIA DE DOWNLOAD DE ARQUIVO ===');
    console.log('📥 URL recebida:', url);
    
    if (!url) {
      console.log('❌ ERRO: URL não fornecida');
      return new Response(JSON.stringify({
        success: false,
        error: 'URL é obrigatória'
      }), { headers, status: 400 });
    }

    // IMPORTANTE: Usa OPENAI_API_KEY (não ONCOTRACK_OPENAI_KEY)
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.log('❌ ERRO: OpenAI API key não configurada');
      throw new Error('OPENAI_API_KEY not configured');
    }
    
    console.log('✅ OpenAI API key encontrada');
    
    const result = await buscarEBaixarArquivoMedicamento(url, openAIApiKey);
    
    console.log('🎯 RESULTADO FINAL:', JSON.stringify(result, null, 2));
    
    return new Response(JSON.stringify(result), { headers });
    
  } catch (error) {
    console.log('💥 ERRO GERAL:', error.message);
    console.log('📍 Stack trace:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { headers, status: 500 });
  }
});

async function buscarEBaixarArquivoMedicamento(originalUrl: string, apiKey: string) {
  console.log('\n📁 === INICIANDO BUSCA POR ARQUIVO DE MEDICAMENTO ===');
  
  // ETAPA 1: ACESSAR PÁGINA (OTIMIZADO - SEM DELAYS LONGOS)
  console.log('\n🚶 ETAPA 1: Acessando página...');
  const paginaConteudo = await acessarPagina(originalUrl);
  
  if (!paginaConteudo.success) {
    console.log('❌ Falha ao acessar página');
    return {
      success: false,
      error: 'Não foi possível acessar a página',
      data: { name: 'Erro de acesso' }
    };
  }
  
  // ETAPA 2: PROCURAR LINKS DE DOWNLOAD
  console.log('\n🔍 ETAPA 2: Procurando links de download...');
  const linksDownload = procurarLinksDownload(paginaConteudo.conteudo, originalUrl);
  
  if (linksDownload.length === 0) {
    console.log('⚠️ Nenhum link de download encontrado');
    // Tenta análise do texto da página
    return await analisarTextoPagina(paginaConteudo.conteudo, apiKey, originalUrl);
  }
  
  console.log(`✅ Encontrados ${linksDownload.length} links de download`);
  
  // ETAPA 3: BAIXAR ARQUIVOS (MÁXIMO 3 PARA OTIMIZAR TIMEOUT)
  console.log('\n⬇️ ETAPA 3: Baixando arquivos...');
  const arquivosBaixados = await baixarArquivos(linksDownload.slice(0, 3), originalUrl);
  
  if (arquivosBaixados.length === 0) {
    console.log('⚠️ Nenhum arquivo foi baixado com sucesso');
    // Fallback: análise do texto da página
    return await analisarTextoPagina(paginaConteudo.conteudo, apiKey, originalUrl);
  }
  
  console.log(`✅ ${arquivosBaixados.length} arquivos baixados`);
  
  // ETAPA 4: ANALISAR ARQUIVOS COM IA
  console.log('\n🧠 ETAPA 4: Analisando com IA...');
  const analiseCompleta = await analisarArquivosComIA(arquivosBaixados, apiKey);
  
  // ETAPA 5: COMBINAR RESULTADOS
  console.log('\n🔄 ETAPA 5: Combinando resultados...');
  const resultadoFinal = combinarResultados(analiseCompleta);
  
  return {
    success: true,
    data: resultadoFinal.data,
    confidence: resultadoFinal.confidence,
    method: 'download_file_strategy',
    arquivosEncontrados: linksDownload.length,
    arquivosBaixados: arquivosBaixados.length
  };
}

async function acessarPagina(url: string) {
  console.log('🚶 Acessando página:', url);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9',
  };
  
  try {
    // IMPORTANTE: Seguir redirecionamentos automaticamente
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      redirect: 'follow', // Segue redirecionamentos automaticamente
      signal: AbortSignal.timeout(15000) // 15s timeout (aumentado para redirecionamentos)
    });
    
    console.log('📊 Status:', response.status);
    const finalUrl = response.url || url;
    
    if (finalUrl !== url) {
      console.log('🔀 Redirecionado para:', finalUrl);
    }
    
    if (response.ok) {
      const conteudo = await response.text();
      console.log('✅ Página carregada:', conteudo.length, 'chars');
      
      // Verifica se tem meta refresh (redirecionamento HTML)
      const metaRefreshMatch = conteudo.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^;"]*;?\s*url=([^"']+)["'][^>]*>/i);
      if (metaRefreshMatch && metaRefreshMatch[1]) {
        const redirectUrl = metaRefreshMatch[1].trim();
        console.log('🔀 Meta refresh detectado, redirecionando para:', redirectUrl);
        
        // Se for URL relativa, converte para absoluta
        const absoluteRedirectUrl = redirectUrl.startsWith('http') 
          ? redirectUrl 
          : new URL(redirectUrl, finalUrl).href;
        
        // Faz nova requisição para a URL de redirecionamento
        return await acessarPagina(absoluteRedirectUrl);
      }
      
      return {
        success: true,
        conteudo: conteudo,
        url: finalUrl
      };
    }
    
    return { success: false };
    
  } catch (error) {
    console.log('❌ Erro ao acessar:', error.message);
    return { success: false };
  }
}

function procurarLinksDownload(html: string, baseUrl: string) {
  console.log('🔍 Procurando links...');
  
  const linksEncontrados: Array<{url: string, tipo: string}> = [];
  
  // PADRÕES DE BUSCA OTIMIZADOS
  const padroes = [
    /href\s*=\s*["']([^"']*(?:bula|ficha|leaflet|documento)[^"']*)["']/gi,
    /href\s*=\s*["']([^"']*\.pdf[^"']*)["']/gi,
  ];
  
  for (const padrao of padroes) {
    const matches = [...html.matchAll(padrao)];
    
    for (const match of matches) {
      if (match[1]) {
        let link = match[1];
        
        // Converte para URL absoluta
        if (link.startsWith('/')) {
          const urlBase = new URL(baseUrl);
          link = `${urlBase.protocol}//${urlBase.host}${link}`;
        } else if (!link.startsWith('http')) {
          const urlBase = new URL(baseUrl);
          link = `${urlBase.protocol}//${urlBase.host}/${link}`;
        }
        
        linksEncontrados.push({ url: link, tipo: 'pdf' });
        console.log('🔗 Link encontrado:', link);
      }
    }
  }
  
  // Remove duplicatas
  const unicos = linksEncontrados.filter((link, index, self) => 
    index === self.findIndex(l => l.url === link.url)
  );
  
  console.log(`📊 ${unicos.length} links únicos`);
  return unicos;
}

async function baixarArquivos(links: Array<{url: string, tipo: string}>, baseUrl: string) {
  console.log('⬇️ Iniciando downloads...');
  
  const arquivos: ArquivoBaixado[] = [];
  
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    console.log(`📥 Download ${i + 1}/${links.length}: ${link.url}`);
    
    try {
      const response = await fetch(link.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': baseUrl,
        },
        signal: AbortSignal.timeout(12000) // 12s timeout por arquivo
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const conteudo = await response.text();
        const contentType = response.headers.get('content-type') || '';
        
        let tipo = 'texto';
        if (contentType.includes('pdf')) tipo = 'pdf';
        else if (contentType.includes('html')) tipo = 'html';
        
        arquivos.push({
          nome: `arquivo_${i + 1}`,
          url: link.url,
          tipo: tipo,
          tamanho: conteudo.length,
          conteudo: conteudo,
          contentType: contentType
        });
        
        console.log(`✅ Baixado: ${tipo} (${conteudo.length} chars)`);
      }
      
    } catch (error) {
      console.log(`❌ Erro no download:`, error.message);
    }
  }
  
  console.log(`📊 Total baixado: ${arquivos.length}`);
  return arquivos;
}

async function analisarArquivosComIA(arquivos: ArquivoBaixado[], apiKey: string) {
  console.log('🧠 Analisando com IA...');
  
  const analises = [];
  
  for (const arquivo of arquivos) {
    console.log(`🔍 Analisando ${arquivo.nome} (${arquivo.tipo})`);
    
    try {
      let conteudo = arquivo.conteudo;
      
      // Limpeza básica HTML
      if (arquivo.tipo === 'html') {
        conteudo = conteudo.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        conteudo = conteudo.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        conteudo = conteudo.replace(/<[^>]+>/g, ' ');
        conteudo = conteudo.replace(/\s+/g, ' ');
      }
      
      // Pega amostra para IA (máximo 4000 chars)
      const amostra = conteudo.substring(0, 4000);
      console.log(`📏 Amostra: ${amostra.length} chars`);
      
      const prompt = `Analise este arquivo de medicamento e extraia informações.

IMPORTANTE: Extraia APENAS informações explícitas no texto. NÃO invente dados.

CONTEÚDO:
${amostra}

Responda APENAS JSON válido:
{
  "name": "nome do medicamento",
  "activeIngredient": "princípio ativo",
  "concentration": "concentração",
  "form": "forma farmacêutica",
  "manufacturer": "fabricante",
  "indication": "indicação"
}`;

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 500
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content.trim();
        
        console.log(`🤖 IA respondeu: ${content.substring(0, 150)}...`);
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          
          // Remove campos vazios ou nulos
          Object.keys(data).forEach(key => {
            if (!data[key] || data[key] === 'null' || data[key] === '' || data[key].toLowerCase().includes('não mencionado')) {
              delete data[key];
            }
          });
          
          analises.push({
            arquivo: arquivo.nome,
            tipo: arquivo.tipo,
            dados: data,
            sucesso: true
          });
          
          console.log(`✅ Extraído:`, Object.keys(data).join(', '));
        } else {
          console.log(`⚠️ Nenhum JSON na resposta`);
          analises.push({ arquivo: arquivo.nome, sucesso: false });
        }
      } else {
        console.log(`❌ Erro na API IA:`, aiResponse.status);
        analises.push({ arquivo: arquivo.nome, sucesso: false });
      }
      
    } catch (error) {
      console.log(`❌ Erro:`, error.message);
      analises.push({ arquivo: arquivo.nome, sucesso: false });
    }
  }
  
  console.log(`📊 Análises: ${analises.filter(a => a.sucesso).length}/${analises.length} sucessos`);
  return analises;
}

async function analisarTextoPagina(html: string, apiKey: string, url: string) {
  console.log('📄 Analisando texto da página como fallback...');
  
  // Limpeza MELHORADA do HTML
  let texto = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log(`📏 Texto limpo: ${texto.length} chars`);
  
  // Se o texto for muito curto, a página provavelmente usa JavaScript para carregar conteúdo
  if (texto.length < 100) {
    console.log('⚠️ Texto muito curto - página pode usar JavaScript dinâmico');
    return {
      success: false,
      error: 'Página com conteúdo dinâmico (JavaScript). Use o browser para visualizar.',
      data: { 
        name: 'Conteúdo não acessível',
        note: 'Esta página carrega informações via JavaScript. Abra a URL no navegador para visualizar os dados.'
      }
    };
  }
  
  // Pega amostra maior para análise
  const amostra = texto.substring(0, 6000);
  console.log(`📏 Amostra para IA: ${amostra.length} chars`);
  
  try {
    const prompt = `Você é um extrator de informações de medicamentos. Analise o texto abaixo e extraia APENAS informações EXPLÍCITAS e REAIS do medicamento.

**REGRAS CRÍTICAS:**
1. NÃO invente dados
2. NÃO use placeholders genéricos como "nome", "princípio ativo", etc.
3. Se não encontrar uma informação, deixe o campo vazio ou omita
4. Busque por: nome comercial, princípio ativo, concentração, forma farmacêutica, fabricante, indicação

TEXTO DA PÁGINA:
${amostra}

Responda APENAS com JSON válido no formato:
{
  "name": "nome comercial REAL do medicamento ou vazio",
  "activeIngredient": "princípio ativo REAL ou vazio",
  "concentration": "concentração REAL ou vazio",
  "form": "forma farmacêutica REAL ou vazio",
  "manufacturer": "fabricante REAL ou vazio",
  "indication": "indicação REAL ou vazio"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 500
        }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        
        console.log('🤖 IA retornou:', JSON.stringify(extracted, null, 2));
        
        // Remove campos vazios, nulos, ou placeholders genéricos
        const genericPlaceholders = ['nome', 'princípio ativo', 'concentração', 'forma', 'fabricante', 
                                     'não mencionado', 'não especificado', 'vazio', 'n/a', 'desconhecido'];
        
        Object.keys(extracted).forEach(key => {
          const value = extracted[key];
          if (!value || 
              value === 'null' || 
              value === '' || 
              genericPlaceholders.some(p => value.toLowerCase().includes(p.toLowerCase()))) {
            delete extracted[key];
          }
        });
        
        console.log('✨ Dados limpos:', JSON.stringify(extracted, null, 2));
        
        // Se não tem dados válidos, retorna erro
        if (Object.keys(extracted).length === 0 || !extracted.name) {
          console.log('⚠️ Nenhum dado válido extraído');
          return {
            success: false,
            error: 'Nenhuma informação válida encontrada',
            data: { name: 'Informações não encontradas' }
          };
        }
        
        return {
          success: true,
          data: extracted,
          confidence: 70,
          method: 'page_text_analysis',
          note: 'Extração do texto da página'
        };
      }
      
      console.log('⚠️ Nenhum JSON válido na resposta da IA');
    }
  } catch (error) {
    console.log('❌ Erro na análise de texto:', error.message);
  }
  
  return {
    success: false,
    error: 'Não foi possível extrair dados',
    data: { name: 'Medicamento não identificado' }
  };
}

function combinarResultados(analises: any[]) {
  console.log('🔄 Combinando resultados...');
  
  const sucesso = analises.filter(a => a.sucesso);
  
  if (sucesso.length === 0) {
    return {
      data: { name: 'Não identificado', note: 'Nenhum arquivo analisado com sucesso' },
      confidence: 10
    };
  }
  
  const final: any = {};
  
  // Combina dados de todos os arquivos
  sucesso.forEach(analise => {
    Object.entries(analise.dados).forEach(([key, value]) => {
      if (value && !final[key]) {
        final[key] = value;
      }
    });
  });
  
  if (Object.keys(final).length === 0) {
    final.name = 'Medicamento não identificado';
    final.note = 'Não foi possível extrair dados dos arquivos';
  }
  
  // Calcula confiança
  let confidence = 40; // Base maior para arquivos
  confidence += sucesso.length * 20;
  if (final.name && final.name !== 'Medicamento não identificado') confidence += 25;
  if (final.activeIngredient) confidence += 20;
  if (final.concentration) confidence += 15;
  if (final.manufacturer) confidence += 10;
  
  // Bonus para arquivos PDF
  const temPDF = sucesso.some(a => a.tipo === 'pdf');
  if (temPDF) confidence += 10;
  
  confidence = Math.min(95, confidence);
  
  console.log('🎯 Dados finais:', Object.keys(final).join(', '));
  console.log('📊 Confiança:', confidence + '%');
  
  return { data: final, confidence };
}

/**
 * Captura screenshot de uma URL
 */
async function capturarScreenshot(url: string): Promise<{ success: boolean; screenshot?: string; error?: string }> {
  try {
    const screenshotUrl = `https://screenshotapi.net/api/v1/screenshot?url=${encodeURIComponent(url)}&width=1200&height=800&output=image&file_type=png&wait_for_event=load&delay=3000`;
    
    const response = await fetch(screenshotUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      return { success: false, error: `Screenshot API error: ${response.status}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const screenshot = `data:image/png;base64,${base64}`;
    
    return { success: true, screenshot };
  } catch (error) {
    console.error('Erro ao capturar screenshot:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Analisa screenshot com IA
 */
async function analisarScreenshotComIA(screenshot: string, url: string): Promise<ExtractedMedicationData | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.error('⚠️ OPENAI_API_KEY não encontrada');
    return null;
  }

  try {
    console.log('🤖 Enviando screenshot para análise com GPT-4o...');
    
    const prompt = `Analise esta imagem de uma bula ou informação de medicamento e extraia APENAS informações REAIS e VISÍVEIS.

REGRAS IMPORTANTES:
- Extraia APENAS dados que você consegue VER claramente na imagem
- Se um campo não estiver visível, deixe-o vazio
- NÃO invente ou presuma informações
- Se o nome do medicamento não estiver claro, retorne null

Retorne um JSON com esta estrutura exata:
{
  "name": "Nome do medicamento (se visível)",
  "activeIngredient": "Princípio ativo (se visível)",
  "concentration": "Concentração (se visível)",
  "manufacturer": "Fabricante (se visível)",
  "dosageForm": "Forma farmacêutica (se visível)",
  "indication": "Indicações (se visível)",
  "contraindications": "Contraindicações (se visível)",
  "sideEffects": "Efeitos colaterais (se visível)",
  "warnings": "Advertências (se visível)",
  "anvisa": "Registro ANVISA (se visível)",
  "confidence": 0.8
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: screenshot } }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API OpenAI:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('⚠️ Resposta vazia da IA');
      return null;
    }

    console.log('📝 Resposta da IA:', content);

    // Parse JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('⚠️ Não foi possível extrair JSON da resposta');
      return null;
    }

    const extracted = JSON.parse(jsonMatch[0]);
    
    // Valida se tem nome válido
    const invalidNames = [
      'nome', 'não identificado', 'não encontrado', 'desconhecido'
    ];
    
    if (!extracted.name || invalidNames.some(invalid => 
      extracted.name.toLowerCase().includes(invalid)
    )) {
      console.log('⚠️ Nome de medicamento inválido ou não encontrado');
      return null;
    }

    console.log('✅ Dados extraídos do screenshot:', extracted.name);
    return {
      ...extracted,
      screenshot: screenshot // Inclui o screenshot no resultado
    };

  } catch (error) {
    console.error('💥 Erro ao analisar screenshot com IA:', error);
    return null;
  }
}
