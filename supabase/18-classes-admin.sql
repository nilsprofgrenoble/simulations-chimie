-- ═════════════════════════════════════════════════════════════════
--  L'administrateur voit toutes les classes du site et règle leur « site » (étape 31)
--  • classes_admin() : liste (nom, préfixe, site, nom du professeur, nombre d'élèves). Aucun nom d'élève, aucun résultat.
--  • definir_site_classe(classe, site) : règle le site d'une classe, sans qu'elle soit partagée avec l'administrateur.
--  Les deux fonctions vérifient dans la base que l'appelant est administrateur (sinon : erreur). Le verrou de 17-classe-deux-sites.sql reste actif.
--  Prérequis : 01 à 17 déjà exécutés. À exécuter UNE fois ; relançable sans risque.
-- ═════════════════════════════════════════════════════════════════
create or replace function public.classes_admin()
returns table (id uuid, nom text, prefixe text, site text, prof_nom text, nb_eleves integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.est_admin() then raise exception 'Réservé à l’administrateur du site.' using errcode = '42501'; end if;
  return query
    select c.id, c.nom, c.prefixe, c.site, coalesce(p.nom, '—'),
           (select count(*)::integer from public.eleves e where e.classe_id = c.id)
    from public.classes c left join public.professeurs p on p.user_id = c.prof_id
    order by p.nom nulls last, c.cree_le;
end $$;
revoke all on function public.classes_admin() from public, anon;
grant execute on function public.classes_admin() to authenticated;

create or replace function public.definir_site_classe(c uuid, s text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.est_admin() then raise exception 'Réservé à l’administrateur du site.' using errcode = '42501'; end if;
  if s not in ('paillasse', 'energy', 'deux') then raise exception 'Site inconnu.' using errcode = '22023'; end if;
  update public.classes set site = s where id = c;
  if not found then raise exception 'Classe introuvable.' using errcode = 'P0002'; end if;
end $$;
revoke all on function public.definir_site_classe(uuid, text) from public, anon;
grant execute on function public.definir_site_classe(uuid, text) to authenticated;

-- Vérification : doit afficher les deux fonctions
select proname as verification from pg_proc where proname in ('classes_admin', 'definir_site_classe') and pronamespace = 'public'::regnamespace;
