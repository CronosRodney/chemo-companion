

# Plano: Correção de Contexto Médico/Paciente e Edge Functions

## Diagnóstico Técnico

### Problema 1 - Edge Functions com Método Inexistente

As edge functions `accept-doctor-invite` e `reject-doctor-invite` usam:
```typescript
await userClient.auth.getClaims(token);
```

Este método **não existe** no SDK do Supabase. Isso causa erro 500 silencioso e o aceite falha.

**Solução:** Refatorar para usar o padrão correto `auth.getUser()` que já existe em `_shared/auth.ts`.

### Problema 2 - Upsert sem Constraint

A edge function tenta fazer upsert com:
```typescript
onConflict: 'patient_user_id,doctor_user_id'
```

Mas se não existir uma constraint UNIQUE nessas colunas, o upsert falhará.

**Solução:** Alterar para insert com verificação de existência prévia, ou criar constraint única.

### Problema 3 - Portal do Médico mostrando UI simplificada

O `PatientDetails.tsx` atual já é um painel clínico, mas:
- A aba Tratamento mostra apenas lista, sem ações de edição
- A aba Saúde está vazia com placeholder
- Falta indicação visual clara de que é contexto médico

**Solução:** Melhorar a UX do portal médico com:
- Badge indicando "Visualização Médica"
- Adicionar ações de edição nas abas permitidas
- Integrar dados reais de exames na aba Saúde

---

## Implementação Detalhada

### 1. Corrigir Edge Functions (Prioridade Alta)

**Arquivos:**
- `supabase/functions/accept-doctor-invite/index.ts`
- `supabase/functions/reject-doctor-invite/index.ts`

**Mudanças:**

1. Substituir `auth.getClaims()` por `auth.getUser()`
2. Adicionar verificação de existência antes do upsert
3. Buscar email do usuário via tabela `profiles` (pois `getUser()` retorna dados da tabela auth)

**Fluxo corrigido:**

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ACCEPT-DOCTOR-INVITE                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Validar Authorization header                                │
│  2. Chamar auth.getUser() (NÃO getClaims)                       │
│  3. Buscar email do usuário via profiles                        │
│  4. Validar que email == invite.patient_email                   │
│  5. Verificar se conexão já existe                              │
│  6. UPDATE connection_invites.status = 'accepted'               │
│  7. INSERT ou UPDATE patient_doctor_connections                 │
│  8. Retornar sucesso                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Adicionar Constraint Única (Banco de Dados)

**Migração SQL:**
```sql
ALTER TABLE patient_doctor_connections 
ADD CONSTRAINT unique_patient_doctor 
UNIQUE (patient_user_id, doctor_user_id);
```

Isso permitirá que o upsert funcione corretamente.

### 3. Melhorar Portal do Médico

**Arquivo:** `src/pages/doctor/PatientDetails.tsx`

**Mudanças:**
- Adicionar badge "Painel Clínico" no header
- Adicionar aba "Exames" funcional
- Integrar botões de ação na aba Tratamento (editar plano, liberar ciclo)
- Mostrar dados reais de wearables na aba Saúde

**Nova estrutura de abas:**

```text
┌──────────────────────────────────────────────────────────────────┐
│  🏥 Painel Clínico                              [Visualização]   │
├──────────────────────────────────────────────────────────────────┤
│  [Resumo] [Tratamento*] [Exames*] [Saúde] [Notas]                │
│                        * = editável                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Aba Tratamento:                                                 │
│  - Lista de planos com botão "Editar"                            │
│  - Botão "Liberar Próximo Ciclo"                                 │
│  - Histórico de ajustes de dose                                  │
│                                                                  │
│  Aba Exames:                                                     │
│  - Lista de exames laboratoriais do paciente                     │
│  - Botão "Adicionar Resultado"                                   │
│  - Gráficos de tendência                                         │
│                                                                  │
│  Aba Saúde:                                                      │
│  - Métricas de wearables (se conectados)                         │
│  - Alertas de saúde                                              │
│  - Sem edição (somente leitura)                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Ação | Prioridade |
|---------|------|------------|
| `supabase/functions/accept-doctor-invite/index.ts` | Modificar | Crítica |
| `supabase/functions/reject-doctor-invite/index.ts` | Modificar | Crítica |
| `src/pages/doctor/PatientDetails.tsx` | Modificar | Alta |
| Migração SQL (constraint única) | Criar | Alta |

---

## O que NÃO será alterado

| Item | Motivo |
|------|--------|
| `usePendingInvites.ts` | Query já filtra corretamente por `status = 'pending'` |
| `PendingInvitesNotification.tsx` | Componente funciona corretamente |
| `Home.tsx` | `MyDoctorsCard` já foi removido |
| `Profile.tsx` | Médico responsável já está implementado corretamente |
| `Treatment.tsx` | Badge do médico já está implementado |

---

## Sequência de Implementação

1. **Migração SQL**: Criar constraint única em `patient_doctor_connections`
2. **Edge Functions**: Corrigir `accept-doctor-invite` e `reject-doctor-invite`
3. **Portal Médico**: Melhorar `PatientDetails.tsx` com funcionalidades clínicas

---

## Verificação Pós-Implementação

| Teste | Resultado Esperado |
|-------|-------------------|
| Paciente clica "Aceitar" | Conexão criada com sucesso |
| Paciente atualiza Home | Solicitação desaparece |
| Médico abre portal | Painel clínico (não dashboard paciente) |
| Médico edita tratamento | Edição funciona |
| Paciente vê Tratamento | Badge do médico visível |
| Paciente vê Perfil | Bloco médico responsável visível |

