

# Plano: Login Social com Apple ID e Google

## Resumo

Implementar autenticacao OAuth com Apple ID e Google no OncoTrack, mantendo o login por email existente. Essencial para publicacao na App Store (Apple Sign In obrigatorio).

---

## 1. Modificacoes em Auth.tsx

### 1.1 Adicionar Funcao de Deteccao de Plataforma Apple

Detectar se o usuario esta em iOS ou Safari para mostrar botao Apple:

```typescript
const isApplePlatform = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
  const isMacOS = /macintosh/.test(ua);
  return isIOS || (isMacOS && isSafari);
};
```

### 1.2 Adicionar Funcoes de Login OAuth

```typescript
const handleGoogleSignIn = async () => {
  setIsLoading(true);
  setMessage(null);
  
  try {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) throw error;
  } catch (error: any) {
    setMessage({
      type: 'error',
      text: error.message || 'Erro ao conectar com Google'
    });
    setIsLoading(false);
  }
};

const handleAppleSignIn = async () => {
  setIsLoading(true);
  setMessage(null);
  
  try {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
      },
    });
    
    if (error) throw error;
  } catch (error: any) {
    setMessage({
      type: 'error',
      text: error.message || 'Erro ao conectar com Apple'
    });
    setIsLoading(false);
  }
};
```

### 1.3 Adicionar Componentes de Icones SVG

Criar icones inline para Apple e Google sem dependencias externas:

- AppleIcon: SVG preto/branco seguindo guidelines Apple
- GoogleIcon: SVG colorido oficial do Google

### 1.4 Adicionar UI de Login Social

Na tab de login (apos botao "Entrar", antes do "Modo Teste"):

```typescript
{/* Divisor */}
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-card px-2 text-muted-foreground">
      ou continue com
    </span>
  </div>
</div>

{/* Botoes OAuth */}
<div className="space-y-2">
  {isApplePlatform() && (
    <Button variant="outline" onClick={handleAppleSignIn}>
      <AppleIcon /> Sign in with Apple
    </Button>
  )}
  
  <Button variant="outline" onClick={handleGoogleSignIn}>
    <GoogleIcon /> Entrar com Google
  </Button>
</div>
```

---

## 2. Modificacoes em useAuth.ts

### 2.1 Atualizar loadProfile para Usuarios OAuth

Quando um usuario faz login via OAuth (Apple/Google), o Supabase fornece dados em `user_metadata`. Precisamos extrair esses dados para criar o perfil:

```typescript
const loadProfile = async (userId: string) => {
  // ... busca perfil existente ...

  if (!data) {
    // Obter dados do usuario (inclui metadata do provider OAuth)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    // Extrair nome do provider (Google/Apple)
    const metadata = authUser?.user_metadata || {};
    const providerName = metadata.full_name || metadata.name || '';
    const [firstName, ...lastParts] = providerName.split(' ');
    const lastName = lastParts.join(' ');
    
    // Email pode ser privado (Apple relay @privaterelay.appleid.com)
    const email = authUser?.email || '';
    
    const newProfile = {
      user_id: userId,
      first_name: firstName || 'Usuario',  // Fallback se Apple nao enviar nome
      last_name: lastName || '',
      email: email,
    };

    // ... insere novo perfil ...
  }
};
```

---

## 3. Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/pages/Auth.tsx` | Adicionar funcoes OAuth, icones SVG, botoes de login social |
| `src/hooks/useAuth.ts` | Melhorar loadProfile para extrair dados do provider OAuth |

---

## 4. Configuracoes Manuais no Supabase (Usuario)

### 4.1 URL Configuration

Em **Authentication > URL Configuration**:
- Site URL: `https://quimio-companheiro.lovable.app`
- Redirect URLs:
  - `https://quimio-companheiro.lovable.app`
  - `https://id-preview--df633801-1f93-46c2-a717-4709fe54b455.lovable.app`

### 4.2 Google Provider

1. Criar projeto no Google Cloud Console
2. Configurar OAuth Consent Screen
3. Criar OAuth Client ID (Web application)
4. Adicionar redirect URI: `https://xpxsdlvicmlqpcaldyyz.supabase.co/auth/v1/callback`
5. Habilitar provider no Supabase com Client ID e Secret

### 4.3 Apple Provider

1. Criar App ID com Sign in with Apple no Apple Developer Portal
2. Criar Services ID
3. Configurar dominio: `xpxsdlvicmlqpcaldyyz.supabase.co`
4. Gerar chave privada (.p8)
5. Habilitar provider no Supabase

---

## 5. Fluxo de Usuario

```text
Usuario abre /auth
    |
    +-- Login Email/Senha (existente)
    |
    +-- "ou continue com"
    |
    +-- Clica "Entrar com Google"
    |   +-- Redireciona para Google
    |   +-- Usuario autoriza
    |   +-- Retorna para app
    |   +-- onAuthStateChange detecta sessao
    |   +-- loadProfile cria perfil com dados do provider
    |   +-- Redireciona para Home
    |
    +-- Clica "Sign in with Apple" (iOS/Safari)
        +-- Mesmo fluxo (email pode ser @privaterelay.appleid.com)
```

---

## 6. Consideracoes Importantes

1. **Email Relay Apple**: Sistema aceita emails `@privaterelay.appleid.com`
2. **Nome do Usuario**: Apple so envia nome no primeiro login; fallback para "Usuario"
3. **Sem tokens expostos**: Supabase gerencia sessao automaticamente
4. **RLS inalterado**: `user.id` continua sendo fonte de verdade
5. **Compativel Capacitor**: OAuth funciona via Browser plugin

---

## 7. Impacto

- Zero breaking changes em funcionalidades existentes
- Login por email continua funcionando
- RLS e Edge Functions nao afetados
- Perfil criado automaticamente com dados do provider
- Compativel com Web, iOS e Android

