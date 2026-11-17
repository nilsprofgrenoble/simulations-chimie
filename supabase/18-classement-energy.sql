-- ════════════════════════════════════════════════════════════════════════════
--  ENERGY@SCHOOL — CLASSEMENT PUBLIC (script 18)
--  À coller dans Supabase → SQL Editor → « Run », APRÈS 11, 13, 14 et 17. Sans risque, peut être relancé.
--  (Tant que ce script n'est pas lancé, le site Energy@School fonctionne normalement : le classement affiche simplement
--   « pas disponible » et la case d'accord n'apparaît pas dans « Mon profil ».)
--
--  Calqué sur 13 et 14 (classement de la Paillasse), adapté aux points d'Energy@School :
--   • c'est l'ÉLÈVE seul qui décide d'apparaître (case « Apparaître dans le classement public », éteinte par défaut) ;
--   • ce qui devient public : le pseudo (liste fixe, aucun texte libre), l'établissement, le nom de la classe et un score.
--     Jamais d'identifiant, de nom ni d'adresse ;
--   • une classe n'apparaît que si son professeur a renseigné l'établissement (même colonne que la Paillasse, script 13) ;
--   • seuls les élèves des classes réglées sur « energy » ou « deux » (les deux sites) comptent : classement SÉPARÉ de celui de la Paillasse
--     (les populations et les scores ne sont pas comparables) ;
--   • trois classements : « Points » (parcours terminés + défis relevés, 15 au maximum, mêmes règles que avancement.js),
--     « Défis relevés » (6 au maximum) et « Cette semaine » (parcours et défis terminés depuis lundi) ;
--   • anti-triche : seules comptent les 9 clés de parcours et les 6 clés de défis du site (aucune clé inventée), donc au plus 15 points
--     par élève ; le professeur peut retirer un élève du classement (fonction « exclure_energy_du_classement ») ;
--   • cache : le classement n'est recalculé qu'une fois par minute au plus ;
--   • la fonction « classement_public_energy » est la seule porte d'entrée : ouverte à tous, sans compte, 30 lignes au maximum par classement.
--  Limite qui reste : l'avancement est enregistré par le navigateur de l'élève ; un élève qui fabrique de fausses lignes sur les vraies
--  clés peut obtenir les 15 points. Le professeur le voit dans son suivi et peut le retirer.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. L'accord de l'élève et le retrait par le professeur ───────────────────
alter table public.energy_pseudos add column if not exists classement boolean not null default false;
alter table public.energy_pseudos add column if not exists exclu boolean not null default false;   -- aucun droit d'écriture pour l'élève
grant insert (adj, nom, classement) on public.energy_pseudos to authenticated;
grant update (adj, nom, classement) on public.energy_pseudos to authenticated;
alter table public.classes add column if not exists etablissement text;     -- déjà créée par le script 13 : sans effet si elle existe

-- ── 2. Date à laquelle un parcours ou un défi a été terminé (pour « Cette semaine ») ───────────
--  Posée par le serveur, jamais par l'élève. « Terminé » = dernière étape atteinte, comme termine() dans avancement.js.
alter table public.energy_progres add column if not exists fini timestamptz;
update public.energy_progres set fini = maj where fini is null and etape >= total - 1 and total > 1;

create or replace function public.energy_progres_monotone()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.etape    := greatest(new.etape, old.etape);
  new.reussies := greatest(new.reussies, old.reussies);
  -- la date de mise à jour ne bouge que si l'avancement a vraiment changé (se reconnecter ne « rajeunit » rien)
  if new.etape > old.etape or new.reussies > old.reussies or new.total <> old.total then new.maj := now(); else new.maj := old.maj; end if;
  new.fini := coalesce(old.fini, case when new.etape >= new.total - 1 and new.total > 1 then now() end);
  return new;
end $$;
drop trigger if exists energy_progres_monotone on public.energy_progres;
create trigger energy_progres_monotone before update on public.energy_progres
  for each row execute function public.energy_progres_monotone();

create or replace function public.energy_progres_fini_creation()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.fini := case when new.etape >= new.total - 1 and new.total > 1 then now() end;
  return new;
end $$;
drop trigger if exists energy_progres_fini_creation on public.energy_progres;
create trigger energy_progres_fini_creation before insert on public.energy_progres
  for each row execute function public.energy_progres_fini_creation();

