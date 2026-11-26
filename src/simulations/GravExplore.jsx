import { useRef, useState } from "react";
import { KIT, styleBoite, Curseur, LigneMesure, Section } from "../commun";
import { NB } from "./Distillation";
import * as M from "./gravitationModele";
import { COL, nbf, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarreLecture, Chips, Seg } from "./exploAnim";

// ====================================================
//  Partie animée de l'exploration de la simulation 266 (gravitation et poids).
//  Un objet s'éloigne d'un astre : sa distance au centre se règle en le saisissant (ou en saisissant le point du graphique) ; la flèche de la force d'attraction rétrécit en 1/d².
// ====================================================
const W = 700, SURF = 330, PX = 110, T = 6;
const ASTRES = { terre: ['#2563eb', '#16a34a'], lune: ['#9ca3af', '#6b7280'], mars: ['#c2410c', '#9a3412'], jupiter: ['#d6a46b', '#b45309'] };
const fmtE = v => { const e = Math.floor(Math.log10(Math.abs(v))); return `${nbf(v / 10 ** e, 2)}×10${String(e).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'['0123456789-'.indexOf(c)]).join('')}`; };

export function GravExplore({ ex, setEx }) {
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite), [ouvert, setOuvert] = useState(false);
  const L = useLecture(T, false);
  const c = M.CORPS[ex.c], g0 = M.gAlt(c.M, c.R), rr = 1 + 2 * Math.min(L.t, T) / T, g = g0 / (rr * rr), F = M.force(c.M, ex.m, rr * c.R), h = (rr - 1) * c.R / 1e3;
  const Fm = etroit ? 1.9 : 1, H = etroit ? 700 : 400, cx = etroit ? 350 : 170, panW = etroit ? W : 340;
  const oy = etroit ? 400 : 0, gx0 = etroit ? 80 : 420, gx1 = etroit ? 660 : 680, gy0 = etroit ? oy + 30 : 50, gy1 = etroit ? oy + 225 : 335;
  const gmax = Math.ceil(g0 * 1.2 / 5) * 5 || 5;
  const GX = r => gx0 + ((r - 1) / 2) * (gx1 - gx0), GY = v => gy1 - (v / gmax) * (gy1 - gy0), OY = r => SURF - 16 - (r - 1) * PX;
  const courbe = Array.from({ length: 81 }, (_, i) => { const r = 1 + 2 * i / 80; return `${GX(r)},${GY(g0 / (r * r))}`; }).join(' ');
  const nTr = Math.max(2, Math.round((rr - 1) / 2 * 80) + 1), longF = Math.min(0.25 * F, 215), tronque = 0.25 * F > 215;
  const hd = Math.min(15, longF * 0.7), [cl, cf] = ASTRES[ex.c];
  const poser = rrNew => { L.setJoue(false); L.setT((Math.min(Math.max(rrNew, 1), 3) - 1) / 2 * T); L.setTouche(true); };
  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type, bouge: false }; L.setJoue(false); L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d) return; d.bouge = true; const { X, Y } = coordSvg(svgRef.current, ev);
    poser(d.type === 'obj' ? 1 + (SURF - 16 - Y) / PX : 1 + ((X - gx0) / (gx1 - gx0)) * 2);
  };
  const fait = ev => { const d = drag.current; drag.current = null; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } if (d && d.type === 'obj' && !d.bouge) L.demarrer(); };
  const clavier = ev => { const s = ev.key === 'ArrowUp' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' ? -1 : 0; if (!s) return; ev.preventDefault(); poser(rr + s * 0.1); };
  const message = !L.touche && !L.joue && L.t === 0 ? 'Clique sur l’objet (ou sur « Lancer ») : il s’éloigne de l’astre et la flèche de la force rétrécit. Saisis l’objet pour le placer toi-même.'
    : L.fin ? 'À 3 R, g est 9 fois plus petit qu’à la surface : il diminue, sans jamais devenir nul.' : '';
  const aria = `Scène animée : objet de ${ex.m} kilogrammes à ${nbf(rr, 2)} rayons du centre de ${c.nom}. Intensité de pesanteur ${nbf(g, 2)} newtons par kilogramme, force d'attraction ${nbf(F, 1)} newtons.`;

  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Astre" valeur={ex.c} onChange={k => setEx(s => ({ ...s, c: k }))} options={M.ORDRE.map(k => [k, M.CORPS[k].nomS])}/>
        <Seg label="Masse de l’objet" valeur={ex.m} onChange={v => setEx(s => ({ ...s, m: v }))} options={[10, 50, 70, 200].map(v => [v, `${v} kg`])}/>
      </div>
      <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        <DefsAnim/>
        <defs><clipPath id="gv-clip"><rect x="0" y="0" width={panW} height="400"/></clipPath><linearGradient id="gv-espace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f172a"/><stop offset="1" stopColor="#1e3a8a"/></linearGradient></defs>
        <rect width={W} height={H} fill="#f8fafc"/>
        <g clipPath="url(#gv-clip)">
          <rect width={panW} height="400" fill="url(#gv-espace)"/>
          {[[30, 40], [90, 120], [250, 60], [300, 150], [60, 220], [200, 30], [310, 250], [140, 190]].map(([x, y], i) => <circle key={i} cx={etroit ? x * 2 : x} cy={y} r="1.6" fill="#fff" opacity="0.7"/>)}
          <circle cx={cx} cy={SURF + 330} r="330" fill={cl}/>
          {ex.c === 'terre' && <g fill={cf}><ellipse cx={cx - 70} cy={SURF + 14} rx="48" ry="9"/><ellipse cx={cx + 80} cy={SURF + 40} rx="38" ry="8"/></g>}
          {ex.c === 'lune' && <g fill={cf} opacity="0.7"><circle cx={cx - 60} cy={SURF + 24} r="12"/><circle cx={cx + 50} cy={SURF + 18} r="8"/><circle cx={cx + 90} cy={SURF + 54} r="14"/></g>}
          {ex.c === 'mars' && <g fill={cf} opacity="0.7"><ellipse cx={cx - 40} cy={SURF + 22} rx="50" ry="8"/><circle cx={cx + 90} cy={SURF + 40} r="10"/></g>}
          {ex.c === 'jupiter' && <g stroke={cf} strokeWidth="9" opacity="0.6" fill="none"><path d={`M ${cx - 160} ${SURF + 30} Q ${cx} ${SURF + 12} ${cx + 160} ${SURF + 30}`}/><path d={`M ${cx - 170} ${SURF + 70} Q ${cx} ${SURF + 52} ${cx + 170} ${SURF + 70}`}/></g>}
          {[1, 2, 3].map(r => <g key={r}><line x1="40" y1={OY(r)} x2={panW - 10} y2={OY(r)} stroke="#fff" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.4"/><text x="10" y={OY(r) - 4} fontSize={13 * Fm} fontWeight="700" fill="#e2e8f0">{r} R</text></g>)}
          <g><line x1={cx} y1={OY(rr) + 12} x2={cx} y2={OY(rr) + 12 + Math.max(longF - hd, 0)} stroke="#fb923c" strokeWidth="6" strokeLinecap="round"/>
            <polygon points={`${cx},${OY(rr) + 12 + longF} ${cx - hd * 0.6},${OY(rr) + 12 + longF - hd} ${cx + hd * 0.6},${OY(rr) + 12 + longF - hd}`} fill="#fb923c"/></g>
        </g>
        <text x={cx + 18} y={OY(rr) + 12 + Math.max(longF * 0.5, 14) + 4} fontSize={14 * Fm} fontWeight="800" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" paintOrder="stroke" clipPath="url(#gv-clip)">F = {nbf(F, F < 100 ? 1 : 0)}{NB}N{tronque ? ' (flèche tronquée)' : ''}</text>
        {/* objet */}
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Distance de l’objet au centre de l’astre" aria-valuemin={1} aria-valuemax={3} aria-valuenow={Number(nbf(rr, 2).replace(',', '.'))} aria-valuetext={`${nbf(rr, 1)} rayons`} onPointerDown={debut('obj')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <circle cx={cx} cy={OY(rr)} r="30" fill="transparent"/>
          <g transform={`translate(${cx} ${OY(rr)})`} filter="url(#xa-ombre)"><rect x="-13" y="-14" width="26" height="26" rx="5" fill="#fde68a" stroke="#b45309" strokeWidth="3"/><rect x="-7" y="-8" width="14" height="8" rx="2" fill="#bae6fd"/></g>
          {!L.touche && <circle className="xa-pulse" cx={cx} cy={OY(rr)} r="20" fill="none" stroke="#fde68a" strokeWidth="3"/>}
          <text x={cx + 22} y={OY(rr) - 14} fontSize={14 * Fm} fontWeight="800" fill="#fef3c7" stroke="#0f172a" strokeWidth="3" paintOrder="stroke">{ex.m} kg</text>
        </g>
        <text x={panW - 10} y="26" textAnchor="end" fontSize={16 * Fm} fontWeight="800" fill="#fff">{c.nomS} · d = {nbf(rr, 2)} R</text>
        {/* graphe g(d) */}
        <g>
          <rect x={etroit ? 0 : 345} y={etroit ? oy : 0} width={etroit ? W : 355} height={etroit ? 300 : 400} fill="#fff"/>
          {Array.from({ length: 6 }, (_, i) => gmax * i / 5).map(v => <g key={v}><line x1={gx0} y1={GY(v)} x2={gx1} y2={GY(v)} stroke="#e2e8f0"/><text x={gx0 - 8} y={GY(v) + 4} textAnchor="end" fontSize={12 * Fm} fill="#475569">{nbf(v, v % 1 ? 1 : 0)}</text></g>)}
          {[1, 1.5, 2, 2.5, 3].map(r => <g key={r}><line x1={GX(r)} y1={gy0} x2={GX(r)} y2={gy1} stroke="#e2e8f0"/><text x={GX(r)} y={gy1 + (etroit ? 28 : 16)} textAnchor="middle" fontSize={12 * Fm} fill="#475569">{nbf(r, r % 1 ? 1 : 0)}</text></g>)}
          <line x1={gx0} y1={gy1} x2={gx1} y2={gy1} stroke="#334155" strokeWidth="2"/><line x1={gx0} y1={gy0} x2={gx0} y2={gy1} stroke="#334155" strokeWidth="2"/>
          <text x={gx1} y={gy1 + (etroit ? 60 : 34)} textAnchor="end" fontSize={13 * Fm} fontWeight="700" fill="#334155">distance au centre d (en R)</text>
          <text x={gx0 + 6} y={gy0 - 8} fontSize={13 * Fm} fontWeight="700" fill="#334155">g (N/kg)</text>
          <polyline points={courbe} fill="none" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="3 5"/>
          <polyline points={Array.from({ length: nTr }, (_, i) => { const r = 1 + (rr - 1) * i / (nTr - 1); return `${GX(r)},${GY(g0 / (r * r))}`; }).join(' ')} fill="none" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round"/>
          <line x1={GX(rr)} y1={GY(g)} x2={GX(rr)} y2={gy1} stroke="#0b4f94" strokeWidth="1.5" strokeDasharray="4 4"/><line x1={gx0} y1={GY(g)} x2={GX(rr)} y2={GY(g)} stroke="#0b4f94" strokeWidth="1.5" strokeDasharray="4 4"/>
          <g className="xa-poignee" onPointerDown={debut('gr')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}>
            <circle cx={GX(rr)} cy={GY(g)} r="22" fill="transparent"/><circle className="xa-anneau" cx={GX(rr)} cy={GY(g)} r="10" fill="#c2410c" stroke="#fff" strokeWidth="3"/>
          </g>
        </g>
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={T} libelle="▶ Lancer"/>
      <Chips items={[['Distance au centre', `${nbf(rr, 2)} R`], ['Altitude h', `${nbf(h, 0)} km`], ['g', `${nbf(g, 2)} N/kg`, COL.Epp], [`Poids (${ex.m} kg)`, `${nbf(M.poids(ex.m, g), 1)} N`, COL.Ec]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
        <LigneMesure nom="Altitude h" valeur={`${nbf(h, 0)}${NB}km`}/>
        <LigneMesure nom="Intensité de pesanteur g" valeur={`${nbf(g, 2)}${NB}N/kg`} couleur="#c2410c"/>
        <LigneMesure nom="g au sol, sur cet astre" valeur={`${nbf(g0, 2)}${NB}N/kg`}/>
        <LigneMesure nom={`Poids d’un objet de ${ex.m} kg`} valeur={`${nbf(M.poids(ex.m, g), 1)}${NB}N`} couleur="#0b4f94"/>
        <LigneMesure nom="Force gravitationnelle de l’astre" valeur={`${nbf(F, 1)}${NB}N`}/>
        <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>La force gravitationnelle de l’astre sur l’objet est égale à son poids : F = G M m ÷ (R + h)² = m g. Masse de {c.nom} : {fmtE(c.M)} kg ; rayon : {fmtE(c.R)} m.</div>
      </div>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre="Réglage précis (clavier)" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
          <Curseur nom="Distance au centre de l’astre (en rayons R)" valeur={rr} onChange={poser} min={1} max={3} pas={0.05} unite="R" decimales={2} couleur="#0e7490"/>
        </Section>
      </div>
    </div>);
}
