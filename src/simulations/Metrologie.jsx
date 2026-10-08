import { useState, useEffect, useMemo } from "react";
import { cardStyle, fmt, lireNombre, proche, CarteParcours, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, Curseur, ORANGE_GUIDE, avecIndices } from "../commun";

// ====================================================
// MESURE ET INCERTITUDES (1re spé PC)
// Pourquoi des groupes qui font la même mesure ne trouvent-ils pas la même valeur ?
// Dispersion, moyenne, écart-type, incertitude-type u = s / √N, valeur aberrante, écriture du résultat,
// comparaison à une valeur de référence (z-score), erreur aléatoire et erreur systématique.
// ====================================================

// Générateur pseudo-aléatoire reproductible
function rng(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// ── Statistiques ──
export const moyenne = v => v.reduce((a, b) => a + b, 0) / v.length;
export const ecartType = v => { if (v.length < 2) return NaN; const m = moyenne(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)); };
const ecartTypePop = v => { const m = moyenne(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length); };
// Arrondi par excès à un chiffre significatif
export const arrondiExces1CS = x => { if (!(x > 0)) return x; const p = Math.pow(10, Math.floor(Math.log10(x))); return Math.ceil(x / p - 1e-9) * p; };
const decimalesDe = u => Math.max(0, -Math.floor(Math.log10(u)));      // nombre de décimales fixé par l'incertitude

// ── Les deux mesures proposées ──
const SCENARIOS = {
  vm: { nom: 'Volume molaire du dihydrogène', court: 'V_m', unite: 'L/mol', ref: 24.1, refTxt: '24,1 L/mol (gaz sec, 20 °C, 1013 hPa)',
    moyenneVraie: 24.6, sd: 0.55, biaisTxt: 'la vapeur d’eau mélangée au dihydrogène (environ + 2 %)', dec: 1,
    aberrante: { val: [15.5, 18.5], cause: 'une fuite au niveau du bouchon' }, largeurs: [0.5, 1, 2] },
  lugol: { nom: 'Volume équivalent du titrage du Lugol', court: 'V_B,e', unite: 'mL', ref: 15.76, refTxt: '15,76 mL (Lugol à 1,00 g pour 100 mL)',
    moyenneVraie: 15.76, sd: 0.12, biaisTxt: null, dec: 2,
    aberrante: { val: [17.0, 17.6], cause: 'une bulle d’air dans la burette' }, largeurs: [0.05, 0.1, 0.2] },
};
// Résultats de N groupes : dispersion aléatoire, un éventuel biais systématique, et une éventuelle valeur aberrante
function tirerResultats(graine, sc, N, { sd = sc.sd, biais = sc.moyenneVraie - sc.ref, avecAberrante = true } = {}) {
  const r = rng(graine);
  const p = Math.pow(10, sc.dec);
  const v = [];
  for (let k = 0; k < N; k++) v.push(Math.round((sc.ref + biais + sd * gauss(r)) * p) / p);
  let iAb = -1;
  if (avecAberrante && N >= 4) {
    iAb = Math.floor(r() * N);
    v[iAb] = Math.round((sc.aberrante.val[0] + r() * (sc.aberrante.val[1] - sc.aberrante.val[0])) * p) / p;
  }
  return { v, iAb };
}
// Pour le parcours : une série où la référence est clairement hors de l'intervalle (le biais de la vapeur d'eau se voit)
function serieParcours(graine) {
  for (let g = graine; g < graine + 400; g++) {
    const t = tirerResultats(g, SCENARIOS.vm, 12);
    const ret = t.v.filter((_, i) => i !== t.iAb);
    const u = arrondiExces1CS(ecartType(ret) / Math.sqrt(ret.length));
    const z = Math.abs(moyenne(ret) - SCENARIOS.vm.ref) / u;
    if (z > 2.4 && z < 5) return { ...t, graine: g };
  }
  return { ...tirerResultats(graine, SCENARIOS.vm, 12), graine };
}

const COUL = { hist: '#60a5fa', moy: '#dc2626', ec: '#2563eb' };

