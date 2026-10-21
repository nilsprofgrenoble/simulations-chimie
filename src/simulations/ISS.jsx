import { useState, useEffect, useRef } from "react";
import { useSignalerMode, useSuivi, declarerDefis } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, lireNombre, avecIndices } from "../commun";
import { fr, R_KM, gAlt, G0, vOrb, periode, typeOrbite, depart, pas, trajectoire, CONTEXTES, accRelative, balance } from "./issModele";

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
const M_BALLE = 0.5, M_ASTRO = 70;

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

// ---------- atelier cabine ----------
function Cabine({ ctx, g, bal }) {
  const PX = 80, X0 = 70, Y1 = 270, bx = X0 + bal.x * PX, by = Y1 - bal.y * PX, ar = accRelative(ctx, g);
  const flotte = ctx !== 'sol', ax = X0 + 3 * PX, astroY = flotte ? 150 : 238;
  const P_ball = M_BALLE * g, P_astro = M_ASTRO * g, repos = ctx === 'sol' && bal.y <= 0.13 && !bal.vol;
  const arrow = (x, y, dy, c, label, left) => <g><line x1={x} y1={y} x2={x} y2={y + dy} stroke={c} strokeWidth="3.5"/>
    <polygon points={`${x},${y + dy} ${x - 5},${y + dy - Math.sign(dy) * 10} ${x + 5},${y + dy - Math.sign(dy) * 10}`} fill={c}/>
    <text x={x + (left ? -7 : 7)} y={y + dy / 2 + 4} textAnchor={left ? 'end' : 'start'} fontSize="12.5" fontWeight="800" fill={c} stroke="#fff" strokeWidth="3" paintOrder="stroke">{label}</text></g>;
  return (
    <svg viewBox="0 0 700 310" width="100%" role="img" aria-label={`${CONTEXTES[ctx].nom} : une balle et un astronaute`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <rect x={X0} y="30" width={7 * PX} height={240} fill="#f1f5f9" stroke="#0f172a" strokeWidth="4" rx="6"/>
      <line x1={X0} y1={Y1} x2={X0 + 7 * PX} y2={Y1} stroke="#0f172a" strokeWidth="6"/>
      <text x={X0 + 8} y="52" fontSize="13.5" fontWeight="800" fill="#0f172a">{CONTEXTES[ctx].nom}</text>
      {/* balance */}
      <rect x={ax - 38} y={Y1 - 10} width="76" height="10" fill="#94a3b8" stroke="#0f172a" strokeWidth="2"/>
      <rect x={ax - 28} y={Y1 + 4} width="56" height="22" rx="3" fill="#0f172a"/><text x={ax} y={Y1 + 20} textAnchor="middle" fontSize="14" fontWeight="800" fill="#4ade80">{fr(bal.lecture, 0)} N</text>
      <text x={ax + 46} y={Y1 + 20} fontSize="12" fill="#334155">balance</text>
      {/* astronaute */}
      <g stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none">
        <circle cx={ax} cy={astroY - 62} r="12" fill="#fde68a" strokeWidth="3"/>
        <line x1={ax} y1={astroY - 50} x2={ax} y2={astroY - 8}/>
        {flotte ? <><line x1={ax} y1={astroY - 40} x2={ax - 24} y2={astroY - 22}/><line x1={ax} y1={astroY - 40} x2={ax + 24} y2={astroY - 22}/><line x1={ax} y1={astroY - 8} x2={ax - 16} y2={astroY + 22}/><line x1={ax} y1={astroY - 8} x2={ax + 16} y2={astroY + 22}/></>
          : <><line x1={ax} y1={astroY - 40} x2={ax - 18} y2={astroY - 18}/><line x1={ax} y1={astroY - 40} x2={ax + 18} y2={astroY - 18}/><line x1={ax} y1={astroY - 8} x2={ax - 10} y2={Y1 - 11}/><line x1={ax} y1={astroY - 8} x2={ax + 10} y2={Y1 - 11}/></>}</g>
      {arrow(ax - 34, astroY - 30, P_astro * 0.1, C_P, `P = ${fr(P_astro, 0)} N`, true)}
      {ctx === 'sol' && arrow(ax + 34, Y1 - 12, -P_astro * 0.1, C_V, 'sol', false)}
      {/* balle */}
      <circle cx={bx} cy={by} r="10" fill="#dc2626" stroke="#0f172a" strokeWidth="2.5"/>
      {arrow(bx + 18, by, P_ball * 10 / 1, C_P, `P = ${fr(P_ball, 1)} N`, false)}
      {repos && arrow(bx + 18, by + 8, -P_ball * 10, C_V, 'R', false)}
      <text x="14" y="298" fontSize="11.5" fill="#334155">Astronaute de {M_ASTRO} kg : flèche à l’échelle 0,1 px/N · balle de {fr(M_BALLE * 1000, 0)} g : 10 px/N</text>
      <text x={X0 + 7 * PX - 8} y="52" textAnchor="end" fontSize="13" fontWeight="700" fill={ar > 0.01 ? ORANGE : VERT}>{ar > 0.01 ? `La balle accélère vers le bas : ${fr(ar, 1)} m/s²` : 'La balle n’accélère pas dans la cabine'}</text>
      <text x={X0 + 7 * PX - 8} y="72" textAnchor="end" fontSize="12.5" fill="#334155">vitesse de la balle : {fr(Math.hypot(bal.vx, bal.vy), 2)} m/s</text>
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
  const [mode, setMode] = useState('explore');
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('iss-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('orbite');
  const [h, setH] = useState(400);
  const [v, setV] = useState(7.7);
  const [ctx, setCtx] = useState('sol');
  const [fait, setFait] = useState({ sol: false, chute: false, lance: false, orbite: false });
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

  // ----- cabine -----
  const gExt = ctx === 'iss' ? gAlt(h) : G0;
  const [bal, setBal] = useState({ x: 4.5, y: 1.5, vx: 0, vy: 0, vol: false });
  const balRef = useRef(bal); balRef.current = bal;
  const remettre = () => setBal({ x: 4.5, y: 1.5, vx: 0, vy: 0, vol: false });
  const lacher = () => { setBal({ x: 4.5, y: 1.5, vx: 0, vy: 0, vol: true }); marque(ctx === 'sol' ? 'sol' : 'chute'); };
  const lancerBalle = () => { setBal({ x: 4.5, y: 1.5, vx: 1, vy: 0, vol: true }); if (ctx !== 'sol') marque('lance'); };
  useEffect(() => {
    let raf, dernier = performance.now(); const ar = accRelative(ctx, gExt);
    const boucle = t => {
      const b = balRef.current, dt = Math.min(0.05, (t - dernier) / 1000); dernier = t;
      if (b.vol) {
        let { x, y, vx, vy } = b; vy -= ar * dt; x += vx * dt; y += vy * dt; let vol = true;
        if (y <= 0.12) { y = 0.12; vy = 0; vx = 0; vol = false; }
        if (y >= 2.88) { y = 2.88; vy = 0; vol = false; }
        if (x >= 6.88) { x = 6.88; vx = 0; vol = ar > 0.01 ? true : false; }
        if (x <= 0.12) { x = 0.12; vx = 0; }
        if (!vol && vx === 0 && vy === 0) { /* au repos */ }
        setBal({ x, y, vx, vy, vol: vol && (Math.abs(vx) > 0 || Math.abs(vy) > 0 || ar > 0.01) });
      }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [ctx, gExt]);
  const lecture = balance(ctx, M_ASTRO, gExt);

  const choisirCtx = c => { setCtx(c); remettre(); };
  const voirO = (hh = 400, vv = 7.7) => { setAtelier('orbite'); setH(hh); setV(vv); arreter(); };
  const voirC = c => { setAtelier('cabine'); choisirCtx(c); };
  const ETAPES = [
    { id: 'question', titre: 'Pourquoi les astronautes flottent-ils ?', depart: () => voirO(400, 7.7),
      texte: <>À bord de la Station spatiale internationale (<strong>ISS</strong>), à <strong>400 km</strong> d’altitude, les astronautes <strong>flottent</strong>. On dit qu’ils sont en <strong>apesanteur</strong>. Beaucoup pensent qu’à cette altitude « il n’y a plus de gravité ». Vérifions !</>,
      tache: { type: 'qcm', q: 'À ton avis, pourquoi les astronautes flottent-ils dans la station ?', options: ['La station et eux tombent ensemble autour de la Terre', 'Il n’y a plus de gravité à 400 km d’altitude', 'Il n’y a pas d’air dans l’espace', 'La station tourne si vite qu’ils sont plaqués au plafond'], bonne: 0, expl: 'Ils flottent parce que la station et les astronautes sont en chute libre ensemble. La gravité est toujours là (près de 90 % de celle du sol) : c’est elle qui les fait tourner autour de la Terre.' } },
    { id: 'gravite', titre: 'Y a-t-il encore de la gravité à 400 km ?', depart: () => voirO(400, 7.7),
      texte: <>Regardez la flèche rouge : à 400 km, la Terre attire <strong>chaque kilogramme</strong> avec une force de <strong>8,7 N</strong> (g = 8,7 N/kg). Au sol, c’est 9,8 N/kg. La Terre est grande : monter de 400 km, c’est peu par rapport à son rayon de 6 378 km.
        <ExempleResolu>Un objet de <strong>10 kg</strong> : au sol P = 10 × 9,8 = 98 N ; à 400 km P = 10 × 8,7 = <strong>87 N</strong>. Presque pareil !</ExempleResolu></>,
      tache: { type: 'num', q: 'Quel est le poids d’un astronaute de 70 kg à 400 km d’altitude ? (P = m × g)', unite: 'N', vrai: 608, tol: 0.02, affiche: x => String(x), pieges: [[686, 'C’est son poids au sol (70 × 9,8). À 400 km, g vaut 8,7 N/kg.'], [0, 'Le poids n’est pas nul : la Terre attire toujours l’astronaute.']], expl: 'P = 70 × 8,7 ≈ 608 N : environ 89 % de son poids au sol. Il n’a pas du tout « perdu » son poids.' } },
    { id: 'sol', titre: 'Dans une cabine posée au sol', depart: () => voirC('sol'),
      texte: <>Voici une <strong>cabine posée au sol</strong> avec un astronaute sur une <strong>balance</strong> et une <strong>balle</strong>. Lâchez la balle avec le bouton. La balle <strong>tombe</strong>. La balance indique la force avec laquelle l’astronaute appuie dessus : <strong>686 N</strong>. Le sol le soutient (réaction du sol).</>,
      tache: { type: 'action', ok: enGuide && fait.sol, consigne: 'Lâchez la balle dans la cabine posée au sol.' } },
    { id: 'chute', titre: 'Dans une cabine en chute libre', depart: () => voirC('chute'),
      texte: <>Maintenant la cabine est <strong>en chute libre</strong> : on a coupé les câbles et elle tombe, avec l’astronaute et la balle à l’intérieur (comme dans une « tour de chute »). Lâchez la balle. Que fait-elle ?
        <ExempleResolu>La cabine, la balle et l’astronaute <strong>tombent tous ensemble</strong> et à la même vitesse. Par rapport à la cabine, la balle ne bouge pas : elle <strong>flotte</strong>.</ExempleResolu></>,
      tache: { type: 'action', ok: enGuide && fait.chute && ctx === 'chute', consigne: 'Choisissez « cabine en chute libre » puis lâchez la balle.' } },
    { id: 'balance', titre: 'La balance indique 0 N', depart: () => voirC('chute'),
      texte: <>Dans la cabine en chute libre, la <strong>balance indique 0 N</strong>. Pourtant, les flèches rouges (<strong>poids</strong>, force de la Terre) sont toujours là : la Terre attire toujours la balle et l’astronaute. Mais la balance <strong>tombe aussi</strong> : elle ne les soutient plus.</>,
      tache: { type: 'qcm', q: 'Dans la cabine en chute libre, l’astronaute a-t-il encore un poids ?', options: ['Oui : la Terre l’attire toujours, mais rien ne le soutient', 'Non : il n’y a plus d’attraction', 'Oui, mais la balance est cassée', 'Non, la cabine est trop petite'], bonne: 0, expl: 'La force de la Terre (le poids) existe toujours. C’est la sensation de poids qui disparaît, car l’astronaute et le sol de la cabine tombent ensemble.' } },
    { id: 'lancer', titre: 'Lançons la balle !', depart: () => voirC('chute'),
      texte: <>Lancez maintenant la balle <strong>vers la droite</strong> dans la cabine en chute libre. Elle part tout droit, à <strong>vitesse constante</strong>, jusqu’à la paroi. Tout se passe <strong>comme si aucune force ne s’exerçait</strong> sur elle : c’est le <strong>principe d’inertie</strong> vu depuis la cabine.</>,
      tache: { type: 'action', ok: enGuide && fait.lance, consigne: 'Lancez la balle dans la cabine en chute libre.' } },
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
    if (type === 'cabine') { setAtelier('cabine'); choisirCtx('sol'); }
  }
  function changerMode(md) { setMode(md); if (md === 'defi') lancerDefi(defi ? defi.type : 'poids'); else if (md === 'explore') { setAtelier('orbite'); } }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Terre sphérique et homogène</strong>, seule la Terre attire (Lune, Soleil négligés), <strong>sans atmosphère</strong> : pas de frottement. L’ISS réelle, à 400 km, en subit un petit : on la « remonte » régulièrement.</li>
      <li><strong>Force de gravitation</strong> de la Terre : g = G·M / (R + h)² avec G = 6,67×10⁻¹¹ N·m²·kg⁻², M = 5,98×10²⁴ kg, R = 6 378 km. La <strong>Terre est dessinée à l’échelle</strong> ; la <strong>station est volontairement dessinée trop grande</strong>.</li>
      <li><strong>Lancement horizontal</strong>, trajectoire dans un <strong>plan</strong>. Le temps est <strong>accéléré</strong> (une orbite en environ 14 s au lieu de 92 min). La vitesse maximale proposée est inférieure à la vitesse de libération.</li>
      <li><strong>Cabine</strong> : on la suppose rigide, de petite taille devant la Terre. Les très petites différences de gravité entre le haut et le bas de la station (effets de marée) sont <strong>négligées</strong> : l’apesanteur est parfaite dans le modèle (dans la réalité, on parle de microgravité).</li>
      <li><strong>Tour de chute</strong> : cabine en chute libre sans frottement de l’air (en vrai, on fait le vide dans le tube) ; la balle ne rebondit pas ; la balance affiche la force exercée par l’astronaute sur elle.</li>
      <li><strong>Vocabulaire</strong> : le <strong>poids</strong> est ici la force exercée par la Terre. La sensation de poids (ce que mesure une balance) est différente : elle disparaît en chute libre.</li>
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
      <Cabine ctx={ctx} g={gExt} bal={{ ...bal, lecture }}/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        {!(enDefi && defi.type === 'cabine') && <><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Situation :</span>
          {Object.entries(CONTEXTES).map(([k, c]) => <button key={k} onClick={() => choisirCtx(k)} style={stylePetitBouton(ctx === k, '#0f766e')}>{c.nom}</button>)}</>}
        <button onClick={lacher} style={styleBouton(true, '#16a34a')}>⬇ Lâcher la balle</button><button onClick={lancerBalle} style={styleBouton(true, '#0369a1')}>➡ Lancer la balle</button><button onClick={remettre} style={styleBouton(false)}>↺ Remettre</button></div>
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
        <li>Dans la cabine : comparez « posée au sol » et « en chute libre », balle lâchée puis lancée.</li>
        <li>Que lit-on sur la balance dans chaque situation ? Le poids a-t-il disparu ?</li>
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
