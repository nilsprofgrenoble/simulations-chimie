import { useRef, useState } from "react";
import { KIT, styleBoite, Curseur, LigneMesure, Section } from "../commun";
import { NB } from "./Distillation";
import * as M from "./chutePlaneModele";
import { COL, nbf, useEtroit, useLecture, coordSvg, StyleAnim, DefsAnim, BarreLecture, Chips, Seg } from "./exploAnim";

// ====================================================
//  Partie animée de l'exploration de la simulation 269 (chute libre plane).
//  On saisit le vecteur vitesse initiale v0 (vraie pointe de flèche ; poignée posée sur la hampe) : sa longueur règle v0, sa direction règle l'angle α.
//  « Lancer » : la balle se déplace, ses positions successives sont marquées toutes les 0,2 s ; v, v_x et v_y sont tracés sur la balle ; v_x(t), v_y(t) en dessous.
// ====================================================
const PAS = 0.2;   // intervalle des marques (s) ; échelles : OX origine, KV px par m/s (vecteur v0), KS px par m (trajectoire)
const V0MIN = 5, V0MAX = 25, AMIN = 5, AMAX = 85;
const cl = (x, a, b) => Math.max(a, Math.min(b, x));

export function ChutePlaneExplore({ ex, setEx }) {
  const svgRef = useRef(null), drag = useRef(null), boite = useRef(null);
  const etroit = useEtroit(boite), [ouvert, setOuvert] = useState(false);
  const { v0, a, m } = ex;
  const tV = M.tVol(v0, a), L = useLecture(tV, false);
  const Fm = etroit ? 1.35 : 1, W = etroit ? 460 : 700, H = etroit ? 304 : 360, GY = H - (etroit ? 52 : 44), OX = etroit ? 34 : 50, KV = etroit ? 5 : 7, KS = etroit ? 6 : 9, KW = etroit ? 4 : 6;
  const rad = a * Math.PI / 180, lv = v0 * KV, tipX = OX + lv * Math.cos(rad), tipY = GY - lv * Math.sin(rad);
  const gripLarg = etroit ? 64 : 46, gripH = etroit ? 44 : 32;
  const court = lv < gripLarg + 40;
  const gx = court ? tipX + 30 * Math.cos(rad) + gripLarg / 2 * 0.3 : OX + 0.5 * (tipX - OX), gy = court ? tipY - 30 * Math.sin(rad) : GY - 0.5 * (GY - tipY);
  const px = t => OX + M.pos(v0, a, t).x * KS, py = t => GY - M.pos(v0, a, t).y * KS;
  const t = Math.min(L.t, tV), p = M.pos(v0, a, t), bx = px(t), by = py(t), vxx = M.v0x(v0, a), vyy = M.vy(v0, a, t), vn = Math.hypot(vxx, vyy);
  const jeu = L.t > 0 || L.joue;
  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); const { X, Y } = coordSvg(svgRef.current, ev); drag.current = { dx: X - tipX, dy: Y - tipY }; L.setTouche(true); };
  const bouge = ev => {
    const d = drag.current; if (!d) return; const { X, Y } = coordSvg(svgRef.current, ev), ux = X - d.dx - OX, uy = GY - (Y - d.dy);
    const vn2 = cl(Math.round(Math.hypot(ux, uy) / KV), V0MIN, V0MAX), an = cl(Math.round(Math.atan2(uy, ux) * 180 / Math.PI), AMIN, AMAX);
    L.reset(); setEx(s => ({ ...s, v0: vn2, a: an }));
  };
  const fait = ev => { drag.current = null; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => {
    const k = ev.key; if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) return; ev.preventDefault(); L.setTouche(true); L.reset();
    setEx(o => k === 'ArrowUp' ? { ...o, v0: cl(o.v0 + 1, V0MIN, V0MAX) } : k === 'ArrowDown' ? { ...o, v0: cl(o.v0 - 1, V0MIN, V0MAX) } : { ...o, a: cl(o.a + (k === 'ArrowRight' ? 1 : -1), AMIN, AMAX) });
  };
  const change = (cle, val) => { L.reset(); setEx(s => ({ ...s, [cle]: val })); };
  const ptsPrev = Array.from({ length: 41 }, (_, i) => `${px(tV * i / 40).toFixed(1)},${py(tV * i / 40).toFixed(1)}`).join(' ');
  const nMarq = Math.floor(t / PAS + 1e-9);
  const tS = M.tSommet(v0, a), H0 = M.hMax(v0, a), D = M.portee(v0, a);
  const aria = `Scène animée : un projectile de ${m} kilogramme${m > 1 ? 's' : ''} lancé du sol avec une vitesse initiale de ${v0} mètres par seconde, inclinée de ${a} degrés. Sommet après ${nbf(tS, 2)} secondes à ${nbf(H0, 1)} mètres de hauteur, portée ${nbf(D, 1)} mètres. À l'instant ${nbf(t, 2)} secondes : composante horizontale ${nbf(vxx, 1)}, composante verticale ${nbf(vyy, 1)} mètres par seconde.`;
  const message = !L.touche && !jeu ? 'Saisis la poignée sur la flèche bleue : sa longueur règle la vitesse initiale v₀, sa direction règle l’angle α. Puis « Lancer ».'
    : !jeu ? 'La trajectoire en pointillés se prévoit avant le lancer : appuie sur « Lancer » pour voir le projectile et ses vecteurs vitesse.'
      : t >= tS - 1e-9 && t < tS + 0.06 ? 'Au sommet : v_y = 0, mais v_x n’est pas nul : la vitesse est horizontale.' : L.fin ? `Retombé au sol à ${nbf(D, 1)} m du départ, après ${nbf(tV, 2)} s.` : `v_x = ${nbf(vxx, 1)} m/s (constante) ; v_y = ${nbf(vyy, 1)} m/s ${vyy > 0 ? '(il monte)' : '(il descend)'}.`;
  // graphique vitesses
  const GW = W, GH = etroit ? 250 : 180, gx0 = etroit ? 60 : 74, gx1 = GW - 20, gy0 = 18, gy1 = GH - 36, vm = Math.max(V0MAX, v0), gX = tt => gx0 + (tt / tV) * (gx1 - gx0), gY = vv => gy1 - ((vv + vm) / (2 * vm)) * (gy1 - gy0);
  const nbt = Math.max(1, Math.round(tV / 0.5)), tm = Math.min(L.t, tV);
  const sv = Array.from({ length: 41 }, (_, i) => tV * i / 40).filter(tt => tt <= tm + 1e-9);

  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Masse du projectile" valeur={m} onChange={v2 => setEx(s => ({ ...s, m: v2 }))} options={[[0.1, '0,1 kg'], [1, '1 kg'], [5, '5 kg']]}/>
      </div>
      <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        <DefsAnim/>
        <rect width={W} height={H} fill="#f8fafc"/><rect x="0" y="0" width={W} height={GY} fill="#eef2ff" opacity="0.6"/>
        <rect x="0" y={GY} width={W} height={H - GY} fill="#e2e8f0"/><line x1="0" y1={GY} x2={W} y2={GY} stroke="#475569" strokeWidth="3"/>
        {Array.from({ length: Math.floor((W - OX) / KS / 5) + 1 }, (_, k) => k * 5).map(k => <g key={k}><line x1={OX + k * KS} y1={GY} x2={OX + k * KS} y2={GY + 9} stroke="#475569" strokeWidth="2"/>{k % 10 === 0 && <text x={OX + k * KS} y={GY + 12 + 15 * Fm * 0.85} textAnchor="middle" fontSize={13 * Fm * 0.95} fontWeight="700" fill="#475569">{k} m</text>}</g>)}
        {/* trajectoire prévue (pointillés), sommet et portée */}
        <polyline points={ptsPrev} fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="8 7"/>
        <circle cx={px(tS)} cy={py(tS)} r="6" fill="#fff" stroke="#b91c1c" strokeWidth="3"/><text x={px(tS)} y={py(tS) - 12} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill="#b91c1c" stroke="#fff" strokeWidth="4" paintOrder="stroke">S : H = {nbf(H0, 1)} m</text>
        <circle cx={px(tV)} cy={GY} r="6" fill="#fff" stroke="#475569" strokeWidth="3"/><text x={Math.min(px(tV), W - 90 * Fm * 0.6)} y={GY - 12} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill="#334155" stroke="#fff" strokeWidth="4" paintOrder="stroke">D = {nbf(D, 1)} m</text>
        {/* positions successives toutes les 0,2 s */}
        {Array.from({ length: nMarq }, (_, i) => <circle key={i} cx={px((i + 1) * PAS)} cy={py((i + 1) * PAS)} r="4.5" fill="#0369a1"/>)}
        {/* vecteurs sur le projectile */}
        {jeu && <g>
          <line x1={bx} y1={by} x2={bx + vxx * KW} y2={by} stroke="#15803d" strokeWidth="4" strokeDasharray="7 5"/>
          <line x1={bx} y1={by} x2={bx} y2={by - vyy * KW} stroke="#c2410c" strokeWidth="4" strokeDasharray="7 5"/>
          {vn > 0.4 && <g><line x1={bx} y1={by} x2={bx + vxx * KW - 14 * vxx / vn} y2={by - vyy * KW + 14 * vyy / vn} stroke="#0b4f94" strokeWidth="6"/><polygon points={`${bx + vxx * KW},${by - vyy * KW} ${bx + vxx * KW - 18 * vxx / vn - 7 * vyy / vn},${by - vyy * KW + 18 * vyy / vn - 7 * vxx / vn} ${bx + vxx * KW - 18 * vxx / vn + 7 * vyy / vn},${by - vyy * KW + 18 * vyy / vn + 7 * vxx / vn}`} fill="#0b4f94"/></g>}
        </g>}
        <circle cx={jeu ? bx : OX} cy={jeu ? by : GY} r={m < 1 ? 7 : m > 1 ? 12 : 9.5} fill="#dbeafe" stroke="#0b4f94" strokeWidth="3.5" filter="url(#xa-ombre)"/>
        {/* accélération g (repère fixe) */}
        <g><line x1={W - 40} y1={30} x2={W - 40} y2={30 + 4 * M.G - 12} stroke="#6d28d9" strokeWidth="5"/><polygon points={`${W - 40},${30 + 4 * M.G + 2} ${W - 48},${30 + 4 * M.G - 12} ${W - 32},${30 + 4 * M.G - 12}`} fill="#6d28d9"/>
          <text x={W - 56} y={52} textAnchor="end" fontSize={15 * Fm} fontWeight="800" fill="#6d28d9">a = g</text><text x={W - 56} y={52 + 17 * Fm} textAnchor="end" fontSize={13 * Fm} fontWeight="700" fill="#6d28d9">(0 ; −g)</text></g>
        {/* vecteur vitesse initiale : vraie pointe, poignée sur la hampe */}
        <line x1={OX} y1={GY} x2={tipX - 16 * Math.cos(rad)} y2={tipY + 16 * Math.sin(rad)} stroke="#0b4f94" strokeWidth="7"/>
        <polygon points={`${tipX},${tipY} ${tipX - 20 * Math.cos(rad) + 8 * Math.sin(rad)},${tipY + 20 * Math.sin(rad) + 8 * Math.cos(rad)} ${tipX - 20 * Math.cos(rad) - 8 * Math.sin(rad)},${tipY + 20 * Math.sin(rad) - 8 * Math.cos(rad)}`} fill="#0b4f94"/>
        <path d={`M ${OX + 56} ${GY} A 56 56 0 0 0 ${OX + 56 * Math.cos(rad)} ${GY - 56 * Math.sin(rad)}`} fill="none" stroke="#475569" strokeWidth="2.5"/>
        
        <text x={12} y={24 * Fm} fontSize={16 * Fm} fontWeight="800" fill="#0b4f94">v₀ = {v0} m/s</text><text x={12} y={24 * Fm + 19 * Fm} fontSize={16 * Fm} fontWeight="800" fill="#334155">α = {a}°</text>
        <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Vecteur vitesse initiale : flèches haut et bas pour la valeur, gauche et droite pour l’angle" aria-valuemin={V0MIN} aria-valuemax={V0MAX} aria-valuenow={v0} aria-valuetext={`${v0} mètres par seconde, angle ${a} degrés`} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <line x1={OX} y1={GY} x2={tipX} y2={tipY} stroke="transparent" strokeWidth={etroit ? 70 : 40} strokeLinecap="round"/>
          <rect className="xa-anneau" x={gx - gripLarg / 2} y={gy - gripH / 2} width={gripLarg} height={gripH} rx={gripH / 2} fill="#fff" stroke="#0b4f94" strokeWidth="3.5"/>
          <g stroke="#0b4f94" strokeWidth="3" strokeLinecap="round" fill="none"><line x1={gx - 9} y1={gy} x2={gx + 9} y2={gy}/><line x1={gx} y1={gy - 9} x2={gx} y2={gy + 9}/></g>
          {!L.touche && <rect className="xa-pulse" x={gx - gripLarg / 2 - 3} y={gy - gripH / 2 - 3} width={gripLarg + 6} height={gripH + 6} rx={gripH / 2 + 3} fill="none" stroke="#0b4f94" strokeWidth="3"/>}
        </g>
      </svg>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={tV} libelle="▶ Lancer"/>
      <svg className="xa-svg" viewBox={`0 0 ${GW} ${GH}`} role="img" aria-label="Graphique des composantes horizontale et verticale de la vitesse en fonction du temps" style={{ marginTop: 10 }}>
        <rect width={GW} height={GH} fill="#fff"/>
        <line x1={gx0} y1={gY(0)} x2={gx1} y2={gY(0)} stroke="#475569" strokeWidth="2.5"/><line x1={gx0} y1={gy0} x2={gx0} y2={gy1} stroke="#475569" strokeWidth="2.5"/>
        {Array.from({ length: nbt + 1 }, (_, i) => i * 0.5).filter(tt => tt <= tV + 1e-9).map(tt => <g key={tt}><line x1={gX(tt)} y1={gY(0) - 5} x2={gX(tt)} y2={gY(0) + 5} stroke="#475569" strokeWidth="2"/>{Number.isInteger(tt) && <text x={gX(tt)} y={gy1 + 10 + 14 * Fm * 0.75} textAnchor="middle" fontSize={13 * Fm * 0.95} fontWeight="700" fill="#475569">{tt} s</text>}</g>)}
        {[-vm, vm].map(vv => <text key={vv} x={gx0 - 8} y={gY(vv) + 5} textAnchor="end" fontSize={13 * Fm * 0.95} fontWeight="700" fill="#475569">{vv}</text>)}
        <text x={gx0 + 8} y={gy0 + 4} fontSize={13 * Fm * 0.95} fontWeight="800" fill="#475569">vitesse (m/s)</text>
        <line x1={gX(0)} y1={gY(vxx)} x2={gX(tV)} y2={gY(vxx)} stroke="#15803d" strokeWidth="2" opacity="0.28"/><line x1={gX(0)} y1={gY(M.v0y(v0, a))} x2={gX(tV)} y2={gY(M.vy(v0, a, tV))} stroke="#c2410c" strokeWidth="2" opacity="0.28"/>
        {jeu && <polyline points={sv.map(tt => `${gX(tt).toFixed(1)},${gY(vxx).toFixed(1)}`).join(' ')} fill="none" stroke="#15803d" strokeWidth="4.5" strokeLinecap="round"/>}
        {jeu && <polyline points={sv.map(tt => `${gX(tt).toFixed(1)},${gY(M.vy(v0, a, tt)).toFixed(1)}`).join(' ')} fill="none" stroke="#c2410c" strokeWidth="4.5" strokeLinecap="round"/>}
        <text x={gx1 - 4} y={gY(vxx) - 8} textAnchor="end" fontSize={14 * Fm * 0.95} fontWeight="800" fill="#15803d">v_x</text><text x={gx1 - 4} y={gY(M.vy(v0, a, tV)) + 18 * Fm * 0.9} textAnchor="end" fontSize={14 * Fm * 0.95} fontWeight="800" fill="#c2410c">v_y</text>
        {jeu && <g><circle cx={gX(tm)} cy={gY(vxx)} r="6.5" fill="#15803d" stroke="#fff" strokeWidth="2.5"/><circle cx={gX(tm)} cy={gY(vyy)} r="6.5" fill="#c2410c" stroke="#fff" strokeWidth="2.5"/></g>}
      </svg>
      <Chips items={[['Instant t', `${nbf(t, 2)} s`], ['v_x', `${nbf(vxx, 1)} m/s`, COL.v], ['v_y', `${nbf(vyy, 1)} m/s`, COL.Epp], ['Altitude y', `${nbf(Math.max(p.y, 0), 1)} m`]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
        <LigneMesure nom={`Composante horizontale v₀ₓ = v₀ cos α`} valeur={`${nbf(M.v0x(v0, a), 1)}${NB}m/s`} couleur="#15803d"/>
        <LigneMesure nom={`Composante verticale v₀ᵧ = v₀ sin α`} valeur={`${nbf(M.v0y(v0, a), 1)}${NB}m/s`} couleur="#c2410c"/>
        <LigneMesure nom="Durée de la montée t_S = v₀ᵧ ÷ g" valeur={`${nbf(tS, 2)}${NB}s`}/>
        <LigneMesure nom="Hauteur maximale H = v₀ᵧ² ÷ (2 g)" valeur={`${nbf(H0, 1)}${NB}m`} couleur="#b91c1c"/>
        <LigneMesure nom="Portée D = v₀ₓ × 2 t_S" valeur={`${nbf(D, 1)}${NB}m`} couleur="#334155"/>
        <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>La masse ne change pas la trajectoire : essaie 0,1 kg puis 5 kg. À même v₀, les angles 30° et 60° donnent la même portée ; la portée est maximale à 45°.</div>
      </div>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre="Réglages précis (clavier)" ouvert={ouvert} onBascule={() => setOuvert(o => !o)}>
          <Curseur nom="Vitesse initiale v₀" valeur={v0} onChange={v2 => change('v0', v2)} min={V0MIN} max={V0MAX} pas={1} unite="m/s" decimales={0} couleur="#0b4f94"/>
          <Curseur nom="Angle de tir α" valeur={a} onChange={v2 => change('a', v2)} min={AMIN} max={AMAX} pas={1} unite="°" decimales={0} couleur="#0b4f94"/>
        </Section>
      </div>
    </div>);
}
