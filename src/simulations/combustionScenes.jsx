// Scènes de la simulation 159 « Combustions » : molécules (formules développées planes, schémas simplifiés), becs, bilan des liaisons, niveaux d'énergie.
// Tous les SVG : viewBox de 340 de large, width 100 % et maxWidth 420 ; textes ≥ 15 (≈ 11,5 px rendus sur un téléphone de 390 px, où le schéma s'affiche à environ 260 px).
import * as C from "./combustionModele";
import { COL, COL_LIAISON, COL_ATOME, bornes, ESPECES, moleculeDe, nbm } from "./combustionDessin";
import { KIT } from "../commun";
import { Fleche } from "./combustionFleche";

const NB = ' ';
const W = 340;
const stl = { width: '100%', maxWidth: 420, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8 };
const nbf = (v, d = 0) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const R = 12;                                              // rayon d'un atome dessiné

// ---------- une molécule dessinée à partir de son graphe ----------
function Molecule({ m, ox = 0, oy = 0, colorie = false }) {
  const P = m.atomes;
  return (
    <g transform={`translate(${ox} ${oy})`}>
      {m.liaisons.map((l, i) => {
        const a = P[l.a], b = P[l.b], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), nx = -dy / d * 3.4, ny = dx / d * 3.4;
        const c = colorie ? COL_LIAISON[l.t] : '#475569';
        return l.o === 2
          ? <g key={i} stroke={c} strokeWidth="3.2" strokeLinecap="round"><line x1={a.x + nx} y1={a.y + ny} x2={b.x + nx} y2={b.y + ny} /><line x1={a.x - nx} y1={a.y - ny} x2={b.x - nx} y2={b.y - ny} /></g>
          : <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c} strokeWidth="3.6" strokeLinecap="round" />;
      })}
      {P.map((a, i) => (
        <g key={i}>
          <circle cx={a.x} cy={a.y} r={a.e === 'H' ? R - 1.5 : R} fill={COL_ATOME[a.e]} stroke="#334155" strokeWidth="1.2" />
          <text x={a.x} y={a.y + 5.2} fontSize={a.e === 'H' ? 14.5 : 15} fontWeight="700" textAnchor="middle" fill={COL.encre}>{a.e}</text>
        </g>))}
    </g>);
}

const largeur = m => { const b = bornes(m); return b.x1 - b.x0 + 2 * R + 8; };
const hauteur = m => { const b = bornes(m); return b.y1 - b.y0 + 2 * R; };
const txtMult = x => (x === 1 ? '' : `${C.coefTexte(x).trim()}${NB}×${NB}`);
const SEMI = { c8h18: 'CH₃–(CH₂)₆–CH₃' };
const LARG_SEMI = 196;

function blocs(c, cote) {
  const k = C.coefficients(c);
  return cote === 'rompues'
    ? [{ cle: 'fuel', formule: c.f, m: moleculeDe(c), mult: 1 }, { cle: 'O2', formule: 'O₂', m: ESPECES.O2(), mult: k.O2 }]
    : [{ cle: 'CO2', formule: 'CO₂', m: ESPECES.CO2(), mult: k.CO2 }, { cle: 'H2O', formule: 'H₂O', m: ESPECES.H2O(), mult: k.H2O }];
}

// Une rangée d'espèces dessinée dans un <g> (utilisée seule ou en deux rangées)
function Rangee({ B, y0, hMax, ecart = 34, signe = '+' }) {
  const larg = B.map(b => (b.m ? largeur(b.m) : LARG_SEMI));
  const total = larg.reduce((s, w) => s + w, 0) + ecart * (B.length - 1);
  const x0 = (W - total) / 2, debuts = larg.map((_, i) => x0 + larg.slice(0, i).reduce((a, w) => a + w + ecart, 0));
  const cy = y0 + hMax / 2;
  return B.map((b, i) => {
    const w = larg[i], cx = debuts[i] + w / 2, bn = b.m ? bornes(b.m) : null;
    return (
      <g key={b.cle}>
        {b.m
          ? <Molecule m={b.m} ox={cx - (bn.x0 + bn.x1) / 2} oy={cy - (bn.y0 + bn.y1) / 2} colorie={b.colorie} />
          : <g><rect x={cx - LARG_SEMI / 2 + 6} y={cy - 22} width={LARG_SEMI - 12} height="44" rx="10" fill="#f1f5f9" stroke="#64748b" /><text x={cx} y={cy + 6} fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>{b.semi}</text></g>}
        <text x={cx} y={y0 + hMax + 24} fontSize="16" fontWeight="700" textAnchor="middle" fill={b.cache ? COL.orange : COL.encre}>{b.cache ? `?${NB}×${NB}` : txtMult(b.mult)}{b.formule}</text>
        {i < B.length - 1 && <text x={cx + w / 2 + ecart / 2} y={cy + 6} fontSize="22" fontWeight="700" textAnchor="middle" fill={COL.gris}>{signe}</text>}
      </g>);
  });
}

