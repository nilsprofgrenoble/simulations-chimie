import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle, Graphe, fmt, sci, lireNombre, proche } from "../commun";

// ====================================================
// ENERGY@SCHOOL — ATELIER HYDROGÈNE (ENSE3)
// Atelier 1 : la maquette « de l'eau à l'hydrogène »
// Atelier 2 : le banc de la pile à combustible
// Modèles calés sur les mesures des annexes A et B de l'atelier.
// ====================================================

const H2_F = 96485;        // C/mol
const H2_VM = 24;          // L/mol, gaz à 20 °C
const H2_DH = 285e3;       // J/mol (enthalpie de formation de l'eau liquide)
const H2_ETA_F = 0.72;     // rendement faradique de l'électrolyseur de la maquette
const H2_TUBE = 20;        // mL, capacité d'un tube de stockage

const COUL = {
  h2: '#16a34a', o2: '#ca8a04', elec: '#2563eb', pile: '#dc2626', chaleur: '#ea580c',
  txt: '#0f172a', txt2: '#334155', bord: '#cbd5e1', fond: '#f8fafc',
};

// ── Maquette : électrolyseur alimenté par le panneau solaire ──
const I_EL_MAX = 0.17;                         // A, à pleine lumière (annexe A)
const iElec = ecl => I_EL_MAX * ecl / 100;
const uElec = i => (i > 0 ? 1.45 + 0.4 * i : 0); // 1,52 V pour 0,17 A (annexe A)

// ── Maquette : caractéristique de la petite pile (annexe A) ──
const PAC_PTS = [[0, 0.77], [0.003, 0.76], [0.007, 0.75], [0.014, 0.73], [0.064, 0.65],
  [0.079, 0.41], [0.080, 0.23], [0.082, 0.09], [0.083, 0]];
function uPac(i) {
  if (i <= 0) return PAC_PTS[0][1];
  for (let k = 0; k < PAC_PTS.length - 1; k++) {
    const [i0, u0] = PAC_PTS[k], [i1, u1] = PAC_PTS[k + 1];
    if (i <= i1) return u0 + (u1 - u0) * (i - i0) / (i1 - i0);
  }
  return 0;
}
// Point de fonctionnement : intersection de U = f(I) et de la droite U = R·I
function pointPac(R) {
  let lo = 0, hi = 0.083;
  for (let k = 0; k < 50; k++) {
    const m = (lo + hi) / 2;
    if (uPac(m) - R * m > 0) lo = m; else hi = m;
  }
  const i = (lo + hi) / 2;
  return { i, u: R * i, p: R * i * i };
}
const CHARGES = [
  { id: '200', R: 200, nom: '200 Ω' }, { id: '100', R: 100, nom: '100 Ω' },
  { id: '50', R: 50, nom: '50 Ω' }, { id: '10', R: 10, nom: '10 Ω' },
  { id: '5', R: 5, nom: '5 Ω' }, { id: '3', R: 3, nom: '3 Ω' },
  { id: '1', R: 1, nom: '1 Ω' }, { id: 'moteur', R: 40.6, nom: 'Moteur' },
];

// ── Banc : pile de 10 cellules de 25 cm², modèle ajusté sur l'annexe B ──
const BANC_N = 10, BANC_S = 25;
const uBanc = i => 8.775 - 0.6688 * Math.log(1 + i / 0.1474) - 0.0377 * i;
const BANC_MESURES = [[0, 8.8], [0.2, 8.1], [0.52, 7.76], [0.72, 7.6], [1, 7.4], [2, 6.93], [3.01, 6.64],
  [4, 6.38], [5, 6.18], [6, 6], [7, 5.87], [8, 5.8], [9, 5.7], [10, 5.6]];
const U_TH = 1.48; // V : tension correspondant à ΔH = 285 kJ/mol (ΔH / 2F)

const MODULES = [
  { id: 'reservoir', nom: "Réservoir d'hydrure",
    role: "Stocke le dihydrogène, piégé dans un alliage métallique." },
  { id: 'detendeur', nom: 'Détendeur',
    role: 'Abaisse la pression du dihydrogène avant son entrée dans la pile.' },
  { id: 'capteurs', nom: 'Capteurs',
    role: 'Mesurent les paramètres de fonctionnement (débit, température…).' },
  { id: 'pac', nom: 'Pile à combustible',
    role: "Lieu de la réaction qui produit l'électricité (10 cellules empilées)." },
  { id: 'ventilateur', nom: 'Ventilateur',
    role: "Apporte le dioxygène de l'air et refroidit la pile." },
  { id: 'charge', nom: 'Charge électronique',
    role: 'Consomme le courant choisi et affiche I, U et P.' },
];

