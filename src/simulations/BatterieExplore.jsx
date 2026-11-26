import { useRef } from "react";
import { KIT, styleBoite, styleBouton } from "../commun";
import { NB } from "./Distillation";
import { nbf, Seg, useEtroit, useLecture, coordSvg, StyleAnim } from "./exploAnim";
import * as M from "./batterieModele";
import { useHorloge } from "./PanneauSceneAnim";

// ====================================================
//  Exploration animée de la simulation 231 (batterie, énergie disponible, durée de fonctionnement).
//  À gauche : une batterie dont le niveau baisse, un circuit où circulent des charges (plus vite quand I grandit),
//  un récepteur qui brille avec la puissance P (poignée à tirer). À droite : la charge restante Qs - I × t selon le temps.
//  La décharge entière est jouée en accéléré (8 s). Tout vient de batterieModele.js.
// ====================================================
const T_ANIM = 8;
const C = { U: '#0369a1', I: '#15803d', Q: '#15803d', E: '#b45309', P: '#dc2626', ink: '#0f172a' };
const CHEMIN = [[67, 56], [67, 30], [270, 30], [270, 112], [270, 168], [270, 252], [67, 252], [67, 204]];
const SEGS = CHEMIN.slice(1).map((b, i) => ({ a: CHEMIN[i], b, l: Math.hypot(b[0] - CHEMIN[i][0], b[1] - CHEMIN[i][1]) }));
const LONG = SEGS.reduce((s, x) => s + x.l, 0);
const pointSur = s => { let r = ((s % LONG) + LONG) % LONG; for (const g of SEGS) { if (r <= g.l) return [g.a[0] + (g.b[0] - g.a[0]) * r / g.l, g.a[1] + (g.b[1] - g.a[1]) * r / g.l]; r -= g.l; } return CHEMIN[0]; };
const txt = v => nbf(v, v % 1 ? 1 : 0);
const GX = 52, GW = 262, GY = 52, GH = 190;

