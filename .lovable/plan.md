

# Plano: Fluxo Completo de Vínculo Médico ↔ Paciente

## Análise do Estado Atual

O sistema já possui uma boa base implementada:

| Componente | Status | Observação |
|------------|--------|------------|
| Tabela `patient_doctor_connections` | Existe | status: pending/active |
| Tabela `connection_invites` | Existe | Para convites com código |
| Médico cria convite | Funciona | Via `/doctor/invite` |
| Paciente aceita via link | Funciona | Via `/accept-invite/:code` |
| RLS `doctor_has_patient_access()` | Funciona | Valida status = active |
| Lista de pacientes do médico | Funciona | Filtra por status = active |
| Paciente vê médicos conectados | Funciona | Via `MyDoctorsCard` |

### Lacunas Identificadas

1. **Paciente não é notificado de solicitações pendentes** (só funciona via link direto)
2. **Não há opção de recusar** convite diretamente no app
3. **Validação de acesso via URL** precisa verificar vínculo aprovado
4. **Status `rejected`** existe mas não está sendo usado

---

## Mudanças Necessárias

### 1. Notificação de Convites Pendentes na Home do Paciente

**Arquivo:** `src/pages/Home.tsx`

Adicionar componente que:
- Busca `connection_invites` onde `patient_email = user.email` e `status = pending`
- OU busca `patient_doctor_connections` onde `status = pending`
- Mostra card de notificação: "Dr. X quer acompanhar seu tratamento"
- Botões: Aceitar / Recusar

### 2. Novo Hook: `usePendingInvites`

**Arquivo:** `src/hooks/usePendingInvites.ts`

```typescript
export const usePendingInvites = () => {
  // Busca convites pendentes baseado no email do usuário
  // Retorna lista de convites com dados do médico
  // Funções: acceptInvite(), rejectInvite()
}
```

### 3. Componente de Notificação

**Arquivo:** `src/components/PendingInvitesNotification.tsx`

Visual:
```
┌─────────────────────────────────────────────┐
│ 🔔 Solicitação de Acesso                    │
│                                             │
│ Dr. João Silva (Oncologia)                  │
│ CRM 12345/SP                                │
│                                             │
│ Deseja acompanhar seu tratamento            │
│                                             │
│  [ Recusar ]  [ ✓ Aceitar ]                 │
└─────────────────────────────────────────────┘
```

### 4. Validação de Acesso no PatientDetails

**Arquivo:** `src/pages/doctor/PatientDetails.tsx`

Antes de carregar dados, verificar se existe vínculo ativo:
```typescript
// Verificar vínculo antes de carregar dados
const { data: connection } = await supabase
  .from('patient_doctor_connections')
  .select('id')
  .eq('doctor_user_id', user.id)
  .eq('patient_user_id', patientId)
  .eq('status', 'active')
  .single();

if (!connection) {
  // Redirecionar para lista com mensagem de erro
}
```

### 5. Atualizar AcceptInvite para Suportar Recusa

**Arquivo:** `src/pages/AcceptInvite.tsx`

O botão "Recusar" atualmente só navega para home. Deve:
- Atualizar `connection_invites.status = 'rejected'`
- Criar registro em `patient_doctor_connections` com `status = 'rejected'`

---

## Diagrama do Fluxo

```text
MÉDICO                                    PACIENTE
   │                                          │
   │  Cria convite com email                  │
   │  ─────────────────────────────►          │
   │                                          │
   │  connection_invite criado                │
   │  status = pending                        │
   │                                          │
   │                                          │  Login no app
   │                                          │  ◄───────────
   │                                          │
   │                                          │  Vê notificação:
   │                                          │  "Dr. X solicita acesso"
   │                                          │
   │                              ┌───────────┴───────────┐
   │                              │                       │
   │                          ACEITAR                 RECUSAR
   │                              │                       │
   │                              ▼                       ▼
   │                     Cria conexão              Atualiza invite
   │                     status=active             status=rejected
   │                              │                       │
   │  ◄───────────────────────────┘                       │
   │                                                      │
   │  Paciente aparece na lista                           │
   │  Pode acessar dashboard                              │
   │                                                      │
   ▼                                                      ▼
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/usePendingInvites.ts` | Criar | Hook para buscar/gerenciar convites pendentes |
| `src/components/PendingInvitesNotification.tsx` | Criar | Card de notificação na Home |
| `src/pages/Home.tsx` | Modificar | Adicionar componente de notificação |
| `src/pages/AcceptInvite.tsx` | Modificar | Implementar recusa real |
| `src/pages/doctor/PatientDetails.tsx` | Modificar | Adicionar validação de vínculo |
| `src/hooks/useMyDoctors.ts` | Modificar | Incluir convites pendentes na listagem |

---

## Segurança: Validações RLS

As políticas RLS já existentes são suficientes:

```sql
-- Já existe: Médico só acessa pacientes com conexão ativa
CREATE FUNCTION doctor_has_patient_access(_doctor_id, _patient_id)
  RETURNS boolean AS $$
    SELECT EXISTS (
      SELECT 1 FROM patient_doctor_connections
      WHERE doctor_user_id = _doctor_id
        AND patient_user_id = _patient_id
        AND status = 'active'  -- <-- Só conexões ativas!
    )
  $$;
```

Todas as tabelas sensíveis (profiles, treatment_plans, user_events, wearable_metrics) já usam esta função nas políticas de SELECT para médicos.

---

## Resultado Esperado

1. Médico sem pacientes vê estado vazio + botão "Convidar Paciente"
2. Médico com pacientes vê lista e pode acessar detalhes
3. Paciente recebe notificação visual na Home sobre solicitações pendentes
4. Paciente pode Aceitar ou Recusar diretamente
5. Médico só acessa dashboard após aceite do paciente
6. Acesso direto via URL é bloqueado se não houver vínculo ativo
7. Histórico de recusas fica registrado (evita spam)

---

## Fora do Escopo (conforme solicitado)

- Revogação de acesso (já existe parcialmente via `disconnectDoctor`)
- Logs médicos detalhados
- Permissões granulares por tipo de dado

