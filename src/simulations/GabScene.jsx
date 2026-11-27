/* eslint-disable react-refresh/only-export-components */
import { useId } from "react";
import { coordSvg } from "./exploAnim";
import * as G from "./gabModele";

// ====================================================
//  Scène animée de la simulation 317 : un signal (somme de sinusoïdes) traverse un filtre.
//  En haut, le signal en fonction du temps (entrée en bleu, sortie en orange) ; en bas, son SPECTRE (une raie par sinusoïde, amplitude en volts)
//  avec la courbe A(f) du filtre et les « portes » du cahier des charges (vert : la courbe doit passer au-dessus ; rouge : en dessous).
//  Les poignées rouges règlent les fréquences de coupure ; tout se redessine en direct (chaque raie de sortie = raie d'entrée × A).
// ====================================================
export const COUL = { ue: '#2563eb', us: '#ea580c', courbe: '#0f766e', poignee: '#dc2626', poignee2: '#7c3aed', ok: '#15803d', ko: '#dc2626', txt: '#0f172a', gris: '#475569', grille: '#cbd5e1' };
const TWO_PI = 2 * Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function layout(etroit, temps) {
  if (!etroit) {
    const oy = temps ? 200 : 0;
    return { W: 760, H: oy + 288, T: { x0: 70, x1: 736, yT: 44, yB: 172 }, S: { xD: 104, xL: 160, x1: 696, yT: oy + 46, yB: oy + 212 }, oy, fs: 1, bw: 9 };
  }
  const oy = temps ? 196 : 0;
  return { W: 380, H: oy + 286, T: { x0: 44, x1: 366, yT: 42, yB: 168 }, S: { xD: 70, xL: 100, x1: 332, yT: oy + 46, yB: oy + 210 }, oy, fs: 1.05, bw: 8 };
}

const txtT = s => (s >= 1 ? `${G.nbf(s, 1)}${G.NB}s` : s >= 1e-3 ? `${G.nbf(s * 1e3, s * 1e3 >= 10 ? 0 : 1)}${G.NB}ms` : `${G.nbf(s * 1e6, 0)}${G.NB}µs`);
const vTxt = v => `${G.nbf(v, Math.abs(v) < 0.1 ? 2 : 1)}${G.NB}V`;
const halo = { stroke: '#f8fafc', strokeWidth: 3, paintOrder: 'stroke' };

