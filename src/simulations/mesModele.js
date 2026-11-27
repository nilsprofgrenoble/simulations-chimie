// Modèle de la simulation 319 « Mésomérie : délocaliser un doublet » (terminale STL, SPCL, Chimie et développement durable, séquence 9).
// Une espèce est un squelette fixe (atomes, liaisons) ; une écriture de Lewis = nombre de doublets non liants par atome + ordre de chaque liaison.
// Les formes mésomères se déduisent l'une de l'autre en déplaçant des doublets (jamais des atomes) :
//   type « A » : un doublet non liant de a devient liant (a–b), la liaison double b=c perd un doublet qui devient non liant sur c ;
//   type « B » : cation (a déficient en électrons) : la liaison double b=c se déplace entre a et b, la lacune passe en c.
// Charge formelle d'un atome = électrons de valence − (2 × doublets non liants + électrons des liaisons / 2 … soit nombre de liaisons + hydrogènes).
import * as M from './filtreModele.js';
export const NB = M.NB, nbf = M.nbf;
const VAL = { H: 1, C: 4, N: 5, O: 6 };

// atomes : { id, el, h (hydrogènes liés, non dessinés), lp (doublets non liants de la forme de départ), x, y } dans un cadre de 300 × 190
export const ESPECES = {
  ethanoate: { id: 'ethanoate', nom: 'l’ion éthanoate', court: 'éthanoate', formule: 'CH₃–COO⁻', charge: -1, noms: ['l’ion éthanoate CH₃COO⁻'],
    atomes: [{ id: 'm', el: 'C', h: 3, lp: 0, x: 52, y: 100 }, { id: 'c', el: 'C', h: 0, lp: 0, x: 130, y: 100 }, { id: 'o1', el: 'O', h: 0, lp: 3, x: 200, y: 52 }, { id: 'o2', el: 'O', h: 0, lp: 2, x: 200, y: 148 }],
    liaisons: [['m', 'c', 1], ['c', 'o1', 1], ['c', 'o2', 2]] },
  nitrate: { id: 'nitrate', nom: 'l’ion nitrate', court: 'nitrate', formule: 'NO₃⁻', charge: -1, noms: ['l’ion nitrate NO₃⁻'],
    atomes: [{ id: 'n', el: 'N', h: 0, lp: 0, x: 150, y: 100 }, { id: 'o1', el: 'O', h: 0, lp: 3, x: 150, y: 36 }, { id: 'o2', el: 'O', h: 0, lp: 3, x: 92, y: 140 }, { id: 'o3', el: 'O', h: 0, lp: 2, x: 208, y: 140 }],
    liaisons: [['n', 'o1', 1], ['n', 'o2', 1], ['n', 'o3', 2]] },
  carbonate: { id: 'carbonate', nom: 'l’ion carbonate', court: 'carbonate', formule: 'CO₃²⁻', charge: -2, noms: ['l’ion carbonate CO₃²⁻'],
    atomes: [{ id: 'c', el: 'C', h: 0, lp: 0, x: 150, y: 100 }, { id: 'o1', el: 'O', h: 0, lp: 3, x: 150, y: 36 }, { id: 'o2', el: 'O', h: 0, lp: 3, x: 92, y: 140 }, { id: 'o3', el: 'O', h: 0, lp: 2, x: 208, y: 140 }],
    liaisons: [['c', 'o1', 1], ['c', 'o2', 1], ['c', 'o3', 2]] },
  allyle: { id: 'allyle', nom: 'le cation allyle', court: 'allyle', formule: 'CH₂=CH–CH₂⁺', charge: 1, noms: ['le cation allyle CH₂CHCH₂⁺'],
    atomes: [{ id: 'c1', el: 'C', h: 2, lp: 0, x: 58, y: 120 }, { id: 'c2', el: 'C', h: 1, lp: 0, x: 150, y: 70 }, { id: 'c3', el: 'C', h: 2, lp: 0, x: 242, y: 120 }],
    liaisons: [['c1', 'c2', 2], ['c2', 'c3', 1]] },
  amide: { id: 'amide', nom: 'l’éthanamide', court: 'éthanamide', formule: 'CH₃–CO–NH₂', charge: 0, noms: ['l’éthanamide CH₃CONH₂'],
    atomes: [{ id: 'm', el: 'C', h: 3, lp: 0, x: 46, y: 118 }, { id: 'c', el: 'C', h: 0, lp: 0, x: 128, y: 118 }, { id: 'o', el: 'O', h: 0, lp: 2, x: 170, y: 46 }, { id: 'n', el: 'N', h: 2, lp: 1, x: 214, y: 150 }],
    liaisons: [['m', 'c', 1], ['c', 'o', 2], ['c', 'n', 1]] },
  enolate: { id: 'enolate', nom: 'l’ion énolate', court: 'énolate', formule: 'CH₂=CH–O⁻', charge: -1, noms: ['l’ion énolate CH₂CHO⁻'],
    atomes: [{ id: 'c1', el: 'C', h: 2, lp: 0, x: 56, y: 124 }, { id: 'c2', el: 'C', h: 1, lp: 0, x: 148, y: 74 }, { id: 'o', el: 'O', h: 0, lp: 3, x: 240, y: 124 }],
    liaisons: [['c1', 'c2', 2], ['c2', 'o', 1]] },
};
export const LISTE = ['ethanoate', 'nitrate', 'carbonate', 'allyle', 'amide', 'enolate'];
export const EQUIV = ['ethanoate', 'nitrate', 'carbonate', 'allyle'];   // formes mésomères équivalentes
export const INEGALES = ['amide', 'enolate'];                          // formes de poids différents

