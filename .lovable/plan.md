

# Plano: Integração OncoTrack ↔ Minha Caderneta (Fase 2 - Ajustado)

## Resumo Executivo

Implementar o consumo da API de vacinação da Minha Caderneta no OncoTrack, com os 3 ajustes técnicos solicitados para garantir robustez, segurança e clareza de responsabilidades entre sistemas.

---

## Ajustes Aplicados

| Ajuste | Problema Original | Correção Aplicada |
|--------|-------------------|-------------------|
| 1. Nomenclatura da tabela | `caderneta_connections` duplicava conceito | `external_connections` com campo `provider` |
| 2. Token no callback | Token visível na query string | Handshake backend-to-backend via Edge Function |
| 3. Origem dos alertas | Ambiguidade sobre quem gerou o alerta | Campo `source` explícito em cada alerta |

---

## Arquitetura Corrigida

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OncoTrack                                       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       Página /vaccination                              │  │
│  │                                                                        │  │
│  │   ┌─ Estado: NÃO CONECTADO ─────────────────────────────────────────┐ │  │
│  │   │                                                                  │ │  │
│  │   │  Texto explicativo + Botão [Conectar Minha Caderneta]           │ │  │
│  │   │                          │                                       │ │  │
│  │   │                          ▼                                       │ │  │
│  │   │  Redireciona para:                                               │ │  │
│  │   │  https://chronicle-my-health.lovable.app/connect                 │ │  │
│  │   │    ?source=oncotrack                                             │ │  │
│  │   │    &oncotrack_user_id=<user_id>                                  │ │  │
│  │   │    &callback_url=.../vaccination?connected=true                  │ │  │
│  │   │                                                                  │ │  │
│  │   │  (SEM TOKEN NA URL - apenas flag de sucesso)                     │ │  │
│  │   └──────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                        │  │
│  │   ┌─ Callback: connected=true ───────────────────────────────────────┐ │  │
│  │   │                                                                  │ │  │
│  │   │  1. OncoTrack detecta ?connected=true                            │ │  │
│  │   │  2. Chama Edge Function local: complete-caderneta-connection     │ │  │
│  │   │  3. Edge Function faz handshake B2B com Minha Caderneta          │ │  │
│  │   │  4. Recebe token seguro e salva em external_connections          │ │  │
│  │   │  5. Limpa URL e exibe estado conectado                           │ │  │
│  │   └──────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                        │  │
│  │   ┌─ Estado: CONECTADO ─────────────────────────────────────────────┐ │  │
│  │   │                                                                  │ │  │
│  │   │  ┌─────────────────────────────────────────────────────────┐    │ │  │
│  │   │  │ Resumo Vacinal (via API Minha Caderneta)                │    │ │  │
│  │   │  │ • Total: 12  │ Em dia: 8  │ Pendentes: 3  │ Atrasadas: 1│    │ │  │
│  │   │  └─────────────────────────────────────────────────────────┘    │ │  │
│  │   │                                                                  │ │  │
│  │   │  ┌─────────────────────────────────────────────────────────┐    │ │  │
│  │   │  │ Alertas Clínicos (com origem explícita)                 │    │ │  │
│  │   │  │ ⚠️ [minha_caderneta] Influenza pendente                 │    │ │  │
│  │   │  │ ⚠️ [oncotrack] Vacina X contraindicada durante QT       │    │ │  │
│  │   │  └─────────────────────────────────────────────────────────┘    │ │  │
│  │   │                                                                  │ │  │
│  │   │  [Abrir Minha Caderneta]   [Desconectar]                        │ │  │
│  │   └──────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Tabela: external_connections                                               │
│  ├── user_id (OncoTrack)                                                   │
│  ├── provider = 'minha_caderneta'                                          │
│  ├── connection_token (obtido via B2B)                                     │
│  ├── status (active/revoked)                                               │
│  ├── connected_at / last_sync_at                                           │
│  └── metadata (JSON opcional)                                               │
│                                                                             │
│  Edge Functions:                                                            │
│  ├── complete-caderneta-connection (handshake B2B)                         │
│  └── disconnect-caderneta (revoga via B2B + local)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              │ Handshake B2B (backend-to-backend)
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Minha Caderneta                                     │
│             https://yzegsqdpltiiawbhoafo.supabase.co                        │
│                                                                             │
│  /functions/v1/oncotrack-get-token      (retorna token para user_id)        │
│  /functions/v1/oncotrack-vaccination-summary                                 │
│  /functions/v1/oncotrack-disconnect                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| **Migração SQL** | Criar | Tabela `external_connections` |
| `src/pages/Vaccination.tsx` | Criar | Página principal da aba |
| `src/hooks/useExternalConnections.ts` | Criar | Hook genérico para conexões externas |
| `src/components/VaccinationSummaryCard.tsx` | Criar | Card de resumo vacinal |
| `src/components/VaccinationAlertsCard.tsx` | Criar | Card de alertas com origem |
| `supabase/functions/complete-caderneta-connection/index.ts` | Criar | Handshake B2B |
| `supabase/functions/disconnect-caderneta/index.ts` | Criar | Revogação B2B |
| `src/App.tsx` | Modificar | Adicionar rota `/vaccination` |
| `src/components/MobileMoreMenu.tsx` | Modificar | Adicionar item Vacinação |
| `src/i18n/locales/*.json` | Modificar | Traduções |

