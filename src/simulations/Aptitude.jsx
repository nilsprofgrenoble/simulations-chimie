import { useState, useEffect, useMemo } from "react";
import { cardStyle, fmt, lireNombre, proche, CarteParcours, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, Curseur, ORANGE_GUIDE, avecIndices } from "../commun";

// ====================================================
// ESSAIS D'APTITUDE ET Z-SCORE (BTS Métiers de la chimie)
// On part de la formule du référentiel et des « Repères pour la formation » : z = (xᵢ − x̄) / s.
// On peut ensuite changer de formule (labo évalué exclu, statistiques robustes, norme ISO 13528 avec x_pt et σ_pt)
// et voir aussitôt les conséquences. Les hypothèses (loi normale, etc.) sont explicites, et vérifiées quand c'est possible
// (droite de Henry, borne mathématique du z-score, effet d'un laboratoire sur l'écart-type).
// ====================================================

function rng(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// ── Statistiques ──
const moyenne = v => v.reduce((a, b) => a + b, 0) / v.length;
const ecartType = v => { if (v.length < 2) return NaN; const m = moyenne(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)); };
const ecartTypePop = v => { const m = moyenne(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length); };
const mediane = v => { const s = [...v].sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const ecartRobuste = v => { const m = mediane(v); return 1.483 * mediane(v.map(x => Math.abs(x - m))); };   // s* = 1,483 × MAD
// Quantile de la loi normale centrée réduite (approximation d'Acklam)
function quantileNormal(p) {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const q = p < 0.5 ? Math.sqrt(-2 * Math.log(p)) : Math.sqrt(-2 * Math.log(1 - p));
  if (p < 0.02425 || p > 1 - 0.02425) {
    const x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    return p < 0.5 ? x : -x;
  }
  const r = p - 0.5, r2 = r * r;
  return (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) * r / (((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1);
}
// Droite de Henry : coefficient de corrélation entre les résultats rangés et les quantiles de la loi normale (positions de Blom).
// Seuil à 5 % ajusté par simulation : r_crit(n) ≈ 1 − 0,36 / n^0,66.
function henry(v) {
  const s = [...v].sort((a, b) => a - b), n = s.length;
  const q = s.map((_, i) => quantileNormal((i + 1 - 0.375) / (n + 0.25)));
  const mq = moyenne(q), ms = moyenne(s);
  const r = q.reduce((t, a, i) => t + (a - mq) * (s[i] - ms), 0) / Math.sqrt(q.reduce((t, a) => t + (a - mq) ** 2, 0) * s.reduce((t, b) => t + (b - ms) ** 2, 0));
  return { s, q, r, rCrit: 1 - 0.36 / Math.pow(n, 0.66) };
}

// ── Les formules du z-score ──
export const FORMULES = {
  ref: { nom: 'Référentiel BTS', court: 'référentiel', formule: <>z = (x<sub>i</sub> − x̄) / s</>, detail: 'x̄ et s : moyenne et écart-type expérimental de tous les laboratoires, le laboratoire évalué compris.' },
  exclu: { nom: 'Labo évalué exclu', court: 'labo exclu', formule: <>z = (x<sub>i</sub> − x̄<sub>(sans i)</sub>) / s<sub>(sans i)</sub></>, detail: 'x̄ et s sont calculés sans le laboratoire évalué : il ne peut plus influencer sa propre référence. Variante pédagogique.' },
  robuste: { nom: 'Statistiques robustes', court: 'robuste', formule: <>z = (x<sub>i</sub> − médiane) / s*</>, detail: 's* = 1,483 × MAD (médiane des écarts absolus à la médiane) : peu sensible aux valeurs aberrantes.' },
  iso: { nom: 'Norme ISO 13528', court: 'ISO 13528', formule: <>z = (x<sub>i</sub> − x<sub>pt</sub>) / σ<sub>pt</sub></>, detail: 'x_pt : valeur assignée (matériau de référence ou consensus) ; σ_pt : écart-type pour l’évaluation de l’aptitude, fixé par l’organisateur.' },
};
export function zScores(v, formule, { xpt, sigmaPt }) {
  if (formule === 'ref') { const m = moyenne(v), s = ecartType(v); return { z: v.map(x => (x - m) / s), centre: m, disp: s }; }
  if (formule === 'exclu') return { z: v.map((x, i) => { const o = v.filter((_, j) => j !== i); return (x - moyenne(o)) / ecartType(o); }), centre: moyenne(v), disp: ecartType(v) };
  if (formule === 'robuste') { const m = mediane(v), s = ecartRobuste(v); return { z: v.map(x => (x - m) / s), centre: m, disp: s }; }
  return { z: v.map(x => (x - xpt) / sigmaPt), centre: xpt, disp: sigmaPt };
}
export function categorie(z) {
  const a = Math.abs(z);
  if (!isFinite(z)) return { cle: '?', label: '—', color: KIT.txt2, bg: '#f1f5f9' };
  if (a <= 2) return { cle: 'sat', label: 'satisfaisant', color: '#15803d', bg: '#dcfce7' };
  if (a < 3) return { cle: 'disc', label: 'discutable', color: '#b45309', bg: '#fef3c7' };
  return { cle: 'nonsat', label: 'non satisfaisant', color: '#b91c1c', bg: '#fee2e2' };
}

// ── Les jeux de données ──
// Campagne du parcours : 10 laboratoires dosent les ions nitrate d'une eau ; un matériau de référence certifié donne x_pt = 24,0 mg/L
const PARCOURS = { v: [24.3, 23.8, 24.6, 25.1, 23.6, 24.0, 24.4, 23.9, 24.2, 30.5], unite: 'mg/L', xpt: 24.0, sigmaPt: 1.2, dec: 1,
  nom: 'Dosage des ions nitrate d’une eau (10 laboratoires)' };
// Exemple des « Repères pour la formation » (BTS) : teneur en soufre de feuilles de frêne, 14 laboratoires, moyenne de 4 essais chacun
const REPERES = { v: [1.345, 2.1025, 2.1325, 2.2125, 2.2175, 2.365, 2.4275, 2.4725, 2.55, 2.555, 2.8075, 2.81, 2.815, 2.8275], unite: 'u.a.', dec: 3,
  nom: 'Exemple des Repères : soufre de feuilles de frêne (14 laboratoires)' };
function tirerCampagne(graine, { p = 15, s = 0.8, biais = true, deux = false }) {
  const r = rng(graine), v = [];
  for (let k = 0; k < p; k++) v.push(Math.round((24 + (deux && k % 3 === 0 ? 3.2 : 0) + s * gauss(r)) * 10) / 10);
  if (biais && p >= 6) { const i = Math.floor(r() * p); v[i] = Math.round((24 + (r() < 0.5 ? -1 : 1) * (4 + 1.5 * r())) * 10) / 10; }
  return v;
}
const SUIVI = [0.2, 0.6, 0.9, 1.3, 1.6, 1.9];

// ── Les alertes : ce que l'on peut vérifier sur les données et la formule choisie ──
function alertes(v, formule, opts) {
  const A = [], p = v.length;
  if (p < 3) return A;
  if (formule === 'ref') {
    const zMax = (p - 1) / Math.sqrt(p);
    if (zMax < 3) A.push({ niveau: 'fort', t: <>Avec p = {p} laboratoires et cette formule, |z| ne peut jamais dépasser (p − 1) / √p = {fmt(zMax, 2)} : <strong>aucun laboratoire ne peut être « non satisfaisant »</strong>{zMax < 2 ? ', ni même « discutable »' : ''}, quels que soient les résultats.</> });
  }
  if (formule === 'ref' || formule === 'robuste') {
    const med = mediane(v); let iLoin = 0; v.forEach((x, i) => { if (Math.abs(x - med) > Math.abs(v[iLoin] - med)) iLoin = i; });
    const sTous = ecartType(v), sSans = ecartType(v.filter((_, i) => i !== iLoin));
    if (formule === 'ref' && sTous > 1.5 * sSans) A.push({ niveau: 'fort', t: <>Le laboratoire {iLoin + 1} gonfle à lui seul l'écart-type : s = {fmt(sTous, 3)} avec lui, {fmt(sSans, 3)} sans lui. Il « dilue » ainsi son propre z-score.</> });
  }
  const h = henry(v);
  if (h.r < h.rCrit) A.push({ niveau: 'moyen', t: <>Les résultats ne s'alignent pas bien sur la droite de Henry (r = {fmt(h.r, 3)}, seuil {fmt(h.rCrit, 3)}) : <strong>l'hypothèse d'une loi normale est douteuse</strong> (valeur aberrante, ou plusieurs groupes de résultats). Les seuils 2 et 3 perdent alors leur justification.</> });
  else A.push({ niveau: 'info', t: <>Droite de Henry : r = {fmt(h.r, 3)} ≥ seuil {fmt(h.rCrit, 3)}. L'alignement est compatible avec une loi normale ; cela ne <em>prouve</em> pas qu'elle est vérifiée, surtout avec peu de laboratoires.</> });
  if (formule === 'robuste' && p < 12) A.push({ niveau: 'moyen', t: <>Avec moins d'une douzaine de laboratoires, les estimations robustes (médiane, s*) sont elles-mêmes peu fiables.</> });
  if (formule === 'iso' && opts.consensus) {
    const u = 1.25 * ecartRobuste(v) / Math.sqrt(p);
    if (u > 0.3 * opts.sigmaPt) A.push({ niveau: 'moyen', t: <>Valeur assignée de consensus : u(x<sub>pt</sub>) = 1,25 s* / √p = {fmt(u, 3)} &gt; 0,3 σ<sub>pt</sub> = {fmt(0.3 * opts.sigmaPt, 3)}. Elle n'est pas assez sûre : il faudrait z′ = (x − x<sub>pt</sub>) / √(σ<sub>pt</sub>² + u²).</> });
  }
  return A;
}

// ════════════════ GRAPHIQUES ════════════════
function VueResultats({ v, centre, disp, unite, dec, montrerLoi, surligne = -1, legendeCentre }) {
  const W = 560, H = 230, g = 30, d = 16, b = 40;
  const ok = isFinite(centre) && disp > 0 && montrerLoi;
  const mn = Math.min(...v, ok ? centre - 3.6 * disp : Infinity), mx = Math.max(...v, ok ? centre + 3.6 * disp : -Infinity);
  const X = x => g + (x - mn) / ((mx - mn) || 1) * (W - g - d);
  const piles = {}, pos = {};
  v.map((x, i) => ({ x, i })).sort((a, c) => a.x - c.x).forEach(o => { const cle = Math.round(X(o.x) / 9); piles[cle] = (piles[cle] || 0) + 1; pos[o.i] = piles[cle]; });
  const courbe = ok ? Array.from({ length: 121 }, (_, k) => { const x = mn + k * (mx - mn) / 120; return `${X(x).toFixed(1)},${(H - b - Math.exp(-0.5 * ((x - centre) / disp) ** 2) * 150).toFixed(1)}`; }).join(' ') : '';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Résultats des laboratoires" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {ok && <>
        <rect x={X(centre - 3 * disp)} y="20" width={X(centre + 3 * disp) - X(centre - 3 * disp)} height={H - b - 20} fill="#fef3c7"/>
        <rect x={X(centre - 2 * disp)} y="20" width={X(centre + 2 * disp) - X(centre - 2 * disp)} height={H - b - 20} fill="#dcfce7"/>
        <polyline points={courbe} fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="5 3"/>
        <line x1={X(centre)} y1="20" x2={X(centre)} y2={H - b} stroke="#dc2626" strokeWidth="2"/>
        <text x={X(centre) + 4} y="32" fontSize="12" fontWeight="700" fill="#dc2626">{legendeCentre}</text>
        {[-3, -2, 2, 3].map(k => <text key={k} x={X(centre + k * disp)} y="15" fontSize="11.5" fill={KIT.txt2} textAnchor="middle">{k > 0 ? `+${k}` : k}</text>)}
      </>}
      {v.map((x, i) => <circle key={i} cx={X(x)} cy={H - b - 8 - (pos[i] - 1) * 13} r={i === surligne ? 6.5 : 5} fill={i === surligne ? '#fde047' : '#1e3a8a'} stroke={KIT.txt} strokeWidth={i === surligne ? 2 : 0.5}/>)}
      <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/>
      {Array.from({ length: 7 }, (_, k) => mn + k * (mx - mn) / 6).map((x, k) => <text key={k} x={X(x)} y={H - b + 16} fontSize="12" fill={KIT.txt2} textAnchor="middle">{fmt(x, dec)}</text>)}
      <text x={(g + W - d) / 2} y={H - 6} fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle">résultat ({unite}) — en bas, les graduations ± 2 et ± 3 écarts-types de la formule choisie</text>
    </svg>
  );
}
function VueZ({ z, surligne = -1 }) {
  const W = 560, H = 240, g = 36, d = 10, h = 14, b = 34;
  const zMax = Math.max(4, ...z.filter(isFinite).map(Math.abs)) * 1.05;
  const Y = zz => h + (zMax - Math.max(-zMax, Math.min(zMax, zz))) / (2 * zMax) * (H - h - b);
  const bw = (W - g - d) / z.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="z-score de chaque laboratoire" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {[[3, '#b91c1c'], [2, '#b45309'], [-2, '#b45309'], [-3, '#b91c1c']].map(([k, c]) => (
        <g key={k}><line x1={g} y1={Y(k)} x2={W - d} y2={Y(k)} stroke={c} strokeDasharray="6 4"/><text x={g - 4} y={Y(k) + 4} fontSize="11.5" fill={c} textAnchor="end">{k > 0 ? `+${k}` : k}</text></g>
      ))}
      <line x1={g} y1={Y(0)} x2={W - d} y2={Y(0)} stroke={KIT.txt}/>
      {z.map((zz, i) => <g key={i}>
        <rect x={g + i * bw + bw * 0.15} y={Math.min(Y(0), Y(zz))} width={bw * 0.7} height={Math.abs(Y(zz) - Y(0))} fill={categorie(zz).color} opacity="0.85" stroke={i === surligne ? KIT.txt : 'none'} strokeWidth="2"/>
        <text x={g + i * bw + bw / 2} y={H - b + 14} fontSize="11" fill={KIT.txt2} textAnchor="middle">{i + 1}</text>
      </g>)}
      <text x={(g + W - d) / 2} y={H - 4} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">laboratoire</text>
    </svg>
  );
}
function VueHenry({ v, unite, dec }) {
  const h = henry(v), W = 560, H = 240, g = 56, d = 14, t = 14, b = 40;
  const qMin = Math.min(...h.q), qMax = Math.max(...h.q), sMin = Math.min(...h.s), sMax = Math.max(...h.s);
  const X = q => g + (q - qMin) / ((qMax - qMin) || 1) * (W - g - d), Y = s => H - b - (s - sMin) / ((sMax - sMin) || 1) * (H - b - t);
  const mq = moyenne(h.q), ms = moyenne(h.s), pente = h.q.reduce((a, q, i) => a + (q - mq) * (h.s[i] - ms), 0) / h.q.reduce((a, q) => a + (q - mq) ** 2, 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Droite de Henry" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      <line x1={X(qMin)} y1={Y(ms + pente * (qMin - mq))} x2={X(qMax)} y2={Y(ms + pente * (qMax - mq))} stroke="#7c3aed" strokeWidth="2" strokeDasharray="5 3"/>
      {h.q.map((q, i) => <circle key={i} cx={X(q)} cy={Y(h.s[i])} r="5" fill="#1e3a8a"/>)}
      <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/><line x1={g} y1={t} x2={g} y2={H - b} stroke={KIT.txt}/>
      {[sMin, (sMin + sMax) / 2, sMax].map((s, k) => <text key={k} x={g - 5} y={Y(s) + 4} fontSize="11.5" fill={KIT.txt2} textAnchor="end">{fmt(s, dec)}</text>)}
      <text x={(g + W - d) / 2} y={H - 18} fontSize="12" fill={KIT.txt2} textAnchor="middle">valeur attendue pour une loi normale (quantile)</text>
      <text x={(g + W - d) / 2} y={H - 4} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">r = {fmt(h.r, 3)} (seuil à 5 % : {fmt(h.rCrit, 3)}) — {h.r >= h.rCrit ? 'alignement compatible avec une loi normale' : 'alignement douteux'}</text>
      <text x="14" y={(t + H - b) / 2} fontSize="12" fontWeight="700" fill={KIT.txt} textAnchor="middle" transform={`rotate(-90 14 ${(t + H - b) / 2})`}>résultats rangés ({unite})</text>
    </svg>
  );
}
function VueSuivi() {
  const W = 400, H = 190, g = 34, d = 10, h = 14, b = 30, zMax = 3.6;
  const X = k => g + (k + 0.5) / SUIVI.length * (W - g - d), Y = zz => h + (zMax - zz) / (2 * zMax) * (H - h - b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="z-score d'un laboratoire sur six campagnes" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {[[3, '#b91c1c'], [2, '#b45309'], [-2, '#b45309'], [-3, '#b91c1c']].map(([k, c]) => <line key={k} x1={g} y1={Y(k)} x2={W - d} y2={Y(k)} stroke={c} strokeDasharray="6 4"/>)}
      <line x1={g} y1={Y(0)} x2={W - d} y2={Y(0)} stroke={KIT.txt}/>
      <polyline points={SUIVI.map((zz, k) => `${X(k)},${Y(zz)}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="2.5"/>
      {SUIVI.map((zz, k) => <g key={k}><circle cx={X(k)} cy={Y(zz)} r="5" fill="#2563eb"/>
        <text x={X(k)} y={Y(zz) - 9} fontSize="14" fontWeight="700" fill={KIT.txt} textAnchor="middle">{fmt(zz, 1)}</text>
        <text x={X(k)} y={H - b + 17} fontSize="13" fill={KIT.txt2} textAnchor="middle">n° {k + 1}</text></g>)}
      {[2, -2].map(k => <text key={k} x={g - 4} y={Y(k) + 5} fontSize="13" fill="#b45309" textAnchor="end">{k > 0 ? '+2' : '−2'}</text>)}
    </svg>
  );
}

function Hypotheses() {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Échantillon homogène et stable</strong> : tous les laboratoires mesurent la même chose.</li>
      <li><strong>Loi normale</strong> : les résultats des laboratoires compétents se répartissent selon une loi normale. C'est ce qui donne leur sens aux
        seuils : un laboratoire compétent n'a que 4,6 % de chances de dépasser |z| = 2 et 0,27 % de dépasser |z| = 3. À vérifier sur les données (droite de Henry).</li>
      <li><strong>Une référence qui ne dépend pas du laboratoire évalué</strong> : sinon, un résultat aberrant déplace la moyenne et gonfle l'écart-type, et se « cache » lui-même.</li>
      <li><strong>Assez de participants</strong> : avec la formule du référentiel, |z| ne peut pas dépasser (p − 1) / √p ; les estimations robustes demandent au moins une douzaine de laboratoires.</li>
      <li><strong>Avec la norme ISO</strong> : σ<sub>pt</sub> fixé à l'avance (exigence de la méthode, campagnes précédentes, étude de fidélité, ou écart-type robuste des participants),
        et une valeur assignée assez sûre : u(x<sub>pt</sub>) ≤ 0,3 σ<sub>pt</sub>.</li>
      <li><strong>Une simplification</strong> : pour une valeur de consensus, la norme calcule une moyenne robuste et un écart-type robuste par un algorithme
        itératif (l'« algorithme A ») ; ici, on utilise la médiane et s* = 1,483 × MAD, plus simples. L'incertitude u(x<sub>pt</sub>) = 1,25 s* / √p vient de la
        médiane : pour des données de loi normale, elle est environ √(π/2) ≈ 1,25 fois moins précise qu'une moyenne.</li>
    </ul>
  );
}

// ════════════════ SIMULATION ════════════════
export function SimulationAptitude() {
  const [mode, setMode] = useState('guide');
  const [guide, setGuide] = useEtatPersistant('aptitude-guide-v2', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [graine] = useEtatPersistant('aptitude-graine-v2', Math.floor(Math.random() * 1e6));
  const [ouverts, setOuverts] = useState({ hypo: true, alertes: true, reglages: true, comparer: true });
  const [formule, setFormule] = useState('ref');
  const [jeu, setJeu] = useState('parcours');                 // parcours | reperes | simulee | mes
  const [vue, setVue] = useState('resultats');
  const [arrives, setArrives] = useState(0), [enArrivee, setEnArrivee] = useState(false);
  const [classes, setClasses] = useState({}), [classesVerif, setClassesVerif] = useState(false);
  const [vuFormule, setVuFormule] = useState({});
  // réglages
  const [p, setP] = useState(15), [dispersion, setDispersion] = useState(0.8), [biais, setBiais] = useState(true), [deux, setDeux] = useState(false), [tirage, setTirage] = useState(1);
  const [sigmaPtExp, setSigmaPtExp] = useState(1.2), [xptMode, setXptMode] = useState('reference');
  const [sigmaReperes, setSigmaReperes] = useState(0.15);
  const [texte, setTexte] = useEtatPersistant('aptitude-texte', '24,3 ; 23,8 ; 24,6 ; 25,1 ; 23,2 ; 24,0 ; 28,9 ; 24,4 ; 23,6 ; 24,9 ; 22,1 ; 24,2');
  const [xptSaisi, setXptSaisi] = useEtatPersistant('aptitude-xpt', ''), [sigmaSaisi, setSigmaSaisi] = useEtatPersistant('aptitude-sigma', '1,2');
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;

  // ── Le jeu de données actif ──
  const vSim = useMemo(() => tirerCampagne(graine * 7 + tirage, { p, s: dispersion, biais, deux }), [graine, tirage, p, dispersion, biais, deux]);
  const vMes = texte.split(/[;\s\n\t]+/).map(lireNombre).filter(x => isFinite(x));
  const jeuActif = enGuide && !['reperes'].includes(jeu) ? 'parcours' : jeu;
  const D = jeuActif === 'reperes' ? { ...REPERES, xpt: mediane(REPERES.v), sigmaPt: sigmaReperes, consensus: true }
    : jeuActif === 'simulee' ? { v: vSim, unite: 'mg/L', dec: 1, nom: `Campagne simulée : ions nitrate (${vSim.length} laboratoires)`, xpt: xptMode === 'reference' ? 24.0 : mediane(vSim), sigmaPt: sigmaPtExp, consensus: xptMode !== 'reference' }
      : jeuActif === 'mes' ? { v: vMes, unite: '', dec: 2, nom: `Mes résultats (${vMes.length} laboratoires)`, xpt: xptSaisi.trim() ? lireNombre(xptSaisi) : (vMes.length ? mediane(vMes) : NaN), sigmaPt: lireNombre(sigmaSaisi), consensus: !xptSaisi.trim() }
        : { ...PARCOURS, consensus: false };
  const v = D.v;
  const formuleActive = enGuide && etape < IDX.choisirExclu ? 'ref' : formule;
  const calc = v.length >= 3 ? zScores(v, formuleActive, { xpt: D.xpt, sigmaPt: D.sigmaPt }) : { z: [], centre: NaN, disp: NaN };
  const tousZ = Object.fromEntries(Object.keys(FORMULES).map(f => [f, v.length >= 3 ? zScores(v, f, { xpt: D.xpt, sigmaPt: D.sigmaPt }).z : []]));
  const visibles = v.slice(0, arrives), tous = arrives >= v.length;
  const listeAlertes = tous ? alertes(v, formuleActive, { sigmaPt: D.sigmaPt, consensus: D.consensus }) : [];

  useEffect(() => {
    if (!enArrivee) return;
    if (arrives >= v.length) { setEnArrivee(false); return; }
    const id = setTimeout(() => setArrives(a => a + 1), 250);
    return () => clearTimeout(id);
  }, [enArrivee, arrives, v.length]);
  // Nouveaux résultats : dans le parcours, l'élève les reçoit à l'étape d'arrivée ; ensuite (et en exploration), ils s'affichent directement
  useEffect(() => { setArrives(enGuide && guide.etape <= 2 ? 0 : v.length); setClasses({}); setClassesVerif(false); }, [mode, jeuActif, p, dispersion, biais, deux, tirage]);
  function choisirFormule(f) { setFormule(f); setVuFormule(x => ({ ...x, [`${etape}-${f}`]: true })); }

  // ── Valeurs de la campagne du parcours ──
  const P = PARCOURS.v, mP = moyenne(P), sP = ecartType(P), medP = mediane(P);
  const zRef = P.map(x => (x - mP) / sP);
  const sSans10 = ecartType(P.slice(0, 9));
  const iLab = 4;                                                       // le laboratoire 5 (23,6 mg/L) pour le premier calcul
  const R = REPERES.v, zR1 = (R[0] - moyenne(R)) / ecartType(R), zR1rob = (R[0] - mediane(R)) / ecartRobuste(R);
  const classesOk = P.every((_, i) => classes[i] === categorie(zRef[i]).cle);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const ETAPES = [
    { id: 'principe', titre: 'Un essai d’aptitude', focus: [],
      texte: <>Un organisateur envoie le <strong>même échantillon</strong> d'eau à 10 laboratoires, qui dosent les ions nitrate avec leur méthode
        habituelle. Chacun reçoit ensuite un <strong>score</strong> qui évalue sa performance : le z-score. Le référentiel demande de savoir « évaluer le
        z-score à l'aide d'une méthode fournie » ; ici, on va plus loin, en comparant plusieurs méthodes et leurs hypothèses.</>, tache: null },
    { id: 'difference', titre: 'Évaluer qui, ou quoi ?', focus: [],
      texte: <>Un essai d’aptitude est une <strong>comparaison interlaboratoire</strong>. La simulation « Fidélité d’une méthode : étude interlaboratoire » (ISO 5725) fait aussi analyser le même échantillon par plusieurs laboratoires, mais dans un autre but.</>,
      tache: { type: 'qcm', q: 'Que cherche-t-on à évaluer dans un essai d’aptitude ?', options: ['La compétence de chaque laboratoire', 'La fidélité (répétabilité et reproductibilité) de la méthode', 'La pureté de l’échantillon'], bonne: 0 } },
    { id: 'arrivee', titre: 'Les résultats arrivent', focus: [],
      texte: <>Cliquez sur « Recevoir les résultats » sous le graphique.</>,
      tache: { type: 'action', ok: tous, consigne: tous ? null : `Résultats reçus : ${arrives} / ${v.length}` } },
    { id: 'moyenne', titre: 'La formule du référentiel', focus: [],
      texte: <>Le référentiel et les « Repères pour la formation » utilisent z<sub>i</sub> = (x<sub>i</sub> − x̄) / s, où x̄ et s sont la moyenne et
        l'écart-type expérimental des résultats de <strong>tous</strong> les laboratoires. Les résultats (mg/L) : {P.map(x => fmt(x, 1)).join(' ; ')}.</>,
      tache: { type: 'num', q: 'Moyenne x̄', unite: 'mg/L', vrai: mP, tol: 0.002, affiche: x => fmt(x, 2) } },
    { id: 'ecartType', titre: 'L’écart-type expérimental', focus: [],
      texte: <>Sur la calculatrice : σ<sub>n−1</sub> (ou s<sub>x</sub>).</>,
      tache: { type: 'num', q: 'Écart-type expérimental s', unite: 'mg/L', vrai: sP, tol: 0.02, affiche: x => fmt(x, 2),
        pieges: [[ecartTypePop(P), 'C’est σ_n : prenez σ_n−1, qui divise par N − 1.']] } },
    { id: 'z', titre: 'Le z-score d’un laboratoire', focus: [],
      texte: <>Le laboratoire {iLab + 1} (en jaune) a trouvé {fmt(P[iLab], 1)} mg/L.</>,
      tache: { type: 'num', q: `z-score du laboratoire ${iLab + 1}`, unite: '', vrai: zRef[iLab], tol: 0.03, affiche: x => fmt(x, 2),
        pieges: [[-zRef[iLab], 'Attention au signe : c’est x − x̄. Un z négatif signifie que le laboratoire trouve moins que la moyenne.']] } },
    { id: 'classer', titre: 'Classer les laboratoires', focus: [],
      texte: <>Classez chaque laboratoire dans le tableau : |z| ≤ 2 satisfaisant ; 2 &lt; |z| &lt; 3 discutable ; |z| ≥ 3 non satisfaisant.</>,
      tache: { type: 'action', ok: classesVerif && classesOk, consigne: classesVerif && classesOk ? null : 'Classez les 10 laboratoires, puis vérifiez.' } },
    { id: 'hypotheses', titre: 'Sur quoi reposent ces seuils ?', focus: ['hypo'],
      texte: <>Lisez l'encadré « Hypothèses de travail » : toute l'interprétation en dépend.</>,
      tache: { type: 'qcm', q: 'D’où viennent les seuils |z| = 2 et |z| = 3 ?', options: ['De la loi normale : un laboratoire compétent a environ 95 % de chances d’avoir |z| ≤ 2, et 99,7 % d’avoir |z| ≤ 3', 'Ce sont des valeurs choisies au hasard', 'Du nombre de laboratoires'], bonne: 0 } },
    { id: 'henry', titre: 'Vérifier la normalité', focus: ['alertes'],
      texte: <>Passez à la vue « Droite de Henry » : on y range les résultats et on les compare aux valeurs attendues pour une loi normale. S'ils
        s'alignent, l'hypothèse est plausible.</>,
      tache: { type: 'qcm', q: 'Que montre la droite de Henry ?', options: ['Les points s’alignent, sauf un : le laboratoire 10 s’écarte de la loi normale des autres', 'Tous les points sont parfaitement alignés', 'On ne peut rien en dire'], bonne: 0 } },
    { id: 'masque', titre: 'Un laboratoire qui se cache', focus: ['alertes'],
      texte: <>Le laboratoire 10 trouve 30,5 mg/L quand les autres trouvent entre 23,6 et 25,1. Il est clairement à part, et pourtant son z-score ne vaut
        que {fmt(zRef[9], 2)}.</>,
      tache: { type: 'qcm', q: 'Pourquoi n’est-il que « discutable » ?', options: [`Il entre dans le calcul de x̄ et de s : il tire la moyenne vers lui, et gonfle s de ${fmt(sSans10, 2)} à ${fmt(sP, 2)}`, 'Son erreur est faible', 'Les autres laboratoires se trompent'], bonne: 0 } },
    { id: 'choisirExclu', titre: 'Changer de formule', focus: ['formule'],
      texte: <>Le sélecteur de formule est apparu au-dessus du graphique. Choisissez « Labo évalué exclu » : pour chaque laboratoire, x̄ et s sont calculés
        <strong> sans lui</strong>.</>,
      tache: { type: 'action', ok: formule === 'exclu', consigne: formule === 'exclu' ? null : 'Choisissez la formule « Labo évalué exclu ».' } },
    { id: 'exclu', titre: 'Le laboratoire 10, sans lui-même', focus: [],
      texte: <>Regardez son nouveau z-score dans le tableau.</>,
      tache: { type: 'qcm', q: 'Avec cette formule, le laboratoire 10 est…', options: ['non satisfaisant', 'discutable', 'satisfaisant'], bonne: 0,
        expl: `Son z passe de ${fmt(zRef[9], 2)} à ${fmt(tousZ.exclu && PARCOURS.v === v ? tousZ.exclu[9] : NaN, 1)} : la même mesure, un tout autre verdict. Le choix de la formule n’est pas un détail.` } },
    { id: 'borne', titre: 'Une limite mathématique', focus: ['alertes'],
      texte: <>Revenez à la formule du référentiel et lisez la première alerte. Avec p laboratoires, cette formule ne peut jamais donner |z| &gt; (p − 1) / √p.</>,
      tache: { type: 'qcm', q: 'Avec 10 laboratoires, quelle catégorie est impossible à atteindre ?', options: ['non satisfaisant : |z| ne peut pas dépasser 2,85', 'discutable', 'aucune'], bonne: 0,
        expl: 'Avec 9 laboratoires, la borne tombe à 2,67 ; avec 5, à 1,79 : même « discutable » devient impossible. Il faut le savoir avant d’interpréter un essai à peu de participants.' } },
    { id: 'robuste', titre: 'Des statistiques robustes', focus: ['formule'],
      texte: <>Choisissez « Statistiques robustes » : la médiane remplace la moyenne, et s* = 1,483 × MAD remplace s. Une valeur aberrante les déplace très peu.</>,
      tache: { type: 'num', q: 'Médiane des 10 résultats', unite: 'mg/L', vrai: medP, tol: 0.001, affiche: x => fmt(x, 2),
        pieges: [[mP, 'C’est la moyenne : rangez les valeurs et prenez celle du milieu (ici la moyenne des deux du milieu).']] } },
    { id: 'iso', titre: 'La norme ISO 13528', focus: ['formule'],
      texte: <>Les professionnels utilisent z = (x<sub>i</sub> − x<sub>pt</sub>) / σ<sub>pt</sub>. Ici, l'organisateur a utilisé un <strong>matériau de
        référence certifié</strong> : x<sub>pt</sub> = 24,0 mg/L ; et il a fixé, d'après l'exigence de la méthode, σ<sub>pt</sub> = 1,2 mg/L. Choisissez « Norme ISO 13528 ».</>,
      tache: { type: 'num', q: 'z-score du laboratoire 10 avec cette formule', unite: '', vrai: (P[9] - 24) / 1.2, tol: 0.02, affiche: x => fmt(x, 2) } },
    { id: 'pourquoiSigma', titre: 'Pourquoi un σ_pt fixé ?', focus: [],
      texte: <>La norme accepte plusieurs façons de fixer σ<sub>pt</sub> : l'exigence de la méthode, les campagnes précédentes, une étude de fidélité, ou
        un écart-type robuste des participants.</>,
      tache: { type: 'qcm', q: 'Quel est l’avantage d’un σ_pt fixé à l’avance, d’après l’exigence de la méthode ?',
        options: ['Il ne dépend pas des résultats évalués : ni un laboratoire aberrant, ni une campagne où tous travaillent mal ne peuvent le modifier', 'Il est toujours plus petit que s', 'Il rend tous les laboratoires satisfaisants'], bonne: 0 } },
    { id: 'reperes', titre: 'L’exemple des Repères', focus: ['jeu'],
      texte: <>Choisissez le jeu de données « Exemple des Repères » (14 laboratoires, teneur en soufre de feuilles de frêne), avec la formule du référentiel.
        Le laboratoire 1 trouve {fmt(R[0], 2)} quand les autres trouvent entre 2,10 et 2,83 ; son z vaut {fmt(zR1, 2)}. Essayez aussi la formule robuste : {fmt(zR1rob, 2)}.</>,
      tache: { type: 'qcm', q: 'Pourquoi la formule robuste ne change-t-elle presque rien ici ?',
        options: ['Les 13 autres laboratoires sont eux-mêmes très dispersés : leur dispersion devient la référence, et le laboratoire 1 paraît moins anormal', 'Le laboratoire 1 n’est pas aberrant', 'La médiane est mal calculée'], bonne: 0,
        expl: 'Toute formule qui tire sa dispersion des participants hérite de leur dispersion. Seul un σ_pt fixé d’après l’exigence de la méthode dirait si cette dispersion est acceptable. Essayez la formule ISO en réglant σ_pt.' } },
    { id: 'signe', titre: 'Le signe du z-score', focus: [],
      texte: <>Dans les Repères, le tableau ne donne que des valeurs positives. Pourtant, le z du laboratoire 1 est négatif.</>,
      tache: { type: 'qcm', q: 'Que signifie un z-score négatif ?', options: ['Le laboratoire trouve moins que la référence : il sous-estime', 'Le laboratoire est meilleur que les autres', 'Rien : seule la valeur absolue compte'], bonne: 0,
        expl: 'On classe avec |z|, mais le signe dit dans quel sens chercher l’erreur. Il faut toujours l’écrire.' } },
    { id: 'suivi', titre: 'Le suivi dans le temps', focus: ['suivi'],
      texte: <>Le graphique sous les alertes montre les z-scores d'un même laboratoire sur six campagnes successives.</>,
      tache: { type: 'qcm', q: 'Que conclure ?', options: ['Il reste satisfaisant, mais il dérive : une erreur systématique s’installe, à corriger avant qu’elle ne devienne un problème', 'Tout va bien', 'Il est non satisfaisant'], bonne: 0,
        expl: 'Sous l’hypothèse de la loi normale, six z-scores positifs et croissants d’affilée ont très peu de chances d’arriver par hasard.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez appliquer la formule du référentiel, et surtout dans quelles conditions elle a un sens : un laboratoire aberrant peut s'y cacher,
        le seuil 3 peut être inatteignable, et toute interprétation suppose une loi normale à vérifier. En exploration libre, comparez les formules sur
        d'autres campagnes, sur l'exemple des Repères, ou sur les résultats de vos apprentis.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const vu = id => !enGuide || etape >= idx(id);
  useEffect(() => { if (enGuide && etape > idx('arrivee') && arrives < v.length) setArrives(v.length); }, [etape, enGuide]);
  // Dans le parcours, le jeu « Repères » n'est proposé qu'à son étape ; on revient à la campagne des nitrates ailleurs
  useEffect(() => { if (enGuide && etape < idx('reperes') && jeu !== 'parcours') setJeu('parcours'); }, [etape, enGuide]);
  const montrerZ = !enGuide || etape > idx('z');
  const montrerComparaison = !enGuide || etape >= idx('iso');
  const hl = id => enGuide && et.focus.includes(id);

  // ════════════════ BLOCS ════════════════
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const selecteurFormule = vu('choisirExclu') && (
    <div style={{ ...styleBoite, marginBottom: 10, ...cadre('formule') }} data-apparait={`${idx('choisirExclu')}`}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Formule du z-score :</span>
        {Object.entries(FORMULES).map(([k, f]) => <button key={k} onClick={() => choisirFormule(k)} style={stylePetitBouton(formuleActive === k, '#0f766e')}>{f.nom}</button>)}
      </div>
      <div style={{ fontSize: 14, color: KIT.txt }}><span style={{ fontFamily: 'Georgia, serif', fontSize: 16 }}>{FORMULES[formuleActive].formule}</span> — {avecIndices(FORMULES[formuleActive].detail)}</div>
    </div>
  );
  const selecteurJeu = (!enGuide || vu('reperes')) && (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10, ...cadre('jeu') }} data-apparait={`${idx('reperes')}`}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Jeu de données :</span>
      {[['parcours', 'Nitrates (10 laboratoires)'], ['reperes', 'Exemple des Repères (14 laboratoires)'], ...(enGuide ? [] : [['simulee', 'Campagne simulée'], ['mes', 'Mes résultats']])].map(([k, n]) =>
        <button key={k} onClick={() => setJeu(k)} style={stylePetitBouton(jeuActif === k, '#334155')}>{n}</button>)}
    </div>
  );
  const legendeCentre = formuleActive === 'ref' || formuleActive === 'exclu' ? 'x̄' : formuleActive === 'robuste' ? 'médiane' : 'x_pt';
  const graphique = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt }}>{D.nom}</div>
        {tous && <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setVue('resultats')} style={stylePetitBouton(vue === 'resultats', '#334155')}>Résultats</button>
          {montrerZ && <button onClick={() => setVue('z')} style={stylePetitBouton(vue === 'z', '#334155')}>z-scores</button>}
          {vu('henry') && <button onClick={() => setVue('henry')} style={stylePetitBouton(vue === 'henry', '#334155')}>Droite de Henry</button>}
        </div>}
      </div>
      {visibles.length === 0 ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: KIT.txt2, fontSize: 14, background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>En attente des résultats…</div>
        : vue === 'z' && montrerZ ? <VueZ z={calc.z} surligne={enGuide && jeuActif === 'parcours' ? iLab : -1}/>
          : vue === 'henry' && vu('henry') && v.length >= 3 ? <VueHenry v={v} unite={D.unite} dec={D.dec}/>
            : <VueResultats v={visibles} centre={calc.centre} disp={formuleActive === 'exclu' ? NaN : calc.disp} unite={D.unite} dec={D.dec}
              montrerLoi={tous && (montrerZ || !enGuide)} surligne={enGuide && jeuActif === 'parcours' && etape >= idx('z') ? iLab : -1} legendeCentre={legendeCentre}/>}
      {!tous && <div style={{ marginTop: 8 }}><button onClick={() => setEnArrivee(true)} disabled={enArrivee} style={{ ...styleBouton(!enArrivee, '#16a34a'), opacity: enArrivee ? 0.6 : 1 }}>{enArrivee ? 'Réception…' : '▶ Recevoir les résultats'}</button></div>}
      {vue === 'resultats' && tous && formuleActive === 'exclu' && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Avec la formule « labo exclu », chaque laboratoire a sa propre référence : il n'y a pas une seule courbe à tracer.</div>}
    </div>
  );
  const tableau = (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
        <thead><tr>
          <th style={cellule}>Labo</th><th style={cellule}>Résultat</th>
          <th style={{ ...cellule, background: '#ecfeff' }}>z ({FORMULES[formuleActive].court})</th><th style={cellule}>Classement</th>
          {montrerComparaison && Object.entries(FORMULES).filter(([k]) => k !== formuleActive).map(([k, f]) => <th key={k} style={{ ...cellule, color: KIT.txt2 }}>z ({f.court})</th>)}
        </tr></thead>
        <tbody>
          {v.map((x, i) => {
            const zz = calc.z[i], c = categorie(zz), choisi = classes[i], juste = choisi === c.cle;
            return (
              <tr key={i}>
                <td style={cellule}>{i + 1}</td><td style={cellule}>{fmt(x, D.dec)}</td>
                <td style={{ ...cellule, background: '#ecfeff', fontWeight: 700 }}>{montrerZ ? fmt(zz, 2) : '?'}</td>
                <td style={cellule}>{enGuide && etape === idx('classer') ? (
                  <select value={choisi || ''} aria-label={`Classement du laboratoire ${i + 1}`} onChange={e => { const val = e.target.value; setClasses(cl => ({ ...cl, [i]: val })); setClassesVerif(false); }}
                    style={{ fontSize: 13.5, padding: '2px 4px', borderRadius: 5, border: `1.5px solid ${classesVerif ? (juste ? '#16a34a' : '#dc2626') : KIT.bord}` }}>
                    <option value="">?</option><option value="sat">satisfaisant</option><option value="disc">discutable</option><option value="nonsat">non satisfaisant</option>
                  </select>) : montrerZ ? <span style={{ background: c.bg, color: c.color, fontWeight: 700, padding: '1px 8px', borderRadius: 10, fontSize: 12.5 }}>{c.label}</span> : '?'}</td>
                {montrerComparaison && Object.keys(FORMULES).filter(k => k !== formuleActive).map(k => {
                  const zk = tousZ[k][i], ck = categorie(zk);
                  return <td key={k} style={{ ...cellule, color: ck.color }}>{fmt(zk, 2)}{ck.cle !== c.cle && <span title="classement différent"> ⚠</span>}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {enGuide && etape === idx('classer') && <div style={{ marginTop: 6 }}>
        <button onClick={() => setClassesVerif(true)} style={stylePetitBouton(true, '#16a34a')}>Vérifier le classement</button>
        {classesVerif && <span style={{ marginLeft: 8 }}>{classesOk ? '✅ Classement juste' : '❌ Au moins un laboratoire est mal classé'}</span>}
      </div>}
      {montrerComparaison && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>⚠ : le classement change avec cette formule. Seuils de la norme ISO : |z| ≤ 2 satisfaisant (les Repères classent z = 2 exactement en « discutable »).</div>}
    </div>
  );
  const panneauAlertes = vu('henry') && tous && (
    <div style={{ ...styleBoite, ...cadre('alertes') }} data-apparait={`${idx('henry')}`}>
      <Section titre="Ce que l’on peut vérifier" ouvert={ouverts.alertes} onBascule={() => setOuverts(o => ({ ...o, alertes: !o.alertes }))}>
        {listeAlertes.map((a, k) => (
          <div key={k} style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 6, padding: '6px 8px', borderRadius: 6,
            background: a.niveau === 'fort' ? '#fee2e2' : a.niveau === 'moyen' ? '#fef3c7' : '#f1f5f9', color: KIT.txt }}>
            {a.niveau === 'fort' ? '⚠️ ' : a.niveau === 'moyen' ? '⚠️ ' : 'ℹ️ '}{a.t}</div>
        ))}
        {vu('suivi') && <div style={{ marginTop: 8, ...cadre('suivi') }}><div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Suivi d'un laboratoire : z-score sur six campagnes</div><VueSuivi/></div>}
      </Section>
    </div>
  );
  const panneauHypo = vu('hypotheses') && (
    <div style={{ ...styleBoite, ...cadre('hypo') }} data-apparait={`${idx('hypotheses')}`}>
      <Section titre="Hypothèses de travail" ouvert={ouverts.hypo} onBascule={() => setOuverts(o => ({ ...o, hypo: !o.hypo }))}><Hypotheses/></Section>
    </div>
  );
  const reglages = jeuActif === 'simulee' ? (
    <>
      <Curseur nom="Nombre de laboratoires p" valeur={p} onChange={setP} min={5} max={40} pas={1} couleur="#0f766e"/>
      <Curseur nom="Dispersion des laboratoires compétents" valeur={dispersion} onChange={setDispersion} min={0.2} max={2} pas={0.1} unite="mg/L" decimales={1} couleur="#0f766e"/>
      <label style={{ display: 'flex', gap: 6, fontSize: 14, color: KIT.txt, marginBottom: 4 }}><input type="checkbox" checked={biais} onChange={e => setBiais(e.target.checked)}/> Un laboratoire a un gros biais</label>
      <label style={{ display: 'flex', gap: 6, fontSize: 14, color: KIT.txt, marginBottom: 8 }}><input type="checkbox" checked={deux} onChange={e => setDeux(e.target.checked)}/> Un tiers des laboratoires utilise une autre méthode</label>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '4px 0' }}>Pour la formule ISO</div>
      <Curseur nom="σ_pt fixé par l'organisateur" valeur={sigmaPtExp} onChange={setSigmaPtExp} min={0.4} max={2.5} pas={0.1} unite="mg/L" decimales={1} couleur="#0f766e"/>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
        <button onClick={() => setXptMode('reference')} style={stylePetitBouton(xptMode === 'reference', '#0f766e')}>x_pt : référence 24,0</button>
        <button onClick={() => setXptMode('consensus')} style={stylePetitBouton(xptMode === 'consensus', '#0f766e')}>x_pt : consensus (médiane)</button>
      </div>
      <button onClick={() => setTirage(t => t + 1)} style={styleBouton(false)}>🎲 Une autre campagne</button>
    </>
  ) : jeuActif === 'reperes' ? (
    <>
      <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>Moyennes des 4 essais de chaque laboratoire, d'après l'exemple des « Repères pour la formation ». Pour la formule ISO, x<sub>pt</sub> = médiane des laboratoires, et σ<sub>pt</sub> est à choisir :</div>
      <Curseur nom="σ_pt (exigence de la méthode)" valeur={sigmaReperes} onChange={setSigmaReperes} min={0.05} max={0.5} pas={0.01} unite="u.a." decimales={2} couleur="#0f766e"/>
    </>
  ) : jeuActif === 'mes' ? (
    <>
      <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={3} aria-label="Résultats des laboratoires" style={{ width: '100%', boxSizing: 'border-box', fontSize: 14, padding: 6, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, margin: '4px 0 8px' }}>Un résultat par laboratoire (ou par apprenti), séparés par des espaces ou des points-virgules.</div>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: KIT.txt, marginBottom: 6 }}>x<sub>pt</sub> (formule ISO) :
        <input value={xptSaisi} placeholder="vide : médiane" onChange={e => setXptSaisi(e.target.value)} aria-label="Valeur assignée" style={{ width: 120, fontSize: 14, padding: '3px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/></label>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: KIT.txt }}>σ<sub>pt</sub> (formule ISO) :
        <input value={sigmaSaisi} onChange={e => setSigmaSaisi(e.target.value)} aria-label="Écart-type pour l'aptitude" style={{ width: 90, fontSize: 14, padding: '3px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/></label>
    </>
  ) : <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>Matériau de référence certifié : x<sub>pt</sub> = 24,0 mg/L ; σ<sub>pt</sub> = 1,2 mg/L fixé par l'organisateur.</div>;

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const g = Math.floor(Math.random() * 1e6), pp = 8 + Math.floor(Math.random() * 6);
    const vv = tirerCampagne(g, { p: pp, s: 0.6 + Math.random() * 0.4, biais: true });
    const k = Math.floor(Math.random() * pp);
    setDefi({ v: vv, k, sigma: [1.0, 1.2, 1.5][Math.floor(Math.random() * 3)], reps: {}, verifie: false });
  }
  const voletDefi = defi && (() => {
    const vv = defi.v, m = moyenne(vv), s = ecartType(vv), iLoin = vv.reduce((a, x, i) => (Math.abs(x - mediane(vv)) > Math.abs(vv[a] - mediane(vv)) ? i : a), 0);
    const zk = (vv[defi.k] - m) / s, zLoinRef = (vv[iLoin] - m) / s, zLoinIso = (vv[iLoin] - 24) / defi.sigma, zMax = (vv.length - 1) / Math.sqrt(vv.length);
    const catIso = categorie(zLoinIso).label;
    const Q = [
      { id: 'm', q: 'Moyenne x̄', vrai: m, tol: 0.002, aff: fmt(m, 2) },
      { id: 's', q: 'Écart-type expérimental s', vrai: s, tol: 0.02, aff: fmt(s, 2) },
      { id: 'zk', q: `z-score du laboratoire ${defi.k + 1} (formule du référentiel)`, vrai: zk, tol: 0.04, aff: fmt(zk, 2) },
      { id: 'zl', q: `Le laboratoire ${iLoin + 1} est le plus éloigné. Son z-score avec la formule ISO (x_pt = 24,0 mg/L, σ_pt = ${fmt(defi.sigma, 1)} mg/L)`, vrai: zLoinIso, tol: 0.03, aff: fmt(zLoinIso, 2) },
      { id: 'b', q: `Avec ${vv.length} laboratoires, valeur maximale possible de |z| avec la formule du référentiel`, vrai: zMax, tol: 0.01, aff: fmt(zMax, 2) },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          Une campagne de dosage des ions nitrate : {vv.length} laboratoires. Résultats (mg/L), dans l'ordre des laboratoires :
          <div style={{ fontFamily: 'monospace', fontSize: 14, margin: '6px 0', background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 6, padding: '6px 8px' }}>{vv.map(x => fmt(x, 1)).join(' ; ')}</div>
        </div>
        {Q.map((q, k) => {
          const rep = defi.reps[q.id] || '', ok = proche(lireNombre(rep), q.vrai, q.tol);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const val = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: val } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {q.aff}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouvelle campagne</button>
        </div>
        {defi.verifie && <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.5, background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 6, padding: '6px 8px' }}>
          Bilan : le laboratoire {iLoin + 1} est « {categorie(zLoinRef).label} » avec la formule du référentiel (z = {fmt(zLoinRef, 2)}), et « {catIso} » avec la norme ISO (z = {fmt(zLoinIso, 2)}).
          {categorie(zLoinRef).cle !== categorie(zLoinIso).cle ? ' Le verdict dépend de la formule : laquelle est la plus justifiée ici, et pourquoi ?' : ' Les deux formules donnent le même verdict sur ce laboratoire.'}
        </div>}
      </div>
    );
  })();

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi' && !defi) nouveauDefi(); if (m !== 'guide' && jeu === 'parcours') setJeu('parcours'); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ap-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ap-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .ap-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Essais d'aptitude (comparaison interlaboratoire) : le z-score et ses hypothèses</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      {enDefi ? <div className="ap-l1"><div style={styleBoite}>{voletDefi}</div><div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div><Hypotheses/></div></div> : <>
        {selecteurJeu}
        {selecteurFormule}
        <div className="ap-l1">
          {graphique}
          {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
            : <div style={styleBoite}><Section titre="Le jeu de données" ouvert={ouverts.reglages} onBascule={() => setOuverts(o => ({ ...o, reglages: !o.reglages }))}>{reglages}</Section></div>}
        </div>
        <div className="ap-l2">
          {panneauAlertes}
          {panneauHypo}
          {tous && <div style={{ ...styleBoite, gridColumn: '1 / -1' }} data-apparait={`${idx('classer')}`}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Les laboratoires{montrerComparaison ? ' : le z-score selon chaque formule' : ''}</div>
            {tableau}
          </div>}
        </div>
      </>}
    </div>
  );
}

// Numéro de l'étape où le sélecteur de formule apparaît (la formule du référentiel est imposée avant)
const IDX = { choisirExclu: 10 };
const cellule = { padding: '4px 6px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 13.5 };
