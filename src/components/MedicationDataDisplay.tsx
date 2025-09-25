import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { MedicationService } from '@/services/medicationService';
import { ExtractedData } from '@/services/urlExtractorService';
import { ExternalLink, Edit3, Save, X, Image } from 'lucide-react';

interface MedicationDataDisplayProps {
  extractedData: ExtractedData;
  sourceUrl: string;
  onClose: () => void;
}

export function MedicationDataDisplay({ extractedData, sourceUrl, onClose }: MedicationDataDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(extractedData);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: keyof ExtractedData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Erro",
        description: "Nome do medicamento é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Convert to medication format
      const medicationData = {
        name: formData.name,
        activeIngredient: formData.activeIngredient,
        manufacturer: formData.manufacturer,
        concentration: formData.concentration,
        form: formData.form,
        route: formData.route || 'oral',
        notes: [
          formData.category && `Categoria: ${formData.category}`,
          formData.prescriptionRequired && 'Venda sob prescrição médica',
          formData.registrationNumber && `Registro MS: ${formData.registrationNumber}`,
          formData.storageInstructions && `Conservação: ${formData.storageInstructions}`,
          formData.packageQuantity && `Embalagem: ${formData.packageQuantity}`,
          `Fonte: ${sourceUrl}`
        ].filter(Boolean).join('\n')
      };

      const savedMed = await MedicationService.saveMedication(medicationData);
      await MedicationService.linkToUser(savedMed.id);

      // Add timeline event
      await MedicationService.addTimelineEvent(
        'med_manual',
        'Medicamento adicionado via URL',
        `${medicationData.name} - Extraído de: ${sourceUrl}`
      );

      toast({
        title: "Sucesso",
        description: "Medicamento salvo com sucesso!",
      });

      navigate('/timeline');
    } catch (error) {
      console.error('Error saving medication:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar medicamento",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Informações do Medicamento</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(sourceUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Fonte
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">Extraído automaticamente</Badge>
          {extractedData.screenshot && (
            <Badge variant="outline">
              <Image className="h-3 w-3 mr-1" />
              Com captura
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Screenshot preview if available */}
        {extractedData.screenshot && (
          <div className="space-y-2">
            <Label>Captura da Página</Label>
            <div className="border rounded-lg overflow-hidden">
              <img 
                src={extractedData.screenshot} 
                alt="Captura da página do medicamento"
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nome do Medicamento *</Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome do medicamento"
              />
            ) : (
              <p className="text-sm p-3 bg-muted rounded-md">{formData.name || 'Não informado'}</p>
            )}
          </div>

          {/* Princípio Ativo */}
          <div className="space-y-2">
            <Label htmlFor="activeIngredient">Princípio Ativo</Label>
            {isEditing ? (
              <Input
                id="activeIngredient"
                value={formData.activeIngredient || ''}
                onChange={(e) => handleInputChange('activeIngredient', e.target.value)}
                placeholder="Princípio ativo"
              />
            ) : (
              <p className="text-sm p-3 bg-muted rounded-md">{formData.activeIngredient || 'Não informado'}</p>
            )}
          </div>

          {/* Fabricante */}
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Fabricante</Label>
            {isEditing ? (
              <Input
                id="manufacturer"
                value={formData.manufacturer || ''}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                placeholder="Fabricante"
              />
            ) : (
              <p className="text-sm p-3 bg-muted rounded-md">{formData.manufacturer || 'Não informado'}</p>
            )}
          </div>

          {/* Concentração */}
          <div className="space-y-2">
            <Label htmlFor="concentration">Concentração</Label>
            {isEditing ? (
              <Input
                id="concentration"
                value={formData.concentration || ''}
                onChange={(e) => handleInputChange('concentration', e.target.value)}
                placeholder="ex: 500mg"
              />
            ) : (
              <p className="text-sm p-3 bg-muted rounded-md">{formData.concentration || 'Não informado'}</p>
            )}
          </div>

          {/* Forma Farmacêutica */}
          <div className="space-y-2">
            <Label htmlFor="form">Forma Farmacêutica</Label>
            {isEditing ? (
              <Input
                id="form"
                value={formData.form || ''}
                onChange={(e) => handleInputChange('form', e.target.value)}
                placeholder="ex: Comprimido"
              />
            ) : (
              <p className="text-sm p-3 bg-muted rounded-md">{formData.form || 'Não informado'}</p>
            )}
          </div>
        </div>

        {/* Informações Adicionais */}
        {(formData.category || formData.prescriptionRequired || formData.registrationNumber) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium">Informações Adicionais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.category && (
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <p className="text-sm p-3 bg-muted rounded-md">{formData.category}</p>
                  </div>
                )}
                
                {formData.registrationNumber && (
                  <div className="space-y-2">
                    <Label>Registro MS</Label>
                    <p className="text-sm p-3 bg-muted rounded-md">{formData.registrationNumber}</p>
                  </div>
                )}
                
                {formData.packageQuantity && (
                  <div className="space-y-2">
                    <Label>Quantidade na Embalagem</Label>
                    <p className="text-sm p-3 bg-muted rounded-md">{formData.packageQuantity}</p>
                  </div>
                )}
                
                {formData.prescriptionRequired && (
                  <div className="space-y-2">
                    <Label>Prescrição</Label>
                    <Badge variant="outline">Venda sob prescrição médica</Badge>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Instruções de Conservação */}
        {formData.storageInstructions && (
          <div className="space-y-2">
            <Label>Instruções de Conservação</Label>
            <p className="text-sm p-3 bg-muted rounded-md">{formData.storageInstructions}</p>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !formData.name?.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Medicamento'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}