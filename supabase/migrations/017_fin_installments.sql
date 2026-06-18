-- Parcelamento de lançamentos financeiros

ALTER TABLE fin_transactions
  ADD COLUMN IF NOT EXISTS installment_group_id uuid,
  ADD COLUMN IF NOT EXISTS installment_number integer,
  ADD COLUMN IF NOT EXISTS installment_count integer;

ALTER TABLE fin_transactions DROP CONSTRAINT IF EXISTS fin_transactions_nature_check;
ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_nature_check
  CHECK (nature IN ('recorrente', 'pontual', 'parcelado'));

ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_installment_consistency
  CHECK (
    (installment_group_id IS NULL AND installment_number IS NULL AND installment_count IS NULL)
    OR (
      installment_group_id IS NOT NULL
      AND installment_number IS NOT NULL
      AND installment_count IS NOT NULL
      AND installment_number >= 1
      AND installment_number <= installment_count
      AND installment_count >= 2
    )
  );

CREATE INDEX IF NOT EXISTS fin_tx_installment_group_idx ON fin_transactions(installment_group_id);
