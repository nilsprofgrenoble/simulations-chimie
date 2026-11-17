-- ═════════════════════════════════════════════════════════════════
--  Classe sur les DEUX sites (étape 30) : une classe peut être utilisée à la fois sur Energy@School et sur la Paillasse virtuelle
--  • le « site » d'une classe accepte une troisième valeur : « deux » (les élèves se connectent sur les deux sites, avec les mêmes identifiants) ;
--  • seul l'administrateur peut mettre une classe sur « deux », ou la faire sortir de cet état (contrôle dans la base, pas seulement dans le site) ;
--  • le classement public de la Paillasse compte aussi les élèves des classes « deux » (toujours seulement ceux qui l'ont choisi).
--  Les classes existantes ne changent pas. À exécuter UNE fois (SQL Editor → New query → coller → Run). Relançable sans risque.
--  Prérequis : 01 à 16 déjà exécutés.
-- ═════════════════════════════════════════════════════════════════

alter table public.classes drop constraint if exists classes_site_valide;
alter table public.classes add constraint classes_site_valide check (site in ('paillasse', 'energy', 'deux'));

-- Le professeur connecté est-il administrateur ? (security definer : évite que les règles s'appellent en boucle)
create or replace function public.est_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.professeurs where user_id = auth.uid() and admin);
$$;
revoke all on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- « deux » : réservé à l'administrateur (entrer dans cet état ou en sortir). Le serveur (auth.uid() nul) n'est pas concerné.
create or replace function public.classes_controle_site()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and new.site is distinct from old.site
     and (new.site = 'deux' or old.site = 'deux') and not public.est_admin() then
    raise exception 'Seul l’administrateur du site peut mettre une classe sur les deux sites.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists classes_controle_site on public.classes;
create trigger classes_controle_site before update on public.classes
  for each row execute function public.classes_controle_site();

-- Classement public : les classes « paillasse » et « deux » comptent (Energy@School seule, non)
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
-- Le classement affiché se recalcule au prochain visiteur
delete from public.classement_cache;

-- Vérification : doit afficher « deux » dans la contrainte, puis le déclencheur
select pg_get_constraintdef(oid) as verification from pg_constraint where conname = 'classes_site_valide'
union all select tgname from pg_trigger where tgname = 'classes_controle_site' and not tgisinternal;
