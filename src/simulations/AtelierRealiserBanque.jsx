import { Frac, avecIndices, lireNombre, nbCS } from "../commun";
import { Chaine, ConvPrefixe, facteurK, analyser } from "./DebitsFluides";
import { FigureVecteurs, Vec } from "./FigureVecteurs";
import { genTrace, genPont, genTemps } from "./RealiserC1";
import { ACIDES as AAM, ORDRE as AAM_ORDRE } from "./aminoAcidesModele";
import { METAUX as PILE_M, PAIRES as PILE_PAIRES, poles as pilePoles, equationTexte as pileEquation, demiRed as pileRed, demiOx as pileOx } from "./pileModele";

// ====================================================
//  BANQUE DE L'ATELIER « RÉALISER » (compétence S'APP : réaliser)
//  Chaque famille fabrique un exercice au hasard : { intro, questions: [...], retenir }.
//  Question : { id, type: 'qcm' | 'num', q, options?, bonne?, vrai?, tolRel?, unite?, csMin?, csExact?, aide, expl, pieges? }
// ====================================================

const NB = ' ';                                       // espace insécable
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = n => String(n).split('').map(c => SUP[c] ?? c).join('');
export const p10 = e => `10${sup(e)}`;

const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const alea = (min, max, cs = 3) => Number((min + Math.random() * (max - min)).toPrecision(cs));

// Nombre écrit à la française avec cs chiffres significatifs (notation scientifique hors de [10⁻³ ; 10⁶[)
export function nb(x, cs = 3) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const r = Number(x.toPrecision(cs));
  const e = Math.floor(Math.log10(Math.abs(r)));
  if (e < -3 || e > 5) return `${(r / Math.pow(10, e)).toFixed(cs - 1).replace('.', ',')}${NB}×${NB}10${sup(e)}`;
  const d = Math.max(0, cs - 1 - e);
  return r.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
}
// Correction d'un changement d'unité : fractions égales à 1, unités qui se simplifient (barrées), couleurs — comme dans « Débits massique et volumique »
const sciAuto = x => Math.abs(x) < 1e-3 || Math.abs(x) >= 1e6;
const Ch = ({ facteurs, cs = 3, nom }) => <Chaine nom={nom} facteurs={facteurs} nsf={cs} sci={sciAuto(analyser(facteurs).valeur)}/>;
const nombre = (n, u, cs) => ({ n, s: nb(n, cs), u });          // nombre écrit avec ses chiffres significatifs
const avecU = (x, u, cs = 3) => `${nb(x, cs)}${NB}${u}`;
// Valeur décimale à 'cs' chiffres significatifs, telle qu'on la lit dans un énoncé
const csDe = x => nbCS(String(x).replace('.', ','));

// Vérification d'une réponse numérique : { ok, msg }
export function verifier(q, rep) {
  const x = lireNombre(rep);
  if (!isFinite(x)) return { ok: false, msg: 'Entrez une valeur numérique (virgule ou point ; 1,5e-3 ou 1,5 × 10^-3 pour une puissance de 10).' };
  const bon = Math.abs(x - q.vrai) <= Math.abs(q.vrai) * (q.tolRel ?? 0.006) + 1e-12 * Math.abs(q.vrai);
  if (bon) {
    // un entier terminé par des zéros (« 1800 ») a un nombre de chiffres significatifs ambigu : on ne l’exige pas
    const arr = Number(q.vrai.toPrecision(q.csExact || q.csMin || 3)), ambigu = Number.isInteger(arr) && Math.abs(arr) >= 10 && arr % 10 === 0;
    if (ambigu) return { ok: true, msg: '' };
    if (q.csExact && nbCS(rep) !== q.csExact) return { ok: false, msg: `La valeur est juste, mais il faut l’écrire avec exactement ${q.csExact} chiffres significatifs (vous en avez écrit ${nbCS(rep)}).` };
    const dernier = q.csMin ? q.vrai.toPrecision(q.csMin).replace(/e.*/, '').replace(/[.-]/g, '').slice(-1) : '';
    if (q.csMin && dernier !== '0' && nbCS(rep) < q.csMin) return { ok: false, msg: `La valeur est juste, mais arrondie trop tôt : gardez au moins ${q.csMin} chiffres significatifs (vous en avez écrit ${nbCS(rep)}).` };
    return { ok: true, msg: '' };
  }
  const pg = (q.pieges || []).find(([v]) => Math.abs(x - v) <= Math.abs(v) * 0.01 + 1e-12);
  if (pg) return { ok: false, msg: pg[1] };
  if (q.vrai && x !== 0) {
    const r = Math.log10(Math.abs(x / q.vrai));
    if (Math.abs(r - Math.round(r)) < 0.02 && Math.round(r) !== 0) return { ok: false, msg: `Problème de puissance de 10 (facteur 10${sup(Math.round(r))} d’écart) : vérifiez les préfixes et les exposants.` };
    if (Math.abs(x / q.vrai - 60) < 1 || Math.abs(x / q.vrai - 1 / 60) < 0.001) return { ok: false, msg: 'Facteur 60 : minutes et secondes ?' };
    if (Math.abs(x / q.vrai - 3600) < 20 || Math.abs(x / q.vrai - 1 / 3600) < 0.0001) return { ok: false, msg: 'Facteur 3600 : heures et secondes ?' };
  }
  return { ok: false, msg: '' };
}
export const reponseAttendue = q => `${nb(q.vrai, q.csMin || q.csExact || 3)}${q.unite ? NB + q.unite : ''}`;

// ──────────────────────── Famille 1 : changement d'unité simple ────────────────────────
const SIMPLES = [
  { de: 'min', vers: 's', k: 60, v: () => tire([3, 12, 45, 2.5, 7.5]), rel: '1 min = 60 s' },
  { de: 'h', vers: 's', k: 3600, v: () => tire([2, 0.5, 1.5, 0.25, 4]), rel: '1 h = 3600 s' },
  { de: 's', vers: 'min', k: 1 / 60, v: () => tire([90, 150, 300, 45, 720]), rel: '1 min = 60 s, donc 1 s = 1/60 min' },
  { de: 'h', vers: 'min', k: 60, v: () => tire([2.4, 0.75, 3.2, 1.8, 0.2]), rel: '1 h = 60 min' },
  { de: 'km', vers: 'm', k: 1e3, v: () => tire([2.5, 0.35, 12, 0.08, 4.2]), rel: '1 km = 1000 m' },
  { de: 'cm', vers: 'm', k: 1e-2, v: () => tire([45, 8.5, 120, 2.4, 63]), rel: '1 cm = 10⁻² m' },
  { de: 'mm', vers: 'cm', k: 0.1, v: () => tire([45, 8.5, 120, 2.4, 63]), rel: '1 mm = 0,1 cm' },
  { de: 'kPa', vers: 'Pa', k: 1e3, v: () => tire([101.3, 2.5, 150, 35, 7.8]), rel: '1 kPa = 1000 Pa' },
  { de: 'hPa', vers: 'Pa', k: 100, v: () => tire([1013, 980, 25, 1.5, 450]), rel: '1 hPa = 100 Pa' },
  { de: 'bar', vers: 'Pa', k: 1e5, v: () => tire([1.5, 2.2, 0.8, 6, 3.2]), rel: '1 bar = 10⁵ Pa' },
  { de: 'bar', vers: 'hPa', k: 1e3, v: () => tire([1.5, 2.2, 0.8, 6, 3.2]), rel: '1 bar = 10⁵ Pa = 1000 hPa' },
  { de: 'g', vers: 'kg', k: 1e-3, v: () => tire([250, 45, 1800, 12.5, 730]), rel: '1 g = 10⁻³ kg' },
  { de: 't', vers: 'kg', k: 1e3, v: () => tire([2.5, 0.35, 12, 0.08]), rel: '1 t = 1000 kg' },
  { de: 'mL', vers: 'L', k: 1e-3, v: () => tire([250, 45, 1800, 12.5, 730]), rel: '1 mL = 10⁻³ L' },
  { de: 'kW', vers: 'W', k: 1e3, v: () => tire([2.5, 0.35, 12, 1.2, 4.8]), rel: '1 kW = 1000 W' },
  { de: 'mA', vers: 'A', k: 1e-3, v: () => tire([25, 4.5, 120, 350, 8]), rel: '1 mA = 10⁻³ A' },
];
function qSimple(it, id) {
  const v = it.v(), vrai = v * it.k;
  return { id, type: 'num', q: <>Convertissez <b>{avecU(v, it.de, csDe(v))}</b> en {it.vers}.</>, unite: it.vers, vrai, tolRel: 0.006, csMin: csDe(v),
    aide: `Écrivez la relation entre les deux unités : ${it.rel}.`,
    expl: <>{it.rel}.<Ch cs={Math.max(csDe(v), 2)} facteurs={[{ num: [nombre(v, it.de, csDe(v))], den: [] }, facteurK(it.de, it.vers, it.k, 'num')]}/></> };
}
function genSimple() {
  const items = melange(SIMPLES).slice(0, 3);
  const qs = items.map((it, i) => qSimple(it, 's' + i));
  // une conversion de durée en décimal / sexagésimal et une température
  const spec = tire([
    () => { const h = tire([1, 2, 3]), m = tire([15, 30, 45, 12, 20]); const v = h + m / 60;
      return { id: 'sp', type: 'num', q: <>Une opération dure <b>{h} h {m} min</b>. Exprimez cette durée en heures (nombre décimal).</>, unite: 'h', vrai: v, tolRel: 0.004,
        aide: 'Les minutes se convertissent en fraction d’heure : 1 min = 1/60 h. Attention : 1 h 30 min n’est pas 1,30 h.',
        expl: <>1 h = 60 min.<Ch facteurs={[{ num: [nombre(m, 'min', 2)], den: [] }, facteurK('min', 'h', 1 / 60, 'num')]}/>Durée : {h} h + {nb(m / 60, 3)} h = <b>{nb(v, 3)} h</b>. (1 h 30 min = 1,5 h, pas 1,30 h.)</>,
        pieges: [[h + m / 100, 'Les minutes ne sont pas des centièmes d’heure : 1 h = 60 min, pas 100 min.']] }; },
    () => { const t = tire([15, 20, 25, 37, 80, 100]); return { id: 'sp', type: 'num', q: <>Une température vaut <b>{t} °C</b>. Exprimez-la en kelvins.</>, unite: 'K', vrai: t + 273.15, tolRel: 0.0005,
      aide: 'La conversion entre °C et K est un décalage (une addition), pas une multiplication.', expl: <>T(K) = θ(°C) + 273,15 = {t} + 273,15 = <b>{nb(t + 273.15, 4)} K</b>.</> }; },
  ])();
  return { intro: 'Changements d’unité simples : une seule relation à connaître entre les deux unités.', questions: [...qs.slice(0, 2), spec],
    retenir: ['Écrire la relation entre les deux unités (1 km = 1000 m) avant de calculer.', 'Une unité plus grande donne un nombre plus petit : 2,5 km = 2500 m.', '1 h = 60 min = 3600 s ; °C → K : on ajoute 273,15.'] };
}

// ──────────────────────── Famille 2 : préfixes et puissances de 10 ────────────────────────
const PREFIXES = [['G', 9], ['M', 6], ['k', 3], ['h', 2], ['m', -3], ['µ', -6], ['n', -9], ['p', -12]];
const GRANDEURS = ['m', 'Pa', 'F', 'A', 'W', 'V', 'Hz', 'L', 'Ω', 'J'];
function genPrefixes() {
  const [pf, e] = tire(PREFIXES), g = tire(GRANDEURS);
  const pool = [...new Set([-e, e + 3, e - 3, 3, -3, 6, -6, 9].filter(x => x !== e && x !== 0))];
  const choix = [e, ...melange(pool).slice(0, 2)];
  const opts = melange(choix);
  const q1 = { id: 'p0', type: 'qcm', q: <>1 {pf}{g} = … {g}. Quelle puissance de 10 ?</>, options: opts.map(x => `10${sup(x)}`), bonne: opts.indexOf(e),
    aide: 'Le préfixe est un multiplicateur : k = 10³, m = 10⁻³, µ = 10⁻⁶, n = 10⁻⁹.', expl: <>Le préfixe « {pf} » vaut 10{sup(e)}.<ConvPrefixe n={1} de={pf + g} vers={g} e={e} nsf={1} sci={sciAuto(Math.pow(10, e))}/></> };
  const [pf2, e2] = tire(PREFIXES.filter(p => p[0] !== pf && p[0] !== 'h'));
  const v = alea(1, 99, 2), vrai = v * Math.pow(10, e);
  const q2 = { id: 'p1', type: 'num', q: <>Exprimez <b>{avecU(v, pf + g, 2)}</b> en {g} (écrivez le résultat en notation scientifique si c’est plus pratique).</>, unite: g, vrai, csMin: 2,
    aide: `1 ${pf}${g} = ${p10(e)} ${g}. Multipliez le nombre par cette puissance de 10.`, expl: <><ConvPrefixe n={v} de={pf + g} vers={g} e={e} nsf={2} sci={sciAuto(vrai)}/></> };
  const w = alea(1, 99, 2) * Math.pow(10, tire([-3, -2, -1, 0])), vrai3 = w / Math.pow(10, e2);
  const q3 = { id: 'p2', type: 'num', q: <>Exprimez <b>{avecU(w, g, 2)}</b> en {pf2}{g}.</>, unite: pf2 + g, vrai: vrai3, csMin: 2,
    aide: `1 ${pf2}${g} = ${p10(e2)} ${g}, donc 1 ${g} = ${p10(-e2)} ${pf2}${g}.`, expl: <>1 {pf2}{g} = 10{sup(e2)} {g}, donc 1 {g} = 10{sup(-e2)} {pf2}{g}.<ConvPrefixe n={w} de={g} vers={pf2 + g} e={-e2} nsf={2} sci={sciAuto(vrai3)}/></> };
  return { intro: 'Préfixes du Système International et puissances de 10.', questions: [q1, q2, q3],
    retenir: ['G = 10⁹ ; M = 10⁶ ; k = 10³ ; m = 10⁻³ ; µ = 10⁻⁶ ; n = 10⁻⁹ ; p = 10⁻¹².', 'Le préfixe est un multiplicateur : 3,5 mA = 3,5 × 10⁻³ A.', 'Passer à une unité plus petite : le nombre augmente.'] };
}

// ──────────────────────── Famille 3 : unités élevées à une puissance ────────────────────────
const PUISS = [
  { de: 'cm²', vers: 'm²', k: 1e-4, base: '(10⁻² m)²', rel: '1 cm = 10⁻² m, donc 1 cm² = (10⁻² m)² = 10⁻⁴ m²', faux: [-2, -1, -6] },
  { de: 'mm²', vers: 'm²', k: 1e-6, base: '(10⁻³ m)²', rel: '1 mm = 10⁻³ m, donc 1 mm² = (10⁻³ m)² = 10⁻⁶ m²', faux: [-3, -9, -4] },
  { de: 'm²', vers: 'cm²', k: 1e4, base: '(10² cm)²', rel: '1 m = 10² cm, donc 1 m² = (10² cm)² = 10⁴ cm²', faux: [2, 3, 6] },
  { de: 'cm³', vers: 'm³', k: 1e-6, base: '(10⁻² m)³', rel: '1 cm = 10⁻² m, donc 1 cm³ = (10⁻² m)³ = 10⁻⁶ m³', faux: [-2, -3, -9] },
  { de: 'mm³', vers: 'm³', k: 1e-9, base: '(10⁻³ m)³', rel: '1 mm = 10⁻³ m, donc 1 mm³ = (10⁻³ m)³ = 10⁻⁹ m³', faux: [-3, -6, -12] },
  { de: 'dm³', vers: 'm³', k: 1e-3, base: '(10⁻¹ m)³', rel: '1 dm = 10⁻¹ m, donc 1 dm³ = (10⁻¹ m)³ = 10⁻³ m³ (c’est aussi 1 L)', faux: [-1, -2, -6] },
  { de: 'L', vers: 'm³', k: 1e-3, base: '1 L = 1 dm³', rel: '1 L = 1 dm³ = 10⁻³ m³', faux: [-1, -2, -6] },
  { de: 'mL', vers: 'm³', k: 1e-6, base: '1 mL = 1 cm³', rel: '1 mL = 1 cm³ = 10⁻⁶ m³', faux: [-3, -9, -4] },
  { de: 'km²', vers: 'm²', k: 1e6, base: '(10³ m)²', rel: '1 km = 10³ m, donc 1 km² = (10³ m)² = 10⁶ m²', faux: [3, 9, 4] },
];
function genPuissances() {
  const it = tire(PUISS), e = Math.round(Math.log10(it.k));
  const opts = melange([e, ...it.faux.slice(0, 2)].filter((x, i, a) => a.indexOf(x) === i));
  const q1 = { id: 'w0', type: 'qcm', q: <>1 {it.de} = … {it.vers}. Quel facteur ?</>, options: opts.map(x => `10${sup(x)}`), bonne: opts.indexOf(e),
    aide: 'Quand l’unité est au carré (ou au cube), le facteur de conversion est lui aussi mis au carré (ou au cube).', expl: <>{it.rel}.</> };
  const it2 = tire(PUISS.filter(p => p.de !== it.de)), v = alea(1, 950, 3), vrai2 = v * it2.k;
  const q2 = { id: 'w1', type: 'num', q: <>Exprimez <b>{avecU(v, it2.de)}</b> en {it2.vers}.</>, unite: it2.vers, vrai: vrai2, csMin: 3,
    aide: it2.rel, expl: <>{it2.rel}.<Ch facteurs={[{ num: [nombre(v, it2.de, 3)], den: [] }, facteurK(it2.de, it2.vers, it2.k, 'num')]}/></> };
  const d = tire([8, 10, 12, 16, 20, 25, 32, 40, 50]), S = Math.PI * Math.pow(d * 1e-3, 2) / 4;
  const q3 = { id: 'w2', type: 'num', q: <>Un tuyau a un diamètre intérieur d = <b>{d}{NB}mm</b>. Calculez sa section S = π × d² / 4 en <b>m²</b>.</>, unite: 'm²', vrai: S, csMin: 3,
    aide: 'Convertissez d en mètres AVANT de l’élever au carré : d = … × 10⁻³ m.',
    pieges: [[Math.PI * d * d / 4 * 1e-3, 'Vous avez converti après avoir élevé au carré : 1 mm² = 10⁻⁶ m², pas 10⁻³ m².']],
    expl: <>D’abord d en mètres :<Ch cs={2} nom="d" facteurs={[{ num: [nombre(d, 'mm', 2)], den: [] }, facteurK('mm', 'm', 1e-3, 'num')]}/>Puis S = π × d² / 4 = π × <Frac haut={`(${nb(d * 1e-3, 2)} m)²`} bas="4"/> = <b>{avecU(S, 'm²')}</b>. (En mm² : S = {nb(Math.PI * d * d / 4)} mm², et 1 mm² = 10⁻⁶ m².)</> };
  return { intro: 'Unités au carré ou au cube : la puissance s’applique aussi au facteur de conversion.', questions: [q1, q2, q3],
    retenir: ['1 cm² = (10⁻² m)² = 10⁻⁴ m² ; 1 mm² = 10⁻⁶ m².', '1 L = 1 dm³ = 10⁻³ m³ ; 1 mL = 1 cm³ = 10⁻⁶ m³.', 'Convertir les longueurs en m avant de calculer une aire ou un volume.'] };
}

// ──────────────────────── Famille 4 : unités composées ────────────────────────
// num/den : [[unité de départ, unité d'arrivée, k]] avec 1 unité de départ = k unités d'arrivée
const COMPOSEES = [
  { de: 'L·h⁻¹', vers: 'm³·s⁻¹', num: [['L', 'm³', 1e-3]], den: [['h', 's', 3600]], v: () => alea(100, 2000, 3) },
  { de: 'L·min⁻¹', vers: 'm³·s⁻¹', num: [['L', 'm³', 1e-3]], den: [['min', 's', 60]], v: () => alea(5, 150, 3) },
  { de: 'm³·h⁻¹', vers: 'L·s⁻¹', num: [['m³', 'L', 1e3]], den: [['h', 's', 3600]], v: () => alea(1, 40, 3) },
  { de: 'km·h⁻¹', vers: 'm·s⁻¹', num: [['km', 'm', 1e3]], den: [['h', 's', 3600]], v: () => alea(10, 130, 3) },
  { de: 'kg·h⁻¹', vers: 'kg·s⁻¹', num: [], fixeN: ['kg'], den: [['h', 's', 3600]], v: () => alea(50, 900, 3) },
  { de: 'g·cm⁻³', vers: 'kg·m⁻³', num: [['g', 'kg', 1e-3]], den: [['cm³', 'm³', 1e-6]], v: () => alea(0.6, 1.9, 3) },
  { de: 'g·mL⁻¹', vers: 'kg·m⁻³', num: [['g', 'kg', 1e-3]], den: [['mL', 'm³', 1e-6]], v: () => alea(0.6, 1.9, 3) },
  { de: 'mg·L⁻¹', vers: 'kg·m⁻³', num: [['mg', 'kg', 1e-6]], den: [['L', 'm³', 1e-3]], v: () => alea(5, 80, 2) },
  { de: 'J·g⁻¹·K⁻¹', vers: 'J·kg⁻¹·K⁻¹', num: [], fixeN: ['J'], fixeD: ['K'], den: [['g', 'kg', 1e-3]], v: () => alea(0.4, 4.5, 3) },
  { de: 'kJ·min⁻¹', vers: 'W', note: ' (1 J·s⁻¹ = 1 W)', num: [['kJ', 'J', 1e3]], den: [['min', 's', 60]], v: () => alea(5, 300, 3) },
  { de: 'cm³·min⁻¹', vers: 'm³·s⁻¹', num: [['cm³', 'm³', 1e-6]], den: [['min', 's', 60]], v: () => alea(10, 900, 3) },
];
// Chaîne de conversion d'une unité composée ; retour = vrai : de l'unité d'arrivée vers l'unité de départ
function chaineComp(it, v, cs, retour = false) {
  const i = retour ? 1 : 0;
  const un = [...it.num.map(p => p[i]), ...(it.fixeN || [])], ud = [...it.den.map(p => p[i]), ...(it.fixeD || [])];
  const premier = { num: un.map((u, j) => (j ? { u } : v === 1 ? { n: 1, u } : nombre(v, u, cs))), den: ud.map(u => ({ u })) };
  const conv = (pos) => ([a, b, k]) => (retour ? facteurK(b, a, 1 / k, pos) : facteurK(a, b, k, pos));
  return [premier, ...it.num.map(conv('num')), ...it.den.map(conv('den'))];
}
function chaineJSX(v, it) {
  const fact = [
    ...it.num.map(([a, b, k], i) => <Frac key={'n' + i} haut={`${nb(k, 3)}${NB}${b}`} bas={`1${NB}${a}`}/>),
    ...it.den.map(([a, b, k], i) => <Frac key={'d' + i} haut={`1${NB}${a}`} bas={`${nb(k, 3)}${NB}${b}`}/>),
  ];
  return <>{nb(v)} {it.de} = {nb(v)}{fact.map((f, i) => <span key={i}> × {f}</span>)}</>;
}
const facteur = it => it.num.reduce((p, [, , k]) => p * k, 1) / it.den.reduce((p, [, , k]) => p * k, 1);
function genComposees() {
  const it = tire(COMPOSEES), k = facteur(it);
  const q1 = { id: 'c0', type: 'num', q: <>Combien vaut <b>1{NB}{it.de}</b> exprimé en {it.vers} ?</>, unite: it.vers, vrai: k, csMin: 3, tolRel: 0.006,
    aide: 'Traitez chaque unité séparément : l’unité du numérateur et celle du dénominateur. Une unité au dénominateur donne un facteur inversé.',
    expl: <>Une fraction égale à 1 par unité à changer :<Ch facteurs={chaineComp(it, 1, 3)}/>Donc 1 {it.de} = <b>{avecU(k, it.vers)}</b>{it.note || ''}.</> };
  const v = it.v(), vrai2 = v * k;
  const q2 = { id: 'c1', type: 'num', q: <>Exprimez <b>{avecU(v, it.de, csDe(v))}</b> en {it.vers}.</>, unite: it.vers, vrai: vrai2, csMin: csDe(v),
    aide: 'Multipliez par une fraction égale à 1 pour chaque unité à changer, de façon que l’ancienne unité se simplifie.',
    expl: <>Une fraction égale à 1 par unité à changer :<Ch cs={Math.max(csDe(v), 2)} facteurs={chaineComp(it, v, csDe(v))}/>{it.note ? <>Soit <b>{avecU(vrai2, it.vers, Math.max(csDe(v), 2))}</b>{it.note}.</> : null}</> };
  const w = Number((alea(1, 9.99, 3) * Math.pow(10, tire([-2, -1, 0, 1]))).toPrecision(3)) , vrai3 = w / k;
  const q3 = { id: 'c2', type: 'num', q: <>Réciproquement, exprimez <b>{avecU(w, it.vers)}</b> en {it.de}.</>, unite: it.de, vrai: vrai3, csMin: 3,
    aide: `Vous savez que 1 ${it.de} = ${nb(k)} ${it.vers}. Pour revenir en arrière, il faut diviser.`,
    expl: <>1 {it.de} = {nb(k)} {it.vers}. Pour revenir en arrière, on utilise les fractions inverses :<Ch facteurs={chaineComp(it, w, 3, true)}/>{it.note ? <>Soit <b>{avecU(vrai3, it.de)}</b>.</> : null}</> };
  return { intro: 'Unités composées : traitez chaque unité l’une après l’autre avec des fractions égales à 1.', questions: [q1, q2, q3],
    retenir: ['Multiplier par des fractions égales à 1 : (10⁻³ m³) / (1 L).', 'Une unité au dénominateur : le facteur est inversé.', '1 L·h⁻¹ ≈ 2,78 × 10⁻⁷ m³·s⁻¹ ; 1 g·cm⁻³ = 1000 kg·m⁻³.'] };
}

