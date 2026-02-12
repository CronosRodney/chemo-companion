

# Elevar UI do OncoTrack para Nivel Premium

Refinamento visual completo de todas as telas do OncoTrack, mantendo 100% da logica, dados, rotas e backend intactos. Apenas CSS, classes Tailwind, microinteracoes e espacamentos serao alterados.

---

## Resumo das Mudancas

### 1. Sistema de Design Global (`src/index.css` + `tailwind.config.ts`)

**index.css:**
- Ajustar variavel `--background` para tom mais proximo de `#F6F9FC` (azul clinico muito suave)
- Refinar `--border` para tom mais leve (`gray-100` equivalente)
- Adicionar keyframes globais: `fade-in-up` (cards ao renderizar), `progress-fill` (barra de progresso), `scale-press` (toque mobile)
- Atualizar `.clean-card` para incluir `transition-shadow duration-200 hover:shadow-md`
- Adicionar classe utilitaria `.card-press` para `active:scale-[0.98]` no mobile

**tailwind.config.ts:**
- Adicionar keyframes: `fade-in-up`, `progress-fill`
- Adicionar animations correspondentes
- Nenhuma mudanca estrutural

---

### 2. Home do Paciente (`src/pages/Home.tsx`)

- Aplicar `animate-fade-in` com delays escalonados nos cards (staggered entrance)
- Refinar espacamento entre cards: `space-y-5` para `space-y-6`
- Card OncoTrack AI: usar variaveis CSS ao inves de cores hardcoded (`bg-primary/5`, `border-primary/15`)
- Card Emergencia: manter vermelho (regra inviolavel), refinar padding interno para `p-6`
- Card Laboratorios e Monitoramento: adicionar `active:scale-[0.98] transition-transform` no mobile
- Feeling Logger buttons: hover mais suave, sem mudancas de logica
- Reminders: refinar badges com cores mais suaves (amarelo claro para urgente)

---

### 3. Tela Tratamento (`src/pages/Treatment.tsx`) — Prioridade Maxima

- Aumentar padding interno dos cards de plano: `p-5` para `p-6`
- Reduzir densidade: aumentar `space-y` entre blocos internos
- Badges de status: cores mais suaves
  - "Ativo" -> `bg-emerald-50 text-emerald-700 border-emerald-200`
  - "Concluido" -> `bg-slate-50 text-slate-600 border-slate-200`
  - "Suspenso" -> `bg-red-50 text-red-600 border-red-200`
- Barra de progresso: adicionar animacao `progress-fill` ao montar
- Cards de ciclo no cronograma: bordas mais leves, sem `border-2`, usar `border`
- Abas (Tabs): transicao suave entre conteudos com `animate-fade-in`
- Estados vazios: texto empatico + icone maior + CTA claro
- Grid de info clinica: aumentar gap para `gap-4`
- Botoes de acao: `rounded-xl` consistente, hover discreto

---

### 4. Tela Medicamentos (`src/pages/Medications.tsx`)

- Cards de medicamento: padronizar `bg-card rounded-2xl shadow-sm border border-border` (usar variaveis CSS)
- Lista "Meus Medicamentos": fade-in ao renderizar
- Badge de dose/frequencia: cores suaves consistentes com sistema
- Mobile form cards: usar variaveis ao inves de `bg-white border-gray-100`
- Titulo "Meus Medicamentos": usar `text-foreground` ao inves de `text-slate-800`

---

### 5. Tela Labs (`src/pages/Labs.tsx`)

- Padronizar cards com `clean-card`
- Badges de status (Normal/Baixo/Alto): cores suaves consistentes
- Espacamento maior entre parametros

---

### 6. Tela Health (`src/pages/Health.tsx`)

- Padronizar cards com `clean-card`
- Adicionar `animate-fade-in` nos cards de conexao

---

### 7. Tela Timeline (`src/pages/Timeline.tsx`)

- Cards de evento: padronizar com sistema visual
- Badges de tipo: cores suaves
- Espacamento vertical mais confortavel

---

### 8. Tela Profile e EditableProfile (`src/pages/Profile.tsx`, `src/pages/EditableProfile.tsx`)

- Padronizar com sistema de cards
- Badges de adesao: verde suave consistente

---

### 9. Tela Vaccination, Share, Events

- Aplicar mesmo padrao de card, badge e espacamento
- Estados vazios com texto empatico e CTA

---

### 10. Componentes Compartilhados

**TreatmentProgressWidget:**
- Animacao `progress-fill` na barra de progresso
- Badge "Proximo ciclo": amarelo suave quando proximo
- Fade-in ao montar

**FeelingLogger:**
- Hover mais sutil, bordas mais leves
- Active state: `scale-[0.96]` no mobile

**Navigation:**
- Sem alteracoes (regra inviolavel)

---

## Detalhes Tecnicos

### Novas classes CSS (index.css)

```text
.animate-fade-in-up  -> opacity 0->1, translateY(12px)->0, 0.4s ease-out
.animate-progress    -> width 0->var(--progress), 0.8s ease-out
.card-press          -> active:scale-[0.98] transition-transform duration-150
```

### Padrao de Card Unificado (todas as telas)

```text
bg-card rounded-2xl shadow-sm border border-border p-6
hover:shadow-md transition-shadow duration-200 (onde interativo)
```

### Padrao de Badge Unificado

```text
Status Ativo:    bg-emerald-50 text-emerald-700 border-emerald-200
Status Pendente: bg-amber-50 text-amber-700 border-amber-200
Status Normal:   bg-emerald-50 text-emerald-600 border-emerald-200
Status Alerta:   bg-red-50 text-red-600 border-red-200
Informativo:     bg-primary/5 text-primary border-primary/20
```

### Arquivos Modificados (estimativa: 12 arquivos)

1. `src/index.css` — variaveis, keyframes, classes utilitarias
2. `tailwind.config.ts` — keyframes e animations
3. `src/pages/Home.tsx` — espacamento, animacoes, cores
4. `src/pages/Treatment.tsx` — espacamento, badges, animacoes, estados vazios
5. `src/pages/Medications.tsx` — padronizacao de cards e cores
6. `src/pages/Labs.tsx` — padronizacao
7. `src/pages/Health.tsx` — padronizacao
8. `src/pages/Timeline.tsx` — padronizacao
9. `src/pages/Profile.tsx` — padronizacao
10. `src/pages/EditableProfile.tsx` — padronizacao
11. `src/pages/Events.tsx` — padronizacao
12. `src/components/TreatmentProgressWidget.tsx` — animacao da barra
13. `src/components/FeelingLogger.tsx` — hover refinado

### O que NAO sera alterado

- Hooks, contexts, services
- Rotas, navegacao inferior
- Backend, edge functions, banco de dados
- Logica de negocios
- Dados exibidos

