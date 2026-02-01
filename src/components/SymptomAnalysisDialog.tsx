import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Brain, AlertTriangle, CheckCircle, Loader2, Send, ThermometerSun, Pill, Clock } from 'lucide-react';
import { symptomSchema, type SymptomFormData } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SymptomAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AnalysisResult {
  severity_assessment: 'low' | 'moderate' | 'high' | 'urgent';
  possible_causes: string[];
  recommendations: string[];
  when_to_seek_help: string[];
  self_care_tips: string[];
}

export function SymptomAnalysisDialog({ open, onOpenChange }: SymptomAnalysisDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const form = useForm<SymptomFormData>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      symptom_description: '',
      severity: 5,
      onset_date: new Date().toISOString().split('T')[0],
      duration: '',
      frequency: '',
      triggers: '',
      relieving_factors: ''
    }
  });

  const handleSubmit = async (data: SymptomFormData) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('analyze-symptoms', {
        body: { symptoms: data }
      });

      if (error) throw error;

      setAnalysisResult(result);

      // Save symptom as event
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('events').insert({
          user_id: user.id,
          title: `Sintoma: ${data.symptom_description.substring(0, 50)}...`,
          description: data.symptom_description,
          event_type: 'adverse_event',
          severity: Math.ceil(data.severity / 2), // Convert 1-10 to 1-5
          event_date: data.onset_date,
          event_time: new Date().toTimeString().slice(0, 5)
        });
      }

      toast.success('Análise concluída!');
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      toast.error('Erro ao analisar sintomas. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'low': return 'Baixa';
      case 'moderate': return 'Moderada';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return severity;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Análise de Sintomas com IA
          </DialogTitle>
          <DialogDescription>
            Descreva seus sintomas para receber orientações personalizadas. 
            Lembre-se: esta análise não substitui uma consulta médica.
          </DialogDescription>
        </DialogHeader>

        {!analysisResult ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="symptom_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descreva seus sintomas *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Ex: Estou sentindo dor de cabeça forte há 2 dias, acompanhada de náusea leve..."
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intensidade do sintoma: {field.value}/10</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Leve</span>
                      <span>Moderado</span>
                      <span>Severo</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="onset_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quando começou? *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 2 horas, contínuo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Todo dia, às vezes, apenas uma vez" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="triggers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>O que piora?</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: luz forte, movimento" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relieving_factors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>O que alivia?</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: descanso, medicamento" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isAnalyzing} className="flex-1">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Analisar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            {/* Severity Assessment */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="h-5 w-5 text-primary" />
                    <span className="font-medium">Avaliação de Severidade</span>
                  </div>
                  <Badge className={getSeverityColor(analysisResult.severity_assessment)}>
                    {getSeverityLabel(analysisResult.severity_assessment)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Possible Causes */}
            {analysisResult.possible_causes.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-5 w-5 text-primary" />
                    <span className="font-medium">Possíveis Causas</span>
                  </div>
                  <ul className="space-y-2">
                    {analysisResult.possible_causes.map((cause, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {analysisResult.recommendations.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Recomendações</span>
                  </div>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* When to Seek Help */}
            {analysisResult.when_to_seek_help.length > 0 && (
              <Card className="border-destructive/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="font-medium text-destructive">Procure ajuda médica se:</span>
                  </div>
                  <ul className="space-y-2">
                    {analysisResult.when_to_seek_help.map((item, index) => (
                      <li key={index} className="text-sm text-destructive/80 flex items-start gap-2">
                        <span>⚠️</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Self Care Tips */}
            {analysisResult.self_care_tips.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Pill className="h-5 w-5 text-primary" />
                    <span className="font-medium">Dicas de Autocuidado</span>
                  </div>
                  <ul className="space-y-2">
                    {analysisResult.self_care_tips.map((tip, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setAnalysisResult(null)} className="flex-1">
                Nova Análise
              </Button>
              <Button onClick={() => onOpenChange(false)} className="flex-1">
                Fechar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ Esta análise é gerada por IA e não substitui uma consulta médica.
              Em caso de emergência, procure atendimento imediato.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
