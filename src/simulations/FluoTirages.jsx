// Schémas et commandes des tirages de la simulation 301 : diagramme à sous-niveaux de vibration + histogramme qui se remplit photon après photon.
// Rien n'est codé par la seule couleur : styles de trait (plein, tirets), hachures et noms écrits à côté des flèches.
import { K, T } from "./schemaOutils";
import * as X from "./fluoTirages";
import { styleBouton, KIT } from "../commun";

const COL = { abs: '#7c3aed', fluo: '#15803d', phos: '#b91c1c', cis: '#c2410c', nr: '#64748b' };
const NB = ' ';
const Y0 = 222, Y1 = 112, DV = 9, YT = 158, XL = 48, XR = 326;      // bas de S₀, bas de S₁, écart entre sous-niveaux, niveau T₁, bornes des échelles
const yS0 = v => Y0 - DV * v, yS1 = v => Y1 - DV * v;

const fl = (x, y1, y2, col, w, op, dash, id) => {
  const s = y2 < y1 ? -1 : 1, L = 8;
  return (<g key={id} opacity={op}><line x1={x} y1={y1} x2={x} y2={y2 - s * 5} stroke={col} strokeWidth={w} strokeDasharray={dash}/>
    <polygon points={`${x},${y2} ${x - 4.2},${y2 - s * L} ${x + 4.2},${y2 - s * L}`} fill={col}/></g>);
};
const echelle = (x1, x2, yf, id, gras) => Array.from({ length: X.NV }, (_, v) => <line key={id + v} x1={x1} x2={x2} y1={yf(v)} y2={yf(v)} stroke={v === 0 || gras ? '#0f172a' : '#94a3b8'} strokeWidth={v === 0 ? 2.6 : 1.1}/>);

