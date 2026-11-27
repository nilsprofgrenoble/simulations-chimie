// Vue « Du photon au spectre » de la simulation 301 : trois panneaux visibles en même temps.
// ① le montage (vue de dessus : lampe, monochromateurs, cuve, détecteur dans l'axe et détecteur à 90°),
// ② la molécule : diagramme d'énergie À L'ÉCHELLE (eV), longueur de chaque flèche = énergie du photon,
// ③ le spectre enregistré point par point pendant le balayage ; les repères d'excitation et de détection se font glisser.
// Rien n'est codé par la seule couleur : noms écrits, valeurs en nm et en eV, traits pleins / tiretés.
import { useState, useEffect, useRef } from "react";
import { K, T } from "./schemaOutils";
import * as X from "./fluoTirages";
import * as D from "./fluoDispositif";
import { reduitMouvement } from "./hookHorloge";
import { KIT, stylePetitBouton, styleBouton } from "../commun";

const NB = ' ';
const fr2 = v => v.toFixed(2).replace('.', ',').replace('-', '−');
const nm = l => `${Math.round(l)}${NB}nm`;
const eV = l => `${fr2(X.HC / l)}${NB}eV`;
const COLC = { abs: '#7c3aed', ex: '#7c3aed', em: '#15803d', ph: '#b91c1c' };
const MODES = [['abs', 'Absorption'], ['em', 'Émission'], ['ex', 'Excitation'], ['ph', 'Phosphorescence']];
const SCAN = { abs: [285, 430], ex: [285, 430], em: [370, 640], ph: [400, 640] };     // λ balayée
const FIXE = { em: [290, 420], ph: [290, 420], ex: [380, 600] };                      // λ fixée
const DUREE = 9000;
const TITRE = {
  abs: 'Spectre d’absorption',
  em: f => `Spectre d’émission (exc. ${nm(f)})`,
  ex: f => `Spectre d’excitation (dét. ${nm(f)})`,
  ph: () => 'Spectre de phosphorescence',
};
const defautFixe = (mode, mol) => (mode === 'ex' ? Math.round(X.lamMaxEmission(mol) / 5) * 5 : 350);
const marquer = (pts, a, b) => { const o = { ...pts }; for (let k = Math.ceil(Math.min(a, b)); k <= Math.floor(Math.max(a, b)); k++) o[k] = 1; o[Math.round(b)] = 1; return o; };
const valeur = (mode, mol, l, f) => (mode === 'abs' ? D.absorbance(mol, l) : D.signal(mol, mode, l, f));
const picDe = (mode, mol, f) => { let b = SCAN[mode][0], m = -1; for (let l = SCAN[mode][0]; l <= SCAN[mode][1]; l++) { const v = valeur(mode, mol, l, f); if (v > m) { m = v; b = l; } } return b; };
const plein = mode => marquer({}, SCAN[mode][0], SCAN[mode][1]);

// ---------- petits dessins ----------
const flecheV = (x, y1, y2, col, w, dash, k) => { const s = y2 < y1 ? 1 : -1;
  return <g key={k}><line x1={x} y1={y1} x2={x} y2={y2 + s * 9} stroke={col} strokeWidth={w} strokeDasharray={dash}/><polygon points={`${x},${y2} ${x - 6},${y2 + s * 12} ${x + 6},${y2 + s * 12}`} fill={col}/></g>; };
const ondule = (x, y1, y2, col, k) => { if (Math.abs(y2 - y1) < 6) return null; let d = `M${x},${y1}`; const n = Math.max(2, Math.floor(Math.abs(y2 - y1) / 6)), dy = (y2 - y1) / n;
  for (let i = 1; i <= n; i++) d += ` L${x + (i % 2 ? 4 : -4)},${y1 + dy * i - (i === n ? 0 : 0)}`;
  return <g key={k}><path d={d} fill="none" stroke={col} strokeWidth="1.8"/><polygon points={`${x},${y2 + 1} ${x - 4},${y2 - 7} ${x + 4},${y2 - 7}`} fill={col}/></g>; };

