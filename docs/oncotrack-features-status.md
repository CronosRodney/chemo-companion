# OncoTrack - Status de Funcionalidades

## 📋 Índice
1. [Funcionalidades Implementadas](#funcionalidades-implementadas)
2. [Funcionalidades Pendentes](#funcionalidades-pendentes)
3. [Infraestrutura Atual](#infraestrutura-atual)
4. [Plano de Migração AWS](#plano-de-migração-aws)

---

## ✅ Funcionalidades Implementadas

### 1. Autenticação e Perfil de Usuário
- ✅ Sistema de login/cadastro com Supabase Auth
- ✅ Perfil completo do usuário (dados pessoais, médicos, contatos de emergência)
- ✅ Edição de perfil
- ✅ RLS (Row Level Security) implementado
- ✅ Proteção de rotas autenticadas

**Arquivos:**
- `src/pages/Auth.tsx`
- `src/pages/Profile.tsx`
- `src/pages/EditableProfile.tsx`
- `src/hooks/useAuth.ts`
- `src/components/ProtectedRoute.tsx`

### 2. Scanner QR Code
- ✅ Scanner de códigos GS1 para medicamentos
- ✅ Scanner de QR Code para clínicas
- ✅ Extração automática de informações (GTIN, lote, validade)
- ✅ Suporte a múltiplos formatos de código de barras

**Arquivos:**
- `src/pages/QRScanner.tsx`
- `src/pages/ScanMed.tsx`
- `src/pages/ScanClinic.tsx`
- `src/components/QRCodeScanner.tsx`
- `src/components/SimpleQRScanner.tsx`
- `src/hooks/useQRScanner.ts`
- `src/hooks/useAutoScanner.ts`
- `src/lib/gs1.ts`

### 3. Gestão de Medicamentos
- ✅ Cadastro manual de medicamentos
- ✅ Importação via scanner QR
- ✅ Extração de dados via IA (OpenAI)
- ✅ Extração via screenshot de sites
- ✅ Listagem de medicamentos do usuário
- ✅ Detalhes completos de medicamentos
- ✅ Base de dados oncológicos (oncology_meds)

**Arquivos:**
- `src/pages/Medications.tsx`
- `src/pages/MedicationDetails.tsx`
- `src/pages/ManualMedicationEntry.tsx`
- `src/pages/ImportMeds.tsx`
- `src/components/MedicationDataDisplay.tsx`
- `src/services/medicationService.ts`
- `src/services/aiMedicationExtractor.ts`
- `src/services/nativeHtmlExtractor.ts`
- `src/services/smartBrowserExtractor.ts`
- `src/services/urlExtractorService.ts`

**Edge Functions:**
- `supabase/functions/extract-medication-ai/index.ts`
- `supabase/functions/extract-medication-batch/index.ts`
- `supabase/functions/screenshot-medication/index.ts`
- `supabase/functions/import-oncology-meds/index.ts`

### 4. Planos de Tratamento
- ✅ Criação de planos de tratamento completos
- ✅ Gestão de ciclos de tratamento
- ✅ Cálculo de doses baseado em BSA (Body Surface Area)
- ✅ Controle de periodicidade de ciclos
- ✅ Status de liberação de ciclos (pendente/aprovado/adiado)
- ✅ Administração de medicamentos por ciclo
- ✅ Prescrições de suporte (medicações complementares)
- ✅ Templates de protocolos oncológicos
- ✅ Ajustes de dose por toxicidade/labs

**Arquivos:**
- `src/pages/Treatment.tsx`
- `src/components/TreatmentPlanDialog.tsx`
- `src/components/TreatmentProgressWidget.tsx`
- `src/services/treatmentService.ts`
- `src/services/bsaCalculator.ts`

**Tabelas:**
- `treatment_plans`
- `treatment_cycles`
- `treatment_drugs`
- `cycle_administrations`
- `cycle_support_prescriptions`
- `regimen_templates`

### 5. Clínicas e Conexões
- ✅ Cadastro de clínicas via QR Code
- ✅ Informações completas de clínicas (endereço, contatos, CNES, CNPJ)
- ✅ Responsáveis técnicos da clínica
- ✅ Conexão usuário-clínica
- ✅ Histórico de conexões

**Arquivos:**
- `src/hooks/useUserClinics.ts`

**Tabelas:**
- `clinics`
- `clinic_responsible`
- `user_clinic_connections`

### 6. Sistema de Eventos e Timeline
- ✅ Registro de eventos médicos (consultas, exames, sintomas)
- ✅ Classificação de eventos por tipo e severidade
- ✅ Timeline cronológica de eventos
- ✅ Criação, edição e exclusão de eventos
- ✅ Logger de sensações/sintomas

**Arquivos:**
- `src/pages/Events.tsx`
- `src/pages/Timeline.tsx`
- `src/components/EventCreateDialog.tsx`
- `src/components/EventEditDialog.tsx`
- `src/components/FeelingDialog.tsx`
- `src/components/FeelingLogger.tsx`

**Tabelas:**
- `events`
- `user_events`
- `timeline_events`

### 7. Laboratórios e Exames
- ✅ Registro de resultados de exames
- ✅ Gráficos de tendências de resultados
- ✅ Alertas de valores fora do normal
- ✅ Histórico completo de labs

**Arquivos:**
- `src/pages/Labs.tsx`
- `src/components/LabTrendsChart.tsx`

### 8. Sistema de Lembretes
- ✅ Criação de lembretes de medicação
- ✅ Lembretes de ciclos de tratamento
- ✅ Classificação de urgência
- ✅ Ativação/desativação de lembretes
- ✅ Gestão completa de horários

**Arquivos:**
- `src/components/ReminderManager.tsx`

**Tabelas:**
- `reminders`

### 9. Integração com Wearables (Parcial)
- ✅ Estrutura de banco de dados para wearables
- ✅ Modelos de dados para métricas de saúde
- ✅ Sistema de alertas de saúde
- ✅ Conexões com dispositivos
- ⚠️ Interface de visualização básica
- ❌ Gráficos de tendências não implementados
- ❌ Sincronização real com APIs não implementada

**Arquivos:**
- `src/pages/Health.tsx`
- `src/components/HealthAlertsCard.tsx`
- `src/components/WearableConnectionCard.tsx`
- `src/components/WearableHealthCard.tsx`
- `src/services/wearableService.ts`

**Tabelas:**
- `wearable_connections`
- `wearable_metrics`
- `wearable_alerts`

### 10. Sistema de Compartilhamento
- ✅ Página de compartilhamento de dados médicos
- ✅ Controle de privacidade

**Arquivos:**
- `src/pages/Share.tsx`

### 11. Navegação e UI
- ✅ Navegação responsiva bottom-bar
- ✅ Design system com Tailwind CSS
- ✅ Componentes UI Shadcn
- ✅ Tema dark/light (preparado)
- ✅ Toasts e notificações
- ✅ Loading states

**Arquivos:**
- `src/components/Navigation.tsx`
- `src/components/ui/*`
- `src/index.css`
- `tailwind.config.ts`

### 12. Context e State Management
- ✅ Context global de aplicação
- ✅ React Query para cache
- ✅ Hooks customizados

**Arquivos:**
- `src/contexts/AppContext.tsx`
- `src/hooks/*`

### 13. Estatísticas
- ✅ Dashboard com estatísticas do usuário
- ✅ Progresso de tratamento
- ✅ Aderência

**Arquivos:**
- `src/services/statsService.ts`

**Tabelas:**
- `user_stats`

---

## 🚧 Funcionalidades Pendentes

### 1. Notificações Push
**Status:** Não implementado  
**Prioridade:** Alta  
**Descrição:**
- Notificações de lembretes de medicação
- Alertas de ciclos próximos
- Notificações de resultados de exames
- Alertas de wearables

**Requisitos Técnicos:**
- Capacitor Push Notifications Plugin
- Firebase Cloud Messaging (FCM) ou Amazon SNS
- Edge function para envio de notificações
- Permissões no app mobile

**Estimativa:** 2-3 dias de desenvolvimento

---

### 2. Gráficos de Tendências de Wearables
**Status:** Parcialmente implementado (estrutura existe)  
**Prioridade:** Média  
**Descrição:**
- Gráficos de passos, frequência cardíaca, sono
- Visualização de tendências temporais
- Comparação de períodos
- Correlação com eventos de tratamento

**Requisitos Técnicos:**
- Componentes de gráficos (Recharts já instalado)
- Queries otimizadas para agregação de dados
- Filtros de período
- Exportação de dados

**Estimativa:** 2-3 dias de desenvolvimento

---

### 3. Validação de Formulários com Zod
**Status:** Não implementado  
**Prioridade:** Alta (Segurança)  
**Descrição:**
- Validação client-side de todos os formulários
- Validação server-side em edge functions
- Mensagens de erro amigáveis
- Prevenção de injeção de dados maliciosos

**Formulários a validar:**
- Cadastro/edição de perfil
- Criação de tratamento
- Registro de eventos
- Cadastro de medicamentos
- Todos os forms existentes

**Requisitos Técnicos:**
- Zod (já instalado)
- React Hook Form (já instalado)
- Schemas de validação
- Integração com todos os formulários

**Estimativa:** 3-4 dias de desenvolvimento

---

### 4. Relatórios Exportáveis
**Status:** Não implementado  
**Prioridade:** Média  
**Descrição:**
- Exportação de histórico médico completo (PDF)
- Relatório de tratamento para médicos
- Exportação de dados de wearables (CSV/Excel)
- Relatório de aderência
- Histórico de medicações

**Requisitos Técnicos:**
- Biblioteca de geração de PDF (react-pdf ou similar)
- Templates de relatórios médicos
- Edge function para geração server-side
- Formatação profissional ABNT/médica

**Estimativa:** 4-5 dias de desenvolvimento

---

### 5. Integração Real com Wearables
**Status:** Mock implementado  
**Prioridade:** Baixa (depende de APIs externas)  
**Descrição:**
- Integração com Google Fit API
- Integração com Apple HealthKit
- Integração com Fitbit API
- Integração com Garmin Connect
- OAuth flows para cada provedor
- Sincronização automática em background

**Requisitos Técnicos:**
- Credenciais de cada API
- OAuth 2.0 implementations
- Background sync jobs
- Rate limiting
- Tratamento de erros de API

**Estimativa:** 5-7 dias de desenvolvimento

---

### 6. Sistema de Backup Automático
**Status:** Não implementado  
**Prioridade:** Média  
**Descrição:**
- Backup automático de dados do usuário
- Restauração de dados
- Exportação para nuvem pessoal

**Estimativa:** 2-3 dias de desenvolvimento

---

### 7. Modo Offline
**Status:** Não implementado  
**Prioridade:** Média  
**Descrição:**
- Cache local de dados essenciais
- Sincronização quando online
- PWA service worker

**Estimativa:** 3-4 dias de desenvolvimento

---

### 8. Internacionalização (i18n)
**Status:** Não implementado  
**Prioridade:** Baixa  
**Descrição:**
- Suporte a múltiplos idiomas (PT-BR, EN, ES)
- Tradução de interface
- Formatação de datas/números por localidade

**Estimativa:** 2-3 dias de desenvolvimento

---

### 9. Sistema de Teleconsulta
**Status:** Não implementado  
**Prioridade:** Baixa  
**Descrição:**
- Agendamento de consultas virtuais
- Videoconferência integrada
- Chat com profissionais de saúde

**Estimativa:** 7-10 dias de desenvolvimento

---

### 10. IA para Análise de Sintomas
**Status:** Não implementado  
**Prioridade:** Baixa  
**Descrição:**
- Chatbot para registro de sintomas
- Sugestões baseadas em histórico
- Alertas inteligentes

**Estimativa:** 5-7 dias de desenvolvimento

---

### 11. Integração com Farmácias
**Status:** Não implementado  
**Prioridade:** Baixa  
**Descrição:**
- Pesquisa de preços de medicamentos
- Disponibilidade em farmácias próximas
- Sistema de delivery

**Estimativa:** 7-10 dias de desenvolvimento

---

### 12. Dashboard para Médicos
**Status:** Não implementado  
**Prioridade:** Média  
**Descrição:**
- Portal separado para profissionais de saúde
- Visualização de pacientes conectados
- Prescrição de tratamentos
- Acompanhamento remoto

**Estimativa:** 10-15 dias de desenvolvimento

---

## 🏗️ Infraestrutura Atual

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Shadcn UI
- **State Management:** React Query + Context API
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod
- **Mobile:** Capacitor (preparado)

### Backend (Supabase)
- **Database:** PostgreSQL
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (configurado mas não usado ainda)
- **Edge Functions:** Deno (4 functions implementadas)
- **RLS:** Totalmente implementado

### APIs Externas
- **OpenAI:** Extração de dados de medicamentos
- **Screenshot Services:** ScreenshotAPI, ScrapingBee, HTMLCSStoImage

### Segurança
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Rate limiting em edge functions
- ✅ Autenticação JWT
- ✅ CORS configurado
- ❌ Validação Zod (pendente)
- ❌ WAF (pendente migração AWS)
- ❌ Criptografia adicional (pendente)

---

## 📊 Tabelas do Banco de Dados

### Implementadas e em Uso
1. `profiles` - Perfis de usuário
2. `medications` - Catálogo de medicamentos
3. `user_medications` - Medicamentos do usuário
4. `oncology_meds` - Base de dados oncológicos
5. `treatment_plans` - Planos de tratamento
6. `treatment_cycles` - Ciclos de tratamento
7. `treatment_drugs` - Drogas do protocolo
8. `cycle_administrations` - Administrações realizadas
9. `cycle_support_prescriptions` - Medicações de suporte
10. `regimen_templates` - Templates de protocolos
11. `clinics` - Cadastro de clínicas
12. `clinic_responsible` - Responsáveis técnicos
13. `user_clinic_connections` - Conexões usuário-clínica
14. `events` - Eventos médicos
15. `user_events` - Eventos do usuário
16. `timeline_events` - Timeline de eventos
17. `reminders` - Lembretes
18. `user_stats` - Estatísticas do usuário
19. `wearable_connections` - Conexões com wearables
20. `wearable_metrics` - Métricas de saúde
21. `wearable_alerts` - Alertas de saúde

---

## 🚀 Plano de Migração AWS

### Fase 1: Setup Inicial (Econômico)
**Custo Estimado:** ~$1,800-2,200/mês (500 usuários)
- EC2 ou ECS Fargate (Single-AZ)
- RDS PostgreSQL (db.t4g.large, Single-AZ)
- S3 + CloudFront
- Route 53
- ElastiCache Redis (opcional)
- AWS Lambda para functions
- CloudWatch básico

### Fase 2: Alta Disponibilidade (Produção)
**Custo Estimado:** ~$5,600-8,400/mês (500+ usuários)
- Multi-AZ em todos os componentes
- RDS com Read Replica
- ECS Fargate Multi-AZ
- ElastiCache Multi-AZ
- AWS WAF
- AWS Shield Advanced
- CloudTrail + GuardDuty
- Backup automatizado
- DR (Disaster Recovery)

### Componentes da Migração
1. **Infraestrutura como Código (Terraform)**
2. **CI/CD Pipeline (GitHub Actions ou AWS CodePipeline)**
3. **Migração de Database (RDS)**
4. **Migração de Edge Functions (Lambda)**
5. **Migração de Storage (S3)**
6. **Configuração de DNS**
7. **SSL/TLS Certificates**
8. **Monitoring e Alertas**
9. **Backup e DR procedures**
10. **Documentação de runbooks**

---

## 📈 Priorização Recomendada

### Sprint 1 (1-2 semanas)
1. ✅ Validação Zod em todos os formulários (Segurança)
2. ✅ Gráficos de tendências de wearables (UX)

### Sprint 2 (1-2 semanas)
3. ✅ Notificações Push (Engajamento)
4. ✅ Relatórios exportáveis básicos (Utilidade)

### Sprint 3 (2-3 semanas)
5. ✅ Modo Offline básico (Resiliência)
6. ✅ Sistema de backup automático (Segurança)
7. ✅ Melhorias na página de tratamento

### Sprint 4+ (Após MVP estável)
8. Integração real com wearables
9. Dashboard para médicos
10. Teleconsulta
11. IA para análise de sintomas
12. Integração com farmácias

---

## 📝 Notas Importantes

### Conformidade LGPD/HIPAA
- ✅ Dados criptografados em trânsito (SSL)
- ✅ RLS implementado
- ⚠️ Necessário: Termo de consentimento explícito
- ⚠️ Necessário: Política de privacidade
- ⚠️ Necessário: Auditoria de acesso a dados
- ⚠️ Necessário: Processo de exclusão de dados
- ❌ Criptografia em repouso (pendente AWS KMS)

### Performance
- ✅ Queries otimizadas
- ✅ Indexes em tabelas principais
- ⚠️ Cache (ElastiCache pendente)
- ⚠️ CDN (CloudFront pendente)

### Monitoramento
- ⚠️ Logs básicos (console)
- ❌ APM (Application Performance Monitoring)
- ❌ Error tracking (Sentry ou similar)
- ❌ Analytics (Mixpanel ou similar)

---

## 🎯 Métricas de Sucesso

### Técnicas
- Uptime > 99.9%
- Tempo de resposta < 200ms (P95)
- Taxa de erro < 0.1%
- Cobertura de testes > 80% (não implementado)

### Produto
- Aderência ao tratamento
- Engajamento diário
- Retenção de usuários
- Satisfação (NPS)

---

**Última Atualização:** 2025-01-19  
**Versão do Documento:** 1.0
