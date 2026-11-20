// Scènes de la simulation 199 « Image réelle et grandissement avec une lentille convergente » (2GT).
// Tout est calculé par imageLentille2gtModele.js et imageLentille2gtGeometrie.js : ici on se contente de dessiner. Même échelle en longueur et en hauteur (1 carreau = 1 cm).
// Code visuel constant : rayon parallèle = bleu, rayon par O = orange, rayon par F = violet (flèche au milieu du trajet) ; objet = flèche noire pleine, image = flèche verte ;
// lentille = trait bleu avec pointes vers l'extérieur ; écran = trait épais gris ; tracés proposés = gris pointillés avec une lettre. Textes de 18 (viewBox 480) ou 14 (viewBox 300).
import { KIT } from "../commun";
import * as M from "./imageLentille2gtModele";
import * as G from "./imageLentille2gtGeometrie";

const stl = max => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 10 });
const halo = { paintOrder: 'stroke', stroke: 'white', strokeWidth: 4, strokeLinejoin: 'round' };
const tetePts = (mid, ang, t) => {
  const c = Math.cos(ang), s = Math.sin(ang), L = t * 0.62, W = t * 0.42;
  return `${mid[0] + c * L},${mid[1] + s * L} ${mid[0] - c * L - s * W},${mid[1] - s * L + c * W} ${mid[0] - c * L + s * W},${mid[1] - s * L - c * W}`;
};

