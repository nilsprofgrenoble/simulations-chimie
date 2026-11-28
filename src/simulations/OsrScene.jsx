/* eslint-disable react-refresh/only-export-components */
import { useRef } from "react";
import { coordSvg } from "./exploAnim";
import * as M from "./osrModele";

// Scène de la simulation 323 : une masse suspendue à un ressort dont le support est animé verticalement par un moteur (excitateur) ;
// courbe de résonance (amplitude en fonction de la fréquence d'excitation) cliquable.
const BLEU = '#0369a1', ORANGE = '#ea580c', GRIS = '#475569', VERT = '#15803d', VIOLET = '#7c3aed', ROUGE = '#dc2626';
export const COUL = { A: BLEU, fe: ORANGE, res: VIOLET, bande: VERT };
const ECH = 6;            // pixels par centimètre
const YS = 74, YM = 178;  // positions de repos : plaque-support et masse

function zig(x, y1, y2, n = 9, amp = 13) {
  const pts = [[x, y1]]; const h = (y2 - y1 - 14) / n;
  for (let i = 0; i < n; i++) pts.push([x + (i % 2 ? -amp : amp), y1 + 7 + h * (i + 0.5)]);
  pts.push([x, y2]);
  return pts.map(p => p.join(',')).join(' ');
}

// y : déplacement du support (cm, positif vers le haut), x : déplacement de la masse (cm, positif vers le haut).
export function SceneExcitee({ x, y, fe, tour, afficheMoteur = true, aria }) {
  const ys = YS - y * ECH, ym = YM - x * ECH;
  return (
    <svg viewBox="0 0 300 264" role="img" aria-label={aria} style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="osr-masse" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#38bdf8"/><stop offset="1" stopColor="#0369a1"/></linearGradient>
      </defs>
      {afficheMoteur && <g>
        <rect x="196" y="40" width="88" height="62" rx="8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2"/>
        <circle cx="240" cy="71" r="22" fill="#fff" stroke={GRIS} strokeWidth="2.5"/>
        <circle cx={240 + 14 * Math.cos(tour)} cy={71 + 14 * Math.sin(tour)} r="4.5" fill={ORANGE}/>
        <line x1="240" y1="71" x2={240 + 14 * Math.cos(tour)} y2={71 + 14 * Math.sin(tour)} stroke={ORANGE} strokeWidth="2.5"/>
        <text x="240" y="118" textAnchor="middle" fontSize="14" fill={GRIS} fontWeight="700">moteur</text>
        <line x1="196" x2="150" y1="71" y2={ys} stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      </g>}
      <rect x="90" y={ys - 5} width="120" height="10" rx="3" fill="#cbd5e1" stroke={GRIS} strokeWidth="2"/>
      <line x1="60" x2="60" y1="24" y2="250" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 5"/>
      <polyline points={zig(150, ys + 5, ym - 28)} fill="none" stroke="#64748b" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
      <rect x="112" y={ym - 28} width="76" height="40" rx="8" fill="url(#osr-masse)" stroke="#075985" strokeWidth="2"/>
      <text x="150" y={ym - 2} textAnchor="middle" fontSize="20" fontWeight="700" fontStyle="italic" fill="#fff">m</text>
      <line x1="218" x2="290" y1={YM - 8} y2={YM - 8} stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="6 5"/>
      <text x="290" y={YM + 8} textAnchor="end" fontSize="12" fill={GRIS}>repos</text>
      <text x="150" y="258" textAnchor="middle" fontSize="13" fill={GRIS}>excitation : {String(fe.toFixed(2)).replace('.', ',')} Hz</text>
    </svg>);
}

