// ====================================================
//  Schémas de la simulation 182 (trous d'Young, TG). Règles : textes de 16 dans un viewBox de 400 (scène), 14 dans un viewBox de 320 (cartes) ;
//  chaque objet porte son nom dans le dessin ; cotes avec flèches ; « pas à l'échelle » ; jamais la couleur seule (trait plein / tirets, étiquettes) ;
//  nombres passés aux attributs SVG toujours en nombres (jamais en chaînes).
// ====================================================
import { useEffect, useRef } from 'react';
import * as Y from './youngModele';

const ENCRE = '#0f172a', GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c';
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const stlScene = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8 };
const stlCarte = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const couleurLaser = lam => `rgb(${Y.rgb(lam).map(c => Math.round(c * 230)).join(',')})`;

// ---------- primitives ----------
const Tx = ({ x, y, children, s = 18, c = ENCRE, w = 700, a = 'start', halo = false }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a} {...(halo ? HALO : {})}>{children}</text>);
const Tete = ({ x, y, ux, uy, c, h = 9, d = 3.6 }) => <polygon points={`${x},${y} ${x - ux * h - uy * d},${y - uy * h + ux * d} ${x - ux * h + uy * d},${y - uy * h - ux * d}`} fill={c}/>;
// cote : double flèche entre deux points
export const Cote = ({ x1, y1, x2, y2, c = ENCRE, w = 1.8 }) => {
  const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
  return (<g><line x1={x1 + ux * 6} y1={y1 + uy * 6} x2={x2 - ux * 6} y2={y2 - uy * 6} stroke={c} strokeWidth={w}/><Tete x={x1} y={y1} ux={-ux} uy={-uy} c={c}/><Tete x={x2} y={y2} ux={ux} uy={uy} c={c}/></g>);
};
// fraction dessinée : numérateur / barre / dénominateur, centrée en x
const Fr = ({ x, y, haut, bas, s = 15.5, c = ENCRE, l = 60 }) => (
  <g><text x={x} y={y - 5} fontSize={s} fontWeight="700" fill={c} textAnchor="middle">{haut}</text>
    <line x1={x - l / 2} y1={y} x2={x + l / 2} y2={y} stroke={c} strokeWidth="1.6"/>
    <text x={x} y={y + s + 1} fontSize={s} fontWeight="700" fill={c} textAnchor="middle">{bas}</text></g>);
// une frange brillante (bande de couleur avec halo)
const Frange = ({ x, y, h, c, l = 14 }) => (<g><rect x={x - l * 0.9} y={y} width={l * 1.8} height={h} fill={c} opacity="0.3" rx="3"/><rect x={x - l / 2} y={y} width={l} height={h} fill={c} rx="2"/></g>);
const onde = (x0, x1, cy, amp, per, ph = 0) => { const o = []; for (let x = x0; x <= x1; x += 2) o.push(`${x},${(cy - amp * Math.sin((x - x0) / per * Math.PI * 2 + ph)).toFixed(1)}`); return o.join(' '); };

