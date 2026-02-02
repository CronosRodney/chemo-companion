import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  User, 
  Heart,
  FileText,
  Plus,
  Phone,
  Mail,
  Stethoscope,
  Eye,
  Edit,
  TestTube,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDoctorAuth } from '@/hooks/useDoctorAuth';
import { useToast } from '@/hooks/use-toast';
import DoctorNavigation from '@/components/doctor/DoctorNavigation';
import Treatment from '@/pages/Treatment';

interface PatientProfile {
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  medical_history: string | null;
  allergies: string | null;
  current_medications: string | null;
}


interface DoctorNote {
  id: string;
  note: string;
  note_type: string;
  created_at: string;
}

interface WearableMetric {
  id: string;
  metric_type: string;
  value: number;
  unit: string;
  metric_date: string;
  metric_time: string | null;
}

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useDoctorAuth();
  
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [wearableMetrics, setWearableMetrics] = useState<WearableMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (patientId && user) {
      verifyAccessAndLoadData();
    }
  }, [patientId, user]);

  const verifyAccessAndLoadData = async () => {
    if (!patientId || !user) return;

    try {
      setLoading(true);

      // First verify that doctor has active connection with this patient
      const { data: connection, error: connError } = await supabase
        .from('patient_doctor_connections')
        .select('id')
        .eq('doctor_user_id', user.id)
        .eq('patient_user_id', patientId)
        .eq('status', 'active')
        .single();

      if (connError || !connection) {
        toast({
          title: "Acesso negado",
          description: "Você não tem vínculo ativo com este paciente",
          variant: "destructive"
        });
        navigate('/doctor/patients');
        return;
      }

      // If access verified, load patient data
      await loadPatientData();
    } catch (error: any) {
      console.error('Error verifying access:', error);
      toast({
        title: "Erro ao verificar acesso",
        description: "Não foi possível verificar seu acesso a este paciente",
        variant: "destructive"
      });
      navigate('/doctor/patients');
    }
  };

  const loadPatientData = async () => {
    if (!patientId || !user) return;

    try {
      setLoading(true);

      // Load patient profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, birth_date, medical_history, allergies, current_medications')
        .eq('user_id', patientId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Treatment data is now loaded by the Treatment component directly

      // Load doctor notes
      const { data: notesData, error: notesError } = await supabase
        .from('doctor_notes')
        .select('id, note, note_type, created_at')
        .eq('patient_user_id', patientId)
        .eq('doctor_user_id', user.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

      // Load wearable metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('wearable_metrics')
        .select('id, metric_type, value, unit, metric_date, metric_time')
        .eq('user_id', patientId)
        .order('metric_date', { ascending: false })
        .limit(20);

      if (!metricsError && metricsData) {
        setWearableMetrics(metricsData);
      }

    } catch (error: any) {
      console.error('Error loading patient data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do paciente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user || !patientId) return;

    try {
      setSavingNote(true);

      // First get the connection id
      const { data: connection, error: connError } = await supabase
        .from('patient_doctor_connections')
        .select('id')
        .eq('doctor_user_id', user.id)
        .eq('patient_user_id', patientId)
        .eq('status', 'active')
        .single();

      if (connError) throw connError;

      const { data, error } = await supabase
        .from('doctor_notes')
        .insert({
          connection_id: connection.id,
          doctor_user_id: user.id,
          patient_user_id: patientId,
          note: newNote,
          note_type: 'observation'
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote('');
      
      toast({
        title: "Nota adicionada",
        description: "Sua observação foi salva"
      });
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast({
        title: "Erro ao salvar nota",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Paciente não encontrado</p>
        <Button onClick={() => navigate('/doctor/patients')}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getMetricLabel = (type: string) => {
    const labels: Record<string, string> = {
      steps: 'Passos',
      heart_rate: 'Freq. Cardíaca',
      resting_heart_rate: 'FC Repouso',
      sleep_hours: 'Sono',
      body_temperature: 'Temperatura',
      spo2: 'SpO2',
      calories: 'Calorias'
    };
    return labels[type] || type;
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      {/* Header with Clinical Badge */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate('/doctor/patients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Stethoscope className="h-3 w-3 mr-1" />
              Painel Clínico
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              {profile.birth_date && (
                <p className="text-sm text-muted-foreground">
                  {calculateAge(profile.birth_date)} anos
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {profile.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${profile.phone}`}>
                      <Phone className="h-3 w-3 mr-1" />
                      Ligar
                    </a>
                  </Button>
                )}
                {profile.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${profile.email}`}>
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <Eye className="h-3 w-3 mr-1 hidden sm:inline" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="treatment" className="text-xs sm:text-sm">
              <Edit className="h-3 w-3 mr-1 hidden sm:inline" />
              Tratamento
            </TabsTrigger>
            <TabsTrigger value="labs" className="text-xs sm:text-sm">
              <TestTube className="h-3 w-3 mr-1 hidden sm:inline" />
              Exames
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs sm:text-sm">
              <Heart className="h-3 w-3 mr-1 hidden sm:inline" />
              Saúde
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm">
              <FileText className="h-3 w-3 mr-1 hidden sm:inline" />
              Notas
            </TabsTrigger>
          </TabsList>

          {/* Resumo Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Paciente
                  <Badge variant="secondary" className="ml-auto text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Leitura
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{profile.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">
                      {profile.birth_date 
                        ? new Date(profile.birth_date).toLocaleDateString('pt-BR')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Idade</p>
                    <p className="font-medium">
                      {profile.birth_date ? `${calculateAge(profile.birth_date)} anos` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Histórico Médico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Histórico</p>
                  <p className="font-medium">{profile.medical_history || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alergias</p>
                  <p className="font-medium">{profile.allergies || 'Nenhuma registrada'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Medicamentos Atuais</p>
                  <p className="font-medium">{profile.current_medications || 'Nenhum registrado'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tratamento Tab - Uses shared Treatment component */}
          <TabsContent value="treatment">
            <Treatment 
              patientId={patientId} 
              canEditOverride={true}
            />
          </TabsContent>

          {/* Exames Tab - EDITÁVEL */}
          <TabsContent value="labs" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Exames Laboratoriais
              </h3>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                <Edit className="h-3 w-3 mr-1" />
                Editável
              </Badge>
            </div>

            <Card>
              <CardContent className="py-6">
                <div className="text-center mb-4">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Resultados laboratoriais do paciente
                  </p>
                </div>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Resultado de Exame
                </Button>
              </CardContent>
            </Card>

            {/* Placeholder for lab results - would show real data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Hemograma Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Hemoglobina</p>
                    <p className="font-medium">12.5 g/dL</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Leucócitos</p>
                    <p className="font-medium">5.800 /mm³</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plaquetas</p>
                    <p className="font-medium">185.000 /mm³</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * Dados ilustrativos - integração pendente
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saúde Tab - SOMENTE LEITURA */}
          <TabsContent value="health" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Monitoramento de Saúde
              </h3>
              <Badge variant="secondary" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Leitura
              </Badge>
            </div>

            {wearableMetrics.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {wearableMetrics.slice(0, 6).map((metric) => (
                  <Card key={metric.id}>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">{getMetricLabel(metric.metric_type)}</p>
                      <p className="text-lg font-bold">
                        {metric.value} <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(metric.metric_date).toLocaleDateString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Paciente sem wearables conectados
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Métricas de saúde aparecerão aqui quando disponíveis
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notas Tab */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Adicionar Nota
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Digite sua observação sobre o paciente..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || savingNote}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {savingNote ? 'Salvando...' : 'Adicionar Nota'}
                </Button>
              </CardContent>
            </Card>

            {notes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhuma nota registrada</p>
                </CardContent>
              </Card>
            ) : (
              notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{note.note_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm">{note.note}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DoctorNavigation />
    </div>
  );
};

export default PatientDetails;
