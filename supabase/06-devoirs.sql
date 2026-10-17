-- ════════════════════════════════════════════════════════════════════════════
--  DEVOIRS ASSIGNÉS (étape 21) : le professeur choisit des exercices ou des défis pour une classe, avec une date limite ;
--  les élèves de la classe les voient en haut de leur espace ; le professeur voit qui a fait quoi.
--  À coller dans Supabase → SQL Editor → « Run ». Sans risque, peut être relancé.
--
--  Principes :
--   • un devoir = un titre, une liste de 1 à 12 exercices (clés du type « 34:paroi.1 »), une date limite facultative ;
--   • seul le professeur d'une classe crée, modifie (titre, date) et supprime les devoirs de CETTE classe ;
--   • les élèves d'une classe lisent les devoirs de leur classe, rien d'autre ;
--   • « fait » n'est PAS enregistré ici : c'est déduit des séances déjà stockées (table « activites ») :
--     un exercice est fait s'il est réussi APRÈS la création du devoir. Aucune donnée d'élève en plus.
-- ════════════════════════════════════════════════════════════════════════════

-- Une clé d'exercice valide : la même forme que dans activites (sans « sim: »)
create or replace function public.cles_devoir_valides(c text[])
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(array_length(c, 1) between 1 and 12, false)
     and coalesce((select bool_and(k ~ '^[0-9]{1,3}:[A-Za-z0-9._:-]{1,70}$') from unnest(c) as k), false);
$$;

create table if not exists public.devoirs (
  id        uuid primary key default gen_random_uuid(),
  classe_id uuid not null references public.classes (id) on delete cascade,
  titre     text not null check (char_length(titre) between 1 and 80),
  cles      text[] not null check (public.cles_devoir_valides(cles)),
  echeance  date,
  cree_le   timestamptz not null default now()
);
create index if not exists devoirs_classe_idx on public.devoirs (classe_id, cree_le desc);

-- Contrôle : date de création fixée par le serveur, au plus 200 devoirs par classe, exercices et classe non modifiables après coup
create or replace function public.devoirs_controle()
returns trigger language plpgsql set search_path = '' as $$
declare n integer;
begin
  if tg_op = 'INSERT' then
    new.cree_le := now();
    select count(*) into n from public.devoirs where classe_id = new.classe_id;
    if n >= 200 then raise exception 'Trop de devoirs pour cette classe (200 au maximum) : supprimez les anciens.' using errcode = 'P0001'; end if;
  else
    new.id := old.id; new.classe_id := old.classe_id; new.cles := old.cles; new.cree_le := old.cree_le;
  end if;
  return new;
end $$;
revoke all on function public.devoirs_controle() from public, anon, authenticated;
drop trigger if exists devoirs_controle on public.devoirs;
create trigger devoirs_controle before insert or update on public.devoirs for each row execute function public.devoirs_controle();

alter table public.devoirs enable row level security;

drop policy if exists devoirs_lecture on public.devoirs;
create policy devoirs_lecture on public.devoirs for select to authenticated
  using (public.prof_de_classe(classe_id) or classe_id = (select public.ma_classe()));
drop policy if exists devoirs_creation on public.devoirs;
create policy devoirs_creation on public.devoirs for insert to authenticated
  with check (public.prof_de_classe(classe_id));
drop policy if exists devoirs_maj on public.devoirs;
create policy devoirs_maj on public.devoirs for update to authenticated
  using (public.prof_de_classe(classe_id)) with check (public.prof_de_classe(classe_id));
drop policy if exists devoirs_suppression on public.devoirs;
create policy devoirs_suppression on public.devoirs for delete to authenticated
  using (public.prof_de_classe(classe_id));

revoke all on public.devoirs from anon, authenticated;
grant select on public.devoirs to authenticated;
grant insert (classe_id, titre, cles, echeance) on public.devoirs to authenticated;
grant update (titre, echeance) on public.devoirs to authenticated;
grant delete on public.devoirs to authenticated;
revoke all on function public.cles_devoir_valides(text[]) from public, anon;
grant execute on function public.cles_devoir_valides(text[]) to authenticated;
grant usage on schema public to service_role;
grant all on public.devoirs to service_role;

-- Vérification : doit afficher « devoirs », « devoirs_controle » puis « cles_devoir_valides »
select tablename as verification from pg_tables where schemaname = 'public' and tablename = 'devoirs'
union all select tgname from pg_trigger where tgrelid = 'public.devoirs'::regclass and tgname = 'devoirs_controle'
union all select proname from pg_proc where proname = 'cles_devoir_valides' and pronamespace = 'public'::regnamespace;