---

## Detalhamento Técnico

### 1. Migração SQL: Tabela `external_connections`

```sql
-- Tabela genérica para conexões com sistemas externos
CREATE TABLE IF NOT EXISTS public.external_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('minha_caderneta')),
  connection_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, provider)
);

-- Índices
CREATE INDEX idx_external_connections_user_provider 
  ON public.external_connections(user_id, provider);
CREATE INDEX idx_external_connections_status 
  ON public.external_connections(status);

-- RLS
ALTER TABLE public.external_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections"
  ON public.external_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
  ON public.external_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON public.external_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_external_connections_updated_at
  BEFORE UPDATE ON public.external_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Edge Function: `complete-caderneta-connection`

Fluxo de handshake backend-to-backend:

1. Recebe `oncotrack_user_id` do frontend OncoTrack
2. Valida que o usuário autenticado é o mesmo
3. Chama API da Minha Caderneta para obter token
4. Salva token em `external_connections`
5. Retorna sucesso

```typescript
// Estrutura da Edge Function
Deno.serve(async (req: Request) => {
  // 1. Validar autenticação do usuário OncoTrack
  // 2. POST para Minha Caderneta: /functions/v1/oncotrack-get-token
  //    Body: { oncotrack_user_id }
  //    (Minha Caderneta valida que existe conexão pendente)
  // 3. Recebe { connection_token } 
  // 4. Upsert em external_connections
  // 5. Retorna { success: true }
});
```

### 3. Interface de Alertas com Origem

```typescript
interface ClinicalAlert {
  id: string;
  source: 'minha_caderneta' | 'oncotrack';
  type: 'warning' | 'info' | 'critical';
  message: string;
  created_at: string;
}

interface VaccinationSummary {
  total_vaccines: number;
  up_to_date: number;
  pending: number;
  overdue: number;
  last_updated: string;
  clinical_alerts: ClinicalAlert[];
}
```

### 4. Fluxo Completo de Conexão

```text
1. Usuário clica "Conectar Minha Caderneta"
         │
         ▼
2. Redireciona para Minha Caderneta
   ?source=oncotrack
   &oncotrack_user_id=XXX
   &callback_url=https://quimio-companheiro.lovable.app/vaccination?connected=true
         │
         ▼
3. Minha Caderneta:
   - Exibe tela de consentimento
   - Cria registro em oncotrack_connections (status=pending_token)
   - Redireciona para callback_url
         │
         ▼
4. OncoTrack detecta ?connected=true
         │
         ▼
5. Chama Edge Function: complete-caderneta-connection
         │
         ▼
6. Edge Function (backend-to-backend):
   - Chama Minha Caderneta: /oncotrack-get-token
   - Minha Caderneta valida e retorna token
   - Salva em external_connections
         │
         ▼
