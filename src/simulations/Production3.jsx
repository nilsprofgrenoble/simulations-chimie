import { useState, useEffect, useRef } from "react";
import { cardStyle, Graphe, fmt, sci, lireNombre, proche, CarteParcours } from "../commun";

// ====================================================
// ENERGY@SCHOOL — ATELIER PRODUCTION 3
// Installation « au fil de l'eau » : canal, roue à aubes, alternateur triphasé
// Modèle calé sur l'activité : Q = 2,6 L/s, H = 5,0 cm, L = 7,5 cm ;
// 10 Ω par phase → U = 0,85 V, I = 50 mA, N = 17 tr/min.
// ====================================================

const P3_RHO = 1000;
const P3_L = 0.075;              // m, largeur du canal
const P3_RP = 0.17;              // m, rayon au milieu de la pale immergée
const P3_K = 5.42;               // V par m/s : f.é.m. d'une phase / vitesse de la pale
const P3_RI = 22.7;              // Ω, résistance interne d'une phase de l'alternateur
const P3_C1 = 3.928;             // N·s/m, raideur de la poussée de l'eau (à 2,6 L/s)
const P3_U0 = 0.731;             // vitesse à vide de la pale / vitesse de l'eau (frottements)
const P3_Q_REF = 0.0026, P3_H_REF = 0.050;
const P3_CHARGES = [0, 2, 5, 8, 10, 12, 15, 20, 30, 50, 100, Infinity];
const nomCharge = R => (R === 0 ? 'court-circuit' : R === Infinity ? 'circuit ouvert' : `${R} Ω`);

function etatRoue(Q, H, R) {
  const S = H * P3_L, va = Q / S, Phyd = 0.5 * P3_RHO * S * va ** 3;
  const u0 = P3_U0 * va, c1 = P3_C1 * Q / P3_Q_REF;
  const g = R === Infinity ? 0 : 3 * P3_K * P3_K / (P3_RI + R);
  const u = c1 * u0 / (c1 + g);                         // vitesse de la pale
  const I = R === Infinity ? 0 : P3_K * u / (P3_RI + R);
  const U = R === Infinity ? Math.sqrt(3) * P3_K * u : Math.sqrt(3) * R * I;
  const P = Math.sqrt(3) * U * I;
  return { S, va, Phyd, u, I, U, P, eta: Phyd > 0 ? P / Phyd : 0, N: u / (2 * Math.PI * P3_RP) * 60 };
}
// Maximum de puissance (recherche sur la résistance)
function optimum(Q, H) {
  let best = { P: 0 };
  for (let R = 0.5; R <= 200; R *= 1.02) { const e = etatRoue(Q, H, R); if (e.P > best.P) best = { ...e, R }; }
  return best;
}

const COUL = { eau: '#2563eb', meca: '#7c3aed', elec: '#dc2626', chaleur: '#ea580c',
  txt: '#0f172a', txt2: '#334155', bord: '#cbd5e1', fond: '#f8fafc', focus: '#f59e0b' };

