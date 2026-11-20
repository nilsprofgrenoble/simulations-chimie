// ====================================================
//  MODÈLE DE LA SIMULATION 198 « TESTS CHIMIQUES : EAU, DIHYDROGÈNE, DIOXYGÈNE, DIOXYDE DE CARBONE » (2GT, partie « Description et caractérisation de la matière à l'échelle macroscopique »).
//  Fichier sans React, testé par testsChimiques2gtModele.test.mjs.
//
//  HYPOTHÈSES DU MODÈLE (affichées à l'élève dans le panneau « Hypothèses de travail ») :
//   • un seul gaz pur dans le tube ; en présence d'un mélange, plusieurs tests peuvent réagir (ex. la combustion d'une bougie forme de l'eau ET du dioxyde de carbone) ;
//   • dans les conditions du lycée, chaque test est spécifique : parmi H₂, O₂, CO₂ et N₂, un seul gaz donne un résultat positif à un test donné ;
//   • les gaz sont recueillis secs (en vrai, un gaz recueilli sur l'eau entraîne de la vapeur d'eau : le sulfate de cuivre anhydre bleuirait) ;
//   • un test négatif ne prouve pas à lui seul l'absence de l'espèce (concentration trop faible, test mal fait) : l'air contient du dioxygène, mais la braise ne s'y rallume pas ;
//   • la flamme qui s'éteint dans un gaz n'est PAS un test normalisé du dioxyde de carbone : le diazote éteint aussi la flamme ;
//   • sulfate de cuivre anhydre bien conservé : mal conservé, l'humidité de l'air le bleuit peu à peu (faux positif) ; un test positif de l'eau montre qu'il y a de l'eau, pas que l'échantillon est de l'eau pure ;
//   • eau de chaux : on s'arrête au trouble ; avec un grand excès de CO₂, elle redevient limpide (hors programme, non traité) ;
//   • dans l'identification d'un gaz inconnu, la liste des gaz possibles est donnée (ici H₂, O₂, CO₂, N₂) : le gaz pour lequel aucun test n'est positif est alors le diazote, par élimination ;
//   • les expériences décrites sont des situations de laboratoire imaginées pour la simulation ; on n'invite jamais l'élève à les reproduire seul.
//
//  Valeurs et faits (programme de Seconde, tests courants) : sulfate de cuivre anhydre CuSO₄ blanc, hydraté bleu ; eau de chaux (solution d'hydroxyde de calcium) limpide, qui se trouble
//  avec CO₂ (précipité blanc de carbonate de calcium CaCO₃) ; bûchette incandescente rallumée par O₂ ; H₂ : légère détonation (« pop ») à l'approche d'une flamme.
//  Aucun ion n'est mentionné (ions : hors programme de Seconde 2019 pour cette partie).
// ====================================================

export const NB = ' ';

// ---------- espèces et tests ----------
export const ESPECES = {
  eau: { id: 'eau', nom: 'eau', art: 'l’eau', formule: 'H₂O' },
  h2: { id: 'h2', nom: 'dihydrogène', art: 'le dihydrogène', formule: 'H₂' },
  o2: { id: 'o2', nom: 'dioxygène', art: 'le dioxygène', formule: 'O₂' },
  co2: { id: 'co2', nom: 'dioxyde de carbone', art: 'le dioxyde de carbone', formule: 'CO₂' },
  n2: { id: 'n2', nom: 'diazote', art: 'le diazote', formule: 'N₂' },
};
export const GAZ = ['h2', 'o2', 'co2', 'n2'];
export const nomGaz = id => `${ESPECES[id].nom} ${ESPECES[id].formule}`;

// Un test = un réactif + une observation attendue (test positif) ; cible = l'espèce que le test met en évidence
export const TESTS = {
  eau: { id: 'eau', nom: 'test de l’eau', reactif: 'sulfate de cuivre anhydre', geste: 'on met la poudre blanche au contact de l’échantillon', attendu: 'la poudre blanche devient bleue', cible: 'eau', court: 'eau' },
  co2: { id: 'co2', nom: 'test du dioxyde de carbone', reactif: 'eau de chaux', geste: 'on fait passer le gaz dans l’eau de chaux limpide', attendu: 'l’eau de chaux se trouble (précipité blanc)', cible: 'co2', court: 'CO₂' },
  o2: { id: 'o2', nom: 'test du dioxygène', reactif: 'une braise', geste: 'on plonge une bûchette à braise (point rouge, sans flamme) dans le gaz', attendu: 'la braise se rallume avec une flamme vive', cible: 'o2', court: 'O₂' },
  h2: { id: 'h2', nom: 'test du dihydrogène', reactif: 'une flamme', geste: 'le professeur retire le bouchon et approche une flamme de l’ouverture', attendu: 'une petite détonation, un « pop »', cible: 'h2', court: 'H₂' },
};
export const ORDRE_TESTS = ['eau', 'co2', 'o2', 'h2'];
export const TESTS_GAZ = ['h2', 'o2', 'co2'];        // les trois tests qui servent à identifier un gaz (le test de l'eau s'applique à un liquide ou à de la buée)

