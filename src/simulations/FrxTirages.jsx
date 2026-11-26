// Schémas et commandes des tirages de la simulation 302 : un atome animé (photon X, éjection d'un électron K, retour d'un électron L ou M, photon de fluorescence ou effet Auger)
// et un spectre qui se construit coup par coup. Rien n'est codé par la seule couleur : flèches nommées, traits pleins ou tirets, texte sous le schéma.
import { K, T } from "./schemaOutils";
import * as X from "./frxTirages";
import { styleBouton, KIT } from "../commun";

const R = { K: 24, L: 50, M: 76 }, CX = 170, CY = 118;
const pt = (r, deg) => [CX + r * Math.cos(deg * Math.PI / 180), CY - r * Math.sin(deg * Math.PI / 180)];
const lerp = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
const seg = (p, a, b) => (p - a) / (b - a);
const eM = (x, y, k, col = '#2563eb') => <circle key={k} cx={x} cy={y} r="4.6" fill={col} stroke="#fff" strokeWidth="1"/>;
const onde = (x1, y1, x2, y2, col, haut = 5) => {
  const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1), n = Math.max(2, Math.round(L / 12)); let d = '';
  for (let i = 0; i <= n * 6; i++) { const s = i / (n * 6) * L, o = Math.sin(i / 6 * 2 * Math.PI) * haut; d += `${i ? 'L' : 'M'}${(x1 + s * Math.cos(a) - o * Math.sin(a)).toFixed(1)},${(y1 + s * Math.sin(a) + o * Math.cos(a)).toFixed(1)}`; }
  return <path d={d} fill="none" stroke={col} strokeWidth="2.4"/>;
};
const lacune = (x, y, k) => <circle key={k} cx={x} cy={y} r="6" fill="#fff" stroke="#dc2626" strokeWidth="1.8" strokeDasharray="3 2"/>;
const COL = { ph: '#7c3aed', ka: '#ea580c', kb: '#be123c', e: '#2563eb' };

