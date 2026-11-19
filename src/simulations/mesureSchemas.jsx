// Schémas de la simulation 161 « Mesure et incertitudes » : histogramme (scène principale), scènes du parcours et schémas des cartes « À retenir ».
// Textes ≥ 14 dans un viewBox de 420 (scènes) et ≥ 13,5 dans un viewBox de 330 (cartes) : lisibles sur téléphone (≥ 11 px rendus).
import * as M from "./mesureModele";

const { COL } = M;
const virg = (x, d) => Number(x).toFixed(d).replace('.', ',').replace('-', '−');
const T = (props) => <text fontFamily="system-ui, sans-serif" fill={COL.txt} {...props}/>;
const svgBase = (vb, label, extra = {}) => ({ viewBox: vb, role: 'img', 'aria-label': label, width: '100%', style: { display: 'block', margin: '0 auto', maxWidth: extra.maxWidth || 480 } });

// ====================================================
//  HISTOGRAMME
//  sit : situation ; valeurs : mesures ; w, K : largeur et nombre de classes de chaque côté ; yMax : axe vertical commun
//  moyenne / ref : repères verticaux facultatifs ; bande : demi-largeur de la bande « moyenne ± u » (facultative)
// ====================================================
export function SvgHisto({ sit, valeurs, w, K = M.K_CLASSES, yMax, moyenne = null, reference = null, bande = null, titre, axeX, label, petit = false }) {
  const ww = w || sit.classe, h = M.histogramme(sit, valeurs, ww, K), n = 2 * K + 1;
  const x0 = 44, x1 = 350, yH = petit ? 118 : 150, yTop = 34, yB = yTop + yH, larg = (x1 - x0) / n;
  const ym = yMax || h.max, pasY = ym <= 6 ? 1 : ym <= 12 ? 2 : ym <= 30 ? 5 : ym <= 60 ? 10 : 20, hy = v => yTop + yH - (v / ym) * yH;
  const dClasse = M.decimalesClasse(sit, ww), borneG = sit.centre - (K + 0.5) * ww;
  const xv = v => x0 + ((v - borneG) / (n * ww)) * (x1 - x0);
  const ticksY = []; for (let v = 0; v <= ym; v += pasY) ticksY.push(v);
  const etiquettes = [-K, -K / 2, 0, K / 2, K].map(k => ({ k, x: x0 + (k + K + 0.5) * larg, txt: virg(sit.centre + k * ww, dClasse) }));
  const hauteurTotale = yB + 58;
  return (
    <svg {...svgBase(`0 0 360 ${hauteurTotale}`, label || `Histogramme de ${valeurs.length} mesures`, { maxWidth: 440 })}>
      {titre && <T x="8" y="20" fontSize="16" fontWeight="700">{titre}</T>}
      {ticksY.map(v => <g key={v}><line x1={x0} x2={x1} y1={hy(v)} y2={hy(v)} stroke={COL.grisClair} strokeWidth="1"/><T x={x0 - 6} y={hy(v) + 5} fontSize="15" textAnchor="end" fill={COL.gris}>{v}</T></g>)}
      {h.classes.map((c, i) => c.n > 0 && <rect key={i} x={x0 + i * larg + 1} y={hy(c.n)} width={larg - 2} height={yB - hy(c.n)} fill={COL.bleu} opacity="0.85" rx="2"/>)}
      <line x1={x0} x2={x1} y1={yB} y2={yB} stroke={COL.txt} strokeWidth="1.5"/>
      {etiquettes.map(e => <g key={e.k}><line x1={e.x} x2={e.x} y1={yB} y2={yB + 5} stroke={COL.txt}/><T x={e.x} y={yB + 23} fontSize="15" textAnchor="middle">{e.txt}</T></g>)}
      <T x={(x0 + x1) / 2} y={yB + 48} fontSize="15" textAnchor="middle" fill={COL.gris}>{axeX || `${sit.sym} mesurée (${sit.unite})`}</T>
      <T x="12" y={yTop + yH / 2} fontSize="15" textAnchor="middle" fill={COL.gris} transform={`rotate(-90 12 ${yTop + yH / 2})`}>nb de mesures</T>
      {bande != null && moyenne != null && <rect x={xv(moyenne - bande)} y={yTop} width={Math.max(2, xv(moyenne + bande) - xv(moyenne - bande))} height={yH} fill={COL.orangeClair} opacity="0.55"/>}
      {reference != null && <g><line x1={xv(reference)} x2={xv(reference)} y1={yTop - 4} y2={yB} stroke={COL.vert} strokeWidth="2.5" strokeDasharray="6 4"/>
        <T x={xv(reference) + (xv(reference) < 80 ? 4 : -4)} y={yTop - 8} fontSize="15" textAnchor={xv(reference) < 80 ? 'start' : 'end'} fill={COL.vert} fontWeight="700">référence</T></g>}
      {moyenne != null && <g><line x1={xv(moyenne)} x2={xv(moyenne)} y1={yTop - 4} y2={yB} stroke={COL.orange} strokeWidth="2.5"/>
        <T x={xv(moyenne) + (xv(moyenne) > 270 ? -4 : 4)} y={yTop - 8} fontSize="15" fontWeight="700" fill={COL.orange} textAnchor={xv(moyenne) > 270 ? 'end' : 'start'}>moyenne x̄</T></g>}
    </svg>);
}