export function RangeeEspeces({ c, cote, colorie = true, titre }) {
  const B = blocs(c, cote).map(b => ({ ...b, colorie, semi: SEMI[c.id] }));
  const hMax = Math.max(...B.map(b => (b.m ? hauteur(b.m) : 44))), H = hMax + 52;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl} role="img" aria-label={`${titre} : ${B.map(b => `${txtMult(b.mult)}${b.formule}`).join(' et ')}. Schéma simplifié en formules développées planes.`}>
      <Rangee B={B} y0={8} hMax={hMax} />
      {!moleculeDe(c) && cote === 'rompues' && <text x={W / 2} y={H - 4} fontSize="15" textAnchor="middle" fill={COL.gris}>octane : formule semi-développée</text>}
    </svg>);
}

// ---------- équation dessinée sur deux rangées : réactifs, puis produits (le coefficient de O₂ peut être masqué) ----------
export function RangeeEquation({ c, revele = true }) {
  const k = C.coefficients(c);
  const R1 = [{ cle: 'fuel', formule: c.f, m: moleculeDe(c), mult: 1 }, { cle: 'O2', formule: 'O₂', m: ESPECES.O2(), mult: k.O2, cache: !revele }];
  const R2 = [{ cle: 'CO2', formule: 'CO₂', m: ESPECES.CO2(), mult: k.CO2 }, { cle: 'H2O', formule: 'H₂O', m: ESPECES.H2O(), mult: k.H2O }];
  const h = Math.max(...[...R1, ...R2].map(b => hauteur(b.m))), H = 2 * (h + 40) + 30;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl} role="img" aria-label={`Réactifs : ${c.nom} et ${R1[1].cache ? 'un nombre à trouver de molécules de dioxygène' : `${txtMult(k.O2)}dioxygène`}. Produits : dioxyde de carbone et eau. Schéma simplifié.`}>
      <Rangee B={R1} y0={6} hMax={h} />
      <text x={W / 2} y={h + 40 + 22} fontSize="20" fontWeight="700" textAnchor="middle" fill={COL.gris}>↓</text>
      <Rangee B={R2} y0={h + 40 + 28} hMax={h} />
    </svg>);
}

// ---------- molécule de combustible seule ----------
export function MoleculeSeule({ c, titre }) {
  const m = moleculeDe(c), H = (m ? hauteur(m) : 44) + 46;
  const B = [{ cle: 'x', formule: `${c.nom} ${c.f}`, m, mult: 1, semi: SEMI[c.id] }];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl} role="img" aria-label={`${titre || c.nom} : ${c.f}. Schéma simplifié en formule développée plane.`}>
      <Rangee B={B} y0={8} hMax={m ? hauteur(m) : 44} />
    </svg>);
}

// ---------- équation en tête de l'écran (texte HTML, blocs insécables) ----------
export const EquationTete = ({ texte, note }) => (
  <div style={{ textAlign: 'center', padding: '4px 4px 10px' }}>
    <div style={{ fontSize: 17, fontWeight: 700, color: KIT.txt, lineHeight: 1.6 }}>{texte.split(' ').map((m, i) => <span key={i} style={{ whiteSpace: 'nowrap' }}>{m}{' '}</span>)}</div>
    {note && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>{note}</div>}
  </div>);

// ---------- données : énergies de liaison (le code couleur sert aux dessins) ----------
export function DonneesLiaisons({ types = C.ORDRE_LIAISONS, titre = 'Données : énergies de liaison moyennes, en kJ·mol⁻¹' }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{titre}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
        {types.map(t => (
          <div key={t} style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderLeft: `6px solid ${COL_LIAISON[t]}`, borderRadius: 8, padding: '4px 6px', fontSize: 14, whiteSpace: 'nowrap', color: KIT.txt }}>
            <strong>{C.NOM_LIAISON[t]}</strong>{NB}{C.D_LIAISON[t]}
          </div>))}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Valeurs moyennes tabulées ; la couleur d’une liaison, dans les schémas, est celle de son type. Phase gazeuse : tous les corps sont pris gazeux, eau comprise.</div>
    </div>);
}

