// Schémas de la simulation « Synthèse additive et synthèse soustractive ». SVG, textes de 10,5 à 16, largeur 100 % plafonnée.
import { LAMBDAS, CONES, spectreRVB, transmittance, C } from "./synthCouleurModele";

const K = { txt: '#0f172a', gris: '#64748b', clair: '#cbd5e1', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', vert: '#15803d', bleu: '#1d4ed8' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 12} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? K.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit" stroke={o.halo ? '#fff' : 'none'} strokeWidth={o.halo ? 3 : 0} paintOrder="stroke">{s}</text>;
const i400 = LAMBDAS.indexOf(400), i700 = LAMBDAS.indexOf(700);
const bande = LAMBDAS.slice(i400, i700 + 1);
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',');
const couleurLambda = l => C.cssXYNormalise(C.pointLieu(l).x, C.pointLieu(l).y);

// ---------- courbes en fonction de la longueur d'onde ----------
const X0 = 40, X1 = 324, YB = 150, YH = 32;
const lx = l => X0 + (l - 400) / 300 * (X1 - X0);

/** Courbes spectrales (intensité, transmittance, réflectance, sensibilité…) de 400 à 700 nm.
 *  courbes : [{ v (tableau sur LAMBDAS), col, w, dash, fill, nom, l (position du nom), dy, dx, anchor }] ; ymax : valeur du haut du graphique ;
 *  graduations : true pour écrire 0 ; 0,5 ; 1 sur l'axe (courbes de 0 à 1) ; marques : [{ l, txt }] : traits verticaux. */
export function SvgSpectre({ courbes = [], ymax = 1, yTitre = '', graduations = false, marques = [], label = 'Spectre', carte = false, bandeCouleur = true, hauteur = 190 }) {
  const py = v => YB - Math.max(0, Math.min(ymax, v)) / ymax * (YB - YH);
  const els = [];
  if (graduations) for (const g of [0, 0.5, 1]) { if (g * 1 > ymax + 1e-9) continue; els.push(<line key={'g' + g} x1={X0} y1={py(g)} x2={X1} y2={py(g)} stroke={K.clair} strokeWidth="1" strokeDasharray={g === 0 ? '' : '3 3'}/>, T(X0 - 6, py(g) + 4, fr(g, g === 0.5 ? 1 : 0), { size: 11.5, anchor: 'end', fill: K.gris })); }
  else els.push(<line key="base" x1={X0} y1={YB} x2={X1} y2={YB} stroke={K.gris} strokeWidth="1.5"/>);
  els.push(<line key="axeY" x1={X0} y1={YH - 4} x2={X0} y2={YB} stroke={K.gris} strokeWidth="1.5"/>);
  if (yTitre) els.push(T(X0 - 4, 12, yTitre, { size: 12, anchor: 'start', fill: K.gris }));
  if (bandeCouleur) for (let l = 400; l < 700; l += 10) els.push(<rect key={'b' + l} x={lx(l)} y={YB + 6} width={lx(l + 10) - lx(l) + 0.6} height={9} fill={couleurLambda(l + 5)}/>);
  for (const l of [400, 500, 600, 700]) els.push(<line key={'t' + l} x1={lx(l)} y1={YB} x2={lx(l)} y2={YB + (bandeCouleur ? 6 : 4)} stroke={K.gris} strokeWidth="1.2"/>, T(lx(l), YB + (bandeCouleur ? 28 : 18), String(l), { size: 12, fill: K.txt }));
  els.push(T((X0 + X1) / 2, YB + (bandeCouleur ? 43 : 33), 'longueur d’onde (nm)', { size: 12, fill: K.gris }));
  for (const m of marques) els.push(<line key={'m' + m.l} x1={lx(m.l)} y1={YH - 2} x2={lx(m.l)} y2={YB} stroke={K.txt} strokeWidth="1.4" strokeDasharray="4 3"/>, m.txt ? T(lx(m.l) + 4, YH - 4, m.txt, { size: 12, anchor: 'start', gras: true }) : null);
  courbes.forEach((c, k) => {
    const pts = c.v.slice(i400, i700 + 1).map((v, i) => `${lx(bande[i])},${py(v)}`);
    if (c.fill) els.push(<polygon key={'f' + k} points={`${lx(400)},${YB} ${pts.join(' ')} ${lx(700)},${YB}`} fill={c.fill} fillOpacity={c.fillOpacity ?? 0.28} stroke="none"/>);
    els.push(<polyline key={'c' + k} points={pts.join(' ')} fill="none" stroke={c.col ?? K.txt} strokeWidth={c.w ?? 2.6} strokeDasharray={c.dash ?? ''} strokeLinejoin="round" strokeLinecap="round"/>);
    if (c.nom) {
      const arg = c.l ?? bande[c.v.slice(i400, i700 + 1).indexOf(Math.max(...c.v.slice(i400, i700 + 1)))], i = LAMBDAS.indexOf(Math.round(arg / 10) * 10);
      els.push(T(lx(arg) + (c.dx ?? 0), py(c.v[i] ?? 0) + (c.dy ?? -7), c.nom, { size: 12.5, gras: true, fill: c.col ?? K.txt, anchor: c.anchor ?? 'middle', halo: true }));
    }
  });
  return <svg role="img" aria-label={label} viewBox={`0 0 340 ${hauteur + 10 - (bandeCouleur ? 0 : 10)}`} width="100%" style={{ display: 'block', maxWidth: carte ? 320 : 400, margin: '0 auto' }}>{els}</svg>;
}

