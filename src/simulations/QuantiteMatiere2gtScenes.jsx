// ====================================================
//  Scènes (schémas animés par les réglages) de la simulation « Quantité de matière : compter les entités et la mole » (2GT, sim 178).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; textes ≥ 16 unités (viewBox de 480 de large).
// ====================================================
import { formuleTexte, COULEUR_ATOME, sci } from "./quantiteMatiere2gtModele";

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', encre: '#0f172a' };
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };
const alea = i => ((i * 7919 + 13) % 997) / 997;                 // pseudo-aléa déterministe (pas de saut d'un rendu à l'autre)

// Un objet du quotidien (centre x, y ; échelle s ; rotation rot)
export function Obj({ type = 'coq', x, y, s = 1, rot = 0 }) {
  const g = (c) => <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>{c}</g>;
  switch (type) {
    case 'coq': return g(<><path d="M-7,5 Q-8,-7 3,-7 Q9,-6 8,1" fill="none" stroke="#e8b04a" strokeWidth="5.2" strokeLinecap="round"/><path d="M-7,5 Q-8,-7 3,-7 Q9,-6 8,1" fill="none" stroke="#b7791f" strokeWidth="1" strokeLinecap="round" opacity="0.7"/></>);
    case 'lentille': return g(<><ellipse rx="6" ry="4.4" fill="#c2410c"/><ellipse rx="3" ry="1.8" cy="-1" fill="#fb923c" opacity="0.7"/></>);
    case 'riz': return g(<ellipse rx="7" ry="2.6" fill="#f5f0e1" stroke="#a8a29e" strokeWidth="0.8"/>);
    case 'perle': return g(<><circle r="5" fill="#7dd3fc" stroke="#0369a1" strokeWidth="1"/><circle r="1.6" cx="-1.6" cy="-1.6" fill="#fff" opacity="0.8"/></>);
    case 'trombone': return g(<path d="M-8,-3 L5,-3 Q8,-3 8,0 Q8,3 5,3 L-5,3 Q-7,3 -7,1 L-7,-1" fill="none" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round"/>);
    case 'vis': return g(<><rect x="-8" y="-2" width="14" height="4" fill="#94a3b8" stroke="#475569" strokeWidth="0.8"/><rect x="-10" y="-4" width="3" height="8" rx="1" fill="#64748b"/></>);
    default: return g(<circle r="6" fill="#334155" stroke="#0f172a"><title>bille</title></circle>);
  }
}
const TYPE_OBJ = { coquillette: 'coq', lentille: 'lentille', riz: 'riz', perle: 'perle', trombone: 'trombone', vis: 'vis', bille: 'bille' };
const typeObjet = id => TYPE_OBJ[id] || 'bille';
const tasDe = (cx, cy, k) => Array.from({ length: k }, (_, i) => ({ x: cx - 62 + alea(i) * 124, y: cy - 4 - alea(i + 211) * 36 + (alea(i) > 0.5 ? 0 : 6), r: alea(i + 91) * 180 }));

// ---------- scène 1 : un objet seul puis le tas, chacun sur sa balance ----------
export function SceneComptage({ id = 'coquillette', nom = 'coquillette', pluriel = 'coquillettes', mUne = '0,50 g', mTas = '45 g', nombreVisible = 28, tasInconnu = false }) {
  const t = typeObjet(id), k = Math.max(6, Math.min(40, nombreVisible));
  return (
    <svg viewBox="0 0 480 262" style={stl} role="img" aria-label={`Deux balances. À gauche, un seul objet (${nom}) : la balance affiche ${mUne}. À droite, le tas de ${pluriel} : la balance affiche ${tasInconnu ? 'une masse à lire' : mTas}. Le dessin ne montre que quelques objets du tas.`}>
      <rect x="40" y="150" width="170" height="36" rx="8" fill="#cbd5e1" stroke="#94a3b8"/>
      <rect x="86" y="158" width="78" height="20" rx="4" fill="#0f172a"/>
      <text x="125" y="174" fontSize="17" fontWeight="700" textAnchor="middle" fill="#86efac" style={{ fontFamily: 'monospace' }}>{mUne}</text>
      <ellipse cx="125" cy="144" rx="62" ry="7" fill="#94a3b8"/>
      <Obj type={t} x={125} y={124} s={2.6}/>
      <text x="125" y="214" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>1 {nom}</text>
      <rect x="270" y="150" width="170" height="36" rx="8" fill="#cbd5e1" stroke="#94a3b8"/>
      <rect x="316" y="158" width="78" height="20" rx="4" fill="#0f172a"/>
      <text x="355" y="174" fontSize="17" fontWeight="700" textAnchor="middle" fill="#86efac" style={{ fontFamily: 'monospace' }}>{mTas}</text>
      <ellipse cx="355" cy="144" rx="78" ry="7" fill="#94a3b8"/>
      <path d="M287,104 Q355,176 423,104 Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="2"/>
      {tasDe(355, 126, k).map((p, i) => <Obj key={i} type={t} x={p.x} y={p.y} s={1.15} rot={p.r}/>)}
      <text x="355" y="214" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>le tas de {pluriel}</text>
      <text x="240" y="248" fontSize="16" textAnchor="middle" fill="#334155">(dessin : seulement quelques objets du tas)</text>
    </svg>);
}

// ---------- scène 2 : des boîtes de 6 œufs ----------
export function SceneBoites({ boites = 4, k = 6, inconnu = false }) {
  const larg = 480 / Math.max(boites, 4), W = Math.min(104, larg - 12);
  return (
    <svg viewBox="0 0 480 220" style={stl} role="img" aria-label={`${boites} boîtes contenant chacune ${k} œufs.`}>
      <text x="240" y="26" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Chaque boîte contient {k} œufs</text>
      {Array.from({ length: boites }, (_, b) => {
        const x0 = 240 + (b - (boites - 1) / 2) * larg - W / 2;
        return <g key={b}>
          <rect x={x0} y="48" width={W} height="92" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2"/>
          {Array.from({ length: k }, (_, i) => <ellipse key={i} cx={x0 + W / 4 + (i % 2) * W / 2} cy={72 + Math.floor(i / 2) * 26} rx={W * 0.16} ry="11" fill="#fed7aa" stroke={COL.orange}/>)}
        </g>;
      })}
      <text x="240" y="176" fontSize="18" textAnchor="middle" fill="#334155">{inconnu ? 'Combien de boîtes pour 150 œufs ?' : `${boites} boîtes : ${boites} paquets de ${k} œufs`}</text>
      <text x="240" y="204" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.orange}>{inconnu ? '' : `${boites} × ${k} = ${boites * k} œufs`}</text>
    </svg>);
}

