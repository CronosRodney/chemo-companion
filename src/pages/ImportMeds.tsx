import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

export default function ImportMeds() {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      // Fetch CSV file from public folder
      const response = await fetch('/oncology_meds_data.csv');
      const csvText = await response.text();
      
      // Parse CSV
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
      });

      // Call edge function to import
      const { data, error } = await supabase.functions.invoke('import-oncology-meds', {
        body: { csvData: parsed.data }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: data.message || 'Medicamentos importados com sucesso',
      });
    } catch (error) {
      console.error('Import error:', error);
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
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Clique no botão abaixo para importar os dados dos medicamentos oncológicos para o banco de dados.
            </p>
            <Button 
              onClick={handleImport} 
              disabled={isImporting}
              className="w-full"
            >
              {isImporting ? 'Importando...' : 'Importar Medicamentos'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
