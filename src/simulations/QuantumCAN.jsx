import { useState, useEffect, useRef, useMemo } from "react";
import montageCtn from "./montageCtn";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, fmt, lireNombre, proche } from "../commun";

// ====================================================
// SIM 15 — QUANTUM DU CAN → RÉSOLUTION EN TEMPÉRATURE
// ====================================================

// Régression polynomiale (ordre 2 ou 3)
export function polyReg(xs, ys, ordre) {
  const n = xs.length;
  const deg = ordre + 1;
  // Matrice de Vandermonde
  const A = xs.map(x => Array.from({length: deg}, (_, k) => Math.pow(x, k)));
  // Moindres carrés : (A^T A) c = A^T y
  const ATA2 = Array.from({length: deg}, (_, i) =>
    Array.from({length: deg}, (_, j) =>
      xs.reduce((s, x, k) => s + Math.pow(x, i) * Math.pow(x, j), 0)
    )
  );
  const ATy = Array.from({length: deg}, (_, i) =>
    xs.reduce((s, x, k) => s + Math.pow(x, i) * ys[k], 0)
  );
  // Résolution par élimination de Gauss
  const M = ATA2.map((row, i) => [...row, ATy[i]]);
  for (let col = 0; col < deg; col++) {
    let maxRow = col;
    for (let row = col + 1; row < deg; row++)
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    for (let row = col + 1; row < deg; row++) {
      const f = M[row][col] / M[col][col];
      for (let k = col; k <= deg; k++) M[row][k] -= f * M[col][k];
    }
  }
  const coeffs = new Array(deg).fill(0);
  for (let i = deg - 1; i >= 0; i--) {
    coeffs[i] = M[i][deg] / M[i][i];
    for (let k = i - 1; k >= 0; k--) M[k][deg] -= M[k][i] * coeffs[i];
  }
  // R²
  const yMean = ys.reduce((s, v) => s + v, 0) / n;
  const ssTot = ys.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = ys.reduce((s, v, i) => {
    const yHat = coeffs.reduce((sum, c, k) => sum + c * Math.pow(xs[i], k), 0);
    return s + (v - yHat) ** 2;
  }, 0);
  const r2 = 1 - ssRes / ssTot;
  return { coeffs, r2 };
}

export function evalPoly(coeffs, x) {
  return coeffs.reduce((s, c, k) => s + c * Math.pow(x, k), 0);
}

// Données du TP : CTN (10 kΩ à 25 °C) en série avec R = 10 kΩ sous 5 V ; Ur est mesurée aux bornes de R
export const CAN_EXEMPLE = `T (°C)\tUr (V)
22\t2,37
25\t2,57
28\t2,77
33\t3,03
36\t3,19
42\t3,46
46\t3,65
50\t3,83
56\t4,04
59\t4,14
65\t4,29`;

export function parseDonnees(texte) {
  const lignes = texte.trim().split('\n');
  const pts = [];
  for (const ligne of lignes) {
        // Séparateur : tabulation ou point-virgule uniquement
    // (la virgule est réservée au séparateur décimal FR)
    const cols = ligne.trim().split(/[\t;]+/);
    if (cols.length < 2) continue;
    const t = parseFloat(cols[0].replace(',', '.'));
    const u = parseFloat(cols[1].replace(',', '.'));
    if (!isNaN(t) && !isNaN(u)) pts.push({ t, u });
  }
  return pts.sort((a, b) => a.u - b.u);
}

