-- Add INSERT policy for medications table
CREATE POLICY "Authenticated users can create medications" 
ON public.medications 
FOR INSERT 
WITH CHECK (true);

-- Add UPDATE policy for medications table
CREATE POLICY "Authenticated users can update medications" 
ON public.medications 
FOR UPDATE 
USING (true);

-- Add DELETE policy for medications table
CREATE POLICY "Authenticated users can delete medications" 
ON public.medications 
FOR DELETE 
USING (true);