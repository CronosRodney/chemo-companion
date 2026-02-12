

# Sincronizacao Real: Vaccination + Minha Caderneta

## Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/sync-caderneta-vaccines/index.ts` | Criar |
| `supabase/config.toml` | Adicionar entrada com `verify_jwt = true` |
| `src/hooks/useExternalConnections.ts` | Alterar `refreshVaccinationData` |

## 1. Criar Edge Function `sync-caderneta-vaccines`

Fluxo:
1. Gateway Supabase valida JWT (`verify_jwt = true`)
2. Extrair usuario via `supabase.auth.getUser()` usando client autenticado
3. Buscar `external_connections` via client autenticado (RLS, sem service role)
4. Se nao existir conexao ativa: retornar 404
5. Extrair `connection_token`, fazer fetch B2B para `oncotrack-get-vaccines`
6. Validar resposta: se status != 200 ou formato invalido, retornar erro
7. Mapear resposta para formato `VaccinationSummary` com fallback seguro
8. Atualizar `last_sync_at`
9. Retornar JSON ao frontend

Seguranca:
- Client autenticado com header do usuario (sem service role)
- Token B2B nunca exposto ao frontend
- Resposta externa validada antes de retornar

## 2. Atualizar `config.toml`

```toml
[functions.sync-caderneta-vaccines]
verify_jwt = true
```

## 3. Atualizar hook `useExternalConnections`

- `refreshVaccinationData` passa a chamar `supabase.functions.invoke('sync-caderneta-vaccines')`
- Remover fetch direto para `CADERNETA_API_URL` e atualizacao manual de `last_sync_at` do hook
- Constante `CADERNETA_API_URL` removida do hook (fica apenas no backend)
- Interface de retorno (`VaccinationSummary`) mantida identica

## Sem alteracoes

- `VaccinationSummaryCard.tsx`
- `VaccinationAlertsCard.tsx`
- `Vaccination.tsx`
- Tabela `external_connections`

