# Mise en place du serveur Supabase (étape 13)

Durée : environ 15 minutes. Rien à installer sur l'ordinateur : tout se fait dans le site de Supabase.
Le site des simulations n'est pas encore modifié : cette étape prépare seulement le serveur.

## 1. Fermer les inscriptions libres
*Authentication → Sign In / Providers*
- **Allow new users to sign up** : **désactivé** (seuls vous et la fonction « comptes » créent des comptes).
- **Email** : laisser activé (c'est ce qui permet la connexion par identifiant et mot de passe).
- Cliquer sur **Save**.

## 2. Créer la base
*SQL Editor → New query*
- Coller tout le contenu de `01-base.sql`, puis **Run**.
- Résultat attendu : « Success. No rows returned ».
- Supabase peut afficher un avertissement sur des opérations « destructives » (à cause des lignes `drop policy` et `revoke`) : c'est normal, confirmer.

## 3. Créer votre compte professeur
*Authentication → Users → Add user → Create new user*
- Email : votre adresse professionnelle ; mot de passe : un mot de passe solide (gestionnaire de mots de passe).
- Cocher **Auto Confirm User**, puis **Create user**.

Puis *SQL Editor → New query* : coller `02-professeur.sql` (corriger l'adresse si besoin), **Run**.
La dernière ligne doit afficher votre nom et votre adresse.

## 4. Déployer la fonction « comptes »
*Edge Functions → Deploy a new function → Via Editor*
- Nom de la fonction : **comptes** (exactement).
- Effacer le code d'exemple, coller tout le contenu de `functions/comptes/index.ts`, puis **Deploy function**.
- Dans les réglages de la fonction (onglet *Details* ou *Settings*) : désactiver **Verify JWT with legacy secret** (ou « Enforce JWT verification »), puis enregistrer. La fonction vérifie elle-même que l'appel vient d'un professeur connecté.

## 5. Me prévenir
Dites-moi si chaque étape s'est bien passée, et copiez-moi tout message d'erreur.
Ne m'envoyez jamais la clé secrète (`sb_secret_…`) ni le mot de passe de la base.

## Ce que contient la base
| Table | Contenu | Qui la lit |
|---|---|---|
| professeurs | votre compte et votre nom | vous seul |
| classes | nom de la classe, préfixe des identifiants (ex. tstl1) | vous ; l'élève voit le nom de sa classe |
| eleves | identifiant (ex. tstl1-07), classe — **aucun nom, aucun email** | l'élève (sa ligne) ; vous (vos classes) |
| activites | exercice, date, temps actif, nombre de « Corriger », corrections vues, réussi | l'élève (les siennes) ; vous (vos classes) |

La correspondance « tstl1-07 = tel élève » reste chez vous, hors du serveur.
Supprimer une classe supprime ses comptes et toutes leurs données (à faire en fin d'année scolaire).


## Correctif (étape 14) — « Action réservée aux professeurs » alors que vous êtes connecté
Collez `03-correctif-droits-fonction.sql` dans SQL Editor → Run (Run query si l'avertissement apparaît).
Le résultat doit lister 4 lignes (activites, classes, eleves, professeurs) avec « t ».
Cause : « Automatically expose new tables » était décoché, donc la fonction n'avait aucun droit sur les tables.
(`01-base.sql` contient maintenant ces droits : inutile de le relancer.)
Optionnel : redéployer `functions/comptes/index.ts` (même méthode que la première fois) : il affiche alors la vraie cause des erreurs au lieu d'un message trompeur.

## Durcissement (étape 16, audit de sécurité)

1. **SQL** : SQL Editor → New snippet → coller `04-durcissement.sql` → Run. Le résultat doit afficher deux lignes : `activites_controle` et `activites_cle_format`.
2. **Fonction « comptes »** : Edge Functions → comptes → Code → remplacer tout le contenu par `functions/comptes/index.ts` → Deploy.
3. **Réglages à vérifier dans Supabase** (Authentication → Sign In / Providers, puis Email) :
   - « Allow new users to sign up » : **décoché** ;
   - « Confirm email » : **coché** ;
   - « Minimum password length » : **8**.
   Et dans Edge Functions → comptes → Details : « Verify JWT with legacy secret » / « Enforce JWT verification » laissé **activé** s'il apparaît.
4. **Comptes en ligne** : activer la double authentification (2FA) sur votre compte **GitHub** (Settings → Password and authentication) et sur votre compte **Supabase** (Account → Security). Celui qui contrôle le dépôt GitHub contrôle le code du site.
5. **Fin d'année** : supprimer les classes dans « Suivi professeur » (la note aux élèves annonce la suppression des données en fin d'année).

## Vie de classe (étape 20) : objectif collectif et prouesses de la semaine

À faire **une fois**, avant ou après avoir fusionné la PR (le site n'affiche rien tant que ce n'est pas fait, sans erreur) :
1. **SQL** : SQL Editor → New snippet → coller `05-vie-de-classe.sql` → Run. Le résultat doit afficher trois lignes : `vie_classe`, `pseudos`, `classe_semaine`. Le script peut être relancé sans risque.
2. **Activer, classe par classe** : site → Suivi professeur → case « 🏆 Vie de classe ». Éteinte par défaut : une classe où vous ne cochez pas la case ne voit rien.

Ce que les élèves de la classe voient (onglet « Mon compte », sous « Mon carnet ») :
- **un objectif collectif** : total des exercices réussis par la classe depuis lundi, à comparer à 2 par élève (minimum 4). Chaque élève compte pour 5 au plus, pour que quelques élèves très actifs ne portent pas toute la classe ;
- **quatre prouesses** : « Série de 5 » (5 exercices réussis), « Sans coup de pouce » (3 sans voir la correction), « Du premier coup » (3 réussis au premier essai), « Régularité » (réussites sur 3 jours). Elles se remettent à zéro chaque lundi (heure de Paris). **Pas de classement** : les pseudos d'une prouesse sont listés dans un ordre sans rapport avec le mérite, et aucun chiffre individuel n'est montré ;
- **leur pseudo** : choisi parmi des propositions tirées de listes fixes (« Comète brillante », « Neutron malin »…), jamais de texte libre. Chaque élève décide s'il apparaît (**non par défaut**).

Confidentialité : le serveur ne renvoie à un élève que les pseudos des élèves de sa propre classe qui ont accepté d'apparaître. Vous voyez les pseudos de vos élèves comme le reste de leurs données. Un pseudo n'est pas nominatif, mais il n'est pas anonyme pour autant (les camarades peuvent se reconnaître) : pour des mineurs, parlez-en au référent données personnelles de l'établissement avant d'activer (je ne suis pas juriste).

Limites à connaître : les résultats sont enregistrés par le navigateur de l'élève ; un élève motivé peut les truquer. Ici l'enjeu est faible (pas de note, pas de classement), mais ne vous en servez pas pour évaluer.
Les listes d'adjectifs et de noms sont dans `src/classe.js` : on peut en ajouter à la fin (64 maximum), jamais en retirer ni changer l'ordre.
