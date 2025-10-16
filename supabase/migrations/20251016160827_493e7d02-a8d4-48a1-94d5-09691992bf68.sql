-- Create treatment_plans table
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Identificação do tratamento
  diagnosis_cid TEXT,
  line_of_therapy TEXT NOT NULL,
  treatment_intent TEXT NOT NULL,
  regimen_name TEXT NOT NULL,
  
  -- Parâmetros do plano
  planned_cycles INTEGER NOT NULL,
  periodicity_days INTEGER NOT NULL,
  
  -- Parâmetros do paciente
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  bsa_m2 DECIMAL(4,2),
  
  -- Critérios de liberação
  anc_min INTEGER DEFAULT 1500,
  plt_min INTEGER DEFAULT 100000,
  scr_max DECIMAL(4,2) DEFAULT 1.5,
  ast_alt_max_xuln DECIMAL(4,2) DEFAULT 2.5,
  
  -- Status
  status TEXT DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Metadados
  prescriber_id UUID,
  clinic_id UUID REFERENCES clinics(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own treatment plans"
  ON treatment_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create treatment plans"
  ON treatment_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own treatment plans"
  ON treatment_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own treatment plans"
  ON treatment_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Create treatment_drugs table
CREATE TABLE treatment_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE NOT NULL,
  
  drug_name TEXT NOT NULL,
  oncology_med_id UUID REFERENCES oncology_meds(id),
  
  reference_dose DECIMAL(10,2) NOT NULL,
  dose_unit TEXT NOT NULL,
  
  route TEXT NOT NULL,
  diluent TEXT,
  volume_ml INTEGER,
  infusion_time_min INTEGER,
  
  day_codes TEXT[] NOT NULL,
  sequence_order INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE treatment_drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view drugs of their treatment plans"
  ON treatment_drugs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans
      WHERE treatment_plans.id = treatment_drugs.treatment_plan_id
      AND treatment_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage drugs of their treatment plans"
  ON treatment_drugs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans
      WHERE treatment_plans.id = treatment_drugs.treatment_plan_id
      AND treatment_plans.user_id = auth.uid()
    )
  );

-- Create treatment_cycles table
CREATE TABLE treatment_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE NOT NULL,
  
  cycle_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  actual_date DATE,
  
  anc_value INTEGER,
  plt_value INTEGER,
  scr_value DECIMAL(4,2),
  ast_value INTEGER,
  alt_value INTEGER,
  bilirubin_value DECIMAL(4,2),
  
  release_status TEXT NOT NULL DEFAULT 'pending',
  release_decision_by UUID,
  release_decision_at TIMESTAMPTZ,
  delay_reason TEXT,
  
  dose_adjustments JSONB,
  
  status TEXT DEFAULT 'scheduled',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE treatment_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their treatment cycles"
  ON treatment_cycles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans
      WHERE treatment_plans.id = treatment_cycles.treatment_plan_id
      AND treatment_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their treatment cycles"
  ON treatment_cycles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans
      WHERE treatment_plans.id = treatment_cycles.treatment_plan_id
      AND treatment_plans.user_id = auth.uid()
    )
  );

-- Create cycle_administrations table
CREATE TABLE cycle_administrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES treatment_cycles(id) ON DELETE CASCADE NOT NULL,
  drug_id UUID REFERENCES treatment_drugs(id) NOT NULL,
  
  day_code TEXT NOT NULL,
  administration_date DATE NOT NULL,
  
  calculated_dose_mg DECIMAL(10,2) NOT NULL,
  actual_dose_mg DECIMAL(10,2),
  
  start_time TIME,
  end_time TIME,
  administered_by UUID,
  
  adverse_reactions JSONB,
  
  batch_number TEXT,
  expiry_date DATE,
  
  status TEXT DEFAULT 'pending',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cycle_administrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their cycle administrations"
  ON cycle_administrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM treatment_cycles tc
      JOIN treatment_plans tp ON tp.id = tc.treatment_plan_id
      WHERE tc.id = cycle_administrations.cycle_id
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their cycle administrations"
  ON cycle_administrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM treatment_cycles tc
      JOIN treatment_plans tp ON tp.id = tc.treatment_plan_id
      WHERE tc.id = cycle_administrations.cycle_id
      AND tp.user_id = auth.uid()
    )
  );