// ====================================================
//  Montage : laser, plaque percée de deux trous, écran. mode 'simple' (étape 1) ou 'chemins' (point M, r1, r2, δ, x)
// ====================================================
export function MontageYoung({ mode = 'simple', lam = 650 }) {
  const col = couleurLaser(lam), S1 = [175, 96], S2 = [175, 144], M = [340, 50], ch = mode === 'chemins';
  const r1 = Math.hypot(M[0] - S1[0], M[1] - S1[1]), r2 = Math.hypot(M[0] - S2[0], M[1] - S2[1]), k = r1 / r2;
  const P = [M[0] + (S2[0] - M[0]) * k, M[1] + (S2[1] - M[1]) * k];          // point de S2M à la distance r1 de M : le segment PS2 vaut δ = r2 − r1
  return (
    <svg viewBox="0 0 400 268" style={stlScene} role="img"
      aria-label={ch ? 'Schéma du montage des trous d’Young, pas à l’échelle : un laser éclaire une plaque percée de deux trous S1 et S2, distants de a ; l’écran est à la distance D ; le point M de l’écran, d’abscisse x depuis le centre O, est à la distance r1 de S1 et r2 de S2 ; la différence r2 moins r1 est notée delta.'
        : 'Schéma du montage des trous d’Young, pas à l’échelle : un laser éclaire une plaque percée de deux trous S1 et S2, distants de a ; l’écran d’observation est à la distance D de la plaque.'}>
      <polygon points="180,96 340,30 340,210 180,144" fill={col} opacity="0.14"/>
      <rect x="6" y="104" width="58" height="32" rx="5" fill="#1e293b"/><Tx x={35} y={126} c="#fff" a="middle">laser</Tx>
      <rect x="64" y="86" width="106" height="68" fill={col} opacity="0.22"/><line x1="64" y1="86" x2="170" y2="86" stroke={col} strokeWidth="1.4"/><line x1="64" y1="154" x2="170" y2="154" stroke={col} strokeWidth="1.4"/>
      <line x1="64" y1="120" x2="170" y2="120" stroke={col} strokeWidth="3"/><Tx x={6} y={178} c={GRIS} w={600}>faisceau élargi</Tx>
      <g fill={GRIS}><rect x="170" y="30" width="10" height="62"/><rect x="170" y="100" width="10" height="40"/><rect x="170" y="148" width="10" height="58"/></g>
      <Tx x={175} y={21} a="middle">plaque à deux trous</Tx>
      <Tx x={124} y={101} a="end" halo>S₁</Tx><Tx x={124} y={156} a="end" halo>S₂</Tx>
      <line x1="180" y1="120" x2="340" y2="120" stroke={GRIS} strokeWidth="1.4" strokeDasharray="5 4"/>
      <line x1="340" y1="30" x2="340" y2="210" stroke={ENCRE} strokeWidth="6"/><Tx x={340} y={21} a="middle">écran</Tx>
      <line x1="132" y1="96" x2="170" y2="96" stroke={GRIS} strokeWidth="1.2" strokeDasharray="3 3"/><line x1="132" y1="144" x2="170" y2="144" stroke={GRIS} strokeWidth="1.2" strokeDasharray="3 3"/>
      <Cote x1={142} y1={97} x2={142} y2={143}/><Tx x={150} y={113} halo>a</Tx>
      <line x1="175" y1="206" x2="175" y2="242" stroke={GRIS} strokeWidth="1.2" strokeDasharray="3 3"/><line x1="340" y1="210" x2="340" y2="242" stroke={GRIS} strokeWidth="1.2" strokeDasharray="3 3"/>
      <Cote x1={176} y1={236} x2={339} y2={236}/><Tx x={257} y={229} a="middle" halo>D</Tx>
      <Tx x={6} y={262} c={GRIS} w={600}>schéma pas à l’échelle</Tx>
      {ch && (<g>
        <line x1={S1[0]} y1={S1[1]} x2={M[0]} y2={M[1]} stroke={BLEU} strokeWidth="2.4"/>
        <line x1={S2[0]} y1={S2[1]} x2={M[0]} y2={M[1]} stroke={ORANGE} strokeWidth="2.4" strokeDasharray="8 4"/>
        <line x1={P[0]} y1={P[1]} x2={S2[0]} y2={S2[1]} stroke={ROUGE} strokeWidth="6" strokeLinecap="butt"/>
        <Tx x={248} y={66} c={BLEU} halo>r₁</Tx><Tx x={266} y={112} c={ORANGE} halo>r₂</Tx>
        <Tx x={188} y={166} c={ROUGE} halo>δ = r₂ − r₁</Tx>
        <circle cx="340" cy="120" r="4.5" fill={ENCRE}/><Tx x={350} y={138} halo>O</Tx>
        <line x1="344" y1="50" x2="378" y2="50" stroke={GRIS} strokeWidth="1.2" strokeDasharray="3 3"/><line x1="344" y1="120" x2="378" y2="120" stroke={GRIS} strokeWidth="1.2" strokeDasharray="3 3"/>
        <Cote x1={372} y1={116} x2={372} y2={54}/><Tx x={380} y={90} halo>x</Tx>
        <circle cx={M[0]} cy={M[1]} r="6.5" fill="#fde047" stroke="#92400e" strokeWidth="2"/><Tx x={314} y={48} c="#92400e" halo>M</Tx>
      </g>)}
    </svg>);
}

