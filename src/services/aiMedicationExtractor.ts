import { ExtractedData } from './urlExtractorService';

export interface AIAnalysisResult {
  success: boolean;
  data?: ExtractedData;
  confidence?: number;
  error?: string;
}

/**
 * @deprecated This class should not be used directly in the frontend.
 * All AI-powered medication extraction should be done via the 
 * 'extract-medication-ai' Edge Function to keep API keys secure.
 * 
 * Use supabase.functions.invoke('extract-medication-ai', { body: {...} })
 */
export class AIMedicationExtractor {
  
  /**
   * @deprecated Use Edge Function 'extract-medication-ai' instead
   */
  static async analyzeScreenshot(_imageBase64: string): Promise<AIAnalysisResult> {
    console.warn('[DEPRECATED] AIMedicationExtractor.analyzeScreenshot should not be called from frontend. Use Edge Function instead.');
    return {
      success: false,
      error: 'Este método foi descontinuado. Use a Edge Function extract-medication-ai.'
    };
  }

  /**
   * @deprecated Use Edge Function 'extract-medication-ai' instead
   */
  static async analyzeText(_text: string): Promise<AIAnalysisResult> {
    console.warn('[DEPRECATED] AIMedicationExtractor.analyzeText should not be called from frontend. Use Edge Function instead.');
    return {
      success: false,
      error: 'Este método foi descontinuado. Use a Edge Function extract-medication-ai.'
    };
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
