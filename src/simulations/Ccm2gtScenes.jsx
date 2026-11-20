// Scènes de la simulation 197 « Chromatographie sur couche mince : identifier et comparer » (2GT).
// Schémas SVG : viewBox de 560 de large, textes de 16 à 20 (≥ 11 px rendus à 390 px), plafonnés à maxWidth 480 ; couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège.
// Les plaques sont dessinées à l'échelle : 1 cm = 40 unités ; la ligne de dépôt est à 1 cm du bas ; le front atteint 6,0 cm au maximum.
import { KIT } from "../commun";
import * as M from "./ccm2gtModele";

export const COL = { bleu: '#0b4f94', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', clair: '#94a3b8', uv: '#6d28d9' };
const stl = (max = 480) => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 10 });
const K = 4;                 // unités par millimètre
const Y_LIGNE = 320, Y_HAUT = 40, Y_BAS = 360;   // ordonnées (dans le repère de la plaque) de la ligne de dépôt, du haut et du bas de la plaque
const LW = 78;               // largeur d'une voie

// ---------- une plaque, vue de face ----------
// voies : voir M.voies ; avance : 0 à 1 (part du trajet maximal parcouru par le front) ; uv : lampe UV allumée ; erreur : 'aucune' | 'bas' | 'concentre' | 'depasse'
export function PlaqueSvg({ voies, eluant = 1, avance = 1, uv = false, erreur = 'aucune', regle = false, reperes = false, etiqLigne = false, etiqFront = true, front = true, cible = false, mouille = false, aria }) {
  const nL = Math.max(3, voies.length), plateW = nL * LW + 16, rW = regle ? 60 : 14, vbW = rW + plateW + 14, PX = rW;     // PX : abscisse du bord gauche de la plaque
  const debut = PX + 8 + (nL - voies.length) * LW / 2;
  const cx = i => debut + LW * (i + 0.5);
  const Ltot = erreur === 'depasse' ? 70 : M.FRONT, frontMm = avance * Ltot, yFront = Y_LIGNE - frontMm * K;
  const colSpot = e => (M.ESPECES[e].visible === 'uv' ? (uv ? '#1e293b' : null) : M.ESPECES[e].couleur);
  const tachesVoie = v => M.taches(v.especes, eluant).map(g => ({ ...g, d: g.d * frontMm / M.FRONT }));
  const enPile = avance < 0.04;
  const spots = [];
  voies.forEach((v, i) => {
    if (erreur === 'bas') return;
    const x = cx(i);
    if (enPile) { v.especes.forEach(e => { const c = colSpot(e); if (c) spots.push({ k: `${i}${e}`, x, y: Y_LIGNE, c, big: false, tail: 0 }); }); return; }
    tachesVoie(v).forEach(g => {
      const c = colSpot(g.especes[0]); if (!c) return;
      spots.push({ k: `${i}-${g.especes.join('')}`, x, y: Y_LIGNE - g.d * K, c, big: erreur === 'concentre', tail: erreur === 'concentre' ? 30 + g.d * 0.2 : 0 });
    });
  });
  const lignesReperes = [];
  if (reperes && voies[0]) tachesVoie(voies[0]).forEach(g => { const c = colSpot(g.especes[0]); if (c) lignesReperes.push({ y: Y_LIGNE - g.d * K, c: M.ESPECES[g.especes[0]].visible === 'uv' ? COL.uv : c }); });
  const graduations = [];
  if (regle) for (let mm = 0; mm <= 70; mm++) {
    const y = Y_LIGNE - mm * K, cm = mm % 10 === 0, demi = mm % 5 === 0;
    graduations.push(<line key={mm} x1={48} x2={cm ? 33 : demi ? 39 : 44} y1={y} y2={y} stroke={COL.encre} strokeWidth={cm ? 1.6 : 1} />);
    if (cm) graduations.push(<text key={`t${mm}`} x={17} y={y + 6.5} textAnchor="middle" fontSize="18" fill={COL.encre}>{mm / 10}</text>);
  }
  return (
    <svg viewBox={`0 0 ${vbW} 424`} style={stl(Math.round(420 * vbW / 424))} role="img" aria-label={aria || 'Une plaque de chromatographie sur couche mince.'}>
      {regle && <g><rect x={4} y={Y_HAUT} width={46} height={Y_LIGNE - Y_HAUT + 8} rx="4" fill="#f1f5f9" stroke={COL.clair} /><g>{graduations}</g><text x={26} y={28} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.gris}>cm</text></g>}
      <rect x={PX} y={Y_HAUT} width={plateW} height={Y_BAS - Y_HAUT} rx="6" fill={uv ? '#bbf7d0' : '#ffffff'} stroke={COL.gris} strokeWidth="2.5" />
      {erreur === 'bas' && <g><rect x={PX + 2} y={Y_LIGNE - 24} width={plateW - 4} height={Y_BAS - Y_LIGNE + 22} fill="#93c5fd" opacity="0.55" /><line x1={PX + 2} x2={PX + plateW - 2} y1={Y_LIGNE - 24} y2={Y_LIGNE - 24} stroke={COL.bleu} strokeWidth="2.5" />
        <text x={PX + plateW - 8} y={Y_LIGNE - 30} textAnchor="end" fontSize="18" fontWeight="700" fill={COL.bleu}>niveau de l’éluant</text></g>}
      {mouille && avance > 0 && <rect x={PX + 2} y={yFront} width={plateW - 4} height={Y_BAS - yFront - 2} fill="#bfdbfe" opacity="0.6" />}
      {lignesReperes.map((l, i) => <line key={i} x1={PX + 4} x2={PX + plateW - 4} y1={l.y} y2={l.y} stroke={l.c} strokeWidth="1.6" strokeDasharray="5 4" opacity="0.9" />)}
      <line x1={PX + 8} x2={PX + plateW - 8} y1={Y_LIGNE} y2={Y_LIGNE} stroke="#6b7280" strokeWidth="2" />
      {voies.map((v, i) => <g key={`m${i}`} stroke="#6b7280" strokeWidth="1.6"><line x1={cx(i) - 5} x2={cx(i) + 5} y1={Y_LIGNE + 12} y2={Y_LIGNE + 22} /><line x1={cx(i) + 5} x2={cx(i) - 5} y1={Y_LIGNE + 12} y2={Y_LIGNE + 22} /></g>)}
      {etiqLigne && <text x={PX + 8} y={Y_LIGNE - 16} fontSize="18" fontWeight="700" fill={COL.gris}>ligne de dépôt (crayon)</text>}
      {cible && <g><line x1={PX + 4} x2={PX + plateW - 4} y1={Y_LIGNE - M.FRONT * K} y2={Y_LIGNE - M.FRONT * K} stroke={COL.orange} strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" />
        <text x={PX + 8} y={Y_LIGNE - M.FRONT * K - 8} fontSize="18" fontWeight="700" fill={COL.orange}>limite à atteindre</text></g>}
      {spots.map(s => <g key={s.k}>
        {s.tail > 0 && <ellipse cx={s.x} cy={s.y + 14} rx={11} ry={s.tail / 2 + 8} fill={s.c} opacity="0.4" />}
        <ellipse cx={s.x} cy={s.y} rx={s.big ? 14 : 8} ry={s.big ? 12 : 7} fill={s.c} opacity={s.big ? 0.85 : 0.92} /></g>)}
      {front && avance > 0 && <g><line x1={PX + 4} x2={PX + plateW - 4} y1={yFront} y2={yFront} stroke={erreur === 'depasse' ? COL.rouge : COL.gris} strokeWidth="2.5" strokeDasharray="8 5" />
        {etiqFront && <text x={PX + plateW - 8} y={erreur === 'depasse' ? yFront + 24 : yFront - 7} textAnchor="end" fontSize="18" fontWeight="700" fill={erreur === 'depasse' ? COL.rouge : COL.gris}>{erreur === 'depasse' ? 'front sorti de la plaque' : 'front'}</text>}</g>}
      {uv && <g><rect x={PX + plateW - 96} y={6} width={96} height={28} rx="8" fill={COL.uv} /><text x={PX + plateW - 48} y={26} textAnchor="middle" fontSize="18" fontWeight="800" fill="white">lampe UV</text></g>}
      {voies.map((v, i) => <g key={`l${i}`} textAnchor="middle" fontSize="18" fill={COL.encre}><text x={cx(i)} y={387} fontWeight="600" fill={COL.gris}>{v.lib[0]}</text><text x={cx(i)} y={411} fontWeight="800">{v.lib[1]}</text></g>)}
    </svg>);
}

