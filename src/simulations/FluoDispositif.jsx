// Vue « Dispositif et spectre » de la simulation 301 : un photon traverse le dispositif (lampe, monochromateurs, échantillon, détecteur),
// le diagramme de Perrin-Jablonski montre la transition en jeu et le spectre se trace pendant que le monochromateur balaie.
// Rien n'est codé par la seule couleur : noms écrits, styles de trait, « balayé » / « fixé » sous chaque monochromateur.
import { useState, useEffect } from "react";
import { K, T, fr } from "./schemaOutils";
import * as M from "./fluoModele";
import { SceneSpectresFluo } from "./FluoSchemas";
import * as X from "./fluoTirages";
import * as D from "./fluoDispositif";
import { SceneVibronique } from "./FluoTirages";
import { reduitMouvement } from "./hookHorloge";
import { KIT, styleBouton, styleBoite, LigneMesure } from "../commun";

const COL = { abs: '#7c3aed', fluo: '#15803d', phos: '#b91c1c', nr: '#64748b' };
const NB = ' ';
const DUREE_PHOTON = 2600, DUREE_BALAYAGE = 14000;
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const svgBloc = { display: 'block', width: '100%', maxWidth: 480, margin: '0 auto' };
const nm = l => `${Math.round(l)}${NB}nm`;

const SUP = { id: 'sup', nom: 'Absorption + émission' };
const HINT = {
  sup: 'Les deux spectres de la même molécule sur un même graphique : la bande d’émission est décalée vers les grandes longueurs d’onde par rapport à la bande d’absorption (décalage de Stokes). Comparez les deux molécules.',
  abs: 'Détecteur dans l’axe de la lampe : il reçoit la lumière qui n’a pas été absorbée. La bande d’absorption rassemble les transitions de S₀ vers les sous-niveaux de vibration de S₁, trop proches pour être séparés en solution.',
  em: 'Détecteur à 90° : il ne reçoit que la lumière émise par l’échantillon, pas le faisceau. L’excitation est fixée ; on balaie le monochromateur de détection : la bande d’émission rassemble les retours vers les sous-niveaux de vibration de S₀.',
  ex: 'Détecteur à 90°, réglé sur la fluorescence. On balaie la longueur d’onde d’excitation : le signal est le plus fort quand le photon est absorbé, donc le spectre d’excitation a l’allure du spectre d’absorption.',
  ph: 'La lampe est coupée : la fluorescence s’est éteinte, seule la phosphorescence (T₁ → S₀) arrive encore au détecteur à 90°. On balaie le monochromateur de détection.',
};
const AXE_X = { abs: 'λ d’excitation (nm)', ex: 'λ d’excitation (nm)', em: 'λ d’émission détectée (nm)', ph: 'λ d’émission détectée (nm)' };

// horloge en millisecondes, qui avance tant que `actif`
function useHorloge(actif) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!actif) return undefined;
    let id, last = null;
    const f = ts => { if (last != null) setT(v => v + (ts - last)); last = ts; id = requestAnimationFrame(f); };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [actif]);
  return t;
}

const texteTransitions = t => {
  const p = [];
  if (t.abs >= 0) p.push(`absorption S₀ v${NB}=${NB}0 → S₁ v′${NB}=${NB}${t.abs}`);
  if (t.fluo >= 0) p.push(`fluorescence S₁ v′${NB}=${NB}0 → S₀ v${NB}=${NB}${t.fluo}`);
  if (t.phos >= 0) p.push(`phosphorescence T₁ → S₀ v${NB}=${NB}${t.phos}`);
  return p.length ? p.join(' ; ') : 'aucune raie à cette longueur d’onde : signal très faible';
};