// Une scène de lentille convergente. o : voir construireScene (d, f, h, rayons, candidats, image, ecran, cotes, deuxF, points).
export function SceneLentille({ o, mise = G.MISE_SCENE, label, max = 480, sous = null, apres = null, note = true, detail = false }) {
  const S = G.construireScene({ f: M.F_PARCOURS, h: M.H_OBJ, ...o }, mise), E = S.els, c = S.c, fs = mise.fs, carte = mise.w < 400;
  const P = (x, y) => G.px(mise, x, y);
  const nbTrait = mise.tr;
  return (
    <svg viewBox={`0 0 ${mise.w} ${mise.h}`} style={stl(max)} role="img" aria-label={label || (detail ? G.descriptionScene({ f: M.F_PARCOURS, h: M.H_OBJ, ...o }, c) : 'Schéma à l’échelle : une lentille convergente, un objet AB et des rayons lumineux.')}>
      {E.grille.map((g, i) => <line key={i} x1={g.a[0]} y1={g.a[1]} x2={g.b[0]} y2={g.b[1]} stroke="#e9eef4" strokeWidth="1" />)}
      {/* règle graduée en cm (échelle du schéma) */}
      {mise.regle && (
        <g>
          <line x1={P(-14, 0)[0]} y1={mise.ruleY} x2={P(14, 0)[0]} y2={mise.ruleY} stroke="#475569" strokeWidth="1.6" />
          {Array.from({ length: 29 }, (_, i) => i - 14).map(i => <line key={i} x1={P(i, 0)[0]} y1={mise.ruleY} x2={P(i, 0)[0]} y2={mise.ruleY + (i % 4 === 0 ? 11 : 6)} stroke="#475569" strokeWidth={i % 4 === 0 ? 1.8 : 1.2} />)}
          {[-12, -8, -4, 0, 4, 8, 12].map(i => <text key={i} x={P(i, 0)[0]} y={mise.ruleY + 31} textAnchor="middle" fontSize={fs} fontWeight="700" fill="#334155">{Math.abs(i)}</text>)}
          <text x={mise.w - 3} y={mise.ruleY + 31} textAnchor="end" fontSize={fs} fontWeight="700" fill="#334155">cm</text>
        </g>)}
      {carte && note && <text x={6} y={mise.h - 6} fontSize="12.5" fill="#475569" fontWeight="700">1 carreau = 1&nbsp;cm</text>}
      {/* axe optique */}
      <line x1={E.axe[0][0]} y1={E.axe[0][1]} x2={E.axe[1][0]} y2={E.axe[1][1]} stroke={M.COUL.axe} strokeWidth="1.6" />
      {sous && sous(P)}
      {/* écran */}
      {E.ecran && <line x1={E.ecran.a[0]} y1={E.ecran.a[1]} x2={E.ecran.b[0]} y2={E.ecran.b[1]} stroke={M.COUL.ecran} strokeWidth="7" strokeLinecap="butt" />}
      {/* lentille : trait vertical, pointes vers l'extérieur */}
      <line x1={E.lentille.a[0]} y1={E.lentille.a[1]} x2={E.lentille.b[0]} y2={E.lentille.b[1]} stroke={M.COUL.lentille} strokeWidth="3.5" />
      {E.lentille.pointes.map((pts, i) => <polygon key={i} points={pts.map(p => p.join(',')).join(' ')} fill={M.COUL.lentille} />)}
      {/* tracés proposés (gris, pointillés) */}
      {E.candidats.map(cd => <line key={cd.lettre} x1={cd.a[0]} y1={cd.a[1]} x2={cd.b[0]} y2={cd.b[1]} stroke="#6b7280" strokeWidth="2.4" strokeDasharray="7 5" />)}
      {/* rayons : trait plein, flèche au milieu de chaque trajet */}
      {E.rayons.map((r, i) => <line key={i} x1={r.a[0]} y1={r.a[1]} x2={r.b[0]} y2={r.b[1]} stroke={r.col} strokeWidth={nbTrait} strokeLinecap="round" />)}
      {E.rayons.map((r, i) => <polygon key={`f${i}`} points={tetePts(r.mid, r.ang, mise.tete + 2)} fill={r.col} />)}
      {/* objet et image : flèches pleines */}
      <line x1={E.objet.a[0]} y1={E.objet.a[1]} x2={E.objet.b[0]} y2={E.objet.b[1] + 2} stroke={M.COUL.objet} strokeWidth={mise.trObj} />
      <polygon points={E.objet.tete.map(p => p.join(',')).join(' ')} fill={M.COUL.objet} />
      {E.imageFl && <g><line x1={E.imageFl.a[0]} y1={E.imageFl.a[1]} x2={E.imageFl.b[0]} y2={E.imageFl.b[1]} stroke={M.COUL.image} strokeWidth={mise.trObj} /><polygon points={E.imageFl.tete.map(p => p.join(',')).join(' ')} fill={M.COUL.image} /></g>}
      {/* foyers */}
      {E.points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.petit ? 3 : 4.6} fill={p.plein ? M.COUL.foyer : 'white'} stroke={M.COUL.foyer} strokeWidth="2" />)}
      {/* cotes */}
      {E.cotes.map((k, i) => (
        <g key={i} stroke={k.col} fill="none" strokeWidth="1.6">
          <line x1={k.guideA[0]} y1={k.guideA[1]} x2={k.a[0]} y2={k.a[1]} strokeDasharray="3 3" strokeWidth="1" />
          <line x1={k.guideB[0]} y1={k.guideB[1]} x2={k.b[0]} y2={k.b[1]} strokeDasharray="3 3" strokeWidth="1" />
          <line x1={k.a[0]} y1={k.a[1]} x2={k.b[0]} y2={k.b[1]} />
          <polygon fill={k.col} stroke="none" points={tetePts([k.a[0], k.a[1]], Math.atan2(k.a[1] - k.b[1], k.a[0] - k.b[0]), 12)} />
          <polygon fill={k.col} stroke="none" points={tetePts([k.b[0], k.b[1]], Math.atan2(k.b[1] - k.a[1], k.b[0] - k.a[0]), 12)} />
        </g>))}
      {/* lettres des tracés proposés */}
      {E.lettres.map(l => (
        <g key={l.lettre}><circle cx={l.x} cy={l.y} r={10} fill="white" stroke="#4b5563" strokeWidth="2" />
          <text x={l.x} y={l.y + fs * 0.3} textAnchor="middle" fontSize={fs - 1} fontWeight="800" fill="#374151">{l.lettre}</text></g>))}
      {apres && apres(P)}
      {/* étiquettes */}
      {S.etiquettes.filter(e => e.lien).map((e, i) => <line key={`l${i}`} x1={e.lien.x1} y1={e.lien.y1} x2={e.lien.x2} y2={e.lien.y2} stroke={e.fill} strokeWidth="1.2" />)}
      {S.etiquettes.map((e, i) => <text key={i} x={e.x} y={e.y} textAnchor={e.anchor} fontSize={fs} fontWeight="700" fill={e.fill} style={halo}>{e.txt}</text>)}
    </svg>);
}

