-- Remove a constraint antiga que não inclui exam e adverse_event
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;

-- Adiciona a constraint atualizada com todos os tipos necessários
ALTER TABLE events ADD CONSTRAINT events_event_type_check 
  CHECK (event_type = ANY (ARRAY[
    'appointment'::text,
    'medication'::text,
    'mood'::text,
    'symptom'::text,
    'exam'::text,
    'adverse_event'::text,
    'other'::text
  ]));