-- ═════════════════════════════════════════════════════════════════
--  Administrateur : seul(s) le(s) professeur(s) marqué(s) « admin » peut créer des comptes professeur depuis le site
--  (Suivi professeur → « Ajouter un professeur »). À exécuter UNE fois : SQL Editor → New query → coller → Run.
--  Relançable sans risque. Remplacez l'adresse si votre compte professeur en utilise une autre.
-- ═════════════════════════════════════════════════════════════════
alter table public.professeurs add column if not exists admin boolean not null default false;

update public.professeurs set admin = true
where user_id in (select id from auth.users where email = 'nils.aronssohn@ac-grenoble.fr');

-- Les professeurs ne peuvent PAS modifier cette colonne (lecture seule pour eux, écriture par le service seulement)
revoke insert, update, delete on public.professeurs from authenticated;

-- Vérification : une ligne « admin = true » pour vous, « false » pour les autres
select p.nom, u.email, p.admin from public.professeurs p join auth.users u on u.id = p.user_id order by p.admin desc, p.nom;
