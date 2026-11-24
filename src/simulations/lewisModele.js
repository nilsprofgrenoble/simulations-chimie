// ====================================================
//  SIM 154 (1G) — SCHÉMA DE LEWIS : ÉTABLIR CELUI D'UNE MOLÉCULE OU D'UN ION (logique pure, sans React)
//  Hypothèses de travail (à lire dans le panneau « Hypothèses » de la simulation) :
//   • modèle de Lewis : seuls les électrons de valence sont représentés ; règle de l'octet (8 électrons autour d'un atome) et règle du duet (2 pour H) ;
//   • le squelette est donné : l'atome central (en premier dans la formule) est lié à tous les autres atomes ; les liaisons sont simples, doubles ou triples ;
//   • nombre total d'électrons de valence n_T = somme des électrons de valence des atomes seuls − charge de l'entité ; n_D = n_T / 2 doublets ;
//   • charge portée par un atome = (électrons de valence de l'atome seul) − (électrons qu'il possède dans l'entité), ces derniers valant
//     (nombre de liaisons) + 2 × (nombre de doublets non liants) : un électron par liaison, les deux de chaque doublet non liant ;
//   • lacune électronique : un doublet manque autour d'un atome (H⁺ ; AlCl₃ hors programme) ;
//   • Na⁺ : n_T = 0, sa couche externe (n = 2) est déjà saturée à 8 électrons, on ne dessine rien autour ;
//   • le schéma est une écriture, pas une photographie : il ne dit rien des angles ni de la forme de l'entité (géométrie : autre étude).
//  Octets étendus, radicaux (nombre impair d'électrons) et formes mésomères : hors programme, non traités.
// ====================================================
import { elementDeSym, valence } from './atomesModele.js';

const SUPS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
// Charge portée par un atome sur le schéma : « + », « − », « 2− »
export const chargeSigne = q => (q === 0 ? '' : `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}`);

// atomes : symboles ; l'atome 0 est l'atome central (pour une entité diatomique, l'un des deux).
// liens : ordre de la liaison entre l'atome 0 et l'atome i (liens[0] inutilisé). lacune : indices d'atomes ; interne : atome dont la couche externe est déjà saturée.
const E = (id, formule, nom, atomes, q, liens, extra = {}) => ({ id, formule, nom, atomes, q, liens: [0, ...liens], lacune: [], interne: [], ...extra });
export const ENTITES = [
  E('O2', 'O₂', 'dioxygène', ['O', 'O'], 0, [2]),
  E('H2', 'H₂', 'dihydrogène', ['H', 'H'], 0, [1]),
  E('N2', 'N₂', 'diazote', ['N', 'N'], 0, [3]),
  E('H2O', 'H₂O', 'eau', ['O', 'H', 'H'], 0, [1, 1]),
  E('CO2', 'CO₂', 'dioxyde de carbone', ['C', 'O', 'O'], 0, [2, 2]),
  E('NH3', 'NH₃', 'ammoniac', ['N', 'H', 'H', 'H'], 0, [1, 1, 1]),
  E('CH4', 'CH₄', 'méthane', ['C', 'H', 'H', 'H', 'H'], 0, [1, 1, 1, 1]),
  E('HCl', 'HCl', 'chlorure d’hydrogène', ['H', 'Cl'], 0, [1]),
  E('Hp', 'H⁺', 'ion hydrogène', ['H'], 1, [], { lacune: [0] }),
  E('H3Op', 'H₃O⁺', 'ion oxonium', ['O', 'H', 'H', 'H'], 1, [1, 1, 1]),
  E('Nap', 'Na⁺', 'ion sodium', ['Na'], 1, [], { interne: [0] }),
  E('NH4p', 'NH₄⁺', 'ion ammonium', ['N', 'H', 'H', 'H', 'H'], 1, [1, 1, 1, 1]),
  E('Clm', 'Cl⁻', 'ion chlorure', ['Cl'], -1, []),
  E('HOm', 'HO⁻', 'ion hydroxyde', ['H', 'O'], -1, [1]),
  E('O2m', 'O²⁻', 'ion oxyde', ['O'], -2, []),
  // au-delà du programme de 1re (défi seulement)
  E('O3', 'O₃', 'ozone', ['O', 'O', 'O'], 0, [2, 1], { horsProgramme: true }),
  E('AlCl3', 'AlCl₃', 'chlorure d’aluminium', ['Al', 'Cl', 'Cl', 'Cl'], 0, [1, 1, 1], { horsProgramme: true, lacune: [0] }),
  E('HCN', 'HCN', 'cyanure d’hydrogène', ['C', 'H', 'N'], 0, [1, 3], { horsProgramme: true }),
];
export const entite = id => ENTITES.find(e => e.id === id);
export const ENTITES_PROGRAMME = ENTITES.filter(e => !e.horsProgramme);
export const ENTITES_HORS = ENTITES.filter(e => e.horsProgramme);

