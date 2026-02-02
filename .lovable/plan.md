

# Plano: Correção de Popups Offline + Erro de Perfil OAuth (Ajustes Finais)

## Resumo

Corrigir dois bugs críticos que afetam a experiência de login OAuth:
1. Popup "Você está offline" aparece incorretamente após erros de API
2. Toast "Não foi possível carregar o perfil" aparece durante bootstrap OAuth normal

---

## 1. Corrigir `useOnlineStatus` (src/hooks/useOffline.ts)

### Problema Atual (linhas 13-18)
```typescript
const handleOnline = () => {
  setIsOnline(true);
  if (!navigator.onLine) {  // ← Bug: nunca é verdade aqui
    setWasOffline(true);
  }
};
```

### Correção (versão simples e clara)
```typescript
const handleOnline = () => {
  setWasOffline(true);  // Sempre marca que reconectou
  setIsOnline(true);
};

const handleOffline = () => {
  setIsOnline(false);
  // NÃO setamos wasOffline aqui - só quando reconectar
};
```

**Racional:** O `wasOffline` serve para mostrar toast "Conexão restaurada". Ele só precisa ser `true` quando o usuário reconecta após estar offline.

---

## 2. Silenciar Toast de Perfil Durante Bootstrap OAuth (src/hooks/useAuth.ts)

### Problema Atual (linhas 150-157)
```typescript
catch (error) {
  console.error('Error loading profile:', error);
  toast({
    title: "Erro",
    description: "Não foi possível carregar o perfil do usuário",
    variant: "destructive"
  });
  setUserRole(null);
}
```

Este toast aparece mesmo durante a criação normal de perfil para novos usuários OAuth.

### Correção

**Contexto técnico:** Profile inexistente durante bootstrap OAuth é estado esperado para novos usuários, não um erro.

```typescript
const loadProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      setProfile(data);
    } else {
      // Profile inexistente durante bootstrap OAuth (estado esperado para novos usuários)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      const metadata = authUser?.user_metadata || {};
      const providerName = metadata.full_name || metadata.name || '';
      const [firstName, ...lastParts] = providerName.split(' ');
      const lastName = lastParts.join(' ');
      const email = authUser?.email || '';
      
      const newProfile = {
        user_id: userId,
        first_name: firstName || 'Usuário',
        last_name: lastName || '',
        email: email,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        // Log silenciosamente - perfil pode ser criado depois
        console.error('Error creating profile (will retry later):', createError);
      } else {
        setProfile(createdProfile);
      }
    }
    
    await loadUserRole(userId);
  } catch (error) {
    // Log silenciosamente, sem toast durante bootstrap
    console.error('Error in loadProfile:', error);
    // Ainda assim tentar carregar role
    await loadUserRole(userId);
  } finally {
    setLoading(false);
  }
};
```

**Mudança principal:** Remover toast de erro do catch - erros de perfil durante bootstrap não são fatais.

---

## 3. Condicionar Carregamento de Dados ao Role (src/contexts/AppContext.tsx)

### Problema Atual (linhas 251-259)
```typescript
useEffect(() => {
  if (user) {
    loadMedications();
    loadEventsFromEventsTable();
    loadReminders();
    loadStats();
    loadTreatmentPlans();
  }
}, [user]);
```

Isso carrega dados mesmo quando o usuário está em `/choose-role` e não tem role definido.

### Correção

```typescript
import { useLocation } from 'react-router-dom';

// No AppProvider:
const { user, profile, loading, userRole, updateProfile: updateUserProfile } = useAuth();
const location = useLocation();

useEffect(() => {
  // Não carregar dados se:
  // 1. Usuário não existe
  // 2. Role ainda não foi definido (null ou undefined)
  // 3. Estamos na tela de escolha de role
  const isChoosingRole = location.pathname === '/choose-role';
  const hasDefinedRole = userRole !== null && userRole !== undefined;
  
  if (!user || !hasDefinedRole || isChoosingRole) {
    return;
  }
  
  loadMedications();
  loadEventsFromEventsTable();
  loadReminders();
  loadStats();
  loadTreatmentPlans();
}, [user, userRole, location.pathname]);
```

---

## 4. Silenciar Hooks Durante Bootstrap (src/hooks/useUserClinics.ts)

### Problema Atual
O hook executa e pode exibir toasts de erro mesmo durante `/choose-role`.

### Correção

```typescript
import { useLocation } from 'react-router-dom';

export const useUserClinics = () => {
  const [clinics, setClinics] = useState<ConnectedClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const location = useLocation();

  const fetchUserClinics = async () => {
    // Não executar durante bootstrap de role
    if (location.pathname === '/choose-role') {
      setLoading(false);
      return;
    }

    try {
      // ... resto do código existente
    } catch (error) {
      // ... resto do código existente
    }
  };

  // ... resto do hook
};
```

---

## 5. Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useOffline.ts` | Corrigir lógica de `wasOffline` |
| `src/hooks/useAuth.ts` | Remover toast de erro durante bootstrap |
| `src/contexts/AppContext.tsx` | Condicionar carregamento ao role definido |
| `src/hooks/useUserClinics.ts` | Não executar durante `/choose-role` |

---

## 6. Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Login Google novo usuário | Toast "erro de perfil" | Tela limpa |
| Tela /choose-role | Toasts de erro de dados | Nenhum toast |
| Perda real de conexão | Popup offline | Popup offline |
| Erro de API com internet | Popup offline (incorreto) | Nenhum popup offline |
| Reconexão após offline | Popup "Conexão restaurada" | Popup "Conexão restaurada" |

---

## 7. Critérios de Aceite

- Login Google sem toasts de erro
- Tela /choose-role sem popups
- Popup "Você está offline" apenas quando `navigator.onLine === false`
- Popup "Conexão restaurada" apenas após reconexão real
- Dados do paciente só carregam após role definido
- Fluxo de email/senha não afetado

