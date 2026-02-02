

# Plano: Fluxo de Escolha de Papel para Login OAuth (com Ajustes Finos)

## Resumo

Implementar tela obrigatória de escolha de papel (Paciente ou Profissional de Saúde) no primeiro login OAuth (Google/Apple), com os ajustes de UX e segurança solicitados.

---

## 1. Novo Arquivo: src/pages/ChooseRole.tsx

Tela minimalista de escolha de papel:

```text
┌────────────────────────────────────────┐
│                                        │
│     Como você deseja usar o OncoTrack? │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  👤  Sou Paciente                │  │
│  │     Acompanhar meu tratamento    │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  🩺  Sou Profissional de Saúde   │  │
│  │     Acompanhar meus pacientes    │  │
│  │     (requer cadastro completo)   │  │  ← AJUSTE 1: Texto explicativo
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

### Ajuste 1 - Texto Explicativo para Médicos

Ao clicar "Profissional de Saúde", exibir claramente:

```typescript
// Antes de navegar para /doctor/register
toast({
  title: "Cadastro Profissional",
  description: "Você precisará concluir o cadastro com seus dados (CRM, especialidade) para acessar pacientes."
});
navigate('/doctor/register');
```

### Ajuste 2 - Idempotência no INSERT Patient

Usar `upsert` com `onConflict: 'ignore'` para garantir idempotência:

```typescript
const handleChoosePatient = async () => {
  setLoading(true);
  try {
    // INSERT com ON CONFLICT DO NOTHING (idempotência)
    const { error } = await supabase
      .from('user_roles')
      .upsert(
        { user_id: user.id, role: 'patient' },
        { onConflict: 'user_id,role', ignoreDuplicates: true }
      );

    if (error) throw error;
    
    // Atualizar estado local
    setUserRole('patient');
    navigate('/');
  } catch (error) {
    console.error('Error setting patient role:', error);
    toast({
      title: "Erro",
      description: "Não foi possível salvar sua escolha. Tente novamente.",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};
```

---

## 2. Modificar: src/hooks/useAuth.ts

### 2.1 Adicionar Estado de Role

```typescript
export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | 'admin' | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  // ... resto do código
```

Nota: `undefined` = ainda não verificado, `null` = verificado mas sem role

### 2.2 Adicionar Função loadUserRole

```typescript
const loadUserRole = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    
    // Converter tipo do banco para string tipada
    setUserRole(data?.role as 'patient' | 'doctor' | 'admin' | null);
  } catch (error) {
    console.error('Error loading user role:', error);
    setUserRole(null);
  }
};
```

### 2.3 Chamar loadUserRole após loadProfile

```typescript
const loadProfile = async (userId: string) => {
  try {
    // ... código existente de carregar/criar profile ...
    
    // Após carregar profile, verificar role
    await loadUserRole(userId);
  } catch (error) {
    console.error('Error loading profile:', error);
    // ...
  } finally {
    setLoading(false);
  }
};
```

### 2.4 Retornar userRole e setUserRole

```typescript
return {
  user,
  profile,
  userRole,      // NOVO
  setUserRole,   // NOVO - para atualizar após escolha em ChooseRole
  loading,
  updateProfile,
  loadProfile
};
```

---

## 3. Modificar: src/components/ProtectedRoute.tsx

### 3.1 Adicionar Prop skipRoleCheck

```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  skipRoleCheck?: boolean;
}

export const ProtectedRoute = ({ children, skipRoleCheck = false }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Não logado → tela de login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logado mas sem role definido → tela de escolha
  // (skipRoleCheck usado apenas em /choose-role para evitar loop)
  if (!skipRoleCheck && userRole === null) {
    return <Navigate to="/choose-role" replace />;
  }

  return <>{children}</>;
};
```

---

## 4. Modificar: src/App.tsx

### 4.1 Importar Nova Página

```typescript
import ChooseRole from "./pages/ChooseRole";
```

### 4.2 Adicionar Rota

```typescript
{/* Rota de escolha de papel (obrigatória para OAuth sem role) */}
<Route path="/choose-role" element={
  <ProtectedRoute skipRoleCheck>
    <ChooseRole />
  </ProtectedRoute>
} />
```

---

## 5. Política RLS para INSERT de Paciente

Já existe política que permite INSERT em `user_roles` apenas para admins. Precisamos adicionar política para usuários criarem seu próprio role de paciente:

```sql
-- Permitir usuário inserir seu próprio role 'patient' (apenas 1x)
CREATE POLICY "Users can set their own patient role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND role = 'patient'
  );
