import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FeelingLoggerProps {
  onFeelingLogged?: () => void;
}

export const FeelingLogger = ({ onFeelingLogged }: FeelingLoggerProps) => {
  const { toast } = useToast();

  const logFeeling = async (rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive"
        });
        return;
      }

      const feelingLabels = {
        1: "Muito mal",
        2: "Mal", 
        3: "Neutro",
        4: "Bem",
        5: "Muito bem"
      };

      const { error } = await supabase
        .from('user_events')
        .insert({
          title: `Sentindo-se ${feelingLabels[rating as keyof typeof feelingLabels]}`,
          description: `Autoavaliação de humor - Nível ${rating}/5`,
          event_type: 'mood',
          severity: rating,
          event_date: new Date().toISOString().split('T')[0],
          event_time: new Date().toTimeString().slice(0, 5),
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Humor registrado",
        description: `Registrado como "${feelingLabels[rating as keyof typeof feelingLabels]}" na timeline`
      });

      onFeelingLogged?.();
    } catch (error) {
      console.error('Error logging feeling:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o humor",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-3 mb-4">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          onClick={() => logFeeling(rating)}
          className="flex-1 aspect-square rounded-xl glass-effect border-2 border-muted-foreground/20 hover:border-primary hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:scale-105 flex items-center justify-center text-3xl premium-button"
        >
          {rating === 1 && "😷"}
          {rating === 2 && "😔"}
          {rating === 3 && "😐"}
          {rating === 4 && "🙂"}
          {rating === 5 && "😊"}
        </button>
      ))}
    </div>
  );
};