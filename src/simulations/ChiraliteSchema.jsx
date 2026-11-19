/* eslint-disable react-refresh/only-export-components -- fichier de dessins : les constantes de couleur sont partagées avec la simulation */
// Schémas de la simulation « Chiralité et configuration R/S » : dessin de Cram (un ou deux carbones) et vue qui tourne jusqu'à l'axe C → 4.
// Règles de dessin : chaque carbone dessiné a EXACTEMENT 4 liaisons (H compris), repérées par data-liaison ; police ≥ 20 dans un viewBox de 420.
import * as M from './chiraliteModele';

export const COUL_RANG = { 1: '#b91c1c', 2: '#c2410c', 3: '#1d4ed8', 4: '#475569' };
export const COUL_GROUPE = ['#0f766e', '#b45309', '#6d28d9', '#475569'];
const ENCRE = '#0f172a';
const LAY = { A: [-78, -56], B: [78, -56], W: [48, 78], D: [-48, 78] };       // dessin conventionnel (y vers le bas), pour l'orientation « bas »
const vec2D = (orient, e) => (orient === 'bas' ? LAY[e] : [-LAY[e][0], -LAY[e][1]]);
const largeur = t => 12.2 * [...t].length;
export const R_C = 15;                                                         // rayon du rond du carbone

function Liaison({ type, x1, y1, x2, y2, bout = 3 }) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux;
  const sx = x1 + ux * R_C, sy = y1 + uy * R_C, ex = x2 - ux * bout, ey = y2 - uy * bout;
  if (type === 'avant') {      // coin plein : pointe au carbone, base large vers le groupe
    const w = 8.5;
    return <polygon data-liaison="1" data-type="avant" points={`${sx},${sy} ${ex + px * w},${ey + py * w} ${ex - px * w},${ey - py * w}`} fill={ENCRE}/>;
  }
  if (type === 'arriere') {    // tirets de plus en plus longs
    const traits = []; const n = 7;
    for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, w = 1.5 + 8 * f; const cx = sx + (ex - sx) * f, cy = sy + (ey - sy) * f; traits.push(<line key={k} x1={cx + px * w} y1={cy + py * w} x2={cx - px * w} y2={cy - py * w} stroke={ENCRE} strokeWidth="3"/>); }
    return <g data-liaison="1" data-type="arriere">{traits}</g>;
  }
  return <line data-liaison="1" data-type="plan" x1={sx} y1={sy} x2={ex} y2={ey} stroke={ENCRE} strokeWidth="3.4" strokeLinecap="round"/>;
}

const TYPE_DE = { A: 'plan', B: 'plan', W: 'avant', D: 'arriere' };

