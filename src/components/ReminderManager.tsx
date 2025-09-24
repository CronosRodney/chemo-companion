import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Clock, Pill } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Reminder {
  id: string;
  medication: string;
  time: string;
  type: string;
  cycle: string;
  urgent: boolean;
}

interface ReminderManagerProps {
  reminders: Reminder[];
  onUpdate: (reminders: Reminder[]) => void;
}

export const ReminderManager = ({ reminders, onUpdate }: ReminderManagerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    medication: '',
    time: '',
    type: 'Oral',
    cycle: '',
    urgent: false
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      const updatedReminders = reminders.map(reminder => 
        reminder.id === editingId 
          ? { ...reminder, ...formData }
          : reminder
      );
      onUpdate(updatedReminders);
      toast({
        title: "Lembrete atualizado",
        description: "Lembrete foi atualizado com sucesso"
      });
    } else {
      const newReminder: Reminder = {
        id: Date.now().toString(),
        ...formData
      };
      onUpdate([...reminders, newReminder]);
      toast({
        title: "Lembrete adicionado",
        description: "Novo lembrete foi criado com sucesso"
      });
    }
    
    resetForm();
  };

  const handleEdit = (reminder: Reminder) => {
    setFormData({
      medication: reminder.medication,
      time: reminder.time,
      type: reminder.type,
      cycle: reminder.cycle,
      urgent: reminder.urgent
    });
    setEditingId(reminder.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    onUpdate(updatedReminders);
    toast({
      title: "Lembrete removido",
      description: "Lembrete foi removido com sucesso"
    });
  };

  const resetForm = () => {
    setFormData({
      medication: '',
      time: '',
      type: 'Oral',
      cycle: '',
      urgent: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gerenciar Lembretes</h3>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? 'Editar Lembrete' : 'Novo Lembrete'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="medication">Medicamento</Label>
                <Input
                  id="medication"
                  value={formData.medication}
                  onChange={(e) => setFormData({...formData, medication: e.target.value})}
                  placeholder="Nome do medicamento"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="Oral">Oral</option>
                    <option value="IV">IV</option>
                    <option value="SC">SC</option>
                    <option value="IM">IM</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="cycle">Ciclo</Label>
                <Input
                  id="cycle"
                  value={formData.cycle}
                  onChange={(e) => setFormData({...formData, cycle: e.target.value})}
                  placeholder="Ex: Ciclo 3 - FOLFOX"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={formData.urgent}
                  onChange={(e) => setFormData({...formData, urgent: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="urgent">Urgente</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {reminders.map((reminder) => (
          <Card key={reminder.id} className={`p-4 ${reminder.urgent ? 'border-primary/30' : 'border-accent/30'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reminder.urgent ? 'medical-gradient' : 'bg-accent/20'}`}>
                <Pill className={`h-5 w-5 ${reminder.urgent ? 'text-white' : 'text-accent-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{reminder.medication}</p>
                <p className="text-sm text-muted-foreground">{reminder.cycle}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${reminder.urgent ? 'text-primary' : 'text-foreground'}`}>{reminder.time}</p>
                <Badge variant={reminder.urgent ? "secondary" : "outline"} className="text-xs">
                  {reminder.type}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(reminder)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(reminder.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};