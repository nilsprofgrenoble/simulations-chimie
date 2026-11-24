// Schémas de la simulation 220 « Charge d'un tensioactif selon le pH ». Tous en SVG, viewBox de 300 de large, textes de 12,5 à 16, largeur 100 % plafonnée.
import * as M from "./chargeTensioactifsModele";

const C = { plus: '#0369a1', moins: '#b91c1c', zero: '#64748b', non: '#15803d', amph: '#7c3aed', queue: '#b45309', huile: '#fde68a', eau: '#e0f2fe', txt: '#0f172a', gris: '#94a3b8', orange: '#ea580c' };
const nf = (v, d = 2) => v.toFixed(d).replace('.', ',');
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 14} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit">{s}</text>;
function base(h, label, children, larg = 300, max = 420) {
  return <svg role="img" aria-label={label} viewBox={`0 0 ${larg} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
}
const disque = (x, y, signe, op = 1, r = 11) => (
  <g key={`d${x}-${y}`} opacity={op}><circle cx={x} cy={y} r={r} fill={signe === '+' ? C.plus : C.moins}/><text x={x} y={y + 5} fontSize={15} fontWeight={700} fill="white" textAnchor="middle">{signe === '+' ? '+' : '−'}</text></g>);
const queue = (x0, y0, n, pas = 13, amp = 10) => {
  const pts = Array.from({ length: n + 1 }, (_, k) => `${x0 + k * pas},${y0 + (k % 2 ? -amp : amp) / 2}`).join(' ');
  return <polyline points={pts} fill="none" stroke={C.queue} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>;
};

// ---- molécule : queue hydrophobe (ligne brisée, un sommet = un carbone) + tête, avec la charge de chaque groupe au pH donné ----
const CADRES = {
  sds: [{ g: 0 }], savon: [{ g: 0 }], ctab: [{ g: 0 }], amine: [{ g: 0 }],
  betaine: [{ g: 0 }, { t: 'CH₂', w: 46 }, { g: 1 }], alanine: [{ g: 0 }, { t: 'CH₂CH₂', w: 72 }, { g: 1 }],
};
export function SvgTete({ id, pH, titre = true }) {
  const e = M.espece(id), W = 300, y0 = 80, nC = 7, xt = 10, pas = 13;
  const xFin = xt + nC * pas;
  const corps = [queue(xt, y0, nC, pas)];
  corps.push(T(6, y0 + 46, 'queue hydrophobe', { size: 13, fill: C.queue, gras: true, anchor: 'start' }));
  const entete = titre && T(6, 20, e.court, { size: 15, gras: true, anchor: 'start' });
  if (e.famille === 'non ionique') {
    if (id === 'age') {
      let x = xFin + 12;
      corps.push(<line key="l0" x1={xFin} y1={y0 - 5} x2={x} y2={y0 - 5} stroke={C.non} strokeWidth="3"/>);
      for (let i = 0; i < 2; i++) {
        corps.push(<g key={`o${i}`}><circle cx={x + 10} cy={y0 - 5} r={10} fill="white" stroke={C.non} strokeWidth="2.5"/><text x={x + 10} y={y0} fontSize={13} fontWeight={700} fill={C.non} textAnchor="middle">O</text></g>);
        corps.push(<polyline key={`z${i}`} points={`${x + 20},${y0 - 5} ${x + 30},${y0 + 5} ${x + 41},${y0 - 5} ${x + 52},${y0 + 5}`} fill="none" stroke={C.non} strokeWidth="3" strokeLinejoin="round"/>);
        x += 52;
      }
      corps.push(<g key="oh"><rect x={x + 2} y={y0 - 22} width={36} height={28} rx={8} fill="white" stroke={C.non} strokeWidth="2.5"/><text x={x + 20} y={y0 - 3} fontSize={14} fontWeight={700} fill={C.non} textAnchor="middle">OH</text></g>);
      corps.push(T(W - 6, y0 + 46, 'tête hydrophile', { size: 13, fill: C.non, gras: true, anchor: 'end' }));
      corps.push(T(W / 2, y0 + 68, 'motifs O–CH₂–CH₂ répétés, puis OH', { size: 12.5, fill: C.non }));
    } else {
      const cx = xFin + 58, cy = y0 - 4;
      const P = [[cx, cy - 22], [cx + 21, cy - 7], [cx + 13, cy + 18], [cx - 13, cy + 18], [cx - 21, cy - 7]];
      corps.push(<line key="e" x1={xFin} y1={y0 - 5} x2={xFin + 14} y2={y0 - 5} stroke={C.non} strokeWidth="3"/>);
      corps.push(<text key="est" x={xFin + 30} y={y0 - 12} fontSize={12.5} fontWeight={700} fill={C.non} textAnchor="middle">C=O</text>);
      corps.push(<polygon key="p" points={P.map(q => q.join(',')).join(' ')} fill="white" stroke={C.non} strokeWidth="2.5"/>);
      corps.push(<text key="or" x={P[0][0]} y={P[0][1] + 5} fontSize={12.5} fontWeight={700} fill={C.non} textAnchor="middle">O</text>);
      [[P[1][0] + 17, P[1][1] - 8], [P[2][0] + 17, P[2][1] + 12], [P[3][0] - 17, P[3][1] + 12], [P[4][0] - 17, P[4][1] - 8]].forEach(([x, y], k) => corps.push(<text key={`h${k}`} x={x} y={y + 4} fontSize={12.5} fontWeight={700} fill={C.non} textAnchor="middle">OH</text>));
      corps.push(T(W - 6, y0 + 46, 'tête hydrophile', { size: 13, fill: C.non, gras: true, anchor: 'end' }));
      corps.push(T(W / 2, y0 + 68, 'cycle avec plusieurs groupes OH', { size: 12.5, fill: C.non }));
    }
    corps.push(T(W - 6, 20, 'aucun groupe chargé', { size: 13, gras: true, anchor: 'end', fill: C.non }));
    return base(156, `${e.nom} : ${e.formule}, tête sans charge à tout pH`, <>{entete}{corps}</>);
  }
  const seq = CADRES[id]; let x = xFin + 6;
  corps.push(<line key="l" x1={xFin} y1={y0 - 5} x2={x} y2={y0 - 5} stroke={C.queue} strokeWidth="3"/>);
  seq.forEach((sg, i) => {
    if (sg.t) {
      corps.push(<line key={`b${i}`} x1={x} y1={y0 - 5} x2={x + 8} y2={y0 - 5} stroke={C.zero} strokeWidth="2.5"/>);
      corps.push(T(x + sg.w / 2, y0 - 1, sg.t, { size: 12.5, fill: C.zero, gras: true }));
      corps.push(<line key={`c${i}`} x1={x + sg.w - 8} y1={y0 - 5} x2={x + sg.w} y2={y0 - 5} stroke={C.zero} strokeWidth="2.5"/>);
      x += sg.w; return;
    }
    const g = e.groupes[sg.g], st = M.etatGroupe(g, pH), w = g.type === 'fixe' ? 76 : 54, sgn = st.q > 0 ? '+' : '−', charge = Math.abs(st.q) >= 0.15;
    const col = !charge ? C.zero : (sgn === '+' ? C.plus : C.moins);
    corps.push(<g key={`g${i}`}>
      <rect x={x} y={y0 - 28} width={w} height={46} rx={12} fill="white" stroke={col} strokeWidth={charge ? 3 : 2} strokeDasharray={charge ? undefined : '5 4'}/>
      <text x={x + w / 2} y={y0 - 1} fontSize={14} fontWeight={700} fill={col} textAnchor="middle">{st.forme}</text>
      {charge && disque(x + w - 4, y0 - 33, sgn, Math.max(0.35, Math.abs(st.q)))}
    </g>);
    x += w;
  });
  corps.push(T(W - 6, y0 + 46, 'tête hydrophile', { size: 13, fill: C.plus, gras: true, anchor: 'end' }));
  const c = M.charges(e, pH);
  corps.push(T(W - 6, 20, `pH ${nf(pH, 1)}`, { size: 14, gras: true, anchor: 'end' }));
  return base(138, `${e.nom} : ${e.formule} ; à pH ${nf(pH, 1)} : charges + ${nf(c.nPlus)}, charges − ${nf(c.nMoins)}`, <>{entete}{corps}</>);
}

// ---- courbes : nombre de charges + (bleu) et de charges − (rouge) par molécule, selon le pH ----
export function SvgCourbes({ id, pH, e: eDirect, etiquette, petit = false, repere = true, legende = true }) {
  const e = eDirect ?? M.espece(id), W = 300, H = petit ? 138 : 205;
  const x0 = 36, x1 = 288, yb = petit ? 102 : 156, ht = petit ? 62 : 96;
  const X = v => x0 + (v / 14) * (x1 - x0), Y = n => yb - n * ht;
  const pts = M.courbe(e, 0.25), cheminP = pts.map((p, k) => `${k ? 'L' : 'M'}${X(p.pH).toFixed(1)},${Y(p.nPlus).toFixed(1)}`).join(' '), cheminM = pts.map((p, k) => `${k ? 'L' : 'M'}${X(p.pH).toFixed(1)},${Y(p.nMoins).toFixed(1)}`).join(' ');
  const zone = M.plageDeuxCharges(e), c = M.charges(e, pH);
  const hautPlot = Y(1) - 6;
  return base(H, `${etiquette ? etiquette + ' : ' : ''}nombre de charges plus et de charges moins par molécule selon le pH, de 0 à 14`, <>
    {zone && <rect x={X(zone[0])} y={hautPlot} width={X(zone[1]) - X(zone[0])} height={yb - hautPlot} fill={C.amph} opacity="0.13"/>}
    <line x1={x0} y1={yb} x2={x1} y2={yb} stroke={C.txt} strokeWidth="1.5"/><line x1={x0} y1={hautPlot} x2={x0} y2={yb} stroke={C.txt} strokeWidth="1.5"/>
    {(petit ? [0, 7, 14] : [0, 2, 4, 6, 8, 10, 12, 14]).map(t => <g key={t}><line x1={X(t)} y1={yb} x2={X(t)} y2={yb + 5} stroke={C.txt}/>{T(X(t), yb + 20, String(t), { size: 12.5 })}</g>)}
    {T((x0 + x1) / 2, yb + (petit ? 36 : 38), 'pH', { size: 13.5, gras: true })}
    {T(x0 - 7, Y(1) + 5, '1', { size: 12.5, anchor: 'end' })}{T(x0 - 7, Y(0) + 4, '0', { size: 12.5, anchor: 'end' })}
    <path d={cheminM} fill="none" stroke={C.moins} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d={cheminP} fill="none" stroke={C.plus} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    {repere && <><line x1={X(pH)} y1={hautPlot} x2={X(pH)} y2={yb} stroke={C.orange} strokeWidth="2.5" strokeDasharray="5 4"/>
      <circle cx={X(pH)} cy={Y(c.nPlus)} r="6" fill="white" stroke={C.plus} strokeWidth="3"/><circle cx={X(pH)} cy={Y(c.nMoins)} r="6" fill="white" stroke={C.moins} strokeWidth="3"/></>}
    {legende && !petit && <><circle cx={x0 + 6} cy={13} r="6" fill={C.plus}/>{T(x0 + 17, 18, 'charges +', { size: 12.5, anchor: 'start' })}<circle cx={x0 + 92} cy={13} r="6" fill={C.moins}/>{T(x0 + 103, 18, 'charges −', { size: 12.5, anchor: 'start' })}{zone && <><rect x={x0 + 176} y={6} width={14} height={14} fill={C.amph} opacity="0.3"/>{T(x0 + 195, 18, 'les deux', { size: 12.5, anchor: 'start' })}</>}</>}
    {etiquette && T(x0 + 8, petit ? 22 : 40, etiquette, { size: petit ? 15 : 16, gras: true, anchor: 'start' })}
  </>, W, petit ? 340 : 420);
}

// ---- deux gouttes d'huile stabilisées par un tensioactif : répulsion des gouttes selon la charge des têtes ----
export function SvgGouttes({ id, pH }) {
  const e = M.espece(id), g = M.etatGouttes(e, pH), W = 300, H = 190;
  const goutte = (cx, cy, r) => {
    const els = [<circle key="c" cx={cx} cy={cy} r={r} fill={C.huile} stroke={C.queue} strokeWidth="2"/>, T(cx, cy + 5, 'huile', { size: 13, fill: C.queue, gras: true })];
    for (let k = 0; k < M.NTETES; k++) {
      const a = (k / M.NTETES) * 2 * Math.PI, x1 = cx + Math.cos(a) * r, y1 = cy + Math.sin(a) * r, x2 = cx + Math.cos(a) * (r + 13), y2 = cy + Math.sin(a) * (r + 13);
      const charge = k < g.nCharges;
      els.push(<line key={`q${k}`} x1={x1} y1={y1} x2={x2 - Math.cos(a) * 5} y2={y2 - Math.sin(a) * 5} stroke={C.queue} strokeWidth="2.5"/>);
      els.push(charge ? <g key={`t${k}`}>{disque(x2, y2, g.signe === '+' ? '+' : '−', 1, 8.5)}</g> : <circle key={`t${k}`} cx={x2} cy={y2} r="5.5" fill="white" stroke={C.zero} strokeWidth="2.5"/>);
    }
    return els;
  };
  const dx = g.repulsion === 'nulle' ? 58 : 84;
  return base(H, `deux gouttes d'huile dans l'eau, têtes du tensioactif ${e.court} à pH ${nf(pH, 1)} : ${g.repulsion === 'nulle' ? 'têtes sans charge, les gouttes se touchent' : 'têtes chargées, les gouttes se repoussent'}`, <>
    <rect x="0" y="0" width={W} height={H} rx="12" fill={C.eau}/>
    {goutte(150 - dx, 92, 30)}{goutte(150 + dx, 92, 30)}
    {g.repulsion === 'nulle'
      ? <>{T(150, 156, 'têtes sans charge :', { size: 13.5, fill: C.moins, gras: true })}{T(150, 176, 'les gouttes se touchent (coalescence)', { size: 13, fill: C.moins, gras: true })}</>
      : <>{T(150, 156, g.repulsion === 'forte' ? 'têtes chargées : les gouttes se repoussent' : 'charge faible : répulsion limitée', { size: 13, fill: C.non, gras: true })}{T(150, 176, 'émulsion stabilisée', { size: 13.5, fill: C.non, gras: true })}</>}
    {T(150, 20, `${e.court} · pH ${nf(pH, 1)}`, { size: 14, gras: true })}
  </>);
}

// ---- deux tensioactifs de charges opposées qui s'attirent : sel insoluble ----
export function SvgAttraction() {
  const tete = (x, y, s, col, nom, sous) => <g key={nom}><polyline points={`${x},${y + 26} ${x + 11},${y + 38} ${x},${y + 50} ${x + 11},${y + 62} ${x},${y + 74}`} fill="none" stroke={C.queue} strokeWidth="3.5"/>{disque(x, y + 8, s, 1, 14)}<text x={x} y={y + 92} fontSize="13.5" fontWeight="700" fill={col} textAnchor="middle">{nom}</text><text x={x} y={y + 108} fontSize="12.5" fill={col} textAnchor="middle">{sous}</text></g>;
  return base(190, 'un tensioactif anionique et un tensioactif cationique : leurs têtes de charges opposées s’attirent et forment un sel peu soluble', <>
    <rect x="0" y="0" width="300" height="190" rx="12" fill={C.eau}/>
    {tete(56, 24, '−', C.moins, 'anionique', '(SDS)')}{tete(244, 24, '+', C.plus, 'cationique', '(CTAB)')}
    <defs><marker id="fl220" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={C.orange}/></marker></defs>
    <line x1="80" y1="32" x2="220" y2="32" stroke={C.orange} strokeWidth="3" strokeDasharray="7 5" markerEnd="url(#fl220)"/>
    {T(150, 24, 'elles s’attirent', { size: 13.5, gras: true, fill: C.orange })}
    {T(150, 170, 'sel peu soluble : trouble ou précipité', { size: 13, gras: true, fill: C.moins })}
  </>);
}

// ================= cartes « À retenir » (viewBox de 300 de large, textes de 12,5 à 15, maxWidth 320) =================
const WC = 300, MAXC = 320;
export function SvgCarteIoniques() {
  const mini = (x, y, titre, trait) => <g key={titre}>
    <line x1={x} y1={y + 50} x2={x + 130} y2={y + 50} stroke={C.txt} strokeWidth="1.5"/><line x1={x} y1={y - 4} x2={x} y2={y + 50} stroke={C.txt} strokeWidth="1.5"/>
    {trait}{T(x + 65, y - 12, titre, { size: 14, gras: true })}</g>;
  const rouge = d => <path d={d} fill="none" stroke={C.moins} strokeWidth="4" strokeLinecap="round"/>;
  const bleu = d => <path d={d} fill="none" stroke={C.plus} strokeWidth="4" strokeLinecap="round"/>;
  return base(215, 'quatre tensioactifs ioniques : jamais une charge plus et une charge moins en même temps', <>
    {mini(14, 40, 'SDS', rouge('M14,40 H144'))}
    {mini(156, 40, 'CTAB', bleu('M156,40 H286'))}
    {mini(14, 125, 'savon', rouge('M14,175 H55 C75,175 80,125 100,125 H144'))}
    {mini(156, 125, 'amine', bleu('M156,125 H200 C225,125 230,175 250,175 H286'))}
    {T(150, 205, 'une seule couleur à la fois', { size: 14.5, gras: true })}
  </>, WC, MAXC);
}
export function SvgCarteZwitterion() {
  return base(190, 'un amphotère neutre porte deux charges, un non ionique n’en porte aucune', <>
    <rect x="4" y="6" width="141" height="138" rx="12" fill="white" stroke={C.amph} strokeWidth="2.5"/>
    <rect x="155" y="6" width="141" height="138" rx="12" fill="white" stroke={C.non} strokeWidth="2.5"/>
    {T(74, 30, 'amphotère à pH 7', { size: 13, gras: true, fill: C.amph })}{T(226, 30, 'non ionique', { size: 13.5, gras: true, fill: C.non })}
    {disque(40, 76, '+', 1, 15)}{disque(108, 76, '−', 1, 15)}{T(74, 112, 'deux charges', { size: 14, gras: true })}{T(74, 132, 'charge nette = 0', { size: 13 })}
    <circle cx="226" cy="76" r="15" fill="white" stroke={C.zero} strokeWidth="3"/>{T(226, 112, 'aucune charge', { size: 14, gras: true })}{T(226, 132, 'charge nette = 0', { size: 13 })}
    {T(150, 176, 'neutre ≠ sans charge', { size: 15, gras: true, fill: C.moins })}
  </>, WC, MAXC);
}
export function SvgCarteAmphotere() {
  const e = M.espece('alanine'), x0 = 20, x1 = 290, yb = 130, ht = 78, X = v => x0 + (v / 14) * (x1 - x0), Y = n => yb - n * ht;
  const pts = M.courbe(e, 0.25), P = k => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.pH).toFixed(1)},${Y(p[k]).toFixed(1)}`).join(' ');
  const pi = M.pointIsoelectrique(e);
  return base(232, 'un amphotère est cationique en milieu acide, zwitterionique au milieu et anionique en milieu basique', <>
    <rect x={X(3.5)} y="40" width={X(9.5) - X(3.5)} height={yb - 40} fill={C.amph} opacity="0.13"/>
    <line x1={x0} y1={yb} x2={x1} y2={yb} stroke={C.txt} strokeWidth="1.5"/>
    {[0, 7, 14].map(t => <g key={t}>{T(X(t), yb + 18, String(t), { size: 12.5 })}</g>)}{T(150, yb + 36, 'pH', { size: 13.5, gras: true })}
    <path d={P('nMoins')} fill="none" stroke={C.moins} strokeWidth="4" strokeLinecap="round"/><path d={P('nPlus')} fill="none" stroke={C.plus} strokeWidth="4" strokeLinecap="round"/>
    {T(X(1.4), 34, 'cation', { size: 13, gras: true, fill: C.plus })}{T(X(6.5), 34, 'zwitterion', { size: 13, gras: true, fill: C.amph })}{T(X(12.4), 34, 'anion', { size: 13, gras: true, fill: C.moins })}
    {T(150, 190, 'amphotère : les deux sortes de charges', { size: 13.5, gras: true })}{T(150, 209, 'le signe de la charge nette suit le pH', { size: 13 })}{T(150, 226, 'la bétaïne ne devient jamais −', { size: 12.5, fill: C.zero })}
    <line x1={X(pi)} y1="44" x2={X(pi)} y2={yb} stroke={C.orange} strokeWidth="2" strokeDasharray="5 4"/>
  </>, WC, MAXC);
}
export function SvgCarteTest() {
  const ligne = (y, col, tit, sous) => <g key={tit}><rect x="6" y={y} width="288" height="58" rx="12" fill="white" stroke={col} strokeWidth="2.5"/>{T(150, y + 24, tit, { size: 14, gras: true, fill: col })}{T(150, y + 44, sous, { size: 13 })}</g>;
  return base(236, 'test de la famille : compter les sortes de charges possibles sur la tête entre pH 0 et 14', <>
    {T(150, 20, 'Quelles charges la tête peut-elle porter ?', { size: 13.5, gras: true })}
    {ligne(32, C.non, 'aucune : non ionique', 'pas de groupe ionisable')}
    {ligne(98, C.plus, 'une seule sorte : ionique', '+ (cationique) ou − (anionique)')}
    {ligne(164, C.amph, 'les deux sortes : amphotère', '+ et − sur la même tête')}
  </>, WC, MAXC);
}
export function SvgCarteNonionique() {
  const eau = (x, y, k) => <g key={k}><circle cx={x} cy={y} r="17" fill={C.eau} stroke={C.plus} strokeWidth="2"/><text x={x} y={y + 4} fontSize="12.5" fontWeight="700" fill={C.plus} textAnchor="middle">H₂O</text></g>;
  return base(205, 'la tête d’un tensioactif non ionique forme des liaisons hydrogène avec les molécules d’eau', <>
    <rect x="4" y="8" width="118" height="116" rx="10" fill="white" stroke={C.non} strokeWidth="2.5"/>
    {T(63, 32, 'sans charge', { size: 13.5, gras: true, fill: C.non })}{T(63, 62, '–O–CH₂CH₂–O–', { size: 13, fill: C.non, gras: true })}{T(63, 90, '–OH', { size: 15, fill: C.non, gras: true })}{T(63, 112, '(ou plusieurs OH)', { size: 12.5, fill: C.non })}
    {eau(205, 44, 'e1')}{eau(205, 100, 'e2')}{eau(268, 72, 'e3')}
    <line x1="124" y1="62" x2="187" y2="46" stroke={C.orange} strokeWidth="3" strokeDasharray="3 5" strokeLinecap="round"/><line x1="124" y1="92" x2="187" y2="100" stroke={C.orange} strokeWidth="3" strokeDasharray="3 5" strokeLinecap="round"/>
    {T(150, 150, 'pas de charge,', { size: 14.5, gras: true })}{T(150, 170, 'mais des liaisons hydrogène', { size: 14.5, gras: true })}{T(150, 192, 'soluble sans dépendre du pH', { size: 13 })}
  </>, WC, MAXC);
}
export function SvgCarteChoix() {
  const X = v => 100 + (v / 14) * 190;
  const lig = (y, nom, col, a, b) => <g key={nom}>{T(4, y + 4, nom, { size: 13, anchor: 'start', gras: true, fill: col })}{b > a && <rect x={a} y={y - 10} width={b - a} height="22" rx="6" fill={col} opacity="0.85"/>}</g>;
  return base(226, 'zones de pH où la tête est chargée : sulfate et ammonium quaternaire partout, savon au-dessus de 7,5 environ, amine en dessous de 10 environ, non ionique nulle part', <>
    {T(150, 18, 'pH où la tête est chargée', { size: 14, gras: true })}
    {lig(50, 'SDS', C.moins, X(0), X(14))}{lig(84, 'CTAB', C.plus, X(0), X(14))}{lig(118, 'savon', C.moins, X(7.5), X(14))}{lig(152, 'amine', C.plus, X(0), X(10))}{lig(186, 'non ionique', C.non, 0, 0)}
    {T(X(7), 190, 'aucune charge à aucun pH', { size: 12.5, fill: C.non, gras: true })}
    <line x1={X(0)} y1="204" x2={X(14)} y2="204" stroke={C.txt}/>{[0, 7, 14].map(t => <g key={t}>{T(X(t), 220, String(t), { size: 12.5 })}</g>)}{T(296, 220, 'pH', { size: 12.5, anchor: 'end', gras: true })}
  </>, WC, MAXC);
}
