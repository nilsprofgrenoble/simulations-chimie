// Vue « Du photon au spectre » de la simulation 301 : trois panneaux visibles en même temps.
// ① le montage (vue de dessus), ② la molécule : diagramme d'énergie À L'ÉCHELLE (longueur des flèches = énergie du photon ;
// épaisseur des niveaux = largeur des raies), ③ le spectre : en haut « ce qui est fixé », en bas « ce qui est enregistré ».
// Deux façons de mesurer : intensité (balayage, courbe) ou comptage des photons un par un (histogramme).
// Deux réglages physiques : conditions (raies / structure / bande) et bande passante des fentes.
import { useState, useEffect, useRef } from "react";
import { K, T } from "./schemaOutils";
import * as X from "./fluoTirages";
import * as D from "./fluoDispositif";
import { reduitMouvement } from "./hookHorloge";
import { KIT, stylePetitBouton, styleBouton, Section } from "../commun";

const NB = ' ';
const fr2 = v => v.toFixed(2).replace('.', ',').replace('-', '−');
const nm = l => `${Math.round(l)}${NB}nm`;
const eV = l => `${fr2(X.HC / l)}${NB}eV`;
const COLC = { abs: '#7c3aed', ex: '#7c3aed', em: '#15803d', ph: '#b91c1c' };
const MODES = [['abs', 'Absorption'], ['em', 'Émission'], ['ex', 'Excitation'], ['ph', 'Phosphorescence']];
const SCAN = D.SCAN, FIXE = { em: [290, 420], ph: [290, 420], ex: [380, 600] };
const DUREE = 14000, PAS_AFF = 2;                                   // balayage lent ; l'affichage avance par pas de 2 nm
const ETAPES = {
  abs: ['On balaie la longueur d’onde de la lampe.', 'À chaque λ, on compare la lumière avant la cuve (I₀) et après (I).', 'On trace A = log(I₀ / I) : le spectre d’absorption.'],
  em: ['On fixe l’excitation dans la bande d’absorption (en haut).', 'On balaie le monochromateur de détection.', 'On trace l’intensité émise à chaque λ : le spectre d’émission.'],
  ex: ['On fixe la détection sur une couleur émise (λ dét., en haut).', 'On balaie la longueur d’onde de la lampe : la molécule émet toujours la même bande, plus ou moins intense.', 'On trace la hauteur lue à λ dét. : elle suit l’absorption.'],
  ph: ['Un flash de 350 nm excite l’échantillon, puis la lampe s’éteint.', 'On attend un court délai (frise du montage) : la fluorescence, qui dure quelques ns, est déjà finie.', 'On balaie la détection pendant que T₁ se vide : on enregistre le spectre de phosphorescence seul.'],
};
const ETAPES_C = {
  em: ['On fixe l’excitation (en haut).', 'Chaque photon émis traverse le réseau et tombe sur le pixel de sa longueur d’onde.', 'Chaque pixel compte ses photons : le spectre se construit.'],
  ex: ['On fixe la fenêtre de détection (en haut).', 'La lampe envoie des photons de longueur d’onde variée.', 'Un coup est compté à λ d’excitation chaque fois qu’un photon émis passe la fenêtre.'],
  ph: ['Lampe coupée : les molécules restées dans T₁ émettent.', 'Chaque photon tombe sur le pixel de sa longueur d’onde.', 'Les coups dessinent le spectre de phosphorescence.'],
};
const marquer = (pts, a, b, lo, pas) => { const o = { ...pts }; const i1 = Math.round((Math.min(a, b) - lo) / pas), i2 = Math.round((Math.max(a, b) - lo) / pas); for (let i = Math.max(0, i1); i <= i2; i++) o[i] = 1; return o; };
const plein = (mode, pas) => marquer({}, SCAN[mode][0], SCAN[mode][1], SCAN[mode][0], pas);
const COMPTE0 = { n: 0, nAbs: 0, coups: {}, dernier: null };

// ---------- petits dessins ----------
const flecheV = (x, y1, y2, col, w, dash, k) => { const s = y2 < y1 ? 1 : -1;
  return <g key={k}><line x1={x} y1={y1} x2={x} y2={y2 + s * 9} stroke={col} strokeWidth={w} strokeDasharray={dash}/><polygon points={`${x},${y2} ${x - 6},${y2 + s * 12} ${x + 6},${y2 + s * 12}`} fill={col}/></g>; };
const ondule = (x, y1, y2, col, k) => { if (Math.abs(y2 - y1) < 6) return null; let d = `M${x},${y1}`; const n = Math.max(2, Math.floor(Math.abs(y2 - y1) / 6)), dy = (y2 - y1) / n;
  for (let i = 1; i <= n; i++) d += ` L${x + (i % 2 ? 4 : -4)},${y1 + dy * i}`;
  return <g key={k}><path d={d} fill="none" stroke={col} strokeWidth="1.8"/><polygon points={`${x},${y2 + 1} ${x - 4},${y2 - 7} ${x + 4},${y2 - 7}`} fill={col}/></g>; };