// ---------- comptages ----------
export const valenceAtome = sym => valence(elementDeSym(sym).Z);
export const ZAtome = sym => elementDeSym(sym).Z;
export const cible = (ent, i) => (ent.atomes[i] === 'H' ? 2 : 8);
// électrons de valence de chaque atome seul, somme, puis n_T et n_D
export const valencesDe = ent => ent.atomes.map(valenceAtome);
export const nT = ent => valencesDe(ent).reduce((a, b) => a + b, 0) - ent.q;
export const nD = ent => nT(ent) / 2;

// ---------- structure d'un élève ----------
// { liens: [_, o1, o2, …], lp: [par atome], ch: [charge par atome], lac: [booléen par atome] }
export const structureVide = ent => ({ liens: ent.atomes.map(() => 0), lp: ent.atomes.map(() => 0), ch: ent.atomes.map(() => 0), lac: ent.atomes.map(() => false) });
export const liaisonsAtome = (st, i) => (i === 0 ? st.liens.slice(1).reduce((a, b) => a + b, 0) : st.liens[i] || 0);
export const doubletsPlaces = st => st.liens.slice(1).reduce((a, b) => a + b, 0) + st.lp.reduce((a, b) => a + b, 0);
// électrons autour d'un atome (pour l'octet) : 2 par liaison, 2 par doublet non liant
export const autour = (st, i) => 2 * liaisonsAtome(st, i) + 2 * st.lp[i];
// électrons que l'atome possède dans l'entité (pour la charge) : 1 par liaison, 2 par doublet non liant
export const possedes = (st, i) => liaisonsAtome(st, i) + 2 * st.lp[i];
export const chargeFormelle = (ent, st, i) => valenceAtome(ent.atomes[i]) - possedes(st, i);

// Structure de référence : doublets non liants complétant l'octet (ou le duet), lacunes indiquées, charges déduites
export function structureRef(ent) {
  const st = structureVide(ent);
  st.liens = [...ent.liens];
  ent.atomes.forEach((_, i) => {
    if (ent.interne.includes(i)) return;
    const manque = cible(ent, i) - autour(st, i) - (ent.lacune.includes(i) ? 2 : 0);
    st.lp[i] = Math.max(0, manque / 2);
    st.lac[i] = ent.lacune.includes(i);
  });
  ent.atomes.forEach((_, i) => { st.ch[i] = chargeFormelle(ent, st, i); });
  return st;
}

// Signature d'un atome (pour comparer deux schémas à l'échange près d'atomes identiques liés au centre)
const sig = (ent, st, i) => `${ent.atomes[i]}|${liaisonsAtome(st, i)}|${st.lp[i]}|${st.ch[i]}|${st.lac[i] ? 1 : 0}`;
export function memeSchema(ent, a, b) {
  const n = ent.atomes.length;
  if (n <= 2) return Array.from({ length: n }, (_, i) => sig(ent, a, i)).join(';') === Array.from({ length: n }, (_, i) => sig(ent, b, i)).join(';');
  const terms = (st) => Array.from({ length: n - 1 }, (_, k) => `${sig(ent, st, k + 1)}|${st.liens[k + 1]}`).sort().join(';');
  return sig(ent, a, 0) === sig(ent, b, 0) && terms(a) === terms(b);
}

