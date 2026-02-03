

# Plano: Correção do FK Constraint no Cadastro de Médico OAuth

## Problema

Para usuários que entram via Google OAuth, o `profile` pode não existir quando o fluxo de cadastro médico é executado. O trigger `add_doctor_role_on_professional_create` dispara ao inserir em `healthcare_professionals`, tentando criar o registro em `user_roles` - que falha por FK constraint porque `profiles` é dependência.

## Solução

Modificar a função `registerAsDoctor` em `src/hooks/useDoctorAuth.ts` para:

1. Verificar se o profile existe antes de qualquer INSERT
2. Se não existir, criar o profile usando os dados do formulário
3. Só então inserir em `healthcare_professionals`

---

## Arquivo a Modificar

**`src/hooks/useDoctorAuth.ts`** - Função `registerAsDoctor` (linhas 77-106)

### Código Atual
```typescript
const registerAsDoctor = async (data: {
  first_name: string;
  last_name: string;
  crm: string;
  crm_uf: string;
  specialty: string;
}) => {
  if (!user) throw new Error('User not authenticated');

  const { data: newProfile, error } = await supabase
    .from('healthcare_professionals')
    .insert({...})
    .select()
    .single();

  if (error) throw error;
  // ...
};
```

### Código Corrigido
```typescript
const registerAsDoctor = async (data: {
  first_name: string;
  last_name: string;
  crm: string;
  crm_uf: string;
  specialty: string;
}) => {
  if (!user) throw new Error('User not authenticated');

  // 1️⃣ Garantir que o profile exista
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: user.email || ''
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw new Error('Não foi possível criar o perfil base');
    }
  }

  // 2️⃣ Inserir profissional de saúde
  const { data: doctorProfile, error } = await supabase
    .from('healthcare_professionals')
    .insert({
      user_id: user.id,
      first_name: data.first_name,
      last_name: data.last_name,
      crm: data.crm,
      crm_uf: data.crm_uf,
      specialty: data.specialty,
      is_verified: false
    })
    .select()
    .single();

  if (error) throw error;

  setDoctorProfile(doctorProfile);
  setIsDoctor(true);

  return doctorProfile;
};
```

---

## Fluxo Corrigido

```text
OAuth Login (Google)
     │
     ▼
registerAsDoctor()
     │
     ├── 1️⃣ SELECT profiles WHERE user_id = ?
     │       │
     │       ├── Profile existe → Continua
     │       │
     │       └── Profile não existe → INSERT profiles
     │
     ├── 2️⃣ INSERT healthcare_professionals
     │
     └── 3️⃣ Trigger → INSERT user_roles (role='doctor')
             │
             ▼
           ✅ SUCESSO (FK satisfeito)
```

---

## Por que esta correção funciona

| Aspecto | Explicação |
|---------|------------|
| **Resolve o FK** | O profile existe antes do trigger disparar |
| **Idempotente** | Usa `maybeSingle()` - não duplica profile existente |
| **Dados consistentes** | Usa os mesmos dados do formulário para profile e healthcare |
| **Não altera RLS** | Nenhuma mudança em políticas ou triggers |
| **Compatível com email/senha** | Se profile já existe, apenas continua |

---

## Critérios de Aceite

- Login Google → Cadastro médico → Sucesso (sem erro FK)
- Profile criado automaticamente se não existir
- Role 'doctor' atribuído pelo trigger existente
- Fluxo email/senha não é afetado
- Dados do formulário salvos corretamente em ambas as tabelas