// ──────────────────────── Famille 5 : calculs avec conversions cachées ────────────────────────
function genMixte() {
  return tire([
    () => { const Q = alea(5, 80, 3), rho = alea(0.7, 1.6, 3);
      const Qv = Q * 1e-3 / 60, r = rho * 1e3, Qm = Qv * r;
      return { intro: <>Un liquide de masse volumique <b>ρ = {nb(rho)}{NB}g·mL⁻¹</b> s’écoule avec un débit volumique <b>Q<sub>V</sub> = {nb(Q)}{NB}L·min⁻¹</b>. On cherche le débit massique Q<sub>m</sub> = ρ × Q<sub>V</sub> en kg·s⁻¹.</>,
        questions: [
          { id: 'm0', type: 'num', q: <>Q<sub>V</sub> en m³·s⁻¹</>, unite: 'm³·s⁻¹', vrai: Qv, csMin: 3, aide: '1 L = 10⁻³ m³ et 1 min = 60 s.', expl: <><Ch nom="Q_V" facteurs={[{ num: [nombre(Q, 'L', 3)], den: [{ u: 'min' }] }, facteurK('L', 'm³', 1e-3, 'num'), facteurK('min', 's', 60, 'den')]}/></> },
          { id: 'm1', type: 'num', q: <>ρ en kg·m⁻³</>, unite: 'kg·m⁻³', vrai: r, csMin: 3, aide: '1 g·mL⁻¹ = 1000 kg·m⁻³ (1 g = 10⁻³ kg et 1 mL = 10⁻⁶ m³).', expl: <><Ch nom="ρ" facteurs={[{ num: [nombre(rho, 'g', 3)], den: [{ u: 'mL' }] }, facteurK('g', 'kg', 1e-3, 'num'), facteurK('mL', 'm³', 1e-6, 'den')]}/></> },
          { id: 'm2', type: 'num', q: <>Débit massique Q<sub>m</sub> = ρ × Q<sub>V</sub></>, unite: 'kg·s⁻¹', vrai: Qm, csMin: 3, aide: 'Utilisez les deux résultats précédents (en unités SI), sans les arrondir.', expl: <>Q<sub>m</sub> = {nb(r)} × {nb(Qv)} = <b>{avecU(Qm, 'kg·s⁻¹')}</b>.</> },
        ] }; },
    () => { const Qh = alea(1, 25, 3), d = tire([10, 12, 16, 20, 25, 32, 40]);
      const Qv = Qh / 3600, S = Math.PI * Math.pow(d * 1e-3, 2) / 4, v = Qv / S;
      return { intro: <>L’eau circule dans un tuyau de diamètre intérieur <b>d = {d}{NB}mm</b> avec un débit <b>Q<sub>V</sub> = {nb(Qh)}{NB}m³·h⁻¹</b>. On cherche la vitesse v = Q<sub>V</sub> / S en m·s⁻¹.</>,
        questions: [
          { id: 'm0', type: 'num', q: <>Section S du tuyau (S = π d² / 4)</>, unite: 'm²', vrai: S, csMin: 3, aide: 'Convertissez d en mètres avant de calculer.', expl: <>D’abord d en mètres :<Ch cs={2} nom="d" facteurs={[{ num: [nombre(d, 'mm', 2)], den: [] }, facteurK('mm', 'm', 1e-3, 'num')]}/>S = π × <Frac haut={`(${nb(d * 1e-3, 2)} m)²`} bas="4"/> = <b>{avecU(S, 'm²')}</b>.</> },
          { id: 'm1', type: 'num', q: <>Q<sub>V</sub> en m³·s⁻¹</>, unite: 'm³·s⁻¹', vrai: Qv, csMin: 3, aide: '1 h = 3600 s.', expl: <><Ch nom="Q_V" facteurs={[{ num: [nombre(Qh, 'm³', 3)], den: [{ u: 'h' }] }, facteurK('h', 's', 3600, 'den')]}/></> },
          { id: 'm2', type: 'num', q: <>Vitesse v = Q<sub>V</sub> / S</>, unite: 'm·s⁻¹', vrai: v, csMin: 3, aide: 'Utilisez S et Q_V en unités SI.', expl: <>v = <Frac haut={nb(Qv)} bas={nb(S)}/> = <b>{avecU(v, 'm·s⁻¹')}</b>.</> },
        ] }; },
    () => { const h = alea(5, 90, 2), rho = alea(0.8, 1.3, 3), dP = rho * 1e3 * 9.81 * h * 1e-2;
      return { intro: <>Un liquide de masse volumique <b>ρ = {nb(rho)}{NB}g·cm⁻³</b> remplit un récipient sur une hauteur <b>h = {nb(h, 2)}{NB}cm</b>. On cherche la surpression ΔP = ρ·g·h au fond, en <b>hPa</b> (g = 9,81{NB}N·kg⁻¹).</>,
        questions: [
          { id: 'm0', type: 'num', q: <>h en m</>, unite: 'm', vrai: h * 1e-2, csMin: 2, aide: '1 cm = 10⁻² m.', expl: <><Ch cs={2} nom="h" facteurs={[{ num: [nombre(h, 'cm', 2)], den: [] }, facteurK('cm', 'm', 1e-2, 'num')]}/></> },
          { id: 'm1', type: 'num', q: <>ρ en kg·m⁻³</>, unite: 'kg·m⁻³', vrai: rho * 1e3, csMin: 3, aide: '1 g·cm⁻³ = 1000 kg·m⁻³.', expl: <><Ch nom="ρ" facteurs={[{ num: [nombre(rho, 'g', 3)], den: [{ u: 'cm³' }] }, facteurK('g', 'kg', 1e-3, 'num'), facteurK('cm³', 'm³', 1e-6, 'den')]}/></> },
          { id: 'm2', type: 'num', q: <>ΔP en hPa</>, unite: 'hPa', vrai: dP / 100, csMin: 3, aide: 'Calculez d’abord ΔP en Pa (unités SI), puis convertissez : 1 hPa = 100 Pa.',
            pieges: [[dP, 'Vous avez donné le résultat en Pa : la question demande des hPa (1 hPa = 100 Pa).']], expl: <>ΔP = {nb(rho * 1e3)} × 9,81 × {nb(h * 1e-2, 2)} = {nb(dP)} Pa. Puis, avec 1 hPa = 100 Pa :<Ch nom="ΔP" facteurs={[{ num: [nombre(dP, 'Pa', 3)], den: [] }, facteurK('Pa', 'hPa', 1e-2, 'num')]}/></> },
        ] }; },
    () => { const Qh = alea(20, 600, 3), cp = alea(1.5, 4.2, 3), dT = alea(5, 60, 2), P = Qh / 3600 * cp * 1e3 * dT;
      return { intro: <>Un fluide circule à <b>{nb(Qh)}{NB}kg·h⁻¹</b>, de capacité thermique massique <b>c<sub>p</sub> = {nb(cp)}{NB}J·g⁻¹·K⁻¹</b>, et s’échauffe de <b>ΔT = {nb(dT, 2)}{NB}K</b>. La puissance échangée est P = Q<sub>m</sub> × c<sub>p</sub> × ΔT, à exprimer en W.</>,
        questions: [
          { id: 'm0', type: 'num', q: <>Q<sub>m</sub> en kg·s⁻¹</>, unite: 'kg·s⁻¹', vrai: Qh / 3600, csMin: 3, aide: '1 h = 3600 s.', expl: <><Ch nom="Q_m" facteurs={[{ num: [nombre(Qh, 'kg', 3)], den: [{ u: 'h' }] }, facteurK('h', 's', 3600, 'den')]}/></> },
          { id: 'm1', type: 'num', q: <>c<sub>p</sub> en J·kg⁻¹·K⁻¹</>, unite: 'J·kg⁻¹·K⁻¹', vrai: cp * 1e3, csMin: 3, aide: '1 g = 10⁻³ kg : la masse est au dénominateur, donc le nombre est multiplié par 1000.', expl: <><Ch nom="c_p" facteurs={[{ num: [nombre(cp, 'J', 3)], den: [{ u: 'g' }, { u: 'K' }] }, facteurK('g', 'kg', 1e-3, 'den')]}/></> },
          { id: 'm2', type: 'num', q: <>Puissance P</>, unite: 'W', vrai: P, csMin: 3, aide: 'Multipliez les trois grandeurs exprimées en unités SI.', expl: <>P = {nb(Qh / 3600)} × {nb(cp * 1e3)} × {nb(dT, 2)} = <b>{avecU(P, 'W')}</b>.</> },
        ] }; },
  ])()
    ;
}
const RETENIR_MIXTE = ['Convertir chaque donnée en unités SI avant de calculer.', 'Garder les valeurs non arrondies entre deux étapes.', 'Vérifier l’unité du résultat avant de l’écrire.'];

// ──────────────────────── Famille 6 : isoler une grandeur ────────────────────────
const FORMULES = [
  { nom: 'ΔP = ρ·g·h', iso: [
    { cible: 'h', bonne: 'h = ΔP / (ρ·g)', faux: ['h = ρ·g / ΔP', 'h = ΔP·ρ·g', 'h = ΔP·g / ρ'], unite: 'm', unAff: 'm',
      gen: () => { const dP = alea(500, 30000, 3), rho = tire([1000, 998, 1260, 800, 13600]); return { donnees: [['ΔP', dP, 'Pa'], ['ρ', rho, 'kg·m⁻³'], ['g', 9.81, 'N·kg⁻¹']], vrai: dP / (rho * 9.81), calc: <><Frac haut={nb(dP)} bas={`${nb(rho)} × 9,81`}/></> }; },
      hom: ['Pa = N·m⁻²', 'kg·m⁻³ × N·kg⁻¹ = N·m⁻³', 'N·m⁻² / (N·m⁻³) = m'] },
    { cible: 'ρ', bonne: 'ρ = ΔP / (g·h)', faux: ['ρ = g·h / ΔP', 'ρ = ΔP·g·h', 'ρ = ΔP·h / g'], unite: 'kg·m⁻³',
      gen: () => { const h = alea(0.2, 8, 3), rho = tire([1000, 998, 800, 1260, 13600]), dP = rho * 9.81 * h; return { donnees: [['ΔP', Number(dP.toPrecision(4)), 'Pa'], ['h', h, 'm'], ['g', 9.81, 'N·kg⁻¹']], vrai: Number(dP.toPrecision(4)) / (9.81 * h), calc: <Frac haut={nb(Number(dP.toPrecision(4)), 4)} bas={`9,81 × ${nb(h)}`}/> }; }, hom: null },
  ] },
  { nom: 'Q_V = v·S', iso: [
    { cible: 'v', bonne: 'v = Q_V / S', faux: ['v = Q_V·S', 'v = S / Q_V', 'v = Q_V / S²'], unite: 'm·s⁻¹',
      gen: () => { const Q = alea(1, 90, 3) * 1e-4, S = alea(2, 40, 3) * 1e-5; return { donnees: [['Q_V', Q, 'm³·s⁻¹'], ['S', S, 'm²']], vrai: Q / S, calc: <Frac haut={nb(Q)} bas={nb(S)}/> }; },
      hom: ['m³·s⁻¹ / m²', '= m·s⁻¹'] },
    { cible: 'S', bonne: 'S = Q_V / v', faux: ['S = Q_V·v', 'S = v / Q_V', 'S = Q_V / v²'], unite: 'm²',
      gen: () => { const Q = alea(1, 90, 3) * 1e-4, v = alea(0.3, 4, 3); return { donnees: [['Q_V', Q, 'm³·s⁻¹'], ['v', v, 'm·s⁻¹']], vrai: Q / v, calc: <Frac haut={nb(Q)} bas={nb(v)}/> }; }, hom: null },
  ] },
  { nom: 'ρ = m / V', iso: [
    { cible: 'm', bonne: 'm = ρ·V', faux: ['m = ρ / V', 'm = V / ρ', 'm = ρ·V²'], unite: 'kg',
      gen: () => { const r = tire([1000, 800, 1260, 13600]), V = alea(0.5, 40, 3) * 1e-3; return { donnees: [['ρ', r, 'kg·m⁻³'], ['V', V, 'm³']], vrai: r * V, calc: <>{nb(r)} × {nb(V)}</> }; }, hom: ['kg·m⁻³ × m³', '= kg'] },
    { cible: 'V', bonne: 'V = m / ρ', faux: ['V = m·ρ', 'V = ρ / m', 'V = m / ρ²'], unite: 'm³',
      gen: () => { const r = tire([1000, 800, 1260, 13600]), m = alea(0.5, 40, 3); return { donnees: [['m', m, 'kg'], ['ρ', r, 'kg·m⁻³']], vrai: m / r, calc: <Frac haut={nb(m)} bas={nb(r)}/> }; }, hom: null },
  ] },
  { nom: 'U_r = 5·R / (R_p + R)', iso: [
    { cible: 'R_p', bonne: 'R_p = R·(5 − U_r) / U_r', faux: ['R_p = 5·R / U_r', 'R_p = R·(U_r − 5) / U_r', 'R_p = U_r·R / 5 − R·U_r'], unite: 'Ω',
      gen: () => { const R = tire([470, 1000, 2200, 4700]), Ur = alea(0.8, 4.2, 3), Rp = R * (5 - Ur) / Ur; return { donnees: [['U_r', Ur, 'V'], ['R', R, 'Ω']], vrai: Rp, calc: <>{nb(R)} × <Frac haut={`5 − ${nb(Ur)}`} bas={nb(Ur)}/></> }; }, hom: null },
  ] },
  { nom: 'A = ε·ℓ·c', iso: [
    { cible: 'c', bonne: 'c = A / (ε·ℓ)', faux: ['c = A·ε·ℓ', 'c = ε·ℓ / A', 'c = A·ℓ / ε'], unite: 'mol·L⁻¹',
      gen: () => { const A = alea(0.1, 1.2, 3), e = tire([1200, 6200, 2500, 15000]), l = tire([1, 0.5, 2]); return { donnees: [['A', A, ''], ['ε', e, 'L·mol⁻¹·cm⁻¹'], ['ℓ', l, 'cm']], vrai: A / (e * l), calc: <Frac haut={nb(A)} bas={`${nb(e)} × ${nb(l)}`}/> }; }, hom: null },
  ] },
  { nom: 'Q = m·c·ΔT', iso: [
    { cible: 'ΔT', bonne: 'ΔT = Q / (m·c)', faux: ['ΔT = Q·m·c', 'ΔT = m·c / Q', 'ΔT = Q·c / m'], unite: 'K',
      gen: () => { const Q = alea(2, 90, 3) * 1e3, m = alea(0.2, 5, 3), c = tire([4180, 2100, 900, 385]); return { donnees: [['Q', Q, 'J'], ['m', m, 'kg'], ['c', c, 'J·kg⁻¹·K⁻¹']], vrai: Q / (m * c), calc: <Frac haut={nb(Q)} bas={`${nb(m)} × ${nb(c)}`}/> }; }, hom: null },
  ] },
  { nom: 'v = √(2·g·h)', iso: [
    { cible: 'h', bonne: 'h = v² / (2·g)', faux: ['h = v / (2·g)', 'h = √v / (2·g)', 'h = 2·g / v²'], unite: 'm',
      gen: () => { const v = alea(0.8, 9, 3); return { donnees: [['v', v, 'm·s⁻¹'], ['g', 9.81, 'm·s⁻²']], vrai: v * v / (2 * 9.81), calc: <Frac haut={`${nb(v)}²`} bas="2 × 9,81"/> }; }, hom: null },
  ] },
];
const symJSX = s => { const [a, b] = s.split('_'); return b ? <>{a}<sub>{b}</sub></> : a; };
const exprJSX = s => s.split(/(\b[A-Za-zΔρεℓ]+_[A-Za-z]+)/).map((p, i) => (p.includes('_') ? <span key={i}>{symJSX(p)}</span> : p));
function genIsoler() {
  const f = tire(FORMULES), iso = tire(f.iso), g = iso.gen();
  const opts = melange([iso.bonne, ...melange(iso.faux).slice(0, 2)]);
  const q1 = { id: 'i0', type: 'qcm', q: <>Pour la relation <b>{exprJSX(f.nom)}</b>, quelle est l’expression de <b>{symJSX(iso.cible)}</b> ?</>,
    options: opts.map(o => exprJSX(o)), bonne: opts.indexOf(iso.bonne),
    aide: 'Faites la même opération des deux côtés du signe égal, une opération à la fois. Vérifiez en remplaçant par des nombres simples.',
    expl: <>{exprJSX(f.nom)} donne <b>{exprJSX(iso.bonne)}</b>.</> };
  const q2 = { id: 'i1', type: 'num', q: <>Application numérique : {g.donnees.map(([s, v, u], i) => <span key={i}>{i ? ' ; ' : ''}{symJSX(s)} = <b>{nb(v, Math.min(4, Math.max(2, csDe(v))))}{u ? NB + u : ''}</b></span>)}. Calculez <b>{symJSX(iso.cible)}</b>.</>, unite: iso.unite, vrai: g.vrai, csMin: 3,
    aide: `Utilisez l’expression trouvée : ${iso.bonne.replace(/_/g, '')}. Gardez au moins 3 chiffres significatifs.`,
    expl: <>{symJSX(iso.cible)} = {g.calc} = <b>{avecU(g.vrai, iso.unite)}</b>.</> };
  const qs = [q1, q2];
  if (iso.hom) {
    const bonne = iso.unite;
    const autres = melange(['s', 'kg', 'm²', 'Pa', 'm·s⁻¹', 'kg·m⁻³', 'm³'].filter(x => x !== bonne)).slice(0, 2);
    const o3 = melange([bonne, ...autres]);
    qs.push({ id: 'i2', type: 'qcm', q: <>Vérification d’homogénéité : dans quelle unité s’exprime {symJSX(iso.cible)} ?</>, options: o3, bonne: o3.indexOf(bonne),
      aide: 'Remplacez chaque grandeur par son unité dans l’expression et simplifiez.', expl: <>{iso.hom.join(' ; ')} : l’unité obtenue est <b>{bonne}</b>.</> });
  }
  return { intro: 'Manipuler une relation : isoler la grandeur cherchée, puis faire l’application numérique en unités SI.', questions: qs,
    retenir: ['Isoler d’abord, calculer ensuite (expression littérale puis application numérique).', 'Même opération des deux côtés du signe égal.', 'Contrôler l’unité du résultat (homogénéité).'] };
}

// ──────────────────────── Famille 7 : chiffres significatifs ────────────────────────
function genCS() {
  const exemples = [['0,0450', 3], ['7,00', 3], ['0,0032', 2], ['3,10 × 10⁻²', 3], ['1,20 × 10³', 3], ['4,05', 3], ['0,500', 3], ['2,0 × 10⁻⁴', 2]];
  const [txt, n] = tire(exemples), o1 = melange([n, n + 1, n - 1 < 1 ? n + 2 : n - 1]);
  const q1 = { id: 'c0', type: 'qcm', q: <>Combien de chiffres significatifs possède <b>{txt}</b> ?</>, options: o1.map(String), bonne: o1.indexOf(n),
    aide: 'Les zéros à gauche du premier chiffre non nul ne comptent pas ; les zéros à droite après la virgule comptent.', expl: <>Les zéros situés avant le premier chiffre non nul ne sont pas significatifs, les autres le sont : {n} chiffres significatifs.</> };
  const x = Number((Math.random() * 90 + 10).toPrecision(5)) * tire([1, 0.1, 0.01]), ncs = tire([2, 3]);
  const q2 = { id: 'c1', type: 'num', q: <>Arrondissez <b>{nb(x, 5)}</b> à <b>{ncs} chiffres significatifs</b>.</>, unite: '', vrai: Number(x.toPrecision(ncs)), tolRel: 1e-9, csExact: ncs,
    aide: 'Gardez les ncs premiers chiffres, et arrondissez le dernier d’après le chiffre suivant.', expl: <>{nb(x, 5)} → <b>{nb(x, ncs)}</b>.</> };
  const a = alea(10, 99, 3), b = alea(1.1, 9.9, 2), c = alea(1.1, 9.9, 3), r1 = a / b, vrai = r1 * c;
  const q3 = { id: 'c2', type: 'num', q: <>Calculez <b>{nb(a)} / {nb(b, 2)} × {nb(c)}</b> et donnez le résultat avec <b>2 chiffres significatifs</b> (le moins précis des trois nombres).</>, unite: '', vrai: Number(vrai.toPrecision(2)), tolRel: 1e-9, csExact: 2,
    pieges: [[Number((Number(r1.toPrecision(2)) * c).toPrecision(2)), 'Vous avez arrondi trop tôt le résultat intermédiaire : gardez toutes les décimales jusqu’au résultat final.']],
    aide: 'Calculez avec la calculatrice sans rien arrondir, et arrondissez seulement le résultat final au nombre de chiffres significatifs de la donnée la moins précise.',
    expl: <>{nb(a)} / {nb(b, 2)} = {nb(r1, 6)} (non arrondi) ; × {nb(c)} = {nb(vrai, 6)} ; arrondi à 2 chiffres significatifs : <b>{nb(vrai, 2)}</b>.</> };
  return { intro: 'Chiffres significatifs : compter, arrondir, et ne pas arrondir trop tôt.', questions: [q1, q2, q3],
    retenir: ['Le résultat a autant de chiffres significatifs que la donnée la moins précise.', 'On n’arrondit qu’à la fin du calcul.', 'Zéros à gauche : non significatifs ; zéros à droite après la virgule : significatifs.'] };
}

// ──────────────────────── Famille 8 : fonctions usuelles (log, exp, racine) ────────────────────────
function genFonctions() {
  return tire([
    () => { const m = alea(1.1, 9.9, 2), e = tire([-2, -3, -4, -5]), c = m * Math.pow(10, e), pH = -Math.log10(c);
      const pHs = tire([2.35, 3.45, 4.2, 5.6, 7.3, 9.1]), c2 = Math.pow(10, -pHs);
      return { intro: 'Le pH est défini par pH = −log [H₃O⁺] (concentration en mol·L⁻¹).', questions: [
        { id: 'f0', type: 'num', q: <>Calculez le pH d’une solution telle que [H₃O⁺] = <b>{nb(c, 2)}{NB}mol·L⁻¹</b>.</>, unite: '', vrai: pH, tolRel: 0.003, aide: 'Touche « log » de la calculatrice (log base 10, et non « ln »). N’oubliez pas le signe moins.',
          pieges: [[Math.log(c), 'Vous avez utilisé « ln » au lieu de « log ».'], [Math.log10(c), 'Le pH est l’opposé de log [H₃O⁺] : attention au signe.']],
          expl: <>pH = −log({nb(c, 2)}) = <b>{nb(pH, 3)}</b> (avec 2 chiffres significatifs sur c, 2 décimales sur le pH).</> },
        { id: 'f1', type: 'num', q: <>Une solution a un pH de <b>{nb(pHs, 3)}</b>. Calculez [H₃O⁺] en mol·L⁻¹.</>, unite: 'mol·L⁻¹', vrai: c2, tolRel: 0.02, csMin: 2, aide: 'Fonction inverse de log : [H₃O⁺] = 10^(−pH) (touche « 10ˣ »).',
          expl: <>[H₃O⁺] = 10<sup>−{nb(pHs, 3)}</sup> = <b>{avecU(c2, 'mol·L⁻¹')}</b>.</> },
      ], retenir: ['pH = −log [H₃O⁺] ; [H₃O⁺] = 10⁻ᵖᴴ.', 'log = base 10 ; ln = base e : ne pas confondre.', 'Fonction inverse de log : 10ˣ ; fonction inverse de ln : eˣ.'] }; },
    () => { const T0 = tire([20, 25, 15]), Tf = tire([60, 80, 100]), tau = tire([8, 12, 20, 30]), t = tire([5, 10, 15, 25, 40]), T = Tf - (Tf - T0) * Math.exp(-t / tau);
      const frac = Math.exp(-t / tau);
      return { intro: <>Un thermomètre initialement à {T0}{NB}°C est plongé dans un bain à {Tf}{NB}°C. Sa température suit θ(t) = θ<sub>f</sub> − (θ<sub>f</sub> − θ<sub>0</sub>)·exp(−t/τ), avec τ = {tau}{NB}s.</>, questions: [
        { id: 'f0', type: 'num', q: <>Calculez exp(−t/τ) pour t = <b>{t}{NB}s</b>.</>, unite: '', vrai: frac, csMin: 3, aide: 'Calculez d’abord le rapport t/τ (sans unité), puis appuyez sur « eˣ » avec le signe moins.', pieges: [[Math.exp(t / tau), 'Vous avez oublié le signe moins dans l’exposant.']], expl: <>t/τ = {nb(t / tau)} ; exp(−{nb(t / tau)}) = <b>{nb(frac, 4)}</b>.</> },
        { id: 'f1', type: 'num', q: <>En déduire θ(t) à t = {t}{NB}s.</>, unite: '°C', vrai: T, csMin: 3, aide: 'θ = θ_f − (θ_f − θ_0) × exp(−t/τ) : calculez la parenthèse, multipliez, puis soustrayez.', expl: <>θ = {Tf} − ({Tf} − {T0}) × {nb(frac, 4)} = <b>{avecU(T, '°C')}</b>.</> },
      ], retenir: ['exp(−t/τ) vaut 0,37 à t = τ et moins de 0,05 à t = 3τ.', 'Le rapport t/τ n’a pas d’unité (t et τ en s).', 'Attention au signe moins de l’exposant.'] }; },
    () => { const BT = 50, Ba = tire([25, 40, 75, 100, 150]), r = Ba / BT, a = Math.atan(r) * 180 / Math.PI;
      return { intro: <>Une boussole subit le champ de la Terre B<sub>T</sub> = {BT}{NB}µT (vers le nord) et celui d’un aimant B<sub>a</sub> = {Ba}{NB}µT, perpendiculaire au premier. L’aiguille dévie d’un angle α tel que tan α = B<sub>a</sub> / B<sub>T</sub>.</>, questions: [
        { id: 'f0', type: 'num', q: <>Calculez le rapport B<sub>a</sub> / B<sub>T</sub>.</>, unite: '', vrai: r, csMin: 3, aide: 'Les deux champs sont en µT : le rapport n’a pas d’unité.',
          expl: <>B<sub>a</sub> / B<sub>T</sub> = {Ba} / {BT} = <b>{nb(r, 3)}</b>.</> },
        { id: 'f1', type: 'num', q: <>En déduire l’angle α, en degrés.</>, unite: '°', vrai: a, tolRel: 0.005, aide: 'Fonction inverse de tan : touche « tan⁻¹ » (ou « arctan »). Vérifiez que la calculatrice est en mode degrés (DEG).',
          pieges: [[Math.atan(r), 'Votre calculatrice est en radians : passez-la en mode degrés (DEG).'], [Math.tan(r * Math.PI / 180) * 180 / Math.PI, 'Vous avez utilisé tan au lieu de tan⁻¹ (arctan).']],
          expl: <>α = arctan({nb(r, 3)}) = <b>{nb(a, 3)}{NB}°</b>.</> },
      ], retenir: ['tan α = côté opposé / côté adjacent ; α = arctan(rapport).', 'Toujours vérifier le mode de la calculatrice : degrés (DEG) ou radians (RAD).', 'Le rapport de deux grandeurs de même unité n’a pas d’unité.'] }; },
    () => { const B1 = tire([200, 400, 800]), r1 = tire([4, 5, 10]), k = tire([2, 3]), r2 = r1 * k, fac = Math.pow(r1 / r2, 3), B2 = B1 * fac;
      return { intro: <>Le champ d’un aimant décroît comme 1/r³ : B(r₂) = B(r₁) × (r₁ / r₂)³. À r₁ = {r1}{NB}cm, le champ vaut {B1}{NB}µT.</>, questions: [
        { id: 'f0', type: 'num', q: <>Calculez (r₁ / r₂)³ pour r₂ = <b>{r2}{NB}cm</b>.</>, unite: '', vrai: fac, csMin: 3, aide: 'Calculez la fraction r₁ / r₂ d’abord, puis élevez-la au cube (touche x³ ou ^3).',
          pieges: [[Math.pow(r1 / r2, 2), 'Vous avez élevé au carré : la loi est en 1/r³ (cube).'], [r1 / r2, 'Vous avez oublié d’élever au cube.']],
          expl: <>(r₁ / r₂)³ = ({r1} / {r2})³ = {nb(r1 / r2, 3)}³ = <b>{nb(fac, 3)}</b>.</> },
        { id: 'f1', type: 'num', q: <>En déduire le champ de l’aimant à {r2}{NB}cm.</>, unite: 'µT', vrai: B2, csMin: 3, aide: 'Multipliez le champ à r₁ par le facteur obtenu.',
          expl: <>B(r₂) = {B1} × {nb(fac, 3)} = <b>{avecU(B2, 'µT')}</b>.</> },
      ], retenir: ['Distance × 2 ⇒ champ ÷ 8 (loi en 1/r³).', 'Les puissances s’appliquent à la fraction entière : (r₁ / r₂)³.', 'Une grandeur qui décroît très vite avec la distance perd son effet à quelques longueurs de l’aimant.'] }; },
    () => { const n = tire([4, 9, 16, 25, 36]), s = alea(0.2, 0.9, 2), u = s / Math.sqrt(n);
      return { intro: <>On répète n = {n} fois une mesure ; l’écart-type expérimental est s = {nb(s, 2)}{NB}mL. L’incertitude-type de la moyenne est u = s / √n.</>, questions: [
        { id: 'f0', type: 'num', q: <>Calculez √n pour n = <b>{n}</b>.</>, unite: '', vrai: Math.sqrt(n), csMin: 2, aide: 'Touche « √ » de la calculatrice.', expl: <>√{n} = <b>{nb(Math.sqrt(n), 2)}</b>.</> },
        { id: 'f1', type: 'num', q: <>En déduire l’incertitude-type u.</>, unite: 'mL', vrai: u, csMin: 2,
          pieges: [[s / n, 'Vous avez divisé par n au lieu de √n.'], [s * Math.sqrt(n), 'Vous avez multiplié par √n au lieu de diviser.']],
          aide: 'u = s divisé par √n : la barre de fraction englobe √n.', expl: <>u = {nb(s, 2)} / √{n} = <b>{avecU(u, 'mL', 2)}</b>.</> },
      ], retenir: ['u = s / √n : plus on répète, plus la moyenne est précise, mais lentement.', 'Pour diviser u par 2, il faut 4 fois plus de mesures.', 'Ne pas confondre √n et n au dénominateur.'] }; },
    () => { const h = alea(0.2, 6, 3), v = Math.sqrt(2 * 9.81 * h);
      return { intro: <>Un réservoir se vide par un orifice situé à une profondeur h sous la surface libre : la vitesse d’éjection est v = √(2·g·h) (g = 9,81{NB}m·s⁻²).</>, questions: [
        { id: 'f0', type: 'num', q: <>Calculez v pour h = <b>{nb(h)}{NB}m</b>.</>, unite: 'm·s⁻¹', vrai: v, csMin: 3, aide: 'La racine porte sur tout le produit 2·g·h : mettez des parenthèses sur la calculatrice, ou calculez 2 × 9,81 × h puis appuyez sur « √ ».',
          pieges: [[2 * 9.81 * h, 'Vous avez oublié la racine carrée.'], [2 * 9.81 * Math.sqrt(h), 'La racine ne porte que sur h : elle doit porter sur tout le produit 2·g·h.']], expl: <>v = √(2 × 9,81 × {nb(h)}) = √{nb(2 * 9.81 * h)} = <b>{avecU(v, 'm·s⁻¹')}</b>.</> },
        { id: 'f1', type: 'num', q: <>Quelle profondeur h faut-il pour obtenir v = <b>{nb(Number((v * 1.5).toPrecision(3)))}{NB}m·s⁻¹</b> ?</>, unite: 'm', vrai: Math.pow(Number((v * 1.5).toPrecision(3)), 2) / (2 * 9.81), csMin: 3, aide: 'Élevez les deux côtés au carré : h = v² / (2·g).', expl: <>h = <Frac haut={`${nb(Number((v * 1.5).toPrecision(3)))}²`} bas="2 × 9,81"/> = <b>{avecU(Math.pow(Number((v * 1.5).toPrecision(3)), 2) / (2 * 9.81), 'm')}</b>.</> },
      ], retenir: ['La racine carrée porte sur tout le produit : √(2·g·h).', 'Inverse de √ : élever au carré.', 'Mettre des parenthèses sur la calculatrice.'] }; },
  ])();
}

