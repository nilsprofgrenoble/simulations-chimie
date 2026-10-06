import { useState, useEffect, useMemo } from "react";
import { cardStyle, fmt, lireNombre, proche, CarteParcours, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, Curseur, ORANGE_GUIDE, avecIndices } from "../commun";

// ====================================================
// ESSAIS D'APTITUDE ET Z-SCORE (BTS Métiers de la chimie) — d'après ISO 13528
// Un organisateur envoie le même échantillon à des laboratoires ; chacun est évalué par z = (x − x_pt) / σ_pt.
// Les hypothèses de travail (homogénéité, loi normale, incertitude de x_pt, σ_pt fixé à l'avance, nombre de
// participants) sont rendues explicites et discutées, car c'est d'elles que viennent les seuils 2 et 3.
// ====================================================

function rng(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// ── Statistiques ──
const mediane = v => { const s = [...v].sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
// Écart-type robuste : s* = 1,483 × MAD (médiane des écarts absolus à la médiane)
const ecartRobuste = v => { const m = mediane(v); return 1.483 * mediane(v.map(x => Math.abs(x - m))); };
// Incertitude-type de la valeur de consensus (ISO 13528) : u(x_pt) = 1,25 × s* / √p
const uConsensus = v => 1.25 * ecartRobuste(v) / Math.sqrt(v.length);
export function categorie(z) {
  const a = Math.abs(z);
  if (a <= 2) return { cle: 'sat', label: 'satisfaisant', signal: 'aucun signal', color: '#15803d', bg: '#dcfce7' };
  if (a < 3) return { cle: 'disc', label: 'discutable', signal: 'signal d’avertissement', color: '#b45309', bg: '#fef3c7' };
  return { cle: 'nonsat', label: 'non satisfaisant', signal: 'signal d’action', color: '#b91c1c', bg: '#fee2e2' };
}

// ── Une campagne d'essai d'aptitude : ions nitrate d'une eau (mg/L) ──
const CAMPAGNE = { mesurande: 'ions nitrate NO₃⁻', unite: 'mg/L', vraie: 24.0, sigmaPt: 1.2, dec: 1 };
// Résultats de p laboratoires : les labos compétents suivent N(vraie, s) ; on peut ajouter un labo biaisé et un groupe utilisant une autre méthode
function tirerCampagne(graine, { p = 15, s = 0.8, vraie = CAMPAGNE.vraie, biais = true, deuxMethodes = false, dec = 1 } = {}) {
  const r = rng(graine), q = Math.pow(10, dec);
  const v = [];
  for (let k = 0; k < p; k++) {
    const decal = deuxMethodes && k % 3 === 0 ? 3.2 : 0;           // un tiers des labos utilise une méthode qui surestime
    v.push(Math.round((vraie + decal + s * gauss(r)) * q) / q);
  }
  if (biais && p >= 6) {
    const i = Math.floor(r() * p); v[i] = Math.round((vraie + (r() < 0.5 ? -1 : 1) * (4 + 1.5 * r())) * q) / q;
  }
  return v;
}
// Pour le parcours : une campagne qui contient les trois catégories, avec une valeur de consensus fiable
function campagneParcours(graine) {
  for (let g = graine; g < graine + 2000; g++) {
    const v = tirerCampagne(g);
    const xpt = mediane(v), z = v.map(x => (x - xpt) / CAMPAGNE.sigmaPt), cats = z.map(zz => categorie(zz).cle);
    if (cats.filter(c => c === 'disc').length === 1 && cats.filter(c => c === 'nonsat').length === 1 && uConsensus(v) <= 0.3 * CAMPAGNE.sigmaPt) return { v, graine: g };
  }
  return { v: tirerCampagne(graine), graine };
}
// Suivi d'un laboratoire sur six campagnes : il reste « satisfaisant », mais il dérive
const SUIVI = [0.2, 0.6, 0.9, 1.3, 1.6, 1.9];

// ════════════════ GRAPHIQUES ════════════════
// Les résultats sur l'axe des concentrations, avec la loi normale N(x_pt, σ_pt) et les zones ± 2 σ_pt et ± 3 σ_pt
function VueResultats({ v, xpt, sigmaPt, unite, montrerLoi, surligne = -1, dec = 1 }) {
  const W = 560, H = 230, g = 30, d = 16, b = 40;
  const mn = Math.min(...v, xpt - 3.6 * sigmaPt), mx = Math.max(...v, xpt + 3.6 * sigmaPt);
  const X = x => g + (x - mn) / (mx - mn) * (W - g - d);
  const ordre = v.map((x, i) => ({ x, i })).sort((a, c) => a.x - c.x);
  const piles = {}; const pos = {};
  ordre.forEach(o => { const cle = Math.round(X(o.x) / 9); piles[cle] = (piles[cle] || 0) + 1; pos[o.i] = piles[cle]; });
  const yPt = k => H - b - 8 - (k - 1) * 13;
  const gaussY = x => Math.exp(-0.5 * ((x - xpt) / sigmaPt) ** 2);
  const courbe = Array.from({ length: 121 }, (_, k) => { const x = mn + k * (mx - mn) / 120; return `${X(x).toFixed(1)},${(H - b - gaussY(x) * 150).toFixed(1)}`; }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Résultats des laboratoires et zones du z-score"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {montrerLoi && <>
        <rect x={X(xpt - 3 * sigmaPt)} y="20" width={X(xpt + 3 * sigmaPt) - X(xpt - 3 * sigmaPt)} height={H - b - 20} fill="#fef3c7"/>
        <rect x={X(xpt - 2 * sigmaPt)} y="20" width={X(xpt + 2 * sigmaPt) - X(xpt - 2 * sigmaPt)} height={H - b - 20} fill="#dcfce7"/>
        <polyline points={courbe} fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="5 3"/>
        {[-3, -2, 2, 3].map(k => <text key={k} x={X(xpt + k * sigmaPt)} y="15" fontSize="11.5" fill={KIT.txt2} textAnchor="middle">{k > 0 ? `+${k}` : k} σ<tspan baselineShift="sub" fontSize="9">pt</tspan></text>)}
        <line x1={X(xpt)} y1="20" x2={X(xpt)} y2={H - b} stroke="#dc2626" strokeWidth="2"/>
        <text x={X(xpt) + 4} y="32" fontSize="12" fontWeight="700" fill="#dc2626">x<tspan baselineShift="sub" fontSize="9">pt</tspan></text>
      </>}
      {v.map((x, i) => <circle key={i} cx={X(x)} cy={yPt(pos[i])} r={i === surligne ? 6.5 : 5} fill={i === surligne ? '#fde047' : '#1e3a8a'} stroke={KIT.txt} strokeWidth={i === surligne ? 2 : 0.5}/>)}
      <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/>
      {Array.from({ length: 7 }, (_, k) => mn + k * (mx - mn) / 6).map((x, k) => (
        <text key={k} x={X(x)} y={H - b + 16} fontSize="12" fill={KIT.txt2} textAnchor="middle">{fmt(x, dec)}</text>
      ))}
      <text x={(g + W - d) / 2} y={H - 6} fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle">résultat ({unite})</text>
    </svg>
  );
}
// Les z-scores de chaque laboratoire
function VueZ({ z, montrerValeurs = true, surligne = -1 }) {
  const W = 560, H = 240, g = 36, d = 10, h = 14, b = 34;
  const zMax = Math.max(4, ...z.map(Math.abs)) * 1.05;
  const Y = zz => h + (zMax - zz) / (2 * zMax) * (H - h - b);
  const bw = (W - g - d) / z.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="z-score de chaque laboratoire"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {[[3, '#b91c1c'], [2, '#b45309'], [-2, '#b45309'], [-3, '#b91c1c']].map(([k, c]) => (
        <g key={k}><line x1={g} y1={Y(k)} x2={W - d} y2={Y(k)} stroke={c} strokeDasharray="6 4"/>
          <text x={g - 4} y={Y(k) + 4} fontSize="11.5" fill={c} textAnchor="end">{k > 0 ? `+${k}` : k}</text></g>
      ))}
      <line x1={g} y1={Y(0)} x2={W - d} y2={Y(0)} stroke={KIT.txt}/>
      {z.map((zz, i) => {
        const c = categorie(zz);
        return <g key={i}>
          <rect x={g + i * bw + bw * 0.15} y={Math.min(Y(0), Y(zz))} width={bw * 0.7} height={Math.abs(Y(zz) - Y(0))} fill={montrerValeurs ? c.color : '#94a3b8'} opacity={i === surligne ? 1 : 0.8}
            stroke={i === surligne ? KIT.txt : 'none'} strokeWidth="2"/>
          <text x={g + i * bw + bw / 2} y={H - b + 14} fontSize="11" fill={KIT.txt2} textAnchor="middle">{i + 1}</text>
        </g>;
      })}
      <text x={(g + W - d) / 2} y={H - 4} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">laboratoire</text>
    </svg>
  );
}
// Le suivi d'un laboratoire sur plusieurs campagnes
function VueSuivi() {
  const W = 400, H = 190, g = 34, d = 10, h = 14, b = 30, zMax = 3.6;
  const X = k => g + (k + 0.5) / SUIVI.length * (W - g - d), Y = zz => h + (zMax - zz) / (2 * zMax) * (H - h - b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="z-score d'un laboratoire sur six campagnes"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
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

// ── L'encadré des hypothèses de travail, visible dans tous les modes ──
function Hypotheses({ v, xpt, sigmaPt, consensus }) {
  const u = v && v.length ? uConsensus(v) : NaN;
  const ligne = (ok, t) => <li style={{ marginBottom: 4 }}>{ok == null ? '•' : ok ? '✅' : '⚠️'} {t}</li>;
  return (
    <ul style={{ margin: 0, paddingLeft: 4, listStyle: 'none', fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      {ligne(null, <><strong>Échantillon homogène et stable</strong> : tous les laboratoires mesurent la même chose (l'organisateur le vérifie avant l'envoi).</>)}
      {ligne(null, <><strong>Loi normale</strong> : les résultats des laboratoires compétents se répartissent selon une loi normale autour de la valeur vraie.
        C'est ce qui donne leur sens aux seuils : un labo compétent n'a que 4,6 % de chances de dépasser |z| = 2, et 0,27 % de dépasser |z| = 3.</>)}
      {ligne(consensus && isFinite(u) ? u <= 0.3 * sigmaPt : null, <><strong>Valeur assignée bien connue</strong> : u(x<sub>pt</sub>) ≤ 0,3 σ<sub>pt</sub>
        {consensus && isFinite(u) ? <> (ici, u(x<sub>pt</sub>) = {fmt(u, 2)} et 0,3 σ<sub>pt</sub> = {fmt(0.3 * sigmaPt, 2)})</> : ''}. Sinon, on utilise
        z′ = (x − x<sub>pt</sub>) / √(σ<sub>pt</sub>² + u²(x<sub>pt</sub>)).</>)}
      {ligne(null, <><strong>σ<sub>pt</sub> fixé à l'avance</strong> par l'organisateur, selon l'exigence de la méthode, et non d'après la dispersion observée.</>)}
      {ligne(consensus && v ? v.length >= 12 : null, <><strong>Assez de participants</strong> pour une valeur de consensus (au moins une douzaine), calculée avec une statistique robuste
        comme la médiane{consensus && v ? <> (ici, {v.length} laboratoires)</> : ''}.</>)}
    </ul>
  );
}

// ════════════════ SIMULATION ════════════════
export function SimulationAptitude() {
  const [mode, setMode] = useState('guide');
  const [onglet, setOnglet] = useState('simuler');
  const [guide, setGuide] = useEtatPersistant('aptitude-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [graine] = useEtatPersistant('aptitude-graine-v1', Math.floor(Math.random() * 1e6));
  const [ouverts, setOuverts] = useState({ hypo: true, stats: true, reglages: true });
  const [arrives, setArrives] = useState(0), [enArrivee, setEnArrivee] = useState(false);
  const [vue, setVue] = useState('resultats');
  const [classes, setClasses] = useState({}), [classesVerif, setClassesVerif] = useState(false);
  // Exploration : campagne simulée
  const [p, setP] = useState(15), [sigmaPtExp, setSigmaPtExp] = useState(1.2), [dispersion, setDispersion] = useState(0.8),
    [refMode, setRefMode] = useState('consensus'), [biais, setBiais] = useState(true), [deux, setDeux] = useState(false), [tirage, setTirage] = useState(1);
  // Exploration : mes résultats
  const [texte, setTexte] = useEtatPersistant('aptitude-texte', '24,3 ; 23,8 ; 24,6 ; 25,1 ; 23,2 ; 24,0 ; 28,9 ; 24,4 ; 23,6 ; 24,9 ; 22,1 ; 24,2');
  const [xptSaisi, setXptSaisi] = useEtatPersistant('aptitude-xpt', ''), [sigmaSaisi, setSigmaSaisi] = useEtatPersistant('aptitude-sigma', '1,2');
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;

  // ── La campagne affichée ──
  const G = useMemo(() => campagneParcours(graine), [graine]);
  const vExp = useMemo(() => tirerCampagne(graine * 7 + tirage, { p, s: dispersion, biais, deuxMethodes: deux }), [graine, tirage, p, dispersion, biais, deux]);
  const v = enGuide ? G.v : vExp;
  const sigmaPt = enGuide ? CAMPAGNE.sigmaPt : sigmaPtExp;
  const consensus = enGuide || refMode === 'consensus';
  const xpt = consensus ? mediane(v) : CAMPAGNE.vraie;
  const z = v.map(x => (x - xpt) / sigmaPt);
  const visibles = v.slice(0, arrives);
  const tous = arrives >= v.length;

  useEffect(() => {
    if (!enArrivee) return;
    if (arrives >= v.length) { setEnArrivee(false); return; }
    const id = setTimeout(() => setArrives(a => a + 1), 250);
    return () => clearTimeout(id);
  }, [enArrivee, arrives, v.length]);
  useEffect(() => { setArrives(0); setEnArrivee(mode === 'explore'); setClasses({}); setClassesVerif(false); }, [mode, p, dispersion, biais, deux, tirage]);

  // ── Le parcours : valeurs de référence ──
  const xptG = mediane(G.v), sEtoile = ecartRobuste(G.v), uG = uConsensus(G.v);
  const zG = G.v.map(x => (x - xptG) / CAMPAGNE.sigmaPt);
  const iDisc = zG.findIndex(zz => categorie(zz).cle === 'disc');
  const classesOk = zG.every((zz, i) => classes[i] === categorie(zz).cle);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const ETAPES = [
    { id: 'principe', titre: 'Un essai d’aptitude', focus: [],
      texte: <>Un organisateur envoie le <strong>même échantillon</strong> d'eau à 15 laboratoires, qui dosent les ions nitrate NO₃⁻ avec leur méthode
        habituelle. Chaque laboratoire est ensuite évalué : son résultat est-il assez proche de la bonne valeur ? C'est un <strong>essai d'aptitude</strong>
        (norme ISO 13528). En entreprise, le passer régulièrement fait partie de l'accréditation d'un laboratoire.</>, tache: null },
    { id: 'difference', titre: 'Évaluer qui, ou quoi ?', focus: [],
      texte: <>La simulation « Étude inter-laboratoires » (ISO 5725) compare aussi plusieurs laboratoires, mais dans un autre but.</>,
      tache: { type: 'qcm', q: 'Que cherche-t-on à évaluer dans un essai d’aptitude ?', options: ['La compétence de chaque laboratoire', 'La fidélité (répétabilité et reproductibilité) de la méthode', 'La pureté de l’échantillon'], bonne: 0,
        expl: 'Dans une étude de fidélité, on évalue la méthode ; dans un essai d’aptitude, on suppose la méthode connue et on évalue les laboratoires.' } },
    { id: 'arrivee', titre: 'Les résultats arrivent', focus: [],
      texte: <>Cliquez sur « Recevoir les résultats » sous le graphique.</>,
      tache: { type: 'action', ok: tous, consigne: tous ? null : `Résultats reçus : ${arrives} / ${v.length}` } },
    { id: 'hypotheses', titre: 'Les hypothèses de travail', focus: ['hypo'],
      texte: <>Avant tout calcul, il faut savoir sur quelles hypothèses repose l'évaluation. Lisez l'encadré « Hypothèses de travail » sous le graphique :
        toute la suite en dépend.</>,
      tache: { type: 'qcm', q: 'D’où viennent les seuils |z| = 2 et |z| = 3 ?',
        options: ['De la loi normale : un laboratoire compétent a environ 95 % de chances d’avoir |z| ≤ 2, et 99,7 % d’avoir |z| ≤ 3', 'Ce sont des valeurs choisies au hasard', 'Du nombre de laboratoires'], bonne: 0,
        expl: 'Si les résultats ne suivaient pas une loi normale, ces pourcentages seraient faux, et les seuils perdraient leur justification.' } },
    { id: 'xpt', titre: 'La valeur assignée x_pt', focus: [],
      texte: <>Il faut une valeur de référence : la <strong>valeur assignée</strong> x<sub>pt</sub>. Elle peut venir d'un matériau de référence certifié, ou
        des résultats des participants eux-mêmes (une <strong>valeur de consensus</strong>). Ici, on prend la médiane des résultats.</>,
      tache: { type: 'qcm', q: 'Pourquoi la médiane plutôt que la moyenne ?', options: ['Elle est robuste : une valeur aberrante la déplace très peu', 'Elle est plus facile à calculer', 'Elle est toujours égale à la valeur vraie'], bonne: 0 } },
    { id: 'mediane', titre: 'Calculer x_pt', focus: [],
      texte: <>Les 15 résultats (en mg/L) : {G.v.map(x => fmt(x, 1)).join(' ; ')}.</>,
      tache: { type: 'num', q: 'Valeur assignée x_pt (médiane)', unite: 'mg/L', vrai: xptG, tol: 0.001, affiche: x => fmt(x, 1),
        pieges: [[G.v.reduce((a, b) => a + b, 0) / G.v.length, 'C’est la moyenne : rangez les valeurs dans l’ordre et prenez celle du milieu.']] } },
    { id: 'uxpt', titre: 'Cette valeur est-elle assez sûre ?', focus: ['hypo'],
      texte: <>Une valeur de consensus a elle-même une incertitude. La norme donne u(x<sub>pt</sub>) = 1,25 × s* / √p, où s* est un écart-type robuste des
        résultats (ici s* = {fmt(sEtoile, 2)} mg/L) et p le nombre de laboratoires.</>,
      tache: { type: 'num', q: 'Incertitude-type u(x_pt)', unite: 'mg/L', vrai: uG, tol: 0.03, affiche: x => fmt(x, 2),
        pieges: [[sEtoile / Math.sqrt(G.v.length), 'N’oubliez pas le facteur 1,25.'], [1.25 * sEtoile, 'Divisez par √p.']] } },
    { id: 'negligeable', titre: 'L’hypothèse est-elle vérifiée ?', focus: ['hypo'],
      texte: <>L'organisateur a fixé σ<sub>pt</sub> = 1,2 mg/L. L'hypothèse demande u(x<sub>pt</sub>) ≤ 0,3 σ<sub>pt</sub> = 0,36 mg/L.</>,
      tache: { type: 'qcm', q: 'Peut-on utiliser le z-score « simple » ?', options: ['Oui : u(x_pt) est assez petite devant σ_pt', 'Non : il faut utiliser z′'], bonne: uG <= 0.36 ? 0 : 1,
        expl: 'Avec trop peu de participants, ou des résultats très dispersés, u(x_pt) serait trop grande : on devrait alors prendre z′, qui en tient compte.' } },
    { id: 'sigma', titre: 'L’écart-type σ_pt', focus: [],
      texte: <>σ<sub>pt</sub> est l'<strong>écart-type pour l'évaluation de l'aptitude</strong>.</>,
      tache: { type: 'qcm', q: 'Comment est choisi σ_pt ?', options: ['À l’avance, par l’organisateur, selon la précision qu’on attend de la méthode', 'C’est l’écart-type des résultats des participants', 'Chaque laboratoire choisit le sien'], bonne: 0,
        expl: 'Si l’on prenait l’écart-type des participants, une campagne où tout le monde travaille mal paraîtrait normale.' } },
    { id: 'z', titre: 'Le z-score d’un laboratoire', focus: [],
      texte: <>On calcule z = (x − x<sub>pt</sub>) / σ<sub>pt</sub>. Le laboratoire {iDisc + 1} (en jaune) a trouvé {fmt(G.v[iDisc], 1)} mg/L.</>,
      tache: { type: 'num', q: `z-score du laboratoire ${iDisc + 1}`, unite: '', vrai: zG[iDisc], tol: 0.02, affiche: x => fmt(x, 2),
        pieges: [[-zG[iDisc], 'Attention au signe : c’est x − x_pt.'], [(G.v[iDisc] - xptG) / sEtoile, 'Divisez par σ_pt (fixé par l’organisateur), et non par l’écart-type des résultats.']] } },
    { id: 'classer', titre: 'Classer tous les laboratoires', focus: [],
      texte: <>Passez à la vue « z-scores », puis classez chaque laboratoire dans le tableau sous le graphique : |z| ≤ 2 satisfaisant ; 2 &lt; |z| &lt; 3
        discutable ; |z| ≥ 3 non satisfaisant.</>,
      tache: { type: 'action', ok: classesVerif && classesOk, consigne: classesVerif && classesOk ? null : 'Classez les 15 laboratoires, puis vérifiez.' } },
    { id: 'signaux', titre: 'Et ensuite ?', focus: [],
      texte: <>Un résultat discutable donne un <strong>signal d'avertissement</strong> ; un résultat non satisfaisant, un <strong>signal d'action</strong>.</>,
      tache: { type: 'qcm', q: 'Que doit faire le laboratoire non satisfaisant ?', options: ['Chercher la cause (étalonnage, calcul, méthode…) et mettre en place une action corrective', 'Rien, ce n’est qu’un essai', 'Recommencer la mesure jusqu’à obtenir un bon z-score'], bonne: 0,
        expl: 'Un seul résultat discutable n’est pas grave en soi (un labo compétent a environ 4,6 % de chances d’en avoir un) ; deux d’affilée, ou un non satisfaisant, demandent d’agir.' } },
    { id: 'signe', titre: 'Le signe du z-score', focus: [],
      texte: <>Le z-score a un signe.</>,
      tache: { type: 'qcm', q: 'Que signifie un z-score négatif ?', options: ['Le laboratoire trouve moins que la valeur assignée : il sous-estime', 'Le laboratoire est meilleur que les autres', 'Le résultat est faux'], bonne: 0 } },
    { id: 'suivi', titre: 'Le suivi dans le temps', focus: ['suivi'],
      texte: <>Le graphique sous les statistiques montre les z-scores d'un même laboratoire sur six campagnes successives.</>,
      tache: { type: 'qcm', q: 'Que conclure ?', options: ['Il reste satisfaisant, mais il dérive : une erreur systématique s’installe, à corriger avant qu’elle ne devienne un problème', 'Tout va bien, il est toujours satisfaisant', 'Il est non satisfaisant'], bonne: 0,
        expl: 'Sous l’hypothèse de la loi normale, six z-scores positifs et croissants d’affilée ont très peu de chances d’arriver par hasard : c’est le signe d’un biais.' } },
    { id: 'limites', titre: 'Quand les hypothèses tombent', focus: ['hypo'],
      texte: <>Imaginez qu'un tiers des laboratoires utilise une autre méthode, qui surestime systématiquement : les résultats forment alors deux groupes.
        (Vous pourrez le simuler en exploration libre.)</>,
      tache: { type: 'qcm', q: 'Que deviennent les z-scores ?', options: ['Ils perdent leur sens : il n’y a plus une seule loi normale, et la valeur de consensus ne représente aucun des deux groupes', 'Ils restent valables', 'Ils deviennent plus précis'], bonne: 0,
        expl: 'Avant de calculer des z-scores, il faut regarder la distribution des résultats. Si elle a deux bosses, ou une forte dissymétrie, on traite les méthodes séparément.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez évaluer un laboratoire dans un essai d'aptitude, et surtout dans quelles conditions ce calcul a un sens. En exploration libre,
        simulez d'autres campagnes (avec un laboratoire biaisé, ou deux méthodes), ou traitez les résultats de vos collègues. Le défi vous propose une
        campagne à évaluer seul.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const vu = id => !enGuide || etape >= idx(id);
  useEffect(() => { if (enGuide && etape > idx('arrivee') && arrives < v.length) setArrives(v.length); }, [etape, enGuide]);
  const montrerLoi = !enGuide || etape >= idx('mediane') + 1;
  const montrerZ = !enGuide || etape > idx('z');

  // ════════════════ BLOCS ════════════════
  const vueEffective = enGuide && !montrerZ ? 'resultats' : vue;
  const graphique = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt }}>Dosage des {CAMPAGNE.mesurande} : résultats des laboratoires</div>
        {montrerZ && <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setVue('resultats')} style={stylePetitBouton(vueEffective === 'resultats', '#334155')}>Résultats</button>
          <button onClick={() => setVue('z')} style={stylePetitBouton(vueEffective === 'z', '#334155')}>z-scores</button>
        </div>}
      </div>
      {visibles.length === 0 ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: KIT.txt2, fontSize: 14, background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>En attente des résultats…</div>
        : vueEffective === 'z' ? <VueZ z={z} surligne={enGuide ? iDisc : -1}/>
          : <VueResultats v={visibles} xpt={xpt} sigmaPt={sigmaPt} unite={CAMPAGNE.unite} montrerLoi={montrerLoi && tous} surligne={enGuide && etape >= idx('z') ? iDisc : -1}/>}
      {!tous && <div style={{ marginTop: 8 }}><button onClick={() => setEnArrivee(true)} disabled={enArrivee} style={{ ...styleBouton(!enArrivee, '#16a34a'), opacity: enArrivee ? 0.6 : 1 }}>{enArrivee ? 'Réception…' : '▶ Recevoir les résultats'}</button></div>}
      {montrerLoi && tous && vueEffective === 'resultats' && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
        Courbe violette : la loi normale N(x<sub>pt</sub>, σ<sub>pt</sub>) attendue pour des laboratoires compétents. Zone verte : |z| ≤ 2 ; zone jaune : 2 &lt; |z| &lt; 3.
        Comparez la répartition des points à cette courbe : c'est une première vérification de l'hypothèse de normalité.</div>}
    </div>
  );
  const stats = (
    <>
      <LigneMesure nom="Nombre de laboratoires p" valeur={`${v.length}`}/>
      <LigneMesure nom={consensus ? 'Valeur assignée x_pt (médiane)' : 'Valeur assignée x_pt (référence)'} valeur={vu('negligeable') ? `${fmt(xpt, 2)} mg/L` : '?'} couleur="#dc2626"/>
      <LigneMesure nom="Écart-type pour l'aptitude σ_pt" valeur={`${fmt(sigmaPt, 2)} mg/L`}/>
      {consensus && <LigneMesure nom="Incertitude u(x_pt) = 1,25 s* / √p" valeur={vu('negligeable') ? `${fmt(uConsensus(v), 2)} mg/L` : '?'}/>}
      {vu('suivi') && <div style={{ marginTop: 10 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Suivi d'un laboratoire : z-score sur six campagnes successives</div><VueSuivi/></div>}
    </>
  );
  const tableClassement = (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
        <thead><tr><th style={cellule}>Labo</th><th style={cellule}>Résultat (mg/L)</th><th style={cellule}>z</th><th style={cellule}>Classement</th></tr></thead>
        <tbody>
          {v.map((x, i) => {
            const c = categorie(z[i]), choisi = classes[i], juste = choisi === c.cle;
            return (
              <tr key={i}>
                <td style={cellule}>{i + 1}</td><td style={cellule}>{fmt(x, 1)}</td><td style={cellule}>{montrerZ ? fmt(z[i], 2) : '?'}</td>
                <td style={cellule}>{enGuide && etape === idx('classer') ? (
                  <select value={choisi || ''} aria-label={`Classement du laboratoire ${i + 1}`} onChange={e => { const val = e.target.value; setClasses(cl => ({ ...cl, [i]: val })); setClassesVerif(false); }}
                    style={{ fontSize: 13.5, padding: '2px 4px', borderRadius: 5, border: `1.5px solid ${classesVerif ? (juste ? '#16a34a' : '#dc2626') : KIT.bord}` }}>
                    <option value="">?</option><option value="sat">satisfaisant</option><option value="disc">discutable</option><option value="nonsat">non satisfaisant</option>
                  </select>
                ) : montrerZ ? <span style={{ background: c.bg, color: c.color, fontWeight: 700, padding: '1px 8px', borderRadius: 10, fontSize: 12.5 }}>{c.label}</span> : '?'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {enGuide && etape === idx('classer') && <div style={{ marginTop: 6 }}>
        <button onClick={() => setClassesVerif(true)} style={stylePetitBouton(true, '#16a34a')}>Vérifier le classement</button>
        {classesVerif && <span style={{ marginLeft: 8 }}>{classesOk ? '✅ Classement juste' : '❌ Au moins un laboratoire est mal classé'}</span>}
      </div>}
    </div>
  );
  const reglages = (
    <>
      <Curseur nom="Nombre de laboratoires p" valeur={p} onChange={setP} min={5} max={40} pas={1} couleur="#0f766e"/>
      <Curseur nom="Dispersion des laboratoires compétents" valeur={dispersion} onChange={setDispersion} min={0.2} max={2} pas={0.1} unite="mg/L" decimales={1} couleur="#0f766e"/>
      <Curseur nom="σ_pt fixé par l'organisateur" valeur={sigmaPtExp} onChange={setSigmaPtExp} min={0.4} max={2.5} pas={0.1} unite="mg/L" decimales={1} couleur="#0f766e"/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, margin: '4px 0' }}>Valeur assignée</div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
        <button onClick={() => setRefMode('consensus')} style={stylePetitBouton(refMode === 'consensus', '#0f766e')}>consensus (médiane)</button>
        <button onClick={() => setRefMode('reference')} style={stylePetitBouton(refMode === 'reference', '#0f766e')}>matériau de référence (24,0 mg/L)</button>
      </div>
      <label style={{ display: 'flex', gap: 6, fontSize: 14, color: KIT.txt, marginBottom: 4 }}><input type="checkbox" checked={biais} onChange={e => setBiais(e.target.checked)}/> Un laboratoire a un gros biais</label>
      <label style={{ display: 'flex', gap: 6, fontSize: 14, color: KIT.txt, marginBottom: 8 }}><input type="checkbox" checked={deux} onChange={e => setDeux(e.target.checked)}/> Un tiers des laboratoires utilise une autre méthode (hypothèse de normalité non vérifiée)</label>
      <button onClick={() => setTirage(t => t + 1)} style={styleBouton(false)}>🎲 Une autre campagne</button>
    </>
  );
  // ── Exploration : mes résultats ──
  const valeursC = texte.split(/[;\s\n\t]+/).map(lireNombre).filter(x => isFinite(x));
  const xptC = xptSaisi.trim() ? lireNombre(xptSaisi) : (valeursC.length ? mediane(valeursC) : NaN), sigC = lireNombre(sigmaSaisi);
  const zC = valeursC.map(x => (x - xptC) / sigC);
  const mesResultats = (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div style={styleBoite}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Mes résultats</div>
        <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={3} aria-label="Résultats des laboratoires"
          style={{ width: '100%', boxSizing: 'border-box', fontSize: 14, padding: 6, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/>
        <div style={{ fontSize: 12.5, color: KIT.txt2, margin: '4px 0 8px' }}>Un résultat par laboratoire (ou par apprenti), séparés par des espaces ou des points-virgules.</div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: KIT.txt, marginBottom: 6 }}>x<sub>pt</sub> :
          <input value={xptSaisi} placeholder={`médiane : ${fmt(mediane(valeursC.length ? valeursC : [0]), 2)}`} onChange={e => setXptSaisi(e.target.value)} aria-label="Valeur assignée" style={{ width: 150, fontSize: 14, padding: '3px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/></label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: KIT.txt, marginBottom: 8 }}>σ<sub>pt</sub> :
          <input value={sigmaSaisi} onChange={e => setSigmaSaisi(e.target.value)} aria-label="Écart-type pour l'aptitude" style={{ width: 90, fontSize: 14, padding: '3px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/></label>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 8 }}>Laissez x<sub>pt</sub> vide pour utiliser la médiane des résultats (valeur de consensus).</div>
        <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
          <thead><tr><th style={cellule}>Labo</th><th style={cellule}>Résultat</th><th style={cellule}>z</th><th style={cellule}>Classement</th></tr></thead>
          <tbody>{valeursC.map((x, i) => { const c = categorie(zC[i]); return (
            <tr key={i}><td style={cellule}>{i + 1}</td><td style={cellule}>{fmt(x, 2)}</td><td style={cellule}>{isFinite(zC[i]) ? fmt(zC[i], 2) : '—'}</td>
              <td style={cellule}>{isFinite(zC[i]) && <span style={{ background: c.bg, color: c.color, fontWeight: 700, padding: '1px 8px', borderRadius: 10, fontSize: 12.5 }}>{c.label}</span>}</td></tr>); })}</tbody>
        </table>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={styleBoite}>{valeursC.length > 0 && isFinite(xptC) && sigC > 0 && <VueResultats v={valeursC} xpt={xptC} sigmaPt={sigC} unite="unité" montrerLoi dec={2}/>}</div>
        <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>
          <Hypotheses v={valeursC} xpt={xptC} sigmaPt={sigC} consensus={!xptSaisi.trim()}/></div>
      </div>
    </div>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const g = Math.floor(Math.random() * 1e6), pp = 11 + Math.floor(Math.random() * 6);
    const vv = tirerCampagne(g, { p: pp, s: 0.7 + Math.random() * 0.4, biais: true });
    const choix = []; while (choix.length < 3) { const i = Math.floor(Math.random() * pp); if (!choix.includes(i)) choix.push(i); }
    setDefi({ v: vv, sigma: [1.0, 1.2, 1.5][Math.floor(Math.random() * 3)], choix, reps: {}, verifie: false });
  }
  const voletDefi = defi && (() => {
    const x0 = mediane(defi.v), zz = defi.v.map(x => (x - x0) / defi.sigma);
    const action = zz.map((t, i) => (Math.abs(t) >= 3 ? i + 1 : null)).filter(Boolean);
    const Q = [{ id: 'x', q: 'Valeur assignée x_pt (médiane des résultats)', vrai: x0, tol: 0.001, aff: fmt(x0, 2) },
      ...defi.choix.map(i => ({ id: `z${i}`, q: `z-score du laboratoire ${i + 1}`, vrai: zz[i], tol: 0.03, aff: fmt(zz[i], 2) })),
      { id: 'a', q: 'Laboratoire(s) devant agir (numéros séparés par des virgules, ou « aucun »)', texte: true, vrai: action, aff: action.length ? action.join(', ') : 'aucun' }];
    const okTexte = rep => { const t = (rep || '').trim().toLowerCase(); if (!action.length) return t === 'aucun'; const n = t.split(/[,;\s]+/).map(x => parseInt(x, 10)).filter(x => !isNaN(x)).sort((a, b) => a - b); return JSON.stringify(n) === JSON.stringify(action); };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          Une campagne de dosage des ions nitrate : {defi.v.length} laboratoires, σ<sub>pt</sub> = {fmt(defi.sigma, 1)} mg/L fixé par l'organisateur. Résultats (mg/L), dans l'ordre des laboratoires :
          <div style={{ fontFamily: 'monospace', fontSize: 14, margin: '6px 0', background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 6, padding: '6px 8px' }}>{defi.v.map(x => fmt(x, 1)).join(' ; ')}</div>
        </div>
        {Q.map((q, k) => {
          const rep = defi.reps[q.id] || '';
          const ok = q.texte ? okTexte(rep) : proche(lireNombre(rep), q.vrai, q.tol);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const val = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: val } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: q.texte ? 160 : 110 }}/>
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
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Avant de conclure, vérifiez les hypothèses : la répartition des résultats ressemble-t-elle à une loi normale ? Y a-t-il assez de laboratoires ?</div>
      </div>
    );
  })();

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi' && !defi) nouveauDefi(); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  const encadreHypo = (
    <div style={{ ...styleBoite, position: 'relative' }} data-apparait={`${idx('hypotheses')}`}>
      <Section titre="Hypothèses de travail" ouvert={ouverts.hypo} onBascule={() => setOuverts(o => ({ ...o, hypo: !o.hypo }))}>
        <Hypotheses v={v} xpt={xpt} sigmaPt={sigmaPt} consensus={consensus && vu('negligeable')}/>
      </Section>
      {enGuide && et.focus.includes('hypo') && <div style={{ position: 'absolute', inset: -3, border: `3px dashed ${ORANGE_GUIDE}`, borderRadius: 12, pointerEvents: 'none' }}/>}
    </div>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ap-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ap-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .ap-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Essais d'aptitude : le z-score</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      {mode === 'explore' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['simuler', '🎲 Simuler une campagne'], ['mes', '📊 Mes résultats']].map(([k, n]) => <button key={k} onClick={() => setOnglet(k)} style={stylePetitBouton(onglet === k, '#0f766e')}>{n}</button>)}
        </div>
      )}
      {mode === 'explore' && onglet === 'mes' && mesResultats}
      {enDefi && <div className="ap-l1"><div style={styleBoite}>{voletDefi}</div><div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div><Hypotheses/></div></div>}
      {(enGuide || (mode === 'explore' && onglet === 'simuler')) && <>
        <div className="ap-l1">
          {graphique}
          {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
            : <div style={styleBoite}><Section titre="La campagne simulée" ouvert={ouverts.reglages} onBascule={() => setOuverts(o => ({ ...o, reglages: !o.reglages }))}>{reglages}</Section></div>}
        </div>
        <div className="ap-l2">
          {vu('hypotheses') && encadreHypo}
          <div><Section titre="Statistiques de la campagne" ouvert={ouverts.stats} onBascule={() => setOuverts(o => ({ ...o, stats: !o.stats }))}>{stats}</Section></div>
          {tous && <div style={{ ...styleBoite, gridColumn: '1 / -1' }} data-apparait={`${idx('classer')}`}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Les laboratoires</div>
            {tableClassement}
          </div>}
        </div>
      </>}
    </div>
  );
}

const cellule = { padding: '4px 6px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 13.5 };
