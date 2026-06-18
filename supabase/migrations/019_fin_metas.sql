-- Metas de faturamento por cohort (mensal / trimestral / anual)
CREATE TABLE IF NOT EXISTS fin_metas_faturamento (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_cohort text NOT NULL CHECK (tipo_cohort IN ('mensal', 'trimestral', 'anual')),
  periodo text NOT NULL,          -- 'YYYY-MM' | 'YYYY-QN' | 'YYYY'
  valor_meta numeric(14,2) NOT NULL CHECK (valor_meta > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tipo_cohort, periodo)
);

ALTER TABLE fin_metas_faturamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fin_metas_authenticated" ON fin_metas_faturamento
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER fin_metas_updated_at BEFORE UPDATE ON fin_metas_faturamento
  FOR EACH ROW EXECUTE FUNCTION fin_set_updated_at();
