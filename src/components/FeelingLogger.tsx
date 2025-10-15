import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FeelingDialog, FeelingData } from "./FeelingDialog";

interface FeelingLoggerProps {
  onFeelingLogged?: (rating: number) => void;
}

export const FeelingLogger = ({ onFeelingLogged }: FeelingLoggerProps) => {
  const { toast } = useToast();
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
      <div className="flex gap-3 mb-4">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleEmojiClick(rating)}
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