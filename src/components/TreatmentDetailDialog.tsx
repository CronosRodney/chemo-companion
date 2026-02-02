import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, Clock, Syringe } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TreatmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: any | null;
}

export default function TreatmentDetailDialog({ open, onOpenChange, plan }: TreatmentDetailDialogProps) {
  if (!plan) return null;

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'suspended': return 'Suspenso';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {plan.regimen_name}
            <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
              {getStatusLabel(plan.status)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {plan.line_of_therapy} • {plan.treatment_intent}
            {plan.diagnosis_cid && ` • CID: ${plan.diagnosis_cid}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Início</p>
                <p className="text-sm font-medium">{formatDate(plan.start_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Periodicidade</p>
                <p className="text-sm font-medium">a cada {plan.periodicity_days} dias</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Ciclos Planejados</p>
                <p className="text-sm font-medium">{plan.planned_cycles}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">SC (BSA)</p>
                <p className="text-sm font-medium">{plan.bsa_m2?.toFixed(2) || '-'} m²</p>
              </div>
            </div>
          </div>

          {/* Dados Antropométricos */}
          {(plan.weight_kg || plan.height_cm) && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Dados do Paciente</h4>
              <div className="grid grid-cols-3 gap-4">
                {plan.weight_kg && (
                  <div>
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="font-medium">{plan.weight_kg} kg</p>
                  </div>
                )}
                {plan.height_cm && (
                  <div>
                    <p className="text-xs text-muted-foreground">Altura</p>
                    <p className="font-medium">{plan.height_cm} cm</p>
                  </div>
                )}
                {plan.bsa_m2 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Superfície Corporal</p>
                    <p className="font-medium">{plan.bsa_m2.toFixed(2)} m²</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Drogas do Protocolo */}
          {plan.drugs && plan.drugs.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Syringe className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Drogas do Protocolo</h4>
              </div>
              <div className="space-y-3">
                {plan.drugs.map((drug: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{drug.drug_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {drug.reference_dose} {drug.dose_unit}
                        </p>
                      </div>
                      <Badge variant="outline">{drug.route}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Dias: {drug.day_codes.join(', ')}</span>
                      {drug.diluent && <span>• Diluente: {drug.diluent}</span>}
                      {drug.volume_ml && <span>• Volume: {drug.volume_ml}mL</span>}
                      {drug.infusion_time_min && <span>• Infusão: {drug.infusion_time_min}min</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limites Laboratoriais */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Parâmetros de Liberação</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Neutrófilos mín.</p>
                <p className="font-medium">{plan.anc_min || 1500}/mm³</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plaquetas mín.</p>
                <p className="font-medium">{(plan.plt_min || 100000).toLocaleString()}/mm³</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creatinina máx.</p>
                <p className="font-medium">{plan.scr_max || 1.5} mg/dL</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AST/ALT máx.</p>
                <p className="font-medium">{plan.ast_alt_max_xuln || 2.5}x ULN</p>
              </div>
            </div>
          </div>

          {/* Clínica */}
          {plan.clinic && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Clínica</h4>
              <p className="text-sm">{plan.clinic.clinic_name}</p>
              {plan.clinic.city && plan.clinic.state && (
                <p className="text-xs text-muted-foreground">{plan.clinic.city}, {plan.clinic.state}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