// ──────────────────────── Famille 9 : saisie à la calculatrice ────────────────────────
function genCalculatrice() {
  return tire([
    () => { const R = tire([470, 1000, 2200, 4700]), Rp = tire([1540, 2500, 5600, 790, 346]), Ur = 5 * R / (Rp + R);
      const bonne = `5 × ${R} / (${Rp} + ${R})`, faux = [`5 × ${R} / ${Rp} + ${R}`, `5 × ${R} / ${Rp} × ${R}`, `5 × (${R} / ${Rp}) + ${R}`];
      const o = melange([bonne, faux[0], faux[1]]);
      return { intro: <>On veut calculer U<sub>r</sub> = 5 × R / (R<sub>p</sub> + R) avec R = {R}{NB}Ω et R<sub>p</sub> = {Rp}{NB}Ω.</>, questions: [
        { id: 'k0', type: 'qcm', q: <>Quelle saisie, telle quelle sur une calculatrice, donne la bonne valeur ?</>, options: o, bonne: o.indexOf(bonne), aide: 'Une barre de fraction « englobe » tout le dénominateur : sur la calculatrice, il faut le mettre entre parenthèses.', expl: <>Le dénominateur R<sub>p</sub> + R doit être entre parenthèses, sinon la calculatrice ne divise que par le premier terme.</> },
        { id: 'k1', type: 'num', q: <>Calculez U<sub>r</sub>.</>, unite: 'V', vrai: Ur, csMin: 3, pieges: [[5 * R / Rp + R, 'Parenthèses oubliées au dénominateur.']], aide: 'Calculez le dénominateur d’abord : R_p + R.', expl: <>U<sub>r</sub> = <Frac haut={`5 × ${R}`} bas={`${Rp} + ${R}`}/> = <b>{avecU(Ur, 'V')}</b>.</> },
      ], retenir: ['Une fraction se saisit avec des parenthèses autour du numérateur et du dénominateur.', 'a / b × c = (a / b) × c ; a / (b × c) est différent.', 'Relire l’expression affichée avant de valider.'] }; },
    () => { const f = tire([50, 100, 440, 1000, 2500]), T = 1 / (2 * Math.PI * f);
      const bonne = `1 / (2 × π × ${f})`, o = melange([bonne, `1 / 2 × π × ${f}`, `1 / 2π × ${f}`]);
      return { intro: <>La période d’un signal de fréquence f = {f}{NB}Hz est T = 1 / (2π f) (cas d’une pulsation).</>, questions: [
        { id: 'k0', type: 'qcm', q: <>Quelle saisie est correcte ?</>, options: o, bonne: o.indexOf(bonne), aide: 'Tout ce qui est au dénominateur (2, π et f) doit être entre parenthèses.', expl: <>Sans parenthèses, « 1 / 2 × π × f » calcule (1/2) × π × f.</> },
        { id: 'k1', type: 'num', q: <>Calculez T.</>, unite: 's', vrai: T, csMin: 3, pieges: [[Math.PI * f / 2, 'Vous avez calculé (1/2) × π × f : parenthèses oubliées.']], aide: 'Calculez 2 × π × f d’abord.', expl: <>T = <Frac haut="1" bas={`2 × π × ${f}`}/> = <b>{avecU(T, 's')}</b>.</> },
      ], retenir: ['Tout le dénominateur entre parenthèses.', 'π : touche π de la calculatrice, pas 3,14.', 'Utiliser le résultat non arrondi pour la suite.'] }; },
    () => { const a = alea(1.1, 9.9, 2), b = alea(1.1, 9.9, 2), ea = tire([-4, -3, -2, 2, 3, 4]), eb = tire([-6, -5, -3, 5, 6]), vrai = a * Math.pow(10, ea) * b * Math.pow(10, eb);
      const bonne = `${nb(a, 2)} EE ${ea} × ${nb(b, 2)} EE ${eb}`, o = melange([bonne, `${nb(a, 2)} × 10 × ${ea} × ${nb(b, 2)} × 10 × ${eb}`, `(${nb(a, 2)} × 10) ^ ${ea} × (${nb(b, 2)} × 10) ^ ${eb}`]);
      return { intro: <>On veut calculer le produit ({nb(a, 2)} × 10{sup(ea)}) × ({nb(b, 2)} × 10{sup(eb)}).</>, questions: [
        { id: 'k0', type: 'qcm', q: <>Quelle saisie est correcte ? (« EE » est la touche des puissances de 10 de la calculatrice : 5 EE 3 = 5 × 10³.)</>, options: o, bonne: o.indexOf(bonne),
          aide: '« × 10 × −3 » n’est pas « × 10⁻³ » : utilisez la touche EE (ou ×10ˣ), ou écrivez 10^(−3).', expl: <>La touche EE (ou ×10ˣ) écrit directement la puissance de 10 : {nb(a, 2)} EE {ea} = {nb(a, 2)} × 10{sup(ea)}.</> },
        { id: 'k1', type: 'num', q: <>Calculez le produit (notation scientifique conseillée, 2 chiffres significatifs).</>, unite: '', vrai, csMin: 2, aide: 'Multipliez les nombres entre eux et additionnez les exposants.', expl: <>({nb(a, 2)} × {nb(b, 2)}) × 10{sup(ea + eb)} = <b>{nb(vrai, 2)}</b>.</> },
      ], retenir: ['Touche EE (ou ×10ˣ) pour une puissance de 10.', 'a × 10ⁿ × b × 10ᵐ = (a × b) × 10ⁿ⁺ᵐ.', 'Ne pas confondre « × 10 × n » et « × 10ⁿ ».'] }; },
  ])();
}

// ──────────────────────── Liste des familles ────────────────────────
// ──────────────────────── Famille « Vitesses » (seconde) ────────────────────────
function genVitesses() {
  const v1 = tire([36, 54, 72, 90, 108, 126]);
  const q1 = { id: 'v0', type: 'num', q: <>Un train roule à <b>{v1}{NB}km·h⁻¹</b>. Exprimez cette vitesse en <b>m·s⁻¹</b>.</>, unite: 'm·s⁻¹', vrai: v1 / 3.6, csMin: 2,
    aide: '1 km = 1000 m et 1 h = 3600 s. Donc 1 km·h⁻¹ = 1000 m / 3600 s = 1/3,6 m·s⁻¹ : on divise par 3,6.',
    pieges: [[v1 * 3.6, 'Vous avez multiplié par 3,6 au lieu de diviser : un nombre de m·s⁻¹ est plus PETIT que le nombre de km·h⁻¹ (1 m·s⁻¹ = 3,6 km·h⁻¹).']],
    expl: <>1 km·h⁻¹ = 1000 m / 3600 s.Donc {v1} km·h⁻¹ = {v1} × 1000 m / 3600 s = {v1} / 3,6 m·s⁻¹. Résultat : <b>{avecU(v1 / 3.6, 'm·s⁻¹', 2)}</b>.</> };
  const v2 = tire([5, 8, 10, 15, 20, 25, 30]);
  const q2 = { id: 'v1', type: 'num', q: <>Un coureur va à <b>{v2}{NB}m·s⁻¹</b>. Exprimez cette vitesse en <b>km·h⁻¹</b>.</>, unite: 'km·h⁻¹', vrai: v2 * 3.6, csMin: 2,
    aide: 'Dans l’autre sens, on multiplie par 3,6 : 1 m·s⁻¹ = 3,6 km·h⁻¹.',
    pieges: [[v2 / 3.6, 'Vous avez divisé par 3,6 au lieu de multiplier : 1 m·s⁻¹ est une vitesse plus grande que 1 km·h⁻¹.']],
    expl: <>En 1 s on parcourt {v2} m ; en 3600 s (1 h) on parcourt {v2} × 3600 = {nb(v2 * 3600, 5)} m = {nb(v2 * 3.6, 3)} km. Donc <b>{avecU(v2 * 3.6, 'km·h⁻¹', 3)}</b>.</> };
  const d = tire([12, 18, 24, 30, 45, 60]), tm = tire([20, 30, 40, 45, 90]);
  const q3 = { id: 'v2', type: 'num', q: <>Un cycliste roule à la vitesse constante de <b>{d}{NB}km·h⁻¹</b> pendant <b>{tm}{NB}min</b>. Calculez la distance parcourue en <b>km</b> (d = v × Δt).</>, unite: 'km', vrai: d * tm / 60, csMin: 2,
    aide: 'La vitesse est en km par HEURE : convertissez d’abord la durée en heures (1 h = 60 min), puis multipliez.',
    pieges: [[d * tm, 'Vous avez multiplié des km·h⁻¹ par des minutes : il faut d’abord convertir les minutes en heures.']],
    expl: <>Δt = {tm} min = {tm}/60 h = {nb(tm / 60, 3)} h. Puis d = v × Δt = {d} km·h⁻¹ × {nb(tm / 60, 3)} h = <b>{avecU(d * tm / 60, 'km', 3)}</b>. (Les heures se simplifient : il reste des km.)</> };
  return { intro: 'Vitesses : passer des km·h⁻¹ aux m·s⁻¹, et calculer une distance avec une durée en minutes.', questions: [q1, q2, q3],
    retenir: ['Pour passer de km·h⁻¹ à m·s⁻¹ : on divise par 3,6. Dans l’autre sens : on multiplie par 3,6.', 'Une vitesse en km·h⁻¹ demande une durée en heures ; en m·s⁻¹, une durée en secondes.', '30 min = 0,5 h (pas 0,30 h) : on divise les minutes par 60.'] };
}

// ──────────────────────── Famille « Forces et champs » (1re spécialité) ────────────────────────
function genInteractions() {
  const k = 9.0e9, G = 6.674e-11;
  const a = tire([2, 3, 4, 5, 6, 8]), b = tire([2, 3, 5, 6, 9]), dc = tire([2, 3, 4, 5, 8]);
  const Fc = k * a * 1e-9 * b * 1e-9 / Math.pow(dc * 1e-2, 2);
  const q1 = { id: 'i0', type: 'num', q: <>Deux charges de <b>{a}{NB}nC</b> et <b>{b}{NB}nC</b> sont séparées de <b>{dc}{NB}cm</b>. Calculez la force électrostatique entre elles (k = 9,0 × 10⁹ N·m²·C⁻²), en <b>N</b>.</>, unite: 'N', vrai: Fc, csMin: 2,
    aide: 'Convertissez d’abord en unités SI : 1 nC = 10⁻⁹ C et 1 cm = 10⁻² m. Puis F = k·q₁·q₂ / d².',
    pieges: [[Fc * 1e-4, 'Vous avez gardé d en cm : il faut le convertir en mètres (1 cm = 10⁻² m), puis l’élever au carré.'], [Fc * 1e18, 'Vous avez gardé les charges en nC : il faut les convertir en coulombs (1 nC = 10⁻⁹ C).']],
    expl: <>q₁ = {a} × 10⁻⁹ C, q₂ = {b} × 10⁻⁹ C, d = {dc} × 10⁻² m. F = k·q₁·q₂ / d² = 9,0 × 10⁹ × ({a} × 10⁻⁹) × ({b} × 10⁻⁹) / ({dc} × 10⁻²)² = <b>{avecU(Fc, 'N', 2)}</b>.</> };
  const m1 = tire([2, 4, 5, 8]), m2 = tire([3, 5, 6, 10]), dg = tire([5, 10, 20]);
  const Fg = G * m1 * 1e3 * m2 * 1e3 / (dg * dg);
  const q2 = { id: 'i1', type: 'num', q: <>Deux camions de <b>{m1}{NB}tonnes</b> et <b>{m2}{NB}tonnes</b> sont à <b>{dg}{NB}m</b> l’un de l’autre. Calculez la force gravitationnelle entre eux (G = 6,674 × 10⁻¹¹ N·m²·kg⁻²), en <b>N</b>.</>, unite: 'N', vrai: Fg, csMin: 2,
    aide: 'Convertissez les masses en kilogrammes : 1 tonne = 10³ kg. Puis F = G·m₁·m₂ / d².',
    pieges: [[Fg * 1e-6, 'Vous avez gardé les masses en tonnes : il faut les convertir en kilogrammes (1 t = 10³ kg).']],
    expl: <>m₁ = {m1} × 10³ kg, m₂ = {m2} × 10³ kg. F = G·m₁·m₂ / d² = 6,674 × 10⁻¹¹ × ({m1} × 10³) × ({m2} × 10³) / {dg}² = <b>{avecU(Fg, 'N', 2)}</b>. C’est minuscule : la gravitation n’est sensible que si l’une des masses est énorme.</> };
  const [nomP, M, Rkm] = tire([['Mars', 6.42e23, 3390], ['la Lune', 7.35e22, 1737], ['Vénus', 4.87e24, 6052]]);
  const g = G * M / Math.pow(Rkm * 1e3, 2);
  const q3 = { id: 'i2', type: 'num', q: <>La masse de {nomP} est M = <b>{nb(M / Math.pow(10, Math.floor(Math.log10(M))), 3)} × 10{sup(Math.floor(Math.log10(M)))}{NB}kg</b> et son rayon R = <b>{Rkm}{NB}km</b>. Calculez le champ de gravitation à sa surface g = G·M / R², en <b>N·kg⁻¹</b>.</>, unite: 'N·kg⁻¹', vrai: g, csMin: 2,
    aide: 'Convertissez R en mètres (1 km = 10³ m) avant de l’élever au carré.',
    pieges: [[g * 1e-6, 'Vous avez gardé R en km : il faut le convertir en mètres (1 km = 10³ m), puis l’élever au carré.']],
    expl: <>R = {Rkm} × 10³ m. g = G·M / R² = 6,674 × 10⁻¹¹ × {nb(M, 3)} / ({Rkm} × 10³)² = <b>{avecU(g, 'N·kg⁻¹', 2)}</b>. Un objet de masse m y pèse P = m·g.</> };
  return { intro: 'Forces et champs : convertir en unités SI avant d’utiliser les lois de Coulomb et de la gravitation.', questions: [q1, q2, q3],
    retenir: ['Convertir toutes les grandeurs en unités SI AVANT de calculer : nC → C (×10⁻⁹), cm → m (×10⁻²), km → m (×10³), t → kg (×10³).', 'La distance est élevée au carré : une erreur de conversion sur d est élevée au carré, elle aussi.', '1 N·kg⁻¹ = 1 m·s⁻².'] };
}

// ──────────────────────── Famille « Lentille mince : les signes » (1re spécialité) : les distances algébriques, pas à pas ────────────────────────
function genLentilleSignes() {
  const [d, Op, f] = tire([[30, 15, 10], [20, 20, 10], [60, 12, 10], [24, 24, 12], [36, 18, 12], [40, 10, 8], [15, 30, 10]]);
  const o0 = melange([`OA = −${d} cm`, `OA = +${d} cm`, `OA = ${d} cm, sans signe : on ne s’occupe pas du sens`, `OA = −1/${d} cm⁻¹`]);
  const q0 = { id: 's0', type: 'qcm', q: <>Un objet est placé <b>{d}{NB}cm avant</b> la lentille (la lumière va de l’objet vers la lentille, puis vers l’écran). Quelle est la valeur algébrique de OA ?</>, options: o0, bonne: o0.indexOf(`OA = −${d} cm`),
    aide: 'Les grandeurs sont algébriques : on part de O (le centre de la lentille) et on compte positivement dans le sens de la lumière. Un objet avant la lentille est donc à gauche de O.',
    expl: <>La lumière se propage de l’objet vers la lentille : l’objet est à contre-sens de la lumière par rapport à O, donc OA = <b>−{d}{NB}cm</b>. Un objet réel est toujours avant la lentille : OA est toujours négatif.</> };
  const o1 = melange([`OA′ = +${Op} cm`, `OA′ = −${Op} cm`, `OA′ = ${Op} cm − ${d} cm`, `OA′ = +1/${Op} cm⁻¹`]);
  const q1 = { id: 's1', type: 'qcm', q: <>L’image nette se forme sur un écran placé <b>{Op}{NB}cm après</b> la lentille. Quelle est la valeur algébrique de OA′ ?</>, options: o1, bonne: o1.indexOf(`OA′ = +${Op} cm`),
    aide: 'Après la lentille, c’est dans le sens de la lumière : le signe est positif.',
    expl: <>L’image est de l’autre côté de la lentille, dans le sens de la lumière : OA′ = <b>+{Op}{NB}cm</b>. Une image qu’on peut recueillir sur un écran (image réelle) a toujours OA′ positif.</> };
  const v = 1 / f;
  const q2 = { id: 's2', type: 'num', q: <>On a OA = <b>−{d}{NB}cm</b> et OA′ = <b>+{Op}{NB}cm</b>. Remplacez dans la relation de conjugaison et calculez <b>1/f′ = 1/OA′ − 1/OA</b>, en <b>cm⁻¹</b> (c’est un nombre petit, comme 0,05).</>, unite: 'cm⁻¹', vrai: v, csMin: 2,
    aide: <>Écrivez d’abord 1/f′ = 1/(+{Op}) − 1/(−{d}). Soustraire un nombre négatif revient à AJOUTER : − (−x) = + x.</>,
    pieges: [[1 / Op - 1 / d, 'Vous avez remplacé OA par +' + d + ' : il est NÉGATIF (objet avant la lentille). 1/OA′ − 1/OA = 1/' + Op + ' − 1/(−' + d + ') : le signe moins devant un négatif donne un plus.']],
    expl: <>1/f′ = 1/(+{Op}) − 1/(−{d}) = 1/{Op} + 1/{d} = <b>{nb(v, 2)}{NB}cm⁻¹</b>. Le − devant le OA négatif devient un +.</> };
  const q3 = { id: 's3', type: 'num', q: <>Avec 1/f′ = {nb(v, 2)}{NB}cm⁻¹, quelle est la distance focale f′ de la lentille, en <b>cm</b> ?</>, unite: 'cm', vrai: f, csMin: 2,
    aide: 'f′ est l’inverse de 1/f′ : f′ = 1 / (1/f′).',
    pieges: [[v, 'Vous avez donné 1/f′ : il faut prendre l’inverse pour obtenir f′.']],
    expl: <>f′ = 1 / {nb(v, 2)} = <b>{f}{NB}cm</b>. Positif : c’est bien une lentille convergente.</> };
  const o4 = melange(['virtuelle : elle est du même côté que l’objet, on ne peut pas la recueillir sur un écran', 'réelle : elle se forme derrière la lentille et se recueille sur un écran', 'réelle : une valeur négative signifie seulement que l’image est renversée', 'impossible : une distance ne peut pas être négative']);
  const q4 = { id: 's4', type: 'qcm', q: <>Dans un autre montage, on trouve <b>OA′ = −{Op}{NB}cm</b>. Que peut-on dire de l’image ?</>, options: o4, bonne: o4.indexOf('virtuelle : elle est du même côté que l’objet, on ne peut pas la recueillir sur un écran'),
    aide: 'Le signe de OA′ dit de quel côté de la lentille se trouve l’image. Ne confondez pas avec le signe de γ, qui dit si elle est renversée.',
    expl: <>OA′ négatif : l’image est avant la lentille, du même côté que l’objet. C’est une <b>image virtuelle</b> (comme avec une loupe) : aucun écran ne peut la recueillir. Le « renversée ou droite » est donné par le signe de γ, pas par celui de OA′.</> };
  [q2, q3].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > 1e-9); });
  return { intro: 'Lentille mince : les distances algébriques, pas à pas. D’abord le signe, puis le remplacement dans la relation, puis la conclusion.', questions: [q0, q1, q2, q3, q4],
    retenir: ['Repère : origine O (centre de la lentille), axe orienté dans le sens de la lumière.', 'Avant la lentille : négatif (OA < 0 pour un objet réel). Après la lentille : positif (OA′ > 0 pour une image réelle).', 'Remplacer AVEC les parenthèses et les signes : 1/f′ = 1/(+OA′) − 1/(−|OA|) = 1/OA′ + 1/|OA|.', 'OA′ < 0 : image virtuelle (même côté que l’objet). γ < 0 : image renversée.'] };
}

// ──────────────────────── Famille « Lentille mince » (1re spécialité) ────────────────────────
function genLentille() {
  const [d, f, Op] = tire([[30, 10, 15], [20, 10, 20], [60, 10, 12], [24, 12, 24], [36, 12, 18], [40, 8, 10], [15, 10, 30]]);
  const q1 = { id: 'l0', type: 'num', q: <>Une lentille mince convergente a une distance focale f′ = <b>{f}{NB}cm</b>. Un objet est placé à <b>{d}{NB}cm</b> devant la lentille (OA = <b>−{d}{NB}cm</b>). Calculez la position OA′ de l’image (relation de conjugaison 1/OA′ − 1/OA = 1/f′), en <b>cm</b>.</>, unite: 'cm', vrai: Op, csMin: 2,
    aide: 'Isolez 1/OA′ : 1/OA′ = 1/f′ + 1/OA, en gardant le signe négatif de OA. Puis prenez l’inverse.',
    pieges: [[f * d / (f + d), 'Vous avez pris OA = +' + d + ' cm. L’objet est AVANT la lentille : OA est négatif, donc 1/OA′ = 1/f′ − 1/' + d + '.'], [d - f, 'Vous avez soustrait les distances : la relation porte sur les INVERSES, 1/OA′ = 1/f′ + 1/OA.'], [1 / (1 / f - 1 / d) * -1, 'Le signe est faux : ici 1/OA′ est positif, l’image est réelle, de l’autre côté de la lentille.']],
    expl: <>1/OA′ = 1/f′ + 1/OA = 1/{f} − 1/{d}, donc OA′ = <b>{avecU(Op, 'cm', 2)}</b>. Positif : image réelle, derrière la lentille.</> };
  const AB = tire([12, 15, 20, 24]), g = Op / -d;
  const q2 = { id: 'l1', type: 'num', q: <>Pour ce même montage (OA = −{d}{NB}cm ; OA′ = +{Op}{NB}cm), calculez le grandissement <b>γ = OA′ / OA</b> (sans unité, avec son signe).</>, unite: '', vrai: g, csMin: 2,
    aide: 'Divisez OA′ par OA en gardant les signes : un résultat négatif signifie « image renversée ».',
    pieges: [[-g, 'Le signe est faux : OA′ est positif et OA négatif, donc γ est négatif (image renversée).'], [1 / g, 'Vous avez calculé OA / OA′ : le grandissement est OA′ / OA.']],
    expl: <>γ = OA′ / OA = {Op} / (−{d}) = <b>{nb(g, 2)}</b>. Négatif : image renversée ; |γ| = {nb(Math.abs(g), 2)} {Math.abs(g) < 1 ? '< 1 : image plus petite que l’objet' : '> 1 : image plus grande que l’objet'}.</> };
  const hImg = g * AB;
  const q3 = { id: 'l2', type: 'num', q: <>L’objet mesure AB = <b>{AB}{NB}mm</b>. Quelle est la hauteur algébrique A′B′ de l’image (A′B′ = γ × AB), en <b>mm</b> ?</>, unite: 'mm', vrai: hImg, csMin: 2,
    aide: 'A′B′ = γ × AB, avec le γ calculé à la question précédente (signe compris).',
    pieges: [[-hImg, 'Le signe est faux : γ est négatif, donc A′B′ aussi (image renversée).']],
    expl: <>A′B′ = γ × AB = {nb(g, 2)} × {AB} = <b>{avecU(hImg, 'mm', 2)}</b>. Le signe négatif indique que l’image est renversée.</> };
  const [d2, Op2, f2] = tire([[30, 15, 10], [20, 20, 10], [60, 12, 10], [24, 24, 12], [36, 18, 12], [40, 10, 8], [15, 30, 10]]);
  const q4 = { id: 'l3', type: 'num', q: <>Au banc d’optique, un objet est à <b>{d2}{NB}cm</b> devant une lentille (OA = −{d2}{NB}cm) et son image nette se forme à <b>{Op2}{NB}cm</b> derrière (OA′ = +{Op2}{NB}cm). Calculez la distance focale f′ de la lentille, en <b>cm</b>.</>, unite: 'cm', vrai: f2, csMin: 2,
    aide: 'Relation de conjugaison : 1/f′ = 1/OA′ − 1/OA. Attention : OA est négatif.',
    pieges: [[d2 === Op2 ? -1 : Op2 * d2 / (d2 - Op2), 'Vous avez pris OA = +' + d2 + ' cm : il est négatif (objet avant la lentille), donc 1/f′ = 1/OA′ + 1/' + d2 + '.'], [(d2 + Op2) / 2, 'Une moyenne ne convient pas : il faut additionner les INVERSES, 1/f′ = 1/OA′ + 1/' + d2 + '.']],
    expl: <>1/f′ = 1/OA′ − 1/OA = 1/{Op2} + 1/{d2}, donc f′ = <b>{avecU(f2, 'cm', 2)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > 1e-9); });      // un piège égal à la bonne réponse n'a pas de sens
  return { intro: 'Lentille mince : appliquer la relation de conjugaison et le grandissement avec les bons signes.', questions: [q1, q2, q3, q4],
    retenir: ['Relation de conjugaison : 1/OA′ − 1/OA = 1/f′, avec des grandeurs ALGÉBRIQUES (origine O, sens de la lumière positif).', 'Un objet réel est avant la lentille : OA est NÉGATIF.', 'Grandissement γ = OA′ / OA = A′B′ / AB : γ < 0 image renversée, γ > 0 image droite ; |γ| > 1 agrandie.', 'On additionne les INVERSES des distances, jamais les distances.'] };
}

