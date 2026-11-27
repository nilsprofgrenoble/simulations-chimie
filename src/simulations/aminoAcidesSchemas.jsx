// ====================================================
//  Schémas de la simulation 134 (acides α-aminés : forme selon le pH, niveau TG).
//  Scène : viewBox de 400, textes de 15 à 22. Cartes « À retenir » : viewBox de 400, police ≥ 16 (≈ 13 px rendus sur téléphone).
//  Couleurs : bleu = cation, vert = zwitterion, orange = anion, rouge = repère de pH ou piège, gris = repère.
//  Indices en tspan abaissé uniquement pour « A » de pKA (jamais baselineShift) ; tout le texte DANS le viewBox.
// ====================================================
import * as M from './aminoAcidesModele';

const COL = { bleu: '#0369a1', vert: '#15803d', orange: '#b45309', rouge: '#b91c1c', gris: '#64748b', txt: '#0f172a', violet: '#7c3aed', fondB: '#dbeafe', fondV: '#dcfce7', fondO: '#ffedd5' };
const COUL_FORME = { cat: COL.bleu, zw: COL.vert, an: COL.orange };
const FOND_FORME = { cat: COL.fondB, zw: COL.fondV, an: COL.fondO };
const Sb = ({ t }) => <tspan dy="4" fontSize="13">{t}</tspan>;
const Rs = ({ children }) => <tspan dy="-4">{children}</tspan>;
const stl = { width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const f1 = v => (Math.abs(Math.round(v * 10) / 10 - v) < 1e-9 ? v.toFixed(1) : v.toFixed(2)).replace('.', ',');
const NOMS = { cat: 'cation', zw: 'zwitterion', an: 'anion' };
const SIGNE = { cat: '+', zw: '0', an: '−' };

// ---------- diagramme de prédominance à deux frontières (scène) ----------
//  revele : { cat, zw, an } (booléens) ; un domaine non révélé est marqué « ? » et n'est pas nommé.
export function DiagPred3({ pH, a, revele = { cat: true, zw: true, an: true }, marque = true }) {
  const X = p => 18 + 26 * p, x1 = X(a.pKa1), x2 = X(a.pKa2), dom = [['cat', 18, x1], ['zw', x1, x2], ['an', x2, 382]];
  const tout = revele.cat && revele.zw && revele.an;
  return (
    <svg viewBox="0 0 400 176" style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={tout ? `Diagramme de prédominance de ${a.nom} : le cation prédomine pour un pH inférieur à ${f1(a.pKa1)}, le zwitterion entre ${f1(a.pKa1)} et ${f1(a.pKa2)}, l’anion au-dessus de ${f1(a.pKa2)}. Le pH vaut ${f1(pH)}.` : `Axe de pH avec les frontières à pH = ${f1(a.pKa1)} et pH = ${f1(a.pKa2)} ; les domaines ne sont pas tous nommés. Le pH vaut ${f1(pH)}.`}>
      {dom.map(([id, g, d]) => <rect key={id} x={g} y="26" width={d - g} height="46" fill={revele[id] ? FOND_FORME[id] : '#f1f5f9'}/>)}
      <line x1="18" y1="72" x2="382" y2="72" stroke={COL.txt} strokeWidth="2"/>
      {dom.map(([id, g, d]) => <g key={'t' + id}>
        {revele[id] && <text x={id === 'cat' ? g : (g + d) / 2} y="18" fontSize="17" fontWeight="700" textAnchor={id === 'cat' ? 'start' : 'middle'} fill={COUL_FORME[id]}>{NOMS[id]}</text>}
        <text x={(g + d) / 2} y="58" fontSize="24" fontWeight="700" textAnchor="middle" fill={revele[id] ? COUL_FORME[id] : COL.gris}>{revele[id] ? SIGNE[id] : '?'}</text></g>)}
      {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={X(p)} y1="72" x2={X(p)} y2="78" stroke={COL.txt}/><text x={X(p)} y="96" fontSize="15" textAnchor="middle" fill={COL.txt}>{p}</text></g>)}
      <text x="396" y="118" fontSize="15" textAnchor="end" fill={COL.gris}>pH</text>
      {[[x1, a.pKa1, 'A1'], [x2, a.pKa2, 'A2']].map(([x, v, n]) => <g key={n}>
        <line x1={x} y1="22" x2={x} y2="78" stroke={COL.rouge} strokeWidth="2" strokeDasharray="4 3" opacity="0.65"/>
        <text x={x} y="118" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>pK<Sb t={n}/><Rs> = {f1(v)}</Rs></text></g>)}
      {marque && <polygon points={`${X(pH) - 8},170 ${X(pH) + 8},170 ${X(pH)},152`} fill={COL.rouge}/>}
      {marque && <text x={X(pH) > 290 ? X(pH) - 14 : X(pH) + 14} y="168" fontSize="17" fontWeight="700" textAnchor={X(pH) > 290 ? 'end' : 'start'} fill={COL.rouge}>pH = {f1(pH)}</text>}
    </svg>);
}