// ---------- une écriture ----------
export const formeInit = e => ({ lp: Object.fromEntries(e.atomes.map(a => [a.id, a.lp])), b: e.liaisons.map(l => l[2]) });
export const cle = f => JSON.stringify([Object.values(f.lp), f.b]);
const copie = f => ({ lp: { ...f.lp }, b: [...f.b] });
const atome = (e, id) => e.atomes.find(a => a.id === id);
const iL = (e, a, b) => e.liaisons.findIndex(l => (l[0] === a && l[1] === b) || (l[0] === b && l[1] === a));
export const ordre = (e, f, a, b) => { const i = iL(e, a, b); return i < 0 ? 0 : f.b[i]; };
const voisins = (e, id) => e.liaisons.filter(l => l[0] === id || l[1] === id).map(l => (l[0] === id ? l[1] : l[0]));
export const electronsAtome = (e, f, id) => 2 * f.lp[id] + 2 * atome(e, id).h + 2 * voisins(e, id).reduce((s, v) => s + ordre(e, f, id, v), 0);
export const electronsTotal = (e, f) => e.atomes.reduce((s, a) => s + 2 * f.lp[a.id] + 2 * a.h, 0) + 2 * f.b.reduce((s, o) => s + o, 0);
export const nbElectrons = e => e.atomes.reduce((s, a) => s + VAL[a.el] + a.h, 0) - e.charge;          // électrons de valence de l'espèce
export const charge = (e, f, id) => { const a = atome(e, id); return VAL[a.el] - 2 * f.lp[id] - a.h - voisins(e, id).reduce((s, v) => s + ordre(e, f, id, v), 0); };
export const charges = (e, f) => Object.fromEntries(e.atomes.map(a => [a.id, charge(e, f, a.id)]));

// validité d'une écriture : raison = 'electrons' (nombre total d'électrons non conservé), 'octet' (atome qui dépasse l'octet ou n'a pas son octet), 'liaison' (ordre de liaison impossible)
export function validite(e, f) {
  if (f.b.some(o => o < 1 || o > 3) || Object.values(f.lp).some(n => n < 0 || n > 4)) return { ok: false, raison: 'liaison' };
  const tot = electronsTotal(e, f);
  if (tot !== nbElectrons(e)) return { ok: false, raison: 'electrons', ecart: tot - nbElectrons(e) };
  for (const a of e.atomes) {
    const n = electronsAtome(e, f, a.id), q = charge(e, f, a.id);
    if (n > 8) return { ok: false, raison: 'octet', atome: a.id, plus: true };
    if (n < 8 && !(a.el === 'C' && n === 6 && q === 1)) return { ok: false, raison: 'octet', atome: a.id, plus: false };
  }
  return { ok: true };
}

