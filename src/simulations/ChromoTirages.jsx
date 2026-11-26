// Schémas et commandes des tirages de la simulation 303 : un photon traverse la solution ou y est absorbé (transition électronique) ; le spectre d'absorbance se construit case par case.
// Rien n'est codé par la seule couleur : légende numérotée, marque ◄ du scénario observé, longueur d'onde et domaine écrits.
import { K, T } from "./schemaOutils";
import * as X from "./chromoTirages";
const { couleurOnde } = X;
import { styleBouton, KIT } from "../commun";

const NB = ' ';
const lerp = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
const seg = (p, a, b) => (p - a) / (b - a);
const onde = (x1, y, x2, col, haut = 5) => {
  const L = Math.max(2, x2 - x1); let d = '';
  for (let i = 0; i <= 60; i++) { const s = i / 60 * L; d += `${i ? 'L' : 'M'}${(x1 + s).toFixed(1)},${(y + Math.sin(s / 6 * Math.PI) * haut).toFixed(1)}`; }
  return <g><path d={d} fill="none" stroke={col} strokeWidth="2.6"/><polygon points={`${x2 + 7},${y} ${x2 - 2},${y - 5} ${x2 - 2},${y + 5}`} fill={col}/></g>;
};

// p : progression de 0 à 1. 0–0,4 le photon va vers la solution ; absorbé : 0,4–0,6 l'électron monte, reste en haut jusqu'à 0,8, puis redescend ; transmis : 0,4–0,8 il traverse, 0,8–1 le détecteur compte.
export function SceneCuveUV({ d, p, css }) {
  const abs = d?.absorbe, ya = 93;
  const xh = !d ? 56 : p < 0.4 ? lerp(56, 118, seg(p, 0, 0.4)) : lerp(118, 272, seg(p, 0.4, 0.8));
  const haut = abs && p >= 0.4 ? (p < 0.6 ? seg(p, 0.4, 0.6) : p < 0.8 ? 1 : 1 - seg(p, 0.8, 1)) : 0;
  const flash = !abs && d && p >= 0.8, col = d ? couleurOnde(d.lam) : '#64748b';
  return (<svg role="img" aria-label="Un photon part de la lampe, traverse la solution ou y est absorbé (un électron passe à un niveau d'énergie supérieur), et est compté par le détecteur s'il traverse" viewBox="0 0 340 170" width="100%" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
    <rect x="4" y="63" width="50" height="60" rx="6" fill="#fef9c3" stroke="#a16207" strokeWidth="1.8"/>{T(29, 90, 'lampe', { size: 12.5, gras: true })}{T(29, 106, 'UV-vis', { size: 12, gras: true })}
    <rect x="118" y="38" width="104" height="110" rx="8" fill={css ?? '#f0fdfa'} stroke="#334155" strokeWidth="1.8" opacity="0.9"/><rect x="123" y="44" width="94" height="98" rx="5" fill="#ffffff" opacity="0.72"/>
    {T(170, 160, 'solution', { size: 12.5, gras: true })}
    <line x1="132" y1="124" x2="208" y2="124" stroke="#0f172a" strokeWidth="2.4"/><line x1="132" y1="72" x2="208" y2="72" stroke="#0f172a" strokeWidth="2.4" strokeDasharray="6 3"/>
    {T(170, 137, 'fondamental', { size: 11.5, fill: K.gris })}{T(170, 66, 'excité', { size: 11.5, fill: K.gris })}
    <circle cx="170" cy={lerp(118, 78, haut)} r="6" fill="#2563eb" stroke="#fff" strokeWidth="1.2"/>
    <rect x="276" y="63" width="62" height="60" rx="6" fill={flash ? '#dcfce7' : '#f1f5f9'} stroke="#15803d" strokeWidth={flash ? 3 : 1.8}/>{T(307, 88, 'détecteur', { size: 12, gras: true })}{flash && T(307, 108, '+1 coup', { size: 12.5, gras: true, fill: '#15803d' })}
    {d && p < 0.4 && onde(56, ya, xh, col)}
    {d && p >= 0.4 && !abs && p < 0.8 && onde(Math.max(56, xh - 64), ya, xh, col)}
    {d && p < 0.8 && !(abs && p >= 0.4) && T(Math.min(Math.max(xh - 30, 70), 250), ya - 18, `λ = ${Math.round(d.lam)} nm`, { size: 12.5, gras: true, fill: '#0f172a', halo: true })}
    {abs && p >= 0.4 && p < 0.8 && T(170, 28, 'absorbé : transition électronique', { size: 12, gras: true, fill: '#7c3aed', halo: true })}
    {abs && p >= 0.8 && T(250, 80, 'rien n’arrive', { size: 12, fill: K.gris })}
    {!d && T(170, 20, 'En attente d’un photon', { size: 12.5, fill: K.gris })}
  </svg>);
}

