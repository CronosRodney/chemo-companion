import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { csvData } = await req.json();

    if (!csvData || !Array.isArray(csvData)) {
      throw new Error('Invalid CSV data format');
    }

    const medications = csvData.map((row: any) => {
      // Parse arrays from PostgreSQL array format {item1,item2}
      const parseArray = (str: string | null): string[] | null => {
        if (!str) return null;
        const cleaned = str.replace(/^{|}$/g, '');
        if (!cleaned) return null;
        return cleaned.split(',').map(s => s.trim()).filter(s => s);
      };

      return {
        drug_name_inn_dcb: row.drug_name_inn_dcb || null,
        synonyms_brand_generic: parseArray(row.synonyms_brand_generic),
        atc_code: row.atc_code || null,
        drug_class: row.drug_class || null,
        indications_oncology: parseArray(row.indications_oncology),
        line_of_therapy: row.line_of_therapy || null,
        regimen_examples: parseArray(row.regimen_examples),
        dosage_forms: parseArray(row.dosage_forms),
        strengths: row.strengths ? row.strengths.split(',').map((s: string) => s.trim()) : null,
        route: parseArray(row.route),
        dosing_standard: row.dosing_standard || null,
        adjustments: row.adjustments ? JSON.parse(row.adjustments) : null,
        black_box_warnings: row.black_box_warnings || null,
        common_adverse_events: parseArray(row.common_adverse_events),
        monitoring: parseArray(row.monitoring),
        contraindications: parseArray(row.contraindications),
        pregnancy_lactation: row.pregnancy_lactation || null,
        interactions_key: parseArray(row.interactions_key),
        reference_sources: parseArray(row.references),
        status_brazil_anvisa: row.status_brazil_anvisa || null,
        manufacturer_originator: row.manufacturer_originator || null,
        biosimilar_flag: row.biosimilar_flag === 'true' || row.biosimilar_flag === true,
        pediatric_approved: row.pediatric_approved === 'true' || row.pediatric_approved === true,
      };
    });

    // Insert medications in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < medications.length; i += batchSize) {
      const batch = medications.slice(i, i + batchSize);
      
      const { error } = await supabaseClient
        .from('oncology_meds')
        .upsert(batch, { 
          onConflict: 'drug_name_inn_dcb',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Batch insert error:', error);
        throw error;
      }

      inserted += batch.length;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Imported ${inserted} medications successfully` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
