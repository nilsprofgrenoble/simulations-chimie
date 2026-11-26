import { useState, useMemo } from "react";
import { useSignalerMode, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ARetenir, ExempleResolu } from "../commun";
import { NU, MOL, MOLS, FAMILLES_STL, BANQUE, ligneBanque, compatibles, NOMS_MULT, plat, visibles, spectre, courbeGroupe } from "./rmnStlModele";
import { yRef, courbeZoom } from "./rmnModele";
import { fr } from "./elecModele";
import { puces } from "./Travail";
import { FDeplacement, FIntegration } from "./RmnSchemas";
import { FBanque, FMethodeStl } from "./RmnStlSchemas";
import { BLEU, VERMILLON, VIOLET, GRIS, VERT, alea } from "./elecOutils";
import { VoletDefiGen } from "./elecCommun";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 306 — RMN DU PROTON (Terminale STL, SPCL : Chimie et développement durable)
//  Capacités visées : attribuer les signaux d'un spectre RMN aux protons d'une molécule donnée ; identifier ou confirmer une structure
//  à l'aide d'une banque de données (nombre de signaux, déplacement chimique, intégration, multiplicité) sur des cas simples.
//  Hypothèses : molécules décrites à la main (bibliothèque de la simulation 75, sans la modifier : seules les 13 molécules les plus simples) ;
//  banque de déplacements chimiques arrondie (zones usuelles, ± 0,2 ppm) ; spectromètre de 400 MHz ; multiplets du premier ordre (règle des n + 1) ;
//  hors programme et donc absents : constante de couplage J, champ B₀, ¹³C, RMN 2D, protons labiles, cycles aromatiques.
// ====================================================

const SIM = 306;
declarerDefis(SIM, [
  ['attribuer', 'Attribuer les signaux'],
  ['identifier', 'Identifier un isomère'],
]);
const TITRES = { attribuer: 'Attribuer', identifier: 'Identifier' };
const COULS = [BLEU, VERMILLON, VERT, VIOLET, '#b45309', '#0e7490'];
const XMIN = -0.5;
const nf = (x, d = 2) => fr(x, d);
const hz = n => `${n} H`;
const melange = l => { const t = [...l]; for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; } return t; };
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

// ---------- formule semi-développée avec les groupes de protons repérés ----------
function Formule({ m, sel, onSel, cacher, libre }) {
  const coul = {}, lettre = {};
  m.liste.forEach((x, i) => { coul[x.k] = COULS[i % COULS.length]; lettre[x.k] = x.lettre; });
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, fontSize: 19, color: KIT.txt, lineHeight: 1.1, padding: '6px 2px' }} role="group" aria-label={`Formule semi-développée de ${m.nom} : ${plat(m)}`}>
      {m.semi.map((t, i) => {
        if (typeof t === 'string') return <span key={i} style={{ padding: '0 1px' }}>{t}</span>;
        const on = sel === t.g;
        return <button key={i} onClick={libre ? () => onSel(on ? null : t.g) : undefined} disabled={!libre} aria-pressed={on}
          style={{ position: 'relative', font: 'inherit', cursor: libre ? 'pointer' : 'default', padding: '2px 5px', margin: '8px 1px 0', borderRadius: 6,
            border: `2px solid ${coul[t.g]}`, background: on ? `${coul[t.g]}33` : `${coul[t.g]}14`, color: KIT.txt, boxShadow: on ? `0 0 0 2px ${coul[t.g]}55` : 'none' }}>
          {t.t}{!cacher && <span style={{ position: 'absolute', top: -9, right: -6, background: coul[t.g], color: '#fff', borderRadius: 9, minWidth: 17, height: 17, fontSize: 11.5, fontWeight: 800, lineHeight: '17px', textAlign: 'center' }}>{lettre[t.g]}</span>}
        </button>;
      })}
    </div>);
}

