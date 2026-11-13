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

## Devoirs assignés (étape 21)

À faire **une fois**, avant ou après avoir fusionné la PR (sans le SQL, le site n'affiche rien côté élève, et l'onglet professeur indique quoi faire) :
1. **SQL** : SQL Editor → New snippet → coller `06-devoirs.sql` → Run. Le résultat doit afficher trois lignes : `devoirs`, `devoirs_controle`, `cles_devoir_valides`. Relançable sans risque.
2. **Créer un devoir** : site → Suivi professeur → choisir la classe → onglet « 📌 Devoirs » : titre, date limite (facultative), 1 à 12 exercices ou défis (recherche par mot du titre, ANA, REA, S'APP, DÉFI) → « Créer le devoir ».

Ce que voient les élèves : tout en haut de « Mon compte », « 📌 À faire pour la classe » : une carte par devoir avec la date limite (orange à 1 jour, rouge en retard), une barre d'avancement et un bouton « Y aller » par exercice non fait. Les devoirs terminés se replient. Vous voyez, pour chaque devoir, combien d'élèves ont tout fait et un tableau élève × exercice.

Règles à connaître (hypothèses de travail) :
- un exercice est **fait** s'il est **réussi après la création du devoir** : un exercice réussi la semaine dernière doit être refait. C'est voulu pour des révisions ; si vous voulez un devoir sur des exercices que les élèves n'ont jamais faits, rien ne change ;
- la date limite court jusqu'à la fin du jour indiqué ; après, le devoir reste faisable (« en retard de N jours »), il n'est jamais bloqué ;
- « fait » n'est pas enregistré dans le devoir : c'est déduit des séances déjà enregistrées. Aucune donnée d'élève en plus ;
- seul le professeur de la classe crée et supprime ses devoirs ; les élèves ne voient que ceux de leur classe ; 200 devoirs au maximum par classe. On ne peut modifier ni la liste d'exercices ni la classe d'un devoir (supprimez-le et recréez-le) ;
- comme pour le reste, les réussites viennent du navigateur de l'élève : un devoir sert à organiser le travail, pas à évaluer.

## Chapitre en cours et devoirs ciblés (étape 22)

À faire **une fois**, après `05` et `06` (sans le SQL, le site continue de fonctionner comme avant et le suivi indique quoi faire) :
1. **SQL** : SQL Editor → New snippet → coller `07-chapitre-et-ciblage.sql` → Run. Le résultat doit afficher quatre lignes (si vous l'aviez déjà lancé dans une version précédente, relancez-le : il met à jour les règles) : `chapitres`, `eleves`, `chapitres_valides`, `devoirs_controle`. Relançable sans risque.
   - Si « Nouvelle classe » affiche « permission denied for function chapitres_valides » : coller aussi `08-correctif-chapitres-service.sql` → Run (il donne à la fonction « comptes » le droit d'exécuter la règle des chapitres ; le résultat doit afficher deux lignes `t`). Relançable sans risque.
2. **Choisir le chapitre** : Suivi professeur → classe → « ⚙️ Réglages de la classe » → « 📘 Chapitre en cours » : cliquer sur 1 à 3 chapitres, rangés par niveau (2GT, 1G, TSTL, BTS) comme dans le menu : Distillation, Évaporation, Transport des fluides, etc. Chaque chapitre indique son nombre de simulations et d'exercices de remédiation. Modifiable à tout moment.
3. **Cibler un devoir** : onglet « 📌 Devoirs » → « Pour qui ? » → « Certains élèves seulement ». Depuis l'onglet « 🔁 À reprendre », le bouton « 📌 Donner cet exercice en devoir à ces N élèves » prépare le devoir avec les élèves en difficulté déjà cochés.

Ce que voient les élèves connectés dans « Je m'entraîne » : en tête, « 📘 Ton chapitre en ce moment », une barre d'étoiles du chapitre, un **exercice conseillé**, les **simulations du chapitre**, puis les exercices S'APP et ANA du thème rattaché (un chapitre sans exercice, comme Distillation, n'affiche que ses simulations). Les calculs (REA, sans thème) sont proposés à part, repliés. Tout le reste (compétences, autres thèmes) est dans « 📚 Autres thèmes et toutes les compétences », replié. Sans chapitre choisi, la page est inchangée.

Règles à connaître (hypothèses de travail) :
- le **niveau** n'est pas une étiquette : l'exercice conseillé est le premier exercice **jamais réussi** de la compétence où l'élève a le **moins d'étoiles dans ce chapitre** ; s'il a tout réussi, celui où il a le moins d'étoiles (pour viser 3). Ce n'est ni une note ni un diagnostic ;
- les chapitres sont ceux du menu (`src/chapitres.js`, source unique du menu, du chapitre en cours et des devoirs). La banque d'exercices n'a pas de niveau : chaque thème d'exercices est rattaché au chapitre le plus proche (Chimie → 1G « Suivi de l'évolution » et BTS « Analyse », Mécanique → 1G « Mouvement », Transport des fluides → TSTL…). Ces rattachements sont des choix à discuter, faciles à changer dans ce fichier ;
- un devoir contient jusqu'à **40** éléments (exercices, défis, simulations). Dans l'onglet Devoirs, choisir un chapitre dans la liste puis « ➕ Tout ajouter » ou « ➕ Seulement ce qui n'est pas réussi par tous » ;
- une **simulation** d'un devoir est « faite » quand l'élève a cumulé au moins **5 minutes en parcours guidé** (avec une séance depuis la création du devoir) **et** réussi un défi de la simulation, si elle en propose. Le site ne sait pas où en est l'élève dans le parcours guidé : le temps est un indicateur, pas une preuve ;
- un devoir ciblé n'est visible que des élèves choisis (règle du serveur, pas seulement de l'affichage) ; seuls des élèves de la classe peuvent être visés ; on ne peut pas modifier la liste après création (supprimez et recréez) ; les élèves non visés ne comptent pas dans « N ont tout fait » ;
- comme pour le reste, ces données viennent du navigateur de l'élève : c'est une aide à l'organisation, pas une évaluation.

