import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  TestTube, 
  Edit, 
  Trash2, 
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { LabResultsService, LabResult } from '@/services/labResultsService';
import { LabResultDialog } from '@/components/LabResultDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LabResultsManagerProps {
  patientId: string;
  userId: string;
  userRole: 'doctor' | 'patient';
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  hemograma: 'Hemograma',
  bioquimica: 'Bioquímica',
  funcao_renal: 'Função Renal',
  funcao_hepatica: 'Função Hepática',
  coagulacao: 'Coagulação',
  marcadores: 'Marcadores Tumorais',
  hormonal: 'Hormonal',
  imagem: 'Imagem',
  outro: 'Outro',
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: 'Pendente', icon: Clock, className: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Agendado', icon: Calendar, className: 'bg-primary/10 text-primary' },
  completed: { label: 'Concluído', icon: CheckCircle2, className: 'bg-success/10 text-success' },
  canceled: { label: 'Cancelado', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
};

export const LabResultsManager = ({ patientId, userId, userRole }: LabResultsManagerProps) => {
  const { toast } = useToast();
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<LabResult | null>(null);

  const fetchLabResults = useCallback(async () => {
    try {
      setLoading(true);
      const results = await LabResultsService.getLabResults(patientId);
      setLabResults(results);
    } catch (error: any) {
      console.error('Error fetching lab results:', error);
      toast({
        title: "Erro ao carregar exames",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    if (patientId) {
      fetchLabResults();
    }
  }, [patientId, fetchLabResults]);

  const handleCreate = () => {
    setSelectedResult(null);
    setDialogOpen(true);
  };

  const handleEdit = (result: LabResult) => {
    setSelectedResult(result);
    setDialogOpen(true);
  };

  const handleDeleteClick = (result: LabResult) => {
    setResultToDelete(result);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resultToDelete) return;

    try {
      await LabResultsService.deleteLabResult(resultToDelete.id);
      toast({
        title: "Exame excluído",
        description: "O exame foi removido com sucesso"
      });
      await fetchLabResults();
    } catch (error: any) {
      console.error('Error deleting lab result:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setResultToDelete(null);
    }
  };

  const formatLabValues = (result: LabResult) => {
    const values: { label: string; value: string }[] = [];
    if (result.anc_value) values.push({ label: 'ANC', value: `${result.anc_value.toLocaleString()} /mm³` });
    if (result.plt_value) values.push({ label: 'PLT', value: `${result.plt_value.toLocaleString()} /mm³` });
    if (result.hemoglobin_value) values.push({ label: 'Hb', value: `${result.hemoglobin_value} g/dL` });
    if (result.wbc_value) values.push({ label: 'WBC', value: `${result.wbc_value.toLocaleString()} /mm³` });
    if (result.scr_value) values.push({ label: 'Cr', value: `${result.scr_value} mg/dL` });
    if (result.ast_value) values.push({ label: 'AST', value: `${result.ast_value} U/L` });
    if (result.alt_value) values.push({ label: 'ALT', value: `${result.alt_value} U/L` });
    if (result.bilirubin_value) values.push({ label: 'Bil', value: `${result.bilirubin_value} mg/dL` });
    return values;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Exames Laboratoriais
        </h3>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Exame
        </Button>
      </div>

      {/* Lista de exames */}
      {labResults.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum exame registrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Adicionar Exame" para registrar um novo exame
            </p>
            <Button onClick={handleCreate} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Exame
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {labResults.map((result) => {
            const statusConfig = STATUS_CONFIG[result.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const labValues = formatLabValues(result);

            return (
              <Card key={result.id} className="border-2 border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        <Badge variant="outline">
                          {EXAM_TYPE_LABELS[result.exam_type] || result.exam_type}
                        </Badge>
                        <Badge className={statusConfig.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {result.created_by_role === 'doctor' ? '👨‍⚕️ Médico' : '🧑 Paciente'}
                        </Badge>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(result)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(result)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <h4 className="font-medium">{result.exam_name}</h4>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                        {result.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Agendado: {format(new Date(result.scheduled_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        {result.result_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Resultado: {format(new Date(result.result_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                    </div>

                      {/* Valores laboratoriais */}
                      {labValues.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {labValues.map((v, i) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                              <span className="font-medium">{v.label}:</span> {v.value}
                            </span>
                          ))}
                        </div>
                      )}

                      {result.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          {result.notes}
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de criar/editar */}
      <LabResultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patientId={patientId}
        userId={userId}
        userRole={userRole}
        existingResult={selectedResult}
        onSuccess={fetchLabResults}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o exame "{resultToDelete?.exam_name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