// ---------- spectre complet ----------
function Spectre({ m, sel, onSel, integ, cacher, titre, libre }) {
  const W = 480, H = 250, L = 12, R = 12, T = 26, B = 42, pw = W - L - R, ph = H - T - B;
  const gs = visibles(m, false), dmax = Math.max(...gs.map(x => x.d), 5), xmax = Math.max(6, Math.ceil(dmax + 1));
  const sp = useMemo(() => spectre(m, 400, false, XMIN, xmax), [m, xmax]);
  const gSel = sel ? gs.find(x => x.k === sel) : null;
  const cg = gSel ? courbeGroupe(gSel, 400, XMIN, xmax) : null;
  const ref = yRef(m) * 1.08, base = T + ph;
  const X = v => L + (xmax - v) / (xmax - XMIN) * pw, Y = y => base - Math.min(y / ref, 1.04) * ph * 0.92;
  const sommets = gs.map(x => ({ x, c: courbeGroupe(x, 400, XMIN, xmax) }));
  const clic = e => {
    if (!libre) return;
    const r = e.currentTarget.getBoundingClientRect(), v = xmax - ((e.clientX - r.left) / r.width * W - L) / pw * (xmax - XMIN);
    const p = gs.reduce((b, q) => (Math.abs(q.d - v) < Math.abs(b.d - v) ? q : b), gs[0]);
    if (p && Math.abs(p.d - v) < 0.3) onSel(p.k === sel ? null : p.k);
  };
  const ticks = []; for (let v = 0; v <= xmax; v++) ticks.push(v);
  const pol = (xs, ys, f) => xs.map((x, i) => `${X(x).toFixed(1)},${f(ys[i]).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={titre} onClick={clic} data-testid="spectre"
      style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, cursor: libre ? 'pointer' : 'default' }}>
      {ticks.map(v => <g key={v}><line x1={X(v)} y1={T} x2={X(v)} y2={base} stroke="#eef2f7"/><text x={X(v)} y={base + 16} fontSize="13" textAnchor="middle" fill={GRIS}>{v}</text></g>)}
      <line x1={L} y1={base} x2={W - R} y2={base} stroke="#0f172a" strokeWidth="1.6"/>
      <text x={L + pw / 2} y={H - 8} fontSize="14" fontWeight="700" textAnchor="middle" fill="#0f172a">δ (ppm)</text>
      <polyline fill="none" stroke="#0f172a" strokeWidth="1.4" points={pol(sp.xs, sp.ys, Y)}/>
      {cg && <polyline fill="none" stroke={COULS[m.liste.findIndex(x => x.k === sel) % COULS.length]} strokeWidth="2.8" points={pol(cg.xs, cg.ys, Y)}/>}
      {integ && <polyline fill="none" stroke={VERMILLON} strokeWidth="1.9" strokeOpacity="0.85" points={pol(sp.xs, sp.cum, c => base - 4 - c * ph * 0.55)}/>}
      <text x={X(0)} y={Y(0.25 * yRef(m)) - 6} fontSize="12.5" fontWeight="700" textAnchor="middle" fill={GRIS}>TMS</text>
      {!cacher && sommets.map(({ x, c }) => { const i = m.liste.findIndex(z => z.k === x.k), top = Math.min(...c.ys.map(Y)), cy = Math.max(top - 14, T - 8); return (
        <g key={x.k}><circle cx={X(x.d)} cy={cy} r="9.5" fill={COULS[i % COULS.length]}/><text x={X(x.d)} y={cy + 4.5} fontSize="13" fontWeight="800" textAnchor="middle" fill="#fff">{x.lettre}</text></g>); })}
      {integ && <text x={L + 4} y={T + 8} fontSize="12.5" fill={VERMILLON} fontWeight="700">— courbe d’intégration</text>}
    </svg>);
}

// ---------- agrandissement d'un multiplet : les raies sont numérotées ----------
function Zoom({ x }) {
  const W = 480, H = 170, L = 12, R = 12, T = 40, B = 16, pw = W - L - R, ph = H - T - B, base = T + ph;
  const maxOff = Math.max(...x.lignes.map(r => Math.abs(r.x))), demi = Math.max(18, Math.ceil((maxOff * 1.5 + 8) / 5) * 5);
  const c = useMemo(() => courbeZoom(x, demi), [x, demi]), ymax = Math.max(...c.ys) * 1.1;
  const X = f => L + (f + demi) / (2 * demi) * pw, Y = y => base - y / ymax * ph;
  const raies = [...x.lignes].sort((p, q) => p.x - q.x);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Agrandissement du signal ${x.lettre} : ${raies.length} raie${raies.length > 1 ? 's' : ''}`} data-testid="zoom"
      style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <line x1={L} y1={base} x2={W - R} y2={base} stroke="#0f172a" strokeWidth="1.6"/>
      <polyline fill="none" stroke="#0f172a" strokeWidth="2" points={c.xs.map((f, i) => `${X(f).toFixed(1)},${Y(c.ys[i]).toFixed(1)}`).join(' ')}/>
      {raies.map((r, i) => { const j = Math.min(c.ys.length - 1, Math.max(0, Math.round((r.x + demi) / (2 * demi) * (c.ys.length - 1)))), yy = Y(c.ys[j]) - 13;
        return <g key={i}><circle cx={X(r.x)} cy={yy} r="9" fill={VERMILLON}/><text x={X(r.x)} y={yy + 4.5} fontSize="13" fontWeight="800" textAnchor="middle" fill="#fff">{i + 1}</text></g>; })}
      <text x={L + 4} y={20} fontSize="13.5" fontWeight="700" fill="#0f172a">Signal {x.lettre} agrandi : {raies.length} raie{raies.length > 1 ? 's' : ''} ({NOMS_MULT[x.mult]})</text>
    </svg>);
}

// ---------- banque de données (tableau) ----------
function TableBanque({ d }) {
  const cell = { padding: '4px 8px', fontSize: 13.5 }, ok = d != null ? compatibles(d).map(b => b.id) : [];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white' }} data-testid="banque">
        <thead><tr><th style={{ ...cell, textAlign: 'left', color: KIT.txt2, borderBottom: `1px solid ${KIT.bord}` }}>Type de proton</th><th style={{ ...cell, textAlign: 'right', color: KIT.txt2, borderBottom: `1px solid ${KIT.bord}` }}>δ (ppm)</th></tr></thead>
        <tbody>{BANQUE.map(b => { const on = ok.includes(b.id);
          return <tr key={b.id} style={{ background: on ? '#fef9c3' : 'white', borderBottom: `1px solid ${KIT.bord}` }}>
            <td style={{ ...cell, fontWeight: on ? 700 : 400 }}>{b.type}</td><td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: on ? 700 : 400 }}>{nf(b.plage[0], 1)} à {nf(b.plage[1], 1)}</td></tr>; })}</tbody>
      </table>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{d != null ? `En jaune : les types de proton compatibles avec δ = ${nf(d)} ppm.` : 'Valeurs usuelles arrondies (± 0,2 ppm) : les zones se recouvrent en partie.'}</div>
    </div>);
}

