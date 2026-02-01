import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Heart, Moon, Thermometer, Flame } from 'lucide-react';

interface WearableMetric {
  metric_date: string;
  metric_type: string;
  value: number;
  unit: string;
}

interface WearableTrendsChartProps {
  metrics: WearableMetric[];
  title?: string;
}

type MetricType = 'steps' | 'resting_heart_rate' | 'sleep_hours' | 'body_temperature' | 'calories_burned';

const metricConfig: Record<MetricType, { label: string; icon: React.ReactNode; color: string; unit: string }> = {
  steps: {
    label: 'Passos',
    icon: <Activity className="h-4 w-4" />,
    color: 'hsl(var(--primary))',
    unit: 'passos'
  },
  resting_heart_rate: {
    label: 'Frequência Cardíaca',
    icon: <Heart className="h-4 w-4" />,
    color: 'hsl(var(--destructive))',
    unit: 'bpm'
  },
  sleep_hours: {
    label: 'Horas de Sono',
    icon: <Moon className="h-4 w-4" />,
    color: 'hsl(142, 76%, 36%)',
    unit: 'horas'
  },
  body_temperature: {
    label: 'Temperatura',
    icon: <Thermometer className="h-4 w-4" />,
    color: 'hsl(25, 95%, 53%)',
    unit: '°C'
  },
  calories_burned: {
    label: 'Calorias',
    icon: <Flame className="h-4 w-4" />,
    color: 'hsl(45, 93%, 47%)',
    unit: 'kcal'
  }
};

const periodOptions = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '14', label: 'Últimas 2 semanas' },
  { value: '30', label: 'Último mês' },
  { value: '90', label: 'Últimos 3 meses' },
];

export function WearableTrendsChart({ metrics, title = "Tendências de Saúde" }: WearableTrendsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('steps');
  const [period, setPeriod] = useState('7');

  // Filter metrics by selected type and period
  const filteredMetrics = metrics
    .filter(m => m.metric_type === selectedMetric)
    .filter(m => {
      const metricDate = new Date(m.metric_date);
      const cutoffDate = subDays(new Date(), parseInt(period));
      return metricDate >= cutoffDate;
    })
    .sort((a, b) => new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime())
    .map(m => ({
      ...m,
      dateFormatted: format(new Date(m.metric_date), 'dd/MM', { locale: ptBR }),
      dayName: format(new Date(m.metric_date), 'EEE', { locale: ptBR })
    }));

  const config = metricConfig[selectedMetric];

  // Calculate statistics
  const values = filteredMetrics.map(m => m.value);
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            {config.icon}
            {title}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione métrica" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(metricConfig).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      {value.icon}
                      {value.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredMetrics.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Nenhum dado disponível para o período selecionado</p>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Média</p>
                <p className="text-lg font-bold" style={{ color: config.color }}>
                  {avg.toFixed(selectedMetric === 'body_temperature' ? 1 : 0)} {config.unit}
                </p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Máximo</p>
                <p className="text-lg font-bold text-green-600">
                  {max.toFixed(selectedMetric === 'body_temperature' ? 1 : 0)} {config.unit}
                </p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Mínimo</p>
                <p className="text-lg font-bold text-orange-600">
                  {min.toFixed(selectedMetric === 'body_temperature' ? 1 : 0)} {config.unit}
                </p>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredMetrics}>
                <defs>
                  <linearGradient id={`gradient-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="dateFormatted"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value.toFixed(selectedMetric === 'body_temperature' ? 1 : 0)} ${config.unit}`, config.label]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={config.color}
                  strokeWidth={3}
                  fill={`url(#gradient-${selectedMetric})`}
                  dot={{ fill: config.color, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
