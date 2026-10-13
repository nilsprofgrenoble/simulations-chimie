-- ════════════════════════════════════════════════════════════════════════════
--  Déclarer un compte comme PROFESSEUR.
--  Prérequis : le compte existe déjà (Authentication → Users → Add user).
--  Remplacez l'adresse ci-dessous si vous en avez utilisé une autre, puis « Run ».
-- ════════════════════════════════════════════════════════════════════════════
insert into public.professeurs (user_id, nom)
select id, 'Nils Aronssohn' from auth.users where email = 'nils.aronssohn@ac-grenoble.fr'
on conflict (user_id) do nothing;

-- Vérification : doit afficher une ligne avec votre nom
select p.nom, u.email from public.professeurs p join auth.users u on u.id = p.user_id;
