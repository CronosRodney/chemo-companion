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
      // For now, try to extract data from URL patterns without fetching
      // This avoids CORS issues when fetching external sites
      const data: ExtractedData = {};
      
      // Sara.com.br specific patterns from URL
      if (url.includes('sara.com.br')) {
        return this.extractFromSaraURL(url);
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
      
      // If no useful data extracted, throw error
      if (!data.name) {
        throw new Error('Não foi possível extrair informações do medicamento da URL. Tente inserir os dados manualmente.');
      }
      
      return data;
    } catch (error) {
      console.error('URL extraction failed:', error);
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