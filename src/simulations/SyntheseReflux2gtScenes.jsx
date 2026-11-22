// Scènes de la simulation 204 « Synthèse d'une espèce naturelle : montage à reflux et CCM » (2GT).
// Le MONTAGE À REFLUX est dessiné à partir de syntheseReflux2gtGeometrie.js (coordonnées testées par node : points d'attache sur les pièces, légendes sans chevauchement, eau entrant par le bas).
// Schémas SVG : viewBox de 480 de large, légendes de 19 (≥ 18, lisibles à 390 px), plafonnés à maxWidth 430 ; non à l'échelle (annoncé dans la simulation).
// Code visuel constant (scènes ET cartes) : vapeurs = flèches orange vers le haut ; gouttes = gouttes bleues qui descendent ; eau de refroidissement = bleu clair avec flèches bleu foncé ;
// mélange réactionnel = jaune pâle ; verre = trait gris foncé. La plaque de CCM reprend les conventions de la simulation 197 (1 cm = 40 unités, ligne de dépôt à 1 cm du bas).
import { useId } from "react";
import { COL, Pastille, styleChamp } from "./Ccm2gtScenes";
import * as G from "./syntheseReflux2gtGeometrie.js";
import * as M from "./syntheseReflux2gtModele.js";

export { COL, Pastille, styleChamp };
const { GEO } = G;
export const stl = (max = 430) => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 10 });
export const C2 = { verre: '#475569', mel: '#fef9c3', melTrait: '#ca8a04', eau: '#bae6fd', eauFonce: '#0b4f94', tuyau: '#7dd3fc', vapeur: '#c2410c', goutte: '#2563eb', metal: '#64748b', clair: '#cbd5e1' };

// ---------- une goutte (tête en haut) ----------
export const Goutte = ({ x, y, k = 1, c = C2.goutte }) => <path d={`M${x} ${y - 7 * k} q${-4.5 * k} ${7 * k} ${-4.5 * k} ${10 * k} a${4.5 * k} ${4.5 * k} 0 0 0 ${9 * k} 0 q0 ${-3 * k} ${-4.5 * k} ${-10 * k}z`} fill={c} stroke="#1e3a8a" strokeWidth={1.2 * k} />;
// ---------- une flèche pleine (tige + pointe) ----------
export const Fleche = ({ x1, y1, x2, y2, c, w = 3, t = 9 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), ux = Math.cos(a), uy = Math.sin(a), bx = x2 - ux * t, by = y2 - uy * t;
  return <g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w} strokeLinecap="round" /><polygon points={`${x2},${y2} ${bx - uy * t * 0.62},${by + ux * t * 0.62} ${bx + uy * t * 0.62},${by - ux * t * 0.62}`} fill={c} /></g>;
};

