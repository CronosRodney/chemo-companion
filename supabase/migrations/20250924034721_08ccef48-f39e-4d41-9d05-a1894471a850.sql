-- Create clinics table
CREATE TABLE public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_name TEXT NOT NULL,
  legal_name TEXT,
  cnpj TEXT,
  cnes TEXT,
  street TEXT,
  number TEXT,
  district TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  maps_url TEXT,
  hours TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create responsible table
CREATE TABLE public.clinic_responsible (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  council TEXT,
  council_uf TEXT,
  registration TEXT,
  email TEXT,
  phone TEXT,
  is_deputy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medications table
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  batch_number TEXT,
  expiry_date DATE,
  manufacturer TEXT,
  active_ingredient TEXT,
  concentration TEXT,
  form TEXT,
  route TEXT,
  gtin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_clinic_connections table
CREATE TABLE public.user_clinic_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_medications table
CREATE TABLE public.user_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  dose TEXT,
  frequency TEXT,
  instructions TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_responsible ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_clinic_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_medications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clinics (public read)
CREATE POLICY "Clinics are viewable by everyone" 
ON public.clinics 
FOR SELECT 
USING (true);

-- Create RLS policies for clinic_responsible (public read)
CREATE POLICY "Clinic responsible are viewable by everyone" 
ON public.clinic_responsible 
FOR SELECT 
USING (true);

-- Create RLS policies for medications (public read)
CREATE POLICY "Medications are viewable by everyone" 
ON public.medications 
FOR SELECT 
USING (true);

-- Create RLS policies for user_clinic_connections (user can only see their own)
CREATE POLICY "Users can view their own clinic connections" 
ON public.user_clinic_connections 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own clinic connections" 
ON public.user_clinic_connections 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Create RLS policies for user_medications (user can only see their own)
CREATE POLICY "Users can view their own medications" 
ON public.user_medications 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own medications" 
ON public.user_medications 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Create indexes for better performance
CREATE INDEX idx_clinic_responsible_clinic_id ON public.clinic_responsible(clinic_id);
CREATE INDEX idx_user_clinic_connections_user_id ON public.user_clinic_connections(user_id);
CREATE INDEX idx_user_medications_user_id ON public.user_medications(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clinics_updated_at
BEFORE UPDATE ON public.clinics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();