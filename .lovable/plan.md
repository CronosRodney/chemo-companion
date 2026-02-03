
# Plano: Correção do Estado de Role OAuth - Contexto Compartilhado

## Diagnóstico

### Problema Raiz Identificado

O hook `useAuth()` é instanciado **múltiplas vezes** em diferentes componentes:
- `ProtectedRoute.tsx` → instância própria
- `ChooseRole.tsx` → instância própria  
- `AppContext.tsx` → instância própria
- `Auth.tsx` → instância própria

Cada instância mantém seu próprio estado React (`useState`), então quando `ChooseRole` executa `setUserRole('patient')`, isso atualiza apenas a instância local - não afeta o estado nas outras instâncias.

### Fluxo Atual Problemático

```text
OAuth Login
    │
    ▼
ProtectedRoute (instância A)
    │ userRole = undefined → loading
    ▼
loadProfile() completa
    │ userRole = null (instância A)
    ▼
Redireciona para /choose-role
    │
    ▼
ChooseRole (instância B)
    │ userRole = undefined (estado próprio!)
    │
    ├── Clique "Sou Paciente"
    │       ├── INSERT user_roles OK
    │       └── setUserRole('patient') (instância B apenas)
    │
    └── navigate('/') 
            │
            ▼
    ProtectedRoute (instância A)
            │ userRole ainda é null (não foi atualizado!)
            ▼
    Redireciona de volta para /choose-role 🔄 LOOP
```

---

## Solução Proposta

### Arquitetura: Context Provider para Auth

Transformar `useAuth` em um **Context Provider** que compartilha estado único entre todos os componentes.

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useAuth.ts` | Criar `AuthProvider` e `useAuth` via Context |
| `src/App.tsx` | Envolver app com `AuthProvider` |

---

## Implementação Detalhada

### 1. Refatorar `src/hooks/useAuth.ts`

Transformar de hook simples para Context Provider:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Interface do Profile (existente)
export interface UserProfile {
  id?: string;
  user_id?: string;
  first_name: string;
  // ... demais campos existentes
}

// Interface do contexto de auth
interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  userRole: 'patient' | 'doctor' | 'admin' | null | undefined;
  loading: boolean;
  setUserRole: (role: 'patient' | 'doctor' | 'admin' | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
}

// Criar contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | 'admin' | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // ... toda a lógica existente do useAuth ...
  // loadUserRole, loadProfile, updateProfile, useEffects

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      userRole,
      loading,
      setUserRole,
      updateProfile,
      loadProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook que consome o contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 2. Atualizar `src/App.tsx`

Adicionar `AuthProvider` no topo da hierarquia (antes do `AppProvider`):

```typescript
import { AuthProvider } from './hooks/useAuth';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>  {/* NOVO: Envolve toda a app */}
          <AppProvider>
            <div className="relative">
              <Routes>
                {/* ... rotas existentes ... */}
              </Routes>
              <Navigation />
              <OfflineBanner />
            </div>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

---

## Fluxo Corrigido

```text
OAuth Login
    │
    ▼
AuthProvider (estado ÚNICO)
    │ userRole = undefined → loading
    ▼
loadProfile() + loadUserRole()
    │ userRole = null (estado compartilhado)
    ▼
ProtectedRoute (consome AuthContext)
    │ userRole === null
    ▼
Redireciona para /choose-role
    │
    ▼
ChooseRole (consome AuthContext)
    │
    ├── Clique "Sou Paciente"
    │       ├── INSERT user_roles OK
    │       └── setUserRole('patient') (mesmo contexto!)
    │
    └── navigate('/') 
            │
            ▼
    ProtectedRoute (consome AuthContext)
            │ userRole === 'patient' ✅
            ▼
    Renderiza Home
```

---

## Benefícios da Solução

| Aspecto | Melhoria |
|---------|----------|
| Estado único | Todos componentes leem/escrevem o mesmo estado |
| Sem duplicação | Uma só fonte de verdade para auth |
| Reatividade | Mudanças propagam imediatamente |
| Consistência | ProtectedRoute sempre tem o valor correto |
| Padrão React | Context é a solução recomendada para estado global |

---

## Critérios de Aceite

- Login Google (novo usuário) → sempre `/choose-role`
- Clicar "Sou Paciente" → role persiste e navega para `/`
- Não há loop de redirecionamento
- Clicar "Sou Profissional de Saúde" → navega para `/doctor/register`
- Estado de auth consistente em toda a aplicação
- Fluxo de email/senha não é afetado

---

## Notas Técnicas

1. **AuthProvider deve vir antes de AppProvider**: Porque AppProvider usa `useAuth()`
2. **AuthProvider deve estar dentro de BrowserRouter**: Porque pode usar hooks de navegação
3. **Manter interface pública idêntica**: O hook `useAuth()` continua retornando os mesmos campos
4. **Nenhuma mudança em chamadas existentes**: Componentes continuam usando `const { user, userRole } = useAuth()`