// ====================================================
//  Écran : image des franges (canvas), repères, règle graduée en mm, profil d'éclairement
// ====================================================
const px = x => (x + Y.DEMI_FENETRE) * 10;                     // mm -> unités du viewBox (400 pour 40 mm)
export function EcranYoung({ lam, a, D, x1, x2, repere = true, profil = true, mono = false, legende = 'éclairement', aria }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, img = ctx.createImageData(W, H), d = img.data, c = mono ? [1, 1, 1] : Y.rgb(lam);
    for (let i = 0; i < W; i++) {
      const x = (i + 0.5) / W * 2 * Y.DEMI_FENETRE - Y.DEMI_FENETRE, v = Math.pow(Y.eclairement(lam, a, D, x), 0.75);
      for (let j = 0; j < H; j++) { const o = (j * W + i) * 4; d[o] = 255 * c[0] * v; d[o + 1] = 255 * c[1] * v; d[o + 2] = 255 * c[2] * v; d[o + 3] = 255; }
    }
    ctx.putImageData(img, 0, 0);
  }, [lam, a, D, mono]);
  const courbe = (() => { let s = ''; for (let i = 0; i <= 800; i++) { const x = i / 800 * 40 - 20; s += `${i ? 'L' : 'M'}${(i / 2).toFixed(1)},${(100 - 66 * Y.eclairement(lam, a, D, x)).toFixed(1)} `; } return s; })();
  const ticks = []; for (let m = -20; m <= 20; m++) ticks.push(m);
  const marque = (x, c, n, dash) => (
    <g key={n}><line x1={px(x)} y1="0" x2={px(x)} y2="55" stroke="#fff" strokeWidth="5"/><line x1={px(x)} y1="0" x2={px(x)} y2="55" stroke={c} strokeWidth="2.4" strokeDasharray={dash}/>
      <circle cx={px(x)} cy="13" r="11" fill="#fff" stroke={c} strokeWidth="2"/><text x={px(x)} y="19.5" fontSize="18" fontWeight="700" fill={ENCRE} textAnchor="middle">{n}</text></g>);
  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ position: 'relative', lineHeight: 0 }}>
        <canvas ref={ref} width={800} height={110} style={{ width: '100%', display: 'block', borderRadius: '8px 8px 0 0', background: '#000' }} role="img" aria-label={aria}/>
        {repere && <svg aria-hidden="true" viewBox="0 0 400 55" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>{[marque(x1, '#f59e0b', 1), marque(x2, '#22d3ee', 2, '6 4')]}</svg>}
      </div>
      <svg viewBox="0 0 400 60" style={{ width: '100%', display: 'block', background: '#f1f5f9' }} role="img" aria-label="Règle graduée en millimètres, de moins 20 à plus 20 millimètres autour du centre de l’écran">
        {ticks.map(m => <line key={m} x1={px(m)} y1="0" x2={px(m)} y2={m % 5 === 0 ? 11 : 6} stroke="#475569" strokeWidth="1"/>)}
        {[-20, -10, 0, 10, 20].map(m => <text key={m} x={m === -20 ? 2 : m === 20 ? 398 : px(m)} y="31" fontSize="18" fill="#334155" textAnchor={m === -20 ? 'start' : m === 20 ? 'end' : 'middle'} fontWeight="600">{m < 0 ? `−${-m}` : m}</text>)}
        <text x="200" y="54" fontSize="18" fill="#334155" textAnchor="middle" fontWeight="600">x (mm)</text>
      </svg>
      {profil && <svg viewBox="0 0 400 116" style={{ width: '100%', display: 'block', background: 'white', borderRadius: '0 0 8px 8px', borderTop: '1px solid #e2e8f0' }} role="img" aria-label="Profil d’éclairement le long de l’écran : maxima au centre des franges brillantes, zéro au centre des franges sombres">
        <path d={courbe} fill="none" stroke={ENCRE} strokeWidth="1.8"/>
        <line x1="0" y1="100" x2="400" y2="100" stroke="#94a3b8" strokeWidth="1"/>
        <text x="4" y="22" fontSize="18" fontWeight="700" fill="#334155">{legende}</text>
        {repere && <>{[[x1, '#f59e0b', ''], [x2, '#0e7490', '6 4']].map(([x, c, dash], i) => <line key={i} x1={px(x)} y1="32" x2={px(x)} y2="100" stroke={c} strokeWidth="2" strokeDasharray={dash || undefined}/>)}</>}
      </svg>}
    </div>);
}

