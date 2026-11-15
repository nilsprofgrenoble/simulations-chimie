import * as M from "./microscopeModele";
import { FormeOeil, C } from "./oeilLoupeSchema";
import { nbf } from "./Travail";

// Schéma de principe du microscope (objectif + oculaire) : TSTL, simulation 118 et cartes « À retenir ».
// Le schéma est NON à l'échelle (objet, image intermédiaire et angles agrandis ; distances compressées) mais géométriquement cohérent :
// les rayons sont tracés avec deux lentilles minces d'échelle réduite (traçage de rayons), et la position de A1 par rapport au foyer F2
// de l'oculaire suit exactement l'écart réel s = O2A1 + f2′ du modèle (microscopeModele.js).
const etroit = () => typeof window !== 'undefined' && window.innerWidth < 600;
const fr = (x, n = 1) => nbf(x, n);
const fl = (x, y, ang, c, t = 6) => <polygon points={`0,0 ${-2 * t},${-t * 0.8} ${-2 * t},${t * 0.8}`} fill={c} transform={`translate(${x},${y}) rotate(${ang})`}/>;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const COUL = { obj: '#0f172a', inter: '#b45309', rayon1: '#0072b2', rayon2: '#d55e00', ok: '#15803d', ko: '#dc2626', theta: '#7c3aed' };

const LV = 350, X1 = 190, KS = 6;

