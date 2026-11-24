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
export function SvgTete({ id, pH, titre = true, contre = false }) {
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
  if (contre && e.contre) {
    corps.push(<g key="contre"><circle cx={x + 36} cy={y0 - 5} r={17} fill="white" stroke={C.gris} strokeWidth="2" strokeDasharray="4 3"/><text x={x + 36} y={y0} fontSize={13} fontWeight={700} fill={C.zero} textAnchor="middle">{e.contre}</text><text x={x + 36} y={y0 + 24} fontSize={12} fill={C.zero} textAnchor="middle">contre-ion</text></g>);
  }
  corps.push(T(W - 6, y0 + 46, 'tête hydrophile', { size: 13, fill: C.plus, gras: true, anchor: 'end' }));
  const c = M.charges(e, pH);
  corps.push(T(W - 6, 20, `pH ${nf(pH, 1)}`, { size: 14, gras: true, anchor: 'end' }));
  return base(138, `${e.nom} : ${e.formule} ; à pH ${nf(pH, 1)} : charges + ${nf(c.nPlus)}, charges − ${nf(c.nMoins)}`, <>{entete}{corps}</>);
}

// ---- diagramme de prédominance : pour chaque tensioactif, des zones de pH colorées selon la charge portée par la tête (frontières = pKa) ----
const COUL = { '+': C.plus, '−': C.moins, deux: C.amph, '0': C.zero };
const TXTZ = { '+': '+', '−': '−', deux: '+ −', '0': '0' };
function zonesDe(e) {
  const pk = [...new Set(e.groupes.filter(g => g.type !== 'fixe').map(g => g.pKa))].sort((a, b) => a - b);
  const bords = [M.PH_MIN, ...pk, M.PH_MAX];
  return bords.slice(0, -1).map((a, k) => {
    const b = bords[k + 1], c = M.charges(e, (a + b) / 2);
    const cl = c.nPlus > 0.5 && c.nMoins > 0.5 ? 'deux' : c.nette > 0.5 ? '+' : c.nette < -0.5 ? '−' : '0';
    return { a, b, cl };
  });
}
const LEG = [['+', 'charge +'], ['−', 'charge −'], ['deux', 'deux charges'], ['0', 'aucune charge']];
// lignes : [{ id } ou { e }, etiquette]. pH = null : pas de repère. avecPKa : valeurs de pKa sous les frontières.
export function SvgPredominance({ lignes, pH = null, avecPKa = true, legende = true, notes = true, bas = [], maxW = 420 }) {
  const W = 300, x0 = 14, x1 = 286, X = v => x0 + (v / 14) * (x1 - x0), RH = 70, haut = pH == null ? 8 : 30;
  const classes = new Set();
  const rows = lignes.map(l => { const e = l.e ?? M.espece(l.id); const z = zonesDe(e); z.forEach(q => classes.add(q.cl)); return { e, z, et: l.etiquette }; });
  const yAxe = haut + rows.length * RH + 2, nLeg = legende ? Math.ceil(LEG.filter(([c]) => classes.has(c)).length / 2) : 0;
  const yLeg = yAxe + 46, H = yLeg + nLeg * 22 + bas.length * 19 + 6;
  const leg = LEG.filter(([c]) => classes.has(c));
  const c0 = pH == null ? null : pH;
  return base(H, `diagramme de prédominance du pH 0 à 14 : ${rows.map(r => r.et ?? r.e.court).join(', ')}`, <>
    {rows.map((r, i) => { const y = haut + i * RH; return <g key={i}>
      {r.et && T(x0, y + 14, r.et, { size: 14.5, gras: true, anchor: 'start' })}
      {r.z.map((q, k) => <g key={k}><rect x={X(q.a)} y={y + 20} width={X(q.b) - X(q.a)} height="28" fill={COUL[q.cl]} stroke="white" strokeWidth="1.5" rx={k === 0 || k === r.z.length - 1 ? 5 : 0}/>
        {X(q.b) - X(q.a) > 24 && T((X(q.a) + X(q.b)) / 2, y + 40, TXTZ[q.cl], { size: 15, gras: true, fill: 'white' })}</g>)}
      {r.z.slice(1).map((q, k) => <g key={'p' + k}><line x1={X(q.a)} y1={y + 48} x2={X(q.a)} y2={y + 54} stroke={C.txt} strokeWidth="1.5"/>{avecPKa && T(X(q.a), y + 64, `pKa ${nf(q.a, 1)}`, { size: 12.5, gras: true })}</g>)}
      {r.z.length === 1 && avecPKa && notes && T(x1, y + 64, r.e.groupes.some(g => g.type !== 'fixe') ? '' : (r.z[0].cl === '0' ? 'aucun groupe ionisable' : 'charge fixe : pas de pKa'), { size: 12.5, anchor: 'end', fill: C.zero })}
    </g>; })}
    <line x1={x0} y1={yAxe} x2={x1} y2={yAxe} stroke={C.txt} strokeWidth="1.5"/>
    {[0, 2, 4, 6, 8, 10, 12, 14].map(t => <g key={t}><line x1={X(t)} y1={yAxe} x2={X(t)} y2={yAxe + 5} stroke={C.txt} strokeWidth="1.5"/>{T(X(t), yAxe + 20, String(t), { size: 13 })}</g>)}
    {T(150, yAxe + 38, 'pH', { size: 15, gras: true })}
    {c0 != null && <g>{rows.map((r, i) => <line key={i} x1={X(c0)} y1={haut + i * RH + 18} x2={X(c0)} y2={haut + i * RH + 50} stroke={C.orange} strokeWidth="3" strokeDasharray="5 3"/>)}<line x1={X(c0)} y1={yAxe - 6} x2={X(c0)} y2={yAxe + 6} stroke={C.orange} strokeWidth="3"/><path d={`M${X(c0) - 7},${haut - 2} L${X(c0) + 7},${haut - 2} L${X(c0)},${haut + 10} z`} fill={C.orange}/>
      {T(Math.min(Math.max(X(c0), 46), 254), haut - 8, `pH = ${nf(c0, 1)}`, { size: 14, gras: true, fill: C.orange })}</g>}
    {leg.map(([c, t], k) => <g key={c}><rect x={x0 + (k % 2) * 140} y={yLeg + Math.floor(k / 2) * 22} width="16" height="16" rx="3" fill={COUL[c]}/>{T(x0 + (k % 2) * 140 + 22, yLeg + Math.floor(k / 2) * 22 + 13, t, { size: 12.5, anchor: 'start' })}</g>)}
    {bas.map((t, k) => T(150, yLeg + nLeg * 22 + 16 + k * 19, t, { size: 13.5, gras: k === 0 }))}
  </>, W, maxW);
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

// ---- trois écritures de la formule non dissoute (SDS) ----
export function SvgFormules() {
  const ligne = (y, f, leg) => <g key={f}><rect x="6" y={y} width="288" height="54" rx="12" fill="white" stroke={C.gris} strokeWidth="2"/>{T(150, y + 26, f, { size: 19, gras: true })}{T(150, y + 45, leg, { size: 12.5, fill: C.zero })}</g>;
  return base(190, 'trois écritures de la formule du SDS : R–OSO₃⁻, R–OSO₃⁻ Na⁺ et R–OSO₃Na', <>
    {ligne(6, 'R–OSO₃⁻', 'écriture 1')}{ligne(68, 'R–OSO₃⁻ Na⁺', 'écriture 2')}{ligne(130, 'R–OSO₃Na', 'écriture 3')}
  </>);
}
// ---- dissolution du sel : deux ions séparés (les rôles ne sont pas nommés : c'est la question de l'étape) ----
export function SvgDissolution() {
  return base(236, 'le sel R–OSO₃Na se dissocie dans l’eau en un ion R–OSO₃⁻ qui porte une longue chaîne et un ion Na⁺', <>
    <rect x="0" y="0" width="300" height="236" rx="12" fill={C.eau}/>
    {T(150, 22, 'le sel, avant dissolution', { size: 13.5, gras: true })}
    {T(52, 50, 'R', { size: 15, gras: true, fill: C.queue })}{queue(22, 66, 5, 12, 9)}<line x1="82" y1="64" x2="96" y2="64" stroke={C.queue} strokeWidth="3"/>
    <rect x="96" y="44" width="72" height="40" rx="10" fill="white" stroke={C.gris} strokeWidth="2"/>{T(132, 70, 'OSO₃', { size: 14, gras: true })}
    <rect x="176" y="44" width="52" height="40" rx="10" fill="white" stroke={C.gris} strokeWidth="2"/>{T(202, 70, 'Na', { size: 14, gras: true })}
    <defs><marker id="fl220b" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={C.orange}/></marker></defs>
    <line x1="150" y1="96" x2="150" y2="128" stroke={C.orange} strokeWidth="3" markerEnd="url(#fl220b)"/>{T(162, 117, 'dans l’eau', { size: 13, fill: C.orange, gras: true, anchor: 'start' })}
    {T(52, 154, 'R', { size: 15, gras: true, fill: C.queue })}{queue(22, 170, 5, 12, 9)}<line x1="82" y1="168" x2="96" y2="168" stroke={C.queue} strokeWidth="3"/>
    <rect x="96" y="148" width="72" height="40" rx="10" fill="white" stroke={C.moins} strokeWidth="3"/>{T(132, 174, 'OSO₃⁻', { size: 14, gras: true, fill: C.moins })}
    <line x1="196" y1="140" x2="196" y2="196" stroke={C.gris} strokeWidth="2" strokeDasharray="4 4"/>
    <circle cx="250" cy="168" r="22" fill="white" stroke={C.plus} strokeWidth="2.5"/>{T(250, 173, 'Na⁺', { size: 14, gras: true, fill: C.plus })}
    {T(150, 222, 'deux ions séparés, libres dans l’eau', { size: 13.5, gras: true })}
  </>);
}
// ---- deux formules condensées à classer ----
export function SvgFormulesEx() {
  return base(110, 'deux formules condensées : R–N(CH₃)₃Br et R–COONa', <>
    <rect x="6" y="10" width="138" height="54" rx="12" fill="white" stroke={C.gris} strokeWidth="2"/>{T(75, 44, 'R–N(CH₃)₃Br', { size: 16, gras: true })}
    <rect x="156" y="10" width="138" height="54" rx="12" fill="white" stroke={C.gris} strokeWidth="2"/>{T(225, 44, 'R–COONa', { size: 16, gras: true })}
    {T(150, 92, 'R : longue chaîne carbonée', { size: 13, fill: C.queue, gras: true })}
  </>);
}

// ================= cartes « À retenir » (viewBox de 300 de large, textes de 12,5 à 15, maxWidth 320) =================
const WC = 300, MAXC = 320;
export function SvgCarteIoniques() {
  return <SvgPredominance maxW={MAXC} lignes={[{ id: 'sds', etiquette: 'SDS (sulfate)' }, { id: 'ctab', etiquette: 'CTAB (ammonium quaternaire)' }, { id: 'savon', etiquette: 'palmitate de sodium' }, { id: 'amine', etiquette: 'chlorure de dodécylammonium' }]} bas={['jamais + et − en même temps']}/>;
}
export function SvgCarteZwitterion() {
  return base(190, 'un zwitterionique neutre porte deux charges, un non ionique n’en porte aucune', <>
    <rect x="4" y="6" width="141" height="138" rx="12" fill="white" stroke={C.amph} strokeWidth="2.5"/>
    <rect x="155" y="6" width="141" height="138" rx="12" fill="white" stroke={C.non} strokeWidth="2.5"/>
    {T(74, 30, 'zwitterionique, pH 7', { size: 12.5, gras: true, fill: C.amph })}{T(226, 30, 'non ionique', { size: 13.5, gras: true, fill: C.non })}
    {disque(40, 76, '+', 1, 15)}{disque(108, 76, '−', 1, 15)}{T(74, 112, 'deux charges', { size: 14, gras: true })}{T(74, 132, 'charge nette = 0', { size: 13 })}
    <circle cx="226" cy="76" r="15" fill="white" stroke={C.zero} strokeWidth="3"/>{T(226, 112, 'aucune charge', { size: 14, gras: true })}{T(226, 132, 'charge nette = 0', { size: 13 })}
    {T(150, 176, 'neutre ≠ sans charge', { size: 15, gras: true, fill: C.moins })}
  </>, WC, MAXC);
}
export function SvgCarteAmphotere() {
  return <SvgPredominance maxW={MAXC} lignes={[{ id: 'alanine', etiquette: 'N-dodécyl-β-alanine' }, { id: 'betaine', etiquette: 'dodécylbétaïne' }]} bas={['zwitterionique : les deux sortes de charges', 'le signe de la charge nette suit le pH']}/>;
}
export function SvgCarteTest() {
  const ligne = (y, col, tit, sous) => <g key={tit}><rect x="6" y={y} width="288" height="58" rx="12" fill="white" stroke={col} strokeWidth="2.5"/>{T(150, y + 24, tit, { size: 14, gras: true, fill: col })}{T(150, y + 44, sous, { size: 13 })}</g>;
  return base(262, 'test de la famille : compter les sortes de charges possibles sur la tête entre pH 0 et 14', <>
    {T(150, 20, 'Quelles charges la tête peut-elle porter ?', { size: 13.5, gras: true })}
    {ligne(32, C.non, 'aucune : non ionique', 'pas de groupe ionisable')}
    {ligne(98, C.plus, 'une sorte : anionique ou cationique', 'ionique : charge − seule ou + seule')}
    {ligne(164, C.amph, 'deux sortes : zwitterionique', 'ionique aussi : + et − (amphotère)')}{T(150, 254, 'tête chargée = ionique, même si nette nulle', { size: 13, gras: true })}
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
export function SvgCarteFormule() {
  return base(236, 'lire la famille sur l’ion qui porte la longue chaîne : dans R–OSO₃Na, c’est R–OSO₃⁻ ; le contre-ion Na⁺ est ignoré', <>
    <rect x="6" y="6" width="288" height="88" rx="12" fill="white" stroke={C.gris} strokeWidth="2"/>
    {T(150, 32, 'R–OSO₃⁻', { size: 15, gras: true })}{T(150, 55, 'R–OSO₃⁻ Na⁺', { size: 15, gras: true })}{T(150, 78, 'R–OSO₃Na', { size: 15, gras: true })}
    {T(150, 118, '↓ dans l’eau', { size: 14, gras: true, fill: C.orange })}
    <rect x="14" y="130" width="160" height="42" rx="12" fill="white" stroke={C.orange} strokeWidth="3"/>{T(94, 158, 'R–OSO₃⁻', { size: 16, gras: true, fill: C.moins })}
    <rect x="190" y="130" width="96" height="42" rx="12" fill="white" stroke={C.gris} strokeWidth="2" strokeDasharray="5 4"/>{T(238, 158, 'Na⁺', { size: 15, gras: true, fill: C.zero })}
    {T(94, 194, 'ion à longue queue :', { size: 13, gras: true, fill: C.orange })}{T(94, 212, 'on lit la famille ici', { size: 13, fill: C.orange })}
    {T(238, 194, 'contre-ion :', { size: 13, gras: true, fill: C.zero })}{T(238, 212, 'on l’ignore', { size: 13, fill: C.zero })}
  </>, WC, MAXC);
}