```

---

## 6. Fluxo Completo

```text
Usuario clica "Entrar com Google"
    │
    ▼
Google autentica
    │
    ▼
onAuthStateChange dispara
    │
    ▼
loadProfile() cria perfil (se novo)
    │
    ▼
loadUserRole() verifica user_roles
    │
    ├── Role existe ('patient') ───────────▶ Home (/)
    │
    ├── Role existe ('doctor') ────────────▶ Home (/) 
    │         └── DoctorProtectedRoute detecta e permite
    │
    └── Role NAO existe (null)
            │
            ▼
    ProtectedRoute redireciona para /choose-role
            │
            ├── Clica "Sou Paciente"
            │       │
            │       ▼
            │   UPSERT user_roles (com ON CONFLICT ignore)
            │       │
            │       ▼
            │   setUserRole('patient')
            │       │
            │       ▼
            │   navigate('/')
            │
            └── Clica "Sou Profissional de Saúde"
                    │
                    ▼
                Toast explicativo
                    │
                    ▼
                navigate('/doctor/register')
                    │
                    ▼
                Fluxo existente (trigger cria role 'doctor')
```

---

## 7. Ajuste 3 - Confirmação de Segurança Backend

### Verificações já implementadas:

| Camada | Proteção | Status |
|--------|----------|--------|
| RLS `has_role()` | Função SECURITY DEFINER | ✅ Existe |
| Trigger `add_doctor_role_on_professional_create` | Cria role doctor automaticamente | ✅ Existe com ON CONFLICT |
| `DoctorProtectedRoute` | Verifica role 'doctor' + healthcare_professionals | ✅ Existe |
| Políticas de dados de pacientes | `doctor_has_patient_access()` | ✅ Existe |

### Rotas médicas protegidas:

Todas as rotas `/doctor/*` (exceto `/doctor/register`) usam `DoctorProtectedRoute` que verifica:

1. `isDoctor` via `useDoctorAuth` → checa `user_roles.role = 'doctor'`
2. `doctorProfile` → checa `healthcare_professionals` existe

**Nenhuma rota médica depende apenas de frontend guard.** O RLS bloqueia queries no banco para usuários sem role 'doctor'.

---

## 8. Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/ChooseRole.tsx` | **CRIAR** - Tela de escolha de papel |
| `src/hooks/useAuth.ts` | **MODIFICAR** - Adicionar `userRole`, `loadUserRole`, `setUserRole` |
| `src/components/ProtectedRoute.tsx` | **MODIFICAR** - Verificar role, adicionar `skipRoleCheck` |
| `src/App.tsx` | **MODIFICAR** - Adicionar rota `/choose-role` |
| Nova migração SQL | **CRIAR** - Política RLS para INSERT 'patient' |

---

## 9. Critérios de Aceite

| Critério | Como Verificar |
|----------|----------------|
| Login Google funciona | OAuth retorna para app |
| Tela obrigatória se sem role | Novo usuário vê /choose-role |
| Após escolher, nunca mais aparece | userRole salvo, redirect direto |
| Médico → portal médico | Após registro, acesso a /doctor |
| Paciente → app paciente | Após escolha, acesso a / |
| Login email/senha não afetado | Funciona normalmente |
| Idempotência | Duplo clique não causa erro |
| Web + Capacitor | Funciona em todas plataformas |

---

## 10. Impacto

- **Zero breaking changes** para usuários existentes
- Login por email/senha com escolha de tipo continua funcionando
- OAuth users têm experiência limpa de escolha obrigatória
- Médicos seguem fluxo completo de registro profissional
- Pacientes entram direto no app após 1 clique
- Tela aparece apenas 1x (primeira vez)
- Dupla camada de segurança (Frontend + RLS)

