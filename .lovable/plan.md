

# OncoTrack AI -- Plano Revisado com Ajustes de Seguranca

## Resumo das Correcoes Solicitadas

Todos os 5 pontos levantados foram incorporados ao plano.

---

## 1. Banco de Dados -- Tabela `ai_insights` (com auditoria)

Nova tabela com campo `clinical_state` para auditoria hospitalar:

```sql
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_json jsonb NOT NULL,
  clinical_state jsonb NOT NULL,
  clinical_state_hash text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Politicas RLS
CREATE POLICY "Users can view own insights" ON public.ai_insights
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON public.ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights" ON public.ai_insights
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_insights_user_generated
  ON public.ai_insights(user_id, generated_at DESC);
```

Campo `clinical_state` armazena o snapshot exato enviado ao modelo, permitindo auditoria completa.

---

## 2. Edge Function -- `generate-onco-insights`

### 2.1 Configuracao

```toml
[functions.generate-onco-insights]
verify_jwt = false
```

Nota tecnica: `verify_jwt = false` e necessario neste ambiente (Lovable Cloud/signing-keys). A autenticacao e validada explicitamente no codigo usando `supabase.auth.getUser()`, que verifica o token contra o servidor. Chamadas sem token valido recebem 401.

### 2.2 Autenticacao no codigo

Usar o helper `_shared/auth.ts` existente (`getUserFromRequest`) que ja valida via `supabase.auth.getUser()`.

### 2.3 Sanitizacao de dados (Governanca Medica)

Antes de enviar ao modelo, construir payload minimo estruturado:

```typescript
const sanitizedInput = {
  protocol: String(protocol).slice(0, 50),
  cycleCurrent: Number(cycleCurrent),
  totalCycles: Number(totalCycles),
  adherence: Number(adherence),
  abnormalLabs: abnormalLabs.map(l => String(l).slice(0, 60)).slice(0, 10),
  recentSymptoms: recentSymptoms.map(s => String(s).slice(0, 60)).slice(0, 10),
};
```

Nunca enviar: nome do paciente, CPF, dados identificaveis, texto livre medico, resultados completos de exames.

### 2.4 System prompt com controle de severidade

```
Voce e um assistente educacional oncologico.
Nao forneca diagnostico medico.
Nao prescreva medicamentos.
Nao substitua equipe medica.
Forneca apenas orientacoes educativas baseadas nos dados recebidos.
Nunca utilize linguagem alarmista.
Caso detecte padrao preocupante, use severity "warning" com texto moderado e educativo.
Nunca use termos como "grave", "risco imediato", "emergencial" ou "interrompa tratamento".
Maximo 3 recomendacoes.
```

### 2.5 Tool calling para forcar JSON estruturado

```json
{
  "type": "function",
  "function": {
    "name": "generate_insights",
    "description": "Gera insights oncologicos educativos estruturados",
    "parameters": {
      "type": "object",
      "properties": {
        "summary": { "type": "string", "maxLength": 200 },
        "recommendations": {
          "type": "array",
          "maxItems": 3,
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "content": { "type": "string" },
              "severity": { "type": "string", "enum": ["info", "warning"] }
            },
            "required": ["title", "content", "severity"]
          }
        }
      },
      "required": ["summary", "recommendations"]
    }
  }
}
```

### 2.6 Hash com SHA-256

```typescript
const stateString = JSON.stringify(sanitizedInput);
const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stateString));
const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
```

### 2.7 Cache check

Antes de chamar Gemini, verificar se ja existe insight do dia com mesmo hash. Se sim, retornar o existente.

### 2.8 Fallback seguro

Se o modelo falhar ou retornar dados invalidos:

```json
{
  "summary": "Analise diaria concluida. Nenhuma alteracao significativa detectada.",
  "recommendations": []
}
```

### 2.9 Rate limiting

Usar `checkRateLimit` existente com 5 req/min.

### 2.10 Tratamento de erros 429/402

Capturar erros do gateway e retornar status codes adequados ao frontend.

---

## 3. Componente Frontend -- `OncoInsights.tsx`

### Logica

1. Ao montar, buscar ultimo insight via query Supabase
2. Se cache valido (hoje + mesmo hash), usar
3. Se nao, chamar edge function via `supabase.functions.invoke`
4. Exibir card com resultados

### Visual

- Card com `bg-card rounded-2xl border border-primary/15 p-5`
- Barra lateral decorativa azul
- Icone Bot + titulo "ONCOTRACK AI"
- Badges: `info` em azul, `warning` em amarelo
- **Timestamp**: "Atualizado hoje as HH:MM"
- **Botao "Atualizar"**: pequeno, permite regeneracao manual (respeitando rate limit)
- Rodape fixo: "Conteudo informativo. Nao substitui orientacao medica."
- Estados: loading (skeleton), erro (fallback com mensagem amigavel), sucesso
- Toast para erros 429/402

---

## 4. Integracao na Home

Substituir o `aiSection` estatico atual pelo componente `<OncoInsights />`.

- Passar dados do contexto: `treatmentPlans`, `stats`
- Posicao mantida: mobile abaixo de tratamento, desktop na coluna principal

---

## Secao Tecnica -- Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `ai_insights` |
| `supabase/functions/generate-onco-insights/index.ts` | Criar |
| `supabase/config.toml` | Adicionar funcao |
| `src/components/OncoInsights.tsx` | Criar |
| `src/pages/Home.tsx` | Substituir aiSection |

### Nao sera alterado

- Hooks existentes
- Rotas
- Backend existente
- Navegacao mobile/desktop
- Dados existentes
- Logica medica