## Partager une classe entre professeurs (étape 23)

Un élève n'a qu'un compte, même si deux professeurs le suivent. La classe garde un **propriétaire** (celui qui l'a créée) et peut avoir jusqu'à 5 **co-professeurs**.

| | Propriétaire | Co-professeur |
|---|---|---|
| Voir les élèves et leurs résultats, l'export CSV | oui | oui |
| Créer, modifier, supprimer des devoirs | oui | oui |
| Chapitre en cours, vie de classe | oui | oui |
| Ajouter des comptes élèves, réinitialiser un mot de passe | oui | oui |
| Renommer la classe | oui | non |
| Supprimer un compte élève | oui | non |
| Supprimer la classe | oui | non |
| Partager la classe, retirer un co-professeur | oui | non (il peut **quitter** la classe) |

À faire **une fois** (sans cela, le bloc « Professeurs de la classe » indique quoi faire et le reste fonctionne comme avant) :
1. **Compte du collègue** : Supabase → Authentication → Users → Add user (son adresse, mot de passe solide, *Auto Confirm User*), puis dans SQL Editor, `02-professeur.sql` avec **son** adresse et **son** nom à la place des vôtres (changer les deux lignes `select id, '…' … where email = '…'`).
2. **SQL** : SQL Editor → New snippet → coller `09-partage-classe.sql` → Run. Le résultat doit afficher trois lignes : `classes_profs`, `profs_classe`, `prof_par_email`. Relançable sans risque.
3. **Fonction « comptes »** : Edge Functions → comptes → Code → remplacer tout le contenu par `functions/comptes/index.ts` → Deploy.
4. **Partager** : site → Suivi professeur → « ⚙️ Gérer la classe » → « 👥 Professeurs de la classe » → adresse du collègue → « Partager la classe ». Il la voit aussitôt dans son sélecteur de classe (marquée « partagée »).

Points à connaître :
- le collègue voit les identifiants (tstl1-07…) et les résultats de vos élèves, comme vous. Aucun nom ni adresse d'élève n'est sur le serveur ;
- les devoirs d'une classe partagée sont communs : chacun peut modifier ou supprimer ceux de l'autre ;
- supprimer la classe (propriétaire) la supprime aussi pour le co-professeur ;
- si le propriétaire supprime son compte, la classe disparaît avec lui (il n'y a pas de transfert de propriété).

## Créer des comptes professeur depuis le site (étape 24)
Seul l'**administrateur** (vous) voit, dans *Suivi professeur*, le bloc « 👩‍🏫 Ajouter un professeur » : adresse + nom → le compte est créé, le mot de passe s'affiche **une seule fois** (à transmettre vous-même ; aucun email n'est envoyé). Le collègue peut ensuite le changer (« Changer mon mot de passe »), et vous pouvez lui partager une classe.

À faire **une fois**, après avoir fusionné la PR (sans cela, le bloc n'apparaît pas et tout fonctionne comme avant) :
1. **SQL** : SQL Editor → New query → coller `10-administrateur.sql` (vérifier l'adresse de votre compte professeur) → Run. Le résultat doit montrer `admin = true` pour vous.
2. **Fonction serveur** : Supabase → Edge Functions → `comptes` → remplacer le code par celui de `functions/comptes/index.ts` → Deploy (garder le réglage JWT déjà fait).
3. **Tester** : recharger le site, vous connecter, Suivi professeur → ouvrir « Ajouter un professeur ».

Sécurité : seul un professeur marqué `admin` peut créer un compte (contrôlé côté serveur, pas seulement par le bouton) ; un professeur ne peut pas se donner ce droit (la colonne est en lecture seule pour lui) ; 40 professeurs au maximum ; chaque professeur ne voit que ses propres classes. La suppression d'un compte professeur reste à faire dans Supabase (elle supprimerait aussi ses classes).

## Progression des parcours retrouvée sur n'importe quel appareil (étape 25)

Un élève connecté qui commence un parcours guidé à la maison le retrouve au lycée, à la même étape (et inversement).
1. **SQL** : SQL Editor → New snippet → coller `12-etats-parcours.sql` → Run. Le résultat doit afficher une ligne `etats_parcours` avec « t ».
2. Rien d'autre à faire : le site l'utilise tout seul dès que la table existe. Tant que le script n'est pas exécuté, la progression reste gardée dans le navigateur, comme avant.

## Classement public (étape 26)

1. **SQL** : SQL Editor → New snippet → coller `13-classement.sql` → **Run**. Le résultat doit afficher trois lignes : `etablissement`, `classement` puis `classement_public`. Sans risque, peut être relancé.
2. **Établissement de chaque classe** : *Suivi professeur → ⚙️ Gérer la classe → 🏫 Établissement* (ex. « Lycée Argouges »), puis **Enregistrer**. Tant qu'il est vide, aucun élève de la classe n'apparaît dans le classement.
3. **Chaque élève décide** : dans son espace (« Mon compte »), bloc « Classement public » : il choisit un pseudo (liste fixe) puis coche « Apparaître dans le classement public ». Case décochée par défaut ; cet accord est distinct de celui de la « vie de classe ».
4. Le classement est la page `?sim=104` (lien « 🏅 Classement » en bas de chaque page), ouverte à tous sans compte. Quatre lames : étoiles, cette semaine (remise à zéro chaque lundi), défis, régularité.

Ce qui est public pour un élève qui a coché : son pseudo, le nom de l'établissement, le nom de la classe et ses scores. Jamais d'identifiant, de nom ni d'adresse.
Pour retirer un élève : Suivi professeur → Élèves → ouvrir sa carte → « 🚫 Retirer du classement » (voir l'étape 27). Pour retirer toute une classe : effacer son établissement.
Les scores sont calculés par le serveur à partir des mêmes lignes « activites » que le carnet, mais ces lignes sont envoyées par le navigateur de l'élève : un élève très débrouillard pourrait les falsifier.

## Classement public : anti-triche (étape 27, après un audit de sécurité)

1. **SQL** : SQL Editor → New snippet → coller `14-classement-durci.sql` → **Run** (après le 13). Le résultat doit afficher trois lignes : `cles_valides`, `exclu` puis `classement_public`. Sans risque, peut être relancé.
2. **Ouvrir « Suivi professeur » une fois** avec ton compte : le site remplit tout seul la liste des exercices valides (898 clés : 731 exercices et 167 défis). Tant que ce n'est pas fait, le classement reste vide. Ensuite, la liste se met à jour toute seule à chaque ouverture du Suivi professeur (un nouvel exercice ne compte dans le classement qu'après cette ouverture).
3. **Ce que ça change** : le classement ne compte que les exercices qui existent vraiment ; au plus 50 exercices comptent par élève et par jour ; le classement se recalcule au plus une fois par minute ; un professeur peut retirer un élève (bouton dans sa carte, dans Suivi professeur → Élèves), qui en est informé dans son espace.
4. **Signal « ⚠️ résultats à vérifier »** dans la carte d'un élève : au moins 5 exercices « réussis » absents du catalogue, ou au moins 10 réussites en moins de 10 secondes. C'est un signal, pas une preuve (un exercice très ancien, retiré du site depuis, peut aussi s'afficher ainsi).
5. **Limite qui reste** : les réponses sont corrigées dans le navigateur de l'élève, le serveur ne peut pas les revérifier. Un élève qui fabrique lui-même de fausses réussites pour de vrais exercices peut gagner jusqu'à 150 étoiles par jour ; le signal ci-dessus et le bouton de retrait servent à cela.


## Plus de pseudos (étape 28)

Exécuter `15-pseudos-plus.sql` (Supabase → SQL Editor → Run) **tout de suite après la mise en ligne** : sans lui, un élève qui choisit l'un des nouveaux pseudos voit une erreur d'enregistrement. Vérification : deux lignes, « pseudos_adj_liste » et « pseudos_nom_liste ». Les pseudos déjà choisis ne changent pas. Listes dans `src/classe.js` : on peut seulement ajouter à la fin (256 maximum de chaque sorte).


## Professeurs invités, et gestion des professeurs depuis le site (étape 29)

Depuis *Suivi professeur → Mon compte → « Gérer les professeurs »* (administrateur seul), on peut désormais : créer un compte avec un rôle, changer le rôle d'un professeur, générer un nouveau mot de passe, supprimer un professeur. Plus besoin d'ouvrir Supabase pour cela.

Trois rôles :
| | Invité | Professeur | Administrateur |
|---|---|---|---|
| Voir les classes qu'on lui partage, leurs résultats, l'export CSV | oui | oui | oui |
| Donner des devoirs, régler le chapitre en cours et la vie de classe | oui | oui | oui |
| Réinitialiser le mot de passe d'un élève d'une classe partagée | oui | oui | oui |
| Créer des classes et des comptes élèves | **non** | oui | oui |
| Alimenter la liste des exercices valides du classement | **non** | oui | oui |
| Gérer les comptes professeur | non | non | oui |

À faire **une fois** (sans cela, le site continue de fonctionner comme avant et aucun compte n'est « invité ») :
1. **SQL** : SQL Editor → New query → coller `16-profs-invites.sql` → Run. Le résultat doit lister les professeurs avec les colonnes `admin` et `invite` (toutes à `false` pour `invite`). Relançable sans risque.
2. **Fonction « comptes »** : Edge Functions → comptes → Code → remplacer tout le contenu par `functions/comptes/index.ts` → Deploy (garder le réglage JWT déjà fait).
3. **Tester** : Suivi professeur → Mon compte → « Gérer les professeurs ». Passer un collègue en « Invité », puis se connecter avec son compte : il ne doit voir ni « Nouvelle classe » ni la création de comptes élèves.

Règles à connaître :
- un compte créé depuis le site est **Invité par défaut** ; l'administrateur peut le passer « Professeur » ou « Administrateur » ;
- vous ne pouvez pas changer votre propre rôle, ni supprimer votre propre compte (pour ne pas perdre l'accès d'administrateur) ; un administrateur ne peut pas être supprimé tant qu'il garde ce rôle ;
- supprimer un professeur qui possède des classes supprime aussi ces classes, les comptes de leurs élèves et leurs résultats : le site demande une seconde confirmation ;
- la fermeture est faite **côté serveur** (fonction « comptes » et règles de la base), pas seulement en cachant les boutons.

