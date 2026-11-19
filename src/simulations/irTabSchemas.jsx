// ====================================================
//  Schémas de la simulation 170 (spectroscopie IR, données tabulées ; niveau TG).
//  Spectre : viewBox 480 × 330, textes de 15 à 16 (≥ 11 px rendus à 390 px), largeur 100 % plafonnée à 480 px.
//  Cartes « À retenir » : viewBox de 360, textes de 15 ; jamais la couleur seule (traits pleins / tirets, motifs hachurés, étiquettes écrites).
// ====================================================
import * as M from './irTabModele';

import { COL } from './irTabCourbes';

// ---------- spectre IR (σ décroissant de 4000 à 500 cm⁻¹, bandes = creux) ----------
// viewBox 360 × 300 : affiché à ≈ 260 px sur téléphone (×0,72), textes de 16 à 17 dans le viewBox (≈ 11,5 à 12 px rendus) ; plafonné à 480 px sur ordinateur
const W = 360, H = 300, MX = 42, MR = 8, MY = 72, MB = 60;
const X = s => MX + (M.SIGMA_MAX - s) / (M.SIGMA_MAX - M.SIGMA_MIN) * (W - MX - MR);
const Y = t => MY + (100 - t) / 100 * (H - MY - MB);
const trait = { plein: undefined, tirets: '9 5', points: '2 5' };
const halo = { stroke: '#fff', strokeWidth: 4, paintOrder: 'stroke' };

// courbes : [{ nom, style: 'plein' | 'tirets', pts, mol }] ; marques : [{ s, lettre }] (défi) ; curseur : σ (exploration) ; empreinte : hachure de la zone < 1500 cm⁻¹
export function SpectreIR({ courbes, marques = [], curseur = null, empreinte = false, titre }) {
  const c0 = courbes[0];
  const decrit = courbes.map(c => c.nom).join(' et ');
  const yMarque = m => Math.max(Y(M.transmittance(c0.mol, m.s)) - 34, MY + 16);
  const pc = curseur != null ? M.transmittance(c0.mol, curseur) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 480, display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }} role="img"
      aria-label={`${titre || 'Spectre d’absorption infrarouge'} : transmittance en pourcentage en fonction du nombre d’onde de 4000 à 500 cm moins un, axe orienté de la droite vers la gauche ; courbe${courbes.length > 1 ? 's' : ''} ${decrit}${curseur != null ? ` ; repère à ${Math.round(curseur)} cm moins un` : ''}`}>
      <defs><pattern id="irt-hach" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="2"/></pattern></defs>
      {empreinte && <g><rect x={X(1500)} y={MY} width={X(500) - X(1500)} height={H - MY - MB} fill="url(#irt-hach)" opacity="0.45"/>
        <text x={(X(1500) + X(500)) / 2} y={MY - 8} textAnchor="middle" fontSize="17" fontWeight="700" fill={COL.gris}>empreinte</text></g>}
      <line x1={MX} y1={H - MB} x2={W - MR} y2={H - MB} stroke={COL.gris} strokeWidth="1.5"/><line x1={MX} y1={MY} x2={MX} y2={H - MB} stroke={COL.gris} strokeWidth="1.5"/>
      {[0, 50, 100].map(t => <g key={t}><line x1={MX - 5} y1={Y(t)} x2={MX} y2={Y(t)} stroke={COL.gris}/><text x={MX - 7} y={Y(t) + 5} textAnchor="end" fontSize="16" fill={COL.gris}>{t}</text></g>)}
      {[4000, 3500, 3000, 2500, 2000, 1500, 1000, 500].map(s => <g key={s}><line x1={X(s)} y1={MY} x2={X(s)} y2={H - MB} stroke="#e2e8f0" strokeDasharray="2 4"/><line x1={X(s)} y1={H - MB} x2={X(s)} y2={H - MB + 7} stroke={COL.gris}/>
        {[4000, 3000, 2000, 1500, 500].includes(s) && <text x={X(s)} y={H - MB + 24} textAnchor={s === 4000 ? 'start' : s === 500 ? 'end' : 'middle'} dx={s === 4000 ? -6 : s === 500 ? 4 : 0} fontSize="16" fill={COL.txt}>{s}</text>}</g>)}
      {Array.from({ length: 36 }, (_, i) => 500 + i * 100).filter(v => v % 500).map(v => <line key={v} x1={X(v)} y1={H - MB} x2={X(v)} y2={H - MB + 4} stroke={COL.gris}/>)}
      <text x={W - MR} y={H - 6} textAnchor="end" fontSize="17" fill={COL.gris}>σ (cm⁻¹)</text><text x={2} y={MY - 16} fontSize="17" fill={COL.gris}>T (%)</text>
      {courbes.map((c, i) => <polyline key={i} fill="none" stroke={i === 0 ? COL.bleu : COL.rouge} strokeWidth="2.4" strokeDasharray={trait[c.style || 'plein']} strokeLinejoin="round" points={c.pts.map(([s, t]) => `${X(s).toFixed(1)},${Y(t).toFixed(1)}`).join(' ')}/>)}
      {courbes.map((c, i) => <g key={i} transform={`translate(${MX + 4},${18 + i * 22})`}><line x1="0" y1="-6" x2="28" y2="-6" stroke={i === 0 ? COL.bleu : COL.rouge} strokeWidth="2.4" strokeDasharray={trait[c.style || 'plein']}/>
        <text x="34" y="0" fontSize="17" fontWeight="700" fill={i === 0 ? COL.bleu : COL.rouge}>{c.nom}</text></g>)}
      {marques.map(m => { const y = yMarque(m), x = X(m.s); return <g key={m.lettre}>
        <line x1={x} y1={y + 12} x2={x} y2={Y(M.transmittance(c0.mol, m.s)) - 4} stroke={COL.orange} strokeWidth="2" strokeDasharray="4 3"/>
        <circle cx={x} cy={y} r="12" fill="#fff" stroke={COL.orange} strokeWidth="2.5"/><text x={x} y={y + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>{m.lettre}</text></g>; })}
      {curseur != null && <g><line x1={X(curseur)} y1={MY} x2={X(curseur)} y2={H - MB} stroke={COL.orange} strokeWidth="2" strokeDasharray="6 3"/>
        <circle cx={X(curseur)} cy={Y(pc)} r="5" fill="#fff" stroke={COL.orange} strokeWidth="2.5"/>
        <text x={X(curseur)} y={MY + 22} textAnchor={curseur > 3000 ? 'start' : curseur < 1000 ? 'end' : 'middle'} dx={curseur > 3000 ? 6 : curseur < 1000 ? -6 : 0} fontSize="17" fontWeight="800" fill={COL.orange} {...halo}>{Math.round(curseur)}</text></g>}
    </svg>);
}

