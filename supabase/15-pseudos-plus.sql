-- ════════════════════════════════════════════════════════════════════════════
--  PLUS DE PSEUDOS (étape 28) : la liste de pseudos passe de 64 à 256 mots possibles de chaque sorte
--  À coller dans Supabase → SQL Editor → « Run ». Sans risque, peut être relancé. Les pseudos déjà choisis ne changent pas.
--  Prérequis : 05-vie-de-classe.sql exécuté.
-- ════════════════════════════════════════════════════════════════════════════
do $$
declare r record;
begin
  -- retire les anciennes limites « entre 0 et 63 » (quel que soit leur nom)
  for r in
    select conname from pg_constraint
    where conrelid = 'public.pseudos'::regclass and contype = 'c'
      and (pg_get_constraintdef(oid) like '%adj%' or pg_get_constraintdef(oid) like '%(nom >=%' or pg_get_constraintdef(oid) like '%(nom <=%')
      and conname <> 'pseudos_adj_liste' and conname <> 'pseudos_nom_liste'
  loop
    execute format('alter table public.pseudos drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.pseudos drop constraint if exists pseudos_adj_liste;
alter table public.pseudos drop constraint if exists pseudos_nom_liste;
alter table public.pseudos add constraint pseudos_adj_liste check (adj between 0 and 255);
alter table public.pseudos add constraint pseudos_nom_liste check (nom between 0 and 255);

-- Vérification : doit afficher deux lignes, « pseudos_adj_liste » et « pseudos_nom_liste »
select conname as verification from pg_constraint
where conrelid = 'public.pseudos'::regclass and conname in ('pseudos_adj_liste', 'pseudos_nom_liste') order by conname;
