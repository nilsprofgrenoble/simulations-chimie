import { useState, useEffect } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, lireNombre, proche, avecIndices } from "../commun";
import { fr, MILIEUX, milieu, refraction, angleLimite, mesurerI2, pente, pecheur } from "./optiqueModele";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 64 — RÉFRACTION DE LA LUMIÈRE : LOIS DE SNELL-DESCARTES (2GT, « Ondes et signaux »)
//  Dioptre plan entre deux milieux : rayons incident, réfléchi, réfracté, normale ; n₁ sin i₁ = n₂ sin i₂ ; mesure d'un indice (TP hémi-cylindre) ;
//  le pêcheur et le poisson. Hypothèses : milieux transparents et homogènes, surface plane, indices à 589 nm (la couleur n'est pas prise en compte),
//  rayons lumineux rectilignes, intensité des rayons non modélisée, lecture des angles au demi-degré.
// ====================================================

const SIM = 64;
declarerDefis(SIM, [
  ['calcul', 'Calculer un angle de réfraction'],
  ['indice', 'Déterminer un indice'],
  ['prevoir', 'Prévoir la déviation'],
]);
const TITRES = { calcul: 'Calculer i₂', indice: 'Déterminer un indice', prevoir: 'Prévoir la déviation' };
const VERT = '#15803d', ORANGE = '#b45309', C_INC = '#d55e00', C_REF = '#0072b2', C_REFL = '#475569';
const RAD = Math.PI / 180;
const alea = l => l[Math.floor(Math.random() * l.length)];
const sin = x => Math.sin(x * RAD);
const g3 = x => fr(x, 3);
const LIQ = [['plexi', 'plexiglas'], ['eau', 'eau'], ['eausucree', 'eau sucrée'], ['inconnu', 'liquide inconnu']];

