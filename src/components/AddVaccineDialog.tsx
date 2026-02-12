import { useState } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';

const vaccineSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  date: z.string().min(1, 'Data é obrigatória'),
  dose: z.string().trim().min(1, 'Dose é obrigatória').max(100),
  observations: z.string().max(1000).optional(),
});

export type CreateVaccineData = z.infer<typeof vaccineSchema>;

interface AddVaccineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateVaccineData) => Promise<boolean>;
}

export function AddVaccineDialog({ open, onOpenChange, onSubmit }: AddVaccineDialogProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [dose, setDose] = useState('');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName('');
    setDate('');
    setDose('');
    setObservations('');
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = vaccineSchema.safeParse({ name, date, dose, observations: observations || undefined });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const success = await onSubmit(result.data);
      if (success) {
        resetForm();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Vacina
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vaccine-name">Nome da vacina *</Label>
            <Input
              id="vaccine-name"
              placeholder="Ex: COVID-19, Gripe, Hepatite B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaccine-date">Data de aplicação *</Label>
            <Input
              id="vaccine-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaccine-dose">Dose *</Label>
            <Input
              id="vaccine-dose"
              placeholder="Ex: 1ª dose, 2ª dose, Reforço"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              disabled={isSubmitting}
            />
            {errors.dose && <p className="text-xs text-destructive">{errors.dose}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaccine-obs">Observações</Label>
            <Textarea
              id="vaccine-obs"
              placeholder="Informações adicionais (opcional)"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
            {errors.observations && <p className="text-xs text-destructive">{errors.observations}</p>}
          </div>

          <p className="text-xs text-muted-foreground">
            A vacina será registrada na sua Minha Caderneta. O OncoTrack não armazena esses dados localmente.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar na Caderneta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
