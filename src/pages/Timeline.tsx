import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pill, Calendar, FileText, AlertTriangle, Filter } from "lucide-react";
import { useState } from "react";

interface TimelineEvent {
  id: string;
  type: 'medication' | 'consultation' | 'exam' | 'adverse_event';
  date: string;
  time: string;
  title: string;
  details: string;
  status?: 'completed' | 'missed' | 'scheduled';
  severity?: number;
}

const Timeline = () => {
  const [filter, setFilter] = useState<string>('all');

  const events: TimelineEvent[] = [
    {
      id: '1',
      type: 'medication',
      date: '2025-01-19',
      time: '20:00',
      title: 'Oxaliplatina 85mg/m²',
      details: 'Ciclo 3 - FOLFOX | Lote: L2025-09-A',
      status: 'completed'
    },
    {
      id: '2',
      type: 'adverse_event',
      date: '2025-01-19',
      time: '14:30',
      title: 'Náusea leve',
      details: 'Grau 1 - Controlada com Ondansetrona',
      severity: 1
    },
    {
      id: '3',
      type: 'consultation',
      date: '2025-01-15',
      time: '10:00',
      title: 'Consulta Oncológica',
      details: 'Dr. Maria Santos - Avaliação do Ciclo 2',
      status: 'completed'
    },
    {
      id: '4',
      type: 'exam',
      date: '2025-01-10',
      time: '08:00',
      title: 'Hemograma Completo',
      details: 'Lab Excelência - Resultados normais',
      status: 'completed'
    },
    {
      id: '5',
      type: 'medication',
      date: '2025-01-05',
      time: '20:00',
      title: '5-Fluoruracil 400mg/m²',
      details: 'Ciclo 2 - FOLFOX | Via oral',
      status: 'missed'
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'medication': return <Pill className="h-4 w-4" />;
      case 'consultation': return <Calendar className="h-4 w-4" />;
      case 'exam': return <FileText className="h-4 w-4" />;
      case 'adverse_event': return <AlertTriangle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string, status?: string, severity?: number) => {
    if (type === 'adverse_event') {
      if (severity && severity >= 3) return 'text-destructive bg-destructive/10';
      if (severity && severity >= 2) return 'text-warning bg-warning/10';
      return 'text-orange-600 bg-orange-100';
    }
    
    if (status === 'missed') return 'text-destructive bg-destructive/10';
    if (status === 'completed') return 'text-success bg-success/10';
    
    switch (type) {
      case 'medication': return 'text-primary bg-primary/10';
      case 'consultation': return 'text-secondary-accent bg-secondary/20';
      case 'exam': return 'text-purple-600 bg-purple-100';
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

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.type === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="mx-auto max-w-md space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Linha do Tempo</h1>
          <div className="ml-auto">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

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
              
              <Card className="shadow-md border-0 ml-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Event icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getEventColor(event.type, event.status, event.severity)}`}>
                      {getEventIcon(event.type)}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">{event.title}</h3>
                          <p className="text-xs text-muted-foreground">{event.details}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{formatDate(event.date)}</p>
                          <p>{event.time}</p>
                        </div>
                      </div>

                      {/* Status badges */}
                      <div className="flex gap-2">
                        {event.status && (
                          <Badge
                            variant={event.status === 'completed' ? 'default' : 
                                   event.status === 'missed' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {event.status === 'completed' ? 'Realizado' :
                             event.status === 'missed' ? 'Perdido' : 'Agendado'}
                          </Badge>
                        )}
                        {event.severity && (
                          <Badge
                            variant={event.severity >= 3 ? 'destructive' : 
                                   event.severity >= 2 ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            Grau {event.severity}
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
          <Card className="shadow-md border-0">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum evento encontrado</p>
              <p className="text-sm text-muted-foreground">
                Use filtros diferentes ou adicione novos registros
              </p>
            </CardContent>
          </Card>
        )}

        {/* Floating Add Button */}
        <Button
          variant="medical"
          size="icon"
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg"
        >
          <Calendar className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Timeline;