// ---------- niveaux d'énergie : rompre puis former ----------
export function Niveaux({ rompue, formee, formuleR, formuleP, revele = false, reference = null, titre = 'Bilan d’énergie (schéma à l’échelle)' }) {
  const s = 130 / Math.max(rompue, formee), yT = 40, yR = yT + rompue * s, yP = yT + formee * s, er = rompue - formee;
  const xR = 30, xP = 214;
  return (
    <svg viewBox={`0 0 ${W} 304`} style={stl} role="img" aria-label={`${titre} : pour rompre les liaisons des réactifs, il faut fournir ${nbm(rompue)} kJ par mole ; la formation des liaisons des produits libère ${nbm(formee)} kJ par mole, énergie libérée comptée négativement dans E r.`}>
      <text x="24" y="18" fontSize="15" fontWeight="700" fill={COL.encre}>énergie</text>
      <Fleche x1={12} y1={250} x2={12} y2={8} c={COL.gris} w={1.8} t={8} />
      <line x1={xR} y1={yT} x2="330" y2={yT} stroke={COL.gris} strokeWidth="2.4" strokeDasharray="6 4" />
      <text x="330" y={yT - 6} fontSize="15" textAnchor="end" fill={COL.gris}>atomes séparés</text>
      <line x1={xR} y1={yR} x2={xR + 84} y2={yR} stroke={COL.bleu} strokeWidth="4" />
      <text x={xR} y={yR + 20} fontSize="15" fontWeight="700" fill={COL.bleu}>réactifs</text>
      <text x={xR} y={yR + 38} fontSize="15" fill={COL.bleu}>{formuleR}</text>
      <line x1={xP} y1={yP} x2={xP + 84} y2={yP} stroke={COL.orange} strokeWidth="4" />
      <text x={xP} y={yP + 20} fontSize="15" fontWeight="700" fill={COL.orange}>produits</text>
      <text x={xP} y={yP + 38} fontSize="15" fill={COL.orange}>{formuleP}</text>
      <Fleche x1={100} y1={yR - 2} x2={100} y2={yT + 6} c={COL.rouge} w={2.4} t={9} />
      <text x="108" y={(yR + yT) / 2 - 2} fontSize="15" fontWeight="700" fill={COL.rouge}>rompre :</text>
      <text x="108" y={(yR + yT) / 2 + 16} fontSize="15" fontWeight="700" fill={COL.rouge}>+{nbm(rompue)}</text>
      <Fleche x1={190} y1={yT + 2} x2={190} y2={yP - 6} c={COL.vert} w={2.4} t={9} />
      <text x="198" y={(yP + yT) / 2 - 8} fontSize="15" fontWeight="700" fill={COL.vert}>former :</text>
      <text x="198" y={(yP + yT) / 2 + 10} fontSize="15" fontWeight="700" fill={COL.vert}>−{nbm(formee)}</text>
      <line x1="326" y1={yR} x2="326" y2={yP} stroke={COL.violet} strokeWidth="3" />
      <line x1="318" y1={yR} x2="334" y2={yR} stroke={COL.violet} strokeWidth="2.4" /><line x1="318" y1={yP} x2="334" y2={yP} stroke={COL.violet} strokeWidth="2.4" />
      <text x="318" y={yR - 8} fontSize="16" fontWeight="700" textAnchor="end" fill={COL.violet}>E<tspan dy="4" fontSize="12.5">r</tspan><tspan dy="-4"> = {revele ? nbm(er) : '?'}</tspan></text>
      {revele && reference != null && <text x="330" y={yP + 58} fontSize="15" textAnchor="end" fill={COL.gris}>référence : {nbm(reference)}</text>}
      <text x={W / 2} y="280" fontSize="15" textAnchor="middle" fill={COL.gris}>en kJ·mol⁻¹, niveaux à l’échelle</text>
      <text x={W / 2} y="298" fontSize="15" textAnchor="middle" fill={COL.gris}>(libérée = comptée négativement)</text>
    </svg>);
}

// ---------- scènes de l'introduction ----------
const CORPS = [['🪵', 'bois', 'une bûche'], ['🏕️', 'butane', 'cartouche de camping, C₄H₁₀'], ['🥃', 'éthanol', 'alcool à brûler, C₂H₅OH'], ['💨', 'dioxygène', 'gaz de l’air, O₂'], ['🫧', 'dioxyde de carbone', 'gaz des boissons gazeuses, CO₂'], ['💧', 'eau', 'liquide du robinet, H₂O']];
export function SceneCorps() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
      {CORPS.map(([e, n, d]) => (
        <div key={n} style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 26 }} aria-hidden="true">{e}</span>
          <span style={{ fontSize: 14, lineHeight: 1.35, color: KIT.txt }}><strong>{n}</strong><br /><span style={{ color: KIT.txt2 }}>{d}</span></span>
        </div>))}
    </div>);
}

