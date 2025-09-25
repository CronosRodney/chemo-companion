// Service to extract medication data from URLs
export interface ExtractedData {
  name?: string;
  activeIngredient?: string;
  manufacturer?: string;
  concentration?: string;
  form?: string;
  route?: string;
}

export class URLExtractorService {
  static async extractFromURL(url: string): Promise<ExtractedData> {
    try {
      // Fetch page content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MedScanBot/1.0)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const data: ExtractedData = {};
      
      // Extract structured data (JSON-LD)
      const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/is);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          if (jsonLd['@type'] === 'Product' || jsonLd['@type'] === 'Drug') {
            data.name = jsonLd.name;
            data.activeIngredient = jsonLd.activeIngredient?.name;
            data.manufacturer = jsonLd.manufacturer?.name;
          }
        } catch (e) {
          console.warn('Failed to parse JSON-LD:', e);
        }
      }
      
      // Extract Open Graph data
      const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
      if (ogTitle && !data.name) {
        data.name = this.cleanText(ogTitle[1]);
      }
      
      // Extract from title tag if no OG title
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch && !data.name) {
        data.name = this.cleanText(titleMatch[1]);
      }
      
      // Sara.com.br specific patterns
      if (url.includes('sara.com.br')) {
        // Extract name from breadcrumb or title
        const breadcrumbMatch = html.match(/Toragesic[^<]*(?:mg|mcg|g)[^<]*/i);
        if (breadcrumbMatch && !data.name) {
          data.name = this.cleanText(breadcrumbMatch[0]);
        }
        
        // Extract concentration from name
        const concentrationMatch = data.name?.match(/([\d,\.]+)\s*(mg|mcg|g|ml)/i);
        if (concentrationMatch) {
          data.concentration = `${concentrationMatch[1]}${concentrationMatch[2]}`;
        }
        
        // Extract form/presentation
        const formMatch = data.name?.match(/(comprimidos?|cápsulas?|solução|xarope|pomada|gel|creme|sublinguais?|gotas)/i);
        if (formMatch) {
          data.form = formMatch[1];
        }
        
        // Extract manufacturer from name (often after drug name)
        const manufacturerMatch = data.name?.match(/\b(EMS|MEDLEY|EUROFARMA|TEUTO|GERMED|SANDOZ|NOVARTIS|BAYER|ABBOTT|PFIZER|ROCHE)\b/i);
        if (manufacturerMatch) {
          data.manufacturer = manufacturerMatch[1];
        }
      }
      
      // Common medication info patterns
      const patterns = {
        activeIngredient: [
          /princípio\s+ativo[:\s]*([^<\n]+)/i,
          /substância\s+ativa[:\s]*([^<\n]+)/i,
          /active\s+ingredient[:\s]*([^<\n]+)/i,
          /composição[:\s]*([^<\n]+)/i,
        ],
        manufacturer: [
          /fabricante[:\s]*([^<\n]+)/i,
          /laboratório[:\s]*([^<\n]+)/i,
          /manufacturer[:\s]*([^<\n]+)/i,
          /indústria farmacêutica[:\s]*([^<\n]+)/i,
        ],
        concentration: [
          /concentração[:\s]*([^<\n]+)/i,
          /dosagem[:\s]*([^<\n]+)/i,
          /strength[:\s]*([^<\n]+)/i,
          /teor[:\s]*([^<\n]+)/i,
        ],
        form: [
          /forma\s+farmacêutica[:\s]*([^<\n]+)/i,
          /apresentação[:\s]*([^<\n]+)/i,
          /dosage\s+form[:\s]*([^<\n]+)/i,
        ]
      };
      
      // Extract using patterns
      Object.entries(patterns).forEach(([key, regexes]) => {
        if (!data[key as keyof ExtractedData]) {
          for (const regex of regexes) {
            const match = html.match(regex);
            if (match) {
              data[key as keyof ExtractedData] = this.cleanText(match[1]);
              break;
            }
          }
        }
      });
      
      return data;
    } catch (error) {
      console.error('URL extraction failed:', error);
      throw error;
    }
  }
  
  private static cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
  }
}