// p : progression de l'animation (0 à 1). Phases : 0–0,25 photon incident ; 0,25–0,5 électron K éjecté ; 0,5–0,75 un électron comble la lacune ; 0,75–1 photon X émis (ou électron Auger).
export function SceneAtomeAnim({ d, p }) {
  const ion = d?.ion, voie = d?.voie, fluo = voie === 'ka' || voie === 'kb';
  const K30 = pt(R.K, 30), L30 = pt(R.L, 30), M60 = pt(R.M, 60), L75 = pt(R.L, 75);
  const debut = d == null;
  const xph = lerp(8, ion ? K30[0] - 8 : 332, ion ? seg(p, 0, 0.25) : seg(p, 0, 0.9));       // abscisse de la tête du photon incident
  const ejecte = ion && p > 0.25;
  const part = voie === 'kb' ? M60 : L30;
  const elL = [30, 75, 120, 165, 210, 255, 300, 345];
  return (<svg role="img" aria-label="Atome animé : un photon X arrive, éjecte un électron de la couche K, un électron d'une couche supérieure comble la lacune et un photon X est émis, ou bien l'énergie est perdue par effet Auger" viewBox="0 0 340 236" width="100%" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
    {['K', 'L', 'M'].map(c => <circle key={c} cx={CX} cy={CY} r={R[c]} fill="none" stroke={K.clair} strokeWidth="1.6"/>)}
    <circle cx={CX} cy={CY} r="9" fill="#7c3aed"/>{T(CX, CY + 4, '+', { size: 13, gras: true, fill: '#fff' })}
    {[['K', R.K], ['L', R.L], ['M', R.M]].map(([c, r]) => T(CX, CY + r + 4, c, { size: 13, gras: true, fill: K.gris, halo: true }))}
    {/* électrons immobiles */}
    {eM(...pt(R.K, 210), 'k210')}
    {elL.map(a => { if (ion && voie !== 'kb' && a === 30 && p > 0.5) return null; if (ion && voie === 'auger' && a === 75 && p > 0.75) return null; return eM(...pt(R.L, a), 'l' + a); })}
    {[60, 150, 240, 330].map(a => (ion && voie === 'kb' && a === 60 && p > 0.5) ? null : eM(...pt(R.M, a), 'm' + a))}
    {/* électron K touché */}
    {!ejecte && eM(...K30, 'k30')}
    {ejecte && p <= 1 && eM(lerp(K30[0], 300, seg(p, 0.25, 0.55)), lerp(K30[1], 20, seg(p, 0.25, 0.55)), 'ej', COL.e)}
    {ejecte && T(306, 36, 'e⁻', { size: 14, gras: true, fill: COL.e, opacity: seg(p, 0.45, 0.6) })}
    {ejecte && p < 0.5 && <g>{lacune(...K30, 'lk')}{T(K30[0] + 12, K30[1] - 8, 'lacune', { size: 12.5, gras: true, fill: '#dc2626', anchor: 'start', halo: true })}</g>}
    {/* électron qui comble la lacune */}
    {ion && p > 0.5 && eM(lerp(part[0], K30[0], seg(p, 0.5, 0.75)), lerp(part[1], K30[1], seg(p, 0.5, 0.75)), 'comble')}
    {ion && p > 0.5 && fluo && <g>{lacune(...part, 'lc')}{T(part[0] + 10, part[1] - 8, voie === 'ka' ? 'lacune L' : 'lacune M', { size: 12, gras: true, fill: '#dc2626', anchor: 'start', halo: true })}</g>}
    {ion && p > 0.5 && voie === 'auger' && <g>{lacune(...L30, 'la1')}{p > 0.75 && lacune(...L75, 'la2')}{T(L30[0] + 10, L30[1] - 8, 'lacunes L', { size: 12, gras: true, fill: '#dc2626', anchor: 'start', halo: true })}</g>}
    {/* photon incident */}
    {p < (ion ? 0.25 : 1) && !debut && xph > 12 && <g>{onde(Math.max(8, xph - 70), ion ? K30[1] : CY + 6, xph, ion ? K30[1] : CY + 6, COL.ph)}{T(34, (ion ? K30[1] : CY + 6) - 14, 'photon X', { size: 13, gras: true, fill: COL.ph, anchor: 'start', halo: true })}</g>}
    {/* photon X émis ou électron Auger */}
    {fluo && p > 0.75 && (() => { const u = seg(p, 0.75, 1), c = voie === 'ka' ? COL.ka : COL.kb, y0 = CY + (voie === 'ka' ? -4 : 6), y1 = CY + (voie === 'ka' ? -4 : 62), x2 = lerp(CX + 34, 326, u), y2 = lerp(y0, y1, u);
      return <g>{onde(CX + 34, y0, x2, y2, c)}{u > 0.5 && T(334, y1 + (voie === 'ka' ? -8 : 20), voie === 'ka' ? 'Kα' : 'Kβ', { size: 14, gras: true, fill: c, anchor: 'end' })}</g>; })()}
    {voie === 'auger' && p > 0.75 && (() => { const u = seg(p, 0.75, 1); return <g>{eM(lerp(L75[0], 20, u), lerp(L75[1], 222, u), 'auger', COL.e)}{u > 0.4 && T(34, 214, 'e⁻ Auger', { size: 13, gras: true, fill: COL.e, anchor: 'start', halo: true })}</g>; })()}
  </svg>);
}

