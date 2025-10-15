import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

export default function ImportMeds() {
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState('Aguardando...');
  const { toast } = useToast();

  useEffect(() => {
    handleImport();
  }, []);

  const handleImport = async () => {
    setIsImporting(true);
    setStatus('Carregando arquivo CSV...');
    
    try {
      const response = await fetch('/oncology_meds_data.csv');
      const csvText = await response.text();
      
      setStatus('Processando CSV...');
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
      });

      setStatus(`Importando ${parsed.data.length} medicamentos...`);

      // Parse arrays
      const parseArray = (str: string | null): string[] | null => {
        if (!str) return null;
        const cleaned = str.replace(/^{|}$/g, '');
        if (!cleaned) return null;
        return cleaned.split(',').map(s => s.trim()).filter(s => s);
      };

      const medications = parsed.data.map((row: any) => ({
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
      }));

      // Filter out empty entries
      const validMeds = medications.filter((med: any) => med.drug_name_inn_dcb);

      // Insert in batches
      const batchSize = 50;
      let inserted = 0;

      for (let i = 0; i < validMeds.length; i += batchSize) {
        const batch = validMeds.slice(i, i + batchSize);
        setStatus(`Importando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(validMeds.length / batchSize)}...`);
        
        const { error } = await supabase
          .from('oncology_meds' as any)
          .upsert(batch as any, { 
            onConflict: 'drug_name_inn_dcb',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('Batch insert error:', error);
          throw error;
        }

        inserted += batch.length;
      }

      setStatus(`✅ Importação concluída! ${inserted} medicamentos importados.`);
      toast({
        title: 'Sucesso!',
        description: `${inserted} medicamentos importados com sucesso`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      setStatus(`❌ Erro: ${error?.message || 'Erro desconhecido'}`);
      toast({
        title: 'Erro',
        description: 'Erro ao importar medicamentos',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
      <div className="container mx-auto max-w-2xl pt-20">
        <Card>
          <CardHeader>
            <CardTitle>Importar Medicamentos Oncológicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              {isImporting && (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              )}
              <p className="text-lg font-medium">{status}</p>
            </div>
            <Button 
              onClick={handleImport} 
              disabled={isImporting}
              className="w-full"
            >
              {isImporting ? 'Importando...' : 'Reimportar Medicamentos'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
