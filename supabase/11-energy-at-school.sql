-- ════════════════════════════════════════════════════════════════════════════
--  ENERGY@SCHOOL — comptes élèves, pseudos et avancement (étape 24)
--  Le site Energy@School utilise le MÊME serveur et les MÊMES comptes que la Paillasse virtuelle,
--  mais ses données sont dans des tables séparées, et ses classes sont marquées « energy ».
--
--  Principes :
--   • une classe a un « site » : « paillasse » (par défaut, tout ce qui existe déjà) ou « energy » ;
--     c'est le professeur qui le règle, dans « Gérer la classe » du suivi professeur de la Paillasse ;
--   • l'avancement est enregistré par parcours guidé (étape atteinte, étapes réussies) : il ne baisse jamais ;
--   • le pseudo est tiré d'une liste fixe du site (aucun texte libre) ; deux élèves d'une même classe n'ont jamais le même ;
--   • un élève ne lit et n'écrit que ses propres données ; un professeur lit celles des élèves de SES classes
--     (propriétaire ou co-professeur, comme partout) ;
--   • aucun nom, aucun email d'élève : rien de nouveau côté données personnelles.
--
--  Prérequis : 01 à 10 déjà exécutés. À coller dans Supabase → SQL Editor → « Run ». Peut être relancé sans risque.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Le « site » d'une classe ──────────────────────────────────────────
alter table public.classes add column if not exists site text not null default 'paillasse';
alter table public.classes drop constraint if exists classes_site_valide;
alter table public.classes add constraint classes_site_valide check (site in ('paillasse', 'energy'));
grant update (site) on public.classes to authenticated;   -- la règle « classes_renommage » limite aux professeurs de la classe

-- ── 2. Avancement par parcours guidé ─────────────────────────────────────
create table if not exists public.energy_progres (
  user_id  uuid not null default auth.uid() references public.eleves (user_id) on delete cascade,
  cle      text not null check (cle ~ '^[a-z0-9-]{3,40}$'),            -- ex. « es1-hydrogene-a1 »
  etape    smallint not null default 0 check (etape between 0 and 200),  -- étape la plus avancée atteinte (0 = la première)
  total    smallint not null default 1 check (total between 1 and 200),  -- nombre d'étapes du parcours
  reussies smallint not null default 0 check (reussies between 0 and 200),
  maj      timestamptz not null default now(),
  primary key (user_id, cle)
);

-- L'avancement ne recule jamais (recommencer un parcours ne fait pas perdre un niveau)
create or replace function public.energy_progres_monotone()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.etape    := greatest(new.etape, old.etape);
  new.reussies := greatest(new.reussies, old.reussies);
  new.maj      := now();
  return new;
end $$;
drop trigger if exists energy_progres_monotone on public.energy_progres;
create trigger energy_progres_monotone before update on public.energy_progres
  for each row execute function public.energy_progres_monotone();

alter table public.energy_progres enable row level security;
drop policy if exists energy_progres_lecture on public.energy_progres;
create policy energy_progres_lecture on public.energy_progres for select to authenticated
  using (user_id = (select auth.uid()) or public.prof_de_eleve(user_id));
drop policy if exists energy_progres_creation on public.energy_progres;
create policy energy_progres_creation on public.energy_progres for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.est_eleve()));
drop policy if exists energy_progres_maj on public.energy_progres;
create policy energy_progres_maj on public.energy_progres for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ── 3. Pseudo de l'élève (listes dans le code d'Energy@School : on peut AJOUTER à la fin, jamais retirer) ──
create table if not exists public.energy_pseudos (
  user_id   uuid primary key default auth.uid() references public.eleves (user_id) on delete cascade,
  classe_id uuid not null default public.ma_classe() references public.classes (id) on delete cascade,
  adj       smallint not null check (adj between 0 and 63),
  nom       smallint not null check (nom between 0 and 63),
  unique (classe_id, adj, nom)
);
alter table public.energy_pseudos enable row level security;
drop policy if exists energy_pseudos_lecture on public.energy_pseudos;
create policy energy_pseudos_lecture on public.energy_pseudos for select to authenticated
  using (user_id = (select auth.uid()) or public.prof_de_eleve(user_id));
drop policy if exists energy_pseudos_creation on public.energy_pseudos;
create policy energy_pseudos_creation on public.energy_pseudos for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.est_eleve()));
drop policy if exists energy_pseudos_maj on public.energy_pseudos;
create policy energy_pseudos_maj on public.energy_pseudos for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ── 4. Droits par table et par colonne ──────────────────────────────────
revoke all on public.energy_progres, public.energy_pseudos from anon, authenticated;
grant select on public.energy_progres, public.energy_pseudos to authenticated;
grant insert (cle, etape, total, reussies) on public.energy_progres to authenticated;
grant update (etape, total, reussies)      on public.energy_progres to authenticated;
grant insert (adj, nom) on public.energy_pseudos to authenticated;      -- user_id et classe_id sont fixés par le serveur
grant update (adj, nom) on public.energy_pseudos to authenticated;
grant usage on schema public to service_role;
grant all on public.energy_progres, public.energy_pseudos to service_role;

-- Vérification : doit afficher « site », « energy_progres » puis « energy_pseudos »
select column_name as verification from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'site'
union all select tablename from pg_tables where schemaname = 'public' and tablename in ('energy_progres', 'energy_pseudos');