// ---------- données lues sur un spectre ----------
function Donnees({ m }) {
  const th = { padding: '2px 10px', textAlign: 'right', color: KIT.txt2, fontWeight: 700 }, td = { padding: '2px 10px', textAlign: 'right' };
  return (
    <div style={{ overflowX: 'auto', margin: '6px 0' }}><table style={{ borderCollapse: 'collapse', background: 'white', fontSize: 13.5 }}>
      <thead><tr><th style={th}>δ (ppm)</th><th style={th}>nombre de H</th><th style={th}>multiplicité</th></tr></thead>
      <tbody>{m.liste.map(x => <tr key={x.k}><td style={td}>{nf(x.d)}</td><td style={td}>{x.n}</td><td style={td}>{NOMS_MULT[x.mult]}</td></tr>)}</tbody></table></div>);
}

// ---------- tableau d'analyse (exploration) ----------
function TableAnalyse({ m, sel, onSel }) {
  const cell = { padding: '4px 6px', textAlign: 'center', fontSize: 13 };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640, background: 'white' }} data-testid="analyse">
        <thead><tr>{['Signal', 'δ (ppm)', 'Nombre de H', 'Multiplicité', 'Voisins n', 'Type de proton (banque)', 'Groupe'].map((h, i) => <th key={h} style={{ ...cell, color: KIT.txt2, borderBottom: `1px solid ${KIT.bord}`, textAlign: i > 4 ? 'left' : 'center' }}>{h}</th>)}</tr></thead>
        <tbody>{m.liste.map((x, i) => { const on = sel === x.k;
          return <tr key={x.k} onClick={() => onSel(on ? null : x.k)} style={{ cursor: 'pointer', background: on ? '#fef9c3' : 'white', borderBottom: `1px solid ${KIT.bord}` }}>
            <td style={cell}><span style={{ display: 'inline-block', background: COULS[i % COULS.length], color: '#fff', borderRadius: 9, minWidth: 18, fontWeight: 800, fontSize: 12 }}>{x.lettre}</span></td>
            <td style={cell}>{nf(x.d)}</td><td style={{ ...cell, fontWeight: 700 }}>{x.n}</td><td style={{ ...cell, fontWeight: 700 }}>{x.mult}</td><td style={cell}>{x.nv}</td>
            <td style={{ ...cell, textAlign: 'left' }}>{ligneBanque(m, x).type}</td>
            <td style={{ ...cell, textAlign: 'left', lineHeight: 1.45 }}><strong>{x.desc}</strong> : {x.com}</td></tr>; })}
          <tr><td style={{ ...cell, fontWeight: 700, textAlign: 'right' }} colSpan={2}>Total</td><td style={{ ...cell, fontWeight: 800, color: VERT }}>{m.N}</td><td colSpan={4}/></tr></tbody>
      </table>
    </div>);
}