// ---------- dioptre plan ----------
function arc(cx, cy, r, a, haut, gauche) {   // arc de rayon r entre la normale et la direction a (°)
  const sgn = gauche ? -1 : 1, v = haut ? -1 : 1;
  const x2 = cx + sgn * r * sin(a), y2 = cy + v * r * Math.cos(a * RAD);
  return `M ${cx} ${cy + v * r} A ${r} ${r} 0 0 ${(haut ? gauche : !gauche) ? 0 : 1} ${x2} ${y2}`;
}
function Interface({ n1, n2, i1, nom1, nom2, leg, masqueN, w = 560 }) {
  const cx = 280, cy = 170, L = 150, i2 = refraction(n1, n2, i1), lim = angleLimite(n1, n2);
  const pt = (a, s, v, l = L) => [cx + s * l * sin(a), cy + v * l * Math.cos(a * RAD)];
  const [xi, yi] = pt(i1, -1, -1), [xr, yr] = pt(i1, 1, -1), t = i2 != null ? pt(i2, 1, 1) : null;
  const fl = (x, y, dx, dy, c) => { const l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l; return <polygon points={`${x},${y} ${x - ux * 14 - uy * 6},${y - uy * 14 + ux * 6} ${x - ux * 14 + uy * 6},${y - uy * 14 - ux * 6}`} fill={c}/>; };
  return (
    <svg viewBox={`0 0 ${w} 340`} width="100%" role="img" aria-label={`Rayon lumineux passant de ${nom1} à ${nom2}, angle d’incidence ${i1} degrés`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <rect x="0" y="0" width={w} height={cy} fill="#e0f2fe" opacity={0.1 + 0.25 * Math.min(1, (n1 - 1) / 1.4)}/>
      <rect x="0" y={cy} width={w} height={340 - cy} fill="#0072b2" opacity={0.06 + 0.2 * Math.min(1, (n2 - 1) / 1.4)}/>
      <line x1="10" y1={cy} x2={w - 10} y2={cy} stroke="#0f172a" strokeWidth="3"/>
      <line x1={cx} y1="12" x2={cx} y2="328" stroke="#475569" strokeWidth="2" strokeDasharray="7 6"/>
      <text x={cx + 8} y="26" fontSize="13" fontWeight="700" fill="#475569">normale</text>
      <text x="14" y="28" fontSize="14" fontWeight="800" fill="#0f172a">Milieu 1 : {nom1}{masqueN ? '' : ` (n₁ = ${fr(n1, 2)})`}</text>
      <text x="14" y="326" fontSize="14" fontWeight="800" fill="#0f172a">Milieu 2 : {nom2}{masqueN ? '' : ` (n₂ = ${fr(n2, 2)})`}</text>
      <line x1={xr} y1={yr} x2={cx} y2={cy} stroke={C_REFL} strokeWidth={i2 == null ? 4 : 2} strokeDasharray={i2 == null ? '' : '6 5'}/>{fl(xr, yr, xr - cx, yr - cy, C_REFL)}
      <line x1={xi} y1={yi} x2={cx} y2={cy} stroke={C_INC} strokeWidth="4"/>{fl(cx, cy, cx - xi, cy - yi, C_INC)}
      {t && <g><line x1={cx} y1={cy} x2={t[0]} y2={t[1]} stroke={C_REF} strokeWidth="4"/>{fl(t[0], t[1], t[0] - cx, t[1] - cy, C_REF)}</g>}
      <circle cx={cx} cy={cy} r="5" fill="#0f172a"/>
      {i1 > 0 && <><path d={arc(cx, cy, 56, i1, true, true)} fill="none" stroke={C_INC} strokeWidth="2.5"/>
        <text x={cx - 62 * sin(i1 / 2) - 22} y={cy - 62 * Math.cos(i1 * RAD / 2) - 4} fontSize="15" fontWeight="800" fill={C_INC}>i₁</text></>}
      {i2 != null && i2 > 0 && <><path d={arc(cx, cy, 56, i2, false, false)} fill="none" stroke={C_REF} strokeWidth="2.5"/>
        <text x={cx + 62 * sin(i2 / 2) + 6} y={cy + 66 * Math.cos(i2 * RAD / 2) + 8} fontSize="15" fontWeight="800" fill={C_REF}>i₂</text></>}
      {leg && <g fontSize="12.5" fontWeight="700"><text x={xi + 6} y={yi + 4} fill={C_INC}>rayon incident</text>
        {t && <text x={t[0] + 6} y={t[1] - 4} fill={C_REF}>rayon réfracté</text>}
        <text x={cx + 10} y={cy + 20} fill="#0f172a">point d’incidence</text>
        <text x={w - 14} y={cy - 8} textAnchor="end" fill="#0f172a">surface de séparation</text></g>}
      {!leg && <text x={xr - 4} y={yr - 6} fontSize="12" fontWeight="700" fill={C_REFL} textAnchor="end">rayon réfléchi</text>}
      {i2 == null && <text x={w - 14} y="320" textAnchor="end" fontSize="13.5" fontWeight="800" fill={ORANGE}>Réflexion totale : plus de rayon réfracté (i₁ &gt; {fr(lim, 1)}°)</text>}
    </svg>);
}

// ---------- graphique sin i₁ en fonction de sin i₂ ----------
const COUL_LIQ = { plexi: '#0072b2', eau: '#d55e00', eausucree: '#009e73', inconnu: '#7b2d8e' };
function Graphe({ pts }) {
  const X = x => 40 + x * 230, Y = y => 190 - y * 170, liqs = [...new Set(pts.map(p => p.liq))];
  return (
    <svg viewBox="0 0 300 220" width="100%" role="img" aria-label="Graphique de sin i1 en fonction de sin i2" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map(v => <g key={v}><line x1={X(v)} y1={Y(0)} x2={X(v)} y2={Y(1)} stroke="#e2e8f0"/><line x1={X(0)} y1={Y(v)} x2={X(1)} y2={Y(v)} stroke="#e2e8f0"/>
        <text x={X(v)} y="206" textAnchor="middle" fontSize="10" fill="#475569">{fr(v, 1)}</text><text x="34" y={Y(v) + 3} textAnchor="end" fontSize="10" fill="#475569">{fr(v, 1)}</text></g>)}
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(0)} stroke="#0f172a" strokeWidth="2"/><line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1)} stroke="#0f172a" strokeWidth="2"/>
      <text x="170" y="218" textAnchor="middle" fontSize="11.5" fontWeight="700">sin i₂</text><text x="46" y="12" fontSize="11.5" fontWeight="700">sin i₁</text>
      {liqs.map(l => { const q = pts.filter(p => p.liq === l).map(p => [sin(p.i2), sin(p.i1)]), k = pente(q), xm = Math.min(1, 1 / k);
        return <g key={l}>{isFinite(k) && <line x1={X(0)} y1={Y(0)} x2={X(xm)} y2={Y(k * xm)} stroke={COUL_LIQ[l]} strokeWidth="2" strokeDasharray="5 4"/>}
          {q.map(([x, y], j) => <circle key={j} cx={X(x)} cy={Y(y)} r="4.5" fill={COUL_LIQ[l]} stroke="#fff" strokeWidth="1.2"/>)}</g>; })}
    </svg>);
}