// ---------- ① le montage ----------
function Montage({ mode, mol, lamExc, lamDet, sig, A, comptage, nCoups, opt }) {
  const abs = mode === 'abs', ph = mode === 'ph', cExc = D.couleurLam(lamExc ?? 350), cDet = D.couleurLam(lamDet ?? 450);
  const lamGlow = ph ? X.lamDe(mol.T.E00 - 2 * mol.hw) : X.lamMaxEmission(mol), cGlow = D.couleurLam(lamGlow);
  const glow = ph ? 0.6 : abs ? 0.35 * D.absRel(mol, lamExc, opt) : D.absRel(mol, lamExc ?? 350, opt);
  const trans = abs ? Math.max(0.12, 10 ** -A) : 0.9;
  const off = 0.3, CX = 226, CY = 120, spectro = comptage && mode !== 'ex';
  const lcd = (x, y, txt, on) => <g opacity={on ? 1 : off}><rect x={x} y={y} width="96" height="30" rx="6" fill="#0f172a"/>{T(x + 48, y + 21, txt, { size: 17, gras: true, fill: '#86efac' })}</g>;
  return (<svg role="img" viewBox="0 44 400 290" style={{ display: 'block', width: '100%' }}
    aria-label={`Montage vu de dessus. ${ph ? 'Lampe coupée.' : `Excitation à ${nm(lamExc ?? 350)}.`} ${abs ? `Détecteur dans l’axe : absorbance ${fr2(A)}.` : comptage ? `${nCoups} coups comptés.` : `Détecteur à 90° réglé sur ${nm(lamDet)} : signal ${Math.round(100 * sig)} %.`}`}>
    <defs><radialGradient id="fl-glow"><stop offset="0" stopColor={cGlow} stopOpacity=".9"/><stop offset="1" stopColor={cGlow} stopOpacity="0"/></radialGradient>
      <radialGradient id="fl-lampe"><stop offset="0" stopColor="#fffbeb"/><stop offset=".6" stopColor="#fde68a"/><stop offset="1" stopColor="#f59e0b"/></radialGradient></defs>
    {!ph && <><line x1="47" y1={CY} x2="64" y2={CY} stroke="#fde68a" strokeWidth="5"/>
      <line className="fl-flux" x1="148" y1={CY} x2={CX - 22} y2={CY} stroke={cExc} strokeWidth="5" strokeDasharray="7 6"/>
      <line className="fl-flux" x1={CX + 22} y1={CY} x2="328" y2={CY} stroke={cExc} strokeWidth="5" strokeDasharray="7 6" opacity={trans * (abs ? 1 : off + 0.1)}/></>}
    {!abs && <><line className="fl-flux-v" x1={CX} y1={CY + 22} x2={CX} y2="190" stroke={cGlow} strokeWidth="4" strokeDasharray="5 6" opacity={Math.max(0.15, glow)}/>
      <line className="fl-flux-v" x1={CX} y1="232" x2={CX} y2="266" stroke={spectro ? cGlow : cDet} strokeWidth="4" strokeDasharray="5 6" opacity={comptage ? Math.max(0.15, glow) : 0.12 + 0.88 * sig}/></>}
    <circle cx="30" cy={CY} r="17" fill={ph ? '#e2e8f0' : 'url(#fl-lampe)'} stroke="#334155" strokeWidth="2"/><path d={`M23,${CY + 4} q3.5,-10 7,0 q3.5,10 7,0`} fill="none" stroke={ph ? '#94a3b8' : '#b45309'} strokeWidth="1.6"/>
    {T(30, 158, 'lampe', { size: 16, gras: true })}{ph && T(30, 176, 'coupée', { size: 16, gras: true, fill: K.rouge })}
    <rect x="64" y="98" width="84" height="44" rx="7" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="2"/>
    {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={82 + i * 9} y1="110" x2={90 + i * 9} y2="130" stroke="#7c3aed" strokeWidth="1.6"/>)}
    {T(106, 70, 'monochromateur', { size: 15, gras: true, fill: '#6d28d9' })}{T(106, 88, 'd’excitation', { size: 15, gras: true, fill: '#6d28d9' })}
    {ph ? <>{T(106, 164, nm(lamExc ?? 350), { size: 17, gras: true, fill: '#6d28d9' })}{T(106, 182, 'flash', { size: 15, fill: K.gris })}</>
      : <>{T(106, 164, lamExc == null ? '—' : nm(lamExc), { size: 17, gras: true, fill: '#6d28d9' })}{T(106, 182, mode === 'abs' || mode === 'ex' ? (comptage ? 'au hasard' : 'balayé') : 'fixé', { size: 15, fill: K.gris })}</>}
    {ph && (() => { const x0 = 14, x1 = 182, yb = 250, xd = 70, yp = x => yb - 26 * Math.exp(-(x - x0 - 4) / 70);
      let d = `M${x0 + 2},${yb} L${x0 + 4},${yp(x0 + 4)}`; for (let x = x0 + 8; x <= x1 - 6; x += 6) d += ` L${x},${yp(x).toFixed(1)}`;
      return <g><rect x={xd} y="212" width={x1 - 6 - xd} height={yb - 212} fill="#f97316" opacity=".14" stroke="#ea580c" strokeDasharray="4 3"/>
        <rect x={x0 - 1} y="210" width="4" height={yb - 210} fill="#7c3aed"/><path d={d} fill="none" stroke="#b91c1c" strokeWidth="2.2"/>
        <path d={`M${x0 + 2},${yb} L${x0 + 4},${yb - 36} L${x0 + 8},${yb - 3} L${x0 + 11},${yb}`} fill="#bbf7d0" stroke="#15803d" strokeWidth="1.8"/>
        <line x1={x0} y1={yb} x2={x1} y2={yb} stroke="#334155" strokeWidth="1.4"/><polygon points={`${x1 + 6},${yb} ${x1 - 2},${yb - 4} ${x1 - 2},${yb + 4}`} fill="#334155"/>
        {T(x0 - 2, 204, 'flash', { size: 13, gras: true, fill: '#6d28d9', anchor: 'start' })}{T((xd + x1) / 2, 228, 'mesure', { size: 13, gras: true, fill: '#c2410c' })}
        {T(x0 + 34, 222, 'attente', { size: 12.5, fill: K.gris })}{T(x1 + 4, yb + 13, 'temps', { size: 13, fill: K.gris, anchor: 'end' })}</g>; })()}
    {!abs && glow > 0.03 && <circle cx={CX} cy={CY} r="40" fill="url(#fl-glow)" opacity={Math.min(1, glow + 0.15)}/>}
    {!abs && glow > 0.03 && [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = Math.PI * a / 180; return <line key={a} x1={CX + 25 * Math.cos(r)} y1={CY + 25 * Math.sin(r)} x2={CX + 35 * Math.cos(r)} y2={CY + 35 * Math.sin(r)} stroke={cGlow} strokeWidth="2.4" opacity={Math.min(1, glow + 0.2)}/>; })}
    <rect x={CX - 22} y={CY - 22} width="44" height="44" rx="4" fill={abs ? '#f5f3ff' : '#f0fdf4'} stroke="#334155" strokeWidth="2.2"/>
    {T(192, 176, 'cuve', { size: 16, gras: true, anchor: 'end' })}
    <g opacity={abs ? 1 : off}><rect x="328" y="104" width="40" height="32" rx="6" fill="#e2e8f0" stroke="#334155" strokeWidth="2"/><circle cx="340" cy={CY} r="6" fill="#334155"/>
      {T(348, 158, 'détecteur', { size: 16, gras: true })}{T(348, 176, 'dans l’axe', { size: 15 })}</g>
    {lcd(300, 58, abs ? `A = ${fr2(A)}` : '—', abs)}
    <g opacity={abs ? off : 1}><rect x="192" y="190" width="68" height="42" rx="7" fill="#f0fdf4" stroke="#15803d" strokeWidth="2"/>
      {[0, 1, 2, 3, 4].map(i => <line key={i} x1={208 + i * 9} y1="201" x2={216 + i * 9} y2="221" stroke="#15803d" strokeWidth="1.6"/>)}
      {T(268, 204, spectro ? 'réseau' : 'monochromateur', { size: 15, gras: true, anchor: 'start', fill: '#166534' })}{T(268, 221, spectro ? '(spectrographe)' : 'de détection', { size: 15, gras: true, anchor: 'start', fill: '#166534' })}
      {!abs && T(268, 244, spectro ? 'toutes les λ' : `${nm(lamDet ?? 450)} · ${mode === 'ex' ? 'fixé' : 'balayé'}`, { size: 15, gras: true, anchor: 'start' })}
      {spectro ? <><rect x="196" y="266" width="60" height="22" rx="3" fill="#e2e8f0" stroke="#334155" strokeWidth="2"/>{[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => <rect key={i} x={199 + i * 6.2} y="270" width="4.6" height="14" fill="#334155"/>)}
        {T(264, 284, 'barrette de pixels', { size: 15, gras: true, anchor: 'start' })}</>
        : <><rect x="208" y="266" width="36" height="30" rx="6" fill="#e2e8f0" stroke="#334155" strokeWidth="2"/><circle cx={CX} cy="281" r="6" fill="#334155"/>
          {T(252, 287, 'détecteur à 90°', { size: 15, gras: true, anchor: 'start' })}</>}</g>
    {lcd(92, 266, abs ? '—' : comptage ? `${nCoups} coups` : `${Math.round(100 * sig)} %`, !abs)}
    {T(200, 326, abs ? 'Il mesure ce qui traverse : A = log(I₀ / I)' : 'À 90°, il ne reçoit que la lumière émise', { size: 15, fill: K.gris })}
  </svg>);
}

