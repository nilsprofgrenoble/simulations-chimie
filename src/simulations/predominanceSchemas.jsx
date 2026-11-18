// ====================================================
//  Schémas de la simulation 130 (couples acide-base : prédominance, distribution, indicateurs colorés, niveau TG).
//  Cartes « À retenir » : viewBox de 300 de large, police ≥ 14 (≈ 12 px rendus sur téléphone). Diagrammes de la scène : viewBox de 400, police ≥ 13.
//  Couleurs : bleu = forme acide AH, orange = forme basique A⁻, vert = bon, rouge = piège, gris = repère.
//  Indices en caractères Unicode ou tspan abaissé (jamais baselineShift) ; tout le texte DANS le viewBox.
// ====================================================
import * as M from './predominanceModele';

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', txt: '#0f172a', fondB: '#dbeafe', fondO: '#ffedd5' };
const Sb = ({ t }) => <tspan dy="4" fontSize="13">{t}</tspan>;
const Rs = ({ children }) => <tspan dy="-4">{children}</tspan>;
const stl = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const f1 = v => (Math.abs(Math.round(v * 10) / 10 - v) < 1e-9 ? v.toFixed(1) : v.toFixed(2)).replace('.', ',');

// ---------- diagramme de prédominance (scène) ----------
export function DiagPred({ pH, pKa, AH, A, revele = true, marque = true }) {
  const X = p => 20 + 25.71 * p, xk = X(pKa);
  return (
    <svg viewBox="0 0 400 150" style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={revele ? `Diagramme de prédominance : ${AH} prédomine pour un pH inférieur à ${f1(pKa)}, ${A} prédomine pour un pH supérieur. Le pH vaut ${f1(pH)}.` : `Axe de pH avec la frontière à pH = ${f1(pKa)} ; les deux domaines ne sont pas encore nommés.`}>
      <rect x="20" y="24" width={xk - 20} height="44" fill={COL.fondB}/><rect x={xk} y="24" width={380 - xk + 0} height="44" fill={COL.fondO}/>
      <line x1="20" y1="68" x2="380" y2="68" stroke={COL.txt} strokeWidth="2"/>
      {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={X(p)} y1="68" x2={X(p)} y2="74" stroke={COL.txt}/><text x={X(p)} y="92" fontSize="13" textAnchor="middle" fill={COL.txt}>{p}</text></g>)}
      <text x="392" y="112" fontSize="13" textAnchor="end" fill={COL.gris}>pH</text>
      <line x1={xk} y1="18" x2={xk} y2="74" stroke={COL.orange} strokeWidth="2" strokeDasharray="4 3"/>
      <text x={xk} y="112" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>pK<Sb t="A"/><Rs> = {f1(pKa)}</Rs></text>
      {revele ? <>
        <text x={(20 + xk) / 2} y="52" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.bleu}>{AH}</text>
        <text x={(xk + 380) / 2} y="52" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>{A}</text></> :
        <><text x={(20 + xk) / 2} y="52" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.gris}>?</text><text x={(xk + 380) / 2} y="52" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.gris}>?</text></>}
      {marque && <polygon points={`${X(pH) - 7},142 ${X(pH) + 7},142 ${X(pH)},128`} fill={COL.rouge}/>}
      {marque && <text x={Math.min(Math.max(X(pH) + 12, 30), 360)} y="142" fontSize="14" fontWeight="700" fill={COL.rouge}>pH = {f1(pH)}</text>}
    </svg>);
}

