create table public.profiles (
  id uuid references auth.users (id) on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamptz,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policy: users can view any profile
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Policy: users can only update their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Policy: users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
