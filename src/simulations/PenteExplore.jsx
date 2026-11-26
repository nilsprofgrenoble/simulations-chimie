import { useRef, useState } from "react";
import { KIT, styleBoite, stylePetitBouton, Curseur, LigneMesure, Section } from "../commun";
import { NB } from "./Distillation";
import * as M from "./penteXtModele";
import { COL, nbf, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarreLecture, Chips, Seg } from "./exploAnim";

// ====================================================
//  Partie animée de l'exploration de la simulation 265 (lire une vitesse sur un graphique x(t)).
//  Un mobile roule sur une route en suivant x(t) ; sous la route, la courbe se trace en même temps.
//  Deux poignées saisissables : la date t (le mobile suit) et la fin de la corde (écart Δt). La tangente accompagne le mobile.
// ====================================================
const W = 700, H = 450, X0 = 70, X1 = 670, YH = 170, YB = 410;
const bornes = c => { const xs = [c.xmin, c.xmax]; return { xmin: Math.floor(Math.min(...xs) / 5) * 5, xmax: Math.ceil(Math.max(...xs) / 5) * 5 }; };

export function PenteExplore({ ex, setEx }) {
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite);
  const [ouvert, setOuvert] = useState(false);
  const c = M.COURBES[ex.c], T = c.tmax, b = bornes(c), Fm = etroit ? 1.9 : 1;
  const L = useLecture(T, false);
  const t = Math.min(L.t, T - 0.2), dt = Math.max(0.1, Math.min(ex.dt, T - t)), corde = T - t >= 0.1;
  const X = tt => X0 + (tt / T) * (X1 - X0), Y = x => YB - ((x - b.xmin) / (b.xmax - b.xmin)) * (YB - YH), R = x => X0 + ((x - b.xmin) / (b.xmax - b.xmin)) * (X1 - X0);
  const x = c.x(t), v = c.v(t), x2 = c.x(t + dt), vm = M.vMoy(c, t, t + dt);
  const N = 80, trace = Array.from({ length: Math.round((Math.min(L.t, T) / T) * N) + 1 }, (_, i) => { const tt = Math.min(L.t, T) * i / Math.max(1, Math.round((Math.min(L.t, T) / T) * N)); return `${X(tt)},${Y(c.x(tt))}`; }).join(' ');
  const complet = Array.from({ length: N + 1 }, (_, i) => `${X(T * i / N)},${Y(c.x(T * i / N))}`).join(' ');
  const mx = R(x), regler = ch => { L.reset(); setEx(s => ({ ...s, ...ch })); };

  const debut = type => ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type, bouge: false }; L.setJoue(false); L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d) return; d.bouge = true;
    const { X: px } = coordSvg(svgRef.current, ev), tt = Math.min(Math.max(((px - X0) / (X1 - X0)) * T, 0), T);
    if (d.type === 'date') L.setT(Math.round(Math.min(tt, T - 0.2) * 20) / 20);
    else setEx(s => ({ ...s, dt: Math.max(0.1, Math.min(Math.round((tt - t) * 10) / 10, T - t)) }));
  };
  const fait = ev => { drag.current = null; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = type => ev => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return; ev.preventDefault(); L.setJoue(false); L.setTouche(true);
    if (type === 'date') L.setT(Math.min(Math.max(t + s * 0.25, 0), T - 0.2)); else setEx(o => ({ ...o, dt: Math.max(0.1, Math.min(Math.round((dt + s * 0.1) * 10) / 10, T - t)) }));
  };
  const message = !L.touche && !L.joue && L.t === 0 ? 'Clique sur le mobile (ou sur « Lancer ») : il roule et la courbe se trace. Saisis le point orange ou bleu pour changer la date ou l’écart Δt.'
    : L.fin ? 'Fin du mouvement. Reprends la date avec la poignée bleue : la tangente donne la vitesse à cette date.' : '';
  const sens = v === 0 ? 'La tangente est horizontale : la vitesse est nulle à cette date.' : v > 0 ? 'La tangente monte : la vitesse est positive (déplacement vers les x croissants).' : 'La tangente descend : la vitesse est négative (déplacement vers les x décroissants).';
  // tangente : segment de longueur fixe autour du point
  const tg = (() => { const a = Math.max(0, t - 1.6), z = Math.min(T, t + 1.6); return [X(a), Y(x + v * (a - t)), X(z), Y(x + v * (z - t))]; })();
  const bascule = cle => <button key={cle} type="button" onClick={() => setEx(s => ({ ...s, [cle]: !s[cle] }))} aria-pressed={ex[cle]} style={stylePetitBouton(ex[cle], cle === 'corde' ? '#c2410c' : '#0b4f94')}>{ex[cle] ? '✓ ' : ''}{cle === 'corde' ? 'corde' : 'tangente'}</button>;
  const grad = [];
  for (let g = b.xmin; g <= b.xmax; g += (b.xmax - b.xmin) > 30 ? 10 : 5) grad.push(g);

  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Mouvement" valeur={ex.c} onChange={k => { L.reset(); setEx(s => ({ ...s, c: k })); }} options={M.ORDRE.map(k => [k, M.COURBES[k].nom])}/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>{bascule('corde')}{bascule('tang')}</div>
      </div>
      <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Scène animée : ${c.nom}. Un mobile roule sur une route et la courbe de sa position en fonction de la date se trace en dessous. Date ${nbf(t, 1)} secondes, vitesse ${nbf(v, 2)} mètres par seconde.`}>
        <DefsAnim/>
        <rect width={W} height={H} fill="#f8fafc"/>
        <rect width={W} height="120" fill="url(#xa-ciel)"/>
        <rect y="86" width={W} height="34" fill="#e7e5e4"/><line x1="0" y1="103" x2={W} y2="103" stroke="#fff" strokeWidth="2" strokeDasharray="22 16"/><line x1="0" y1="120" x2={W} y2="120" stroke="#57534e" strokeWidth="3"/>
        {grad.map(g => <g key={g}><line x1={R(g)} y1="120" x2={R(g)} y2="128" stroke="#57534e" strokeWidth="2"/><text x={R(g)} y="142" textAnchor="middle" fontSize={12 * Fm} fill="#475569">{g}</text></g>)}
        {/* graphe */}
        <g>
          {grad.map(g => <line key={g} x1={X0} y1={Y(g)} x2={X1} y2={Y(g)} stroke="#e2e8f0" strokeWidth="1"/>)}
          {Array.from({ length: Math.floor(T) + 1 }, (_, i) => <g key={i}><line x1={X(i)} y1={YH} x2={X(i)} y2={YB} stroke="#e2e8f0" strokeWidth="1"/><text x={X(i)} y={YB + 18} textAnchor="middle" fontSize={12 * Fm} fill="#475569">{i}</text></g>)}
          {grad.map(g => <text key={g} x={X0 - 8} y={Y(g) + 4} textAnchor="end" fontSize={12 * Fm} fill="#475569">{g}</text>)}
          <line x1={X0} y1={YH} x2={X0} y2={YB} stroke="#334155" strokeWidth="2"/><line x1={X0} y1={Y(0)} x2={X1} y2={Y(0)} stroke="#334155" strokeWidth="2"/>
          <text x={X1} y={YB + 36} textAnchor="end" fontSize={13 * Fm} fontWeight="700" fill="#334155">t (s)</text>
          <text x={X0 + 6} y={YH - 6} fontSize={13 * Fm} fontWeight="700" fill="#334155">x (m)</text>
          <polyline points={complet} fill="none" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="3 5"/>
          <polyline points={trace} fill="none" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        {ex.corde && corde && <g><line x1={X(t)} y1={Y(x)} x2={X(t + dt)} y2={Y(x2)} stroke="#c2410c" strokeWidth="3.5" strokeDasharray="7 4"/>
          <line x1={X(t)} y1={Y(x)} x2={X(t + dt)} y2={Y(x)} stroke="#c2410c" strokeWidth="1.5" opacity="0.6"/><line x1={X(t + dt)} y1={Y(x)} x2={X(t + dt)} y2={Y(x2)} stroke="#c2410c" strokeWidth="1.5" opacity="0.6"/></g>}
        {ex.tang && <line x1={tg[0]} y1={tg[1]} x2={tg[2]} y2={tg[3]} stroke="#0b4f94" strokeWidth="4" strokeLinecap="round" opacity="0.9"/>}
        <line x1={X(t)} y1={Y(x)} x2={X(t)} y2={YB} stroke="#0b4f94" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6"/>
        <line x1={mx} y1="120" x2={X(t)} y2={Y(x)} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2 5" opacity="0.7"/>
        {/* poignée Δt */}
        {ex.corde && corde && <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Écart Δt de la corde" aria-valuemin={0.1} aria-valuemax={nbf(T - t, 1)} aria-valuenow={dt} aria-valuetext={`${nbf(dt, 1)} secondes`} onPointerDown={debut('dt')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier('dt')}>
          <circle cx={X(t + dt)} cy={Y(x2)} r="22" fill="transparent"/><circle className="xa-anneau" cx={X(t + dt)} cy={Y(x2)} r="10" fill="#fff" stroke="#c2410c" strokeWidth="3.5"/>
          {!L.touche && <circle className="xa-pulse" cx={X(t + dt)} cy={Y(x2)} r="12" fill="none" stroke="#c2410c" strokeWidth="3"/>}
        </g>}
        {/* poignée date */}
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Date t" aria-valuemin={0} aria-valuemax={T - 0.2} aria-valuenow={t} aria-valuetext={`${nbf(t, 2)} secondes`} onPointerDown={debut('date')} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier('date')}>
          <circle cx={X(t)} cy={Y(x)} r="22" fill="transparent"/><circle className="xa-anneau" cx={X(t)} cy={Y(x)} r="10" fill="#0b4f94" stroke="#fff" strokeWidth="3"/>
          {!L.touche && <circle className="xa-pulse" cx={X(t)} cy={Y(x)} r="12" fill="none" stroke="#0b4f94" strokeWidth="3"/>}
        </g>
        <text x={X(t)} y={YB - 6 - 0} textAnchor="middle" fontSize={13 * Fm} fontWeight="800" fill="#0b4f94" stroke="#fff" strokeWidth="3.5" paintOrder="stroke" dy={-4}>t = {nbf(t, 1)} s</text>
        {/* mobile */}
        <g className="xa-poignee" role="button" tabIndex={0} aria-label="Mobile : cliquer pour lancer" style={{ cursor: 'pointer' }} onPointerDown={ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { type: 'mob' }; }} onPointerUp={ev => { drag.current = null; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* ok */ } L.demarrer(); }} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); L.demarrer(); } }}>
          <circle cx={mx} cy="86" r="32" fill="transparent"/>
          <g transform={`translate(${mx} 112)`} filter="url(#xa-ombre)">
            <path d="M -28 -6 L -28 -18 Q -28 -21 -25 -21 L -14 -21 L -8 -34 L 12 -34 L 20 -21 L 25 -21 Q 28 -21 28 -18 L 28 -6 Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2.5" strokeLinejoin="round" transform={v < 0 ? 'scale(-1 1)' : ''}/>
            <circle cx="-14" cy="-5" r="7" fill="#1f2937" stroke="#0f172a" strokeWidth="2"/><circle cx="14" cy="-5" r="7" fill="#1f2937" stroke="#0f172a" strokeWidth="2"/>
          </g>
        </g>
        <text x="16" y="28" fontSize={17 * Fm} fontWeight="800" fill="#0f172a" stroke="#fff" strokeWidth="4" paintOrder="stroke">{c.nom}</text>
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={T} libelle="▶ Lancer"/>
      <Chips items={[['Date t', `${nbf(t, 2)} s`], ['Position x', `${nbf(x, 1)} m`], ['Vitesse (tangente)', `${nbf(v, 2)} m/s`, COL.v], ['Vitesse moyenne (corde)', corde ? `${nbf(vm, 2)} m/s` : '—', COL.Epp]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
        <LigneMesure nom={`Position x à t = ${nbf(t, 1)} s`} valeur={`${nbf(x, 2)}${NB}m`}/>
        <LigneMesure nom={`Position x à t + Δt = ${nbf(t + dt, 1)} s`} valeur={`${nbf(x2, 2)}${NB}m`}/>
        <LigneMesure nom="Vitesse moyenne (pente de la corde)" valeur={corde ? `${nbf(vm, 2)}${NB}m/s` : '—'} couleur="#c2410c"/>
        <LigneMesure nom="Vitesse à la date t (pente de la tangente)" valeur={`${nbf(v, 2)}${NB}m/s`} couleur="#0b4f94"/>
        <LigneMesure nom="Écart entre les deux" valeur={corde ? `${nbf(vm - v, 2)}${NB}m/s` : '—'}/>
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: v === 0 ? '#b91c1c' : '#0b4f94', lineHeight: 1.5 }}>{sens}</div>
        <div style={{ marginTop: 4, fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Diminue Δt (poignée orange) : la corde se rapproche de la tangente et la vitesse moyenne de la vitesse à la date t.</div>
      </div>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre="Réglages précis (clavier)" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
          <Curseur nom="Date t" valeur={t} onChange={v2 => { L.setJoue(false); L.setT(v2); L.setTouche(true); }} min={0} max={T - 0.2} pas={0.05} unite="s" decimales={2} couleur="#0b4f94"/>
          <Curseur nom="Écart Δt de la corde" valeur={dt} onChange={v2 => regler({ dt: v2 })} min={0.1} max={Math.max(0.2, T - t)} pas={0.1} unite="s" decimales={1} couleur="#c2410c"/>
        </Section>
      </div>
    </div>);
}