-- Create cycle_support_prescriptions table
CREATE TABLE cycle_support_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES treatment_cycles(id) ON DELETE CASCADE NOT NULL,
  
  medication_name TEXT NOT NULL,
  category TEXT,
  
  dose TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  
  instructions TEXT,
  alert_signs TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cycle_support_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their support prescriptions"
  ON cycle_support_prescriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM treatment_cycles tc
      JOIN treatment_plans tp ON tp.id = tc.treatment_plan_id
      WHERE tc.id = cycle_support_prescriptions.cycle_id
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their support prescriptions"
  ON cycle_support_prescriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM treatment_cycles tc
      JOIN treatment_plans tp ON tp.id = tc.treatment_plan_id
      WHERE tc.id = cycle_support_prescriptions.cycle_id
      AND tp.user_id = auth.uid()
    )
  );

-- Create regimen_templates table
CREATE TABLE regimen_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL UNIQUE,
  full_name TEXT,
  description TEXT,
  
  typical_cycles INTEGER,
  typical_periodicity_days INTEGER,
  
  cancer_types TEXT[],
  line_of_therapy TEXT[],
  
  drugs_template JSONB NOT NULL,
  typical_support JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE regimen_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by authenticated users"
  ON regimen_templates FOR SELECT
  TO authenticated
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_cycles_updated_at
  BEFORE UPDATE ON treatment_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regimen_templates_updated_at
  BEFORE UPDATE ON regimen_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data: Common regimen templates
INSERT INTO regimen_templates (name, full_name, description, typical_cycles, typical_periodicity_days, cancer_types, line_of_therapy, drugs_template, typical_support)
VALUES
  (
    'FOLFOX',
    'Oxaliplatina + Leucovorin + 5-FU',
    'Protocolo para câncer colorretal',
    12,
    14,
    ARRAY['colorectal'],
    ARRAY['1st', '2nd'],
    '[
      {"name": "Oxaliplatina", "ref_dose": 85, "dose_unit": "mg/m2", "route": "IV", "diluent": "SG5", "volume_ml": 500, "infusion_time_min": 120, "day_codes": ["D1"], "sequence_order": 1},
      {"name": "Leucovorin", "ref_dose": 400, "dose_unit": "mg/m2", "route": "IV", "diluent": "SF", "volume_ml": 250, "infusion_time_min": 120, "day_codes": ["D1"], "sequence_order": 2},
      {"name": "5-Fluorouracil (bolus)", "ref_dose": 400, "dose_unit": "mg/m2", "route": "IV", "diluent": "SF", "volume_ml": 50, "infusion_time_min": 15, "day_codes": ["D1"], "sequence_order": 3},
      {"name": "5-Fluorouracil (infusão)", "ref_dose": 2400, "dose_unit": "mg/m2", "route": "IV", "diluent": "SF", "volume_ml": 1000, "infusion_time_min": 2880, "day_codes": ["D1"], "sequence_order": 4}
    ]'::jsonb,
    '[
      {"name": "Ondansetrona", "dose": "8 mg", "frequency": "12/12h", "duration": "2 dias", "category": "antiemetic"},
      {"name": "Dexametasona", "dose": "4 mg", "frequency": "8/8h", "duration": "3 dias", "category": "corticosteroid"}
    ]'::jsonb
  ),
  (
    'AC-T',
    'Adriamicina/Ciclofosfamida → Paclitaxel',
    'Protocolo adjuvante para câncer de mama',
    8,
    14,
    ARRAY['breast'],
    ARRAY['adjuvant'],
    '[
      {"name": "Doxorrubicina (Adriamicina)", "ref_dose": 60, "dose_unit": "mg/m2", "route": "IV", "diluent": "SF", "volume_ml": 250, "infusion_time_min": 30, "day_codes": ["D1"], "sequence_order": 1},
      {"name": "Ciclofosfamida", "ref_dose": 600, "dose_unit": "mg/m2", "route": "IV", "diluent": "SG5", "volume_ml": 500, "infusion_time_min": 60, "day_codes": ["D1"], "sequence_order": 2}
    ]'::jsonb,
    '[
      {"name": "Ondansetrona", "dose": "8 mg", "frequency": "12/12h", "duration": "2 dias", "category": "antiemetic"},
      {"name": "Filgrastim (G-CSF)", "dose": "300 mcg", "frequency": "1x/dia", "duration": "começar D3 até recuperação", "category": "g_csf"}
    ]'::jsonb
  );