-- ── 3. Cache et retrait ────────────────────────────────────────────────────
create table if not exists public.energy_classement_cache (
  id      integer primary key check (id = 1),
  maj     timestamptz not null,
  donnees jsonb not null
);
alter table public.energy_classement_cache enable row level security;
revoke all on public.energy_classement_cache from anon, authenticated;
grant all on public.energy_classement_cache to service_role;

create or replace function public.energy_classement_invalide()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.energy_classement_cache where id = 1;
  return null;
end $$;
revoke all on function public.energy_classement_invalide() from public, anon, authenticated;
drop trigger if exists energy_classement_invalide_pseudos on public.energy_pseudos;
create trigger energy_classement_invalide_pseudos after insert or update or delete on public.energy_pseudos
  for each statement execute function public.energy_classement_invalide();
drop trigger if exists energy_classement_invalide_classes on public.classes;
create trigger energy_classement_invalide_classes after update on public.classes
  for each statement execute function public.energy_classement_invalide();

create or replace function public.exclure_energy_du_classement(eleve uuid, retirer boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if eleve is null or not coalesce(public.prof_de_eleve(eleve), false) then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;
  update public.energy_pseudos set exclu = coalesce(retirer, false) where user_id = eleve;
end $$;
revoke all on function public.exclure_energy_du_classement(uuid, boolean) from public, anon;
grant execute on function public.exclure_energy_du_classement(uuid, boolean) to authenticated;

-- ── 4. Le calcul (jamais appelé directement par le site) ───────────────────
--  Points = nombre de parcours terminés (parmi les 9) + défis relevés (parmi les 6) : mêmes règles que bilan() dans avancement.js.
create or replace function public.energy_classement_calcul()
returns jsonb language sql stable security definer set search_path = '' as $$
  with debut as (
    select date_trunc('week', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris' as lundi
  ), cles(cle, defi) as (
    values ('es1-production1', false), ('es1-production2', false), ('es1-production3', false),
           ('es1-transport-prep', false), ('es1-transport', false),
           ('es1-stockage-a1', false), ('es1-stockage-a2', false), ('es1-hydrogene-a1', false), ('es1-hydrogene-a2', false),
           ('defi-production1', true), ('defi-production2', true), ('defi-production3', true),
           ('defi-transport', true), ('defi-stockage', true), ('defi-hydrogene', true)
  ), part as (
    select ps.user_id, ps.adj, ps.nom, btrim(c.etablissement) as etab, c.nom as classe
    from public.energy_pseudos ps
    join public.classes c on c.id = ps.classe_id
    where ps.classement and not ps.exclu and c.site in ('energy', 'deux') and c.etablissement is not null
  ), fait as (
    select p.user_id, k.cle, k.defi, coalesce(g.fini, g.maj) as quand
    from part p
    join public.energy_progres g on g.user_id = p.user_id
    join cles k on k.cle = g.cle
    where g.etape >= g.total - 1 and g.total > 1
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

-- ── 5. La porte publique : sert le calcul gardé en cache (60 s) ──────────────
create or replace function public.classement_public_energy()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare c record; v jsonb;
begin
  select * into c from public.energy_classement_cache where id = 1;
  if found and c.maj > now() - interval '60 seconds' then return c.donnees; end if;
  if not pg_try_advisory_xact_lock(7152) then
    if found then return c.donnees; end if;
    perform pg_advisory_xact_lock(7152);
    select * into c from public.energy_classement_cache where id = 1;
    if found then return c.donnees; end if;
  end if;
  v := public.energy_classement_calcul();
  insert into public.energy_classement_cache (id, maj, donnees) values (1, now(), v)
    on conflict (id) do update set maj = excluded.maj, donnees = excluded.donnees;
  return v;
end $$;
revoke all on function public.classement_public_energy() from public;
grant execute on function public.classement_public_energy() to anon, authenticated;

-- Vérification : doit afficher « classement », « exclu », « fini » puis « classement_public_energy »
select column_name as verification from information_schema.columns where table_schema = 'public' and table_name = 'energy_pseudos' and column_name in ('classement', 'exclu')
union all select column_name from information_schema.columns where table_schema = 'public' and table_name = 'energy_progres' and column_name = 'fini'
union all select proname from pg_proc where proname = 'classement_public_energy' and pronamespace = 'public'::regnamespace;
