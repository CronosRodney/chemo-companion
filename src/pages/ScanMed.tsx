import { useMemo, useState } from 'react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { parseGS1 } from '../lib/gs1';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

async function addTimelineEvent(kind: string, title: string, details: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não está logado');
  const { error } = await supabase.from('timeline_events').insert({
    user_id: user.id, 
    kind, 
    title, 
    details, 
    occurred_at: new Date().toISOString()
  });
  if (error) throw error;
}

export default function ScanMed() {
  const [paused, setPaused] = useState(false);
  const [last, setLast] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const formats = useMemo(() => (['data_matrix', 'qr_code'] as const), []);
  const navigate = useNavigate();
  const { toast } = useToast();

  async function onScan(res: IDetectedBarcode[]) {
    if (!res?.length || paused) return;
    setPaused(true); 
    setTimeout(() => setPaused(false), 1500);

    const code = res[0];
    console.log('Código escaneado:', code);
    
    try {
      setErr(null);
      
      if (code.format === 'data_matrix') {
        // Parse GS1 DataMatrix
        const p = parseGS1(code.rawValue || '');
        const details = [
          p.gtin && `GTIN: ${p.gtin}`,
          p.expiry && `Validade: ${p.expiry}`,
          p.lot && `Lote: ${p.lot}`,
          p.serial && `Série: ${p.serial}`,
          p.anvisa && `Registro ANVISA: ${p.anvisa}`
        ].filter(Boolean).join('\n');
        
        await addTimelineEvent('med_scan', 'Medicamento escaneado', details || (p.raw ?? ''));
        setLast({ format: code.format, parsed: p });
        
        toast({
          title: "Medicamento registrado",
          description: "Dados do medicamento foram salvos na timeline",
        });
      } else if (code.format === 'qr_code') {
        // Handle QR code (likely a URL)
        const url = code.rawValue || '';
        if (url.startsWith('http')) {
          // Open URL in new tab
          window.open(url, '_blank', 'noopener,noreferrer');
          await addTimelineEvent('med_qr', 'Link de bula acessado', `URL: ${url}`);
          setLast({ format: code.format, url });
          
          toast({
            title: "Link de bula aberto",
            description: "O link foi registrado na timeline",
          });
        } else {
          // Try to parse as GS1 if it's not a URL
          const p = parseGS1(url);
          const details = [
            p.gtin && `GTIN: ${p.gtin}`,
            p.expiry && `Validade: ${p.expiry}`,
            p.lot && `Lote: ${p.lot}`,
            p.serial && `Série: ${p.serial}`,
            p.anvisa && `Registro ANVISA: ${p.anvisa}`
          ].filter(Boolean).join('\n');
          
          await addTimelineEvent('med_scan', 'Medicamento escaneado (QR)', details || url);
          setLast({ format: code.format, parsed: p });
          
          toast({
            title: "Medicamento registrado",
            description: "Dados do medicamento foram salvos na timeline",
          });
        }
      }
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      setErr(errorMsg);
      toast({
        title: "Erro ao processar código",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }

  const handleManualScan = async () => {
    if (!manualInput.trim()) return;
    
    try {
      setErr(null);
      const p = parseGS1(manualInput.trim());
      const details = [
        p.gtin && `GTIN: ${p.gtin}`,
        p.expiry && `Validade: ${p.expiry}`,
        p.lot && `Lote: ${p.lot}`,
        p.serial && `Série: ${p.serial}`,
        p.anvisa && `Registro ANVISA: ${p.anvisa}`
      ].filter(Boolean).join('\n');
      
      await addTimelineEvent('med_scan', 'Medicamento escaneado (manual)', details || manualInput.trim());
      setLast({ format: 'data_matrix', parsed: p });
      setManualInput('');
      
      toast({
        title: "Medicamento registrado",
        description: "Dados do medicamento foram salvos na timeline",
      });
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      setErr(errorMsg);
      toast({
        title: "Erro ao processar código",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Escanear Medicamento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scanner de Códigos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Scanner
              onScan={onScan}
              onError={(e) => setErr(String(e))}
              formats={['data_matrix', 'qr_code']}
              paused={paused}
              constraints={{ facingMode: 'environment' }}
              components={{ torch: true, zoom: true, finder: true }}
              scanDelay={150}
              allowMultiple={false}
            />
            {paused && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="text-white text-lg">Processando...</div>
              </div>
            )}
          </div>

          {err && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive font-medium">Erro: {err}</p>
            </div>
          )}

          {last && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Último Código Escaneado</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(last, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrada Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Cole aqui um código GS1 (ex.: (01)07898987654321(17)251231(10)L123(21)ABC)"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleManualScan} 
            disabled={!manualInput.trim()}
            className="w-full"
          >
            Processar Código Manual
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}