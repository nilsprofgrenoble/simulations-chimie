// Schémas de la simulation 140 (solution tampon, TSTL PCM) : scène (eau pure et tampon), graphe pH selon l'ajout, cartes « À retenir ».
// Règles : police ≥ 16 dans un viewBox de 400, caractères Unicode pour les indices, tout le texte dans le viewBox.
import * as M from './tamponTstlModele';

const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', eau: '#bae6fd', eauB: '#0284c7', tamp: '#fed7aa', tampB: '#c2410c' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const virg = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');

function Becher({ cx, niveau, fond, bord }) {
  const w = 96, h = 100, top = 88, x0 = cx - w / 2, x1 = cx + w / 2, bas = top + h, yl = top + h * (1 - niveau);
  return (<g>
    <path d={`M ${x0} ${yl} H ${x1} V ${bas - 12} q 0 12 -12 12 H ${x0 + 12} q -12 0 -12 -12 Z`} fill={fond}/>
    <path d={`M ${x0} ${top} V ${bas - 12} q 0 12 12 12 H ${x1 - 12} q 12 0 12 -12 V ${top}`} fill="none" stroke={bord} strokeWidth="3.5" strokeLinecap="round"/>
  </g>);
}
function Pastille({ cx, y, texte, couleur }) {
  return (<g>
    <rect x={cx - 66} y={y} width="132" height="30" rx="8" fill="white" stroke={couleur} strokeWidth="2.5"/>
    <text x={cx} y={y + 22} textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre}>{texte}</text>
  </g>);
}

// ═════════ Scène : béchers d'eau pure et de tampon, pH-mètres, barres des quantités de matière ═════════
//  ajout : { nAcide, nBase } affichés au-dessus des béchers ; phEau / phTampon : afficher ou masquer (« ? ») la valeur du pH
export function SceneTampon({ coupleId, vA, nAcide = 0, nBase = 0, ve = 0, eau = true, tampon = true, phEau = true, phTampon = true, barres = false, ajoutVisible = true, titreBarres = false }) {
  const c = M.COUPLES[coupleId], e = M.etat({ coupleId, vA, nAcide, nBase, ve }), cxE = tampon ? 100 : 200, cxT = eau ? 300 : 200;
  const ajout = ajoutVisible && (nAcide > 0 || nBase > 0 || ve > 0), txt = ve > 0 ? `+ ${ve} mL d’eau` : nAcide > 0 && nBase > 0 ? `+ ${virg(nAcide)} mmol H₃O⁺ et ${virg(nBase)} mmol HO⁻` : nAcide > 0 ? `+ ${virg(nAcide)} mmol H₃O⁺` : `+ ${virg(nBase)} mmol HO⁻`;
  const eb = barres === 'avant' ? M.etat({ coupleId, vA }) : e;
  const ech = 22, deb = 60, ligne = (y, nom, n, fond, coul) => (<g>
    <text x="10" y={y + 21} fontSize="16" fontWeight="800" fill={coul}>{nom}</text>
    <rect x={deb} y={y} width={Math.max(n * ech, n > 0 ? 3 : 0)} height="28" fill={fond} stroke={coul} strokeWidth="2"/>
    <text x={deb + n * ech + 8} y={y + 21} fontSize="16" fill={COL.encre}>{virg(n)} mmol</text>
  </g>);
  return (
    <svg viewBox={`0 0 400 ${barres ? 346 : 246}`} style={base} role="img"
      aria-label={`${eau ? 'Un bécher d’eau pure' : ''}${eau && tampon ? ' et ' : ''}${tampon ? `un bécher de tampon ${c.AH} et ${c.A}` : ''}.${ajout ? ` Ajout : ${txt}.` : ''}${eau && phEau ? ` pH de l’eau : ${virg(e.pHEau, 2)}.` : ''}${tampon && phTampon ? ` pH du tampon : ${virg(e.pH, 2)}.` : ''}${barres ? ` Quantités du tampon : ${c.AH} ${virg(e.nAH)} mmol, ${c.A} ${virg(e.nA)} mmol.` : ''}`}>
      {eau && <g>
        <text x={cxE} y="22" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre}>Eau pure</text>
        {ajout && <g><text x={cxE} y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.rouge}>{txt}</text><path d={`M ${cxE} 78 l -8 -12 h 16 z`} fill={COL.rouge}/></g>}
        <Becher cx={cxE} niveau={0.72} fond={COL.eau} bord={COL.eauB}/>
        <Pastille cx={cxE} y={200} texte={phEau ? `pH = ${virg(e.pHEau, 2)}` : 'pH = ?'} couleur={COL.eauB}/>
      </g>}
      {tampon && <g>
        <text x={cxT} y="22" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre}>Tampon</text>
        {ajout && <g><text x={cxT} y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.rouge}>{txt}</text><path d={`M ${cxT} 78 l -8 -12 h 16 z`} fill={COL.rouge}/></g>}
        <Becher cx={cxT} niveau={0.72} fond={COL.tamp} bord={COL.tampB}/>
        <Pastille cx={cxT} y={200} texte={phTampon ? `pH = ${virg(e.pH, 2)}` : 'pH = ?'} couleur={COL.tampB}/>
      </g>}
      {tampon && barres && <g>
        {titreBarres && <text x="10" y="252" fontSize="16" fontWeight="700" fill={COL.encre}>Quantités dans le tampon :</text>}
        {ligne(titreBarres ? 262 : 250, 'AH', eb.nAH, '#60a5fa', COL.bleu)}
        {ligne(titreBarres ? 294 : 282, 'A⁻', eb.nA, '#fb923c', COL.orange)}
        {eb.excesH > 0 && <text x="10" y={titreBarres ? 338 : 328} fontSize="16" fontWeight="800" fill={COL.rouge}>excès de H₃O⁺ : {virg(eb.excesH)} mmol</text>}
        {eb.excesOH > 0 && <text x="10" y={titreBarres ? 338 : 328} fontSize="16" fontWeight="800" fill={COL.rouge}>excès de HO⁻ : {virg(eb.excesOH)} mmol</text>}
      </g>}
    </svg>);
}

