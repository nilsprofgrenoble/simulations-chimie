// Scènes SVG de la simulation 160 « Couleurs » : disques de lumière, loupe sur un écran, œil, éclairage d'un objet, barres des trois bandes.
// Les couleurs affichées viennent du modèle (couleursModele.js) : les dessins ne peuvent pas le contredire.
// Illustration : les couleurs de l'écran du simulateur ne sont qu'une représentation approchée des couleurs réelles.
import { rgb, additif, traverse, nomCouleur, COULEURS } from "./couleursModele";

import { C, stl, texteSur } from "./couleursStyle";
const BLANC = [1, 1, 1];

// ───────────── Disques de lumière qui se superposent ─────────────
//  mode 'add'  : lampes sur écran dans le noir, les intensités s'ajoutent ;
//  mode 'mult' : filtres sur fond blanc, les transmissions se multiplient.
//  sources : 2 ou 3 vecteurs (ou null) ; noms : étiquettes ; masque : zones de recouvrement cachées (« ? »).
export function Disques({ id, sources, noms, mode = 'add', masque = false, cx = 210, cy = 118, r = 70, hauteur = 262, titre, label }) {
  const n = sources.length;
  const pos = n === 3 ? [[cx - 0.55 * r, cy - 0.32 * r], [cx + 0.55 * r, cy - 0.32 * r], [cx, cy + 0.62 * r]] : [[cx - 0.55 * r, cy], [cx + 0.55 * r, cy]];
  const add = mode === 'add';
  const mix = idx => (add ? additif(...idx.map(i => sources[i])) : idx.map(i => sources[i]).reduce((a, s) => traverse(a, s), BLANC));
  const fond = add ? C.nuit : 'white', txt = add ? C.texteNuit : C.encre;
  const paires = n === 3 ? [[0, 1], [0, 2], [1, 2]] : [[0, 1]];
  const hachure = `${id}-h`;
  const centrePaire = ([a, b]) => [(pos[a][0] + pos[b][0]) / 2, (pos[a][1] + pos[b][1]) / 2];
  const centre3 = n === 3 ? [(pos[0][0] + pos[1][0] + pos[2][0]) / 3, (pos[0][1] + pos[1][1] + pos[2][1]) / 3] : null;
  const sourceEtiq = n === 3 ? [[4, 22, 'start'], [416, 22, 'end'], [pos[2][0], pos[2][1] + r + 18, 'middle']] : null;
  const etiq2 = [[4, 22, 'start'], [416, 22, 'end']];
  const etiqs = n === 3 ? sourceEtiq : etiq2;
  return (
    <svg viewBox={`0 0 420 ${hauteur}`} style={stl} role="img" aria-label={label || titre}>
      <defs>
        {sources.map((_, i) => <clipPath key={i} id={`${id}-c${i}`}><circle cx={pos[i][0]} cy={pos[i][1]} r={r}/></clipPath>)}
        <pattern id={hachure} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#cbd5e1"/><rect width="3" height="8" fill="#94a3b8"/></pattern>
      </defs>
      <rect width="420" height={hauteur} rx="8" fill={fond}/>
      {sources.map((s, i) => <circle key={i} cx={pos[i][0]} cy={pos[i][1]} r={r} fill={s ? rgb(s) : 'none'} stroke={add ? '#64748b' : '#94a3b8'} strokeWidth="1.5" strokeDasharray={s && (add ? s.some(x => x > 0) : true) ? '' : '5 4'}/>)}
      {paires.map(([a, b]) => (
        <circle key={`${a}${b}`} cx={pos[a][0]} cy={pos[a][1]} r={r} clipPath={`url(#${id}-c${b})`} fill={masque ? `url(#${hachure})` : rgb(mix([a, b]))}/>))}
      {n === 3 && <g clipPath={`url(#${id}-c1)`}><circle cx={pos[0][0]} cy={pos[0][1]} r={r} clipPath={`url(#${id}-c2)`} fill={masque ? `url(#${hachure})` : rgb(mix([0, 1, 2]))}/></g>}
      {masque && paires.map(p => { const [x, y] = centrePaire(p); return <text key={p.join('')} x={x} y={y + 8} textAnchor="middle" fontSize="28" fontWeight="800" fill={C.encre}>?</text>; })}
      {masque && n === 3 && <text x={centre3[0]} y={centre3[1] + 8} textAnchor="middle" fontSize="28" fontWeight="800" fill={C.encre}>?</text>}
      {noms.map((t, i) => <text key={i} x={etiqs[i][0]} y={etiqs[i][1]} textAnchor={etiqs[i][2]} fontSize="18" fontWeight="700" fill={txt}>{t}</text>)}
    </svg>);
}

