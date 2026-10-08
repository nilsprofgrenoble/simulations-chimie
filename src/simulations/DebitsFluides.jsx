import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, indicesProfond, fmt, lireNombre, proche } from "../commun";

// ====================================================
//  SIM 27 — DÉBITS MASSIQUE ET VOLUMIQUE : UNE CUVE QUI SE REMPLIT SUR UNE BALANCE
// ====================================================

// ── Modèle (fonctions pures) ──
// Fluide incompressible, de masse volumique ρ uniforme ; débit constant (régime permanent) pendant la mesure.
//   Qm = m / Δt     Qv = V / Δt     Qm = ρ · Qv     ρ = d × ρ_eau   (ρ_eau = 1000 kg·m⁻³)
// Le temps est connu à 1 s près (2 chiffres significatifs sous 100 s, 3 de 100 à 999 s), la masse à 0,1 g près.
// Le résultat a autant de chiffres significatifs que la donnée la moins précise. Les constantes ci-dessous sont choisies
// pour que Qm, arrondi ainsi, soit le même quelle que soit la durée (vérifié par balayage de 1 s à la durée de remplissage,
// pour tous les fluides et toutes les ouvertures).
export const RHO_EAU = 1000;                  // kg·m⁻³
export const FLUIDES = {
  eau:     { nom: 'Eau',           d: 1,     coul: '#38bdf8' },
  vin:     { nom: 'Vin',           d: 0.991, coul: '#b91c5c' },
  huile:   { nom: "Huile d'olive", d: 0.92,  coul: '#d4a017' },
  lait:    { nom: 'Lait',          d: 1.03,  coul: '#f1f5f9' },
  essence: { nom: 'Essence',       d: 0.75,  coul: '#f59e0b' },
};
const CAP_L = 150;                     // capacité de la cuve (L)
const M_CUVE = 4.3;                    // masse de la cuve vide (kg)
const Q_PAR_OUV = 0.024;               // débit volumique (L·s⁻¹) par unité d'ouverture (1 à 10)
const qvOuv = ouv => ouv * Q_PAR_OUV;  // L·s⁻¹ : ne dépend que de l'ouverture (même charge, fluides peu visqueux)
export const rhoDe = d => Math.round(d * RHO_EAU * 1e6) / 1e6;

// Valeurs du parcours guidé : vin, ouverture 5, Δt = 5 min 00 s → m = 35,6760 kg
const G_M = 35.676, G_DT_MIN = 5, G_DT_S = 300, G_RHO = 991, G_OUV = 5;
const G_QM_MIN = G_M / G_DT_MIN;                 // 7,1352 kg·min⁻¹
const G_QM_H = G_QM_MIN * 60;                    // 428,112 kg·h⁻¹
const G_QM_S = G_M / G_DT_S;                     // 0,11892 kg·s⁻¹
const G_QV_H = G_QM_H / G_RHO;                   // 0,432 m³·h⁻¹
const G_QV_LS = G_QV_H * 1000 / 3600;            // 0,120 L·s⁻¹
const G_V_L = G_M / G_RHO * 1000;                // 36,0 L

// ── Moteur de calcul avec unités ──
// Chaque facteur est une fraction { num: [{ n, s, u }], den: [{ n, s, u }] } : n nombre (facultatif, 1 sous-entendu),
// s texte affiché (pour garder les zéros significatifs), u unité (facultative : « d » n'a pas d'unité).
// div : le facteur est un diviseur (÷) ; compact : écrit « 991 kg·m⁻³ » plutôt qu'en fraction.
const UNITES = { kg: 'm', g: 'm', t: 'm', s: 't', min: 't', h: 't', 'm³': 'V', L: 'V', mL: 'V', m: 'l', mm: 'l', 'm²': 'l' };
const COUL = { m: '#7e22ce', t: '#1d4ed8', V: '#047857', l: '#be185d' };
export const COUL_PREF = '#d97706';                          // préfixe d'unité : le « k » de kg, le « m » de mL
const PREFIXE = { kg: 'k', mL: 'm', mm: 'm' };
const INV = { s: 's⁻¹', min: 'min⁻¹', h: 'h⁻¹', kg: 'kg⁻¹', g: 'g⁻¹', t: 't⁻¹', 'm³': 'm⁻³', L: 'L⁻¹', mL: 'mL⁻¹', m: 'm⁻¹', mm: 'mm⁻¹', 'm²': 'm⁻²' };
const NOM_DIM = { m: 'masse', t: 'temps', V: 'volume', l: 'longueur' };
const coulUnite = u => COUL[UNITES[u]];
// « 1 grande = k petites »
const GRAND_PETIT = [['h', 'min', 60], ['min', 's', 60], ['h', 's', 3600], ['t', 'kg', 1000], ['kg', 'g', 1000], ['t', 'g', 1e6],
  ['m³', 'L', 1000], ['L', 'mL', 1000], ['m³', 'mL', 1e6], ['m', 'mm', 1000]];
function rapport(de, vers) {                         // renvoie [nDe, nVers] tels que nDe·de = nVers·vers
  for (const [G, P, k] of GRAND_PETIT) {
    if (G === de && P === vers) return [1, k];
    if (P === de && G === vers) return [k, 1];
  }
  return null;
}
// Facteur de conversion égal à 1 qui fait disparaître l'unité « de » : pos = 'num' ou 'den' (place de « de » dans la grandeur).
// Quand on change de préfixe (mm → m, g → kg, L → m³…), le facteur s'écrit avec une puissance de 10 : 1 mm = 10⁻³ m.
const SUPE = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const puissance10 = e => `10${String(e).split('').map(c => SUPE[c]).join('')}`;
export function facteurConv(de, vers, pos) {
  const [nDe, nVers] = rapport(de, vers);
  const c = nVers / nDe, e = Math.round(Math.log10(c));
  if (e !== 0 && Math.abs(c - 10 ** e) < 1e-12 * Math.max(1, c)) {         // 1 de = 10^e vers
    const it = () => ({ n: 10 ** e, s: puissance10(e), u: vers });
    return pos === 'num' ? { num: [it()], den: [{ n: 1, u: de }] } : { num: [{ n: 1, u: de }], den: [it()] };
  }
  return pos === 'num'
    ? { num: [{ n: nVers, u: vers }], den: [{ n: nDe, u: de }] }
    : { num: [{ n: nDe, u: de }], den: [{ n: nVers, u: vers }] };
}
export const facteurRho = rho => ({ div: true, compact: true, num: [{ n: rho, u: 'kg' }], den: [{ u: 'm³' }] });   // ÷ ρ, ρ en kg·m⁻³
function chaineQm(m, uM, dt, uT, cM, cT, sm, sdt) {
  const f = [{ num: [{ n: m, s: sm, u: uM }], den: [{ n: dt, s: sdt, u: uT }] }];
  if (uM !== cM) f.push(facteurConv(uM, cM, 'num'));
  if (uT !== cT) f.push(facteurConv(uT, cT, 'den'));
  return f;
}
function chaineQv(qm, uM, uT, cV, cT, rho, sq) {      // Qv = Qm / ρ, puis conversions
  const f = [{ num: [{ n: qm, s: sq, u: uM }], den: [{ u: uT }] }];
  if (uM !== 'kg') f.push(facteurConv(uM, 'kg', 'num'));
  f.push(facteurRho(rho));
  if (cV !== 'm³') f.push(facteurConv('m³', cV, 'num'));
  if (uT !== cT) f.push(facteurConv(uT, cT, 'den'));
  return f;
}
const cote = (f, c) => (f.div ? (c === 'num' ? 'den' : 'num') : c);      // côté réel d'une unité (un diviseur inverse les côtés)
export const nf = x => {
  if (Number.isInteger(x)) return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return String(Number(x.toPrecision(10))).replace('.', ',');
};
export const sig = (x, n = 3) => {                          // n chiffres significatifs, zéros finaux conservés
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  let s = Number(x).toPrecision(n);
  if (/e/.test(s)) { const v = Number(s); s = Math.abs(v) >= 1 ? String(Math.round(v)) : v.toFixed(Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(v))))); }
  return s.replace('.', ',');
};
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sciTxt = (x, n = 3) => {                // notation scientifique : 3,14 × 10⁻⁴
  if (!isFinite(x) || x === 0) return '0';
  const [m, e] = Number(x).toExponential(n - 1).split('e');
  return `${m.replace('.', ',')}\u00A0×\u00A010${String(Number(e)).split('').map(c => SUP[c]).join('')}`;
};
// Longueurs : m · m → m², m³ · m⁻² → m… (les unités de la famille « m » se regroupent)
const FAM = { m: 1, 'm²': 2, 'm³': 3 }, NOM_FAM = { 1: 'm', 2: 'm²', 3: 'm³' };
export function analyser(facteurs) {
  const occ = {};
  facteurs.forEach((f, fi) => ['num', 'den'].forEach(c => f[c].forEach((it, ii) => {
    if (!it.u) return;
    const o = occ[it.u] || (occ[it.u] = { num: [], den: [] });
    o[cote(f, c)].push(`${fi}-${c}-${ii}`);
  })));
  const barres = new Set();
  Object.values(occ).forEach(o => { const k = Math.min(o.num.length, o.den.length); for (let i = 0; i < k; i++) { barres.add(o.num[i]); barres.add(o.den[i]); } });
  const restant = { num: [], den: [] };
  facteurs.forEach((f, fi) => ['num', 'den'].forEach(c => f[c].forEach((it, ii) => { if (it.u && !barres.has(`${fi}-${c}-${ii}`)) restant[cote(f, c)].push(it.u); })));
  const nums = [], dens = [];
  let valeur = 1;
  facteurs.forEach(f => ['num', 'den'].forEach(c => f[c].forEach(it => {
    const n = it.n ?? 1, haut = cote(f, c) === 'num';
    valeur = haut ? valeur * n : valeur / n;
    if (n !== 1 || it.s) (haut ? nums : dens).push(it.s ?? nf(n));
  })));
  let fusion = false;
  const fam = [...restant.num.map(u => [u, 1]), ...restant.den.map(u => [u, -1])].filter(([u]) => FAM[u]);
  if (fam.length >= 2) {
    const e = fam.reduce((a, [u, sg]) => a + sg * FAM[u], 0);
    const gardeN = restant.num.filter(u => !FAM[u]), gardeD = restant.den.filter(u => !FAM[u]);
    if (e > 0) gardeN.push(NOM_FAM[e]); else if (e < 0) gardeD.push(NOM_FAM[-e]);
    restant.num = gardeN; restant.den = gardeD; fusion = true;
  }
  return { barres, restant, valeur, nums, dens, fusion };
}
const EXP = { s: 's⁻¹', min: 'min⁻¹', h: 'h⁻¹' };
const uniteSimple = cible => { const [a, b] = cible.split('/'); return `${a}·${EXP[b]}`; };   // 'kg/h' → 'kg·h⁻¹'

