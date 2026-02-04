# OncoTrack - Logs de Debug da Integração Minha Caderneta

**Gerado em:** 2026-02-04 04:25 UTC

---

## 📋 RESUMO DO PROBLEMA

O OncoTrack está chamando o endpoint `oncotrack-get-token` do Minha Caderneta, mas recebendo erro **401 - "Missing authorization header"**.

---

## 🔴 ERRO PRINCIPAL

```
Failed to get token from Minha Caderneta: {"code":401,"message":"Missing authorization header"}
```

**Causa:** O endpoint `oncotrack-get-token` no Minha Caderneta está esperando um header `Authorization`, mas o OncoTrack **NÃO ENVIA** esse header (por design - é uma chamada B2B server-to-server).

---

## 📊 EDGE FUNCTION LOGS (complete-caderneta-connection)

### Logs mais recentes:

```
2026-02-04T04:23:14Z LOG shutdown
2026-02-04T04:23:14Z LOG shutdown
2026-02-04T04:22:56Z LOG shutdown
2026-02-04T04:22:56Z LOG shutdown
2026-02-04T04:21:59Z ERROR Failed to get token from Minha Caderneta: {"code":401,"message":"Missing authorization header"}
2026-02-04T04:21:59Z INFO Completing connection for user: 4152a7eb-5e5c-4035-bd3d-fef71a977f78
2026-02-04T04:21:59Z LOG booted (time: 37ms)
2026-02-04T04:21:59Z LOG booted (time: 22ms)
2026-02-04T04:21:42Z ERROR Failed to get token from Minha Caderneta: {"code":401,"message":"Missing authorization header"}
2026-02-04T04:21:41Z INFO Completing connection for user: 4152a7eb-5e5c-4035-bd3d-fef71a977f78
2026-02-04T04:21:41Z LOG booted (time: 28ms)
2026-02-04T04:21:41Z LOG booted (time: 28ms)
2026-02-04T04:19:49Z LOG shutdown
2026-02-04T04:19:48Z LOG shutdown
2026-02-04T04:18:35Z ERROR Failed to get token from Minha Caderneta: {"code":401,"message":"Missing authorization header"}
2026-02-04T04:18:34Z INFO Completing connection for user: 4152a7eb-5e5c-4035-bd3d-fef71a977f78
2026-02-04T04:18:34Z LOG booted (time: 22ms)
2026-02-04T04:18:33Z LOG booted (time: 22ms)
```

---

## 📡 HTTP REQUESTS (Analytics)

| Timestamp | Method | Status | Execution Time | URL |
|-----------|--------|--------|----------------|-----|
| 2026-02-04T04:21:59Z | POST | 400 | 297ms | /complete-caderneta-connection |
| 2026-02-04T04:21:59Z | OPTIONS | 200 | 106ms | /complete-caderneta-connection |
| 2026-02-04T04:21:42Z | POST | 400 | 600ms | /complete-caderneta-connection |
| 2026-02-04T04:21:41Z | OPTIONS | 200 | 122ms | /complete-caderneta-connection |
| 2026-02-04T04:18:35Z | POST | 400 | 1970ms | /complete-caderneta-connection |
| 2026-02-04T04:18:33Z | OPTIONS | 200 | 1454ms | /complete-caderneta-connection |

---

## 🔧 CÓDIGO ATUAL (OncoTrack - complete-caderneta-connection)

```typescript
// Linha 59-66 - Chamada ao Minha Caderneta
const tokenResponse = await fetch(`${CADERNETA_API_URL}/oncotrack-get-token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ oncotrack_user_id: user.id }),
});
```

**Observação:** O OncoTrack NÃO envia header `Authorization` porque é uma chamada B2B (server-to-server).

---

## ✅ SOLUÇÃO NECESSÁRIA NO MINHA CADERNETA

O endpoint `oncotrack-get-token` precisa ser configurado com `verify_jwt = false` no `supabase/config.toml`:

```toml
[functions.oncotrack-get-token]
verify_jwt = false
```

**E** o código do endpoint deve:
1. NÃO exigir header `Authorization`
2. Validar a requisição apenas pelo `oncotrack_user_id` no body
3. Buscar a conexão pendente na tabela de conexões

### Exemplo de implementação:

```typescript
// oncotrack-get-token/index.ts

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { oncotrack_user_id } = await req.json();

    if (!oncotrack_user_id) {
      return new Response(
        JSON.stringify({ error: 'oncotrack_user_id is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Buscar conexão pendente para este user_id
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: connection, error } = await supabaseAdmin
      .from('oncotrack_connections') // sua tabela de conexões
      .select('*')
      .eq('oncotrack_user_id', oncotrack_user_id)
      .eq('status', 'pending')
      .single();

    if (error || !connection) {
      return new Response(
        JSON.stringify({ error: 'No pending connection found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Ativar a conexão
    await supabaseAdmin
      .from('oncotrack_connections')
      .update({ status: 'active' })
      .eq('id', connection.id);

    return new Response(
      JSON.stringify({
        connection_token: connection.connection_token,
        metadata: { user_name: connection.user_name }
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
```

---

## 📌 FLUXO ESPERADO

```
1. Usuário clica "Conectar Minha Caderneta" no OncoTrack
   ↓
2. OncoTrack redireciona para:
   https://chronicle-my-health.lovable.app/connect?source=oncotrack&oncotrack_user_id=XXX&callback_url=https://quimio-companheiro.lovable.app/vaccination
   ↓
3. Minha Caderneta valida callback_url na allowlist ← ERRO "Solicitação Inválida" acontece aqui se URL não estiver na lista
   ↓
4. Usuário autoriza no Minha Caderneta
   ↓
5. Minha Caderneta salva conexão pendente na tabela com oncotrack_user_id
   ↓
6. Minha Caderneta redireciona de volta para callback_url
   ↓
7. OncoTrack chama POST /oncotrack-get-token com { oncotrack_user_id }
   ↓
8. Minha Caderneta retorna { connection_token } ← ERRO 401 acontece aqui se verify_jwt=true
   ↓
9. OncoTrack salva token em external_connections
   ↓
10. Conexão ativa! ✅
```

---

## 📝 CHECKLIST DE CORREÇÃO

### No Minha Caderneta:

- [ ] Adicionar `https://quimio-companheiro.lovable.app/vaccination` na allowlist de callback URLs
- [ ] Configurar `verify_jwt = false` para `oncotrack-get-token` no config.toml
- [ ] Implementar endpoint `oncotrack-get-token` que:
  - Aceita POST sem Authorization header
  - Recebe `{ oncotrack_user_id }` no body
  - Retorna `{ connection_token, metadata? }`
- [ ] Implementar endpoint `oncotrack-vaccination-summary` para retornar dados vacinais
- [ ] Implementar endpoint `oncotrack-disconnect` para revogar acesso

---

## 🔗 LINKS ÚTEIS

- **Logs da Edge Function:** https://supabase.com/dashboard/project/xpxsdlvicmlqpcaldyyz/functions/complete-caderneta-connection/logs
- **OncoTrack Preview:** https://quimio-companheiro.lovable.app/vaccination
- **Minha Caderneta:** https://chronicle-my-health.lovable.app

---

*Documento gerado automaticamente pelo Lovable AI*