// ---------- ① le montage ----------
function Montage({ mode, mol, lamExc, lamDet, sig, A }) {
  const abs = mode === 'abs', ph = mode === 'ph', cExc = D.couleurLam(lamExc), cDet = D.couleurLam(lamDet);
  const lamGlow = ph ? X.lamDe(mol.T.E00 - 2 * mol.hw) : X.lamMaxEmission(mol), cGlow = D.couleurLam(lamGlow);
  const glow = ph ? 0.6 : abs ? 0.35 * D.absRel(mol, lamExc) : D.absRel(mol, lamExc);
  const trans = abs ? Math.max(0.12, 10 ** -A) : 0.9;
  const off = 0.3, CX = 226, CY = 120;
  const lcd = (x, y, txt, on) => <g opacity={on ? 1 : off}><rect x={x} y={y} width="84" height="30" rx="6" fill="#0f172a"/>{T(x + 42, y + 21, txt, { size: 17, gras: true, fill: '#86efac' })}</g>;
  return (<svg role="img" viewBox="0 44 400 290" style={{ display: 'block', width: '100%' }}
    aria-label={`Montage vu de dessus. ${ph ? 'Lampe coupée.' : `Excitation à ${nm(lamExc)}.`} ${abs ? `Détecteur dans l’axe : absorbance ${fr2(A)}.` : `Détecteur à 90° réglé sur ${nm(lamDet)} : signal ${Math.round(100 * sig)} %.`}`}>
    <defs><radialGradient id="fl-glow"><stop offset="0" stopColor={cGlow} stopOpacity=".9"/><stop offset="1" stopColor={cGlow} stopOpacity="0"/></radialGradient>
      <radialGradient id="fl-lampe"><stop offset="0" stopColor="#fffbeb"/><stop offset=".6" stopColor="#fde68a"/><stop offset="1" stopColor="#f59e0b"/></radialGradient></defs>
    {!ph && <><line x1="47" y1={CY} x2="64" y2={CY} stroke="#fde68a" strokeWidth="5"/>
      <line className="fl-flux" x1="148" y1={CY} x2={CX - 22} y2={CY} stroke={cExc} strokeWidth="5" strokeDasharray="7 6"/>
      <line className="fl-flux" x1={CX + 22} y1={CY} x2="328" y2={CY} stroke={cExc} strokeWidth="5" strokeDasharray="7 6" opacity={trans * (abs ? 1 : off + 0.1)}/></>}
    {!abs && <><line className="fl-flux-v" x1={CX} y1={CY + 22} x2={CX} y2="190" stroke={cGlow} strokeWidth="4" strokeDasharray="5 6" opacity={Math.max(0.15, glow)}/>
      <line className="fl-flux-v" x1={CX} y1="232" x2={CX} y2="266" stroke={cDet} strokeWidth="4" strokeDasharray="5 6" opacity={0.12 + 0.88 * sig}/></>}
    <circle cx="30" cy={CY} r="17" fill={ph ? '#e2e8f0' : 'url(#fl-lampe)'} stroke="#334155" strokeWidth="2"/><path d={`M23,${CY + 4} q3.5,-10 7,0 q3.5,10 7,0`} fill="none" stroke={ph ? '#94a3b8' : '#b45309'} strokeWidth="1.6"/>
    {T(30, 158, 'lampe', { size: 16, gras: true })}{ph && T(30, 176, 'coupée', { size: 16, gras: true, fill: K.rouge })}
    <rect x="64" y="98" width="84" height="44" rx="7" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="2"/>
    {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={82 + i * 9} y1="110" x2={90 + i * 9} y2="130" stroke="#7c3aed" strokeWidth="1.6"/>)}
    {T(106, 70, 'monochromateur', { size: 15, gras: true, fill: '#6d28d9' })}{T(106, 88, 'd’excitation', { size: 15, gras: true, fill: '#6d28d9' })}
    {!ph && <>{T(106, 164, nm(lamExc), { size: 17, gras: true, fill: '#6d28d9' })}{T(106, 182, mode === 'abs' || mode === 'ex' ? 'balayé' : 'fixé', { size: 15, fill: K.gris })}</>}
    {!abs && glow > 0.03 && <circle cx={CX} cy={CY} r="40" fill="url(#fl-glow)" opacity={Math.min(1, glow + 0.15)}/>}
    {!abs && glow > 0.03 && [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = Math.PI * a / 180; return <line key={a} x1={CX + 25 * Math.cos(r)} y1={CY + 25 * Math.sin(r)} x2={CX + 35 * Math.cos(r)} y2={CY + 35 * Math.sin(r)} stroke={cGlow} strokeWidth="2.4" opacity={Math.min(1, glow + 0.2)}/>; })}
    <rect x={CX - 22} y={CY - 22} width="44" height="44" rx="4" fill={abs ? '#f5f3ff' : '#f0fdf4'} stroke="#334155" strokeWidth="2.2"/>
    {T(192, 176, 'cuve', { size: 16, gras: true, anchor: 'end' })}
    <g opacity={abs ? 1 : off}><rect x="328" y="104" width="40" height="32" rx="6" fill="#e2e8f0" stroke="#334155" strokeWidth="2"/><circle cx="340" cy={CY} r="6" fill="#334155"/>
      {T(348, 158, 'détecteur', { size: 16, gras: true })}{T(348, 176, 'dans l’axe', { size: 15 })}</g>
    {lcd(306, 58, abs ? `A = ${fr2(A)}` : '—', abs)}
    <g opacity={abs ? off : 1}><rect x="192" y="190" width="68" height="42" rx="7" fill="#f0fdf4" stroke="#15803d" strokeWidth="2"/>
      {[0, 1, 2, 3, 4].map(i => <line key={i} x1={208 + i * 9} y1="201" x2={216 + i * 9} y2="221" stroke="#15803d" strokeWidth="1.6"/>)}
      {T(268, 204, 'monochromateur', { size: 15, gras: true, anchor: 'start', fill: '#166534' })}{T(268, 221, 'de détection', { size: 15, gras: true, anchor: 'start', fill: '#166534' })}
      {!abs && T(268, 244, `${nm(lamDet)} · ${mode === 'ex' ? 'fixé' : 'balayé'}`, { size: 16, gras: true, anchor: 'start' })}
      <rect x="208" y="266" width="36" height="30" rx="6" fill="#e2e8f0" stroke="#334155" strokeWidth="2"/><circle cx={CX} cy="281" r="6" fill="#334155"/>
      {T(252, 287, 'détecteur à 90°', { size: 16, gras: true, anchor: 'start' })}</g>
    {lcd(112, 266, abs ? '—' : `${Math.round(100 * sig)} %`, !abs)}
    {T(200, 326, abs ? 'Il mesure ce qui traverse : A = log(I₀ / I)' : 'À 90°, il ne reçoit que la lumière émise', { size: 15, fill: K.gris })}
  </svg>);
}

