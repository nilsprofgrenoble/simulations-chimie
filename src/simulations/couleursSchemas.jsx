// Schémas des cartes « À retenir » de la simulation 160 (Couleurs). viewBox de 300 de large, textes de 13,5 à 16 (≥ 11 px rendus à
// 390 px), plafond maxWidth 320. Les couleurs viennent du modèle (couleursModele.js). Bleu = donnée, vert = bon, rouge = piège.
import { rgb, COULEURS, traverse } from "./couleursModele";
import { C } from "./couleursStyle";
import { DisquesCorps } from "./couleursScenes";

const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8, border: `1px solid ${C.clair}` };
const T = p => <text fontSize="14.5" fill={C.encre} {...p}/>;
const Pastille = ({ x, y, c, w = 22 }) => <rect x={x} y={y} width={w} height="16" rx="3" fill={rgb(c)} stroke="#94a3b8"/>;
const BLANC = [1, 1, 1];

// ---------- carte 1 : synthèse additive ----------
export function SvgAdditive() {
  return (
    <svg viewBox="0 0 300 232" style={stl} role="img" aria-label="Synthèse additive : trois lampes rouge, verte et bleue sur un écran dans le noir. Rouge plus vert donne du jaune, vert plus bleu du cyan, rouge plus bleu du magenta, les trois ensemble du blanc.">
      <rect x="0" y="0" width="300" height="140" fill={C.nuit}/>
      <g transform="translate(150 70) scale(0.6) translate(-210 -118)"><DisquesCorps mode="add" id="sa"/></g>
      <T x="150" y="156" textAnchor="middle" fontWeight="800">Les lumières s’ajoutent</T>
      {[['rouge + vert', COULEURS.jaune, 'jaune'], ['vert + bleu', COULEURS.cyan, 'cyan'], ['rouge + bleu', COULEURS.magenta, 'magenta']].map(([t, c, n], i) => (
        <g key={n}><Pastille x={14 + i * 98} y="166" c={c} w="18"/><T x={36 + i * 98} y="179" fontSize="14.5">{n}</T><T x={14 + i * 98} y="197" fontSize="14.5" fill={C.gris}>{t}</T></g>))}
      <Pastille x="14" y="206" c={BLANC} w="18"/><T x="38" y="219" fontWeight="800">R + V + B = blanc</T>
    </svg>);
}

// ---------- carte 2 : couleurs complémentaires ----------
export function SvgComplementaires() {
  const cx = 150, cy = 122, R = 56;
  const roue = [['rouge', COULEURS.rouge], ['jaune', COULEURS.jaune], ['vert', COULEURS.vert], ['cyan', COULEURS.cyan], ['bleu', COULEURS.bleu], ['magenta', COULEURS.magenta]];
  const pt = (k, rr) => { const a = (-90 + k * 60) * Math.PI / 180; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; };
  return (
    <svg viewBox="0 0 300 272" style={stl} role="img" aria-label="Roue de six couleurs : rouge et cyan, vert et magenta, bleu et jaune sont complémentaires, face à face. Une couleur plus sa complémentaire donnent du blanc en lumière.">
      {[0, 1, 2].map(k => { const [x1, y1] = pt(k, R), [x2, y2] = pt(k + 3, R); return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.gris} strokeWidth="2" strokeDasharray="5 4"/>; })}
      {roue.map(([n, c], k) => { const [x, y] = pt(k, R), [lx, ly] = pt(k, R + 40); return (
        <g key={n}><circle cx={x} cy={y} r="17" fill={rgb(c)} stroke="#64748b" strokeWidth="1.5"/>
          <T x={Math.max(30, Math.min(270, lx))} y={ly + (k === 0 ? -2 : k === 3 ? 12 : 5)} textAnchor="middle" fontWeight="700">{n}</T></g>); })}
      <rect x="8" y="236" width="284" height="30" rx="8" fill="#f0fdf4" stroke={C.vert}/>
      <T x="150" y="256" textAnchor="middle" fontWeight="800" fill={C.vert}>couleur + complémentaire = blanc</T>
    </svg>);
}

