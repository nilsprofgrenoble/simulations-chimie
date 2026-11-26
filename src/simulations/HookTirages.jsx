// Schémas et commandes des tirages de la simulation 304 : un photon IR traverse (ou non) l'échantillon, le spectre de transmittance se construit case par case.
// Rien n'est codé par la seule couleur : légende numérotée, marque ◄ du scénario observé, noms écrits.
import { K, T } from "./schemaOutils";
import * as X from "./hookTirages";
import { styleBouton, KIT } from "../commun";

const NB = ' ';
const lerp = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
const seg = (p, a, b) => (p - a) / (b - a);
const onde = (x1, y, x2, col, haut = 5) => {
  const L = Math.max(2, x2 - x1); let d = '';
  for (let i = 0; i <= 60; i++) { const s = i / 60 * L; d += `${i ? 'L' : 'M'}${(x1 + s).toFixed(1)},${(y + Math.sin(s / 6 * Math.PI * 1) * haut).toFixed(1)}`; }
  return <g><path d={d} fill="none" stroke={col} strokeWidth="2.4"/><polygon points={`${x2 + 7},${y} ${x2 - 2},${y - 5} ${x2 - 2},${y + 5}`} fill={col}/></g>;
};
const COL = { ph: '#b45309', det: '#15803d', abs: '#7c3aed' };

// p : progression de 0 à 1. 0–0,4 le photon va vers l'échantillon ; absorbé : 0,4–0,8 la liaison vibre ; transmis : 0,4–0,8 il traverse puis 0,8–1 le détecteur compte.
export function SceneCuveIR({ d, p }) {
  const abs = d?.absorbe, xh = !d ? 56 : p < 0.4 ? lerp(56, 124, seg(p, 0, 0.4)) : lerp(124, 272, seg(p, 0.4, 0.8));
  const vib = abs && p > 0.4 ? (p < 0.8 ? 1 : 1 - seg(p, 0.8, 1)) * 11 * Math.sin((p - 0.4) * 2 * Math.PI * 7) : 0;
  const xa = 150 - vib, xb = 190 + vib, ya = 93;
  const nPts = 9, ress = Array.from({ length: nPts + 1 }, (_, i) => `${(xa + 10 + (xb - xa - 20) * i / nPts).toFixed(1)},${(ya + (i === 0 || i === nPts ? 0 : i % 2 ? 7 : -7)).toFixed(1)}`).join(' ');
  const flash = !abs && d && p >= 0.8;
  return (<svg role="img" aria-label="Un photon infrarouge part de la source, traverse l'échantillon ou y est absorbé, et est compté par le détecteur s'il traverse" viewBox="0 0 340 170" width="100%" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
    <rect x="6" y="63" width="46" height="60" rx="6" fill="#fef3c7" stroke={COL.ph} strokeWidth="1.8"/>{T(29, 90, 'source', { size: 12.5, gras: true })}{T(29, 106, 'IR', { size: 12.5, gras: true })}
    <rect x="118" y="38" width="104" height="110" rx="8" fill="#f0fdfa" stroke="#0f766e" strokeWidth="1.8"/>{T(170, 160, 'échantillon', { size: 12.5, gras: true, fill: '#0f766e' })}
    <circle cx={xa} cy={ya} r="9" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.4"/><circle cx={xb} cy={ya} r="9" fill="#ef4444" stroke="#0f172a" strokeWidth="1.4"/><polyline points={ress} fill="none" stroke="#0f766e" strokeWidth="2"/>
    {T(170, 128, 'liaison', { size: 12, fill: K.gris })}
    <rect x="276" y="63" width="62" height="60" rx="6" fill={flash ? '#dcfce7' : '#f1f5f9'} stroke={COL.det} strokeWidth={flash ? 3 : 1.8}/>{T(307, 88, 'détecteur', { size: 12, gras: true })}{flash && T(307, 108, '+1 coup', { size: 12.5, gras: true, fill: COL.det })}
    {d && p < 0.4 && onde(56, ya, xh, COL.ph)}
    {d && p >= 0.4 && !abs && p < 0.8 && onde(Math.max(56, xh - 64), ya, xh, COL.ph)}
    {d && p < 0.8 && !(abs && p >= 0.4) && T(Math.min(Math.max(xh - 30, 70), 250), ya - 18, `σ = ${Math.round(d.sigma)} cm⁻¹`, { size: 12.5, gras: true, fill: COL.ph, halo: true })}
    {abs && p >= 0.4 && p < 0.8 && <g>{T(170, 30, `absorbé : ${X.nomBande(d.bande)}`, { size: 12.5, gras: true, fill: COL.abs, halo: true })}{T(170, 72, '✦', { size: 20, fill: COL.abs })}</g>}
    {abs && p >= 0.8 && T(250, 80, 'rien n’arrive', { size: 12, fill: K.gris })}
    {!d && T(170, 20, 'En attente d’un photon', { size: 12.5, fill: K.gris })}
  </svg>);
}