/** Sensibilité des trois types de cônes (L, M, S), chacune normalisée à 1 ; marques : longueurs d'onde repérées. */
export function SvgCones({ marques = [], carte = false, label = 'Sensibilité spectrale des trois types de cônes' }) {
  return <SvgSpectre carte={carte} label={label} graduations ymax={1.2} marques={marques} yTitre="sensibilité"
    courbes={[{ v: CONES.S, col: K.bleu, nom: 'S', dy: -7, w: 3 }, { v: CONES.M, col: K.vert, nom: 'M', dy: -7, dash: '7 4', w: 3 }, { v: CONES.L, col: K.rouge, nom: 'L', dy: -7, dx: 6, w: 3, dash: '2 3' }]}/>;
}

// ---------- barres des réponses des cônes ----------
/** Réponses L, M, S (unités arbitraires) de une ou deux lumières ; masqueM : œil sans cônes M (barres grisées). */
export function BarresCones({ a, b, nomA = 'lumière 1', nomB = 'lumière 2', ymax = 60, masqueM = false, label = 'Réponses des trois types de cônes' }) {
  const H = 110, Y0 = 30, bw = 38, gx = [60, 170, 280], sc = v => Math.max(0, Math.min(ymax, v)) / ymax * H;
  const els = [];
  els.push(<rect key="la" x={20} y={8} width={11} height={11} fill="#334155"/>, T(35, 18, nomA, { size: 12.5, anchor: 'start' }));
  if (b) els.push(<rect key="lb" x={190} y={8} width={11} height={11} fill="#d97706"/>, T(205, 18, nomB, { size: 12.5, anchor: 'start' }));
  ['L', 'M', 'S'].forEach((c, k) => {
    const x = gx[k], off = masqueM && c === 'M';
    const barres = [[a, '#334155', b ? -bw / 2 - 2 : 0], ...(b ? [[b, '#d97706', bw / 2 + 2]] : [])];
    for (const [r, col, dx] of barres) {
      const v = r[c], h = sc(v);
      els.push(<rect key={c + col} x={x + dx - bw / 2} y={Y0 + H - h} width={bw} height={h} fill={off ? '#e2e8f0' : col} stroke={off ? '#94a3b8' : 'none'} strokeDasharray={off ? '4 3' : ''} rx="2"/>,
        T(x + dx, Y0 + H - h - 5, fr(v, 0), { size: 12.5, gras: true, fill: off ? '#94a3b8' : col }));
    }
    els.push(T(x, Y0 + H + 18, c, { size: 15, gras: true }), T(x, Y0 + H + 33, c === 'L' ? 'grandes λ' : c === 'M' ? 'moyennes λ' : 'courtes λ', { size: 11.5, fill: K.gris }));
    if (off) els.push(<line key="x1" x1={x - 30} y1={Y0 + 6} x2={x + 30} y2={Y0 + H - 6} stroke={K.rouge} strokeWidth="3.5" strokeLinecap="round"/>, <line key="x2" x1={x + 30} y1={Y0 + 6} x2={x - 30} y2={Y0 + H - 6} stroke={K.rouge} strokeWidth="3.5" strokeLinecap="round"/>);
  });
  els.push(<line key="base" x1={14} y1={Y0 + H} x2={326} y2={Y0 + H} stroke={K.gris} strokeWidth="1.5"/>);
  return <svg role="img" aria-label={label} viewBox="0 0 340 185" width="100%" style={{ display: 'block', maxWidth: 400, margin: '0 auto' }}>{els}</svg>;
}

