import * as M from "./lunetteModele";
import { FormeOeil, C } from "./oeilLoupeSchema";
import { nbf } from "./Travail";
import { CouchePhotons, Poignee } from "./lentilleMinceAnim";

// Schéma de principe de la lunette astronomique : TSTL, simulation 120 et cartes « À retenir ».
// Non à l'échelle (focales compressées, angles et A1B1 agrandis) mais géométriquement cohérent : les rayons sont tracés à travers deux lentilles minces
// d'échelle réduite ; l'écart e = O1O2 − f1′ − f2′ du modèle est reporté (agrandi) sur la distance des lentilles.
const etroit = () => typeof window !== 'undefined' && window.innerWidth < 600;
const fr = (x, n = 1) => nbf(x, n);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const COUL = { obj: '#0f172a', inter: '#b45309', rayon1: '#0072b2', rayon2: '#d55e00', ok: '#15803d', ko: '#dc2626', theta: '#7c3aed' };
const X1 = 70, KS = 5;

export function SchemaLunette({ d, f1 = 800, f2 = 20, theta0 = 2, oeil = 'normal', cotes = null, montre = {}, large = 700, label, lum = null, poignee = null, refSvg = null }) {
  const { inter = true, F = true, statut = true, theta = false, noms = true } = montre;
  const fk = etroit() ? 2.1 : 1, fs = 13.5 * fk, haut = (fk > 1 ? (cotes ? 440 : 400) : (cotes ? 312 : 260)) + (poignee ? 50 : 0), y0 = haut / 2 + (cotes ? 0 : 0);
  const f1v = 190 + 0.14 * f1, f2v = 40 + 1.6 * f2, e = M.ecart(d, f1, f2);
  const ev = clamp(e * KS, -f2v + 24, 60), X2 = X1 + f1v + f2v + ev, XA1 = X1 + f1v, XE = X2 + f2v;
  const a = 0.05 + (clamp(theta0, M.THETA_MIN, M.THETA_MAX) - M.THETA_MIN) / (M.THETA_MAX - M.THETA_MIN) * 0.09;   // pente (exagérée) des rayons issus de B0
  const Y = u => y0 - u, hL = 52;
  const m1 = -a - hL / f1v;                                          // pente de R2 après L1
  const y2a = -a * (X2 - X1), y2b = hL + m1 * (X2 - X1);             // hauteurs sur L2 de R1 (par O1) et R2 (bord de l'objectif)
  const o1 = -a - y2a / f2v, o2 = m1 - y2b / f2v;                    // pentes après L2
  const pv = f2v + ev, chef = a * f1v / pv;                          // rayon central issu de B1 par O2
  const eLen = 17 * 3.2, Ke = 3.2, XRet = XE + eLen, yP = chef * eLen;
  const V = M.vergenceSortie(d, f1, f2), netOk = M.net(d, f1, f2, oeil), afo = M.afocale(d, f1, f2);
  const nature = M.natureA2(d, f1, f2);
  const pol = pts => pts.map(([x, y]) => `${x},${y}`).join(' ');
  const xs = 8;
  const r1 = [[xs, Y(a * (X1 - xs))], [X1, Y(0)], [X2, Y(y2a)], [XE, Y(y2a + o1 * f2v)]];
  const r2 = [[xs, Y(hL + a * (X1 - xs))], [X1, Y(hL)], [X2, Y(y2b)], [XE, Y(y2b + o2 * f2v)]];
  const txtStatut = afo && oeil === 'normal' ? 'lunette afocale : image à l’infini' : netOk ? 'image nette pour cet œil' : nature === 'virtuelle' ? 'image virtuelle trop proche : floue' : nature === 'reelle' ? 'image définitive réelle : l’œil ne voit rien de net' : 'image à l’infini : floue pour cet œil';
  const court = netOk ? (afo && oeil === 'normal' ? 'afocale : au point' : 'image nette') : 'image floue';
  const lent = (x, c, nom) => (
    <g>
      <line x1={x} y1={y0 - 74} x2={x} y2={y0 + 74} stroke={c} strokeWidth="4"/>
      <polygon points={`${x},${y0 - 82} ${x - 7},${y0 - 66} ${x + 7},${y0 - 66}`} fill={c}/><polygon points={`${x},${y0 + 82} ${x - 7},${y0 + 66} ${x + 7},${y0 + 66}`} fill={c}/>
      {noms && <text x={x} y={y0 - 88} textAnchor="middle" fontSize={fs} fontWeight="800" fill={c}>{nom}</text>}
    </g>);
  const halo = { paintOrder: 'stroke', stroke: '#fff', strokeWidth: 4, strokeLinejoin: 'round' };
  return (
    <svg ref={refSvg} viewBox={`0 0 ${large} ${haut}`} role="img" aria-label={label || `Lunette astronomique : l’objectif de distance focale ${fr(f1, 0)} millimètres donne d’un objet à l’infini une image intermédiaire dans son plan focal image ; l’oculaire de distance focale ${fr(f2, 0)} millimètres la regarde comme une loupe`}
      style={{ width: '100%', height: 'auto', display: 'block', background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 10 }}>
      <line x1="8" y1={y0} x2={large - 8} y2={y0} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="8 4"/>
      {/* foyers : F1′ (foyer image de l'objectif) et F2 (foyer objet de l'oculaire) */}
      {F && <g>
        <circle cx={XA1} cy={y0} r="4.5" fill="#fff" stroke={C.foyer} strokeWidth="2.2"/>
        <text x={XA1} y={y0 + 40 + 14 * fk} textAnchor="middle" fontSize={fs} fontWeight="800" fill={C.foyer} style={halo}>{fk > 1 ? 'F₁′' : 'F₁′ (plan focal image)'}</text>
        <line x1={X2 - f2v} y1={y0 - 46} x2={X2 - f2v} y2={y0 + 46} stroke={C.foyer} strokeWidth="1.2" strokeDasharray="3 4" opacity="0.0"/>
        <circle cx={X2 - f2v} cy={y0} r="3" fill={C.foyer}/>
        {fk === 1 && <text x={X2 - f2v} y={y0 - 10} textAnchor="middle" fontSize={fs} fontWeight="800" fill={C.foyer} style={halo}>F₂</text>}
      </g>}
      {lent(X1, C.lent, 'objectif')}{lent(X2, C.lent, 'oculaire')}
      <polyline points={pol(r1)} fill="none" stroke={COUL.rayon1} strokeWidth="2" strokeLinejoin="round"/>
      <polyline points={pol(r2)} fill="none" stroke={COUL.rayon2} strokeWidth="2" strokeLinejoin="round"/>
      {/* objet à l'infini : angle θ0 */}
      <line x1={xs} y1={Y(a * (X1 - xs))} x2={xs + 90} y2={Y(a * (X1 - xs))} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3"/>
      <text x={xs + 4} y={Y(a * (X1 - xs)) - 8} fontSize={fs} fontWeight="800" fill={COUL.obj} style={halo}>{noms ? (fk > 1 ? 'astre' : 'objet à l’infini') : ''}</text>
      {cotes && <text x={xs} y={Y(a * (X1 - xs)) + 18 * fk} fontSize={fs} fontWeight="800" fill={COUL.obj} style={halo}>θ₀ = {fr(theta0, 1)}{' '}mrad</text>}
      {/* image intermédiaire A1B1 dans le plan focal image de l'objectif */}
      {inter && <g><line x1={XA1} y1={y0} x2={XA1} y2={Y(-a * f1v) - 4} stroke={COUL.inter} strokeWidth="4"/><polygon points={`${XA1},${Y(-a * f1v) + 2} ${XA1 - 5},${Y(-a * f1v) - 9} ${XA1 + 5},${Y(-a * f1v) - 9}`} fill={COUL.inter}/>
        {noms && !cotes && <text x={XA1 + 10} y={y0 - 14 * fk} fontSize={fs} fontWeight="800" fill={COUL.inter} style={halo}>{fk > 1 ? 'A₁B₁' : 'image intermédiaire A₁B₁'}</text>}</g>}
      {cotes && inter && <text x={XA1 - 8} y={y0 - 20 * fk} textAnchor="end" fontSize={fs} fontWeight="800" fill={COUL.inter} style={halo}>A₁B₁ = {fr(cotes.A1B1, 2)}{' '}mm</text>}
      {cotes && <g fontSize={fs} fontWeight="800" style={halo}>
        <line x1={X1} y1={y0 + 100} x2={X2} y2={y0 + 100} stroke={COUL.theta} strokeWidth="1.8" style={{ stroke: COUL.theta }}/>
        <line x1={X1} y1={y0 + 94} x2={X1} y2={y0 + 106} style={{ stroke: COUL.theta }} strokeWidth="1.8"/><line x1={X2} y1={y0 + 94} x2={X2} y2={y0 + 106} style={{ stroke: COUL.theta }} strokeWidth="1.8"/>
        <text x={(X1 + X2) / 2} y={y0 + 100 + 18 * fk} textAnchor="middle" fill={COUL.theta}>O₁O₂ = {fr(d, 1)}{' '}mm</text>
      </g>}
      {/* œil */}
      <FormeOeil xL={XE} y0={y0} k={Ke} fe={17}/>
      <text x={XE + 6} y={y0 - 6.8 * Ke - 6} textAnchor="middle" fontSize={fs} fontWeight="800" fill={C.txt}>{oeil === 'myope' ? 'œil myope' : 'œil'}</text>
      <g stroke={COUL.rayon1} strokeWidth="1.8" fill="none"><line x1={XE} y1={Y(y2a + o1 * f2v)} x2={XRet} y2={netOk ? Y(yP) : Y(y2a + o1 * (f2v + eLen))}/></g>
      <g stroke={COUL.rayon2} strokeWidth="1.8" fill="none"><line x1={XE} y1={Y(y2b + o2 * f2v)} x2={XRet} y2={netOk ? Y(yP) : Y(y2b + o2 * (f2v + eLen))}/></g>
      {netOk && <circle cx={XRet} cy={Y(yP)} r="3.6" fill={COUL.ok} stroke="#fff" strokeWidth="1.2"/>}
      {theta && afo && <g><line x1={XE} y1={y0} x2={XE - 120} y2={Y(-chef * 120)} stroke={COUL.theta} strokeWidth="1.8" strokeDasharray="2 3"/>
        <text x={XE - 128} y={Y(-chef * 120) - 6} textAnchor="end" fontSize={fs + 2} fontWeight="800" fill={COUL.theta} style={halo}>θ₂</text></g>}
      {lum && (() => {
        const bout = [XRet, netOk ? Y(yP) : Y(y2a + o1 * (f2v + eLen))], bout2 = [XRet, netOk ? Y(yP) : Y(y2b + o2 * (f2v + eLen))];
        return <CouchePhotons chemins={[{ c: COUL.rayon1, pts: [...r1, bout] }, { c: COUL.rayon2, pts: [...r2, bout2] }]} lum={{ ...lum, k: fk > 1 ? 1.8 : 1 }}/>;
      })()}
      {poignee && <Poignee x={X2} y={y0 + (fk > 1 ? 150 : 130)} g={fk > 1 ? 1.9 : 1} coul={C.foyer} label="Oculaire : distance O₁O₂ (en mm)" valeur={d} vmin={poignee.vmin} vmax={poignee.vmax} texte={`${fr(d, 1)} mm`} touche={poignee.touche} onToucher={poignee.onToucher} pas={1}
        lire={e => { const r = refSvg.current.getBoundingClientRect(), x = (e.clientX - r.left) * large / r.width; return f1 + f2 + (x - (X1 + f1v + f2v)) / KS; }}
        set={poignee.set} zones={[[X2 - 22 * (fk > 1 ? 1.9 : 1), y0 - 90, 44 * (fk > 1 ? 1.9 : 1), 180]]}/>}
      {statut && <text x={large / 2} y={fk > 1 ? 30 : 22} textAnchor="middle" fontSize={fs} fontWeight="800" fill={netOk ? COUL.ok : COUL.ko}>{fk > 1 ? court : txtStatut}</text>}
      <text x="12" y={haut - 10} fontSize={11 * (fk > 1 ? 1.9 : 1)} fontWeight="700" fill="#64748b">{fk > 1 ? 'schéma non à l’échelle' : 'schéma non à l’échelle : focales compressées, angles et image intermédiaire agrandis'}</text>
    </svg>);
}
