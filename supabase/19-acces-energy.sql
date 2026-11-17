-- ═════════════════════════════════════════════════════════════════
--  Accès à Energy@School par professeur (étape 32)
--  • par défaut, un professeur utilise la Paillasse virtuelle seulement ;
--  • l'administrateur peut autoriser un professeur à utiliser aussi Energy@School (colonne « acces_energy ») ;
--  • un professeur autorisé choisit, pour chacune de ses classes : Paillasse seule, Energy@School seule, ou les deux sites ;
--  • sans autorisation, le serveur refuse tout autre choix que « Paillasse » (le contrôle est dans la base et dans la fonction « comptes »).
--  L'administrateur a toujours l'accès. Remplace le verrou « les deux sites réservé à l'administrateur » de 17-classe-deux-sites.sql.
--  Prérequis : 01 à 18 déjà exécutés. À exécuter UNE fois ; relançable sans risque.
-- ═════════════════════════════════════════════════════════════════
alter table public.professeurs add column if not exists acces_energy boolean not null default false;
revoke insert, update, delete on public.professeurs from authenticated;   -- personne ne s'accorde l'accès tout seul

-- Le professeur connecté a-t-il accès à Energy@School ? (administrateur : toujours)
create or replace function public.acces_energy()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.professeurs where user_id = auth.uid() and (admin or acces_energy));
$$;
revoke all on function public.acces_energy() from public, anon;
grant execute on function public.acces_energy() to authenticated;

-- Passer une classe sur « energy » ou « deux » demande cet accès ; revenir à « paillasse » est toujours permis. Le serveur (auth.uid() nul) n'est pas concerné.
create or replace function public.classes_controle_site()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and new.site is distinct from old.site and new.site in ('energy', 'deux') and not public.acces_energy() then
    raise exception 'Votre compte n’est pas autorisé à utiliser Energy@School : demandez-le à l’administrateur du site.' using errcode = 'P0001';
  end if;
  return new;
end $$;
-- (le déclencheur « classes_controle_site » créé par 17-classe-deux-sites.sql appelle cette fonction)

-- Vérification : l'administrateur a l'accès, les autres non tant que vous ne l'avez pas accordé
select p.nom, p.admin, p.acces_energy from public.professeurs p order by p.admin desc, p.nom;
