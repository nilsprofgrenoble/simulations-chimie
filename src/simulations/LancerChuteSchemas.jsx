// Schémas de la simulation 251 (lancer vers le haut et chute) : scène du vol, graphique des énergies et cartes « À retenir ».
// Règles : police ≥ 14 dans un viewBox de 400 de large, tout le texte dans le viewBox ; aucune valeur de réponse dans la scène du parcours.
import { OBJETS, vol, energies } from './lancerChuteModele';
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', violet: '#6d28d9', ciel: '#dbeafe', sol: '#e7e5e4' };
const COUL_ANO = ['#0f766e', '#a21caf', '#a16207'];       // courbes anonymes du défi (a, b, c)
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 220, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Txt = ({ x, y, t, c = COL.encre, size = 15, w = 700, anchor = 'middle' }) => <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={w} fill={c} {...halo}>{t}</text>;
const Fleche = ({ x1, y1, x2, y2, c = COL.bleu, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9 + w * 0.8, d = 0.5;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - (L - 2) * Math.cos(a)} y2={y2 - (L - 2) * Math.sin(a)} stroke={c} strokeWidth={w}/><polygon points={p} fill={c}/></g>;
};
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');

// ═════════ Scène : la balle sur sa verticale, avec ses forces et sa vitesse ═════════
// z : altitude (m) ; zEch : altitude correspondant au haut du schéma ; v : vitesse signée (m/s, > 0 vers le haut) ; cote : texte de l'altitude ; hRef : trait de référence « sommet sans frottement »
export function SceneLancer({ z = 0, zEch = 5.1, v = 0, frott = false, cote = null, hRef = null, nomHRef = 'sommet sans frottement', forces = true }) {
  const SOL = 222, HAUT = 36, s = (SOL - HAUT) / Math.max(zEch, 0.5), y = zz => SOL - zz * s, by = y(z), X = 170;
  const dir = v > 0.05 ? -1 : v < -0.05 ? 1 : 0;                     // sens de la vitesse à l'écran (−1 : vers le haut)
  return (
    <Fond h={248} label={`Schéma : une balle lancée verticalement vers le haut, au-dessus du sol (z = 0)${dir < 0 ? ', en train de monter' : dir > 0 ? ', en train de descendre' : ''}. Le poids est vertical vers le bas${frott ? ' et la force de frottement de l’air est opposée au mouvement' : ''}.`}>
      <rect x="0" y={SOL} width="400" height="26" fill={COL.sol}/><line x1="0" y1={SOL} x2="400" y2={SOL} stroke={COL.gris} strokeWidth="3"/>
      <Txt x={392} y={SOL - 6} t="z = 0" c={COL.gris} size={14} w={600} anchor="end"/>
      <line x1={X} y1={SOL} x2={X} y2={HAUT - 8} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 7"/>
      {hRef != null && <g><line x1="30" y1={y(hRef)} x2="370" y2={y(hRef)} stroke={COL.violet} strokeWidth="2" strokeDasharray="7 6"/><Txt x={372} y={y(hRef) - 7} t={nomHRef} c={COL.violet} size={14} w={600} anchor="end"/></g>}
      {cote && z > 0.05 && <g><line x1="60" y1={SOL} x2="60" y2={by} stroke={COL.gris} strokeWidth="2"/><line x1="52" y1={by} x2="68" y2={by} stroke={COL.gris} strokeWidth="2"/><line x1="52" y1={SOL} x2="68" y2={SOL} stroke={COL.gris} strokeWidth="2"/><Txt x={74} y={(SOL + by) / 2 + 5} t={cote} c={COL.gris} size={15} anchor="start"/></g>}
      <circle cx={X} cy={by - 13} r="13" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
      {forces && <g>
        <Fleche x1={X} y1={by - 13} x2={X} y2={by - 13 + 40} c={COL.rouge} w={3.5}/><Txt x={X + 9} y={by - 13 + 22} t="P" c={COL.rouge} size={15} anchor="start"/>
        {frott && dir !== 0 && <g><Fleche x1={X - 16} y1={by - 13} x2={X - 16} y2={by - 13 - dir * 40} c={COL.orange} w={3.5}/><Txt x={X - 24} y={by - 13 - dir * 40 + (dir < 0 ? 16 : -6)} t="f" c={COL.orange} size={15} anchor="end"/></g>}
        {dir !== 0 && <g><Fleche x1={X + 34} y1={by - 13} x2={X + 34} y2={by - 13 + dir * 40} c={COL.vert} w={3.5}/><Txt x={X + 44} y={by - 13 + dir * 40 + (dir < 0 ? -2 : 14)} t="v" c={COL.vert} size={15} anchor="start"/></g>}
      </g>}
    </Fond>);
}

