import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FeelingDialog, FeelingData } from "./FeelingDialog";
import { useAppContext } from "@/contexts/AppContext";

interface FeelingLoggerProps {
  onFeelingLogged?: (rating: number) => void;
}

export const FeelingLogger = ({ onFeelingLogged }: FeelingLoggerProps) => {
  const { toast } = useToast();
  const { refetchEvents } = useAppContext();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEmojiClick = (rating: number) => {
    setSelectedRating(rating);
    setIsDialogOpen(true);
  };

  const handleSaveFeeling = async (data: FeelingData) => {
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

      const { error } = await supabase
        .from('events')
        .insert({
          title: data.title,
          description: data.feeling_text,
          event_type: 'mood',
          severity: data.rating,
          event_date: data.event_date,
          event_time: data.event_time,
          user_id: user.id
        });

      if (error) throw error;

      // Atualizar lista de eventos
      await refetchEvents();

      toast({
        title: "Sentimento registrado",
        description: "Seu humor foi salvo em Eventos"
      });

      setIsDialogOpen(false);
      setSelectedRating(null);
      onFeelingLogged?.(data.rating);
    } catch (error) {
      console.error('Error saving feeling:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o sentimento",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleEmojiClick(rating)}
            className="flex-1 aspect-square rounded-xl border border-border/50 bg-muted/30 hover:border-primary hover:bg-primary/5 transition-all duration-200 flex items-center justify-center text-2xl"
          >
            {rating === 1 && "😷"}
            {rating === 2 && "😔"}
            {rating === 3 && "😐"}
            {rating === 4 && "🙂"}
            {rating === 5 && "😊"}
          </button>
        ))}
      </div>

      {selectedRating && (
        <FeelingDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedRating(null);
          }}
          rating={selectedRating}
          onSave={handleSaveFeeling}
        />
      )}
    </>
  );
};