// ---------- histogramme : photons X détectés, par case d'énergie de 0,1 keV ----------
const X0 = 46, X1 = 350, PH = 118, YB = 150;
const nice = m => { const e = 10 ** Math.floor(Math.log10(m)), f = m / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; };
export function SceneHistoX({ etat, params, el, courbe = false }) {
  const lo = Math.max(0, Math.floor((el.Ka - 1) * 2) / 2), hi = Math.ceil((el.Kb + 0.6) * 2) / 2, i0 = X.indice(lo + 0.05), i1 = X.indice(hi - 0.05);
  const att = courbe ? X.attendu(el, params, etat) : null;
  const mx = Math.max(4, ...etat.h.slice(i0, i1 + 1), ...(att ? att.slice(i0, i1 + 1) : [])), ymax = nice(mx * 1.15);
  const n = i1 - i0 + 1, bw = (X1 - X0) / n, yv = c => YB - PH * c / ymax, xe = E => X0 + (E - lo) / (hi - lo) * (X1 - X0);
  const total = etat.nKa + etat.nKb;
  const ticks = []; for (let E = Math.ceil(lo); E <= hi; E += (hi - lo) > 5 ? 1 : 0.5) ticks.push(E);
  return (<svg role="img" aria-label={`Spectre de fluorescence X construit coup par coup : ${total} photons détectés`} viewBox="0 0 370 200" width="100%" style={{ display: 'block', maxWidth: 480, margin: '0 auto' }}>
    {T(X0 - 6, 12, 'coups', { anchor: 'start', size: 13, fill: K.gris, gras: true })}
    <line x1={X0} y1={YB} x2={X1} y2={YB} stroke={K.gris}/><line x1={X0} y1={YB} x2={X0} y2={YB - PH - 4} stroke={K.gris}/>
    {(ymax < 10 ? [0, ymax] : [0, ymax / 2, ymax]).map(c => <g key={c}><line x1={X0 - 4} y1={yv(c)} x2={X0} y2={yv(c)} stroke={K.gris}/>{T(X0 - 7, yv(c) + 4, String(Math.round(c)), { anchor: 'end', size: 13.5, fill: K.gris })}</g>)}
    {ticks.map(E => <g key={E}><line x1={xe(E)} y1={YB} x2={xe(E)} y2={YB + 5} stroke={K.gris}/>{T(xe(E), YB + 18, String(E).replace('.', ','), { size: 13.5, fill: K.gris })}</g>)}
    {T(X1, YB + 34, 'énergie du photon X détecté (keV)', { anchor: 'end', size: 13.5, fill: K.gris })}
    {etat.h.slice(i0, i1 + 1).map((c, k) => c > 0 && <rect key={k} x={X0 + k * bw + 0.3} y={yv(c)} width={Math.max(0.5, bw - 0.6)} height={YB - yv(c)} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="0.6"/>)}
    {att && <path d={att.slice(i0, i1 + 1).map((c, k) => `${k ? 'L' : 'M'}${(X0 + (k + 0.5) * bw).toFixed(1)},${yv(c).toFixed(1)}`).join('')} fill="none" stroke={K.txt} strokeWidth="1.6" strokeDasharray="2 3"/>}
    {total > 0 && <g>{T(xe(el.Ka), 36, 'Kα', { size: 13.5, gras: true, fill: COL.ka, halo: true })}{etat.nKb > 0 && T(xe(el.Kb), 36, 'Kβ', { size: 13.5, gras: true, fill: COL.kb, halo: true })}</g>}
    {total === 0 && T((X0 + X1) / 2, YB - PH / 2, 'aucun photon X détecté pour l’instant', { size: 13.5, fill: K.gris })}
  </svg>);
}