// ═════════ Graphique des trois énergies en fonction du temps ═════════
// pts : points du vol ; m : masse (kg) ; zRef : altitude de l'origine de Epp ; u : position du curseur (0–1) ou null ; ordre : ['Ec','Epp','Em'] mélangés pour des courbes anonymes (a, b, c) ; em0 : tracer l'énergie mécanique initiale en pointillé
export function GrapheEnergies({ pts, m, zRef = 0, u = null, ordre = null, em0 = false, T = null }) {
  const S = pts.map(p => energies(m, p.z, p.v, zRef)), serie = { Ec: S.map(e => e.Ec), Epp: S.map(e => e.Epp), Em: S.map(e => e.Em) };
  const tous = [...serie.Ec, ...serie.Epp, ...serie.Em, 0];
  const mx = Math.max(...tous), mn = Math.min(...tous), etendue = (mx - mn) || 1, haut = mx + 0.22 * etendue, bas = mn < -1e-9 ? mn - 0.08 * etendue : 0;
  const X0 = 52, X1 = 386, Y0 = 16, Y1 = 150, X = i => X0 + (X1 - X0) * i / (pts.length - 1), Y = e => Y1 - (Y1 - Y0) * (e - bas) / (haut - bas);
  const poly = a => a.map((e, i) => `${X(i).toFixed(1)},${Y(e).toFixed(1)}`).join(' ');
  const noms = { Ec: ['Ec', COL.bleu], Epp: ['Epp', COL.orange], Em: ['Em', COL.violet] };
  const tracer = ordre ? ordre.map((q, i) => ({ q, nom: 'abc'[i], c: COUL_ANO[i] })) : ['Ec', 'Epp', 'Em'].map(q => ({ q, nom: noms[q][0], c: noms[q][1] }));
  const k = u == null ? null : Math.round(u * (pts.length - 1));
  const Tt = T ?? pts[pts.length - 1].t;
  return (
    <svg viewBox="0 0 400 196" style={base} role="img" aria-label={ordre ? 'Graphique : trois courbes d’énergie, a, b et c, en fonction du temps pendant le vol.' : 'Graphique : énergie cinétique, énergie potentielle de pesanteur et énergie mécanique en fonction du temps pendant le vol.'}>
      <line x1={X0} y1={Y(0)} x2={X1} y2={Y(0)} stroke="#94a3b8" strokeWidth="1.5"/><line x1={X0} y1={Y0 - 4} x2={X0} y2={Y1 + 2} stroke="#94a3b8" strokeWidth="1.5"/>
      <text x={X0 - 5} y={Y(mx) + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>{fr(mx, mx < 10 ? 1 : 0)}</text><text x={X0 - 5} y={Y(0) + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>0</text>
      {bas < 0 && <text x={X0 - 5} y={Y(mn) + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>{fr(mn, Math.abs(mn) < 10 ? 1 : 0).replace('-', '−')}</text>}
      <text x="8" y="12" fontSize="13.5" fontWeight="700" fill={COL.gris}>J</text>
      <text x={X0} y="176" textAnchor="middle" fontSize="13.5" fill={COL.gris}>0</text><text x={X1} y="176" textAnchor="end" fontSize="13.5" fill={COL.gris}>{fr(Tt, 1)} s</text>
      <text x={(X0 + X1) / 2} y="192" textAnchor="middle" fontSize="13.5" fontWeight="600" fill={COL.gris}>temps</text>
      {em0 && <line x1={X0} y1={Y(serie.Em[0])} x2={X1} y2={Y(serie.Em[0])} stroke={COL.violet} strokeWidth="2" strokeDasharray="6 6" opacity="0.6"/>}
      {tracer.map(c => <polyline key={c.q} points={poly(serie[c.q])} fill="none" stroke={c.c} strokeWidth="3.5" strokeLinejoin="round"/>)}
      {ordre && <g>{tracer.map((c, i) => <g key={'l' + c.q}><line x1={X0 + 10 + 56 * i} y1={Y0 + 6} x2={X0 + 34 + 56 * i} y2={Y0 + 6} stroke={c.c} strokeWidth="4.5" strokeLinecap="round"/><text x={X0 + 42 + 56 * i} y={Y0 + 12} fontSize="16" fontWeight="800" fill={c.c}>{c.nom}</text></g>)}</g>}
      {k != null && tracer.map(c => <circle key={'p' + c.q} cx={X(k)} cy={Y(serie[c.q][k])} r="5.5" fill={c.c} stroke="white" strokeWidth="2"/>)}
      {k != null && <line x1={X(k)} y1={Y1} x2={X(k)} y2={Y1 + 4} stroke={COL.gris} strokeWidth="2"/>}
      {!ordre && <g><text x={X0 + 8} y={Y0 + 12} fontSize="14" fontWeight="700" fill={COL.bleu}>Ec</text><text x={X0 + 40} y={Y0 + 12} fontSize="14" fontWeight="700" fill={COL.orange}>Epp</text><text x={X0 + 84} y={Y0 + 12} fontSize="14" fontWeight="700" fill={COL.violet}>Em</text></g>}
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════
// Carte 1 : les trois énergies
export function SvgEnergies() {
  return (
    <Fond h={214} label="Schéma : l'énergie cinétique Ec vaut un demi m v au carré ; l'énergie potentielle de pesanteur Epp vaut m g z, à une constante près selon le choix de l'origine z = 0 ; l'énergie mécanique Em est la somme Ec + Epp. Exemple : 1,0 kg à 4 m/s a Ec = 8 J ; à 2 m d'altitude Epp vaut environ 20 J.">
      <rect x="10" y="12" width="184" height="86" rx="10" fill="#f0f9ff" stroke={COL.bleu} strokeWidth="2.5"/>
      <Txt x={102} y={38} t="Ec = ½ × m × v²" c={COL.bleu} size={16} w={800}/><Txt x={102} y={62} t="liée à la vitesse" c={COL.gris} size={14} w={600}/><Txt x={102} y={84} t="toujours ≥ 0" c={COL.gris} size={14} w={600}/>
      <rect x="206" y="12" width="184" height="86" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/>
      <Txt x={298} y={38} t="Epp = m × g × z" c={COL.orange} size={16} w={800}/><Txt x={298} y={62} t="liée à l’altitude" c={COL.gris} size={14} w={600}/><Txt x={298} y={84} t="à une constante près" c={COL.gris} size={14} w={600}/>
      <rect x="60" y="110" width="280" height="42" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={137} t="Em = Ec + Epp" c={COL.violet} size={17} w={800}/>
      <Txt x={200} y={176} t="ex. : 1,0 kg à 4 m/s : Ec = 8 J" c={COL.encre} size={14.5}/><Txt x={200} y={198} t="à z = 2 m : Epp ≈ 20 J (g = 9,8 N/kg)" c={COL.encre} size={14.5}/>
    </Fond>);
}
// Courbes schématiques (cartes 2 et 3) : tracé normalisé d'après le modèle
function CourbesCarte({ avec }) {
  const o = OBJETS[2], s = vol({ m: o.m, k: o.k, v0: 15, frott: avec, n: 60 }), S = s.pts.map(p => energies(o.m, p.z, p.v)), E0 = S[0].Em;
  const X = i => 50 + 330 * i / 60, Y = e => 150 - 110 * e / E0, poly = a => a.map((e, i) => `${X(i).toFixed(1)},${Y(e).toFixed(1)}`).join(' ');
  return <g>
    <line x1="50" y1={Y(0)} x2="384" y2={Y(0)} stroke="#94a3b8" strokeWidth="1.5"/><line x1="50" y1="30" x2="50" y2="154" stroke="#94a3b8" strokeWidth="1.5"/>
    {avec && <line x1="50" y1={Y(E0)} x2="384" y2={Y(E0)} stroke={COL.violet} strokeWidth="2" strokeDasharray="6 6" opacity="0.55"/>}
    <polyline points={poly(S.map(e => e.Ec))} fill="none" stroke={COL.bleu} strokeWidth="3.5"/><polyline points={poly(S.map(e => e.Epp))} fill="none" stroke={COL.orange} strokeWidth="3.5"/><polyline points={poly(S.map(e => e.Em))} fill="none" stroke={COL.violet} strokeWidth="3.5"/>
    <Txt x={216} y={176} t="temps (lancer → retour au sol)" c={COL.gris} size={14} w={600}/>
    <text x="60" y="24" fontSize="14" fontWeight="700" fill={COL.bleu}>Ec</text><text x="92" y="24" fontSize="14" fontWeight="700" fill={COL.orange}>Epp</text><text x="136" y="24" fontSize="14" fontWeight="700" fill={COL.violet}>Em</text>
  </g>;
}
// Carte 2 : sans frottement
export function SvgSans() {
  return (
    <Fond h={214} label="Schéma : sans frottement, l'énergie mécanique Em reste constante pendant le vol ; l'énergie cinétique diminue à la montée et l'énergie potentielle augmente, puis l'inverse à la descente.">
      <CourbesCarte avec={false}/>
      <Txt x={200} y={198} t="sans frottement : Em constante" c={COL.violet} size={16} w={800}/>
    </Fond>);
}
// Carte 3 : avec frottement
export function SvgAvec() {
  return (
    <Fond h={224} label="Schéma : avec frottement de l'air, l'énergie mécanique Em diminue au cours du vol ; au retour au point de lancement, l'énergie cinétique est plus petite qu'au départ. La variation de Em est égale au travail de la force de frottement.">
      <CourbesCarte avec/>
      <Txt x={200} y={198} t="avec frottement : Em diminue" c={COL.violet} size={16} w={800}/><Txt x={200} y={218} t="ΔEm = W(f) < 0 : énergie dissipée" c={COL.orange} size={15} w={700}/>
    </Fond>);
}
