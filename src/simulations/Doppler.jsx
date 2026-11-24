import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as D from "./dopplerModele";

const SIM_ID = 114, SIM_ID_TG = 116;
declarerDefis(SIM_ID_TG, [['emetteur', 'Quelle est la vitesse du chariot émetteur ?'], ['echo', 'Quelle est la vitesse de la plaque qui renvoie l’onde ?']]);
declarerDefis(SIM_ID, [['emetteur', 'Quelle est la vitesse du chariot émetteur ?'], ['echo', 'Quelle est la vitesse de la plaque qui renvoie l’onde ?']]);

// ====================================================
//  SIM 114 — EFFET DOPPLER : DU DÉCALAGE DE FRÉQUENCE À LA VITESSE (TSTL, thème Ondes) ; réutilisée par le parcours TG (sim 116)
//  Deux scènes : (1) fronts d’onde d’un émetteur mobile (vue schématique, vitesse exagérée) ; (2) mesure sur un rail : spectre, curseur, décalage, vitesse.
//  Montage 1 : émetteur ultrasonore sur un chariot, récepteur fixe (programme). Montage 2 : plaque mobile qui renvoie l’onde, émetteur et récepteur fixes (pour aller plus loin).
//  Les situations de cette simulation sont originales (rail de laboratoire, plaque réfléchissante).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const tire = t => t[Math.floor(Math.random() * t.length)];
const FINE = ' ';
const milliers = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, FINE);
const hz = n => `${milliers(n)}${NB}Hz`;
const C = D.C_AIR;

// ---------- fronts d’onde (scène 1) ----------
const XC = 2.9, DC = 1.2;   // récepteur C : abscisse (en λ depuis le départ) et distance à la trajectoire
const SC = { W: 600, H: 275, U: 60, X0: 100, Y0: 125, XR: 572, XL: 28 };
// récepteurs (abscisse en λ depuis le départ de la source, distance d à l'axe) : A et B sont SUR l'axe du mouvement, C est au bord
const REC = { A: { x: (SC.W - 46 - SC.X0) / SC.U, d: 0 }, B: { x: (46 - SC.X0) / SC.U, d: 0 }, C: { x: XC, d: DC } };
const XFIN = (450 - SC.X0) / SC.U;   // abscisse où l'animation recommence      // U : pixels par longueur d’onde ; la source part de X0
function FrontsOnde({ beta, anim, relance, annot, posRef, recC }) {
  const ref = useRef(null), t = useRef(0);
  useEffect(() => {
    const cv = ref.current; if (!cv) return undefined;
    t.current = 0;
    const ctx = cv.getContext('2d');
    const dessine = () => {
      const tt = t.current, { W, H, U, X0, Y0, XR, XL } = SC;
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(XL, Y0); ctx.lineTo(XR, Y0); ctx.stroke(); ctx.setLineDash([]);
      const F = D.fronts({ beta, t: tt });
      ctx.lineWidth = 2; ctx.strokeStyle = '#0e7490';
      for (const f of F) { if (f.r * U > 560) continue; ctx.beginPath(); ctx.arc(X0 + f.cx * U, Y0, Math.max(0, f.r * U), 0, 2 * Math.PI); ctx.stroke(); }
      if (posRef) posRef.current = D.positionSource({ beta, t: tt });
      const xs = X0 + D.positionSource({ beta, t: tt }) * U;
      if (annot) {
        const devant = F.map(f => X0 + (f.cx + f.r) * U).filter(x => x > xs + 22 && x < XR - 14).sort((a, b) => a - b);
        const derriere = F.map(f => X0 + (f.cx - f.r) * U).filter(x => x < xs - 22 && x > XL + 14).sort((a, b) => b - a);
        const fleche = (x1, x2, y, txt) => {
          ctx.strokeStyle = '#b45309'; ctx.fillStyle = '#7c2d12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y);
          ctx.moveTo(x1, y - 5); ctx.lineTo(x1, y + 5); ctx.moveTo(x2, y - 5); ctx.lineTo(x2, y + 5); ctx.stroke();
          ctx.font = '700 21px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#f8fafc'; ctx.strokeText(txt, (x1 + x2) / 2, y - 9); ctx.fillText(txt, (x1 + x2) / 2, y - 9);
        };
        if (devant.length > 1) fleche(devant[0], devant[1], Y0 - 62, beta > 0 ? 'λ devant' : 'λ');
        if (derriere.length > 1) fleche(derriere[1], derriere[0], Y0 + 92, beta > 0 ? 'λ derrière' : 'λ');
      }
      ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.arc(xs, Y0, 8, 0, 2 * Math.PI); ctx.fill();
      if (beta > 0) { ctx.strokeStyle = '#b45309'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xs + 12, Y0 - 16); ctx.lineTo(xs + 12 + 70 * beta, Y0 - 16); ctx.stroke(); ctx.beginPath(); ctx.moveTo(xs + 12 + 70 * beta, Y0 - 22); ctx.lineTo(xs + 22 + 70 * beta, Y0 - 16); ctx.lineTo(xs + 12 + 70 * beta, Y0 - 10); ctx.fillStyle = '#b45309'; ctx.fill(); }
      ctx.fillStyle = '#0f172a'; ctx.font = '700 21px sans-serif';
      for (const [x, txt, al, xt] of [[SC.W - 46, 'récepteur A', 'right', SC.W - 6], [46, 'récepteur B', 'left', 6]]) { ctx.fillRect(x - 6, Y0 - 6, 12, 12); ctx.textAlign = al; ctx.fillText(txt, xt, Y0 + 34); }
      if (recC) { ctx.fillStyle = '#0f172a'; ctx.fillRect(X0 + XC * U - 6, Y0 + DC * U - 6, 12, 12); ctx.textAlign = 'left'; ctx.font = '700 21px sans-serif'; ctx.fillText('récepteur C', X0 + XC * U + 12, Y0 + DC * U + 8); }
      ctx.textAlign = 'left'; ctx.font = '21px sans-serif'; ctx.fillStyle = '#475569'; ctx.fillText('vue de dessus (schéma :', 8, 22); ctx.fillText('vitesse de l’émetteur exagérée)', 8, 46);
    };
    let raf, dernier = performance.now();
    const boucle = now => {
      t.current += Math.min(0.05, (now - dernier) / 1000); dernier = now;
      if (D.positionSource({ beta, t: t.current }) * SC.U + SC.X0 > 450 || t.current > 40) t.current = 0;
      dessine(); raf = requestAnimationFrame(boucle);
    };
    if (anim) { raf = requestAnimationFrame(boucle); } else { t.current = beta > 0 ? 3.6 : 3.2; dessine(); }
    return () => raf && cancelAnimationFrame(raf);
  }, [beta, anim, relance, annot, recC]);
  return <canvas ref={ref} width={SC.W} height={SC.H} style={{ width: '100%', borderRadius: 8, display: 'block', background: '#f8fafc' }}
    role="img" aria-label={beta > 0 ? 'Fronts d’onde circulaires émis par une source en mouvement vers la droite : ils sont resserrés devant la source et espacés derrière elle' : 'Fronts d’onde circulaires concentriques émis par une source immobile, régulièrement espacés'}/>;
}

// ---------- schéma du rail (scène 2) ----------
function Rail({ montage, sens, v, fe }) {
  const echo = montage === 'echo', approche = sens === 'approche';
  const R = 134, cartX = echo ? (approche ? 420 : 330) : (approche ? 190 : 330), rx = echo ? 72 : 520;      // textes à 21 : la scène est réduite à ~43 % sur téléphone (≥ 9 px rendus)
  const flecheDir = echo ? (approche ? -1 : 1) : (approche ? 1 : -1);
  return (
    <svg viewBox="0 0 600 182" style={{ width: '100%', display: 'block', background: '#f8fafc', borderRadius: 8 }} role="img"
      aria-label={echo ? 'Schéma du montage : un émetteur et un récepteur fixes à gauche du rail, une plaque réfléchissante sur un chariot mobile' : 'Schéma du montage : un chariot portant l’émetteur ultrasonore roule sur un rail vers ou loin d’un récepteur fixe'}>
      <rect x="20" y={R} width="560" height="6" fill="#94a3b8"/>
      {echo ? <g fontSize="21" fontWeight="700">
        <rect x={rx - 66} y={R - 62} width="132" height="62" rx="5" fill="#1e293b"/><text x={rx} y={R - 36} fill="white" textAnchor="middle">émetteur</text><text x={rx} y={R - 12} fill="white" textAnchor="middle">+ récepteur</text>
        <rect x={cartX - 30} y={R - 18} width="60" height="18" rx="4" fill="#475569"/><circle cx={cartX - 16} cy={R + 4} r="5" fill="#0f172a"/><circle cx={cartX + 16} cy={R + 4} r="5" fill="#0f172a"/>
        <rect x={cartX + 24} y={R - 52} width="7" height="40" fill="#0e7490"/><text x={cartX + 28} y={R - 60} fill="#0e7490" textAnchor="middle">plaque</text>
        <path d={`M${rx + 70} ${R - 56} L${cartX + 18} ${R - 56}`} stroke="#0e7490" strokeWidth="2" strokeDasharray="6 4" fill="none"/><text x={(rx + 70 + cartX) / 2} y={R - 70} fill="#0e7490" textAnchor="middle">émise ({FE})</text>
        <path d={`M${cartX + 18} ${R - 34} L${rx + 70} ${R - 34}`} stroke="#b45309" strokeWidth="2" strokeDasharray="6 4" fill="none"/><text x={(rx + 70 + cartX) / 2} y={R - 10} fill="#b45309" textAnchor="middle">renvoyée ({FR})</text>
      </g> : <g fontSize="21" fontWeight="700">
        <rect x={cartX - 36} y={R - 26} width="72" height="26" rx="5" fill="#475569"/><circle cx={cartX - 20} cy={R + 4} r="5" fill="#0f172a"/><circle cx={cartX + 20} cy={R + 4} r="5" fill="#0f172a"/>
        <rect x={cartX - 14} y={R - 42} width="28" height="16" rx="3" fill="#b45309"/><text x={cartX} y={R - 50} fill="#b45309" textAnchor="middle">émetteur ({FE})</text>
        <rect x={rx - 14} y={R - 38} width="28" height="38" rx="4" fill="#1e293b"/><text x={rx} y={R - 50} fill="#0f172a" textAnchor="middle">récepteur fixe</text>
      </g>}
      {v > 0 && <g><line x1={cartX} y1={R + 38} x2={cartX + flecheDir * 56} y2={R + 38} stroke="#0f172a" strokeWidth="3"/>
        <path d={`M${cartX + flecheDir * 56} ${R + 32} L${cartX + flecheDir * 68} ${R + 38} L${cartX + flecheDir * 56} ${R + 44} Z`} fill="#0f172a"/>
        <text x={cartX} y={R + 32} fontSize="21" fontWeight="700" fill="#0f172a" textAnchor="middle" stroke="#f8fafc" strokeWidth="3" paintOrder="stroke">v</text></g>}
      <text x="8" y="22" fontSize="21" fill="#64748b">schéma non à l’échelle</text>
    </svg>);
}

