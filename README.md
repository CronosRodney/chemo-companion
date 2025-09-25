# OncoTrack

OncoTrack é um aplicativo web para gestão e acompanhamento de tratamentos oncológicos, desenvolvido com tecnologias modernas para proporcionar uma experiência intuitiva e eficiente.

## 🚀 Tecnologias

- **React 18** - Interface de usuário moderna e reativa
- **TypeScript** - Tipagem estática para maior confiabilidade
- **Vite** - Build tool rápido e eficiente
- **Tailwind CSS** - Framework CSS utilitário
- **Shadcn/ui** - Componentes de interface elegantes
- **Supabase** - Backend como serviço com banco de dados PostgreSQL
- **React Router** - Roteamento para SPA
- **React Query** - Gerenciamento de estado do servidor

## 🔧 Funcionalidades

### Scanner de QR Codes
- **Scanner de Medicamentos**: Leitura de códigos GS1 e URLs de medicamentos
- **Scanner de Clínicas**: Processamento de QR codes com informações de clínicas
- **Extração Automática**: Dados extraídos automaticamente das páginas web
- **Captura de Tela**: Screenshot como fallback quando não é possível extrair dados

### Gestão de Medicamentos
- Cadastro e edição de medicamentos
- Integração com códigos GS1 (GTIN, lote, validade, etc.)
- Informações detalhadas (princípio ativo, fabricante, concentração)
- Timeline de eventos relacionados aos medicamentos

### Sistema de Autenticação
- Login e registro de usuários
- Perfis de usuário personalizáveis
- Proteção de rotas privadas

### Interface Responsiva
- Design adaptativo para dispositivos móveis e desktop
- Tema claro e escuro
- Componentes acessíveis e otimizados

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Configuração

1. Clone o repositório:
```bash
git clone <repository-url>
cd oncotrack
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Configure o Supabase:
   - Crie um projeto no [Supabase](https://supabase.com)
   - Configure as variáveis de ambiente com suas credenciais
   - Execute as migrações do banco de dados

5. Execute o projeto:
```bash
npm run dev
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   └── ...             # Componentes específicos do app
├── pages/              # Páginas da aplicação
├── hooks/              # Hooks customizados
├── services/           # Serviços e APIs
├── lib/                # Utilitários e configurações
├── contexts/           # Contextos React
└── integrations/       # Integrações externas (Supabase)
```

## 🔬 Scanner de Medicamentos

O sistema de scanner suporta:

### Códigos GS1
- **GTIN (01)**: Identificação global do produto
- **Validade (17)**: Data de vencimento
- **Lote (10)**: Número do lote
- **Série (21)**: Número de série
- **ANVISA (713)**: Registro na ANVISA

### URLs de Medicamentos
- Extração automática de dados de páginas web
- Suporte especializado para farmácias online
- Parsing de informações como nome, fabricante, concentração
- Screenshot como fallback para páginas protegidas

## 🛠️ Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa verificação de linting

## 📱 Uso

1. **Cadastro/Login**: Crie uma conta ou faça login
2. **Scanner**: Use a câmera para escanear QR codes de medicamentos ou clínicas
3. **Gestão**: Visualize e edite informações na timeline
4. **Perfil**: Configure suas informações pessoais

## 🤝 Contribuição

1. Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte ou dúvidas:
- Abra uma [issue](issues) no GitHub
- Entre em contato através do formulário no aplicativo

---

**OncoTrack** - Simplificando o acompanhamento de tratamentos oncológicos através da tecnologia.