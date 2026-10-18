-- ════════════════════════════════════════════════════════════════════════════
--  CHAPITRE EN COURS + DEVOIRS CIBLÉS (étape 22)
--  À coller dans Supabase → SQL Editor → « Run ». Sans risque, peut être relancé.
--  À lancer APRÈS 05-vie-de-classe.sql et 06-devoirs.sql.
--
--  Principes :
--   • le professeur choisit, classe par classe, de 0 à 3 chapitres « en cours » (ex. TSTL : Transport des fluides) ;
--     les élèves de la classe voient ces chapitres en tête de « Je m'entraîne », avec leurs simulations ; aucune donnée sur les élèves n'est ajoutée ;
--   • les chapitres sont des identifiants courts de la liste du site (src/chapitres.js) : aucun texte libre ;
--   • un devoir peut contenir jusqu'à 40 éléments, exercices ou simulations (clé « sim:<numéro> ») ;
--   • un devoir peut viser seulement certains élèves de la classe (liste d'identifiants internes). Sans liste, il vise toute
--     la classe, comme avant. Un élève ne voit QUE les devoirs qui visent toute sa classe ou qui le visent lui.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Chapitre(s) en cours d'une classe ─────────────────────────────────
--  Un chapitre est un identifiant court du menu du site (« tstl-fluides », « 1g-evolution »…, voir src/chapitres.js) :
--  de 0 à 3 par classe, sans doublon, jamais de texte libre. La liste précise est tenue par le site, pas par la base :
--  ajouter un chapitre au site ne demande donc aucun nouveau script SQL.
create or replace function public.chapitres_valides(c text[])
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(array_length(c, 1), 0) <= 3
     and coalesce((select bool_and(k ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(k) <= 40) from unnest(c) as k), true)
     and (select count(distinct k) from unnest(c) as k) = coalesce(array_length(c, 1), 0);
$$;
revoke all on function public.chapitres_valides(text[]) from public, anon;
grant execute on function public.chapitres_valides(text[]) to authenticated, service_role;   -- service_role : la création de classe passe par la fonction « comptes »

alter table public.classes add column if not exists chapitres text[] not null default '{}';
alter table public.classes drop constraint if exists classes_chapitres_valides;
update public.classes set chapitres = '{}' where not public.chapitres_valides(chapitres);   -- anciennes valeurs (noms de thèmes) d'une version précédente de ce script
alter table public.classes add constraint classes_chapitres_valides check (public.chapitres_valides(chapitres));
grant update (chapitres) on public.classes to authenticated;      -- la règle « classes_renommage » limite au professeur de la classe

-- ── 1 bis. Un devoir peut contenir jusqu'à 40 éléments : exercices (« 34:aspirine.0 ») et simulations (« sim:42 ») ─────
create or replace function public.cles_devoir_valides(c text[])
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(array_length(c, 1) between 1 and 40, false)
     and coalesce((select bool_and(k ~ '^([0-9]{1,3}:[A-Za-z0-9._:-]{1,70}|sim:[0-9]{1,3})$') from unnest(c) as k), false);
$$;

-- ── 2. Devoirs visant certains élèves ───────────────────────────────────
alter table public.devoirs add column if not exists eleves uuid[];
alter table public.devoirs drop constraint if exists devoirs_eleves_taille;
alter table public.devoirs add constraint devoirs_eleves_taille check (eleves is null or coalesce(array_length(eleves, 1), 0) between 1 and 60);   -- liste vide interdite (array_length d'une liste vide vaut NULL)

create or replace function public.devoirs_controle()
returns trigger language plpgsql set search_path = '' as $$
declare n integer;
begin
  if tg_op = 'INSERT' then
    new.cree_le := now();
    select count(*) into n from public.devoirs where classe_id = new.classe_id;
    if n >= 200 then raise exception 'Trop de devoirs pour cette classe (200 au maximum) : supprimez les anciens.' using errcode = 'P0001'; end if;
    if new.eleves is not null then            -- chaque élève visé doit appartenir à CETTE classe, sans doublon
      select count(*) into n from public.eleves where classe_id = new.classe_id and user_id = any (new.eleves);
      if n <> (select count(distinct k) from unnest(new.eleves) as k) or n <> array_length(new.eleves, 1) then
        raise exception 'Un des élèves choisis n''appartient pas à cette classe.' using errcode = 'P0001';
      end if;
    end if;
  else
    new.id := old.id; new.classe_id := old.classe_id; new.cles := old.cles; new.cree_le := old.cree_le; new.eleves := old.eleves;
  end if;
  return new;
end $$;
revoke all on function public.devoirs_controle() from public, anon, authenticated;

drop policy if exists devoirs_lecture on public.devoirs;
create policy devoirs_lecture on public.devoirs for select to authenticated
  using (public.prof_de_classe(classe_id)
         or (classe_id = (select public.ma_classe()) and (eleves is null or (select auth.uid()) = any (eleves))));

grant insert (eleves) on public.devoirs to authenticated;          -- s'ajoute aux colonnes déjà autorisées (classe_id, titre, cles, echeance)

-- Vérification : doit afficher « chapitres », « eleves », « chapitres_valides » puis « devoirs_controle »
select column_name as verification from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'chapitres'
union all select column_name from information_schema.columns where table_schema = 'public' and table_name = 'devoirs' and column_name = 'eleves'
union all select proname from pg_proc where proname = 'chapitres_valides' and pronamespace = 'public'::regnamespace
union all select tgname from pg_trigger where tgrelid = 'public.devoirs'::regclass and tgname = 'devoirs_controle';
