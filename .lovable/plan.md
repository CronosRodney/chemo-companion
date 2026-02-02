

# Plano: Exibir Médico Responsável no App do Paciente

## Resumo

Expor de forma clara e consistente o médico responsável nas telas de Tratamento e Perfil do paciente, usando como fonte de verdade a tabela `patient_doctor_connections` com `status = 'active'`.

## Arquitetura da Solução

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        Fonte de Dados                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  patient_doctor_connections                                          │
│  ├── patient_user_id (current user)                                  │
│  ├── doctor_user_id                                                  │
│  └── status = 'active'                                               │
│           │                                                          │
│           ▼                                                          │
│  healthcare_professionals                                            │
│  ├── first_name, last_name                                           │
│  ├── specialty                                                       │
│  └── crm, crm_uf                                                     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Componentes Atualizados                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. AppContext.tsx                                                   │
│     └── Adicionar: doctors, doctorsLoading (do useMyDoctors)         │
│                                                                       │
│  2. Treatment.tsx (Header)                                           │
│     ┌────────────────────────────────────────────────────────────┐   │
│     │  Tratamento                                                │   │
│     │  Acompanhe seus planos de tratamento oncológico            │   │
│     │                                                            │   │
│     │  🩺 Dr. João Silva                                         │   │
│     │     Oncologia Clínica · Médico responsável                 │   │
│     └────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  3. Profile.tsx (Novo bloco abaixo de "Clínica Atual")               │
│     ┌────────────────────────────────────────────────────────────┐   │
│     │  🩺 Médico Responsável                                     │   │
│     │                                                            │   │
│     │     Dr. João Silva                                         │   │
│     │     CRM 12345/SP                                           │   │
│     │     Oncologia Clínica                                      │   │
│     │     Status: Ativo                                          │   │
│     └────────────────────────────────────────────────────────────┘   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Implementação Detalhada

### 1. Estender AppContext

**Arquivo:** `src/contexts/AppContext.tsx`

**Mudanças:**
- Importar `useMyDoctors` hook
- Adicionar `doctors` e `doctorsLoading` ao contexto
- Expor no valor do provider

Isso permite que qualquer componente acesse os médicos conectados sem fazer novas chamadas à API.

### 2. Atualizar Tela de Tratamento

**Arquivo:** `src/pages/Treatment.tsx`

**Mudanças:**
- Consumir `doctors` e `doctorsLoading` do AppContext
- Filtrar apenas médicos com `status === 'active'`
- Exibir no header abaixo do subtítulo

**Design do componente:**
```text
┌───────────────────────────────────────────────────────┐
│  Tratamento                                           │
│  Acompanhe seus planos de tratamento oncológico       │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  🩺  Dr. João Silva                             │  │
│  │      Oncologia Clínica · Médico responsável     │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

**Comportamento:**
- Se múltiplos médicos ativos: exibir o primeiro (por data de conexão)
- Se nenhum médico ativo: não exibir nada (sem quebra de layout)
- Loading: skeleton inline discreto

### 3. Atualizar Tela de Perfil

**Arquivo:** `src/pages/Profile.tsx`

**Mudanças:**
- Consumir `doctors` e `doctorsLoading` do AppContext
- Adicionar novo Card "Médico Responsável" após "Clínica Atual"
- Estilo consistente com os outros cards

**Design do componente:**
```text
┌───────────────────────────────────────────────────────┐
│  🩺 Médico Responsável                                │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Dr. João Silva                                 │  │
│  │  CRM 12345/SP                                   │  │
│  │  Oncologia Clínica                              │  │
│  │  Status: ✓ Ativo                                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  (Se houver mais médicos, lista todos)                │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Fallback (sem médico ativo):**
```text
┌───────────────────────────────────────────────────────┐
│  🩺 Médico Responsável                                │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Nenhum médico vinculado                              │
│  Quando um médico solicitar acesso, você poderá       │
│  aceitar aqui.                                        │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/contexts/AppContext.tsx` | Modificar | Adicionar doctors e doctorsLoading do hook useMyDoctors |
| `src/pages/Treatment.tsx` | Modificar | Exibir médico responsável no header |
| `src/pages/Profile.tsx` | Modificar | Adicionar bloco "Médico Responsável" |

## O que NÃO será alterado

| Item | Motivo |
|------|--------|
| `useMyDoctors.ts` | Já implementado e funcional |
| `MyDoctorsCard.tsx` | Continua funcionando na Home |
| Tabelas do banco | Estrutura já adequada |
| RLS policies | Já protegem corretamente |

## Critérios de Aceite

- Header da tela Tratamento mostra o médico responsável (nome + especialidade)
- Tela Perfil exibe bloco "Médico Responsável" com CRM e status
- Apenas médicos com `status = 'active'` são exibidos
- Não quebra caso não exista médico ativo (exibe fallback elegante)
- Dados vêm sempre do backend (nunca hardcoded)

## Checklist de Segurança

| Requisito | Status |
|-----------|--------|
| Dados via patient_doctor_connections | Garantido |
| Apenas status = active exibidos | Garantido |
| Sem exposição de dados sensíveis | Garantido |
| Fallback para ausência de médico | Implementado |

