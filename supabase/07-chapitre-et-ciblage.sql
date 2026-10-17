-- ════════════════════════════════════════════════════════════════════════════
--  CHAPITRE EN COURS + DEVOIRS CIBLÉS (étape 22)
--  À coller dans Supabase → SQL Editor → « Run ». Sans risque, peut être relancé.
--  À lancer APRÈS 05-vie-de-classe.sql et 06-devoirs.sql.
--
--  Principes :
--   • le professeur choisit, classe par classe, de 0 à 3 thèmes « en cours » (ex. « Transport des fluides ») ;
--     les élèves de la classe voient ces thèmes en tête de « Je m'entraîne » ; aucune donnée sur les élèves n'est ajoutée ;
--   • les thèmes sont pris dans une liste fixe (la même que dans src/simulations/ordreDomaines.js) : aucun texte libre ;
--   • un devoir peut viser seulement certains élèves de la classe (liste d'identifiants internes). Sans liste, il vise toute
--     la classe, comme avant. Un élève ne voit QUE les devoirs qui visent toute sa classe ou qui le visent lui.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Chapitre(s) en cours d'une classe ─────────────────────────────────
create or replace function public.chapitres_valides(c text[])
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(array_length(c, 1), 0) <= 3
     and coalesce((select bool_and(k = any (array['Transmission de signaux numériques', 'Transport des fluides', 'Régulation',
                                                    'Transferts thermiques', 'Chimie', 'Mécanique', 'Métrologie'])) from unnest(c) as k), true)
     and (select count(distinct k) from unnest(c) as k) = coalesce(array_length(c, 1), 0);
$$;
revoke all on function public.chapitres_valides(text[]) from public, anon;
grant execute on function public.chapitres_valides(text[]) to authenticated;

alter table public.classes add column if not exists chapitres text[] not null default '{}';
alter table public.classes drop constraint if exists classes_chapitres_valides;
alter table public.classes add constraint classes_chapitres_valides check (public.chapitres_valides(chapitres));
grant update (chapitres) on public.classes to authenticated;      -- la règle « classes_renommage » limite au professeur de la classe

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