// Modèle du parcours guidé : données d'exemple, polynôme d'ordre 3 (R² ≈ 0,99999), CAN 10 bits sur 0–5 V
const PTS_EX = parseDonnees(CAN_EXEMPLE);
const REG_EX3 = polyReg(PTS_EX.map(p => p.u), PTS_EX.map(p => p.t), 3);
const quantumDe = (nbits, vmin = 0, vmax = 5) => (vmax - vmin) / (Math.pow(2, nbits) - 1);
const dTDe = (u, q) => Math.abs(evalPoly(REG_EX3.coeffs, u + q) - evalPoly(REG_EX3.coeffs, u));
const fEx = u => evalPoly(REG_EX3.coeffs, u);
const urMinEx = Math.min(...PTS_EX.map(p => p.u)), urMaxEx = Math.max(...PTS_EX.map(p => p.u));
// Qualité des modèles d'ordre 1, 2, 3 sur les données du TP : R² et plus grand écart avec une mesure (°C)
const ORDRES_EX = [1, 2, 3].map(o => {
  const r = polyReg(PTS_EX.map(p => p.u), PTS_EX.map(p => p.t), o);
  return { o, r2: r.r2, ecart: Math.max(...PTS_EX.map(p => Math.abs(evalPoly(r.coeffs, p.u) - p.t))) };
});
export function SimulationCAN({ plotlyReady }) {
  const [mode, setMode] = useState('explore');                 // on arrive sur l'exploration libre
  const [guide, setGuide] = useEtatPersistant('can-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(true);
  const [montageOuv, setMontageOuv] = useState(true);
  const enGuide = mode === 'guide';
  const [source, setSource] = useState(null); // null | 'exemple' | 'perso'
  const [texte, setTexte] = useState('');
  const [ordre, setOrdre] = useState(2);
  const [vmin, setVmin] = useState(0);
  const [vmax, setVmax] = useState(5);
  const [nbits, setNbits] = useState(10);
  const [urVal, setUrVal] = useState(null);
  const [showQuant, setShowQuant] = useState(false);

  const [etapeDonnees, setEtapeDonnees] = useState(false);
  const [etapeModele, setEtapeModele] = useState(false);
  const [etapeZoom, setEtapeZoom] = useState(false);

  const pts = useMemo(() => parseDonnees(texte), [texte]);
  const valide = pts.length >= ordre + 2;
  const quantum = (vmax - vmin) / (Math.pow(2, nbits) - 1);

  const reg = useMemo(() => {
    if (!valide) return null;
    return polyReg(pts.map(p => p.u), pts.map(p => p.t), ordre);
  }, [pts, ordre, valide]);

  const urMin = valide ? Math.min(...pts.map(p => p.u)) : 0;
  const urMax = valide ? Math.max(...pts.map(p => p.u)) : 5;
  const urCur = urVal !== null ? urVal : (urMin + urMax) / 2;

  function choisirExemple() {
    setTexte(CAN_EXEMPLE);
    setSource('exemple');
    setEtapeDonnees(false); setEtapeModele(false); setEtapeZoom(false);
  }
  function choisirPerso() {
    setTexte('');
    setSource('perso');
    setEtapeDonnees(false); setEtapeModele(false); setEtapeZoom(false);
  }

  // Graphe principal — nuage de points (+ modèle si étape suivante active)
  useEffect(() => {
    if (!plotlyReady || !valide || !etapeDonnees) return;
    const traces = [
      { x: pts.map(p => p.u), y: pts.map(p => p.t), mode: 'markers',
        marker: { color: '#334155', size: 8 }, name: 'Points exp.',
        hovertemplate: 'Mesure<br>Ur = %{x:.2f} V<br>T = %{y:.0f} °C<extra></extra>' },
    ];
    let shapes = [];
    if (etapeModele && reg) {
      const xs = [], ys = [];
      const N = 200;
      for (let i = 0; i <= N; i++) {
        const u = urMin + (urMax - urMin) * i / N;
        xs.push(u); ys.push(evalPoly(reg.coeffs, u));
      }
      const T0 = evalPoly(reg.coeffs, urCur);
      traces.push({ x: xs, y: ys, mode: 'lines',
        line: { color: '#2a9d8f', width: 2.5 }, name: 'Modèle',
        hovertemplate: 'Modèle<br>Ur = %{x:.3f} V<br>T = %{y:.2f} °C<extra></extra>' });
      if (etapeZoom) {
        traces.push({ x: [urCur], y: [T0], mode: 'markers',
          marker: { color: '#f59e0b', size: 11 }, name: 'Point choisi' });
        shapes = [
          { type: 'line', x0: urCur, x1: urCur, y0: 0, y1: T0,
            line: { color: '#f59e0b', width: 1, dash: 'dot' } },
          { type: 'line', x0: urMin, x1: urCur, y0: T0, y1: T0,
            line: { color: '#f59e0b', width: 1, dash: 'dot' } },
        ];
      }
    }

     // Niveaux de quantification : segments Ur (verticaux, s'arrêtent sur le modèle)
    // + segments T (horizontaux, jusqu'à l'axe)
    if (showQuant && etapeModele && reg) {
      const kMin = Math.ceil((urMin - vmin) / quantum);
      const kMax = Math.floor((urMax - vmin) / quantum);
      const nLevels = kMax - kMin;
      if (nLevels > 0 && nLevels <= 80) {
        const yAxisMin = Math.min(...pts.map(p => p.t)) - 5;
        for (let k = kMin; k <= kMax; k++) {
          const u = vmin + k * quantum;
          if (u < urMin || u > urMax) continue;
          const tSurModele = evalPoly(reg.coeffs, u);
          // Segment vertical : du bas jusqu'au modèle (pas jusqu'en haut)
          shapes.push({ type: 'line', x0: u, x1: u, y0: yAxisMin, y1: tSurModele,
            line: { color: 'rgba(148,163,184,0.6)', width: 1 } });
          // Segment horizontal : du modèle jusqu'à l'axe Y (gauche)
          shapes.push({ type: 'line', x0: urMin, x1: u, y0: tSurModele, y1: tSurModele,
            line: { color: 'rgba(148,163,184,0.6)', width: 1 } });
        }
      }
    }

    Plotly.react('can-main', traces, {
      margin: { l: 52, r: 16, t: 10, b: 44 },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#1e293b', size: 12 },
      hovermode: 'closest',
      xaxis: { title: 'Ur (V)', gridcolor: showQuant ? 'transparent' : 'rgba(0,0,0,0.1)', zeroline: false, color: '#1e293b',
        range: [Math.floor(urMin * 10) / 10 - 0.1, Math.ceil(urMax * 10) / 10 + 0.1], dtick: 0.1, tickformat: '.1f', tickangle: 0,
        showspikes: true, spikemode: 'across', spikesnap: 'cursor', spikethickness: 1, spikedash: 'dot', spikecolor: '#64748b' },
      yaxis: { title: 'T (°C)', gridcolor: showQuant ? 'transparent' : 'rgba(0,0,0,0.1)', zeroline: false, color: '#1e293b', dtick: 5,
        showspikes: true, spikemode: 'across', spikesnap: 'cursor', spikethickness: 1, spikedash: 'dot', spikecolor: '#64748b' },
      legend: { x: 0.02, y: 0.98, bgcolor: 'transparent', font: { color: '#1e293b' } },
      showlegend: true,
      shapes,
    }, { displayModeBar: false, responsive: true });
  }, [plotlyReady, pts, reg, urCur, urMin, urMax, etapeDonnees, etapeModele, etapeZoom, showQuant, quantum, vmin]);

  // Graphe zoom
  const dTmax = useMemo(() => {
    if (!reg) return 0.2;
    let max = 0;
    for (let i = 0; i <= 100; i++) {
      const u = urMin + (urMax - urMin) * i / 100;
      const dT = Math.abs(evalPoly(reg.coeffs, u + quantum) - evalPoly(reg.coeffs, u));
      if (dT > max) max = dT;
    }
    return max;
  }, [reg, urMin, urMax, quantum]);

  useEffect(() => {
    if (!plotlyReady || !valide || !reg || !etapeZoom) return;
    const T0 = evalPoly(reg.coeffs, urCur);
    const T1 = evalPoly(reg.coeffs, urCur + quantum);
    const span = quantum * 5;
    const xs = [], ys = [];
    for (let i = 0; i <= 80; i++) {
      const u = (urCur - span) + 2 * span * i / 80;
      xs.push(u); ys.push(evalPoly(reg.coeffs, u));
    }

    let quantShapesZoom = [];
    if (showQuant) {
      const kMin = Math.floor((urCur - span - vmin) / quantum);
      const kMax = Math.ceil((urCur + span - vmin) / quantum);
      for (let k = kMin; k <= kMax; k++) {
        const u = vmin + k * quantum;
        quantShapesZoom.push({ type: 'line', x0: u, x1: u, y0: 0, y1: 1, yref: 'paper',
          line: { color: 'rgba(148,163,184,0.7)', width: 1 } });
      }
    }

    Plotly.react('can-zoom', [
      { x: xs, y: ys, mode: 'lines',
        line: { color: '#2a9d8f', width: 2.5 }, hoverinfo: 'skip' },
      { x: [urCur, urCur + quantum], y: [T0, T1], mode: 'markers',
        marker: { color: '#f59e0b', size: 8 }, hoverinfo: 'skip' },
    ], {
      margin: { l: 56, r: 16, t: 10, b: 44 },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#1e293b', size: 11 },
      xaxis: { title: 'Ur (V)', gridcolor: 'rgba(0,0,0,0.1)',
        zeroline: false, tickformat: '.4f', color: '#1e293b',
        range: [urCur - quantum*5, urCur + quantum*6] },
      yaxis: { title: 'T (°C)', gridcolor: 'rgba(0,0,0,0.1)',
        zeroline: false, tickformat: '.2f', color: '#1e293b',
        range: [Math.min(T0,T1) - dTmax*4, Math.max(T0,T1) + dTmax*4] },
      showlegend: false,
      shapes: [
        ...quantShapesZoom,
        { type: 'line', x0: urCur, x1: urCur, y0: Math.min(T0,T1), y1: T0,
          line: { color: '#f59e0b', width: 1, dash: 'dot' } },
        { type: 'line', x0: urCur+quantum, x1: urCur+quantum, y0: Math.min(T0,T1), y1: T1,
          line: { color: '#f59e0b', width: 1, dash: 'dot' } },
        { type: 'line', x0: urCur, x1: urCur+quantum, y0: Math.min(T0,T1), y1: Math.min(T0,T1),
          line: { color: '#f59e0b', width: 1.5 } },
        { type: 'rect', x0: urCur, x1: urCur+quantum,
          y0: Math.min(T0,T1), y1: Math.max(T0,T1),
          fillcolor: 'rgba(245,158,11,0.15)', line: { color: '#f59e0b', width: 1 } },
      ],
    }, { displayModeBar: false, responsive: true });
  }, [plotlyReady, reg, urCur, quantum, etapeZoom, dTmax, showQuant, vmin]);

  const T0 = reg ? evalPoly(reg.coeffs, urCur) : 0;
  const dT = reg ? Math.abs(evalPoly(reg.coeffs, urCur + quantum) - T0) : 0;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const Q10 = quantumDe(10), Q3 = quantumDe(3);
  const reglage = source === 'exemple' && ordre === 3 && vmin === 0 && vmax === 5 && nbits === 10;
  const reglage3 = source === 'exemple' && ordre === 3 && vmin === 0 && vmax === 5 && nbits === 3;
  const accroche = u => Math.round(u / Q10) * Q10;           // le curseur ne s'arrête que sur des niveaux du CAN
  const placer = u => setUrVal(accroche(u));
  const pres = u => Math.abs(urCur - u) < 0.01;
  const dT319 = dTDe(accroche(3.19), Q10);
  const [oEx1, oEx2, oEx3] = ORDRES_EX;
  const pente = (PTS_EX.find(p => p.t === 36).t - PTS_EX.find(p => p.t === 33).t) / (PTS_EX.find(p => p.t === 36).u - PTS_EX.find(p => p.t === 33).u);
  const U404 = 4.04, N404 = Math.floor(U404 / Q3 + 1e-9), T404 = fEx(N404 * Q3), Tbas = T404, Thaut = fEx((N404 + 1) * Q3), Treel404 = PTS_EX.find(p => p.u === U404).t;
  const ETAPES = [
    { id: 'objectif', titre: 'Que cherche-t-on ?', focus: [],
      texte: <>Un capteur de température (une CTN) donne une tension Ur ; un convertisseur analogique-numérique (CAN) la transforme en un nombre entier N. Mais N ne prend que des valeurs entières : deux tensions très voisines
        donnent le même N. La chaîne de mesure ne peut donc afficher que certaines températures, et il existe <strong>une plus petite variation de température qu'elle peut distinguer</strong>.</>,
      tache: { type: 'qcm', q: 'Que cherche-t-on à déterminer avec cette simulation ?', options: ['La plus petite variation de température détectable : la résolution en température', 'La température exacte du capteur', 'La tension maximale du CAN'], bonne: 0,
        expl: 'La résolution dépend à la fois du CAN (son quantum) et du capteur (sa sensibilité).' } },
    { id: 'montage', titre: 'Le montage du TP', focus: ['montage'],
      texte: <>La CTN et une résistance de 10 kΩ sont en série sous 5 V ; la carte Arduino mesure la tension Ur aux bornes de la résistance (entrée A0). C'est un pont diviseur : Ur = 5 × R / (R + R<sub>CTN</sub>).</>,
      tache: { type: 'qcm', q: 'Les mesures montrent que Ur augmente avec la température. Pourquoi ?', options: ['La résistance de la CTN diminue quand T augmente : la tension se reporte davantage aux bornes de la résistance de 10 kΩ', 'La résistance de la CTN augmente quand T augmente', 'La tension d’alimentation augmente avec T'], bonne: 0,
        expl: 'Une CTN a un coefficient de température négatif : sa résistance baisse quand T monte, donc Ur = 5 R / (R + R_CTN) augmente.' } },
    { id: 'donnees', titre: 'Les données du TP', focus: ['donnees'],
      texte: <>Vous avez mesuré la tension Ur pour plusieurs températures T : c'est la <strong>courbe d'étalonnage</strong> du capteur. Chargez les données du TP.</>,
      tache: { type: 'action', ok: source === 'exemple', label: '📊 Charger les données du TP', faire: choisirExemple } },
    { id: 'courbe', titre: 'La courbe d’étalonnage', focus: ['donnees', 'courbe'],
      texte: <>Affichez les points de mesure. Le pointeur de la souris affiche les valeurs de Ur et de T, avec un repère en pointillés.</>,
      tache: { type: 'action', ok: etapeDonnees, label: 'Afficher la courbe d’étalonnage →', faire: () => setEtapeDonnees(true) } },
    { id: 'quantum', titre: 'Le quantum', focus: ['can'],
      texte: <>Le CAN a n bits : il fournit un nombre entier N de 0 à 2<sup>n</sup> − 1, pour une tension de 0 à 5 V. Le <strong>quantum</strong> q est la variation de tension qui fait changer N d'une unité : les 5 V sont partagés en 2<sup>n</sup> − 1 intervalles égaux, <strong>q = (V<sub>max</sub> − V<sub>min</sub>) / (2<sup>n</sup> − 1)</strong>. Ici, n = 10 bits (carte Arduino Uno).</>,
      tache: { type: 'num', q: 'Quantum q pour 10 bits sur 0–5 V', unite: 'mV', vrai: Q10 * 1000, tol: 0.01, affiche: x => fmt(x, 2),
        bloque: !(nbits === 10 && vmin === 0 && vmax === 5) ? 'Réglez 0 V, 5 V et 10 bits dans « Paramètres du CAN ».' : null,
        expl: `q = 5 / 1023 = ${fmt(Q10 * 1000, 2)} mV.` } },
    { id: 'modele', titre: 'Un modèle pour passer de Ur à T', focus: ['modele', 'courbe'],
      texte: <>Pour connaître la température à partir de n'importe quelle tension, on ajuste un <strong>modèle polynomial</strong> T = f(Ur) sur les points mesurés.</>,
      tache: { type: 'action', ok: etapeModele, label: 'Ajuster un modèle →', faire: () => setEtapeModele(true) } },
    { id: 'ordre', titre: 'Quel modèle choisir ?', focus: ['modele', 'courbe'],
      texte: <>Essayez les ordres 1, 2 et 3. Écart maximal entre le modèle et une mesure : <strong>{fmt(oEx1.ecart, 1)} °C</strong> pour l'ordre 1 (R² = {fmt(oEx1.r2, 4)}), <strong>{fmt(oEx2.ecart, 1)} °C</strong> pour l'ordre 2
        (R² = {fmt(oEx2.r2, 4)}) et <strong>{fmt(oEx3.ecart, 1)} °C</strong> pour l'ordre 3 (R² = {fmt(oEx3.r2, 4)}). Un R² proche de 1 ne suffit pas : on regarde aussi l'écart avec les mesures. Choisissez l'ordre 3.</>,
      tache: { type: 'action', ok: ordre === 3, label: 'Choisir l’ordre 3', faire: () => setOrdre(3), consigne: ordre === 3 ? null : `Ordre du modèle : ${ordre} → 3` } },
    { id: 'zoom', titre: 'Zoomer sur une marche', focus: ['modele'],
      texte: <>Activez le zoom : il montre, à l'échelle réelle, ce qui se passe entre deux niveaux consécutifs du CAN.</>,
      tache: { type: 'action', ok: etapeZoom, label: 'Activer le zoom →', faire: () => setEtapeZoom(true) } },
    { id: 'curseur', titre: 'Choisir une tension', focus: ['curseur', 'zoom'],
      texte: <>Le curseur ne peut s'arrêter que sur des niveaux du CAN. Placez-le vers Ur = 3,19 V (point mesuré à 36 °C).</>,
      tache: { type: 'action', ok: pres(accroche(3.19)) && etapeZoom, label: 'Placer le curseur vers 3,19 V', faire: () => placer(3.19),
        consigne: pres(accroche(3.19)) ? null : `Ur : ${fmt(urCur, 2)} V → 3,19 V` } },
    { id: 'dt', titre: 'La résolution en température', focus: ['zoom', 'table'],
      texte: <>Deux niveaux consécutifs du CAN sont séparés par le quantum q. Les températures correspondantes diffèrent de <strong>ΔT ≈ q × |dT/dUr|</strong> : c'est la plus petite variation de température qui fait changer N.
        Estimez la pente avec deux points mesurés : (33 °C ; 3,03 V) et (36 °C ; 3,19 V).</>,
      tache: { type: 'num', q: 'ΔT estimée pour 10 bits', unite: '°C', vrai: dT319, tol: 0.12, affiche: x => fmt(x, 3),
        aide: `Pente ≈ ΔT / ΔUr, puis ΔT ≈ q × pente.`,
        expl: `Pente ≈ ${fmt(pente, 1)} °C/V, donc ΔT ≈ ${fmt(Q10, 5)} × ${fmt(pente, 1)} ≈ ${fmt(Q10 * pente, 3)} °C. Le tableau du zoom donne ${fmt(dT319, 3)} °C avec le modèle.` } },
    { id: 'extremite', titre: 'Partout pareil ?', focus: ['curseur', 'zoom'],
      texte: <>Déplacez le curseur vers Ur = 4,20 V et comparez ΔT avec sa valeur à 3,19 V (tableau sous le zoom).</>,
      tache: { type: 'action', ok: pres(accroche(4.2)), label: 'Placer le curseur vers 4,20 V', faire: () => placer(4.2), consigne: pres(accroche(4.2)) ? null : `Ur : ${fmt(urCur, 2)} V → 4,20 V` } },
    { id: 'pente', titre: 'D’où vient la différence ?', focus: ['zoom', 'table'],
      texte: <>Le quantum q est le même partout, mais ΔT n'est pas le même.</>,
      tache: { type: 'qcm', q: 'À 4,20 V, ΔT est plus grand qu’à 3,19 V. Pourquoi ?', options: ['La courbe T = f(Ur) y est plus pentue : un même pas de tension correspond à un plus grand écart de température', 'Le quantum du CAN y est plus grand', 'Le CAN y est moins précis'], bonne: 0,
        expl: 'ΔT ≈ q × |dT/dUr| : à q constant, ΔT est proportionnel à la pente locale de la courbe. La résolution dépend donc de la zone de mesure.' } },
    { id: 'bits3', titre: 'Un CAN à très peu de bits', focus: ['can'],
      texte: <>Pour voir clairement l'effet de la discrétisation, passez à <strong>3 bits</strong> (N de 0 à 7) dans « Paramètres du CAN ». Le curseur ne peut plus prendre que quelques positions.</>,
      tache: { type: 'action', ok: nbits === 3, label: 'Passer à 3 bits', faire: () => setNbits(3), consigne: nbits === 3 ? null : `Nombre de bits : ${nbits} → 3` } },
    { id: 'q3', titre: 'Le quantum à 3 bits', focus: ['can'],
      texte: <>Le même calcul avec n = 3.</>,
      tache: { type: 'num', q: 'Quantum q pour 3 bits sur 0–5 V', unite: 'mV', vrai: Q3 * 1000, tol: 0.01, affiche: x => fmt(x, 1),
        bloque: !(nbits === 3 && vmin === 0 && vmax === 5) ? 'Réglez 0 V, 5 V et 3 bits dans « Paramètres du CAN ».' : null,
        expl: `q = 5 / 7 ≈ ${fmt(Q3 * 1000, 1)} mV.` } },
    { id: 'niveaux', titre: 'Visualiser les niveaux du CAN', focus: ['courbe', 'modele'],
      texte: <>Dans le premier graphique, cochez « Afficher les niveaux de quantification du CAN » (sous le modèle polynomial). Chaque trait vertical est une valeur de Ur que le CAN peut « voir » (N × q) ; le trait horizontal associé donne la température affichée correspondante.</>,
      tache: { type: 'action', ok: showQuant && reglage3 && etapeModele, label: 'Afficher les niveaux', faire: () => setShowQuant(true),
        consigne: !(reglage3 && etapeModele) ? 'Gardez le modèle d’ordre 3 et 3 bits.' : showQuant ? null : 'Cochez « Afficher les niveaux de quantification du CAN » (sous le modèle polynomial)' } },
    { id: 'taff', titre: 'Quelle température est affichée ?', focus: ['courbe'],
      texte: <>Le capteur est à {fmt(Treel404, 0)} °C : on mesure Ur = {fmt(U404, 2).replace('.', ',')} V. Le CAN calcule N = Ur / q = {fmt(U404 / Q3, 2)} et <strong>ne garde que la partie entière</strong> : N = {N404}. Il en déduit la tension N × q = {fmt(N404 * Q3, 3)} V, et la chaîne affiche la température associée à cette tension.
        <br/>Repérez Ur = {fmt(U404, 2).replace('.', ',')} V sur l'axe horizontal, repérez le niveau du CAN situé juste à sa gauche, puis suivez le trait horizontal jusqu'à l'axe des températures.</>,
      tache: { type: 'num', q: 'Température affichée par la chaîne pour Ur = 4,04 V', unite: '°C', vrai: T404, tol: 0.03, affiche: x => fmt(x, 1),
        bloque: !(reglage3 && etapeModele && showQuant) ? 'Gardez le modèle d’ordre 3, 3 bits et affichez les niveaux de quantification.' : null,
        expl: `La chaîne affiche ${fmt(T404, 1)} °C alors que la température réelle est ${fmt(Treel404, 0)} °C : un écart de ${fmt(Treel404 - T404, 0)} °C dû uniquement à la discrétisation.` } },
    { id: 'resolution3', titre: 'Que sait-on de la vraie température ?', focus: ['courbe'],
      texte: <>La chaîne affiche {fmt(T404, 0)} °C (N = {N404}). Tous les Ur compris entre N × q = {fmt(N404 * Q3, 3)} V et (N + 1) × q = {fmt((N404 + 1) * Q3, 3)} V donnent le même N.</>,
      tache: { type: 'qcm', q: 'Dans quel intervalle se trouve alors la température réelle ?', options: [`Entre ${fmt(Tbas, 0)} et ${fmt(Thaut, 0)} °C environ`, `Exactement ${fmt(T404, 0)} °C`, `Entre ${fmt(T404 - 1, 0)} et ${fmt(T404 + 1, 0)} °C`], bonne: 0,
        expl: `Avec 3 bits, la température réelle n'est connue qu'à ${fmt(Thaut - Tbas, 0)} °C près : la chaîne est inutilisable pour un thermomètre. Avec 10 bits, l'intervalle n'est plus que de ${fmt(dT319, 2)} °C.` } },
    { id: 'erreur', titre: 'Le CAN est-il le facteur limitant ?', focus: [],
      texte: <>Avec 10 bits, ΔT vaut environ {fmt(dT319, 2)} °C. Mais le modèle s'écarte des mesures de {fmt(oEx3.ecart, 1)} °C au plus, même avec l'ordre 3.</>,
      tache: { type: 'qcm', q: 'Que peut-on conclure pour la mesure de température ?', options: ['Ici, la qualité de l’étalonnage (modèle, capteur) limite l’exactitude bien avant la résolution du CAN', 'La résolution du CAN limite seule l’exactitude de la mesure', 'Le modèle est exact car son R² est proche de 1'], bonne: 0,
        expl: 'La résolution du CAN n’est qu’une composante de l’incertitude de mesure, avec l’étalonnage, la linéarité du capteur, le bruit et la dérive.' } },
    { id: 'hypotheses', titre: 'Sur quoi repose ce modèle ?', focus: ['hypo'],
      texte: <>Lisez l'encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Quelle hypothèse est faite sur le CAN ?', options: ['CAN idéal : N de 0 à 2ⁿ − 1, q = (Vmax − Vmin)/(2ⁿ − 1), sans bruit ni défaut', 'Le CAN mesure la température directement', 'Le quantum dépend de la température'], bonne: 0,
        expl: 'Un CAN réel a aussi du bruit, une erreur de gain et de décalage, et une non-linéarité.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez calculer le quantum d'un CAN, en déduire la résolution en température (ΔT ≈ q × |dT/dUr|) et expliquer pourquoi peu de bits ne laissent qu'un petit nombre de températures affichables. En exploration libre,
        changez le nombre de bits, la plage ou le modèle, ou chargez vos propres mesures.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const passe = id => !enGuide || etape > idx(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const cols = mode === 'explore' ? '2fr 1fr' : 'minmax(0, 1fr)';

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    let d, k = 0;
    do {
      d = { bits: tire([3, 4, 5, 6]), u: tire([2.5, 2.7, 2.9, 3.1, 3.3, 3.5, 3.7, 3.9, 4.1]) };
      const q = quantumDe(d.bits), x = d.u / q, N = Math.floor(x + 1e-9), uq = N * q;
      var ok = (x - N) > 0.08 && (x - N) < 0.92 && uq > urMinEx && uq + q < urMaxEx;
    } while (!ok && ++k < 200);
    setDefi({ ...d, reps: {}, verifie: false });
  }
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !defi) nouveauDefi();
    if (m === 'guide') {
      setSource(null); setTexte(''); setOrdre(2); setVmin(0); setVmax(5); setNbits(10); setUrVal(null); setShowQuant(false);
      setEtapeDonnees(false); setEtapeModele(false); setEtapeZoom(false);
    }
  }
  const voletDefi = defi && (() => {
    const q = quantumDe(defi.bits), N = Math.floor(defi.u / q + 1e-9), uq = N * q, Taf = fEx(uq), largeur = fEx(uq + q) - fEx(uq);
    const Q = [
      { id: 'q', q: 'Quantum q du CAN', unite: 'mV', vrai: q * 1000, tol: 0.01, aff: fmt(q * 1000, 1) },
      { id: 'n', q: 'Nombre N affiché par le CAN', unite: '', vrai: N, tol: 0.0001, aff: fmt(N, 0) },
      { id: 't', q: 'Température affichée par la chaîne (modèle d’ordre 3)', unite: '°C', vrai: Taf, tol: 0.01, aff: fmt(Taf, 1) },
      { id: 'l', q: 'Largeur de l’intervalle de températures réelles qui donnent ce même N', unite: '°C', vrai: largeur, tol: 0.15, aff: fmt(largeur, 1) },
      { id: 'e', q: 'Erreur maximale de quantification sur la tension Ur (la tension réelle est comprise entre N × q et (N + 1) × q)', unite: 'mV', vrai: q * 1000, tol: 0.01, aff: fmt(q * 1000, 1) },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          Un CAN <strong>{defi.bits} bits</strong> mesure des tensions de 0 à 5 V. Il convertit la tension <strong>Ur = {fmt(defi.u, 2)} V</strong> aux bornes de la résistance du montage du TP (modèle polynomial d'ordre 3).
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Rappels : q = 5 / (2<sup>n</sup> − 1) ; N = Ur / q tronqué à l’entier inférieur ; la température affichée est celle du modèle pour la tension N × q.</div>
          <button onClick={() => { setSource('exemple'); setTexte(CAN_EXEMPLE); setEtapeDonnees(true); setEtapeModele(true); setEtapeZoom(true); setOrdre(3); setVmin(0); setVmax(5); setNbits(defi.bits);
            setUrVal(uq); setMode('explore'); }}
            style={{ ...stylePetitBouton(false, '#334155'), marginTop: 6 }}>🔍 Régler l’exploration sur ces valeurs</button>
        </div>
        {Q.map((qu, k) => {
          const rep = defi.reps[qu.id] || '', ok = proche(lireNombre(rep), qu.vrai, qu.tol);
          return (
            <div key={qu.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(qu.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const val = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [qu.id]: val } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{qu.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {qu.aff} {qu.unite}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouveau défi</button>
        </div>
      </div>
    );
  })();

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Montage et mesures</strong> : la CTN (10 kΩ à 25 °C) et une résistance R = 10 kΩ sont en série sous 5 V ; Ur est mesurée aux bornes de R, donc Ur = 5 R / (R + R<sub>CTN</sub>) augmente avec T. Les points (T, Ur) sont supposés sans erreur ; vous pouvez les remplacer par vos propres mesures.</li>
      <li><strong>Modèle polynomial</strong> T = f(Ur) : on suppose qu'il représente fidèlement le capteur entre les points mesurés, sans extrapoler au-delà (sauf, éventuellement, pour le dernier niveau du CAN). Un R² proche de 1 ne suffit pas à le garantir : sur ces données, l'ordre 2 donne R² = {fmt(oEx2.r2, 4)} mais jusqu'à {fmt(oEx2.ecart, 1)} °C d'écart avec une mesure, l'ordre 3 {fmt(oEx3.ecart, 1)} °C. La résolution calculée dépend du modèle choisi.</li>
      <li><strong>CAN idéal à n bits</strong> : N est un entier de 0 à 2<sup>n</sup> − 1, obtenu en tronquant Ur / q à l'entier inférieur (comme sur une carte Arduino), et le quantum vaut q = (V<sub>max</sub> − V<sub>min</sub>) / (2<sup>n</sup> − 1). Pas de bruit, ni d'erreur de gain, de décalage ou de non-linéarité. La tension réelle est comprise entre N × q et (N + 1) × q : l'erreur de quantification va de 0 à q.</li>
      <li><strong>Résolution en température</strong> : ΔT = |T(Ur + q) − T(Ur)|, soit environ q × |dT/dUr|. C'est la plus petite variation de température qui change N, une conséquence du CAN seul ; l'incertitude de mesure complète (capteur, étalonnage, bruit, stabilité) est plus grande.</li>
      <li><strong>Température affichée</strong> : pour une tension Ur, le CAN donne N = ⌊Ur / q⌋ ; la chaîne affiche la température du modèle pour la tension N × q.</li>
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

  const TXT = '#0f172a';
  const TXT2 = '#475569';
  const BORDER = '#cbd5e1';
  const BG = '#f8fafc';

  const inpStyle = {
    fontSize: 13, padding: '5px 9px',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 6, background: 'white', color: TXT, width: 120,
  };

  const boxStyle = {
    background: BG, borderRadius: 10,
    padding: '14px 16px', border: `1px solid ${BORDER}`,
  };

  const stepBtnStyle = () => ({
    padding: '10px 22px', borderRadius: 8, border: 'none',
    cursor: 'pointer', fontWeight: 700, fontSize: 14,
    background: '#2a9d8f', color: 'white', marginTop: 12,
  });

  const exploration = (
    <div>

      {/* ── MONTAGE ── */}
      <div style={{ ...boxStyle, marginBottom: 16, ...cadre('montage') }}>
        <Section titre="Montage du TP" ouvert={montageOuv} onBascule={() => setMontageOuv(o => !o)}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <img src={montageCtn} alt="Montage : carte Arduino Uno, CTN et résistance de 10 kΩ"
              style={{ width: '100%', maxWidth: 400, display: 'block', borderRadius: 6, background: 'white' }}/>
            <div style={{ flex: 1, minWidth: 240, fontSize: 13.5, color: TXT, lineHeight: 1.6 }}>
              La CTN (thermistance) et une résistance R = 10 kΩ sont en série entre le 5 V et la masse. L'entrée analogique A0 de la carte mesure la tension U<sub>r</sub> aux bornes de la résistance :
              <div style={{ fontFamily: 'monospace', margin: '6px 0', color: '#b45309', fontSize: 14 }}>U<sub>r</sub> = 5 × R / (R + R<sub>CTN</sub>)</div>
              Quand la température augmente, R<sub>CTN</sub> diminue et U<sub>r</sub> augmente. Le CAN de la carte convertit U<sub>r</sub> en un nombre entier N.
            </div>
          </div>
        </Section>
      </div>

      {/* ── CHOIX DE LA SOURCE ── */}
      {!source && (
        <div style={{ ...boxStyle, textAlign: 'center', padding: '28px 20px', ...cadre('donnees') }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: TXT, marginBottom: 16 }}>
            Quelle source de données utiliser ?
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={choisirExemple}
              style={{ padding: '12px 24px', borderRadius: 10, border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: 14,
                background: '#2a9d8f', color: 'white' }}>
              📊 Données du TP (CTN et résistance de 10 kΩ)
            </button>
            <button onClick={choisirPerso}
              style={{ padding: '12px 24px', borderRadius: 10, border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: 14,
                background: '#0ea5e9', color: 'white' }}>
              📋 Utiliser mes données expérimentales
            </button>
          </div>
        </div>
      )}

      {/* ── DONNÉES + PARAMÈTRES CAN ── */}
      {source && (
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 16, marginBottom: 16 }}>
          <div style={{ ...boxStyle, ...cadre('donnees') }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: TXT }}>Données expérimentales</div>
              <button onClick={() => setSource(null)}
                style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
                  border: `1px solid ${BORDER}`, background: 'white', color: TXT2 }}>
                ↺ Changer de source
              </button>
            </div>
            {source === 'perso' && (
              <div style={{ fontSize: 12, color: TXT2, marginBottom: 6 }}>
                Collez vos données depuis Google Sheets (2 colonnes : T en °C, U<sub>r</sub> en V) :
              </div>
            )}
            <textarea value={texte} onChange={e => setTexte(e.target.value)}
              rows={7}
              style={{ width: '100%', fontSize: 12, fontFamily: 'monospace', padding: 8,
                boxSizing: 'border-box', borderRadius: 6,
                border: `1px solid ${BORDER}`, background: 'white',
                color: TXT, resize: 'vertical', colorScheme: 'light' }}
              placeholder={"T (°C)\tUr (V)\n22\t2,37\n25\t2,57\n..."}
            />
            <div style={{ fontSize: 12, color: valide ? '#15803d' : '#dc2626', marginTop: 6, fontWeight: 600 }}>
              {valide ? `✓ ${pts.length} points chargés` : `⚠ Saisissez au moins ${ordre + 2} points`}
            </div>
            {valide && !etapeDonnees && (
              <button onClick={() => setEtapeDonnees(true)} style={stepBtnStyle()}>
                Afficher la courbe d'étalonnage →
              </button>
            )}
          </div>

          <div style={{ ...boxStyle, ...cadre('can') }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: TXT }}>Paramètres du CAN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: TXT2, marginBottom: 3, fontWeight: 600 }}>Tension min (V)</div>
                <input type="number" value={vmin} step="0.1"
                  onChange={e => setVmin(parseFloat(e.target.value) || 0)} style={inpStyle}/>
              </div>
              <div>
                <div style={{ fontSize: 12, color: TXT2, marginBottom: 3, fontWeight: 600 }}>Tension max (V)</div>
                <input type="number" value={vmax} step="0.1"
                  onChange={e => setVmax(parseFloat(e.target.value) || 5)} style={inpStyle}/>
              </div>
              <div>
                <div style={{ fontSize: 12, color: TXT2, marginBottom: 3, fontWeight: 600 }}>Nombre de bits</div>
                <input type="number" value={nbits} min={2} max={16}
                  onChange={e => setNbits(Math.min(16, Math.max(2, parseInt(e.target.value) || 10)))} style={inpStyle}/>
              </div>
            </div>
            <div style={{ marginTop: 10, padding: '8px 10px',
              background: 'white', borderRadius: 7, border: `1px solid ${BORDER}`,
              fontFamily: 'monospace', fontSize: 12, color: TXT }}>
              ΔU = ({vmax}−{vmin}) / (2<sup>{nbits}</sup>−1)<br/>
              = <strong style={{ color: '#d97706' }}>{passe('quantum') ? `${(quantum * 1000).toFixed(2)} mV` : '?'}</strong>
            </div>
          </div>
        </div>
      )}

            {/* ── NUAGE DE POINTS + MODÈLE (fusionnés) ── */}
      {source && valide && etapeDonnees && (
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 16, marginBottom: 16 }}>
          <div style={{ ...boxStyle, ...cadre('courbe') }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: TXT }}>
              Courbe d'étalonnage
            </div>
            <div id="can-main" style={{ width: '100%', height: 380 }}/>
          </div>

          <div style={{ ...boxStyle, ...cadre('modele') }}>
            {!etapeModele ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: TXT }}>
                  Ajuster un modèle
                </div>
                <button onClick={() => setEtapeModele(true)} style={{ ...stepBtnStyle(), width: '100%', marginTop: 0 }}>
                  Ajuster un modèle →
                </button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: TXT }}>Modèle polynomial</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {[1, 2, 3].map(o => (
                    <button key={o} onClick={() => setOrdre(o)}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
                        cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        background: ordre === o ? '#2a9d8f' : 'white',
                        border: `1.5px solid ${ordre === o ? '#2a9d8f' : BORDER}`,
                        color: ordre === o ? 'white' : TXT2 }}>
                      Ordre {o}
                    </button>
                  ))}
                </div>
                {reg && (
                  <div style={{ fontSize: 12, color: TXT, fontFamily: 'monospace', lineHeight: 1.9 }}>
                    {reg.coeffs.map((c, k) => (
                      <div key={k}>a<sub>{k}</sub> = {c.toFixed(5)}</div>
                    ))}
                    <div style={{ marginTop: 6, fontSize: 12, fontStyle: 'italic', color: TXT, lineHeight: 1.6 }}>
                      T = {reg.coeffs.map((c, k) => {
                        const signe = c >= 0 && k > 0 ? '+' : '';
                        if (k === 0) return `${c.toFixed(3)}`;
                        if (k === 1) return ` ${signe}${c.toFixed(3)}·Ur`;
                        return ` ${signe}${c.toFixed(3)}·Ur${k === 2 ? '²' : '³'}`;
                      }).join('')}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13,
                      color: reg.r2 > 0.9999 ? '#15803d' : '#b45309', fontWeight: 700 }}>
                      R² = {reg.r2.toFixed(6)}
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
              color: TXT2, marginTop: 10, cursor: 'pointer', fontWeight: 600 }}>
              <input type="checkbox" checked={showQuant}
                onChange={e => setShowQuant(e.target.checked)}/>
              Afficher les niveaux de quantification du CAN
            </label>
            {showQuant && (urMax - urMin) / quantum > 80 && (
              <div style={{ fontSize: 11, color: '#b45309', marginTop: 6 }}>
                ⚠ Trop de niveaux pour être visibles sur cette courbe — réduisez le nombre de bits.
              </div>
            )}
                </div>
                {!etapeZoom && (
                  <button onClick={() => setEtapeZoom(true)} style={{ ...stepBtnStyle(), width: '100%' }}>
                    Activer le zoom →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}


      {/* ── ZOOM + ENCART CHIFFRÉ ── */}
      {source && valide && etapeZoom && reg && (
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 16 }}>
          <div style={{ ...boxStyle, ...cadre('curseur') }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: TXT }}>
              Curseur sur la courbe (voir graphique principal ci-dessus)
            </div>
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: 12, color: TXT2, marginBottom: 4, fontWeight: 600 }}>
                <span>Ur = {urMin.toFixed(3)} V</span>
                <span style={{ color: '#d97706', fontWeight: 700 }}>Ur = {urCur.toFixed(3)} V</span>
                <span>Ur = {urMax.toFixed(3)} V</span>
              </div>
                <input type="range"
                min={vmin + Math.ceil((urMin - vmin) / quantum) * quantum}
                max={vmin + Math.floor((urMax - vmin) / quantum) * quantum}
                step={quantum}
                value={urCur}
                onChange={e => setUrVal(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}/>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...boxStyle, ...cadre('zoom') }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: TXT }}>
                Zoom — à l'échelle réelle
              </div>
              <div id="can-zoom" style={{ width: '100%', height: 260 }}/>
            </div>
            <div style={{ ...boxStyle, fontFamily: 'monospace', fontSize: 13, ...cadre('table') }}>
              {urCur + quantum > urMax + 1e-9 && (
                <div style={{ fontSize: 12, color: '#b45309', fontFamily: 'sans-serif', marginBottom: 6, lineHeight: 1.4 }}>
                  ⚠ Le niveau suivant du CAN dépasse la plage mesurée : ΔT est calculé en extrapolant le modèle.
                </div>
              )}
              {[
                ['Ur choisi', `${urCur.toFixed(3)} V`],
                ['T correspondante', `${T0.toFixed(2)} °C`],
                ['ΔU (quantum CAN)', passe('quantum') ? `${(quantum * 1000).toFixed(2)} mV` : '?'],
                ['ΔT résultant', passe('dt') ? `${dT.toFixed(3)} °C` : '?', true],
              ].map(([k, v, hi]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0', borderBottom: `1px dashed ${BORDER}` }}>
                  <span style={{ color: TXT2, fontSize: 12, fontWeight: 600 }}>{k}</span>
                  <span style={{ fontWeight: 700, color: hi ? '#d97706' : TXT }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .qc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .qc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); align-items: start; }
        .qc-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 960px) { .qc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: TXT, fontWeight: 700 }}>Quantum du CAN → résolution en température</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`qc-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : exploration}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && (
        <div className="qc-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Diminuez le nombre de bits : que devient le quantum ? Et la résolution en température ?</li>
              <li>Déplacez le curseur sur la courbe : la résolution est-elle la même à toutes les températures ? Pourquoi ?</li>
              <li>Comparez les modèles d'ordre 1, 2 et 3 : la résolution calculée change-t-elle ? Lequel passe le mieux par les points ?</li>
              <li>Réduisez la plage du CAN (V<sub>max</sub> plus petite) : que devient le quantum ?</li>
              <li>Collez vos propres mesures de TP.</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
      )}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
