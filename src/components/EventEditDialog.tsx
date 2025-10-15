import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface EventEditDialogProps {
  event: any;
  tableName: 'events' | 'user_events';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<void>;
}

export const EventEditDialog = ({ event, tableName, open, onOpenChange, onSave }: EventEditDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'general',
    severity: 1,
    event_date: '',
    event_time: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || 'general',
        severity: event.severity || 1,
        event_date: event.event_date || '',
        event_time: event.event_time || ''
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
          <DialogDescription>
            Faça alterações no evento e clique em salvar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Título *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Náusea, Dor de cabeça..."
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva o evento com mais detalhes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-event_type">Tipo</Label>
              <select
                id="edit-event_type"
                value={formData.event_type}
                onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="general">Geral</option>
                <option value="mood">Humor</option>
                <option value="adverse">Evento Adverso</option>
                <option value="symptom">Sintoma</option>
                <option value="side_effect">Efeito Colateral</option>
                <option value="pain">Dor</option>
                <option value="medication">Medicamento</option>
                <option value="appointment">Consulta</option>
                <option value="exam">Exame</option>
              </select>
            </div>

            <div>
              <Label htmlFor="edit-severity">Intensidade (1-5)</Label>
              <select
                id="edit-severity"
                value={formData.severity}
                onChange={(e) => setFormData({...formData, severity: parseInt(e.target.value)})}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value={1}>1 - Leve</option>
                <option value={2}>2 - Moderado</option>
                <option value={3}>3 - Intenso</option>
                <option value={4}>4 - Severo</option>
                <option value={5}>5 - Muito Severo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-event_date">Data</Label>
              <Input
                id="edit-event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-event_time">Hora</Label>
              <Input
                id="edit-event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
