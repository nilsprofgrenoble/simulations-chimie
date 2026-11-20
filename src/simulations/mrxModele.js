// ====================================================
//  SIM 186 — MÉCANISMES RÉACTIONNELS (TG) : modèle pur, sans React.
//  Un mécanisme est une suite d'actes élémentaires. Chaque acte décrit un état « avant » et un état « après » (schémas de Lewis :
//  atomes, liaisons, doublets non liants) et des flèches courbes. Tout est vérifié par programme (mrxModele.test.mjs) :
//   • on applique les flèches à l'état « avant » ; on doit retrouver exactement l'état « après » (liaisons et doublets) ;
//   • chaque flèche part d'un doublet non liant ou d'une liaison qui existent bien ;
//   • charges formelles calculées (V − 2·doublets − liaisons) ; carbone à 4 liaisons (3 pour un carbocation) ; règle de l'octet (duet pour H) ;
//   • atomes et charge conservés à chaque acte ; formules et charges des espèces cohérentes avec le dessin.
//  Mécanismes dessinés : substitution de HO⁻ sur CH₃Cl ou CH₃Br (un acte), hydratation de l'éthène catalysée par H₃O⁺ (trois actes).
//  Mécanismes écrits seulement avec des formules (exercices, défi) : hydratation du propène, décomposition de H₂O₂ catalysée par I⁻.
//  Les mécanismes sont FOURNIS à l'élève : il ne les invente pas.
// ====================================================
export const NB = ' ';
export const VALENCE = { H: 1, C: 4, O: 6, Cl: 7, Br: 7 };
export const ELECTRONEG = { H: 2.20, C: 2.55, O: 3.44, Cl: 3.16, Br: 2.96 };   // échelle de Pauling

const pol = (c, ang, d = 45) => [Math.round((c[0] + d * Math.cos(ang * Math.PI / 180)) * 10) / 10, Math.round((c[1] - d * Math.sin(ang * Math.PI / 180)) * 10) / 10];
const at = (el, [x, y], lp = []) => ({ el, x, y, lp });
const clef = (a, b) => [a, b].sort().join('|');

// ---------- calculs sur un état ----------
export const ordreEntre = (etat, a, b) => { const l = etat.liaisons.find(([x, y]) => clef(x, y) === clef(a, b)); return l ? l[2] : 0; };
export const sommeLiaisons = (etat, id) => etat.liaisons.reduce((s, [a, b, o]) => s + (a === id || b === id ? o : 0), 0);
export const chargeFormelle = (etat, id) => { const a = etat.atomes[id]; return VALENCE[a.el] - 2 * a.lp.length - sommeLiaisons(etat, id); };
export const chargeEspece = (etat, esp) => esp.ids.reduce((s, id) => s + chargeFormelle(etat, id), 0);
export const voisins = (etat, id) => etat.liaisons.filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a));

// Contrôles de validité chimique d'un état (liste d'erreurs ; vide si tout va bien)
export function erreursEtat(etat) {
  const err = [];
  for (const [id, a] of Object.entries(etat.atomes)) {
    const sl = sommeLiaisons(etat, id), q = chargeFormelle(etat, id), nl = a.lp.length;
    if (a.el === 'H') { if (sl !== 1 || nl !== 0) err.push(`${id} : H doit avoir une liaison et aucun doublet (liaisons ${sl}, doublets ${nl})`); }
    else {
      if (2 * sl + 2 * nl > 8) err.push(`${id} : plus de 8 électrons autour de ${a.el}`);
      if (a.el === 'C') {
        if (!((q === 0 && sl === 4 && nl === 0) || (q === 1 && sl === 3 && nl === 0))) err.push(`${id} : carbone à ${sl} liaisons, ${nl} doublet(s), charge ${q} (4 liaisons, ou carbocation à 3 liaisons)`);
      } else if (2 * sl + 2 * nl !== 8) err.push(`${id} : ${a.el} n'a pas l'octet (liaisons ${sl}, doublets ${nl})`);
    }
  }
  // espèces : chaque atome dans une seule espèce, espèces connexes, formule et charge cohérentes avec le dessin
  const vus = new Set();
  for (const esp of etat.especes) {
    for (const id of esp.ids) { if (vus.has(id)) err.push(`${id} dans deux espèces`); vus.add(id); if (!etat.atomes[id]) err.push(`${id} inconnu`); }
    const f = parseFormule(esp.f), compte = {};
    esp.ids.forEach(id => { compte[etat.atomes[id].el] = (compte[etat.atomes[id].el] || 0) + 1; });
    if (JSON.stringify(trier(f.atomes)) !== JSON.stringify(trier(compte))) err.push(`${esp.f} : formule ≠ atomes du dessin ${JSON.stringify(compte)}`);
    if (f.charge !== chargeEspece(etat, esp)) err.push(`${esp.f} : charge ${f.charge} ≠ charge du dessin ${chargeEspece(etat, esp)}`);
    // connexité
    const dedans = new Set(esp.ids), vu2 = new Set([esp.ids[0]]), pile = [esp.ids[0]];
    while (pile.length) { const x = pile.pop(); for (const y of voisins(etat, x)) { if (!dedans.has(y)) err.push(`${x}–${y} relie deux espèces`); else if (!vu2.has(y)) { vu2.add(y); pile.push(y); } } }
    if (vu2.size !== dedans.size) err.push(`${esp.f} : espèce non connexe`);
  }
  if (vus.size !== Object.keys(etat.atomes).length) err.push('atome sans espèce');
  return err;
}
const trier = o => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));