function Bec({ x, ouvert }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <ellipse cx="0" cy="214" rx="38" ry="9" fill="#475569" />
      <rect x="-9" y="150" width="18" height="62" rx="3" fill="#94a3b8" stroke="#475569" />
      <rect x="-13" y="172" width="26" height="20" rx="3" fill="#cbd5e1" stroke="#475569" />
      {ouvert
        ? <g><ellipse cx="-5" cy="182" rx="3.2" ry="6" fill="#0f172a" /><ellipse cx="5" cy="182" rx="3.2" ry="6" fill="#0f172a" />
          </g>
        : <g><rect x="-13" y="176" width="26" height="12" fill="#94a3b8" stroke="#475569" /></g>}
      {ouvert
        ? <g><path d="M0 150 C-14 134 -12 112 0 88 C12 112 14 134 0 150 Z" fill="#bfdbfe" stroke="#60a5fa" /><path d="M0 150 C-6 140 -5 126 0 112 C5 126 6 140 0 150 Z" fill="#2563eb" /></g>
        : <g><path d="M0 150 C-26 128 -22 84 0 36 C22 84 26 128 0 150 Z" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" /><path d="M0 150 C-10 134 -8 112 0 94 C8 112 10 134 0 150 Z" fill="#fb923c" /></g>}
      <path d={ouvert ? 'M-26 70 H26 L20 82 H-20 Z' : 'M-30 22 H30 L23 36 H-23 Z'} fill="#e2e8f0" stroke="#475569" strokeWidth="1.6" />
      {!ouvert && <path d="M-16 36 C-12 44 12 44 16 36 Z" fill="#0f172a" />}
    </g>);
}
export function SceneBecs() {
  return (
    <svg viewBox={`0 0 ${W} 290`} style={stl} role="img" aria-label="Deux becs de laboratoire. Bec A : flamme bleue peu lumineuse, capsule propre. Bec B : flamme jaune et lumineuse, capsule noircie de suie. Schéma simplifié.">
      <Bec x={85} ouvert />
      <Bec x={255} ouvert={false} />
      <text x="85" y="248" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>Bec A</text>
      <text x="85" y="268" fontSize="15" textAnchor="middle" fill={COL.gris}>flamme bleue,</text><text x="85" y="285" fontSize="15" textAnchor="middle" fill={COL.gris}>capsule propre</text>
      <text x="255" y="248" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>Bec B</text>
      <text x="255" y="268" fontSize="15" textAnchor="middle" fill={COL.gris}>flamme jaune,</text><text x="255" y="285" fontSize="15" textAnchor="middle" fill={COL.gris}>capsule noircie</text>
    </svg>);
}

export function SceneChaudiere() {
  return (
    <svg viewBox={`0 0 ${W} 268`} style={stl} role="img" aria-label="Une pièce : une chaudière à gaz murale dont la flamme est jaune, des traces noires de suie au-dessus, une fenêtre fermée et une grille d’aération bouchée. Schéma simplifié.">
      <rect x="4" y="4" width="332" height="260" rx="10" fill="#f8fafc" stroke="#94a3b8" />
      <rect x="20" y="46" width="112" height="110" rx="10" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
      <text x="76" y="68" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.encre}>chaudière</text>
      <path d="M76 144 C54 124 58 98 76 80 C94 98 98 124 76 144 Z" fill="#fde68a" stroke="#f59e0b" /><path d="M76 144 C68 132 70 118 76 106 C82 118 84 132 76 144 Z" fill="#fb923c" />
      <path d="M36 40 C44 20 64 30 72 14 M80 38 C88 24 104 28 116 14" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.55" />
      <text x="76" y="178" fontSize="15" textAnchor="middle" fill={COL.gris}>flamme jaune,</text><text x="76" y="196" fontSize="15" textAnchor="middle" fill={COL.gris}>parois noircies</text>
      <rect x="196" y="46" width="124" height="100" rx="4" fill="#e0f2fe" stroke="#475569" strokeWidth="2.4" /><line x1="258" y1="46" x2="258" y2="146" stroke="#475569" strokeWidth="2" /><line x1="196" y1="96" x2="320" y2="96" stroke="#475569" strokeWidth="2" />
      <text x="258" y="168" fontSize="15" textAnchor="middle" fill={COL.encre}>fenêtre fermée</text>
      <rect x="196" y="184" width="124" height="22" rx="4" fill="#cbd5e1" stroke="#475569" /><path d="M208 184 V206 M224 184 V206 M240 184 V206 M256 184 V206 M272 184 V206 M288 184 V206 M304 184 V206" stroke="#64748b" strokeWidth="1.6" />
      <rect x="196" y="184" width="124" height="22" rx="4" fill="#92400e" opacity="0.55" /><text x="258" y="228" fontSize="15" textAnchor="middle" fill={COL.gris}>grille d’aération</text><text x="258" y="246" fontSize="15" textAnchor="middle" fill={COL.gris}>bouchée</text>
    </svg>);
}

