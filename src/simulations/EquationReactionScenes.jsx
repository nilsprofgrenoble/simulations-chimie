// Scènes de la simulation 179 « Équation de réaction : écrire et ajuster » (2GT) : atomes en « bonshommes » colorés (AVANT / APRÈS),
// équation en tête de l'écran, coefficients réglables, tableau des atomes, schémas d'expériences.
// Les entités sont dessinées à l'échelle 1:1 en pixels (pas de réduction du texte sur téléphone) : un atome = un disque portant son symbole.
import { KIT, styleBoite } from "../commun";
import * as M from "./equationReactionModele";

const NB = M.NB;
const COL = { bleu: '#0b4f94', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a' };

// ---------- une entité : amas d'atomes ----------
const signeCharge = q => (q === 0 ? '' : `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}`);
function geometrie(id, u) {
  const e = M.ESPECES[id];
  if (!e.dessin) return null;
  const pts = e.dessin.map(([el, x, y]) => ({ el, x: x * u, y: y * u, r: M.COULEUR[el].r * u }));
  const x0 = Math.min(...pts.map(p => p.x - p.r)), x1 = Math.max(...pts.map(p => p.x + p.r));
  const y0 = Math.min(...pts.map(p => p.y - p.r)), y1 = Math.max(...pts.map(p => p.y + p.r));
  return { pts, x0, x1, y0, y1 };
}
// Éléments SVG d'une entité, centrée en (cx, cy) : réutilisable dans les schémas des cartes
export function AmasSvg({ id, cx = 0, cy = 0, u = 22, grise = false, police = 13 }) {
  const g = geometrie(id, u), e = M.ESPECES[id];
  if (!g) {
    const L = e.f.length * 8 + 16;
    return <g opacity={grise ? 0.45 : 1}><rect x={cx - L / 2} y={cy - 13} width={L} height={26} rx={13} fill="#e2e8f0" stroke={COL.gris} strokeWidth="1.5" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={police + 1} fontWeight="700" fill={COL.encre}>{e.f}</text></g>;
  }
  const mx = (g.x0 + g.x1) / 2, my = (g.y0 + g.y1) / 2;
  return (
    <g opacity={grise ? 0.4 : 1}>
      {g.pts.map((p, i) => { const c = M.COULEUR[p.el]; return (
        <g key={i}><circle cx={cx + p.x - mx} cy={cy + p.y - my} r={p.r} fill={c.fond} stroke={c.trait} strokeWidth="1.5" />
          <text x={cx + p.x - mx} y={cy + p.y - my + police * 0.36} textAnchor="middle" fontSize={police} fontWeight="700" fill={c.texte}>{p.el}</text></g>); })}
      {e.charge !== 0 && <text x={cx + (g.x1 - mx) + 1} y={cy - (my - g.y0) + 4} fontSize={police + 2} fontWeight="800" fill={e.charge > 0 ? COL.rouge : COL.bleu}>{signeCharge(e.charge)}</text>}
    </g>);
}
export function Entite({ id, u = 26, grise = false }) {
  const g = geometrie(id, u), e = M.ESPECES[id];
  if (!g) { const L = e.f.length * 8 + 16; return <svg width={L + 4} height={32} aria-hidden="true" focusable="false"><AmasSvg id={id} cx={(L + 4) / 2} cy={16} u={u} grise={grise} /></svg>; }
  const w = g.x1 - g.x0 + (e.charge !== 0 ? 18 : 4), h = g.y1 - g.y0 + 8;
  return <svg width={w} height={h} aria-hidden="true" focusable="false"><AmasSvg id={id} cx={(w - (e.charge !== 0 ? 14 : 0)) / 2 + 2} cy={h / 2} u={u} grise={grise} /></svg>;
}
export const Copies = ({ id, n, grise }) => (
  <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>{Array.from({ length: n }, (_, k) => <Entite key={k} id={id} grise={grise} />)}</span>);

// ---------- équation en tête de l'écran (texte HTML, blocs insécables) ----------
export const EquationTete = ({ texte, note, couleur = KIT.txt }) => (
  <div style={{ textAlign: 'center', padding: '4px 4px 8px' }} data-equation-tete="1">
    <div style={{ fontSize: 18, fontWeight: 700, color: couleur, lineHeight: 1.6 }}>{texte.split(' ').map((m, i) => <span key={i} style={{ whiteSpace: 'nowrap' }}>{m}{' '}</span>)}</div>
    {note && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>{note}</div>}
  </div>);

// ---------- avant / après : les atomes en bonshommes ----------
const Groupes = ({ r, coefs, debut, fin, grises = [], legende = true }) => {
  const ids = M.especesDe(r);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '6px 10px', justifyContent: 'center' }}>
      {ids.slice(debut, fin).map((id, k) => { const i = debut + k; return (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 8 }}>
          {k > 0 && <span style={{ fontSize: 18, fontWeight: 700, color: KIT.txt2, alignSelf: 'center' }}>+</span>}
          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Copies id={id} n={coefs[i]} grise={grises.includes(id)} />
            {legende && <span style={{ fontSize: 13, color: KIT.txt2, whiteSpace: 'nowrap' }}>{coefs[i] > 1 ? `${coefs[i]}${NB}` : ''}{M.ESPECES[id].f}</span>}
          </span>
        </span>); })}
    </div>);
};
export function AvantApres({ r, coefs, grises = [], legende = true, soustitre = true }) {
  const nr = r.reactifs.length, n = M.nbEspeces(r);
  const cadre = { flex: '1 1 150px', minWidth: 0, background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 12, padding: '6px 8px' };
  const titre = (t, s) => <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 800, color: COL.bleu, marginBottom: 4 }}>{t}{soustitre && <span style={{ fontWeight: 400, color: KIT.txt2 }}> ({s})</span>}</div>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'stretch' }}>
      <div style={cadre}>{titre('AVANT', 'réactifs')}<Groupes r={r} coefs={coefs} debut={0} fin={nr} grises={grises} legende={legende} /></div>
      <div style={cadre}>{titre('APRÈS', 'produits')}<Groupes r={r} coefs={coefs} debut={nr} fin={n} grises={grises} legende={legende} /></div>
    </div>);
}