// ---------- formules écrites en indices Unicode ----------
const SUBS = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
const SUPS = { '²': 2, '³': 3 };
export function parseFormule(f) {
  let s = f, charge = 0;
  const m = s.match(/([²³]?)([⁺⁻])$/);
  if (m) { charge = (m[1] ? SUPS[m[1]] : 1) * (m[2] === '⁺' ? 1 : -1); s = s.slice(0, s.length - m[0].length); }
  const atomes = {}; const re = /([A-Z][a-z]?)([₀-₉]*)/g; let r, lu = 0;
  while ((r = re.exec(s))) { lu += r[0].length; const n = r[2] ? [...r[2]].reduce((t, c) => t * 10 + SUBS[c], 0) : 1; atomes[r[1]] = (atomes[r[1]] || 0) + n; }
  if (lu !== s.length) throw new Error(`formule illisible : ${f}`);
  return { atomes, charge };
}

// ---------- flèches courbes ----------
// de : { lp: atome, k: indice du doublet } ou { liaison: [a, b] } ; vers : { atome: id, via?: id (atome de la liaison de départ qui se lie à l'arrivée) }
// effet : doublet → liaison (l'atome d'arrivée se lie à l'atome du doublet) ; liaison → doublet non liant (arrivée = un atome de la liaison) ;
//         liaison → liaison (π vers un atome extérieur : via se lie à l'atome d'arrivée).
export const cleDepart = de => (de.lp ? `lp:${de.lp}` : `liaison:${clef(de.liaison[0], de.liaison[1])}`);
export const cleFleche = f => `${cleDepart(f.de)}>${f.vers.atome}`;

export function appliquer(etat, fleches) {
  const lien = new Map(etat.liaisons.map(([a, b, o]) => [clef(a, b), o]));
  const lp = Object.fromEntries(Object.entries(etat.atomes).map(([id, a]) => [id, a.lp.length]));
  const maj = (a, b, d) => { const k = clef(a, b), v = (lien.get(k) || 0) + d; if (v < 0) throw new Error(`liaison ${k} négative`); if (v === 0) lien.delete(k); else lien.set(k, v); };
  for (const f of fleches) {
    const cible = f.vers.atome;
    if (f.de.lp) {
      const a = f.de.lp; if (lp[a] < 1) throw new Error(`pas de doublet non liant sur ${a}`);
      lp[a]--; maj(a, cible, +1);
    } else {
      const [a, b] = f.de.liaison; if (!(lien.get(clef(a, b)) >= 1)) throw new Error(`pas de liaison ${a}–${b}`);
      maj(a, b, -1);
      if (cible === a || cible === b) lp[cible]++;
      else { if (!f.vers.via || (f.vers.via !== a && f.vers.via !== b)) throw new Error('via manquant'); maj(f.vers.via, cible, +1); }
    }
  }
  return { lien, lp };
}
// Compare le résultat des flèches à l'état « après » : renvoie une liste de différences
export function ecartsAvecApres(acte) {
  const { lien, lp } = appliquer(acte.avant, acte.fleches), ec = [];
  const apres = new Map(acte.apres.liaisons.map(([a, b, o]) => [clef(a, b), o]));
  for (const k of new Set([...lien.keys(), ...apres.keys()])) if ((lien.get(k) || 0) !== (apres.get(k) || 0)) ec.push(`liaison ${k} : ${(lien.get(k) || 0)} ≠ ${(apres.get(k) || 0)}`);
  for (const id of Object.keys(acte.avant.atomes)) if (lp[id] !== (acte.apres.atomes[id] ? acte.apres.atomes[id].lp.length : -1)) ec.push(`doublets de ${id} : ${lp[id]} ≠ ${acte.apres.atomes[id] && acte.apres.atomes[id].lp.length}`);
  if (Object.keys(acte.avant.atomes).sort().join() !== Object.keys(acte.apres.atomes).sort().join()) ec.push('atomes différents');
  return ec;
}
// Un doublet effectivement déplacé par chaque flèche ; le sens est justifié par le tableau « raison »
export const sensJustifie = f => (f.de.lp ? 'doublet non liant → site accepteur' : 'doublet de liaison → atome');