// ---------- diagramme : les flèches possibles sont pâles, celles du dernier photon sont épaisses ----------
export function SceneVibronique({ mol, dernier = null }) {
  const d = dernier, abs = d?.absorbe, vAbs = d?.vAbs, voie = d?.voie;
  const lit = (cond) => (cond ? 1 : 0.2), ep = (cond, w = 2) => (cond ? w + 1.6 : w);
  const aT = !!mol.T;
  return (<svg role="img" aria-label="Diagramme à sous-niveaux de vibration : absorption de S0 vers S1, relaxation vibrationnelle, fluorescence vers les sous-niveaux de S0, et pour la molécule phosphorescente croisement intersystème et phosphorescence. Les flèches du dernier photon sont en trait épais." viewBox="0 52 370 200" width="100%" style={{ display: 'block', maxWidth: 480, margin: '0 auto' }}>
    {T(42, Y0 + 4, 'S₀', { anchor: 'end', size: 14, gras: true })}{T(42, Y1 + 4, 'S₁', { anchor: 'end', size: 14, gras: true })}
    {echelle(XL, XR, yS0, 's0')}{echelle(XL, XR, yS1, 's1')}
    {T(XR + 4, yS0(0) + 4, 'v = 0', { anchor: 'start', size: 13.5, fill: K.gris })}{T(XR + 4, yS0(4) + 4, 'v = 4', { anchor: 'start', size: 13.5, fill: K.gris })}
    {T(XR + 4, yS1(0) + 4, 'v′ = 0', { anchor: 'start', size: 13.5, fill: K.gris })}{T(XR + 4, yS1(4) + 4, 'v′ = 4', { anchor: 'start', size: 13.5, fill: K.gris })}
    {aT && <g><line x1="130" x2="215" y1={YT} y2={YT} stroke="#0f172a" strokeWidth="2.6"/>{T(124, YT + 4, 'T₁', { anchor: 'end', size: 14, gras: true })}</g>}
    {Array.from({ length: X.NV }, (_, v) => fl(58 + 14 * v, Y0 - 2, yS1(v) + 1, COL.abs, ep(abs && vAbs === v), lit(abs && vAbs === v), null, 'a' + v))}
    {T(54, Y0 + 24, 'absorption', { anchor: 'start', size: 13, fill: COL.abs, gras: true })}
    {fl(128, yS1(4), yS1(0) - 1, COL.nr, ep(abs && vAbs > 0, 1.8), lit(abs && vAbs > 0), '3 3', 'rv')}{T(134, 96, 'RV', { anchor: 'start', size: 13.5, fill: COL.nr, gras: true })}
    {aT && fl(150, Y1 + 3, YT - 3, COL.cis, ep(voie === 'phos' || voie === 'nrT', 1.8), lit(voie === 'phos' || voie === 'nrT'), '5 3', 'cis')}{aT && T(158, 138, 'CIS', { anchor: 'start', size: 13.5, fill: COL.cis, gras: true })}
    {Array.from({ length: X.NV }, (_, v) => fl(246 + 14 * v, Y1 + 2, yS0(v) - 1, COL.fluo, ep(voie === 'fluo' && d.v === v), lit(voie === 'fluo' && d.v === v), null, 'f' + v))}
    {T(242, Y0 + 24, 'fluorescence', { anchor: 'start', size: 13, fill: COL.fluo, gras: true })}
    {aT && Array.from({ length: X.NV }, (_, v) => fl(134 + 12 * v, YT + 2, yS0(v) - 1, COL.phos, ep(voie === 'phos' && d.v === v), lit(voie === 'phos' && d.v === v), '6 3', 'p' + v))}
    {aT && T(130, Y0 + 24, 'phosphorescence', { anchor: 'start', size: 13, fill: COL.phos, gras: true })}
    {fl(226, Y1 + 3, yS0(4) - 3, COL.nr, ep(voie === 'nr', 1.6), lit(voie === 'nr'), '2 3', 'nr')}{T(220, 150, 'chaleur', { anchor: 'end', size: 13.5, fill: COL.nr, gras: true })}
    {aT && fl(214, YT + 2, yS0(4) - 3, COL.nr, ep(voie === 'nrT', 1.6), lit(voie === 'nrT'), '2 3', 'nrt')}
    {T(8, 66, 'E', { anchor: 'start', size: 13, gras: true })}{T(22, 66, '(écarts non à l’échelle)', { anchor: 'start', size: 13.5, fill: K.gris })}
  </svg>);
}

