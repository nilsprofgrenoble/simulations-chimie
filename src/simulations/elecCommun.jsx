import { useId } from "react";
import { pointsSurFil, VERMILLON, BLEU, GRIS, VERT } from "./elecOutils";
import { useSuivi } from "../suivi";
import { KIT, styleBouton, stylePetitBouton, lireProgression, avecIndices } from "../commun";
import { Pic } from "../Pictos";

// Éléments communs aux simulations d'électricité (68 à 72) : volet de défis générique, curseur, graphe, dessin de circuit.

export function Curseur({ nom, val, min, max, pas, set, unite, fmt }) {
  return (
    <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block' }}>{nom} : <strong>{fmt ? fmt(val) : String(val).replace('.', ',')}{unite}</strong>
      <input type="range" min={min} max={max} step={pas} value={val} aria-label={nom} onChange={e => set(+e.target.value)} style={{ width: '100%' }}/></label>);
}

// Volet de défis : le défi est un objet { type, reps, verifie, solution, …données du tirage }
//  evaluer(d) → { ok, lignes: [[ok, texte]] } ; enonce(d, outils) → JSX ; solution(d) → JSX
export function VoletDefiGen({ SIM, titres, defi, setDefi, changerType, evaluer, enonce, solution, couleur = '#0ea5e9' }) {
  const res = defi.verifie ? evaluer(defi) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const champ = (k, unite) => <label style={{ fontSize: 14, fontWeight: 600 }}>Réponse : <input value={defi.reps[k] || ''} onChange={e => rep(k, e.target.value)} inputMode="decimal" aria-label="Votre réponse" style={{ width: 90, padding: '5px 8px', fontSize: 15, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/> {unite}</label>;
  const choix = (k, liste) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{liste.map(([v, l]) => <button key={v} onClick={() => rep(k, v)} style={stylePetitBouton(defi.reps[k] === v, couleur)}>{l}</button>)}</div>;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(titres).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, couleur)}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      <div style={{ fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>{enonce(defi, { champ, choix })}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? VERT : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {avecIndices(t)}</div>)}
        {res.ok && <div style={{ color: VERT, fontWeight: 700, marginTop: 4 }}><Pic n="party"/>Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: 'rgb(240,249,255)', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>{solution(defi)}</div>}
    </div>);
}

// ---------- graphe cartésien simple ----------
const pasJoli = max => { const b = Math.pow(10, Math.floor(Math.log10(max / 4))), r = max / 4 / b; return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * b; };
const nf = v => String(Math.round(v * 1e6) / 1e6).replace('.', ',');
// pts : [[x,y]] ; courbe : [[x,y]] (trait continu) ; droite : {a,b} ; séries : [{pts, couleur}] (en plus de pts)
export function Graphe({ pts = [], series = [], courbe, droite, xmax, ymax, xlab, ylab, couleur = BLEU, rayon = 4.5, w = 440, h = 300, ymin = 0, titre }) {
  const L = 62, T = 14, Rr = 14, Bm = 44, pw = w - L - Rr, ph = h - T - Bm;
  const X = x => L + (x / xmax) * pw, Y = y => T + ph - ((y - ymin) / (ymax - ymin)) * ph;
  const sx = pasJoli(xmax), sy = pasJoli(ymax - ymin);
  const tx = [], ty = [];
  for (let v = 0; v <= xmax + 1e-9; v += sx) tx.push(v);
  for (let v = Math.ceil(ymin / sy) * sy; v <= ymax + 1e-9; v += sy) ty.push(v);
  const toutes = [{ pts, couleur }, ...series], cid = useId().replace(/:/g, '');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={titre || `Graphe ${ylab} en fonction de ${xlab}`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: w }}>
      {tx.map(v => <g key={'x' + v}><line x1={X(v)} y1={T} x2={X(v)} y2={T + ph} stroke="#e2e8f0"/><text x={X(v)} y={T + ph + 15} fontSize="11.5" textAnchor="middle" fill={GRIS}>{nf(v)}</text></g>)}
      {ty.map(v => <g key={'y' + v}><line x1={L} y1={Y(v)} x2={L + pw} y2={Y(v)} stroke="#e2e8f0"/><text x={L - 6} y={Y(v) + 4} fontSize="11.5" textAnchor="end" fill={GRIS}>{nf(v)}</text></g>)}
      <line x1={L} y1={T} x2={L} y2={T + ph} stroke="#0f172a" strokeWidth="1.8"/><line x1={L} y1={T + ph} x2={L + pw} y2={T + ph} stroke="#0f172a" strokeWidth="1.8"/>
      <text x={L + pw / 2} y={h - 6} fontSize="13" fontWeight="700" textAnchor="middle" fill="#0f172a">{xlab}</text>
      <text transform={`translate(13 ${T + ph / 2}) rotate(-90)`} fontSize="13" fontWeight="700" textAnchor="middle" fill="#0f172a">{ylab}</text>
      <clipPath id={cid}><rect x={L} y={T} width={pw} height={ph}/></clipPath>
      {courbe && <polyline clipPath={`url(#${cid})`} fill="none" stroke={GRIS} strokeWidth="2.5" points={courbe.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')}/>}
      {droite && <line clipPath={`url(#${cid})`} x1={X(0)} y1={Y(droite.b)} x2={X(xmax)} y2={Y(droite.a * xmax + droite.b)} stroke={VERMILLON} strokeWidth="2.2" strokeDasharray="7 5"/>}
      {toutes.map((s, i) => s.pts.map(([x, y], k) => <circle key={i + '-' + k} cx={X(x)} cy={Y(y)} r={rayon} fill={s.couleur} stroke="#fff" strokeWidth="1"/>))}
    </svg>);
}

