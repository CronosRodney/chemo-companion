import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { NativeHtmlExtractor } from './nativeHtmlExtractor';

interface ExtractedContent {
  htmlContent: string;
  visibleText: string;
  metadata: {
    title: string;
    description: string;
    ogData: Record<string, string>;
  };
}

interface ExtractionResult {
  name?: string;
  activeIngredient?: string;
  concentration?: string;
  manufacturer?: string;
  dosageForm?: string;
  route?: string;
  indication?: string;
  contraindications?: string;
  sideEffects?: string;
  warnings?: string;
  composition?: string;
  anvisa?: string;
  ean?: string;
  confidence?: number;
  screenshot?: string;
  note?: string;
}

export class SmartBrowserExtractor {
  private static readonly LOAD_TIMEOUT = 5000;
  private static readonly EXTRACTION_TIMEOUT = 3000;

  /**
   * Detecta se está rodando em plataforma nativa (Android/iOS)
   */
  private static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Abre browser, aguarda JS carregar, extrai HTML e fecha
   */
  static async openAndExtract(url: string): Promise<ExtractionResult | null> {
    console.log('[SmartBrowserExtractor] 🚀 Starting extraction for:', url);
    
    if (this.isNativePlatform()) {
      console.log('[SmartBrowserExtractor] 📱 Using Capacitor Browser HTML extraction');
      return await this.extractHtmlWithCapacitor(url);
    } else {
      console.log('[SmartBrowserExtractor] 🌐 Using Edge Function (web fallback)');
      return await this.extractWithEdgeFunction(url);
    }
  }

  /**
   * Estratégia com Capacitor Browser:
   * 1. Abre browser para usuário VER o carregamento
   * 2. Aguarda 8 segundos
   * 3. Fecha browser
   * 4. Edge Function faz scraping com screenshot (página já carregou)
   */
  private static async extractHtmlWithCapacitor(url: string): Promise<ExtractionResult | null> {
    console.log('[SmartBrowserExtractor] 📱 Starting Capacitor Browser extraction...');
    
    try {
      // PASSO 1: Abre browser visual para usuário ver carregamento
      const extractionResult = await NativeHtmlExtractor.extractWithUserConfirmation(url);
      
      if (!extractionResult.success) {
        console.error('[SmartBrowserExtractor] ❌ Browser extraction failed:', extractionResult.error);
        throw new Error(extractionResult.error || 'Failed to open browser');
      }
      
      console.log('[SmartBrowserExtractor] ✅ Browser closed, page should be loaded');
      
      // PASSO 2: Agora que a página carregou, usa Edge Function com screenshot
      console.log('[SmartBrowserExtractor] 📡 Calling Edge Function for AI extraction...');
      const result = await this.extractWithEdgeFunction(url);
      
      if (result && result.name && result.name !== 'Conteúdo não acessível') {
        console.log('[SmartBrowserExtractor] ✅ Valid data extracted:', result.name);
        return result;
      }
      
      console.log('[SmartBrowserExtractor] ⚠️ No valid data extracted');
      return result;
      
    } catch (error) {
      console.error('[SmartBrowserExtractor] 💥 Error in Capacitor extraction:', error);
      throw error;
    }
  }


  /**
   * REMOVIDO - Não abrimos mais navegador externo
   * Tudo é processado em background via Edge Function
   */

  /**
   * Estratégia usando Edge Function (funciona em todas as plataformas)
   */
  private static async extractWithEdgeFunction(url: string): Promise<ExtractionResult | null> {
    try {
      console.log('[SmartBrowserExtractor] 🌐 Calling Edge Function for URL:', url);
      console.log('[SmartBrowserExtractor] ⏳ This may take 10-30 seconds...');

      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('extract-medication-ai', {
        body: { url }
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[SmartBrowserExtractor] ⏱️ Edge Function completed in ${duration}s`);

      if (error) {
        console.error('[SmartBrowserExtractor] ❌ Edge Function error:', error);
        throw new Error(`Erro ao extrair dados: ${error.message || 'Erro desconhecido'}`);
      }

      if (!data) {
        console.warn('[SmartBrowserExtractor] ⚠️ No data returned from Edge Function');
        throw new Error('Nenhum dado foi retornado pela análise');
      }

      console.log('[SmartBrowserExtractor] ✅ Successfully extracted data:', data);
      return data as ExtractionResult;
      
    } catch (error) {
      console.error('[SmartBrowserExtractor] 💥 Error calling Edge Function:', error);
      throw error;
    }
  }

  /**
   * Fallback: tenta abrir URL em nova aba (web)
   */
  private static openInNewTab(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Helper: delay com Promise
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Script para extrair HTML completo (para futuro uso se Capacitor suportar)
   */
  private static getHtmlExtractionScript(): string {
    return `
      (function() {
        return {
          html: document.documentElement.outerHTML,
          title: document.title,
          url: window.location.href
        };
      })();
    `;
  }

  /**
   * Script para extrair texto visível (para futuro uso)
   */
  private static getTextExtractionScript(): string {
    return `
      (function() {
        // Remove scripts, styles, e elementos ocultos
        const clone = document.body.cloneNode(true);
        const scripts = clone.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());
        
        // Pega apenas texto visível
        const text = clone.innerText || clone.textContent || '';
        
        return text.trim();
      })();
    `;
  }

  /**
   * Script para extrair metadados (para futuro uso)
   */
  private static getMetadataExtractionScript(): string {
    return `
      (function() {
        const metadata = {
          title: document.title,
          description: '',
          ogData: {}
        };
        
        // Meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metadata.description = metaDesc.getAttribute('content') || '';
        }
        
        // Open Graph tags
        const ogTags = document.querySelectorAll('meta[property^="og:"]');
        ogTags.forEach(tag => {
          const property = tag.getAttribute('property');
          const content = tag.getAttribute('content');
          if (property && content) {
            metadata.ogData[property] = content;
          }
        });
        
        return metadata;
      })();
    `;
  }
}
