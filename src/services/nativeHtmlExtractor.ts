/**
 * Extrator de HTML usando estratégia híbrida:
 * 1. Abre browser visível para o usuário ver o carregamento
 * 2. Usuário aguarda página carregar (pode ver o processo)
 * 3. Quando pronto, fecha browser e envia URL para Edge Function
 * 4. Edge Function faz scraping com screenshot/polling
 */

import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export interface HtmlExtractionResult {
  success: boolean;
  finalUrl: string;
  html?: string;
  error?: string;
}

export class NativeHtmlExtractor {
  /**
   * Estratégia: Mostra browser para usuário, aguarda carregamento manual
   */
  static async extractWithUserConfirmation(url: string): Promise<HtmlExtractionResult> {
    console.log('[NativeHtmlExtractor] 📱 Opening browser for user confirmation...');
    
    try {
      if (!Capacitor.isNativePlatform()) {
        return {
          success: false,
          finalUrl: url,
          error: 'Not running on native platform'
        };
      }

      // Abre browser para usuário VER a página carregar
      await Browser.open({
        url,
        presentationStyle: 'fullscreen',
        toolbarColor: '#1a1a1a',
      });

      console.log('[NativeHtmlExtractor] 👀 Browser opened, user can see page loading...');
      console.log('[NativeHtmlExtractor] ⏳ Waiting 8 seconds for page to load...');
      
      // Aguarda 8 segundos para página carregar completamente
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Fecha o browser
      console.log('[NativeHtmlExtractor] ❌ Closing browser after wait...');
      await Browser.close();
      
      // Retorna sucesso indicando que a URL deve ser processada
      return {
        success: true,
        finalUrl: url
      };
      
    } catch (error) {
      console.error('[NativeHtmlExtractor] 💥 Error:', error);
      
      try {
        await Browser.close();
      } catch (e) {
        // Ignore close errors
      }
      
      return {
        success: false,
        finalUrl: url,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Estratégia simples: apenas aguarda tempo fixo
   */
  static async waitForPageLoad(url: string, delayMs: number = 5000): Promise<void> {
    console.log(`[NativeHtmlExtractor] ⏳ Waiting ${delayMs}ms for page to load...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