// Deux triangles semblables de part et d'autre de la lentille (Thalès) : OAB (gris) et OA′B′ (vert), de sommet commun O ; à passer à la prop `sous` de SceneLentille
// eslint-disable-next-line react-refresh/only-export-components
export const sousTriangles = c => P => {
  const O = P(0, 0), A = P(-c.d, 0), B = P(-c.d, c.h), Ai = P(c.image.OAp, 0), Bi = P(c.image.OAp, c.image.B[1]);
  return (<g><polygon points={`${O} ${A} ${B}`} fill="#e2e8f0" stroke="none" /><polygon points={`${O} ${Ai} ${Bi}`} fill="#bbf7d0" stroke="none" /></g>);
};

// Légende des couleurs (HTML) : on n'affiche que les rayons déjà introduits
const CHIP = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: KIT.txt, marginRight: 12, marginTop: 4 };
export function LegendeRayons({ rayons = [], objet = true, image = false, candidats = false }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: 6, lineHeight: 1.3 }}>
      {objet && <span style={CHIP}><svg width="26" height="12" aria-hidden="true"><line x1="2" y1="6" x2="20" y2="6" stroke={M.COUL.objet} strokeWidth="4" /><polygon points="25,6 18,1 18,11" fill={M.COUL.objet} /></svg>objet AB</span>}
      {rayons.map(id => <span key={id} style={CHIP}><svg width="26" height="12" aria-hidden="true"><line x1="1" y1="6" x2="25" y2="6" stroke={M.COULEUR_RAYON[id]} strokeWidth="3.2" strokeLinecap="round" /></svg>{M.NOM_RAYON[id]}</span>)}
      {image && <span style={CHIP}><svg width="26" height="12" aria-hidden="true"><line x1="2" y1="6" x2="20" y2="6" stroke={M.COUL.image} strokeWidth="4" /><polygon points="25,6 18,1 18,11" fill={M.COUL.image} /></svg>image A′B′</span>}
      {candidats && <span style={CHIP}><svg width="26" height="12" aria-hidden="true"><line x1="1" y1="6" x2="25" y2="6" stroke="#6b7280" strokeWidth="2.4" strokeDasharray="6 4" /></svg>tracés proposés (a, b, c, d)</span>}
    </div>);
}
export const NoteEchelle = () => <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.4 }}>Schéma à l’échelle : 1 carreau = 1&nbsp;cm, en longueur comme en hauteur ; la règle du bas donne la distance à la lentille.</div>;

// Tableau des constructions (étape « objet de plus en plus loin ») : valeurs calculées par le modèle, arrondies à 2 chiffres significatifs
const cell = { padding: '6px 8px', borderBottom: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 14.5 };
export function TableauConstructions() {
  const arr = (x) => M.nombreFR(M.arrondiSig(x, 2), x >= 10 ? 0 : x >= 1 ? 1 : 2);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 480, margin: '0 auto', background: 'white' }}>
        <thead><tr style={{ background: '#e0f2fe' }}>
          {['Objet à OA', 'Image à OA′', 'Hauteur A′B′', 'Grandissement'].map(t => <th key={t} style={{ ...cell, fontWeight: 800, color: KIT.txt, fontSize: 13.5 }}>{t}</th>)}
        </tr></thead>
        <tbody>
          {M.LIGNES_TABLE.map(d => { const l = M.ligneTable(d); return (
            <tr key={d}><td style={{ ...cell, fontWeight: 700 }}>{d}{M.NB}cm</td><td style={cell}>{arr(l.OAp)}{M.NB}cm</td><td style={cell}>{arr(l.hImg)}{M.NB}cm</td><td style={cell}>{arr(l.gamma)}</td></tr>); })}
        </tbody>
      </table>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.4 }}>Valeurs obtenues par la simulation en traçant les rayons, pour une lentille de distance focale {M.F_PARCOURS}{M.NB}cm et un objet AB de {M.cmFR(M.H_OBJ)}.</div>
    </div>);
}

