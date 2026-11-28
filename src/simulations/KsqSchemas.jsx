// Cartes « À retenir » de la simulation 309 (Ks, Qr, solubilité). viewBox de 300 de large, textes de 12,5 à 16, maxWidth 320.
import { K, T, svgStyle } from "./schemaOutils";
import * as M from "./ksqModele";
import { FormuleSvg } from '../svgFrac';

const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const CAT = '#0369a1', AN = '#c2410c';
const ion = (x, y, signe, col, r = 7) => <g key={`${x}${y}`}><circle cx={x} cy={y} r={r} fill={col} stroke="#fff" strokeWidth="1.2"/><text x={x} y={y + 4.4} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">{signe}</text></g>;

// Carte 1 : équilibre de dissolution et expression de Ks
export function SvgKsCarte() {
  return cadre('Un solide en équilibre avec ses ions dissous : CaF2 solide qui se dissout en un ion calcium et deux ions fluorure ; Ks est le produit des concentrations à l’équilibre', 214, <g>
    <path d="M22 40 L28 128 Q29 134 36 134 L98 134 Q105 134 106 128 L112 40" fill="#e0f2fe" stroke="#334155" strokeWidth="2.4" strokeLinejoin="round"/>
    <rect x="35" y="118" width="64" height="14" rx="3" fill="#e7e5e4" stroke="#78716c" strokeWidth="1.4"/>
    {ion(44, 62, '+', CAT)}{ion(86, 74, '−', AN)}{ion(62, 92, '−', AN)}{ion(98, 100, '+', CAT)}{ion(40, 98, '−', AN)}{ion(72, 56, '+', CAT)}
    {T(67, 154, 'CaF₂ solide', { size: 13, gras: true, fill: '#57534e' })}{T(67, 170, 'et ses ions', { size: 13, fill: K.gris })}
    {T(206, 52, 'À l’équilibre :', { size: 13, gras: true, fill: K.txt })}
    <text x="206" y="82" textAnchor="middle" fontSize="15" fontWeight="700" fill={K.txt}>CaF₂ ⇌ Ca²⁺ + 2 F⁻</text>
    <rect x="130" y="100" width="164" height="54" rx="10" fill="#fff" stroke={K.bleu} strokeWidth="2"/>
    <text x="212" y="122" textAnchor="middle" fontSize="13" fontWeight="700" fill={K.bleu}>produit de solubilité</text>
    <text x="212" y="144" textAnchor="middle" fontSize="15" fontWeight="800" fill={K.txt}>Ks = [Ca²⁺] × [F⁻]²</text>
    {T(150, 198, 'exposant = coefficient de l’ion', { size: 12.5, gras: true, fill: '#15803d' })}
  </g>);
}

// Carte 2 : Qr comparé à Ks
export function SvgQrCarte() {
  const zone = (x, w, fill, titre, sous, col) => (<g key={titre}><rect x={x} y="40" width={w} height="56" rx="8" fill={fill} stroke="#334155" strokeWidth="1.2"/>
    <text x={x + w / 2} y="62" textAnchor="middle" fontSize="13" fontWeight="800" fill={col}>{titre}</text><text x={x + w / 2} y="82" textAnchor="middle" fontSize="12.5" fill={K.txt}>{sous}</text></g>);
  return cadre('Comparer Qr et Ks : si Qr est plus petit que Ks il n’y a pas de précipité, si Qr est égal à Ks la solution est saturée, si Qr est plus grand que Ks un précipité se forme jusqu’à ce que Qr devienne égal à Ks', 214, <g>
    {T(150, 26, 'On calcule Qr avec les concentrations du moment', { size: 12.5, gras: true, fill: K.txt })}
    {zone(14, 86, '#dcfce7', 'Qr < Ks', 'pas de solide', '#166534')}{zone(104, 92, '#fde68a', 'Qr = Ks', 'saturée', '#92400e')}{zone(200, 86, '#fee2e2', 'Qr > Ks', 'précipité', '#991b1b')}
    <line x1="30" y1="118" x2="270" y2="118" stroke={K.txt} strokeWidth="2.4"/><polygon points="270,112 284,118 270,124" fill={K.txt}/>
    {T(150, 140, 'Qr augmente', { size: 12.5, fill: K.gris })}
    <rect x="14" y="152" width="272" height="50" rx="10" fill="#fff" stroke={K.bleu} strokeWidth="1.8"/>
    {T(150, 172, 'Si Qr > Ks : le solide se forme', { size: 13, gras: true, fill: K.txt })}
    {T(150, 192, 'jusqu’à ce que Qr = Ks', { size: 13, gras: true, fill: K.bleu })}
  </g>);
}

