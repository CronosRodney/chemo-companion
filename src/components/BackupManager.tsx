import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload, Loader2, Database, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupManagerProps {
  className?: string;
}

export function BackupManager({ className }: BackupManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(
    localStorage.getItem('oncotrack_last_backup')
  );

  const handleCreateBackup = async () => {
    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('user-backup', {
        body: { action: 'create' }
      });

      if (error) throw error;

      // Create and download the backup file
      const backupJson = JSON.stringify(data.download_data, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oncotrack_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Save last backup date
      const now = new Date().toISOString();
      localStorage.setItem('oncotrack_last_backup', now);
      setLastBackup(now);

      toast.success(`Backup criado! (${data.size_kb} KB)`);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Erro ao criar backup. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
      setBackupFile(file);
    } else {
      toast.error('Selecione um arquivo JSON válido');
    }
  };

  const handleRestore = async () => {
    if (!backupFile) return;

    setIsRestoring(true);

    try {
      const content = await backupFile.text();
      const backup = JSON.parse(content);

      // Validate backup structure
      if (!backup.data || !backup.version) {
        throw new Error('Formato de backup inválido');
      }

      // Note: Full restore would require additional edge function logic
      // For now, show a message about manual restore
      toast.info('Funcionalidade de restauração completa em desenvolvimento. Por favor, entre em contato com o suporte.');
      
      setShowRestoreDialog(false);
      setBackupFile(null);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Erro ao restaurar backup. Verifique se o arquivo é válido.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5 text-primary" />
          Backup de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Faça backup dos seus dados médicos para manter uma cópia de segurança.
          O arquivo pode ser usado para restaurar seus dados se necessário.
        </p>

        {lastBackup && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>
              Último backup: {format(new Date(lastBackup), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Criar Backup
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowRestoreDialog(true)}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <span>
            Recomendamos fazer backup regularmente, especialmente antes de consultas médicas importantes.
            Os backups são criptografados e contêm apenas seus dados.
          </span>
        </div>
      </CardContent>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Backup</DialogTitle>
            <DialogDescription>
              Selecione um arquivo de backup para restaurar seus dados.
              Esta ação substituirá seus dados atuais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="backup-file">Arquivo de Backup</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
              />
              {backupFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {backupFile.name}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Atenção: A restauração substituirá todos os seus dados atuais.
                Certifique-se de criar um backup antes de continuar.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRestore}
              disabled={!backupFile || isRestoring}
              variant="destructive"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                'Restaurar Dados'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
