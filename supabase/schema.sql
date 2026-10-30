-- عزبتي: قاعدة البيانات الأولية
-- شغّل هذا الملف كاملًا في Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'worker' check (role in ('owner', 'worker')),
  created_at timestamptz not null default now()
);

create table if not exists public.animals (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('sheep', 'chicken', 'camel')),
  category text not null check (category in ('male', 'female', 'young')),
  name text not null default 'بدون اسم',
  notes text not null default '',
  photo_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  task_time text not null default '',
  is_done boolean not null default false,
  completed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount text not null default '',
  remaining_percent integer not null default 0 check (remaining_percent between 0 and 100),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  icon text not null default '📝',
  message text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.animals enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.stock_items enable row level security;
alter table public.activity enable row level security;

-- هذه النسخة لعزبة واحدة؛ لا يمكن القراءة أو التعديل إلا بعد تسجيل الدخول.
create policy "members can read profiles" on public.profiles for select to authenticated using (true);
create policy "users can update their profile" on public.profiles for update to authenticated using (id = auth.uid());
create policy "members can manage animals" on public.animals for all to authenticated using (true) with check (true);
create policy "members can manage tasks" on public.daily_tasks for all to authenticated using (true) with check (true);
create policy "members can manage stock" on public.stock_items for all to authenticated using (true) with check (true);
create policy "members can manage activity" on public.activity for all to authenticated using (true) with check (true);

-- إنشاء ملف المستخدم تلقائيًا عند التسجيل.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
