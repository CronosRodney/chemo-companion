import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Calendar,
  UserPlus,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { useDoctorAuth } from '@/hooks/useDoctorAuth';
import { usePatients } from '@/hooks/usePatients';
import DoctorNavigation from '@/components/doctor/DoctorNavigation';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { doctorProfile } = useDoctorAuth();
  const { patients, loading: patientsLoading } = usePatients();

  const activePatients = patients.filter(p => p.status === 'active');
  const patientsWithAlerts = patients.filter(p => p.has_alerts);
  const patientsInTreatment = patients.filter(p => p.active_treatments > 0);

  const stats = [
    {
      title: 'Total de Pacientes',
      value: activePatients.length,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Em Tratamento Ativo',
      value: patientsInTreatment.length,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Alertas Pendentes',
      value: patientsWithAlerts.length,
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'Consultas Hoje',
      value: 0,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  Dr. {doctorProfile?.first_name} {doctorProfile?.last_name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {doctorProfile?.specialty} • CRM {doctorProfile?.crm}/{doctorProfile?.crm_uf}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/doctor/invite')}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-sm">Convidar Paciente</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/doctor/patients')}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm">Ver Pacientes</span>
            </Button>
          </CardContent>
        </Card>


        {/* Recent Patients */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pacientes Recentes</CardTitle>
              <Button variant="link" onClick={() => navigate('/doctor/patients')}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {patientsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : activePatients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum paciente conectado</p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/doctor/invite')}
                  className="mt-2"
                >
                  Convidar primeiro paciente
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {activePatients.slice(0, 5).map((patient) => (
                  <div 
                    key={patient.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate(`/doctor/patients/${patient.patient_user_id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {patient.patient_profile?.first_name?.[0]}{patient.patient_profile?.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {patient.patient_profile?.first_name} {patient.patient_profile?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {patient.active_treatments > 0 
                            ? `${patient.active_treatments} tratamento(s)` 
                            : 'Sem tratamento ativo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {patient.has_alerts && (
                        <Badge variant="destructive" className="text-xs">Alerta</Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DoctorNavigation />
    </div>
  );
};

export default DoctorDashboard;