// ---------- outils pour les cartes ----------
// viewBox de 360 de large ; la carte d'un téléphone (390 px) affiche le schéma à ≈ 230 px : textes de 16 à 17 dans le viewBox (≈ 10 à 11 px rendus)
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 360 ${h}`} style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', margin: '0 auto 6px' }} role="img" aria-label={aria}>{children}</svg>;
const Tx = ({ x, y, children, a = 'start', c = COL.txt, w = 400, s = 17 }) => <text x={x} y={y} textAnchor={a} fontSize={s} fontWeight={w} fill={c}>{children}</text>;
const Motifs = () => <defs>
  <pattern id="irt-m1" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke={COL.bleu} strokeWidth="2.5"/></pattern>
  <pattern id="irt-m2" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.8" fill={COL.vert}/></pattern>
  <pattern id="irt-m3" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="8" stroke={COL.rouge} strokeWidth="2.5"/></pattern>
</defs>;
// mini-spectre d'une molécule sur [sHaut ; sBas] dans le cadre (x0, y0, largeur, hauteur) ; base en haut (T = 98 %)
const mini = (mol, sHaut, sBas, x0, y0, w, h, c, dash) => {
  const pts = []; for (let s = sHaut; s >= sBas; s -= 10) pts.push(`${(x0 + (sHaut - s) / (sHaut - sBas) * w).toFixed(1)},${(y0 + (100 - M.transmittance(mol, s)) / 100 * h).toFixed(1)}`);
  return <polyline points={pts.join(' ')} fill="none" stroke={c} strokeWidth="2.6" strokeDasharray={dash} strokeLinejoin="round"/>;
};

// Carte 1 : un intervalle, pas une valeur (les quatre lignes C=O du tableau et la valeur lue à l'étape 1)
const XC = s => 150 + (1760 - s) * 1.6;
export const FIntervalles = ({ lue = 1715 }) => (
  <Svg h={218} aria="Les quatre intervalles du tableau pour la liaison C=O : ester de 1735 à 1750, aldéhyde ou cétone de 1705 à 1740, acide carboxylique de 1700 à 1725, amide de 1650 à 1700 ; ils se recouvrent, et la valeur lue vers 1715 tombe dans deux d'entre eux">
    <Motifs/>
    <Tx x={4} y={18} w={700}>Intervalles de C=O (cm⁻¹)</Tx>
    {[['ester', 1735, 1750, 'url(#irt-m1)', 44], ['aldéhyde, cétone', 1705, 1740, COL.clair, 76], ['acide', 1700, 1725, 'url(#irt-m2)', 108], ['amide', 1650, 1700, 'url(#irt-m3)', 140]].map(([nom, a, b, f, y]) => <g key={nom}>
      <Tx x={4} y={y + 17} s={16}>{nom}</Tx><rect x={XC(b)} y={y} width={XC(a) - XC(b)} height="24" fill={f} stroke={COL.txt} strokeWidth="1.5"/></g>)}
    <line x1={XC(lue)} y1="40" x2={XC(lue)} y2="168" stroke={COL.orange} strokeWidth="2.5" strokeDasharray="6 3"/>
    <Tx x={XC(lue)} y={38} a="middle" c={COL.orange} w={800}>{lue}</Tx>
    <line x1={XC(1750)} y1="170" x2={XC(1650)} y2="170" stroke={COL.gris} strokeWidth="1.5"/>
    {[1750, 1700, 1650].map(s => <g key={s}><line x1={XC(s)} y1="170" x2={XC(s)} y2="176" stroke={COL.gris}/><Tx x={XC(s)} y={193} a="middle" c={COL.gris} s={16}>{s}</Tx></g>)}
    <Tx x={180} y={212} a="middle" c={COL.txt} w={700}>les intervalles se recouvrent</Tx>
  </Svg>);

// Carte 2 : lire une bande, trois questions (position, allure, intensité)
export const FLireBande = () => {
  const pts = []; for (let x = 20; x <= 340; x += 4) { const d = Math.exp(-Math.LN2 * ((x - 190) / 58) ** 2); pts.push(`${x},${60 + 82 * d}`); }
  return (
    <Svg h={268} aria="Une bande d'absorption O–H d'alcool dessinée comme un creux large et profond ; trois repères numérotés : la position en nombre d'onde, l'allure (largeur de la bande) et l'intensité (profondeur du creux)">
      <line x1="20" y1="60" x2="340" y2="60" stroke={COL.gris} strokeWidth="1.5" strokeDasharray="3 3"/>
      <polyline points={pts.join(' ')} fill="none" stroke={COL.bleu} strokeWidth="3" strokeLinejoin="round"/>
      <line x1="190" y1="142" x2="190" y2="160" stroke={COL.orange} strokeWidth="2.5"/><line x1="20" y1="160" x2="340" y2="160" stroke={COL.gris} strokeWidth="1.5"/>
      <circle cx="190" cy="178" r="13" fill="#fff" stroke={COL.orange} strokeWidth="2.5"/><Tx x={190} y={184} a="middle" c={COL.orange} w={800}>1</Tx>
      <line x1="132" y1="101" x2="248" y2="101" stroke={COL.vert} strokeWidth="2.5"/><line x1="132" y1="94" x2="132" y2="108" stroke={COL.vert} strokeWidth="2.5"/><line x1="248" y1="94" x2="248" y2="108" stroke={COL.vert} strokeWidth="2.5"/>
      <circle cx="132" cy="82" r="13" fill="#fff" stroke={COL.vert} strokeWidth="2.5"/><Tx x={132} y={88} a="middle" c={COL.vert} w={800}>2</Tx>
      <line x1="300" y1="60" x2="300" y2="142" stroke={COL.rouge} strokeWidth="2.5"/><line x1="293" y1="60" x2="307" y2="60" stroke={COL.rouge} strokeWidth="2.5"/><line x1="293" y1="142" x2="307" y2="142" stroke={COL.rouge} strokeWidth="2.5"/>
      <circle cx="326" cy="101" r="13" fill="#fff" stroke={COL.rouge} strokeWidth="2.5"/><Tx x={326} y={107} a="middle" c={COL.rouge} w={800}>3</Tx>
      <Tx x={20} y={30} c={COL.gris} s={16}>T (%)</Tx>
      <Tx x={20} y={214} w={700}>1  où ? la position σ (cm⁻¹)</Tx><Tx x={20} y={238} w={700}>2  comment ? fine ou large</Tx>
      <Tx x={20} y={262} w={700}>3  combien ? forte ou faible</Tx>
    </Svg>);
};

// Carte 3 : O–H alcool, O–H acide, N–H (mini-spectres issus du modèle)
export const FOhNh = () => {
  const lignes = [['O–H alcool : large, forte', M.MOLECULES.ethanol, COL.bleu, undefined, 8], ['O–H acide : très large', M.MOLECULES.acide, COL.rouge, '9 5', 86], ['N–H amine : fines, moyennes', M.MOLECULES.ethylamine, COL.vert, '2 5', 164]];
  return (
    <Svg h={300} aria="Trois formes de bande au-dessus de 2500 centimètres moins un : O–H d'alcool, large et forte vers 3340 ; O–H d'acide carboxylique, très large de 2500 à 3300 ; N–H d'amine primaire, deux bandes fines de force moyenne vers 3380 et 3300">
      {lignes.map(([nom, mol, c, d, y]) => <g key={nom}><rect x="20" y={y} width="320" height="74" fill="none" stroke={COL.clair} strokeWidth="1.5"/>
        <Tx x={26} y={y + 19} c={c} w={700} s={16}>{nom}</Tx>{mini(mol, 4000, 2400, 20, y + 26, 320, 42, c, d)}</g>)}
      <line x1="20" y1="244" x2="340" y2="244" stroke={COL.gris}/>
      {[4000, 3500, 3000, 2500].map(s => { const x = 20 + (4000 - s) / 1600 * 320; return <g key={s}><line x1={x} y1="244" x2={x} y2="250" stroke={COL.gris}/><Tx x={x} y={268} a={s === 4000 ? 'start' : 'middle'} c={COL.gris} s={16}>{s}</Tx></g>; })}
      <Tx x={340} y={286} a="end" c={COL.gris} s={16}>σ (cm⁻¹)</Tx>
    </Svg>);
};

// Carte 4 : méthode d'identification en trois temps
export const FMethode = () => (
  <Svg h={288} aria="Méthode en trois temps : repérer les bandes au-dessus de 1500 centimètres moins un avec position, allure et intensité ; chercher dans le tableau les groupes possibles, et en cas de recouvrement une autre bande qui départage ; retenir l'espèce dont les groupes correspondent à toutes les bandes. L'empreinte digitale sous 1500 est seulement citée">
    <defs><marker id="irt-fl" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={COL.txt}/></marker></defs>
    {[['1', 'Repérer les bandes > 1500', 'position, allure, intensité'], ['2', 'Chercher dans le tableau', 'recouvrement : autre bande ?'], ['3', 'Choisir l’espèce', 'dont les groupes expliquent tout']].map(([n, a, b], i) => <g key={n}>
      <rect x="10" y={10 + i * 74} width="340" height="58" rx="8" fill="#f8fafc" stroke={COL.bleu} strokeWidth="2"/>
      <circle cx="36" cy={39 + i * 74} r="14" fill={COL.bleu}/><Tx x={36} y={45 + i * 74} a="middle" c="#fff" w={800}>{n}</Tx>
      <Tx x={60} y={34 + i * 74} w={700}>{a}</Tx><Tx x={60} y={56 + i * 74} c={COL.gris} s={16}>{b}</Tx>
      {i < 2 && <line x1="180" y1={68 + i * 74} x2="180" y2={82 + i * 74} stroke={COL.txt} strokeWidth="2.5" markerEnd="url(#irt-fl)"/>}</g>)}
    <Tx x={180} y={256} a="middle" c={COL.orange} w={700} s={16}>sous 1500 cm⁻¹ : empreinte digitale</Tx><Tx x={180} y={278} a="middle" c={COL.gris} s={16}>citée, non exploitée en Terminale</Tx>
  </Svg>);

// Carte 5 : estérification, acide → ester (mini-spectres du modèle)
export const FEsterification = () => (
  <Svg h={282} aria="Avant et après estérification : le spectre de l'acide éthanoïque a une bande O–H très large vers 3000 et une bande C=O vers 1710 ; celui de l'ester purifié n'a plus de bande O–H et sa bande C=O est décalée vers 1738">
    {[['acide : O–H très large + C=O', M.MOLECULES.acide, COL.rouge, '9 5', 8], ['ester : plus de O–H, C=O décalée', M.MOLECULES.ester, COL.bleu, undefined, 94]].map(([nom, mol, c, d, y]) => <g key={nom}>
      <rect x="20" y={y} width="320" height="80" fill="none" stroke={COL.clair} strokeWidth="1.5"/><Tx x={26} y={y + 19} c={c} w={700} s={16}>{nom}</Tx>{mini(mol, 4000, 1500, 20, y + 26, 320, 46, c, d)}</g>)}
    <line x1="20" y1="182" x2="340" y2="182" stroke={COL.gris}/>
    {[4000, 3000, 2000, 1500].map(s => { const x = 20 + (4000 - s) / 2500 * 320; return <g key={s}><line x1={x} y1="182" x2={x} y2="188" stroke={COL.gris}/><Tx x={x} y={206} a={s === 4000 ? 'start' : s === 1500 ? 'end' : 'middle'} c={COL.gris} s={16}>{s}</Tx></g>; })}
    <Tx x={180} y={238} a="middle" c={COL.vert} w={700}>C=O : 1710 → 1738 cm⁻¹</Tx><Tx x={180} y={264} a="middle" c={COL.vert} w={700}>la bande O–H a disparu</Tx>
  </Svg>);