// ---------- le pêcheur et le poisson ----------
function Pecheur({ P }) {
  const S = 170, r = pecheur({ xf: P.xf, d: P.d, xe: 80, h: P.h }), eye = [80, S - P.h];
  const fish = (x, y, c, dash) => <g opacity={dash ? 0.9 : 1}><ellipse cx={x} cy={y} rx="20" ry="10" fill={dash ? 'none' : c} stroke={c} strokeWidth="2.5" strokeDasharray={dash ? '4 3' : ''}/><polygon points={`${x + 18},${y} ${x + 32},${y - 10} ${x + 32},${y + 10}`} fill={dash ? 'none' : c} stroke={c} strokeWidth="2.5" strokeDasharray={dash ? '4 3' : ''}/></g>;
  return (
    <svg viewBox="0 0 560 330" width="100%" role="img" aria-label="Un pêcheur vise un poisson sous la surface de l’eau" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <rect x="0" y="0" width="560" height={S} fill="#e0f2fe" opacity="0.25"/><rect x="0" y={S} width="560" height={330 - S} fill="#0072b2" opacity="0.18"/>
      <line x1="0" y1={S} x2="560" y2={S} stroke="#0f172a" strokeWidth="3"/>
      <circle cx={eye[0]} cy={eye[1]} r="9" fill="#fde68a" stroke="#0f172a" strokeWidth="2.5"/><line x1={eye[0]} y1={eye[1] + 9} x2={eye[0]} y2={S} stroke="#0f172a" strokeWidth="3"/>
      <text x={eye[0] + 14} y={eye[1] + 4} fontSize="12.5" fontWeight="700">œil</text>
      <line x1={r.xp} y1={S} x2={P.xf} y2={S + P.d} stroke={C_REF} strokeWidth="3.5"/>
      <line x1={r.xp} y1={S} x2={eye[0]} y2={eye[1]} stroke={C_REF} strokeWidth="3.5"/>
      <line x1={eye[0]} y1={eye[1]} x2={r.aimX} y2={S + P.d} stroke={C_INC} strokeWidth="2.5" strokeDasharray="7 5"/>
      {fish(r.aimX, S + P.d, C_INC, true)}{fish(P.xf, S + P.d, '#0f172a', false)}
      <text x={r.aimX + 4} y={S + P.d + 28} textAnchor="end" fontSize="12.5" fontWeight="700" fill={C_INC}>où pointe la visée</text>
      <text x={P.xf - 4} y={S + P.d - 16} fontSize="12.5" fontWeight="700" fill="#0f172a">poisson réel</text>
      <circle cx={r.xp} cy={S} r="4.5" fill="#0f172a"/><text x={r.xp + 6} y={S - 8} fontSize="11.5" fill="#0f172a">point d’incidence</text>
      <text x="14" y="322" fontSize="12.5" fill="#0f172a">Lumière : poisson → surface → œil (bleu) · visée : prolongement de la droite œil → surface (orange pointillé)</text>
    </svg>);
}