export function SimulationProduction3() {
  const [mode, setMode] = useState('guide');            // 'guide' | 'explore' | 'defi'
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true, points: true });
  const [qLs, setQLs] = useState(2.6);                   // L/s
  const [hCm, setHCm] = useState(5.0);
  const [kR, setKR] = useState(4);                        // 10 Ω
  const [onglet, setOnglet] = useState('rendement');
  const [points, setPoints] = useState([]);
  // Pesée et chronométrage
  const [pesee, setPesee] = useState({ actif: false, t: 0, m: 0, fini: null });
  const [chrono, setChrono] = useState({ actif: false, t: 0, tours: 0, fini: null });
  // Parcours guidé
  const [guide, setGuide] = useState({ etape: 0, reps: {}, verifs: {} });
  const etape = guide.etape;
  const [vus, setVus] = useState({ co: false, cc: false });
  const [mission, setMission] = useState(null);

  const enGuide = mode === 'guide';
  const Q = enGuide ? P3_Q_REF : mode === 'defi' && mission ? mission.Q : qLs / 1000;
  const H = enGuide ? P3_H_REF : mode === 'defi' && mission ? mission.H : hCm / 100;
  const R = P3_CHARGES[kR];
  const e = etatRoue(Q, H, R);
  const opt = optimum(Q, H);

  useEffect(() => {
    if (R === Infinity) setVus(v => (v.co ? v : { ...v, co: true }));
    if (R === 0) setVus(v => (v.cc ? v : { ...v, cc: true }));
  }, [R]);

  // ── Pesée (balance Roberval, 15 kg) ──
  const refQ = useRef(Q); refQ.current = Q;
  useEffect(() => {
    if (!pesee.actif) return;
    let prec = performance.now(), id, fin = false;
    const pas = now => {
      const dt = Math.min(0.1, (now - prec) / 1000); prec = now;
      setPesee(p => {
        const m = p.m + refQ.current * P3_RHO * dt;
        if (m >= 15) { fin = true; const tf = p.t + dt * (15 - p.m) / (m - p.m); return { actif: false, t: tf, m: 15, fini: tf }; }
        return { ...p, t: p.t + dt, m };
      });
      if (!fin) id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [pesee.actif]);
  // ── Chronométrage de 5 tours (accéléré × 5 pour ne pas attendre) ──
  const refN = useRef(e.N); refN.current = e.N;
  useEffect(() => {
    if (!chrono.actif) return;
    let prec = performance.now(), id, fin = false;
    const pas = now => {
      const dt = Math.min(0.1, (now - prec) / 1000) * 5; prec = now;
      setChrono(c => {
        const tours = c.tours + refN.current / 60 * dt;
        if (tours >= 5) { fin = true; const tf = c.t + dt * (5 - c.tours) / (tours - c.tours); return { actif: false, t: tf, tours: 5, fini: tf }; }
        return { ...c, t: c.t + dt, tours };
      });
      if (!fin) id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [chrono.actif]);

  // ── Styles ──
  const { txt: TXT, txt2: TXT2, bord: BORDER, fond: BG } = COUL;
  const box = { background: BG, borderRadius: 10, padding: '10px 12px', border: `1px solid ${BORDER}` };
  const titreBox = { fontWeight: 700, fontSize: 15, color: TXT, marginBottom: 6 };
  const btn = (actif, c = '#0284c7') => ({ padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 14, border: `1.5px solid ${actif ? c : BORDER}`,
    background: actif ? c : 'white', color: actif ? 'white' : TXT2 });
  const petitBtn = (actif, c) => ({ ...btn(actif, c), padding: '5px 10px', fontSize: 13 });
  const inp = { fontSize: 14, padding: '4px 8px', border: `1.5px solid ${BORDER}`, borderRadius: 6, background: 'white', color: TXT };
  const ligne = (k, v, c, cle) => (
    <div key={cle} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0',
      borderBottom: `1px dashed ${BORDER}`, fontSize: 14 }}>
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

  // ════════════════ PARCOURS GUIDÉ : LES ÉTAPES ════════════════
  const tPes = pesee.fini ? Math.round(pesee.fini * 10) / 10 : null;
  const Qmes = tPes ? 15 / P3_RHO / tPes : null;
  const vaMes = Qmes ? Qmes / (P3_H_REF * P3_L) : null;
  const PhMes = vaMes ? 0.5 * P3_RHO * P3_H_REF * P3_L * vaMes ** 3 : null;
  const e10 = etatRoue(P3_Q_REF, P3_H_REF, 10);
  const U10 = Math.round(e10.U * 100) / 100, I10 = Math.round(e10.I * 1000) / 1000;
  const P10 = Math.sqrt(3) * U10 * I10;
  const t5 = chrono.fini ? Math.round(chrono.fini * 100) / 100 : null;
  const Nmes = t5 ? 5 / t5 * 60 : null;
  const vPale = Nmes ? P3_RP * 2 * Math.PI * Nmes / 60 : null;

  const ETAPES = [
    { titre: 'Une centrale « au fil de l’eau »', focus: ['canal', 'roue'],
      texte: <>Une centrale au fil de l'eau n'a pas de barrage : elle utilise directement le courant d'une rivière.
        La maquette en reproduit le principe : l'eau s'écoule dans un <strong>canal</strong> et pousse les pales d'une
        <strong> roue à aubes</strong>, qui entraîne un <strong>alternateur</strong>. Votre objectif : mesurer la puissance
        électrique produite, le rendement, et trouver le réglage qui donne le maximum de puissance.</>,
      tache: null },
    { titre: 'Quelle énergie utilise-t-on ?', focus: ['canal'],
      texte: <>Ici, l'eau ne fait presque pas de chute : elle avance horizontalement dans le canal.</>,
      tache: { type: 'qcm', q: 'L’énergie que la roue récupère est surtout…',
        options: ['l’énergie cinétique de l’eau (sa vitesse)', 'l’énergie potentielle de l’eau (sa hauteur de chute)', 'l’énergie électrique du canal'], bonne: 0,
        expl: 'En première approximation, c’est surtout l’énergie cinétique de l’eau qui fait tourner la roue. Il y a aussi une petite part d’énergie potentielle (la légère différence de niveau de part et d’autre de la roue), que l’on néglige ici.' } },
    { titre: 'Mesurer le débit avec la balance', focus: ['balance'],
      texte: <>En sortie de canal, l'eau tombe dans le seau d'une balance de Roberval. Le contre-poids vaut
        <strong> 15 kg</strong> : la balance bascule quand le seau contient 15 kg d'eau. Lancez la pesée et notez la durée.</>,
      tache: { type: 'action', label: '⚖️ Lancer la pesée', faire: () => setPesee({ actif: true, t: 0, m: 0, fini: null }),
        ok: !!pesee.fini, attente: pesee.actif ? 'Remplissage du seau…' : null } },
    { titre: 'Calculer le débit', focus: ['balance'],
      texte: <>La balance a basculé au bout de <strong>{tPes ? fmt(tPes, 1) : '?'} s</strong>. 15 kg d'eau occupent un volume
        V = m / ρ, avec ρ = 1,0 × 10³ kg·m⁻³. Le débit est Q<sub>V</sub> = V / Δt.</>,
      tache: { type: 'num', id: 'Q', q: <>Débit volumique Q<sub>V</sub></>, unite: 'm³·s⁻¹', vrai: Qmes, tol: 0.03,
        pieges: Qmes ? [[15 / tPes, 'Il faut d’abord passer de la masse au volume : V = m / ρ.'], [Qmes * 1000, 'Le volume doit être en m³ : 15 kg d’eau = 0,015 m³.']] : [],
        aide: 'Notation scientifique acceptée : pour 4,5 × 10⁻⁶, tapez 4,5e-6.' } },
    { titre: 'La vitesse de l’eau', focus: ['H', 'L'],
      texte: <>L'eau occupe dans le canal une section rectangulaire : hauteur d'eau H = <strong>5,0 cm</strong>, largeur
        L = <strong>7,5 cm</strong>. On utilise Q<sub>V</sub> = v × S, avec S = H × L.</>,
      tache: { type: 'num', id: 'va', q: <>Vitesse de l'eau v<sub>a</sub> = Q<sub>V</sub> / (H × L)</>, unite: 'm·s⁻¹', vrai: vaMes, tol: 0.04,
        pieges: vaMes ? [[vaMes / 1e4, 'H et L doivent être en mètres : 5,0 cm = 0,050 m.'], [vaMes * 1e4, 'H et L doivent être en mètres.']] : [] } },
    { titre: 'La puissance disponible', focus: ['canal'],
      texte: <>On admet que la puissance apportée par l'eau qui s'écoule vaut P<sub>hyd</sub> = ½ × ρ × S × v<sub>a</sub>³
        (c'est l'énergie cinétique transportée chaque seconde ; elle pourra être démontrée pendant la journée).</>,
      tache: { type: 'num', id: 'Ph', q: <>Puissance hydraulique P<sub>hyd</sub></>, unite: 'W', vrai: PhMes, tol: 0.05,
        pieges: PhMes ? [[PhMes * 2, 'N’oubliez pas le ½.'], [PhMes / vaMes, 'La vitesse est au cube : v³ = v × v × v.']] : [],
        aide: 'S = H × L en m².' } },
    { titre: 'Brancher l’alternateur', focus: ['charge'],
      texte: <>L'alternateur débite sur une <strong>résistance variable</strong> (une par phase). Le curseur « Charge » est
        apparu sous le schéma : amenez-le tout à droite (circuit ouvert), puis tout à gauche (court-circuit), et
        observez U et I.</>,
      tache: { type: 'action', ok: vus.co && vus.cc, consigne: `${vus.co ? '✅' : '⬜'} circuit ouvert   ${vus.cc ? '✅' : '⬜'} court-circuit` } },
    { titre: 'Circuit ouvert', focus: ['charge'],
      texte: <>En circuit ouvert, la puissance électrique est nulle.</>,
      tache: { type: 'qcm', q: 'Pourquoi ?', options: ['l’intensité I = 0 A', 'la tension U = 0 V'], bonne: 0,
        expl: 'Le circuit est coupé : aucun courant ne circule, même si l’alternateur produit une tension.' } },
    { titre: 'Court-circuit', focus: ['charge'],
      texte: <>En court-circuit, la puissance électrique est aussi nulle.</>,
      tache: { type: 'qcm', q: 'Pourquoi ?', options: ['l’intensité I = 0 A', 'la tension U = 0 V'], bonne: 1,
        expl: 'Les bornes sont reliées par un fil : la tension entre elles est nulle. Entre les deux extrêmes, la puissance passe donc par un maximum.' } },
    { titre: 'La puissance électrique', focus: ['charge'],
      texte: <>Réglez la charge sur <strong>10 Ω</strong>. L'alternateur est <strong>triphasé</strong> : on admet que
        P<sub>élec</sub> = √3 × U × I, avec U la tension entre deux phases et I l'intensité dans une phase.</>,
      tache: { type: 'num', id: 'Pe', q: <>Puissance électrique P<sub>élec</sub> (charge de 10 Ω)</>, unite: 'W', vrai: P10, tol: 0.04,
        bloque: R !== 10 ? 'Réglez d’abord la charge sur 10 Ω.' : null,
        pieges: [[U10 * I10, 'N’oubliez pas le facteur √3 de l’alternateur triphasé.'], [P10 * 1000, 'I doit être en ampères : 50 mA = 0,050 A.']] } },
    { titre: 'Le rendement', focus: ['canal', 'charge'],
      texte: <>Le rendement compare la puissance utile à la puissance absorbée : r = P<sub>utile</sub> / P<sub>absorbée</sub>.
        Ici, la puissance utile est l'électricité produite ; la puissance absorbée est celle apportée par l'eau.</>,
      tache: { type: 'num', id: 'eta', q: <>Rendement r = P<sub>élec</sub> / P<sub>hyd</sub></>, unite: '%', vrai: PhMes ? P10 / PhMes * 100 : null, tol: 0.06,
        pieges: PhMes ? [[PhMes / P10 * 100, 'C’est l’inverse : puissance utile (électrique) sur puissance absorbée (eau).'], [P10 / PhMes, 'Exprimez le rendement en pourcentage (× 100).']] : [] } },
    { titre: 'La vitesse de la roue', focus: ['roue'],
      texte: <>Toujours sur 10 Ω, chronométrez la durée de <strong>5 tours</strong> de roue (le chronomètre est accéléré
        × 5 pour ne pas attendre, la durée affichée est la vraie).</>,
      tache: { type: 'action', label: '⏱️ Chronométrer 5 tours', faire: () => setChrono({ actif: true, t: 0, tours: 0, fini: null }),
        ok: !!chrono.fini, bloque: R !== 10 ? 'Réglez d’abord la charge sur 10 Ω.' : null,
        attente: chrono.actif ? `Tours comptés : ${Math.floor(chrono.tours)} / 5` : null } },
    { titre: 'Vitesse de rotation', focus: ['roue'],
      texte: <>La roue a fait 5 tours en <strong>{t5 ? fmt(t5, 2) : '?'} s</strong>.</>,
      tache: { type: 'num', id: 'N', q: 'Vitesse de rotation N', unite: 'tr·min⁻¹', vrai: Nmes, tol: 0.03,
        pieges: Nmes ? [[Nmes / 60, 'La réponse est demandée en tours par minute : multipliez par 60.'], [t5 / 5 * 60, 'C’est le nombre de tours divisé par la durée.']] : [] } },
    { titre: 'Vitesse de la pale', focus: ['r'],
      texte: <>Le milieu de la pale immergée est à r = <strong>17 cm</strong> de l'axe. On rappelle v = r × ω,
        avec ω en rad·s⁻¹ (1 tr·s⁻¹ = 2π rad·s⁻¹).</>,
      tache: { type: 'num', id: 'vp', q: 'Vitesse du milieu de la pale', unite: 'm·s⁻¹', vrai: vPale, tol: 0.04,
        pieges: vPale ? [[vPale * 60, 'N est en tr/min : divisez par 60 pour avoir des tr/s.'], [vPale / (2 * Math.PI), 'N’oubliez pas 2π.'], [vPale * 100, 'r doit être en mètres.']] : [] } },
    { titre: 'Chercher le maximum', focus: ['charge'],
      texte: <>Le graphique est apparu. Faites varier la charge, du court-circuit au circuit ouvert, et ajoutez un point à
        chaque réglage (menu « Mes points ») : la courbe de rendement se dessine.</>,
      tache: { type: 'action', ok: points.length >= 6, consigne: `Points ajoutés : ${points.length} / 6` } },
    { titre: 'Le point optimal', focus: ['roue', 'canal'],
      texte: <>Repérez sur votre courbe la vitesse de la pale au rendement maximal, et comparez-la à la vitesse de l'eau
        v<sub>a</sub> calculée plus tôt.</>,
      tache: { type: 'num', id: 'rap', q: <>Rapport v<sub>pale</sub> / v<sub>a</sub> au rendement maximal (1 chiffre significatif)</>, unite: '',
        vrai: opt.u / opt.va, tol: 0.25,
        expl: 'La pale va environ deux fois moins vite que l’eau. Trop lente, elle freine l’eau sans avancer ; trop rapide, l’eau ne la pousse plus.' } },
    { titre: 'Bravo !', focus: [],
      texte: <>Vous avez fait tout le chemin de la centrale : débit, puissance de l'eau, puissance électrique, rendement,
        vitesse de la roue et point de fonctionnement optimal. Vous pouvez maintenant explorer librement la maquette
        (changer le débit, la hauteur d'eau…) ou relever le défi.</>,
      tache: null },
  ];
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  // Ce qui est visible selon l'avancement du parcours
  const vu = k => !enGuide || etape >= k;
  const revele = { balance: vu(2), charge: vu(6), chrono: vu(11), graphe: vu(14) };
  const focus = enGuide ? et.focus : [];
  const hl = id => focus.includes(id);
  const montre = { HL: vu(4), r: vu(13) };

  // ════════════════ SCHÉMA ════════════════
  const cx = 290, cy = 120, rRoue = 100;
  // Surface de l'eau : plane en amont, elle épouse le cercle de la roue puis ressort au bas du cercle
  const rCercle = rRoue - 30;
  const surfaceEau = (() => {
    const yBas = cy + rCercle;
    const yE = 230 - Math.min(60, H * 100 * 10);
    if (yE >= yBas) return `M 20 ${yE} L 520 ${yE}`;
    const dx = Math.sqrt(rCercle ** 2 - (yE - cy) ** 2);
    return `M 20 ${yE} L ${cx - dx} ${yE} A ${rCercle} ${rCercle} 0 0 0 ${cx} ${yBas} L 520 ${yBas}`;
  })();
  const yEau = 230 - Math.min(60, H * 100 * 10);               // surface de l'eau (5 cm → 50 px)
  const tourVisuel = e.N > 0.5 ? 60 / e.N : 0;                  // vraie vitesse : la roue tourne lentement
  const mSeau = pesee.m;
  const bascule = pesee.fini ? -6 : -6 + 12 * Math.min(1, mSeau / 15) * 0;
  const cadre = (id, x, y, w, h) => hl(id) && (
    <rect x={x} y={y} width={w} height={h} rx="10" fill="none" stroke={COUL.focus} strokeWidth="4" strokeDasharray="8 4">
      <animate attributeName="stroke-opacity" values="1;0.35;1" dur="1.4s" repeatCount="indefinite"/>
    </rect>
  );
  const afficheur = (x, y, texte, c, w = 112) => (
    <g>
      <rect x={x} y={y} width={w} height="26" rx="4" fill="#0f172a"/>
      <text x={x + w / 2} y={y + 19} fontSize="16" fill={c} textAnchor="middle" fontFamily="monospace" fontWeight="700">{texte}</text>
    </g>
  );
  const schema = (
    <svg viewBox="0 0 640 330" role="img" aria-label="Canal, roue à aubes, alternateur et balance"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${BORDER}` }}>
      {/* Canal */}
      <path d={surfaceEau + ` L 520 230 L 20 230 Z`} fill="#bfdbfe"/>
      <path d={surfaceEau} fill="none" stroke="#1d4ed8" strokeWidth="2"/>
      <line x1="20" y1="230" x2="520" y2="230" stroke={TXT} strokeWidth="4"/>
      {[0, 1, 2, 3].map(k => (
        <g key={k}>
          <line x1={40 + k * 120} y1={(yEau + 230) / 2} x2={80 + k * 120} y2={(yEau + 230) / 2} stroke="#1d4ed8" strokeWidth="3"/>
          <polygon points={`${80 + k * 120},${(yEau + 230) / 2 - 5} ${90 + k * 120},${(yEau + 230) / 2} ${80 + k * 120},${(yEau + 230) / 2 + 5}`} fill="#1d4ed8">
            <animateTransform attributeName="transform" type="translate" from="0 0" to="30 0" dur={`${Math.max(0.6, 1.4 / e.va)}s`} repeatCount="indefinite"/>
          </polygon>
        </g>
      ))}
      <text x="70" y="262" fontSize="15" fontWeight="700" fill={TXT}>canal</text>
      <text x="130" y="262" fontSize="13" fill={TXT2}>v<tspan dy="3" fontSize="10">a</tspan><tspan dy="-3"> : vitesse de l'eau</tspan></text>
      {/* Hauteur d'eau et largeur */}
      {montre.HL && <g>
        <line x1="40" y1={yEau} x2="40" y2="230" stroke={TXT} strokeWidth="1.5"/>
        <text x="46" y={(yEau + 230) / 2 - 12} fontSize="14" fontWeight="700" fill={TXT}>H = {fmt(H * 100, 1)} cm</text>
        <text x="380" y="262" fontSize="14" fontWeight="700" fill={TXT}>largeur L = 7,5 cm</text>
      </g>}
      {cadre('H', 28, yEau - 22, 120, 230 - yEau + 26)}
      {cadre('L', 372, 246, 140, 24)}
      {cadre('canal', 14, yEau - 8, 512, 230 - yEau + 40)}
      {/* Roue à aubes */}
      <g transform={`translate(${cx} ${cy})`}>
        <g>
          <circle r={rRoue - 30} fill="none" stroke="#64748b" strokeWidth="3"/>
          {Array.from({ length: 8 }, (_, k) => (
            <g key={k} transform={`rotate(${k * 45})`}>
              <line x1="0" y1="0" x2="0" y2={rRoue - 30} stroke="#64748b" strokeWidth="2"/>
              <rect x="-4" y={rRoue - 34} width="8" height="40" fill="#94a3b8" stroke={TXT} strokeWidth="1.5"/>
            </g>
          ))}
          {tourVisuel > 0 && <animateTransform attributeName="transform" type="rotate" from="0" to="-360" dur={`${tourVisuel}s`} repeatCount="indefinite"/>}
        </g>
        <circle r="8" fill={TXT}/>
      </g>
      <text x={cx - 118} y="40" fontSize="15" fontWeight="700" fill={TXT}>roue à aubes</text>
      {/* Rayon jusqu'au milieu de la pale immergée */}
      {montre.r && <g>
        <line x1={cx} y1={cy} x2={cx} y2={cy + rRoue - 14} stroke={COUL.meca} strokeWidth="2.5" strokeDasharray="5 3"/>
        <rect x={cx + 6} y={cy + 30} width="78" height="20" rx="4" fill="white" opacity="0.85"/>
        <text x={cx + 10} y={cy + 45} fontSize="14" fontWeight="700" fill={COUL.meca}>r = 17 cm</text>
      </g>}
      {cadre('r', cx - 6, cy + 24, 100, 32)}
      {cadre('roue', cx - rRoue - 8, cy - rRoue - 8, 2 * rRoue + 16, 2 * rRoue + 16)}
      {/* Arbre et alternateur */}
      <line x1={cx} y1={cy} x2="420" y2={cy} stroke={TXT} strokeWidth="5"/>
      <rect x="420" y={cy - 32} width="84" height="64" rx="10" fill="#e0e7ff" stroke={TXT} strokeWidth="2"/>
      <text x="462" y={cy - 4} fontSize="14" fontWeight="700" fill={TXT} textAnchor="middle">alternateur</text>
      <text x="462" y={cy + 14} fontSize="12.5" fill={TXT2} textAnchor="middle">triphasé</text>
      {/* Charge et mesures */}
      {revele.charge && (
        <g>
          {[0, 1, 2].map(k => <line key={k} x1="504" y1={cy - 16 + k * 16} x2="540" y2={cy - 16 + k * 16} stroke={COUL.elec} strokeWidth="2"/>)}
          <rect x="540" y={cy - 30} width="90" height="60" rx="6" fill="white" stroke={TXT} strokeWidth="2"/>
          <text x="585" y={cy - 8} fontSize="13" fill={TXT2} textAnchor="middle">charge</text>
          <text x="585" y={cy + 13} fontSize={R === 0 || R === Infinity ? 12 : 15} fontWeight="700" fill={TXT} textAnchor="middle">{nomCharge(R)}</text>
          {afficheur(520, 18, `U = ${fmt(e.U, 2)} V`, '#93c5fd', 116)}
          {afficheur(520, 48, `I = ${fmt(e.I * 1000, 0)} mA`, '#fca5a5', 116)}
          {cadre('charge', 512, 10, 124, cy + 36)}
        </g>
      )}
      {/* Balance de Roberval */}
      {revele.balance && (
        <g>
          {[0, 1, 2].map(k => (
            <circle key={k} cx={525 + k * 3} cy="250" r="3" fill="#2563eb">
              <animate attributeName="cy" from="232" to="282" dur={`${0.5 + k * 0.15}s`} repeatCount="indefinite"/>
            </circle>
          ))}
          <polygon points="565,320 585,290 605,320" fill="#cbd5e1" stroke={TXT} strokeWidth="1.5"/>
          <g transform={`rotate(${pesee.fini ? -7 : 7} 585 290)`}>
            <line x1="530" y1="290" x2="636" y2="290" stroke={TXT} strokeWidth="3"/>
            <path d="M 512 258 L 516 290 L 554 290 L 558 258" fill="white" stroke={TXT} strokeWidth="2"/>
            <rect x="514" y={290 - 30 * Math.min(1, mSeau / 15)} width="42" height={30 * Math.min(1, mSeau / 15)} fill="#60a5fa" opacity="0.7"/>
            <rect x="606" y="268" width="28" height="22" rx="3" fill="#475569"/>
            <text x="620" y="283" fontSize="11" fill="white" textAnchor="middle" fontWeight="700">15 kg</text>
          </g>
          <text x="560" y="250" fontSize="14" fontWeight="700" fill={TXT} textAnchor="end">
            {pesee.fini ? `${fmt(pesee.fini, 1)} s` : pesee.actif ? `${fmt(pesee.t, 1)} s` : ''}
          </text>
          {cadre('balance', 504, 238, 134, 88)}
        </g>
      )}
      {revele.chrono && (chrono.actif || chrono.fini) && (
        <g>{afficheur(14, 292, chrono.fini ? `5 tours : ${fmt(chrono.fini, 2)} s` : `${Math.floor(chrono.tours)} tour(s)`, '#c4b5fd', 180)}</g>
      )}
    </svg>
  );

  // ════════════════ GRAPHIQUE ════════════════
  const ptsTries = [...points].sort((a, b) => a.u - b.u);
  const graphe = onglet === 'puissance' ? (
    <Graphe xMax={0.6} yMax={Math.max(0.15, Math.ceil(opt.P * 1.3 * 100) / 100)} xLabel="Vitesse de la pale (m·s⁻¹)" yLabel="P élec (W)"
      courbes={ptsTries.length > 1 ? [{ pts: ptsTries.map(q => [q.u, q.P]), color: '#dc2626', label: 'mes mesures' }] : []}
      points={[...ptsTries.map(q => ({ x: q.u, y: q.P, color: '#dc2626', fill: 'white', r: 4.5 })), { x: e.u, y: e.P, color: TXT, fill: '#fde047', r: 6.5 }]}/>
  ) : (
    <Graphe xMax={0.6} yMax={30} xLabel="Vitesse de la pale (m·s⁻¹)" yLabel="Rendement (%)"
      courbes={ptsTries.length > 1 ? [{ pts: ptsTries.map(q => [q.u, q.eta]), color: '#0284c7', label: 'mes mesures' }] : []}
      points={[...ptsTries.map(q => ({ x: q.u, y: q.eta, color: '#0284c7', fill: 'white', r: 4.5 })), { x: e.u, y: e.eta * 100, color: TXT, fill: '#fde047', r: 6.5 }]}/>
  );
  const blocGraphe = (
    <div style={box}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['rendement', 'Rendement'], ['puissance', 'Puissance']].map(([k, l]) =>
          <button key={k} onClick={() => setOnglet(k)} style={petitBtn(onglet === k, '#334155')}>{l}</button>)}
      </div>
      {graphe}
      <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
        Point jaune : réglage actuel. Ajoutez des points (menu « Mes points ») pour tracer votre courbe.
      </div>
    </div>
  );

  // ════════════════ VOLETS ════════════════
  const commandes = (
    <>
      {mode === 'explore' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: TXT2, fontWeight: 700 }}>
              <span>Débit de la pompe</span><span style={{ color: TXT }}>{fmt(Q * 1000, 1)} L/s</span>
            </div>
            <input type="range" min={1.5} max={3.5} step={0.1} value={qLs} disabled={mode === 'defi'} onChange={x => setQLs(+x.target.value)}
              style={{ width: '100%', accentColor: '#0284c7' }}/>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: TXT2, fontWeight: 700 }}>
              <span>Hauteur d'eau H (calle)</span><span style={{ color: TXT }}>{fmt(H * 100, 1)} cm</span>
            </div>
            <input type="range" min={3} max={7} step={0.5} value={hCm} disabled={mode === 'defi'} onChange={x => setHCm(+x.target.value)}
              style={{ width: '100%', accentColor: '#0284c7' }}/>
          </div>
        </>
      )}
      {revele.charge && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: TXT2, fontWeight: 700 }}>
            <span>Charge (résistance par phase)</span><span style={{ color: TXT }}>{nomCharge(R)}</span>
          </div>
          <input type="range" min={0} max={P3_CHARGES.length - 1} step={1} value={kR} onChange={x => setKR(+x.target.value)}
            style={{ width: '100%', accentColor: COUL.elec }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: TXT2 }}><span>court-circuit</span><span>circuit ouvert</span></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {revele.balance && <button onClick={() => setPesee({ actif: true, t: 0, m: 0, fini: null })} disabled={pesee.actif} style={petitBtn(true, '#2563eb')}>⚖️ Pesée</button>}
        {revele.chrono && <button onClick={() => setChrono({ actif: true, t: 0, tours: 0, fini: null })} disabled={chrono.actif} style={petitBtn(true, '#7c3aed')}>⏱️ 5 tours</button>}
      </div>
      {enGuide && !revele.balance && <div style={{ fontSize: 13, color: TXT2 }}>Les commandes apparaîtront au fil du parcours.</div>}
    </>
  );
  const mesures = (
    <>
      {revele.balance && ligne('Pesée de 15 kg', pesee.fini ? `${fmt(pesee.fini, 1)} s` : '—', COUL.eau, 'pes')}
      {!enGuide && mode !== 'defi' && ligne(<>Débit Q<sub>V</sub></>, `${sci(Q)} m³·s⁻¹`, COUL.eau, 'q')}
      {mode === 'defi' && ligne('Débitmètre', `${fmt(Q * 1000, 2)} L/s`, COUL.eau, 'qd')}
      {mode === 'defi' && ligne('Hauteur d’eau H', `${fmt(H * 100, 1)} cm`, COUL.eau, 'hd')}
      {revele.charge && ligne('Tension U (entre phases)', `${fmt(e.U, 2)} V`, COUL.elec, 'u')}
      {revele.charge && ligne('Intensité I (une phase)', `${fmt(e.I * 1000, 0)} mA`, COUL.elec, 'i')}
      {revele.chrono && ligne('Durée de 5 tours', chrono.fini ? `${fmt(chrono.fini, 2)} s` : '—', COUL.meca, 't5')}
      {mode === 'explore' && <>
        {ligne(<>Vitesse de l'eau v<sub>a</sub></>, `${fmt(e.va, 2)} m·s⁻¹`, COUL.eau, 'va')}
        {ligne(<>P<sub>hyd</sub> = ½ρSv<sub>a</sub>³</>, `${fmt(e.Phyd, 3)} W`, COUL.eau, 'ph')}
        {ligne(<>P<sub>élec</sub> = √3 U I</>, `${fmt(e.P, 3)} W`, COUL.elec, 'pe')}
        {ligne('Rendement', `${fmt(e.eta * 100, 1)} %`, COUL.chaleur, 'eta')}
        {ligne('Vitesse de rotation N', `${fmt(e.N, 1)} tr/min`, COUL.meca, 'n')}
        {ligne(<>Vitesse de la pale ; v<sub>pale</sub>/v<sub>a</sub></>, `${fmt(e.u, 2)} m·s⁻¹ ; ${fmt(e.u / e.va, 2)}`, COUL.meca, 'vp')}
      </>}
    </>
  );
  const mesPoints = (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => setPoints(l => [...l.filter(q => Math.abs(q.u - e.u) > 0.003), { u: e.u, P: e.P, eta: e.eta * 100, R }])}
          style={petitBtn(true, '#0284c7')}>➕ Ajouter ce point</button>
        <button onClick={() => setPoints([])} style={petitBtn(false)}>Effacer</button>
      </div>
      {points.length === 0 ? <div style={{ fontSize: 12.5, color: TXT2 }}>Aucun point pour l'instant.</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>{['charge', 'v pale', 'P (W)', 'η (%)'].map(h => (
            <th key={h} style={{ textAlign: 'right', padding: '3px 5px', borderBottom: `1.5px solid ${BORDER}`, color: TXT2 }}>{h}</th>))}</tr></thead>
          <tbody>{ptsTries.map((q, i) => (
            <tr key={i}>{[nomCharge(q.R), fmt(q.u, 3), fmt(q.P, 3), fmt(q.eta, 1)].map((c, j) => (
              <td key={j} style={{ textAlign: 'right', padding: '3px 5px', fontFamily: 'monospace', fontSize: 12.5 }}>{c}</td>))}</tr>
          ))}</tbody>
        </table>
      )}
    </>
  );
  const comprendre = (
    <div style={{ fontSize: 13.5, color: TXT, lineHeight: 1.6 }}>
      <div>Débit : Q<sub>V</sub> = v<sub>a</sub> × S, avec S = H × L.</div>
      <div>Puissance apportée par l'eau : P<sub>hyd</sub> = ½ ρ S v<sub>a</sub>³ (énergie cinétique transportée par seconde).</div>
      <div>Puissance électrique (triphasé) : P<sub>élec</sub> = √3 × U × I.</div>
      <div>Vitesse de la pale : v = r × ω = r × 2π N / 60.</div>
      <div style={{ marginTop: 6, color: TXT2 }}>
        Pourquoi un maximum vers v<sub>pale</sub> ≈ v<sub>a</sub> / 2 ? L'eau pousse la pale avec une force proportionnelle à
        la différence de vitesse (v<sub>a</sub> − v<sub>pale</sub>), et la puissance vaut force × v<sub>pale</sub>.
        Le produit (v<sub>a</sub> − v<sub>pale</sub>) × v<sub>pale</sub> est maximal pour v<sub>pale</sub> = v<sub>a</sub> / 2.
      </div>
    </div>
  );

  // ════════════════ CARTE DU PARCOURS (composant commun) ════════════════
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => setMode('explore')} style={btn(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => { setMode('defi'); nouvelleMission(); }} style={btn(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  const carteEtape = <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>;

  // ════════════════ DÉFI : UNE MISSION D'INGÉNIEUR ════════════════
  function nouvelleMission() {
    const Qm = Math.round((1.8 + Math.random() * 1.6) * 100) / 100000;    // m³/s, au centième de L/s
    const Hm = [0.040, 0.045, 0.050, 0.055, 0.060][Math.floor(Math.random() * 5)];
    setMission({ Q: Qm, H: Hm, reps: {}, verifie: false });
    setPoints([]);
    setPesee({ actif: false, t: 0, m: 0, fini: null });
    setChrono({ actif: false, t: 0, tours: 0, fini: null });
  }
  const optM = mission ? optimum(mission.Q, mission.H) : null;
  const eM = mission ? etatRoue(mission.Q, mission.H, 10) : null;
  const questionsMission = !mission ? [] : [
    { id: 'va', q: <>Vitesse de l'eau v<sub>a</sub></>, unite: 'm·s⁻¹', vrai: eM.va, tol: 0.04 },
    { id: 'ph', q: <>Puissance disponible P<sub>hyd</sub></>, unite: 'W', vrai: eM.Phyd, tol: 0.05 },
    { id: 'pmax', q: <>Trouvez la charge qui donne le plus de puissance : P<sub>élec</sub> maximale</>, unite: 'W', vrai: optM.P, tol: 0.06 },
    { id: 'eta', q: 'Rendement maximal de l’installation', unite: '%', vrai: optM.eta * 100, tol: 0.08 },
    { id: 'n', q: 'Vitesse de rotation de la roue à ce maximum', unite: 'tr·min⁻¹', vrai: optM.N, tol: 0.08 },
  ];
  const justeM = q => { const x = lireNombre(mission.reps[q.id]); return isFinite(x) && proche(x, q.vrai, q.tol); };
  const scoreM = mission ? questionsMission.filter(justeM).length : 0;
  const voletDefi = !mission ? null : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 15, color: TXT, lineHeight: 1.6 }}>
        <strong>Mission :</strong> la rivière a changé ! Le débitmètre indique <strong>{fmt(mission.Q * 1000, 2)} L/s</strong> et la hauteur
        d'eau vaut <strong>{fmt(mission.H * 100, 1)} cm</strong>. Calculez la puissance disponible, puis trouvez le meilleur
        réglage de la charge (tracez votre courbe !).
      </div>
      {questionsMission.map((q, k) => {
        const ok = mission.verifie && justeM(q);
        return (
          <div key={q.id} style={{ borderLeft: `3px solid ${mission.verifie ? (ok ? '#16a34a' : '#dc2626') : BORDER}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, color: TXT, fontWeight: 700, marginBottom: 5 }}>{k + 1}. {q.q}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input value={mission.reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${k + 1}`}
                onChange={x => { const v = x.target.value; setMission(m => ({ ...m, verifie: false, reps: { ...m.reps, [q.id]: v } })); }} style={{ ...inp, width: 120 }}/>
              <span style={{ fontSize: 13, color: TXT2 }}>{q.unite}</span>
              {mission.verifie && <span>{ok ? '✅' : '❌'}</span>}
            </div>
            {mission.verifie && !ok && <div style={{ fontSize: 12.5, color: TXT2, marginTop: 3 }}>Valeur attendue : {sci(q.vrai)} {q.unite}</div>}
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setMission(m => ({ ...m, verifie: true }))} style={btn(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={nouvelleMission} style={btn(false)}>🔄 Nouvelle mission</button>
        {mission.verifie && <strong style={{ color: scoreM === questionsMission.length ? '#15803d' : TXT }}>{scoreM} / {questionsMission.length}{scoreM === questionsMission.length ? ' 🎉' : ''}</strong>}
      </div>
    </div>
  );

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !mission) nouvelleMission();
  }
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .p3-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .p3-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .p3-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: TXT }}>Production 3 · Une centrale « au fil de l'eau »</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={btn(mode === 'guide', COUL.focus)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={btn(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={btn(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>

      <div className="p3-l1">
        <div style={box}>
          <div style={titreBox}>La maquette : canal, roue à aubes et alternateur</div>
          {schema}
          <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
            {enGuide ? <>L'élément encadré en orange est celui dont parle l'étape en cours.</>
              : <>L'eau du canal pousse les pales ; la roue entraîne l'alternateur, qui alimente la charge.</>}
          </div>
        </div>
        {enGuide ? carteEtape : mode === 'defi' ? <div style={box}>{voletDefi}</div> : blocGraphe}
      </div>

      <div className="p3-l2">
        {revele.graphe && mode !== 'explore' && <div>{blocGraphe}</div>}
        <div>
          {section('commandes', 'Commandes', commandes)}
          {(revele.balance || !enGuide) && section('mesures', 'Mesures', mesures)}
        </div>
        {revele.graphe && section('points', 'Mes points', mesPoints)}
        {mode === 'explore' && section('comprendre', 'Comprendre', comprendre)}
      </div>
    </div>
  );
}