// ---------- diagramme de distribution à trois courbes (scène) ----------
export function DiagDist3({ pH, a }) {
  const X = p => 42 + 24.3 * p, Y = f => 168 - 140 * f, pts = M.courbes(a, 71), fr = M.frac(pH, a);
  const ch = k => pts.map(q => `${X(q.pH).toFixed(1)},${Y(q[k]).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 400 232" style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`Diagramme de distribution de ${a.nom} : pourcentage de cation, de zwitterion et d’anion en fonction du pH. Au pH ${f1(pH)}, il y a ${Math.round(100 * fr[0])} % de cation, ${Math.round(100 * fr[1])} % de zwitterion et ${Math.round(100 * fr[2])} % d’anion.`}>
      <rect x="42" y="28" width="340" height="140" fill="#f8fafc" stroke="#cbd5e1"/>
      {[0, 0.5, 1].map(f => <g key={f}><line x1="42" y1={Y(f)} x2="382" y2={Y(f)} stroke="#e2e8f0" strokeDasharray={f === 0.5 ? '4 3' : ''}/><text x="36" y={Y(f) + 5} fontSize="15" textAnchor="end" fill={COL.txt}>{f * 100}</text></g>)}
      <text x="42" y="20" fontSize="15" fill={COL.gris}>%</text>
      {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={X(p)} y1="168" x2={X(p)} y2="174" stroke={COL.txt}/><text x={X(p)} y="192" fontSize="15" textAnchor="middle" fill={COL.txt}>{p}</text></g>)}
      <text x="396" y="214" fontSize="15" textAnchor="end" fill={COL.gris}>pH</text>
      {['cat', 'zw', 'an'].map(k => <polyline key={k} points={ch(k)} fill="none" stroke={COUL_FORME[k]} strokeWidth="3"/>)}
      <line x1={X(pH)} y1="28" x2={X(pH)} y2="168" stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 3"/>
      {['cat', 'zw', 'an'].map((k, i) => <circle key={k} cx={X(pH)} cy={Y(fr[i])} r="5" fill={COUL_FORME[k]}/>)}
      <text x="46" y="222" fontSize="16" fontWeight="700" fill={COL.bleu}>── cation</text>
      <text x="146" y="222" fontSize="16" fontWeight="700" fill={COL.vert}>── zwitterion</text>
      <text x="282" y="222" fontSize="16" fontWeight="700" fill={COL.orange}>── anion</text>
    </svg>);
}

// ---------- texte d'une formule (cartes) ----------
function Formule3({ x, y, a, forme, size = 19, anchor = 'start', fill = COL.txt }) {
  return <text x={x} y={y} fontSize={size} fontWeight="700" textAnchor={anchor} fill={fill}>{M.formule(a, forme)}</text>;
}
const GLY = M.ACIDES.gly;

// carte 1 : une molécule, deux couples (les deux groupes cèdent leur H⁺ l'un après l'autre)
export function SvgCouplesCarte() {
  const rangee = (y, forme) => <g key={forme}>
    <rect x="8" y={y} width="384" height="42" rx="8" fill="#f8fafc" stroke="#94a3b8"/>
    <Formule3 x={20} y={y + 28} a={GLY} forme={forme} size={19}/>
    <text x="380" y={y + 28} fontSize="16" textAnchor="end" fill={COL.gris}>{NOMS[forme]} ({SIGNE[forme]})</text></g>;
  const fleche = (y, c) => <g key={y}><line x1="30" y1={y + 4} x2="30" y2={y + 30} stroke={c} strokeWidth="3"/><polygon points={`22,${y + 28} 38,${y + 28} 30,${y + 38}`} fill={c}/></g>;
  return (
    <svg viewBox="0 0 400 278" style={stl} role="img" aria-label="La glycine met en jeu deux couples acide-base. Le cation H3N+ CH2 COOH cède d’abord le H+ de son groupe COOH (pKA1 égal 2,3) et donne le zwitterion ; celui-ci cède ensuite le H+ de son groupe NH3+ (pKA2 égal 9,6) et donne l’anion. Le plus petit pKA correspond au premier H+ cédé.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Une molécule, deux couples</text>
      {rangee(34, 'cat')}{fleche(76, COL.rouge)}
      <text x="50" y="100" fontSize="16" fontWeight="700" fill={COL.rouge}>pK<Sb t="A1"/><Rs> = 2,3 : –COOH cède H⁺</Rs></text>
      {rangee(114, 'zw')}{fleche(156, COL.violet)}
      <text x="50" y="180" fontSize="16" fontWeight="700" fill={COL.violet}>pK<Sb t="A2"/><Rs> = 9,6 : –NH₃⁺ cède H⁺</Rs></text>
      {rangee(194, 'an')}
      <text x="200" y="262" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>le plus petit pK<Sb t="A"/><Rs> : le premier H⁺ cédé</Rs></text>
    </svg>);
}

// carte 2 : trois formes, trois domaines
export function SvgDomainesCarte() {
  const a = GLY, X = p => 18 + 26 * p, x1 = X(a.pKa1), x2 = X(a.pKa2);
  return (
    <svg viewBox="0 0 400 268" style={stl} role="img" aria-label="Diagramme de prédominance de la glycine : le cation, de charge positive, prédomine à gauche de pKA1 égal 2,3 ; le zwitterion, globalement neutre, entre 2,3 et 9,6 ; l’anion, de charge négative, à droite de 9,6.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Trois formes, trois domaines</text>
      <rect x="18" y="56" width={x1 - 18} height="46" fill={COL.fondB}/><rect x={x1} y="56" width={x2 - x1} height="46" fill={COL.fondV}/><rect x={x2} y="56" width={382 - x2} height="46" fill={COL.fondO}/>
      <line x1="18" y1="102" x2="382" y2="102" stroke={COL.txt} strokeWidth="2"/>
      <text x="18" y="48" fontSize="16" fontWeight="700" fill={COL.bleu}>cation</text>
      <text x={(x1 + x2) / 2} y="48" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>zwitterion</text>
      <text x={(x2 + 382) / 2} y="48" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.orange}>anion</text>
      {[['cat', (18 + x1) / 2], ['zw', (x1 + x2) / 2], ['an', (x2 + 382) / 2]].map(([k, x]) => <text key={k} x={x} y="88" fontSize="24" fontWeight="700" textAnchor="middle" fill={COUL_FORME[k]}>{SIGNE[k]}</text>)}
      {[0, 7, 14].map(p => <text key={p} x={X(p)} y="124" fontSize="16" textAnchor="middle" fill={COL.txt}>{p}</text>)}
      <text x="394" y="144" fontSize="16" textAnchor="end" fill={COL.gris}>pH</text>
      {[x1, x2].map(x => <line key={x} x1={x} y1="52" x2={x} y2="108" stroke={COL.rouge} strokeWidth="2" strokeDasharray="4 3"/>)}
      <text x={x1} y="148" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>pK<Sb t="A1"/><Rs> = 2,3</Rs></text>
      <text x={x2} y="148" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>pK<Sb t="A2"/><Rs> = 9,6</Rs></text>
      <text x="14" y="184" fontSize="16" fill={COL.txt}>pH &lt; pK<Sb t="A1"/><Rs> : le cation domine (+)</Rs></text>
      <text x="14" y="208" fontSize="16" fill={COL.txt}>entre les deux : le zwitterion domine (0)</text>
      <text x="14" y="232" fontSize="16" fill={COL.txt}>pH &gt; pK<Sb t="A2"/><Rs> : l’anion domine (−)</Rs></text>
      <text x="200" y="260" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>charge : + puis 0 puis − quand le pH monte</text>
    </svg>);
}

// carte 3 : autour d'une frontière, rapport et pourcentages (couple 1)
export function SvgRapportCarte() {
  const lignes = [['pKA1 − 1', 100 / 11, '0,1'], ['pKA1 + 1', 1000 / 11, '10']], X0 = 100, L = 190;
  return (
    <svg viewBox="0 0 400 226" style={stl} role="img" aria-label="Autour de la frontière pKA1, le rapport de zwitterion sur cation vaut 10 puissance pH moins pKA1. À pKA1 moins 1 : 91 pour cent de cation et 9 pour cent de zwitterion , et à pKA1 plus 1 : 9 pour cent de cation et 91 pour cent de zwitterion. La lecture est la même autour de pKA2.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Autour d’une frontière</text>
      <text x="14" y="48" fontSize="16" fontWeight="700" fill={COL.bleu}>■ cation</text><text x="110" y="48" fontSize="16" fontWeight="700" fill={COL.vert}>■ zwitterion</text>
      {lignes.map(([lab, z, r], i) => { const y = 64 + i * 52, w = L * z / 100, c = L - w;
        return <g key={lab}>
          <text x="10" y={y + 18} fontSize="16" fontWeight="700" fill={COL.txt}>{lab}</text>
          <rect x={X0} y={y} width={c} height="26" fill={COL.bleu}/><rect x={X0 + c} y={y} width={w} height="26" fill={COL.vert}/>
          {c > 50 && <text x={X0 + 6} y={y + 19} fontSize="16" fontWeight="700" fill="#fff">{Math.round(100 - z)} %</text>}
          {w > 50 && <text x={X0 + L - 6} y={y + 19} fontSize="16" fontWeight="700" textAnchor="end" fill="#fff">{Math.round(z)} %</text>}
          {c <= 50 && <text x={X0 + 4} y={y + 44} fontSize="16" fill={COL.bleu}>{Math.round(100 - z)} %</text>}
          {w <= 50 && <text x={X0 + L - 4} y={y + 44} fontSize="16" textAnchor="end" fill={COL.vert}>{Math.round(z)} %</text>}
          <text x="392" y={y + 19} fontSize="16" fontWeight="700" textAnchor="end" fill={COL.gris}>rapport {r}</text>
        </g>; })}
      <text x="14" y="196" fontSize="16" fill={COL.txt}>rapport zwitterion / cation = 10<tspan dy="-7" fontSize="15">pH − pKA1</tspan></text>
      <text x="14" y="216" fontSize="16" fill={COL.txt}>même lecture autour de pK<Sb t="A2"/></text>
    </svg>);
}

// carte 4 : diagramme de distribution
export function SvgDistCarte() {
  const a = GLY, X = p => 44 + 24.6 * p, Y = f => 164 - 130 * f, pts = M.courbes(a, 57);
  const ch = k => pts.map(q => `${X(q.pH).toFixed(1)},${Y(q[k]).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 400 258" style={stl} role="img" aria-label="Diagramme de distribution de la glycine : la courbe du cation décroît, celle de l’anion croît, celle du zwitterion est en cloche entre les deux. Les courbes du cation et du zwitterion se croisent à 50 pour cent à pH égal pKA1, celles du zwitterion et de l’anion à pH égal pKA2.">
      <text x="200" y="20" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Diagramme de distribution</text>
      <line x1="44" y1={Y(0)} x2="388" y2={Y(0)} stroke={COL.txt}/><line x1="44" y1={Y(1)} x2="388" y2={Y(1)} stroke="#e2e8f0"/><line x1="44" y1={Y(0.5)} x2="388" y2={Y(0.5)} stroke="#cbd5e1" strokeDasharray="4 3"/>
      {[[1, '100'], [0.5, '50'], [0, '0']].map(([f, t]) => <text key={t} x="38" y={Y(f) + 5} fontSize="16" textAnchor="end" fill={COL.txt}>{t}</text>)}
      {[0, 7, 14].map(p => <text key={p} x={X(p)} y="186" fontSize="16" textAnchor="middle" fill={COL.txt}>{p}</text>)}
      <text x="394" y="208" fontSize="16" textAnchor="end" fill={COL.gris}>pH</text>
      {['cat', 'zw', 'an'].map(k => <polyline key={k} points={ch(k)} fill="none" stroke={COUL_FORME[k]} strokeWidth="3.5"/>)}
      {[a.pKa1, a.pKa2].map(p => <g key={p}><line x1={X(p)} y1={Y(0.5)} x2={X(p)} y2={Y(0)} stroke={COL.rouge} strokeWidth="2" strokeDasharray="4 3"/><circle cx={X(p)} cy={Y(0.5)} r="5" fill={COL.rouge}/></g>)}
      <text x={X(a.pKa1) + 10} y={Y(0.5) - 8} fontSize="16" fontWeight="700" fill={COL.rouge}>50 %</text>
      <text x={X(a.pKa2) - 10} y={Y(0.5) - 8} fontSize="16" fontWeight="700" textAnchor="end" fill={COL.rouge}>50 %</text>
      <text x={X(a.pKa1) + 8} y="206" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>pK<Sb t="A1"/></text>
      <text x={X(a.pKa2)} y="206" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>pK<Sb t="A2"/></text>
      <text x="44" y="232" fontSize="16" fontWeight="700" fill={COL.bleu}>── cation</text><text x="146" y="232" fontSize="16" fontWeight="700" fill={COL.vert}>── zwitterion</text><text x="282" y="232" fontSize="16" fontWeight="700" fill={COL.orange}>── anion</text>
      <text x="200" y="252" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>le zwitterion : la courbe en cloche</text>
    </svg>);
}

// carte 5 : le zwitterion est amphotère
export function SvgAmphotereCarte() {
  const boite = (y, forme, fort) => <g key={forme}>
    <rect x="12" y={y} width="376" height="44" rx="8" fill={fort ? COL.fondV : '#f8fafc'} stroke={fort ? COL.vert : '#94a3b8'} strokeWidth={fort ? 3 : 1.5}/>
    <Formule3 x={26} y={y + 29} a={GLY} forme={forme} size={19}/>
    <text x="376" y={y + 29} fontSize="16" textAnchor="end" fill={COUL_FORME[forme]} fontWeight="700">{NOMS[forme]}</text></g>;
  const fl = (x, y1, y2, c) => <g><line x1={x} y1={y1} x2={x} y2={y2} stroke={c} strokeWidth="3"/><polygon points={y2 < y1 ? `${x - 8},${y2 + 10} ${x + 8},${y2 + 10} ${x},${y2}` : `${x - 8},${y2 - 10} ${x + 8},${y2 - 10} ${x},${y2}`} fill={c}/></g>;
  return (
    <svg viewBox="0 0 400 268" style={stl} role="img" aria-label="Le zwitterion est une espèce amphotère : il peut capter un H+ et donner le cation, il joue alors le rôle de base ; il peut céder un H+ et donner l’anion, il joue alors le rôle d’acide.">
      <text x="200" y="20" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Le zwitterion est amphotère</text>
      {boite(30, 'cat', false)}
      {fl(34, 112, 78, COL.bleu)}<text x="54" y="102" fontSize="16" fontWeight="700" fill={COL.bleu}>+ H⁺ : il joue le rôle de base</text>
      {boite(112, 'zw', true)}
      {fl(34, 160, 194, COL.orange)}<text x="54" y="182" fontSize="16" fontWeight="700" fill={COL.orange}>− H⁺ : il joue le rôle d’acide</text>
      {boite(196, 'an', false)}
      <text x="200" y="258" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>amphotère = acide ET base</text>
    </svg>);
}
