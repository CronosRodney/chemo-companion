import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MedicationService } from '@/services/medicationService';
import { MultiSelect } from '@/components/MultiSelect';

interface OncologyMed {
  id: string;
  drug_name_inn_dcb: string;
  drug_class: string;
  strengths: string[];
  dosage_forms: string[];
  route: string[];
  indications_oncology: string[];
  common_adverse_events: string[];
}

export default function Medications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [medications, setMedications] = useState<OncologyMed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields - multi-select
  const [selectedMedNames, setSelectedMedNames] = useState<string[]>([]);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [instructions, setInstructions] = useState('');

  // Available options
  const [allMedNames, setAllMedNames] = useState<string[]>([]);
  const [allStrengths, setAllStrengths] = useState<string[]>([]);
  const [allForms, setAllForms] = useState<string[]>([]);
  const [allRoutes, setAllRoutes] = useState<string[]>([]);

  useEffect(() => {
    loadMedications();
    checkAndImportData();
  }, []);

  const checkAndImportData = async () => {
    try {
      const { data, error } = await supabase
        .from('oncology_meds' as any)
        .select('id')
        .limit(1);

      if (!error && (!data || data.length === 0)) {
        // Table is empty, import data
        await importData();
      }
    } catch (error) {
      console.error('Error checking data:', error);
    }
  };

  const importData = async () => {
    try {
      const response = await fetch('/oncology_meds_data.csv');
      const csvText = await response.text();
      
      const Papa = (await import('papaparse')).default;
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
      });

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

      const validMeds = medications.filter((med: any) => med.drug_name_inn_dcb);

      const batchSize = 50;
      for (let i = 0; i < validMeds.length; i += batchSize) {
        const batch = validMeds.slice(i, i + batchSize);
        
        await supabase
          .from('oncology_meds' as any)
          .upsert(batch as any, { 
            onConflict: 'drug_name_inn_dcb',
            ignoreDuplicates: false 
          });
      }

      // Reload medications after import
      await loadMedications();
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('oncology_meds' as any)
        .select('id, drug_name_inn_dcb, drug_class, strengths, dosage_forms, route, indications_oncology, common_adverse_events')
        .order('drug_name_inn_dcb');

      if (error) throw error;
      setMedications((data as any) || []);
      
      // Extract all unique values for multi-selects
      const names = new Set<string>();
      const strengths = new Set<string>();
      const forms = new Set<string>();
      const routes = new Set<string>();
      
      (data as any)?.forEach((med: OncologyMed) => {
        names.add(med.drug_name_inn_dcb);
        med.strengths?.forEach(s => strengths.add(s));
        med.dosage_forms?.forEach(f => forms.add(f));
        med.route?.forEach(r => routes.add(r));
      });
      
      setAllMedNames(Array.from(names).sort());
      setAllStrengths(Array.from(strengths).sort());
      setAllForms(Array.from(forms).sort());
      setAllRoutes(Array.from(routes).sort());
    } catch (error) {
      console.error('Error loading medications:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de medicamentos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMedNames([]);
    setSelectedStrengths([]);
    setSelectedForms([]);
    setSelectedRoutes([]);
    setDose('');
    setFrequency('');
    setInstructions('');
  };

  const handleSave = async () => {
    if (selectedMedNames.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione pelo menos um medicamento.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Save each selected medication
      for (const medName of selectedMedNames) {
        const medicationData = {
          name: medName,
          active_ingredient: medName,
          concentration: selectedStrengths.join(', ') || null,
          form: selectedForms.join(', ') || null,
          route: selectedRoutes.join(', ') || null,
        };

        const { id: medicationId } = await MedicationService.saveMedication(medicationData);
        await MedicationService.linkToUser(medicationId, dose, frequency, instructions);
        await MedicationService.addTimelineEvent(
          'medication_added',
          `Medicamento adicionado: ${medName}`,
          `Concentração: ${selectedStrengths.join(', ') || 'Não especificada'}\nForma: ${selectedForms.join(', ') || 'Não especificada'}\nVia: ${selectedRoutes.join(', ') || 'Não especificada'}\nDose: ${dose || 'Não especificada'}\nFrequência: ${frequency || 'Não especificada'}`
        );
      }

      toast({
        title: 'Sucesso!',
        description: 'Medicamento salvo com sucesso.',
      });

      resetForm();
    } catch (error) {
      console.error('Error saving medication:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o medicamento.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4 pb-20">
      <div className="container mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4 pt-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Medicamentos
            </h1>
            <p className="text-sm text-muted-foreground">Busque e adicione medicamentos oncológicos</p>
          </div>
        </div>

        <Card className="luxury-card border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Adicionar Medicamento
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Preencha as informações do medicamento
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Carregando medicamentos...</p>
              </div>
            )}

            {!isLoading && (
              <>
                {/* Nome do Medicamento - MultiSelect */}
                <div className="space-y-2">
                  <Label>Nome do Medicamento *</Label>
                  <MultiSelect
                    options={allMedNames}
                    selected={selectedMedNames}
                    onChange={setSelectedMedNames}
                    placeholder="Busque e selecione medicamentos..."
                    emptyMessage="Nenhum medicamento encontrado."
                  />
                  <p className="text-xs text-muted-foreground">
                    Você pode selecionar múltiplos medicamentos
                  </p>
                </div>

                {/* Concentração - MultiSelect */}
                <div className="space-y-2">
                  <Label>Concentração</Label>
                  <MultiSelect
                    options={allStrengths}
                    selected={selectedStrengths}
                    onChange={setSelectedStrengths}
                    placeholder="Busque e selecione concentrações..."
                    emptyMessage="Nenhuma concentração encontrada."
                  />
                </div>

                {/* Forma Farmacêutica - MultiSelect */}
                <div className="space-y-2">
                  <Label>Forma Farmacêutica</Label>
                  <MultiSelect
                    options={allForms}
                    selected={selectedForms}
                    onChange={setSelectedForms}
                    placeholder="Busque e selecione formas farmacêuticas..."
                    emptyMessage="Nenhuma forma encontrada."
                  />
                </div>

                {/* Via de Administração - MultiSelect */}
                <div className="space-y-2">
                  <Label>Via de Administração</Label>
                  <MultiSelect
                    options={allRoutes}
                    selected={selectedRoutes}
                    onChange={setSelectedRoutes}
                    placeholder="Busque e selecione vias de administração..."
                    emptyMessage="Nenhuma via encontrada."
                  />
                </div>

                {/* Dose Prescrita */}
                <div className="space-y-2">
                  <Label htmlFor="dose">Dose Prescrita</Label>
                  <Input
                    id="dose"
                    placeholder="Ex: 100mg, 200mg/m², 1 comprimido"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                  />
                </div>

                {/* Frequência */}
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Input
                    id="frequency"
                    placeholder="Ex: 1x ao dia, a cada 21 dias, 2x por semana"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  />
                </div>

                {/* Instruções Adicionais */}
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instruções Adicionais</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Observações, cuidados especiais, horários específicos, etc."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || selectedMedNames.length === 0} 
                    className="flex-1 h-12 text-base font-semibold"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Medicamento'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={resetForm} 
                    className="h-12"
                  >
                    Limpar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
