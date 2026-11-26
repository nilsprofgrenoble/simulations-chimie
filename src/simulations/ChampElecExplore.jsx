import { useRef, useState } from "react";
import { KIT, styleBoite, Curseur, LigneMesure, Section } from "../commun";
import { NB } from "./Distillation";
import * as M from "./champElecModele";
import { COL, nbf, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarreLecture, Chips, Seg } from "./exploAnim";

// ====================================================
//  Partie animée de l'exploration de la simulation 267 (champ et force électrostatiques entre deux armatures).
//  Trois choses saisissables : l'armature de droite (distance d), le curseur de tension (U) et la particule (n'importe où entre les armatures : E et F ne changent pas).
//  Le champ « coule » de + vers − (vitesse du flux ∝ E) ; la flèche de force est proportionnelle à |q| E ; « Lâcher » montre au ralenti le sens du mouvement (qualitatif).
// ====================================================
const W = 700, XA = 110, PXCM = 80, Y0 = 100, Y1 = 300, T = 4;
const SCALE_F = 20 / 1e-15; // pixels par newton
const UMIN = 50, UMAX = 500, RAIL0 = 110, RAIL1 = 590;

export function ChampElecExplore({ ex, setEx }) {
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite), [ouvert, setOuvert] = useState(false);
  const [pos, setPos] = useState({ fx: 0.5, fy: 0.5 });
  const L = useLecture(T, false);
  const Fm = etroit ? 2 : 1, H = etroit ? 450 : 410;
  const U = ex.U, dcm = ex.d, q = ex.q * M.E_CHARGE, sg = M.sensForce(q);
  const XB = XA + dcm * PXCM, E = M.champ(U, dcm / 100), F = M.force(q, E);
  const span = XB - XA - 40, lf = Math.min(F * SCALE_F, 230), tronque = F * SCALE_F > 230;
  // position de la particule : lâchée => elle glisse dans le sens de la force (mouvement qualitatif, ralenti)
  const a = 33 * (F / 1.6e-15), depl = 0.5 * a * Math.min(L.t, T) ** 2 / Math.max(span, 1);
  const fx = Math.min(1, Math.max(0, pos.fx + sg * depl));
  const px = XA + 20 + fx * span, py = Y0 + 20 + pos.fy * (Y1 - Y0 - 40);
  const dur = Math.max(0.5, Math.min(4, 25000 / E));
  const Uslider = RAIL0 + ((U - UMIN) / (UMAX - UMIN)) * (RAIL1 - RAIL0);

  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type }; if (type !== 'part') L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d) return; const { X, Y } = coordSvg(svgRef.current, ev);
    if (d.type === 'plaque') setEx(s => ({ ...s, d: Math.min(6, Math.max(1, Math.round((X - XA) / PXCM * 10) / 10)) }));
    else if (d.type === 'tension') setEx(s => ({ ...s, U: Math.min(UMAX, Math.max(UMIN, Math.round(((X - RAIL0) / (RAIL1 - RAIL0) * (UMAX - UMIN) + UMIN) / 10) * 10)) }));
    else { L.reset(); L.setTouche(true); setPos({ fx: Math.min(1, Math.max(0, (X - XA - 20) / Math.max(span, 1))), fy: Math.min(1, Math.max(0, (Y - Y0 - 20) / (Y1 - Y0 - 40))) }); }
  };
  const fait = ev => { drag.current = null; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = type => ev => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return; ev.preventDefault(); L.setTouche(true);
    if (type === 'plaque') setEx(o => ({ ...o, d: Math.min(6, Math.max(1, Math.round((o.d + s * 0.1) * 10) / 10)) }));
    else if (type === 'tension') setEx(o => ({ ...o, U: Math.min(UMAX, Math.max(UMIN, o.U + s * 10)) }));
    else { L.reset(); setPos(p => ({ ...p, fx: Math.min(1, Math.max(0, p.fx + s * 0.05)) })); }
  };
  const message = !L.touche && !L.joue && L.t === 0 ? 'Saisis l’armature de droite pour changer la distance d, le curseur du bas pour la tension U, ou la particule pour la déplacer. « Lâcher » montre au ralenti où elle est poussée.'
    : L.fin ? `La particule est ${sg > 0 ? 'poussée dans le sens du champ, vers l’armature −' : 'poussée en sens opposé au champ, vers l’armature +'}.` : '';
  const rows = [Y0 + 30, Y0 + 70, Y0 + 110, Y0 + 150, Y0 + 190].filter(y => y < Y1 - 5);
  const ep = 2 + Math.min(3.5, E / 2e4 * 3.5);
  const signes = (x, s) => [Y0 + 22, Y0 + 62, Y0 + 102, Y0 + 142, Y0 + 182].map(y => <text key={y} x={x} y={y + 6} textAnchor="middle" fontSize={20 * Fm} fontWeight="800" fill={s > 0 ? '#b91c1c' : '#1d4ed8'}>{s > 0 ? '+' : '−'}</text>);
  const aria = `Scène animée : deux armatures planes distantes de ${nbf(dcm, 1)} centimètres, tension ${U} volts. Champ ${nbf(E / 1e3, 1)} kilovolts par mètre, dirigé de l'armature positive vers la négative. Particule de charge ${ex.q > 0 ? '+' : '−'}${Math.abs(ex.q)} e : force ${nbf(F * 1e15, 1)} fois 10 puissance moins 15 newtons, ${sg > 0 ? 'dans le sens du champ' : 'en sens opposé au champ'}.`;
  const poignee = (cx, cy, r, ariaL, vmin, vmax, vnow, vtxt, type, cible = 24) => (
    <g className="xa-poignee" role="slider" tabIndex={0} aria-label={ariaL} aria-valuemin={vmin} aria-valuemax={vmax} aria-valuenow={vnow} aria-valuetext={vtxt} onPointerDown={debut(type)} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier(type)}>
      <circle cx={cx} cy={cy} r={cible} fill="transparent"/><circle className="xa-anneau" cx={cx} cy={cy} r={r} fill="#fff" stroke="#7c3aed" strokeWidth="3.5"/>
      {!L.touche && <circle className="xa-pulse" cx={cx} cy={cy} r={r + 2} fill="none" stroke="#7c3aed" strokeWidth="3"/>}
    </g>);

  return (
    <div ref={boite}>
      <StyleAnim/>
      <style>{`@media (prefers-reduced-motion: no-preference) { .cel-flux { animation: cel-flux var(--dur, 2s) linear infinite; } } @keyframes cel-flux { to { stroke-dashoffset: -22; } }`}</style>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Charge de la particule" valeur={ex.q} onChange={v => { L.reset(); setEx(s => ({ ...s, q: v })); }} options={M.CHARGES.map(v => [v, `${v > 0 ? '+' : '−'}${Math.abs(v)} e`])}/>
      </div>
      <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        <DefsAnim/>
        <rect width={W} height={H} fill="#f8fafc"/>
        <rect x="0" y="66" width={W} height={Y1 + 30 - 66} fill="#eef2ff" opacity="0.7"/>
        {/* générateur et fils */}
        <path d={`M ${XA - 4} ${Y0} V 52 H ${(XA + XB) / 2 - 10}`} fill="none" stroke="#334155" strokeWidth="3"/><path d={`M ${XB + 4} ${Y0} V 52 H ${(XA + XB) / 2 + 10}`} fill="none" stroke="#334155" strokeWidth="3"/>
        <g transform={`translate(${(XA + XB) / 2} 52)`}><line x1="-10" y1="-16" x2="-10" y2="16" stroke="#b91c1c" strokeWidth="5"/><line x1="10" y1="-9" x2="10" y2="9" stroke="#1d4ed8" strokeWidth="5"/></g>
        <text x={(XA + XB) / 2} y={etroit ? 30 : 34} textAnchor="middle" fontSize={17 * Fm} fontWeight="800" fill="#0f172a">U = {U} V</text>
        {/* champ : lignes qui coulent de + vers − */}
        {rows.map(y => <g key={y}><line className="cel-flux" style={{ '--dur': `${dur}s` }} x1={XA + 16} y1={y} x2={XB - 22} y2={y} stroke="#2563eb" strokeWidth={ep} strokeDasharray="12 10" strokeLinecap="round" opacity="0.85"/>
          <polygon points={`${XB - 12},${y} ${XB - 28},${y - 7} ${XB - 28},${y + 7}`} fill="#2563eb"/></g>)}
        <text x={(XA + XB) / 2} y={Y0 - 10} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill="#1d4ed8" stroke="#fff" strokeWidth="4" paintOrder="stroke">E = {nbf(E / 1e3, 1)} kV/m</text>
        {/* armatures */}
        <rect x={XA - 12} y={Y0} width="12" height={Y1 - Y0} rx="3" fill="#fecaca" stroke="#b91c1c" strokeWidth="2.5" filter="url(#xa-ombre)"/>{signes(XA - 30, 1)}
        <rect x={XB} y={Y0} width="12" height={Y1 - Y0} rx="3" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="2.5" filter="url(#xa-ombre)"/>{signes(XB + 30, -1)}
        {/* cote d */}
        <line x1={XA} y1={Y1 + 22} x2={XB} y2={Y1 + 22} stroke="#475569" strokeWidth="2"/><line x1={XA} y1={Y1 + 14} x2={XA} y2={Y1 + 30} stroke="#475569" strokeWidth="2"/><line x1={XB} y1={Y1 + 14} x2={XB} y2={Y1 + 30} stroke="#475569" strokeWidth="2"/>
        <text x={(XA + XB) / 2} y={Y1 + 22 + 18 * Fm * 0.85} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill="#334155" stroke="#fff" strokeWidth="4" paintOrder="stroke">d = {nbf(dcm, 1)} cm</text>
        {/* force */}
        {lf > 1 && <g><line x1={px + (sg > 0 ? 18 : -18)} y1={py} x2={px + sg * (18 + Math.max(lf - 8, 0))} y2={py} stroke="#c2410c" strokeWidth="6" strokeLinecap="round"/>
          <polygon points={`${px + sg * (18 + lf)},${py} ${px + sg * (18 + lf - Math.min(15, lf))},${py - 9} ${px + sg * (18 + lf - Math.min(15, lf))},${py + 9}`} fill="#c2410c"/>
          <text x={px + sg * (18 + lf / 2)} y={py - 14} textAnchor="middle" fontSize={20 * Fm} fontWeight="800" fill="#9a3412" stroke="#fff" strokeWidth="4" paintOrder="stroke">F{tronque ? ' (tronquée)' : ''}</text></g>}
        {/* particule */}
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Particule chargée : position entre les armatures" aria-valuemin={0} aria-valuemax={1} aria-valuenow={Number(fx.toFixed(2))} aria-valuetext={`à ${Math.round(fx * 100)} % du trajet entre l’armature + et l’armature −`} onPointerDown={debut('part')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier('part')} style={{ cursor: 'grab' }}>
          <circle cx={px} cy={py} r="30" fill="transparent"/>
          <circle cx={px} cy={py} r="15" fill={sg > 0 ? '#fee2e2' : '#dbeafe'} stroke={sg > 0 ? '#b91c1c' : '#1d4ed8'} strokeWidth="3.5" filter="url(#xa-ombre)"/>
          <text x={px} y={py + 7} textAnchor="middle" fontSize="20" fontWeight="800" fill={sg > 0 ? '#b91c1c' : '#1d4ed8'}>{sg > 0 ? '+' : '−'}</text>
          {!L.touche && <circle className="xa-pulse" cx={px} cy={py} r="17" fill="none" stroke="#7c3aed" strokeWidth="3"/>}
        </g>
        {/* poignée d : barre de l'armature droite */}
        {poignee(XB + 6, Y0 + (Y1 - Y0) / 2 + 20, 11, 'Distance d entre les armatures', 1, 6, dcm, `${nbf(dcm, 1)} centimètres`, 'plaque')}
        {/* curseur de tension */}
        <line x1={RAIL0} y1={H - 26} x2={RAIL1} y2={H - 26} stroke="#c4b5fd" strokeWidth="8" strokeLinecap="round"/><line x1={RAIL0} y1={H - 26} x2={Uslider} y2={H - 26} stroke="#7c3aed" strokeWidth="8" strokeLinecap="round"/>
        <text x={RAIL0 - 12} y={H - 21} textAnchor="end" fontSize={14 * Fm} fontWeight="700" fill="#475569">{UMIN} V</text><text x={RAIL1 + 12} y={H - 21} textAnchor="start" fontSize={14 * Fm} fontWeight="700" fill="#475569">{UMAX} V</text>
        <text x={(RAIL0 + RAIL1) / 2} y={H - 40} textAnchor="middle" fontSize={14 * Fm} fontWeight="700" fill="#475569">tension U du générateur</text>
        {poignee(Uslider, H - 26, 11, 'Tension U du générateur', UMIN, UMAX, U, `${U} volts`, 'tension')}
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={T} libelle="▶ Lâcher"/>
      <Chips items={[['Tension U', `${U} V`], ['Distance d', `${nbf(dcm, 1)} cm`], ['Champ E', `${nbf(E / 1e3, 1)} kV/m`, COL.Ec], ['Force F', `${nbf(F * 1e15, 1)}×10⁻¹⁵ N`, COL.Epp]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
        <LigneMesure nom="Distance d (en mètres)" valeur={`${nbf(dcm / 100, 3)}${NB}m`}/>
        <LigneMesure nom="Champ E = U ÷ d" valeur={`${nbf(E, 0)}${NB}V/m`} couleur="#0b4f94"/>
        <LigneMesure nom={`Charge q = ${ex.q > 0 ? '+' : '−'}${Math.abs(ex.q)} e`} valeur={`${ex.q > 0 ? '+' : '−'}${nbf(Math.abs(ex.q) * 1.6, 1)}×10⁻¹⁹${NB}C`}/>
        <LigneMesure nom="Force F = |q| × E" valeur={`${nbf(F * 1e15, 2)}×10⁻¹⁵${NB}N`} couleur="#c2410c"/>
        <LigneMesure nom="Sens de la force" valeur={sg > 0 ? 'vers l’armature −' : 'vers l’armature +'}/>
        <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Déplace la particule : E et F ne changent pas (le champ est uniforme). Écarte les armatures : E diminue, donc F aussi. Change le signe de la charge : le sens de la force s’inverse.</div>
      </div>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre="Réglages précis (clavier)" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
          <Curseur nom="Tension U" valeur={U} onChange={v => setEx(s => ({ ...s, U: v }))} min={UMIN} max={UMAX} pas={10} unite="V" decimales={0} couleur="#7c3aed"/>
          <Curseur nom="Distance d entre les armatures" valeur={dcm} onChange={v => setEx(s => ({ ...s, d: v }))} min={1} max={6} pas={0.1} unite="cm" decimales={1} couleur="#7c3aed"/>
        </Section>
      </div>
    </div>);
}
