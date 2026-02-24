-- Create customers table for user registration (separate from admin profiles)
create table public.customers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  first_name      text not null,
  last_name       text not null,
  location        text not null,
  region          text not null default 'greece'
    check (region in ('corfu', 'greece')),
  status          text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  -- Supabase auth user id, linked once user verifies email via magic link
  auth_user_id    uuid unique references auth.users(id) on delete set null,
  device_verified boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.customers enable row level security;

-- Anyone can register (insert)
create policy "Anyone can register as a customer"
  on public.customers for insert
  with check (true);

-- Customers can read their own record
create policy "Customers can read own record"
  on public.customers for select
  using (auth.uid() = auth_user_id);

-- Admins can read all customers
create policy "Admins can read all customers"
  on public.customers for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update customers (approve/reject, set region)
create policy "Admins can update customers"
  on public.customers for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Customers can update their own device_verified flag
create policy "Customers can update own record"
  on public.customers for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

create index idx_customers_email on public.customers(email);
create index idx_customers_status on public.customers(status);
create index idx_customers_region on public.customers(region);
create index idx_customers_auth_user_id on public.customers(auth_user_id);
create index idx_customers_created_at on public.customers(created_at desc);

-- Function to update updated_at timestamp
create or replace function public.handle_customer_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_customer_updated
  before update on public.customers
  for each row execute procedure public.handle_customer_updated_at();
