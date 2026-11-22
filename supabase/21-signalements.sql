-- ═════════════════════════════════════════════════════════════════
--  SIGNALEMENTS : le bouton « Un problème ? » du site. Tout visiteur peut envoyer un signalement (sans compte, sans nom) ;
--  seul l'administrateur peut les lire et les trier. Un plafond global (30 par minute) protège de l'envoi massif.
--  Prérequis : 01 à 20 déjà exécutés (fonction est_admin). À exécuter UNE fois ; relançable sans risque.
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.signalements (
  id          bigint generated always as identity primary key,
  cree_le     timestamptz not null default now(),
  motif       text not null check (motif in ('reponse', 'enonce', 'bug', 'texte', 'autre')),
  message     text check (message is null or char_length(message) <= 600),
  page        text not null check (char_length(page) <= 400),
  sim_id      integer,
  sim_titre   text check (sim_titre is null or char_length(sim_titre) <= 200),
  mode        text check (mode is null or char_length(mode) <= 30),
  etape       text check (etape is null or char_length(etape) <= 200),
  code_exo    text check (code_exo is null or char_length(code_exo) <= 40),
  appareil    text check (appareil is null or char_length(appareil) <= 200),
  statut      text not null default 'nouveau' check (statut in ('nouveau', 'en_cours', 'corrige', 'classe')),
  note_admin  text check (note_admin is null or char_length(note_admin) <= 1000)
);
alter table public.signalements enable row level security;

drop policy if exists signalements_envoi on public.signalements;
create policy signalements_envoi on public.signalements for insert to anon, authenticated
  with check (statut = 'nouveau' and note_admin is null);
drop policy if exists signalements_lecture on public.signalements;
create policy signalements_lecture on public.signalements for select to authenticated using (public.est_admin());
drop policy if exists signalements_maj on public.signalements;
create policy signalements_maj on public.signalements for update to authenticated using (public.est_admin()) with check (public.est_admin());

revoke all on public.signalements from anon, authenticated;
grant insert on public.signalements to anon, authenticated;
grant select, update on public.signalements to authenticated;

-- plafond global : au plus 30 signalements par minute, pour tout le site
create or replace function public.signalements_plafond() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.signalements where cree_le > now() - interval '1 minute') >= 30 then
    raise exception 'Trop de signalements en ce moment, réessayez dans une minute.' using errcode = '54000';
  end if;
  return new;
end $$;
drop trigger if exists signalements_plafond on public.signalements;
create trigger signalements_plafond before insert on public.signalements for each row execute function public.signalements_plafond();

-- Vérification : doit afficher « signalements »
select tablename as verification from pg_tables where schemaname = 'public' and tablename = 'signalements';
