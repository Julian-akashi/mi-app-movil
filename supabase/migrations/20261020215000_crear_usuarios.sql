create table if not exists public.usuarios (
  id uuid primary key,
  nombre text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;

drop policy if exists "usuarios_select_propio" on public.usuarios;
create policy "usuarios_select_propio"
on public.usuarios
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "usuarios_update_propio" on public.usuarios;
create policy "usuarios_update_propio"
on public.usuarios
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.crear_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    new.email
  )
  on conflict (id) do update
    set nombre = excluded.nombre,
        email = excluded.email;

  return new;
end;
$$;

drop trigger if exists trigger_crear_usuario on auth.users;

create trigger trigger_crear_usuario
after insert on auth.users
for each row
execute function public.crear_usuario();