// ====================================================
//  SCÈNES DU PARCOURS
// ====================================================
// Pendule et chronomètres : deux mesures de la même durée
export function SvgChronos({ valeurs = null, label }) {
  const aff = v => `${virg(v, 2)} s`;
  return (
    <svg {...svgBase('0 0 420 220', label || 'Un pendule de longueur 50 cm et un chronomètre à main')}>
      <line x1="30" x2="150" y1="22" y2="22" stroke={COL.txt} strokeWidth="4"/>
      <line x1="90" x2="55" y1="22" y2="150" stroke={COL.gris} strokeWidth="2"/>
      <line x1="90" x2="90" y1="22" y2="165" stroke={COL.grisClair} strokeWidth="2" strokeDasharray="5 4"/>
      <circle cx="55" cy="160" r="15" fill={COL.bleu}/>
      <path d="M 90 120 A 44 44 0 0 0 76 117" fill="none" stroke={COL.orange} strokeWidth="2"/>
      <T x="90" y="198" fontSize="16" textAnchor="middle">pendule (L = 0,500 m)</T>
      {(valeurs || [null]).map((v, i, tab) => {
        const y = tab.length > 1 ? 20 + i * 92 : 70;
        return (<g key={i}>
          <rect x="215" y={y} width="190" height="74" rx="14" fill="#f1f5f9" stroke={COL.gris} strokeWidth="2"/>
          <T x="310" y={y + 22} fontSize="16" textAnchor="middle" fill={COL.gris}>{tab.length > 1 ? `Mesure ${i + 1}` : 'chronomètre à main'}</T>
          <T x="310" y={y + 58} fontSize="30" fontWeight="700" textAnchor="middle" fontFamily="monospace">{v == null ? '? s' : aff(v)}</T>
        </g>);
      })}
    </svg>);
}

// Banc d'optique : axe de position de l'écran avec l'intervalle d'image nette [min ; max] ; avec 'moyenne' on repère le milieu
export function SvgBanc({ min = 147, max = 159, repereMilieu = false, label }) {
  const pas = max - min > 20 ? 10 : 5, lo = Math.floor((min - 8) / pas) * pas, hi = Math.ceil((max + 8) / pas) * pas;
  const xm = mm => 40 + (mm - lo) / (hi - lo) * 360;
  const ticks = []; for (let t = lo; t <= hi; t += pas) ticks.push(t);
  return (
    <svg {...svgBase('0 0 420 200', label || 'Axe gradué des positions de l’écran : l’image paraît nette entre deux positions')}>
      <path d="M 18 30 Q 30 60 18 90 Q 6 60 18 30 Z" fill={COL.bleuClair} stroke={COL.bleu} strokeWidth="2"/>
      <T x="6" y="112" fontSize="16">lentille</T>
      <line x1="18" x2="408" y1="60" y2="60" stroke={COL.grisClair} strokeWidth="2" strokeDasharray="6 5"/>
      <rect x={xm(min)} y="40" width={xm(max) - xm(min)} height="40" fill="#bbf7d0" opacity="0.8" rx="4"/>
      <T x={(xm(min) + xm(max)) / 2} y="24" fontSize="16" textAnchor="middle" fill={COL.vert} fontWeight="700">image nette</T>
      <line x1={xm(min)} x2={xm(min)} y1="34" y2="86" stroke={COL.vert} strokeWidth="3"/>
      <line x1={xm(max)} x2={xm(max)} y1="34" y2="86" stroke={COL.vert} strokeWidth="3"/>
      {repereMilieu && <line x1={xm((min + max) / 2)} x2={xm((min + max) / 2)} y1="34" y2="86" stroke={COL.orange} strokeWidth="3" strokeDasharray="4 3"/>}
      <line x1="30" x2="410" y1="120" y2="120" stroke={COL.txt} strokeWidth="1.5"/>
      {ticks.map(t => <g key={t}><line x1={xm(t)} x2={xm(t)} y1="120" y2="128" stroke={COL.txt}/><T x={xm(t)} y="146" fontSize="16" textAnchor="middle">{t}</T></g>)}
      <T x="220" y="172" fontSize="16" textAnchor="middle" fill={COL.gris}>distance lentille-écran (mm)</T>
      <T x={xm(min)} y="192" fontSize="16" textAnchor="middle" fill={COL.vert} fontWeight="700">f′min</T>
      <T x={xm(max)} y="192" fontSize="16" textAnchor="middle" fill={COL.vert} fontWeight="700">f′max</T>
    </svg>);
}

