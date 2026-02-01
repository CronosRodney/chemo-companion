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
  Activity, 
  Calendar,
  Heart,
  FileText,
  Plus,
  Phone,
  Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDoctorAuth } from '@/hooks/useDoctorAuth';
import { useToast } from '@/hooks/use-toast';
import DoctorNavigation from '@/components/doctor/DoctorNavigation';

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

interface TreatmentPlan {
  id: string;
  regimen_name: string;
  status: string | null;
  start_date: string;
  planned_cycles: number;
  line_of_therapy: string;
}

interface DoctorNote {
  id: string;
  note: string;
  note_type: string;
  created_at: string;
}

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useDoctorAuth();
  
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [treatments, setTreatments] = useState<TreatmentPlan[]>([]);
  const [notes, setNotes] = useState<DoctorNote[]>([]);
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

      // Load treatment plans
      const { data: treatmentData, error: treatmentError } = await supabase
        .from('treatment_plans')
        .select('id, regimen_name, status, start_date, planned_cycles, line_of_therapy')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false });

      if (treatmentError) throw treatmentError;
      setTreatments(treatmentData || []);

      // Load doctor notes
      const { data: notesData, error: notesError } = await supabase
        .from('doctor_notes')
        .select('id, note, note_type, created_at')
        .eq('patient_user_id', patientId)
        .eq('doctor_user_id', user.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto p-4">
          <Button variant="ghost" onClick={() => navigate('/doctor/patients')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </span>
            </div>
            <div>
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
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Resumo</TabsTrigger>
            <TabsTrigger value="treatment">Tratamento</TabsTrigger>
            <TabsTrigger value="health">Saúde</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

          <TabsContent value="treatment" className="space-y-4">
            {treatments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhum tratamento registrado</p>
                </CardContent>
              </Card>
            ) : (
              treatments.map((treatment) => (
                <Card key={treatment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{treatment.regimen_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {treatment.line_of_therapy} • {treatment.planned_cycles} ciclos
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Início: {new Date(treatment.start_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant={treatment.status === 'active' ? 'default' : 'secondary'}>
                        {treatment.status === 'active' ? 'Ativo' : treatment.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardContent className="py-8 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Dados de saúde em tempo real serão exibidos aqui
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  (Wearables, exames laboratoriais, etc.)
                </p>
              </CardContent>
            </Card>
          </TabsContent>

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
