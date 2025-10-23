import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Moon, Thermometer, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface WearableHealthCardProps {
  avgSteps: number;
  avgHeartRate: number;
  avgSleep: number;
  avgTemperature: number;
  totalCalories: number;
}

export function WearableHealthCard({
  avgSteps,
  avgHeartRate,
  avgSleep,
  avgTemperature,
  totalCalories
}: WearableHealthCardProps) {
  const metrics = [
    {
      icon: Activity,
      label: "Passos Médios",
      value: Math.round(avgSteps).toLocaleString(),
      unit: "passos/dia",
      color: "text-primary"
    },
    {
      icon: Heart,
      label: "FC em Repouso",
      value: Math.round(avgHeartRate),
      unit: "bpm",
      color: "text-destructive"
    },
    {
      icon: Moon,
      label: "Sono Médio",
      value: avgSleep.toFixed(1),
      unit: "horas/noite",
      color: "text-secondary"
    },
    {
      icon: Thermometer,
      label: "Temperatura",
      value: avgTemperature.toFixed(1),
      unit: "°C",
      color: "text-accent"
    },
    {
      icon: Flame,
      label: "Calorias (total)",
      value: Math.round(totalCalories).toLocaleString(),
      unit: "kcal",
      color: "text-chart-1"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo de Saúde (Últimos 7 Dias)</CardTitle>
        <CardDescription>
          Dados sincronizados dos seus dispositivos wearables
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className={cn("p-2 rounded-md bg-background", metric.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric.unit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