// ---------- circuit : phase d'animation et fil à charges mobiles ----------
export function Fil({ pts, v, ph, rayon = 4.5, couleur = VERMILLON, esp = 24 }) {
  return <g>
    <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round"/>
    {pointsSurFil(pts, v, ph, esp).map((p, k) => <circle key={k} cx={p[0]} cy={p[1]} r={rayon} fill={couleur} stroke="#fff" strokeWidth="1"/>)}
  </g>;
}
// Résistor (rectangle normalisé) horizontal centré en (cx, cy)
export function Resistor({ cx, cy, w = 70, h = 26, nom, val, couleur = '#0f172a' }) {
  return <g>
    <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="#fff" stroke={couleur} strokeWidth="3"/>
    <text x={cx} y={cy - h / 2 - 7} fontSize="14" fontWeight="800" textAnchor="middle" fill={couleur}>{nom}</text>
    {val && <text x={cx} y={cy + 5} fontSize="13" fontWeight="700" textAnchor="middle" fill="#0f172a">{val}</text>}
  </g>;
}
// Pile / générateur : symbole vertical centré en (cx, cy), borne + en haut
export function Pile({ cx, cy, nom, lab }) {
  return <g>
    <rect x={cx - 22} y={cy - 22} width="44" height="44" fill="#fff"/>
    <line x1={cx - 20} y1={cy - 8} x2={cx + 20} y2={cy - 8} stroke="#0f172a" strokeWidth="4"/>
    <line x1={cx - 11} y1={cy + 8} x2={cx + 11} y2={cy + 8} stroke="#0f172a" strokeWidth="6"/>
    <text x={cx - 26} y={cy - 12} fontSize="16" fontWeight="800" textAnchor="end" fill={VERMILLON}>+</text>
    <text x={cx - 26} y={cy + 20} fontSize="18" fontWeight="800" textAnchor="end" fill={BLEU}>−</text>
    <text x={cx + 26} y={cy - 2} fontSize="14" fontWeight="800" fill="#0f172a">{nom}</text>
    {lab && <text x={cx + 26} y={cy + 15} fontSize="13" fontWeight="700" fill="#0f172a">{lab}</text>}
  </g>;
}
// Étiquette de mesure (valeur lue sur un multimètre)
export function Mesure({ x, y, nom, val, couleur = VERMILLON, w = 112 }) {
  return <g>
    <rect x={x - w / 2} y={y - 13} width={w} height="26" rx="6" fill="#fff" stroke={couleur} strokeWidth="2"/>
    <text x={x} y={y + 5} fontSize="13.5" fontWeight="800" textAnchor="middle" fill={couleur}>{nom} = {val}</text>
  </g>;
}