// ───────────── Barres des trois bandes (R, V, B) ─────────────
//  groupes : [{ titre, v: [r, v, b] ou null (caché) }], jusqu'à 3 groupes de 140 de large.
export function BandesTrois({ groupes, label }) {
  const H = 70, y0 = 98;
  return (
    <svg viewBox="0 0 420 138" style={{ ...stl, background: 'white', border: `1px solid ${C.clair}` }} role="img" aria-label={label || 'Intensité des trois bandes rouge, verte et bleue'}>
      {groupes.map((g, k) => {
        const gx = k * 140 + 10;
        return (
          <g key={k}>
            <text x={gx + 60} y="20" textAnchor="middle" fontSize="18" fontWeight="800" fill={C.encre}>{g.titre}</text>
            {[0, 1, 2].map(i => {
              const x = gx + 6 + i * 40, h = g.v ? Math.max(0, Math.min(1, g.v[i])) * H : 0;
              return (
                <g key={i}>
                  <rect x={x} y={y0 - H} width="28" height={H} rx="3" fill="#f1f5f9" stroke={C.clair} strokeDasharray={g.v ? '' : '4 3'}/>
                  {g.v && h > 0 && <rect x={x} y={y0 - h} width="28" height={h} rx="3" fill={C.bandes[i]}/>}
                  {g.v && h === 0 && <text x={x + 14} y={y0 - 6} textAnchor="middle" fontSize="17" fill={C.gris}>0</text>}
                  {!g.v && <text x={x + 14} y={y0 - H / 2 + 8} textAnchor="middle" fontSize="26" fontWeight="800" fill={C.gris}>?</text>}
                  <text x={x + 14} y={y0 + 20} textAnchor="middle" fontSize="19" fontWeight="800" fill={C.bandes[i]}>{['R', 'V', 'B'][i]}</text>
                </g>);
            })}
          </g>);
      })}
    </svg>);
}

// ───────────── Loupe sur un écran : sous-pixels rouge, vert, bleu ─────────────
export function ScenePixels({ cible = COULEURS.jaune, revele = false }) {
  const px = [0, 1, 2, 3];
  return (
    <svg viewBox="0 0 420 246" style={{ ...stl, background: '#0b1220' }} role="img"
      aria-label={revele ? 'Quatre pixels vus à la loupe : chaque pixel a trois sous-pixels rouge, vert et bleu, allumés ou éteints' : 'Quatre pixels vus à la loupe : chaque pixel a trois sous-pixels rouge, vert et bleu, dont l’état est à trouver'}>
      <text x="210" y="24" textAnchor="middle" fontSize="18" fontWeight="700" fill={C.texteNuit}>Quatre pixels de l’écran à la loupe</text>
      {px.map(p => [0, 1, 2].map(i => {
        const x = 22 + p * 98 + i * 28, allume = cible[i] > 0.5;
        const fill = revele ? (allume ? ['#ef4444', '#22c55e', '#3b82f6'][i] : '#1e293b') : '#64748b';
        return (
          <g key={`${p}${i}`}>
            <rect x={x} y="40" width="26" height="92" rx="3" fill={fill} stroke="#94a3b8" strokeWidth="1"/>
            <text x={x + 13} y="92" textAnchor="middle" fontSize="19" fontWeight="800" fill={revele && !allume ? '#94a3b8' : 'white'}>{['R', 'V', 'B'][i]}</text>
            {revele && <text x={x + 13} y="154" textAnchor="middle" fontSize="19" fill={allume ? '#fde68a' : '#94a3b8'}>{allume ? '●' : '○'}</text>}
          </g>);
      }))}
      <text x="210" y="182" textAnchor="middle" fontSize="16" fill={C.texteNuit}>R rouge, V vert, B bleu : 1 pixel = 3 sous-pixels{revele ? ' (● allumé, ○ éteint)' : ''}</text>
      <text x="22" y="226" fontSize="18" fontWeight="700" fill={C.texteNuit}>Vu de loin :</text>
      <rect x="150" y="204" width="130" height="34" rx="5" fill={revele ? rgb(cible) : '#64748b'} stroke="#94a3b8"/>
      <text x="215" y="228" textAnchor="middle" fontSize="18" fontWeight="800" fill={revele ? texteSur(cible) : 'white'}>{revele ? nomCouleur(cible) : '?'}</text>
    </svg>);
}

