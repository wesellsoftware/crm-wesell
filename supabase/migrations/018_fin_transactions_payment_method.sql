-- Forma de pagamento dos lançamentos financeiros

ALTER TABLE fin_transactions
  ADD COLUMN IF NOT EXISTS payment_method text;

ALTER TABLE fin_transactions DROP CONSTRAINT IF EXISTS fin_transactions_payment_method_check;
ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('pix', 'boleto', 'credito', 'debito'));

CREATE INDEX IF NOT EXISTS fin_tx_payment_method_idx ON fin_transactions(payment_method);
