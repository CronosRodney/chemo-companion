-- Update FOLFOX template with correct drug_name field
UPDATE regimen_templates
SET drugs_template = '[
  {
    "drug_name": "Oxaliplatina",
    "reference_dose": 85,
    "dose_unit": "mg/m²",
    "route": "IV",
    "day_codes": ["D1"],
    "diluent": "SG5%",
    "volume_ml": 250,
    "infusion_time_min": 120,
    "sequence_order": 1
  },
  {
    "drug_name": "Leucovorina",
    "reference_dose": 400,
    "dose_unit": "mg/m²",
    "route": "IV",
    "day_codes": ["D1"],
    "diluent": "SG5%",
    "volume_ml": 250,
    "infusion_time_min": 120,
    "sequence_order": 2
  },
  {
    "drug_name": "5-Fluorouracil",
    "reference_dose": 400,
    "dose_unit": "mg/m²",
    "route": "IV bolus",
    "day_codes": ["D1"],
    "sequence_order": 3
  },
  {
    "drug_name": "5-Fluorouracil",
    "reference_dose": 2400,
    "dose_unit": "mg/m²",
    "route": "IV infusão contínua",
    "day_codes": ["D1-D2"],
    "infusion_time_min": 2880,
    "sequence_order": 4
  }
]'::jsonb
WHERE name = 'FOLFOX';

-- Update AC-T template with correct drug_name field
UPDATE regimen_templates
SET drugs_template = '[
  {
    "drug_name": "Doxorrubicina",
    "reference_dose": 60,
    "dose_unit": "mg/m²",
    "route": "IV",
    "day_codes": ["D1"],
    "diluent": "SF 0,9%",
    "volume_ml": 100,
    "infusion_time_min": 15,
    "sequence_order": 1
  },
  {
    "drug_name": "Ciclofosfamida",
    "reference_dose": 600,
    "dose_unit": "mg/m²",
    "route": "IV",
    "day_codes": ["D1"],
    "diluent": "SF 0,9%",
    "volume_ml": 250,
    "infusion_time_min": 30,
    "sequence_order": 2
  }
]'::jsonb
WHERE name = 'AC-T';

-- Delete duplicate treatment plans, keeping only the oldest one per user/regimen
DELETE FROM treatment_plans
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, regimen_name 
             ORDER BY created_at ASC
           ) as rn
    FROM treatment_plans
  ) t
  WHERE t.rn > 1
);