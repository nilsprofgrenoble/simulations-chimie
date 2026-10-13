-- ════════════════════════════════════════════════════════════════════════════
--  SIMULATIONS-CHIMIE — BASE DE DONNÉES DU SUIVI DES ÉLÈVES (Supabase)
--  À coller en une fois dans Supabase → SQL Editor → « Run ».
--  Le script peut être relancé : il ne crée que ce qui n'existe pas encore,
--  et recrée les fonctions et les règles d'accès à l'identique.
--
--  Principes :
--   • aucun nom, aucun email d'élève : un élève = un identifiant (« tstl1-07 ») ;
--     la correspondance identifiant ↔ élève reste chez le professeur, hors du serveur ;
--   • un élève ne lit et n'écrit que ses propres données ;
--   • un professeur lit les données des élèves de SES classes, et rien d'autre ;
--   • les comptes élèves sont créés, réinitialisés et supprimés uniquement par la
--     fonction serveur « comptes » (clé secrète côté serveur, jamais dans le site) ;
--   • personne d'anonyme ne lit ni n'écrit quoi que ce soit.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.professeurs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nom     text not null check (char_length(nom) between 1 and 80)
);

create table if not exists public.classes (
  id      uuid primary key default gen_random_uuid(),
  prof_id uuid not null default auth.uid() references public.professeurs (user_id) on delete cascade,
  nom     text not null check (char_length(nom) between 1 and 40),
  -- préfixe des identifiants des élèves de la classe : « tstl1 » → tstl1-01, tstl1-02…
  prefixe text not null unique check (prefixe ~ '^[a-z0-9]{2,12}$'),
  cree_le timestamptz not null default now()
);

create table if not exists public.eleves (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  classe_id   uuid not null references public.classes (id) on delete cascade,
  identifiant text not null unique check (identifiant ~ '^[a-z0-9]{2,12}-[0-9]{2,3}$'),
  cree_le     timestamptz not null default now()
);
create index if not exists eleves_classe_idx on public.eleves (classe_id);

-- Une ligne = une séance de travail d'un élève sur un exercice (clé du type « 36:composees »).
create table if not exists public.activites (
  id               bigint generated always as identity primary key,
  user_id          uuid not null default auth.uid() references public.eleves (user_id) on delete cascade,
  cle              text not null check (char_length(cle) between 1 and 80),
  debut            timestamptz not null default now(),
  maj              timestamptz not null default now(),
  duree_s          integer not null default 0 check (duree_s between 0 and 86400),       -- temps actif, en secondes
  essais           integer not null default 0 check (essais between 0 and 10000),        -- clics sur « Corriger »
  corrections_vues integer not null default 0 check (corrections_vues between 0 and 1000),
  reussi           boolean not null default false
);
create index if not exists activites_user_idx on public.activites (user_id, cle);

-- ── Fonctions d'aide (security definer : évitent que les règles s'appellent en boucle) ──

create or replace function public.est_prof()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.professeurs where user_id = auth.uid());
$$;

create or replace function public.est_eleve()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.eleves where user_id = auth.uid());
$$;

-- Classe de l'élève connecté (null pour un professeur)
create or replace function public.ma_classe()
returns uuid language sql stable security definer set search_path = '' as $$
  select classe_id from public.eleves where user_id = auth.uid();
$$;

-- La classe appartient-elle au professeur connecté ?
create or replace function public.prof_de_classe(c uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classes where id = c and prof_id = auth.uid());
$$;

-- L'élève appartient-il à une classe du professeur connecté ?
create or replace function public.prof_de_eleve(e uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.eleves el join public.classes c on c.id = el.classe_id
    where el.user_id = e and c.prof_id = auth.uid());
$$;

revoke all on function public.est_prof(), public.est_eleve(), public.ma_classe(),
  public.prof_de_classe(uuid), public.prof_de_eleve(uuid) from public, anon;
grant execute on function public.est_prof(), public.est_eleve(), public.ma_classe(),
  public.prof_de_classe(uuid), public.prof_de_eleve(uuid) to authenticated;

-- ── Sécurité par ligne (RLS) ─────────────────────────────────────────────

alter table public.professeurs enable row level security;
alter table public.classes     enable row level security;
alter table public.eleves      enable row level security;
alter table public.activites   enable row level security;

-- Professeurs : chacun ne voit que sa propre fiche
drop policy if exists prof_lecture on public.professeurs;
create policy prof_lecture on public.professeurs for select to authenticated
  using (user_id = (select auth.uid()));

-- Classes : le professeur voit et crée les siennes ; l'élève voit la sienne (son nom)
drop policy if exists classes_lecture on public.classes;
create policy classes_lecture on public.classes for select to authenticated
  using (prof_id = (select auth.uid()) or id = (select public.ma_classe()));
drop policy if exists classes_creation on public.classes;
create policy classes_creation on public.classes for insert to authenticated
  with check (prof_id = (select auth.uid()) and (select public.est_prof()));
drop policy if exists classes_renommage on public.classes;
create policy classes_renommage on public.classes for update to authenticated
  using (prof_id = (select auth.uid())) with check (prof_id = (select auth.uid()));
-- (pas de suppression depuis le site : elle passe par la fonction serveur, qui supprime aussi les comptes)

-- Élèves : l'élève voit sa propre ligne, le professeur celles de ses classes.
-- Aucune création ni modification depuis le site : uniquement par la fonction serveur.
drop policy if exists eleves_lecture on public.eleves;
create policy eleves_lecture on public.eleves for select to authenticated
  using (user_id = (select auth.uid()) or public.prof_de_classe(classe_id));

-- Activités : l'élève crée et met à jour les siennes ; le professeur lit celles de ses élèves.
drop policy if exists activites_lecture on public.activites;
create policy activites_lecture on public.activites for select to authenticated
  using (user_id = (select auth.uid()) or public.prof_de_eleve(user_id));
drop policy if exists activites_creation on public.activites;
create policy activites_creation on public.activites for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.est_eleve()));
drop policy if exists activites_maj on public.activites;
create policy activites_maj on public.activites for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- (pas de suppression depuis le site)

-- ── Droits par table et par colonne ─────────────────────────────────────
-- On retire tout, puis on n'ouvre que le strict nécessaire, au rôle « authenticated » (utilisateur connecté).

revoke all on public.professeurs, public.classes, public.eleves, public.activites from anon, authenticated;

grant select on public.professeurs, public.classes, public.eleves, public.activites to authenticated;
grant insert (nom, prefixe) on public.classes to authenticated;          -- prof_id = auth.uid() par défaut
grant update (nom)          on public.classes to authenticated;
grant insert (cle, debut, maj, duree_s, essais, corrections_vues, reussi) on public.activites to authenticated;
grant update (maj, duree_s, essais, corrections_vues, reussi)            on public.activites to authenticated;
-- user_id n'est jamais écrit par le site : il vaut auth.uid() par défaut, et la règle l'impose.
revoke all on all sequences in schema public from anon, authenticated;

-- La fonction serveur « comptes » (rôle service_role) a besoin de ses droits sur nos tables.
-- Avec « Automatically expose new tables » décoché, Supabase ne les accorde pas tout seul.
grant usage on schema public to service_role;
grant all on public.professeurs, public.classes, public.eleves, public.activites to service_role;