export function SceneGab({ raies = [], type = 'bas', f1 = 1000, f2 = 10000, setF1, setF2, nPoignees = 0, etroit = false, svgRef, aria, tau = 0,
  temps = true, sortie = true, courbe = true, cahier = null, valeurs = false, prog = 1, legende = true, touche = true, statut = true, vmaxV = null, titreSpectre = 'Spectre du signal : une raie par sinusoïde' }) {
  const id = useId().replace(/:/g, ''), { W, H, T, S, oy, fs, bw } = layout(etroit, temps);
  const fz = v => v * fs;
  const gain = f => G.gainFiltre(type, f, f1, f2);
  const out = sortie ? G.sortie(raies, type, f1, f2) : [];
  const X = f => (f <= 0 ? S.xD : G.posLog(f, S.xL, S.x1));
  const vmax = vmaxV ?? Math.max(1, Math.ceil(Math.max(0, ...raies.map(r => r.a)) * 1.15));
  const Yv = v => S.yB - v / vmax * (S.yB - S.yT), YA = a => S.yB - a * (S.yB - S.yT);

  // ---------- interaction : poignées de fréquence de coupure ----------
  const deux = nPoignees === 2;
  const pose = (qui, f) => {
    const v = clamp(G.arrondiF(f), G.F_MIN, G.F_MAX);
    if (!deux) { setF1(v); return; }
    if (qui === 1) setF1(Math.min(v, G.arrondiF(f2 / G.ECART_MIN * 1.0001)));
    else setF2(Math.max(v, G.arrondiF(f1 * G.ECART_MIN * 0.9999)));
  };
  const poser = (ev, qui) => { const { X: x } = coordSvg(svgRef.current, ev); pose(qui, G.freqDepuisPos(x, S.xL, S.x1)); };
  const quiProche = ev => { if (!deux) return 1; const { X: x } = coordSvg(svgRef.current, ev); return Math.abs(x - X(f1)) <= Math.abs(x - X(f2)) ? 1 : 2; };
  const drag = nPoignees ? {
    onPointerDown: ev => { ev.stopPropagation(); const q = quiProche(ev); ev.currentTarget.setPointerCapture(ev.pointerId); ev.currentTarget.dataset.d = String(q); poser(ev, q); },
    onPointerMove: ev => { const q = Number(ev.currentTarget.dataset.d); if (q) poser(ev, q); },
    onPointerUp: ev => { ev.currentTarget.dataset.d = ''; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } },
  } : {};
  const clavier = (qui, f) => ev => {
    const d = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : ev.key === 'PageUp' ? 12 : ev.key === 'PageDown' ? -12 : 0;
    if (d) { ev.preventDefault(); pose(qui, G.borne(f * 10 ** (d / 12))); }
  };

  // ---------- signal temporel ----------
  let tempsSvg = null;
  if (temps) {
    const { Tw, n } = G.fenetre(raies.length ? raies : [G.raie(1000, 1)]);
    const vT = Math.max(1, Math.ceil(G.amplitudeMax(raies) * 1.05)), cy = (T.yT + T.yB) / 2, h = (T.yB - T.yT) / 2;
    const ligne = rs => { const p = []; for (let i = 0; i <= n; i++) p.push(`${(T.x0 + i / n * (T.x1 - T.x0)).toFixed(1)},${(cy - G.valeur(rs, tau * Tw + i / n * Tw) / vT * h).toFixed(1)}`); return p.join(' '); };
    tempsSvg = (
      <g>
        <rect x="4" y="4" width={W - 8} height={T.yB + 24 - 4} rx="16" fill="#f8fafc" stroke={COUL.grille}/>
        <text x={T.x0} y="26" fontSize={fz(13.5)} fontWeight="800" fill={COUL.txt}>Signal en fonction du temps</text>
        {sortie && <g><text x={T.x1} y="26" textAnchor="end" fontSize={fz(13)} fontWeight="800" fill={COUL.us}>sortie</text><text x={T.x1 - fz(50)} y="26" textAnchor="end" fontSize={fz(13)} fontWeight="800" fill={COUL.ue}>entrée</text></g>}
        {!sortie && <text x={T.x1} y="26" textAnchor="end" fontSize={fz(13)} fontWeight="800" fill={COUL.ue}>tension</text>}
        <rect x={T.x0} y={T.yT} width={T.x1 - T.x0} height={T.yB - T.yT} fill="#fff" stroke="#94a3b8" strokeWidth="1.6"/>
        <line x1={T.x0} x2={T.x1} y1={cy} y2={cy} stroke="#94a3b8" strokeWidth="1.2"/>
        {[-vT, vT].map(v => <g key={`tv${v}`}><line x1={T.x0 - 4} x2={T.x0} y1={cy - v / vT * h} y2={cy - v / vT * h} stroke="#64748b"/><text x={T.x0 - 7} y={cy - v / vT * h + 4.5} textAnchor="end" fontSize={fz(12.5)} fill={COUL.gris}>{v > 0 ? '+' : '−'}{vT}</text></g>)}
        <text x={T.x0 - 7} y={cy + 4.5} textAnchor="end" fontSize={fz(12.5)} fill={COUL.gris}>0</text>
        <clipPath id={`${id}t`}><rect x={T.x0} y={T.yT} width={T.x1 - T.x0} height={T.yB - T.yT}/></clipPath>
        <g clipPath={`url(#${id}t)`}>
          <polyline points={ligne(raies)} fill="none" stroke={COUL.ue} strokeWidth="2.6" strokeLinejoin="round"/>
          {sortie && <polyline points={ligne(out)} fill="none" stroke={COUL.us} strokeWidth="2.8" strokeLinejoin="round"/>}
        </g>
        <text x={T.x0} y={T.yB + 20} fontSize={fz(12.5)} fill={COUL.gris}>tension en V</text>
        <text x={T.x1} y={T.yB + 20} textAnchor="end" fontSize={fz(12.5)} fill={COUL.gris}>durée affichée : {txtT(Tw)}</text>
      </g>);
  }

  // ---------- spectre ----------
  const decs = [10, 100, 1000, 1e4, 1e5], mineurs = [];
  for (const dd of [10, 100, 1000, 1e4]) for (let m = 2; m <= 9; m++) mineurs.push(dd * m);
  const labDec = v => (etroit ? (v >= 1000 ? `${v / 1000}k` : `${v}`) : (v >= 1000 ? `${v / 1000} kHz` : `${v} Hz`));
  const pts = [];
  if (courbe) for (let k = 0; k <= 200; k++) { const fr = 10 ** (1 + 4 * k / 200); pts.push(`${X(fr).toFixed(1)},${YA(gain(fr)).toFixed(1)}`); }
  const pasV = vmax > 5 ? 2 : 1, ticksV = []; for (let v = 0; v <= vmax + 1e-9; v += pasV) ticksV.push(v);
  const portes = cahier ? [...cahier.utiles.map(f => ({ f, vert: true })), ...cahier.parasites.map(f => ({ f, vert: false }))].map(p => {
    const a = gain(p.f), ok = statut && (p.vert ? a >= G.A_PASSE - 1e-9 : a <= G.A_COUPE + 1e-9); return { ...p, ok };
  }) : [];
  const hauteurBarre = (r, o) => (o ? Yv(r.a * (1 + (G.gainFiltre(type, r.f, f1, f2) - 1) * clamp(prog, 0, 1))) : Yv(r.a));
  const spectreSvg = (
    <g>
      <rect x="4" y={oy + 4} width={W - 8} height={S.yB - oy + 76} rx="16" fill="#f8fafc" stroke={COUL.grille}/>
      <text x={S.xD - fz(30)} y={oy + 26} fontSize={fz(13.5)} fontWeight="800" fill={COUL.txt}>{titreSpectre}</text>
      {/* quadrillage */}
      {ticksV.map(v => <line key={`gy${v}`} x1={S.xD - 26} x2={S.x1} y1={Yv(v)} y2={Yv(v)} stroke={v === 0 ? '#334155' : '#e2e8f0'} strokeWidth={v === 0 ? 1.8 : 1}/>)}
      {decs.map(v => <line key={`gx${v}`} x1={X(v)} x2={X(v)} y1={S.yT} y2={S.yB} stroke="#e2e8f0" strokeWidth="1"/>)}
      {mineurs.map(v => <line key={`mx${v}`} x1={X(v)} x2={X(v)} y1={S.yB} y2={S.yB + 5} stroke="#64748b" strokeWidth="1"/>)}
      <line x1={S.xD - 26} x2={S.xD - 26} y1={S.yT} y2={S.yB} stroke="#334155" strokeWidth="1.8"/>
      <line x1={S.xL - 14} x2={S.xL - 6} y1={S.yB + 4} y2={S.yB - 4} stroke="#334155" strokeWidth="2"/><line x1={S.xL - 8} x2={S.xL} y1={S.yB + 4} y2={S.yB - 4} stroke="#334155" strokeWidth="2"/>
      {ticksV.map(v => <text key={`ty${v}`} x={S.xD - 31} y={Yv(v) + 4.5} textAnchor="end" fontSize={fz(12.5)} fill={COUL.gris}>{v}</text>)}
      <text x={S.xD - 31} y={S.yT - 8} textAnchor="end" fontSize={fz(12.5)} fontWeight="800" fill={COUL.gris}>V</text>
      <text x={S.xD} y={S.yB + 25} textAnchor="middle" fontSize={fz(12.5)} fontWeight="700" fill={COUL.gris}>0 Hz</text>
      {decs.map(v => <text key={`tx${v}`} x={X(v)} y={S.yB + 25} textAnchor={v === 10 ? 'start' : v === 1e5 ? 'end' : 'middle'} fontSize={fz(12.5)} fill={COUL.gris}>{labDec(v)}</text>)}
      <text x={S.x1} y={S.yB + 46} textAnchor="end" fontSize={fz(12.5)} fill={COUL.gris}>{etroit ? 'f en Hz (échelle logarithmique, ×10 par graduation)' : 'f (échelle logarithmique : une graduation = ×10)'}</text>
      {courbe && <>
        {[0, 0.5, 1].map(a => <text key={`ta${a}`} x={S.x1 + 6} y={YA(a) + 4.5} fontSize={fz(12.5)} fill={COUL.courbe}>{G.nbf(a, a === 0.5 ? 1 : 0)}</text>)}
        <text x={S.x1 + 6} y={S.yT - 8} fontSize={fz(13)} fontWeight="800" fill={COUL.courbe}>A</text>
      </>}
      {/* portes du cahier des charges */}
      {portes.map((p, i) => {
        const x = X(p.f), y0 = p.vert ? YA(1) : YA(G.A_COUPE), y1 = p.vert ? YA(G.A_PASSE) : YA(0), c = p.ok ? COUL.ok : p.vert ? '#16a34a' : COUL.ko;
        return <g key={`po${i}`}><rect x={x - 11} y={y0} width="22" height={y1 - y0} rx="4" fill={c} opacity={p.ok ? 0.34 : 0.18} stroke={c} strokeWidth={p.ok ? 2.8 : 1.8} strokeDasharray={p.ok ? undefined : '5 3'}/>
          <text x={x} y={p.vert ? y0 - 5 : y1 + 15} textAnchor="middle" fontSize={fz(12)} fontWeight="800" fill={c} {...halo}>{p.ok ? '✓' : p.vert ? 'A ≥ 0,9' : 'A ≤ 0,1'}</text></g>;
      })}
      {/* raies */}
      {raies.map((r, i) => {
        const x = X(r.f), hy = Yv(r.a), ho = hauteurBarre(r, true), dec = sortie ? bw / 2 + 1.5 : 0;
        return (<g key={`r${i}`}>
          <rect x={x - dec - bw / 2} y={hy} width={bw} height={S.yB - hy} rx="2.5" fill={COUL.ue} opacity={sortie ? 0.9 : 1}/>
          <circle cx={x - dec} cy={hy} r={bw / 2 + 0.5} fill={COUL.ue} stroke="#fff" strokeWidth="1.2"/>
          {sortie && <><rect x={x + dec - bw / 2} y={ho} width={bw} height={Math.max(0, S.yB - ho)} rx="2.5" fill={COUL.us}/><circle cx={x + dec} cy={ho} r={bw / 2 + 0.5} fill={COUL.us} stroke="#fff" strokeWidth="1.2"/></>}
          {valeurs && <text x={x - dec} y={hy - 9} textAnchor="middle" fontSize={fz(12)} fontWeight="800" fill={COUL.ue} {...halo}>{vTxt(r.a)}</text>}
          {valeurs && sortie && <text x={x + dec + (etroit ? 6 : 14)} y={Math.min(ho, S.yB - 8) - 9} textAnchor="middle" fontSize={fz(12)} fontWeight="800" fill={COUL.us} {...halo}>{vTxt(out[i].a)}</text>}
        </g>);
      })}
      {/* courbe A(f) du filtre */}
      {courbe && <>
        <polyline points={pts.join(' ')} fill="none" stroke={COUL.courbe} strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="1 0"/>
        <circle cx={S.xD} cy={YA(gain(0))} r="5.5" fill={COUL.courbe} stroke="#fff" strokeWidth="2"/>
        {raies.map((r, i) => <circle key={`pa${i}`} cx={X(r.f)} cy={YA(gain(r.f))} r="5" fill="#fff" stroke={COUL.courbe} strokeWidth="2.6"/>)}
      </>}
      {/* poignées */}
      {nPoignees > 0 && <rect x={S.xL - 6} y={S.yT} width={S.x1 - S.xL + 12} height={S.yB - S.yT + 24} fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} {...drag}/>}
      {[[1, f1, COUL.poignee], [2, f2, COUL.poignee2]].slice(0, nPoignees).map(([q, f, c]) => {
        const x = X(f), nom = deux ? `fc${q === 1 ? '1' : '2'}` : 'fc', bx = clamp(x, S.xL + 12, S.x1 - 52);
        return (<g key={`h${q}`}>
          <line x1={x} x2={x} y1={S.yT - 6} y2={S.yB} stroke={c} strokeWidth="1.8" strokeDasharray="6 4"/>
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label={`Fréquence de coupure ${nom} : flèches gauche et droite pour changer, une graduation du clavier vaut un douzième de décade`} aria-valuemin={G.F_MIN} aria-valuemax={G.F_MAX} aria-valuenow={Math.round(f)} aria-valuetext={G.fTxt(f)}
            {...drag} onKeyDown={clavier(q, f)}>
            <circle className="xa-anneau" cx={x} cy={S.yB} r="17" fill="transparent" stroke="transparent"/>
            {!touche && q === 1 && <circle className="xa-pulse" cx={x} cy={S.yB} r="17" fill="none" stroke={c} strokeWidth="3"/>}
            <circle cx={x} cy={S.yB} r="10.5" fill={c} stroke="#fff" strokeWidth="3"/>
            <path d={`M ${x - 4} ${S.yB - 1} l 4 -5 l 4 5 M ${x - 4} ${S.yB + 2} l 4 5 l 4 -5`} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" transform={`rotate(90 ${x} ${S.yB})`}/>
          </g>
          <g transform={`translate(${bx} ${S.yT + (q === 1 ? 14 : 42)})`}>
            <rect x="-50" y="-14" width="100" height="23" rx="11.5" fill={c}/>
            <text x="0" y="2" textAnchor="middle" fontSize={fz(13.5)} fontWeight="800" fill="#fff">{nom} = {G.fTxt(f)}</text>
          </g>
        </g>);
      })}
      {legende && <g>
        <rect x={S.xD - 26} y={S.yB + 52} width="12" height="12" rx="3" fill={COUL.ue}/><text x={S.xD - 10} y={S.yB + 63} fontSize={fz(12.5)} fill={COUL.txt}>entrée</text>
        {sortie && <><rect x={S.xD + fz(40)} y={S.yB + 52} width="12" height="12" rx="3" fill={COUL.us}/><text x={S.xD + fz(56)} y={S.yB + 63} fontSize={fz(12.5)} fill={COUL.txt}>sortie (raie × A)</text></>}
        {courbe && <><line x1={S.xD + fz(sortie ? 160 : 40)} x2={S.xD + fz(sortie ? 178 : 58)} y1={S.yB + 58} y2={S.yB + 58} stroke={COUL.courbe} strokeWidth="3.4"/><text x={S.xD + fz(sortie ? 183 : 63)} y={S.yB + 63} fontSize={fz(12.5)} fill={COUL.txt}>courbe A(f)</text></>}
      </g>}
    </g>);

  return (
    <svg ref={svgRef} className="xa-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} style={{ background: '#fff' }}>
      {tempsSvg}{spectreSvg}
    </svg>);
}