// ---------- carte 3 : synthèse soustractive ----------
export function SvgSoustractive() {
  const lignes = [['jaune + cyan', traverse(COULEURS.jaune, COULEURS.cyan), 'vert'], ['cyan + magenta', traverse(COULEURS.cyan, COULEURS.magenta), 'bleu'], ['jaune + magenta', traverse(COULEURS.jaune, COULEURS.magenta), 'rouge'], ['les trois filtres', [0, 0, 0], 'noir']];
  return (
    <svg viewBox="0 0 300 262" style={stl} role="img" aria-label="Synthèse soustractive : trois filtres jaune, cyan et magenta sur une lumière blanche. Jaune et cyan donnent du vert, cyan et magenta du bleu, jaune et magenta du rouge, les trois du noir.">
      <g transform="translate(150 72) scale(0.6) translate(-210 -118)"><DisquesCorps mode="mult" id="ss"/></g>
      <T x="150" y="158" textAnchor="middle" fontWeight="800">Chaque filtre retire des radiations</T>
      {lignes.map(([t, c, n], i) => (
        <g key={n}><Pastille x={20} y={170 + i * 22} c={c} w="22"/><T x={52} y={183 + i * 22}>{t} = <tspan fontWeight="800">{n}</tspan></T></g>))}
    </svg>);
}

// ---------- carte 4 : choisir le modèle ----------
export function SvgModeles() {
  return (
    <svg viewBox="0 0 300 250" style={stl} role="img" aria-label="Choisir le modèle : synthèse additive pour les écrans et les projecteurs, qui émettent de la lumière ; synthèse soustractive pour les filtres, les encres d’imprimante et les peintures, qui absorbent une partie de la lumière blanche.">
      <rect x="6" y="6" width="140" height="238" rx="10" fill={C.nuit}/>
      <text x="76" y="28" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">ADDITIVE</text>
      <text x="76" y="50" textAnchor="middle" fontSize="14.5" fill={C.texteNuit}>sources de lumière</text>
      <text x="76" y="86" textAnchor="middle" fontSize="14.5" fill="#fde68a">écrans, projecteurs,</text>
      <text x="76" y="104" textAnchor="middle" fontSize="14.5" fill="#fde68a">LED, scène</text>
      <text x="76" y="138" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">R, V, B</text>
      <text x="76" y="158" textAnchor="middle" fontSize="14.5" fill={C.texteNuit}>trichromie</text>
      <g transform="translate(76 202) scale(0.34) translate(-210 -118)"><DisquesCorps mode="add" id="m1"/></g>
      <rect x="154" y="6" width="140" height="238" rx="10" fill="#f8fafc" stroke={C.clair} strokeWidth="2"/>
      <text x="224" y="28" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.encre}>SOUSTRACTIVE</text>
      <text x="224" y="50" textAnchor="middle" fontSize="14.5" fill={C.gris}>on absorbe</text>
      <text x="224" y="86" textAnchor="middle" fontSize="14.5" fill="#92400e">filtres, encres,</text>
      <text x="224" y="104" textAnchor="middle" fontSize="14.5" fill="#92400e">peintures</text>
      <text x="224" y="138" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.encre}>C, M, J (+ noir)</text>
      <text x="224" y="158" textAnchor="middle" fontSize="14.5" fill={C.gris}>imprimante</text>
      <g transform="translate(224 202) scale(0.34) translate(-210 -118)"><DisquesCorps mode="mult" id="m2"/></g>
    </svg>);
}