// Résultat d'un test appliqué à un gaz pur et sec (hypothèse : tests spécifiques)
export const positifGaz = (gazId, testId) => TESTS[testId].cible === gazId;
// Observation (texte) d'un test appliqué à un gaz pur et sec
const OBS_GAZ = {
  h2: { h2: 'une détonation brève : « pop »', o2: 'la braise s’éteint', co2: 'l’eau de chaux reste limpide' },
  o2: { h2: 'pas de détonation', o2: 'la braise se rallume avec une flamme vive', co2: 'l’eau de chaux reste limpide' },
  co2: { h2: 'pas de détonation : la flamme s’éteint', o2: 'la braise s’éteint', co2: 'l’eau de chaux se trouble : précipité blanc' },
  n2: { h2: 'pas de détonation : la flamme s’éteint', o2: 'la braise s’éteint', co2: 'l’eau de chaux reste limpide' },
};
export const observationGaz = (gazId, testId) => ({ positif: positifGaz(gazId, testId), texte: OBS_GAZ[gazId][testId] });

// ---------- situations de l'exploration ----------
// obs[test] = [positif, observation, nuance éventuelle] ; null = test non applicable à cette situation
const NA = null;
export const SOURCES = [
  { id: 'calcaire', type: 'gaz', nom: 'Acide + calcaire', court: 'Acide + calcaire', fait: 'On verse de l’acide sur des morceaux de calcaire : un gaz se dégage et est recueilli sec dans un tube.', produit: 'du dioxyde de carbone',
    obs: { eau: [false, 'la poudre reste blanche (gaz recueilli sec)'], h2: [false, 'pas de détonation : la flamme s’éteint'], o2: [false, 'la braise s’éteint'], co2: [true, 'l’eau de chaux se trouble : précipité blanc'] } },
  { id: 'zinc', type: 'gaz', nom: 'Acide + zinc', court: 'Acide + zinc', fait: 'On verse de l’acide sur de la poudre de zinc : un gaz se dégage et est recueilli sec dans un petit tube bouché.', produit: 'du dihydrogène',
    obs: { eau: [false, 'la poudre reste blanche (gaz recueilli sec)'], h2: [true, 'une détonation brève : « pop »'], o2: [false, 'la braise s’éteint'], co2: [false, 'l’eau de chaux reste limpide'] } },
  { id: 'eauO2', type: 'gaz', nom: 'Eau oxygénée + catalyseur', court: 'Eau oxygénée', fait: 'On ajoute une pincée de poudre (un catalyseur : elle accélère la formation du gaz) à de l’eau oxygénée : un gaz se dégage et est recueilli sec dans un tube.', produit: 'du dioxygène',
    obs: { eau: [false, 'la poudre reste blanche (gaz recueilli sec)'], h2: [false, 'pas de détonation'], o2: [true, 'la braise se rallume avec une flamme vive'], co2: [false, 'l’eau de chaux reste limpide'] } },
  { id: 'bougie', type: 'gaz', nom: 'Bougie qui brûle sous un flacon', court: 'Bougie', fait: 'Un flacon est retourné sur une bougie qui brûle : de la buée apparaît sur la paroi et le gaz du flacon est testé.', produit: 'de l’eau et du dioxyde de carbone',
    obs: { eau: [true, 'la poudre blanche, frottée sur la buée, devient bleue'], h2: [false, 'pas de détonation'], o2: [false, 'la braise s’éteint'], co2: [true, 'l’eau de chaux, agitée dans le flacon, se trouble'] },
    nuance: { eau: 'La combustion forme de l’eau et du dioxyde de carbone : deux tests sont positifs, car le flacon contient deux espèces.', co2: 'La combustion forme de l’eau et du dioxyde de carbone : deux tests sont positifs, car le flacon contient deux espèces.' } },
  { id: 'air', type: 'gaz', nom: 'Air d’un flacon', court: 'Air', fait: 'On remplit un flacon avec l’air de la pièce, sans le sécher, puis on le teste.', produit: 'de l’air (mélange)',
    obs: { eau: [true, 'la poudre bleuit lentement : l’air contient de la vapeur d’eau'], h2: [false, 'pas de détonation'], o2: [false, 'la braise ne se rallume pas : elle reste rouge'], co2: [false, 'l’eau de chaux reste limpide pendant le test'] },
    nuance: { o2: 'Test négatif, pourtant l’air contient environ un cinquième de dioxygène : cette proportion est trop faible pour rallumer la braise.', co2: 'Test négatif, pourtant l’air contient un peu de dioxyde de carbone : sa proportion est trop faible pour troubler l’eau de chaux pendant un test.' } },
  { id: 'azote', type: 'gaz', nom: 'Diazote d’une bouteille', court: 'Diazote', fait: 'Un gaz est tiré d’une bouteille d’un gaz de l’air, le diazote, puis testé.', produit: 'du diazote',
    obs: { eau: [false, 'la poudre reste blanche (gaz sec)'], h2: [false, 'pas de détonation : la flamme s’éteint'], o2: [false, 'la braise s’éteint'], co2: [false, 'l’eau de chaux reste limpide'] },
    nuance: { h2: 'Aucun des quatre tests n’est positif : le diazote ne donne rien. La flamme s’éteint, mais ce n’est pas un test du dioxyde de carbone.' } },
  { id: 'robinet', type: 'liquide', nom: 'Eau du robinet', court: 'Eau du robinet', fait: 'Quelques gouttes d’eau du robinet sont déposées sur la poudre.', produit: 'de l’eau (avec des espèces dissoutes)',
    obs: { eau: [true, 'la poudre blanche devient bleue'], h2: NA, o2: NA, co2: NA } },
  { id: 'ethanolAbsolu', type: 'liquide', nom: 'Éthanol absolu (sans eau)', court: 'Éthanol absolu', fait: 'Quelques gouttes d’éthanol absolu (un alcool sans eau) sont déposées sur la poudre.', produit: 'de l’éthanol',
    obs: { eau: [false, 'la poudre reste blanche'], h2: NA, o2: NA, co2: NA },
    nuance: { eau: 'Test négatif : aucune eau n’est détectée dans cet échantillon.' } },
  { id: 'ethanol96', type: 'liquide', nom: 'Éthanol du commerce (à 96 %)', court: 'Éthanol à 96 %', fait: 'Quelques gouttes d’éthanol du commerce, qui contient un peu d’eau, sont déposées sur la poudre.', produit: 'un mélange d’éthanol et d’eau',
    obs: { eau: [true, 'la poudre blanche devient bleue'], h2: NA, o2: NA, co2: NA },
    nuance: { eau: 'Test positif : l’échantillon contient de l’eau, mais ce n’est pas de l’eau pure : c’est un mélange d’éthanol et d’eau.' } },
];
export const source = id => SOURCES.find(s => s.id === id);
// Résultat de l'essai d'un test sur une situation : { applicable, positif, texte, conclusion, nuance }
export const essai = (sourceId, testId) => {
  const s = source(sourceId), t = TESTS[testId], o = s.obs[testId];
  if (!o) return { applicable: false, positif: null, texte: `Ce test s’applique à un gaz : on ne l’utilise pas sur un liquide.`, conclusion: '', nuance: '' };
  const [positif, texte] = o, nuance = (s.nuance && s.nuance[testId]) || '';
  const cible = ESPECES[t.cible], de = cible.id === 'eau' ? 'de l’eau' : `du ${cible.nom}`;
  const conclusion = positif ? `Test positif : on met en évidence ${de}.` : (cible.id === 'eau' ? 'Test négatif : aucune eau détectée.' : `Test négatif : pas de ${cible.nom} détecté.`);
  return { applicable: true, positif, texte, conclusion, nuance };
};

