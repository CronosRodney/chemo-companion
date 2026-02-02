

# Plano Corrigido: Auditoria Final + Hardening para iOS / Android

## Resumo Executivo

Preparar o OncoTrack para publicacao na App Store e Google Play, garantindo compliance LGPD, seguranca de dados de saude, e prontidao para review, sem alterar layout ou funcionalidades existentes.

---

## Correcao Critica Aplicada

O metodo `supabase.auth.getClaims(token)` foi **removido** do plano. Todas as Edge Functions usarao exclusivamente:

```typescript
// Padrao correto - ja implementado em _shared/auth.ts
import { getUserFromRequest } from '../_shared/auth.ts';

const { userId, error: authError } = await getUserFromRequest(req);
if (authError || !userId) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

---

## Status Atual das Edge Functions

| Funcao | Auth | Rate Limit | Acao |
|--------|------|------------|------|
| `screenshot-medication` | OK | OK | Nenhuma |
| `user-backup` | OK (+ filtra por user.id) | Nao | Adicionar rate limit |
| `analyze-symptoms` | NAO | NAO | Adicionar auth + rate limit |
| `search-pharmacies` | NAO | NAO | Adicionar auth |

---

## 1. Navegacao Deterministica (WebView-Safe)

### Arquivos e Correcoes

| Arquivo | Linha | Atual | Correcao |
|---------|-------|-------|----------|
| `src/pages/Profile.tsx` | 44 | `window.history.back()` | `navigate('/')` |
| `src/pages/Timeline.tsx` | 347 | `navigate(-1)` | `navigate('/')` |
| `src/pages/Events.tsx` | 183 | `navigate(-1)` | `navigate('/')` |
| `src/pages/Health.tsx` | 113, 132 | `navigate(-1)` | `navigate('/')` |
| `src/pages/MedicationDetails.tsx` | 117 | `navigate(-1)` | `navigate('/medications')` |
| `src/pages/ManualMedicationEntry.tsx` | 138 | `navigate(-1)` | `navigate('/medications')` |
| `src/pages/Medications.tsx` | 217 | `navigate(-1)` | `navigate('/')` |
| `src/pages/Share.tsx` | 123 | `navigate(-1)` | `navigate('/profile')` |
| `src/pages/EditableProfile.tsx` | 133 | `navigate(-1)` | `navigate('/profile')` |
| `src/pages/Teleconsultation.tsx` | 130 | `navigate(-1)` | `navigate('/')` |
| `src/pages/QRScanner.tsx` | 350 | `navigate(-1)` | `navigate('/')` |
| `src/pages/ScanMed.tsx` | 374 | `navigate(-1)` | `navigate('/scanner')` |

---

## 2. Remocao de Vulnerabilidade: process.env no Frontend

### Arquivo: src/services/aiMedicationExtractor.ts

**Problema:** Usa `process.env.OPENAI_API_KEY` (linhas 22 e 110)

**Correcao:** Remover classe `AIMedicationExtractor` ou redirecionar para Edge Function `extract-medication-ai`

---

## 3. Paginas Legais (Bloqueante para Store)

### 3.1 Criar src/pages/PrivacyPolicy.tsx

Conteudo em PT-BR cobrindo:
- Identificacao do app
- Dados coletados (nome, email, dados de saude)
- Armazenamento seguro (Supabase/AWS)
- Compartilhamento apenas com medicos autorizados
- Direitos LGPD (acesso, correcao, exclusao, portabilidade)
- Disclaimer medico claro

### 3.2 Criar src/pages/TermsOfUse.tsx

Conteudo cobrindo:
- Descricao do servico
- Elegibilidade
- Limitacoes de responsabilidade
- Disclaimer: "NAO substitui orientacao medica profissional"

### 3.3 Atualizar App.tsx

Adicionar rotas:
```typescript
<Route path="/privacy-policy" element={<PrivacyPolicy />} />
<Route path="/terms-of-use" element={<TermsOfUse />} />
```

### 3.4 Atualizar Auth.tsx

Adicionar links clicaveis para as paginas legais no texto de consentimento.

---

## 4. Compliance Apple - Disclaimers de App de Saude

### 4.1 Home.tsx - Footer Discreto

Adicionar apos o card de Emergencia 24h:
```typescript
<p className="text-xs text-muted-foreground text-center px-4 mt-4">
  Este aplicativo auxilia no acompanhamento do tratamento e nao substitui orientacao medica profissional.
</p>
```

### 4.2 Onboarding.tsx - Step Adicional

Adicionar step informativo sobre limitacoes do app antes do ultimo step.

---

## 5. Seguranca - Edge Functions (CORRIGIDO)

### 5.1 analyze-symptoms/index.ts - Adicionar Auth + Rate Limit

```typescript
// Adicionar imports
import { getUserFromRequest } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimiter.ts';