// ---------- la cuve de chromatographie, vue de côté ----------
// phase : 'avant' (la plaque vient d'être posée) ou 'apres' (l'éluant est monté, les taches sont séparées) ; especes : espèces de la voie dessinée
// etiq : { couvercle, cuve, eluant, plaque, ligne, front, tache } → 'txt' (légende écrite) ou un nombre (pastille numérotée)
const ANCRES = {
  couvercle: { cote: 'd', ax: 372, ay: 93, ly: 80, lignes: ['couvercle'] },
  cuve: { cote: 'd', ax: 372, ay: 150, ly: 150, lignes: ['cuve'] },
  eluant: { cote: 'd', ax: 372, ay: 312, ly: 312, lignes: ['éluant'] },
  plaque: { cote: 'g', ax: 250, ay: 196, ly: 196, lignes: ['plaque', 'de silice'] },
  ligne: { cote: 'g', ax: 250, ay: 262, ly: 262, lignes: ['ligne de', 'dépôt'] },
  front: { cote: 'g', ax: 250, ay: 130, ly: 128, lignes: ['front de', 'l’éluant'] },
  tache: { cote: 'd', ax: 292, ay: null, ly: null, lignes: ['tache'] },
};
export function SceneCuve({ phase = 'avant', especes = ['jaune', 'bleu'], etiq = {}, eluant = 1 }) {
  const yL = 262, yF = 130, yNiv = 285;
  const taches = phase === 'apres' ? M.taches(especes, eluant).map(g => ({ y: yL - (g.d / M.FRONT) * (yL - yF), c: M.ESPECES[g.especes[0]].couleur })) : [];
  const yTache = taches.length ? taches[0].y : 180;
  const pos = id => (id === 'tache' ? { ...ANCRES.tache, ay: yTache, ly: yTache } : ANCRES[id]);
  return (
    <svg viewBox="0 0 510 360" style={stl(430)} role="img" aria-label="Une cuve de chromatographie fermée par un couvercle, avec un peu d’éluant au fond et une plaque de silice posée debout dans la cuve. Un trait de crayon, la ligne de dépôt, est tracé au-dessus du niveau de l’éluant.">
      <rect x={190} y={100} width={180} height={230} rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="3" />
      <rect x={192} y={yNiv} width={176} height={43} fill="#93c5fd" opacity="0.75" />
      <rect x={182} y={84} width={196} height={18} rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="2.5" /><rect x={270} y={72} width={20} height={14} rx="3" fill="#94a3b8" />
      <rect x={250} y={112} width={60} height={210} rx="3" fill="white" stroke={COL.gris} strokeWidth="2.5" />
      {phase === 'apres' && <rect x={252} y={yF} width={56} height={yNiv - yF + 35} fill="#bfdbfe" opacity="0.7" />}
      <line x1={253} x2={307} y1={yL} y2={yL} stroke="#6b7280" strokeWidth="2.5" />
      {phase === 'avant' && <ellipse cx={280} cy={yL} rx={8} ry={6} fill={M.ESPECES[especes[0]].couleur} />}
      {phase === 'apres' && <line x1={253} x2={307} y1={yF} y2={yF} stroke={COL.gris} strokeWidth="2.5" strokeDasharray="7 4" />}
      {taches.map((t, i) => <ellipse key={i} cx={280} cy={t.y} rx={8} ry={6.5} fill={t.c} />)}
      {Object.entries(etiq).map(([id, mode]) => {
        const a = pos(id), g = a.cote === 'g', xe = g ? 170 : 400, pin = mode !== 'txt';
        return (
          <g key={id}>
            <line x1={g ? xe + 4 : xe - 4} y1={a.ly} x2={a.ax} y2={a.ay} stroke={COL.orange} strokeWidth="2" />
            <circle cx={a.ax} cy={a.ay} r="4.5" fill={COL.orange} />
            {pin
              ? <g><circle cx={g ? xe - 14 : xe + 14} cy={a.ly} r="16" fill={COL.orange} /><text x={g ? xe - 14 : xe + 14} y={a.ly + 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="white">{mode}</text></g>
              : a.lignes.map((t, i) => <text key={i} x={g ? xe - 4 : xe + 4} y={a.ly + (i - (a.lignes.length - 1) / 2) * 25 + 8} textAnchor={g ? 'end' : 'start'} fontSize="22" fontWeight="800" fill={COL.encre}>{t}</text>)}
          </g>);
      })}
    </svg>);
}
export const IDS_ETIQ = ['couvercle', 'cuve', 'eluant', 'plaque', 'ligne', 'front', 'tache'];
export const LIBELLES_ETIQ = { couvercle: 'le couvercle', cuve: 'la cuve', eluant: 'l’éluant', plaque: 'la plaque de silice', ligne: 'la ligne de dépôt', front: 'le front de l’éluant', tache: 'une tache' };

// ---------- étape 1 : un bonbon vert contient deux colorants ----------
export function SceneUtile() {
  const pt = (x, y, c, r = 8) => <ellipse cx={x} cy={y} rx={r} ry={r * 0.85} fill={c} />;
  return (
    <svg viewBox="0 0 480 270" style={stl(440)} role="img" aria-label="À gauche, un bonbon enrobé vert. Une flèche indique qu’on en dépose une goutte de colorant sur une plaque. À droite, la plaque après la migration : le colorant s’est séparé en deux taches, une jaune en haut et une bleue en bas.">
      <circle cx={80} cy={120} r={50} fill="#22c55e" stroke="#15803d" strokeWidth="4" /><path d="M50 98q14-22 38-20" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <text x={80} y={206} textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.encre}>un bonbon vert</text>
      <text x={80} y={232} textAnchor="middle" fontSize="19" fill={COL.gris}>un seul colorant ?</text>
      <line x1={146} x2={200} y1={120} y2={120} stroke={COL.orange} strokeWidth="6" /><polygon points="214,120 198,109 198,131" fill={COL.orange} />
      <text x={178} y={98} textAnchor="middle" fontSize="22" fontWeight="800" fill={COL.orange}>CCM</text>
      <rect x={232} y={14} width={116} height={190} rx="8" fill="white" stroke={COL.gris} strokeWidth="3" />
      <line x1={240} x2={340} y1={172} y2={172} stroke="#6b7280" strokeWidth="2" />
      {pt(290, 80, '#facc15', 11)}{pt(290, 134, '#2563eb', 11)}
      <text x={358} y={86} fontSize="22" fontWeight="800" fill={COL.encre}>jaune</text><text x={358} y={140} fontSize="22" fontWeight="800" fill={COL.encre}>bleu</text>
      <text x={290} y={236} textAnchor="middle" fontSize="19" fill={COL.gris}>la plaque après la CCM</text>
    </svg>);
}