// ---------- spectre qui se construit : absorbance estimée −log10(transmis / envoyés) dans chaque case de 5 nm ----------
const X0 = 40, X1 = 352, PH = 118, YB = 150, YM = 2.4, sx = l => X0 + (l - 200) / 600 * (X1 - X0), sy = a => YB - PH * a / YM;
export function SceneSpectreTirUV({ etat, params }) {
  const bw = (X1 - X0) / X.NBINS;
  const courbe = params.courbe ? Array.from({ length: X.NBINS }, (_, i) => `${i ? 'L' : 'M'}${sx(X.centre(i)).toFixed(1)},${sy(X.absorbanceCase(params, i)).toFixed(1)}`).join('') : null;
  return (<svg role="img" aria-label={`Spectre d'absorption construit photon par photon : ${etat.nEnv} photons envoyés`} viewBox="0 0 370 204" width="100%" style={{ display: 'block', maxWidth: 480, margin: '0 auto' }}>
    <rect x={sx(380)} y={YB - PH - 2} width={sx(780) - sx(380)} height={PH + 2} fill="#f1f5f9" opacity=".8"/>
    {T(sx(290), YB - PH + 10, 'UV', { size: 12.5, gras: true, fill: K.gris })}{T(sx(580), YB - PH + 10, 'visible', { size: 12.5, gras: true, fill: K.gris })}
    {T(X0 - 4, 12, 'A = −log (transmis / envoyés)', { anchor: 'start', size: 12.5, fill: K.gris, gras: true })}
    <line x1={X0} y1={YB} x2={X1} y2={YB} stroke={K.gris}/><line x1={X0} y1={YB} x2={X0} y2={YB - PH - 2} stroke={K.gris}/>
    {[0, 1, 2].map(a => <g key={a}><line x1={X0 - 4} y1={sy(a)} x2={X0} y2={sy(a)} stroke={K.gris}/>{T(X0 - 6, sy(a) + 4, String(a), { anchor: 'end', size: 12.5, fill: K.gris })}</g>)}
    {[200, 300, 400, 500, 600, 700, 800].map(l => <g key={l}><line x1={sx(l)} y1={YB} x2={sx(l)} y2={YB + 5} stroke={K.gris}/>{T(sx(l), YB + 18, String(l), { size: 12.5, fill: K.gris })}</g>)}
    {T(X1, YB + 36, 'longueur d’onde λ (nm)', { anchor: 'end', size: 12.5, fill: K.gris })}
    {Array.from({ length: X.NBINS }, (_, i) => { const a = X.absorbanceEstimee(etat, i); return a != null && a > 0 && <rect key={i} x={sx(X.centre(i)) - bw / 2} y={sy(a)} width={Math.max(1.2, bw)} height={YB - sy(a)} fill="#1d4ed8" opacity={Math.min(1, 0.3 + etat.env[i] / 25)}/>; })}
    {courbe && <path d={courbe} fill="none" stroke={K.txt} strokeWidth="1.6" strokeDasharray="2 3"/>}
    {params.mode === 'choisi' && <g><line x1={sx(params.lamChoisi)} y1={34} x2={sx(params.lamChoisi)} y2={YB} stroke="#b45309" strokeDasharray="4 3" strokeWidth="1.8"/>{T(sx(params.lamChoisi), 26, `λ choisie ${params.lamChoisi}`, { size: 12.5, gras: true, fill: '#b45309', halo: true })}</g>}
    {etat.nEnv === 0 && T((X0 + X1) / 2, YB - PH / 2, 'aucun photon envoyé pour l’instant', { size: 13, fill: K.gris })}
  </svg>);
}