// Éprouvette graduée : lecture d'un volume (zoom sur la zone 30-45 mL)
export function SvgEprouvette({ niveau = 37, label }) {
  const y = v => 190 - (v - 30) * 11.5;             // 30 mL → 190 ; 45 mL → 17,5
  return (
    <svg {...svgBase('0 0 420 230', label || 'Éprouvette graduée de 100 mL : le niveau de l’eau est lu entre les graduations', { maxWidth: 420 })}>
      <rect x="150" y={y(niveau)} width="70" height={196 - y(niveau)} fill={COL.bleuClair}/>
      <path d="M 150 6 L 150 196 L 220 196 L 220 6" fill="none" stroke={COL.txt} strokeWidth="3"/>
      {Array.from({ length: 16 }, (_, i) => 30 + i).map(v => <g key={v}><line x1="150" x2={v % 5 === 0 ? 178 : 166} y1={y(v)} y2={y(v)} stroke={COL.txt} strokeWidth="1.5"/>{v % 5 === 0 && <T x="140" y={y(v) + 5} fontSize="16" textAnchor="end">{v}</T>}</g>)}
      <line x1="150" x2="220" y1={y(niveau)} y2={y(niveau)} stroke={COL.bleu} strokeWidth="3"/>
      <T x="236" y={y(niveau) + 5} fontSize="15" fontWeight="700" fill={COL.bleu}>niveau de l’eau</T>
      <T x="236" y="60" fontSize="16" fill={COL.gris}>graduation : 1 mL</T>
      <T x="140" y="222" fontSize="16" textAnchor="end" fill={COL.gris}>volume (mL)</T>
    </svg>);
}

// ====================================================
//  SCHÉMAS DES CARTES « À RETENIR » (viewBox 330 de large, texte ≥ 13,5)
// ====================================================
const carte = (h, label) => ({ viewBox: `0 0 330 ${h}`, role: 'img', 'aria-label': label, width: '100%', style: { display: 'block', margin: '0 auto', maxWidth: 320 } });

export function SvgCarteHisto() {
  const haut = [1, 3, 6, 8, 5, 2, 1], x0 = 40, lg = 38, yB = 124;
  return (
    <svg {...carte(214, 'Histogramme schématique : sept classes de mesures, hautes au centre, avec la moyenne repérée par un trait vertical')}>
      <T x="165" y="18" fontSize="16" fontWeight="700" textAnchor="middle">Série de mesures = histogramme</T>
      {haut.map((n, i) => <rect key={i} x={x0 + i * lg + 1} y={yB - n * 8.5} width={lg - 2} height={n * 8.5} fill={COL.bleu} opacity="0.85" rx="2"/>)}
      <line x1={x0} x2={x0 + 7 * lg} y1={yB} y2={yB} stroke={COL.txt} strokeWidth="1.5"/>
      <line x1={x0 + 3.5 * lg} x2={x0 + 3.5 * lg} y1="46" y2={yB} stroke={COL.orange} strokeWidth="3"/>
      <T x={x0 + 3.5 * lg} y="42" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.orange}>moyenne x̄</T>
      <T x={x0 + 3.5 * lg} y="146" fontSize="15.5" textAnchor="middle" fill={COL.gris}>valeur mesurée</T>
      <T x="14" y="80" fontSize="15.5" textAnchor="middle" fill={COL.gris} transform="rotate(-90 14 80)">mesures</T>
      <T x="165" y="176" fontSize="15.5" textAnchor="middle" fill={COL.rouge}>x̄ est une estimation,</T>
      <T x="165" y="198" fontSize="15.5" textAnchor="middle" fill={COL.rouge}>pas « la vraie valeur »</T>
    </svg>);
}