// ---------- ② la molécule : diagramme à l'échelle ----------
const yE = E => 292 - E * 55;
function Molecule({ mode, mol, lamExc, lamDet, sig }) {
  const E00 = mol.E00, hw = mol.hw, ET = mol.T?.E00, ph = mode === 'ph';
  const Eexc = X.HC / lamExc, Edet = X.HC / lamDet;
  const absorbe = !ph && D.absRel(mol, lamExc) > 0.03;
  const emet = mode !== 'abs' && sig > 0.02 && (ph || absorbe);
  const voie = ph ? 'phos' : D.emissionDominante(mol, lamDet);
  const Edep = voie === 'phos' ? ET : E00, Earr = Edep - Edet;
  const niveaux = (x1, x2, E0, id) => [0, 1, 2, 3, 4].map(v => <line key={id + v} x1={x1} x2={x2} y1={yE(E0 + v * hw)} y2={yE(E0 + v * hw)} stroke={v ? '#94a3b8' : '#0f172a'} strokeWidth={v ? 1.1 : 2.6}/>);
  const XA = 88, XF = 240, XP = 322;
  const lab = (x, y, l1, l2, col, anchor = 'start') => <g key={l1}>{T(x, y, l1, { size: 16, gras: true, fill: col, anchor, halo: true })}{T(x, y + 19, l2, { size: 15, fill: K.txt, anchor, halo: true })}</g>;
  return (<svg role="img" viewBox="0 0 420 320" style={{ display: 'block', width: '100%' }}
    aria-label={`Diagramme d’énergie à l’échelle de la molécule ${mol.id}. ${absorbe ? `Absorption d’un photon de ${eV(lamExc)}.` : ph ? '' : 'Pas d’absorption à cette longueur d’onde.'} ${emet ? `Émission d’un photon de ${eV(lamDet)}.` : ''}`}>
    <line x1="40" y1="296" x2="40" y2="40" stroke={K.gris} strokeWidth="1.5"/><polygon points="40,32 35,44 45,44" fill={K.gris}/>
    {T(40, 22, 'E (eV)', { size: 16, gras: true })}
    {[0, 1, 2, 3, 4].map(e => <g key={e}><line x1="36" x2="40" y1={yE(e)} y2={yE(e)} stroke={K.gris}/>{T(31, yE(e) + 5, String(e), { size: 15, fill: K.gris, anchor: 'end' })}</g>)}
    {niveaux(72, 392, 0, 's0')}{T(398, yE(0) + 5, 'S₀', { size: 16, gras: true, anchor: 'start' })}
    {niveaux(72, 252, E00, 's1')}{T(66, yE(E00) + 6, 'S₁', { size: 16, gras: true, anchor: 'end' })}
    {ET != null && <>{niveaux(270, 392, ET, 't1')}{T(398, yE(ET) + 5, 'T₁', { size: 16, gras: true, anchor: 'start' })}</>}
    {T(252, yE(E00 + 4 * hw) - 7, 'niveaux de vibration', { size: 14, fill: K.gris, anchor: 'end' })}
    {/* absorption */}
    {!ph && (absorbe ? <>{flecheV(XA, yE(0), yE(Eexc), D.couleurLam(lamExc, 0.7), 4.5, null, 'a')}{ondule(XA + 26, yE(Eexc), yE(E00), K.gris, 'rv1')}
      {Eexc - E00 > 0.1 && T(XA + 34, yE((Eexc + E00) / 2) + 5, 'RV', { size: 15, gras: true, fill: K.gris, anchor: 'start' })}
      {lab(XA + 8, 170, 'absorption', `${eV(lamExc)} · ${nm(lamExc)}`, '#6d28d9')}</>
      : <>{flecheV(XA, yE(0), yE(Eexc), '#94a3b8', 3, '5 4', 'a')}{lab(XA + 8, 170, '✕ pas absorbé', `aucun niveau à ${eV(lamExc)}`, K.rouge)}</>)}
    {/* croisement intersystème */}
    {ET != null && (ph || (emet && voie === 'phos')) && <><line x1={XF + 10} y1={yE(E00)} x2={XP - 26} y2={yE(ET) - 4} stroke="#c2410c" strokeWidth="2.4" strokeDasharray="6 4"/><polygon points={`${XP - 22},${yE(ET)} ${XP - 34},${yE(ET) - 3} ${XP - 28},${yE(ET) - 12}`} fill="#c2410c"/>
      {T((XF + XP) / 2 - 4, yE((E00 + ET) / 2) - 8, 'CIS', { size: 15, gras: true, fill: '#c2410c', halo: true })}</>}
    {/* émission */}
    {emet && <>{flecheV(voie === 'phos' ? XP : XF, yE(Edep), yE(Math.max(0, Earr)), D.couleurLam(lamDet, 0.7), 4.5, voie === 'phos' ? '8 4' : null, 'e')}
      {ondule((voie === 'phos' ? XP : XF) + 24, yE(Math.max(0, Earr)), yE(0), K.gris, 'rv2')}
      {voie === 'phos' ? lab(XP - 8, 214, 'phosphorescence', `${eV(lamDet)} · ${nm(lamDet)}`, '#b91c1c', 'end')
        : lab(XF + 8, 214, 'fluorescence', `${eV(lamDet)} · ${nm(lamDet)}`, '#15803d')}</>}
    {mode !== 'abs' && !emet && (ph || absorbe) && T(300, 214, `aucun photon émis à ${nm(lamDet)}`, { size: 15, fill: K.gris, halo: true })}
    {ph && T(60, 170, 'lampe coupée : pas d’absorption', { size: 15, fill: K.gris, anchor: 'start' })}
  </svg>);
}

