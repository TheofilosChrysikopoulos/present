-- Site-wide settings (key-value pairs)
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default 'true'::jsonb,
  updated_at timestamptz not null default now()
);

-- Allow service role and authenticated reads
alter table site_settings enable row level security;

create policy "Anyone can read site_settings"
  on site_settings for select
  using (true);

create policy "Admins can update site_settings"
  on site_settings for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert site_settings"
  on site_settings for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Seed default value
insert into site_settings (key, value) values
  ('show_subcategories', 'true'::jsonb)
on conflict (key) do nothing;