export function BatterieExplore({ ti, setTi }) {
  const boite = useRef(null), svgRef = useRef(null), drag = useRef(false);
  const etroit = useEtroit(boite);
  const L = useLecture(T_ANIM);
  const anim = useHorloge();
  const bat = M.BATTERIES[ti.b], U = bat.U, Qs = bat.Qs, P = ti.P;
  const I = M.intensite(P, U), dtH = M.dureeH(Qs, I), E = M.energieWh(U, Qs);
  const tau = Math.min(L.t / T_ANIM, 1), tH = tau * dtH, rest = Qs * (1 - tau), fr = 1 - tau;
  const vide = fr <= 1e-9;
  const iP = M.PUISSANCES_W.indexOf(P), xp = i => 36 + i * 67;
  const oxG = etroit ? 0 : 350, oyG = etroit ? 352 : 0;
  const regler = ch => { setTi(s => ({ ...s, ...ch })); L.demarrer(); };

  // horloge pour les charges (indépendante de la lecture : elles circulent tant que la batterie n'est pas vide)
  const vit = vide ? 0 : 10 + 24 * Math.min(Math.log10(1 + I * 6), 2);
  const charges = Array.from({ length: Math.floor(LONG / 32) }, (_, k) => pointSur(k * 32 + anim * vit));
  const lum = Math.min(1, Math.log10(1 + P) / Math.log10(61)) * (vide ? 0 : 1);

  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = true; L.setTouche(true); bouge(ev); };
  const bouge = ev => {
    if (!drag.current) return;
    const { X } = coordSvg(svgRef.current, ev);
    const i = Math.min(Math.max(Math.round((X - 36) / 67), 0), 4);
    if (M.PUISSANCES_W[i] !== P) regler({ P: M.PUISSANCES_W[i] });
  };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return;
    ev.preventDefault(); regler({ P: M.PUISSANCES_W[Math.min(Math.max(iP + s, 0), 4)] });
  };

  const gx = t => GX + GW * t / dtH, gy = q => GY + GH - GH * q / Qs;
  const couleurNiveau = fr > 0.5 ? '#16a34a' : fr > 0.2 ? '#f59e0b' : '#dc2626';
  const message = !L.touche && !L.fin ? 'Tire la poignée du récepteur : plus la puissance est grande, plus l’intensité I = P ÷ U est grande et plus la batterie se vide vite. Change aussi de batterie.'
    : vide ? `Batterie vide au bout de ${nbf(dtH, dtH < 10 ? 1 : 0)} h : Δt = Qs ÷ I = ${txt(Qs)} Ah ÷ ${nbf(I, 2)} A.`
    : `Après ${nbf(tH, 1)} h, il reste ${nbf(rest, 2)} Ah (${nbf(fr * 100, 0)} %). La batterie durera ${nbf(dtH, dtH < 10 ? 1 : 0)} h au total.`;

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? '0 0 340 690' : '0 0 700 344'} role="img"
        aria-label={`Scène animée : ${bat.nom} alimentant un récepteur de ${P} watts, intensité ${nbf(I, 2)} ampères, durée de fonctionnement ${nbf(dtH, 1)} heures. Charge restante ${nbf(rest, 2)} ampères-heures.`}>
        <defs>
          <filter id="bax-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.28"/></filter>
          <radialGradient id="bax-lampe" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fffbeb"/><stop offset="0.6" stopColor="#fde047"/><stop offset="1" stopColor="#f59e0b"/></radialGradient>
        </defs>
        <rect width="700" height="700" fill="#f8fafc"/>
        <rect x="4" y="4" width="334" height="336" rx="14" fill="#f0f9ff" stroke="#cbd5e1"/>
        {/* circuit */}
        <path d={`M ${CHEMIN.map(z => z.join(' ')).join(' L ')}`} fill="none" stroke="#475569" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
        {/* batterie */}
        <g filter="url(#bax-ombre)">
          <rect x="52" y="46" width="30" height="12" rx="3" fill="#475569"/>
          <rect x="26" y="58" width="82" height="146" rx="12" fill="#f8fafc" stroke="#334155" strokeWidth="4"/>
        </g>
        <clipPath id="bax-cl"><rect x="30" y="62" width="74" height="138" rx="9"/></clipPath>
        <g clipPath="url(#bax-cl)"><rect x="30" y={62 + 138 * (1 - fr)} width="74" height={138 * fr + 1} fill={couleurNiveau} opacity="0.85"/>
          <rect x="30" y={62 + 138 * (1 - fr)} width="74" height="5" fill="#fff" opacity="0.35"/></g>
        <text x="67" y="108" textAnchor="middle" fontSize="20" fontWeight="800" fill={C.ink} stroke="#fff" strokeWidth="4" paintOrder="stroke">{txt(U)}{NB}V</text>
        <text x="67" y="134" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.ink} stroke="#fff" strokeWidth="4" paintOrder="stroke">{txt(Qs)}{NB}Ah</text>
        <text x="67" y="158" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.ink} stroke="#fff" strokeWidth="4" paintOrder="stroke">{nbf(fr * 100, 0)}{NB}%</text>
        <text x="94" y="40" fontSize="18" fontWeight="800" fill="#b91c1c">+</text>
        {/* récepteur : lampe */}
        {lum > 0 && <circle cx="270" cy="140" r={30 + 26 * lum} fill="#fde047" opacity={0.25 + 0.3 * lum}/>}
        <circle cx="270" cy="140" r="28" fill={lum > 0 ? 'url(#bax-lampe)' : '#e2e8f0'} stroke="#475569" strokeWidth="4" filter="url(#bax-ombre)"/>
        <path d="M 256 154 l 7 -16 l 7 14 l 7 -14 l 7 16" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinejoin="round"/>
        <text x="270" y="190" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.P} stroke="#fff" strokeWidth="4" paintOrder="stroke">P = {P}{NB}W</text>
        <text x="164" y="22" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.I} stroke="#f0f9ff" strokeWidth="4" paintOrder="stroke">I = {nbf(I, I < 1 ? 2 : 1)}{NB}A</text>
        {charges.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="4" fill="#fde047" stroke="#a16207" strokeWidth="1.2"/>)}

        {/* poignée de puissance */}
        <text x="20" y="276" fontSize="14" fontWeight="800" fill={C.P}>Puissance du récepteur (W)</text>
        <line x1={xp(0)} y1="316" x2={xp(4)} y2="316" stroke="#7c6f57" strokeWidth="6" strokeLinecap="round"/>
        {M.PUISSANCES_W.map((v, i) => <text key={v} x={xp(i)} y="298" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{v}</text>)}
        <rect x="14" y="300" width="312" height="34" fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Puissance du récepteur" aria-valuemin={1} aria-valuemax={60} aria-valuenow={P} aria-valuetext={`${P} watts`}
          onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <rect x={xp(iP) - 26} y="294" width="52" height="44" fill="transparent"/>
          {!L.touche && <circle className="xa-pulse" cx={xp(iP)} cy="316" r="17" fill="none" stroke={C.P} strokeWidth="3"/>}
          <circle className="xa-anneau" cx={xp(iP)} cy="316" r="13" fill="url(#bax-lampe)" stroke="#b45309" strokeWidth="3" filter="url(#bax-ombre)"/>
        </g>

        {/* courbe charge restante */}
        <g transform={`translate(${oxG} ${oyG})`}>
          <rect x="4" y="4" width="334" height="336" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
          <text x="170" y="26" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.ink}>Charge restante de la batterie</text>
          {[0, 0.5, 1].map(f => <g key={f}><line x1={GX} x2={GX + GW} y1={gy(f * Qs)} y2={gy(f * Qs)} stroke="#e2e8f0"/><text x={GX - 6} y={gy(f * Qs) + 4} textAnchor="end" fontSize="12" fill="#475569">{nbf(f * Qs, 1)}</text></g>)}
          {[0, 0.5, 1].map(f => <text key={f} x={gx(f * dtH)} y={GY + GH + 16} textAnchor="middle" fontSize="12" fill="#475569">{nbf(f * dtH, dtH < 10 ? 1 : 0)}</text>)}
          <line x1={GX} x2={GX} y1={GY} y2={GY + GH} stroke="#334155" strokeWidth="2"/><line x1={GX} x2={GX + GW} y1={GY + GH} y2={GY + GH} stroke="#334155" strokeWidth="2"/>
          <text x={GX - 2} y={GY - 8} fontSize="13" fontWeight="800" fill={C.Q}>Qs (Ah)</text>
          <text x={GX + GW} y={GY + GH + 34} textAnchor="end" fontSize="13" fontWeight="800" fill={C.U}>temps (h)</text>
          <line x1={gx(0)} y1={gy(Qs)} x2={gx(dtH)} y2={gy(0)} stroke="#cbd5e1" strokeWidth="3" strokeDasharray="6 5"/>
          <line x1={gx(0)} y1={gy(Qs)} x2={gx(tH)} y2={gy(rest)} stroke={C.Q} strokeWidth="5" strokeLinecap="round"/>
          <circle cx={gx(tH)} cy={gy(rest)} r="8" fill="#fff" stroke={C.P} strokeWidth="3.5"/>
          <text x={GX + GW - 4} y={GY + 16} textAnchor="end" fontSize="13" fontWeight="800" fill={C.E}>Δt = Qs ÷ I = {nbf(dtH, dtH < 10 ? 1 : 0)}{NB}h</text>
          <text x="170" y="300" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#334155">I = P ÷ U = {P}{NB}W ÷ {txt(U)}{NB}V = {nbf(I, 2)}{NB}A</text>
          <text x="170" y="322" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={C.E}>E = Qs × U = {txt(Qs)} × {txt(U)} = {nbf(E, 0)}{NB}Wh</text>
        </g>
      </svg>

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.touche ? 700 : 400, color: vide ? '#b91c1c' : KIT.txt2 }}>{message}</div>
      <div className="xa-ctrl lect" style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {L.joue
            ? <button type="button" onClick={() => L.setJoue(false)} style={styleBouton(true, '#475569')}>⏸ Pause</button>
            : <button type="button" onClick={L.demarrer} style={styleBouton(true, '#0369a1')}>{L.fin ? '↻ Rejouer' : '▶ Décharger'}</button>}
        </div>
        <label style={{ display: 'block', minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Temps écoulé : {nbf(tH, 1)} h sur {nbf(dtH, 1)} h (accéléré)</span>
          <input type="range" min={0} max={T_ANIM} step={1 / 60} value={Math.min(L.t, T_ANIM)} aria-label="Temps écoulé" onChange={ev => { L.setJoue(false); L.setT(Number(ev.target.value)); L.setTouche(true); }} style={{ width: '100%', minHeight: 32 }}/>
        </label>
        <Seg label="Vitesse de lecture" valeur={L.vit} onChange={L.setVit} options={[[1, '×1'], [0.5, '×½'], [0.25, '×¼']]}/>
      </div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Batterie ou pile" valeur={ti.b} onChange={v => regler({ b: v, t: 0 })} options={M.BATTERIES.map(b => [b.id, `${txt(b.U)} V · ${txt(b.Qs)} Ah`])}/>
      </div>
      <div className="xa-chips" style={{ maxWidth: 920, margin: '10px auto 0', '--n': 5 }}>
        {[['Énergie E = Qs × U', `${nbf(E, 0)}${NB}Wh`, C.E], ['Intensité I', `${nbf(I, 2)}${NB}A`, C.I], ['Durée Δt', `${nbf(dtH, 1)}${NB}h`, C.U], ['Charge restante', `${nbf(rest, 2)}${NB}Ah`, C.Q], ['Énergie restante', `${nbf(rest * U, 0)}${NB}Wh`, C.E]].map(([n, v, c]) => (
          <div key={n} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{n}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
          </div>))}
      </div>
    </div>);
}
