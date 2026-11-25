// Schémas de la simulation 238 (conservation de l'énergie, signe des transferts) : scène « batterie → bloc → air » et cartes « À retenir ».
// Règles : police ≥ 15 dans un viewBox de 400 de large (indices ≥ 12), tout le texte dans le viewBox, aucune valeur de réponse dans les aria-label des scènes du parcours.
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', fil: '#334155', violet: '#6d28d9' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 232, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Fleche = ({ x1, y1, x2, y2, c = COL.fil, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9 + w * 0.8, d = 0.5;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - (L - 2) * Math.cos(a)} y2={y2 - (L - 2) * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="butt"/><polygon points={p} fill={c}/></g>;
};
const Rect = ({ x, y, w = 84, h = 64, nom, sous, c = COL.gris, fill = 'white', sel }) => <g>
  {sel && <rect x={x - 5} y={y - 5} width={w + 10} height={h + 10} rx="12" fill="none" stroke={COL.orange} strokeWidth="3" strokeDasharray="6 4"/>}
  <rect x={x} y={y} width={w} height={h} rx="8" fill={fill} stroke={c} strokeWidth="3"/>
  <text x={x + w / 2} y={sous ? y + h / 2 - 2 : y + h / 2 + 6} textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>{nom}</text>
  {sous && <text x={x + w / 2} y={y + h / 2 + 17} textAnchor="middle" fontSize="15" fill={COL.gris}>{sous}</text>}</g>;
const Txt = ({ x, y, t, c = COL.encre, size = 16, w = 700, anchor = 'middle' }) => <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={w} fill={c} {...halo}>{t}</text>;

const signe = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString('fr-FR').replace(/ /g, ' ') + ' J';

// ═════════ Scène : batterie → bloc de cuivre → air. W, Q en valeurs absolues (J). sel = système choisi (ou null) ; vals = afficher les valeurs algébriques ═════════
export function SceneBilan({ W, Q, sel = null, vals = false, emax = 1200 }) {
  const th = e => 3 + 14 * Math.max(0, Math.min(1, Math.abs(e) / emax));
  const pos = { batterie: 4, bloc: 158, air: 312 }, cy = 74;
  // couleur d'une flèche selon le système choisi : reçue = vert, cédée = rouge, étrangère = gris
  const couleur = (de, vers, neutre) => (!vals || !sel ? neutre : sel === vers ? COL.vert : sel === de ? COL.rouge : '#94a3b8');
  const sgn = (de, vers, e) => (sel === vers ? e : sel === de ? -e : null);
  const eqLabel = (x, t, v, de, vers) => {
    const s = sgn(de, vers, v);
    return <g><Txt x={x} y={cy - 38} t={t} c={COL.encre}/>{vals && s != null && <Txt x={x} y={cy - 18} t={signe(s)} c={s > 0 ? COL.vert : COL.rouge}/>}</g>;
  };
  const dE = { batterie: -W, bloc: W - Q, air: Q };
  const fl = v => (v > 1e-9 ? '▲' : v < -1e-9 ? '▼' : '＝');
  const cf = v => (v > 1e-9 ? COL.vert : v < -1e-9 ? COL.rouge : COL.gris);
  return (
    <svg viewBox={`0 0 400 ${sel && vals ? 184 : 138}`} style={base} role="img" aria-label="Schéma : une batterie cède de l’énergie par travail électrique à un bloc de cuivre ; le bloc cède de l’énergie par transfert thermique à l’air de la pièce.">
      <Rect x={pos.batterie} y={cy - 32} nom="batterie" sous="réservoir" sel={sel === 'batterie'}/>
      <Rect x={pos.bloc} y={cy - 32} nom="bloc" sous="de cuivre" sel={sel === 'bloc'}/>
      <Rect x={pos.air} y={cy - 32} nom="air" sous="de la pièce" sel={sel === 'air'}/>
      <Fleche x1={88} y1={cy} x2={158} y2={cy} c={couleur('batterie', 'bloc', COL.bleu)} w={th(W)}/>
      <Fleche x1={242} y1={cy} x2={312} y2={cy} c={couleur('bloc', 'air', COL.orange)} w={th(Q)}/>
      {eqLabel(123, 'W', W, 'batterie', 'bloc')}
      {eqLabel(277, 'Q', Q, 'bloc', 'air')}
      <Txt x={123} y={cy + 52} t="travail" c={COL.bleu} size={15} w={600}/>
      <Txt x={277} y={cy + 52} t="thermique" c={COL.orange} size={15} w={600}/>
      {sel && vals && <g>
        <Txt x={pos[sel] + 42} y={140} t={`ΔE = ${signe(dE[sel])}`} c={cf(dE[sel])} size={16}/>
        <Txt x={pos[sel] + 42} y={164} t={`${fl(dE[sel])} ${dE[sel] === 0 ? 'constante' : dE[sel] > 0 ? 'augmente' : 'diminue'}`} c={cf(dE[sel])} size={15}/>
      </g>}
    </svg>);
}

