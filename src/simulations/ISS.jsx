import { useState, useEffect, useRef } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, lireNombre, avecIndices } from "../commun";
import { fr, R_KM, gAlt, G0, vOrb, periode, typeOrbite, depart, pas, trajectoire } from "./issModele";

// ====================================================
//  SIM 67 — L'ISS EN CHUTE LIBRE (2GT, « Mouvement et interactions »)
//  Atelier 1 : « canon de Newton » à l'altitude de l'ISS : vitesse de lancement → chute, orbite circulaire, ellipse (Terre à l'échelle).
//  Atelier 2 : cabine (au sol, en chute libre, en orbite) : balle lâchée ou lancée, balance, forces. La station et ce qu'elle contient tombent ensemble.
//  Hypothèses : voir la liste affichée dans la simulation.
// ====================================================

const SIM = 67;
declarerDefis(SIM, [
  ['poids', 'Le poids à l’altitude de la station'],
  ['cabine', 'Prévoir : la balle flotte-t-elle ?'],
  ['orbite', 'Régler la vitesse de l’orbite'],
]);
const TITRES = { poids: 'Poids en altitude', cabine: 'La balle flotte-t-elle ?', orbite: 'Régler l’orbite' };
const VERT = '#15803d', ORANGE = '#b45309', C_P = '#c2410c', C_V = '#0072b2';
const alea = l => l[Math.floor(Math.random() * l.length)];
const km = x => `${fr(x, 2)} km/s`;

// ---------- atelier orbite ----------
function Orbite({ h, v, etat, trace, etatAff }) {
  const r0 = R_KM + h, s = 190 / (1.55 * r0), CX = 350, CY = 200, X = x => CX + x * s, Y = y => CY - y * s;
  const pred = trajectoire(h, v, periode(h) * 1.15, 12).pts;
  const cur = etat || depart(h, v), gx = -cur.x, gy = -cur.y, gl = Math.hypot(gx, gy);
  const vl = Math.hypot(cur.vx, cur.vy), ech = 34 / vOrb(h);
  const ang = Math.atan2(-cur.y, cur.x) * 180 / Math.PI;      // rotation de l'icône (dans le repère écran)
  const arrow = (x, y, dx, dy, c, label, off = [8, -6]) => { const l = Math.hypot(dx, dy); if (l < 3) return null; const ux = dx / l, uy = dy / l;
    return <g><line x1={x} y1={y} x2={x + dx} y2={y + dy} stroke={c} strokeWidth="3.5"/><polygon points={`${x + dx},${y + dy} ${x + dx - ux * 10 - uy * 5},${y + dy - uy * 10 + ux * 5} ${x + dx - ux * 10 + uy * 5},${y + dy - uy * 10 - ux * 5}`} fill={c}/>
      <text x={x + dx + off[0]} y={y + dy + off[1]} fontSize="12.5" fontWeight="800" fill={c} stroke="#fff" strokeWidth="3" paintOrder="stroke">{label}</text></g>; };
  return (
    <svg viewBox="0 0 700 390" width="100%" role="img" aria-label="La Terre vue de loin, avec la trajectoire de la station spatiale" style={{ display: 'block', background: '#0b1630', borderRadius: 10 }}>
      <circle cx={CX} cy={CY} r={R_KM * s} fill="#2563eb"/><circle cx={CX} cy={CY} r={R_KM * s} fill="none" stroke="#93c5fd" strokeWidth="2"/>
      <path d={`M ${CX - 40} ${CY - 30} q 30 -40 70 -10 q 20 20 -10 40 q -50 10 -60 -30 Z`} fill="#16a34a" opacity="0.8"/><path d={`M ${CX + 30} ${CY + 50} q 40 -10 50 20 q -10 30 -50 10 Z`} fill="#16a34a" opacity="0.8"/>
      <text x={CX} y={CY + 8} textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">Terre</text>
      <polyline points={pred.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} fill="none" stroke="#fde68a" strokeWidth="1.8" strokeDasharray="5 5" opacity="0.8"/>
      {trace && trace.length > 1 && <polyline points={trace.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} fill="none" stroke="#fef08a" strokeWidth="3"/>}
      {etatAff === 'impact' && <g><circle cx={X(cur.x)} cy={Y(cur.y)} r="9" fill="#ef4444"/><text x={X(cur.x) + 12} y={Y(cur.y) - 8} fontSize="14" fontWeight="800" fill="#fecaca">Impact sur la Terre !</text></g>}
      {etatAff !== 'impact' && <g transform={`translate(${X(cur.x)} ${Y(cur.y)}) rotate(${-ang + 90}) scale(1.8)`}>
        <rect x="-5" y="-4" width="10" height="8" fill="#e2e8f0" stroke="#fff" strokeWidth="1"/><rect x="-22" y="-2" width="14" height="4" fill="#fbbf24"/><rect x="8" y="-2" width="14" height="4" fill="#fbbf24"/><circle cx="0" cy="0" r="2.2" fill="#ef4444"/></g>}
      {etatAff !== 'impact' && <g>{arrow(X(cur.x), Y(cur.y), gx / gl * 36, -(gy / gl) * 36, '#fca5a5', `g = ${fr(gAlt(h), 1)} N/kg`, [-4, 22])}
        {arrow(X(cur.x), Y(cur.y), cur.vx / (vl || 1) * Math.min(60, vl * ech), -cur.vy / (vl || 1) * Math.min(60, vl * ech), '#7dd3fc', `v = ${fr(vl, 2)} km/s`, [6, -8])}</g>}
      <text x="12" y="22" fontSize="13" fontWeight="700" fill="#e2e8f0">Altitude : {fr(h, 0)} km · Terre à l’échelle, station dessinée trop grande</text>
      <text x="12" y="40" fontSize="12.5" fill="#cbd5e1">Rouge : force de la Terre par kg (même chose pour la station et son contenu) · bleu : vitesse</text>
      <text x="688" y="378" textAnchor="end" fontSize="12" fill="#94a3b8">pointillés : trajectoire prévue · trait jaune : trajet parcouru</text>
    </svg>);
}