// ====================================================
//  Cartes « À retenir »
// ====================================================
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 320 ${h}`} style={stlCarte} role="img" aria-label={aria}>{children}</svg>;
const T15 = ({ x, y, children, c = ENCRE, w = 700, a = 'start', halo = false }) => <Tx x={x} y={y} s={15.5} c={c} w={w} a={a} halo={halo}>{children}</Tx>;

export const CarteDelta = () => (
  <Svg h={262} aria="Schéma pas à l’échelle : deux trous S1 et S2 distants de a, un écran à la distance D, un point M à l’abscisse x du centre O. Différence de chemin delta égale a fois x divisé par D, valable si D est très grand devant a et x très petit devant D.">
    <T15 x={8} y={18} c={GRIS} w={600}>pas à l’échelle</T15><T15 x={252} y={18} a="middle">écran</T15>
    <line x1="80" y1="26" x2="80" y2="63" stroke={GRIS} strokeWidth="6"/><line x1="80" y1="73" x2="80" y2="111" stroke={GRIS} strokeWidth="6"/><line x1="80" y1="121" x2="80" y2="168" stroke={GRIS} strokeWidth="6"/>
    <circle cx="80" cy="68" r="5" fill={ENCRE}/><circle cx="80" cy="116" r="5" fill={ENCRE}/>
    <T15 x={32} y={74} a="middle">S₁</T15><T15 x={32} y={122} a="middle">S₂</T15>
    <line x1="252" y1="26" x2="252" y2="168" stroke={ENCRE} strokeWidth="5"/>
    <line x1="80" y1="92" x2="252" y2="92" stroke={GRIS} strokeWidth="1.2" strokeDasharray="5 4"/>
    <line x1="80" y1="68" x2="252" y2="40" stroke={BLEU} strokeWidth="2.2"/><line x1="80" y1="116" x2="252" y2="40" stroke={ORANGE} strokeWidth="2.2" strokeDasharray="7 4"/>
    <circle cx="252" cy="40" r="5.5" fill="#fde047" stroke="#92400e" strokeWidth="2"/><T15 x={232} y={36} c="#92400e" a="end" halo>M</T15>
    <circle cx="252" cy="92" r="4" fill={ENCRE}/><T15 x={240} y={110} a="end" halo>O</T15>
    <line x1="256" y1="40" x2="290" y2="40" stroke={GRIS} strokeWidth="1.1" strokeDasharray="3 3"/><line x1="256" y1="92" x2="290" y2="92" stroke={GRIS} strokeWidth="1.1" strokeDasharray="3 3"/>
    <Cote x1={284} y1={88} x2={284} y2={44}/><T15 x={296} y={72} halo>x</T15>
    <line x1="56" y1="68" x2="74" y2="68" stroke={ENCRE} strokeWidth="1.2"/><line x1="56" y1="116" x2="74" y2="116" stroke={ENCRE} strokeWidth="1.2"/>
    <Cote x1={62} y1={69} x2={62} y2={115}/><T15 x={52} y={98} a="end" halo>a</T15>
    <Cote x1={81} y1={154} x2={251} y2={154}/><T15 x={166} y={148} a="middle" halo>D</T15>
    <Tx x={14} y={204} s={17} a="start">δ =</Tx><Fr x={84} y={200} haut="a × x" bas="D" l={60} s={15.5}/>
    <T15 x={14} y={236} c={VERT}>a, x et D dans la même unité</T15>
    <T15 x={14} y={256} c={GRIS} w={600}>valable si D ≫ a et x ≪ D</T15>
  </Svg>);

export const CarteConditions = () => (
  <Svg h={316} aria="Deux ondes qui arrivent en phase, crête sur crête, s'ajoutent : interférence constructive quand delta vaut k lambda, frange brillante. Deux ondes en opposition de phase, crête sur creux, s'annulent : interférence destructive quand delta vaut k plus un demi, fois lambda, frange sombre.">
    <T15 x={160} y={20} c={VERT} a="middle">constructive : δ = kλ</T15>
    <polyline points={onde(16, 304, 58, 16, 72)} fill="none" stroke={BLEU} strokeWidth="2.6"/><polyline points={onde(16, 304, 58, 16, 72)} fill="none" stroke={ORANGE} strokeWidth="1.8" strokeDasharray="5 4"/>
    <T15 x={160} y={100} c={VERT} a="middle">en phase : elles s’ajoutent</T15><T15 x={160} y={120} c={VERT} a="middle">→ frange brillante</T15>
    <T15 x={160} y={152} c={ROUGE} a="middle">destructive : δ = (k + ½)λ</T15>
    <polyline points={onde(16, 304, 192, 16, 72)} fill="none" stroke={BLEU} strokeWidth="2.6"/><polyline points={onde(16, 304, 192, 16, 72, Math.PI)} fill="none" stroke={ORANGE} strokeWidth="2.2" strokeDasharray="5 4"/>
    <T15 x={160} y={234} c={ROUGE} a="middle">opposition : elles s’annulent</T15><T15 x={160} y={254} c={ROUGE} a="middle">→ frange sombre</T15>
    <T15 x={160} y={280} c={GRIS} w={600} a="middle">ondes au point M · k entier</T15><T15 x={160} y={300} c={GRIS} w={600} a="middle">plein : onde 1 · tirets : onde 2</T15>
  </Svg>);

const Bande = ({ y, h, xs, c, l = 13 }) => (<g><rect x="12" y={y} width="296" height={h} fill="#111827" rx="4"/>{xs.map(x => <Frange key={x} x={x} y={y} h={h} c={c} l={l}/>)}</g>);
export const CarteInterfrange = () => (
  <Svg h={252} aria="Schéma pas à l’échelle : sur l’écran, des franges brillantes régulièrement espacées, numérotées k égal moins 2, moins 1, 0, 1, 2 ; l'interfrange i est la distance entre les centres de deux franges brillantes consécutives ; i égale lambda fois D divisé par a. Une frange sombre se trouve au milieu entre deux franges brillantes.">
    <T15 x={160} y={18} c={GRIS} w={600} a="middle">écran vu de face · pas à l’échelle</T15>
    <Bande y={28} h={50} xs={[40, 100, 160, 220, 280]} c="#f87171"/>
    {[[40, '−2'], [100, '−1'], [160, '0'], [220, '1'], [280, '2']].map(([x, k]) => <T15 key={k} x={x} y={100} a="middle">{k}</T15>)}
    <line x1="160" y1="106" x2="160" y2="132" stroke={GRIS} strokeWidth="1.2" strokeDasharray="3 3"/><line x1="220" y1="106" x2="220" y2="132" stroke={GRIS} strokeWidth="1.2" strokeDasharray="3 3"/>
    <Cote x1={161} y1={126} x2={219} y2={126} c={ORANGE}/><Tx x={190} y={120} s={17} c={ORANGE} a="middle" halo>i</Tx>
    <line x1="130" y1="84" x2="130" y2="146" stroke={GRIS} strokeWidth="1.2" strokeDasharray="2 3"/><T15 x={130} y={164} c={GRIS} w={600} a="middle">sombre</T15>
    <Tx x={30} y={206} s={17} a="middle">i =</Tx><Fr x={92} y={202} haut="λ × D" bas="a" l={66} s={15.5}/>
    <T15 x={146} y={206} c={VERT}>franges régulières</T15>
    <T15 x={14} y={244} c={GRIS} w={600}>k : ordre de la frange</T15>
  </Svg>);

export const CarteNInterfranges = () => (
  <Svg h={218} aria="Schéma pas à l'échelle : on place deux repères sur deux franges brillantes séparées de N interfranges ; la distance d entre les repères vaut N fois i, donc i vaut d divisé par N.">
    <T15 x={160} y={18} c={GRIS} w={600} a="middle">écran vu de face · pas à l’échelle</T15>
    <Bande y={30} h={36} xs={[40, 80, 120, 160, 200, 240, 280]} c="#4ade80"/>
    <line x1="40" y1="28" x2="40" y2="100" stroke="#f59e0b" strokeWidth="2.6"/><line x1="280" y1="28" x2="280" y2="100" stroke="#0e7490" strokeWidth="2.6" strokeDasharray="6 4"/>
    <circle cx="22" cy="48" r="9" fill="#fff" stroke="#f59e0b" strokeWidth="2"/><T15 x={22} y={54} a="middle">1</T15><circle cx="298" cy="48" r="9" fill="#fff" stroke="#0e7490" strokeWidth="2"/><T15 x={298} y={54} a="middle">2</T15>
    <Cote x1={41} y1={94} x2={279} y2={94}/><T15 x={160} y={88} a="middle" halo>d = N × i</T15>
    <Cote x1={81} y1={120} x2={119} y2={120} c={ORANGE}/><Tx x={100} y={146} s={17} c={ORANGE} a="middle">i</Tx>
    <Tx x={150} y={156} s={17} a="middle">i =</Tx><Fr x={190} y={152} haut="d" bas="N" l={32} s={15.5}/><T15 x={218} y={156} c={VERT}>N = 6 ici</T15>
    <T15 x={160} y={208} c={GRIS} w={600} a="middle">N : interfranges entre les repères</T15>
  </Svg>);

export const CartePointe = () => (
  <Svg h={276} aria="Schéma pas à l'échelle : l'erreur de pointé d'un repère est la même quelle que soit la distance mesurée. Sur un seul interfrange, la distance est courte et l'erreur pèse beaucoup ; sur N interfranges, la distance est longue et l'erreur pèse peu.">
    <T15 x={14} y={24}>1 interfrange mesuré :</T15>
    <rect x="130" y="46" width="40" height="10" fill={BLEU}/><rect x="128" y="40" width="4" height="22" fill={ROUGE}/><rect x="168" y="40" width="4" height="22" fill={ROUGE}/>
    <T15 x={14} y={92} c={ROUGE}>l’erreur pèse beaucoup</T15><T15 x={14} y={112} c={GRIS} w={600}>(environ 10 %)</T15>
    <T15 x={14} y={148}>N interfranges mesurés :</T15>
    <rect x="16" y="170" width="288" height="10" fill={BLEU}/><rect x="14.5" y="164" width="3" height="22" fill={ROUGE}/><rect x="302.5" y="164" width="3" height="22" fill={ROUGE}/>
    <T15 x={14} y={216} c={VERT}>l’erreur pèse peu</T15><T15 x={14} y={236} c={GRIS} w={600}>(environ 1 %)</T15>
    <T15 x={14} y={264} c={GRIS} w={600}>rouge : erreur de pointé · pas à l’échelle</T15>
  </Svg>);

export const CarteEffets = () => (
  <Svg h={300} aria="Schéma pas à l'échelle : avec des trous éloignés (a grand), les franges sont serrées, l'interfrange i est petite ; avec des trous rapprochés (a petit), les franges sont plus écartées, i est grande. L'interfrange i égale lambda fois D divisé par a : elle augmente quand lambda augmente, quand D augmente ou quand a diminue.">
    <T15 x={10} y={20}>a grand</T15><Bande y={28} h={34} xs={[34, 70, 106, 142, 178, 214, 250, 286]} c="#f87171" l={11}/>
    <Cote x1={107} y1={80} x2={141} y2={80} c={ORANGE}/><T15 x={156} y={86} c={ORANGE}>i petit</T15>
    <T15 x={10} y={122}>a petit</T15><Bande y={130} h={34} xs={[34, 106, 178, 250]} c="#f87171" l={11}/>
    <Cote x1={107} y1={182} x2={177} y2={182} c={ORANGE}/><T15 x={192} y={188} c={ORANGE}>i grand</T15>
    <Tx x={40} y={232} s={17} a="middle">i =</Tx><Fr x={100} y={228} haut="λ × D" bas="a" l={66} s={15.5}/>
    <T15 x={160} y={264} c={VERT} a="middle">i augmente si λ ↑, D ↑ ou a ↓</T15>
    <T15 x={310} y={292} c={GRIS} w={600} a="end">pas à l’échelle</T15>
  </Svg>);
