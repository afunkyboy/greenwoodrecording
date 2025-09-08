-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public insert on clients" ON public.clients;

-- Recreate the insert policy to allow public inserts
CREATE POLICY "Allow public insert on clients"
ON public.clients 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow public to select from clients (needed for the duplicate check)
CREATE POLICY "Allow public select on clients"
ON public.clients
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public to update their own client record
CREATE POLICY "Allow update on clients"
ON public.clients
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