// ──────────────────────── Familles « L'œil et la loupe » (terminale STL) ────────────────────────
function genOeilAccomm() {
  const D = tire([25, 30, 50, 80]), Dmm = D * 10, f = 1 / (1 / 17 + 1 / Dmm);
  const q1 = { id: 'o0', type: 'num', q: <>Dans le modèle de l’œil réduit, la rétine est à <b>L = 17,0{NB}mm</b> du cristallin. L’œil voit net un objet situé à <b>{D}{NB}cm</b> (soit {Dmm}{NB}mm) : OA = −{Dmm}{NB}mm et OA′ = +17,0{NB}mm. Calculez la distance focale f′ du cristallin (relation de conjugaison 1/OA′ − 1/OA = 1/f′), en <b>mm</b>.</>, unite: 'mm', vrai: f, csMin: 3,
    aide: '1/f′ = 1/OA′ − 1/OA = 1/17,0 + 1/OA en valeur absolue : additionnez les inverses, puis inversez.',
    pieges: [[1 / (1 / 17 - 1 / Dmm), 'Vous avez pris OA = +' + Dmm + ' mm : l’objet est avant le cristallin, OA est négatif ; on additionne 1/17,0 et 1/' + Dmm + '.'], [17, 'C’est la valeur pour un objet à l’infini (œil au repos). Ici l’objet est à ' + D + ' cm : f′ est un peu plus petite.']],
    expl: <>1/f′ = 1/17,0 + 1/{Dmm}, donc f′ = <b>{avecU(f, 'mm', 3)}</b> : inférieure à 17,0 mm, le cristallin s’est bombé (accommodation).</> };
  const AB = tire([10, 20, 30]), th = AB / Dmm * 1000;
  const q2 = { id: 'o1', type: 'num', q: <>Cet objet mesure AB = <b>{AB}{NB}mm</b>. Calculez son diamètre apparent θ ≈ AB / D (petits angles), en <b>mrad</b>.</>, unite: 'mrad', vrai: th, csMin: 2,
    aide: 'AB et D doivent être dans la même unité (mm). Le résultat est en radian : 1 rad = 1000 mrad.',
    pieges: [[AB / D * 1000, 'Vous avez divisé des mm par des cm sans convertir : AB et D dans la même unité.'], [AB / Dmm, 'Valeur correcte, mais en radian : multipliez par 1000 pour des mrad.']],
    expl: <>θ ≈ AB / D = {AB} / {Dmm} = {nb(AB / Dmm, 3)} rad = <b>{avecU(th, 'mrad', 2)}</b>.</> };
  const ok = 0.10 / Dmm >= 3e-4, o3 = melange(['oui : θ est supérieur ou égal à ε ≈ 0,3 mrad', 'non : θ est inférieur à ε ≈ 0,3 mrad', 'oui : l’œil accommode et sépare tout', 'on ne peut pas savoir']);
  const bonne3 = ok ? 'oui : θ est supérieur ou égal à ε ≈ 0,3 mrad' : 'non : θ est inférieur à ε ≈ 0,3 mrad';
  const q3 = { id: 'o2', type: 'qcm', q: <>Deux traits sont séparés de 0,10{NB}mm. Le pouvoir séparateur de l’œil est ε ≈ 3×10⁻⁴{NB}rad = 0,3{NB}mrad. À {D}{NB}cm, l’œil les voit-il séparés ? (θ = 0,10 ÷ {Dmm} = {nb(0.10 / Dmm * 1000, 2)} mrad)</>, options: o3, bonne: o3.indexOf(bonne3),
    aide: 'Deux détails sont séparés si l’angle θ qui les sépare est au moins égal à ε.',
    expl: <>θ = {nb(0.10 / Dmm * 1000, 2)} mrad {ok ? '≥' : '<'} 0,3 mrad : {ok ? 'les traits sont vus séparés.' : 'les traits se confondent ; pour les séparer, il faut se rapprocher (au mieux 25 cm) ou utiliser un instrument.'}</> };
  [q1, q2].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) / Math.abs(q.vrai) > 1e-3); });
  return { intro: 'L’œil réduit : accommodation, diamètre apparent et pouvoir séparateur.', questions: [q1, q2, q3],
    retenir: ['Œil réduit : lentille de focale f′ variable, rétine à L = 17,0 mm ; image nette ⇔ OA′ = L.', 'Objet proche ⇒ f′ diminue (accommodation) : 1/f′ = 1/L + 1/D.', 'θ ≈ AB / D (rad, mêmes unités) ; détails séparés si θ ≥ ε ≈ 3×10⁻⁴ rad.'] };
}
function genOeilLoupe() {
  const [f, d] = tire([[2.5, 2.25], [4, 3.6], [5, 4.5], [8, 7.2]]), G = 25 / f;
  const q1 = { id: 'p0', type: 'num', q: <>Une loupe a une distance focale f′ = <b>{f}{NB}cm</b> ; l’objet est dans son plan focal objet. Calculez son grossissement commercial G = d<sub>m</sub> / f′, avec d<sub>m</sub> = 25{NB}cm (sans unité).</>, unite: '', vrai: G, csMin: 2,
    aide: 'G = dm / f′ : mêmes unités pour d_m et f′ (cm).',
    pieges: [[f / 25, 'Vous avez calculé f′ / dm : le grossissement est dm / f′.']],
    expl: <>G = 25 / {f} = <b>{nb(G, 2)}</b>. Plus f′ est petite, plus G est grand.</> };
  const AB = tire([0.3, 0.5, 0.8]), thp = AB / f;
  const q2 = { id: 'p1', type: 'num', q: <>Le détail observé mesure AB = <b>{AB}{NB}cm</b>, placé dans le plan focal objet. Calculez le diamètre apparent θ′ ≈ AB / f′ de l’image, en <b>rad</b>.</>, unite: 'rad', vrai: thp, csMin: 2,
    aide: 'θ′ ≈ AB / f′, AB et f′ en cm.',
    pieges: [[AB / 25, 'Vous avez divisé par dm = 25 cm : c’est le diamètre apparent à l’œil nu, sans loupe.']],
    expl: <>θ′ ≈ {AB} / {f} = <b>{avecU(thp, 'rad', 2)}</b>. Sans loupe, à 25 cm : θ = {nb(AB / 25, 3)} rad.</> };
  const Op = -d * f / (f - d);
  const q3 = { id: 'p2', type: 'num', q: <>On éloigne un peu l’objet : OA = <b>−{d}{NB}cm</b>, avec f′ = {f}{NB}cm. Calculez la position OA′ de l’image (1/OA′ − 1/OA = 1/f′), en <b>cm</b> (avec son signe).</>, unite: 'cm', vrai: Op, csMin: 2,
    aide: '1/OA′ = 1/f′ + 1/OA avec OA négatif : le résultat est négatif, image virtuelle. Pensez à inverser.',
    pieges: [[-Op, 'Le signe : 1/OA′ est négatif, donc OA′ aussi (image virtuelle, du côté de l’objet).'], [1 / (1 / f + 1 / d), 'Vous avez pris OA = +' + d + ' cm : l’objet est avant la loupe, OA est négatif.']],
    expl: <>1/OA′ = 1/{f} − 1/{d}, donc OA′ = <b>{avecU(Op, 'cm', 2)}</b> : image virtuelle, du côté de l’objet, plus loin que 25 cm : l’œil peut la voir nette en accommodant.</> };
  [q1, q2, q3].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) / Math.abs(q.vrai) > 1e-3); });
  return { intro: 'La loupe : grossissement, diamètre apparent de l’image, position de l’image.', questions: [q1, q2, q3],
    retenir: ['Objet dans le plan focal objet : image à l’infini, œil au repos.', 'G = θ′ / θ = dm / f′ (dm = 25 cm) : plus f′ est petite, plus G est grand.', 'Objet entre O et F : OA′ < 0, image virtuelle ; l’œil la voit nette si |OA′| ≥ 25 cm.'] };
}

// ──────────────────────── Familles « Le microscope » (terminale STL) ────────────────────────
function genMicroGrossissement() {
  const f1 = tire([20, 10, 8, 5]), f2 = tire([50, 25, 20]), g = 160 / f1, go = 250 / f2, G = g * go;
  const q1 = { id: 'm0', type: 'num', q: <>Un microscope a un intervalle optique Δ = 160{NB}mm et un objectif de distance focale f₁′ = <b>{f1}{NB}mm</b> ; il est mis au point. Calculez la valeur absolue du grandissement de l’objectif |γ₁| = Δ / f₁′ (sans unité).</>, unite: '', vrai: g, csMin: 2,
    aide: 'Δ et f₁′ sont en mm : le rapport est sans unité.',
    pieges: [[f1 / 160, 'Vous avez calculé f₁′ / Δ : le grandissement est Δ / f₁′.']],
    expl: <>|γ₁| = Δ / f₁′ = 160 / {f1} = <b>{nb(g, 2)}</b> : l’image intermédiaire est {nb(g, 2)} fois plus grande que l’objet, et renversée.</> };
  const q2 = { id: 'm1', type: 'num', q: <>L’oculaire a une distance focale f₂′ = <b>{f2}{NB}mm</b>. Calculez son grossissement G<sub>oc</sub> = d<sub>m</sub> / f₂′, avec d<sub>m</sub> = 250{NB}mm (sans unité).</>, unite: '', vrai: go, csMin: 2,
    aide: 'L’oculaire est une loupe : G = dm / f′, dm et f₂′ dans la même unité.',
    pieges: [[f2 / 250, 'Vous avez calculé f₂′ / dm : le grossissement est dm / f₂′.'], [25 / f2, 'Vous avez pris dm = 25 mm : dm vaut 250 mm (25 cm).']],
    expl: <>G<sub>oc</sub> = 250 / {f2} = <b>{nb(go, 2)}</b>.</> };
  const q3 = { id: 'm2', type: 'num', q: <>Avec |γ₁| = {nb(g, 2)} et G<sub>oc</sub> = {nb(go, 2)}, calculez le grossissement du microscope G = |γ₁| × G<sub>oc</sub> (sans unité).</>, unite: '', vrai: G, csMin: 2,
    aide: 'Les deux étages se multiplient : G = |γ₁| × dm / f₂′.',
    pieges: [[g + go, 'Vous avez additionné : les deux grossissements se multiplient.'], [g, 'Vous avez oublié l’oculaire : il faut multiplier par G_oc.']],
    expl: <>G = {nb(g, 2)} × {nb(go, 2)} = <b>{nb(G, 2)}</b>. On retrouve G = Δ·dm / (f₁′ f₂′) = 160 × 250 / ({f1} × {f2}).</> };
  [q1, q2, q3].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) / Math.abs(q.vrai) > 1e-3); });
  return { intro: 'Le microscope : grandissement de l’objectif, grossissement de l’oculaire, grossissement total.', questions: [q1, q2, q3],
    retenir: ['|γ₁| = Δ / f₁′ (mise au point faite), Δ = 160 mm.', 'Oculaire = loupe : G<sub>oc</sub> = dm / f₂′, dm = 250 mm.', 'G = |γ₁| × dm / f₂′ = Δ·dm / (f₁′ f₂′) : les deux étages se multiplient.'] };
}
function genMicroMiseAuPoint() {
  const f1 = tire([20, 10, 8, 5]), O1A1 = f1 + 160, p = f1 * O1A1 / 160, AB = tire([10, 20, 30, 40]), A = 160 / f1 * AB / 1000;
  const q1 = { id: 'n0', type: 'num', q: <>Un microscope (Δ = 160{NB}mm) a un objectif de distance focale f₁′ = <b>{f1}{NB}mm</b>. Il est mis au point : A₁ est en F₂, donc F₁′F₂ = Δ. Calculez la distance O₁A₁ entre l’objectif et l’image intermédiaire, en <b>mm</b>.</>, unite: 'mm', vrai: O1A1, csMin: 2,
    aide: 'O₁A₁ = O₁F₁′ + F₁′F₂ = f₁′ + Δ.',
    pieges: [[160, 'Vous avez oublié O₁F₁′ : Δ se mesure à partir de F₁′, pas de O₁.'], [160 - f1, 'Vous avez soustrait f₁′ : F₁′ est entre O₁ et F₂, on additionne.']],
    expl: <>O₁A₁ = f₁′ + Δ = {f1} + 160 = <b>{avecU(O1A1, 'mm', 3)}</b>.</> };
  const q2 = { id: 'n1', type: 'num', q: <>L’objectif (f₁′ = {f1}{NB}mm) doit donner une image à OA′ = +{O1A1}{NB}mm. Calculez la distance objet–objectif |OA| avec la relation de conjugaison 1/OA′ − 1/OA = 1/f′ (OA est négatif ; donnez |OA|), en <b>mm</b>.</>, unite: 'mm', vrai: p, csMin: 3,
    aide: '1/OA = 1/OA′ − 1/f′ : le résultat est négatif ; la distance est sa valeur absolue.',
    pieges: [[O1A1 * f1 / (O1A1 + f1), 'Vous avez additionné 1/OA′ et 1/f′ : 1/OA = 1/OA′ − 1/f′.'], [-p, 'Le signe : OA est négatif, mais la question demande la distance, positive.']],
    expl: <>1/OA = 1/{O1A1} − 1/{f1}, donc OA = −{nb(p, 3)} mm : l’objet est à <b>{avecU(p, 'mm', 3)}</b> de l’objectif, juste au-delà de son foyer objet ({f1} mm).</> };
  const q3 = { id: 'n2', type: 'num', q: <>L’objet observé mesure <b>{AB}{NB}µm</b>. Calculez la taille de l’image intermédiaire A₁B₁ = (Δ / f₁′) × AB, en <b>mm</b>.</>, unite: 'mm', vrai: A, csMin: 2,
    aide: '|γ₁| = Δ / f₁′ ; convertissez AB en mm (1 mm = 1000 µm).',
    pieges: [[A * 1000, 'Valeur correcte en µm ; l’énoncé demande des mm.'], [AB / 1000 * f1 / 160, 'Vous avez divisé par |γ₁| : l’image est agrandie, on multiplie.']],
    expl: <>|γ₁| = 160 / {f1} = {nb(160 / f1, 2)} ; A₁B₁ = {nb(160 / f1, 2)} × {AB} µm = <b>{avecU(A, 'mm', 2)}</b>.</> };
  [q1, q2, q3].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) / Math.abs(q.vrai) > 1e-3); });
  return { intro: 'Le microscope mis au point : position de l’image intermédiaire, position de l’objet, taille de l’image intermédiaire.', questions: [q1, q2, q3],
    retenir: ['Mise au point : A₁ en F₂ ; O₁A₁ = f₁′ + Δ.', 'La distance objet–objectif se déduit de la relation de conjugaison : elle dépend de f₁′.', 'A₁B₁ = |γ₁| × AB avec |γ₁| = Δ / f₁′.'] };
}

// ──────────────────────── Familles « La lunette astronomique » (terminale STL) ────────────────────────
function genLunetteGrossissement() {
  const f1 = tire([600, 800, 1000, 1200]), f2 = tire([10, 20, 25, 40]), G = f1 / f2, th = tire([1.5, 2, 3, 4]);
  const q1 = { id: 'u0', type: 'num', q: <>Une lunette afocale a un objectif de distance focale f₁′ = <b>{f1}{NB}mm</b> et un oculaire de distance focale f₂′ = <b>{f2}{NB}mm</b>. Calculez son grossissement G = f₁′ / f₂′ (sans unité).</>, unite: '', vrai: G, csMin: 2,
    aide: 'Les deux focales sont en mm : le rapport est sans unité.',
    pieges: [[f2 / f1, 'Vous avez calculé f₂′ / f₁′ : le grossissement est f₁′ / f₂′.'], [f1 + f2, 'f₁′ + f₂′ est la distance O₁O₂ entre les lentilles, pas le grossissement.']],
    expl: <>G = f₁′ / f₂′ = {f1} / {f2} = <b>{nb(G, 2)}</b>.</> };
  const q2 = { id: 'u1', type: 'num', q: <>Pour que cette lunette soit afocale (F₁′ et F₂ confondus), quelle distance O₁O₂ doit séparer l’objectif et l’oculaire ? En <b>mm</b>.</>, unite: 'mm', vrai: f1 + f2, csMin: 3,
    aide: 'O₁O₂ = O₁F₁′ + F₂O₂ = f₁′ + f₂′.',
    pieges: [[f1 - f2, 'Vous avez soustrait : F₁′ est entre les deux lentilles, on additionne.'], [f1, 'Vous avez oublié f₂′ : O₁O₂ = f₁′ + f₂′.']],
    expl: <>O₁O₂ = f₁′ + f₂′ = {f1} + {f2} = <b>{avecU(f1 + f2, 'mm', 4)}</b>.</> };
  const th2 = th * G;
  const q3 = { id: 'u2', type: 'num', q: <>L’astre observé a un diamètre apparent θ₀ = <b>{nb(th, 1)}{NB}mrad</b>. Calculez le diamètre apparent θ₂ de l’image définitive, θ₂ = G × θ₀, en <b>mrad</b>.</>, unite: 'mrad', vrai: th2, csMin: 2,
    aide: 'θ₂ = G × θ₀ avec G = f₁′ / f₂′ ; gardez l’unité mrad.',
    pieges: [[th / G, 'Vous avez divisé θ₀ par G : l’image est vue sous un angle plus grand, on multiplie.'], [th2 / 1000, 'Valeur correcte en radian ; l’énoncé demande des mrad.']],
    expl: <>θ₂ = G × θ₀ = {nb(G, 2)} × {nb(th, 1)} = <b>{avecU(th2, 'mrad', 2)}</b>.</> };
  [q1, q2, q3].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) / Math.abs(q.vrai) > 1e-3); });
  return { intro: 'La lunette astronomique : grossissement, distance entre les lentilles, diamètre apparent de l’image.', questions: [q1, q2, q3],
    retenir: ['Lunette afocale : F₁′ = F₂, O₁O₂ = f₁′ + f₂′.', 'G = θ₂ / θ₀ = f₁′ / f₂′ : objectif de grande focale, oculaire de petite focale.', 'θ₂ = G × θ₀ : même unité d’angle pour θ₀ et θ₂.'] };
}
function genLunetteImage() {
  const f1 = tire([600, 800, 1000, 1200]), f2 = tire([10, 20, 25, 40]), th = tire([1.5, 2, 3, 4]), A = f1 * th / 1000;
  const q1 = { id: 'w0', type: 'num', q: <>Un astre de diamètre apparent θ₀ = <b>{nb(th, 1)}{NB}mrad</b> est observé avec un objectif de distance focale f₁′ = <b>{f1}{NB}mm</b>. Calculez la taille de l’image intermédiaire A₁B₁ = f₁′ × θ₀ (θ₀ en radian), en <b>mm</b>.</>, unite: 'mm', vrai: A, csMin: 2,
    aide: 'Convertissez θ₀ en radian : 1 mrad = 0,001 rad. Puis multipliez par f₁′ (en mm).',
    pieges: [[A * 1000, 'Vous avez oublié de convertir θ₀ de mrad en rad (facteur 1000).'], [th / 1000 / f1, 'Vous avez divisé : A₁B₁ = f₁′ × θ₀.']],
    expl: <>θ₀ = {nb(th, 1)} mrad = {nb(th / 1000, 4)} rad ; A₁B₁ = {f1} × {nb(th / 1000, 4)} = <b>{avecU(A, 'mm', 2)}</b>.</> };
  const t2 = A / f2 * 1000;
  const q2 = { id: 'w1', type: 'num', q: <>L’oculaire a une distance focale f₂′ = <b>{f2}{NB}mm</b> et l’image intermédiaire est dans son plan focal objet. Calculez le diamètre apparent θ₂ ≈ A₁B₁ / f₂′ de l’image définitive (A₁B₁ = {nb(A, 2)} mm), en <b>mrad</b>.</>, unite: 'mrad', vrai: t2, csMin: 2,
    aide: 'A₁B₁ et f₂′ en mm : le résultat est en radian, puis × 1000 pour des mrad.',
    pieges: [[t2 / 1000, 'Valeur correcte en radian ; l’énoncé demande des mrad.'], [A / f1 * 1000, 'Vous avez divisé par f₁′ : c’est θ₀. Avec l’oculaire, on divise par f₂′.']],
    expl: <>θ₂ ≈ {nb(A, 2)} / {f2} = {nb(A / f2, 4)} rad = <b>{avecU(t2, 'mrad', 2)}</b>.</> };
  const pp = f2 * 400 / (400 + f2);
  const q3 = { id: 'w2', type: 'num', q: <>Un observateur myope veut que l’image définitive soit virtuelle à <b>40{NB}cm</b> de l’oculaire (O₂A₂ = −400{NB}mm), avec f₂′ = {f2}{NB}mm. Calculez la distance |O₂A₁| de l’image intermédiaire à l’oculaire (relation de conjugaison 1/O₂A₂ − 1/O₂A₁ = 1/f₂′, avec O₂A₁ négatif), en <b>mm</b>.</>, unite: 'mm', vrai: pp, csMin: 3,
    aide: '1/O₂A₁ = 1/O₂A₂ − 1/f₂′ = −1/400 − 1/{f2} : le résultat est négatif ; donnez la distance (valeur positive).',
    pieges: [[f2, 'C’est la valeur pour une image à l’infini (lunette afocale). Pour une image à 40 cm, A₁ est un peu plus près de l’oculaire.'], [f2 * 400 / (400 - f2), 'Vous avez pris O₂A₂ = +400 mm : l’image est virtuelle, O₂A₂ est négatif.']],
    expl: <>1/O₂A₁ = −1/400 − 1/{f2}, donc O₂A₁ = −{nb(pp, 2)} mm : A₁ est à <b>{avecU(pp, 'mm', 3)}</b> de l’oculaire, un peu moins que f₂′ = {f2} mm : on rapproche l’oculaire de {nb(f2 - pp, 2)} mm par rapport au réglage afocale.</> };
  [q1, q2, q3].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) / Math.abs(q.vrai) > 1e-3); });
  return { intro: 'La lunette astronomique : image intermédiaire, diamètre apparent de l’image, réglage pour un œil myope.', questions: [q1, q2, q3],
    retenir: ['Objet à l’infini : A₁B₁ = f₁′ × θ₀ dans le plan focal image de l’objectif (θ₀ en rad).', 'θ₂ ≈ A₁B₁ / f₂′ (A₁ en F₂).', 'Image virtuelle à distance finie : A₁ est plus près de l’oculaire que F₂ (relation de conjugaison).'] };
}

// ──────────────────────── Familles « Vecteurs » : somme et différence ────────────────────────
const sg = x => (x < 0 ? '−' + Math.abs(x) : String(x));
function vecAleatoires() {
  const r = () => { let v; do { v = [tire([-4, -3, -2, -1, 1, 2, 3, 4]), tire([-4, -3, -2, -1, 0, 1, 2, 3, 4])]; } while (v[0] === 0 && v[1] === 0); return v; };
  return [r(), r()];
}
function genSomme() {
  let a, b;
  do { [a, b] = vecAleatoires(); } while ((a[0] + b[0] === 0 && a[1] + b[1] === 0) || (a[0] === b[0] && a[1] === b[1]) || Math.abs(a[0] + b[0]) > 4 || Math.abs(a[1] + b[1]) > 4);       // la somme reste dans la grille (±4 carreaux)
  const sx = a[0] + b[0], sy = a[1] + b[1], n = Math.hypot(sx, sy), na = Math.hypot(a[0], a[1]), nb2 = Math.hypot(b[0], b[1]);
  const opts = melange(['à l’extrémité de ⟦F|1⟧ (les deux flèches bout à bout)', 'au même point O que ⟦F|1⟧, puis on additionne les longueurs', 'à l’extrémité de ⟦F|1⟧, mais en retournant le sens de ⟦F|2⟧', 'n’importe où : seules les longueurs comptent']);
  const q0 = { id: 'v0', type: 'qcm', q: <>Pour construire graphiquement le vecteur somme <b><Vec n="F" i="1"/> + <Vec n="F" i="2"/></b>, on place l’origine de <Vec n="F" i="2"/>…</>, options: opts, bonne: opts.indexOf('à l’extrémité de ⟦F|1⟧ (les deux flèches bout à bout)'),
    aide: 'On met les vecteurs « bout à bout » : le vecteur somme va de l’origine de ⟦F|1⟧ à l’extrémité de ⟦F|2⟧.', expl: <>On trace <Vec n="F" i="2"/> à partir de l’extrémité de <Vec n="F" i="1"/> : la somme <Vec n="F" i="1"/> + <Vec n="F" i="2"/> est la flèche qui va de l’origine de <Vec n="F" i="1"/> à l’extrémité de <Vec n="F" i="2"/>. Les deux sens (<Vec n="F" i="1"/> puis <Vec n="F" i="2"/>, ou <Vec n="F" i="2"/> puis <Vec n="F" i="1"/>) donnent le même résultat.</> };
  const q1 = { id: 'v1', type: 'num', q: <>Lisez sur la grille les coordonnées de <Vec n="F" i="1"/> et de <Vec n="F" i="2"/> (en carreaux : vers la droite et vers le haut, c’est positif). Quelle est la coordonnée <b>horizontale</b> de <Vec n="F" i="1"/> + <Vec n="F" i="2"/> ?</>, unite: 'N', vrai: sx,
    aide: 'Pour lire une coordonnée, on compte les carreaux entre O et la pointe de la flèche. Puis on additionne les coordonnées de même nom : x = x₁ + x₂.', pieges: [[a[0] - b[0], 'Vous avez soustrait au lieu d’additionner : pour une somme, x = x₁ + x₂.']],
    expl: <>Lecture : <Vec n="F" i="1"/> ({sg(a[0])} ; {sg(a[1])}) et <Vec n="F" i="2"/> ({sg(b[0])} ; {sg(b[1])}). x = x₁ + x₂ = {sg(a[0])} + ({sg(b[0])}) = <b>{sg(sx)} N</b>.</> };
  const q2 = { id: 'v2', type: 'num', q: <>Quelle est la coordonnée <b>verticale</b> de <Vec n="F" i="1"/> + <Vec n="F" i="2"/> ?</>, unite: 'N', vrai: sy,
    aide: 'y = y₁ + y₂.', pieges: [[a[1] - b[1], 'Vous avez soustrait au lieu d’additionner : pour une somme, y = y₁ + y₂.']],
    expl: <>y = y₁ + y₂ = {sg(a[1])} + ({sg(b[1])}) = <b>{sg(sy)} N</b>.</> };
  const q3 = { id: 'v3', type: 'num', q: <>Calculez la valeur (la norme) de <Vec n="F" i="1"/> + <Vec n="F" i="2"/>, en newtons, à partir de ses deux coordonnées.</>, unite: 'N', vrai: n, csMin: 3,
    aide: 'Théorème de Pythagore : ‖F‖ = √(x² + y²). Attention : la norme de la somme n’est pas la somme des normes.',
    pieges: [[na + nb2, 'Vous avez additionné les normes de ⟦F|1⟧ et de ⟦F|2⟧. Ce n’est pas la norme de la somme : il faut d’abord additionner les coordonnées, puis calculer √(x² + y²).']],
    expl: <>‖<Vec n="F" i="1"/> + <Vec n="F" i="2"/>‖ = √(x² + y²) = √(({sg(sx)})² + ({sg(sy)})²) = √{sx * sx + sy * sy} = <b>{avecU(n, 'N', 3)}</b>. Pour comparer : ‖<Vec n="F" i="1"/>‖ + ‖<Vec n="F" i="2"/>‖ = {nb(na + nb2, 3)} N, ce qui est différent (sauf si <Vec n="F" i="1"/> et <Vec n="F" i="2"/> ont le même sens).</> };
  return { intro: 'Somme de deux vecteurs : on additionne les coordonnées, puis on calcule la norme avec Pythagore.', figure: <FigureVecteurs a={a} b={b} nomA="F₁" nomB="F₂" unite="N"/>, questions: [q0, q1, q2, q3],
    retenir: ['Somme : on additionne les coordonnées de même nom (x₁ + x₂ ; y₁ + y₂).', 'Graphiquement : on place les flèches bout à bout.', 'La norme d’une somme n’est pas la somme des normes : on la calcule avec √(x² + y²).'] };
}
function genDifference() {
  let a, b;
  do { [a, b] = vecAleatoires(); } while ((a[0] === b[0] && a[1] === b[1]) || Math.abs(b[0] - a[0]) > 4 || Math.abs(b[1] - a[1]) > 4);       // Δv reste dans la grille (±4 carreaux)
  const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy), na = Math.hypot(a[0], a[1]), nb2 = Math.hypot(b[0], b[1]);
  const bon = 'de l’extrémité de ⟦v|1⟧ à l’extrémité de ⟦v|2⟧';
  const opts = melange([bon, 'de l’extrémité de ⟦v|2⟧ à l’extrémité de ⟦v|1⟧', 'de O à l’extrémité de ⟦v|2⟧', 'de O à l’extrémité de ⟦v|1⟧']);
  const q0 = { id: 'd0', type: 'qcm', q: <>Un mobile a la vitesse <Vec n="v" i="1"/> puis la vitesse <Vec n="v" i="2"/> (vecteurs tracés depuis le même point O). Le vecteur variation de vitesse <Vec n="Δv"/> = <Vec n="v" i="2"/> − <Vec n="v" i="1"/> est la flèche qui va…</>, options: opts, bonne: opts.indexOf(bon),
    aide: '⟦v|2⟧ − ⟦v|1⟧ est ce qu’il faut AJOUTER à ⟦v|1⟧ pour obtenir ⟦v|2⟧ : il va donc de la pointe de ⟦v|1⟧ à la pointe de ⟦v|2⟧.', expl: <>Comme <Vec n="v" i="1"/> + <Vec n="Δv"/> = <Vec n="v" i="2"/>, <Vec n="Δv"/> relie l’extrémité de <Vec n="v" i="1"/> à l’extrémité de <Vec n="v" i="2"/>. L’ordre compte : la flèche en sens inverse serait <Vec n="v" i="1"/> − <Vec n="v" i="2"/>.</> };
  const q1 = { id: 'd1', type: 'num', q: <>Lisez sur la grille les coordonnées de <Vec n="v" i="1"/> et de <Vec n="v" i="2"/> (1 carreau = 1 m·s⁻¹ ; vers la droite et vers le haut, c’est positif). Quelle est la coordonnée <b>horizontale</b> de <Vec n="Δv"/> = <Vec n="v" i="2"/> − <Vec n="v" i="1"/> ?</>, unite: 'm·s⁻¹', vrai: dx,
    aide: 'Comptez les carreaux pour lire x₁ et x₂. Puis x = x₂ − x₁ : « arrivée » moins « départ ». Attention aux signes : soustraire un nombre négatif, c’est ajouter.', pieges: [[a[0] - b[0], 'Le signe est inversé : vous avez calculé ⟦v|1⟧ − ⟦v|2⟧. On demande ⟦v|2⟧ − ⟦v|1⟧ (arrivée moins départ).'], [a[0] + b[0], 'Vous avez additionné : pour une différence, x = x₂ − x₁.']],
    expl: <>Lecture : <Vec n="v" i="1"/> ({sg(a[0])} ; {sg(a[1])}) et <Vec n="v" i="2"/> ({sg(b[0])} ; {sg(b[1])}). x = x₂ − x₁ = ({sg(b[0])}) − ({sg(a[0])}) = <b>{sg(dx)} m·s⁻¹</b>.</> };
  const q2 = { id: 'd2', type: 'num', q: <>Quelle est la coordonnée <b>verticale</b> de <Vec n="Δv"/> ?</>, unite: 'm·s⁻¹', vrai: dy,
    aide: 'y = y₂ − y₁.', pieges: [[a[1] - b[1], 'Le signe est inversé : vous avez calculé ⟦v|1⟧ − ⟦v|2⟧.'], [a[1] + b[1], 'Vous avez additionné : pour une différence, y = y₂ − y₁.']],
    expl: <>y = y₂ − y₁ = ({sg(b[1])}) − ({sg(a[1])}) = <b>{sg(dy)} m·s⁻¹</b>.</> };
  const q3 = { id: 'd3', type: 'num', q: <>Calculez la valeur (la norme) de <Vec n="Δv"/>, en m·s⁻¹.</>, unite: 'm·s⁻¹', vrai: n, csMin: 3,
    aide: 'Pythagore avec les coordonnées de ⟦Δv⟧. Attention : ‖⟦v|2⟧ − ⟦v|1⟧‖ n’est pas ‖⟦v|2⟧‖ − ‖⟦v|1⟧‖.',
    pieges: [[Math.abs(nb2 - na), 'Vous avez soustrait les normes de ⟦v|1⟧ et de ⟦v|2⟧. Ce n’est pas la norme de ⟦Δv⟧ : il faut d’abord soustraire les coordonnées, puis calculer √(x² + y²).']],
    expl: <>‖<Vec n="Δv"/>‖ = √(x² + y²) = √(({sg(dx)})² + ({sg(dy)})²) = √{dx * dx + dy * dy} = <b>{avecU(n, 'm·s⁻¹', 3)}</b>. (À comparer avec |‖<Vec n="v" i="2"/>‖ − ‖<Vec n="v" i="1"/>‖| = {nb(Math.abs(nb2 - na), 3)} m·s⁻¹ : ce n’est pas la même chose, sauf si <Vec n="v" i="1"/> et <Vec n="v" i="2"/> ont la même direction et le même sens.)</> };
  return { intro: 'Différence de deux vecteurs : on soustrait les coordonnées (arrivée − départ), puis on calcule la norme.', figure: <FigureVecteurs a={a} b={b} nomA="v₁" nomB="v₂" unite="m·s⁻¹"/>, questions: [q0, q1, q2, q3],
    retenir: ['Différence ⟦Δv⟧ = ⟦v|2⟧ − ⟦v|1⟧ : on soustrait les coordonnées (x₂ − x₁ ; y₂ − y₁).', 'Graphiquement, avec les deux vecteurs au même point O : ⟦Δv⟧ va de la pointe de ⟦v|1⟧ à la pointe de ⟦v|2⟧.', 'Inverser l’ordre change le signe : ⟦v|1⟧ − ⟦v|2⟧ = −(⟦v|2⟧ − ⟦v|1⟧).'] };
}