// ---------- ③ le spectre ----------
const AX0 = 280, AX1 = 650, PX0 = 48, PX1 = 404, YB = 232, PH = 170;
const xL = l => PX0 + (l - AX0) / (AX1 - AX0) * (PX1 - PX0), lX = x => AX0 + (x - PX0) / (PX1 - PX0) * (AX1 - AX0);
function Spectre({ mode, mol, lamS, lamF, pts, onDrag, onKey, invite }) {
  const abs = mode === 'abs', yMax = abs ? 0.9 : 1.1, y = v => YB - PH * v / yMax;
  const val = l => (abs ? D.absorbance(mol, l) : D.signal(mol, mode, l, lamF));
  const cles = Object.keys(pts).map(Number).sort((a, b) => a - b), segs = [];
  for (const k of cles) { const s = segs[segs.length - 1]; if (s && k - s[s.length - 1] <= 1) s.push(k); else segs.push([k]); }
  const trace = s => s.map((l, i) => `${i ? 'L' : 'M'}${xL(l).toFixed(1)},${y(val(l)).toFixed(1)}`).join('');
  const stops = []; for (let l = AX0; l <= AX1; l += 10) stops.push(<stop key={l} offset={(l - AX0) / (AX1 - AX0)} stopColor={l < 380 ? '#c4b5fd' : D.couleurLam(l)}/>);
  const bandeAbs = []; for (let l = 285; l <= 430; l += 2) bandeAbs.push(`${l === 285 ? 'M' : 'L'}${xL(l).toFixed(1)},${(YB - 0.55 * PH * D.absRel(mol, l)).toFixed(1)}`);
  const lamExcM = abs || mode === 'ex' ? lamS : lamF, lamDetM = mode === 'ex' ? lamF : lamS;
  const repere = (l, rang, nom, quoi, balaye) => { const x = xL(l), col = D.couleurLam(l, 0.7), tx = Math.min(372, Math.max(80, x));
    return (<g key={quoi} role="slider" tabIndex={0} aria-label={`${nom}, ${balaye ? 'balayée' : 'fixée'}`} aria-valuemin={quoi === 's' ? SCAN[mode][0] : FIXE[mode][0]} aria-valuemax={quoi === 's' ? SCAN[mode][1] : FIXE[mode][1]} aria-valuenow={Math.round(l)} aria-valuetext={`${nm(l)}, ${eV(l)}`}
      onKeyDown={e => onKey(quoi, e)} style={{ cursor: 'ew-resize', outline: 'none' }}>
      <line x1={x} y1={YB} x2={x} y2={rang ? 54 : 34} stroke={col} strokeWidth="2.2" strokeDasharray={balaye ? '5 4' : null}/>
      <rect x={tx - 56} y={rang ? 37 : 13} width="112" height="25" rx="12.5" fill="#fff" stroke={col} strokeWidth="2"/>
      {T(tx, rang ? 55 : 31, `${nom} ${nm(l)}`, { size: 15, gras: true })}
      <circle cx={x} cy={YB} r="7" fill={col} stroke="#fff" strokeWidth="2" className={balaye && invite ? 'fl-pulse' : undefined}/>
      <rect x={x - 20} y={rang ? 36 : 14} width="40" height={YB - (rang ? 36 : 14) + 10} fill="transparent"/></g>); };
  return (<svg role="img" viewBox="0 0 420 296" style={{ display: 'block', width: '100%', touchAction: 'none' }} onPointerDown={e => onDrag('down', e)} onPointerMove={e => onDrag('move', e)} onPointerUp={e => onDrag('up', e)} onPointerCancel={e => onDrag('up', e)}
    aria-label={`${abs ? 'Spectre d’absorption' : 'Spectre'} de la molécule ${mol.id}, enregistré de ${cles.length ? nm(cles[0]) : '—'} à ${cles.length ? nm(cles[cles.length - 1]) : '—'}`}>
    <defs><linearGradient id={`fl-spg-${mode}`} gradientUnits="userSpaceOnUse" x1={PX0} x2={PX1} y1="0" y2="0">{stops}</linearGradient></defs>
    <line x1={PX0} y1={YB} x2={PX1} y2={YB} stroke={K.gris}/><line x1={PX0} y1={YB} x2={PX0} y2={YB - PH - 6} stroke={K.gris}/>
    <rect x={PX0} y={YB + 3} width={PX1 - PX0} height="9" fill={`url(#fl-spg-${mode})`} opacity=".9"/>
    {T((xL(AX0) + xL(380)) / 2, YB + 11, 'UV', { size: 12, gras: true, fill: '#fff' })}{T((xL(380) + PX1) / 2, YB + 11, 'visible', { size: 12, gras: true, fill: '#fff' })}
    {[300, 400, 500, 600].map(l => <g key={l}><line x1={xL(l)} y1={YB + 12} x2={xL(l)} y2={YB + 17} stroke={K.gris}/>{T(xL(l), YB + 32, String(l), { size: 15, fill: K.gris })}</g>)}
    {T(PX1, YB + 54, 'longueur d’onde λ (nm)', { size: 15, fill: K.gris, anchor: 'end' })}
    {(abs ? [0, 0.4, 0.8] : [0, 0.5, 1]).map(v => <g key={v}><line x1={PX0 - 4} y1={y(v)} x2={PX0} y2={y(v)} stroke={K.gris}/>{T(PX0 - 7, y(v) + 5, String(v).replace('.', ','), { size: 15, fill: K.gris, anchor: 'end' })}</g>)}
    <text x="14" y={YB - PH / 2} fontSize="15" fill={K.gris} textAnchor="middle" transform={`rotate(-90 14 ${YB - PH / 2})`} fontFamily="inherit">{abs ? 'absorbance A' : 'intensité relative'}</text>
    {!abs && <><path d={`${bandeAbs.join('')} L${xL(430)},${YB} L${xL(285)},${YB} Z`} fill="#ede9fe" stroke="#c4b5fd" strokeDasharray="4 3"/>{mode !== 'ex' && T(xL(345), YB - 0.55 * PH - 6, 'absorption', { size: 14, fill: '#7c3aed', halo: true })}</>}
    {segs.map((s, i) => s.length > 1 && <path key={'f' + i} d={`${trace(s)} L${xL(s[s.length - 1])},${YB} L${xL(s[0])},${YB} Z`} fill={`url(#fl-spg-${mode})`} opacity=".35"/>)}
    {segs.map((s, i) => s.length > 1 && <path key={'t' + i} d={trace(s)} fill="none" stroke={COLC[mode]} strokeWidth="3" strokeLinejoin="round"/>)}
    {!cles.length && T((PX0 + PX1) / 2, YB - PH / 2, 'Lancez l’enregistrement', { size: 15, fill: K.gris })}
    {!abs && mode !== 'ph' && repere(lamExcM, 1, 'exc.', mode === 'ex' ? 's' : 'f', mode === 'ex')}
    {abs ? repere(lamExcM, 0, 'exc.', 's', true) : repere(lamDetM, 0, 'dét.', mode === 'ex' ? 'f' : 's', mode !== 'ex')}
    <circle cx={xL(lamS)} cy={y(val(lamS))} r="5.5" fill={COLC[mode]} stroke="#fff" strokeWidth="2"/>
  </svg>);
}