// ---------- ② la molécule : diagramme à l'échelle ----------
const yE = E => 292 - E * 55;
function Molecule({ mol, ph, lamExc, lamDet, absorbe, voie, emet, sigE, chaleur }) {
  const E00 = mol.E00, hw = mol.hw, ET = mol.T?.E00;
  const Eexc = lamExc ? X.HC / lamExc : 0, Edet = lamDet ? X.HC / lamDet : 0;
  const Edep = voie === 'phos' ? ET : E00, Earr = Edep - Edet;
  const demi = Math.max(1.2, sigE * 55);
  const niveaux = (x1, x2, E0, id) => [0, 1, 2, 3, 4].map(v => <g key={id + v}><rect x={x1} width={x2 - x1} y={yE(E0 + v * hw) - demi} height={2 * demi} fill="#94a3b8" opacity={sigE > 0.03 ? 0.13 : 0}/>
    <line x1={x1} x2={x2} y1={yE(E0 + v * hw)} y2={yE(E0 + v * hw)} stroke={v ? '#94a3b8' : '#0f172a'} strokeWidth={v ? 1.1 : 2.6}/></g>);
  const XA = 88, XF = 240, XP = 322;
  const lab = (x, y, l1, l2, col, anchor = 'start') => <g key={l1}>{T(x, y, l1, { size: 16, gras: true, fill: col, anchor, halo: true })}{T(x, y + 19, l2, { size: 15, fill: K.txt, anchor, halo: true })}</g>;
  return (<svg role="img" viewBox="0 0 420 320" style={{ display: 'block', width: '100%' }}
    aria-label={`Diagramme d’énergie à l’échelle de la molécule ${mol.id}. ${lamExc && !ph ? (absorbe ? `Absorption d’un photon de ${eV(lamExc)}.` : 'Photon non absorbé.') : ''} ${emet ? `Émission d’un photon de ${eV(lamDet)}.` : ''}`}>
    <line x1="40" y1="296" x2="40" y2="40" stroke={K.gris} strokeWidth="1.5"/><polygon points="40,32 35,44 45,44" fill={K.gris}/>
    {T(40, 22, 'E (eV)', { size: 16, gras: true })}
    {[0, 1, 2, 3, 4].map(e => <g key={e}><line x1="36" x2="40" y1={yE(e)} y2={yE(e)} stroke={K.gris}/>{T(31, yE(e) + 5, String(e), { size: 15, fill: K.gris, anchor: 'end' })}</g>)}
    {niveaux(72, 392, 0, 's0')}{T(398, yE(0) + 5, 'S₀', { size: 16, gras: true, anchor: 'start' })}
    {niveaux(72, 252, E00, 's1')}{T(66, yE(E00) + 6, 'S₁', { size: 16, gras: true, anchor: 'end' })}
    {ET != null && <>{niveaux(270, 392, ET, 't1')}{T(398, yE(ET) + 5, 'T₁', { size: 16, gras: true, anchor: 'start' })}</>}
    {T(252, yE(E00 + 4 * hw) - 9, sigE > 0.03 ? 'niveaux de vibration (élargis)' : 'niveaux de vibration', { size: 14, fill: K.gris, anchor: 'end' })}
    {!ph && lamExc && (absorbe ? <>{flecheV(XA, yE(0), yE(Eexc), D.couleurLam(lamExc, 0.7), 4.5, null, 'a')}{ondule(XA + 26, yE(Eexc), yE(E00), K.gris, 'rv1')}
      {Eexc - E00 > 0.1 && T(XA + 34, yE((Eexc + E00) / 2) + 5, 'RV', { size: 15, gras: true, fill: K.gris, anchor: 'start' })}
      {lab(XA + 8, 170, 'absorption', `${eV(lamExc)} · ${nm(lamExc)}`, '#6d28d9')}</>
      : <>{flecheV(XA, yE(0), yE(Eexc), '#94a3b8', 3, '5 4', 'a')}{lab(XA + 8, 170, '✕ pas absorbé', `aucun niveau à ${eV(lamExc)}`, K.rouge)}</>)}
    {ET != null && (ph || (emet && voie === 'phos')) && <><line x1={XF + 10} y1={yE(E00)} x2={XP - 26} y2={yE(ET) - 4} stroke="#c2410c" strokeWidth="2.4" strokeDasharray="6 4"/><polygon points={`${XP - 22},${yE(ET)} ${XP - 34},${yE(ET) - 3} ${XP - 28},${yE(ET) - 12}`} fill="#c2410c"/>
      {T((XF + XP) / 2 - 4, yE((E00 + ET) / 2) - 8, 'CIS', { size: 15, gras: true, fill: '#c2410c', halo: true })}</>}
    {emet && <>{flecheV(voie === 'phos' ? XP : XF, yE(Edep), yE(Math.max(0, Earr)), D.couleurLam(lamDet, 0.7), 4.5, voie === 'phos' ? '8 4' : null, 'e')}
      {ondule((voie === 'phos' ? XP : XF) + 24, yE(Math.max(0, Earr)), yE(0), K.gris, 'rv2')}
      {voie === 'phos' ? lab(XP - 8, 214, 'phosphorescence', `${eV(lamDet)} · ${nm(lamDet)}`, '#b91c1c', 'end')
        : lab(XF + 8, 214, 'fluorescence', `${eV(lamDet)} · ${nm(lamDet)}`, '#15803d')}</>}
    {chaleur && T(300, 214, 'retour sans photon (chaleur)', { size: 15, fill: K.gris, halo: true })}
    {ph && <><g opacity=".35">{flecheV(XA, yE(0), yE(X.HC / 350), '#7c3aed', 4.5, '5 4', 'a')}{ondule(XA + 26, yE(X.HC / 350), yE(E00), K.gris, 'rv1')}</g>
      {T(XA + 8, 160, 'pendant le flash (estompé) :', { size: 14, fill: K.gris, anchor: 'start', halo: true })}{T(XA + 8, 178, 'absorption, puis CIS vers T₁', { size: 14, fill: K.gris, anchor: 'start', halo: true })}</>}
  </svg>);
}