// ---------- le dispositif ----------
function SceneMontage({ mode, lamB, fixe, p, ev }) {
  const abs = mode === 'abs', ph = mode === 'ph', CX = 204, CY = 100;
  const lamExc = abs || mode === 'ex' ? lamB : fixe, lamDet = mode === 'ex' ? fixe : lamB;
  const excBalaye = abs || mode === 'ex';
  const colEm = ev.voie === 'phos' ? COL.phos : COL.fluo;
  const lit = p != null && ev.passe && p > 0.92;
  let photon = null;
  if (p != null) {
    const T1 = 0.32, E0 = ph ? 0.1 : 0.5, E1 = E0 + 0.22, E2 = E1 + 0.2;
    const els = [];
    if (!ph) {
      if (p < T1) els.push(<circle key="d" cx={44 + (CX - 44) * p / T1} cy={CY} r="5" fill={COL.abs} stroke="#fff" strokeWidth="1.5"/>);
      else if (!ev.absorbe) {
        const x1 = abs ? 330 : 276, q = Math.min(1, (p - T1) / ((abs ? 0.75 : 0.6) - T1));
        els.push(<circle key="d" cx={CX + (x1 - CX) * q} cy={CY} r="5" fill={COL.abs} stroke="#fff" strokeWidth="1.5" opacity={!abs && q >= 1 ? 0.35 : 1}/>);
      } else if (p < E0 + 0.05) {
        const q = (p - T1) / (0.55 - T1);
        els.push(<circle key="r" cx={CX} cy={CY} r={4 + 18 * q} fill="none" stroke={COL.abs} strokeWidth="2.4" opacity={Math.max(0, 1 - q * 0.7)}/>);
      }
    }
    if (ev.absorbe && (ph || p >= E0) && !abs && (ev.voie === 'fluo' || ev.voie === 'phos')) {
      const q1 = Math.min(1, Math.max(0, (p - E0) / (E1 - E0))), y = CY + 46 * q1;
      if (ev.passe) { const q2 = Math.min(1, Math.max(0, (p - E1) / (E2 - E1))); els.push(<circle key="e" cx={CX} cy={q2 > 0 ? 148 + 52 * q2 : y} r="5" fill={colEm} stroke="#fff" strokeWidth="1.5"/>); }
      else { els.push(<circle key="e" cx={CX} cy={y} r="5" fill={colEm} stroke="#fff" strokeWidth="1.5" opacity={q1 >= 1 ? 0.4 : 1}/>); if (q1 >= 1) els.push(T(CX + 22, 143, '✕ arrêté', { anchor: 'start', size: 12, fill: COL.phos, gras: true, halo: true })); }
    }
    if (ev.absorbe && (ev.voie === 'nr' || ev.voie === 'nrT') && (ph || p > 0.5)) els.push(T(CX + 26, CY + 4, 'chaleur', { anchor: 'start', size: 12, fill: COL.nr, gras: true, halo: true }));
    photon = els;
  }
  return (<svg role="img" aria-label={`Dispositif expérimental : lampe, monochromateur d’excitation réglé sur ${nm(lamExc)}, échantillon, ${abs ? 'détecteur placé dans l’axe' : `monochromateur de détection réglé sur ${nm(lamDet)} puis détecteur à 90 degrés`}`} viewBox="0 0 400 226" style={svgBloc}>
    {/* faisceau */}
    {!ph && <><line x1="44" y1={CY} x2="64" y2={CY} stroke="#c4b5fd" strokeWidth="3"/><line x1="112" y1={CY} x2={CX - 18} y2={CY} stroke="#c4b5fd" strokeWidth="3"/>{abs ? <line x1={CX + 18} y1={CY} x2="316" y2={CY} stroke="#c4b5fd" strokeWidth="3"/> : <line x1={CX + 18} y1={CY} x2="276" y2={CY} stroke="#c4b5fd" strokeWidth="3" strokeDasharray="2 5"/>}</>}
    {/* lampe */}
    <rect x="14" y="84" width="30" height="32" rx="6" fill={ph ? '#e2e8f0' : '#fde68a'} stroke="#334155" strokeWidth="2"/>
    {T(29, 134, 'lampe', { size: 12, gras: true })}{ph && T(29, 148, 'coupée', { size: 12, fill: COL.phos, gras: true })}
    {/* monochromateur d'excitation */}
    <rect x="64" y="82" width="48" height="36" rx="6" fill="#ede9fe" stroke={COL.abs} strokeWidth="2.2"/><line x1="76" y1="108" x2="100" y2="92" stroke={COL.abs} strokeWidth="2"/>
    {T(88, 74, 'mono. d’excitation', { size: 12, gras: true, fill: COL.abs })}
    {!ph && <>{T(88, 134, nm(lamExc), { size: 12.5, gras: true, fill: COL.abs })}{T(88, 148, excBalaye ? 'balayé' : 'fixé', { size: 12, fill: K.gris })}</>}
    {ph && <>{T(88, 134, nm(lamExc), { size: 12.5, fill: K.gris, gras: true })}{T(88, 148, 'avant l’arrêt', { size: 12, fill: K.gris })}</>}
    {/* échantillon */}
    <rect x={CX - 18} y="66" width="36" height="68" rx="4" fill={ph ? '#fee2e2' : '#dcfce7'} stroke="#334155" strokeWidth="2"/><rect x={CX - 18} y="66" width="36" height="14" rx="3" fill="#fff" opacity=".6"/>
    {T(CX, 58, 'échantillon', { size: 12, gras: true })}
    {/* détecteur dans l'axe ou à 90° */}
    {abs ? <>
      <rect x="316" y="86" width="34" height="28" rx="5" fill={lit || (p != null && !ev.absorbe && p > 0.75) ? '#bbf7d0' : '#f1f5f9'} stroke="#334155" strokeWidth="2"/>
      {T(333, 132, 'détecteur', { size: 12, gras: true })}{T(333, 146, 'dans l’axe', { size: 12, fill: K.gris })}
      {T(200, 212, 'il mesure la lumière transmise', { size: 12.5, fill: K.gris })}</> : <>
      <line x1={CX} y1="134" x2={CX} y2="146" stroke="#94a3b8" strokeWidth="3" strokeDasharray="2 4"/>
      <rect x={CX - 24} y="146" width="48" height="28" rx="6" fill="#dcfce7" stroke={ph ? COL.phos : COL.fluo} strokeWidth="2.2"/><line x1={CX - 12} y1="166" x2={CX + 12} y2="154" stroke={ph ? COL.phos : COL.fluo} strokeWidth="2"/>
      {T(CX + 32, 158, 'mono. de détection', { anchor: 'start', size: 12, gras: true, fill: ph ? COL.phos : COL.fluo })}
      {T(CX + 32, 172, `${nm(lamDet)} (${mode === 'ex' ? 'fixé' : 'balayé'})`, { anchor: 'start', size: 12.5, gras: true })}
      <line x1={CX} y1="174" x2={CX} y2="190" stroke="#94a3b8" strokeWidth="3" strokeDasharray="2 4"/>
      <rect x={CX - 18} y="190" width="36" height="26" rx="5" fill={lit ? '#bbf7d0' : '#f1f5f9'} stroke="#334155" strokeWidth="2"/>
      {T(CX + 28, 208, 'détecteur à 90°', { anchor: 'start', size: 12, gras: true })}</>}
    {photon}
  </svg>);
}

