// Schémas des cartes « À retenir » de la simulation 158 (Savons et amphiphilie). viewBox de 300 de large, textes de 13 à 16
// (≥ 11 px rendus à 390 px), plafond maxWidth 320. Bleu = tête polaire, orange = chaîne apolaire, vert = bon, rouge = piège.
// Les formules et les dessins viennent des mêmes composants que la simulation : ils ne peuvent pas la contredire.
import * as M from "./savonModele";
import { C } from "./savonCouleurs";
import { Ion, IonCercle, Micelle, MoleculeSvg } from "./SavonScenes";

const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const T = p => <text fontSize="13.5" fill={C.encre} {...p}/>;

// ---------- carte 1 : une espèce amphiphile ----------
export function SvgAmphiphile() {
  return (
    <svg viewBox="0 0 300 208" style={stl} role="img" aria-label="Ion stéarate CH₃–(CH₂)₁₆–COO⁻ dessiné en zigzag : la longue chaîne carbonée apolaire est orange et le groupe COO⁻ polaire est bleu. En dessous : la tête est hydrophile (elle aime l’eau), la chaîne est lipophile (elle aime le gras).">
      <MoleculeSvg e={M.entite('stearate')} etiquettes neutre nested/>
      <rect x="6" y="122" width="140" height="76" rx="10" fill="#e0f2fe" stroke={C.tete} strokeWidth="2"/>
      <text x="76" y="144" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.tete}>TÊTE COO⁻</text>
      <text x="76" y="166" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.encre}>hydrophile</text>
      <T x="76" y="186" textAnchor="middle" fill={C.tete} fontWeight="700">aime l’eau</T>
      <rect x="154" y="122" width="140" height="76" rx="10" fill="#fef3c7" stroke={C.queue} strokeWidth="2"/>
      <text x="224" y="144" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.queue}>CHAÎNE</text>
      <text x="224" y="166" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.encre}>lipophile</text>
      <T x="224" y="186" textAnchor="middle" fill={C.queue} fontWeight="700">aime le gras</T>
    </svg>);
}

// ---------- carte 2 : à la surface de l'eau ----------
export function SvgSurface() {
  const xs = [26, 62, 98, 134, 170];
  return (
    <svg viewBox="0 0 300 190" style={stl} role="img" aria-label="Ions carboxylate à la surface de l’eau : les têtes polaires, en bleu, plongent dans l’eau ; les chaînes apolaires, en orange, dépassent dans l’air.">
      <rect x="0" y="92" width="300" height="98" fill={C.eau}/><line x1="0" y1="92" x2="300" y2="92" stroke="#0284c7" strokeWidth="1.6"/>
      {xs.map(x => <Ion key={x} x={x} y={106} ang={0} L={30}/>)}
      <text x="8" y="22" fontSize="14" fontWeight="800" fill={C.gris}>air</text>
      <text x="8" y="182" fontSize="14" fontWeight="800" fill="#075985">eau</text>
      <line x1="178" y1="48" x2="196" y2="48" stroke={C.queue} strokeWidth="2"/>
      <text x="200" y="46" fontSize="14" fontWeight="800" fill={C.queue}>queue apolaire</text><text x="200" y="63" fontSize="14" fontWeight="800" fill={C.queue}>hors de l’eau</text>
      <line x1="178" y1="108" x2="196" y2="116" stroke={C.tete} strokeWidth="2"/>
      <text x="200" y="124" fontSize="14" fontWeight="800" fill={C.tete}>tête polaire</text><text x="200" y="141" fontSize="14" fontWeight="800" fill={C.tete}>dans l’eau</text>
    </svg>);
}

// ---------- carte 3 : la micelle ----------
export function SvgMicelle() {
  return (
    <svg viewBox="0 0 300 232" style={stl} role="img" aria-label="Une micelle : des ions carboxylate disposés en sphère, les têtes polaires bleues à l’extérieur, au contact de l’eau, et les chaînes apolaires orange regroupées au centre, à l’abri de l’eau.">
      <rect x="0" y="0" width="300" height="232" fill={C.eauPale}/>
      <Micelle cx={150} cy={102} R={64} n={20} L={42}/>
      <text x="292" y="22" textAnchor="end" fontSize="14" fontWeight="800" fill="#075985">eau</text>
      <line x1="62" y1="52" x2="96" y2="70" stroke={C.tete} strokeWidth="2"/>
      <text x="6" y="42" fontSize="14" fontWeight="800" fill={C.tete}>têtes vers l’eau</text>
      <text x="150" y="196" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.queue}>chaînes regroupées au centre</text>
      <line x1="150" y1="180" x2="150" y2="116" stroke={C.queue} strokeWidth="2"/>
      <T x="150" y="220" textAnchor="middle" fill={C.gris}>modèle qualitatif, pas à l’échelle</T>
    </svg>);
}