// ═════════ Exploration : pH selon la quantité nette ajoutée, tampon et eau pure ═════════
export function GrapheAjout({ coupleId, vA, ve = 0, net = 0 }) {
  const X0 = 48, X1 = 388, Y0 = 200, Y1 = 22, lx = n => X0 + (n + 8) / 16 * (X1 - X0), ly = p => Y0 - p / 14 * (Y0 - Y1);
  const pts = M.courbeAjout({ coupleId, vA, ve }), t = k => pts.map(p => `${lx(p.n).toFixed(1)},${ly(p[k]).toFixed(1)}`).join(' ');
  const cur = M.pHTampon({ coupleId, vA, nAcide: net < 0 ? -net : 0, nBase: net > 0 ? net : 0, ve });
  return (
    <svg viewBox="0 0 400 276" style={base} role="img"
      aria-label={`pH en fonction de la quantité d’acide fort (à gauche de zéro) ou de base forte (à droite) ajoutée, de 8 mmol d’acide à 8 mmol de base : la courbe orange du tampon reste presque plate autour de ${virg(M.COUPLES[coupleId].pKa)} puis chute, la courbe bleue de l’eau pure varie de plusieurs unités dès le premier ajout. Point rouge : pH du tampon pour l’ajout net choisi (${virg(cur, 2)}).`}>
      <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={COL.gris} strokeWidth="1.5"/><line x1={X0} y1={Y0} x2={X0} y2={Y1 - 4} stroke={COL.gris} strokeWidth="1.5"/>
      {[0, 7, 14].map(p => <g key={p}><line x1={X0 - 4} y1={ly(p)} x2={X1} y2={ly(p)} stroke="#e2e8f0"/><text x={X0 - 8} y={ly(p) + 5} textAnchor="end" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      {[-8, -4, 0, 4, 8].map(n => <g key={n}><line x1={lx(n)} y1={Y0} x2={lx(n)} y2={Y0 + 5} stroke={COL.gris}/><text x={lx(n)} y={Y0 + 22} textAnchor="middle" fontSize="16" fill={COL.encre}>{n < 0 ? `−${-n}` : n}</text></g>)}
      <text x="4" y="14" fontSize="16" fontWeight="700" fill={COL.encre}>pH</text>
      <text x={X0} y={Y0 + 46} fontSize="16" fill={COL.rouge}>← acide fort</text>
      <text x={X1} y={Y0 + 46} textAnchor="end" fontSize="16" fill={COL.bleu}>base forte →</text>
      <text x={(X0 + X1) / 2} y={Y0 + 68} textAnchor="middle" fontSize="16" fill={COL.encre}>quantité ajoutée (mmol)</text>
      <polyline points={t('eau')} fill="none" stroke={COL.eauB} strokeWidth="3.5" strokeLinejoin="round"/>
      <polyline points={t('tampon')} fill="none" stroke={COL.orange} strokeWidth="3.5" strokeLinejoin="round"/>
      <line x1={lx(net)} y1={Y1} x2={lx(net)} y2={Y0} stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 4"/>
      <circle cx={lx(net)} cy={ly(cur)} r="6.5" fill="white" stroke={COL.rouge} strokeWidth="3.5"/>
      <text x={lx(-8) + 4} y={ly(13) + 2} fontSize="16" fontWeight="800" fill={COL.eauB}>eau pure</text>
      <text x={lx(-3.5)} y={ly(M.COUPLES[coupleId].pKa) - 10} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>tampon</text>
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════

// A. Un tampon résiste : même ajout de 1,0 mmol d'acide fort, l'eau pure et un tampon
export function SvgResiste() {
  const X = p => 24 + p * 44;
  return (
    <svg viewBox="0 0 400 206" style={base} role="img"
      aria-label="Axe de pH de 0 à 8. Après l’ajout de 1,0 mmol d’acide fort, le pH de l’eau pure passe de 7,0 à 2,0 : grande variation ; le pH du tampon passe de 4,9 à 4,7 : très petite variation.">
      <text x="200" y="20" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>après l’ajout de 1,0 mmol d’acide fort</text>
      <text x="200" y="52" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.eauB}>Eau pure : 7,0 → 2,0</text>
      <line x1={X(7)} y1="68" x2={X(2) + 6} y2="68" stroke={COL.eauB} strokeWidth="6"/>
      <path d={`M ${X(2)} 68 l 14 -9 v 18 z`} fill={COL.eauB}/>
      <circle cx={X(7)} cy="68" r="7" fill="white" stroke={COL.eauB} strokeWidth="3.5"/>
      <text x="200" y="106" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.orange}>Tampon : 4,9 → 4,7</text>
      <line x1={X(4.9)} y1="122" x2={X(4.7)} y2="122" stroke={COL.orange} strokeWidth="6"/>
      <circle cx={X(4.9)} cy="122" r="7" fill="white" stroke={COL.orange} strokeWidth="3.5"/>
      <circle cx={X(4.7)} cy="122" r="5" fill={COL.orange}/>
      <line x1="24" y1="152" x2="376" y2="152" stroke={COL.gris} strokeWidth="2"/>
      {[0, 2, 4, 6, 8].map(p => <g key={p}><line x1={X(p)} y1="152" x2={X(p)} y2="159" stroke={COL.gris} strokeWidth="2"/><text x={X(p)} y="180" textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      <text x="394" y="200" textAnchor="end" fontSize="16" fontWeight="700" fill={COL.encre}>pH</text>
    </svg>);
}

// B. Mécanisme : A⁻ consomme les H₃O⁺, AH consomme les HO⁻
export function SvgMecanisme() {
  return (
    <svg viewBox="0 0 400 238" style={base} role="img"
      aria-label="Deux réactions quasi totales : un ajout d’acide H₃O⁺ réagit avec la base A⁻ pour donner l’acide AH et de l’eau ; un ajout de base HO⁻ réagit avec l’acide AH pour donner la base A⁻ et de l’eau.">
      <rect x="8" y="8" width="384" height="104" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="2"/>
      <text x="200" y="34" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.rouge}>On ajoute un acide : H₃O⁺</text>
      <text x="200" y="68" textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.encre}>H₃O⁺ + <tspan fill={COL.orange}>A⁻</tspan> → <tspan fill={COL.bleu}>AH</tspan> + H₂O</text>
      <text x="200" y="98" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.orange}>la base A⁻ consomme l’acide ajouté</text>
      <rect x="8" y="124" width="384" height="104" rx="10" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2"/>
      <text x="200" y="150" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.bleu}>On ajoute une base : HO⁻</text>
      <text x="200" y="184" textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.encre}>HO⁻ + <tspan fill={COL.bleu}>AH</tspan> → <tspan fill={COL.orange}>A⁻</tspan> + H₂O</text>
      <text x="200" y="214" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.bleu}>l’acide AH consomme la base ajoutée</text>
    </svg>);
}