// Carte 3 : solubilité s à partir de Ks
export function SvgSolubiliteCarte() {
  const cu = M.SELS.CuI, ca = M.SELS.CaF2;
  return cadre('Solubilité à partir de Ks : pour un sel de formule AB, s est la racine carrée de Ks ; pour un sel de formule AB2, s est la racine cubique de Ks divisé par 4', 226, <g>
    <rect x="12" y="14" width="276" height="92" rx="10" fill="#fff" stroke={K.clair}/>
    {T(150, 34, 'Sel 1 : 1  (ex. CuI)', { size: 13, gras: true, fill: K.bleu })}
    <text x="150" y="56" textAnchor="middle" fontSize="14" fill={K.txt}>CuI ⇌ Cu⁺ + I⁻ : [Cu⁺] = [I⁻] = s</text>
    <text x="150" y="80" textAnchor="middle" fontSize="16" fontWeight="800" fill={K.txt}>Ks = s²  donc  s = √Ks</text>
    <text x="150" y="98" textAnchor="middle" fontSize="12.5" fill={K.gris}>{`Ks = ${M.sciNb(cu.Ks, 2)} : s ≈ ${M.sciNb(M.solubilite(cu), 1)} mol/L`}</text>
    <rect x="12" y="116" width="276" height="100" rx="10" fill="#fff" stroke={K.clair}/>
    {T(150, 136, 'Sel 1 : 2  (ex. CaF₂)', { size: 13, gras: true, fill: AN })}
    <text x="150" y="158" textAnchor="middle" fontSize="14" fill={K.txt}>[Ca²⁺] = s et [F⁻] = 2 s</text>
    <FormuleSvg x={150} y={182} s={16} w={800} c={K.txt} a="middle" parts={['Ks = 4 s³  donc  s = ∛(', { h: 'Ks', b: '4' }, ')']} />
    <text x="150" y="203" textAnchor="middle" fontSize="12.5" fill={K.gris}>{`Ks = ${M.sciNb(ca.Ks, 2)} : s ≈ ${M.sciNb(M.solubilite(ca), 1)} mol/L`}</text>
  </g>);
}

// Carte 4 : Ks et solubilité ne se classent pas toujours dans le même ordre
export function SvgPiegeKsCarte() {
  const a = M.SELS.CaF2, b = M.SELS.SrCO3;
  const L = v => 20 + (Math.log10(v) + 11) * 17;      // échelle logarithmique : 17 px par décade
  const barre = (y, v, col, t, val) => (<g key={t + y}><rect x="14" y={y} width={Math.max(10, L(v) - 14)} height="22" rx="4" fill={col}/>
    <text x={Math.min(L(v) + 6, 190)} y={y + 16} fontSize="12.5" fontWeight="700" fill={K.txt}>{t}</text>
    <text x="286" y={y + 16} textAnchor="end" fontSize="12.5" fill={K.gris}>{val}</text></g>);
  return cadre('Deux sels de formules différentes : le fluorure de calcium a un Ks plus petit que le carbonate de strontium, mais une solubilité plus grande', 232, <g>
    {T(150, 26, 'Ks plus petit, mais s plus grand !', { size: 14, gras: true, fill: '#b91c1c' })}
    {T(14, 52, 'Ks · échelle logarithmique', { size: 14, gras: true, fill: K.txt, anchor: 'start' })}
    {barre(60, a.Ks, '#fb923c', 'CaF₂', M.sciNb(a.Ks, 1))}{barre(88, b.Ks, '#38bdf8', 'SrCO₃', M.sciNb(b.Ks, 1))}
    {T(14, 134, 's (mol/L) · échelle logarithmique', { size: 14, gras: true, fill: K.txt, anchor: 'start' })}
    {barre(142, M.solubilite(a), '#fb923c', 'CaF₂', M.sciNb(M.solubilite(a), 1))}{barre(170, M.solubilite(b), '#38bdf8', 'SrCO₃', M.sciNb(M.solubilite(b), 1))}
    {T(150, 214, 'Formules différentes : on compare les s, pas les Ks', { size: 12.5, gras: true, fill: '#15803d' })}
  </g>);
}
