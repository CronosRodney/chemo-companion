import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  AlertTriangle,
  ChevronRight,
  Check,
  Thermometer,
  Heart,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDoctorAuth } from '@/hooks/useDoctorAuth';
import DoctorNavigation from '@/components/doctor/DoctorNavigation';

interface PatientAlert {
  id: string;
  patient_user_id: string;
  patient_name: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
  acknowledged: boolean;
}

const DoctorAlerts = () => {
  const navigate = useNavigate();
  const { user } = useDoctorAuth();
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get connected patients
      const { data: connections, error: connError } = await supabase
        .from('patient_doctor_connections')
        .select('patient_user_id')
        .eq('doctor_user_id', user.id)
        .eq('status', 'active');

      if (connError) throw connError;

      if (!connections || connections.length === 0) {
        setAlerts([]);
        return;
      }

      const patientIds = connections.map(c => c.patient_user_id);

      // Get wearable alerts for connected patients
      const { data: wearableAlerts, error: alertsError } = await supabase
        .from('wearable_alerts')
        .select('*')
        .in('user_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (alertsError) throw alertsError;

      // Get patient profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', patientIds);

      if (profilesError) throw profilesError;

      // Combine data
      const enrichedAlerts: PatientAlert[] = (wearableAlerts || []).map(alert => {
        const profile = profiles?.find(p => p.user_id === alert.user_id);
        return {
          id: alert.id,
          patient_user_id: alert.user_id,
          patient_name: profile 
            ? `${profile.first_name} ${profile.last_name || ''}`
            : 'Paciente',
          alert_type: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          created_at: alert.created_at,
          acknowledged: alert.acknowledged
        };
      });

      setAlerts(enrichedAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fever':
        return Thermometer;
      case 'high_heart_rate':
        return Heart;
      case 'low_activity':
      case 'poor_sleep':
        return Activity;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Alertas de Pacientes</h1>
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive">
                {unacknowledgedAlerts.length} novo(s)
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nenhum alerta</h2>
            <p className="text-muted-foreground">
              Você será notificado quando houver alertas de saúde dos seus pacientes
            </p>
          </div>
        ) : (
          <>
            {/* Unacknowledged alerts */}
            {unacknowledgedAlerts.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Alertas Pendentes
                </h2>
                {unacknowledgedAlerts.map((alert) => {
                  const Icon = getAlertIcon(alert.alert_type);
                  return (
                    <Card 
                      key={alert.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
                      onClick={() => navigate(`/doctor/patients/${alert.patient_user_id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold">{alert.patient_name}</p>
                              <Badge variant={getSeverityColor(alert.severity) as any}>
                                {alert.severity === 'critical' ? 'Crítico' : 
                                 alert.severity === 'warning' ? 'Atenção' : 'Info'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(alert.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Acknowledged alerts */}
            {acknowledgedAlerts.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Alertas Anteriores
                </h2>
                {acknowledgedAlerts.slice(0, 10).map((alert) => {
                  const Icon = getAlertIcon(alert.alert_type);
                  return (
                    <Card 
                      key={alert.id}
                      className="cursor-pointer hover:shadow-md transition-shadow opacity-70"
                      onClick={() => navigate(`/doctor/patients/${alert.patient_user_id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium">{alert.patient_name}</p>
                              <Badge variant="outline">Resolvido</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(alert.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <DoctorNavigation />
    </div>
  );
};

export default DoctorAlerts;