// ═════════ Carte A : le signe dépend du système (corps chaud / corps froid) ═════════
export function SvgSigne() {
  return (
    <Fond h={208} label="Schéma : un transfert thermique de 500 joules du corps chaud vers le corps froid ; compté négativement pour le corps chaud qui cède, positivement pour le corps froid qui reçoit.">
      <Rect x={18} y={26} w={104} h={60} nom="corps chaud" c={COL.rouge}/>
      <Rect x={278} y={26} w={104} h={60} nom="corps froid" c={COL.bleu}/>
      <Fleche x1={126} y1={56} x2={274} y2={56} c={COL.orange} w={8}/>
      <Txt x={200} y={44} t="500 J" c={COL.orange} size={17}/>
      <rect x="14" y="112" width="172" height="58" rx="10" fill="#fef2f2" stroke={COL.rouge} strokeWidth="2"/>
      <Txt x={100} y={136} t="pour le corps chaud" c={COL.gris} size={15} w={600}/>
      <Txt x={100} y={160} t="Q = −500 J (cède)" c={COL.rouge} size={17} w={800}/>
      <rect x="214" y="112" width="172" height="58" rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2"/>
      <Txt x={300} y={136} t="pour le corps froid" c={COL.gris} size={15} w={600}/>
      <Txt x={300} y={160} t="Q = +500 J (reçoit)" c={COL.bleu} size={17} w={800}/>
      <Txt x={200} y={196} t="reçu : +    cédé : −    selon le système" c={COL.encre} size={15}/>
    </Fond>);
}

// ═════════ Carte B : équation de conservation ΔE = somme des transferts ═════════
export function SvgEquation() {
  return (
    <Fond h={196} label="Schéma : la variation de l'énergie stockée par un système est égale à la somme algébrique des transferts d'énergie ; exemple : plus 200 joules reçus, moins 50 joules cédés, soit plus 150 joules.">
      <rect x="40" y="14" width="320" height="44" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={43} t="ΔE stockée = W + Q + …" c={COL.violet} size={19} w={800}/>
      <Txt x={200} y={82} t="(somme des transferts, avec leur signe)" c={COL.gris} size={15} w={500}/>
      <rect x="14" y="98" width="112" height="58" rx="10" fill="white" stroke={COL.vert} strokeWidth="3"/>
      <Txt x={70} y={122} t="reçu" c={COL.gris} size={15} w={600}/><Txt x={70} y={146} t="+ 200 J" c={COL.vert} size={19} w={800}/>
      <Txt x={142} y={136} t="+" size={24} w={800}/>
      <rect x="156" y="98" width="112" height="58" rx="10" fill="white" stroke={COL.rouge} strokeWidth="3"/>
      <Txt x={212} y={122} t="cédé" c={COL.gris} size={15} w={600}/><Txt x={212} y={146} t="− 50 J" c={COL.rouge} size={19} w={800}/>
      <Txt x={284} y={136} t="=" size={24} w={800}/>
      <rect x="298" y="98" width="92" height="58" rx="10" fill="white" stroke={COL.violet} strokeWidth="3"/>
      <Txt x={344} y={122} t="ΔE" c={COL.gris} size={15} w={600}/><Txt x={344} y={146} t="+150 J" c={COL.violet} size={19} w={800}/>
      <Txt x={200} y={182} t="ΔE > 0 : l’énergie stockée augmente" c={COL.encre} size={15}/>
    </Fond>);
}

