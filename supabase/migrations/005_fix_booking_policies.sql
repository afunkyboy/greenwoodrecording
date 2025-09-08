-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public insert on bookings" ON public.bookings;

-- Allow public to create bookings
CREATE POLICY "Allow public insert on bookings"
ON public.bookings 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow public to select their own bookings
CREATE POLICY "Allow select on bookings"
ON public.bookings
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow updates to bookings (for admin)
CREATE POLICY "Allow update on bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
