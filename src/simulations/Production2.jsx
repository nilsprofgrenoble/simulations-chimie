import { useState } from "react";
import { cardStyle, Graphe, fmt, sci, lireNombre, proche, CarteParcours, Cadre, ORANGE_GUIDE, useEtatPersistant } from "../commun";

// ====================================================
// ENERGY@SCHOOL — ATELIER PRODUCTION 2
// Turbine Pelton HM 150.19 et frein à bande
// Modèle : couple du jet  C_jet = k ρ Q r (v_e − r ω), frottements visqueux c ω,
// calé sur l'activité (15 L/min, 1,0 bar : 1600 tr/min à vide, rendement maximal 48 %).
// ====================================================

const P2_RHO = 1000;
const P2_R = 0.050;          // m, rayon d'impact du jet
const P2_D = 0.050;          // m, diamètre de la poulie du frein
const P2_K = 1.671;          // efficacité de la déviation du jet dans les augets
const P2_C = 6.656e-4;       // N·m·s/rad, frottements (paliers, air, éclaboussures)
const P2_CV = 0.97;          // coefficient de vitesse de la tuyère
const P2_RAPPORT_F = 4;      // F1 / F2 sur le frein à bande
const P2_REF = [[100, 9.1], [200, 18.3], [300, 26], [400, 32.7], [500, 38.2], [600, 42.8], [700, 46.4],
  [780, 47.7], [860, 48.1], [1000, 46], [1130, 40.5], [1200, 36.7], [1300, 26.6], [1370, 20.9], [1450, 7.4], [1600, 0]];

// État de la turbine pour un débit (L/min) et une force F1 (N) sur le frein
function etatTurbine(qLmin, F1) {
  const Q = qLmin / 60000;                       // m³/s
  const p = 1e5 * qLmin / 15;                    // Pa (hypothèse : pression proportionnelle au débit)
  const ve = P2_CV * Math.sqrt(2 * p / P2_RHO);  // m/s
  const C0 = P2_K * P2_RHO * Q * P2_R * ve;      // couple à l'arrêt
  const pente = P2_K * P2_RHO * Q * P2_R * P2_R + P2_C;
  const w0 = C0 / pente;                         // vitesse à vide
  const F2 = F1 / P2_RAPPORT_F;
  const Cf = (F1 - F2) * P2_D / 2;               // couple de freinage
  const w = Math.max(0, (C0 - Cf) / pente);
  return { Q, p, ve, C0, pente, w0, F2, Cf, w, n: w * 60 / (2 * Math.PI), n0: w0 * 60 / (2 * Math.PI),
    Pmeca: w > 0 ? Cf * w : 0, Phyd: p * Q };
}
// Puissance mécanique en fonction de la vitesse, pour tracer les courbes P = f(n)
function courbeP(qLmin) {
  const e = etatTurbine(qLmin, 0), pts = [];
  for (let k = 0; k <= 60; k++) {
    const w = e.w0 * k / 60;
    pts.push([w * 60 / (2 * Math.PI), (e.C0 - e.pente * w) * w]);
  }
  return pts;
}

const COUL = { eau: '#2563eb', meca: '#7c3aed', frein: '#dc2626', chaleur: '#ea580c',
  txt: '#0f172a', txt2: '#334155', bord: '#cbd5e1', fond: '#f8fafc' };