// ───────────── Effet Doppler (TSTL) : du décalage à la vitesse, avec les conversions d'unités ─────────────
function genDoppler() {
  const c = 340, fe = tire([25000, 40000]), feK = fe / 1000;
  const v1 = tire([0.2, 0.3, 0.4, 0.6, 0.8, 1.0, 1.2]);
  const d1 = fe * v1 / c;
  const q1 = { id: 'd0', type: 'num', q: <>Un émetteur ultrasonore de fréquence <b>{feK}{NB}kHz</b> se déplace à <b>{nb(v1, 2)}{NB}m/s</b> vers un récepteur fixe (c = 340{NB}m/s). Calculez le décalage Doppler δf = f<sub>e</sub> × v / c, en <b>Hz</b>.</>, unite: 'Hz', vrai: d1, csMin: 2,
    aide: 'Convertissez f_e en hertz (1 kHz = 1 000 Hz) avant de calculer : δf = f_e × v / c.',
    pieges: [[feK * v1 / c, 'Vous avez gardé f_e en kHz : le résultat est alors en kHz. Convertissez d’abord f_e en hertz.'], [c * v1 / fe, 'Le quotient est inversé : δf = f_e × v / c, pas c × v / f_e.']],
    expl: <>f<sub>e</sub> = {feK} kHz = {fe} Hz, donc δf = {fe} × {nb(v1, 2)} / 340 = <b>{avecU(d1, 'Hz', 3)}</b>. Hypothèse : v ≪ c (ici v / c ≈ {(v1 / c).toExponential(1).replace('.', ',').replace('e-', ' × 10⁻')}).</> };
  const v2 = tire([0.25, 0.35, 0.5, 0.7, 0.9, 1.1]), fe2 = tire([25000, 40000]);
  const d2 = Number((fe2 * v2 / c).toPrecision(3)), vr2 = c * d2 / fe2;
  const q2 = { id: 'd1', type: 'num', q: <>Sur le spectre du signal reçu, on lit un décalage <b>δf = {nb(d2, 3)}{NB}Hz</b> pour un émetteur de fréquence <b>{fe2 / 1000}{NB}kHz</b> placé sur un chariot qui s’approche d’un récepteur fixe (c = 340{NB}m/s). Calculez la vitesse v du chariot, en <b>m/s</b>.</>, unite: 'm/s', vrai: vr2, csMin: 2,
    aide: 'Isolez v dans δf = f_e × v / c : v = c × δf / f_e, avec δf et f_e dans la même unité (le hertz).',
    pieges: [[c * d2 / (fe2 / 1000), 'f_e est resté en kHz alors que δf est en Hz : mettez les deux en hertz.'], [c * fe2 / d2, 'Le rapport est inversé : v = c × δf / f_e.'], [d2 / fe2, 'Il manque la célérité c : δf / f_e vaut v / c, c’est un nombre sans unité.']],
    expl: <>v = c × δf / f<sub>e</sub> = 340 × {nb(d2, 3)} / {fe2} = <b>{avecU(vr2, 'm/s', 3)}</b>.</> };
  const sens = tire(['approche', 'eloigne']), v3 = tire([0.3, 0.5, 0.8, 1.0]), fe3 = tire([25000, 40000]);
  const fr3 = Math.round(sens === 'approche' ? fe3 * c / (c - v3) : fe3 * c / (c + v3));
  const d3 = Math.abs(fr3 - fe3);
  const q3 = { id: 'd2', type: 'num', q: <>Un émetteur de fréquence <b>{fe3}{NB}Hz</b> est fixé sur un chariot qui {sens === 'approche' ? 's’approche d’' : 's’éloigne d’'}un récepteur fixe. Le spectre du signal reçu a son pic à <b>{fr3}{NB}Hz</b>. Calculez le décalage Doppler δf = |f<sub>r</sub> − f<sub>e</sub>|, en <b>Hz</b>.</>, unite: 'Hz', vrai: d3, csMin: 2,
    aide: 'δf est une valeur absolue : toujours positive, quel que soit le sens du mouvement.',
    pieges: [[fe3 - fr3 === d3 ? NaN : fe3 - fr3, 'Le décalage Doppler est défini avec une valeur absolue : il est positif. Le signe de f_r − f_e dit seulement si l’émetteur s’approche ou s’éloigne.']],
    expl: <>δf = |{fr3} − {fe3}| = <b>{d3}{NB}Hz</b>. {sens === 'approche' ? 'f_r > f_e : l’émetteur se rapproche.' : 'f_r < f_e : l’émetteur s’éloigne.'}</> };
  const vr4 = c * d3 / fe3;
  const q4 = { id: 'd3', type: 'num', q: <>Avec ce décalage (δf = {d3}{NB}Hz) et f<sub>e</sub> = {fe3}{NB}Hz, calculez la vitesse du chariot (c = 340{NB}m/s), en <b>m/s</b>.</>, unite: 'm/s', vrai: vr4, csMin: 2,
    aide: 'v = c × δf / f_e.',
    pieges: [[c * fe3 / d3, 'Le rapport est inversé : v = c × δf / f_e.'], [c * d3 / (fe3 / 1000), 'f_e doit être en hertz comme δf.']],
    expl: <>v = c × δf / f<sub>e</sub> = 340 × {d3} / {fe3} = <b>{avecU(vr4, 'm/s', 3)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > 1e-9); });
  return { intro: 'Effet Doppler : calculer un décalage, puis la vitesse, en gardant des unités cohérentes (hertz).', questions: [q1, q2, q3, q4],
    retenir: ['Décalage Doppler : δf = |f_r − f_e| ; si v ≪ c, δf = f_e × v / c.', 'On en tire la vitesse : v = c × δf / f_e, avec δf et f_e dans la même unité (hertz).', 'Se rapproche ⇒ f_r > f_e ; s’éloigne ⇒ f_r < f_e ; δf est toujours positif.'] };
}

// ───────────── Effet Doppler (TG) : établir et exploiter l'expression, son et lumière ─────────────
function genDopplerTG() {
  const c = 340, fe = tire([400, 500, 800, 1000]), v = tire([17, 34, 51, 68]);
  const lamA = (c - v) / fe;
  const q1 = { id: 'g0', type: 'num', q: <>Un émetteur sonore de fréquence <b>{fe}{NB}Hz</b> avance à <b>{v}{NB}m/s</b> vers un observateur fixe (c = 340{NB}m/s). Entre deux fronts consécutifs, l’émetteur parcourt v × T<sub>e</sub>. Calculez la distance entre deux fronts devant l’émetteur, λ<sub>A</sub> = (c − v) × T<sub>e</sub>, en <b>m</b>.</>, unite: 'm', vrai: lamA, csMin: 3,
    aide: 'T_e = 1 / f_e ; λ_A = (c − v) / f_e.',
    pieges: [[(c + v) / fe, 'Devant l’émetteur on soustrait : le front suivant part plus près du précédent ; (c + v) est la valeur derrière l’émetteur.'], [c / fe, 'C’est la longueur d’onde émise, avec un émetteur immobile.']],
    expl: <>T<sub>e</sub> = 1 / {fe} s, donc λ<sub>A</sub> = (340 − {v}) / {fe} = <b>{avecU(lamA, 'm', 3)}</b>.</> };
  const fA = c / lamA;
  const q2 = { id: 'g1', type: 'num', q: <>La célérité de l’onde ne dépend pas de l’émetteur : l’observateur situé devant reçoit les fronts à c = 340{NB}m/s avec la longueur d’onde λ<sub>A</sub> = {nb(lamA, 4)}{NB}m. Calculez la fréquence qu’il reçoit, f<sub>A</sub> = c / λ<sub>A</sub>, en <b>Hz</b>.</>, unite: 'Hz', vrai: fA, csMin: 3,
    aide: 'f_A = c / λ_A.',
    pieges: [[fe, 'C’est la fréquence émise : la fréquence reçue est différente dès qu’il y a un mouvement relatif.'], [c / ((c + v) / fe), 'Vous avez utilisé la longueur d’onde derrière l’émetteur : devant, λ est plus petite.']],
    expl: <>f<sub>A</sub> = c / λ<sub>A</sub> = 340 / {nb(lamA, 4)} = <b>{avecU(fA, 'Hz', 4)}</b>, supérieure à f<sub>e</sub> = {fe} Hz. On retrouve f<sub>A</sub> = f<sub>e</sub> / (1 − v / c).</> };
  const fB = fe / (1 + v / c);
  const q3 = { id: 'g2', type: 'num', q: <>Pour le même émetteur ({fe}{NB}Hz, v = {v}{NB}m/s), un observateur fixe est placé <b>derrière</b> lui. Calculez la fréquence reçue f<sub>B</sub> = f<sub>e</sub> / (1 + v / c), en <b>Hz</b>.</>, unite: 'Hz', vrai: fB, csMin: 3, tolRel: 0.002,
    aide: 'Derrière l’émetteur : λ_B = (c + v) T_e, donc f_B = f_e / (1 + v / c).',
    pieges: [[fe / (1 - v / c), 'Vous avez utilisé la formule de devant (1 − v / c) : derrière, c’est 1 + v / c.'], [fe * (1 - v / c), 'Cette expression n’est qu’une approximation de f_e / (1 + v / c), valable si v ≪ c ; avec ce rapport v / c elle ne convient pas.']],
    expl: <>f<sub>B</sub> = {fe} / (1 + {v} / 340) = <b>{avecU(fB, 'Hz', 4)}</b>, inférieure à f<sub>e</sub> : l’émetteur s’éloigne de cet observateur.</> };
  const lamL = tire([532, 633, 650]), vL = tire([0.2, 0.5, 1.0, 2.0]);
  const dL = vL / (lamL * 1e-9) / 1e6;
  const q4 = { id: 'g3', type: 'num', q: <>Une diode laser de longueur d’onde <b>{lamL}{NB}nm</b> est fixée sur un chariot qui roule à <b>{nb(vL, 2)}{NB}m/s</b> vers un récepteur fixe (c = 3,00 × 10⁸{NB}m/s). Calculez le décalage Doppler δf = f<sub>e</sub> × v / c, avec f<sub>e</sub> = c / λ, en <b>MHz</b>.</>, unite: 'MHz', vrai: dL, csMin: 2,
    aide: 'f_e = c / λ (λ en mètres), puis δf = f_e × v / c ; vous pouvez simplifier : δf = v / λ. 1 MHz = 10⁶ Hz.',
    pieges: [[dL * 1e6, 'Le résultat est à donner en mégahertz : divisez par 10⁶.'], [vL / lamL / 1e6, 'λ doit être en mètres : 1 nm = 10⁻⁹ m.']],
    expl: <>f<sub>e</sub> = c / λ = 3,00 × 10⁸ / ({lamL} × 10⁻⁹) ≈ {nb(3e8 / (lamL * 1e-9), 3)} Hz, donc δf = f<sub>e</sub> × v / c = v / λ = <b>{avecU(dL, 'MHz', 3)}</b> (le décalage relatif δf / f<sub>e</sub> = v / c est minuscule, mais f<sub>e</sub> est énorme).</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > 1e-9); });
  return { intro: 'Effet Doppler : établir l’expression de la fréquence reçue devant et derrière un émetteur mobile, puis l’appliquer au son et à la lumière.', questions: [q1, q2, q3, q4],
    retenir: ['Devant : λ_A = (c − v) T_e, donc f_A = f_e / (1 − v / c) ; derrière : f_B = f_e / (1 + v / c).', 'Si v ≪ c : δf ≈ f_e × v / c, donc δf / f_e = v / c.', 'Même méthode pour le son et la lumière : seule la célérité c change.'] };
}

// ───────────── Titrage pH-métrique (TG) : quantités de matière et équivalence ─────────────
function genTitrageTG() {
  const CB = 0.100, CA = tire([0.050, 0.060, 0.080, 0.100]), VA = tire([10.0, 20.0, 25.0]);
  const n0 = CA * VA, VE = n0 / CB;   // mmol, mL
  const VB1 = Math.round(VE * tire([0.25, 0.75]) * 10) / 10, nB1 = CB * VB1;
  const q1 = { id: 't0', type: 'num', q: <>On titre <b>{nb(VA, 1)}{NB}mL</b> d’acide éthanoïque de concentration <b>{nb(CA, 3)}{NB}mol/L</b> par de la soude de concentration <b>0,100{NB}mol/L</b>. On a versé <b>{nb(VB1, 1)}{NB}mL</b> de soude. Calculez la quantité n<sub>B</sub> d’ions HO⁻ versée, en <b>mmol</b>.</>, unite: 'mmol', vrai: nB1, csMin: 2,
    aide: 'n_B = C_B × V_B ; avec C en mol/L et V en mL, le résultat est en mmol.',
    pieges: [[nB1 / 1000, 'Le résultat est demandé en millimoles : 1 mmol = 10⁻³ mol, donc ne divisez pas par 1000.'], [VB1 / CB, 'Le rapport est inversé : n = C × V.']],
    expl: <>n<sub>B</sub> = C<sub>B</sub> × V<sub>B</sub> = 0,100 × {nb(VB1, 1)} = <b>{avecU(nB1, 'mmol', 3)}</b>.</> };
  const nR = n0 - nB1;
  const q2 = { id: 't1', type: 'num', q: <>La quantité initiale d’acide est n<sub>0</sub> = C<sub>A</sub> × V<sub>A</sub> = <b>{nb(n0, 2)}{NB}mmol</b>. La transformation est totale et HO⁻ est le réactif limitant (on est avant l’équivalence). Calculez la quantité d’acide restant après l’ajout de {nb(VB1, 1)}{NB}mL de soude (n<sub>B</sub> = {nb(nB1, 2)}{NB}mmol), en <b>mmol</b>.</>, unite: 'mmol', vrai: nR, csMin: 2,
    aide: 'n(acide) restant = n_0 − n_B (coefficients stœchiométriques égaux à 1).',
    pieges: [[nB1, 'C’est la quantité de base conjuguée formée, pas celle d’acide restant.'], [n0 + nB1, 'Il faut soustraire : l’acide disparaît quand on verse HO⁻.']],
    expl: <>n(acide) restant = n<sub>0</sub> − n<sub>B</sub> = {nb(n0, 2)} − {nb(nB1, 2)} = <b>{avecU(nR, 'mmol', 3)}</b>.</> };
  const q3 = { id: 't2', type: 'num', q: <>À l’équivalence, l’acide et les ions HO⁻ sont consommés ensemble : C<sub>A</sub> × V<sub>A</sub> = C<sub>B</sub> × V<sub>E</sub>. Avec C<sub>A</sub> = {nb(CA, 3)}{NB}mol/L, V<sub>A</sub> = {nb(VA, 1)}{NB}mL et C<sub>B</sub> = 0,100{NB}mol/L, calculez le volume équivalent V<sub>E</sub>, en <b>mL</b>.</>, unite: 'mL', vrai: VE, csMin: 2,
    aide: 'V_E = C_A × V_A / C_B.',
    pieges: [[CB * VA / CA, 'Le rapport est inversé : V_E = C_A × V_A / C_B.'], [CA * VA, 'C’est la quantité d’acide en mmol ; il faut encore diviser par C_B.']],
    expl: <>V<sub>E</sub> = C<sub>A</sub> V<sub>A</sub> / C<sub>B</sub> = {nb(CA, 3)} × {nb(VA, 1)} / 0,100 = <b>{avecU(VE, 'mL', 3)}</b>.</> };
  const VEm = Math.round(VE * 10) / 10, CAvrai = CB * VEm / VA;
  const q4 = { id: 't3', type: 'num', q: <>On titre <b>{nb(VA, 1)}{NB}mL</b> d’une solution d’acide faible de concentration inconnue par de la soude à <b>0,100{NB}mol/L</b>. Le maximum de la dérivée du pH correspond à V<sub>E</sub> = <b>{nb(VEm, 1)}{NB}mL</b>. Calculez la concentration C<sub>A</sub> de l’acide, en <b>mol/L</b>.</>, unite: 'mol/L', vrai: CAvrai, csMin: 2,
    aide: 'C_A = C_B × V_E / V_A ; V_E et V_A dans la même unité (ici mL).',
    pieges: [[CB * VA / VEm, 'Le rapport est inversé : C_A = C_B × V_E / V_A.'], [CAvrai * 1000, 'La concentration est demandée en mol/L, pas en mmol/L.']],
    expl: <>C<sub>A</sub> = C<sub>B</sub> V<sub>E</sub> / V<sub>A</sub> = 0,100 × {nb(VEm, 1)} / {nb(VA, 1)} = <b>{avecU(CAvrai, 'mol/L', 3)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > 1e-9); });
  return { intro: 'Titrage acide-base : quantités de matière avant l’équivalence, volume équivalent et concentration de l’acide.', questions: [q1, q2, q3, q4],
    retenir: ['n(HO⁻) versé = C_B × V_B ; avant l’équivalence, n(acide) restant = n_0 − n_B.', 'À l’équivalence : C_A × V_A = C_B × V_E.', 'Garder V_E et V_A dans la même unité ; C en mol/L, V en mL donne des mmol.'] };
}

// ───────────── pH et concentration en ions oxonium (TG) : relation, dilution ─────────────
function genPhConcTG() {
  const m = tire([1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0]), n = tire([2, 3, 4, 5]), C = Number(`${m}e-${n}`);
  const sci = (x, cs = 2) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' })[c]).join('')}`; };
  const ph1 = -Math.log10(C);
  const q1 = { id: 'p0', type: 'num', q: <>Une solution d’acide chlorhydrique (acide fort) a une concentration en ions oxonium [H₃O⁺] = <b>{sci(C)}{NB}mol/L</b>. Calculez son pH (c° = 1{NB}mol/L), avec 2 décimales.</>, unite: '', vrai: ph1, tolRel: 0.006, csMin: 3,
    aide: 'pH = −log([H₃O⁺] / c°), avec le logarithme décimal (touche log) ; ne pas oublier le signe moins.',
    pieges: [[-ph1, 'Le pH est −log([H₃O⁺]/c°) : il est positif pour une concentration inférieure à 1 mol/L.'], [Math.log(C) * -1, 'Vous avez utilisé le logarithme népérien ln ; il faut log (décimal).'], [n, 'Vous avez gardé l’exposant seul : il faut aussi tenir compte de la mantisse, pH = n − log m.']],
    expl: <>pH = −log({sci(C)}) = <b>{nb(ph1, 3)}</b>, soit {nb(ph1, 2)} à 2 décimales.</> };
  const pH2 = Math.round((1.5 + Math.random() * 3.5) * 100) / 100, h2 = 10 ** -pH2;
  const q2 = { id: 'p1', type: 'num', q: <>Un pH-mètre indique <b>pH = {nb(pH2, 2)}</b> pour une solution aqueuse. Calculez [H₃O⁺] en mol/L, avec 2 chiffres significatifs.</>, unite: 'mol/L', vrai: h2, tolRel: 0.06, csMin: 2,
    aide: '[H₃O⁺] = c° × 10^(−pH), touche 10ˣ avec x = −pH.',
    pieges: [[10 ** pH2, 'Le signe de l’exposant est faux : [H₃O⁺] = 10^(−pH).'], [10 ** -Math.round(pH2), 'Vous avez arrondi le pH à l’entier : gardez les 2 décimales du pH pour calculer 10^(−pH).']],
    expl: <>[H₃O⁺] = 10<sup>−{nb(pH2, 2)}</sup> = <b>{sci(h2)}{NB}mol/L</b>.</> };
  const pH0 = Math.round((1.8 + Math.random() * 1.7) * 100) / 100, V1 = tire([1.0, 5.0, 10.0]), V2 = tire([100, 250, 500]), F = V2 / V1, pH3 = pH0 + Math.log10(F);
  const q3 = { id: 'p2', type: 'num', q: <>Une solution d’acide chlorhydrique a pour pH <b>{nb(pH0, 2)}</b>. On en prélève <b>{nb(V1, 1)}{NB}mL</b> et on complète à <b>{V2}{NB}mL</b> avec de l’eau distillée dans une fiole jaugée. Calculez le pH de la solution diluée, avec 2 décimales.</>, unite: '', vrai: pH3, tolRel: 0.006, csMin: 3,
    aide: 'Facteur de dilution F = V₂ / V₁ ; pH final = pH initial + log F.',
    pieges: [[pH0 + 1, 'Vous avez ajouté 1 quel que soit le facteur : on ajoute log F (1 seulement pour F = 10).'], [pH0 - Math.log10(F), 'Diluer un acide augmente le pH : il faut ajouter log F, pas le retrancher.'], [pH0 * F, 'Vous avez multiplié le pH par F : la dilution agit sur [H₃O⁺], le pH augmente de log F.']],
    expl: <>F = {V2} / {nb(V1, 1)} = {nb(F, 3)} ; pH final = {nb(pH0, 2)} + log {nb(F, 3)} = <b>{nb(pH3, 3)}</b>.</> };
  const pHf = Math.round((4.2 + Math.random() * 1.6) * 100) / 100, k = tire([2, 3]), C0 = 10 ** -(pHf - k);
  const q4 = { id: 'p3', type: 'num', q: <>Une solution mère d’acide chlorhydrique est diluée d’un facteur 10 à <b>{k}</b> reprises successives ; le pH de la dernière solution est <b>{nb(pHf, 2)}</b>. Calculez la concentration en ions oxonium de la solution mère, en mol/L, avec 2 chiffres significatifs.</>, unite: 'mol/L', vrai: C0, tolRel: 0.06, csMin: 2,
    aide: 'Chaque dilution d’un facteur 10 ajoute 1 au pH : pH(mère) = pH(finale) − k, puis [H₃O⁺] = 10^(−pH).',
    pieges: [[10 ** -(pHf + k), 'Vous avez ajouté k au pH de la solution finale : la solution mère est plus concentrée, son pH est plus petit.'], [10 ** -pHf, 'C’est la concentration de la solution diluée, pas celle de la solution mère.']],
    expl: <>pH(mère) = {nb(pHf, 2)} − {k} = {nb(pHf - k, 2)} ; [H₃O⁺] = 10<sup>−{nb(pHf - k, 2)}</sup> = <b>{sci(C0)}{NB}mol/L</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'pH et concentration en ions oxonium : relation dans les deux sens, effet d’une dilution.', questions: [q1, q2, q3, q4],
    retenir: ['pH = −log([H₃O⁺] / c°) et [H₃O⁺] = c° × 10^(−pH), avec c° = 1 mol/L.', 'Dilution d’un facteur F : pH final = pH initial + log F (facteur 10 : + 1).', 'Autant de décimales pour le pH que de chiffres significatifs pour [H₃O⁺].'] };
}

