import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pill, Clock, Building2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MedicationService } from '@/services/medicationService';
import { MultiSelect } from '@/components/MultiSelect';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

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

function MobileStepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i < currentStep ? 'bg-primary w-2.5 h-2.5' : i === currentStep ? 'bg-primary/60' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export default function Medications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const context = useAppContext();
  const { refetchMedications = () => {}, refetchEvents = () => {}, clinics = [], clinicsLoading = false, medications: userMedications = [] } = context || {};
  const isMobile = useIsMobile();
  
  const [medOptions, setMedOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form fields - multi-select
  const [selectedMedNames, setSelectedMedNames] = useState<string[]>([]);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('none');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [instructions, setInstructions] = useState('');
  const [intervalHours, setIntervalHours] = useState('');

  // Available options (dynamically filtered based on selected medications)
  const [allMedNames, setAllMedNames] = useState<string[]>([]);
  const [availableStrengths, setAvailableStrengths] = useState<string[]>([]);
  const [availableForms, setAvailableForms] = useState<string[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<string[]>([]);

  // Mobile step
  const mobileStep = selectedMedNames.length === 0
    ? 0
    : selectedStrengths.length === 0 && availableStrengths.length > 0
      ? 1
      : selectedForms.length === 0 && availableForms.length > 0
        ? 2
        : 3;

  useEffect(() => {
    loadMedOptions();
  }, []);

  useEffect(() => {
    if (selectedMedNames.length === 0) {
      setAvailableStrengths([]);
      setAvailableForms([]);
      setAvailableRoutes([]);
      return;
    }

    const selectedMeds = medOptions.filter(med => 
      selectedMedNames.includes(med.drug_name_inn_dcb)
    );

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
    setSelectedClinicId('none');
    setDose('');
    setFrequency('');
    setInstructions('');
    setIntervalHours('');
    setEditingId(null);
  };

  const handleDeleteMed = async (id: string) => {
    const { error } = await supabase.from('user_medications').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível remover.', variant: 'destructive' });
    } else {
      refetchMedications();
      toast({ title: 'Removido', description: 'Medicamento removido com sucesso.' });
    }
    setDeleteTarget(null);
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
      const fullFrequency = [frequency, intervalHours ? `a cada ${intervalHours}h` : ''].filter(Boolean).join(' · ');

      if (editingId) {
        // Update existing user_medication
        const { error } = await supabase.from('user_medications').update({
          dose: dose || null,
          frequency: fullFrequency || null,
          instructions: instructions || null,
          clinic_id: selectedClinicId !== 'none' ? selectedClinicId : null,
        }).eq('id', editingId);

        if (error) throw error;

        refetchMedications();
        toast({ title: 'Atualizado!', description: 'Medicamento atualizado com sucesso.' });
        resetForm();
      } else {
        for (const medName of selectedMedNames) {
          const medicationData = {
            name: medName,
            activeIngredient: medName,
            concentration: selectedStrengths.join(', ') || undefined,
            form: selectedForms.join(', ') || undefined,
            route: selectedRoutes.join(', ') || undefined,
          };

          const { id: medicationId } = await MedicationService.saveMedication(medicationData);
          await MedicationService.linkToUser(medicationId, dose, fullFrequency || undefined, instructions, selectedClinicId !== 'none' ? selectedClinicId : undefined);
          
          const selectedClinic = clinics.find(c => c.id === selectedClinicId);
          const eventDescription = [
            selectedClinic ? `Clínica: ${selectedClinic.clinic_name}` : '',
            selectedStrengths.length > 0 ? `Concentração: ${selectedStrengths.join(', ')}` : '',
            selectedForms.length > 0 ? `Forma: ${selectedForms.join(', ')}` : '',
            selectedRoutes.length > 0 ? `Via: ${selectedRoutes.join(', ')}` : '',
            dose ? `Dose: ${dose}` : '',
            fullFrequency ? `Frequência: ${fullFrequency}` : '',
            instructions ? `Instruções: ${instructions}` : ''
          ].filter(Boolean).join('\n');

          await MedicationService.addTimelineEvent(
            'medication',
            `Medicamento adicionado: ${medName}`,
            eventDescription || 'Medicamento adicionado com sucesso'
          );
        }

        refetchMedications();
        refetchEvents();
        toast({ title: 'Sucesso!', description: `${selectedMedNames.length} medicamento(s) salvo(s) com sucesso.` });
        resetForm();
      }
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

  // Shared field components
  const MedNameField = () => (
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
  );

  const StrengthField = () => (
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
  );

  const FormField = () => (
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
  );

  const RouteField = () => (
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
  );

  const ClinicField = () => (
    <div className="space-y-2">
      <Label htmlFor="clinic">Clínica (Opcional)</Label>
      {clinicsLoading ? (
        <p className="text-sm text-muted-foreground">Carregando clínicas...</p>
      ) : clinics.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-4">
          <p>Você ainda não escaneou nenhuma clínica.</p>
          <p className="mt-1">Vá para Home e escaneie o QR Code de uma clínica para poder selecioná-la aqui.</p>
        </div>
      ) : (
        <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma clínica..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma clínica</SelectItem>
            {clinics.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {clinic.clinic_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <p className="text-xs text-muted-foreground">
        A clínica que prescreveu/forneceu este medicamento
      </p>
    </div>
  );

  const doseFreqFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="dose">Dose Prescrita</Label>
        <Input
          id="dose"
          placeholder="Ex: 100mg, 200mg/m², 1 comprimido"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="frequency">Frequência</Label>
        <Input
          id="frequency"
          placeholder="Ex: 1x ao dia, a cada 21 dias, 2x por semana"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="intervalHours">Intervalo (horas)</Label>
        <Input
          id="intervalHours"
          type="number"
          min="1"
          placeholder="Ex: 6, 8, 12, 24"
          value={intervalHours}
          onChange={(e) => setIntervalHours(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">De quantas em quantas horas tomar</p>
      </div>
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
    </>
  );

  const saveButtons = (
    <div className="flex gap-3">
      <Button 
        onClick={handleSave} 
        disabled={isSaving || selectedMedNames.length === 0} 
        className="flex-1 h-12 text-base font-semibold rounded-xl"
      >
        {isSaving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
      </Button>
      <Button 
        variant="outline"
        onClick={resetForm} 
        className="h-12 rounded-xl"
      >
        {editingId ? 'Cancelar' : 'Limpar'}
      </Button>
    </div>
  );

  // Mobile progressive layout
  const renderMobileForm = () => (
    <div className="space-y-4">
      <MobileStepIndicator currentStep={mobileStep} totalSteps={4} />

      {/* Step 1: always visible */}
      <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <CardContent className="pt-5 pb-5 space-y-4">
          <MedNameField />
        </CardContent>
      </Card>

      {/* Step 2: concentration */}
      {selectedMedNames.length > 0 && availableStrengths.length > 0 && (
        <div className="animate-fade-in">
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardContent className="pt-5 pb-5 space-y-4">
              <StrengthField />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: form */}
      {selectedMedNames.length > 0 && (selectedStrengths.length > 0 || availableStrengths.length === 0) && availableForms.length > 0 && (
        <div className="animate-fade-in">
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardContent className="pt-5 pb-5 space-y-4">
              <FormField />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: route, dose, freq, clinic, save */}
      {selectedMedNames.length > 0 && (selectedStrengths.length > 0 || availableStrengths.length === 0) && (selectedForms.length > 0 || availableForms.length === 0) && (
        <div className="animate-fade-in">
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardContent className="pt-5 pb-5 space-y-5">
              {availableRoutes.length > 0 && <RouteField />}
              <ClinicField />
              {doseFreqFields}
              {saveButtons}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  // Desktop layout (unchanged)
  const renderDesktopForm = () => (
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
        <MedNameField />
        <StrengthField />
        <FormField />
        <RouteField />
        <ClinicField />
        {doseFreqFields}
        {saveButtons}
      </CardContent>
    </Card>
  );

  return (
    <div className={`min-h-screen p-4 pb-20 ${isMobile ? 'bg-[#F7F9FC]' : 'bg-gradient-to-br from-background via-primary/5 to-secondary/5'}`}>
      <div className={`container mx-auto space-y-6 ${isMobile ? 'max-w-lg' : 'max-w-2xl'}`}>
        <div className="flex items-center gap-4 pt-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className={`text-3xl font-bold ${isMobile ? 'text-slate-800' : 'bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent'}`}>
              Medicamentos
            </h1>
            <p className="text-sm text-muted-foreground">Busque e adicione medicamentos oncológicos</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Carregando medicamentos...</p>
          </div>
        ) : isMobile ? (
          renderMobileForm()
        ) : (
          renderDesktopForm()
        )}

        {/* Lista de medicamentos do usuário */}
        {userMedications.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">Meus Medicamentos</h2>
            {userMedications.map((med: any) => (
              <Card key={med.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 relative">
                <div className="absolute top-3 right-3 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingId(med.id);
                      setSelectedMedNames([med.name]);
                      setDose(med.dose || '');
                      setFrequency(med.frequency || '');
                      setInstructions(med.instructions || '');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const skip = localStorage.getItem('skipMedicationDeleteConfirm') === 'true';
                      if (skip) {
                        handleDeleteMed(med.id);
                      } else {
                        setDeleteTarget(med.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 pr-16">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Pill className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{med.name}</p>
                      {med.concentration && (
                        <p className="text-sm text-muted-foreground">{med.concentration}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {med.dose && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{med.dose}</span>
                        )}
                        {med.frequency && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="h-3 w-3" />{med.frequency}
                          </span>
                        )}
                        {med.clinic?.clinic_name && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Building2 className="h-3 w-3" />{med.clinic.clinic_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onConfirm={() => deleteTarget && handleDeleteMed(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
