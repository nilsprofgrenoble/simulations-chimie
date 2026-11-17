-- ════════════════════════════════════════════════════════════════════════════
--  ENERGY@SCHOOL — ANTI-TRICHE DU CLASSEMENT (script 19)
--  À coller dans Supabase → SQL Editor → « Run », APRÈS 18. Sans risque, peut être relancé.
--
--  Ce qu'on ne peut PAS empêcher : tout ce que l'élève voit est calculé dans son navigateur (étapes, réponses, valeurs cachées
--  des défis). Un élève très technique peut donc toujours fabriquer une progression. Le but est de rendre la triche
--  lente, visible et peu rentable, sans gêner un élève honnête.
--
--  1. Le nombre d'étapes de chaque parcours est fixé par le SERVEUR (table energy_cles) : l'élève ne peut plus annoncer
--     « parcours de 2 étapes » pour le finir d'un coup. ⚠️ Si on ajoute des étapes à un parcours, mettre à jour cette table.
--  2. Le serveur note quand il a vu commencer chaque parcours ou défi (debut, debut_etape) : l'élève ne peut pas écrire ces colonnes.
--  3. Dans le classement PUBLIC, un parcours ou un défi ne compte que si le serveur l'a vu se dérouler à un rythme humain :
--       • parcours : vu dès le début (étape ≤ 2) et terminé au plus tôt 8 s par étape après ;
--       • défi : vu ouvert (le site le signale quand l'élève entre en mode Défi) et réussi au plus tôt 40 s après.
--     Le reste (travail fait sans être connecté, ou trop rapide) compte toujours pour les niveaux de l'élève, pas pour le classement.
--     Ces règles sont recopiées dans src/classement.js d'Energy@School (finVerifiee) : les garder identiques.
--  4. Le suivi professeur signale les élèves dont beaucoup de parcours sont « non vérifiés ».
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Les 15 clés connues et leur nombre d'étapes ─────────────────────────
create table if not exists public.energy_cles (
  cle   text primary key,
  total smallint not null check (total between 2 and 200),
  defi  boolean not null
);
alter table public.energy_cles enable row level security;
revoke all on public.energy_cles from anon, authenticated;
grant all on public.energy_cles to service_role;
insert into public.energy_cles (cle, total, defi) values
  ('es1-production1', 21, false), ('es1-production2', 16, false), ('es1-production3', 17, false),
  ('es1-transport-prep', 16, false), ('es1-transport', 18, false),
  ('es1-stockage-a1', 15, false), ('es1-stockage-a2', 17, false),
  ('es1-hydrogene-a1', 18, false), ('es1-hydrogene-a2', 11, false),
  ('defi-production1', 2, true), ('defi-production2', 2, true), ('defi-production3', 2, true),
  ('defi-transport', 2, true), ('defi-stockage', 2, true), ('defi-hydrogene', 2, true)
on conflict (cle) do update set total = excluded.total, defi = excluded.defi;

-- ── 2. Ce que le serveur a vu ──────────────────────────────────────────────
alter table public.energy_progres add column if not exists debut timestamptz;
alter table public.energy_progres add column if not exists debut_etape smallint;
-- lignes antérieures : on ne sait pas comment elles ont été obtenues → non vérifiées
update public.energy_progres set debut = maj, debut_etape = etape where debut is null;

create or replace function public.energy_progres_fini_creation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare t smallint;
begin
  select k.total into t from public.energy_cles k where k.cle = new.cle;
  if t is not null then new.total := t; new.etape := least(new.etape, t - 1); end if;   -- le nombre d'étapes vient du serveur
  new.maj := now(); new.debut := now(); new.debut_etape := new.etape;
  new.fini := case when new.etape >= new.total - 1 and new.total > 1 then now() end;
  return new;
end $$;
drop trigger if exists energy_progres_fini_creation on public.energy_progres;
create trigger energy_progres_fini_creation before insert on public.energy_progres
  for each row execute function public.energy_progres_fini_creation();

create or replace function public.energy_progres_monotone()
returns trigger language plpgsql security definer set search_path = '' as $$
declare t smallint;
begin
  select k.total into t from public.energy_cles k where k.cle = new.cle;
  if t is not null then new.total := t; new.etape := least(new.etape, t - 1); end if;
  new.etape    := greatest(new.etape, old.etape);
  new.reussies := greatest(new.reussies, old.reussies);
  if new.etape > old.etape or new.reussies > old.reussies or new.total <> old.total then new.maj := now(); else new.maj := old.maj; end if;
  new.debut := old.debut; new.debut_etape := old.debut_etape;      -- jamais réécrits
  new.fini := coalesce(old.fini, case when new.etape >= new.total - 1 and new.total > 1 then now() end);
  return new;
end $$;
drop trigger if exists energy_progres_monotone on public.energy_progres;
create trigger energy_progres_monotone before update on public.energy_progres
  for each row execute function public.energy_progres_monotone();
revoke all on function public.energy_progres_fini_creation() from public, anon, authenticated;
revoke all on function public.energy_progres_monotone() from public, anon, authenticated;

-- ── 3. Le classement ne compte que les fins « vérifiées » ──────────────────
create or replace function public.energy_classement_calcul()
returns jsonb language sql stable security definer set search_path = '' as $$
  with debut as (
    select date_trunc('week', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris' as lundi
  ), part as (
    select ps.user_id, ps.adj, ps.nom, btrim(c.etablissement) as etab, c.nom as classe
    from public.energy_pseudos ps
    join public.classes c on c.id = ps.classe_id
    where ps.classement and not ps.exclu and c.site in ('energy', 'deux') and c.etablissement is not null
  ), fait as (
    select p.user_id, k.defi, g.fini as quand
    from part p
    join public.energy_progres g on g.user_id = p.user_id
    join public.energy_cles k on k.cle = g.cle
    where g.fini is not null and g.debut is not null
      and case when k.defi
               then g.debut_etape = 0 and g.fini >= g.debut + interval '40 seconds'
               else g.debut_etape <= 2 and g.fini >= g.debut + make_interval(secs => 8 * (k.total - 1 - g.debut_etape)) end
  ), lames as (
    select 'points'::text as code, user_id, count(*)::int as score from fait group by user_id
    union all
    select 'defis', user_id, count(*)::int from fait where defi group by user_id
    union all
    select 'semaine', f.user_id, count(*)::int from fait f, debut d where f.quand >= d.lundi group by f.user_id
  ), rangs as (
    select l.code, l.score, p.adj, p.nom, p.etab, p.classe,
           rank() over (partition by l.code order by l.score desc) as rang,
           row_number() over (partition by l.code order by l.score desc, p.adj, p.nom) as ordre
    from lames l join part p on p.user_id = l.user_id
    where l.score > 0
  ), liste as (
    select code,
           jsonb_agg(jsonb_build_object('rang', rang, 'adj', adj, 'nom', nom, 'etab', etab, 'classe', classe, 'score', score) order by ordre) as lignes
    from rangs where ordre <= 30 group by code
  )
  select jsonb_build_object(
    'lundi', (select lundi from debut),
    'lames', jsonb_build_object(
      'points',  coalesce((select lignes from liste where code = 'points'),  '[]'::jsonb),
      'defis',   coalesce((select lignes from liste where code = 'defis'),   '[]'::jsonb),
      'semaine', coalesce((select lignes from liste where code = 'semaine'), '[]'::jsonb)));
$$;
revoke all on function public.energy_classement_calcul() from public, anon, authenticated;
delete from public.energy_classement_cache;

-- ── 4. Ménage signalé par l'audit : fonction technique de Supabase (déclencheur d'événement), inutile via l'API ──
do $$ begin
  if exists (select 1 from pg_proc where proname = 'rls_auto_enable' and pronamespace = 'public'::regnamespace) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- Vérification : doit afficher 15, puis « debut » et « debut_etape »
select count(*)::text as verification from public.energy_cles
union all select column_name from information_schema.columns where table_schema = 'public' and table_name = 'energy_progres' and column_name in ('debut', 'debut_etape');