// ---------- bilan d'un mécanisme (à partir des formules) ----------
export const especesActe = (etat) => etat.especes.map(e => ({ f: e.f, n: 1 }));
export function listeActes(meca) {
  return meca.actes.map(a => (a.avant ? { react: especesActe(a.avant), prod: especesActe(a.apres) } : { react: a.react.map(x => (typeof x === 'string' ? { f: x, n: 1 } : x)), prod: a.prod.map(x => (typeof x === 'string' ? { f: x, n: 1 } : x)) }));
}
export function analyserMecanisme(meca) {
  const actes = listeActes(meca), net = new Map(), premier = new Map(), ordre = [];
  actes.forEach(a => { [['react', 1], ['prod', -1]].forEach(([cle, s]) => a[cle].forEach(({ f, n }) => {
    if (!premier.has(f)) { premier.set(f, cle); ordre.push(f); }
    net.set(f, (net.get(f) || 0) + s * n); })); });
  const intermediaires = [], catalyseurs = [], reactifs = [], produits = [];
  for (const f of ordre) {
    const v = net.get(f);
    if (v === 0) (premier.get(f) === 'prod' ? intermediaires : catalyseurs).push(f);
    else if (v > 0) reactifs.push({ f, n: v }); else produits.push({ f, n: -v });
  }
  return { actes, reactifs, produits, intermediaires, catalyseurs };
}
export const ecrireTerme = ({ f, n }) => (n > 1 ? `${n}${NB}${f}` : f);
export const ecrireEquation = (react, prod) => `${react.map(ecrireTerme).join(' + ')} → ${prod.map(ecrireTerme).join(' + ')}`;
export const equationBilan = meca => { const a = analyserMecanisme(meca); return ecrireEquation(a.reactifs, a.produits); };
// atomes et charge d'une liste de termes
export function totaux(termes) {
  const at = {}; let q = 0;
  termes.forEach(({ f, n }) => { const p = parseFormule(f); for (const [k, v] of Object.entries(p.atomes)) at[k] = (at[k] || 0) + v * n; q += p.charge * n; });
  return { atomes: trier(at), charge: q };
}
export const conserve = (react, prod) => { const a = totaux(react), b = totaux(prod); return JSON.stringify(a.atomes) === JSON.stringify(b.atomes) && a.charge === b.charge; };

// ====================================================
//  MÉCANISMES DESSINÉS
// ====================================================
const nomX = { Br: ['bromométhane', 'ion bromure'], Cl: ['chlorométhane', 'ion chlorure'] };

function substitution(X) {
  const Cc = [250, 100], Oc = [80, 100], d = X === 'Br' ? 88 : 84;
  const avant = {
    atomes: {
      O: at('O', Oc, [60, 0, 300]), Ho: at('H', pol(Oc, 180, 45)),
      C: at('C', Cc), H1: at('H', pol(Cc, 90, 45)), H2: at('H', pol(Cc, 225, 45)), H3: at('H', pol(Cc, 315, 45)),
      X: at(X, pol(Cc, 0, d), [90, 0, 270]),
    },
    liaisons: [['O', 'Ho', 1], ['C', 'H1', 1], ['C', 'H2', 1], ['C', 'H3', 1], ['C', 'X', 1]],
    especes: [{ ids: ['O', 'Ho'], f: 'HO⁻', nom: 'ion hydroxyde' }, { ids: ['C', 'H1', 'H2', 'H3', 'X'], f: `CH₃${X}`, nom: nomX[X][0] }],
    delta: { C: '+', X: '−' },
    noms: { O: 'O de HO⁻', Ho: 'H de HO⁻', C: `C de CH₃${X}`, X: `${X} de CH₃${X}`, H1: 'H du haut de CH₃' + X, H2: 'H du bas à gauche de CH₃' + X, H3: 'H du bas à droite de CH₃' + X },
  };
  const O2 = [200, 100];
  const apres = {
    atomes: {
      O: at('O', O2, [90, 150]), Ho: at('H', pol(O2, 225, 45)),
      C: at('C', Cc), H1: at('H', pol(Cc, 90, 45)), H2: at('H', pol(Cc, 30, 45)), H3: at('H', pol(Cc, 330, 45)),
      X: at(X, [360, 100], [0, 90, 180, 270]),
    },
    liaisons: [['O', 'Ho', 1], ['O', 'C', 1], ['C', 'H1', 1], ['C', 'H2', 1], ['C', 'H3', 1]],
    especes: [{ ids: ['O', 'Ho', 'C', 'H1', 'H2', 'H3'], f: 'CH₃OH', nom: 'méthanol' }, { ids: ['X'], f: `${X}⁻`, nom: nomX[X][1] }],
  };
  const fleches = [
    { de: { lp: 'O', k: 0 }, vers: { atome: 'C', fin: 157 }, courbure: 0.45 },
    { de: { liaison: ['C', 'X'] }, vers: { atome: 'X', fin: 150 }, courbure: 0.8 },
  ];
  return {
    id: `subst-${X}`, titre: `Substitution : HO⁻ et CH₃${X}`, court: `HO⁻ + CH₃${X}`,
    actes: [{
      id: 'a1', titre: 'Un seul acte élémentaire', avant, apres, fleches,
      donneur: 'HO⁻', accepteur: `CH₃${X}`,
      // retours ciblés : [départ, arrivée, message]
      erreurs: [
        ['lp:X', 'atome:C', `Le doublet de ${X} ne se dirige pas vers le carbone : c'est le doublet de la liaison C–${X} qui reste sur ${X}.`],
        [`liaison:${clef('C', 'X')}`, 'atome:O', `La liaison C–${X} ne se rompt pas au profit de O : O est le donneur de doublet, pas le receveur.`],
      ],
    }],
  };
}

