-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'patient');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Healthcare professionals table
CREATE TABLE public.healthcare_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  crm TEXT,
  crm_uf TEXT,
  specialty TEXT,
  clinic_id UUID REFERENCES public.clinics(id),
  is_verified BOOLEAN DEFAULT false,
  verification_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.healthcare_professionals ENABLE ROW LEVEL SECURITY;

-- Professionals can view and update their own record
CREATE POLICY "Professionals can view their own record"
  ON public.healthcare_professionals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Professionals can update their own record"
  ON public.healthcare_professionals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register as professionals"
  ON public.healthcare_professionals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Patient-Doctor connections
CREATE TABLE public.patient_doctor_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id UUID NOT NULL,
  doctor_user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (patient_user_id, doctor_user_id)
);

ALTER TABLE public.patient_doctor_connections ENABLE ROW LEVEL SECURITY;

-- Patients can view their connections
CREATE POLICY "Patients can view their connections"
  ON public.patient_doctor_connections FOR SELECT
  USING (auth.uid() = patient_user_id);

-- Doctors can view their connections
CREATE POLICY "Doctors can view their connections"
  ON public.patient_doctor_connections FOR SELECT
  USING (auth.uid() = doctor_user_id);

-- Doctors can create connections (invites)
CREATE POLICY "Doctors can create connections"
  ON public.patient_doctor_connections FOR INSERT
  WITH CHECK (auth.uid() = doctor_user_id AND public.has_role(auth.uid(), 'doctor'));

-- Both parties can update connection status
CREATE POLICY "Patients can update connection status"
  ON public.patient_doctor_connections FOR UPDATE
  USING (auth.uid() = patient_user_id);

CREATE POLICY "Doctors can update connection status"
  ON public.patient_doctor_connections FOR UPDATE
  USING (auth.uid() = doctor_user_id);

-- Doctor notes table
CREATE TABLE public.doctor_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.patient_doctor_connections(id) ON DELETE CASCADE,
  doctor_user_id UUID NOT NULL,
  patient_user_id UUID NOT NULL,
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'observation' CHECK (note_type IN ('consultation', 'observation', 'alert', 'prescription')),
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.doctor_notes ENABLE ROW LEVEL SECURITY;

-- Doctors can manage their own notes
CREATE POLICY "Doctors can manage their notes"
  ON public.doctor_notes FOR ALL
  USING (auth.uid() = doctor_user_id);

-- Patients can view non-private notes about them
CREATE POLICY "Patients can view their notes"
  ON public.doctor_notes FOR SELECT
  USING (auth.uid() = patient_user_id AND is_private = false);

-- Connection invites table
CREATE TABLE public.connection_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_user_id UUID NOT NULL,
  patient_email TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.connection_invites ENABLE ROW LEVEL SECURITY;

-- Doctors can manage their invites
CREATE POLICY "Doctors can manage their invites"
  ON public.connection_invites FOR ALL
  USING (auth.uid() = doctor_user_id);

-- Anyone can view invites by code (for accepting)
CREATE POLICY "Anyone can view invites by code"
  ON public.connection_invites FOR SELECT
  USING (true);

-- Function to check if doctor has access to patient data
CREATE OR REPLACE FUNCTION public.doctor_has_patient_access(_doctor_id UUID, _patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patient_doctor_connections
    WHERE doctor_user_id = _doctor_id
      AND patient_user_id = _patient_id
      AND status = 'active'
  )
$$;

-- Add policies for doctors to view patient data
CREATE POLICY "Doctors can view connected patient profiles"
  ON public.profiles FOR SELECT
  USING (
    public.doctor_has_patient_access(auth.uid(), user_id)
  );

CREATE POLICY "Doctors can view connected patient treatment plans"
  ON public.treatment_plans FOR SELECT
  USING (
    public.doctor_has_patient_access(auth.uid(), user_id)
  );

CREATE POLICY "Doctors can view connected patient wearable metrics"
  ON public.wearable_metrics FOR SELECT
  USING (
    public.doctor_has_patient_access(auth.uid(), user_id)
  );

CREATE POLICY "Doctors can view connected patient events"
  ON public.user_events FOR SELECT
  USING (
    public.doctor_has_patient_access(auth.uid(), user_id)
  );

-- Trigger to add doctor role when professional is created
CREATE OR REPLACE FUNCTION public.add_doctor_role_on_professional_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'doctor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_healthcare_professional_created
  AFTER INSERT ON public.healthcare_professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.add_doctor_role_on_professional_create();

-- Trigger to update timestamps
CREATE TRIGGER update_healthcare_professionals_updated_at
  BEFORE UPDATE ON public.healthcare_professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_doctor_connections_updated_at
  BEFORE UPDATE ON public.patient_doctor_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_notes_updated_at
  BEFORE UPDATE ON public.doctor_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();