// ---------- identification d'un gaz inconnu ----------
// Gaz encore possibles après une liste d'observations [{ test, positif }] (tests spécifiques, gaz pur)
export const restants = (candidats, observations) => candidats.filter(g => observations.every(o => positifGaz(g, o.test) === o.positif));
export const prouve = (candidats, observations) => restants(candidats, observations).length === 1;
// Nombre maximal de tests nécessaires pour identifier un gaz parmi n gaz possibles : n − 1 (le dernier gaz se déduit par élimination)
export const testsNecessaires = n => n - 1;

// Arbre de décision : l'élève choisit l'ordre des tests ; toute permutation de tests distincts convient
export const NOEUDS_ARBRE = [{ test: 'h2', gaz: 'h2' }, { test: 'o2', gaz: 'o2' }, { test: 'co2', gaz: 'co2' }];
export const verifierArbre = rep => {
  // rep : { t2, g2, t3, g3, gf } ; le premier nœud (flamme, H₂) est donné
  const bon = (t, g) => t && g && TESTS[t].cible === g;
  const n2 = bon(rep.t2, rep.g2), n3 = bon(rep.t3, rep.g3);
  const distincts = !!rep.t2 && !!rep.t3 && rep.t2 !== rep.t3 && rep.t2 !== 'h2' && rep.t3 !== 'h2';
  const finalOk = rep.gf === 'n2';
  return { n2, n3, distincts, finalOk, ok: n2 && n3 && distincts && finalOk };
};

