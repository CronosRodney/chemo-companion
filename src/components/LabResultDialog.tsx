import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LabResultsService, LabResult, CreateLabResultData } from '@/services/labResultsService';

interface LabResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  userId: string;
  userRole: 'doctor' | 'patient';
  existingResult?: LabResult | null;
  onSuccess: () => void;
}

const EXAM_TYPES = [
  { value: 'hemograma', label: 'Hemograma Completo' },
  { value: 'bioquimica', label: 'Bioquímica' },
  { value: 'funcao_renal', label: 'Função Renal' },
  { value: 'funcao_hepatica', label: 'Função Hepática' },
  { value: 'coagulacao', label: 'Coagulação' },
  { value: 'marcadores', label: 'Marcadores Tumorais' },
  { value: 'hormonal', label: 'Painel Hormonal' },
  { value: 'imagem', label: 'Exame de Imagem' },
  { value: 'outro', label: 'Outro' },
];

export const LabResultDialog = ({
  open,
  onOpenChange,
  patientId,
  userId,
  userRole,
  existingResult,
  onSuccess
}: LabResultDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    exam_type: '',
    exam_name: '',
    scheduled_at: '',
    result_at: '',
    status: 'pending' as 'pending' | 'scheduled' | 'completed' | 'canceled',
    anc_value: '',
    plt_value: '',
    scr_value: '',
    ast_value: '',
    alt_value: '',
    bilirubin_value: '',
    hemoglobin_value: '',
    wbc_value: '',
    notes: '',
  });

  useEffect(() => {
    if (existingResult) {
      setFormData({
        exam_type: existingResult.exam_type || '',
        exam_name: existingResult.exam_name || '',
        scheduled_at: existingResult.scheduled_at?.split('T')[0] || '',
        result_at: existingResult.result_at?.split('T')[0] || '',
        status: existingResult.status || 'pending',
        anc_value: existingResult.anc_value?.toString() || '',
        plt_value: existingResult.plt_value?.toString() || '',
        scr_value: existingResult.scr_value?.toString() || '',
        ast_value: existingResult.ast_value?.toString() || '',
        alt_value: existingResult.alt_value?.toString() || '',
        bilirubin_value: existingResult.bilirubin_value?.toString() || '',
        hemoglobin_value: existingResult.hemoglobin_value?.toString() || '',
        wbc_value: existingResult.wbc_value?.toString() || '',
        notes: existingResult.notes || '',
      });
    } else {
      setFormData({
        exam_type: '',
        exam_name: '',
        scheduled_at: '',
        result_at: '',
        status: 'pending',
        anc_value: '',
        plt_value: '',
        scr_value: '',
        ast_value: '',
        alt_value: '',
        bilirubin_value: '',
        hemoglobin_value: '',
        wbc_value: '',
        notes: '',
      });
    }
  }, [existingResult, open]);

  const handleSave = async () => {
    if (!formData.exam_type || !formData.exam_name) {
      toast({
        title: "Campos obrigatórios",
        description: "Tipo e nome do exame são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      const payload: CreateLabResultData = {
        patient_id: patientId,
        created_by_id: userId,
        created_by_role: userRole,
        exam_type: formData.exam_type,
        exam_name: formData.exam_name,
        status: formData.status,
        scheduled_at: formData.scheduled_at || undefined,
        result_at: formData.result_at || undefined,
        anc_value: formData.anc_value ? parseInt(formData.anc_value) : undefined,
        plt_value: formData.plt_value ? parseInt(formData.plt_value) : undefined,
        scr_value: formData.scr_value ? parseFloat(formData.scr_value) : undefined,
        ast_value: formData.ast_value ? parseInt(formData.ast_value) : undefined,
        alt_value: formData.alt_value ? parseInt(formData.alt_value) : undefined,
        bilirubin_value: formData.bilirubin_value ? parseFloat(formData.bilirubin_value) : undefined,
        hemoglobin_value: formData.hemoglobin_value ? parseFloat(formData.hemoglobin_value) : undefined,
        wbc_value: formData.wbc_value ? parseInt(formData.wbc_value) : undefined,
        notes: formData.notes || undefined,
      };

      if (existingResult) {
        await LabResultsService.updateLabResult(existingResult.id, payload);
        toast({
          title: "Exame atualizado",
          description: "Os dados do exame foram atualizados"
        });
      } else {
        await LabResultsService.createLabResult(payload);
        toast({
          title: "Exame criado",
          description: "O exame foi adicionado com sucesso"
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving lab result:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingResult ? 'Editar Exame' : 'Novo Exame'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Exame *</Label>
              <Select
                value={formData.exam_type}
                onValueChange={(value) => setFormData({ ...formData, exam_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do Exame *</Label>
              <Input
                value={formData.exam_name}
                onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                placeholder="Ex: Hemograma pré-ciclo 3"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Agendada</Label>
              <Input
                type="date"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Data do Resultado</Label>
              <Input
                type="date"
                value={formData.result_at}
                onChange={(e) => setFormData({ ...formData, result_at: e.target.value })}
              />
            </div>
          </div>

          {/* Resultados laboratoriais */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Resultados Laboratoriais (opcional)</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">ANC (células/mm³)</Label>
                <Input
                  type="number"
                  value={formData.anc_value}
                  onChange={(e) => setFormData({ ...formData, anc_value: e.target.value })}
                  placeholder="1500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Plaquetas (/mm³)</Label>
                <Input
                  type="number"
                  value={formData.plt_value}
                  onChange={(e) => setFormData({ ...formData, plt_value: e.target.value })}
                  placeholder="150000"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Creatinina (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.scr_value}
                  onChange={(e) => setFormData({ ...formData, scr_value: e.target.value })}
                  placeholder="1.0"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Hemoglobina (g/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.hemoglobin_value}
                  onChange={(e) => setFormData({ ...formData, hemoglobin_value: e.target.value })}
                  placeholder="12.5"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Leucócitos (/mm³)</Label>
                <Input
                  type="number"
                  value={formData.wbc_value}
                  onChange={(e) => setFormData({ ...formData, wbc_value: e.target.value })}
                  placeholder="5000"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">AST/TGO (U/L)</Label>
                <Input
                  type="number"
                  value={formData.ast_value}
                  onChange={(e) => setFormData({ ...formData, ast_value: e.target.value })}
                  placeholder="25"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">ALT/TGP (U/L)</Label>
                <Input
                  type="number"
                  value={formData.alt_value}
                  onChange={(e) => setFormData({ ...formData, alt_value: e.target.value })}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Bilirrubina (mg/dL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.bilirubin_value}
                  onChange={(e) => setFormData({ ...formData, bilirubin_value: e.target.value })}
                  placeholder="0.8"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionais sobre o exame..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : existingResult ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