// ---------- diagramme de distribution (scène) ----------
export function DiagDist({ pH, pKa, AH, A, nomme = true }) {
  const X = p => 36 + 25.14 * p, Y = f => 150 - 130 * f, pts = M.courbes(pKa, 71);
  const ch = k => pts.map(q => `${X(q.pH).toFixed(1)},${Y(q[k]).toFixed(1)}`).join(' ');
  const fa = M.fracAcide(pH, pKa), fb = M.fracBase(pH, pKa);
  return (
    <svg viewBox="0 0 400 206" style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`Diagramme de distribution : pourcentage de ${AH} et de ${A} en fonction du pH. Les deux courbes se croisent à pH = ${f1(pKa)}, à 50 %. Au pH ${f1(pH)}, il y a ${Math.round(100 * fa)} % de ${AH} et ${Math.round(100 * fb)} % de ${A}.`}>
      <rect x="36" y="20" width="352" height="130" fill="#f8fafc" stroke="#cbd5e1"/>
      {[0, 0.5, 1].map(f => <g key={f}><line x1="36" y1={Y(f)} x2="388" y2={Y(f)} stroke="#e2e8f0" strokeDasharray={f === 0.5 ? '4 3' : ''}/><text x="32" y={Y(f) + 4} fontSize="13" textAnchor="end" fill={COL.txt}>{f * 100}</text></g>)}
      <text x="36" y="14" fontSize="13" fill={COL.gris}>%</text>
      {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={X(p)} y1="150" x2={X(p)} y2="155" stroke={COL.txt}/><text x={X(p)} y="171" fontSize="13" textAnchor="middle" fill={COL.txt}>{p}</text></g>)}
      <text x="392" y="190" fontSize="13" textAnchor="end" fill={COL.gris}>pH</text>
      <polyline points={ch('acide')} fill="none" stroke={COL.bleu} strokeWidth="3"/><polyline points={ch('base')} fill="none" stroke={COL.orange} strokeWidth="3"/>
      <line x1={X(pH)} y1="20" x2={X(pH)} y2="150" stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 3"/>
      <circle cx={X(pH)} cy={Y(fa)} r="5" fill={COL.bleu}/><circle cx={X(pH)} cy={Y(fb)} r="5" fill={COL.orange}/>
      <text x="48" y="200" fontSize="14" fontWeight="700" fill={COL.bleu}>{nomme ? `── ${AH}` : '── acide'}</text>
      <text x="200" y="200" fontSize="14" fontWeight="700" fill={COL.orange}>{nomme ? `── ${A}` : '── base'}</text>
    </svg>);
}

// ---------- erlenmeyer : le liquide est découpé par la paroi (il ne dépasse jamais) ----------
//  Repère local : col centré en 0, haut du col en y = 0, fond en y = 112 ; niveau = hauteur de liquide (0 à 1).
let _id = 0;
function Erlen({ cx, y0, s = 1, coul, niveau = 0.4 }) {
  const id = `erl${++_id}`, d = 'M-14 0 h28 v34 L46 104 a6 6 0 0 1 -6 8 h-80 a6 6 0 0 1 -6 -8 L-14 34 z', yL = 112 - 78 * niveau;
  return (
    <g transform={`translate(${cx} ${y0}) scale(${s})`}>
      <clipPath id={id}><path d={d}/></clipPath>
      <rect x="-60" y={yL} width="120" height="120" fill={coul} clipPath={`url(#${id})`}/>
      <path d={d} fill="none" stroke={COL.txt} strokeWidth={2.5 / s} strokeLinejoin="round"/>
      <line x1="-18" y1="0" x2="18" y2="0" stroke={COL.txt} strokeWidth={3 / s} strokeLinecap="round"/>
    </g>);
}

// ---------- flacon d'indicateur coloré (scène) ----------
export function Flacon({ ind, pH }) {
  const coul = M.couleurIndic(ind, pH);
  return (
    <svg viewBox="0 0 400 140" style={{ ...stl, maxWidth: 480 }} role="img" aria-label={`Flacon d’indicateur coloré ${ind.nom} à pH ${f1(pH)} : teinte ${M.teinte(ind, pH) === 'acide' ? 'de la forme acide' : M.teinte(ind, pH) === 'base' ? 'de la forme basique' : 'mélangée'}.`}>
      <Erlen cx={110} y0={10} s={1.05} coul={coul} niveau={0.45}/>
      <text x="200" y="38" fontSize="19" fontWeight="700" fill={COL.txt}>{ind.nom}</text>
      <text x="200" y="66" fontSize="18" fill={COL.txt}>pH = {f1(pH)}</text>
      <rect x="200" y="82" width="16" height="16" fill={ind.acide} stroke="#94a3b8"/><text x="224" y="96" fontSize="16" fill={COL.txt}>forme HIn</text>
      <rect x="200" y="106" width="16" height="16" fill={ind.base} stroke="#94a3b8"/><text x="224" y="120" fontSize="16" fill={COL.txt}>forme In⁻</text>
    </svg>);
}

// ====================== cartes « À retenir » (viewBox 300) ======================
const X3 = p => 20 + 18.57 * p;