export function SvgCarteDispersion() {
  const etroit = [1, 3, 8, 3, 1], large = [2, 4, 4, 4, 2], yB = 128, lg = 28;
  const panneau = (xs, vals, titre, s, couleur) => (<g>
    {vals.map((n, i) => n > 0 && <rect key={i} x={xs + i * lg + 1} y={yB - n * 7.5} width={lg - 2} height={n * 7.5} fill={couleur} opacity="0.85" rx="2"/>)}
    <line x1={xs} x2={xs + 5 * lg} y1={yB} y2={yB} stroke={COL.txt} strokeWidth="1.5"/>
    <T x={xs + 2.5 * lg} y="152" fontSize="16" fontWeight="700" textAnchor="middle">{titre}</T>
    <T x={xs + 2.5 * lg} y="174" fontSize="15.5" textAnchor="middle" fill={COL.gris}>{s}</T>
  </g>);
  return (
    <svg {...carte(214, 'Deux histogrammes de même centre : l’un étroit, l’autre large. Plus les mesures sont étalées, plus l’écart-type est grand.')}>
      <T x="165" y="18" fontSize="16" fontWeight="700" textAnchor="middle">Écart-type s : dispersion</T>
      {panneau(10, etroit, 's petit', 'resserrées', COL.vert)}
      {panneau(180, large, 's grand', 'étalées', COL.rouge)}
      <line x1="80" x2="80" y1="32" y2={yB} stroke={COL.orange} strokeWidth="2" strokeDasharray="4 3"/>
      <line x1="250" x2="250" y1="32" y2={yB} stroke={COL.orange} strokeWidth="2" strokeDasharray="4 3"/>
      <T x="165" y="204" fontSize="15.5" textAnchor="middle" fill={COL.gris}>même moyenne (pointillés)</T>
    </svg>);
}

export function SvgCarteTypeA() {
  const barre = (x, h, n, c) => (<g><rect x={x} y={130 - h} width="62" height={h} fill={c} opacity="0.85" rx="3"/><T x={x + 31} y="152" fontSize="16" fontWeight="700" textAnchor="middle">{n}</T></g>);
  return (
    <svg {...carte(214, 'Deux barres : avec quatre fois plus de mesures, l’incertitude-type de la moyenne est divisée par deux.')}>
      <T x="165" y="18" fontSize="16" fontWeight="700" textAnchor="middle">Plus de mesures : u diminue</T>
      <line x1="16" x2="170" y1="130" y2="130" stroke={COL.txt} strokeWidth="1.5"/>
      {barre(26, 76, 'N = 4', COL.rouge)}
      {barre(98, 38, 'N = 16', COL.vert)}
      <T x="57" y="50" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>u</T>
      <T x="129" y="86" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>u ÷ 2</T>
      <rect x="186" y="40" width="136" height="100" rx="8" fill="#fff7ed" stroke={COL.orange}/>
      <T x="254" y="64" fontSize="16" textAnchor="middle" fontWeight="700">× 4 mesures</T>
      <T x="254" y="88" fontSize="16" textAnchor="middle" fontWeight="700">u ÷ 2</T>
      <T x="254" y="114" fontSize="15.5" textAnchor="middle" fill={COL.gris}>u ÷ 10 demande</T>
      <T x="254" y="132" fontSize="15.5" textAnchor="middle" fill={COL.gris}>× 100 mesures</T>
      <T x="165" y="196" fontSize="15.5" textAnchor="middle" fill={COL.gris}>s reste à peu près le même</T>
    </svg>);
}

export function SvgCarteSysteme() {
  const cible = (cx, pts, titre, sous, c) => (<g>
    {[48, 32, 16].map(r => <circle key={r} cx={cx} cy="80" r={r} fill="none" stroke={COL.grisClair} strokeWidth="2"/>)}
    <circle cx={cx} cy="80" r="3" fill={COL.vert}/>
    {pts.map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={80 + dy} r="5" fill={c}/>)}
    <T x={cx} y="148" fontSize="16" fontWeight="700" textAnchor="middle">{titre}</T>
    <T x={cx} y="170" fontSize="15.5" textAnchor="middle" fill={COL.gris}>{sous}</T>
  </g>);
  return (
    <svg {...carte(218, 'Deux cibles : à gauche des impacts dispersés autour du centre, à droite des impacts regroupés mais décalés du centre.')}>
      <T x="165" y="18" fontSize="16" fontWeight="700" textAnchor="middle">Aléatoire ou systématique</T>
      {cible(82, [[-22, -10], [18, -20], [-8, 24], [26, 14], [-30, 12], [6, -4]], 'aléatoire', 'varie à chaque fois', COL.bleu)}
      {cible(248, [[22, 14], [30, 22], [18, 26], [32, 12], [24, 20], [28, 28]], 'systématique', 'même décalage', COL.rouge)}
      <T x="165" y="204" fontSize="15.5" textAnchor="middle" fill={COL.vert}>● centre : valeur de référence</T>
    </svg>);
}