// ---------- spectre ----------
const SP = { W: 600, H: 232, L: 14, R: 14, T: 30, B: 70 };      // textes à 21 : la scène est réduite à ~43 % sur téléphone (≥ 9 px rendus)
function pasGraduation(etendue) { const c = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]; return c.find(p => etendue / p <= 5) || 1000; }
function Spectre({ fe, fr, T, fen, cur, setCur, aMontrerRef, aMontrerCurseur, aria, nomRef }) {
  const [f0, f1] = fen, xW = SP.W - SP.L - SP.R, yB = SP.H - SP.B, hMax = yB - SP.T - 8;
  const X = f => SP.L + (f - f0) / (f1 - f0) * xW;
  const svgRef = useRef(null), glisse = useRef(false);
  const chemin = (centre, rempli) => {
    const fs = new Set();
    const n = 560; for (let i = 0; i <= n; i++) fs.add(f0 + (f1 - f0) * i / n);
    const fin = 0.04 / T; for (let k = -Math.round(4 / (T * fin)); k <= Math.round(4 / (T * fin)); k++) { const f = centre + k * fin; if (f >= f0 && f <= f1) fs.add(f); }
    const L = [...fs].sort((a, b) => a - b);
    const pts = L.map(f => `${X(f).toFixed(1)},${(yB - hMax * D.intensitePic(f, centre, T)).toFixed(1)}`);
    return rempli ? `M${X(L[0]).toFixed(1)},${yB} L${pts.join(' L')} L${X(L[L.length - 1]).toFixed(1)},${yB} Z` : `M${pts.join(' L')}`;
  };
  const p = pasGraduation(f1 - f0), ticks = [];
  for (let f = Math.ceil(f0 / p) * p; f <= f1 + 1e-9; f += p) if (X(f) > SP.L + 22 && X(f) < SP.W - SP.R - 22) ticks.push(f);
  const versF = e => { const r = svgRef.current.getBoundingClientRect(); return f0 + ((e.clientX - r.left) / r.width * SP.W - SP.L) / xW * (f1 - f0); };
  const separe = Math.abs(fr - fe) > 1e-9;
  return (
    <svg ref={svgRef} viewBox={`0 0 ${SP.W} ${SP.H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}`, touchAction: 'none' }} role="img" aria-label={aria}
      onPointerMove={e => { if (glisse.current) setCur(versF(e)); }} onPointerUp={() => { glisse.current = false; }} onPointerLeave={() => { glisse.current = false; }}>
      <line x1={SP.L} y1={yB} x2={SP.W - SP.R} y2={yB} stroke="#94a3b8" strokeWidth="1.2"/>
      {ticks.map(f => <g key={f}><line x1={X(f)} y1={yB} x2={X(f)} y2={yB + 5} stroke="#475569"/><text x={X(f)} y={yB + 28} fontSize="21" textAnchor="middle" fill="#334155">{milliers(f)}</text></g>)}
      <text x={SP.W - SP.R} y={SP.H - 8} fontSize="21" textAnchor="end" fill="#334155">fréquence (Hz)</text>
      {aMontrerRef && separe && <g><path d={chemin(fe, true)} fill="#e2e8f0" opacity="0.9"/><path d={chemin(fe, false)} fill="none" stroke="#64748b" strokeWidth="1.6" strokeDasharray="5 3"/>
        <text x={X(fe) + (fr > fe ? -8 : 8)} y={SP.T + 14} fontSize="21" fontWeight="700" fill="#475569" textAnchor={fr > fe ? 'end' : 'start'}>émise {FE}</text></g>}
      <path d={chemin(fr, true)} fill="#bae6fd" opacity="0.85"/><path d={chemin(fr, false)} fill="none" stroke="#0369a1" strokeWidth="2"/>
      {separe ? <text x={X(fr) + (fr > fe ? 8 : -8)} y={SP.T + 14} fontSize="21" fontWeight="700" fill="#0369a1" textAnchor={fr > fe ? 'start' : 'end'}>reçue {FR}</text>
        : <text x={X(fe) + 8} y={SP.T + 14} fontSize="21" fontWeight="700" fill="#0369a1">émise = reçue</text>}
      {aMontrerCurseur && cur >= f0 && cur <= f1 && <g style={{ cursor: 'ew-resize' }} onPointerDown={e => { glisse.current = true; e.currentTarget.ownerSVGElement.setPointerCapture?.(e.pointerId); setCur(versF(e)); }}>
        <rect x={X(cur) - 16} y={SP.T - 8} width="32" height={yB - SP.T + 8} fill="transparent"/>
        <line x1={X(cur)} y1={SP.T - 4} x2={X(cur)} y2={yB} stroke="#f59e0b" strokeWidth="2.5"/>
        <polygon points={`${X(cur) - 7},${SP.T - 8} ${X(cur) + 7},${SP.T - 8} ${X(cur)},${SP.T + 3}`} fill="#f59e0b"/></g>}
    </svg>);
}

// ---------- schémas des cartes « À retenir » ----------
const FE = <>f<tspan baselineShift="sub" fontSize="0.75em">e</tspan></>, FR = <>f<tspan baselineShift="sub" fontSize="0.75em">r</tspan></>;
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
function SvgFronts() {
  const beta = 0.3, t = 3.5, U = 26, sx = 190, y0 = 100, F = D.fronts({ beta, t }), xs = D.positionSource({ beta, t });
  const dev = F.map(f => (f.cx - xs + f.r) * U), der = F.map(f => (f.cx - xs - f.r) * U);
  return (
    <svg viewBox="0 0 360 200" role="img" aria-label="Un émetteur se déplace vers la droite : les fronts d’onde sont resserrés devant lui (longueur d’onde plus petite, fréquence reçue plus grande) et espacés derrière lui (longueur d’onde plus grande, fréquence reçue plus petite)" style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block' }}>
      {F.map(f => <circle key={f.k} cx={sx + (f.cx - xs) * U} cy={y0} r={f.r * U} fill="none" stroke={COL.bleu} strokeWidth="2"/>)}
      <circle cx={sx} cy={y0} r="6" fill={COL.orange}/><line x1={sx + 10} y1={y0 - 12} x2={sx + 38} y2={y0 - 12} stroke={COL.orange} strokeWidth="2.5"/><polygon points={`${sx + 38},${y0 - 17} ${sx + 47},${y0 - 12} ${sx + 38},${y0 - 7}`} fill={COL.orange}/>
      <line x1={sx + dev[2]} y1={y0 + 30} x2={sx + dev[1]} y2={y0 + 30} stroke={COL.vert} strokeWidth="2.5"/><text x={(2 * sx + dev[1] + dev[2]) / 2} y={y0 + 46} fontSize="11.5" fontWeight="700" fill={COL.vert} textAnchor="middle">λ devant (petit)</text>
      <line x1={sx + der[1]} y1={y0 + 30} x2={sx + der[0]} y2={y0 + 30} stroke={COL.rouge} strokeWidth="2.5"/><text x={(2 * sx + der[0] + der[1]) / 2} y={y0 + 46} fontSize="11.5" fontWeight="700" fill={COL.rouge} textAnchor="middle">λ derrière (grand)</text>
      <text x="268" y="26" fontSize="12.5" fontWeight="700" fill={COL.vert} textAnchor="middle">devant : f reçue ↑</text><text x="100" y="26" fontSize="12.5" fontWeight="700" fill={COL.rouge} textAnchor="middle">derrière : f reçue ↓</text>
      <text x="180" y="192" fontSize="11.5" fill="#334155" textAnchor="middle">f = c / λ : fronts serrés ⇒ λ petite ⇒ f grande</text>
    </svg>);
}
function SvgEtablir() {
  // deux émissions successives : S1 (front 1, rayon c·Te) et S2 situé v·Te plus loin ; l'écart entre le front 1 et S2 vaut (c − v)·Te
  const x1 = 40, x2 = 100, R0 = 190, y = 92;
  return (
    <svg viewBox="0 0 360 190" role="img" aria-label="Deux émissions successives d’un émetteur qui avance vers la droite : le premier front est un cercle de rayon c fois T_e centré sur la première position ; la seconde position est plus loin de v fois T_e ; la distance entre le second point d’émission et le premier front, devant l’émetteur, vaut c moins v, fois T_e" style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block' }}>
      <line x1="10" y1={y} x2="350" y2={y} stroke="#cbd5e1" strokeDasharray="4 4"/>
      <circle cx={x1} cy={y} r={R0} fill="none" stroke={COL.bleu} strokeWidth="2"/>
      <circle cx={x1} cy={y} r="5" fill={COL.gris}/><circle cx={x2} cy={y} r="6" fill={COL.orange}/>
      <text x={x1} y={y + 22} fontSize="12" fontWeight="700" fill="#334155" textAnchor="middle">S₁</text><text x={x2} y={y + 22} fontSize="12" fontWeight="700" fill={COL.orange} textAnchor="middle">S₂</text>
      <text x="22" y="26" fontSize="11.5" fill={COL.bleu} fontWeight="700">front 1 (émis en S₁)</text>
      <line x1={x1} y1={y - 22} x2={x2} y2={y - 22} stroke={COL.orange} strokeWidth="2.5"/><text x={(x1 + x2) / 2} y={y - 28} fontSize="12" fontWeight="700" fill={COL.orange} textAnchor="middle">v·T<tspan baselineShift="sub" fontSize="0.75em">e</tspan></text>
      <line x1={x2} y1={y + 46} x2={x1 + R0} y2={y + 46} stroke={COL.vert} strokeWidth="2.5"/><text x={(x2 + x1 + R0) / 2} y={y + 64} fontSize="12.5" fontWeight="700" fill={COL.vert} textAnchor="middle">λ<tspan baselineShift="sub" fontSize="0.75em">A</tspan> = (c − v)·T<tspan baselineShift="sub" fontSize="0.75em">e</tspan></text>
      <line x1={x1} y1={y + 82} x2={x1 + R0} y2={y + 82} stroke={COL.gris} strokeWidth="2"/><text x={x1 + R0 / 2} y={y + 98} fontSize="12" fill="#334155" textAnchor="middle">c·T<tspan baselineShift="sub" fontSize="0.75em">e</tspan> (distance parcourue par le front 1)</text>
    </svg>);
}
const picPath = (centre, f0, f1, T, X, yB, h) => { const L = []; for (let i = 0; i <= 200; i++) L.push(f0 + (f1 - f0) * i / 200); const fin = 0.05 / T; for (let k = -80; k <= 80; k++) L.push(centre + k * fin); const S = L.filter(f => f >= f0 && f <= f1).sort((a, b) => a - b); return `M${S.map(f => `${X(f).toFixed(1)},${(yB - h * D.intensitePic(f, centre, T)).toFixed(1)}`).join(' L')}`; };
function SvgDecalage() {
  const X = f => 20 + (f - 0) / 40 * 320, yB = 118;
  return (
    <svg viewBox="0 0 360 170" role="img" aria-label="Spectre : le pic gris est la fréquence émise, le pic bleu plus à droite est la fréquence reçue ; l’écart entre les deux est le décalage delta f, proportionnel à la vitesse" style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block' }}>
      <line x1="14" y1={yB} x2="346" y2={yB} stroke="#94a3b8" strokeWidth="1.2"/>
      <path d={picPath(12, 0, 40, 1 / 1.6, X, yB, 70)} fill="none" stroke={COL.gris} strokeWidth="2" strokeDasharray="5 3"/><path d={picPath(24, 0, 40, 1 / 1.6, X, yB, 70)} fill="none" stroke={COL.bleu} strokeWidth="2.4"/>
      <text x={X(12)} y="38" fontSize="13" fontWeight="700" fill={COL.gris} textAnchor="middle">{FE}</text><text x={X(24)} y="38" fontSize="13" fontWeight="700" fill={COL.bleu} textAnchor="middle">{FR}</text>
      <line x1={X(12)} y1="52" x2={X(24)} y2="52" stroke={COL.orange} strokeWidth="2.5"/><polygon points={`${X(24)},47 ${X(24) + 8},52 ${X(24)},57`} fill={COL.orange}/><text x={(X(12) + X(24)) / 2} y="46" fontSize="13" fontWeight="700" fill={COL.orange} textAnchor="middle">δf</text>
      <text x="180" y="146" fontSize="12" fill="#334155" textAnchor="middle">δf = |{FR} − {FE}| ; si v ≪ c : δf = {FE} × v / c</text>
      <text x="180" y="163" fontSize="12" fontWeight="700" fill="#0f172a" textAnchor="middle">v = c × δf / {FE}</text>
    </svg>);
}
function SvgSens() {
  const X = f => 20 + f / 40 * 320;
  const panneau = (y, titre, centre, coul) => (<g>
    <line x1="14" y1={y + 56} x2="346" y2={y + 56} stroke="#94a3b8" strokeWidth="1.2"/>
    <path d={picPath(20, 0, 40, 1 / 1.6, X, y + 56, 40)} fill="none" stroke={COL.gris} strokeWidth="2" strokeDasharray="5 3"/><path d={picPath(centre, 0, 40, 1 / 1.6, X, y + 56, 40)} fill="none" stroke={coul} strokeWidth="2.4"/>
    <text x="18" y={y + 12} fontSize="12" fontWeight="700" fill="#0f172a">{titre}</text></g>);
  return (
    <svg viewBox="0 0 360 190" role="img" aria-label="Deux spectres : quand l’émetteur se rapproche, le pic se décale vers les fréquences plus grandes ; quand il s’éloigne, vers les fréquences plus petites ; le décalage est à peu près le même dans les deux cas" style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block' }}>
      {panneau(0, <>se rapproche : {FR} &gt; {FE} (pic à droite)</>, 29, COL.vert)}{panneau(94, <>s’éloigne : {FR} &lt; {FE} (pic à gauche)</>, 11, COL.rouge)}
      <text x={X(20)} y="182" fontSize="11.5" fill={COL.gris} textAnchor="middle">{FE} (gris)</text>
    </svg>);
}
function SvgResolution() {
  const X = (f, n) => 12 + (f + 5) / 10 * 156 + n * 176, yB = 96;
  const bloc = (n, T, titre, sous, coul) => (<g>
    <line x1={X(-5, n)} y1={yB} x2={X(5, n)} y2={yB} stroke="#94a3b8" strokeWidth="1.2"/>
    <path d={picPath(-1.2, -5, 5, T, f => X(f, n), yB, 60)} fill="none" stroke={COL.gris} strokeWidth="2" strokeDasharray="5 3"/><path d={picPath(1.2, -5, 5, T, f => X(f, n), yB, 60)} fill="none" stroke={coul} strokeWidth="2.4"/>
    <text x={X(0, n)} y="22" fontSize="12" fontWeight="700" fill="#0f172a" textAnchor="middle">{titre}</text><text x={X(0, n)} y="114" fontSize="11.5" fill="#334155" textAnchor="middle">{sous}</text></g>);
  return (
    <svg viewBox="0 0 360 150" role="img" aria-label="Deux enregistrements du même décalage de 2,4 hertz : avec une durée de 0,5 seconde les deux pics sont larges et se chevauchent, avec une durée de 2 secondes ils sont fins et bien séparés" style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block' }}>
      {bloc(0, 0.5, 'durée 0,5 s', 'largeur 1/T = 2 Hz : confondus', COL.rouge)}{bloc(1, 2, 'durée 2 s', 'largeur 1/T = 0,5 Hz : séparés', COL.vert)}
      <text x="180" y="140" fontSize="11.5" fontWeight="700" fill="#0f172a" textAnchor="middle">séparer deux pics : δf supérieur à 1/T</text>
    </svg>);
}
function SvgChaine() {
  const boite = (x, t1, t2, c) => (<g><rect x={x} y="22" width="76" height="52" rx="8" fill="white" stroke={c} strokeWidth="2"/><text x={x + 38} y="44" fontSize="11.5" fontWeight="700" fill="#0f172a" textAnchor="middle">{t1}</text><text x={x + 38} y="60" fontSize="11" fill="#334155" textAnchor="middle">{t2}</text></g>);
  const fl = x => <g><line x1={x} y1="48" x2={x + 14} y2="48" stroke="#334155" strokeWidth="2"/><polygon points={`${x + 14},43 ${x + 21},48 ${x + 14},53`} fill="#334155"/></g>;
  return (
    <svg viewBox="0 0 360 110" role="img" aria-label="Chaîne de mesure : l’émetteur envoie une onde de fréquence connue, le mouvement la décale, le spectre donne f_r, on en tire le décalage puis la vitesse" style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block' }}>
      {boite(4, 'émetteur', <>{FE} connue</>, COL.bleu)}{fl(82)}{boite(104, 'mouvement', <>{FR} ≠ {FE}</>, COL.orange)}{fl(182)}{boite(204, 'spectre', 'on lit f_r', COL.bleu)}{fl(282)}
      <text x="322" y="44" fontSize="11.5" fontWeight="700" fill={COL.vert} textAnchor="middle">δf</text><text x="322" y="60" fontSize="11.5" fontWeight="700" fill={COL.vert} textAnchor="middle">puis v</text>
      <text x="180" y="98" fontSize="12" fill="#334155" textAnchor="middle">v = c × δf / {FE}, valable si v ≪ c</text>
    </svg>);
}