// Courbe de résonance : amplitude du régime permanent en fonction de la fréquence d'excitation. Cliquer ou glisser règle la fréquence.
export function CourbeReso({ f0, Q, fe, onPick, montrer = { marque: true, res: false, bande: false }, etroit = false, aria }) {
  const ref = useRef(null), F = etroit ? 1.25 : 1;
  const X0 = 40, W = 340, Y0 = 232, H = 190, fM = M.REGLAGES.fMax, Am = M.ampMax(f0, Q) * 1.12;
  const tx = f => X0 + W * f / fM, ty = A => Y0 - Math.min(A, Am) * H / Am;
  const pts = []; for (let f = 0.02; f <= fM + 1e-9; f += 0.02) pts.push(`${tx(f).toFixed(1)},${ty(M.amp(f, f0, Q)).toFixed(1)}`);
  const fr = M.fRes(f0, Q), b = M.bande(f0, Q), Ae = M.amp(fe, f0, Q);
  const pick = ev => { if (!onPick || !ref.current) return; const { X } = coordSvg(ref.current, ev); onPick(Math.max(0.2, Math.min(fM, Math.round((fM * (X - X0) / W) / 0.02) * 0.02))); };
  const dn = ev => { ev.currentTarget.setPointerCapture(ev.pointerId); pick(ev); };
  const mv = ev => { if (ev.buttons) pick(ev); };
  const ticks = []; for (let f = 0; f <= fM + 1e-9; f += 1) ticks.push(f);
  return (
    <svg ref={ref} viewBox="0 0 420 270" role="img" aria-label={aria || 'Courbe de résonance : amplitude des oscillations en fonction de la fréquence d’excitation.'} style={{ width: '100%', display: 'block', touchAction: 'none', cursor: onPick ? 'pointer' : 'default' }} onPointerDown={dn} onPointerMove={mv}>
      <rect x={X0} y="28" width={W} height={Y0 - 28} rx="6" fill="#fafcff" stroke="#e2e8f0"/>
      {ticks.map(f => <g key={f}><line x1={tx(f)} x2={tx(f)} y1="28" y2={Y0} stroke="#e2e8f0"/><text x={tx(f)} y={Y0 + 18 * F} textAnchor="middle" fontSize={13 * F} fill={GRIS}>{f}</text></g>)}
      <text x={X0 + W / 2} y={Y0 + 36 * F} textAnchor="middle" fontSize={13 * F} fill={GRIS}>fréquence d’excitation (Hz)</text>
      <text x="6" y="20" fontSize={13 * F} fill={GRIS}>amplitude</text>
      {montrer.bande && <g>
        <line x1={tx(b.f1)} x2={tx(b.f2)} y1={ty(M.ampMax(f0, Q) / Math.SQRT2)} y2={ty(M.ampMax(f0, Q) / Math.SQRT2)} stroke={VERT} strokeWidth="3"/>
        <line x1={tx(b.f1)} x2={tx(b.f1)} y1={ty(M.ampMax(f0, Q) / Math.SQRT2)} y2={Y0} stroke={VERT} strokeWidth="1.6" strokeDasharray="4 3"/>
        <line x1={tx(b.f2)} x2={tx(b.f2)} y1={ty(M.ampMax(f0, Q) / Math.SQRT2)} y2={Y0} stroke={VERT} strokeWidth="1.6" strokeDasharray="4 3"/>
        <text x={(tx(b.f1) + tx(b.f2)) / 2} y={ty(M.ampMax(f0, Q) / Math.SQRT2) + 18 * F} textAnchor="middle" fontSize={14 * F} fontWeight="700" fill={VERT}>Δf</text>
      </g>}
      <polyline points={pts.join(' ')} fill="none" stroke={BLEU} strokeWidth="3.4" strokeLinejoin="round"/>
      {montrer.res && <g><line x1={tx(fr)} x2={tx(fr)} y1={ty(M.ampMax(f0, Q))} y2={Y0} stroke={VIOLET} strokeWidth="1.8" strokeDasharray="5 4"/><text x={tx(fr) + 6} y={ty(M.ampMax(f0, Q)) - 4} fontSize={13 * F} fontWeight="700" fill={VIOLET}>f<tspan fontSize={10 * F} dy="3">res</tspan></text></g>}
      {montrer.marque && <g><line x1={tx(fe)} x2={tx(fe)} y1={ty(Ae)} y2={Y0} stroke={ORANGE} strokeWidth="1.6" strokeDasharray="4 3"/><circle cx={tx(fe)} cy={ty(Ae)} r="7" fill={ORANGE} stroke="#fff" strokeWidth="2.5"/></g>}
    </svg>);
}

// Jauge d'amplitude (défi 1) : barre simple, sans échelle graduée ni valeur du maximum.
export function JaugeAmplitude({ A, aria }) {
  const l = Math.min(1, A / 12) * 200;
  return (
    <svg viewBox="0 0 260 44" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 360, display: 'block' }}>
      <text x="0" y="14" fontSize="13" fill={GRIS}>amplitude permanente</text>
      <rect x="0" y="20" width="204" height="18" rx="6" fill="#f1f5f9" stroke="#e2e8f0"/><rect x="1" y="21" width={l} height="16" rx="5" fill={BLEU}/>
      <text x="212" y="34" fontSize="14" fontWeight="700" fill="#0f172a">{String(A.toFixed(1)).replace('.', ',')} cm</text>
    </svg>);
}