// ---------- étape 12 : trois plaques ratées ----------
export function SceneErreurs({ ordre = ['concentre', 'bas', 'depasse'] }) {
  const lettres = ['A', 'B', 'C'];
  const plaque = (id, x) => {
    const w = 130, yH = 50, yB = 250, yLg = 218;
    return (
      <g key={id} transform={`translate(${x} 0)`}>
        <rect x={0} y={yH} width={w} height={yB - yH} rx="5" fill="white" stroke={COL.gris} strokeWidth="2.5" />
        <line x1={10} x2={w - 10} y1={yLg} y2={yLg} stroke="#6b7280" strokeWidth="2" />
        {id === 'concentre' && <g><ellipse cx={42} cy={yLg - 52} rx={20} ry={36} fill="#dc2626" opacity="0.4" /><ellipse cx={42} cy={yLg - 70} rx={17} ry={15} fill="#dc2626" opacity="0.85" />
          <ellipse cx={86} cy={yLg - 98} rx={18} ry={32} fill="#2563eb" opacity="0.4" /><ellipse cx={86} cy={yLg - 112} rx={16} ry={14} fill="#2563eb" opacity="0.85" /><ellipse cx={64} cy={yLg - 150} rx={14} ry={13} fill="#facc15" opacity="0.9" />
          <line x1={10} x2={w - 10} y1={yH + 26} y2={yH + 26} stroke={COL.gris} strokeWidth="2.5" strokeDasharray="7 4" /></g>}
        {id === 'bas' && <g><rect x={2} y={yLg - 26} width={w - 4} height={yB - yLg + 24} fill="#93c5fd" opacity="0.6" /><line x1={2} x2={w - 2} y1={yLg - 26} y2={yLg - 26} stroke={COL.bleu} strokeWidth="2.5" />
          <line x1={10} x2={w - 10} y1={yH + 26} y2={yH + 26} stroke={COL.gris} strokeWidth="2.5" strokeDasharray="7 4" /></g>}
        {id === 'depasse' && <g><ellipse cx={34} cy={yH + 40} rx={9} ry={8} fill="#2563eb" /><ellipse cx={64} cy={yH + 70} rx={9} ry={8} fill="#dc2626" /><ellipse cx={94} cy={yH + 100} rx={9} ry={8} fill="#facc15" />
          <line x1={2} x2={w - 2} y1={yH + 1} y2={yH + 1} stroke={COL.rouge} strokeWidth="3" strokeDasharray="6 4" /></g>}
        <text x={w / 2} y={286} textAnchor="middle" fontSize="26" fontWeight="800" fill={COL.encre}>{lettres[ordre.indexOf(id)]}</text>
      </g>);
  };
  return (
    <svg viewBox="0 0 560 300" style={stl()} role="img" aria-label="Trois plaques de chromatographie ratées, A, B et C. Plaque A : des taches très grosses et allongées qui se touchent. Plaque B : aucune tache, le bas de la plaque est bleu. Plaque C : des taches nettes, mais le front de l’éluant est arrivé tout en haut de la plaque.">
      {ordre.map((id, i) => plaque(id, 30 + i * 180))}
    </svg>);
}

// ---------- étape 12 (carte) et bilan : même schéma de la carte, utilitaires ----------
export const Pastille = ({ n }) => <span style={{ display: 'inline-block', minWidth: 26, height: 26, lineHeight: '26px', borderRadius: 13, background: COL.orange, color: 'white', fontWeight: 800, textAlign: 'center', marginRight: 6, fontSize: 15 }}>{n}</span>;
export const styleChamp = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