// ---------- Cartes « À retenir » ----------
const flecheDef = <defs><marker id="syn-fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#0f172a"/></marker></defs>;
const fleche = (x1, y1, x2, y2) => <line key={`f${x1}${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0f172a" strokeWidth="2" markerEnd="url(#syn-fl)"/>;
const mini = (v, col, x, y, w, h, key) => {   // petit spectre rempli (v : tableau sur LAMBDAS)
  const pts = v.slice(i400, i700 + 1), m = Math.max(...pts) || 1;
  const p = pts.map((u, i) => `${x + i / (pts.length - 1) * w},${y + h - u / m * h}`);
  return <g key={key}><polygon points={`${x},${y + h} ${p.join(' ')} ${x + w},${y + h}`} fill={col} fillOpacity="0.30"/><polyline points={p.join(' ')} fill="none" stroke={col} strokeWidth="2.2"/></g>;
};

/** Les trois cônes : la couleur est un triplet de nombres ; deux spectres différents peuvent donner la même couleur. */
export function SvgCarteCones() {
  return <div><SvgCones carte label="Les trois types de cônes de l'œil : sensibilités L, M et S"/>
    <svg role="img" aria-label="Deux spectres différents, mêmes réponses L, M, S" viewBox="0 0 300 92" width="100%" style={{ display: 'block', maxWidth: 320, margin: '4px auto 0' }}>
      {T(150, 15, 'deux spectres différents', { size: 13, gras: true })}
      {mini(spectreRVB(0.69, 0.34, 0), '#b45309', 18, 24, 100, 38, 'a')}
      {(() => { const s = LAMBDAS.map(l => Math.exp(-0.5 * ((l - 580) / 6) ** 2)); return mini(s, '#b45309', 182, 24, 100, 38, 'b'); })()}
      {T(150, 48, '=', { size: 24, gras: true })}
      {T(150, 86, 'mêmes réponses L, M, S : même couleur', { size: 13, gras: true, fill: K.orange })}
    </svg></div>;
}
/** Synthèse additive : on ajoute des lumières ; primaires R, V, B ; complémentaires. */
export function SvgCarteAdditive() {
  const cols = ['#b91c1c', '#15803d', '#1d4ed8'], sp = [spectreRVB(1, 0, 0), spectreRVB(0, 1, 0), spectreRVB(0, 0, 1)];
  return <svg role="img" aria-label="Synthèse additive : les spectres de trois lampes s'ajoutent, l'œil ne garde que trois réponses" viewBox="0 0 300 258" width="100%" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }}>
    {flecheDef}
    {T(150, 17, 'Synthèse additive : on ajoute des lumières', { size: 14, gras: true })}
    {sp.map((s, k) => mini(s, cols[k], 12 + k * 98, 28, 80, 38, 'a' + k))}
    {['rouge', 'verte', 'bleue'].map((n, k) => T(52 + k * 98, 82, n, { size: 13, fill: cols[k], gras: true }))}
    {T(101, 52, '+', { size: 22, gras: true })}{T(199, 52, '+', { size: 22, gras: true })}
    {fleche(150, 90, 150, 108)}
    {T(150, 126, 'l’œil ne garde que 3 nombres (L, M, S)', { size: 13.5, gras: true })}
    {fleche(150, 134, 150, 150)}
    <rect x="14" y="154" width="272" height="96" rx="8" fill="#f8fafc" stroke={K.clair}/>
    {T(150, 174, 'primaires : rouge, vert, bleu', { size: 13.5, gras: true })}
    {T(150, 193, 'jaune = rouge + vert', { size: 13 })}
    {T(150, 210, 'magenta = rouge + bleu', { size: 13 })}
    {T(150, 227, 'cyan = vert + bleu', { size: 13 })}
    {T(150, 244, 'rouge + vert + bleu = blanc', { size: 13, gras: true })}
  </svg>;
}
/** Synthèse soustractive : on retire de la lumière ; les absorbances s'ajoutent, les transmittances se multiplient. */
export function SvgCarteSoustractive() {
  const tj = transmittance({ jaune: 0.8 }), tc = transmittance({ cyan: 0.8 }), tp = tj.map((v, i) => v * tc[i]);
  return <div><SvgSpectre carte graduations label="Deux filtres en série : la transmittance du système est le produit des transmittances" yTitre="transmittance"
    courbes={[{ v: tj, col: '#b45309', nom: 'jaune', l: 640, dy: -8, dash: '7 4' }, { v: tc, col: '#0e7490', nom: 'cyan', l: 440, dy: -8, dash: '2 3' }, { v: tp, col: '#15803d', nom: 'jaune + cyan', l: 540, dy: -8, w: 3.4, fill: '#15803d' }]}/>
    <svg role="img" aria-label="Règles de la synthèse soustractive" viewBox="0 0 300 92" width="100%" style={{ display: 'block', maxWidth: 320, margin: '2px auto 0' }}>
      {T(150, 16, 'Synthèse soustractive : on retire de la lumière', { size: 13.5, gras: true })}
      {T(150, 32, 'filtres : T = T₁ × T₂', { size: 12.5 })}
      {T(150, 47, 'absorbances (ou K/S) : on les additionne', { size: 12.5 })}
      {T(150, 68, 'primaires : cyan, magenta, jaune', { size: 13, gras: true, fill: K.orange })}
      {T(150, 85, 'C + M + J : presque noir', { size: 12.5 })}
    </svg></div>;
}
/** Quel modèle choisir ? Tableau comparatif. */
export function SvgCarteChoix() {
  const L = (x, y, s, o = {}) => T(x, y, s, { size: 12.5, ...o });
  return <svg role="img" aria-label="Choisir entre synthèse additive et soustractive" viewBox="0 0 300 226" width="100%" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }}>
    <rect x="6" y="6" width="141" height="214" rx="9" fill="#eff6ff" stroke="#93c5fd"/><rect x="153" y="6" width="141" height="214" rx="9" fill="#fffbeb" stroke="#fcd34d"/>
    {T(76, 27, 'ADDITIVE', { size: 15, gras: true, fill: K.bleu })}{T(224, 27, 'SOUSTRACTIVE', { size: 15, gras: true, fill: K.orange })}
    {L(76, 50, 'on ajoute', { gras: true })}{L(76, 65, 'des lumières')}{L(224, 50, 'on retire de la', { gras: true })}{L(224, 65, 'lumière : absorption')}
    {L(76, 92, 'primaires :', { gras: true })}{L(76, 107, 'R, V, B')}{L(224, 92, 'primaires :', { gras: true })}{L(224, 107, 'C, M, J')}
    {L(76, 134, 'tout ensemble :', { gras: true })}{L(76, 149, 'blanc')}{L(224, 134, 'tout ensemble :', { gras: true })}{L(224, 149, 'presque noir')}
    {L(76, 176, 'écrans, projecteurs,', { gras: true })}{L(76, 191, 'éclairage de scène')}{L(224, 176, 'filtres, peintures,', { gras: true })}{L(224, 191, 'encres, colorants')}
    {L(76, 211, 'spectres : somme', { fill: K.gris, size: 11.5 })}{L(224, 211, 'spectres : produit', { fill: K.gris, size: 11.5 })}
  </svg>;
}
