import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { TreatmentService } from "@/services/treatmentService";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Loader2 } from "lucide-react";

interface ReleaseCycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: any | null;
  onSuccess: () => void;
}

export default function ReleaseCycleDialog({ 
  open, 
  onOpenChange, 
  cycle, 
  onSuccess 
}: ReleaseCycleDialogProps) {
  const [status, setStatus] = useState<'released' | 'delayed' | 'dose_adjusted' | 'cancelled'>('released');
  const [delayReason, setDelayReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Lab values for decision
  const [ancValue, setAncValue] = useState<string>("");
  const [pltValue, setPltValue] = useState<string>("");
  const [scrValue, setScrValue] = useState<string>("");

  if (!cycle) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // First update lab values if provided
      const labData: any = {};
      if (ancValue) labData.anc_value = parseInt(ancValue);
      if (pltValue) labData.plt_value = parseInt(pltValue);
      if (scrValue) labData.scr_value = parseFloat(scrValue);

      if (Object.keys(labData).length > 0) {
        await TreatmentService.updateCycleLabs(cycle.id, labData);
      }

      // Then release the cycle
      await TreatmentService.releaseCycle(
        cycle.id,
        status,
        status === 'delayed' || status === 'cancelled' ? delayReason : undefined
      );

      toast({
        title: "Ciclo atualizado",
        description: getSuccessMessage(status),
      });

      // Reset form
      setStatus('released');
      setDelayReason("");
      setAncValue("");
      setPltValue("");
      setScrValue("");

      onSuccess();
    } catch (error) {
      console.error('Error releasing cycle:', error);
      toast({
        variant: "destructive",
        title: "Erro ao liberar ciclo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSuccessMessage = (s: string) => {
    switch (s) {
      case 'released': return 'Ciclo liberado para administração';
      case 'delayed': return 'Ciclo adiado com sucesso';
      case 'dose_adjusted': return 'Ciclo liberado com ajuste de dose';
      case 'cancelled': return 'Ciclo cancelado';
      default: return 'Status atualizado';
    }
  };

  const statusOptions = [
    { 
      value: 'released', 
      label: 'Liberar', 
      description: 'Aprovar ciclo para administração',
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    { 
      value: 'delayed', 
      label: 'Adiar', 
      description: 'Postergar ciclo (exige motivo)',
      icon: Clock,
      color: 'text-yellow-600'
    },
    { 
      value: 'dose_adjusted', 
      label: 'Ajustar Dose', 
      description: 'Liberar com modificação de dose',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    { 
      value: 'cancelled', 
      label: 'Cancelar', 
      description: 'Cancelar este ciclo',
      icon: XCircle,
      color: 'text-red-600'
    },
  ];

  const needsReason = status === 'delayed' || status === 'cancelled';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Liberar Ciclo {cycle.cycle_number}</DialogTitle>
          <DialogDescription>
            Defina o status de liberação para administração do ciclo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lab Values Input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Exames Laboratoriais (opcional)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Neutrófilos (ANC)</Label>
                <Input
                  type="number"
                  placeholder={cycle.anc_value?.toString() || "ex: 1500"}
                  value={ancValue}
                  onChange={(e) => setAncValue(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Plaquetas</Label>
                <Input
                  type="number"
                  placeholder={cycle.plt_value?.toString() || "ex: 150000"}
                  value={pltValue}
                  onChange={(e) => setPltValue(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Creatinina</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={cycle.scr_value?.toString() || "ex: 1.2"}
                  value={scrValue}
                  onChange={(e) => setScrValue(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Decisão de Liberação</Label>
            <RadioGroup 
              value={status} 
              onValueChange={(v) => setStatus(v as any)}
              className="space-y-2"
            >
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      status === option.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setStatus(option.value as any)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Icon className={`h-5 w-5 ${option.color}`} />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Reason Input */}
          {needsReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Motivo {status === 'delayed' ? 'do Adiamento' : 'do Cancelamento'} *
              </Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo..."
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (needsReason && !delayReason.trim())}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