export function SimulationProduction2() {
  const [mode, setMode] = useState('guide');
  const [guide, setGuide] = useEtatPersistant('es1-production2', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true, points: true });
  const [qL, setQL] = useState(15);
  const [F1, setF1] = useState(0);
  const [onglet, setOnglet] = useState('rendement');
  const [points, setPoints] = useState([]);
  const [montrerRef, setMontrerRef] = useState(false);
  const [niveau, setNiveau] = useState(null);
  const [reps, setReps] = useState({});
  const [verifie, setVerifie] = useState(false);
  const [releve, setReleve] = useState(null);
  const [releveVide, setReleveVide] = useState(null);

  const e = etatTurbine(qL, F1);
  const eta = e.Phyd > 0 ? e.Pmeca / e.Phyd : 0;
  const bloquee = e.w <= 0 && F1 > 0;
  const va = P2_R * e.w, va0 = P2_R * e.w0;
  const cacherEta = mode === 'defi' && niveau === 2 && !verifie;
  const enDefi = mode !== 'explore';
  const enGuide = mode === 'guide';
  const etape = guide.etape;
  const vu = k => !enGuide || etape >= k;
  const revele = { vitesses: vu(7), frein: vu(8), graphe: vu(12), puissance: vu(14) };

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
  const afficheur = (x, y, texte, c, w = 118) => (
    <g>
      <rect x={x} y={y} width={w} height="28" rx="4" fill="#0f172a"/>
      <text x={x + w / 2} y={y + 20} fontSize="16" fill={c} textAnchor="middle" fontFamily="monospace" fontWeight="700">{texte}</text>
    </g>
  );

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const r2g = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
  const Qg = 15 / 60000, pg = 1.0e5, Phg = pg * Qg;
  const n0g = Math.round(etatTurbine(15, 0).n0);
  const va0g = P2_R * 2 * Math.PI * n0g / 60;
  const C4 = (4 - 4 / P2_RAPPORT_F) * P2_D / 2;
  const n4 = Math.round(etatTurbine(15, 4).n);
  const Pm4 = C4 * 2 * Math.PI * n4 / 60;
  const ETAPES = [
    { titre: 'Une vraie turbine de laboratoire', focus: ['roue', 'tuyere', 'frein'],
      texte: <>Le banc HM 150.19 est une petite <strong>turbine Pelton</strong> : un jet d'eau sort d'une <strong>tuyère</strong> et fait
        tourner une roue à augets. Dans une centrale, la roue entraînerait un alternateur ; ici, on la ralentit avec un
        <strong> frein à bande</strong> réglable, qui joue le rôle de la charge. Votre objectif : mesurer la puissance mécanique
        récupérée et le rendement, et trouver la vitesse de rotation optimale.</>, tache: null },
    { titre: 'La tuyère à aiguille', focus: ['tuyere'],
      texte: <>Une aiguille se déplace à l'intérieur de la tuyère.</>,
      tache: { type: 'qcm', q: 'À quoi sert la tuyère à aiguille ?',
        options: ['À régler le débit et accélérer le jet', 'À freiner la roue', 'À mesurer la vitesse de rotation'], bonne: 0 } },
    { titre: 'Le frein à bande', focus: ['frein'],
      texte: <>Une bande frotte sur une poulie fixée à l'axe de la roue ; deux dynamomètres mesurent les forces F<sub>1</sub> et F<sub>2</sub>.</>,
      tache: { type: 'qcm', q: 'Dans une vraie centrale, qu’est-ce qui remplace le frein ?',
        options: ['L’alternateur, qui demande de l’énergie à la turbine', 'Le barrage', 'La tuyère'], bonne: 0,
        expl: 'Serrer le frein, c’est comme brancher un appareil plus gourmand sur l’alternateur.' } },
    { titre: 'Le débit', focus: ['panneau'],
      texte: <>Le panneau d'affichage indique un débit de <strong>15 L/min</strong>. Pour les calculs, il faut le convertir en m³·s⁻¹
        (1 L = 10⁻³ m³ ; 1 min = 60 s).</>,
      tache: { type: 'num', q: 'Débit en m³·s⁻¹', unite: 'm³·s⁻¹', vrai: Qg, tol: 0.03,
        pieges: [[15 / 1000, 'N’oubliez pas les minutes : divisez aussi par 60.'], [15 / 60, '1 L = 10⁻³ m³ : divisez aussi par 1000.']], aide: 'Notation scientifique acceptée : pour 4,5 × 10⁻⁶, tapez 4,5e-6.' } },
    { titre: 'La puissance hydraulique', focus: ['panneau', 'tuyere'],
      texte: <>La pression en amont de la tuyère vaut <strong>1,0 bar</strong> (1 bar = 10⁵ Pa). La puissance apportée par l'eau
        vaut P<sub>hyd</sub> = p × Q<sub>V</sub>.</>,
      tache: { type: 'num', q: <>Puissance hydraulique P<sub>hyd</sub></>, unite: 'W', vrai: Phg, tol: 0.04,
        pieges: [[1 * Qg, '1 bar = 10⁵ Pa.'], [1e5 * 15 / 1000, 'Le débit doit être en m³·s⁻¹.']] } },
    { titre: 'La turbine à vide', focus: ['frein', 'panneau'],
      texte: <>Le frein est relâché : la roue tourne librement, à <strong>{n0g} tr/min</strong>.</>,
      tache: { type: 'qcm', q: 'Pourquoi la puissance mécanique récupérée est-elle nulle à vide ?',
        options: ['Parce que le couple de freinage est nul', 'Parce que la roue ne tourne pas', 'Parce que le débit est nul'], bonne: 0,
        expl: <>P<sub>méca</sub> = C × ω : la roue tourne vite, mais on ne lui demande rien.</> } },
    { titre: 'La vitesse de l’auget à vide', focus: ['roue'],
      texte: <>Le jet frappe les augets à r = <strong>5,00 cm</strong> de l'axe. On rappelle v = r × ω avec ω = 2π × n / 60
        (n en tr/min).</>,
      tache: { type: 'num', q: <>Vitesse de l'auget à vide v<sub>a</sub></>, unite: 'm·s⁻¹', vrai: va0g, tol: 0.03,
        pieges: [[va0g * 60, 'n est en tr/min : divisez par 60.'], [va0g / (2 * Math.PI), 'N’oubliez pas 2π.'], [va0g * 100, 'r doit être en mètres.']] } },
    { titre: 'La roue rattrape-t-elle le jet ?', focus: ['roue', 'tuyere'],
      texte: <>Ouvrez l'onglet <strong>Vitesses</strong> du graphique. Le jet sort de la tuyère à environ 14 m·s⁻¹ (on peut le
        calculer avec la relation de Bernoulli, en terminale).</>,
      tache: { type: 'qcm', q: 'Pourquoi la roue à vide va-t-elle moins vite que le jet ?',
        options: ['Les frottements (paliers, air, éclaboussures) la freinent', 'Le jet ralentit dans l’air', 'La roue est trop lourde pour tourner vite'], bonne: 0 } },
    { titre: 'Freiner la roue', focus: ['frein'],
      texte: <>Le réglage du frein est apparu sous le schéma. Serrez-le jusqu'à lire <strong>F<sub>1</sub> = 4,0 N</strong>.</>,
      tache: { type: 'action', ok: Math.abs(F1 - 4) < 0.05, consigne: `F₁ actuel : ${fmt(F1, 1)} N` } },
    { titre: 'Le couple de freinage', focus: ['frein'],
      texte: <>Le couple exercé par le frein vaut C = (F<sub>1</sub> − F<sub>2</sub>) × D/2, avec D = <strong>5,0 cm</strong> le diamètre
        de la poulie. Lisez F<sub>2</sub> sur le second dynamomètre.</>,
      tache: { type: 'num', q: 'Couple de freinage C', unite: 'N·m', vrai: C4, tol: 0.04,
        bloque: Math.abs(F1 - 4) >= 0.05 ? 'Remettez F₁ sur 4,0 N.' : null,
        pieges: [[C4 * 2, 'C’est D/2 : le rayon de la poulie.'], [C4 * 100, 'D doit être en mètres : 5,0 cm = 0,050 m.']] } },
    { titre: 'La puissance mécanique', focus: ['panneau'],
      texte: <>Freinée, la roue ne tourne plus qu'à <strong>{n4} tr/min</strong>. La puissance mécanique vaut
        P<sub>méca</sub> = C × ω, avec ω = 2π × n / 60.</>,
      tache: { type: 'num', q: <>Puissance mécanique P<sub>méca</sub></>, unite: 'W', vrai: Pm4, tol: 0.05,
        bloque: Math.abs(F1 - 4) >= 0.05 ? 'Remettez F₁ sur 4,0 N.' : null,
        pieges: [[C4 * n4 / 60, 'N’oubliez pas 2π : ω = 2π × n / 60.'], [C4 * 2 * Math.PI * n4, 'n est en tr/min : divisez par 60.']] } },
    { titre: 'Le rendement', focus: [],
      texte: <>Le rendement compare la puissance utile (mécanique) à la puissance absorbée (hydraulique) : r = P<sub>méca</sub> / P<sub>hyd</sub>.</>,
      tache: { type: 'num', q: 'Rendement r', unite: '%', vrai: Pm4 / Phg * 100, tol: 0.06,
        pieges: [[Phg / Pm4 * 100, 'C’est l’inverse : puissance utile sur puissance absorbée.'], [Pm4 / Phg, 'Exprimez le rendement en pourcentage.']] } },
    { titre: 'Tracer la courbe de rendement', focus: ['frein'],
      texte: <>Le graphique est apparu. Partez du frein relâché, serrez-le pas à pas jusqu'à bloquer la roue, et ajoutez un
        point à chaque réglage (menu « Mes points »).</>,
      tache: { type: 'action', ok: points.length >= 6, consigne: `Points ajoutés : ${points.length} / 6` } },
    { titre: 'La vitesse optimale', focus: ['panneau'],
      texte: <>Repérez sur votre courbe la vitesse de rotation qui donne le meilleur rendement, et comparez-la à la vitesse à vide ({n0g} tr/min).</>,
      tache: { type: 'qcm', q: 'Le rendement est maximal quand la roue tourne…',
        options: ['à sa vitesse à vide', 'à environ la moitié de sa vitesse à vide', 'le plus lentement possible'], bonne: 1,
        expl: 'Trop vite, la roue ne freine plus l’eau ; trop lentement, elle ne transforme presque rien en mouvement.' } },
    { titre: 'Et si le débit change ?', focus: [],
      texte: <>Ouvrez l'onglet <strong>Puissance</strong> : il montre P<sub>méca</sub> en fonction de la vitesse de rotation pour trois
        débits (documentation GUNT).</>,
      tache: { type: 'qcm', q: 'Pour une même vitesse de rotation, un débit plus faible donne une puissance mécanique…',
        options: ['plus faible', 'plus élevée'], bonne: 0 } },
    { titre: 'Bravo !', focus: [],
      texte: <>Vous avez caractérisé la turbine : puissance hydraulique, couple, puissance mécanique, rendement et vitesse
        optimale. Explorez librement le banc (changez le débit…) ou relevez le défi.</>, tache: null },
  ];
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const hl = id => enGuide && et.focus.includes(id);

  // ════════════════ SCHÉMA DU BANC ════════════════
  const cx = 390, cy = 200, rRoue = 62;
  const tourVisuel = e.n > 5 ? Math.max(0.4, 400 / e.n) : 0;   // animation volontairement ralentie
  const aMano = (-120 + 240 * Math.min(1, e.p / 3e5)) * Math.PI / 180;
  const dyn = (x, F, nom, gauche) => {
    const L = 30 + 5 * Math.min(10, F);
    return (
      <g>
        <rect x={x - 11} y="44" width="22" height="46" rx="4" fill="#bfdbfe" stroke={TXT} strokeWidth="1.5"/>
        <polyline points={Array.from({ length: 9 }, (_, k) => `${x + (k % 2 ? 6 : -6)},${92 + k * L / 8}`).join(' ')}
          fill="none" stroke={TXT} strokeWidth="1.6"/>
        <line x1={x} y1={92 + L} x2={x} y2={cy - 18} stroke={COUL.frein} strokeWidth="2.5"/>
        <text x={gauche ? x - 16 : x + 16} y="70" fontSize="16" fontWeight="700" fill={COUL.frein} textAnchor={gauche ? 'end' : 'start'}>{nom} = {fmt(F, 1)} N</text>
      </g>
    );
  };
  const schema = (
    <svg viewBox="0 0 640 330" role="img" aria-label="Banc HM 150.19 : turbine Pelton et frein à bande"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${BORDER}` }}>
      {/* Panneau d'affichage */}
      <rect x="12" y="30" width="176" height="152" rx="8" fill="#f1f5f9" stroke={TXT} strokeWidth="2"/>
      <text x="100" y="22" fontSize="15" fontWeight="700" fill={TXT} textAnchor="middle">Panneau d'affichage</text>
      <text x="26" y="52" fontSize="12.5" fill={TXT2}>débit</text>
      {afficheur(24, 56, `${fmt(qL, 1)} L/min`, '#93c5fd', 150)}
      <text x="26" y="102" fontSize="12.5" fill={TXT2}>pression</text>
      {afficheur(24, 106, `${fmt(e.p / 1e5, 2)} bar`, '#93c5fd', 150)}
      <text x="26" y="152" fontSize="12.5" fill={TXT2}>vitesse de la roue</text>
      {afficheur(24, 156, `${fmt(e.n, 0)} tr/min`, '#c4b5fd', 150)}
      {/* Arrivée d'eau, tuyère à aiguille, manomètre */}
      <path d="M 14 262 L 240 262" stroke="#64748b" strokeWidth="14"/>
      <path d="M 14 262 L 240 262" stroke="#93c5fd" strokeWidth="9" strokeDasharray="8 8">
        <animate attributeName="stroke-dashoffset" from="0" to="-32" dur={`${Math.max(0.3, 12 / qL)}s`} repeatCount="indefinite"/>
      </path>
      <polygon points="240,248 298,256 298,268 240,276" fill="#ca8a04" stroke={TXT} strokeWidth="1.5"/>
      <polygon points={`${248 + (1 - (qL - 5) / 30) * 30},259 ${292},262 ${248 + (1 - (qL - 5) / 30) * 30},265`} fill="#475569"/>
      <text x="262" y="296" fontSize="14" fontWeight="700" fill={TXT} textAnchor="middle">tuyère à aiguille</text>
      <line x1="215" y1="255" x2="215" y2="224" stroke="#64748b" strokeWidth="4"/>
      <circle cx="215" cy="204" r="20" fill="white" stroke={TXT} strokeWidth="2.5"/>
      <line x1="215" y1="204" x2={215 + 15 * Math.sin(aMano)} y2={204 - 15 * Math.cos(aMano)} stroke="#dc2626" strokeWidth="2.5"/>
      <text x="160" y="240" fontSize="13" fill={TXT2} textAnchor="middle">manomètre</text>
      {/* Jet */}
      <line x1="298" y1="262" x2={cx - 10} y2="262" stroke="#2563eb" strokeWidth={2 + qL / 12} strokeDasharray="6 4">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="0.25s" repeatCount="indefinite"/>
      </line>
      {/* Carter et roue Pelton */}
      <path d={`M ${cx - 92} 312 L ${cx - 92} ${cy} A 92 92 0 0 1 ${cx + 92} ${cy} L ${cx + 92} 312 Z`} fill="#f1f5f9" stroke={TXT} strokeWidth="2" opacity="0.7"/>
      <g transform={`translate(${cx} ${cy})`}>
        <g>
          <circle r={rRoue - 14} fill="#fee2e2" stroke="#b91c1c" strokeWidth="2"/>
          {Array.from({ length: 14 }, (_, k) => (
            <g key={k} transform={`rotate(${k * 360 / 14})`}>
              <path d={`M -8 ${rRoue - 16} Q 0 ${rRoue + 8} 8 ${rRoue - 16} Z`} fill="#dc2626" stroke="#7f1d1d" strokeWidth="1"/>
            </g>
          ))}
          {tourVisuel > 0 && <animateTransform attributeName="transform" type="rotate" from="0" to="-360" dur={`${tourVisuel}s`} repeatCount="indefinite"/>}
        </g>
        {/* Poulie du frein */}
        <circle r="18" fill="#e2e8f0" stroke={TXT} strokeWidth="2"/>
        <circle r="4" fill={TXT}/>
      </g>
      <text x={cx + 98} y={cy + 70} fontSize="15" fontWeight="700" fill={TXT}>roue Pelton</text>
      {/* Frein à bande et dynamomètres */}
      <rect x={cx - 64} y="10" width="128" height="14" rx="3" fill="#475569"/>
      <line x1={cx} y1="2" x2={cx} y2="10" stroke={TXT} strokeWidth="4"/>
      <circle cx={cx} cy="4" r="6" fill="#1e293b"/>
      {dyn(cx - 30, F1, 'F₁', true)}
      {dyn(cx + 30, e.F2, 'F₂')}
      <path d={`M ${cx - 18} ${cy} A 18 18 0 0 1 ${cx + 18} ${cy}`} fill="none" stroke={COUL.frein} strokeWidth={F1 > 0 ? 4 : 2}/>
      <line x1={cx - 30} y1={cy - 18} x2={cx - 18} y2={cy} stroke={COUL.frein} strokeWidth="2.5"/>
      <line x1={cx + 30} y1={cy - 18} x2={cx + 18} y2={cy} stroke={COUL.frein} strokeWidth="2.5"/>
      <text x={cx + 100} y="110" fontSize="14" fontWeight="700" fill={TXT}>frein à bande</text>
      <text x={cx + 100} y="128" fontSize="12.5" fill={TXT2}>volant de réglage</text>
      {bloquee && <text x={cx} y={cy + 4} fontSize="15" fontWeight="700" fill="#b91c1c" textAnchor="middle">bloquée !</text>}
      <Cadre actif={hl('panneau')} x={6} y={4} w={188} h={184}/>
      <Cadre actif={hl('tuyere')} x={186} y={180} w={124} h={124}/>
      <Cadre actif={hl('roue')} x={cx - 96} y={cy - 96} w={192} h={200}/>
      <Cadre actif={hl('frein')} x={cx - 92} y={0} w={184} h={cy + 24}/>
      {/* Eau qui retombe */}
      {[0, 1, 2].map(k => (
        <circle key={k} cx={cx - 30 + k * 30} cy="300" r="3" fill="#2563eb">
          <animate attributeName="cy" from="276" to="312" dur={`${0.5 + k * 0.15}s`} repeatCount="indefinite"/>
        </circle>
      ))}
    </svg>
  );

  // ════════════════ GRAPHIQUES ════════════════
  const ptsTries = [...points].sort((a, b) => a.n - b.n);
  const nMax = Math.max(1800, Math.ceil(etatTurbine(35, 0).n0 / 200) * 200);
  const graphe = (() => {
    if (onglet === 'rendement' && cacherEta) return (
      <div style={{ fontSize: 14, color: TXT2, padding: '40px 12px', textAlign: 'center', lineHeight: 1.6 }}>
        Au niveau 2, c'est vous qui calculez le rendement : le graphique s'affichera après la vérification.
      </div>
    );
    if (onglet === 'rendement') return (
      <Graphe xMax={Math.max(1800, Math.ceil(e.n0 / 200) * 200)} yMax={60} xLabel="Vitesse de la roue n (tr/min)" yLabel="Rendement (%)"
        courbes={[...(montrerRef ? [{ pts: P2_REF, color: '#94a3b8', dash: '5 4', label: 'courbe de l’activité' }] : []),
          ...(ptsTries.length > 1 ? [{ pts: ptsTries.map(q => [q.n, q.eta]), color: '#0284c7', label: 'mes mesures' }] : [])]}
        points={[...ptsTries.map(q => ({ x: q.n, y: q.eta, color: '#0284c7', fill: 'white', r: 4.5 })),
          { x: e.n, y: eta * 100, color: TXT, fill: '#fde047', r: 6.5 }]}/>
    );
    if (onglet === 'puissance') {
      const debits = [[31.6, '#dc2626'], [18.8, '#0284c7'], [11.5, '#16a34a']];
      const yMax = Math.ceil(Math.max(...courbeP(31.6).map(p => p[1]), ...courbeP(qL).map(p => p[1])) / 10) * 10;
      return <Graphe xMax={nMax} yMax={yMax} xLabel="n (tr/min)" yLabel="P méca (W)"
        courbes={[...debits.map(([q, c]) => ({ pts: courbeP(q), color: c, label: `${fmt(q, 1)} L/min` })),
          { pts: courbeP(qL), color: TXT, dash: '4 3', label: `réglage : ${fmt(qL, 1)} L/min` }]}
        points={[{ x: e.n, y: e.Pmeca, color: TXT, fill: '#fde047', r: 6.5 }]}/>;
    }
    return <Graphe xMax={1} yMax={Math.ceil(e.ve / 5) * 5 + 5} xLabel="" yLabel="Vitesse (m·s⁻¹)"
      barres={[{ label: 'jet vₑ', val: e.ve, color: '#2563eb', fort: true },
        { label: 'auget à vide', val: va0, color: '#94a3b8', fort: true },
        { label: 'auget vₐ', val: va, color: '#dc2626', fort: true }]}/>;
  })();
  const legende = {
    rendement: <>Point jaune : réglage actuel. Serrez le frein pas à pas et ajoutez un point à chaque fois pour tracer la courbe.</>,
    puissance: <>Comme sur la documentation GUNT : plus le débit est grand, plus la puissance est grande, et plus la roue tourne vite.</>,
    vitesses: <>À vide, la roue ne rattrape pas le jet : les frottements la retiennent. Le rendement est maximal vers la moitié de la vitesse à vide.</>,
  }[onglet];

  // ════════════════ VOLETS ════════════════
  const commandes = (
    <>
      {!enGuide && <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: TXT2, fontWeight: 700 }}>
          <span>Débit (aiguille de la tuyère)</span><span style={{ color: TXT }}>{fmt(qL, 1)} L/min</span>
        </div>
        <input type="range" min={5} max={35} step={0.5} value={qL} onChange={x => setQL(+x.target.value)}
          style={{ width: '100%', accentColor: '#0284c7' }}/>
      </div>}
      {revele.frein ? <><div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: TXT2, fontWeight: 700 }}>
          <span>Serrage du frein (force F₁)</span><span style={{ color: TXT }}>{fmt(F1, 1)} N</span>
        </div>
        <input type="range" min={0} max={16} step={0.1} value={F1} onChange={x => setF1(+x.target.value)}
          style={{ width: '100%', accentColor: COUL.frein }}/>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setF1(0)} style={petitBtn(F1 === 0, '#334155')}>Frein relâché (à vide)</button>
        {!enGuide && <button onClick={() => setQL(15)} style={petitBtn(qL === 15, '#334155')}>15 L/min</button>}
      </div></> : <div style={{ fontSize: 13, color: TXT2 }}>Le réglage du frein apparaîtra au fil du parcours.</div>}
      {bloquee && <div style={{ fontSize: 12.5, color: '#b91c1c', marginTop: 8 }}>
        Le frein est trop serré : le jet ne peut plus faire tourner la roue. Desserrez-le.
      </div>}
    </>
  );
  const mesures = (
    <>
      {ligne('Débit Q', `${fmt(qL, 1)} L/min`, COUL.eau, 'q')}
      {ligne('Pression p', `${fmt(e.p / 1e5, 2)} bar`, COUL.eau, 'p')}
      {ligne('Vitesse de la roue n', `${fmt(e.n, 0)} tr/min`, COUL.meca, 'n')}
      {ligne(<>Forces du frein F<sub>1</sub> ; F<sub>2</sub></>, `${fmt(F1, 1)} N ; ${fmt(e.F2, 1)} N`, COUL.frein, 'f')}
      {!enDefi && ligne(<>Puissance hydraulique P<sub>hyd</sub> = p × Q</>, `${fmt(e.Phyd, 1)} W`, COUL.eau, 'ph')}
      {!enDefi && ligne(<>Couple de freinage C = (F<sub>1</sub> − F<sub>2</sub>) × D/2</>, `${sci(e.Cf)} N·m`, COUL.frein, 'c')}
      {!enDefi && ligne(<>Puissance mécanique P<sub>méca</sub> = C × ω</>, `${fmt(e.Pmeca, 2)} W`, COUL.meca, 'pm')}
      {!enDefi && ligne(<>Rendement P<sub>méca</sub> / P<sub>hyd</sub></>, `${fmt(eta * 100, 1)} %`, COUL.chaleur, 'eta')}
      {!enDefi && ligne(<>Vitesse de l'auget v<sub>a</sub> ; à vide</>, `${fmt(va, 1)} ; ${fmt(va0, 1)} m·s⁻¹`, COUL.meca, 'va')}
      {!enDefi && ligne(<>Vitesse du jet v<sub>e</sub> (Bernoulli)</>, `${fmt(e.ve, 1)} m·s⁻¹`, COUL.eau, 've')}
    </>
  );
  const mesPoints = (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => setPoints(l => [...l.filter(q => Math.abs(q.n - e.n) > 5), { n: e.n, F1, eta: eta * 100, P: e.Pmeca }])}
          style={petitBtn(true, '#0284c7')}>➕ Ajouter ce point</button>
        <button onClick={() => setPoints([])} style={petitBtn(false)}>Effacer</button>
        <button onClick={() => setMontrerRef(v => !v)} style={petitBtn(montrerRef, '#94a3b8')}>Courbe de l'activité</button>
      </div>
      {points.length === 0 ? (
        <div style={{ fontSize: 12.5, color: TXT2, lineHeight: 1.5 }}>
          Partez du frein relâché, serrez-le pas à pas jusqu'au blocage, et ajoutez un point à chaque fois.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>{(cacherEta ? ['F₁ (N)', 'n (tr/min)'] : ['F₁ (N)', 'n (tr/min)', 'P (W)', 'η (%)']).map(h => (
            <th key={h} style={{ textAlign: 'right', padding: '3px 5px', borderBottom: `1.5px solid ${BORDER}`, color: TXT2 }}>{h}</th>))}</tr></thead>
          <tbody>{ptsTries.map((q, i) => (
            <tr key={i}>{(cacherEta ? [fmt(q.F1, 1), fmt(q.n, 0)] : [fmt(q.F1, 1), fmt(q.n, 0), fmt(q.P, 2), fmt(q.eta, 1)]).map((c, j) => (
              <td key={j} style={{ textAlign: 'right', padding: '3px 5px', fontFamily: 'monospace' }}>{c}</td>))}</tr>
          ))}</tbody>
        </table>
      )}
    </>
  );
  const comprendre = (
    <div style={{ fontSize: 13.5, color: TXT, lineHeight: 1.6 }}>
      <div>Puissance hydraulique : P<sub>hyd</sub> = p × Q (p en Pa, Q en m³·s⁻¹ ; 1 L/min = 1/60 000 m³·s⁻¹).</div>
      <div>Couple du frein : C = (F<sub>1</sub> − F<sub>2</sub>) × D/2, avec D = 5,0 cm.</div>
      <div>Puissance mécanique : P<sub>méca</sub> = C × ω, avec ω = 2π × n / 60 (n en tr/min).</div>
      <div style={{ marginTop: 6, color: TXT2 }}>
        À vide, le frein ne retient rien : C = 0, donc P<sub>méca</sub> = 0. Roue bloquée : ω = 0, donc P<sub>méca</sub> = 0.
        Entre les deux, la puissance passe par un maximum.
      </div>
      <div style={{ marginTop: 6, color: TXT2 }}>
        La vitesse du jet se calcule avec Bernoulli : v<sub>e</sub> ≈ √(2p/ρ) ≈ 14 m·s⁻¹ à 1,0 bar. À vide, la roue n'atteint
        pas cette vitesse (environ 8,4 m·s⁻¹ au niveau de l'auget), car les frottements des paliers, de l'air et des
        éclaboussures la freinent. Le rendement est maximal quand la roue tourne à environ la moitié de sa vitesse à vide.
      </div>
    </div>
  );

  // ════════════════ DÉFIS ════════════════
  const NIVEAUX = [
    { n: 1, nom: 'Découverte', c: '#16a34a', desc: 'Le rôle des éléments du banc et le fonctionnement, sans calcul.' },
    { n: 2, nom: 'Calculs', c: '#0ea5e9', desc: 'Puissance hydraulique, couple, puissance mécanique et rendement.' },
    { n: 3, nom: 'Expert', c: '#dc2626', desc: 'Vitesses de l’auget et du jet (Bernoulli), point optimal.' },
  ];
  const questions = (() => {
    if (niveau === 1) return [
      { id: 'tuy', type: 'choix', q: 'À quoi sert la tuyère à aiguille ?',
        options: ['À freiner la roue', 'À régler le débit et accélérer le jet', 'À mesurer la vitesse'], bonne: 1 },
      { id: 'frein', type: 'choix', q: 'À quoi sert le frein à bande ?',
        options: ['À simuler l’alternateur qui demande de l’énergie à la turbine', 'À refroidir la roue', 'À mesurer le débit'], bonne: 0 },
      { id: 'vide', type: 'choix', q: 'Relâchez le frein. Pourquoi la puissance mécanique récupérée est-elle nulle ?',
        options: ['La roue ne tourne pas', 'Le couple de freinage est nul', 'Le débit est nul'], bonne: 1 },
      { id: 'bloq', type: 'choix', q: 'Serrez le frein jusqu’à bloquer la roue. Pourquoi la puissance est-elle nulle ?',
        options: ['Le couple est nul', 'La vitesse de rotation est nulle', 'La pression est nulle'], bonne: 1 },
      { id: 'serre', type: 'choix', q: 'Quand on serre le frein, la vitesse de la roue…', options: ['augmente', 'diminue', 'ne change pas'], bonne: 1 },
      { id: 'opt', type: 'choix', q: 'Tracez la courbe de rendement. Le rendement est maximal quand la roue tourne…',
        options: ['à sa vitesse à vide', 'à environ la moitié de sa vitesse à vide', 'le plus lentement possible'], bonne: 1 },
      { id: 'deb', type: 'choix', q: 'Onglet « Puissance » : pour une même vitesse de rotation, un débit plus faible donne une puissance…',
        options: ['plus faible', 'plus élevée'], bonne: 0 },
    ];
    if (niveau === 2 && releve) {
      const { q, pBar, F1: f1, n } = releve;
      const Qs = q / 60000, Ph = pBar * 1e5 * Qs, C = (f1 - f1 / P2_RAPPORT_F) * P2_D / 2, w = 2 * Math.PI * n / 60, Pm = C * w;
      return [
        { id: 'Q', type: 'num', q: <>Débit en m³·s⁻¹ ({fmt(q, 1)} L/min)</>, unite: 'm³·s⁻¹', vrai: Qs, tol: 0.03,
          pieges: [[q / 1000, 'N’oubliez pas les minutes : 1 min = 60 s.'], [q / 60, '1 L = 10⁻³ m³.']], aide: 'Notation scientifique acceptée : pour 4,5 × 10⁻⁶, tapez 4,5e-6.' },
        { id: 'Ph', type: 'num', q: <>Puissance hydraulique P<sub>hyd</sub> = p × Q (p = {fmt(pBar, 2)} bar)</>, unite: 'W', vrai: Ph, tol: 0.04,
          pieges: [[pBar * Qs, '1 bar = 10⁵ Pa.'], [pBar * 1e5 * q / 1000, 'Le débit doit être en m³·s⁻¹ (divisez aussi par 60).']] },
        { id: 'C', type: 'num', q: <>Couple de freinage C = (F<sub>1</sub> − F<sub>2</sub>) × D/2 (F<sub>1</sub> = {fmt(f1, 1)} N ; F<sub>2</sub> = {fmt(f1 / P2_RAPPORT_F, 1)} N ; D = 5,0 cm)</>,
          unite: 'N·m', vrai: C, tol: 0.04,
          pieges: [[C * 2, 'C’est D/2, le rayon de la poulie.'], [C * 100, 'D doit être en mètres : 5,0 cm = 0,050 m.']] },
        { id: 'w', type: 'num', q: <>Vitesse angulaire ω = 2π × n / 60 (n = {fmt(n, 0)} tr/min)</>, unite: 'rad·s⁻¹', vrai: w, tol: 0.03,
          pieges: [[n / 60, 'N’oubliez pas 2π : 1 tour = 2π rad.'], [2 * Math.PI * n, 'n est en tours par minute : divisez par 60.']] },
        { id: 'Pm', type: 'num', q: <>Puissance mécanique P<sub>méca</sub> = C × ω</>, unite: 'W', vrai: Pm, tol: 0.05 },
        { id: 'eta', type: 'num', q: <>Rendement η = P<sub>méca</sub> / P<sub>hyd</sub></>, unite: '%', vrai: Pm / Ph * 100, tol: 0.06,
          pieges: [[Ph / Pm * 100, 'C’est l’inverse : puissance utile sur puissance reçue.'], [Pm / Ph, 'Exprimez le rendement en pourcentage.']] },
      ];
    }
    if (niveau === 3 && releve && releveVide) {
      const n0 = releveVide.n, va0m = 2 * Math.PI * n0 / 60 * P2_R;
      const ve = Math.sqrt(2 * releveVide.pBar * 1e5 / P2_RHO);
      const vaOpt = 2 * Math.PI * releve.n / 60 * P2_R;
      return [
        { id: 'va0', type: 'num', q: <>Vitesse de l'auget à vide v<sub>a</sub> = r × 2π n / 60 (n = {fmt(n0, 0)} tr/min ; r = 5,00 cm)</>, unite: 'm·s⁻¹', vrai: va0m, tol: 0.03,
          pieges: [[va0m * 60, 'n est en tr/min : divisez par 60 pour avoir des tr/s.'], [va0m / (2 * Math.PI), 'N’oubliez pas 2π.'], [va0m * 100, 'r doit être en mètres.']] },
        { id: 've', type: 'num', q: <>Vitesse du jet par Bernoulli v<sub>e</sub> = √(2p/ρ) (p = {fmt(releveVide.pBar, 2)} bar ; ρ = 1000 kg·m⁻³)</>, unite: 'm·s⁻¹', vrai: ve, tol: 0.04,
          pieges: [[Math.sqrt(2 * releveVide.pBar / P2_RHO), 'La pression doit être en pascals : 1 bar = 10⁵ Pa.'], [Math.sqrt(releveVide.pBar * 1e5 / P2_RHO), 'N’oubliez pas le facteur 2 : ½ ρ v² = p.']] },
        { id: 'pq', type: 'choix', q: 'Pourquoi la roue à vide ne tourne-t-elle pas aussi vite que le jet ?',
          options: ['Les frottements (paliers, air, éclaboussures) la freinent', 'Le jet ralentit dans l’air', 'La roue est trop lourde'], bonne: 0 },
        { id: 'vaopt', type: 'num', q: <>Vitesse de l'auget au rendement maximal (votre relevé : n = {fmt(releve.n, 0)} tr/min)</>, unite: 'm·s⁻¹', vrai: vaOpt, tol: 0.04 },
        { id: 'rap', type: 'num', q: <>Rapport v<sub>a</sub>(rendement max) / v<sub>a</sub>(à vide)</>, unite: '', vrai: vaOpt / va0m, tol: 0.06 },
      ];
    }
    return [];
  })();

  const juste = q => {
    const r = reps[q.id];
    if (q.type === 'choix') return r === q.bonne;
    const x = lireNombre(r);
    return isFinite(x) && proche(x, q.vrai, q.tol);
  };
  const piege = q => {
    const x = lireNombre(reps[q.id]);
    if (!isFinite(x)) return 'Entrez une valeur numérique.';
    const pg = (q.pieges || []).find(([v]) => proche(x, v, Math.max(q.tol, 0.04)));
    if (pg) return pg[1];
    if (proche(x, q.vrai * 1000, 0.05) || proche(x, q.vrai / 1000, 0.05)) return 'Facteur 1000 : vérifiez les unités.';
    return null;
  };
  const score = questions.filter(juste).length;
  function demarrer(nv) { setNiveau(nv); setReps({}); setVerifie(false); setReleve(null); setReleveVide(null); }
  const r2 = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
  const mesureActuelle = () => ({ q: qL, pBar: r2(e.p / 1e5, 2), F1: r2(F1, 1), n: Math.round(e.n) });
  const releveOk = F1 > 0 && !bloquee;

  const panneauReleve = niveau === 2 ? (
    <div style={{ ...box, background: 'white', marginBottom: 10 }}>
      <div style={{ fontSize: 13.5, color: TXT, lineHeight: 1.55, marginBottom: 6 }}>
        <strong>Votre manip :</strong> réglez un débit, serrez le frein (sans bloquer la roue), puis relevez les indications du
        panneau et des dynamomètres.
      </div>
      <button onClick={() => { setReleve(mesureActuelle()); setReps({}); setVerifie(false); }} disabled={!releveOk}
        style={{ ...btn(releveOk, '#0ea5e9'), opacity: releveOk ? 1 : 0.5 }}>📋 Relever mes mesures</button>
      {releve && <div style={{ fontSize: 13, marginTop: 6, fontFamily: 'monospace', lineHeight: 1.6 }}>
        Q = {fmt(releve.q, 1)} L/min ; p = {fmt(releve.pBar, 2)} bar ; n = {releve.n} tr/min<br/>F₁ = {fmt(releve.F1, 1)} N ; F₂ = {fmt(releve.F1 / P2_RAPPORT_F, 1)} N
      </div>}
    </div>
  ) : niveau === 3 ? (
    <div style={{ ...box, background: 'white', marginBottom: 10 }}>
      <div style={{ fontSize: 13.5, color: TXT, lineHeight: 1.55, marginBottom: 6 }}>
        <strong>Votre manip, en deux temps, sans changer le débit :</strong> 1) frein relâché, relevez la vitesse à vide ;
        2) tracez la courbe de rendement, placez-vous au maximum et relevez à nouveau.
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setReleveVide(mesureActuelle())} disabled={F1 !== 0}
          style={{ ...btn(F1 === 0, '#0ea5e9'), opacity: F1 === 0 ? 1 : 0.5 }}>1) Relever à vide</button>
        <button onClick={() => { setReleve(mesureActuelle()); setReps({}); setVerifie(false); }} disabled={!releveOk || !releveVide || releveVide.q !== qL}
          style={{ ...btn(releveOk && !!releveVide, '#0ea5e9'), opacity: releveOk && releveVide && releveVide.q === qL ? 1 : 0.5 }}>2) Relever au maximum</button>
      </div>
      {releveVide && <div style={{ fontSize: 13, marginTop: 6, fontFamily: 'monospace' }}>à vide : n = {releveVide.n} tr/min ; p = {fmt(releveVide.pBar, 2)} bar</div>}
      {releve && <div style={{ fontSize: 13, fontFamily: 'monospace' }}>au maximum : n = {releve.n} tr/min</div>}
      {releveVide && releveVide.q !== qL && <div style={{ fontSize: 12, color: '#b91c1c' }}>Le débit a changé depuis le relevé à vide.</div>}
    </div>
  ) : null;

  const listeQuestions = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {questions.map((q, k) => {
        const ok = verifie && juste(q);
        return (
          <div key={q.id} style={{ borderLeft: `3px solid ${verifie ? (ok ? '#16a34a' : '#dc2626') : BORDER}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, color: TXT, fontWeight: 700, marginBottom: 5 }}>{k + 1}. {q.q}</div>
            {q.type === 'choix' ? (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {q.options.map((o, i) => <button key={i} onClick={() => { setReps(pr => ({ ...pr, [q.id]: i })); setVerifie(false); }}
                  style={petitBtn(reps[q.id] === i, '#0ea5e9')}>{o}</button>)}
                {verifie && <span style={{ fontSize: 13 }}>{ok ? '✅' : '❌'}</span>}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${k + 1}`}
                  onChange={x => { const v = x.target.value; setReps(pr => ({ ...pr, [q.id]: v })); setVerifie(false); }} style={{ ...inp, width: 120 }}/>
                <span style={{ fontSize: 13, color: TXT2 }}>{q.unite}</span>
                {verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
            )}
            {q.aide && !verifie && <div style={{ fontSize: 12, color: TXT2, marginTop: 3 }}>{q.aide}</div>}
            {verifie && q.type === 'num' && !ok && piege(q) && (
              <div style={{ fontSize: 12.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>{piege(q)}</div>
            )}
            {verifie && q.type === 'num' && !ok && (reps[`vu_${q.id}`]
              ? <div style={{ fontSize: 12.5, color: TXT2, marginTop: 3 }}>Valeur attendue : {sci(q.vrai)} {q.unite}</div>
              : <button onClick={() => setReps(pr => ({ ...pr, [`vu_${q.id}`]: true }))} style={{ fontSize: 12, marginTop: 3, background: 'none',
                  border: 'none', color: TXT2, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>voir la valeur attendue</button>)}
          </div>
        );
      })}
      {questions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setVerifie(true)} style={btn(true, '#16a34a')}>✓ Vérifier</button>
          {verifie && <strong style={{ color: score === questions.length ? '#15803d' : TXT }}>{score} / {questions.length}{score === questions.length ? ' 🎉' : ''}</strong>}
        </div>
      )}
    </div>
  );
  const nivInfo = NIVEAUX.find(x => x.n === niveau);
  const voletDefi = !niveau ? (
    <div>
      <div style={{ fontSize: 14, color: TXT, fontWeight: 700, marginBottom: 8 }}>Choisissez un niveau</div>
      {NIVEAUX.map(nv => (
        <button key={nv.n} onClick={() => demarrer(nv.n)} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8,
          padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${nv.c}`, background: 'white', cursor: 'pointer' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: nv.c }}>{nv.n}. {nv.nom}</div>
          <div style={{ fontSize: 13, color: TXT2, marginTop: 2 }}>{nv.desc}</div>
        </button>
      ))}
    </div>
  ) : (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'white', background: nivInfo.c, borderRadius: 6, padding: '3px 8px' }}>Niveau {niveau} : {nivInfo.nom}</span>
        <button onClick={() => setNiveau(null)} style={petitBtn(false)}>Changer de niveau</button>
      </div>
      {panneauReleve}
      {(niveau === 1 || releve) && listeQuestions}
    </>
  );

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'guide') setQL(15); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={btn(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={btn(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  const onglets = [['rendement', 'Rendement', revele.graphe], ['puissance', 'Puissance', revele.puissance], ['vitesses', 'Vitesses', revele.vitesses]].filter(o => o[2]);
  const ongletAffiche = onglets.some(o => o[0] === onglet) ? onglet : (onglets[0] || [])[0];
  if (ongletAffiche && ongletAffiche !== onglet) setTimeout(() => setOnglet(ongletAffiche), 0);
  const blocGraphe = onglets.length === 0 ? null : (
    <div style={box}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {onglets.map(([k, l]) => <button key={k} onClick={() => setOnglet(k)} style={petitBtn(onglet === k, '#334155')}>{l}</button>)}
      </div>
      {graphe}
      <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>{legende}</div>
    </div>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .p2-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .p2-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        .p2-l2-defi { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(280px, 1fr) minmax(0, 2fr); }
        @media (max-width: 900px) { .p2-l1, .p2-l2-defi { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: TXT }}>Production 2 · Étude d'une turbine Pelton (banc HM 150.19)</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={btn(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={btn(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={btn(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      <div className="p2-l1">
        <div style={box}>
          <div style={titreBox}>Le banc : turbine Pelton freinée</div>
          {schema}
          <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
            {enGuide ? <>L'élément encadré en orange est celui dont parle l'étape en cours. L'animation de la roue est ralentie.</>
              : <>Le jet fait tourner la roue ; le frein à bande joue le rôle de l'alternateur en lui demandant de l'énergie.
                Les dynamomètres F<sub>1</sub> et F<sub>2</sub> permettent de calculer le couple. L'animation de la roue est ralentie.</>}
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : blocGraphe}
      </div>
      {enGuide ? (
        <div className="p2-l2">
          {blocGraphe}
          <div>
            {section('commandes', 'Commandes', commandes)}
            {section('mesures', 'Mesures', mesures)}
          </div>
          {revele.graphe && section('points', 'Mes points', mesPoints)}
        </div>
      ) : mode === 'explore' ? (
        <div className="p2-l2">
          {section('commandes', 'Commandes', commandes)}
          {section('mesures', 'Mesures', mesures)}
          {section('points', 'Mes points', mesPoints)}
          {section('comprendre', 'Comprendre', comprendre)}
        </div>
      ) : (
        <div className="p2-l2-defi">
          <div>
            {section('commandes', 'Commandes', commandes)}
            {section('mesures', 'Mesures', mesures)}
            {section('points', 'Mes points', mesPoints)}
          </div>
          <div style={box}>{voletDefi}</div>
        </div>
      )}
    </div>
  );
}