export function SvgCarteTypeB() {
  return (
    <svg {...carte(214, 'Un axe avec un intervalle centré sur une valeur : de x moins a à x plus a, la demi-largeur a étant repérée de chaque côté.')}>
      <T x="165" y="18" fontSize="16" fontWeight="700" textAnchor="middle">Type B : intervalle connu ± a</T>
      <rect x="50" y="40" width="230" height="40" fill="#bbf7d0" rx="4" opacity="0.8"/>
      <line x1="50" x2="50" y1="32" y2="90" stroke={COL.vert} strokeWidth="3"/>
      <line x1="280" x2="280" y1="32" y2="90" stroke={COL.vert} strokeWidth="3"/>
      <line x1="165" x2="165" y1="40" y2="90" stroke={COL.orange} strokeWidth="3"/>
      <T x="108" y="66" fontSize="15.5" textAnchor="middle" fontWeight="700" fill={COL.vert}>valeurs</T>
      <T x="222" y="66" fontSize="15.5" textAnchor="middle" fontWeight="700" fill={COL.vert}>possibles</T>
      <T x="50" y="110" fontSize="15.5" textAnchor="middle">x − a</T><T x="280" y="110" fontSize="15.5" textAnchor="middle">x + a</T>
      <line x1="52" x2="163" y1="126" y2="126" stroke={COL.txt} strokeWidth="1.5"/><line x1="167" x2="278" y1="126" y2="126" stroke={COL.txt} strokeWidth="1.5"/>
      <T x="108" y="148" fontSize="16" textAnchor="middle" fontWeight="700">a</T><T x="222" y="148" fontSize="16" textAnchor="middle" fontWeight="700">a</T>
      <T x="165" y="104" fontSize="16" textAnchor="middle" fill={COL.orange} fontWeight="700" dy="-70">x</T>
      <T x="165" y="176" fontSize="15.5" textAnchor="middle" fill={COL.gris}>loi uniforme : toutes les valeurs</T>
      <T x="165" y="196" fontSize="15.5" textAnchor="middle" fill={COL.gris}>de l’intervalle sont équiprobables</T>
    </svg>);
}

export function SvgCarteResultat() {
  const ligne = (y, xc, demi, xr, couleurRef, verdict, detail, couleurV) => (<g>
    <rect x={xc - demi} y={y} width={2 * demi} height="22" fill={COL.orangeClair} stroke={COL.orange} strokeWidth="2" rx="3"/>
    <circle cx={xc} cy={y + 11} r="4" fill={COL.orange}/>
    <line x1={xr} x2={xr} y1={y - 6} y2={y + 28} stroke={couleurRef} strokeWidth="3" strokeDasharray="5 3"/>
    <T x="165" y={y + 50} fontSize="16" textAnchor="middle" fontWeight="700" fill={couleurV}>{verdict}</T>
    <T x="165" y={y + 70} fontSize="15.5" textAnchor="middle" fill={couleurV}>{detail}</T>
  </g>);
  return (
    <svg {...carte(266, 'Deux lignes : une mesure x moyenne plus ou moins u avec la référence à l’intérieur de l’intervalle, puis une mesure dont la référence est très loin de l’intervalle.')}>
      <T x="165" y="18" fontSize="16" fontWeight="700" textAnchor="middle">x̄ ± u et la référence</T>
      {ligne(42, 150, 40, 128, COL.vert, 'compatible', 'référence dans l’intervalle', COL.vert)}
      {ligne(138, 110, 30, 250, COL.rouge, 'à expliquer', 'écart de plusieurs u', COL.rouge)}
      <T x="165" y="236" fontSize="15.5" textAnchor="middle" fill={COL.gris}>orange : x̄ ± u</T>
      <T x="165" y="256" fontSize="15.5" textAnchor="middle" fill={COL.gris}>pointillés : référence</T>
    </svg>);
}
