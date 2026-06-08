# WeSell CRM — Roadmap de Desenvolvimento

## Status Atual
| Fase | Descrição | Status |
|------|-----------|--------|
| Fase 1 | Tema, fontes, login UI, estrutura de rotas | ✅ Concluída |
| Fase 2 | Supabase Auth + schema do banco | ✅ Concluída |
| Fase 3 | Recuperação de senha, confirm password, logos | ✅ Concluída |
| Fase 4 | Glass UI completo (auth pages, app layout, sidebar, dashboard placeholder) | ✅ Concluída |
| Fase 5 | Dashboard (KPIs, gráfico por etapa, atividades recentes, fechamentos próximos) | ✅ Concluída |
| Fase 6 | Funil Kanban (dnd-kit, optimistic update, modal criar negócio, Server Actions) | ✅ Concluída |
| Fase 7 | Contatos (lista, busca, detalhe, histórico de negócios/atividades) | ✅ Concluída |
| Fase 8 | Negócios (detalhe, timeline de atividades, marcar ganho/perdido) | ✅ Concluída |
| Fase 9 | Atividades (lista com filtros tipo/status, toggle concluída, nova atividade) | ✅ Concluída |
| Fase 10 | Configurações (perfil, organização, membros, etapas do funil) | ✅ Concluída |
| Fase 11 | Relatórios (KPIs, gráficos ganhos/perdidos e pipeline por etapa, tabela mensal) | ✅ Concluída |

---

## Fase 4 — Glass UI ✅ CONCLUÍDA

### Entregues
- [x] Login page — gradiente escuro + orbs + card glass-light no formulário, aside glass-dark
- [x] Signup page — gradiente escuro + orbs + aside azul glass + card glass-light
- [x] Recuperar senha / Nova senha — gradiente + orbs + card glass-light centralizado
- [x] Dashboard placeholder — layout glass com cards KPI, gráfico e atividades
- [x] App layout — gradiente + orbs + sidebar glass-dark
- [x] Tokens `.glass`, `.glass-dark`, `.glass-light`, `.glass-input` em `globals.css`

---

## Fase 5 — Dashboard ✅ CONCLUÍDA

### Entregues
- [x] KPI cards: negócios abertos, valor em pipeline, ganhos no mês, taxa de conversão
- [x] Gráfico BarChart por etapa (recharts, client component, dados reais)
- [x] Lista de atividades recentes (últimas 5, tipo + negócio vinculado)
- [x] Tabela de negócios com fechamento nos próximos 7 dias
- [x] Saudação com nome do usuário + data atual (server component)
- [x] Todas as queries via Supabase RLS com Promise.all paralelo
- [x] Botão Sair da sidebar ligado ao logout Server Action

---

## Fase 6 — Funil (Kanban)
**Objetivo:** Board Kanban drag-and-drop para gerenciar negócios por etapa.

### Tarefas
- [ ] Buscar etapas da organização (`stages` table)
- [ ] Buscar negócios por etapa (`deals` table com JOIN)
- [ ] Renderizar colunas Kanban com cards de negócio
- [ ] Drag-and-drop entre etapas (dnd-kit — já instalado)
- [ ] Server Action: mover negócio de etapa (UPDATE `deals.stage_id`)
- [ ] Otimistic update no cliente (evitar flicker)
- [ ] Modal: criar novo negócio (título, valor, contato, etapa, data de fechamento)
- [ ] Filtros: por responsável, por status (open/won/lost)
- [ ] Card de negócio: título, valor, contato, avatar, dias em etapa

---

## Fase 7 — Contatos
**Objetivo:** CRUD completo de contatos da organização.

### Tarefas
- [ ] Listagem paginada de contatos (tabela com busca)
- [ ] Filtros: por empresa, por responsável
- [ ] Modal/sheet: criar contato (nome, email, telefone, empresa, notas)
- [ ] Página de detalhe do contato (`/contatos/[id]`)
  - [ ] Header com avatar, nome, empresa
  - [ ] Histórico de negócios vinculados
  - [ ] Histórico de atividades vinculadas
  - [ ] Botão editar / excluir (admin)
- [ ] Server Actions: criar, editar, excluir contato
- [ ] Upload de avatar (Supabase Storage)

---

## Fase 8 — Negócios (Deals)
**Objetivo:** Página de detalhe de negócio com todas as informações e histórico.

