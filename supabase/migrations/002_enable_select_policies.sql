-- Enable SELECT access for authenticated users (admins) to view data in the dashboard

-- Clients: allow authenticated users to read clients
create policy if not exists "Allow authenticated select on clients"
on public.clients for select
to authenticated
using (true);

-- Bookings: allow authenticated users to read bookings
create policy if not exists "Allow authenticated select on bookings"
on public.bookings for select
to authenticated
using (true);

-- Optionally, restrict dashboard reads to users with role=admin in JWT
-- Uncomment the following and comment out the more permissive ones above if desired
-- using (auth.jwt() ->> 'role' = 'admin');