const BASE_MES = { montage: 'emetteur', sens: 'approche', v: 0.5, fe: 40000, T: 1 };
const REPOS_MES = { ...BASE_MES, v: 0 };
const nouveauDefiDonnees = type => ({ type, v: tire([0.20, 0.30, 0.40, 0.60, 0.80, 1.00, 1.20]), fe: type === 'echo' ? 40000 : tire(D.F_EMETTEURS), sens: tire(['approche', 'eloigne']) });

export const SimulationDopplerTG = props => <SimulationDoppler {...props} tg/>;

export function SimulationDoppler({ naviguer, tg = false }) {
  const SIM = tg ? SIM_ID_TG : SIM_ID, CLE_GUIDE = tg ? 'doppler-tg-guide-v1' : 'doppler-guide-v1';
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviEm, noterEm] = useCompteurDefi(), [suiviEc, noterEc] = useCompteurDefi();
  const VIDE = { etape: 0, reps: {}, verifs: {}, reussies: {} };
  const [g1, setG1] = useEtatPersistant(CLE_GUIDE, VIDE), [g2, setG2] = useEtatPersistant(CLE_GUIDE.replace('-v1', '-p2'), VIDE), [g3, setG3] = useEtatPersistant(CLE_GUIDE.replace('-v1', '-p3'), VIDE);
  const [parcBrut, setParc] = useEtatPersistant(CLE_GUIDE.replace('-guide-v1', '-parcours-choix'), 1);
  const parc = [1, 2, 3].includes(parcBrut) ? parcBrut : 1;
  const guide = [g1, g2, g3][parc - 1], setGuide = [setG1, setG2, setG3][parc - 1];
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('emetteur');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [scene, setScene] = useState('fronts');
  const [beta, setBeta] = useState(0), [anim, setAnim] = useState(() => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; } }), [relance, setRelance] = useState(0);
  const [mes, setMes] = useState(REPOS_MES), [cur, setCurBrut] = useState(40000), [zoomC, setZoomC] = useState(null);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  // ---------- écoute (Web Audio) : deux notes alternées, fréquence entendue selon la position ----------
  const [ecoute, setEcoute] = useState(null);
  const ratioEcoute = (pos, bt) => pos === 'A' ? 1 / (1 - bt) : pos === 'B' ? 1 / (1 + bt) : 1;
  const refAudio = useRef({ ratio: 1, beta: 0, pos: 0 });
  const posRef = useRef(0);
  const NOTES = [440, 554];
  useEffect(() => {
    if (!ecoute) return undefined;
    let ctx, osc, gain, minuterie, k = 0;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC();
      osc = ctx.createOscillator(); gain = ctx.createGain(); osc.type = 'triangle'; gain.gain.value = 0.12;
      osc.connect(gain); gain.connect(ctx.destination); osc.start();
      let dernier = 0;
      const joue = () => {
        const now = performance.now(); if (now - dernier > 650) { k++; dernier = now; }
        const bt = refAudio.current.beta, xs = posRef.current, rec = REC[ecoute];
        let r = 1, vol = 1;
        if (rec) { const e = D.ecouteAuPassage({ beta: bt, xs, xr: rec.x, d: rec.d }); r = e.rapport; vol = Math.min(1, 1.2 / Math.max(e.distance, 0.2)); }   // volume ~ 1 / distance à l'émission
        const fondu = bt > 0 ? Math.max(0, Math.min(1, xs / 0.5, (XFIN - xs) / 0.5)) : 1;   // son coupé en douceur quand l'animation recommence
        osc.frequency.setTargetAtTime(NOTES[k % 2] * r, ctx.currentTime, 0.02);
        gain.gain.setTargetAtTime(0.14 * vol * fondu, ctx.currentTime, 0.03);
      };
      joue(); minuterie = setInterval(joue, 40);
    } catch { setEcoute(null); }
    return () => { clearInterval(minuterie); try { osc && osc.stop(); ctx && ctx.close(); } catch { /* déjà arrêté */ } };
  }, [ecoute]);

  const setM = f => setMes(m => ({ ...m, ...f }));
  const dd = enDefi && defi ? defi : null;

  // ════════════════ PARCOURS : étapes (les identifiants servent à faire apparaître les éléments au fur et à mesure) ════════════════
  const ORDRE_PARC = tg
    ? [['fixe', 'mobile', 'devant', 'derriere', 'frequence', 'etablir1', 'etablir2', 'rapport', 'etablir3', 'bilan1'],
      ['rail', 'deplace', 'decale', 'pointer', 'decalage', 'vitesse', 'validite', 'em', 'bilan2'],
      ['eloigne', 'sensinverse', 'duree', 'resolution', 'separer', 'bravo']]
    : [['fixe', 'mobile', 'devant', 'derriere', 'frequence', 'rapport', 'bilan1'],
      ['rail', 'deplace', 'decale', 'pointer', 'decalage', 'vitesse', 'validite', 'bilan2'],
      ['eloigne', 'sensinverse', 'duree', 'resolution', 'separer', 'bravo']];
  const IDS = ORDRE_PARC[parc - 1];
  // étape d’un autre parcours : déjà passée (parcours précédent) ou pas encore atteinte (parcours suivant)
  const iEt = id => { const k = IDS.indexOf(id); if (k >= 0) return k; return ORDRE_PARC.findIndex(o => o.includes(id)) < parc - 1 ? -1 : Infinity; };
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > iEt(id), deja = id => !enGuide || etape >= iEt(id);
  const sceneEff = dd ? 'mesure' : enGuide ? (etape >= iEt('rail') ? 'mesure' : 'fronts') : scene;

  // ---------- grandeurs effectives ----------
  const m = dd ? { montage: dd.type, sens: dd.sens, v: dd.v, fe: dd.fe, T: 1 } : mes;
  const echo = m.montage === 'echo', sg = m.sens === 'approche' ? 1 : -1, fe = m.fe, T = m.T;
  const vEff = enGuide && idE === 'rail' ? 0 : m.v;
  const betaEff = enGuide && idE === 'fixe' ? 0 : beta;
  refAudio.current.ratio = ratioEcoute(ecoute, betaEff); refAudio.current.beta = betaEff;
  useEffect(() => { if (mode !== 'explore' && !(enGuide && etape >= iEt('rapport'))) setEcoute(null); }, [mode, etape]);   // eslint-disable-line react-hooks/exhaustive-deps
  const fr = vEff === 0 ? fe : echo ? D.frequenceEcho(fe, vEff, C, sg) : D.frequenceRecue(fe, vEff, C, sg);
  const W0 = echo ? 400 : 200;
  const fen = zoomC != null ? [zoomC - 30, zoomC + 30] : [fe - W0, fe + W0];
  const setCur = f => setCurBrut(Math.round(Math.max(fen[0], Math.min(fen[1], f))));
  const dfMes = Math.abs(cur - fe);
  const vMes = echo ? D.vitesseDepuisEcho(dfMes, fe, C) : D.vitesseDepuisDecalage(dfMes, fe, C);
  const dfApprox = echo ? D.decalageEchoApprox(fe, vEff, C) : D.decalageApprox(fe, vEff, C), dfExact = echo ? D.decalageEchoExact(fe, vEff, C, sg) : D.decalageExact(fe, vEff, C, sg);
  const inc = dfMes >= 1 ? D.incertitudeVitesse({ df: dfMes, T }) : null;
  const mesBase = mes.montage === 'emetteur' && mes.fe === 40000 && mes.T === 1 && Math.abs(mes.v - 0.5) < 1e-9 && mes.sens === 'approche';
  const frBase = D.frequenceRecue(40000, 0.5, C, 1);
  const pointeOk = mesBase && Math.abs(cur - frBase) <= 1.0;
  const lamAv = D.lambdaAvant(1, betaEff), lamAr = D.lambdaArriere(1, betaEff);
  const dfMesBase = Math.round(cur - 40000);

  const TOUTES = [
    { id: 'fixe', titre: 'Un émetteur immobile', focus: ['scene'],
      texte: <>Un <strong>émetteur ultrasonore</strong> immobile émet une onde sonore de période <em>T</em>. Les cercles sont les <strong>fronts d’onde</strong> (les crêtes de l’onde), vues de dessus. Deux récepteurs fixes, A et B, sont placés de part et d’autre.</>,
      tache: { type: 'qcm', q: 'La distance entre deux fronts d’onde consécutifs est…', options: ['la longueur d’onde λ', 'la période T', 'la célérité c'], bonne: 0,
        expl: 'Deux crêtes consécutives sont séparées d’une longueur d’onde : λ = c × T. Les cercles sont tous centrés sur l’émetteur immobile et régulièrement espacés : A et B reçoivent la même fréquence que celle qui est émise.', indice: 'Une longueur d’onde est la distance parcourue par l’onde pendant une période : c’est aussi la distance entre deux crêtes.' } },
    { id: 'mobile', titre: 'L’émetteur se met en mouvement', focus: ['scene', 'reglages'],
      texte: <>L’émetteur se déplace maintenant vers la droite (vers le récepteur A). Pour que l’effet se voie, on a <strong>exagéré</strong> sa vitesse : un vrai émetteur va beaucoup moins vite que le son. Réglez-la sur <em>v</em> = 0,40{NB}<em>c</em>.</>,
      tache: { type: 'action', ok: Math.abs(beta - 0.4) < 0.026, label: 'Régler v = 0,40 c', faire: () => { setScene('fronts'); setBeta(0.4); setAnim(true); }, consigne: 'Réglez la vitesse de l’émetteur sur 0,40 c' } },
    { id: 'devant', titre: 'Devant l’émetteur', focus: ['scene'],
      texte: <>Chaque front est émis depuis une position différente : l’émetteur « rattrape » en partie les fronts qu’il vient d’émettre devant lui. Regardez l’espacement des cercles <strong>du côté où il va</strong>.</>,
      tache: { type: 'qcm', q: 'Devant l’émetteur, les fronts d’onde sont…', options: ['plus serrés qu’avec un émetteur immobile', 'plus espacés qu’avec un émetteur immobile', 'aussi espacés qu’avec un émetteur immobile'], bonne: 0,
        bloque: Math.abs(beta - 0.4) < 0.026 ? null : 'Rétablissez d’abord v = 0,40 c avec le bouton au-dessus de la scène.',
        expl: 'Entre deux émissions, l’émetteur avance : le front suivant part d’un point plus proche du front précédent. Devant lui, les fronts sont plus serrés : la longueur d’onde reçue est plus petite.', indice: 'Entre deux émissions, l’émetteur avance dans le même sens que l’onde qu’il envoie devant lui.' } },
    { id: 'derriere', titre: 'Derrière l’émetteur', focus: ['scene'],
      texte: <>Regardez maintenant <strong>derrière</strong> l’émetteur, du côté du récepteur B.</>,
      tache: { type: 'qcm', q: 'Derrière l’émetteur, les fronts d’onde sont…', options: ['plus serrés qu’avec un émetteur immobile', 'plus espacés qu’avec un émetteur immobile', 'aussi espacés qu’avec un émetteur immobile'], bonne: 1,
        bloque: Math.abs(beta - 0.4) < 0.026 ? null : 'Rétablissez d’abord v = 0,40 c avec le bouton au-dessus de la scène.',
        expl: 'Derrière lui, l’émetteur s’éloigne des fronts qu’il vient d’émettre : ils sont plus espacés, donc la longueur d’onde reçue est plus grande.', indice: 'C’est l’inverse du cas précédent : l’émetteur s’éloigne de ses fronts.' } },
    { id: 'frequence', titre: 'Longueur d’onde et fréquence', focus: ['mesures'],
      texte: <>La célérité <em>c</em> de l’onde ne dépend que du milieu, pas de l’émetteur : un récepteur reçoit donc des fronts à la célérité <em>c</em>, mais plus ou moins serrés. La fréquence reçue est liée à la longueur d’onde reçue par <em>f</em> = {avecIndices('frac(c|λ)')}.</>,
      tache: { type: 'qcm', q: 'Le récepteur A, placé devant l’émetteur, reçoit une fréquence…', options: ['plus grande que la fréquence émise', 'plus petite que la fréquence émise', 'égale à la fréquence émise'], bonne: 0,
        bloque: Math.abs(beta - 0.4) < 0.026 ? null : 'Rétablissez d’abord v = 0,40 c avec le bouton au-dessus de la scène.',
        expl: 'Devant l’émetteur, λ reçue est plus petite que λ émise. Comme f = frac(c|λ) avec c inchangée, la fréquence reçue est plus grande. Derrière, c’est l’inverse. L’émetteur, lui, n’a pas changé sa fréquence : f_e est toujours la même.', indice: 'f = frac(c|λ) : si λ diminue et que c ne change pas, que fait f ?' } },
    ...(tg ? [
    { id: 'etablir1', titre: 'Établir l’expression : le chemin de l’émetteur', focus: ['scene'],
      texte: <>L’émetteur émet un front d’onde toutes les <em>T</em><sub>e</sub> (période de l’onde émise, <em>f</em><sub>e</sub> = {avecIndices('frac(1|T_e)')}). L’onde se propage à la célérité <em>c</em> ; l’émetteur, lui, se déplace à la vitesse <em>v</em> vers le récepteur A. Cherchons la distance entre deux fronts consécutifs <strong>devant</strong> l’émetteur.</>,
      tache: { type: 'qcm', q: 'Pendant une période T_e, l’émetteur parcourt la distance…', options: ['v × T_e', 'c × T_e', 'v / T_e'], bonne: 0,
        bloque: Math.abs(beta - 0.4) < 0.026 ? null : 'Rétablissez d’abord v = 0,40 c avec le bouton au-dessus de la scène.',
        expl: 'Mouvement uniforme : distance = vitesse × durée = v × T_e. C’est la distance entre les points où deux fronts consécutifs ont été émis.', indice: 'Distance = vitesse × durée, avec la durée égale à T_e.' } },
    { id: 'etablir2', titre: 'Établir l’expression : la longueur d’onde devant', focus: ['scene'],
      texte: <>Quand l’émetteur émet le 2<sup>e</sup> front, le 1<sup>er</sup> front a parcouru <em>c</em> × <em>T</em><sub>e</sub> depuis son point d’émission. Mais le 2<sup>e</sup> front part d’un point situé <em>v</em> × <em>T</em><sub>e</sub> plus loin, <strong>dans le même sens</strong> que l’onde (devant l’émetteur).</>,
      tache: { type: 'qcm', q: 'La distance entre les deux fronts devant l’émetteur (longueur d’onde reçue en A, λ_A) vaut…', options: ['(c − v) × T_e', '(c + v) × T_e', 'c × T_e'], bonne: 0,
        bloque: Math.abs(beta - 0.4) < 0.026 ? null : 'Rétablissez d’abord v = 0,40 c avec le bouton au-dessus de la scène.',
        expl: 'Le 1er front est à c × T_e de la 1re position ; le 2e part de v × T_e plus loin : l’écart vaut c × T_e − v × T_e = (c − v) × T_e. Derrière l’émetteur, il part dans l’autre sens : (c + v) × T_e. Ensuite f = frac(c|λ) donne f_A = frac(c|(c − v) T_e) = frac(f_e|1 − frac(v|c)).', indice: 'Les deux distances sont mesurées dans le même sens : on soustrait. Faites un schéma avec les positions d’émission.' } },
    ] : []),
    { id: 'rapport', titre: 'Le rapport des fréquences', focus: ['mesures'],
      retenirTitre: 'L’émetteur mobile décale la fréquence reçue',
      retenir: <>
        <SvgFronts/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Je fonce vers toi : tes fronts arrivent serrés ⇒ λ petite ⇒ f grande.</strong> Je m’éloigne : fronts étirés ⇒ λ grande ⇒ f petite.</li>
          <li>Relation à garder : <em>f</em> = {avecIndices('frac(c|λ)')}, avec <em>c</em> fixée par le milieu.</li>
          <li><strong>Idée fausse</strong> : l’émetteur change la fréquence qu’il émet. <strong>Vrai</strong> : il émet toujours <em>f</em><sub>e</sub> ; c’est la fréquence <em>reçue</em> qui diffère.</li>
          <li><strong>Idée fausse</strong> : l’onde va plus vite quand l’émetteur avance. <strong>Vrai</strong> : <em>c</em> ne dépend que du milieu.</li>
        </ul></>,
      texte: <>L’émetteur se déplace à <em>v</em> = 0,40{NB}<em>c</em>. Devant lui, la longueur d’onde reçue vaut <em>λ</em><sub>devant</sub> = 0,60{NB}<em>λ</em> (valeur affichée dans « Mesures »). Comme <em>f</em> = {avecIndices('frac(c|λ)')}, calculez le rapport {avecIndices('frac(f_devant|f_e)')} = {avecIndices('frac(λ|λ_devant)')}.</>,
      tache: { type: 'num', q: 'Rapport frac(f_devant|f_e)', unite: '', vrai: 1 / 0.6, tol: 0.03, affiche: v => nbf(v, 2), cs: 3,
        bloque: Math.abs(beta - 0.4) < 0.026 ? null : 'Rétablissez d’abord v = 0,40 c avec le bouton au-dessus de la scène.',
        calcul: () => ['f = frac(c|λ) avec la même célérité c : frac(f_devant|f_e) = frac(λ|λ_devant).', `λ_devant = 0,60 λ, donc frac(f_devant|f_e) = frac(1|0,60) = ${nbf(1 / 0.6, 2)}.`, 'La fréquence reçue devant l’émetteur est environ 1,67 fois la fréquence émise (valeur exagérée : le schéma est exagéré).'],
        pieges: [[0.6, 'Vous avez donné le rapport des longueurs d’onde frac(λ_devant|λ). La fréquence varie en sens inverse de la longueur d’onde : f = frac(c|λ).']],
        expl: 'frac(f_devant|f_e) ≈ 1,67 : la fréquence reçue est bien plus grande que la fréquence émise (ici le schéma exagère la vitesse).', indice: 'f = frac(c|λ), donc frac(f_devant|f_e) = frac(λ|λ_devant). Inversez le rapport des longueurs d’onde.' } },
    ...(tg ? [
    { id: 'etablir3', titre: 'Le décalage Doppler (v très inférieure à c)', focus: ['mesures'],
      texte: <>Vous avez montré que la fréquence reçue devant l’émetteur vaut <em>f</em><sub>A</sub> = {avecIndices('frac(f_e|1 − frac(v|c))')}. Le décalage Doppler est <em>δf</em> = |<em>f</em><sub>A</sub> − <em>f</em><sub>e</sub>|, soit <em>δf</em> = {avecIndices('frac(f_e × v|c − v)')}. On se place dans le cas <em>v</em> ≪ <em>c</em>.</>,
      tache: { type: 'qcm', q: 'Pour v très inférieure à c, le décalage Doppler vaut environ…', options: ['f_e × v / c', 'f_e × c / v', 'f_e × (c − v) / c'], bonne: 0,
        expl: 'Si v ≪ c, alors c − v ≈ c et δf = f_e frac(v|c − v) ≈ frac(f_e × v|c). Le décalage est proportionnel à v, comme le montrera la mesure.', indice: 'Dans δf = frac(f_e × v|c − v), que devient c − v quand v est négligeable devant c ?' } },
    ] : []),
    { id: 'bilan1', titre: 'Le bilan', focus: [],
      texte: <>Vous savez que le mouvement relatif d’un émetteur et d’un récepteur décale la fréquence reçue : plus grande en rapprochement, plus petite en éloignement. Le parcours 2 mesure ce décalage sur un montage de laboratoire pour en déduire une vitesse.</>, tache: null },
    { id: 'rail', titre: 'Un montage de mesure', focus: ['scene'],
      texte: <>Passons à un vrai dispositif de laboratoire. Un <strong>chariot</strong> roule sur un rail et porte un émetteur ultrasonore de fréquence <em>f</em><sub>e</sub> = 40{NB}000{NB}Hz. Un récepteur est fixé au bout du rail. Le spectre du signal reçu est tracé ci-dessous ; le chariot est <strong>arrêté</strong>. La célérité du son dans l’air du laboratoire est <em>c</em> = 340{NB}m/s.</>,
      tache: { type: 'qcm', q: 'Chariot arrêté, le spectre du signal reçu présente un pic à…', options: ['la fréquence émise f_e', 'une fréquence plus grande que f_e', 'une fréquence plus petite que f_e'], bonne: 0,
        expl: 'Sans mouvement relatif entre l’émetteur et le récepteur, la fréquence reçue est égale à la fréquence émise : le pic est à 40 000 Hz.', indice: 'Sans mouvement, il n’y a aucun décalage Doppler.' } },
    { id: 'deplace', titre: 'Le chariot roule', focus: ['scene', 'reglages'],
      texte: <>Mettez le chariot en mouvement, vers le récepteur, à la vitesse <em>v</em> = 0,50{NB}m/s (environ 1,8{NB}km/h, une vitesse de marche lente). Observez le spectre.</>,
      tache: { type: 'action', ok: mesBase, label: 'Régler v = 0,50 m/s', faire: () => { setScene('mesure'); setMes(BASE_MES); setCurBrut(40000); setZoomC(null); }, consigne: 'Réglez la vitesse du chariot sur 0,50 m/s, vers le récepteur' } },
    { id: 'decale', titre: 'Le pic s’est déplacé', focus: ['scene'],
      texte: <>Le pic gris en tirets rappelle la fréquence émise <em>f</em><sub>e</sub> (chariot arrêté). Le pic bleu est la fréquence reçue <em>f</em><sub>r</sub> quand le chariot se rapproche.</>,
      tache: { type: 'qcm', q: 'Quand le chariot se rapproche du récepteur, le pic du spectre se décale vers…', options: ['les fréquences plus grandes', 'les fréquences plus petites', 'il ne se décale pas'], bonne: 0,
        bloque: mesBase ? null : 'Rétablissez d’abord le montage (v = 0,50 m/s vers le récepteur) avec le bouton au-dessus du spectre.',
        expl: 'Quand l’émetteur se rapproche, la fréquence reçue est plus grande que la fréquence émise : f_r > f_e. Le décalage est très petit devant f_e : on le voit à peine sur l’échelle de 400 Hz de large.', indice: 'C’est le même effet que sur les fronts d’onde : devant l’émetteur, f reçue ↑.' } },
    { id: 'pointer', titre: 'Lire la fréquence reçue', focus: ['scene', 'curseur'],
      texte: <>Un <strong>curseur</strong> orange permet de lire la fréquence. Placez-le sur le sommet du pic bleu (glissez-le, ou utilisez les boutons et le bouton « Zoom » pour viser plus précisément). La fréquence lue au curseur s’affiche dans « Mesures ».</>,
      tache: { type: 'action', ok: pointeOk, bloque: mesBase ? null : 'Rétablissez d’abord le montage.', label: 'Placer le curseur sur le pic', faire: () => { setCurBrut(Math.round(frBase)); }, consigne: 'Placez le curseur au sommet du pic bleu (à 1 Hz près)' } },
    { id: 'decalage', titre: 'Calculer le décalage', focus: ['mesures'],
      texte: <>Le curseur indique <em>f</em><sub>r</sub> = {hz(cur)}. La fréquence émise est <em>f</em><sub>e</sub> = 40{FINE}000{NB}Hz. Le <strong>décalage Doppler</strong> est la valeur absolue de la différence : <em>δf</em> = |<em>f</em><sub>r</sub> − <em>f</em><sub>e</sub>|.</>,
      tache: { type: 'num', q: 'Décalage δf', unite: 'Hz', vrai: Math.abs(dfMesBase), tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        bloque: pointeOk ? null : 'Placez d’abord le curseur sur le pic avec le bouton « Rétablir » au-dessus du spectre.',
        calcul: () => [`δf = |f_r − f_e| = |${hz(cur)} − ${hz(40000)}| = ${nbf(Math.abs(dfMesBase), 0)} Hz.`],
        pieges: [[Math.abs(dfMesBase) / 1000, 'Le décalage est à donner en hertz, pas en kilohertz.']],
        expl: `δf ≈ ${nbf(Math.abs(dfMesBase), 0)} Hz : un décalage minuscule devant 40 000 Hz (environ 0,15 %).`, indice: 'δf = f_r − f_e, avec les deux fréquences en hertz.' } },
    { id: 'vitesse', titre: 'En déduire la vitesse', focus: ['mesures'],
      texte: <>Pour un émetteur mobile à la vitesse <em>v</em> très inférieure à <em>c</em>, le décalage vaut <em>δf</em> = {avecIndices('frac(f_e × v|c)')}, d’où :
        <Formule><mi>v</mi><mo>=</mo><mi>c</mi><mo>×</mo><mfrac><mrow><mi>δ</mi><mi>f</mi></mrow><msub><mi>f</mi><mi>e</mi></msub></mfrac></Formule>
        Calculez <em>v</em> avec <em>δf</em> = {nbf(Math.abs(dfMesBase), 0)}{NB}Hz (étape précédente), <em>f</em><sub>e</sub> = 40{FINE}000{NB}Hz et <em>c</em> = 340{NB}m/s.</>,
      tache: { type: 'num', q: 'Vitesse v du chariot', unite: 'm/s', vrai: 340 * Math.abs(dfMesBase) / 40000, tol: 0.04, affiche: v => nbf(v, 2), cs: 2,
        bloque: pointeOk ? null : 'Placez d’abord le curseur sur le pic avec le bouton « Rétablir » au-dessus du spectre.',
        calcul: () => ['Unités : δf et f_e en hertz, c en m/s ; le rapport frac(δf|f_e) est sans unité, v est en m/s.', `v = frac(c × δf|f_e) = frac(340 × ${nbf(Math.abs(dfMesBase), 0)}|40 000) = ${nbf(340 * Math.abs(dfMesBase) / 40000, 3)} m/s.`, 'Hypothèse : v ≪ c (ici frac(v|c) ≈ 1,5 × 10⁻³), la formule approchée est suffisante.'],
        pieges: [[340 * Math.abs(dfMesBase) / 40, 'δf et f_e doivent être dans la même unité : vous avez mis f_e en kilohertz avec δf en hertz.'], [Math.abs(dfMesBase) / 40000, 'Il manque la célérité c : frac(δf|f_e) est le rapport frac(v|c), sans unité.'], [340 * 40000 / Math.abs(dfMesBase), 'Le rapport est inversé : v = frac(c × δf|f_e).']],
        expl: `v ≈ ${nbf(340 * Math.abs(dfMesBase) / 40000, 2)} m/s : on retrouve la vitesse réglée.`, indice: 'v = frac(c × δf|f_e) ; mettez δf et f_e en hertz.' } },
    { id: 'validite', titre: 'Quand la formule est-elle valable ?', focus: ['mesures'],
      texte: <>Ici {avecIndices('frac(v|c)')} = {avecIndices('frac(0,50|340)')} ≈ 1,5 × 10⁻³. La formule <em>δf</em> = {avecIndices('frac(f_e × v|c)')} est une <strong>approximation</strong> ; la formule exacte (non demandée) donne un décalage qui en diffère de moins de 0,2 %.</>,
      tache: { type: 'qcm', q: 'La relation v = frac(c × δf|f_e) suppose que…', options: ['la vitesse v est très petite devant la célérité c', 'le récepteur est plus rapide que l’émetteur', 'la fréquence émise est exactement 40 000 Hz'], bonne: 0,
        expl: 'L’approximation est valable quand v ≪ c : c’est le cas d’un chariot de laboratoire (0,5 m/s contre 340 m/s). Pour une vitesse comparable à celle du son, il faudrait la relation exacte. Le décalage reste proportionnel à f_e : un émetteur de 25 kHz donnerait un décalage 1,6 fois plus petit.', indice: 'On a remplacé un quotient exact par une expression plus simple : elle est bonne quand frac(v|c) est petit.' } },
    ...(tg ? [
    { id: 'em', titre: 'Et pour une onde lumineuse ?', focus: ['mesures'],
      retenirTitre: 'Établir et exploiter le décalage doppler',
      retenir: <>
        <SvgEtablir/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Devant l’émetteur : λ<sub>A</sub> = (c − v) T<sub>e</sub> ⇒ f<sub>A</sub> = {avecIndices('frac(f_e|1 − frac(v|c))')}.</strong> Derrière : λ<sub>B</sub> = (c + v) T<sub>e</sub> ⇒ f<sub>B</sub> = {avecIndices('frac(f_e|1 + frac(v|c))')}.</li>
          <li>Si v ≪ c : <em>δf</em> ≈ {avecIndices('frac(f_e × v|c)')} ; donc {avecIndices('frac(δf|f_e)')} = {avecIndices('frac(v|c)')}, pour une onde sonore comme pour une onde lumineuse.</li>
          <li>Même vitesse, deux ondes : le décalage <strong>relatif</strong> est 10<sup>6</sup> fois plus petit pour la lumière (c plus grande), mais <em>δf</em> est grand parce que <em>f</em><sub>e</sub> est énorme.</li>
        </ul></>,
      texte: <>Le décalage ne dépend que de {avecIndices('frac(v|c)')} : la méthode vaut aussi pour la lumière. Une diode laser (λ = 633{NB}nm, soit <em>f</em><sub>e</sub> = 4,74 × 10¹⁴{NB}Hz) est fixée sur le chariot qui roule à <em>v</em> = 0,50{NB}m/s vers un récepteur. La célérité de la lumière est <em>c</em> = 3,00 × 10⁸{NB}m/s.</>,
      tache: { type: 'num', q: 'Décalage δf du laser', unite: 'MHz', vrai: 4.74e14 * 0.5 / 3e8 / 1e6, tol: 0.04, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['δf = frac(f_e × v|c), avec c = 3,00 × 10⁸ m/s et v ≪ c.', 'δf = frac(4,74 × 10¹⁴ × 0,50|3,00 × 10⁸) = 7,9 × 10⁵ Hz.', 'Conversion : 7,9 × 10⁵ Hz = 0,79 MHz.', 'Comparaison : frac(v|c) = 1,7 × 10⁻⁹ pour la lumière contre 1,5 × 10⁻³ pour le son à la même vitesse.'],
        pieges: [[4.74e14 * 0.5 / 3e8, 'Le résultat est à donner en mégahertz : 1 MHz = 10⁶ Hz.']],
        expl: 'δf ≈ 0,79 MHz, soit un décalage relatif de 1,7 × 10⁻⁹ seulement.', indice: 'δf = frac(f_e × v|c) ; calculez en hertz puis convertissez en MHz.' } },
    ] : []),
    { id: 'bilan2', titre: 'Le bilan', focus: [],
      retenirTitre: 'Mesurer une vitesse par le décalage',
      retenir: <>
        <SvgDecalage/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Décalage : <em>δf</em> = |<em>f</em><sub>r</sub> − <em>f</em><sub>e</sub>| ; il est <strong>proportionnel à v</strong> et à <em>f</em><sub>e</sub>.</li>
          <li>Pour retrouver la vitesse : <em>v</em> = {avecIndices('frac(c × δf|f_e)')}, avec <em>δf</em> et <em>f</em><sub>e</sub> dans la même unité.</li>
          <li>Exemple de la simulation : <em>δf</em> ≈ 59 Hz pour <em>f</em><sub>e</sub> = 40 000 Hz et <em>v</em> = 0,50 m/s, donc {avecIndices('frac(δf|f_e)')} ≈ 1,5 × 10⁻³.</li>
          <li><strong>Hypothèse</strong> : <em>v</em> ≪ <em>c</em>. La formule exacte et la formule approchée diffèrent ici de moins de 0,2 %.</li>
        </ul></>,
      texte: <>Vous savez lire la fréquence reçue, calculer le décalage δf, en déduire la vitesse et dire quand la formule est valable. Le parcours 3 compare les deux sens de déplacement et étudie la durée d’enregistrement et la résolution.</>, tache: null },
    { id: 'eloigne', titre: 'Le chariot s’éloigne', focus: ['reglages', 'scene'],
      texte: <>Rappel du parcours 2 : pour v = 0,50{NB}m/s vers le récepteur, le décalage vaut δf ≈ 59{NB}Hz. Faites maintenant rouler le chariot en sens inverse, à la même vitesse : il <strong>s’éloigne</strong> du récepteur. Le bouton de sens apparaît dans les réglages.</>,
      tache: { type: 'action', ok: mes.montage === 'emetteur' && mes.fe === 40000 && mes.T === 1 && Math.abs(mes.v - 0.5) < 1e-9 && mes.sens === 'eloigne', label: 'Chariot qui s’éloigne', faire: () => { setScene('mesure'); setMes({ ...BASE_MES, sens: 'eloigne' }); setZoomC(null); }, consigne: 'Choisissez « s’éloigne du récepteur »' } },
    { id: 'sensinverse', titre: 'Comparer les deux sens', focus: ['scene'],
      texte: <>Le pic bleu est maintenant du côté des fréquences plus petites que <em>f</em><sub>e</sub>. Comparez le décalage avec celui du chariot qui se rapprochait (même vitesse).</>,
      tache: { type: 'qcm', q: 'À même vitesse, quand le chariot s’éloigne, le décalage δf est…', options: ['presque identique en valeur absolue, mais f_r < f_e', 'deux fois plus grand', 'nul'], bonne: 0,
        bloque: mes.montage === 'emetteur' && mes.fe === 40000 && mes.T === 1 && Math.abs(mes.v - 0.5) < 1e-9 && mes.sens === 'eloigne' ? null : 'Rétablissez d’abord le chariot qui s’éloigne avec le bouton au-dessus du spectre.',
        expl: 'Pour v ≪ c, le décalage est le même dans les deux sens (≈ 59 Hz) ; seul le côté change : f_r > f_e quand l’émetteur se rapproche, f_r < f_e quand il s’éloigne. C’est pourquoi on définit δf comme une valeur absolue.', indice: 'δf = |f_r − f_e| ne dépend que de v (et de f_e, c) tant que v ≪ c ; le signe de f_r − f_e dépend du sens.' } },
    { id: 'duree', titre: 'Une vitesse très petite', focus: ['reglages', 'scene'],
      retenirTitre: 'Les deux sens et le signe du décalage',
      retenir: <>
        <SvgSens/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Se rapproche ⇒ f_r &gt; f_e ; s’éloigne ⇒ f_r &lt; f_e.</strong> À même vitesse, le décalage est presque le même dans les deux sens.</li>
          <li>On définit donc <em>δf</em> = |<em>f</em><sub>r</sub> − <em>f</em><sub>e</sub>| (valeur absolue) ; le signe de <em>f</em><sub>r</sub> − <em>f</em><sub>e</sub> donne le sens du mouvement.</li>
        </ul></>,
      texte: <>Faisons rouler le chariot très lentement : <em>v</em> = 0,02{NB}m/s. Le décalage devient minuscule. Réglez aussi la durée d’enregistrement du signal sur 0,5{NB}s (curseur « durée »). Regardez ce que deviennent les deux pics.</>,
      tache: { type: 'action', ok: mes.montage === 'emetteur' && mes.fe === 40000 && Math.abs(mes.v - 0.02) < 1e-9 && mes.T === 0.5, label: 'v = 0,02 m/s, durée 0,5 s', faire: () => { setScene('mesure'); setMes({ ...BASE_MES, v: 0.02, T: 0.5 }); setZoomC(null); }, consigne: 'Réglez v = 0,02 m/s et la durée sur 0,5 s' } },
    { id: 'resolution', titre: 'Allonger l’enregistrement', focus: ['reglages', 'scene'],
      retenirTitre: 'La durée d’enregistrement limite la précision',
      retenir: <>
        <SvgResolution/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Le pic d’un spectre a une largeur d’environ <strong>{avecIndices('frac(1|T)')}</strong>, avec <em>T</em> la durée de l’enregistrement.</li>
          <li>Pour distinguer <em>f</em><sub>r</sub> de <em>f</em><sub>e</sub>, il faut un décalage <em>δf</em> supérieur à {avecIndices('frac(1|T)')} : <strong>enregistrer plus longtemps</strong> affine les pics.</li>
          <li>Exemple : <em>T</em> = 0,5 s ⇒ largeur 2 Hz ; <em>T</em> = 2 s ⇒ 0,5 Hz.</li>
        </ul></>,
      texte: <>Avec <em>v</em> = 0,02{NB}m/s, le décalage ne vaut que 2,4{NB}Hz et les deux pics se chevauchent. Réglez la durée d’enregistrement sur 2{NB}s avec le curseur « durée » et observez les pics.</>,
      tache: { type: 'action', ok: mes.montage === 'emetteur' && mes.fe === 40000 && Math.abs(mes.v - 0.02) < 1e-9 && mes.T === 2, label: 'Régler la durée sur 2 s', faire: () => { setScene('mesure'); setMes({ ...BASE_MES, v: 0.02, T: 2 }); setZoomC(null); }, consigne: 'Réglez la durée d’enregistrement sur 2 s' } },
    { id: 'separer', titre: 'Séparer deux pics', focus: ['scene'],
      texte: <>Avec une durée de 2{NB}s, le pic décalé se distingue nettement du pic de <em>f</em><sub>e</sub>. Avec 0,5{NB}s, ils se chevauchaient.</>,
      tache: { type: 'qcm', q: 'Pour mieux séparer le pic décalé du pic de f_e quand δf est très petit, on…', options: ['allonge la durée d’enregistrement : les pics sont plus fins', 'raccourcit la durée d’enregistrement : les pics sont plus fins', 'augmente la célérité du son c'], bonne: 0,
        bloque: mes.montage === 'emetteur' && mes.fe === 40000 && Math.abs(mes.v - 0.02) < 1e-9 ? null : 'Rétablissez d’abord v = 0,02 m/s avec le bouton au-dessus du spectre.',
        expl: 'La largeur d’un pic est environ frac(1|T) : avec T = 0,5 s elle vaut 2 Hz (les deux pics, distants de 2,4 Hz, se chevauchent) ; avec T = 2 s elle vaut 0,5 Hz (ils sont bien séparés). La célérité du son ne change pas la largeur des pics.', indice: 'Un enregistrement plus long permet de mieux distinguer deux fréquences voisines : la largeur du pic est frac(1|T).' } },
    { id: 'bravo', titre: 'Le bilan', focus: [],
      retenirTitre: 'La chaîne de mesure',
      retenir: <>
        <SvgChaine/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Mouvement relatif ⇒ <em>f</em><sub>r</sub> ≠ <em>f</em><sub>e</sub> ; rapprochement : <em>f</em><sub>r</sub> &gt; <em>f</em><sub>e</sub>, éloignement : <em>f</em><sub>r</sub> &lt; <em>f</em><sub>e</sub>.</li>
          <li><em>δf</em> = |<em>f</em><sub>r</sub> − <em>f</em><sub>e</sub>| = {avecIndices('frac(f_e × v|c)')} si <em>v</em> ≪ <em>c</em> ; donc <em>v</em> = {avecIndices('frac(c × δf|f_e)')}.</li>
          <li>Le décalage est petit devant <em>f</em><sub>e</sub> (de l’ordre de 10⁻³) : il faut un spectre <strong>fin</strong>, donc un enregistrement assez long.</li>
        </ul></>,
      texte: <>Vous savez expliquer pourquoi la fréquence reçue diffère de la fréquence émise et mesurer une vitesse à partir d’un décalage de fréquence. Passez à l’exploration (autres fréquences, montage avec une plaque qui renvoie l’onde) ou tentez les défis.</>, tache: null },
  ];

  // ---------- rétablissements ----------
  const etapesFronts = ['devant', 'derriere', 'frequence', 'etablir1', 'etablir2', 'rapport'];
  const rendreBaseFronts = enGuide && etapesFronts.includes(idE) && Math.abs(beta - 0.4) >= 0.026;
  const etapesMesBase = ['decale', 'pointer', 'decalage', 'vitesse', 'validite'];
  const rendreBaseMes = enGuide && etapesMesBase.includes(idE) && (!mesBase || (['decalage', 'vitesse'].includes(idE) && !pointeOk));
  const rendreBaseEl = enGuide && ['sensinverse'].includes(idE) && !(mes.montage === 'emetteur' && mes.fe === 40000 && mes.T === 1 && Math.abs(mes.v - 0.5) < 1e-9 && mes.sens === 'eloigne');
  const rendreBaseDuree = enGuide && ['resolution', 'separer'].includes(idE) && !(mes.montage === 'emetteur' && mes.fe === 40000 && Math.abs(mes.v - 0.02) < 1e-9);
  const ETAPES = IDS.map(id => TOUTES.find(e => e.id === id));
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...nouveauDefiDonnees(type), type, reps: {}, verifie: false }); setCurBrut(type === 'echo' ? 40000 : 0); setZoomC(null); };
  useEffect(() => { if (defi) setCurBrut(defi.fe); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [defi && defi.fe, defi && defi.type, defi && defi.v]);
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') { setScene('fronts'); setBeta(0); setMes(REPOS_MES); setCurBrut(40000); setZoomC(null); }
    if (md === 'explore') setCurBrut(mes.fe);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const tolDefi = df => Math.min(0.12, Math.max(0.05, 1.0 / df + 0.01));
  const dfVrai = defi ? (defi.type === 'echo' ? D.decalageEchoApprox(defi.fe, defi.v, C) : D.decalageApprox(defi.fe, defi.v, C)) : 1;
  const verifier = () => {
    const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, defi.v, tolDefi(dfVrai));
    setDefi(d => ({ ...d, verifie: true, ok }));
    (defi.type === 'emetteur' ? noterEm : noterEc)(ok);
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['emetteur', 'Chariot émetteur'], ['echo', 'Plaque qui renvoie l’onde (pour aller plus loin)']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'emetteur' ? 'Défi : à quelle vitesse roule le chariot ?' : 'Défi : à quelle vitesse se déplace la plaque ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'emetteur'
          ? <>Un chariot roule à vitesse constante sur un rail. Il porte un émetteur ultrasonore de fréquence <em>f</em><sub>e</sub> = {hz(defi.fe)} ({nbf(defi.fe / 1000, 1)}{NB}kHz). Le récepteur est fixe. Lisez la fréquence reçue <em>f</em><sub>r</sub> avec le curseur, puis calculez la vitesse du chariot (<em>c</em> = 340{NB}m/s). Donnez <em>v</em> avec 2 chiffres significatifs.</>
          : <>Une plaque réfléchissante est fixée sur un chariot qui roule à vitesse constante. Un émetteur ultrasonore (<em>f</em><sub>e</sub> = {hz(defi.fe)}) et un récepteur, fixes et côte à côte, enregistrent l’onde renvoyée par la plaque. Ici, le décalage vaut <em>δf</em> = 2 {avecIndices('frac(f_e v|c)')} (l’onde est décalée une première fois en arrivant sur la plaque mobile, puis une seconde fois quand elle repart). Lisez <em>f</em><sub>r</sub> au curseur et calculez <em>v</em> (<em>c</em> = 340{NB}m/s), avec 2 chiffres significatifs.</>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>Vitesse v</span>
        <input value={defi.reps.v ?? ''} aria-label="Vitesse v en mètres par seconde" onKeyDown={e => e.key === 'Enter' && document.getElementById('dop-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))}
          style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>m/s</span>
      </div>
      <IndiceDefi cache={false}>{defi.type === 'emetteur'
        ? <>Décalage <em>δf</em> = |<em>f</em><sub>r</sub> − <em>f</em><sub>e</sub>| (lu au curseur, en hertz) ; puis <em>v</em> = {avecIndices('frac(c × δf|f_e)')} avec <em>c</em> = 340 m/s.</>
        : <>Décalage <em>δf</em> = |<em>f</em><sub>r</sub> − <em>f</em><sub>e</sub>| (en hertz) ; avec <em>δf</em> = 2 {avecIndices('frac(f_e v|c)')}, on obtient <em>v</em> = {avecIndices('frac(c × δf|2 f_e)')}.</>}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="dop-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct. Vitesse de la simulation : ${nbf(defi.v, 2)} m/s.`
          : `✗ Vérifiez : placez le curseur au sommet du pic (zoomez), calculez δf = |f_r − f_e| en hertz, puis ${defi.type === 'echo' ? 'v = c × δf / (2 f_e)' : 'v = c × δf / f_e'}, avec c = 340 m/s.`}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Célérité</strong> : <em>c</em> = 340 m/s dans l’air du laboratoire, <strong>indépendante de la vitesse de l’émetteur</strong> (elle ne dépend que du milieu). La température n’est pas contrôlée : <em>c</em> est connue à ± 3 m/s.</li>
      <li><strong>Mouvement</strong> : rectiligne uniforme, sur la droite qui joint l’émetteur et le récepteur ; récepteur fixe dans le laboratoire. L’effet n’est calculé que dans une seule dimension.</li>
      <li><strong>Formule du décalage</strong> : <em>δf</em> = {avecIndices('frac(f_e v|c)')} pour un émetteur mobile, valable si <em>v</em> ≪ <em>c</em> (ici {avecIndices('frac(v|c)')} ≤ 5 × 10⁻³). Le spectre est calculé avec la formule <strong>exacte</strong> <em>f</em><sub>r</sub> = {avecIndices('frac(f_e c|c ∓ v)')} ; l’écart avec la formule approchée est de l’ordre de {avecIndices('frac(v|c)')} (moins de 0,5 %). Pour l’écho sur une plaque mobile : <em>δf</em> = 2 {avecIndices('frac(f_e v|c)')} (même hypothèse).</li>
      <li><strong>Son au récepteur C</strong> : la hauteur est calculée avec la position et la direction de la source <strong>au moment de l’émission</strong> (le son met du temps à arriver), pas avec sa position visible à l’écran. Le glissement entendu est donc un peu en retard sur l’image : la note émise est entendue seulement quand la source a déjà dépassé C. Le calcul est la relation exacte pour une source en mouvement rectiligne uniforme et un récepteur fixe, sans vent ni réflexion, avec une célérité constante. Les récepteurs A et B sont sur l’axe du mouvement : leur hauteur est constante (f<sub>e</sub>/(1 − v/c) pour A, f<sub>e</sub>/(1 + v/c) pour B).</li>
      <li><strong>Volume du son</strong> : il décroît comme 1 / distance entre la source (au moment de l’émission) et le récepteur, avec un plafond près de la source ; dans le véhicule il est constant. Ce n’est pas un effet Doppler mais ce qu’on entend vraiment. On néglige l’absorption, la directivité de la source et le fait que l’amplitude reçue dépend aussi de la vitesse. Le son s’atténue brièvement quand l’animation recommence, pour ne pas entendre un saut de hauteur sans signification physique.</li>
      {tg && <li><strong>Ondes lumineuses (partie TG)</strong> : le décalage est calculé avec la même expression, valable pour <em>v</em> ≪ <em>c</em> (ici <em>v</em> / <em>c</em> ≈ 10⁻⁹) ; pour une vitesse comparable à celle de la lumière, il faudrait la relativité, hors programme. La célérité de la lumière est prise égale à 3,00 × 10⁸ m/s dans l’air ; la source est monochromatique et son mouvement rectiligne uniforme dans l’axe du récepteur.</li>}
      <li><strong>Scène des fronts d’onde</strong> : schéma qualitatif où la vitesse de l’émetteur est volontairement <strong>exagérée</strong> (jusqu’à 0,6 <em>c</em>) pour que l’effet se voie ; les mesures de la scène 2 utilisent des valeurs réalistes.</li>
      <li><strong>Spectre</strong> : transformée de Fourier d’un enregistrement de durée <em>T</em> ; chaque pic a la forme sinc² et une largeur d’environ {avecIndices('frac(1|T)')}. On ne tient pas compte du bruit ni de la fenêtre d’enregistrement réelle. Les deux pics (<em>f</em><sub>e</sub> et <em>f</em><sub>r</sub>) sont tracés séparément.</li>
      <li><strong>Incertitudes</strong> (type B, loi rectangulaire, <em>u</em> = {avecIndices('frac(demi-étendue|√3)')}, sources indépendantes) : pointé du sommet du pic à ± 0,5 Hz (ou {avecIndices('frac(1|4T)')} si c’est plus grand), <em>f</em><sub>e</sub> et <em>f</em><sub>r</sub> lues avec le même instrument donc <em>u</em>(<em>δf</em>) = √2 <em>u</em>(<em>f</em>), et <em>c</em> à ± 3 m/s. L’incertitude sur <em>f</em><sub>e</sub> seule est négligée devant celle de <em>δf</em>.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const NOMS_PARC = tg ? ['1. Établir l’expression du décalage', '2. Mesurer une vitesse par le décalage', '3. Sens, durée et résolution'] : ['1. Mouvement relatif et fréquence reçue', '2. Mesurer une vitesse par le décalage', '3. Sens, durée et résolution'];
  const allerParc = n => { setParc(n); setMes(REPOS_MES); setCurBrut(40000); setZoomC(null); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {parc < 3 && <button onClick={() => allerParc(parc + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Parcours {parc + 1} : {NOMS_PARC[parc].slice(3).toLowerCase()}</button>}
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène ----------
  const boutonRetablir = (txt, f) => <button onClick={f} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>{txt}</button>;
  const retablirFronts = rendreBaseFronts && boutonRetablir('Rétablir v = 0,40 c', () => { setScene('fronts'); setBeta(0.4); });
  const retablirMes = (rendreBaseMes && boutonRetablir(!mesBase ? 'Rétablir le montage (v = 0,50 m/s, vers le récepteur)' : 'Rétablir : curseur sur le pic', () => { if (!mesBase) { setScene('mesure'); setMes(BASE_MES); } setZoomC(null); setCurBrut(Math.round(frBase)); }))
    || (rendreBaseEl && boutonRetablir('Rétablir : chariot qui s’éloigne à 0,50 m/s', () => { setScene('mesure'); setMes({ ...BASE_MES, sens: 'eloigne' }); setZoomC(null); }))
    || (rendreBaseDuree && boutonRetablir('Rétablir : v = 0,02 m/s', () => { setScene('mesure'); setMes({ ...BASE_MES, v: 0.02, T: idE === 'separer' ? 2 : 0.5 }); setZoomC(null); }));
  const montrerCurseur = deja('pointer');
  const reglages = sceneEff === 'fronts' ? (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Curseur nom="Vitesse de l’émetteur v (en fraction de c)" valeur={beta} onChange={v => setBeta(Math.round(v * 20) / 20)} min={0} max={0.6} pas={0.05} unite="c" decimales={2} couleur="#b45309"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <button onClick={() => setAnim(a => !a)} aria-pressed={!anim} style={stylePetitBouton(!anim, '#475569')}>{anim ? 'Figer l’animation' : 'Relancer l’animation'}</button>
        <button onClick={() => setRelance(r => r + 1)} style={stylePetitBouton(false, '#475569')}><Pic n="refresh"/>Recommencer</button>
      </div>
      {(mode === 'explore' || (enGuide && deja('rapport'))) && <div role="group" aria-label="Écouter le son" style={{ marginTop: 10, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '8px 10px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>🔊 Écouter la source (une sirène à deux notes)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['em', 'Dans le véhicule (émetteur)'], ['A', 'Récepteur A (devant)'], ['B', 'Récepteur B (derrière)'], ['C', 'Récepteur C (au passage)']].map(([k, l]) => <button key={k} onClick={() => setEcoute(e => e === k ? null : k)} aria-pressed={ecoute === k} style={stylePetitBouton(ecoute === k, '#b45309')}>{l}</button>)}
          {ecoute && <button onClick={() => setEcoute(null)} style={stylePetitBouton(false, '#475569')}>■ Arrêter</button>}
        </div>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
          {ecoute === 'C' ? <>Le récepteur C est au bord de la trajectoire. La source arrive vers lui, le dépasse puis s’éloigne : la hauteur des notes <strong>glisse en continu</strong> de {hz(NOTES[0] / (1 - betaEff))} (source qui approche) à {hz(NOTES[0] / (1 + betaEff))} (source qui s’éloigne), pour la note de 440 Hz. L’autre note (554 Hz) varie de la même façon.</> : ecoute ? <>Notes entendues : <strong>{hz(NOTES[0] * ratioEcoute(ecoute, betaEff))}</strong> et <strong>{hz(NOTES[1] * ratioEcoute(ecoute, betaEff))}</strong>{ecoute === 'em' ? ' : celles de la source, jamais décalées pour qui la porte.' : ecoute === 'A' ? ' : plus aiguës que celles émises (440 et 554 Hz), et de plus en plus fortes quand la source approche.' : ' : plus graves que celles émises (440 et 554 Hz), et de moins en moins fortes quand la source s’éloigne.'}</>
            : <>Choisissez où vous vous placez, puis changez la vitesse de la source pendant que vous écoutez. Notes émises : 440 et 554 Hz. Le son joue tant que vous ne l’arrêtez pas.</>}
        </div>
      </div>}
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!enDefi && <>
        {mode === 'explore' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['emetteur', 'Émetteur sur le chariot'], ['echo', 'Plaque qui renvoie l’onde']].map(([k, l]) => <button key={k} onClick={() => { setM({ montage: k }); setCurBrut(mes.fe); setZoomC(null); }} aria-pressed={mes.montage === k} style={stylePetitBouton(mes.montage === k, '#0e7490')}>{l}</button>)}
        </div>}
        {deja('deplace') && <Curseur nom={echo ? "Vitesse v de la plaque" : "Vitesse v du chariot"} valeur={mes.v} onChange={v => setM({ v: Math.round(v * 100) / 100 })} min={0} max={1.5} pas={0.01} unite="m/s" decimales={2} couleur="#b45309"/>}
        {deja('eloigne') && <div role="group" aria-label="Sens du mouvement" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['approche', 'se rapproche du récepteur'], ['eloigne', 's’éloigne du récepteur']].map(([k, l]) => <button key={k} onClick={() => { setM({ sens: k }); setZoomC(null); }} aria-pressed={mes.sens === k} style={stylePetitBouton(mes.sens === k, '#0369a1')}>{enGuide ? l : (mes.montage === 'echo' ? (k === 'approche' ? 'la plaque se rapproche' : 'la plaque s’éloigne') : l)}</button>)}
        </div>}
        {mode === 'explore' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}><span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Fréquence émise</span>
          {D.F_EMETTEURS.map(f => <button key={f} onClick={() => { setM({ fe: f }); setCurBrut(f); setZoomC(null); }} aria-pressed={mes.fe === f} style={stylePetitBouton(mes.fe === f, '#475569')}>{f / 1000}{NB}kHz</button>)}</div>}
        {deja('duree') && <div style={{ marginBottom: 8 }}>
          <Curseur nom="Durée d’écoute T (durée de l’enregistrement)" valeur={mes.T} onChange={v => setM({ T: v })} min={0.5} max={2} pas={0.5} unite="s" decimales={1} couleur="#475569"/>
          <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.5, background: '#f1f5f9', borderRadius: 8, padding: '6px 10px' }}>
            <strong>À quoi sert-elle ?</strong> Le spectre est calculé à partir du son enregistré pendant T secondes. Plus on écoute longtemps, plus les pics sont <strong>fins</strong> : largeur ≈ {avecIndices('frac(1|T)')} = <strong>{nbf(D.resolution(T), 1)}{NB}Hz</strong> ici. Deux fréquences très proches ne se distinguent que si leur écart est plus grand que cette largeur.
            {mode === 'explore' && <> <em>Essayez : v = 0,02 m/s (δf ≈ 2,4 Hz), puis T = 0,5 s et T = 2 s.</em></>}
          </div></div>}
        {!deja('deplace') && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Le chariot est arrêté.</div>}
      </>}
      {enDefi && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>{echo ? 'Plaque mobile ; émetteur et récepteur fixes.' : 'Chariot mobile ; récepteur fixe.'} <em>f</em><sub>e</sub> = {hz(fe)}, <em>c</em> = 340{NB}m/s (± 3{NB}m/s). Enregistrement de 1{NB}s.</div>}
    </div>
  );

  const sceneMesure = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mode === 'explore' && <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 10, padding: '8px 12px', fontSize: 14, lineHeight: 1.55, color: KIT.txt }}>
        <strong>Le principe :</strong> un émetteur envoie un son de fréquence connue <em>f</em><sub>e</sub>. Si l’objet qui bouge fait varier la fréquence reçue, <strong>l’écart</strong> <em>δf</em> avec <em>f</em><sub>e</sub> indique sa vitesse.
        <ol style={{ margin: '4px 0 0', paddingLeft: 20 }}>
          <li>Réglez la <strong>vitesse</strong> ci-dessous : un 2<sup>e</sup> pic (bleu) apparaît à côté du pic gris de <em>f</em><sub>e</sub>.</li>
          <li><strong>Lisez</strong> la fréquence reçue : placez le curseur orange au sommet du pic bleu.</li>
          <li>Les <strong>Mesures</strong> donnent alors <em>δf</em>, puis la vitesse calculée ; comparez-la à celle que vous avez réglée.</li>
        </ol></div>}
      <Rail montage={m.montage} sens={m.sens} v={vEff} fe={fe}/>
      <div style={cadre('scene')}><Spectre fe={fe} fr={fr} T={T} fen={fen} cur={cur} setCur={setCur} aMontrerRef={vEff > 0} aMontrerCurseur={montrerCurseur} nomRef={vEff > 0 ? FE : <>{FE} = {FR}</>}
        aria={vEff > 0 ? `Spectre du signal reçu : un pic gris pour la fréquence émise ${milliers(fe)} hertz et un pic bleu décalé pour la fréquence reçue` : `Spectre du signal reçu : un seul pic à la fréquence émise ${milliers(fe)} hertz`}/></div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: KIT.txt }}>
        <span style={{ color: '#475569', fontWeight: 700 }}>▭ Pic gris en tirets : fréquence émise <em>f</em><sub>e</sub></span> = celle que l’émetteur envoie (elle ne change jamais).{' '}
        <span style={{ color: '#0369a1', fontWeight: 700 }}>▬ Pic bleu : fréquence reçue <em>f</em><sub>r</sub></span> = celle que le récepteur entend, décalée parce que ça bouge. {vEff > 0 ? <>Écart entre les deux : <strong><em>δf</em></strong>.</> : <>À l’arrêt, les deux pics sont confondus : réglez une vitesse.</>}
      </div>
      {mode === 'explore' && reglages}
      {montrerCurseur && <div role="group" aria-label="Curseur de lecture de la fréquence" style={{ background: '#f1f5f9', borderRadius: 10, padding: '6px 10px', ...cadre('curseur') }}>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700 }}>Curseur : {hz(cur)}</div>
        <input type="range" aria-label="Fréquence du curseur" aria-valuetext={hz(cur)} min={Math.round(fen[0])} max={Math.round(fen[1])} step={1} value={Math.max(Math.round(fen[0]), Math.min(Math.round(fen[1]), cur))} onChange={e => setCur(parseFloat(e.target.value))} style={{ display: 'block', width: '100%', minHeight: 32, accentColor: '#b45309' }}/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {[[-10, '−10'], [-1, '−1'], [1, '+1'], [10, '+10']].map(([dlt, l]) => <button key={l} onClick={() => setCur(cur + dlt)} aria-label={`Déplacer le curseur de ${l} hertz`} style={stylePetitBouton(false, '#475569')}>{l}{NB}Hz</button>)}
          {mode === 'explore' && vEff > 0 && <button onClick={() => setCur(fr)} style={stylePetitBouton(true, '#b45309')}>Placer sur le pic bleu</button>}
          {zoomC == null ? <button onClick={() => setZoomC(Math.round(cur))} style={stylePetitBouton(false, '#0369a1')}><Pic n="search"/>Zoom autour du curseur</button> : <button onClick={() => setZoomC(null)} style={stylePetitBouton(true, '#0369a1')}>Vue d’ensemble</button>}
        </div>
      </div>}
    </div>);
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {mode === 'explore' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['fronts', 'Fronts d’onde'], ['mesure', 'Mesure de vitesse']].map(([k, l]) => <button key={k} onClick={() => setScene(k)} aria-pressed={scene === k} style={stylePetitBouton(scene === k, '#0e7490')}>{l}</button>)}
      </div>}
      {sceneEff === 'fronts' ? <>{retablirFronts}<FrontsOnde beta={betaEff} anim={anim} relance={relance} annot={apres('derriere') || mode === 'explore'} posRef={posRef} recC={mode === 'explore' || (enGuide && deja('rapport'))}/></> : <>{retablirMes}{sceneMesure}</>}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{sceneEff === 'fronts'
        ? 'Chaque cercle est un front d’onde ; l’émetteur (orange) part de la gauche et recommence quand il atteint le bord. Vitesse exagérée pour la lisibilité.'
        : montrerCurseur ? 'Glissez le curseur orange sur le spectre, ou utilisez le curseur et les boutons en dessous. En vue d’ensemble, la fenêtre est large de ' + (2 * W0) + ' Hz.' : 'Le spectre montre les fréquences présentes dans le signal reçu (échelle en hertz).'}</div>
    </div>);

  const mesures = sceneEff === 'fronts' ? (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Vitesse de l’émetteur v" valeur={`${nbf(betaEff, 2)}${NB}c`}/>
      {apres('derriere') && <>
        <LigneMesure nom="λ émise (émetteur immobile)" valeur="λ"/>
        <LigneMesure nom="λ devant l’émetteur" valeur={`${nbf(lamAv, 2)}${NB}λ`} couleur="#15803d"/>
        <LigneMesure nom="λ derrière l’émetteur" valeur={`${nbf(lamAr, 2)}${NB}λ`} couleur="#b91c1c"/></>}
      {mode === 'explore' && <>
        <LigneMesure nom="f devant / f_e = 1 / (1 − v/c)" valeur={nbf(1 / (1 - betaEff), 2)}/>
        <LigneMesure nom="f derrière / f_e = 1 / (1 + v/c)" valeur={nbf(1 / (1 + betaEff), 2)}/></>}
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Fréquence émise f_e" valeur={hz(fe)}/>
      <LigneMesure nom="Célérité c (air)" valeur={`340${NB}m/s`}/>
      {montrerCurseur && <LigneMesure nom="Fréquence lue au curseur" valeur={hz(cur)} couleur="#b45309"/>}
      {(apres('decalage') || mode !== 'guide') && montrerCurseur && <LigneMesure nom="Décalage lu δf" valeur={`${nbf(dfMes, 0)}${NB}Hz`} couleur="#15803d"/>}
      {(apres('vitesse') || mode === 'explore') && montrerCurseur && enDefi === false && <LigneMesure nom={echo ? 'v = c·δf / (2 f_e)' : 'v = c·δf / f_e'} valeur={`${nbf(vMes, 2)}${NB}m/s`} couleur="#15803d"/>}
      {mode === 'explore' && <>
        <LigneMesure nom="Vitesse réglée v" valeur={`${nbf(vEff, 2)}${NB}m/s`}/>
        <LigneMesure nom="v / c" valeur={`${nbf(vEff / C * 1e3, 2)}${NB}×${NB}10⁻³`}/>
        <LigneMesure nom={echo ? 'δf prévu (2 f_e v / c)' : 'δf prévu (f_e v / c)'} valeur={`${nbf(dfApprox, 1)}${NB}Hz`}/>
        <LigneMesure nom="δf exact (valeur du spectre)" valeur={`${nbf(dfExact, 1)}${NB}Hz`}/>
        <LigneMesure nom="Largeur des pics 1 / T" valeur={`${nbf(D.resolution(T), 1)}${NB}Hz`}/></>}
      {apres('validite') && mode === 'guide' && <LigneMesure nom="v / c" valeur={`${nbf(vEff / C * 1e3, 2)}${NB}×${NB}10⁻³`}/>}
    </div>
  );
  const incertBox = sceneEff === 'mesure' && (mode === 'explore' || enDefi) && inc && montrerCurseur && (
    <div style={{ ...styleBoite }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Incertitude sur v{enDefi ? ' (relative)' : ''}</div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>Type B : u = demi-étendue / √3. Sources supposées indépendantes.</div>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Source</th><th style={{ padding: '2px 4px' }}>± demi-étendue</th><th style={{ padding: '2px 4px' }}>u / valeur</th><th style={{ padding: '2px 4px' }}>poids</th></tr></thead>
        <tbody>{[['δf (2 pointés)', `${nbf(Math.SQRT2 * D.demiPointe(T), 2)} Hz`, inc.rDf, inc.part[0], '#b45309'], ['c (température)', '3 m/s', inc.rC, inc.part[1], '#0e7490']].map(([n, dem, r, p, c]) => (
          <tr key={n} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 600 }}>{n}</td><td style={{ padding: '3px 4px' }}>{dem}</td><td style={{ padding: '3px 4px', fontFamily: 'monospace' }}>{nbf(r * 100, 2)} %</td>
            <td style={{ padding: '3px 4px', minWidth: 90 }}><div style={{ background: '#e2e8f0', borderRadius: 4, height: 10 }}><div style={{ width: `${Math.round(p * 100)}%`, background: c, height: '100%', borderRadius: 4 }}/></div><span style={{ fontSize: 11.5 }}>{Math.round(p * 100)} %</span></td></tr>))}</tbody>
      </table>
      <div style={{ marginTop: 6 }}>
        <LigneMesure nom="u(v) / v" valeur={`${nbf(inc.rel * 100, 2)} %`}/>
        {!enDefi && <LigneMesure nom="u(v)" valeur={`${nbf(vMes * inc.rel, 3)}${NB}m/s`} couleur="#15803d"/>}
        {enDefi && <LigneMesure nom="Intervalle ± 2 u / valeur" valeur={`${nbf(2 * inc.rel * 100, 1)} %`}/>}
      </div>
    </div>);

  const [vCmp, setVCmp] = useState(0.5);
  const fmtHz = x => x >= 1e5 ? `${nbf(x / 1e6, 2)}${NB}MHz` : x >= 1e3 ? `${nbf(x / 1e3, 2)}${NB}kHz` : `${nbf(x, 1)}${NB}Hz`;
  const cmpOnde = (nom, fe0, c0, fmtFe) => ({ nom, fe0, c0, fmtFe, df: fe0 * vCmp / c0, rel: vCmp / c0 });
  const comparaison = tg && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Son ou lumière : même vitesse, quel décalage ?</div>
      <Curseur nom="Vitesse v de l’émetteur" valeur={vCmp} onChange={v => setVCmp(Math.round(v * 100) / 100)} min={0.05} max={5} pas={0.05} unite="m/s" decimales={2} couleur="#b45309"/>
      {[cmpOnde('Ultrasons', 40000, 340, '40 kHz'), cmpOnde('Laser 633 nm', 4.74e14, 3e8, '4,74 × 10¹⁴ Hz')].map(o => (
        <div key={o.nom} style={{ borderTop: `1px dashed ${KIT.bord}`, padding: '6px 0' }}>
          <div style={{ fontWeight: 700, color: KIT.txt, fontSize: 14 }}>{o.nom} <span style={{ fontWeight: 400, color: KIT.txt2 }}>(<em>f</em><sub>e</sub> = {o.fmtFe}, <em>c</em> = {o.c0 === 340 ? `340${NB}m/s` : `3,00 × 10⁸${NB}m/s`})</span></div>
          <LigneMesure nom="v / c" valeur={o.rel.toExponential(1).replace('e-', ` × 10⁻`).replace('.', ',')}/>
          <LigneMesure nom="δf" valeur={fmtHz(o.df)} couleur="#15803d"/>
        </div>))}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>{avecIndices('frac(δf|f_e)')} = {avecIndices('frac(v|c)')} dans les deux cas : le décalage <em>relatif</em> est minuscule pour la lumière, mais comme f<sub>e</sub> est énorme, δf se mesure (de l’ordre du MHz à quelques m/s).</div>
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Fronts d’onde : augmentez la vitesse de l’émetteur. Que deviennent les longueurs d’onde devant et derrière ? Que se passerait-il si l’émetteur allait presque aussi vite que l’onde ?</li>
        <li>Mesure : doublez la vitesse du chariot. Comment varie le décalage δf ? Et si vous passez de 25 à 40 kHz ?</li>
        <li>Mesure : mettez v = 0,02 m/s puis allongez la durée d’enregistrement. À partir de quelle durée les deux pics se séparent-ils ?</li>
        <li>Mesure : comparez le décalage prévu par la formule approchée et le décalage exact. L’écart augmente-t-il avec v ?</li>
        <li>Plaque qui renvoie l’onde : à même vitesse, comparez δf avec le montage du chariot émetteur. Quel est le rapport ? Pourquoi ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>émetteur et récepteur en mouvement relatif : f<sub>r</sub> ≠ f<sub>e</sub> (rapprochement : f<sub>r</sub> &gt; f<sub>e</sub> ; éloignement : f<sub>r</sub> &lt; f<sub>e</sub>)</li>
        <li>décalage : δf = |f<sub>r</sub> − f<sub>e</sub>| ; si v ≪ c, δf = f<sub>e</sub> {avecIndices('frac(v|c)')}, donc v = c {avecIndices('frac(δf|f_e)')}</li>
        <li>plaque mobile qui renvoie l’onde : δf = 2 f<sub>e</sub> {avecIndices('frac(v|c)')}</li>
        <li>largeur des pics du spectre ≈ {avecIndices('frac(1|T)')} : séparer deux fréquences voisines demande un enregistrement long</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .dop-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .dop-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .dop-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .dop-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .dop-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .dop-l1.cote .dop-carte { order: 2; } .dop-l1.cote .dop-main { order: 1; } }
        @media (max-width: 900px) { .dop-l1.cote, .dop-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>{tg ? 'Effet Doppler : établir l’expression du décalage, mesurer une vitesse' : 'Effet Doppler : du décalage de fréquence à la vitesse'}</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Quand un émetteur et un récepteur sont en <strong>mouvement relatif</strong>, la fréquence reçue n’est pas la fréquence émise. Ce décalage est proportionnel à la vitesse : il permet de la mesurer.</div>
      <div className={`dop-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="dop-carte">
          <div role="group" aria-label="Choix du parcours" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8, fontSize: 13.5 }}>
            <span style={{ color: KIT.txt2 }}>Parcours :</span>
            {NOMS_PARC.map((l, i) => <button key={i} onClick={() => allerParc(i + 1)} aria-pressed={parc === i + 1} style={{ ...styleBouton(parc === i + 1, ORANGE_GUIDE), fontSize: 13 }}>{l}</button>)}
          </div>
          <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="dop-carte">{panneauHypo}</div> : null}
        <div className="dop-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM}:defi.${defi.type}`} etat={defi.type === 'emetteur' ? suiviEm : suiviEc}/></div>}
          <div className={`dop-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{(!enGuide || (sceneEff === 'fronts' ? deja('mobile') : deja('deplace'))) && !(mode === 'explore' && sceneEff === 'mesure') && reglages}{(!enGuide || deja('frequence')) && mesures}{incertBox}</div>
          </div>
        </div>
      </div>
      {!enDefi && (!enGuide || deja('bravo')) && <div className="dop-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="dop-l2">{comparaison}{aEssayer}{retenir}</div>}
    </div>
  );
}