// ---------- ③ le spectre : en haut ce qui est fixé, en bas ce qui est enregistré ----------
const AX0 = 280, AX1 = 650, PX0 = 48, PX1 = 404;
const YT = 108, HT = 66, YB = 318, PH = 150;
const xL = l => PX0 + (l - AX0) / (AX1 - AX0) * (PX1 - PX0), lX = x => AX0 + (x - PX0) / (PX1 - PX0) * (AX1 - AX0);
const raie = (l, fente, col) => { const w = Math.max(6, xL(l + fente / 2) - xL(l - fente / 2)); return <rect x={xL(l) - w / 2} y="30" width={w} height={YT - 30} rx="2" fill={col} opacity=".9"/>; };
const chemin = (pts, y) => pts.map((p, i) => `${i ? 'L' : 'M'}${xL(p.lam).toFixed(1)},${y(p.s).toFixed(1)}`).join('');
function Spectre({ mode, mol, opt, lamS, lamF, grille, pts, comptage, compte, onDrag, onKey, invite }) {
  const abs = mode === 'abs', yMax = abs ? 0.9 : 1.1, y = v => YB - PH * Math.min(v, yMax * 1.02) / yMax, yt = v => YT - HT * v;
  const stops = []; for (let l = AX0; l <= AX1; l += 10) stops.push(<stop key={l} offset={(l - AX0) / (AX1 - AX0)} stopColor={l < 380 ? '#c4b5fd' : D.couleurLam(l)}/>);
  const segs = []; Object.keys(pts).map(Number).sort((a, b) => a - b).forEach(i => { const s = segs[segs.length - 1]; if (s && i - s[s.length - 1] <= 1) s.push(i); else segs.push([i]); });
  const val = l => (abs ? D.absorbance(mol, l, opt) : D.signal(mol, mode, l, lamF, opt));
  const pill = (x, yb, txt, col, k) => { const tx = Math.min(PX1 - 56, Math.max(PX0 + 56, x)); return <g key={k}><rect x={tx - 56} y={yb - 17} width="112" height="24" rx="12" fill="#fff" stroke={col} strokeWidth="2"/>{T(tx, yb, txt, { size: 14.5, gras: true })}</g>; };
  let haut = null;
  if (abs) {
    const Tt = 10 ** -D.absorbance(mol, lamS, opt);
    haut = <g>{T(150, 46, 'I₀ (avant la cuve)', { size: 14.5, anchor: 'end' })}<rect x="158" y="34" width="240" height="16" rx="4" fill={D.couleurLam(lamS)} opacity=".85"/>
      {T(150, 78, 'I (après la cuve)', { size: 14.5, anchor: 'end' })}<rect x="158" y="66" width={Math.max(1, 240 * Tt)} height="16" rx="4" fill={D.couleurLam(lamS)} opacity=".85"/><rect x="158" y="66" width="240" height="16" rx="4" fill="none" stroke="#cbd5e1"/>
      {T(398, 102, `à ${nm(lamS)} : A = log(I₀ / I) = ${fr2(-Math.log10(Tt))}`, { size: 14.5, gras: true, anchor: 'end' })}</g>;
  } else if (mode === 'em') {
    const f = D.forme(mol, 'abs', opt), col = D.couleurLam(lamF, 0.7);
    haut = <g><path d={`${chemin(f, yt)} L${xL(f[f.length - 1].lam)},${YT} L${xL(f[0].lam)},${YT} Z`} fill="#ede9fe" fillOpacity=".55" stroke="#7c3aed" strokeOpacity=".7" strokeWidth="1.6" strokeDasharray="5 4"/>
      {T(PX1, 126, '↑ spectre d’absorption de la molécule (pointillé)', { size: 13.5, fill: '#6d28d9', anchor: 'end', gras: true })}
      {raie(lamF, opt.fente, col)}<circle cx={xL(lamF)} cy={yt(D.absRel(mol, lamF, opt))} r="5" fill={col} stroke="#fff" strokeWidth="2"/>
      {pill(xL(lamF), 22, `exc. ${nm(lamF)}`, col, 'pf')}</g>;
  } else if (mode === 'ph') {
    const fF = D.forme(mol, 'fl', opt), fP = D.forme(mol, 'ph', opt), zone = (f, y) => `${chemin(f, y)} L${xL(f[f.length - 1].lam)},${YT} L${xL(f[0].lam)},${YT} Z`;
    const lF = 350, cF = D.couleurLam(lF, 0.7);
    haut = <g>
      <path d={zone(fP, yt)} fill="#fee2e2" fillOpacity=".8" stroke="#b91c1c" strokeWidth="2.2"/>
      <path d={chemin(fF, yt)} fill="none" stroke="#64748b" strokeWidth="1.8" strokeDasharray="5 4"/>
      {raie(lF, opt.fente, cF)}{pill(xL(lF), 22, 'flash 350 nm', cF, 'pf')}
      {T(xL(383), 58, 'fluorescence', { size: 13, fill: '#475569', gras: true, anchor: 'start', halo: true })}{T(xL(383), 74, '(déjà éteinte)', { size: 13, fill: '#475569', anchor: 'start', halo: true })}
      {T(PX1 - 2, 70, 'phosphorescence', { size: 13, fill: '#b91c1c', gras: true, anchor: 'end', halo: true })}
      {T(PX1, 126, '↑ au moment de la mesure, seule la phosphorescence reste', { size: 13.5, fill: K.txt, anchor: 'end', gras: true })}</g>;
  } else {
    const f = D.forme(mol, 'em', opt), k = mode === 'ex' ? D.absRel(mol, comptage && compte.dernier?.lamIn ? compte.dernier.lamIn : lamS, opt) : 1;
    const g = f.map(p => ({ lam: p.lam, s: p.s * k }));
    haut = <g>
      <path d={`${chemin(g, yt)} L${xL(g[g.length - 1].lam)},${YT} L${xL(g[0].lam)},${YT} Z`} fill={mode === 'ph' ? '#f1f5f9' : '#dcfce7'} fillOpacity={mode === 'ex' ? 0.55 : 1} stroke={mode === 'ph' ? '#94a3b8' : '#15803d'} strokeOpacity={mode === 'ex' ? 0.7 : 1} strokeWidth="1.6" strokeDasharray={mode === 'ph' ? '4 3' : mode === 'ex' ? '5 4' : null}/>
      {mode === 'ph' && <path d={chemin(D.forme(mol, 'ph', opt), yt)} fill="none" stroke="#b91c1c" strokeWidth="2.2"/>}
      {T(PX1, 126, mode === 'ex' ? '↑ émission de la molécule (pointillé) : on ne mesure qu’un point' : '↑ lampe allumée (gris), coupée (rouge)', { size: 13.5, fill: mode === 'ex' ? '#166534' : K.txt, anchor: 'end', gras: true })}
      {mode === 'ex' && <>{raie(lamF, opt.fente, '#ea580c')}
        <circle cx={xL(lamF)} cy={yt(k * D.emRel(mol, lamF, opt))} r="5.5" fill="#ea580c" stroke="#fff" strokeWidth="2"/>{pill(xL(lamF), 22, `dét. ${nm(lamF)}`, '#ea580c', 'pf')}</>}</g>;
  }
  let bas;
  if (comptage) {
    const bw = Math.max(1, opt.fente), cles = Object.keys(compte.coups).map(Number), mx = Math.max(4, ...cles.map(c => compte.coups[c]));
    const total = cles.reduce((a, c) => a + compte.coups[c], 0), ymc = mx * 1.15, yc = c => YB - PH * c / ymc;
    const pg = grille.length > 1 ? grille[1].lam - grille[0].lam : 1, sRef = grille.reduce((a, p) => a + p.s, 0) * pg;
    const att = sRef > 0 ? grille.map(p => ({ lam: p.lam, s: total * p.s * bw / sRef })) : [];
    bas = <g>
      {cles.map(c => <rect key={c} x={xL(c * bw)} y={yc(compte.coups[c])} width={Math.max(1.2, xL((c + 1) * bw) - xL(c * bw) - 0.3)} height={YB - yc(compte.coups[c])} fill={COLC[mode]} opacity=".85"/>)}
      {total > 20 && <path d={att.map((p, i) => `${i ? 'L' : 'M'}${xL(p.lam).toFixed(1)},${yc(p.s).toFixed(1)}`).join('')} fill="none" stroke={K.txt} strokeWidth="1.5" strokeDasharray="2 3"/>}
      {[0, Math.round(ymc / 2), Math.round(ymc)].map(v => <g key={v}><line x1={PX0 - 4} y1={yc(v)} x2={PX0} y2={yc(v)} stroke={K.gris}/>{T(PX0 - 7, yc(v) + 5, String(v), { size: 13.5, fill: K.gris, anchor: 'end' })}</g>)}
      {!total && T((PX0 + PX1) / 2, YB - PH / 2, 'Envoyez des photons', { size: 15, fill: K.gris })}
      {total > 20 && T(PX1, YB - PH - 4, 'pointillés : courbe attendue', { size: 13, fill: K.gris, anchor: 'end' })}
      {compte.dernier?.lamCoup != null && <circle cx={xL(compte.dernier.lamCoup)} cy={YB} r="6" fill="#f59e0b" stroke="#fff" strokeWidth="2"/>}
    </g>;
  } else {
    const ici = val(lamS), col = D.couleurLam(lamS, 0.7), seg = s => s.map(j => grille[j]).filter(Boolean);
    bas = <g>
      {segs.map((s, i) => seg(s).length > 1 && <path key={'f' + i} d={`${chemin(seg(s), y)} L${xL(seg(s).at(-1).lam)},${YB} L${xL(seg(s)[0].lam)},${YB} Z`} fill={`url(#fl-spg-${mode})`} opacity=".35"/>)}
      {segs.map((s, i) => seg(s).length > 1 && <path key={'t' + i} d={chemin(seg(s), y)} fill="none" stroke={COLC[mode]} strokeWidth="2.6" strokeLinejoin="round"/>)}
      {(abs ? [0, 0.4, 0.8] : [0, 0.5, 1]).map(v => <g key={v}><line x1={PX0 - 4} y1={y(v)} x2={PX0} y2={y(v)} stroke={K.gris}/>{T(PX0 - 7, y(v) + 5, String(v).replace('.', ','), { size: 13.5, fill: K.gris, anchor: 'end' })}</g>)}
      <g role="slider" tabIndex={0} aria-label={`${abs || mode === 'ex' ? 'Longueur d’onde d’excitation' : 'Longueur d’onde de détection'}, balayée`} aria-valuemin={SCAN[mode][0]} aria-valuemax={SCAN[mode][1]} aria-valuenow={Math.round(lamS)} aria-valuetext={`${nm(lamS)}, ${eV(lamS)}`}
        onKeyDown={e => onKey('s', e)} style={{ cursor: 'ew-resize', outline: 'none' }}>
        <line x1={xL(lamS)} y1={YB} x2={xL(lamS)} y2={YB - PH - 10} stroke={col} strokeWidth="2.2" strokeDasharray="5 4"/>
        <circle cx={xL(lamS)} cy={y(ici)} r="6" fill={COLC[mode]} stroke="#fff" strokeWidth="2"/>
        <circle cx={xL(lamS)} cy={YB} r="7" fill={col} stroke="#fff" strokeWidth="2" className={invite ? 'fl-pulse' : undefined}/>
        {pill(xL(lamS), YB - PH - 12, `${abs || mode === 'ex' ? 'exc.' : 'dét.'} ${nm(lamS)}`, col, 'ps')}</g>
    </g>;
  }
  return (<svg role="img" viewBox="0 0 420 384" style={{ display: 'block', width: '100%', touchAction: 'none' }} onPointerDown={e => onDrag('down', e)} onPointerMove={e => onDrag('move', e)} onPointerUp={e => onDrag('up', e)} onPointerCancel={e => onDrag('up', e)}
    aria-label={`En haut, ce qui est fixé ; en bas, le spectre ${comptage ? 'construit en comptant les photons' : 'enregistré'}.`}>
    <defs><linearGradient id={`fl-spg-${mode}`} gradientUnits="userSpaceOnUse" x1={PX0} x2={PX1} y1="0" y2="0">{stops}</linearGradient></defs>
    <line x1={PX0} y1={YT} x2={PX1} y2={YT} stroke="#cbd5e1"/>
    {haut}
    <line x1={PX0} y1={YB} x2={PX1} y2={YB} stroke={K.gris}/><line x1={PX0} y1={YB} x2={PX0} y2={YB - PH - 6} stroke={K.gris}/>
    <text x="14" y={YB - PH / 2} fontSize="14.5" fill={K.gris} textAnchor="middle" transform={`rotate(-90 14 ${YB - PH / 2})`} fontFamily="inherit">{comptage ? 'nombre de coups' : abs ? 'absorbance A' : 'intensité relative'}</text>
    <rect x={PX0} y={YB + 3} width={PX1 - PX0} height="9" fill={`url(#fl-spg-${mode})`} opacity=".9"/>
    {T((xL(AX0) + xL(380)) / 2, YB + 11, 'UV', { size: 12, gras: true, fill: '#fff' })}{T((xL(380) + PX1) / 2, YB + 11, 'visible', { size: 12, gras: true, fill: '#fff' })}
    {[300, 400, 500, 600].map(l => <g key={l}><line x1={xL(l)} y1={YB + 12} x2={xL(l)} y2={YB + 17} stroke={K.gris}/>{T(xL(l), YB + 32, String(l), { size: 14.5, fill: K.gris })}</g>)}
    {T(PX1, YB + 54, 'longueur d’onde λ (nm)', { size: 14.5, fill: K.gris, anchor: 'end' })}
    {bas}
  </svg>);
}

