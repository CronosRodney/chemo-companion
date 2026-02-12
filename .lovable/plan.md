

# Espelhamento de Vacinas: Lista + Detalhe (Revisado)

## Ajustes incorporados

### ID deterministico no backend

A edge function `sync-caderneta-vaccines` passara a gerar um `id` para cada vacina antes de retornar ao frontend. Logica:

```text
id = `${vaccine.name}-${vaccine.date}-${vaccine.dose}`.toLowerCase().replace(/\s+/g, '-')
```

Se o B2B ja retornar `id`, usa o original. Caso contrario, gera deterministicamente. Isso garante:
- Keys estaveis no React (sem index)
- Dialog abre o item correto mesmo apos reordenacao
- Sem risco de colisao para vacinas com nome+data+dose diferentes

### Dialog fecha ao desconectar

O componente `VaccineListCard` controlara o state do dialog (`selectedVaccine`). Ao desconectar:
- O hook limpa `vaccines` para `[]`
- O componente recebe array vazio, `selectedVaccine` nao tera match
- Adicionar `useEffect` que fecha o dialog quando `vaccines` fica vazio

---

## Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/sync-caderneta-vaccines/index.ts` | Gerar `id` deterministico para cada vacina |
| `src/hooks/useExternalConnections.ts` | Expor `vaccines` (array de `VaccineRecord`) no retorno |
| `src/components/VaccineListCard.tsx` | Criar lista clicavel de vacinas |
| `src/components/VaccineDetailDialog.tsx` | Criar dialog de detalhe somente leitura |
| `src/pages/Vaccination.tsx` | Inserir `VaccineListCard` entre resumo e alertas |

---

## 1. Edge Function: gerar ID

No bloco apos extrair o array `vaccines` (linha ~115), mapear cada item para incluir `id`:

```text
vaccines.map((v, i) => ({
  ...v,
  id: v.id || `${String(v.name || '')}-${String(v.date || '')}-${String(v.dose || '')}`.toLowerCase().replace(/\s+/g, '-') || `vaccine-${i}`,
}))
```

Fallback final com indice para casos extremos (nome/data/dose todos vazios).

---

## 2. Hook: expor `vaccines`

Novo tipo exportado:

```text
export interface VaccineRecord {
  id: string;
  name: string;
  date: string;
  dose: string;
  status: 'up_to_date' | 'pending' | 'overdue' | 'unknown';
  observations?: string;
  source?: string;
  confidence?: number;
}
```

Alteracoes no hook:
- Novo state: `const [vaccines, setVaccines] = useState<VaccineRecord[]>([])`
- Em `refreshVaccinationData`: extrair `payload.vaccines` e salvar via `setVaccines`
- Em `disconnect`: adicionar `setVaccines([])`
- Retornar `vaccines` no objeto

---

## 3. Componente `VaccineListCard`

Card com titulo "Suas Vacinas" e subtitulo com contagem.

Cada item:
- Nome da vacina (texto principal)
- Data e dose (texto secundario)
- Badge de status: verde (em dia), amarelo (pendente), vermelho (atrasada), cinza (desconhecido)
- Icone pequeno "Minha Caderneta" como origem
- Hover highlight, cursor pointer

Estados:
- `isLoading`: skeleton cards
- `vaccines.length === 0`: empty state com mensagem
- Lista normal: cards clicaveis

Ao clicar: abre `VaccineDetailDialog` passando o `VaccineRecord` selecionado.

Estado do dialog controlado internamente (`selectedVaccine: VaccineRecord | null`).

`useEffect`: se `vaccines` mudar para vazio, limpar `selectedVaccine` (fecha dialog).

---

## 4. Componente `VaccineDetailDialog`

Dialog (Radix) com:
- Titulo: nome da vacina
- Campos em layout de lista:
  - Dose
  - Data de aplicacao
  - Status (badge colorido)
  - Observacoes (se existirem, senao oculto)
  - Origem: "Minha Caderneta" com badge
  - Confianca (se existir, barra ou porcentagem)
- Botao opcional "Abrir na Minha Caderneta" (abre URL externa)
- Sem acoes de edicao

Props: `vaccine: VaccineRecord | null`, `open: boolean`, `onOpenChange: (open: boolean) => void`

---

## 5. Pagina `Vaccination.tsx`

Importar `VaccineListCard`.

Inserir entre `VaccinationSummaryCard` e `VaccinationAlertsCard`:

```text
<VaccineListCard
  vaccines={vaccines}
  isLoading={isLoadingVaccination}
/>
```

Extrair `vaccines` do hook (ja disponivel apos alteracao do passo 2).

---

## Regras mantidas

- Nenhum dado salvo no banco do OncoTrack
- Leitura exclusiva via B2B
- Token B2B nunca exposto ao frontend
- Sem edicao
- Ao desconectar, lista e dialog desaparecem