// ============================================================================================
//  LE MONTAGE À REFLUX : le dessin (groupe de coordonnées du viewBox 480 × 460), sans le svg ni les légendes
// ============================================================================================
export function MontageGroupe({ montage: m, anim = true }) {
  const uid = useId().replace(/\W/g, '');
  const { potence, ballon: B, chauffe: Ch, refrig: Rf, pinceBallon: PB, pinceRefrig: PR, pierre } = GEO;
  const marche = !!(m.marche && m.ballon && m.chauffe), plein = m.eau === 'bas' || m.eau === 'neutre', partiel = m.eau === 'haut';
  const d = M.diagnostic(m);
  const echappe = marche && m.refrigerant && d.vapeurs !== 'retombent';
  const jq = Rf.jaq, tb = Rf.tube, hose = y => (
    <g key={y}>
      <rect x={jq.x + jq.w} y={y - 5.5} width={11} height={11} fill={C2.clair} stroke={C2.verre} strokeWidth={1.8} />
      <line x1={jq.x + jq.w + 11} y1={y} x2={Rf.xTuyauFin} y2={y} stroke="#0369a1" strokeWidth={12} strokeLinecap="round" />
      <line x1={jq.x + jq.w + 11} y1={y} x2={Rf.xTuyauFin} y2={y} stroke={C2.tuyau} strokeWidth={8} strokeLinecap="round" />
    </g>);
  const entreeBas = m.eau === 'bas', ent = entreeBas ? Rf.yBas : Rf.yHaut, sor = entreeBas ? Rf.yHaut : Rf.yBas;
  const bulles = [[222, 352, 0], [246, 346, 0.4], [236, 338, 0.8], [210, 345, 0.2], [256, 352, 0.6]];
  return (
    <g>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .rf-v${uid} { animation: rf-monte 1.8s ease-in-out infinite; } .rf-g${uid} { animation: rf-tombe 1.6s linear infinite; } .rf-b${uid} { animation: rf-bulle 1.5s linear infinite; }
          @keyframes rf-monte { 0% { opacity: .25; transform: translateY(8px); } 60% { opacity: 1; } 100% { opacity: .25; transform: translateY(-8px); } }
          @keyframes rf-tombe { 0% { opacity: 0; transform: translateY(-14px); } 20% { opacity: 1; } 100% { opacity: 1; transform: translateY(16px); } }
          @keyframes rf-bulle { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-26px); } }
        }`}</style>
      <defs><clipPath id={`cb${uid}`}><circle cx={B.cx} cy={B.cy} r={B.r - 1.5} /></clipPath></defs>
      {/* paillasse */}
      <line x1={4} y1={potence.sol} x2={476} y2={potence.sol} stroke="#94a3b8" strokeWidth={3} strokeLinecap="round" />
      {/* support : tige de la potence et socle ; bras vers les pinces */}
      {m.support && <g>
        <rect x={potence.base.x} y={potence.base.y} width={potence.base.w} height={potence.base.h} rx={2} fill="#94a3b8" stroke={C2.verre} strokeWidth={2} />
        <rect x={potence.x - 3} y={potence.y0} width={6} height={potence.y1 - potence.y0} fill={C2.metal} />
        {m.pince && m.ballon && <line x1={potence.x} y1={PB.y} x2={PB.x0} y2={PB.y} stroke={C2.metal} strokeWidth={5} />}
        {m.pince && m.refrigerant && <line x1={potence.x} y1={PR.y} x2={PR.x0} y2={PR.y} stroke={C2.metal} strokeWidth={5} />}
      </g>}
      {/* chauffe-ballon : coque en coupe, boîtier, bouton */}
      {m.chauffe && <g>
        <rect x={Ch.boite.x} y={Ch.boite.y} width={Ch.boite.w} height={Ch.boite.h} rx={6} fill="#e2e8f0" stroke={C2.verre} strokeWidth={2.4} />
        <circle cx={Ch.bouton.cx} cy={Ch.bouton.cy} r={Ch.bouton.r} fill="white" stroke={C2.verre} strokeWidth={2.2} />
        <line x1={Ch.bouton.cx} y1={Ch.bouton.cy} x2={Ch.bouton.cx + (marche ? 7 : -7)} y2={Ch.bouton.cy - 8} stroke="#b91c1c" strokeWidth={2.6} strokeLinecap="round" />
        <path d={`M${Ch.cx - Ch.r} ${Ch.cy} A${Ch.r} ${Ch.r} 0 0 0 ${Ch.cx + Ch.r} ${Ch.cy} Z`} fill={marche ? '#fdba74' : '#e2e8f0'} stroke={C2.verre} strokeWidth={3} strokeLinejoin="round" />
        {marche && <circle cx={Ch.bouton.cx + 38} cy={Ch.bouton.cy + 14} r={4.5} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1} />}
      </g>}
      {/* ballon : mélange, pierre ponce, bulles, verre */}
      {m.ballon && <g>
        <g clipPath={`url(#cb${uid})`}>
          <rect x={B.cx - B.r} y={B.niveau} width={2 * B.r} height={B.r + 2} fill={C2.mel} />
          <line x1={B.cx - B.r} y1={B.niveau} x2={B.cx + B.r} y2={B.niveau} stroke={C2.melTrait} strokeWidth={2} />
          {m.pierre && pierre.map(([x, y], i) => <polygon key={i} points={`${x - 5},${y + 3} ${x - 4},${y - 4} ${x + 3},${y - 5} ${x + 6},${y + 1} ${x + 2},${y + 5}`} fill="#a8a29e" stroke="#57534e" strokeWidth={1.4} />)}
          {marche && bulles.map(([x, y, r], i) => <circle key={i} className={anim ? `rf-b${uid}` : undefined} cx={x} cy={y} r={3.2 + (i % 2)} fill="none" stroke="#a16207" strokeWidth={1.6} style={{ animationDelay: `${-r * 1.5}s` }} />)}
        </g>
        <path d={`M${B.colG} ${B.colY} V${G.sphereY(B.colG).toFixed(2)} A${B.r} ${B.r} 0 1 0 ${B.colD} ${G.sphereY(B.colD).toFixed(2)} V${B.colY}`} fill="none" stroke={C2.verre} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={B.colG - 4} y={B.colY - 4} width={B.colD - B.colG + 8} height={6} rx={2} fill="#f1f5f9" stroke={C2.verre} strokeWidth={1.8} />
      </g>}
      {/* pince sur le col du ballon */}
      {m.pince && m.ballon && <g><rect x={PB.x0} y={PB.y - 6} width={PB.x1 - PB.x0} height={12} rx={3} fill={C2.clair} stroke={C2.verre} strokeWidth={2} /><circle cx={PB.x0 + 6} cy={PB.y} r={2.5} fill={C2.verre} /></g>}
      {/* réfrigérant : gaine (eau), tube intérieur ouvert en haut, pince, tuyaux */}
      {m.refrigerant && <g>
        <rect x={jq.x} y={jq.y} width={jq.w} height={jq.h} fill={plein ? C2.eau : 'white'} stroke={C2.verre} strokeWidth={2.6} />
        {partiel && <g>
          <rect x={jq.x + 1.3} y={jq.y + jq.h * 0.6} width={jq.w - 2.6} height={jq.h * 0.4 - 1.3} fill={C2.eau} />
          <line x1={jq.x + 1.3} y1={jq.y + jq.h * 0.6} x2={jq.x + jq.w - 1.3} y2={jq.y + jq.h * 0.6} stroke="#0369a1" strokeWidth={2} />
          {[[222, 70], [247, 84], [225, 104]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill="white" stroke="#64748b" strokeWidth={1.3} />)}
        </g>}
        <rect x={tb.x} y={tb.y} width={tb.w} height={tb.h} fill="white" stroke={C2.verre} strokeWidth={2.6} />
        <rect x={tb.x - 4} y={tb.y - 4} width={tb.w + 8} height={6} rx={2} fill="#f1f5f9" stroke={C2.verre} strokeWidth={1.8} />
        {m.bouchon && <polygon points={`${tb.x - 2},${tb.y - 17} ${tb.x + tb.w + 2},${tb.y - 17} ${tb.x + tb.w - 1},${tb.y - 2} ${tb.x + 1},${tb.y - 2}`} fill="#a16207" stroke="#713f12" strokeWidth={2} strokeLinejoin="round" />}
        {m.pince && <g><rect x={PR.x0} y={PR.y - 6} width={PR.x1 - PR.x0} height={12} rx={3} fill={C2.clair} stroke={C2.verre} strokeWidth={2} /><circle cx={PR.x0 + 6} cy={PR.y} r={2.5} fill={C2.verre} /></g>}
        {(m.eau === 'bas' || m.eau === 'haut' || m.eau === 'aucune') && <g>
          {hose(Rf.yHaut)}{hose(Rf.yBas)}
          {m.eau !== 'aucune' && <g>
          {/* sens de l'eau : l'entrée amène l'eau vers la gaine, la sortie l'emmène vers l'extérieur */}
          <Fleche x1={Rf.xTuyauFin - 6} y1={ent} x2={jq.x + jq.w + 18} y2={ent} c={C2.eauFonce} w={3} t={10} />
          <Fleche x1={jq.x + jq.w + 18} y1={sor} x2={Rf.xTuyauFin - 6} y2={sor} c={C2.eauFonce} w={3} t={10} />
          </g>}
        </g>}
      </g>}
      {/* vapeurs (orange, vers le haut) et gouttes (bleues, vers le bas) */}
      {marche && m.refrigerant && <g>
        <g className={anim ? `rf-v${uid}` : undefined}><Fleche x1={240} y1={300} x2={240} y2={250} c={C2.vapeur} w={3} t={8} /></g>
        <g className={anim ? `rf-v${uid}` : undefined}><Fleche x1={240} y1={206} x2={240} y2={d.vapeurs === 'retombent' ? 136 : 70} c={C2.vapeur} w={3} t={8} /></g>
        {d.vapeurs !== 'sechappent' && [[230, 138, 0], [230, 168, 0.5], [230, 198, 1], [230, 226, 0.25], [230, 262, 0.75]].map(([x, y, r], i) => <g key={i} className={anim ? `rf-g${uid}` : undefined} style={{ animationDelay: `${-r * 1.6}s` }}><Goutte x={x} y={y} k={0.9} /></g>)}
        {echappe && <g>
          <Fleche x1={235} y1={16} x2={235} y2={3} c={C2.vapeur} w={3} t={8} />
          {!m.bouchon && <g><ellipse cx={217} cy={8} rx={11} ry={5.5} fill="#cbd5e1" opacity={0.85} /><ellipse cx={254} cy={8} rx={11} ry={5.5} fill="#cbd5e1" opacity={0.85} /></g>}
        </g>}
      </g>}
      {/* sans réfrigérant : les vapeurs sortent du col du ballon */}
      {marche && !m.refrigerant && m.ballon && <g>
        <g className={anim ? `rf-v${uid}` : undefined}><Fleche x1={235} y1={300} x2={235} y2={228} c={C2.vapeur} w={3} t={10} /></g>
        <g className={anim ? `rf-v${uid}` : undefined}><Fleche x1={232} y1={206} x2={232} y2={130} c={C2.vapeur} w={3} t={10} /></g>
        <g className={anim ? `rf-v${uid}` : undefined}><Fleche x1={248} y1={200} x2={262} y2={150} c={C2.vapeur} w={3} t={10} /></g>
        <g className={anim ? `rf-v${uid}` : undefined}><Fleche x1={222} y1={200} x2={208} y2={150} c={C2.vapeur} w={3} t={10} /></g>
        <ellipse cx={235} cy={112} rx={22} ry={9} fill="#cbd5e1" opacity={0.7} /><ellipse cx={252} cy={128} rx={15} ry={7} fill="#cbd5e1" opacity={0.6} /><ellipse cx={216} cy={130} rx={14} ry={6} fill="#cbd5e1" opacity={0.6} />
      </g>}
    </g>);
}

