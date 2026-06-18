# Planejamento — Painel Financeiro Administrativo WeSell

> Documento de planejamento para construção de um painel financeiro gerencial interno, baseado no conceito do "FinGerencial" e alinhado ao stack e aos padrões já consolidados na WeSell.

---

## 1. Objetivo

Construir um painel financeiro administrativo que dê à WeSell uma visão de gestão (não contábil) sobre a saúde financeira da empresa: quanto entra, quanto sai, quando entra/sai, por qual cliente/projeto, e qual a margem real de cada operação. O foco é **decisão**, não fechamento fiscal.

Três perguntas que o painel precisa responder a qualquer momento:

1. **Tenho dinheiro?** — saldo atual e projeção de caixa para os próximos 30/60/90 dias.
2. **Estou lucrando?** — receita x custo x margem por período, por cliente e por projeto.
3. **O que está atrasado?** — contas a receber vencidas, contas a pagar próximas, inadimplência.

Diferencial estratégico: como a WeSell é simultaneamente product builder e agência, o painel precisa tratar **receita recorrente (licenças/SaaS)** e **receita por projeto (entregas de agência)** como naturezas distintas, com MRR de um lado e margem-por-projeto do outro.

---

## 2. Stack técnica

Mantendo coerência com o CRM interno, para reaproveitar arquitetura, conhecimento de time e infraestrutura:

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind |
| Prototipagem/UI | Lovable |
| Backend / Banco | Supabase (Postgres + RLS + Auth + Edge Functions + Realtime) |
| Automação / integrações | n8n (webhooks de entrada e saída) |
| Gráficos | Recharts (ou Tremor, se quiser dashboard pronto) |

Sem backend separado: toda a lógica vive em Postgres (funções/triggers/RLS) + Edge Functions para o que precisar de segredo (chamadas a APIs bancárias, geração de relatórios pesados). Isso replica a decisão arquitetural que vocês já validaram no CRM.

---

## 3. Módulos funcionais

### 3.1 Dashboard (home)
A tela de abertura, com os KPIs de topo e os alertas. Segue a mesma filosofia do CRM (a home como centro de gravidade):

- **Cards de KPI**: saldo atual, receita do mês, despesa do mês, resultado do mês, MRR, ticket médio.
- **Fluxo de caixa projetado** (gráfico de linha/área): saldo realizado + projeção com base em contas a receber/pagar agendadas.
- **Alertas**: contas a receber vencidas, contas a pagar dos próximos 7 dias, clientes inadimplentes.
- **Receita por natureza**: recorrente (licenças) x pontual (projetos de agência).

### 3.2 Contas a receber
Lançamentos de entrada, com vínculo a cliente e projeto. Status (a receber / recebido / atrasado), data de vencimento, data de recebimento efetiva, forma de pagamento. Suporte a parcelamento e recorrência (assinaturas).

### 3.3 Contas a pagar
Espelho do anterior para saídas: fornecedores, ferramentas (assinaturas SaaS da própria WeSell), impostos, pró-labore, despesas de projeto. Recorrência para custos fixos.

### 3.4 Fluxo de caixa
A visão temporal de tudo: realizado x projetado, por dia/semana/mês. É aqui que mora a resposta "tenho dinheiro pro mês que vem?". Deve consolidar contas a receber + a pagar agendadas e o saldo inicial.

### 3.5 DRE gerencial
Demonstrativo de resultado simplificado para gestão (não o DRE contábil). Receita bruta → deduções (impostos sobre faturamento) → receita líquida → custos diretos → margem de contribuição → despesas fixas → resultado. Você já tem a base disso do projeto da farmácia; aqui é a versão própria da WeSell.

### 3.6 Centros de custo / Projetos e clientes
O módulo que diferencia uma agência de uma empresa comum. Cada receita e cada despesa pode ser alocada a um **cliente** e a um **projeto**. Isso permite calcular **margem por projeto** e **rentabilidade por cliente** — saber quais contratos realmente dão lucro depois de descontar horas e custos. Conecta diretamente com o que já é gerenciado no CRM.

### 3.7 Categorização
Plano de contas gerencial (categorias e subcategorias de receita e despesa) para classificar todo lançamento. Base para os relatórios e o DRE.

### 3.8 Relatórios e exportação
Filtros por período, cliente, projeto, categoria. Exportação para Excel/PDF. Aqui você reaproveita a experiência de DRE em Excel e dos dashboards de Looker.

### 3.9 (Opcional / fase futura) Multi-tenant
Se quiser seguir o padrão dual-use que já adotam, arquitetar desde o início com `org_id` em todas as tabelas e RLS por organização, permitindo licenciar o painel para clientes depois.

---

## 4. Modelo de dados (Supabase / Postgres)

Esqueleto inicial das tabelas. Todas com `id uuid default gen_random_uuid()`, `created_at`, `updated_at`, e (se multi-tenant) `org_id`.

