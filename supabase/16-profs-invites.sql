-- ═════════════════════════════════════════════════════════════════
--  Rôle « invité » pour les professeurs (étape 29)
--  Un professeur invité voit les classes qu'on lui partage, donne des devoirs, règle le chapitre en cours.
--  Il ne peut NI créer de classe, NI créer de comptes élèves, NI alimenter la liste des exercices valides du classement.
--  À exécuter UNE fois : SQL Editor → New query → coller → Run. Relançable sans risque.
--  Prérequis : 01 à 14 déjà exécutés (surtout 10-administrateur.sql).
-- ═════════════════════════════════════════════════════════════════
alter table public.professeurs add column if not exists invite boolean not null default false;

-- Le professeur connecté est-il invité ? (security definer : évite que les règles s'appellent en boucle)
create or replace function public.est_invite()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.professeurs where user_id = auth.uid() and invite);
$$;
revoke all on function public.est_invite() from public, anon;
grant execute on function public.est_invite() to authenticated;

-- Création de classe : réservée aux professeurs non invités (le site passe par la fonction « comptes », mais l'accès direct est fermé aussi)
drop policy if exists classes_creation on public.classes;
create policy classes_creation on public.classes for insert to authenticated
  with check (prof_id = (select auth.uid()) and (select public.est_prof()) and not (select public.est_invite()));

-- Liste des exercices valides du classement : un invité ne peut pas l'alimenter
drop policy if exists cles_ajout on public.cles_valides;
create policy cles_ajout on public.cles_valides for insert to authenticated
  with check ((select public.est_prof()) and not (select public.est_invite()));

-- Les professeurs ne peuvent toujours pas modifier cette table (10-administrateur.sql) : personne ne se donne un rôle tout seul
revoke insert, update, delete on public.professeurs from authenticated;

-- Vérification : une ligne par professeur ; « invite » vaut false pour tous tant que vous n'avez rien changé
select p.nom, u.email, p.admin, p.invite from public.professeurs p join auth.users u on u.id = p.user_id order by p.admin desc, p.nom;
