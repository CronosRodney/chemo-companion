

# Plano: Reestruturacao de Layout Mobile

## Resumo Executivo
Reorganizar a interface mobile do app de pacientes para ser mais limpa e focada, movendo conteudos secundarios para um menu "Mais" acessivel pela navegacao inferior. Desktop e portal medico permanecem inalterados.

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/MobileMoreMenu.tsx` | **CRIAR** - Bottom sheet com opcoes extras |
| `src/components/Navigation.tsx` | Modificar - Adicionar logica mobile com menu "Mais" |
| `src/pages/Home.tsx` | Modificar - Ocultar cards secundarios no mobile |

---

## 1. Novo Componente: MobileMoreMenu.tsx

Bottom sheet acessivel pelo botao "Mais (...)" contendo:

- Monitoramento de Saude -> `/health`
- Timeline -> `/timeline`
- Perfil -> `/profile`
- Separador
- Sair (destrutivo)

**Comportamento:**
- Usa componente Sheet existente com `side="bottom"`
- Navegacao deterministica (sem history.back)
- Fecha automaticamente ao clicar em item
- Nao possui estado ativo (nao e rota)

---

## 2. Navigation.tsx - Mudancas

**Situacao atual (7 itens):**
Inicio, Medicamentos, Tratamento, Exames, Timeline, Perfil, Sair

**Nova estrutura mobile (5 itens):**
Inicio, Medicamentos, Tratamento, Exames, Mais (...)

**Implementacao:**
- Importar `useIsMobile` hook
- Importar `MoreHorizontal` icon do lucide
- Importar componente `MobileMoreMenu`
- Adicionar estado `moreMenuOpen` para controlar Sheet
- Arrays separados para mobile vs desktop nav items
- Renderizacao condicional baseada em `isMobile`
- Desktop permanece exatamente como esta

```text
// Itens mobile (4 + botao Mais)
mobileNavItems = [
  { path: "/", icon: Home, label: "Inicio" },
  { path: "/medications", icon: Pill, label: "Meds" },
  { path: "/treatment", icon: Activity, label: "Tratamento" },
  { path: "/labs", icon: Beaker, label: "Exames" },
]

// Botao "Mais" separado (nao e item de navegacao)
<Button onClick={() => setMoreMenuOpen(true)}>
  <MoreHorizontal />
  Mais
</Button>
```

---

## 3. Home.tsx - Mudancas

**Cards atuais no Patient Home:**
1. Header com FeelingLogger (check-in emocional)
2. Proximos Lembretes
3. TreatmentProgressWidget
4. Clinica Conectada
5. Quick Stats (Adesao/Consulta)
6. Exames Laboratoriais
7. Monitoramento de Saude
8. PendingInvitesNotification
9. Emergencia 24h

**Exibir no mobile apenas (4 blocos):**
1. Header com FeelingLogger (check-in emocional)
2. Proximos Lembretes (1 item + "ver mais")
3. TreatmentProgressWidget (tratamento atual)
4. Emergencia 24h (sempre visivel)

**Remover do DOM no mobile (nao renderizar):**
- Clinica Conectada (linhas 213-258)
- Quick Stats (linhas 260-284)
- Exames Laboratoriais (linhas 286-308)
- Monitoramento de Saude (linhas 310-330)
- PendingInvitesNotification (linha 333) - mover para Perfil

**Implementacao:**
- Importar `useIsMobile` hook
- Limitar reminders a 1 item no mobile com link "ver mais"
- Envolver cards secundarios em `{!isMobile && (...)}`
- Cards nao serao renderizados no DOM (condicional completa)

```text
// Reminders limitados no mobile
const displayedReminders = isMobile 
  ? reminders.slice(0, 1) 
  : reminders;

// Link "ver mais" visivel apenas no mobile quando ha mais reminders
{isMobile && reminders.length > 1 && (
  <Button variant="link" onClick={() => setShowReminderManager(true)}>
    Ver mais ({reminders.length - 1})
  </Button>
)}

// Cards condicionais - NAO renderizados no mobile
{!isMobile && (
  <>
    {/* Clinica Conectada */}
    {/* Quick Stats */}
    {/* Exames Laboratoriais */}
    {/* Monitoramento de Saude */}
    {/* PendingInvitesNotification */}
  </>
)}
```

---

## Fluxo Visual Final

```text
MOBILE (< 768px)
+----------------------------------+
|  [Header + Check-in emocional]   |
+----------------------------------+
|  [Proximo Lembrete]  [ver mais]  |
+----------------------------------+
|  [Tratamento Atual - compacto]   |
+----------------------------------+
|  [Emergencia 24h]                |
+----------------------------------+

Bottom Nav:
[Inicio] [Meds] [Trat] [Exames] [...]

Menu Mais (bottom sheet):
+---------------------------+
| Mais opcoes               |
+---------------------------+
| Monitoramento de Saude    |
| Timeline                  |
| Perfil                    |
|---------------------------|
| Sair                      |
+---------------------------+
```

```text
DESKTOP (>= 768px)
Home: Todos os cards visiveis (sem alteracao)
Nav: 7 itens (sem alteracao)
```

---

## Criterios de Aceite

1. Home mobile exibe no maximo 4 blocos principais
2. Cards removidos NAO sao renderizados no DOM (performance)
3. Menu "Mais" funcional via icone de 3 pontinhos
4. Botao "Mais" nao possui estado ativo (nao e rota)
5. Reminders limitado a 1 item no mobile com link "ver mais"
6. Desktop permanece 100% inalterado
7. Portal do medico nao e afetado
8. Nenhuma regressao funcional

---

## Detalhes Tecnicos

### MobileMoreMenu.tsx (novo arquivo)

```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface MobileMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileMoreMenu = ({ open, onOpenChange }: MobileMoreMenuProps) => {
  const navigate = useNavigate();
  
  const menuItems = [
    { path: "/health", icon: Activity, label: "Monitoramento de Saude" },
    { path: "/timeline", icon: Calendar, label: "Timeline" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Mais opcoes</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className="w-full justify-start h-12"
              onClick={() => handleNavigate(item.path)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Button>
          ))}
          <div className="border-t pt-2 mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

---

## Impacto

- **Zero breaking changes** no desktop
- **Portal medico** completamente isolado
- **Performance** melhorada no mobile (menos DOM nodes)
- **UX** mais limpa e focada para pacientes mobile
- **Memoria do projeto** atualizada com novos principios de navegacao