// ---------- défis ----------
const PAIRES = [['air', 'eau'], ['air', 'plexi'], ['air', 'diamant'], ['eau', 'plexi'], ['eau', 'diamant'], ['glycerol', 'diamant'], ['plexi', 'air'], ['eau', 'air'], ['plexi', 'eau'], ['diamant', 'plexi']];
const INCONNUS = [1.33, 1.36, 1.40, 1.47, 1.52];
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'calcul') { for (;;) { const [a, b] = alea(PAIRES), i1 = alea([20, 25, 30, 40, 45, 50, 60]), i2 = refraction(milieu(a).n, milieu(b).n, i1); if (i2 != null) return { ...base, a, b, i1, i2 }; } }
  if (type === 'indice') return { ...base, n: alea(INCONNUS) };
  for (;;) { const [a, b] = alea(PAIRES), i1 = alea([0, 20, 30, 40, 50]); if (a === b) continue; const lim = angleLimite(milieu(a).n, milieu(b).n); if (lim != null && i1 >= lim - 3) continue; return { ...base, a, b, i1, rep: i1 === 0 ? 'zero' : milieu(b).n > milieu(a).n ? 'rapproche' : 'ecarte' }; }
}
function evaluer(d) {
  if (d.type === 'calcul') { const x = lireNombre(d.reps.v), ok = isFinite(x) && proche(x, d.i2, 0.02); return { ok, lignes: [[ok, ok ? 'Angle correct.' : 'Revois : n₁ × sin i₁ = n₂ × sin i₂, donc sin i₂ = n₁ × sin i₁ / n₂ (puis arcsin, touche sin⁻¹).']] }; }
  if (d.type === 'indice') { const x = lireNombre(d.reps.v), ok = isFinite(x) && Math.abs(x - d.n) <= 0.03; return { ok, lignes: [[ok, ok ? 'Indice correct (à 0,03 près).' : 'Revois : air → liquide, n = sin i₁ / sin i₂ ; ou la pente de la droite sin i₁ = f(sin i₂).']] }; }
  const ok = d.reps.d === d.rep; return { ok, lignes: [[ok, ok ? 'Bonne réponse.' : 'Rappel : n₂ > n₁ → se rapproche de la normale ; n₂ < n₁ → s’écarte ; i₁ = 0° → pas de déviation.']] };
}
function VoletDefi({ defi, setDefi, changerType }) {
  const res = defi.verifie ? evaluer(defi) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 };
  const champ = u => <label style={{ fontSize: 14, fontWeight: 600 }}>Réponse : <input value={defi.reps.v || ''} onChange={e => rep('v', e.target.value)} inputMode="decimal" aria-label="Votre réponse" style={{ width: 90, padding: '5px 8px', fontSize: 15, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/> {u}</label>;
  const nm = id => milieu(id).nom;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'calcul' && <><div style={txt}><Pic n="target"/>Un rayon passe de <strong>{nm(defi.a)}</strong> (n₁ = {fr(milieu(defi.a).n, 2)}) à <strong>{nm(defi.b)}</strong> (n₂ = {fr(milieu(defi.b).n, 2)}) avec un angle d’incidence <strong>i₁ = {defi.i1}°</strong>. Calculez l’angle de réfraction i₂.</div>{champ('°')}</>}
      {defi.type === 'indice' && <><div style={txt}><Pic n="target"/>Un rayon passe de l’<strong>air</strong> à un <strong>liquide inconnu</strong>. Faites des mesures (atelier ci-dessous) et déterminez son <strong>indice de réfraction</strong> n.</div>{champ('')}</>}
      {defi.type === 'prevoir' && <><div style={txt}><Pic n="target"/>Un rayon passe de <strong>{nm(defi.a)}</strong> (n₁ = {fr(milieu(defi.a).n, 2)}) à <strong>{nm(defi.b)}</strong> (n₂ = {fr(milieu(defi.b).n, 2)}) avec un angle d’incidence de <strong>{defi.i1}°</strong>. Le rayon réfracté…</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[['rapproche', 'se rapproche de la normale'], ['ecarte', 's’écarte de la normale'], ['zero', 'n’est pas dévié']].map(([v, l]) => <button key={v} onClick={() => rep('d', v)} style={stylePetitBouton(defi.reps.d === v, '#0ea5e9')}>{l}</button>)}</div></>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? VERT : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {avecIndices(t)}</div>)}
        {res.ok && <div style={{ color: VERT, fontWeight: 700, marginTop: 4 }}><Pic n="party"/>Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'calcul' && <>sin i₂ = n₁ × sin i₁ / n₂ = {fr(milieu(defi.a).n, 2)} × sin {defi.i1}° / {fr(milieu(defi.b).n, 2)} = {g3(milieu(defi.a).n * sin(defi.i1) / milieu(defi.b).n)}, donc i₂ = <strong>{fr(defi.i2, 1)}°</strong>.</>}
        {defi.type === 'indice' && <>Pour chaque mesure, n = sin i₁ / sin i₂ (air → liquide) : c’est la pente de la droite. Ici n = <strong>{fr(defi.n, 2)}</strong> (à 0,03 près).</>}
        {defi.type === 'prevoir' && <>{defi.rep === 'zero' ? 'i₁ = 0° : le rayon arrive le long de la normale, il n’est pas dévié.' : defi.rep === 'rapproche' ? `n₂ = ${fr(milieu(defi.b).n, 2)} > n₁ = ${fr(milieu(defi.a).n, 2)} : le rayon se rapproche de la normale.` : `n₂ = ${fr(milieu(defi.b).n, 2)} < n₁ = ${fr(milieu(defi.a).n, 2)} : le rayon s’écarte de la normale.`}</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationRefraction() {
  const [mode, setMode] = useState(() => modeOuverture('refraction-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('refraction-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('interface');
  const [A, setA] = useState({ m1: 'air', m2: 'plexi', i1: 50, leg: false });
  const [Me, setMe] = useState({ liq: 'plexi', i1: 30, reveler: false });
  const [pts, setPts] = useState([]);
  const [Pe, setPe] = useState({ xf: 340, d: 90, h: 110 });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const nLiq = Me.liq === 'inconnu' ? (defi && defi.type === 'indice' ? defi.n : 1.40) : milieu(Me.liq).n;
  const n1 = milieu(A.m1).n, n2 = milieu(A.m2).n;

  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;
  const voirI = (m1, m2, i1, leg = false) => { setAtelier('interface'); setA({ m1, m2, i1, leg }); };
  const voirM = (liq, i1 = 30, effacer = true) => { setAtelier('mesure'); setMe({ liq, i1, reveler: false }); if (effacer) setPts([]); };
  const ETAPES = [
    { id: 'pecheur', titre: 'Pourquoi rate-t-on le poisson ?', depart: () => setAtelier('pecheur'),
      texte: <>Un pêcheur vise un poisson avec son harpon… et le manque ! Le poisson envoie de la lumière (c’est un objet <strong>diffusant</strong> : une source secondaire). Cette lumière change de direction en passant de l’eau à l’air : c’est la <strong>réfraction</strong>.
        <ExempleResolu>La droite en <strong>orange pointillé</strong> est la direction de visée : celle de la lumière vue par l’œil, prolongée tout droit. La visée ne tombe pas sur le poisson <strong>réel</strong> : le poisson n’est pas là où on le voit. Changez la profondeur du poisson avec les curseurs.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Pour toucher le poisson, où faut-il viser par rapport à l’endroit où on le voit ?', options: ['Plus bas : le poisson est plus profond qu’il ne paraît', 'Plus haut', 'Exactement là où on le voit', 'Sur la surface de l’eau'], bonne: 0, expl: 'La lumière est déviée à la surface : l’œil voit le poisson plus près de la surface qu’il ne l’est vraiment.' } },
    { id: 'vocab', titre: 'Le vocabulaire de la réfraction', depart: () => voirI('air', 'plexi', 50, true),
      texte: <>Un rayon lumineux (en <strong>orange</strong>) arrive sur la surface de séparation entre l’air (milieu 1) et le plexiglas (milieu 2). La droite perpendiculaire à la surface, en pointillé, est la <strong>normale</strong>. Une partie de la lumière est <strong>réfléchie</strong>, l’autre <strong>réfractée</strong> (en <strong>bleu</strong>, elle change de direction).
        <ExempleResolu>L’<strong>angle d’incidence i₁</strong> est mesuré entre le rayon incident et la <strong>normale</strong> (pas la surface !). L’<strong>angle de réfraction i₂</strong> est mesuré entre le rayon réfracté et la normale.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'L’angle d’incidence i₁ est l’angle entre…', options: ['le rayon incident et la normale', 'le rayon incident et la surface', 'le rayon incident et le rayon réfracté', 'le rayon réfracté et la surface'], bonne: 0, expl: 'Les angles se mesurent toujours par rapport à la normale.' } },
    { id: 'rapproche', titre: 'Air → eau : le rayon se rapproche', depart: () => voirI('air', 'eau', 50),
      texte: <>Chaque milieu transparent a un <strong>indice de réfraction n</strong> (sans unité, toujours ≥ 1) : sa « carte d’identité ». Pour l’air, n = 1,00. Quand la lumière passe dans un milieu d’indice <strong>plus grand</strong>, le rayon réfracté <strong>se rapproche de la normale</strong>.
        <ExempleResolu>Air (1,00) → eau (1,33) : i₁ = 50°, le rayon réfracté fait seulement 35° avec la normale : i₂ {'<'} i₁.
          {bouton('Voir air → eau', () => voirI('air', 'eau', 50))}</ExempleResolu>
        À vous : essayez avec le diamant (n = 2,42) et changez l’angle.</>,
      tache: { type: 'qcm', q: 'Un rayon passe de l’air à l’eau. Le rayon réfracté…', options: ['se rapproche de la normale', 's’écarte de la normale', 'ne change pas de direction', 'disparaît'], bonne: 0, expl: 'n augmente (1,00 → 1,33) : le rayon se rapproche de la normale (i₂ < i₁).' } },
    { id: 'ecarte', titre: 'Plexiglas → air : le rayon s’écarte', depart: () => voirI('plexi', 'air', 25),
      texte: <>Dans l’autre sens, de milieu 1 = plexiglas (1,51) vers milieu 2 = air (1,00), l’indice <strong>diminue</strong> : le rayon réfracté <strong>s’écarte de la normale</strong>.
        <ExempleResolu>i₁ = 25° dans le plexiglas, donc i₂ ≈ 39° dans l’air : i₂ {'>'} i₁.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Un rayon passe de l’eau à l’air. Le rayon réfracté…', options: ['s’écarte de la normale', 'se rapproche de la normale', 'ne change pas de direction', 'reste dans l’eau'], bonne: 0, expl: 'n diminue (1,33 → 1,00) : le rayon s’écarte de la normale.' } },
    { id: 'zero', titre: 'Un cas particulier : i₁ = 0°', depart: () => voirI('air', 'plexi', 0),
      texte: <>Si le rayon arrive <strong>le long de la normale</strong> (i₁ = 0°), il traverse la surface <strong>sans être dévié</strong> : i₂ = 0° aussi, quels que soient les milieux.</>,
      tache: { type: 'qcm', q: 'Un rayon arrive perpendiculairement à la surface de l’eau. Il…', options: ['n’est pas dévié', 'est dévié vers la normale', 'est dévié loin de la normale', 'est entièrement réfléchi'], bonne: 0, expl: 'i₁ = 0° donne i₂ = 0° : il continue tout droit.' } },
    { id: 'sinus', titre: 'Mesurer i₂ : une relation cachée', depart: () => voirM('plexi', 30),
      texte: <>Passons au <strong>TP</strong> : un laser éclaire un hémi-cylindre de plexiglas, on lit i₁ et i₂. Faites varier i₁ puis cliquez sur « Noter cette mesure ». Regardez le graphique : les points sont alignés avec l’origine quand on trace <strong>sin i₁ en fonction de sin i₂</strong>.
        <ExempleResolu>Mesures du TP : i₁ = 30° donne i₂ = 19,3° ; i₁ = 60° donne i₂ = 35,0°. Les angles ne sont <strong>pas</strong> proportionnels (30/19,3 ≠ 60/35,0), mais les sinus le sont : sin 30° / sin 19,3° = 0,500 / 0,331 = 1,51 et sin 60° / sin 35,0° = 0,866 / 0,574 = 1,51.</ExempleResolu></>,
      tache: { type: 'action', ok: enGuide && atelier === 'mesure' && pts.length >= 5, consigne: 'Notez au moins 5 mesures avec des angles d’incidence différents.' } },
    { id: 'indice', titre: 'En déduire l’indice du plexiglas', depart: null,
      texte: <>La pente de la droite sin i₁ = f(sin i₂) est l’<strong>indice de réfraction</strong> n du plexiglas (le milieu 1 est l’air, n₁ = 1,00). C’est la loi de <strong>Snell-Descartes</strong> : <strong>n₁ × sin i₁ = n₂ × sin i₂</strong>.</>,
      tache: { type: 'num', q: 'Une mesure donne i₁ = 60° et i₂ = 35,0°. Quel est l’indice n du plexiglas ? (n = sin i₁ / sin i₂)', unite: '', vrai: 1.51, tol: 0.02, affiche: x => String(x).replace('.', ','), pieges: [[1.71, 'Tu as divisé les angles. Il faut diviser les <strong>sinus</strong> : sin 60° / sin 35°.'], [0.66, 'Tu as inversé : n = sin i₁ / sin i₂.']], expl: 'n = sin 60° / sin 35,0° = 0,866 / 0,574 ≈ 1,51.' } },
    { id: 'snell', titre: 'Calculer un angle de réfraction', depart: () => voirI('air', 'eau', 40),
      texte: <>Avec n₁ et n₂ connus, on peut <strong>prévoir</strong> i₂ : sin i₂ = n₁ × sin i₁ / n₂, puis on utilise la touche <strong>sin⁻¹</strong> de la calculatrice (mode degrés).
        <ExempleResolu>Air → eau, i₁ = 40° : sin i₂ = 1,00 × sin 40° / 1,33 = 0,643 / 1,33 = 0,483, donc i₂ = <strong>28,9°</strong>.
          {bouton('Vérifier sur le schéma', () => voirI('air', 'eau', 40))}</ExempleResolu>
        À vous : air → verre d’indice 1,50, avec i₁ = 30°.</>,
      tache: { type: 'num', q: 'Quel est l’angle de réfraction i₂ (en degrés) ?', unite: '°', vrai: 19.47, tol: 0.02, affiche: x => String(x).replace('.', ','), pieges: [[20, 'Ne divise pas directement les angles (30 / 1,5) : ce sont les sinus qui sont reliés.'], [0.33, 'Tu as calculé sin i₂ : il faut ensuite appliquer sin⁻¹ pour obtenir l’angle.']], expl: 'sin i₂ = 1,00 × sin 30° / 1,50 = 0,333 ; i₂ = sin⁻¹(0,333) ≈ 19,5°.' } },
    { id: 'liquides', titre: 'L’eau et l’eau sucrée', depart: () => voirM('eau', 40),
      texte: <>Déterminez l’indice de l’<strong>eau</strong> puis de l’<strong>eau sucrée</strong> : mesurez au moins 3 angles pour chaque liquide (changez de liquide avec les boutons). Chaque liquide donne sa propre droite sur le graphique.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'mesure' && pts.filter(p => p.liq === 'eau').length >= 3 && pts.filter(p => p.liq === 'eausucree').length >= 3, consigne: 'Notez au moins 3 mesures pour l’eau et 3 pour l’eau sucrée.' } },
    { id: 'compare', titre: 'Lequel dévie le plus ?', depart: null,
      texte: <>Comparez les deux droites : la pente de l’eau sucrée est un peu plus grande que celle de l’eau. L’eau sucrée a donc un indice <strong>plus grand</strong> (1,36 contre 1,33).</>,
      tache: { type: 'qcm', q: 'Pour un même angle d’incidence, le rayon réfracté dans l’eau sucrée, par rapport à l’eau, est…', options: ['un peu plus proche de la normale (i₂ plus petit)', 'un peu plus loin de la normale (i₂ plus grand)', 'exactement identique', 'impossible à dire'], bonne: 0, expl: 'n plus grand : le rayon se rapproche davantage de la normale, donc i₂ est plus petit.' } },
    { id: 'tir', titre: '★ Quand il n’y a plus de rayon réfracté', depart: () => voirI('plexi', 'air', 50),
      texte: <>Dans le sens plexiglas → air, essayez i₁ = 50° : <strong>plus de rayon réfracté</strong> ! Au-delà d’un <strong>angle limite</strong> (41,5° ici), toute la lumière est réfléchie : c’est la <strong>réflexion totale</strong> (hors programme de Seconde : vous la reverrez en Première, c’est le principe des fibres optiques).
        <ExempleResolu>Elle ne se produit que si la lumière va d’un milieu à un indice <strong>plus faible</strong> (n₁ {'>'} n₂), et seulement au-delà de l’angle limite : sin i<sub>lim</sub> = n₂ / n₁.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Peut-on observer une réflexion totale pour un rayon qui passe de l’air au plexiglas ?', options: ['Non : l’indice augmente, le rayon réfracté existe toujours', 'Oui, pour un grand angle d’incidence', 'Oui, à partir de 41,5°', 'Oui, à tous les angles'], bonne: 0, expl: 'La réflexion totale n’existe que de l’indice le plus grand vers le plus petit.' } },
    { id: 'pecheur2', titre: 'Retour au pêcheur', depart: () => setAtelier('pecheur'),
      texte: <>On peut maintenant tout expliquer : la lumière issue du poisson passe de l’eau (n = 1,33) à l’air (n = 1,00) : elle <strong>s’écarte de la normale</strong>. L’œil prolonge en ligne droite ce rayon : il voit le poisson à un autre endroit que celui où il est vraiment.</>,
      tache: { type: 'qcm', q: 'Pourquoi le pêcheur manque-t-il facilement le poisson ?', options: ['La lumière change de direction à la surface eau/air : le poisson n’est pas là où il paraît', 'Le poisson bouge trop vite', 'L’eau absorbe toute la lumière', 'Le poisson est une source primaire de lumière'], bonne: 0, expl: 'La réfraction à la surface eau/air déplace l’image du poisson : il est plus profond qu’il ne paraît.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Réfraction : la lumière <strong>change de direction</strong> en passant d’un milieu à un autre (sauf si i₁ = 0°). Les angles se mesurent avec la <strong>normale</strong>.</li>
        <li><strong>n₁ sin i₁ = n₂ sin i₂</strong> (Snell-Descartes). n<sub>air</sub> = 1,00.</li>
        <li>n augmente → le rayon <strong>se rapproche</strong> de la normale ; n diminue → il <strong>s’écarte</strong>.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { const d = nouveauDefi(type); setDefi(d); if (type === 'indice') { setAtelier('mesure'); setMe({ liq: 'inconnu', i1: 30, reveler: false }); setPts([]); } }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'calcul'); else if (md === 'explore') setAtelier('interface'); }

  const i2mes = mesurerI2(nLiq, Me.i1);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Milieux transparents et homogènes</strong>, surface de séparation <strong>plane et parfaite</strong> : la lumière se propage en <strong>ligne droite</strong> dans chaque milieu (modèle du rayon lumineux).</li>
      <li><strong>Indices à 589 nm</strong> (lumière jaune) : l’indice dépend un peu de la couleur (dispersion), ce qui n’est pas modélisé ici. Valeurs tabulées : air 1,00 ; eau 1,33 ; eau sucrée à 20 % 1,36 ; glycérol 1,47 ; plexiglas 1,51 ; diamant 2,42.</li>
      <li><strong>Rayon réfléchi</strong> : l’angle de réflexion est égal à l’angle d’incidence (autre loi de Descartes). Son <strong>intensité</strong> n’est pas modélisée : on le dessine toujours en pointillés, sauf en réflexion totale.</li>
      <li><strong>Mesure d’angles</strong> : lecture au <strong>demi-degré</strong> près, comme sur un rapporteur. L’indice trouvé est donc connu à environ 0,02 près ; l’exploitation graphique (pente) limite l’effet de ces erreurs.</li>
      <li><strong>Pêcheur</strong> : poisson ponctuel, surface calme et plane, un seul œil, plan vertical. Le harpon, lui, n’est pas dévié en entrant dans l’eau.</li>
      <li><strong>Réflexion totale</strong> : hors programme de Seconde, signalée à titre de curiosité quand le modèle la prévoit.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const enDefiIndice = enDefi && defi.type === 'indice';
  const curs = (nom, val, min, max, pas, set, unite) => <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>{nom} : <strong>{val}{unite}</strong>
    <input type="range" min={min} max={max} step={pas} value={val} aria-label={nom} onChange={e => set(+e.target.value)} style={{ width: '100%' }}/></label>;
  const noter = () => setPts(p => [...p, { liq: Me.liq, i1: Me.i1, i2: i2mes }].slice(-24));
  const mesurePanel = (
    <div>
      <Interface n1={1} n2={nLiq} i1={Me.i1} nom1="air" nom2={LIQ.find(l => l[0] === Me.liq)[1]} masqueN={!Me.reveler} leg={false}/>
      <div style={{ marginTop: 8 }}>{curs('Angle d’incidence i₁', Me.i1, 0, 85, 5, v => setMe(m => ({ ...m, i1: v })), '°')}</div>
      <div style={{ marginTop: 4, fontSize: 14.5, color: KIT.txt }}>Lecture au rapporteur : i₁ = <strong>{Me.i1}°</strong>, i₂ = <strong>{fr(i2mes, 1)}°</strong>
        <button onClick={noter} style={{ ...styleBouton(true, '#16a34a'), marginLeft: 8 }}><Pic n="plus"/>Noter cette mesure</button></div>
      {!enDefiIndice && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Liquide :</span>
        {LIQ.filter(l => l[0] !== 'inconnu').map(([k, l]) => <button key={k} onClick={() => setMe(m => ({ ...m, liq: k }))} style={stylePetitBouton(Me.liq === k, COUL_LIQ[k])}>{l}</button>)}
        <button onClick={() => setMe(m => ({ ...m, reveler: !m.reveler }))} style={stylePetitBouton(Me.reveler, '#334155')}>{Me.reveler ? 'Cacher' : 'Révéler'} l’indice</button></div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 8, alignItems: 'start' }}>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
          <thead><tr>{['Liquide', 'i₁ (°)', 'i₂ (°)', 'sin i₁', 'sin i₂'].map(h => <th key={h} style={{ padding: '3px 5px', color: KIT.txt2, textAlign: 'right', borderBottom: `1px solid ${KIT.bord}` }}>{h}</th>)}</tr></thead>
          <tbody>{pts.length === 0 && <tr><td colSpan="5" style={{ padding: 6, color: KIT.txt2 }}>Aucune mesure notée.</td></tr>}{pts.map((p, k) => <tr key={k}><td style={{ padding: '2px 5px', textAlign: 'right', color: COUL_LIQ[p.liq], fontWeight: 700 }}>{LIQ.find(l => l[0] === p.liq)[1]}</td><td style={{ padding: '2px 5px', textAlign: 'right' }}>{p.i1}</td><td style={{ padding: '2px 5px', textAlign: 'right' }}>{fr(p.i2, 1)}</td><td style={{ padding: '2px 5px', textAlign: 'right' }}>{g3(sin(p.i1))}</td><td style={{ padding: '2px 5px', textAlign: 'right' }}>{g3(sin(p.i2))}</td></tr>)}</tbody></table>
          <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><button onClick={() => setPts([])} style={styleBouton(false)}><Pic n="trash"/>Effacer</button>
            {[...new Set(pts.map(p => p.liq))].map(l => { const k = pente(pts.filter(p => p.liq === l).map(p => [sin(p.i2), sin(p.i1)])); return <span key={l} style={{ fontSize: 13.5, fontWeight: 700, color: COUL_LIQ[l] }}>pente ({LIQ.find(x => x[0] === l)[1]}) = {isFinite(k) ? fr(k, 2) : '—'}</span>; })}</div></div>
        <Graphe pts={pts}/></div>
    </div>);
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['interface', '🔦 Rayon et surface'], ['mesure', '📏 Mesurer un indice (TP)'], ['pecheur', '🎣 Le pêcheur']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'interface' && <>
        <Interface n1={n1} n2={n2} i1={A.i1} nom1={milieu(A.m1).nom} nom2={milieu(A.m2).nom} leg={A.leg}/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Milieu 1 :</span>
          {MILIEUX.map(m => <button key={m.id} onClick={() => setA(a => ({ ...a, m1: m.id }))} style={stylePetitBouton(A.m1 === m.id, '#0f766e')}>{m.nom}</button>)}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Milieu 2 :</span>
          {MILIEUX.map(m => <button key={m.id} onClick={() => setA(a => ({ ...a, m2: m.id }))} style={stylePetitBouton(A.m2 === m.id, '#0f766e')}>{m.nom}</button>)}</div>
        <div style={{ marginTop: 6 }}>{curs('Angle d’incidence i₁', A.i1, 0, 89, 1, v => setA(a => ({ ...a, i1: v })), '°')}</div>
        <div style={{ marginTop: 4, fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>n₁ × sin i₁ = {fr(n1, 2)} × {g3(sin(A.i1))} = <strong>{g3(n1 * sin(A.i1))}</strong>
          {refraction(n1, n2, A.i1) != null ? <> ; n₂ × sin i₂ = {fr(n2, 2)} × {g3(sin(refraction(n1, n2, A.i1)))} = <strong>{g3(n2 * sin(refraction(n1, n2, A.i1)))}</strong> (i₂ = {fr(refraction(n1, n2, A.i1), 1)}°)</> : <span style={{ color: ORANGE, fontWeight: 700 }}> ; pas d’angle i₂ possible (réflexion totale).</span>}</div></>}
      {atelier === 'mesure' && mesurePanel}
      {atelier === 'pecheur' && <><Pecheur P={Pe}/><div style={{ marginTop: 8 }}>
        {curs('Profondeur du poisson', Pe.d, 40, 150, 5, v => setPe(p => ({ ...p, d: v })), ' cm')}{curs('Distance du poisson', Pe.xf, 220, 420, 10, v => setPe(p => ({ ...p, xf: v })), ' cm')}{curs('Hauteur de l’œil', Pe.h, 60, 150, 5, v => setPe(p => ({ ...p, h: v })), ' cm')}</div>
        <div style={{ marginTop: 4, fontSize: 14.5, color: KIT.txt }}>Angle dans l’eau : <strong>{fr(pecheur({ xf: Pe.xf, d: Pe.d, xe: 80, h: Pe.h }).tw, 1)}°</strong> ; dans l’air : <strong>{fr(pecheur({ xf: Pe.xf, d: Pe.d, xe: 80, h: Pe.h }).ta, 1)}°</strong>. La visée passe à <strong>{fr(Math.abs(pecheur({ xf: Pe.xf, d: Pe.d, xe: 80, h: Pe.h }).rate), 0)} cm</strong> du poisson réel.</div></>}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Air → diamant : que remarquez-vous sur l’angle i₂ par rapport à air → eau ?</li>
        <li>Échangez les milieux (eau → air) et augmentez i₁ : à partir de quel angle le rayon réfracté disparaît-il ?</li>
        <li>Vérifiez que n₁ sin i₁ et n₂ sin i₂ sont toujours égaux.</li>
        <li>Dans « Mesurer un indice », trouvez l’indice du plexiglas par la pente, puis révélez-le pour comparer.</li>
        <li>Pêcheur : où faut-il viser si le poisson est près du bord, ou très profond ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>n₁ sin i₁ = n₂ sin i₂ ; n<sub>air</sub> = 1,00</li><li>n augmente → on se rapproche de la normale</li><li>i₁ = 0° → pas de déviation</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rf-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rf-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .rf-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .rf-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Réfraction de la lumière : lois de Snell-Descartes</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Pourquoi un crayon paraît-il « cassé » dans un verre d’eau, et pourquoi rate-t-on un poisson au harpon ? Étudiez la <strong>réfraction</strong>, mesurez un <strong>indice</strong> et retrouvez la <strong>loi de Snell-Descartes</strong>.</div>
      <div className={`rf-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} changerType={lancer}/></div>}
          {enDefiIndice && <div style={styleBoite}>{mesurePanel}</div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="rf-l2">{panneauHypo}</div>}
      {enExplore && <div className="rf-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
