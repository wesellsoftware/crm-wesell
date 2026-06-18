-- Contas bancárias padrão
INSERT INTO fin_accounts (name, balance_initial)
SELECT name, 0
FROM (VALUES ('C6 Bank'), ('Nubank'), ('Asaas')) AS banks(name)
WHERE NOT EXISTS (
  SELECT 1 FROM fin_accounts a WHERE a.name = banks.name
);
