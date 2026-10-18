-- ════════════════════════════════════════════════════════════════════════════
--  CORRECTIF (étape 22 bis) : créer une classe échouait avec
--      « permission denied for function chapitres_valides »
--  Cause : la création de classe passe par la fonction « comptes », qui agit avec le rôle service_role.
--  La règle qui contrôle les chapitres d'une classe (contrainte classes_chapitres_valides) appelle la fonction
--  chapitres_valides, dont le droit d'exécution avait été donné seulement au rôle « authenticated ».
--  À coller dans SQL Editor → Run. Sans risque, peut être relancé.
-- ════════════════════════════════════════════════════════════════════════════
grant execute on function public.chapitres_valides(text[]) to service_role;
grant execute on function public.cles_devoir_valides(text[]) to service_role;

-- Vérification : doit afficher deux lignes « true »
select proname, has_function_privilege('service_role', p.oid, 'execute') as service_role_peut_executer
from pg_proc p where pronamespace = 'public'::regnamespace and proname in ('chapitres_valides', 'cles_devoir_valides') order by proname;
