
# Plano: Ocultar Modo Teste em Produção

## Resumo

Adicionar controle por hostname para exibir o bloco "Modo Teste / Paciente / Médico" apenas em ambientes de desenvolvimento (localhost e preview), ocultando-o completamente em produção e domínios customizados.

---

## Arquivo a Modificar

**src/pages/Auth.tsx**

---

## 1. Adicionar Função de Detecção de Ambiente

Inserir após a função `isApplePlatform()` (linha 42):

```typescript
// Detectar se está em ambiente de desenvolvimento (localhost ou preview)
// Usado para ocultar "Modo Teste" em produção (domínios custom ou *.lovable.app sem preview)
const isDevEnvironment = () => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('preview')
  );
};
```

---

## 2. Envolver Bloco "Modo Teste" com Condição

Modificar linhas 819-848, envolvendo o bloco com `{isDevEnvironment() && (...)}`:

```typescript
{/* Modo Teste - Apenas em ambiente de desenvolvimento */}
{isDevEnvironment() && (
  <div className="mt-6 pt-4 border-t border-border">
    <div className="flex items-center gap-2 mb-3">
      <Zap className="h-4 w-4 text-amber-500" />
      <span className="text-sm font-medium text-muted-foreground">Modo Teste</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <Button 
        variant="outline"
        onClick={() => handleQuickLogin('patient')}
        disabled={isLoading}
        className="border-primary/30 hover:bg-primary/10"
      >
        <UserRound className="h-4 w-4 mr-2" />
        Paciente
      </Button>
      <Button 
        variant="outline"
        onClick={() => handleQuickLogin('doctor')}
        disabled={isLoading}
        className="border-primary/30 hover:bg-primary/10"
      >
        <Stethoscope className="h-4 w-4 mr-2" />
        Médico
      </Button>
    </div>
    <p className="text-xs text-muted-foreground text-center mt-2">
      Acesso rápido para desenvolvimento
    </p>
  </div>
)}
```

---

## 3. Comportamento Final

| Ambiente | Hostname | Modo Teste Visível |
|----------|----------|-------------------|
| Local dev | localhost | Sim |
| Local dev | 127.0.0.1 | Sim |
| Preview Lovable | id-preview--*.lovable.app | Sim |
| Preview Lovable | preview--*.lovable.app | Sim |
| Produção Lovable | quimio-companheiro.lovable.app | Não |
| Domínio custom | vixiaa.store | Não |
| Qualquer outro domínio | *.com, *.app, etc | Não |

---

## 4. Segurança em Camadas

1. **Frontend**: Botões ocultos em produção (esta implementação)
2. **Backend**: Edge Function `dev-login` exige `ENABLE_DEV_LOGIN=true` para funcionar

Mesmo que alguém tente chamar a função diretamente em produção, ela retorna erro 403.

---

## 5. Impacto

- Zero breaking changes
- Funcionalidade de teste preservada para desenvolvimento
- Usuários finais em produção não veem opção de teste
- Dupla camada de segurança (UI + backend)
- Compatível com domínios customizados
