// Scènes dessinées de la simulation 150 (ondes mécaniques : célérité et retard) : corde, signaux des capteurs, carte des stations, course entre trois milieux.
import * as M from './ondesCeleriteModele';
const { COUL, X_M, fr } = M;
import { TV } from './Travail';
import { KIT } from '../commun';

const NBSP = ' ';
const fleche = (x, y, ang, c, t = 7) => <polygon points={`0,0 ${-2 * t},${-t * 0.8} ${-2 * t},${t * 0.8}`} fill={c} transform={`translate(${x},${y}) rotate(${ang})`}/>;
const cadreSvg = { display: 'block', width: '100%', maxWidth: 480, margin: '0 auto', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 };

// ──────────────── 1. La corde ────────────────
const CX0 = 26, CKX = (420 - 26 - 14) / M.L_CORDE, CY0 = 112, CKY = 150;
const cpx = x => CX0 + CKX * x, cpy = y => CY0 - CKY * y;
export function Corde({ t, c, x1 = 1, x2 = 3, capteurs = false, pointM = false, vitesse = false, tAff = true }) {
  const pts = []; for (let k = 0; k <= 120; k++) { const x = k * M.L_CORDE / 120; pts.push(`${cpx(x).toFixed(1)},${cpy(M.elongation(x, t, c)).toFixed(1)}`); }
  const billes = Array.from({ length: 25 }, (_, k) => k * 0.25).filter(x => !(pointM && Math.abs(x - X_M) < 1e-9));
  const yM = cpy(M.elongation(X_M, t, c)), vM = M.vitessePoint(X_M, t, c), lv = Math.max(-46, Math.min(46, vM * 28));
  const cap = (x, n, col) => (
    <g key={n}>
      <line x1={cpx(x)} y1="62" x2={cpx(x)} y2="138" stroke={col} strokeWidth="2" strokeDasharray="5 4"/>
      <rect x={cpx(x) - 11} y="138" width="22" height="20" rx="4" fill={col}/><text x={cpx(x)} y="153" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">{n}</text>
      <text x={cpx(x)} y="174" textAnchor="middle" fontSize="14" fontWeight="700" fill={col}>capteur {n}</text>
    </g>);
  return (
    <svg viewBox="0 0 420 208" role="img" style={cadreSvg}
      aria-label={`Corde horizontale de ${M.L_CORDE} mètres : une bosse part de la source à gauche et se propage vers la droite${capteurs ? ` ; deux capteurs placés à ${fr(x1, 1)} m et ${fr(x2, 1)} m de la source` : ''}${pointM ? ' ; un point M de la corde est repéré en orange' : ''}`}>
      {tAff && <text x="8" y="22" fontSize="16" fontWeight="800" fill={KIT.txt}>t = {fr(t, 2)}{NBSP}s</text>}
      <g><line x1="236" y1="16" x2="312" y2="16" stroke="#334155" strokeWidth="2.5"/>{fleche(316, 16, 0, '#334155', 7)}<text x="236" y="38" fontSize="14" fontWeight="700" fill="#334155">sens de propagation</text></g>
      {pointM && <g><line x1={cpx(X_M)} y1="56" x2={cpx(X_M)} y2="150" stroke={COUL.M} strokeWidth="1.5" strokeDasharray="3 4"/>
        <text x={cpx(X_M) + 8} y="150" fontSize="13" fontWeight="700" fill={COUL.M}>même abscisse</text></g>}
      <line x1={cpx(0)} y1={cpy(0)} x2={cpx(M.L_CORDE)} y2={cpy(0)} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 4"/>
      <polyline points={pts.join(' ')} fill="none" stroke={COUL.corde} strokeWidth="2.6" strokeLinejoin="round"/>
      {billes.map(x => <circle key={x} cx={cpx(x)} cy={cpy(M.elongation(x, t, c))} r="3.6" fill="#334155"/>)}
      {pointM && <g><circle cx={cpx(X_M)} cy={yM} r="7" fill={COUL.M} stroke="#fff" strokeWidth="1.5"/><text x={cpx(X_M) - 12} y={Math.min(yM, 112) - 12} fontSize="16" fontWeight="800" fill={COUL.M} textAnchor="end">M</text></g>}
      {pointM && vitesse && Math.abs(lv) > 4 && <g><line x1={cpx(X_M) + 18} y1={yM} x2={cpx(X_M) + 18} y2={yM - lv} stroke={COUL.vit} strokeWidth="3"/>{fleche(cpx(X_M) + 18, yM - lv, lv > 0 ? -90 : 90, COUL.vit, 7)}
        <TV x={cpx(X_M) + 26} y={yM - lv / 2 + 5} c={COUL.vit} s={16}>u</TV></g>}
      <g><rect x="2" y={cpy(0) - 10} width="22" height="20" rx="5" fill="#fde68a" stroke="#92400e" strokeWidth="1.5"/><text x="4" y={cpy(0) + 36} fontSize="14" fontWeight="700" fill="#92400e">source S</text></g>
      {capteurs && cap(x1, 1, COUL.c1)}{capteurs && cap(x2, 2, COUL.c2)}
      {capteurs && <g><line x1={cpx(x1)} y1="188" x2={cpx(x2)} y2="188" stroke="#0f172a" strokeWidth="1.8"/>{fleche(cpx(x2), 188, 0, '#0f172a', 6)}{fleche(cpx(x1), 188, 180, '#0f172a', 6)}
        <text x={(cpx(x1) + cpx(x2)) / 2} y="204" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0f172a">d = {fr(x2 - x1, 1)}{NBSP}m</text></g>}
    </svg>);
}

// ──────────────── 2. Les signaux des deux capteurs (et les repères de lecture) ────────────────
export function Signaux({ t, c, x1, x2, tmax, rep = null }) {
  const L = 44, R = 408, tx = s => L + (R - L) * s / tmax, ky = 54 / M.A_BOSSE;
  const base1 = 96, base2 = 188;
  const trace = (x, base, col) => { const p = []; const n = 240; for (let k = 0; k <= n; k++) { const s = Math.min(t, tmax) * k / n; p.push(`${tx(s).toFixed(1)},${(base - ky * M.elongation(x, s, c)).toFixed(1)}`); } return <polyline points={p.join(' ')} fill="none" stroke={col} strokeWidth="2.6" strokeLinejoin="round"/>; };
  const graduations = []; const pasLab = tmax > 3 ? 1 : 0.5;
  for (let k = 0; k * 0.1 <= tmax + 1e-9; k++) { const s = k * 0.1, grand = Math.abs(s / pasLab - Math.round(s / pasLab)) < 1e-6; graduations.push(<line key={k} x1={tx(s)} y1="24" x2={tx(s)} y2="194" stroke={grand ? '#94a3b8' : '#e2e8f0'} strokeWidth={grand ? 1.2 : 1}/>); if (grand) graduations.push(<text key={`l${k}`} x={tx(s)} y="212" textAnchor="middle" fontSize="14" fill="#0f172a">{fr(s, s % 1 === 0 ? 0 : 1)}</text>); }
  const [ra, rb] = rep ? [rep.a, rep.b] : [null, null];
  return (
    <svg viewBox="0 0 420 232" role="img" style={cadreSvg}
      aria-label={`Graphique des deux signaux : élongation du point de la corde au niveau du capteur 1 (en haut) et du capteur 2 (en bas) en fonction du temps, de 0 à ${fr(tmax, 1)} secondes${rep ? ' ; deux repères de lecture verticaux, début et fin' : ''}`}>
      {graduations}
      <line x1={L} y1={base1} x2={R} y2={base1} stroke="#0f172a" strokeWidth="1.6"/><line x1={L} y1={base2} x2={R} y2={base2} stroke="#0f172a" strokeWidth="1.6"/>
      <text x={L + 4} y="38" fontSize="15" fontWeight="800" fill={COUL.c1} stroke="#fff" strokeWidth="4" paintOrder="stroke">capteur 1</text><text x={L + 4} y="130" fontSize="15" fontWeight="800" fill={COUL.c2} stroke="#fff" strokeWidth="4" paintOrder="stroke">capteur 2</text>
      <text x="6" y="64" fontSize="15" fontStyle="italic" fill="#0f172a">y</text><text x="6" y="156" fontSize="15" fontStyle="italic" fill="#0f172a">y</text>
      <text x={R} y="230" textAnchor="end" fontSize="14" fontWeight="700" fill="#0f172a">temps t (s)</text>
      {trace(x1, base1, COUL.c1)}{trace(x2, base2, COUL.c2)}
      <line x1={tx(Math.min(t, tmax))} y1="24" x2={tx(Math.min(t, tmax))} y2="194" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3"/>
      {rep && [[ra, COUL.deb, 'début', ra <= rb], [rb, COUL.fin, 'fin', rb < ra]].map(([s, col, nom, avant]) => (
        <g key={nom}><line x1={tx(s)} y1="20" x2={tx(s)} y2="196" stroke={col} strokeWidth="2.4"/>
          <text x={tx(s) + (avant ? -4 : 4)} y="16" textAnchor={avant ? 'end' : 'start'} fontSize="14" fontWeight="800" fill={col}>{nom}</text></g>))}
    </svg>);
}

// ──────────────── 3. La carte du séisme ────────────────
const MX0 = 36, MK = 3.2, MY0 = 8;
const mpx = x => MX0 + (x - M.CARTE.xmin) * MK, mpy = y => MY0 + (M.CARTE.ymax - y) * MK;
const NUM = ['①', '②', '③', '④'];
export function Carte({ stations, dts = null, rayons = [], E = null, cand = null, front = null, atteintes = [], marqueur = null }) {
  const fond = []; for (let v = 0; v <= 80; v += 20) { fond.push(<line key={`h${v}`} x1={mpx(M.CARTE.xmin)} y1={mpy(v)} x2={mpx(M.CARTE.xmax)} y2={mpy(v)} stroke="#c7d9ee" strokeWidth="1"/>, <line key={`v${v}`} x1={mpx(v)} y1={mpy(M.CARTE.ymin)} x2={mpx(v)} y2={mpy(M.CARTE.ymax)} stroke="#c7d9ee" strokeWidth="1"/>); }
  const clip = 'carte-clip';
  return (
    <svg viewBox="0 0 420 392" role="img" style={cadreSvg}
      aria-label={`Carte de 110 kilomètres de côté avec ${stations.length} station${stations.length > 1 ? 's' : ''} sismique${stations.length > 1 ? 's' : ''}${rayons.length ? ' et des cercles centrés sur les stations' : ''}`}>
      <defs><clipPath id={clip}><rect x={mpx(M.CARTE.xmin)} y={mpy(M.CARTE.ymax)} width={(M.CARTE.xmax - M.CARTE.xmin) * MK} height={(M.CARTE.ymax - M.CARTE.ymin) * MK}/></clipPath></defs>
      <rect x={mpx(M.CARTE.xmin)} y={mpy(M.CARTE.ymax)} width={(M.CARTE.xmax - M.CARTE.xmin) * MK} height={(M.CARTE.ymax - M.CARTE.ymin) * MK} fill="#eaf3fb" stroke="#7aa6d6" strokeWidth="1.5"/>
      {fond}
      <g clipPath={`url(#${clip})`}>
        {front != null && E && front > 0 && <circle cx={mpx(E.x)} cy={mpy(E.y)} r={front * MK} fill="none" stroke={COUL.M} strokeWidth="3"/>}
        {rayons.map((r, i) => r && Number.isFinite(r.r) && r.r > 0 && <circle key={i} cx={mpx(r.x)} cy={mpy(r.y)} r={r.r * MK} fill="none" stroke={r.couleur || '#475569'} strokeWidth="2.4" strokeDasharray={r.tirets ? '7 5' : undefined}/>)}
      </g>
      <g><line x1={mpx(0)} y1="378" x2={mpx(20)} y2="378" stroke="#0f172a" strokeWidth="3"/><text x={mpx(10)} y="372" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a" stroke="#fff" strokeWidth="4" paintOrder="stroke">20{NBSP}km</text></g>
      {cand && cand.map((p, i) => <g key={i}><circle cx={mpx(p.x)} cy={mpy(p.y)} r="10" fill="#fff" stroke="#0f172a" strokeWidth="1.8"/><text x={mpx(p.x)} y={mpy(p.y) + 6} textAnchor="middle" fontSize="17" fontWeight="800" fill="#0f172a">{NUM[i]}</text></g>)}
      {E && <g><line x1={mpx(E.x) - 9} y1={mpy(E.y) - 9} x2={mpx(E.x) + 9} y2={mpy(E.y) + 9} stroke="#b91c1c" strokeWidth="4"/><line x1={mpx(E.x) - 9} y1={mpy(E.y) + 9} x2={mpx(E.x) + 9} y2={mpy(E.y) - 9} stroke="#b91c1c" strokeWidth="4"/></g>}
      {marqueur && <g><line x1={mpx(marqueur.x) - 10} y1={mpy(marqueur.y)} x2={mpx(marqueur.x) + 10} y2={mpy(marqueur.y)} stroke="#7e22ce" strokeWidth="3.5"/><line x1={mpx(marqueur.x)} y1={mpy(marqueur.y) - 10} x2={mpx(marqueur.x)} y2={mpy(marqueur.y) + 10} stroke="#7e22ce" strokeWidth="3.5"/><circle cx={mpx(marqueur.x)} cy={mpy(marqueur.y)} r="6" fill="none" stroke="#7e22ce" strokeWidth="2.5"/></g>}
      {stations.map((s, i) => {
        const gauche = mpx(s.x) > 280, haut = mpy(s.y) < 60, atteinte = atteintes[i];
        return (<g key={s.id}>
          <polygon points={`${mpx(s.x)},${mpy(s.y) - 10} ${mpx(s.x) - 9},${mpy(s.y) + 7} ${mpx(s.x) + 9},${mpy(s.y) + 7}`} fill={atteinte ? COUL.M : '#0f172a'} stroke="#fff" strokeWidth="1.5"/>
          <text x={mpx(s.x) + (gauche ? -14 : 14)} y={mpy(s.y) + (haut ? 20 : -2)} textAnchor={gauche ? 'end' : 'start'} fontSize="17" fontWeight="800" fill="#0f172a" stroke="#fff" strokeWidth="4" paintOrder="stroke">{s.id}</text>
          {dts && dts[i] != null && <text x={mpx(s.x) + (gauche ? -14 : 14)} y={mpy(s.y) + (haut ? 38 : 16)} textAnchor={gauche ? 'end' : 'start'} fontSize="15" fontWeight="700" fill="#7c2d12" stroke="#fff" strokeWidth="4" paintOrder="stroke">Δt = {fr(dts[i], 1)}{NBSP}s</text>}
        </g>);
      })}
    </svg>);
}

// ──────────────── 4. La course entre trois milieux ────────────────
export function Course({ t, d, tmax }) {
  const L = 82, R = 392, lanes = [52, 108, 164], dur = M.dureesCourse(d), ms = tmax < 1;
  const aff = s => ms ? `${fr(s * 1000, 0)}${NBSP}ms` : `${fr(s, 2)}${NBSP}s`;
  return (
    <svg viewBox="0 0 420 224" role="img" style={cadreSvg}
      aria-label={`Course d’un signal sonore sur ${d} mètres dans l’air, dans l’eau et dans l’acier : chaque ligne montre où est le signal à l’instant t`}>
      <text x="8" y="22" fontSize="16" fontWeight="800" fill={KIT.txt}>t = {aff(t)}</text>
      <text x="412" y="22" textAnchor="end" fontSize="15" fontWeight="700" fill="#334155">même distance : {d}{NBSP}m</text>
      {M.MILIEUX.map((m, i) => {
        const y = lanes[i], frac = Math.min(1, m.c * t / d), arrive = m.c * t >= d - 1e-9, x = L + (R - L) * frac;
        return (<g key={m.id}>
          <text x="8" y={y + 5} fontSize="16" fontWeight="800" fill={KIT.txt}>{m.nom}</text>
          <rect x={L} y={y - 14} width={R - L} height="28" rx="6" fill={m.id === 'acier' ? '#cbd5e1' : m.id === 'eau' ? '#bfdbfe' : '#f1f5f9'} stroke="#64748b" strokeWidth="1.5"/>
          <rect x={L - 10} y={y - 9} width="10" height="18" rx="2" fill="#92400e"/><rect x={R} y={y - 9} width="10" height="18" rx="2" fill="#0f172a"/>
          {t > 0 && <rect x={Math.max(L, x - 9)} y={y - 12} width="12" height="24" rx="4" fill={COUL.M} opacity="0.9"/>}
          {arrive && <text x={R - 4} y={y + 32} textAnchor="end" fontSize="14" fontWeight="800" fill="#15803d">arrivé après {aff(dur[i])}</text>}
        </g>);
      })}
      <text x={L - 4} y="214" textAnchor="end" fontSize="14" fill="#92400e" fontWeight="700">source</text><text x={R + 14} y="214" fontSize="14" fill="#0f172a" fontWeight="700" textAnchor="end">récepteur</text>
    </svg>);
}