// carte 1 : prédominance
export function SvgPredCarte() {
  const xk = X3(4.76);
  return (
    <svg viewBox="0 0 300 190" style={stl} role="img" aria-label="Diagramme de prédominance du couple CH3COOH / CH3COO moins : à gauche de pKA égal 4,76, CH3COOH prédomine ; à droite, CH3COO moins prédomine.">
      <text x="150" y="20" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>Prédominance du couple</text>
      <rect x="20" y="34" width={xk - 20} height="42" fill={COL.fondB}/><rect x={xk} y="34" width={280 - xk} height="42" fill={COL.fondO}/>
      <line x1="20" y1="76" x2="280" y2="76" stroke={COL.txt} strokeWidth="2"/>
      {[0, 7, 14].map(p => <text key={p} x={X3(p)} y="98" fontSize="14" textAnchor="middle" fill={COL.txt}>{p}</text>)}
      <text x="292" y="124" fontSize="14" textAnchor="end" fill={COL.gris}>pH</text>
      <line x1={xk} y1="28" x2={xk} y2="82" stroke={COL.orange} strokeWidth="2" strokeDasharray="4 3"/>
      <text x={(20 + xk) / 2} y="62" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.bleu}>CH₃COOH</text>
      <text x={(xk + 280) / 2} y="62" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>CH₃COO⁻</text>
      <text x={xk} y="124" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>pK<Sb t="A"/><Rs> = 4,76</Rs></text>
      <text x="10" y="152" fontSize="14" fill={COL.txt}>pH &lt; pK<Sb t="A"/><Rs> : l’acide AH domine</Rs></text>
      <text x="10" y="174" fontSize="14" fill={COL.txt}>pH &gt; pK<Sb t="A"/><Rs> : la base A⁻ domine</Rs></text>
    </svg>);
}

// carte 2 : rapport 10^(pH − pKA) et pourcentages à pKA − 1, pKA, pKA + 1
export function SvgRapportCarte() {
  const lignes = [['pH = pK_A − 1', 100 / 11, '0,1'], ['pH = pK_A', 50, '1'], ['pH = pK_A + 1', 1000 / 11, '10']];
  const W = 150;
  return (
    <svg viewBox="0 0 300 236" style={stl} role="img" aria-label="Pourcentage de forme acide et de forme basique : à pH égal pKA moins 1, 91 pour cent de forme acide et 9 pour cent de forme basique ; à pH égal pKA, 50 et 50 ; à pH égal pKA plus 1, 9 pour cent d’acide et 91 pour cent de base.">
      <text x="86" y="30" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>Rapport</text>
      <text x="184" y="17" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>[A⁻]</text>
      <line x1="150" y1="23" x2="218" y2="23" stroke={COL.txt} strokeWidth="1.8"/>
      <text x="184" y="40" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>[AH]</text>
      {lignes.map(([lab, b, r], i) => { const y = 50 + i * 56, acide = 100 - b;
        return <g key={lab}>
          <text x="10" y={y + 14} fontSize="14" fontWeight="700" fill={COL.txt}>{lab.replace('pK_A', 'pKA')}</text>
          <rect x="10" y={y + 22} width={W * acide / 100 * 1.8} height="18" fill={COL.bleu}/><rect x={10 + W * acide / 100 * 1.8} y={y + 22} width={W * b / 100 * 1.8} height="18" fill={COL.orange}/>
          <text x="284" y={y + 14} fontSize="14" fontWeight="700" textAnchor="end" fill={COL.gris}>rapport {r}</text>
        </g>; })}
      <text x="10" y="228" fontSize="14" fill={COL.bleu} fontWeight="700">■ AH</text><text x="80" y="228" fontSize="14" fill={COL.orange} fontWeight="700">■ A⁻</text>
      <text x="290" y="228" fontSize="14" textAnchor="end" fill={COL.txt}>rapport = 10<tspan dy="-5" fontSize="13">pH − pKA</tspan></text>
    </svg>);
}

