import { Frac, lireNombre, nbCS } from "../commun";
import { Chaine, ConvPrefixe, facteurK, analyser } from "./DebitsFluides";
import { FigureVecteurs, Vec } from "./FigureVecteurs";
import { genTrace, genPont, genTemps } from "./RealiserC1";

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

export const FAMILLES = [
  { id: 'vecteur-somme', groupe: 'Vecteurs', titre: 'Somme de deux vecteurs (forces)', gen: genSomme },
  { id: 'vecteur-difference', groupe: 'Vecteurs', titre: 'Différence de deux vecteurs (variation de vitesse)', gen: genDifference },
  { id: 'interactions', groupe: 'Unités', titre: 'Forces et champs : Coulomb, gravitation (1re spé)', gen: genInteractions, domaine: 'Interactions et champs' },
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
