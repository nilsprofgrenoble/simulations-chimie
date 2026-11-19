// ====================================================
//  Scènes (schémas animés par les réglages) de la simulation « Quantité de matière : masse molaire, volume molaire » (1G, sim 152).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; textes ≥ 16 unités (viewBox de 480 de large).
// ====================================================
import { formuleTexte, COULEUR_ATOME } from "./quantiteMatiereModele";

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', clair: '#e2e8f0', encre: '#0f172a' };
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };
const alea = i => ((i * 7919 + 13) % 997) / 997;                 // pseudo-aléa déterministe (pas de saut d'un rendu à l'autre)

// ---------- scène 1 : une entité, puis un paquet (la mole) ----------
export function ScenePaquet() {
  const pts = Array.from({ length: 110 }, (_, i) => ({ x: 214 + alea(i) * 236, y: 52 + alea(i + 311) * 98 }));
  return (
    <svg viewBox="0 0 480 232" style={stl} role="img"
      aria-label="À gauche, une seule entité (un atome ou une molécule). À droite, un énorme paquet d’entités : une mole contient 6,02 fois 10 puissance 23 entités.">
      <rect x="18" y="40" width="140" height="118" rx="12" fill="#f8fafc" stroke="#94a3b8" />
      <circle cx="88" cy="99" r="13" fill="#0369a1" />
      <text x="88" y="188" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>1 entité</text>
      <text x="88" y="212" fontSize="18" textAnchor="middle" fill="#334155">atome, molécule, ion</text>
      <line x1="166" y1="99" x2="198" y2="99" stroke="#94a3b8" strokeWidth="3" /><polygon points="196,91 196,107 208,99" fill="#94a3b8" />
      <rect x="208" y="40" width="258" height="118" rx="16" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2" />
      {pts.map((p, i) => <circle key={i} cx={p.x + 6} cy={p.y + 6} r="4.2" fill={COL.bleu} opacity="0.8" />)}
      <text x="337" y="188" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>1 mole d’entités</text>
      <text x="337" y="212" fontSize="18" textAnchor="middle" fill="#334155">un paquet énorme</text>
    </svg>);
}

// ---------- scène 2 : trois échantillons contenant chacun une mole d'atomes ----------
export function SceneEchantillons({ masses }) {
  const ech = [['carbone', 'C', 12.0], ['sodium', 'Na', 23.0], ['cuivre', 'Cu', 63.5]];
  return (
    <svg viewBox="0 0 480 252" style={stl} role="img"
      aria-label={`Trois échantillons contenant chacun une mole d’atomes : du carbone, du sodium et du cuivre. ${masses ? 'Leurs masses : 12,0 grammes, 23,0 grammes et 63,5 grammes.' : 'Leur masse n’est pas encore indiquée.'}`}>
      <text x="240" y="26" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>Trois échantillons : 1 mol d’atomes chacun</text>
      {ech.map(([nom, s, m], i) => { const x = 80 + i * 160, c = { C: '#475569', Na: '#a855f7', Cu: '#c2410c' }[s]; return (
        <g key={s}>
          <path d={`M${x - 52},96 Q${x},134 ${x + 52},96 Z`} fill="#f1f5f9" stroke="#94a3b8" />
          <path d={`M${x - 34},96 Q${x},60 ${x + 34},96 Z`} fill={c} opacity="0.9" />
          <text x={x} y="162" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{nom} ({s})</text>
          <rect x={x - 54} y="176" width="108" height="44" rx="6" fill="#0f172a" />
          <text x={x} y="206" fontSize="20" fontWeight="700" textAnchor="middle" fill="#86efac" style={{ fontFamily: 'monospace' }}>{masses ? `${String(m).replace('.', ',')} g` : '? g'}</text>
          <text x={x} y="240" fontSize="18" textAnchor="middle" fill="#334155">masse lue</text>
        </g>); })}
    </svg>);
}