// Légendes : ligne de rappel, point sur la pièce, texte ; ou pastilles numérotées (pins = { id: numéro })
export function Legendes({ montage, ids, pins = null }) {
  const L = G.legendesAjustees(montage), vis = G.legendesVisibles(montage, ids);
  return (
    <g>
      {vis.map(id => {
        const l = L[id], dep = [l.a === 'start' ? G.boite(id).x0 - 3 : G.boite(id).x1 + 3, l.yc], base = G.baselines(id);
        const lb = { ...l, yc: l.yc }, pin = pins && pins[id] != null;
        const bx = pin ? (l.a === 'start' ? l.x + 15 : l.x - 15) : null;
        return (
          <g key={id}>
            <line x1={pin ? (l.a === 'start' ? bx - 14 : bx + 14) : dep[0]} y1={l.yc} x2={l.ancre[0]} y2={l.ancre[1]} stroke={COL.gris} strokeWidth={1.7} strokeLinecap="round" />
            <circle cx={l.ancre[0]} cy={l.ancre[1]} r={3.2} fill={COL.orange} stroke="white" strokeWidth={1} />
            {pin
              ? <g><circle cx={bx} cy={l.yc} r={15} fill={COL.orange} /><text x={bx} y={l.yc + 7.5} textAnchor="middle" fontSize={21} fontWeight={800} fill="white">{pins[id]}</text></g>
              : l.lignes.map((t, i) => <text key={i} x={l.x} y={(id === 'entree' || id === 'sortie') ? lb.yc + 6.5 : base[i]} textAnchor={l.a} fontSize={G.FS} fontWeight={700} fill={COL.encre} stroke="white" strokeWidth={4} paintOrder="stroke">{t}</text>)}
          </g>);
      })}
    </g>);
}

