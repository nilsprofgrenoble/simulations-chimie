// ====================================================
//  Schémas de la simulation 167 (mouvement circulaire et repère de Frenet ; niveau TG).
//  Scène : viewBox 400 × 330, textes de 15 à 18. Cartes « À retenir » : viewBox de 400, police ≥ 13, aucun indice en tspan
//  (indice = petit texte séparé), flèche au-dessus de CHAQUE lettre de vecteur (notation vectorielle).
//  Public daltonien : jamais la couleur seule. Vitesse = trait plein épais ; accélération = trait plein épais, étiquette « a » ;
//  composantes de l'accélération = traits en tirets ; repère (u_t, u_n) = traits fins ; chaque vecteur porte son nom écrit à côté.
// ====================================================
import { repere } from './frenetModele';
import { indicesProfond } from '../commun';

const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#b45309', gris: '#64748b', txt: '#0f172a', clair: '#cbd5e1' };

// ---------- outils de dessin ----------
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, tirets = false, tete = 11 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), t = tete, L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (t - 2) * Math.cos(a), by = y2 - (t - 2) * Math.sin(a);   // la tige s'arrête sous la pointe
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w} strokeDasharray={tirets ? '7 5' : undefined} strokeLinecap="butt"/>
      <polygon points={`${x2},${y2} ${x2 - t * Math.cos(a - 0.42)},${y2 - t * Math.sin(a - 0.42)} ${x2 - t * Math.cos(a + 0.42)},${y2 - t * Math.sin(a + 0.42)}`} fill={c}/>
    </g>);
};
// lettre-vecteur avec indice éventuel : flèche au-dessus de la lettre, indice = petit texte séparé (jamais de tspan)
const largeur = (s, i, l = 'x') => s * 0.62 * String(l).length + (i ? String(i).length * s * 0.52 : 0);
export const TVi = ({ x, y, l, i, c = COL.txt, s = 16, w = 700, ancre = 'start', frac, halo = true }) => {
  // frac (0 = texte qui commence en x, 1 = qui finit en x) : ancrage continu, pour que l'étiquette ne saute pas pendant l'animation
  const W = largeur(s, i, l), f = frac !== undefined ? frac : ancre === 'end' ? 1 : ancre === 'middle' ? 0.5 : 0, x0 = x - W * f, lw = s * 0.62 * String(l).length, yy = y - s * 0.9;
  const ha = halo ? { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' } : {};
  return (
    <g>
      <text x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...ha}>{l}</text>
      {i && <text x={x0 + lw} y={y + s * 0.28} fontSize={s * 0.85} fontWeight={w} fill={c} {...ha}>{i}</text>}
      <line x1={x0 + 1} y1={yy} x2={x0 + lw - 1} y2={yy} stroke={c} strokeWidth="1.6"/>
      <polyline points={`${x0 + lw - 4.5},${yy - 3} ${x0 + lw - 1},${yy} ${x0 + lw - 4.5},${yy + 3}`} fill="none" stroke={c} strokeWidth="1.6"/>
    </g>);
};
// texte simple avec halo blanc (lisible sur les traits)
const Tx = ({ x, y, children, c = COL.txt, s = 15, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' } : {})}>{children}</text>);
// étiquette d'un vecteur placée au bout de sa flèche, dans la direction (dx, dy) en coordonnées SVG
const Etiq = ({ bx, by, dx, dy, l, i, c, s = 16, decal = 13, lat = 0 }) => {
  const n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, px = -uy, py = ux;
  const X = bx + ux * decal + px * lat, Y = by + uy * decal + py * lat;
  // ancrage continu (pas de seuils) : l'étiquette glisse en douceur quand la direction tourne
  const borne = t => Math.max(-1, Math.min(1, t / 0.8));
  const yy = Y + s * 0.35 + borne(uy) * s * 0.45;
  return <TVi x={X} y={yy} l={l} i={i} c={c} s={s} frac={0.5 - 0.5 * borne(ux)}/>;
};
// repère de Frenet en M : ut et un unitaires du dessin (coordonnées SVG : y vers le bas)
const dirsSvg = theta => { const { ut, un } = repere(theta); return { ut: [ut[0], -ut[1]], un: [un[0], -un[1]] }; };

// ====================================================
//  SCÈNE : point M sur le cercle, repère de Frenet, vitesse, accélération et ses composantes
//  montre = { rep, vit, acc, comp } ; echV, echA : pixels par m/s et par m/s² (échelles annoncées sous le dessin)
// ====================================================
export function SceneFrenet({ theta, v, R, at, montre, echV = 26, echA = 14, aria, legende, sansEchA = false }) {
  const cx = 200, cy = 160, Rp = 92, c = Math.cos(theta), s = Math.sin(theta);
  const Mx = cx + Rp * c, My = cy - Rp * s;
  const { ut, un } = dirsSvg(theta);
  const U = 36;
  const an = v * v / R, Lv = v * echV, Lat = at * echA, Lan = an * echA;
  const aVec = [at * ut[0] + an * un[0], at * ut[1] + an * un[1]];

  const barV = echV * 1, barA = echA * 2;
  const lignes = [montre.vit && ['v', barV, COL.vert, '= 1 m/s (vitesse)'], (montre.acc || montre.comp) && !sansEchA && ['a', barA, COL.rouge, '= 2 m/s² (accélération)']].filter(Boolean);
  return (
    <svg viewBox="0 0 400 335" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      <circle cx={cx} cy={cy} r={Rp} fill="none" stroke={COL.gris} strokeWidth="2.5"/>
      <line x1={cx} y1={cy} x2={Mx} y2={My} stroke={COL.gris} strokeWidth="1.5" strokeDasharray="2 4"/>
      <circle cx={cx} cy={cy} r="3.5" fill={COL.txt}/><Tx x={cx - 26} y={cy + 7} s={20} w={600}>O</Tx>
      {/* sens du mouvement : petite flèche circulaire en haut à droite */}
      <polyline points={Array.from({ length: 24 }, (_, k) => { const a = rad(20 + k * 11.5); return `${(372 + 13 * Math.cos(a)).toFixed(1)},${(270 - 13 * Math.sin(a)).toFixed(1)}`; }).join(' ')} fill="none" stroke={COL.gris} strokeWidth="2.4"/>
      <Fleche x1={372 + 13 * Math.cos(rad(270))} y1={270 - 13 * Math.sin(rad(270)) - 0.1} x2={372 + 13 * Math.cos(rad(290)) + 0.2} y2={270 - 13 * Math.sin(rad(290))} c={COL.gris} w={2.4} tete={9}/>
      <Tx x={394} y={300} s={17} w={600} c={COL.gris} ancre="end" halo={false}>sens du mouvement</Tx>
      {/* vitesse */}
      {montre.vit && Lv > 4 && <g>
        <Fleche x1={Mx} y1={My} x2={Mx + ut[0] * Lv} y2={My + ut[1] * Lv} c={COL.vert} w={5}/>
        <Etiq bx={Mx + ut[0] * Lv} by={My + ut[1] * Lv} dx={ut[0]} dy={ut[1]} l="v" c={COL.vert} s={23} decal={16} lat={-18}/>
      </g>}
      {/* repère de Frenet (traits fins, dessous : vec(a) est dessiné par-dessus) */}
      {montre.rep && <g>
        <Fleche x1={Mx} y1={My} x2={Mx + ut[0] * U} y2={My + ut[1] * U} c={COL.bleu} w={2.5} tete={10}/>
        <Fleche x1={Mx} y1={My} x2={Mx + un[0] * U} y2={My + un[1] * U} c={COL.bleu} w={2.5} tete={10}/>
        <Etiq bx={Mx + ut[0] * U} by={My + ut[1] * U} dx={ut[0]} dy={ut[1]} l="u" i="t" c={COL.bleu} s={22} decal={13} lat={18}/>
        <Etiq bx={Mx + un[0] * U} by={My + un[1] * U} dx={un[0]} dy={un[1]} l="u" i="n" c={COL.bleu} s={22} decal={13} lat={18}/>
      </g>}
      {/* composantes de l'accélération */}
      {montre.comp && Math.abs(at) > 0.05 && <g>
        <Fleche x1={Mx} y1={My} x2={Mx + ut[0] * Lat} y2={My + ut[1] * Lat} c={COL.orange} w={3.5} tirets/>
        <Etiq bx={Mx + ut[0] * Lat} by={My + ut[1] * Lat} dx={at >= 0 ? ut[0] : -ut[0]} dy={at >= 0 ? ut[1] : -ut[1]} l="a" i="t" c={COL.orange} s={22} decal={13} lat={at >= 0 ? -18 : 18}/>
      </g>}
      {montre.comp && Lan > 4 && <g>
        <Fleche x1={Mx} y1={My} x2={Mx + un[0] * Lan} y2={My + un[1] * Lan} c={COL.orange} w={3.5} tirets/>
        <Etiq bx={Mx + un[0] * Lan} by={My + un[1] * Lan} dx={un[0]} dy={un[1]} l="a" i="n" c={COL.orange} s={22} decal={13} lat={-18}/>
      </g>}
      {montre.comp && Math.abs(at) > 0.05 && Lan > 4 && (
        <polyline points={`${Mx + ut[0] * Lat},${My + ut[1] * Lat} ${Mx + aVec[0] * echA},${My + aVec[1] * echA} ${Mx + un[0] * Lan},${My + un[1] * Lan}`} fill="none" stroke={COL.gris} strokeWidth="1.5" strokeDasharray="3 4"/>)}
      {montre.acc && (Math.hypot(...aVec) * echA > 4) && <g>
        <Fleche x1={Mx} y1={My} x2={Mx + aVec[0] * echA} y2={My + aVec[1] * echA} c={COL.rouge} w={5}/>
        <Etiq bx={Mx + aVec[0] * echA} by={My + aVec[1] * echA} dx={aVec[0]} dy={aVec[1]} l="a" c={COL.rouge} s={23} decal={26} lat={montre.comp ? 8 : 0}/>
      </g>}
      <circle cx={Mx} cy={My} r="7" fill={COL.txt} stroke="#fff" strokeWidth="2"/>
      <Tx x={Mx + c * 24 - (6 - 6 * Math.max(-1, Math.min(1, c / 0.3)))} y={My - s * 24 + 8} s={23}>M</Tx>
      {/* légendes : rayon, échelles */}
      <Tx x={388} y={28} s={21} w={700} ancre="end" halo={false}>{legende || `R = ${String(R.toFixed(1)).replace('.', ',')} m`}</Tx>
      {lignes.map(([, bar, col, txt], k) => <g key={txt}><Fleche x1={16} y1={296 + k * 26 - (lignes.length === 1 ? -24 : 0)} x2={16 + bar} y2={296 + k * 26 - (lignes.length === 1 ? -24 : 0)} c={col} w={4} tete={8}/><Tx x={26 + bar} y={302 + k * 26 - (lignes.length === 1 ? -24 : 0)} s={17} w={600} halo={false}>{txt}</Tx></g>)}
    </svg>);
}


// ====================================================
//  CARTES « À RETENIR » : viewBox de 300 de large (affichée à 230-300 px : police ≥ 15 pour rester lisible, soit ≥ 11 px sur téléphone).
//  Les phrases d'explication sont en HTML sous le dessin (elles se replient à la largeur de l'écran) ; le dessin ne porte que les noms des vecteurs.
// ====================================================
const stl = { width: '100%', maxWidth: 300, height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const Cadre = ({ aria, h, children }) => <svg viewBox={`0 0 300 ${h}`} role="img" aria-label={aria} style={stl}>{children}</svg>;
const Legende = ({ children }) => <div style={{ fontSize: 14, lineHeight: 1.55, color: COL.txt, margin: '0 auto 8px', maxWidth: 300 }}>{indicesProfond(children)}</div>;
const rad = d => d * Math.PI / 180;
const pt = (cx, cy, r, th) => [cx + r * Math.cos(th), cy - r * Math.sin(th)];
const Pt = ({ x, y, r = 6.5 }) => <circle cx={x} cy={y} r={r} fill={COL.txt} stroke="#fff" strokeWidth="2"/>;

// repère de Frenet dessiné en un point de la carte : u_t étiqueté au bout, u_n étiqueté à côté de sa flèche
const Repere = ({ x, y, th, U = 34, ut_lat = 0, un_lat = 15 }) => {
  const { ut, un } = dirsSvg(th), px = -un[1], py = un[0];
  return (
    <g>
      <Fleche x1={x} y1={y} x2={x + ut[0] * U} y2={y + ut[1] * U} c={COL.bleu} w={3}/>
      <Fleche x1={x} y1={y} x2={x + un[0] * U} y2={y + un[1] * U} c={COL.bleu} w={3} tirets/>
      <Etiq bx={x + ut[0] * U} by={y + ut[1] * U} dx={ut[0]} dy={ut[1]} l="u" i="t" c={COL.bleu} s={17} decal={10} lat={ut_lat}/>
      <TVi x={x + un[0] * U * 0.5 + px * un_lat} y={y + un[1] * U * 0.5 + py * un_lat + 6} l="u" i="n" c={COL.bleu} s={17} ancre="middle"/>
    </g>);
};

// 1) le repère de Frenet se déplace avec le point
export function SvgRepereCarte() {
  const cx = 150, cy = 106, r = 66;
  return (<>
    <Cadre aria="Trois positions d'un point M sur un cercle : en chacune, le vecteur u t est tangent au cercle dans le sens du mouvement et le vecteur u n est dirigé vers le centre. Le repère change de direction avec la position de M." h={206}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COL.gris} strokeWidth="2.5"/>
      <circle cx={cx} cy={cy} r="3.5" fill={COL.txt}/><Tx x={cx + 8} y={cy + 6} s={16} w={600}>O</Tx>
      {[0, 140, 255].map(d => { const th = rad(d), [x, y] = pt(cx, cy, r, th); return <g key={d}><Repere x={x} y={y} th={th} U={32} un_lat={24}/><Pt x={x} y={y}/></g>; })}
    </Cadre>
    <Legende>vec(u)_t (trait plein) : tangent, dans le sens du mouvement. vec(u)_n (tirets) : normal, vers le centre.</Legende>
  </>);
}

// 2) la vitesse est tangente : v = v × u_t
export function SvgVitesseCarte() {
  const cx = 96, cy = 128, r = 60, th = rad(35), [x, y] = pt(cx, cy, r, th), { ut } = dirsSvg(th), Lv = 60;
  return (<>
    <Cadre aria="Un point M sur un cercle de centre O. Le vecteur vitesse v part de M, il est tangent au cercle dans le sens du mouvement et porté par le vecteur unitaire u t. Il n'a aucune composante sur u n." h={200}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COL.gris} strokeWidth="2.5"/>
      <circle cx={cx} cy={cy} r="3.5" fill={COL.txt}/><Tx x={cx - 22} y={cy + 20} s={16} w={600}>O</Tx>
      <Fleche x1={x} y1={y} x2={x + ut[0] * Lv} y2={y + ut[1] * Lv} c={COL.vert} w={5}/>
      <Etiq bx={x + ut[0] * Lv} by={y + ut[1] * Lv} dx={ut[0]} dy={ut[1]} l="v" c={COL.vert} s={20} decal={12} lat={-10}/>
      <Repere x={x} y={y} th={th} U={34} ut_lat={28} un_lat={24}/>
      <Pt x={x} y={y}/><Tx x={x + 10} y={y + 24} s={18}>M</Tx>
      <rect x="186" y="104" width="108" height="64" rx="8" fill="#f0f9ff" stroke={COL.bleu} strokeWidth="1.5"/>
      <Tx x={194} y={132} s={16} halo={false} w={600}>tout sur</Tx><TVi x={262} y={132} l="u" i="t" c={COL.bleu} s={17} halo={false}/>
      <Tx x={194} y={156} s={16} halo={false} w={600}>rien sur</Tx><TVi x={262} y={156} l="u" i="n" c={COL.bleu} s={17} halo={false}/>
    </Cadre>
    <Legende>vec(v) : toujours tangent à la trajectoire, dans le sens du mouvement ; ses coordonnées sont (v ; 0).</Legende>
  </>);
}

// 3) vitesse de norme constante ≠ accélération nulle : la direction de v change
export function SvgIdeeFausseCarte() {
  const cx = 92, cy = 104, r = 46, Lv = 34;
  const A = rad(25), B = rad(130);
  const [xa, ya] = pt(cx, cy, r, A), [xb, yb] = pt(cx, cy, r, B), ua = dirsSvg(A).ut, ub = dirsSvg(B).ut;
  const ox = 252, oy = 104, k = 42;
  const v1 = [ua[0] * k, ua[1] * k], v2 = [ub[0] * k, ub[1] * k];
  const mid = [(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2], nm = Math.hypot(...mid) || 1;
  return (<>
    <Cadre aria="À gauche, un point sur un cercle à deux instants : les vecteurs vitesse ont la même longueur mais deux directions différentes. À droite, les deux vecteurs vitesse tracés depuis la même origine : leur différence, la variation de vitesse, est un vecteur non nul dirigé vers l'intérieur du cercle." h={196}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COL.gris} strokeWidth="2.5"/>
      <circle cx={cx} cy={cy} r="3.5" fill={COL.txt}/>
      <Fleche x1={xa} y1={ya} x2={xa + ua[0] * Lv} y2={ya + ua[1] * Lv} c={COL.vert} w={4.5}/>
      <Etiq bx={xa + ua[0] * Lv} by={ya + ua[1] * Lv} dx={ua[0]} dy={ua[1]} l="v" i="1" c={COL.vert} s={18} decal={10}/>
      <Fleche x1={xb} y1={yb} x2={xb + ub[0] * Lv} y2={yb + ub[1] * Lv} c={COL.vert} w={4.5}/>
      <Etiq bx={xb + ub[0] * Lv} by={yb + ub[1] * Lv} dx={ub[0]} dy={ub[1]} l="v" i="2" c={COL.vert} s={18} decal={10}/>
      <Pt x={xa} y={ya} r={6}/><Pt x={xb} y={yb} r={6}/>
      <Tx x={92} y={182} s={15} w={600} halo={false} c={COL.gris} ancre="middle">deux instants</Tx>
      <circle cx={ox} cy={oy} r="3.5" fill={COL.txt}/>
      <Fleche x1={ox} y1={oy} x2={ox + v1[0]} y2={oy + v1[1]} c={COL.vert} w={3.5}/>
      <Fleche x1={ox} y1={oy} x2={ox + v2[0]} y2={oy + v2[1]} c={COL.vert} w={3.5}/>
      <Fleche x1={ox + v1[0]} y1={oy + v1[1]} x2={ox + v2[0]} y2={oy + v2[1]} c={COL.rouge} w={4.5}/>
      <Etiq bx={ox + v1[0]} by={oy + v1[1]} dx={v1[0]} dy={v1[1]} l="v" i="1" c={COL.vert} s={17} decal={9}/>
      <Etiq bx={ox + v2[0]} by={oy + v2[1]} dx={v2[0]} dy={v2[1]} l="v" i="2" c={COL.vert} s={17} decal={9}/>
      <TVi x={ox + mid[0] + (mid[0] / nm) * 12} y={oy + mid[1] + 6} l="Δv" c={COL.rouge} s={17} ancre="end"/>
      <Tx x={240} y={182} s={15} w={600} halo={false} c={COL.gris} ancre="middle">même origine</Tx>
    </Cadre>
    <Legende>Faux : « v de norme constante donc a nul ». Vrai : la direction de vec(v) change, donc la variation de vitesse (Δv) et vec(a) ne sont pas nulles.</Legende>
  </>);
}

// 4) mouvement circulaire uniforme : a centripète, de norme constante, de direction qui change
export function SvgCentripeteCarte() {
  const cx = 150, cy = 102, r = 70, La = 32, Lv = 32;
  return (<>
    <Cadre aria="Un point sur un cercle, à quatre positions : le vecteur accélération a est toujours dirigé vers le centre, avec la même longueur ; sa direction change avec la position. Le vecteur vitesse v reste tangent." h={196}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COL.gris} strokeWidth="2.5"/>
      <circle cx={cx} cy={cy} r="3.5" fill={COL.txt}/><Tx x={cx + 8} y={cy + 6} s={16} w={600}>O</Tx>
      {[10, 100, 190, 280].map(d => {
        const th = rad(d), [x, y] = pt(cx, cy, r, th), { ut, un } = dirsSvg(th), px = -un[1], py = un[0];
        return (
          <g key={d}>
            <Fleche x1={x} y1={y} x2={x + ut[0] * Lv} y2={y + ut[1] * Lv} c={COL.vert} w={3} tete={9}/>
            <Fleche x1={x} y1={y} x2={x + un[0] * La} y2={y + un[1] * La} c={COL.rouge} w={4.5}/>
            <TVi x={x + un[0] * La * 0.5 + px * 18} y={y + un[1] * La * 0.5 + py * 18 + 6} l="a" c={COL.rouge} s={18} ancre="middle"/>
            <Etiq bx={x + ut[0] * Lv} by={y + ut[1] * Lv} dx={ut[0]} dy={ut[1]} l="v" c={COL.vert} s={18} decal={8}/>
            <Pt x={x} y={y} r={6}/>
          </g>);
      })}
    </Cadre>
    <Legende>vec(a) (trait épais rouge) : vers le centre, même norme en tout point. vec(v) (trait vert plus fin) : tangent.</Legende>
  </>);
}

