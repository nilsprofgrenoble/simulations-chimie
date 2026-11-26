import { useState, useMemo, useRef, useCallback } from "react";
import { KIT, styleBoite, Section, Curseur } from "../commun";
import { trajet } from "./lancerTrajet";
import { OBJETS } from "./lancerChuteModele";
import { COL, nbf, J, imageA, Seg, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarresEnergie, BarresHtml, GrapheTemps, BarreLecture, Chips } from "./exploAnim";

// ====================================================
//  Exploration animée de la simulation 251 (lancer vertical, courbes d'énergie).
//  On tire la flèche verte pour régler la vitesse de lancement, un clic sur la balle la lance.
//  Mouvement : lancerTrajet.js (RK4, frottement k·v² facultatif). La plate-forme fait 3 m : l'origine des altitudes peut être au lancement ou au sol.
// ====================================================
const W = 700, H = 400, XB = 300, YG = 348, HP = 3, PXV = 8;

export function LancerExplore() {
  const [p, setP] = useState({ obj: 'tennis', v0: 15, frott: false, off: 0 });
  const [ouv, setOuv] = useState(false), [fige, setFige] = useState(null);
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite);
  const tr = useMemo(() => trajet(p), [p]);
  const L = useLecture(tr.tFin);
  const { t } = L;
  const q = imageA(tr.frames, t);
  const regler = useCallback(ch => { L.reset(); setP(s => ({ ...s, ...ch })); }, [L]);

  const Sauto = Math.min((YG - 36) / (HP + Math.max(tr.hSans, tr.hMax) * 1.08 + 1.5), 16), S = fige || Sauto;
  const yL = YG - HP * S;                                  // niveau du point de lancement (sommet de la plate-forme)
  const y0 = p.off === 0 ? yL : YG;                        // niveau de l'origine des altitudes
  const o = tr.o, r = o.id === 'mousse' ? 14 : o.id === 'tennis' ? 10.5 : 9;
  const cy = z => yL - z * S - r;                          // centre de la balle à l'altitude de lancement + z
  const yb0 = cy(0), tipV = yb0 - r - 8 - p.v0 * PXV;

  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type, bouge: false }; if (type === 'vit') setFige(Sauto); L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d || d.type !== 'vit') return;
    const { Y } = coordSvg(svgRef.current, ev); d.bouge = true;
    const v = Math.min(Math.max(Math.round((yb0 - r - 8 - Y) / PXV), 5), 20); if (v !== p.v0) regler({ v0: v });
  };
  const fait = ev => {
    const d = drag.current; drag.current = null;
    try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ }
    if (d && d.type === 'vit') setFige(null);
    if (d && d.type === 'balle' && !d.bouge) L.demarrer();
  };
  const clavier = ev => {
    const sens = ev.key === 'ArrowUp' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' ? -1 : 0; if (!sens) return;
    ev.preventDefault(); regler({ v0: Math.min(Math.max(p.v0 + sens, 5), 20) });
  };

  const Fm = etroit ? 1.3 : 1;
  const Emax = Math.max(tr.Em0, 1) * 1.05;
  const aPasse = t >= tr.tMax - 1e-9 && t > 0;
  const lP = 14 + 40 * Math.min(o.m / 0.5, 1) + 4, lF = Math.min(lP * q.f / (o.m * 9.8), 95);   // longueurs des flèches (même échelle)
  const dirF = q.v > 0 ? 1 : -1;                                  // le frottement s'oppose à la vitesse (vers le bas en montée)
  const pasZ = [1, 2, 5, 10].find(s => s * S >= 34) || 10;
  const ticks = []; for (let z = 0; y0 - z * S > 24; z += pasZ) ticks.push(z);
  const message = !L.touche && !L.joue && t === 0 ? 'Clique sur la balle (ou sur « Lancer ») pour la lancer vers le haut. Tire la flèche verte pour changer la vitesse de lancement.'
    : !L.fin ? ''
    : p.frott ? `Sommet à ${nbf(tr.hMax, 1)} m au-dessus du lancement (sans frottement : ${nbf(tr.hSans, 1)} m). Retour à ${nbf(tr.vRetour, 1)} m/s au lieu de ${p.v0} m/s : ${J(tr.Em0 - q.Em)} ont été dissipés par l’air.`
    : `Sommet à ${nbf(tr.hMax, 1)} m au-dessus du lancement, atteint après ${nbf(tr.tMax, 2)} s. Em est restée constante : la balle revient à ${p.v0} m/s.`;

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? `0 40 ${W} ${H - 40}` : `0 0 ${W} ${H}`} role="img" aria-label="Scène animée : une balle est lancée vers le haut depuis une plate-forme, monte jusqu’à son sommet puis retombe ; les barres d’énergie suivent son mouvement.">
        <DefsAnim/>
        <rect width={W} height={H} fill="url(#xa-ciel)"/>
        <path d={`M0,${YG - 40} C150,${YG - 100} 300,${YG - 20} 430,${YG - 60} C540,${YG - 95} 620,${YG - 40} ${W},${YG - 75} L${W},${YG} L0,${YG} Z`} fill="#dbeafe" opacity="0.6"/>
        <rect y={YG} width={W} height={H - YG} fill="url(#xa-sol)"/>
        <line x1="0" y1={YG} x2={W} y2={YG} stroke="#57534e" strokeWidth="3"/>
        {/* règle des altitudes */}
        <line x1="96" y1={y0} x2="96" y2={Math.max(30, yL - (tr.hSans * 1.05) * S)} stroke="#64748b" strokeWidth="2"/>
        {ticks.map(z => <g key={z}><line x1="90" y1={y0 - z * S} x2="104" y2={y0 - z * S} stroke="#64748b" strokeWidth="2"/><text x="84" y={y0 - z * S + 5} textAnchor="end" fontSize={14 * Fm} fontWeight="700" fill="#475569">{z} m</text></g>)}
        <line x1="96" y1={y0} x2={XB + 120} y2={y0} stroke={COL.Epp} strokeWidth="2" strokeDasharray="7 5"/>
        <text x="110" y={y0 - 7} fontSize={14 * Fm} fontWeight="800" fill={COL.Epp} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">z = 0 {p.off === 0 ? '(lancement)' : '(sol)'}</text>
        {/* sommet sans frottement et sommet atteint */}
        {p.frott && <g><line x1="96" y1={yL - tr.hSans * S} x2={XB + 150} y2={yL - tr.hSans * S} stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 5"/><text x="110" y={yL - tr.hSans * S - 6} fontSize={14 * Fm} fontWeight="700" fill="#64748b" stroke="#fff" strokeWidth="3.5" paintOrder="stroke">sans frottement : {nbf(tr.hSans + p.off, 1)} m</text></g>}
        {aPasse && <g><line x1="96" y1={yL - tr.hMax * S} x2={XB + 150} y2={yL - tr.hMax * S} stroke={COL.Em} strokeWidth="2.5" strokeDasharray="8 4"/><text x="110" y={yL - tr.hMax * S - 6} fontSize={15 * Fm} fontWeight="800" fill={COL.Em} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">sommet : {nbf(tr.hMax + p.off, 1)} m</text></g>}
        {/* plate-forme + lanceur */}
        <g filter="url(#xa-ombre)">
          <rect x={XB - 62} y={yL} width="124" height={YG - yL} fill="url(#xa-acier)" stroke="#64748b" strokeWidth="2"/>
          {Array.from({ length: Math.max(Math.floor((YG - yL) / 22), 1) }, (_, i) => <line key={i} x1={XB - 62} x2={XB + 62} y1={yL + 22 * (i + 1)} y2={yL + 22 * (i + 1)} stroke="#94a3b8" strokeWidth="1.2" opacity="0.7"/>)}
          <rect x={XB - 70} y={yL - 5} width="140" height="9" rx="3" fill="#475569"/>
          <rect x={XB - 16} y={yL - 12} width="32" height="12" rx="3" fill="#1e293b"/>
        </g>
        {/* balle au départ (poignée) et fantôme */}
        <g className="xa-poignee" role="button" tabIndex={0} aria-label="Balle : cliquer pour la lancer" style={{ cursor: 'pointer' }} onPointerDown={debut('balle')} onPointerUp={fait} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); L.demarrer(); } }}>
          <circle cx={XB} cy={yb0} r={r + 14} fill="transparent"/>
          {t === 0 ? <Balle id={o.id} x={XB} y={yb0} r={r}/> : <circle cx={XB} cy={yb0} r={r} fill="#fef3c7" stroke="#d97706" strokeDasharray="4 3" strokeWidth="2" opacity="0.5"/>}
        </g>
        {/* flèche de vitesse de lancement */}
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Flèche de vitesse : vitesse de lancement" aria-valuemin={5} aria-valuemax={20} aria-valuenow={p.v0} aria-valuetext={`${p.v0} mètres par seconde`}
          onPointerDown={debut('vit')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <line x1={XB} y1={yb0 - r - 8} x2={XB} y2={tipV} stroke={COL.v} strokeWidth="5" strokeLinecap="round"/>
          <circle cx={XB} cy={tipV} r="24" fill="transparent"/>
          {!L.touche && <circle className="xa-pulse" cx={XB} cy={tipV} r="13" fill="none" stroke={COL.v} strokeWidth="3"/>}
          <circle className="xa-anneau" cx={XB} cy={tipV} r="11" fill="#f0fdf4" stroke={COL.v} strokeWidth="3.5" filter="url(#xa-ombre)"/>
          <path d={`M ${XB} ${tipV + 5} v -10 M ${XB - 4} ${tipV - 1} l 4 -4 l 4 4`} fill="none" stroke={COL.v} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <text x={XB + 22} y={tipV + 5} fontSize={16 * Fm} fontWeight="800" fill={COL.v} stroke="#fff" strokeWidth="4" paintOrder="stroke">v₀ = {p.v0} m/s</text>
        {/* balle en vol */}
        {t > 0 && <g pointerEvents="none">
          <Balle id={o.id} x={XB} y={cy(q.z)} r={r}/>
          {!L.fin && Math.abs(q.v) > 0.3 && <line x1={XB + r + 12} y1={cy(q.z)} x2={XB + r + 12} y2={cy(q.z) - Math.sign(q.v) * Math.min(Math.abs(q.v) * 6, 110)} stroke={COL.v} strokeWidth="4.5" strokeLinecap="round" markerEnd="url(#xa-pointe)"/>}
          {!L.fin && <g><line x1={XB - r - 12} y1={cy(q.z)} x2={XB - r - 12} y2={cy(q.z) + lP} stroke={COL.rouge} strokeWidth="4.5" strokeLinecap="round"/>
          <polygon points={`${XB - r - 12},${cy(q.z) + lP + 9} ${XB - r - 18},${cy(q.z) + lP - 2} ${XB - r - 6},${cy(q.z) + lP - 2}`} fill={COL.rouge}/>
          <text x={XB - r - 22} y={cy(q.z) + lP / 2} textAnchor="end" fontSize={15 * Fm} fontWeight="800" fill={COL.rouge} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">P</text></g>}
          {!L.fin && p.frott && lF > 2 && <g><line x1={XB - r - 36} y1={cy(q.z)} x2={XB - r - 36} y2={cy(q.z) + dirF * -1 * lF} stroke={COL.Epp} strokeWidth="4.5" strokeLinecap="round"/>
            <polygon points={`${XB - r - 36},${cy(q.z) - dirF * lF - dirF * 9} ${XB - r - 42},${cy(q.z) - dirF * lF + dirF * 2} ${XB - r - 30},${cy(q.z) - dirF * lF + dirF * 2}`} fill={COL.Epp}/>
            <text x={XB - r - 46} y={cy(q.z) - dirF * lF / 2 + 5} textAnchor="end" fontSize={15 * Fm} fontWeight="800" fill={COL.Epp} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">f</text></g>}
        </g>}
        {!L.touche && !L.joue && t === 0 && <g className="xa-tire" pointerEvents="none"><text x={XB + r + 10} y={yb0 + 4} fontSize={16 * Fm} fontWeight="700" fill="#0369a1" stroke="#fff" strokeWidth="4" paintOrder="stroke">clique</text></g>}
        {!etroit && <BarresEnergie q={q} E0={tr.Em0} Emax={Emax} x={W - 204} y={6}/>}
      </svg>
      {etroit && <BarresHtml q={q} E0={tr.Em0} Emax={Emax}/>}

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={tr.tFin} libelle="▶ Lancer"/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Objet lancé" valeur={p.obj} onChange={v => regler({ obj: v })} options={OBJETS.map(x => [x.id, `${x.nom} · ${Math.round(x.m * 1000)} g`])}/>
        <Seg label="Frottement de l’air" valeur={p.frott} onChange={v => regler({ frott: v })} options={[[false, 'négligé (poids seul)'], [true, 'pris en compte (k × v²)']]}/>
        <Seg label="Origine z = 0 des altitudes" valeur={p.off} onChange={v => regler({ off: v })} options={[[0, 'au point de lancement'], [HP, 'au sol (3 m plus bas)']]}/>
      </div>
      <Chips items={[['Altitude z', `${nbf(q.z + p.off, 2)} m`], ['Vitesse', `${nbf(Math.abs(q.v), 1)} m/s ${q.v > 0.05 ? '↑' : q.v < -0.05 ? '↓' : ''}`, COL.v], ['Ec', J(q.Ec), COL.Ec], ['Epp', J(q.Epp), COL.Epp], ['Em', J(q.Em), COL.Em], [p.frott ? 'Em perdue' : 'Altitude du sommet', p.frott ? J(Math.max(q.diss, 0)) : `${nbf(tr.hMax + p.off, 1)} m`, p.frott ? COL.rouge : '#475569']]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        Au lancement : Ec = ½ m v₀² = <strong style={{ color: COL.Ec }}>{J(tr.Ec0)}</strong>. {p.frott
          ? <>Avec frottement, Em diminue : la perte est le travail de la force de frottement, qui s’oppose toujours au mouvement. Le sommet est plus bas que sans frottement (<strong>{nbf(tr.hSans, 1)} m</strong> au-dessus du lancement).</>
          : <>Sans frottement, seul le poids travaille : Em reste constante, Ec se transforme en Epp à la montée et inversement à la descente. Au sommet, au-dessus du lancement : h = v₀² ÷ (2 g) = <strong style={{ color: COL.Em }}>{nbf(tr.hSans, 1)} m</strong>.</>}
      </div>
      <GrapheTemps frames={tr.frames} tFin={Math.max(tr.tFin, 0.01)} t={t} Emax={Emax} etroit={etroit}/>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre={`Réglages précis : v₀ = ${p.v0} m/s`} ouvert={ouv} onBascule={() => setOuv(o2 => !o2)}>
          <Curseur nom="Vitesse de lancement v₀" valeur={p.v0} onChange={v => regler({ v0: Math.round(v) })} min={5} max={20} pas={1} unite="m/s" decimales={0} couleur={COL.v}/>
          <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Mêmes réglages qu’avec la souris, pour le clavier. Changer l’origine des altitudes décale Epp et Em, pas Ec.</div>
        </Section>
      </div>
    </div>);
}

// Balle selon l'objet : boule métallique, balle de tennis ou ballon en mousse.
function Balle({ id, x, y, r }) {
  if (id === 'boule') return <g filter="url(#xa-ombre)"><circle cx={x} cy={y} r={r} fill="url(#xa-acier)" stroke="#334155" strokeWidth="2.5"/><circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#fff" opacity="0.8"/></g>;
  if (id === 'tennis') return <g filter="url(#xa-ombre)"><circle cx={x} cy={y} r={r} fill="#d9f99d" stroke="#4d7c0f" strokeWidth="2.5"/><path d={`M ${x - r * 0.75} ${y - r * 0.55} Q ${x} ${y} ${x - r * 0.75} ${y + r * 0.55} M ${x + r * 0.75} ${y - r * 0.55} Q ${x} ${y} ${x + r * 0.75} ${y + r * 0.55}`} fill="none" stroke="#fff" strokeWidth="2"/></g>;
  return <g filter="url(#xa-ombre)"><circle cx={x} cy={y} r={r} fill="#fb7185" stroke="#9f1239" strokeWidth="2.5"/><path d={`M ${x - r} ${y} Q ${x} ${y - r * 0.5} ${x + r} ${y}`} fill="none" stroke="#fecdd3" strokeWidth="2.5"/><circle cx={x - r * 0.4} cy={y - r * 0.45} r={r * 0.22} fill="#fff" opacity="0.7"/></g>;
}
