// ====================================================
//  MODÈLE DE LA SIMULATION 195 « CHANGEMENT D'ÉTAT : ÉQUATION, TRANSFERT THERMIQUE ET ÉNERGIE » (2GT, partie « Modéliser une transformation physique »).
//  Fichier sans React, testé par changementEtat2gtModele.test.mjs.
//
//  HYPOTHÈSES DU MODÈLE (affichées à l'élève dans le panneau « Hypothèses de travail ») :
//   • corps pur (une seule espèce chimique), sous la pression atmosphérique normale ;
//   • pendant le changement d'état, la température reste constante (palier) : c'est la température de changement d'état du corps ;
//   • l'énergie massique de changement d'état L est supposée constante : E = m × L (L en kJ/kg, m en kg, E en kJ) ;
//   • pas de pertes thermiques : toute l'énergie échangée sert au changement d'état ;
//   • on n'étudie que le changement d'état à sa température de changement d'état : pas de capacité thermique, pas de chaleur sensible (hors programme de Seconde) ;
//   • une même valeur de L pour deux changements inverses (fusion et solidification ; vaporisation et liquéfaction), avec un transfert de sens opposé ;
//   • sublimation et condensation solide : nommées, écrites, sens du transfert ; pas de valeur de L donnée.
//
//  VALEURS DE L (kJ/kg, pression atmosphérique) : tableau « Latent heats of fusion and vaporization » de OpenStax College Physics
//  (reprise sur openbooks.lib.msu.edu et pressbooks.online.ucf.edu, chap. « Phase change and latent heat », tableau 2) :
//   eau : fusion 334 (0 °C), vaporisation 2256 à 100 °C, arrondie à 2 260 dans la simulation (≈ 2 257 selon d'autres tables) ;
//   diazote : fusion 25,5 (−210,0 °C), vaporisation 201 (−195,8 °C) (même tableau OpenStax) ;
//   éthanol : vaporisation 840 kJ/kg à 78,3 °C, d'après NIST WebBook (https://webbook.nist.gov/cgi/cbook.cgi?ID=C64175&Mask=4) :
//     38,56 kJ/mol ÷ 46,07 g/mol = 837 kJ/kg, arrondi à 840 ; fusion 107 kJ/kg (−114 °C), valeur CRC Handbook 4,93 kJ/mol ÷ 46,07 g/mol = 107.
//     (le tableau OpenStax donne 854 et 104 : un peu trop haut pour la vaporisation, on a préféré NIST et CRC.)
//  Les valeurs varient de quelques % d'une table à l'autre : ce sont des ordres de grandeur à 2 ou 3 chiffres.
// ====================================================

export const NB = ' ';

// ---------- états et changements d'état ----------
export const NOM_ETAT = { s: 'solide', l: 'liquide', g: 'gaz' };
const ORDRE = { s: 0, l: 1, g: 2 };                    // plus les entités sont libres de se déplacer, plus l'ordre est grand : s < l < g
export const CHANGEMENTS = [
  { id: 'fusion', nom: 'fusion', de: 's', vers: 'l', Lcle: 'Lfus', Tcle: 'Tfus' },
  { id: 'solidification', nom: 'solidification', de: 'l', vers: 's', Lcle: 'Lfus', Tcle: 'Tfus' },
  { id: 'vaporisation', nom: 'vaporisation', de: 'l', vers: 'g', Lcle: 'Lvap', Tcle: 'Tvap' },
  { id: 'liquefaction', nom: 'liquéfaction', de: 'g', vers: 'l', Lcle: 'Lvap', Tcle: 'Tvap' },
  { id: 'sublimation', nom: 'sublimation', de: 's', vers: 'g', Lcle: null, Tcle: null },
  { id: 'condensation', nom: 'condensation solide', de: 'g', vers: 's', Lcle: null, Tcle: null },
];
export const changement = id => CHANGEMENTS.find(c => c.id === id);
export const inverse = id => { const c = changement(id); return CHANGEMENTS.find(x => x.de === c.vers && x.vers === c.de); };
// Transfert thermique : le système reçoit de l'énergie (endothermique) quand ses entités se libèrent (s → l, l → g, s → g)
export const sens = id => { const c = changement(id); return ORDRE[c.vers] > ORDRE[c.de] ? 'endo' : 'exo'; };
export const NOM_SENS = { endo: 'endothermique', exo: 'exothermique' };
export const PHRASE_SENS = { endo: 'le milieu fournit de l’énergie au système', exo: 'le système cède de l’énergie au milieu' };

// ---------- corps purs ----------
export const CORPS = {
  eau: { id: 'eau', nom: 'eau', f: 'H₂O', art: 'l’eau', du: 'd’eau', de: 'de l’eau', Tfus: 0, Tvap: 100, Lfus: 334, Lvap: 2260 },
  ethanol: { id: 'ethanol', nom: 'éthanol', f: 'C₂H₆O', art: 'l’éthanol', du: 'd’éthanol', de: 'de l’éthanol', Tfus: -114, Tvap: 78.3, Lfus: 107, Lvap: 840 },
  diazote: { id: 'diazote', nom: 'diazote', f: 'N₂', art: 'le diazote', du: 'de diazote', de: 'du diazote', Tfus: -210, Tvap: -195.8, Lfus: 25.5, Lvap: 201 },
};
export const corps = id => CORPS[id];
export const LISTE_CORPS = Object.values(CORPS);