// ---------- scène 3 : les atomes d'une formule, comptés ----------
export function SceneAtomes({ e }) {
  const lignes = e.f.map(([a, k]) => ({ a, k }));
  const H = 20 + lignes.length * 40 + 8;
  return (
    <svg viewBox={`0 0 480 ${H}`} style={stl} role="img"
      aria-label={`Atomes de ${e.nom} ${formuleTexte(e)} : ${lignes.map(l => `${l.k} atome${l.k > 1 ? 's' : ''} de ${l.a}`).join(', ')}.`}>
      {lignes.map(({ a, k }, r) => (
        <g key={a}>
          <text x="22" y={52 + r * 40} fontSize="18" fontWeight="700" fill={COL.encre}>{k} {a}</text>
          {Array.from({ length: k }, (_, i) => <g key={i}>
            <circle cx={114 + i * 28} cy={46 + r * 40} r="12" fill={COULEUR_ATOME[a] || COL.gris} />
          </g>)}
        </g>))}
    </svg>);
}

// ---------- scène 4 : une balance ----------
export function SceneBalance({ nom, masse, couleur = '#e2e8f0', liquide = false, aria }) {
  return (
    <svg viewBox="0 0 480 214" style={stl} role="img" aria-label={aria || `Balance : ${nom}, masse ${masse}.`}>
      <rect x="120" y="150" width="240" height="40" rx="8" fill="#cbd5e1" stroke="#94a3b8" />
      <rect x="196" y="158" width="88" height="24" rx="4" fill="#0f172a" />
      <text x="240" y="177" fontSize="19" fontWeight="700" textAnchor="middle" fill="#86efac" style={{ fontFamily: 'monospace' }}>{masse}</text>
      <ellipse cx="240" cy="144" rx="78" ry="8" fill="#94a3b8" />
      {liquide
        ? <g><path d="M200,70 L206,134 Q240,142 274,134 L280,70 Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" /><path d="M203,96 L206,134 Q240,142 274,134 L277,96 Z" fill={couleur} opacity="0.75" /></g>
        : <g><path d="M184,134 Q240,100 296,134 Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" /><path d="M204,128 Q240,76 276,128 Z" fill={couleur} stroke="#475569" /></g>}
      <text x="240" y="40" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{nom}</text>
    </svg>);
}

// ---------- scène 5 : un ou deux flacons de gaz (même volume, mêmes conditions) ----------
export function SceneGaz({ flacons, titre }) {
  const n = flacons.length, w = 480 / n;
  const cases = (cx, k) => Array.from({ length: k }, (_, i) => ({ x: cx - 42 + (i % 7) * 14 + ((alea(i) - 0.5) * 5), y: 120 + Math.floor(i / 7) * 14 + ((alea(i + 50) - 0.5) * 5) }));
  return (
    <svg viewBox="0 0 480 246" style={stl} role="img"
      aria-label={`${titre || 'Flacons de gaz'} : ${flacons.map(f => `${f.nom} ${f.f}, ${f.vTxt}`).join(' ; ')}.`}>
      <text x="240" y="24" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      {flacons.map((fl, i) => { const cx = w * i + w / 2, k = fl.k || 1;
        const verre = `M${cx - 14},44 L${cx - 14},84 Q${cx - 60},100 ${cx - 60},138 L${cx - 60},182 Q${cx - 60},196 ${cx - 46},196 L${cx + 46},196 Q${cx + 60},196 ${cx + 60},182 L${cx + 60},138 Q${cx + 60},100 ${cx + 14},84 L${cx + 14},44 Z`;
        return (
        <g key={fl.f + i}>
          <g transform={`translate(${cx},196) scale(${k}) translate(${-cx},-196)`}>
            <path d={verre} fill={fl.inconnu ? 'white' : '#f0f9ff'} stroke="#64748b" strokeWidth="2" strokeDasharray={fl.inconnu ? '6 4' : undefined} />
            {!fl.inconnu && cases(cx, fl.points).map((p, j) => <circle key={j} cx={p.x} cy={p.y} r="4.5" fill={fl.couleur || COL.bleu} />)}
          </g>
          {fl.inconnu && <text x={cx} y="156" fontSize="44" fontWeight="700" textAnchor="middle" fill="#94a3b8">?</text>}
          <text x={cx} y="218" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{fl.f} · {fl.vTxt}</text>
          <text x={cx} y="238" fontSize="18" textAnchor="middle" fill="#334155">{fl.sous}</text>
        </g>); })}
    </svg>);
}