// ── Briques d'affichage des calculs avec unités ──
export function Un({ u, inv, barre }) {
  const txt = inv ? INV[u] : u, p = PREFIXE[u];
  return (
    <span style={{ color: coulUnite(u), fontWeight: 700,
      ...(barre ? { textDecoration: 'line-through', textDecorationThickness: 2, textDecorationColor: '#dc2626', opacity: 0.7 } : {}) }}>
      {p ? <><span style={{ color: COUL_PREF }}>{txt.slice(0, p.length)}</span>{txt.slice(p.length)}</> : txt}
    </span>
  );
}
function UniteFinale({ restant }) {
  const parts = [...restant.num.map((u, i) => <Un key={`n${i}`} u={u}/>), ...restant.den.map((u, i) => <Un key={`d${i}`} u={u} inv/>)];
  return <span>{parts.flatMap((p, i) => i ? [<span key={`p${i}`} style={{ color: '#64748b' }}>·</span>, p] : [p])}</span>;
}
const UniteRho = () => <span><Un u="kg"/><span style={{ color: '#64748b' }}>·</span><Un u="m³" inv/></span>;
const estPuiss = t => typeof t === 'string' && /^10[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+$/.test(t);          // « 10⁻³ » : même couleur que le préfixe
const Nb = ({ t }) => (estPuiss(t) ? <span style={{ color: COUL_PREF, fontWeight: 700 }}>{t}</span> : <>{t}</>);
function Item({ it, barre }) {
  return <span style={{ whiteSpace: 'nowrap' }}>{(it.n != null || it.s) && <><Nb t={it.s ?? nf(it.n)}/>{it.u ? ' ' : ''}</>}{it.u && <Un u={it.u} barre={barre}/>}</span>;
}
function Fraction({ f, fi, barres }) {
  const bloc = c => f[c].map((it, ii) => <span key={ii}>{ii > 0 && ' · '}<Item it={it} barre={barres.has(`${fi}-${c}-${ii}`)}/></span>);
  if (f.compact) {                                   // « 991 kg·m⁻³ »
    const parts = [
      ...f.num.map((it, ii) => <Item key={`n${ii}`} it={it} barre={barres.has(`${fi}-num-${ii}`)}/>),
      ...f.den.map((it, ii) => <span key={`d${ii}`} style={{ whiteSpace: 'nowrap' }}>{it.n != null && <>{nf(it.n)}{' '}</>}<Un u={it.u} inv barre={barres.has(`${fi}-den-${ii}`)}/></span>)];
    return <span style={{ margin: '0 3px' }}>{parts.flatMap((p, i) => i ? [<span key={`p${i}`} style={{ color: '#64748b' }}>·</span>, p] : [p])}</span>;
  }
  if (!f.den.length) return <span style={{ margin: '0 3px' }}>{bloc('num')}</span>;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', margin: '0 3px' }}>
      <span style={{ padding: '0 6px 1px', borderBottom: `1.5px solid ${KIT.txt2}` }}>{bloc('num')}</span>
      <span style={{ padding: '1px 6px 0' }}>{bloc('den')}</span>
    </span>
  );
}
function FractionNombres({ nums, dens }) {
  const lie = t => t.flatMap((x, i) => (i ? [' × ', <Nb key={i} t={x}/>] : [<Nb key={i} t={x}/>]));
  const haut = nums.length ? lie(nums) : '1';
  if (!dens.length) return <span style={{ margin: '0 3px' }}>{haut}</span>;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', margin: '0 3px' }}>
      <span style={{ padding: '0 6px 1px', borderBottom: `1.5px solid ${KIT.txt2}` }}>{haut}</span>
      <span style={{ padding: '1px 6px 0' }}>{lie(dens)}</span>
    </span>
  );
}
function LegendeUnites({ dims, prefixe }) {
  const morceaux = [...dims.map(d => <span key={d} style={{ color: COUL[d], fontWeight: 700 }}>{NOM_DIM[d]}</span>),
    ...(prefixe ? [<span key="p" style={{ color: COUL_PREF, fontWeight: 700 }}>préfixe</span>] : [])];
  return (
    <span style={{ fontSize: 12, color: KIT.txt2 }}>
      couleur des unités : {morceaux.flatMap((p, i) => i ? [' · ', p] : [p])}
    </span>
  );
}
// Un calcul complet : les fractions, les unités qui se simplifient (barrées), puis le résultat (3 chiffres significatifs).
export function Chaine({ nom, litt, facteurs, cacher = false, nsf = 3, sci = false }) {
  const { barres, restant, valeur, nums, dens, fusion } = analyser(facteurs);
  const unites = facteurs.flatMap(f => [...f.num, ...f.den]).map(it => it.u).filter(Boolean);
  const dims = [...new Set(unites.map(u => UNITES[u]))];
  const ligne = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, lineHeight: 1.25 };
  return (
    <div style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '8px 10px', fontSize: 15.5,
      color: KIT.txt, display: 'flex', flexDirection: 'column', gap: 6, overflowX: 'auto' }}>
      {litt && <div style={{ ...ligne, color: KIT.txt }}><span style={{ fontWeight: 700, marginRight: 4 }}>{avecIndices(nom)} =</span><span>{avecIndices(litt)}</span></div>}
      <div style={ligne}>
        {nom && <span style={{ fontWeight: 700, marginRight: 4 }}>{avecIndices(nom)} =</span>}
        {facteurs.map((f, fi) => <span key={fi} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {fi > 0 && <span style={{ color: KIT.txt2, margin: '0 2px' }}>{f.div ? '÷' : '×'}</span>}<Fraction f={f} fi={fi} barres={barres}/></span>)}
      </div>
      {(barres.size > 0 || fusion) && (
        <div style={ligne}>
          <span style={{ marginRight: 4 }}>=</span><FractionNombres nums={nums} dens={dens}/><span style={{ marginLeft: 4 }}><UniteFinale restant={restant}/></span>
        </div>)}
      <div style={ligne}>
        <span style={{ marginRight: 4 }}>=</span>
        {cacher ? <strong style={{ color: KIT.txt2 }}>?</strong> : <strong>{sci ? sciTxt(valeur, nsf) : sig(valeur, nsf)}</strong>}
        <span style={{ marginLeft: 6 }}><UniteFinale restant={restant}/></span>
      </div>
      <div><LegendeUnites dims={dims} prefixe={unites.some(u => PREFIXE[u])}/></div>
    </div>
  );
}
// Changement de préfixe : D = 80 mm = 80 × 10⁻³ m = 0,080 m (puissance de 10 de la couleur du préfixe)
export function ConvPrefixe({ nom, n, de, vers, e, nsf = 2 }) {
  const val = n * 10 ** e, sp = { color: '#64748b' };
  return (
    <div style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '8px 10px', fontSize: 15.5, color: KIT.txt, display: 'flex', flexDirection: 'column', gap: 6, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, lineHeight: 1.5 }}>
        <span style={{ fontWeight: 700 }}>{avecIndices(nom)} =</span>
        <span>{nf(n)} <Un u={de}/></span><span style={sp}>=</span>
        <span>{nf(n)} × <span style={{ color: COUL_PREF, fontWeight: 700 }}>{puissance10(e)}</span> <Un u={vers}/></span><span style={sp}>=</span>
        <span><strong>{sig(val, nsf)}</strong> <Un u={vers}/></span>
      </div>
      <div><LegendeUnites dims={[UNITES[vers]]} prefixe/></div>
    </div>
  );
}
// Fraction isolée (pour les choix d'un QCM)
export const Fr = ({ n1, u1, n2, u2 }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span>×</span><Fraction f={{ num: [{ n: n1, u: u1 }], den: [{ n: n2, u: u2 }] }} fi={0} barres={new Set()}/>
  </span>
);
// ρ = d × ρ_eau, détaillé, toujours en kg·m⁻³
export const RhoLigne = ({ d }) => (
  <div style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '8px 10px', fontSize: 15.5, color: KIT.txt, lineHeight: 1.6 }}>
    ρ = d × ρ<sub>eau</sub> = {String(d).replace('.', ',')} × 1{' '}000 <UniteRho/> = <strong>{nf(rhoDe(d))}</strong> <UniteRho/>
  </div>
);
export const AlerteRho = () => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fef2f2', border: '2px solid #dc2626', borderRadius: 8,
    padding: '6px 10px', fontSize: 13.5, color: '#7f1d1d', lineHeight: 1.5 }}>
    <span style={{ fontSize: 26 }} aria-hidden="true">☠️</span>
    <div><strong>Danger unités !</strong> Dans ce module, la masse volumique s’exprime <strong>toujours en kg·m⁻³</strong> (unité SI), avant tout calcul. Jamais en g·cm⁻³, ni en kg·L⁻¹.</div>
  </div>
);

