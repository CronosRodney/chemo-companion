import { ExtractedData } from './urlExtractorService';

export interface AIAnalysisResult {
  success: boolean;
  data?: ExtractedData;
  confidence?: number;
  error?: string;
}

export class AIMedicationExtractor {
  private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  
  static async analyzeScreenshot(imageBase64: string): Promise<AIAnalysisResult> {
    try {
      // Remove data URL prefix if present
      const base64Image = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'demo'}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Você é um especialista em análise de medicamentos brasileiros. Analise a imagem e extraia TODAS as informações disponíveis sobre o medicamento em formato JSON estruturado.

INSTRUÇÕES CRÍTICAS:
1. Extraia EXATAMENTE o nome do medicamento como aparece na imagem
2. Identifique o princípio ativo/substância ativa
3. Encontre a concentração/dosagem (mg, mcg, ml, etc.)
4. Identifique a forma farmacêutica (comprimidos, cápsulas, xarope, etc.)
5. Encontre o laboratório/fabricante
6. Identifique a quantidade na embalagem
7. Procure por registro ANVISA se disponível
8. Identifique se é venda sob prescrição médica

RESPONDA APENAS com um JSON válido no formato:
{
  "name": "Nome exato do medicamento",
  "activeIngredient": "Princípio ativo",
  "concentration": "Concentração com unidade",
  "form": "Forma farmacêutica",
  "manufacturer": "Laboratório/Fabricante",
  "packageQuantity": "Quantidade na embalagem",
  "registrationNumber": "Registro ANVISA se disponível",
  "prescriptionRequired": true/false,
  "category": "Categoria terapêutica se disponível"
}`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analise esta imagem de um medicamento brasileiro e extraia todas as informações disponíveis:"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      // Parse JSON response
      const parsedData = JSON.parse(content);
      
      return {
        success: true,
        data: parsedData,
        confidence: 0.85
      };

    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na análise por IA'
      };
    }
  }

  static async analyzeText(text: string): Promise<AIAnalysisResult> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'demo'}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Analise o texto de uma página web brasileira de medicamento e extraia informações estruturadas.

EXTRAIA:
- Nome do medicamento
- Princípio ativo
- Concentração/dosagem
- Forma farmacêutica
- Laboratório fabricante
- Quantidade na embalagem
- Registro ANVISA
- Se requer prescrição médica

RESPONDA APENAS com JSON válido:
{
  "name": "Nome do medicamento",
  "activeIngredient": "Princípio ativo",
  "concentration": "Concentração",
  "form": "Forma",
  "manufacturer": "Fabricante",
  "packageQuantity": "Quantidade",
  "registrationNumber": "Registro",
  "prescriptionRequired": boolean,
  "category": "Categoria"
}`
            },
            {
              role: "user",
              content: `Analise este texto de página de medicamento: ${text.substring(0, 3000)}`
            }
          ],
          max_tokens: 400,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      const parsedData = JSON.parse(content);
      
      return {
        success: true,
        data: parsedData,
        confidence: 0.75
      };

    } catch (error) {
      console.error('AI text analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na análise de texto por IA'
      };
    }
  }

  // Fallback para análise offline usando padrões regex melhorados
  static extractOffline(text: string): AIAnalysisResult {
    try {
      const data: ExtractedData = {};
      
      // Padrões mais específicos para medicamentos brasileiros
      const patterns = {
        name: [
          /(?:MEDICAMENTO|PRODUTO|REMÉDIO)[\s:]*([A-ZÁÊÇÕ][A-Za-záêçõ\s\d]+)/i,
          /^([A-ZÁÊÇÕ][A-Za-záêçõ\s\d]{3,50})/m,
          /<h1[^>]*>([^<]+)<\/h1>/i,
          /title[^>]*>([^<]+medicamento[^<]*)/i
        ],
        activeIngredient: [
          /(?:PRINCÍPIO ATIVO|SUBSTÂNCIA ATIVA|COMPOSIÇÃO)[\s:]*([A-Za-záêçõ\s]+)/i,
          /DCB[\s:]*([A-Za-záêçõ\s]+)/i
        ],
        concentration: [
          /([\d,\.]+)\s*(mg|mcg|μg|g|ml|mL|%|UI)/i,
          /CONCENTRAÇÃO[\s:]*([^.\n]+)/i
        ],
        manufacturer: [
          /(?:LABORATÓRIO|FABRICANTE|INDÚSTRIA)[\s:]*([A-Za-záêçõ\s]+)/i,
          /(EMS|MEDLEY|EUROFARMA|TEUTO|GERMED|SANDOZ|NOVARTIS|BAYER|ABBOTT)/i
        ]
      };

      // Aplicar padrões
      for (const [field, patternList] of Object.entries(patterns)) {
        for (const pattern of patternList) {
          const match = text.match(pattern);
          if (match && match[1]) {
            (data as any)[field] = match[1].trim();
            break;
          }
        }
      }

      const hasData = Object.keys(data).length > 0;
      
      return {
        success: hasData,
        data: hasData ? data : undefined,
        confidence: hasData ? 0.4 : 0,
        error: hasData ? undefined : 'Não foi possível extrair informações'
      };

    } catch (error) {
      return {
        success: false,
        error: 'Erro na análise offline'
      };
    }
  }
}