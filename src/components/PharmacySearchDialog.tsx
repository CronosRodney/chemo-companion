import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Search, MapPin, Phone, Clock, Loader2, ShoppingBag, Truck, Package } from 'lucide-react';
import { pharmacySearchSchema, type PharmacySearchFormData } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PharmacySearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMedication?: string;
}

interface PharmacyResult {
  name: string;
  address: string;
  distance_km?: number;
  phone?: string;
  price?: number;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  hours?: string;
}

export function PharmacySearchDialog({ open, onOpenChange, defaultMedication = '' }: PharmacySearchDialogProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PharmacyResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const form = useForm<PharmacySearchFormData>({
    resolver: zodResolver(pharmacySearchSchema),
    defaultValues: {
      medication_name: defaultMedication,
      location: '',
      radius_km: 10
    }
  });

  const handleSubmit = async (data: PharmacySearchFormData) => {
    setIsSearching(true);
    setResults([]);

    try {
      const { data: response, error } = await supabase.functions.invoke('search-pharmacies', {
        body: data
      });

      if (error) throw error;

      setResults(response.results || []);
      setHasSearched(true);

      if (response.results?.length === 0) {
        toast.info('Nenhuma farmácia encontrada na região');
      }
    } catch (error) {
      console.error('Error searching pharmacies:', error);
      toast.error('Erro ao buscar farmácias. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Disponível</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Estoque baixo</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Indisponível</Badge>;
      default:
        return <Badge variant="outline">Verificar</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar em Farmácias
          </DialogTitle>
          <DialogDescription>
            Encontre preços e disponibilidade de medicamentos em farmácias próximas
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="medication_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Medicamento *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Paracetamol 500mg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input {...field} className="pl-10" placeholder="Cidade ou endereço (ou usar localização atual)" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="radius_km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raio de busca: {field.value} km</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={50}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSearching} className="w-full">
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Farmácias
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {results.length} farmácia{results.length !== 1 ? 's' : ''} encontrada{results.length !== 1 ? 's' : ''}
            </h3>

            {results.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma farmácia encontrada na região</p>
                  <p className="text-sm text-muted-foreground mt-1">Tente aumentar o raio de busca</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {results.map((pharmacy, index) => (
                  <Card key={index} className="hover:border-primary/50 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{pharmacy.name}</h4>
                            {getAvailabilityBadge(pharmacy.availability)}
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              {pharmacy.address}
                              {pharmacy.distance_km && (
                                <span className="text-primary font-medium">
                                  ({pharmacy.distance_km.toFixed(1)} km)
                                </span>
                              )}
                            </p>
                            
                            {pharmacy.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {pharmacy.phone}
                              </p>
                            )}
                            
                            {pharmacy.hours && (
                              <p className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {pharmacy.hours}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {pharmacy.price && (
                            <p className="text-xl font-bold text-primary">
                              {formatPrice(pharmacy.price)}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline">
                              <Phone className="h-3 w-3 mr-1" />
                              Ligar
                            </Button>
                            <Button size="sm">
                              <Truck className="h-3 w-3 mr-1" />
                              Delivery
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              💡 Dica: Compare preços e verifique disponibilidade antes de ir à farmácia.
              Preços podem variar.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