// ---------- parcours guidé : chaque étape décrit ce qui est visible à l'écran ----------
const Q = (q, options, bonne, expl, indice) => ({ type: 'qcm', q, options, bonne, expl, indice });
const ETAPES = [
  { id: 'signaux', titre: 'Un signal par groupe de protons équivalents', vue: { mol: 'ethoxyethane' },
    texte: <>Un spectre de <strong>RMN du proton (¹H)</strong> est un graphique : en abscisse le <strong>déplacement chimique δ</strong> (en ppm), en ordonnée l’intensité du signal. Les protons d’une molécule se répartissent en <strong>groupes de protons équivalents</strong> (même environnement chimique, par exemple par symétrie) : <strong>chaque groupe donne un seul signal</strong>. Cliquez sur un groupe de la formule de l’éthoxyéthane : son signal se colore sur le spectre.</>,
    tache: Q('Combien de signaux donne le spectre RMN ¹H du 1,2-dichloroéthane Cl–CH₂–CH₂–Cl ?', ['1 signal', '2 signaux', '3 signaux', '4 signaux'], 0,
      'Les quatre H sont équivalents par symétrie (même environnement) : un seul groupe, donc un seul signal.', 'Dessinez la molécule : les deux CH₂ sont-ils dans le même environnement ? Un signal par groupe de H équivalents.') },
  { id: 'delta', titre: 'Où apparaît un signal ?', vue: { mol: 'bromobutane' },
    texte: <>Les atomes électronégatifs (O, Cl, Br…) attirent les électrons : les protons proches de ces atomes sont moins protégés et leur signal apparaît à un δ <strong>plus grand</strong> (plus à gauche) : on dit qu’ils sont <strong>déblindés</strong>. Plus on s’éloigne de l’atome électronégatif, plus δ diminue. Cliquez sur chaque groupe du 1-bromobutane.</>,
    tache: Q('Dans le 1-bromobutane CH₃–CH₂–CH₂–CH₂Br, quel groupe de H a le δ le plus grand ?', ['le CH₂ lié à Br', 'le CH₃ à l’autre bout de la chaîne', 'le CH₂ voisin du CH₃', 'tous ont le même δ'], 0,
      'Le CH₂Br est le plus proche du brome (δ ≈ 3,4 ppm) ; le CH₃, le plus éloigné, a le δ le plus petit (≈ 0,9 ppm).', 'Plus un atome électronégatif est proche d’un groupe de H, plus δ est grand. Quel groupe est le plus proche de Br ?') },
  { id: 'banque', titre: 'Lire la banque de données', vue: { mol: 'dichloropropane13', banque: true },
    retenirTitre: 'À retenir : la position d’un signal',
    retenir: <>
      <FDeplacement/>
      {puces(<>Le <strong>déplacement chimique δ</strong> (en ppm) repère la position d’un signal ; la référence est le TMS (δ = 0).</>, <>Un proton proche d’un atome électronégatif (O, Cl, Br) a un <strong>δ plus grand</strong>.</>)}
    </>,
    texte: <>Les valeurs de δ des différents types de protons sont rassemblées dans une <strong>banque de données</strong> (tableau sous le spectre). Elle donne une <strong>zone</strong> et non une valeur exacte, et certaines zones se recouvrent : il faudra aussi utiliser l’intégration et la multiplicité.
      <ExempleResolu>Le signal du CH₃ du 1-bromobutane est à δ = 0,93 ppm : d’après la banque, c’est un H d’un CH₃ ou d’un CH₂ éloigné des atomes électronégatifs (0,8 à 1,8 ppm).</ExempleResolu>
      Sur le spectre du 1,3-dichloropropane, le signal le plus à gauche est à δ = 3,72 ppm.</>,
    tache: Q('D’après la banque, un signal à δ = 3,72 ppm correspond à des H :', ['d’un carbone lié à Cl, Br ou O', 'd’un carbone voisin d’un groupe C=O', 'd’un CH₃ ou CH₂ éloigné des atomes électronégatifs', 'd’un carbone lié à deux atomes de chlore'], 0,
      '3,72 ppm est dans la zone 3,3 à 4,4 ppm : H d’un carbone lié à un atome électronégatif (ici Cl).', 'Repérez 3,72 dans la colonne δ du tableau : dans quelle ligne tombe-t-il ?') },
  { id: 'integration', titre: 'L’intégration : combien de H par signal ?', vue: { mol: 'propanoatemethyle', integ: true, banque: true },
    retenirTitre: 'À retenir : lire la banque de données',
    retenir: <>
      <FBanque/>
      {puces(<>Chaque zone de la banque correspond à un <strong>type de proton</strong>.</>, <>Les zones se recouvrent : un même δ peut convenir à deux types, la multiplicité et l’intégration permettent de trancher.</>, <>Ce sont des <strong>ordres de grandeur</strong> (± 0,2 ppm).</>)}
    </>,
    texte: <>L’aire d’un signal est proportionnelle au nombre de protons du groupe. La <strong>courbe d’intégration</strong> (en rouge) monte d’un palier par signal : la hauteur h d’un palier est proportionnelle au nombre de H. Avec H la hauteur totale et N le nombre total de protons (lu sur la formule brute) : <strong>nombre de H = N × h / H</strong>.
      <ExempleResolu>Éthoxyéthane C₄H₁₀O (N = 10), paliers de 20 mm et 30 mm : H = 50 mm. Premier signal : 10 × 20 / 50 = 4 H ; second signal : 10 × 30 / 50 = 6 H.</ExempleResolu>
      Propanoate de méthyle C₄H₈O₂ (N = 8) : les paliers mesurent <strong>12 mm</strong> (3,67 ppm), <strong>8 mm</strong> (2,32 ppm) et <strong>12 mm</strong> (1,14 ppm).</>,
    tache: { type: 'num', q: 'Nombre de H du signal à 2,32 ppm', unite: 'H', vrai: 2, tol: 0.001, affiche: x => String(x),
      calcul: () => ['Hypothèse : la hauteur d’un palier est proportionnelle au nombre de H du signal.', 'Hauteur totale : H = 12 + 8 + 12 = 32 mm ; nombre total de protons : N = 8 (C₄H₈O₂).', 'Nombre de H = N × h / H = 8 × 8 / 32 = 2.'],
      pieges: [[8, 'C’est la hauteur du palier en mm, pas le nombre de H : calculez N × h / H.'], [4, 'Il faut multiplier par N = 8 (nombre total de H) et diviser par la hauteur totale H = 32 mm.'], [0.5, 'Vous avez calculé h / H × … avec N à l’envers : le nombre de H vaut N × h / H.']],
      expl: 'N × h / H = 8 × 8 / 32 = 2 H : c’est le CH₂.', indice: 'Nombre de H = N × h / H. Ajoutez les trois hauteurs pour trouver H, puis utilisez N = 8 (le nombre d’atomes d’hydrogène de C₄H₈O₂).' } },
  { id: 'multiplicite', titre: 'La multiplicité : compter les voisins', vue: { mol: 'ethoxyethane', sel: 'ch2', integ: true, banque: true },
    retenirTitre: 'À retenir : l’intégration',
    retenir: <>
      <FIntegration/>
      {puces(<>Nombre de H = N × h / H (N : nombre total de H de la formule brute ; H : hauteur totale ; h : hauteur du palier).</>)}
    </>,
    texte: <>Les protons des groupes voisins influencent le signal : c’est le <strong>couplage</strong>. Un groupe de protons ayant <strong>n protons voisins</strong> (portés par les atomes de carbone adjacents, non équivalents) donne un signal de <strong>n + 1 raies</strong> : singulet (n = 0), doublet (n = 1), triplet (n = 2), quadruplet (n = 3), quintuplet (n = 4)… Les protons équivalents ne se couplent pas entre eux ; un carbone sans H (C=O, carbone quaternaire) ou un atome d’oxygène ne transmet pas le couplage.
      <ExempleResolu>Dans l’éthoxyéthane, le CH₂ est voisin d’un CH₃ : n = 3, donc n + 1 = 4 raies, un quadruplet (voir l’agrandissement).</ExempleResolu></>,
    tache: Q('Combien de raies compte le signal du CH₂ central du 1,3-dibromopropane Br–CH₂–CH₂–CH₂–Br ?', ['3 raies', '4 raies', '5 raies', '6 raies'], 2,
      'Le CH₂ central a 2 + 2 = 4 H voisins (les deux CH₂Br équivalents) : n + 1 = 5 raies, un quintuplet.', 'Comptez tous les H des carbones adjacents (de chaque côté), puis ajoutez 1.') },
  { id: 'attribuer1', titre: 'Attribuer un signal à un groupe', vue: { mol: 'acetateethyle', integ: true, banque: true, libre: false },
    retenirTitre: 'À retenir : la multiplicité',
    retenir: <>{puces(<>Un groupe de H ayant <strong>n voisins</strong> donne un signal de <strong>n + 1 raies</strong>.</>, <>Les H équivalents ne se couplent pas entre eux.</>, <>Un carbone sans H (C=O, carbone quaternaire) ou un atome d’oxygène : pas de couplage, donc un <strong>singulet</strong> si le groupe n’a pas d’autre voisin.</>)}</>,
    texte: <><strong>Attribuer</strong>, c’est dire quel groupe de H produit quel signal, en combinant δ (banque), intégration (nombre de H) et multiplicité (voisins). Éthanoate d’éthyle CH₃–CO–O–CH₂–CH₃.
      <ExempleResolu>Le quadruplet de 2 H à 4,12 ppm : 2 H, donc un CH₂ ; 3 voisins, donc voisin d’un CH₃ ; δ élevé, donc lié à O. C’est le CH₂ de CH₂–CH₃ lié à l’oxygène.</ExempleResolu>
      Le spectre montre aussi un <strong>singulet de 3 H à 2,05 ppm</strong>.</>,
    tache: Q('À quel groupe correspond le singulet de 3 H à 2,05 ppm ?', ['le CH₃ lié au groupe C=O', 'le CH₃ de l’éthyle CH₂–CH₃', 'le CH₂ lié à O', 'le CH₃ lié à O'], 0,
      'Un singulet : aucun H voisin ; 3 H : un CH₃. Dans la molécule, seul le CH₃–C=O n’a aucun H sur son voisin (C=O). Sa zone (2,0 à 2,7 ppm) est celle des H voisins d’un C=O. Le CH₃ de l’éthyle serait un triplet.', 'Singulet = pas de H voisin. Quel CH₃ de la molécule est lié à un carbone sans H ?') },
  { id: 'attribuer2', titre: 'Du groupe au signal', vue: { mol: 'propanoatemethyle', integ: true, banque: true, libre: false },
    texte: <>On peut aussi partir de la formule. Propanoate de méthyle CH₃–CH₂–CO–O–CH₃ : trois groupes de H, donc trois signaux. Prévoyez pour chaque groupe son nombre de H, son nombre de voisins n et sa zone de δ, puis cherchez le signal correspondant dans le spectre : un <strong>singulet de 3 H à 3,67 ppm</strong>, un <strong>quadruplet de 2 H à 2,32 ppm</strong> et un <strong>triplet de 3 H à 1,14 ppm</strong>.</>,
    tache: Q('Quel signal correspond au CH₂ de CH₃–CH₂–CO–O–CH₃ ?', ['le quadruplet à 2,32 ppm', 'le singulet à 3,67 ppm', 'le triplet à 1,14 ppm', 'aucun : un CH₂ ne donne pas de signal'], 0,
      'Le CH₂ a 2 H, voisin du CH₃ de l’éthyle (n = 3) : quadruplet ; il est voisin du C=O : zone 2,0 à 2,7 ppm. C’est le quadruplet à 2,32 ppm.', 'Un CH₂ compte 2 H. Il est voisin d’un CH₃ : combien de raies ? Il est lié à C=O : quelle zone de la banque ?') },
  { id: 'identifier1', titre: 'Identifier une structure', vue: { mol: 'dichloropropane13', integ: true, banque: true, inconnu: true, libre: false },
    texte: <>Un composé inconnu de formule brute <strong>C₃H₆Cl₂</strong> donne le spectre ci-dessous. Trois structures sont possibles : Cl–CH₂–CH₂–CH₂–Cl, CH₃–CCl₂–CH₃ et CHCl₂–CH₂–CH₃. Pour chacune, prévoyez le nombre de signaux, puis comparez avec les données du spectre.
      <Donnees m={MOL.dichloropropane13}/></>,
    tache: Q('Quelle est la structure du composé ?', ['Cl–CH₂–CH₂–CH₂–Cl', 'CH₃–CCl₂–CH₃', 'CHCl₂–CH₂–CH₃', 'aucune des trois'], 0,
      'Deux signaux (4 H et 2 H) : Cl–CH₂–CH₂–CH₂–Cl (deux CH₂Cl équivalents, un CH₂ central). CH₃–CCl₂–CH₃ ne donnerait qu’un singulet de 6 H ; CHCl₂–CH₂–CH₃ donnerait trois signaux (1 H, 2 H, 3 H).', 'Pour chaque structure, comptez les groupes de H équivalents : combien de signaux ? Comparez avec le tableau.') },
  { id: 'identifier2', titre: 'Deux isomères, deux spectres', vue: { mol: 'propanoatemethyle', integ: true, banque: true, inconnu: true, libre: false },
    texte: <>Un autre composé de formule brute <strong>C₄H₈O₂</strong> donne les signaux ci-dessous. Deux esters sont candidats : l’éthanoate d’éthyle CH₃–CO–O–CH₂–CH₃ et le propanoate de méthyle CH₃–CH₂–CO–O–CH₃. Tous deux ont trois signaux : il faut regarder les <strong>intégrations</strong>, les <strong>multiplicités</strong> et les <strong>δ</strong>.
      <Donnees m={MOL.propanoatemethyle}/></>,
    tache: Q('Quel est ce composé ?', ['le propanoate de méthyle', 'l’éthanoate d’éthyle', 'aucun des deux', 'on ne peut pas décider'], 0,
      'Les deux esters ont trois signaux, mais l’éthanoate d’éthyle donnerait un singulet de 3 H vers 2,05 ppm, un quadruplet de 2 H vers 4,1 ppm et un triplet de 3 H. Ici le singulet de 3 H est à 3,67 ppm (CH₃ lié à O) et le quadruplet de 2 H à 2,32 ppm (CH₂ voisin de C=O) : c’est le propanoate de méthyle.', 'Écrivez pour chaque ester le signal du CH₂ : où doit-il se trouver (lié à O ou voisin de C=O) ? Et celui du singulet ?') },
  { id: 'confirmer', titre: 'Confirmer ou rejeter une structure', vue: { mol: 'methylbutanone', integ: true, banque: true, inconnu: true, libre: false },
    texte: <>Un composé inconnu donne le spectre ci-dessous. Un élève propose la structure CH₃–CO–CH₂–C(CH₃)₃. Pour <strong>confirmer</strong> une structure, on prévoit son spectre et on le compare au spectre mesuré : tout doit coïncider. On laisse de côté la formule brute pour ne regarder que le spectre.
      <Donnees m={MOL.methylbutanone}/>
      Cette structure prévoit trois singulets : 3 H, 2 H et 9 H.</>,
    tache: Q('Quelle observation prouve que cette structure est incorrecte ?', ['le spectre montre un doublet de 6 H et un septuplet de 1 H', 'le spectre montre un singulet de 3 H', 'le spectre montre trois signaux', 'le spectre montre un signal vers 1 ppm'], 0,
      'Un doublet de 6 H et un septuplet de 1 H : un CH voisin de deux CH₃ (CH₃)₂CH–, absent de la structure proposée (qui ne contient que des singulets). Les trois autres observations sont compatibles avec la structure proposée. Le composé est le 3-méthylbutan-2-one, CH₃–CO–CH(CH₃)₂. (La formule brute C₅H₁₀O permettait aussi de rejeter la proposition, C₇H₁₄O.)', 'Prévoyez les multiplicités de la structure proposée : que des singulets ? Quelle observation du spectre ne peut pas venir d’un singulet ?') },
  { id: 'fin', titre: 'Le bilan', vue: { mol: 'butanoateethyle', integ: true, banque: true },
    retenirTitre: 'À retenir : attribuer les signaux',
    retenir: <>
      <FMethodeStl/>
      {puces(<>Pour <strong>identifier</strong> : prévoir le spectre de chaque candidat et le comparer au spectre mesuré.</>, <>Pour <strong>confirmer</strong> : tout doit coïncider (signaux, δ, intégrations, multiplicités).</>)}
    </>,
    texte: <>Vous savez lire un spectre de RMN du proton : nombre de signaux, déplacement chimique (banque de données), intégration et multiplicité. Essayez maintenant les défis, ou explorez les autres molécules.</>, tache: null },
];