// Vérification d'un schéma d'élève. Renvoie { ok, par: [...par atome], messages: [{ atome, txt }] }.
// Les messages disent ce qui ne va pas, jamais la réponse.
export function verifier(ent, st, opts = {}) {
  const n = ent.atomes.length, ref = structureRef(ent), messages = [];
  const par = ent.atomes.map((sym, i) => {
    const ex = ent.interne.includes(i), cb = cible(ent, i), au = autour(st, i);
    return { sym, i, exempt: ex, cible: cb, autour: au, liaisons: liaisonsAtome(st, i), lp: st.lp[i], formelle: chargeFormelle(ent, st, i), charge: st.ch[i],
      plein: ex || au === cb, lacuneOk: au === cb - 2 && st.lac[i] };
  });
  const placés = doubletsPlaces(st), total = nD(ent);
  // 1. aucune liaison alors qu'il en faut
  if (n > 1) { const i = ent.atomes.findIndex((_, k) => k > 0 && st.liens[k] === 0); if (i > 0) messages.push({ atome: i, txt: `Un atome ${ent.atomes[i]} n’est relié à rien : chaque atome doit être lié ${n === 2 ? 'à l’autre atome' : 'à l’atome central'}.` }); }
  // 2. nombre de doublets
  // opts.sansNombres : on ne donne pas le total n_D (étapes où l'élève doit le trouver lui-même)
  if (placés > total) messages.push({ atome: null, txt: opts.sansNombres ? 'Tu as placé trop de doublets : retire-en.' : `Tu as placé ${placés} doublets, mais il n’y en a que ${total} à répartir : il y en a trop.` });
  else if (placés < total) messages.push({ atome: null, txt: opts.sansNombres ? 'Il reste des doublets à placer.' : `Tu as placé ${placés} doublets sur ${total} : il en reste ${total - placés} à placer.` });
  // 3. octet / duet
  par.forEach(a => {
    if (a.exempt) {
      if (st.lac[a.i]) messages.push({ atome: a.i, txt: `Autour de ${a.sym}${ent.q ? (ent.q > 0 ? '⁺' : '⁻') : ''} la couche externe est déjà pleine : pas de lacune.` });
      return;
    }
    if (a.autour > a.cible) messages.push({ atome: a.i, txt: `Trop d’électrons autour de ${a.sym} : ${a.autour} au lieu de ${a.cible}.` });
    else if (a.autour < a.cible && !a.lacuneOk) {
      const m = a.cible - a.autour;
      messages.push({ atome: a.i, txt: `Il manque ${m} électron${m > 1 ? 's' : ''} autour de ${a.sym} pour ${a.sym === 'H' ? 'le duet' : 'l’octet'}${m === 2 && ent.lacune.includes(a.i) && !st.lac[a.i] && opts.indiceLacune !== false ? ' : un doublet manque, c’est une lacune électronique (rectangle vide)' : ''}.` });
    }
    if (st.lac[a.i] && a.autour !== a.cible - 2) messages.push({ atome: a.i, txt: `Le rectangle vide (lacune) ne se met que s’il manque exactement un doublet autour de ${a.sym}.` });
  });
  // 4. charges
  par.forEach(a => { if (a.charge !== a.formelle && messages.length === 0) messages.push({ atome: a.i, txt: `La charge de l’atome ${a.sym} n’est pas la bonne : compare ses électrons de valence quand il est seul et les électrons qu’il possède dans l’entité (liaisons + 2 × doublets non liants).` }); });
  // 5. schéma correct mais pas le bon
  const ok = messages.length === 0 && memeSchema(ent, st, ref);
  if (!ok && messages.length === 0) messages.push({ atome: null, txt: 'Ce schéma respecte l’octet, mais un autre répartit mieux les doublets : cherche celui où il y a le moins de charges.' });
  return { ok, par, messages, placés, total };
}

// ---------- énumération indépendante (sert aux tests et à vérifier l'unicité du schéma de référence) ----------
// Toutes les structures (liens 0..3, doublets non liants 0..4) qui placent exactement n_D doublets, où chaque atome (hors « interne ») a 8 électrons autour (2 pour H),
// ou 2 de moins s'il porte une lacune ; on garde celles de plus petite somme des |charges|, puis de moins de lacunes.
export function enumerer(ent) {
  const n = ent.atomes.length, total = nD(ent), sols = [];
  const rec = (k, liens) => {
    if (k === n) {
      const st = { ...structureVide(ent), liens: [0, ...liens] };
      const choix = i => {
        if (i === n) { if (doubletsPlaces(st) === total) sols.push(JSON.parse(JSON.stringify(st))); return; }
        if (ent.interne.includes(i)) { st.lp[i] = 0; choix(i + 1); return; }
        for (let lp = 0; lp <= 4; lp++) {
          st.lp[i] = lp; const au = autour(st, i), cb = cible(ent, i);
          if (au === cb) { st.lac[i] = false; choix(i + 1); }
          else if (au === cb - 2) { st.lac[i] = true; choix(i + 1); }
        }
        st.lp[i] = 0; st.lac[i] = false;
      };
      choix(0); return;
    }
    for (let o = (n > 1 ? 1 : 0); o <= 3; o++) rec(k + 1, [...liens, o]);
  };
  rec(1, []);
  sols.forEach(s => { s.ch = ent.atomes.map((_, i) => chargeFormelle(ent, s, i)); });
  const note = s => [s.ch.reduce((a, c) => a + Math.abs(c), 0), s.lac.filter(Boolean).length];
  const meilleur = sols.reduce((m, s) => { const x = note(s); return !m || x[0] < m[0] || (x[0] === m[0] && x[1] < m[1]) ? x : m; }, null);
  return { toutes: sols, retenues: meilleur ? sols.filter(s => { const x = note(s); return x[0] === meilleur[0] && x[1] === meilleur[1]; }) : [] };
}
