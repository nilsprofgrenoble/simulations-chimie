import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle } from "../commun";

// ====================================================
// SIM 17 — THÉORÈME DE BERNOULLI (TSTL)
// ====================================================

export const BERN_RHO = 1000;    // kg/m3
export const BERN_G = 9.81;      // m/s2
export const BERN_MU = 1.0e-3;   // Pa.s (eau à 20 °C)
export const BERN_DIAMETRES = [10, 16, 20, 25, 32, 40]; // mm (diamètres intérieurs)
export const BERN_K = {
  coude:  { label: 'Coude 90°',            K: 0.9 },
  vanne:  { label: 'Vanne ouverte',        K: 0.2 },
  clapet: { label: 'Clapet anti-retour',   K: 2.0 },
  filtre: { label: 'Filtre',               K: 5.0 },
};
// Une couleur par terme de la relation de Bernoulli, partagée par l'équation,
// le diagramme et le schéma.
export const BERN_C = {
  p:      '#7c3aed', // pression
  pot:    '#2563eb', // énergie potentielle
  cin:    '#f59e0b', // énergie cinétique
  pompe:  '#16a34a', // apport de la pompe
  lin:    '#dc2626', // pertes linéiques
  sing:   '#f87171', // pertes singulières
};

export function bernCalc(p) {
  const Q = p.qvLh / 1000 / 3600;           // m3/s
  const D = p.dMm / 1000;                   // m
  const S = Math.PI * D * D / 4;            // m2
  const v = Q / S;                          // m/s
  const Re = BERN_RHO * v * D / BERN_MU;
  const lambda = Re <= 0 ? 0 : (Re < 2000 ? 64 / Re : 0.316 * Math.pow(Re, -0.25));
  const regime = Re < 2000 ? 'laminaire' : (Re < 4000 ? 'transitoire' : 'turbulent');
  const qdyn = 0.5 * BERN_RHO * v * v;      // Pa
  const dpParMetre = lambda / D * qdyn;     // Pa/m
  const dpLin = dpParMetre * p.longueur;    // Pa
  const sing = Object.keys(BERN_K).map(k => ({
    key: k, label: BERN_K[k].label, K: BERN_K[k].K, n: p.n[k] || 0,
    dp: (p.n[k] || 0) * BERN_K[k].K * qdyn,
  }));
  const dpSing = sing.reduce((s, x) => s + x.dp, 0);
  const dpCharge = dpLin + dpSing;
  const Epot = BERN_RHO * BERN_G * p.dz;    // Pa (z_A = 0)
  const Ecin = qdyn;                        // Pa (v_A négligeable)
  const Wp = Epot + Ecin + dpCharge;        // Pa = J/m3
  const Phyd = Wp * Q;                      // W
  const Pabs = Phyd / (p.eta / 100);        // W
  return { Q, D, S, v, Re, lambda, regime, qdyn, dpParMetre, dpLin, sing,
           dpSing, dpCharge, Epot, Ecin, Wp, Phyd, Pabs };
}

export function bernFmt(x, d = 2) {
  if (!isFinite(x)) return '—';
  return x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

// Débit (L/h) pour lequel le circuit consomme exactement la puissance hydraulique
// fournie par la pompe. P_hyd croît avec Q_V : une dichotomie suffit.
export function bernDebitPourPuissance(base, PhydCible) {
  let lo = 0, hi = 100000;
  if (bernCalc({ ...base, qvLh: hi }).Phyd < PhydCible) return hi;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (bernCalc({ ...base, qvLh: mid }).Phyd < PhydCible) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ── Exercices : générateur reproductible à partir d'un code ──
// Générateur pseudo-aléatoire déterministe (mulberry32) : un même code
// redonne exactement le même exercice à tous les élèves.
export function bernRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Les situations physiques : chacune change la carte d'identité de A ou de B.
// La situation 'surface' (B à la surface du réservoir B, perte de sortie K = 1)
// est programmée mais désactivée : trop subtile en TSTL. L'ajouter à la liste
// pour la réactiver (BTS par exemple).
export const BERN_SITUATIONS = ['base', 'pression', 'aspiration', 'colonne'];

// Carte d'identité correcte de chaque situation (P, z, v pour A puis B)
export const BERN_CARTES = {
  base:       { PA: 'atm', zA: '0', vA: '0',  PB: 'atm', zB: 'dz', vB: 'qs' },
  pression:   { PA: 'atm', zA: '0', vA: '0',  PB: 'don', zB: 'dz', vB: 'qs' },
  aspiration: { PA: 'don', zA: '0', vA: 'qs', PB: 'atm', zB: 'dz', vB: 'qs' },
  colonne:    { PA: 'atm', zA: '0', vA: 'qs', PB: 'atm', zB: 'dz', vB: 'qs' },
  surface:    { PA: 'atm', zA: '0', vA: '0',  PB: 'atm', zB: 'dz', vB: '0' },
};

// Exercice d'un niveau donné (1 facile → 4 très difficile), entièrement
// déterminé par (niveau, graine). V contient les valeurs attendues, calculées
// à partir des données telles qu'elles sont affichées dans l'énoncé.
export function bernExercice(niveau, graine) {
  const rnd = bernRng(graine * 7919 + niveau * 104729 + 17);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  // Les situations possibles dépendent du niveau : cas de base seul en facile,
  // réservoir B fermé en plus en intermédiaire, toutes ensuite.
  const situationsPossibles = niveau === 1 ? ['base'] : niveau === 2 ? ['base', 'pression'] : BERN_SITUATIONS;
  const situation = pick(situationsPossibles);
  let dernier = null;

  for (let essai = 0; essai < 300; essai++) {
    // Débit choisi pour une vitesse réaliste dans le tuyau (0,6 à 2,2 m/s)
    const dMm = pick([16, 20, 25, 32]);
    const S = Math.PI * (dMm / 1000) ** 2 / 4;
    const vCible = 0.6 + rnd() * 1.6;
    const qvLh = Math.max(100, Math.round(vCible * S * 3.6e6 / 50) * 50);
    const base = {
      dz: pick([2, 3, 4, 5, 6, 8, 10, 12, 15]), qvLh, dMm, longueur: pick([5, 8, 10, 12, 15, 20, 25]),
      n: { coude: pick([1, 2, 3, 4]), vanne: pick([0, 1]), clapet: pick([0, 1]), filtre: pick([0, 0, 1]) },
      eta: pick([40, 50, 60, 70, 75]),
    };
    const r0 = bernCalc(base);
    const qdyn = r0.qdyn;
    const exo = { ...base, niveau, graine, situation };
    const V = { Q: r0.Q, S: r0.S, v: r0.v };

    // Pressions relatives (par rapport à P_atm), en Pa
    exo.pA = situation === 'aspiration' ? pick([10, 15, 20, 25]) * 1000 : 0;
    exo.pB = situation === 'pression' ? pick([20, 30, 40, 50, 80]) * 1000 : 0;
    V.dpress = exo.pB - exo.pA;

    // Vitesses en A et en B
    if (situation === 'colonne') {
      exo.dAmm = Math.round(dMm * pick([1.5, 1.75, 2]));
      V.SA = Math.PI * (exo.dAmm / 1000) ** 2 / 4;
      V.vA = V.Q / V.SA;
      V.ecinA = 0.5 * BERN_RHO * V.vA ** 2;
    } else if (situation === 'aspiration') {
      V.vA = r0.v; V.ecinA = qdyn;            // même tuyau : s'annule avec ½·ρ·v_B²
    } else {
      V.vA = 0; V.ecinA = 0;
    }
    V.ecin = situation === 'surface' ? 0 : qdyn;

    // Pertes de charge (la sortie dans un réservoir compte pour K = 1)
    // Comme en STL, chaque singularité est donnée par sa perte en Pa, sans lien
    // apparent avec le débit (valeurs arrondies, réalistes pour ce débit).
    exo.dpUnit = Object.fromEntries(Object.keys(BERN_K).map(kk =>
      [kk, Math.max(10, Math.round(BERN_K[kk].K * qdyn / 10) * 10)]));
    if (situation === 'surface') exo.dpUnit.sortie = Math.max(10, Math.round(qdyn / 10) * 10);
    V.dpSing = Object.keys(BERN_K).reduce((t, kk) => t + (base.n[kk] || 0) * exo.dpUnit[kk], 0)
      + (situation === 'surface' ? exo.dpUnit.sortie : 0);
    if (niveau <= 2) {
      V.dp = Math.round((r0.dpLin + V.dpSing) / 10) * 10;   // donné à 0,01 kPa près
    } else {
      exo.jDonne = Math.round(r0.dpParMetre);
      V.dpLin = exo.jDonne * base.longueur;
      V.dp = V.dpLin + V.dpSing;
    }

    if (niveau < 4) {
      V.epot = BERN_RHO * BERN_G * base.dz;
      V.wp = V.dpress + V.epot + V.ecin - V.ecinA + V.dp;
      V.phyd = V.wp * V.Q;
      V.pabs = V.phyd / (base.eta / 100);
    } else {
      const wp0 = V.dpress + BERN_RHO * BERN_G * base.dz + V.ecin - V.ecinA + V.dp;
      exo.pabs = Math.round(wp0 * V.Q / (base.eta / 100) * 10) / 10;
      V.pabs = exo.pabs;
      V.phyd = exo.pabs * base.eta / 100;
      V.wp = V.phyd / V.Q;
      V.epot = V.wp - V.dpress - V.ecin + V.ecinA - V.dp;
      V.dz = V.epot / (BERN_RHO * BERN_G);
      exo.dz = V.dz;
    }
    exo.V = V;
    dernier = exo;

    // Garde-fous de réalisme : pertes entre 5 % et 45 % de l'apport de la pompe,
    // puissance hydraulique d'au moins 2 W, énergie potentielle positive.
    const part = V.dp / V.wp;
    if (V.v >= 0.5 && V.v <= 2.5 && part >= 0.05 && part <= 0.45 && V.phyd >= 2 && V.epot > 0
      && (niveau < 4 || V.dz >= 1.5)) return exo;
  }
  return dernier;
}

export const BERN_NIVEAUX = [
  { n: 1, nom: 'Facile', c: '#16a34a',
    desc: "Carte d'identité, puis chaque calcul pas à pas. Indices à chaque étape." },
  { n: 2, nom: 'Intermédiaire', c: '#0ea5e9',
    desc: "Moins d'étapes intermédiaires. Indices disponibles." },
  { n: 3, nom: 'Difficile', c: '#d97706',
    desc: "Les pertes de charge sont à calculer à partir d'un document. Pas d'indice." },
  { n: 4, nom: 'Très difficile', c: '#dc2626',
    desc: 'Problème inverse : on connaît la pompe, on cherche la hauteur maximale. Pas d\'indice.' },
];

export function bernCode(exo) { return `${exo.niveau}-${String(exo.graine).padStart(4, '0')}`; }
export function bernLireCode(txt) {
  const m = String(txt).trim().match(/^([1-4])\s*[-–]?\s*(\d{1,4})$/);
  return m ? { niveau: +m[1], graine: +m[2] } : null;
}

// ── Nombres en notation scientifique, pour les corrections ──
export function bernExposant(e) {
  const c = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  return (e < 0 ? '⁻' : '') + String(Math.abs(e)).split('').map(d => c[+d]).join('');
}
export function bernSci(x, sig = 4) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e < -2) return `${(x / 10 ** e).toFixed(sig - 1).replace('.', ',')} × 10${bernExposant(e)}`;
  return bernFmt(x, Math.min(4, Math.max(0, sig - 1 - e)));
}

// Mot de passe de l'espace enseignant. ATTENTION : le code du site est public
// (dépôt GitHub) ; ce mot de passe dissuade les élèves, il ne protège rien.
export const BERN_MDP_PROF = 'argouges';

// Relation de Bernoulli simplifiée propre à une situation
export function bernRelationDe(st) {
  const pAtm = st !== 'pression' && st !== 'aspiration';
  const cinA = st === 'colonne';
  const cinB = st !== 'surface' && st !== 'aspiration';
  const droite = [
    !pAtm && <>(P<sub>B</sub> − P<sub>A</sub>)</>,
    <>ρ·g·z<sub>B</sub></>,
    cinB && <>½·ρ·v<sub>B</sub>²</>,
  ].filter(Boolean);
  return (
    <>P<sub>hyd</sub>/Q<sub>V</sub>{cinA && <> + ½·ρ·v<sub>A</sub>²</>} − ΔP<sub>charge</sub> = {droite.map((t, i) => (
      <span key={i}>{i > 0 && ' + '}{t}</span>
    ))}</>
  );
}

