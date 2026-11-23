-- ═════════════════════════════════════════════════════════════════
--  Inscription des professeurs par adresse académique (étape 40)
--  Prépare la base pour la fonction « inscription-prof » :
--   • professeurs.auto_inscrit : distingue les comptes créés par le professeur lui-même (limites plus basses, nettoyage possible) ;
--   • inscriptions_tentatives : journal des demandes, pour limiter les abus (par adresse, par réseau, par jour) ;
--   • trois petites fonctions réservées au serveur (jamais appelables depuis le site).
--  À exécuter UNE fois ; relançable sans risque. Prérequis : 01 à 22 déjà exécutés.
-- ═════════════════════════════════════════════════════════════════
alter table public.professeurs add column if not exists auto_inscrit boolean not null default false;

create table if not exists public.inscriptions_tentatives (
  id bigint generated always as identity primary key,
  email text not null,
  ip text,
  cree timestamptz not null default now()
);
create index if not exists inscriptions_tentatives_cree on public.inscriptions_tentatives (cree);
create index if not exists inscriptions_tentatives_email on public.inscriptions_tentatives (email, cree);
alter table public.inscriptions_tentatives enable row level security;       -- aucune règle : personne ne la lit depuis le site
revoke all on public.inscriptions_tentatives from anon, authenticated;
grant select, insert, delete on public.inscriptions_tentatives to service_role;

-- État d'un professeur à partir de son adresse : existe-t-il, a-t-il créé son compte lui-même, a-t-il confirmé son adresse ?
create or replace function public.prof_etat(e text)
returns table (user_id uuid, auto_inscrit boolean, confirme boolean)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.auto_inscrit, (u.email_confirmed_at is not null)
  from public.professeurs p join auth.users u on u.id = p.user_id
  where lower(u.email) = lower(e);
$$;
revoke all on function public.prof_etat(text) from public, anon, authenticated;
grant execute on function public.prof_etat(text) to service_role;

-- Comptes créés par inscription libre et jamais confirmés depuis plus de 14 jours (à supprimer : aucune donnée dessus)
create or replace function public.inscriptions_abandonnees()
returns table (user_id uuid)
language sql stable security definer set search_path = '' as $$
  select p.user_id from public.professeurs p join auth.users u on u.id = p.user_id
  where p.auto_inscrit and u.email_confirmed_at is null and u.created_at < now() - interval '14 days';
$$;
revoke all on function public.inscriptions_abandonnees() from public, anon, authenticated;
grant execute on function public.inscriptions_abandonnees() to service_role;

-- Liste des professeurs avec leur adresse (remplace la lecture limitée aux 200 premiers comptes, qui deviendrait fausse avec beaucoup de comptes élèves)
create or replace function public.profs_emails()
returns table (user_id uuid, email text, jamais_connecte boolean)
language sql stable security definer set search_path = '' as $$
  select p.user_id, u.email::text, (u.last_sign_in_at is null)
  from public.professeurs p join auth.users u on u.id = p.user_id;
$$;
revoke all on function public.profs_emails() from public, anon, authenticated;
grant execute on function public.profs_emails() to service_role;

-- Vérification : trois lignes, chacune avec « true » dans la colonne « service »
select proname, has_function_privilege('service_role', oid, 'execute') as service
from pg_proc where pronamespace = 'public'::regnamespace and proname in ('prof_etat', 'inscriptions_abandonnees', 'profs_emails') order by proname;