// C. Dilution : concentrations divisées par 10, rapport inchangé donc pH inchangé
export function SvgDilution() {
  const ligne = (y, nom, n, fond, coul) => (<g>
    <text x="10" y={y + 21} fontSize="16" fontWeight="800" fill={coul}>{nom}</text>
    <rect x="50" y={y} width={n} height="28" fill={fond} stroke={coul} strokeWidth="2"/>
    <text x={50 + n + 8} y={y + 21} fontSize="16" fill={COL.encre}>{n > 100 ? '0,050' : '0,0050'} mol·L⁻¹</text>
  </g>);
  return (
    <svg viewBox="0 0 400 244" style={base} role="img"
      aria-label="Avant dilution, les concentrations de l’acide AH et de la base A⁻ sont égales, à 0,050 mol par litre. Après dilution par 10, elles sont toujours égales entre elles, à 0,0050 mol par litre : leur rapport est inchangé, donc le pH aussi.">
      <text x="10" y="22" fontSize="16" fontWeight="800" fill={COL.encre}>Avant la dilution</text>
      {ligne(34, 'AH', 150, '#60a5fa', COL.bleu)}{ligne(68, 'A⁻', 150, '#fb923c', COL.orange)}
      <text x="10" y="128" fontSize="16" fontWeight="800" fill={COL.encre}>Après dilution par 10</text>
      {ligne(140, 'AH', 15, '#60a5fa', COL.bleu)}{ligne(174, 'A⁻', 15, '#fb923c', COL.orange)}
      <rect x="8" y="210" width="384" height="30" rx="8" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2"/>
      <text x="200" y="231" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.vert}>rapport inchangé, donc pH inchangé</text>
    </svg>);
}

