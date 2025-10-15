import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MedicationService } from '@/services/medicationService';

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

  // Form fields
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedMed, setSelectedMed] = useState<OncologyMed | null>(null);
  
  const [selectedStrength, setSelectedStrength] = useState('');
  const [customStrength, setCustomStrength] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [customForm, setCustomForm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [customRoute, setCustomRoute] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    if (selectedMedId) {
      const med = medications.find(m => m.id === selectedMedId);
      if (med) {
        setSelectedMed(med);
        // Auto-select first option if available
        if (med.strengths && med.strengths.length > 0) {
          setSelectedStrength(med.strengths[0]);
        }
        if (med.dosage_forms && med.dosage_forms.length > 0) {
          setSelectedForm(med.dosage_forms[0]);
        }
        if (med.route && med.route.length > 0) {
          setSelectedRoute(med.route[0]);
        }
      }
    } else {
      setSelectedMed(null);
    }
  }, [selectedMedId, medications]);

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('oncology_meds' as any)
        .select('id, drug_name_inn_dcb, drug_class, strengths, dosage_forms, route, indications_oncology, common_adverse_events')
        .order('drug_name_inn_dcb');

      if (error) throw error;
      setMedications((data as any) || []);
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
    setSelectedMedId('');
    setSelectedMed(null);
    setSelectedStrength('');
    setCustomStrength('');
    setSelectedForm('');
    setCustomForm('');
    setSelectedRoute('');
    setCustomRoute('');
    setDose('');
    setFrequency('');
    setInstructions('');
  };

  const handleSave = async () => {
    if (!selectedMed) {
      toast({
        title: 'Atenção',
        description: 'Selecione um medicamento.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const finalStrength = customStrength || selectedStrength;
      const finalForm = customForm || selectedForm;
      const finalRoute = customRoute || selectedRoute;

      const medicationData = {
        name: selectedMed.drug_name_inn_dcb,
        active_ingredient: selectedMed.drug_name_inn_dcb,
        concentration: finalStrength || null,
        form: finalForm || null,
        route: finalRoute || null,
      };

      const { id: medicationId } = await MedicationService.saveMedication(medicationData);
      await MedicationService.linkToUser(medicationId, dose, frequency, instructions);
      await MedicationService.addTimelineEvent(
        'medication_added',
        `Medicamento adicionado: ${selectedMed.drug_name_inn_dcb}`,
        `Classe: ${selectedMed.drug_class || 'Não especificada'}\nConcentração: ${finalStrength || 'Não especificada'}\nDose: ${dose || 'Não especificada'}\nFrequência: ${frequency || 'Não especificada'}`
      );

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
                {/* Nome do Medicamento - Select */}
                <div className="space-y-2">
                  <Label htmlFor="medicationSelect">Nome do Medicamento *</Label>
                  <Select value={selectedMedId} onValueChange={setSelectedMedId}>
                    <SelectTrigger id="medicationSelect" className="text-base">
                      <SelectValue placeholder="Selecione o medicamento" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50 max-h-[300px]">
                      {medications.map((med) => (
                        <SelectItem key={med.id} value={med.id}>
                          {med.drug_name_inn_dcb}
                          {med.drug_class && ` - ${med.drug_class}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedMed && (
                  <>
                    {/* Info do medicamento selecionado */}
                    <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-semibold text-green-900 dark:text-green-100">
                              {selectedMed.drug_name_inn_dcb}
                            </div>
                            {selectedMed.drug_class && (
                              <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                                Classe: {selectedMed.drug_class}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Concentração - Select */}
                    <div className="space-y-2">
                      <Label>Concentração</Label>
                      {selectedMed.strengths && selectedMed.strengths.length > 0 ? (
                        <div className="space-y-2">
                          <Select value={selectedStrength} onValueChange={setSelectedStrength}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a concentração" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {selectedMed.strengths.map((strength, idx) => (
                                <SelectItem key={idx} value={strength}>
                                  {strength}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">Outra (informar manualmente)</SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedStrength === 'custom' && (
                            <Input
                              placeholder="Ex: 100mg/mL, 500mg"
                              value={customStrength}
                              onChange={(e) => setCustomStrength(e.target.value)}
                            />
                          )}
                        </div>
                      ) : (
                        <Input
                          placeholder="Ex: 100mg/mL, 500mg, 50mg/m²"
                          value={customStrength}
                          onChange={(e) => setCustomStrength(e.target.value)}
                        />
                      )}
                    </div>

                    {/* Forma Farmacêutica - Select */}
                    <div className="space-y-2">
                      <Label>Forma Farmacêutica</Label>
                      {selectedMed.dosage_forms && selectedMed.dosage_forms.length > 0 ? (
                        <div className="space-y-2">
                          <Select value={selectedForm} onValueChange={setSelectedForm}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma farmacêutica" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {selectedMed.dosage_forms.map((form, idx) => (
                                <SelectItem key={idx} value={form}>
                                  {form}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">Outra (informar manualmente)</SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedForm === 'custom' && (
                            <Input
                              placeholder="Ex: Comprimido, Solução injetável"
                              value={customForm}
                              onChange={(e) => setCustomForm(e.target.value)}
                            />
                          )}
                        </div>
                      ) : (
                        <Input
                          placeholder="Ex: Comprimido, Cápsula, Solução injetável"
                          value={customForm}
                          onChange={(e) => setCustomForm(e.target.value)}
                        />
                      )}
                    </div>

                    {/* Via de Administração - Select */}
                    <div className="space-y-2">
                      <Label>Via de Administração</Label>
                      {selectedMed.route && selectedMed.route.length > 0 ? (
                        <div className="space-y-2">
                          <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a via de administração" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {selectedMed.route.map((route, idx) => (
                                <SelectItem key={idx} value={route}>
                                  {route}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">Outra (informar manualmente)</SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedRoute === 'custom' && (
                            <Input
                              placeholder="Ex: Oral, Intravenosa, Subcutânea"
                              value={customRoute}
                              onChange={(e) => setCustomRoute(e.target.value)}
                            />
                          )}
                        </div>
                      ) : (
                        <Input
                          placeholder="Ex: Oral, Intravenosa (IV), Subcutânea (SC)"
                          value={customRoute}
                          onChange={(e) => setCustomRoute(e.target.value)}
                        />
                      )}
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
                        disabled={isSaving || !selectedMed} 
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
