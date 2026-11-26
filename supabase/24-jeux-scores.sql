-- ═════════════════════════════════════════════════════════════════
--  JEUX DANS LE CLASSEMENT : résultats de Laser Maze (jeu « laser », 8 niveaux, étoiles) et d'Urgence au labo (jeu « urgence », 3 missions,
--  étoiles + secondes d'avance). Un résultat par élève, par jeu et par niveau (le MEILLEUR est gardé, jamais un recul).
--  Deux nouveaux classements publics : « laser » (total d'étoiles) et « urgence » (total des secondes d'avance sur les missions réussies).
--  Mêmes règles de confidentialité que le classement existant (élèves qui ont accepté d'apparaître, établissement renseigné).
--  Limite assumée : le résultat est envoyé par le navigateur de l'élève (comme tout jeu côté client) ; les valeurs sont bornées par la base.
--  Prérequis : 01 à 23 déjà exécutés. Sans risque, peut être relancé.
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.jeux_scores (
  user_id  uuid not null default auth.uid() references public.eleves (user_id) on delete cascade,
  jeu      text not null check (jeu in ('laser', 'urgence')),
  niveau   smallint not null check (niveau between 1 and 8),
  etoiles  smallint not null check (etoiles between 1 and 3),
  secondes smallint not null default 0 check (secondes between 0 and 300),
  maj      timestamptz not null default now(),
  primary key (user_id, jeu, niveau),
  check (jeu <> 'urgence' or niveau <= 3)
);
alter table public.jeux_scores enable row level security;
drop policy if exists jeux_scores_lecture on public.jeux_scores;
create policy jeux_scores_lecture on public.jeux_scores for select to authenticated using (user_id = auth.uid());
drop policy if exists jeux_scores_ajout on public.jeux_scores;
create policy jeux_scores_ajout on public.jeux_scores for insert to authenticated with check (user_id = auth.uid() and public.est_eleve());
drop policy if exists jeux_scores_maj on public.jeux_scores;
create policy jeux_scores_maj on public.jeux_scores for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.jeux_scores to authenticated;

-- Le meilleur résultat est conservé : une mise à jour ne peut pas dégrader l'existant
create or replace function public.jeux_scores_meilleur() returns trigger language plpgsql set search_path = '' as $$
begin
  new.etoiles := greatest(new.etoiles, old.etoiles);
  new.secondes := greatest(new.secondes, old.secondes);
  new.maj := now();
  return new;
end $$;
drop trigger if exists jeux_scores_meilleur on public.jeux_scores;
create trigger jeux_scores_meilleur before update on public.jeux_scores for each row execute function public.jeux_scores_meilleur();

-- Calcul des classements : ancien calcul + deux classements de jeux (la fonction « classement_public » le met en cache 60 s)
create or replace function public.classement_calcul()
returns jsonb language sql stable security definer set search_path = '' as $$
  with debut as (
    select date_trunc('week', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris' as lundi
  ), part as (
    select ps.user_id, ps.adj, ps.nom, btrim(c.etablissement) as etab, c.nom as classe
    from public.pseudos ps
    join public.classes c on c.id = ps.classe_id
    where ps.classement and not ps.exclu and c.site in ('paillasse', 'deux') and c.etablissement is not null
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
    union all
    select 'laser', j.user_id, sum(j.etoiles)::int from public.jeux_scores j join part p on p.user_id = j.user_id where j.jeu = 'laser' group by j.user_id
    union all
    select 'urgence', j.user_id, sum(j.secondes)::int from public.jeux_scores j join part p on p.user_id = j.user_id where j.jeu = 'urgence' group by j.user_id
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
      'regularite', coalesce((select lignes from liste where code = 'regularite'), '[]'::jsonb),
      'laser',      coalesce((select lignes from liste where code = 'laser'),      '[]'::jsonb),
      'urgence',    coalesce((select lignes from liste where code = 'urgence'),    '[]'::jsonb)));
$$;
-- Force un recalcul au prochain passage (le cache date d'avant les nouveaux classements)
delete from public.classement_cache;