// ---------- scène 3 : une entité, puis un paquet (la mole) ----------
export function ScenePaquet() {
  const pts = Array.from({ length: 120 }, (_, i) => ({ x: 218 + alea(i) * 232, y: 52 + alea(i + 311) * 96 }));
  return (
    <svg viewBox="0 0 480 236" style={stl} role="img" aria-label="À gauche, une seule entité (un atome ou une molécule). À droite, un énorme paquet d’entités : une mole contient 6,02 fois 10 puissance 23 entités.">
      <rect x="18" y="40" width="140" height="118" rx="12" fill="#f8fafc" stroke="#94a3b8"/>
      <circle cx="88" cy="99" r="13" fill="#0369a1"/>
      <text x="88" y="190" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>1 entité</text>
      <text x="88" y="214" fontSize="16" textAnchor="middle" fill="#334155">atome, molécule…</text>
      <line x1="166" y1="99" x2="198" y2="99" stroke="#94a3b8" strokeWidth="3"/><polygon points="196,91 196,107 208,99" fill="#94a3b8"/>
      <rect x="208" y="40" width="258" height="118" rx="16" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2"/>
      {pts.map((p, i) => <circle key={i} cx={p.x + 6} cy={p.y + 6} r="4.2" fill={COL.bleu} opacity="0.8"/>)}
      <text x="337" y="190" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>1 mole d’entités</text>
      <text x="337" y="214" fontSize="16" textAnchor="middle" fill="#334155">un paquet énorme</text>
    </svg>);
}

