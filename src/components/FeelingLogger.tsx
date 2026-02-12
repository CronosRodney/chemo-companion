import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FeelingDialog, FeelingData } from "./FeelingDialog";
import { useAppContext } from "@/contexts/AppContext";
import { Frown, Meh, Smile, SmilePlus, HeartCrack } from "lucide-react";

interface FeelingLoggerProps {
  onFeelingLogged?: (rating: number) => void;
}

const feelings = [
  { rating: 1, icon: HeartCrack, label: "Muito mal" },
  { rating: 2, icon: Frown, label: "Mal" },
  { rating: 3, icon: Meh, label: "Neutro" },
  { rating: 4, icon: Smile, label: "Bem" },
  { rating: 5, icon: SmilePlus, label: "Muito bem" },
];

export const FeelingLogger = ({ onFeelingLogged }: FeelingLoggerProps) => {
  const { toast } = useToast();
  const { refetchEvents } = useAppContext();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = (rating: number) => {
    setSelectedRating(rating);
    setIsDialogOpen(true);
  };

  const handleSaveFeeling = async (data: FeelingData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Usuário não encontrado", variant: "destructive" });
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
      await refetchEvents();

      toast({ title: "Sentimento registrado", description: "Seu humor foi salvo em Eventos" });
      setIsDialogOpen(false);
      setSelectedRating(null);
      onFeelingLogged?.(data.rating);
    } catch (error) {
      console.error('Error saving feeling:', error);
      toast({ title: "Erro", description: "Não foi possível salvar o sentimento", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {feelings.map(({ rating, icon: Icon, label }) => (
          <button
            key={rating}
            onClick={() => handleClick(rating)}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 border-border bg-muted/30 hover:bg-muted/50 active:scale-95 transition-all duration-150"
          >
            <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[10px] text-muted-foreground font-medium leading-tight">
              {label}
            </span>
          </button>
        ))}
      </div>

      {selectedRating && (
        <FeelingDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setSelectedRating(null); }}
          rating={selectedRating}
          onSave={handleSaveFeeling}
        />
      )}
    </>
  );
};