function hydratation() {
  // ----- acte 1 : protonation de l'éthène par H₃O⁺ -----
  const y = 125, Oc = [75, y], Cm = [245, y], Cp = [315, y];
  const a1 = {
    avant: {
      atomes: {
        Oc: at('O', Oc, [180]), Hc1: at('H', pol(Oc, 0, 70)), Hc2: at('H', pol(Oc, 120, 62)), Hc3: at('H', pol(Oc, 240, 62)),
        Cm: at('C', Cm), Cp: at('C', Cp),
        Hm1: at('H', pol(Cm, 120, 45)), Hm2: at('H', pol(Cm, 240, 45)), Hp1: at('H', pol(Cp, 60, 45)), Hp2: at('H', pol(Cp, 300, 45)),
      },
      liaisons: [['Oc', 'Hc1', 1], ['Oc', 'Hc2', 1], ['Oc', 'Hc3', 1], ['Cm', 'Cp', 2], ['Cm', 'Hm1', 1], ['Cm', 'Hm2', 1], ['Cp', 'Hp1', 1], ['Cp', 'Hp2', 1]],
      especes: [{ ids: ['Oc', 'Hc1', 'Hc2', 'Hc3'], f: 'H₃O⁺', nom: 'ion oxonium' }, { ids: ['Cm', 'Cp', 'Hm1', 'Hm2', 'Hp1', 'Hp2'], f: 'C₂H₄', nom: 'éthène' }],
      delta: { Hc1: '+' }, deltaAng: { Hc1: 270 },
      noms: { Oc: 'O de H₃O⁺', Hc1: 'H de H₃O⁺ (à droite)', Hc2: 'H de H₃O⁺ (en haut)', Hc3: 'H de H₃O⁺ (en bas)', Cm: 'C de gauche de C₂H₄', Cp: 'C de droite de C₂H₄', Hm1: 'H en haut à gauche de C₂H₄', Hm2: 'H en bas à gauche de C₂H₄', Hp1: 'H en haut à droite de C₂H₄', Hp2: 'H en bas à droite de C₂H₄' },
    },
    apres: {
      atomes: {
        Oc: at('O', Oc, [30, 330]), Hc1: at('H', pol(Cm, 180, 45)), Hc2: at('H', pol(Oc, 120, 45)), Hc3: at('H', pol(Oc, 240, 45)),
        Cm: at('C', Cm), Cp: at('C', Cp),
        Hm1: at('H', pol(Cm, 120, 45)), Hm2: at('H', pol(Cm, 240, 45)), Hp1: at('H', pol(Cp, 60, 45)), Hp2: at('H', pol(Cp, 300, 45)),
      },
      liaisons: [['Oc', 'Hc2', 1], ['Oc', 'Hc3', 1], ['Cm', 'Hc1', 1], ['Cm', 'Cp', 1], ['Cm', 'Hm1', 1], ['Cm', 'Hm2', 1], ['Cp', 'Hp1', 1], ['Cp', 'Hp2', 1]],
      especes: [{ ids: ['Oc', 'Hc2', 'Hc3'], f: 'H₂O', nom: 'eau' }, { ids: ['Cm', 'Cp', 'Hc1', 'Hm1', 'Hm2', 'Hp1', 'Hp2'], f: 'C₂H₅⁺', nom: 'cation éthyle (carbocation)' }],
    },
    equivalents: [['Hc1', 'Hc2', 'Hc3']],
    fleches: [
      { de: { liaison: ['Cm', 'Cp'] }, vers: { atome: 'Hc1', via: 'Cm', fin: 60 }, courbure: -0.95 },
      { de: { liaison: ['Oc', 'Hc1'] }, vers: { atome: 'Oc', fin: 300 }, courbure: 0.8 },
    ],
    donneur: 'C₂H₄', accepteur: 'H₃O⁺',
    erreurs: [
      ['liaison:' + clef('Cm', 'Hm1'), 'atome:Hc1', 'La liaison C–H ne bouge pas : c\'est la liaison double C=C, riche en électrons, qui attaque l\'hydrogène.'],
      ['lp:Oc', 'atome:Cm', 'Le doublet non liant de l\'oxygène de H₃O⁺ ne se déplace pas ici : H₃O⁺ est un accepteur de doublet.'],
    ],
  };
  // ----- acte 2 : l'eau attaque le carbocation -----
  const y2 = 125, Cm2 = [140, y2], Cp2 = [210, y2], Ow = [330, y2];
  const a2 = {
    avant: {
      atomes: {
        Cm: at('C', Cm2), Cp: at('C', Cp2),
        Hc1: at('H', pol(Cm2, 180, 45)), Hm1: at('H', pol(Cm2, 120, 45)), Hm2: at('H', pol(Cm2, 240, 45)), Hp1: at('H', pol(Cp2, 60, 45)), Hp2: at('H', pol(Cp2, 300, 45)),
        Ow: at('O', Ow, [180, 0]), Hw1: at('H', pol(Ow, 60, 45)), Hw2: at('H', pol(Ow, 300, 45)),
      },
      liaisons: [['Cm', 'Cp', 1], ['Cm', 'Hc1', 1], ['Cm', 'Hm1', 1], ['Cm', 'Hm2', 1], ['Cp', 'Hp1', 1], ['Cp', 'Hp2', 1], ['Ow', 'Hw1', 1], ['Ow', 'Hw2', 1]],
      especes: [{ ids: ['Cm', 'Cp', 'Hc1', 'Hm1', 'Hm2', 'Hp1', 'Hp2'], f: 'C₂H₅⁺', nom: 'cation éthyle (carbocation)' }, { ids: ['Ow', 'Hw1', 'Hw2'], f: 'H₂O', nom: 'eau' }],
      lacunes: [{ atome: 'Cp', ang: 0 }],
      noms: { Ow: 'O de H₂O', Cp: 'C chargé + (à droite)', Cm: 'C de gauche' },
    },
    apres: {
      atomes: {
        Cm: at('C', Cm2), Cp: at('C', Cp2),
        Hc1: at('H', pol(Cm2, 180, 45)), Hm1: at('H', pol(Cm2, 120, 45)), Hm2: at('H', pol(Cm2, 240, 45)), Hp1: at('H', pol(Cp2, 60, 45)), Hp2: at('H', pol(Cp2, 300, 45)),
        Ow: at('O', [262, y2], [0]), Hw1: at('H', pol([262, y2], 60, 45)), Hw2: at('H', pol([262, y2], 300, 45)),
      },
      liaisons: [['Cm', 'Cp', 1], ['Cm', 'Hc1', 1], ['Cm', 'Hm1', 1], ['Cm', 'Hm2', 1], ['Cp', 'Hp1', 1], ['Cp', 'Hp2', 1], ['Cp', 'Ow', 1], ['Ow', 'Hw1', 1], ['Ow', 'Hw2', 1]],
      especes: [{ ids: ['Cm', 'Cp', 'Hc1', 'Hm1', 'Hm2', 'Hp1', 'Hp2', 'Ow', 'Hw1', 'Hw2'], f: 'C₂H₅OH₂⁺', nom: 'ion éthyloxonium' }],
    },
    fleches: [{ de: { lp: 'Ow', k: 0 }, vers: { atome: 'Cp', fin: 0 }, courbure: -0.3 }],
    donneur: 'H₂O', accepteur: 'C₂H₅⁺',
    erreurs: [
      ['lp:Ow', 'atome:Cm', 'Le carbone de gauche a ses quatre liaisons : il ne peut pas recevoir de doublet. Le site accepteur est le carbone qui porte la charge + et la lacune.'],
    ],
  };
  // ----- acte 3 : une autre molécule d'eau capte H⁺ -----
  const y3 = 150, Cm3 = [80, y3], Cp3 = [148, y3], Oo = [208, y3], Ow2 = [345, 62];
  const a3 = {
    avant: {
      atomes: {
        Cm: at('C', Cm3), Cp: at('C', Cp3),
        Hc1: at('H', pol(Cm3, 180, 45)), Hm1: at('H', pol(Cm3, 120, 45)), Hm2: at('H', pol(Cm3, 240, 45)), Hp1: at('H', pol(Cp3, 90, 45)), Hp2: at('H', pol(Cp3, 270, 45)),
        Oo: at('O', Oo, [0]), Hw1: at('H', pol(Oo, 45, 55)), Hw2: at('H', pol(Oo, 300, 45)),
        Ow: at('O', Ow2, [200, 150]), Hw3: at('H', pol(Ow2, 55, 45)), Hw4: at('H', pol(Ow2, 305, 45)),
      },
      liaisons: [['Cm', 'Cp', 1], ['Cm', 'Hc1', 1], ['Cm', 'Hm1', 1], ['Cm', 'Hm2', 1], ['Cp', 'Hp1', 1], ['Cp', 'Hp2', 1], ['Cp', 'Oo', 1], ['Oo', 'Hw1', 1], ['Oo', 'Hw2', 1], ['Ow', 'Hw3', 1], ['Ow', 'Hw4', 1]],
      especes: [{ ids: ['Cm', 'Cp', 'Hc1', 'Hm1', 'Hm2', 'Hp1', 'Hp2', 'Oo', 'Hw1', 'Hw2'], f: 'C₂H₅OH₂⁺', nom: 'ion éthyloxonium' }, { ids: ['Ow', 'Hw3', 'Hw4'], f: 'H₂O', nom: 'eau' }],
      delta: { Hw1: '+' },
      noms: { Ow: 'O de H₂O', Oo: 'O de l\'ion éthyloxonium', Hw1: 'H de l\'ion éthyloxonium (en haut)', Hw2: 'H de l\'ion éthyloxonium (en bas)' },
    },
    apres: {
      atomes: {
        Cm: at('C', Cm3), Cp: at('C', Cp3),
        Hc1: at('H', pol(Cm3, 180, 45)), Hm1: at('H', pol(Cm3, 120, 45)), Hm2: at('H', pol(Cm3, 240, 45)), Hp1: at('H', pol(Cp3, 90, 45)), Hp2: at('H', pol(Cp3, 270, 45)),
        Oo: at('O', Oo, [60, 0]), Hw2: at('H', pol(Oo, 300, 45)),
        Ow: at('O', [330, 100], [0]), Hw1: at('H', pol([330, 100], 180, 62)), Hw3: at('H', pol([330, 100], 60, 62)), Hw4: at('H', pol([330, 100], 300, 62)),
      },
      liaisons: [['Cm', 'Cp', 1], ['Cm', 'Hc1', 1], ['Cm', 'Hm1', 1], ['Cm', 'Hm2', 1], ['Cp', 'Hp1', 1], ['Cp', 'Hp2', 1], ['Cp', 'Oo', 1], ['Oo', 'Hw2', 1], ['Ow', 'Hw1', 1], ['Ow', 'Hw3', 1], ['Ow', 'Hw4', 1]],
      especes: [{ ids: ['Cm', 'Cp', 'Hc1', 'Hm1', 'Hm2', 'Hp1', 'Hp2', 'Oo', 'Hw2'], f: 'C₂H₅OH', nom: 'éthanol' }, { ids: ['Ow', 'Hw1', 'Hw3', 'Hw4'], f: 'H₃O⁺', nom: 'ion oxonium' }],
    },
    equivalents: [['Hw1', 'Hw2']],
    fleches: [
      { de: { lp: 'Ow', k: 0 }, vers: { atome: 'Hw1', fin: 20 }, courbure: -0.3 },
      { de: { liaison: ['Oo', 'Hw1'] }, vers: { atome: 'Oo', fin: 100 }, courbure: -1.4 },
    ],
    donneur: 'H₂O', accepteur: 'C₂H₅OH₂⁺',
    erreurs: [
      ['lp:Ow', 'atome:Cp', 'Le carbone Cp a déjà ses quatre liaisons : il ne reçoit rien. Dans cet acte, l\'eau capte un H⁺ de l\'ion éthyloxonium.'],
    ],
  };
  return {
    id: 'hydratation', titre: 'Hydratation de l\'éthène catalysée par H₃O⁺', court: 'C₂H₄ + H₂O (catalyse acide)', catalyseurAttendu: 'H₃O⁺',
    actes: [
      { id: 'a1', titre: 'Acte 1 : l\'éthène capte un H⁺', ...a1 },
      { id: 'a2', titre: 'Acte 2 : l\'eau attaque le carbocation', ...a2 },
      { id: 'a3', titre: 'Acte 3 : une eau reprend un H⁺', ...a3 },
    ],
  };
}

