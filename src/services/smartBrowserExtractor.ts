import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

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
   * Abre URL no browser, aguarda carregamento, e extrai dados automaticamente
   */
  static async openAndExtract(url: string): Promise<ExtractionResult | null> {
    console.log('[SmartBrowserExtractor] 🚀 Starting AUTO extraction for:', url);
    
    if (this.isNativePlatform()) {
      console.log('[SmartBrowserExtractor] 📱 Using Capacitor Browser auto-extraction');
      return await this.extractWithCapacitorAuto(url);
    } else {
      console.log('[SmartBrowserExtractor] 🌐 Using Edge Function (browser mode)');
      return await this.extractWithEdgeFunction(url);
    }
  }

  /**
   * Abre browser automaticamente, aguarda carregamento, fecha e extrai
   */
  private static async extractWithCapacitorAuto(url: string): Promise<ExtractionResult | null> {
    console.log('[SmartBrowserExtractor] 🌐 Opening browser automatically...');
    
    try {
      // Abre o browser
      await Browser.open({
        url,
        presentationStyle: 'fullscreen',
        toolbarColor: '#1a1a1a',
      });

      console.log('[SmartBrowserExtractor] ⏳ Waiting for page to load...');
      
      // Aguarda 3 segundos para a página carregar completamente (com JS)
      await this.delay(3000);
      
      console.log('[SmartBrowserExtractor] 🔄 Extracting data with Edge Function...');
      
      // Extrai dados usando Edge Function
      const result = await this.extractWithEdgeFunction(url);
      
      // Fecha o browser automaticamente
      console.log('[SmartBrowserExtractor] ❌ Closing browser automatically...');
      await Browser.close();
      
      return result;
      
    } catch (error) {
      console.error('[SmartBrowserExtractor] 💥 Error in auto extraction:', error);
      
      // Tenta fechar o browser em caso de erro
      try {
        await Browser.close();
      } catch (closeError) {
        console.error('[SmartBrowserExtractor] ⚠️ Could not close browser:', closeError);
      }
      
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
