

# Plano: Unificar Fluxo de Cadastro (Médico vs Paciente)

## Problema Atual

O fluxo está confuso:
- Na aba "Criar Conta", o usuário preenche nome/email/senha sem saber se é cadastro de paciente
- O botão "Médico" está embaixo do botão "Entrar" (aba de login), o que não faz sentido
- Médico é levado para outra página separada para criar conta

## Novo Fluxo Proposto

Na aba **"Criar Conta"**, ANTES de mostrar os campos de email/senha:

1. **Primeiro**: Mostrar opção de escolha do tipo de usuário
   - Botão "Sou Paciente" 
   - Botão "Sou Profissional de Saúde"

2. **Se escolher Paciente**: 
   - Mostrar formulário simples (Nome, Email, Senha)
   - Criar conta de paciente

3. **Se escolher Médico**: 
   - Mostrar formulário completo (Nome, Sobrenome, Email, Senha, CRM, UF, Especialidade)
   - Criar conta + perfil de médico em um único passo

## Mudanças Visuais

### Estado Inicial da aba "Criar Conta"
```
┌─────────────────────────────────────┐
│     Quem é você?                    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  👤 Sou Paciente              │  │
│  │  Acompanhe seu tratamento     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  🩺 Sou Profissional de Saúde │  │
│  │  Monitore seus pacientes      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Após escolher "Paciente"
```
┌─────────────────────────────────────┐
│  ← Voltar                           │
│                                     │
│  Cadastro de Paciente               │
│                                     │
│  Nome: [________________]           │
│  Email: [________________]          │
│  Senha: [________________]          │
│                                     │
│  [    Criar Conta    ]              │
└─────────────────────────────────────┘
```

### Após escolher "Médico"
```
┌─────────────────────────────────────┐
│  ← Voltar                           │
│                                     │
│  Cadastro de Profissional           │
│                                     │
│  Nome: [________] Sobrenome: [____] │
│  Email: [________________]          │
│  Senha: [________________]          │
│  CRM: [________] UF: [___]          │
│  Especialidade: [▼ Selecione]       │
│                                     │
│  [    Cadastrar    ]                │
└─────────────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Auth.tsx` | Adicionar estado `userType` (null, 'patient', 'doctor') e lógica condicional na aba "Criar Conta". Remover botão "Médico" da aba de login. Integrar campos de CRM/especialidade. |
| `src/pages/doctor/DoctorRegistration.tsx` | Pode ser removido ou mantido como fallback para URL direta |

## Detalhes Técnicos

### Novo estado no Auth.tsx
```typescript
const [userType, setUserType] = useState<'patient' | 'doctor' | null>(null);

// Campos adicionais para médico
const [doctorData, setDoctorData] = useState({
  lastName: '',
  crm: '',
  crm_uf: '',
  specialty: ''
});
```

### Lógica de cadastro
- Se `userType === 'patient'`: Usa `supabase.auth.signUp` normal
- Se `userType === 'doctor'`: Usa `supabase.auth.signUp` + insere em `healthcare_professionals`

### Fluxo após criar conta de médico
1. Cria conta no Supabase Auth
2. Insere dados em `healthcare_professionals` 
3. Trigger existente adiciona role `doctor`
4. Redireciona para `/doctor`

## Resultado Esperado

- Usuário escolhe claramente se é paciente ou médico ANTES de preencher dados
- Tudo acontece na mesma página, sem redirecionamentos confusos
- Experiência mais intuitiva e profissional
- Botão "Médico" removido da aba de login (não faz sentido lá)

