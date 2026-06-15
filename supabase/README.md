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
5. `012_invite_members.sql` — convite de colaboradores ao espaço existente (`handle_new_user` join por `organization_id`)
6. `013_ensure_auth_user_trigger.sql` — trigger `on_auth_user_created` em `auth.users`

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

## Convite de membros

Admins convidam colaboradores em **Configurações → Membros**. O convidado recebe e-mail, define senha e entra no **mesmo espaço** (boards compartilhados).

**Papéis:**
- **Admin** — quem cria o espaço em `/signup`
- **Colaborador** — padrão em todo convite por e-mail

**Variáveis de ambiente** (já necessárias para convites e links de e-mail):

```env
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_SITE_URL=https://crm.wesellsoftware.com.br   # produção (VPS)
# NEXT_PUBLIC_SITE_URL=http://localhost:3000               # desenvolvimento local
```

**Supabase Dashboard → Authentication → URL Configuration:**

| Campo | Valor |
|-------|-------|
| Site URL | `https://crm.wesellsoftware.com.br` (raiz do domínio, **sem** `/login`) |
| Redirect URLs | `https://crm.wesellsoftware.com.br/auth/callback` |
| | `https://crm.wesellsoftware.com.br/auth/confirm` |
| | `https://crm.wesellsoftware.com.br/**` (wildcard, se disponível) |
| | `http://localhost:3000/auth/callback` (dev local) |

**Importante:** use `redirectTo` apenas como `/auth/callback` (sem query string). O app detecta convites pendentes pelo metadata do usuário.

**OTP / link expirado (`otp_expired`):** em Authentication → Providers → Email, aumente o tempo de expiração do OTP se necessário. Links de convite são de uso único — se expirarem, o admin deve reenviar em Configurações → Membros (botão de reenviar convite).

Recuperação de senha e convites passam por `/auth/callback` (com `type=recovery` para reset de senha).

**Migrations obrigatórias para convites:**
- `012_invite_members.sql` — branch de convite no `handle_new_user`
- `013_ensure_auth_user_trigger.sql` — garante trigger `on_auth_user_created` no `auth.users`

**Limitação v1:** convite só funciona para e-mails **sem conta** no CRM. Se a pessoa já se cadastrou, o admin verá erro ao convidar.

Opcional: personalize o template **Invite user** em Authentication → Email Templates.

## Boards

| Slug | Route |
|------|-------|
| contatos | `/boards/contatos` |
| negociacoes | `/boards/negociacoes` |
| leads | `/boards/leads` |
| contas | `/boards/contas` |

Legacy routes (`/funil`, `/contatos`, `/negocios/[id]`) redirect to the new boards.