export function MontageSvg({ montage, legendes = [], pins = null, aria, anim = true, maxW = 430 }) {
  return (
    <svg viewBox={`0 0 ${G.VB.w} ${G.VB.h}`} style={stl(maxW)} role="img" aria-label={aria || 'Schéma d’un montage de chauffage : une paillasse, un support, un chauffe-ballon et un ballon.'}>
      <MontageGroupe montage={montage} anim={anim} />
      <Legendes montage={montage} ids={legendes} pins={pins} />
    </svg>);
}

// ============================================================================================
//  ÉTAPE 1 : de deux liquides à un arôme (équation en mots)
// ============================================================================================
const Puce = ({ x, y, w, lignes, fond = '#eff6ff', trait = '#0b4f94' }) => (
  <g>
    <rect x={x} y={y} width={w} height={lignes.length > 1 ? 58 : 44} rx={12} fill={fond} stroke={trait} strokeWidth={2.2} />
    {lignes.map((t, i) => <text key={i} x={x + w / 2} y={y + (lignes.length > 1 ? 24 : 29) + i * 22} textAnchor="middle" fontSize={19} fontWeight={800} fill={COL.encre}>{t}</text>)}
  </g>);
export function Banane({ x, y, k = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d="M-34 -14 C-26 20 8 34 40 18 C46 14 50 8 48 2 C44 14 12 20 -18 -6 C-22 -10 -26 -22 -34 -14 Z" fill="#fde047" stroke="#a16207" strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M-34 -14 C-36 -20 -30 -26 -26 -24" fill="none" stroke="#713f12" strokeWidth={4} strokeLinecap="round" />
      <path d="M48 2 L52 -2" stroke="#713f12" strokeWidth={4} strokeLinecap="round" />
    </g>);
}
export function SceneSynthese() {
  return (
    <svg viewBox="0 0 480 330" style={stl(440)} role="img" aria-label="Un schéma en deux niveaux : en haut, deux espèces écrites dans deux cadres reliés par un plus ; une flèche vers le bas marquée chauffage et catalyseur ; en bas, deux espèces dans deux cadres reliés par un plus, avec une banane dessinée près de l’un d’eux.">
      <Puce x={40} y={14} w={190} lignes={['alcool', 'isoamylique']} />
      <text x={240} y={50} textAnchor="middle" fontSize={26} fontWeight={800} fill={COL.gris}>+</text>
      <Puce x={250} y={14} w={190} lignes={['acide', 'éthanoïque']} />
      <Fleche x1={240} y1={90} x2={240} y2={160} c={COL.orange} w={6} t={18} />
      <text x={262} y={112} fontSize={19} fontWeight={800} fill={COL.orange}>chauffage</text>
      <text x={262} y={136} fontSize={19} fontWeight={800} fill={COL.orange}>catalyseur</text>
      <Puce x={96} y={178} w={212} lignes={['acétate d’isoamyle', 'arôme de banane']} fond="#fef9c3" trait="#a16207" />
      <text x={326} y={214} textAnchor="middle" fontSize={26} fontWeight={800} fill={COL.gris}>+</text>
      <Puce x={344} y={184} w={96} lignes={['eau']} />
      <Banane x={56} y={212} k={0.85} /><Goutte x={392} y={258} k={1.6} c="#38bdf8" />
      <text x={240} y={318} textAnchor="middle" fontSize={18} fill={COL.gris}>schéma : la flèche se lit « donne »</text>
    </svg>);
}