// Apos CORS check, antes de processar:
const { userId, error: authError } = await getUserFromRequest(req);
if (authError || !userId) {
  return new Response(
    JSON.stringify({ error: 'Autenticacao necessaria' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Rate limit (10 req/min para chamadas OpenAI)
const rateLimitResult = checkRateLimit(userId, { maxRequests: 10, windowMs: 60000 });
if (!rateLimitResult.allowed) {
  const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: `Limite excedido. Tente em ${resetIn}s` }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 5.2 search-pharmacies/index.ts - Adicionar Auth

```typescript
// Adicionar import
import { getUserFromRequest } from '../_shared/auth.ts';

// Apos CORS check:
const { userId, error: authError } = await getUserFromRequest(req);
if (authError || !userId) {
  return new Response(
    JSON.stringify({ error: 'Autenticacao necessaria' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 5.3 user-backup/index.ts - Adicionar Rate Limit

A funcao JA tem auth implementada e JA filtra por `user.id` em todas as queries:
- Linha 56: `.eq('user_id', user.id)`
- Linha 57-61: Todas as queries usam `user.id`

Apenas adicionar rate limit:
```typescript
import { checkRateLimit } from '../_shared/rateLimiter.ts';

// Apos auth check:
const rateLimitResult = checkRateLimit(user.id, { maxRequests: 5, windowMs: 60000 });
if (!rateLimitResult.allowed) {
  return new Response(
    JSON.stringify({ error: 'Limite de backups excedido' }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 5.4 screenshot-medication - JA PROTEGIDO

Nenhuma acao necessaria - ja usa `getUserFromRequest` + `checkRateLimit`.

---

## 6. Capacitor - Preparacao

### 6.1 Atualizar capacitor.config.ts

```typescript
appName: 'OncoTrack', // era 'chemo-companion'
```

### 6.2 Assets Necessarios (criar posteriormente)

| Arquivo | Tamanho | Uso |
|---------|---------|-----|
| `public/icon-1024x1024.png` | 1024x1024 | App Store |
| `public/icon-512x512.png` | 512x512 | PWA/Android |
| `public/apple-touch-icon.png` | 180x180 | iOS Safari |
| `public/splash.png` | 2732x2732 | Splash screen |

---

## 7. Arquivos a Criar/Modificar

### Novos Arquivos
| Arquivo | Descricao |
|---------|-----------|
| `src/pages/PrivacyPolicy.tsx` | Politica de Privacidade LGPD |
| `src/pages/TermsOfUse.tsx` | Termos de Uso |

### Arquivos a Modificar
| Arquivo | Modificacao |
|---------|-------------|
| `src/App.tsx` | Adicionar rotas legais |
| `src/pages/Auth.tsx` | Links para politicas |
| `src/pages/Home.tsx` | Disclaimer footer |
| `src/pages/Onboarding.tsx` | Step de disclaimer |
| 12 paginas com navigate(-1) | Substituir por rotas fixas |
| `src/services/aiMedicationExtractor.ts` | Remover process.env |
| `supabase/functions/analyze-symptoms/index.ts` | Adicionar auth + rate limit |
| `supabase/functions/search-pharmacies/index.ts` | Adicionar auth |
| `supabase/functions/user-backup/index.ts` | Adicionar rate limit |
| `capacitor.config.ts` | Atualizar appName |

---

## 8. Acao Manual Pos-Deploy

### No Dashboard Supabase
1. **Ativar Leaked Password Protection**:
   - Authentication > Settings > Password protection
   - Habilitar "Check for leaked passwords"

---

## 9. Validacao de Seguranca user-backup

A funcao `user-backup` JA implementa corretamente a validacao:

```typescript
// Linha 36 - Obtem usuario autenticado
const { data: { user }, error: authError } = await supabase.auth.getUser();

// Linhas 56-61 - TODAS as queries filtram por user.id
supabase.from('profiles').select('*').eq('user_id', user.id)
supabase.from('events').select('*').eq('user_id', user.id)
supabase.from('user_medications').select('*').eq('user_id', user.id)
supabase.from('reminders').select('*').eq('user_id', user.id)
supabase.from('treatment_plans').select('*').eq('user_id', user.id)
supabase.from('user_stats').select('*').eq('user_id', user.id)
```

Nao ha como um usuario acessar dados de outro usuario - o `user.id` vem do token JWT validado.

---

## Impacto

- **Zero breaking changes** em funcionalidades
- **Zero alteracoes de layout**
- **Compliance LGPD** com documentacao legal
- **Apple Health App Guidelines** atendidas
- **Seguranca reforçada** com auth correta (getUser)
- **Navegacao estavel** em WebViews iOS/Android

