import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LabTrendsChartProps {
  cycles: any[];
  labParam: 'anc' | 'plt' | 'scr' | 'ast' | 'alt' | 'bilirubin';
  title: string;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  color?: string;
}

export const LabTrendsChart = ({ 
  cycles, 
  labParam, 
  title, 
  unit, 
  referenceMin, 
  referenceMax,
  color = "hsl(var(--primary))"
}: LabTrendsChartProps) => {
  
  // Prepare data for the chart
  const chartData = cycles
    .filter(cycle => cycle[`${labParam}_value`] !== null && cycle[`${labParam}_value`] !== undefined)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    .map(cycle => ({
      cycle: `C${cycle.cycle_number}`,
      date: format(new Date(cycle.scheduled_date), 'dd/MM', { locale: ptBR }),
      value: cycle[`${labParam}_value`],
      referenceMin,
      referenceMax
    }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          {title}
          <span className="text-sm text-muted-foreground font-normal">({unit})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="cycle" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            
            {referenceMin && (
              <Line 
                type="monotone" 
                dataKey="referenceMin" 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                name="Mín. Seguro"
                dot={false}
              />
            )}
            
            {referenceMax && (
              <Line 
                type="monotone" 
                dataKey="referenceMax" 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                name="Máx. Seguro"
                dot={false}
              />
            )}
            
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={3}
              name={title}
              dot={{ fill: color, r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};