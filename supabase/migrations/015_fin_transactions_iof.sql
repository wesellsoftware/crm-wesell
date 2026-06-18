-- IOF em compras internacionais (despesas)
ALTER TABLE fin_transactions
  ADD COLUMN IF NOT EXISTS is_international_purchase boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS iof_amount numeric(14,2) CHECK (iof_amount IS NULL OR iof_amount >= 0);
