import { Frac, FormuleEnLigne, avecIndices, lireNombre, nbCS } from "../commun";
import { Chaine, ConvPrefixe, facteurK, analyser } from "./DebitsFluides";
import { indice as indiceTopo } from "./topoModele";
import { FigureVecteurs, Vec } from "./FigureVecteurs";
import { genTrace, genPont, genTemps } from "./RealiserC1";
import { ACIDES as AAM, ORDRE as AAM_ORDRE } from "./aminoAcidesModele";
import { IONS as CDT_I } from "./conductimetrieModele";
import * as ACF from "./acideFaibleModele";
import * as QM from "./quantiteMatiereModele";
import * as CD from "./concentrationModele";
import * as LW from "./lewisModele";
import * as SV from "./savonModele";
import * as DM from "./dissolutionModele";
import * as ME from "./mesureModele";
import * as CM from "./combustionModele";
import * as RX from "./redoxModele";
import * as KEP from "./satellitesModele";
import * as CL from "./couleursModele";
import * as PH from "./photonModele";
import * as PM from "./pressionModele";
import * as SF from "./statiqueFluidesModele";
import * as AB from "./acidesBasesModele";
import * as PRE from "./predoTstlModele";
import * as TMP from "./tamponTstlModele";
import * as CO2 from "./co2DissousModele";
import * as EXT from "./extractionAcideBaseModele";
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

// ──────────────────────── Famille « Ondes mécaniques : célérité et retard » (1re spécialité) ────────────────────────
function genOndCelerite() {
  const dec = x => String(Number(x.toFixed(6))).replace('.', ',');
  const [milieu, d, dt] = tire([['un matériau', 34, 1], ['un matériau', 51, 1.5], ['un matériau', 75, 0.5], ['un matériau', 150, 1], ['un matériau', 60, 0.5], ['un matériau', 64, 0.2], ['un matériau', 48, 0.2], ['un matériau', 40, 0.5], ['un matériau', 59, 0.1], ['un matériau', 118, 0.2]]);
  const c = d * 10 / dt;                                        // m/s : d (cm) → m, Δt (ms) → s
  const q1 = { id: 'o0', type: 'num', q: <>Deux capteurs, distants de <b>{d}{NB}cm</b>, détectent le même signal sonore dans {milieu} avec un retard de <b>{nb(dt, 2)}{NB}ms</b>. Calculez la célérité c du son, en <b>m/s</b>.</>, unite: 'm/s', vrai: c, csMin: 2,
    aide: 'c = d ÷ Δt. Convertissez d en mètres (1 cm = 0,01 m) et Δt en secondes (1 ms = 0,001 s) avant de diviser.',
    pieges: [[c / 10, 'Vous avez divisé directement des cm par des ms : 1 cm/ms = 10 m/s. Convertissez d en m et Δt en s.'], [dt / d * 10, 'Vous avez calculé Δt ÷ d : la célérité est d ÷ Δt.']],
    expl: <>d = {d}{NB}cm = {dec(d / 100)}{NB}m et Δt = {nb(dt, 2)}{NB}ms = {dec(dt / 1000)}{NB}s, donc c = d ÷ Δt = <b>{avecU(c, 'm/s', 3)}</b>.</> };
  const dtO = tire([2, 3, 4, 5, 7, 8, 10]), dkm = 0.34 * dtO;
  const q2 = { id: 'o1', type: 'num', q: <>Un éclair est vu, puis le tonnerre est entendu <b>{dtO}{NB}s</b> plus tard. La célérité du son dans l’air est c = 340{NB}m/s ; la lumière arrive quasi instantanément. Calculez la distance de l’éclair, en <b>km</b>.</>, unite: 'km', vrai: dkm, csMin: 2, tolRel: 0.05,
    aide: 'd = c × Δt, en mètres, puis convertissez en kilomètres (1 km = 1 000 m).',
    pieges: [[340 * dtO, 'Ce résultat est en mètres : divisez par 1 000 pour l’exprimer en km.'], [340 / dtO, 'Vous avez divisé c par Δt : la distance est c × Δt.']],
    expl: <>d = c × Δt = 340 × {dtO} = {dec(340 * dtO)}{NB}m, soit <b>{avecU(dkm, 'km', 2)}</b>.</> };
  const dtE = tire([40, 60, 80, 100, 120, 160, 200]), H = 0.75 * dtE;
  const q3 = { id: 'o2', type: 'num', q: <>Le sondeur d’un bateau reçoit l’écho du fond <b>{dtE}{NB}ms</b> après l’émission. La célérité du son dans l’eau est c = 1{NB}500{NB}m/s. Calculez la profondeur de la mer, en <b>m</b>.</>, unite: 'm', vrai: H, csMin: 2,
    aide: 'Le signal fait un aller-retour : il parcourt c × Δt, soit deux fois la profondeur. Convertissez Δt en secondes.',
    pieges: [[2 * H, 'Vous avez oublié l’aller-retour : la distance c × Δt est le double de la profondeur.'], [H * 1000, 'Vous avez gardé Δt en ms : convertissez-le en secondes (1 ms = 0,001 s) avant de calculer.']],
    expl: <>Distance parcourue : c × Δt = 1 500 × {dec(dtE / 1000)} = {dec(2 * H)}{NB}m (aller-retour), donc profondeur = <b>{avecU(H, 'm', 2)}</b>.</> };
  const k = tire([1, 2, 3, 5, 10]), dA = Number((5.9 * k).toFixed(1));
  const q4 = { id: 'o3', type: 'num', q: <>Dans l’acier, la célérité du son est c = 5{NB}900{NB}m/s. Un signal parcourt une barre d’acier de <b>{dec(dA)}{NB}m</b>. Calculez la durée de propagation Δt, en <b>ms</b>.</>, unite: 'ms', vrai: k, csMin: 1,
    aide: 'Δt = d ÷ c en secondes, puis multipliez par 1 000 pour obtenir des millisecondes.',
    pieges: [[k / 1000, 'Ce résultat est en secondes : multipliez par 1 000 pour l’exprimer en ms.'], [5900 / dA, 'Vous avez divisé c par d : la durée est d ÷ c.']],
    expl: <>Δt = d ÷ c = {dec(dA)} ÷ 5 900 = {dec(k / 1000)}{NB}s, soit <b>{avecU(k, 'ms', 2)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > 0.03 * Math.abs(q.vrai)); });
  return { intro: 'Ondes mécaniques : célérité, retard et distance, avec les conversions d’unités.', questions: [q1, q2, q3, q4],
    retenir: ['Célérité : c = d ÷ Δt (distance en m, durée en s, célérité en m/s).', 'Distance parcourue : d = c × Δt ; durée de propagation : Δt = d ÷ c.', 'Un écho fait un aller-retour : profondeur = c × Δt ÷ 2.', 'Convertir avant de calculer : 1 cm = 0,01 m ; 1 ms = 0,001 s ; 1 km = 1 000 m.', 'La célérité dépend du milieu : air ≈ 340 m/s, eau ≈ 1 500 m/s, acier ≈ 5 900 m/s.'] };
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

// ──────────────────────── Famille « Ondes mécaniques périodiques » (1re spécialité) : période, fréquence, longueur d'onde, célérité ────────────────────────
function genOndesPeriode() {
  const T1 = tire([0.20, 0.25, 0.40, 0.50]), n1 = tire([3, 4, 5]), dt1 = Number((n1 * T1).toPrecision(3));
  const q1 = { id: 'o0', type: 'num', q: <>Sur l’enregistrement du mouvement d’un point d’une corde, on compte <b>{n1} oscillations complètes</b> en <b>{nb(dt1, 2)}{NB}s</b>. Calculez la période T de l’onde, en <b>s</b>.</>, unite: 's', vrai: T1, csMin: 2,
    aide: 'La période est la durée d’UNE oscillation : divisez la durée totale par le nombre d’oscillations.',
    pieges: [[dt1 * n1, 'Vous avez multiplié : la durée d’une seule oscillation est plus courte que la durée totale, donc il faut diviser.'], [n1 / dt1, 'Vous avez calculé le nombre d’oscillations par seconde (la fréquence) : la période est son inverse.'], [dt1, 'Vous avez gardé la durée totale : elle contient ' + n1 + ' oscillations.']],
    expl: <>T = durée ÷ nombre d’oscillations = {nb(dt1, 2)} ÷ {n1} = <b>{avecU(T1, 's', 2)}</b>.</> };
  const Tms = tire([100, 200, 250, 400, 500]), f2 = 1000 / Tms;
  const q2 = { id: 'o1', type: 'num', q: <>Un point de la corde effectue une oscillation complète en <b>{Tms}{NB}ms</b>. Calculez la fréquence f de l’onde, en <b>Hz</b>.</>, unite: 'Hz', vrai: f2, csMin: 2,
    aide: 'Convertissez d’abord la période en secondes (1 ms = 10⁻³ s), puis prenez l’inverse : f = 1 ÷ T.',
    pieges: [[1 / Tms, 'Vous avez gardé la période en millisecondes : il faut la convertir en secondes (1 ms = 10⁻³ s) avant de prendre l’inverse.'], [Tms / 1000, 'Vous avez donné la période en secondes : la fréquence est son inverse, f = 1 ÷ T.']],
    expl: <>T = {Tms} ms = {nb(Tms / 1000, 2)} s ; f = 1 ÷ T = 1 ÷ {nb(Tms / 1000, 2)} = <b>{avecU(f2, 'Hz', 2)}</b>.</> };
  const fk = tire([0.5, 1.0, 2.0, 4.0]), lamcm = 340 / (fk * 1000) * 100;
  const q3 = { id: 'o2', type: 'num', q: <>Un haut-parleur émet un son de fréquence <b>{nb(fk, 2)}{NB}kHz</b>. La célérité du son dans l’air est <b>340{NB}m/s</b>. Calculez la longueur d’onde λ du son, en <b>cm</b>.</>, unite: 'cm', vrai: lamcm, csMin: 2,
    aide: 'Convertissez la fréquence en hertz (1 kHz = 10³ Hz), utilisez λ = c ÷ f (c’est λ = c × T avec T = 1 ÷ f), puis convertissez le résultat de m en cm.',
    pieges: [[lamcm / 100, 'Votre résultat est en mètres : la réponse est demandée en centimètres (1 m = 100 cm).'], [340 * fk * 1000 * 100, 'Vous avez multiplié c par f : la longueur d’onde est c ÷ f.'], [340 / fk * 100, 'Vous avez gardé la fréquence en kHz : convertissez-la en Hz (× 10³) avant de diviser.']],
    expl: <>f = {nb(fk, 2)} kHz = {fk * 1000} Hz ; λ = c ÷ f = 340 ÷ {fk * 1000} = {String(Number((lamcm / 100).toPrecision(3))).replace('.', ',')} m = <b>{avecU(lamcm, 'cm', 2)}</b>.</> };
  const [lc, tm] = tire([[12, 40], [20, 50], [24, 80], [15, 50], [20, 80], [24, 60]]), c4 = lc / 100 / (tm / 1000);
  const q4 = { id: 'o3', type: 'num', q: <>Sur une photo de la corde, deux crêtes voisines sont distantes de <b>{lc}{NB}cm</b>. Sur l’enregistrement d’un point, deux sommets successifs sont séparés de <b>{tm}{NB}ms</b>. Calculez la célérité c de l’onde, en <b>m/s</b>.</>, unite: 'm/s', vrai: c4, csMin: 2,
    aide: 'Pendant une période, l’onde parcourt une longueur d’onde : c = λ ÷ T. Convertissez λ en m (1 cm = 10⁻² m) et T en s (1 ms = 10⁻³ s) avant de diviser.',
    pieges: [[lc / (tm / 1000), 'Vous avez gardé λ en cm : le résultat est alors en cm/s ; convertissez λ en mètres pour obtenir des m/s.'], [lc / tm, 'Les unités ne sont pas converties (cm et ms) : λ doit être en m et T en s.'], [(tm / 1000) / (lc / 100), 'Vous avez divisé T par λ : la célérité est λ ÷ T.'], [lc / 100 * (tm / 1000), 'Vous avez multiplié λ par T : il faut diviser.']],
    expl: <>λ = {lc} cm = {nb(lc / 100, 2)} m ; T = {tm} ms = {nb(tm / 1000, 2)} s ; c = λ ÷ T = {nb(lc / 100, 2)} ÷ {nb(tm / 1000, 2)} = <b>{avecU(c4, 'm/s', 2)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > 0.03 * Math.abs(q.vrai)); });      // un piège égal (ou presque) à la bonne réponse n'a pas de sens
  return { intro: 'Ondes mécaniques périodiques : période, fréquence, longueur d’onde et célérité, avec les conversions d’unités.', questions: [q1, q2, q3, q4],
    retenir: ['Période T (en s) : durée d’une oscillation complète ; fréquence f = 1 ÷ T (en Hz).', 'Longueur d’onde λ : distance parcourue par l’onde pendant une période, donc c = λ ÷ T et λ = c × T = c ÷ f.', 'Convertir AVANT de calculer : ms → s (× 10⁻³), kHz → Hz (× 10³), cm → m (× 10⁻²).', 'La source impose T ; le milieu impose c ; λ en résulte.'] };
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

// ───────────── Quantité de matière (1G) : masse molaire, masse, volume d’un gaz, volume d’un liquide ─────────────
function genQuantiteMatiere1G() {
  const atomes = e => e.f.map(([a]) => `M(${a}) = ${nb(QM.MM_ATOME[a], 3)}${NB}g/mol`).join(' ; ');
  const eM = QM.espece(tire(['glucose', 'saccharose', 'caco3', 'nahco3', 'paracetamol', 'cacl2', 'vitc'])), MM = QM.masseMolaire(eM);
  const somme = eM.f.reduce((t, [a]) => t + QM.MM_ATOME[a], 0), nAt = eM.f.reduce((t, [, k]) => t + k, 0);
  const q1 = { id: 'm0', type: 'num', q: <>Calculez la masse molaire du composé <b>{eM.nom} {QM.formuleTexte(eM)}</b>, en <b>g/mol</b>. Masses molaires atomiques : {atomes(eM)}.</>, unite: 'g/mol', vrai: MM, csMin: 3, tolRel: 0.005,
    aide: 'Additionnez les masses molaires atomiques, chacune multipliée par le nombre d’atomes de cet élément (l’indice dans la formule).',
    pieges: [[somme, 'Il faut multiplier chaque masse molaire atomique par l’indice : le nombre d’atomes de chaque élément compte.'], [nAt, 'Vous avez compté les atomes : il faut additionner leurs masses molaires, pas leur nombre.']],
    expl: <>M = {QM.lignesMasseMolaire(eM).map(([, k, ma]) => `${k} × ${nb(ma, 3)}`).join(' + ')} = <b>{avecU(MM, 'g/mol', 4)}</b>.</> };
  const e2 = QM.espece(tire(['paracetamol', 'caco3', 'vitc', 'nahco3', 'glucose'])), M2 = QM.masseMolaire(e2), m2 = tire([250, 300, 400, 500, 650, 800]), n2 = m2 / 1000 / M2;
  const q2 = { id: 'm1', type: 'num', q: <>Un comprimé contient <b>{m2}{NB}mg</b> de {e2.nom} {QM.formuleTexte(e2)} (M = {nb(M2, 4)}{NB}g/mol). Calculez la quantité de matière de {e2.nom} qu’il contient, en <b>mol</b>.</>, unite: 'mol', vrai: n2, csMin: 3, tolRel: 0.01,
    aide: 'Convertissez d’abord la masse en grammes (1 g = 1000 mg), puis n = m / M.',
    pieges: [[m2 / M2, 'Vous n’avez pas converti les milligrammes en grammes : m = ' + nb(m2 / 1000, 3) + ' g.'], [M2 / (m2 / 1000), 'Le rapport est inversé : n = m / M (la masse en haut).'], [m2 * M2 / 1000, 'On divise la masse par M, on ne la multiplie pas : n = m / M.']],
    expl: <>m = {m2}{NB}mg = {nb(m2 / 1000, 3)}{NB}g ; n = {nb(m2 / 1000, 3)} / {nb(M2, 4)} = <b>{avecU(n2, 'mol', 3)}</b>.</> };
  const e3 = QM.espece(tire(['nacl', 'glucose', 'saccharose', 'caco3', 'cacl2'])), M3 = QM.masseMolaire(e3), n3 = tire([0.0250, 0.0500, 0.100, 0.200, 0.250, 0.500]), m3 = n3 * M3;
  const q3 = { id: 'm2', type: 'num', q: <>Pour une expérience, il faut <b>{nb(n3, 3)}{NB}mol</b> de {e3.nom} {QM.formuleTexte(e3)} (M = {nb(M3, 4)}{NB}g/mol). Calculez la masse à peser, en <b>g</b>.</>, unite: 'g', vrai: m3, csMin: 3, tolRel: 0.01,
    aide: 'De n = m / M, on tire m = n × M.',
    pieges: [[n3 / M3, 'Vous avez divisé n par M : m = n × M.'], [M3 / n3, 'Vous avez divisé M par n : m = n × M.'], [m3 * 1000, 'Le résultat est demandé en grammes : ne le convertissez pas en milligrammes.']],
    expl: <>m = n × M = {nb(n3, 3)} × {nb(M3, 4)} = <b>{avecU(m3, 'g', 3)}</b>.</> };
  const e4 = QM.espece(tire(['o2', 'n2', 'co2', 'ch4', 'nh3'])), th4 = tire([0, 20, 25]), Vm4 = QM.VM_USUEL[th4], V4 = tire([250, 400, 500, 600, 750, 800]), n4 = V4 / 1000 / Vm4;
  const q4 = { id: 'm3', type: 'num', q: <>Un flacon de <b>{V4}{NB}mL</b> contient du {e4.nom} {QM.formuleTexte(e4)} à {th4}{NB}°C et 1013{NB}hPa, où le volume molaire vaut <b>{nb(Vm4, 3)}{NB}L/mol</b>. Calculez la quantité de matière de gaz, en <b>mol</b>.</>, unite: 'mol', vrai: n4, csMin: 3, tolRel: 0.01,
    aide: 'Convertissez le volume en litres (1 L = 1000 mL), puis n = V / V_m.',
    pieges: [[V4 / Vm4, 'Vous n’avez pas converti les mL en L : V = ' + nb(V4 / 1000, 3) + ' L.'], [Vm4 / (V4 / 1000), 'Le rapport est inversé : n = V / V_m.'], [V4 / 1000 * Vm4, 'On divise le volume par V_m, on ne les multiplie pas : n = V / V_m.']],
    expl: <>V = {V4}{NB}mL = {nb(V4 / 1000, 3)}{NB}L ; n = {nb(V4 / 1000, 3)} / {nb(Vm4, 3)} = <b>{avecU(n4, 'mol', 3)}</b>.</> };
  const e5 = QM.espece(tire(['ethanol', 'acetone', 'cyclohexane', 'acideEthanoique'])), M5 = QM.masseMolaire(e5), V5 = tire([10.0, 20.0, 25.0, 50.0]), m5 = e5.rho * V5, n5 = m5 / M5;
  const q5 = { id: 'm4', type: 'num', q: <>On prélève <b>{nb(V5, 3)}{NB}mL</b> de {e5.nom} {QM.formuleTexte(e5)}, de masse volumique <b>ρ = {nb(e5.rho, 3)}{NB}g/mL</b> et de masse molaire M = {nb(M5, 3)}{NB}g/mol. Calculez la quantité de matière prélevée, en <b>mol</b>.</>, unite: 'mol', vrai: n5, csMin: 3, tolRel: 0.01,
    aide: 'La masse se déduit du volume : m = ρ × V (en g). Puis n = m / M.',
    pieges: [[m5, 'C’est la masse m = ρ × V : il reste à la diviser par M pour obtenir n.'], [V5 / M5, 'Il manque la masse volumique : il faut passer du volume à la masse, m = ρ × V.'], [e5.rho * M5 / V5, 'La relation est n = ρ × V ÷ M, pas ρ × M ÷ V.']],
    expl: <>m = ρ × V = {nb(e5.rho, 3)} × {nb(V5, 3)} = {nb(m5, 3)}{NB}g ; n = {nb(m5, 3)} / {nb(M5, 3)} = <b>{avecU(n5, 'mol', 3)}</b>.</> };
  const e6 = QM.espece(tire(['ethanol', 'acetone', 'acideEthanoique', 'cyclohexane'])), M6 = QM.masseMolaire(e6), Me6 = QM.masseMolaire(QM.espece('eau')), ma6 = tire([9.0, 18.0, 27.0, 36.0]), mb6 = tire([10.0, 20.0, 23.0, 30.0]);
  const na6 = ma6 / Me6, nb6 = mb6 / M6, x6 = 100 * na6 / (na6 + nb6);
  const q6 = { id: 'm5', type: 'num', q: <>Un mélange liquide contient <b>{nb(ma6, 3)}{NB}g d’eau</b> (M = {nb(Me6, 3)}{NB}g/mol) et <b>{nb(mb6, 3)}{NB}g de {e6.nom}</b> {QM.formuleTexte(e6)} (M = {nb(M6, 3)}{NB}g/mol). Calculez le pourcentage de molécules d’eau parmi toutes les molécules du mélange (part en nombre de molécules), en <b>%</b>.</>, unite: '%', vrai: x6, csMin: 2, tolRel: 0.01,
    aide: 'Calculez n pour chaque constituant (n = m / M), puis la part de l’eau : n(eau) ÷ (n(eau) + n({e6.nom})). Le nombre de molécules est proportionnel à n.'.replace('{e6.nom}', e6.nom),
    pieges: [[100 * ma6 / (ma6 + mb6), 'C’est la part en masse : le nombre de molécules est proportionnel à la quantité de matière n = m / M, pas à la masse.'], [100 * na6 / nb6, 'Vous avez comparé n(eau) à n(' + e6.nom + ') : il faut la part de l’eau dans le total, n(eau) ÷ (n(eau) + n(' + e6.nom + ')).'], [100 * na6 / (na6 + nb6) / 100, 'Le résultat est demandé en pourcentage : multipliez la fraction par 100.']],
    expl: <>n(eau) = {nb(ma6, 3)} / {nb(Me6, 3)} = {nb(na6, 3)}{NB}mol ; n({e6.nom}) = {nb(mb6, 3)} / {nb(M6, 3)} = {nb(nb6, 3)}{NB}mol ; part de l’eau = {nb(na6, 3)} / ({nb(na6, 3)} + {nb(nb6, 3)}) = <b>{avecU(x6, '%', 3)}</b>.</> };
  [q1, q2, q3, q4, q5, q6].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Quantité de matière : masse molaire d’une espèce, puis n à partir d’une masse, du volume d’un gaz (volume molaire) ou du volume d’un liquide (masse volumique), puis composition d’un mélange.', questions: [q1, q2, q3, q4, q5, q6],
    retenir: ['M = somme des masses molaires atomiques, chacune multipliée par son indice ; n = m / M (m en g, M en g/mol).', 'Gaz : n = V / V_m, avec V_m (en L/mol) donné pour une température et une pression ; liquide : n = ρ·V / M.', 'Mélange : un calcul de n par constituant ; la part en nombre de molécules se compare avec n, pas avec la masse.', 'Convertir avant de calculer : mg → g, mL → L.'] };
}

// ───────────── Géométrie, électronégativité et polarité (1G) : Δχ, doublets, angle idéal, liaisons polarisées ─────────────
function genGeoPolarite() {
  const CHI = { H: 2.2, C: 2.5, N: 3.0, O: 3.5, Cl: 3.0 };
  const [a, b] = tire([['H', 'Cl'], ['H', 'O'], ['H', 'N'], ['C', 'H'], ['C', 'O'], ['C', 'Cl'], ['N', 'O'], ['O', 'Cl']]);
  const d = Math.round(Math.abs(CHI[a] - CHI[b]) * 10) / 10;
  const q1 = { id: 'g0', type: 'num', q: <>Dans l’échelle de Pauling, χ({a}) = <b>{nb(CHI[a], 2)}</b> et χ({b}) = <b>{nb(CHI[b], 2)}</b>. Calculez l’écart d’électronégativité Δχ de la liaison {a}–{b} (sans unité).</>, unite: '', vrai: d, csMin: 1, tolRel: 0.01,
    aide: 'Δχ est la différence entre la plus grande et la plus petite des deux électronégativités : une valeur positive.',
    pieges: [[CHI[a] + CHI[b], 'Il faut soustraire les électronégativités et non les additionner : Δχ est un écart.'], [CHI[a] / CHI[b], 'Un écart est une différence, pas un quotient.'], [-(CHI[a] - CHI[b]), 'Δχ est une valeur absolue : un écart n’est jamais négatif.']],
    expl: <>Δχ = |{nb(CHI[a], 2)} − {nb(CHI[b], 2)}| = <b>{nb(d, 2)}</b>.</> };
  const [n2, m2] = tire([[2, 0], [3, 0], [4, 0], [2, 2], [3, 1]]), nm = n2 + m2;
  const q2 = { id: 'g1', type: 'num', q: <>Autour de l’atome central d’une molécule, on compte <b>{n2} atomes liés</b> et <b>{m2} doublet{m2 > 1 ? 's' : ''} non liant{m2 > 1 ? 's' : ''}</b>. Combien de doublets (liants et non liants) entourent cet atome ?</>, unite: 'doublets', vrai: nm, tolRel: 0,
    aide: 'Chaque atome lié apporte un doublet liant (une liaison, simple ou double, compte pour une direction) : additionnez-les aux doublets non liants.',
    pieges: [[n2, 'Vous n’avez compté que les doublets liants : il faut ajouter les doublets non liants.'], [2 * (n2 + m2), 'Vous avez compté les électrons : un doublet est un groupe de deux électrons.'], [n2 * m2 + 1, 'Il faut additionner les doublets liants et non liants, pas les multiplier.']].concat(m2 > 0 ? [[m2, 'Vous n’avez compté que les doublets non liants : ajoutez les doublets liants.']] : []),
    expl: <>{n2} doublets liants + {m2} non liant{m2 > 1 ? 's' : ''} = <b>{nm} doublets</b>.</> };
  const ang = nm === 2 ? 180 : nm === 3 ? 120 : 109.5;
  const q3 = { id: 'g2', type: 'num', q: <>Dans le modèle VSEPR, <b>{nm} doublets</b> entourent l’atome central et s’écartent au maximum les uns des autres. Quel est l’angle idéal entre deux doublets voisins, en <b>degrés</b> ?</>, unite: '°', vrai: ang, csMin: 3, tolRel: 0.005,
    aide: 'Digonal : 2 doublets, 180° ; trigonal : 3 doublets, 120° ; tétragonal : 4 doublets, 109,5°.',
    pieges: [[360 / nm, 'Vous avez divisé 360° par le nombre de doublets : cela ne vaut que dans un plan, et les doublets se répartissent dans l’espace.'], [180 / (nm - 1), 'Cette formule ne s’applique pas : retenez les trois arrangements du cours (180°, 120°, 109,5°).'], [90, 'Un angle droit ne correspond à aucun arrangement de 2, 3 ou 4 doublets.']],
    expl: <>{nm} doublets : arrangement {nm === 2 ? 'digonal' : nm === 3 ? 'trigonal' : 'tétragonal'}, angle idéal <b>{avecU(ang, '°', 4)}</b>.</> };
  const [nom, f, x, y, nl, nat, ntot] = tire([['H₂O', 'H₂O', 'O', 'H', 2, 3, 2], ['NH₃', 'NH₃', 'N', 'H', 3, 4, 3], ['CCl₄', 'CCl₄', 'C', 'Cl', 4, 5, 4], ['CO₂', 'CO₂', 'C', 'O', 2, 3, 2], ['CH₃Cl', 'CH₃Cl', 'C', 'Cl', 1, 5, 4]]);
  const poly = f === 'CH₃Cl' ? 1 : nl;
  const q4 = { id: 'g3', type: 'num', q: f === 'CH₃Cl'
      ? <>La molécule de chlorométhane CH₃Cl contient 3 liaisons C–H et 1 liaison C–Cl. Électronégativités : χ(H) = <b>2,2</b>, χ(C) = <b>2,5</b>, χ(Cl) = <b>3,0</b>. Par convention, une liaison est considérée comme non polarisée si Δχ ≤ 0,4. Combien de liaisons polarisées contient la molécule ?</>
      : <>La molécule {f} contient <b>{nl} liaisons</b> {x}{f === 'CO₂' ? '=' : '–'}{y} identiques. Électronégativités : χ({x}) = <b>{nb(CHI[x], 2)}</b> et χ({y}) = <b>{nb(CHI[y], 2)}</b>. Par convention, une liaison est considérée comme non polarisée si Δχ ≤ 0,4. Combien de liaisons polarisées contient la molécule ?</>,
    unite: 'liaisons', vrai: poly, tolRel: 0,
    aide: 'Calculez Δχ pour chaque type de liaison, puis comparez-le à 0,4. Comptez ensuite les liaisons concernées.',
    pieges: [[nat, 'Vous avez compté les atomes de la molécule : on demande le nombre de liaisons polarisées.'], [ntot, 'Vous avez compté toutes les liaisons : celles dont Δχ ≤ 0,4 ne sont pas polarisées.']],
    expl: f === 'CH₃Cl' ? <>Δχ(C–H) = 0,3 ≤ 0,4 : non polarisée ; Δχ(C–Cl) = 0,5 &gt; 0,4 : polarisée. Il y a donc <b>1 liaison polarisée</b>.</> : <>Δχ({x}–{y}) = {nb(Math.round(Math.abs(CHI[x] - CHI[y]) * 10) / 10, 2)} &gt; 0,4 : chacune des {nl} liaisons est polarisée, soit <b>{nl} liaisons polarisées</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([z]) => isFinite(z) && Math.abs(z - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Géométrie, électronégativité et polarité : écart Δχ d’une liaison, doublets autour d’un atome, angle idéal et nombre de liaisons polarisées.', questions: [q1, q2, q3, q4],
    retenir: ['Δχ = |χ(A) − χ(B)|, sans unité ; par convention de cours, liaison non polarisée si Δχ ≤ 0,4.', 'Nombre de doublets autour de l’atome central = atomes liés + doublets non liants ; 2 : 180°, 3 : 120°, 4 : 109,5°.', 'Des liaisons polarisées ne suffisent pas à rendre une molécule polaire : la géométrie décide si les effets se compensent.'] };
}

// ───────────── Schéma de Lewis (1G) : électrons de valence, doublets, doublets non liants, charge d’un atome ─────────────
function genLewis1G() {
  const ZTxt = e => [...new Set(e.atomes)].map(a => `Z(${a}) = ${LW.ZAtome(a)}`).join(', ');
  const somme = e => LW.valencesDe(e).reduce((t, v) => t + v, 0);
  const sommeDistincts = e => [...new Set(e.atomes)].reduce((t, a) => t + LW.valenceAtome(a), 0);
  const sommeZ = e => e.atomes.reduce((t, a) => t + LW.ZAtome(a), 0);
  const prog = LW.ENTITES_PROGRAMME;
  const e1 = tire(prog), n1 = LW.nT(e1), S1 = somme(e1);
  const q1 = { id: 'lw0', type: 'num', q: <>Calculez le nombre total <b>n<sub>T</sub></b> d’électrons de valence de <b>{e1.nom} {e1.formule}</b>. Numéros atomiques : {ZTxt(e1)}.{e1.id === 'Nap' && <> Convention : pour un ion monoatomique issu d’un métal, on ne représente pas sa couche externe pleine (ici n = 2) ; on compte les électrons de valence de l’atome seul, moins la charge.</>}</>, unite: 'électrons', vrai: n1, csMin: String(Math.abs(n1)).length, tolRel: 0,
    aide: 'Pour chaque atome, écris la configuration électronique : les électrons de valence sont ceux de la couche la plus externe. Additionne-les pour tous les atomes (l’indice de la formule compte), puis tiens compte de la charge : un cation a perdu des électrons, un anion en a gagné.',
    pieges: [[sommeZ(e1) - e1.q, 'Vous avez utilisé les numéros atomiques Z : il faut seulement les électrons de la couche la plus externe de chaque atome.'], [S1 + e1.q, 'La charge est appliquée à l’envers : un cation a perdu des électrons (on les retire), un anion en a gagné (on les ajoute).'],
      [sommeDistincts(e1) - e1.q, 'Il faut compter chaque atome de la formule : l’indice (H₂O, NH₃…) donne le nombre d’atomes du même élément.']].concat(e1.q !== 0 ? [[S1, 'Vous avez oublié la charge de l’ion : n_T = (électrons de valence des atomes seuls) − charge.']] : []),
    expl: <>{[...new Set(e1.atomes)].map(a => { const k = e1.atomes.filter(x => x === a).length; return `${k > 1 ? k + ' × ' : ''}${LW.valenceAtome(a)} (${a})`; }).join(' + ')} = {S1}{e1.q !== 0 ? <> ; charge {e1.q > 0 ? '+' : '−'}{Math.abs(e1.q)} : n<sub>T</sub> = {S1} {e1.q > 0 ? '−' : '+'} {Math.abs(e1.q)} = <b>{n1}</b></> : <> : n<sub>T</sub> = <b>{n1}</b></>} électrons.</> };
  const e2 = tire(prog.filter(e => LW.nD(e) > 0 && e.id !== e1.id)), n2 = LW.nD(e2), T2 = LW.nT(e2);
  const q2 = { id: 'lw1', type: 'num', q: <>Combien de <b>doublets d’électrons</b> n<sub>D</sub> faut-il répartir dans <b>{e2.nom} {e2.formule}</b> ? Numéros atomiques : {ZTxt(e2)}.</>, unite: 'doublets', vrai: n2, csMin: String(n2).length, tolRel: 0,
    aide: 'D’abord n_T (électrons de valence de tous les atomes, corrigés de la charge), puis n_D = n_T ÷ 2 : un doublet contient deux électrons.',
    pieges: [[T2, 'C’est le nombre d’électrons n_T : un doublet contient deux électrons, il faut diviser par 2.'], [(somme(e2) + e2.q) / 2, 'La charge est appliquée à l’envers : un cation a perdu des électrons, un anion en a gagné.']].concat(e2.q !== 0 ? [[somme(e2) / 2, 'Vous avez oublié la charge de l’ion dans le comptage de n_T.']] : []),
    expl: <>n<sub>T</sub> = {T2} électrons ; n<sub>D</sub> = {T2} ÷ 2 = <b>{n2}</b> doublets.</> };
  const ent3 = LW.ENTITES_PROGRAMME.filter(e => { const r = LW.structureRef(e); return r.lp.reduce((t, x) => t + x, 0) > 0 && e.id !== e1.id; });
  const e3 = tire(ent3), r3 = LW.structureRef(e3), liants3 = r3.liens.reduce((t, x) => t + x, 0), nd3 = LW.nD(e3), lp3 = nd3 - liants3;
  const q3 = { id: 'lw2', type: 'num', q: <>Le schéma de Lewis de <b>{e3.nom} {e3.formule}</b> comporte <b>{liants3} doublet{liants3 > 1 ? 's' : ''} liant{liants3 > 1 ? 's' : ''}</b> (une liaison double compte pour deux doublets). Combien de <b>doublets non liants</b> comporte-t-il ? Numéros atomiques : {ZTxt(e3)}.</>, unite: 'doublets', vrai: lp3, csMin: String(lp3).length, tolRel: 0,
    aide: 'Le nombre total de doublets est n_D = n_T ÷ 2. Les doublets non liants sont ceux qui ne sont pas liants : n_D moins les doublets liants.',
    pieges: [[nd3, 'C’est le nombre total de doublets n_D : il faut en retirer les doublets liants.'], [liants3, 'C’est le nombre de doublets liants : on demande les doublets non liants, ceux qui restent.'], [nd3 + liants3, 'Il faut retirer les doublets liants du total, pas les ajouter.']],
    expl: <>n<sub>T</sub> = {LW.nT(e3)}, donc n<sub>D</sub> = {nd3} doublets ; doublets non liants = {nd3} − {liants3} = <b>{lp3}</b>.</> };
  const ent4 = [['H3Op', 0], ['HOm', 1], ['NH4p', 0], ['Clm', 0], ['O2m', 0]].map(([id, k]) => [LW.entite(id), k]);
  const [e4, k4] = tire(ent4), r4 = LW.structureRef(e4), a4 = e4.atomes[k4], b4 = LW.liaisonsAtome(r4, k4), l4 = r4.lp[k4], v4 = LW.valenceAtome(a4), c4 = v4 - (b4 + 2 * l4);
  const q4 = { id: 'lw3', type: 'num', q: <>Dans le schéma de <b>{e4.nom} {e4.formule}</b>, l’atome <b>{a4}</b> ({'Z = ' + LW.ZAtome(a4)}) {b4 === 0 ? <b>n’est lié à aucun atome</b> : <>est lié par <b>{b4} liaison{b4 > 1 ? 's' : ''} simple{b4 > 1 ? 's' : ''}</b></>} et {l4 === 0 ? <b>ne porte aucun doublet non liant</b> : <>porte <b>{l4} doublet{l4 > 1 ? 's' : ''} non liant{l4 > 1 ? 's' : ''}</b></>}. Quelle charge porte-t-il, en unités de charge élémentaire e (écrivez par exemple +1, −1 ou 0) ?</>, unite: 'e', vrai: c4, csMin: 1, tolRel: 0,
    aide: 'Charge = (électrons de valence de l’atome seul) − (électrons qu’il possède dans l’entité). Dans l’entité, il possède 1 électron par liaison et 2 par doublet non liant.',
    pieges: [[-c4, 'Le signe est inversé : si l’atome possède moins d’électrons que seul, la charge est positive ; s’il en possède plus, elle est négative.'], [v4 - (2 * b4 + 2 * l4), 'Chaque liaison ne compte que pour 1 électron appartenant à l’atome (le doublet est partagé) : électrons possédés = liaisons + 2 × doublets non liants.'], [v4 - 2 * l4, 'Il faut aussi compter les liaisons : chacune apporte 1 électron à l’atome.']],
    expl: <>Électrons de valence de {a4} seul : {v4} ; électrons possédés dans l’entité : {b4} + 2 × {l4} = {b4 + 2 * l4} ; charge = {v4} − {b4 + 2 * l4} = <b>{c4 > 0 ? '+' : c4 < 0 ? '−' : ''}{Math.abs(c4)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && x !== q.vrai); });
  return { intro: 'Schéma de Lewis : nombre total d’électrons de valence, nombre de doublets, doublets non liants et charge portée par un atome.', questions: [q1, q2, q3, q4],
    retenir: ['n_T = somme des électrons de valence des atomes seuls − charge de l’entité ; n_D = n_T ÷ 2.', 'Doublets non liants = n_D − doublets liants (une liaison double compte pour 2, une triple pour 3).', 'Charge d’un atome = électrons de valence seul − (liaisons + 2 × doublets non liants).'] };
}

// ───────────── Oxydo-réduction (1G) : électrons échangés, coefficients de l'équation, quantités de réactifs et de produits ─────────────
function genRedox1G() {
  const TRS = RX.TRANSFORMATIONS, dem = d => RX.demiTxt(d);
  const donnee = f => { for (let i = 0; i < 60; i++) { const n = tire([2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 9.0, 12.0, 15.0, 18.0]), v = f(n); if (Math.abs(Number(v.toPrecision(2)) - v) < 1e-9) return n; } return 6.0; };   // donnée à 2 chiffres significatifs dont le résultat en a au plus 2
  const plusLoin = (x, v) => isFinite(x) && x > 0 && Math.abs(x - v) > 0.011 * Math.abs(v);
  const garde = (v, liste) => { const vus = new Set(); return liste.filter(([x]) => plusLoin(x, v) && !vus.has(x) && vus.add(x)); };
  const couples = (r, t) => <>Couples : <b>{RX.coupleTxt(t.couple1)}</b> et <b>{RX.coupleTxt(t.couple2)}</b>. Demi-équations : {dem(r.d1)} et {dem(r.d2)}.</>;
  // 1. nombre d'électrons échangés (plus petit multiple commun)
  const t1 = tire(TRS), r1 = RX.equationDe(t1), ox1 = RX.texte(RX.COUPLES[t1.couple1][0]), red1 = RX.texte(RX.COUPLES[t1.couple2][1]);
  const q1 = { id: 'rx0', type: 'num', q: <>On étudie la réaction entre <b>{red1}</b> (réducteur) et <b>{ox1}</b> (oxydant). {couples(r1, t1)} Combien d’<b>électrons</b> sont échangés dans l’équation de réaction écrite avec les plus petits coefficients entiers ?</>, unite: 'électrons', vrai: r1.E, csMin: String(r1.E).length, tolRel: 0,
    aide: 'Les électrons captés par l’oxydant doivent être aussi nombreux que ceux cédés par le réducteur : cherche le plus petit nombre divisible par les nombres d’électrons des deux demi-équations (plus petit multiple commun).',
    pieges: garde(r1.E, [[r1.n1 * r1.n2, 'Tu as multiplié les deux nombres d’électrons : le plus petit multiple commun peut être plus petit que leur produit.'], [r1.n1 + r1.n2, 'Il faut égaliser les électrons captés et cédés, pas les additionner : cherche le plus petit multiple commun.'], [Math.min(r1.n1, r1.n2), 'Ce nombre est inférieur à l’un des deux : l’autre demi-équation échange plus d’électrons.'], [1, 'Il faut au moins le nombre d’électrons de chaque demi-équation.']]),
    expl: <>Les demi-équations échangent {r1.n1} et {r1.n2} électron{r1.n1 > 1 || r1.n2 > 1 ? 's' : ''} : le plus petit multiple commun est <b>{r1.E}</b> (multiplicateurs {r1.m1} et {r1.m2}).</> };
  // 2. coefficient d'une espèce dans l'équation
  const t2 = tire(TRS.filter(t => t.id !== t1.id)), r2 = RX.equationDe(t2), ox2 = RX.texte(RX.COUPLES[t2.couple1][0]), red2 = RX.texte(RX.COUPLES[t2.couple2][1]);
  const esp2 = tire([...r2.reactifs.map(([id, c]) => [id, c, 'r']), ...r2.produits.map(([id, c]) => [id, c, 'p'])]), [id2, c2] = esp2;
  const dans = [...r2.d1.gauche, ...r2.d1.droite, ...r2.d2.gauche, ...r2.d2.droite].find(([id]) => id === id2), cd = dans ? dans[1] : 1;
  const q2 = { id: 'rx1', type: 'num', q: <>On étudie la réaction entre <b>{red2}</b> (réducteur) et <b>{ox2}</b> (oxydant). {couples(r2, t2)} Quel est, dans l’équation de réaction écrite avec les plus petits coefficients entiers, le <b>coefficient devant {RX.texte(id2)}</b> ?</>, unite: '', vrai: c2, csMin: String(c2).length, tolRel: 0,
    aide: 'Multiplie chaque demi-équation pour égaliser les électrons (multiplicateurs m₁ et m₂), additionne-les, puis lis le coefficient de l’espèce dans la somme ; une espèce présente des deux côtés se simplifie.',
    pieges: garde(c2, [[r2.E, 'C’est le nombre d’électrons échangés, pas le coefficient de cette espèce.'], [r2.m1, 'C’est le multiplicateur de la demi-équation du couple 1 : il reste à le multiplier par le coefficient de l’espèce dans sa demi-équation.'], [r2.m2, 'C’est le multiplicateur de la demi-équation du couple 2 : il reste à le multiplier par le coefficient de l’espèce dans sa demi-équation.'], [cd, 'C’est le coefficient dans la demi-équation, avant multiplication : il faut tenir compte du multiplicateur.']]),
    expl: <>Multiplicateurs {r2.m1} et {r2.m2} (E = {r2.E} électrons). Équation : {RX.equationTxt(r2, false)}. Le coefficient de {RX.texte(id2)} est <b>{c2}</b>.</> };
  // 3. quantité d'oxydant qui réagit avec une quantité de réducteur (rapport des coefficients de l'équation)
  const t3 = tire(TRS), r3 = RX.equationDe(t3), red3 = RX.COUPLES[t3.couple2][1], ox3 = RX.COUPLES[t3.couple1][0], cR3 = r3.reactifs.find(([id]) => id === red3)[1], cO3 = r3.reactifs.find(([id]) => id === ox3)[1];
  const nR = donnee(n => n * cO3 / cR3), nO3 = nR * cO3 / cR3;
  const q3 = { id: 'rx2', type: 'num', q: <>On étudie la réaction entre <b>{RX.texte(red3)}</b> (réducteur) et <b>{RX.texte(ox3)}</b> (oxydant). {couples(r3, t3)} Une quantité <b>{nb(nR, 2)}{NB}mmol</b> de {RX.texte(red3)} réagit. D’après l’équation de réaction (plus petits coefficients entiers), quelle quantité de <b>{RX.texte(ox3)}</b> est consommée, en <b>mmol</b> ?</>, unite: 'mmol', vrai: nO3, csMin: 2, tolRel: 0.01,
    aide: 'Établis d’abord l’équation de réaction : les coefficients de l’oxydant et du réducteur donnent le rapport de leurs quantités consommées (n(oxydant) / coefficient de l’oxydant = n(réducteur) / coefficient du réducteur).',
    pieges: garde(nO3, [[nR, 'Tu as supposé autant d’oxydant que de réducteur : le rapport des quantités est celui des coefficients de l’équation.'], [nR * cR3 / cO3, 'Le rapport est inversé : n(oxydant) = n(réducteur) × coefficient de l’oxydant ÷ coefficient du réducteur.'], [nR * cO3, 'Il faut aussi diviser par le coefficient du réducteur : n(oxydant) / c(oxydant) = n(réducteur) / c(réducteur).']]),
    expl: <>Équation : {RX.equationTxt(r3, false)}. n({RX.texte(ox3)}) = n({RX.texte(red3)}) × {cO3} ÷ {cR3} = {nb(nR, 2)} × {cO3} ÷ {cR3} = <b>{avecU(nO3, 'mmol', 2)}</b>.</> };
  // 4. quantité d'un produit formé à partir d'une quantité d'oxydant consommée
  const t4 = tire(TRS), r4 = RX.equationDe(t4), ox4 = RX.COUPLES[t4.couple1][0], cO4 = r4.reactifs.find(([id]) => id === ox4)[1];
  const prods = r4.produits.filter(([id]) => id !== 'H2O'), [idP, cP] = tire(prods), nO4 = donnee(n => n * cP / cO4), nP = nO4 * cP / cO4;
  const q4 = { id: 'rx3', type: 'num', q: <>On étudie la réaction entre <b>{RX.texte(RX.COUPLES[t4.couple2][1])}</b> (réducteur) et <b>{RX.texte(ox4)}</b> (oxydant). {couples(r4, t4)} Une quantité <b>{nb(nO4, 2)}{NB}mmol</b> de {RX.texte(ox4)} est consommée. D’après l’équation de réaction (plus petits coefficients entiers), quelle quantité de <b>{RX.texte(idP)}</b> se forme, en <b>mmol</b> ?</>, unite: 'mmol', vrai: nP, csMin: 2, tolRel: 0.01,
    aide: 'Établis d’abord l’équation de réaction : n(produit) / coefficient du produit = n(oxydant) / coefficient de l’oxydant.',
    pieges: garde(nP, [[nO4, 'Tu as supposé autant de produit que d’oxydant consommé : le rapport des quantités est celui des coefficients de l’équation.'], [nO4 * cO4 / cP, 'Le rapport est inversé : n(produit) = n(oxydant) × coefficient du produit ÷ coefficient de l’oxydant.'], [nO4 * cP, 'Il faut aussi diviser par le coefficient de l’oxydant : n(produit) / c(produit) = n(oxydant) / c(oxydant).']]),
    expl: <>Équation : {RX.equationTxt(r4, false)}. n({RX.texte(idP)}) = n({RX.texte(ox4)}) × {cP} ÷ {cO4} = {nb(nO4, 2)} × {cP} ÷ {cO4} = <b>{avecU(nP, 'mmol', 2)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && x !== q.vrai); });
  return { intro: 'Oxydo-réduction : électrons échangés, coefficients de l’équation de réaction, et quantités de réactifs et de produits reliées par les coefficients.', questions: [q1, q2, q3, q4],
    retenir: ['Électrons échangés : plus petit multiple commun des nombres d’électrons des deux demi-équations ; ils disparaissent de l’équation de réaction.', 'Coefficient d’une espèce dans l’équation = multiplicateur de sa demi-équation × son coefficient dans cette demi-équation (après simplification).', 'Les quantités consommées ou formées sont dans le rapport des coefficients de l’équation : n(A) / coefficient(A) = n(B) / coefficient(B).'] };
}

// ───────────── Savons et amphiphilie (1G) : atomes de l'ion carboxylate, masse molaire du savon, quantité de matière ─────────────
function genSavon1G() {
  const sub = n => String(n).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');
  const [n1, nom1] = tire(SV.SERIE), a1 = SV.carboxylate(n1);
  const ion = n => <>CH₃–(CH₂)<sub>{n}</sub>–COO⁻</>;
  const q1 = { id: 'sv0', type: 'num', q: <>L’ion {nom1} a pour formule semi-développée <b>{ion(n1)}</b>. Combien d’atomes de <b>carbone</b> compte-t-il ?</>, unite: 'atomes', vrai: a1.C, csMin: String(a1.C).length, tolRel: 0,
    aide: 'Compte 1 carbone pour CH₃, 1 carbone par groupe CH₂ (il y en a autant que l’indice) et 1 carbone pour le groupe COO⁻.',
    pieges: [[a1.C - 1, 'Tu as oublié le carbone du groupe COO⁻ : il fait partie de la formule.'], [n1, 'Tu n’as compté que les groupes CH₂ : il faut aussi le carbone de CH₃ et celui de COO⁻.'], [2 * n1 + 2, 'Chaque groupe CH₂ ne contient qu’un atome de carbone (et deux atomes d’hydrogène) : 2 × n + 2 est un nombre d’atomes d’hydrogène.']],
    expl: <>1 (CH₃) + {n1} (CH₂) + 1 (COO⁻) = <b>{a1.C}</b> atomes de carbone.</> };
  const [n2, nom2] = tire(SV.SERIE.filter(s => s[0] !== n1)), a2 = SV.carboxylate(n2);
  const q2 = { id: 'sv1', type: 'num', q: <>L’ion {nom2} a pour formule semi-développée <b>{ion(n2)}</b>. Combien d’atomes d’<b>hydrogène</b> compte-t-il ?</>, unite: 'atomes', vrai: a2.H, csMin: String(a2.H).length, tolRel: 0,
    aide: 'CH₃ porte 3 atomes d’hydrogène, chaque groupe CH₂ en porte 2 ; le groupe COO⁻ n’en porte aucun.',
    pieges: [[2 * n2, 'Tu n’as compté que les groupes CH₂ : il faut aussi les 3 hydrogènes de CH₃.'], [2 * n2 + 1, 'Le groupe CH₃ porte 3 atomes d’hydrogène, pas un seul.'], [2 * n2 + 2, 'Le groupe CH₃ porte 3 atomes d’hydrogène, pas 2 : il faut 3 + 2 × n.']],
    expl: <>3 (CH₃) + 2 × {n2} (CH₂) = <b>{a2.H}</b> atomes d’hydrogène.</> };
  const [n3, nom3] = tire(SV.SERIE), a3 = SV.carboxylate(n3), M3 = a3.M;
  const q3 = { id: 'sv2', type: 'num', q: <>Le savon est le sel de sodium de l’ion {nom3} <b>{ion(n3)}</b> (formule brute C<sub>{a3.C}</sub>H<sub>{a3.H}</sub>O<sub>2</sub>Na). Données : M(C) = 12,0 g/mol ; M(H) = 1,0 g/mol ; M(O) = 16,0 g/mol ; M(Na) = 23,0 g/mol. Calculez sa masse molaire, en <b>g/mol</b>.</>, unite: 'g/mol', vrai: M3, csMin: 3, tolRel: 0.005,
    aide: 'M = (nombre de C) × M(C) + (nombre de H) × M(H) + 2 × M(O) + M(Na) : n’oublie pas l’ion sodium.',
    pieges: [[a3.Manion, 'Tu as oublié l’ion sodium : le savon est un sel, M(Na) = 23,0 g/mol s’ajoute.'], [a3.C * 12.0 + 2 * 16.0 + 23.0, 'Tu as oublié les atomes d’hydrogène : chacun compte pour 1,0 g/mol.'], [a3.C * 12.0 + a3.H * 1.0 + 16.0 + 23.0, 'Le groupe COO⁻ contient deux atomes d’oxygène, pas un seul.']],
    expl: <>M = {a3.C} × 12,0 + {a3.H} × 1,0 + 2 × 16,0 + 23,0 = <b>{avecU(M3, 'g/mol', 3)}</b>.</> };
  const [n4, nom4] = tire(SV.SERIE), a4 = SV.carboxylate(n4), m4 = tire([10.0, 20.0, 25.0, 50.0, 100.0]), nq = m4 / a4.M;
  const q4 = { id: 'sv3', type: 'num', q: <>Un pain de savon pur est du sel de sodium de l’ion {nom4} (formule brute C<sub>{a4.C}</sub>H<sub>{a4.H}</sub>O<sub>2</sub>Na, M = {nb(a4.M, 3)}{NB}g/mol). Il pèse <b>{nb(m4, 3)}{NB}g</b>. Calculez la quantité de matière de savon qu’il contient, en <b>mol</b>.</>, unite: 'mol', vrai: nq, csMin: 3, tolRel: 0.01,
    aide: 'n = m / M, avec m en g et M en g/mol.',
    pieges: [[a4.M / m4, 'Le rapport est inversé : n = m / M.'], [m4 * a4.M, 'On divise la masse par la masse molaire, on ne la multiplie pas : n = m / M.'], [m4 / a4.Manion, 'Tu as pris la masse molaire de l’ion seul : le savon est un sel de sodium, M = ' + nb(a4.M, 3) + ' g/mol.']],
    expl: <>n = m / M = {nb(m4, 3)} / {nb(a4.M, 3)} = <b>{avecU(nq, 'mol', 3)}</b>.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && x !== q.vrai && Math.abs(x - q.vrai) > Math.max(q.tolRel * 1.5, 0.02) * Math.abs(q.vrai)); });
  return { intro: 'Savons : atomes de l’ion carboxylate, masse molaire du sel de sodium et quantité de matière de savon.', questions: [q1, q2, q3, q4],
    retenir: ['Ion carboxylate CH₃–(CH₂)ₙ–COO⁻ : n + 2 atomes de carbone et 2n + 3 atomes d’hydrogène.', 'Masse molaire du savon (sel de sodium) : on additionne les masses molaires atomiques de tous les atomes, ion Na⁺ compris.', 'Quantité de matière : n = m / M (m en g, M en g/mol).'] };
}

// ───────────── Fluide au repos (1G) : force pressante F = P·S, pression, loi de Mariotte, ballon en altitude, test de la loi ─────────────
function genPressionMariotte1G() {
  const pInv = (x, y) => Math.abs(x - y) > 0;
  // q1 : force pressante, avec conversions (P en bar ou en hPa, S en cm²)
  const enBar = Math.random() < 0.5, P1 = tire(enBar ? [1.20, 1.50, 1.80, 2.00, 2.50, 3.00, 4.00] : [1200, 1500, 1800, 2000, 2500, 3000]), S1 = tire([2.0, 4.0, 5.0, 8.0, 12.0, 20.0, 25.0]);
  const P1Pa = enBar ? PM.bar_Pa(P1) : PM.hPa_Pa(P1), F1 = PM.forcePressante(P1Pa, PM.cm2_m2(S1));
  const uP1 = enBar ? 'bar' : 'hPa';
  const q1 = { id: 'fl0', type: 'num', q: <>Un gaz enfermé est à la pression <b>{avecU(P1, uP1, 3)}</b>. Il exerce une force pressante sur un piston plan de surface <b>{avecU(S1, 'cm²', 3)}</b>. Calculez la norme de cette force, en <b>N</b>.</>, unite: 'N', vrai: F1, csMin: 3, tolRel: 0.01,
    aide: 'F = P × S, avec P en pascals (1 bar = 10⁵ Pa ; 1 hPa = 100 Pa) et S en mètres carrés (1 cm² = 10⁻⁴ m²).',
    pieges: [[P1Pa * S1, 'La surface est restée en cm² : S = ' + nb(S1, 3) + ' cm² = ' + nb(S1 * 1e-4, 3) + ' m².'], [P1 * S1 * 1e-4, 'La pression est restée en ' + uP1 + ' : il faut la convertir en pascals.'], [P1Pa * S1 * 1e-2, 'Attention : 1 cm² = 10⁻⁴ m² (et non 10⁻² m²).'], [P1Pa / PM.cm2_m2(S1), 'On multiplie P et S, on ne les divise pas : F = P × S.']],
    expl: <>P = {nb(P1Pa, 3)}{NB}Pa ; S = {nb(S1, 3)}{NB}cm² = {nb(PM.cm2_m2(S1), 3)}{NB}m² ; F = P × S = <b>{avecU(F1, 'N', 3)}</b>. La force est perpendiculaire à la surface, dirigée du gaz vers le piston.</> };
  // q2 : pression à partir de la force et de la surface (résultat en hPa)
  const Ph2 = tire([1000, 1200, 1500, 2000, 2500, 3000]), S2 = tire([2.0, 4.0, 5.0, 8.0, 10.0, 20.0, 25.0]), F2 = PM.forcePressante(PM.hPa_Pa(Ph2), PM.cm2_m2(S2));
  const q2 = { id: 'fl1', type: 'num', q: <>Un gaz exerce sur une paroi plane de surface <b>{avecU(S2, 'cm²', 3)}</b> une force pressante de norme <b>{avecU(F2, 'N', 3)}</b>. Calculez la pression du gaz, en <b>hPa</b>.</>, unite: 'hPa', vrai: Ph2, csMin: 3, tolRel: 0.01,
    aide: 'P = F / S avec F en newtons et S en mètres carrés : le résultat est en pascals (1 hPa = 100 Pa).',
    pieges: [[F2 / S2, 'La surface est restée en cm² : S = ' + nb(S2, 3) + ' cm² = ' + nb(S2 * 1e-4, 3) + ' m².'], [F2 / PM.cm2_m2(S2), 'Ce résultat est en pascals : le résultat est demandé en hPa (1 hPa = 100 Pa).'], [F2 * PM.cm2_m2(S2) / 100, 'On divise la force par la surface, on ne les multiplie pas : P = F / S.']],
    expl: <>S = {nb(S2, 3)}{NB}cm² = {nb(PM.cm2_m2(S2), 3)}{NB}m² ; P = F / S = {nb(F2, 3)} / {nb(PM.cm2_m2(S2), 3)} = {nb(PM.hPa_Pa(Ph2), 3)}{NB}Pa = <b>{avecU(Ph2, 'hPa', 3)}</b>.</> };
  // q3 : loi de Mariotte, pression finale
  let P3 = 1.50, V3 = 80.0, W3 = 25.0;
  for (let i = 0; i < 100; i++) { P3 = tire([1.00, 1.20, 1.50, 2.00, 2.50]); V3 = tire([60.0, 80.0, 100.0]); W3 = tire([20.0, 25.0, 30.0, 40.0, 50.0]); if (W3 < V3 && P3 * V3 / W3 <= 5) break; }
  const R3 = PM.pressionFinale(P3, V3, W3);
  const q3 = { id: 'fl2', type: 'num', q: <>De l’air enfermé dans une seringue bouchée occupe <b>{avecU(V3, 'mL', 3)}</b> à la pression <b>{avecU(P3, 'bar', 3)}</b>. On enfonce le piston jusqu’à <b>{avecU(W3, 'mL', 3)}</b>, sans changer la température ni la quantité d’air. Calculez la pression finale, en <b>bar</b>.</>, unite: 'bar', vrai: R3, csMin: 3, tolRel: 0.01,
    aide: 'Loi de Mariotte : P₁ × V₁ = P₂ × V₂. Isolez P₂ ; les volumes peuvent rester en mL et les pressions en bar.',
    pieges: [[P3 * W3 / V3, 'Le rapport est inversé : P₂ = P₁ × V₁ / V₂. Quand le volume diminue, la pression augmente.'], [P3 + V3 - W3, 'On ne soustrait pas les volumes : c’est le produit P × V qui est constant.'], [R3 * 1e5, 'Le résultat est demandé en bar : P₂ = P₁ × V₁ / V₂ reste dans l’unité de P₁.']],
    expl: <>P₁ × V₁ = P₂ × V₂ donc P₂ = P₁ × V₁ / V₂ = {nb(P3, 3)} × {nb(V3, 3)} / {nb(W3, 3)} = <b>{avecU(R3, 'bar', 3)}</b>.</> };
  // q4 : ballon de baudruche en altitude (pression de l'air du ballon = pression extérieure, température et quantité d'air constantes)
  const V4 = tire([1.00, 1.50, 2.00, 2.50, 3.00]), Pa4 = tire([700, 750, 800, 850, 900, 950]), R4 = PM.volumeFinal(PM.P_ATM, V4, Pa4);
  const q4 = { id: 'fl3', type: 'num', q: <>Un ballon de baudruche de <b>{avecU(V4, 'L', 3)}</b> est gonflé au niveau de la mer, où la pression de l’air est de <b>1013{NB}hPa</b>. En montagne, la pression de l’air est de <b>{avecU(Pa4, 'hPa', 3)}</b>. On suppose que la température et la quantité d’air du ballon sont constantes, et que l’air du ballon est à la pression de l’air extérieur. Calculez le volume du ballon en montagne, en <b>L</b>.</>, unite: 'L', vrai: R4, csMin: 3, tolRel: 0.01,
    aide: 'Loi de Mariotte : P₁ × V₁ = P₂ × V₂, avec les deux pressions dans la même unité (ici hPa) et les deux volumes dans la même unité.',
    pieges: [[V4 * Pa4 / PM.P_ATM, 'Le rapport est inversé : V₂ = V₁ × P₁ / P₂. Quand la pression extérieure diminue, le volume du ballon augmente.'], [V4 + PM.P_ATM - Pa4, 'On ne soustrait pas les pressions : c’est le produit P × V qui est constant.'], [R4 * 1000, 'Le résultat est demandé en litres : V₂ garde l’unité de V₁.']],
    expl: <>P₁ × V₁ = P₂ × V₂ donc V₂ = P₁ × V₁ / P₂ = 1013 × {nb(V4, 3)} / {nb(Pa4, 3)} = <b>{avecU(R4, 'L', 3)}</b> : la pression diminue, le volume augmente.</> };
  // q5 et q6 : tester la loi avec deux mesures (écart relatif entre P × V, puis conclusion avec une incertitude de 2 %)
  const compatible = Math.random() < 0.5, Va = 60, Vb = tire([20, 30, 40]), Pa = tire([1008, 1011, 1013, 1016, 1020]);
  const eps = compatible ? tire([-0.007, -0.004, 0.003, 0.006, 0.009]) : tire([-0.09, -0.065, 0.055, 0.08]);
  const Pb = Math.round(Pa * Va / Vb * (1 + eps)), ecart = Math.abs(Pb * Vb - Pa * Va) / (Pa * Va) * 100, concl = ecart < 2;
  const q5 = { id: 'fl4', type: 'num', q: <>On mesure la pression d’un gaz enfermé à température constante : <b>{avecU(Pa, 'hPa', 3)}</b> pour <b>{Va}{NB}mL</b>, puis <b>{avecU(Pb, 'hPa', 3)}</b> pour <b>{Vb}{NB}mL</b>. Calculez l’écart relatif entre les deux produits P × V, par rapport au premier, en <b>%</b>.</>, unite: '%', vrai: ecart, csMin: 2, tolRel: 0.06,
    aide: 'Calculez P₁ × V₁ et P₂ × V₂ (en hPa·mL), puis |P₂V₂ − P₁V₁| / (P₁V₁) × 100.',
    pieges: [[Pb * Vb / (Pa * Va) * 100, 'Ce rapport vaut environ 100 % : l’écart relatif est la différence des produits divisée par le premier produit.'], [Math.abs(Pb * Vb - Pa * Va), 'Ce nombre est un écart absolu en hPa·mL : divisez-le par P₁ × V₁ puis multipliez par 100 pour un pourcentage.']],
    expl: <>P₁V₁ = {nb(Pa * Va, 4)} ; P₂V₂ = {nb(Pb * Vb, 4)} ; écart relatif = |{nb(Pb * Vb, 4)} − {nb(Pa * Va, 4)}| / {nb(Pa * Va, 4)} × 100 = <b>{avecU(ecart, '%', 2)}</b>.</> };
  const bon6 = concl ? 'compatibles : l’écart est inférieur à 2 %' : 'incompatibles : l’écart est supérieur à 2 %';
  const opts6 = melange([bon6, concl ? 'incompatibles : l’écart est supérieur à 2 %' : 'compatibles : l’écart est inférieur à 2 %', concl ? 'incompatibles : les produits ne sont pas rigoureusement égaux' : 'compatibles : un écart de quelques pour cent est toujours acceptable', 'on ne peut pas conclure : il faut connaître la température exacte']);
  const q6 = { id: 'fl5', type: 'qcm', q: <>On convient que deux produits P × V sont compatibles si leur écart relatif est inférieur à <b>2 %</b> (valeur donnée par l’énoncé, qui tient compte de la lecture du volume et du capteur). Les deux mesures sont-elles compatibles avec la loi de Mariotte ?</>, options: opts6, bonne: opts6.indexOf(bon6),
    aide: 'Comparez l’écart relatif entre les produits (question précédente) à la valeur de 2 % donnée.',
    expl: <>L’écart relatif est de {nb(ecart, 2)} %, {concl ? 'inférieur' : 'supérieur'} à 2 % : les mesures sont {concl ? 'compatibles' : 'incompatibles'} avec P × V = constante{concl ? '' : ' (cherchez une cause : température ou quantité de gaz qui change, fuite, volume du tuyau oublié)'}.</> };
  [q1, q2, q3, q4, q5].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && pInv(x, q.vrai) && Math.abs(x - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Fluide au repos : force pressante F = P × S avec conversions, pression d’un gaz, loi de Mariotte (pression finale), ballon en altitude, test de la loi avec une incertitude donnée.', questions: [q1, q2, q3, q4, q5, q6],
    retenir: ['Force pressante : F = P × S, avec P en Pa (1 bar = 10⁵ Pa ; 1 hPa = 100 Pa) et S en m² (1 cm² = 10⁻⁴ m²) ; vec(F) est perpendiculaire à la surface, dirigée vers la paroi.', 'Loi de Mariotte (température et quantité de gaz constantes) : P₁ × V₁ = P₂ × V₂ ; si le volume diminue, la pression augmente.', 'Tester la loi : calculer P × V pour plusieurs mesures ; des mesures sont compatibles avec la loi si l’écart relatif entre les produits est inférieur à l’incertitude donnée (ici 2 %).'] };
}

// ───────────── Couleurs (1G) : mélange de lumières, filtres, couleur d'un objet éclairé, radiations absorbées, sous-pixels ─────────────
// ──────────────────────── Famille « Lumière : domaines spectraux et énergie d'un photon » (1G, sim 164) ────────────────────────
function genPhoton1G() {
  const C = 3.00e8, H = 6.63e-34, EV = 1.60e-19;
  const lamNm = tire([405, 450, 532, 589, 633, 650]), nuTHz = C / (lamNm * 1e-9) / 1e12;
  const q1 = { id: 'ph0', type: 'num', q: <>Une lumière de longueur d’onde <b>λ = {lamNm}{NB}nm</b> se propage dans le vide (c = 3,00{NB}×{NB}10⁸{NB}m·s⁻¹). Calculez sa fréquence ν, en <b>THz</b> (1 THz = 10¹² Hz).</>, unite: 'THz', vrai: nuTHz, tolRel: 0.01, csMin: 3,
    aide: 'Convertissez λ en mètres (1 nm = 10⁻⁹ m), calculez ν = c ÷ λ en hertz, puis convertissez en THz (÷ 10¹²).',
    pieges: [[nuTHz * 1e12, 'Votre résultat est en hertz : la réponse est demandée en THz (1 THz = 10¹² Hz).'], [nuTHz * 1e3, 'Votre résultat est en GHz : 1 THz = 1 000 GHz.'], [C / lamNm / 1e12, 'La longueur d’onde n’a pas été convertie en mètres (1 nm = 10⁻⁹ m).'], [(lamNm * 1e-9 / C) / 1e12, 'Vous avez calculé λ ÷ c : la fréquence est c ÷ λ.']],
    expl: <>λ = {lamNm} nm = {nb(lamNm * 1e-9, 3)} m ; ν = c ÷ λ = 3,00 × 10⁸ ÷ {nb(lamNm * 1e-9, 3)} = {nb(C / (lamNm * 1e-9), 3)} Hz = <b>{avecU(nuTHz, 'THz', 3)}</b>.</> };
  const nuGHz = tire([1.5, 2.0, 3.0, 5.0, 6.0, 10, 12, 30]), lamCm = C / (nuGHz * 1e9) * 100;
  const q2 = { id: 'ph1', type: 'num', q: <>Un émetteur envoie une onde de fréquence <b>ν = {nb(nuGHz, 2)}{NB}GHz</b> dans le vide. Calculez sa longueur d’onde λ, en <b>cm</b>.</>, unite: 'cm', vrai: lamCm, tolRel: 0.01, csMin: 2,
    aide: 'Convertissez ν en hertz (1 GHz = 10⁹ Hz), calculez λ = c ÷ ν en mètres, puis convertissez en centimètres (× 100).',
    pieges: [[lamCm / 100, 'Votre résultat est en mètres : la réponse est demandée en centimètres (1 m = 100 cm).'], [C / nuGHz * 100, 'La fréquence n’a pas été convertie en hertz (1 GHz = 10⁹ Hz).'], [nuGHz * 1e9 / C * 100, 'Vous avez calculé ν ÷ c : la longueur d’onde est c ÷ ν.'], [lamCm * 10, 'Vérifiez la conversion de mètres en centimètres : 1 m = 100 cm.']],
    expl: <>ν = {nb(nuGHz, 2)} GHz = {nb(nuGHz * 1e9, 2)} Hz ; λ = c ÷ ν = 3,00 × 10⁸ ÷ {nb(nuGHz * 1e9, 2)} = {nb(lamCm / 100, 2)} m = <b>{avecU(lamCm, 'cm', 2)}</b>.</> };
  const nuT3 = tire([430, 500, 564, 650, 750]), E3 = H * nuT3 * 1e12;
  const q3 = { id: 'ph2', type: 'num', q: <>Un photon a pour fréquence <b>ν = {nuT3}{NB}THz</b>. Calculez son énergie E = h·ν, en <b>joules</b> (h = 6,63{NB}×{NB}10⁻³⁴{NB}J·s ; 1 THz = 10¹² Hz).</>, unite: 'J', vrai: E3, tolRel: 0.01, csMin: 3,
    aide: 'Convertissez ν en hertz (× 10¹²), puis multipliez par h. Écrivez le résultat en notation scientifique (par exemple 4,5e-8).',
    pieges: [[E3 / 1e12, 'La fréquence n’a pas été convertie en hertz : 1 THz = 10¹² Hz.'], [nuT3 * 1e12 / H, 'Vous avez divisé ν par h : l’énergie est le produit h × ν.'], [E3 / EV, 'Votre résultat est en électronvolts : la réponse est demandée en joules (1 eV = 1,60 × 10⁻¹⁹ J).']],
    expl: <>ν = {nuT3} THz = {nb(nuT3 * 1e12, 3)} Hz ; E = h × ν = 6,63 × 10⁻³⁴ × {nb(nuT3 * 1e12, 3)} = <b>{avecU(E3, 'J', 3)}</b>.</> };
  const eJ = tire([2.40, 3.05, 3.74, 4.20, 4.96]), eV4 = eJ / 1.60;
  const q4 = { id: 'ph3', type: 'num', q: <>Un photon a une énergie <b>E = {nb(eJ, 3)} × 10⁻¹⁹{NB}J</b>. Exprimez cette énergie en <b>électronvolts</b> (1 eV = 1,60{NB}×{NB}10⁻¹⁹{NB}J).</>, unite: 'eV', vrai: eV4, tolRel: 0.01, csMin: 3,
    aide: 'Pour passer des joules aux électronvolts, divisez par 1,60 × 10⁻¹⁹.',
    pieges: [[eJ * 1e-19, 'Vous avez gardé l’énergie en joules : divisez par 1,60 × 10⁻¹⁹ J/eV pour obtenir des eV.'], [eJ * 1.60 * 1e-38, 'Vous avez multiplié au lieu de diviser : un photon vaut quelques eV, pas 10⁻³⁸.'], [1.60 / eJ, 'Vous avez divisé 1,60 par l’énergie : c’est l’énergie qu’on divise par 1,60 × 10⁻¹⁹.']],
    expl: <>E(eV) = E(J) ÷ 1,60 × 10⁻¹⁹ = {nb(eJ, 3)} × 10⁻¹⁹ ÷ 1,60 × 10⁻¹⁹ = <b>{avecU(eV4, 'eV', 3)}</b>.</> };
  const eV5 = tire([1.65, 1.90, 2.10, 2.50, 3.10, 3.50]), lam5 = H * C / (eV5 * EV) * 1e9;
  const q5 = { id: 'ph4', type: 'num', q: <>Un photon a une énergie <b>E = {nb(eV5, 3)}{NB}eV</b>. Calculez sa longueur d’onde λ dans le vide, en <b>nm</b> (h = 6,63{NB}×{NB}10⁻³⁴{NB}J·s ; c = 3,00{NB}×{NB}10⁸{NB}m·s⁻¹ ; 1 eV = 1,60{NB}×{NB}10⁻¹⁹{NB}J).</>, unite: 'nm', vrai: lam5, tolRel: 0.01, csMin: 3,
    aide: 'Convertissez E en joules (× 1,60 × 10⁻¹⁹), calculez λ = h × c ÷ E en mètres, puis convertissez en nm (× 10⁹).',
    pieges: [[lam5 * 1e-9, 'Votre résultat est en mètres : la réponse est demandée en nanomètres (1 m = 10⁹ nm).'], [H * C / eV5 * 1e9, 'L’énergie n’a pas été convertie en joules (E = ' + nb(eV5, 3) + ' eV = ' + nb(eV5 * EV, 3) + ' J).'], [eV5 * EV / (H * C) * 1e9, 'Vous avez inversé la relation : λ = h × c ÷ E.']],
    expl: <>E = {nb(eV5, 3)} eV = {nb(eV5 * EV, 3)} J ; λ = h × c ÷ E = 6,63 × 10⁻³⁴ × 3,00 × 10⁸ ÷ {nb(eV5 * EV, 3)} = {nb(lam5 * 1e-9, 3)} m = <b>{avecU(lam5, 'nm', 3)}</b>.</> };
  const it = PH.tirerDomaine(Math.random), idx = PH.DOMAINES.findIndex(d => d.id === it.dom);
  const voisins = PH.DOMAINES.map((d, i) => ({ d, i })).filter(x => x.i !== idx).sort((a, b) => Math.abs(a.i - idx) - Math.abs(b.i - idx)).slice(0, 3).map(x => x.d.nom);
  const opts = melange([PH.domaine(it.dom).nom, ...voisins]);
  const bornesTxt = 'radio : λ > 30 cm ; micro-ondes : 1 mm à 30 cm ; infrarouge : 780 nm à 1 mm ; visible : 400 à 780 nm ; ultraviolet : 10 à 400 nm ; rayons X : 10 pm à 10 nm ; rayons gamma : λ < 10 pm';
  const q6 = { id: 'ph5', type: 'qcm', q: <>Une onde électromagnétique dans le vide a pour caractéristique <b>{it.txt}</b>. Dans quel domaine du spectre se trouve-t-elle ? (Repères conventionnels : {bornesTxt}. Pour une fréquence, calculez d’abord λ = c ÷ ν.)</>, options: opts, bonne: opts.indexOf(PH.domaine(it.dom).nom),
    aide: 'Convertissez en mètres (ou calculez λ = c ÷ ν si on donne la fréquence), puis comparez aux bornes des domaines.',
    expl: <>Ici, λ ≈ {PH.lambdaTexte(it.lam, 2)} : {PH.domaine(it.dom).borne}, c’est le domaine <b>{PH.domaine(it.dom).nom}</b>.</> };
  [q1, q2, q3, q4, q5].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > 0.03 * Math.abs(q.vrai)); });
  return { intro: 'Lumière : domaine d’une onde, longueur d’onde et fréquence (λ = c ÷ ν), énergie d’un photon E = h·ν, joules et électronvolts (dans le vide).', questions: [q6, q1, q2, q3, q4, q5],
    retenir: ['Domaines : radio, micro-ondes, infrarouge, visible (400 à 780 nm), ultraviolet, X, gamma, du plus grand λ au plus petit (bornes conventionnelles).', 'Dans le vide : λ = c ÷ ν avec c = 3,00 × 10⁸ m·s⁻¹ ; convertir AVANT de calculer (nm → m : × 10⁻⁹ ; GHz → Hz : × 10⁹).', 'Énergie d’un photon : E = h·ν = h·c ÷ λ, avec h = 6,63 × 10⁻³⁴ J·s.', 'Joules et électronvolts : E(J) = E(eV) × 1,60 × 10⁻¹⁹ ; plus ν est grande (λ petite), plus E est grande.'] };
}

function genCouleurs1G() {
  const NOMS = ['noir', 'rouge', 'vert', 'bleu', 'jaune', 'cyan', 'magenta', 'blanc'];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  // fixes : erreurs classiques toujours proposées comme distracteurs (le reste est tiré au hasard)
  const qcm = (id, q, bonne, aide, expl, fixes = []) => {
    const imposes = [...new Set(fixes)].filter(n => n !== bonne).slice(0, 3);
    const faux = [...imposes, ...melange(NOMS.filter(n => n !== bonne && !imposes.includes(n)))].slice(0, 3), opts = melange([bonne, ...faux]);
    return { id, type: 'qcm', q, options: opts, bonne: opts.indexOf(bonne), aide, expl };
  };
  const lampe = c => ({ rouge: 'rouge', vert: 'verte', bleu: 'bleue' }[c]);
  const prim = ['rouge', 'vert', 'bleu'];
  const [a, b] = melange(prim).slice(0, 2), somme = CL.nomCouleur(CL.additif(CL.COULEURS[a], CL.COULEURS[b]));
  const q1 = qcm('cl0', <>Dans une pièce sans autre lumière, une lampe <b>{lampe(a)}</b> et une lampe <b>{lampe(b)}</b> éclairent la même zone d’un écran blanc. De quelle couleur est la zone éclairée par les deux ?</>, somme,
    'Les lumières s’additionnent : écris les radiations (rouge, vert, bleu) présentes dans la zone, puis donne la couleur correspondante.', <>Synthèse additive : {a} + {b} = <b>{somme}</b>.</>, ['marron', 'noir']);
  const [f1, f2] = melange(CL.VERRES.slice(0, 3)).slice(0, 2), sortie = CL.nomCouleur(CL.traverse(CL.traverse(CL.COULEURS.blanc, f1.v), f2.v));
  const q2 = qcm('cl1', <>Une lumière blanche traverse {f1.nom}, puis {f2.nom}. De quelle couleur est la lumière qui sort du second filtre ?</>, sortie,
    'Un filtre laisse passer certaines radiations et absorbe les autres : cherche les radiations (rouge, vert, bleu) que laissent passer les deux filtres. Jaune : rouge et vert ; cyan : vert et bleu ; magenta : rouge et bleu.',
    <>Le {f1.court} laisse passer {CL.listeBandes(f1.v)} ; le {f2.court} laisse passer {CL.listeBandes(f2.v)}. Les radiations communes : {CL.listeBandes(CL.traverse(f1.v, f2.v))}. Couleur : <b>{sortie}</b>.</>, [CL.nomCouleur(f2.v), 'noir']);
  const o3 = tire(CL.OBJETS.filter(o => !['papier', 'ardoise'].includes(o.id))), l3 = tire(CL.LUMIERES.filter(l => l.id !== 'blanche')), c3 = CL.couleurPercue(l3.v, o3.v);
  const q3 = qcm('cl2', <>{cap(o3.nom)} est de couleur <b>{CL.nomCouleur(o3.v)}</b> en lumière blanche. On l’éclaire uniquement avec une <b>{l3.nom}</b>, dans une pièce sans autre lumière. De quelle couleur paraît-il ?</>, c3,
    'L’objet diffuse certaines radiations (il absorbe la couleur complémentaire de la sienne). Il ne renvoie que les radiations qui sont à la fois envoyées par la lampe et diffusées par lui.',
    <>L’objet diffuse {CL.listeBandes(o3.v)} ; la lampe envoie {CL.listeBandes(l3.v)}. Radiations renvoyées : {CL.listeBandes(CL.traverse(l3.v, o3.v))}. Couleur perçue : <b>{c3}</b>.</>, [CL.nomCouleur(l3.v), CL.nomCouleur(o3.v), 'noir']);
  const o4 = tire(CL.OBJETS.filter(o => !['papier', 'ardoise'].includes(o.id))), dif4 = CL.bandesPresentes(o4.v).length, abs4 = 3 - dif4;
  const q4 = { id: 'cl3', type: 'num', q: <>Un objet paraît <b>{CL.nomCouleur(o4.v)}</b> en lumière blanche. Combien de radiations parmi le rouge, le vert et le bleu absorbe-t-il (modèle à trois radiations ; un objet idéal diffuse ou absorbe entièrement chaque radiation) ?</>, unite: 'radiations', vrai: abs4, csMin: 1, tolRel: 0,
    aide: 'La lumière blanche contient trois radiations. L’objet diffuse celles qui composent sa couleur et absorbe les autres : l’objet absorbe la complémentaire de sa couleur.',
    pieges: [[dif4, 'C’est le nombre de radiations diffusées : l’objet absorbe les autres.'], [3, 'L’objet n’absorbe pas tout : il diffuse les radiations qui donnent sa couleur.'], [0, 'Un objet qui n’absorbe rien paraît blanc : celui-ci est coloré, donc il absorbe certaines radiations.']],
    expl: <>La lumière blanche en contient 3. Une couleur {CL.nomCouleur(o4.v)} est formée de {dif4} radiation{dif4 > 1 ? 's' : ''} diffusée{dif4 > 1 ? 's' : ''} : l’objet en absorbe 3 − {dif4} = <b>{abs4}</b>.</> };
  const c5 = tire(['rouge', 'vert', 'bleu', 'jaune', 'cyan', 'magenta', 'blanc']), n5 = CL.bandesPresentes(CL.COULEURS[c5]).length;
  const q5 = { id: 'cl4', type: 'num', q: <>Une zone d’un écran affiche du <b>{c5}</b>. Chaque pixel est formé de trois sous-pixels : un rouge, un vert, un bleu. Combien de sous-pixels sont allumés dans un pixel de cette zone (chaque sous-pixel est éteint ou allumé à pleine intensité) ?</>, unite: 'sous-pixels', vrai: n5, csMin: 1, tolRel: 0,
    aide: 'Synthèse additive : on allume les sous-pixels dont les lumières, ajoutées, donnent la couleur voulue. Écris la couleur en rouge, vert, bleu.',
    pieges: [[3, 'Allumer les trois sous-pixels donne du blanc : seul le blanc les demande tous.'], [1, 'Un seul sous-pixel donne une primaire (rouge, vert ou bleu) : les autres couleurs en demandent davantage.'], [2, 'Seules les couleurs secondaires (jaune, cyan, magenta) se forment avec deux sous-pixels allumés.']],
    expl: <>{cap(c5)} = {CL.listeBandes(CL.COULEURS[c5])} : <b>{n5}</b> sous-pixel{n5 > 1 ? 's' : ''} allumé{n5 > 1 ? 's' : ''}.</> };
  [q4, q5].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && x !== q.vrai); });
  return { intro: 'Couleurs : mélange de lumières colorées, filtres, couleur perçue d’un objet éclairé, radiations absorbées et sous-pixels d’un écran (modèle à trois bandes).', questions: [q1, q2, q3, q4, q5],
    retenir: ['Synthèse additive : rouge + vert = jaune, vert + bleu = cyan, rouge + bleu = magenta, les trois = blanc.', 'Synthèse soustractive : un filtre ne laisse passer que certaines radiations ; deux filtres : seules les radiations communes passent.', 'Un objet ne renvoie que les radiations qu’il diffuse parmi celles qu’il reçoit ; il absorbe la complémentaire de sa couleur en lumière blanche.'] };
}

// ───────────── Concentration en quantité de matière (1G) : concentration, masse à peser, prélèvement, dilution ─────────────
function genConcentration1G() {
  const sols = CD.SOLUTES.filter(x => x.id !== 'nahco3');
  const choisir = cMax => { for (let i = 0; i < 200; i++) { const s = tire(sols), M = CD.masseMolaireSoluteDe(s); if (M * cMax <= 0.3 * s.solub) return [s, M]; } return [sols[0], CD.masseMolaireSoluteDe(sols[0])]; };
  const [s1, M1] = choisir(0.5), V1 = tire([100, 250, 500]), c1v = tire([0.050, 0.100, 0.200, 0.500]), m1 = Number((c1v * V1 / 1000 * M1).toPrecision(3)), n1 = m1 / M1, c1 = n1 / (V1 / 1000);
  const q1 = { id: 'c0', type: 'num', q: <>On dissout <b>{nb(m1, 3)}{NB}g</b> de {s1.nom} {CD.formuleSolute(s1)} (M = {nb(M1, 3)}{NB}g/mol) dans une fiole jaugée de <b>{V1}{NB}mL</b>, complétée jusqu’au trait de jauge. Calculez la concentration en quantité de matière de la solution, en <b>mol/L</b>.</>, unite: 'mol/L', vrai: c1, csMin: 3, tolRel: 0.01,
    aide: 'Calculez d’abord n = m / M, puis c = n / V avec V en litres (1 L = 1000 mL).',
    pieges: [[n1 / V1, 'Vous n’avez pas converti les mL en L : V = ' + nb(V1 / 1000, 3) + ' L.'], [m1 / (V1 / 1000), 'C’est la concentration en masse Cm (en g/L) : pour obtenir c en mol/L, il faut diviser la masse par M.'], [(V1 / 1000) / n1, 'Le rapport est inversé : c = n / V.']],
    expl: <>n = m / M = {nb(m1, 3)} / {nb(M1, 3)} = {nb(n1, 3)}{NB}mol ; V = {V1}{NB}mL = {nb(V1 / 1000, 3)}{NB}L ; c = n / V = <b>{avecU(c1, 'mol/L', 3)}</b>.</> };
  const [s2, M2] = choisir(1.0), V2 = tire([100, 250, 500, 1000]), c2 = tire([0.050, 0.100, 0.200, 0.250, 0.500, 1.00].filter(c => c * M2 <= 0.3 * s2.solub)), m2 = c2 * V2 / 1000 * M2;
  const q2 = { id: 'c1', type: 'num', q: <>On veut préparer <b>{V2}{NB}mL</b> d’une solution de {s2.nom} {CD.formuleSolute(s2)} de concentration <b>{nb(c2, 3)}{NB}mol/L</b> (M = {nb(M2, 3)}{NB}g/mol), par dissolution du solide. Calculez la masse à peser, en <b>g</b>.</>, unite: 'g', vrai: m2, csMin: 3, tolRel: 0.01,
    aide: 'n = c × V avec V en litres, puis m = n × M.',
    pieges: [[c2 * V2 * M2, 'Vous n’avez pas converti les mL en L : V = ' + nb(V2 / 1000, 3) + ' L.'], [c2 * (V2 / 1000) / M2, 'On multiplie n par M pour obtenir la masse, on ne divise pas : m = n × M.'], [c2 * M2, 'C’est la masse par litre (Cm en g/L) : il reste à multiplier par le volume en litres.']],
    expl: <>V = {nb(V2 / 1000, 3)}{NB}L ; n = c × V = {nb(c2, 3)} × {nb(V2 / 1000, 3)} = {nb(c2 * V2 / 1000, 3)}{NB}mol ; m = n × M = {nb(c2 * V2 / 1000, 3)} × {nb(M2, 3)} = <b>{avecU(m2, 'g', 3)}</b>.</> };
  const c3 = tire([0.050, 0.100, 0.200, 0.500, 1.00]), V3 = tire([10.0, 20.0, 25.0, 50.0]), n3 = c3 * V3 / 1000;
  const q3 = { id: 'c2', type: 'num', q: <>Une solution a pour concentration <b>{nb(c3, 3)}{NB}mol/L</b>. On en prélève <b>{nb(V3, 3)}{NB}mL</b>. Calculez la quantité de matière de soluté dans ce prélèvement, en <b>mol</b>.</>, unite: 'mol', vrai: n3, csMin: 3, tolRel: 0.01,
    aide: 'n = c × V avec V en litres (1 mL = 10⁻³ L).',
    pieges: [[c3 * V3, 'Vous n’avez pas converti les mL en L : V = ' + nb(V3 / 1000, 3) + ' L.'], [c3 / (V3 / 1000), 'On multiplie c par V, on ne les divise pas : n = c × V.'], [(V3 / 1000) / c3, 'Le rapport est inversé : n = c × V.']],
    expl: <>V = {nb(V3, 3)}{NB}mL = {nb(V3 / 1000, 3)}{NB}L ; n = c × V = {nb(c3, 3)} × {nb(V3 / 1000, 3)} = <b>{avecU(n3, 'mol', 3)}</b>.</> };
  const [s4, M4] = choisir(0.5), Cm4 = Number((tire([0.050, 0.100, 0.200, 0.500]) * M4).toPrecision(3)), c4 = Cm4 / M4;
  const q4 = { id: 'c3', type: 'num', q: <>Une solution de {s4.nom} {CD.formuleSolute(s4)} (M = {nb(M4, 3)}{NB}g/mol) a une concentration en masse <b>C<sub>m</sub> = {nb(Cm4, 3)}{NB}g/L</b>. Calculez sa concentration en quantité de matière, en <b>mol/L</b>.</>, unite: 'mol/L', vrai: c4, csMin: 3, tolRel: 0.01,
    aide: 'Un litre de solution contient C_m grammes de soluté : à combien de moles correspondent-ils ? (c = C_m / M)',
    pieges: [[Cm4 * M4, 'On divise C_m par M, on ne les multiplie pas : g/L ÷ g/mol = mol/L.'], [M4 / Cm4, 'Le rapport est inversé : c = C_m / M.'], [c4 / 1000, 'Aucune conversion de volume n’est nécessaire : C_m est déjà « par litre ».']],
    expl: <>c = C<sub>m</sub> / M = {nb(Cm4, 3)} / {nb(M4, 3)} = <b>{avecU(c4, 'mol/L', 3)}</b>.</> };
  const d5 = tire(CD.dilutionsPossibles()), [s5] = choisir(d5.c0);
  const q5 = { id: 'c4', type: 'num', q: <>On prépare <b>{d5.V1}{NB}mL</b> de solution fille de {s5.nom} {CD.formuleSolute(s5)} à <b>{nb(d5.c1, 3)}{NB}mol/L</b>, par dilution d’une solution mère à <b>{nb(d5.c0, 3)}{NB}mol/L</b>. Calculez le volume de solution mère à prélever, en <b>mL</b>.</>, unite: 'mL', vrai: d5.V0, csMin: 3, tolRel: 0.01,
    aide: 'La quantité de soluté se conserve : c_mère × V_mère = c_fille × V_fille. Isolez V_mère (les mL peuvent rester en mL).',
    pieges: [[d5.c0 * d5.V1 / d5.c1, 'Le rapport est inversé : V_mère = c_fille × V_fille / c_mère (la mère, plus concentrée, a le plus petit volume).'], [d5.V1 - d5.V0, 'C’est à peu près le volume d’eau à ajouter, pas le volume de solution mère.'], [d5.V0 / 1000, 'Le résultat est demandé en mL : ne le convertissez pas en litres.']],
    expl: <>V<sub>mère</sub> = c<sub>fille</sub> × V<sub>fille</sub> / c<sub>mère</sub> = {nb(d5.c1, 3)} × {d5.V1} / {nb(d5.c0, 3)} = <b>{avecU(d5.V0, 'mL', 3)}</b> (F = {d5.F} : {d5.V1} / {d5.F} = {nb(d5.V0, 3)}{NB}mL).</> };
  const d6 = tire(CD.dilutionsPossibles());
  const q6 = { id: 'c5', type: 'num', q: <>On prélève <b>{d6.V0}{NB}mL</b> d’une solution mère à <b>{nb(d6.c0, 3)}{NB}mol/L</b> et on les verse dans une fiole jaugée de <b>{d6.V1}{NB}mL</b>, complétée jusqu’au trait de jauge. Calculez la concentration de la solution fille, en <b>mol/L</b>.</>, unite: 'mol/L', vrai: d6.c1, csMin: 3, tolRel: 0.01,
    aide: 'La quantité de soluté prélevée est conservée : c_fille = c_mère × V_mère / V_fille. Vous pouvez aussi passer par le facteur de dilution F = V_fille / V_mère.',
    pieges: [[d6.c0 * d6.V1 / d6.V0, 'Le rapport est inversé : la fille est moins concentrée que la mère, c_fille = c_mère × V_mère / V_fille.'], [d6.c0 * d6.V0 / 1000, 'Il manque la division par le volume de la fiole : c = n / V_fille.'], [d6.V1 / d6.V0, 'C’est le facteur de dilution F (sans unité) : il faut ensuite diviser c_mère par F.']],
    expl: <>F = V<sub>fille</sub> / V<sub>mère</sub> = {d6.V1} / {d6.V0} = {nb(d6.F, 3)} ; c<sub>fille</sub> = c<sub>mère</sub> / F = {nb(d6.c0, 3)} / {nb(d6.F, 3)} = <b>{avecU(d6.c1, 'mol/L', 3)}</b>.</> };
  [q1, q2, q3, q4, q5, q6].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Concentration en quantité de matière : concentration d’une solution préparée par dissolution, masse à peser, quantité de soluté dans un prélèvement, lien avec la concentration en masse, volume de solution mère et concentration de la fille dans une dilution.', questions: [q1, q2, q3, q4, q5, q6],
    retenir: ['c = n / V (V en litres) et n = c × V ; C_m = c × M (g/L) ; dissolution : m = c × V × M.', 'Dilution : la quantité de soluté se conserve, c_mère × V_mère = c_fille × V_fille ; F = c_mère / c_fille = V_fille / V_mère (F > 1, sans unité).', 'Volume précis : fiole jaugée pour le volume final, pipette jaugée pour le prélèvement ; on complète jusqu’au trait de jauge.'] };
}

// ───────────── Statique des fluides (1G) : différence de pression, pression absolue, profondeur, force sur une paroi, masse volumique ─────────────
function genStatique1G() {
  const G9 = 9.81, liqs = SF.ORDRE_LIQUIDES.map(k => SF.LIQUIDES[k]);
  const sc = x => (x < 0 ? '−' : '') + nb(Math.abs(x), 3);
  // q0 : relation fournie, axe z vers le haut, signe compris
  const l0 = tire(liqs), z0A = l0.id === 'mercure' ? -tire([0.10, 0.20, 0.30]) : -tire([1.0, 2.0, 3.0]), z0B = l0.id === 'mercure' ? -tire([0.40, 0.50, 0.60]) : -tire([5.0, 6.0, 8.0]);
  const sens = Math.random() < 0.5, zA0 = sens ? z0A : z0B, zB0 = sens ? z0B : z0A, d0 = l0.rho * G9 * (zA0 - zB0) / 100;
  const q0 = { id: 'f0', type: 'num', q: <>Un liquide au repos ({l0.nom.toLowerCase()}, ρ = {l0.aff}{NB}kg·m⁻³) est étudié avec un axe z orienté <b>vers le haut</b>, d’origine à la surface. Le point A est à z<sub>A</sub> = {sc(zA0)}{NB}m et le point B à z<sub>B</sub> = {sc(zB0)}{NB}m (g = 9,81{NB}N·kg⁻¹). Avec P<sub>B</sub> − P<sub>A</sub> = ρ·g·(z<sub>A</sub> − z<sub>B</sub>), calculez P<sub>B</sub> − P<sub>A</sub> en <b>hPa</b> (signe compris).</>, unite: 'hPa', vrai: d0, csMin: 3, tolRel: 0.01,
    aide: 'Calculez d’abord z_A − z_B (en m, avec son signe), puis multipliez par ρ et g ; 1 hPa = 100 Pa.',
    pieges: [[-d0, 'Le signe est inversé : la parenthèse est z_A − z_B (A moins B), pas z_B − z_A.'], [d0 * 100, 'Le résultat est demandé en hPa : 1 hPa = 100 Pa.'], [d0 / G9, 'Il manque g dans le calcul : ρ·g·(z_A − z_B).']],
    expl: <>z<sub>A</sub> − z<sub>B</sub> = {sc(zA0)} − ({sc(zB0)}) = {sc(zA0 - zB0)}{NB}m ; P<sub>B</sub> − P<sub>A</sub> = ρ·g·(z<sub>A</sub> − z<sub>B</sub>) = {l0.aff} × 9,81 × {sc(zA0 - zB0)} = <b>{avecU(d0, 'hPa', 3)}</b> (1 hPa = 100 Pa).</> };
  // q1 : pression absolue à la profondeur h
  const l1 = tire(liqs), h1 = l1.id === 'mercure' ? tire([0.25, 0.40, 0.55, 0.70]) : tire([2.0, 3.5, 5.0, 7.5, 12.0, 18.0]), Pa1 = tire([1000, 1013, 1020]);
  const P1 = Pa1 + l1.rho * G9 * h1 / 100;
  const q1 = { id: 'f1', type: 'num', q: <>Un manomètre est plongé à <b>{nb(h1, 3)}{NB}m</b> de profondeur dans un liquide à l’air libre ({l1.nom.toLowerCase()}, ρ = {l1.aff}{NB}kg·m⁻³ ; g = 9,81{NB}N·kg⁻¹). La pression à la surface est P<sub>atm</sub> = {nb(Pa1, 4)}{NB}hPa. Quelle pression <b>absolue</b> indique-t-il, en <b>hPa</b> ?</>, unite: 'hPa', vrai: P1, csMin: 4, tolRel: 0.01,
    aide: 'P = P_atm + ρ·g·h : calculez ρ·g·h en pascals, convertissez en hPa (÷ 100), puis ajoutez P_atm.',
    pieges: [[l1.rho * G9 * h1 / 100, 'Vous avez calculé seulement la partie due au liquide : le manomètre mesure la pression absolue, il faut ajouter P_atm.'], [P1 * 100, 'Le résultat est demandé en hPa : 1 hPa = 100 Pa.'], [Pa1 + l1.rho * G9 * h1, 'Convertissez ρ·g·h de pascals en hPa (÷ 100) avant d’ajouter P_atm, donnée en hPa.']],
    expl: <>ρ·g·h = {l1.aff} × 9,81 × {nb(h1, 3)} = {avecU(l1.rho * G9 * h1, 'Pa', 3)} = {avecU(l1.rho * G9 * h1 / 100, 'hPa', 3)} ; P = P<sub>atm</sub> + ρ·g·h = {nb(Pa1, 4)} + {nb(l1.rho * G9 * h1 / 100, 3)} = <b>{avecU(P1, 'hPa', 4)}</b>.</> };
  // q2 : profondeur à partir d'une pression absolue lue (hPa entiers)
  const l2 = tire(liqs), h2v = l2.id === 'mercure' ? tire([0.30, 0.50, 0.65]) : tire([3.0, 4.5, 6.0, 9.0, 15.0]), Pa2 = tire([1000, 1013, 1020]), P2 = Math.round(Pa2 + l2.rho * G9 * h2v / 100), h2 = (P2 - Pa2) * 100 / (l2.rho * G9);
  const q2 = { id: 'f2', type: 'num', q: <>Dans un liquide à l’air libre ({l2.nom.toLowerCase()}, ρ = {l2.aff}{NB}kg·m⁻³ ; g = 9,81{NB}N·kg⁻¹), un manomètre indique la pression absolue <b>{nb(P2, 4)}{NB}hPa</b> ; à la surface, P<sub>atm</sub> = {nb(Pa2, 4)}{NB}hPa. À quelle profondeur est-il, en <b>m</b> ?</>, unite: 'm', vrai: h2, csMin: 3, tolRel: 0.01,
    aide: 'Seule la différence P − P_atm est due au liquide : h = (P − P_atm) / (ρ·g), avec des pressions en pascals.',
    pieges: [[P2 * 100 / (l2.rho * G9), 'Il faut retrancher P_atm : seule la différence P − P_atm est due au liquide.'], [h2 / 100, 'Convertissez les hPa en Pa (× 100) avant de diviser par ρ·g.'], [(P2 - Pa2) / (l2.rho * G9), 'Convertissez les hPa en Pa (× 100) avant de diviser par ρ·g.']],
    expl: <>P − P<sub>atm</sub> = {nb(P2, 4)} − {nb(Pa2, 4)} = {nb(P2 - Pa2, 3)}{NB}hPa = {avecU((P2 - Pa2) * 100, 'Pa', 3)} ; h = (P − P<sub>atm</sub>) / (ρ·g) = {nb((P2 - Pa2) * 100, 3)} ÷ ({l2.aff} × 9,81) = <b>{avecU(h2, 'm', 3)}</b>.</> };
  // q3 : force sur un bouchon (pression due au liquide seule)
  const hb = tire([1.0, 1.5, 2.0, 2.5, 3.0, 4.0]), Sb = tire([10, 20, 25, 40, 50]), F3 = 1000 * G9 * hb * Sb * 1e-4;
  const q3 = { id: 'f3', type: 'num', q: <>Un réservoir d’eau (ρ = 1,00{NB}×{NB}10³{NB}kg·m⁻³ ; g = 9,81{NB}N·kg⁻¹) est ouvert à l’air libre. Un bouchon de surface <b>S = {Sb}{NB}cm²</b> ferme un trou de la paroi, à <b>{nb(hb, 3)}{NB}m</b> sous la surface. Sur l’autre face, l’air pousse le bouchon avec P<sub>atm</sub> : la force nette est créée par la pression due à l’eau, P<sub>eau</sub> − P<sub>atm</sub> = ρ·g·h. Quelle est la norme de cette force nette, en <b>N</b> ?</>, unite: 'N', vrai: F3, csMin: 3, tolRel: 0.01,
    aide: 'Pression due à l’eau : ρ·g·h (en Pa). Puis F = P × S avec S en m² (1 cm² = 10⁻⁴ m²).',
    pieges: [[F3 * 1e4, 'Convertissez la surface en m² : 1 cm² = 10⁻⁴ m².'], [(1013e2 + 1000 * G9 * hb) * Sb * 1e-4, 'Vous avez utilisé la pression absolue : P_atm s’exerce aussi de l’autre côté, elle se retranche.'], [1000 * G9 * hb, 'C’est la pression due à l’eau en Pa : il reste à multiplier par S (en m²) pour obtenir une force en N.']],
    expl: <>ρ·g·h = 1,00 × 10³ × 9,81 × {nb(hb, 3)} = {avecU(1000 * G9 * hb, 'Pa', 3)} ; S = {Sb}{NB}cm² = {nb(Sb * 1e-4, 3)}{NB}m² ; F = P × S = <b>{avecU(F3, 'N', 3)}</b>.</> };
  // q4 : masse volumique à partir de deux relevés (hPa entiers)
  const l4 = tire(liqs), hh1 = l4.id === 'mercure' ? tire([0.10, 0.20]) : tire([0.5, 1.0, 1.5]), hh2 = l4.id === 'mercure' ? tire([0.40, 0.50]) : tire([3.0, 4.0, 5.0, 6.0]);
  const R1 = Math.round(1013 + l4.rho * G9 * hh1 / 100), R2 = Math.round(1013 + l4.rho * G9 * hh2 / 100), rho4 = (R2 - R1) * 100 / (G9 * (hh2 - hh1));
  const q4 = { id: 'f4', type: 'num', q: <>Dans un liquide à l’air libre, un manomètre indique la pression absolue <b>{nb(R1, 4)}{NB}hPa</b> à la profondeur <b>{nb(hh1, 3)}{NB}m</b> puis <b>{nb(R2, 4)}{NB}hPa</b> à <b>{nb(hh2, 3)}{NB}m</b> (g = 9,81{NB}N·kg⁻¹). Calculez la masse volumique du liquide, en <b>kg·m⁻³</b>.</>, unite: 'kg·m⁻³', vrai: rho4, csMin: 3, tolRel: 0.03,
    aide: 'Entre les deux relevés, P augmente de ΔP = ρ·g·Δh : calculez ΔP en Pa (1 hPa = 100 Pa) et Δh en m, puis ρ = ΔP / (g·Δh).',
    pieges: [[(R2 - R1) / (G9 * (hh2 - hh1)), 'Convertissez les hPa en Pa (× 100) avant de diviser par g·Δh.'], [R2 * 100 / (G9 * hh2), 'Il faut l’écart ΔP entre les deux relevés, pas la pression P : elle comprend aussi l’atmosphère.'], [(R2 - R1) * 100 / (hh2 - hh1), 'C’est la pente ρ·g (en Pa·m⁻¹) : il reste à la diviser par g pour obtenir ρ.']],
    expl: <>ΔP = {nb(R2, 4)} − {nb(R1, 4)} = {nb(R2 - R1, 3)}{NB}hPa = {avecU((R2 - R1) * 100, 'Pa', 3)} ; Δh = {nb(hh2 - hh1, 3)}{NB}m ; ρ = ΔP / (g·Δh) = <b>{avecU(rho4, 'kg·m⁻³', 3)}</b>.</> };
  // q5 : pression absolue en bar à une profondeur donnée dans l'eau (ordre de grandeur)
  const h5 = tire([10, 20, 30, 40, 50]), P5 = 1.013 + 1000 * G9 * h5 / 1e5;
  const q5 = { id: 'f5', type: 'num', q: <>Un plongeur est à <b>{h5}{NB}m</b> de profondeur dans l’eau d’un lac (ρ = 1,00{NB}×{NB}10³{NB}kg·m⁻³ ; g = 9,81{NB}N·kg⁻¹ ; 1{NB}bar = 10⁵{NB}Pa). À la surface, P<sub>atm</sub> = 1,013{NB}bar. Quelle pression absolue subit-il, en <b>bar</b> ?</>, unite: 'bar', vrai: P5, csMin: 3, tolRel: 0.01,
    aide: 'ρ·g·h en pascals, conversion en bar (÷ 10⁵), puis ajout de P_atm.',
    pieges: [[1000 * G9 * h5 / 1e5, 'Vous avez calculé seulement la partie due à l’eau : le manomètre du plongeur mesure la pression absolue, il faut ajouter P_atm.'], [P5 * 1e5, 'Le résultat est demandé en bar : 1 bar = 10⁵ Pa.'], [1.013 + 1000 * G9 * h5 / 1e4, 'Convertissez correctement : 1 bar = 10⁵ Pa, donc on divise des pascals par 10⁵.']],
    expl: <>ρ·g·h = 1,00 × 10³ × 9,81 × {h5} = {avecU(1000 * G9 * h5, 'Pa', 3)} = {nb(1000 * G9 * h5 / 1e5, 3)}{NB}bar ; P = 1,013 + {nb(1000 * G9 * h5 / 1e5, 3)} = <b>{avecU(P5, 'bar', 3)}</b>.</> };
  [q0, q1, q2, q3, q4, q5].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Statique des fluides : différence de pression entre deux points (axe z vers le haut), pression absolue à une profondeur, profondeur déduite d’une pression, force sur un bouchon, masse volumique à partir de deux relevés, ordre de grandeur en bar.', questions: [q0, q1, q2, q3, q4, q5],
    retenir: ['P_B − P_A = ρ·g·(z_A − z_B), axe z vers le haut : la pression augmente quand on descend ; à la profondeur h : P = P_atm + ρ·g·h (pression absolue).', 'Seule la profondeur compte : ni la forme du récipient ni la quantité de liquide ; dans l’eau, environ 1 bar de plus tous les 10 m.', 'Force sur une paroi : F = P × S, perpendiculaire à la paroi ; convertir hPa en Pa (× 100) et cm² en m² (× 10⁻⁴).'] };
}

// ───────────── Dissolution d'un solide ionique (1G) : équation, concentration en soluté apporté et concentration effective des ions ─────────────
function genDissolutionIonique1G() {
  const ionDe = s => { const k = tire(['cat', 'an']); return [s[k], k === 'cat' ? s.an : s.cat]; };
  // q0 : équation de dissolution (sels dont les deux coefficients ne sont pas égaux à 1, pour que les propositions fausses soient distinctes)
  const s0 = tire(DM.SELS.filter(x => x.cat.nu + x.an.nu > 2)), bonne0 = DM.equation(s0);
  const f0 = [bonne0, `${s0.f}(s) + H₂O(l) → ${DM.coef(s0.cat.nu)}${s0.cat.s}(aq) + ${DM.coef(s0.an.nu)}${s0.an.s}(aq)`,
    `${s0.f}(s) → ${s0.cat.s}(aq) + ${s0.an.s}(aq)`, `${s0.f}(s) → ${DM.coef(s0.an.nu)}${s0.cat.s}(aq) + ${DM.coef(s0.cat.nu)}${s0.an.s}(aq)`];
  const opts0 = melange(f0);
  const q0 = { id: 'd0', type: 'qcm', q: <>Le solide ionique {s0.nom} {s0.f} (anhydre) est formé d’ions {s0.cat.s} et {s0.an.s}. Quelle est l’équation de sa dissolution dans l’eau ?</>, options: opts0, bonne: opts0.indexOf(bonne0),
    aide: 'À gauche le solide (s), à droite les ions (aq) avec un coefficient pour que la charge totale soit nulle ; l’eau, solvant, ne s’écrit pas.',
    expl: <>Le solide est neutre : {DM.chargePlus(s0)} charge{DM.chargePlus(s0) > 1 ? 's' : ''} + et {DM.chargeMoins(s0)} charge{DM.chargeMoins(s0) > 1 ? 's' : ''} − par formule, donc {s0.cat.nu} ion{s0.cat.nu > 1 ? 's' : ''} {s0.cat.s} et {s0.an.nu} ion{s0.an.nu > 1 ? 's' : ''} {s0.an.s}. Équation : <b>{bonne0}</b> (l’eau n’est pas écrite).</> };
  // q1 : concentration effective d'un ion à partir de c
  const s1 = tire(DM.SELS), [I1] = ionDe(s1), c1 = tire([0.0100, 0.0200, 0.0500, 0.100, 0.200, 0.500]), v1 = I1.nu * c1;
  const q1 = { id: 'd1', type: 'num', q: <>Une solution de {s1.nom} {s1.f} anhydre a une concentration en soluté apporté <b>c = {nb(c1, 3)}{NB}mol/L</b> (le solide est formé d’ions {s1.cat.s} et {s1.an.s}). Calculez la concentration effective en ions {I1.s}, en <b>mol/L</b>.</>, unite: 'mol/L', vrai: v1, csMin: 3, tolRel: 0.01,
    aide: 'Écrivez l’équation de dissolution : le coefficient de l’ion donne [ion] = coefficient × c.',
    pieges: [[c1, 'C’est la concentration en soluté apporté c : il faut multiplier par le coefficient de l’ion dans l’équation.'], [c1 / I1.nu, 'On multiplie c par le coefficient, on ne divise pas.'], [c1 * (s1.cat.nu + s1.an.nu), 'Ce nombre compte tous les ions : on demande seulement l’ion ' + I1.s + '.'], [c1 * I1.q, 'La charge de l’ion n’intervient pas : seul compte son coefficient dans l’équation.']],
    expl: <>{DM.equation(s1)} : coefficient de {I1.s} = {I1.nu}. [{I1.s}] = {I1.nu} × c = {I1.nu} × {nb(c1, 3)} = <b>{avecU(v1, 'mol/L', 3)}</b>.</> };
  // q2 : concentration en soluté apporté à partir de la masse
  const s2 = tire(DM.SELS), M2 = DM.masseMolaire(s2), V2 = tire([100, 250, 500]), c2t = tire([0.050, 0.100, 0.200, 0.500]), m2 = Number((c2t * V2 / 1000 * M2).toPrecision(3)), n2 = m2 / M2, c2 = n2 / (V2 / 1000);
  const q2 = { id: 'd2', type: 'num', q: <>On dissout <b>{nb(m2, 3)}{NB}g</b> de {s2.nom} {s2.f} anhydre (M = {nb(M2, 1)}{NB}g/mol) dans une fiole jaugée de <b>{nb(V2, 4)}{NB}mL</b>, complétée jusqu’au trait de jauge. Calculez la concentration en soluté apporté c, en <b>mol/L</b>.</>, unite: 'mol/L', vrai: c2, csMin: 3, tolRel: 0.01,
    aide: 'n = m / M, puis c = n / V avec V en litres (1 L = 1000 mL).',
    pieges: [[n2 / V2, 'Vous n’avez pas converti les mL en L : V = ' + nb(V2 / 1000, 3) + ' L.'], [m2 / (V2 / 1000), 'C’est la concentration en masse (en g/L) : pour c en mol/L, il faut diviser la masse par M.'], [n2, 'C’est la quantité de matière n (en mol) : il faut encore diviser par le volume.']],
    expl: <>n = m / M = {nb(m2, 3)} / {nb(M2, 1)} = {nb(n2, 3)}{NB}mol ; V = {nb(V2 / 1000, 3)}{NB}L ; c = n / V = <b>{avecU(c2, 'mol/L', 3)}</b>.</> };
  // q3 : concentration effective d'un ion à partir de la masse (trois calculs)
  const s3 = tire(DM.SELS), M3 = DM.masseMolaire(s3), V3 = tire([100, 250, 500]), c3t = tire([0.050, 0.100, 0.200, 0.500]), m3 = Number((c3t * V3 / 1000 * M3).toPrecision(3)), [I3] = ionDe(s3), n3 = m3 / M3, c3 = n3 / (V3 / 1000), v3 = I3.nu * c3;
  const q3 = { id: 'd3', type: 'num', q: <>On dissout <b>{nb(m3, 3)}{NB}g</b> de {s3.nom} {s3.f} anhydre (M = {nb(M3, 1)}{NB}g/mol, solide formé d’ions {s3.cat.s} et {s3.an.s}) dans une fiole jaugée de <b>{nb(V3, 4)}{NB}mL</b>, complétée jusqu’au trait de jauge. Calculez la concentration effective en ions {I3.s}, en <b>mol/L</b>.</>, unite: 'mol/L', vrai: v3, csMin: 3, tolRel: 0.01,
    aide: 'Trois calculs : n = m / M, c = n / V (V en litres), puis [ion] = coefficient × c.',
    pieges: [[c3, 'C’est la concentration en soluté apporté c : il reste à multiplier par le coefficient de ' + I3.s + ' dans l’équation.'], [I3.nu * n3, 'C’est une quantité de matière (en mol) : il faut diviser par le volume en litres.'], [v3 / 1000, 'Vous n’avez pas converti les mL en L : V = ' + nb(V3 / 1000, 3) + ' L.']],
    expl: <>n = m / M = {nb(n3, 3)}{NB}mol ; c = n / V = {nb(n3, 3)} / {nb(V3 / 1000, 3)} = {nb(c3, 3)}{NB}mol/L ; coefficient de {I3.s} = {I3.nu}, donc [{I3.s}] = <b>{avecU(v3, 'mol/L', 3)}</b>.</> };
  // q4 : masse à peser pour obtenir une concentration effective donnée
  const s4 = tire(DM.SELS), M4 = DM.masseMolaire(s4), V4 = tire([100, 250, 500]), [I4] = ionDe(s4), c4 = tire([0.050, 0.100, 0.200, 0.500]), cible4 = I4.nu * c4, m4 = c4 * (V4 / 1000) * M4;
  const q4 = { id: 'd4', type: 'num', q: <>On veut préparer <b>{nb(V4, 4)}{NB}mL</b> de solution de {s4.nom} {s4.f} anhydre (M = {nb(M4, 1)}{NB}g/mol, solide formé d’ions {s4.cat.s} et {s4.an.s}) avec une concentration effective en ions {I4.s} égale à <b>{nb(cible4, 3)}{NB}mol/L</b>. Calculez la masse de solide à peser, en <b>g</b>.</>, unite: 'g', vrai: m4, csMin: 3, tolRel: 0.01,
    aide: 'Remontez : c = [ion] / coefficient, puis n = c × V (V en litres) et m = n × M.',
    pieges: [[cible4 * (V4 / 1000) * M4, 'Vous avez utilisé [' + I4.s + '] à la place de c : divisez-la par le coefficient de l’ion dans l’équation.'], [cible4 * I4.nu * (V4 / 1000) * M4, 'Il faut diviser par le coefficient de l’ion, pas multiplier : c = [ion] / coefficient.'], [m4 * 1000, 'Vous n’avez pas converti les mL en L : V = ' + nb(V4 / 1000, 3) + ' L.']],
    expl: <>c = [{I4.s}] / {I4.nu} = {nb(cible4, 3)} / {I4.nu} = {nb(c4, 3)}{NB}mol/L ; n = c × V = {nb(c4, 3)} × {nb(V4 / 1000, 3)} = {nb(c4 * V4 / 1000, 3)}{NB}mol ; m = n × M = <b>{avecU(m4, 'g', 3)}</b>.</> };
  // q5 : quantité d'ions dans un prélèvement
  const s5 = tire(DM.SELS), [I5] = ionDe(s5), c5 = tire([0.050, 0.100, 0.200, 0.500]), V5 = tire([10.0, 20.0, 25.0, 50.0]), n5 = I5.nu * c5 * V5;   // mmol
  const q5 = { id: 'd5', type: 'num', q: <>Une solution de {s5.nom} {s5.f} anhydre a une concentration en soluté apporté <b>c = {nb(c5, 3)}{NB}mol/L</b> (solide formé d’ions {s5.cat.s} et {s5.an.s}). On en prélève <b>{nb(V5, 3)}{NB}mL</b>. Calculez la quantité d’ions {I5.s} dans ce prélèvement, en <b>mmol</b>.</>, unite: 'mmol', vrai: n5, csMin: 3, tolRel: 0.01,
    aide: 'D’abord [ion] = coefficient × c, puis n = [ion] × V ; mol/L × mL donne des mmol.',
    pieges: [[c5 * V5, 'C’est la quantité de soluté apporté : il faut multiplier par le coefficient de ' + I5.s + ' dans l’équation.'], [n5 / 1000, 'Le résultat est demandé en mmol : mol/L × mL = mmol, sans conversion.'], [I5.nu * c5 / (V5 / 1000), 'On multiplie la concentration par le volume, on ne divise pas : n = [ion] × V.']],
    expl: <>[{I5.s}] = {I5.nu} × {nb(c5, 3)} = {nb(I5.nu * c5, 3)}{NB}mol/L ; n = [{I5.s}] × V = {nb(I5.nu * c5, 3)} × {nb(V5, 3)} = <b>{avecU(n5, 'mmol', 3)}</b>.</> };
  [q1, q2, q3, q4, q5].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Dissolution d’un solide ionique : équation de dissolution, concentration en soluté apporté et concentration effective de chaque ion, masse à peser et quantité d’ions dans un prélèvement.', questions: [q0, q1, q2, q3, q4, q5],
    retenir: ['Équation : solide (s) → ions (aq), charge conservée, l’eau ne s’écrit pas ; un ion polyatomique reste groupé.', 'Concentration effective : [ion] = coefficient × c, avec c = n / V et n = m / M (V en litres).', 'Pour la masse à peser : c = [ion] / coefficient, puis m = c × V × M.'] };
}

// ───────────── Combustions (1G) : équation, liaisons rompues et formées, énergie molaire de réaction, écart, énergie libérée, pouvoir calorifique ─────────────
function genCombustion1G() {
  const ent = x => String(Math.round(Math.abs(x)));
  const sg = x => (x < 0 ? '−' : '') + ent(x);
  const cnt = x => String(x).replace('.', ',');
  const tm = (x, f) => (x === 1 ? f : `${CM.coefTexte(x).trim()}${NB}${f}`);
  const eqTxt = (f, o, c, h) => `${f} + ${tm(o, 'O₂')} → ${tm(c, 'CO₂')} + ${tm(h, 'H₂O')}`;
  const donnees = <>Données : énergies de liaison moyennes, en kJ·mol⁻¹ : D(C–H) = {CM.D_LIAISON.CH} ; D(C–C) = {CM.D_LIAISON.CC} ; D(C–O) = {CM.D_LIAISON.CO} ; D(O–H) = {CM.D_LIAISON.OH} ; D(O=O) = {CM.D_LIAISON.OO} ; D(C=O) = {CM.D_LIAISON.CdO}. Hypothèse du modèle : tous les corps sont pris à l’état gazeux.</>;
  const decrit = c => Object.entries(CM.liaisonsMolecule(c)).filter(([, n]) => n).map(([t, n]) => `${cnt(n)}${NB}liaison${n > 1 ? 's' : ''}${NB}${CM.NOM_LIAISON[t]}`).join(', ');
  const c = tire(CM.COMBUSTIBLES), k = CM.coefficients(c);
  const eqC = CM.equation(c), R = CM.energieRompue(c), F = CM.energieFormee(c), Er = CM.energieReaction(c), M = CM.masseMolaire(c);
  const contexte = <>On étudie la combustion complète du {c.nom} {c.f} ({c.usage}), d’équation <b>{eqC}</b> (pour 1 mol de {c.nom}). Une molécule de {c.nom} contient {decrit(c)}.</>;
  // q0 : équation équilibrée (combustibles à coefficients entiers pour que les propositions soient distinctes)
  const e0 = tire(CM.COMBUSTIBLES.filter(CM.estEntiere)), k0 = CM.coefficients(e0), a0 = CM.atomes(e0);
  const bonne0 = eqTxt(e0.f, k0.O2, k0.CO2, k0.H2O);
  const faux0 = [eqTxt(e0.f, k0.O2, k0.CO2, a0.H), eqTxt(e0.f, k0.CO2, k0.CO2, k0.H2O), eqTxt(e0.f, 2 * k0.CO2 + k0.H2O, k0.CO2, k0.H2O)].filter((x, i, t) => x !== bonne0 && t.indexOf(x) === i);
  while (faux0.length < 3) faux0.push(eqTxt(e0.f, k0.O2 + faux0.length + 1, k0.CO2, k0.H2O));
  const opts0 = melange([bonne0, ...faux0]);
  const q0 = { id: 'c0', type: 'qcm', q: <>Quelle est l’équation équilibrée de la combustion complète du {e0.nom} {e0.f}, avec le coefficient 1 pour le {e0.nom} ?</>, options: opts0, bonne: opts0.indexOf(bonne0),
    aide: 'Équilibrez dans l’ordre C, puis H, puis O. Une molécule H₂O contient 2 atomes H, une molécule O₂ contient 2 atomes O.',
    expl: <>C : {a0.C} atome{a0.C > 1 ? 's' : ''}, donc {k0.CO2} CO₂. H : {a0.H} atomes, donc {k0.H2O} H₂O. O : {k0.CO2} × 2 + {k0.H2O} = {2 * k0.CO2 + k0.H2O} atomes à droite{a0.O ? ', dont 1 est déjà dans la molécule du combustible' : ''} : il faut {k0.O2} O₂. Équation : <b>{bonne0}</b>.</> };
  // q1 : énergie à fournir pour rompre les liaisons des réactifs
  const q1 = { id: 'c1', type: 'num', q: <>{contexte} {donnees} Calculez l’énergie à fournir pour rompre toutes les liaisons des réactifs, en <b>kJ/mol</b> de {c.nom}.</>, unite: 'kJ/mol', vrai: R, csMin: 3, tolRel: 0.01,
    aide: 'Comptez : les liaisons de la molécule de combustible, et une liaison O=O par molécule O₂ de l’équation. Multipliez chaque nombre par D et additionnez.',
    pieges: [[R - (k.O2 - 1) * CM.D_LIAISON.OO, 'Il y a une liaison O=O par molécule O₂ : il faut multiplier D(O=O) par le coefficient de O₂ dans l’équation.'], [R - CM.D_LIAISON.OO * k.O2, 'Vous avez oublié de rompre le dioxygène : chaque molécule O₂ contient une liaison O=O.'], [F, 'Ce sont les liaisons des produits : on demande ici celles des réactifs.']],
    expl: <>Rompues : {Object.entries(CM.liaisonsRompues(c)).map(([t, n]) => `${cnt(n)} × ${CM.NOM_LIAISON[t]}`).join(' + ')} ; énergie : {Object.entries(CM.liaisonsRompues(c)).map(([t, n]) => `${cnt(n)} × ${CM.D_LIAISON[t]}`).join(' + ')} = <b>{ent(R)}{NB}kJ/mol</b>.</> };
  // q2 : énergie libérée par la formation des liaisons des produits
  const q2 = { id: 'c2', type: 'num', q: <>{contexte} {donnees} La molécule CO₂ s’écrit O=C=O et la molécule H₂O s’écrit H–O–H. Calculez l’énergie libérée par la formation de toutes les liaisons des produits, en <b>kJ/mol</b> de {c.nom}, comme un nombre positif.</>, unite: 'kJ/mol', vrai: F, csMin: 3, tolRel: 0.01,
    aide: 'Chaque CO₂ contient 2 liaisons C=O et chaque H₂O contient 2 liaisons O–H : multipliez par les coefficients de l’équation.',
    pieges: [[F - k.CO2 * CM.D_LIAISON.CdO, 'Chaque molécule CO₂ contient deux liaisons C=O, pas une.'], [F - k.H2O * CM.D_LIAISON.OH, 'Chaque molécule H₂O contient deux liaisons O–H, pas une.'], [-F, 'L’énergie libérée se donne ici comme un nombre positif.'], [R, 'Ce sont les liaisons des réactifs : on demande ici celles des produits.']],
    expl: <>Formées : {cnt(2 * k.CO2)} × C=O et {cnt(2 * k.H2O)} × O–H : {cnt(2 * k.CO2)} × {CM.D_LIAISON.CdO} + {cnt(2 * k.H2O)} × {CM.D_LIAISON.OH} = <b>{ent(F)}{NB}kJ/mol</b>.</> };
  // q3 : énergie molaire de réaction
  const q3 = { id: 'c3', type: 'num', q: <>{contexte} {donnees} La molécule CO₂ s’écrit O=C=O et la molécule H₂O s’écrit H–O–H. Estimez l’énergie molaire de réaction E<sub>r</sub>, avec son signe, en <b>kJ/mol</b> de {c.nom}.</>, unite: 'kJ/mol', vrai: Er, csMin: 3, tolRel: 0.01,
    aide: 'E_r = Σ D(liaisons rompues) − Σ D(liaisons formées). Rompues : combustible et O₂. Formées : C=O de CO₂ et O–H de H₂O.',
    pieges: [[-Er, 'Le signe est faux : une combustion libère de l’énergie, E_r est négative.'], [R + F, 'On soustrait l’énergie libérée à l’énergie fournie, on ne les additionne pas.'], [R - CM.D_LIAISON.OO * k.O2 - F, 'Vous avez oublié de rompre les liaisons O=O du dioxygène.']],
    expl: <>Σ D(rompues) = {ent(R)} kJ/mol ; Σ D(formées) = {ent(F)} kJ/mol ; E<sub>r</sub> = {ent(R)} − {ent(F)} = <b>{sg(Er)}{NB}kJ/mol</b> (estimation : énergies moyennes, phase gazeuse).</> };
  // q4 : écart relatif avec la valeur de référence
  const q4 = { id: 'c4', type: 'num', q: <>L’énergie molaire de réaction estimée de la combustion du {c.nom} est E<sub>r</sub> = <b>{sg(Er)}{NB}kJ/mol</b> ; la valeur de référence tabulée, pour la même réaction (gaz), est <b>{sg(c.ref)}{NB}kJ/mol</b>. Calculez l’écart relatif entre l’estimation et la référence, en <b>%</b>.</>, unite: '%', vrai: CM.ecartRelatif(c) * 100, csMin: 2, tolRel: 0.06,
    aide: 'Écart relatif = |estimation − référence| ÷ |référence|, puis ×100 pour l’exprimer en pourcentage.',
    pieges: [[CM.ecartRelatif(c), 'Le rapport est donné en pourcentage : multipliez par 100.'], [Math.abs(Er - c.ref), 'C’est l’écart absolu en kJ/mol : divisez-le par la référence et exprimez en %.']],
    expl: <>|{sg(Er)} − ({sg(c.ref)})| = {ent(Er - c.ref)} kJ/mol ; écart relatif = {ent(Er - c.ref)} ÷ {ent(c.ref)} = {nb(CM.ecartRelatif(c), 3)}, soit <b>{avecU(CM.ecartRelatif(c) * 100, '%', 2)}</b>. Un écart de quelques % est normal : les énergies de liaison sont des moyennes.</> };
  // q5 : énergie libérée par une masse donnée
  const m5 = tire([10, 20, 50, 100]), Q5 = m5 / M * (-Er);
  const q5 = { id: 'c5', type: 'num', q: <>La combustion complète d’une mole de {c.nom} {c.f} libère, d’après l’estimation, <b>{ent(Er)}{NB}kJ</b> (E<sub>r</sub> = {sg(Er)}{NB}kJ/mol). Sa masse molaire est <b>M = {nb(M, 3)}{NB}g/mol</b>. Calculez l’énergie libérée par la combustion complète de <b>{nb(m5, 3)}{NB}g</b> de {c.nom}, en <b>kJ</b>.</>, unite: 'kJ', vrai: Q5, csMin: 3, tolRel: 0.01,
    aide: 'D’abord la quantité de matière n = m / M, puis l’énergie = n × |E_r|.',
    pieges: [[m5 * (-Er), 'Vous avez multiplié la masse par E_r : il faut passer par la quantité de matière n = m / M.'], [m5 * M / (-Er), 'Le raisonnement est inversé : l’énergie est n × |E_r|, avec n = m / M.'], [-Er / M, 'C’est l’énergie par gramme : multipliez par la masse brûlée.']],
    expl: <>n = m / M = {nb(m5, 3)} ÷ {nb(M, 3)} = {nb(m5 / M, 3)}{NB}mol ; énergie = n × |E<sub>r</sub>| = {nb(m5 / M, 3)} × {ent(Er)} = <b>{avecU(Q5, 'kJ', 3)}</b>.</> };
  // q6 : pouvoir calorifique
  const q6 = { id: 'c6', type: 'num', q: <>Pour le {c.nom} {c.f}, l’énergie molaire de réaction estimée est E<sub>r</sub> = <b>{sg(Er)}{NB}kJ/mol</b> et la masse molaire est <b>M = {nb(M, 3)}{NB}g/mol</b>. Calculez son pouvoir calorifique estimé, en <b>MJ/kg</b> (1 kJ/g = 1 MJ/kg).</>, unite: 'MJ/kg', vrai: CM.pouvoirCalorifique(c), csMin: 3, tolRel: 0.01,
    aide: 'PC = |E_r| ÷ M : des kJ par mole divisés par des g par mole donnent des kJ/g, soit des MJ/kg.',
    pieges: [[-Er, 'C’est l’énergie par mole : divisez par la masse molaire pour obtenir l’énergie par gramme.'], [-Er * M, 'On divise par la masse molaire, on ne multiplie pas.'], [CM.pouvoirCalorifique(c) * 1000, 'Facteur 1000 : 1 kJ/g = 1 MJ/kg, il n’y a pas de conversion à faire.']],
    expl: <>PC = |E<sub>r</sub>| ÷ M = {ent(Er)} ÷ {nb(M, 3)} = {nb(CM.pouvoirCalorifique(c), 3)}{NB}kJ/g, soit <b>{avecU(CM.pouvoirCalorifique(c), 'MJ/kg', 3)}</b>.</> };
  [q1, q2, q3, q4, q5, q6].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
  return { intro: 'Combustions : équation équilibrée, énergie de rupture et de formation des liaisons, énergie molaire de réaction estimée, écart avec la référence, énergie libérée et pouvoir calorifique.', questions: [q0, q1, q2, q3, q4, q5, q6],
    retenir: ['Équilibrer dans l’ordre C, H, O ; un alcool apporte déjà un atome O.', 'E_r ≈ Σ D(rompues) − Σ D(formées) ; E_r < 0 : exothermique ; estimation avec des énergies moyennes, en phase gazeuse.', 'Pouvoir calorifique : PC = |E_r| ÷ M, en kJ/g = MJ/kg ; énergie libérée par une masse m : (m / M) × |E_r|.'] };
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

// ───────────── Acide faible (terminale STL, PCM) : conservation de la matière, coefficient de dissociation, Ka, pKa, dilution ─────────────
const sciF = (x, cs = 2) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
const nbF = (x, d) => Number(x).toFixed(d).replace('.', ',');
const CAND_ALPHA = ACF.CANDIDATS.filter(c => ACF.mesure(c.id, c.C).alpha >= 0.08);      // α assez grand pour que « C − [A⁻] » diffère de C d'au moins 8 %
const PAIRES_DIL = ACF.PAIRES.filter(x => x.meme && Math.abs(x.a.C / x.b.C - 10) < 1e-9);   // même acide, dilution par 10
const filtrer = qs => qs.forEach(q => { q.pieges = q.pieges.filter(([y]) => isFinite(y) && Math.abs(y - q.vrai) > Math.max(0.02, 1.5 * (q.tolRel ?? 0.006)) * Math.abs(q.vrai)); });
function genDissocAlpha() {
  const { id, C } = tire(CAND_ALPHA), m = ACF.mesure(id, C), pHs = nbF(m.pH, 2), Cs = nb(C, 2);
  const intro = `On dissout un acide faible AH dans l’eau à 25${NB}°C : concentration en soluté apporté C₀ = ${Cs}${NB}mol/L ; un pH-mètre indique pH = ${pHs}. On suppose [A⁻] = [H₃O⁺] et on applique la conservation de la matière.`;
  const q1 = { id: 'd0', type: 'num', q: <>Calculez la concentration en ions oxonium <b>[H₃O⁺]</b> de cette solution (pH = {pHs}), en mol/L, avec 2 chiffres significatifs.</>, unite: 'mol/L', vrai: m.h, tolRel: 0.05, csMin: 2,
    aide: '[H₃O⁺] = 10^(−pH) avec la touche 10ˣ de la calculatrice (c° = 1 mol/L).',
    pieges: [[10 ** m.pH, 'Le signe de l’exposant est oublié : [H₃O⁺] = 10^(−pH), un nombre inférieur à 1.'], [m.pH, 'C’est le pH : on demande la concentration en ions oxonium.'], [Math.exp(-m.pH), 'Vous avez utilisé eˣ : pour un pH, c’est la touche 10ˣ.']],
    expl: <>[H₃O⁺] = 10<sup>−{pHs}</sup> = <b>{sciF(m.h)}{NB}mol/L</b>.</> };
  const q2 = { id: 'd1', type: 'num', q: <>En utilisant la conservation de la matière, calculez la concentration en acide restant <b>[AH]</b> (mol/L, 2 chiffres significatifs). On rappelle [A⁻] = [H₃O⁺] = {sciF(m.h)}{NB}mol/L.</>, unite: 'mol/L', vrai: m.AH, tolRel: 0.05, csMin: 2,
    aide: 'C₀ = [AH] + [A⁻], donc [AH] = C₀ − [A⁻].',
    pieges: [[C, 'C’est C₀ : il faut retrancher la quantité d’acide transformée en A⁻.'], [m.h, 'C’est [A⁻] ; on demande l’acide qui reste, [AH] = C₀ − [A⁻].'], [C + m.h, 'Il faut soustraire [A⁻] à C₀, pas l’ajouter.']],
    expl: <>[AH] = {Cs} − {sciF(m.h)} = <b>{sciF(m.AH)}{NB}mol/L</b>.</> };
  const q3 = { id: 'd2', type: 'num', q: <>Calculez le coefficient de dissociation <b>α</b> de l’acide (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: m.alpha, tolRel: 0.06, csMin: 2,
    aide: 'α = frac([A⁻]|C₀) : part de l’acide introduit qui a réagi avec l’eau, comprise entre 0 et 1.',
    pieges: [[C / m.h, 'Le rapport est inversé : α = frac([A⁻]|C₀) est inférieur à 1.'], [m.alpha * 100, 'α est sans unité, entre 0 et 1 : un pourcentage s’écrit en divisant par 100.'], [1 - m.alpha, 'C’est la part d’acide qui n’a pas réagi ; α est la part qui a réagi.'], [m.h, 'C’est [A⁻] en mol/L : il faut encore le diviser par C₀.']],
    expl: <>α = {avecIndices(`frac(${sciF(m.h)}|${Cs})`)} = <b>{nbF(ACF.arrondiCS(m.alpha, 2), m.alpha < 0.1 ? 3 : 2)}</b>.</> };
  const q4 = { id: 'd3', type: 'num', q: <>Sur 100 molécules d’acide introduites, combien ont réagi avec l’eau ? Exprimez le <b>pourcentage</b> α × 100 (en %, 2 chiffres significatifs).</>, unite: '%', vrai: 100 * m.alpha, tolRel: 0.06, csMin: 2,
    aide: 'Pourcentage = α × 100, avec α = frac([A⁻]|C₀).',
    pieges: [[100 * (1 - m.alpha), 'C’est le pourcentage de molécules restées sous forme AH.'], [m.alpha, 'C’est α sans unité : multipliez par 100 pour avoir un pourcentage.'], [1000 * m.alpha, 'α × 100, pas α × 1 000.']],
    expl: <>α × 100 = <b>{nbF(100 * m.alpha, 1)}{NB}%</b> : environ {Math.round(100 * m.alpha)} molécules sur 100 ont réagi.</> };
  filtrer([q1, q2, q3, q4]);
  return { intro, questions: [q1, q2, q3, q4],
    retenir: ['[H₃O⁺] = 10^(−pH) ; pour un acide faible [A⁻] = [H₃O⁺].', 'Conservation de la matière : C₀ = [AH] + [A⁻].', 'α = frac([A⁻]|C₀), sans unité, α < 1 pour un acide faible.'] };
}
function genDissocKa() {
  const x = tire(PAIRES_DIL), m1 = ACF.mesure(x.a.id, x.a.C), m2 = ACF.mesure(x.b.id, x.b.C), C1s = nb(x.a.C, 2), C2s = nb(x.b.C, 2);
  const Ka1 = ACF.arrondiCS(m1.Ka, 2);
  const intro = `Une solution d’un acide faible AH, de concentration en soluté apporté C₁ = ${C1s}${NB}mol/L, a un pH égal à ${nbF(m1.pH, 2)} à 25${NB}°C. On la dilue ensuite 10 fois : C₂ = ${C2s}${NB}mol/L, pH = ${nbF(m2.pH, 2)}.`;
  const q1 = { id: 'k0', type: 'num', q: <>Calculez la constante d’acidité <b>Ka</b> du couple AH / A⁻ à partir de la solution initiale (pH = {nbF(m1.pH, 2)}), sans unité, avec 2 chiffres significatifs.</>, unite: '', vrai: m1.Ka, tolRel: 0.10, csMin: 2,
    aide: '[A⁻] = [H₃O⁺] = 10^(−pH) et [AH] = C₁ − [H₃O⁺] ; Ka = frac([A⁻] × [H₃O⁺]|[AH]). Gardez un chiffre de plus pendant le calcul.',
    pieges: [[m1.h * m1.h, 'Il faut diviser par [AH] : Ka = frac([A⁻] × [H₃O⁺]|[AH]).'], [m1.h / m1.AH, 'Il manque un facteur [H₃O⁺] au numérateur : les deux produits sont au numérateur.'], [m1.AH / (m1.h * m1.h), 'Le rapport est inversé : les produits sont au numérateur.'], [m1.h * m1.h / x.a.C, 'Au dénominateur, c’est [AH] = C₁ − [A⁻], pas C₁.', 0.04]],
    expl: <>[H₃O⁺] = [A⁻] = {sciF(m1.h, 3)}{NB}mol/L ; [AH] = {C1s} − {sciF(m1.h, 3)} = {sciF(m1.AH, 3)}{NB}mol/L ; Ka = <b>{sciF(m1.Ka)}</b>.</> };
  const q2 = { id: 'k1', type: 'num', q: <>On retient Ka = {sciF(Ka1)}. Calculez le <b>pKa</b> du couple (sans unité, 3 chiffres significatifs).</>, unite: '', vrai: -Math.log10(Ka1), tolRel: 0.02, csMin: 3,
    aide: 'pKa = −log Ka, avec la touche log de la calculatrice.',
    pieges: [[Math.log10(Ka1), 'Le signe est inversé : Ka < 1, donc log Ka est négatif et le pKa est positif.'], [Ka1, 'C’est Ka lui-même : le pKa est −log Ka.'], [-Math.log(Ka1), 'Vous avez utilisé ln au lieu de log (logarithme décimal).']],
    expl: <>pKa = −log({sciF(Ka1)}) = <b>{nbF(-Math.log10(Ka1), 2)}</b>.</> };
  const q3 = { id: 'k2', type: 'num', q: <>Pour la solution diluée (C₂ = {C2s}{NB}mol/L, pH = {nbF(m2.pH, 2)}), calculez le coefficient de dissociation <b>α</b> (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: m2.alpha, tolRel: 0.06, csMin: 2,
    aide: 'α = frac([A⁻]|C₂) avec [A⁻] = [H₃O⁺] = 10^(−pH).',
    pieges: [[m2.h, 'C’est [A⁻] en mol/L : il faut encore le diviser par C₂.'], [x.b.C / m2.h, 'Le rapport est inversé : α = frac([A⁻]|C₂) est inférieur à 1.'], [1 - m2.alpha, 'C’est la part d’acide qui n’a pas réagi.']],
    expl: <>[A⁻] = {sciF(m2.h)}{NB}mol/L ; α = {avecIndices(`frac(${sciF(m2.h)}|${C2s})`)} = <b>{nbF(ACF.arrondiCS(m2.alpha, 2), 2)}</b>, à comparer à {nbF(ACF.arrondiCS(m1.alpha, 2), m1.alpha < 0.1 ? 3 : 2)} avant la dilution : α a augmenté.</> };
  const q4 = { id: 'k3', type: 'num', q: <>Calculez la constante d’acidité <b>Ka</b> à partir de la solution diluée (sans unité, 2 chiffres significatifs). Que remarquez-vous par rapport à la solution initiale ?</>, unite: '', vrai: m2.Ka, tolRel: 0.10, csMin: 2,
    aide: '[A⁻] = [H₃O⁺] = 10^(−pH), [AH] = C₂ − [A⁻], puis Ka = frac([A⁻] × [H₃O⁺]|[AH]).',
    pieges: [[m2.h * m2.h, 'Il faut diviser par [AH] : Ka = frac([A⁻] × [H₃O⁺]|[AH]).'], [m2.h * m2.h / x.b.C, 'Au dénominateur, c’est [AH] = C₂ − [A⁻], pas C₂ : à cette dilution la différence compte.', 0.04], [m2.AH / (m2.h * m2.h), 'Le rapport est inversé : les produits sont au numérateur.']],
    expl: <>Ka = {avecIndices(`frac((${sciF(m2.h, 3)})²|${sciF(m2.AH, 3)})`)} = <b>{sciF(m2.Ka)}</b> : même valeur que pour la solution initiale ({sciF(m1.Ka)}) aux incertitudes près. Ka ne dépend pas de la concentration, alors que α augmente quand on dilue.</> };
  filtrer([q1, q2, q3, q4]);
  return { intro, questions: [q1, q2, q3, q4],
    retenir: ['Ka = frac([A⁻] × [H₃O⁺]|[AH]) ; avec le pH : [A⁻] = [H₃O⁺] = 10^(−pH), [AH] = C₀ − [A⁻].', 'pKa = −log Ka.', 'Dilution : α augmente, Ka reste constant (propriété du couple).'] };
}

// ---------- pH, pKa et prédominance (TSTL, PCM) ----------
// Tirages exploitables : la concentration de la base, retrouvée avec les valeurs arrondies de l'énoncé (C − [AH]), reste à 3 % de la valeur exacte
const CAND_PREDO = PRE.CANDIDATS_RATIO.filter(({ id, C, pH }) => {
  const r = 10 ** (pH - PRE.COUPLES[id].pKa), r2 = PRE.arrondiCS(r, 2), A = C * r / (1 + r), A2 = C - PRE.arrondiCS(C / (1 + r2), 2);
  return A2 > 0 && Math.abs(A2 - A) / A <= 0.03;
});
function genPredoRapport() {
  const { id, C, pH } = tire(CAND_PREDO), cp = PRE.COUPLES[id], pHs = nbF(pH, 2), Cs = nb(C, 2), pK = nbF(cp.pKa, 1);
  const r = 10 ** (pH - cp.pKa), r2 = PRE.arrondiCS(r, 2), AH2 = PRE.arrondiCS(C / (1 + r2), 2), A2 = PRE.arrondiCS(C - AH2, 2), pb = 100 * r / (1 + r);
  const rs = r2 >= 100 || r2 < 0.01 ? sciF(r2) : nbF(r2, r2 >= 10 ? 0 : r2 >= 1 ? 1 : 2);
  const intro = `Une solution contient le couple ${cp.AH} / ${cp.A} de pKa = ${pK}, à 25${NB}°C ; sa concentration totale est C = [AH] + [A⁻] = ${Cs}${NB}mol/L et son pH est imposé à ${pHs}.`;
  const q1 = { id: 'p0', type: 'num', q: <>Calculez le rapport <b>{avecIndices('frac([A⁻]|[AH])')}</b> des concentrations des deux formes (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: r2, tolRel: 0.05, csMin: 2,
    aide: 'pH = pKa + log(frac([A⁻]|[AH])) donc frac([A⁻]|[AH]) = 10^(pH − pKa) (touche 10ˣ).',
    pieges: [[pH - cp.pKa, 'C’est la différence pH − pKa, donc le logarithme du rapport : il faut prendre 10 puissance cette valeur.'], [1 / r, 'Le rapport est inversé : on demande frac([A⁻]|[AH]), base sur acide.']],
    expl: <>{avecIndices('frac([A⁻]|[AH])')} = 10<sup>{pHs} − {pK}</sup> = 10<sup>{nbF(pH - cp.pKa, 2)}</sup> = <b>{rs}</b>.</> };
  const q2 = { id: 'p1', type: 'num', q: <>On prend un rapport {avecIndices('frac([A⁻]|[AH])')} = {rs}. Avec la conservation de la matière C = [AH] + [A⁻], calculez la concentration de l’acide <b>[AH]</b> (mol/L, 2 chiffres significatifs).</>, unite: 'mol/L', vrai: AH2, tolRel: 0.05, csMin: 2,
    aide: 'Si r = frac([A⁻]|[AH]), alors C = [AH] × (1 + r) donc [AH] = frac(C|1 + r).',
    pieges: [[C * r2, 'C’est C × r : le total ne peut pas dépasser C. Utilisez [AH] = C divisée par (1 + r).'], [C / r2, 'Il faut tenir compte de l’acide : le total est [AH] + [A⁻] = C, donc [AH] = C divisée par (1 + r).'], [C, 'C’est la concentration totale du couple : l’acide n’en est qu’une partie.']],
    expl: <>[AH] = {avecIndices(`frac(${Cs}|1 + ${rs})`)} = <b>{sciF(AH2)}{NB}mol/L</b>.</> };
  const q3 = { id: 'p2', type: 'num', q: <>Avec [AH] = {sciF(AH2)}{NB}mol/L, calculez la concentration de la base <b>[A⁻]</b> (mol/L, 2 chiffres significatifs).</>, unite: 'mol/L', vrai: A2, tolRel: 0.05, csMin: 2,
    aide: 'Conservation de la matière : [A⁻] = C − [AH].',
    pieges: [[AH2, 'C’est la concentration de l’acide [AH] ; on demande la base, [A⁻] = C − [AH].'], [C + AH2, 'Il faut soustraire [AH] à C, pas l’ajouter.'], [C * r2, 'C’est C × r, qui dépasse C ; [A⁻] est C − [AH].']],
    expl: <>[A⁻] = {Cs} − {sciF(AH2)} = <b>{sciF(A2)}{NB}mol/L</b>.</> };
  const q4 = { id: 'p3', type: 'num', q: <>Quel pourcentage de l’ensemble du couple est sous forme basique A⁻ ? Calculez {avecIndices('100 × frac([A⁻]|C)')} (en %, 2 chiffres significatifs, avec [A⁻] = {sciF(A2)}{NB}mol/L).</>, unite: '%', vrai: 100 * A2 / C, tolRel: 0.05, csMin: 2,
    aide: 'Pourcentage = 100 × frac([A⁻]|C).',
    pieges: [[100 * AH2 / C, 'C’est le pourcentage de la forme acide AH ; on demande celui de la base.'], [A2 / C, 'C’est une fraction : multipliez par 100 pour obtenir un pourcentage.'], [100 * A2, 'Il faut diviser [A⁻] par C avant de multiplier par 100.'], [100 * r2, 'C’est le rapport multiplié par 100 ; la part de la base se calcule dans l’ensemble du couple : 100 × frac([A⁻]|C).']],
    expl: <>{avecIndices(`100 × frac(${sciF(A2)}|${Cs})`)} = <b>{nbF(100 * A2 / C, pb > 10 && pb < 90 ? 0 : 1)}{NB}%</b>.</> };
  filtrer([q1, q2, q3, q4]);
  return { intro, questions: [q1, q2, q3, q4],
    retenir: ['frac([A⁻]|[AH]) = 10^(pH − pKa).', 'Conservation de la matière : C = [AH] + [A⁻], donc [AH] = frac(C|1 + r).', 'À pH = pKa ± 1 : un facteur 10 entre les deux formes.'] };
}
// ---------- Solution tampon (TSTL, PCM) ----------
function tirageTampstlPrepa() {
  for (let k = 0; k < 500; k++) {
    const t = TMP.tiragePrep(), cp = TMP.COUPLES[t.coupleId], r2 = PRE.arrondiCS(10 ** (t.pH - cp.pKa), 2);
    const vb2 = PRE.arrondiCS(TMP.volumeBase(r2, t.V), 2), va2 = PRE.arrondiCS(t.V - vb2, 2), nb2 = PRE.arrondiCS(t.C * vb2, 2), v = [r2, vb2, va2, nb2];
    if (v.every((x, i) => v.every((y, j) => i === j || Math.abs(x - y) > 0.1 * Math.max(x, y)))) return { t, cp, r2, vb2, va2, nb2 };
  }
  throw new Error('tirage tampstl-prepa impossible');
}
function genTampstlPrepa() {
  const { t, cp, r2, vb2, va2, nb2 } = tirageTampstlPrepa(), pHs = nbF(t.pH, 1), pK = nbF(cp.pKa, 1), Cs = nbF(t.C, 2);
  const rs = r2 >= 10 ? nbF(r2, 0) : nbF(r2, r2 >= 1 ? 1 : 2);
  const vbs = nbF(vb2, vb2 >= 10 ? 0 : 1), vas = nbF(va2, va2 >= 10 ? 0 : 1);
  const intro = `On veut préparer ${t.V}${NB}mL de solution tampon de pH ${pHs}, à 25${NB}°C, avec le couple ${cp.AH} / ${cp.A} de pKa = ${pK}. On dispose d’une solution de ${cp.AH} et d’une solution de ${cp.A} (sel de sodium), toutes deux de concentration ${Cs}${NB}mol/L.`;
  const q1 = { id: 't0', type: 'num', q: <>Calculez le rapport <b>{avecIndices(`frac(n(${cp.A})|n(${cp.AH}))`)}</b> des quantités de matière à mélanger (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: r2, tolRel: 0.05, csMin: 2,
    aide: 'pH = pKa + log(rapport) donc rapport = 10^(pH − pKa) (touche 10ˣ).',
    pieges: [[t.pH - cp.pKa, 'C’est la différence pH − pKa, donc le logarithme du rapport : il faut prendre 10 puissance cette valeur.'], [1 / r2, 'Le rapport est inversé : on demande la base sur l’acide.'], [t.pH / cp.pKa, 'Il faut calculer 10^(pH − pKa), pas le quotient du pH par le pKa.']],
    expl: <>Rapport = 10<sup>{pHs} − {pK}</sup> = 10<sup>{nbF(t.pH - cp.pKa, 2)}</sup> = <b>{rs}</b>.</> };
  const q2 = { id: 't1', type: 'num', q: <>Les deux solutions ont la même concentration : le rapport des quantités est le rapport des volumes. Avec un rapport de {rs} et V(base) + V(acide) = {t.V}{NB}mL, calculez le volume de solution de <b>{cp.A}</b> à prélever (en mL, 2 chiffres significatifs).</>, unite: 'mL', vrai: vb2, tolRel: 0.05, csMin: 2,
    aide: 'V(base) = r × V(acide) et V(base) + V(acide) = V donc V(base) = frac(V × r|1 + r).',
    pieges: [[t.V * r2, 'C’est V × r : le total ne peut pas dépasser le volume à préparer. Utilisez V(base) = frac(V × r|1 + r).'], [t.V / (1 + r2), 'C’est le volume de la solution d’acide ; on demande celui de la base.'], [t.V / 2, 'Deux volumes égaux donneraient un rapport de 1, donc pH = pKa.']],
    expl: <>V({cp.A}) = {avecIndices(`frac(${t.V} × ${rs}|1 + ${rs})`)} = <b>{vbs}{NB}mL</b>.</> };
  const q3 = { id: 't2', type: 'num', q: <>On prélève {vbs}{NB}mL de solution de {cp.A}. Calculez le volume de solution de <b>{cp.AH}</b> à ajouter pour obtenir {t.V}{NB}mL au total (en mL, 2 chiffres significatifs).</>, unite: 'mL', vrai: va2, tolRel: 0.05, csMin: 2,
    aide: 'Les volumes s’additionnent : V(acide) = V − V(base).',
    pieges: [[vb2, 'C’est le volume de la solution de base, déjà prélevé : on demande celui de la solution d’acide.'], [t.V + vb2, 'Il faut soustraire V(base) du volume total, pas l’ajouter.'], [t.V * va2 / vb2, 'Les volumes s’additionnent : V(acide) = V − V(base).']],
    expl: <>V({cp.AH}) = {t.V} − {vbs} = <b>{vas}{NB}mL</b>.</> };
  const q4 = { id: 't3', type: 'num', q: <>Quelle quantité de matière de <b>{cp.A}</b> contient le volume de {vbs}{NB}mL de la solution à {Cs}{NB}mol/L ? (en mmol, 2 chiffres significatifs ; 1{NB}mol/L = 1{NB}mmol/mL)</>, unite: 'mmol', vrai: nb2, tolRel: 0.05, csMin: 2,
    aide: 'n = C × V : avec C en mol/L et V en mL, n est en mmol.',
    pieges: [[t.C * vb2 / 1000, 'La quantité est en mmol : C en mol/L multipliée par V en mL donne directement des mmol, sans diviser par 1 000.'], [vb2 / t.C, 'Il faut multiplier le volume par la concentration, pas les diviser.'], [t.C * va2, 'C’est la quantité de l’acide ; on demande celle de la base.']],
    expl: <>n({cp.A}) = {Cs} × {vbs} = <b>{nbF(nb2, nb2 >= 10 ? 0 : 1)}{NB}mmol</b>.</> };
  filtrer([q1, q2, q3, q4]);
  return { intro, questions: [q1, q2, q3, q4],
    retenir: ['Rapport des quantités = 10^(pH − pKa), égal au rapport des volumes si les concentrations sont égales.', 'V(base) = frac(V × r|1 + r) et V(acide) = V − V(base).', 'On choisit un couple de pKa proche du pH visé (à ± 1).'] };
}
// Tirage dont les quatre réponses (n(A⁻), n(AH), rapport, pH) sont deux à deux différentes de plus de 10 %
function tirageTampstlAjout() {
  for (let k = 0; k < 500; k++) {
    const a = TMP.tirageAjout(), cp = TMP.COUPLES[a.coupleId], r2 = PRE.arrondiCS(a.nA2 / a.nAH2, 2), v = [a.nA2, a.nAH2, r2, cp.pKa + Math.log10(r2)];
    if (v.every((x, i) => v.every((y, j) => i === j || Math.abs(x - y) > 0.1 * Math.max(x, y)))) return { a, cp, r2 };
  }
  throw new Error('tirage tampstl-ajout impossible');
}
function genTampstlAjout() {
  const { a, cp, r2 } = tirageTampstlAjout(), pK = nbF(cp.pKa, 1), acide = a.sens === 'acide';
  const nA2 = a.nA2, nAH2 = a.nAH2, rs = r2 >= 10 ? nbF(r2, 0) : nbF(r2, r2 >= 1 ? 1 : 2), pH2 = cp.pKa + Math.log10(r2), pH0 = a.pH0;
  const ion = acide ? 'H₃O⁺' : 'HO⁻', reac = acide ? `${ion} + ${cp.A} → ${cp.AH} + H₂O` : `${ion} + ${cp.AH} → ${cp.A} + H₂O`;
  const intro = `Un tampon du couple ${cp.AH} / ${cp.A} (pKa = ${pK}, à 25${NB}°C) contient ${nbF(a.nA, 1)}${NB}mmol de ${cp.A} et ${nbF(a.nAH, 1)}${NB}mmol de ${cp.AH}. On y ajoute ${nbF(a.x, 1)}${NB}mmol d’ions ${ion} (${acide ? 'acide fort' : 'base forte'}), qui réagissent totalement : ${reac}.`;
  const q1 = { id: 'j0', type: 'num', q: <>Calculez la quantité de <b>{cp.A}</b> après la réaction (en mmol, 2 chiffres significatifs).</>, unite: 'mmol', vrai: nA2, tolRel: 0.05, csMin: 2,
    aide: acide ? `Les ions ${ion} consomment la base : n(${cp.A}) final = n(${cp.A}) initial − quantité ajoutée.` : `Les ions ${ion} consomment l’acide et forment la base : n(${cp.A}) final = n(${cp.A}) initial + quantité ajoutée.`,
    pieges: [[acide ? a.nA + a.x : a.nA - a.x, 'Le sens est inversé : ' + (acide ? 'un acide consomme la base, n(A⁻) diminue.' : 'une base forme la base conjuguée, n(A⁻) augmente.')], [a.nA, 'La quantité a changé : la réaction consomme ou forme la quantité ajoutée.'], [nAH2, `C’est la quantité de ${cp.AH} ; on demande celle de ${cp.A}.`]],
    expl: <>n({cp.A}) = {nbF(a.nA, 1)} {acide ? '−' : '+'} {nbF(a.x, 1)} = <b>{nbF(nA2, 1)}{NB}mmol</b>.</> };
  const q2 = { id: 'j1', type: 'num', q: <>Calculez la quantité de <b>{cp.AH}</b> après la réaction (en mmol, 2 chiffres significatifs).</>, unite: 'mmol', vrai: nAH2, tolRel: 0.05, csMin: 2,
    aide: acide ? `L’acide se forme : n(${cp.AH}) final = n(${cp.AH}) initial + quantité ajoutée.` : `L’acide est consommé : n(${cp.AH}) final = n(${cp.AH}) initial − quantité ajoutée.`,
    pieges: [[acide ? a.nAH - a.x : a.nAH + a.x, 'Le sens est inversé : ' + (acide ? 'l’acide AH est formé, il augmente.' : 'l’acide AH est consommé, il diminue.')], [a.nAH, 'La quantité a changé : la réaction consomme ou forme la quantité ajoutée.'], [nA2, `C’est la quantité de ${cp.A} ; on demande celle de ${cp.AH}.`]],
    expl: <>n({cp.AH}) = {nbF(a.nAH, 1)} {acide ? '+' : '−'} {nbF(a.x, 1)} = <b>{nbF(nAH2, 1)}{NB}mmol</b>.</> };
  const q3 = { id: 'j2', type: 'num', q: <>Calculez le rapport <b>{avecIndices(`frac(n(${cp.A})|n(${cp.AH}))`)}</b> après l’ajout (sans unité, 2 chiffres significatifs), avec n({cp.A}) = {nbF(nA2, 1)}{NB}mmol et n({cp.AH}) = {nbF(nAH2, 1)}{NB}mmol.</>, unite: '', vrai: r2, tolRel: 0.05, csMin: 2,
    aide: 'Divisez la quantité de la base par celle de l’acide.',
    pieges: [[1 / r2, 'Le rapport est inversé : on demande la base sur l’acide.'], [nA2 - nAH2, 'Un rapport est un quotient, pas une différence.'], [a.nA / a.nAH, 'C’est le rapport avant l’ajout : utilisez les quantités après la réaction.']],
    expl: <>{avecIndices(`frac(${nbF(nA2, 1)}|${nbF(nAH2, 1)})`)} = <b>{rs}</b>.</> };
  const q4 = { id: 'j3', type: 'num', q: <>Avec pKa = {pK} et le rapport {rs}, calculez le <b>pH</b> du tampon après l’ajout (sans unité, 3 chiffres significatifs).</>, unite: '', vrai: pH2, tolRel: 0.01, csMin: 2,
    aide: 'pH = pKa + log(rapport) (touche log).',
    pieges: [[cp.pKa, 'Vous avez oublié le terme log : le pH n’est égal au pKa que si le rapport vaut 1.'], [cp.pKa - Math.log10(r2), 'Le signe est inversé : pH = pKa + log(rapport).'], [pH0, 'C’est le pH avant l’ajout : utilisez le rapport après la réaction.'], [cp.pKa + r2, 'Il faut le logarithme décimal du rapport, pas le rapport lui-même.']],
    expl: <>pH = {pK} + log({rs}) = <b>{nbF(pH2, 2)}</b>.</> };
  filtrer([q1, q2, q3, q4]);
  return { intro, questions: [q1, q2, q3, q4],
    retenir: ['Un acide fort consomme la base A⁻ et forme AH ; une base forte consomme AH et forme A⁻ (réactions quasi totales).', 'pH = pKa + log(frac(n(A⁻)|n(AH))) avec les quantités après la réaction.', 'Le tampon est épuisé si l’ajout dépasse la quantité du réactif.'] };
}
// ---------- Acides et bases (CDD) : pH d'un acide, pKa et prédominance, tampon ----------
const dist10 = v => v.every((x, i) => v.every((y, j) => i === j || Math.abs(x - y) > 0.1 * Math.max(Math.abs(x), Math.abs(y))));
const cs2 = x => PRE.arrondiCS(x, 2);
const sig2 = x => { const s = Number(x).toPrecision(2); return String(Number(s)).replace('.', ','); };
const CD_ACID_PKA = [3.8, 4.2, 4.7, 4.9];
function genAbAcfPh() {
  let pKa, C, pf, pw, tau;
  for (let k = 0; ; k++) {
    pKa = tire(CD_ACID_PKA); C = tire([0.01, 0.02, 0.05, 0.1]);
    pf = Math.round(-Math.log10(C) * 100) / 100; pw = Math.round(0.5 * (pKa - Math.log10(C)) * 100) / 100; tau = cs2(10 ** -pw / C);
    if (Math.abs(0.5 * (pKa - Math.log10(C)) - AB.pH({ C, pKas: [pKa] })) < 0.02 && dist10([pf, pw, tau, C]) || k > 500) break;
  }
  const Cs = nbF(C, 2), pK = nbF(pKa, 1);
  const intro = `Une solution d’acide fort HX et une solution d’acide faible AH (pKa = ${pK}) ont la même concentration C = ${Cs}${NB}mol/L, à 25${NB}°C.`;
  const q1 = { id: 'a0', type: 'num', q: <>Calculez le pH de la solution d’acide <b>fort</b> (2 chiffres significatifs).</>, unite: '', vrai: pf, tolRel: 0.012, csMin: 2,
    aide: 'Un acide fort réagit totalement : [H₃O⁺] = C, donc pH = −log C.',
    pieges: [[C, 'C’est la concentration : le pH est −log C.'], [pw, 'C’est la formule de l’acide faible ; ici l’acide est fort : pH = −log C.'], [10 ** -pf, 'C’est [H₃O⁺] ; on demande le pH.']],
    expl: <>pH = −log({Cs}) = <b>{nbF(pf, 2)}</b>.</> };
  const q2 = { id: 'a1', type: 'num', q: <>Calculez le pH de la solution d’acide <b>faible</b> (pKa = {pK}, 2 chiffres significatifs).</>, unite: '', vrai: pw, tolRel: 0.012, csMin: 2,
    aide: 'Acide faible : pH = ½ × (pKa − log C).',
    pieges: [[pf, 'C’est le pH de l’acide fort de même concentration ; l’acide faible est moins dissocié, son pH est plus élevé.'], [pKa - Math.log10(C), 'Il manque le facteur ½ : pH = ½ × (pKa − log C).'], [0.5 * (pKa + Math.log10(C)), 'Le signe de log C est inversé : pH = ½ × (pKa − log C).']],
    expl: <>pH = ½ × ({pK} − log {Cs}) = <b>{nbF(pw, 2)}</b>.</> };
  const q3 = { id: 'a2', type: 'num', q: <>Avec un pH de {nbF(pw, 2)}, calculez le taux d’avancement <b>τ</b> de la réaction de l’acide faible avec l’eau (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: tau, tolRel: 0.05, csMin: 2,
    aide: <>[H₃O⁺] = 10<sup>−pH</sup> puis τ = {avecIndices('frac([H₃O⁺]|C)')}.</>,
    pieges: [[10 ** -pw, 'C’est [H₃O⁺] ; il faut la diviser par C.'], [tau * 100, 'C’est un pourcentage : on demande τ sans unité (0,0xx).'], [C / 10 ** -pw, 'Le quotient est inversé : τ = [H₃O⁺] divisé par C.']],
    expl: <>[H₃O⁺] = 10<sup>−{nbF(pw, 2)}</sup> ; τ = {avecIndices(`frac(10^(−${nbF(pw, 2)})|${Cs})`)} = <b>{sig2(tau)}</b>.</> };
  filtrer([q1, q2, q3]);
  return { intro, questions: [q1, q2, q3], retenir: ['Acide fort : pH = −log C. Acide faible : pH = ½ × (pKa − log C).', 'À même concentration, l’acide faible a un pH plus élevé que l’acide fort.', 'τ = frac([H₃O⁺]|C) est petit pour un acide faible.'] };
}
function genAbAcfDilution() {
  let pKa, C0, f, pw0, pw1, C1;
  for (let k = 0; ; k++) {
    pKa = tire([4.2, 4.7, 4.9]); C0 = tire([0.1, 0.2, 0.05]); f = tire([10, 100]); C1 = C0 / f;
    pw0 = Math.round(0.5 * (pKa - Math.log10(C0)) * 100) / 100; pw1 = Math.round(0.5 * (pKa - Math.log10(C1)) * 100) / 100;
    if (C1 >= 0.0005 && Math.abs(0.5 * (pKa - Math.log10(C1)) - AB.pH({ C: C1, pKas: [pKa] })) < 0.05 && dist10([pw0, pw1, C1, C0]) || k > 500) break;
  }
  const C0s = nbF(C0, 2), C1s = sig2(C1), pK = nbF(pKa, 1);
  const intro = `Une solution d’acide faible AH (pKa = ${pK}) de concentration ${C0s}${NB}mol/L est diluée ${f} fois avec de l’eau distillée, à 25${NB}°C.`;
  const q1 = { id: 'd0', type: 'num', q: <>Calculez le pH de la solution <b>avant</b> dilution (2 chiffres significatifs).</>, unite: '', vrai: pw0, tolRel: 0.012, csMin: 2,
    aide: 'Acide faible : pH = ½ × (pKa − log C).',
    pieges: [[-Math.log10(C0), 'C’est la formule de l’acide fort : pH = −log C. Pour un acide faible : ½ × (pKa − log C).'], [pKa - Math.log10(C0), 'Il manque le facteur ½.']],
    expl: <>pH = ½ × ({pK} − log {C0s}) = <b>{nbF(pw0, 2)}</b>.</> };
  const q2 = { id: 'd1', type: 'num', q: <>Quelle est la concentration de la solution <b>diluée</b> (en mol/L, 2 chiffres significatifs) ?</>, unite: 'mol/L', vrai: C1, tolRel: 0.05, csMin: 2,
    aide: 'Dilution f fois : la concentration est divisée par f.',
    pieges: [[C0 * f, 'La concentration diminue quand on dilue : on divise par le facteur.'], [C0 - f, 'On divise la concentration par le facteur de dilution, on ne soustrait pas.']],
    expl: <>C′ = {C0s} / {f} = <b>{C1s}{NB}mol/L</b>.</> };
  const q3 = { id: 'd2', type: 'num', q: <>Calculez le pH de la solution diluée, de concentration {C1s}{NB}mol/L (2 chiffres significatifs).</>, unite: '', vrai: pw1, tolRel: 0.012, csMin: 2,
    aide: 'Même formule : pH = ½ × (pKa − log C′).',
    pieges: [[pw0 + Math.log10(f), 'C’est la règle d’un acide fort (pH augmente de log f). Pour un acide faible, il augmente de moitié.'], [pw0, 'Le pH change : la concentration a diminué, le pH augmente.']],
    expl: <>pH = ½ × ({pK} − log {C1s}) = <b>{nbF(pw1, 2)}</b> : il a augmenté de {nbF(pw1 - pw0, 2)}.</> };
  filtrer([q1, q2, q3]);
  return { intro, questions: [q1, q2, q3], retenir: ['Diluer f fois divise la concentration par f.', 'Acide fort : le pH augmente de log f. Acide faible : de ½ log f seulement.', 'Plus on dilue un acide faible, plus il est dissocié (τ augmente).'] };
}
function genAbPredRapport() {
  let pKa, pH, C, r, cA, cAH;
  for (let k = 0; ; k++) {
    pKa = tire([3.8, 4.2, 4.9, 7.5]); pH = Math.round((pKa + tire([-1.4, -1, -0.6, 0.6, 1, 1.4])) * 10) / 10; C = tire([0.01, 0.02, 0.05, 0.1]);
    r = cs2(10 ** (pH - pKa)); cA = cs2(C * r / (1 + r)); cAH = cs2(C / (1 + r));
    if (dist10([r, cA, cAH]) || k > 500) break;
  }
  const rs = sig2(r), pK = nbF(pKa, 1), pHs = nbF(pH, 1), Cs = nbF(C, 2);
  const intro = `Une solution de pH ${pHs} contient le couple AH / A⁻ (pKa = ${pK}) à la concentration totale [AH] + [A⁻] = ${Cs}${NB}mol/L, à 25${NB}°C.`;
  const q1 = { id: 'r0', type: 'num', q: <>Calculez le rapport <b>{avecIndices('frac([A⁻]|[AH])')}</b> (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: r, tolRel: 0.05, csMin: 2,
    aide: 'Rapport = 10^(pH − pKa) (touche 10ˣ).',
    pieges: [[pH - pKa, 'C’est pH − pKa, le logarithme du rapport : il faut prendre 10 puissance cette valeur.'], [1 / r, 'Le rapport est inversé : on demande la base sur l’acide.']],
    expl: <>Rapport = 10<sup>{pHs} − {pK}</sup> = 10<sup>{nbF(pH - pKa, 1)}</sup> = <b>{rs}</b>.</> };
  const q2 = { id: 'r1', type: 'num', q: <>Avec un rapport de {rs} et [AH] + [A⁻] = {Cs}{NB}mol/L, calculez la concentration de <b>A⁻</b> (en mol/L, 2 chiffres significatifs).</>, unite: 'mol/L', vrai: cA, tolRel: 0.05, csMin: 2,
    aide: '[A⁻] = r × [AH] et [A⁻] + [AH] = C, donc [A⁻] = frac(C × r|1 + r).',
    pieges: [[cAH, 'C’est la concentration de AH ; on demande celle de A⁻.'], [C * r, 'C × r dépasse la concentration totale : utilisez frac(C × r|1 + r).']],
    expl: <>[A⁻] = {avecIndices(`frac(${Cs} × ${rs}|1 + ${rs})`)} = <b>{sig2(cA)}{NB}mol/L</b>.</> };
  const q3 = { id: 'r2', type: 'num', q: <>Calculez la concentration de <b>AH</b> (en mol/L, 2 chiffres significatifs).</>, unite: 'mol/L', vrai: cAH, tolRel: 0.05, csMin: 2,
    aide: '[AH] = C − [A⁻], ou [AH] = frac(C|1 + r).',
    pieges: [[cA, 'C’est la concentration de A⁻ ; on demande celle de AH.'], [C / r, 'Utilisez [AH] = frac(C|1 + r).']],
    expl: <>[AH] = {avecIndices(`frac(${Cs}|1 + ${rs})`)} = <b>{sig2(cAH)}{NB}mol/L</b>.</> };
  filtrer([q1, q2, q3]);
  return { intro, questions: [q1, q2, q3], retenir: ['Rapport frac([A⁻]|[AH]) = 10^(pH − pKa).', 'Si pH > pKa, A⁻ prédomine ; si pH < pKa, AH prédomine ; si pH = pKa, les deux sont égales.', '[AH] + [A⁻] = C : la matière se conserve.'] };
}
function genAbPredPka() {
  let pKa, r, pH, lr;
  for (let k = 0; ; k++) {
    pKa = tire([3.8, 4.2, 4.9, 7.5, 9.2]); r = tire([0.1, 0.25, 0.5, 2, 4, 10]); pH = Math.round((pKa + Math.log10(r)) * 100) / 100; lr = Math.round(Math.log10(r) * 100) / 100;
    const pk2 = pH - Math.log10(r);
    if (dist10([lr, pk2, pk2 + 2]) || k > 500) break;
  }
  const pk = pH - Math.log10(r), pHs = nbF(pH, 2), rs = sig2(r);
  const intro = `Dans une solution de pH ${pHs}, on mesure le rapport ${rs} entre la concentration de A⁻ et celle de AH (couple AH / A⁻, à 25${NB}°C).`;
  const q1 = { id: 'p0', type: 'num', q: <>Calculez <b>log</b> du rapport {rs} (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: lr, tolRel: 0.05, csMin: 2,
    aide: 'Touche log de la calculatrice : log(r).',
    pieges: [[r, 'C’est le rapport lui-même ; il faut en prendre le logarithme.'], [-lr, 'Le signe est inversé : log d’un nombre inférieur à 1 est négatif.']],
    expl: <>log({rs}) = <b>{nbF(lr, 2)}</b>.</> };
  const q2 = { id: 'p1', type: 'num', q: <>En déduire le <b>pKa</b> du couple, sachant que pH = pKa + log(rapport) (2 chiffres significatifs).</>, unite: '', vrai: pk, tolRel: 0.012, csMin: 2,
    aide: 'pKa = pH − log(rapport).',
    pieges: [[pH + Math.log10(r), 'Le signe est inversé : pKa = pH − log(rapport).'], [pH - r, 'On soustrait le logarithme du rapport, pas le rapport lui-même.']],
    expl: <>pKa = {pHs} − ({nbF(lr, 2)}) = <b>{nbF(pk, 2)}</b>.</> };
  const q3 = { id: 'p2', type: 'num', q: <>À quel pH le rapport {avecIndices('frac([A⁻]|[AH])')} serait-il égal à 100 ? (2 chiffres significatifs)</>, unite: '', vrai: pk + 2, tolRel: 0.012, csMin: 2,
    aide: 'pH = pKa + log 100 = pKa + 2.',
    pieges: [[pk, 'À pH = pKa le rapport vaut 1, pas 100.'], [pk - 2, 'Le signe est inversé : A⁻ prédomine à pH supérieur au pKa.']],
    expl: <>pH = {nbF(pk, 2)} + log 100 = <b>{nbF(pk + 2, 2)}</b>.</> };
  filtrer([q1, q2, q3]);
  return { intro, questions: [q1, q2, q3], retenir: ['pKa = pH − log frac([A⁻]|[AH]).', 'À pH = pKa, les deux formes sont en quantités égales.', 'Un écart d’une unité de pH change le rapport d’un facteur 10.'] };
}
function genAbTampMelange() {
  let pKa, C1, V1, C2, V2, nAH, nA, r;
  for (let k = 0; ; k++) {
    pKa = tire([4.2, 4.9, 7.5]); C1 = tire([0.1, 0.2]); V1 = tire([20, 40, 50]); C2 = tire([0.1, 0.2]); V2 = tire([20, 30, 60]);
    nAH = C1 * V1; nA = C2 * V2; r = cs2(nA / nAH);
    if ((r > 0.2 && r < 5 && Math.abs(r - 1) > 0.1 && dist10([nAH, nA, r, pKa + Math.log10(r)])) || k > 500) break;
  }
  const pK = nbF(pKa, 1), pH = pKa + Math.log10(r), rs = sig2(r);
  const intro = `On mélange ${V1}${NB}mL d’une solution de AH à ${nbF(C1, 2)}${NB}mol/L et ${V2}${NB}mL d’une solution de A⁻ (sel de sodium) à ${nbF(C2, 2)}${NB}mol/L. Le pKa du couple AH / A⁻ vaut ${pK} (25${NB}°C).`;
  const q1 = { id: 'm0', type: 'num', q: <>Quelle quantité de matière de <b>AH</b> introduit-on ? (en mmol, 2 chiffres significatifs ; 1{NB}mol/L × 1{NB}mL = 1{NB}mmol)</>, unite: 'mmol', vrai: nAH, tolRel: 0.05, csMin: 2,
    aide: 'n = C × V : avec C en mol/L et V en mL, n est en mmol.',
    pieges: [[nA, 'C’est la quantité de A⁻ ; on demande celle de AH.'], [nAH / 1000, 'C en mol/L × V en mL donne directement des mmol : pas de division par 1 000.']],
    expl: <>n(AH) = {nbF(C1, 2)} × {V1} = <b>{sig2(nAH)}{NB}mmol</b>.</> };
  const q2 = { id: 'm1', type: 'num', q: <>Calculez le rapport <b>{avecIndices('frac(n(A⁻)|n(AH))')}</b> du mélange (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: r, tolRel: 0.05, csMin: 2,
    aide: 'n(A⁻) = C₂ × V₂ ; rapport = n(A⁻) divisé par n(AH).',
    pieges: [[1 / r, 'Le rapport est inversé : on demande la base sur l’acide.'], [nA - nAH, 'Un rapport est un quotient, pas une différence.']],
    expl: <>n(A⁻) = {sig2(nA)} mmol ; rapport = {avecIndices(`frac(${sig2(nA)}|${sig2(nAH)})`)} = <b>{rs}</b>.</> };
  const q3 = { id: 'm2', type: 'num', q: <>Avec pKa = {pK} et un rapport de {rs}, calculez le <b>pH</b> du mélange (2 chiffres significatifs).</>, unite: '', vrai: pH, tolRel: 0.012, csMin: 2,
    aide: 'pH = pKa + log(rapport).',
    pieges: [[pKa, 'Il manque le terme log : le pH n’est égal au pKa que si le rapport vaut 1.'], [pKa - Math.log10(r), 'Le signe est inversé : pH = pKa + log(rapport).']],
    expl: <>pH = {pK} + log({rs}) = <b>{nbF(pH, 2)}</b>.</> };
  filtrer([q1, q2, q3]);
  return { intro, questions: [q1, q2, q3], retenir: ['Les quantités de matière se calculent par n = C × V.', 'pH = pKa + log frac(n(A⁻)|n(AH)).', 'Le mélange est un tampon si le rapport reste entre 0,1 et 10.'] };
}
function genAbTampAjout() {
  let pKa, nAH, nA, x, acide, nA2, nAH2, r2;
  for (let k = 0; ; k++) {
    pKa = tire([4.2, 4.9, 7.5]); nAH = tire([4, 5, 6, 8]); nA = tire([4, 6, 8, 10]); x = tire([0.5, 1, 1.5, 2]); acide = tire([true, false]);
    nA2 = acide ? nA - x : nA + x; nAH2 = acide ? nAH + x : nAH - x; r2 = cs2(nA2 / nAH2);
    if ((Math.abs(r2 - 1) > 0.1 && dist10([nA2, nAH2, r2, pKa + Math.log10(r2), nA, nAH])) || k > 800) break;
  }
  const pK = nbF(pKa, 1), pH = pKa + Math.log10(r2), pH0 = pKa + Math.log10(nA / nAH), rs = sig2(r2), ion = acide ? 'H₃O⁺' : 'HO⁻';
  const intro = `Un tampon du couple AH / A⁻ (pKa = ${pK}, à 25${NB}°C) contient ${nbF(nA, 1)}${NB}mmol de A⁻ et ${nbF(nAH, 1)}${NB}mmol de AH. On y ajoute ${nbF(x, 1)}${NB}mmol d’ions ${ion} (${acide ? 'acide fort' : 'base forte'}), qui réagissent totalement.`;
  const q1 = { id: 'e0', type: 'num', q: <>Calculez la quantité de <b>A⁻</b> après la réaction (en mmol, 2 chiffres significatifs).</>, unite: 'mmol', vrai: nA2, tolRel: 0.05, csMin: 2,
    aide: acide ? 'H₃O⁺ consomme A⁻ : n(A⁻) final = n(A⁻) − quantité ajoutée.' : 'HO⁻ forme A⁻ à partir de AH : n(A⁻) final = n(A⁻) + quantité ajoutée.',
    pieges: [[acide ? nA + x : nA - x, 'Le sens est inversé : ' + (acide ? 'un acide consomme la base A⁻.' : 'une base forme A⁻.')], [nA, 'La quantité de A⁻ a changé.']],
    expl: <>n(A⁻) = {nbF(nA, 1)} {acide ? '−' : '+'} {nbF(x, 1)} = <b>{nbF(nA2, 1)}{NB}mmol</b>.</> };
  const q2 = { id: 'e1', type: 'num', q: <>Calculez la quantité de <b>AH</b> après la réaction (en mmol, 2 chiffres significatifs).</>, unite: 'mmol', vrai: nAH2, tolRel: 0.05, csMin: 2,
    aide: acide ? 'AH se forme : n(AH) final = n(AH) + quantité ajoutée.' : 'AH est consommé : n(AH) final = n(AH) − quantité ajoutée.',
    pieges: [[acide ? nAH - x : nAH + x, 'Le sens est inversé : ' + (acide ? 'AH est formé, il augmente.' : 'AH est consommé, il diminue.')], [nAH, 'La quantité de AH a changé.']],
    expl: <>n(AH) = {nbF(nAH, 1)} {acide ? '+' : '−'} {nbF(x, 1)} = <b>{nbF(nAH2, 1)}{NB}mmol</b>.</> };
  const q3 = { id: 'e2', type: 'num', q: <>Avec n(A⁻) = {nbF(nA2, 1)} mmol et n(AH) = {nbF(nAH2, 1)} mmol (rapport {rs}), calculez le <b>pH</b> après l’ajout (2 chiffres significatifs).</>, unite: '', vrai: pH, tolRel: 0.012, csMin: 2,
    aide: 'pH = pKa + log(rapport) avec le rapport après l’ajout.',
    pieges: [[pH0, 'C’est le pH avant l’ajout : utilisez les quantités après la réaction.'], [pKa - Math.log10(r2), 'Le signe est inversé : pH = pKa + log(rapport).']],
    expl: <>pH = {pK} + log({rs}) = <b>{nbF(pH, 2)}</b> (avant l’ajout : {nbF(pH0, 2)}).</> };
  filtrer([q1, q2, q3]);
  return { intro, questions: [q1, q2, q3], retenir: ['Un acide fort consomme A⁻ et forme AH ; une base forte consomme AH et forme A⁻.', 'Le pH varie peu : seul le rapport des quantités change un peu.', 'Un tampon est limité par la quantité de A⁻ (pour un acide) ou de AH (pour une base).'] };
}
// ---------- CO₂ dissous (TSTL, PCM) ----------
const fmv = x => (x < 0.001 || x >= 1e5) ? sciF(x) : String(Number(Number(x).toPrecision(2))).replace('.', ',');
function tirageCo2Eau() {
  for (let k = 0; k < 500; k++) {
    const t = CO2.tirageEau(), c2 = PRE.arrondiCS(t.c, 2), h2 = PRE.arrondiCS(Math.sqrt(CO2.KA1 * c2 * 1e-3), 2), pH2 = -Math.log10(h2), v = [c2, h2, pH2, pH2 - 1];
    if (v.every((x, i) => v.every((y, j) => i === j || Math.abs(x - y) > 0.1 * Math.max(Math.abs(x), Math.abs(y))))) return { t, c2, h2, pH2 };
  }
  throw new Error('tirage co2dis-henry impossible');
}
function genCo2Eau() {
  const { t, c2, h2, pH2 } = tirageCo2Eau(), fP = t.P < 1 ? nbF(t.P, 1) : nbF(t.P, 0), as = nbF(t.a, 2), cs = fmv(c2), hs = sciF(h2);
  const intro = `Une eau pure est en équilibre, à ${t.T}${NB}°C, avec un gaz dont la pression partielle en CO₂ vaut ${fP}${NB}kPa. Le coefficient de solubilité du CO₂ vaut a = ${as}${NB}mmol·L⁻¹·kPa⁻¹ ; le couple CO₂,H₂O / HCO₃⁻ a pour pKa1 = 6,35, soit Ka1 = 4,5${NB}×${NB}10⁻⁷.`;
  const q1 = { id: 'c0', type: 'num', q: <>Avec la loi de Henry [CO₂] = a × P(CO₂), calculez <b>[CO₂]</b> (en mmol/L, 2 chiffres significatifs).</>, unite: 'mmol/L', vrai: c2, tolRel: 0.05, csMin: 2,
    aide: '[CO₂] = a × P(CO₂), avec a en mmol·L⁻¹·kPa⁻¹ et P en kPa : le résultat est en mmol/L.',
    pieges: [[t.P / t.a, 'Il faut multiplier a par P(CO₂), pas les diviser.'], [c2 * 1e-3, 'L’unité demandée est le mmol/L : ne convertissez pas en mol/L ici.'], [t.a, 'C’est la valeur de a ; [CO₂] = a × P(CO₂).']],
    expl: <>[CO₂] = {as} × {fP} = <b>{cs}{NB}mmol/L</b>.</> };
  const q2 = { id: 'c1', type: 'num', q: <>Avec [CO₂] = {cs}{NB}mmol/L = {fmv(c2 * 1e-3)}{NB}mol/L, [H₃O⁺] = [HCO₃⁻] et Ka1 = {avecIndices('frac([H₃O⁺]²|[CO₂])')}, calculez <b>[H₃O⁺]</b> (en mol/L, 2 chiffres significatifs).</>, unite: 'mol/L', vrai: h2, tolRel: 0.05, csMin: 2,
    aide: '[H₃O⁺]² = Ka1 × [CO₂], donc [H₃O⁺] = racine carrée de (Ka1 × [CO₂]), avec [CO₂] en mol/L.',
    pieges: [[CO2.KA1 * c2 * 1e-3, 'C’est [H₃O⁺]² : il faut prendre la racine carrée.'], [Math.sqrt(CO2.KA1 * c2), 'La concentration doit être en mol/L : divisez [CO₂] en mmol/L par 1 000 avant de calculer.'], [c2 * 1e-3, 'C’est [CO₂] en mol/L ; on demande [H₃O⁺] = racine carrée de (Ka1 × [CO₂]).']],
    expl: <>[H₃O⁺] = racine carrée de (4,5 × 10⁻⁷ × {fmv(c2 * 1e-3)}) = <b>{hs}{NB}mol/L</b>.</> };
  const q3 = { id: 'c2', type: 'num', q: <>Avec [H₃O⁺] = {hs}{NB}mol/L, calculez le <b>pH</b> de l’eau (2 chiffres significatifs au moins, sans unité).</>, unite: '', vrai: pH2, tolRel: 0.02, csMin: 2,
    aide: 'pH = −log([H₃O⁺]) (touche log, avec [H₃O⁺] en mol/L).',
    pieges: [[h2, 'C’est la concentration [H₃O⁺] : le pH est son opposé du logarithme décimal.'], [Math.log10(h2), 'Le signe est inversé : pH = −log([H₃O⁺]).'], [t.P / 100, 'Le pH se calcule à partir de [H₃O⁺] par −log, pas à partir de la pression.']],
    expl: <>pH = −log({hs}) = <b>{nbF(pH2, 2)}</b>.</> };
  const q4 = { id: 'c3', type: 'num', q: <>La pression partielle du CO₂ est maintenant <b>multipliée par 100</b>. Sachant que pH = ½ (pKa1 − log [CO₂]), calculez le nouveau <b>pH</b> (sans unité).</>, unite: '', vrai: pH2 - 1, tolRel: 0.02, csMin: 2,
    aide: '[CO₂] est multipliée par 100 : log [CO₂] augmente de 2, donc le pH diminue de ½ × 2 = 1 unité.',
    pieges: [[pH2 - 2, 'Il faut le facteur ½ : le pH ne baisse que de 1 unité, pas de 2.'], [pH2 - 0.5, 'Une baisse de 0,5 unité correspond à une pression multipliée par 10, pas par 100.'], [pH2, 'C’est le pH avant le changement de pression : il diminue de 1 unité.']],
    expl: <>log(100) = 2, donc le pH baisse de ½ × 2 = 1 : pH = {nbF(pH2, 2)} − 1 = <b>{nbF(pH2 - 1, 2)}</b>.</> };
  filtrer([q1, q2, q3, q4]);
  return { intro, questions: [q1, q2, q3, q4],
    retenir: ['Loi de Henry : [CO₂] = a × P(CO₂).', 'Avec [H₃O⁺] = [HCO₃⁻] : [H₃O⁺] = racine carrée de (Ka1 × [CO₂]) et pH = ½ (pKa1 − log [CO₂]).', 'Pression × 100 : pH − 1 unité.'] };
}
function tirageCo2Milieu() {
  for (let k = 0; k < 500; k++) {
    const t = CO2.tirageMilieu(), c2 = PRE.arrondiCS(t.c, 2), r1 = PRE.arrondiCS(CO2.rapportHCO3(t.pH), 2), h2 = PRE.arrondiCS(c2 * r1, 2), co2 = PRE.arrondiCS(h2 * 10 ** (t.pH - CO2.PKA2), 2), s2 = PRE.arrondiCS((c2 + h2 + co2) / c2, 2), v = [c2, h2, co2, s2];
    if (v.every((x, i) => v.every((y, j) => i === j || Math.abs(x - y) > 0.1 * Math.max(x, y)))) return { t, c2, r1, h2, co2, s2 };
  }
  throw new Error('tirage co2dis-milieu impossible');
}
function genCo2Milieu() {
  const { t, c2, r1, h2, co2, s2 } = tirageCo2Milieu(), fP = t.P < 1 ? nbF(t.P, 2) : nbF(t.P, 0), as = nbF(t.a, 2), pHs = nbF(t.pH, 1), cs = fmv(c2), hs = fmv(h2), os = fmv(co2);
  const intro = `Un milieu dont le pH est maintenu à ${pHs} est en équilibre, à ${t.T}${NB}°C, avec un gaz dont la pression partielle en CO₂ vaut ${fP}${NB}kPa. On donne a = ${as}${NB}mmol·L⁻¹·kPa⁻¹, pKa1 = 6,35 (CO₂,H₂O / HCO₃⁻) et pKa2 = 10,3 (HCO₃⁻ / CO₃²⁻).`;
  const q1 = { id: 'm0', type: 'num', q: <>Calculez <b>[CO₂]</b> avec la loi de Henry (en mmol/L, 2 chiffres significatifs).</>, unite: 'mmol/L', vrai: c2, tolRel: 0.05, csMin: 2,
    aide: '[CO₂] = a × P(CO₂), résultat en mmol/L.',
    pieges: [[t.P / t.a, 'Il faut multiplier a par P(CO₂), pas les diviser.'], [t.a, 'C’est la valeur de a ; [CO₂] = a × P(CO₂).']],
    expl: <>[CO₂] = {as} × {fP} = <b>{cs}{NB}mmol/L</b>.</> };
  const q2 = { id: 'm1', type: 'num', q: <>Avec [CO₂] = {cs}{NB}mmol/L, calculez <b>[HCO₃⁻]</b> = [CO₂] × 10<sup>pH − pKa1</sup> (en mmol/L, 2 chiffres significatifs).</>, unite: 'mmol/L', vrai: h2, tolRel: 0.05, csMin: 2,
    aide: 'Rapport base sur acide = 10 puissance (pH − pKa1) ; multipliez-le par [CO₂].',
    pieges: [[c2 / r1, 'Le rapport est inversé : à ce pH supérieur à pKa1, HCO₃⁻ est plus concentré que CO₂.'], [r1, 'C’est le rapport [HCO₃⁻] sur [CO₂] : il faut encore le multiplier par [CO₂].'], [c2 * 10 ** (t.pH - CO2.PKA2), 'Vous avez utilisé pKa2 : pour HCO₃⁻, c’est pKa1 du couple CO₂,H₂O / HCO₃⁻.']],
    expl: <>[HCO₃⁻] = {cs} × 10<sup>{pHs} − 6,35</sup> = {cs} × {fmv(r1)} = <b>{hs}{NB}mmol/L</b>.</> };
  const q3 = { id: 'm2', type: 'num', q: <>Avec [HCO₃⁻] = {hs}{NB}mmol/L, calculez <b>[CO₃²⁻]</b> = [HCO₃⁻] × 10<sup>pH − pKa2</sup> (en mmol/L, 2 chiffres significatifs).</>, unite: 'mmol/L', vrai: co2, tolRel: 0.05, csMin: 2,
    aide: 'Pour le couple HCO₃⁻ / CO₃²⁻ : [CO₃²⁻] sur [HCO₃⁻] = 10 puissance (pH − pKa2), avec pKa2 = 10,3.',
    pieges: [[h2 / 10 ** (t.pH - CO2.PKA2), 'Le rapport est inversé : ici pH < pKa2, donc CO₃²⁻ est moins concentré que HCO₃⁻.'], [h2 * r1, 'Vous avez utilisé pKa1 : pour CO₃²⁻ c’est pKa2 = 10,3.'], [10 ** (t.pH - CO2.PKA2), 'C’est le rapport [CO₃²⁻] sur [HCO₃⁻] : il faut encore le multiplier par [HCO₃⁻].']],
    expl: <>[CO₃²⁻] = {hs} × 10<sup>{pHs} − 10,3</sup> = <b>{os}{NB}mmol/L</b>.</> };
  const q4 = { id: 'm3', type: 'num', q: <>Avec [CO₂] = {cs}, [HCO₃⁻] = {hs} et [CO₃²⁻] = {os}{NB}mmol/L, calculez le rapport <b>{avecIndices('frac(C_T|[CO₂])')}</b> où C<sub>T</sub> = [CO₂] + [HCO₃⁻] + [CO₃²⁻] (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: s2, tolRel: 0.05, csMin: 2,
    aide: 'Additionnez les trois concentrations pour obtenir C_T, puis divisez par [CO₂].',
    pieges: [[c2 + h2 + co2, 'C’est C_T en mmol/L : on demande le rapport C_T divisé par [CO₂].'], [c2 / (c2 + h2 + co2), 'Le rapport est inversé : C_T est plus grand que [CO₂].'], [h2 / c2, 'Il manque [CO₂] et [CO₃²⁻] dans C_T : C_T est la somme des trois espèces.']],
    expl: <>C<sub>T</sub> = {cs} + {hs} + {os} = {fmv(c2 + h2 + co2)}{NB}mmol/L ; {avecIndices(`frac(${fmv(c2 + h2 + co2)}|${cs})`)} = <b>{fmv(s2)}</b>.</> };
  filtrer([q1, q2, q3, q4]);
  return { intro, questions: [q1, q2, q3, q4],
    retenir: ['[CO₂] = a × P(CO₂) ; frac([HCO₃⁻]|[CO₂]) = 10^(pH − pKa1) ; frac([CO₃²⁻]|[HCO₃⁻]) = 10^(pH − pKa2).', 'C_T = [CO₂] + [HCO₃⁻] + [CO₃²⁻] augmente avec le pH du milieu.'] };
}
// ---------- Extraction acide-base (TSTL, PCM) ----------
function tirageExtracPartage() {
  for (let k = 0; k < 800; k++) {
    const t = EXT.tirageExtraction(), e = t.e, acide = e.type === 'acide', x = acide ? t.pH - e.pKa : e.pKa - t.pH;
    const r1 = PRE.arrondiCS(10 ** x, 2), a2 = PRE.arrondiCS(1 / (1 + r1), 2), D2 = PRE.arrondiCS(e.K * a2, 2), E2 = PRE.arrondiCS(100 * EXT.fractionExtraite(D2, t.r), 2), v = [r1, a2, D2, E2];
    if (v.every((y, i) => v.every((z, j) => i === j || Math.abs(y - z) > 0.1 * Math.max(y, z)))) return { t, acide, x, r1, a2, D2, E2 };
  }
  throw new Error('tirage extrac-partage impossible');
}
function genExtracPartage() {
  const { t, acide, x, r1, a2, D2, E2 } = tirageExtracPartage(), e = t.e, pHs = nbF(t.pH, 1), pKs = nbF(e.pKa, 1), rs = t.r === 1 ? 'le même volume' : t.r === 2 ? 'un volume double' : 'la moitié du volume', nI = acide ? 'A⁻' : 'BH⁺', nN = acide ? 'HA' : 'B';
  const intro = `${acide ? 'L’acide' : 'La base'} ${e.nom} (couple ${acide ? 'HA / A⁻' : 'BH⁺ / B'}, pKa = ${pKs}) est dans une phase aqueuse dont le pH est maintenu à ${pHs}. On l’extrait avec ${rs} de solvant organique non miscible. Le coefficient de partage de sa forme neutre ${nN} vaut K = ${e.K}.`;
  const q1 = { id: 'p0', type: 'num', q: <>Calculez le rapport <b>{avecIndices(`frac([${nI}]|[${nN}])`)}</b> = 10<sup>{acide ? `pH − pKa` : `pKa − pH`}</sup> (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: r1, tolRel: 0.05, csMin: 2,
    aide: acide ? 'Pour un acide, rapport ion sur neutre = 10 puissance (pH − pKa).' : 'Pour une base, rapport ion BH⁺ sur neutre B = 10 puissance (pKa − pH).',
    pieges: [[1 / r1, 'Le rapport est inversé : on demande l’ion sur la forme neutre.'], [x, `C’est ${acide ? 'pH − pKa' : 'pKa − pH'}, le logarithme du rapport : il faut calculer 10 puissance cette valeur.`], [r1 * 10, 'Il faut prendre 10 puissance l’écart exact, sans multiplier le résultat par 10.']],
    expl: <>{acide ? 'pH − pKa' : 'pKa − pH'} = {nbF(x, 1)}, donc le rapport vaut 10<sup>{nbF(x, 1)}</sup> = <b>{r1 >= 10 ? nbF(r1, 0) : nbF(r1, r1 >= 1 ? 1 : 2)}</b>.</> };
  const fr = v => (v >= 10 ? nbF(v, 0) : v >= 1 ? nbF(v, 1) : nbF(v, v < 0.1 ? 3 : 2));
  const q2 = { id: 'p1', type: 'num', q: <>Avec un rapport {avecIndices(`frac([${nI}]|[${nN}])`)} de {fr(r1)}, calculez la fraction <b>α</b> de forme neutre {nN} = 1 divisé par (1 + rapport) (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: a2, tolRel: 0.05, csMin: 2,
    aide: 'α = 1 divisé par (1 + rapport ion sur neutre).',
    pieges: [[1 - a2, `C’est la part de la forme ionique ${nI}, pas celle de ${nN}.`], [1 / r1, 'Il manque « 1 + » : α = 1 divisé par (1 + rapport).'], [r1 / (1 + r1), `C’est la part de la forme ionique ${nI} : α est celle de la forme neutre.`]],
    expl: <>α = 1 divisé par (1 + {fr(r1)}) = <b>{nbF(a2, a2 < 0.1 ? 3 : 2)}</b>.</> };
  const q3 = { id: 'p2', type: 'num', q: <>Avec α = {nbF(a2, a2 < 0.1 ? 3 : 2)} et K = {e.K}, calculez le rapport de distribution <b>D = K × α</b> (sans unité, 2 chiffres significatifs).</>, unite: '', vrai: D2, tolRel: 0.05, csMin: 2,
    aide: 'D = K × α : multipliez le coefficient de partage par la fraction de forme neutre.',
    pieges: [[e.K / a2, 'Il faut multiplier K par α, pas les diviser.'], [e.K - a2, 'Il faut multiplier K par α, pas les soustraire.'], [a2, 'C’est α seule : D = K × α.']],
    expl: <>D = {e.K} × {nbF(a2, a2 < 0.1 ? 3 : 2)} = <b>{fr(D2)}</b>.</> };
  const q4 = { id: 'p3', type: 'num', q: <>Avec D = {fr(D2)} et {rs} de solvant (r = {nbF(t.r, 1)}), calculez le <b>pourcentage extrait</b> en un contact : 100 × D × r divisé par (1 + D × r) (en %, 2 chiffres significatifs).</>, unite: '%', vrai: E2, tolRel: 0.05, csMin: 2,
    aide: 'Fraction extraite = D × r divisé par (1 + D × r), à multiplier par 100.',
    pieges: [[E2 / 100, 'C’est la fraction ; le pourcentage est cette valeur multipliée par 100.'], [100 - E2, 'C’est la part qui reste dans l’eau : on demande la part extraite.'], [100 * D2 * t.r / (D2 * t.r - 1), 'Le dénominateur est 1 + D × r, pas D × r − 1.']],
    expl: <>E = {fr(D2)} × {nbF(t.r, 1)} divisé par (1 + {fr(D2)} × {nbF(t.r, 1)}) = <b>{fr(E2)}{NB}%</b>.</> };
  filtrer([q1, q2, q3, q4]);
  return { intro, questions: [q1, q2, q3, q4],
    retenir: ['Rapport ion sur neutre : 10^(pH − pKa) pour un acide, 10^(pKa − pH) pour une base.', 'α = 1 divisé par (1 + rapport) ; D = K × α.', 'Part extraite en un contact (en %) = 100 × D × r divisé par (1 + D × r).'] };
}
function tirageExtracPasses() {
  const tire = t => t[Math.floor(Math.random() * t.length)];
  for (let k = 0; k < 800; k++) {
    const D = tire([3, 4, 5, 6, 8, 10, 12, 15, 20]), r = tire([0.5, 1, 2]), n = tire([2, 3]), Dr = D * r, f = 1 / (1 + Dr);
    if (Dr < 2.5) continue;
    const u = PRE.arrondiCS(100 * f, 2), rn = PRE.arrondiCS(100 * f ** n, 2), tot = PRE.arrondiCS(100 - rn, 3), nmin = Math.ceil(Math.log(0.01) / Math.log(f) - 1e-9), v = [u, rn, tot, nmin];
    if (v.every((y, i) => v.every((z, j) => i === j || Math.abs(y - z) > 0.1 * Math.max(y, z))) && nmin >= 2 && nmin <= 6 && nmin !== n) return { D, r, n, f, u, rn, tot, nmin };
  }
  throw new Error('tirage extrac-passes impossible');
}
function genExtracPasses() {
  const { D, r, n, f, u, rn, tot, nmin } = tirageExtracPasses(), rs = r === 1 ? 'le même volume' : r === 2 ? 'un volume double' : 'la moitié du volume';
  const fr = v => (v >= 10 ? nbF(v, 0) : v >= 1 ? nbF(v, 1) : nbF(v, v < 0.1 ? 3 : 2));
  const intro = `À un pH donné, le rapport de distribution d’une espèce acide ou basique entre le solvant organique et l’eau vaut D = ${D}. À chaque contact, on utilise du solvant organique neuf, de ${rs} de celui de l’eau (r = ${nbF(r, 1)}), et le pH de l’eau ne change pas.`;
  const q1 = { id: 'e0', type: 'num', q: <>Calculez le pourcentage restant dans l’eau après <b>un</b> contact : 100 divisé par (1 + D × r) (en %, 2 chiffres significatifs).</>, unite: '%', vrai: u, tolRel: 0.05, csMin: 2,
    aide: 'Reste après un contact = 1 divisé par (1 + D × r), à multiplier par 100.',
    pieges: [[100 - u, 'C’est la part extraite : on demande ce qui reste dans l’eau.'], [100 / (1 + D), 'Il faut tenir compte du rapport de volumes : 1 + D × r au dénominateur.'], [100 * D * r / (1 + D * r), 'C’est la part extraite : on demande la part restante.']],
    expl: <>Reste = 100 divisé par (1 + {D} × {nbF(r, 1)}) = 100 divisé par {fr(1 + D * r)} = <b>{fr(u)}{NB}%</b>.</> };
  const q2 = { id: 'e1', type: 'num', q: <>On recommence avec du solvant neuf, au total <b>{n}</b> contacts. Calculez le pourcentage restant dans l’eau : 100 × (1 divisé par (1 + D × r)) puissance {n} (en %, 2 chiffres significatifs).</>, unite: '%', vrai: rn, tolRel: 0.1, csMin: 2,
    aide: `Élevez la fraction 1 divisé par (1 + D × r) = ${nbF(f, 3)} à la puissance ${n}, puis multipliez par 100.`,
    pieges: [[u * n, 'Le reste est multiplié à chaque contact, pas additionné : il faut élever la fraction à la puissance n.'], [u, 'C’est le reste après un seul contact : élevez la fraction à la puissance n.'], [100 * f ** (n - 1), `C’est le reste après ${n - 1} contact${n - 1 > 1 ? 's' : ''} : il faut ${n} contacts.`]],
    expl: <>Reste = 100 × {nbF(f, 3)}<sup>{n}</sup> = <b>{fr(rn)}{NB}%</b>.</> };
  const q3 = { id: 'e2', type: 'num', q: <>Après ces {n} contacts, quel pourcentage a été <b>extrait au total</b> ? (en %, 3 chiffres significatifs)</>, unite: '%', vrai: tot, tolRel: 0.05, csMin: 2,
    aide: 'Part extraite = 100 % moins la part restante dans l’eau.',
    pieges: [[rn, 'C’est la part qui reste dans l’eau : on demande la part extraite.'], [100 - u, `C’est la part extraite après un seul contact, pas après ${n}.`]],
    expl: <>Extrait = 100 − {fr(rn)} = <b>{fr(tot)}{NB}%</b>.</> };
  const q4 = { id: 'e3', type: 'num', q: <>Combien de contacts faut-il au minimum pour qu’il reste <b>moins de 1 %</b> dans l’eau ? (nombre entier)</>, unite: '', vrai: nmin, tolRel: 0.05, csMin: 1,
    aide: `Cherchez le plus petit entier n tel que ${nbF(f, 3)} puissance n est inférieur à 0,01.`,
    pieges: [[nmin - 1, 'Avec un contact de moins, il reste encore plus de 1 % dans l’eau.'], [nmin + 1, 'Un contact de moins suffit déjà : cherchez le plus petit entier.']],
    expl: <>{nbF(f, 3)}<sup>{nmin - 1}</sup> = {fr(100 * f ** (nmin - 1))} % dépasse 1 % ; {nbF(f, 3)}<sup>{nmin}</sup> = {fr(100 * f ** nmin)} % est inférieur à 1 % : il faut <b>{nmin} contacts</b>.</> };
  filtrer([q1, q2, q3, q4]);
  return { intro, questions: [q1, q2, q3, q4],
    retenir: ['Reste après un contact = 1 divisé par (1 + D × r) ; après n contacts avec du solvant neuf : cette fraction à la puissance n.', 'Plusieurs petites extractions valent mieux qu’une seule grande.'] };
}
function genStereoNombre() {
  const tire = t => t[Math.floor(Math.random() * t.length)];
  const n = tire([3, 4]), N = 2 ** n, C = 2 ** (n - 1), Dd = N - 2;
  const intro = `Une molécule possède ${n} carbones asymétriques, tous de substituants différents : il n’y a pas de composé méso, donc le nombre de stéréoisomères est maximal.`;
  const q1 = { id: 's0', type: 'num', q: <>Combien de stéréoisomères cette molécule possède-t-elle (2<sup>n</sup>, sans unité) ?</>, unite: '', vrai: N, tolRel: 0.02, csMin: 1,
    aide: 'Chaque carbone asymétrique a deux configurations, R ou S : on multiplie les possibilités.',
    pieges: [[2 * n, 'Il faut élever 2 à la puissance n, et non multiplier 2 par n.'], [n * n, 'C’est n au carré : le nombre de stéréoisomères est 2 puissance n.'], [2 ** (n - 1), 'C’est le nombre de couples d’énantiomères : il y a deux fois plus de stéréoisomères.']],
    expl: <>Avec {n} carbones asymétriques : 2<sup>{n}</sup> = <b>{N}</b> stéréoisomères.</> };
  const q2 = { id: 's1', type: 'num', q: <>Chaque stéréoisomère a un seul énantiomère. Combien de <b>couples d’énantiomères</b> y a-t-il parmi les {N} stéréoisomères (sans unité) ?</>, unite: '', vrai: C, tolRel: 0.02, csMin: 1,
    aide: 'Un couple d’énantiomères contient deux stéréoisomères : divisez le nombre total par 2.',
    pieges: [[N, 'C’est le nombre de stéréoisomères : un couple en contient deux, il faut diviser par 2.'], [N / 4, 'Il faut diviser une seule fois par 2 : un couple contient deux stéréoisomères.'], [n, 'C’est le nombre de carbones asymétriques, pas le nombre de couples.']],
    expl: <>{N} stéréoisomères répartis par couples de 2 : {N} divisé par 2 = <b>{C}</b> couples d’énantiomères.</> };
  const q3 = { id: 's2', type: 'num', q: <>Combien de <b>diastéréoisomères</b> un stéréoisomère donné possède-t-il parmi les autres (sans unité) ?</>, unite: '', vrai: Dd, tolRel: 0.02, csMin: 1,
    aide: 'Parmi les stéréoisomères, retirez celui qu’on étudie et son énantiomère : tous les autres sont ses diastéréoisomères.',
    pieges: [[N - 1, 'Il faut retirer aussi son énantiomère : les diastéréoisomères sont les stéréoisomères autres que lui-même et que son énantiomère.'], [N, 'C’est le nombre total de stéréoisomères : il faut retirer le stéréoisomère étudié et son énantiomère.'], [N / 2 - 1, 'On retire deux stéréoisomères du total, pas la moitié du total.']],
    expl: <>{N} stéréoisomères, moins le stéréoisomère étudié et son énantiomère : {N} − 2 = <b>{Dd}</b> diastéréoisomères.</> };
  filtrer([q1, q2, q3]);
  return { intro, questions: [q1, q2, q3],
    retenir: ['n carbones asymétriques (sans composé méso) : 2ⁿ stéréoisomères.', 'Les stéréoisomères vont par couples d’énantiomères : 2ⁿ divisé par 2 couples.', 'Les diastéréoisomères d’un stéréoisomère : tous les autres, sauf lui et son énantiomère, soit 2ⁿ − 2.'] };
}
function tirageStereoRacemique() {
  const tire = t => t[Math.floor(Math.random() * t.length)];
  for (let k = 0; k < 800; k++) {
    const m = tire([80, 120, 160, 200]), N = tire([6, 10, 12, 20]), kk = tire([3, 5, 8]), v = [m / 2, N * m / 2, kk];
    if (v.every((y, i) => v.every((z, j) => i === j || Math.abs(y - z) > 0.1 * Math.max(y, z)))) return { m, N, k: kk };
  }
  throw new Error('tirage stereo-racemique impossible');
}
function genStereoRacemique() {
  const { m, N, k } = tirageStereoRacemique(), a = m / 2, D = k * a;
  const intro = `Un médicament fictif contient une molécule chirale sous forme de mélange racémique : chaque comprimé a une masse de ${nbF(m, 0)} mg de ce mélange (parts égales des deux énantiomères). Seul l’énantiomère (R) est actif. Une boîte contient ${N} comprimés.`;
  const q1 = { id: 'r0', type: 'num', q: <>Quelle masse de l’énantiomère actif (R) un comprimé contient-il (en mg, 2 chiffres significatifs) ?</>, unite: 'mg', vrai: a, tolRel: 0.05, csMin: 2,
    aide: 'Un mélange racémique contient 50 % de chaque énantiomère.',
    pieges: [[m, 'C’est la masse totale du comprimé : seule la moitié est l’énantiomère (R).'], [m / 4, 'Un racémique contient 50 % de chaque énantiomère, pas 25 %.'], [2 * m, 'La masse de (R) ne peut pas dépasser celle du comprimé : il faut en prendre la moitié.']],
    expl: <>Un racémique contient 50 % de chaque énantiomère : {nbF(m, 0)} × 0,50 = <b>{nbF(a, 0)}{NB}mg</b> de (R).</> };
  const q2 = { id: 'r1', type: 'num', q: <>Quelle masse de l’énantiomère inactif (S) la boîte entière contient-elle (en mg, 2 chiffres significatifs) ?</>, unite: 'mg', vrai: N * a, tolRel: 0.05, csMin: 2,
    aide: 'Calculez la masse de (S) dans un comprimé, puis multipliez par le nombre de comprimés.',
    pieges: [[N * m, 'C’est la masse des deux énantiomères : (S) n’en représente que la moitié.'], [a, 'C’est la masse de (S) dans un seul comprimé : il faut multiplier par le nombre de comprimés.'], [N * m / 4, 'Un racémique contient 50 % de (S), pas 25 %.']],
    expl: <>Par comprimé : {nbF(a, 0)} mg de (S). Pour {N} comprimés : {N} × {nbF(a, 0)} = <b>{nbF(N * a, 0)}{NB}mg</b>.</> };
  const q3 = { id: 'r2', type: 'num', q: <>Une étude demande <b>{nbF(D, 0)}{NB}mg</b> d’énantiomère actif (R). Combien de comprimés faut-il utiliser (sans unité) ?</>, unite: '', vrai: k, tolRel: 0.02, csMin: 1,
    aide: 'Divisez la masse de (R) demandée par la masse de (R) que contient un comprimé.',
    pieges: [[D / m, 'Un comprimé ne contient que la moitié de sa masse en (R) : il faut diviser par la masse de (R), pas par la masse du comprimé.'], [2 * k, 'Un comprimé contient déjà la moitié de sa masse en (R) : il ne faut pas doubler le nombre obtenu.'], [D, 'C’est la masse demandée, en mg : on cherche un nombre de comprimés.']],
    expl: <>Un comprimé contient {nbF(a, 0)} mg de (R) : {nbF(D, 0)} divisé par {nbF(a, 0)} = <b>{k}</b> comprimés.</> };
  filtrer([q1, q2, q3]);
  return { intro, questions: [q1, q2, q3],
    retenir: ['Mélange racémique : 50 % de chaque énantiomère, en masse comme en quantité de matière.', 'Seul l’énantiomère actif compte pour l’effet : prendre la moitié de la masse du mélange.', 'Un nombre de comprimés = masse demandée divisée par la masse d’énantiomère actif d’un comprimé.'] };
}
function genTensLibres() {
  const tire = t => t[Math.floor(Math.random() * t.length)];
  const cmc = tire([2, 4, 5, 8, 10]), k = tire([3, 4, 5, 6]), c = k * cmc, lib = cmc, mic = c - cmc, pct = 100 * mic / c;
  const intro = `Un tensioactif a une CMC de ${cmc}${NB}mmol/L. On prépare une solution aqueuse de ce tensioactif à ${c}${NB}mmol/L, donc au-dessus de la CMC.`;
  const q1 = { id: 'l0', type: 'num', q: <>Quelle est la concentration en <b>monomères libres</b> (molécules isolées), en mmol/L ?</>, unite: 'mmol/L', vrai: lib, tolRel: 0.02, csMin: 1,
    aide: 'Au-dessus de la CMC, la concentration en monomères libres ne varie plus.',
    pieges: [[c, 'C’est la concentration totale : au-dessus de la CMC, le tensioactif en excès forme des micelles.'], [mic, 'C’est la concentration engagée dans les micelles, pas celle des monomères libres.']],
    expl: <>Au-dessus de la CMC, les monomères libres restent à la concentration de la CMC : <b>{cmc}{NB}mmol/L</b>.</> };
  const q2 = { id: 'l1', type: 'num', q: <>Quelle concentration de tensioactif est <b>engagée dans les micelles</b> (mmol/L) ?</>, unite: 'mmol/L', vrai: mic, tolRel: 0.02, csMin: 1,
    aide: 'Concentration totale moins concentration des monomères libres.',
    pieges: [[c, 'C’est la concentration totale : il faut retirer les monomères libres.'], [cmc, 'C’est la concentration en monomères libres, pas celle des micelles.'], [c + cmc, 'Les monomères libres font partie de la concentration totale : il faut les soustraire, non les ajouter.']],
    expl: <>{c} − {cmc} = <b>{mic}{NB}mmol/L</b> sont dans les micelles.</> };
  const q3 = { id: 'l2', type: 'num', q: <>Quel pourcentage du tensioactif total est engagé dans les micelles (2 chiffres significatifs) ?</>, unite: '%', vrai: pct, tolRel: 0.05, csMin: 2,
    aide: 'Concentration dans les micelles divisée par la concentration totale, fois 100.',
    pieges: [[100 * cmc / c, 'C’est la part de monomères libres : on demande la part dans les micelles.'], [mic, 'C’est une concentration en mmol/L : il faut la rapporter à la concentration totale, en pourcentage.']],
    expl: <>{mic} divisé par {c}, soit <b>{nbF(pct, 0)}{NB}%</b> du tensioactif.</> };
  filtrer([q1, q2, q3]);
  return { intro, questions: [q1, q2, q3],
    retenir: ['Au-dessus de la CMC, les monomères libres restent à la concentration de la CMC.', 'Le reste du tensioactif (concentration totale − CMC) forme des micelles.', 'Plus on ajoute de tensioactif, plus la part dans les micelles augmente.'] };
}
function genTensKlevens() {
  const tire = t => t[Math.floor(Math.random() * t.length)];
  const ion = tire([true, false]), F = ion ? 2 : 3.5, n0 = tire([8, 9, 10]), d = tire([2, 3, 4]), n1 = n0 + d, c0 = tire([40, 60, 100]);
  const fac = F ** d, c1 = c0 / fac, Fs = nbF(F, F % 1 ? 1 : 0);
  const intro = `Prolongement du programme : pour une série de tensioactifs de même tête (${ion ? 'ionique' : 'non ionique'}), on constate que chaque carbone ajouté à la chaîne divise la CMC par ${Fs}. Le tensioactif à ${n0} carbones a une CMC de ${c0}${NB}mmol/L ; on étudie celui à ${n1} carbones.`;
  const q1 = { id: 'k0', type: 'num', q: <>De quel facteur la CMC est-elle divisée quand on passe de {n0} à {n1} carbones (2 chiffres significatifs) ?</>, unite: '', vrai: fac, tolRel: 0.05, csMin: 2,
    aide: `On ajoute ${d} carbones : on divise ${d} fois de suite par ${Fs}.`,
    pieges: [[F * d, `Les divisions successives se multiplient : ${Fs} puissance ${d}, pas ${Fs} fois ${d}.`], [F, 'C’est le facteur pour un seul carbone : ici on en ajoute plusieurs.']],
    expl: <>{d} carbones de plus : {Fs}<sup>{d}</sup> = <b>{nbF(fac, fac >= 10 ? 0 : 1)}</b>.</> };
  const q2 = { id: 'k1', type: 'num', q: <>Quelle est la CMC du tensioactif à {n1} carbones (mmol/L, 2 chiffres significatifs) ?</>, unite: 'mmol/L', vrai: c1, tolRel: 0.05, csMin: 2,
    aide: 'CMC du tensioactif à plus longue chaîne = CMC de départ divisée par le facteur trouvé.',
    pieges: [[c0 * fac, 'La chaîne plus longue abaisse la CMC : il faut diviser, non multiplier.'], [c0 / (F * d), `Le facteur total est ${Fs} puissance ${d}, pas ${Fs} fois ${d}.`]],
    expl: <>{c0} divisé par {nbF(fac, fac >= 10 ? 0 : 1)} = <b>{nbF(c1, c1 >= 10 ? 0 : c1 >= 1 ? 1 : 2)}{NB}mmol/L</b>.</> };
  filtrer([q1, q2]);
  return { intro, questions: [q1, q2],
    retenir: ['Chaque carbone ajouté à la chaîne divise la CMC par un facteur à peu près constant (environ 2 pour un ionique, 3 à 4 pour un non ionique).', 'Pour plusieurs carbones, les facteurs se multiplient : facteur puissance nombre de carbones ajoutés.'] };
}
function genPredoBeer() {
  const u = PRE.tirageIndicateur(), Cs = sciF(u.C), eps = sciF(u.eps), ls = nbF(u.l, 2), pHs = nbF(u.pH, 2), As = nbF(u.abs, 3);
  const Ind = u.abs / (u.eps * u.l), Ind2 = PRE.arrondiCS(Ind, 2), HInd2 = PRE.arrondiCS(u.C - Ind2, 2), r2 = PRE.arrondiCS(Ind2 / HInd2, 2), pKa2 = u.pH - Math.log10(r2);
  const rs = r2 >= 10 ? nbF(r2, 0) : nbF(r2, r2 >= 1 ? 1 : 2);
  const intro = `Un indicateur coloré HInd / Ind⁻ de concentration totale C = ${Cs}${NB}mol/L est étudié à 25${NB}°C dans une cuve de longueur ℓ = ${ls}${NB}cm, à la longueur d’onde où seule Ind⁻ absorbe (ε = ${eps}${NB}L·mol⁻¹·cm⁻¹). À pH = ${pHs}, l’absorbance mesurée est A = ${As}.`;
  const q1 = { id: 'b0', type: 'num', q: <>Avec la loi de Beer-Lambert A = ε · ℓ · [Ind⁻], calculez <b>[Ind⁻]</b> (mol/L, 2 chiffres significatifs).</>, unite: 'mol/L', vrai: Ind2, tolRel: 0.05, csMin: 2,
    aide: '[Ind⁻] = A divisée par (ε × ℓ), avec ℓ en cm et ε en L·mol⁻¹·cm⁻¹ : le résultat est en mol/L.',
    pieges: [[u.abs * u.eps * u.l, 'Il faut diviser A par ε × ℓ, pas les multiplier.'], [u.abs / u.eps, 'Il manque la longueur de cuve : [Ind⁻] = A divisée par (ε × ℓ).'], [u.eps * u.l / u.abs, 'Le rapport est inversé : [Ind⁻] = A divisée par (ε × ℓ).']],
    expl: <>[Ind⁻] = {avecIndices(`frac(${As}|${eps} × ${ls})`)} = <b>{sciF(Ind2)}{NB}mol/L</b>.</> };
  const q2 = { id: 'b1', type: 'num', q: <>Avec [Ind⁻] = {sciF(Ind2)}{NB}mol/L, calculez la concentration de la forme acide <b>[HInd]</b> (mol/L, 2 chiffres significatifs).</>, unite: 'mol/L', vrai: HInd2, tolRel: 0.08, csMin: 2,
    aide: 'Conservation de la matière : C = [HInd] + [Ind⁻], donc [HInd] = C − [Ind⁻].',
    pieges: [[u.C, 'C’est la concentration totale C : il faut retrancher [Ind⁻].'], [Ind2, 'C’est [Ind⁻] ; on demande la forme acide, [HInd] = C − [Ind⁻].'], [u.C + Ind2, 'Il faut soustraire [Ind⁻] à C, pas l’ajouter.']],
    expl: <>[HInd] = {Cs} − {sciF(Ind2)} = <b>{sciF(HInd2)}{NB}mol/L</b>.</> };
  const q3 = { id: 'b2', type: 'num', q: <>Calculez le rapport <b>{avecIndices('frac([Ind⁻]|[HInd])')}</b> (sans unité, 2 chiffres significatifs) avec [Ind⁻] = {sciF(Ind2)}{NB}mol/L et [HInd] = {sciF(HInd2)}{NB}mol/L.</>, unite: '', vrai: r2, tolRel: 0.05, csMin: 2,
    aide: 'Divisez la concentration de la forme basique par celle de la forme acide.',
    pieges: [[HInd2 / Ind2, 'Le rapport est inversé : on demande frac([Ind⁻]|[HInd]), base sur acide.'], [Ind2 - HInd2, 'Un rapport est un quotient, pas une différence.'], [Ind2 / u.C, 'Au dénominateur, c’est [HInd], pas la concentration totale C.']],
    expl: <>{avecIndices('frac([Ind⁻]|[HInd])')} = {avecIndices(`frac(${sciF(Ind2)}|${sciF(HInd2)})`)} = <b>{rs}</b>.</> };
  const q4 = { id: 'b3', type: 'num', q: <>Avec pH = {pHs} et le rapport {avecIndices('frac([Ind⁻]|[HInd])')} = {rs}, calculez le <b>pKa</b> de l’indicateur (sans unité, 3 chiffres significatifs).</>, unite: '', vrai: pKa2, tolRel: 0.02, csMin: 2,
    aide: 'pH = pKa + log(frac([Ind⁻]|[HInd])) donc pKa = pH − log(frac([Ind⁻]|[HInd])).',
    pieges: [[u.pH + Math.log10(r2), 'Le signe est inversé : pKa = pH − log(frac([Ind⁻]|[HInd])).'], [u.pH, 'Vous avez oublié le terme log : le pKa n’est égal au pH que si [Ind⁻] = [HInd].'], [u.pH - r2, 'Il faut le logarithme décimal du rapport, pas le rapport lui-même.']],
    expl: <>pKa = {pHs} − log({rs}) = <b>{nbF(pKa2, 2)}</b>.</> };
  filtrer([q1, q2, q3, q4]);
  return { intro, questions: [q1, q2, q3, q4],
    retenir: ['Beer-Lambert : A = ε · ℓ · [Ind⁻], donc [Ind⁻] = A divisée par (ε × ℓ).', 'Conservation de la matière : [HInd] = C − [Ind⁻].', 'pKa = pH − log(frac([Ind⁻]|[HInd])).'] };
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

function genConductimetrieTG() {
  const sci = (x, cs = 2) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c])).join('')}`; };
  const tolOk = (q) => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 0.06 * Math.abs(q.vrai))); };
  const sel = tire([{ nom: 'chlorure de sodium', f: 'NaCl', cat: 'Na⁺', lc: CDT_I.Na.lambda, an: 'Cl⁻', la: CDT_I.Cl.lambda }, { nom: 'nitrate de sodium', f: 'NaNO₃', cat: 'Na⁺', lc: CDT_I.Na.lambda, an: 'NO₃⁻', la: CDT_I.NO3.lambda }, { nom: 'éthanoate de sodium', f: 'CH₃COONa', cat: 'Na⁺', lc: CDT_I.Na.lambda, an: 'CH₃COO⁻', la: CDT_I.AcO.lambda }]);
  const S = sel.lc + sel.la;
  const c1 = tire([0.0020, 0.0030, 0.0040, 0.0050, 0.0080]);
  const intro = <>Conductivités ioniques molaires à 25 °C : λ({sel.cat}) = <b>{nb(sel.lc, 2)}</b> et λ({sel.an}) = <b>{nb(sel.la, 2)}</b> mS·m²·mol⁻¹. Les solutions sont diluées et le soluté, {sel.nom} ({sel.f}), est totalement dissocié.</>;
  const q1 = { id: 'k0', type: 'num', q: <>{intro} Calculez la conductivité σ d’une solution de concentration <b>{sci(c1, 2)}{NB}mol/L</b> (en mS·m⁻¹, 2 chiffres significatifs).</>, unite: 'mS·m⁻¹', vrai: S * c1 * 1000, tolRel: 0.05, csMin: 2,
    aide: 'σ = (λ(cation) + λ(anion)) × c, avec c en mol·m⁻³ : 1 mol/L = 1 000 mol·m⁻³.',
    pieges: [[S * c1, 'Vous avez gardé c en mol/L ; la loi demande des mol·m⁻³ (× 1 000) quand λ est en mS·m²·mol⁻¹.'], [sel.lc * c1 * 1000, 'Il manque la contribution de l’anion : les deux ions contribuent à σ.'], [sel.la * c1 * 1000, 'Il manque la contribution du cation : les deux ions contribuent à σ.']],
    expl: <>c = {sci(c1, 2)}{NB}mol/L = {nb(c1 * 1000, 2)}{NB}mol·m⁻³ ; σ = ({nb(sel.lc, 2)} + {nb(sel.la, 2)}) × {nb(c1 * 1000, 2)} = <b>{nb(S * c1 * 1000, 3)}{NB}mS·m⁻¹</b>.</> };
  const c2 = tire([0.0020, 0.0030, 0.0040, 0.0060]), sm = Math.round(S * c2 * 1000 * 10) / 10, cc = sm / S / 1000;
  const q2 = { id: 'k1', type: 'num', q: <>Pour la même espèce, on mesure σ = <b>{nb(sm, 3)}{NB}mS·m⁻¹</b>. Calculez la concentration du soluté (en mol/L, 2 chiffres significatifs).</>, unite: 'mol/L', vrai: cc, tolRel: 0.05, csMin: 2,
    aide: 'c = σ / (λ(cation) + λ(anion)) donne c en mol·m⁻³ ; divisez par 1 000 pour obtenir des mol/L.',
    pieges: [[sm / S, 'Ce résultat est en mol·m⁻³ ; convertissez-le en mol/L (÷ 1 000).'], [sm / sel.lc / 1000, 'Il faut diviser par la somme des deux λ, pas par celui du cation seul.'], [sm * S / 1000, 'Le rapport est inversé : on divise σ par la somme des λ.']],
    expl: <>c = {avecIndices(`frac(σ|λ(cation) + λ(anion))`)} = {avecIndices(`frac(${nb(sm, 3)}|${nb(sel.lc, 2)} + ${nb(sel.la, 2)})`)} = {nb(sm / S, 3)}{NB}mol·m⁻³ = <b>{sci(cc, 2)}{NB}mol/L</b>.</> };
  const VA = 20.0, cB = 0.100, VE = tire([8.0, 12.0, 14.0, 15.0, 16.0]), cA = cB * VE / VA;
  const q3 = { id: 'k2', type: 'num', q: <>On titre <b>{nb(VA, 3)}{NB}mL</b> d’acide chlorhydrique, dilué dans de l’eau, par de la soude à <b>{nb(cB, 3)}{NB}mol/L</b>. La courbe σ = f(V) présente une rupture de pente pour V = <b>{nb(VE, 2)}{NB}mL</b>. Calculez la concentration de l’acide (en mol/L, 2 chiffres significatifs).</>, unite: 'mol/L', vrai: cA, tolRel: 0.05, csMin: 2,
    aide: 'À l’équivalence, les quantités sont égales : c_A × V_A = c_B × V_E.',
    pieges: [[cB * VA / VE, 'Le rapport des volumes est inversé : c_A = c_B × V_E / V_A.'], [cB * VE, 'C’est la quantité de HO⁻ versée en mmol ; divisez-la par la prise d’essai V_A.'], [cB, 'C’est la concentration de la soude, pas celle de l’acide.']],
    expl: <>c_A × V_A = c_B × V_E donc c_A = {avecIndices(`frac(0,100 × ${nb(VE, 2)}|${nb(VA, 3)})`)} = <b>{nb(cA, 4)}{NB}mol/L</b>.</> };
  const cA2 = tire([0.040, 0.050, 0.060]), VB = tire([14.0, 16.0, 18.0]), n = cB * VB - cA2 * VA;
  const q4 = { id: 'k3', type: 'num', q: <>On titre <b>{nb(VA, 3)}{NB}mL</b> d’acide chlorhydrique à <b>{nb(cA2, 3)}{NB}mol/L</b> par de la soude à <b>{nb(cB, 3)}{NB}mol/L</b>. On a versé <b>{nb(VB, 3)}{NB}mL</b> de soude, soit plus que le volume équivalent (transformation totale). Quelle quantité d’ions HO⁻ reste-t-il dans le bécher (en mmol, 2 chiffres significatifs) ?</>, unite: 'mmol', vrai: n, tolRel: 0.05, csMin: 2,
    aide: 'n(HO⁻) restant = n(HO⁻) versé − n(H₃O⁺) initial = c_B × V_B − c_A × V_A (mol/L × mL = mmol).',
    pieges: [[cB * VB, 'C’est la quantité de HO⁻ versée : une partie a réagi avec H₃O⁺.'], [cA2 * VA, 'C’est la quantité d’ions H₃O⁺ du départ ; il faut la retrancher à la quantité de HO⁻ versée.'], [cB * VB + cA2 * VA, 'Il faut retrancher la quantité d’ions H₃O⁺ consommés, pas l’ajouter.']],
    expl: <>n(HO⁻) versé = {nb(cB, 3)} × {nb(VB, 3)} = {nb(cB * VB, 3)}{NB}mmol ; n(H₃O⁺) initial = {nb(cA2, 3)} × {nb(VA, 3)} = {nb(cA2 * VA, 3)}{NB}mmol ; reste = <b>{nb(n, 3)}{NB}mmol</b>.</> };
  [q1, q2, q3, q4].forEach(tolOk);
  return { intro: 'Conductimétrie : loi de Kohlrausch, concentration à partir de σ, volume équivalent et bilan après l’équivalence.', questions: [q1, q2, q3, q4],
    retenir: ['Loi de Kohlrausch : σ = Σ λ × c, avec c en mol·m⁻³ (1 mol/L = 1 000 mol·m⁻³) et λ en mS·m²·mol⁻¹.', 'Une solution diluée seulement : au-delà de 10 mol·m⁻³ environ, la loi n’est plus valable.', 'La rupture de pente de la courbe repère le volume équivalent : c_A × V_A = c_B × V_E.', 'Après l’équivalence, les ions HO⁻ versés en excès restent en solution : n(HO⁻) = c_B × V_B − c_A × V_A.'] };
}

function genEtalonnageTG() {
  const sci = (x, cs = 2) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c] || c)).join('')}`; };
  const tolOk = (q) => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 0.06 * Math.abs(q.vrai))); };
  const k = tire([50, 60, 80, 100]), Ge = Number((141 / k).toPrecision(3)), kc = 141 / Ge;
  const q1 = { id: 'e0', type: 'num', q: <>Une cellule plongée dans une solution étalon de chlorure de potassium, de conductivité <b>141{NB}mS·m⁻¹</b>, affiche une conductance <b>{nb(Ge, 3)}{NB}mS</b>. Calculez la constante de la cellule (en m⁻¹, 2 chiffres significatifs).</>, unite: 'm⁻¹', vrai: kc, tolRel: 0.05, csMin: 2,
    aide: 'σ(étalon) = k × G(étalon) : isolez k. Des mS·m⁻¹ divisés par des mS donnent des m⁻¹.',
    pieges: [[Ge / 141, 'Le rapport est inversé : k = σ divisée par G.'], [141 * Ge, 'Il faut diviser σ par G, pas les multiplier.'], [0.141 / Ge, 'Vous avez converti σ en S·m⁻¹ sans convertir G : convertissez les deux ou aucune.']],
    expl: <>k = {avecIndices(`frac(σ|G)`)} = {avecIndices(`frac(141|${nb(Ge, 3)})`)} = <b>{nb(kc, 3)}{NB}m⁻¹</b>.</> };
  const Gx = tire([0.45, 0.62, 0.85, 1.20, 1.55]);
  const q2 = { id: 'e1', type: 'num', q: <>Avec cette cellule (constante <b>{nb(k, 2)}{NB}m⁻¹</b>), une solution affiche <b>{nb(Gx, 2)}{NB}mS</b>. Calculez sa conductivité σ (en mS·m⁻¹, 2 chiffres significatifs).</>, unite: 'mS·m⁻¹', vrai: k * Gx, tolRel: 0.05, csMin: 2,
    aide: 'σ = k × G : multipliez la constante de cellule par la conductance ; le résultat sort en mS·m⁻¹.',
    pieges: [[k / Gx, 'Vous avez divisé k par G : la relation est σ = k × G.'], [Gx / k, 'Vous avez divisé G par k : la relation est σ = k × G.'], [k * Gx / 1000, 'Votre résultat est en S·m⁻¹ : la question demande des mS·m⁻¹ (× 1 000).']],
    expl: <>σ = k × G = {nb(k, 2)} × {nb(Gx, 2)} = <b>{nb(k * Gx, 3)}{NB}mS·m⁻¹</b>.</> };
  const a = tire([0.095, 0.120, 0.155, 0.210]), G = tire([0.45, 0.62, 0.78, 0.93]), cd = G / a;
  const q3 = { id: 'e2', type: 'num', q: <>La droite d’étalonnage d’un soluté, tracée avec des étalons dilués, a pour équation G = a × c avec a = <b>{nb(a, 3)}{NB}mS par mmol/L</b>. Une solution diluée du même soluté affiche <b>{nb(G, 2)}{NB}mS</b>. Calculez sa concentration (en mmol/L, 2 chiffres significatifs).</>, unite: 'mmol/L', vrai: cd, tolRel: 0.05, csMin: 2,
    aide: 'G = a × c, donc c = G divisée par a : avec G en mS et a en mS par mmol/L, c sort en mmol/L.',
    pieges: [[a / G, 'Le rapport est inversé : c = G divisée par a.'], [G * a, 'Il faut diviser G par a, pas les multiplier.'], [G / a / 1000, 'Vous avez donné c en mol/L : la question demande des mmol/L.']],
    expl: <>c = {avecIndices(`frac(G|a)`)} = {avecIndices(`frac(${nb(G, 2)}|${nb(a, 3)})`)} = <b>{nb(cd, 3)}{NB}mmol/L</b>.</> };
  const F = tire([10, 20, 25, 50]);
  const q4 = { id: 'e3', type: 'num', q: <>La solution diluée précédente, de concentration <b>{nb(cd, 2)}{NB}mmol/L</b>, provient d’une solution de départ diluée <b>{F}{NB}fois</b>. Calculez la concentration de la solution de départ (en mol/L, 2 chiffres significatifs).</>, unite: 'mol/L', vrai: F * cd / 1000, tolRel: 0.05, csMin: 2,
    aide: 'c(solution de départ) = F × c(solution diluée), puis 1 mmol/L = 10⁻³ mol/L.',
    pieges: [[cd / F / 1000, 'Vous avez divisé par F : la solution de départ est plus concentrée, il faut multiplier.'], [F * cd, 'Ce résultat est en mmol/L ; convertissez-le en mol/L (÷ 1 000).'], [cd / 1000, 'Il manque le facteur de dilution : c(S) = F × c(S′).']],
    expl: <>c(S) = F × c(S′) = {F} × {nb(cd, 3)} = {nb(F * cd, 3)}{NB}mmol/L = <b>{sci(F * cd / 1000, 2)}{NB}mol/L</b>.</> };
  [q1, q2, q3, q4].forEach(tolOk);
  return { intro: 'Dosage conductimétrique par étalonnage : constante de cellule, conductivité, lecture sur la droite d’étalonnage et dilution.', questions: [q1, q2, q3, q4],
    retenir: ['Constante de cellule : k = σ(étalon) / G(étalon), en m⁻¹ ; ensuite σ = k × G pour toute solution mesurée avec cette cellule.', 'Droite d’étalonnage : G = a × c, passant par l’origine ; c = G / a (G en mS, a en mS par mmol/L : c en mmol/L).', 'La droite n’est valable que pour une solution diluée (c inférieure à 10 mmol/L environ) : au-delà, on dilue.', 'Solution diluée F fois : c(S) = F × c(S′).'] };
}

function genFrenetTG() {
  const tolOk = q => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 0.08 * Math.abs(q.vrai))); };
  const v = tire([2.0, 3.0, 4.0, 5.0, 6.0]), R = tire([1.5, 2.0, 2.5, 4.0, 5.0, 8.0]), an = v * v / R;
  const q1 = { id: 'fr0', type: 'num', q: <>Un point décrit un cercle de rayon <b>{nb(R, 2)}{NB}m</b> à vitesse de norme constante <b>{nb(v, 2)}{NB}m/s</b> (mouvement circulaire uniforme). Calculez la norme de son accélération (en m/s², 2 chiffres significatifs).</>, unite: 'm/s²', vrai: an, tolRel: 0.05, csMin: 2,
    aide: 'Mouvement uniforme : frac(dv|dt) = 0, il reste la coordonnée normale a = frac(v²|R) (v en m/s, R en m).',
    pieges: [[v / R, 'Vous avez calculé v divisée par R : il faut v au carré, divisée par R.'], [v * v * R, 'Le rayon est au dénominateur : a = v² divisée par R.'], [v * v / (2 * R), 'Il n’y a pas de facteur 2 : a = v² divisée par R.'], [v * v, 'Vous avez oublié de diviser par le rayon R.']],
    expl: <>a = {avecIndices(`frac(v²|R)`)} = {avecIndices(`frac(${nb(v, 2)}²|${nb(R, 2)})`)} = <b>{nb(an, 3)}{NB}m/s²</b>, dirigée vers le centre du cercle.</> };
  const a2 = tire([2.0, 4.0, 5.0, 8.0]), R2 = tire([1.0, 2.0, 2.5, 4.0]), v2 = Math.sqrt(a2 * R2);
  const q2 = { id: 'fr1', type: 'num', q: <>Un point décrit un cercle de rayon <b>{nb(R2, 2)}{NB}m</b> à vitesse de norme constante. La norme de son accélération vaut <b>{nb(a2, 2)}{NB}m/s²</b>. Calculez la norme de sa vitesse (en m/s, 2 chiffres significatifs).</>, unite: 'm/s', vrai: v2, tolRel: 0.05, csMin: 2,
    aide: 'a = v² divisée par R, donc v² = a × R et v est la racine carrée de a × R.',
    pieges: [[a2 * R2, 'Vous avez oublié la racine carrée : c’est v² qui vaut a × R.'], [a2 / R2, 'Il faut multiplier a par R (pas diviser), puis prendre la racine carrée.'], [Math.sqrt(a2 / R2), 'Il faut multiplier a par R, pas le diviser.'], [a2, 'La vitesse ne se confond pas avec l’accélération : v² = a × R.']],
    expl: <>v² = a × R = {nb(a2, 2)} × {nb(R2, 2)} = {nb(a2 * R2, 3)}, donc v = <b>{nb(v2, 3)}{NB}m/s</b>.</> };
  const sens = tire([1, -1]), vi = sens > 0 ? tire([2.0, 3.0, 4.0]) : tire([4.0, 6.0, 8.0]), dv = sens > 0 ? tire([2.0, 4.0, 6.0]) : tire([2.0, 4.0]), dt = tire([2.0, 4.0, 5.0]), vf = vi + sens * dv, at = (vf - vi) / dt;
  const q3 = { id: 'fr2', type: 'num', q: <>Sur un cercle, la norme de la vitesse d’un point passe de <b>{nb(vi, 2)}{NB}m/s</b> à <b>{nb(vf, 2)}{NB}m/s</b> en <b>{nb(dt, 2)}{NB}s</b>, de façon régulière. Calculez la coordonnée tangentielle a<sub>t</sub> = {avecIndices('frac(dv|dt)')} de son accélération (en m/s², avec son signe, 2 chiffres significatifs).</>, unite: 'm/s²', vrai: at, tolRel: 0.05, csMin: 2,
    aide: 'a_t = frac(dv|dt) = (v finale − v initiale) divisée par la durée : positive si la vitesse augmente, négative si elle diminue.',
    pieges: [[Math.abs(at), 'Attention au signe : la vitesse diminue, donc frac(dv|dt) est négative.'], [(vf + vi) / dt, 'Il faut la variation de vitesse (v finale − v initiale), pas la somme.'], [vf - vi, 'Il faut diviser la variation de vitesse par la durée.'], [dt / (vf - vi), 'Le rapport est inversé : frac(dv|dt) = variation de vitesse divisée par durée.']],
    expl: <>a<sub>t</sub> = {avecIndices(`frac(dv|dt)`)} = {avecIndices(`frac(${nb(vf, 2)} − ${nb(vi, 2)}|${nb(dt, 2)})`)} = <b>{nb(at, 3)}{NB}m/s²</b> ({at > 0 ? 'positive : le point accélère' : 'négative : le point ralentit'}).</> };
  // on écarte les tirages où a_n seule, |a_t| seule ou leur somme donnerait la norme à 8 % près (une réponse fausse serait acceptée par la tolérance)
  const C4 = []; [2.0, 3.0, 4.0].forEach(v => [1.5, 2.0, 2.5, 4.0].forEach(R => [1.5, 2.0, 3.0, -2.0, -1.5].forEach(a => { const n = Math.hypot(a, v * v / R); if ([v * v / R, Math.abs(a), Math.abs(a) + v * v / R].every(x => Math.abs(x - n) > 0.08 * n)) C4.push([v, R, a]); })));
  const [v4, R4, at4] = tire(C4), an4 = v4 * v4 / R4, n4 = Math.hypot(at4, an4);
  const q4 = { id: 'fr3', type: 'num', q: <>Un point décrit un cercle de rayon <b>{nb(R4, 2)}{NB}m</b>. À l’instant étudié, sa vitesse vaut <b>{nb(v4, 2)}{NB}m/s</b> et {avecIndices('frac(dv|dt)')} = <b>{nb(at4, 2)}{NB}m/s²</b>. Calculez la norme de son accélération (en m/s², 2 chiffres significatifs).</>, unite: 'm/s²', vrai: n4, tolRel: 0.05, csMin: 2,
    aide: 'Coordonnées perpendiculaires : a_t = frac(dv|dt) et a_n = v² divisée par R ; la norme est la racine de la somme des carrés de a_t et de a_n (le signe de a_t ne change pas la norme).',
    pieges: [[Math.abs(at4) + an4, 'Les deux coordonnées sont perpendiculaires : on ne les additionne pas, on prend la racine de la somme des carrés.'], [an4, 'C’est la seule coordonnée normale : il manque a_t = frac(dv|dt).'], [Math.abs(at4), 'C’est la seule coordonnée tangentielle : il manque a_n = frac(v²|R).'], [Math.sqrt(Math.abs(at4) + an4), 'Il faut les carrés sous la racine : a_t au carré plus a_n au carré.']],
    expl: <>a<sub>t</sub> = {nb(at4, 2)} ; a<sub>n</sub> = {avecIndices(`frac(v²|R)`)} = {nb(an4, 3)} ; a = <b>{nb(n4, 3)}{NB}m/s²</b>.</> };
  // virages de route plausibles : accélération de l'ordre de 1 à 5 m/s² (jamais plus de 5 : cf. VAL277), on écarte le reste des couples (vitesse, rayon)
  const C5 = []; [36, 54, 72, 90, 108].forEach(k => [50, 80, 100, 200, 250].forEach(R => { const a = (k / 3.6) ** 2 / R; if (a >= 1 && a <= 5.0) C5.push([k, R]); }));
  const [vk, R5] = tire(C5), ms = vk / 3.6, a5 = ms * ms / R5;
  const q5 = { id: 'fr4', type: 'num', q: <>Une voiture roule à vitesse de norme constante <b>{nb(vk, 3)}{NB}km/h</b> dans un virage circulaire de rayon <b>{nb(R5, 3)}{NB}m</b>. Calculez la norme de son accélération (en m/s², 2 chiffres significatifs).</>, unite: 'm/s²', vrai: a5, tolRel: 0.05, csMin: 2,
    aide: 'Convertissez d’abord la vitesse en m/s (÷ 3,6), puis a = v² divisée par R.',
    pieges: [[vk * vk / R5, 'La vitesse n’est pas convertie : il faut des m/s (÷ 3,6) avant de calculer v².'], [ms / R5, 'Il faut v au carré, divisée par R.'], [vk / (3.6 * 3.6) / R5, 'Vous avez converti sans mettre v au carré : c’est (v en m/s)² qu’il faut.'], [ms * ms * R5, 'Le rayon est au dénominateur.']],
    expl: <>v = {nb(vk, 3)} ÷ 3,6 = {nb(ms, 3)}{NB}m/s ; a = {avecIndices(`frac(v²|R)`)} = {avecIndices(`frac(${nb(ms, 3)}²|${nb(R5, 3)})`)} = <b>{nb(a5, 3)}{NB}m/s²</b>.</> };
  [q1, q2, q3, q4, q5].forEach(tolOk);
  return { intro: 'Mouvement circulaire : coordonnées de l’accélération dans le repère de Frenet, mouvement uniforme et non uniforme.', questions: [q1, q2, q3, q4, q5],
    retenir: ['Repère de Frenet : vec(u)_t tangent (sens du mouvement), vec(u)_n normal (vers le centre). Vitesse : vec(v) = v × vec(u)_t.', 'Accélération : a_t = frac(dv|dt) (sur vec(u)_t) et a_n = frac(v²|R) (sur vec(u)_n), v en m/s, R en m.', 'Mouvement circulaire uniforme : a_t = 0 mais a n’est pas nulle : a = frac(v²|R), vers le centre.', 'La norme est la racine de la somme des carrés de a_t et de a_n ; a_t > 0 si le point accélère, a_t < 0 s’il ralentit.'] };
}

// Formules topologiques et isomérie de constitution (TG, sim 172) : nombre d'hydrogènes d'après le squelette, degré d'insaturation, masse molaire
function genTopoTG() {
  // entiers : réponse exacte (tolRel 0) ; la masse molaire garde 5 % de marge, ses pièges restent à plus de 8 % de la bonne réponse
  const tolOk = q => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && v2 !== q.vrai && (q.tolRel === 0 || Math.abs(v2 - q.vrai) > Math.max(1e-9, 1.5 * q.tolRel * Math.abs(q.vrai), 0.08 * Math.abs(q.vrai)))); };
  const ch = v => String(v);
  const n1 = tire([3, 4, 5, 6, 7, 8, 9]), h1 = 2 * n1 + 2;
  const q1 = { id: 'tp0', type: 'num', q: <>Un alcane est un hydrocarbure à chaîne saturée, non cyclique (que des liaisons simples). Un alcane compte <b>{n1} atomes de carbone</b>. Combien d’atomes d’hydrogène sa molécule compte-t-elle ?</>, unite: 'atomes d’hydrogène', vrai: h1, tolRel: 0, csMin: ch(h1).length,
    aide: 'Un carbone fait toujours 4 liaisons ; chaque liaison C–C en utilise une de deux carbones. Les liaisons qui restent sont des liaisons C–H.',
    pieges: [[2 * n1, 'Ce serait le nombre d’H avec une double liaison ou un cycle : ici la chaîne est saturée, il y en a 2 de plus.'], [2 * n1 + 1, 'Il faut compter les deux carbones d’extrémité : chacun porte 3 H, les autres 2 H.'], [4 * n1, 'Vous avez compté 4 H par carbone : il faut retirer les liaisons C–C, qui ne sont pas des liaisons C–H.']],
    expl: <>2 carbones d’extrémité (CH₃) : 6 H ; {n1 - 2} carbones intermédiaires (CH₂) : {2 * (n1 - 2)} H ; soit <b>{h1}</b> atomes d’hydrogène.</> };
  const COMB = [[1, 0, 'une seule double liaison C=C', ''], [0, 1, '', 'un seul cycle']];
  const [k2, r2, tk, tr] = tire(COMB), n2 = tire([4, 5, 6, 7]), h2 = 2 * n2 + 2 - 2 * k2 - 2 * r2;
  const q2 = { id: 'tp1', type: 'num', q: <>Un hydrocarbure (que des atomes de carbone et d’hydrogène) compte <b>{n2} atomes de carbone</b> et comporte {[tk, tr].filter(Boolean).join(' et ')}, sans autre double liaison ni autre cycle. Combien d’atomes d’hydrogène sa molécule compte-t-elle ?</>, unite: 'atomes d’hydrogène', vrai: h2, tolRel: 0, csMin: ch(h2).length,
    aide: 'Partez de la chaîne saturée à ce nombre de carbones : chaque double liaison C=C et chaque cycle fait perdre 2 atomes d’hydrogène.',
    pieges: [[2 * n2 + 2, 'C’est la chaîne saturée : il faut retirer 2 H par double liaison et par cycle.'], [2 * n2 + 2 - k2 - r2, 'Chaque double liaison ou chaque cycle retire 2 H, pas 1.'], [2 * n2 + 2 - 2 * k2, 'Vous avez oublié de compter le cycle : il retire aussi 2 H.'], [2 * n2 + 2 - 2 * r2, 'Vous avez oublié de compter la double liaison : elle retire 2 H.']],
    expl: <>Chaîne saturée : 2 × {n2} + 2 = {2 * n2 + 2} H ; on retire 2 H pour chaque double liaison ou cycle ({k2 + r2} au total, soit {2 * (k2 + r2)} H) : <b>{h2}</b> atomes d’hydrogène.</> };
  const n3 = tire([3, 4, 5, 6, 7]), h3 = 2 * n3 + 2;
  const q3 = { id: 'tp2', type: 'num', q: <>Un alcool saturé, non cyclique, possède <b>{n3} atomes de carbone</b> et un seul groupe –OH. Combien d’atomes d’hydrogène sa molécule compte-t-elle en tout, y compris celui du groupe –OH ?</>, unite: 'atomes d’hydrogène', vrai: h3, tolRel: 0, csMin: ch(h3).length,
    aide: 'Le groupe –OH prend la place d’un H de l’alcane correspondant et apporte un H : le total ne change pas.',
    pieges: [[2 * n3 + 1, 'Vous avez compté les H portés par les carbones, mais oublié celui du groupe –OH.'], [2 * n3 + 3, 'Le groupe –OH remplace un H de l’alcane, il n’en ajoute pas un de plus : un H part, un H arrive.'], [2 * n3, 'Un alcool saturé non cyclique n’a pas de double liaison ni de cycle : il garde le nombre d’H de l’alcane.']],
    expl: <>Alcane à {n3} carbones : {h3} H ; le groupe –OH remplace un H et en apporte un : <b>{h3}</b> atomes d’hydrogène en tout (formule brute C{n3 > 1 ? indiceTopo(n3) : ''}H{indiceTopo(h3)}O).</> };
  const n4 = tire([3, 4, 5, 6, 7, 8]), h4 = 2 * n4 + 1;
  const q4 = { id: 'tp3', type: 'num', q: <>Un alcool saturé, non cyclique, possède <b>{n4} atomes de carbone</b> et un seul groupe –OH. Combien de liaisons C–H sa molécule compte-t-elle (la liaison O–H n’est pas une liaison C–H) ?</>, unite: 'liaisons C–H', vrai: h4, tolRel: 0, csMin: ch(h4).length,
    aide: 'Partez du nombre total d’atomes d’hydrogène (2n + 2) et retirez celui qui est lié à l’oxygène.',
    pieges: [[2 * n4 + 2, 'Vous avez compté aussi l’atome d’hydrogène du groupe –OH : il est lié à l’oxygène, pas à un carbone.'], [2 * n4, 'Il faut compter les H des carbones : 2n + 2 en tout, moins celui du groupe –OH.'], [2 * n4 + 3, 'Vérifiez le nombre total d’H : 2n + 2, pas 2n + 3.']],
    expl: <>Nombre total d’atomes d’hydrogène : 2 × {n4} + 2 = {2 * n4 + 2} ; l’un est lié à l’oxygène (groupe –OH), les autres le sont à un carbone : <b>{h4}</b> liaisons C–H.</> };
  const n5 = tire([4, 5, 6, 7, 8]), u5 = tire([0, 1]), m5 = 2 * n5 + 2 - 2 * u5, M5 = 12.0 * n5 + 1.0 * m5;
  const q5 = { id: 'tp4', type: 'num', q: <>Calculez la masse molaire de l’hydrocarbure de formule brute <b>C{indiceTopo(n5)}H{indiceTopo(m5)}</b> (en g/mol), avec M(C) = 12,0 g/mol et M(H) = 1,0 g/mol (2 chiffres significatifs).</>, unite: 'g/mol', vrai: M5, tolRel: 0.05, csMin: 2,
    aide: 'M = nombre de C × M(C) + nombre de H × M(H).',
    pieges: [[12.0 * n5, 'Vous avez oublié les atomes d’hydrogène : ils comptent aussi dans la masse molaire.'], [1.0 * m5, 'Vous avez oublié les atomes de carbone : ils représentent l’essentiel de la masse.'], [13.0 * (n5 + m5), 'Il faut multiplier chaque nombre d’atomes par la masse molaire de son élément, pas par 13.'], [12.0 * n5 + 2 * m5, 'M(H) vaut 1,0 g/mol, pas 2,0 g/mol.']],
    expl: <>M = {n5} × 12,0 + {m5} × 1,0 = {ch(12.0 * n5)} + {ch(m5)} = <b>{ch(M5)}</b> g/mol.</> };
  [q1, q2, q3, q4, q5].forEach(tolOk);
  return { intro: 'Formules topologiques : retrouver le nombre d’atomes d’hydrogène (4 liaisons par carbone, une double liaison ou un cycle retire 2 H), les liaisons C–H d’un alcool et la masse molaire.', questions: [q1, q2, q3, q4, q5],
    retenir: ['Un carbone fait toujours 4 liaisons ; les liaisons qui ne servent pas à relier des atomes lourds sont des liaisons C–H.', 'Chaîne saturée non cyclique de n carbones : 2n + 2 atomes d’hydrogène. Une double liaison C=C ou un cycle retire 2 H.', 'Le groupe –OH d’un alcool remplace un H et en apporte un : le nombre total d’H ne change pas.', 'Les liaisons C–H sont celles qui relient un H à un carbone : l’H du groupe –OH est lié à l’oxygène.'] };
}

function genRCTG() {
  // Circuit RC (TG, sim 174). Données écrites en décimales fixes (comme l'élève les lit) ; pièges conservés seulement hors de 1,5 × la tolérance (plancher 8 %).
  const tolOk = q => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 1.5 * q.tolRel * Math.abs(q.vrai), 0.08 * Math.abs(q.vrai))); };
  const d = x => String(x).replace('.', ',');                       // valeurs de menus propres : 2,2 ; 0,47 ; 10
  const f = (x, k) => Number(x).toFixed(k).replace('.', ',');
  const RS = [1, 2.2, 4.7, 10, 22, 47], CS = [0.47, 1, 4.7, 10, 22, 47, 100];
  const R1 = tire(RS), C1 = tire(CS), t1 = R1 * C1;
  const q1 = { id: 'rc0', type: 'num', q: <>Un résistor de résistance <b>R = {d(R1)}{NB}kΩ</b> est associé en série à un condensateur de capacité <b>C = {d(C1)}{NB}µF</b>. Calculez le temps caractéristique τ du circuit (en ms, 2 chiffres significatifs).</>, unite: 'ms', vrai: t1, tolRel: 0.05, csMin: 2,
    aide: 'τ = R × C : avec R en kΩ et C en µF, le produit est directement en ms (1 kΩ × 1 µF = 1 ms).',
    pieges: [[t1 * 1000, 'Vous avez converti un seul des deux préfixes : kΩ × µF = ms (10³ × 10⁻⁶ = 10⁻³).'], [R1 / C1, 'Il faut multiplier R par C, pas les diviser.'], [R1 + C1, 'Le temps caractéristique est le produit R × C, pas la somme.'], [t1 / 1000, 'Vous avez donné τ en secondes : la réponse est attendue en ms (kΩ × µF = ms).']],
    expl: <>τ = R × C = {d(R1)}{NB}kΩ × {d(C1)}{NB}µF = <b>{nb(t1, 3)}{NB}ms</b> (kΩ × µF = ms ; soit {nb(t1 / 1000, 3)}{NB}s).</> };
  const R2 = tire(RS), C2 = tire(CS), t2 = Number((R2 * C2).toPrecision(2)), c2 = t2 / R2;
  const q2 = { id: 'rc1', type: 'num', q: <>On mesure sur un montage le temps caractéristique <b>τ = {d(t2)}{NB}ms</b>. Le résistor a une résistance <b>R = {d(R2)}{NB}kΩ</b>. Calculez la capacité C du condensateur (en µF, 2 chiffres significatifs).</>, unite: 'µF', vrai: c2, tolRel: 0.05, csMin: 2,
    aide: 'τ = R × C donc C = τ divisée par R ; avec τ en ms et R en kΩ, C est en µF.',
    pieges: [[t2 * R2, 'Il faut diviser τ par R, pas les multiplier.'], [R2 / t2, 'Le rapport est inversé : C = τ divisée par R.'], [c2 * 1000, 'Vous avez donné C en nF : la réponse est attendue en µF (ms divisées par kΩ donnent des µF).'], [c2 / 1000, 'Vous avez donné C en mF : ms divisées par kΩ donnent directement des µF.']],
    expl: <>C = {avecIndices('frac(τ|R)')} = {avecIndices(`frac(${d(t2)} ms|${d(R2)} kΩ)`)} = <b>{nb(c2, 3)}{NB}µF</b> (ms divisées par kΩ = µF).</> };
  const E3 = tire([3, 5, 6, 9, 12]), R3 = tire([1, 2.2, 4.7, 10, 22, 47]), i3 = E3 / R3;
  const q3 = { id: 'rc2', type: 'num', q: <>Un condensateur initialement déchargé est relié, par un résistor de résistance <b>R = {d(R3)}{NB}kΩ</b>, à un générateur de tension <b>E = {E3}{NB}V</b>. À l’instant où l’on ferme l’interrupteur (t = 0), calculez l’intensité i(0) du courant (en mA, 2 chiffres significatifs).</>, unite: 'mA', vrai: i3, tolRel: 0.05, csMin: 2,
    aide: 'À t = 0, u_C = 0 : toute la tension E est aux bornes du résistor. u_R = E = R × i donc i = E divisée par R (V divisés par kΩ donnent des mA).',
    pieges: [[0, 'À t = 0, l’intensité n’est pas nulle : u_C = 0, donc toute la tension E est aux bornes du résistor.'], [E3 * R3, 'Il faut diviser E par R (loi d’Ohm : i = u_R divisée par R), pas les multiplier.'], [R3 / E3, 'Le rapport est inversé : i = E divisée par R.'], [i3 * 1000, 'Vous avez donné i en µA : V divisés par kΩ donnent directement des mA.']],
    expl: <>À t = 0, u_C = 0, donc u_R = E : i(0) = {avecIndices('frac(E|R)')} = {avecIndices(`frac(${E3} V|${d(R3)} kΩ)`)} = <b>{nb(i3, 3)}{NB}mA</b>.</> };
  const E4 = tire([3, 5, 6, 9, 12]), n4 = tire([1, 2, 3]), ch = tire(['charge', 'decharge']), u4 = ch === 'charge' ? E4 * (1 - Math.exp(-n4)) : E4 * Math.exp(-n4);
  const R4 = tire([2.2, 4.7, 10, 22]), C4 = tire([1, 4.7, 10, 47]);
  const q4 = { id: 'rc3', type: 'num', q: <>Un condensateur de capacité <b>C = {d(C4)}{NB}µF</b>, associé à un résistor de <b>R = {d(R4)}{NB}kΩ</b>, {ch === 'charge' ? <>est chargé sous <b>E = {E4}{NB}V</b> (il était déchargé à t = 0)</> : <>est déchargé (il était chargé sous <b>E = {E4}{NB}V</b> à t = 0)</>}. Calculez la tension u<sub>C</sub> à l’instant <b>t = {n4}{NB}τ</b> (en V, 2 chiffres significatifs).</>, unite: 'V', vrai: u4, tolRel: 0.05, csMin: 2,
    aide: ch === 'charge' ? 'Charge : u_C = E × (1 − e⁻ⁿ), où n = frac(t|τ) (ici n est le nombre indiqué dans « t = n τ »).' : 'Décharge : u_C = E × e⁻ⁿ, où n = frac(t|τ) (ici n est le nombre indiqué dans « t = n τ »).',
    pieges: [[ch === 'charge' ? E4 * Math.exp(-n4) : E4 * (1 - Math.exp(-n4)), ch === 'charge' ? 'Vous avez utilisé la formule de la décharge : en charge, u_C = E × (1 − e⁻ⁿ), avec n = frac(t|τ).' : 'Vous avez utilisé la formule de la charge : en décharge, u_C = E × e⁻ⁿ, avec n = frac(t|τ).'], [E4, 'u_C ne vaut E ni à t = 0 en charge ni plus tard en un temps fini : revoyez l’exponentielle.'], [E4 * n4 / 4, 'Revoyez la forme de la solution : elle fait intervenir l’exponentielle e⁻ⁿ, avec n = frac(t|τ).']],
    expl: ch === 'charge' ? <>u<sub>C</sub> = E × (1 − e<sup>−{n4}</sup>) = {E4} × {nb(1 - Math.exp(-n4), 4)} = <b>{nb(u4, 3)}{NB}V</b>.</> : <>u<sub>C</sub> = E × e<sup>−{n4}</sup> = {E4} × {nb(Math.exp(-n4), 4)} = <b>{nb(u4, 3)}{NB}V</b>.</> };
  const R5 = tire([1, 2.2, 4.7, 10, 22]), C5 = tire([1, 4.7, 10, 47, 100]), t5 = 5 * R5 * C5 / 1000;
  const q5 = { id: 'rc4', type: 'num', q: <>Un condensateur de capacité <b>C = {d(C5)}{NB}µF</b> est chargé à travers un résistor de résistance <b>R = {d(R5)}{NB}kΩ</b>. On considère la charge pratiquement terminée au bout d’une durée égale à 5{NB}τ. Calculez cette durée (en s, 2 chiffres significatifs).</>, unite: 's', vrai: t5, tolRel: 0.05, csMin: 2,
    aide: 'τ = R × C (kΩ × µF = ms) ; la durée vaut 5 τ ; puis convertissez les ms en s (1 s = 1 000 ms).',
    pieges: [[t5 / 5, 'Vous avez calculé τ seul : la durée demandée est 5 τ.'], [t5 * 1000, 'Vous avez donné la durée en ms : la réponse est attendue en s.'], [t5 * 3 / 5, 'Vous avez pris 3 τ (95 % de E) : on demande 5 τ.'], [R5 * C5 * 5 * 1e-6, 'Vous avez converti R et C en unités SI de façon incohérente : kΩ × µF = ms.']],
    expl: <>τ = R × C = {d(R5)}{NB}kΩ × {d(C5)}{NB}µF = {nb(R5 * C5, 3)}{NB}ms ; 5{NB}τ = {nb(5 * R5 * C5, 3)}{NB}ms = <b>{nb(t5, 3)}{NB}s</b>.</> };
  void f;
  [q1, q2, q3, q4, q5].forEach(tolOk);
  return { intro: 'Circuit RC série : temps caractéristique, capacité, intensité initiale, tension à t = n τ et durée de la charge. Les valeurs de R et de C sont des valeurs usuelles de laboratoire ; le modèle suppose une source, un résistor et un condensateur idéaux.', questions: [q1, q2, q3, q4, q5],
    retenir: ['Temps caractéristique : τ = R × C ; ohm × farad = seconde ; en pratique kΩ × µF = ms.', 'À t = 0 en charge (condensateur déchargé) : u_C = 0, u_R = E, donc i(0) = frac(E|R).', 'Avec n = frac(t|τ) : charge u_C = E × (1 − e⁻ⁿ) ; décharge u_C = E × e⁻ⁿ ; à t = τ : 63 % (charge) ou 37 % (décharge) de E.', 'Au bout de 5 τ, la charge ou la décharge est pratiquement terminée (99 % de E atteints, ou moins de 1 % restant).'] };
}

function genKeplerTG() {
  // Satellites et lois de Kepler (TG, sim 177). Données écrites en décimales fixes (comme l'élève les lit) ; pièges conservés seulement hors de 1,5 × la tolérance (plancher 8 %).
  const tolOk = q => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 1.5 * q.tolRel * Math.abs(q.vrai), 0.08 * Math.abs(q.vrai))); };
  const f = (x, k) => Number(x).toFixed(k).replace('.', ',');
  const ent = x => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  const G = KEP.G, UN = { terre: [5.97e24, 6.37e6, 86164], mars: [6.42e23, 3.39e6, 88642], jupiter: [1.90e27, 7.15e7, 35730] };
  const sci = (x, k = 2) => { const [m, e] = Number(x).toExponential(k).split('e'); return `${m.replace('.', ',')}${NB}×${NB}10${sup(Number(e))}`; };
  const rac = (...c) => <math style={{ whiteSpace: 'nowrap', fontSize: '1.05em' }}><msqrt>{c}</msqrt></math>;
  // 1 : accélération à l'altitude h autour de la Terre
  const h1 = tire([400, 800, 1200, 2000, 5000]), r1 = UN.terre[1] + h1 * 1e3, a1 = KEP.acceleration(UN.terre[0], r1);
  const q1 = { id: 'kep0', type: 'num', q: <>Un satellite décrit une orbite circulaire à l’altitude <b>h = {ent(h1)}{NB}km</b> autour de la Terre. Calculez la norme a de son accélération (en m/s², 2 chiffres significatifs).</>, unite: 'm/s²', vrai: a1, tolRel: 0.05, csMin: 2,
    aide: 'a = frac(G M|r²), avec r la distance au centre de la Terre : r = R_T + h, en mètres.',
    pieges: [[KEP.acceleration(UN.terre[0], h1 * 1e3), 'Vous avez utilisé l’altitude h à la place de la distance r au centre de la Terre : r = R_T + h.'], [KEP.acceleration(UN.terre[0], r1 / 1e3), 'r doit être en mètres, pas en kilomètres.'], [KEP.acceleration(UN.terre[0], UN.terre[1]), 'Vous avez utilisé le rayon de la Terre : la distance à prendre est r = R_T + h.'], [G * UN.terre[0] / r1, 'Dans a = frac(G M|r²), la distance r est élevée au carré.']],
    expl: <>r = R_T + h = {f(UN.terre[1] / 1e6, 2)}×10⁶{NB}m + {f(h1 / 1e3, 1)}×10⁶{NB}m = {f(r1 / 1e6, 2)}×10⁶{NB}m ; a = {avecIndices('frac(G M|r²)')} = <b>{f(a1, 2)}{NB}m/s²</b>.</> };
  // 2 : vitesse autour de Mars, à la distance r du centre
  const r2k = tire([3800, 4200, 5000, 6500, 9380, 23460]), v2 = KEP.vitesse(UN.mars[0], r2k * 1e3) / 1e3;
  const q2 = { id: 'kep1', type: 'num', q: <>Une sonde décrit une orbite circulaire autour de Mars (masse <b>M = {sci(UN.mars[0])}{NB}kg</b>), à la distance <b>r = {ent(r2k)}{NB}km</b> du centre de la planète. Calculez la valeur v de sa vitesse (en km/s, 2 chiffres significatifs).</>, unite: 'km/s', vrai: v2, tolRel: 0.05, csMin: 2,
    aide: 'Orbite circulaire : v² = frac(G M|r), avec r en mètres et M en kg ; v sort en m/s, à convertir en km/s.',
    pieges: [[G * UN.mars[0] / (r2k * 1e3) / 1e3, 'Vous avez oublié la racine carrée : v² = frac(G M|r), donc v est la racine carrée de ce résultat.'], [Math.sqrt(G * UN.mars[0] / r2k) / 1e3, 'r doit être en mètres, pas en kilomètres.'], [Math.sqrt(G * UN.mars[0] / (r2k * 1e3) / 1e3), 'Vous avez pris la racine carrée de G M / r puis divisé encore par 1 000 : convertissez seulement le résultat final (m/s en km/s).'], [KEP.vitesse(UN.mars[0], r2k * 1e3 * 1e3) / 1e3, 'Vérifiez la conversion de r en mètres : 1 km = 1 000 m.']],
    expl: <>{rac(avecIndices(`frac(G M|r)`))} : v = {rac(<math style={{ whiteSpace: 'nowrap' }}><mfrac><mrow><mn>{f(G * 1e11, 2)}</mn><mo>×</mo><mn>10⁻¹¹</mn><mo>×</mo><mn>{f(UN.mars[0] / 1e23, 2)}</mn><mo>×</mo><mn>10²³</mn></mrow><mrow><mn>{f(r2k / 1e3, 3)}</mn><mo>×</mo><mn>10⁶</mn></mrow></mfrac></math>)} = <b>{f(v2, 2)}{NB}km/s</b>.</> };
  // 3 : période d'un satellite de Jupiter
  const r3k = tire([422, 671, 1070, 1880]), T3 = KEP.periode(UN.jupiter[0], r3k * 1e6) / KEP.JOUR;
  const q3 = { id: 'kep2', type: 'num', q: <>Un satellite de Jupiter (masse <b>M = {sci(UN.jupiter[0])}{NB}kg</b>) décrit une orbite circulaire de rayon <b>r = {ent(r3k)}{NB}×{NB}10³{NB}km</b>. Calculez sa période de révolution T (en jours, 2 chiffres significatifs).</>, unite: 'jours', vrai: T3, tolRel: 0.05, csMin: 2,
    aide: 'Troisième loi : T² = frac(4π² r³|G M), avec r en mètres : T sort en secondes (1 jour = 86 400 s).',
    pieges: [[T3 * KEP.JOUR, 'Vous avez donné T en secondes : on demande des jours (1 jour = 86 400 s).'], [T3 * 24, 'Vous avez donné T en heures : on demande des jours.'], [Math.sqrt(4 * Math.PI * Math.PI * Math.pow(r3k * 1e3, 3) / (G * UN.jupiter[0])) / KEP.JOUR, 'r doit être en mètres : 1 km = 1 000 m.'], [Math.sqrt(Math.pow(r3k * 1e6, 3) / (G * UN.jupiter[0])) / KEP.JOUR, 'Il manque le facteur 4π² sous la racine carrée.']],
    expl: <>T² = {avecIndices('frac(4π² r³|G M)')}, donc T = {f(T3 * KEP.JOUR, 0)}{NB}s = <b>{f(T3, 2)}{NB}jours</b>.</> };
  // 4 : masse de l'astre central d'après r et T (données arrondies à 2 chiffres significatifs AVANT le calcul)
  const sats = [[9380, 0.319, 'Phobos'], [23460, 1.263, 'Deimos']], [r4k, T4b] = tire(sats), T4 = Number(T4b.toPrecision(3)), M4 = KEP.masseDepuis(r4k * 1e3, T4 * KEP.JOUR) / 1e23;
  const q4 = { id: 'kep3', type: 'num', q: <>Un satellite décrit une orbite circulaire de rayon <b>r = {ent(r4k)}{NB}km</b> autour d’une planète, avec une période <b>T = {f(T4, T4 < 1 ? 3 : 2)}{NB}jours</b>. Calculez la masse M de la planète (en 10²³ kg, 2 chiffres significatifs).</>, unite: '× 10²³ kg', vrai: M4, tolRel: 0.05, csMin: 2,
    aide: 'Troisième loi : frac(T²|r³) = frac(4π²|G M), donc M = frac(4π² r³|G T²), avec r en mètres et T en secondes.',
    pieges: [[M4 * 1e3, 'Vérifiez les puissances de 10 : la réponse est demandée en 10²³ kg.'], [M4 / (4 * Math.PI * Math.PI), 'Vous avez oublié le facteur 4π² dans l’expression de la masse.'], [M4 * Math.pow(KEP.JOUR, 2), 'Vous avez gardé T en jours : T doit être en secondes (1 jour = 86 400 s).'], [KEP.masseDepuis(r4k * 1e3, T4 * KEP.JOUR) / 1e23 / 1e9, 'Vous avez gardé r en kilomètres : r doit être en mètres.']],
    expl: <>M = {avecIndices('frac(4π² r³|G T²)')} = <b>{f(M4, 1)}{NB}×{NB}10²³{NB}kg</b> (r = {f(r4k * 1e3 / 1e6, 2)}×10⁶{NB}m, T = {ent(T4 * KEP.JOUR)}{NB}s).</> };
  // 5 : altitude de l'orbite stationnaire (Terre, Mars ou Jupiter)
  const nom5 = tire(['terre', 'mars', 'jupiter']), [M5, R5, Ts5] = UN[nom5], rs = KEP.rayonDepuis(M5, Ts5), h5 = (rs - R5) / 1e3;
  const NOMS = { terre: 'la Terre', mars: 'Mars', jupiter: 'Jupiter' };
  const q5 = { id: 'kep4', type: 'num', q: <>On veut placer un satellite sur une orbite stationnaire autour de {NOMS[nom5]} (masse <b>M = {sci(M5)}{NB}kg</b>, rayon <b>R = {ent(R5 / 1e3)}{NB}km</b>, période de rotation <b>T = {ent(Ts5)}{NB}s</b>). Calculez son altitude h (en km, 3 chiffres significatifs).</>, unite: 'km', vrai: h5, tolRel: 0.05, csMin: 3,
    aide: 'Troisième loi : r³ = frac(G M T²|4π²), r en mètres ; puis h = r − R.',
    pieges: [[rs / 1e3, 'Vous avez donné la distance r au centre de l’astre : l’altitude est r − R.'], [(rs + R5) / 1e3, 'Il faut retrancher le rayon de l’astre à r, pas l’ajouter.'], [(G * M5 * Ts5 * Ts5 / (4 * Math.PI * Math.PI)) / 1e3, 'r³ = frac(G M T²|4π²) : il faut encore prendre la racine cubique pour obtenir r.'], [KEP.rayonDepuis(M5, Ts5 / 3600) / 1e3 - R5 / 1e3, 'T doit être en secondes, pas en heures.']],
    expl: <>r³ = {avecIndices('frac(G M T²|4π²)')}, donc r = {f(rs / 1e6, 2)}×10⁶{NB}m ; h = r − R = <b>{ent(h5)}{NB}km</b>.</> };
  [q1, q2, q3, q4, q5].forEach(tolOk);
  return { intro: 'Satellites et lois de Kepler : accélération, vitesse, période, masse de l’astre et orbite stationnaire. Constante de gravitation G = 6,67 × 10⁻¹¹ N·m²·kg⁻² ; la masse de la Terre vaut 5,97 × 10²⁴ kg et son rayon 6,37 × 10³ km. Les orbites sont supposées circulaires ; l’astre est à symétrie sphérique et la masse du satellite est négligeable devant la sienne.', questions: [q1, q2, q3, q4, q5],
    retenir: ['Orbite circulaire : a = frac(G M|r²) ; v² = frac(G M|r) ; T = frac(2π r|v) ; r est la distance au centre de l’astre (r = R + h).', 'Troisième loi de Kepler : frac(T²|r³) = frac(4π²|G M), avec r en mètres et T en secondes : on peut en déduire T, r ou M.', 'Satellite géostationnaire : plan de l’équateur, sens de rotation de la Terre, T = jour sidéral (86 164 s) ; altitude ≈ 3,6×10⁴ km.', 'La masse du satellite n’intervient jamais dans a, v et T.'] };
}

function genUvvTG() {
  // pièges conservés seulement s'ils restent hors de la tolérance de la bonne réponse (tolérance × 1,5, plancher 8 %)
  const tolOk = q => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 1.5 * q.tolRel * Math.abs(q.vrai), 0.08 * Math.abs(q.vrai))); };
  // nb() prend des chiffres SIGNIFICATIFS : les données s'écrivent ici en décimales fixes, exactement comme l'élève les lira
  const d = (x, k) => Number(x).toFixed(k).replace('.', ',');
  const epsT = e => { const [m, ex] = Number(e).toExponential(1).split('e'); return `${m.replace('.', ',')}×10${sup(Number(ex))}`; };
  const EPS = [2.3e4, 2.5e4, 2.7e4, 1.0e5], AS = [0.312, 0.428, 0.556, 0.684, 0.815, 1.046];
  const e1 = tire(EPS), A1 = tire(AS), l1 = tire([0.50, 2.00]), c1 = A1 / (e1 * l1) * 1e6;
  const q1 = { id: 'uv0', type: 'num', q: <>Un colorant est placé dans une cuve de longueur <b>{d(l1, 2)}{NB}cm</b>. Au maximum d’absorption, son absorbance vaut <b>A = {d(A1, 3)}</b> et son coefficient d’absorption molaire <b>ε = {epsT(e1)}{NB}L·mol⁻¹·cm⁻¹</b>. Calculez sa concentration c (en µmol/L, 2 chiffres significatifs).</>, unite: 'µmol/L', vrai: c1, tolRel: 0.05, csMin: 2,
    aide: 'Loi de Beer-Lambert : A = ε × l × c, donc c = A divisée par (ε × l), en mol/L si ε est en L·mol⁻¹·cm⁻¹ et l en cm ; puis × 10⁶ pour des µmol/L.',
    pieges: [[c1 * 1e-6, 'Vous avez donné c en mol/L : convertissez en µmol/L (multipliez par 10⁶).'], [A1 / e1 * 1e6, 'Vous avez oublié la longueur de la cuve l : c = A divisée par (ε × l).'], [A1 * e1 * l1, 'Vous avez multiplié A par ε et l : il faut diviser A par (ε × l).'], [c1 * 1e-3, 'Vous avez donné c en mmol/L : 1 mmol/L = 1 000 µmol/L.']],
    expl: <>c = {avecIndices('frac(A|ε × l)')} = {avecIndices(`frac(${d(A1, 3)}|${epsT(e1)} × ${d(l1, 2)})`)} = <b>{d(c1, 1)}{NB}µmol/L</b>.</> };
  const e2 = tire(EPS), A2t = tire([0.30, 0.50, 0.70, 0.90, 1.10]), l2 = tire([0.50, 2.00]), c2 = Number((A2t / (e2 * l2) * 1e6).toPrecision(2)), A2 = e2 * l2 * c2 * 1e-6;
  const q2 = { id: 'uv1', type: 'num', q: <>Une solution d’un colorant a une concentration <b>c = {d(c2, c2 < 10 ? 2 : 1)}{NB}µmol/L</b>. Sa cuve a une longueur de <b>{d(l2, 2)}{NB}cm</b> et ε = <b>{epsT(e2)}{NB}L·mol⁻¹·cm⁻¹</b>. Calculez son absorbance A au maximum d’absorption (2 chiffres significatifs).</>, unite: '', vrai: A2, tolRel: 0.05, csMin: 2,
    aide: 'A = ε × l × c, avec c en mol/L : convertissez d’abord les µmol/L (1 µmol/L = 10⁻⁶ mol/L).',
    pieges: [[A2 * 1e6, 'Vous n’avez pas converti c en mol/L : c = valeur × 10⁻⁶ mol/L.'], [e2 * c2 * 1e-6, 'Vous avez oublié la longueur de la cuve l : A = ε × l × c.'], [A2 * 1e-3, 'Vous avez converti c comme si les µmol/L étaient des mmol/L (10⁻³ au lieu de 10⁻⁶) : revoyez la conversion.'], [A2 / (e2 * l2 * 1e-6) / 1e6, 'Vous avez divisé au lieu de multiplier : A = ε × l × c.']],
    expl: <>A = ε × l × c = {epsT(e2)} × {d(l2, 2)} × {d(c2, c2 < 10 ? 2 : 1)}×10⁻⁶ = <b>{d(A2, 2)}</b> (sans unité).</> };
  const e3 = tire(EPS), A3 = tire(AS), l3 = 1.00, F3 = tire([5, 10]), cd3 = A3 / (e3 * l3) * 1e6, c3 = cd3 * F3;
  const q3 = { id: 'uv2', type: 'num', q: <>Une boisson colorée est diluée <b>{F3}{NB}fois</b>. La solution diluée, dans une cuve de <b>{d(l3, 2)}{NB}cm</b>, a une absorbance <b>A = {d(A3, 3)}</b> au maximum d’absorption (ε = <b>{epsT(e3)}{NB}L·mol⁻¹·cm⁻¹</b>). Calculez la concentration du colorant dans la boisson initiale (en µmol/L, 2 chiffres significatifs).</>, unite: 'µmol/L', vrai: c3, tolRel: 0.08, csMin: 2,
    aide: 'D’abord c′ = A divisée par (ε × l) pour la solution diluée, puis la boisson initiale est F fois plus concentrée : c = F × c′.',
    pieges: [[cd3, 'Vous avez donné la concentration de la solution diluée : multipliez par le facteur de dilution.'], [cd3 / F3, 'Il faut multiplier par F (pas diviser) : la boisson initiale est plus concentrée que la solution diluée.'], [c3 * 1e-6, 'Vous avez donné c en mol/L : convertissez en µmol/L (multipliez par 10⁶).'], [cd3 * F3 * F3, 'Le facteur de dilution s’applique une seule fois : c = F × c′.']],
    expl: <>c′ = {avecIndices('frac(A|ε × l)')} = {avecIndices(`frac(${d(A3, 3)}|${epsT(e3)} × ${d(l3, 2)})`)} = {d(cd3, 1)}{NB}µmol/L ; c = {F3} × c′ = <b>{d(c3, 0)}{NB}µmol/L</b>.</> };
  // couples (ε, l, c) donnant une absorbance dans le domaine de validité (0,1 ≤ A ≤ 1,2)
  const C4 = []; EPS.forEach(ee => [0.50, 1.00, 2.00].forEach(ll => [6.0, 8.0, 10.0, 12.0, 15.0].forEach(cc => { const a = ee * ll * cc * 1e-6; if (a >= 0.1 && a <= 1.2) C4.push([ee, ll, cc]); })));
  const [e4t, l4, c4] = tire(C4), A4 = Number((e4t * l4 * c4 * 1e-6).toFixed(3)), e4 = A4 / (l4 * c4 * 1e-6);
  const q4 = { id: 'uv3', type: 'num', q: <>Pour déterminer le coefficient d’absorption molaire ε d’un colorant, on mesure l’absorbance au maximum d’absorption d’une solution de concentration <b>c = {d(c4, 1)}{NB}µmol/L</b> dans une cuve de <b>{d(l4, 2)}{NB}cm</b> : <b>A = {d(A4, 3)}</b>. Calculez ε (en L·mol⁻¹·cm⁻¹, 2 chiffres significatifs).</>, unite: 'L·mol⁻¹·cm⁻¹', vrai: e4, tolRel: 0.05, csMin: 2,
    aide: 'A = ε × l × c, donc ε = A divisée par (l × c), avec c en mol/L (1 µmol/L = 10⁻⁶ mol/L) et l en cm.',
    pieges: [[e4 * 1e-6, 'Vous n’avez pas converti c en mol/L : c = valeur × 10⁻⁶ mol/L.'], [A4 / (c4 * 1e-6), 'Vous avez oublié la longueur de la cuve l : ε = A divisée par (l × c).'], [A4 * l4 * c4 * 1e-6, 'Il faut diviser A par l × c, pas multiplier.'], [e4 * 1e-3, 'Vous avez converti c comme si les µmol/L étaient des mmol/L : 1 µmol/L = 10⁻⁶ mol/L.']],
    expl: <>ε = {avecIndices('frac(A|l × c)')} = {avecIndices(`frac(${d(A4, 3)}|${d(l4, 2)} × ${d(c4, 1)}×10⁻⁶)`)} = <b>{epsT(e4)}{NB}L·mol⁻¹·cm⁻¹</b>.</> };
  const A5 = tire([0.312, 0.428, 0.556, 0.684, 0.815]), F5 = tire([5, 10]), M5 = 194, cd5 = A5 / (9.8e3 * 1.00), c5 = cd5 * F5 * M5 * 1e3;       // mg/L
  const q5 = { id: 'uv4', type: 'num', q: <>On dose la caféine (ε = <b>{epsT(9.8e3)}{NB}L·mol⁻¹·cm⁻¹</b> à 273{NB}nm, masse molaire <b>M = {M5}{NB}g/mol</b>) d’une boisson diluée <b>{F5}{NB}fois</b>, dans une cuve de <b>1,00{NB}cm</b> : <b>A = {d(A5, 3)}</b>. Calculez la concentration massique de la boisson initiale (en mg/L, 2 chiffres significatifs).</>, unite: 'mg/L', vrai: c5, tolRel: 0.08, csMin: 2,
    aide: 'c′ = A divisée par (ε × l) en mol/L ; boisson initiale : c = F × c′ ; puis concentration massique = c × M, en g/L, à convertir en mg/L (1 g = 1 000 mg).',
    pieges: [[c5 / 1000, 'Vous avez donné le résultat en g/L : 1 g/L = 1 000 mg/L.'], [c5 / F5, 'Vous avez oublié le facteur de dilution : la boisson initiale est F fois plus concentrée.'], [cd5 * F5 * 1e6, 'Vous avez donné la concentration molaire en µmol/L : il faut la multiplier par la masse molaire M (en g/mol).'], [c5 / M5, 'Il faut multiplier la concentration molaire par M (pas diviser) pour obtenir une concentration massique.']],
    expl: <>c′ = {avecIndices('frac(A|ε × l)')} = {avecIndices(`frac(${d(A5, 3)}|${epsT(9.8e3)} × 1,00)`)} = {mol5(cd5)} mol/L ; c = {F5} × c′ ; concentration massique = c × M = <b>{d(c5, 0)}{NB}mg/L</b>.</> };
  [q1, q2, q3, q4, q5].forEach(tolOk);
  return { intro: 'Spectrophotométrie UV-visible : loi de Beer-Lambert, concentration, absorbance, dilution et concentration massique. Les valeurs de ε sont des ordres de grandeur typiques ; la loi n’est valable que pour A ≲ 1,5 à 2.', questions: [q1, q2, q3, q4, q5],
    retenir: ['Loi de Beer-Lambert : A = ε × l × c ; c = A divisée par (ε × l), avec ε en L·mol⁻¹·cm⁻¹, l en cm, c en mol/L.', 'Conversions : 1 µmol/L = 10⁻⁶ mol/L ; 1 mmol/L = 10⁻³ mol/L ; concentration massique = c × M.', 'Solution diluée F fois : c(initiale) = F × c′ (c′ = concentration de la solution diluée, mesurée).', 'Domaine de validité : solution diluée, lumière monochromatique, A ≲ 1,5 à 2 ; au-delà, on dilue. On travaille au maximum d’absorption λ_max.'] };
}
const mol5 = x => { const e = Math.floor(Math.log10(x)); return `${(x / Math.pow(10, e)).toFixed(1).replace('.', ',')}×10${sup(e)}`; };
// Spectroscopie infrarouge (TG, sim 170) : λ ↔ σ et lecture des lignes d'un tableau de données tabulées.
// Les nombres sont écrits en décimales fixes (d), exactement comme l'élève les lira ; nb() prend des chiffres significatifs et n'est pas utilisé pour les données.
const IRT_LIGNES = [['C=O d’un ester', 1735, 1750], ['C=O d’un aldéhyde ou d’une cétone', 1705, 1740], ['C=O d’un acide carboxylique', 1700, 1725], ['C=O d’un amide', 1650, 1700], ['C=C d’un alcène', 1625, 1685]];
const irtCompte = s => IRT_LIGNES.filter(([, a, b]) => s >= a && s <= b).length;
// longueurs d'onde (µm) dont le nombre d'onde est à plus de 8 cm⁻¹ de toute borne, y compris une fois arrondi à 3 chiffres significatifs ou à l'entier : le comptage des lignes ne dépend pas de l'arrondi de l'élève
export const IRT_LAM = (() => {
  const res = [];
  for (let l = 555; l <= 620; l++) {
    const lam = l / 100, s = 1e4 / lam, marge = Math.min(...IRT_LIGNES.flatMap(([, a, b]) => [Math.abs(s - a), Math.abs(s - b)]));
    const arr3 = Number(s.toPrecision(3)), arr0 = Math.round(s);
    if (marge >= 8 && irtCompte(s) === irtCompte(arr3) && irtCompte(s) === irtCompte(arr0) && irtCompte(s) >= 1) res.push(lam);
  }
  return res;
})();
function genIrTabTG() {
  const tolOk = q => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 0.08 * Math.abs(q.vrai))); };
  const d = (x, k) => Number(x).toFixed(k).replace('.', ',');
  // 4 chiffres : sans séparateur (1715) ; espace insécable à partir de 5 chiffres
  const mil = x => { const t = String(Math.round(x)); return t.length >= 5 ? t.replace(/\B(?=(\d{3})+(?!\d))/g, NB) : t; };
  const lam1 = tire([2.90, 3.00, 3.10, 3.30, 5.75, 5.85, 5.95, 6.10]), s1 = 1e4 / lam1;
  const q1 = { id: 'irt0', type: 'num', q: <>Un spectromètre infrarouge indique une bande d’absorption à la longueur d’onde <b>{d(lam1, 2)}{NB}µm</b>. Les tableaux de données donnent les bandes en nombre d’onde. Calculez le nombre d’onde σ de cette bande (en cm⁻¹, 3 chiffres significatifs).</>, unite: 'cm⁻¹', vrai: s1, tolRel: 0.05, csMin: 3,
    aide: 'σ = frac(1|λ) avec λ en cm : 1 µm = 10⁻⁴ cm.',
    pieges: [[1 / lam1, 'Vous avez calculé frac(1|λ) avec λ en µm : convertissez d’abord λ en cm (1 µm = 10⁻⁴ cm).'], [1e6 / lam1, 'Ce résultat est en m⁻¹ : le nombre d’onde se donne en cm⁻¹, divisez par 100.'], [lam1 * 1e4, 'Vous avez multiplié λ par 10⁴ au lieu de calculer son inverse : σ = frac(1|λ).']],
    expl: <>λ = {d(lam1, 2)}{NB}µm = {d(lam1, 2)} × 10⁻⁴{NB}cm ; σ = {avecIndices('frac(1|λ)')} = {avecIndices(`frac(1|${d(lam1, 2)} × 10⁻⁴)`)} = <b>{mil(s1)}{NB}cm⁻¹</b>.</> };
  const lam2 = tire(IRT_LAM), s2 = 1e4 / lam2, n2 = irtCompte(s2);
  const q2 = { id: 'irt1', type: 'num', q: <>Une bande est lue à la longueur d’onde <b>{d(lam2, 2)}{NB}µm</b>. Intervalles tabulés (en cm⁻¹) : {IRT_LIGNES.map(([nom, a, b], i) => <span key={nom}>{i ? ' ; ' : ''}{nom} {a}{NB}–{NB}{b}</span>)}. Après conversion en nombre d’onde, combien de lignes de ce tableau contiennent la valeur obtenue ?</>, unite: 'lignes', vrai: n2, tolRel: 0.006, csMin: 1,
    aide: 'Calculez σ = frac(1|λ) (λ en cm), puis comptez les intervalles dont les deux bornes encadrent σ.',
    pieges: [[0, 'Vous avez comparé λ en µm aux intervalles en cm⁻¹ : aucune ligne ne convient. Convertissez d’abord λ en nombre d’onde.'], [n2 === 1 ? 2 : 1, 'Revérifiez les bornes de chaque intervalle : σ est-il bien compris entre la borne basse et la borne haute ?']],
    expl: <>σ = {avecIndices(`frac(1|${d(lam2, 2)} × 10⁻⁴)`)}{NB}cm⁻¹ = {mil(s2)}{NB}cm⁻¹. Lignes dont l’intervalle contient cette valeur : {IRT_LIGNES.filter(([, a, b]) => s2 >= a && s2 <= b).map(([nom]) => nom).join(' ; ')}, soit <b>{n2}</b>.</> };
  // q3 : deux bandes lues en µm ; combien tombent dans l'intervalle C=O aldéhyde/cétone (1705–1740 cm⁻¹ ; valeurs choisies à plus de 8 cm⁻¹ des bornes) ?
  const dedans = [5.78, 5.80, 5.82], dehors = [5.60, 5.70, 5.90, 6.00, 3.10, 6.10];
  const n3 = tire([1, 2]);
  const a3 = tire(dedans);
  const b3 = n3 === 2 ? tire(dedans.filter(x => x !== a3)) : tire(dehors);
  const lamA = tire([a3, b3]), lamB = lamA === a3 ? b3 : a3;
  const sA = 1e4 / lamA, sB = 1e4 / lamB;
  const q3 = { id: 'irt2', type: 'num', q: <>Deux bandes sont lues aux longueurs d’onde <b>{d(lamA, 2)}{NB}µm</b> et <b>{d(lamB, 2)}{NB}µm</b>. Le tableau donne, pour C=O d’un aldéhyde ou d’une cétone, l’intervalle <b>1705{NB}–{NB}1740{NB}cm⁻¹</b>. Combien de ces deux bandes ont un nombre d’onde dans cet intervalle ?</>, unite: 'bandes', vrai: n3, tolRel: 0.006, csMin: 1,
    aide: 'Convertissez chaque longueur d’onde en nombre d’onde, σ = frac(1|λ) avec λ en cm, puis comparez aux bornes 1705 et 1740 cm⁻¹.',
    pieges: [[n3 === 1 ? 2 : 1, 'Revérifiez chaque bande : après conversion en cm⁻¹, est-elle comprise entre 1705 et 1740 ?'], [0, 'Comparer des µm à des cm⁻¹ ne marche pas : convertissez d’abord chaque λ en nombre d’onde.']],
    expl: <>{d(lamA, 2)}{NB}µm donne σ = {avecIndices(`frac(1|${d(lamA, 2)} × 10⁻⁴)`)} = {mil(sA)}{NB}cm⁻¹ ({sA >= 1705 && sA <= 1740 ? 'dans' : 'hors de'} l’intervalle) ; {d(lamB, 2)}{NB}µm donne σ = {avecIndices(`frac(1|${d(lamB, 2)} × 10⁻⁴)`)} = {mil(sB)}{NB}cm⁻¹ ({sB >= 1705 && sB <= 1740 ? 'dans' : 'hors de'} l’intervalle). Soit <b>{n3}</b> bande{n3 > 1 ? 's' : ''} dans l’intervalle.</> };
  [q1, q2, q3].forEach(tolOk);
  return { intro: 'Spectroscopie infrarouge : passer de la longueur d’onde au nombre d’onde et situer une bande dans un tableau de données.', questions: [q1, q2, q3],
    retenir: ['σ = frac(1|λ), avec λ en cm ; avec λ en µm, σ (cm⁻¹) = frac(10 000|λ).', 'Les tableaux de données donnent des intervalles typiques de nombres d’onde : une valeur peut tomber dans plusieurs lignes.', 'Avant de comparer une bande au tableau, vérifier que les deux sont dans la même grandeur et la même unité (cm⁻¹).'] };
}

// ──────────────────────── Famille « Lunette afocale » (TG, sim 171) ────────────────────────
function genLunetteTG() {
  // un piège doit rester hors de la tolérance de la bonne réponse (tolRel × 1,5, plancher à 2 %)
  const tolOk = q => { const seuil = Math.max(1.5 * q.tolRel, 0.02); q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > seuil * Math.abs(q.vrai)); };
  // nb() prend des chiffres SIGNIFICATIFS : les données et les corrections s'écrivent ici en décimales fixes, exactement comme l'élève les lira
  const d = (x, k) => Number(x).toFixed(k).replace('.', ',');
  const dG = G => d(G, Number.isInteger(G) ? 0 : 1);
  const FO = avecIndices('f′_obj'), FC = avecIndices('f′_oc');
  const f1 = tire([400, 600, 700, 900, 1000]), f2 = tire([10, 20, 25, 40, 50]), G = f1 / f2;
  const q1 = { id: 'lu0', type: 'num', q: <>Une lunette afocale a un objectif de distance focale {FO} = <b>{d(f1, 0)}{NB}mm</b> et un oculaire de distance focale {FC} = <b>{d(f2, 0)}{NB}mm</b>. Calculez son grossissement (sans unité ; donnez la valeur, éventuellement arrondie à 2 chiffres significatifs).</>, unite: '', vrai: G, tolRel: 0.05, csMin: 2,
    aide: 'G est le rapport de la distance focale de l’objectif (f′_obj) à celle de l’oculaire (f′_oc), dans la même unité.',
    pieges: [[f2 / f1, 'Vous avez inversé le rapport : l’objectif a la plus grande focale, donc G est supérieur à 1.'], [f1 * f2, 'G est un rapport, pas un produit des distances focales.'], [f1 + f2, 'Vous avez additionné : f′_obj + f′_oc est la distance O₁O₂, pas le grossissement.'], [f1 - f2, 'Vous avez soustrait : G est le rapport des distances focales.']],
    expl: <>G = <Frac haut={FO} bas={FC}/> = <Frac haut={d(f1, 0)} bas={d(f2, 0)}/> = <b>{dG(G)}</b>.</> };
  const g2 = tire([[400, 50], [600, 40], [700, 25], [900, 40], [1000, 25], [800, 20], [1200, 30]]), a = g2[0], b = g2[1];
  const q2 = { id: 'lu1', type: 'num', q: <>Pour qu’une lunette soit afocale, le foyer image de l’objectif doit coïncider avec le foyer objet de l’oculaire. Quelle distance O₁O₂ doit séparer l’objectif ({FO} = <b>{d(a, 0)}{NB}mm</b>) et l’oculaire ({FC} = <b>{d(b, 0)}{NB}mm</b>) ? (en mm, avec au moins 3 chiffres significatifs)</>, unite: 'mm', vrai: a + b, tolRel: 0.01, csMin: 3,
    aide: 'F′obj et Foc sont confondus : O₁O₂ = O₁F′obj + FocO₂ = f′_obj + f′_oc.',
    pieges: [[a - b, 'Vous avez soustrait : F′obj est entre O₁ et O₂, la distance est la somme des deux distances focales.'], [a, 'Vous avez oublié f′_oc : O₁O₂ = f′_obj + f′_oc.'], [a / b, 'Vous avez divisé : le rapport est le grossissement, pas la distance entre les lentilles.'], [a * b, 'Une distance entre lentilles s’obtient en additionnant les distances focales.']],
    expl: <>O₁O₂ = {FO} + {FC} = {d(a, 0)} + {d(b, 0)} = <b>{d(a + b, 0)}{NB}mm</b>.</> };
  const C3 = []; [600, 700, 800, 900, 1000].forEach(F1 => [8, 10, 12, 15, 20, 25, 30, 40].forEach(F2 => { const g = F1 / F2; if (Number.isInteger(g) && g >= 15 && g <= 100 && Math.abs(g - F2) / F2 > 0.1) C3.push([F1, F2, g]); }));
  const [f13, f23, G3] = tire(C3);
  const q3 = { id: 'lu2', type: 'num', q: <>L’objectif d’une lunette afocale a pour distance focale {FO} = <b>{d(f13, 0)}{NB}mm</b>. On veut un grossissement <b>G = {d(G3, 0)}</b>. Quelle distance focale {FC} doit avoir l’oculaire ? (en mm, 2 chiffres significatifs)</>, unite: 'mm', vrai: f23, tolRel: 0.05, csMin: 2,
    aide: 'G est le rapport f′_obj sur f′_oc : isolez f′_oc, qui vaut f′_obj divisée par G (f′_obj en mm).',
    pieges: [[G3 / f13, 'Vous avez inversé le rapport : f′_oc est f′_obj divisée par G.'], [f13 * G3, 'Vous avez multiplié : f′_oc est f′_obj divisée par G.'], [f13 - G3, 'Vous avez soustrait : G est un rapport, pas une différence.'], [G3, 'C’est le grossissement demandé, pas la distance focale de l’oculaire.']],
    expl: <>{FC} = <Frac haut={FO} bas="G"/> = <Frac haut={d(f13, 0)} bas={d(G3, 0)}/> = <b>{d(f23, 0)}{NB}mm</b>.</> };
  const C4 = []; [[400, 50], [600, 40], [700, 50], [800, 40], [1000, 50], [400, 25], [600, 25], [800, 50]].forEach(([F1, F2]) => [0.20, 0.25, 0.30, 0.40, 0.50, 0.60].forEach(t => { const g = F1 / F2, tp = t * g; if (tp <= 18) C4.push([F1, F2, t]); }));
  const [f14, f24, t4] = tire(C4), G4 = f14 / f24, tp4 = t4 * G4;
  const q4 = { id: 'lu3', type: 'num', q: <>Une lunette afocale a un objectif de distance focale {FO} = <b>{d(f14, 0)}{NB}mm</b> et un oculaire de distance focale {FC} = <b>{d(f24, 0)}{NB}mm</b>. À l’œil nu, on voit un astre sous l’angle <b>θ = {d(t4, 2)}°</b>. Sous quel angle θ′ voit-on le faisceau émergent ? (en degrés, 2 chiffres significatifs)</>, unite: '°', vrai: tp4, tolRel: 0.05, csMin: 2,
    aide: 'Calculez d’abord G, rapport de f′_obj à f′_oc, puis utilisez G = θ′ sur θ : θ′ = G × θ (petits angles ; le résultat s’exprime dans la même unité que θ).',
    pieges: [[t4 / G4, 'Vous avez divisé θ par G : la lunette agrandit l’angle, θ′ = G × θ.'], [t4 + G4, 'Vous avez additionné : θ′ = G × θ.'], [tp4 * Math.PI / 180, 'Valeur de θ′ en radian : la question demande des degrés.'], [t4, 'C’est l’angle à l’œil nu θ : le faisceau émergent est incliné de θ′ = G × θ.']],
    expl: <>G = <Frac haut={d(f14, 0)} bas={d(f24, 0)}/> = {dG(G4)} ; θ′ = G × θ = {dG(G4)} × {d(t4, 2)}° = <b>{d(tp4, 1)}°</b>.</> };
  [q1, q2, q3, q4].forEach(tolOk);
  return { intro: 'Lunette afocale : grossissement, distance entre les lentilles, choix de l’oculaire et angle du faisceau émergent.', questions: [q1, q2, q3, q4],
    retenir: ['Lunette afocale : F′obj et Foc confondus, O₁O₂ = f′_obj + f′_oc, faisceau émergent parallèle.', <>Petits angles : θ ≈ <Frac haut="A₁B₁" bas={FO}/> et θ′ ≈ <Frac haut="A₁B₁" bas={FC}/>, donc G = <Frac haut="θ′" bas="θ"/> = <Frac haut={FO} bas={FC}/> (sans unité, supérieur à 1).</>, 'Fiche « D/f′ » : diamètre puis distance focale de l’objectif ; le diamètre n’intervient pas dans G.'] };
}

// ──────────────────────── Famille « Polymères » (TG, sim 173) ────────────────────────
// Motifs idéalisés : formule brute du motif, nombre de C et masse molaire (C 12,0 ; H 1,0 ; Cl 35,5 g/mol, données de l'énoncé)
const POL_MOTIFS = [
  { nom: 'polyéthylène', motif: '–CH₂–CH₂–', brute: 'C₂H₄', nC: 2, nH: 4, nCl: 0 },
  { nom: 'poly(chlorure de vinyle)', motif: '–CH₂–CHCl–', brute: 'C₂H₃Cl', nC: 2, nH: 3, nCl: 1 },
  { nom: 'polypropylène', motif: '–CH₂–CH(CH₃)–', brute: 'C₃H₆', nC: 3, nH: 6, nCl: 0 },
  { nom: 'polystyrène', motif: '–CH₂–CH(C₆H₅)–', brute: 'C₈H₈', nC: 8, nH: 8, nCl: 0 },
];
// segments de trois motifs (le polyéthylène est exclu : –CH₂–CH₂–CH₂–… ne permet pas de distinguer un motif de deux carbones d'un motif d'un seul)
const POL_SEGMENTS = [
  { nom: 'poly(chlorure de vinyle)', seg: '–CH₂–CHCl–CH₂–CHCl–CH₂–CHCl–', nC: 2 },
  { nom: 'polypropylène', seg: '–CH₂–CH(CH₃)–CH₂–CH(CH₃)–CH₂–CH(CH₃)–', nC: 3 },
  { nom: 'polystyrène', seg: '–CH₂–CH(C₆H₅)–CH₂–CH(C₆H₅)–CH₂–CH(C₆H₅)–', nC: 8 },
];
function genPolymeresTG() {
  const tolOk = q => { const seuil = Math.max(1.5 * q.tolRel, 0.02); q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > seuil * Math.abs(q.vrai)); };
  // nb() prend des chiffres SIGNIFICATIFS : les nombres s'écrivent ici en décimales fixes, exactement comme l'élève les lira
  const d = (x, k) => Number(x).toFixed(k).replace('.', ',');
  const milliers = x => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  const S = tire(POL_SEGMENTS);
  const q1 = { id: 'po0', type: 'num', q: <>Voici un segment de chaîne de {S.nom} : <b>{S.seg}</b>. Un même motif s’y répète (on néglige les extrémités de la chaîne). Combien d’atomes de carbone ce motif contient-il ? (nombre entier)</>, unite: 'atomes de carbone', vrai: S.nC, tolRel: 0.006, csMin: 1,
    aide: 'Cherchez le plus petit groupe d’atomes qui, répété bout à bout, redonne tout le segment, puis comptez ses atomes de carbone (y compris ceux portés par la chaîne).',
    pieges: [[3 * S.nC, 'Vous avez compté les atomes de carbone des trois motifs du segment : il faut ceux d’un seul motif.'], [S.nC + 1, 'Recomptez les atomes de carbone du motif, un par un : vous en avez compté un de trop.'], [S.nC > 2 ? 2 : 1, 'Le motif contient aussi les atomes de carbone portés par la chaîne principale : recomptez-les.'], [2 * S.nC, 'Vous avez compté deux motifs : il en faut un seul.']],
    expl: <>Le groupe qui se répète est {S.nC === 2 ? '–CH₂–CHCl–' : S.nC === 3 ? '–CH₂–CH(CH₃)–' : '–CH₂–CH(C₆H₅)–'} : il contient <b>{S.nC}</b> atomes de carbone.</> };
  const P = tire(POL_MOTIFS), n1 = tire([200, 500, 800, 1000, 2000, 5000]);
  const q2 = { id: 'po1', type: 'num', q: <>Le {P.nom} a pour motif <b>{P.motif}</b> (formule brute {P.brute}). Une chaîne compte <b>n = {milliers(n1)}</b> motifs ; on néglige les extrémités de la chaîne. Combien d’atomes de carbone cette chaîne contient-elle ? (nombre entier)</>, unite: 'atomes de carbone', vrai: n1 * P.nC, tolRel: 0.006, csMin: 1,
    aide: 'Comptez les atomes de carbone d’un seul motif (y compris ceux portés par la chaîne), puis multipliez par n.',
    pieges: [[n1, 'C’est le nombre de motifs : chaque motif contient plusieurs atomes de carbone dans le cas général.'], [n1 * (P.nC + 1), 'Vous avez compté un atome de carbone de trop dans le motif : recomptez sur la formule du motif.'], [n1 * (P.nC > 2 ? P.nC - 1 : 4), 'Recomptez les atomes de carbone du motif, un par un, sur sa formule brute.'], [n1 / P.nC, 'Il faut multiplier le nombre de motifs par le nombre de C d’un motif, pas le diviser.']],
    expl: <>Un motif compte {P.nC} atomes de carbone ({P.brute}) : {P.nC} × {milliers(n1)} = <b>{milliers(n1 * P.nC)}</b> atomes de carbone.</> };
  const P3 = tire(POL_MOTIFS), M3 = 12.0 * P3.nC + 1.0 * P3.nH + 35.5 * P3.nCl, n3 = tire([1000, 2000, 4000, 5000, 10000]);
  const q3 = { id: 'po2', type: 'num', q: <>Pour aller plus loin. Le motif du {P3.nom} a une masse molaire de <b>{d(M3, 1)}{NB}g·mol⁻¹</b>. Une chaîne compte <b>n = {milliers(n3)}</b> motifs ; on néglige les extrémités de la chaîne. Quelle est sa masse molaire ? (en g·mol⁻¹, 2 chiffres significatifs)</>, unite: 'g·mol⁻¹', vrai: M3 * n3, tolRel: 0.05, csMin: 2,
    aide: 'M (chaîne) = n × M (motif) : la masse molaire d’un ensemble de n motifs identiques.',
    pieges: [[M3, 'C’est la masse molaire d’un seul motif : la chaîne en contient n.'], [M3 + n3, 'Il faut multiplier, pas additionner : n motifs identiques.'], [n3 / M3, 'Il faut multiplier n par la masse molaire du motif, pas diviser.'], [M3 * n3 / 1000, 'Facteur 1 000 : la masse molaire demandée est en g·mol⁻¹, ne la convertissez pas en kg·mol⁻¹.']],
    expl: <>M = n × M (motif) = {milliers(n3)} × {d(M3, 1)} = <b>{milliers(n3 * M3)}{NB}g·mol⁻¹</b>.</> };
  const P4 = tire(POL_MOTIFS), M4 = 12.0 * P4.nC + 1.0 * P4.nH + 35.5 * P4.nCl, n4 = tire([400, 800, 1600, 2500, 4000]);
  const q4 = { id: 'po3', type: 'num', q: <>Pour aller plus loin. Un échantillon de {P4.nom} (motif {P4.brute}, masse molaire du motif <b>{d(M4, 1)}{NB}g·mol⁻¹</b>) a une masse molaire moyenne de chaîne de <b>{milliers(n4 * M4)}{NB}g·mol⁻¹</b> ; on néglige les extrémités de la chaîne. Quel est le nombre moyen n de motifs par chaîne ? (valeur entière)</>, unite: 'motifs', vrai: n4, tolRel: 0.05, csMin: 2,
    aide: 'M (chaîne) = n × M (motif) : isolez n, qui vaut M (chaîne) divisée par M (motif).',
    pieges: [[n4 * M4 * M4, 'Il faut diviser la masse molaire de la chaîne par celle du motif, pas la multiplier.'], [M4 / n4, 'Le rapport est inversé : n = M (chaîne) divisée par M (motif).'], [n4 * M4 - M4, 'Il faut diviser, pas retrancher : n est le rapport des deux masses molaires.'], [n4 * 2, 'Vérifiez la division : une erreur de facteur 2 donne ce résultat.']],
    expl: <>n = <Frac haut="M (chaîne)" bas="M (motif)"/> = <Frac haut={milliers(n4 * M4)} bas={d(M4, 1)}/> = <b>{milliers(n4)}</b> motifs.</> };
  [q1, q2, q3, q4].forEach(tolOk);
  return { intro: 'Polymères : identifier le motif d’une chaîne, compter ses atomes de carbone (questions 1 et 2), puis, pour aller plus loin, calculer des masses molaires.', questions: [q1, q2, q3, q4],
    retenir: ['Un polymère est une chaîne de n motifs identiques : [motif]ₙ, avec n le nombre de motifs ; on repère le motif comme le plus petit groupe qui, répété, redonne la chaîne.', 'Atomes d’un élément dans la chaîne = (atomes de cet élément par motif) × n.', 'Pour aller plus loin : M (chaîne) = n × M (motif) ; M (motif) se calcule avec la formule brute du motif et les masses molaires atomiques.'] };
}

function genNewtonTG() {
  const tolOk = (q) => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 0.08 * Math.abs(q.vrai))); };
  // nb() prend des chiffres SIGNIFICATIFS (nb(1,5 ; 1) donnerait « 2 ») : les données et les corrections s'écrivent ici en décimales fixes, exactement comme l'élève les lira
  const d = (x, k) => Number(x).toFixed(k).replace('.', ',');
  const milliers = x => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  const m = tire([1.5, 2.0, 2.5, 3.0]), T = tire([6.0, 7.0, 8.0, 9.0]), alpha = tire([0, 20, 30]), f = tire([1.0, 1.5, 2.0]);
  const c = Math.cos(alpha * Math.PI / 180), Sx = Number((T * c - f).toFixed(2));
  const q1 = { id: 'n0', type: 'num', q: <>Un chariot de masse <b>{d(m, 1)}{NB}kg</b> roule vers la droite sur un rail horizontal. Le fil exerce une tension <b>{d(T, 1)}{NB}N</b>{alpha ? <>, inclinée de <b>{alpha}°</b> au-dessus de l’horizontale</> : ', horizontale'} ; les frottements valent <b>{d(f, 1)}{NB}N</b> (axe Ox vers la droite). Calculez la composante {avecIndices('ΣF_x')} de la somme des forces (en N, 2 chiffres significatifs).</>, unite: 'N', vrai: T * c - f, tolRel: 0.05, csMin: 2,
    aide: 'Projetez sur Ox avec les signes : la tension compte +T cos α, les frottements −f ; le poids et la réaction sont verticaux.',
    pieges: [[T * c + f, 'Les frottements sont vers la gauche : leur composante est négative, il faut les retrancher.'], [T - f, 'Pour un fil incliné, seule la composante horizontale de la tension compte : T × cos α.'], [T * c, 'Vous avez oublié les frottements.']],
    expl: <>{avecIndices('ΣF_x')} = T × cos α − f = {d(T, 1)} × cos {alpha}° − {d(f, 1)} = <b>{d(T * c - f, 2)}{NB}N</b>.</> };
  const q2 = { id: 'n1', type: 'num', q: <>Pour ce chariot de masse <b>{d(m, 1)}{NB}kg</b>, la somme des forces a pour composante {avecIndices('ΣF_x')} = <b>{d(Sx, 2)}{NB}N</b>. Calculez la composante {avecIndices('a_x')} de l’accélération du centre de masse (en m/s², 2 chiffres significatifs).</>, unite: 'm/s²', vrai: Sx / m, tolRel: 0.05, csMin: 2,
    aide: 'Deuxième loi projetée sur Ox : ΣF_x = m × a_x, donc a_x = frac(ΣF_x|m) (des N divisés par des kg donnent des m/s²).',
    pieges: [[Sx * m, 'Il faut diviser par la masse, pas multiplier : a_x = frac(ΣF_x|m).'], [Sx, 'Vous avez oublié de diviser par la masse m.'], [m / Sx, 'Le rapport est inversé : a_x est ΣF_x divisée par m.']],
    expl: <>{avecIndices('a_x')} = {avecIndices('frac(ΣF_x|m)')} = {avecIndices(`frac(${d(Sx, 2)}|${d(m, 1)})`)} = <b>{d(Sx / m, 2)}{NB}m/s²</b>.</> };
  const mc = tire([600, 800, 1000, 1200]), v1 = tire([0, 0.5]), v2 = Number((v1 + tire([1.8, 2.0, 2.2, 2.4])).toFixed(1)), a = (v2 - v1) / 2.0, Tc = mc * (9.8 + a);
  const q3 = { id: 'n2', type: 'num', q: <>Une cabine de masse <b>{mc}{NB}kg</b> monte : sa vitesse passe de <b>{d(v1, 1)}{NB}m/s</b> à <b>{d(v2, 1)}{NB}m/s</b> en <b>2,0{NB}s</b>, avec des forces constantes (g = 9,8{NB}m/s²). Calculez la tension du câble (en N, 2 chiffres significatifs).</>, unite: 'N', vrai: Tc, tolRel: 0.05, csMin: 2,
    aide: 'a_y = frac(v₂ − v₁|Δt), puis T − P = m × a_y (axe vers le haut) : T = m × (g + a_y).',
    pieges: [[mc * a, 'C’est ΣF_y = m × a_y : il faut y ajouter le poids, T = P + m × a_y.'], [mc * 9.8, 'C’est le poids seul : la cabine accélère vers le haut, donc T est plus grande que P.'], [mc * (9.8 - a), 'Le signe est inversé : a_y est vers le haut, donc T = m × (g + a_y).']],
    expl: <>{avecIndices('a_y')} = {avecIndices(`frac(${d(v2, 1)} − ${d(v1, 1)}|2,0)`)} = {d(a, 2)}{NB}m/s² ; T = m × (g + {avecIndices('a_y')}) = {mc} × (9,8 + {d(a, 2)}) = <b>{milliers(Tc)}{NB}N</b>.</> };
  const mp = tire([60, 70, 80, 90]);
  const q4 = { id: 'n3', type: 'num', q: <>Un parachutiste de masse <b>{mp}{NB}kg</b> (équipement compris) descend en ligne droite à <b>vitesse constante</b>, sous son poids et le frottement de l’air (g = 9,8{NB}m/s²). Calculez l’intensité du frottement (en N, 2 chiffres significatifs).</>, unite: 'N', vrai: mp * 9.8, tolRel: 0.05, csMin: 2,
    aide: 'Vitesse constante : vec(a)_G est nul, donc Σ vec(F) est nulle : le frottement compense le poids.',
    pieges: [[mp, 'C’est la masse en kg : il faut calculer le poids P = m × g, en newtons.'], [mp / 9.8, 'Il faut multiplier la masse par g, pas la diviser.'], [0, 'À vitesse constante, la somme des forces est nulle : le frottement compense le poids.']],
    expl: <>{avecIndices('Σ vec(F) nulle')} donne f = P = m × g = {mp} × 9,8 = <b>{d(mp * 9.8, 0)}{NB}N</b>.</> };
  [q1, q2, q3, q4].forEach(tolOk);
  return { intro: 'Deuxième loi de Newton : composantes de la somme des forces, accélération du centre de masse, force inconnue à partir du mouvement et équilibre.', questions: [q1, q2, q3, q4],
    retenir: ['Deuxième loi de Newton : Σ vec(F) = m × vec(a)_G ; vec(a)_G a la même direction et le même sens que Σ vec(F).', 'Projection sur un axe : une force vers l’axe compte +, contre l’axe −. Pour un fil incliné de α : T × cos α sur Ox.', 'Mouvement connu : on calcule d’abord vec(a)_G à partir de la variation Δvec(v) de la vitesse pendant la durée Δt, puis Σ vec(F) = m × vec(a)_G ; pour une cabine, T = m × (g + a_y) (axe vers le haut).', 'Σ vec(F) nulle : vec(a)_G nul, vitesse constante ou repos (principe d’inertie).'] };
}


// ───────── Mouvement dans un champ de pesanteur uniforme (TG, sim 175) ─────────
function genPesanteurTG() {
  const tolOk = (q) => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 0.08 * Math.abs(q.vrai))); };
  // nb() prend des chiffres SIGNIFICATIFS : les données et les corrections s'écrivent ici en décimales fixes, exactement comme l'élève les lira
  const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
  const rad = x => x * Math.PI / 180;
  const v0 = tire([8, 10, 12, 15, 18]), alpha = tire([30, 40, 50, 60]), vy0 = Number((v0 * Math.sin(rad(alpha))).toFixed(2));
  // 1. composante verticale de la vitesse à une date donnée, avec son signe
  const tVal = tire([0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 1.8, 2.0].filter(t => Math.abs(vy0 - 9.8 * t) >= 2.0));
  const vyt = vy0 - 9.8 * tVal;
  const q1 = { id: 'pe0', type: 'num', q: <>Une balle est lancée depuis le sol avec une vitesse de norme <b>{v0}{NB}m/s</b>, inclinée de <b>{alpha}°</b> au-dessus de l’horizontale (g = 9,8{NB}m/s², air négligé, axe Oy vers le haut). Calculez la composante {avecIndices('v_y')} de sa vitesse à la date <b>t = {d(tVal, 1)}{NB}s</b> (en m/s, avec son signe, 2 chiffres significatifs).</>, unite: 'm/s', vrai: vyt, tolRel: 0.05, csMin: 2,
    aide: 'v_y(t) = −g t + v_0 sin α : le signe est négatif quand la balle descend. Gardez 3 chiffres significatifs dans les calculs intermédiaires.',
    pieges: [[vy0 + 9.8 * tVal, 'Le signe de g t est inversé : avec Oy vers le haut, a_y = −g, donc v_y(t) = −g t + v_0 sin α.'], [v0 - 9.8 * tVal, 'Vous avez oublié sin α : la vitesse verticale initiale est v_0 sin α, pas v_0.'], [-vyt, 'Vérifiez le signe : v_y est positive tant que la balle monte, négative quand elle descend.']],
    expl: <>{avecIndices('v_y(t)')} = −g t + {avecIndices('v_0')} sin α = −9,8 × {d(tVal, 1)} + {v0} × sin {alpha}° = −{d(9.8 * tVal, 2)} + {d(vy0, 2)} = <b>{d(vyt, 2)}{NB}m/s</b>{vyt < 0 ? ' : négative, la balle descend.' : ' : positive, la balle monte encore.'}</> };
  // 2. altitude à une date donnée (départ d'une hauteur h)
  const couples2 = [];
  for (const h of [1.0, 1.5, 2.0, 3.0]) for (const t of [0.4, 0.6, 0.8, 1.0, 1.2]) { const y = h + vy0 * t - 4.9 * t * t; if (y >= 2.0 && [h, 4.9 * t * t, (v0 - vy0) * t].every(e => e / y > 0.1)) couples2.push([h, t]); }
  const [h2, t2] = couples2.length ? tire(couples2) : [2.0, 0.6];   // jeux de données où chaque piège reste nettement hors tolérance
  const y2 = h2 + vy0 * t2 - 4.9 * t2 * t2;
  const q2 = { id: 'pe1', type: 'num', q: <>La même balle est lancée d’une terrasse située à <b>h = {d(h2, 1)}{NB}m</b> au-dessus du sol (<b>{v0}{NB}m/s</b>, <b>{alpha}°</b>, g = 9,8{NB}m/s²). Calculez son altitude y à la date <b>t = {d(t2, 1)}{NB}s</b> (en m, 2 chiffres significatifs).</>, unite: 'm', vrai: y2, tolRel: 0.05, csMin: 2,
    aide: 'y(t) = −½ g t² + v_0 sin α × t + h : la constante d’intégration est l’altitude initiale h. Gardez 3 chiffres significatifs dans les calculs intermédiaires.',
    pieges: [[y2 - h2, 'Vous avez oublié la hauteur h : y(0) = h, l’altitude est comptée depuis le sol.'], [-9.8 * t2 * t2 + vy0 * t2 + h2, 'Vérifiez le facteur ½ : le terme de pesanteur est −½ g t², soit −4,9 t².'], [v0 * t2 - 4.9 * t2 * t2 + h2, 'Vous avez oublié sin α : seule la composante verticale v_0 sin α fait monter la balle.']],
    expl: <>y(t) = −½ g t² + {avecIndices('v_0')} sin α × t + h = −4,9 × {d(t2, 1)}² + {d(vy0, 2)} × {d(t2, 1)} + {d(h2, 1)} = <b>{d(y2, 2)}{NB}m</b>.</> };
  // 3. portée d'un tir depuis le sol sur la Terre, la Lune ou Mars
  const C = tire([{ nom: 'la Terre', g: 9.8 }, { nom: 'la Lune', g: 1.6 }, { nom: 'Mars', g: 3.7 }]), v3 = tire([6, 8, 10, 12]), a3 = tire([30, 40, 50, 60]);
  const tv3 = 2 * v3 * Math.sin(rad(a3)) / C.g, P3 = v3 * Math.cos(rad(a3)) * tv3;
  const q3 = { id: 'pe2', type: 'num', q: <>Sur <b>{C.nom}</b> (g = {d(C.g, 1)}{NB}m/s², sans atmosphère), une balle est lancée depuis le sol avec <b>{v3}{NB}m/s</b> sous <b>{a3}°</b> au-dessus de l’horizontale. Calculez la portée, distance horizontale entre le point de lancer et le point d’arrivée au sol (en m, 2 chiffres significatifs).</>, unite: 'm', vrai: P3, tolRel: 0.05, csMin: 2,
    aide: 'Durée du vol : y(t) = 0 donne t = frac(2 v_0 sin α|g) ; puis portée = v_0 cos α × durée. Gardez 3 chiffres significatifs dans les calculs intermédiaires.',
    pieges: [[v3 * Math.cos(rad(a3)) * tv3 / 2, 'Vous avez pris la date du sommet : la balle continue jusqu’au sol, durée du vol = 2 fois cette date.'], [v3 * tv3, 'Vous avez oublié cos α : seule la composante horizontale v_0 cos α avance la balle.'], [v3 * Math.cos(rad(a3)) * 2 * v3 * Math.sin(rad(a3)) / 9.8, 'Vous avez pris g = 9,8 m/s² : utilisez la valeur de g de cet astre.']],
    expl: <>Durée : t = {avecIndices(`frac(2 v_0 sin α|g)`)} = {avecIndices(`frac(2 × ${v3} × sin ${a3}°|${d(C.g, 1)})`)} = {d(tv3, 2)} s ; portée = {avecIndices('v_0')} cos α × t = {v3} × cos {a3}° × {d(tv3, 2)} = <b>{d(P3, P3 < 10 ? 2 : 1)}{NB}m</b>.</> };
  // 4. vitesse à l'arrivée par le théorème de l'énergie cinétique
  const v4 = tire([6, 8, 10, 12, 15]), h4 = tire([3, 5, 8, 12, 20]), a4 = tire([20, 40, 60]), vf = Math.sqrt(v4 * v4 + 2 * 9.8 * h4);
  const q4 = { id: 'pe3', type: 'num', q: <>Une pierre est lancée depuis un pont situé à <b>{h4}{NB}m</b> au-dessus de l’eau, avec une vitesse de <b>{v4}{NB}m/s</b> inclinée de <b>{a4}°</b> au-dessus de l’horizontale (g = 9,8{NB}m/s², air négligé). Calculez la norme de sa vitesse à l’arrivée sur l’eau, sans calculer la durée du vol (en m/s, 2 chiffres significatifs).</>, unite: 'm/s', vrai: vf, tolRel: 0.05, csMin: 2,
    aide: 'Théorème de l’énergie cinétique : ½ m v_f² − ½ m v_0² = m g h. La masse se simplifie, l’angle ne compte pas.',
    pieges: [[v4, 'Vous avez oublié le travail du poids : la pierre descend de h, elle gagne de l’énergie cinétique.'], [Math.sqrt(Math.max(0, v4 * v4 - 2 * 9.8 * h4)), 'Le signe est inversé : en descendant, l’énergie cinétique augmente (+ m g h).'], [v4 * v4 + 2 * 9.8 * h4, 'Vous avez oublié la racine carrée : c’est v_f² qui vaut v_0² + 2 g h.'], [v4 + Math.sqrt(2 * 9.8 * h4), 'Les vitesses ne s’additionnent pas ainsi : v_f² = v_0² + 2 g h.']],
    expl: <>{avecIndices('v_f')} = √({avecIndices('v_0')}² + 2 g h) = √({v4}² + 2 × 9,8 × {h4}) = √{d(v4 * v4 + 2 * 9.8 * h4, 1)} = <b>{d(vf, 2)}{NB}m/s</b>, quel que soit l’angle {a4}°.</> };
  [q1, q2, q3, q4].forEach(tolOk);
  return { intro: 'Mouvement dans un champ de pesanteur uniforme : composantes de la vitesse et de la position avec leurs signes, portée sur différents astres et théorème de l’énergie cinétique.', questions: [q1, q2, q3, q4],
    retenir: ['Poids seul, champ uniforme : vec(a) = vec(g). Avec Oy vers le haut : a_x = 0 et a_y = −g.', 'Vitesse : v_x = v_0 cos α ; v_y = −g t + v_0 sin α. Position : x = v_0 cos α × t ; y = −½ g t² + v_0 sin α × t + h. La trajectoire est une parabole.', 'Sommet : v_y = 0 ; sol : y = 0 donne la durée du vol ; portée = v_x × durée.', 'Théorème de l’énergie cinétique (poids seul) : v_f = √(v_0² + 2 g h) ; la masse et l’angle n’interviennent pas.'] };
}


// ───────── Particule chargée dans un condensateur plan (TG, sim 176) ─────────
function genCondensateurTG() {
  const tolOk = q => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 0.08 * Math.abs(q.vrai))); };
  // nb() prend des chiffres SIGNIFICATIFS : les données et les corrections s'écrivent ici en décimales fixes, exactement comme l'élève les lira
  const d1 = (x, k) => Number(x).toFixed(k).replace('.', ',');
  const sci = (x, k = 2) => { let e = Math.floor(Math.log10(Math.abs(x))), m = Math.abs(x) / 10 ** e; if (Number(m.toFixed(k - 1)) >= 10) { m /= 10; e += 1; } return `${m.toFixed(k - 1).replace('.', ',')}${NB}×${NB}${p10(e)}`; };
  const E_CH = 1.60e-19, L = 0.060;
  const PART = { electron: { nom: 'électron', z: -1, m: 9.11e-31 }, proton: { nom: 'proton', z: 1, m: 1.67e-27 }, sodium: { nom: 'ion sodium Na⁺', z: 1, m: 3.82e-26 } };
  const chq = p => (PART[p].z < 0 ? '−e' : 'e');
  // 1. champ
  const U1 = tire([100, 200, 300, 400, 500, 800, 1000, 2000, 5000]), d1c = tire([1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]), E1 = U1 / (d1c / 100);
  const q1 = { id: 'cp0', type: 'num', q: <>Deux plaques parallèles, distantes de <b>{d1(d1c, 1)}{NB}cm</b>, sont soumises à la tension <b>{U1}{NB}V</b>. Calculez la norme E du champ électrique entre les plaques (en V/m, 2 chiffres significatifs).</>, unite: 'V/m', vrai: E1, tolRel: 0.05, csMin: 2,
    aide: 'E = frac(U|d) : la distance d doit être convertie en mètres avant de diviser.',
    pieges: [[E1 / 100, 'La distance doit être en mètres : 1 cm = 10⁻² m (avec d en cm, on trouve des V/cm).'], [U1 * d1c / 100, 'Le champ est le quotient de la tension par la distance, pas leur produit.'], [d1c / 100 / U1, 'Le rapport est inversé : E = frac(U|d).']],
    expl: <>E = {avecIndices('frac(U|d)')} = {avecIndices(`frac(${U1}|${d1(d1c / 100, 3)})`)} = <b>{sci(E1)}{NB}V/m</b>.</> };
  // 2. accélération
  const pa = tire(['electron', 'proton', 'sodium']), E2 = tire([1.0, 2.0, 5.0, 8.0]) * tire([1e3, 1e4, 1e5]), a2 = E_CH * E2 / PART[pa].m;
  const q2 = { id: 'cp1', type: 'num', q: <>Un <b>{PART[pa].nom}</b> (charge q = {chq(pa)} avec e = 1,60{NB}×{NB}10⁻¹⁹{NB}C, masse m = <b>{sci(PART[pa].m, 3)}{NB}kg</b>) est placé dans un champ électrique uniforme de norme <b>E = {sci(E2)}{NB}V/m</b>. Le poids est négligé. Calculez la norme a de son accélération (en m/s², 2 chiffres significatifs).</>, unite: 'm/s²', vrai: a2, tolRel: 0.05, csMin: 2,
    aide: 'Deuxième loi de Newton : m × a = |q| × E, donc a = frac(|q| × E|m).',
    pieges: [[E_CH * E2, 'Vous avez oublié de diviser par la masse : a = frac(|q| × E|m).'], [E2 / PART[pa].m, 'Il manque la charge : la force est F = |q| × E.'], [E_CH * E2 * PART[pa].m, 'Il faut diviser par la masse, pas multiplier.']],
    expl: <>a = {avecIndices('frac(|q| × E|m)')} = {avecIndices(`frac(1,60 × 10⁻¹⁹ × ${sci(E2).replace(/[  ]/g, ' ')}|${sci(PART[pa].m, 3).replace(/[  ]/g, ' ')})`)} = <b>{sci(a2)}{NB}m/s²</b>.</> };
  // 3. déviation à la sortie (électron ; la particule sort : |y_S| < d/2)
  let U3, d3, v3, yS3;
  for (;;) {
    U3 = tire([100, 200, 300, 400, 500]); d3 = tire([1.0, 1.5, 2.0]); v3 = tire([1.0e7, 2.0e7, 3.0e7]);
    yS3 = (E_CH * U3 / (9.11e-31 * d3 / 100)) * L * L / (2 * v3 * v3) * 1000;
    if (yS3 >= 1.0 && yS3 <= 0.85 * d3 * 5) break;
  }
  const q3 = { id: 'cp2', type: 'num', q: <>Un électron entre au milieu de deux plaques de longueur <b>L = 6,0{NB}cm</b>, distantes de <b>d = {d1(d3, 1)}{NB}cm</b> et soumises à la tension <b>U = {U3}{NB}V</b>, avec la vitesse <b>v₀ = {sci(v3, 2)}{NB}m/s</b> perpendiculaire au champ (e = 1,60{NB}×{NB}10⁻¹⁹{NB}C ; m = 9,11{NB}×{NB}10⁻³¹{NB}kg ; poids négligé). Calculez la déviation {avecIndices("y_S")} de l’électron à la sortie des plaques (en mm, 2 chiffres significatifs).</>, unite: 'mm', vrai: yS3, tolRel: 0.05, csMin: 2,
    aide: 'a = frac(e × U|m × d), puis y_S = frac(a × L²|2 × v₀²) ; L et d en mètres. Le résultat est en mètres : convertissez-le en millimètres.',
    pieges: [[yS3 / 1000, 'Le résultat est demandé en millimètres : 1 m = 10³ mm.'], [2 * yS3, 'Il manque le facteur 2 : y_S = frac(a × L²|2 × v₀²).'], [yS3 * 100, 'Les distances doivent être en mètres : L = 6,0 cm = 6,0 × 10⁻² m et d en m.']],
    expl: <>a = {avecIndices(`frac(e × U|m × d)`)} = {sci(E_CH * U3 / (9.11e-31 * d3 / 100))}{NB}m/s² ; {avecIndices(`y_S = frac(a × L²|2 × v_0²)`)} = <b>{d1(yS3, 1)}{NB}mm</b>.</> };
  // 4. vitesse après accélération (départ au repos) ; électron limité à 500 V (v < 0,1 c)
  const p4 = tire(['electron', 'proton', 'sodium']), U4 = p4 === 'electron' ? tire([100, 200, 250, 400, 500]) : tire([100, 250, 500, 1000, 2000]), v4 = Math.sqrt(2 * E_CH * U4 / PART[p4].m);
  const q4 = { id: 'cp3', type: 'num', q: <>Un <b>{PART[p4].nom}</b> (charge {chq(p4)} avec e = 1,60{NB}×{NB}10⁻¹⁹{NB}C ; masse m = <b>{sci(PART[p4].m, 3)}{NB}kg</b>) part du repos et est accéléré dans le vide par la tension <b>U = {U4}{NB}V</b>. Calculez sa vitesse à la fin de l’accélération (en m/s, 2 chiffres significatifs).</>, unite: 'm/s', vrai: v4, tolRel: 0.05, csMin: 2,
    aide: 'Théorème de l’énergie cinétique, départ au repos : frac(1|2) × m × v² = |q| × U, donc v² = frac(2 × |q| × U|m).',
    pieges: [[v4 * v4, 'Il manque la racine carrée : le calcul donne v², pas v.'], [v4 / Math.SQRT2, 'Il manque le facteur 2 : v² = frac(2 × |q| × U|m).'], [Math.sqrt(2 * E_CH * U4 * PART[p4].m), 'Il faut diviser par la masse, pas multiplier.']],
    expl: <>frac(1|2) × m × v² = |q| × U donne v = <FormuleEnLigne><msqrt><mfrac><mrow><mtext>2 × |q| × U</mtext></mrow><mrow><mtext>m</mtext></mrow></mfrac></msqrt></FormuleEnLigne> = <b>{sci(v4)}{NB}m/s</b>.</> };
  // 5. durée de traversée
  const v5 = tire([1.0e7, 1.5e7, 2.0e7, 2.5e7, 3.0e7]), t5 = L / v5 * 1e9;
  const q5 = { id: 'cp4', type: 'num', q: <>Un électron pénètre entre deux plaques de longueur <b>L = 6,0{NB}cm</b> avec la vitesse <b>v₀ = {sci(v5, 2)}{NB}m/s</b>, parallèle aux plaques. Sa vitesse selon l’axe Ox reste égale à v₀. Calculez la durée de la traversée des plaques (en ns, 2 chiffres significatifs).</>, unite: 'ns', vrai: t5, tolRel: 0.05, csMin: 2,
    aide: 'x(t) = v₀ × t : la durée est t = frac(L|v₀), avec L en mètres. Le résultat est en secondes : 1 ns = 10⁻⁹ s.',
    pieges: [[t5 / 1e9, 'Le résultat est demandé en nanosecondes : 1 s = 10⁹ ns.'], [t5 * 100, 'La longueur doit être en mètres : 6,0 cm = 6,0 × 10⁻² m.'], [1 / t5, 'Le rapport est inversé : t = frac(L|v₀).']],
    expl: <>t = {avecIndices('frac(L|v_0)')} = {avecIndices(`frac(6,0 × 10⁻²|${sci(v5, 2).replace(/[  ]/g, ' ')})`)} = <b>{d1(t5, 1)}{NB}ns</b>.</> };
  [q1, q2, q3, q4, q5].forEach(tolOk);
  return { intro: 'Particule chargée dans un condensateur plan : champ uniforme, accélération, déviation à la sortie, vitesse après accélération et durée de traversée.', questions: [q1, q2, q3, q4, q5],
    retenir: ['Champ d’un condensateur plan : E = frac(U|d), avec d en mètres ; vec(F) = q × vec(E), de sens opposé à vec(E) si q < 0.', 'Entrée perpendiculaire au champ, poids négligé : a_y = frac(q × E_y|m) constante ; x(t) = v₀ × t et y(t) = frac(1|2) × a_y × t², soit une parabole y = frac(a_y|2 × v₀²) × x².', 'La particule sort des plaques si |y_S| < frac(d|2) ; sinon elle heurte une plaque.', 'Théorème de l’énergie cinétique, départ au repos : frac(1|2) × m × v² = |q| × U, donc v² = frac(2 × |q| × U|m) : v est la racine carrée de ce quotient.'] };
}

// ───────── Vecteurs vitesse et accélération (TG, sim 166) ─────────
function genVecteursVATG() {
  const sg = (x, cs = 3) => (x < 0 ? '−' + nb(-x, cs) : nb(x, cs));
  const tolOk = q => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 0.06 * Math.abs(q.vrai))); };
  const tau = tire([0.2, 0.5, 1.0]);
  // 1. vitesse à partir de deux positions : v_x(i) ≈ (x_{i+1} − x_{i−1}) / (2τ)
  const v = tire([1.5, 2.0, 2.5, 3.0, 4.0, 5.0]), xa = tire([1.0, 2.0, 3.5, 5.0]), xb = Number((xa + 2 * tau * v).toFixed(3));
  const q1 = { id: 'va0', type: 'num', q: <>Sur une chronophotographie prise toutes les τ = <b>{nb(tau, 2)}{NB}s</b>, un mobile se trouve en <b>x = {nb(xa, 3)}{NB}m</b> au point M<sub>3</sub> et en <b>x = {nb(xb, 3)}{NB}m</b> au point M<sub>5</sub>. Estimez la coordonnée v<sub>x</sub> du vecteur vitesse au point M<sub>4</sub> (en m/s, 2 chiffres significatifs).</>, unite: 'm/s', vrai: v, tolRel: 0.05, csMin: 2,
    aide: 'v_x(4) ≈ frac(x_5 − x_3|2τ) : M_3 et M_5 sont séparés de deux intervalles de temps.',
    pieges: [[2 * v, 'Il manque le facteur 2 : de M_3 à M_5, il s’écoule 2τ, pas τ.'], [v * 4 * tau * tau, 'Il faut diviser par 2τ, pas multiplier.'], [xb / (2 * tau), 'Il faut la variation de position x_5 − x_3, pas la position x_5 seule.']],
    expl: <>v<sub>x</sub>(4) ≈ {avecIndices(`frac(x_5 − x_3|2τ)`)} = {avecIndices(`frac(${nb(xb, 3)} − ${nb(xa, 3)}|2 × ${nb(tau, 2)})`)} = <b>{nb(v, 3)}{NB}m/s</b>.</> };
  // 2. accélération (avec son signe) à partir de deux vitesses
  const a = tire([0.5, 1.0, 1.5, 2.0, 2.5]) * tire([1, -1]), va = tire([6.0, 7.0, 8.0, 10.0]), vb = Number((va + 2 * tau * a).toFixed(3));
  const q2 = { id: 'va1', type: 'num', q: <>Au point M<sub>4</sub>, on a estimé v<sub>x</sub>(3) = <b>{nb(va, 3)}{NB}m/s</b> et v<sub>x</sub>(5) = <b>{nb(vb, 3)}{NB}m/s</b> (τ = {nb(tau, 2)}{NB}s). Calculez la coordonnée a<sub>x</sub> du vecteur accélération au point M<sub>4</sub> (en m/s², avec son signe, 2 chiffres significatifs).</>, unite: 'm/s²', vrai: a, tolRel: 0.05, csMin: 2,
    aide: 'a_x(4) ≈ frac(v_x(5) − v_x(3)|2τ) : gardez le signe de la différence (vitesse après moins vitesse avant).',
    pieges: [[-a, 'Vérifiez le signe : a_x = frac(vitesse après − vitesse avant|2τ), dans cet ordre.'], [2 * a, 'Il manque le facteur 2 : v_x(5) et v_x(3) sont séparées de 2τ.'], [a * 4 * tau * tau, 'Il faut diviser par 2τ, pas multiplier.']],
    expl: <>a<sub>x</sub>(4) ≈ {avecIndices(`frac(v_x(5) − v_x(3)|2τ)`)} = {avecIndices(`frac(${sg(vb)} − ${sg(va)}|2 × ${nb(tau, 2)})`)} = <b>{sg(a)}{NB}m/s²</b>{a < 0 ? ' : le signe négatif traduit un vecteur accélération de sens opposé à l’axe Ox (la vitesse diminue).' : ' : la vitesse augmente.'}</> };
  // 3. de x(t) à v_x(t) : dérivée
  const A = tire([0.5, 1.0, 1.5, 2.0, 2.5]), B = tire([1.0, 2.0, 3.0, 4.0]), t1 = tire([1.0, 2.0, 3.0]), vt = 2 * A * t1 + B;
  const q3 = { id: 'va2', type: 'num', q: <>La position d’un mobile sur l’axe Ox est x(t) = <b>{nb(A, 2)}{NB}t² + {nb(B, 2)}{NB}t</b> (x en m, t en s). Calculez la coordonnée v<sub>x</sub> de son vecteur vitesse à la date <b>t = {nb(t1, 2)}{NB}s</b> (en m/s, 2 chiffres significatifs).</>, unite: 'm/s', vrai: vt, tolRel: 0.05, csMin: 2,
    aide: 'v_x(t) = frac(dx|dt) : la dérivée de a t² est 2 a t, celle de b t est b. Remplacez ensuite t.',
    pieges: [[A * t1 + B, 'Vous trouvez A t + B : soit vous avez dérivé A t² en A t, soit vous avez calculé la vitesse moyenne depuis le départ. La dérivée de A t² est 2 A t.'], [2 * A * t1, 'Il manque le terme B : la dérivée de B t est B.'], [A * t1 * t1 + B * t1, 'Vous avez calculé la position x(t) au lieu de sa dérivée.']],
    expl: <>v<sub>x</sub>(t) = {avecIndices(`frac(dx|dt)`)} = 2 × {nb(A, 2)} t + {nb(B, 2)}, donc v<sub>x</sub>({nb(t1, 2)} s) = 2 × {nb(A, 2)} × {nb(t1, 2)} + {nb(B, 2)} = <b>{nb(vt, 3)}{NB}m/s</b>.</> };
  // 4. date de l'arrêt : v_x = 0
  const A2 = tire([0.5, 1.0, 2.0]), t0 = tire([1.0, 1.5, 2.0, 2.5, 4.0]), B2 = Number((-2 * A2 * t0).toFixed(3)), C2 = tire([0, 1.0, 2.0, 5.0]);
  const q4 = { id: 'va3', type: 'num', q: <>Un chariot suit la loi x(t) = <b>{nb(A2, 2)}{NB}t² − {nb(-B2, 2)}{NB}t{C2 ? ` + ${nb(C2, 2)}` : ''}</b> (x en m, t en s). À quelle date <b>t<sub>0</sub></b> le chariot s’arrête-t-il un instant (v<sub>x</sub> = 0) ? Répondez en s, avec 2 chiffres significatifs.</>, unite: 's', vrai: t0, tolRel: 0.05, csMin: 2,
    aide: 'Dérivez x(t) pour obtenir v_x(t), puis résolvez v_x(t) = 0.',
    pieges: [[2 * t0, 'Il manque le facteur 2 de la dérivée : v_x(t) = 2 A t + B, donc t_0 = frac(−B|2A).'], [t0 / 2, 'Vous avez divisé deux fois par 2 : v_x(t) = 2 A t + B, donc t_0 = frac(−B|2A), et non frac(−B|4A).'], [4 * t0, 'Vous avez multiplié par 2 au lieu de diviser par 2 : t_0 = frac(−B|2A).'], [-t0, 'Vérifiez le signe : B est négatif, donc frac(−B|2A) est positif.']],
    expl: <>v<sub>x</sub>(t) = 2 × {nb(A2, 2)} t − {nb(-B2, 2)} ; v<sub>x</sub> = 0 pour t<sub>0</sub> = {avecIndices(`frac(${nb(-B2, 2)}|2 × ${nb(A2, 2)})`)} = <b>{nb(t0, 3)}{NB}s</b>.</> };
  [q1, q2, q3, q4].forEach(tolOk);
  return { intro: 'Du vecteur position au vecteur vitesse puis au vecteur accélération : coordonnées approchées sur une chronophotographie et dérivées de x(t).', questions: [q1, q2, q3, q4],
    retenir: ['Sur une chronophotographie : v_x(i) ≈ frac(x(i+1) − x(i−1)|2τ) et a_x(i) ≈ frac(v_x(i+1) − v_x(i−1)|2τ).', 'a_x se calcule avec son signe : frac(vitesse après − vitesse avant|2τ). a_x négative : le vecteur accélération est de sens opposé à l’axe Ox.', 'En coordonnées : v_x = frac(dx|dt) et a_x = frac(dv_x|dt) ; la dérivée de a t² est 2 a t et celle de b t est b.', 'Le mobile s’arrête un instant quand v_x = 0, mais son accélération n’est pas nulle pour autant.'] };
}

// ───────── Chiralité et carbone asymétrique (TSTL, PCM) ─────────
function genChiraliteReperer() {
  const MOLS = [
    { f: 'CH₃–CH(OH)–COOH', nom: 'de l’acide lactique', n: 1 }, { f: 'CH₃–CH₂–OH', nom: 'de l’éthanol', n: 0 }, { f: 'CH₃–CH(NH₂)–COOH', nom: 'de l’alanine', n: 1 },
    { f: 'CH₃–CH(Cl)–CH₃', nom: 'du 2-chloropropane', n: 0 }, { f: 'H₂N–CH₂–COOH', nom: 'de la glycine', n: 0 }, { f: 'CH₃–CH(Br)–CH₂–CH₂–CH₃', nom: 'du 2-bromopentane', n: 1 },
  ];
  const S = tire(MOLS), chirale = S.n > 0;
  const q1 = { id: 'cr0', type: 'num', q: <>On étudie la molécule <b>{S.f}</b> ({S.nom.replace(/^de l’|^du |^de la /, '')}). Combien de carbones asymétriques (C*) possède-t-elle ?</>, unite: '', vrai: S.n, tolRel: 0.05, csMin: 1,
    aide: 'Un C* est lié à 4 groupes tous différents (n’oubliez pas les atomes H). Un CH₃, un CH₂ ou un carbone lié à deux groupes identiques ne l’est pas.',
    pieges: [[S.n + 1, 'Recomptez : un carbone CH₃ ou CH₂ n’est jamais asymétrique, car il porte au moins deux H identiques.']],
    expl: <>{S.n ? <>Un seul carbone est lié à 4 groupes différents : il y a <b>1</b> C*.</> : <>Aucun carbone n’est lié à 4 groupes différents : il y a <b>0</b> C*.</>}</> };
  const opts = ['oui : un C* et aucun axe, plan ou centre de symétrie', 'non : il n’y a aucun carbone asymétrique'];
  const q2 = { id: 'cr1', type: 'qcm', q: <>La molécule <b>{S.f}</b> est-elle chirale (on admet qu’elle n’a ni axe, ni plan, ni centre de symétrie quand elle a un C*) ?</>, options: [chirale ? opts[0] : opts[1], chirale ? opts[1] : opts[0], 'on ne peut pas savoir sans connaître les numéros atomiques'], bonne: 0, aide: 'Une molécule est chirale si elle possède au moins un C* et aucun élément de symétrie.',
    expl: <>{chirale ? 'Elle a un C* et aucun élément de symétrie : elle est chirale.' : 'Elle n’a pas de C* : elle n’est pas chirale.'}</> };
  [q1].forEach(q => { q.pieges = q.pieges.filter(([v2]) => Math.abs(v2 - q.vrai) > 0.5); });
  return { intro: 'Repérer un carbone asymétrique et décider si une molécule est chirale.', questions: [q1, q2],
    retenir: ['Un carbone asymétrique (C*) est lié à 4 atomes ou groupes tous différents.', 'Une molécule est chirale si elle a au moins un C* et aucun axe, plan ou centre de symétrie.', 'Un CH₂ ou un CH₃ n’est jamais asymétrique.'] };
}
function genChiraliteCram() {
  const [t, c, d] = tire([[2, 1, 1], [1, 2, 1], [1, 1, 2], [0, 2, 2]]);
  const q1 = { id: 'cm0', type: 'num', q: <>Sur le dessin de Cram d’un carbone asymétrique, on compte <b>{t}</b> trait(s) plein(s), <b>{c}</b> coin(s) plein(s) et <b>{d}</b> groupe(s) en tirets. Combien de liaisons le carbone porte-t-il en tout ?</>, unite: '', vrai: t + c + d, tolRel: 0.05, csMin: 1,
    aide: 'Additionnez les traits pleins, les coins pleins et les tirets.',
    pieges: [[c + d, 'Vous avez oublié les traits pleins, qui sont dans le plan de la feuille.']],
    expl: <>{t} + {c} + {d} = <b>{t + c + d}</b> liaisons : un carbone en porte toujours 4.</> };
  q1.pieges = q1.pieges.filter(([v2]) => Math.abs(v2 - q1.vrai) > 0.5);
  const q2 = { id: 'cm1', type: 'num', q: <>Combien de liaisons de ce carbone sortent du plan de la feuille (coins pleins et tirets) ?</>, unite: '', vrai: c + d, tolRel: 0.05, csMin: 1,
    aide: 'Les traits pleins sont dans le plan ; seuls les coins pleins (devant) et les tirets (derrière) en sortent.',
    pieges: [[t, 'C’est le nombre de traits pleins, dans le plan de la feuille.'], [t + c + d, 'Vous avez compté les traits pleins : ils sont dans le plan.']],
    expl: <>{c} coin(s) plein(s) + {d} tiret(s) = <b>{c + d}</b>.</> };
  q2.pieges = q2.pieges.filter(([v2]) => Math.abs(v2 - q2.vrai) > 0.5);
  const q3 = { id: 'cm2', type: 'qcm', q: <>Une molécule chirale et son image dans un miroir sont-elles superposables ?</>, options: ['non : ce sont deux molécules différentes, des énantiomères', 'oui : on peut les superposer en les tournant dans l’espace', 'oui, mais seulement si on échange deux groupes de la molécule'], bonne: 0, aide: 'Pensez à vos deux mains : l’une est l’image de l’autre dans un miroir, et on ne peut pas les superposer.',
    expl: <>Une molécule chirale n’est pas superposable à son image dans un miroir : les deux sont des énantiomères.</> };
  return { intro: 'Représentation de Cram : liaisons dans le plan, devant et derrière, et image dans un miroir.', questions: [q1, q2, q3],
    retenir: ['Un carbone porte toujours 4 liaisons, y compris vers H.', 'Trait plein : dans le plan ; coin plein : devant ; tirets : derrière.', 'Une molécule chirale n’est pas superposable à son image dans un miroir.'] };
}

// ───────── Configuration absolue R/S (TSTL, PCM) ─────────
function genChiralitePriorites() {
  const tous = [['F', 9], ['O', 8], ['N', 7], ['S', 16], ['Cl', 17], ['Br', 35]];
  const L = [...tous].sort(() => Math.random() - 0.5).slice(0, 3), tri = [...L].sort((a, b) => b[1] - a[1]);
  const lies = L.map(x => x[0]).join(', ');
  const tolOk = q => { q.pieges = q.pieges.filter(([v2]) => isFinite(v2) && Math.abs(v2 - q.vrai) > Math.max(1e-9, 0.06 * Math.abs(q.vrai))); };
  const q1 = { id: 'cp0', type: 'num', q: <>Un carbone asymétrique est lié à H et à trois atomes : <b>{L.map(x => `${x[0]} (Z = ${x[1]})`).join(', ')}</b>. Quel est le numéro atomique Z de l’atome de <b>priorité 1</b> ?</>, unite: '', vrai: tri[0][1], tolRel: 0.05, csMin: String(tri[0][1]).length,
    aide: 'Plus le numéro atomique Z est grand, plus l’atome est prioritaire : cherchez le plus grand Z.',
    pieges: [[tri[2][1], 'Vous avez pris le plus petit Z : c’est le plus grand Z qui est prioritaire.'], [tri[1][1], 'C’est le Z de l’atome de priorité 2 : cherchez le plus grand.']],
    expl: <>Les atomes liés sont {lies} : le plus grand Z est <b>{tri[0][1]}</b> ({tri[0][0]}), donc {tri[0][0]} est prioritaire.</> };
  const q2 = { id: 'cp1', type: 'num', q: <>Pour le même carbone, quel est le numéro atomique de l’atome de <b>priorité 3</b> ? (L’hydrogène, Z = 1, est de priorité 4.)</>, unite: '', vrai: tri[2][1], tolRel: 0.05, csMin: String(tri[2][1]).length,
    aide: 'Classez les trois atomes du plus grand Z au plus petit : le 3e est celui de priorité 3.',
    pieges: [[tri[1][1], 'C’est le Z de l’atome de priorité 2 : le 3e est le plus petit des trois.'], [tri[0][1], 'C’est le Z de l’atome de priorité 1.'], [1, 'Z = 1 est celui de H, de priorité 4.']],
    expl: <>Du plus grand au plus petit Z : {tri.map(x => `${x[0]} (${x[1]})`).join(' > ')} puis H. La priorité 3 : Z = <b>{tri[2][1]}</b> ({tri[2][0]}).</> };
  const G = tire([['COOH', 3, 'la double liaison C=O compte pour 2 atomes O, et le groupe –OH en apporte 1'], ['CHO', 2, 'la double liaison C=O compte pour 2 atomes O (le troisième voisin est H)'], ['COCH₃', 2, 'la double liaison C=O compte pour 2 atomes O (le troisième voisin est C)']]);
  const q3 = { id: 'cp2', type: 'num', q: <>Dans le groupe <b>{G[0]}</b> lié au C*, le carbone porte une double liaison C=O. Combien d’atomes <b>O</b> sont comptés parmi ses voisins (une double liaison compte deux fois) ?</>, unite: '', vrai: G[1], tolRel: 0.05, csMin: 1,
    aide: 'Pour chaque liaison double, comptez l’atome du bout deux fois ; ajoutez les O liés par liaison simple.',
    pieges: [[G[1] - 1, 'Il manque un O : une double liaison compte pour deux atomes.']],
    expl: <>Voisins du carbone de {G[0]} : {G[2]}. Total : <b>{G[1]}</b> atomes O.</> };
  [q1, q2, q3].forEach(tolOk);
  return { intro: 'Règles de priorité de Cahn, Ingold et Prelog : numéros atomiques des atomes liés au carbone asymétrique et double liaison comptée deux fois.', questions: [q1, q2, q3],
    retenir: ['Plus le numéro atomique Z de l’atome lié au C* est grand, plus le groupe est prioritaire ; H est toujours le dernier.', 'En cas d’égalité, on compare les atomes voisins, du plus grand Z au plus petit.', 'Une double liaison compte deux fois : le carbone de COOH a pour voisins (O, O, O).'] };
}
function genChiraliteConfig() {
  const SETS = [
    { g: ['CH₃', 'OH', 'COOH', 'H'], nom: 'de l’acide lactique' }, { g: ['CH₂CH₃', 'NH₂', 'COOH', 'H'], nom: 'de l’acide 2-aminobutanoïque' }, { g: ['CH₃', 'CH₃', 'OH', 'H'], nom: 'du propan-2-ol' },
    { g: ['CH₂CH₃', 'CH₂CH₃', 'Cl', 'H'], nom: 'du 3-chloropentane' }, { g: ['CH₃', 'Cl', 'COOH', 'H'], nom: 'de l’acide 2-chloropropanoïque' }, { g: ['NH₂', 'H', 'H', 'COOH'], nom: 'de la glycine' },
  ];
  const S = tire(SETS), mel = [...S.g].sort(() => Math.random() - 0.5), nd = new Set(S.g).size, asym = nd === 4;
  const q1 = { id: 'cc0', type: 'num', q: <>Un carbone est lié aux quatre groupes <b>{mel.join(', ')}</b> (carbone central {S.nom}). Combien de groupes <b>différents</b> y a-t-il ?</>, unite: '', vrai: nd, tolRel: 0.05, csMin: 1,
    aide: 'Comparez les groupes deux à deux : deux groupes écrits pareil sont identiques et ne comptent qu’une fois.',
    pieges: [[4, 'Deux de ces groupes sont identiques : ils ne comptent qu’une fois.'], [nd - 1, 'Recomptez : listez les groupes distincts un par un.']],
    expl: <>Groupes distincts : <b>{nd}</b>.</> };
  const opts = ['oui : quatre groupes différents, donc un carbone asymétrique', 'non : deux groupes identiques, donc pas de carbone asymétrique'];
  const q2 = { id: 'cc1', type: 'qcm', q: <>Ce carbone est-il asymétrique ?</>, options: [asym ? opts[0] : opts[1], asym ? opts[1] : opts[0], 'on ne peut pas savoir sans connaître le numéro atomique de chaque groupe'], bonne: 0, aide: 'Un carbone est asymétrique seulement si ses quatre groupes sont tous différents.',
    expl: <>{asym ? 'Quatre groupes différents : carbone asymétrique (C*).' : 'Deux groupes identiques : pas de carbone asymétrique.'}</> };
  const conf = tire(['R', 'S']), inv = conf === 'R' ? 'S' : 'R', fac = tire(['on échange deux groupes de ce carbone', 'on dessine son image dans un miroir']);
  const q3 = { id: 'cc2', type: 'qcm', q: <>Un carbone asymétrique a la configuration <b>{conf}</b>. Que devient-elle si <b>{fac}</b> ?</>, options: [`${inv} : la lettre s’inverse`, `${conf} : la lettre ne change pas`, 'ni R ni S : il n’y a plus de configuration'], bonne: 0, aide: 'Échanger deux groupes, ou passer à l’image dans un miroir, inverse le sens de rotation de 1 → 2 → 3.',
    expl: <>Dans les deux cas le sens de 1 → 2 → 3 s’inverse : <b>{conf}</b> devient <b>{inv}</b>.</> };
  [q1].forEach(q => { q.pieges = q.pieges.filter(([v2]) => Math.abs(v2 - q.vrai) > 0.5); });
  return { intro: 'Carbone asymétrique, image dans un miroir et échange de groupes.', questions: [q1, q2, q3],
    retenir: ['Un carbone asymétrique (C*) est lié à 4 atomes ou groupes tous différents.', 'L’image dans un miroir d’un C* de configuration R est S (et réciproquement).', 'Échanger deux groupes inverse la lettre R ou S.'] };
}

// ── Évaporation et cristallisation de KNO₃ (terminale STL) : solubilités tabulées, équilibre atteint (pas de sursaturation) ──
const SOL_KNO3 = { 10: 20.9, 20: 31.6, 30: 45.8, 40: 63.9, 50: 85.5, 60: 110, 70: 138, 80: 169 };
function genCristRefroidissement() {
  let T1, T2, s2, sH, mEau, mSel, diss;
  for (let k = 0; k < 200; k++) {
    T1 = tire([70, 80]); T2 = tire([10, 20, 30, 40]); s2 = SOL_KNO3[T2]; sH = SOL_KNO3[T1]; mEau = tire([150, 200, 250, 300, 500]);
    diss = s2 * mEau / 100;
    mSel = Math.round(mEau * (s2 + tire([0.4, 0.6, 0.8]) * (sH - s2)) / 100 / 10) * 10;
    if (mSel > diss + 10 && mSel < sH * mEau / 100 && mSel !== 100) break;
  }
  const cr = mSel - diss, eta = cr / mSel * 100;
  const q1 = { id: 'r0', type: 'num', q: <>On dissout <b>{mSel}{NB}g</b> de nitrate de potassium KNO₃ dans <b>{mEau}{NB}g</b> d’eau à {T1}{NB}°C (solution insaturée), puis on refroidit jusqu’à <b>{T2}{NB}°C</b>. À cette température, la solubilité de KNO₃ est de <b>{nb(s2, 3)}{NB}g pour 100{NB}g d’eau</b>. Quelle masse maximale de KNO₃ reste dissoute dans les {mEau}{NB}g d’eau ? En <b>g</b>.</>, unite: 'g', vrai: diss, csMin: 3,
    aide: 'La solubilité est donnée pour 100 g d’eau : multipliez-la par m(eau) / 100 g.',
    pieges: [[s2, 'C’est la solubilité pour 100 g d’eau : ici il y a une autre masse d’eau, il faut la multiplier par m(eau) / 100.'], [s2 * 100 / mEau, 'Proportion à l’envers : plus il y a d’eau, plus on dissout de sel (on multiplie par m(eau) / 100).']],
    expl: <>m(dissous) = {nb(s2, 3)} × {mEau} / 100 = <b>{avecU(diss, 'g', 3)}</b>.</> };
  const q2 = { id: 'r1', type: 'num', q: <>Quelle masse de cristaux de KNO₃ obtient-on ? On suppose l’équilibre atteint à {T2}{NB}°C (pas de sursaturation) et qu’aucun sel n’est perdu par ailleurs. En <b>g</b>.</>, unite: 'g', vrai: cr, csMin: 3,
    aide: 'Ce qui cristallise est ce qui ne peut plus rester dissous : m(cristaux) = m(introduit) − m(dissous).',
    pieges: [[diss, 'C’est la masse restée dissoute. Les cristaux sont le reste : masse introduite moins masse dissoute.'], [mSel, 'C’est la masse totale introduite : une partie reste dissoute dans l’eau-mère.']],
    expl: <>m(cristaux) = m(introduit) − m(dissous) = {mSel} − {nb(diss, 3)} = <b>{avecU(cr, 'g', 3)}</b>.</> };
  const q3 = { id: 'r2', type: 'num', q: <>Calculez le rendement de la cristallisation η = m(cristaux) / m(introduit) × 100. En <b>%</b>.</>, unite: '%', vrai: eta, csMin: 2,
    aide: 'Rapport de la masse de cristaux à la masse de sel introduite, puis × 100.',
    pieges: [[cr / mSel, 'Vous avez donné le rapport : le rendement est demandé en %, multipliez par 100.'], [diss / mSel * 100, 'C’est la part restée dissoute dans l’eau-mère, pas celle récupérée.']],
    expl: <>η = {nb(cr, 3)} / {mSel} × 100 = <b>{avecU(eta, '%', 2)}</b>. Il reste du sel dans l’eau-mère : on ne récupère jamais tout.</> };
  [q1, q2, q3].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) / Math.abs(q.vrai) > 1e-3); });
  return { intro: 'Cristallisation par refroidissement de KNO₃ : sel dissous, masse de cristaux et rendement.', questions: [q1, q2, q3],
    retenir: ['Solubilité : masse maximale de sel dissoute pour 100 g d’eau à une température donnée.', 'm(cristaux) = m(introduit) − m(dissous), avec m(dissous) = solubilité × m(eau) / 100.', 'η = m(cristaux) / m(introduit) × 100 : jamais 100 %, le sel dissous reste dans l’eau-mère.'] };
}
function genCristEvaporation() {
  let Tv, s, mSel, mEau0, mSat, mF;
  for (let k = 0; k < 300; k++) {
    Tv = tire([40, 50, 60, 70, 80]); s = SOL_KNO3[Tv]; mSel = tire([30, 40, 50, 60, 80]); mEau0 = tire([100, 150, 200]);
    mSat = mSel * 100 / s; mF = tire([10, 20, 25, 30, 40, 50]);
    if (mSat < mEau0 - 10 && mF < mSat - 5 && mSat > 12) break;
  }
  const evap1 = mEau0 - mSat, diss = s * mF / 100, cr = mSel - diss;
  const q1 = { id: 'e0', type: 'num', q: <>Une solution contient <b>{mSel}{NB}g</b> de KNO₃ dans <b>{mEau0}{NB}g</b> d’eau, maintenue à <b>{Tv}{NB}°C</b> sous pression réduite. À cette température, la solubilité de KNO₃ est de <b>{nb(s, 3)}{NB}g pour 100{NB}g d’eau</b>. On évapore l’eau : quelle masse d’eau doit-il rester pour que la solution soit juste saturée ? En <b>g</b>.</>, unite: 'g', vrai: mSat, csMin: 3,
    aide: 'À saturation, les m(sel) grammes sont le maximum que dissout m(eau) : m(sel) / m(eau) = solubilité / 100 g. Isolez m(eau).',
    pieges: [[mSel * s / 100, 'Produit en croix à l’envers : m(eau) = m(sel) × 100 / solubilité, et non multiplié par la solubilité.'], [evap1, 'C’est la masse d’eau à évaporer, pas celle qui reste à saturation.']],
    expl: <>m(eau) = m(sel) × 100 / s = {mSel} × 100 / {nb(s, 3)} = <b>{avecU(mSat, 'g', 3)}</b>.</> };
  const q2 = { id: 'e1', type: 'num', q: <>Quelle masse d’eau faut-il évaporer au minimum pour que les premiers cristaux apparaissent ? En <b>g</b>.</>, unite: 'g', vrai: evap1, csMin: 3,
    aide: 'Masse d’eau évaporée = masse d’eau de départ − masse d’eau restante à saturation. Le sel, lui, ne s’évapore pas.',
    pieges: [[mSat, 'C’est la masse d’eau qui reste à saturation, pas celle qui a été évaporée.']],
    expl: <>m(évaporée) = {mEau0} − {nb(mSat, 3)} = <b>{avecU(evap1, 'g', 3)}</b>.</> };
  const q3 = { id: 'e2', type: 'num', q: <>On continue d’évaporer jusqu’à ce qu’il ne reste que <b>{mF}{NB}g</b> d’eau, toujours à {Tv}{NB}°C (équilibre atteint). Quelle masse de cristaux a-t-on obtenue ? En <b>g</b>.</>, unite: 'g', vrai: cr, csMin: 3,
    aide: 'La masse dissoute est la solubilité × m(eau restante) / 100 ; les cristaux sont le reste du sel.',
    pieges: [[diss, 'C’est la masse restée dissoute dans l’eau restante. Les cristaux sont le reste : masse de sel moins masse dissoute.'], [mSel, 'C’est toute la masse de sel : une partie reste dissoute dans l’eau restante.']],
    expl: <>m(dissous) = {nb(s, 3)} × {mF} / 100 = {nb(diss, 3)} g ; m(cristaux) = {mSel} − {nb(diss, 3)} = <b>{avecU(cr, 'g', 3)}</b>.</> };
  [q1, q2, q3].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) / Math.abs(q.vrai) > 1e-3); });
  return { intro: 'Cristallisation par évaporation de KNO₃ à température constante : eau à saturation, eau évaporée, masse de cristaux.', questions: [q1, q2, q3],
    retenir: ['Évaporer : le sel ne part pas, seule l’eau diminue, la solution se concentre.', 'À saturation : m(eau) = m(sel) × 100 / solubilité.', 'Au-delà : m(cristaux) = m(sel) − solubilité × m(eau restante) / 100.'] };
}

function genTitrageDirect() {
  let cB, VA, Ve, t;
  for (let k = 0; k < 300; k++) {
    cB = tire([0.020, 0.050, 0.100]); VA = tire([10, 20]); t = tire([0.8, 0.9, 1.1, 1.2, 1.3]);
    Ve = Math.round(2 * (t * 10 / 253.8) * VA / 1000 / cB * 1000 / 0.05) * 0.05;   // lu à une graduation (0,05 mL)
    Ve = Math.round(Ve * 100) / 100;
    if (Ve >= 6 && Ve <= 24) break;
  }
  const nT = cB * Ve / 1000, nI = nT / 2, cA = nI / (VA / 1000), m = cA * 0.100 * 253.8;
  const q1 = { id: 'td0', type: 'num', q: <>On dose le diiode I₂ d’un Lugol par une solution de thiosulfate de sodium (2{NB}S₂O₃²⁻ + I₂ → S₄O₆²⁻ + 2{NB}I⁻), de concentration <b>{nb(cB * 1000, 3)}{NB}mmol/L</b>. Le volume équivalent lu sur la burette est <b>V<sub>B,e</sub> = {nb(Ve, 4)}{NB}mL</b>. Quelle quantité de thiosulfate a-t-on versée à l’équivalence ? En <b>mol</b>.</>, unite: 'mol', vrai: nT, csMin: 3,
    aide: 'n = c × V, avec V converti en litres.',
    pieges: [[nT * 1000, 'Le volume doit être en litres : 1 mL = 0,001 L.'], [cB / (Ve / 1000), 'Une quantité de matière se calcule par n = c × V, et non par c divisée par V.']],
    expl: <>n(S₂O₃²⁻) = c<sub>B</sub> × V<sub>B,e</sub> = {nb(cB, 3)} × {nb(Ve / 1000, 4)} = <b>{avecU(nT, 'mol', 3)}</b>.</> };
  const q2 = { id: 'td1', type: 'num', q: <>Le volume de Lugol dosé est <b>V<sub>A</sub> = {VA}{NB}mL</b>. Quelle est la concentration en diiode c<sub>A</sub> du Lugol ? En <b>mol/L</b>.</>, unite: 'mol/L', vrai: cA, csMin: 3,
    aide: 'À l’équivalence, n(I₂) = n(S₂O₃²⁻) / 2 (coefficients de l’équation). Puis c = n / V, avec V en litres.',
    pieges: [[nT / (VA / 1000), 'Il faut diviser par 2 : 2 ions S₂O₃²⁻ réagissent avec 1 molécule I₂.'], [nI / VA, 'Le volume doit être en litres.'], [nT * 2 / (VA / 1000), 'C’est n(S₂O₃²⁻) divisée par 2, et non multipliée par 2.']],
    expl: <>n(I₂) = {avecU(nT, 'mol', 3)} / 2 = {avecU(nI, 'mol', 3)} ; c<sub>A</sub> = n(I₂) / V<sub>A</sub> = <b>{avecU(cA, 'mol/L', 3)}</b>.</> };
  const q3 = { id: 'td2', type: 'num', q: <>Le flacon annonce <b>1,00{NB}g</b> de diiode pour 100{NB}mL (M(I₂) = 253,8{NB}g/mol). Quelle masse de diiode contiennent 100{NB}mL de ce Lugol ? En <b>g</b>.</>, unite: 'g', vrai: m, csMin: 3,
    aide: 'Dans 100 mL = 0,100 L : n = c<sub>A</sub> × V, puis m = n × M.',
    pieges: [[cA * 253.8, 'C’est la masse dans 1 L : prenez 100 mL.'], [cA * 0.1, 'C’est la quantité de matière : multipliez par M pour obtenir la masse.']],
    expl: <>m = c<sub>A</sub> × V × M = {nb(cA, 3)} × 0,100 × 253,8 = <b>{avecU(m, 'g', 3)}</b>.</> };
  [q1, q2, q3].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && Math.abs(x - q.vrai) / Math.abs(q.vrai) > 1e-3); });
  return { intro: 'Titrage direct du diiode du Lugol par le thiosulfate : quantité versée, concentration, masse.', questions: [q1, q2, q3],
    retenir: ['À l’équivalence, les réactifs sont dans les proportions de l’équation : n(I₂)/1 = n(S₂O₃²⁻)/2.', 'n = c × V, avec V en litres.', 'La concentration cherchée se déduit de n(I₂) et du volume dosé V_A.'] };
}

// ───────────── Mesure et incertitudes (1G) : moyenne, incertitude-type de type A et de type B, arrondi, comparaison ─────────────
function genMesure1G() {
  // la balance est travaillée en milligrammes (valeurs de l'ordre de 20 000 mg), les autres instruments dans leur unité
  const sit0 = ME.SITUATIONS[tire(ME.IDS_SITUATIONS)], k = sit0.id === 'balance' ? 1000 : 1;
  const sit = k === 1 ? sit0 : { ...sit0, unite: 'mg', ref: sit0.ref * k, sigma: sit0.sigma * k, res: sit0.res * k, a: sit0.a * k, dec: 0 };
  const dec = sit.dec, un = sit.unite, fm = (x, d = dec) => ME.fmt(x, d);
  const lis = x => Number(x.toPrecision(2));
  // q1 : valeur moyenne de 5 mesures (une décimale de plus que les mesures)
  const v5 = ME.tirerSerie(sit, 5, 1 + Math.floor(Math.random() * 1e6)), m5 = ME.moyenne(v5);
  const q1 = { id: 'x0', type: 'num', q: <>On mesure 5 fois {sit.mesurande} ({sit.nom.toLowerCase()}). Valeurs, en {un} : <b>{v5.map(v => fm(v)).join(' ; ')}</b>. Calculez la valeur moyenne, avec une décimale de plus que les mesures, en <b>{un}</b>.</>, unite: un, vrai: m5, csMin: 3, tolRel: 0.5 * Math.pow(10, -dec) / Math.abs(m5),
    aide: 'Additionnez les 5 valeurs, puis divisez par le nombre de mesures N = 5.',
    pieges: [[m5 * 5, 'C’est la somme des mesures : il faut la diviser par N = 5.']],
    expl: <>x̄ = ({v5.map(v => fm(v)).join(' + ')}) / 5 = {fm(v5.reduce((x, y) => x + y, 0), dec)} / 5 = <b>{fm(m5, dec + 1)}{NB}{un}</b>.</> };
  // q2 : incertitude-type de type A à partir de s et N
  const N2 = tire([4, 9, 16, 25, 36]), s2 = lis(sit.sigma * tire([0.8, 1, 1.2, 1.5])), u2 = s2 / Math.sqrt(N2);
  const q2 = { id: 'x1', type: 'num', q: <>Une série de <b>N = {N2}</b> mesures indépendantes de {sit.mesurande} a pour écart-type expérimental <b>s = {nb(s2, 2)}{NB}{un}</b>. Calculez l’incertitude-type de type A de la moyenne, en <b>{un}</b>.</>, unite: un, vrai: u2, csMin: 2, tolRel: 0.05,
    aide: 'Type A : u = s / √N (racine carrée de N, pas N).',
    pieges: [[s2 / N2, 'On divise par la racine carrée de N, pas par N : u = s / √N.'], [s2 * Math.sqrt(N2), 'On divise s par √N, on ne le multiplie pas : u est plus petite que s.'], [s2, 'u n’est pas égale à s : s décrit une mesure, u décrit la moyenne de N mesures.']],
    expl: <>√{N2} = {nb(Math.sqrt(N2), 3)} ; u = s / √N = {nb(s2, 2)} / {nb(Math.sqrt(N2), 3)} = <b>{avecU(u2, un, 2)}</b>.</> };
  // q3 : effet du nombre de mesures
  const N3 = tire([4, 9, 25]), u3 = lis(sit.sigma * tire([0.8, 1, 1.2]) / Math.sqrt(N3));
  const q3 = { id: 'x2', type: 'num', q: <>Avec <b>N = {N3}</b> mesures, l’incertitude-type de type A de la moyenne de {sit.mesurande} vaut <b>u = {nb(u3, 2)}{NB}{un}</b>. On refait la série avec <b>N = {4 * N3}</b> mesures, dans les mêmes conditions (s inchangé). Calculez la nouvelle incertitude-type, en <b>{un}</b>.</>, unite: un, vrai: u3 / 2, csMin: 2, tolRel: 0.05,
    aide: 'u = s / √N : quand N est multiplié par 4, √N est multiplié par 2.',
    pieges: [[u3 / 4, 'N est multiplié par 4 mais u est divisée par √4 = 2, pas par 4.'], [u3 * 2, 'Plus de mesures diminuent u : elle est divisée par 2, pas multipliée.']],
    expl: <>√(N₂/N₁) = √4 = 2, donc u₂ = u₁ / 2 = {nb(u3, 2)} / 2 = <b>{avecU(u3 / 2, un, 2)}</b>.</> };
  // q4 : type B à partir d'un intervalle
  const a4 = sit.a * tire([1, 2]), min4 = sit.ref - a4, max4 = sit.ref + a4, u4 = a4 / Math.sqrt(3);
  const q4 = { id: 'x3', type: 'num', q: <>Pour {sit.mesurande}, la valeur ne peut être précisée mieux que dans l’intervalle de <b>{fm(min4)}{NB}{un}</b> à <b>{fm(max4)}{NB}{un}</b> (précision de l’instrument : ± {fm(a4, dec + (a4 < 1 ? 1 : 0))}{NB}{un}). On suppose toutes les valeurs de l’intervalle équiprobables (loi uniforme). Calculez l’incertitude-type de type B, en <b>{un}</b>.</>, unite: un, vrai: u4, csMin: 2, tolRel: 0.05,
    aide: 'D’abord la demi-largeur a = (valeur max − valeur min) / 2, puis u = a / √3.',
    pieges: [[a4, 'C’est la demi-largeur a : il faut la diviser par √3.'], [2 * a4 / Math.sqrt(3), 'Vous avez pris la largeur totale de l’intervalle : a est la moitié.'], [a4 / 3, 'On divise par √3 ≈ 1,73, pas par 3.'], [a4 * Math.sqrt(3), 'On divise a par √3, on ne le multiplie pas.']],
    expl: <>a = ({fm(max4)} − {fm(min4)}) / 2 = {nb(a4, 2)}{NB}{un} ; u = a / √3 = <b>{avecU(u4, un, 2)}</b>.</> };
  // q5 : arrondi de l'incertitude-type (1 chiffre significatif, 2 si le premier est 1, par excès)
  const raw = Number((sit.sigma * (0.25 + Math.random() * 0.9)).toPrecision(3)), u5 = ME.arrondiU(raw), p5 = ME.rangU(raw);
  const bas5 = Number((Math.floor(raw / Math.pow(10, p5) + 1e-9) * Math.pow(10, p5)).toFixed(8));
  const q5 = { id: 'x4', type: 'num', q: <>Un calcul donne une incertitude-type <b>u = {nb(raw, 3)}{NB}{un}</b>. Règle : u s’écrit avec 1 chiffre significatif (2 si son premier chiffre est 1), <b>arrondie par excès</b>. Écrivez u arrondie, en <b>{un}</b>.</>, unite: un, vrai: u5, tolRel: 0.001,
    aide: 'Gardez le premier chiffre significatif (et le suivant si le premier est 1), puis arrondissez vers le haut.',
    pieges: [[bas5, 'On arrondit par excès (vers le haut) pour ne pas sous-estimer l’incertitude.'], [Number(raw.toPrecision(2)), 'Trop de chiffres : 1 chiffre significatif suffit (2 seulement si le premier est 1).']],
    expl: <>u = {nb(raw, 3)}{NB}{un} s’écrit <b>{fm(u5, ME.decimalesDe(raw))}{NB}{un}</b> ; la valeur estimée s’arrondit ensuite à la même décimale.</> };
  // q6 : comparaison qualitative à la référence
  const compat = Math.random() < 0.5, uc = ME.arrondiU(lis(sit.sigma * tire([0.4, 0.5, 0.6]))), dc = ME.decimalesDe(uc);
  const mc = Number((sit.ref + (compat ? uc * tire([-0.6, -0.3, 0.4, 0.7]) : uc * tire([-5, -4, 4, 5]))).toFixed(dc + 1)), mr = ME.arrondiMoyenne(mc, uc);
  const bonne6 = compat ? 'compatible : l’écart est de l’ordre de l’incertitude ou plus petit' : 'à expliquer : l’écart est nettement plus grand que l’incertitude';
  const opts6 = melange([bonne6, compat ? 'à expliquer : l’écart est nettement plus grand que l’incertitude' : 'compatible : l’écart est de l’ordre de l’incertitude ou plus petit', 'incompatible : les deux valeurs ne sont pas identiques', 'on ne peut rien dire : une seule série ne permet pas de comparer']);
  const q6 = { id: 'x5', type: 'qcm', q: <>Pour {sit.mesurande}, un élève obtient <b>{fm(mr, dc)} ± {fm(uc, dc)}{NB}{un}</b>. La valeur de référence est <b>{fm(sit.ref)}{NB}{un}</b> ({sit.refTxt}). On compare qualitativement l’écart à l’incertitude. Que conclure ?</>, options: opts6, bonne: opts6.indexOf(bonne6),
    aide: 'Calculez l’écart |mesure − référence|, puis comparez-le à u : plus petit, du même ordre, ou plusieurs fois plus grand ?',
    expl: <>Écart = |{fm(mr, dc)} − {fm(sit.ref)}| = {fm(Math.abs(mr - sit.ref), dc)}{NB}{un}, soit environ {nb(Math.abs(mr - sit.ref) / uc, 1)} fois u. Deux valeurs mesurées sont rarement rigoureusement identiques : on juge l’écart par rapport à l’incertitude.</> };
  [q1, q2, q3, q4].forEach(q => { q.pieges = q.pieges.filter(([x]) => isFinite(x) && x !== q.vrai && Math.abs(x - q.vrai) > Math.max(q.tolRel * 1.5, 0.02) * Math.abs(q.vrai)); });
  q5.pieges = q5.pieges.filter(([x]) => isFinite(x) && x > 0 && Math.abs(x - u5) > 1e-9);
  return { intro: 'Mesure et incertitudes : valeur moyenne, incertitude-type de type A (s / √N) et de type B (a / √3), arrondi de l’incertitude et comparaison qualitative à une référence.', questions: [q1, q2, q3, q4, q5, q6],
    retenir: ['Moyenne : x̄ = (x₁ + … + x_N) / N ; type A : u = s / √N, type B (loi uniforme sur ± a) : u = a / √3.', 'u s’écrit avec 1 chiffre significatif (2 si le premier est 1), arrondie par excès ; la valeur estimée est arrondie à la même décimale.', 'Comparer à une référence : écart de l’ordre de u ou plus petit, compatible ; nettement plus grand que u, à expliquer.'] };
}

export const FAMILLES = [
  { id: 'titrage-direct', groupe: 'Formules', titre: 'Titrage direct du diiode par le thiosulfate : équivalence, concentration, masse (1re spé)', gen: genTitrageDirect, domaine: 'Titrage direct' },
  { id: 'vecteur-somme', groupe: 'Vecteurs', titre: 'Somme de deux vecteurs (forces)', gen: genSomme },
  { id: 'vecteur-difference', groupe: 'Vecteurs', titre: 'Différence de deux vecteurs (variation de vitesse)', gen: genDifference },
  { id: 'interactions', groupe: 'Unités', titre: 'Forces et champs : Coulomb, gravitation (1re spé)', gen: genInteractions, domaine: 'Interactions et champs' },
  { id: 'lum1-signes', groupe: 'Formules', titre: 'Lentille mince : les signes des distances algébriques, pas à pas (1re spé)', gen: genLentilleSignes, domaine: 'Lentille mince' },
  { id: 'oeil-accommodation', groupe: 'Formules', titre: 'L’œil réduit : accommodation et diamètre apparent (terminale STL)', gen: genOeilAccomm, domaine: 'Œil et loupe' },
  { id: 'oeil-loupe', groupe: 'Formules', titre: 'La loupe : grossissement et position de l’image (terminale STL)', gen: genOeilLoupe, domaine: 'Œil et loupe' },
  { id: 'microsc-grossissement', groupe: 'Formules', titre: 'Le microscope : grandissement et grossissement (terminale STL)', gen: genMicroGrossissement, domaine: 'Microscope' },
  { id: 'lunet-grossissement', groupe: 'Formules', titre: 'La lunette astronomique : grossissement et distance entre les lentilles (terminale STL)', gen: genLunetteGrossissement, domaine: 'Lunette astronomique' },
  { id: 'lunet-image', groupe: 'Formules', titre: 'La lunette astronomique : image intermédiaire et œil myope (terminale STL)', gen: genLunetteImage, domaine: 'Lunette astronomique' },
  { id: 'chir-reperer', groupe: 'Formules', titre: 'Repérer un carbone asymétrique et une molécule chirale (terminale STL)', gen: genChiraliteReperer, domaine: 'Chiralité et carbone asymétrique' },
  { id: 'chir-cram-bilan', groupe: 'Formules', titre: 'Dessin de Cram et image dans un miroir (terminale STL)', gen: genChiraliteCram, domaine: 'Chiralité et carbone asymétrique' },
  { id: 'chir-priorites', groupe: 'Formules', titre: 'Règles de priorité CIP : numéro atomique et double liaison (terminale STL)', gen: genChiralitePriorites, domaine: 'Configuration absolue R/S' },
  { id: 'chir-configuration', groupe: 'Formules', titre: 'Carbone asymétrique, miroir et configuration R/S (terminale STL)', gen: genChiraliteConfig, domaine: 'Configuration absolue R/S' },
  { id: 'dissoc-alpha', groupe: 'Formules', titre: 'Acide faible : conservation de la matière et coefficient de dissociation (terminale STL)', gen: genDissocAlpha, domaine: 'Acide faible, coefficient de dissociation et Ka' },
  { id: 'dissoc-ka', groupe: 'Formules', titre: 'Constante d’acidité, pKa et dilution d’un acide faible (terminale STL)', gen: genDissocKa, domaine: 'Acide faible, coefficient de dissociation et Ka' },
  { id: 'predo-rapport', groupe: 'Formules', titre: 'pH, pKa et rapport des concentrations d’un couple acide-base (terminale STL)', gen: genPredoRapport, domaine: 'pH, pKa et diagramme de prédominance' },
  { id: 'predo-beer', groupe: 'Formules', titre: 'Indicateur coloré : spectrophotométrie et pKa (terminale STL)', gen: genPredoBeer, domaine: 'pH, pKa et diagramme de prédominance' },
  { id: 'tampstl-prepa', groupe: 'Formules', titre: 'Préparer une solution tampon de pH donné (terminale STL)', gen: genTampstlPrepa, domaine: 'Solution tampon : choix du couple et préparation' },
  { id: 'tampstl-ajout', groupe: 'Formules', titre: 'pH d’un tampon après un ajout d’acide ou de base (terminale STL)', gen: genTampstlAjout, domaine: 'Solution tampon : choix du couple et préparation' },
  { id: 'ab-acf-rea-ph', groupe: 'Formules', titre: 'pH d’un acide fort et d’un acide faible', gen: genAbAcfPh, domaine: 'Acides et bases' },
  { id: 'ab-acf-rea-dilution', groupe: 'Formules', titre: 'Diluer un acide faible : pH avant et après', gen: genAbAcfDilution, domaine: 'Acides et bases' },
  { id: 'ab-pred-rea-rapport', groupe: 'Formules', titre: 'Concentrations des deux formes d’un couple selon le pH', gen: genAbPredRapport, domaine: 'Acides et bases' },
  { id: 'ab-pred-rea-pka', groupe: 'Formules', titre: 'Retrouver un pKa à partir du pH et d’un rapport', gen: genAbPredPka, domaine: 'Acides et bases' },
  { id: 'ab-tamp-rea-melange', groupe: 'Formules', titre: 'pH d’un tampon préparé par mélange', gen: genAbTampMelange, domaine: 'Acides et bases' },
  { id: 'ab-tamp-rea-ajout', groupe: 'Formules', titre: 'pH d’un tampon après un ajout d’acide ou de base fort', gen: genAbTampAjout, domaine: 'Acides et bases' },
  { id: 'co2dis-henry', groupe: 'Formules', titre: 'CO₂ dissous : eau en équilibre avec un gaz (terminale STL)', gen: genCo2Eau, domaine: 'CO₂ dissous : couples et solubilité' },
  { id: 'co2dis-milieu', groupe: 'Formules', titre: 'CO₂ dissous : milieu de pH imposé (terminale STL)', gen: genCo2Milieu, domaine: 'CO₂ dissous : couples et solubilité' },
  { id: 'crist-refroidissement', groupe: 'Formules', titre: 'Cristallisation par refroidissement : sel dissous, cristaux et rendement (terminale STL)', gen: genCristRefroidissement, domaine: 'Évaporation et cristallisation' },
  { id: 'crist-evaporation', groupe: 'Formules', titre: 'Cristallisation par évaporation : eau à saturation et masse de cristaux (terminale STL)', gen: genCristEvaporation, domaine: 'Évaporation et cristallisation' },
  { id: 'extrac-partage', groupe: 'Formules', titre: 'Extraction acide-base : fraction extraite selon le pH (terminale STL)', gen: genExtracPartage, domaine: 'Extraction acide-base : choix du pH' },
  { id: 'extrac-passes', groupe: 'Formules', titre: 'Extraction acide-base : extractions successives (terminale STL)', gen: genExtracPasses, domaine: 'Extraction acide-base : choix du pH' },
  { id: 'stereo-nombre', groupe: 'Formules', titre: 'Stéréoisomères : nombre de stéréoisomères, d’énantiomères et de diastéréoisomères (terminale STL)', gen: genStereoNombre, domaine: 'Stéréoisomères : énantiomères, diastéréoisomères, Z et E' },
  { id: 'stereo-racemique', groupe: 'Formules', titre: 'Mélange racémique : masse d’énantiomère actif (terminale STL)', gen: genStereoRacemique, domaine: 'Stéréoisomères : énantiomères, diastéréoisomères, Z et E' },
  { id: 'tens-libres-micelles', groupe: 'Formules', titre: 'Tensioactif au-dessus de la CMC : monomères libres, micelles et pourcentage (BTS)', gen: genTensLibres, domaine: 'Tensioactifs : de la structure à la CMC' },
  { id: 'tens-klevens', groupe: 'Formules', titre: 'CMC et longueur de la chaîne : prolongement du programme (BTS)', gen: genTensKlevens, domaine: 'Tensioactifs : de la structure à la CMC' },
  { id: 'microsc-mise-au-point', groupe: 'Formules', titre: 'Le microscope mis au point : positions et taille de l’image intermédiaire (terminale STL)', gen: genMicroMiseAuPoint, domaine: 'Microscope' },
  { id: 'lum1-conjugaison', groupe: 'Formules', titre: 'Lentille mince : conjugaison et grandissement (1re spé)', gen: genLentille, domaine: 'Lentille mince' },
  { id: 'ond1g-celerite', groupe: 'Formules', titre: 'Ondes mécaniques : célérité, retard et distance (1re spé)', gen: genOndCelerite, domaine: 'Ondes mécaniques : célérité et retard' },
  { id: 'ond1g-periode', groupe: 'Formules', titre: 'Ondes mécaniques : période, fréquence, longueur d’onde et célérité (1re spé)', gen: genOndesPeriode, domaine: 'Ondes mécaniques périodiques' },
  { id: 'pmel-calcul', groupe: 'Formules', titre: 'Plan de mélange : fractions, écart au milieu, coefficient binaire et prévision (BTS)', gen: genPlanMelange, domaine: 'Plans' },
  { id: 'pfac-calcul', groupe: 'Formules', titre: 'Plan factoriel : codage, coefficient, prévision et degrés de liberté (BTS)', gen: genPlanFactoriel, domaine: 'Plans' },
  { id: 'dop-calcul', groupe: 'Formules', titre: 'Effet Doppler : du décalage à la vitesse (TSTL)', gen: genDoppler, domaine: 'Ondes' },
  { id: 'dopg-calcul', groupe: 'Formules', titre: 'Effet Doppler : établir l’expression, son et lumière (TG)', gen: genDopplerTG, domaine: 'Ondes' },
  { id: 'titph-calcul', groupe: 'Formules', titre: 'Titrage pH-métrique : quantités de matière, V_E et C_A (TG)', gen: genTitrageTG, domaine: 'Titrage pH-métrique' },
  { id: 'phc-calcul', groupe: 'Formules', titre: 'pH et concentration en ions oxonium : relation et dilution (TG)', gen: genPhConcTG, domaine: 'pH et concentration en ions oxonium' },
  { id: 'cinv-calcul', groupe: 'Formules', titre: 'Cinétique : vitesse volumique, demi-réactions et constante d’ordre 1 (TG)', gen: genCinetiqueTG, domaine: 'Cinétique : vitesse volumique et ordre 1' },
  { id: 'rad-calcul', groupe: 'Formules', titre: 'Radioactivité : constante λ, noyaux restants, activité et datation (TG)', gen: genRadioactiviteTG, domaine: 'Radioactivité : décroissance et demi-vie' },
  { id: 'mol1g-qte-calcul', groupe: 'Formules', titre: 'Quantité de matière : masse molaire, masse, volume d’un gaz, d’un liquide et composition d’un mélange (1G)', gen: genQuantiteMatiere1G, domaine: 'Quantité de matière : masse molaire et volume molaire' },
  { id: 'mol1g-conc-calcul', groupe: 'Formules', titre: 'Concentration en quantité de matière : dissolution, masse à peser, prélèvement et dilution (1G)', gen: genConcentration1G, domaine: 'Concentration en quantité de matière : dissolution et dilution' },
  { id: 'fl1g-statique-calcul', groupe: 'Formules', titre: 'Statique des fluides : différence de pression, pression absolue, profondeur, force sur un bouchon et masse volumique (1G)', gen: genStatique1G, domaine: 'Statique des fluides : pression et profondeur' },
  { id: 'mes1g-calcul', groupe: 'Formules', titre: 'Mesure et incertitudes : moyenne, incertitude-type de type A et de type B, arrondi et comparaison à une référence (1G)', gen: genMesure1G, domaine: 'Mesure et incertitudes (1G)' },
  { id: 'diss1g-calcul', groupe: 'Formules', titre: 'Dissolution d’un solide ionique : équation, concentration en soluté apporté et concentration effective des ions (1G)', gen: genDissolutionIonique1G, domaine: 'Dissolution d’un solide ionique : équation et concentration des ions' },
  { id: 'comb1g-calcul', groupe: 'Formules', titre: 'Combustions : équation, énergie des liaisons, énergie molaire de réaction, écart avec la référence et pouvoir calorifique (1G)', gen: genCombustion1G, domaine: 'Combustions : énergie de réaction et énergies de liaison' },
  { id: 'lewis1g-calcul', groupe: 'Formules', titre: 'Schéma de Lewis : électrons de valence, doublets, doublets non liants et charge d’un atome (1G)', gen: genLewis1G, domaine: 'Schéma de Lewis des molécules et des ions' },
  { id: 'savon1g-calcul', groupe: 'Formules', titre: 'Savons : atomes de l’ion carboxylate, masse molaire du savon et quantité de matière (1G)', gen: genSavon1G, domaine: 'Savons et amphiphilie' },
  { id: 'coul1g-calcul', groupe: 'Formules', titre: 'Couleurs : mélange de lumières, filtres, couleur d’un objet éclairé, radiations absorbées et sous-pixels (1G)', gen: genCouleurs1G, domaine: 'Couleurs : synthèses additive et soustractive, couleur des objets' },
  { id: 'phot1g-calcul', groupe: 'Formules', titre: 'Lumière : domaine d’une onde, longueur d’onde, fréquence, énergie d’un photon, joules et électronvolts (1G)', gen: genPhoton1G, domaine: 'Domaines spectraux et énergie d’un photon' },
  { id: 'fl1g-pression-calcul', groupe: 'Formules', titre: 'Fluide au repos : force pressante F = P × S, pression d’un gaz, loi de Mariotte, ballon en altitude et test de la loi (1G)', gen: genPressionMariotte1G, domaine: 'Fluide au repos : pression et loi de Mariotte' },
  { id: 'redox1g-calcul', groupe: 'Formules', titre: 'Oxydo-réduction : électrons échangés, coefficients de l’équation, quantités de réactifs et de produits (1G)', gen: genRedox1G, domaine: 'Oxydo-réduction : couples, demi-équations et équation de réaction' },
  { id: 'geo1g-calcul', groupe: 'Formules', titre: 'Géométrie, électronégativité et polarité : écart Δχ, doublets, angle idéal, liaisons polarisées (1G)', gen: genGeoPolarite, domaine: 'Géométrie et polarité des entités' },
  { id: 'equ-calcul', groupe: 'Formules', titre: 'Équilibre chimique : Qr, K, taux d’avancement final et ajout d’un réactif (TG)', gen: genEquilibreTG, domaine: 'Équilibre chimique : Qr, K et taux d’avancement' },
  { id: 'fab-calcul', groupe: 'Formules', titre: 'Force des acides : pH, constante d’acidité, ions hydroxyde et équation du second degré (TG)', gen: genForceAcidesTG, domaine: 'Force des acides et des bases : Ka et tampon' },
  { id: 'pdi-calcul', groupe: 'Formules', titre: 'Couples acide-base : rapport des formes, pourcentage, concentration et pH (TG)', gen: genPredominanceTG, domaine: 'Force des acides et des bases : Ka et tampon' },
  { id: 'tmp-calcul', groupe: 'Formules', titre: 'Solution tampon : ajout d’acide, bilan de matière et pH du tampon (TG)', gen: genTamponTG, domaine: 'Force des acides et des bases : Ka et tampon' },
  { id: 'aam-calcul', groupe: 'Formules', titre: 'Acides α-aminés : rapport des formes, pourcentages et pH pour une proportion (TG)', gen: genAminoAcidesTG, domaine: 'Acides α-aminés : forme selon le pH' },
  { id: 'cdt-calcul', groupe: 'Formules', titre: 'Conductimétrie : loi de Kohlrausch, concentration, volume équivalent et bilan après l’équivalence (TG)', gen: genConductimetrieTG, domaine: 'Conductimétrie : conductivité et titrage' },
  { id: 'etl-calcul', groupe: 'Formules', titre: 'Dosage par étalonnage : constante de cellule, conductivité, droite d’étalonnage et dilution (TG)', gen: genEtalonnageTG, domaine: 'Conductimétrie : étalonnage et conductance' },
  { id: 'fre-calcul', groupe: 'Formules', titre: 'Mouvement circulaire : accélération dans le repère de Frenet, vitesse, composantes et norme (TG)', gen: genFrenetTG, domaine: 'Mouvement circulaire et repère de Frenet' },
  { id: 'top-calcul', groupe: 'Formules', titre: 'Formules topologiques : nombre d’hydrogènes d’après le squelette, liaisons C–H et masse molaire (TG)', gen: genTopoTG, domaine: 'Formules topologiques et isomérie de constitution' },
  { id: 'uvv-calcul', groupe: 'Formules', titre: 'Spectrophotométrie : loi de Beer-Lambert, concentration, absorbance, dilution et concentration massique (TG)', gen: genUvvTG, domaine: 'Spectroscopie UV-visible et loi de Beer-Lambert' },
  { id: 'irt-calcul', groupe: 'Formules', titre: 'Spectroscopie infrarouge : nombre d’onde, longueur d’onde et lignes d’un tableau de données (TG)', gen: genIrTabTG, domaine: 'Spectroscopie infrarouge : données tabulées' },
  { id: 'rc-calcul', groupe: 'Formules', titre: 'Circuit RC : temps caractéristique, capacité, intensité initiale, tension à t = n τ et durée de la charge (TG)', gen: genRCTG, domaine: 'Circuit RC : charge et décharge d’un condensateur' },
  { id: 'lun-calcul', groupe: 'Formules', titre: 'Lunette afocale : grossissement, distance entre les lentilles, oculaire et angle du faisceau émergent (TG)', gen: genLunetteTG, domaine: 'Lunette afocale : schéma, faisceau et grossissement' },
  { id: 'pol-calcul', groupe: 'Formules', titre: 'Polymères : reconnaître le motif, atomes de carbone d’une chaîne et, pour aller plus loin, masse molaire (TG)', gen: genPolymeresTG, domaine: 'Familles fonctionnelles et polymères' },
  { id: 'nwt-calcul', groupe: 'Formules', titre: 'Deuxième loi de Newton : somme des forces, accélération, tension du câble et équilibre (TG)', gen: genNewtonTG, domaine: 'Deuxième loi de Newton' },
  { id: 'pes-calcul', groupe: 'Formules', titre: 'Champ de pesanteur uniforme : vitesse, position, portée et théorème de l’énergie cinétique (TG)', gen: genPesanteurTG, domaine: 'Mouvement dans un champ de pesanteur uniforme' },
  { id: 'cpl-calcul', groupe: 'Formules', titre: 'Particule chargée dans un condensateur plan : champ, accélération, déviation, vitesse après accélération et durée de traversée (TG)', gen: genCondensateurTG, domaine: 'Particule chargée dans un condensateur plan' },
  { id: 'kep-calcul', groupe: 'Formules', titre: 'Satellites et lois de Kepler : accélération, vitesse, période, masse de l’astre et orbite stationnaire (TG)', gen: genKeplerTG, domaine: 'Satellites et lois de Kepler' },
  { id: 'vac-calcul', groupe: 'Formules', titre: 'Vecteurs vitesse et accélération : coordonnées approchées et dérivées de x(t) (TG)', gen: genVecteursVATG, domaine: 'Vecteurs vitesse et accélération' },
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