// ---------- spectre qui se construit : transmittance estimée (transmis / envoyés) dans chaque case de 25 cm⁻¹ ----------
const X0 = 40, X1 = 352, PH = 120, YB = 150, sx = s => X0 + (X.SMAX - s) / (X.SMAX - X.SMIN) * (X1 - X0), sy = t => YB - PH * t / 100;
export function SceneSpectreTir({ etat, mol, params }) {
  const bw = (X1 - X0) / X.NBINS;
  const courbe = params.courbe ? Array.from({ length: X.NBINS }, (_, i) => `${i ? 'L' : 'M'}${(sx(X.centre(i))).toFixed(1)},${sy(X.prevue(mol, i)).toFixed(1)}`).join('') : null;
  return (<svg role="img" aria-label={`Spectre infrarouge construit photon par photon : ${etat.nEnv} photons envoyés`} viewBox="0 0 370 200" width="100%" style={{ display: 'block', maxWidth: 480, margin: '0 auto' }}>
    {T(X0 - 4, 14, 'T (%) = transmis / envoyés', { anchor: 'start', size: 12.5, fill: K.gris, gras: true })}
    <line x1={X0} y1={YB} x2={X1} y2={YB} stroke={K.gris}/><line x1={X0} y1={YB} x2={X0} y2={YB - PH - 4} stroke={K.gris}/>
    {[0, 50, 100].map(t => <g key={t}><line x1={X0 - 4} y1={sy(t)} x2={X0} y2={sy(t)} stroke={K.gris}/>{T(X0 - 6, sy(t) + 4, String(t), { anchor: 'end', size: 12.5, fill: K.gris })}</g>)}
    {[4000, 3000, 2000, 1000, 500].map(s => <g key={s}><line x1={sx(s)} y1={YB} x2={sx(s)} y2={YB + 5} stroke={K.gris}/>{T(sx(s), YB + 18, String(s), { size: 12.5, fill: K.gris })}</g>)}
    {T(X1, YB + 34, 'nombre d’onde σ (cm⁻¹)', { anchor: 'end', size: 12.5, fill: K.gris })}
    {Array.from({ length: X.NBINS }, (_, i) => { const t = X.estimee(etat, i); return t != null && <rect key={i} x={sx(X.centre(i)) - bw / 2} y={sy(t)} width={Math.max(1.2, bw)} height={YB - sy(t)} fill="#1d4ed8" opacity={Math.min(1, 0.3 + etat.env[i] / 25)}/>; })}
    {courbe && <path d={courbe} fill="none" stroke={K.txt} strokeWidth="1.6" strokeDasharray="2 3"/>}
    {params.mode === 'choisi' && <g><line x1={sx(params.sigma)} y1={34} x2={sx(params.sigma)} y2={YB} stroke="#b45309" strokeDasharray="4 3" strokeWidth="1.8"/>{T(sx(params.sigma), 28, `σ choisi ${params.sigma}`, { size: 12.5, gras: true, fill: '#b45309', halo: true })}</g>}
    {etat.nEnv === 0 && T((X0 + X1) / 2, YB - PH / 2, 'aucun photon envoyé pour l’instant', { size: 13, fill: K.gris })}
  </svg>);
}