// ---------- scène 6 : une éprouvette graduée ----------
export function SceneLiquide({ nom, V, couleur = '#bae6fd', max = 30 }) {
  const Y = v => 190 - v * (150 / max);
  return (
    <svg viewBox="0 0 480 232" style={stl} role="img" aria-label={`Éprouvette graduée contenant ${V} mL de ${nom}.`}>
      <rect x="196" y="36" width="64" height="156" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
      <rect x="198" y={Y(V)} width="60" height={190 - Y(V)} fill={couleur} opacity="0.85" />
      {[0, 10, 20, 30].filter(g => g <= max).map(g => <g key={g}><line x1="260" y1={Y(g)} x2="276" y2={Y(g)} stroke="#475569" strokeWidth="2" /><text x="284" y={Y(g) + 6} fontSize="18" fill="#334155">{g}</text></g>)}
      <text x="316" y={Y(max) + 6} fontSize="18" fill="#334155">mL</text>
      <rect x="170" y="190" width="116" height="10" rx="4" fill="#94a3b8" />
      <text x="190" y="40" fontSize="18" fontWeight="700" textAnchor="end" fill={COL.encre}>{nom}</text>
      <line x1="198" y1={Y(V)} x2="258" y2={Y(V)} stroke={COL.orange} strokeWidth="2.5" />
      <text x="190" y={Y(V) + 6} fontSize="18" fontWeight="700" textAnchor="end" fill={COL.orange}>{String(V).replace('.', ',')} mL</text>
    </svg>);
}

// ---------- scène 7 : un mélange de deux constituants (deux béchers puis un seul) ----------
export function SceneMelange({ a, b, titre }) {
  const bec = (x, c, nom, txt) => (
    <g>
      <path d={`M${x - 40},60 L${x - 34},150 Q${x},158 ${x + 34},150 L${x + 40},60`} fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
      <path d={`M${x - 37},${150 - c.h} L${x - 34},150 Q${x},158 ${x + 34},150 L${x + 37},${150 - c.h} Z`} fill={c.col} opacity="0.75" />
      <text x={x} y="182" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{nom}</text>
      <text x={x} y="204" fontSize="18" textAnchor="middle" fill="#334155">{txt}</text>
    </g>);
  return (
    <svg viewBox="0 0 480 232" style={stl} role="img" aria-label={`${titre || 'Mélange'} : ${a.nom} (${a.txt}) et ${b.nom} (${b.txt}).`}>
      <text x="240" y="26" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      {bec(70, a, a.nom, a.txt)}
      <text x="154" y="116" fontSize="26" fontWeight="700" textAnchor="middle" fill="#334155">+</text>
      {bec(238, b, b.nom, b.txt)}
      <line x1="314" y1="110" x2="350" y2="110" stroke="#94a3b8" strokeWidth="3" /><polygon points="348,102 348,118 360,110" fill="#94a3b8" />
      <path d="M392,60 L398,150 Q420,158 442,150 L448,60" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
      <path d="M395,96 L398,150 Q420,158 442,150 L445,96 Z" fill="#a5b4fc" opacity="0.75" />
      <text x="420" y="182" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.encre}>mélange</text>
      <text x="420" y="204" fontSize="18" textAnchor="middle" fill="#334155">homogène</text>
    </svg>);
}
