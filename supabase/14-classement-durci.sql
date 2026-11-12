-- ════════════════════════════════════════════════════════════════════════════
--  CLASSEMENT PUBLIC : DURCISSEMENT ANTI-TRICHE (étape 27, suite d'un audit de sécurité)
--  À coller dans Supabase → SQL Editor → « Run », APRÈS 13-classement.sql. Sans risque, peut être relancé.
--
--  Ce que l'audit a montré (attaques réelles faites sur une copie de la base) :
--   • un élève pouvait envoyer au serveur des « exercices » qui n'existent pas (clés inventées) : 500 faux exercices = 1 500 étoiles,
--     en une requête ;
--   • un élève peut modifier ses propres lignes (essais, réussite) : les résultats sont calculés dans son navigateur ;
--   • la page publique recalculait tout à chaque visite (0,8 s avec 240 000 lignes) : n'importe qui pouvait la solliciter en boucle ;
--   • le professeur ne pouvait pas retirer un seul élève du classement.
--  Ce qui était déjà solide : un élève ne peut ni écrire au nom d'un autre, ni changer de classe, ni prendre le pseudo d'un camarade,
--  ni modifier l'établissement, ni lire autre chose que le classement (visiteur sans compte compris).
--
--  Ce que fait ce script :
--   1. LISTE DES EXERCICES VALIDES (« cles_valides ») : le classement ne compte que les exercices et défis qui existent vraiment sur le
--      site. Elle se remplit TOUTE SEULE : dès qu'un professeur ouvre « Suivi professeur », le site y ajoute les exercices manquants.
--      Les élèves ne peuvent ni la lire ni la modifier. Tant qu'elle est vide, le classement est vide (réglage sûr par défaut) ;
--   2. PLAFOND : au plus 50 exercices comptent par élève et par jour (50 × 3 = 150 étoiles par jour au maximum) ;
--   3. RETRAIT D'UN ÉLÈVE par son professeur (fonction « exclure_du_classement », bouton dans Suivi professeur → Élèves) ;
--   4. CACHE : le classement n'est recalculé qu'une fois par minute au plus (et tout de suite si un élève coche ou décoche la case,
--      ou si un professeur retire un élève).
--  Limite qui reste (impossible à supprimer sans valider chaque réponse sur le serveur) : un élève qui fabrique lui-même des lignes
--  « réussi du premier coup » pour de vrais exercices peut encore gagner jusqu'à 150 étoiles par jour ; le professeur les repère
--  (signal « résultats suspects » dans Suivi professeur) et peut le retirer du classement.
--  Prérequis : 01 à 13 déjà exécutés.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Les exercices et défis qui existent vraiment ─────────────────────
create table if not exists public.cles_valides (
  cle text primary key check (cle ~ '^[0-9]{1,3}:[A-Za-z0-9._:-]{1,70}$')
);
alter table public.cles_valides enable row level security;
drop policy if exists cles_lecture on public.cles_valides;
create policy cles_lecture on public.cles_valides for select to authenticated using ((select public.est_prof()));
drop policy if exists cles_ajout on public.cles_valides;
create policy cles_ajout on public.cles_valides for insert to authenticated with check ((select public.est_prof()));
revoke all on public.cles_valides from anon, authenticated;
grant select, insert on public.cles_valides to authenticated;       -- réservé aux professeurs par les règles ci-dessus
grant all on public.cles_valides to service_role;

-- ── 2. Retrait d'un élève du classement par son professeur ─────────────
alter table public.pseudos add column if not exists exclu boolean not null default false;   -- aucun droit d'écriture pour l'élève : seul le professeur (fonction ci-dessous)

create table if not exists public.classement_cache (
  id      integer primary key check (id = 1),
  maj     timestamptz not null,
  donnees jsonb not null
);
alter table public.classement_cache enable row level security;
revoke all on public.classement_cache from anon, authenticated;
grant all on public.classement_cache to service_role;

-- Toute modification qui peut changer le classement vide le cache (le prochain visiteur recalcule)
create or replace function public.classement_invalide()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.classement_cache where id = 1;
  return null;
end $$;
revoke all on function public.classement_invalide() from public, anon, authenticated;
drop trigger if exists classement_invalide_pseudos on public.pseudos;
create trigger classement_invalide_pseudos after insert or update or delete on public.pseudos
  for each statement execute function public.classement_invalide();
drop trigger if exists classement_invalide_classes on public.classes;
create trigger classement_invalide_classes after update on public.classes
  for each statement execute function public.classement_invalide();

create or replace function public.exclure_du_classement(eleve uuid, retirer boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if eleve is null or not coalesce(public.prof_de_eleve(eleve), false) then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;
  update public.pseudos set exclu = coalesce(retirer, false) where user_id = eleve;
end $$;
revoke all on function public.exclure_du_classement(uuid, boolean) from public, anon;
grant execute on function public.exclure_du_classement(uuid, boolean) to authenticated;

-- ── 3. Le calcul (jamais appelé directement par le site) ────────────────
--  Étoiles d'une séance (mêmes règles que src/carnet.js) : 0 si non réussi · 1 si la correction a été vue · sinon 3 (1er essai), 2 (2e), 1.
--  Étoiles d'un exercice : la meilleure de ses séances. Seuls comptent les exercices de « cles_valides » ; au plus 50 par élève et par jour
--  (jour de la dernière réussite) ; les élèves retirés par leur professeur n'apparaissent pas.
create or replace function public.classement_calcul()
returns jsonb language sql stable security definer set search_path = '' as $$
  with debut as (
    select date_trunc('week', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris' as lundi
  ), part as (
    select ps.user_id, ps.adj, ps.nom, btrim(c.etablissement) as etab, c.nom as classe
    from public.pseudos ps
    join public.classes c on c.id = ps.classe_id
    where ps.classement and not ps.exclu and c.site = 'paillasse' and c.etablissement is not null
  ), seance as (
    select a.user_id, a.cle, a.maj, a.reussi,
           case when not a.reussi then 0
                when a.corrections_vues > 0 then 1
                when a.essais <= 1 then 3
                when a.essais = 2 then 2
                else 1 end as et
    from public.activites a
    join part p on p.user_id = a.user_id
    join public.cles_valides v on v.cle = a.cle
  ), parcle as (
    select user_id, cle, max(et) as et, max(maj) filter (where reussi) as dernier
    from seance group by user_id, cle
  ), retenu as (
    select user_id, cle, et, dernier,
           row_number() over (partition by user_id, (dernier at time zone 'Europe/Paris')::date order by et desc, cle) as rn
    from parcle where et > 0
  ), lames as (
    select 'etoiles'::text as code, user_id, sum(et)::int as score from retenu where rn <= 50 group by user_id
    union all
    select 'semaine', r.user_id, count(*)::int from retenu r, debut d where r.rn <= 50 and r.dernier >= d.lundi group by r.user_id
    union all
    select 'defis', user_id, count(*)::int from retenu where rn <= 50 and cle ~ '^[0-9]{1,3}:defi\.' group by user_id
    union all
    select 'regularite', t.user_id, count(distinct date_trunc('week', t.moment at time zone 'Europe/Paris'))::int
      from (select a.user_id, unnest(array[a.debut, a.maj]) as moment
            from public.activites a join part p on p.user_id = a.user_id) t group by t.user_id
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
      'etoiles',    coalesce((select lignes from liste where code = 'etoiles'),    '[]'::jsonb),
      'semaine',    coalesce((select lignes from liste where code = 'semaine'),    '[]'::jsonb),
      'defis',      coalesce((select lignes from liste where code = 'defis'),      '[]'::jsonb),
      'regularite', coalesce((select lignes from liste where code = 'regularite'), '[]'::jsonb)));
$$;
revoke all on function public.classement_calcul() from public, anon, authenticated;

-- ── 4. La porte publique : sert le calcul gardé en cache (60 s) ─────────────
drop function if exists public.classement_public();
create function public.classement_public()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare c record; v jsonb;
begin
  select * into c from public.classement_cache where id = 1;
  if found and c.maj > now() - interval '60 seconds' then return c.donnees; end if;
  if not pg_try_advisory_xact_lock(7151) then      -- un autre visiteur est en train de recalculer
    if found then return c.donnees; end if;        -- on sert la version précédente
    perform pg_advisory_xact_lock(7151);           -- tout premier calcul : on attend qu'il soit fait
    select * into c from public.classement_cache where id = 1;
    if found then return c.donnees; end if;
  end if;
  v := public.classement_calcul();
  insert into public.classement_cache (id, maj, donnees) values (1, now(), v)
    on conflict (id) do update set maj = excluded.maj, donnees = excluded.donnees;
  return v;
end $$;
revoke all on function public.classement_public() from public;
grant execute on function public.classement_public() to anon, authenticated;

-- Vérification : doit afficher « cles_valides », « exclu » puis « classement_public »
select tablename as verification from pg_tables where schemaname = 'public' and tablename = 'cles_valides'
union all select column_name from information_schema.columns where table_schema = 'public' and table_name = 'pseudos' and column_name = 'exclu'
union all select proname from pg_proc where proname = 'classement_public' and pronamespace = 'public'::regnamespace;