// ---------- carte 4 : le lavage en trois temps ----------
export function SvgLavage() {
  const panneau = (x, num, mot, contenu) => (
    <g transform={`translate(${x} 0)`}>
      <rect x="0" y="0" width="94" height="112" rx="8" fill={C.eauPale} stroke={C.clair}/>
      <circle cx="13" cy="14" r="10" fill="white" stroke={C.gris} strokeWidth="1.6"/><text x="13" y="19" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.encre}>{num}</text>
      {contenu}
      <text x="47" y="134" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.encre}>{mot}</text>
    </g>);
  const tissu = <g><rect x="0" y="94" width="94" height="18" fill="#cbd5e1"/><line x1="0" y1="94" x2="94" y2="94" stroke={C.gris} strokeWidth="1.6"/></g>;
  const goutte = (cx, cy, r) => <circle cx={cx} cy={cy} r={r} fill={C.huile} stroke={C.huileBord} strokeWidth="1.4"/>;
  return (
    <svg viewBox="0 0 300 184" style={stl} role="img" aria-label="Le lavage en trois temps : 1, les chaînes des ions s’insèrent dans la goutte d’huile posée sur le tissu ; 2, la goutte, entourée de têtes, se détache ; 3, piégée dans une micelle, elle est emportée par l’eau de rinçage.">
      {panneau(2, '1', 'insertion', <>{tissu}{goutte(47, 84, 15)}{Array.from({ length: 8 }, (_, k) => <IonCercle key={k} cx={47} cy={84} R={19} th={195 + (150 / 7) * k} L={9} r={3.2}/>)}</>)}
      {panneau(103, '2', 'détachement', <>{tissu}{goutte(47, 58, 15)}{Array.from({ length: 11 }, (_, k) => <IonCercle key={k} cx={47} cy={58} R={19} th={(360 / 11) * k + 8} L={9} r={3.2}/>)}<path d="M47 28 v-8 M42 25 l5 -6 l5 6" stroke={C.gris} strokeWidth="2" fill="none"/></>)}
      {panneau(204, '3', 'rinçage', <>{tissu}<Micelle cx={52} cy={52} R={21} n={11} L={11} coeur={17}/><path d="M8 88 h30 M31 82 l7 6 l-7 6" stroke="#0284c7" strokeWidth="2.4" fill="none"/></>)}
      <T x="150" y="156" textAnchor="middle" fill={C.gris}>l’huile n’est pas détruite : elle est emportée</T>
      <T x="150" y="174" textAnchor="middle" fill={C.gris}>schéma simplifié, pas à l’échelle</T>
    </svg>);
}

// ---------- carte 5 : applications des tensioactifs ----------
export function SvgApplications() {
  const L = (x, y, t, a = 'start') => <text x={x} y={y} textAnchor={a} fontSize="14.5" fontWeight="800" fill={C.encre}>{t}</text>;
  return (
    <svg viewBox="0 0 300 200" style={stl} role="img" aria-label="Une même espèce amphiphile, à tête polaire bleue et queue apolaire orange, au centre ; autour d’elle six usages : lessive, gel douche, shampoing, produit vaisselle, mayonnaise (lécithine) et cosmétiques.">
      <Ion x={150} y={118} ang={0} L={52} r={10}/>
      {[[40, 'lessive', 6, 'start'], [100, 'gel douche', 6, 'start'], [160, 'shampoing', 6, 'start']].map(([y, t, x]) => <g key={t}><line x1="112" y1={y - 5} x2="144" y2={y < 100 ? 92 : y > 120 ? 128 : 110} stroke={C.clair} strokeWidth="2"/>{L(x, y, t)}</g>)}
      {[[40, 'vaisselle'], [100, 'mayonnaise'], [160, 'cosmétiques']].map(([y, t]) => <g key={t}><line x1="156" y1={y < 100 ? 92 : y > 120 ? 128 : 110} x2="186" y2={y - 5} stroke={C.clair} strokeWidth="2"/>{L(190, y, t)}</g>)}
      <text x="190" y="117" fontSize="13" fontWeight="700" fill={C.gris}>(lécithine)</text>
      <T x="150" y="192" textAnchor="middle" fill={C.gris}>même principe : une tête, une queue</T>
    </svg>);
}