// ---------- le spectre qui se trace ----------
const X0 = 46, X1 = 388, Y0 = 162, H = 112;
function SceneSpectre({ mol, mode, lamB, fixe, courbe, balaye }) {
  const [lo, hi] = D.DOMAINE[mode], x = l => X0 + (l - lo) / (hi - lo) * (X1 - X0), y = s => Y0 - H * s;
  const sMax = Math.max(...courbe.map(c => c.s)), faible = sMax < 0.05;
  const trace = pts => pts.map((c, i) => `${i ? 'L' : 'M'}${x(c.lam).toFixed(1)},${y(c.s).toFixed(1)}`).join('');
  const jusque = courbe.filter(c => c.lam <= lamB), sNow = D.signal(mol, mode, lamB, fixe);
  const colC = mode === 'ph' ? COL.phos : mode === 'em' ? COL.fluo : COL.abs;
  const grad = [];
  for (let l = Math.ceil(lo / 50) * 50; l <= hi; l += 50) grad.push(l);
  return (<svg role="img" aria-label={`Spectre ${mode === 'abs' ? 'd’absorption' : mode === 'ex' ? 'd’excitation' : mode === 'em' ? 'd’émission' : 'de phosphorescence'} de la molécule ${mol.id} : signal relatif ${Math.round(100 * sNow)} pour cent à ${Math.round(lamB)} nanomètres`} viewBox="0 0 400 206" style={svgBloc}>
    {T(X0 - 6, 12, 'signal relatif', { anchor: 'start', size: 12.5, fill: K.gris, gras: true })}
    <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={K.gris}/><line x1={X0} y1={Y0} x2={X0} y2={Y0 - H - 6} stroke={K.gris}/>
    {grad.map(l => <g key={l}><line x1={x(l)} y1={Y0} x2={x(l)} y2={Y0 + 5} stroke={K.gris}/>{T(x(l), Y0 + 19, String(l), { size: 12.5, fill: K.gris })}</g>)}
    {T(X1, Y0 + 36, AXE_X[mode], { anchor: 'end', size: 12.5, fill: K.gris })}
    {!faible && <path d={trace(courbe)} fill="none" stroke={colC} strokeWidth={balaye ? 1.4 : 2.6} strokeDasharray={balaye ? '2 3' : undefined} opacity={balaye ? 0.6 : 1}/>}
    {!faible && balaye && jusque.length > 1 && <path d={trace(jusque)} fill="none" stroke={colC} strokeWidth="2.8"/>}
    <line x1={x(lamB)} y1={Y0} x2={x(lamB)} y2={Y0 - H - 4} stroke={K.txt} strokeWidth="1.6" strokeDasharray="4 3"/>
    {!faible && <circle cx={x(lamB)} cy={y(sNow)} r="5" fill={colC} stroke="#fff" strokeWidth="1.8"/>}
    {faible && T((X0 + X1) / 2, Y0 - H / 2, mol.T || mode !== 'ph' ? 'λ fixée hors des raies d’absorption : presque aucun photon absorbé' : 'cette molécule ne phosphoresce pas', { size: 12.5, fill: K.gris })}
  </svg>);
}

