// Service to extract medication data from URLs
import { AIMedicationExtractor } from './aiMedicationExtractor';
import { supabase } from '@/integrations/supabase/client';
export interface ExtractedData {
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
  screenshot?: string; // Base64 screenshot as fallback
}

export class URLExtractorService {
  static async extractFromURL(url: string): Promise<ExtractedData> {
    try {
      console.log('Extracting data from URL:', url);

      // Step 1: Try AI extraction using edge function (most accurate)
      try {
        console.log('Trying AI extraction via edge function...');
        const aiData = await this.extractWithAI(url);
        if (aiData && aiData.name) {
          console.log('AI extraction successful');
          return aiData;
        }
      } catch (aiError) {
        console.warn('AI extraction failed:', aiError);
      }

      // Step 2: Try to fetch and parse page content
      let htmlContent: string | null = null;
      try {
        const scrapedData = await this.fetchPageContent(url);
        if (scrapedData && scrapedData.name) {
          console.log('Successfully extracted data from HTML parsing');
          return scrapedData;
        }
        
        // Get HTML content for AI analysis
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
          htmlContent = await response.text();
        }
      } catch (fetchError) {
        console.warn('Failed to fetch page content:', fetchError);
      }

      // Step 3: Try AI analysis of text content (fallback)
      if (htmlContent) {
        try {
          console.log('Trying AI text analysis...');
          const aiResult = await AIMedicationExtractor.analyzeText(htmlContent);
          if (aiResult.success && aiResult.data) {
            console.log('AI text analysis successful');
            return aiResult.data;
          }
        } catch (aiError) {
          console.warn('AI text analysis failed:', aiError);
        }
      }

      // Step 4: Try screenshot + AI analysis
      try {
        console.log('Trying screenshot + AI analysis...');
        const screenshot = await this.captureScreenshot(url);
        const aiResult = await AIMedicationExtractor.analyzeScreenshot(screenshot);
        
        if (aiResult.success && aiResult.data) {
          console.log('AI screenshot analysis successful');
          return {
            ...aiResult.data,
            screenshot: screenshot
          };
        } else {
          // Return screenshot for manual review
          return {
            name: 'Medicamento (revisar imagem)',
            screenshot: screenshot
          };
        }
      } catch (screenshotError) {
        console.warn('Screenshot + AI analysis failed:', screenshotError);
      }

      // Step 5: Fallback to URL pattern extraction
      console.log('Falling back to URL pattern extraction...');
      const data: ExtractedData = {};
      
      if (url.includes('sara.com.br')) {
        return this.extractFromSaraURL(url);
      }
      
      // Try to extract basic info from URL path
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      if (lastPart && lastPart.length > 3) {
        const cleanName = lastPart
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\.html?/g, '')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        if (cleanName.length > 3) {
          data.name = cleanName;
        }
      }
      
      if (Object.keys(data).length === 0) {
        throw new Error('Não foi possível extrair informações do medicamento. Tente inserir os dados manualmente.');
      }
      
