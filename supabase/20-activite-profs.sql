-- ═════════════════════════════════════════════════════════════════
--  Activité des professeurs, pour l'administrateur (étape 33) : dernière connexion, nombre de classes, nombre d'élèves.
--  Rien d'autre n'est suivi (ni temps passé, ni pages vues). Réservé à l'administrateur : toute autre personne reçoit une erreur.
--  Prérequis : 01 à 19 déjà exécutés. À exécuter UNE fois ; relançable sans risque.
-- ═════════════════════════════════════════════════════════════════
create or replace function public.profs_activite()
returns table (email text, derniere_connexion timestamptz, nb_classes integer, nb_eleves integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.est_admin() then raise exception 'Réservé à l’administrateur du site.' using errcode = '42501'; end if;
  return query
    select u.email::text, u.last_sign_in_at,
           (select count(*)::integer from public.classes c where c.prof_id = p.user_id),
           (select count(*)::integer from public.eleves e join public.classes c on c.id = e.classe_id where c.prof_id = p.user_id)
    from public.professeurs p join auth.users u on u.id = p.user_id;
end $$;
revoke all on function public.profs_activite() from public, anon;
grant execute on function public.profs_activite() to authenticated;

-- Vérification : doit afficher la fonction
select proname as verification from pg_proc where proname = 'profs_activite' and pronamespace = 'public'::regnamespace;
