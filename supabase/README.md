# Board Engine Migration

Run this SQL against your Supabase project to enable the monday.com-style board system:

```bash
# Option 1: Supabase CLI (if linked)
supabase db push

# Option 2: Copy contents of supabase/migrations/001_board_engine.sql
# into Supabase Dashboard → SQL Editor → Run
```

After migration, boards are auto-seeded on first visit to any `/boards/*` route.

Migrations applied:
1. `001_board_engine.sql` — tables + RLS
2. `002_seed_boards_function.sql` — `seed_organization_boards()` function + signup hook
3. `010_webhooks_and_lead_form_columns.sql` — webhooks n8n + colunas do formulário de leads
4. `011_organization_feed_events.sql` — feed global de atividades do CRM (`organization_feed_events`)

## Integrações (API + Webhooks)

Variáveis de ambiente necessárias no `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
LEADS_API_KEY=uma-chave-secreta-forte
LEADS_ORGANIZATION_ID=uuid-da-organizacao   # opcional se houver só uma org
LEADS_CORS_ORIGIN=https://wsqualify.lovable.app   # opcional, padrão *
```

Endpoint público para o formulário do site:

```
POST /api/leads
Header: x-api-key: <LEADS_API_KEY>
Content-Type: application/json
```

Webhooks n8n são configurados em **Configurações → Integrações**.

## Boards

| Slug | Route |
|------|-------|
| contatos | `/boards/contatos` |
| negociacoes | `/boards/negociacoes` |
| leads | `/boards/leads` |
| contas | `/boards/contas` |

Legacy routes (`/funil`, `/contatos`, `/negocios/[id]`) redirect to the new boards.