// ---------- déplacements de doublets ----------
export function coups(e, f) {
  const res = [];
  for (const a of e.atomes) for (const b of voisins(e, a.id)) for (const c of voisins(e, b)) {
    if (c === a.id) continue;
    const oab = ordre(e, f, a.id, b), obc = ordre(e, f, b, c);
    if (obc < 2 || oab >= 2) continue;
    let type = null;
    if (f.lp[a.id] >= 1) type = 'A';
    else if (a.el === 'C' && electronsAtome(e, f, a.id) === 6 && charge(e, f, a.id) === 1 && atome(e, c).el === 'C') type = 'B';
    if (!type) continue;
    const g = copie(f); g.b[iL(e, a.id, b)] += 1; g.b[iL(e, b, c)] -= 1;
    if (type === 'A') { g.lp[a.id] -= 1; g.lp[c] += 1; }
    if (validite(e, g).ok) res.push({ type, a: a.id, b, c });
  }
  return res;
}
export function appliquer(e, f, k) {
  const g = copie(f); g.b[iL(e, k.a, k.b)] += 1; g.b[iL(e, k.b, k.c)] -= 1;
  if (k.type === 'A') { g.lp[k.a] -= 1; g.lp[k.c] += 1; }
  return g;
}
// toutes les formes mésomères (la forme de départ en premier)
export function formes(e) {
  const dep = formeInit(e), vus = new Map([[cle(dep), dep]]), file = [dep];
  while (file.length) { const f = file.shift(); for (const k of coups(e, f)) { const g = appliquer(e, f, k); if (!vus.has(cle(g))) { vus.set(cle(g), g); file.push(g); } } }
  return [...vus.values()];
}
// pénalité : moins elle est élevée, plus la forme est probable (moins de charges ; charge négative sur C ou positive sur O ou N défavorable)
export function penalite(e, f) {
  let p = 0; for (const a of e.atomes) { const q = charge(e, f, a.id); p += 10 * Math.abs(q); if (q < 0 && a.el === 'C') p += 3 * -q; if (q > 0 && (a.el === 'O' || a.el === 'N')) p += 3 * q; }
  return p;
}
export const probables = e => { const F = formes(e), m = Math.min(...F.map(f => penalite(e, f))); return F.filter(f => penalite(e, f) === m); };
export const equivalentes = e => { const F = formes(e); return F.every(f => penalite(e, f) === penalite(e, F[0])); };
// hybride de résonance (formes équivalentes seulement) : ordre moyen des liaisons et charge moyenne de chaque atome
export function hybride(e) {
  if (!equivalentes(e)) return null;
  const F = formes(e), n = F.length;
  return { b: e.liaisons.map((l, i) => F.reduce((s, f) => s + f.b[i], 0) / n), q: Object.fromEntries(e.atomes.map(a => [a.id, F.reduce((s, f) => s + charge(e, f, a.id), 0) / n])) };
}

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// écritures fausses : on modifie au hasard des liaisons ou des doublets d'une forme valide
export function fausses(e, n = 3) {
  const F = formes(e), cles = new Set(F.map(cle)), res = [], raisons = new Set();
  for (let essai = 0; essai < 600 && res.length < n; essai++) {
    const g = copie(tire(F));
    for (let k = 0, m = 1 + Math.floor(Math.random() * 2); k < m; k++) {
      if (Math.random() < 0.5) { const i = Math.floor(Math.random() * g.b.length); g.b[i] += Math.random() < 0.5 ? 1 : -1; } else { const a = tire(e.atomes).id; g.lp[a] += Math.random() < 0.5 ? 1 : -1; }
    }
    const v = validite(e, g);
    if (v.ok || v.raison === 'liaison' || cles.has(cle(g)) || res.some(r => cle(r.f) === cle(g))) continue;
    if (raisons.has(v.raison + (v.atome || '')) && essai < 300) continue;
    raisons.add(v.raison + (v.atome || '')); res.push({ f: g, v });
  }
  return res;
}
// tirage du défi « formes limites » : l'espèce, la forme donnée, des candidats (formes valides autres que celle donnée + écritures fausses)
export function tirageFormes(idEsp) {
  const e = ESPECES[idEsp || tire(['ethanoate', 'nitrate', 'carbonate', 'allyle', 'enolate', 'amide'])], F = formes(e), dep = F[0];
  const justes = F.slice(1).map(f => ({ f, juste: true })), fx = fausses(e, justes.length === 1 ? 3 : 3).map(r => ({ f: r.f, juste: false, v: r.v }));
  return { e, dep, cands: melange([...justes, ...fx]) };
}
export const diagFormes = (d, choix) => {
  const manquees = d.cands.filter(c => c.juste && !choix.includes(d.cands.indexOf(c))), fautes = choix.map(i => d.cands[i]).filter(c => !c.juste);
  return { ok: manquees.length === 0 && fautes.length === 0, manquees, fautes };
};
export const tirageProbable = () => { const e = ESPECES[tire(INEGALES)], F = formes(e), p = probables(e)[0]; return { e, formes: F, bonne: F.findIndex(f => cle(f) === cle(p)) }; };
export const motifFausse = (e, v) => v.raison === 'electrons'
  ? `Le nombre total d’électrons n’est pas conservé : ${v.ecart > 0 ? 'il y a ' + Math.abs(v.ecart) + ' électron' + (Math.abs(v.ecart) > 1 ? 's' : '') + ' de trop' : 'il manque ' + Math.abs(v.ecart) + ' électron' + (Math.abs(v.ecart) > 1 ? 's' : '')}.`
  : v.raison === 'octet' ? `L’atome ${atome(e, v.atome).el} ${v.plus ? 'dépasse l’octet (plus de 4 doublets autour de lui)' : 'n’a pas son octet'}.` : 'Une liaison est impossible.';
