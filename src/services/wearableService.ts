import { supabase } from "@/integrations/supabase/client";
import { addDays, subDays, format } from "date-fns";

export type WearableProvider = 'google_fit' | 'apple_health' | 'fitbit' | 'garmin';

export type MetricType = 
  | 'steps' 
  | 'heart_rate' 
  | 'sleep_hours' 
  | 'sleep_quality'
  | 'calories_burned' 
  | 'body_temperature' 
  | 'blood_oxygen'
  | 'resting_heart_rate'
  | 'active_minutes';

export interface WearableConnection {
  id: string;
  user_id: string;
  provider: WearableProvider;
  connected_at: string;
  last_sync_at: string | null;
  is_active: boolean;
  sync_frequency_hours: number;
}

export interface HealthMetric {
  id: string;
  user_id: string;
  connection_id: string;
  metric_date: string;
  metric_time: string | null;
  metric_type: MetricType;
  value: number;
  unit: string;
  source_device: string | null;
  created_at: string;
}

export interface HealthAlert {
  id: string;
  user_id: string;
  metric_id: string | null;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  threshold_value: number | null;
  actual_value: number;
  message: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export class WearableService {
  // Get user's connected devices
  static async getConnections(userId: string): Promise<WearableConnection[]> {
    const { data, error } = await supabase
      .from('wearable_connections')
      .select('*')
      .eq('user_id', userId)
      .order('connected_at', { ascending: false });

    if (error) throw error;
    return (data || []) as WearableConnection[];
  }

  // Connect a new wearable device
  static async connectDevice(userId: string, provider: WearableProvider): Promise<WearableConnection> {
    // In a real implementation, this would redirect to OAuth flow
    // For now, we'll create a mock connection
    const { data, error } = await supabase
      .from('wearable_connections')
      .insert({
        user_id: userId,
        provider,
        is_active: true,
        sync_frequency_hours: 6
      })
      .select()
      .single();

    if (error) throw error;
    return data as WearableConnection;
  }

  // Disconnect a wearable device
  static async disconnectDevice(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('wearable_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (error) throw error;
  }

  // Sync data from wearable (mock implementation)
  static async syncData(connectionId: string, userId: string): Promise<void> {
    // In a real implementation, this would call the wearable API
    // For demonstration, we'll add some mock data
    const today = new Date();
    
    const mockMetrics: Omit<HealthMetric, 'id' | 'created_at'>[] = [
      {
        user_id: userId,
        connection_id: connectionId,
        metric_date: format(today, 'yyyy-MM-dd'),
        metric_time: null,
        metric_type: 'steps',
        value: Math.floor(Math.random() * 8000) + 2000,
        unit: 'steps',
        source_device: 'Mock Device'
      },
      {
        user_id: userId,
        connection_id: connectionId,
        metric_date: format(today, 'yyyy-MM-dd'),
        metric_time: null,
        metric_type: 'resting_heart_rate',
        value: Math.floor(Math.random() * 30) + 60,
        unit: 'bpm',
        source_device: 'Mock Device'
      },
      {
        user_id: userId,
        connection_id: connectionId,
        metric_date: format(today, 'yyyy-MM-dd'),
        metric_time: null,
        metric_type: 'sleep_hours',
        value: Math.random() * 4 + 4,
        unit: 'hours',
        source_device: 'Mock Device'
      },
      {
        user_id: userId,
        connection_id: connectionId,
        metric_date: format(today, 'yyyy-MM-dd'),
        metric_time: format(today, 'HH:mm'),
        metric_type: 'body_temperature',
        value: 36.5 + (Math.random() * 2),
        unit: '°C',
        source_device: 'Mock Device'
      }
    ];

    const { error } = await supabase
      .from('wearable_metrics')
      .insert(mockMetrics);

    if (error) throw error;

    // Update last sync time
    await supabase
      .from('wearable_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connectionId);
  }

  // Get metrics for a date range
  static async getMetrics(
    userId: string,
    startDate: Date,
    endDate: Date,
    metricTypes?: MetricType[]
  ): Promise<HealthMetric[]> {
    let query = supabase
      .from('wearable_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('metric_date', format(startDate, 'yyyy-MM-dd'))
      .lte('metric_date', format(endDate, 'yyyy-MM-dd'))
      .order('metric_date', { ascending: true });

    if (metricTypes && metricTypes.length > 0) {
      query = query.in('metric_type', metricTypes);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as HealthMetric[];
  }

  // Get active health alerts
  static async getActiveAlerts(userId: string): Promise<HealthAlert[]> {
    const { data, error } = await supabase
      .from('wearable_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as HealthAlert[];
  }

  // Acknowledge an alert
  static async acknowledgeAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('wearable_alerts')
      .update({ 
        acknowledged: true,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  // Get metric summary for dashboard
  static async getMetricSummary(userId: string, days: number = 7) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const metrics = await this.getMetrics(userId, startDate, endDate);

    const summary = {
      avgSteps: 0,
      avgHeartRate: 0,
      avgSleep: 0,
      avgTemperature: 0,
      totalCalories: 0,
      dataPoints: metrics.length
    };

    if (metrics.length === 0) return summary;

    const stepMetrics = metrics.filter(m => m.metric_type === 'steps');
    const hrMetrics = metrics.filter(m => m.metric_type === 'resting_heart_rate');
    const sleepMetrics = metrics.filter(m => m.metric_type === 'sleep_hours');
    const tempMetrics = metrics.filter(m => m.metric_type === 'body_temperature');
    const calorieMetrics = metrics.filter(m => m.metric_type === 'calories_burned');

    if (stepMetrics.length > 0) {
      summary.avgSteps = stepMetrics.reduce((sum, m) => sum + Number(m.value), 0) / stepMetrics.length;
    }
    if (hrMetrics.length > 0) {
      summary.avgHeartRate = hrMetrics.reduce((sum, m) => sum + Number(m.value), 0) / hrMetrics.length;
    }
    if (sleepMetrics.length > 0) {
      summary.avgSleep = sleepMetrics.reduce((sum, m) => sum + Number(m.value), 0) / sleepMetrics.length;
    }
    if (tempMetrics.length > 0) {
      summary.avgTemperature = tempMetrics.reduce((sum, m) => sum + Number(m.value), 0) / tempMetrics.length;
    }
    if (calorieMetrics.length > 0) {
      summary.totalCalories = calorieMetrics.reduce((sum, m) => sum + Number(m.value), 0);
    }

    return summary;
  }
}
