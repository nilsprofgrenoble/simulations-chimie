// Schémas de la simulation 243 (formes d'énergie stockée) : scène « situation + colonne d'énergie » et cartes « À retenir ».
// Règles : police ≥ 15 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans les aria-label des scènes du parcours.
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', violet: '#6d28d9', ciel: '#dbeafe' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 200, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Txt = ({ x, y, t, c = COL.encre, size = 16, w = 700, anchor = 'middle' }) => <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={w} fill={c} {...halo}>{t}</text>;
const Fleche = ({ x1, y1, x2, y2, c = COL.bleu, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9 + w * 0.8, d = 0.5;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - (L - 2) * Math.cos(a)} y2={y2 - (L - 2) * Math.sin(a)} stroke={c} strokeWidth={w}/><polygon points={p} fill={c}/></g>;
};
const f1 = v => Number(v).toFixed(1).replace('.', ',');
const BOITE = (x, y, w, h, c, fill = 'white') => <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} stroke={c} strokeWidth="2.5"/>;

// ═════════ Scène : situation (à gauche) + colonne d'énergie empilée Ec / Ep / ΔU (à droite).
// e = état (formesModele.etat) ; bars = afficher la colonne ; vals = afficher les valeurs ═════════
export function SceneFormes({ sit, p, e, m, H, v0, bars = false, vals = false, ligne = "énergie totale au départ" }) {
  const sol = 150, emax = e.Etot0;
  const hcol = 120, y0 = 160, hh = v => hcol * Math.max(0, v) / emax;
  const segs = [['U', e.dU, COL.rouge], ['Ep', e.Ep, COL.orange], ['Ec', e.Ec, COL.bleu]];
  let acc = 0;
  const rects = segs.map(([n, v, c]) => { const h = hh(v), y = y0 - acc - h; acc += h; return <rect key={n} x={262} y={y} width={46} height={h} fill={c}/>; });
  const lignes = [['Ec', e.Ec, COL.bleu], ['Ep', e.Ep, COL.orange], ['ΔU', e.dU, COL.rouge]];
  const label = { chute: 'Schéma : une bille tombe verticalement vers le sol.', glisse: 'Schéma : un bloc glisse sur un sol horizontal en ralentissant.', chauffe: 'Schéma : une cuve d’eau immobile est chauffée par en dessous.' }[sit];
  return (
    <svg viewBox="0 0 400 196" style={base} role="img" aria-label={label + (bars ? ' À droite, une colonne montre la répartition de l’énergie en énergie cinétique, potentielle et interne.' : '')}>
      {sit === 'chute' && <g>
        <line x1="20" y1={sol} x2="190" y2={sol} stroke={COL.gris} strokeWidth="4"/>
        <line x1="40" y1="30" x2="40" y2={sol} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4"/>
        {[0, 1].map(i => <line key={i} x1="34" y1={30 + i * (sol - 30)} x2="46" y2={30 + i * (sol - 30)} stroke="#94a3b8" strokeWidth="2"/>)}
        <circle cx="100" cy={sol - 12 - (sol - 42) * (e.h / H)} r="12" fill={COL.bleu} stroke={COL.encre} strokeWidth="2"/>
        {e.v > 0.05 && <Fleche x1={100} y1={sol - 12 - (sol - 42) * (e.h / H) + 16} x2={100} y2={sol - 12 - (sol - 42) * (e.h / H) + 16 + 8 + 36 * Math.min(1, e.v / 6.3)} c={COL.bleu} w={4}/>}
        <Txt x={150} y={sol - 30} t="bille" c={COL.gris} size={15} w={600}/><Txt x={114} y={sol + 22} t="sol" c={COL.gris} size={15} w={600}/>
      </g>}
      {sit === 'glisse' && <g>
        <line x1="10" y1={sol} x2="200" y2={sol} stroke={COL.gris} strokeWidth="4"/>
        <line x1="12" y1={sol + 3} x2={12 + 150 * Math.min(1, e.dU / e.Etot0 + 0.0) * (p > 0 ? 1 : 0)} y2={sol + 3} stroke={COL.rouge} strokeWidth="5" opacity="0.7"/>
        <rect x={20 + 90 * p} y={sol - 34} width="52" height="32" rx="5" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
        {e.v > 0.05 && <Fleche x1={20 + 90 * p + 52} y1={sol - 18} x2={20 + 90 * p + 52 + 10 + 22 * e.v} y2={sol - 18} c={COL.bleu} w={4}/>}
        <Txt x={20 + 90 * p + 26} y={sol - 14} t="bloc" c={COL.encre} size={15}/><Txt x={105} y={sol + 26} t="sol" c={COL.gris} size={15} w={600}/></g>}
      {sit === 'chauffe' && <g>
        <rect x="55" y="60" width="100" height="70" rx="6" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
        <rect x="55" y="82" width="100" height="48" rx="4" fill="#93c5fd"/>
        <Txt x={105} y={112} t="eau" c={COL.encre} size={16}/>
        {[75, 105, 135].map(x => <Fleche key={x} x1={x} y1={168} x2={x} y2={138} c={COL.orange} w={3 + 3 * (p)}/>)}
        <Txt x={105} y={190} t="transfert thermique" c={COL.orange} size={15} w={600}/></g>}
      {bars && <g>
        <line x1="246" y1={y0} x2="324" y2={y0} stroke={COL.gris} strokeWidth="2"/>
        {rects}
        <line x1="250" y1={y0 - hcol} x2="320" y2={y0 - hcol} stroke={COL.violet} strokeWidth="2" strokeDasharray="5 4"/>
        <Txt x={285} y={y0 - hcol - 6} t={ligne} c={COL.violet} size={13} w={600}/>
        {lignes.map(([n, v, c], i) => <Txt key={n} x={332} y={64 + i * 28} t={vals ? `${n} ${f1(v)} J` : n} c={c} size={15} anchor="start"/>)}
      </g>}
    </svg>);
}