### Tarefas
- [ ] Página `/negocios/[id]`
  - [ ] Header: título, valor, etapa atual, status (badge), contato vinculado
  - [ ] Sidebar de detalhes: responsável, data de fechamento prevista, criado em
  - [ ] Timeline de atividades vinculadas
  - [ ] Formulário inline para adicionar atividade/nota
- [ ] Server Actions: editar negócio, mudar status (won/lost), excluir
- [ ] Marcar como ganho/perdido com modal de confirmação
- [ ] Etapa atual editável inline (select)

---

## Fase 9 — Atividades
**Objetivo:** Central de atividades com lista e criação rápida.

### Tarefas
- [ ] Lista de atividades da organização com filtros
  - [ ] Filtros: tipo (call/email/meeting/task/note), status (pendente/concluída), responsável
  - [ ] Ordenação por due_at
- [ ] Badge de contagem de atividades vencidas no nav
- [ ] Modal: criar atividade (tipo, título, descrição, negócio, contato, data/hora)
- [ ] Marcar atividade como concluída (toggle `completed_at`)
- [ ] Server Actions: criar, editar, concluir, excluir atividade

---

## Fase 10 — Configurações
**Objetivo:** Gerenciar organização, usuários e etapas do funil.

### Tarefas

#### Perfil
- [ ] Editar nome e avatar do usuário logado
- [ ] Trocar senha (via Supabase Auth `updateUser`)

#### Organização
- [ ] Editar nome da organização
- [ ] Convidar membros por e-mail (Supabase Auth `inviteUserByEmail`)
- [ ] Listar membros com papéis (admin/member)
- [ ] Promover/remover membro (admin only)

#### Funil
- [ ] Listar etapas com drag-and-drop para reordenar
- [ ] Criar nova etapa (nome, cor)
- [ ] Editar etapa (nome, cor)
- [ ] Excluir etapa (com confirmação — negócios vinculados ficam sem etapa)

---

## Fase 11 — Relatórios
**Objetivo:** Visão analítica do pipeline e performance da equipe.

### Tarefas
- [ ] Gráfico de negócios ganhos/perdidos por mês (últimos 6 meses)
- [ ] Valor total por etapa (funil visual)
- [ ] Taxa de conversão por etapa
- [ ] Ranking de responsáveis (negócios ganhos, valor total)
- [ ] Filtro de período (recharts — AreaChart, BarChart)
- [ ] Export para CSV (contacts, deals)

---

## Fase 12 — Melhorias de UX e Polish
**Objetivo:** Refinar experiência e performance.

### Tarefas
- [ ] Loading skeletons em todas as listas
- [ ] Toast notifications (feedback de ações)
- [ ] Sidebar responsiva (sheet em mobile)
- [ ] Empty states ilustrados para listas vazias
- [ ] Busca global (contatos + negócios)
- [ ] Atalhos de teclado (Ctrl+K para busca, etc.)
- [ ] Otimização de imagens e lazy loading
- [ ] Testes E2E críticos (login, criar negócio, mover no funil)

---

## Stack Técnica
| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Banco de dados | Supabase (PostgreSQL + Auth + Storage) |
| UI | Tailwind CSS v4 + shadcn + glassmorphism |
| Drag-and-drop | dnd-kit |
| Gráficos | recharts |
| Fontes | Coolvetica (display) + Bree Serif (body) + JetBrains Mono |
| Ícones | lucide-react |

---

## Banco de Dados (schema atual)
| Tabela | Descrição |
|--------|-----------|
| `organizations` | Multi-tenant — cada conta tem uma org |
| `profiles` | Usuários com papel (admin/member) vinculados à org |
| `stages` | Etapas do funil da organização |
| `contacts` | Contatos da organização |
| `deals` | Negócios vinculados a contato + etapa + responsável |
| `activities` | Atividades vinculadas a negócio e/ou contato |

Todas as tabelas têm RLS habilitado. Trigger `on_auth_user_created` cria org + perfil + 5 etapas padrão no signup.

---

## Convenções do Projeto
- **Server Actions** para todas as mutações (`'use server'` em `app/actions/`)
- **Server Components** para leitura de dados (sem `useEffect` + fetch)
- **`lib/supabase/server.ts`** para queries server-side
- **`lib/supabase/client.ts`** para interações client-side
- **`proxy.ts`** para proteção de rotas (Next.js 16)
- Rotas protegidas: tudo exceto `/`, `/login`, `/signup`, `/recuperar-senha`, `/auth/*`