// D. Limite : la base A⁻ est épuisée quand on ajoute plus d'acide fort qu'elle n'en peut consommer (tampon de 4,0 mmol de A⁻ et 4,0 mmol de AH)
export function SvgLimite() {
  const ech = 26, x0 = 96, lignes = [0, 3, 4, 5].map(a => ({ a, ...M.bilan({ nA: 4, nAH: 4, nAcide: a }) }));
  return (
    <svg viewBox="0 0 400 252" style={base} role="img"
      aria-label="Tampon contenant 4,0 mmol de A⁻ et 4,0 mmol de AH, auquel on ajoute de l’acide fort. Après 3 mmol ajoutées, il reste 1,0 mmol de A⁻ ; après 4 mmol, plus de A⁻ ; après 5 mmol, 1,0 mmol de H₃O⁺ reste en excès : le tampon est épuisé.">
      <text x="10" y="22" fontSize="16" fontWeight="800" fill={COL.encre}>H₃O⁺ ajouté (mmol) et composition</text>
      {lignes.map((l, i) => { const y = 38 + i * 42; return (
        <g key={l.a}>
          <text x="10" y={y + 21} fontSize="18" fontWeight="800" fill={COL.encre}>+ {l.a}</text>
          <rect x={x0} y={y} width={Math.max(l.nA * ech, 0)} height="28" fill="#fb923c" stroke={COL.orange} strokeWidth="2"/>
          <rect x={x0 + l.nA * ech} y={y} width={l.nAH * ech} height="28" fill="#60a5fa" stroke={COL.bleu} strokeWidth="2"/>
          {l.excesH > 0 && <rect x={x0 + (l.nA + l.nAH) * ech} y={y} width={l.excesH * ech} height="28" fill="#f87171" stroke={COL.rouge} strokeWidth="2"/>}
        </g>); })}
      <rect x="10" y="212" width="16" height="16" fill="#fb923c" stroke={COL.orange} strokeWidth="2"/><text x="32" y="226" fontSize="16" fill={COL.encre}>A⁻</text>
      <rect x="82" y="212" width="16" height="16" fill="#60a5fa" stroke={COL.bleu} strokeWidth="2"/><text x="104" y="226" fontSize="16" fill={COL.encre}>AH</text>
      <rect x="158" y="212" width="16" height="16" fill="#f87171" stroke={COL.rouge} strokeWidth="2"/><text x="180" y="226" fontSize="16" fill={COL.encre}>H₃O⁺ en excès</text>
    </svg>);
}