// AB : taille réelle de l'objet (µm) → hauteur dessinée (5 à 14 px, non à l'échelle) ; cotes : { p (mm), A1B1 (mm) } ou null pour alléger le schéma.
export function SchemaMicroscope({ s = 0, f1 = 10, f2 = 25, AB = 20, cotes = null, montre = {}, large = 740, label }) {
  const { inter = true, F2 = true, statut = true, theta = false, noms = true } = montre;
  const H0 = 5 + (clamp(AB, M.AB_MIN, M.AB_MAX) - M.AB_MIN) / (M.AB_MAX - M.AB_MIN) * 9;
  const fk = etroit() ? 2.1 : 1, fs = 13.5 * fk, haut = fk > 1 ? (cotes ? 440 : 400) : (cotes ? 285 : 260), y0 = haut / 2;
  const X2 = X1 + LV, f1v = 40 + 1.5 * f1, f2v = 40 + 1.6 * f2, qF = LV - f2v;
  const sv = clamp(s * KS, -60, Math.min(60, f2v - 22)), q = qF + sv, p = f1v * q / (q - f1v);
  const X0 = X1 - p, XA1 = X1 + q, XF2 = X2 - f2v, XE = X2 + f2v;
  const Y = u => y0 - u;                                             // u : hauteur vers le haut (px)
  const h1 = H0 * q / p;                                             // hauteur (en valeur) de A1B1, renversée
  // rayons : R1 parallèle à l'axe avant L1 ; R2 par O1
  const sl1 = -H0 / f1v, m2 = -H0 / p;
  const hh1 = H0 + sl1 * LV, hh2 = m2 * LV;                          // hauteurs sur L2
  const o1 = sl1 - hh1 / f2v, o2 = m2 - hh2 / f2v;                   // pentes après L2
  const chef = h1 / (LV - q);                                        // pente (montante) du rayon central, par O2, issu de B1 (B1 est en −h1)
  const eLen = 17 * 3.2, Ke = 3.2, XRet = XE + eLen;
  const mapOk = Math.abs(M.vergenceSortie(s, f2)) <= M.VERGENCE_MAX;
  const sortie = (hh, o) => [[X2, Y(hh)], [XE, Y(hh + o * f2v)]];
  const yP = chef * eLen;                                            // point image sur la rétine (faisceau parallèle) : hauteur
  const pol = pts => pts.map(([x, y]) => `${x},${y}`).join(' ');
  const r1 = [[X0, Y(H0)], [X1, Y(H0)], [XA1, Y(-h1)], [X2, Y(hh1)], ...sortie(hh1, o1).slice(1)];
  const r2 = [[X0, Y(H0)], [X1, Y(0)], [XA1, Y(-h1)], [X2, Y(hh2)], ...sortie(hh2, o2).slice(1)];
  const nature = s > 1e-9 ? 'virtuelle' : s < -1e-9 ? 'reelle' : 'infini';
  const txtStatut = mapOk ? 'mise au point faite : image à l’infini' : nature === 'virtuelle' ? 'image définitive virtuelle, trop proche : floue' : 'image définitive réelle : l’œil ne voit rien de net';
  const lent = (x, c, nom, hLen = 74) => (
    <g>
      <line x1={x} y1={y0 - hLen} x2={x} y2={y0 + hLen} stroke={c} strokeWidth="4"/>
      <polygon points={`${x},${y0 - hLen - 8} ${x - 7},${y0 - hLen + 8} ${x + 7},${y0 - hLen + 8}`} fill={c}/><polygon points={`${x},${y0 + hLen + 8} ${x - 7},${y0 + hLen - 8} ${x + 7},${y0 + hLen - 8}`} fill={c}/>
      {noms && <text x={x} y={y0 - hLen - 14} textAnchor="middle" fontSize={fs} fontWeight="800" fill={c}>{nom}</text>}
    </g>);
  return (
    <svg viewBox={`0 0 ${large} ${haut}`} role="img" aria-label={label || `Microscope : l’objectif de distance focale ${fr(f1, 0)} millimètres donne de l’objet une image intermédiaire réelle et renversée ; l’oculaire de distance focale ${fr(f2, 0)} millimètres la regarde comme une loupe`}
      style={{ width: '100%', height: 'auto', display: 'block', background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 10 }}>
      <line x1="8" y1={y0} x2={large - 8} y2={y0} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="8 4"/>
      {/* plan focal objet de l'oculaire */}
      {F2 && <g><line x1={XF2} y1={y0 - 46} x2={XF2} y2={y0 + 46} stroke={C.foyer} strokeWidth="1.4" strokeDasharray="3 4"/>
        <circle cx={XF2} cy={y0} r="4.5" fill="#fff" stroke={C.foyer} strokeWidth="2.2"/>
        <text x={XF2} y={y0 + 46 + 14 * fk} textAnchor="middle" fontSize={fs} fontWeight="800" fill={C.foyer}>{fk > 1 ? 'F₂' : 'F₂ : plan focal objet'}</text></g>}
      {lent(X1, C.lent, 'objectif')}{lent(X2, C.lent, 'oculaire')}
      <polyline points={pol(r1)} fill="none" stroke={COUL.rayon1} strokeWidth="2" strokeLinejoin="round"/>
      <polyline points={pol(r2)} fill="none" stroke={COUL.rayon2} strokeWidth="2" strokeLinejoin="round"/>
      {/* objet A0B0 */}
      <line x1={X0} y1={y0} x2={X0} y2={Y(H0) + 5} stroke={COUL.obj} strokeWidth="4"/>{fl(X0, Y(H0) - 1, -90, COUL.obj, 6)}
      {noms && <text x={X0} y={y0 + 20 * fk} textAnchor="middle" fontSize={fs} fontWeight="800" fill={COUL.obj}>{fk > 1 ? 'objet' : 'objet A₀B₀'}</text>}
      {/* cotes (facultatives) : taille de l'objet, distance objet–objectif, taille de l'image intermédiaire */}
      {cotes && <g fontSize={fs} fontWeight="800" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 4, strokeLinejoin: 'round' }}>
        <text x="12" y={y0 - 30 * fk} fill={COUL.obj}>AB = {fr(AB, 0)}{' '}µm</text>
        <line x1={X0} y1={y0 + 92} x2={X1} y2={y0 + 92} style={{ stroke: COUL.theta }} strokeWidth="1.8"/>
        <line x1={X0} y1={y0 + 86} x2={X0} y2={y0 + 98} style={{ stroke: COUL.theta }} strokeWidth="1.8"/><line x1={X1} y1={y0 + 86} x2={X1} y2={y0 + 98} style={{ stroke: COUL.theta }} strokeWidth="1.8"/>
        <text x="12" y={y0 + 92 + 18 * fk} fill={COUL.theta}>|OA| = {fr(cotes.p, 3)}{' '}mm</text>
        {inter && <text x={X2 - 10} y={y0 - 20 * fk} textAnchor="end" fill={COUL.inter}>A₁B₁ = {fr(cotes.A1B1, 3)}{' '}mm</text>}
      </g>}
      {/* image intermédiaire A1B1 (réelle, renversée) */}
      {inter && <g><line x1={XA1} y1={y0} x2={XA1} y2={Y(-h1) - 4} stroke={COUL.inter} strokeWidth="4"/>{fl(XA1, Y(-h1) + 1, 90, COUL.inter, 6)}
        {noms && !cotes && <text x={XA1 + (fk > 1 ? -4 : 0)} y={y0 - 34 * fk} textAnchor="middle" fontSize={fs} fontWeight="800" fill={COUL.inter}>{fk > 1 ? 'A₁B₁' : 'image intermédiaire A₁B₁'}</text>}</g>}
      {/* œil */}
      <FormeOeil xL={XE} y0={y0} k={Ke} fe={17}/>
      <text x={XE + 6} y={y0 - 6.8 * Ke - 6} textAnchor="middle" fontSize={fs} fontWeight="800" fill={C.txt}>œil</text>
      {/* dans l'œil : rayons convergents sur la rétine si le faisceau est parallèle */}
      <g stroke={COUL.rayon1} strokeWidth="1.8" fill="none">
        <line x1={XE} y1={Y(hh1 + o1 * f2v)} x2={XRet} y2={mapOk ? Y(yP) : Y(hh1 + o1 * (f2v + eLen))}/>
      </g>
      <g stroke={COUL.rayon2} strokeWidth="1.8" fill="none">
        <line x1={XE} y1={Y(hh2 + o2 * f2v)} x2={XRet} y2={mapOk ? Y(yP) : Y(hh2 + o2 * (f2v + eLen))}/>
      </g>
      {mapOk && <circle cx={XRet} cy={Y(yP)} r="3.6" fill={COUL.ok} stroke="#fff" strokeWidth="1.2"/>}
      {theta && mapOk && <g><line x1={XE} y1={y0} x2={XE - 120} y2={Y(-chef * 120)} stroke={COUL.theta} strokeWidth="1.8" strokeDasharray="2 3"/>
        <text x={XE - 128} y={Y(-chef * 120) - 6} textAnchor="end" fontSize={fs + 2} fontWeight="800" fill={COUL.theta}>θ₂</text></g>}
      {statut && <text x={large / 2} y={fk > 1 ? 30 : 22} textAnchor="middle" fontSize={fs} fontWeight="800" fill={mapOk ? COUL.ok : COUL.ko}>{fk > 1 ? (mapOk ? 'image à l’infini : au point' : 'image floue : pas au point') : txtStatut}</text>}
      <text x="12" y={haut - 10} fontSize={11 * (fk > 1 ? 1.9 : 1)} fontWeight="700" fill="#64748b">{fk > 1 ? 'schéma non à l’échelle' : 'schéma non à l’échelle : objet, images, angles et distances modifiés pour la lisibilité'}</text>
    </svg>);
}