// ---------- atelier cabine : une cabine qui tombe, avec une personne et une balle ----------
// Vue depuis le sol : la cabine descend le long d'une règle graduée en mètres ; vue depuis la cabine : la cabine est immobile, c'est le sol qui monte.
const HAUT_M = 110, PXM = 2, TFALL = Math.sqrt(2 * HAUT_M / 9.8), G_C = 9.8, W_C = 150, H_C = 104, ECH = 0.8;
function etatCabine(c, t) {
  const tt = Math.min(t, TFALL), alt = c.tombe ? Math.max(0, HAUT_M - 0.5 * G_C * tt * tt) : HAUT_M;     // altitude du plancher de la cabine (m)
  const rel = c.tombe ? 0 : 0.5 * G_C * t * t;                                                          // chute de la balle par rapport à la cabine (m)
  let bx = 1.5 + (c.lance ? 0.8 * t : 0), by = 1.2 - rel;                                                // position de la balle dans la cabine (m)
  if (by < 0.1) by = 0.1; if (bx > 3.9) bx = 3.9;
  return { alt, bx, by, v: c.tombe ? G_C * tt : 0, fini: c.tombe && t >= TFALL };
}
function Cabine({ c, t, vueCabine }) {
  const e = etatCabine(c, t), PXC = 36;                          // px par mètre dans la cabine
  const CX = 350, SOL = 335, haut = h => SOL - h * PXM;           // ordonnée écran de l'altitude h (vue sol)
  const bas = vueCabine ? 215 : haut(e.alt), fond = vueCabine ? bas + e.alt * PXM : SOL;   // ordonnée du plancher de la cabine / du sol
  const tombe = c.tombe, flotte = tombe;
  const fleche = (x, y, dy, col, label, gauche) => <g><line x1={x} y1={y} x2={x} y2={y + dy} stroke={col} strokeWidth="4"/>
    <polygon points={`${x},${y + dy} ${x - 5},${y + dy - Math.sign(dy) * 9} ${x + 5},${y + dy - Math.sign(dy) * 9}`} fill={col}/>
    <text x={x + (gauche ? -6 : 6)} y={y + dy / 2 + 4} textAnchor={gauche ? 'end' : 'start'} fontSize="19" fontWeight="800" fill={col} stroke="#fff" strokeWidth="3" paintOrder="stroke">{label}</text></g>;
  const cab = (dy, op, plein, key) => {
    const x0 = CX - W_C / 2, y1 = dy;
    const bxs = x0 + (1.5 + (c.lance ? 0.8 * key : 0)) * PXC, bys = y1 - Math.max(0.1, 1.2 - (tombe ? 0 : 0.5 * G_C * key * key)) * PXC;
    const ax = x0 + 0.9 * PXC, ay = y1 - (flotte ? 22 : 2);
    return <g key={key} opacity={op} transform={`translate(${CX} ${y1}) scale(${ECH}) translate(${-CX} ${-y1})`}>
      <rect x={x0} y={y1 - H_C} width={W_C} height={H_C} fill={plein ? '#f1f5f9' : 'none'} stroke="#0f172a" strokeWidth={plein ? 4 : 2} rx="5"/>
      <g stroke="#0f172a" strokeWidth={plein ? 4.5 : 3} strokeLinecap="round" fill="none">
        <circle cx={ax} cy={ay - 62} r="9" fill="#fde68a" strokeWidth="3"/><line x1={ax} y1={ay - 53} x2={ax} y2={ay - 26}/>
        {flotte ? <><line x1={ax} y1={ay - 46} x2={ax - 17} y2={ay - 32}/><line x1={ax} y1={ay - 46} x2={ax + 17} y2={ay - 32}/><line x1={ax} y1={ay - 26} x2={ax - 11} y2={ay - 4}/><line x1={ax} y1={ay - 26} x2={ax + 11} y2={ay - 4}/></>
          : <><line x1={ax} y1={ay - 46} x2={ax - 13} y2={ay - 30}/><line x1={ax} y1={ay - 46} x2={ax + 13} y2={ay - 30}/><line x1={ax} y1={ay - 26} x2={ax - 8} y2={ay - 2}/><line x1={ax} y1={ay - 26} x2={ax + 8} y2={ay - 2}/></>}</g>
      <circle cx={bxs} cy={bys} r="6.5" fill="#dc2626" stroke="#0f172a" strokeWidth={plein ? 2 : 1.2}/>
      {plein && <>{fleche(ax - 22, ay - 36, 24, C_P, 'P', true)}{fleche(bxs + 12, bys - 2, 22, C_P, 'P', false)}{!tombe && fleche(ax + 22, ay - 2, -24, C_V, 'sol', false)}</>}
    </g>;
  };
  // images successives (chronophotographie) toutes les 0,5 s, vue depuis le sol seulement
  const images = []; if (!vueCabine && tombe) for (let k = 0.5; k < Math.min(t, TFALL); k += 0.5) images.push(cab(haut(HAUT_M - 0.5 * G_C * k * k), 0.28, false, k));
  const yc = vueCabine ? bas : haut(e.alt);
  const reps = []; for (let m = 0; m <= HAUT_M; m += 10) reps.push(m);
  return (
    <svg viewBox="0 0 700 350" width="100%" role="img" aria-label="Une cabine tombe avec une personne et une balle à l’intérieur" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <rect x="0" y="0" width="700" height="350" fill="#eff6ff"/>
      <rect x="0" y={Math.min(fond, 350)} width="700" height={Math.max(0, 350 - fond)} fill="#a16207" opacity="0.55"/><line x1="0" y1={fond} x2="700" y2={fond} stroke="#422006" strokeWidth="4"/>
      <text x="600" y={Math.min(fond + 18, 346)} fontSize="13" fontWeight="800" fill="#422006">sol</text>
      {reps.map(m => { const y = vueCabine ? fond - m * PXM : haut(m); return y > 8 && y < 342 ? <g key={m}><line x1="30" y1={y} x2="50" y2={y} stroke="#475569" strokeWidth="2"/><text x="54" y={y + 4} fontSize="11.5" fill="#475569">{m} m</text></g> : null; })}
      <line x1="30" y1={Math.max(8, vueCabine ? fond - HAUT_M * PXM : haut(HAUT_M))} x2="30" y2={fond} stroke="#475569" strokeWidth="2"/>
      {images}
      <g>{cab(yc, 1, true, t)}</g>
      <text x={CX} y="22" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#0f172a">{vueCabine ? 'Vue depuis la cabine (la cabine est immobile : c’est le sol qui monte)' : 'Vue depuis le sol (la cabine est en mouvement)'}</text>
      <text x="690" y="44" textAnchor="end" fontSize="13" fontWeight="700" fill={tombe ? C_V : '#334155'}>{tombe ? `cabine en chute libre · vitesse : ${fr(e.v, 1)} m/s (${fr(e.v * 3.6, 0)} km/h)` : 'cabine immobile (câble tenu)'}</text>
      {e.fini && <text x={CX} y="68" textAnchor="middle" fontSize="13" fontWeight="800" fill={ORANGE}>La cabine arrive au sol.</text>}
    </svg>);
}

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'poids') return { ...base, m: alea([60, 65, 70, 75, 80, 90]), h: alea([200, 400, 800, 1200, 1500]) };
  if (type === 'cabine') { const c = alea(['sol', 'chute', 'iss', 'montee']); return { ...base, c, rep: c === 'chute' || c === 'iss' ? 'flotte' : 'tombe' }; }
  return { ...base, h: alea([300, 400, 600, 900, 1200]) };
}
const TXT_CTX = { sol: 'dans une cabine posée sur le sol', chute: 'dans une cabine en chute libre (câbles coupés, sans frottement)', iss: 'dans la Station spatiale en orbite', montee: 'dans un ascenseur qui monte à vitesse constante' };
function evaluer(d, v) {
  if (d.type === 'poids') { const vrai = d.m * gAlt(d.h), x = lireNombre(d.reps.v), ok = isFinite(x) && Math.abs(x - vrai) <= 0.02 * vrai; return { ok, lignes: [[ok, ok ? 'Poids correct.' : 'Lis g à cette altitude dans la simulation puis calcule P = m × g (en newtons).']] }; }
  if (d.type === 'cabine') { const ok = d.reps.d === d.rep; return { ok, lignes: [[ok, ok ? 'Bonne réponse.' : 'Regarde si la cabine tombe en même temps que la balle : si oui, la balle ne bouge pas par rapport à la cabine.']] }; }
  const ok = Math.abs(v - vOrb(d.h)) <= 0.12; return { ok, lignes: [[ok, ok ? 'Orbite circulaire : la station reste à la même altitude.' : v < vOrb(d.h) ? 'Trop lent : la station finit par se rapprocher de la Terre.' : 'Trop rapide : la station s’éloigne de la Terre (l’orbite est une ellipse).']] };
}
function VoletDefi({ defi, setDefi, changerType, v }) {
  const res = defi.verifie ? evaluer(defi, v) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, val) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: val }, verifie: false }));
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'poids' && <><div style={txt}>🎯 Un astronaute de <strong>{defi.m} kg</strong> est à l’altitude de <strong>{defi.h} km</strong>. Lisez la valeur de <strong>g</strong> à cette altitude dans la simulation, puis calculez son <strong>poids</strong> (la force exercée par la Terre).</div>
        <label style={{ fontSize: 14, fontWeight: 600 }}>P = <input value={defi.reps.v || ''} onChange={e => rep('v', e.target.value)} inputMode="decimal" aria-label="Votre réponse" style={{ width: 90, padding: '5px 8px', fontSize: 15, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/> N</label></>}
      {defi.type === 'cabine' && <><div style={txt}>🎯 On lâche une balle, sans lui donner de vitesse, <strong>{TXT_CTX[defi.c]}</strong>. Par rapport à la cabine, la balle…</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[['tombe', 'tombe vers le plancher'], ['flotte', 'reste là où on l’a lâchée'], ['monte', 'monte vers le plafond']].map(([k, l]) => <button key={k} onClick={() => rep('d', k)} style={stylePetitBouton(defi.reps.d === k, '#0ea5e9')}>{l}</button>)}</div></>}
      {defi.type === 'orbite' && <div style={txt}>🎯 La station est lancée <strong>horizontalement</strong> à l’altitude de <strong>{defi.h} km</strong>. Réglez sa <strong>vitesse</strong> (curseur) pour qu’elle reste à <strong>altitude constante</strong> : orbite circulaire. Puis cliquez sur « Vérifier ».</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? VERT : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {avecIndices(t)}</div>)}
        {res.ok && <div style={{ color: VERT, fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'poids' && <>g({defi.h} km) ≈ {fr(gAlt(defi.h), 2)} N/kg, donc P = m × g = {defi.m} × {fr(gAlt(defi.h), 2)} = <strong>{fr(defi.m * gAlt(defi.h), 0)} N</strong>.</>}
        {defi.type === 'cabine' && (defi.rep === 'flotte' ? <>Cabine et balle <strong>tombent ensemble</strong> : la balle reste là où on l’a lâchée.</> : <>La cabine ne tombe pas : la balle <strong>tombe</strong> vers le plancher.</>)}
        {defi.type === 'orbite' && <>Vitesse de l’orbite circulaire à {defi.h} km : <strong>{km(vOrb(defi.h))}</strong> (à 0,12 km/s près).</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationISS() {
  const [mode, setMode] = useState(() => modeOuverture('iss-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('iss-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('orbite');
  const [h, setH] = useState(400);
  const [v, setV] = useState(7.7);
    const [fait, setFait] = useState({ sol: false, chute: false, lance: false, vue: false, orbite: false });
  const [hypoOuv, setHypoOuv] = useState(false);
  const [, setTick] = useState(0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const marque = k => setFait(f => (f[k] ? f : { ...f, [k]: true }));

  // ----- orbite animée (temps accéléré : une orbite en environ 14 s) -----
  const orb = useRef({ etat: null, trace: [], enCours: false });
  const arreter = () => { orb.current = { etat: null, trace: [], enCours: false }; setTick(t => t + 1); };
  const lancer = () => { const s = depart(h, v); orb.current = { etat: s, trace: [[s.x, s.y]], enCours: true }; setTick(t => t + 1); };
  useEffect(() => {
    let raf, dernier = performance.now(); const k = periode(h) / 14;
    const boucle = t => {
      const o = orb.current;
      if (o.enCours && o.etat) {
        let dt = Math.min(0.05, (t - dernier) / 1000) * k, s = o.etat; const n = Math.max(1, Math.ceil(dt / 6));
        for (let i = 0; i < n; i++) s = pas(s, dt / n);
        o.etat = s; if (o.trace.length === 0 || Math.hypot(o.trace[o.trace.length - 1][0] - s.x, o.trace[o.trace.length - 1][1] - s.y) > 40) o.trace.push([s.x, s.y]);
        if (s.fini) { o.enCours = false; o.trace.push([s.x, s.y]); }
        if (s.t >= periode(h) * 1.02 && typeOrbite(h, v).type === 'circulaire') o.enCours = false;
        else if (s.t >= periode(h) * 1.6) o.enCours = false;
        setTick(x => x + 1);
      }
      dernier = t; raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [h, v]);
  const oc = orb.current, tyo = typeOrbite(h, v);
  useEffect(() => { if (oc.etat && oc.enCours === false && oc.etat.t > periode(h) * 0.5 && tyo.type === 'circulaire') marque('orbite'); }, [oc.enCours]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----- cabine : une cabine qui tombe -----
  const [cab, setCab] = useState({ tombe: true, lance: false, t: 0, enCours: false });
  const [vueCabine, setVueCabine] = useState(false);
  const cabRef = useRef(cab); cabRef.current = cab;
  const remettre = () => setCab(c => ({ ...c, t: 0, enCours: false }));
  const experience = () => { setCab(c => ({ ...c, t: 0, enCours: true })); marque(cab.tombe ? (cab.lance ? 'lance' : 'chute') : 'sol'); if (cab.tombe && cab.lance) marque('chute'); };
  useEffect(() => {
    let raf, dernier = performance.now();
    const boucle = t => {
      const c = cabRef.current, dt = Math.min(0.05, (t - dernier) / 1000); dernier = t;
      if (c.enCours) { const fin = c.tombe ? TFALL : 1.2, nt = Math.min(fin, c.t + dt); setCab({ ...c, t: nt, enCours: nt < fin }); }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, []);
  const choisirTombe = tb => setCab({ tombe: tb, lance: cab.lance, t: 0, enCours: false });
  const voirO = (hh = 400, vv = 7.7) => { setAtelier('orbite'); setH(hh); setV(vv); arreter(); };
  const voirC = (tombe, lance = false) => { setAtelier('cabine'); setCab({ tombe, lance, t: 0, enCours: false }); };
  const ETAPES = [
    { id: 'question', titre: 'Pourquoi les astronautes flottent-ils ?', depart: () => voirO(400, 7.7),
      texte: <>À bord de la Station spatiale internationale (<strong>ISS</strong>), à <strong>400 km</strong> d’altitude, les astronautes <strong>flottent</strong>. On dit qu’ils sont en <strong>apesanteur</strong>. Beaucoup pensent qu’à cette altitude « il n’y a plus de gravité ». Vérifions !</>,
      tache: { type: 'qcm', q: 'À ton avis, pourquoi les astronautes flottent-ils dans la station ?', options: ['La station et eux tombent ensemble autour de la Terre', 'Il n’y a plus de gravité à 400 km d’altitude', 'Il n’y a pas d’air dans l’espace', 'La station tourne si vite qu’ils sont plaqués au plafond'], bonne: 0, expl: 'Ils flottent parce que la station et les astronautes sont en chute libre ensemble. La gravité est toujours là (près de 90 % de celle du sol) : c’est elle qui les fait tourner autour de la Terre.' } },
    { id: 'gravite', titre: 'Y a-t-il encore de la gravité à 400 km ?', depart: () => voirO(400, 7.7),
      texte: <>Regardez la flèche rouge : à 400 km, la Terre attire <strong>chaque kilogramme</strong> avec une force de <strong>8,7 N</strong> (g = 8,7 N/kg). Au sol, c’est 9,8 N/kg. La Terre est grande : monter de 400 km, c’est peu par rapport à son rayon de 6 378 km.
        <ExempleResolu>Un objet de <strong>10 kg</strong> : au sol P = 10 × 9,8 = 98 N ; à 400 km P = 10 × 8,7 = <strong>87 N</strong>. Presque pareil !</ExempleResolu></>,
      tache: { type: 'num', q: 'Quel est le poids d’un astronaute de 70 kg à 400 km d’altitude ? (P = m × g)', unite: 'N', vrai: 608, tol: 0.02, affiche: x => String(x), pieges: [[686, 'C’est son poids au sol (70 × 9,8). À 400 km, g vaut 8,7 N/kg.'], [0, 'Le poids n’est pas nul : la Terre attire toujours l’astronaute.']], expl: 'P = 70 × 8,7 ≈ 608 N : environ 89 % de son poids au sol. Il n’a pas du tout « perdu » son poids.' } },
    { id: 'sol', titre: 'Une cabine immobile', depart: () => voirC(false),
      texte: <>Voici une <strong>cabine</strong> suspendue à un câble, avec une <strong>personne</strong> et une <strong>balle</strong> à l’intérieur. Le câble tient : la cabine est <strong>immobile</strong>. Cliquez sur « Lancer l’expérience » : on lâche la balle. Elle <strong>tombe</strong> vers le plancher (poids <strong>P</strong>). La personne, elle, est soutenue par le plancher (flèche bleue).</>,
      tache: { type: 'action', ok: enGuide && fait.sol, consigne: 'Lancez l’expérience avec le câble tenu.' } },
    { id: 'chute', titre: 'On coupe le câble !', depart: () => voirC(true),
      texte: <>Maintenant, <strong>le câble est coupé</strong> : la cabine tombe, avec la personne et la balle <strong>qui tombent aussi</strong>. Cliquez sur « Lancer l’expérience ». Regardez les images successives (toutes les 0,5 s) : la cabine, la personne et la balle <strong>descendent ensemble</strong>, de plus en plus vite.
        <ExempleResolu>La Terre attire tout pareil : cabine, personne et balle subissent <strong>la même chute</strong>. Par rapport à la cabine, la balle <strong>ne bouge pas</strong> : elle <strong>flotte</strong>, et la personne aussi !</ExempleResolu></>,
      tache: { type: 'action', ok: enGuide && fait.chute && cab.tombe, consigne: 'Lancez l’expérience avec le câble coupé.' } },
    { id: 'ref', titre: 'Se mettre dans la cabine', depart: () => voirC(true),
      texte: <>Cochez <strong>« vue depuis la cabine »</strong> : on se place dans le <strong>référentiel de la cabine</strong>. La cabine devient immobile sur l’écran, et c’est le <strong>sol qui monte</strong> vers elle. Relancez l’expérience : la personne et la balle <strong>ne bougent pas</strong>, comme s’il n’y avait plus de gravité. C’est ce que ressentent les astronautes.</>,
      tache: { type: 'action', ok: enGuide && fait.vue, consigne: 'Cochez « vue depuis la cabine ».' } },
    { id: 'balance', titre: 'La force de la Terre existe toujours', depart: () => voirC(true),
      texte: <>Regardez les flèches <strong>P</strong> (poids) : elles sont toujours là, sur la personne comme sur la balle. La Terre attire toujours. Mais le plancher de la cabine <strong>tombe aussi</strong> : il ne pousse plus la personne vers le haut (plus de flèche bleue). Elle ne sent plus son poids.</>,
      tache: { type: 'qcm', q: 'Dans la cabine qui tombe, la personne a-t-elle encore un poids ?', options: ['Oui : la Terre l’attire toujours, mais rien ne la soutient', 'Non : il n’y a plus d’attraction', 'Oui, mais la cabine le supprime', 'Non, la cabine est trop petite'], bonne: 0, expl: 'La force de la Terre (le poids) existe toujours. Ce qui disparaît, c’est la sensation de poids : personne ne pousse l’astronaute, le sol de la cabine tombe avec lui.' } },
    { id: 'lancer', titre: 'Lançons la balle !', depart: () => voirC(true, true),
      texte: <>On <strong>lance</strong> maintenant la balle vers la droite, la cabine étant en chute libre. Vue depuis le <strong>sol</strong>, elle décrit une <strong>courbe</strong> (elle tombe en avançant). Cochez « vue depuis la cabine » : elle part <strong>tout droit</strong>, à <strong>vitesse constante</strong>. Tout se passe <strong>comme si aucune force ne s’exerçait</strong> sur elle : c’est le <strong>principe d’inertie</strong>.</>,
      tache: { type: 'action', ok: enGuide && fait.lance, consigne: 'Lancez la balle (« lancée vers la droite ») avec le câble coupé.' } },
    { id: 'orbite', titre: 'Une chute… sans fin', depart: () => voirO(400, 3),
      texte: <>Comment la station peut-elle « tomber » sans jamais toucher la Terre ? Imaginez un canon qui tire <strong>horizontalement</strong> (idée de Newton). Plus la vitesse est grande, plus l’objet va loin avant de toucher le sol. Avec <strong>assez de vitesse</strong>, la Terre étant ronde, le sol « se dérobe » sous lui : il tombe… sans jamais arriver !
        <ExempleResolu>À <strong>400 km</strong>, la vitesse qu’il faut est d’environ <strong>7,7 km/s</strong> : près de 28 000 km/h. Réglez le curseur « vitesse » sur 7,7 km/s puis cliquez sur « Lancer ».</ExempleResolu></>,
      tache: { type: 'action', ok: enGuide && fait.orbite, consigne: 'Réglez la vitesse à 7,7 km/s (±0,1) puis lancez, et attendez un tour complet.' } },
    { id: 'pourquoi', titre: 'Pourquoi ne tombe-t-elle pas sur la Terre ?', depart: null,
      texte: <>Essayez aussi une vitesse plus faible (5 km/s) : la station <strong>retombe</strong> sur la Terre. Et plus grande (8 km/s) : l’orbite devient plus allongée.</>,
      tache: { type: 'qcm', q: 'Pourquoi la station ne tombe-t-elle pas sur la Terre ?', options: ['Elle tombe en permanence, mais elle avance assez vite pour que la Terre se dérobe', 'La Terre ne l’attire plus à cette altitude', 'Elle est repoussée par l’espace', 'Elle est trop légère'], bonne: 0, expl: 'La station subit toujours l’attraction de la Terre. Sa vitesse horizontale est telle qu’elle « manque » la Terre : elle tombe en tournant.' } },
    { id: 'marteau', titre: 'Même chute pour tout le monde', depart: () => voirO(400, 7.7),
      texte: <>La flèche rouge (force par kilogramme) est <strong>la même</strong> pour la station et pour tout ce qu’elle contient : l’astronaute, un marteau, une balle… Tous ont la <strong>même chute</strong> : ils suivent la <strong>même trajectoire</strong> autour de la Terre.</>,
      tache: { type: 'qcm', q: 'Un astronaute lâche son marteau dans la station. Pourquoi reste-t-il à côté de lui ?', options: ['Marteau, astronaute et station tombent de la même façon autour de la Terre', 'Le marteau n’est plus attiré par la Terre', 'Le marteau est plus léger que l’air', 'Le marteau est attiré par l’astronaute'], bonne: 0, expl: 'Tout ce qui est dans la station subit la même attraction par kilogramme, donc tombe pareil : il n’y a aucun mouvement relatif.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>À 400 km, la gravité est encore à <strong>environ 90 %</strong> de celle du sol (g = 8,7 N/kg).</li>
        <li>L’ISS est en <strong>chute libre</strong> autour de la Terre : elle tombe sans cesse, mais sa vitesse (≈ 7,7 km/s) fait qu’elle ne touche jamais la Terre.</li>
        <li>Astronautes et objets tombent <strong>avec</strong> la station : l’<strong>apesanteur</strong> n’est pas l’absence de gravité mais l’absence de support.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancerDefi(type) {
    const d = nouveauDefi(type); setDefi(d); arreter();
    if (type === 'poids') { setAtelier('orbite'); setH(d.h); setV(+vOrb(d.h).toFixed(2)); }
    if (type === 'orbite') { setAtelier('orbite'); setH(d.h); setV(3); }
    if (type === 'cabine') { setAtelier('cabine'); setCab({ tombe: false, lance: false, t: 0, enCours: false }); setVueCabine(false); }
  }
  function changerMode(md) { setMode(md); if (md === 'defi') lancerDefi(defi ? defi.type : 'poids'); else if (md === 'explore') { setAtelier('orbite'); } }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Terre sphérique et homogène</strong>, seule la Terre attire (Lune, Soleil négligés), <strong>sans atmosphère</strong> : pas de frottement. L’ISS réelle, à 400 km, en subit un petit : on la « remonte » régulièrement.</li>
      <li><strong>Force de gravitation</strong> de la Terre : g = G·M / (R + h)² avec G = 6,67×10⁻¹¹ N·m²·kg⁻², M = 5,98×10²⁴ kg, R = 6 378 km. La <strong>Terre est dessinée à l’échelle</strong> ; la <strong>station est volontairement dessinée trop grande</strong>.</li>
      <li><strong>Lancement horizontal</strong>, trajectoire dans un <strong>plan</strong>. Le temps est <strong>accéléré</strong> (une orbite en environ 14 s au lieu de 92 min). La vitesse maximale proposée est inférieure à la vitesse de libération.</li>
      <li><strong>Cabine</strong> : on la suppose rigide, de petite taille devant la Terre ; elle tombe de 110 m (hauteur d’une grande tour de chute) en 4,7 s, <strong>sans frottement</strong>, et son dessin est volontairement très agrandi. Les images successives sont prises toutes les 0,5 s. Les très petites différences de gravité entre le haut et le bas de la station (effets de marée) sont <strong>négligées</strong> : l’apesanteur est parfaite dans le modèle (dans la réalité, on parle de microgravité).</li>
      <li><strong>Balle et personne</strong> : câble tenu, la balle s’arrête sur le plancher ; la balle lancée va à 0,8 m/s. La personne est rigide et ne bouge pas.</li>
      <li><strong>Vocabulaire</strong> : le <strong>poids</strong> est ici la force exercée par la Terre. La sensation de poids (le plancher qui pousse sur nos pieds) est différente : elle disparaît en chute libre.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const verrouH = enDefi && (defi.type === 'poids' || defi.type === 'orbite');
  const vMax = Math.ceil(1.1 * vOrb(h) * 10) / 10;
  const etatAff = oc.etat && oc.etat.fini ? 'impact' : null;
  const OrbitePanel = (
    <div>
      <Orbite h={h} v={v} etat={oc.etat} trace={oc.trace} etatAff={etatAff}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 8 }}>
        <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>Altitude : <strong>{h} km</strong>
          <input type="range" min="200" max="1500" step="50" value={h} disabled={verrouH} aria-label="Altitude" onChange={e => { setH(+e.target.value); arreter(); }} style={{ width: '100%' }}/></label>
        <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>Vitesse de lancement : <strong>{fr(v, 2)} km/s</strong>
          <input type="range" min="0" max={vMax} step="0.05" value={Math.min(v, vMax)} aria-label="Vitesse" onChange={e => { setV(+e.target.value); arreter(); }} style={{ width: '100%' }}/></label></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <button onClick={lancer} style={styleBouton(true, '#16a34a')}>▶ Lancer</button><button onClick={arreter} style={styleBouton(false)}>⏹ Remettre</button>
        <span style={{ fontSize: 14, color: KIT.txt }}>{enDefi && defi.type === 'orbite' ? '' : <>Résultat : <strong>{tyo.type === 'circulaire' ? 'orbite circulaire' : tyo.type === 'impact' ? 'retombe sur la Terre' : tyo.type === 'ellipse' ? 'orbite allongée (ellipse)' : 'quitte la Terre'}</strong></>}</span></div>
      <div style={{ marginTop: 4, fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>À {h} km : g = <strong>{fr(gAlt(h), 2)} N/kg</strong> (au sol {fr(G0, 2)} N/kg)
        {!(enDefi && defi.type === 'orbite') && <> · vitesse d’une orbite circulaire : <strong>{km(vOrb(h))}</strong> · un tour : <strong>{fr(periode(h) / 60, 0)} min</strong></>}</div>
    </div>);
  const CabinePanel = (
    <div>
      <Cabine c={cab} t={cab.t} vueCabine={vueCabine}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Cabine dessinée beaucoup trop grande · <strong style={{ color: C_P }}>P</strong> : poids (force de la Terre) · flèche bleue : force du plancher sur la personne.</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Câble :</span>
        <button onClick={() => choisirTombe(false)} style={stylePetitBouton(!cab.tombe, '#0f766e')}>tenu (cabine immobile)</button>
        <button onClick={() => choisirTombe(true)} style={stylePetitBouton(cab.tombe, '#0f766e')}>coupé (chute libre)</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginLeft: 6 }}>Balle :</span>
        <button onClick={() => setCab(c => ({ ...c, lance: false, t: 0, enCours: false }))} style={stylePetitBouton(!cab.lance, '#0369a1')}>lâchée</button>
        <button onClick={() => setCab(c => ({ ...c, lance: true, t: 0, enCours: false }))} style={stylePetitBouton(cab.lance, '#0369a1')}>lancée vers la droite</button></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <button onClick={experience} style={styleBouton(true, '#16a34a')}>▶ Lancer l’expérience</button><button onClick={remettre} style={styleBouton(false)}>↺ Remettre</button>
        <button onClick={() => { setVueCabine(v => !v); marque('vue'); }} style={stylePetitBouton(vueCabine, '#7c3aed')}>{vueCabine ? '☑' : '☐'} vue depuis la cabine (référentiel de la cabine)</button></div>
    </div>);
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['orbite', '🌍 L’orbite (canon de Newton)'], ['cabine', '🧑‍🚀 Dans la cabine']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'orbite' ? OrbitePanel : CabinePanel}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Lancez avec 5 km/s, puis 7,7 km/s, puis 8 km/s : quelles différences ?</li>
        <li>Montez en altitude : la vitesse de l’orbite circulaire change-t-elle ? Et la durée d’un tour ?</li>
        <li>Cabine : comparez « câble tenu » et « câble coupé », balle lâchée puis lancée, vue depuis le sol puis depuis la cabine.</li>
        <li>Dans la cabine qui tombe, que deviennent les flèches P ? Et la flèche bleue ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>À 400 km : g ≈ 8,7 N/kg (89 % du sol)</li><li>ISS = chute libre autour de la Terre</li><li>Apesanteur = absence de support, pas de gravité</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .is-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .is-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .is-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .is-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>L’ISS en chute libre : pourquoi les astronautes flottent</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        À 400 km d’altitude, la gravité n’a presque pas diminué… pourtant les astronautes flottent. Découvrez ce qu’est vraiment l’<strong>apesanteur</strong> : une <strong>chute libre</strong> autour de la Terre.</div>
      <div className={`is-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} changerType={lancerDefi} v={v}/></div>}
          {enDefi && defi.type === 'cabine' ? <div style={styleBoite}>{CabinePanel}</div> : enDefi ? <div style={styleBoite}>{OrbitePanel}</div> : planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="is-l2">{panneauHypo}</div>}
      {enExplore && <div className="is-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
