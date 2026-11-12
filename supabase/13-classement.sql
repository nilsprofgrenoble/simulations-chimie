-- ════════════════════════════════════════════════════════════════════════════
--  CLASSEMENT PUBLIC (étape 26) : quatre classements, visibles par tout le monde, sans compte
--  À coller dans Supabase → SQL Editor → « Run ». Sans risque, peut être relancé.
--
--  Principes :
--   • c'est l'ÉLÈVE seul qui décide d'apparaître (case « Apparaître dans le classement public »,
--     éteinte par défaut). Cet accord est DISTINCT de celui de la « vie de classe » (colonne « visible ») :
--     un élève qui a accepté d'apparaître dans sa classe n'apparaît donc PAS dans le classement public ;
--   • ce qui devient public : le pseudo (liste fixe, aucun texte libre), le nom de l'établissement, le nom de la classe
--     et un score. Jamais d'identifiant, de nom ou d'adresse ;
--   • une classe n'apparaît que si son professeur a renseigné l'établissement (Suivi professeur) ;
--   • seuls les élèves des classes du site « Paillasse virtuelle » comptent (pas Energy@School) ;
--   • les scores sont calculés ICI, à partir des mêmes lignes « activites » que le carnet de l'élève (mêmes règles d'étoiles) ;
--   • la fonction « classement_public » est la seule porte d'entrée : elle ne lit rien d'autre et ne renvoie que les 30 premiers
--     de chaque classement (scores > 0).
--  Prérequis : 01 à 12 déjà exécutés.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. L'établissement d'une classe (renseigné par le professeur) ──────────
alter table public.classes add column if not exists etablissement text;
alter table public.classes drop constraint if exists classes_etablissement_valide;
alter table public.classes add constraint classes_etablissement_valide
  check (etablissement is null or char_length(btrim(etablissement)) between 2 and 60);
grant update (etablissement) on public.classes to authenticated;   -- la règle « classes_renommage » limite aux professeurs de la classe

-- ── 2. L'accord de l'élève pour le classement public ─────────────────────
alter table public.pseudos add column if not exists classement boolean not null default false;
grant insert (adj, nom, visible, classement) on public.pseudos to authenticated;
grant update (adj, nom, visible, classement) on public.pseudos to authenticated;

-- ── 3. Les classements publics ────────────────────────────────────────
--  Appelée par le site : « classement_public() ». Ouverte à tous, même sans compte.
--  Étoiles d'une séance (mêmes règles que src/carnet.js) : 0 si non réussi · 1 si la correction a été vue · sinon 3 (1er essai), 2 (2e essai), 1.
--  Étoiles d'un exercice : la meilleure de ses séances. Les temps passés (clés « sim:… ») ne rapportent rien.
create or replace function public.classement_public()
returns jsonb language sql stable security definer set search_path = '' as $$
  with debut as (
    select date_trunc('week', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris' as lundi
  ), part as (          -- élèves qui ont accepté d'apparaître, dans une classe Paillasse dont l'établissement est renseigné
    select ps.user_id, ps.adj, ps.nom, btrim(c.etablissement) as etab, c.nom as classe
    from public.pseudos ps
    join public.classes c on c.id = ps.classe_id
    where ps.classement and c.site = 'paillasse' and c.etablissement is not null
  ), seance as (        -- une ligne par séance d'exercice ou de défi
    select a.user_id, a.cle, a.maj, a.reussi,
           case when not a.reussi then 0
                when a.corrections_vues > 0 then 1
                when a.essais <= 1 then 3
                when a.essais = 2 then 2
                else 1 end as et
    from public.activites a join part p on p.user_id = a.user_id
    where a.cle !~ '^sim:'
  ), parcle as (        -- une ligne par exercice : sa meilleure séance
    select user_id, cle, max(et) as et from seance group by user_id, cle
  ), lames as (
    select 'etoiles'::text as code, user_id, sum(et)::int as score from parcle group by user_id
    union all
    select 'semaine', s.user_id, count(distinct s.cle)::int
      from seance s, debut d where s.reussi and s.maj >= d.lundi group by s.user_id
    union all
    select 'defis', user_id, count(*)::int from parcle where et > 0 and cle ~ '^[0-9]{1,3}:defi\.' group by user_id
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

revoke all on function public.classement_public() from public;
grant execute on function public.classement_public() to anon, authenticated;

-- Vérification : doit afficher « etablissement », « classement » puis « classement_public »
select column_name as verification from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'etablissement'
union all select column_name from information_schema.columns where table_schema = 'public' and table_name = 'pseudos' and column_name = 'classement'
union all select proname from pg_proc where proname = 'classement_public' and pronamespace = 'public'::regnamespace;