export function CommandesTirages({ tir }) {
  const b = k => <button key={k} onClick={() => tir.lancer(k)} disabled={tir.plein} style={{ ...styleBouton(false), opacity: tir.plein ? 0.5 : 1 }}>{k === 1 ? '1 atome' : `× ${k}`}</button>;
  const vit = [['lent', 'Lent'], ['normal', 'Normal'], ['rapide', 'Rapide']];
  const occupe = !tir.t.etat.nEnv || tir.t.etat.lot > 1 || tir.lecture;
  return (<div>
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Irradier des atomes</div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Les atomes défilent un par un : « × 10 » dure une dizaine de secondes. Au-delà (× 1000), ils sont groupés et seul le bilan s’affiche.</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[1, 10, 100, 1000].map(b)}
      <button onClick={tir.basculeLecture} disabled={tir.plein} aria-pressed={tir.lecture} style={styleBouton(tir.lecture, '#16a34a')}>{tir.lecture ? '⏸ Pause' : '▶ Lecture'}</button>
      <button onClick={() => tir.rejouer()} disabled={occupe} style={{ ...styleBouton(false), opacity: occupe ? 0.5 : 1 }}>↻ Rejouer</button>
      <button onClick={tir.effacer} style={styleBouton(false)}>Effacer</button>
    </div>
    {tir.lecture && Number.isFinite(tir.restant) && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 6 }}>Encore {tir.restant} atome{tir.restant > 1 ? 's' : ''} à irradier (Pause pour arrêter).</div>}
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Vitesse de « Lecture » :</span>
      {vit.map(([k, l]) => <button key={k} onClick={() => tir.regler({ vitesse: k })} aria-pressed={tir.t.vitesse === k} style={styleBouton(tir.t.vitesse === k, '#334155')}>{l}</button>)}
    </div>
    {tir.plein && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Maximum atteint ({X.MAX_ATOMES.toLocaleString('fr-FR')} atomes) : effacez pour recommencer.</div>}
  </div>);
}

// ---------- tableau des cinq scénarios : probabilité attendue et nombre d'atomes obtenus ; le scénario du dernier atome est marqué ----------
const NB = '\u00a0';
const frp = v => (100 * v).toFixed(v < 0.1 ? 1 : 0).replace('.', ',') + NB + '%';
export function TableScenarios({ etat, params, el, marquer }) {
  const pr = X.probas(el, params), obs = [etat.nAutre, etat.nPasIon, etat.nKa, etat.nKb, etat.nAuger], cur = marquer ? X.scenario(etat.dernier) : -1;
  const lignes = [
    ['Le photon frappe un autre atome', 'aucune raie de ' + el.nom],
    [params.E < el.EK ? 'Photon d’énergie inférieure au seuil K' : 'Il frappe un atome de ' + el.nom + ' mais n’éjecte pas d’électron K', 'aucune raie'],
    ['Électron K éjecté, un électron L comble la lacune', 'photon Kα émis'],
    ['Électron K éjecté, un électron M comble la lacune', 'photon Kβ émis'],
    ['Électron K éjecté, énergie perdue par effet Auger', 'aucun photon X'],
  ];
  return (<div>
    <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Cinq scénarios possibles pour un photon X</div>
    <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.45, marginBottom: 6 }}>Chaque atome irradié suit l’un d’eux, tiré au hasard. Colonnes : probabilité prévue, nombre d’atomes obtenus. Le signe ◄ marque le scénario du dernier atome.</div>
    <div role="table" aria-label="Scénarios possibles pour un photon X">
      {lignes.map(([nom, suite], i) => (<div role="row" key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 52px 48px', gap: 6, alignItems: 'center', padding: '5px 6px', borderLeft: cur === i ? '4px solid #7c3aed' : '4px solid transparent', background: cur === i ? '#f5f3ff' : 'transparent', borderBottom: `1px dashed ${KIT.bord}`, fontSize: 13.5, lineHeight: 1.35, color: KIT.txt }}>
        <div role="cell"><strong>{i + 1}.</strong> {nom} <span style={{ color: KIT.txt2 }}>→ {suite}</span>{cur === i && <strong style={{ color: '#7c3aed' }}> ◄</strong>}</div>
        <div role="cell" style={{ textAlign: 'right', fontFamily: 'monospace' }} title="probabilité prévue">{frp(pr[i])}</div>
        <div role="cell" style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }} title="atomes obtenus">{obs[i]}</div>
      </div>))}
    </div>
  </div>);
}
