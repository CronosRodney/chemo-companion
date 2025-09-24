import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pill, Calendar, FileText, AlertTriangle, Filter, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
  const [filter, setFilter] = useState<string>('all');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
  const loadUserTimeline = async () => {
      try {
        // Load user medications with clinic info
        const { data: userMedications } = await supabase
          .from('user_medications')
          .select(`
            *,
            medications (name, batch_number, expiry_date, manufacturer)
          `);

        // Load user clinic connections
        const { data: clinicConnections } = await supabase
          .from('user_clinic_connections')
          .select(`
            *,
            clinics (clinic_name, city, state)
          `);

        // Load user events
        const { data: userEvents } = await supabase
          .from('user_events')
          .select('*')
          .order('event_date', { ascending: false })
          .order('event_time', { ascending: false });

        const medicationEvents: TimelineEvent[] = (userMedications || []).map(med => {
          // Find associated clinic connection (assuming first one for now)
          const clinicConnection = clinicConnections?.[0];
          
          return {
            id: med.id,
            type: 'medication' as const,
            date: new Date(med.scanned_at).toISOString().split('T')[0],
            time: new Date(med.scanned_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            title: med.medications?.name || 'Medicamento',
            details: `${med.dose || ''} | ${med.frequency || ''} | Lote: ${med.medications?.batch_number || 'N/A'}`,
            status: 'completed' as const,
            clinic: clinicConnection?.clinics,
            medication: med.medications
          };
        });

        // Convert user events to timeline events
        const patientEvents: TimelineEvent[] = (userEvents || []).map(event => ({
          id: event.id,
          type: event.event_type === 'adverse_event' ? 'adverse_event' as const : 'adverse_event' as const,
          date: event.event_date,
          time: event.event_time,
          title: event.title,
          details: event.description || '',
          severity: event.severity
        }));

        // Add some sample events for now
        const sampleEvents: TimelineEvent[] = [
          {
            id: 'sample1',
            type: 'adverse_event',
            date: '2025-01-19',
            time: '14:30',
            title: 'Náusea leve',
            details: 'Grau 1 - Controlada com Ondansetrona',
            severity: 1
          },
          {
            id: 'sample2',
            type: 'consultation',
            date: '2025-01-15',
            time: '10:00',
            title: 'Consulta Oncológica',
            details: 'Dr. Maria Santos - Avaliação do Ciclo 2',
            status: 'completed'
          },
          {
            id: 'sample3',
            type: 'exam',
            date: '2025-01-10',
            time: '08:00',
            title: 'Hemograma Completo',
            details: 'Lab Excelência - Resultados normais',
            status: 'completed'
          }
        ];

        const allEvents = [...medicationEvents, ...patientEvents, ...sampleEvents];
        allEvents.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
        setEvents(allEvents);
      } catch (error) {
        console.error('Error loading timeline:', error);
        // Fallback to sample data
        setEvents([
          {
            id: 'sample1',
            type: 'medication',
            date: '2025-01-19',
            time: '20:00',
            title: 'Oxaliplatina 85mg/m²',
            details: 'Ciclo 3 - FOLFOX | Lote: L2025-09-A',
            status: 'completed'
          }
        ]);
      }
    };

    loadUserTimeline();
  }, []);

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
    : filter === 'date'
    ? events.filter(event => event.date === selectedDate)
    : events.filter(event => event.type === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
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
                          {event.clinic && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {event.clinic.clinic_name} - {event.clinic.city}, {event.clinic.state}
                              </p>
                            </div>
                          )}
                          {event.medication && (
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Fabricante: {event.medication.manufacturer}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Validade: {new Date(event.medication.expiry_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          )}
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
          onClick={() => navigate('/events')}
        >
          <Calendar className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Timeline;