7. Frontend limpa URL e exibe estado conectado
```

### 5. Componente de Alertas com Origem

```tsx
// VaccinationAlertsCard.tsx
const sourceLabels = {
  minha_caderneta: 'Minha Caderneta',
  oncotrack: 'OncoTrack'
};

{alerts.map(alert => (
  <div key={alert.id} className="flex items-start gap-3">
    <AlertIcon type={alert.type} />
    <div>
      <Badge variant="outline" className="text-xs mb-1">
        {sourceLabels[alert.source]}
      </Badge>
      <p className="text-sm">{alert.message}</p>
    </div>
  </div>
))}
```

---

## Navegação

**MobileMoreMenu.tsx:**
```typescript
const menuItems = [
  { path: "/health", icon: Activity, label: "Monitoramento de Saúde" },
  { path: "/vaccination", icon: Syringe, label: "Vacinação" }, // NOVO
  { path: "/timeline", icon: Calendar, label: "Timeline" },
  { path: "/profile", icon: User, label: "Perfil" },
];
```

---

## Traduções (i18n)

**pt-BR.json:**
```json
"vaccination": {
  "title": "Vacinação",
  "subtitle": "Integração com Minha Caderneta",
  "notConnected": {
    "title": "Conecte sua carteira de vacinação",
    "description": "Durante o tratamento oncológico, manter a vacinação em dia é essencial para sua segurança. Ao conectar sua Minha Caderneta, o OncoTrack poderá analisar seu histórico vacinal e gerar recomendações mais seguras.",
    "button": "Conectar Minha Caderneta"
  },
  "connected": {
    "status": "Minha Caderneta conectada",
    "lastUpdate": "Última atualização",
    "refresh": "Atualizar dados",
    "openButton": "Abrir Minha Caderneta",
    "disconnectButton": "Desconectar",
    "disconnectConfirm": "Tem certeza que deseja desconectar?"
  },
  "summary": {
    "title": "Resumo Vacinal",
    "total": "Total de vacinas",
    "upToDate": "Em dia",
    "pending": "Pendentes",
    "overdue": "Atrasadas"
  },
  "alerts": {
    "title": "Alertas Clínicos",
    "empty": "Nenhum alerta no momento",
    "source": {
      "minha_caderneta": "Minha Caderneta",
      "oncotrack": "OncoTrack"
    }
  },
  "errors": {
    "fetchFailed": "Erro ao carregar dados vacinais",
    "connectionFailed": "Erro ao conectar",
    "disconnectFailed": "Erro ao desconectar"
  }
}
```

---

## Segurança e Governança

| Aspecto | Implementação |
|---------|---------------|
| Token nunca na URL | Handshake B2B via Edge Function |
| Dados não persistidos | Apenas token, nunca vacinas |
| Origem dos alertas | Campo `source` explícito |
| Revogação | Botão desconectar chama B2B |
| Nomenclatura | `external_connections` sem acoplamento |
| Minimização | API retorna apenas resumo |

---

## Critérios de Aceite

- [ ] Tabela `external_connections` criada com RLS
- [ ] Edge Function `complete-caderneta-connection` funcional
- [ ] Edge Function `disconnect-caderneta` funcional
- [ ] Token obtido via handshake B2B (nunca na URL)
- [ ] Página `/vaccination` exibe estados corretos
- [ ] Alertas mostram origem (`source`) claramente
- [ ] Navegação mobile inclui "Vacinação"
- [ ] Traduções em PT-BR, EN, ES
- [ ] Nenhum dado vacinal persistido no banco OncoTrack

---

## Dependência Externa

Para que o handshake B2B funcione, a Minha Caderneta precisará:

1. Criar endpoint `/functions/v1/oncotrack-get-token`
   - Recebe: `{ oncotrack_user_id }`
   - Valida: existe conexão pendente para este user
   - Retorna: `{ connection_token }`
   - Atualiza status da conexão para `active`

Isso pode ser implementado na Fase 2.1 na Minha Caderneta, antes de testar o fluxo completo.