// ---------- vue complète ----------
const groupe = (titre, enfant) => (<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}><span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginRight: 2 }}>{titre}</span>{enfant}</div>);
// guide (parcours guidé) : { mode, mol, comptage, conditions, onCompte } ; les réglages non utiles à l'étape sont cachés
export function VueDispositif({ guide = null }) {
  const reduit = reduitMouvement(), md0 = guide?.mode ?? 'abs', cp0 = !!guide?.comptage;
  const [mode, setMode] = useState(md0), [molId, setMolId] = useState(guide?.mol ?? 'A'), [cond, setCond] = useState('solution'), [fente, setFente] = useState(5);
  const [comptage, setComptage] = useState(cp0), [compte, setCompte] = useState(COMPTE0), [lecture, setLecture] = useState(false), [ouvReg, setOuvReg] = useState(false);
  const mol = X.MOLS_T[molId], sigC = D.CONDITIONS[cond].sig, opt = { sig: sigC, fente }, pas = D.pasDe(sigC);
  const [lamF, setLamF] = useState(() => D.fixeDefaut(md0, X.MOLS_T[guide?.mol ?? 'A']));
  const [acq, setAcq] = useState(() => ((reduit || !guide) && !cp0 ? { lamS: Math.max(SCAN[md0][0], Math.min(SCAN[md0][1], 350)), pts: plein(md0, D.pasDe(D.OPT0.sig)) } : { lamS: SCAN[md0][0], pts: {} }));
  const [scan, setScan] = useState(!reduit && !cp0 && !!guide), [invite, setInvite] = useState(true), [enPause, setEnPause] = useState(false);
  const pos = useRef(SCAN[md0][0]), posAff = useRef(SCAN[md0][0]), drag = useRef(null);
  const onCompte = guide?.onCompte;
  useEffect(() => { onCompte?.(compte.n); }, [compte.n, onCompte]);
  const lamS = acq.lamS, grille = D.courbe(mol, mode, lamF, pas, opt);
  useEffect(() => {
    if (!scan) return undefined;
    const [lo, hi] = SCAN[mode], o = { sig: sigC, fente }, p = D.pasDe(sigC), g = D.courbe(mol, mode, lamF, p, o); let id, last = null;
    const f = ts => {
      if (last != null) { const l = Math.min(hi, pos.current + (ts - last) / DUREE * (hi - lo)); pos.current = l;
        if (Math.round(l / PAS_AFF) !== Math.round(posAff.current / PAS_AFF) || l >= hi) { const prev = posAff.current; posAff.current = l; setAcq(a => ({ lamS: Math.round(l / PAS_AFF) * PAS_AFF, pts: marquer(a.pts, prev, l, lo, p) })); }
        if (l >= hi) { const m = g.reduce((b, q) => (q.s > b.s ? q : b), g[0]).lam; pos.current = m; setAcq(a => ({ ...a, lamS: m })); setScan(false); return; } }
      last = ts; id = requestAnimationFrame(f);
    };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [scan, mode, mol, lamF, sigC, fente]);
  const envoyer = k => setCompte(c => {
    const coups = { ...c.coups }, bw = Math.max(1, fente); let n = c.n, nAbs = c.nAbs, dernier = c.dernier;
    for (let j = 0; j < k; j++) { const ev = D.evenementComptage(mol, mode, lamF, { sig: sigC, fente }, Math.random); n++; if (ev.absorbe) nAbs++; if (ev.lamCoup != null) { const b = Math.floor(ev.lamCoup / bw); coups[b] = (coups[b] || 0) + 1; } dernier = ev; }
    return { n, nAbs, coups, dernier };
  });
  const envoyerRef = useRef(envoyer);
  useEffect(() => { envoyerRef.current = envoyer; });
  useEffect(() => { if (!lecture || !comptage) return undefined; const id = setInterval(() => envoyerRef.current(1), 900); return () => clearInterval(id); }, [lecture, comptage]);
  const enregistrer = (md = mode, s = sigC) => { const lo = SCAN[md][0], p = D.pasDe(s); if (reduit) { setAcq({ lamS: Math.min(SCAN[md][1], Math.max(lo, 350)), pts: plein(md, p) }); return; } pos.current = lo; posAff.current = lo; setEnPause(false); setAcq({ lamS: lo, pts: {} }); setScan(true); };
  const relancer = (md, s) => { setCompte(COMPTE0); setLecture(false); setScan(false); if (!comptage) enregistrer(md, s); };
  const choisirMode = (md, m = mol) => { setScan(false); setMode(md); setLamF(D.fixeDefaut(md, m)); setCompte(COMPTE0); setLecture(false); if (!comptage) enregistrer(md); };
  const choisirMol = id => { const m = X.MOLS_T[id]; setMolId(id); choisirMode(mode === 'ph' && !m.T ? 'em' : mode, m); };
  const choisirCond = c => { setCond(c); relancer(mode, D.CONDITIONS[c].sig); };
  const choisirFente = f => { setFente(f); relancer(mode, sigC); };
  const choisirComptage = c => { setScan(false); setLecture(false); setCompte(COMPTE0); setComptage(c); if (c && mode === 'abs') { setMode('em'); setLamF(D.fixeDefaut('em', mol)); } if (!c) enregistrer(); };
  const clamp = (l, [a, b]) => Math.min(b, Math.max(a, l));
  const bouger = (quoi, l) => {
    setInvite(false);
    if (quoi === 's') { const v = clamp(l, SCAN[mode]); setAcq(a => ({ lamS: v, pts: marquer(a.pts, a.lamS, v, SCAN[mode][0], pas) })); }
    else { setLamF(Math.round(clamp(l, FIXE[mode]))); setAcq(a => ({ ...a, pts: {} })); setCompte(COMPTE0); }
  };
  const onDrag = (t, e) => {
    const r = e.currentTarget.getBoundingClientRect(), xv = (e.clientX - r.left) * 420 / r.width, yv = (e.clientY - r.top) * 384 / r.height, l = lX(xv);
    if (t === 'down') {
      const haut = yv < YT + 6;
      drag.current = haut ? (mode === 'em' || mode === 'ex' ? 'f' : null) : (comptage ? null : 's');
      if (!drag.current) return;
      setScan(false); e.currentTarget.setPointerCapture?.(e.pointerId); bouger(drag.current, l);
    } else if (t === 'move' && drag.current) bouger(drag.current, l);
    else if (t === 'up' && drag.current) { const q = drag.current; drag.current = null; if (q === 'f' && !comptage) enregistrer(); }
  };
  const onKey = (quoi, e) => { const d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key]; if (!d) return; e.preventDefault(); setScan(false); bouger(quoi, (quoi === 's' ? lamS : lamF) + d * (e.shiftKey ? 10 : 1)); };
  const dern = compte.dernier;
  const lamExc = comptage ? (mode === 'ph' ? null : dern?.lamIn ?? (mode === 'ex' ? null : lamF)) : mode === 'abs' || mode === 'ex' ? lamS : lamF;
  const lamDet = comptage ? dern?.lamOut ?? null : mode === 'ex' ? lamF : lamS;
  const sig = mode === 'abs' || comptage ? 0 : D.signal(mol, mode, lamS, lamF, opt), A = D.absorbance(mol, lamExc ?? 350, opt);
  const absorbe = comptage ? !!dern?.absorbe : D.absRel(mol, lamExc ?? 350, opt) > 0.03;
  const emet = comptage ? !!dern?.lamOut : mode !== 'abs' && sig > 0.02 && (mode === 'ph' || absorbe);
  const voie = comptage ? dern?.voie : mode === 'ph' ? 'phos' : D.emissionDominante(mol, lamDet ?? 450, opt);
  const nCoups = Object.values(compte.coups).reduce((a, b) => a + b, 0);
  const phrase = scan ? 'Enregistrement en cours : le repère du bas avance, et chaque mesure ajoute un point au spectre. Les valeurs s’affichent à la fin du balayage.'
    : comptage
    ? (dern ? `Photon n° ${compte.n} : ${D.texteEvenement(dern, mode)}.` : 'Envoyez des photons un par un, puis par paquets : chaque photon suit un chemin du diagramme, tiré au hasard.')
    : mode === 'abs'
      ? (absorbe ? `À ${nm(lamExc)}, le photon (${eV(lamExc)}) peut porter la molécule de S₀ dans S₁ : il est absorbé, le détecteur reçoit moins de lumière (A = ${fr2(A)}).` : `À ${nm(lamExc)}, le photon (${eV(lamExc)}) ne correspond à aucun écart S₀ → S₁ : il traverse la cuve (A ≈ 0).`)
      : mode === 'ph' ? `Lampe coupée : seules les molécules restées dans T₁ émettent encore. À ${nm(lamDet)} (${eV(lamDet)}), le détecteur reçoit ${Math.round(100 * sig)} % du maximum.`
      : !absorbe ? `L’excitation à ${nm(lamExc)} n’est presque pas absorbée : la molécule n’est pas excitée, rien n’est émis.`
      : mode === 'ex' ? `À ${nm(lamExc)}, la molécule absorbe ${Math.round(100 * D.absRel(mol, lamExc, opt))} % du maximum ; elle émet sa bande habituelle, réduite dans la même proportion ; à ${nm(lamDet)}, on lit ${Math.round(100 * sig)} %.`
      : `Photon de ${nm(lamExc)} absorbé, puis relaxation jusqu’au bas de ${voie === 'phos' ? 'T₁' : 'S₁'} et émission. À ${nm(lamDet)} (${eV(lamDet)}), le détecteur à 90° reçoit ${Math.round(100 * sig)} % du maximum.`;
  const etapes = (comptage ? ETAPES_C[mode] : null) ?? ETAPES[mode];
  const titre3 = comptage ? 'Les photons comptés' : { abs: 'Spectre d’absorption', em: 'Spectre d’émission', ex: 'Spectre d’excitation', ph: 'Spectre de phosphorescence' }[mode];
  const panneau = (n, t, enfant) => (<div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '8px 8px 4px' }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, margin: '0 0 2px 4px' }}><span style={{ display: 'inline-block', width: 22, height: 22, lineHeight: '22px', borderRadius: 11, background: '#16a34a', color: '#fff', textAlign: 'center', fontSize: 13, marginRight: 6 }}>{n}</span>{t}</div>{enfant}</div>);
  return (<div>
    <style>{`
      .fl-pv { display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr); align-items: start; }
      @media (min-width: 900px) { .fl-pv { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      .fl-et { display: grid; gap: 6px; grid-template-columns: minmax(0, 1fr); margin-bottom: 8px; }
      @media (min-width: 700px) { .fl-et { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      @media (prefers-reduced-motion: no-preference) {
        .fl-flux, .fl-flux-v { animation: fl-flux 0.9s linear infinite; } @keyframes fl-flux { to { stroke-dashoffset: -13; } }
        .fl-pulse { animation: fl-pulse 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; } @keyframes fl-pulse { 50% { transform: scale(1.6); } } }
    `}</style>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
      {!guide && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {groupe('Spectre', MODES.map(([k, l]) => { const off = (k === 'ph' && !mol.T) || (k === 'abs' && comptage);
          return <button key={k} onClick={() => choisirMode(k)} disabled={off} aria-pressed={mode === k} title={k === 'ph' && !mol.T ? 'Molécule B seulement' : k === 'abs' && comptage ? 'En absorption, on compare deux intensités : passez en « Intensité »' : undefined} style={{ ...stylePetitBouton(mode === k, '#16a34a'), opacity: off ? 0.45 : 1 }}>{l}</button>; }))}
        {groupe('Molécule', [['A', 'A (fluo.)'], ['B', 'B (phospho.)']].map(([k, l]) => <button key={k} onClick={() => choisirMol(k)} aria-pressed={molId === k} style={stylePetitBouton(molId === k, '#334155')}>{l}</button>))}
      </div>}
      {(!guide || guide.conditions) && (() => { const reg = <><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {groupe('Échantillon', Object.values(D.CONDITIONS).map(c => <button key={c.id} onClick={() => choisirCond(c.id)} aria-pressed={cond === c.id} style={stylePetitBouton(cond === c.id, '#0f766e')}>{c.court}</button>))}
        {groupe('Fentes', D.FENTES.map(f => <button key={f} onClick={() => choisirFente(f)} aria-pressed={fente === f} title="bande passante des monochromateurs" style={stylePetitBouton(fente === f, '#0f766e')}>{f}{NB}nm</button>))}
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.45, marginTop: 4 }}>{D.CONDITIONS[cond].cause}{fente >= 10 && cond !== 'solution' ? ' Avec des fentes de 10 nm, l’appareil écrase une partie de cette structure : elle existe, mais on ne la voit plus.' : ''}</div></>;
        return guide ? <div>{reg}</div> : <Section titre={`Échantillon et appareil : ${D.CONDITIONS[cond].court} · fentes ${fente}${NB}nm`} ouvert={ouvReg} onBascule={() => setOuvReg(o => !o)}><div style={{ padding: '0 10px 8px' }}>{reg}</div></Section>; })()}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {!guide && groupe('Mesure', [[false, 'Intensité (balayage)'], [true, 'Compter les photons']].map(([c, l]) => <button key={l} onClick={() => choisirComptage(c)} aria-pressed={comptage === c} style={stylePetitBouton(comptage === c, '#334155')}>{l}</button>))}
        {comptage ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {[1, 100, 1000, 10000, ...(mode === 'ex' ? [100000] : [])].map(k => <button key={k} onClick={() => envoyer(k)} style={stylePetitBouton(false)}>{k === 1 ? '1 photon' : `× ${k.toLocaleString('fr-FR')}`}</button>)}
          <button onClick={() => setLecture(l => !l)} aria-pressed={lecture} style={stylePetitBouton(lecture, '#16a34a')}>{lecture ? '⏸ Pause' : '▶ Un par un'}</button>
          <button onClick={() => { setLecture(false); setCompte(COMPTE0); }} style={stylePetitBouton(false)}>Effacer</button></div>
          : <><button onClick={() => { if (scan) { setScan(false); setEnPause(true); } else if (enPause) { setEnPause(false); setScan(true); } else enregistrer(); }} aria-pressed={scan} style={styleBouton(scan, '#16a34a')}>{scan ? '⏸ Pause' : enPause ? '▶ Reprendre' : '▶ Enregistrer le spectre'}</button>
          <button onClick={() => enregistrer()} style={styleBouton(false, '#334155')}>↺ Recommencer</button></>}
      </div>
    </div>
    <div className="fl-et">{etapes.map((t, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '6px 8px', fontSize: 13.5, color: KIT.txt, lineHeight: 1.4 }}>
      <span style={{ flex: '0 0 auto', width: 20, height: 20, lineHeight: '20px', borderRadius: 10, background: '#15803d', color: '#fff', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</span>{t}</div>)}</div>
    <div role="status" aria-live="off" style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.45, marginBottom: 8, minHeight: '4.4em' }}>{phrase}</div>
    <div className="fl-pv">
      {panneau('①', 'Le montage', <Montage mode={mode} mol={mol} lamExc={lamExc} lamDet={lamDet} sig={sig} A={A} comptage={comptage} nCoups={nCoups} opt={opt}/>)}
      {panneau('②', 'Dans la molécule', <Molecule mol={mol} ph={mode === 'ph'} lamExc={mode === 'ph' ? null : lamExc} lamDet={lamDet} absorbe={absorbe} voie={voie} emet={emet} sigE={sigC} chaleur={comptage && dern?.absorbe && (dern.voie === 'nr' || dern.voie === 'nrT')}/>)}
      {panneau('③', titre3, <Spectre mode={mode} mol={mol} opt={opt} lamS={lamS} lamF={lamF} grille={grille} pts={acq.pts} comptage={comptage} compte={compte} onDrag={onDrag} onKey={onKey} invite={invite}/>)}
    </div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>Faites glisser le repère du haut (ce qui est fixé) ou du bas (ce qui est balayé). Longueur d’une flèche du diagramme = énergie du photon : E (eV) = 1243 / λ (nm).{comptage ? ` Comptage : ${compte.n} photons envoyés, ${compte.nAbs} absorbés, ${nCoups} comptés.` : ''}</div>
  </div>);
}
