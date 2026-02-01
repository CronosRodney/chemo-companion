import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PharmacySearchParams {
  medication_name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}

interface PharmacyResult {
  name: string;
  address: string;
  distance_km?: number;
  phone?: string;
  price?: number;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  hours?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const params: PharmacySearchParams = await req.json();

    if (!params.medication_name) {
      return new Response(
        JSON.stringify({ error: 'Medication name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Note: In a real implementation, this would integrate with:
    // - Google Places API for pharmacy locations
    // - Pharmacy APIs for pricing and availability
    // - Delivery service APIs (iFood, Rappi, etc.)
    
    // For now, return mock data to demonstrate the feature
    const mockResults: PharmacyResult[] = [
      {
        name: 'Farmácia São Paulo',
        address: 'Av. Paulista, 1000 - São Paulo, SP',
        distance_km: 1.2,
        phone: '(11) 3333-4444',
        price: 189.90,
        availability: 'in_stock',
        hours: '24 horas'
      },
      {
        name: 'Drogasil',
        address: 'Rua Augusta, 500 - São Paulo, SP',
        distance_km: 2.5,
        phone: '(11) 3333-5555',
        price: 195.00,
        availability: 'in_stock',
        hours: '07:00 - 22:00'
      },
      {
        name: 'Droga Raia',
        address: 'Rua Oscar Freire, 200 - São Paulo, SP',
        distance_km: 3.1,
        phone: '(11) 3333-6666',
        price: 192.50,
        availability: 'low_stock',
        hours: '08:00 - 21:00'
      },
      {
        name: 'Farmácia Popular',
        address: 'Av. Brasil, 1500 - São Paulo, SP',
        distance_km: 4.8,
        phone: '(11) 3333-7777',
        price: 45.00,
        availability: 'in_stock',
        hours: '08:00 - 18:00'
      }
    ];

    // Filter and sort by distance
    const filteredResults = mockResults
      .filter(r => !params.radius_km || (r.distance_km && r.distance_km <= params.radius_km))
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    console.log(`Pharmacy search for "${params.medication_name}": ${filteredResults.length} results`);

    return new Response(
      JSON.stringify({
        medication: params.medication_name,
        results: filteredResults,
        search_location: params.location || 'Localização atual',
        total_results: filteredResults.length,
        note: 'Esta é uma demonstração. Em produção, os dados serão obtidos de APIs de farmácias reais.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-pharmacies:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