// ---------- tableau : combien d'atomes avant et après ? ----------
export function TableauAtomes({ r, coefs, elements = null, charge = true }) {
  const b = M.bilan(r, coefs);
  const lignes = b.lignes.filter(l => !elements || elements.includes(l.el));
  const cel = { padding: '4px 6px', border: `1px solid ${KIT.bord}`, fontSize: 14.5, textAlign: 'center', whiteSpace: 'nowrap', color: KIT.txt };
  const th = { ...cel, background: '#f1f5f9', fontWeight: 700 };
  const pastille = ok => <td style={{ ...cel, fontWeight: 800, color: ok ? COL.vert : COL.rouge }}>{ok ? '✓ égal' : '✗ différent'}</td>;
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white', marginTop: 8 }} data-tableau-atomes="1">
      <thead><tr><th style={th}>atomes</th><th style={th}>avant</th><th style={th}>après</th><th style={th}> </th></tr></thead>
      <tbody>
        {lignes.map(l => <tr key={l.el}><td style={{ ...cel, fontWeight: 700 }}>{l.el}</td><td style={cel}>{l.g}</td><td style={cel}>{l.d}</td>{pastille(l.ok)}</tr>)}
        {charge && b.charge.present && <tr><td style={{ ...cel, fontWeight: 700 }}>charge</td><td style={cel}>{String(b.charge.g).replace('-', '−')}</td><td style={cel}>{String(b.charge.d).replace('-', '−')}</td>{pastille(b.charge.ok)}</tr>}
      </tbody>
    </table>);
}