// ════════════════ HISTOGRAMME ════════════════
function Histogramme({ valeurs, largeur, exclues = [], titre = 'Volume molaire (L/mol)', sansStats = false }) {
  const ret = valeurs.filter((_, i) => !exclues.includes(i));
  if (!valeurs.length) return <div style={{ fontSize: 14, color: KIT.txt2 }}>Aucune valeur.</div>;
  const mn = Math.floor(Math.min(...valeurs) / largeur) * largeur, mx = Math.ceil((Math.max(...valeurs) + 1e-9) / largeur) * largeur;
  const nb = Math.max(1, Math.round((mx - mn) / largeur));
  const comptes = Array.from({ length: nb }, () => ({ ret: 0, exc: 0 }));
  valeurs.forEach((v, i) => { const k = Math.min(nb - 1, Math.floor((v - mn) / largeur + 1e-9)); comptes[k][exclues.includes(i) ? 'exc' : 'ret']++; });
  const cMax = Math.max(1, ...comptes.map(c => c.ret + c.exc));
  const W = 520, H = 260, g = 44, d = 12, h = 30, b = 44;
  const X = v => g + (v - mn) / (mx - mn) * (W - g - d);
  const Y = n => H - b - n / cMax * (H - b - h);
  const m = ret.length ? moyenne(ret) : NaN, s = ecartType(ret);
  const pasX = (mx - mn) / largeur > 14 ? largeur * Math.ceil((mx - mn) / largeur / 14) : largeur;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Histogramme des résultats"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {Array.from({ length: cMax + 1 }, (_, n) => (
        <g key={n}><line x1={g} y1={Y(n)} x2={W - d} y2={Y(n)} stroke="#e2e8f0"/>
          <text x={g - 6} y={Y(n) + 4} fontSize="13" fill={KIT.txt2} textAnchor="end">{n}</text></g>
      ))}
      {comptes.map((c, k) => (
        <g key={k}>
          {c.ret > 0 && <rect x={X(mn + k * largeur) + 1} y={Y(c.ret)} width={X(mn + largeur) - X(mn) - 2} height={Y(0) - Y(c.ret)} fill={COUL.hist} stroke="#1e3a8a"/>}
          {c.exc > 0 && <rect x={X(mn + k * largeur) + 1} y={Y(c.ret + c.exc)} width={X(mn + largeur) - X(mn) - 2} height={Y(c.ret) - Y(c.ret + c.exc)} fill="#fecaca" stroke="#b91c1c" strokeDasharray="4 3"/>}
        </g>
      ))}
      {Array.from({ length: Math.round((mx - mn) / pasX) + 1 }, (_, k) => mn + k * pasX).map(v => (
        <text key={v} x={X(v)} y={H - b + 18} fontSize="13" fill={KIT.txt2} textAnchor="middle">{fmt(v, largeur < 1 ? 1 : 0)}</text>
      ))}
      <line x1={g} y1={Y(0)} x2={W - d} y2={Y(0)} stroke={KIT.txt}/><line x1={g} y1={h - 6} x2={g} y2={Y(0)} stroke={KIT.txt}/>
      <text x={(g + W - d) / 2} y={H - 6} fontSize="13.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">{titre}</text>
      <text x="13" y={(h + H - b) / 2} fontSize="13" fontWeight="700" fill={KIT.txt} transform={`rotate(-90 13 ${(h + H - b) / 2})`} textAnchor="middle">effectif</text>
      {isFinite(m) && !sansStats && <>
        <line x1={X(m)} y1={h - 8} x2={X(m)} y2={Y(0)} stroke={COUL.moy} strokeWidth="2.5"/>
        <text x={X(m)} y={h - 12} fontSize="13" fontWeight="700" fill={COUL.moy} textAnchor="middle">moyenne</text>
        {isFinite(s) && [m - s, m + s].map((v, k) => v >= mn && v <= mx &&
          <line key={k} x1={X(v)} y1={h} x2={X(v)} y2={Y(0)} stroke={COUL.ec} strokeWidth="2" strokeDasharray="6 4"/>)}
      </>}
    </svg>
  );
}

// ════════════════ LES ÉCARTS À LA MOYENNE ════════════════
function Ecarts({ valeurs, exclues = [], unite, dec }) {
  const ret = valeurs.filter((_, i) => !exclues.includes(i));
  if (ret.length < 1) return null;
  const m = moyenne(ret), s = ecartType(ret);
  const vals = valeurs.map((v, i) => ({ v, i })).filter(o => !exclues.includes(o.i));
  const ext = Math.max(...vals.map(o => Math.abs(o.v - m)), isFinite(s) ? s : 0) * 1.15 || 1;
  const W = 520, H = 40 + vals.length * 18, g = 70, d = 20;
  const X = v => g + (v - (m - ext)) / (2 * ext) * (W - g - d);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Écart de chaque résultat à la moyenne"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {isFinite(s) && <rect x={X(m - s)} y="16" width={X(m + s) - X(m - s)} height={H - 34} fill="#dbeafe" opacity="0.7"/>}
      <line x1={X(m)} y1="10" x2={X(m)} y2={H - 16} stroke="#dc2626" strokeWidth="2.5"/>
      <text x={X(m)} y="10" fontSize="12" fontWeight="700" fill="#dc2626" textAnchor="middle">moyenne {fmt(m, dec + 1)}</text>
      {vals.map((o, k) => {
        const y = 26 + k * 18;
        return (
          <g key={o.i}>
            <text x={g - 8} y={y + 4} fontSize="11.5" fill={KIT.txt2} textAnchor="end">groupe {o.i + 1}</text>
            <line x1={X(m)} y1={y} x2={X(o.v)} y2={y} stroke={o.v >= m ? '#16a34a' : '#ea580c'} strokeWidth="3"/>
            <circle cx={X(o.v)} cy={y} r="4.5" fill="white" stroke={KIT.txt} strokeWidth="1.5"/>
          </g>
        );
      })}
      <text x={(g + W - d) / 2} y={H - 3} fontSize="12" fill={KIT.txt2} textAnchor="middle">bande bleue : moyenne ± écart-type ({unite})</text>
    </svg>
  );
}