export const NOM_FORME = n => ['première', 'deuxième', 'troisième', 'quatrième'][n] || `${n + 1}e`;

// défi « hybride » : ordre moyen d'une liaison ou charge moyenne d'un atome, à partir des formes équivalentes
export const DEF_HYB = {
  ethanoate: { lien: 'C–O', li: 1, atome: 'un atome d’oxygène', ai: 'o1' },
  nitrate: { lien: 'N–O', li: 0, atome: 'un atome d’oxygène', ai: 'o1' },
  carbonate: { lien: 'C–O', li: 0, atome: 'un atome d’oxygène', ai: 'o1' },
  allyle: { lien: 'C–C', li: 0, atome: 'un des carbones terminaux', ai: 'c1' },
};
export function tirageHybride() {
  const id = tire(EQUIV), e = ESPECES[id], hy = hybride(e), F = formes(e), d = DEF_HYB[id], genre = Math.random() < 0.5 ? 'ordre' : 'charge';
  const detail = genre === 'ordre' ? F.map(f => f.b[d.li]) : F.map(f => charge(e, f, d.ai));
  const vrai = genre === 'ordre' ? hy.b[d.li] : hy.q[d.ai];
  return { e, genre, vrai, detail, lien: d.lien, atome: d.atome, tot: e.charge };
}
export function diagHybride(d, v) {
  if (!Number.isFinite(v)) return { ok: false, msg: 'Saisissez un nombre (par exemple 1,5 ou −0,5, ou une fraction comme −2/3).' };
  if (Math.abs(v - d.vrai) <= 0.05) return { ok: true };
  if (d.genre === 'charge') {
    if (v > 0 && d.vrai < 0 || v < 0 && d.vrai > 0) return { ok: false, msg: 'Le signe est à revoir : regardez la charge de l’atome dans chaque écriture (− pour un oxygène chargé négativement).' };
    if (Math.abs(v - d.tot) < 0.05) return { ok: false, msg: 'Vous avez mis toute la charge de l’espèce sur un seul atome : dans l’hybride, elle est répartie. Faites la moyenne des charges de cet atome sur toutes les écritures.' };
    if (Math.abs(v) < 0.05 || Math.abs(v - Math.round(v)) < 0.05) return { ok: false, msg: 'Ce n’est pas une moyenne : additionnez les charges de cet atome dans toutes les écritures, puis divisez par leur nombre.' };
  } else if (Math.abs(v - Math.round(v)) < 0.05) return { ok: false, msg: 'Vous avez donné l’ordre de la liaison dans une seule écriture (1 ou 2). L’ordre moyen se calcule sur toutes les écritures : additionnez, puis divisez par leur nombre.' };
  return { ok: false, msg: `Votre valeur (${nbf(v, 2)}) ne correspond pas à la moyenne sur toutes les écritures. Additionnez ${d.genre === 'ordre' ? 'les ordres de la liaison ' + d.lien : 'les charges de cet atome'} dans chaque écriture, puis divisez par le nombre d’écritures.` };
}