      return data;
    } catch (error) {
      console.error('URL extraction failed:', error);
      throw error;
    }
  }

  private static async extractWithAI(url: string): Promise<ExtractedData | null> {
    try {
      console.log('Calling AI extraction edge function...');
      
      const { data, error } = await supabase.functions.invoke('extract-medication-ai', {
        body: { url }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.success && data?.data) {
        console.log('AI extraction successful with confidence:', data.confidence);
        return data.data;
      } else {
        console.log('AI extraction failed:', data?.error);
        return null;
      }
    } catch (error) {
      console.error('Error calling AI extraction:', error);
      throw error;
    }
  }

  private static async fetchPageContent(url: string): Promise<ExtractedData | null> {
    try {
      // Use a CORS proxy to fetch the page content
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      return this.parseHTMLContent(html);
    } catch (error) {
      console.error('Failed to fetch page content:', error);
      return null;
    }
  }

  private static parseHTMLContent(html: string): ExtractedData {
    const data: ExtractedData = {};
    
    console.log('Parsing HTML content, length:', html.length);
    
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try to extract from common selectors and patterns for Brazilian pharmacy sites
    
    // Product name - expanded selectors for Brazilian sites
    const nameSelectors = [
      'h1',
      'h2',
      '.product-name',
      '.medication-name',
      '.medicine-name',
      '.drug-name',
      '.produto-nome',
      '.nome-produto',
      '.title',
      '.product-title',
      '.main-title',
      '[data-testid="product-name"]',
      '.breadcrumb-item:last-child',
      'title'
    ];
    
    for (const selector of nameSelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent?.trim()) {
        const text = this.cleanText(element.textContent);
        if (text.length > 3 && !text.toLowerCase().includes('página') && !text.toLowerCase().includes('site')) {
          data.name = text;
          console.log('Found name via selector:', selector, '=', text);
          break;
        }
      }
    }
    
    // Active ingredient - more comprehensive patterns
    const activeIngredientPatterns = [
      /princípio\s+ativo[:\s]*([^.\n<>]+)/i,
      /active\s+ingredient[:\s]*([^.\n<>]+)/i,
      /substância\s+ativa[:\s]*([^.\n<>]+)/i,
      /composição[:\s]*([^.\n<>]+)/i,
      /ingrediente\s+ativo[:\s]*([^.\n<>]+)/i,
      /fórmula[:\s]*([^.\n<>]+)/i,
      /DCB[:\s]*([^.\n<>]+)/i,
      /DCI[:\s]*([^.\n<>]+)/i
    ];
    
    for (const pattern of activeIngredientPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const ingredient = this.cleanText(match[1]);
        if (ingredient.length > 2) {
          data.activeIngredient = ingredient;
          console.log('Found active ingredient:', ingredient);
          break;
        }
      }
    }
    
    // Manufacturer - enhanced patterns for Brazilian labs
    const manufacturerPatterns = [
      /marca\s+do\s+produto[:\s]*([^.\n<>]+)/i,
      /laboratório[:\s]*([^.\n<>]+)/i,
      /fabricante[:\s]*([^.\n<>]+)/i,
      /manufacturer[:\s]*([^.\n<>]+)/i,
      /indústria\s+farmacêutica[:\s]*([^.\n<>]+)/i,
      /lab\.[:\s]*([^.\n<>]+)/i,
      /marca[:\s]*([^.\n<>]+)/i,
      /empresa[:\s]*([^.\n<>]+)/i,
      /(EMS|MEDLEY|EUROFARMA|TEUTO|GERMED|SANDOZ|NOVARTIS|BAYER|ABBOTT|PFIZER|ROCHE|ACHÉ|BIOLAB|CRISTÁLIA|HYPERA|TAKEDA|MULTILAB|UNIÃO QUÍMICA|APSEN)/i
    ];
    
    for (const pattern of manufacturerPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const manufacturer = this.cleanText(match[1]);
        if (manufacturer.length > 1) {
          data.manufacturer = manufacturer;
          console.log('Found manufacturer:', manufacturer);
          break;
        }
      }
    }
    
    // Concentration/dosage - more comprehensive patterns
    const concentrationPatterns = [
      /([\d,\.]+)\s*(mg|mcg|μg|g|ml|mL|%|UI|ui|DH|ch)/i,
      /concentração[:\s]*([\d,\.]+)\s*(mg|mcg|μg|g|ml|mL|%)/i,
      /dose[:\s]*([\d,\.]+)\s*(mg|mcg|μg|g|ml|mL|%)/i,
      /dosagem[:\s]*([\d,\.]+)\s*(mg|mcg|μg|g|ml|mL|%)/i,
      /([\d,\.]+)\s*mg\/\w+/i,
      /([\d,\.]+)\s*mcg\/\w+/i
    ];
    
    for (const pattern of concentrationPatterns) {
      const match = html.match(pattern);
      if (match) {
        data.concentration = match[2] ? `${match[1]}${match[2]}` : match[0];
        console.log('Found concentration:', data.concentration);
        break;
      }
    }
    
    // Form - comprehensive pharmaceutical forms
    const formPatterns = [
      /forma\s+farmacêutica[:\s]*([^.\n<>]+)/i,
      /apresentação[:\s]*([^.\n<>]+)/i,
      /(comprimidos?\s*revestidos?|comprimidos?\s*sublinguais?|comprimidos?|cápsulas?\s*duras?|cápsulas?\s*gelatinosas?|cápsulas?|solução\s*oral|solução\s*injetável|solução|xarope|pomada|gel|creme|sublinguais?|gotas|injetável|suspensão|elixir|spray|aerossol|sachê|drágeas?|pastilhas?|adesivos?)/i,
      /via\s+de\s+administração[:\s]*([^.\n<>]+)/i,
      /tipo[:\s]*([^.\n<>]+)/i
    ];
    
    for (const pattern of formPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const form = this.cleanText(match[1]);
        if (form.length > 2) {
          data.form = form;
          console.log('Found form:', form);
          break;
        }
      }
    }
    
    // Category
    const categoryPatterns = [
      /categoria\s+do\s+produto[:\s]+([^.\n]+)/i,
      /classe\s+terapêutica[:\s]+([^.\n]+)/i
    ];
    
    for (const pattern of categoryPatterns) {
      const match = html.match(pattern);
      if (match) {
        data.category = this.cleanText(match[1]);
        break;
      }
    }
    
    // Prescription requirement
    const prescriptionMatch = html.match(/venda\s+sob\s+prescrição\s+médica/i);
    if (prescriptionMatch) {
      data.prescriptionRequired = true;
    }
    
    // Registration number
    const registrationMatch = html.match(/registro\s+(?:no\s+)?ministério\s+da\s+saúde[:\s]+([^\s\n]+)/i);
    if (registrationMatch) {
      data.registrationNumber = this.cleanText(registrationMatch[1]);
    }
    
    // Storage instructions
    const storageMatch = html.match(/forma?\s+de\s+conservação[:\s]+([^.\n]+)/i);
    if (storageMatch) {
      data.storageInstructions = this.cleanText(storageMatch[1]);
    }
    
    // Package quantity - comprehensive patterns
    const quantityPatterns = [
      /embalagem\s+com[:\s]*(\d+)\s*(comprimidos?|cápsulas?|ml|mL|unidades?|frascos?)/i,
      /caixa\s+com[:\s]*(\d+)\s*(comprimidos?|cápsulas?|ml|mL|unidades?|frascos?)/i,
      /contém[:\s]*(\d+)\s*(comprimidos?|cápsulas?|ml|mL|unidades?|frascos?)/i,
      /(\d+)\s+(comprimidos?|cápsulas?|ml|mL|unidades?|frascos?)/i,
      /quantidade[:\s]*(\d+)\s*(comprimidos?|cápsulas?|ml|mL|unidades?)/i,
      /(\d+)\s*x\s*(\d+)\s*(mg|ml|mL)/i
    ];
    
    for (const pattern of quantityPatterns) {
      const match = html.match(pattern);
      if (match) {
        if (match[3]) {
          data.packageQuantity = `${match[1]}x${match[2]}${match[3]}`;
        } else {
          data.packageQuantity = `${match[1]} ${match[2]}`;
        }
        console.log('Found package quantity:', data.packageQuantity);
        break;
      }
    }
    
    return data;
  }

  private static async captureScreenshot(url: string): Promise<string> {
    try {
      // Use a screenshot service API
      const screenshotUrl = `https://api.screenshotmachine.com/?key=demo&url=${encodeURIComponent(url)}&dimension=1024x768&format=png`;
      
      const response = await fetch(screenshotUrl);
      if (!response.ok) {
        throw new Error(`Screenshot service error: ${response.status}`);
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw error;
    }
  }
  
  private static extractFromSaraURL(url: string): ExtractedData {
    const data: ExtractedData = {};
    
    // Try to extract from URL path
    const urlParts = url.split('/');
    const medicationSlug = urlParts[urlParts.length - 1];
    
    if (medicationSlug) {
      // Convert URL slug to readable name
      let name = medicationSlug
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\.html?/g, '');
      
      // Capitalize first letter of each word
      name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      data.name = name;
      
      // Try to extract concentration from name
      const concentrationMatch = name.match(/([\d,\.]+)\s*(mg|mcg|g|ml)/i);
      if (concentrationMatch) {
        data.concentration = `${concentrationMatch[1]}${concentrationMatch[2]}`;
      }
      
      // Try to extract form
      const formMatch = name.match(/(comprimidos?|cápsulas?|solução|xarope|pomada|gel|creme|sublinguais?|gotas)/i);
      if (formMatch) {
        data.form = formMatch[1];
      }
      
      // Common manufacturers for Sara pharmacy
      const manufacturerMatch = name.match(/\b(EMS|MEDLEY|EUROFARMA|TEUTO|GERMED|SANDOZ|NOVARTIS|BAYER|ABBOTT|PFIZER|ROCHE)\b/i);
      if (manufacturerMatch) {
        data.manufacturer = manufacturerMatch[1];
      }
    }
    
    // If we couldn't extract a name, provide a generic one
    if (!data.name) {
      data.name = 'Medicamento da Sara Pharmacy';
    }
    
    return data;
  }
  
  
  private static cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
  }
}