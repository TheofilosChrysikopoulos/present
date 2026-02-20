create table public.enquiries (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  company        text,
  phone          text,
  message        text,
  -- Full cart snapshot at time of submission.
  -- Shape: [{ product_id, sku, name_en, name_el, qty, price, variant_id?, variant_color_en?, variant_color_el? }]
  cart_snapshot  jsonb not null default '[]',
  status         text not null default 'new'
    check (status in ('new', 'read', 'replied', 'archived')),
  created_at     timestamptz not null default now()
);

alter table public.enquiries enable row level security;

-- Anyone can submit an enquiry (no auth required)
create policy "Anyone can submit an enquiry"
  on public.enquiries for insert
  with check (true);

-- Only admins can read enquiries
create policy "Admins can read enquiries"
  on public.enquiries for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can update status
create policy "Admins can update enquiry status"
  on public.enquiries for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index idx_enquiries_status on public.enquiries(status);
create index idx_enquiries_created_at on public.enquiries(created_at desc);
create index idx_enquiries_email on public.enquiries(email);
