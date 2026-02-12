import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ConfirmDeleteModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  storageKey?: string;
}

export function ConfirmDeleteModal({
  open,
  onConfirm,
  onCancel,
  title = 'Remover medicamento?',
  description = 'Tem certeza que deseja remover este medicamento do seu tratamento?',
  storageKey = 'skipMedicationDeleteConfirm',
}: ConfirmDeleteModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!open) return null;

  const handleConfirm = () => {
    if (dontAskAgain) {
      localStorage.setItem(storageKey, 'true');
    }
    setDontAskAgain(false);
    onConfirm();
  };

  const handleCancel = () => {
    setDontAskAgain(false);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={handleCancel}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-sm w-[90%] p-6 space-y-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>

        <div className="flex items-center gap-2">
          <Checkbox
            id="dont-ask-again"
            checked={dontAskAgain}
            onCheckedChange={(checked) => setDontAskAgain(checked === true)}
          />
          <label htmlFor="dont-ask-again" className="text-xs text-muted-foreground cursor-pointer select-none">
            Não perguntar novamente
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1 rounded-lg"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="flex-1 rounded-lg"
            onClick={handleConfirm}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