// ---------- défis ----------
const POUR_ATTRIBUER = MOLS.filter(m => m.liste.length <= 4);
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'attribuer') { const m = alea(POUR_ATTRIBUER); return { ...base, id: m.id, ordre: melange(m.liste.map(x => x.k)) }; }
  const fam = alea(Object.keys(FAMILLES_STL)), id = alea(FAMILLES_STL[fam]);
  return { ...base, fam, id, ordre: melange(FAMILLES_STL[fam]) };
}
// explication d'une erreur d'attribution : on compare le groupe choisi aux données du signal
function raisonAttribution(x, choisi) {
  if (!choisi) return 'Choisissez un groupe de protons.';
  if (choisi.n !== x.n) return `le groupe choisi contient ${hz(choisi.n)} alors que le signal en intègre ${x.n}.`;
  if (choisi.nv !== x.nv) return `le groupe choisi a ${pluriel(choisi.nv, 'H voisin')} : il donnerait ${choisi.nv + 1} raie${choisi.nv ? 's' : ''}, alors que le signal en a ${x.nv + 1}.`;
  return 'même nombre de H et même multiplicité : départagez avec δ dans la banque (lié à O, Cl, Br ? voisin de C=O ?).';
}
function raisonIsomere(cand, vrai) {
  if (cand.liste.length !== vrai.liste.length) return `${cand.nom} donnerait ${pluriel(cand.liste.length, 'signal')}, le spectre en montre ${vrai.liste.length}.`;
  const sig = m => m.liste.map(x => `${x.n} H ${x.mult}`).sort().join(' ; ');
  if (sig(cand) !== sig(vrai)) return `${cand.nom} donnerait : ${sig(cand).replace(/ ; /g, ', ')} ; le spectre montre : ${sig(vrai).replace(/ ; /g, ', ')}.`;
  return 'même nombre de signaux, d’H et de multiplicités : regardez δ (banque).';
}
function evaluer(d) {
  const m = MOL[d.id];
  if (d.type === 'attribuer') {
    const ok = m.liste.map((x, i) => d.reps['g' + i] === x.k);
    return { ok: ok.every(Boolean), lignes: m.liste.map((x, i) => [ok[i], ok[i] ? `Signal à ${nf(x.d)} ppm : correct.`
      : `Signal à ${nf(x.d)} ppm : ${raisonAttribution(x, m.liste.find(z => z.k === d.reps['g' + i]))}`]) };
  }
  const ok = d.reps.c === d.id;
  return { ok, lignes: [[ok, ok ? 'Isomère identifié.' : d.reps.c ? `Pas celui-ci : ${raisonIsomere(MOL[d.reps.c], m)}` : 'Choisissez un isomère.']] };
}
const enonce = (d, { choix }) => {
  const m = MOL[d.id];
  if (d.type === 'attribuer')
    return <><Pic n="target"/>Spectre RMN ¹H de <strong>{m.nom}</strong> : <strong style={{ whiteSpace: 'nowrap' }}>{plat(m)}</strong>. Pour chaque signal, choisissez le groupe de protons qui le produit.
      <Donnees m={m}/>
      {m.liste.map((x, i) => <div key={x.k} style={{ marginTop: 8 }}><strong>Signal à {nf(x.d)} ppm</strong> ({hz(x.n)}, {NOMS_MULT[x.mult]}) :
        <div style={{ marginTop: 4 }}>{choix('g' + i, d.ordre.map(k => [k, m.liste.find(z => z.k === k).desc]))}</div></div>)}</>;
  return <><Pic n="target"/>Un composé de formule brute <strong>{m.brute}</strong> donne le spectre ci-dessous. Quel est cet isomère ?
    <Donnees m={m}/>
    {choix('c', d.ordre.map(c => [c, `${MOL[c].nom} : ${plat(MOL[c])}`]))}</>;
};
const indiceDefi = d => d.type === 'attribuer'
  ? <>Le nombre de H se lit dans l’intégration ; n voisins donnent n + 1 raies ; la banque indique si le groupe est lié à O, Cl, Br ou voisin d’un C=O (δ plus grand).</>
  : <>Pour chaque candidat, écrivez le nombre de signaux, leur nombre de H et leur multiplicité, puis comparez avec le tableau.</>;
