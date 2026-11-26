import { useMemo, useRef } from "react";
import { KIT, styleBoite, stylePetitBouton } from "../commun";
import * as M from "./vecteursVAModele";
import { COL, nbf, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarreLecture, Chips, Seg } from "./exploAnim";

// ====================================================
//  Partie animée de l'exploration de la simulation 264 (vitesse et accélération).
//  Le mobile se déplace en temps réel : on voit son vecteur vitesse et son vecteur accélération évoluer, les photos
//  (chronophotographie) se marquent au passage de chaque date t = i × τ ; on saisit un point (ou on clique dessus) pour l'étudier.
//  Les mesures, le tableau et les graphes de la page restent ceux de l'exploration d'origine et suivent le point étudié.
// ====================================================
const W = 700, H = 400, TH = 22 * Math.PI / 180;
const norm = (f, T, k = 120) => { let m = 1e-9; for (let i = 0; i <= k; i++) m = Math.max(m, f(T * i / k)); return m; };

export function VAExplore({ ex, setEx, setMv, mv, tau }) {
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite);
  const N = mv.N, T = N * tau, sel = Math.min(Math.max(ex.sel, 2), N - 2);
  const L = useLecture(T, false);
  const { t } = L;
  const P = useMemo(() => M.chrono(mv, tau), [mv, tau]);
  const G = useMemo(() => {
    const ts = Array.from({ length: 121 }, (_, i) => T * i / 120), xs = ts.map(mv.x), ys = ts.map(mv.y);
    const xmin = Math.min(...xs), xmax = Math.max(...xs), ymax = Math.max(0, ...ys), ymin = Math.min(0, ...ys), ex_ = Math.max(xmax - xmin, 1e-6);
    let proj, dir, S;
    if (mv.layout === 'plan') { S = Math.min(540 / ex_, 190 / Math.max(ymax - ymin, 1e-6), 120); proj = (x, y) => [70 + (x - xmin) * S, 320 - (y - ymin) * S]; dir = (a, b) => [a, -b]; }
    else if (mv.id === 'retour') { S = Math.min(520 / (ex_ * Math.cos(TH)), 200 / (ex_ * Math.sin(TH))); proj = x => [60 + (x - xmin) * S * Math.cos(TH), 320 - (x - xmin) * S * Math.sin(TH)]; dir = a => [a * Math.cos(TH), -a * Math.sin(TH)]; }
    else if (mv.id === 'sinus') { S = 62; proj = x => [350 + x * S, 296]; dir = a => [a, 0]; }
    else { S = Math.min(560 / ex_, 80); proj = x => [70 + (x - xmin) * S, 296]; dir = a => [a, 0]; }
    return { proj, dir, S, vmax: norm(tt => Math.hypot(mv.vx(tt), mv.vy(tt)), T), amax: norm(tt => Math.hypot(mv.ax(tt), mv.ay(tt)), T), xmin, xmax, ymax };
  }, [mv, T]);
  const [sx, sy] = G.proj(mv.x(t), mv.y(t)), vx = mv.vx(t), vy = mv.vy(t), ax = mv.ax(t), ay = mv.ay(t);
  const vn = Math.hypot(vx, vy), an = Math.hypot(ax, ay), plan = mv.layout === 'plan';
  const kv = 74 / G.vmax, ka = 60 / G.amax;
  const dots = P.map(p => G.proj(p.x, p.y));
  const Fm = etroit ? 1.3 : 1, vy0 = (plan || mv.id === 'retour') ? (etroit ? 90 : 0) : 200;

  const regler = ch => { L.reset(); setEx(s => ({ ...s, ...ch })); };
  const plusProche = (X, Y) => { let b = -1, d = 1e9; dots.forEach(([x, y], i) => { if (i < 2 || i > N - 2) return; const dd = Math.hypot(x - X, (y - Y) * (plan ? 1 : 0.3)) + (i === sel ? 0 : 0.01); if (dd < d - 1e-6) { d = dd; b = i; } }); return b; };
  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type, bouge: false }; L.setTouche(true); };
  const bouge = ev => { const d = drag.current; if (!d || d.type !== 'point') return; const { X, Y } = coordSvg(svgRef.current, ev); d.bouge = true; const i = plusProche(X, Y); if (i > 0 && i !== sel) setEx(s => ({ ...s, sel: i })); };
  const fait = ev => { const d = drag.current; drag.current = null; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } if (d && d.type === 'mobile' && !d.bouge) L.demarrer(); };
  const clavier = ev => { const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return; ev.preventDefault(); setEx(o => ({ ...o, sel: Math.min(Math.max(sel + s, 2), N - 2) })); };

  // un vecteur dessiné en pixels depuis (x, y)
  const fl = (x, y, dx, dy, c, nom, etiquette) => {
    const l = Math.hypot(dx, dy); if (l < 3) return <circle cx={x} cy={y} r="5" fill="none" stroke={c} strokeWidth="3"/>;
    const u = [dx / l, dy / l], ex2 = x + dx, ey = y + dy;
    return (<g>
      <line x1={x} y1={y} x2={ex2 - u[0] * 8} y2={ey - u[1] * 8} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
      <polygon points={`${ex2},${ey} ${ex2 - u[0] * 13 - u[1] * 6},${ey - u[1] * 13 + u[0] * 6} ${ex2 - u[0] * 13 + u[1] * 6},${ey - u[1] * 13 - u[0] * 6}`} fill={c}/>
      {etiquette && <text x={ex2 + u[0] * 8 + (u[0] >= 0 ? 4 : -4)} y={ey + u[1] * 8 - 6} textAnchor={u[0] >= 0 ? 'start' : 'end'} fontSize={15 * Fm} fontWeight="800" fill={c} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">{nom}</text>}
    </g>);
  };
  const dv = G.dir(vx * kv, vy * kv), da = G.dir(ax * ka, ay * ka);
  const oy = plan ? 0 : 1, offV = plan ? 0 : -40, offA = plan ? 0 : -62;
  const deg = mv.id === 'retour' ? -TH * 180 / Math.PI : 0;
  const message = !L.touche && !L.joue && t === 0 ? 'Clique sur le mobile (ou sur « Lancer ») : il se déplace, les photos se marquent toutes les τ. Saisis un point pour l’étudier.'
    : L.fin ? `Fin du mouvement à t = ${nbf(T, 1)} s. Le point étudié est le n° ${sel} (t = ${nbf(sel * tau, 1)} s) : ses valeurs sont dans les mesures en dessous.` : '';
  void oy;
  const vect = (cle, nom, c, lib) => <button key={cle} type="button" onClick={() => setEx(s => ({ ...s, [cle]: !s[cle] }))} aria-pressed={ex[cle]} style={stylePetitBouton(ex[cle], c)} title={lib}>{ex[cle] ? '✓ ' : ''}{nom}</button>;

  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Mouvement" valeur={mv.id} onChange={id => { L.reset(); setMv(id); }} options={M.ORDRE_MOUVEMENTS.map(id => [id, M.MOUVEMENTS[id].nom.replace(/ \(.*\)/, '')])}/>
        <Seg label="Pas τ entre deux photos" valeur={tau} onChange={v => regler({ tau: v })} options={mv.taus.map(v => [v, `${nbf(v, 1)} s`])}/>
      </div>
      <svg ref={svgRef} className="xa-svg" viewBox={`0 ${vy0} ${W} ${H - vy0}`} role="img" aria-label={`Scène animée : ${mv.nom}. Le mobile se déplace avec ses vecteurs vitesse et accélération ; les photos sont marquées toutes les ${nbf(tau, 1)} secondes.`}>
        <DefsAnim/>
        <rect width={W} height={H} fill="url(#xa-ciel)"/>
        <rect y="334" width={W} height={H - 334} fill="url(#xa-sol)"/>
        {mv.id === 'retour'
          ? <g><polygon points={`40,334 ${W - 40},334 ${W - 40},${334 - (W - 80) * Math.tan(TH)}`} fill="#cbd5e1" opacity="0.7"/><line x1="40" y1="334" x2={W - 40} y2={334 - (W - 80) * Math.tan(TH)} stroke="#334155" strokeWidth="5" strokeLinecap="round"/></g>
          : plan ? <line x1="0" y1="334" x2={W} y2="334" stroke="#57534e" strokeWidth="3"/>
          : <g><line x1="0" y1="334" x2={W} y2="334" stroke="#57534e" strokeWidth="3"/><rect y="306" width={W} height="28" fill="#e7e5e4" opacity="0.8"/><line x1="0" y1="320" x2={W} y2="320" stroke="#fff" strokeWidth="2" strokeDasharray="22 16"/></g>}
        {mv.id === 'sinus' && <g><rect x="40" y="250" width="14" height="56" fill="#94a3b8" stroke="#475569" strokeWidth="2"/>
          <path d={`M 54 278 ${Array.from({ length: 10 }, (_, i) => `l ${(sx - 22 - 54) / 10} ${i % 2 ? 10 : -10}`).join(' ')} L ${sx - 22} 278`} fill="none" stroke="#64748b" strokeWidth="3"/></g>}
        {/* photos (chronophotographie) */}
        {dots.map(([x, y], i) => { const passe = t >= P[i].t - 1e-9; return <g key={i}><circle cx={x} cy={y} r={i === sel ? 9 : 6} fill={passe ? '#fde68a' : 'none'} stroke={i === sel ? COL.Epp : '#64748b'} strokeWidth={i === sel ? 3.5 : 2} opacity={passe ? 0.95 : 0.55}/>
          {(mv.id !== 'retour' && mv.id !== 'sinus') && <text x={x} y={y + 24} textAnchor="middle" fontSize={12 * Fm} fontWeight="700" fill="#475569" opacity="0.9">{i}</text>}</g>; })}
        {sel >= 1 && sel <= N - 1 && <line x1={dots[sel - 1][0]} y1={dots[sel - 1][1]} x2={dots[sel + 1][0]} y2={dots[sel + 1][1]} stroke={COL.Epp} strokeWidth="2.5" strokeDasharray="6 4" opacity="0.8"/>}
        {/* point étudié : saisissable */}
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Point étudié de la chronophotographie" aria-valuemin={2} aria-valuemax={N - 2} aria-valuenow={sel} aria-valuetext={`point ${sel}, date ${nbf(sel * tau, 1)} secondes`} onPointerDown={debut('point')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <circle cx={dots[sel][0]} cy={dots[sel][1]} r="22" fill="transparent"/>
          <circle className="xa-anneau" cx={dots[sel][0]} cy={dots[sel][1]} r="13" fill="none" stroke={COL.Epp} strokeWidth="3"/>
          <text x={dots[sel][0]} y={dots[sel][1] - 20} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill={COL.Epp} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">M{sel}</text>
          {!L.touche && <circle className="xa-pulse" cx={dots[sel][0]} cy={dots[sel][1]} r="14" fill="none" stroke={COL.Epp} strokeWidth="3"/>}
        </g>
        {/* mobile */}
        <g className="xa-poignee" role="button" tabIndex={0} aria-label="Mobile : cliquer pour lancer le mouvement" style={{ cursor: 'pointer' }} onPointerDown={debut('mobile')} onPointerUp={fait} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); L.demarrer(); } }}>
          <circle cx={sx} cy={sy - 14} r="30" fill="transparent"/>
          <g transform={`translate(${sx} ${sy}) rotate(${deg})`} filter="url(#xa-ombre)">
            {plan ? <circle cx="0" cy="0" r="10" fill="url(#xa-bille)" stroke="#b45309" strokeWidth="2.5"/>
              : mv.id === 'retour' ? <rect x="-17" y="-18" width="34" height="18" rx="6" fill="#a7f3d0" stroke="#047857" strokeWidth="3"/>
              : mv.id === 'sinus' ? <rect x="-22" y="-26" width="44" height="26" rx="4" fill="#fde68a" stroke="#b45309" strokeWidth="3"/>
              : <g><path d="M -28 -6 L -28 -18 Q -28 -21 -25 -21 L -14 -21 L -8 -34 L 12 -34 L 20 -21 L 25 -21 Q 28 -21 28 -18 L 28 -6 Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2.5" strokeLinejoin="round"/>
                <path d="M -10 -21 L -5 -31 L 3 -31 L 3 -21 Z M 7 -21 L 7 -31 L 11 -31 L 17 -21 Z" fill="#bae6fd"/>
                <circle cx="-14" cy="-5" r="7" fill="#1f2937" stroke="#0f172a" strokeWidth="2"/><circle cx="14" cy="-5" r="7" fill="#1f2937" stroke="#0f172a" strokeWidth="2"/></g>}
          </g>
        </g>
        {/* vecteurs vitesse et accélération du mobile (exacts) */}
        {ex.v && vn * kv > 2 && fl(sx, sy + offV, dv[0], dv[1], COL.v, 'v', true)}
        {ex.a && (an * ka > 2 ? fl(sx, sy + offA, da[0], da[1], COL.Epp, 'a', true) : <g><circle cx={sx} cy={sy + offA} r="6" fill="none" stroke={COL.Epp} strokeWidth="3"/><text x={sx + 10} y={sy + offA - 6} fontSize={15 * Fm} fontWeight="800" fill={COL.Epp} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">a = 0</text></g>)}
        <text x="16" y={vy0 + (etroit ? 26 : 30)} fontSize={17 * Fm} fontWeight="800" fill="#0f172a" stroke="#fff" strokeWidth="4" paintOrder="stroke">{mv.nom.replace(/ \(.*\)/, '')} · t = {nbf(t, 1)} s</text>
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={T} libelle="▶ Lancer"/>
      <div style={{ maxWidth: 920, margin: '10px auto 0', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Vecteurs affichés :</span>{vect('v', 'vitesse', '#15803d', 'Vecteur vitesse')}{vect('a', 'accélération', '#c2410c', 'Vecteur accélération')}
      </div>
      <Chips items={[['Date t', `${nbf(t, 2)} s`], [plan ? 'Position (x ; y)' : 'Position x', plan ? `(${nbf(mv.x(t), 1)} ; ${nbf(mv.y(t), 1)}) m` : `${nbf(mv.x(t), 1)} m`], [plan ? 'v (x ; y)' : 'Vitesse vx', plan ? `(${nbf(vx, 1)} ; ${nbf(vy, 1)})` : `${nbf(vx, 2)} m/s`, COL.v], [plan ? 'a (x ; y)' : 'Accélération ax', plan ? `(${nbf(ax, 1)} ; ${nbf(ay, 1)})` : `${nbf(ax, 2)} m/s²`, COL.Epp]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        {mv.note} Flèches en direct : valeurs exactes (dérivées de la fonction). Le trait pointillé orange relie les points {sel - 1} et {sel + 1} : sa longueur divisée par 2τ donne la vitesse estimée au point {sel}.
      </div>
    </div>);
}
