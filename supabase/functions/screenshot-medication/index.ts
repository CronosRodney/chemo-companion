import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScreenshotResult {
  success: boolean;
  screenshot?: string; // Base64 encoded image
  error?: string;
}

serve(async (req) => {
  console.log('Screenshot function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Processing screenshot for URL:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    // Try multiple screenshot services in order of preference
    const screenshotServices = [
      {
        name: 'ScreenshotAPI.net',
        fn: () => screenshotWithAPI1(url)
      },
      {
        name: 'API.ScrapingBee.com',
        fn: () => screenshotWithAPI2(url)
      },
      {
        name: 'HTMLCSStoImage.com',
        fn: () => screenshotWithAPI3(url)
      }
    ];

    let lastError = '';
    
    for (const service of screenshotServices) {
      try {
        console.log(`Trying ${service.name}...`);
        const screenshot = await service.fn();
        
        if (screenshot) {
          console.log(`Success with ${service.name}`);
          const result: ScreenshotResult = {
            success: true,
            screenshot: screenshot
          };

          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error(`${service.name} failed:`, error);
        lastError = error instanceof Error ? error.message : 'Unknown error';
        continue; // Try next service
      }
    }

    // If all services failed
    throw new Error(`All screenshot services failed. Last error: ${lastError}`);

  } catch (error) {
    console.error('Error in screenshot function:', error);
    
    const errorResult: ScreenshotResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Screenshot service 1: ScreenshotAPI.net (free tier available)
async function screenshotWithAPI1(url: string): Promise<string | null> {
  try {
    const screenshotUrl = `https://screenshotapi.net/api/v1/screenshot?url=${encodeURIComponent(url)}&width=1200&height=800&output=image&file_type=png&wait_for_event=load`;
    
    const response = await fetch(screenshotUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`ScreenshotAPI error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('ScreenshotAPI failed:', error);
    return null;
  }
}

// Screenshot service 2: Alternative service
async function screenshotWithAPI2(url: string): Promise<string | null> {
  try {
    // Using a different approach with ScrapingBee's screenshot API
    const screenshotUrl = `https://app.scrapingbee.com/api/v1/store/screenshot?api_key=demo&url=${encodeURIComponent(url)}&screenshot=true&screenshot_full_page=true&window_width=1200&window_height=800`;
    
    const response = await fetch(screenshotUrl, {
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`ScrapingBee error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('ScrapingBee failed:', error);
    return null;
  }
}

// Screenshot service 3: HTMLCSStoImage.com
async function screenshotWithAPI3(url: string): Promise<string | null> {
  try {
    const response = await fetch('https://hcti.io/v1/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Using demo credentials - in production you'd need real API keys
        'Authorization': 'Basic ' + btoa('demo:demo')
      },
      body: JSON.stringify({
        url: url,
        viewport_width: 1200,
        viewport_height: 800,
        device_scale_factor: 1
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTMLCSStoImage error: ${response.status}`);
    }

    const data = await response.json();
    if (data.url) {
      // Fetch the image and convert to base64
      const imageResponse = await fetch(data.url);
      const arrayBuffer = await imageResponse.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      return `data:image/png;base64,${base64}`;
    }
    
    return null;
  } catch (error) {
    console.error('HTMLCSStoImage failed:', error);
    return null;
  }
}