export const MECANISMES = [substitution('Br'), substitution('Cl'), hydratation()];
export const mecaParId = id => MECANISMES.find(m => m.id === id);

// Mécanismes écrits avec des formules seulement (exercices et défi) ; ils complètent les trois mécanismes dessinés.
export const MECANISMES_FORMULES = [
  { id: 'hydratation-propene', titre: 'Hydratation du propène en propan-2-ol (catalyse acide)',
    actes: [{ react: ['C₃H₆', 'H₃O⁺'], prod: ['C₃H₇⁺', 'H₂O'] }, { react: ['C₃H₇⁺', 'H₂O'], prod: ['C₃H₇OH₂⁺'] }, { react: ['C₃H₇OH₂⁺', 'H₂O'], prod: ['C₃H₇OH', 'H₃O⁺'] }] },
  { id: 'eau-oxygenee-iodure', titre: 'Décomposition de l\'eau oxygénée catalysée par les ions iodure',
    actes: [{ react: ['H₂O₂', 'I⁻'], prod: ['H₂O', 'IO⁻'] }, { react: ['H₂O₂', 'IO⁻'], prod: ['H₂O', 'O₂', 'I⁻'] }] },
];
export const TOUS_MECANISMES = [...MECANISMES, ...MECANISMES_FORMULES];

