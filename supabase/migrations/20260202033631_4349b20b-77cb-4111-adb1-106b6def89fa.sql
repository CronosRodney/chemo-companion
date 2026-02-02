-- Adicionar constraint única para permitir upsert correto
ALTER TABLE patient_doctor_connections 
ADD CONSTRAINT unique_patient_doctor 
UNIQUE (patient_user_id, doctor_user_id);