// E. Zone tampon : rapport entre 0,1 et 10, pH de pKa − 1 à pKa + 1 ; pouvoir tampon maximal au pKa
export function SvgDomaine() {
  const X = d => 40 + (d + 2) * 80;
  return (
    <svg viewBox="0 0 400 214" style={base} role="img"
      aria-label="Axe centré sur le pKa. De pKa moins 1 à pKa plus 1, zone verte du tampon : le rapport de A⁻ sur AH va de 0,1 à 10. Au pKa, le rapport vaut 1 et le pouvoir tampon est maximal. En dehors de cette zone, l’une des deux formes est trop peu présente.">
      <text x="200" y="22" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>pKa : pouvoir tampon maximal</text>
      <rect x={X(-2)} y="44" width={X(-1) - X(-2)} height="40" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2"/>
      <rect x={X(1)} y="44" width={X(2) - X(1)} height="40" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2"/>
      <rect x={X(-1)} y="44" width={X(1) - X(-1)} height="40" fill="#dcfce7" stroke={COL.vert} strokeWidth="2.5"/>
            <line x1={X(0)} y1="30" x2={X(0)} y2="94" stroke={COL.encre} strokeWidth="3"/>
      <text x={X(0)} y="70" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.vert} stroke="#dcfce7" strokeWidth="7" paintOrder="stroke">zone tampon</text>
      <text x={(X(-2) + X(-1)) / 2} y="70" textAnchor="middle" fontSize="16" fill={COL.gris}>A⁻ rare</text>
      <text x={(X(1) + X(2)) / 2} y="70" textAnchor="middle" fontSize="16" fill={COL.gris}>AH rare</text>
      {[[-2, 'pKa − 2'], [-1, 'pKa − 1'], [0, 'pKa'], [1, 'pKa + 1'], [2, 'pKa + 2']].map(([d, t]) => <g key={d}><line x1={X(d)} y1="84" x2={X(d)} y2="92" stroke={COL.gris} strokeWidth="2"/><text x={X(d)} y="114" textAnchor="middle" fontSize="16" fontWeight={d === 0 ? 800 : 400} fill={COL.encre}>{t}</text></g>)}
      <text x="200" y="146" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>rapport A⁻ sur AH :</text>
      {[[-1, '0,1'], [0, '1'], [1, '10']].map(([d, t]) => <text key={d} x={X(d)} y="176" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.orange}>{t}</text>)}
      <text x="200" y="204" textAnchor="middle" fontSize="16" fill={COL.encre}>équimolaire : [AH] = [A⁻]</text>
    </svg>);
}

