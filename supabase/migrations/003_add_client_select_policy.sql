-- Allow authenticated users to read client data
create policy "Allow authenticated users to read clients"
on public.clients for select
to authenticated
using (true);

-- Allow admins full access to clients
create policy "Allow admin all operations on clients"
on public.clients
for all
to authenticated
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

-- Add unique constraint on client email to prevent duplicates
alter table public.clients add constraint clients_email_key unique (email);