export const OBS_ASSOCIER = [['h2', 'une détonation brève : « pop »'], ['o2', 'la braise se rallume'], ['co2', 'l’eau de chaux se trouble'], ['eau', 'la poudre devient bleue']];

// ---------- affichage ----------
const tireDans = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export { melange };

// ---------- défi 1 : identifier un gaz inconnu avec un nombre limité de tests ----------
const ENSEMBLES = [['h2', 'o2', 'co2'], ['h2', 'o2', 'n2'], ['h2', 'co2', 'n2'], ['o2', 'co2', 'n2'], ['h2', 'o2', 'co2', 'n2']];
export const tirerDefiGaz = (precedent = null) => {
  let d;
  do {
    const candidats = tireDans(ENSEMBLES), gaz = tireDans(candidats);
    d = { candidats, gaz, budget: testsNecessaires(candidats.length), obs: [], conclusion: '' };
  } while (precedent && d.gaz === precedent.gaz && d.candidats.join() === precedent.candidats.join());
  return d;
};
export const faireTest = (d, testId) => {
  const o = observationGaz(d.gaz, testId);
  return { ...d, obs: [...d.obs, { test: testId, positif: o.positif, texte: o.texte }] };
};
// Jugement : réussi si la conclusion est juste, prouvée par les observations, avec au plus `budget` tests
export const jugerDefiGaz = d => {
  const rest = restants(d.candidats, d.obs), juste = d.conclusion === d.gaz, prouvee = rest.length === 1 && rest[0] === d.conclusion;
  const dansBudget = d.obs.length <= d.budget;
  return { juste, prouvee, dansBudget, restants: rest, ok: juste && prouvee && dansBudget };
};

