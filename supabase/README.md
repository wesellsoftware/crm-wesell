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

## Boards

| Slug | Route |
|------|-------|
| contatos | `/boards/contatos` |
| negociacoes | `/boards/negociacoes` |
| leads | `/boards/leads` |
| contas | `/boards/contas` |

Legacy routes (`/funil`, `/contatos`, `/negocios/[id]`) redirect to the new boards.