// carte 3 : diagramme de distribution
export function SvgDistCarte() {
  const pKa = 4.76, X = p => 28 + 18.4 * p, Y = f => 130 - 96 * f, pts = M.courbes(pKa, 57);
  const ch = k => pts.map(q => `${X(q.pH).toFixed(1)},${Y(q[k]).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 300 210" style={stl} role="img" aria-label="Diagramme de distribution du couple CH3COOH / CH3COO moins : la courbe de CH3COOH décroît, celle de CH3COO moins croît ; elles se croisent à 50 pour cent quand le pH vaut pKA, soit 4,76.">
      <text x="150" y="18" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>Diagramme de distribution</text>
      <line x1="28" y1={Y(0)} x2="290" y2={Y(0)} stroke={COL.txt}/><line x1="28" y1={Y(1)} x2="290" y2={Y(1)} stroke="#e2e8f0"/>
      <line x1="28" y1={Y(0.5)} x2="290" y2={Y(0.5)} stroke="#cbd5e1" strokeDasharray="4 3"/>
      <text x="24" y={Y(1) + 5} fontSize="14" textAnchor="end" fill={COL.txt}>100</text><text x="24" y={Y(0.5) + 5} fontSize="14" textAnchor="end" fill={COL.txt}>50</text><text x="24" y={Y(0) + 5} fontSize="14" textAnchor="end" fill={COL.txt}>0</text>
      {[0, 7, 14].map(p => <text key={p} x={X(p)} y="152" fontSize="14" textAnchor="middle" fill={COL.txt}>{p}</text>)}
      <text x="292" y="172" fontSize="14" textAnchor="end" fill={COL.gris}>pH</text>
      <polyline points={ch('acide')} fill="none" stroke={COL.bleu} strokeWidth="3"/><polyline points={ch('base')} fill="none" stroke={COL.orange} strokeWidth="3"/>
      <line x1={X(pKa)} y1={Y(0.5)} x2={X(pKa)} y2={Y(0)} stroke={COL.rouge} strokeWidth="2" strokeDasharray="4 3"/><circle cx={X(pKa)} cy={Y(0.5)} r="5" fill={COL.rouge}/>
      <text x={X(pKa) + 8} y={Y(0.5) - 8} fontSize="14" fontWeight="700" fill={COL.rouge}>50 %</text>
      <text x={X(pKa)} y="170" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.rouge}>pH = pK<Sb t="A"/><Rs> = 4,76</Rs></text>
      <text x="10" y="196" fontSize="14" fontWeight="700" fill={COL.bleu}>── CH₃COOH</text><text x="150" y="196" fontSize="14" fontWeight="700" fill={COL.orange}>── CH₃COO⁻</text>
    </svg>);
}

// carte 4 : indicateur coloré
export function SvgIndicCarte() {
  const ind = M.indicParId('bbt');
  const fl = [[4, 'pH 4'], [6.8, 'pH 6,8'], [9, 'pH 9']];
  const noms = ['HIn domine', 'mélange', 'In⁻ domine'];
  return (
    <svg viewBox="0 0 300 200" style={stl} role="img" aria-label="Bleu de bromothymol de pKA 6,8 : jaune quand la forme acide HIn domine (pH 4), vert au pH égal au pKA, bleu quand la forme basique In moins domine (pH 9).">
      <text x="150" y="20" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>Un indicateur est un couple coloré</text>
      {fl.map(([p, lab], i) => { const cx = 50 + i * 100;
        return <g key={lab}>
          <Erlen cx={cx} y0={34} s={0.8} coul={M.couleurIndic(ind, p)} niveau={0.5}/>
          <text x={cx} y="146" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>{lab}</text>
          <text x={cx} y="166" fontSize="14" textAnchor="middle" fill={COL.gris}>{noms[i]}</text></g>; })}
      <text x="150" y="190" fontSize="14" textAnchor="middle" fill={COL.txt}>virage : de pK<Sb t="A"/><Rs> − 1 à pK</Rs><Sb t="A"/><Rs> + 1</Rs></text>
    </svg>);
}

// carte 5 : choix de l'indicateur
export function SvgChoixCarte() {
  const X = p => 20 + 20 * (p - 2), pHeq = 8.7;
  const lignes = [['jm', 'jaune de méthyle'], ['bbt', 'BBT (bromothymol)'], ['bth', 'bleu de thymol']];
  return (
    <svg viewBox="0 0 300 212" style={stl} role="img" aria-label="Choix d’un indicateur coloré : le pH à l’équivalence vaut 8,7. Seule la zone de virage du bleu de thymol, de 7,8 à 9,8, contient cette valeur ; le jaune de méthyle et le bleu de bromothymol ne conviennent pas.">
      <text x="150" y="20" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>Choisir l’indicateur</text>
      {lignes.map(([id, nom], i) => { const ind = M.indicParId(id), y = 40 + i * 44, ok = M.convient(ind, pHeq);
        return <g key={id}>
          <text x="20" y={y + 10} fontSize="14" fontWeight="700" fill={ok ? COL.vert : COL.txt}>{nom}</text>
          <rect x={X(ind.zone[0])} y={y + 16} width={X(ind.zone[1]) - X(ind.zone[0])} height="14" fill={ok ? COL.vert : COL.gris} opacity={ok ? 0.9 : 0.55}/></g>; })}
      <line x1="20" y1="176" x2="280" y2="176" stroke={COL.txt} strokeWidth="2"/>
      {[2, 6, 10, 12].map(p => <text key={p} x={X(p)} y="196" fontSize="14" textAnchor="middle" fill={COL.txt}>{p}</text>)}
      <text x="292" y="196" fontSize="14" textAnchor="end" fill={COL.gris}>pH</text>
      <line x1={X(pHeq)} y1="34" x2={X(pHeq)} y2="176" stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 3"/>
      <text x={X(pHeq) + 6} y="38" fontSize="14" fontWeight="700" fill={COL.rouge}>pH éq. = 8,7</text>
    </svg>);
}