// 5) deux composantes : a_t (change la valeur de v) et a_n (change la direction de v)
export function SvgComposantesCarte() {
  const cx = 150, cy = 106, r = 64, th = rad(35), [x, y] = pt(cx, cy, r, th), { ut, un } = dirsSvg(th);
  const at = 30, an = 52, aVec = [at * ut[0] + an * un[0], at * ut[1] + an * un[1]];
  return (<>
    <Cadre aria="Un point M sur un cercle. Le vecteur accélération a est la somme de deux composantes : a t, tangente au cercle, qui change la valeur de la vitesse, et a n, dirigée vers le centre, qui change la direction de la vitesse. Les deux composantes forment les côtés d'un rectangle dont a est la diagonale." h={190}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COL.gris} strokeWidth="2.5"/>
      <circle cx={cx} cy={cy} r="3.5" fill={COL.txt}/><Tx x={cx + 8} y={cy + 22} s={16} w={600}>O</Tx>
      <polyline points={`${x + ut[0] * at},${y + ut[1] * at} ${x + aVec[0]},${y + aVec[1]} ${x + un[0] * an},${y + un[1] * an}`} fill="none" stroke={COL.gris} strokeWidth="1.5" strokeDasharray="3 4"/>
      <Fleche x1={x} y1={y} x2={x + ut[0] * at} y2={y + ut[1] * at} c={COL.orange} w={3.5} tirets/>
      <Etiq bx={x + ut[0] * at} by={y + ut[1] * at} dx={ut[0]} dy={ut[1]} l="a" i="t" c={COL.orange} s={18} decal={10} lat={-4}/>
      <Fleche x1={x} y1={y} x2={x + un[0] * an} y2={y + un[1] * an} c={COL.orange} w={3.5} tirets/>
      <Etiq bx={x + un[0] * an} by={y + un[1] * an} dx={un[0]} dy={un[1]} l="a" i="n" c={COL.orange} s={18} decal={10} lat={10}/>
      <Fleche x1={x} y1={y} x2={x + aVec[0]} y2={y + aVec[1]} c={COL.rouge} w={5}/>
      <Etiq bx={x + aVec[0]} by={y + aVec[1]} dx={aVec[0]} dy={aVec[1]} l="a" c={COL.rouge} s={19} decal={12} lat={-6}/>
      <Pt x={x} y={y}/>
    </Cadre>
    <Legende>vec(a)_t (tirets) : tangente, change la valeur de v. vec(a)_n (tirets) : normale, change la direction de v. vec(a) (trait plein) : la diagonale.</Legende>
  </>);
}