// ---------- vue complète ----------
export function VueDispositif() {
  const [d, setD] = useState({ mode: 'abs', mol: 'A', lamBal: 350, fixe: 350 });
  const [lecture, setLecture] = useState(false), [balaye, setBalaye] = useState(false);
  const tP = useHorloge(lecture), tB = useHorloge(balaye);
  const sup = d.mode === 'sup', mm = sup ? 'abs' : d.mode;
  const mol = X.MOLS_T[d.mol], [lo, hi] = D.DOMAINE[mm];
  const lamB = balaye ? lo + ((tB % DUREE_BALAYAGE) / DUREE_BALAYAGE) * (hi - lo) : d.lamBal;
  const idx = Math.floor(tP / DUREE_PHOTON), p = lecture ? (tP % DUREE_PHOTON) / DUREE_PHOTON : null;
  const ev = D.evenement(mol, mm, lamB, d.fixe, idx);
  const trans = D.transitions(mol, mm, lamB, d.fixe);
  const courbe = D.courbe(mol, mm, d.fixe);
  const dernier = lecture ? ev : (trans.abs >= 0 || trans.fluo >= 0 || trans.phos >= 0)
    ? { absorbe: true, vAbs: trans.abs, voie: trans.fluo >= 0 ? 'fluo' : trans.phos >= 0 ? 'phos' : undefined, v: trans.fluo >= 0 ? trans.fluo : trans.phos } : null;
  const sNow = D.signal(mol, mm, lamB, d.fixe);
  const changerMode = mode => { setBalaye(false); setD(s => ({ ...s, mode, lamBal: D.lamDefaut(mode, X.MOLS_T[s.mol]), fixe: D.fixeDefaut(mode, X.MOLS_T[s.mol]) })); };
  const changerMol = id => { setBalaye(false); setD(s => { const m = X.MOLS_T[id], mode = D.modeValide(s.mode, m) ? s.mode : 'em'; return { ...s, mol: id, mode, lamBal: D.lamDefaut(mode, m), fixe: D.fixeDefaut(mode, m) }; }); };
  const basculeBalayage = () => { if (balaye) setD(s => ({ ...s, lamBal: Math.round(lamB) })); setBalaye(b => !b); };
  const sansMouvement = reduitMouvement();
  const [fLo, fHi] = d.mode === 'ex' ? [380, 580] : [300, 410];
  const nomBal = d.mode === 'abs' || d.mode === 'ex' ? 'λ d’excitation' : 'λ de détection';
  const nomFixe = d.mode === 'ex' ? 'λ de détection (fixée)' : 'λ d’excitation (fixée)';
  const selects = (<>
    <div style={{ marginTop: 8 }}><label htmlFor="fl-dm" style={libelle}>Type de spectre</label>
      <select id="fl-dm" value={d.mode} onChange={ev2 => changerMode(ev2.target.value)} style={selectStyle}>{[...D.MODES, SUP].map(m => <option key={m.id} value={m.id} disabled={!D.modeValide(m.id, mol)}>{m.nom}{D.modeValide(m.id, mol) ? '' : ' (molécule B)'}</option>)}</select></div>
    <div style={{ marginTop: 8 }}><label htmlFor="fl-dmol" style={libelle}>Molécule</label>
      <select id="fl-dmol" value={d.mol} onChange={ev2 => changerMol(ev2.target.value)} style={selectStyle}>{Object.values(X.MOLS_T).map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></div></>);
  const style = (<style>{`
      .fl-dp { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr); grid-template-areas: "hint" "montage" "spectre" "regl" "diag" "mes"; }
      .fl-dp.sup { grid-template-areas: "hint" "spectre" "regl" "mes"; }
      .fl-dp > * { min-width: 0; }
      @media (min-width: 901px) { .fl-dp { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); grid-template-areas: "hint hint" "montage regl" "diag regl" "spectre mes"; }
        .fl-dp.sup { grid-template-areas: "hint hint" "spectre regl" "spectre mes"; } }
    `}</style>);
  if (sup) {
    const ms = M.MOLS[d.mol];
    return (<div className="fl-dp sup">{style}
      <div style={{ gridArea: 'hint', fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>{HINT.sup}</div>
      <div style={{ gridArea: 'spectre' }}><SceneSpectresFluo mol={ms}/></div>
      <div style={{ gridArea: 'regl', ...styleBoite }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Choisissez la mesure</div>
        <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Choisissez un autre type de spectre pour voir le montage, le diagramme et le tracé pas à pas.</div>{selects}</div>
      <div style={{ gridArea: 'mes', ...styleBoite }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
        <LigneMesure nom="Maximum d’absorption" valeur={`${ms.lamAbs}${NB}nm (${fr(M.energie(ms.lamAbs), 2)}${NB}eV)`}/>
        <LigneMesure nom="Maximum de fluorescence" valeur={`${ms.lamFluo}${NB}nm (${fr(M.energie(ms.lamFluo), 2)}${NB}eV)`}/>
        <LigneMesure nom="Énergie perdue" valeur={`${fr(M.decalageStokes(ms.lamAbs, ms.lamFluo), 2)}${NB}eV`}/>
        <LigneMesure nom="Part de l’énergie perdue" valeur={`${fr(100 * M.partPerdue(ms.lamAbs, ms.lamFluo), 0)}${NB}%`}/>
        {ms.lamPhos && <LigneMesure nom="Maximum de phosphorescence" valeur={`${ms.lamPhos}${NB}nm (${fr(M.energie(ms.lamPhos), 2)}${NB}eV)`}/>}
      </div></div>);
  }
  return (<div className="fl-dp">{style}
    <div style={{ gridArea: 'hint', fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>{HINT[d.mode]}</div>
    <div style={{ gridArea: 'montage' }}><SceneMontage mode={d.mode} lamB={lamB} fixe={d.fixe} p={p} ev={ev}/></div>
    <div style={{ gridArea: 'diag' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 2 }}>La transition en jeu sur le diagramme</div>
      <SceneVibronique mol={mol} dernier={dernier}/>
    </div>
    <div style={{ gridArea: 'spectre' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 2 }}>Le spectre obtenu</div>
      <SceneSpectre mol={mol} mode={d.mode} lamB={lamB} fixe={d.fixe} courbe={courbe} balaye={balaye}/>
    </div>
    <div style={{ gridArea: 'regl', ...styleBoite }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Choisissez la mesure</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Déplacez la longueur d’onde ou lancez le balayage : le détecteur, le diagramme et le spectre bougent ensemble.</div>
      {selects}
      <div style={{ marginTop: 8 }}><label htmlFor="fl-dl" style={libelle}>{nomBal} : {nm(lamB)}</label>
        <input id="fl-dl" type="range" min={lo} max={hi} step="1" value={Math.round(lamB)} disabled={balaye} onChange={ev2 => setD(s => ({ ...s, lamBal: parseInt(ev2.target.value, 10) }))} style={{ width: '100%', accentColor: '#16a34a' }}/></div>
      {d.mode !== 'abs' && <div style={{ marginTop: 8 }}><label htmlFor="fl-df" style={libelle}>{d.mode === 'ph' ? 'λ d’excitation avant l’arrêt' : nomFixe} : {nm(d.fixe)}</label>
        <input id="fl-df" type="range" min={fLo} max={fHi} step={d.mode === 'ex' ? 5 : 1} value={d.fixe} onChange={ev2 => setD(s => ({ ...s, fixe: parseInt(ev2.target.value, 10) }))} style={{ width: '100%', accentColor: '#16a34a' }}/></div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        <button onClick={() => setLecture(l => !l)} aria-pressed={lecture} style={styleBouton(lecture, '#16a34a')}>{lecture ? '⏸ Pause' : '▶ Photon par photon'}</button>
        <button onClick={basculeBalayage} aria-pressed={balaye} style={styleBouton(balaye, '#16a34a')}>{balaye ? '⏸ Arrêter le balayage' : '↔ Balayer le spectre'}</button>
      </div>
      {sansMouvement && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Animations réduites dans votre système : utilisez le curseur de longueur d’onde.</div>}
      <div role="status" aria-live="off" style={{ marginTop: 10, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5, minHeight: 60 }}>
        <strong>{lecture ? `Photon n° ${idx + 1} : ` : 'Transition en jeu : '}</strong>{lecture ? D.texteEvenement(ev, d.mode) : texteTransitions(trans)}</div>
    </div>
    <div style={{ gridArea: 'mes', ...styleBoite }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Détecteur" valeur={d.mode === 'abs' ? 'dans l’axe (lumière transmise)' : 'à 90° (lumière émise)'}/>
      <LigneMesure nom={nomBal} valeur={nm(lamB)}/>
      {d.mode !== 'abs' && <LigneMesure nom={d.mode === 'ph' ? 'λ d’excitation avant l’arrêt' : nomFixe} valeur={nm(d.fixe)}/>}
      <LigneMesure nom="Signal relatif" valeur={`${Math.round(100 * sNow)}${NB}%`}/>
    </div>
  </div>);
}