// props : mol, affs (tableau d'une disposition, ou de deux pour une chaîne), rangs ({ j: n }), couleurs ({ j: '#…' }),
//         miroir (réfléchit le dessin), onChoisir(j) (groupes cliquables), noms (affiche C2, C3), cacheCentre
export function Cram({ mol, affs, rangs = null, couleurs = null, miroir = false, onChoisir = null, ariaLabel, hauteur = null }) {
  const chaine = affs.length === 2;
  const W = 420, Hh = hauteur || (chaine ? 292 : 262);
  const X = x => (miroir ? W - x : x);
  const carbones = chaine
    ? [{ c: mol.chaine.c1, aff: affs[0], x: 155, y: 172 }, { c: mol.chaine.c2, aff: affs[1], x: 233, y: 116 }]
    : [{ c: mol.centres[0], aff: affs[0], x: 210, y: 112 }];
  const el = [];
  carbones.forEach((cb, ic) => {
    const asym = M.estAsymetrique(mol.g, cb.c);
    const group = [];
    M.EMPLACEMENTS.forEach(e => {
      const j = cb.aff[e], [dx, dy] = vec2D(cb.aff.orient, e), x2 = cb.x + dx, y2 = cb.y + dy;
      const autre = chaine && carbones.find(o => o.c === j);
      if (autre) { group.push(<Liaison key={e} type="plan" bout={0} x1={X(cb.x)} y1={cb.y} x2={(X(cb.x) + X(autre.x)) / 2} y2={(cb.y + autre.y) / 2} />); return; }
      const etiq = M.etiquette(mol, cb.c, j), w = largeur(etiq), rang = rangs && rangs[j], col = couleurs && couleurs[j];
      const sens = dx > 0 ? 1 : -1; const xl = X(x2) + (miroir ? -1 : 1) * sens * (w / 2 + 8);   // étiquette à côté de l'extrémité, du côté du dessin
      const vertical = Math.abs(dy) > 70;                                                          // coin plein ou tirets : étiquette en dessous (ou au-dessus pour l'orientation « haut »)
      const lx = vertical ? X(x2) + (miroir ? -1 : 1) * sens * 4 : xl, ly = vertical ? y2 + (dy > 0 ? 25 : -12) : y2 + 7;
      const couleurTxt = col || (rang ? COUL_RANG[rang] : ENCRE);
      const Tag = onChoisir ? 'g' : 'g';
      group.push(
        <g key={e}>
          <Liaison type={TYPE_DE[e]} x1={X(cb.x)} y1={cb.y} x2={X(x2)} y2={y2} />
          <Tag {...(onChoisir ? { role: 'button', tabIndex: 0, 'aria-label': `Groupe ${etiq}`, style: { cursor: 'pointer' }, onClick: () => onChoisir(j), onKeyDown: ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onChoisir(j); } } } : {})}>
            {onChoisir && <rect x={lx - w / 2 - 8} y={ly - 24} width={w + 16} height={36} rx="8" fill="#ffffff" fillOpacity="0.01" stroke="none"/>}
            <text data-groupe={etiq} x={lx} y={ly} textAnchor="middle" fontSize="21" fontWeight="800" fill={couleurTxt}>{etiq}</text>
            {rang && (() => { const cote = Math.sign(X(x2) - X(cb.x)) || 1; const bx = vertical ? lx + cote * (w / 2 + 17) : lx, by = vertical ? ly - 6 : ly - 33;
              return <g><circle cx={bx} cy={by} r="13" fill={COUL_RANG[rang]} /><text x={bx} y={by + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{rang}</text></g>; })()}
          </Tag>
        </g>);
    });
    el.push(<g key={ic} data-carbone={cb.c}>
      {group}
      <circle cx={X(cb.x)} cy={cb.y} r={R_C} fill="#fff" stroke={asym ? '#b45309' : '#64748b'} strokeWidth="2.6"/>
      <text x={X(cb.x)} y={cb.y + 6} textAnchor="middle" fontSize={chaine ? 16 : 19} fontWeight="800" fill={asym ? '#b45309' : '#475569'}>{chaine ? `C${mol.numeros[ic]}` : asym ? 'C*' : 'C'}</text>
    </g>);
  });
  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} role="img" aria-label={ariaLabel || `Représentation de Cram de ${mol.nom}`} style={{ width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto' }}>
      {el}
    </svg>);
}

