import { KIT } from "../commun";

// ====================================================
//  SCHÉMAS NEUTRES DE SECONDE (ondes et signaux) : spectres de raies, caractéristique tension-courant
// ====================================================
// Même principe que SchemasSeconde.jsx : une banque décrit un visuel par { type, …paramètres } ; Visuel() le dessine.
// Les schémas sont neutres : aucune valeur de l'énoncé n'y figure (les graduations numériques des axes sont absentes) ;
// la réponse n'apparaît qu'après la correction, par le paramètre `reponse` (donné par `apres: { reponse: true }`).
//   spectres        : { cas: 'melange' } : spectres de raies de gaz connus (hydrogène, sodium, mercure) et spectre d'une lampe à identifier
//   caracteristique : { cas: 'deux' } deux dipôles A (résistor) et B (lampe) ; { cas: 'point' } une lampe et la tension U₀ repérée

const TR = '#334155', BLEU = '#2563eb', ORANGE = '#c2410c', VERT = '#15803d';
const boite = { background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 6 };
const svgStyle = { width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto' };
const Ind = ({ b, i }) => <><tspan>{b}</tspan><tspan fontSize="0.75em" dy="3">{i}</tspan><tspan dy="-3"> </tspan></>;

// Couleur approchée d'une radiation visible (longueur d'onde en nm), assez vive pour se voir sur fond noir
function couleur(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; r = Math.max(r, 0.55); }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
  else r = 1;
  const c = x => Math.round(255 * Math.min(1, Math.max(0, x)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

// Raies (en nm) des gaz de l'exercice « lampe à identifier » : hydrogène (série de Balmer), sodium (doublet jaune), mercure
const RAIES = {
  hydrogene: [410, 434, 486, 656],
  sodium: [589],
  mercure: [405, 436, 546, 578],
};
const LAMPE_INCONNUE = [410, 434, 486, 589, 656];

export function Spectres() {
  const X0 = 164, L = 222, nm0 = 400, nm1 = 700;
  const x = nm => X0 + (nm - nm0) * L / (nm1 - nm0);
  const lignes = [['Hydrogène', RAIES.hydrogene], ['Sodium', RAIES.sodium], ['Mercure', RAIES.mercure], ['Lampe inconnue', LAMPE_INCONNUE]];
  const H = 36, PAS = 50, Y0 = 8;
  const yAxe = Y0 + lignes.length * PAS + 2;
  return (
    <div style={boite} data-schema="spectres">
      <svg viewBox={`0 0 410 ${yAxe + 58}`} style={svgStyle} role="img" aria-label="Spectres de raies de l’hydrogène, du sodium et du mercure, puis spectre de raies d’une lampe inconnue, sur une échelle de longueurs d’onde de 400 à 700 nanomètres">
        {lignes.map(([nom, raies], k) => {
          const y = Y0 + k * PAS, derniere = k === lignes.length - 1;
          return (
            <g key={nom}>
              <text x="4" y={y + H / 2 + 6} fontSize="18" fill={derniere ? ORANGE : TR} fontWeight={derniere ? 700 : 400}>{nom}</text>
              <rect x={X0} y={y} width={L} height={H} fill="#0b0f19" stroke={derniere ? ORANGE : TR} strokeWidth={derniere ? 2.5 : 1.2}/>
              {raies.map(nm => <line key={nm} x1={x(nm)} y1={y + 2} x2={x(nm)} y2={y + H - 2} stroke={couleur(nm)} strokeWidth="3"/>)}
            </g>);
        })}
        <line x1={X0} y1={yAxe} x2={X0 + L} y2={yAxe} stroke={TR} strokeWidth="1.8"/>
        {[400, 500, 600, 700].map(nm => <g key={nm}><line x1={x(nm)} y1={yAxe} x2={x(nm)} y2={yAxe + 7} stroke={TR} strokeWidth="1.8"/><text x={x(nm)} y={yAxe + 27} fontSize="18" fill={TR} textAnchor="middle">{nm}</text></g>)}
        <text x={X0 + L} y={yAxe + 52} fontSize="18" fill="#475569" textAnchor="end">longueur d’onde (nm)</text>
      </svg>
    </div>);
}

// Caractéristique U = f(I) : l'intensité en abscisse, la tension en ordonnée ; aucune graduation chiffrée
export function Caracteristique({ cas = 'deux', reponse = false }) {
  const EXP = 2.2, OX = 62, OY = 218, XM = 350, YM = 24, LX = 280, HY = 150;
  const ptsB = [];                       // dipôle B : lampe (la tension croît de plus en plus vite avec l'intensité)
  for (let k = 0; k <= 40; k++) { const t = k / 40; ptsB.push([OX + t * LX, OY - HY * Math.pow(t, EXP)]); }
  const courbeB = 'M' + ptsB.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L');
  const yU0 = 118;                       // tension U₀ repérée (cas « point »)
  const xI0 = OX + Math.pow((OY - yU0) / HY, 1 / EXP) * LX;
  return (
    <div style={boite} data-schema={`caracteristique-${cas}`}>
      <svg viewBox="0 0 400 270" style={svgStyle} role="img" aria-label={cas === 'deux' ? 'Caractéristiques tension-courant de deux dipôles A et B : A est une droite qui passe par l’origine, B est une courbe qui monte de plus en plus vite' : 'Caractéristique tension-courant d’une lampe, avec la tension U0 repérée sur l’axe vertical'}>
        <defs><marker id="fl-car" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={TR}/></marker></defs>
        <line x1={OX} y1={OY} x2={XM + 24} y2={OY} stroke={TR} strokeWidth="2.2" markerEnd="url(#fl-car)"/>
        <line x1={OX} y1={OY} x2={OX} y2={YM - 8} stroke={TR} strokeWidth="2.2" markerEnd="url(#fl-car)"/>
        <text x={XM + 24} y={OY + 32} fontSize="19" fill={TR} textAnchor="end"><tspan fontStyle="italic">I</tspan> (mA)</text>
        <text x={OX + 10} y={YM + 2} fontSize="19" fill={TR}><tspan fontStyle="italic">U</tspan> (V)</text>
        <text x={OX - 8} y={OY + 20} fontSize="17" fill="#64748b" textAnchor="end">0</text>
        {cas === 'deux' && <>
          <line x1={OX} y1={OY} x2={OX + LX} y2={OY - HY - 25} stroke={BLEU} strokeWidth="3.2" strokeLinecap="round"/>
          <text x={OX + LX + 8} y={OY - HY - 18} fontSize="24" fontWeight="700" fill={BLEU}>A</text>
          <path d={courbeB} fill="none" stroke={ORANGE} strokeWidth="3.2" strokeLinecap="round"/>
          <text x={OX + LX + 8} y={OY - HY + 10} fontSize="24" fontWeight="700" fill={ORANGE}>B</text>
        </>}
        {cas === 'point' && <>
          <path d={courbeB} fill="none" stroke={BLEU} strokeWidth="3.2" strokeLinecap="round"/>
          <line x1={OX} y1={yU0} x2={reponse ? xI0 : OX + LX + 20} y2={yU0} stroke={ORANGE} strokeWidth="2.2" strokeDasharray="6 5"/>
          <circle cx={OX} cy={yU0} r="4.5" fill={ORANGE}/>
          <text x={OX - 10} y={yU0 + 7} fontSize="22" fontWeight="700" fill={ORANGE} textAnchor="end"><Ind b="U" i="0"/></text>
          {reponse && <>
            <line x1={xI0} y1={yU0} x2={xI0} y2={OY} stroke={VERT} strokeWidth="2.2" strokeDasharray="6 5"/>
            <circle cx={xI0} cy={yU0} r="5" fill={VERT}/><circle cx={xI0} cy={OY} r="4.5" fill={VERT}/>
            <text x={xI0} y={OY + 28} fontSize="22" fontWeight="700" fill={VERT} textAnchor="middle"><Ind b="I" i="0"/></text>
          </>}
        </>}
      </svg>
    </div>);
}
