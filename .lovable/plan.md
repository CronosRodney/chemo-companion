
# Plano: Corrigir Fluxo de Cadastro do Médico

## Problema Atual

O botão "Médico" na tela de login leva para `/doctor/register`, mas essa página **exige que o usuário já esteja logado**. Isso cria um loop onde:

1. Médico clica "Médico" → vai para `/doctor/register`
2. Página detecta que não está logado → redireciona para `/auth`
3. Médico fica confuso sem saber o que fazer

## Solução Proposta

Modificar a página `DoctorRegistration.tsx` para permitir que médicos **criem conta E se registrem** em um único fluxo.

### Mudanças Técnicas

**Arquivo: `src/pages/doctor/DoctorRegistration.tsx`**

Adicionar duas etapas no formulário:

1. **Etapa 1 (se não logado)**: Criar conta
   - Email
   - Senha
   - Nome completo

2. **Etapa 2 (após login)**: Dados profissionais
   - CRM e UF
   - Especialidade

### Lógica do Fluxo

```
Usuário acessa /doctor/register
       │
       ▼
   Está logado?
       │
   ┌───┴───┐
   │       │
  SIM     NÃO
   │       │
   ▼       ▼
Mostrar   Mostrar
Etapa 2   Etapa 1
(dados    (criar
 CRM)     conta)
   │       │
   │       ▼
   │    Cria conta
   │    (Supabase Auth)
   │       │
   │       ▼
   │    Login automático
   │       │
   └───────┤
           ▼
    Preenche dados CRM
           │
           ▼
    Salva em healthcare_professionals
           │
           ▼
    Trigger adiciona role 'doctor'
           │
           ▼
    Redireciona para /doctor
```

### Componente Atualizado

O formulário terá:
- **Estado `step`**: 1 (criar conta) ou 2 (dados profissionais)
- **Se `user` existe**: Pula direto para step 2
- **Se `user` não existe**: Mostra formulário de criação de conta

### Campos do Formulário

**Step 1 - Criar Conta:**
- Email (obrigatório)
- Senha (mínimo 6 caracteres)
- Confirmar senha

**Step 2 - Dados Profissionais:**
- Nome (obrigatório)
- Sobrenome (obrigatório)
- CRM (obrigatório)
- UF do CRM (obrigatório)
- Especialidade (obrigatório)

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/doctor/DoctorRegistration.tsx` | Adicionar step 1 com criação de conta, usar stepper visual |

### Resultado Esperado

1. Médico clica "Médico" na tela de login
2. Vê formulário para criar conta (email/senha)
3. Cria conta e faz login automaticamente
4. Vê formulário para dados profissionais (CRM)
5. Completa cadastro e acessa dashboard médico