// ====================================================
//  CHOIX DES RÉPONSES (défi, exercices) : équilibrer la longueur des options
// ====================================================
const alea = seed => { let s = seed >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
const melange = (t, r) => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const liste = fs => (fs.length ? fs.join(' et ') : 'aucune espèce');
export const nbActes = m => m.actes.length;

// Choix de 3 mauvaises réponses parmi des candidats : le rang de longueur de la bonne réponse est tiré au hasard (0 = la plus courte, 2 = deuxième plus longue ; jamais la plus longue)
function choisirParRang(bon, candidats, r, txt, cle = x => txt(x)) {
  const cible = Math.floor(r() * 3);
  let repli = null;
  for (let essai = 0; essai < 600; essai++) {
    const c = melange(candidats, r), pris = [];
    for (const x of c) { if (cle(x) !== cle(bon) && !pris.some(y => cle(y) === cle(x))) pris.push(x); if (pris.length === 3) break; }
    if (pris.length < 3) return null;
    const L0 = txt(bon).length, L = pris.map(x => txt(x).length);
    if (!(L0 < Math.max(...L))) continue;
    if (!repli) repli = pris;
    if (L.filter(l => l < L0).length === cible) return pris;
  }
  return repli;
}
// Options d'une liste d'espèces (1, 2 ou 3 espèces du mécanisme) : jamais la bonne réponse la plus longue, ni systématiquement la plus courte
function optionsEspeces(correct, pool, r, txt) {
  const n = pool.length, ens = [];
  for (let a = 0; a < n; a++) { ens.push([pool[a]]); for (let b = a + 1; b < n; b++) { ens.push([pool[a], pool[b]]); for (let c = b + 1; c < n; c++) ens.push([pool[a], pool[b], pool[c]]); } }
  const cle = x => [...x].sort().join('|');
  const choisis = choisirParRang(correct, ens.map(x => [...x].sort()), r, txt, cle);
  if (!choisis) throw new Error('options non équilibrées');
  return [correct, ...choisis];
}

export function tirageMecanisme(seed = Math.floor(Math.random() * 1e9)) {
  const r = alea(seed);
  const m = TOUS_MECANISMES[Math.floor(r() * TOUS_MECANISMES.length)], an = analyserMecanisme(m);
  const tous = []; an.actes.forEach(a => [...a.react, ...a.prod].forEach(({ f }) => { if (!tous.includes(f)) tous.push(f); }));
  const bonEq = ecrireEquation(an.reactifs, an.produits);
  // ----- Q1 : nombre d'actes -----
  const q1 = { id: 'actes', type: 'num', q: `Combien d'actes élémentaires comporte ce mécanisme ?`, vrai: an.actes.length, tol: 0, unite: '',
    indice: 'Chaque équation du mécanisme décrit un acte élémentaire : un seul choc, une seule étape.',
    detail: `Le mécanisme contient ${an.actes.length} équation${an.actes.length > 1 ? 's' : ''} : ${an.actes.length} acte${an.actes.length > 1 ? 's' : ''} élémentaire${an.actes.length > 1 ? 's' : ''}.` };
  // ----- Q2 : intermédiaires -----
  const txt2 = x => (x.length ? liste(x) : 'aucun intermédiaire');
  const o2 = optionsEspeces([...an.intermediaires].sort(), tous, r, txt2);
  const m2 = melange(o2.map((s, i) => [s, i]), r);
  const q2 = { id: 'inter', type: 'qcm', q: 'Quels sont les intermédiaires réactionnels de ce mécanisme ?', options: m2.map(([s]) => txt2(s)), bonne: m2.findIndex(([, i]) => i === 0),
    indice: 'Un intermédiaire est formé dans un acte, puis consommé dans un acte suivant : il n\'est ni réactif ni produit du bilan.',
    detail: an.intermediaires.length ? `${liste(an.intermediaires)} : formé${an.intermediaires.length > 1 ? 's' : ''} puis consommé${an.intermediaires.length > 1 ? 's' : ''}, absent du bilan.` : 'Aucune espèce n\'est formée puis consommée : il n\'y a qu\'un acte, donc pas d\'intermédiaire.' };
  // ----- Q3 : catalyseur -----
  const c3 = an.catalyseurs;
  const txt3 = x => (x.length ? liste(x) : 'aucun catalyseur');
  const o3 = optionsEspeces(c3.slice().sort(), tous, r, txt3);
  const m3 = melange(o3.map((s, i) => [s, i]), r);
  const q3 = { id: 'cata', type: 'qcm', q: 'Quel est le catalyseur de cette transformation ?', options: m3.map(([s]) => txt3(s)), bonne: m3.findIndex(([, i]) => i === 0),
    indice: 'Un catalyseur est consommé dans un acte puis régénéré dans un acte suivant : on le retrouve intact à la fin, absent du bilan.',
    detail: c3.length ? `${liste(c3)} : consommé puis régénéré, absent du bilan.` : 'Aucune espèce n\'est consommée puis régénérée : il n\'y a pas de catalyseur.' };
  // ----- Q4 : équation bilan (erreurs typiques seulement, espèces du mécanisme) -----
  const mauvais = new Set();
  const cat = an.catalyseurs[0], inter = an.intermediaires[0];
  const sansCharge = f => f.replace(/[²³]?[⁺⁻]$/, '');
  const essais = [];   // [réactifs, produits, accepté même s'il conserve (équation d'un acte, non bilan)]
  if (cat) essais.push([[...an.reactifs, { f: cat, n: 1 }], [...an.produits]]);                         // catalyseur laissé à gauche
  if (cat) essais.push([[...an.reactifs, { f: cat, n: 1 }], [...an.produits, { f: cat, n: 1 }]]);        // catalyseur des deux côtés
  if (cat) essais.push([an.reactifs, [...an.produits, { f: cat, n: 1 }]]);                              // catalyseur laissé à droite
  if (inter) essais.push([an.reactifs, [...an.produits, { f: inter, n: 1 }]]);                          // intermédiaire laissé à droite
  if (inter) essais.push([[...an.reactifs, { f: inter, n: 1 }], an.produits]);                          // intermédiaire laissé à gauche
  essais.push([an.reactifs.map(x => ({ ...x, n: 1 })), an.produits.map(x => ({ ...x, n: 1 }))]);        // coefficients oubliés
  essais.push([an.actes[0].react, an.actes[0].prod, true]);                                             // équation du premier acte
  essais.push([an.actes[an.actes.length - 1].react, an.actes[an.actes.length - 1].prod, true]);         // équation du dernier acte
  if (an.produits.length > 1) essais.push([an.reactifs, an.produits.slice(0, -1)]);                     // un produit oublié
  if (an.reactifs.length > 1) essais.push([an.reactifs.slice(1), an.produits]);                         // un réactif oublié
  essais.push([an.reactifs, an.produits.map(x => ({ ...x, f: sansCharge(x.f) }))]);                     // charge oubliée
  essais.push([an.reactifs.map(x => ({ ...x, f: sansCharge(x.f) })), an.produits]);
  an.produits.forEach((p, i) => tous.filter(f => !an.produits.some(x => x.f === f)).forEach(f => essais.push([an.reactifs, an.produits.map((x, k) => (k === i ? { f, n: x.n } : x))])));   // produit confondu avec une autre espèce du mécanisme
  essais.forEach(([re, pr, permis]) => {
    let ok = true; try { ok = conserve(re, pr); } catch { ok = false; }
    if (ok && !permis) return;
    const e = ecrireEquation(re, pr); if (e !== bonEq) mauvais.add(e);
  });
  const choisis = choisirParRang(bonEq, [...mauvais], r, x => x);
  let q4 = null;
  if (choisis) {
    const m4 = melange([bonEq, ...choisis].map((s, i) => [s, i]), r);
    q4 = { id: 'bilan', type: 'qcm', q: 'Quelle est l\'équation de la réaction modélisée par ce mécanisme (bilan) ?', options: m4.map(([s]) => s), bonne: m4.findIndex(([, i]) => i === 0),
      indice: 'Additionne tous les actes (réactifs ensemble, produits ensemble), puis simplifie les espèces présentes des deux côtés. Vérifie que les atomes et la charge sont conservés.',
      detail: `En additionnant les actes et en simplifiant (intermédiaires et catalyseur disparaissent) : ${bonEq}.` };
  }
  return { seed, meca: m, mecaId: m.id, Q: q4 ? [q1, q2, q3, q4] : [q1, q2, q3], reps: {}, essais: {}, verifie: false, bilan: bonEq };
}

// ----- défi « flèches » : on trace les flèches de deux actes tirés, puis on désigne le donneur -----
export function actesDessines() {
  const out = [];
  MECANISMES.forEach(m => m.actes.forEach((a, i) => out.push({ meca: m, acte: a, num: i })));
  return out;
}
// plage horizontale commune à l'état « avant » et à l'état « après » d'un acte (recadrage des schémas)
export function plageX(acte) {
  const xs = [acte.avant, acte.apres].flatMap(e => Object.values(e.atomes).map(a => a.x));
  return [Math.floor(Math.min(...xs) - 40), Math.ceil(Math.max(...xs) + 40)];
}
export function tirageFleches(seed = Math.floor(Math.random() * 1e9)) {
  const r = alea(seed), tout = actesDessines();
  const iA = Math.floor(r() * tout.length); let iB = Math.floor(r() * (tout.length - 1)); if (iB >= iA) iB++;
  const A = tout[iA], B = tout[iB];
  const especesA = A.acte.avant.especes.map(e => e.f);
  const pool = [...new Set(tout.flatMap(t => t.acte.avant.especes.map(e => e.f)))];
  const faux = melange(pool.filter(f => !especesA.includes(f)), r).slice(0, 2);
  const autre = especesA.find(f => f !== A.acte.donneur);
  const opts = melange([A.acte.donneur, autre, ...faux].filter((v, i, t) => t.indexOf(v) === i), r);
  return { seed, A, B, essais: {}, rep: null, tr: { a: [], b: [] }, ok: {}, verifie: false, role: { options: opts, bonne: opts.indexOf(A.acte.donneur) } };
}

// ====================================================
//  Vérification des flèches tracées par l'élève
// ====================================================
// tracees : [{ de, vers: { atome } }] ; renvoie { ok, messages }
// atomes équivalents (les trois H de H₃O⁺, les deux H de l'ion éthyloxonium) : n'importe lequel est accepté, à condition que les flèches concernent le même
export function normaliserTracees(acte, tracees) {
  let tr = tracees, incoherent = false;
  (acte.equivalents || []).forEach(g => {
    const attendu = g.find(id => acte.fleches.some(f => f.vers.atome === id || (f.de.liaison && f.de.liaison.includes(id))));
    const utilises = new Set();
    tr.forEach(t => { if (g.includes(t.vers.atome)) utilises.add(t.vers.atome); if (t.de.liaison) t.de.liaison.forEach(x => { if (g.includes(x)) utilises.add(x); }); });
    if (utilises.size > 1) { incoherent = true; return; }
    if (utilises.size === 1) {
      const u = [...utilises][0];
      if (u !== attendu) tr = tr.map(t => ({ ...t, de: t.de.liaison ? { liaison: t.de.liaison.map(x => (x === u ? attendu : x)) } : t.de, vers: { ...t.vers, atome: t.vers.atome === u ? attendu : t.vers.atome } }));
    }
  });
  return { tr, incoherent };
}
export function verifierFleches(acte, tracees0) {
  const { tr: tracees, incoherent } = normaliserTracees(acte, tracees0);
  if (incoherent) return { ok: false, messages: ['Les deux flèches doivent concerner le même atome d’hydrogène : celui qui est transféré (ils sont tous équivalents, mais il faut en choisir un seul).'] };
  const att = acte.fleches.map(cleFleche).sort(), got = tracees.map(cleFleche).sort();
  if (att.length === got.length && att.every((k, i) => k === got[i])) return { ok: true, messages: [] };
  const messages = [];
  const attDeparts = acte.fleches.map(f => cleDepart(f.de));
  for (const t of tracees) {
    const kd = cleDepart(t.de), ka = `atome:${t.vers.atome}`;
    if (att.includes(cleFleche(t))) continue;
    const perso = (acte.erreurs || []).find(([d, a]) => d === kd && a === ka);
    if (perso) { messages.push(perso[2]); continue; }
    const attendue = acte.fleches.find(f => cleDepart(f.de) === kd);
    if (attendue) messages.push('Le départ de cette flèche est bon, mais son arrivée ne l\'est pas : le doublet va vers un site pauvre en électrons (charge + ou δ+), pas vers un site déjà riche.');
    else if (acte.fleches.some(f => cleFleche(f) === `${ka}>${kd.replace(/^lp:|^liaison:.*$/, '')}`)) messages.push('Le sens de la flèche est inversé : une flèche part du doublet et pointe vers l\'atome qui le reçoit.');
    else if (!attDeparts.includes(kd)) messages.push('Cette flèche ne part pas d\'un doublet qui se déplace dans cet acte : cherche le doublet qui permet de former la nouvelle liaison, ou la liaison qui se rompt.');
  }
  const manque = acte.fleches.filter(f => !tracees.some(t => cleFleche(t) === cleFleche(f)));
  if (!messages.length && manque.length) messages.push(`Il manque ${manque.length > 1 ? 'des flèches' : 'une flèche'} : tout doublet déplacé doit avoir sa flèche.`);
  if (tracees.length > acte.fleches.length && !messages.length) messages.push('Il y a une flèche de trop : chaque flèche décrit le déplacement d\'un doublet.');
  return { ok: false, messages: [...new Set(messages)] };
}
