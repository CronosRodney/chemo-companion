import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Plus, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { EventEditDialog } from "@/components/EventEditDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  severity: number;
  event_date: string;
  event_time: string;
  created_at: string;
}

const Events = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { events, loading, addEvent, deleteEvent: deleteEventFromContext, updateEvent: updateEventFromContext } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'general',
    severity: 1,
    event_date: new Date().toISOString().split('T')[0],
    event_time: new Date().toTimeString().slice(0, 5)
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      addEvent(formData);

      toast({
        title: "Sucesso",
        description: "Evento registrado com sucesso"
      });

      setFormData({
        title: '',
        description: '',
        event_type: 'general',
        severity: 1,
        event_date: new Date().toISOString().split('T')[0],
        event_time: new Date().toTimeString().slice(0, 5)
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o evento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setEventToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEventFromContext(eventToDelete, 'events');
      toast({
        title: "Sucesso",
        description: "Evento excluído com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const handleUpdateEvent = async (data: any) => {
    if (!selectedEvent) return;

    try {
      await updateEventFromContext(selectedEvent.id, 'events', data);
      setEditDialogOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o evento",
        variant: "destructive"
      });
    }
  };

  const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      general: 'Geral',
      medication: 'Medicamento',
      appointment: 'Consulta',
      mood: 'Humor',
      adverse: 'Efeito Adverso',
      symptom: 'Sintoma',
      side_effect: 'Efeito Colateral',
      pain: 'Dor'
    };
    return types[type] || type;
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'bg-destructive text-destructive-foreground';
    if (severity >= 3) return 'bg-warning text-warning-foreground';
    if (severity >= 2) return 'bg-secondary text-secondary-foreground';
    return 'bg-success text-success-foreground';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 pb-20">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Registrar Eventos</h1>
          <div className="ml-auto">
            <Button 
              variant="default" 
              size="icon"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Event Registration Form */}
        {showForm && (
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-lg">Novo Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Náusea, Dor de cabeça..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descreva o evento com mais detalhes..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event_type">Tipo</Label>
                    <select
                      id="event_type"
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
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="severity">Intensidade (1-5)</Label>
                    <select
                      id="severity"
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
                    <Label htmlFor="event_date">Data</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="event_time">Hora</Label>
                    <Input
                      id="event_time"
                      type="time"
                      value={formData.event_time}
                      onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Salvando...' : 'Salvar Evento'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Events List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Eventos Registrados</h2>
          
          {events.length === 0 ? (
            <Card className="luxury-card">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum evento registrado</p>
                <p className="text-sm text-muted-foreground">
                  Clique no botão + para adicionar um evento
                </p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="luxury-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm">{event.title}</h3>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedEvent(event);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                        <Badge className={`text-xs ${getSeverityColor(event.severity)}`}>
                          Grau {event.severity}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.event_date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.event_time}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Calendar Button */}
        <Button
          variant="outline"
          className="w-full flex items-center gap-3"
          onClick={() => {
            // Set form date to selected calendar date
            setFormData({...formData, event_date: selectedDate});
            setShowForm(true);
          }}
        >
          <Calendar className="h-5 w-5" />
          Agendar para {new Date(selectedDate).toLocaleDateString('pt-BR')}
        </Button>
      </div>

      {/* Edit Dialog */}
      <EventEditDialog
        event={selectedEvent}
        tableName="events"
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleUpdateEvent}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Events;