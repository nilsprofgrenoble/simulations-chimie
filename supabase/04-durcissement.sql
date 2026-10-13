-- ════════════════════════════════════════════════════════════════════════════
--  DURCISSEMENT (audit de sécurité, étape 16)
--  À coller dans Supabase → SQL Editor → « Run ». Sans risque, peut être relancé.
--  Ne change rien à ce que voient les élèves et le professeur ; ferme quatre petites portes :
--   1. les dates (début, dernière activité) sont fixées par le serveur, plus par le navigateur ;
--   2. une ligne d'activité ne peut pas changer d'exercice ni de propriétaire après coup ;
--   3. un compte ne peut pas remplir la base (1000 lignes par jour, 20 000 au total au maximum) ;
--   4. la clé d'exercice doit avoir la forme attendue (« 36:simple », « sim:17:defi »…) :
--      aucun texte libre ne peut arriver jusqu'au tableau du professeur ou à l'export CSV.
--  Ajoute aussi une fonction « ping », appelée tous les 3 jours par GitHub pour que Supabase
--  ne mette pas le projet en pause pendant les vacances (projets gratuits : pause après 7 jours sans activité).
-- ════════════════════════════════════════════════════════════════════════════

-- 1, 2, 3 : un seul déclencheur, avant chaque création ou mise à jour d'une ligne d'activité
create or replace function public.activites_controle()
returns trigger language plpgsql set search_path = '' as $$
declare n integer;
begin
  if tg_op = 'INSERT' then
    new.debut := now();
    new.maj   := now();
    select count(*) into n from public.activites where user_id = new.user_id and debut > now() - interval '1 day';
    if n >= 1000 then
      raise exception 'Trop d''enregistrements aujourd''hui pour ce compte.' using errcode = 'P0001';
    end if;
    select count(*) into n from public.activites where user_id = new.user_id;
    if n >= 20000 then
      raise exception 'Nombre maximal d''enregistrements atteint pour ce compte.' using errcode = 'P0001';
    end if;
  else
    new.id      := old.id;
    new.user_id := old.user_id;
    new.cle     := old.cle;
    new.debut   := old.debut;
    new.maj     := now();
  end if;
  return new;
end $$;
revoke all on function public.activites_controle() from public, anon, authenticated;

drop trigger if exists activites_controle on public.activites;
create trigger activites_controle before insert or update on public.activites
  for each row execute function public.activites_controle();

create index if not exists activites_user_debut_idx on public.activites (user_id, debut);

-- 4 : forme des clés (« not valid » : ne vérifie que les nouvelles lignes, les anciennes restent)
alter table public.activites drop constraint if exists activites_cle_format;
alter table public.activites add constraint activites_cle_format
  check (cle ~ '^(sim:)?[0-9]{1,3}:[A-Za-z0-9._:-]{1,70}$') not valid;

-- Fonction « ping » : ne lit ni n'écrit aucune donnée, sert seulement à montrer que le projet est utilisé
create or replace function public.ping()
returns integer language sql stable set search_path = '' as $$ select 1 $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;

-- Vérification : doit afficher « activites_controle » puis « activites_cle_format »
select tgname as verification from pg_trigger where tgrelid = 'public.activites'::regclass and tgname = 'activites_controle'
union all
select conname from pg_constraint where conrelid = 'public.activites'::regclass and conname = 'activites_cle_format';
