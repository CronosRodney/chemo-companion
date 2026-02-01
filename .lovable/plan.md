
# Plano: Modo Teste de Desenvolvimento via Edge Function (Versão Segura)

## Resumo das Correções de Segurança

### ✅ Ajuste 1: Trava Dura de Ambiente
- A Edge Function **falhará com 403** se `ENABLE_DEV_LOGIN !== 'true'`
- Sem essa variável configurada no Supabase, a função é inutilizável
- Produção nunca terá essa variável

### ✅ Ajuste 2: Sem Senha Reutilizável
- Usar `admin.generateLink({ type: 'magiclink' })` + `verifyOtp()`
- Nenhuma senha humana será criada
- Sessão gerada diretamente via token hash

---

## Arquitetura de Segurança

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Auth.tsx)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │ Botão "Paciente" │           │  Botão "Médico"  │            │
│  │     (Teste)      │           │     (Teste)      │            │
│  └────────┬─────────┘           └────────┬─────────┘            │
│           │                              │                       │
│           ▼                              ▼                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │     supabase.functions.invoke('dev-login', { role })        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               Edge Function: dev-login                           │
├─────────────────────────────────────────────────────────────────┤
│  🔒 TRAVA 1: ENABLE_DEV_LOGIN !== 'true' → 403 Forbidden         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  if (Deno.env.get('ENABLE_DEV_LOGIN') !== 'true') {         ││
│  │    return Response(403, 'Dev login disabled');              ││
│  │  }                                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  🔑 AUTENTICAÇÃO SEM SENHA:                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  1. admin.createUser({ email_confirm: true }) // se não existe│
│  │  2. admin.generateLink({ type: 'magiclink' })               ││
│  │  3. verifyOtp({ token_hash })                               ││
│  │  4. Retorna { access_token, refresh_token }                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementação Detalhada

### 1. Criar Secret: ENABLE_DEV_LOGIN

**Ação:** Adicionar secret no Supabase

| Secret | Valor DEV | Valor PROD |
|--------|-----------|------------|
| `ENABLE_DEV_LOGIN` | `true` | Não configurar |

### 2. Criar Edge Function `dev-login`

**Arquivo:** `supabase/functions/dev-login/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Emails de teste com domínio exclusivo
const TEST_ACCOUNTS = {
  patient: 'test-patient@oncotrack.dev',
  doctor: 'test-doctor@oncotrack.dev'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 🔒 TRAVA DURA: Só funciona se ENABLE_DEV_LOGIN === 'true'
  if (Deno.env.get('ENABLE_DEV_LOGIN') !== 'true') {
    console.error('[DEV-LOGIN] Blocked: ENABLE_DEV_LOGIN not enabled')
    return new Response(
      JSON.stringify({ error: 'Dev login is disabled in this environment' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { role } = await req.json()
    
    if (!role || !['patient', 'doctor'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Use "patient" or "doctor"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const email = TEST_ACCOUNTS[role as keyof typeof TEST_ACCOUNTS]
    console.log(`[DEV-LOGIN] Starting login for ${role}: ${email}`)

    // Cliente admin com service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Cliente regular para verifyOtp
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    // 1. Buscar ou criar usuário
    let userId: string
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      userId = existingUser.id
      console.log(`[DEV-LOGIN] User exists: ${userId}`)
    } else {
      // 🔑 Criar usuário SEM SENHA (email confirmado automaticamente)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role, is_test_account: true }
      })

      if (createError) throw createError
      userId = newUser.user.id
      console.log(`[DEV-LOGIN] User created: ${userId}`)
    }

    // 2. Garantir perfil existe
    if (role === 'patient') {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: userId,
          first_name: 'Paciente',
          last_name: 'Teste',
          email
        }, { onConflict: 'user_id' })
      
      if (profileError) console.error('[DEV-LOGIN] Profile error:', profileError)
    } else {
      const { error: professionalError } = await supabaseAdmin
        .from('healthcare_professionals')
        .upsert({
          user_id: userId,
          first_name: 'Dr.',
          last_name: 'Teste',
          specialty: 'Oncologia Clínica',
          is_verified: true
        }, { onConflict: 'user_id' })
      
      if (professionalError) console.error('[DEV-LOGIN] Professional error:', professionalError)
    }

    // 3. Garantir role existe
    const roleValue = role === 'doctor' ? 'doctor' : 'patient' // ou apenas 'doctor'
    if (role === 'doctor') {
      await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role: 'doctor' }, { onConflict: 'user_id,role' })
    }

    // 4. 🔑 Gerar sessão via magic link (SEM SENHA)
    const { data: magicLink, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email
    })

    if (linkError || !magicLink?.properties?.hashed_token) {
      throw new Error('Failed to generate magic link: ' + linkError?.message)
    }

    // 5. Verificar OTP para obter sessão
    const { data: session, error: verifyError } = await supabaseClient.auth.verifyOtp({
      token_hash: magicLink.properties.hashed_token,
      type: 'email'
    })

    if (verifyError || !session?.session) {
      throw new Error('Failed to verify OTP: ' + verifyError?.message)
    }

    console.log(`[DEV-LOGIN] Success: ${role} logged in as ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        user: session.user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[DEV-LOGIN] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 3. Atualizar config.toml

**Arquivo:** `supabase/config.toml`

Adicionar:
```toml
[functions.dev-login]
verify_jwt = false
```

### 4. Atualizar Frontend

**Arquivo:** `src/pages/Auth.tsx`

Substituir `handleQuickLogin`:

```typescript
const handleQuickLogin = async (type: 'patient' | 'doctor') => {
  setIsLoading(true);
  setMessage(null);
  
  try {
    const { data, error } = await supabase.functions.invoke('dev-login', {
      body: { role: type }
    });

    if (error) throw error;

    if (data?.access_token && data?.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });

      if (sessionError) throw sessionError;

      toast({
        title: "Login de teste!",
        description: type === 'doctor' ? "Entrando como médico..." : "Entrando como paciente...",
      });
      
      navigate(type === 'doctor' ? '/doctor' : '/');
    } else {
      throw new Error(data?.error || 'Falha no login de teste');
    }
  } catch (error: any) {
    console.error('[Quick Login Error]', error);
    setMessage({
      type: 'error',
      text: error.message || 'Erro no login de teste. Verifique se ENABLE_DEV_LOGIN está configurado.'
    });
  } finally {
    setIsLoading(false);
  }
};
```

Remover `TEST_ACCOUNTS` (não será mais necessário).

---

## Checklist de Segurança

| Item | Status |
|------|--------|
| Trava dura `ENABLE_DEV_LOGIN !== 'true'` | ✅ |
| Retorna 403 se não configurado | ✅ |
| Sem senha fixa/reutilizável | ✅ |
| Usa `generateLink` + `verifyOtp` | ✅ |
| Domínio exclusivo `@oncotrack.dev` | ✅ |
| Logging completo | ✅ |
| Produção segura (sem secret) | ✅ |

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| Secret `ENABLE_DEV_LOGIN` | Criar (valor: `true`) |
| `supabase/functions/dev-login/index.ts` | Criar |
| `supabase/config.toml` | Modificar |
| `src/pages/Auth.tsx` | Modificar |

---

## Resultado Esperado

1. ✅ 1 clique → Entra como paciente
2. ✅ 1 clique → Entra como médico
3. ✅ Sem erros de credenciais
4. ✅ Sem senhas reutilizáveis
5. ✅ Falha com 403 em produção
6. ✅ Fluxo de produção intocado
