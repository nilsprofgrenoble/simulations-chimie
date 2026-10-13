-- ════════════════════════════════════════════════════════════════════════════
--  CORRECTIF (étape 14) : donner à la fonction « comptes » ses droits sur les tables.
--  Symptôme corrigé : « Action réservée aux professeurs » alors que vous êtes bien connecté.
--  Cause : « Automatically expose new tables » était décoché, donc le rôle de la fonction
--  (service_role) n'avait aucun droit sur les tables créées par 01-base.sql.
--  À coller dans SQL Editor → Run. Sans risque, peut être relancé.
-- ════════════════════════════════════════════════════════════════════════════
grant usage on schema public to service_role;
grant all on public.professeurs, public.classes, public.eleves, public.activites to service_role;

-- Vérification : doit afficher une ligne « service_role | true » pour chacune des 4 tables
select table_name, grantee, bool_and(privilege_type is not null) as droits
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'service_role' and table_name in ('professeurs','classes','eleves','activites')
group by table_name, grantee order by table_name;
