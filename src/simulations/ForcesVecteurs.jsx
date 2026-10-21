import { useState, useEffect, useRef } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, lireNombre, proche } from "../commun";
import { G, ASTRES, astre, gravite, forceGrav, fr, sci, PX_CM, ECHELLES, caracteristiques, conforme } from "./forcesModele";

// ====================================================
//  SIM 59 — MODÉLISER UNE ACTION MÉCANIQUE PAR UNE FORCE (2GT, « Mouvement et interactions »)
//  Atelier 1 : le vecteur force (point d'application, direction, sens, intensité, échelle).
//  Atelier 2 : actions réciproques (deux dynamomètres ; deux patineurs).
//  Atelier 3 : le poids et la force d'interaction gravitationnelle (Terre, Lune, Mars, altitude).
//  Parcours guidé avec exemples résolus, exploration libre, 3 défis. Modèle : forcesModele.js.
// ====================================================

const SIM = 59;
declarerDefis(SIM, [
  ['lire', 'Lire l’intensité d’une force'],
  ['tracer', 'Tracer un vecteur force'],
  ['poids', 'Calculer un poids'],
]);

const VERT = '#15803d', ORANGE = '#b45309', FORCE = '#c2410c', FORCE2 = '#0072b2';
const W = 560, H = 300;
const alea = l => l[Math.floor(Math.random() * l.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// vecteur : lettre surmontée d'une flèche (le caractère « F⃗ » combiné n'existe pas dans toutes les polices)
const Vec = ({ c = 'F' }) => <span style={{ position: 'relative', display: 'inline-block', fontStyle: 'italic' }}>{c}<span aria-hidden="true" style={{ position: 'absolute', left: '0.1em', top: '-0.5em', fontSize: '0.8em', fontStyle: 'normal', lineHeight: 1 }}>→</span><span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}> (vecteur)</span></span>;
const Fn = ({ a, r, vec = false }) => <span style={{ fontStyle: 'italic' }}>{vec ? <Vec/> : 'F'}<sub>{a}/{r}</sub></span>;

// ---------- scènes du vecteur force ----------
const SCENES = {
  caisse: { titre: 'Un homme pousse une caisse', auteur: 'homme', receveur: 'caisse', point: { x: 270, y: 203 }, pointTxt: 'le point de contact des mains sur la face gauche de la caisse' },
  ballon: { titre: 'Un footballeur tire au but', auteur: 'pied', receveur: 'ballon', point: { x: 206, y: 238 }, pointTxt: 'le point de contact du pied sur le ballon' },
  clou: { titre: 'Un marteau frappe un clou', auteur: 'marteau', receveur: 'clou', point: { x: 300, y: 58 }, pointTxt: 'le point de contact du marteau sur la tête du clou' },
};
const TRAIT = { stroke: '#0f172a', strokeWidth: 4, strokeLinecap: 'round', fill: 'none' };
// Les schémas sont dessinés pour que l'auteur touche réellement le receveur au point d'application.
function Decor({ id }) {
  if (id === 'caisse') return <g><line x1="20" y1="262" x2="540" y2="262" stroke="#64748b" strokeWidth="3"/>
    <rect x="270" y="150" width="110" height="112" fill="#e3c99b" stroke="#7c5a2b" strokeWidth="3"/>
    <g {...TRAIT}><circle cx="207" cy="126" r="14" fill="#fde68a"/><line x1="205" y1="142" x2="188" y2="205"/><line x1="188" y1="205" x2="212" y2="262"/><line x1="188" y1="205" x2="160" y2="262"/>
      <line x1="203" y1="152" x2="270" y2="198"/><line x1="200" y1="160" x2="270" y2="208"/></g></g>;
  if (id === 'ballon') return <g><line x1="20" y1="262" x2="540" y2="262" stroke="#64748b" strokeWidth="3"/>
    <circle cx="230" cy="238" r="24" fill="#fff" stroke="#0f172a" strokeWidth="2.5"/><polygon points="230,228 238,234 235,244 225,244 222,234" fill="#0f172a"/>
    <path d="M122 262 L206 262 L206 238 L176 226 L156 226 L152 110 L124 110 L128 226 L122 234 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round"/></g>;
  return <g><rect x="150" y="262" width="300" height="24" fill="#c9a36a" stroke="#7c5a2b" strokeWidth="2"/><rect x="295" y="70" width="10" height="192" fill="#94a3b8" stroke="#475569" strokeWidth="2"/>
    <rect x="285" y="58" width="30" height="12" fill="#94a3b8" stroke="#475569" strokeWidth="2"/>
    <line x1="300" y1="30" x2="470" y2="30" stroke="#7c5a2b" strokeWidth="10" strokeLinecap="round"/><rect x="282" y="12" width="36" height="46" rx="3" fill="#64748b" stroke="#334155" strokeWidth="2.5"/></g>;
}
const maxLongueur = (pt, ang) => { const a = ang * Math.PI / 180; let L = 6.5;
  while (L > 0 && (pt.x + L * PX_CM * Math.cos(a) < 10 || pt.x + L * PX_CM * Math.cos(a) > W - 10 || pt.y - L * PX_CM * Math.sin(a) < 10 || pt.y - L * PX_CM * Math.sin(a) > H - 10)) L -= 0.25;
  return Math.max(0, L); };
const dxdy = (L, ang) => ({ dx: L * PX_CM * Math.cos(ang * Math.PI / 180), dy: -L * PX_CM * Math.sin(ang * Math.PI / 180) });

function Fleche({ x, y, dx, dy, couleur = FORCE, ep = 5 }) {
  const L = Math.hypot(dx, dy); if (L < 1) return null;
  const ux = dx / L, uy = dy / L, tete = Math.min(16, L * 0.6), bx = x + dx - ux * tete, by = y + dy - uy * tete;
  return <g><line x1={x} y1={y} x2={bx} y2={by} stroke={couleur} strokeWidth={ep} strokeLinecap="round"/>
    <polygon points={`${x + dx},${y + dy} ${bx - uy * 8},${by + ux * 8} ${bx + uy * 8},${by - ux * 8}`} fill={couleur}/></g>;
}

// plan d'une scène avec grille en cm et vecteur (modifiable à la souris ou fixe)
function PlancheForce({ scene, vec, setVec, editable, echelle, fantome }) {
  const sc = SCENES[scene], svg = useRef(null), drag = useRef(false), pt = sc.point;
  const { dx, dy } = dxdy(vec.L, vec.ang);
  const pos = e => { const r = svg.current.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
  const mettre = e => {
    const p = pos(e), ex = p.x - pt.x, ey = p.y - pt.y, ang = Math.round(Math.atan2(-ey, ex) * 180 / Math.PI / 5) * 5, A = ang === 180 || ang === -180 ? 180 : ang;
    const L = clamp(Math.round(Math.hypot(ex, ey) / PX_CM * 4) / 4, 0, maxLongueur(pt, A));
    setVec(v => ({ ...v, L, ang: A }));
  };
  const lignes = [];
  for (let x = 0; x <= W; x += PX_CM) lignes.push(<line key={`x${x}`} x1={x} y1="0" x2={x} y2={H} stroke="#e2e8f0" strokeWidth="1"/>);
  for (let y = 0; y <= H; y += PX_CM) lignes.push(<line key={`y${y}`} x1="0" y1={y} x2={W} y2={y} stroke="#e2e8f0" strokeWidth="1"/>);
  const F = vec.L * echelle;
  return (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${sc.titre}. Vecteur force de ${vec.L} cm à l’échelle 1 cm pour ${echelle} N`}
      style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, touchAction: 'none', userSelect: 'none' }}
      onPointerMove={e => { if (drag.current && editable) mettre(e); }} onPointerUp={() => { drag.current = false; }} onPointerCancel={() => { drag.current = false; }}>
      {lignes}
      <Decor id={scene}/>
      <text x="10" y="18" fontSize="13" fontWeight="700" fill="#334155">Échelle : 1 cm ↔ {echelle} N</text>
      <g stroke="#334155" strokeWidth="2"><line x1="10" y1="28" x2={10 + PX_CM} y2="28"/><line x1="10" y1="23" x2="10" y2="33"/><line x1={10 + PX_CM} y1="23" x2={10 + PX_CM} y2="33"/></g>
      <text x={10 + PX_CM + 6} y="33" fontSize="12" fill="#334155">1 cm</text>
      {vec.L > 0 && <g><Fleche x={pt.x} y={pt.y} dx={dx} dy={dy}/>
        <text x={pt.x + dx + (dx >= 0 ? 8 : -8)} y={pt.y + dy + (dy > 0 ? 18 : -8)} textAnchor={dx >= 0 ? 'start' : 'end'} fontSize="15" fontWeight="800" fill={FORCE}>F<tspan dx="-9" dy="-9" fontSize="10">→</tspan><tspan dx="0" dy="13" fontSize="11">{sc.auteur}/{sc.receveur}</tspan></text></g>}
      {fantome && <g opacity="0.5"><Fleche x={pt.x} y={pt.y} dx={dxdy(fantome.L, fantome.ang).dx} dy={dxdy(fantome.L, fantome.ang).dy} couleur="#15803d" ep={7}/></g>}
      <circle cx={pt.x} cy={pt.y} r="5" fill="#0f172a"/>
      {editable && <circle cx={pt.x + dx} cy={pt.y + dy} r="13" fill="#fff" fillOpacity="0.35" stroke={FORCE} strokeWidth="2.5" strokeDasharray="4 3" style={{ cursor: 'grab' }}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = true; }}/>}
      {F === 0 && <text x={W / 2} y={H - 12} textAnchor="middle" fontSize="13" fill="#64748b">Glissez la pointe de la flèche (ou utilisez les curseurs) pour tracer la force.</text>}
    </svg>);
}

// ---------- actions réciproques ----------
// Les deux forces ont le même point de contact (le crochet entre A et B, ou les mains des patineurs) et des sens opposés.
function Reciproques({ scene, F, mA, mB, montrer }) {
  if (scene === 'dyno') {
    const L = F * 10, cx = 193, cy = 100;
    return (
      <svg viewBox={`0 0 ${W} 220`} width="100%" role="img" aria-label={`Deux dynamomètres accrochés, tirés avec ${F} N`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
        <rect x="10" y="50" width="16" height="100" fill="#94a3b8" stroke="#475569" strokeWidth="2"/><text x="8" y="168" fontSize="12" fill="#334155">support fixe</text>
        {[['A', 26], ['B', 200]].map(([n, x0]) => <g key={n}>
          <rect x={x0} y="88" width="160" height="24" rx="6" fill="#f1f5f9" stroke="#334155" strokeWidth="2.5"/>
          <rect x={x0 + 96} y="56" width="56" height="26" rx="4" fill="#fff" stroke="#334155" strokeWidth="1.5"/><text x={x0 + 124} y="75" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">{fr(F, 1)} N</text>
          <text x={x0 + 30} y="75" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0f172a">{n}</text></g>)}
        <circle cx={cx} cy={cy} r="7" fill="#fff" stroke="#334155" strokeWidth="2.5"/>
        <line x1="360" y1="100" x2="420" y2="100" stroke="#334155" strokeWidth="3"/><circle cx="436" cy="100" r="16" fill="#fde2d4" stroke="#334155" strokeWidth="2"/><text x="436" y="105" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">main</text>
        {montrer && <g>
          <Fleche x={cx} y={cy} dx={L} dy={0} couleur={FORCE} ep={4.5}/>
          <text x={cx + L + 8} y={cy - 12} fontSize="14" fontWeight="800" fill={FORCE}>F<tspan dx="-9" dy="-9" fontSize="10">→</tspan><tspan dx="0" dy="13" fontSize="10">B/A</tspan></text>
          <Fleche x={cx} y={cy} dx={-L} dy={0} couleur={FORCE2} ep={4.5}/>
          <text x={cx - L - 8} y={cy + 30} textAnchor="end" fontSize="14" fontWeight="800" fill={FORCE2}>F<tspan dx="-9" dy="-9" fontSize="10">→</tspan><tspan dx="0" dy="13" fontSize="10">A/B</tspan></text>
          <text x="10" y="205" fontSize="12.5" fill="#334155">Échelle : 1 cm ↔ 4 N. F<tspan fontSize="9" dy="3">B/A</tspan><tspan dy="-3"> s’applique sur A, F</tspan><tspan fontSize="9" dy="3">A/B</tspan><tspan dy="-3"> sur B : au crochet qui les relie.</tspan></text></g>}
      </svg>);
  }
  const C = { x: 280, y: 112 }, L = F / 80 * PX_CM;
  const sA = 0.85 + (mA - 40) / 200, sB = 0.85 + (mB - 40) / 200;
  const bonhomme = (x, s, nom, m) => {            
    const sol = 190, ph = sol - 50 * s, ts = sol - 95 * s;   // hanches, épaules
    return <g {...TRAIT}><circle cx={x} cy={ts - 16 * s} r={13 * s} fill="#fde68a"/><line x1={x} y1={ts - 3 * s} x2={x} y2={ph}/>
      <line x1={x} y1={ph} x2={x - 16 * s} y2={sol}/><line x1={x} y1={ph} x2={x + 16 * s} y2={sol}/><line x1={x} y1={ts + 2} x2={C.x} y2={C.y}/>
      <text x={x} y={sol + 18} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a" stroke="none">{nom} ({m} kg)</text></g>;
  };
  return (
    <svg viewBox={`0 0 ${W} 220`} width="100%" role="img" aria-label="Deux patineurs en contact : A pousse B" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <line x1="10" y1="190" x2="550" y2="190" stroke="#94a3b8" strokeWidth="3"/>
      {bonhomme(205, sA, "A", mA)}{bonhomme(355, sB, "B", mB)}
      <circle cx={C.x} cy={C.y} r="5" fill="#0f172a"/>
      {montrer && <g>
        <Fleche x={C.x} y={C.y} dx={L} dy={0} couleur={FORCE} ep={4.5}/><text x={C.x + 8} y={52} fontSize="14" fontWeight="800" fill={FORCE}>F<tspan dx="-9" dy="-9" fontSize="10">→</tspan><tspan dx="0" dy="13" fontSize="10">A/B</tspan> = {fr(F, 0)} N</text>
        <Fleche x={C.x} y={C.y} dx={-L} dy={0} couleur={FORCE2} ep={4.5}/><text x={C.x - 8} y={52} textAnchor="end" fontSize="14" fontWeight="800" fill={FORCE2}>{fr(F, 0)} N = F<tspan dx="-9" dy="-9" fontSize="10">→</tspan><tspan dx="0" dy="13" fontSize="10">B/A</tspan></text></g>}
      <text x="10" y="18" fontSize="12.5" fill="#334155">A pousse B : leurs mains se touchent au point noir. Échelle : 1 cm ↔ 80 N.</text>
    </svg>);
}

// ---------- poids et gravitation ----------
const nicesc = F => { const L = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]; return L.find(s => F / s <= 4) || 10000; };
function PanneauPoids({ pw, setPw, verrouAstre }) {
  const masque = verrouAstre;          // en défi : on cache les valeurs calculées (elles donneraient la réponse)
  const a = astre(pw.astre), h = pw.h * 1000, g0 = gravite(a), g = gravite(a, h), F = forceGrav(a, pw.m, h);
  const E = nicesc(F), L = Math.min(4.2, F / E);
  return (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Poids et attraction gravitationnelle</div>
      {!verrouAstre && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{ASTRES.map(x => <button key={x.id} onClick={() => setPw(s => ({ ...s, astre: x.id }))} style={stylePetitBouton(pw.astre === x.id, '#0f766e')}>{x.Nom}</button>)}</div>}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <svg viewBox="0 0 220 250" width="100%" style={{ maxWidth: 260, display: 'block', margin: '0 auto', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }} role="img" aria-label={`Un objet de ${fr(pw.m, 1)} kg attiré par ${a.nom}`}>
            <ellipse cx="110" cy="330" rx="200" ry="150" fill={a.id === 'terre' ? '#bfdbfe' : a.id === 'lune' ? '#e2e8f0' : '#fecaca'} stroke="#475569" strokeWidth="2"/>
            <text x="110" y="205" textAnchor="middle" fontSize="14" fontWeight="700" fill="#334155">{a.Nom}</text>
            <circle cx="110" cy="70" r="12" fill="#fde68a" stroke="#92400e" strokeWidth="2"/><text x="110" y="50" textAnchor="middle" fontSize="12" fill="#334155">objet : {fr(pw.m, 1)} kg</text>
            <Fleche x={110} y={70} dx={0} dy={L * PX_CM} couleur={FORCE} ep={4.5}/>
            <text x="128" y={70 + L * PX_CM * 0.6} fontSize="13" fontWeight="800" fill={FORCE}>F<tspan dx="-9" dy="-9" fontSize="10">→</tspan></text>
            {!masque && <text x="8" y="240" fontSize="11.5" fill="#334155">Échelle : 1 cm ↔ {fr(E, E < 1 ? 1 : 0)} N</text>}</svg>
        </div>
        <div style={{ flex: '1 1 260px', fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
          {!masque && <label style={{ display: 'block', fontWeight: 600 }}>Masse de l’objet : <strong>{fr(pw.m, 1)} kg</strong>
            <input type="range" min="0.1" max="100" step="0.1" value={pw.m} aria-label="Masse de l’objet en kilogrammes" onChange={e => setPw(s => ({ ...s, m: +e.target.value }))} style={{ width: '100%' }}/></label>}
          {!masque && <label style={{ display: 'block', fontWeight: 600 }}>Altitude : <strong>{pw.h} km</strong>
            <input type="range" min="0" max="2000" step="50" value={pw.h} aria-label="Altitude en kilomètres" onChange={e => setPw(s => ({ ...s, h: +e.target.value }))} style={{ width: '100%' }}/></label>}
          <table style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%', marginTop: 6 }}><tbody>
            {[[`Masse de ${a.nom}`, `${sci(a.M)} kg`], [`Rayon de ${a.nom}`, `${sci(a.R)} m`], ['Constante de gravitation G', `${sci(G)} N·m²·kg⁻²`],
              ...(masque ? [] : [[`Intensité de la pesanteur à la surface g₀ = G·M/R²`, `${fr(g0, 2)} N/kg`],
              [`À l’altitude ${pw.h} km : g = G·M/(R + h)²`, `${fr(g, 2)} N/kg`]])].map(([l, v]) => <tr key={l} style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '3px 6px 3px 0', color: KIT.txt2 }}>{l}</td><td style={{ fontWeight: 700 }}>{v}</td></tr>)}</tbody></table>
          {!masque && <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: '#f0fdfa', border: '1.5px solid #5eead4' }}>
            Force exercée par {a.nom} sur l’objet : <strong>F = {fr(F, F < 10 ? 2 : 1)} N</strong><br/>
            <span style={{ fontSize: 13, color: KIT.txt2 }}>F = G × M × m / (R + h)² = {fr(pw.m * g, F < 10 ? 2 : 1)} N, soit m × g.{pw.h === 0 ? ' À la surface, c’est le poids de l’objet.' : ' Elle diminue quand l’altitude augmente, mais ne disparaît pas.'}</span></div>}
        </div>
      </div>
    </div>);
}

// ====================================================
//  DÉFIS
// ====================================================
const TITRES = { lire: 'Lire une intensité', tracer: 'Tracer un vecteur', poids: 'Calculer un poids' };
function nouveauDefi(type, prec) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'lire') {
    const scene = alea(Object.keys(SCENES)), echelle = alea([20, 40, 50, 100, 200]), L = alea([1.5, 2, 2.5, 3, 3.5, 4]);
    const ang = scene === 'clou' ? -90 : scene === 'ballon' ? alea([0, 30, 45]) : alea([0, 180]);
    return { ...base, scene, echelle, L, ang, F: L * echelle };
  }
  if (type === 'tracer') {
    const scene = alea(Object.keys(SCENES)), echelle = alea([50, 100, 200]);
    const ang = scene === 'clou' ? -90 : scene === 'ballon' ? alea([30, 45, 60]) : alea([0, 180]), maxL = Math.floor(maxLongueur(SCENES[scene].point, ang) * 2) / 2;
    const Lc = alea([1.5, 2, 2.5, 3, 3.5, 4].filter(x => x <= maxL)), F = Lc * echelle;
    return { ...base, scene, echelle, ang, F };
  }
  let a, m; do { a = alea(ASTRES); m = alea([0.5, 1, 2, 5, 10, 20, 50]); } while (prec && prec.type === 'poids' && prec.astre === a.id && prec.m === m);
  return { ...base, astre: a.id, m, variante: alea(['g', 'grav']) };
}
const attendu = d => (d.type === 'poids' ? forceGrav(astre(d.astre), d.m) : d.F);
function evaluerDefi(d, vec) {
  if (d.type === 'tracer') {
    const { dx, dy } = dxdy(vec.L, vec.ang), r = conforme({ F: d.F, angle: d.ang, echelle: d.echelle }, dx, dy);
    return { ok: r.okL && r.okAng, lignes: [
      [r.okL, r.okL ? 'Longueur correcte.' : `Longueur : ${fr(d.F, 0)} N à l’échelle 1 cm ↔ ${d.echelle} N donne ${fr(d.F / d.echelle, 1)} cm (tu as ${fr(vec.L, 2)} cm).`],
      [r.okAng, r.okAng ? 'Direction et sens corrects.' : 'Direction ou sens incorrect : relis la consigne.']] };
  }
  const x = lireNombre(d.reps.F), v = attendu(d), ok = Number.isFinite(x) && proche(x, v, 0.03);
  return { ok, lignes: [[ok, ok ? `Correct : ${fr(v, v < 10 ? 2 : 1)} N.` : d.type === 'lire' ? 'Mesure la longueur de la flèche (en cm) puis multiplie par le nombre de newtons que représente 1 cm.' : 'Pas encore : revois la formule P = m × g (ou F = G × M × m / R²) et les unités.']] };
}
function VoletDefi({ defi, setDefi, changerType, vec }) {
  const res = defi.verifie ? evaluerDefi(defi, vec) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const verifier = () => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); };
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const sc = SCENES[defi.scene], a = defi.type === 'poids' ? astre(defi.astre) : null;
  const saisie = <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
    <input value={defi.reps.F ?? ''} aria-label="Ta réponse en newtons" onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, F: e.target.value }, verifie: false }))} onKeyDown={e => { if (e.key === 'Enter') verifier(); }}
      style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14.5 }}/> <span>N</span></div>;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{lireProgression()[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'lire' && <><div style={txt}>🎯 {sc.titre}. Le vecteur représente la force <Fn a={sc.auteur} r={sc.receveur}/>. À l’échelle <strong>1 cm ↔ {defi.echelle} N</strong>, quelle est son intensité ?</div>{saisie}</>}
      {defi.type === 'tracer' && <div style={txt}>🎯 {sc.titre}. Trace le vecteur de la force <Fn a={sc.auteur} r={sc.receveur}/> : intensité <strong>{fr(defi.F, 0)} N</strong>, direction et sens :{' '}
        <strong>{caracteristiques(...Object.values(dxdy(1, defi.ang)), 1).direction}, {caracteristiques(...Object.values(dxdy(1, defi.ang)), 1).sens}</strong>. Échelle : <strong>1 cm ↔ {defi.echelle} N</strong>, point d’application : {sc.pointTxt}.</div>}
      {defi.type === 'poids' && <><div style={txt}>🎯 Quel est le poids d’un objet de <strong>{fr(defi.m, defi.m < 1 ? 1 : 0)} kg</strong> à la surface de {a.nom} ?{' '}
        {defi.variante === 'g' ? <>Donnée : à la surface, g = {fr(gravite(a), 1)} N/kg.</> : <>Données : G = {sci(G)} N·m²·kg⁻², M = {sci(a.M)} kg, R = {sci(a.R)} m : calcule la force F = G × M × m / R².</>}</div>{saisie}</>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={verifier} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {t}</div>)}
        {res.ok && <div style={{ color: '#15803d', fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'lire' && <>La flèche mesure {fr(defi.L, 1)} cm et 1 cm représente {defi.echelle} N : F = {fr(defi.L, 1)} × {defi.echelle} = <strong>{fr(defi.F, 0)} N</strong>.</>}
        {defi.type === 'tracer' && <>Longueur = {fr(defi.F, 0)} / {defi.echelle} = <strong>{fr(defi.F / defi.echelle, 1)} cm</strong>. Direction : {caracteristiques(...Object.values(dxdy(1, defi.ang)), 1).direction}, sens : {caracteristiques(...Object.values(dxdy(1, defi.ang)), 1).sens}. Le vecteur part du point d’application.</>}
        {defi.type === 'poids' && (defi.variante === 'g' ? <>P = m × g = {fr(defi.m, 1)} × {fr(gravite(a), 1)} = <strong>{fr(attendu(defi), 2)} N</strong>.</> : <>F = G × M × m / R² = {sci(G)} × {sci(a.M)} × {fr(defi.m, 1)} / ({sci(a.R)})² = <strong>{fr(attendu(defi), 2)} N</strong> (c’est le poids).</>)}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationForcesVecteurs() {
  const [mode, setMode] = useState(() => modeOuverture('forces-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('forces-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('vecteur');        // 'vecteur' | 'recip' | 'poids'
  const [vec, setVec] = useState({ scene: 'caisse', echelle: 100, L: 3, ang: 0, lecture: null, verrou: false });
  const [recip, setRecip] = useState({ scene: 'dyno', F: 4, mA: 60, mB: 60, montrer: true });
  const [pw, setPw] = useState({ astre: 'terre', m: 1, h: 0 });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const atelierEff = enDefi ? (defi.type === 'poids' ? 'poids' : 'vecteur') : atelier;

  // situation d'un défi dans l'atelier « vecteur »
  const vecEff = enDefi && defi.type === 'lire' ? { scene: defi.scene, echelle: defi.echelle, ...{ L: defi.L, ang: defi.ang }, lecture: true, verrou: true }
    : enDefi && defi.type === 'tracer' ? { ...vec, scene: defi.scene, echelle: defi.echelle, verrou: true, lecture: false } : vec;
  const pwEff = enDefi && defi.type === 'poids' ? { ...pw, astre: defi.astre, m: defi.m, h: 0 } : pw;

  const voirVec = (scene, echelle, L = 0, ang = 0, lecture = false) => { setAtelier('vecteur'); setVec({ scene, echelle, L, ang, lecture, verrou: true }); };
  const voirRecip = (scene, F = 4) => { setAtelier('recip'); setRecip(r => ({ ...r, scene, F, montrer: true })); };
  const voirPoids = (a, m = 1, h = 0) => { setAtelier('poids'); setPw({ astre: a, m, h }); };
  const sc = SCENES[vecEff.scene];
  const car = caracteristiques(...Object.values(dxdy(vecEff.L, vecEff.ang)), vecEff.echelle);
  const bon = (scene, echelle, F, ang) => atelier === 'vecteur' && vec.scene === scene && vec.echelle === echelle && conforme({ F, angle: ang, echelle }, ...Object.values(dxdy(vec.L, vec.ang))).okL && conforme({ F, angle: ang, echelle }, ...Object.values(dxdy(vec.L, vec.ang))).okAng;

  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;
  const ETAPES = [
    { id: 'action', titre: 'Une action mécanique', depart: () => voirVec('ballon', 100, 0, 0),
      texte: <>Quand un système <strong>agit</strong> sur un autre (il le pousse, le tire, le retient…), on dit qu’il exerce une <strong>action mécanique</strong>. Celui qui crée l’action est l’<strong>auteur</strong>, celui qui la subit est le <strong>receveur</strong>.
        <ExempleResolu>Le pied du footballeur frappe le ballon : l’auteur est le <strong>pied</strong>, le receveur est le <strong>ballon</strong>. L’action modifie la trajectoire et la vitesse du ballon.</ExempleResolu>
        À vous : une main pousse une porte.</>,
      tache: { type: 'qcm', q: 'Une main pousse une porte. Quel est le receveur de l’action ?', options: ['la porte', 'la main', 'la Terre', 'le sol'], bonne: 0, expl: 'La main est l’auteur (elle crée l’action) ; la porte est le receveur (elle la subit).' } },
    { id: 'force', titre: 'On modélise l’action par une force', depart: () => voirVec('caisse', 100, 3, 0),
      texte: <>En physique, on <strong>modélise</strong> une action mécanique par une <strong>force</strong>, représentée par un <strong>vecteur</strong> (une flèche). Une force est caractérisée par <strong>4 informations</strong> : son <strong>point d’application</strong>, sa <strong>direction</strong>, son <strong>sens</strong>, son <strong>intensité</strong> (en newtons, N). La <strong>longueur</strong> de la flèche est proportionnelle à l’intensité : il faut une <strong>échelle</strong>.
        <ExempleResolu>Un homme pousse une caisse avec une force de 300 N, horizontale, vers la droite. Échelle : <strong>1 cm ↔ 100 N</strong>. Longueur de la flèche : 300 / 100 = <strong>3 cm</strong>. La flèche part du point de contact.
          {bouton('Voir cet exemple', () => voirVec('caisse', 100, 3, 0))}</ExempleResolu>
        À vous : l’homme <strong>tire</strong> maintenant la caisse <strong>vers la gauche</strong> avec 200 N (même échelle).</>,
      tache: { type: 'action', ok: bon('caisse', 100, 200, 180), consigne: 'Tracez le vecteur force : 200 N, horizontale, vers la gauche, à l’échelle 1 cm ↔ 100 N (glissez la pointe de la flèche ou utilisez les curseurs).' } },
    { id: 'lire', titre: 'Lire une intensité sur un dessin', depart: () => voirVec('ballon', 40, 2.5, 0, true),
      texte: <>Inversement, on peut <strong>retrouver l’intensité</strong> d’une force à partir de la longueur de sa flèche : intensité = longueur (en cm) × valeur d’1 cm.
        <ExempleResolu>Avec l’échelle 1 cm ↔ 100 N, une flèche de 3 cm représente 3 × 100 = 300 N.</ExempleResolu>
        À vous : utilisez la grille (1 carreau = 1 cm) pour mesurer la flèche du tir. Échelle : <strong>1 cm ↔ 40 N</strong>.</>,
      tache: { type: 'num', q: 'Quelle est l’intensité de la force exercée par le pied sur le ballon ?', unite: 'N', vrai: 100, tol: 0.03, affiche: x => String(x),
        pieges: [[2.5, 'C’est la longueur de la flèche en cm. Multipliez-la par 40 N/cm.'], [40, 'C’est l’échelle (N pour 1 cm). Il faut la multiplier par la longueur de la flèche.']],
        expl: 'La flèche mesure 2,5 cm : F = 2,5 × 40 = 100 N.' } },
    { id: 'notation', titre: 'Intensité ou vecteur ?', depart: null,
      texte: <>On distingue la <strong>force</strong> (le vecteur, avec une flèche : <Vec/>) et son <strong>intensité</strong> (un nombre en newtons : F). La force exercée par l’auteur <em>a</em> sur le receveur <em>r</em> se note <Fn a="a" r="r" vec/>, et son intensité <Fn a="a" r="r"/>.
        <ExempleResolu>Intensité de la force de la main sur la porte : F<sub>main/porte</sub> = 5 N. On n’écrit pas « <Vec/> = 5 N » : un vecteur n’est pas égal à un nombre.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Laquelle de ces écritures est correcte ?', options: ['F = 5 N', <span key="v1"><Vec/> = 5 N</span>, 'F = 5', <span key="v2"><Vec/> = 5 N/m</span>], bonne: 0, expl: 'L’intensité est un nombre avec une unité : F = 5 N. Le vecteur force a une direction et un sens, il n’est pas égal à un nombre.' } },
    { id: 'oblique', titre: 'Une force oblique', depart: () => voirVec('ballon', 50, 0, 30),
      texte: <>Une force n’est pas toujours horizontale ou verticale. L’angle indique la <strong>direction</strong>, la pointe de la flèche le <strong>sens</strong>.
        <ExempleResolu>Un tir à 30° vers le haut et la droite, de 150 N, échelle 1 cm ↔ 50 N : longueur = 150 / 50 = 3 cm, la flèche fait 30° avec l’horizontale.</ExempleResolu>
        À vous : tracez le tir du footballeur : <strong>200 N</strong>, direction à <strong>30°</strong> au-dessus de l’horizontale, vers la droite. Échelle : <strong>1 cm ↔ 50 N</strong>.</>,
      tache: { type: 'action', ok: bon('ballon', 50, 200, 30), consigne: 'Tracez le vecteur force : 200 N, 30° au-dessus de l’horizontale, vers la droite, échelle 1 cm ↔ 50 N.' } },
    { id: 'retenir1', titre: 'À retenir : la force', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Une <strong>action mécanique</strong> se modélise par une <strong>force</strong> (vecteur <Vec/>).</li>
        <li>4 caractéristiques : <strong>point d’application, direction, sens, intensité</strong> (en N).</li>
        <li>La longueur de la flèche est proportionnelle à l’intensité : on précise toujours l’<strong>échelle</strong>.</li></ul></ARetenir>, tache: null },
    { id: 'recip1', titre: 'Deux dynamomètres accrochés', depart: () => voirRecip('dyno', 4),
      texte: <>Deux dynamomètres A et B sont accrochés l’un à l’autre. Le premier est fixé à un support. On tire sur B. Comme B tire sur A, <strong>A tire aussi sur B</strong> : si A agit sur B, alors B agit sur A. C’est le <strong>principe des actions réciproques</strong>.
        <ExempleResolu>B tire A vers la droite avec F<sub>B/A</sub>. A tire B vers la gauche avec F<sub>A/B</sub>. Ces deux forces ont même direction, <strong>sens opposés</strong> et <strong>même intensité</strong>.</ExempleResolu>
        À vous : modifiez la force de la main avec le curseur.</>,
      tache: { type: 'num', q: 'Le dynamomètre B indique 4 N. Que lit-on sur le dynamomètre A ?', unite: 'N', vrai: 4, tol: 0.01, affiche: x => String(x), pieges: [[2, 'Pourquoi la moitié ? Les deux dynamomètres subissent des forces de même intensité.'], [8, 'Les forces ne s’additionnent pas : elles ont la même intensité.']],
        expl: 'Les forces réciproques ont la même intensité : A lit aussi 4 N.' } },
    { id: 'recip2', titre: 'Deux patineurs', depart: () => { setAtelier('recip'); setRecip({ scene: 'patin', F: 60, mA: 80, mB: 45, montrer: true }); },
      texte: <>On pourrait croire que le plus lourd pousse plus fort. Faux ! Quand A pousse B, <strong>B pousse A autant</strong>, quelle que soit leur masse. Ce qui change, c’est l’<strong>effet</strong> : le plus léger recule plus vite.
        <ExempleResolu>Si A (80 kg) pousse B (45 kg) avec 60 N, alors B pousse A avec 60 N dans l’autre sens.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'A pousse B avec une force de 60 N. Que dit le principe des actions réciproques ?', options: ['B exerce sur A une force de 60 N, de sens opposé', 'B exerce sur A une force de 60 N, de même sens', 'B exerce sur A une force plus petite car B est plus léger', 'B n’exerce aucune force sur A'], bonne: 0, expl: 'Les deux forces ont même intensité (60 N) et des sens opposés.' } },
    { id: 'poids1', titre: 'Le poids : une action à distance', depart: () => voirPoids('terre', 0.5, 0),
      texte: <>La Terre attire tous les objets, <strong>sans les toucher</strong> : c’est une action <strong>à distance</strong>. La force correspondante est le <strong>poids</strong> de l’objet : P = m × g, avec m en kg et g l’intensité de la pesanteur (en N/kg). Sur Terre, g ≈ 9,8 N/kg.
        <ExempleResolu>Un objet de 0,2 kg a un poids P = 0,2 × 9,8 ≈ <strong>1,96 N</strong> (environ 2 N).
          {bouton('Voir sur la Terre', () => voirPoids('terre', 0.2, 0))}</ExempleResolu>
        À vous : un objet de 0,5 kg.</>,
      tache: { type: 'num', q: 'Quel est le poids d’un objet de 0,5 kg à la surface de la Terre ? (g = 9,8 N/kg)', unite: 'N', vrai: 4.9, tol: 0.04, affiche: x => fr(x, 1), pieges: [[0.5, 'C’est la masse en kg. Multipliez-la par g.'], [49, 'Vérifiez la virgule : 0,5 × 9,8.']],
        expl: 'P = m × g = 0,5 × 9,8 = 4,9 N.' } },
    { id: 'poids2', titre: 'Le poids dépend de l’astre', depart: () => voirPoids('lune', 1, 0),
      texte: <>La masse (en kg) ne change pas d’un astre à l’autre, mais le <strong>poids</strong> change car g change : sur la Lune g ≈ 1,6 N/kg, sur Mars g ≈ 3,7 N/kg.
        <ExempleResolu>Sur Mars, un objet de 1 kg pèse 1 × 3,7 = 3,7 N.</ExempleResolu>
        À vous : la Lune.</>,
      tache: { type: 'num', q: 'Quel est le poids d’un objet de 1 kg sur la Lune ? (g = 1,6 N/kg)', unite: 'N', vrai: 1.62, tol: 0.05, affiche: x => fr(x, 1),
        expl: 'P = 1 × 1,6 ≈ 1,6 N : six fois moins que sur Terre.' } },
    { id: 'grav', titre: 'L’interaction gravitationnelle', depart: () => voirPoids('terre', 1, 0),
      texte: <>Deux objets de masses m<sub>A</sub> et m<sub>B</sub>, dont les centres sont distants de d, s’attirent avec des forces de même intensité : <strong>F = G × m<sub>A</sub> × m<sub>B</sub> / d²</strong>, avec G = {sci(G)} N·m²·kg⁻². Le poids est cette force pour un objet proche de la surface d’un astre.
        <ExempleResolu>Si la distance d <strong>double</strong>, d² est multiplié par 4 : la force est <strong>divisée par 4</strong>. Regardez la valeur de g quand vous augmentez l’altitude.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Si la distance entre deux astres est multipliée par 3, la force gravitationnelle…', options: ['est divisée par 9', 'est divisée par 3', 'est multipliée par 3', 'ne change pas'], bonne: 0, expl: 'F est proportionnelle à 1/d² : d × 3 donne F / 9.' } },
    { id: 'iss', titre: '★ La Station spatiale : le poids disparaît-il ?', depart: () => voirPoids('terre', 1, 400),
      texte: <>La Station spatiale internationale orbite à 400 km d’altitude. Les astronautes « flottent » : a-t-on <em>plus de gravité</em> là-haut ? Regardez avec l’altitude réglée à 400 km…
        <ExempleResolu>À la surface, g = 9,8 N/kg. À 400 km, g = G M / (R + h)² ≈ 8,7 N/kg : la gravité n’a presque pas diminué. Les astronautes flottent parce que la station et eux <strong>tombent ensemble</strong> autour de la Terre (chute libre), pas parce que la gravité a disparu.</ExempleResolu></>,
      tache: { type: 'num', q: 'Quelle est la force exercée par la Terre sur un objet de 1 kg à 400 km d’altitude ? (regardez la simulation)', unite: 'N', vrai: 8.7, tol: 0.03, affiche: x => fr(x, 1),
        expl: 'F = G M m / (R + h)² ≈ 8,7 N : presque autant qu’au sol (9,8 N). L’impesanteur vient de la chute libre.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Action mécanique → <strong>force</strong> (vecteur) : point d’application, direction, sens, intensité (N), échelle.</li>
        <li><strong>Actions réciproques</strong> : si A agit sur B avec <Fn a="A" r="B" vec/>, B agit sur A avec <Fn a="B" r="A" vec/> : même intensité, sens opposés.</li>
        <li><strong>Poids</strong> : P = m × g (g ≈ 9,8 N/kg sur Terre). <strong>Gravitation</strong> : F = G m<sub>A</sub> m<sub>B</sub> / d².</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const d = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (d) d();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type, prec) {
    const d = nouveauDefi(type, prec); setDefi(d);
    if (type === 'tracer') setVec({ scene: d.scene, echelle: d.echelle, L: 1, ang: 0, lecture: false, verrou: true });
  }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'lire', null); }

  // ════════════════ PANNEAUX ════════════════
  const lectureSeule = !!vecEff.lecture;
  const maxL = maxLongueur(sc.point, vecEff.ang);
  const planche = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{sc.titre}</div>
      {!enDefi && !vecEff.verrou && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Scène :</span>
        {Object.entries(SCENES).map(([k, s]) => <button key={k} onClick={() => setVec(v => ({ ...v, scene: k, L: Math.min(v.L, maxLongueur(SCENES[k].point, v.ang)), lecture: null }))} style={stylePetitBouton(vec.scene === k, '#0f766e')}>{s.auteur} → {s.receveur}</button>)}
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginLeft: 6 }}>Échelle (1 cm ↔) :</span>
        {ECHELLES.map(e => <button key={e} onClick={() => setVec(v => ({ ...v, echelle: e }))} style={stylePetitBouton(vec.echelle === e, '#0f766e')}>{e} N</button>)}</div>}
      <PlancheForce scene={vecEff.scene} vec={vecEff} setVec={setVec} editable={!lectureSeule && !enDefi ? true : enDefi && defi.type === 'tracer'} echelle={vecEff.echelle}
        fantome={enDefi && defi.type === 'tracer' && defi.solution ? { L: defi.F / defi.echelle, ang: defi.ang } : null}/>
      {enDefi && defi.type === 'tracer' && defi.solution && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>La flèche verte transparente montre la solution : longueur {fr(defi.F / defi.echelle, 1)} cm, angle {defi.ang}°.</div>}
      {!lectureSeule && <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
        <label style={{ fontSize: 13.5, fontWeight: 600, flex: '1 1 200px' }}>Longueur : <strong>{fr(vecEff.L, 2)} cm</strong>
          <input type="range" min="0" max={maxL} step="0.25" value={Math.min(vecEff.L, maxL)} aria-label="Longueur de la flèche en centimètres" onChange={e => setVec(v => ({ ...v, L: +e.target.value }))} style={{ width: '100%' }}/></label>
        <label style={{ fontSize: 13.5, fontWeight: 600, flex: '1 1 200px' }}>Angle avec l’horizontale : <strong>{vecEff.ang}°</strong>
          <input type="range" min="-180" max="180" step="5" value={vecEff.ang} aria-label="Angle de la flèche en degrés" onChange={e => { const a = +e.target.value; setVec(v => ({ ...v, ang: a, L: Math.min(v.L, maxLongueur(SCENES[v.scene].point, a)) })); }} style={{ width: '100%' }}/></label></div>}
      {(!enDefi || defi.type === 'tracer') && !lectureSeule && <table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%', marginTop: 8 }}><tbody>
        {[['Notation', <Fn a={sc.auteur} r={sc.receveur} vec key="n"/>], ['Point d’application', sc.pointTxt], ['Direction', car.direction], ['Sens', car.sens],
          ...(enDefi ? [] : [['Intensité', <span key="i"><strong>{fr(car.F, 0)} N</strong> ({fr(car.L, 2)} cm × {vecEff.echelle} N/cm)</span>]])].map(([l, v], k) => (
          <tr key={k} style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '3px 6px 3px 0', color: KIT.txt2, fontWeight: 600 }}>{l}</td><td style={{ padding: '3px 0', fontWeight: 700 }}>{v}</td></tr>))}</tbody></table>}
      {lectureSeule && !enDefi && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6 }}>La flèche est fixée : mesurez-la avec la grille (1 carreau = 1 cm).</div>}
    </div>);
  const panneauRecip = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Actions réciproques</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <button onClick={() => setRecip(r => ({ ...r, scene: 'dyno', F: 4 }))} style={stylePetitBouton(recip.scene === 'dyno', '#0f766e')}>Deux dynamomètres</button>
        <button onClick={() => setRecip(r => ({ ...r, scene: 'patin', F: 60 }))} style={stylePetitBouton(recip.scene === 'patin', '#0f766e')}>Deux patineurs</button>
        <label style={{ fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={recip.montrer} onChange={e => setRecip(r => ({ ...r, montrer: e.target.checked }))}/> Afficher les deux forces</label></div>
      <Reciproques scene={recip.scene} F={recip.F} mA={recip.mA} mB={recip.mB} montrer={recip.montrer}/>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
        <label style={{ fontSize: 13.5, fontWeight: 600, flex: '1 1 200px' }}>{recip.scene === 'dyno' ? 'Force de la main sur B' : 'Force de A sur B'} : <strong>{fr(recip.F, recip.scene === 'dyno' ? 1 : 0)} N</strong>
          <input type="range" min={recip.scene === 'dyno' ? 0 : 10} max={recip.scene === 'dyno' ? 10 : 160} step={recip.scene === 'dyno' ? 0.5 : 10} value={recip.F} aria-label="Intensité de la force" onChange={e => setRecip(r => ({ ...r, F: +e.target.value }))} style={{ width: '100%' }}/></label>
        {recip.scene === 'patin' && <>
          <label style={{ fontSize: 13.5, fontWeight: 600, flex: '1 1 160px' }}>Masse de A : <strong>{recip.mA} kg</strong><input type="range" min="40" max="100" step="5" value={recip.mA} aria-label="Masse de A" onChange={e => setRecip(r => ({ ...r, mA: +e.target.value }))} style={{ width: '100%' }}/></label>
          <label style={{ fontSize: 13.5, fontWeight: 600, flex: '1 1 160px' }}>Masse de B : <strong>{recip.mB} kg</strong><input type="range" min="40" max="100" step="5" value={recip.mB} aria-label="Masse de B" onChange={e => setRecip(r => ({ ...r, mB: +e.target.value }))} style={{ width: '100%' }}/></label></>}
      </div>
      <div style={{ marginTop: 8, fontSize: 14.5, color: KIT.txt, padding: '6px 10px', background: '#f0fdfa', border: '1.5px solid #5eead4', borderRadius: 8, lineHeight: 1.55 }}>
        {recip.scene === 'dyno' ? <>Le dynamomètre A indique <strong>{fr(recip.F, 1)} N</strong> et le dynamomètre B aussi : F<sub>A/B</sub> = F<sub>B/A</sub> = {fr(recip.F, 1)} N.</>
          : <>F<sub>A/B</sub> = F<sub>B/A</sub> = <strong>{fr(recip.F, 0)} N</strong>, quelles que soient les masses. {recip.mA === recip.mB ? 'Avec des masses égales, les deux patineurs reculent de la même façon.' : `Le plus léger (${recip.mA < recip.mB ? 'A' : 'B'}) recule plus vite : l’effet de la force dépend de la masse, pas son intensité.`}</>}</div>
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Modèle du point matériel</strong> : la force est dessinée en un point précis (le point d’application). Pour un objet réel, on choisit souvent son centre, sauf quand on veut montrer un contact.</li>
      <li><strong>Échelle</strong> : la longueur de la flèche n’a de sens qu’avec l’échelle précisée. Dans la simulation, les longueurs sont arrondies au quart de centimètre et les angles à 5°.</li>
      <li><strong>Poids et gravitation</strong> : on confond le poids avec la force d’attraction gravitationnelle de l’astre (rotation de l’astre négligée) ; g = G·M/R² vaut environ 9,8 N/kg sur Terre (souvent arrondi à 10).</li>
      <li><strong>Astres sphériques et homogènes</strong> : on utilise la distance d entre les centres, soit R + h pour un objet à l’altitude h.</li>
      <li><strong>Actions réciproques</strong> : valable à chaque instant, que les objets soient immobiles ou en mouvement. Dans les scènes, le mouvement n’est pas simulé.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Changez l’échelle sans toucher à la flèche : que devient l’intensité ? Pourquoi la flèche ne change-t-elle pas ?</li>
        <li>Faites tourner la flèche du ballon de 0° à 90° : quelles caractéristiques changent ? Lesquelles restent identiques ?</li>
        <li>Deux patineurs : donnez à A une masse très grande et à B une masse petite. Les deux forces sont-elles encore égales ?</li>
        <li>Mars, Lune, Terre : à masse égale, classez les poids. Que se passe-t-il quand l’altitude augmente ?</li>
        <li>À partir de quelle altitude le poids d’un objet est-il divisé par 2 ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>force = vecteur : point d’application, direction, sens, intensité (N)</li>
    <li>actions réciproques : même intensité, sens opposés</li>
    <li>P = m × g, g ≈ 9,8 N/kg sur Terre</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);
  const ateliers = (enExplore || enGuide) && (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>Atelier :</span>
      {[['vecteur', '➡️ Le vecteur force'], ['recip', '🔁 Actions réciproques'], ['poids', '🌍 Poids et gravitation']].map(([k, l]) =>
        <button key={k} onClick={() => { setAtelier(k); if (k === 'vecteur') setVec(v => ({ ...v, verrou: false, lecture: null, L: v.L || 3 })); }} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fv-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fv-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .fv-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .fv-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Les forces : modéliser une action mécanique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Pousser, tirer, retenir, attirer : toutes ces <strong>actions</strong> se modélisent par une <strong>force</strong>, dessinée par une flèche. Apprenez à la tracer, à la lire, à la mesurer, puis découvrez le principe des actions réciproques et la force de gravitation.</div>
      {ateliers}
      <div className={`fv-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} vec={vec} changerType={t => lancer(t, defi)}/></div>}
          {atelierEff === 'vecteur' && planche}
          {atelierEff === 'recip' && !enDefi && panneauRecip}
          {atelierEff === 'poids' && <PanneauPoids pw={pwEff} setPw={setPw} verrouAstre={enDefi}/>}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="fv-l2">{panneauHypo}</div>}
      {enExplore && <div className="fv-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
