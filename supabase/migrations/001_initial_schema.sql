-- Enable UUID extension
create extension if not exists "uuid-ossp" with schema extensions;

-- Clients table to store client information
create table if not exists public.clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  phone text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add index for faster lookups
create index if not exists idx_clients_email on public.clients (email);

-- Bookings table to store booking requests
create table if not exists public.bookings (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  project_details text not null,
  preferred_dates text[] not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'completed')),
  confirmed_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add index for faster lookups
create index if not exists idx_bookings_client_id on public.bookings (client_id);
create index if not exists idx_bookings_status on public.bookings (status);

-- Availability table to define available time slots
create table if not exists public.availability (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  max_bookings integer not null default 1,
  current_bookings integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint valid_time_slot check (end_time > start_time),
  constraint unique_time_slot unique (date, start_time, end_time)
);

-- Add index for faster lookups
create index if not exists idx_availability_date on public.availability (date);
create index if not exists idx_availability_available on public.availability (is_available);

-- Function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers to update updated_at column
create trigger update_clients_updated_at
before update on public.clients
for each row execute function update_updated_at_column();

create trigger update_bookings_updated_at
before update on public.bookings
for each row execute function update_updated_at_column();

create trigger update_availability_updated_at
before update on public.availability
for each row execute function update_updated_at_column();

-- Enable Row Level Security
alter table public.clients enable row level security;
alter table public.bookings enable row level security;
alter table public.availability enable row level security;

-- Create policies for public access (adjust according to your security requirements)
-- Clients: Allow public to create new clients
create policy "Allow public insert on clients"
on public.clients for insert
to anon, authenticated
with check (true);

-- Bookings: Allow public to create new bookings
create policy "Allow public insert on bookings"
on public.bookings for insert
to anon, authenticated
with check (true);

-- Availability: Allow public to read availability
create policy "Allow public select on availability"
on public.availability for select
to anon, authenticated
using (true);

-- Allow admins full access to availability
create policy "Allow admin all operations on availability"
on public.availability
for all
to authenticated
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

-- Create a function to check if a client can create a booking
create or replace function can_create_booking(client_email text, booking_date date)
returns boolean as $$
declare
  booking_count integer;
begin
  select count(*) into booking_count
  from public.bookings b
  join public.clients c on b.client_id = c.id
  where c.email = client_email
  and b.status = 'pending';
  
  return booking_count < 3; -- Limit to 3 pending bookings per client
end;
$$ language plpgsql security definer;
