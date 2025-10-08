import { useState, useRef, useCallback } from 'react';
import { IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { parseGS1 } from '../lib/gs1';
import { SmartBrowserExtractor } from '../services/smartBrowserExtractor';
import { MedicationService } from '../services/medicationService';
import { useToast } from './use-toast';

interface ScanResult {
  type: 'gs1' | 'url' | 'error';
  data?: any;
  error?: string;
}

export function useAutoScanner() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const lastCodeRef = useRef<string>('');
  const debounceRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const processCode = useCallback(async (rawValue: string, format: string): Promise<ScanResult> => {
    try {
      // Check if it's a URL
      if (rawValue.startsWith('http')) {
        console.log('[useAutoScanner] 🚀 Abrindo página automaticamente...', rawValue);
        
        try {
          // Abre browser automaticamente, aguarda carregamento, e extrai
          const extractedData = await SmartBrowserExtractor.openAndExtract(rawValue);
          
          // Valida se os dados são reais (não são placeholders genéricos)
          const isValidData = extractedData && 
            extractedData.name && 
            extractedData.name !== 'nome' && 
            extractedData.name !== 'Medicamento não identificado' &&
            extractedData.name !== 'Não identificado' &&
            extractedData.name !== 'Erro de acesso';
          
          if (isValidData) {
            console.log('[useAutoScanner] ✅ Dados extraídos com sucesso:', extractedData.name);
            return {
              type: 'url',
              data: { url: rawValue, extracted: extractedData, needsConfirmation: true }
            };
          } else {
            console.warn('[useAutoScanner] ⚠️ Dados extraídos são inválidos ou genéricos');
            return {
              type: 'url',
              data: { 
                url: rawValue, 
                extractionError: 'Não foi possível extrair informações válidas. Verifique a página manualmente.', 
                needsConfirmation: false 
              }
            };
          }
        } catch (error) {
          console.error('[useAutoScanner] ❌ Erro na extração:', error);
          const errorMessage = error instanceof Error ? error.message : 'Erro ao processar URL';
          return {
            type: 'url',
            data: { url: rawValue, extractionError: errorMessage, needsConfirmation: false }
          };
        }
      } else {
        // Try to parse as GS1
        const parsed = parseGS1(rawValue);
        const medicationData = MedicationService.fromGS1(parsed);
        
        // Save medication
        const savedMed = await MedicationService.saveMedication(medicationData);
        await MedicationService.linkToUser(savedMed.id);
        
        // Add timeline event
        const details = [
          parsed.gtin && `GTIN: ${parsed.gtin}`,
          parsed.expiry && `Validade: ${parsed.expiry}`,
          parsed.lot && `Lote: ${parsed.lot}`,
          parsed.serial && `Série: ${parsed.serial}`,
          parsed.anvisa && `Registro ANVISA: ${parsed.anvisa}`
        ].filter(Boolean).join('\n');
        
        await MedicationService.addTimelineEvent(
          'med_scan',
          'Medicamento escaneado',
          details || rawValue
        );
        
        return {
          type: 'gs1',
          data: { parsed, medication: savedMed }
        };
      }
    } catch (error) {
      console.error('Processing error:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }, []);

  const handleScan = useCallback(async (detectedCodes: IDetectedBarcode[]) => {
    if (!detectedCodes?.length || isProcessing) return;
    
    const code = detectedCodes[0];
    const rawValue = code.rawValue || '';
    
    // Debounce: ignore if same code scanned recently
    if (rawValue === lastCodeRef.current) return;
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    lastCodeRef.current = rawValue;
    setIsProcessing(true);
    
    try {
      const result = await processCode(rawValue, code.format);
      setLastScan(result);
      
      // Show appropriate toast
      if (result.type === 'url') {
        if (result.data.extracted?.name) {
          toast({
            title: "✅ Medicamento encontrado",
            description: `${result.data.extracted.name} - Revise e confirme para salvar`,
          });
        } else {
          toast({
            title: "⚠️ Dados não encontrados",
            description: "Não foi possível extrair informações automaticamente",
            variant: "destructive",
          });
        }
      } else if (result.type === 'gs1') {
        toast({
          title: "Medicamento registrado",
          description: "Dados salvos automaticamente na timeline",
        });
      } else if (result.type === 'error') {
        toast({
          title: "Erro no processamento",
          description: result.error,
          variant: "destructive",
        });
      }
      
      // Reset debounce after 2 seconds
      debounceRef.current = setTimeout(() => {
        lastCodeRef.current = '';
      }, 2000);
      
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processCode, toast]);

  const processManualCode = useCallback(async (rawValue: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await processCode(rawValue, 'manual');
      setLastScan(result);
      
      if (result.type === 'error') {
        toast({
          title: "Erro no processamento",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Código processado",
          description: "Dados salvos automaticamente",
        });
      }
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processCode, toast]);

  return {
    handleScan,
    processManualCode,
    isProcessing,
    lastScan
  };
}