// ---------- scène 4 : des paquets (moles), éventuellement incomplets ou inconnus ----------
export function ScenePaquets({ n = 0.5, inconnu = false, nom = 'n', texte = null }) {
  const nb = Math.max(1, Math.ceil(n - 1e-9)), larg = Math.min(130, 440 / nb - 10);
  const point = (b, i, plein) => ({ x: 18 + alea(i + b * 7) * (larg - 36) * plein, y: 16 + alea(i + 400 + b * 13) * 74 });
  return (
    <svg viewBox="0 0 480 224" style={stl} role="img" aria-label={inconnu ? 'Des paquets de 6,02 fois 10 puissance 23 entités : leur nombre est à trouver.' : `${String(n).replace('.', ',')} mole : ${nb} paquet${nb > 1 ? 's' : ''} de 6,02 fois 10 puissance 23 entités, le dernier est rempli à ${Math.round((n - (nb - 1)) * 100)} pour cent.`}>
      <text x="240" y="26" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Chaque paquet = 1 mol = 6,02 × 10²³ entités</text>
      {inconnu
        ? <g><rect x="170" y="44" width="140" height="106" rx="14" fill="white" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="7 5"/><text x="240" y="112" fontSize="54" fontWeight="700" textAnchor="middle" fill="#94a3b8">?</text></g>
        : Array.from({ length: nb }, (_, b) => {
          const x0 = 240 + (b - (nb - 1) / 2) * (larg + 10) - larg / 2, plein = b < nb - 1 ? 1 : n - (nb - 1), kk = Math.round(46 * plein);
          return <g key={b}>
            <rect x={x0} y="44" width={larg} height="106" rx="14" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2" strokeDasharray={plein < 0.999 ? '6 4' : undefined}/>
            {Array.from({ length: kk }, (_, i) => { const p = point(b, i, plein); return <circle key={i} cx={x0 + p.x} cy={44 + p.y} r="4.2" fill={COL.bleu} opacity="0.85"/>; })}
          </g>;
        })}
      <text x="240" y="184" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.orange}>{inconnu ? `${nom} = ? mol` : (texte || `${nom} = ${String(n).replace('.', ',')} mol`)}</text>
      <text x="240" y="210" fontSize="16" textAnchor="middle" fill="#334155">{inconnu ? 'combien de paquets ?' : nb > 1 || n >= 1 ? `${nb} paquet${nb > 1 ? 's' : ''}` : 'un paquet à moitié rempli'}</text>
    </svg>);
}

// ---------- scène 5 : les atomes d'une formule, avec la masse de chacun ----------
export function SceneAtomes({ e, MASSE_ATOME }) {
  const lignes = e.f.map(([a, k]) => ({ a, k }));
  const H = 26 + lignes.length * 50 + 6;
  return (
    <svg viewBox={`0 0 480 ${H}`} style={stl} role="img"
      aria-label={`Atomes de la ${e.nom} ${formuleTexte(e)} : ${lignes.map(l => `${l.k} atome${l.k > 1 ? 's' : ''} ${l.a}, de masse ${sci(MASSE_ATOME[l.a], 3)} kilogramme chacun`).join(' ; ')}.`}>
      {lignes.map(({ a, k }, r) => (
        <g key={a}>
          <text x="20" y={50 + r * 50} fontSize="18" fontWeight="700" fill={COL.encre}>{k} atome{k > 1 ? 's' : ''} {a}</text>
          {Array.from({ length: Math.min(k, 6) }, (_, i) => <circle key={i} cx={196 + i * 28} cy={44 + r * 50} r={a === 'H' ? 9 : 14} fill={COULEUR_ATOME[a] || COL.gris}/>)}
          {k > 6 && <text x={196 + 6 * 28} y={50 + r * 50} fontSize="16" fill="#334155">…</text>}
          <text x="462" y={50 + r * 50} fontSize="16" fontWeight="700" textAnchor="end" fill={COL.orange}>{sci(MASSE_ATOME[a], 3)} kg chacun</text>
        </g>))}
    </svg>);
}

