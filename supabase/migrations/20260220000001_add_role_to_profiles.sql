-- Add role column to profiles table
alter table public.profiles
  add column role text not null default 'user'
  check (role in ('user', 'admin'));

-- Update the auto-create trigger to explicitly set role
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