// ═════════ Carte C : ΔU = m c ΔT et sens de variation ═════════
export function SvgDeltaT() {
  return (
    <Fond h={196} label="Schéma : pour un système sans changement d'état, la variation d'énergie interne vaut m fois c fois delta T ; une énergie interne qui augmente correspond à une température qui augmente.">
      <rect x="30" y="14" width="340" height="46" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={44} t="ΔU = m × c × ΔT" c={COL.violet} size={20} w={800}/>
      <rect x="14" y="76" width="184" height="62" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2"/>
      <Txt x={106} y={100} t="ΔU > 0" c={COL.vert} size={17} w={800}/><Txt x={106} y={126} t="▲ la température monte" c={COL.vert} size={15} w={700}/>
      <rect x="202" y="76" width="184" height="62" rx="10" fill="#fef2f2" stroke={COL.rouge} strokeWidth="2"/>
      <Txt x={294} y={100} t="ΔU < 0" c={COL.rouge} size={17} w={800}/><Txt x={294} y={126} t="▼ la température baisse" c={COL.rouge} size={15} w={700}/>
      <Txt x={200} y={166} t="ex. : 0,10 kg d’eau, ΔT = +2 K" c={COL.gris} size={15} w={500}/>
      <Txt x={200} y={186} t="ΔU = 0,10 × 4180 × 2 ≈ 840 J" c={COL.encre} size={15}/>
    </Fond>);
}

// ═════════ Carte D : deux modes de transfert et puissance ═════════
export function SvgModes() {
  return (
    <Fond h={206} label="Schéma : deux modes de transfert d'énergie, le travail W et le transfert thermique Q ; la puissance d'un transfert est la valeur absolue de l'énergie divisée par la durée ; exemple : 600 joules en 20 secondes, soit 30 watts.">
      <rect x="14" y="12" width="178" height="66" rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2.5"/>
      <Txt x={103} y={38} t="travail W" c={COL.bleu} size={18} w={800}/><Txt x={103} y={62} t="force, courant électrique" c={COL.gris} size={14} w={500}/>
      <rect x="208" y="12" width="178" height="66" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/>
      <Txt x={297} y={38} t="transfert thermique Q" c={COL.orange} size={16} w={800}/><Txt x={297} y={62} t="conduction, convection…" c={COL.gris} size={14} w={500}/>
      <rect x="40" y="96" width="320" height="46" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={126} t="P = |W| ÷ Δt     ou     P = |Q| ÷ Δt" c={COL.violet} size={18} w={800}/>
      <Txt x={200} y={166} t="J ÷ s = W (watt) : P est toujours positive" c={COL.gris} size={15} w={500}/>
      <Txt x={200} y={192} t="ex. : 600 J en 20 s → 30 W" c={COL.encre} size={16}/>
    </Fond>);
}

// ═════════ Carte E : bilan (système batterie, bloc, air) ═════════
export function SvgBilanSigne() {
  const bx = (x, t, v, c) => <g><rect x={x} y="40" width="116" height="64" rx="10" fill="white" stroke={c} strokeWidth="3"/><Txt x={x + 58} y={64} t={t} c={COL.gris} size={15} w={600}/><Txt x={x + 58} y={91} t={v} c={c} size={19} w={800}/></g>;
  return (
    <Fond h={206} label="Schéma : la somme des variations d'énergie stockée de tous les systèmes qui échangent de l'énergie est nulle ; exemple : moins 600 joules, plus 400 joules, plus 200 joules.">
      <Txt x={200} y={26} t="ΔE de chaque système" c={COL.gris} size={15} w={600}/>
      {bx(8, 'source', '− 600 J', COL.rouge)}{bx(142, 'objet chauffé', '+ 400 J', COL.vert)}{bx(276, 'air', '+ 200 J', COL.vert)}
      <rect x="40" y="122" width="320" height="34" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <Txt x={200} y={145} t="somme = 0 : l’énergie se conserve" c={COL.violet} size={17} w={800}/>
      <Txt x={200} y={180} t="reçu +  cédé −  selon le système choisi" c={COL.encre} size={15}/>
      <Txt x={200} y={198} t="ΔE = somme des transferts algébriques" c={COL.gris} size={14} w={500}/>
    </Fond>);
}
