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
  }, []);

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