// ───────────── L'œil et les cellules de la rétine (schéma simplifié) ─────────────
export function SceneOeil() {
  return (
    <svg viewBox="0 0 420 268" style={{ ...stl, background: 'white', border: `1px solid ${C.clair}` }} role="img"
      aria-label="Schéma simplifié de l’œil : la lumière entre par la cornée et le cristallin, et arrive sur la rétine. Un agrandissement de la rétine montre trois types de cônes, sensibles au rouge, au vert et au bleu, et deux bâtonnets.">
      <ellipse cx="120" cy="100" rx="80" ry="58" fill="#fffbeb" stroke={C.gris} strokeWidth="2.5"/>
      <path d="M 54 66 Q 20 100 54 134" fill="#e0f2fe" stroke={C.gris} strokeWidth="2.5"/>
      <ellipse cx="78" cy="100" rx="8" ry="24" fill="#bae6fd" stroke={C.gris} strokeWidth="1.5"/>
      <path d="M 170 53 A 80 58 0 0 1 170 147" fill="none" stroke="#f472b6" strokeWidth="6"/>
      {[84, 100, 116].map(y => <line key={y} x1="2" y1={y} x2="66" y2={y} stroke="#f59e0b" strokeWidth="2"/>)}
      {[[84, 160, 91], [100, 188, 100], [116, 160, 109]].map(([y, x2, y2]) => <line key={y} x1="86" y1={y === 100 ? 100 : y === 84 ? 92 : 108} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3"/>)}
      <text x="100" y="18" textAnchor="middle" fontSize="18" fontWeight="700" fill={C.encre}>œil</text>
      <line x1="200" y1="100" x2="258" y2="100" stroke={C.gris} strokeDasharray="4 4"/>
      <circle cx="330" cy="100" r="76" fill="#fdf2f8" stroke="#db2777" strokeWidth="2"/>
      {[[296, '#dc2626'], [326, '#16a34a'], [356, '#2563eb']].map(([x, c]) => <path key={c} d={`M ${x} 56 L ${x - 11} 100 L ${x + 11} 100 Z`} fill={c}/>)}
      {[311, 341].map(x => <rect key={x} x={x - 5} y="108" width="10" height="46" rx="5" fill="#64748b"/>)}
      <text x="330" y="190" textAnchor="middle" fontSize="17" fill={C.gris}>rétine agrandie</text>
      <path d="M 14 214 L 30 214 L 22 198 Z" fill="#dc2626"/><path d="M 34 214 L 50 214 L 42 198 Z" fill="#16a34a"/><path d="M 54 214 L 70 214 L 62 198 Z" fill="#2563eb"/>
      <text x="80" y="210" fontSize="18" fontWeight="700" fill={C.encre}>cônes : 3 types, la couleur</text>
      <text x="80" y="230" fontSize="17" fill={C.gris}>sensibles au rouge, vert, bleu</text>
      <rect x="14" y="240" width="10" height="20" rx="5" fill="#64748b"/>
      <text x="80" y="256" fontSize="18" fontWeight="700" fill={C.encre}>bâtonnets : sans couleur</text>
    </svg>);
}

// ───────────── Formes des objets ─────────────
function Forme({ forme, cx, cy, fill }) {
  const st = { fill, stroke: '#94a3b8', strokeWidth: 1.5 };
  if (forme === 'rond') return <circle cx={cx} cy={cy} r="34" {...st}/>;
  if (forme === 'citron') return <path d={`M ${cx - 44} ${cy} Q ${cx} ${cy - 44} ${cx + 44} ${cy} Q ${cx} ${cy + 44} ${cx - 44} ${cy} Z`} {...st}/>;
  if (forme === 'long') return <rect x={cx - 44} y={cy - 17} width="88" height="34" rx="17" transform={`rotate(-20 ${cx} ${cy})`} {...st}/>;
  if (forme === 'fleur') return <g>{[0, 45, 90, 135].map(a => <ellipse key={a} cx={cx} cy={cy} rx="38" ry="12" transform={`rotate(${a} ${cx} ${cy})`} {...st}/>)}<circle cx={cx} cy={cy} r="9" fill="#1e293b" stroke="#94a3b8"/></g>;
  if (forme === 'ballon') return <g><ellipse cx={cx} cy={cy - 4} rx="30" ry="38" {...st}/><path d={`M ${cx - 6} ${cy + 36} L ${cx + 6} ${cy + 36} L ${cx} ${cy + 28} Z`} {...st}/></g>;
  if (forme === 'feuille') return <g><path d={`M ${cx - 28} ${cy - 38} H ${cx + 12} L ${cx + 28} ${cy - 22} V ${cy + 38} H ${cx - 28} Z`} {...st}/><path d={`M ${cx + 12} ${cy - 38} V ${cy - 22} H ${cx + 28}`} fill="none" stroke="#94a3b8" strokeWidth="1.5"/></g>;
  return <rect x={cx - 32} y={cy - 38} width="64" height="76" rx="5" {...st} strokeWidth="4"/>;   // ardoise
}

// ───────────── Une lampe éclaire un objet opaque ou un verre transparent ─────────────
//  lum : intensités de la lumière envoyée ; prop : part diffusée (objet) ou transmise (verre) ; revele : montre la lumière renvoyée
//  et la couleur perçue ; sinon, la lumière renvoyée est cachée (« ? ») et l'objet est dessiné de la couleur qu'il a en lumière blanche.
export function SceneObjet({ lum, prop, propBlanc, forme = 'rond', transparent = false, revele = true, nom, nomLampe = 'lampe' }) {
  const renv = traverse(lum, prop), allumee = lum.some(x => x > 0.05);
  const couleurObjet = revele ? rgb(renv) : rgb(propBlanc || prop);
  const faisceau = c => (c.some(x => x > 0.05) ? rgb(c) : 'none');
  const cx = 232, cy = 112, eyeX = 372;
  return (
    <svg viewBox="0 0 420 220" style={{ ...stl, background: C.nuit }} role="img"
      aria-label={`${nomLampe} qui éclaire ${nom}${transparent ? ' : la lumière traverse le verre' : ' : l’objet diffuse de la lumière vers l’œil'}${revele ? `. Couleur perçue : ${nomCouleur(renv)}.` : '. La couleur perçue est à trouver.'}`}>
      <text x="210" y="18" textAnchor="middle" fontSize="17" fill="#94a3b8">pièce sans autre lumière</text>
      <rect x="10" y="94" width="52" height="38" rx="5" fill="#475569" stroke="#94a3b8"/>
      <ellipse cx="62" cy="113" rx="6" ry="17" fill={allumee ? rgb(lum) : '#1e293b'} stroke="#94a3b8"/>
      {allumee && <polygon points={`64,100 64,126 ${transparent ? 200 : 198},166 ${transparent ? 200 : 198},60`} fill={faisceau(lum)} opacity="0.55"/>}
      <text x="8" y="206" fontSize="18" fontWeight="700" fill={C.texteNuit}>{nomLampe}</text>
      {transparent ? (
        <g>
          <rect x="198" y="60" width="26" height="106" rx="3" fill={rgb(propBlanc || prop)} opacity="0.75" stroke="#e2e8f0" strokeWidth="1.5"/>
          {revele && renv.some(x => x > 0.05) && <polygon points={`224,${cy - 20} 224,${cy + 20} ${eyeX - 26},${cy + 8} ${eyeX - 26},${cy - 8}`} fill={rgb(renv)} opacity="0.7"/>}
          {!revele && <g><line x1="230" y1={cy} x2={eyeX - 28} y2={cy} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"/><text x="300" y={cy - 10} textAnchor="middle" fontSize="26" fontWeight="800" fill="#e2e8f0">?</text></g>}
        </g>
      ) : (
        <g>
          <Forme forme={forme} cx={cx} cy={cy} fill={couleurObjet}/>
          {revele && renv.some(x => x > 0.05) && [-16, 0, 16].map(dy => <line key={dy} x1={cx + 40} y1={cy + dy} x2={eyeX - 30} y2={cy + dy * 0.3} stroke={rgb(renv)} strokeWidth="3" markerEnd="url(#fleche-objet)"/>)}
          {!revele && <g><line x1={cx + 42} y1={cy} x2={eyeX - 28} y2={cy} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"/><text x="320" y={cy - 10} textAnchor="middle" fontSize="26" fontWeight="800" fill="#e2e8f0">?</text></g>}
        </g>
      )}
      <ellipse cx={eyeX} cy={cy} rx="22" ry="15" fill="#f8fafc" stroke="#94a3b8"/>
      <circle cx={eyeX - 5} cy={cy} r="7" fill={revele ? '#0f172a' : '#334155'}/>
      <text x={eyeX} y={cy + 38} textAnchor="middle" fontSize="18" fontWeight="700" fill={C.texteNuit}>œil</text>
      <text x={cx} y={transparent ? 190 : 176 + (forme === 'ballon' ? 10 : 0)} textAnchor="middle" fontSize="18" fontWeight="700" fill={C.texteNuit}>{nom}</text>
      <rect x="316" y="164" width="98" height="28" rx="5" fill={revele ? rgb(renv) : '#475569'} stroke="#94a3b8"/>
      <text x="365" y="184" textAnchor="middle" fontSize="16" fontWeight="700" fill={revele ? texteSur(renv) : 'white'}>{revele ? nomCouleur(renv) : 'perçu : ?'}</text>
      <defs><marker id="fleche-objet" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="#e2e8f0"/></marker></defs>
    </svg>);
}

// ───────────── Une lumière blanche traverse un ou deux filtres ─────────────
//  filtres : liste de vecteurs de transmission (1 ou 2) ; revele : montre la lumière transmise.
export function SceneFiltres({ filtres, noms, revele = true }) {
  const sortie = filtres.reduce((a, f) => traverse(a, f), BLANC);
  const sombre = !sortie.some(x => x > 0.05);
  const xs = filtres.length === 2 ? [150, 200] : [180];
  return (
    <svg viewBox="0 0 420 200" style={{ ...stl, background: C.nuit }} role="img"
      aria-label={`Une lumière blanche traverse ${noms.join(' puis ')}${revele ? `. Lumière transmise : ${nomCouleur(sortie)}.` : '. La couleur transmise est à trouver.'}`}>
      <rect x="10" y="74" width="50" height="38" rx="5" fill="#475569" stroke="#94a3b8"/>
      <ellipse cx="60" cy="93" rx="6" ry="17" fill="white" stroke="#94a3b8"/>
      <polygon points={`64,80 64,106 ${xs[0]},120 ${xs[0]},66`} fill="white" opacity="0.5"/>
      {xs.map((x, i) => (
        <g key={i}>
          <rect x={x} y="56" width="24" height="74" rx="3" fill={rgb(filtres[i])} opacity="0.85" stroke="#e2e8f0" strokeWidth="1.5"/>
          <text x={x + 12} y="46" textAnchor="middle" fontSize="17" fontWeight="700" fill={C.texteNuit}>{filtres.length === 2 ? ['1er', '2e'][i] : ''}</text>
        </g>))}
      {revele ? (!sombre && <polygon points={`${xs[xs.length - 1] + 24},68 ${xs[xs.length - 1] + 24},118 330,108 330,78`} fill={rgb(sortie)} opacity="0.75"/>)
        : <g><line x1={xs[xs.length - 1] + 28} y1="93" x2="326" y2="93" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"/><text x="300" y="82" textAnchor="middle" fontSize="26" fontWeight="800" fill="#e2e8f0">?</text></g>}
      <rect x="330" y="66" width="84" height="54" rx="6" fill={revele ? rgb(sortie) : '#475569'} stroke="#94a3b8"/>
      <text x="372" y="99" textAnchor="middle" fontSize="16" fontWeight="800" fill={revele ? texteSur(sortie) : 'white'}>{revele ? nomCouleur(sortie) : '?'}</text>
      <text x="8" y="160" fontSize="18" fontWeight="700" fill={C.texteNuit}>lumière blanche</text>
      <text x="210" y="184" textAnchor="middle" fontSize="18" fontWeight="700" fill={C.texteNuit}>{noms.join(' puis ')}</text>
    </svg>);
}

// ───────────── Les deux modèles, côte à côte (sans exemples : sert d'illustration à la question « quel modèle ? ») ─────────────
export function ModelesDeux({ exemples = false }) {
  return (
    <svg viewBox="0 0 300 230" style={{ ...stl, maxWidth: 320, background: 'white', border: `1px solid ${C.clair}` }} role="img"
      aria-label="Deux modèles : la synthèse additive ajoute des lumières à partir du noir ; la synthèse soustractive retire des radiations à une lumière blanche.">
      <rect x="6" y="6" width="140" height="218" rx="10" fill={C.nuit}/>
      <text x="76" y="28" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">ADDITIVE</text>
      <g transform="translate(76 86) scale(0.5) translate(-210 -118)"><DisquesCorps mode="add"/></g>
      <text x="76" y="158" textAnchor="middle" fontSize="14.5" fontWeight="700" fill={C.texteNuit}>on part du noir,</text>
      <text x="76" y="176" textAnchor="middle" fontSize="14.5" fontWeight="700" fill={C.texteNuit}>on ajoute</text><text x="76" y="194" textAnchor="middle" fontSize="14.5" fontWeight="700" fill={C.texteNuit}>des lumières</text>
      {exemples && <text x="76" y="214" textAnchor="middle" fontSize="14.5" fill="#fde68a">écrans, projecteurs</text>}
      <rect x="154" y="6" width="140" height="218" rx="10" fill="#f8fafc" stroke={C.clair} strokeWidth="2"/>
      <text x="224" y="28" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.encre}>SOUSTRACTIVE</text>
      <g transform="translate(224 86) scale(0.5) translate(-210 -118)"><DisquesCorps mode="mult"/></g>
      <text x="224" y="158" textAnchor="middle" fontSize="14.5" fontWeight="700" fill={C.encre}>on part du blanc,</text>
      <text x="224" y="176" textAnchor="middle" fontSize="14.5" fontWeight="700" fill={C.encre}>on retire</text><text x="224" y="194" textAnchor="middle" fontSize="14.5" fontWeight="700" fill={C.encre}>des radiations</text>
      {exemples && <text x="224" y="214" textAnchor="middle" fontSize="14.5" fill="#92400e">filtres, encres, peintures</text>}
    </svg>);
}
// corps de trois disques (sans cadre), pour des schémas imbriqués
export function DisquesCorps({ mode = 'add', cx = 210, cy = 118, r = 70, id = 'dc' }) {
  const add = mode === 'add';
  const src = add ? [COULEURS.rouge, COULEURS.vert, COULEURS.bleu] : [COULEURS.jaune, COULEURS.cyan, COULEURS.magenta];
  const pos = [[cx - 0.55 * r, cy - 0.32 * r], [cx + 0.55 * r, cy - 0.32 * r], [cx, cy + 0.62 * r]];
  const mix = idx => (add ? additif(...idx.map(i => src[i])) : idx.map(i => src[i]).reduce((a, s) => traverse(a, s), BLANC));
  const uid = `${id}${mode}`;
  return (
    <g>
      <defs>{src.map((_, i) => <clipPath key={i} id={`${uid}-${i}`}><circle cx={pos[i][0]} cy={pos[i][1]} r={r}/></clipPath>)}</defs>
      {src.map((s, i) => <circle key={i} cx={pos[i][0]} cy={pos[i][1]} r={r} fill={rgb(s)}/>)}
      {[[0, 1, 2], [0, 2, 1], [1, 2, 0]].map(([a, b]) => <circle key={`${a}${b}`} cx={pos[a][0]} cy={pos[a][1]} r={r} clipPath={`url(#${uid}-${b})`} fill={rgb(mix([a, b]))}/>)}
      <g clipPath={`url(#${uid}-1)`}><circle cx={pos[0][0]} cy={pos[0][1]} r={r} clipPath={`url(#${uid}-2)`} fill={rgb(mix([0, 1, 2]))}/></g>
    </g>);
}
