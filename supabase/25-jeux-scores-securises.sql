-- ═════════════════════════════════════════════════════════════════
--  SCORES DES JEUX SÉCURISÉS : l'élève ne peut plus écrire directement dans « jeux_scores ».
--  1) jeu_debut(jeu, niveau) : le serveur note l'heure de début d'une partie (jamais de mission sans début) ;
--  2) jeu_score(jeu, niveau, secondes) : le serveur vérifie que la partie existe, qu'elle n'a pas déjà servi,
--     que la durée réelle (horloge du serveur) est compatible avec le résultat annoncé, et il recalcule lui-même les étoiles
--     d'Urgence au labo à partir des secondes (celles envoyées par le navigateur ne sont pas crues).
--  Limite restante : un tricheur patient qui joue vraiment la durée minimale peut encore s'approcher des maximums possibles.
--  Prérequis : 24. Relançable sans risque.
-- ═════════════════════════════════════════════════════════════════
create table if not exists public.jeux_parties (
  id      bigint generated always as identity primary key,
  user_id uuid not null references public.eleves (user_id) on delete cascade,
  jeu     text not null,
  niveau  smallint not null,
  debut   timestamptz not null default now(),
  utilise boolean not null default false
);
create index if not exists jeux_parties_user on public.jeux_parties (user_id, jeu, niveau, debut desc);
alter table public.jeux_parties enable row level security;   -- aucune politique : accessible seulement par les fonctions ci-dessous

drop policy if exists jeux_scores_ajout on public.jeux_scores;
drop policy if exists jeux_scores_maj on public.jeux_scores;
revoke insert, update, delete on public.jeux_scores from authenticated;

create or replace function public.jeu_debut(p_jeu text, p_niveau int) returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null or not public.est_eleve() then return; end if;
  if p_jeu not in ('laser', 'urgence') or p_niveau < 1 or p_niveau > (case when p_jeu = 'laser' then 8 else 3 end) then return; end if;
  delete from public.jeux_parties where user_id = u and debut < now() - interval '2 days';
  -- au plus 120 parties lancées par heure
  if (select count(*) from public.jeux_parties where user_id = u and debut > now() - interval '1 hour') >= 120 then return; end if;
  -- relancer le même niveau remplace la partie non terminée
  delete from public.jeux_parties where user_id = u and jeu = p_jeu and niveau = p_niveau and not utilise;
  insert into public.jeux_parties (user_id, jeu, niveau) values (u, p_jeu, p_niveau);
end $$;

create or replace function public.jeu_score(p_jeu text, p_niveau int, p_etoiles int, p_secondes int) returns void
language plpgsql security definer set search_path = '' as $$
declare
  u uuid := auth.uid();
  pa record;
  ecoule numeric;
  t0 int; nb int; et int; sec int;
begin
  if u is null or not public.est_eleve() then return; end if;
  select * into pa from public.jeux_parties
    where user_id = u and jeu = p_jeu and niveau = p_niveau and not utilise and debut > now() - interval '6 hours'
    order by debut desc limit 1;
  if not found then return; end if;
  ecoule := extract(epoch from (now() - pa.debut));
  if p_jeu = 'laser' then
    if ecoule < 5 then return; end if;                 -- impossible de résoudre un niveau en moins de 5 s
    et := greatest(1, least(3, p_etoiles)); sec := 0;
  elsif p_jeu = 'urgence' then
    if p_niveau not between 1 and 3 then return; end if;
    t0 := (array[60, 70, 90])[p_niveau]; nb := (array[4, 5, 3])[p_niveau];
    sec := greatest(0, p_secondes);
    if ecoule < 6 then return; end if;
    if sec > t0 then return; end if;                   -- le compteur ne dépasse jamais la durée de départ
    if sec > t0 + 8 * nb - ecoule + 3 then return; end if;   -- au mieux : départ + 8 s par solution, moins le temps réellement écoulé
    et := case when sec >= 0.5 * t0 then 3 when sec >= 0.2 * t0 then 2 else 1 end;
  else
    return;
  end if;
  update public.jeux_parties set utilise = true where id = pa.id;
  insert into public.jeux_scores (user_id, jeu, niveau, etoiles, secondes) values (u, p_jeu, p_niveau, et, sec)
    on conflict (user_id, jeu, niveau) do update set etoiles = excluded.etoiles, secondes = excluded.secondes;
end $$;

revoke all on function public.jeu_debut(text, int) from public, anon;
revoke all on function public.jeu_score(text, int, int, int) from public, anon;
grant execute on function public.jeu_debut(text, int) to authenticated;
grant execute on function public.jeu_score(text, int, int, int) to authenticated;