// ---------- vue complète ----------
export function VueDispositif() {
  const reduit = reduitMouvement();
  const [mode, setMode] = useState('abs'), [molId, setMolId] = useState('A');
  const mol = X.MOLS_T[molId];
  const [lamF, setLamF] = useState(350);
  const [acq, setAcq] = useState(() => (reduit ? { lamS: 350, pts: plein('abs') } : { lamS: SCAN.abs[0], pts: {} }));
  const [scan, setScan] = useState(!reduit), [invite, setInvite] = useState(true);
  const pos = useRef(SCAN.abs[0]), drag = useRef(null);
  const lamS = acq.lamS;
  useEffect(() => {
    if (!scan) return undefined;
    const [lo, hi] = SCAN[mode]; let id, last = null;
    const f = ts => {
      if (last != null) { const prev = pos.current, l = Math.min(hi, prev + (ts - last) / DUREE * (hi - lo)); pos.current = l; setAcq(a => ({ lamS: l, pts: marquer(a.pts, prev, l) })); if (l >= hi) { const m = picDe(mode, mol, lamF); pos.current = m; setAcq(a => ({ ...a, lamS: m })); setScan(false); return; } }
      last = ts; id = requestAnimationFrame(f);
    };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [scan, mode, mol, lamF]);
  const enregistrer = (md = mode) => { const lo = SCAN[md][0]; if (reduit) { setAcq({ lamS: 350 <= SCAN[md][1] && 350 >= lo ? 350 : lo, pts: plein(md) }); return; } pos.current = lo; setAcq({ lamS: lo, pts: {} }); setScan(true); };
  const choisirMode = (md, m = mol) => { setScan(false); setMode(md); setLamF(defautFixe(md, m)); if (md === 'ph' || md === 'em') setAcq({ lamS: SCAN[md][0], pts: {} }); enregistrer(md); };
  const choisirMol = id => { const m = X.MOLS_T[id]; setMolId(id); choisirMode(mode === 'ph' && !m.T ? 'em' : mode, m); };
  const clamp = (l, [a, b]) => Math.min(b, Math.max(a, l));
  const bouger = (quoi, l) => {
    setInvite(false);
    if (quoi === 's') { const v = clamp(l, SCAN[mode]); setAcq(a => ({ lamS: v, pts: marquer(a.pts, a.lamS, v) })); }
    else { setLamF(Math.round(clamp(l, FIXE[mode]))); setAcq(a => ({ ...a, pts: {} })); }
  };
  const onDrag = (t, e) => {
    const svg = e.currentTarget, r = svg.getBoundingClientRect(), l = lX((e.clientX - r.left) * 420 / r.width);
    if (t === 'down') {
      setScan(false);
      const cand = mode === 'abs' || mode === 'ph' ? ['s'] : ['s', 'f'];
      drag.current = cand.reduce((b, q) => (Math.abs((q === 's' ? lamS : lamF) - l) < Math.abs((b === 's' ? lamS : lamF) - l) ? q : b), cand[0]);
      svg.setPointerCapture?.(e.pointerId); bouger(drag.current, l);
    } else if (t === 'move' && drag.current) bouger(drag.current, l);
    else if (t === 'up' && drag.current) { const q = drag.current; drag.current = null; if (q === 'f') enregistrer(); }
  };
  const onKey = (quoi, e) => { const d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key]; if (!d) return; e.preventDefault(); setScan(false); bouger(quoi, (quoi === 's' ? lamS : lamF) + d * (e.shiftKey ? 10 : 1)); };
  const lamExc = mode === 'abs' || mode === 'ex' ? lamS : lamF, lamDet = mode === 'ex' ? lamF : lamS;
  const sig = mode === 'abs' ? 0 : D.signal(mol, mode, lamS, lamF), A = D.absorbance(mol, lamExc);
  const absorbe = D.absRel(mol, lamExc) > 0.03;
  const phrase = mode === 'abs'
    ? (absorbe ? `À ${nm(lamExc)}, le photon (${eV(lamExc)}) a assez d’énergie pour porter la molécule de S₀ dans S₁ : il est absorbé, le détecteur reçoit moins de lumière (A = ${fr2(A)}).` : `À ${nm(lamExc)}, le photon (${eV(lamExc)}) ne correspond à aucun écart S₀ → S₁ : il traverse la cuve (A ≈ 0).`)
    : mode === 'ph' ? `Lampe coupée : seules les molécules restées dans T₁ émettent encore. À ${nm(lamDet)} (${eV(lamDet)}), le détecteur reçoit ${Math.round(100 * sig)} % du maximum.`
    : !absorbe ? `L’excitation à ${nm(lamExc)} n’est presque pas absorbée : la molécule n’est pas excitée, rien n’est émis.`
    : `Photon de ${nm(lamExc)} absorbé, puis relaxation jusqu’au bas de ${D.emissionDominante(mol, lamDet) === 'phos' ? 'T₁' : 'S₁'} et émission. À ${nm(lamDet)} (${eV(lamDet)}), le détecteur à 90° reçoit ${Math.round(100 * sig)} % du maximum.`;
  const titre = mode === 'abs' ? TITRE.abs : TITRE[mode](lamF);
  const panneau = (n, t, enfant) => (<div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '8px 8px 4px' }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, margin: '0 0 2px 4px' }}><span style={{ display: 'inline-block', width: 22, height: 22, lineHeight: '22px', borderRadius: 11, background: '#16a34a', color: '#fff', textAlign: 'center', fontSize: 13, marginRight: 6 }}>{n}</span>{t}</div>{enfant}</div>);
  return (<div>
    <style>{`
      .fl-pv { display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr); }
      @media (min-width: 900px) { .fl-pv { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      @media (prefers-reduced-motion: no-preference) {
        .fl-flux { animation: fl-flux 0.9s linear infinite; } .fl-flux-v { animation: fl-flux 0.9s linear infinite; }
        @keyframes fl-flux { to { stroke-dashoffset: -13; } }
        .fl-pulse { animation: fl-pulse 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes fl-pulse { 50% { transform: scale(1.6); } } }
    `}</style>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <div role="group" aria-label="Type de spectre" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {MODES.map(([k, l]) => <button key={k} onClick={() => choisirMode(k)} disabled={k === 'ph' && !mol.T} aria-pressed={mode === k} title={k === 'ph' && !mol.T ? 'Molécule B seulement' : undefined} style={{ ...stylePetitBouton(mode === k, '#16a34a'), opacity: k === 'ph' && !mol.T ? 0.45 : 1 }}>{l}</button>)}
      </div>
      <div role="group" aria-label="Molécule" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Molécule</span>
        {[['A', 'A (fluo.)'], ['B', 'B (phospho.)']].map(([k, l]) => <button key={k} onClick={() => choisirMol(k)} aria-pressed={molId === k} style={stylePetitBouton(molId === k, '#334155')}>{l}</button>)}
      </div>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <button onClick={() => (scan ? setScan(false) : enregistrer())} aria-pressed={scan} style={styleBouton(scan, '#16a34a')}>{scan ? '⏸ Pause' : '▶ Enregistrer le spectre'}</button>
      <div role="status" aria-live="off" style={{ flex: '1 1 320px', fontSize: 14, color: KIT.txt, lineHeight: 1.45 }}>{phrase}</div>
    </div>
    <div className="fl-pv">
      {panneau(1, 'Le montage', <Montage mode={mode} mol={mol} lamExc={lamExc} lamDet={lamDet} sig={sig} A={A}/>)}
      {panneau(2, 'Dans la molécule', <Molecule mode={mode} mol={mol} lamExc={lamExc} lamDet={lamDet} sig={sig}/>)}
      {panneau(3, titre, <Spectre mode={mode} mol={mol} lamS={lamS} lamF={lamF} pts={acq.pts} onDrag={onDrag} onKey={onKey} invite={invite}/>)}
    </div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>Faites glisser les repères « exc. » (excitation) et « dét. » (détection) sur le spectre. La longueur de chaque flèche du diagramme est l’énergie du photon : E (eV) = 1243 / λ (nm).</div>
  </div>);
}
