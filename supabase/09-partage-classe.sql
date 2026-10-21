-- ════════════════════════════════════════════════════════════════════════════
--  PARTAGE D'UNE CLASSE ENTRE PROFESSEURS (étape 23)
--  Une classe garde un PROPRIÉTAIRE (celui qui l'a créée) et peut avoir des CO-PROFESSEURS.
--  Les élèves n'ont qu'un compte, quel que soit le nombre de professeurs.
--
--  Le propriétaire : tout (renommer, partager, retirer un co-professeur, supprimer des élèves, supprimer la classe).
--  Un co-professeur : voit les élèves et leurs résultats, crée / modifie / supprime des devoirs, règle le chapitre en cours et
--  la vie de classe, ajoute des comptes élèves et réinitialise des mots de passe.
--  Il NE PEUT PAS : supprimer la classe, supprimer un compte élève, renommer la classe, partager la classe, retirer un
--  autre professeur. Il peut quitter la classe.
--
--  Prérequis : 01 à 08 déjà exécutés. À coller dans Supabase → SQL Editor → « Run ». Peut être relancé sans risque.
--  Le collègue doit déjà avoir un compte professeur (Authentication → Users → Add user, puis 02-professeur.sql avec son adresse).
-- ════════════════════════════════════════════════════════════════════════════

-- ── Table des co-professeurs (le propriétaire reste dans classes.prof_id) ──
create table if not exists public.classes_profs (
  classe_id uuid not null references public.classes (id) on delete cascade,
  prof_id   uuid not null references public.professeurs (user_id) on delete cascade,
  cree_le   timestamptz not null default now(),
  primary key (classe_id, prof_id)
);
create index if not exists classes_profs_prof_idx on public.classes_profs (prof_id);

-- ── Fonctions de droits ──
-- Propriétaire de la classe ?
create or replace function public.proprio_de_classe(c uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classes where id = c and prof_id = auth.uid());
$$;

-- Professeur de la classe (propriétaire OU co-professeur) ?  Les règles existantes (devoirs, vie de classe, élèves…) l'utilisent déjà.
create or replace function public.prof_de_classe(c uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classes where id = c and prof_id = auth.uid())
      or exists (select 1 from public.classes_profs where classe_id = c and prof_id = auth.uid());
$$;

create or replace function public.prof_de_eleve(e uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.eleves el join public.classes c on c.id = el.classe_id
    where el.user_id = e
      and (c.prof_id = auth.uid()
           or exists (select 1 from public.classes_profs cp where cp.classe_id = c.id and cp.prof_id = auth.uid())));
$$;

-- Noms des professeurs d'une classe (sans adresse) : appelable par ses professeurs seulement
create or replace function public.profs_classe(c uuid)
returns table (prof_id uuid, nom text, proprietaire boolean, moi boolean)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.nom, (p.user_id = cl.prof_id), (p.user_id = auth.uid())
  from public.classes cl
  join public.professeurs p on p.user_id = cl.prof_id
       or p.user_id in (select cp.prof_id from public.classes_profs cp where cp.classe_id = cl.id)
  where cl.id = c and public.prof_de_classe(c)
  order by (p.user_id = cl.prof_id) desc, p.nom;
$$;

-- Retrouver un professeur par son adresse : réservé à la fonction serveur « comptes » (l'adresse n'est jamais renvoyée)
create or replace function public.prof_par_email(e text)
returns uuid language sql stable security definer set search_path = '' as $$
  select p.user_id from public.professeurs p join auth.users u on u.id = p.user_id where lower(u.email) = lower(trim(e));
$$;

revoke all on function public.proprio_de_classe(uuid), public.prof_de_classe(uuid), public.prof_de_eleve(uuid),
  public.profs_classe(uuid), public.prof_par_email(text) from public, anon, authenticated;
grant execute on function public.proprio_de_classe(uuid), public.prof_de_classe(uuid), public.prof_de_eleve(uuid),
  public.profs_classe(uuid) to authenticated;
grant execute on function public.prof_par_email(text) to service_role;

-- ── Règles d'accès ──
alter table public.classes_profs enable row level security;
drop policy if exists classes_profs_lecture on public.classes_profs;
create policy classes_profs_lecture on public.classes_profs for select to authenticated
  using (prof_id = (select auth.uid()) or public.proprio_de_classe(classe_id));
-- (aucune écriture depuis le site : le partage passe par la fonction serveur « comptes »)

revoke all on public.classes_profs from anon, authenticated;
grant select on public.classes_profs to authenticated;
grant usage on schema public to service_role;
grant all on public.classes_profs to service_role;

-- Classes : un co-professeur voit la classe et règle chapitre / vie de classe ; le nom reste réservé au propriétaire (trigger ci-dessous)
drop policy if exists classes_lecture on public.classes;
create policy classes_lecture on public.classes for select to authenticated
  using (public.prof_de_classe(id) or id = (select public.ma_classe()));
drop policy if exists classes_renommage on public.classes;
create policy classes_renommage on public.classes for update to authenticated
  using (public.prof_de_classe(id)) with check (public.prof_de_classe(id));

create or replace function public.classes_controle_partage()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and new.nom is distinct from old.nom and old.prof_id <> auth.uid() then
    raise exception 'Seul le propriétaire de la classe peut la renommer.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists classes_controle_partage on public.classes;
create trigger classes_controle_partage before update on public.classes
  for each row execute function public.classes_controle_partage();

-- Vérification : doit afficher classes_profs, profs_classe, prof_par_email
select 'classes_profs' as verification where to_regclass('public.classes_profs') is not null
union all select 'profs_classe' where to_regproc('public.profs_classe(uuid)') is not null
union all select 'prof_par_email' where to_regproc('public.prof_par_email(text)') is not null;