// Plages de pKa ± 1 des couples (vert), repère du pH visé (rouge) : partagé par la scène (étapes de choix) et la carte F
function PlagesCouples({ cible, pKaTexte }) {
  const X = p => 24 + p * (352 / 14), lignes = [['benz', 'droite'], ['prop', 'droite'], ['hclo', 'droite'], ['phen', 'gauche']];
  return (<g>
    <text x="200" y="16" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.rouge}>pH visé : {virg(cible)}</text>
    {lignes.map(([id], i) => { const c = M.COUPLES[id], y = 28 + i * 28; return (
      <g key={id}>
        <rect x={X(c.pKa - 1)} y={y} width={X(c.pKa + 1) - X(c.pKa - 1)} height="22" fill="#dcfce7" stroke={COL.vert} strokeWidth="2"/>
        <line x1={X(c.pKa)} y1={y - 2} x2={X(c.pKa)} y2={y + 24} stroke={COL.encre} strokeWidth="2.5"/>
      </g>); })}
    <line x1={X(cible)} y1="24" x2={X(cible)} y2="146" stroke={COL.rouge} strokeWidth="3"/>
    {lignes.map(([id, cote], i) => { const c = M.COUPLES[id], y = 28 + i * 28, t = pKaTexte ? `${c.AH} (${virg(c.pKa)})` : c.AH, h = { stroke: '#fff', strokeWidth: 5, paintOrder: 'stroke' }; return cote === 'gauche'
      ? <text key={id} x={X(c.pKa - 1) - 6} y={y + 18} textAnchor="end" fontSize="16" fill={COL.encre} {...h}>{t}</text>
      : <text key={id} x={X(c.pKa + 1) + 6} y={y + 18} fontSize="16" fill={COL.encre} {...h}>{t}</text>; })}
    <line x1="24" y1="146" x2="376" y2="146" stroke={COL.gris} strokeWidth="2"/>
    {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={X(p)} y1="146" x2={X(p)} y2="152" stroke={COL.gris} strokeWidth="2"/><text x={X(p)} y="170" textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
  </g>);
}
// Scène des étapes de choix et de préparation : plages de chaque couple (pKa ± 1) et pH visé
export function SceneChoix({ cible }) {
  return (
    <svg viewBox="0 0 400 184" style={base} role="img"
      aria-label={`Axe de pH de 0 à 14. Pour chaque couple, une plage verte va de pKa moins 1 à pKa plus 1, avec un trait au pKa : acide benzoïque 4,2 ; acide propanoïque 4,9 ; acide hypochloreux 7,5 ; phénol 10,0. Le trait rouge repère le pH visé : ${virg(cible)}.`}>
      <PlagesCouples cible={cible} pKaTexte/>
    </svg>);
}

// F. Choisir le couple (pKa le plus proche du pH visé, à ± 1) puis préparer (exemple : pH visé 4,5 ; couple C₂H₅COOH / C₂H₅COO⁻ de pKa 4,9)
export function SvgChoixPrepa() {
  return (
    <svg viewBox="0 0 400 276" style={base} role="img"
      aria-label="Axe de pH de 0 à 14 avec, pour chaque couple, la plage de pKa moins 1 à pKa plus 1. Le pH visé, 4,5, est repéré en rouge : il tombe dans les plages de l’acide benzoïque et de l’acide propanoïque ; on choisit celui dont le pKa est le plus proche. Pour 100 mL à pH 4,5 avec le couple de pKa 4,9, le rapport base sur acide vaut 0,40 : 28,5 mL de solution de base et 71,5 mL de solution d’acide.">
      <PlagesCouples cible={4.5}/>
      <text x="200" y="206" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>On choisit le pKa le plus proche du pH visé</text>
      <text x="200" y="236" textAnchor="middle" fontSize="16" fill={COL.encre}>rapport base sur acide : 0,40</text>
      <text x="200" y="262" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>28,5 mL de base + 71,5 mL d’acide</text>
    </svg>);
}