// ============================================================================================
//  ÉTAPE 2 : l'effet du chauffage (schéma qualitatif, sans valeurs)
// ============================================================================================
export function SceneChauffage() {
  const X0 = 66, X1 = 452, Y0 = 56, Y1 = 270, pts = tau => Array.from({ length: 57 }, (_, i) => { const t = (M.COURBE.tMax * i) / 56; return `${(X0 + (X1 - X0) * t / M.COURBE.tMax).toFixed(1)},${(Y1 - (Y1 - Y0) * M.esterFormé(t, tau) / 0.9).toFixed(1)}`; }).join(' ');
  return (
    <svg viewBox="0 0 480 330" style={stl(440)} role="img" aria-label="Schéma qualitatif : la quantité d’ester formée en fonction du temps, pour un mélange laissé à 20 °C et pour un mélange chauffé. Les deux courbes montent puis se rejoignent à la même hauteur ; la courbe du mélange chauffé monte plus vite.">
      <text x={14} y={30} fontSize={19} fontWeight={800} fill={COL.encre}>quantité d’ester formé</text>
      <line x1={X0} y1={Y1} x2={X1 + 10} y2={Y1} stroke={COL.encre} strokeWidth={2.6} /><polygon points={`${X1 + 24},${Y1} ${X1 + 12},${Y1 - 6} ${X1 + 12},${Y1 + 6}`} fill={COL.encre} />
      <line x1={X0} y1={Y1} x2={X0} y2={Y0 - 14} stroke={COL.encre} strokeWidth={2.6} /><polygon points={`${X0},${Y0 - 26} ${X0 - 6},${Y0 - 13} ${X0 + 6},${Y0 - 13}`} fill={COL.encre} />
      <text x={X1 - 4} y={Y1 + 28} textAnchor="end" fontSize={19} fontWeight={800} fill={COL.encre}>temps</text>
      <polyline points={pts(M.COURBE.tau.froid)} fill="none" stroke={COL.bleu} strokeWidth={4} strokeLinejoin="round" />
      <polyline points={pts(M.COURBE.tau.chaud)} fill="none" stroke={COL.orange} strokeWidth={4} strokeLinejoin="round" />
      <text x={X0 + 90} y={Y0 + 2} fontSize={19} fontWeight={800} fill={COL.orange} stroke="white" strokeWidth={4} paintOrder="stroke">mélange chauffé</text>
      <text x={X0 + 100} y={Y1 - 44} fontSize={19} fontWeight={800} fill={COL.bleu} stroke="white" strokeWidth={4} paintOrder="stroke">mélange à 20&nbsp;°C</text>
      <text x={240} y={316} textAnchor="middle" fontSize={18} fill={COL.gris}>schéma qualitatif : pas de valeurs</text>
    </svg>);
}

