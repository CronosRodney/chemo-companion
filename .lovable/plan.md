

# Plano: Conectar Botões de Ação ao Domínio de Dados

## Diagnóstico Completo

### O que está funcionando
- RLS policies para médicos (INSERT/UPDATE/DELETE) já existem na migration `20260202041953`
- `TreatmentService.createTreatmentPlan` usa `targetPatientId` corretamente
- `TreatmentPlanDialog` passa `patientId` e valida retorno com `result?.id`
- `Treatment.tsx` passa `patientId` para o dialog

### Problema Real: Botões sem Handlers

Os botões em `Treatment.tsx` (linhas 265-277) estão **sem onClick**:

```text
┌─────────────────────────────────────────────────────────────────┐
│                 BOTÕES DE AÇÃO (MORTOS)                         │
├─────────────────────────────────────────────────────────────────┤
│  Ver Detalhes    → SEM onClick                                  │
│  Ver Ciclos      → SEM onClick                                  │
│  Gerenciar       → SEM onClick                                  │
│  Excluir         → NÃO EXISTE                                   │
│  Liberar Ciclo   → NÃO EXISTE na UI                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Solução Proposta

### 1. Criar Modais/Dialogs Necessários

| Componente | Função | Prioridade |
|------------|--------|------------|
| `TreatmentDetailDialog` | Visualizar detalhes completos do plano | Alta |
| `TreatmentCyclesDialog` | Visualizar/gerenciar ciclos do plano | Alta |
| `ReleaseCycleDialog` | Liberar ciclo para administração | Alta |
| `EditTreatmentPlanDialog` | Editar plano existente | Média |
| Confirmação de exclusão | Alert dialog para excluir plano | Média |

### 2. Conectar Botões em Treatment.tsx

```text
┌─────────────────────────────────────────────────────────────────┐
│                 BOTÕES APÓS CORREÇÃO                            │
├─────────────────────────────────────────────────────────────────┤
│  Ver Detalhes    → onClick={() => setDetailDialogPlan(plan)}    │
│  Ver Ciclos      → onClick={() => setCyclesDialogPlan(plan)}    │
│  Gerenciar       → onClick={() => setEditDialogPlan(plan)}      │
│  Excluir         → onClick={() => handleDeletePlan(plan.id)}    │
│  Liberar Ciclo   → onClick={() => setReleaseCycle(cycle)}       │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Adicionar Métodos no TreatmentService

```text
┌─────────────────────────────────────────────────────────────────┐
│              NOVOS MÉTODOS NO SERVICE                           │
├─────────────────────────────────────────────────────────────────┤
│  updateTreatmentPlan(planId, data)   → UPDATE treatment_plans   │
│  deleteTreatmentPlan(planId)         → DELETE treatment_plans   │
│  releaseCycle(cycleId, status)       → já existe, só conectar   │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Garantir Re-fetch Após Cada Ação

Todas as ações devem chamar `refetchTreatmentPlans()` após sucesso.

---

## Implementação Detalhada

### Arquivo: `src/pages/Treatment.tsx`

**Mudanças:**

1. Adicionar estados para controlar dialogs:
   - `selectedPlanForDetails` - plano para visualizar detalhes
   - `selectedPlanForCycles` - plano para visualizar ciclos
   - `selectedPlanForEdit` - plano para editar
   - `planToDelete` - plano para confirmar exclusão

2. Adicionar handlers:
   - `handleViewDetails(plan)` - abre dialog de detalhes
   - `handleViewCycles(plan)` - abre dialog de ciclos
   - `handleEditPlan(plan)` - abre dialog de edição (somente médico)
   - `handleDeletePlan(planId)` - confirma e exclui plano
   - `handleReleaseCycle(cycle)` - libera ciclo

3. Conectar botões aos handlers

4. Adicionar componentes de dialog no final do componente

### Arquivo: `src/services/treatmentService.ts`

**Novos métodos:**

```typescript
// Atualizar plano existente
static async updateTreatmentPlan(planId: string, data: Partial<TreatmentPlanData>) {
  const { data: result, error } = await supabase
    .from('treatment_plans')
    .update(data)
    .eq('id', planId)
    .select()
    .single();
  
  if (error) throw error;
  if (!result) throw new Error("Falha ao atualizar plano");
  return result;
}

// Excluir plano
static async deleteTreatmentPlan(planId: string) {
  // Primeiro exclui dependências (ciclos, drogas)
  await supabase.from('treatment_cycles').delete().eq('treatment_plan_id', planId);
  await supabase.from('treatment_drugs').delete().eq('treatment_plan_id', planId);
  
  const { error } = await supabase
    .from('treatment_plans')
    .delete()
    .eq('id', planId);
  
  if (error) throw error;
}
```

### Novos Componentes

| Arquivo | Descrição |
|---------|-----------|
| `src/components/TreatmentDetailDialog.tsx` | Modal com detalhes do plano (drogas, doses, cronograma) |
| `src/components/TreatmentCyclesDialog.tsx` | Modal com lista de ciclos e ação de liberar |
| `src/components/ReleaseCycleDialog.tsx` | Modal para liberar ciclo (escolher status, motivo) |

---

## Arquivos a Modificar

| Arquivo | Ação | Linhas Afetadas |
|---------|------|-----------------|
| `src/pages/Treatment.tsx` | Modificar | 27-50 (estados), 265-277 (botões), 718-723 (dialogs) |
| `src/services/treatmentService.ts` | Modificar | Adicionar updateTreatmentPlan, deleteTreatmentPlan |
| `src/components/TreatmentDetailDialog.tsx` | Criar | Novo arquivo |
| `src/components/TreatmentCyclesDialog.tsx` | Criar | Novo arquivo |
| `src/components/ReleaseCycleDialog.tsx` | Criar | Novo arquivo |

---

## Fluxo de Dados Após Correção

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO MÉDICO                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Médico clica "Novo Plano"                                   │
│  2. TreatmentPlanDialog abre                                    │
│  3. Médico preenche dados                                       │
│  4. TreatmentService.createTreatmentPlan(data, patientId)       │
│  5. Service usa user_id = patientId (não auth.uid())            │
│  6. RLS permite INSERT (doctor_has_patient_access)              │
│  7. Banco persiste plano                                        │
│  8. Dialog valida result.id                                     │
│  9. onSuccess() → refetchTreatmentPlans()                       │
│  10. UI atualiza para médico                                    │
│  11. Paciente vê mesmos dados (mesma tabela)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validação Esperada

| Teste | Resultado |
|-------|-----------|
| Médico clica "Novo Plano" | Modal abre |
| Médico preenche e confirma | Plano persiste, toast sucesso |
| Médico clica "Ver Detalhes" | Modal com detalhes abre |
| Médico clica "Ver Ciclos" | Modal com ciclos abre |
| Médico clica "Gerenciar" | Modal de edição abre |
| Médico clica "Excluir" | Confirmação, plano excluído |
| Paciente atualiza tela | Vê plano criado pelo médico |
| Paciente não vê botões de ação | Correto (somente visualização) |

---

## Resumo Técnico

A feature de tratamento possui a estrutura correta:
- RLS configurado
- Service usa patientId
- Dialog passa patientId

O problema é que **os botões não estão conectados a handlers**. A solução é:
1. Adicionar estados para controlar modais
2. Criar handlers para cada ação
3. Conectar botões aos handlers via onClick
4. Criar dialogs de visualização/edição
5. Garantir re-fetch após cada operação

