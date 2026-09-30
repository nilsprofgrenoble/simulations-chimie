import { useState, useEffect, useRef } from "react";
import { cardStyle, Graphe, fmt, sci, lireNombre, proche } from "../commun";

// ====================================================
// ENERGY@SCHOOL — ATELIER PRODUCTION 1
// Conduite forcée, turbine Pelton et alternateur
// Modèle calé sur la courbe de rendement de l'activité (P_hyd = 18 W)
// ====================================================

const PR_Q_REF = 6.7e-5;       // m³/s, débit de référence (robinet à 80 %)
const PR_P_REF = 2.69e5;       // Pa, pression correspondante (≈ 2,7 bar)
const PR_R_JET = 1.0e-3;       // m, rayon du jet (diamètre 2,0 mm)
const PR_R_ROUE = 0.040;       // m, rayon d'impact du jet sur la roue
const PR_P = 4;                // paires de pôles de l'alternateur
const PR_N0 = 87.5;            // tr/s, vitesse à vide au débit de référence
// Courbe « courant – tension » de l'alternateur au débit de référence,
// déduite de la courbe de rendement de l'activité (P = η × 18 W, I = P / U)
const PR_UI = [[0, 0.59], [1, 0.54], [1.9, 0.497], [3, 0.447], [4, 0.398], [4.8, 0.349],
  [5.6, 0.299], [6.2, 0.25], [6.9, 0.196], [7.4, 0.139], [8.7, 0]];
const PR_COURBE_REF = [[0, 0], [1, 3.0], [1.9, 5.25], [3, 7.45], [4, 8.85], [4.8, 9.3], [5.6, 9.3],
  [6.2, 8.6], [6.9, 7.5], [7.4, 5.7], [8.7, 0]];

function iRef(u) {
  for (let k = 0; k < PR_UI.length - 1; k++) {
    const [u0, i0] = PR_UI[k], [u1, i1] = PR_UI[k + 1];
    if (u <= u1) return i0 + (i1 - i0) * (u - u0) / (u1 - u0);
  }
  return 0;
}
// Courant au point de puissance maximale (sert à régler la loi de vitesse de la turbine)
const PR_I_OPT = (() => {
  let best = [0, 0];
  for (let u = 0; u <= 8.7; u += 0.01) { const p = u * iRef(u); if (p > best[0]) best = [p, iRef(u)]; }
  return best[1];
})();

// Point de fonctionnement pour une ouverture (s = Q / Q_ref) et une résistance R
function pointFonct(s, R) {
  if (s <= 0) return { U: 0, I: 0, n: 0 };
  let uRef;
  if (R === Infinity) uRef = 8.7;
  else if (R <= 0) uRef = 0;
  else {
    const Rref = s * R;                       // similitude : U ∝ s, I ∝ s²
    let lo = 0, hi = 8.7;
    for (let k = 0; k < 50; k++) {
      const m = (lo + hi) / 2, i = iRef(m);
      if (i <= 0 || m / i > Rref) hi = m; else lo = m;
    }
    uRef = (lo + hi) / 2;
  }
  const ir = iRef(uRef);
  const n = s * PR_N0 * (1 - ir / (2 * PR_I_OPT));   // la turbine ralentit quand on lui demande du couple
  return { U: s * uRef, I: s * s * ir, n: Math.max(0, n) };
}

const COUL = { eau: '#2563eb', meca: '#7c3aed', elec: '#dc2626', chaleur: '#ea580c',
  txt: '#0f172a', txt2: '#334155', bord: '#cbd5e1', fond: '#f8fafc' };

// Charges proposées (résistance du rhéostat)
const PR_CHARGES = [0, 1, 2, 3, 5, 8, 10, 12, 15, 20, 30, 50, 100, Infinity];
const nomCharge = R => (R === 0 ? 'court-circuit' : R === Infinity ? 'circuit ouvert' : `${R} Ω`);

