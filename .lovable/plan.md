

# Plano: Correção da Navegação na Tela de Escolha de Papel

## Diagnóstico

Ao analisar o código, identifiquei a causa raiz do problema:

### Cenário de Bug

```text
Usuário clica "Sou Profissional de Saúde"
    │
    ▼
handleChooseDoctor() → navigate('/doctor/register')
    │
    ▼
ProtectedRoute (sem skipRoleCheck)
    │
    ├── userRole === null?
    │       │
    │       └── SIM → Navigate('/choose-role') 🔄 LOOP!
```

A rota `/doctor/register` está protegida com `ProtectedRoute` **sem** `skipRoleCheck`, então quando um usuário OAuth sem role definido tenta acessar, é imediatamente redirecionado de volta para `/choose-role`.

### Código Problemático (src/App.tsx, linhas 149-153)

```typescript
<Route path="/doctor/register" element={
  <ProtectedRoute>  // ← Falta skipRoleCheck
    <DoctorRegistration />
  </ProtectedRoute>
} />
```

---

## Solução

### 1. Adicionar `skipRoleCheck` na rota `/doctor/register`

**Arquivo:** `src/App.tsx` (linha 149-153)

```typescript
<Route path="/doctor/register" element={
  <ProtectedRoute skipRoleCheck>
    <DoctorRegistration />
  </ProtectedRoute>
} />
```

**Justificativa:** Esta rota é acessada diretamente da tela de escolha de papel, antes do usuário ter um role definido. O `skipRoleCheck` permite que o usuário acesse a página para completar seu cadastro profissional.

---

## Fluxo Corrigido

```text
OAuth Login (Google)
    │
    ▼
loadProfile + loadUserRole
    │
    ▼
userRole === null → /choose-role
    │
    ├── Clique "Sou Paciente"
    │       │
    │       ├── INSERT user_roles (patient)
    │       ├── setUserRole('patient')
    │       └── navigate('/') → ✅ Home
    │
    └── Clique "Sou Profissional de Saúde"
            │
            └── navigate('/doctor/register')
                    │
                    ▼
            ProtectedRoute (skipRoleCheck)
                    │
                    └── ✅ DoctorRegistration
                            │
                            ├── Preenche dados
                            ├── registerAsDoctor()
                            │       ├── Garante profile
                            │       ├── INSERT healthcare_professionals
                            │       └── Trigger → INSERT user_roles (doctor)
                            └── navigate('/doctor') → ✅ Dashboard
```

---

## Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionar `skipRoleCheck` na rota `/doctor/register` |

---

## Critérios de Aceite

- Clicar em "Sou Paciente" → vai para `/` (role criado)
- Clicar em "Sou Profissional de Saúde" → vai para `/doctor/register`
- Nenhum loop de redirecionamento
- Toast informativo pode aparecer, mas NÃO bloqueia navegação
- Fluxo completo de cadastro médico funciona

---

## Análise de Segurança

A adição de `skipRoleCheck` em `/doctor/register` é **segura** porque:

1. A rota ainda requer autenticação (usuário logado)
2. O role `doctor` só é criado via trigger após INSERT em `healthcare_professionals`
3. O INSERT em `healthcare_professionals` requer validação de dados profissionais
4. Não há escalação de privilégios - o usuário não ganha acesso a nada até completar o cadastro