// ════════════════ COMPOSANT PRINCIPAL ════════════════
export function SimulationHydrogene() {
  const [atelier, setAtelier] = useState(1);        // 1 : maquette, 2 : banc
  const [mode, setMode] = useState('explore');      // 'explore' | 'defi'
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true, module: true });

  // ── Maquette ──
  const [ecl, setEcl] = useState(100);
  const [elecOn, setElecOn] = useState(true);
  const [pacOn, setPacOn] = useState(false);
  const [chargeId, setChargeId] = useState('10');
  const [vitesse, setVitesse] = useState(10);
  const [marche, setMarche] = useState(false);
  const [etat, setEtat] = useState({ t: 0, vH2: 0, vO2: 0, eEl: 0, ePac: 0, hist: [[0, 0, 0]] });
  const [ongletG1, setOngletG1] = useState('volumes');

  // ── Banc ──
  const [iBanc, setIBanc] = useState(5);
  const [module, setModule] = useState(null);
  const [ongletG2, setOngletG2] = useState('ui');
  const [pCible, setPCible] = useState(1000);
  const [uCible, setUCible] = useState(24);

  // ── Défis ──
  const [niveau, setNiveau] = useState(null);
  const [reps, setReps] = useState({});
  const [verifie, setVerifie] = useState(false);
  const [releve, setReleve] = useState(null);       // mesures relevées par l'élève (maquette)
  const [cibleDefi, setCibleDefi] = useState({ P: 1000, U: 24 });

  const charge = CHARGES.find(c => c.id === chargeId);
  const iEl = elecOn ? iElec(ecl) : 0;
  const uEl = uElec(iEl);
  // Alimentation de la pile en gaz. Tubes presque vides : la pile ne peut consommer que ce que
  // l'électrolyseur produit au même moment (courant « équivalent » H2_ETA_F × I), sa tension chute.
  // Ce régime est stable : il évite le clignotement entre « pile en marche » et « pas de gaz ».
  const stock = etat.vH2 > 0.05 && etat.vO2 > 0.025;
  const iAppro = elecOn && etat.vH2 < H2_TUBE ? H2_ETA_F * iEl : 0;
  const gazDispo = stock || iAppro > 0;
  const affame = pacOn && !stock && iAppro > 0 && pointPac(charge.R).i > iAppro;
  const pt = !pacOn ? { i: 0, u: stock ? 0.77 : 0, p: 0 }
    : stock ? pointPac(charge.R)
    : iAppro > 0 ? (() => { const p0 = pointPac(charge.R), i = Math.min(p0.i, iAppro); return { i, u: charge.R * i, p: charge.R * i * i }; })()
    : { i: 0, u: 0, p: 0 };

  // ── Boucle de simulation (maquette) ──
  const refs = useRef({});
  refs.current = { iEl, uEl, pt, pacOn };
  useEffect(() => {
    if (!marche) return;
    let prec = performance.now(), id;
    const pas = now => {
      const dt = Math.min(0.1, (now - prec) / 1000) * vitesse; prec = now;
      const { iEl: ie, uEl: ue, pt: p } = refs.current;
      setEtat(e => {
        const prodH2 = ie > 0 && e.vH2 < H2_TUBE ? H2_ETA_F * ie / (2 * H2_F) * H2_VM * 1000 : 0; // mL/s
        const consH2 = Math.min(p.i / (2 * H2_F) * H2_VM * 1000, prodH2 + e.vH2 / dt); // on ne consomme pas plus que ce qu'il y a
        const vH2 = Math.max(0, Math.min(H2_TUBE, e.vH2 + (prodH2 - consH2) * dt));
        const vO2 = Math.max(0, Math.min(H2_TUBE, e.vO2 + (prodH2 - consH2) / 2 * dt));
        const t = e.t + dt;
        const hist = t - e.hist[e.hist.length - 1][0] >= 5 ? [...e.hist.slice(-400), [t, vH2, vO2]] : e.hist;
        return { t, vH2, vO2, eEl: e.eEl + ue * ie * dt, ePac: e.ePac + p.p * dt, hist };
      });
      id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [marche, vitesse]);

  function reinitialiser() {
    setMarche(false);
    setEtat({ t: 0, vH2: 0, vO2: 0, eEl: 0, ePac: 0, hist: [[0, 0, 0]] });
  }

  // Bilan d'énergie de l'électrolyse (gaz réellement stocké)
  const nH2 = etat.vH2 / 1000 / H2_VM;
  const eStock = nH2 * H2_DH;

  // Banc
  const uB = uBanc(iBanc), pB = uB * iBanc, uCell = uB / BANC_N, jB = iBanc / BANC_S, etaB = uCell / U_TH;
  const debitH2 = BANC_N * iBanc / (2 * H2_F) * H2_VM * 60; // L/min

  // ── Styles ──
  const { txt: TXT, txt2: TXT2, bord: BORDER, fond: BG } = COUL;
  const box = { background: BG, borderRadius: 10, padding: '10px 12px', border: `1px solid ${BORDER}` };
  const titreBox = { fontWeight: 700, fontSize: 14, color: TXT, marginBottom: 6 };
  const btn = (actif, c = '#16a34a') => ({ padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, border: `1.5px solid ${actif ? c : BORDER}`,
    background: actif ? c : 'white', color: actif ? 'white' : TXT2 });
  const petitBtn = (actif, c) => ({ ...btn(actif, c), padding: '5px 10px', fontSize: 13 });
  const inp = { fontSize: 13, padding: '4px 8px', border: `1.5px solid ${BORDER}`, borderRadius: 6,
    background: 'white', color: TXT };
  const ligne = (k, v, c) => (
    <div key={typeof k === 'string' ? k : undefined} style={{ display: 'flex', justifyContent: 'space-between', gap: 8,
      padding: '5px 0', borderBottom: `1px dashed ${BORDER}`, fontSize: 14 }}>
      <span style={{ color: TXT2, fontWeight: 600 }}>{k}</span>
      <span style={{ color: c || TXT, fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{v}</span>
    </div>
  );

  function section(id, titre, contenu) {
    return (
      <div key={id} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: BG, marginBottom: 8 }}>
        <button onClick={() => setOuverts(o => ({ ...o, [id]: !o[id] }))} aria-expanded={!!ouverts[id]}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 15.5, color: TXT, textAlign: 'left' }}>
          <span>{titre}</span><span style={{ fontSize: 11, color: TXT2 }}>{ouverts[id] ? '▲' : '▼'}</span>
        </button>
        {ouverts[id] && <div style={{ padding: '0 12px 12px' }}>{contenu}</div>}
      </div>
    );
  }
  function curseur(label, valeur, set, min, max, step, unite, d = 0) {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: TXT2, fontWeight: 700 }}>
          <span>{label}</span><span style={{ color: TXT }}>{fmt(valeur, d)} {unite}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={valeur}
          onChange={e => set(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#16a34a' }}/>
      </div>
    );
  }

  // ════════════════ SCHÉMA : MAQUETTE ════════════════
  const afficheur = (x, y, texte, c) => (
    <g>
      <rect x={x} y={y} width="92" height="26" rx="4" fill="#0f172a"/>
      <text x={x + 46} y={y + 19} fontSize="16" fill={c} textAnchor="middle" fontFamily="monospace" fontWeight="700">{texte}</text>
    </g>
  );
  const interrupteur = (x, y, ferme, onClick, horizontal = false) => (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={x - 16} y={y - 16} width="32" height="32" fill="transparent"/>
      <circle cx={horizontal ? x - 10 : x} cy={horizontal ? y : y - 10} r="3" fill={TXT}/>
      <circle cx={horizontal ? x + 10 : x} cy={horizontal ? y : y + 10} r="3" fill={TXT}/>
      <line x1={horizontal ? x - 10 : x} y1={horizontal ? y : y - 10}
        x2={horizontal ? (ferme ? x + 10 : x + 7) : (ferme ? x : x + 9)}
        y2={horizontal ? (ferme ? y : y - 9) : (ferme ? y + 10 : y + 6)} stroke={TXT} strokeWidth="2.5"/>
    </g>
  );
  const tube = (x, v, couleur, nom, gauche) => {
    const yH = 40, hT = 108, hGaz = (v / H2_TUBE) * hT;
    return (
      <g>
        <rect x={x} y={yH} width="28" height={hT} fill="#dbeafe"/>
        <rect x={x} y={yH} width="28" height={hGaz} fill={couleur} opacity="0.35"/>
        <rect x={x} y={yH} width="28" height={hT} fill="none" stroke={TXT} strokeWidth="2" rx="4"/>
        {[0, 5, 10, 15, 20].map(g => (
          <line key={g} x1={x} y1={yH + (g / H2_TUBE) * hT} x2={x + 7} y2={yH + (g / H2_TUBE) * hT} stroke={TXT} strokeWidth="1"/>
        ))}
        {marche && iEl > 0 && v < H2_TUBE && [0, 1, 2].map(k => (
          <circle key={k} cx={x + 9 + k * 5} cy={yH + hT - 8} r="2.2" fill="white" stroke={couleur}>
            <animate attributeName="cy" from={yH + hT - 4} to={yH + hGaz + 4} dur={`${1.2 + k * 0.4}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        <text x={gauche ? x - 6 : x + 34} y={yH + 22} fontSize="18" fontWeight="700" fill={couleur}
          textAnchor={gauche ? 'end' : 'start'}>{nom}</text>
        <text x={gauche ? x - 6 : x + 34} y={yH + 40} fontSize="15" fontWeight="700" fill={couleur}
          textAnchor={gauche ? 'end' : 'start'}>{fmt(v, 1)} mL</text>
      </g>
    );
  };
  const eclat = ecl / 100;
  const schemaMaquette = (
    <svg viewBox="0 0 640 300" role="img" aria-label="Maquette de la lampe à la pile à combustible"
      style={{ width: '100%', height: 'auto', maxHeight: '46vh', display: 'block', background: 'white',
        borderRadius: 8, border: `1px solid ${BORDER}` }}>
      {/* Lampe */}
      <circle cx="42" cy="70" r="24" fill="#fde047" opacity={0.15 + 0.85 * eclat} stroke="#a16207" strokeWidth="2"/>
      {eclat > 0 && [0, 1, 2, 3, 4].map(k => {
        const a = (-40 + k * 20) * Math.PI / 180;
        return <line key={k} x1={42 + 30 * Math.cos(a)} y1={70 + 30 * Math.sin(a)} x2={42 + (30 + 22 * eclat) * Math.cos(a)}
          y2={70 + (30 + 22 * eclat) * Math.sin(a)} stroke="#eab308" strokeWidth="3" strokeLinecap="round"/>;
      })}
      <text x="42" y="118" fontSize="17" fontWeight="700" fill={TXT} textAnchor="middle">Lampe</text>
      {/* Panneau solaire */}
      <g transform="translate(100 52)">
        <rect width="64" height="80" fill="#1e3a8a" stroke={TXT} strokeWidth="2" rx="3"/>
        {[1, 2, 3].map(k => <line key={`h${k}`} x1="0" y1={k * 20} x2="64" y2={k * 20} stroke="#93c5fd" strokeWidth="1"/>)}
        <line x1="32" y1="0" x2="32" y2="80" stroke="#93c5fd" strokeWidth="1"/>
      </g>
      <text x="132" y="150" fontSize="17" fontWeight="700" fill={TXT} textAnchor="middle">Panneau</text>
      <text x="132" y="167" fontSize="17" fontWeight="700" fill={TXT} textAnchor="middle">solaire</text>

      {/* Câbles panneau → électrolyseur */}
      <polyline points="164,80 205,80 205,128" fill="none" stroke={COUL.elec} strokeWidth="2.5"/>
      {interrupteur(205, 142, elecOn, () => setElecOn(v => !v))}
      <polyline points="205,156 205,190 226,190" fill="none" stroke={COUL.elec} strokeWidth="2.5"/>
      <polyline points="132,132 132,180 150,180 150,222 226,222" fill="none" stroke={COUL.elec} strokeWidth="2.5"/>
      {/* Électrolyseur et tubes */}
      {tube(236, etat.vH2, COUL.h2, 'H₂', true)}
      {tube(296, etat.vO2, COUL.o2, 'O₂')}
      <rect x="226" y="152" width="112" height="84" rx="6" fill="#e0f2fe" stroke={TXT} strokeWidth="2"/>
      <text x="282" y="186" fontSize="16" fontWeight="700" fill={TXT} textAnchor="middle">Électro-</text>
      <text x="282" y="203" fontSize="16" fontWeight="700" fill={TXT} textAnchor="middle">lyseur</text>
      {afficheur(186, 244, `${fmt(uEl, 2)} V`, '#93c5fd')}
      {afficheur(286, 244, `${fmt(iEl, 3)} A`, '#93c5fd')}

      {/* Tuyaux de gaz vers la pile */}
      <polyline points="250,40 250,20 474,20 474,152" fill="none" stroke={COUL.h2} strokeWidth="5" opacity="0.8"/>
      <polyline points="310,40 310,30 434,30 434,152" fill="none" stroke={COUL.o2} strokeWidth="5" opacity="0.8"/>
      {/* Pile à combustible */}
      <rect x="400" y="152" width="110" height="84" rx="6" fill="#fee2e2" stroke={TXT} strokeWidth="2"/>
      <text x="455" y="186" fontSize="16" fontWeight="700" fill={TXT} textAnchor="middle">Pile à</text>
      <text x="455" y="203" fontSize="16" fontWeight="700" fill={TXT} textAnchor="middle">combustible</text>
      {afficheur(404, 244, `${fmt(pt.u, 2)} V`, '#fca5a5')}
      {afficheur(504, 244, `${fmt(pt.i, 3)} A`, '#fca5a5')}
      {/* Câbles pile → charge */}
      <polyline points="500,172 520,172" fill="none" stroke={COUL.pile} strokeWidth="2.5"/>
      {interrupteur(536, 172, pacOn, () => setPacOn(v => !v), true)}
      <polyline points="552,172 572,172 572,178" fill="none" stroke={COUL.pile} strokeWidth="2.5"/>
      <polyline points="500,222 606,222 606,214" fill="none" stroke={COUL.pile} strokeWidth="2.5"/>
      {/* Charge */}
      {charge.id === 'moteur' ? (
        <g>
          <circle cx="589" cy="196" r="20" fill="white" stroke={TXT} strokeWidth="2"/>
          <text x="589" y="202" fontSize="17" fontWeight="700" fill={TXT} textAnchor="middle">M</text>
          <g transform="translate(589 140)">
            <g>
              {[0, 120, 240].map(a => <ellipse key={a} cx="0" cy="-14" rx="5" ry="14" fill="#94a3b8" transform={`rotate(${a})`}/>)}
              {pt.i > 0.005 && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.6s" repeatCount="indefinite"/>}
            </g>
            <circle r="4" fill={TXT}/>
          </g>
        </g>
      ) : (
        <g>
          <rect x="566" y="178" width="46" height="36" fill="white" stroke={TXT} strokeWidth="2"/>
          <text x="589" y="201" fontSize="15" fontWeight="700" fill={TXT} textAnchor="middle">{charge.nom}</text>
        </g>
      )}
      <text x="589" y="120" fontSize="16" fontWeight="700" fill={TXT} textAnchor="middle">Charge</text>
      
      <text x="320" y="292" fontSize="14" fill={TXT2} textAnchor="middle">
        Chronomètre : {fmt(etat.t / 60, 1)} min{marche ? ` (accéléré × ${vitesse})` : ''}
      </text>
    </svg>
  );

  // ════════════════ SCHÉMA : BANC ════════════════
  const actifM = id => module === id;
  const cadreModule = (id, x, y, w, h) => (
    <rect x={x} y={y} width={w} height={h} rx="8" fill={actifM(id) ? '#fef9c3' : 'transparent'}
      stroke={actifM(id) ? '#ca8a04' : 'transparent'} strokeWidth="2.5" strokeDasharray="6 3"
      onClick={() => setModule(m => (m === id ? null : id))} style={{ cursor: 'pointer' }}/>
  );
  const dureeHelice = iBanc > 0.05 ? Math.max(0.2, 2.5 - iBanc * 0.22) : 0;
  const schemaBanc = (
    <svg viewBox="0 0 640 300" role="img" aria-label="Banc de la pile à combustible"
      style={{ width: '100%', height: 'auto', maxHeight: '46vh', display: 'block', background: 'white',
        borderRadius: 8, border: `1px solid ${BORDER}` }}>
      {cadreModule('reservoir', 8, 52, 128, 82)}
      {cadreModule('detendeur', 142, 52, 70, 82)}
      {cadreModule('capteurs', 236, 62, 92, 62)}
      {cadreModule('ventilateur', 368, 4, 100, 64)}
      {cadreModule('pac', 356, 72, 124, 118)}
      {cadreModule('charge', 500, 70, 132, 150)}
      <g pointerEvents="none">
        {/* Réservoir */}
        <rect x="24" y="72" width="96" height="40" rx="18" fill="#e5e7eb" stroke={TXT} strokeWidth="2"/>
        <rect x="24" y="72" width="18" height="40" rx="6" fill="#dc2626"/>
        <rect x="102" y="72" width="18" height="40" rx="6" fill="#dc2626"/>
        <text x="72" y="128" fontSize="15" fontWeight="700" fill={TXT} textAnchor="middle">Réservoir</text>
        {/* Détendeur */}
        <circle cx="177" cy="92" r="17" fill="white" stroke={TXT} strokeWidth="2"/>
        <line x1="177" y1="92" x2="187" y2="84" stroke="#dc2626" strokeWidth="2"/>
        <text x="177" y="128" fontSize="15" fontWeight="700" fill={TXT} textAnchor="middle">Détendeur</text>
        {/* Tuyau H2 */}
        <line x1="120" y1="92" x2="160" y2="92" stroke="#dc2626" strokeWidth="6"/>
        <line x1="194" y1="92" x2="360" y2="92" stroke="#dc2626" strokeWidth="6"/>
        <polygon points="352,84 364,92 352,100" fill="#dc2626"/>
        <text x="215" y="84" fontSize="17" fontWeight="700" fill="#dc2626">H₂</text>
        {/* Capteurs */}
        <rect x="248" y="78" width="68" height="28" rx="4" fill="white" stroke={TXT} strokeWidth="2"/>
        <text x="282" y="97" fontSize="14" fontWeight="700" fill={TXT} textAnchor="middle">débit, T</text>
        <text x="282" y="120" fontSize="15" fontWeight="700" fill={TXT} textAnchor="middle">Capteurs</text>
        {/* Ventilateur */}
        <g transform="translate(418 34)">
          <circle r="24" fill="white" stroke={TXT} strokeWidth="2"/>
          <g>
            {[0, 90, 180, 270].map(a => <ellipse key={a} cx="0" cy="-11" rx="5" ry="11" fill="#60a5fa" transform={`rotate(${a})`}/>)}
            {dureeHelice > 0 && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur={`${dureeHelice}s`} repeatCount="indefinite"/>}
          </g>
        </g>
        <text x="468" y="30" fontSize="14" fill={TXT2}>air (O₂)</text>
        {/* Pile : 10 cellules */}
        <rect x="372" y="80" width="92" height="96" rx="4" fill="#fee2e2" stroke={TXT} strokeWidth="2"/>
        {Array.from({ length: BANC_N + 1 }, (_, k) => (
          <line key={k} x1={378 + k * 8} y1="84" x2={378 + k * 8} y2="172" stroke="#7f1d1d" strokeWidth="2"/>
        ))}
        <text x="418" y="198" fontSize="15" fontWeight="700" fill={TXT} textAnchor="middle">Pile (10 cellules)</text>
        {/* Câbles */}
        <polyline points="418,176 418,232 540,232 540,212" fill="none" stroke={COUL.pile} strokeWidth="2.5"/>
        <polyline points="464,120 520,120" fill="none" stroke={COUL.elec} strokeWidth="2.5"/>
        {/* Charge électronique */}
        <rect x="514" y="80" width="108" height="130" rx="6" fill="#f1f5f9" stroke={TXT} strokeWidth="2"/>
        {afficheur(522, 90, `${fmt(iBanc, 2)} A`, '#fca5a5')}
        {afficheur(522, 120, `${fmt(uB, 2)} V`, '#93c5fd')}
        {afficheur(522, 150, `${fmt(pB, 1)} W`, '#86efac')}
        <text x="568" y="198" fontSize="14.5" fontWeight="700" fill={TXT} textAnchor="middle">Charge</text>
        <text x="320" y="270" fontSize="15" fill={TXT2} textAnchor="middle">
          Cliquez sur un élément du banc pour savoir à quoi il sert.
        </text>
      </g>
    </svg>
  );

  // ════════════════ GRAPHIQUES ════════════════
  const ptsPac = Array.from({ length: 84 }, (_, k) => [k / 1000, uPac(k / 1000)]);
  const grapheMaquette = (() => {
    if (ongletG1 === 'volumes') {
      const tMax = Math.max(10, Math.ceil(etat.t / 60 / 5) * 5);
      const pts = [...etat.hist, [etat.t, etat.vH2, etat.vO2]];
      return <Graphe xMax={tMax} yMax={H2_TUBE} xLabel="t (min)" yLabel="Volume de gaz (mL)"
        courbes={[{ pts: pts.map(p => [p[0] / 60, p[1]]), color: COUL.h2, label: 'dihydrogène H₂' },
          { pts: pts.map(p => [p[0] / 60, p[2]]), color: COUL.o2, label: 'dioxygène O₂' }]}/>;
    }
    if (ongletG1 === 'caract') {
      const R = charge.R, iMax = 0.09;
      const pOp = pointPac(R);
      return <Graphe xMax={iMax} yMax={0.9} xLabel="I (A)" yLabel="U (V)"
        courbes={[{ pts: ptsPac, color: COUL.pile, label: 'pile : U = f(I)' },
          { pts: [[0, 0], [Math.min(iMax, 0.9 / R), Math.min(0.9, R * iMax)]], color: TXT2, dash: '5 4', label: `charge : U = R × I` }]}
        points={pacOn && pt.i > 0 ? [{ x: pt.i, y: pt.u, color: TXT, fill: '#fde047', r: 6 }] : []}/>;
    }
    const barres = CHARGES.filter(c => c.id !== 'moteur').map(c => ({
      label: c.nom, val: pointPac(c.R).p * 1000, color: COUL.pile, fort: c.id === chargeId }));
    return <Graphe xMax={1} yMax={50} xLabel="Résistance de charge" yLabel="Puissance de la pile (mW)" barres={barres}/>;
  })();

  const ptsBanc = Array.from({ length: 101 }, (_, k) => k / 10);
  const grapheBanc = (() => {
    const zones = [{ x0: 0, x1: 2, color: '#7c3aed', label: 'activation' }, { x0: 2, x1: 10, color: '#2563eb', label: 'zone ohmique' }];
    if (ongletG2 === 'ui') return <Graphe xMax={10} yMax={10} xLabel="I (A)" yLabel="U de la pile (V)" zones={zones}
      courbes={[{ pts: ptsBanc.map(i => [i, uBanc(i)]), color: COUL.pile, label: 'modèle' }]}
      points={[...BANC_MESURES.map(([i, u]) => ({ x: i, y: u, color: TXT, fill: 'white', r: 3.5 })),
        { x: iBanc, y: uB, color: TXT, fill: '#fde047', r: 6.5 }]}/>;
    if (ongletG2 === 'pi') return <Graphe xMax={10} yMax={60} xLabel="I (A)" yLabel="P (W)"
      courbes={[{ pts: ptsBanc.map(i => [i, i * uBanc(i)]), color: '#16a34a', label: 'P = U × I' },
        { pts: [[0, 0], [10, 10 * uBanc(0.01) ]], color: '#94a3b8', dash: '5 4', label: 'si U restait constante' }]}
      points={[{ x: iBanc, y: pB, color: TXT, fill: '#fde047', r: 6.5 }]}/>;
    return <Graphe xMax={10} yMax={70} xLabel="I (A)" yLabel="Rendement de la pile (%)"
      courbes={[{ pts: ptsBanc.map(i => [i, uBanc(i) / BANC_N / U_TH * 100]), color: '#7c3aed', label: 'η = U cellule / 1,48 V' }]}
      points={[{ x: iBanc, y: etaB * 100, color: TXT, fill: '#fde047', r: 6.5 }]}/>;
  })();

  // ════════════════ VOLETS D'EXPLORATION ════════════════
  const commandesMaquette = (
    <>
      {curseur("Éclairement de la lampe", ecl, setEcl, 0, 100, 5, '%')}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setMarche(m => !m)} style={btn(true, marche ? '#d97706' : '#16a34a')}>
          {marche ? '⏸ Pause' : '▶ Lancer le chrono'}
        </button>
        <button onClick={reinitialiser} style={btn(false)}>↺ Vider les tubes</button>
      </div>
      <div style={{ fontSize: 12, color: TXT2, fontWeight: 700, marginBottom: 3 }}>Vitesse du temps</div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
        {[1, 10, 60].map(v => <button key={v} onClick={() => setVitesse(v)} style={petitBtn(vitesse === v)}>× {v}</button>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        <button onClick={() => setElecOn(v => !v)} style={petitBtn(elecOn, COUL.elec)}>
          {elecOn ? '🔌 Électrolyseur branché' : '🔌 Électrolyseur débranché'}
        </button>
        <button onClick={() => setPacOn(v => !v)} style={petitBtn(pacOn, COUL.pile)}>
          {pacOn ? '🔌 Pile branchée sur la charge' : '🔌 Pile débranchée'}
        </button>
      </div>
      <div style={{ fontSize: 12, color: TXT2, fontWeight: 700, marginBottom: 3 }}>Charge branchée sur la pile</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {CHARGES.map(c => <button key={c.id} onClick={() => setChargeId(c.id)}
          style={{ ...petitBtn(chargeId === c.id, COUL.pile), padding: '3px 8px' }}>{c.nom}</button>)}
      </div>
      {pacOn && affame && (
        <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 8 }}>
          Les tubes sont presque vides : la pile ne consomme que le gaz produit à l'instant par l'électrolyseur,
          sa tension et sa puissance sont réduites.
        </div>
      )}
      {pacOn && !gazDispo && (
        <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 8 }}>
          La pile n'a pas de gaz : produisez d'abord du dihydrogène et du dioxygène.
        </div>
      )}
    </>
  );
  const mesuresMaquette = (
    <>
      {ligne('Durée', `${fmt(etat.t, 0)} s (${fmt(etat.t / 60, 1)} min)`)}
      {ligne(<>Électrolyseur : tension U</>, `${fmt(uEl, 2)} V`, COUL.elec)}
      {ligne(<>Électrolyseur : intensité I</>, `${fmt(iEl, 3)} A`, COUL.elec)}
      {ligne(<>Électrolyseur : puissance P = U × I</>, `${fmt(uEl * iEl, 3)} W`, COUL.elec)}
      {ligne(<>Volume de H<sub>2</sub></>, `${fmt(etat.vH2, 1)} mL`, COUL.h2)}
      {ligne(<>Volume de O<sub>2</sub></>, `${fmt(etat.vO2, 1)} mL`, COUL.o2)}
      {ligne(<>Pile : tension U</>, `${fmt(pt.u, 2)} V`, COUL.pile)}
      {ligne(<>Pile : intensité I</>, `${fmt(pt.i, 3)} A`, COUL.pile)}
      {ligne(<>Pile : puissance P = U × I</>, `${fmt(pt.p * 1000, 1)} mW`, COUL.pile)}
    </>
  );
  const bilanMaquette = (
    <>
      {ligne("Énergie électrique consommée par l'électrolyseur", `${fmt(etat.eEl, 0)} J`, COUL.elec)}
      {ligne(<>Quantité de H<sub>2</sub> stockée n = V / V<sub>m</sub></>, `${sci(nH2)} mol`, COUL.h2)}
      {ligne(<>Énergie chimique stockée n × 285 kJ·mol⁻¹</>, `${fmt(eStock, 0)} J`, COUL.h2)}
      {ligne("Rendement de l'électrolyseur", etat.eEl > 1 ? `${fmt(eStock / etat.eEl * 100, 0)} %` : '—', COUL.chaleur)}
      {ligne('Énergie électrique rendue par la pile', `${fmt(etat.ePac, 1)} J`, COUL.pile)}
      <div style={{ fontSize: 11.5, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
        L'énergie qui manque n'a pas disparu : elle est partie en chaleur dans l'électrolyseur et dans la pile.
        V<sub>m</sub> = 24 L·mol⁻¹ pour un gaz à 20 °C.
      </div>
    </>
  );
  const comprendreMaquette = (
    <div style={{ fontSize: 12.5, color: TXT, lineHeight: 1.65 }}>
      <div><strong>Électrolyse</strong> (on stocke) : 2 H<sub>2</sub>O → 2 H<sub>2</sub> + O<sub>2</sub></div>
      <div style={{ paddingLeft: 10, color: TXT2 }}>
        cathode (–) : 2 H⁺ + 2 e⁻ → H<sub>2</sub> ; anode (+) : H<sub>2</sub>O → 2 H⁺ + ½ O<sub>2</sub> + 2 e⁻
      </div>
      <div style={{ marginTop: 4 }}><strong>Pile</strong> (on restitue) : 2 H<sub>2</sub> + O<sub>2</sub> → 2 H<sub>2</sub>O</div>
      <div style={{ marginTop: 6, color: TXT2 }}>
        Il faut 2 électrons pour produire une molécule de H<sub>2</sub>, et 4 pour une molécule de O<sub>2</sub> :
        c'est pourquoi on obtient deux fois plus de dihydrogène que de dioxygène.
        Loi de Faraday : n(e⁻) = I × Δt / F, avec F = 96 485 C·mol⁻¹.
      </div>
      <div style={{ marginTop: 6, color: TXT2 }}>
        Le dihydrogène n'est pas une source d'énergie : c'est un <strong>vecteur</strong>. Il stocke l'énergie
        électrique du panneau solaire pour la rendre plus tard, grâce à la pile.
      </div>
    </div>
  );

  const commandesBanc = (
    <>
      {curseur('Courant demandé à la pile', iBanc, setIBanc, 0, 10, 0.1, 'A', 1)}
      {ligne('Tension de la pile U', `${fmt(uB, 2)} V`, COUL.elec)}
      {ligne('Puissance P = U × I', `${fmt(pB, 1)} W`, '#16a34a')}
      {ligne('Tension par cellule (10 cellules)', `${fmt(uCell, 3)} V`)}
      {ligne('Densité de courant J = I / 25 cm²', `${fmt(jB, 2)} A·cm⁻²`)}
      {ligne('Rendement de la pile', `${fmt(etaB * 100, 0)} %`, '#7c3aed')}
      {ligne(<>Consommation de H<sub>2</sub></>, `${fmt(debitH2, 2)} L·min⁻¹`, COUL.h2)}
      <div style={{ fontSize: 12.5, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
        Rendement = tension d'une cellule / 1,48 V : voir « D'où vient 1,48 V ? ».
      </div>
    </>
  );
  const origine148 = (
    <div style={{ fontSize: 13.5, color: TXT, lineHeight: 1.65 }}>
      <div>Pendant une durée Δt, une cellule débite le courant I, donc la charge I × Δt.</div>
      <div><strong>Loi de Faraday</strong> : 2 électrons par molécule de H<sub>2</sub>, donc
        n(H<sub>2</sub>) = I × Δt / (2F) consommé.</div>
      <div><strong>Énergie chimique</strong> libérée par la réaction : E<sub>chim</sub> = n(H<sub>2</sub>) × ΔH = I × Δt × ΔH / (2F).</div>
      <div><strong>Énergie électrique</strong> fournie : E<sub>élec</sub> = U<sub>cellule</sub> × I × Δt.</div>
      <div style={{ margin: '6px 0', padding: '6px 10px', background: 'white', border: `1px solid ${BORDER}`, borderRadius: 6 }}>
        η = E<sub>élec</sub> / E<sub>chim</sub> = U<sub>cellule</sub> / (ΔH / 2F), avec
        ΔH / 2F = 285 000 / (2 × 96 485) ≈ <strong>1,48 V</strong>.
      </div>
      <div style={{ color: TXT2 }}>
        I × Δt se simplifie : 1,48 V est la tension qu'aurait une cellule qui transformerait toute l'énergie
        de la réaction en électricité. La tension réelle, plus faible, dit directement quelle part est récupérée.
      </div>
      <div style={{ color: TXT2, marginTop: 6 }}>
        Deux précautions : on suppose que tout le dihydrogène consommé réagit (pas de fuite ni de purge),
        et certains documents divisent par 1,23 V (énergie maximale récupérable, ΔG) au lieu de 1,48 V (ΔH) :
        le rendement annoncé est alors plus élevé.
      </div>
    </div>
  );
  const moduleInfo = MODULES.find(m => m.id === module);
  const infoModule = moduleInfo ? (
    <div style={{ fontSize: 13, color: TXT, lineHeight: 1.55 }}>
      <strong>{moduleInfo.nom}</strong> : {moduleInfo.role}
    </div>
  ) : <div style={{ fontSize: 12.5, color: TXT2 }}>Cliquez sur un élément du schéma.</div>;
  const uCellD = uCell || 1e-9, jD = jB || 1e-9;
  const nCell = Math.ceil(uCible / uCellD), iDim = pCible / uCible, sDim = iDim / jD;
  const dimension = (
    <>
      <div style={{ fontSize: 12, color: TXT2, marginBottom: 8, lineHeight: 1.5 }}>
        On garde le point de fonctionnement choisi avec le curseur (U cellule = {fmt(uCell, 3)} V,
        J = {fmt(jB, 2)} A·cm⁻²).
      </div>
      {curseur('Puissance voulue', pCible, setPCible, 100, 5000, 100, 'W')}
      {curseur('Tension voulue', uCible, setUCible, 6, 96, 6, 'V')}
      {iBanc < 0.1 ? <div style={{ fontSize: 12, color: '#b91c1c' }}>Choisissez un courant non nul.</div> : <>
        {ligne('Nombre de cellules N = U / U cellule', `${nCell}`, '#7c3aed')}
        {ligne('Courant I = P / U', `${fmt(iDim, 1)} A`)}
        {ligne('Surface d’une cellule S = I / J', `${fmt(sDim, 0)} cm²`, '#7c3aed')}
        <div style={{ fontSize: 11.5, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
          À faible courant, la pile a un meilleur rendement mais il faut des cellules plus grandes :
          c'est plus lourd et plus cher. D'où le choix entre rendement (usage fixe) et puissance (voiture).
        </div>
      </>}
    </>
  );

  // ════════════════ DÉFIS ════════════════
  const NIVEAUX = [
    { n: 1, nom: 'Découverte', c: '#16a34a', desc: 'Observer et raisonner, sans calcul.' },
    { n: 2, nom: 'Calculs', c: '#0ea5e9', desc: atelier === 1 ? "Puissance, énergie et rendement à partir de vos mesures." : 'Lire le banc et calculer U cellule, J, P, rendement.' },
    { n: 3, nom: 'Expert', c: '#dc2626', desc: atelier === 1 ? 'Loi de Faraday, tableau d’avancement et rendement de toute la maquette.' : 'Dimensionner une pile réelle.' },
  ];
  const pp = pointPac(10), pm = pointPac(CHARGES.find(c => c.id === 'moteur').R);
  // Questions : type 'qcm' (options, bonne) ou 'num' (vrai, unite, tol, pieges [valeur, message], aide)
  const questions = (() => {
    if (!niveau) return [];
    if (atelier === 1 && niveau === 1) return [
      { id: 'q1', type: 'qcm', q: "Lancez l'électrolyse quelques minutes. Quel tube se remplit le plus vite ?",
        options: ['Le tube de H₂', 'Le tube de O₂', 'Les deux au même rythme'], bonne: 0,
        expl: "L'eau H₂O contient deux fois plus d'atomes d'hydrogène que d'oxygène." },
      { id: 'q2', type: 'qcm', q: 'Comparez les deux volumes. Que constatez-vous ?',
        options: ['V(H₂) ≈ 2 × V(O₂)', 'V(H₂) ≈ V(O₂)', 'V(O₂) ≈ 2 × V(H₂)'], bonne: 0,
        expl: '2 H₂O → 2 H₂ + O₂ : deux molécules de H₂ pour une de O₂.' },
      { id: 'q3', type: 'qcm', q: "Diminuez l'éclairement de la lampe. La production de gaz…",
        options: ['augmente', 'diminue', 'ne change pas'], bonne: 1,
        expl: 'Moins de lumière, moins de courant : moins d’électrons pour décomposer l’eau.' },
      { id: 'q4', type: 'qcm', q: 'Branchez la pile sur 200 Ω, puis sur 1 Ω. Quand la résistance diminue, la tension de la pile…',
        options: ['augmente', 'diminue', 'reste la même'], bonne: 1,
        expl: 'La pile débite plus de courant et perd plus de tension dans sa propre résistance interne.' },
      { id: 'q5', type: 'qcm', q: 'Pour quelle charge la pile fournit-elle la plus grande puissance ? (onglet « Puissance »)',
        options: ['200 Ω', '50 Ω', '10 Ω', '1 Ω'], bonne: 2,
        expl: 'Avec 200 Ω le courant est trop faible, avec 1 Ω la tension s’effondre : le maximum est entre les deux.' },
      { id: 'q6', type: 'qcm', q: "Toute l'énergie électrique donnée à l'électrolyseur n'est pas stockée. Où est passé le reste ?",
        options: ['Elle a disparu', 'En chaleur', 'Dans le panneau solaire'], bonne: 1,
        expl: "L'énergie se conserve : ce qui n'est pas stocké est dissipé en chaleur." },
    ];
    if (atelier === 1 && releve) {
      const { u, i, t, v } = releve;
      const P = u * i, E = P * t, n = v / 1000 / H2_VM, Es = n * H2_DH;
      const ne = i * t / H2_F, nth = ne / 2, vth = nth * H2_VM * 1000;
      if (niveau === 2) return [
        { id: 'P', type: 'num', q: <>Puissance reçue par l'électrolyseur P = U × I</>, unite: 'W', vrai: P, tol: 0.04,
          aide: 'Multipliez la tension par l’intensité relevées.' },
        { id: 'E', type: 'num', q: <>Énergie électrique consommée E = P × Δt</>, unite: 'J', vrai: E, tol: 0.04,
          pieges: [[E / 60, 'Δt doit être en secondes, pas en minutes.']], aide: 'Δt en secondes.' },
        { id: 'n', type: 'num', q: <>Quantité de H<sub>2</sub> produite n = V / V<sub>m</sub> (V<sub>m</sub> = 24 L·mol⁻¹)</>, unite: 'mol', vrai: n, tol: 0.04,
          pieges: [[n * 1000, 'Le volume doit être en litres : 1 mL = 10⁻³ L.'],
            [v / 1000 / 22.4, '22,4 L·mol⁻¹ vaut à 0 °C ; à 20 °C, V_m = 24 L·mol⁻¹.']],
          aide: 'Convertissez le volume en litres. Vous pouvez écrire 3,8e-4.' },
        { id: 'Es', type: 'num', q: <>Énergie stockée E<sub>stockée</sub> = n × 285 000 J·mol⁻¹</>, unite: 'J', vrai: Es, tol: 0.05,
          pieges: [[Es / 1000, '285 kJ·mol⁻¹ = 285 000 J·mol⁻¹.']] },
        { id: 'eta', type: 'num', q: <>Rendement de l'électrolyseur η = E<sub>stockée</sub> / E<sub>consommée</sub></>, unite: '%', vrai: Es / E * 100, tol: 0.06,
          pieges: [[E / Es * 100, 'C’est l’inverse : énergie utile (stockée) sur énergie reçue.'],
            [Es / E, 'Exprimez le rendement en pourcentage (× 100).']] },
      ];
      if (niveau === 3) return [
        { id: 'ne', type: 'num', q: <>Quantité d'électrons n(e⁻) = I × Δt / F</>, unite: 'mol', vrai: ne, tol: 0.04,
          pieges: [[ne / 60, 'Δt doit être en secondes.']] },
        { id: 'nth', type: 'num', q: <>Quantité de H<sub>2</sub> attendue (2 e⁻ par molécule)</>, unite: 'mol', vrai: nth, tol: 0.04,
          pieges: [[ne, 'Il faut 2 électrons pour une molécule de H₂ : divisez par 2.'], [ne / 4, 'Divisez par 2, pas par 4 (4 e⁻ par molécule de O₂).']] },
        { id: 'vth', type: 'num', q: <>Volume de H<sub>2</sub> attendu</>, unite: 'mL', vrai: vth, tol: 0.04,
          pieges: [[vth / 1000, 'La réponse est demandée en mL.']] },
        { id: 'etaF', type: 'num', q: <>Rendement faradique = V<sub>mesuré</sub> / V<sub>attendu</sub></>, unite: '%', vrai: v / vth * 100, tol: 0.06,
          pieges: [[vth / v * 100, 'C’est le volume mesuré divisé par le volume attendu.']] },
        { id: 'xf', type: 'num', q: <>Tableau d'avancement de H<sub>2</sub>O → H<sub>2</sub> + ½ O<sub>2</sub> : avancement final x<sub>f</sub> (d'après le volume mesuré)</>,
          unite: 'mol', vrai: n, tol: 0.04,
          pieges: [[n * 1000, 'Le volume doit être en litres : 1 mL = 10⁻³ L.'], [v / 1000 / 22.4, 'À 20 °C, V_m = 24 L·mol⁻¹.']],
          aide: 'x_f = n(H₂) formé.' },
        { id: 'nO2', type: 'num', q: <>Quantité de O<sub>2</sub> formée n(O<sub>2</sub>) = ½ x<sub>f</sub></>, unite: 'mol', vrai: n / 2, tol: 0.04,
          pieges: [[n, 'Le coefficient de O₂ est ½ : n(O₂) = x_f / 2.'], [2 * n, 'Le coefficient de O₂ est ½ : on divise par 2.']] },
        { id: 'meau', type: 'num', q: <>Masse d'eau consommée m = x<sub>f</sub> × M(H<sub>2</sub>O)</>, unite: 'g', vrai: n * 18, tol: 0.04,
          pieges: [[n * 16, 'M(H₂O) = 16 + 2 × 1 = 18 g·mol⁻¹ (et non 16).'], [n * 18000, 'La réponse est demandée en grammes.']] },
        { id: 'Ppac', type: 'num', q: <>Branchez la pile sur 10 Ω et relevez U et I : puissance fournie P<sub>pile</sub></>, unite: 'W', vrai: pp.p, tol: 0.06,
          pieges: [[pp.p * 1000, 'La réponse est demandée en W (1 mW = 10⁻³ W).']] },
        { id: 'chaine', type: 'num', q: <>Rendement de la chaîne électrolyseur + pile = P<sub>pile</sub> / P<sub>électrolyseur</sub></>, unite: '%', vrai: pp.p / P * 100, tol: 0.08 },
        { id: 'Pmot', type: 'num', q: <>Branchez maintenant le moteur : puissance fournie par la pile</>, unite: 'W', vrai: pm.p, tol: 0.06,
          pieges: [[pm.p * 1000, 'La réponse est demandée en W (1 mW = 10⁻³ W).']] },
        { id: 'maq', type: 'num', q: <>Rendement de toute la maquette, de la lampe au moteur : η = η<sub>panneau</sub> × (P<sub>pile</sub> / P<sub>électrolyseur</sub>) × η<sub>moteur</sub>,
          avec η<sub>panneau</sub> = 10 % et η<sub>moteur</sub> = 90 %</>, unite: '%', vrai: 0.10 * (pm.p / P) * 0.90 * 100, tol: 0.08,
          pieges: [[(pm.p / P) * 100, 'N’oubliez pas les rendements du panneau (10 %) et du moteur (90 %).'],
            [0.10 * (pm.p / P) * 0.90, 'Exprimez le rendement en pourcentage (× 100).']] },
      ];
    }
    if (atelier === 2 && niveau === 1) return MODULES.map(m => ({
      id: m.id, type: 'module', q: m.nom, bonne: m.id }));
    if (atelier === 2 && niveau === 2) {
      const U10 = uBanc(10);
      return [
        { id: 'U', type: 'num', q: 'Réglez I = 10 A. Tension lue aux bornes de la pile', unite: 'V', vrai: U10, tol: 0.02 },
        { id: 'Uc', type: 'num', q: 'Tension aux bornes d’une cellule (la pile en compte 10)', unite: 'V', vrai: U10 / 10, tol: 0.03,
          pieges: [[U10, 'Divisez la tension de la pile par le nombre de cellules.']] },
        { id: 'J', type: 'num', q: 'Densité de courant J = I / S (S = 25 cm²)', unite: 'A·cm⁻²', vrai: 0.4, tol: 0.02,
          pieges: [[2.5, 'C’est I / S, pas S / I.']] },
        { id: 'P', type: 'num', q: 'Puissance fournie P = U × I', unite: 'W', vrai: U10 * 10, tol: 0.03 },
        { id: 'eta', type: 'num', q: 'Rendement η = U cellule / 1,48 V', unite: '%', vrai: U10 / 10 / U_TH * 100, tol: 0.04,
          pieges: [[U10 / U_TH * 100, 'Utilisez la tension d’une seule cellule.']] },
      ];
    }
    if (atelier === 2 && niveau === 3) {
      const { P, U } = cibleDefi, uc = uBanc(10) / 10, j = 0.4;
      const N = Math.ceil(U / uc), I = P / U, S = I / j, deb = N * I / (2 * H2_F) * H2_VM * 60;
      return [
        { id: 'N', type: 'num', q: `Nombre de cellules pour obtenir ${U} V (arrondir à l'entier supérieur)`, unite: 'cellules', vrai: N, tol: 0,
          pieges: [[Math.floor(U / uc), 'Arrondissez à l’entier supérieur : sinon la tension est trop faible.']] },
        { id: 'I', type: 'num', q: `Courant débité pour ${P} W sous ${U} V`, unite: 'A', vrai: I, tol: 0.02 },
        { id: 'S', type: 'num', q: 'Surface d’une cellule S = I / J (J = 0,4 A·cm⁻²)', unite: 'cm²', vrai: S, tol: 0.03,
          pieges: [[I * j, 'C’est S = I / J.']] },
        { id: 'deb', type: 'num', q: <>Consommation de H<sub>2</sub> : N × I / (2F) mol·s⁻¹, convertie en L·min⁻¹ (V<sub>m</sub> = 24 L·mol⁻¹)</>,
          unite: 'L·min⁻¹', vrai: deb, tol: 0.05,
          pieges: [[deb / 60, 'Multipliez par 60 pour passer de L·s⁻¹ à L·min⁻¹.'], [deb * 2, 'Il faut 2 électrons par molécule de H₂ : divisez par 2F.']] },
      ];
    }
    return [];
  })();

  const juste = q => {
    const r = reps[q.id];
    if (q.type === 'qcm') return r === q.bonne;
    if (q.type === 'module') return r === q.bonne;
    const x = lireNombre(r);
    return isFinite(x) && (q.tol === 0 ? Math.round(x) === q.vrai : proche(x, q.vrai, q.tol));
  };
  const piege = q => {
    const x = lireNombre(reps[q.id]);
    if (!isFinite(x)) return 'Entrez une valeur numérique.';
    const pg = (q.pieges || []).find(([v]) => proche(x, v, Math.max(q.tol, 0.03)));
    if (pg) return pg[1];
    if (proche(x, q.vrai * 1000, 0.05) || proche(x, q.vrai / 1000, 0.05)) return 'Facteur 1000 : vérifiez les unités.';
    return null;
  };
  const score = questions.filter(juste).length;

  function demarrer(n) {
    setNiveau(n); setReps({}); setVerifie(false);
    if (atelier === 2 && n === 3) {
      const P = [500, 1000, 1500, 2000, 3000][Math.floor(Math.random() * 5)];
      const U = [12, 24, 48][Math.floor(Math.random() * 3)];
      setCibleDefi({ P, U });
    }
  }
  function relever() {
    // Arrondies comme à l'affichage : l'élève calcule avec les mêmes valeurs que le corrigé
    const r = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
    setReleve({ u: r(uEl, 2), i: r(iEl, 3), t: r(etat.t, 0), v: r(etat.vH2, 1) });
    setReps({}); setVerifie(false);
  }
  const releveOk = etat.t >= 60 && iEl > 0 && etat.vH2 > 0.5 && etat.vH2 < H2_TUBE && !pacOn;

  const choixNiveau = (
    <div>
      <div style={{ fontSize: 13, color: TXT, fontWeight: 700, marginBottom: 8 }}>Choisissez un niveau</div>
      {NIVEAUX.map(nv => (
        <button key={nv.n} onClick={() => demarrer(nv.n)}
          style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: '9px 12px',
            borderRadius: 10, border: `1.5px solid ${nv.c}`, background: 'white', cursor: 'pointer' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: nv.c }}>{nv.n}. {nv.nom}</div>
          <div style={{ fontSize: 12, color: TXT2, marginTop: 2, lineHeight: 1.45 }}>{nv.desc}</div>
        </button>
      ))}
    </div>
  );

  const nivInfo = NIVEAUX.find(x => x.n === niveau);
  const besoinReleve = atelier === 1 && niveau >= 2;
  const panneauReleve = besoinReleve && (
    <div style={{ ...box, marginBottom: 8, background: 'white' }}>
      <div style={{ fontSize: 12.5, color: TXT, lineHeight: 1.55, marginBottom: 6 }}>
        <strong>Votre manip :</strong> lampe allumée, électrolyseur branché, lancez le chrono.
        Au bout de quelques minutes (au moins 1), relevez vos mesures. Elles serviront aux calculs.
      </div>
      <button onClick={relever} disabled={!releveOk} style={{ ...btn(releveOk, '#0ea5e9'), opacity: releveOk ? 1 : 0.5 }}>
        📋 Relever mes mesures
      </button>
      {!releveOk && <div style={{ fontSize: 11.5, color: TXT2, marginTop: 5 }}>
        Il faut au moins 1 min d'électrolyse, un tube qui n'est pas plein, et la pile débranchée
        (sinon elle consomme une partie du gaz). Si besoin, videz les tubes et recommencez.
      </div>}
      {releve && (
        <div style={{ fontSize: 12.5, marginTop: 8, fontFamily: 'monospace', color: TXT, lineHeight: 1.6 }}>
          U = {fmt(releve.u, 2)} V ; I = {fmt(releve.i, 3)} A<br/>
          Δt = {fmt(releve.t, 0)} s ; V(H₂) = {fmt(releve.v, 1)} mL
        </div>
      )}
    </div>
  );

  const listeQuestions = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {atelier === 2 && niveau === 3 && (
        <div style={{ fontSize: 12.5, color: TXT, lineHeight: 1.55 }}>
          On veut une pile de <strong>{cibleDefi.P} W</strong> sous <strong>{cibleDefi.U} V</strong>, avec des cellules
          qui fonctionnent comme celles du banc à 10 A (U cellule ≈ {fmt(uBanc(10) / 10, 2)} V ; J = 0,4 A·cm⁻²).
        </div>
      )}
      {questions.map((q, k) => {
        const ok = verifie && juste(q);
        return (
          <div key={q.id} style={{ borderLeft: `3px solid ${verifie ? (ok ? '#16a34a' : '#dc2626') : BORDER}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, color: TXT, fontWeight: 700, marginBottom: 5 }}>{k + 1}. {q.q}</div>
            {q.type === 'qcm' && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => { setReps(p => ({ ...p, [q.id]: i })); setVerifie(false); }}
                    style={petitBtn(reps[q.id] === i, '#0ea5e9')}>{o}</button>
                ))}
              </div>
            )}
            {q.type === 'module' && (
              <select value={reps[q.id] || ''} onChange={e => { setReps(p => ({ ...p, [q.id]: e.target.value })); setVerifie(false); }}
                style={{ ...inp, width: '100%', fontSize: 12 }}>
                <option value="">— à quoi sert-il ? —</option>
                {[...MODULES].sort((a, b) => a.role.localeCompare(b.role)).map(m => <option key={m.id} value={m.id}>{m.role}</option>)}
              </select>
            )}
            {q.type === 'num' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${k + 1}`}
                  onChange={e => { const v = e.target.value; setReps(p => ({ ...p, [q.id]: v })); setVerifie(false); }}
                  style={{ ...inp, width: 110 }}/>
                <span style={{ fontSize: 12, color: TXT2 }}>{q.unite}</span>
                {verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
            )}
            {verifie && q.type !== 'num' && <div style={{ fontSize: 12, marginTop: 3, color: ok ? '#15803d' : '#b91c1c' }}>
              {ok ? '✅ ' : '❌ '}{q.expl || (!ok && q.type === 'module' ? `Réponse : ${MODULES.find(m => m.id === q.bonne).role}` : '')}
            </div>}
            {verifie && q.type === 'num' && !ok && piege(q) && (
              <div style={{ fontSize: 12, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74',
                borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>{piege(q)}</div>
            )}
            {verifie && q.type === 'num' && !ok && reps[`vu_${q.id}`] && (
              <div style={{ fontSize: 12, color: TXT2, marginTop: 3 }}>Valeur attendue : {sci(q.vrai)} {q.unite}</div>
            )}
            {verifie && q.type === 'num' && !ok && !reps[`vu_${q.id}`] && (
              <button onClick={() => setReps(p => ({ ...p, [`vu_${q.id}`]: true }))}
                style={{ fontSize: 11, marginTop: 3, background: 'none', border: 'none', color: TXT2,
                  textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>voir la valeur attendue</button>
            )}
          </div>
        );
      })}
      {questions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <button onClick={() => setVerifie(true)} style={btn(true, '#16a34a')}>✓ Vérifier</button>
          {verifie && <strong style={{ color: score === questions.length ? '#15803d' : TXT }}>
            {score} / {questions.length}{score === questions.length ? ' 🎉' : ''}
          </strong>}
        </div>
      )}
    </div>
  );

  const voletDefi = !niveau ? choixNiveau : (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'white', background: nivInfo.c, borderRadius: 6, padding: '3px 8px' }}>
          Niveau {niveau} : {nivInfo.nom}
        </span>
        <button onClick={() => setNiveau(null)} style={petitBtn(false)}>Changer de niveau</button>
      </div>
      {panneauReleve}
      {(!besoinReleve || releve) && listeQuestions}
      {atelier === 1 && niveau === 3 && releve && (
        <div style={{ fontSize: 11.5, color: TXT2, marginTop: 8 }}>F = 96 485 C·mol⁻¹ ; V<sub>m</sub> = 24 L·mol⁻¹.</div>
      )}
    </>
  );

  const volet = mode === 'defi' ? voletDefi : atelier === 1
    ? [section('commandes', 'Commandes', commandesMaquette),
       section('mesures', 'Mesures', mesuresMaquette),
       section('bilan', "Bilan d'énergie", bilanMaquette),
       section('comprendre', 'Comprendre les réactions', comprendreMaquette)]
    : [section('commandes', 'Commandes et mesures', commandesBanc),
       section('module', 'Élément sélectionné', infoModule),
       section('dimension', 'Dimensionner une pile', dimension),
       section('v148', "D'où vient 1,48 V ?", origine148)];

  function changerAtelier(a) { setAtelier(a); setNiveau(null); setReps({}); setVerifie(false); }

  const ongletsG = atelier === 1
    ? [['volumes', 'Volumes de gaz'], ['caract', 'Pile : U = f(I)'], ['puissance', 'Puissance']]
    : [['ui', 'U = f(I)'], ['pi', 'P = f(I)'], ['eta', 'Rendement']];
  const ongletG = atelier === 1 ? ongletG1 : ongletG2;
  const setOngletG = atelier === 1 ? setOngletG1 : setOngletG2;
  const legendeG = {
    volumes: <>Les deux courbes montent en même temps : V(H<sub>2</sub>) ≈ 2 × V(O<sub>2</sub>).</>,
    caract: <>Le point de fonctionnement est l'intersection de la caractéristique de la pile et de la droite de la charge.</>,
    puissance: <>Puissance fournie par la pile selon la résistance branchée (charge actuelle en foncé).</>,
    ui: <>Points : mesures réelles du banc (annexe B). Au début, la tension chute vite (activation), puis diminue régulièrement.</>,
    pi: <>La puissance augmente avec le courant, mais moins vite que si la tension restait constante.</>,
    eta: <>Le rendement est meilleur à faible courant : on ne peut pas avoir à la fois un grand rendement et une grande puissance.</>,
  }[ongletG];

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .h2-l1 { display: grid; gap: 12px; margin-bottom: 12px;
          grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .h2-l2 { display: grid; gap: 12px; align-items: start;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        .h2-l2-defi { display: grid; gap: 12px; align-items: start;
          grid-template-columns: minmax(280px, 1fr) minmax(0, 2fr); }
        @media (max-width: 900px) {
          .h2-l1, .h2-l2-defi { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerAtelier(1)} style={btn(atelier === 1, '#16a34a')}>Atelier 1 · De l'eau à l'hydrogène</button>
          <button onClick={() => changerAtelier(2)} style={btn(atelier === 2, '#dc2626')}>Atelier 2 · Le banc de la pile</button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('explore')} style={btn(mode === 'explore', '#334155')}>🔍 Exploration</button>
          <button onClick={() => setMode('defi')} style={btn(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>

      <div className="h2-l1">
        <div style={box}>
          <div style={titreBox}>{atelier === 1 ? 'La maquette : de la lumière au moteur' : 'Le banc de la pile à combustible'}</div>
          {atelier === 1 ? schemaMaquette : schemaBanc}
          <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
            {atelier === 1
              ? <>La lumière produit du courant ; l'électrolyseur s'en sert pour casser l'eau en H<sub>2</sub> et O<sub>2</sub>,
                  stockés dans les tubes ; la pile les recombine pour rendre de l'électricité. Cliquez sur les interrupteurs.</>
              : <>Le dihydrogène sort du réservoir, traverse le détendeur et les capteurs, puis réagit dans la pile
                  avec le dioxygène de l'air. La charge électronique impose le courant.</>}
          </div>
        </div>

        <div style={box}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {ongletsG.map(([k, l]) => <button key={k} onClick={() => setOngletG(k)} style={petitBtn(ongletG === k, '#334155')}>{l}</button>)}
          </div>
          {atelier === 1 ? grapheMaquette : grapheBanc}
          <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>{legendeG}</div>
        </div>
      </div>

      {mode === 'explore' ? (
        <div className="h2-l2">{volet}</div>
      ) : (
        <div className="h2-l2-defi">
          <div>
            {atelier === 1 ? section('commandes', 'Commandes', commandesMaquette)
              : <div style={box}>{curseur('Courant demandé à la pile', iBanc, setIBanc, 0, 10, 0.1, 'A', 1)}</div>}
            {atelier === 1 && section('mesures', 'Mesures', mesuresMaquette)}
          </div>
          <div style={box}>{voletDefi}</div>
        </div>
      )}
    </div>
  );
}