// ---------- histogramme ----------
const X0 = 46, X1 = 350, PH = 118, YB = 150;
const xl = lam => X0 + (lam - X.BORNES.lam0) / (X.BORNES.lam1 - X.BORNES.lam0) * (X1 - X0);
const nice = m => { const e = 10 ** Math.floor(Math.log10(m)), f = m / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; };
export function SceneHistogramme({ etat, params, mol, courbe = false }) {
  const exc = params.mode === 'excitation';
  const serie = exc ? [etat.ex] : [etat.fl, etat.ph];
  const att = courbe ? X.attendu(mol, params, etat) : null;
  const mx = Math.max(4, ...etat.fl, ...etat.ph, ...etat.ex, ...(att ?? [])), ymax = nice(mx * 1.15);
  const bw = (X1 - X0) / X.NBINS, yv = c => YB - PH * c / ymax;
  const total = exc ? etat.ex.reduce((a, b) => a + b, 0) : etat.nFl + etat.nPh;
  const x1 = (lam) => xl(lam);
  return (<svg role="img" aria-label={`Histogramme ${exc ? 'du spectre d’excitation' : 'du spectre d’émission'} : ${total} photons détectés`} viewBox="0 0 370 200" width="100%" style={{ display: 'block', maxWidth: 480, margin: '0 auto' }}>
    <defs><pattern id="fl-hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke={COL.phos} strokeWidth="2.4"/></pattern></defs>
    {T(X0 - 6, 12, 'coups', { anchor: 'start', size: 13, fill: K.gris, gras: true })}
    <line x1={X0} y1={YB} x2={X1} y2={YB} stroke={K.gris}/><line x1={X0} y1={YB} x2={X0} y2={YB - PH - 4} stroke={K.gris}/>
    {(ymax < 10 ? [0, ymax] : [0, ymax / 2, ymax]).map(c => <g key={c}><line x1={X0 - 4} y1={yv(c)} x2={X0} y2={yv(c)} stroke={K.gris}/>{T(X0 - 7, yv(c) + 4, String(Math.round(c)), { anchor: 'end', size: 13.5, fill: K.gris })}</g>)}
    {[300, 400, 500, 600].map(l => <g key={l}><line x1={xl(l)} y1={YB} x2={xl(l)} y2={YB + 5} stroke={K.gris}/>{T(xl(l), YB + 18, String(l), { size: 13.5, fill: K.gris })}</g>)}
    {T(X1, YB + 34, 'longueur d’onde (nm)', { anchor: 'end', size: 13.5, fill: K.gris })}
    {exc && <g><rect x={xl(params.lamEm - X.FENETRE)} y={YB - PH - 2} width={xl(params.lamEm + X.FENETRE) - xl(params.lamEm - X.FENETRE)} height={PH + 2} fill="none" stroke={K.txt} strokeWidth="1.5" strokeDasharray="4 3"/>{T(xl(params.lamEm), 22, 'détection', { size: 13.5, gras: true })}{T(xl(params.lamEm), 34, `${Math.round(params.lamEm)}${NB}nm`, { size: 13.5 })}</g>}
    {!exc && <g><line x1={x1(params.lamExc)} y1={YB} x2={x1(params.lamExc)} y2={42} stroke={COL.abs} strokeWidth="2" strokeDasharray="4 3"/>{T(x1(params.lamExc), 24, 'excitation', { size: 13.5, gras: true, fill: COL.abs })}{T(x1(params.lamExc), 36, `${Math.round(params.lamExc)}${NB}nm`, { size: 13.5, fill: COL.abs })}</g>}
    {serie.map((s, k) => s.map((c, i) => c > 0 && <rect key={`${k}-${i}`} x={X0 + i * bw + 0.3} y={yv(c)} width={bw - 0.6} height={YB - yv(c)} fill={exc ? COL.abs : k === 0 ? COL.fluo : 'url(#fl-hach)'} stroke={exc ? COL.abs : k === 0 ? COL.fluo : COL.phos} strokeWidth="0.6"/>))}
    {att && <path d={att.map((c, i) => `${i ? 'L' : 'M'}${(X0 + (i + 0.5) * bw).toFixed(1)},${yv(c).toFixed(1)}`).join('')} fill="none" stroke={K.txt} strokeWidth="1.6" strokeDasharray="2 3"/>}
    {total === 0 && T((X0 + X1) / 2, YB - PH / 2, 'aucun photon détecté pour l’instant', { size: 13.5, fill: K.gris })}
  </svg>);
}

export function CommandesTirages({ tir, couleur = '#16a34a' }) {
  const b = (k) => <button key={k} onClick={() => tir.lancer(k)} disabled={tir.plein} style={{ ...styleBouton(false), opacity: tir.plein ? 0.5 : 1 }}>{k === 1 ? '1 photon' : `× ${k}`}</button>;
  return (<div>
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Envoyer des photons</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[1, 10, 100, 1000].map(b)}
      <button onClick={() => tir.setLecture(l => !l)} disabled={tir.plein} aria-pressed={tir.lecture} style={styleBouton(tir.lecture, couleur)}>{tir.lecture ? '⏸ Pause' : '▶ Lecture'}</button>
      <button onClick={() => { tir.setLecture(false); tir.effacer(); }} style={styleBouton(false)}>Effacer</button>
    </div>
    {tir.plein && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Maximum atteint ({X.MAX_PHOTONS.toLocaleString('fr-FR')} photons) : effacez pour recommencer.</div>}
  </div>);
}