// ---------- scène 6 : une balance (un seul objet ou échantillon) ----------
export function SceneBalance({ nom, masse, couleur = '#bae6fd' }) {
  return (
    <svg viewBox="0 0 480 214" style={stl} role="img" aria-label={`Balance : ${nom}, masse ${masse}.`}>
      <rect x="120" y="150" width="240" height="40" rx="8" fill="#cbd5e1" stroke="#94a3b8"/>
      <rect x="186" y="158" width="108" height="24" rx="4" fill="#0f172a"/>
      <text x="240" y="176" fontSize="19" fontWeight="700" textAnchor="middle" fill="#86efac" style={{ fontFamily: 'monospace' }}>{masse}</text>
      <ellipse cx="240" cy="144" rx="78" ry="8" fill="#94a3b8"/>
      <path d="M184,134 Q240,106 296,134 Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="2"/>
      <path d="M228,112 Q240,84 252,112 Q246,122 240,122 Q234,122 228,112 Z" fill={couleur} stroke="#0369a1" strokeWidth="1.4"/>
      <text x="240" y="44" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{nom}</text>
    </svg>);
}

// ---------- scène 7 : la chaîne masse → nombre d'entités → quantité de matière ----------
// Chaque case : texte (« 5,0 × 10⁻⁵ kg »), ou null pour une case à trouver (« ? ») ; couleurs : bleu = donnée, orange = case cherchée
export function SceneChaine({ m, N, n, mEnt, cherche = null, entiteNom = 'molécule' }) {
  const case_ = (x, titre, valeur, c, inconnu0) => {
    const inconnu = inconnu0 || valeur == null || valeur === '';          // case vide : on affiche « ? »
    return (
    <g>
      <rect x={x} y="34" width="130" height="86" rx="12" fill={inconnu ? 'white' : '#f8fafc'} stroke={c} strokeWidth="2.2" strokeDasharray={inconnu ? '7 5' : undefined}/>
      <text x={x + 65} y="58" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      <text x={x + 65} y="98" fontSize={valeur && valeur.length > 14 ? 16 : 18} fontWeight="700" textAnchor="middle" fill={inconnu ? '#94a3b8' : c}>{inconnu ? '?' : valeur}</text>
    </g>);
  };
  return (
    <svg viewBox="0 0 480 180" style={stl} role="img"
      aria-label={`Chaîne de calcul : masse de l’échantillon ${cherche === 'm' || m == null ? 'à trouver' : m}, nombre de ${entiteNom}s ${cherche === 'N' || N == null ? 'à trouver' : N}, quantité de matière ${cherche === 'n' || n == null ? 'à trouver' : n}.`}>
      {case_(8, 'masse m', m, COL.bleu, cherche === 'm')}
      {case_(175, `nombre N`, N, COL.bleu, cherche === 'N')}
      {case_(342, 'quantité n', n, COL.vert, cherche === 'n')}
      <line x1="142" y1="77" x2="170" y2="77" stroke="#64748b" strokeWidth="3"/><polygon points="168,69 168,85 180,77" fill="#64748b"/>
      <line x1="309" y1="77" x2="337" y2="77" stroke="#64748b" strokeWidth="3"/><polygon points="335,69 335,85 347,77" fill="#64748b"/>
      <text x="156" y="146" fontSize="16" fontWeight="700" textAnchor="middle" fill="#334155">÷ masse d’une {entiteNom}</text>
      {mEnt && <text x="156" y="166" fontSize="16" textAnchor="middle" fill="#334155">({mEnt})</text>}
      <text x="323" y="146" fontSize="16" fontWeight="700" textAnchor="middle" fill="#334155">÷ N<tspan dy="4" fontSize="14">A</tspan></text>
      <text x="323" y="166" fontSize="16" textAnchor="middle" fill="#334155">(6,02 × 10²³ par mole)</text>
    </svg>);
}
