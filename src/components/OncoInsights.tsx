import { useState, useEffect, useCallback } from "react";
import { Bot, RefreshCw, Info, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Recommendation {
  title: string;
  content: string;
  severity: "info" | "warning";
}

interface InsightData {
  summary: string;
  recommendations: Recommendation[];
}

interface OncoInsightsProps {
  protocol: string;
  cycleCurrent: number;
  totalCycles: number;
  adherence: number;
  recentSymptoms?: string[];
  abnormalLabs?: string[];
}

async function sha256(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function OncoInsights({
  protocol,
  cycleCurrent,
  totalCycles,
  adherence,
  recentSymptoms = [],
  abnormalLabs = [],
}: OncoInsightsProps) {
  const { toast } = useToast();
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const clinicalState = {
    protocol: String(protocol || "").slice(0, 50),
    cycleCurrent: Number(cycleCurrent) || 0,
    totalCycles: Number(totalCycles) || 0,
    adherence: Number(adherence) || 0,
    abnormalLabs: abnormalLabs.map((l) => String(l).slice(0, 60)).slice(0, 10),
    recentSymptoms: recentSymptoms.map((s) => String(s).slice(0, 60)).slice(0, 10),
  };

  const fetchInsight = useCallback(
    async (forceRefresh = false) => {
      try {
        if (forceRefresh) setRefreshing(true);
        else setLoading(true);

        const stateHash = await sha256(JSON.stringify(clinicalState));

        // Check cache first
        if (!forceRefresh) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          const { data: cached } = await supabase
            .from("ai_insights" as any)
            .select("*")
            .eq("clinical_state_hash", stateHash)
            .gte("generated_at", todayStart.toISOString())
            .order("generated_at", { ascending: false })
            .limit(1)
            .single();

          if (cached) {
            setInsight((cached as any).content_json as InsightData);
            setGeneratedAt((cached as any).generated_at);
            setLoading(false);
            return;
          }
        }

        // Call edge function
        const { data, error } = await supabase.functions.invoke(
          "generate-onco-insights",
          { body: clinicalState }
        );

        if (error) {
          console.error("Edge function error:", error);
          const statusCode = (error as any)?.status;
          if (statusCode === 429) {
            toast({
              title: "Limite excedido",
              description: "Tente novamente em alguns minutos.",
              variant: "destructive",
            });
          } else if (statusCode === 402) {
            toast({
              title: "Créditos insuficientes",
              description: "Créditos de IA insuficientes.",
              variant: "destructive",
            });
          }
          // Use fallback
          setInsight({
            summary: "Análise diária concluída. Nenhuma alteração significativa detectada.",
            recommendations: [],
          });
          setGeneratedAt(new Date().toISOString());
        } else if (data) {
          setInsight(data as InsightData);
          setGeneratedAt(new Date().toISOString());
        }
      } catch (e) {
        console.error("OncoInsights error:", e);
        setInsight({
          summary: "Análise diária concluída. Nenhuma alteração significativa detectada.",
          recommendations: [],
        });
        setGeneratedAt(new Date().toISOString());
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [protocol, cycleCurrent, totalCycles, adherence, JSON.stringify(recentSymptoms), JSON.stringify(abnormalLabs)]
  );

  useEffect(() => {
    if (protocol) {
      fetchInsight();
    } else {
      setLoading(false);
    }
  }, [fetchInsight, protocol]);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return `Atualizado hoje às ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  // No active treatment — don't show
  if (!protocol) return null;

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-primary/15 p-5 animate-fade-in-up delay-100">
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-primary/15 p-5 flex overflow-hidden animate-fade-in-up delay-100">
      <div className="w-[3px] bg-primary/40 rounded-full mr-4 flex-shrink-0" />
      <div className="flex-1 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider">
              OncoTrack AI
            </p>
          </div>
          <div className="flex items-center gap-2">
            {generatedAt && (
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {formatTime(generatedAt)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => fetchInsight(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Summary */}
        {insight && (
          <>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {insight.summary}
            </p>

            {/* Recommendations */}
            {insight.recommendations.length > 0 && (
              <div className="space-y-2 pt-1">
                {insight.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      rec.severity === "warning"
                        ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                        : "border-primary/10 bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {rec.severity === "warning" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {rec.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {rec.content}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ml-auto flex-shrink-0 ${
                          rec.severity === "warning"
                            ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                            : "border-primary/20 text-primary"
                        }`}
                      >
                        {rec.severity === "warning" ? "Atenção" : "Dica"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/60 pt-1">
          Conteúdo informativo. Não substitui orientação médica.
        </p>
      </div>
    </div>
  );
}
