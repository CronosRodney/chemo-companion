// Service to extract medication data from URLs
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

      // First try to fetch and parse the page content
      try {
        const scrapedData = await this.fetchPageContent(url);
        if (scrapedData && scrapedData.name) {
          return scrapedData;
        }
      } catch (fetchError) {
        console.warn('Failed to fetch page content, trying pattern extraction:', fetchError);
      }

      // Fallback to pattern extraction from URL
      const data: ExtractedData = {};
      
      // Sara.com.br specific patterns from URL
      if (url.includes('sara.com.br')) {
        const saraData = this.extractFromSaraURL(url);
        // Try to enhance with screenshot
        try {
          const screenshot = await this.captureScreenshot(url);
          saraData.screenshot = screenshot;
        } catch (screenshotError) {
          console.warn('Screenshot capture failed:', screenshotError);
        }
        return saraData;
      }
      
      // Try to extract basic info from URL path for other sites
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      // Try to extract medication name from URL
      if (lastPart && lastPart.length > 3) {
        // Clean up URL slugs to medication names
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
      
      // If no useful data extracted, try screenshot as last resort
      if (!data.name) {
        try {
          const screenshot = await this.captureScreenshot(url);
          return {
            name: 'Medicamento (ver imagem)',
            screenshot: screenshot
          };
        } catch (screenshotError) {
          throw new Error('Não foi possível extrair informações do medicamento da URL. Tente inserir os dados manualmente.');
        }
      }
      
      return data;
    } catch (error) {
      console.error('URL extraction failed:', error);
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
    
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try to extract from common selectors and patterns
    
    // Product name
    const nameSelectors = [
      'h1',
      '.product-name',
      '.medication-name',
      '[data-testid="product-name"]',
      '.title'
    ];
    
    for (const selector of nameSelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent?.trim()) {
        data.name = this.cleanText(element.textContent);
        break;
      }
    }
    
    // Active ingredient
    const activeIngredientPatterns = [
      /princípio\s+ativo[:\s]+([^.\n]+)/i,
      /active\s+ingredient[:\s]+([^.\n]+)/i,
      /substância\s+ativa[:\s]+([^.\n]+)/i
    ];
    
    for (const pattern of activeIngredientPatterns) {
      const match = html.match(pattern);
      if (match) {
        data.activeIngredient = this.cleanText(match[1]);
        break;
      }
    }
    
    // Manufacturer
    const manufacturerPatterns = [
      /marca\s+do\s+produto[:\s]+([^.\n]+)/i,
      /laboratório[:\s]+([^.\n]+)/i,
      /fabricante[:\s]+([^.\n]+)/i,
      /manufacturer[:\s]+([^.\n]+)/i
    ];
    
    for (const pattern of manufacturerPatterns) {
      const match = html.match(pattern);
      if (match) {
        data.manufacturer = this.cleanText(match[1]);
        break;
      }
    }
    
    // Concentration/dosage
    const concentrationMatch = html.match(/([\d,\.]+)\s*(mg|mcg|g|ml|%)/i);
    if (concentrationMatch) {
      data.concentration = `${concentrationMatch[1]}${concentrationMatch[2]}`;
    }
    
    // Form
    const formPatterns = [
      /forma\s+farmacêutica[:\s]+([^.\n]+)/i,
      /(comprimidos?|cápsulas?|solução|xarope|pomada|gel|creme|sublinguais?|gotas|injetável)/i
    ];
    
    for (const pattern of formPatterns) {
      const match = html.match(pattern);
      if (match) {
        data.form = this.cleanText(match[1]);
        break;
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
    
    // Package quantity
    const quantityMatch = html.match(/(\d+)\s+(comprimidos?|cápsulas?|ml)/i);
    if (quantityMatch) {
      data.packageQuantity = `${quantityMatch[1]} ${quantityMatch[2]}`;
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