// ───────────── Cinétique (TG) : vitesse volumique, temps de demi-réaction, constante d’ordre 1 ─────────────
function genCinetiqueTG() {
  const c1 = tire([60.0, 50.0, 40.0]), t1 = tire([2, 4, 6]), dt = tire([2, 3, 4, 5]), kk = tire([0.10, 0.15, 0.20]);
  const c2 = Math.round(c1 * Math.exp(-kk * dt) * 10) / 10, t2 = t1 + dt, v = (c1 - c2) / dt;
  const q1 = { id: 'c0', type: 'num', q: <>On suit la disparition d’un réactif : sa concentration vaut <b>{nb(c1, 3)}{NB}mmol/L</b> à <b>t<sub>1</sub> = {t1},0{NB}min</b> et <b>{nb(c2, 3)}{NB}mmol/L</b> à <b>t<sub>2</sub> = {t2},0{NB}min</b>. Calculez la vitesse volumique moyenne de disparition entre ces deux instants, en <b>mmol·L⁻¹·min⁻¹</b>.</>, unite: 'mmol·L⁻¹·min⁻¹', vrai: v, csMin: 3,
    aide: 'v = −Δc / Δt avec Δc = c_2 − c_1 (négatif pour un réactif) et Δt = t_2 − t_1.',
    pieges: [[-v, 'Pour un réactif, Δc est négatif : le signe moins de v = −Δc / Δt rend la vitesse volumique de disparition positive.'], [dt / (c1 - c2), 'Le rapport est inversé : v = −Δc / Δt.'], [(c1 - c2) / t2, 'Il faut diviser par la durée Δt = t₂ − t₁, pas par t₂.'], [c1 - c2, 'Il faut encore diviser par Δt.']],
    expl: <>Δc = {nb(c2, 3)} − {nb(c1, 3)} = {nb(c2 - c1, 3)}{NB}mmol/L ; Δt = {t2},0 − {t1},0 = {dt},0{NB}min ; v = −Δc / Δt = <b>{avecU(v, 'mmol·L⁻¹·min⁻¹', 3)}</b>.</> };
  const vv = tire([2.4, 3.6, 4.8, 1.8, 6.0]), vs = vv / 1000 / 60;
  const q2 = { id: 'c1', type: 'num', q: <>Une vitesse volumique de disparition vaut <b>{nb(vv, 2)}{NB}mmol·L⁻¹·min⁻¹</b>. Exprimez-la en <b>mol·L⁻¹·s⁻¹</b>.</>, unite: 'mol·L⁻¹·s⁻¹', vrai: vs, csMin: 2,
    aide: '1 mmol = 10⁻³ mol et 1 min = 60 s, donc il faut diviser par 1000 puis par 60.',
    pieges: [[vv / 1000, 'Vous avez converti les mmol en mol, mais il reste à passer de min⁻¹ à s⁻¹ : diviser par 60.'], [vv / 60, 'Vous avez converti min⁻¹ en s⁻¹, mais il reste à passer des mmol aux mol : diviser par 1000.'], [vv * 60 / 1000, 'Pour passer de min⁻¹ à s⁻¹ on divise par 60 (une seconde est plus courte qu’une minute).']],
    expl: <>v = {nb(vv, 2)} × 10⁻³ mol·L⁻¹ / 60 s = <b>{avecU(vs, 'mol·L⁻¹·s⁻¹', 3)}</b>.</> };
  const c0 = tire([0.080, 0.120, 0.160, 0.200]), th = tire([5, 8, 12, 15]), n = tire([2, 3, 4]), cn = c0 / 2 ** n;
  const q3 = { id: 'c2', type: 'num', q: <>Un réactif dont la disparition suit une loi d’ordre 1 a une concentration initiale <b>{nb(c0, 3)}{NB}mol/L</b> et un temps de demi-réaction <b>t<sub>½</sub> = {th}{NB}min</b>. Calculez sa concentration au bout de <b>{n * th}{NB}min</b>, en <b>mol/L</b>.</>, unite: 'mol/L', vrai: cn, csMin: 3,
    aide: `${n * th} min = ${n} × t_½ : la concentration est divisée par 2 à chaque demi-réaction, soit c = c_0 / 2^n.`,
    pieges: [[c0 / n, 'La concentration n’est pas divisée par n : elle est divisée par 2 à chaque demi-réaction, soit par 2ⁿ.'], [c0 / 2 ** (n - 1), `Il y a ${n} demi-réactions (${n * th} / ${th}) : c = c₀ / 2${['', '', '²', '³', '⁴'][n]}.`], [c0 / (2 * n), 'Chaque demi-réaction divise la concentration par 2 : après n demi-réactions, c = c₀ / 2ⁿ.']],
    expl: <>{n * th} / {th} = {n} demi-réactions : c = c<sub>0</sub> / 2<sup>{n}</sup> = {nb(c0, 3)} / {2 ** n} = <b>{avecU(cn, 'mol/L', 3)}</b>.</> };
  const th2 = tire([6, 10, 16, 20]), k = Math.LN2 / th2;
  const q4 = { id: 'c3', type: 'num', q: <>Pour une loi d’ordre 1, le temps de demi-réaction est lié à la constante de vitesse par <b>t<sub>½</sub> = ln 2 / k</b>. On mesure <b>t<sub>½</sub> = {th2}{NB}min</b>. Calculez la constante de vitesse k, en <b>min⁻¹</b>.</>, unite: 'min⁻¹', vrai: k, csMin: 3,
    aide: 'k = ln 2 / t_½ avec ln 2 ≈ 0,693 ; le résultat est l’inverse d’un temps.',
    pieges: [[1 / th2, 'La relation contient ln 2 : k = ln 2 / t½, pas 1 / t½.'], [th2 / Math.LN2, 'Le rapport est inversé : k = ln 2 / t½.'], [0.5 / th2, 'Le facteur est ln 2 ≈ 0,693, pas 0,5.']],
    expl: <>k = ln 2 / t<sub>½</sub> = 0,693 / {th2} = <b>{avecU(k, 'min⁻¹', 3)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > 1e-9); });
  return { intro: 'Cinétique : vitesse volumique moyenne, changement d’unité, concentration après n demi-réactions et constante de vitesse d’ordre 1.', questions: [q1, q2, q3, q4],
    retenir: ['v = −Δc / Δt pour un réactif (positive) ; v = Δc / Δt pour un produit.', 'Après n demi-réactions (ordre 1) : c = c_0 / 2ⁿ.', 't½ = ln 2 / k ; k s’exprime en min⁻¹ ou s⁻¹ (inverse d’un temps).'] };
}