// ── Mise en forme ──
const mmss = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
const dec4 = x => (Object.is(x, -0) ? 0 : x).toFixed(4).replace('.', ',');
const sfTemps = t => (t < 100 ? 2 : String(t).length);                           // chiffres significatifs d'une durée à 1 s près
const sfMasse = m => dec4(m).replace(/[^0-9]/g, '').replace(/^0+/, '').length || 1;   // chiffres significatifs de l'affichage de la balance
const QM_UNITES = ['kg/s', 'kg/min', 'kg/h', 'g/s', 't/h'];
const QV_UNITES = ['m³/s', 'm³/h', 'L/s', 'L/min', 'L/h'];
const ETAT0 = { tc: 0, t: 0, V: 0, ouvert: false, plein: false, qref: null, mixte: false };   // tc : temps continu ; t : temps affiché (secondes entières)

const LITT1 = { Q_m: 'm / Δt', Q_v: 'Q_m / ρ', V: 'm / ρ' };
const Ch1 = props => <Chaine litt={LITT1[props.nom]} {...props}/>;

export function SimulationDebits() {
  const [mode, setMode] = useState('explore');                  // on arrive sur l'exploration libre
  const [guide, setGuide] = useEtatPersistant('debits-guide-v2', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [fluide, setFluide] = useState('eau');
  const [ouv, setOuv] = useState(5);
  const [vitesse, setVitesse] = useState(10);
  const [duree, setDuree] = useState(0);                       // durée programmée (s) ; 0 : arrêt à la main
  const [run, setRun] = useState(ETAT0);
  const [tareOff, setTareOff] = useState(0);                   // kg
  const [reveleQ, setReveleQ] = useState(false);
  const [uQm, setUQm] = useState('kg/s');
  const [uQv, setUQv] = useState('L/s');
  const enGuide = mode === 'guide';
  const d = FLUIDES[fluide].d, rho = rhoDe(d);
  const qv = qvOuv(ouv);                                       // L·s⁻¹

  // ── Écoulement : le temps simulé avance de vitesse × 0,05 s toutes les 50 ms ; le chronomètre et la balance ne changent qu'à la seconde ──
  useEffect(() => {
    if (!run.ouvert) return undefined;
    const id = setInterval(() => {
      setRun(r => {
        if (!r.ouvert) return r;
        let tc = r.tc + 0.05 * vitesse, t = Math.floor(tc + 1e-9), fin = false, plein = false;
        if (duree > 0 && t >= duree) { t = duree; tc = duree; fin = true; }
        let V = r.V + qv * (t - r.t);
        if (V > CAP_L + 1e-9) { t = r.t + Math.floor((CAP_L - r.V) / qv + 1e-9); tc = t; V = r.V + qv * (t - r.t); fin = true; plein = true; }
        return { tc, t, V, ouvert: !fin, plein, qref: r.qref ?? qv, mixte: r.mixte || (r.qref != null && t > r.t && Math.abs(qv - r.qref) > 1e-12) };
      });
    }, 50);
    return () => clearInterval(id);
  }, [run.ouvert, vitesse, duree, qv]);

  const dureeAtteinte = duree > 0 && run.t >= duree;
  const peutOuvrir = !run.ouvert && !run.plein && !dureeAtteinte;
  const ouvrir = () => { if (peutOuvrir) setRun(r => ({ ...r, ouvert: true })); };
  const fermer = () => setRun(r => ({ ...r, ouvert: false }));
  const vider = () => setRun(ETAT0);
  const masseTotale = M_CUVE + run.V * rho / 1000;
  const tarer = () => setTareOff(Math.round(masseTotale * 1e6) / 1e6);
  const mAff = Math.round((masseTotale - tareOff) * 1e4) / 1e4;      // la balance affiche 0,1 g près
  const mesureFaite = !run.ouvert && run.t > 0;
  const dtEnMin = duree > 0 && duree % 60 === 0;
  const dtVal = dtEnMin ? duree / 60 : run.t, dtUn = dtEnMin ? 'min' : 's';
  const dtTxt = dtEnMin ? sig(duree / 60, sfTemps(duree)) : String(run.t);   // autant de chiffres significatifs que les secondes
  const tareFaite = Math.abs(tareOff - M_CUVE) < 1e-6;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const reglageGuide = fluide === 'vin' && ouv === G_OUV && duree === G_DT_S;
  const mesureGuide = reglageGuide && tareFaite && !run.ouvert && run.t === G_DT_S;
  function reglerGuide() { setFluide('vin'); setOuv(G_OUV); setDuree(G_DT_S); setVitesse(60); vider(); setTareOff(0); }
  const mesure2 = fluide === 'vin' && ouv === G_OUV && duree === 120 && tareFaite && !run.ouvert && run.t === 120;
  const huileFaite = fluide === 'huile' && ouv === G_OUV && duree === G_DT_S && tareFaite && !run.ouvert && run.t === G_DT_S;
  const qcmFacteur = [
    <Fr key="a" n1={1} u1="min" n2={60} u2="s"/>,
    <Fr key="b" n1={60} u1="s" n2={1} u2="min"/>,
    <Fr key="c" n1={3600} u1="s" n2={1} u2="h"/>,
  ];
  const chGuideQm = (cM, cT) => chaineQm(G_M, 'kg', G_DT_MIN, 'min', cM, cT, '35,6760', '5,00');
  const ETAPES = [
    { id: 'objectif', titre: 'Qu’est-ce qu’un débit ?', focus: ['manip'],
      texte: <>Une canalisation remplit une cuve de <strong>vin</strong> posée sur une balance. On veut caractériser l’écoulement : combien de fluide passe, et à quelle « vitesse » la cuve se remplit.</>,
      tache: { type: 'qcm', q: 'Que mesure un débit massique ?',
        options: ['La masse de fluide qui s’écoule par unité de temps', 'La masse totale de fluide contenue dans le tuyau', 'La vitesse à laquelle avance le fluide dans le tuyau'], bonne: 0,
        expl: 'Un débit est toujours une quantité divisée par une durée : « combien en une seconde, une minute, une heure ». La vitesse du fluide est une autre grandeur, traitée dans la simulation suivante.' } },
    { id: 'regler', titre: 'Régler l’expérience', focus: ['manip'],
      texte: <>Fluide : le <strong>vin</strong>, robinet réglé sur 5, mesure de <strong>Δt = 5 min</strong> (le chronomètre s’arrête tout seul). Le temps est accéléré ×60 pour ne pas attendre cinq vraies minutes.</>,
      tache: { type: 'action', ok: reglageGuide, label: 'Régler l’expérience', faire: reglerGuide, consigne: reglageGuide ? null : 'Cliquez pour régler le vin, l’ouverture et la durée' } },
    { id: 'tarer', titre: 'Tarer la balance', focus: ['manip'],
      texte: <>La balance indique la masse de la <strong>cuve vide</strong>. Or on ne veut que la masse de <strong>vin</strong> : on « tare » la balance pour que l’affichage revienne à zéro.</>,
      tache: { type: 'action', ok: tareFaite, label: 'Tarer la balance', faire: tarer,
        bloque: run.V > 0 ? 'La cuve contient déjà du fluide : videz-la (↺) avant de tarer.' : null,
        consigne: tareFaite ? null : 'Appuyez sur « Tarer »' } },
    { id: 'mesurer', titre: 'Faire la mesure', focus: ['manip'],
      texte: <>On ouvre le robinet : le chronomètre démarre et le vin coule dans la cuve. Au bout de 5 min, tout s’arrête.</>,
      tache: { type: 'action', ok: mesureGuide, label: 'Ouvrir le robinet', faire: ouvrir,
        bloque: !reglageGuide || !tareFaite ? 'Réglez l’expérience et tarez la balance (étapes précédentes).' : null,
        attente: run.ouvert ? 'Le vin coule… (chronomètre accéléré ×60)' : null,
        consigne: mesureGuide ? null : (run.ouvert ? null : 'Ouvrez le robinet') } },
    { id: 'lire', titre: 'Lire la masse recueillie', focus: ['manip'],
      texte: <>Le chronomètre indique la durée Δt = 5 min 00 s. Lisez la masse de vin affichée par la balance (tarée).</>,
      tache: { type: 'num', q: 'Masse m de vin recueillie', unite: 'kg', vrai: G_M, tol: 0.001, affiche: x => fmt(x, 4),
        bloque: !mesureGuide ? 'Faites d’abord la mesure (étape précédente).' : null,
        expl: 'm = 35,6760 kg de vin en 5 min.' } },
    { id: 'relation', titre: 'Le débit massique', focus: ['manip'],
      texte: <>Un débit massique, noté <strong>Q_m</strong>, est la masse de fluide qui s’écoule par unité de temps.</>,
      tache: { type: 'qcm', q: 'Quelle relation donne Q_m à partir de m et Δt ?', options: ['Q_m = m / Δt', 'Q_m = m × Δt', 'Q_m = Δt / m'], bonne: 0,
        expl: 'Q_m = m / Δt : plus la masse recueillie est grande pour une même durée, plus le débit est grand. Son unité est une masse divisée par une durée : kg·s⁻¹, kg·h⁻¹…' } },
    { id: 'methode', titre: 'Écrire les unités dans le calcul', focus: [],
      texte: <>
        <p style={{ margin: '0 0 8px' }}>Pour ne plus se tromper dans les conversions, on écrit les <strong>unités</strong> dans le calcul, comme des nombres. Elles se multiplient, se divisent et se <strong>simplifient</strong>.</p>
        <p style={{ margin: '0 0 8px' }}>Exemple : 2 h en minutes. On multiplie par une fraction <strong>égale à 1</strong> (60 min = 1 h) placée de façon à faire disparaître l’heure :</p>
        <Chaine facteurs={[{ num: [{ n: 2, u: 'h' }], den: [] }, facteurConv('h', 'min', 'num')]}/>
        <p style={{ margin: '8px 0 0' }}>Le chronomètre indique 05:00, soit <strong>5 min</strong>. Faites de même pour l’exprimer en secondes.</p>
      </>,
      tache: { type: 'num', q: 'Δt en secondes', unite: 's', vrai: G_DT_S, tol: 0.001, affiche: x => fmt(x, 0),
        pieges: [[5 / 60, 'Il y a 60 s dans 1 min : le nombre de secondes est plus grand que le nombre de minutes. On multiplie par 60.'], [5 * 3600, '1 min = 60 s (et non 3 600 s).']],
        expl: <>On écrit 5 min × (60 s / 1 min) : les minutes se simplifient. <Chaine facteurs={[{ num: [{ n: 5, u: 'min' }], den: [] }, facteurConv('min', 's', 'num')]}/></> } },
    { id: 'qmMin', titre: 'Calculer Q_m avec les unités', focus: ['manip'],
      texte: <>
        <p style={{ margin: '0 0 8px' }}>Q_m = m / Δt, avec les unités dans le calcul. On garde pour l’instant la durée en minutes :</p>
        <Ch1 nom="Q_m" facteurs={chGuideQm('kg', 'min')} cacher/>
        <p style={{ margin: '8px 0 0' }}>L’unité du résultat est une masse divisée par une durée : <strong>kg·min⁻¹</strong> (kilogrammes par minute).</p>
      </>,
      tache: { type: 'num', q: 'Q_m en kg·min⁻¹', unite: 'kg·min⁻¹', vrai: G_QM_MIN, tol: 0.01, affiche: x => sig(x),
        pieges: [[G_M * G_DT_MIN, 'Vous avez multiplié : un débit est une masse divisée par une durée.'], [G_DT_MIN / G_M, 'Attention à l’ordre : on divise la masse (35,6760) par la durée (5,00).']],
        expl: 'Q_m = 35,6760 / 5,00 ≈ 7,14 kg·min⁻¹ : chaque minute, 7,14 kg de vin s’écoulent.' } },
    { id: 'qmH', titre: 'Passer en kg·h⁻¹', focus: [],
      texte: <>
        <p style={{ margin: '0 0 8px' }}>On veut maintenant des <strong>heures</strong> : la minute doit disparaître. Elle est au <strong>dénominateur</strong> de Q_m ; on multiplie donc par une fraction égale à 1 qui a <strong>min au numérateur</strong> :</p>
        <Ch1 nom="Q_m" facteurs={chGuideQm('kg', 'h')} cacher/>
        <p style={{ margin: '8px 0 0' }}>Les « min » se simplifient (barrées) : il reste des kg par heure.</p>
      </>,
      tache: { type: 'num', q: 'Q_m en kg·h⁻¹', unite: 'kg·h⁻¹', vrai: G_QM_H, tol: 0.01, affiche: x => sig(x),
        pieges: [[G_QM_MIN / 60, 'Vous avez divisé par 60. Il y a 60 min dans 1 h : par heure, il passe 60 fois plus de vin que par minute. On multiplie.'], [G_QM_MIN * 3600, '1 h = 60 min (et non 3 600 min).']],
        expl: 'Q_m = 35,6760 × 60 / 5,00 ≈ 428 kg·h⁻¹ : cohérent, car 428 est 60 fois plus grand que 7,14.' } },
    { id: 'qmSChoix', titre: 'Passer en kg·s⁻¹ : quel facteur ?', focus: [],
      texte: <>Repartons de Q_m ≈ 7,14 <Un u="kg"/>·<Un u="min" inv/>. On veut des <strong>secondes</strong>. Quelle fraction égale à 1 faut-il multiplier ?</>,
      tache: { type: 'qcm', q: 'Par quelle fraction multiplier pour obtenir des kg·s⁻¹ ?', options: qcmFacteur, bonne: 0,
        expl: 'La minute est au dénominateur de Q_m : pour qu’elle se simplifie, elle doit être au numérateur du facteur. Et 1 min = 60 s, donc (1 min) / (60 s) = 1. Le facteur 3 600 s / 1 h vaut aussi 1, mais il ne fait pas disparaître les minutes.' } },
    { id: 'qmS', titre: 'Calculer Q_m en kg·s⁻¹', focus: [],
      texte: <><Ch1 nom="Q_m" facteurs={chGuideQm('kg', 's')} cacher/></>,
      tache: { type: 'num', q: 'Q_m en kg·s⁻¹', unite: 'kg·s⁻¹', vrai: G_QM_S, tol: 0.01, affiche: x => sig(x),
        pieges: [[G_QM_MIN * 60, 'Vous avez multiplié par 60. Il y a 60 s dans 1 min : par seconde, il passe 60 fois moins de vin que par minute. On divise.'], [G_QM_MIN, 'C’est le résultat en kg·min⁻¹ : il manque la conversion des minutes en secondes.']],
        expl: 'Q_m = 35,6760 / (5,00 × 60) = 35,6760 / 300 ≈ 0,119 kg·s⁻¹.' } },
    { id: 'chiffres', titre: 'Combien de chiffres significatifs ?', focus: [],
      texte: <>Votre calculatrice donne bien plus de chiffres que la mesure n’en justifie. La masse est lue à 0,1 g près (35,6760 kg : 6 chiffres significatifs). Le chronomètre indique 05:00, soit 300 s <strong>à 1 s près</strong>.</>,
      tache: { type: 'qcm', q: 'Avec combien de chiffres significatifs doit-on donner Q_m ?',
        options: ['3 : Δt = 300 s a 3 chiffres significatifs, moins que m', '6 : autant que la masse affichée, 35,6760 kg', '1 : autant que le « 5 » de 5 min'], bonne: 0,
        expl: 'Un quotient ne peut pas être plus précis que la donnée la moins précise. Ici c’est Δt (3 chiffres significatifs, puisque connue à la seconde près) : Q_m = 0,119 kg·s⁻¹. « 5 min » ne vaut pas « 5 » seul : le chronomètre donne 5 min 00 s. Pour une durée inférieure à 100 s (2 chiffres significatifs), on ne garderait que 2 chiffres.' } },
    { id: 'rho', titre: 'Densité et masse volumique', focus: ['manip'],
      texte: <>
        <p style={{ margin: '0 0 8px' }}>On cherche maintenant le <strong>débit volumique</strong>. Il faut pour cela la <strong>masse volumique ρ</strong> du vin. On donne sa <strong>densité</strong> d = 0,991 (affichée sous le choix du fluide). Elle compare le fluide à l’eau : d = ρ / ρ<sub>eau</sub>, donc <strong>ρ = d × ρ<sub>eau</sub></strong>. La densité n’a <strong>pas d’unité</strong>.</p>
        <p style={{ margin: '0 0 8px' }}>On prend ρ<sub>eau</sub> = 1 000 kg·m⁻³ (cette valeur dépend de la température : 998 kg·m⁻³ à 20 °C).</p>
        <AlerteRho/>
      </>,
      tache: { type: 'num', q: 'Masse volumique ρ du vin', unite: 'kg·m⁻³', vrai: G_RHO, tol: 0.001, affiche: x => fmt(x, 0),
        pieges: [[0.991, 'La densité n’a pas d’unité : ρ est la densité multipliée par la masse volumique de l’eau (1 000 kg·m⁻³).']],
        expl: <>Chaque mètre cube de vin pèse 991 kg. <RhoLigne d={0.991}/></> } },
    { id: 'relRho', titre: 'Lier Q_m, ρ et Q_v', focus: [],
      texte: <>Le <strong>débit volumique Q_v</strong> est le volume de fluide qui s’écoule par unité de temps (en m³·s⁻¹, L·s⁻¹, m³·h⁻¹…). Pour trouver la relation avec Q_m, <strong>regardez les unités</strong> : Q_m en kg·s⁻¹, Q_v en m³·s⁻¹, ρ en kg·m⁻³.</>,
      tache: { type: 'qcm', q: 'Quelle relation est cohérente avec ces unités ?', options: ['Q_m = ρ × Q_v', 'Q_m = Q_v / ρ', 'Q_v = ρ × Q_m'], bonne: 0,
        expl: 'kg·m⁻³ × m³·s⁻¹ = kg·s⁻¹ : les m³ se simplifient et il reste bien des kg·s⁻¹. Les deux autres relations donnent des unités qui ne correspondent pas à celles du premier membre.' } },
    { id: 'qvH', titre: 'Calculer Q_v en m³·h⁻¹', focus: [],
      texte: <>
        <p style={{ margin: '0 0 8px' }}>Q_v = Q_m / ρ. Partons de Q_m ≈ 428 kg·h⁻¹ et divisons par ρ = 991 kg·m⁻³ (en SI). Regardez les unités : le kg de Q_m se simplifie avec le kg de ρ, et il reste des m³ par heure.</p>
        <Ch1 nom="Q_v" facteurs={chaineQv(428, 'kg', 'h', 'm³', 'h', G_RHO, '428')} cacher/>
      </>,
      tache: { type: 'num', q: 'Q_v en m³·h⁻¹', unite: 'm³·h⁻¹', vrai: G_QV_H, tol: 0.01, affiche: x => sig(x),
        pieges: [[G_QM_H * G_RHO, 'Vous avez multiplié par ρ. Les kg ne se simplifieraient pas : on divise par ρ.']],
        expl: 'Q_v = 428 / 991 ≈ 0,432 m³·h⁻¹. Garder un chiffre de plus dans les calculs intermédiaires évite les erreurs d’arrondi : on arrondit seulement le résultat final.' } },
    { id: 'qvL', titre: 'Q_v en litres par seconde', focus: [],
      texte: <>On exprime maintenant Q_v en <strong>L·s⁻¹</strong>, à partir de Q_v ≈ 0,432 m³·h⁻¹. Écrivez vous-même les <strong>deux conversions</strong> (m³ → L et h → s) en vérifiant que les unités se simplifient.</>,
      tache: { type: 'num', q: 'Q_v en L·s⁻¹', unite: 'L·s⁻¹', vrai: G_QV_LS, tol: 0.01, affiche: x => sig(x),
        aide: '1 m³ = 1 000 L ; 1 h = 3 600 s. Le m³ est au numérateur, l’heure au dénominateur.',
        pieges: [[G_QV_H * 1000, 'Il manque la conversion des heures en secondes (1 h = 3 600 s).'], [G_QV_H / 3600, 'Il manque la conversion des m³ en litres (1 m³ = 1 000 L).'], [G_QV_H * 3600 * 1000, 'Pour passer de h⁻¹ à s⁻¹, on divise par 3 600 (une heure contient 3 600 s).']],
        expl: <>Le m³ est au numérateur : on multiplie par (1 000 L / 1 m³). L’heure est au dénominateur : on multiplie par (1 h / 3 600 s).
          <Ch1 nom="Q_v" facteurs={[{ num: [{ n: 0.432, s: '0,432', u: 'm³' }], den: [{ u: 'h' }] }, facteurConv('m³', 'L', 'num'), facteurConv('h', 's', 'den')]}/></> } },
    { id: 'voie', titre: 'Une autre voie : mesurer le volume', focus: ['manip'],
      texte: <>On peut aussi calculer le <strong>volume V</strong> de vin recueilli : V = m / ρ. La cuve est graduée en litres. Calculez V en <strong>litres</strong> à partir de m = 35,6760 kg et ρ = 991 kg·m⁻³.</>,
      tache: { type: 'num', q: 'Volume V de vin', unite: 'L', vrai: G_V_L, tol: 0.01, affiche: x => sig(x),
        aide: 'Divisez par ρ (kg·m⁻³) pour obtenir des m³, puis convertissez en L.',
        pieges: [[G_M / G_RHO, 'C’est un résultat en m³. Pour l’avoir en litres, multipliez par 1 000.']],
        expl: <>La graduation de la cuve indique bien environ 36 L. Et V / Δt = 36,0 L / 300 s = 0,120 L·s⁻¹ : on retrouve Q_v.
          <Ch1 nom="V" facteurs={[{ num: [{ n: G_M, s: '35,6760', u: 'kg' }], den: [] }, facteurRho(G_RHO), facteurConv('m³', 'L', 'num')]}/></> } },
    { id: 'duree2', titre: 'Et si on change la durée ?', focus: ['manip'],
      texte: <>Refaisons la mesure avec le même robinet, mais seulement pendant <strong>2 min</strong>. Le débit change-t-il ?</>,
      tache: { type: 'action', ok: mesure2, label: 'Régler 2 min (vin, même robinet)', faire: () => { setFluide('vin'); setOuv(G_OUV); setDuree(120); vider(); setTareOff(M_CUVE); },
        attente: run.ouvert ? 'Le vin coule…' : null,
        consigne: mesure2 ? null : (duree === 120 && !run.ouvert ? 'Ouvrez le robinet pour faire la mesure' : 'Puis ouvrez le robinet') } },
    { id: 'constant', titre: 'Un débit constant', focus: ['manip'],
      texte: <>Lisez la nouvelle masse sur la balance et calculez Q_m en kg·s⁻¹ avec <strong>3 chiffres significatifs</strong>.</>,
      tache: { type: 'num', q: 'Q_m en kg·s⁻¹', unite: 'kg·s⁻¹', vrai: G_QM_S, tol: 0.003, affiche: x => sig(x),
        bloque: !mesure2 ? 'Faites d’abord la mesure de 2 min (étape précédente).' : null,
        expl: 'Q_m = 14,2704 / 120 ≈ 0,119 kg·s⁻¹ : la même valeur qu’avec 5 min. Le débit est constant : la masse recueillie est proportionnelle à la durée. Au-delà de 3 chiffres, les arrondis de la balance (0,1 g) et du chronomètre (1 s) rendent les résultats peu fiables.' } },
    { id: 'huile', titre: 'Et avec un autre fluide ?', focus: ['manip'],
      texte: <>Le robinet reste réglé pareil. On remplace le vin par de l’<strong>huile d’olive</strong> (d = 0,92) et on refait la mesure de 5 min. Comparez avec le vin.</>,
      tache: { type: 'action', ok: huileFaite, label: 'Mettre de l’huile d’olive', faire: () => { setFluide('huile'); setOuv(G_OUV); setDuree(G_DT_S); vider(); setTareOff(M_CUVE); },
        attente: run.ouvert ? 'L’huile coule…' : null,
        consigne: huileFaite ? null : (fluide === 'huile' && !run.ouvert ? 'Ouvrez le robinet pour refaire la mesure' : 'Puis ouvrez le robinet (même ouverture, même durée)') } },
    { id: 'compare', titre: 'Ce qui change, ce qui ne change pas', focus: ['manip'],
      texte: <>Avec l’huile, la cuve se remplit au même niveau qu’avec le vin (même graduation), mais la balance n’affiche pas la même masse.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de Q_v et de Q_m ?', options: ['Q_v est inchangé ; Q_m est plus petit (l’huile est moins dense)', 'Q_m est inchangé ; Q_v est plus grand (l’huile est moins dense)', 'Q_v et Q_m sont tous les deux plus petits que pour le vin'], bonne: 0,
        expl: 'Même volume en 5 min : Q_v est inchangé. Mais chaque litre d’huile (920 kg·m⁻³) pèse moins qu’un litre de vin (991 kg·m⁻³) : Q_m = ρ·Q_v diminue. Ici environ 33,1 kg au lieu de 35,7 kg.' } },
    { id: 'hypotheses', titre: 'Sur quoi repose cette mesure ?', focus: ['hypo'],
      texte: <>Lisez l’encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Pour que m/Δt représente « le » débit, que suppose-t-on pendant la mesure ?', options: ['Que le débit reste constant (régime permanent)', 'Que le débit augmente régulièrement avec le temps', 'Que la masse volumique varie pendant la mesure'], bonne: 0,
        expl: 'Si le débit variait, m/Δt ne donnerait qu’une valeur moyenne. En régime permanent, le débit est le même à chaque instant et le résultat ne dépend pas de la durée choisie.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez mesurer un débit massique (Q_m = m/Δt), en déduire le débit volumique (Q_m = ρ·Q_v) et, surtout, <strong>écrire les unités dans le calcul</strong> pour convertir sans erreur, en gardant le bon nombre de chiffres significatifs. En exploration libre, changez les unités de sortie et regardez comment les unités se simplifient.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    const fl = tire(Object.keys(FLUIDES)), uT = tire(['s', 'min']), uM = tire(['kg', 'g']);
    const dt = uT === 's' ? tire([120, 150, 180, 240, 360]) : tire([2, 3, 4, 5, 8, 10]);
    const qL = tire([0.04, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2]);
    const mKg = qL * (uT === 's' ? dt : dt * 60) * FLUIDES[fl].d;
    const m = uM === 'kg' ? Math.round(mKg * 100) / 100 : Math.round(mKg * 1000);
    setDefi({ fl, uT, uM, dt, m, c1: tire(['kg/h', 't/h', 'kg/min']), c2: tire(['kg/s', 'g/s']), c3: tire(['m³/h', 'L/min']), c4: tire(['L/s', 'm³/s']),
      reps: {}, verifie: false, corr: false });
  }
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !defi) nouveauDefi();
    if (m === 'guide') { setFluide('eau'); setOuv(5); setDuree(0); setVitesse(10); vider(); setTareOff(0); }
  }
  const voletDefi = defi && (() => {
    const d0 = FLUIDES[defi.fl].d, r0 = rhoDe(d0);
    const sep = s => s.split('/');
    const [m1, t1] = sep(defi.c1), [m2, t2] = sep(defi.c2), [v3, t3] = sep(defi.c3), [v4, t4] = sep(defi.c4);
    const mTxt = defi.uM === 'kg' ? defi.m.toFixed(2).replace('.', ',') : nf(defi.m), dtTxtD = defi.uT === 's' ? String(defi.dt) : sig(defi.dt, 3);
    const ch1 = chaineQm(defi.m, defi.uM, defi.dt, defi.uT, m1, t1, mTxt, dtTxtD);
    const ch2 = chaineQm(defi.m, defi.uM, defi.dt, defi.uT, m2, t2, mTxt, dtTxtD);
    const v1 = analyser(ch1).valeur, v2 = analyser(ch2).valeur;
    const a1 = Number(v1.toPrecision(3)), a2 = Number(v2.toPrecision(3));
    const ch3 = chaineQv(a1, m1, t1, v3, t3, r0, sig(a1)), ch4 = chaineQv(a2, m2, t2, v4, t4, r0, sig(a2));
    const vrai3 = analyser(chaineQv(v1, m1, t1, v3, t3, r0)).valeur, vrai4 = analyser(chaineQv(v2, m2, t2, v4, t4, r0)).valeur;
    const Q = [
      { id: 'q1', q: <>Débit massique Q<sub>m</sub> en <strong>{uniteSimple(defi.c1)}</strong></>, unite: uniteSimple(defi.c1), vrai: v1, tol: 0.01, ch: ch1, nom: 'Q_m' },
      { id: 'q2', q: <>Débit massique Q<sub>m</sub> en <strong>{uniteSimple(defi.c2)}</strong></>, unite: uniteSimple(defi.c2), vrai: v2, tol: 0.01, ch: ch2, nom: 'Q_m' },
      { id: 'q3', q: <>Masse volumique ρ du fluide (en SI)</>, unite: 'kg·m⁻³', vrai: r0, tol: 0.002, ch: null },
      { id: 'q4', q: <>Débit volumique Q<sub>v</sub> en <strong>{uniteSimple(defi.c3)}</strong> (déduit de Q<sub>m</sub> en {uniteSimple(defi.c1)})</>, unite: uniteSimple(defi.c3), vrai: vrai3, tol: 0.015, ch: ch3, nom: 'Q_v' },
      { id: 'q5', q: <>Débit volumique Q<sub>v</sub> en <strong>{uniteSimple(defi.c4)}</strong> (déduit de Q<sub>m</sub> en {uniteSimple(defi.c2)})</>, unite: uniteSimple(defi.c4), vrai: vrai4, tol: 0.015, ch: ch4, nom: 'Q_v' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
          Une canalisation permet de remplir une cuve. On ouvre le robinet pendant <strong>{dtTxtD} {defi.uT}</strong> et on pèse le fluide recueilli : <strong>{mTxt} {defi.uM}</strong>.
          Le fluide est <strong>{FLUIDES[defi.fl].nom.toLowerCase()}</strong>, de densité <strong>d = {String(d0).replace('.', ',')}</strong>.
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Rappels : Q<sub>m</sub> = m / Δt ; Q<sub>m</sub> = ρ·Q<sub>v</sub> ; ρ = d × ρ<sub>eau</sub> avec ρ<sub>eau</sub> = 1 000 kg·m⁻³. Écrivez les unités dans vos calculs et donnez chaque résultat avec <strong>3 chiffres significatifs</strong>.</div>
        </div>
        <AlerteRho/>
        {Q.map((qu, k) => {
          const rep = defi.reps[qu.id] || '', ok = proche(lireNombre(rep), qu.vrai, qu.tol);
          return (
            <div key={qu.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. <span>{indicesProfond(qu.q)}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const val = x.target.value; setDefi(df => ({ ...df, verifie: false, corr: false, reps: { ...df.reps, [qu.id]: val } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 120 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{qu.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {sig(qu.vrai)} {qu.unite}</div>}
              {defi.corr && qu.ch && <div style={{ marginTop: 6 }}><Ch1 nom={qu.nom} facteurs={qu.ch}/></div>}
              {defi.corr && !qu.ch && <div style={{ marginTop: 6 }}><RhoLigne d={d0}/></div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setDefi(df => ({ ...df, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          {defi.verifie && <button onClick={() => setDefi(df => ({ ...df, corr: !df.corr }))} style={styleBouton(defi.corr, '#7e22ce')}>{defi.corr ? 'Masquer' : 'Voir'} les calculs avec les unités</button>}
          <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouveau défi</button>
        </div>
      </div>
    );
  })();

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Régime permanent</strong> : le débit est constant pendant toute la mesure. Alors m/Δt est le débit à chaque instant, quelle que soit la durée.</li>
      <li><strong>Fluide incompressible</strong>, de masse volumique ρ uniforme, toujours exprimée en kg·m⁻³. On a ρ = d × ρ<sub>eau</sub> avec ρ<sub>eau</sub> = 1 000 kg·m⁻³ : cette valeur dépend de la température (998 kg·m⁻³ à 20 °C), et les densités des autres fluides sont des valeurs arrondies.</li>
      <li><strong>Robinet</strong> : le débit volumique ne dépend que de l’ouverture, pas du fluide (même charge, fluides peu visqueux). C’est pourquoi, à ouverture identique, Q<sub>v</sub> ne change pas quand on change de fluide, alors que Q<sub>m</sub> change.</li>
      <li><strong>Mesures et chiffres significatifs</strong> : le chronomètre démarre et s’arrête exactement à l’ouverture et à la fermeture du robinet, et indique la seconde près. La balance est juste, tarée cuve vide, et indique le dixième de gramme près (0,0001 kg). La cuve est graduée en litres, lecture à 1 L près. Un quotient n’est pas plus précis que sa donnée la moins précise : le chronomètre en donne 2 chiffres significatifs sous 100 s, 3 de 100 à 999 s, et la balance bien davantage. Q<sub>m</sub> a donc 2 chiffres significatifs sous 100 s, 3 au-delà, et sa valeur ne dépend pas de la durée choisie.</li>
      <li><strong>Pas de perte</strong> : tout le fluide qui sort du tuyau arrive dans la cuve (pas d’éclaboussure, pas d’évaporation).</li>
    </ul>
  );
  const panneauHypo = (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>
  );
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );

  // ── Schéma : tuyau, robinet, cuve sur la balance, chronomètre ──
  const hautCuve = 150, basCuve = 270, pxL = (basCuve - hautCuve) / CAP_L;
  const yNiv = basCuve - run.V * pxL;
  const coulF = FLUIDES[fluide].coul;
  const angleRobinet = run.ouvert ? ouv * 9 : 0;
  const schema = (
    <svg viewBox="0 0 620 345" style={{ width: '100%', maxWidth: 620, display: 'block' }} role="img" aria-label="Tuyau, robinet, cuve sur une balance et chronomètre">
      <style>{`@keyframes dbCoule { to { stroke-dashoffset: -32; } } .db-flux { animation: dbCoule 0.45s linear infinite; }`}</style>
      {/* tuyau et robinet */}
      <path d="M10,53 H212 V112" fill="none" stroke="#475569" strokeWidth="26" strokeLinejoin="round"/>
      <path d="M10,53 H212 V112" fill="none" stroke="#cbd5e1" strokeWidth="21" strokeLinejoin="round"/>
      <rect x="96" y="32" width="30" height="42" rx="4" fill="#64748b" stroke="#334155" strokeWidth="1.5"/>
      <g transform={`rotate(${angleRobinet} 111 32)`}>
        <line x1="111" y1="32" x2="111" y2="6" stroke="#b45309" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="111" cy="6" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5"/>
      </g>
      <text x="14" y="30" fontSize="11" fill="#475569">tuyau</text>
      <text x="136" y="30" fontSize="11" fill="#475569">robinet</text>
      {/* filet de fluide */}
      {run.ouvert && <line className="db-flux" x1="212" y1="112" x2="212" y2={Math.max(yNiv, 118)} stroke={coulF} strokeWidth={3 + ouv * 0.5} strokeDasharray="14 6" strokeLinecap="round"/>}
      {/* cuve */}
      <rect x="150" y={yNiv} width="124" height={basCuve - yNiv} fill={coulF} fillOpacity="0.55"/>
      {run.V > 0 && <line x1="150" y1={yNiv} x2="274" y2={yNiv} stroke={coulF === '#f1f5f9' ? '#94a3b8' : coulF} strokeWidth="1.5"/>}
      <path d={`M150,${hautCuve - 6} V${basCuve} H274 V${hautCuve - 6}`} fill="none" stroke="#475569" strokeWidth="3"/>
      {Array.from({ length: 16 }, (_, i) => i * 10).map(L => (
        <g key={L}>
          <line x1="274" y1={basCuve - L * pxL} x2={L % 50 === 0 ? 262 : 268} y2={basCuve - L * pxL} stroke="#475569" strokeWidth="1"/>
          {L % 50 === 0 && L > 0 && <text x="279" y={basCuve - L * pxL + 3.5} fontSize="10.5" fill="#334155">{L}</text>}
        </g>
      ))}
      <text x="296" y={hautCuve - 12} fontSize="10.5" fill="#334155" textAnchor="middle">V (L)</text>
      <text x="150" y={hautCuve - 12} fontSize="11" fill="#475569">cuve</text>
      {/* balance */}
      <rect x="140" y={basCuve} width="144" height="8" fill="#475569"/>
      <rect x="130" y={basCuve + 8} width="164" height="42" rx="6" fill="#1e293b"/>
      <rect x="148" y={basCuve + 14} width="128" height="24" rx="3" fill="#bbf7d0"/>
      <text x="270" y={basCuve + 32} textAnchor="end" fontSize="17" fontFamily="monospace" fontWeight="700" fill="#064e3b">{dec4(mAff)} kg</text>
      <text x="212" y={basCuve + 64} textAnchor="middle" fontSize="11" fill="#475569">balance</text>
      {/* chronomètre */}
      <rect x="378" y="112" width="220" height="92" rx="12" fill="#1e293b"/>
      <rect x="390" y="124" width="196" height="46" rx="4" fill="#bbf7d0"/>
      <text x="578" y="158" textAnchor="end" fontSize="31" fontFamily="monospace" fontWeight="700" fill="#064e3b">{mmss(run.t)}</text>
      <text x="488" y="190" textAnchor="middle" fontSize="11" fill="#cbd5e1">chronomètre (min:s)</text>
      {run.plein && <text x="212" y="140" textAnchor="middle" fontSize="12" fontWeight="700" fill="#b91c1c">cuve pleine</text>}
    </svg>
  );

  const TXT = KIT.txt, TXT2 = '#475569';
  const lab = { fontSize: 12, color: TXT2, fontWeight: 600 };
  const sel = { fontSize: 13, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, background: 'white', color: TXT };
  const qvReel = qv, qmReel = qv * rho / 1000;

  // ── Boîtes de calcul (exploration libre) ──
  const sfT = sfTemps(run.t), sfM = sfMasse(mAff), nsf = Math.min(sfT, sfM);
  const [cm, ct] = uQm.split('/');
  const chQm = mesureFaite ? chaineQm(mAff, 'kg', dtVal, dtUn, cm, ct, dec4(mAff), dtTxt) : null;
  const qmVal = chQm ? analyser(chQm).valeur : null;
  const [cv, cvt] = uQv.split('/');
  const qm3 = qmVal != null ? Number(qmVal.toPrecision(nsf)) : null;
  const chQv = chQm ? chaineQv(qm3, cm, ct, cv, cvt, rho, sig(qm3, nsf)) : null;
  const vLu = Math.round(run.V);
  const boiteQm = (
    <div style={{ ...styleBoite, ...cadre('calcQm') }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 6 }}>Débit massique : Q<sub>m</sub> = m / Δt</div>
      {!mesureFaite ? <div style={{ fontSize: 13.5, color: TXT2 }}>Faites une mesure : ouvrez le robinet, laissez couler, puis fermez-le (ou programmez une durée).</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 14, color: TXT }}>m = <strong>{dec4(mAff)} kg</strong> (balance) ; Δt = <strong>{dtTxt} {dtUn}</strong> (chronomètre, à 1 s près)</div>
          {tareOff === 0 && <div style={{ fontSize: 13, color: '#b45309' }}>⚠ La balance n’est pas tarée : m comprend aussi la masse de la cuve vide.</div>}
          {tareOff !== 0 && !tareFaite && <div style={{ fontSize: 13, color: '#b45309' }}>⚠ La balance n’a pas été tarée cuve vide : m n’est pas la masse de fluide recueillie depuis le début du chronomètre.</div>}
          {run.mixte && <div style={{ fontSize: 13, color: '#b45309' }}>⚠ L’ouverture a changé pendant la mesure : le débit n’était pas constant, Q<sub>m</sub> = m / Δt est un débit moyen. Videz la cuve pour refaire une mesure propre.</div>}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={lab}>Exprimer Q<sub>m</sub> en</span>
            <select value={uQm} onChange={e => setUQm(e.target.value)} style={sel} aria-label="Unité du débit massique">
              {QM_UNITES.map(u => <option key={u} value={u}>{uniteSimple(u)}</option>)}
            </select>
          </label>
          <Ch1 nom="Q_m" facteurs={chQm} nsf={nsf}/>
          <div style={{ fontSize: 12.5, color: TXT2 }}>Résultat à {nsf} chiffres significatifs : Δt = {run.t} s en a {sfT}, et m en a {sfM}.</div>
        </div>)}
    </div>
  );
  const boiteQv = (
    <div style={{ ...styleBoite, ...cadre('calcQv') }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 6 }}>Débit volumique : Q<sub>v</sub> = Q<sub>m</sub> / ρ</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AlerteRho/>
        <div style={{ fontSize: 13.5, color: TXT }}>Densité d = <strong>{String(d).replace('.', ',')}</strong> (sans unité) :</div>
        <RhoLigne d={d}/>
        {!mesureFaite ? <div style={{ fontSize: 13.5, color: TXT2 }}>Il faut d’abord une mesure de Q<sub>m</sub>.</div> : (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={lab}>Exprimer Q<sub>v</sub> en</span>
              <select value={uQv} onChange={e => setUQv(e.target.value)} style={sel} aria-label="Unité du débit volumique">
                {QV_UNITES.map(u => <option key={u} value={u}>{uniteSimple(u)}</option>)}
              </select>
            </label>
            <Ch1 nom="Q_v" facteurs={chQv} nsf={nsf}/>
            <div style={{ fontSize: 13, color: TXT2 }}>Vérification par la graduation : V ≈ {vLu} <Un u="L"/> en {run.t} <Un u="s"/>, donc V / Δt ≈ <strong>{sig(vLu / run.t, Math.min(String(vLu).length, sfT))}</strong> <Un u="L"/>·<Un u="s" inv/> (lecture à 1 L près).</div>
          </>)}
      </div>
    </div>
  );

  const exploration = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...styleBoite, ...cadre('manip') }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 8 }}>Manip : remplir une cuve posée sur une balance</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 340px', maxWidth: 620 }}>{schema}</div>
          <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {run.ouvert
                ? <button onClick={fermer} style={stylePetitBouton(true, '#dc2626')}>⏸ Fermer le robinet</button>
                : <button onClick={ouvrir} disabled={!peutOuvrir} style={{ ...stylePetitBouton(true, '#16a34a'), opacity: peutOuvrir ? 1 : 0.45 }}>▶ Ouvrir le robinet</button>}
              <button onClick={tarer} style={stylePetitBouton(false, '#334155')}>⚖ Tarer</button>
              <button onClick={vider} style={stylePetitBouton(false, '#64748b')}>↺ Vider la cuve, chrono à zéro</button>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={lab}>Fluide</span>
                <select value={fluide} onChange={e => { setFluide(e.target.value); vider(); }} style={sel} aria-label="Fluide">
                  {Object.entries(FLUIDES).map(([k, f]) => <option key={k} value={k}>{f.nom}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={lab}>Durée programmée</span>
                <select value={duree} onChange={e => setDuree(parseInt(e.target.value, 10))} style={sel} aria-label="Durée programmée">
                  <option value={0}>arrêt à la main</option><option value={30}>30 s</option><option value={60}>1 min</option>
                  <option value={120}>2 min</option><option value={300}>5 min</option><option value={600}>10 min</option>
                </select>
              </label>
            </div>
            <div style={{ fontSize: 13.5, color: TXT }}>Densité du fluide : <strong>d = {String(d).replace('.', ',')}</strong> <span style={{ color: TXT2 }}>(sans unité)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={lab}>Ouverture du robinet : <strong style={{ color: '#b45309' }}>{ouv}</strong> / 10</span>
              <input type="range" min="1" max="10" step="1" value={ouv} onChange={e => setOuv(parseInt(e.target.value, 10))}
                aria-label="Ouverture du robinet" style={{ accentColor: '#f59e0b', width: '100%' }}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={lab}>Vitesse du temps :</span>
              {[1, 10, 60].map(v => <button key={v} onClick={() => setVitesse(v)} style={stylePetitBouton(vitesse === v, '#0369a1')}>×{v}</button>)}
            </div>
            {!enGuide && (
              <div style={{ fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: TXT2, cursor: 'pointer' }}>
                  <input type="checkbox" checked={reveleQ} onChange={e => setReveleQ(e.target.checked)}/> Révéler le débit réellement réglé
                </label>
                {reveleQ && <div style={{ marginTop: 4, color: TXT, lineHeight: 1.6 }}>
                  Q<sub>v</sub> réel = <strong>{sig(qvReel)}</strong> <Un u="L"/>·<Un u="s" inv/> ; Q<sub>m</sub> réel = <strong>{sig(qmReel)}</strong> <Un u="kg"/>·<Un u="s" inv/>
                  <div style={{ fontSize: 12, color: TXT2 }}>Votre mesure doit s’en approcher, avec le bon nombre de chiffres significatifs, quelle que soit la durée.</div>
                </div>}
              </div>)}
          </div>
        </div>
      </div>
      {!enGuide && <>{boiteQm}{boiteQv}</>}
    </div>
  );

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .db-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .db-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .db-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 960px) { .db-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Débits massique et volumique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`db-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : exploration}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && (
        <div className="db-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Mesurez Q<sub>m</sub> pour deux durées différentes, à la même ouverture : que remarquez-vous, avec le bon nombre de chiffres significatifs ? Et si vous gardez tous les chiffres de la calculatrice ?</li>
              <li>Doublez l’ouverture du robinet : que deviennent Q<sub>m</sub> et Q<sub>v</sub> ?</li>
              <li>Changez de fluide, sans toucher au robinet : lequel des deux débits change ? Pourquoi ?</li>
              <li>Changez l’unité de sortie et regardez quelles unités se simplifient (barrées) dans le calcul.</li>
              <li>Comparez votre mesure au débit réellement réglé (« Révéler ») : d’où vient l’écart ?</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
      )}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
