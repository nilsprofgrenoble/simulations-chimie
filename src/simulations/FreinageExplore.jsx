import { useState, useMemo, useRef, useCallback } from "react";
import { KIT, styleBoite, Section, Curseur } from "../commun";
import { trajet } from "./freinageTrajet";
import { COL, nbf, J, imageA, Seg, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarresEnergie, BarresHtml, GrapheTemps, BarreLecture, Chips } from "./exploAnim";

// ====================================================
//  Exploration animée de la simulation 260 (distance de freinage).
//  On clique sur la voiture pour freiner ; la flèche verte règle la vitesse, le mur règle la distance disponible.
//  Mouvement : freinageTrajet.js (force de freinage constante, pente éventuelle, arrêt ou choc contre le mur).
// ====================================================
const W = 700, H = 400, X0 = 70, Y0 = 290, PX = 350, PXKMH = 0.9;
const COUL = '#2563eb';
const echelleCarrosserie = m => (m <= 500 ? 0.82 : m <= 1000 ? 1 : m <= 2000 ? 1.15 : 1.1);

export function FreinageExplore() {
  const [p, setP] = useState({ m: 1000, vkmh: 72, F: 8000, p: 0, D: 60 });
  const [ouv, setOuv] = useState(false), [fige, setFige] = useState(null);
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite);
  const tr = useMemo(() => trajet({ m: p.m, vkmh: p.vkmh, F: p.F, p: p.p, D: p.D }), [p]);
  const L = useLecture(tr.tFin);
  const { t } = L;
  const q = imageA(tr.frames, t);
  const regler = useCallback(ch => { L.reset(); setP(s => ({ ...s, ...ch })); }, [L]);

  const ang = Math.asin(p.p), cosA = Math.cos(ang), sinA = Math.sin(ang);
  const Lv = Math.max(p.D, isFinite(tr.dArret) ? Math.min(tr.dArret, 400) : 0, 20) * 1.1;
  const Sauto = Math.min(Math.max((W - X0 - 60) / (Lv * cosA), 2), 15), S = fige || Sauto;
  const loc = x => X0 + x * S;                                    // abscisse locale (le long de la route) d'une position x en mètres
  const k = echelleCarrosserie(p.m), camion = p.m >= 5000;
  const bw = 34 * k;                                              // demi-longueur de la carrosserie

  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type, bouge: false }; if (type === 'mur') setFige(Sauto); L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d || d.type === 'voiture') return;
    const { X, Y } = coordSvg(svgRef.current, ev); d.bouge = true;
    const xr = PX + (X - PX) * cosA - (Y - Y0) * sinA - X0;
    if (d.type === 'vit') { const v = Math.min(Math.max(Math.round((xr - (bw + 6)) / PXKMH / 10) * 10, 20), 130); if (v !== p.vkmh) regler({ vkmh: v }); }
    if (d.type === 'mur') { const D = Math.min(Math.max(Math.round(xr / S / 5) * 5, 10), 250); if (D !== p.D) regler({ D }); }
  };
  const fait = ev => {
    const d = drag.current; drag.current = null;
    try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ }
    if (d && d.type === 'mur') setFige(null);
    if (d && d.type === 'voiture' && !d.bouge) L.demarrer();
  };
  const clavier = (type, ev) => {
    const sens = ev.key === 'ArrowUp' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' ? -1 : 0; if (!sens) return;
    ev.preventDefault();
    if (type === 'vit') regler({ vkmh: Math.min(Math.max(p.vkmh + 10 * sens, 20), 130) });
    else regler({ D: Math.min(Math.max(p.D + 5 * sens, 10), 250) });
  };

  const Fm = etroit ? 1.3 : 1;
  const enMarche = t > 0 && !L.fin;
  const xc = loc(q.x);
  const pas = [5, 10, 20, 50, 100].find(s => s * S >= 56) || 100;
  const graduations = Array.from({ length: Math.floor((Lv * 1.0) / pas) + 1 }, (_, i) => i * pas).filter(x => loc(x) < W - 20 + 400);
  const Emax = Math.max(tr.Em0, 1) * 1.05;
  const lg = Math.max(q.x, 0);
  const flecheV = Math.min(q.v * 3.6 * PXKMH, 130 * PXKMH);
  const flecheF = 10 + p.F / 16000 * 54;
  const road = `${p.p === 0 ? 'Route horizontale' : p.p > 0 ? `Montée de ${nbf(p.p * 100, 0)} %` : `Descente de ${nbf(-p.p * 100, 0)} %`}`;
  const reste = p.D - tr.dArret;
  const message = !L.touche && !L.joue && t === 0 ? 'Clique sur la voiture (ou sur « Freiner ») : elle freine. Tire la flèche verte pour changer la vitesse, déplace le mur pour changer la distance disponible.'
    : !L.fin ? ''
    : tr.choc ? `Choc contre le mur à ${nbf(tr.vChoc * 3.6, 0)} km/h : la voiture n’a pas la place de s’arrêter${isFinite(tr.dArret) ? ` (il lui aurait fallu ${nbf(tr.dArret, 0)} m)` : ' : dans cette descente, le poids est plus grand que la force de freinage'}.`
    : `La voiture s’arrête après d = ${nbf(tr.dArret, 1)} m, ${nbf(reste, 0)} m avant le mur.`;

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? `0 60 ${W} ${H - 60}` : `0 0 ${W} ${H}`} role="img" aria-label="Scène animée : une voiture freine sur une route jusqu’à l’arrêt ou jusqu’au choc contre un mur ; les barres d’énergie suivent son mouvement.">
        <DefsAnim/>
        <rect width={W} height={H} fill="url(#xa-ciel)"/>
        <path d={`M0,${Y0 - 70} C120,${Y0 - 130} 260,${Y0 - 50} 400,${Y0 - 100} C520,${Y0 - 140} 610,${Y0 - 70} ${W},${Y0 - 110} L${W},${Y0} L0,${Y0} Z`} fill="#dbeafe" opacity="0.65"/>
        <g transform={`rotate(${-ang * 180 / Math.PI} ${PX} ${Y0})`}>
          <rect x={X0 - 500} y={Y0} width="2200" height="520" fill="url(#xa-sol)"/>
          <rect x={X0 - 500} y={Y0 - 4} width="2200" height="10" fill="#57534e"/>
          <line x1={X0 - 500} y1={Y0 + 1} x2={X0 + 1700} y2={Y0 + 1} stroke="#e7e5e4" strokeWidth="2" strokeDasharray="22 18" opacity="0.8"/>
          {/* graduations de la route */}
          {graduations.map(x => <g key={x}><line x1={loc(x)} y1={Y0 + 6} x2={loc(x)} y2={Y0 + 18} stroke="#292524" strokeWidth="2"/><text x={loc(x)} y={Y0 + 36} textAnchor="middle" fontSize={14 * Fm} fontWeight="700" fill="#292524">{x} m</text></g>)}
          {/* départ */}
          <line x1={loc(0)} y1={Y0 - 4} x2={loc(0)} y2={Y0 + 18} stroke="#0f172a" strokeWidth="3"/>
          {/* traces de pneus */}
          {t > 0 && lg > 0.05 && <g opacity="0.65"><line x1={loc(0)} y1={Y0 - 1} x2={loc(lg)} y2={Y0 - 1} stroke="#1c1917" strokeWidth="4" strokeLinecap="round"/></g>}
          {/* cote de la distance parcourue */}
          {t > 0 && lg > 1 && <g><line x1={loc(0)} y1={Y0 + 56} x2={loc(lg)} y2={Y0 + 56} stroke={COL.Em} strokeWidth="3"/><line x1={loc(lg)} y1={Y0 + 49} x2={loc(lg)} y2={Y0 + 63} stroke={COL.Em} strokeWidth="3"/><line x1={loc(0)} y1={Y0 + 49} x2={loc(0)} y2={Y0 + 63} stroke={COL.Em} strokeWidth="3"/>
            <text x={(loc(0) + loc(lg)) / 2} y={Y0 + 80} textAnchor="middle" fontSize={16 * Fm} fontWeight="800" fill={COL.Em}>{L.fin && !tr.choc ? 'd = ' : ''}{nbf(q.x, 1)} m</text></g>}
          {/* mur */}
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Mur : distance disponible" aria-valuemin={10} aria-valuemax={250} aria-valuenow={p.D} aria-valuetext={`${p.D} mètres`}
            onPointerDown={debut('mur')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={ev => clavier('mur', ev)}>
            <rect x={loc(p.D) - 30} y={Y0 - 90} width="60" height="96" fill="transparent"/>
            <g filter="url(#xa-ombre)"><rect x={loc(p.D)} y={Y0 - 52} width="16" height="52" fill="#b45309" stroke="#7c2d12" strokeWidth="2"/>
              {[0, 1, 2, 3].map(i => <rect key={i} x={loc(p.D)} y={Y0 - 52 + i * 13} width="16" height="6.5" fill="#fde68a" opacity="0.9"/>)}</g>
            {!L.touche && <circle className="xa-pulse" cx={loc(p.D) + 8} cy={Y0 - 66} r="12" fill="none" stroke="#b45309" strokeWidth="3"/>}
            <circle className="xa-anneau" cx={loc(p.D) + 8} cy={Y0 - 66} r="11" fill="#fff7ed" stroke="#b45309" strokeWidth="3.5" filter="url(#xa-ombre)"/>
            <path d={`M ${loc(p.D) + 2} ${Y0 - 66} h 12 M ${loc(p.D) + 5} ${Y0 - 70} l -4 4 l 4 4 M ${loc(p.D) + 11} ${Y0 - 70} l 4 4 l -4 4`} fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          <text x={loc(p.D) + 8} y={Y0 - 86} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill="#b45309" stroke="#fff" strokeWidth="4" paintOrder="stroke">mur à {p.D} m</text>
          {/* voiture au départ : fantôme et poignée de vitesse */}
          <g transform={`translate(${loc(0)} ${Y0})`}>
            <g className="xa-poignee" role="button" tabIndex={0} aria-label="Voiture : cliquer pour freiner" style={{ cursor: 'pointer' }} onPointerDown={debut('voiture')} onPointerUp={fait} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); L.demarrer(); } }}>
              <rect x={-bw - 6} y="-58" width={2 * bw + 12} height="62" fill="transparent"/>
              {t === 0 && <Voiture k={k} camion={camion} m={p.m} frein={false} ombre/>}
              {t > 0 && <g opacity="0.35"><rect x={-bw} y="-30" width={2 * bw} height="24" rx="6" fill="#bfdbfe" stroke={COUL} strokeDasharray="5 4" strokeWidth="2"/></g>}
            </g>
            <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Flèche de vitesse : vitesse au début du freinage" aria-valuemin={20} aria-valuemax={130} aria-valuenow={p.vkmh} aria-valuetext={`${p.vkmh} kilomètres par heure`}
              onPointerDown={debut('vit')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={ev => clavier('vit', ev)}>
              <line x1={bw + 6} y1="-66" x2={bw + 6 + p.vkmh * PXKMH} y2="-66" stroke={COL.v} strokeWidth="5" strokeLinecap="round"/>
              <circle cx={bw + 6 + p.vkmh * PXKMH} cy="-66" r="24" fill="transparent"/>
              {!L.touche && <circle className="xa-pulse" cx={bw + 6 + p.vkmh * PXKMH} cy="-66" r="13" fill="none" stroke={COL.v} strokeWidth="3"/>}
              <circle className="xa-anneau" cx={bw + 6 + p.vkmh * PXKMH} cy="-66" r="11" fill="#f0fdf4" stroke={COL.v} strokeWidth="3.5" filter="url(#xa-ombre)"/>
              <path d={`M ${bw + 6 + p.vkmh * PXKMH - 5} -66 h 10 M ${bw + 6 + p.vkmh * PXKMH - 2} -70 l 4 4 l -4 4`} fill="none" stroke={COL.v} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <text x={bw + 6 + p.vkmh * PXKMH / 2} y="-80" textAnchor="middle" fontSize={16 * Fm} fontWeight="800" fill={COL.v} stroke="#fff" strokeWidth="4" paintOrder="stroke">v = {p.vkmh} km/h</text>
          </g>
          {/* voiture en mouvement */}
          {t > 0 && <g transform={`translate(${xc} ${Y0})`} pointerEvents="none">
            <Voiture k={k} camion={camion} m={p.m} frein={enMarche} ombre/>
            {q.v > 0.3 && <g><line x1={bw + 4} y1="-52" x2={bw + 4 + flecheV} y2="-52" stroke={COL.v} strokeWidth="4.5" strokeLinecap="round" markerEnd="url(#xa-pointe)"/></g>}
            {q.v > 0.3 && <g><line x1={-bw - 2} y1="-20" x2={-bw - 2 - flecheF} y2="-20" stroke={COL.Epp} strokeWidth="4.5" strokeLinecap="round"/><polygon points={`${-bw - 2 - flecheF - 9},-20 ${-bw - 2 - flecheF + 2},-26 ${-bw - 2 - flecheF + 2},-14`} fill={COL.Epp}/>
              <text x={-bw - 2 - flecheF / 2} y="-28" textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill={COL.Epp} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">F</text></g>}
          </g>}
        </g>
        <text x="16" y={etroit ? 88 : 34} fontSize={16 * Fm} fontWeight="800" fill={COL.gris} stroke="#fff" strokeWidth="4" paintOrder="stroke">{road}</text>
        {!L.touche && !L.joue && t === 0 && <g className="xa-tire" pointerEvents="none"><text x={X0 + bw + 8} y={Y0 - 100} fontSize={16 * Fm} fontWeight="700" fill="#0369a1" stroke="#fff" strokeWidth="4" paintOrder="stroke">clique</text></g>}
        {!etroit && <BarresEnergie q={q} E0={tr.Em0} Emax={Emax} x={W - 204} y={6}/>}
      </svg>
      {etroit && <BarresHtml q={q} E0={tr.Em0} Emax={Emax}/>}

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? (tr.choc ? '#b91c1c' : '#15803d') : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={tr.tFin} libelle="▶ Freiner"/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Masse du véhicule" valeur={p.m} onChange={v => regler({ m: v })} options={[[500, '500 kg'], [1000, '1 000 kg'], [2000, '2 000 kg'], [5000, '5 000 kg']]}/>
        <Seg label="Force de freinage" valeur={p.F} onChange={v => regler({ F: v })} options={[[2000, '2 000 N · verglas'], [4000, '4 000 N · mouillée'], [8000, '8 000 N · sèche'], [16000, '16 000 N · très efficace']]}/>
        <Seg label="Pente de la route" valeur={p.p} onChange={v => regler({ p: v })} options={[[-0.1, 'descente 10 %'], [-0.05, 'descente 5 %'], [0, 'plat'], [0.05, 'montée 5 %'], [0.1, 'montée 10 %']]}/>
      </div>
      <Chips items={[['Vitesse v', `${nbf(q.v * 3.6, 0)} km/h`, COL.v], ['Distance parcourue', `${nbf(q.x, 1)} m`], ['Ec', J(q.Ec), COL.Ec], ['Travail de F', J(q.WF), COL.Epp], ['Travail du poids', J(q.WP), '#15803d'], ['Distance d’arrêt', isFinite(tr.dArret) ? `${nbf(tr.dArret, 1)} m` : 'aucune', COL.Em]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        Au départ : Ec = ½ m v² = <strong style={{ color: COL.Ec }}>{J(tr.Ec0)}</strong>. Théorème de l’énergie cinétique : 0 − Ec = W(F) + W(P), soit <strong>d = ½ m v² ÷ (F + m g sin α)</strong>{isFinite(tr.dArret) ? <> = <strong style={{ color: COL.Em }}>{nbf(tr.dArret, 1)} m</strong></> : <> : ici F + m g sin α ≤ 0, la voiture ne s’arrête pas</>}. Double la vitesse : la distance est multipliée par 4.
      </div>
      <GrapheTemps frames={tr.frames} tFin={Math.max(tr.tFin, 0.01)} t={t} Emax={Emax} etroit={etroit}/>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre={`Réglages précis : v = ${p.vkmh} km/h · mur à ${p.D} m`} ouvert={ouv} onBascule={() => setOuv(o => !o)}>
          <Curseur nom="Vitesse au début du freinage" valeur={p.vkmh} onChange={v => regler({ vkmh: Math.round(v) })} min={20} max={130} pas={1} unite="km/h" decimales={0} couleur={COL.v}/>
          <Curseur nom="Distance jusqu’au mur" valeur={p.D} onChange={v => regler({ D: Math.round(v) })} min={10} max={250} pas={5} unite="m" decimales={0} couleur="#b45309"/>
          <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Mêmes réglages qu’avec la souris, pour le clavier. v en m/s = v en km/h ÷ 3,6.</div>
        </Section>
      </div>
    </div>);
}

// Voiture (ou camion pour 5 000 kg) vue de côté, origine = point de contact avec la route, orientée vers la droite.
function Voiture({ k, camion, m, frein, ombre }) {
  const f = ombre ? 'url(#xa-ombre)' : undefined;
  return (
    <g filter={f}>
      {camion
        ? <g>
            <rect x={-38 * k} y={-52} width={50 * k} height={40} rx="3" fill="#f59e0b" stroke="#92400e" strokeWidth="2.5"/>
            <path d={`M ${12 * k} -12 L ${12 * k} -40 L ${26 * k} -40 L ${36 * k} -26 L ${36 * k} -12 Z`} fill={COUL} stroke="#1e3a8a" strokeWidth="2.5" strokeLinejoin="round"/>
            <path d={`M ${16 * k} -36 L ${25 * k} -36 L ${32 * k} -27 L ${16 * k} -27 Z`} fill="#bae6fd"/>
          </g>
        : <g>
            <path d={`M ${-34 * k} -12 L ${-34 * k} -24 Q ${-34 * k} -28 ${-30 * k} -28 L ${-18 * k} -28 L ${-10 * k} -42 L ${14 * k} -42 L ${24 * k} -28 L ${30 * k} -28 Q ${34 * k} -28 ${34 * k} -24 L ${34 * k} -12 Z`} fill={COUL} stroke="#1e3a8a" strokeWidth="2.5" strokeLinejoin="round"/>
            <path d={`M ${-14 * k} -28 L ${-8 * k} -38 L ${0} -38 L ${0} -28 Z M ${4 * k} -28 L ${4 * k} -38 L ${13 * k} -38 L ${20 * k} -28 Z`} fill="#bae6fd" stroke="#1e3a8a" strokeWidth="1.5"/>
          </g>}
      <rect x={-(camion ? 38 : 34) * k - 2} y={-22} width="5" height="8" rx="1.5" fill={frein ? '#ef4444' : '#7f1d1d'}/>
      {frein && <circle cx={-(camion ? 38 : 34) * k - 4} cy={-18} r="9" fill="#ef4444" opacity="0.28"/>}
      <rect x={(camion ? 34 : 31) * k} y={-22} width="5" height="7" rx="1.5" fill="#fde68a"/>
      {[camion ? -22 : -19, camion ? 22 : 19].map(x => <g key={x}><circle cx={x * k} cy={-8} r={8 * Math.max(k, 0.95)} fill="#1f2937" stroke="#0f172a" strokeWidth="2"/><circle cx={x * k} cy={-8} r={3.4} fill="#cbd5e1"/></g>)}
      <text x={camion ? -13 * k : -2 * k} y={camion ? -28 : -17} textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#fff" stroke="#1e3a8a" strokeWidth="0.6" pointerEvents="none">{m >= 1000 ? `${String(m / 1000).replace('.', ',')} t` : `${m} kg`}</text>
    </g>);
}