// ───────────── Radioactivité (TG) : λ, noyaux restants, activité (conversion jour → seconde), datation ─────────────
function genRadioactiviteTG() {
  const sciR = (x, cs = 2) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' })[c]).join('')}`; };
  const th = tire([2.0, 4.0, 5.0, 8.0, 12.0]), lam = Math.LN2 / th;
  const q1 = { id: 'r0', type: 'num', q: <>Un noyau radioactif a pour demi-vie <b>t<sub>½</sub> = {nb(th, 2)}{NB}jours</b>. Calculez sa constante radioactive λ, en <b>j⁻¹</b>.</>, unite: 'j⁻¹', vrai: lam, csMin: 3,
    aide: 'λ = ln 2 / t_½ avec ln 2 ≈ 0,693 ; le résultat est l’inverse d’un temps.',
    pieges: [[1 / th, 'La relation contient ln 2 : λ = ln 2 / t½, pas 1 / t½.'], [th / Math.LN2, 'Le rapport est inversé : λ = ln 2 / t½.'], [0.5 / th, 'Le facteur est ln 2 ≈ 0,693, pas 0,5.']],
    expl: <>λ = ln 2 / t<sub>½</sub> = 0,693 / {nb(th, 2)} = <b>{avecU(lam, 'j⁻¹', 3)}</b>.</> };
  const N0 = tire([20, 40, 60, 80]), th2 = tire([4.0, 5.0, 8.0]), t2 = tire([10, 15, 20, 30]), l2 = Math.LN2 / th2, N = N0 * Math.exp(-l2 * t2);
  const q2 = { id: 'r1', type: 'num', q: <>Un échantillon contient <b>{N0}{NB}millions</b> de noyaux radioactifs à l’instant initial ; leur demi-vie est <b>{nb(th2, 2)}{NB}jours</b>. Calculez le nombre de noyaux restants au bout de <b>{t2}{NB}jours</b>, en <b>millions de noyaux</b> (N = N<sub>0</sub>·e<sup>−λt</sup>).</>, unite: 'millions de noyaux', vrai: N, csMin: 3, tolRel: 0.01,
    aide: 'Calculez d’abord λ = ln 2 / t_½ (en j⁻¹), puis l’exposant sans unité λ·t, puis N = N_0·e^(−λt).',
    pieges: [[N0 * Math.exp(-t2 / th2), 'Il manque ln 2 : λ = ln 2 / t½, donc l’exposant est ln 2 × t / t½.'], [N0 * Math.exp(-l2), 'Il manque le facteur t dans l’exponentielle : c’est e^(−λ·t).'], [N0 * Math.exp(l2 * t2), 'Le signe de l’exponentielle est faux : N décroît, donc e^(−λt).'], [N0 * 0.5 ** Math.floor(t2 / th2), 'Le nombre de demi-vies n’est pas entier ici : utilisez N = N₀·e^(−λt), qui vaut pour toute durée.']],
    expl: <>λ = 0,693 / {nb(th2, 2)} = {nb(l2, 3)}{NB}j⁻¹ ; λ·t = {nb(l2 * t2, 3)} ; N = {N0} × e<sup>−{nb(l2 * t2, 3)}</sup> = <b>{avecU(N, 'millions de noyaux', 3)}</b>.</> };
  const th3 = tire([4.0, 6.0, 8.0, 10.0]), N3 = tire([2.0, 4.0, 5.0, 8.0]), A0 = Math.LN2 / (th3 * 86400) * N3 * 1e7;
  const q3 = { id: 'r2', type: 'num', q: <>Un échantillon contient <b>{sciR(N3 * 1e7)}{NB}noyaux</b> radioactifs de demi-vie <b>{nb(th3, 2)}{NB}jours</b>. Calculez son activité initiale A<sub>0</sub> = λ·N<sub>0</sub>, en <b>becquerels</b> (1{NB}Bq = 1 désintégration par seconde ; 1{NB}j = 86 400{NB}s).</>, unite: 'Bq', vrai: A0, csMin: 3, tolRel: 0.01,
    aide: 'Convertissez d’abord t_½ en secondes (× 86 400), puis λ = ln 2 / t_½ en s⁻¹, puis A_0 = λ·N_0.',
    pieges: [[A0 * 86400, 'Vous avez gardé λ en j⁻¹ : le résultat est un nombre de désintégrations par jour. Pour des becquerels, λ doit être en s⁻¹.'], [N3 * 1e7 / (th3 * 86400), 'Il manque ln 2 : λ = ln 2 / t½.'], [A0 / 86400, 'Vous avez divisé deux fois par 86 400 : la conversion jour → seconde se fait une seule fois.'], [A0 * Math.LN2, 'Vous avez multiplié par ln 2 au lieu de diviser : λ = ln 2 / t½ avec t½ en secondes.']],
    expl: <>t<sub>½</sub> = {nb(th3, 2)} × 86 400 = {nb(th3 * 86400, 3)}{NB}s ; λ = 0,693 / {nb(th3 * 86400, 3)} = {sciR(Math.LN2 / (th3 * 86400), 3)}{NB}s⁻¹ ; A<sub>0</sub> = λ·N<sub>0</sub> = <b>{avecU(A0, 'Bq', 3)}</b>.</> };
  const f = tire([80, 70, 60, 45, 35, 15]), age = 5730 / Math.LN2 * Math.log(100 / f);
  const q4 = { id: 'r3', type: 'num', q: <>Un échantillon organique contient <b>{f}{NB}%</b> du carbone 14 d’un échantillon vivant. La demi-vie du carbone 14 est <b>5 730{NB}ans</b>. Calculez l’âge de l’échantillon avec t = (t<sub>½</sub> / ln 2) × ln(N<sub>0</sub> / N), en <b>ans</b>.</>, unite: 'ans', vrai: age, csMin: 3, tolRel: 0.01,
    aide: 'N_0 / N = 100 / pourcentage restant. Utilisez la touche ln (logarithme népérien) de la calculatrice, pas log.',
    pieges: [[5730 / Math.LN2 * Math.log10(100 / f), 'Vous avez utilisé log (décimal) : la formule demande le logarithme népérien ln.'], [5730 * Math.log(100 / f), 'Il manque la division par ln 2 : t = (t½ / ln 2) × ln(N₀ / N).'], [(100 - f) / 50 * 5730, 'La décroissance est exponentielle : l’âge n’est pas proportionnel au pourcentage disparu (pas de règle de trois).'], [5730 / Math.LN2 * Math.log(f / 100), 'Le rapport est inversé : c’est ln(N₀ / N), qui est positif (N₀ > N).']],
    expl: <>N<sub>0</sub> / N = 100 / {f} = {nb(100 / f, 3)} ; ln({nb(100 / f, 3)}) = {nb(Math.log(100 / f), 3)} ; t = (5 730 / 0,693) × {nb(Math.log(100 / f), 3)} = <b>{avecU(age, 'ans', 3)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Radioactivité : constante radioactive, noyaux restants, activité (avec conversion jour → seconde) et datation au carbone 14.', questions: [q1, q2, q3, q4],
    retenir: ['λ = ln 2 / t½ et N(t) = N₀·e^(−λt) ; après n demi-vies, N = N₀ / 2ⁿ.', 'A = λ·N en becquerels : λ en s⁻¹ (1 j = 86 400 s).', 'Datation : t = (t½ / ln 2) × ln(N₀ / N) ; plus de 50 % restant ⇒ âge inférieur à t½.'] };
}

// ───────────── Équilibre chimique (TG) : Qr, K, taux d’avancement final, Qr après un ajout ─────────────
function genEquilibreTG() {
  const v = [0.050, 0.10, 0.20, 0.40];
  const a = tire(v), b = tire(v), c = tire(v), d = tire(v), Q = c * d / (a * b);
  const q1 = { id: 'e0', type: 'num', q: <>Pour la réaction A + B ⇌ C + D en solution, un mélange a pour concentrations [A] = <b>{nb(a, 3)}{NB}mol/L</b>, [B] = <b>{nb(b, 3)}{NB}mol/L</b>, [C] = <b>{nb(c, 3)}{NB}mol/L</b> et [D] = <b>{nb(d, 3)}{NB}mol/L</b>. Calculez son quotient de réaction Qr (sans unité).</>, unite: '', vrai: Q, csMin: 3, tolRel: 0.01,
    aide: 'Qr = [C]·[D] / ([A]·[B]) : produits au numérateur, réactifs au dénominateur, concentrations en mol/L divisées par 1 mol/L.',
    pieges: [[1 / Q, 'Le rapport est inversé : les produits (C et D) sont au numérateur, les réactifs (A et B) au dénominateur.'], [(c + d) / (a + b), 'On multiplie les concentrations de deux espèces, on ne les additionne pas.'], [c * d, 'Il manque le dénominateur : Qr est un rapport, produits sur réactifs.']],
    expl: <>Qr = ({nb(c, 3)} × {nb(d, 3)}) / ({nb(a, 3)} × {nb(b, 3)}) = <b>{nb(Q, 3)}</b>.</> };
  const c0 = tire([0.10, 0.20]), x = tire([0.020, 0.030, 0.040, 0.050]), K = (x / (c0 - x)) ** 2;
  const q2 = { id: 'e1', type: 'num', q: <>On part de <b>{nb(c0, 3)}{NB}mol/L</b> de A et de B, sans produit. À l’état final, [C] = [D] = <b>{nb(x, 3)}{NB}mol/L</b>. Calculez la constante d’équilibre K de la réaction A + B ⇌ C + D (sans unité).</>, unite: '', vrai: K, csMin: 3, tolRel: 0.01,
    aide: 'À l’état final, K = Qr avec les concentrations finales : [C] = [D] = x et [A] = [B] = c₀ − x.',
    pieges: [[(x / c0) ** 2, 'Il faut les concentrations de l’état final : [A] = [B] = c₀ − x, pas la concentration initiale.'], [1 / K, 'Le rapport est inversé : produits au numérateur, réactifs au dénominateur.'], [x / (c0 - x), 'Il manque le carré : K = ([C] × [D]) / ([A] × [B]) = x² / (c₀ − x)².']],
    expl: <>[A] = [B] = {nb(c0, 3)} − {nb(x, 3)} = {nb(c0 - x, 3)}{NB}mol/L ; K = {nb(x, 3)}² / {nb(c0 - x, 3)}² = <b>{nb(K, 3)}</b>.</> };
  const c1 = tire([0.10, 0.20, 0.40]), x1 = c1 * tire([0.10, 0.25, 0.40, 0.60, 0.80]), V1 = tire([0.50, 1.00, 2.00]);
  const tau = x1 / c1;
  const q3 = { id: 'e2', type: 'num', q: <>Dans <b>{nb(V1, 3)}{NB}L</b> d’eau, on part de <b>{nb(c1, 3)}{NB}mol/L</b> de A et de B, sans produit. À l’état final, [C] = <b>{nb(x1, 3)}{NB}mol/L</b>. Calculez le taux d’avancement final τ = x<sub>f</sub> / x<sub>max</sub> (sans unité).</>, unite: '', vrai: tau, csMin: 2, tolRel: 0.01,
    aide: 'x_max correspond à la disparition du réactif limitant : x_max = c₀ × V. L’avancement final est x_f = [C] × V. Le volume se simplifie.',
    pieges: [[1 / tau, 'Le rapport est inversé : τ = x_f / x_max, et x_f ne dépasse pas x_max.'], [1 - tau, 'Vous avez calculé la part de réactif restante ; τ est la part de l’avancement maximal atteinte, x_f / x_max.'], [100 * tau, 'τ est sans unité : 40 % s’écrit 0,40.'], [x1 / V1 / c1 * V1 * V1, 'Le volume se simplifie : τ = ([C] × V) / (c₀ × V) = [C] / c₀.']],
    expl: <>x<sub>f</sub> = {nb(x1, 3)} × {nb(V1, 3)} = {nb(x1 * V1, 3)}{NB}mol ; x<sub>max</sub> = {nb(c1, 3)} × {nb(V1, 3)} = {nb(c1 * V1, 3)}{NB}mol ; τ = <b>{nb(tau, 2)}</b>.</> };
  const Kq = 0.10, [a4, b4, c4, d4] = tire([[0.20, 0.10, 0.050, 0.040], [0.40, 0.10, 0.10, 0.040], [0.20, 0.20, 0.20, 0.020], [0.40, 0.20, 0.10, 0.080], [0.10, 0.10, 0.050, 0.020]]), dA = tire([0.050, 0.10, 0.20]);
  const Q4 = c4 * d4 / ((a4 + dA) * b4);
  const q4 = { id: 'e3', type: 'num', q: <>Un système A + B ⇌ C + D est à l’équilibre, de constante K = {nb(Kq, 3)} ; ses concentrations sont [A] = <b>{nb(a4, 3)}{NB}mol/L</b>, [B] = <b>{nb(b4, 3)}{NB}mol/L</b>, [C] = <b>{nb(c4, 3)}{NB}mol/L</b> et [D] = <b>{nb(d4, 3)}{NB}mol/L</b>. On ajoute <b>{nb(dA, 3)}{NB}mol/L</b> de A (volume et température inchangés). Calculez le quotient de réaction Qr juste après l’ajout (sans unité).</>, unite: '', vrai: Q4, csMin: 3, tolRel: 0.01,
    aide: 'Après l’ajout, [A] vaut [A] + ajout ; les autres concentrations n’ont pas encore changé. Qr = [C]·[D] / ([A]·[B]).',
    pieges: [[Kq, 'C’est le quotient avant l’ajout (il vaut K). Après l’ajout, [A] a augmenté.'], [c4 * d4 / ((a4 - dA) * b4), 'On ajoute A : sa concentration augmente de l’ajout, elle ne diminue pas.'], [(a4 + dA) * b4 / (c4 * d4), 'Le rapport est inversé : produits au numérateur, réactifs au dénominateur.']],
    expl: <>[A] = {nb(a4, 3)} + {nb(dA, 3)} = {nb(a4 + dA, 3)}{NB}mol/L ; Qr = ({nb(c4, 3)} × {nb(d4, 3)}) / ({nb(a4 + dA, 3)} × {nb(b4, 3)}) = <b>{nb(Q4, 3)}</b> : inférieur à K, le système évolue dans le sens direct.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([y]) => isFinite(y) && Math.abs(y - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Équilibre chimique : quotient de réaction, constante d’équilibre, taux d’avancement final et Qr après un ajout.', questions: [q1, q2, q3, q4],
    retenir: ['Qr = [C]·[D] / ([A]·[B]), sans unité ; Qr < K : sens direct ; Qr > K : sens inverse.', 'À l’état final, Qr = K : on calcule K avec les concentrations de l’état final.', 'τ = x_f / x_max, sans unité, compris entre 0 et 1 ; τ < 1 : transformation non totale.'] };
}

// ───────────── Force des acides (TG) : pH d’un acide fort, K_A à partir du pH, [HO⁻] avec K_e, équation du second degré ─────────────
function genForceAcidesTG() {
  const sci = (x, cs = 2) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' })[c]).join('')}`; };
  const quad = (Ka, C) => (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2;
  const C1 = tire([0.0010, 0.0020, 0.0050, 0.020, 0.030, 0.050, 0.10]), pH1 = -Math.log10(C1);
  const q1 = { id: 'f0', type: 'num', q: <>Une solution d’acide chlorhydrique (acide fort) a une concentration apportée <b>C = {nb(C1, 2)}{NB}mol/L</b>. Calculez son pH (c° = 1{NB}mol/L), avec 2 décimales.</>, unite: '', vrai: pH1, tolRel: 0.006, csMin: 3,
    aide: 'Acide fort : la transformation est quasi-totale, donc [H₃O⁺] = C ; puis pH = −log([H₃O⁺] / c°) avec la touche log.',
    pieges: [[-pH1, 'Le pH est positif ici : log C est négatif, donc −log C est positif.'], [-Math.log(C1), 'Vous avez utilisé le logarithme népérien ln ; il faut log (décimal).'], [C1, 'C’est la concentration [H₃O⁺] = C, pas le pH : pH = −log C.']],
    expl: <>[H₃O⁺] = C = {nb(C1, 2)}{NB}mol/L ; pH = −log({nb(C1, 2)}) = <b>{nb(pH1, 3)}</b>, soit {nb(pH1, 2)} à 2 décimales.</> };
  const C2 = tire([0.010, 0.020, 0.050, 0.10]), pKa2 = tire([4.0, 4.2, 4.4, 4.6, 4.8, 5.0]), pH2 = Math.round(-Math.log10(quad(10 ** -pKa2, C2)) * 100) / 100, h2 = 10 ** -pH2, Ka2 = h2 * h2 / (C2 - h2);
  const q2 = { id: 'f1', type: 'num', q: <>Une solution d’un acide faible, de concentration apportée <b>C = {nb(C2, 2)}{NB}mol/L</b>, a un pH égal à <b>{nb(pH2, 2)}</b> à 25{NB}°C. Calculez la constante d’acidité K<sub>A</sub> de cet acide (sans unité), avec 2 chiffres significatifs.</>, unite: '', vrai: Ka2, tolRel: 0.10, csMin: 2,
    aide: '[H₃O⁺] = [A⁻] = 10^(−pH) et [AH] = C − [H₃O⁺] ; K_A = [A⁻]·[H₃O⁺] / [AH]. Gardez un chiffre significatif de plus pour [H₃O⁺] pendant le calcul.',
    pieges: [[h2 / C2, 'C’est le taux d’avancement τ = [H₃O⁺] / C, pas K_A : K_A = [H₃O⁺]² / (C − [H₃O⁺]).'], [h2, 'C’est [H₃O⁺] : K_A est un rapport qui fait intervenir [H₃O⁺] au carré.'], [(C2 - h2) / (h2 * h2), 'Le rapport est inversé : l’acide AH est au dénominateur.'], [10 ** -pH2 * C2, 'Il faut diviser par la concentration de l’acide non transformé, pas multiplier par C.']],
    expl: <>[H₃O⁺] = [A⁻] = 10<sup>−{nb(pH2, 2)}</sup> = {sci(h2, 3)}{NB}mol/L ; [AH] = {nb(C2, 2)} − {sci(h2, 3)} = {sci(C2 - h2, 3)}{NB}mol/L ; K<sub>A</sub> = {sci(h2, 3)}² / {sci(C2 - h2, 3)} = <b>{sci(Ka2, 2)}</b>.</> };
  const pH3 = tire([2.40, 3.10, 3.60, 4.20, 5.30, 6.50]), h3 = 10 ** -pH3, HO3 = 1e-14 / h3;
  const q3 = { id: 'f2', type: 'num', q: <>À 25{NB}°C, une solution aqueuse a un pH égal à <b>{nb(pH3, 2)}</b>. Avec K<sub>e</sub> = [H₃O⁺]·[HO⁻] = 1,0 × 10⁻¹⁴, calculez la concentration en ions hydroxyde [HO⁻] en mol/L, avec 2 chiffres significatifs.</>, unite: 'mol/L', vrai: HO3, tolRel: 0.06, csMin: 2,
    aide: '[H₃O⁺] = 10^(−pH), puis [HO⁻] = K_e / [H₃O⁺]. On peut aussi écrire [HO⁻] = 10^(pH − 14).',
    pieges: [[1e-14 * h3, 'Il faut diviser K_e par [H₃O⁺], pas les multiplier.'], [h3, 'C’est [H₃O⁺] : [HO⁻] se déduit de K_e / [H₃O⁺].'], [14 - pH3, 'C’est 14 − pH (le pOH), pas une concentration : [HO⁻] = 10^(−pOH).'], [1e-14, 'C’est K_e lui-même : [HO⁻] = K_e / [H₃O⁺].']],
    expl: <>[H₃O⁺] = 10<sup>−{nb(pH3, 2)}</sup> = {sci(h3, 3)}{NB}mol/L ; [HO⁻] = 1,0 × 10⁻¹⁴ / {sci(h3, 3)} = <b>{sci(HO3, 2)}{NB}mol/L</b>.</> };
  const C4 = tire([0.0010, 0.0020, 0.0050]), Ka4 = tire([1.7e-5, 6.3e-5, 1.8e-4]), x4 = quad(Ka4, C4);
  const q4 = { id: 'f3', type: 'num', q: <>On dissout un acide faible AH, de constante d’acidité K<sub>A</sub> = <b>{sci(Ka4, 2)}</b>, à la concentration apportée <b>C = {nb(C4, 2)}{NB}mol/L</b>. En posant x = [H₃O⁺] = [A⁻], on obtient x² + K<sub>A</sub>·x − K<sub>A</sub>·C = 0. Résolvez cette équation du second degré et donnez [H₃O⁺] en mol/L, avec 3 chiffres significatifs.</>, unite: 'mol/L', vrai: x4, tolRel: 0.01, csMin: 3,
    aide: 'Équation a·x² + b·x + c = 0 avec a = 1, b = K_A et c = −K_A·C. Discriminant Δ = b² − 4ac ; racine positive x = (−b + √Δ) / (2a). Gardez 4 chiffres pendant le calcul.',
    pieges: [[Math.sqrt(Ka4 * C4), 'Vous avez négligé x devant C (x ≈ √(K_A·C)) : ici l’acide réagit trop pour cette approximation, résolvez l’équation du second degré.'], [Ka4 * C4, 'C’est le terme K_A·C, pas la racine de l’équation.'], [(-Ka4 + Math.sqrt(Ka4 * Ka4 + 4 * Ka4 * C4)), 'Il manque la division par 2a = 2 dans la formule x = (−b + √Δ) / (2a).'], [-Math.log10(x4), 'C’est le pH ; on demande la concentration [H₃O⁺].']],
    expl: <>Δ = K<sub>A</sub>² + 4·K<sub>A</sub>·C = {sci(Ka4 * Ka4 + 4 * Ka4 * C4, 4)} ; x = (−{sci(Ka4, 2)} + √Δ) / 2 = <b>{sci(x4, 3)}{NB}mol/L</b> (pH = {nb(-Math.log10(x4), 2)}).</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([y]) => isFinite(y) && Math.abs(y - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Force des acides : pH d’un acide fort, constante d’acidité à partir du pH, ions hydroxyde avec K_e et équation du second degré.', questions: [q1, q2, q3, q4],
    retenir: ['Acide fort : [H₃O⁺] = C et pH = −log C ; acide faible : pH > −log C.', 'K_A = [A⁻]·[H₃O⁺] / [AH] = [H₃O⁺]² / (C − [H₃O⁺]) ; K_e = [H₃O⁺]·[HO⁻] = 1,0 × 10⁻¹⁴ à 25 °C.', 'Acide faible : x² + K_A·x − K_A·C = 0 avec x = [H₃O⁺] ; on garde la racine positive.'] };
}

// ───────────── Couples acide-base (TG) : rapport des formes, pourcentage, concentration, pH pour une proportion donnée ─────────────
function genPredominanceTG() {
  const sci = (x, cs = 2) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' })[c]).join('')}`; };
  const pKa = tire([3.75, 4.20, 4.76, 9.20]), d1 = tire([-1.5, -1, -0.5, 0.5, 1, 1.5, 2]), pH = Math.round((pKa + d1) * 10) / 10, r = 10 ** (pH - pKa);
  const q1 = { id: 'p0', type: 'num', q: <>Un couple acide-base AH / A⁻ de <b>pK<sub>A</sub> = {nb(pKa, 3)}</b> est dans une solution de <b>pH = {nb(pH, 2)}</b>. Calculez le rapport {avecIndices('frac([A⁻]|[AH])')} (sans unité), avec 2 chiffres significatifs.</>, unite: '', vrai: r, tolRel: 0.05, csMin: 2,
    aide: 'frac([A⁻]|[AH]) = frac(K_A|[H₃O⁺]) = 10^(pH − pK_A) : calculez d’abord la différence pH − pK_A, puis 10 puissance cette valeur.',
    pieges: [[1 / r, 'Le rapport est inversé : A⁻ est au numérateur.'], [pH - pKa, 'C’est l’exposant pH − pK_A ; le rapport est 10 puissance cette valeur.'], [pH / pKa, 'Il ne faut pas diviser le pH par le pK_A : le rapport est 10^(pH − pK_A).'], [10 ** (pKa - pH), 'Le signe de l’exposant est inversé : c’est pH − pK_A, pas pK_A − pH.']],
    expl: <>pH − pK<sub>A</sub> = {nb(pH, 2)} − {nb(pKa, 3)} = {nb(pH - pKa, 2)} ; {avecIndices('frac([A⁻]|[AH])')} = 10<sup>{nb(pH - pKa, 2)}</sup> = <b>{sci(r, 3)}</b>.</> };
  const pct = 100 * r / (1 + r);
  const q2 = { id: 'p1', type: 'num', q: <>Pour le même couple (pK<sub>A</sub> = {nb(pKa, 3)}) à pH = {nb(pH, 2)}, calculez le <b>pourcentage de forme basique A⁻</b> parmi les deux formes (en %, 3 chiffres significatifs).</>, unite: '%', vrai: pct, tolRel: 0.012, csMin: 3,
    aide: 'Avec r = frac([A⁻]|[AH]) = 10^(pH − pK_A) : % A⁻ = 100 × frac([A⁻]|[A⁻] + [AH]) = 100 × frac(r|1 + r).',
    pieges: [[100 - pct, 'C’est le pourcentage de la forme acide AH ; on demande celui de A⁻.'], [r, 'C’est le rapport frac([A⁻]|[AH]), pas un pourcentage du total.'], [100 * r, 'Il faut diviser par la somme des deux formes (1 + r) : le pourcentage est inférieur à 100 %.'], [pct / 100, 'C’est la fraction ; multipliez par 100 pour obtenir un pourcentage.']],
    expl: <>r = {sci(r, 3)} ; % A⁻ = 100 × {avecIndices('frac(r|1 + r)')} = <b>{nb(pct, 3)}{NB}%</b>.</> };
  const C = tire([0.0010, 0.0050, 0.010, 0.020, 0.050]), AH = C / (1 + r);
  const q3 = { id: 'p2', type: 'num', q: <>La concentration totale du couple (AH + A⁻) est <b>C = {nb(C, 2)}{NB}mol/L</b>, toujours à pH = {nb(pH, 2)} et pK<sub>A</sub> = {nb(pKa, 3)}. Calculez la concentration de la forme acide [AH] en mol/L, avec 2 chiffres significatifs.</>, unite: 'mol/L', vrai: AH, tolRel: 0.05, csMin: 2,
    aide: '[AH] + [A⁻] = C et [A⁻] = r·[AH], donc [AH] = frac(C|1 + r) avec r = 10^(pH − pK_A).',
    pieges: [[C * r / (1 + r), 'C’est [A⁻] ; on demande [AH].'], [C / r, 'frac(C|r) serait [AH] si C était la concentration de A⁻ seule ; ici C est la somme des deux formes : [AH] = frac(C|1 + r).'], [C, 'C est la somme [AH] + [A⁻], pas [AH] seul.'], [C * (1 - r), 'Il ne faut pas soustraire r à 1 : [AH] = frac(C|1 + r).']],
    expl: <>r = {sci(r, 3)} ; [AH] = {avecIndices('frac(C|1 + r)')} = {avecIndices(`frac(${nb(C, 2)}|${nb(1 + r, 4)})`)} = <b>{sci(AH, 2)}{NB}mol/L</b>.</> };
  const p = tire([0.2, 0.25, 0.8, 0.9, 0.95]), pHp = pKa + Math.log10(p / (1 - p));
  const q4 = { id: 'p3', type: 'num', q: <>Pour le couple de pK<sub>A</sub> = {nb(pKa, 3)}, à quel pH la forme basique A⁻ représente-t-elle <b>{nb(100 * p, 3)}{NB}%</b> du couple ? Donnez le pH avec 2 décimales.</>, unite: '', vrai: pHp, tolRel: 0.005, csMin: 3,
    aide: '% A⁻ = 100 × frac(r|1 + r) donne r = frac(p|1 − p) avec p = fraction de A⁻ ; puis pH = pK_A + log r.',
    pieges: [[pKa, 'C’est le pH où il y a 50 % de chaque forme ; ici la proportion est différente.'], [pKa - Math.log10(p / (1 - p)), 'Le signe du logarithme est inversé : une proportion de A⁻ supérieure à 50 % correspond à pH > pK_A.'], [pKa + Math.log10(p), 'Il faut le rapport frac(p|1 − p) dans le logarithme, pas p seul.'], [pKa + p / (1 - p), 'Il faut le logarithme décimal du rapport frac(p|1 − p), pas le rapport lui-même.']],
    expl: <>r = {avecIndices('frac(p|1 − p)')} = {avecIndices(`frac(${nb(p, 3)}|${nb(1 - p, 3)})`)} = {nb(p / (1 - p), 4)} ; pH = pK<sub>A</sub> + log r = {nb(pKa, 3)} + {nb(Math.log10(p / (1 - p)), 3)} = <b>{nb(pHp, 3)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([y]) => isFinite(y) && Math.abs(y - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Couples acide-base : rapport des deux formes, pourcentage de forme basique, concentration d’une forme et pH pour une proportion donnée.', questions: [q1, q2, q3, q4],
    retenir: ['frac([A⁻]|[AH]) = 10^(pH − pK_A) : pH < pK_A ⇒ AH domine ; pH > pK_A ⇒ A⁻ domine ; pH = pK_A ⇒ 50 % de chaque forme.', 'Pourcentage de A⁻ = 100 × frac(r|1 + r) avec r = frac([A⁻]|[AH]) ; [AH] = frac(C|1 + r) pour une concentration totale C.', 'Pour une proportion p de A⁻ : pH = pK_A + log(frac(p|1 − p)).'] };
}

// ───────────── Acides α-aminés (TG, sim 134) : rapports des formes, pourcentages, pH pour une proportion donnée ─────────────
function genAminoAcidesTG() {
  const sci = (x, cs = 2) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c])).join('')}`; };
  const a = AAM[tire(AAM_ORDRE)], K1 = a.pKa1, K2 = a.pKa2;
  const d1 = tire([0.5, 1, 1.5]), pH1 = Math.round((K1 + d1) * 10) / 10, r1 = 10 ** (pH1 - K1);
  const intro = <>{a.nom[0].toUpperCase() + a.nom.slice(1)} (chaîne latérale R = {a.R}) : <b>pK<sub>A1</sub> = {nb(K1, 2)}</b> (couple cation / zwitterion) et <b>pK<sub>A2</sub> = {nb(K2, 2)}</b> (couple zwitterion / anion), à 25 °C. Le pH de la solution est imposé.</>;
  const q1 = { id: 'a0', type: 'num', q: <>{intro} À <b>pH = {nb(pH1, 2)}</b>, calculez le rapport {avecIndices('frac([zwitterion]|[cation])')} (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: r1, tolRel: 0.05, csMin: 2,
    aide: 'Près de pK_A1, on lit le couple cation / zwitterion : frac([zwitterion]|[cation]) = 10^(pH − pK_A1).',
    pieges: [[1 / r1, 'Le rapport est inversé : le zwitterion est au numérateur.'], [pH1 - K1, 'C’est l’exposant pH − pK_A1 ; le rapport est 10 puissance cette valeur.'], [10 ** (pH1 - K2), 'Vous avez utilisé pK_A2 : près de pK_A1, on lit le couple 1 (cation / zwitterion).']],
    expl: <>pH − pK<sub>A1</sub> = {nb(pH1, 2)} − {nb(K1, 2)} = {nb(pH1 - K1, 2)} ; {avecIndices('frac([zwitterion]|[cation])')} = 10<sup>{nb(pH1 - K1, 2)}</sup> = <b>{nb(r1, 3)}</b>.</> };
  const pctCat = 100 / (1 + r1);
  const q2 = { id: 'a1', type: 'num', q: <>Pour la même solution (pH = {nb(pH1, 2)}), le rapport {avecIndices('frac([zwitterion]|[cation])')} vaut {nb(r1, 3)}. Calculez le <b>pourcentage de cation</b> (en %, 2 chiffres significatifs ; l’anion est négligeable à ce pH).</>, unite: '%', vrai: pctCat, tolRel: 0.05, csMin: 2,
    aide: 'Il n’y a que deux formes en quantité notable : % cation = 100 × frac(1|1 + r) avec r = [zwitterion] / [cation].',
    pieges: [[100 - pctCat, 'C’est le pourcentage de zwitterion ; on demande celui du cation.'], [100 / r1, 'Il faut diviser par la somme des deux formes (1 + r), pas par r seul.'], [1 / r1, 'C’est le rapport inversé [cation] / [zwitterion], pas un pourcentage du total.']],
    expl: <>% cation = 100 × {avecIndices(`frac(1|1 + ${nb(r1, 3)})`)} = <b>{nb(pctCat, 2)}{NB}%</b> (et {nb(100 - pctCat, 3)}{NB}% de zwitterion).</> };
  const d2 = tire([0.5, 1, 1.5, 2]), pH2 = Math.round((K2 - d2) * 10) / 10, r2 = 10 ** (pH2 - K2), pctAn = 100 * r2 / (1 + r2);
  const q3 = { id: 'a2', type: 'num', q: <>Dans une autre solution de la même espèce, le pH est <b>{nb(pH2, 2)}</b>. Près de pK<sub>A2</sub> = {nb(K2, 2)}, calculez le <b>pourcentage d’anion</b> (en %, 2 chiffres significatifs ; le cation est négligeable).</>, unite: '%', vrai: pctAn, tolRel: 0.05, csMin: 2,
    aide: 'Couple zwitterion / anion : r = frac([anion]|[zwitterion]) = 10^(pH − pK_A2), puis % anion = 100 × frac(r|1 + r).',
    pieges: [[100 - pctAn, 'C’est le pourcentage de zwitterion, la forme dominante ; on demande celui de l’anion.'], [r2, 'C’est le rapport, pas un pourcentage du total : multipliez par 100 et divisez par (1 + r).'], [100 * r2, 'Il faut diviser par la somme des deux formes (1 + r).'], [100 * (10 ** (pH2 - K1)) / (1 + 10 ** (pH2 - K1)), 'Vous avez utilisé pK_A1 : l’anion fait partie du couple 2 (zwitterion / anion).']],
    expl: <>r = 10<sup>{nb(pH2 - K2, 2)}</sup> = {sci(r2, 3)} ; % anion = 100 × {avecIndices('frac(r|1 + r)')} = <b>{nb(pctAn, 2)}{NB}%</b>.</> };
  const p = tire([0.1, 0.25, 0.75, 0.9]), pHp = K2 + Math.log10(p / (1 - p));
  const q4 = { id: 'a3', type: 'num', q: <>À quel pH l’anion représente-t-il <b>{nb(100 * p, 3)}{NB}%</b> de l’acide α-aminé ? Le couple utile est zwitterion / anion (pK<sub>A2</sub> = {nb(K2, 2)}) ; donnez le pH avec 2 décimales.</>, unite: '', vrai: pHp, tolRel: 0.005, csMin: 3,
    aide: 'r = frac([anion]|[zwitterion]) = frac(p|1 − p) avec p = proportion d’anion ; puis pH = pK_A2 + log r.',
    pieges: [[K2, 'C’est le pH où il y a 50 % de chaque forme ; ici la proportion est différente.'], [K2 - Math.log10(p / (1 - p)), 'Le signe du logarithme est inversé : si l’anion est majoritaire, pH > pK_A2 ; s’il est minoritaire, pH < pK_A2.'], [K1 + Math.log10(p / (1 - p)), 'Vous avez utilisé pK_A1 : l’anion est dans le couple 2.']],
    expl: <>r = {avecIndices(`frac(${nb(p, 3)}|${nb(1 - p, 3)})`)} = {nb(p / (1 - p), 4)} ; pH = pK<sub>A2</sub> + log r = {nb(K2, 2)} + {nb(Math.log10(p / (1 - p)), 3)} = <b>{nb(pHp, 3)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([y]) => isFinite(y) && Math.abs(y - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Acide α-aminé : rapport des formes près d’une frontière, pourcentage de cation, pourcentage d’anion et pH pour une proportion donnée.', questions: [q1, q2, q3, q4],
    retenir: ['Près de pK_A1 : frac([zwitterion]|[cation]) = 10^(pH − pK_A1) ; près de pK_A2 : frac([anion]|[zwitterion]) = 10^(pH − pK_A2).', 'Pourcentage de la forme basique d’un couple = 100 × frac(r|1 + r) ; pourcentage de la forme acide = 100 × frac(1|1 + r).', 'À pH = pK_A, 50 % de chaque forme du couple ; le zwitterion domine entre pK_A1 et pK_A2.'] };
}

// ───────────── Solution tampon (TG) : quantités avant/après un ajout d'acide, pH du tampon ─────────────
function genTamponTG() {
  const pKa = tire([4.76, 9.20]), n0 = tire([10, 15, 20, 25]), Ca = tire([0.10, 0.20]), Va = tire([5, 10, 20]), nH = Ca * Va;
  const q1 = { id: 't0', type: 'num', q: <>Un tampon contient <b>{nb(n0, 3)}{NB}mmol</b> d’acide faible AH et <b>{nb(n0, 3)}{NB}mmol</b> de base conjuguée A⁻ (pK<sub>A</sub> = {nb(pKa, 3)}). On y verse <b>{nb(Va, 3)}{NB}mL</b> d’acide chlorhydrique à <b>{nb(Ca, 2)}{NB}mol/L</b>. Calculez la quantité d’ions H₃O⁺ versée (en mmol, 2 chiffres significatifs).</>, unite: 'mmol', vrai: nH, tolRel: 0.02, csMin: 2,
    aide: 'n(H₃O⁺) = C × V ; avec C en mol/L et V en mL, le résultat est en mmol.',
    pieges: [[Ca * Va / 1000, 'Vous avez converti en mol : avec V en mL et C en mol/L, le produit C × V est directement en mmol.'], [Va / Ca, 'Il faut multiplier la concentration par le volume, pas les diviser.'], [Ca + Va, 'Ne les additionnez pas : n = C × V.']],
    expl: <>n(H₃O⁺) = {nb(Ca, 2)}{NB}mol/L × {nb(Va, 3)}{NB}mL = <b>{nb(nH, 3)}{NB}mmol</b>.</> };
  const nA = n0 - nH;
  const q2 = { id: 't1', type: 'num', q: <>Les ions H₃O⁺ versés ({nb(nH, 3)}{NB}mmol) réagissent de façon quasi totale avec la base du tampon : A⁻ + H₃O⁺ → AH + H₂O. Quelle quantité de A⁻ reste-t-il (en mmol, 3 chiffres significatifs) ?</>, unite: 'mmol', vrai: nA, tolRel: 0.006, csMin: 3,
    aide: 'Chaque mole de H₃O⁺ consomme une mole de A⁻ : n(A⁻) final = n(A⁻) initial − n(H₃O⁺) versé.',
    pieges: [[n0 + nH, 'C’est la quantité de AH après la réaction ; A⁻ est consommé, sa quantité diminue.'], [n0, 'Vous n’avez pas tenu compte de la réaction : A⁻ est consommé par les ions H₃O⁺.'], [nH, 'C’est la quantité d’ions H₃O⁺ versée, pas celle de A⁻ qui reste.']],
    expl: <>n(A⁻) = {nb(n0, 3)} − {nb(nH, 3)} = <b>{nb(nA, 3)}{NB}mmol</b>.</> };
  const nAH = n0 + nH;
  const q3 = { id: 't2', type: 'num', q: <>Toujours pour ce tampon, quelle quantité d’acide AH contient-il après l’ajout (en mmol, 3 chiffres significatifs) ?</>, unite: 'mmol', vrai: nAH, tolRel: 0.006, csMin: 3,
    aide: 'AH se forme à raison d’une mole par mole de H₃O⁺ consommé : n(AH) final = n(AH) initial + n(H₃O⁺) versé.',
    pieges: [[n0 - nH, 'C’est la quantité de A⁻ qui reste ; AH, lui, est formé par la réaction.'], [n0, 'Vous n’avez pas tenu compte de la réaction : AH se forme à partir de A⁻.'], [nH, 'C’est seulement la quantité formée ; ajoutez-la à la quantité initiale de AH.']],
    expl: <>n(AH) = {nb(n0, 3)} + {nb(nH, 3)} = <b>{nb(nAH, 3)}{NB}mmol</b>.</> };
  const pHf = pKa + Math.log10(nA / nAH);
  const q4 = { id: 't3', type: 'num', q: <>Le rapport des quantités n(A⁻) / n(AH) est égal au rapport des concentrations, et pH = pK<sub>A</sub> + log ([A⁻] / [AH]). Calculez le pH du tampon après l’ajout (2 décimales).</>, unite: '', vrai: pHf, tolRel: 0.004, csMin: 3,
    aide: 'Calculez le rapport n(A⁻) / n(AH) après l’ajout (les deux quantités des questions précédentes), puis son logarithme décimal, à ajouter au pK_A.',
    pieges: [[pKa, 'C’est le pH avant l’ajout (quantités égales) ; après l’ajout, le rapport n’est plus égal à 1.'], [pKa - Math.log10(nA / nAH), 'Le signe du logarithme est inversé : A⁻ a diminué, donc le pH est inférieur au pK_A.'], [pKa + Math.log10(nAH / nA), 'Le rapport est inversé : A⁻ est au numérateur.'], [Math.log10(nA / nAH), 'Il faut ajouter ce logarithme au pK_A, pas le donner seul.']],
    expl: <>n(A⁻) / n(AH) = {nb(nA, 3)} / {nb(nAH, 3)} = {nb(nA / nAH, 4)} ; pH = {nb(pKa, 3)} + log({nb(nA / nAH, 4)}) = <b>{nb(pHf, 3)}</b> : le pH n’a baissé que de {nb(pKa - pHf, 2)} unité.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([y]) => isFinite(y) && Math.abs(y - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Solution tampon : quantité d’acide versée, bilan de matière après la réaction avec la base du tampon, puis pH du tampon.', questions: [q1, q2, q3, q4],
    retenir: ['n(H₃O⁺) versé = C × V ; il est consommé par la base A⁻ du tampon : n(A⁻) diminue et n(AH) augmente de la même quantité.', 'Le rapport n(A⁻) / n(AH) change peu si l’ajout est modéré, donc le pH aussi : pH = pK_A + log (n(A⁻) / n(AH)).', 'Un tampon est épuisé quand toute la base A⁻ (ajout d’acide) ou tout l’acide AH (ajout de base) est consommé.'] };
}

// Pile (TG, sim 132) : quantités initiales, réactif limitant, capacité Q = n(e⁻) × F et durée de fonctionnement Δt = Q ÷ I (commentaire)
export function genPileTG() {
  let t;
  do {
    const [a, b] = tire(PILE_PAIRES), { plus, moins } = pilePoles(a, b);
    t = { plus, moins, c: tire([0.100, 0.150, 0.200]), V: tire([50.0, 100, 150]), m: tire([0.500, 1.00, 2.00, 3.00]), I: tire([20.0, 50.0, 100]) };
    const C = PILE_M[plus], A = PILE_M[moins];
    t.nIon = t.c * t.V; t.nMet = t.m / A.M * 1000; t.neIon = C.z * t.nIon; t.neMet = A.z * t.nMet;     // mmol
  } while (Math.max(t.neIon, t.neMet) / Math.min(t.neIon, t.neMet) < 1.3);
  const C = PILE_M[t.plus], A = PILE_M[t.moins], ne = Math.min(t.neIon, t.neMet), Q = ne / 1000 * 96500, dt = Q / (t.I / 1000) / 3600;
  const ionLim = t.neIon < t.neMet;
  const intro = <>Pile de réaction <b>{pileEquation(t.moins, t.plus)}</b>. Pôle + : <b>{nb(t.V, 3)}{NB}mL</b> de solution d’ions {C.ion} à <b>{nb(t.c, 3)}{NB}mol/L</b>. Pôle − : lame de {A.nom} de <b>{nb(t.m, 3)}{NB}g</b> (partie immergée ; M({A.m}) = {nb(A.M, 3)}{NB}g/mol). Demi-équations : {pileRed(t.plus)} ; {pileOx(t.moins)}. F = 9,65{NB}×{NB}10⁴{NB}C/mol.</>;
  const q1 = { id: 'p0', type: 'num', q: <>{intro} Calculez la quantité initiale d’ions {C.ion} (en mmol, 3 chiffres significatifs).</>, unite: 'mmol', vrai: t.nIon, tolRel: 0.01, csMin: 3,
    aide: 'n = c × V ; avec c en mol/L et V en mL, le produit est directement en mmol.',
    pieges: [[t.nIon / 1000, 'Valeur en mol : avec V en mL, le produit c × V est en mmol.'], [t.V / t.c, 'Il faut multiplier la concentration par le volume, pas les diviser.']],
    expl: <>n({C.ion}) = {nb(t.c, 3)}{NB}mol/L × {nb(t.V, 3)}{NB}mL = <b>{nb(t.nIon, 3)}{NB}mmol</b>.</> };
  const q2 = { id: 'p1', type: 'num', q: <>Toujours pour cette pile, calculez la quantité initiale de {A.nom} (en mmol, 3 chiffres significatifs).</>, unite: 'mmol', vrai: t.nMet, tolRel: 0.01, csMin: 3,
    aide: 'n = frac(m|M) donne des moles ; multipliez par 1000 pour obtenir des mmol.',
    pieges: [[t.nMet / 1000, 'Valeur en mol : la réponse est demandée en mmol (× 1000).'], [t.m * A.M, 'Il faut diviser la masse par la masse molaire, pas les multiplier.']],
    expl: <>n({A.m}) = <Frac haut={`${nb(t.m, 3)} g`} bas={`${nb(A.M, 3)} g/mol`}/> = {nb(t.nMet / 1000, 3)}{NB}mol = <b>{nb(t.nMet, 3)}{NB}mmol</b>.</> };
  const q3 = { id: 'p2', type: 'num', q: <>Calculez la quantité maximale d’électrons que la pile peut échanger (en mmol, 3 chiffres significatifs). Les quantités de {C.ion} et de {A.nom} sont celles des deux questions précédentes.</>, unite: 'mmol', vrai: ne, tolRel: 0.01, csMin: 3,
    aide: `Chaque ion ${C.ion} capte ${C.z} électron${C.z > 1 ? 's' : ''} et chaque atome de ${A.nom} en libère ${A.z} : comparez ${C.z} × n(${C.ion}) et ${A.z} × n(${A.m}) ; le plus petit correspond au réactif limitant.`,
    pieges: [[Math.max(t.neIon, t.neMet), 'C’est la quantité d’électrons du réactif en excès : le réactif limitant donne la plus petite valeur.'], [Math.min(t.nIon, t.nMet), 'Vous avez oublié le nombre d’électrons échangés par ion ou par atome (demi-équations).'], [t.neIon + t.neMet, 'Ne faites pas la somme : seul le réactif limitant fixe la quantité d’électrons.']],
    expl: <>{C.z} × {nb(t.nIon, 3)} = {nb(t.neIon, 3)}{NB}mmol et {A.z} × {nb(t.nMet, 3)} = {nb(t.neMet, 3)}{NB}mmol : le réactif limitant est {ionLim ? `l’ion ${C.ion}` : `le ${A.nom}`}, donc n(e⁻) = <b>{nb(ne, 3)}{NB}mmol</b>.</> };
  const q4 = { id: 'p3', type: 'num', q: <>Calculez la capacité électrique Q de la pile (en C, 3 chiffres significatifs), à partir de n(e⁻) = {nb(ne, 3)}{NB}mmol.</>, unite: 'C', vrai: Q, tolRel: 0.01, csMin: 3,
    aide: 'Q = n(e⁻) × F, avec n(e⁻) en mol (1 mmol = 10⁻³ mol).',
    pieges: [[ne * 96500, 'Vous avez utilisé n(e⁻) en mmol : convertissez en mol avant de multiplier par F.'], [Q / C.z, 'La quantité d’électrons tient déjà compte des demi-équations : ne divisez pas.']],
    expl: <>Q = {nb(ne / 1000, 3)}{NB}mol × 9,65{NB}×{NB}10⁴{NB}C/mol = <b>{nb(Q, 3)}{NB}C</b>.</> };
  const q5 = { id: 'p4', type: 'num', q: <>La pile (Q = {nb(Q, 3)}{NB}C) débite un courant constant de <b>{nb(t.I, 3)}{NB}mA</b>. Calculez sa durée de fonctionnement (en h, 3 chiffres significatifs).</>, unite: 'h', vrai: dt, tolRel: 0.01, csMin: 3,
    aide: 'Δt = frac(Q|I) avec I en A donne une durée en s ; divisez par 3 600 pour l’obtenir en heures.',
    pieges: [[dt * 3600, 'Durée en secondes : divisez par 3 600 pour obtenir des heures.'], [dt * 1000, 'Vous avez laissé I en mA : 1 mA = 10⁻³ A.'], [dt * 60, 'Durée en minutes : divisez encore par 60.']],
    expl: <>Δt = <Frac haut={`${nb(Q, 3)} C`} bas={`${nb(t.I / 1000, 3)} A`}/> = {nb(Q / (t.I / 1000), 3)}{NB}s, soit <b>{nb(dt, 3)}{NB}h</b>.</> };
  [q1, q2, q3, q4, q5].forEach(q => { q.pieges = q.pieges.filter(([y]) => isFinite(y) && Math.abs(y - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Pile : quantités initiales des réactifs, réactif limitant, quantité d’électrons échangés, capacité électrique et durée de fonctionnement.', questions: [q1, q2, q3, q4, q5],
    retenir: ['Quantités initiales : n = c × V pour l’ion du pôle +, n = frac(m|M) pour le métal du pôle −.', 'Le réactif limitant fixe la quantité d’électrons échangés, compte tenu des demi-équations : n(e⁻) = z × n.', 'Capacité : Q = n(e⁻) × F (n(e⁻) en mol) ; durée de fonctionnement : Δt = frac(Q|I).'] };
}

// Électrolyse (TG, sim 133) : charge passée, électrons échangés, métal déposé, masse, durée pour un dépôt donné.
export function genElectrolyseTG() {
  const id = tire(['zn', 'fe', 'cu', 'ag']), X = PILE_M[id];
  const I = tire([0.200, 0.500, 1.00, 1.50]), tmin = tire([10.0, 15.0, 20.0, 30.0, 45.0]), mCible = tire([0.500, 1.00, 2.00]);
  const dts = tmin * 60, Q = I * dts, ne = Q / 96500 * 1000, n = ne / X.z, m = n / 1000 * X.M;    // ne et n en mmol
  const dtCible = X.z * 96500 * mCible / (X.M * I) / 60;                                           // min
  const intro = <>Électrolyse d’une solution de {X.sol} : sur la cathode reliée à la borne − du générateur, {pileRed(id)}. Le générateur fait passer un courant d’intensité constante <b>I = {nb(I, 3)}{NB}A</b> pendant <b>Δt = {nb(tmin, 3)}{NB}min</b>. M({X.m}) = {nb(X.M, 3)}{NB}g/mol ; F = 9,65{NB}×{NB}10⁴{NB}C/mol.</>;
  const q1 = { id: 'e0', type: 'num', q: <>{intro} Calculez la charge électrique Q qui a traversé le circuit (en C, 3 chiffres significatifs).</>, unite: 'C', vrai: Q, tolRel: 0.01, csMin: 3,
    aide: 'Q = I × Δt avec I en A et Δt en s (1 min = 60 s).',
    pieges: [[I * tmin, 'Vous avez laissé Δt en minutes : convertissez en secondes (× 60).'], [I * tmin / 60, 'Vous avez exprimé Δt en heures : il faut des secondes pour obtenir des coulombs.'], [dts / I, 'Il faut multiplier I par Δt, pas diviser.']],
    expl: <>Δt = {nb(tmin, 3)} × 60 = {nb(dts, 3)}{NB}s ; Q = {nb(I, 3)}{NB}A × {nb(dts, 3)}{NB}s = <b>{nb(Q, 3)}{NB}C</b>.</> };
  const q2 = { id: 'e1', type: 'num', q: <>Toujours pour cette électrolyse (Q = {nb(Q, 3)}{NB}C), calculez la quantité d’électrons échangés n(e⁻) (en mmol, 3 chiffres significatifs).</>, unite: 'mmol', vrai: ne, tolRel: 0.01, csMin: 3,
    aide: 'n(e⁻) = frac(Q|F) donne des moles ; multipliez par 1000 pour obtenir des mmol.',
    pieges: [[ne / 1000, 'Valeur en mol : la réponse est demandée en mmol (× 1000).'], [Q * 96500, 'Il faut diviser la charge par F, pas la multiplier.'], [Q / 96.5, 'F vaut 9,65 × 10⁴ C/mol, pas 96,5.']],
    expl: <>n(e⁻) = <Frac haut={`${nb(Q, 3)} C`} bas="9,65 × 10⁴ C/mol"/> = {nb(ne / 1000, 3)}{NB}mol = <b>{nb(ne, 3)}{NB}mmol</b>.</> };
  const q3 = { id: 'e2', type: 'num', q: <>Avec n(e⁻) = {nb(ne, 3)}{NB}mmol, calculez la quantité de {X.nom} déposé sur la cathode (en mmol, 3 chiffres significatifs).</>, unite: 'mmol', vrai: n, tolRel: 0.01, csMin: 3,
    aide: `Demi-équation : ${pileRed(id)}. Il faut ${X.z} électron${X.z > 1 ? 's' : ''} pour déposer un atome de ${X.nom}.`,
    pieges: [[ne, `C’est la quantité d’électrons : divisez-la par ${X.z} (demi-équation).`], [ne * X.z, `Il faut diviser par ${X.z}, pas multiplier.`]],
    expl: <>n({X.m}) = <Frac haut="n(e⁻)" bas={String(X.z)}/> = <b>{nb(n, 3)}{NB}mmol</b>.</> };
  const q4 = { id: 'e3', type: 'num', q: <>Calculez la masse de {X.nom} déposé (en g, 3 chiffres significatifs), à partir de n({X.m}) = {nb(n, 3)}{NB}mmol.</>, unite: 'g', vrai: m, tolRel: 0.01, csMin: 3,
    aide: 'm = n × M, avec n en mol (1 mmol = 10⁻³ mol).',
    pieges: [[n * X.M, 'Vous avez utilisé n en mmol : le résultat serait en mg. Convertissez n en mol.'], [n / 1000 / X.M, 'Il faut multiplier par la masse molaire, pas diviser.'], [ne / 1000 * X.M, 'Vous êtes parti de n(e⁻) au lieu de n(métal).']],
    expl: <>m = {nb(n / 1000, 3)}{NB}mol × {nb(X.M, 3)}{NB}g/mol = <b>{nb(m, 3)}{NB}g</b>.</> };
  const q5 = { id: 'e4', type: 'num', q: <>Avec la même intensité ({nb(I, 3)}{NB}A), combien de temps faut-il pour déposer <b>{nb(mCible, 3)}{NB}g</b> de {X.nom} ? (en min, 3 chiffres significatifs)</>, unite: 'min', vrai: dtCible, tolRel: 0.01, csMin: 3,
    aide: `n = frac(m|M) ; n(e⁻) = ${X.z} × n ; Q = n(e⁻) × F ; Δt = frac(Q|I) en s, puis divisez par 60.`,
    pieges: [[dtCible * 60, 'Durée en secondes : divisez par 60 pour l’obtenir en minutes.'], [dtCible / X.z, `Vous avez oublié les ${X.z} électrons par atome déposé.`], [dtCible * X.z * X.z, 'Multipliez par le nombre d’électrons une seule fois.']],
    expl: <>n = <Frac haut={`${nb(mCible, 3)} g`} bas={`${nb(X.M, 3)} g/mol`}/> = {nb(mCible / X.M, 3)}{NB}mol ; Q = {X.z} × {nb(mCible / X.M, 3)} × 9,65{NB}×{NB}10⁴ = {nb(X.z * 96500 * mCible / X.M, 3)}{NB}C ; Δt = <Frac haut={`${nb(X.z * 96500 * mCible / X.M, 3)} C`} bas={`${nb(I, 3)} A`}/> = {nb(dtCible * 60, 3)}{NB}s = <b>{nb(dtCible, 3)}{NB}min</b>.</> };
  [q1, q2, q3, q4, q5].forEach(q => { q.pieges = q.pieges.filter(([y]) => isFinite(y) && y > 0 && Math.abs(y - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Électrolyse : charge électrique passée, quantité d’électrons échangés, quantité et masse de métal déposé, durée nécessaire pour un dépôt donné.', questions: [q1, q2, q3, q4, q5],
    retenir: ['Charge passée : Q = I × Δt (I en A, Δt en s).', 'Quantité d’électrons : n(e⁻) = frac(Q|F), avec F = 9,65 × 10⁴ C/mol.', 'La demi-équation donne la quantité de produit : n(métal) = frac(n(e⁻)|z) ; puis m = n × M.'] };
}

// ──────────────────────── Familles « Plans d'expériences » (BTS) ────────────────────────
function genPlanMelange() {
  const comp = ['cire de candelilla (A)', 'huile de ricin (B)', 'cire d’abeille (C)'];
  const i = Math.floor(Math.random() * 3), m = tire([[1.088, 0.704, 1.408], [1.2, 0.8, 1.0], [0.9, 1.1, 1.0], [1.5, 0.5, 1.0]]);
  const tot = m[0] + m[1] + m[2], x = m[i] / tot;
  const q1 = { id: 'm0', type: 'num', q: <>Une formule contient <b>{nb(m[0], 4)}{NB}g</b> de {comp[0]}, <b>{nb(m[1], 4)}{NB}g</b> de {comp[1]} et <b>{nb(m[2], 4)}{NB}g</b> de {comp[2]}. Calculez la fraction massique de {comp[i]} (nombre sans unité, entre 0 et 1).</>, unite: '', vrai: x, csMin: 2,
    aide: 'La fraction est la masse du composant divisée par la masse TOTALE des trois corps gras.',
    pieges: [[m[i] / (tot - m[i]), 'Vous avez divisé par la masse des deux AUTRES composants : le dénominateur est la masse totale, composant compris.'], [x * 100, 'Valeur juste en pourcentage ; ici on demande une fraction (entre 0 et 1).']],
    expl: <>Masse totale = {nb(m[0], 4)} + {nb(m[1], 4)} + {nb(m[2], 4)} = {nb(tot, 4)}{NB}g, donc x = {nb(m[i], 4)} / {nb(tot, 4)} = <b>{nb(x, 2)}</b>. Les trois fractions somment à 1.</> };
  const cas = tire([{ n: [5, 2, 8], noms: ['candelilla (A)', 'huile de ricin (B)'] }, { n: [5, 8, 6], noms: ['candelilla (A)', 'cire d’abeille (C)'] }, { n: [2, 8, 0], noms: ['huile de ricin (B)', 'cire d’abeille (C)'] }]);
  const noms = cas.noms, [p1, p2, y3] = cas.n;
  const yA = p1, yB = p2, yAB = y3, ec = yAB - (yA + yB) / 2, beta = 4 * ec;
  const q2 = { id: 'm1', type: 'num', q: <>Notes du jury (sur 10) : {noms[0]} seul <b>{yA}</b>, {noms[1]} seul <b>{yB}</b>, mélange à parts égales des deux <b>{yAB}</b>. Calculez l’écart au milieu : note du mélange moins moyenne des notes des deux corps purs.</>, unite: '', vrai: ec, csMin: 2,
    aide: 'Sans interaction, le mélange 50/50 aurait la moyenne des deux notes pures. L’écart au milieu = y_AB − (y_A + y_B)/2, avec son signe.',
    pieges: [[-ec, 'Le signe est inversé : on retranche la moyenne des purs à la note du mélange (pas l’inverse).'], [yAB - yA, 'Vous avez comparé le mélange à un seul des deux corps purs : il faut leur moyenne.']],
    expl: <>Moyenne des purs = ({yA} + {yB}) / 2 = {nb((yA + yB) / 2, 3)} ; écart = {yAB} − {nb((yA + yB) / 2, 3)} = <b>{nb(ec, 3)}</b>. {ec > 0 ? 'Positif : synergie, le mélange est meilleur que prévu.' : 'Négatif : le mélange est moins bon que prévu.'}</> };
  const q3 = { id: 'm2', type: 'num', q: <>Pour ce mélange, l’écart au milieu vaut {nb(ec, 3)}. Calculez le coefficient d’interaction binaire β (modèle de Scheffé), sachant que β = 4 × (écart au milieu).</>, unite: '', vrai: beta, csMin: 2,
    aide: 'Au milieu, x_A·x_B = 0,25 : l’écart au milieu vaut β / 4, donc β = 4 × écart.',
    pieges: [[ec, 'Vous avez gardé l’écart au milieu : il vaut β·x_A·x_B = β / 4, donc β est 4 fois plus grand.'], [2 * ec, 'Le facteur est 4 (car x_A·x_B = 0,5 × 0,5 = 1/4), pas 2.']],
    expl: <>β = 4 × {nb(ec, 3)} = <b>{nb(beta, 3)}</b>. Vérification : 4·y_AB − 2·y_A − 2·y_B = {4 * yAB} − {2 * yA} − {2 * yB} = {nb(beta, 3)}.</> };
  const [xa, xb] = tire([[0.75, 0.25], [0.25, 0.75]]), y = yA * xa + yB * xb + beta * xa * xb;
  const q4 = { id: 'm3', type: 'num', q: <>Avec le même modèle y = {yA}·x_A + {yB}·x_B + ({nb(beta, 3)})·x_A·x_B, calculez la note prévue pour un mélange de fractions x_A = <b>{nb(xa, 2)}</b> et x_B = <b>{nb(xb, 2)}</b> (les deux composants seuls, pas de troisième).</>, unite: '', vrai: y, csMin: 2,
    aide: 'Calculez les deux termes linéaires, puis le terme d’interaction avec le PRODUIT x_A·x_B, et additionnez. Pas de constante.',
    pieges: [[yA * xa + yB * xb + beta * xa, 'Dans le terme d’interaction, il faut le produit x_A·x_B, pas x_A seul.'], [yA * xa + yB * xb, 'Vous avez oublié le terme d’interaction β·x_A·x_B.']],
    expl: <>y = {yA} × {nb(xa, 2)} + {yB} × {nb(xb, 2)} + ({nb(beta, 3)}) × {nb(xa, 2)} × {nb(xb, 2)} = <b>{nb(y, 3)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([v]) => isFinite(v) && Math.abs(v - q.vrai) > 1e-9); });
  return { intro: 'Plan de mélange du rouge à lèvres : fractions, écart au milieu, coefficient d’interaction et prévision.', questions: [q1, q2, q3, q4],
    retenir: ['Les fractions d’un mélange vérifient x_A + x_B + x_C = 1 : on divise par la masse TOTALE.', 'Écart au milieu = y_AB − (y_A + y_B)/2 : positif = synergie, négatif = antagonisme.', 'Coefficient binaire : β_AB = 4·y_AB − 2·y_A − 2·y_B = 4 × écart au milieu.', 'Modèle de mélange : pas de constante ; le terme d’interaction contient le PRODUIT x_A·x_B.'] };
}

function genPlanFactoriel() {
  const f = tire([{ nom: 'la température de travail', u: '°C', bas: 75, haut: 102, vals: [82, 95, 100] }, { nom: 'la masse de sel', u: 'g', bas: 1, haut: 2, vals: [1.25, 1.75] }, { nom: 'la masse de xanthane', u: 'g', bas: 0.2, haut: 0.4, vals: [0.25, 0.35] }, { nom: 'la masse d’amidon Ultratech', u: 'g', bas: 0.9, haut: 2.2, vals: [1.8, 1.2] }]);
  const v = tire(f.vals), c = (f.bas + f.haut) / 2, dem = (f.haut - f.bas) / 2, xc = (v - c) / dem;
  const q1 = { id: 'f0', type: 'num', q: <>Pour {f.nom}, le niveau bas (codé −1) vaut <b>{nb(f.bas, 3)}{NB}{f.u}</b> et le niveau haut (codé +1) vaut <b>{nb(f.haut, 3)}{NB}{f.u}</b>. Quelle est la valeur codée d’un essai à <b>{nb(v, 3)}{NB}{f.u}</b> ?</>, unite: '', vrai: xc, csMin: 2,
    aide: 'Valeur codée = (valeur réelle − centre) / demi-étendue, avec centre = (bas + haut)/2 et demi-étendue = (haut − bas)/2.',
    pieges: [[(v - f.bas) / (f.haut - f.bas), 'Ce codage va de 0 à 1 ; le codage du plan est symétrique, de −1 à +1 : on soustrait le CENTRE et on divise par la DEMI-étendue.'], [(v - c) / (f.haut - f.bas), 'Il faut diviser par la demi-étendue (haut − bas)/2, pas par l’étendue totale.']],
    expl: <>Centre = ({nb(f.bas, 3)} + {nb(f.haut, 3)}) / 2 = {nb(c, 4)} ; demi-étendue = ({nb(f.haut, 3)} − {nb(f.bas, 3)}) / 2 = {nb(dem, 3)}. Valeur codée = ({nb(v, 3)} − {nb(c, 4)}) / {nb(dem, 3)} = <b>{nb(xc, 3)}</b>.</> };
  const cas = tire([{ r: 'la note moyenne du jury', f: 'la recette végétale', mp: 2.375, mm: 6.25, d: 3 }, { r: 'la viscosité moyenne', f: 'la température de 102 °C', mp: 5309.5, mm: 1486.25, d: 2 }, { r: 'la note moyenne du jury', f: 'l’amidon Novation', mp: 7.3375, mm: 3.7625, d: 4 }]);
  const a = (cas.mp - cas.mm) / 2;
  const q2 = { id: 'f1', type: 'num', q: <>Plan factoriel du TP. Pour {cas.f}, {cas.r} vaut <b>{nb(cas.mp, 5)}</b> sur les essais au niveau +1 et <b>{nb(cas.mm, 5)}</b> sur les essais au niveau −1. Calculez le coefficient de ce facteur dans le modèle (avec son signe).</>, unite: '', vrai: a, csMin: 3,
    aide: 'Le coefficient est la moitié de l’écart entre les deux moyennes : a = (Moy⁺ − Moy⁻) / 2, car x passe de −1 à +1.',
    pieges: [[2 * a, 'Vous avez calculé l’effet total (Moy⁺ − Moy⁻) ; le coefficient est la moitié, car le codage va de −1 à +1 (2 unités).'], [-a, 'Le signe est inversé : on retranche la moyenne du niveau −1 à celle du niveau +1.']],
    expl: <>a = ({nb(cas.mp, 5)} − {nb(cas.mm, 5)}) / 2 = <b>{nb(a, 4)}</b>.</> };
  const [xU, xN] = tire([[1, 1], [1, -1], [-1, 1], [-1, -1]]), a0 = 5.55, aU = 0.5375, aN = 1.7875, aUN = -0.825, y = a0 + aU * xU + aN * xN + aUN * xU * xN;
  const q3 = { id: 'f2', type: 'num', q: <>Pour la vinaigrette, on garde le modèle réduit y = {nb(a0, 3)} + {nb(aU, 4)}·x_U + {nb(aN, 4)}·x_N − {nb(-aUN, 3)}·x_U·x_N (U : amidon Ultratech, N : amidon Novation ; note sur 10). Calculez la note prévue pour <b>x_U = {xU > 0 ? '+1' : '−1'}</b> et <b>x_N = {xN > 0 ? '+1' : '−1'}</b>.</>, unite: '', vrai: y, csMin: 3,
    aide: 'Remplacez x_U et x_N par ±1 (avec leur signe), sans oublier le produit x_U·x_N dans le dernier terme.',
    pieges: [[a0 + aU * xU + aN * xN, 'Vous avez oublié le terme d’interaction x_U·x_N : son coefficient est négatif ici.'], [a0 + aU * xU + aN * xN - aUN * xU * xN, 'Le signe du terme d’interaction est inversé : le coefficient est −0,825 et le produit x_U·x_N vaut ' + xU * xN + '.']],
    expl: <>y = {nb(a0, 3)} + {nb(aU, 4)} × ({xU}) + {nb(aN, 4)} × ({xN}) + ({nb(aUN, 3)}) × ({xU * xN}) = <b>{nb(y, 3)}</b>.</> };
  const [k, p] = tire([[3, 5], [3, 6], [4, 8], [4, 11], [4, 7]]), n = 2 ** k, ddl = n - p;
  const q4 = { id: 'f3', type: 'num', q: <>On réalise un plan factoriel complet à <b>{k}</b> facteurs à deux niveaux (sans répétition). Le modèle ajusté comporte <b>{p}</b> coefficients (constante comprise). Combien de degrés de liberté reste-t-il pour estimer l’écart-type ?</>, unite: '', vrai: ddl, csMin: 1,
    aide: 'Nombre d’essais n = 2^k ; degrés de liberté = n − p.',
    pieges: [[n - p - 1, 'Vous avez retiré un degré de plus : la constante est déjà comptée parmi les p coefficients, ddl = n − p.'], [n, 'Vous avez donné le nombre d’essais ; il faut retirer le nombre de coefficients.']],
    expl: <>n = 2<sup>{k}</sup> = {n} essais ; ddl = n − p = {n} − {p} = <b>{ddl}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > 1e-9); });
  return { intro: 'Plan factoriel à deux niveaux : coder, calculer un coefficient, prévoir une réponse, compter les degrés de liberté.', questions: [q1, q2, q3, q4],
    retenir: ['Codage : x = (valeur − centre) / demi-étendue ; −1 au niveau bas, +1 au niveau haut, 0 au centre.', 'Coefficient = moitié de l’écart entre les moyennes des niveaux +1 et −1 : a = (Moy⁺ − Moy⁻) / 2.', 'Prévision : on remplace les x par leurs valeurs codées, interactions comprises (produits des x).', 'Degrés de liberté = n − p : sans eux, on ne peut ni estimer σ ni tester.'] };
}

export const FAMILLES = [
  { id: 'vecteur-somme', groupe: 'Vecteurs', titre: 'Somme de deux vecteurs (forces)', gen: genSomme },
  { id: 'vecteur-difference', groupe: 'Vecteurs', titre: 'Différence de deux vecteurs (variation de vitesse)', gen: genDifference },
  { id: 'interactions', groupe: 'Unités', titre: 'Forces et champs : Coulomb, gravitation (1re spé)', gen: genInteractions, domaine: 'Interactions et champs' },
  { id: 'lum1-signes', groupe: 'Formules', titre: 'Lentille mince : les signes des distances algébriques, pas à pas (1re spé)', gen: genLentilleSignes, domaine: 'Lentille mince' },
  { id: 'oeil-accommodation', groupe: 'Formules', titre: 'L’œil réduit : accommodation et diamètre apparent (terminale STL)', gen: genOeilAccomm, domaine: 'Œil et loupe' },
  { id: 'oeil-loupe', groupe: 'Formules', titre: 'La loupe : grossissement et position de l’image (terminale STL)', gen: genOeilLoupe, domaine: 'Œil et loupe' },
  { id: 'microsc-grossissement', groupe: 'Formules', titre: 'Le microscope : grandissement et grossissement (terminale STL)', gen: genMicroGrossissement, domaine: 'Microscope' },
  { id: 'lunet-grossissement', groupe: 'Formules', titre: 'La lunette astronomique : grossissement et distance entre les lentilles (terminale STL)', gen: genLunetteGrossissement, domaine: 'Lunette astronomique' },
  { id: 'lunet-image', groupe: 'Formules', titre: 'La lunette astronomique : image intermédiaire et œil myope (terminale STL)', gen: genLunetteImage, domaine: 'Lunette astronomique' },
  { id: 'microsc-mise-au-point', groupe: 'Formules', titre: 'Le microscope mis au point : positions et taille de l’image intermédiaire (terminale STL)', gen: genMicroMiseAuPoint, domaine: 'Microscope' },
  { id: 'lum1-conjugaison', groupe: 'Formules', titre: 'Lentille mince : conjugaison et grandissement (1re spé)', gen: genLentille, domaine: 'Lentille mince' },
  { id: 'pmel-calcul', groupe: 'Formules', titre: 'Plan de mélange : fractions, écart au milieu, coefficient binaire et prévision (BTS)', gen: genPlanMelange, domaine: 'Plans' },
  { id: 'pfac-calcul', groupe: 'Formules', titre: 'Plan factoriel : codage, coefficient, prévision et degrés de liberté (BTS)', gen: genPlanFactoriel, domaine: 'Plans' },
  { id: 'dop-calcul', groupe: 'Formules', titre: 'Effet Doppler : du décalage à la vitesse (TSTL)', gen: genDoppler, domaine: 'Ondes' },
  { id: 'dopg-calcul', groupe: 'Formules', titre: 'Effet Doppler : établir l’expression, son et lumière (TG)', gen: genDopplerTG, domaine: 'Ondes' },
  { id: 'titph-calcul', groupe: 'Formules', titre: 'Titrage pH-métrique : quantités de matière, V_E et C_A (TG)', gen: genTitrageTG, domaine: 'Titrage pH-métrique' },
  { id: 'phc-calcul', groupe: 'Formules', titre: 'pH et concentration en ions oxonium : relation et dilution (TG)', gen: genPhConcTG, domaine: 'pH et concentration en ions oxonium' },
  { id: 'cinv-calcul', groupe: 'Formules', titre: 'Cinétique : vitesse volumique, demi-réactions et constante d’ordre 1 (TG)', gen: genCinetiqueTG, domaine: 'Cinétique : vitesse volumique et ordre 1' },
  { id: 'rad-calcul', groupe: 'Formules', titre: 'Radioactivité : constante λ, noyaux restants, activité et datation (TG)', gen: genRadioactiviteTG, domaine: 'Radioactivité : décroissance et demi-vie' },
  { id: 'equ-calcul', groupe: 'Formules', titre: 'Équilibre chimique : Qr, K, taux d’avancement final et ajout d’un réactif (TG)', gen: genEquilibreTG, domaine: 'Équilibre chimique : Qr, K et taux d’avancement' },
  { id: 'fab-calcul', groupe: 'Formules', titre: 'Force des acides : pH, constante d’acidité, ions hydroxyde et équation du second degré (TG)', gen: genForceAcidesTG, domaine: 'Force des acides et des bases : Ka et tampon' },
  { id: 'pdi-calcul', groupe: 'Formules', titre: 'Couples acide-base : rapport des formes, pourcentage, concentration et pH (TG)', gen: genPredominanceTG, domaine: 'Force des acides et des bases : Ka et tampon' },
  { id: 'tmp-calcul', groupe: 'Formules', titre: 'Solution tampon : ajout d’acide, bilan de matière et pH du tampon (TG)', gen: genTamponTG, domaine: 'Force des acides et des bases : Ka et tampon' },
  { id: 'aam-calcul', groupe: 'Formules', titre: 'Acides α-aminés : rapport des formes, pourcentages et pH pour une proportion (TG)', gen: genAminoAcidesTG, domaine: 'Acides α-aminés : forme selon le pH' },
  { id: 'pil-calcul', groupe: 'Formules', titre: 'Pile : réactif limitant, capacité électrique et durée de fonctionnement (TG)', gen: genPileTG, domaine: 'Piles : fonctionnement et capacité' },
  { id: 'ely-calcul', groupe: 'Formules', titre: 'Électrolyse : charge passée, électrons échangés, métal déposé et durée (TG)', gen: genElectrolyseTG, domaine: 'Électrolyse : forcer le sens d’évolution' },
  { id: 'vitesses', groupe: 'Unités', titre: 'Vitesses : km·h⁻¹ et m·s⁻¹ (seconde)', gen: genVitesses, domaine: 'Mouvement et vitesse' },
  { id: 'simple', groupe: 'Unités', titre: 'Changement d’unité simple', gen: genSimple },
  { id: 'prefixes', groupe: 'Unités', titre: 'Préfixes et puissances de 10', gen: genPrefixes },
  { id: 'puissances', groupe: 'Unités', titre: 'Unités au carré, au cube (cm², mm³, L)', gen: genPuissances },
  { id: 'composees', groupe: 'Unités', titre: 'Unités composées (L·h⁻¹, g·cm⁻³…)', gen: genComposees },
  { id: 'mixte', groupe: 'Unités', titre: 'Calcul avec conversions cachées', gen: () => { const e = genMixte(); return { ...e, retenir: RETENIR_MIXTE }; } },
  { id: 'trace-courbe', groupe: 'Graphiques et capteurs', titre: 'Tracer une courbe à partir d’un tableau', gen: genTrace },
  { id: 'pont-diviseur', groupe: 'Graphiques et capteurs', titre: 'Application numérique : pont diviseur de tension', gen: genPont, domaine: 'Transmission de signaux numériques' },
  { id: 'temps-reponse', groupe: 'Graphiques et capteurs', titre: 'Temps de réponse à 5 % d’un capteur', gen: genTemps, domaine: 'Transmission de signaux numériques' },
  { id: 'isoler', groupe: 'Formules', titre: 'Isoler une grandeur', gen: genIsoler },
  { id: 'cs', groupe: 'Résultat numérique', titre: 'Chiffres significatifs et arrondi', gen: genCS },
  { id: 'fonctions', groupe: 'Résultat numérique', titre: 'Fonctions usuelles : log, exp, racine', gen: genFonctions },
  { id: 'calculatrice', groupe: 'Résultat numérique', titre: 'Saisie à la calculatrice', gen: genCalculatrice },
];
export const GROUPES = ['Unités', 'Formules', 'Résultat numérique', 'Graphiques et capteurs', 'Vecteurs'];
