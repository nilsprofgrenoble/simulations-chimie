// Schémas de la simulation 302 « Fluorescence X : de la lacune à la raie de l'élément ». SVG, largeur 100 % plafonnée.
import { K, T, svgStyle } from "./schemaOutils";
import { spectre, ELEMENTS } from "./frxModele";

const carte = { display: 'block', width: '100%', maxWidth: 320, margin: '0 auto' };
const R = { K: 24, L: 50, M: 76 }, CX = 170, CY = 118;
const pt = (r, deg) => [CX + r * Math.cos(deg * Math.PI / 180), CY - r * Math.sin(deg * Math.PI / 180)];
const fl = (x1, y1, x2, y2, col, w = 2.4) => { const a = Math.atan2(y2 - y1, x2 - x1), L = 9; return <g><line x1={x1} y1={y1} x2={x2 - L * Math.cos(a)} y2={y2 - L * Math.sin(a)} stroke={col} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - L * Math.cos(a) + 5 * Math.sin(a)},${y2 - L * Math.sin(a) - 5 * Math.cos(a)} ${x2 - L * Math.cos(a) - 5 * Math.sin(a)},${y2 - L * Math.sin(a) + 5 * Math.cos(a)}`} fill={col}/></g>; };
// photon : trait ondulé
const onde = (x1, y1, x2, y2, col, haut = 5) => {
  const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1), n = Math.max(2, Math.round(L / 12)); let d = '';
  for (let i = 0; i <= n * 6; i++) { const s = i / (n * 6) * (L - 8), o = Math.sin(i / 6 * 2 * Math.PI) * haut; d += `${i ? 'L' : 'M'}${(x1 + s * Math.cos(a) - o * Math.sin(a)).toFixed(1)},${(y1 + s * Math.sin(a) + o * Math.cos(a)).toFixed(1)}`; }
  return <g><path d={d} fill="none" stroke={col} strokeWidth="2.4"/>{fl(x2 - 10 * Math.cos(a), y2 - 10 * Math.sin(a), x2, y2, col, 0.1)}</g>;
};
const eMolecule = (x, y, k) => <circle key={k} cx={x} cy={y} r="4.6" fill="#2563eb" stroke="#fff" strokeWidth="1"/>;

// ---------- atome : couches K, L, M ; états : repos, ejecte (lacune en K), saut (L → K : raie Kα), saut2 (L → K et M → K : Kα et Kβ) ----------
export function SceneAtome({ etat = 'repos', photon = null, photonLabel = '', raies = ['Kα', 'Kβ'] }) {
  const elK = [30, 210], elL = [30, 75, 120, 165, 210, 255, 300, 345], elM = [60, 150, 240, 330];
  const lacuneK = etat !== 'repos', saut = etat === 'saut' || etat === 'saut2', saut2 = etat === 'saut2';
  const [px, py] = pt(R.K, 30);
  const ouvertL = saut ? 30 : null, ouvertM = saut2 ? 60 : null;
  return (<svg role="img" aria-label="Atome avec ses couches électroniques K, L et M : un photon X éjecte un électron de cœur, un électron d'une couche supérieure comble la lacune et un photon X caractéristique est émis" viewBox="0 0 340 236" width="100%" style={svgStyle}>
    {['K', 'L', 'M'].map(c => <circle key={c} cx={CX} cy={CY} r={R[c]} fill="none" stroke={K.clair} strokeWidth="1.6"/>)}
    <circle cx={CX} cy={CY} r="9" fill="#7c3aed"/>{T(CX, CY + 4, '+', { size: 13, gras: true, fill: '#fff' })}
    {[['K', R.K], ['L', R.L], ['M', R.M]].map(([c, r]) => T(CX, CY + r + 4, c, { size: 13, gras: true, fill: K.gris, halo: true }))}
    {elK.map(a => (a === 30 && lacuneK && !saut) || (a === 30 && saut) ? null : eMolecule(...pt(R.K, a), `k${a}`))}
    {elL.map(a => (a === ouvertL ? null : eMolecule(...pt(R.L, a), `l${a}`)))}
    {elM.map(a => (a === ouvertM ? null : eMolecule(...pt(R.M, a), `m${a}`)))}
    {saut && eMolecule(px, py, 'kfill')}
    {lacuneK && !saut && <g><circle cx={px} cy={py} r="6" fill="#fff" stroke="#dc2626" strokeWidth="1.8" strokeDasharray="3 2"/>{T(px + 12, py - 8, 'lacune', { size: 12.5, gras: true, fill: '#dc2626', anchor: 'start', halo: true })}</g>}
    {saut && <g><circle cx={pt(R.L, 30)[0]} cy={pt(R.L, 30)[1]} r="6" fill="#fff" stroke="#dc2626" strokeWidth="1.8" strokeDasharray="3 2"/></g>}
    {etat === 'ejecte' && <g>{fl(px + 6, py - 4, 300, 20, '#2563eb')}{T(306, 36, 'e⁻', { size: 14, gras: true, fill: '#2563eb' })}</g>}
    {photon != null && (etat === 'repos' || etat === 'ejecte') && <g>{onde(8, CY + 6, CX - 30, CY + 6, '#7c3aed')}{T(52, CY - 14, `photon X`, { size: 13, gras: true, fill: '#7c3aed' })}{T(52, CY + 28, photonLabel, { size: 13, fill: '#7c3aed' })}</g>}
    {saut && <g>{onde(CX + 36, CY - 4, 326, CY + 4, '#ea580c')}{T(334, CY - 10, raies[0], { size: 14, gras: true, fill: '#ea580c', anchor: 'end' })}</g>}
    {saut2 && <g>{onde(CX + 32, CY + 6, 326, CY + 66, '#be123c')}{T(334, CY + 88, raies[1], { size: 14, gras: true, fill: '#be123c', anchor: 'end' })}</g>}
    {saut && <g>{fl(...pt(R.L - 3, 30), ...pt(R.K + 7, 30), '#ea580c', 2)}{T(332, 18, 'L → K', { size: 13, gras: true, fill: '#ea580c', anchor: 'end' })}</g>}
    {saut2 && <g>{fl(...pt(R.M - 3, 60), ...pt(R.K + 9, 36), '#be123c', 2)}{T(332, 36, 'M → K', { size: 13, gras: true, fill: '#be123c', anchor: 'end' })}</g>}
  </svg>);
}

// ---------- spectre X : coups par seconde en fonction de l'énergie ----------
const X0 = 40, X1 = 326, XMAX = 12, sx = E => X0 + E / XMAX * (X1 - X0);
export function SceneSpectreX({ comp, marques = [], etiquettes = [], echelle = 'lin', yMax = null, titre = null }) {
  const pic = Math.max(...Array.from({ length: 300 }, (_, i) => spectre(comp, i * 0.04))), top = yMax ?? pic * 1.12;
  const sy = c => echelle === 'log' ? 160 - (Math.log10(Math.max(c, 1)) - 0.8) / (4.5 - 0.8) * 124 : 160 - Math.min(1, c / top) * 124;
  let d = ''; for (let i = 0; i <= 300; i++) { const E = i * 0.04; d += `${i ? 'L' : 'M'}${sx(E).toFixed(1)},${sy(spectre(comp, E)).toFixed(1)}`; }
  return (<svg role="img" aria-label="Spectre de fluorescence X : nombre de coups par seconde en fonction de l'énergie des photons" viewBox="0 0 340 214" width="100%" style={svgStyle}>
    <line x1={X0} y1="160" x2={X1} y2="160" stroke={K.gris}/><line x1={X0} y1="30" x2={X0} y2="160" stroke={K.gris}/>
    {[0, 2, 4, 6, 8, 10, 12].map(E => <g key={E}><line x1={sx(E)} y1="160" x2={sx(E)} y2="165" stroke={K.gris}/>{T(sx(E), 180, String(E), { size: 12, fill: K.gris })}</g>)}
    {echelle === 'log' && [10, 100, 1000, 10000].map(c => <g key={c}><line x1={X0 - 4} y1={sy(c)} x2={X0} y2={sy(c)} stroke={K.gris}/>{T(X0 - 6, sy(c) + 4, c === 10000 ? '10⁴' : c === 1000 ? '10³' : String(c), { size: 11, fill: K.gris, anchor: 'end' })}</g>)}
    {T(X1, 198, 'énergie des photons X (keV)', { anchor: 'end', size: 12, fill: K.gris })}{T(X0 + 4, 22, echelle === 'log' ? 'coups/s (échelle log)' : 'coups/s', { size: 12, gras: true, anchor: 'start' })}
    {titre && T(X1, 22, titre, { size: 12, gras: true, anchor: 'end', fill: K.gris })}
    <path d={d} fill="none" stroke="#1d4ed8" strokeWidth="2"/>
    {etiquettes.map(([E, txt, dy = 0, anc = 'middle']) => T(sx(E), sy(spectre(comp, E)) - 8 + dy, txt, { size: 12.5, gras: true, fill: '#0f172a', anchor: anc, halo: true }))}
    {marques.map(([E, txt, col = '#dc2626', anc = 'middle']) => <g key={E}><line x1={sx(E)} y1="34" x2={sx(E)} y2="160" stroke={col} strokeDasharray="4 3" strokeWidth="1.6"/>{T(sx(E) + (anc === 'end' ? -4 : anc === 'start' ? 4 : 0), 30, txt, { size: 12, gras: true, fill: col, anchor: anc })}</g>)}
  </svg>);
}

// ---------- droite d'étalonnage : intensité nette en fonction de la teneur ----------
export function SceneEtalonnage({ points, wMax = 12, IMax }) {
  const ym = IMax ?? Math.max(...points.map(p => p[1])) * 1.15, x = w => 48 + w / wMax * 270, y = I => 160 - I / ym * 124, [w1, I1] = points[points.length - 1];
  return (<svg role="img" aria-label="Droite d'étalonnage : intensité de la raie en fonction de la teneur de l'élément" viewBox="0 0 340 208" width="100%" style={svgStyle}>
    <line x1="48" y1="160" x2="322" y2="160" stroke={K.gris}/><line x1="48" y1="30" x2="48" y2="160" stroke={K.gris}/>
    {[0, 2, 4, 6, 8, 10, 12].filter(w => w <= wMax).map(w => <g key={w}><line x1={x(w)} y1="160" x2={x(w)} y2="165" stroke={K.gris}/>{T(x(w), 180, String(w), { size: 12, fill: K.gris })}</g>)}
    {T(322, 199, 'teneur de l’élément (% massique)', { anchor: 'end', size: 12, fill: K.gris })}{T(52, 22, 'intensité nette (coups/s)', { size: 12, gras: true, anchor: 'start' })}
    <line x1={x(0)} y1={y(0)} x2={x(wMax)} y2={y(I1 / w1 * wMax)} stroke="#1d4ed8" strokeWidth="2" strokeDasharray="5 3"/>
    {points.map(([w, I]) => <g key={w}><circle cx={x(w)} cy={y(I)} r="5.5" fill="#1d4ed8" stroke="#fff" strokeWidth="1.5"/>{T(x(w), y(I) - 10, `${I}`, { size: 12, gras: true, fill: '#1d4ed8' })}</g>)}
  </svg>);
}

// ---------- appareil : tube X, échantillon, détecteur, analyseur ----------
export function SceneAppareil() {
  const bo = (x, y, w, h, txt, col, t2) => <g><rect x={x} y={y} width={w} height={h} rx="8" fill={col + '22'} stroke={col} strokeWidth="1.8"/>{T(x + w / 2, y + h / 2 + (t2 ? -2 : 5), txt, { size: 13, gras: true })}{t2 && T(x + w / 2, y + h / 2 + 14, t2, { size: 12.5 })}</g>;
  return (<svg role="img" aria-label="Spectromètre de fluorescence X : tube à rayons X, échantillon, détecteur et analyseur multicanal" viewBox="0 0 340 200" width="100%" style={svgStyle}>
    {bo(10, 14, 100, 48, 'Tube', '#7c3aed', 'à rayons X')}{bo(230, 14, 100, 48, 'Détecteur', '#0f766e', 'photons X')}{bo(120, 138, 100, 40, 'Échantillon', '#b45309')}{bo(230, 100, 100, 48, 'Analyseur', '#1d4ed8', 'multicanal')}
    {onde(66, 64, 150, 134, '#7c3aed')}{T(40, 104, 'rayons X', { size: 12.5, fill: '#7c3aed', gras: true })}{T(40, 120, 'primaires', { size: 12.5, fill: '#7c3aed', gras: true })}
    {onde(190, 134, 270, 66, '#ea580c')}{T(246, 112, 'raies X', { size: 12.5, fill: '#ea580c', gras: true, anchor: 'end' })}
    {fl(280, 62, 280, 98, K.gris)}{T(334, 192, '→ spectre', { size: 12, fill: K.gris, anchor: 'end' })}
  </svg>);
}

// ---------- cartes « À retenir » (viewBox 300, texte ≥ 12,5) ----------
export function SvgCarteTransitions() {
  return (<svg role="img" aria-label="Niveaux d'énergie K, L et M : les raies Kα et Kβ sont émises quand un électron L ou M comble une lacune K" viewBox="0 0 300 232" style={carte}>
    {T(150, 18, 'Une raie = écart entre deux niveaux', { size: 14, gras: true })}
    <line x1="30" y1="40" x2="170" y2="40" stroke={K.txt} strokeWidth="2.4"/>{T(24, 45, 'M', { size: 14, gras: true, anchor: 'end' })}
    <line x1="30" y1="86" x2="170" y2="86" stroke={K.txt} strokeWidth="2.4"/>{T(24, 91, 'L', { size: 14, gras: true, anchor: 'end' })}
    <line x1="30" y1="170" x2="170" y2="170" stroke={K.txt} strokeWidth="2.4"/>{T(24, 175, 'K', { size: 14, gras: true, anchor: 'end' })}
    {fl(70, 90, 70, 166, '#ea580c')}{T(112, 130, 'Kα', { size: 14, gras: true, fill: '#ea580c' })}{fl(130, 44, 130, 166, '#be123c')}{T(100, 70, '', {})}{T(152, 108, 'Kβ', { size: 14, gras: true, fill: '#be123c', anchor: 'start' })}
    {T(228, 60, 'E(Kβ) > E(Kα)', { size: 13, gras: true, fill: '#be123c' })}{T(228, 78, 'Kβ moins intense', { size: 12.5, fill: K.gris })}
    {T(150, 202, 'E(raie) = E(niveau haut) − E(niveau bas)', { size: 12.5, fill: K.gris })}{T(150, 220, 'valeur propre à chaque élément', { size: 12.5, fill: K.gris })}
  </svg>);
}
export function SvgCarteMoseley() {
  const x = Z => 34 + (Z - 12) / 19 * 236, y = E => 150 - E / 9 * 112;
  return (<svg role="img" aria-label="Énergie de la raie Kα en fonction du numéro atomique : elle augmente avec Z" viewBox="0 0 300 216" style={carte}>
    {T(150, 18, 'Kα augmente avec Z', { size: 14, gras: true })}
    <line x1="30" y1="150" x2="280" y2="150" stroke={K.gris}/><line x1="30" y1="34" x2="30" y2="150" stroke={K.gris}/>
    {[[15, ''], [20, ''], [25, ''], [30, '']].map(([Z]) => <g key={Z}><line x1={x(Z)} y1="150" x2={x(Z)} y2="155" stroke={K.gris}/>{T(x(Z), 170, String(Z), { size: 12.5, fill: K.gris })}</g>)}
    {T(284, 186, 'numéro atomique Z', { size: 12.5, fill: K.gris, anchor: 'end' })}{T(34, 30, 'Kα (keV)', { size: 12.5, fill: K.gris, anchor: 'start' })}
    {ELEMENTS.map(e => <circle key={e.s} cx={x(e.Z)} cy={y(e.Ka)} r="4.4" fill="#ea580c"/>)}
    {[['Al', 13], ['Ca', 20], ['Fe', 26], ['Zn', 30]].map(([s, Z]) => T(x(Z) + (Z > 28 ? -8 : 6), y(ELEMENTS.find(e => e.s === s).Ka) + (Z > 28 ? 16 : -8), s, { size: 12.5, gras: true, anchor: Z > 28 ? 'end' : 'start' }))}
    {T(150, 200, 'Kα ≈ 10,2 × (Z − 1)² eV', { size: 12.5, fill: K.gris })}
  </svg>);
}
export function SvgCarteBilanFrx() {
  const b = (x, y, w, h, l1, l2, col) => <g><rect x={x} y={y} width={w} height={h} rx="8" fill={col + '22'} stroke={col} strokeWidth="1.6"/>{T(x + w / 2, y + h / 2 - 2, l1, { size: 12.5, gras: true })}{T(x + w / 2, y + h / 2 + 13, l2, { size: 12.5 })}</g>;
  return (<svg role="img" aria-label="De la fluorescence X à l'analyse : l'énergie de la raie donne l'élément, la hauteur du pic donne la teneur" viewBox="0 0 300 232" style={carte}>
    {T(150, 18, 'Ce que dit un spectre X', { size: 14, gras: true })}
    {b(14, 32, 122, 46, 'Énergie du pic', 'quel élément ?', '#ea580c')}{b(164, 32, 122, 46, 'Hauteur du pic', 'quelle teneur ?', '#1d4ed8')}
    {T(75, 98, 'Kα, Kβ propres à Z', { size: 12.5, fill: K.gris })}{T(225, 98, 'étalonnage I = a × w', { size: 12.5, fill: K.gris })}
    {b(14, 116, 272, 40, 'Non destructif, sans préparation', 'solides, poudres, liquides', '#0f766e')}
    {b(14, 170, 272, 44, 'Éléments légers difficiles', 'raies peu énergétiques et rares', '#b45309')}
  </svg>);
}
