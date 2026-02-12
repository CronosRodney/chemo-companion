

# Reformulacao Visual da Home — OncoTrack

## Resumo

Redesign puramente visual da Home do paciente. Identidade clinica, leve e moderna. Zero alteracoes em logica, rotas ou dados.

---

## Arquivos modificados

### 1. `src/pages/Home.tsx`
- Remover cards separados de "Adesao %" e "Consulta passada" do grid desktop
- Reordenar blocos: Saudacao > Tratamento > Lembretes > Exames > Monitoramento > Emergencia
- Fundo da pagina: `bg-[#F7F9FC]`
- Cards: `bg-white rounded-2xl shadow-sm border border-gray-100` (remover `luxury-card`, `glass-effect`, gradientes fortes, blur blobs)
- Saudacao: texto `text-2xl` limpo, sem `text-4xl`, sem `bg-clip-text`, sem blobs animados
- Exames e Monitoramento visiveis tambem no mobile (remover condicional `!isMobile`)
- Emergencia: `bg-red-50 border-red-200`, botao `bg-red-500 text-white`
- Passar `stats.adherence` como prop para `TreatmentProgressWidget`
- Container desktop: `max-w-2xl` centralizado com espacamento maior

### 2. `src/components/TreatmentProgressWidget.tsx`
- Interface atualizada:

```text
interface TreatmentProgressWidgetProps {
  treatmentPlans: any[];
  adherence?: number;    // <-- opcional, nao quebra chamadas existentes
}
```

- Renderizacao condicional da adesao:

```text
{adherence !== undefined && (
  <p>Adesao: {adherence}%</p>
)}
```

- Remover `luxury-card`, `glass-effect`, `hover:scale`, gradientes, glow, blur
- Cards internos: `bg-white rounded-2xl shadow-sm border border-gray-100`
- Barra de progresso mais fina: `h-2`
- Icones monocromaticos sem gradiente no circulo

### 3. `src/components/FeelingLogger.tsx`
- Reduzir tamanho dos emojis/botoes
- Simplificar estilo visual (remover efeitos glass/luxury)

---

## O que NAO muda

- Nenhuma rota
- Nenhum hook ou context
- Nenhum servico ou integracao
- AppContext intacto
- Bottom navigation intacta
- Logica de dados 100% preservada
- Cards de Adesao e Consulta continuam nas telas especificas (Tratamento, Eventos)

---

## Compatibilidade

A prop `adherence` e opcional (`adherence?: number`), garantindo que chamadas antigas do `TreatmentProgressWidget` sem essa prop continuam funcionando normalmente.

