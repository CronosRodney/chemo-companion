
# Plano: Fluxo de Consentimento Explícito para Conexão Médico-Paciente

## Resumo Executivo

Transformar o fluxo atual (baseado em link/código externo) em um fluxo de **solicitação interna + aceite explícito dentro do app**, alinhado com boas práticas de LGPD e UX em contexto de saúde.

## Análise do Estado Atual

### O que já existe (e funciona bem)

| Componente | Status | Uso |
|-----------|--------|-----|
| `connection_invites` (tabela) | Funcional | Armazena solicitações |
| `patient_doctor_connections` (tabela) | Funcional | Conexões ativas/rejeitadas |
| `PendingInvitesNotification.tsx` | Funcional | Notificação dentro do app |
| `usePendingInvites.ts` | Funcional | Busca convites por email do paciente |
| RLS policies | Configuradas | Protegem os dados |
| `doctor_has_patient_access()` | Funcional | Valida acesso apenas para status=active |

### O que precisa mudar

| Componente | Mudança |
|-----------|---------|
| `InvitePatient.tsx` | Simplificar: remover geração de link/código visível |
| `AcceptInvite.tsx` | Manter apenas como redirecionador para o app |
| UX médico | Feedback de "Solicitação enviada" sem expor código |
| Documentação | Atualizar "Como funciona?" na tela do médico |

## Fluxo Proposto

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NOVO FLUXO DE CONSENTIMENTO                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. MÉDICO SOLICITA ACESSO                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Tela: /doctor/invite                                                   │    │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │    │
│  │  │  Email do paciente: [________________]                            │  │    │
│  │  │  [    Solicitar Acesso    ]                                       │  │    │
│  │  └───────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                         │    │
│  │  Resultado:                                                             │    │
│  │  - Cria registro em connection_invites (status=pending)                 │    │
│  │  - Exibe confirmação: "Solicitação enviada!"                            │    │
│  │  - NÃO exibe código/link (consentimento não ocorre aqui)                │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                 ↓                                               │
│                                                                                 │
│  2. PACIENTE VÊ NOTIFICAÇÃO NO APP                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Tela: / (Home) - Componente PendingInvitesNotification                 │    │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │    │
│  │  │  🔔 Solicitação de Acesso                    [Pendente]           │  │    │
│  │  │  ┌─────────────────────────────────────────────────────────────┐  │  │    │
│  │  │  │  🩺 Dr. João Silva                                          │  │  │    │
│  │  │  │     Oncologia Clínica                                       │  │  │    │
│  │  │  │     CRM 12345/SP                                            │  │  │    │
│  │  │  └─────────────────────────────────────────────────────────────┘  │  │    │
│  │  │  🛡️ Deseja acompanhar seu tratamento...                          │  │    │
│  │  │  ┌────────────┐  ┌────────────┐                                   │  │    │
│  │  │  │  ❌ Recusar │  │ ✅ Aceitar │                                   │  │    │
│  │  │  └────────────┘  └────────────┘                                   │  │    │
│  │  └───────────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                 ↓                                               │
│                                                                                 │
│  3. RESULTADO                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Se ACEITA:                                                             │    │
│  │  - patient_doctor_connections.status = 'active'                         │    │
│  │  - connection_invites.status = 'accepted'                               │    │
│  │  - Médico pode ver dados do paciente                                    │    │
│  │                                                                         │    │
│  │  Se RECUSA:                                                             │    │
│  │  - patient_doctor_connections.status = 'rejected'                       │    │
│  │  - connection_invites.status = 'rejected'                               │    │
│  │  - Histórico salvo (evita spam)                                         │    │
│  │  - Médico NÃO vê o paciente                                             │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Implementação Detalhada

### 1. Atualizar InvitePatient.tsx

**Mudanças principais:**
- Após criar o convite, exibir apenas "Solicitação enviada com sucesso"
- Remover a exibição do código/link
- Remover botões "Copiar Link" e "Compartilhar"
- Manter link apenas como opção secundária (ex: "Enviar link opcional por WhatsApp")

**Nova UX após solicitar:**
```text
┌────────────────────────────────────────┐
│        ✅ Solicitação Enviada!         │
│                                        │
│  O paciente receberá uma notificação   │
│  no app OncoTrack para aceitar ou      │
│  recusar a conexão.                    │
│                                        │
│  Email: paciente@email.com             │
│                                        │
│  ────────────────────────────────────  │
│                                        │
│  Próximos passos:                      │
│  1. Paciente abre o app                │
│  2. Vê a solicitação na tela inicial   │
│  3. Aceita ou recusa conscientemente   │
│                                        │
│  ────────────────────────────────────  │
│                                        │
│  [Opcional: Enviar link por WhatsApp]  │
│                                        │
│       [ Nova Solicitação ]             │
└────────────────────────────────────────┘
```

### 2. Atualizar documentação "Como funciona?"

**Antes (link-based):**
1. Cria convite com email
2. Compartilha link com paciente
3. Paciente aceita no app
4. Médico visualiza dados

**Depois (consent-based):**
1. Médico solicita acesso informando o email
2. Paciente vê notificação ao abrir o app
3. Paciente aceita ou recusa conscientemente
4. Conexão estabelecida apenas após aceite

### 3. Manter AcceptInvite.tsx como fallback

- Rota `/accept-invite/:code` continua existindo
- Funciona como atalho para abrir o app
- Decisão final sempre dentro do app (já implementado corretamente)
- Link é facilitador, não decisor

### 4. Opcional: Notificação por email

**Escopo futuro** (não nesta iteração):
- Enviar email informativo quando médico solicita acesso
- Email contém: nome do médico, CRM, especialidade
- Email NÃO contém botão de aceitar (apenas "Abra o app")

## Arquivos a Modificar

| Arquivo | Ação | Prioridade |
|---------|------|------------|
| `src/pages/doctor/InvitePatient.tsx` | Modificar | Alta |
| `src/components/PendingInvitesNotification.tsx` | Ajustar textos (opcional) | Baixa |
| `src/pages/AcceptInvite.tsx` | Manter como está | Nenhuma |

## O que NÃO será alterado

| Item | Motivo |
|------|--------|
| Tabelas do banco | Estrutura já adequada |
| RLS policies | Já protegem corretamente |
| `doctor_has_patient_access()` | Só libera para status=active |
| `usePendingInvites.ts` | Hook já funciona perfeitamente |
| Histórico de recusas | Já implementado |

## Checklist de Segurança e LGPD

| Requisito | Status |
|-----------|--------|
| Consentimento explícito dentro do app | Será implementado |
| Médico só acessa após aceite | Já garantido por RLS |
| Histórico de recusas mantido | Já implementado |
| Link não é decisor | Será ajustado |
| Fluxo rastreável | Já implementado |
| Paciente pode revogar a qualquer momento | Já implementado (MyDoctorsCard) |

## Resultado Esperado

1. Médico solicita acesso informando email
2. Feedback: "Solicitação enviada!"
3. Paciente abre o app e vê notificação clara
4. Paciente aceita/recusa conscientemente dentro do app
5. Link existe apenas como atalho opcional
6. Fluxo de produção seguro e rastreável