// ---------- équation d'un changement d'état ----------
// « H₂O(s) → H₂O(l) » : la même formule des deux côtés, seul l'état physique change
export const equation = (cid, chid, { etats = true } = {}) => {
  const c = CORPS[cid], ch = changement(chid);
  const t = e => (etats ? `${c.f}(${e})` : c.f);
  return `${t(ch.de)} → ${t(ch.vers)}`;
};
export const equationInverse = (cid, chid) => equation(cid, inverse(chid).id);

// ---------- énergie ----------
export const L = (cid, chid) => { const ch = changement(chid); return ch.Lcle ? CORPS[cid][ch.Lcle] : null; };       // kJ/kg
export const T = (cid, chid) => { const ch = changement(chid); return ch.Tcle ? CORPS[cid][ch.Tcle] : null; };       // °C
export const energie = (m, l) => m * l;                                                                           // kJ
export const masseDepuisEnergie = (E, l) => E / l;                                                                // kg
// Énergie fournie E à une masse m : masse qui a changé d'état (proportionnalité), bornée par m
export const masseTransformee = (E, m, l) => Math.min(m, Math.max(0, E / l));
export const fractionTransformee = (E, m, l) => masseTransformee(E, m, l) / m;

// ---------- arrondis et affichage (notation française) ----------
export const arrondiSig = (x, n) => (x === 0 || !isFinite(x) ? x : Number(x.toPrecision(n)));
export const nombreFR = (x, d = null) => {
  if (!isFinite(x)) return '—';
  const s = d == null ? Number(x.toPrecision(3)).toLocaleString('fr-FR', { maximumFractionDigits: 6 }) : x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  return s.replace(/[\u202f\u00a0 ]/g, NB).replace('-', '−');
};
// Énergie en kJ avec 3 chiffres significatifs (ou 2 si on le demande)
export const entierFR = x => nombreFR(Math.round(x));

// ---------- défis ----------
const tireDans = t => t[Math.floor(Math.random() * t.length)];
const MASSES = [0.20, 0.30, 0.40, 0.50, 0.60, 0.80, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];      // kg, 2 chiffres significatifs ; on évite 1,0 : la valeur recopiée du cours (L) serait juste
const CHANGEMENTS_ENERGIE = ['fusion', 'solidification', 'vaporisation', 'liquefaction'];
export const tolDefi = 0.06;                                                                     // un résultat arrondi à 2 chiffres significatifs (≤ 5 %) doit être accepté

// Défi 1 : calculer E (variante 'E') ou m (variante 'm')
export const tirerDefiEnergie = (precedent = null) => {
  let d;
  do {
    const cid = tireDans(Object.keys(CORPS)), chid = tireDans(CHANGEMENTS_ENERGIE), l = L(cid, chid), variante = tireDans(['E', 'E', 'm']);
    const m = tireDans(MASSES);
    if (variante === 'E') d = { variante, cid, chid, L: l, m, vrai: energie(m, l) };
    else {
      const E = arrondiSig(energie(m, l), 2);                                                    // la donnée affichée est celle qui sert au corrigé
      d = { variante, cid, chid, L: l, E, vrai: masseDepuisEnergie(E, l) };
    }
  } while (precedent && d.cid === precedent.cid && d.chid === precedent.chid && d.m === precedent.m);
  return d;
};
export const reponseJusteEnergie = (d, x) => isFinite(x) && Math.abs(x - d.vrai) <= tolDefi * Math.abs(d.vrai);

// Défi 2 : reconnaître la situation (nom du changement et sens du transfert)
export const SITUATIONS = [
  { id: 'glacon', cid: 'eau', chid: 'fusion', texte: 'Un glaçon posé sur une table se transforme en eau liquide.' },
  { id: 'congelo', cid: 'eau', chid: 'solidification', texte: 'De l’eau liquide, placée dans un congélateur, devient de la glace.' },
  { id: 'casserole', cid: 'eau', chid: 'vaporisation', texte: 'L’eau d’une casserole posée sur le feu se transforme en vapeur d’eau.' },
  { id: 'buee', cid: 'eau', chid: 'liquefaction', texte: 'De la vapeur d’eau se transforme en gouttelettes d’eau liquide sur un miroir froid : c’est la buée.' },
  { id: 'givre', cid: 'eau', chid: 'condensation', texte: 'De la vapeur d’eau de l’air se transforme directement en cristaux de glace sur une vitre très froide : c’est le givre.' },
  { id: 'ethanol', cid: 'ethanol', chid: 'vaporisation', texte: 'Un flacon d’éthanol est resté ouvert : l’éthanol liquide se transforme peu à peu en gaz.' },
  { id: 'azote', cid: 'diazote', chid: 'vaporisation', texte: 'Du diazote liquide, très froid, versé dans un récipient, se transforme en gaz.' },
  { id: 'ethanolSolide', cid: 'ethanol', chid: 'solidification', texte: 'De l’éthanol liquide, refroidi à −114 °C, devient un solide.' },
  { id: 'liqAzote', cid: 'diazote', chid: 'liquefaction', texte: 'Du diazote gazeux, refroidi à −196 °C, se transforme en diazote liquide.' },
];
export const tirerSituation = (precedente = null) => { let s; do { s = tireDans(SITUATIONS); } while (precedente && s.id === precedente.id); return s; };
export const verifierSituation = (s, rep) => ({ nomOk: rep.chid === s.chid, sensOk: rep.sens === sens(s.chid) });