// ---------- réglage des coefficients ----------
export function Coefficients({ r, coefs, setCoefs, editables, etats = true }) {
  const ids = M.especesDe(r);
  const maj = (i, d) => setCoefs(c => c.map((v, k) => (k === i ? Math.max(1, Math.min(9, v + d)) : v)));
  const bt = actif => ({ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${actif ? COL.bleu : KIT.bord}`, background: 'white', fontSize: 20, fontWeight: 800, color: COL.bleu, cursor: 'pointer', lineHeight: 1 });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', justifyContent: 'center', marginTop: 8 }} data-coefficients="1">
      {editables.map(i => (
        <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <button type="button" aria-label={`Diminuer le coefficient de ${M.ESPECES[ids[i]].nom}`} onClick={() => maj(i, -1)} disabled={coefs[i] <= 1} style={{ ...bt(true), opacity: coefs[i] <= 1 ? 0.4 : 1 }}>−</button>
          <strong aria-live="polite" style={{ minWidth: 22, textAlign: 'center', fontSize: 20, color: KIT.txt }}>{coefs[i]}</strong>
          <button type="button" aria-label={`Augmenter le coefficient de ${M.ESPECES[ids[i]].nom}`} onClick={() => maj(i, 1)} disabled={coefs[i] >= 9} style={{ ...bt(true), opacity: coefs[i] >= 9 ? 0.4 : 1 }}>＋</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: KIT.txt, whiteSpace: 'nowrap' }}>{M.ESPECES[ids[i]].f}{etats ? `(${M.ESPECES[ids[i]].etat})` : ''}</span>
        </div>))}
    </div>);
}

// ---------- verdict d'ajustement ----------
export function Verdict({ r, coefs }) {
  const b = M.bilan(r, coefs), min = M.estMinimale(r, coefs);
  if (b.ok && min) return <div role="status" style={{ textAlign: 'center', color: COL.vert, fontWeight: 700, fontSize: 14.5, marginTop: 6 }}>✓ Équation ajustée : autant d’atomes de chaque sorte avant et après{b.charge.present ? ', et la même charge' : ''}.</div>;
  if (b.ok) return <div role="status" style={{ textAlign: 'center', color: COL.orange, fontWeight: 700, fontSize: 14.5, marginTop: 6 }}>Ça marche, mais on peut simplifier : on écrit les plus petits nombres entiers possibles.</div>;
  const faux = b.lignes.filter(l => !l.ok).map(l => l.el);
  const dits = [faux.length ? `le nombre d’atomes ${faux.length > 1 ? 'de' : 'de'} ${faux.join(' et ')} n’est pas le même` : null, !b.charge.ok ? 'la charge n’est pas la même' : null].filter(Boolean);
  return <div role="status" style={{ textAlign: 'center', color: COL.orange, fontWeight: 700, fontSize: 14.5, marginTop: 6 }}>Pas encore ajustée : {dits.join(', et ')}.</div>;
}

// ---------- scène complète : équation, bonshommes, tableau, coefficients ----------
export function Equilibreur({ r, coefs, setCoefs, editables = [], etats = true, tableau = true, elements = null, charge = true, grises = [], inconnus = [], note, verdict = false, legende = true }) {
  return (
    <div>
      <EquationTete texte={M.equationTexte(r, coefs, { etats, inconnus })} note={note} />
      <AvantApres r={r} coefs={coefs} grises={grises} legende={legende} />
      {editables.length > 0 && setCoefs && <Coefficients r={r} coefs={coefs} setCoefs={setCoefs} editables={editables} etats={etats} />}
      {tableau && <TableauAtomes r={r} coefs={coefs} elements={elements} charge={charge} />}
      {verdict && <Verdict r={r} coefs={coefs} />}
    </div>);
}

// ---------- légende des états physiques ----------
export const LegendeEtats = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
    {[['(s)', 'solide'], ['(l)', 'liquide'], ['(g)', 'gaz'], ['(aq)', 'dissous dans l’eau']].map(([a, b]) => (
      <div key={a} style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '5px 8px', fontSize: 14.5, color: KIT.txt }}><strong>{a}</strong>{NB}: {b}</div>))}
  </div>);

// ---------- table de proportions : plusieurs fois la même réaction ----------
export function TableProportions({ r, coefs, lignes = [1, 2, 3] }) {
  const ids = M.especesDe(r);
  const cel = { padding: '4px 6px', border: `1px solid ${KIT.bord}`, fontSize: 14.5, textAlign: 'center', whiteSpace: 'nowrap', color: KIT.txt };
  const th = { ...cel, background: '#f1f5f9', fontWeight: 700 };
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white', marginTop: 8 }} data-table-proportions="1">
      <thead><tr><th style={th}>réactions</th>{ids.map((id, i) => <th key={i} style={th}>{M.ESPECES[id].f}</th>)}</tr></thead>
      <tbody>{lignes.map(k => <tr key={k}><td style={{ ...cel, fontWeight: 700 }}>{k}</td>{coefs.map((c, i) => <td key={i} style={cel}>{c * k}</td>)}</tr>)}</tbody>
    </table>);
}

// ---------- schémas d'expériences ----------
const stl = { width: '100%', maxWidth: 360, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8 };
function Bulles({ x, y, n = 5 }) {
  return <g fill="#ffffff" stroke="#0369a1" strokeWidth="1.5">{Array.from({ length: n }, (_, k) => <circle key={k} cx={x + (k % 2 ? 8 : -6) + (k % 3) * 3} cy={y - k * 17} r={3 + (k % 3)} />)}</g>;
}
// Tube à essais : métal dans l'acide, bulles de gaz ; deux tests à droite (l'élève lit des observations, les produits restent à identifier)
export function SceneTubeMetal({ metal = 'zinc' }) {
  return (
    <svg viewBox="0 0 300 200" style={stl} role="img" aria-label={`Un tube à essais contient de l’acide chlorhydrique et une lame de ${metal} ; des bulles de gaz se forment sur le métal. Deux tests : le gaz placé près d’une flamme fait « pop » ; le test des ions zinc, avec de la soude, donne un précipité blanc.`}>
      <text x="4" y="15" fontSize="14" fontWeight="700" fill={COL.encre}>tube à essais</text>
      <path d="M14 26 V136 a28 28 0 0 0 56 0 V26" fill="none" stroke={COL.gris} strokeWidth="3" />
      <path d="M17 78 V136 a25 25 0 0 0 50 0 V78 Z" fill="#dbeafe" />
      <rect x="35" y="70" width="12" height="78" rx="3" fill="#94a3b8" stroke={COL.gris} strokeWidth="1.5" />
      <Bulles x={58} y={140} n={4} />
      <text x="4" y="192" fontSize="14" fill={COL.encre}>acide chlorhydrique</text>
      <line x1="46" y1="72" x2="80" y2="50" stroke={COL.gris} strokeWidth="1.5" /><text x="82" y="54" fontSize="14" fontWeight="700" fill={COL.encre}>lame de {metal}</text>
      <line x1="64" y1="108" x2="80" y2="108" stroke={COL.bleu} strokeWidth="1.5" /><text x="82" y="106" fontSize="14" fontWeight="700" fill={COL.bleu}>bulles</text><text x="82" y="122" fontSize="14" fontWeight="700" fill={COL.bleu}>de gaz</text>
      <rect x="172" y="12" width="124" height="86" rx="10" fill="#eff6ff" stroke={COL.bleu} /><text x="234" y="33" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>Test des ions</text><text x="234" y="51" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>zinc (soude) :</text><text x="234" y="76" textAnchor="middle" fontSize="14" fill={COL.encre}>précipité blanc</text>
      <rect x="172" y="108" width="124" height="82" rx="10" fill="#fff7ed" stroke={COL.orange} /><text x="234" y="130" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>Gaz + flamme :</text><text x="234" y="152" textAnchor="middle" fontSize="14" fill={COL.encre}>« pop »</text><text x="234" y="174" textAnchor="middle" fontSize="14" fill={COL.encre}>(détonation)</text>
    </svg>);
}
// Calcaire : effervescence et eau de chaux
export function SceneTubeCalcaire() {
  return (
    <svg viewBox="0 0 300 200" style={stl} role="img" aria-label="Un tube contient des morceaux de calcaire dans de l’acide chlorhydrique : effervescence. Le gaz dégagé, envoyé dans de l’eau de chaux, la rend trouble.">
      <path d="M14 26 V128 a26 26 0 0 0 52 0 V26" fill="none" stroke={COL.gris} strokeWidth="3" />
      <path d="M17 70 V128 a23 23 0 0 0 46 0 V70 Z" fill="#dbeafe" />
      <circle cx="30" cy="134" r="8" fill="#e7e5e4" stroke={COL.gris} strokeWidth="1.5" /><circle cx="46" cy="138" r="6" fill="#e7e5e4" stroke={COL.gris} strokeWidth="1.5" />
      <Bulles x={40} y={124} n={4} />
      <path d="M66 22 H108 V104" fill="none" stroke={COL.gris} strokeWidth="3" />
      <path d="M84 96 V132 a22 22 0 0 0 44 0 V96" fill="none" stroke={COL.gris} strokeWidth="3" /><path d="M87 118 V132 a19 19 0 0 0 38 0 V118 Z" fill="#e2e8f0" />
      <text x="4" y="186" fontSize="14" fill={COL.encre}>calcaire + acide</text><text x="100" y="170" fontSize="14" fill={COL.encre}>eau de chaux</text>
      <rect x="148" y="24" width="148" height="62" rx="10" fill="#fff7ed" stroke={COL.orange} /><text x="222" y="46" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>Dans le tube :</text><text x="222" y="68" textAnchor="middle" fontSize="13" fill={COL.encre}>effervescence (gaz)</text>
      <rect x="148" y="98" width="148" height="62" rx="10" fill="#eff6ff" stroke={COL.bleu} /><text x="222" y="120" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>Eau de chaux :</text><text x="222" y="142" textAnchor="middle" fontSize="14" fill={COL.encre}>devient trouble</text>
    </svg>);
}
// Suivi de température : A monte, B baisse (valeurs d'exemple)
export function SceneTemperature() {
  const X = t => 46 + t * 2.4, Y = T => 170 - (T - 10) * 6;
  const A = [[0, 20], [10, 24.5], [20, 26], [40, 26.4], [60, 26.5], [100, 26.5]], B = [[0, 20], [10, 16.5], [20, 15.5], [40, 15.1], [60, 15], [100, 15]];
  const ligne = P => P.map(([t, T]) => `${X(t)},${Y(T)}`).join(' ');
  return (
    <svg viewBox="0 0 300 236" style={stl} role="img" aria-label="Deux courbes de température en fonction du temps. Transformation A : la température passe de 20,0 à 26,5 degrés Celsius. Transformation B : la température passe de 20,0 à 15,0 degrés Celsius.">
      <line x1="46" y1="22" x2="46" y2="190" stroke={COL.encre} strokeWidth="1.8" /><line x1="46" y1="190" x2="292" y2="190" stroke={COL.encre} strokeWidth="1.8" />
      {[10, 20, 30].map(T => <g key={T}><line x1="42" y1={Y(T)} x2="46" y2={Y(T)} stroke={COL.encre} /><text x="38" y={Y(T) + 5} textAnchor="end" fontSize="14" fill={COL.encre}>{T}</text></g>)}
      <line x1="46" y1={Y(20)} x2="292" y2={Y(20)} stroke="#94a3b8" strokeDasharray="4 4" />
      <text x="4" y="14" fontSize="14" fontWeight="700" fill={COL.encre}>T (°C)</text><text x="292" y="210" textAnchor="end" fontSize="14" fontWeight="700" fill={COL.encre}>temps</text>
      <polyline points={ligne(A)} fill="none" stroke={COL.orange} strokeWidth="3" /><polyline points={ligne(B)} fill="none" stroke={COL.bleu} strokeWidth="3" />
      <text x="58" y={Y(30) - 2} fontSize="14" fontWeight="700" fill={COL.orange}>A : acide + soude</text>
      <text x="96" y="162" fontSize="14" fontWeight="700" fill={COL.bleu}>B : acide citrique +</text><text x="96" y="179" fontSize="14" fontWeight="700" fill={COL.bleu}>bicarbonate de soude</text>
      <text x="150" y="230" textAnchor="middle" fontSize="14" fill={COL.gris}>valeurs d’exemple (thermomètre)</text>
    </svg>);
}
// Bandeau « à droite » pour les observations
export const Observations = ({ titre, lignes }) => (
  <div style={{ ...styleBoite, marginTop: 8 }}>
    <div style={{ fontSize: 14.5, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{titre}</div>
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>{lignes.map((l, i) => <li key={i}>{l}</li>)}</ul>
  </div>);