// ---------- encart des deux scénarios ----------
const frp = v => (100 * v).toFixed(v < 0.1 && v > 0 ? 1 : 0).replace('.', ',') + NB + '%';
export function PanneauScenariosIR({ etat, params, mol, courant, demo, prog, tir }) {
  const pT = X.probaTransmis(mol, params), pr = [pT, 1 - pT], obs = [etat.nEnv - etat.nAbs, etat.nAbs];
  const lignes = [['Le photon traverse l’échantillon', 'un coup au détecteur'], ['Le photon est absorbé par une vibration', 'aucun coup']];
  const vit = [['normal', 'Normal'], ['lent', 'Ralenti'], ['tres', 'Très ralenti']];
  return (<div>
    <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Deux scénarios possibles</div>
    <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.45, marginBottom: 6 }}>Le scénario observé s’allume (◄). Touchez une ligne pour le voir seul. Colonnes : probabilité prévue{params.mode === 'choisi' ? ' à ce σ' : ' (σ tiré entre 500 et 4000 cm⁻¹)'}, photons obtenus.</div>
    <div role="list" aria-label="Scénarios possibles pour un photon infrarouge">
      {lignes.map(([nom, suite], i) => { const on = courant === i, choisi = demo?.sc === i; return (
        <button role="listitem" key={i} className={`ir-sc${on ? ' on' : ''}`} onClick={() => tir.jouerScenario(i)} aria-label={`Voir le scénario ${i + 1} : ${nom}, ${suite}`}
          style={{ display: 'grid', gridTemplateColumns: '22px minmax(0, 1fr) 48px 44px', gap: 4, alignItems: 'center', width: '100%', textAlign: 'left', cursor: 'pointer', padding: '6px 6px', margin: 0, borderTop: 'none', borderRight: 'none', borderBottom: `1px dashed ${KIT.bord}`, borderLeft: on ? '5px solid #0f766e' : '5px solid transparent', background: on ? '#ccfbf1' : 'transparent', fontSize: 13.5, lineHeight: 1.3, color: KIT.txt, fontFamily: 'inherit', outline: choisi ? '2px solid #0f766e' : 'none', outlineOffset: -2 }}>
          <span aria-hidden="true" style={{ fontWeight: 700 }}>{on ? '◄' : '▶'}</span>
          <span><strong>{i + 1}.</strong> {nom} <span style={{ color: KIT.txt2 }}>→ {suite}</span></span>
          <span style={{ textAlign: 'right', fontFamily: 'monospace' }} title="probabilité prévue">{frp(pr[i])}</span>
          <span style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }} title="photons obtenus">{obs[i]}</span>
        </button>); })}
    </div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Démonstration :</span>
      {vit.map(([k, l]) => <button key={k} onClick={() => tir.setVitDemo(k)} aria-pressed={tir.vitDemo === k} style={styleBouton(tir.vitDemo === k, '#334155')}>{l}</button>)}
    </div>
    {demo && <div style={{ marginTop: 8 }}>
      <label htmlFor="ir-av" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Scénario {demo.sc + 1} seul (aucun comptage) : avancement</label>
      <input id="ir-av" type="range" min="0" max="100" step="1" value={Math.round(prog * 100)} onChange={ev => tir.setManuel(parseInt(ev.target.value, 10) / 100)} aria-label="Avancement de l’animation" style={{ width: '100%', accentColor: '#0f766e' }}/>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>Glissez le curseur pour avancer ou reculer image par image.</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button onClick={() => tir.jouerScenario(demo.sc)} style={styleBouton(true, '#0f766e')}>↻ Rejouer ce scénario</button>
        <button onClick={tir.quitterDemo} style={styleBouton(false)}>Revenir aux tirages</button>
      </div>
    </div>}
  </div>);
}

export function CommandesTiragesIR({ tir }) {
  const b = k => <button key={k} onClick={() => tir.lancer(k)} disabled={tir.plein} style={{ ...styleBouton(false), opacity: tir.plein ? 0.5 : 1 }}>{k === 1 ? '1 photon' : `× ${k}`}</button>;
  const vit = [['lent', 'Lent'], ['normal', 'Normal'], ['rapide', 'Rapide']];
  const occupe = !tir.t.etat.nEnv || tir.t.etat.lot > 1 || tir.lecture;
  return (<div>
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Envoyer des photons</div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Les photons défilent un par un : « × 10 » dure une quinzaine de secondes. « × 1000 » les groupe : seul le bilan s’affiche.</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[1, 10, 100, 1000].map(b)}
      <button onClick={tir.basculeLecture} disabled={tir.plein} aria-pressed={tir.lecture} style={styleBouton(tir.lecture, '#0f766e')}>{tir.lecture ? '⏸ Pause' : '▶ Lecture'}</button>
      <button onClick={() => tir.rejouer()} disabled={occupe} style={{ ...styleBouton(false), opacity: occupe ? 0.5 : 1 }}>↻ Rejouer</button>
      <button onClick={tir.effacer} style={styleBouton(false)}>Effacer</button>
    </div>
    {tir.lecture && Number.isFinite(tir.restant) && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 6 }}>Encore {tir.restant} photon{tir.restant > 1 ? 's' : ''} à envoyer (Pause pour arrêter).</div>}
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Vitesse de « Lecture » :</span>
      {vit.map(([k, l]) => <button key={k} onClick={() => tir.regler({ vitesse: k })} aria-pressed={tir.t.vitesse === k} style={styleBouton(tir.t.vitesse === k, '#334155')}>{l}</button>)}
    </div>
    {tir.plein && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Maximum atteint ({X.MAX_PHOTONS.toLocaleString('fr-FR')} photons) : effacez pour recommencer.</div>}
  </div>);
}