// ============================================================================================
//  La plaque de CCM de comparaison (reprend les conventions de la simulation 197) : toutes les espèces sont incolores, révélées au diiode (taches brunes)
// ============================================================================================
const K = 4, Y_LIGNE = 320, Y_HAUT = 40, Y_BAS = 360, LW = 80;
export function PlaqueBananeSvg({ voies, eluant = 1, avance = 1, revele = true, regle = false, reperes = false, etiqLigne = false, front = true, aria }) {
  const nL = Math.max(3, voies.length), plateW = nL * LW + 16, rW = regle ? 54 : 14, vbW = rW + plateW + 14, PX = rW;
  const debut = PX + 8 + (nL - voies.length) * LW / 2, cx = i => debut + LW * (i + 0.5);
  const frontMm = avance * M.FRONT, yFront = Y_LIGNE - frontMm * K;
  const tachesVoie = v => M.taches(v.especes, eluant).map(g => ({ ...g, d: g.d * frontMm / M.FRONT }));
  const enPile = avance < 0.04, spots = [];
  voies.forEach((v, i) => {
    if (!revele) return;
    if (enPile) { spots.push({ k: `${i}p`, x: cx(i), y: Y_LIGNE }); return; }
    tachesVoie(v).forEach(g => spots.push({ k: `${i}-${g.especes.join('')}`, x: cx(i), y: Y_LIGNE - g.d * K }));
  });
  const lignesReperes = reperes && voies[0] && revele ? tachesVoie(voies[0]).map(g => Y_LIGNE - g.d * K) : [];
  const grad = [];
  if (regle) for (let mm = 0; mm <= 65; mm++) {
    const y = Y_LIGNE - mm * K, cm = mm % 10 === 0, demi = mm % 5 === 0;
    grad.push(<line key={mm} x1={48} x2={cm ? 33 : demi ? 39 : 44} y1={y} y2={y} stroke={COL.encre} strokeWidth={cm ? 1.6 : 1} />);
    if (cm) grad.push(<text key={`t${mm}`} x={17} y={y + 6.5} textAnchor="middle" fontSize="18" fill={COL.encre}>{mm / 10}</text>);
  }
  return (
    <svg viewBox={`0 0 ${vbW} 424`} style={stl(Math.round(420 * vbW / 424))} role="img" aria-label={aria || 'Une plaque de chromatographie sur couche mince.'}>
      {regle && <g><rect x={4} y={Y_HAUT} width={46} height={Y_LIGNE - Y_HAUT + 8} rx="4" fill="#f1f5f9" stroke={COL.clair} /><g>{grad}</g><text x={26} y={28} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.gris}>cm</text></g>}
      <rect x={PX} y={Y_HAUT} width={plateW} height={Y_BAS - Y_HAUT} rx="6" fill={revele && !enPile ? '#fef3c7' : '#ffffff'} stroke={COL.gris} strokeWidth="2.5" />
      {lignesReperes.map((y, i) => <line key={i} x1={PX + 4} x2={PX + plateW - 4} y1={y} y2={y} stroke={COL.orange} strokeWidth="1.6" strokeDasharray="5 4" />)}
      <line x1={PX + 8} x2={PX + plateW - 8} y1={Y_LIGNE} y2={Y_LIGNE} stroke="#6b7280" strokeWidth="2" />
      {voies.map((v, i) => <g key={`m${i}`} stroke="#6b7280" strokeWidth="1.6"><line x1={cx(i) - 5} x2={cx(i) + 5} y1={Y_LIGNE + 12} y2={Y_LIGNE + 22} /><line x1={cx(i) + 5} x2={cx(i) - 5} y1={Y_LIGNE + 12} y2={Y_LIGNE + 22} /></g>)}
      {etiqLigne && <text x={PX + 8} y={Y_LIGNE - 16} fontSize="18" fontWeight="700" fill={COL.gris}>ligne de dépôt (crayon)</text>}
      {spots.map(s => <ellipse key={s.k} cx={s.x} cy={s.y} rx={9} ry={7.5} fill="#7c2d12" opacity={0.88} />)}
      {front && avance > 0 && <g><line x1={PX + 4} x2={PX + plateW - 4} y1={yFront} y2={yFront} stroke={COL.gris} strokeWidth="2.5" strokeDasharray="8 5" /><text x={PX + plateW - 8} y={yFront - 7} textAnchor="end" fontSize="18" fontWeight="700" fill={COL.gris}>front</text></g>}
      {revele && <g><rect x={PX + plateW - 118} y={6} width={118} height={28} rx="8" fill="#92400e" /><text x={PX + plateW - 59} y={26} textAnchor="middle" fontSize="18" fontWeight="800" fill="white">diiode</text></g>}
      {voies.map((v, i) => <g key={`l${i}`} textAnchor="middle" fontSize="18" fill={COL.encre}><text x={cx(i)} y={387} fontWeight="500" fill={COL.gris}>{v.lib[0]}</text><text x={cx(i)} y={411} fontWeight="800">{v.lib[1]}</text></g>)}
    </svg>);
}

