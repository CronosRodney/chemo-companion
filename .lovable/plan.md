
# Plano: Corrigir Aba de Notas do Portal Médico

## Diagnóstico Realizado

### Situação Atual
Analisei o código da aba Notas em `PatientDetails.tsx` (linhas 464-513) e identifiquei:

**O que existe:**
- Textarea para digitar notas (linha 474-479) 
- Botão "Adicionar Nota" com onClick (linha 480-487)
- Função `handleAddNote` implementada (linhas 167-215)
- Listagem de notas existentes (linhas 498-511)

**O que está faltando:**
- Botões de **editar** e **excluir** nas notas existentes
- Nenhuma funcionalidade de modificação após a nota ser criada

**Possíveis problemas no funcionamento:**
- O console mostra erros de RLS em profiles (não relacionado diretamente)
- A query de notas retorna array vazio `[]`, sugerindo que nenhuma nota foi salva ainda

---

## Mudanças Necessárias

### 1. Adicionar Estados para Edição

No componente `PatientDetails`:
- `editingNote`: guarda a nota sendo editada
- `editNoteText`: texto da edição em andamento

### 2. Adicionar Funções de Editar e Excluir

| Função | Ação | SQL |
|--------|------|-----|
| `handleEditNote` | Abre modo de edição com texto pré-preenchido | - |
| `handleSaveEdit` | Salva alterações | `UPDATE doctor_notes SET note = ... WHERE id = ...` |
| `handleDeleteNote` | Exclui nota com confirmação | `DELETE FROM doctor_notes WHERE id = ...` |

### 3. Atualizar UI das Notas Existentes

Cada card de nota terá:
- Botão de **Editar** (ícone lápis)
- Botão de **Excluir** (ícone lixeira)
- Quando em modo edição: textarea + botões Salvar/Cancelar

### 4. Verificar RLS (já existente)

A tabela `doctor_notes` já possui RLS correta:
- `Doctors can manage their notes` → USING `auth.uid() = doctor_user_id`

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|-----------|
| `src/pages/doctor/PatientDetails.tsx` | Adicionar estados, funções e UI para edição/exclusão |

---

## Implementação Detalhada

### Estados a Adicionar

```typescript
const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
const [editNoteText, setEditNoteText] = useState('');
```

### Funções a Adicionar

```typescript
// Iniciar edição
const handleEditNote = (note: DoctorNote) => {
  setEditingNoteId(note.id);
  setEditNoteText(note.note);
};

// Cancelar edição
const handleCancelEdit = () => {
  setEditingNoteId(null);
  setEditNoteText('');
};

// Salvar edição
const handleSaveEdit = async () => {
  if (!editingNoteId || !editNoteText.trim()) return;
  
  const { error } = await supabase
    .from('doctor_notes')
    .update({ note: editNoteText })
    .eq('id', editingNoteId);
    
  if (!error) {
    setNotes(notes.map(n => 
      n.id === editingNoteId ? { ...n, note: editNoteText } : n
    ));
    handleCancelEdit();
    toast({ title: "Nota atualizada" });
  }
};

// Excluir nota
const handleDeleteNote = async (noteId: string) => {
  const { error } = await supabase
    .from('doctor_notes')
    .delete()
    .eq('id', noteId);
    
  if (!error) {
    setNotes(notes.filter(n => n.id !== noteId));
    toast({ title: "Nota excluída" });
  }
};
```

### UI Atualizada para Cards de Notas

Cada nota terá:
1. **Modo visualização**: mostra texto + botões Editar/Excluir
2. **Modo edição**: textarea editável + botões Salvar/Cancelar

---

## Fluxo Esperado Após Correção

```text
┌─────────────────────────────────────────────────────┐
│ ABA NOTAS - PORTAL DO MÉDICO                        │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ ADICIONAR NOTA                                  │ │
│ │ [Textarea editável]                             │ │
│ │ [+ Adicionar Nota]                              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ observation    02/02/2026 03:20                 │ │
│ │ Texto da nota clínica aqui...                   │ │
│ │                         [✏️ Editar] [🗑️ Excluir] │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ observation    01/02/2026 18:45   (EDITANDO)   │ │
│ │ [Textarea com texto atual]                      │ │
│ │                     [✓ Salvar] [✕ Cancelar]     │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Validação Final

| Teste | Resultado Esperado |
|-------|-------------------|
| Digitar no textarea | Texto aparece normalmente |
| Clicar "Adicionar Nota" | Nota é salva e aparece na lista |
| Clicar "Editar" em nota | Abre textarea com texto atual |
| Clicar "Salvar" na edição | Atualiza nota e fecha edição |
| Clicar "Excluir" | Remove nota da lista |
| Recarregar página | Notas persistem corretamente |
| Paciente visualiza | Paciente NÃO pode ver/editar notas (regra RLS) |

---

## Imports Necessários

Adicionar aos imports existentes:
- `Edit2, Trash2, Check, X` de `lucide-react`
- Possivelmente `AlertDialog` para confirmação de exclusão

---

## Resumo

O código atual tem a estrutura básica funcionando (criar nota), mas está faltando:
1. Botões de editar/excluir nas notas existentes
2. Funcionalidades correspondentes

A implementação reusa a lógica existente e adiciona apenas o necessário para CRUD completo das notas médicas.