// ---------- encart des deux scénarios ----------
const frp = v => (100 * v).toFixed(v < 0.1 && v > 0 ? 1 : 0).replace('.', ',') + NB + '%';
export function PanneauScenariosUV({ etat, params, courant, demo, prog, tir }) {
  const pT = X.probaTransmis(params), pr = [pT, 1 - pT], obs = [etat.nEnv - etat.nAbs, etat.nAbs];
  const lignes = [['Le photon traverse la solution', 'un coup au détecteur'], ['Le photon est absorbé (transition électronique)', 'aucun coup']];
  const vit = [['normal', 'Normal'], ['lent', 'Ralenti'], ['tres', 'Très ralenti']];
  return (<div>
    <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Deux scénarios possibles</div>
    <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.45, marginBottom: 6 }}>Le scénario observé s’allume (◄). Touchez une ligne pour le voir seul. Colonnes : probabilité prévue{params.mode === 'choisi' ? ' à cette λ' : ' (λ tirée entre 200 et 800 nm)'}, photons obtenus.</div>
    <div role="list" aria-label="Scénarios possibles pour un photon">
      {lignes.map(([nom, suite], i) => { const on = courant === i, choisi = demo?.sc === i; return (
        <button role="listitem" key={i} className={`ch-sc${on ? ' on' : ''}`} onClick={() => tir.jouerScenario(i)} aria-label={`Voir le scénario ${i + 1} : ${nom}, ${suite}`}
          style={{ display: 'grid', gridTemplateColumns: '22px minmax(0, 1fr) 48px 44px', gap: 4, alignItems: 'center', width: '100%', textAlign: 'left', cursor: 'pointer', padding: '6px 6px', margin: 0, borderTop: 'none', borderRight: 'none', borderBottom: `1px dashed ${KIT.bord}`, borderLeft: on ? '5px solid #7c3aed' : '5px solid transparent', background: on ? '#ede9fe' : 'transparent', fontSize: 13.5, lineHeight: 1.3, color: KIT.txt, fontFamily: 'inherit', outline: choisi ? '2px solid #7c3aed' : 'none', outlineOffset: -2 }}>
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
      <label htmlFor="ch-av" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Scénario {demo.sc + 1} seul (aucun comptage) : avancement</label>
      <input id="ch-av" type="range" min="0" max="100" step="1" value={Math.round(prog * 100)} onChange={ev => tir.setManuel(parseInt(ev.target.value, 10) / 100)} aria-label="Avancement de l’animation" style={{ width: '100%', accentColor: '#7c3aed' }}/>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>Glissez le curseur pour avancer ou reculer image par image.</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button onClick={() => tir.jouerScenario(demo.sc)} style={styleBouton(true, '#7c3aed')}>↻ Rejouer ce scénario</button>
        <button onClick={tir.quitterDemo} style={styleBouton(false)}>Revenir aux tirages</button>
      </div>
    </div>}
  </div>);
}

export function CommandesTiragesUV({ tir }) {
  const b = k => <button key={k} onClick={() => tir.lancer(k)} disabled={tir.plein} style={{ ...styleBouton(false), opacity: tir.plein ? 0.5 : 1 }}>{k === 1 ? '1 photon' : `× ${k}`}</button>;
  const vit = [['lent', 'Lent'], ['normal', 'Normal'], ['rapide', 'Rapide']];
  const occupe = !tir.etat.nEnv || tir.etat.lot > 1 || tir.lecture;
  return (<div>
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Envoyer des photons</div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Les photons défilent un par un : « × 10 » dure une quinzaine de secondes. « × 1000 » les groupe : seul le bilan s’affiche.</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[1, 10, 100, 1000].map(b)}
      <button onClick={tir.basculeLecture} disabled={tir.plein} aria-pressed={tir.lecture} style={styleBouton(tir.lecture, '#7c3aed')}>{tir.lecture ? '⏸ Pause' : '▶ Lecture'}</button>
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