// 6) accéléré ou ralenti : le signe de dv/dt ; a_n est toujours vers le centre
export function SvgSensCarte() {
  const rr = 60, phi = rad(52);
  const panneau = (x0, accel) => {
    const mx = x0 + 78, my = 132, sgn = accel ? 1 : -1, cyc = my - rr;
    const ex = rr * Math.sin(phi), ey = cyc + rr * Math.cos(phi);       // extrémités de l'arc : sur le cercle de centre (mx, cyc) et de rayon rr
    return (
      <g>
        <path d={`M ${(mx - ex).toFixed(2)} ${ey.toFixed(2)} A ${rr} ${rr} 0 0 0 ${(mx + ex).toFixed(2)} ${ey.toFixed(2)}`} fill="none" stroke={COL.gris} strokeWidth="2.5"/>
        <circle cx={mx} cy={cyc} r="3" fill={COL.gris}/>
        <Fleche x1={mx} y1={my} x2={mx + 52} y2={my} c={COL.vert} w={4.5}/>
        <Etiq bx={mx + 52} by={my} dx={1} dy={0.0001} l="v" c={COL.vert} s={18} decal={4} lat={0}/>
        <Fleche x1={mx} y1={my} x2={mx + sgn * 34} y2={my} c={COL.orange} w={3.5} tirets/>
        <Fleche x1={mx} y1={my} x2={mx} y2={my - 44} c={COL.orange} w={3.5} tirets/>
        <Fleche x1={mx} y1={my} x2={mx + sgn * 34} y2={my - 44} c={COL.rouge} w={5}/>
        <Etiq bx={mx + sgn * 34} by={my - 44} dx={sgn} dy={-1} l="a" c={COL.rouge} s={19} decal={4} lat={0}/>
        <TVi x={mx + sgn * 34} y={my + 26} l="a" i="t" c={COL.orange} s={17} ancre="middle"/>
        <TVi x={mx - sgn * 24} y={my - 30} l="a" i="n" c={COL.orange} s={17} ancre="middle"/>
        <Pt x={mx} y={my}/>
      </g>);
  };
  return (<>
    <Cadre aria="Deux cas côte à côte pour un point en bas d'un cercle qui avance vers la droite. À gauche, mouvement accéléré : la composante tangentielle de l'accélération est dans le sens de la vitesse. À droite, mouvement ralenti : elle est dans le sens opposé. Dans les deux cas, la composante normale est dirigée vers le centre, donc vers le haut." h={176}>
      <Tx x={75} y={24} s={16} ancre="middle" w={700} halo={false}>accéléré</Tx><Tx x={75} y={46} s={15} ancre="middle" w={600} halo={false} c={COL.gris}>v augmente</Tx>
      <Tx x={225} y={24} s={16} ancre="middle" w={700} halo={false}>ralenti</Tx><Tx x={225} y={46} s={15} ancre="middle" w={600} halo={false} c={COL.gris}>v diminue</Tx>
      <line x1="150" y1="8" x2="150" y2="168" stroke={COL.clair} strokeWidth="1.5"/>
      {panneau(-3, true)}{panneau(147, false)}
    </Cadre>
    <Legende>vec(a)_t : même sens que vec(v) si la norme de vec(v) augmente (frac(dv|dt) &gt; 0), sens opposé si elle diminue (frac(dv|dt) &lt; 0). vec(a)_n : toujours vers le centre.</Legende>
  </>);
}