// ---------- rompre / former : deux atomes liés ----------
export function SceneDeuxAtomes() {
  const o = (x, y) => <g><circle cx={x} cy={y} r="14" fill={COL_ATOME.O} stroke="#334155" /><text x={x} y={y + 5.5} fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>O</text></g>;
  return (
    <svg viewBox={`0 0 ${W} 150`} style={stl} role="img" aria-label="Une molécule de dioxygène O₂ (deux atomes d’oxygène liés par une double liaison) et, à droite, deux atomes d’oxygène séparés. Une double flèche relie les deux états. Schéma simplifié.">
      <g stroke="#475569" strokeWidth="3.2" strokeLinecap="round"><line x1="50" y1="44" x2="92" y2="44" /><line x1="50" y1="52" x2="92" y2="52" /></g>
      {o(44, 48)}{o(98, 48)}
      <text x="71" y="92" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>O₂ : liés</text>
      <text x="170" y="52" fontSize="32" textAnchor="middle" fill={COL.gris}>⇄</text>
      {o(244, 48)}{o(298, 48)}
      <text x="271" y="92" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>2 O : séparés</text>
      <text x="170" y="136" fontSize="15" textAnchor="middle" fill={COL.gris}>énergie échangée dans chaque sens</text>
    </svg>);
}

// ---------- barres : pouvoir calorifique de chaque combustible (exploration) ----------
export function BarresPouvoir({ c = null }) {
  const L = C.COMBUSTIBLES.map(x => ({ x, v: C.pouvoirCalorifique(x) })), vmax = 55;
  return (
    <svg viewBox={`0 0 ${W} 282`} style={stl} role="img" aria-label={`Pouvoir calorifique estimé en MJ/kg : ${L.map(({ x, v }) => `${x.nom} ${nbf(v, 1)}`).join(', ')}.`}>
      {L.map(({ x, v }, i) => {
        const y = 6 + i * 34, sel = c && c.id === x.id;
        return (
          <g key={x.id}>
            <text x="102" y={y + 21} fontSize="15" textAnchor="end" fontWeight={sel ? 700 : 400} fill={COL.encre}>{x.nom}</text>
            <rect x="108" y={y + 4} width={v / vmax * 160} height="24" rx="4" fill={x.type === 'alcool' ? COL.orange : COL.bleu} opacity={c && !sel ? 0.55 : 1} />
            <text x={108 + v / vmax * 160 + 6} y={y + 22} fontSize="15" fontWeight="700" fill={COL.encre}>{nbf(v, 1)}{x.type === 'alcool' ? ' (alcool)' : ''}</text>
          </g>);
      })}
      <text x="108" y="256" fontSize="15" fill={COL.gris}>bleu : alcane · orange : alcool</text><text x="108" y="274" fontSize="15" fill={COL.gris}>valeurs en MJ/kg</text>
    </svg>);
}

// ---------- tableau de comptage des atomes (équation entière) ----------
export function TableauAtomes({ c }) {
  const a = C.atomes(c), k = C.coefficients(c);
  const lignes = [['C', `${a.C}`, `${k.CO2}`], ['H', `${a.H}`, `${k.H2O} × 2 = ${k.H2O * 2}`],
    ['O', `${a.O ? a.O + ' + ' : ''}${k.O2} × 2 = ${a.O + k.O2 * 2}`, `${k.CO2} × 2 + ${k.H2O} = ${k.CO2 * 2 + k.H2O}`]];
  const td = { padding: '4px 8px', border: `1px solid ${KIT.bord}`, fontSize: 14.5 };
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8, background: 'white' }}>
      <thead><tr><th style={{ ...td, background: '#f1f5f9' }}>atomes</th><th style={{ ...td, background: '#f1f5f9' }}>à gauche</th><th style={{ ...td, background: '#f1f5f9' }}>à droite</th></tr></thead>
      <tbody>{lignes.map(([e, g, d]) => <tr key={e}><td style={{ ...td, fontWeight: 700, textAlign: 'center' }}>{e}</td><td style={{ ...td, textAlign: 'center' }}>{g}</td><td style={{ ...td, textAlign: 'center' }}>{d}</td></tr>)}</tbody>
    </table>);
}