// ═════════ Carte 1 : énergie cinétique ═════════
export function SvgEc() {
  return (
    <Fond h={196} label="Schéma : l'énergie cinétique d'un système de masse m animé d'une vitesse v vaut un demi m v au carré ; exemple : 1 kilogramme à 2 mètres par seconde stocke 2 joules.">
      <rect x="40" y="14" width="320" height="46" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={45} t="Ec = ½ × m × v²" c={COL.violet} size={20} w={800}/>
      <Txt x={200} y={86} t="m en kg, v en m/s, Ec en J" c={COL.gris} size={15} w={600}/>
      <rect x="150" y="104" width="46" height="30" rx="5" fill={COL.ciel} stroke={COL.bleu} strokeWidth="3"/>
      <Fleche x1={198} y1={119} x2={260} y2={119} c={COL.bleu} w={4}/>
      <Txt x={286} y={124} t="v = 2 m/s" c={COL.bleu} size={15} anchor="start"/><Txt x={110} y={124} t="m = 1 kg" c={COL.encre} size={15}/>
      <Txt x={200} y={166} t="Ec = ½ × 1 × 2² = 2 J" c={COL.encre} size={17}/>
      <Txt x={200} y={188} t="elle dépend du référentiel" c={COL.gris} size={14} w={500}/>
    </Fond>);
}
// ═════════ Carte 2 : Ec ↔ Ep ═════════
export function SvgConv() {
  return (
    <Fond h={200} label="Schéma : pendant une chute sans frottement, l'énergie potentielle diminue et l'énergie cinétique augmente de la même quantité ; exemple : moins 6 joules d'énergie potentielle, plus 6 joules d'énergie cinétique.">
      <Txt x={200} y={26} t="chute sans frottement" c={COL.gris} size={15} w={600}/>
      <rect x="14" y="40" width="168" height="66" rx="10" fill="white" stroke={COL.orange} strokeWidth="3"/>
      <Txt x={98} y={66} t="énergie potentielle" c={COL.gris} size={15} w={600}/><Txt x={98} y={94} t="ΔEp = − 6 J" c={COL.orange} size={19} w={800}/>
      <rect x="218" y="40" width="168" height="66" rx="10" fill="white" stroke={COL.bleu} strokeWidth="3"/>
      <Txt x={302} y={66} t="énergie cinétique" c={COL.gris} size={15} w={600}/><Txt x={302} y={94} t="ΔEc = + 6 J" c={COL.bleu} size={19} w={800}/>
      <Fleche x1={184} y1={73} x2={216} y2={73} c={COL.violet} w={4}/>
      <rect x="40" y="124" width="320" height="34" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={147} t="ΔEc + ΔEp = 0 (U ne varie pas)" c={COL.violet} size={17} w={800}/>
      <Txt x={200} y={184} t="l’énergie change de forme" c={COL.encre} size={16}/>
    </Fond>);
}
// ═════════ Carte 3 : énergie interne ═════════
export function SvgU() {
  return (
    <Fond h={200} label="Schéma : l'énergie interne est la somme des énergies, à l'échelle microscopique, des particules du système ; elle augmente quand la température monte, par exemple à cause d'un frottement ou d'un transfert thermique reçu.">
      <rect x="40" y="14" width="320" height="46" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={43} t="énergie interne U" c={COL.violet} size={20} w={800}/>
      <Txt x={200} y={82} t="énergies des particules, à l’échelle microscopique" c={COL.gris} size={14} w={600}/>
      <rect x="14" y="98" width="178" height="62" rx="10" fill="#fef2f2" stroke={COL.rouge} strokeWidth="2.5"/>
      <Txt x={103} y={122} t="thermique" c={COL.rouge} size={17} w={800}/><Txt x={103} y={146} t="agitation, température" c={COL.gris} size={14} w={500}/>
      <rect x="208" y="98" width="178" height="62" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/>
      <Txt x={297} y={122} t="chimique, nucléaire" c={COL.orange} size={16} w={800}/><Txt x={297} y={146} t="liaisons, noyaux" c={COL.gris} size={14} w={500}/>
      <Txt x={200} y={186} t="U augmente quand la température monte" c={COL.encre} size={15}/>
    </Fond>);
}
// ═════════ Carte 4 : énergie totale ═════════
export function SvgEtot() {
  return (
    <Fond h={196} label="Schéma : l'énergie totale stockée par un système est la somme de son énergie cinétique, de son énergie potentielle et de son énergie interne ; sa variation est la somme des transferts d'énergie reçus.">
      <rect x="40" y="14" width="320" height="46" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={45} t="Etot = Ec + Ep + U" c={COL.violet} size={20} w={800}/>
      <rect x="14" y="76" width="110" height="52" rx="10" fill="white" stroke={COL.bleu} strokeWidth="3"/><Txt x={69} y={98} t="mouvement" c={COL.gris} size={14} w={600}/><Txt x={69} y={120} t="Ec" c={COL.bleu} size={19} w={800}/>
      <rect x="145" y="76" width="110" height="52" rx="10" fill="white" stroke={COL.orange} strokeWidth="3"/><Txt x={200} y={98} t="interactions" c={COL.gris} size={14} w={600}/><Txt x={200} y={120} t="Ep" c={COL.orange} size={19} w={800}/>
      <rect x="276" y="76" width="110" height="52" rx="10" fill="white" stroke={COL.rouge} strokeWidth="3"/><Txt x={331} y={98} t="microscopique" c={COL.gris} size={14} w={600}/><Txt x={331} y={120} t="U" c={COL.rouge} size={19} w={800}/>
      <Txt x={200} y={156} t="ΔEtot = somme des transferts reçus" c={COL.encre} size={16}/>
      <Txt x={200} y={180} t="sans transfert : Etot est constante" c={COL.violet} size={16}/>
    </Fond>);
}
