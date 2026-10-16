-- ════════════════════════════════════════════════════════════════════════════
--  VIE DE CLASSE (étape 20) : objectif collectif de la semaine + « prouesses de la semaine »
--  À coller dans Supabase → SQL Editor → « Run ». Sans risque, peut être relancé.
--
--  Principes :
--   • c'est le PROFESSEUR qui active la fonction, classe par classe (interrupteur « Vie de classe »,
--     éteint par défaut) : tant qu'il ne l'a pas fait, les élèves ne voient rien ;
--   • aucun texte libre : le pseudo d'un élève = deux numéros (un adjectif, un nom) pris dans une liste
--     fixe du site (« Brillante Comète », « Tenace Électron »…). Rien d'inapproprié n'est possible ;
--   • l'élève choisit son pseudo et décide s'il apparaît ou non (éteint par défaut) ;
--   • un pseudo n'est visible que par les élèves de SA classe (et par le professeur) ;
--   • il n'y a PAS de classement : une « prouesse » (ex. « 5 exercices réussis cette semaine »)
--     est atteinte ou non ; les pseudos sont listés sans ordre de mérite ;
--   • l'objectif collectif est un total pour la classe ; chaque élève y compte pour 5 réussites au plus.
--  Les listes d'adjectifs et de noms sont dans src/classe.js : on peut en AJOUTER à la fin, jamais en
--  retirer ni changer l'ordre (les numéros enregistrés ici en dépendent). Limite : 64 de chaque.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. L'interrupteur du professeur ──────────────────────────────────────
alter table public.classes add column if not exists vie_classe boolean not null default false;
grant update (nom, vie_classe) on public.classes to authenticated;   -- la règle « classes_renommage » limite au professeur de la classe

-- ── 2. Le pseudo de l'élève ─────────────────────────────────────────────
create table if not exists public.pseudos (
  user_id   uuid primary key default auth.uid() references public.eleves (user_id) on delete cascade,
  classe_id uuid not null default public.ma_classe() references public.classes (id) on delete cascade,
  adj       smallint not null check (adj between 0 and 63),
  nom       smallint not null check (nom between 0 and 63),
  visible   boolean not null default false,
  unique (classe_id, adj, nom)          -- deux élèves d'une même classe n'ont jamais le même pseudo
);

alter table public.pseudos enable row level security;

drop policy if exists pseudos_lecture on public.pseudos;
create policy pseudos_lecture on public.pseudos for select to authenticated
  using (user_id = (select auth.uid()) or public.prof_de_eleve(user_id));
drop policy if exists pseudos_creation on public.pseudos;
create policy pseudos_creation on public.pseudos for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.est_eleve()));
drop policy if exists pseudos_maj on public.pseudos;
create policy pseudos_maj on public.pseudos for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.pseudos from anon, authenticated;
grant select on public.pseudos to authenticated;
grant insert (adj, nom, visible) on public.pseudos to authenticated;   -- user_id et classe_id sont fixés par le serveur
grant update (adj, nom, visible) on public.pseudos to authenticated;
grant usage on schema public to service_role;
grant all on public.pseudos to service_role;

-- ── 3. La lecture de la semaine de la classe ────────────────────────────
--  Appelée par le site : « classe_semaine(identifiant de la classe) ».
--  Réservée aux élèves de cette classe et à son professeur ; ne renvoie que des totaux
--  et les pseudos des élèves qui ont choisi d'apparaître. Aucune donnée individuelle chiffrée.
create or replace function public.classe_semaine(c uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_debut timestamptz := date_trunc('week', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris';   -- lundi 0 h, heure de Paris
  actif  boolean;
  eff    integer;
  resultat jsonb;
begin
  -- coalesce : pour un professeur, ma_classe() vaut NULL ; sans cela « NULL ou faux » donnerait NULL et l'accès serait accordé
  if c is null or not (coalesce(c = public.ma_classe(), false) or coalesce(public.prof_de_classe(c), false)) then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;
  select vie_classe into actif from public.classes where id = c;
  if not coalesce(actif, false) then
    return jsonb_build_object('actif', false);
  end if;
  select count(*) into eff from public.eleves where classe_id = c;

  with s as (          -- une ligne par élève et par exercice réussi cette semaine (les temps « sim: » ne comptent pas)
    select a.user_id, a.cle,
           bool_or(a.corrections_vues = 0)                    as sans_correction,
           bool_or(a.corrections_vues = 0 and a.essais <= 1)  as du_premier_coup
    from public.activites a join public.eleves e on e.user_id = a.user_id
    where e.classe_id = c and a.reussi and a.maj >= v_debut and a.cle !~ '^sim:'
    group by a.user_id, a.cle
  ), jours as (
    select a.user_id, count(distinct (a.maj at time zone 'Europe/Paris')::date) as n
    from public.activites a join public.eleves e on e.user_id = a.user_id
    where e.classe_id = c and a.reussi and a.maj >= v_debut and a.cle !~ '^sim:'
    group by a.user_id
  ), u as (            -- une ligne par élève
    select s.user_id,
           count(*)                                  as reussis,
           count(*) filter (where s.sans_correction) as sans_correction,
           count(*) filter (where s.du_premier_coup) as du_premier_coup,
           coalesce(max(j.n), 0)                     as jours
    from s left join jours j on j.user_id = s.user_id
    group by s.user_id
  ), p as (            -- (prouesse, élève) atteints
    select 'cinq'::text as code, user_id from u where reussis >= 5
    union all select 'sans_aide',    user_id from u where sans_correction >= 3
    union all select 'premier_coup', user_id from u where du_premier_coup >= 3
    union all select 'regulier',     user_id from u where jours >= 3
  ), liste as (        -- seuls les élèves qui ont choisi d'apparaître ; ordre des numéros = aucun lien avec le mérite
    select p.code, jsonb_agg(jsonb_build_array(ps.adj, ps.nom) order by ps.adj, ps.nom) as pseudos
    from p join public.pseudos ps on ps.user_id = p.user_id and ps.classe_id = c and ps.visible
    group by p.code
  )
  select jsonb_build_object(
           'actif', true, 'debut', v_debut, 'effectif', eff,
           'reussites', (select coalesce(sum(least(5, reussis)), 0) from u),
           'objectif', greatest(4, 2 * eff),
           'prouesses', (select coalesce(jsonb_agg(jsonb_build_object('code', code, 'pseudos', pseudos) order by code), '[]'::jsonb) from liste))
  into resultat;
  return resultat;
end $$;

revoke all on function public.classe_semaine(uuid) from public, anon;
grant execute on function public.classe_semaine(uuid) to authenticated;

-- Vérification : doit afficher « vie_classe », « pseudos » puis « classe_semaine »
select column_name as verification from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'vie_classe'
union all select tablename from pg_tables where schemaname = 'public' and tablename = 'pseudos'
union all select proname from pg_proc where proname = 'classe_semaine' and pronamespace = 'public'::regnamespace;
