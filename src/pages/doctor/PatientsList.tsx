import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Users, 
  ChevronRight,
  AlertTriangle,
  Activity,
  Filter
} from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import DoctorNavigation from '@/components/doctor/DoctorNavigation';

const PatientsList = () => {
  const navigate = useNavigate();
  const { patients, loading } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAlerts, setFilterAlerts] = useState(false);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.patient_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterAlerts || patient.has_alerts;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-xl font-bold mb-4">Meus Pacientes</h1>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={filterAlerts ? "default" : "outline"}
              size="icon"
              onClick={() => setFilterAlerts(!filterAlerts)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {filterAlerts && (
            <Badge variant="secondary" className="mt-2">
              Mostrando apenas pacientes com alertas
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {searchTerm || filterAlerts ? 'Nenhum paciente encontrado' : 'Nenhum paciente conectado'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterAlerts 
                ? 'Tente ajustar os filtros de busca' 
                : 'Convide pacientes para começar a acompanhá-los'}
            </p>
            {!searchTerm && !filterAlerts && (
              <Button onClick={() => navigate('/doctor/invite')}>
                Convidar Paciente
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {filteredPatients.length} paciente(s) encontrado(s)
            </p>
            
            {filteredPatients.map((patient) => (
              <Card 
                key={patient.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/doctor/patients/${patient.patient_user_id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-medium text-primary">
                          {patient.patient_profile?.first_name?.[0]}{patient.patient_profile?.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {patient.patient_profile?.first_name} {patient.patient_profile?.last_name}
                          </p>
                          {patient.has_alerts && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {patient.patient_profile?.email}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {patient.active_treatments > 0 && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Activity className="h-3 w-3" />
                              {patient.active_treatments} tratamento(s)
                            </div>
                          )}
                          {patient.has_alerts && (
                            <Badge variant="destructive" className="text-xs">
                              Requer atenção
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DoctorNavigation />
    </div>
  );
};

export default PatientsList;