// ---------- carte 5 : couleur d'un objet opaque ----------
export function SvgObjet() {
  return (
    <svg viewBox="0 0 300 228" style={stl} role="img" aria-label="Un citron éclairé en lumière blanche reçoit du rouge, du vert et du bleu. Il absorbe le bleu et diffuse le rouge et le vert vers l’œil : il paraît jaune.">
      <T x="8" y="20" fontWeight="800">lumière blanche reçue</T>
      {[['R', 0, '#dc2626'], ['V', 1, '#16a34a'], ['B', 2, '#2563eb']].map(([l, i, c]) => (
        <g key={l}><T x="8" y={59 + i * 34} fontWeight="800" fill={c}>{l}</T><line x1="28" y1={54 + i * 34} x2="112" y2={54 + i * 34} stroke={c} strokeWidth="4"/><polygon points={`112,${48 + i * 34} 124,${54 + i * 34} 112,${60 + i * 34}`} fill={c}/></g>))}
      <path d="M 126 88 Q 172 40 218 88 Q 172 136 126 88 Z" fill={rgb(COULEURS.jaune)} stroke="#64748b" strokeWidth="1.5"/>
      <T x="172" y="158" textAnchor="middle" fontWeight="800" fill={C.rouge}>B absorbé</T>
      {[0, 1].map(i => <line key={i} x1="222" y1={78 + i * 20} x2="252" y2={78 + i * 20} stroke={['#dc2626', '#16a34a'][i]} strokeWidth="4"/>)}
      <ellipse cx="274" cy="88" rx="18" ry="13" fill="white" stroke="#64748b"/><circle cx="270" cy="88" r="5" fill={C.encre}/>
      <T x="236" y="52" textAnchor="middle" fontWeight="800" fill={C.vert}>R et V diffusés</T>
      <T x="172" y="196" textAnchor="middle" fontWeight="800">citron</T>
      <T x="172" y="216" textAnchor="middle" fill={C.gris}>(jaune en lumière blanche)</T>
    </svg>);
}

// ---------- carte 6 : absorption, diffusion, transmission ----------
export function SvgPhenomenes() {
  const bloc = (x, titre, corps) => (
    <g>
      <rect x={x} y="8" width="92" height="170" rx="8" fill="#f8fafc" stroke={C.clair}/>
      <text x={x + 46} y="28" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={C.encre}>{titre}</text>
      {corps}
    </g>);
  const fl = (x1, y1, x2, y2, c = '#f59e0b') => <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="3.5"/></g>;
  return (
    <svg viewBox="0 0 300 250" style={stl} role="img" aria-label="Trois phénomènes : l’absorption (la lumière s’arrête dans l’objet), la diffusion (l’objet renvoie la lumière dans toutes les directions), la transmission (la lumière traverse un milieu transparent).">
      {bloc(6, 'absorption', <g><rect x="34" y="60" width="52" height="86" rx="4" fill="#475569"/>{fl(16, 100, 40, 100)}<text x="52" y="166" textAnchor="middle" fontSize="14.5" fill={C.gris}>s’arrête</text></g>)}
      {bloc(104, 'diffusion', <g><rect x="132" y="60" width="26" height="86" rx="4" fill="#cbd5e1"/>{fl(116, 104, 132, 104)}{[[-30, 70], [-5, 62], [20, 70]].map(([dy], i) => <line key={i} x1="158" y1="104" x2="192" y2={104 + dy * 1.4} stroke="#f59e0b" strokeWidth="3"/>)}<text x="150" y="166" textAnchor="middle" fontSize="14.5" fill={C.gris}>renvoyée</text></g>)}
      {bloc(202, 'transmission', <g><rect x="228" y="60" width="40" height="86" rx="4" fill="#bfdbfe" opacity="0.8" stroke="#60a5fa"/>{fl(210, 104, 228, 104)}{fl(268, 104, 292, 104)}<text x="248" y="166" textAnchor="middle" fontSize="14.5" fill={C.gris}>traverse</text></g>)}
      <rect x="8" y="188" width="284" height="54" rx="8" fill="#eff6ff" stroke={C.bleu}/>
      <T x="150" y="208" textAnchor="middle" fontWeight="800" fill={C.bleu}>un verre vert transmet le vert,</T>
      <T x="150" y="228" textAnchor="middle" fontWeight="800" fill={C.bleu}>il absorbe le rouge et le bleu</T>
    </svg>);
}