export function SimulationProduction1() {
  const [mode, setMode] = useState('explore');
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true, points: true });
  const [ouv, setOuv] = useState(80);                 // ouverture du robinet (%)
  const [kR, setKR] = useState(6);                    // indice dans PR_CHARGES (10 Ω)
  const [onglet, setOnglet] = useState('rendement');
  const [baseT, setBaseT] = useState(2);              // ms par division de l'oscilloscope
  const [points, setPoints] = useState([]);
  const [montrerRef, setMontrerRef] = useState(false);
  // Mesure du débit au seau
  const [seau, setSeau] = useState({ actif: false, t: 0, v: 0, fini: null });
  // Défis
  const [niveau, setNiveau] = useState(null);
  const [reps, setReps] = useState({});
  const [verifie, setVerifie] = useState(false);
  const [releve, setReleve] = useState(null);

  const s = ouv / 80;
  const cacherEta = mode === 'defi' && niveau === 2 && !verifie;
  const R = PR_CHARGES[kR];
  const Q = PR_Q_REF * s, p = PR_P_REF * s * s, Phyd = p * Q;
  const pt = pointFonct(s, R);
  const Pel = pt.U * pt.I, eta = Phyd > 0 ? Pel / Phyd : 0;
  const f = PR_P * pt.n, T = f > 0 ? 1 / f : Infinity;
  const vJet = Q / (Math.PI * PR_R_JET ** 2), vAuget = 2 * Math.PI * PR_R_ROUE * pt.n;

  // ── Remplissage du seau de 1 L ──
  const refQ = useRef(Q); refQ.current = Q;
  useEffect(() => {
    if (!seau.actif) return;
    let prec = performance.now(), id;
    const pas = now => {
      const dt = Math.min(0.1, (now - prec) / 1000); prec = now;
      let fin = false;
      setSeau(e => {
        const v = e.v + refQ.current * 1000 * dt;   // L
        if (v >= 1) { fin = true; const tf = e.t + dt * (1 - e.v) / (v - e.v); return { actif: false, t: tf, v: 1, fini: tf }; }
        return { ...e, t: e.t + dt, v };
      });
      if (!fin) id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [seau.actif]);
  const lancerSeau = () => setSeau({ actif: true, t: 0, v: 0, fini: null });

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
  const afficheur = (x, y, texte, c, w = 96) => (
    <g>
      <rect x={x} y={y} width={w} height="26" rx="4" fill="#0f172a"/>
      <text x={x + w / 2} y={y + 19} fontSize="16" fill={c} textAnchor="middle" fontFamily="monospace" fontWeight="700">{texte}</text>
    </g>
  );

  // ════════════════ SCHÉMA ════════════════
  const cx = 300, cy = 140, rRoue = 64;
  const tourVisuel = pt.n > 0.5 ? Math.max(0.35, 12 / pt.n) : 0;   // animation volontairement ralentie
  const angleRob = -90 + 90 * ouv / 100;
  const aiguille = (valeur, max) => -120 + 240 * Math.min(1, valeur / max);
  const aMano = aiguille(p / 1e5, 4) * Math.PI / 180;
  const seauH = 60 * seau.v;
  const schema = (
    <svg viewBox="0 0 640 320" role="img" aria-label="Conduite forcée, turbine Pelton et alternateur"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${BORDER}` }}>
      {/* Robinet et conduite forcée */}
      <rect x="20" y="22" width="60" height="18" rx="4" fill="#94a3b8" stroke={TXT} strokeWidth="1.5"/>
      <g transform="translate(50 22)">
        <line x1="0" y1="0" x2={22 * Math.cos(angleRob * Math.PI / 180)} y2={-12 + 12 * Math.sin(angleRob * Math.PI / 180)}
          stroke="#dc2626" strokeWidth="5" strokeLinecap="round"/>
      </g>
      <text x="50" y="62" fontSize="16" fontWeight="700" fill={TXT} textAnchor="middle">Robinet</text>
      <path d="M 80 31 L 150 31 Q 170 31 170 51 L 170 180 Q 170 200 190 200 L 214 200" fill="none" stroke="#64748b" strokeWidth="13"/>
      <path d="M 80 31 L 150 31 Q 170 31 170 51 L 170 180 Q 170 200 190 200 L 214 200" fill="none" stroke="#93c5fd" strokeWidth="8"
        strokeDasharray={ouv > 0 ? '8 8' : 'none'}>
        {ouv > 0 && <animate attributeName="stroke-dashoffset" from="0" to="-32" dur={`${Math.max(0.3, 1.6 / s)}s`} repeatCount="indefinite"/>}
      </path>
      <text x="182" y="120" fontSize="15" fontWeight="700" fill={TXT} transform="rotate(90 182 120)" textAnchor="middle">conduite forcée</text>
      {/* Manomètre */}
      <line x1="170" y1="90" x2="130" y2="90" stroke="#64748b" strokeWidth="4"/>
      <circle cx="110" cy="90" r="24" fill="white" stroke={TXT} strokeWidth="2.5"/>
      <line x1="110" y1="90" x2={110 + 18 * Math.sin(aMano)} y2={90 - 18 * Math.cos(aMano)} stroke="#dc2626" strokeWidth="2.5"/>
      <text x="110" y="135" fontSize="16" fontWeight="700" fill={TXT} textAnchor="middle">{fmt(p / 1e5, 2)} bar</text>
      <text x="110" y="152" fontSize="13" fill={TXT2} textAnchor="middle">manomètre</text>
      {/* Injecteur et jet */}
      <polygon points="214,193 232,198 232,202 214,207" fill="#475569"/>
      {ouv > 0 && (
        <line x1="232" y1="200" x2={cx - 8} y2="200" stroke="#2563eb" strokeWidth={2 + 2 * s} strokeDasharray="6 4">
          <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="0.25s" repeatCount="indefinite"/>
        </line>
      )}
      <text x="250" y="226" fontSize="14" fontWeight="700" fill="#2563eb">jet</text>
      {/* Roue Pelton */}
      <g transform={`translate(${cx} ${cy})`}>
        <g>
          <circle r={rRoue - 14} fill="#fee2e2" stroke="#b91c1c" strokeWidth="2"/>
          {Array.from({ length: 12 }, (_, k) => (
            <g key={k} transform={`rotate(${k * 30})`}>
              <path d={`M -9 ${rRoue - 16} Q 0 ${rRoue + 8} 9 ${rRoue - 16} Z`} fill="#dc2626" stroke="#7f1d1d" strokeWidth="1"/>
            </g>
          ))}
          <line x1="-40" y1="0" x2="40" y2="0" stroke="#7f1d1d" strokeWidth="3"/>
          {tourVisuel > 0 && <animateTransform attributeName="transform" type="rotate" from="0" to="-360"
            dur={`${tourVisuel}s`} repeatCount="indefinite"/>}
        </g>
        <circle r="7" fill={TXT}/>
      </g>
      <text x={cx} y="36" fontSize="16" fontWeight="700" fill={TXT} textAnchor="middle">Turbine Pelton</text>
      {/* Chute d'eau dans le bac */}
      <rect x="230" y="258" width="150" height="38" rx="4" fill="#dbeafe" stroke={TXT} strokeWidth="1.5"/>
      {ouv > 0 && [0, 1, 2].map(k => (
        <circle key={k} cx={cx - 20 + k * 20} cy="230" r="3" fill="#2563eb">
          <animate attributeName="cy" from="210" to="262" dur={`${0.5 + k * 0.15}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      {/* Arbre et alternateur */}
      <line x1={cx} y1={cy} x2="410" y2={cy} stroke={TXT} strokeWidth="5"/>
      <rect x="410" y="104" width="76" height="72" rx="10" fill="#e0e7ff" stroke={TXT} strokeWidth="2"/>
      <text x="448" y="136" fontSize="15" fontWeight="700" fill={TXT} textAnchor="middle">Alter-</text>
      <text x="448" y="154" fontSize="15" fontWeight="700" fill={TXT} textAnchor="middle">nateur</text>
      <text x="448" y="196" fontSize="12.5" fill={TXT2} textAnchor="middle">4 paires de pôles</text>
      {/* Charge (rhéostat) */}
      <polyline points="486,120 540,120 540,96" fill="none" stroke={COUL.elec} strokeWidth="2.5"/>
      <polyline points="486,160 600,160 600,96" fill="none" stroke={COUL.elec} strokeWidth="2.5"/>
      <rect x="530" y="52" width="80" height="44" rx="4" fill="white" stroke={TXT} strokeWidth="2"/>
      <text x="570" y="79" fontSize={R === 0 || R === Infinity ? 12 : 15} fontWeight="700" fill={TXT} textAnchor="middle">{nomCharge(R)}</text>
      <text x="570" y="42" fontSize="15" fontWeight="700" fill={TXT} textAnchor="middle">Charge</text>
      {afficheur(512, 176, `${fmt(pt.U, 2)} V`, '#93c5fd', 110)}
      {afficheur(512, 208, `${fmt(pt.I, 3)} A`, '#fca5a5', 110)}
      <text x="567" y="252" fontSize="12.5" fill={TXT2} textAnchor="middle">valeurs efficaces</text>
      {/* Seau de 1 L pour mesurer le débit */}
      <path d="M 26 236 L 32 300 L 88 300 L 94 236" fill="none" stroke={TXT} strokeWidth="2.5"/>
      <clipPath id="prSeau"><path d="M 26 236 L 32 300 L 88 300 L 94 236 Z"/></clipPath>
      <rect x="20" y={300 - seauH} width="80" height={seauH} fill="#60a5fa" opacity="0.6" clipPath="url(#prSeau)"/>
      <line x1="24" y1="240" x2="96" y2="240" stroke="#1d4ed8" strokeWidth="1" strokeDasharray="3 3"/>
      <text x="100" y="244" fontSize="12" fill="#1d4ed8">1 L</text>
      <text x="60" y="226" fontSize="14" fontWeight="700" fill={TXT} textAnchor="middle">
        {seau.fini ? `${fmt(seau.fini, 1)} s` : seau.actif ? `${fmt(seau.t, 1)} s` : 'seau'}
      </text>
    </svg>
  );

  // ════════════════ OSCILLOSCOPE ════════════════
  const oscillo = (() => {
    const W = 340, H = 260, nx = 10, ny = 8, dx = W / nx, dy = H / ny;
    const sensV = 5;                      // V par division
    const Umax = pt.U * Math.SQRT2;
    const dureeEcran = baseT * nx / 1000; // s
    const pts = [];
    for (let k = 0; k <= 400; k++) {
      const t = dureeEcran * k / 400;
      const u = f > 0 ? Umax * Math.sin(2 * Math.PI * f * t) : 0;
      pts.push(`${(t / dureeEcran * W).toFixed(1)},${(H / 2 - u / sensV * dy).toFixed(1)}`);
    }
    return (
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', background: '#0b1f17', borderRadius: 8 }}>
          {Array.from({ length: nx + 1 }, (_, k) => <line key={`v${k}`} x1={k * dx} y1="0" x2={k * dx} y2={H} stroke="#1f5f45" strokeWidth={k === nx / 2 ? 1.5 : 0.8}/>)}
          {Array.from({ length: ny + 1 }, (_, k) => <line key={`h${k}`} x1="0" y1={k * dy} x2={W} y2={k * dy} stroke="#1f5f45" strokeWidth={k === ny / 2 ? 1.5 : 0.8}/>)}
          <polyline points={pts.join(' ')} fill="none" stroke="#facc15" strokeWidth="2.2"/>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, fontSize: 13, color: TXT2, marginTop: 6 }}>
          <span>Base de temps : <strong>{fmt(baseT, baseT < 1 ? 1 : 0)} ms/div</strong></span>
          <span>Sensibilité : <strong>{sensV} V/div</strong></span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
          {[0.5, 1, 2, 5, 10, 20].map(b => <button key={b} onClick={() => setBaseT(b)} style={petitBtn(baseT === b, '#334155')}>{fmt(b, b < 1 ? 1 : 0)} ms/div</button>)}
        </div>
      </div>
    );
  })();

  // ════════════════ GRAPHIQUES ════════════════
  const ptsTries = [...points].sort((a, b) => a.U - b.U);
  const graphe = onglet === 'rendement' && cacherEta ? (
    <div style={{ fontSize: 14, color: TXT2, padding: '40px 12px', textAlign: 'center', lineHeight: 1.6 }}>
      Au niveau 2, c'est vous qui calculez le rendement : le graphique s'affichera après la vérification.
    </div>
  ) : onglet === 'oscillo' ? oscillo : onglet === 'vitesses' ? (
    <Graphe xMax={1} yMax={Math.max(30, Math.ceil(vJet / 5) * 5 + 5)} xLabel="" yLabel="Vitesse (m·s⁻¹)"
      barres={[{ label: 'jet vₑ', val: vJet, color: '#2563eb', fort: true },
        { label: 'auget vₐ', val: vAuget, color: '#dc2626', fort: true },
        { label: 'vₑ / 2', val: vJet / 2, color: '#94a3b8', fort: false }]}/>
  ) : (
    <Graphe xMax={Math.max(10, Math.ceil(8.7 * s))} yMax={12} xLabel="Tension U (V)" yLabel="Rendement (%)"
      courbes={[...(montrerRef ? [{ pts: PR_COURBE_REF, color: '#94a3b8', dash: '5 4', label: 'courbe de l’activité' }] : []),
        ...(ptsTries.length > 1 ? [{ pts: ptsTries.map(q => [q.U, q.eta]), color: '#0284c7', label: 'mes mesures' }] : [])]}
      points={[...ptsTries.map(q => ({ x: q.U, y: q.eta, color: '#0284c7', fill: 'white', r: 4.5 })),
        { x: pt.U, y: eta * 100, color: TXT, fill: '#fde047', r: 6.5 }]}/>
  );
  const legende = {
    rendement: <>Point jaune : réglage actuel. Ajoutez des points (menu « Mes points ») pour tracer votre courbe de rendement.</>,
    oscillo: <>La tension produite est alternative : comptez les divisions d'une période pour trouver T, puis f = 1 / T.</>,
    vitesses: <>Comparez la vitesse de l'auget et celle du jet. Que remarquez-vous quand le rendement est maximal ?</>,
  }[onglet];

  // ════════════════ VOLETS ════════════════
  const commandes = (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: TXT2, fontWeight: 700 }}>
          <span>Ouverture du robinet</span><span style={{ color: TXT }}>{ouv} %</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={ouv} onChange={e => setOuv(+e.target.value)}
          style={{ width: '100%', accentColor: '#0284c7' }}/>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: TXT2, fontWeight: 700 }}>
          <span>Charge branchée sur l'alternateur</span><span style={{ color: TXT }}>{nomCharge(R)}</span>
        </div>
        <input type="range" min={0} max={PR_CHARGES.length - 1} step={1} value={kR} onChange={e => setKR(+e.target.value)}
          style={{ width: '100%', accentColor: COUL.elec }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: TXT2 }}>
          <span>court-circuit</span><span>circuit ouvert</span>
        </div>
      </div>
      <button onClick={lancerSeau} disabled={seau.actif || ouv === 0} style={{ ...btn(!seau.actif, '#2563eb'), opacity: seau.actif || ouv === 0 ? 0.6 : 1 }}>
        🪣 Mesurer le débit (seau de 1 L)
      </button>
      <div style={{ fontSize: 12, color: TXT2, marginTop: 5 }}>
        {seau.fini ? <>Seau rempli en <strong>{fmt(seau.fini, 1)} s</strong>.</> : seau.actif ? 'Remplissage en cours…' : 'Le chronomètre s’arrête quand le seau est plein.'}
      </div>
    </>
  );
  const enDefi = mode === 'defi';
  const mesures = (
    <>
      {ligne('Pression dans la conduite', `${fmt(p / 1e5, 2)} bar`, COUL.eau, 'p')}
      {!enDefi && ligne(<>Débit Q<sub>V</sub></>, `${sci(Q)} m³·s⁻¹`, COUL.eau, 'q')}
      {!enDefi && ligne(<>Puissance hydraulique P<sub>hyd</sub> = p × Q<sub>V</sub></>, `${fmt(Phyd, 1)} W`, COUL.eau, 'ph')}
      {ligne('Tension U (efficace)', `${fmt(pt.U, 2)} V`, COUL.elec, 'u')}
      {ligne('Intensité I (efficace)', `${fmt(pt.I, 3)} A`, COUL.elec, 'i')}
      {!enDefi && ligne(<>Puissance électrique P<sub>élec</sub> = U × I</>, `${fmt(Pel, 2)} W`, COUL.elec, 'pe')}
      {!enDefi && ligne(<>Rendement P<sub>élec</sub> / P<sub>hyd</sub></>, `${fmt(eta * 100, 1)} %`, COUL.chaleur, 'eta')}
      {!enDefi && ligne('Fréquence du signal f', `${fmt(f, 1)} Hz`, COUL.meca, 'f')}
      {!enDefi && ligne('Vitesse de rotation n = f / p', `${fmt(pt.n, 1)} tr·s⁻¹`, COUL.meca, 'n')}
      {!enDefi && ligne(<>Vitesse du jet v<sub>e</sub> ; de l'auget v<sub>a</sub></>, `${fmt(vJet, 1)} ; ${fmt(vAuget, 1)} m·s⁻¹`, COUL.meca, 'v')}
    </>
  );
  const mesPoints = (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => setPoints(l => [...l.filter(q => Math.abs(q.U - pt.U) > 0.02), { U: pt.U, I: pt.I, eta: eta * 100 }])}
          disabled={ouv === 0} style={petitBtn(true, '#0284c7')}>➕ Ajouter ce point</button>
        <button onClick={() => setPoints([])} style={petitBtn(false)}>Effacer</button>
        <button onClick={() => setMontrerRef(v => !v)} style={petitBtn(montrerRef, '#94a3b8')}>Courbe de l'activité</button>
      </div>
      {points.length === 0 ? (
        <div style={{ fontSize: 12.5, color: TXT2, lineHeight: 1.5 }}>
          Changez la charge, du court-circuit au circuit ouvert, et ajoutez un point à chaque fois :
          la courbe de rendement se construit dans l'onglet « Rendement ».
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>{(cacherEta ? ['U (V)', 'I (A)'] : ['U (V)', 'I (A)', 'P (W)', 'η (%)']).map(h => (
            <th key={h} style={{ textAlign: 'right', padding: '3px 5px', borderBottom: `1.5px solid ${BORDER}`, color: TXT2 }}>{h}</th>))}</tr></thead>
          <tbody>{ptsTries.map((q, i) => (
            <tr key={i}>{(cacherEta ? [fmt(q.U, 2), fmt(q.I, 3)] : [fmt(q.U, 2), fmt(q.I, 3), fmt(q.U * q.I, 2), fmt(q.eta, 1)]).map((c, j) => (
              <td key={j} style={{ textAlign: 'right', padding: '3px 5px', fontFamily: 'monospace' }}>{c}</td>))}</tr>
          ))}</tbody>
        </table>
      )}
    </>
  );
  const comprendre = (
    <div style={{ fontSize: 13.5, color: TXT, lineHeight: 1.6 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 8, fontSize: 13 }}>
        {[['eau sous pression', COUL.eau], ['→ turbine →', null], ['rotation', COUL.meca], ['→ alternateur →', null], ['électricité', COUL.elec]].map(([t, c], i) => (
          c ? <span key={i} style={{ background: `${c}18`, color: c, border: `1px solid ${c}`, borderRadius: 6, padding: '2px 6px', fontWeight: 700 }}>{t}</span>
            : <span key={i} style={{ color: TXT2, fontWeight: 700 }}>{t}</span>
        ))}
      </div>
      <div>Puissance hydraulique : P<sub>hyd</sub> = p × Q<sub>V</sub> (p en Pa, Q<sub>V</sub> en m³·s⁻¹).</div>
      <div>Puissance électrique : P<sub>élec</sub> = U × I (valeurs efficaces, charge résistive).</div>
      <div>Rendement : η = P<sub>élec</sub> / P<sub>hyd</sub>. Le reste part en chaleur, en frottements et en éclaboussures.</div>
      <div style={{ marginTop: 6 }}>Fréquence : f = n × p, avec p = 4 paires de pôles. Vitesse de l'auget : v<sub>a</sub> = r × ω = r × 2π n.</div>
      <div style={{ marginTop: 6, color: TXT2 }}>
        En circuit ouvert, la roue tourne presque aussi vite que le jet : elle ne freine pas l'eau et ne récupère rien.
        Bloquée (court-circuit), elle ne bouge presque plus. Le meilleur compromis est atteint quand l'auget va environ deux fois
        moins vite que le jet.
      </div>
    </div>
  );

  // ════════════════ DÉFIS ════════════════
  const NIVEAUX = [
    { n: 1, nom: 'Découverte', c: '#16a34a', desc: 'La chaîne énergétique et le fonctionnement, sans calcul.' },
    { n: 2, nom: 'Calculs', c: '#0ea5e9', desc: 'Débit, puissances et rendement à partir de vos mesures.' },
    { n: 3, nom: 'Expert', c: '#dc2626', desc: 'Oscilloscope, vitesse de rotation, vitesses du jet et de l’auget.' },
  ];
  const ENERGIES = ['Énergie cinétique de l’eau', 'Énergie mécanique de rotation', 'Énergie électrique', 'Énergie thermique'];
  const questions = (() => {
    if (niveau === 1) return [
      { id: 'e1', type: 'choix', q: 'Chaîne énergétique : quelle énergie arrive à la turbine par la conduite forcée ?', options: ENERGIES, bonne: 0 },
      { id: 'e2', type: 'choix', q: 'Quelle énergie la turbine transmet-elle à l’alternateur par l’arbre ?', options: ENERGIES, bonne: 1 },
      { id: 'e3', type: 'choix', q: 'Quelle énergie l’alternateur fournit-il à la charge ?', options: ENERGIES, bonne: 2 },
      { id: 'mes', type: 'choix', q: 'Quelles grandeurs faut-il mesurer en sortie de l’alternateur pour connaître la puissance électrique ?',
        options: ['Pression et débit', 'Tension et intensité', 'Fréquence seule'], bonne: 1 },
      { id: 'co', type: 'choix', q: 'Réglez la charge sur « circuit ouvert ». Pourquoi la puissance électrique est-elle nulle ?',
        options: ['I = 0 A donc P = 0 W', 'U = 0 V donc P = 0 W'], bonne: 0 },
      { id: 'cc', type: 'choix', q: 'Réglez la charge sur « court-circuit ». Pourquoi la puissance électrique est-elle nulle ?',
        options: ['I = 0 A donc P = 0 W', 'U = 0 V donc P = 0 W'], bonne: 1 },
      { id: 'umax', type: 'choix', q: 'Faites varier la charge. Pour quelle tension environ le rendement est-il le plus grand ?',
        options: ['vers 1 V', 'vers 5 V', 'vers 8,7 V (circuit ouvert)'], bonne: 1 },
      { id: 'vit', type: 'choix', q: 'Au rendement maximal (onglet « Vitesses »), la vitesse de l’auget vaut environ…',
        options: ['la vitesse du jet', 'la moitié de la vitesse du jet', 'le double de la vitesse du jet'], bonne: 1 },
    ];
    if (!releve) return [];
    const { t, pBar, U, I, f: fr, oq } = releve;
    const Qm = 1e-3 / t, Ph = pBar * 1e5 * Qm, Pe = U * I;
    if (niveau === 2) return [
      { id: 'Q', type: 'num', q: <>Débit Q<sub>V</sub> = V / Δt (le seau de 1 L est rempli en {fmt(t, 1)} s)</>, unite: 'm³·s⁻¹', vrai: Qm, tol: 0.03,
        pieges: [[1 / t, '1 L = 10⁻³ m³ : convertissez le volume en m³.']], aide: 'Vous pouvez écrire 7,1e-5.' },
      { id: 'Ph', type: 'num', q: <>Puissance hydraulique P<sub>hyd</sub> = p × Q<sub>V</sub> (manomètre : {fmt(pBar, 2)} bar)</>, unite: 'W', vrai: Ph, tol: 0.04,
        pieges: [[pBar * Qm, '1 bar = 10⁵ Pa : convertissez la pression en pascals.']] },
      { id: 'Pe', type: 'num', q: <>Puissance électrique P<sub>élec</sub> = U × I (U = {fmt(U, 2)} V ; I = {fmt(I, 3)} A)</>, unite: 'W', vrai: Pe, tol: 0.03 },
      { id: 'eta', type: 'num', q: <>Rendement η = P<sub>élec</sub> / P<sub>hyd</sub></>, unite: '%', vrai: Pe / Ph * 100, tol: 0.05,
        pieges: [[Ph / Pe * 100, 'C’est l’inverse : puissance utile (électrique) sur puissance reçue (hydraulique).'], [Pe / Ph, 'Exprimez le rendement en pourcentage (× 100).']] },
    ];
    const Qm3 = PR_Q_REF * oq / 80, n = fr / PR_P, va = 2 * Math.PI * PR_R_ROUE * n, ve = Qm3 / (Math.PI * PR_R_JET ** 2);
    return [
      { id: 'pp', type: 'num', q: 'À basse vitesse, la turbine fait 10 tours en 4 s et le signal a une période T = 100 ms. Nombre de paires de pôles p = f / n',
        unite: '', vrai: 4, tol: 0, pieges: [[0.25, 'C’est p = f / n, et non n / f.'], [1, 'n = 10 tours / 4 s = 2,5 tr·s⁻¹ et f = 1 / T = 10 Hz.']] },
      { id: 'f', type: 'num', q: <>Sur l'oscilloscope, mesurez la période T puis calculez f = 1 / T</>, unite: 'Hz', vrai: fr, tol: 0.06,
        pieges: [[1 / fr * 1000, 'Vous avez donné T en ms : la fréquence est f = 1 / T, avec T en secondes.'], [fr / 1000, 'T doit être en secondes : 1 ms = 10⁻³ s.']] },
      { id: 'n', type: 'num', q: 'Vitesse de rotation n = f / p', unite: 'tr·s⁻¹', vrai: n, tol: 0.06,
        pieges: [[fr * PR_P, 'C’est n = f / p (et non f × p).']] },
      { id: 'va', type: 'num', q: <>Vitesse de l'auget v<sub>a</sub> = r × 2π n (r = 4,0 cm)</>, unite: 'm·s⁻¹', vrai: va, tol: 0.06,
        pieges: [[va / (2 * Math.PI), 'N’oubliez pas 2π : 1 tr·s⁻¹ = 2π rad·s⁻¹.'], [va * 100, 'r doit être en mètres : 4,0 cm = 0,040 m.']] },
      { id: 've', type: 'num', q: <>Vitesse du jet v<sub>e</sub> = Q<sub>V</sub> / S (jet de 2,0 mm de diamètre ; Q<sub>V</sub> = {sci(Qm3)} m³·s⁻¹)</>, unite: 'm·s⁻¹', vrai: ve, tol: 0.05,
        pieges: [[ve / 4, 'S = π r² avec r = 1,0 mm (le rayon, pas le diamètre).'], [ve * 1e-6, 'Le rayon doit être en mètres : 1,0 mm = 1,0 × 10⁻³ m.']] },
      { id: 'rap', type: 'num', q: <>Rapport v<sub>a</sub> / v<sub>e</sub></>, unite: '', vrai: va / ve, tol: 0.08 },
    ];
  })();

  const juste = q => {
    const r = reps[q.id];
    if (q.type === 'choix') return r === q.bonne;
    const x = lireNombre(r);
    return isFinite(x) && (q.tol === 0 ? Math.round(x) === q.vrai : proche(x, q.vrai, q.tol));
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
  function demarrer(nv) { setNiveau(nv); setReps({}); setVerifie(false); setReleve(null); }
  const releveOk = !!seau.fini && ouv > 0 && R !== Infinity && R !== 0;
  function relever() {
    const r2 = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
    setReleve({ t: r2(seau.fini, 1), pBar: r2(p / 1e5, 2), U: r2(pt.U, 2), I: r2(pt.I, 3), f, oq: ouv, R });
    setReps({}); setVerifie(false);
  }

  const panneauReleve = niveau >= 2 && (
    <div style={{ ...box, background: 'white', marginBottom: 10 }}>
      <div style={{ fontSize: 13.5, color: TXT, lineHeight: 1.55, marginBottom: 6 }}>
        <strong>Votre manip :</strong> choisissez l'ouverture du robinet, mesurez le débit au seau, puis réglez une charge
        {niveau === 3 ? ' qui donne le rendement maximal (tracez votre courbe !)' : ''}. Relevez alors vos mesures.
        <strong> Ne touchez plus au robinet ensuite.</strong>
      </div>
      <button onClick={relever} disabled={!releveOk} style={{ ...btn(releveOk, '#0ea5e9'), opacity: releveOk ? 1 : 0.5 }}>📋 Relever mes mesures</button>
      {!releveOk && <div style={{ fontSize: 12, color: TXT2, marginTop: 5 }}>
        Il faut avoir mesuré le débit au seau, et une charge qui n'est ni un court-circuit ni un circuit ouvert.
      </div>}
      {releve && (releve.oq !== ouv) && <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 5 }}>
        Attention : l'ouverture du robinet a changé depuis votre relevé ({releve.oq} %).
      </div>}
      {releve && <div style={{ fontSize: 13, marginTop: 6, fontFamily: 'monospace', lineHeight: 1.6 }}>
        seau : {fmt(releve.t, 1)} s ; p = {fmt(releve.pBar, 2)} bar<br/>U = {fmt(releve.U, 2)} V ; I = {fmt(releve.I, 3)} A ; charge {nomCharge(releve.R)}
      </div>}
    </div>
  );

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
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${k + 1}`}
                  onChange={e => { const v = e.target.value; setReps(pr => ({ ...pr, [q.id]: v })); setVerifie(false); }} style={{ ...inp, width: 120 }}/>
                <span style={{ fontSize: 13, color: TXT2 }}>{q.unite}</span>
                {verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
            )}
            {verifie && q.type === 'choix' && <span style={{ fontSize: 13 }}>{ok ? ' ✅' : ' ❌'}</span>}
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
      {niveau === 3 && releve && <div style={{ fontSize: 12.5, color: TXT2 }}>
        Rappels : 1 tr·s⁻¹ = 2π rad·s⁻¹ ; aire d'un disque S = π r².
      </div>}
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
  const onglets = [['rendement', 'Rendement'], ['oscillo', 'Oscilloscope'], ['vitesses', 'Vitesses']];
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pr-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pr-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        .pr-l2-defi { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(280px, 1fr) minmax(0, 2fr); }
        @media (max-width: 900px) { .pr-l1, .pr-l2-defi { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: TXT }}>Production 1 · Conduite forcée, turbine Pelton et alternateur</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('explore')} style={btn(mode === 'explore', '#334155')}>🔍 Exploration</button>
          <button onClick={() => setMode('defi')} style={btn(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>

      <div className="pr-l1">
        <div style={box}>
          <div style={titreBox}>La maquette : de l'eau à l'électricité</div>
          {schema}
          <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>
            L'eau sous pression sort en jet et fait tourner la roue ; l'arbre entraîne l'alternateur, qui alimente la charge.
            L'animation de la roue est très ralentie : en vrai, elle fait plusieurs dizaines de tours par seconde.
          </div>
        </div>
        <div style={box}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {onglets.map(([k, l]) => <button key={k} onClick={() => setOnglet(k)} style={petitBtn(onglet === k, '#334155')}>{l}</button>)}
          </div>
          {graphe}
          <div style={{ fontSize: 13, color: TXT2, marginTop: 6, lineHeight: 1.5 }}>{legende}</div>
        </div>
      </div>

      {mode === 'explore' ? (
        <div className="pr-l2">
          {section('commandes', 'Commandes', commandes)}
          {section('mesures', 'Mesures', mesures)}
          {section('points', 'Mes points', mesPoints)}
          {section('comprendre', 'Comprendre', comprendre)}
        </div>
      ) : (
        <div className="pr-l2-defi">
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
