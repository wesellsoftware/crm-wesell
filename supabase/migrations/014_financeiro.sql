-- Painel Financeiro Administrativo WeSell
-- Internal use only. RLS: authenticated users (admin gate enforced at app layer).

-- Financial accounts (bank accounts / wallets)
CREATE TABLE IF NOT EXISTS fin_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  balance_initial numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Chart of accounts (plano de contas gerencial, hierarchical via parent_id)
CREATE TABLE IF NOT EXISTS fin_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('receita', 'despesa')),
  parent_id uuid REFERENCES fin_categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Recurrence rules: define monthly recurring income/expenses
CREATE TABLE IF NOT EXISTS fin_recurrences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  description text NOT NULL,
  amount numeric(14,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('receita', 'despesa')),
  category_id uuid REFERENCES fin_categories(id) ON DELETE SET NULL,
  client_id uuid REFERENCES board_items(id) ON DELETE SET NULL,
  project_id uuid REFERENCES board_items(id) ON DELETE SET NULL,
  day_of_month integer NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 28),
  start_date date NOT NULL,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Core transactions table
CREATE TABLE IF NOT EXISTS fin_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('receita', 'despesa')),
  nature text NOT NULL DEFAULT 'pontual' CHECK (nature IN ('recorrente', 'pontual')),
  description text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  paid_date date,
  account_id uuid REFERENCES fin_accounts(id) ON DELETE SET NULL,
  category_id uuid REFERENCES fin_categories(id) ON DELETE SET NULL,
  client_id uuid REFERENCES board_items(id) ON DELETE SET NULL,
  project_id uuid REFERENCES board_items(id) ON DELETE SET NULL,
  recurrence_id uuid REFERENCES fin_recurrences(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS fin_tx_type_idx ON fin_transactions(type);
CREATE INDEX IF NOT EXISTS fin_tx_due_date_idx ON fin_transactions(due_date);
CREATE INDEX IF NOT EXISTS fin_tx_paid_date_idx ON fin_transactions(paid_date);
CREATE INDEX IF NOT EXISTS fin_tx_deleted_at_idx ON fin_transactions(deleted_at);
CREATE INDEX IF NOT EXISTS fin_tx_recurrence_idx ON fin_transactions(recurrence_id);

-- RLS
ALTER TABLE fin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fin_accounts_authenticated" ON fin_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fin_categories_authenticated" ON fin_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fin_recurrences_authenticated" ON fin_recurrences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fin_transactions_authenticated" ON fin_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- updated_at triggers
CREATE OR REPLACE FUNCTION fin_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER fin_recurrences_updated_at BEFORE UPDATE ON fin_recurrences
  FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();
CREATE TRIGGER fin_transactions_updated_at BEFORE UPDATE ON fin_transactions
  FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();

-- Seed: default account
INSERT INTO fin_accounts (name, balance_initial) VALUES ('Conta Principal', 0);

-- Seed: starter categories
INSERT INTO fin_categories (name, type) VALUES
  ('Licença / SaaS', 'receita'),
  ('Projeto de Agência', 'receita'),
  ('Consultoria', 'receita'),
  ('Outras Receitas', 'receita'),
  ('Pró-labore', 'despesa'),
  ('Ferramentas SaaS', 'despesa'),
  ('Fornecedores / Freelancers', 'despesa'),
  ('Impostos (DAS)', 'despesa'),
  ('Marketing', 'despesa'),
  ('Infraestrutura', 'despesa'),
  ('Outros', 'despesa');