```
organizations        -- (se multi-tenant) tenant raiz
profiles             -- usuários, vinculados a auth.users e a uma org
clients              -- clientes da WeSell (pode espelhar/integrar com o CRM)
projects             -- projetos vinculados a clientes
categories           -- plano de contas gerencial (tipo: receita|despesa, parent_id)
accounts             -- contas/carteiras (conta corrente, caixa, etc.)
transactions         -- lançamentos: o coração do sistema
recurrences          -- regras de recorrência (assinaturas, custos fixos)
```

**Tabela `transactions` (núcleo):**

| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| type | text | `receita` \| `despesa` |
| nature | text | `recorrente` \| `pontual` |
| amount | numeric(14,2) | valor |
| due_date | date | vencimento |
| paid_date | date null | data de efetivação (null = não realizado) |
| status | text | `previsto` \| `realizado` \| `atrasado` (derivável) |
| account_id | uuid | conta/carteira |
| category_id | uuid | plano de contas |
| client_id | uuid null | alocação a cliente |
| project_id | uuid null | alocação a projeto |
| recurrence_id | uuid null | se gerado por recorrência |
| description | text | |

Decisões de modelagem que valem a pena fixar cedo:

- **Status derivado, não duplicado**: `realizado` = `paid_date IS NOT NULL`; `atrasado` = `paid_date IS NULL AND due_date < today`. Evita inconsistência. Pode materializar numa coluna gerada ou numa view.
- **Recorrência gera lançamentos**, não os substitui: a regra em `recurrences` produz `transactions` previstos, que viram realizados quando pagos. Isso preserva o histórico real para o fluxo de caixa.
- **Numeric, nunca float** para dinheiro.

---

## 5. Arquitetura (padrão WeSell)

Reaproveitando o padrão de trigger unificada do CRM:

- **RLS por organização/usuário** em todas as tabelas desde o dia 1.
- **Trigger unificada** em `transactions`: ao inserir/atualizar, (a) atualiza agregados/saldo se você optar por materializar, e (b) dispara webhook de saída para o n8n (ex.: notificar no WhatsApp/Slack quando uma conta grande vence, ou quando um recebimento entra).
- **Edge Functions** para o que exige segredo ou processamento: integração com Open Finance (Pluggy/Belvo) para importar extrato bancário, geração de relatórios PDF, sincronização com o CRM.
- **Realtime** para o dashboard atualizar KPIs ao vivo quando um lançamento é registrado.
- **n8n** como hub de entrada: importação de extratos, leitura de notas fiscais, lembretes automáticos de cobrança, conciliação assistida.

---

## 6. Roadmap por fases

### Fase 1 — MVP (fundação)
Objetivo: substituir a planilha. Cadastro manual de lançamentos e visão básica.
- Auth + RLS + schema base (`transactions`, `categories`, `accounts`, `clients`, `projects`).
- CRUD de lançamentos (receber/pagar) com categoria, cliente e projeto.
- Dashboard com os KPIs essenciais (saldo, receita/despesa/resultado do mês).
- Lista de contas a receber e a pagar com status.

### Fase 2 — Gestão de caixa
- Fluxo de caixa projetado (realizado + previsto).
- Recorrências (assinaturas e custos fixos automáticos).
- Alertas de vencimento via n8n (WhatsApp/Slack).
- Filtros e exportação Excel/PDF.

### Fase 3 — Inteligência gerencial
- DRE gerencial completo.
- Margem por projeto e rentabilidade por cliente.
- MRR e separação recorrente x pontual.
- Integração com o CRM (clientes/projetos compartilhados).

### Fase 4 — Automação e escala
- Open Finance (importação automática de extrato) + conciliação assistida.
- Leitura automática de notas fiscais via n8n.
- Multi-tenant pronto para licenciamento (se for o caminho).

---

## 7. Considerações Brasil

Por ser painel gerencial e não contábil, o objetivo é refletir a realidade do regime tributário sem virar um ERP fiscal:

- **Simples Nacional**: registrar a alíquota efetiva como dedução sobre faturamento no DRE gerencial (campo de % por faixa, ou valor calculado). Você já mapeou as especificidades disso (Simples, ICMS-ST, PIS/COFINS) no projeto da farmácia — aqui a parte relevante é o DAS sobre o faturamento de serviço.
- **Regime de competência x caixa**: deixar claro qual visão o painel usa. Para gestão de caixa, regime de caixa (`paid_date`); para resultado, dá pra oferecer a visão de competência (`due_date`). Vale ter as duas.
- **Notas fiscais**: na fase de automação, o n8n pode capturar NFS-e emitidas e gerar lançamentos previstos automaticamente.

---

## 8. Próximo passo sugerido

Como vocês prototipam no Lovable, o caminho mais rápido é eu transformar a **Fase 1** num prompt estruturado de Lovable (schema Supabase + telas + lógica do dashboard), já com RLS e o padrão de trigger/webhook que vocês usam. A partir do MVP rodando, iteramos as fases seguintes.

Se você me passar um print da versão atual do FinGerencial, eu comparo os módulos e ajusto este planejamento para espelhar exatamente o que já existe antes de partir pro prompt.