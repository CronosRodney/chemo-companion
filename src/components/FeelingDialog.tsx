import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const feelingSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100, "Máximo de 100 caracteres"),
  feeling_text: z.string()
    .min(10, "Descreva com pelo menos 10 caracteres")
    .max(500, "Máximo de 500 caracteres"),
  event_date: z.string().min(1, "Data é obrigatória"),
  event_time: z.string().min(1, "Hora é obrigatória")
});

type FeelingFormData = z.infer<typeof feelingSchema>;

export interface FeelingData {
  title: string;
  feeling_text: string;
  rating: number;
  event_date: string;
  event_time: string;
}

interface FeelingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rating: number;
  onSave: (data: FeelingData) => Promise<void>;
}

const feelingLabels: Record<number, string> = {
  1: "Muito mal",
  2: "Mal",
  3: "Neutro",
  4: "Bem",
  5: "Muito bem"
};

const feelingEmojis: Record<number, string> = {
  1: "😷",
  2: "😔",
  3: "😐",
  4: "🙂",
  5: "😊"
};

export const FeelingDialog = ({ isOpen, onClose, rating, onSave }: FeelingDialogProps) => {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const form = useForm<FeelingFormData>({
    resolver: zodResolver(feelingSchema),
    defaultValues: {
      title: `Sentindo-se ${feelingLabels[rating]}`,
      feeling_text: "",
      event_date: currentDate,
      event_time: currentTime
    }
  });

  const handleSubmit = async (data: FeelingFormData) => {
    await onSave({
      ...data,
      rating
    });
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Como você está se sentindo?
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center my-4">
          <div className="text-7xl">{feelingEmojis[rating]}</div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Sentindo-se bem" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feeling_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descreva como você está se sentindo</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Conte mais sobre como você está se sentindo hoje, o que aconteceu, como está seu dia..."
                      className="min-h-[120px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {field.value.length}/500 caracteres
                  </p>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Sentimento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
