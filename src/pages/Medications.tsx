import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, CheckCircle, Pill, X } from 'lucide-react';
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
  const [medicationName, setMedicationName] = useState('');
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<OncologyMed[]>([]);
  const [selectedMed, setSelectedMed] = useState<OncologyMed | null>(null);
  
  const [drugClass, setDrugClass] = useState('');
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
    if (medicationName.trim() && medicationName.length >= 2) {
      const filtered = medications.filter(med =>
        med.drug_name_inn_dcb.toLowerCase().includes(medicationName.toLowerCase())
      );
      setNameSuggestions(filtered.slice(0, 8));
      setShowNameSuggestions(true);
    } else {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
    }
  }, [medicationName, medications]);

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

  const handleSelectMedicationFromSuggestion = (med: OncologyMed) => {
    setSelectedMed(med);
    setMedicationName(med.drug_name_inn_dcb);
    setDrugClass(med.drug_class || '');
    setShowNameSuggestions(false);
    
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
  };

  const resetForm = () => {
    setMedicationName('');
    setDrugClass('');
    setSelectedStrength('');
    setCustomStrength('');
    setSelectedForm('');
    setCustomForm('');
    setSelectedRoute('');
    setCustomRoute('');
    setDose('');
    setFrequency('');
    setInstructions('');
    setSelectedMed(null);
  };

  const handleSave = async () => {
    if (!medicationName.trim()) {
      toast({
        title: 'Atenção',
        description: 'Informe o nome do medicamento.',
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
        name: medicationName,
        active_ingredient: medicationName,
        concentration: finalStrength || null,
        form: finalForm || null,
        route: finalRoute || null,
      };

      const { id: medicationId } = await MedicationService.saveMedication(medicationData);
      await MedicationService.linkToUser(medicationId, dose, frequency, instructions);
      await MedicationService.addTimelineEvent(
        'medication_added',
        `Medicamento adicionado: ${medicationName}`,
        `Classe: ${drugClass || 'Não especificada'}\nConcentração: ${finalStrength || 'Não especificada'}\nDose: ${dose || 'Não especificada'}\nFrequência: ${frequency || 'Não especificada'}`
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
            {/* Nome do Medicamento - Com Autocomplete */}
            <div className="space-y-2 relative">
              <Label htmlFor="medicationName">Nome do Medicamento *</Label>
              <Input
                id="medicationName"
                placeholder="Digite o nome do medicamento..."
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                onFocus={() => medicationName.length >= 2 && setShowNameSuggestions(true)}
                disabled={isLoading}
                className="text-base"
              />
              
              {showNameSuggestions && nameSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  {nameSuggestions.map((med) => (
                    <button
                      key={med.id}
                      onClick={() => handleSelectMedicationFromSuggestion(med)}
                      className="w-full p-3 text-left hover:bg-accent transition-colors border-b last:border-b-0 flex items-start gap-3"
                    >
                      <Pill className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{med.drug_name_inn_dcb}</div>
                        {med.drug_class && (
                          <div className="text-xs text-muted-foreground">{med.drug_class}</div>
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowNameSuggestions(false)}
                    className="w-full p-2 text-center text-xs text-muted-foreground hover:bg-accent"
                  >
                    Fechar sugestões
                  </button>
                </div>
              )}
            </div>

            {/* Classe Terapêutica */}
            <div className="space-y-2">
              <Label htmlFor="drugClass">Classe Terapêutica / Tipologia</Label>
              <Input
                id="drugClass"
                placeholder="Ex: Agente Alquilante, Inibidor de Tirosina Quinase..."
                value={drugClass}
                onChange={(e) => setDrugClass(e.target.value)}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                Preenchido automaticamente ao selecionar um medicamento, mas pode ser editado
              </p>
            </div>

            {/* Concentração - Select ou Custom */}
            <div className="space-y-2">
              <Label>Concentração</Label>
              {selectedMed && selectedMed.strengths && selectedMed.strengths.length > 0 ? (
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

            {/* Forma Farmacêutica - Select ou Custom */}
            <div className="space-y-2">
              <Label>Forma Farmacêutica</Label>
              {selectedMed && selectedMed.dosage_forms && selectedMed.dosage_forms.length > 0 ? (
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

            {/* Via de Administração - Select ou Custom */}
            <div className="space-y-2">
              <Label>Via de Administração</Label>
              {selectedMed && selectedMed.route && selectedMed.route.length > 0 ? (
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
                disabled={isSaving || !medicationName.trim()} 
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
