
# Plano: Corrigir Erro de RLS no Cadastro de Médico

## Problema Identificado

Quando um médico cria conta:
1. `supabase.auth.signUp()` cria a conta com sucesso
2. O código tenta imediatamente inserir em `healthcare_professionals`
3. Mas o usuário ainda não está "logado" na sessão
4. `auth.uid()` retorna `null`
5. A policy RLS falha: `auth.uid() = user_id` → `null = 'uuid'` → FALSO

## Solução

Fazer **login automático** após o signup, antes de tentar inserir os dados profissionais.

## Mudança no Código

**Arquivo: `src/pages/Auth.tsx`**

Após o `signUp` bem-sucedido, chamar `signInWithPassword` para estabelecer a sessão:

```typescript
// 1. Criar conta
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  // ...
});

if (error) { /* handle error */ return; }

// 2. Se for médico, fazer login automático primeiro
if (userType === 'doctor' && data.user) {
  // Login para estabelecer sessão (auth.uid() vai funcionar)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (signInError) {
    setMessage({
      type: 'error',
      text: 'Conta criada, mas erro ao fazer login automático. Tente fazer login manualmente.'
    });
    return;
  }

  // 3. Agora sim, inserir dados profissionais
  const { error: profileError } = await supabase
    .from('healthcare_professionals')
    .insert({
      user_id: data.user.id,
      first_name: formData.firstName,
      last_name: formData.lastName,
      crm: formData.crm,
      crm_uf: formData.crm_uf,
      specialty: formData.specialty,
      is_verified: false
    });
    
  // ...
}
```

## Fluxo Corrigido

```
Médico preenche formulário
         │
         ▼
   signUp() - Cria conta
         │
         ▼
   signInWithPassword() - Login automático
         │
         ▼
   auth.uid() agora retorna o ID correto!
         │
         ▼
   INSERT em healthcare_professionals
         │
         ▼
   Trigger adiciona role 'doctor'
         │
         ▼
   Sucesso! Redireciona para /doctor
```

## Observação sobre Confirmação de Email

Se o projeto exigir confirmação de email antes de permitir login:
- O `signInWithPassword` pode falhar com "Email not confirmed"
- Nesse caso, podemos usar uma **Edge Function** com service role para criar o registro

Porém, pela configuração padrão do Supabase, o login funciona mesmo sem confirmação (a confirmação só é obrigatória para certas operações).

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Auth.tsx` | Adicionar `signInWithPassword` após `signUp` para médicos |

## Resultado Esperado

- Médico consegue criar conta e ter dados profissionais salvos em um único fluxo
- Sem erros de RLS
- Redirecionamento automático para o dashboard do médico