// Schéma du défi « calculer » : NON À L'ÉCHELLE (annoncé sur le schéma), l'image n'est pas dessinée
export function SceneBancDefi({ AB, OA, OAp }) {
  const y0 = 120, xL = 220, xObj = 56, xEc = 424;
  const fl = (x1, x2, y, col, t) => (
    <g stroke={col} fill="none" strokeWidth="1.8"><line x1={x1} y1={y} x2={x2} y2={y} />
      <polygon fill={col} stroke="none" points={`${x1},${y} ${x1 + 10},${y - 5} ${x1 + 10},${y + 5}`} /><polygon fill={col} stroke="none" points={`${x2},${y} ${x2 - 10},${y - 5} ${x2 - 10},${y + 5}`} />
      <text x={(x1 + x2) / 2} y={y + 24} textAnchor="middle" fontSize="20" fontWeight="700" fill={col} stroke="none">{t}</text></g>);
  return (
    <svg viewBox="0 0 480 220" style={stl(480)} role="img" aria-label={`Schéma non à l’échelle : un objet AB de ${M.cmFR(AB)} à ${M.cmFR(OA, 0)} d’une lentille convergente ; un écran à ${M.cmFR(OAp, 0)} derrière la lentille, sur lequel se forme l’image A′B′ dont on cherche la hauteur.`}>
      <line x1="10" y1={y0} x2="470" y2={y0} stroke={M.COUL.axe} strokeWidth="1.6" />
      <line x1={xL} y1={y0 - 82} x2={xL} y2={y0 + 82} stroke={M.COUL.lentille} strokeWidth="3.5" />
      <polygon points={`${xL},${y0 - 92} ${xL - 6},${y0 - 80} ${xL + 6},${y0 - 80}`} fill={M.COUL.lentille} /><polygon points={`${xL},${y0 + 92} ${xL - 6},${y0 + 80} ${xL + 6},${y0 + 80}`} fill={M.COUL.lentille} />
      <line x1={xObj} y1={y0} x2={xObj} y2={y0 - 62} stroke={M.COUL.objet} strokeWidth="4.5" /><polygon points={`${xObj},${y0 - 70} ${xObj - 6},${y0 - 58} ${xObj + 6},${y0 - 58}`} fill={M.COUL.objet} />
      <line x1={xEc} y1={y0 - 70} x2={xEc} y2={y0 + 70} stroke={M.COUL.ecran} strokeWidth="7" />
      <text x={xObj - 6} y={y0 - 68} textAnchor="end" fontSize="20" fontWeight="700" fill={M.COUL.objet} style={halo}>B</text>
      <text x={xObj - 6} y={y0 + 20} textAnchor="end" fontSize="20" fontWeight="700" fill={M.COUL.objet} style={halo}>A</text>
      <text x={xL - 8} y={y0 - 8} textAnchor="end" fontSize="20" fontWeight="700" fill="#0f172a" style={halo}>O</text>
      <text x={xEc} y={y0 - 76} textAnchor="middle" fontSize="20" fontWeight="700" fill="#475569" style={halo}>écran</text>
      <text x={xEc + 10} y={y0 + 22} textAnchor="start" fontSize="20" fontWeight="700" fill={M.COUL.image} style={halo}>A′</text>
      <text x={xObj + 8} y={y0 - 34} fontSize="20" fontWeight="700" fill={M.COUL.objet} style={halo}>AB = {M.cmFR(AB)}</text>
      <text x={xEc - 8} y={y0 - 36} textAnchor="end" fontSize="20" fontWeight="700" fill={M.COUL.image} style={halo}>A′B′ = ?</text>
      {fl(xObj, xL, 178, '#334155', `OA = ${M.cmFR(OA, 0)}`)}
      {fl(xL, xEc, 178, M.COUL.image, `OA′ = ${M.cmFR(OAp, 0)}`)}
      <text x="240" y="16" textAnchor="middle" fontSize="20" fontWeight="700" fill="#475569">schéma non à l’échelle</text>
    </svg>);
}
