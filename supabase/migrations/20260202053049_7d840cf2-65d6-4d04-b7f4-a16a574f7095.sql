-- Tabela de resultados de exames laboratoriais
-- Fonte única de verdade para médico e paciente (permissões iguais)

CREATE TABLE public.lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  created_by_id UUID NOT NULL,
  created_by_role TEXT NOT NULL CHECK (created_by_role IN ('doctor', 'patient')),
  
  -- Dados do exame
  exam_type TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  result_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'canceled')),
  
  -- Resultados estruturados (para marcadores comuns)
  anc_value INTEGER,
  plt_value INTEGER,
  scr_value NUMERIC(5,2),
  ast_value INTEGER,
  alt_value INTEGER,
  bilirubin_value NUMERIC(5,2),
  hemoglobin_value NUMERIC(4,1),
  wbc_value INTEGER,
  
  -- Resultados genéricos (para outros exames)
  results JSONB,
  notes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_lab_results_updated_at
  BEFORE UPDATE ON public.lab_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

-- RLS: Pacientes podem gerenciar seus próprios exames
CREATE POLICY "Patients can manage their own lab results"
  ON public.lab_results
  FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- RLS: Médicos com vínculo ativo podem gerenciar exames de seus pacientes
CREATE POLICY "Doctors can manage connected patient lab results"
  ON public.lab_results
  FOR ALL
  USING (doctor_has_patient_access(auth.uid(), patient_id))
  WITH CHECK (doctor_has_patient_access(auth.uid(), patient_id));

-- Índices para performance
CREATE INDEX idx_lab_results_patient_id ON public.lab_results(patient_id);
CREATE INDEX idx_lab_results_created_by ON public.lab_results(created_by_id);
CREATE INDEX idx_lab_results_status ON public.lab_results(status);
CREATE INDEX idx_lab_results_exam_type ON public.lab_results(exam_type);