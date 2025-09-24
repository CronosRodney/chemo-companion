import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pill, Calendar, FileText, AlertTriangle, Filter, MapPin } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";

interface TimelineEvent {
  id: string;
  type: 'medication' | 'consultation' | 'exam' | 'adverse_event';
  date: string;
  time: string;
  title: string;
  details: string;
  status?: 'completed' | 'missed' | 'scheduled';
  severity?: number;
  clinic?: {
    clinic_name: string;
    city: string;
    state: string;
  };
  medication?: {
    name: string;
    batch_number: string;
    expiry_date: string;
    manufacturer: string;
  };
}

const Timeline = () => {
  const navigate = useNavigate();
  const { events, loading } = useAppContext();
  const [filter, setFilter] = useState<string>('all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'medication': return <Pill className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'mood': return <FileText className="h-4 w-4" />;
      case 'adverse': return <AlertTriangle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string, severity?: number) => {
    if (type === 'adverse') {
      if (severity && severity >= 3) return 'text-destructive bg-destructive/10';
      if (severity && severity >= 2) return 'text-warning bg-warning/10';
      return 'text-orange-600 bg-orange-100';
    }
    
    switch (type) {
      case 'medication': return 'text-primary bg-primary/10';
      case 'appointment': return 'text-secondary-accent bg-secondary/20';
      case 'mood': return 'text-success bg-success/10';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'medication': return 'Medicamento';
      case 'appointment': return 'Consulta';
      case 'mood': return 'Humor';
      case 'adverse': return 'Efeito Adverso';
      default: return 'Evento';
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : filter === 'date'
    ? events.filter(event => event.event_date === selectedDate)
    : events.filter(event => event.event_type === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando timeline...</p>
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
          <h1 className="text-xl font-semibold">Linha do Tempo</h1>
          <div className="ml-auto">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowDateFilter(!showDateFilter)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Date Filter */}
        {showDateFilter && (
          <Card className="p-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Filtrar por data:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => {
                  setFilter('date');
                  setShowDateFilter(false);
                }}>
                  Aplicar
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setFilter('all');
                  setShowDateFilter(false);
                }}>
                  Limpar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="whitespace-nowrap"
          >
            Todos
          </Button>
          <Button
            variant={filter === 'medication' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('medication')}
            className="whitespace-nowrap"
          >
            Medicamentos
          </Button>
          <Button
            variant={filter === 'consultation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('consultation')}
            className="whitespace-nowrap"
          >
            Consultas
          </Button>
          <Button
            variant={filter === 'exam' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('exam')}
            className="whitespace-nowrap"
          >
            Exames
          </Button>
          <Button
            variant={filter === 'adverse_event' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('adverse_event')}
            className="whitespace-nowrap"
          >
            Eventos
          </Button>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {filteredEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {index < filteredEvents.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-border"></div>
              )}
              
              <Card className="luxury-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Event icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getEventColor(event.event_type, event.severity)}`}>
                      {getEventIcon(event.event_type)}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">{event.title}</h3>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{formatDate(event.event_date)}</p>
                          <p>{event.event_time}</p>
                        </div>
                      </div>

                      {/* Status badges */}
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                        {event.severity && (
                          <Badge
                            variant={event.severity >= 4 ? 'default' : 
                                   event.severity <= 2 ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {event.event_type === 'mood' 
                              ? `${event.severity}/5`
                              : `Nível ${event.severity}`
                            }
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <Card className="luxury-card">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum evento encontrado</p>
              <p className="text-sm text-muted-foreground">
                Use filtros diferentes ou adicione novos registros
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Event Button */}
        <Card className="luxury-card">
          <CardContent className="p-4">
            <Button 
              onClick={() => navigate('/events')} 
              className="w-full"
              size="lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              Adicionar Novo Evento
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Timeline;