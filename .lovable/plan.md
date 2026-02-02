

# Plano: Correção do Listener treatment_cycles

## Problema Identificado
O listener de `treatment_cycles` no `AppContext.tsx` está sem filtro, escutando mudanças da tabela inteira. Isso causa:
- **Performance**: Processamento desnecessário de eventos de outros usuários
- **Isolamento**: Notificações cruzadas entre pacientes (mesmo que RLS bloqueie os dados)

## Solução Proposta

### Abordagem Recomendada
Como `treatment_cycles` não tem `user_id` direto (apenas `treatment_plan_id`), a melhor abordagem é:

1. **Remover o listener separado de `treatment_cycles`**
2. **Confiar no listener de `treatment_plans`** que já está filtrado
3. **Recarregar planos completos** (incluindo cycles) quando houver mudança

### Alternativa (mais complexa)
Criar uma lista de `treatment_plan_ids` do usuário e filtrar dinamicamente, mas isso adiciona complexidade desnecessária.

---

## Implementação

### Arquivo: `src/contexts/AppContext.tsx`

**Mudança**: Remover o listener separado de `treatment_cycles` e manter apenas o de `treatment_plans`

```typescript
// REMOVER este bloco (linhas 357-372):
const treatmentCyclesChannel = supabase
  .channel('treatment-cycles-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'treatment_cycles'
    },
    () => {
      console.log('Treatment cycles changed, reloading plans...');
      loadTreatmentPlans();
    }
  )
  .subscribe();

// REMOVER do cleanup (linha 380):
supabase.removeChannel(treatmentCyclesChannel);
```

**Justificativa**: 
- O `loadTreatmentPlans()` já carrega cycles junto com os planos (via join)
- Quando médico altera um cycle, o RLS já filtra corretamente no SELECT
- O paciente pode fazer polling ou refresh manual se necessário para cycles específicos

---

## Consideração Alternativa (Opcional)

Se for crítico ter realtime em cycles, podemos implementar um listener **filtrado por treatment_plan_ids conhecidos**:

```typescript
// Buscar IDs dos planos do usuário primeiro
const planIds = treatmentPlans.map(p => p.id);

// Criar listener dinâmico (mais complexo de gerenciar)
if (planIds.length > 0) {
  // Supabase não suporta IN() em realtime filters facilmente
  // Seria necessário criar um listener por plano ou usar workaround
}
```

Esta abordagem é mais complexa e não recomendada para MVP.

---

## Resumo das Mudanças

| Arquivo | Ação |
|---------|------|
| `src/contexts/AppContext.tsx` | Remover listener de `treatment_cycles` (linhas 357-372) |
| `src/contexts/AppContext.tsx` | Remover cleanup do channel (linha 380) |

## Impacto

- **Zero breaking changes** - funcionalidade existente mantida
- **Melhoria de performance** - sem subscriptions desnecessárias
- **Isolamento garantido** - apenas dados do usuário logado

## Pontos já Validados (Sem Mudança Necessária)

1. ✅ **DELETE em notas clínicas**: Apenas médico autor pode deletar
2. ✅ **Edge Function perfil**: Validação segura via `auth.uid()` do JWT
3. ✅ **Listener treatment_plans**: Já filtrado por `user_id`