// ════════════════ LA CIBLE : ERREUR ALÉATOIRE ET ERREUR SYSTÉMATIQUE ════════════════
function Cibles() {
  const r = rng(7);
  const tirs = (dx, dy, e) => Array.from({ length: 14 }, () => [dx + e * gauss(r), dy + e * gauss(r)]);
  const cas = [['erreur aléatoire seule', tirs(0, 0, 11)], ['aléatoire + systématique', tirs(18, -14, 11)], ['grande erreur aléatoire', tirs(0, 0, 24)]];
  return (
    <svg viewBox="0 0 520 190" role="img" aria-label="Trois cibles : erreur aléatoire, erreur systématique" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {cas.map(([nom, pts], k) => {
        const cx = 90 + k * 170, cy = 88;
        return (
          <g key={k}>
            {[60, 42, 24, 8].map((rr, j) => <circle key={j} cx={cx} cy={cy} r={rr} fill={j % 2 ? '#fee2e2' : 'white'} stroke="#b91c1c" strokeWidth="1"/>)}
            {pts.map(([x, y], j) => <circle key={j} cx={cx + x} cy={cy + y} r="3.2" fill="#1e3a8a"/>)}
            <text x={cx} y="176" fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">{nom}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ════════════════ SIMULATION ════════════════
export function SimulationMetrologie() {
  const [mode, setMode] = useState('explore');   // on arrive sur l'exploration libre
  const [onglet, setOnglet] = useState('classe');
  const [guide, setGuide] = useEtatPersistant('metro-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [graine] = useEtatPersistant('metro-graine-v1', Math.floor(Math.random() * 1e6));
  const [ouverts, setOuverts] = useState({ stats: true, reglages: true });
  // Arrivée des résultats, vue, largeur, exclusion
  const [arrives, setArrives] = useState(0);
  const [enArrivee, setEnArrivee] = useState(false);
  const [vue, setVue] = useState('histo');
  const [largeurK, setLargeurK] = useState(1);
  const [largeursVues, setLargeursVues] = useState({});
  const [exclue, setExclue] = useState(false);
  const [vuesEcarts, setVuesEcarts] = useState(false);
  // Exploration : classe simulée
  const [scId, setScId] = useState('vm'), [N, setN] = useState(12), [sdK, setSdK] = useState(1), [biaisOn, setBiaisOn] = useState(true), [abOn, setAbOn] = useState(true), [tirage, setTirage] = useState(1);
  // Exploration : données de la classe
  const [texte, setTexte] = useEtatPersistant('metro-texte-classe', '24,7 ; 24,5 ; 24,4 ; 24,9 ; 25,1 ; 24,8 ; 23,3 ; 23,7 ; 23,4 ; 16,2');
  const [refClasse, setRefClasse] = useEtatPersistant('metro-ref-classe', '24,1');
  const [exclClasse, setExclClasse] = useState([]);
  const [largeurClasse, setLargeurClasse] = useState(1);
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;

  // ── La série affichée ──
  const serieGuide = useMemo(() => serieParcours(graine), [graine]);
  const sc = enGuide ? SCENARIOS.vm : SCENARIOS[scId];
  const serieExplore = useMemo(() => tirerResultats(graine * 13 + tirage, SCENARIOS[scId], N,
    { sd: SCENARIOS[scId].sd * sdK, biais: biaisOn ? SCENARIOS[scId].moyenneVraie - SCENARIOS[scId].ref : 0, avecAberrante: abOn }), [graine, tirage, scId, N, sdK, biaisOn, abOn]);
  const serie = enGuide ? serieGuide : serieExplore;
  const visibles = serie.v.slice(0, enGuide || mode === 'explore' ? arrives : serie.v.length);
  const exclues = exclue && serie.iAb >= 0 && serie.iAb < visibles.length ? [serie.iAb] : [];
  const ret = visibles.filter((_, i) => !exclues.includes(i));
  const xb = ret.length ? moyenne(ret) : NaN, sx = ecartType(ret), uBrut = sx / Math.sqrt(ret.length), u = arrondiExces1CS(uBrut);
  const z = Math.abs(xb - sc.ref) / u;
  const largeur = sc.largeurs[largeurK];

  // Arrivée des résultats un par un
  useEffect(() => {
    if (!enArrivee) return;
    if (arrives >= serie.v.length) { setEnArrivee(false); return; }
    const id = setTimeout(() => setArrives(a => a + 1), 350);
    return () => clearTimeout(id);
  }, [enArrivee, arrives, serie.v.length]);
  // Une nouvelle série arrive : dans le parcours, l'élève lance la réception ; en exploration, elle arrive d'elle-même
  useEffect(() => { setArrives(0); setExclue(false); setEnArrivee(mode === 'explore'); }, [mode, scId, N, sdK, biaisOn, abOn, tirage]);
  // Dans le parcours, une fois l'étape d'arrivée passée, tous les résultats restent affichés
  const tous = arrives >= serie.v.length;

  // ── Valeurs de référence pour le parcours (série du parcours, sans la valeur aberrante) ──
  const G = serieGuide, retG = G.v.filter((_, i) => i !== G.iAb);
  const xbG = moyenne(retG), sxG = ecartType(retG), uG = arrondiExces1CS(sxG / Math.sqrt(retG.length)), zG = Math.abs(xbG - SCENARIOS.vm.ref) / uG;
  const decU = decimalesDe(uG);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const ETAPES = [
    { id: 'arrivee', titre: 'Douze groupes, une même mesure', focus: [],
      texte: <>Dans une classe, 12 groupes ont mesuré le <strong>volume molaire du dihydrogène</strong>, avec le même protocole : le magnésium
        réagit avec l'acide, et on recueille le gaz dans une éprouvette. Cliquez sur « Recevoir les résultats » sous le graphique, et
        regardez-les arriver.</>,
      tache: { type: 'action', ok: tous, consigne: tous ? null : `Résultats reçus : ${arrives} / ${serie.v.length}` } },
    { id: 'pourquoi', titre: 'Pourquoi ne trouvent-ils pas tous la même valeur ?', focus: [],
      texte: <>Le protocole est le même pour tout le monde.</>,
      tache: { type: 'qcm', q: 'D’où vient la dispersion des résultats ?', options: ['Chaque mesure comporte de petites erreurs, qui varient d’un groupe à l’autre', 'Certains groupes ont triché', 'Le volume molaire change d’un groupe à l’autre'], bonne: 0,
        expl: 'On parle de variabilité de la mesure. Elle est normale : aucune mesure n’est parfaite.' } },
    { id: 'causes', titre: 'Des sources de variabilité', focus: [],
      texte: <>Pensez à tout ce que fait chaque groupe pendant la manip.</>,
      tache: { type: 'qcm', q: 'Laquelle de ces causes peut faire varier le résultat d’un groupe à l’autre ?',
        options: ['La lecture du volume dans l’éprouvette, et le temps mis à reboucher', 'La valeur de la masse molaire du magnésium', 'La couleur du ruban de magnésium'], bonne: 0 } },
    { id: 'histo', titre: 'L’histogramme', focus: [],
      texte: <>Un histogramme compte combien de résultats tombent dans chaque intervalle (l'<strong>effectif</strong>). Essayez au moins deux
        largeurs de barres : la forme change, pas les résultats.</>,
      tache: { type: 'action', ok: Object.keys(largeursVues).length >= 2, consigne: `Largeurs essayées : ${Object.keys(largeursVues).length} / 2` } },
    { id: 'aberrante', titre: 'Une valeur aberrante', focus: [],
      texte: <>Le groupe {G.iAb + 1} trouve {fmt(G.v[G.iAb], 1)} L/mol, très loin des autres. On n'écarte pas une valeur parce qu'elle gêne : il faut une
        <strong> raison</strong>. Ici, ce groupe a signalé {SCENARIOS.vm.aberrante.cause} pendant sa manip.</>,
      tache: { type: 'qcm', q: 'Quand a-t-on le droit d’écarter une valeur ?', options: ['Quand on sait qu’une erreur a été commise pendant cette mesure', 'Dès qu’elle s’éloigne de la moyenne', 'Quand elle nous arrange'], bonne: 0,
        expl: 'Écartez-la avec le bouton « Écarter la valeur aberrante » : les calculs suivants se font sans elle.' } },
    { id: 'moyenne', titre: 'La moyenne', focus: [],
      texte: <>Sans la valeur aberrante, il reste N = {retG.length} résultats (en L/mol) : {retG.map(v => fmt(v, 1)).join(' ; ')}. Utilisez votre
        calculatrice, en mode statistiques.</>,
      tache: { type: 'num', q: 'Moyenne x̄', unite: 'L/mol', vrai: xbG, tol: 0.003, affiche: v => fmt(v, 2),
        pieges: [[moyenne(G.v), 'Vous avez gardé la valeur aberrante.']] } },
    { id: 'ecarts', titre: 'Les écarts à la moyenne', focus: [],
      texte: <>Passez à la vue « Écarts à la moyenne » : chaque trait relie un résultat à la moyenne. L'écart-type est une sorte de
        « moyenne » de ces écarts ; la bande bleue s'étend d'un écart-type de chaque côté.</>,
      tache: { type: 'action', ok: vuesEcarts, consigne: vuesEcarts ? null : 'Affichez la vue « Écarts à la moyenne ».' } },
    { id: 'ecartType', titre: 'L’écart-type expérimental', focus: [],
      texte: <>Sur la calculatrice, l'écart-type expérimental est noté σ<sub>n−1</sub> ou s<sub>x</sub>.</>,
      tache: { type: 'num', q: 'Écart-type expérimental s_x', unite: 'L/mol', vrai: sxG, tol: 0.02, affiche: v => fmt(v, 2),
        pieges: [[ecartTypePop(retG), 'C’est σ_n, qui divise par N : prenez σ_n−1, qui divise par N − 1.'], [ecartType(G.v), 'Vous avez gardé la valeur aberrante.']] } },
    { id: 'u', titre: 'L’incertitude-type', focus: [],
      texte: <>La moyenne est plus fiable qu'un résultat isolé. L'incertitude-type sur la moyenne vaut u = s<sub>x</sub> / √N. On l'arrondit
        <strong> par excès</strong>, avec un seul chiffre significatif.</>,
      tache: { type: 'num', q: 'Incertitude-type u, arrondie par excès à 1 chiffre significatif', unite: 'L/mol', vrai: uG, tol: 0.001, affiche: v => fmt(v, decU),
        pieges: [[sxG / Math.sqrt(retG.length), 'C’est la bonne valeur, mais arrondissez-la par excès à un chiffre significatif.'], [sxG, 'Divisez par √N.'], [sxG / retG.length, 'Divisez par la racine de N, pas par N.']] } },
    { id: 'ecriture', titre: 'Écrire le résultat', focus: [],
      texte: <>Le dernier chiffre de la moyenne doit être à la même position que celui de l'incertitude.</>,
      tache: { type: 'qcm', q: 'Quelle écriture est correcte ?',
        options: [`V_m = (${fmt(xbG, decU)} ± ${fmt(uG, decU)}) L/mol`, `V_m = (${fmt(xbG, decU + 2)} ± ${fmt(uG, decU)}) L/mol`, `V_m = ${fmt(xbG, decU)} L/mol`], bonne: 0,
        expl: 'Garder plus de chiffres que l’incertitude ne le permet n’a pas de sens ; et sans incertitude, on ne sait pas quelle confiance accorder au résultat.' } },
    { id: 'N', titre: 'Et avec plus de mesures ?', focus: [],
      texte: <>Le graphique sous les statistiques montre comment u diminue quand le nombre de mesures N augmente (avec le même écart-type).</>,
      tache: { type: 'qcm', q: 'Avec 4 fois plus de mesures, l’incertitude-type est…', options: ['divisée par 2', 'divisée par 4', 'inchangée'], bonne: 0,
        expl: 'u = s / √N, et √4 = 2. Pour diviser u par 10, il faudrait 100 fois plus de mesures : on ne gagne en précision que lentement.' } },
    { id: 'z', titre: 'Comparer à la valeur de référence', focus: [],
      texte: <>La valeur de référence est {SCENARIOS.vm.refTxt}. On calcule le <strong>z-score</strong> : z = |x̄ − V<sub>ref</sub>| / u.
        Si z ≤ 2, le résultat est compatible avec la référence.</>,
      tache: { type: 'num', q: 'z-score', unite: '', vrai: zG, tol: 0.04, affiche: v => fmt(v, 1),
        pieges: [[Math.abs(xbG - SCENARIOS.vm.ref) / sxG, 'Divisez par u, et non par s_x.']] } },
    { id: 'systematique', titre: 'Erreur aléatoire, erreur systématique', focus: [],
      texte: <>Avec z = {fmt(zG, 1)}, le résultat n'est pas compatible avec la référence. Pourtant, les groupes ont bien travaillé : presque
        tous trouvent un peu trop. Regardez les cibles sous le graphique.</>,
      tache: { type: 'qcm', q: 'D’où vient cet écart ?', options: ['D’une erreur systématique : la vapeur d’eau mélangée au dihydrogène augmente le volume pour tous les groupes', 'D’une erreur aléatoire, qui disparaîtra si l’on fait plus de mesures', 'D’une erreur de calcul'], bonne: 0,
        expl: 'Les erreurs aléatoires se compensent en moyenne ; une erreur systématique décale tous les résultats dans le même sens, et faire plus de mesures ne la corrige pas. Il faut la comprendre et corriger le protocole ou le calcul.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez exploiter une série de mesures : moyenne, écart-type, incertitude-type, écriture du résultat et comparaison à une
        référence. En exploration libre, simulez d'autres classes, ou traitez les vrais résultats de la vôtre. Le défi vous propose de
        nouvelles séries.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const vu = id => !enGuide || etape >= idx(id);
  useEffect(() => { if (enGuide && etape === idx('histo')) setLargeursVues({}); if (enGuide && etape === idx('ecarts')) setVuesEcarts(false); }, [etape, enGuide]);
  // Dans le parcours, après l'étape d'arrivée, tous les résultats sont visibles
  useEffect(() => { if (enGuide && etape > idx('arrivee') && arrives < serie.v.length) setArrives(serie.v.length); }, [etape, enGuide]);
  function choisirLargeur(k) { setLargeurK(k); if (enGuide && etape === idx('histo')) setLargeursVues(l => ({ ...l, [k]: true })); }
  function choisirVue(v) { setVue(v); if (v === 'ecarts' && enGuide && etape === idx('ecarts')) setVuesEcarts(true); }

  // ════════════════ BLOCS D'AFFICHAGE ════════════════
  const graphique = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt }}>{sc.nom} : les résultats des groupes</div>
        {vu('ecarts') && <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => choisirVue('histo')} style={stylePetitBouton(vue === 'histo', '#334155')}>Histogramme</button>
          <button onClick={() => choisirVue('ecarts')} style={stylePetitBouton(vue === 'ecarts', '#334155')}>Écarts à la moyenne</button>
        </div>}
      </div>
      {visibles.length === 0 ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: KIT.txt2, fontSize: 14, background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
        En attente des résultats…</div>
        : vue === 'ecarts' && vu('ecarts') ? <Ecarts valeurs={visibles} exclues={exclues} unite={sc.unite} dec={sc.dec}/>
          : <Histogramme valeurs={visibles} largeur={largeur} exclues={exclues} titre={`${sc.court} (${sc.unite})`} sansStats={enGuide && etape <= idx('moyenne')}/>}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        {(enGuide || mode === 'explore') && !tous && <button onClick={() => setEnArrivee(true)} disabled={enArrivee} style={{ ...styleBouton(!enArrivee, '#16a34a'), opacity: enArrivee ? 0.6 : 1 }}>
          {enArrivee ? 'Réception…' : '▶ Recevoir les résultats'}</button>}
        {(vue === 'histo' || !vu('ecarts')) && vu('histo') && <>
          <span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>Largeur des barres :</span>
          {sc.largeurs.map((w, k) => <button key={k} onClick={() => choisirLargeur(k)} style={stylePetitBouton(largeurK === k, '#334155')}>{fmt(w, w < 0.1 ? 2 : w < 1 ? 1 : 0)} {sc.unite}</button>)}
        </>}
        {vu('aberrante') && serie.iAb >= 0 && tous && <button onClick={() => setExclue(e => !e)} style={stylePetitBouton(exclue, '#b91c1c')}>
          {exclue ? 'Reprendre la valeur aberrante' : 'Écarter la valeur aberrante'}</button>}
      </div>
      {visibles.length > 0 && <div style={{ fontSize: 13, color: KIT.txt, marginTop: 8, lineHeight: 1.6 }}>
        Résultats ({sc.unite}) : {visibles.map((v, i) => <span key={i} style={{ marginRight: 8, textDecoration: exclues.includes(i) ? 'line-through' : 'none', color: exclues.includes(i) ? '#b91c1c' : KIT.txt }}>{fmt(v, sc.dec)}</span>)}
      </div>}
    </div>
  );
  const montreStats = !enGuide || etape > idx('z');                 // dans le parcours, les statistiques n'apparaissent qu'une fois calculées
  const stats = (
    <>
      <LigneMesure nom="Nombre de résultats retenus N" valeur={`${ret.length}`}/>
      <LigneMesure nom="Moyenne x̄" valeur={montreStats || vu('ecarts') ? fmt(xb, sc.dec + 1) : '?'} couleur="#dc2626"/>
      <LigneMesure nom="Écart-type expérimental sₓ" valeur={montreStats || vu('u') ? fmt(sx, sc.dec + 1) : '?'} couleur="#2563eb"/>
      <LigneMesure nom="Incertitude-type u = sₓ / √N" valeur={montreStats || vu('ecriture') ? `${fmt(u, decimalesDe(u))} ${sc.unite}` : '?'}/>
      {(montreStats || vu('N')) && isFinite(u) && <LigneMesure nom="Résultat" valeur={`(${fmt(xb, decimalesDe(u))} ± ${fmt(u, decimalesDe(u))}) ${sc.unite}`} couleur="#15803d"/>}
      {(montreStats || vu('systematique')) && isFinite(z) && <LigneMesure nom={`z-score (référence ${fmt(sc.ref, sc.dec + 1)})`} valeur={`${fmt(z, 1)} : ${z <= 2 ? 'compatible' : 'non compatible'}`} couleur={z <= 2 ? '#15803d' : '#b91c1c'}/>}
    </>
  );
  // u en fonction de N, à écart-type fixé
  const courbeN = isFinite(sx) && (vu('N')) && (() => {
    const W = 520, H = 170, g = 50, d = 14, h = 12, b = 34, Nmax = 48, umax = sx / Math.sqrt(2);
    const X = n => g + (n - 2) / (Nmax - 2) * (W - g - d), Y = uu => H - b - Math.min(1, uu / umax) * (H - b - h);
    const pts = Array.from({ length: 47 }, (_, k) => k + 2).map(n => `${X(n).toFixed(1)},${Y(sx / Math.sqrt(n)).toFixed(1)}`).join(' ');
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Incertitude-type en fonction du nombre de mesures" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}`, marginTop: 8 }}>
        <polyline points={pts} fill="none" stroke="#7c3aed" strokeWidth="2.5"/>
        {[ret.length, ret.length * 4].filter(n => n <= Nmax).map((n, k) => (
          <g key={n}><circle cx={X(n)} cy={Y(sx / Math.sqrt(n))} r="5" fill={k ? '#fde047' : '#7c3aed'} stroke={KIT.txt}/>
            <text x={k ? X(n) - 8 : X(n) + 8} y={Y(sx / Math.sqrt(n)) - 8} fontSize="12" fill={KIT.txt} textAnchor={k ? 'end' : 'start'}>N = {n} : u ≈ {fmt(sx / Math.sqrt(n), sc.dec + 2)}</text></g>
        ))}
        <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/><line x1={g} y1={h} x2={g} y2={H - b} stroke={KIT.txt}/>
        <text x={(g + W - d) / 2} y={H - 6} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">nombre de mesures N</text>
        <text x="14" y={(h + H - b) / 2} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle" transform={`rotate(-90 14 ${(h + H - b) / 2})`}>u</text>
      </svg>
    );
  })();

  // ── Exploration : la classe simulée ──
  const reglages = (
    <>
      <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Mesure</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(SCENARIOS).map(([k, s]) => <button key={k} onClick={() => setScId(k)} style={stylePetitBouton(scId === k, '#0f766e')}>{s.nom}</button>)}
      </div>
      <Curseur nom="Nombre de groupes N" valeur={N} onChange={setN} min={4} max={40} pas={1} couleur="#0f766e"/>
      <Curseur nom="Dispersion (× celle d'une vraie classe)" valeur={sdK} onChange={setSdK} min={0.25} max={3} pas={0.25} decimales={2} couleur="#0f766e"/>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: KIT.txt, marginBottom: 4 }}>
        <input type="checkbox" checked={biaisOn} onChange={e => setBiaisOn(e.target.checked)} disabled={!SCENARIOS[scId].biaisTxt}/>
        Erreur systématique{SCENARIOS[scId].biaisTxt ? ` : ${SCENARIOS[scId].biaisTxt}` : ' (aucune pour cette mesure)'}</label>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: KIT.txt, marginBottom: 8 }}>
        <input type="checkbox" checked={abOn} onChange={e => setAbOn(e.target.checked)}/> Un groupe a un incident ({SCENARIOS[scId].aberrante.cause})</label>
      <button onClick={() => setTirage(t => t + 1)} style={styleBouton(false)}>🎲 Une autre classe</button>
    </>
  );
  // ── Exploration : les résultats de ma classe ──
  const valeursC = texte.split(/[;\s\n\t]+/).map(lireNombre).filter(v => isFinite(v));
  const retC = valeursC.filter((_, i) => !exclClasse.includes(i));
  const xbC = retC.length ? moyenne(retC) : NaN, sxC = ecartType(retC), uC = arrondiExces1CS(sxC / Math.sqrt(retC.length)), refC = lireNombre(refClasse), zC = Math.abs(xbC - refC) / uC;
  const maClasse = (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div style={styleBoite}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Les résultats de ma classe</div>
        <textarea value={texte} onChange={e => { setTexte(e.target.value); setExclClasse([]); }} rows={3} aria-label="Valeurs mesurées"
          style={{ width: '100%', boxSizing: 'border-box', fontSize: 14, padding: 6, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/>
        <div style={{ fontSize: 12.5, color: KIT.txt2, margin: '4px 0 8px' }}>Valeurs séparées par des espaces ou des points-virgules (copier-coller depuis un tableur possible). Touchez une valeur pour l'écarter ou la reprendre.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {valeursC.map((v, i) => <button key={i} onClick={() => setExclClasse(l => (l.includes(i) ? l.filter(k => k !== i) : [...l, i]))}
            style={{ ...stylePetitBouton(!exclClasse.includes(i), '#2563eb'), textDecoration: exclClasse.includes(i) ? 'line-through' : 'none' }}>{fmt(v, 2)}</button>)}
        </div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: KIT.txt, marginBottom: 8 }}>Valeur de référence :
          <input value={refClasse} onChange={e => setRefClasse(e.target.value)} aria-label="Valeur de référence" style={{ width: 90, fontSize: 14, padding: '3px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/></label>
        <div style={{ display: 'flex', gap: 5, marginBottom: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>Largeur des barres :</span>
          {[0.1, 0.5, 1, 2].map(w => <button key={w} onClick={() => setLargeurClasse(w)} style={stylePetitBouton(largeurClasse === w, '#334155')}>{fmt(w, w < 1 ? 1 : 0)}</button>)}
        </div>
        <LigneMesure nom="N retenus" valeur={`${retC.length} sur ${valeursC.length}`}/>
        <LigneMesure nom="Moyenne x̄" valeur={fmt(xbC, 3)} couleur="#dc2626"/>
        <LigneMesure nom="Écart-type sₓ" valeur={fmt(sxC, 3)} couleur="#2563eb"/>
        <LigneMesure nom="u = sₓ / √N (par excès)" valeur={isFinite(uC) ? fmt(uC, decimalesDe(uC)) : '—'}/>
        <LigneMesure nom="Résultat" valeur={isFinite(uC) ? `${fmt(xbC, decimalesDe(uC))} ± ${fmt(uC, decimalesDe(uC))}` : '—'} couleur="#15803d"/>
        {isFinite(zC) && <LigneMesure nom="z-score" valeur={`${fmt(zC, 1)} : ${zC <= 2 ? 'compatible' : 'non compatible'}`} couleur={zC <= 2 ? '#15803d' : '#b91c1c'}/>}
      </div>
      <div style={styleBoite}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Histogramme</div>
        <Histogramme valeurs={valeursC} largeur={largeurClasse} exclues={exclClasse} titre="valeur mesurée"/>
        <div style={{ marginTop: 8 }}><Ecarts valeurs={valeursC} exclues={exclClasse} unite="" dec={2}/></div>
      </div>
    </div>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const k = Math.random() < 0.5 ? 'vm' : 'lugol', s = SCENARIOS[k];
    const g = Math.floor(Math.random() * 1e6), n = 8 + Math.floor(Math.random() * 8);
    const t = tirerResultats(g, s, n, { biais: k === 'vm' && Math.random() < 0.5 ? s.moyenneVraie - s.ref : 0, avecAberrante: false });
    setDefi({ k, v: t.v, reps: {}, verifie: false });
  }
  const voletDefi = defi && (() => {
    const s = SCENARIOS[defi.k], m = moyenne(defi.v), sd = ecartType(defi.v), uu = arrondiExces1CS(sd / Math.sqrt(defi.v.length)), zz = Math.abs(m - s.ref) / uu;
    const Q = [
      { id: 'm', q: 'Moyenne x̄', vrai: m, tol: 0.003, aff: fmt(m, s.dec + 1) },
      { id: 's', q: 'Écart-type expérimental s_x', vrai: sd, tol: 0.03, aff: fmt(sd, s.dec + 1) },
      { id: 'u', q: 'Incertitude-type u (par excès, 1 chiffre significatif)', vrai: uu, tol: 0.001, aff: fmt(uu, decimalesDe(uu)) },
      { id: 'z', q: `z-score (référence : ${s.refTxt})`, vrai: zz, tol: 0.05, aff: fmt(zz, 1) },
      { id: 'c', q: 'Compatible avec la référence ? (oui ou non)', texte: true, vrai: zz <= 2 ? 'oui' : 'non', aff: zz <= 2 ? 'oui' : 'non' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          <strong>{s.nom}</strong> : {defi.v.length} groupes ont trouvé ({s.unite}) :
          <div style={{ fontFamily: 'monospace', fontSize: 14, margin: '6px 0', background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 6, padding: '6px 8px' }}>{defi.v.map(v => fmt(v, s.dec)).join(' ; ')}</div>
          Exploitez cette série.
        </div>
        {Q.map((q, k) => {
          const rep = (defi.reps[q.id] || '').trim();
          const ok = q.texte ? rep.toLowerCase() === q.vrai : proche(lireNombre(rep), q.vrai, q.tol);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const v = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: v } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {q.aff}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouvelle série</button>
        </div>
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
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .me-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .me-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .me-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Mesure et incertitudes : la dispersion des résultats</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      {mode === 'explore' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['classe', '🎲 Simuler une classe'], ['ma', '📊 Les résultats de ma classe']].map(([k, n]) =>
            <button key={k} onClick={() => setOnglet(k)} style={stylePetitBouton(onglet === k, '#0f766e')}>{n}</button>)}
        </div>
      )}
      {mode === 'explore' && onglet === 'ma' && maClasse}
      {mode === 'defi' && <div style={styleBoite}>{voletDefi}</div>}
      {(enGuide || (mode === 'explore' && onglet === 'classe')) && <>
        <div className="me-l1">
          {graphique}
          {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
            : <div style={styleBoite}><Section titre="La classe simulée" ouvert={ouverts.reglages} onBascule={() => setOuverts(o => ({ ...o, reglages: !o.reglages }))}>{reglages}</Section></div>}
        </div>
        <div className="me-l2">
          <div><Section titre="Statistiques" ouvert={ouverts.stats} onBascule={() => setOuverts(o => ({ ...o, stats: !o.stats }))}>{stats}{courbeN}</Section></div>
          {vu('systematique') && <div style={styleBoite} data-apparait={`${idx('systematique')}`}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Erreur aléatoire et erreur systématique</div>
            <Cibles/>
            <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
              Le centre de la cible est la valeur vraie. Une erreur aléatoire disperse les tirs autour du centre ; une erreur systématique les
              décale tous du même côté. Faire plus de mesures resserre le nuage, mais ne le recentre pas.
            </div>
          </div>}
        </div>
      </>}
    </div>
  );
}