// Correction détaillée d'un exercice : liste d'étapes { titre, calcul }
export function bernCorrection(ex) {
  const V = ex.V, st = ex.situation, nv = ex.niveau, eta = ex.eta / 100;
  const F = bernSci;
  const pAtm = st !== 'pression' && st !== 'aspiration';
  const cinA = st === 'colonne';
  const annul = st === 'aspiration';
  const cinB = st !== 'surface' && !annul;
  const rr = bernCalc(ex);
  const singus = [
    ...rr.sing.filter(x => x.n > 0).map(x => ({ n: x.n, dp: ex.dpUnit[x.key] })),
    ...(st === 'surface' ? [{ n: 1, dp: ex.dpUnit.sortie }] : []),
  ];
  const L = [];
  L.push({ titre: <>Débit en m³·s⁻¹</>,
    calcul: <>Q<sub>V</sub> = {ex.qvLh} × 10⁻³ / 3600 = <strong>{F(V.Q)} m³·s⁻¹</strong></> });
  L.push({ titre: <>Section du tuyau</>,
    calcul: <>S = π·D²/4 = π × ({F(ex.dMm / 1000)})² / 4 = <strong>{F(V.S)} m²</strong></> });
  L.push({ titre: <>Vitesse dans le tuyau</>,
    calcul: <>v = Q<sub>V</sub> / S = {F(V.Q)} / {F(V.S)} = <strong>{F(V.v, 3)} m·s⁻¹</strong>
      {cinB && <> : c'est v<sub>B</sub></>}{annul && <> : c'est à la fois v<sub>A</sub> et v<sub>B</sub></>}</> });
  if (cinA) {
    L.push({ titre: <>Section de la colonne</>,
      calcul: <>S<sub>A</sub> = π·D<sub>A</sub>²/4 = π × ({F(ex.dAmm / 1000)})² / 4 = <strong>{F(V.SA)} m²</strong></> });
    L.push({ titre: <>Vitesse en A</>,
      calcul: <>v<sub>A</sub> = Q<sub>V</sub> / S<sub>A</sub> = {F(V.Q)} / {F(V.SA)} = <strong>{F(V.vA, 3)} m·s⁻¹</strong></> });
    L.push({ titre: <>Terme ½·ρ·v<sub>A</sub>²</>,
      calcul: <>½·ρ·v<sub>A</sub>² = 0,5 × 1000 × ({F(V.vA, 3)})² = <strong>{F(V.ecinA, 3)} Pa</strong></> });
  }
  if (annul) {
    L.push({ titre: <>Termes cinétiques</>,
      calcul: <>v<sub>A</sub> = v<sub>B</sub> (même tuyau) : ½·ρ·v<sub>A</sub>² et ½·ρ·v<sub>B</sub>² s'annulent. Inutile de les calculer.</> });
  }
  if (!pAtm) {
    L.push({ titre: <>Terme de pression</>,
      calcul: <>P<sub>B</sub> − P<sub>A</sub> = (P<sub>atm</sub> + {F(ex.pB)}) − (P<sub>atm</sub> + {F(ex.pA)}) = <strong>{F(V.dpress)} Pa</strong></> });
  }
  if (nv < 4) {
    L.push({ titre: <>Terme ρ·g·z<sub>B</sub></>,
      calcul: <>ρ·g·z<sub>B</sub> = 1000 × 9,81 × {bernFmt(ex.dz, 1)} = <strong>{F(V.epot)} Pa</strong></> });
  }
  if (cinB) {
    L.push({ titre: <>Terme ½·ρ·v<sub>B</sub>²</>,
      calcul: <>½·ρ·v<sub>B</sub>² = 0,5 × 1000 × ({F(V.v, 3)})² = <strong>{F(V.ecin)} Pa</strong></> });
  }
  if (nv <= 2) {
    L.push({ titre: <>Pertes de charge</>,
      calcul: <>ΔP<sub>charge</sub> = {bernFmt(V.dp / 1000, 2)} kPa = <strong>{F(V.dp)} Pa</strong> (donné)</> });
  } else {
    L.push({ titre: <>Pertes linéiques</>,
      calcul: <>j × L = {F(ex.jDonne)} × {ex.longueur} = <strong>{F(V.dpLin)} Pa</strong></> });
    L.push({ titre: <>Pertes singulières</>,
      calcul: <>Σ n × ΔP = {singus.map((x, i) => <span key={i}>{i > 0 && ' + '}{x.n} × {F(x.dp)}</span>)} = <strong>{F(V.dpSing)} Pa</strong></> });
    L.push({ titre: <>Pertes de charge totales</>,
      calcul: <>ΔP<sub>charge</sub> = {F(V.dpLin)} + {F(V.dpSing)} = <strong>{F(V.dp)} Pa</strong></> });
  }
  // Termes du membre de droite une fois P_hyd/Q_V isolé (sym : signe devant le terme)
  const termes = [
    !pAtm && { lab: <>(P<sub>B</sub> − P<sub>A</sub>)</>, val: V.dpress, sym: 1, paren: true },
    nv < 4 && { lab: <>ρ·g·z<sub>B</sub></>, val: V.epot, sym: 1 },
    cinB && { lab: <>½·ρ·v<sub>B</sub>²</>, val: V.ecin, sym: 1 },
    cinA && { lab: <>½·ρ·v<sub>A</sub>²</>, val: V.ecinA, sym: -1 },
    { lab: <>ΔP<sub>charge</sub></>, val: V.dp, sym: 1 },
  ].filter(Boolean);
  // Écrit « a + b − c » en symboles ou en nombres ; inverser : pour passer les termes de l'autre côté
  const ecrire = (lst, nombres, inverser = false, premier = true) => lst.map((t, i) => {
    const sgn = t.sym * (inverser ? -1 : 1);
    const op = i === 0 && premier ? (sgn < 0 ? '− ' : '') : (sgn < 0 ? ' − ' : ' + ');
    const contenu = nombres ? (t.paren && t.val < 0 ? `(${F(t.val)})` : F(t.val)) : t.lab;
    return <span key={i}>{op}{contenu}</span>;
  });
  if (nv < 4) {
    L.push({ titre: <>Isoler P<sub>hyd</sub>/Q<sub>V</sub></>,
      calcul: <>P<sub>hyd</sub>/Q<sub>V</sub> = {ecrire(termes, false)} = {ecrire(termes, true)} = <strong>{F(V.wp)} Pa</strong></> });
    L.push({ titre: <>Puissance hydraulique</>,
      calcul: <>P<sub>hyd</sub> = (P<sub>hyd</sub>/Q<sub>V</sub>) × Q<sub>V</sub> = {F(V.wp)} × {F(V.Q)} = <strong>{F(V.phyd, 3)} W</strong></> });
    L.push({ titre: <>Puissance absorbée</>,
      calcul: <>P<sub>abs</sub> = P<sub>hyd</sub> / η = {F(V.phyd, 3)} / {bernFmt(eta, 2)} = <strong>{F(V.pabs, 3)} W</strong></> });
  } else {
    L.push({ titre: <>Puissance hydraulique</>,
      calcul: <>P<sub>hyd</sub> = η × P<sub>abs</sub> = {bernFmt(eta, 2)} × {bernFmt(ex.pabs, 1)} = <strong>{F(V.phyd, 3)} W</strong></> });
    L.push({ titre: <>Terme P<sub>hyd</sub>/Q<sub>V</sub></>,
      calcul: <>P<sub>hyd</sub>/Q<sub>V</sub> = {F(V.phyd, 3)} / {F(V.Q)} = <strong>{F(V.wp)} Pa</strong></> });
    L.push({ titre: <>Isoler ρ·g·z<sub>B</sub></>,
      calcul: <>ρ·g·z<sub>B</sub> = P<sub>hyd</sub>/Q<sub>V</sub>{ecrire(termes, false, true, false)} = {F(V.wp)}{ecrire(termes, true, true, false)} = <strong>{F(V.epot)} Pa</strong></> });
    L.push({ titre: <>Hauteur maximale</>,
      calcul: <>Δz = ρ·g·z<sub>B</sub> / (ρ·g) = {F(V.epot)} / 9810 = <strong>{F(V.dz, 3)} m</strong></> });
  }
  return L;
}

export function SimulationBernoulli({ plotlyReady }) {
  const [mode, setMode] = useState('explore'); // 'explore' | 'exercice'
  const [dz, setDz] = useState(5);
  const [qvLh, setQvLh] = useState(600);
  const [dMm, setDMm] = useState(16);
  const [longueur, setLongueur] = useState(10);
  const [n, setN] = useState({ coude: 4, vanne: 1, clapet: 1, filtre: 0 });
  const [eta, setEta] = useState(60);
  const [impose, setImpose] = useState('debit'); // 'debit' | 'pompe'
  const [pabs, setPabs] = useState(20);          // W, si la pompe est imposée
  // Terme survolé : 'p' | 'zA' | 'vA' | 'pompe' | 'pertes' | 'zB' | 'vB' | null
  const [survol, setSurvol] = useState(null);
  const [ouverts, setOuverts] = useState({ reglages: true, resultats: false, detail: false, enonce: false });

  // Mode exercice
  const [exo, setExo] = useState(null);        // null : choix du niveau
  const [carte, setCarte] = useState({});      // carte d'identité : { PA: 'atm', zA: '0', … }
  const [reps, setReps] = useState({});        // réponses numériques
  const [aides, setAides] = useState({});      // indices affichés
  const [verifs, setVerifs] = useState({});    // étape vérifiée (affiche ✅ / ❌)
  const [valides, setValides] = useState({});  // étape réussie : 1, 2, 3
  const [reveles, setReveles] = useState({});  // étapes dont la correction a été affichée
  const [codeSaisi, setCodeSaisi] = useState('');
  const [codeErreur, setCodeErreur] = useState(false);
  // Espace enseignant
  const [profOuvert, setProfOuvert] = useState(false);
  const [profCode, setProfCode] = useState('');
  const [profMdp, setProfMdp] = useState('');
  const [profErreur, setProfErreur] = useState('');
  const [exoCorr, setExoCorr] = useState(null);   // exercice dont on affiche la correction

  const qvPompe = bernDebitPourPuissance({ dz, dMm, longueur, n, eta }, pabs * eta / 100);
  const qvEff = impose === 'pompe' ? qvPompe : qvLh;
  const params = mode === 'exercice' && exo ? exo
    : { dz, qvLh: qvEff, dMm, longueur, n, eta };
  const r = bernCalc(params);

  function demarrerExo(niveau, graine = Math.floor(Math.random() * 10000)) {
    setExo(bernExercice(niveau, graine));
    setCarte({}); setReps({}); setAides({}); setVerifs({}); setValides({}); setReveles({});
    setCodeSaisi(''); setCodeErreur(false);
    setOuverts(o => ({ ...o, st1: true, st2: false, st3: false, enonce: false, resultats: false, detail: false }));
  }
  function ouvrirCode() {
    const c = bernLireCode(codeSaisi);
    if (c) demarrerExo(c.niveau, c.graine); else setCodeErreur(true);
  }
  function changerMode(m) { setMode(m); setSurvol(null); }
  function ouvrirCorrection() {
    if (profMdp !== BERN_MDP_PROF) { setProfErreur('Mot de passe incorrect.'); return; }
    const c = bernLireCode(profCode);
    if (!c) { setProfErreur('Code non reconnu : il s\'écrit « niveau-numéro », par exemple 2-4827.'); return; }
    setExoCorr(bernExercice(c.niveau, c.graine));
  }

  const enExo = mode === 'exercice' && !!exo;
  const niv = exo ? exo.niveau : 0;
  const Vx = exo ? exo.V : null;
  const sit = enExo ? exo.situation : 'base';
  const termine = enExo && !!valides[3];
  const afficherBilan = mode === 'explore' || termine;
  const simplifie = mode === 'explore' || !!valides[1];   // carte d'identité validée

  // Ce que la situation implique pour la relation de Bernoulli
  const pressionsAtm = sit !== 'pression' && sit !== 'aspiration';
  const cinAnnulees = sit === 'aspiration';                // v_A = v_B (même tuyau)
  const cinA = sit === 'colonne';                          // ½·ρ·v_A² non nul
  const cinB = sit !== 'surface' && !cinAnnulees;          // ½·ρ·v_B² à calculer

  // ── Survol : relie un terme, sa barre et l'élément du schéma ──
  const ev = id => ({
    onMouseEnter: () => setSurvol(id),
    onMouseLeave: () => setSurvol(null),
    onClick: () => setSurvol(s => (s === id ? null : id)),
  });
  const dim = ids => {
    const liste = Array.isArray(ids) ? ids : [ids];
    return survol && !liste.includes(survol) ? 0.3 : 1;
  };
  // En exercice, pas de surbrillance « réponse » avant la carte d'identité
  const hl = id => survol === id && !(enExo && !simplifie && ['p', 'zA', 'vA', 'vB'].includes(id));

  // ── Styles ──
  const TXT = '#0f172a', TXT2 = '#334155', BORDER = '#cbd5e1', BG = '#f8fafc';
  const box = { background: BG, borderRadius: 10, padding: '10px 12px', border: `1px solid ${BORDER}` };
  const titreBox = { fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 6 };
  const lab = { fontSize: 12, color: TXT2, fontWeight: 700, marginBottom: 3 };
  const inp = { fontSize: 13, padding: '5px 9px', border: `1.5px solid ${BORDER}`,
    borderRadius: 6, background: 'white', color: TXT };
  const btn = (actif, c = '#2a9d8f') => ({ padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 13, border: `1.5px solid ${actif ? c : BORDER}`,
    background: actif ? c : 'white', color: actif ? 'white' : TXT2 });
  const petitBtn = (actif, c) => ({ ...btn(actif, c), padding: '4px 10px', fontSize: 12 });
  const aideStyle = { fontSize: 12, color: TXT, background: '#fffbeb', border: '1px solid #fcd34d',
    borderRadius: 6, padding: '5px 8px', marginTop: 4, lineHeight: 1.55 };

  function slider(label, value, set, min, max, step, unite) {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', ...lab }}>
          <span>{label}</span><span style={{ color: TXT }}>{bernFmt(value, step < 1 ? 1 : 0)} {unite}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => set(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#2a9d8f', cursor: 'pointer' }}/>
      </div>
    );
  }

  function section(id, titre, contenu) {
    return (
      <div key={id} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: BG, marginBottom: 8 }}>
        <button onClick={() => setOuverts(o => ({ ...o, [id]: !o[id] }))}
          aria-expanded={!!ouverts[id]}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 14, color: TXT, textAlign: 'left' }}>
          <span>{titre}</span>
          <span style={{ fontSize: 11, color: TXT2 }}>{ouverts[id] ? '▲' : '▼'}</span>
        </button>
        {ouverts[id] && <div style={{ padding: '0 12px 12px' }}>{contenu}</div>}
      </div>
    );
  }

  // ════════════════ SCHÉMA DU CIRCUIT ════════════════
  const P = params;
  const W = 600, H = 290;
  const yTuyau = 238, xPompe = 250;
  const epaisseur = 3 + P.dMm / 3;
  const dur = Math.max(0.25, Math.min(6, 1.5 / Math.max(r.v, 0.01)));

  // Réservoir A : large, ou colonne étroite
  const colonneA = sit === 'colonne';
  const xA0 = colonneA ? 100 : 30, xA1 = colonneA ? 152 : 170;
  const bordA = colonneA ? 110 : 140, fondA = 255;
  const ySurfA = colonneA ? 165 : 180;
  // Point A : surface libre, ou manomètre sur le tuyau d'aspiration
  const ptA = sit === 'aspiration' ? { x: 205, y: yTuyau } : { x: colonneA ? xA0 + 18 : (xA0 + xA1) / 2, y: ySurfA };
  const yRef = ptA.y;                                  // z = 0

  // Au niveau 4, Δz est l'inconnue : on la dessine à une hauteur arbitraire
  const dzDessin = enExo && niv === 4 && !termine ? 8 : P.dz;
  const echelle = Math.min(8, (yRef - 55) / Math.max(dzDessin, 1));
  const yBpt = yRef - dzDessin * echelle;              // niveau du point B

  const surfB = sit === 'surface';
  const xMontee = 440;
  const xSortie = surfB ? 500 : 520;
  const yHaut = surfB ? yBpt - 32 : yBpt - 24;
  const yFinTuyau = surfB ? yBpt + 26 : yBpt;          // sortie noyée ou à l'air libre
  const ptB = surfB ? { x: 560, y: yBpt } : { x: xSortie, y: yBpt };
  // Réservoir B
  const bxB0 = surfB ? 455 : 470, bxB1 = 585;
  const bSurf = surfB ? yBpt : yBpt + 48;
  const bBord = sit === 'pression' ? yBpt - 12 : surfB ? yBpt - 18 : yBpt + 16;
  const bFond = surfB ? yBpt + 56 : yBpt + 76;

  const chemin = `M ${xA1} ${yTuyau} L ${xPompe - 18} ${yTuyau} M ${xPompe + 18} ${yTuyau} L ${xMontee} ${yTuyau} `
    + `L ${xMontee} ${yHaut} L ${xSortie} ${yHaut} L ${xSortie} ${yFinTuyau}`;
  const coudes = [[xMontee, yTuyau], [xMontee, yHaut], [xSortie, yHaut]];

  const surfaceLibre = (x, y) => (
    <g stroke={TXT} strokeWidth="1.3" fill="none">
      <polygon points={`${x - 6},${y - 11} ${x + 6},${y - 11} ${x},${y - 2}`}/>
      <line x1={x - 6} y1={y + 4} x2={x + 6} y2={y + 4}/>
      <line x1={x - 3} y1={y + 8} x2={x + 3} y2={y + 8}/>
    </g>
  );
  const manometre = (x, yPied, yCadran, etiquette) => (
    <g>
      <line x1={x} y1={yPied} x2={x} y2={yCadran + 10} stroke={TXT} strokeWidth="2"/>
      <circle cx={x} cy={yCadran} r="10" fill="white" stroke={TXT} strokeWidth="2"/>
      <line x1={x} y1={yCadran} x2={x + 6} y2={yCadran - 5} stroke="#dc2626" strokeWidth="1.8"/>
      <text x={x + 14} y={yCadran + 4} fontSize="11" fill={TXT2}>{etiquette}</text>
    </g>
  );

  const libellePression = pt => (pt === 'A' ? (sit === 'aspiration') : (sit === 'pression'))
    ? 'manomètre' : <>air : P<tspan dy="4" fontSize="10">atm</tspan></>;
  const texteVitesse = pt => {
    if (pt === 'A') {
      if (sit === 'colonne') return <>colonne étroite : v<tspan dy="4" fontSize="10">A</tspan><tspan dy="-4"> non négligeable</tspan></>;
      if (sit === 'aspiration') return <>dans le tuyau : v<tspan dy="4" fontSize="10">A</tspan><tspan dy="-4"> = v</tspan><tspan dy="4" fontSize="10">B</tspan></>;
      return <>surface très large : v<tspan dy="4" fontSize="10">A</tspan><tspan dy="-4"> ≈ 0</tspan></>;
    }
    if (surfB) return <>surface très large : v<tspan dy="4" fontSize="10">B</tspan><tspan dy="-4"> ≈ 0</tspan></>;
    return <>v<tspan dy="4" fontSize="10">B</tspan><tspan dy="-4"> = {bernFmt(r.v, 2)} m·s⁻¹</tspan></>;
  };

  const schema = (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Circuit hydraulique entre deux réservoirs"
      style={{ width: '100%', height: 'auto', maxHeight: '44vh', display: 'block',
        background: 'white', borderRadius: 8, border: `1px solid ${BORDER}` }}>
      <defs>
        <marker id="bernFl" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill={TXT}/>
        </marker>
      </defs>

      {/* Réservoir A : eau sous la surface libre, air au-dessus */}
      <rect x={xA0} y={ySurfA} width={xA1 - xA0} height={fondA - ySurfA} fill="#bfdbfe"/>
      <line x1={xA0} y1={ySurfA} x2={xA1} y2={ySurfA} stroke="#1d4ed8" strokeWidth="1.5"/>
      <path d={`M ${xA0} ${bordA} L ${xA0} ${fondA} L ${xA1} ${fondA} L ${xA1} ${bordA}`}
        fill="none" stroke={TXT} strokeWidth="3" strokeLinejoin="round"/>
      {surfaceLibre(colonneA ? xA1 - 11 : 62, ySurfA)}
      {colonneA && (
        <g>
          <line x1={xA0} y1={bordA - 10} x2={xA1} y2={bordA - 10} stroke={TXT} strokeWidth="1"
            markerStart="url(#bernFl)" markerEnd="url(#bernFl)"/>
          <text x={(xA0 + xA1) / 2} y={bordA - 16} fontSize="11" fill={TXT2} textAnchor="middle">
            D<tspan dy="3" fontSize="8">A</tspan>
          </text>
        </g>
      )}

      {/* Réservoir B */}
      {sit === 'pression' && (
        <rect x={bxB0} y={bBord} width={bxB1 - bxB0} height={bSurf - bBord} fill="#ede9fe"/>
      )}
      <rect x={bxB0} y={bSurf} width={bxB1 - bxB0} height={bFond - bSurf} fill="#bfdbfe"/>
      <line x1={bxB0} y1={bSurf} x2={bxB1} y2={bSurf} stroke="#1d4ed8" strokeWidth="1.5"/>
      <path d={sit === 'pression'
        ? `M ${bxB0} ${bBord} L ${bxB0} ${bFond} L ${bxB1} ${bFond} L ${bxB1} ${bBord} Z`
        : `M ${bxB0} ${bBord} L ${bxB0} ${bFond} L ${bxB1} ${bFond} L ${bxB1} ${bBord}`}
        fill="none" stroke={TXT} strokeWidth="3" strokeLinejoin="round"/>
      {sit !== 'pression' && surfaceLibre(surfB ? 480 : 562, bSurf)}
      {sit === 'pression' && manometre(565, bBord, bBord - 22, '')}
      {/* Jet à l'air libre */}
      {!surfB && (
        <line x1={xSortie} y1={yBpt} x2={xSortie} y2={bSurf} stroke="#1d4ed8" strokeWidth={Math.max(2, epaisseur / 2)}
          strokeDasharray="4 5">
          <animate attributeName="stroke-dashoffset" from="0" to="-18" dur={`${dur / 2}s`} repeatCount="indefinite"/>
        </line>
      )}

      {/* Canalisation */}
      <path d={chemin} fill="none" stroke="#475569" strokeWidth={epaisseur + 3} strokeLinejoin="round"/>
      <path d={chemin} fill="none" stroke="#93c5fd" strokeWidth={epaisseur} strokeLinejoin="round"/>
      <path d={chemin} fill="none" stroke="#1d4ed8" strokeWidth={Math.max(2, epaisseur / 3)}
        strokeDasharray="6 12" strokeLinejoin="round">
        <animate attributeName="stroke-dashoffset" from="0" to="-36" dur={`${dur}s`} repeatCount="indefinite"/>
      </path>
      {sit === 'aspiration' && manometre(ptA.x, yTuyau - epaisseur / 2, yTuyau - 40, '')}

      {/* Pompe */}
      <g {...ev('pompe')} style={{ cursor: 'pointer' }}>
        <circle cx={xPompe} cy={yTuyau} r="18" fill="white" stroke={TXT} strokeWidth="2.5"/>
        <polygon points={`${xPompe - 8},${yTuyau - 10} ${xPompe + 14},${yTuyau} ${xPompe - 8},${yTuyau + 10}`} fill={BERN_C.pompe}/>
      </g>
      <text x={xPompe} y={yTuyau + 43} fontSize="19" textAnchor="middle" fill={TXT} fontWeight="700">pompe</text>

      {/* Points A et B */}
      <circle cx={ptA.x} cy={ptA.y} r="5" fill={TXT}/>
      <text x={ptA.x + (sit === 'aspiration' ? -16 : 0)} y={ptA.y + (sit === 'aspiration' ? 30 : -11)}
        fontSize="24" fontWeight="700" fill={TXT} textAnchor="middle">A</text>
      <circle cx={ptB.x} cy={ptB.y} r="5" fill={TXT}/>
      <text x={ptB.x - 11} y={ptB.y + (surfB ? -7 : 8)} fontSize="24" fontWeight="700" fill={TXT} textAnchor="end">B</text>

      {/* Dénivelé entre A et B */}
      <line x1={ptA.x + 6} y1={yRef} x2="395" y2={yRef} stroke={TXT} strokeWidth="0.8" strokeDasharray="3 3"/>
      <line x1="380" y1={yBpt} x2={ptB.x} y2={yBpt} stroke={TXT} strokeWidth="0.8" strokeDasharray="3 3"/>
      {dzDessin > 0 && (
        <line x1="388" y1={yRef} x2="388" y2={yBpt} stroke={TXT} strokeWidth="1.2"
          markerStart="url(#bernFl)" markerEnd="url(#bernFl)"/>
      )}
      <text x="380" y={Math.min((yRef + yBpt) / 2 + 7, yRef - 12)} fontSize="21" textAnchor="end" fill={TXT} fontWeight="700">
        Δz = {enExo && niv === 4 && !termine ? '?' : bernFmt(P.dz, 1)} m
      </text>

      {/* ── Surbrillances liées au terme survolé ── */}
      {hl('p') && (
        <g fontSize="17" fontWeight="700" fill={BERN_C.p}>
          <circle cx={ptA.x} cy={ptA.y} r="9" fill="none" stroke={BERN_C.p} strokeWidth="3"/>
          <circle cx={ptB.x} cy={ptB.y} r="9" fill="none" stroke={BERN_C.p} strokeWidth="3"/>
          <text x={ptA.x} y={sit === 'aspiration' ? yTuyau - 56 : bordA - 8} textAnchor="middle">{libellePression('A')}</text>
          <text x={ptB.x} y={sit === 'pression' ? bBord - 38 : yBpt - 14} textAnchor="middle">{libellePression('B')}</text>
        </g>
      )}
      {hl('zA') && (
        <g>
          <line x1={ptA.x} y1={yRef} x2="395" y2={yRef} stroke={BERN_C.pot} strokeWidth="3"/>
          <text x={ptA.x + 20} y={yRef - 6} fontSize="17" fontWeight="700" fill={BERN_C.pot}>z = 0 (origine)</text>
        </g>
      )}
      {hl('vA') && (
        <g>
          <circle cx={ptA.x} cy={ptA.y} r="9" fill="none" stroke={BERN_C.cin} strokeWidth="3"/>
          <text x={16} y={sit === 'aspiration' ? yTuyau - 60 : bordA - 26} fontSize="17" fontWeight="700" fill="#b45309">
            {texteVitesse('A')}
          </text>
        </g>
      )}
      {hl('pompe') && <circle cx={xPompe} cy={yTuyau} r="25" fill="none" stroke={BERN_C.pompe} strokeWidth="4"/>}
      {hl('pertes') && (
        <g>
          <path d={chemin} fill="none" stroke={BERN_C.lin} strokeWidth={epaisseur + 6}
            strokeLinejoin="round" opacity="0.55"/>
          {coudes.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="none" stroke={BERN_C.sing} strokeWidth="3"/>
          ))}
          <text x="275" y={yTuyau - 16} fontSize="16" fontWeight="700" fill={BERN_C.lin}>frottements dans le tuyau</text>
          <text x={xMontee - 12} y={yHaut - 10} fontSize="16" fontWeight="700" fill="#b91c1c" textAnchor="end">
            coudes, vannes…
          </text>
        </g>
      )}
      {hl('zB') && dzDessin > 0 && <line x1="388" y1={yRef} x2="388" y2={yBpt} stroke={BERN_C.pot} strokeWidth="5"/>}
      {hl('vB') && (
        <g>
          <circle cx={ptB.x} cy={ptB.y} r="9" fill="none" stroke={BERN_C.cin} strokeWidth="3"/>
          <text x={ptB.x} y={yBpt - 30} fontSize="17" fontWeight="700" fill="#b45309" textAnchor="middle">
            {texteVitesse('B')}
          </text>
        </g>
      )}
    </svg>
  );

  const hypotheses = {
    base: <>Réservoir A ouvert et jet à l'air libre : P<sub>A</sub> = P<sub>B</sub> = P<sub>atm</sub>.
      Surface de A très grande devant la section du tuyau : v<sub>A</sub> ≈ 0. Origine des altitudes à la surface de A : z<sub>A</sub> = 0.</>,
    pression: <>Surface de A à l'air libre : P<sub>A</sub> = P<sub>atm</sub>, v<sub>A</sub> ≈ 0, z<sub>A</sub> = 0.
      Réservoir B fermé : P<sub>B</sub> = P<sub>atm</sub> + surpression lue au manomètre.</>,
    aspiration: <>A sur le tuyau, au manomètre : P<sub>A</sub> = P<sub>atm</sub> + pression relative lue, z<sub>A</sub> = 0,
      v<sub>A</sub> = v<sub>B</sub> (même tuyau). Jet à l'air libre en B : P<sub>B</sub> = P<sub>atm</sub>.</>,
    colonne: <>Colonne A et jet à l'air libre : P<sub>A</sub> = P<sub>B</sub> = P<sub>atm</sub>. Colonne étroite :
      v<sub>A</sub> = Q<sub>V</sub>/S<sub>A</sub>, à calculer. Origine des altitudes à la surface de A : z<sub>A</sub> = 0.</>,
    surface: <>A et B sur les surfaces libres de deux grands réservoirs : P<sub>A</sub> = P<sub>B</sub> = P<sub>atm</sub>,
      v<sub>A</sub> ≈ 0 et v<sub>B</sub> ≈ 0. L'énergie cinétique du jet est perdue à la sortie du tuyau (K = 1).</>,
  };
  const descriptionPoints = {
    base: <>A : point de la surface libre du réservoir A, origine des altitudes. B : sortie du tuyau, d'où le jet tombe dans le réservoir B.</>,
    pression: <>A : point de la surface libre du réservoir A, origine des altitudes. B : sortie du tuyau, à l'intérieur du réservoir B fermé.</>,
    aspiration: <>A : point du tuyau d'aspiration où est branché le manomètre, origine des altitudes. B : sortie du tuyau, d'où le jet tombe dans le réservoir B.</>,
    colonne: <>A : point de la surface libre de la colonne A, origine des altitudes. B : sortie du tuyau, d'où le jet tombe dans le réservoir B.</>,
    surface: <>A : point de la surface libre du réservoir A, origine des altitudes. B : point de la surface libre du réservoir B, dans lequel le tuyau débouche.</>,
  };

  // ════════════════ EXERCICE : LES TROIS ÉTAPES DE LA MÉTHODE ════════════════
  const ok = (rep, vrai) => {
    const x = parseFloat(String(rep ?? '').replace(',', '.'));
    return isFinite(x) && Math.abs(x - vrai) <= Math.abs(vrai) * 0.03;
  };

  // Étape 1 : carte d'identité (P, z, v) de chaque point
  const OPTIONS = {
    P: [{ k: 'atm', l: <>P<sub>atm</sub></> }, { k: 'don', l: 'donnée' }, { k: 'inc', l: 'inconnue' }],
    z: [{ k: '0', l: '0' }, { k: 'dz', l: 'Δz' }, { k: 'inc', l: 'inconnue' }],
    v: [{ k: '0', l: '≈ 0' }, { k: 'qs', l: <>Q<sub>V</sub> / S</> }, { k: 'inc', l: 'inconnue' }],
  };
  const carteJuste = enExo ? { ...BERN_CARTES[sit], ...(niv === 4 ? { zB: 'inc' } : {}) } : {};
  const cellules = ['PA', 'zA', 'vA', 'PB', 'zB', 'vB'].map(id => ({
    id, pt: id[1], g: id[0], bon: carteJuste[id],
  }));
  const aideCarte = {
    A: {
      aspiration: <>A est sur le tuyau d'aspiration, là où est branché le manomètre. Que mesure ce manomètre ?
        Où a-t-on placé l'origine des altitudes ? L'eau circule dans le tuyau : peut-on calculer sa vitesse ?</>,
      colonne: <>A est sur la surface libre de la colonne. Est-elle au contact de l'air ? La colonne est étroite :
        comparez son diamètre à celui du tuyau. Sa surface descend-elle vraiment très lentement ?</>,
      autre: <>A est sur la surface libre du réservoir A. Est-elle au contact de l'air ? Où a-t-on placé l'origine
        des altitudes ? Le réservoir est très large devant le tuyau : à quelle vitesse sa surface descend-elle ?</>,
    },
    B: {
      pression: <>B est à la sortie du tuyau, à l'intérieur du réservoir B fermé. Est-il encore à la pression
        atmosphérique ? Qu'indique le manomètre du réservoir ? L'eau y sort à la vitesse qu'elle a dans le tuyau.</>,
      surface: <>B n'est pas à la sortie du tuyau : il est sur la surface libre du réservoir B. Est-elle au contact
        de l'air ? Ce réservoir est très large : à quelle vitesse sa surface monte-t-elle ?</>,
      autre: <>B est à la sortie du tuyau, là où le jet tombe à l'air libre. Son altitude est-elle donnée, ou est-ce
        ce que l'on cherche ? L'eau y sort à la vitesse qu'elle a dans le tuyau : peut-on la calculer ?</>,
    },
    general: <>Pour chaque point, posez-vous trois questions. P : le point est-il au contact de l'air, ou
      un manomètre donne-t-il sa pression ? z : où est l'origine des altitudes, et que donne l'énoncé ?
      v : le fluide y bouge-t-il vraiment, et peut-on calculer sa vitesse ?</>,
  };
  const aidePoint = pt => aideCarte[pt][sit] || aideCarte[pt].autre;

  // Étape 2 : calcul des termes, un par un
  const besoinV = cinB;   // la vitesse n'est utile que si ½·ρ·v_B² reste dans la relation
  const nomV = cinB ? <>v<sub>B</sub></> : <>v dans le tuyau</>;
  const etapes2 = !exo ? [] : [
    ...(niv === 1 && (besoinV || cinA) ? [
      { id: 'q', titre: <>Débit Q<sub>V</sub> en m³·s⁻¹</>, vrai: Vx.Q,
        aide: <>Convertissez : 1 L = 10⁻³ m³ et 1 h = 3600 s. Q<sub>V</sub> = {exo.qvLh} × 10⁻³ / 3600.</> },
    ] : []),
    ...(niv === 1 && besoinV ? [
      { id: 's', titre: <>Section S du tuyau en m²</>, vrai: Vx.S,
        aide: <>S = π·D²/4, avec D en mètres : D = {exo.dMm} mm = {bernFmt(exo.dMm / 1000, 3)} m.</> },
    ] : []),
    ...(besoinV ? [
      { id: 'v', titre: <>Vitesse {nomV} en m·s⁻¹</>, vrai: Vx.v,
        aide: <>v = Q<sub>V</sub> / S, avec Q<sub>V</sub> en m³·s⁻¹ et S = π·D²/4 (D en mètres).</> },
    ] : []),
    ...(cinA ? [
      ...(niv === 1 ? [{ id: 'sA', titre: <>Section S<sub>A</sub> de la colonne en m²</>, vrai: Vx.SA,
        aide: <>S<sub>A</sub> = π·D<sub>A</sub>²/4 avec D<sub>A</sub> = {exo.dAmm} mm = {bernFmt(exo.dAmm / 1000, 3)} m.</> }] : []),
      { id: 'vA', titre: <>Vitesse v<sub>A</sub> en m·s⁻¹</>, vrai: Vx.vA,
        aide: <>Le même débit traverse la colonne : v<sub>A</sub> = Q<sub>V</sub> / S<sub>A</sub>.</> },
      { id: 'ecinA', titre: <>Terme ½·ρ·v<sub>A</sub>² en Pa</>, vrai: Vx.ecinA,
        aide: <>Comparez-le ensuite à ½·ρ·v<sub>B</sub>² : l'hypothèse v<sub>A</sub> ≈ 0 aurait-elle été grave ?</> },
    ] : []),
    ...(!pressionsAtm ? [
      { id: 'dpress', titre: <>Terme P<sub>B</sub> − P<sub>A</sub> en Pa</>, vrai: Vx.dpress,
        aide: <>Les deux pressions ne s'annulent plus. P<sub>atm</sub> disparaît dans la différence :
          il ne reste que les pressions relatives. Attention au signe, et aux kPa.</> },
    ] : []),
    ...(niv < 4 ? [
      { id: 'epot', titre: <>Terme ρ·g·z<sub>B</sub> en Pa</>, vrai: Vx.epot,
        aide: <>Origine des altitudes en A : z<sub>B</sub> = Δz = {bernFmt(exo.dz, 1)} m.</> },
    ] : []),
    ...(cinB ? [
      { id: 'ecin', titre: <>Terme ½·ρ·v<sub>B</sub>² en Pa</>, vrai: Vx.ecin,
        aide: <>Utilisez la vitesse v<sub>B</sub> que vous venez de calculer.</> },
    ] : []),
    ...(niv >= 3 ? [
      { id: 'dpLin', titre: <>Pertes linéiques en Pa</>, vrai: Vx.dpLin },
      { id: 'dpSing', titre: <>Pertes singulières en Pa</>, vrai: Vx.dpSing },
      { id: 'dp', titre: <>Terme ΔP<sub>charge</sub> en Pa</>, vrai: Vx.dp },
    ] : []),
  ];

  // Relation simplifiée propre à la situation : P_hyd/Q_V = …
  const termesDroite = [
    !pressionsAtm && <>(P<sub>B</sub> − P<sub>A</sub>)</>,
    <>ρ·g·z<sub>B</sub></>,
    cinB && <>½·ρ·v<sub>B</sub>²</>,
  ].filter(Boolean);
  const relationSimplifiee = (
    <>P<sub>hyd</sub>/Q<sub>V</sub>{cinA && <> + ½·ρ·v<sub>A</sub>²</>} − ΔP<sub>charge</sub> = {termesDroite.map((t, i) => (
      <span key={i}>{i > 0 && ' + '}{t}</span>
    ))}</>
  );

  // Étape 3 : résolution (il ne reste qu'une inconnue)
  const etapes3 = !exo ? [] : niv < 4 ? [
    { id: 'wp', titre: <>Terme P<sub>hyd</sub>/Q<sub>V</sub> en Pa</>, vrai: Vx.wp,
      aide: <>La relation simplifiée s'écrit {relationSimplifiee}. Isolez P<sub>hyd</sub>/Q<sub>V</sub>.
        {niv <= 2 && <> Attention : ΔP<sub>charge</sub> est donné en kPa.</>}</> },
    { id: 'phyd', titre: <>Puissance hydraulique P<sub>hyd</sub> en W</>, vrai: Vx.phyd,
      aide: <>Multipliez le terme précédent par Q<sub>V</sub> en m³·s⁻¹ : Pa × m³·s⁻¹ = J·s⁻¹ = W.</> },
    { id: 'pabs', titre: <>Puissance absorbée P<sub>abs</sub> en W</>, vrai: Vx.pabs,
      aide: <>η = P<sub>hyd</sub> / P<sub>abs</sub>, avec η = {exo.eta} % = {bernFmt(exo.eta / 100, 2)}.</> },
  ] : [
    { id: 'phyd', titre: <>Puissance hydraulique P<sub>hyd</sub> en W</>, vrai: Vx.phyd },
    { id: 'wp', titre: <>Terme P<sub>hyd</sub>/Q<sub>V</sub> en Pa</>, vrai: Vx.wp },
    { id: 'epot', titre: <>Terme ρ·g·z<sub>B</sub> en Pa</>, vrai: Vx.epot },
    { id: 'dz', titre: <>Hauteur maximale Δz en m</>, vrai: Vx.dz },
  ];

  const champsEtape = { 2: etapes2, 3: etapes3 };
  const champOk = e => ok(reps[e.id], e.vrai);

  // ── Retours ciblés : reconnaît les erreurs classiques d'après la valeur fausse ──
  const proche = (a, b) => Math.abs(a - b) <= Math.abs(b) * 0.03;
  function diagnostic(e) {
    const x = parseFloat(String(reps[e.id] ?? '').replace(',', '.'));
    if (!isFinite(x)) return 'Entrez une valeur numérique (virgule ou point).';
    const v = e.vrai, id = e.id, V = Vx;
    const facteur = f => proche(x, v * f) || proche(x, v / f);
    const eta = exo.eta / 100;
    // Termes oubliés ou mal placés quand on isole une inconnue : x ≈ v − d
    const ecarts = [];
    if (id === 'wp') {
      ecarts.push(
        [V.dp, <>Il manque ΔP<sub>charge</sub> : les pertes aussi doivent être fournies par la pompe.</>],
        [2 * V.dp, <>ΔP<sub>charge</sub> change de membre quand on isole P<sub>hyd</sub>/Q<sub>V</sub> : il s'ajoute.</>],
        [V.dp - V.dp / 1000, <>ΔP<sub>charge</sub> est donné en kPa : convertissez-le en Pa (× 1000).</>],
        ...(niv < 4 ? [[V.epot, <>Il manque le terme ρ·g·z<sub>B</sub>.</>]] : []),
        ...(cinB ? [[V.ecin, <>Il manque le terme ½·ρ·v<sub>B</sub>².</>]] : []),
        ...(!pressionsAtm ? [[V.dpress, <>Il manque le terme P<sub>B</sub> − P<sub>A</sub>.</>],
          [2 * V.dpress, <>Attention au signe de P<sub>B</sub> − P<sub>A</sub>.</>]] : []),
        ...(cinA ? [[-V.ecinA, <>½·ρ·v<sub>A</sub>² est dans le membre de gauche : il se soustrait quand on isole P<sub>hyd</sub>/Q<sub>V</sub>.</>],
          [-2 * V.ecinA, <>½·ρ·v<sub>A</sub>² est dans le membre de gauche : il se soustrait quand on isole P<sub>hyd</sub>/Q<sub>V</sub>.</>]] : []),
      );
    }
    if (id === 'epot' && niv === 4) {
      ecarts.push(
        [-V.dp, <>Retirez aussi ΔP<sub>charge</sub> : une partie de l'énergie de la pompe est perdue.</>],
        [-2 * V.dp, <>Attention au signe de ΔP<sub>charge</sub> quand vous isolez ρ·g·z<sub>B</sub>.</>],
        ...(cinB ? [[-V.ecin, <>Retirez aussi ½·ρ·v<sub>B</sub>² : l'eau sort du tuyau avec une vitesse.</>]] : []),
        ...(!pressionsAtm ? [[-V.dpress, <>Tenez compte du terme P<sub>B</sub> − P<sub>A</sub>.</>]] : []),
      );
    }
    if (id === 'dp' && V.dpLin != null) {
      if (proche(x, V.dpLin)) return <>Il manque les pertes singulières : ΔP<sub>charge</sub> = pertes linéiques + pertes singulières.</>;
      if (proche(x, V.dpSing)) return <>Il manque les pertes linéiques : ΔP<sub>charge</sub> = pertes linéiques + pertes singulières.</>;
    }
    for (const [d, msg] of ecarts) if (d !== 0 && proche(x, v - d)) return msg;

    // Erreurs propres à une grandeur
    if (id === 'q' || id === 'phyd' && niv < 4) {
      if (facteur(3.6e6) && id === 'q') return "Le débit n'est pas converti : divisez par 1000 (L → m³) et par 3600 (h → s).";
      if (facteur(1e6)) return <>1 L = 10⁻³ m³ : on divise par 1000, on ne multiplie pas.</>;
      if (facteur(3600)) return 'Conversion du temps : 1 h = 3600 s.';
      if (facteur(1000)) return <>Conversion du volume : 1 L = 10⁻³ m³.</>;
      if (facteur(3.6e6)) return <>Q<sub>V</sub> doit être en m³·s⁻¹.</>;
    }
    if (['s', 'sA', 'v', 'vA'].includes(id)) {
      if (facteur(1e6)) return 'Le diamètre doit être en mètres (1 mm = 10⁻³ m).';
      if (facteur(4)) return 'S = π·D²/4 : avez-vous utilisé le rayon, ou oublié de diviser par 4 ?';
      if (facteur(Math.PI)) return "N'oubliez pas π dans S = π·D²/4.";
      if (facteur(3600) || facteur(1000) || facteur(3.6e6)) return <>Le débit doit être en m³·s⁻¹.</>;
    }
    if (id === 'ecin' || id === 'ecinA') {
      const vit = id === 'ecin' ? V.v : V.vA;
      if (facteur(2)) return "N'oubliez pas le ½ dans ½·ρ·v².";
      if (proche(x, 0.5 * BERN_RHO * vit) || proche(x, BERN_RHO * vit)) return 'La vitesse est au carré dans ½·ρ·v².';
      if (facteur(16)) return 'Vérifiez la vitesse : la section S dépend de D²/4.';
      if (facteur(1000)) return "ρ = 1000 kg·m⁻³ pour l'eau, et le résultat est en Pa.";
    }
    if (id === 'epot') {
      if (facteur(9.81)) return 'Il manque g dans ρ·g·z.';
      if (facteur(1000)) return 'ρ = 1000 kg·m⁻³, et le résultat est en Pa (pas en kPa).';
    }
    if (id === 'dpress' && proche(x, -v)) return <>Attention au signe : c'est P<sub>B</sub> − P<sub>A</sub>.</>;
    if (id === 'dpLin' && proche(x, exo.jDonne)) return 'j est une perte par mètre : multipliez par la longueur L.';
    if (id === 'dpSing') {
      const sansN = r.sing.filter(s2 => s2.n > 0).reduce((t, s2) => t + exo.dpUnit[s2.key], 0)
        + (sit === 'surface' ? exo.dpUnit.sortie : 0);
      if (proche(x, sansN)) return "Chaque singularité compte autant de fois qu'elle apparaît : multipliez par leur nombre.";
    }
    if (id === 'pabs') {
      if (proche(x, V.phyd) || proche(x, V.phyd * eta)) return <>La pompe consomme plus qu'elle ne fournit : P<sub>abs</sub> = P<sub>hyd</sub> / η, donc P<sub>abs</sub> &gt; P<sub>hyd</sub>.</>;
      if (facteur(100)) return 'η en pourcentage : 60 % = 0,60.';
    }
    if (id === 'phyd' && niv === 4) {
      if (proche(x, exo.pabs) || proche(x, exo.pabs / eta)) return <>La pompe fournit moins qu'elle ne consomme : P<sub>hyd</sub> = η × P<sub>abs</sub>.</>;
      if (facteur(100)) return 'η en pourcentage : 50 % = 0,50.';
    }
    if (id === 'dz') {
      if (proche(x, V.epot)) return 'Divisez ρ·g·z par ρ·g pour obtenir une hauteur en mètres.';
      if (facteur(1000)) return 'Divisez par ρ·g = 1000 × 9,81, et pas seulement par g.';
      if (facteur(9.81)) return 'Divisez par ρ·g = 1000 × 9,81, et pas seulement par ρ.';
    }
    // Erreurs génériques
    if (proche(x, -v)) return 'Le signe est faux.';
    if (facteur(1000)) return 'Facteur 1000 : vérifiez les unités (Pa ou kPa, L ou m³, mm ou m).';
    if (facteur(10) || facteur(100)) return 'Erreur de puissance de 10 : vérifiez les conversions.';
    return null;
  }

  // Messages pour les cases fausses de la carte d'identité (niveaux 1 et 2)
  function diagnosticCarte(c) {
    const choix = carte[c.id];
    if (!choix) return 'Case non remplie.';
    const pt = c.pt;
    if (c.g === 'P') {
      if (c.bon === 'don') return pt === 'B' ? 'Le réservoir B est fermé : regardez son manomètre.'
        : 'A n\'est pas à l\'air libre : il est dans le tuyau, là où est branché le manomètre.';
      if (choix === 'don') return `Pas de manomètre en ${pt} : le point est au contact de l'air.`;
      return `La pression en ${pt} est connue : air libre ou manomètre ?`;
    }
    if (c.g === 'z') {
      if (pt === 'A') return 'L\'origine des altitudes est placée en A.';
      if (c.bon === 'inc') return 'Au niveau 4, la hauteur est justement ce que l\'on cherche.';
      return 'La hauteur de B au-dessus de A est donnée dans l\'énoncé.';
    }
    if (pt === 'A') {
      if (sit === 'aspiration') return 'A est dans le tuyau : l\'eau y circule à la même vitesse qu\'en B.';
      if (sit === 'colonne') return 'La colonne est étroite : comparez son diamètre à celui du tuyau.';
      return 'Le réservoir A est très large devant le tuyau : sa surface descend très lentement.';
    }
    return 'B est à la sortie du tuyau : l\'eau y sort avec la vitesse qu\'elle a dans le tuyau.';
  }
  const carteOk = cellules.every(c => carte[c.id] === c.bon);
  const etapeOk = k => (k === 1 ? carteOk : champsEtape[k].every(champOk));
  const etapeCourante = !valides[1] ? 1 : !valides[2] ? 2 : !valides[3] ? 3 : 4;

  function verifierEtape(k) {
    setVerifs(v => ({ ...v, [k]: true }));
    if (etapeOk(k)) {
      setValides(v => ({ ...v, [k]: true }));
      setOuverts(o => ({ ...o, [`st${k}`]: false, [`st${k + 1}`]: true }));
    }
  }
  function corrigerEtape(k) {
    if (k === 1) {
      setCarte(Object.fromEntries(cellules.map(c => [c.id, c.bon])));
    } else {
      const ajout = Object.fromEntries(champsEtape[k].map(e =>
        [e.id, String(Number(e.vrai.toPrecision(4))).replace('.', ',')]));
      setReps(p => ({ ...p, ...ajout }));
    }
    setReveles(p => ({ ...p, [k]: true }));
    setVerifs(v => ({ ...v, [k]: true }));
    setValides(v => ({ ...v, [k]: true }));
    setOuverts(o => ({ ...o, [`st${k}`]: false, [`st${k + 1}`]: true }));
  }

  // ════════════════ RELATION DE BERNOULLI ════════════════
  const fmtKpa = x => {
    const v = x / 1000;
    return `${bernFmt(v, Math.abs(v) < 1 ? 3 : 2)} kPa`;
  };
  // Valeurs des termes (pressions relatives à P_atm)
  const E = enExo
    ? { pA: exo.pA, pB: exo.pB, ecinA: Vx.ecinA, ecin: Vx.ecin, epot: Vx.epot, dp: Vx.dp, wp: Vx.wp }
    : { pA: 0, pB: 0, ecinA: 0, ecin: r.Ecin, epot: r.Epot, dp: r.dpCharge, wp: r.Wp };

  const champTerme = { zB: 'epot', vB: 'ecin', vA: 'ecinA', pompe: 'wp', pertes: 'dp' };
  const connu = id => {
    if (id === 'pertes' && enExo && niv <= 2) return 'donne';
    const f = champTerme[id];
    if (etapes2.some(e => e.id === f)) return !!valides[2];
    if (etapes3.some(e => e.id === f)) return !!valides[3];
    return false;
  };
  const textePression = pt => {
    const rel = pt === 'A' ? E.pA : E.pB;
    return rel === 0 ? <>P<sub>atm</sub></> : <>P<sub>atm</sub> + {bernFmt(rel / 1000, 0)} kPa</>;
  };

  const notePA = pressionsAtm ? <>s'annule avec P<sub>B</sub></> : sit === 'aspiration' ? 'lue au manomètre' : "à l'air libre";
  const notePB = pressionsAtm ? <>s'annule avec P<sub>A</sub></> : sit === 'pression' ? 'lue au manomètre' : "jet à l'air libre";
  const membreGauche = [
    { id: 'p', color: BERN_C.p, pression: 'A', barre: pressionsAtm, aff: <>P<sub>atm</sub></>,
      tex: <>P<sub>A</sub></>, note: notePA },
    { op: '+' },
    { id: 'zA', color: BERN_C.pot, barre: true, aff: '0',
      tex: <>ρ·g·z<sub>A</sub></>, note: <>z<sub>A</sub> = 0 (origine)</> },
    { op: '+' },
    { id: 'vA', color: BERN_C.cin, barre: !cinA, aff: cinAnnulees ? '—' : '≈ 0', valeur: E.ecinA,
      tex: <>½·ρ·v<sub>A</sub>²</>,
      note: cinAnnulees ? <>s'annule (v<sub>A</sub> = v<sub>B</sub>)</> : cinA ? 'colonne étroite' : <>v<sub>A</sub> ≈ 0</> },
    { op: '+' },
    { id: 'pompe', color: BERN_C.pompe, valeur: E.wp,
      tex: <>P<sub>hyd</sub>/Q<sub>V</sub></>, note: 'apport de la pompe' },
    { op: '−' },
    { id: 'pertes', color: BERN_C.lin, valeur: E.dp,
      tex: <>ΔP<sub>charge</sub></>, note: 'énergie perdue' },
  ];
  const membreDroite = [
    { id: 'p', color: BERN_C.p, pression: 'B', barre: pressionsAtm, aff: <>P<sub>atm</sub></>,
      tex: <>P<sub>B</sub></>, note: notePB },
    { op: '+' },
    { id: 'zB', color: BERN_C.pot, valeur: E.epot, cache: true,
      tex: <>ρ·g·z<sub>B</sub></>, note: enExo && niv === 4 ? <>z<sub>B</sub> inconnue</> : <>z<sub>B</sub> = Δz</> },
    { op: '+' },
    { id: 'vB', color: BERN_C.cin, barre: !cinB, aff: cinAnnulees ? '—' : '≈ 0', valeur: E.ecin,
      tex: <>½·ρ·v<sub>B</sub>²</>,
      note: cinAnnulees ? <>s'annule (v<sub>A</sub> = v<sub>B</sub>)</> : surfB ? <>v<sub>B</sub> ≈ 0</> : 'sortie du tuyau' },
  ];

  const valeurAffichee = t => {
    if (!simplifie && (t.barre || t.pression)) return '?';
    if (t.barre) return t.aff;
    if (t.pression) return textePression(t.pression);
    if (mode === 'explore' || termine) return fmtKpa(t.valeur);
    const c = connu(t.id);
    if (c === 'donne') return `${fmtKpa(t.valeur)} (donné)`;
    return c ? fmtKpa(t.valeur) : '? kPa';
  };

  const rendreTerme = (t, i) => t.op ? (
    <span key={i} style={{ fontSize: 18, fontWeight: 700, color: TXT, paddingTop: 4 }}>{t.op}</span>
  ) : (
    <div key={i} {...ev(t.id)} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, cursor: 'pointer',
      padding: '3px 5px', borderRadius: 8, opacity: dim(t.id), transition: 'opacity 0.15s',
      background: hl(t.id) ? `${t.color}1f` : 'white',
      border: `2px solid ${hl(t.id) ? t.color : BORDER}`,
    }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: t.color, fontFamily: 'Georgia, serif',
        textDecoration: t.barre && simplifie ? 'line-through' : 'none', textDecorationColor: TXT,
        textDecorationThickness: 2 }}>
        {t.tex}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: TXT, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
        {valeurAffichee(t)}
      </span>
      <span style={{ fontSize: 10.5, color: TXT2, textAlign: 'center', maxWidth: 96, lineHeight: 1.25 }}>
        {(t.barre || t.cache || t.pression) && !simplifie ? 'à déterminer' : t.note}
      </span>
    </div>
  );

  const membre = (termes, legende) => (
    <div style={{ padding: 5, borderRadius: 10, border: `1.5px dashed ${TXT2}` }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2 }}>
        {termes.map(rendreTerme)}
      </div>
      <div style={{ fontSize: 11.5, color: TXT2, fontWeight: 700, textAlign: 'center', marginTop: 3 }}>{legende}</div>
    </div>
  );

  const totalGauche = E.pA + E.ecinA + E.wp - E.dp;
  const totalDroite = E.pB + E.epot + E.ecin;
  const equation = (
    <div style={box}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div style={titreBox}>Relation de Bernoulli entre A et B</div>
        <div style={{ fontSize: 11.5, color: TXT2 }}>
          Survolez ou touchez un terme : il s'allume sur le schéma et dans le bilan.
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 4, justifyContent: 'center' }}>
        {membre(membreGauche, "en A, plus ce qu'apporte la pompe, moins ce qui est perdu")}
        <span style={{ fontSize: 24, fontWeight: 700, color: TXT, padding: '4px 2px 0' }}>=</span>
        {membre(membreDroite, 'ce qui arrive en B')}
      </div>
      <div style={{ marginTop: 6, fontSize: 11.5, color: TXT2, textAlign: 'center' }}>
        {afficherBilan && (
          <span style={{ color: TXT, marginRight: 14 }}>
            Membre de gauche : <strong>{fmtKpa(totalGauche)}</strong> ; membre de droite : <strong>{fmtKpa(totalDroite)}</strong>
            {!pressionsAtm && <> (pressions comptées à partir de P<sub>atm</sub>)</>}.
          </span>
        )}
        Chaque terme est une énergie par unité de volume : 1 Pa = 1 J·m⁻³.
      </div>
    </div>
  );

  // ════════════════ BILAN EN BALANCE ════════════════
  const DW = 330, DH = 312, y0 = 255, hMax = 200;
  const k = 1000;
  const gauche = [
    { id: 'p', val: E.pA / k, c: BERN_C.p, tex: <>P<tspan dy="3" fontSize="10">A</tspan><tspan dy="-3"> − P</tspan><tspan dy="3" fontSize="10">atm</tspan><tspan dy="-3"> </tspan></> },
    { id: 'vA', val: E.ecinA / k, c: BERN_C.cin, tex: <>½·ρ·v<tspan dy="3" fontSize="10">A</tspan><tspan dy="-3">²</tspan></> },
  ];
  const baseG = gauche.reduce((s, x) => s + x.val, 0);
  const Wk = E.wp / k, Dk = E.dp / k;
  const hautG = baseG + Wk;                    // hauteur avant pertes
  const droite = [
    { id: 'p', val: E.pB / k, c: BERN_C.p, tex: <>P<tspan dy="3" fontSize="10">B</tspan><tspan dy="-3"> − P</tspan><tspan dy="3" fontSize="10">atm</tspan></> },
    { id: 'zB', val: E.epot / k, c: BERN_C.pot, tex: <>ρ·g·z<tspan dy="3" fontSize="10">B</tspan></> },
    { id: 'vB', val: E.ecin / k, c: BERN_C.cin, tex: <>½·ρ·v<tspan dy="3" fontSize="10">B</tspan><tspan dy="-3">²</tspan></> },
  ];
  const EB = hautG - Dk;
  const ech = hMax / Math.max(hautG, 1e-6);
  const Y = v => y0 - v * ech;
  const xL = 100, xR = 200, cw = 58;
  const dS = enExo ? Math.min(Dk, Vx.dpSing / k) : (r.dpCharge > 0 ? Dk * (r.dpSing / r.dpCharge) : 0);
  const dL = Dk - dS;

  // Empile des segments et place leurs étiquettes sans chevauchement
  const empiler = liste => {
    let bas = 0;
    return liste.filter(s => s.val > 0).map(s => {
      const seg = { ...s, bas, haut: bas + s.val };
      bas += s.val;
      return seg;
    });
  };
  const etaler = (ys, ecart, yMax) => {
    const out = [...ys];
    for (let i = 1; i < out.length; i++) if (out[i] < out[i - 1] + ecart) out[i] = out[i - 1] + ecart;
    const deb = out.length ? out[out.length - 1] - yMax : 0;
    if (deb > 0) for (let i = 0; i < out.length; i++) out[i] -= deb;
    return out;
  };
  const segG = empiler(gauche), segD = empiler(droite);
  // étiquettes de droite, du haut vers le bas
  const segDH = [...segD].reverse();
  const ysD = etaler(segDH.map(s => Y((s.bas + s.haut) / 2) + 4), 36, y0 - 18);

  const diagramme = (
    <svg viewBox={`0 0 ${DW} ${DH}`} role="img" aria-label="Bilan d'énergie en deux colonnes"
      style={{ width: '100%', height: 'auto', maxHeight: '44vh', display: 'block',
        background: 'white', borderRadius: 8, border: `1px solid ${BORDER}` }}>
      <defs>
        <pattern id="bernHachLin" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#fee2e2"/>
          <line x1="0" y1="0" x2="0" y2="8" stroke={BERN_C.lin} strokeWidth="3"/>
        </pattern>
        <pattern id="bernHachSing" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <rect width="8" height="8" fill="#fff1f2"/>
          <line x1="0" y1="0" x2="0" y2="8" stroke={BERN_C.sing} strokeWidth="3"/>
        </pattern>
      </defs>
      <text x={DW / 2} y="16" fontSize="14" fill={TXT2} textAnchor="middle" fontWeight="700">
        Énergie volumique (kPa)
      </text>

      {/* Colonne de gauche : A + pompe − pertes */}
      {segG.map(s => (
        <rect key={s.id} x={xL} y={Y(s.haut)} width={cw} height={Math.max((s.haut - s.bas) * ech, 1.5)} fill={s.c}
          opacity={dim(s.id)} {...ev(s.id)} style={{ cursor: 'pointer' }}>
          <title>{`${s.id === 'p' ? 'Pression relative en A' : 'Énergie cinétique en A'} : ${bernFmt(s.val, 3)} kPa`}</title>
        </rect>
      ))}
      <rect x={xL} y={Y(hautG)} width={cw} height={Wk * ech} fill={BERN_C.pompe}
        opacity={dim('pompe')} {...ev('pompe')} style={{ cursor: 'pointer' }}
        stroke={hl('pompe') ? TXT : 'none'} strokeWidth="2.5"/>
      {(EB - baseG) * ech > 28 && (
        <text x={xL + cw / 2} y={(Y(EB) + Y(baseG)) / 2 + 4} fontSize="14" fontWeight="700"
          fill="white" textAnchor="middle" pointerEvents="none">il reste</text>
      )}
      <g opacity={dim('pertes')} {...ev('pertes')} style={{ cursor: 'pointer' }}>
        <rect x={xL} y={Y(EB + dS)} width={cw} height={dS * ech} fill="url(#bernHachSing)"
          stroke={BERN_C.sing} strokeWidth={hl('pertes') ? 2.5 : 1} strokeDasharray="4 3">
          <title>{`Pertes singulières : ${bernFmt(dS, 2)} kPa`}</title>
        </rect>
        <rect x={xL} y={Y(hautG)} width={cw} height={dL * ech} fill="url(#bernHachLin)"
          stroke={BERN_C.lin} strokeWidth={hl('pertes') ? 2.5 : 1} strokeDasharray="4 3">
          <title>{`Pertes linéiques : ${bernFmt(dL, 2)} kPa`}</title>
        </rect>
        <text x={xL + cw / 2} y={Y(hautG) - 7} fontSize="14" fontWeight="700" fill={BERN_C.lin} textAnchor="middle">
          − ΔP<tspan dy="3" fontSize="10">charge</tspan><tspan dy="-3"> = {bernFmt(Dk, 2)}</tspan>
        </text>
      </g>
      <g opacity={dim('pompe')}>
        <line x1={xL - 8} y1={Y(baseG)} x2={xL - 8} y2={Y(hautG)} stroke={BERN_C.pompe} strokeWidth="2"/>
        <line x1={xL - 12} y1={Y(baseG)} x2={xL - 4} y2={Y(baseG)} stroke={BERN_C.pompe} strokeWidth="2"/>
        <line x1={xL - 12} y1={Y(hautG)} x2={xL - 4} y2={Y(hautG)} stroke={BERN_C.pompe} strokeWidth="2"/>
        <text x={xL - 14} y={(Y(hautG) + Y(baseG)) / 2 - 4} fontSize="14" fontWeight="700" fill={BERN_C.pompe} textAnchor="end">
          + P<tspan dy="3" fontSize="10">hyd</tspan><tspan dy="-3">/Q</tspan><tspan dy="3" fontSize="10">V</tspan>
        </text>
        <text x={xL - 14} y={(Y(hautG) + Y(baseG)) / 2 + 13} fontSize="14" fontWeight="700" fill={BERN_C.pompe} textAnchor="end">
          {bernFmt(Wk, 2)}
        </text>
      </g>
      {segG.map(s => (
        <text key={`t${s.id}`} x={xL - 14} y={Math.min(y0 - 2, Y((s.bas + s.haut) / 2) + 4)} fontSize="12.5"
          fontWeight="700" fill={s.id === 'vA' ? '#b45309' : s.c} textAnchor="end" opacity={dim(s.id)}>
          {s.tex} {bernFmt(s.val, s.val < 1 ? 3 : 1)}
        </text>
      ))}

      {/* Colonne de droite : B */}
      {segD.map(s => (
        <rect key={s.id} x={xR} y={Y(s.haut)} width={cw} height={Math.max((s.haut - s.bas) * ech, 1.5)} fill={s.c}
          opacity={dim(s.id)} {...ev(s.id)} style={{ cursor: 'pointer' }}
          stroke={hl(s.id) ? TXT : 'none'} strokeWidth="2.5"/>
      ))}
      {segDH.map((s, i) => (
        <g key={`e${s.id}`} opacity={dim(s.id)}>
          <text x={xR + cw + 6} y={ysD[i]} fontSize="14" fontWeight="700" fill={s.id === 'vB' ? '#b45309' : s.c}>{s.tex}</text>
          <text x={xR + cw + 6} y={ysD[i] + 17} fontSize="14" fontWeight="700" fill={s.id === 'vB' ? '#b45309' : s.c}>
            {bernFmt(s.val, s.val < 1 ? 3 : 2)}
          </text>
        </g>
      ))}

      <line x1={xL - 4} y1={Y(EB)} x2={xR + cw + 4} y2={Y(EB)} stroke={TXT} strokeWidth="1.5" strokeDasharray="5 4"/>
      <text x={(xL + cw + xR) / 2} y={Y(EB) + 22} fontSize="26" fontWeight="700" fill={TXT} textAnchor="middle">=</text>

      <line x1={xL - 24} y1={y0} x2={xR + cw + 24} y2={y0} stroke={TXT} strokeWidth="2"/>
      <text x={xL + cw / 2} y={y0 + 20} fontSize="14" fontWeight="700" fill={TXT} textAnchor="middle">
        A + pompe − pertes
      </text>
      {baseG === 0 && (
        <text x={xL + cw / 2} y={y0 + 39} fontSize="12.5" fill={TXT2} textAnchor="middle"
          opacity={dim(['p', 'zA', 'vA'])} fontWeight={['p', 'zA', 'vA'].includes(survol) ? 700 : 400}>
          (en A, les termes sont nuls)
        </text>
      )}
      <text x={xR + cw / 2} y={y0 + 20} fontSize="14" fontWeight="700" fill={TXT} textAnchor="middle">B</text>
    </svg>
  );

  // ════════════════ CONTENU DU VOLET : EXPLORATION ════════════════
  // Menu déroulant du volet Réglages : titre à gauche, valeur actuelle à droite
  function sousMenu(id, titre, valeur, contenu, niveauMenu = 1) {
    const cle = `sm_${id}`, ouvert = !!ouverts[cle];
    return (
      <div key={id} style={{ marginBottom: 6, marginLeft: niveauMenu === 2 ? 10 : 0,
        border: `1px solid ${BORDER}`, borderRadius: 8, background: niveauMenu === 1 ? 'white' : BG }}>
        <button onClick={() => setOuverts(o => ({ ...o, [cle]: !o[cle] }))} aria-expanded={ouvert}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
            padding: niveauMenu === 1 ? '8px 10px' : '6px 10px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: niveauMenu === 1 ? 13.5 : 12.5, fontWeight: 700, color: TXT, textAlign: 'left' }}>
          <span>{titre}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: TXT2, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {valeur}<span style={{ fontSize: 10 }}>{ouvert ? '▲' : '▼'}</span>
          </span>
        </button>
        {ouvert && <div style={{ padding: '0 10px 8px' }}>{contenu}</div>}
      </div>
    );
  }
  const nbSing = Object.values(n).reduce((t, x) => t + x, 0);

  const reglages = (
    <>
      {impose === 'debit'
        ? slider(<>Débit volumique Q<sub>V</sub></>, qvLh, setQvLh, 50, 3000, 50, "L/h")
        : (
          <div style={{ fontSize: 13, color: TXT, fontWeight: 700, marginBottom: 8,
            background: 'white', border: `1.5px solid ${BORDER}`, borderRadius: 6, padding: '5px 9px' }}>
            Débit obtenu : Q<sub>V</sub> = {bernFmt(qvPompe, 0)} L/h
          </div>
        )}

      {sousMenu('geometrie', 'Géométrie du circuit hydraulique', null, (
        <>
          {sousMenu('denivele', <>Dénivelé A → B</>, `${bernFmt(dz, 1)} m`,
            slider(<>Δz = z<sub>B</sub> − z<sub>A</sub></>, dz, setDz, 0, 30, 0.5, "m"), 2)}
          {sousMenu('longueur', 'Longueur de la canalisation', `${bernFmt(longueur, 0)} m`,
            slider('L', longueur, setLongueur, 1, 100, 1, "m"), 2)}
          {sousMenu('diametre', 'Diamètre intérieur du tuyau', `${dMm} mm`, (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {BERN_DIAMETRES.map(d => (
                <button key={d} onClick={() => setDMm(d)} style={{ ...petitBtn(dMm === d), padding: '3px 8px' }}>
                  {d} mm
                </button>
              ))}
            </div>
          ), 2)}
          {sousMenu('singularites', 'Singularités', `${nbSing} élément${nbSing > 1 ? 's' : ''}`, (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {Object.keys(BERN_K).map(kk => (
                <label key={kk} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 6, fontSize: 12.5, color: TXT }}>
                  <span>{BERN_K[kk].label}</span>
                  <input type="number" min={0} max={10} value={n[kk]}
                    onChange={e => setN(prev => ({ ...prev, [kk]: Math.max(0, Math.min(10, parseInt(e.target.value) || 0)) }))}
                    style={{ ...inp, width: 55, padding: '3px 6px' }}/>
                </label>
              ))}
            </div>
          ), 2)}
        </>
      ))}

      {sousMenu('pompe', 'Pompe (facultatif)', `η = ${eta} %`, (
        <>
          {slider("Rendement η", eta, setEta, 10, 90, 5, "%")}
          <div style={lab}>Ce que l'on impose</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setImpose('debit')} style={petitBtn(impose === 'debit')}>Le débit</button>
            <button onClick={() => setImpose('pompe')} style={petitBtn(impose === 'pompe')}>La puissance</button>
          </div>
          {impose === 'pompe' && slider(<>Puissance absorbée P<sub>abs</sub></>, pabs, setPabs, 5, 500, 5, "W")}
          <div style={{ fontSize: 11.5, color: TXT2, lineHeight: 1.5 }}>
            {impose === 'debit'
              ? <>Le débit est imposé : le circuit fixe P<sub>hyd</sub>. Le rendement ne change que la
                  puissance consommée P<sub>abs</sub> = P<sub>hyd</sub> / η.</>
              : <>La pompe fournit P<sub>hyd</sub> = η × P<sub>abs</sub>. Le débit s'ajuste jusqu'à ce que
                  le circuit consomme exactement cette puissance : meilleur rendement, plus de débit.</>}
          </div>
        </>
      ))}
    </>
  );

  const resultats = (
    <div style={{ fontSize: 12.5 }}>
      {[
        [<>Débit volumique Q<sub>V</sub></>, `${bernFmt(r.Q * 3.6e6, 0)} L/h`],
        [<>Vitesse dans le tuyau</>, `${bernFmt(r.v, 3)} m·s⁻¹`],
        ...(E.pB - E.pA !== 0 ? [[<>P<sub>B</sub> − P<sub>A</sub></>, fmtKpa(E.pB - E.pA), BERN_C.p]] : []),
        [<>Pertes de charge ΔP<sub>charge</sub></>, fmtKpa(E.dp), '#b91c1c'],
        [<>Énergie potentielle ρ·g·z<sub>B</sub></>, fmtKpa(E.epot), BERN_C.pot],
        ...(E.ecinA > 0 ? [[<>Énergie cinétique ½·ρ·v<sub>A</sub>²</>, fmtKpa(E.ecinA), '#b45309']] : []),
        [<>Énergie cinétique ½·ρ·v<sub>B</sub>²</>, fmtKpa(E.ecin), '#b45309'],
        [<>P<sub>hyd</sub>/Q<sub>V</sub> (apport de la pompe)</>, fmtKpa(E.wp), '#15803d'],
        [<>Puissance hydraulique P<sub>hyd</sub></>, `${bernFmt(enExo ? Vx.phyd : r.Phyd, 1)} W`, '#15803d'],
        [<>Puissance absorbée P<sub>abs</sub></>, `${bernFmt(enExo ? Vx.pabs : r.Pabs, 1)} W`],
      ].map(([kk, v, c], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0',
          borderBottom: `1px dashed ${BORDER}` }}>
          <span style={{ color: TXT2, fontWeight: 600 }}>{kk}</span>
          <span style={{ color: c || TXT, fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{v}</span>
        </div>
      ))}
    </div>
  );

  const detail = (
    <div style={{ fontSize: 12, color: TXT, lineHeight: 1.6 }}>
      <div>Régime d'écoulement : <strong>{r.regime}</strong> (Re = {bernFmt(r.Re, 0)})</div>
      <div>Pertes linéiques : {bernFmt(r.dpParMetre, 0)} Pa·m⁻¹, soit <strong>{bernFmt(r.dpLin / 1000, 2)} kPa</strong> au total</div>
      <div>Pertes singulières : <strong>{bernFmt((r.dpSing + (sit === 'surface' ? r.qdyn : 0)) / 1000, 2)} kPa</strong></div>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 6 }}>
        <thead>
          <tr>{['Singularité', 'K', 'Nombre', 'ΔP (Pa)'].map(h => (
            <th key={h} style={{ textAlign: 'right', padding: '3px 5px',
              borderBottom: `1.5px solid ${BORDER}`, color: TXT2 }}>{h}</th>))}</tr>
        </thead>
        <tbody>
          {[...r.sing, ...(sit === 'surface' ? [{ key: 'sortie', label: 'Sortie dans le réservoir', K: 1, n: 1, dp: r.qdyn }] : [])].map(s => (
            <tr key={s.key}>
              <td style={{ textAlign: 'right', padding: '3px 5px' }}>{s.label}</td>
              <td style={{ textAlign: 'right', padding: '3px 5px' }}>{bernFmt(s.K, 1)}</td>
              <td style={{ textAlign: 'right', padding: '3px 5px' }}>{s.n}</td>
              <td style={{ textAlign: 'right', padding: '3px 5px', fontWeight: 700 }}>{bernFmt(s.dp, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 6, color: TXT2 }}>
        Singularité : ΔP = K × ½·ρ·v². Pertes linéiques : ΔP/L = λ/D × ½·ρ·v²
        (λ = 64/Re en laminaire, λ = 0,316·Re<sup>−0,25</sup> en turbulent).
        Les pertes internes de la pompe sont comptées dans son rendement η.
      </div>
    </div>
  );

  // ════════════════ EXERCICE : INTERFACE ════════════════
  // Énoncé d'un exercice (sert à l'élève et à la correction enseignant)
  const enonceDe = ex => {
    const V = ex.V, nv = ex.niveau, st = ex.situation, rr = bernCalc(ex);
    const sings = [
      ...rr.sing.filter(s => s.n > 0),
      ...(st === 'surface' ? [{ key: 'sortie', label: 'Sortie du tuyau dans le réservoir B', n: 1 }] : []),
    ];
    const phrase = {
      base: <>Le jet sort du tuyau à l'air libre et tombe dans le réservoir B.</>,
      pression: <>Le tuyau débouche dans un réservoir B fermé. Son manomètre indique une surpression de
        <strong> {bernFmt(ex.pB / 1000, 0)} kPa</strong> (pression relative à P<sub>atm</sub>).</>,
      aspiration: <>Un manomètre placé sur le tuyau d'aspiration, au point A, indique une pression relative de
        <strong> +{bernFmt(ex.pA / 1000, 0)} kPa</strong>. Le jet sort à l'air libre en B. Le tuyau a le même diamètre partout.</>,
      colonne: <>Le réservoir A est une colonne étroite de diamètre intérieur <strong>D<sub>A</sub> = {ex.dAmm} mm</strong>.
        Le jet sort du tuyau à l'air libre.</>,
      surface: <>Le tuyau débouche sous la surface d'un grand réservoir B ouvert.</>,
    }[st];
    const hauteur = st === 'surface' ? 'la surface de B' : 'la sortie du tuyau';
    const depuis = st === 'aspiration' ? 'le point A' : 'la surface de A';
    return (
      <div style={{ fontSize: 13, color: TXT, lineHeight: 1.65 }}>
        {phrase}{' '}
        {nv < 4 ? (
          <>On note Δz = <strong>{bernFmt(ex.dz, 1)} m</strong> la hauteur de {hauteur} au-dessus de {depuis}.</>
        ) : (
          <>La pompe absorbe <strong>P<sub>abs</sub> = {bernFmt(ex.pabs, 1)} W</strong>. On cherche la hauteur
            maximale Δz de {hauteur} au-dessus de {depuis}.</>
        )}
        <br/>Débit Q<sub>V</sub> = <strong>{ex.qvLh} L/h</strong> ; tuyau de diamètre intérieur <strong>{ex.dMm} mm</strong>
        {nv >= 3 && <> et de longueur <strong>{ex.longueur} m</strong> entre A et B</>} ;
        rendement de la pompe η = <strong>{ex.eta} %</strong>.<br/>
        {nv <= 2 ? (
          <>Pertes de charge totales entre A et B : ΔP<sub>charge</sub> = <strong>{bernFmt(V.dp / 1000, 2)} kPa</strong>.<br/></>
        ) : (
          <div style={{ margin: '6px 0', padding: '6px 9px', background: 'white', border: `1px solid ${BORDER}`,
            borderRadius: 6, fontSize: 12.5 }}>
            <strong>Document.</strong> Pertes de charge linéiques dans ce tuyau à ce débit :
            j = <strong>{bernFmt(ex.jDonne, 0)} Pa·m⁻¹</strong>.<br/>
            Pertes de charge singulières (par élément) :
            {sings.map(s => (
              <div key={s.key} style={{ paddingLeft: 10 }}>
                • {s.label} : <strong style={{ whiteSpace: 'nowrap' }}>{bernFmt(ex.dpUnit[s.key], 0)} Pa</strong> par élément,
                nombre : {s.n}
              </div>
            ))}
          </div>
        )}
        Données : ρ = 1000 kg·m⁻³ ; g = 9,81 m·s⁻².
      </div>
    );
  };
  const enonce = exo && enonceDe(exo);

  const couleurGrandeur = { P: BERN_C.p, z: BERN_C.pot, v: '#b45309' };
  const nomGrandeur = { P: 'Pression', z: 'Altitude', v: 'Vitesse' };

  const carteUI = (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th/>
            {['P', 'z', 'v'].map(g => (
              <th key={g} style={{ padding: '2px 2px 5px', color: couleurGrandeur[g], fontSize: 12 }}>
                {nomGrandeur[g]} {g}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {['A', 'B'].map(pt => (
            <tr key={pt} style={{ borderTop: `1px solid ${BORDER}` }}>
              <th style={{ fontSize: 15, color: TXT, padding: '0 4px' }}>{pt}</th>
              {cellules.filter(c => c.pt === pt).map(c => {
                const juste = carte[c.id] === c.bon;
                return (
                  <td key={c.id} style={{ padding: 3, verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 3, borderRadius: 6,
                      border: `2px solid ${verifs[1] ? (juste ? '#16a34a' : '#dc2626') : 'transparent'}` }}>
                      {OPTIONS[c.g].map(o => {
                        const choisi = carte[c.id] === o.k;
                        return (
                          <button key={o.k} disabled={!!valides[1]} aria-pressed={choisi}
                            onClick={() => { setCarte(p => ({ ...p, [c.id]: o.k })); setVerifs(v => ({ ...v, 1: false })); }}
                            style={{ fontSize: 12, fontWeight: 700, padding: '3px 4px', borderRadius: 5,
                              cursor: valides[1] ? 'default' : 'pointer',
                              border: `1.5px solid ${choisi ? couleurGrandeur[c.g] : BORDER}`,
                              background: choisi ? couleurGrandeur[c.g] : 'white',
                              color: choisi ? 'white' : TXT2 }}>
                            {o.l}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11, color: TXT2, marginTop: 4, lineHeight: 1.45 }}>
        « donnée » : valeur fournie par l'énoncé (manomètre…). « Q<sub>V</sub> / S » : vitesse calculable à partir
        du débit et de la section traversée.
      </div>
      {niv <= 2 && verifs[1] && !valides[1] && !carteOk && (
        <div style={{ fontSize: 12, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74',
          borderRadius: 6, padding: '5px 8px', marginTop: 6, lineHeight: 1.5 }}>
          {cellules.filter(c => carte[c.id] !== c.bon).map(c => (
            <div key={c.id}><strong>{c.g}<sub>{c.pt}</sub></strong> : {diagnosticCarte(c)}</div>
          ))}
        </div>
      )}
      {niv === 1 && !valides[1] && ['A', 'B'].map(pt => (
        <div key={pt} style={{ marginTop: 6 }}>
          <button onClick={() => setAides(p => ({ ...p, [`carte${pt}`]: !p[`carte${pt}`] }))}
            style={{ ...btn(!!aides[`carte${pt}`], '#d97706'), padding: '2px 8px', fontSize: 11 }}>💡 Indice pour le point {pt}</button>
          {aides[`carte${pt}`] && <div style={aideStyle}>{aidePoint(pt)}</div>}
        </div>
      ))}
      {niv === 2 && !valides[1] && (
        <div style={{ marginTop: 6 }}>
          <button onClick={() => setAides(p => ({ ...p, carte: !p.carte }))}
            style={{ ...btn(!!aides.carte, '#d97706'), padding: '2px 8px', fontSize: 11 }}>💡 Indice</button>
          {aides.carte && <div style={aideStyle}>{aideCarte.general}</div>}
        </div>
      )}
    </>
  );

  const champsUI = kk => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {champsEtape[kk].map((e, i) => (
        <div key={e.id} style={{ borderLeft: `3px solid ${BORDER}`, paddingLeft: 8 }}>
          <div style={{ fontSize: 12, color: TXT, fontWeight: 700, marginBottom: 3 }}>{e.titre}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <input value={reps[e.id] || ''} placeholder="?" disabled={!!valides[kk]}
              style={{ ...inp, width: 110, padding: '3px 8px' }} aria-label={`Réponse : étape ${kk}, ligne ${i + 1}`}
              onChange={x => { const v = x.target.value; setReps(p => ({ ...p, [e.id]: v })); setVerifs(p => ({ ...p, [kk]: false })); }}/>
            {niv <= 2 && e.aide && !valides[kk] && (
              <button onClick={() => setAides(p => ({ ...p, [e.id]: !p[e.id] }))}
                style={{ ...btn(!!aides[e.id], '#d97706'), padding: '2px 8px', fontSize: 11 }}>💡 Indice</button>
            )}
            {verifs[kk] && !reveles[kk] && (
              <span style={{ fontSize: 13, fontWeight: 700 }}>{champOk(e) ? '✅' : '❌'}</span>
            )}
          </div>
          {verifs[kk] && !reveles[kk] && !champOk(e) && diagnostic(e) && (
            <div style={{ fontSize: 12, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74',
              borderRadius: 6, padding: '4px 8px', marginTop: 4, lineHeight: 1.5 }}>{diagnostic(e)}</div>
          )}
          {niv <= 2 && aides[e.id] && !valides[kk] && <div style={aideStyle}>{e.aide}</div>}
        </div>
      ))}
    </div>
  );

  const ETAPES = {
    1: { titre: "Carte d'identité des points A et B", contenu: () => carteUI,
      intro: <>Avant d'écrire la moindre équation, remplissez la carte d'identité de chaque point :
        que sait-on de sa pression P, de son altitude z et de sa vitesse v ?</> },
    2: { titre: 'Calcul des termes, un par un', contenu: () => champsUI(2),
      intro: <>La carte d'identité a simplifié la relation (en haut de la page). Calculez maintenant
        chaque terme restant, séparément des autres.</> },
    3: { titre: 'Résolution', contenu: () => champsUI(3),
      intro: niv < 4
        ? <>Il ne reste qu'une inconnue dans la relation : P<sub>hyd</sub>/Q<sub>V</sub>. Isolez-la, puis
            déduisez-en les puissances.</>
        : <>Cette fois, c'est la pompe qui est connue : partez de sa puissance pour trouver le terme
            P<sub>hyd</sub>/Q<sub>V</sub>, puis isolez l'inconnue ρ·g·z<sub>B</sub>.</> },
  };

  const blocEtape = kk => {
    const et = ETAPES[kk];
    const verrou = kk > etapeCourante;
    const fait = !!valides[kk];
    const ouvert = !verrou && (ouverts[`st${kk}`] ?? kk === etapeCourante);
    return (
      <div key={`st${kk}`} style={{ border: `1.5px solid ${kk === etapeCourante ? '#0ea5e9' : BORDER}`,
        borderRadius: 10, background: verrou ? '#f1f5f9' : BG, marginBottom: 8, opacity: verrou ? 0.7 : 1 }}>
        <button disabled={verrou} onClick={() => setOuverts(o => ({ ...o, [`st${kk}`]: !ouvert }))}
          aria-expanded={ouvert}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
            padding: '9px 12px', background: 'none', border: 'none', cursor: verrou ? 'default' : 'pointer',
            fontWeight: 700, fontSize: 14, color: TXT, textAlign: 'left' }}>
          <span>{fait ? '✅' : verrou ? '🔒' : '▶'} {kk}. {et.titre}</span>
          {!verrou && <span style={{ fontSize: 11, color: TXT2 }}>{ouvert ? '▲' : '▼'}</span>}
        </button>
        {verrou && (
          <div style={{ padding: '0 12px 9px', fontSize: 11.5, color: TXT2 }}>
            Réussissez d'abord l'étape {kk - 1}.
          </div>
        )}
        {ouvert && (
          <div style={{ padding: '0 12px 12px' }}>
            <div style={{ fontSize: 12, color: TXT2, lineHeight: 1.5, marginBottom: 8 }}>{et.intro}</div>
            {et.contenu()}
            {!fait && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button onClick={() => verifierEtape(kk)} style={btn(true)}>✓ Vérifier</button>
                {verifs[kk] && !etapeOk(kk) && (
                  <button onClick={() => corrigerEtape(kk)} style={btn(false)}>Voir la correction</button>
                )}
              </div>
            )}
            {verifs[kk] && !fait && !etapeOk(kk) && (
              <div style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 6 }}>
                {kk === 1 ? 'Au moins une case est fausse : elle est encadrée en rouge.'
                  : 'Au moins une valeur est fausse (tolérance ± 3 %). Les petits nombres peuvent s\'écrire 1,67e-4.'}
              </div>
            )}
            {reveles[kk] && (
              <div style={{ fontSize: 11.5, color: TXT2, marginTop: 6, fontStyle: 'italic' }}>
                Correction affichée : reprenez le raisonnement avant de passer à la suite.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const choixNiveau = (
    <div>
      <div style={{ fontSize: 13, color: TXT, fontWeight: 700, marginBottom: 8 }}>Choisissez un niveau</div>
      {BERN_NIVEAUX.map(nv => (
        <button key={nv.n} onClick={() => demarrerExo(nv.n)}
          style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: '9px 12px',
            borderRadius: 10, border: `1.5px solid ${nv.c}`, background: 'white', cursor: 'pointer' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: nv.c }}>{nv.n}. {nv.nom}</div>
          <div style={{ fontSize: 12, color: TXT2, marginTop: 2, lineHeight: 1.45 }}>{nv.desc}</div>
        </button>
      ))}
      <div style={{ ...box, marginTop: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 6 }}>Ouvrir un exercice avec son code</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={codeSaisi} placeholder="ex. 2-4827" aria-label="Code d'exercice"
            onChange={e => { setCodeSaisi(e.target.value); setCodeErreur(false); }}
            onKeyDown={e => { if (e.key === 'Enter') ouvrirCode(); }}
            style={{ ...inp, width: 110 }}/>
          <button onClick={ouvrirCode} style={petitBtn(true)}>Ouvrir</button>
        </div>
        {codeErreur && (
          <div style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 5 }}>
            Code non reconnu : il s'écrit « niveau-numéro », par exemple 2-4827.
          </div>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: TXT2, lineHeight: 1.5, marginTop: 8 }}>
        À chaque niveau, la même méthode : la carte d'identité des points, puis le calcul des termes, puis la résolution.
      </div>
      <div style={{ marginTop: 10 }}>
        <button onClick={() => setProfOuvert(o => !o)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12,
            color: TXT2, textDecoration: 'underline' }}>
          Espace enseignant : correction d'un exercice
        </button>
        {profOuvert && (
          <div style={{ ...box, marginTop: 6 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input value={profCode} placeholder="Code de l'exercice" aria-label="Code de l'exercice à corriger"
                onChange={e => { setProfCode(e.target.value); setProfErreur(''); }} style={inp}/>
              <input type="password" value={profMdp} placeholder="Mot de passe enseignant" aria-label="Mot de passe enseignant"
                onChange={e => { setProfMdp(e.target.value); setProfErreur(''); }}
                onKeyDown={e => { if (e.key === 'Enter') ouvrirCorrection(); }} style={inp}/>
              <button onClick={ouvrirCorrection} style={petitBtn(true)}>Afficher la correction</button>
            </div>
            {profErreur && <div style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 5 }}>{profErreur}</div>}
          </div>
        )}
      </div>
    </div>
  );

  const nivInfo = BERN_NIVEAUX.find(x => x.n === niv);
  const voletExo = !exo ? choixNiveau : (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6,
        flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'white', background: nivInfo.c,
          borderRadius: 6, padding: '3px 8px' }}>Niveau {niv} : {nivInfo.nom}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: TXT, fontFamily: 'monospace',
          border: `1.5px solid ${BORDER}`, borderRadius: 6, padding: '2px 8px', background: 'white' }}
          title="Donnez ce code aux élèves pour qu'ils aient le même exercice">
          Code {bernCode(exo)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
        <button onClick={() => demarrerExo(niv)} style={petitBtn(false)}>🔄 Autre exercice</button>
        <button onClick={() => setExo(null)} style={petitBtn(false)}>Changer de niveau</button>
      </div>
      {termine && (
        <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', background: '#f0fdf4',
          border: '1px solid #86efac', borderRadius: 8, padding: '7px 10px', marginBottom: 8 }}>
          🎉 Exercice terminé ! Le bilan en image est affiché à côté du schéma.
        </div>
      )}
      {termine && section('enonce', 'Énoncé', enonce)}
      {[1, 2, 3].map(blocEtape)}
      {termine && section('resultats', 'Résultats', resultats)}
    </>
  );

  const volet = mode === 'explore'
    ? [section('reglages', 'Réglages', reglages),
       section('resultats', 'Résultats', resultats),
       section('detail', 'Détail des pertes de charge', detail)]
    : voletExo;

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={cardStyle}>
      <style>{`
        .bern-grille { display: grid; gap: 12px;
          grid-template-columns: minmax(0, 1fr) minmax(250px, 310px) 330px;
          grid-template-areas: "equation equation volet" "schema bilan volet"; }
        .bern-volet { position: relative; min-height: 200px; }
        .bern-volet-defil { position: absolute; inset: 0; overflow-y: auto; padding-right: 4px; }
        @media print {
          body * { visibility: hidden; }
          .bern-correction, .bern-correction * { visibility: visible; }
          .bern-correction-fond { position: absolute !important; inset: auto !important; left: 0; top: 0;
            background: none !important; padding: 0 !important; }
          .bern-sans-impression { display: none !important; }
        }
        @media (max-width: 1100px) {
          .bern-grille { grid-template-columns: minmax(0, 1fr);
            grid-template-areas: "equation" "schema" "volet" "bilan"; }
          .bern-volet-defil { position: static; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: TXT, fontWeight: 700 }}>
          Circuit hydraulique et relation de Bernoulli
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => changerMode('explore')} style={btn(mode === 'explore')}>🔍 Exploration</button>
          <button onClick={() => changerMode('exercice')} style={btn(mode === 'exercice', '#0ea5e9')}>✏️ Exercice</button>
        </div>
      </div>

      {exoCorr && (() => {
        const ex = exoCorr, nvI = BERN_NIVEAUX.find(x => x.n === ex.niveau);
        const juste = { ...BERN_CARTES[ex.situation], ...(ex.niveau === 4 ? { zB: 'inc' } : {}) };
        const libelle = (g, k2) => OPTIONS[g].find(o => o.k === k2).l;
        return (
          <div className="bern-correction-fond" role="dialog" aria-modal="true" aria-label="Correction"
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000,
              display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 16, overflowY: 'auto' }}>
            <div className="bern-correction" style={{ background: 'white', borderRadius: 12, padding: '18px 22px',
              maxWidth: 860, width: '100%', color: TXT, fontSize: 15, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 19 }}>
                  Correction de l'exercice {bernCode(ex)} ({nvI.nom})
                </h3>
                <span className="bern-sans-impression" style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => window.print()} style={petitBtn(false)}>🖨️ Imprimer</button>
                  <button onClick={() => setExoCorr(null)} style={petitBtn(true)}>Fermer</button>
                </span>
              </div>

              <h4 style={{ margin: '14px 0 4px', fontSize: 15 }}>Énoncé</h4>
              {enonceDe(ex)}

              <h4 style={{ margin: '14px 0 4px', fontSize: 15 }}>1. Carte d'identité des points</h4>
              <table style={{ borderCollapse: 'collapse', fontSize: 15 }}>
                <thead><tr>
                  <th style={{ padding: '3px 12px' }}/>
                  {['P', 'z', 'v'].map(g => <th key={g} style={{ padding: '3px 14px', color: couleurGrandeur[g] }}>{g}</th>)}
                </tr></thead>
                <tbody>
                  {['A', 'B'].map(pt => (
                    <tr key={pt} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <th style={{ padding: '3px 12px' }}>{pt}</th>
                      {['P', 'z', 'v'].map(g => (
                        <td key={g} style={{ padding: '3px 14px', textAlign: 'center' }}>
                          {g === 'P' && juste[`P${pt}`] === 'don'
                            ? <>P<sub>atm</sub> + {bernFmt((pt === 'A' ? ex.pA : ex.pB) / 1000, 0)} kPa</>
                            : g === 'v' && juste[`v${pt}`] === 'qs'
                              ? (pt === 'A' && ex.situation === 'colonne' ? <>Q<sub>V</sub>/S<sub>A</sub></> : <>Q<sub>V</sub>/S</>)
                              : libelle(g, juste[`${g}${pt}`])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 14, color: TXT2, marginTop: 4 }}>{hypotheses[ex.situation]}</div>

              <h4 style={{ margin: '14px 0 4px', fontSize: 15 }}>Relation simplifiée</h4>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 17 }}>{bernRelationDe(ex.situation)}</div>

              <h4 style={{ margin: '14px 0 4px', fontSize: 15 }}>2 et 3. Calcul des termes et résolution</h4>
              <ol style={{ margin: 0, paddingLeft: 22 }}>
                {bernCorrection(ex).map((l, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <span style={{ color: TXT2 }}>{l.titre} : </span>{l.calcul}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        );
      })()}

      <div className="bern-grille">
        <div style={{ ...box, gridArea: 'schema' }}>
          <div style={titreBox}>Le circuit</div>
          {schema}
          <div style={{ fontSize: 11.5, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
            {simplifie ? hypotheses[sit] : descriptionPoints[sit]}
          </div>
        </div>

        <div style={{ ...box, gridArea: 'bilan' }}>
          {afficherBilan ? (
            <>
              <div style={titreBox}>Le bilan en image</div>
              {diagramme}
              <div style={{ fontSize: 11.5, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
                La pompe apporte de l'énergie (vert) ; la partie hachurée est perdue.
                Ce qui reste arrive en B : les deux colonnes ont la même hauteur.
              </div>
            </>
          ) : exo ? (
            <>
              <div style={titreBox}>Énoncé</div>
              {enonce}
              <div style={{ fontSize: 12, color: TXT2, marginTop: 12, fontStyle: 'italic' }}>
                Le bilan en image s'affichera ici à la fin de l'exercice.
              </div>
            </>
          ) : (
            <>
              <div style={titreBox}>La méthode</div>
              <div style={{ fontSize: 13, color: TXT, lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 8px' }}><strong>1. La carte d'identité.</strong> Pour A et pour B, on relève
                  la pression P, l'altitude z et la vitesse v.</p>
                <p style={{ margin: '0 0 8px' }}><strong>2. Les termes.</strong> La carte simplifie la relation ; on
                  calcule ensuite chaque terme restant, un par un.</p>
                <p style={{ margin: 0 }}><strong>3. La résolution.</strong> Il ne reste qu'une inconnue : on l'isole.</p>
              </div>
            </>
          )}
        </div>

        <div className="bern-volet" style={{ gridArea: 'volet' }}>
          <div className="bern-volet-defil">{volet}</div>
        </div>

        <div style={{ gridArea: 'equation' }}>{equation}</div>
      </div>
    </div>
  );
}




