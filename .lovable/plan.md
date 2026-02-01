
# Plano: Separar UX Paciente vs Médico

## Problema Identificado

O app **OncoTrack** foi desenvolvido para **pacientes oncológicos**. O Dashboard Médico foi implementado como uma funcionalidade adicional para que **profissionais de saúde** possam monitorar seus pacientes remotamente.

Porém, atualmente:
- O botão "Portal do Médico" aparece na tela Home de **todos os usuários**
- Qualquer paciente pode clicar e tentar se registrar como médico
- Isso é confuso e não faz sentido para o usuário final (paciente)

## Solução Proposta

### 1. Remover acesso direto do Portal Médico da Home do Paciente

- **Remover** o card "Portal do Médico" da página `Home.tsx`
- Pacientes **não devem ver** essa opção

### 2. Mostrar apenas para usuários que já são médicos

O botão "Portal do Médico" só aparecerá se o usuário **já tiver** o papel de médico no sistema (tabela `user_roles`).

### 3. Criar entrada separada para médicos

Médicos acessarão o portal através de:
- **Opção A**: URL direta (`/doctor`) - Se não estiver cadastrado, vai para `/doctor/register`
- **Opção B**: Adicionar link discreto na tela de login/auth ("Sou profissional de saúde")

### 4. Adicionar seção "Meus Médicos" para pacientes

Em vez do botão para virar médico, o paciente verá:
- Lista de médicos conectados a ele
- Convites pendentes de médicos
- Opção de desconectar de um médico

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Home.tsx` | Remover card "Portal do Médico", adicionar seção "Meus Médicos Conectados" |
| `src/pages/Auth.tsx` | Adicionar link discreto "Sou profissional de saúde" |
| `src/hooks/useDoctorAuth.ts` | Manter como está (já funciona corretamente) |
| `src/hooks/useMyDoctors.ts` | Novo hook para pacientes verem seus médicos |
| `src/components/MyDoctorsCard.tsx` | Novo componente para exibir médicos conectados |

## Fluxo de Usuários

### Paciente (usuário normal)
```
1. Login → Home (sem botão "Portal do Médico")
2. Vê seção "Meus Médicos" (se houver conexões)
3. Pode aceitar/recusar convites de médicos
4. Pode se desconectar de um médico
```

### Médico (profissional de saúde)
```
1. Login → Home (vê botão "Portal do Médico" apenas se já for médico)
   OU
   Login → Clica "Sou profissional de saúde" → /doctor/register
2. Cadastra CRM, especialidade
3. Acessa Dashboard do Médico
4. Convida pacientes
```

## Detalhes Técnicos

### Nova seção "Meus Médicos" na Home (para pacientes)

Mostrará:
- Nome do médico conectado
- Especialidade e CRM
- Status da conexão (ativo/pendente)
- Botão para remover conexão

### Verificação de papel para exibir Portal Médico

Utilizaremos o hook `useDoctorAuth` já existente para verificar se o usuário tem papel de médico antes de exibir o card.

## Resultado Esperado

- **Pacientes**: Veem app focado no tratamento, sem opção confusa de "virar médico"
- **Médicos**: Têm entrada dedicada pelo link na tela de login ou URL direta
- **Experiência**: Mais clara e intuitiva para cada tipo de usuário
