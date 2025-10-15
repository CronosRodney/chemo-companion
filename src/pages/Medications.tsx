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
  
  const [medOptions, setMedOptions] = useState<any[]>([]);
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

  // Available options (dynamically filtered based on selected medications)
  const [allMedNames, setAllMedNames] = useState<string[]>([]);
  const [availableStrengths, setAvailableStrengths] = useState<string[]>([]);
  const [availableForms, setAvailableForms] = useState<string[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<string[]>([]);

  useEffect(() => {
    loadMedOptions();
  }, []);

  // Update available options when selected medications change
  useEffect(() => {
    if (selectedMedNames.length === 0) {
      setAvailableStrengths([]);
      setAvailableForms([]);
      setAvailableRoutes([]);
      return;
    }

    // Filter options based on selected medications
    const selectedMeds = medOptions.filter(med => 
      selectedMedNames.includes(med.drug_name_inn_dcb)
    );

    // Combine and deduplicate options
    const strengthsSet = new Set<string>();
    const formsSet = new Set<string>();
    const routesSet = new Set<string>();

    selectedMeds.forEach(med => {
      med.strengths?.forEach((s: string) => strengthsSet.add(s));
      med.dosage_forms?.forEach((f: string) => formsSet.add(f));
      med.route?.forEach((r: string) => routesSet.add(r));
    });

    setAvailableStrengths(Array.from(strengthsSet).sort());
    setAvailableForms(Array.from(formsSet).sort());
    setAvailableRoutes(Array.from(routesSet).sort());

    // Clear selections that are no longer valid
    setSelectedStrengths(prev => prev.filter(s => strengthsSet.has(s)));
    setSelectedForms(prev => prev.filter(f => formsSet.has(f)));
    setSelectedRoutes(prev => prev.filter(r => routesSet.has(r)));
  }, [selectedMedNames, medOptions]);

  const loadMedOptions = async () => {
    try {
      const response = await fetch('/meds_options.csv');
      const csvText = await response.text();
      
      const Papa = (await import('papaparse')).default;
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
      });

      const parseArray = (str: string | null): string[] => {
        if (!str) return [];
        // Handle PostgreSQL array format {\"...\",\"...\"}
        const cleaned = str.replace(/^{|}$/g, '').replace(/"/g, '');
        if (!cleaned) return [];
        return cleaned.split(',').map(s => s.trim()).filter(s => s);
      };

      const options = parsed.data.map((row: any) => ({
        drug_name_inn_dcb: row.drug_name_inn_dcb,
        strengths: parseArray(row.strengths),
        dosage_forms: parseArray(row.dosage_forms),
        route: parseArray(row.route),
      })).filter((med: any) => med.drug_name_inn_dcb);

      setMedOptions(options);
      
      // Extract all medication names
      const names = options.map((m: any) => m.drug_name_inn_dcb).sort();
      setAllMedNames(names);
    } catch (error) {
      console.error('Error loading medication options:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as opções de medicamentos.',
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
        
        // Add event to timeline
        const eventDescription = [
          selectedStrengths.length > 0 ? `Concentração: ${selectedStrengths.join(', ')}` : '',
          selectedForms.length > 0 ? `Forma: ${selectedForms.join(', ')}` : '',
          selectedRoutes.length > 0 ? `Via: ${selectedRoutes.join(', ')}` : '',
          dose ? `Dose: ${dose}` : '',
          frequency ? `Frequência: ${frequency}` : '',
          instructions ? `Instruções: ${instructions}` : ''
        ].filter(Boolean).join('\n');

        await MedicationService.addTimelineEvent(
          'medication',
          `Medicamento adicionado: ${medName}`,
          eventDescription || 'Medicamento adicionado com sucesso'
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

                {/* Concentração - MultiSelect (dependent on medication selection) */}
                <div className="space-y-2">
                  <Label>Concentração</Label>
                  <MultiSelect
                    options={availableStrengths}
                    selected={selectedStrengths}
                    onChange={setSelectedStrengths}
                    placeholder={selectedMedNames.length === 0 ? "Primeiro selecione um medicamento" : "Busque e selecione concentrações..."}
                    emptyMessage={selectedMedNames.length === 0 ? "Selecione medicamentos primeiro" : "Nenhuma concentração disponível."}
                  />
                </div>

                {/* Forma Farmacêutica - MultiSelect (dependent on medication selection) */}
                <div className="space-y-2">
                  <Label>Forma Farmacêutica</Label>
                  <MultiSelect
                    options={availableForms}
                    selected={selectedForms}
                    onChange={setSelectedForms}
                    placeholder={selectedMedNames.length === 0 ? "Primeiro selecione um medicamento" : "Busque e selecione formas farmacêuticas..."}
                    emptyMessage={selectedMedNames.length === 0 ? "Selecione medicamentos primeiro" : "Nenhuma forma disponível."}
                  />
                </div>

                {/* Via de Administração - MultiSelect (dependent on medication selection) */}
                <div className="space-y-2">
                  <Label>Via de Administração</Label>
                  <MultiSelect
                    options={availableRoutes}
                    selected={selectedRoutes}
                    onChange={setSelectedRoutes}
                    placeholder={selectedMedNames.length === 0 ? "Primeiro selecione um medicamento" : "Busque e selecione vias de administração..."}
                    emptyMessage={selectedMedNames.length === 0 ? "Selecione medicamentos primeiro" : "Nenhuma via disponível."}
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