// ───────────── vue qui tourne : de la vue de face (Cram) jusqu'à la vue dans l'axe C → 4 ─────────────
// t de 0 à 1 ; rangs : { j: n } (badges) ; fleche : affiche l'arc 1 → 2 → 3 (sens horaire ou antihoraire)
export function VueAxe({ mol, c, aff, t, avecRangs = true, fleche = false, ariaLabel }) {
  const W = 420, H = 330, cx = 210, cy = 160, L = 80;
  const R = M.cameraA(mol.g, c, aff, t);
  const cl = M.classementCIP(mol.g, c);
  const rangDe = j => cl.ordre.findIndex(x => x.j === j) + 1;
  const items = M.EMPLACEMENTS.map(e => aff[e]).map(j => {
    const [x, y, z] = M.projeter(R, M.vecteur3D(aff, j));
    return { j, x, y, z, rang: rangDe(j), etiq: M.etiquette(mol, c, j) };
  });
  const derriere = items.find(i => Math.hypot(i.x, i.y) < 0.2 && i.z < 0);       // le groupe qui passe exactement derrière le carbone
  const ordreDessin = [...items].sort((a, b) => a.z - b.z);
  const sens = M.sensDansLAxe(mol.g, c, aff);
  const rayonArc = 46;
  // points de l'arc 1 → 2 → 3 : direction écran du groupe (y vers le haut) → coordonnées SVG (y vers le bas)
  const ptsArc = [1, 2, 3].map(r => { const it = items.find(i => i.rang === r); const n = Math.hypot(it.x, it.y) || 1; return [cx + rayonArc * it.x / n, cy - rayonArc * it.y / n]; });
  const sweep = sens === 'horaire' ? 1 : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel || 'Molécule vue de face qui tourne jusqu’à la vue dans l’axe du carbone vers le groupe de priorité 4'} style={{ width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto' }}>
      <defs>
        <marker id="fl-axe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#0f172a"/></marker>
      </defs>
      {derriere && <circle cx={cx} cy={cy} r="26" fill="#e2e8f0" stroke="#94a3b8" strokeDasharray="5 4" strokeWidth="2"/>}
      {ordreDessin.map(it => {
        const x2 = cx + L * it.x, y2 = cy - L * it.y, prof = (it.z + 1) / 2;
        const cache = derriere && it.j === derriere.j;
        const col = avecRangs ? COUL_RANG[it.rang] : ENCRE;
        const dxl = x2 - cx, dyl = -(cy - y2);
        const proche0 = Math.hypot(dxl, dyl) < 18;
        const lx = proche0 ? cx : x2 + (dxl > 12 ? 1 : dxl < -12 ? -1 : 0) * (largeur(it.etiq) / 2 + 12);
        const ly = proche0 ? cy + 56 : y2 + (Math.abs(dxl) <= 12 ? (dyl < 0 ? -22 : 30) : 8);
        return (
          <g key={it.j} opacity={0.55 + 0.45 * prof}>
            {!cache && <line data-liaison="1" x1={cx} y1={cy} x2={x2} y2={y2} stroke={ENCRE} strokeWidth={2 + 3.4 * prof} strokeLinecap="round"/>}
            {!cache && <text x={lx} y={ly} textAnchor="middle" fontSize="21" fontWeight="800" fill={col}>{it.etiq}</text>}
            {avecRangs && !cache && <g><circle cx={lx} cy={ly - 30} r="12" fill={COUL_RANG[it.rang]}/><text x={lx} y={ly - 24} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">{it.rang}</text></g>}
          </g>);
      })}
      <circle cx={cx} cy={cy} r={R_C} fill="#fff" stroke="#b45309" strokeWidth="2.6"/>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="19" fontWeight="800" fill="#b45309">C*</text>
      {fleche && t > 0.97 && (
        <g>
          <path d={`M ${ptsArc[0][0]} ${ptsArc[0][1]} A ${rayonArc} ${rayonArc} 0 0 ${sweep} ${ptsArc[1][0]} ${ptsArc[1][1]}`} fill="none" stroke="#0f172a" strokeWidth="3.4" markerEnd="url(#fl-axe)"/>
          <path d={`M ${ptsArc[1][0]} ${ptsArc[1][1]} A ${rayonArc} ${rayonArc} 0 0 ${sweep} ${ptsArc[2][0]} ${ptsArc[2][1]}`} fill="none" stroke="#0f172a" strokeWidth="3.4" markerEnd="url(#fl-axe)"/>
        </g>)}
      {derriere && <g><circle cx={cx - 78} cy={H - 44} r="12" fill={avecRangs ? COUL_RANG[derriere.rang] : '#475569'}/><text x={cx - 78} y={H - 38} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">{avecRangs ? derriere.rang : '?'}</text>
        <text x={cx - 58} y={H - 38} fontSize="20" fontWeight="800" fill="#334155">{derriere.etiq} est caché derrière C</text></g>}
      <text x={cx} y={H - 10} textAnchor="middle" fontSize="19" fontWeight="700" fill="#334155">{t > 0.97 ? 'vue dans l’axe C → 4' : t < 0.03 ? 'vue de face (dessin de Cram)' : 'la molécule tourne…'}</text>
    </svg>);
}
