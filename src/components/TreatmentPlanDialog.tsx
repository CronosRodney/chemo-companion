import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { calculateBSA } from "@/services/bsaCalculator";
import { TreatmentService } from "@/services/treatmentService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface TreatmentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Drug {
  drug_name: string;
  reference_dose: number;
  dose_unit: string;
  route: string;
  diluent?: string;
  volume_ml?: number;
  infusion_time_min?: number;
  day_codes: string[];
}

export default function TreatmentPlanDialog({ open, onOpenChange, onSuccess }: TreatmentPlanDialogProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  
  // Plan data
  const [regimenName, setRegimenName] = useState("");
  const [lineOfTherapy, setLineOfTherapy] = useState("1st");
  const [treatmentIntent, setTreatmentIntent] = useState("curative");
  const [plannedCycles, setPlannedCycles] = useState(6);
  const [periodicityDays, setPeriodicityDays] = useState(21);
  const [diagnosisCid, setDiagnosisCid] = useState("");
  
  // Patient params
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(170);
  const [bsaM2, setBsaM2] = useState<number>(0);
  
  // Start date
  const [startDate, setStartDate] = useState("");
  
  // Drugs
  const [drugs, setDrugs] = useState<Drug[]>([]);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  useEffect(() => {
    if (weightKg && heightCm) {
      const bsa = calculateBSA(weightKg, heightCm);
      setBsaM2(bsa);
    }
  }, [weightKg, heightCm]);

  const loadTemplates = async () => {
    try {
      const data = await TreatmentService.listRegimenTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId === "custom") {
      setIsCustom(true);
      setRegimenName("");
      setDrugs([]);
    } else {
      setIsCustom(false);
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setRegimenName(template.name);
        setPlannedCycles(template.typical_cycles || 6);
        setPeriodicityDays(template.typical_periodicity_days || 21);
        setDrugs(template.drugs_template || []);
      }
    }
  };

  const addDrug = () => {
    setDrugs([...drugs, {
      drug_name: "",
      reference_dose: 0,
      dose_unit: "mg/m2",
      route: "IV",
      day_codes: ["D1"]
    }]);
  };

  const removeDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
  };

  const updateDrug = (index: number, field: keyof Drug, value: any) => {
    const newDrugs = [...drugs];
    newDrugs[index] = { ...newDrugs[index], [field]: value };
    setDrugs(newDrugs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!regimenName || drugs.length === 0) {
      toast.error("Preencha o nome do protocolo e adicione pelo menos uma droga");
      return;
    }

    if (!startDate) {
      toast.error("Defina a data de início do tratamento");
      return;
    }

    try {
      await TreatmentService.createTreatmentPlan(
        {
          diagnosis_cid: diagnosisCid,
          line_of_therapy: lineOfTherapy,
          treatment_intent: treatmentIntent,
          regimen_name: regimenName,
          planned_cycles: plannedCycles,
          periodicity_days: periodicityDays,
          weight_kg: weightKg,
          height_cm: heightCm,
          start_date: startDate
        },
        drugs
      );

      toast.success("Plano de tratamento criado com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating treatment plan:", error);
      toast.error(error.message || "Erro ao criar plano de tratamento");
    }
  };

  const resetForm = () => {
    setSelectedTemplate("");
    setIsCustom(false);
    setRegimenName("");
    setLineOfTherapy("1st");
    setTreatmentIntent("curative");
    setPlannedCycles(6);
    setPeriodicityDays(21);
    setDiagnosisCid("");
    setWeightKg(70);
    setHeightCm(170);
    setStartDate("");
    setDrugs([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Plano de Tratamento</DialogTitle>
          <DialogDescription>
            Configure o protocolo de quimioterapia para o paciente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Protocolo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Protocolo</h3>
            
            <div>
              <Label>Selecionar Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um protocolo ou crie personalizado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Protocolo Personalizado</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isCustom && (
              <div>
                <Label>Nome do Protocolo</Label>
                <Input 
                  value={regimenName}
                  onChange={(e) => setRegimenName(e.target.value)}
                  placeholder="Ex: FOLFOX modificado"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Linha de Tratamento</Label>
                <Select value={lineOfTherapy} onValueChange={setLineOfTherapy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1ª Linha</SelectItem>
                    <SelectItem value="2nd">2ª Linha</SelectItem>
                    <SelectItem value="3rd">3ª Linha</SelectItem>
                    <SelectItem value="palliative">Paliativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Intenção do Tratamento</Label>
                <Select value={treatmentIntent} onValueChange={setTreatmentIntent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="curative">Curativo</SelectItem>
                    <SelectItem value="neoadjuvant">Neoadjuvante</SelectItem>
                    <SelectItem value="adjuvant">Adjuvante</SelectItem>
                    <SelectItem value="palliative">Paliativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Total de Ciclos</Label>
                <Input 
                  type="number"
                  min="1"
                  value={plannedCycles}
                  onChange={(e) => setPlannedCycles(parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <Label>Periodicidade (dias)</Label>
                <Select value={periodicityDays.toString()} onValueChange={(v) => setPeriodicityDays(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="21">21 dias</SelectItem>
                    <SelectItem value="28">28 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data de Início</Label>
                <Input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Parâmetros do Paciente */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Parâmetros do Paciente</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Peso (kg)</Label>
                <Input 
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label>Altura (cm)</Label>
                <Input 
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label>SC (m²)</Label>
                <Input 
                  value={bsaM2.toFixed(2)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Calculado (DuBois)</p>
              </div>
            </div>
          </div>

          {/* Seção 3: Drogas */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Drogas do Protocolo</h3>
              <Button type="button" variant="outline" size="sm" onClick={addDrug}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Droga
              </Button>
            </div>

            {drugs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma droga adicionada. Clique em "Adicionar Droga" para começar.
              </p>
            )}

            {drugs.map((drug, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-sm">Droga #{index + 1}</h4>
                    <Button 
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDrug(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nome</Label>
                      <Input 
                        value={drug.drug_name}
                        onChange={(e) => updateDrug(index, 'drug_name', e.target.value)}
                        placeholder="Ex: Oxaliplatina"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Dose Referência</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="number"
                          step="0.01"
                          value={drug.reference_dose || ""}
                          onChange={(e) => updateDrug(index, 'reference_dose', parseFloat(e.target.value) || 0)}
                          placeholder="85"
                          className="flex-1"
                        />
                        <Select 
                          value={drug.dose_unit}
                          onValueChange={(v) => updateDrug(index, 'dose_unit', v)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mg/m2">mg/m²</SelectItem>
                            <SelectItem value="mg">mg</SelectItem>
                            <SelectItem value="mg/kg">mg/kg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Via</Label>
                      <Select 
                        value={drug.route}
                        onValueChange={(v) => updateDrug(index, 'route', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IV">Intravenosa (IV)</SelectItem>
                          <SelectItem value="VO">Oral (VO)</SelectItem>
                          <SelectItem value="SC">Subcutânea (SC)</SelectItem>
                          <SelectItem value="IM">Intramuscular (IM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Dias</Label>
                      <Input 
                        value={drug.day_codes.join(", ")}
                        onChange={(e) => updateDrug(index, 'day_codes', e.target.value.split(",").map(d => d.trim()))}
                        placeholder="D1, D8, D15"
                      />
                    </div>

                    {drug.route === 'IV' && (
                      <>
                        <div>
                          <Label className="text-xs">Diluente</Label>
                          <Select 
                            value={drug.diluent || ""}
                            onValueChange={(v) => updateDrug(index, 'diluent', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SF">Soro Fisiológico</SelectItem>
                              <SelectItem value="SG5">Soro Glicosado 5%</SelectItem>
                              <SelectItem value="SG10">Soro Glicosado 10%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Volume (mL)</Label>
                          <Input 
                            type="number"
                            value={drug.volume_ml || ""}
                            onChange={(e) => updateDrug(index, 'volume_ml', parseInt(e.target.value) || undefined)}
                            placeholder="250"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Tempo Infusão (min)</Label>
                          <Input 
                            type="number"
                            value={drug.infusion_time_min || ""}
                            onChange={(e) => updateDrug(index, 'infusion_time_min', parseInt(e.target.value) || undefined)}
                            placeholder="120"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 justify-end border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Plano de Tratamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