const solution = d => {
  const m = MOL[d.id];
  if (d.type === 'attribuer') return <>{m.liste.map(x => `${nf(x.d)} ppm (${hz(x.n)}, ${NOMS_MULT[x.mult]}) : ${x.desc}`).join(' ; ')}. Exemple de raisonnement : {m.liste[0].com}</>;
  return <>C’est le <strong>{m.nom}</strong> ({plat(m)}) : {m.liste.map(x => `${nf(x.d)} ppm, ${hz(x.n)}, ${NOMS_MULT[x.mult]} (${x.desc})`).join(' ; ')}.</>;
};

// ====================================================
export function SimulationRmnStl() {
  const [mode, setMode] = useState(() => modeOuverture('rmnstl-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('rmnstl-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [molId, setMolId] = useState('bromobutane');
  const [selE, setSelE] = useState(null);
  const [selG, setSelG] = useState({ e: -1, k: null });
  const [integE, setIntegE] = useState(true);
  const [corrige, setCorrige] = useState(false);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [banqueOuv, setBanqueOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const ie = Math.min(guide.etape, ETAPES.length - 1), vue = ETAPES[ie].vue;
  const m = enGuide ? MOL[vue.mol] : enDefi ? MOL[defi.id] : MOL[molId];
  const inconnu = enGuide ? !!vue.inconnu : enDefi;
  const libre = enGuide ? vue.libre !== false : enExplore;
  const integ = enGuide ? !!vue.integ : enDefi ? true : integE;
  const banque = enGuide ? !!vue.banque : false;
  const sel = enGuide ? (libre && selG.e === ie ? selG.k : vue.sel ?? null) : enExplore ? selE : null;
  const onSel = k => { if (!libre) return; if (enGuide) setSelG({ e: ie, k }); else setSelE(k); };
  const gSel = sel ? visibles(m, false).find(x => x.k === sel) : null;

  function lancer(type) { setDefi(nouveauDefi(type)); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'attribuer'); else if (md === 'explore') { setSelE(null); setCorrige(false); } }
  const choisirMol = id => { setMolId(id); setSelE(null); };

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Treize molécules simples, décrites à la main</strong> : le simulateur ne prédit pas le spectre d’une molécule quelconque. Chaque molécule a des groupes de H dont tous les signaux suivent la règle des n + 1.</li>
      <li><strong>Banque de données arrondie</strong> : les zones de δ sont des valeurs usuelles (en solution dans CDCl₃), à ± 0,2 ppm près ; elles dépendent un peu du solvant. Les valeurs de δ des molécules sont des valeurs usuelles arrondies à 0,01 ppm.</li>
      <li><strong>Spectromètre de 400 MHz</strong>, spectre idéal : raies fines, sans bruit ni ligne de base ; les paliers d’intégration sont exactement proportionnels au nombre de H (une vraie intégration est précise à quelques pour cent).</li>
      <li><strong>Multiplets du premier ordre</strong> : règle des n + 1 (couplage entre H de carbones voisins). Les intensités des raies d’un multiplet ne sont pas discutées ici.</li>
      <li><strong>Hors programme, donc absents</strong> : constante de couplage J, influence du champ B₀, RMN du ¹³C, RMN 2D, protons labiles (OH, NH, COOH), cycles aromatiques.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;

  const barre = enExplore
    ? <div style={{ marginBottom: 8 }}><label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, display: 'block', marginBottom: 4 }}>Molécule</label>
        <select value={molId} onChange={e => choisirMol(e.target.value)} aria-label="Molécule" style={{ fontSize: 15, minHeight: 42, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 8, maxWidth: '100%' }}>
          {MOLS.map(x => <option key={x.id} value={x.id}>{x.nom} ({x.brute})</option>)}</select></div>
    : <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt2, marginBottom: 6 }}>{inconnu ? `Composé étudié : formule brute ${m.brute}` : `${m.nom} (${m.brute})`}</div>;
  const planche = (
    <div style={styleBoite}>
      {barre}
      {!inconnu && <Formule m={m} sel={sel} onSel={onSel} cacher={!libre} libre={libre}/>}
      {libre && <div style={{ fontSize: 13, color: KIT.txt2, margin: '2px 0 6px' }}>👆 Cliquez sur un signal du spectre ou sur un groupe de la formule pour l’agrandir.</div>}
      <Spectre m={m} sel={sel} onSel={onSel} integ={integ} cacher={!libre} libre={libre} titre={`Spectre RMN du proton ${inconnu ? 'du composé inconnu' : 'de ' + m.nom}`}/>
      {enExplore && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button onClick={() => setIntegE(v => !v)} style={stylePetitBouton(integE, VERMILLON)}>{integE ? '✓ ' : ''}Courbe d’intégration</button></div>}
      {gSel && <div style={{ marginTop: 10 }}>
        <Zoom x={gSel}/>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.65, marginTop: 6 }}>
          <strong>Signal {gSel.lettre} ({gSel.desc})</strong> : δ = {nf(gSel.d)} ppm, {hz(gSel.n)}.
          <br/>{gSel.nv === 0 ? <>Aucun H voisin non équivalent : <strong>singulet</strong>.</> : <>n = {gSel.nv} H voisins → n + 1 = {gSel.nv + 1} raies : <strong>{NOMS_MULT[gSel.mult]}</strong>.</>}
        </div></div>}
      {banque && <div style={{ marginTop: 10 }}><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Banque de données</div><TableBanque d={gSel ? gSel.d : null}/></div>}
      {enExplore && <div style={{ marginTop: 10 }}>
        {!corrige && <button onClick={() => setCorrige(true)} style={styleBouton(true, '#0ea5e9')}><Pic n="eye"/>Afficher le tableau d’analyse</button>}
        {corrige && <><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Tableau d’analyse</div><TableAnalyse m={m} sel={sel} onSel={onSel}/></>}
      </div>}
    </div>);
  const planDefi = (
    <div style={styleBoite}>
      <Spectre m={m} sel={null} onSel={() => {}} integ cacher libre={false} titre="Spectre RMN du proton du composé étudié"/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Spectre à {NU} MHz. Courbe d’intégration en rouge.</div></div>);
  const banqueExplore = <div style={styleBoite}><Section titre="Banque de données : déplacements chimiques usuels" ouvert={banqueOuv} onBascule={() => setBanqueOuv(o => !o)}><TableBanque d={gSel ? gSel.d : null}/></Section></div>;
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>1,3-dichloropropane et 2,2-dichloropropane (C₃H₆Cl₂) : combien de signaux chacun ? Qu’est-ce qui les distingue ?</li>
        <li>Éthanoate d’éthyle et propanoate de méthyle (C₄H₈O₂) : quels signaux changent de multiplicité ou de δ ?</li>
        <li>Éthoxyéthane : pourquoi le CH₂ est-il un quadruplet et le CH₃ un triplet ?</li>
        <li>1-bromobutane : classez les quatre groupes de H par δ décroissant et expliquez avec la distance à Br.</li>
        <li>3-méthylbutan-2-one : un signal de 1 H est un septuplet. D’où viennent les 6 H voisins ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>un signal par groupe de H équivalents</li><li>δ : la banque donne le type de proton</li><li>nombre de H = N × h / H</li><li>n voisins → n + 1 raies</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rmnstl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rmnstl-l1.cote { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); }
        .rmnstl-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .rmnstl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>RMN du proton : attribuer un spectre</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Un spectre de <strong>RMN ¹H</strong> donne le <strong>nombre de signaux</strong>, leur <strong>déplacement chimique</strong>, leur <strong>intégration</strong> et leur <strong>multiplicité</strong>. Avec une banque de données, vous attribuez chaque signal à un groupe de protons de la molécule.</div>
      <div className={`rmnstl-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution} indice={indiceDefi}/></div>}
          {enDefi ? planDefi : planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {enExplore && <div className="rmnstl-l2">{banqueExplore}{panneauHypo}</div>}
      {enGuide && ie >= ETAPES.length - 1 && <div className="rmnstl-l2">{panneauHypo}</div>}
      {enExplore && <div className="rmnstl-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