// ---------- défi 2 : relier une observation à une espèce (cas pièges compris) ----------
// bonne : la phrase juste ; faux : trois phrases fausses (de vraies erreurs d'élèves) ; piege : l'observation ne prouve pas ce qu'on croit
export const OBSERVATIONS = [
  { id: 'braise', texte: 'Dans un tube qui contient un gaz pur, une braise se rallume avec une flamme vive.', q: 'Quel gaz met-on en évidence ?',
    bonne: 'le dioxygène', faux: ['le dihydrogène', 'le dioxyde de carbone', 'le diazote'], expl: 'La braise qui se rallume est le test du dioxygène.', indice: 'Associez le réactif « une braise » au gaz qu’il met en évidence.' },
  { id: 'chaux', texte: 'Un gaz pur bulle dans de l’eau de chaux limpide : elle devient trouble, avec un précipité blanc.', q: 'Quel gaz met-on en évidence ?',
    bonne: 'le dioxyde de carbone', faux: ['le dioxygène', 'le dihydrogène', 'l’air, mélange de diazote et de dioxygène'], expl: 'L’eau de chaux qui se trouble est le test du dioxyde de carbone.', indice: 'Quel gaz trouble l’eau de chaux ?' },
  { id: 'pop', texte: 'Le professeur approche une flamme de l’ouverture d’un petit tube bouché qui contient un gaz pur : on entend un « pop ».', q: 'Quel gaz met-on en évidence ?',
    bonne: 'le dihydrogène', faux: ['le dioxygène', 'le dioxyde de carbone', 'le diazote'], expl: 'La détonation brève à l’approche d’une flamme est le test du dihydrogène.', indice: 'Quel gaz donne une petite détonation avec une flamme ?' },
  { id: 'bleu', texte: 'Une poudre blanche de sulfate de cuivre anhydre devient bleue au contact d’un liquide incolore.', q: 'Quelle conclusion est justifiée ?',
    bonne: 'ce liquide contient de l’eau', faux: ['ce liquide est de l’eau pure', 'ce liquide contient du dioxygène', 'ce liquide ne contient pas d’eau'], expl: 'La poudre bleue montre que de l’eau est présente. Elle ne dit pas que le liquide est de l’eau pure : l’éthanol du commerce contient de l’eau et fait aussi bleuir la poudre.', indice: 'Le test montre la présence d’une espèce. Dit-il aussi qu’il n’y a rien d’autre ?' },
  { id: 'blanc', texte: 'La poudre blanche de sulfate de cuivre anhydre reste blanche au contact d’un liquide incolore.', q: 'Quelle conclusion est justifiée ?',
    bonne: 'aucune eau n’a été détectée', faux: ['ce liquide est de l’eau pure', 'la poudre est abîmée, il faut refaire le test', 'ce liquide contient du dioxygène'], expl: 'Le test est négatif : la poudre n’a détecté aucune eau dans cet échantillon.', indice: 'Que signifie un test négatif pour la poudre blanche ?' },
  { id: 'flamme', texte: 'Une allumette enflammée plongée dans un tube qui contient un gaz pur s’éteint.', q: 'Que peut-on conclure ?',
    bonne: 'rien de sûr : d’autres gaz l’éteignent aussi', faux: ['c’est du dioxyde de carbone, le gaz qui éteint la flamme', 'c’est du dioxygène', 'c’est du dihydrogène'], expl: 'Une flamme s’éteint dans le dioxyde de carbone, mais aussi dans le diazote : ce n’est pas un test du dioxyde de carbone. Il faut l’eau de chaux.', indice: 'Y a-t-il un seul gaz qui éteint une flamme ? Quel est le vrai test du dioxyde de carbone ?' },
  { id: 'air', texte: 'Une braise plongée dans un flacon rempli d’air ne se rallume pas.', q: 'Que peut-on conclure ?',
    bonne: 'test négatif, mais le flacon peut contenir du dioxygène', faux: ['le flacon ne contient aucun dioxygène', 'le flacon contient du dioxyde de carbone', 'le test est mal fait : l’air est du dioxygène pur, la braise devrait se rallumer'], expl: 'L’air contient environ un cinquième de dioxygène, trop peu pour rallumer la braise : un test négatif ne prouve pas l’absence.', indice: 'Pensez à la composition de l’air. Un test négatif prouve-t-il l’absence ?' },
  { id: 'deux', texte: 'Après la combustion d’une bougie sous un flacon, la poudre blanche bleuit sur la buée et l’eau de chaux se trouble dans le flacon.', q: 'Que peut-on conclure ?',
    bonne: 'de l’eau et du dioxyde de carbone se sont formés', faux: ['seul le dioxyde de carbone s’est formé', 'le test de l’eau est faux, car il y a déjà un test positif', 'seule de l’eau s’est formée'], expl: 'Chaque test met en évidence son espèce : les deux tests sont positifs, donc les deux espèces sont présentes. L’échantillon est un mélange.', indice: 'Chaque test regarde une seule espèce. Combien de tests sont positifs ?' },
  { id: 'limpide', texte: 'Un gaz pur, qui est l’un des quatre gaz H₂, O₂, CO₂ ou N₂, est bullé dans l’eau de chaux : elle reste limpide.', q: 'Que peut-on conclure ?',
    bonne: 'ce n’est pas du dioxyde de carbone', faux: ['c’est du diazote, car aucun autre gaz ne laisse l’eau limpide', 'c’est du dioxygène', 'c’est du dihydrogène'], expl: 'Seul le dioxyde de carbone trouble l’eau de chaux : le gaz est l’un des trois autres, mais ce test ne dit pas lequel.', indice: 'Quel gaz trouble l’eau de chaux ? Ce test permet-il de trancher entre les trois autres ?' },
];
export const tirerObservation = (precedente = null) => { let o; do { o = tireDans(OBSERVATIONS); } while (precedente && o.id === precedente.id); return { ...o, options: melange([o.bonne, ...o.faux]), rep: '' }; };
