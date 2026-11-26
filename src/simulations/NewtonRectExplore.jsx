import { useMemo, useRef, useState } from "react";
import { KIT, styleBoite, Curseur, LigneMesure, Section } from "../commun";
import { NB } from "./Distillation";
import * as M from "./newtonRectModele";
import { COL, nbf, useEtroit, useLecture, imageA, coordSvg, StyleAnim, DefsAnim, BarreLecture, Chips, Seg } from "./exploAnim";

// ====================================================
//  Partie animée de l'exploration de la simulation 268 (bilan des forces et lois de Newton, mouvement rectiligne).
//  On saisit la flèche de poussée F (vers la droite ou vers la gauche), on choisit masse, frottement et vitesse initiale, puis « Lancer » :
//  le chariot reste au centre, c'est le rail qui défile ; le bilan des forces (F, f, ΣF) se met à jour en direct, avec v(t).
// ====================================================
const PXM = 24, T = M.T;
const FMAX = 12;

export function NewtonRectExplore({ ex, setEx }) {
  const svgRef = useRef(null), drag = useRef(false), boite = useRef(null);
  const etroit = useEtroit(boite), [ouvert, setOuvert] = useState(false);
  const L = useLecture(T, false);
  const Fm = etroit ? 1.35 : 1, W = etroit ? 460 : 700, CX = W / 2, DEMI = etroit ? 55 : 70, SC = etroit ? 10 : 18;
  const H = etroit ? 245 : 250, SOL = etroit ? 182 : 185, YC = SOL - 16 - 30, dS = etroit ? 70 : 66;
  const { F, f, m, v0 } = ex;
  const frames = useMemo(() => M.simuler({ F, f, m, v0 }), [F, f, m, v0]);
  const im = imageA(frames, L.t), vmax = useMemo(() => frames.reduce((a, i) => Math.max(a, Math.abs(i.v)), 1), [frames]);
  const { x, v, a, fr, S } = im;
  const dx = Math.max(Math.min(S * SC, W / 2 - 24), -(W / 2 - 24));
  const base = F >= 0 ? CX + DEMI : CX - DEMI, xp = base + F * SC;   // origine et bout de la flèche de poussée (la pointe reste une vraie pointe de vecteur)
  const gripLarg = etroit ? 54 : 40, gripH = etroit ? 38 : 28, lf = Math.abs(F) * SC;
  const gx = lf >= gripLarg + 26 ? base + 0.4 * (xp - base) : base + (F >= 0 ? 1 : -1) * (lf + gripLarg / 2 + 12);   // la poignée est sur la hampe (ou à côté si la flèche est courte)
  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = { off: coordSvg(svgRef.current, ev).X - xp }; L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d) return; const X = coordSvg(svgRef.current, ev).X - d.off;   // on garde l'écart entre le doigt et le bout de la flèche
    const Fn = X >= CX ? Math.max(0, (X - CX - DEMI) / SC) : Math.min(0, (X - CX + DEMI) / SC);
    L.reset(); setEx(s => ({ ...s, F: Math.max(-FMAX, Math.min(FMAX, Math.round(Fn))) }));
  };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return; ev.preventDefault(); L.setTouche(true); L.reset();
    setEx(o => ({ ...o, F: Math.max(-FMAX, Math.min(FMAX, o.F + s)) }));
  };
  const change = (cle, val) => { L.reset(); setEx(s => ({ ...s, [cle]: val })); };
  const arr = (x1, x2, y, c, w = 7) => {
    const l = Math.abs(x2 - x1); if (l < 3) return null; const s = Math.sign(x2 - x1), h = Math.min(18, l * 0.7);
    return <g><line x1={x1} y1={y} x2={x2 - s * h * 0.8} y2={y} stroke={c} strokeWidth={w} strokeLinecap="butt"/><polygon points={`${x2},${y} ${x2 - s * h},${y - 10} ${x2 - s * h},${y + 10}`} fill={c}/></g>;
  };
  const etat = (!L.touche && !L.joue && L.t === 0) ? 0 : L.joue || L.t > 0 ? 2 : 1;
  const bilan = S > 1e-9 ? `ΣF = ${nbf(S, 1)} N vers la droite : la vitesse augmente (a = ${nbf(a, 2)} m/s²).` : S < -1e-9 ? `ΣF = ${nbf(Math.abs(S), 1)} N vers la gauche : la vitesse diminue (a = ${nbf(a, 2)} m/s²).` : v === 0 && F !== 0 ? 'Le frottement compense exactement la poussée : ΣF = 0 et le chariot reste immobile.' : v === 0 ? 'Aucune force horizontale : ΣF = 0, le chariot est immobile.' : 'ΣF = 0 : la vitesse reste constante (principe d’inertie).';
  const message = etat === 0 ? 'Saisis la poignée sur la flèche bleue de la poussée F : tire-la vers la droite pour allonger la flèche, ou passe à gauche du chariot pour pousser en arrière. Choisis masse, frottement et vitesse initiale, puis « Lancer ».' : etat === 1 ? 'Le bilan est prêt : appuie sur « Lancer » pour voir le chariot bouger et la vitesse v(t) se tracer.' : bilan;
  const aria = `Scène animée : un chariot de ${m} kilogrammes sur un rail, poussée de ${Math.abs(F)} newtons vers ${F >= 0 ? 'la droite' : 'la gauche'}, frottement de ${f} newtons, vitesse initiale ${v0} mètre par seconde. Somme des forces ${nbf(S, 1)} newtons, accélération ${nbf(a, 2)} mètres par seconde carrée, vitesse ${nbf(v, 1)} mètres par seconde.`;

  // graphique v(t)
  const GW = 700, GH = etroit ? 230 : 170, gx0 = 70, gx1 = 680, gy0 = 18, gy1 = GH - 34, vm = Math.ceil(vmax), vmin = Math.min(0, ...frames.filter((_, k) => k % 6 === 0).map(i => i.v));
  const vlo = Math.floor(vmin), vhi = Math.max(vm, 1);
  const gX = t => gx0 + (t / T) * (gx1 - gx0), gY = vv => gy1 - ((vv - vlo) / (vhi - vlo)) * (gy1 - gy0);
  const pts = frames.filter((i, k) => i.t <= L.t + 1e-9 && k % 4 === 0).map(i => `${gX(i.t).toFixed(1)},${gY(i.v).toFixed(1)}`).join(' ');
  const k0 = Math.floor(x - CX / PXM - 1), k1 = Math.ceil(x + (W - CX) / PXM + 1), marques = [];
  for (let k = k0; k <= k1; k++) marques.push(k);

  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Seg label="Masse du chariot" valeur={m} onChange={v2 => change('m', v2)} options={M.MASSES.map(v2 => [v2, `${v2} kg`])}/>
        <Seg label="Frottement f" valeur={f} onChange={v2 => change('f', v2)} options={M.FROTTEMENTS.map(v2 => [v2, `${v2} N`])}/>
        <Seg label="Vitesse au départ" valeur={v0} onChange={v2 => change('v0', v2)} options={M.VITESSES0.map(v2 => [v2, `${nbf(v2, 0)} m/s`])}/>
      </div>
      <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        <DefsAnim/>
        <rect width={W} height={H} fill="#f8fafc"/>
        <rect x="0" y="0" width={W} height={SOL} fill="#eef2ff" opacity="0.6"/>
        {/* rail qui défile */}
        <rect x="0" y={SOL} width={W} height="22" fill="#e2e8f0"/><line x1="0" y1={SOL} x2={W} y2={SOL} stroke="#475569" strokeWidth="3"/>
        {marques.map(k => { const X = CX + (k - x) * PXM; return <g key={k}><line x1={X} y1={SOL} x2={X} y2={SOL + (k % 5 === 0 ? 16 : 9)} stroke="#475569" strokeWidth={k % 5 === 0 ? 2.5 : 1.5}/>{k % 5 === 0 && <text x={X} y={SOL + 20 + 14 * Fm * 0.7} textAnchor="middle" fontSize={13 * Fm} fontWeight="700" fill="#475569">{k} m</text>}</g>; })}
        {/* chariot */}
        <rect x={CX - DEMI} y={SOL - 16 - 60} width={2 * DEMI} height="60" rx="10" fill="#dbeafe" stroke="#0b4f94" strokeWidth="3.5" filter="url(#xa-ombre)"/>
        <circle cx={CX - DEMI + (etroit ? 20 : 30)} cy={SOL - 9} r="11" fill="#e2e8f0" stroke="#475569" strokeWidth="3"/><circle cx={CX + DEMI - (etroit ? 20 : 30)} cy={SOL - 9} r="11" fill="#e2e8f0" stroke="#475569" strokeWidth="3"/>
        <text x={CX - (etroit ? 14 : 0)} y={YC + 8} textAnchor="middle" fontSize={20 * Fm * 0.8} fontWeight="800" fill="#0b4f94">{m} kg</text>
        {/* somme des forces */}
        {Math.abs(dx) > 3 ? <g>{arr(CX, CX + dx, YC - dS, '#6d28d9', 9)}<text x={CX + dx / 2} y={YC - dS - 10} textAnchor="middle" fontSize={19 * Fm} fontWeight="800" fill="#6d28d9" stroke="#fff" strokeWidth="4" paintOrder="stroke">ΣF = {nbf(S, 1).replace("-", "−")} N</text></g>
          : <text x={CX} y={YC - dS - 10} textAnchor="middle" fontSize={19 * Fm} fontWeight="800" fill="#6d28d9" stroke="#fff" strokeWidth="4" paintOrder="stroke">ΣF = 0</text>}
        {/* frottement */}
        {Math.abs(fr) > 1e-9 && <g>{arr(fr < 0 ? CX - DEMI : CX + DEMI, (fr < 0 ? CX - DEMI : CX + DEMI) + fr * SC, YC + 22, '#dc2626', 7)}
          <text x={(fr < 0 ? CX - DEMI : CX + DEMI) + fr * SC + (fr < 0 ? -10 : 10)} y={YC + 22 + 6 * Fm} textAnchor={fr < 0 ? 'end' : 'start'} fontSize={17 * Fm} fontWeight="800" fill="#b91c1c" stroke="#fff" strokeWidth="4" paintOrder="stroke">f = {nbf(Math.abs(fr), 1)} N</text></g>}
        {/* poussée + poignée */}
        {F !== 0 && <g>{arr(F >= 0 ? CX + DEMI : CX - DEMI, xp, YC - 10, '#0b4f94', 8)}</g>}
        <text x={lf >= gripLarg + 26 ? base + 0.75 * (xp - base) : gx} y={YC - 34 - (etroit ? 10 : 0)} textAnchor="middle" fontSize={19 * Fm} fontWeight="800" fill="#0b4f94" stroke="#fff" strokeWidth="4" paintOrder="stroke">F = {nbf(Math.abs(F), 0)} N</text>
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Poussée F exercée sur le chariot" aria-valuemin={-FMAX} aria-valuemax={FMAX} aria-valuenow={F} aria-valuetext={`${Math.abs(F)} newtons vers ${F >= 0 ? 'la droite' : 'la gauche'}`} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <rect x={Math.min(base, xp) - 12} y={YC - 10 - (etroit ? 34 : 22)} width={Math.max(Math.abs(xp - base), gripLarg) + 24} height={etroit ? 68 : 44} fill="transparent"/>
          <rect className="xa-anneau" x={gx - gripLarg / 2} y={YC - 10 - gripH / 2} width={gripLarg} height={gripH} rx={gripH / 2} fill="#fff" stroke="#0b4f94" strokeWidth="3.5"/>
          <polyline points={`${gx - 4},${YC - 10 - 6} ${gx - 10},${YC - 10} ${gx - 4},${YC - 10 + 6}`} fill="none" stroke="#0b4f94" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points={`${gx + 4},${YC - 10 - 6} ${gx + 10},${YC - 10} ${gx + 4},${YC - 10 + 6}`} fill="none" stroke="#0b4f94" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          {!L.touche && <rect className="xa-pulse" x={gx - gripLarg / 2 - 3} y={YC - 10 - gripH / 2 - 3} width={gripLarg + 6} height={gripH + 6} rx={gripH / 2 + 3} fill="none" stroke="#0b4f94" strokeWidth="3"/>}
        </g>
        {/* poids et réaction : flèches verticales égales (elles se compensent) */}
        <g stroke="#15803d" strokeWidth="5" strokeLinecap="round" fill="#15803d">
          <line x1={CX + (etroit ? 30 : 38)} y1={YC - 16} x2={CX + (etroit ? 30 : 38)} y2={YC - 44}/><polygon points={`${CX + (etroit ? 30 : 38)},${YC - 52} ${CX + (etroit ? 23 : 31)},${YC - 40} ${CX + (etroit ? 37 : 45)},${YC - 40}`} stroke="none"/>
          <line x1={CX + (etroit ? 30 : 38)} y1={YC - 16} x2={CX + (etroit ? 30 : 38)} y2={YC + 12}/><polygon points={`${CX + (etroit ? 30 : 38)},${YC + 20} ${CX + (etroit ? 23 : 31)},${YC + 8} ${CX + (etroit ? 37 : 45)},${YC + 8}`} stroke="none"/>
          <text x={CX + (etroit ? 42 : 50)} y={YC - 34} fontSize={15 * Fm * 0.9} fontWeight="800" stroke="none">R</text><text x={CX + (etroit ? 42 : 50)} y={YC + 18} fontSize={15 * Fm * 0.9} fontWeight="800" stroke="none">P</text></g>
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={T} libelle="▶ Lancer"/>
      <svg className="xa-svg" viewBox={`0 0 ${GW} ${GH}`} role="img" aria-label="Graphique de la vitesse du chariot en fonction du temps" style={{ marginTop: 10 }}>
        <rect width={GW} height={GH} fill="#fff"/>
        <line x1={gx0} y1={gy1} x2={gx1} y2={gy1} stroke="#475569" strokeWidth="2.5"/><line x1={gx0} y1={gy0} x2={gx0} y2={gy1} stroke="#475569" strokeWidth="2.5"/>
        {vlo < 0 && <line x1={gx0} y1={gY(0)} x2={gx1} y2={gY(0)} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 5"/>}
        {[0, 2, 4, 6].map(t => <g key={t}><line x1={gX(t)} y1={gy1} x2={gX(t)} y2={gy1 + 6} stroke="#475569" strokeWidth="2"/><text x={gX(t)} y={gy1 + 14 + 14 * Fm * 0.75} textAnchor="middle" fontSize={13 * Fm * 0.95} fontWeight="700" fill="#475569">{t} s</text></g>)}
        <text x={gx0 - 8} y={gY(vhi) + 5} textAnchor="end" fontSize={13 * Fm * 0.95} fontWeight="700" fill="#475569">{vhi}</text><text x={gx0 - 8} y={gY(vlo) + 5} textAnchor="end" fontSize={13 * Fm * 0.95} fontWeight="700" fill="#475569">{vlo}</text>
        <text x={gx0 + 8} y={gy0 + 4} fontSize={13 * Fm * 0.95} fontWeight="800" fill="#15803d">v (m/s)</text>
        {pts && <polyline points={pts} fill="none" stroke="#15803d" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>}
        <circle cx={gX(L.t)} cy={gY(v)} r="7" fill="#15803d" stroke="#fff" strokeWidth="2.5"/>
      </svg>
      <Chips items={[['ΣF', `${nbf(S, 1)} N`, '#6d28d9'], ['a', `${nbf(a, 2)} m/s²`, COL.Epp], ['Vitesse v', `${nbf(v, 1)} m/s`, COL.v], ['Position x', `${nbf(x, 1)} m`]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
        <LigneMesure nom="Poussée F (axe vers la droite)" valeur={`${nbf(F, 1)}${NB}N`} couleur="#0b4f94"/>
        <LigneMesure nom="Force de frottement f (axe vers la droite)" valeur={`${nbf(fr, 1)}${NB}N`} couleur="#b91c1c"/>
        <LigneMesure nom="Somme des forces ΣF = F + f" valeur={`${nbf(S, 1)}${NB}N`} couleur="#6d28d9"/>
        <LigneMesure nom={`Accélération a = ΣF ÷ m  (m = ${m} kg)`} valeur={`${nbf(a, 2)}${NB}m/s²`} couleur="#c2410c"/>
        <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Le poids et la réaction du rail se compensent (verticalement) : seules les forces horizontales changent le mouvement. Avec F = f, la vitesse reste constante ; avec une masse double, la même somme des forces donne une accélération deux fois plus petite.</div>
      </div>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre="Réglages précis (clavier)" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
          <Curseur nom="Poussée F (vers la droite si positive)" valeur={F} onChange={v2 => change('F', v2)} min={-FMAX} max={FMAX} pas={1} unite="N" decimales={0} couleur="#0b4f94"/>
        </Section>
      </div>
    </div>);
}
