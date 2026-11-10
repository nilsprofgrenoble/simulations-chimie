// Régiosélectivité de l'addition de HBr sur un alcène dissymétrique (BTS) : deux carbocations possibles, un profil d'énergie à deux voies.
import { useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, ARetenir, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { ALCENES, alcene, voies, proportions, profil, NOM_CLASSE, E_CATION, MONTEE_ET1, E_PRODUIT, T } from "./regioModele";

const SIM_ID = 93;
declarerDefis(SIM_ID, [['principal', 'Régiosélectivité']]);

const NOIR = '#0f172a', BLEU = '#1d4ed8', VERT = '#15803d', BRUN = '#9a3412', VIOLET = '#7c3aed';
const COUL = { A: '#0284c7', B: '#ea580c' };
const nb = (x, d = 0) => x.toFixed(d).replace('.', ',');
const pct = x => x >= 99.95 ? '> 99,9' : x <= 0.05 ? '< 0,1' : nb(x, x >= 10 && x <= 90 ? 0 : 1);

// ── Formule topologique d'une molécule : alcène, carbocation ou produit ──
function Squelette({ a, mode, v, numC, titre }) {
  const C = a.C, ids = Object.keys(C).map(k => (k === 'm' ? 'm' : +k));
  const voisins = id => a.liaisons.filter(([p, q]) => p === id || q === id).map(([p, q]) => (p === id ? q : p));
  // Directions libres autour d'un atome (éloignées des liaisons), de la plus dégagée à la moins dégagée
  const libres = id => {
    const [x, y] = C[id], angs = voisins(id).map(n => Math.atan2(C[n][1] - y, C[n][0] - x));
    const dist = (t, u) => Math.abs(((t - u + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    return Array.from({ length: 24 }, (_, k) => k * Math.PI / 12 - Math.PI)
            .map(t => { const c = Math.min(...angs.map(u => dist(t, u))); return { t, c: angs.length === 1 ? -Math.abs(c - 2.09) : c, haut: -Math.sin(t) }; }).sort((p, q) => (q.c - p.c) || (q.haut - p.haut));
  };
  const dehors = id => { const t = libres(id)[0].t; return [Math.cos(t), Math.sin(t)]; };
  const dirNum = id => {      // direction du numéro : libre aussi, mais à au moins 50° de celle de l'étiquette
    const t0 = libres(id)[0].t, ok = libres(id).find(d => Math.abs(Math.atan2(Math.sin(d.t - t0), Math.cos(d.t - t0))) > 0.87) || libres(id)[1];
    return [Math.cos(ok.t), Math.sin(ok.t)];
  };
  const xs = ids.map(i => C[i][0]), ys = ids.map(i => C[i][1]);
  const x0 = Math.min(...xs) - 42, x1 = Math.max(...xs) + 42, y0 = Math.min(...ys) - 46, y1 = Math.max(...ys) + 46;
  const doubleLiaison = mode === 'alcene';
  const etiquette = (id, txt, col) => {          // petit atome ajouté (H ou Br) relié au carbone par un trait
    const [ox, oy] = dehors(id), [x, y] = C[id], r = 30;
    return (<g key={txt + id}>
      <line x1={x + ox * 4} y1={y + oy * 4} x2={x + ox * (r - 10)} y2={y + oy * (r - 10)} stroke={col} strokeWidth={2} strokeLinecap="round" />
      <text x={x + ox * r} y={y + oy * r + 5} fontSize={txt === 'Br' ? 15 : 14} fontWeight="700" textAnchor="middle" fill={col}>{txt}</text>
    </g>);
  };
  return (
    <svg viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} role="img" aria-label={titre} style={{ width: '100%', maxWidth: 260, height: 'auto', display: 'block', margin: '0 auto' }}>
      {a.liaisons.map(([p, q], i) => {
        const [px, py] = C[p], [qx, qy] = C[q], ddx = qx - px, ddy = qy - py, d = Math.hypot(ddx, ddy), nx = -ddy / d * 3, ny = ddx / d * 3;
        const dbl = doubleLiaison && ((p === a.db[0] && q === a.db[1]) || (q === a.db[0] && p === a.db[1]));
        return dbl
          ? <g key={i}><line x1={px + nx} y1={py + ny} x2={qx + nx} y2={qy + ny} stroke={NOIR} strokeWidth={2.4} strokeLinecap="round" /><line x1={px - nx} y1={py - ny} x2={qx - nx} y2={qy - ny} stroke={NOIR} strokeWidth={2.4} strokeLinecap="round" /></g>
          : <line key={i} x1={px} y1={py} x2={qx} y2={qy} stroke={NOIR} strokeWidth={2.4} strokeLinecap="round" />;
      })}
      {mode !== 'alcene' && etiquette(v.h, 'H', VERT)}
      {mode === 'produit' && etiquette(v.c, 'Br', BRUN)}
      {mode === 'cation' && (() => { const [ox, oy] = dehors(v.c), [x, y] = C[v.c]; return (<g>
        <circle cx={x + ox * 20} cy={y + oy * 20} r={8} fill="white" stroke={BLEU} strokeWidth={1.8} />
        <text x={x + ox * 20} y={y + oy * 20 + 4.5} fontSize={14} fontWeight="700" textAnchor="middle" fill={BLEU}>+</text></g>); })()}
      {numC && ids.filter(i => i !== 'm').map(i => {
        const [rx, ry] = dirNum(i), [x, y] = C[i];
        return <text key={i} x={x + rx * 16} y={y + ry * 16 + 4.5} fontSize={13} fontWeight="700" textAnchor="middle" fill={VIOLET}>{i}</text>;
      })}
    </svg>);
}

// ── Profil d'énergie à deux voies ──
function ProfilRegio({ a, sel, setSel, montrerE }) {
  const [A, B] = voies(a), W = 360, H = 250, gx = 48, gy = 14, gw = W - gx - 14, gh = H - gy - 34;
  const Emin = -90, Emax = 125, X = x => gx + x * gw, Y = e => gy + (1 - (e - Emin) / (Emax - Emin)) * gh;
  const chemin = pts => {
    const P = pts.map(([x, e]) => [X(x), Y(e)]);
    let d = `M${P[0][0]},${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return d;
  };
  const ecart = Math.abs(A.ET1 - B.ET1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Profil d'énergie : deux voies d'addition, une par carbocation possible" style={{ width: '100%', display: 'block', background: '#fbfdff', borderRadius: 10 }}>
      <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke="#64748b" /><line x1={gx} y1={Y(0)} x2={gx + gw} y2={Y(0)} stroke="#cbd5e1" strokeDasharray="4 3" />
      <line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke="#64748b" />
      <text x={6} y={gy + 8} fontSize={11} fill={KIT.txt2}>Énergie</text>
      <text x={gx + gw} y={H - 6} fontSize={11} fill={KIT.txt2} textAnchor="end">avancement de la réaction →</text>
      {[[B, 'B'], [A, 'A']].sort(([, k]) => (k === sel ? 1 : -1)).map(([v, k]) => (
        <g key={k} style={{ cursor: 'pointer' }} onClick={() => setSel(k)}>
          <path d={chemin(profil(v))} fill="none" stroke={COUL[k]} strokeWidth={sel === k ? 4 : 2.4} opacity={sel && sel !== k ? 0.45 : 1} strokeLinecap="round" />
          <path d={chemin(profil(v))} fill="none" stroke="transparent" strokeWidth={14} />
          <circle cx={X(0.22)} cy={Y(v.ET1)} r={4} fill={COUL[k]} /><circle cx={X(0.45)} cy={Y(v.Ecat)} r={4} fill="white" stroke={COUL[k]} strokeWidth={2} />
          {montrerE && <><text x={X(0.22) + (k === 'A' ? -9 : 9)} y={Y(v.ET1) - 6} fontSize={11} fontWeight="700" fill={COUL[k]} textAnchor={k === 'A' ? 'end' : 'start'}>{v.ET1}</text>
            <text x={X(0.45) + (k === 'A' ? -9 : 9)} y={Y(v.Ecat) + 15} fontSize={11} fontWeight="700" fill={COUL[k]} textAnchor={k === 'A' ? 'end' : 'start'}>{v.Ecat}</text></>}
        </g>))}
      <text x={X(0.22)} y={Y(Math.max(A.ET1, B.ET1)) - 24} fontSize={11} fill={KIT.txt2} textAnchor="middle">ET₁</text>
      <text x={X(0.45)} y={Y(Math.min(A.Ecat, B.Ecat)) + 30} fontSize={11} fill={KIT.txt2} textAnchor="middle">carbocation</text>
      <text x={X(1)} y={Y(E_PRODUIT) + 15} fontSize={11} fill={KIT.txt2} textAnchor="end">produit</text>
      <text x={X(0) + 4} y={Y(0) + 15} fontSize={11} fill={KIT.txt2}>réactifs</text>
      {ecart > 0 && <g>
        <line x1={X(0.41)} y1={Y(A.ET1)} x2={X(0.41)} y2={Y(B.ET1)} stroke="#475569" strokeWidth={1.5} />
        <line x1={X(0.39)} y1={Y(A.ET1)} x2={X(0.43)} y2={Y(A.ET1)} stroke="#475569" /><line x1={X(0.39)} y1={Y(B.ET1)} x2={X(0.43)} y2={Y(B.ET1)} stroke="#475569" />
        <text x={X(0.45)} y={(Y(A.ET1) + Y(B.ET1)) / 2 + 4} fontSize={11} fontWeight="700" fill="#334155">Δ = {ecart} kJ/mol</text></g>}
    </svg>);
}

// ── Une voie d'addition ──
function CarteVoie({ a, v, p, numC, sel, setSel, majeure }) {
  const actif = sel === v.cle;
  return (
    <button onClick={() => setSel(actif ? null : v.cle)} aria-pressed={actif}
      style={{ flex: '1 1 200px', minWidth: 180, textAlign: 'center', cursor: 'pointer', background: 'white', borderRadius: 12, padding: '8px 8px 10px',
        border: `2px solid ${actif ? COUL[v.cle] : KIT.bord}`, boxShadow: actif ? `0 0 0 3px ${COUL[v.cle]}33` : 'none', color: KIT.txt, font: 'inherit' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: COUL[v.cle] }}>Voie {v.cle === 'A' ? 1 : 2} : H se fixe sur C{v.h}</div>
      <Squelette a={a} mode="cation" v={v} numC={numC} titre={`Carbocation si H se fixe sur C${v.h} : la charge est sur C${v.c}`} />
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>Carbocation {NOM_CLASSE[v.classe]} sur C{v.c}</div>
      <div style={{ fontSize: 12.5, color: KIT.txt2 }}>C⁺ lié à {v.classe} carbone{v.classe > 1 ? 's' : ''}</div>
      <div style={{ fontSize: 13.5, marginTop: 4 }}>Produit : <strong>{v.produit}</strong></div>
      <div style={{ fontSize: 13.5 }}>≈ <strong>{pct(p)} %</strong>{majeure ? ' (majoritaire)' : ''}</div>
    </button>);
}

// ── Parcours guidé ──
function etapesGuide(alc, setAlc) {
  const choisir = (id, nom) => ({ type: 'action', ok: alc === id, label: 'Le faire pour moi', faire: () => setAlc(id), consigne: `Choisis le ${nom} dans la liste des alcènes.`, indice: 'Utilise les boutons au-dessus du schéma.' });
  return [
    { titre: 'Un alcène dissymétrique', texte: <>Le <strong>propène</strong> CH₃–CH=CH₂ n'est pas symétrique : les deux carbones de la double liaison ne sont pas équivalents. HBr peut donc s'additionner de <strong>deux façons</strong> : H sur C1 ou H sur C2. Les deux cartes montrent les deux possibilités.</>,
      tache: { type: 'qcm', q: 'Combien de produits d’addition différents peut-on écrire avec le propène et HBr ?', options: ['Un seul', 'Deux : le 1-bromopropane et le 2-bromopropane', 'Trois'], bonne: 1, indice: 'Br peut se fixer sur C1 ou sur C2.', expl: <>Si H se fixe sur C2, Br se fixe sur C1 (1-bromopropane) ; si H se fixe sur C1, Br se fixe sur C2 (2-bromopropane). Une réaction qui favorise l'un de ces isomères de constitution est dite <strong>régiosélective</strong>.</> } },
    { titre: 'Où est la charge + ?', texte: <>À l'étape 1, le doublet π attaque H. Le carbone qui <strong>ne reçoit pas</strong> H perd sa part de la liaison π : il devient un carbocation, porteur de la charge +.</>,
      tache: { type: 'qcm', q: 'Si H se fixe sur C1 du propène, sur quel carbone se trouve la charge + ?', options: ['Sur C1', 'Sur C2', 'Sur C3'], bonne: 1, indice: 'La charge + est sur l’autre carbone de la double liaison.', expl: <>C1 reçoit H : c'est C2, l'autre carbone de la double liaison, qui n'a plus que 6 électrons de valence.</> } },
    { titre: 'Classer les carbocations', texte: <>On classe un carbocation d'après le nombre d'atomes de carbone liés au C⁺ : <strong>primaire</strong> (1), <strong>secondaire</strong> (2), <strong>tertiaire</strong> (3). Les cartes indiquent ce nombre.</>,
      tache: { type: 'qcm', q: 'Quelle est la classe du carbocation formé quand H se fixe sur C1 du propène ?', options: ['Primaire', 'Secondaire', 'Tertiaire'], bonne: 1, indice: 'Compte les carbones liés à C2 (celui qui porte la charge).', expl: <>C2 est lié à C1 et à C3 : deux carbones, donc carbocation secondaire. Dans l'autre voie, C1⁺ n'est lié qu'à C2 : primaire.</> } },
    { titre: 'Pourquoi le secondaire est plus stable', texte: <>Les groupes alkyle <strong>donnent</strong> de la densité électronique au carbone chargé (effet inductif donneur, et hyperconjugaison). Plus il y en a, plus la charge + est « diluée » et plus le carbocation est stable, donc plus bas en énergie.</>,
      tache: { type: 'qcm', q: 'Quel carbocation est le plus stable ?', options: ['Primaire', 'Secondaire', 'Ils ont la même énergie'], bonne: 1, indice: 'Regarde les énergies du carbocation sur le profil (active « Montrer les énergies »).', expl: <>Secondaire (60 kJ/mol) est plus bas que primaire (75 kJ/mol). Ordre de stabilité : tertiaire &gt; secondaire &gt; primaire.</> } },
    { titre: 'Lire les deux barrières', texte: <>L'étape qui détermine la vitesse est la formation du carbocation. Le sommet ET₁ ressemble au carbocation (postulat de Hammond) : un carbocation plus stable est atteint par un état de transition plus bas.</>,
      tache: { type: 'num', q: 'Quelle est la différence de hauteur entre les deux états de transition ET₁ ?', unite: 'kJ/mol', vrai: 15, tol: 0.02, cs: 2, indice: 'ET₁ voie 2 moins ET₁ voie 1 (valeurs lisibles sur le profil).', calcul: () => ['ET₁(primaire) − ET₁(secondaire) = 115 − 100 = 15 kJ/mol'] } },
    { titre: 'Le produit majoritaire', texte: <>La voie la plus basse est la plus rapide : c'est elle qui donne le produit <strong>majoritaire</strong> (contrôle cinétique). La proportion est calculée à 298 K avec la loi d'Arrhenius.</>,
      tache: { type: 'qcm', q: 'Quel est le produit majoritaire de l’addition de HBr sur le propène ?', options: ['Le 1-bromopropane', 'Le 2-bromopropane', 'Les deux en quantités égales'], bonne: 1, indice: 'Le produit majoritaire vient du carbocation le plus stable.', expl: <>Le carbocation secondaire (en C2) conduit au 2-bromopropane, formé à environ 99,8 %. C'est ce que résume la règle de Markovnikov.</> } },
    { titre: 'Avec le but-1-ène', texte: <>Même raisonnement avec une chaîne plus longue.</>, tache: choisir('but1ene', 'but-1-ène') },
    { titre: 'But-1-ène : le produit', texte: <>Le but-1-ène CH₃–CH₂–CH=CH₂ présente la même dissymétrie que le propène.</>,
      tache: { type: 'qcm', q: 'Quel produit est majoritaire avec le but-1-ène ?', options: ['Le 1-bromobutane', 'Le 2-bromobutane', 'Le 1-bromo-2-méthylpropane'], bonne: 1, indice: 'Cherche le carbocation secondaire (C⁺ lié à 2 carbones).', expl: <>Le carbocation secondaire en C2 donne le 2-bromobutane. (Il est de plus chiral : un mélange racémique est obtenu, comme dans la simulation TSTL.)</> } },
    { titre: 'Un alcène plus substitué', texte: <>Le 2-méthylprop-1-ène possède deux groupes méthyle sur C2.</>, tache: choisir('mpropene', '2-méthylprop-1-ène') },
    { titre: 'Primaire contre tertiaire', texte: <>Observe les deux cartes : un carbocation tertiaire est en compétition avec un primaire.</>,
      tache: { type: 'qcm', q: 'Pourquoi le carbocation tertiaire se forme-t-il beaucoup plus vite ici ?', options: ['Il est lié à 3 groupes alkyle donneurs : il est plus stable et son ET₁ est plus bas', 'Il possède plus de liaisons C–H', 'La charge + est plus petite'], bonne: 0, indice: 'Pense à l’effet des groupes alkyle sur la charge +.', expl: <>L'écart de barrière est de 25 kJ/mol : la voie tertiaire est plus rapide d'un facteur ~25 000. Le produit minoritaire est à peine détectable.</> } },
    { titre: 'Bilan', texte: <>Tu sais prévoir le produit majoritaire d'une addition de HBr sur un alcène dissymétrique.</>,
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Un alcène dissymétrique donne <strong>deux produits possibles</strong> : la réaction est <strong>régiosélective</strong>.</li>
        <li>On écrit les deux carbocations possibles et on compare leur <strong>stabilité</strong> : tertiaire &gt; secondaire &gt; primaire.</li>
        <li>Le carbocation le plus stable se forme le plus vite : il donne le <strong>produit majoritaire</strong>.</li>
        <li>Règle de Markovnikov : H se fixe sur le carbone <em>le plus hydrogéné</em> de la double liaison (conséquence de la stabilité du carbocation).</li>
      </ul> },
  ];
}

// ── Défi : questions tirées d'un alcène aléatoire ──
function alea(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function melange(arr, r) { const a = arr.map((v, i) => [v, i]); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function defi(seed = Math.floor(Math.random() * 1e9)) {
  const r = alea(seed), a = ALCENES[Math.floor(r() * ALCENES.length)], [A, B] = voies(a), pr = proportions(a);
  const noms = melange(ALCENES.flatMap(x => voies(x).map(v => v.produit)).filter((n, i, t) => t.indexOf(n) === i && n !== A.produit && n !== B.produit).slice(0, 8).map(n => [n, 0]), r).slice(0, 1);
  const prod = melange([[A.produit, A.produit === pr.majeure.produit ? 1 : 0], [B.produit, B.produit === pr.majeure.produit ? 1 : 0], ...noms], r);
  const classes = melange([['Primaire', 1], ['Secondaire', 2], ['Tertiaire', 3]], r);
  const q1 = { id: 'classe', type: 'qcm', q: `Pour le ${a.nom} (${a.semi}), quelle est la classe du carbocation le plus stable que l’on peut former ?`, options: classes.map(([[t]]) => t), bonne: classes.findIndex(([[, c]]) => c === pr.majeure.classe), detail: `Le carbocation le plus stable est celui lié au plus de carbones : ici ${NOM_CLASSE[pr.majeure.classe]} (C${pr.majeure.c}⁺).` };
  const q2 = { id: 'majo', type: 'qcm', q: `Quel est le produit majoritaire de l’addition de HBr sur le ${a.nom} ?`, options: prod.map(([[t]]) => t), bonne: prod.findIndex(([[, e]]) => e === 1), detail: `Br se fixe sur C${pr.majeure.c}, le carbone qui portait la charge + du carbocation le plus stable : ${pr.majeure.produit}.` };
  const q3 = { id: 'ecart', type: 'num', q: `Quelle est la différence d’énergie entre les deux états de transition ET₁ (voie 1 et voie 2) pour le ${a.nom} ?`, unite: 'kJ/mol', vrai: pr.ecart, tol: 0.02, detail: `|ET₁(voie 2) − ET₁(voie 1)| = |${B.ET1} − ${A.ET1}| = ${pr.ecart} kJ/mol.` };
  const q4 = { id: 'ea', type: 'num', q: `Quelle est l’énergie d’activation de l’étape 1 pour la voie qui donne le produit majoritaire (${pr.majeure.produit}) ?`, unite: 'kJ/mol', vrai: pr.majeure.ET1, tol: 0.02, detail: `Ea = ET₁ − E(réactifs) = ${pr.majeure.ET1} − 0 = ${pr.majeure.ET1} kJ/mol.` };
  return { Q: [q1, q2, q3, q4], reps: {}, verifie: false };
}
const INDICE_Q = {
  classe: 'Compte les carbones liés à C⁺ : 1 → primaire, 2 → secondaire, 3 → tertiaire.',
  majo: 'Le produit majoritaire vient du carbocation le plus stable : Br se fixe là où se trouvait la charge +.',
  ecart: 'Lis les deux sommets ET₁ sur le profil (active « Montrer les énergies ») et fais la différence.',
  ea: 'Énergie du sommet ET₁ de la voie majoritaire moins énergie des réactifs (0).',
};

const hypotheses = (
  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
    <li>Les énergies (carbocation primaire {E_CATION[1]}, secondaire {E_CATION[2]}, tertiaire {E_CATION[3]} kJ/mol ; ET₁ = carbocation + {MONTEE_ET1} kJ/mol) sont des <strong>ordres de grandeur arrondis</strong> choisis pour illustrer la tendance : ce ne sont pas des valeurs mesurées.</li>
    <li>Les proportions sont calculées en <strong>contrôle cinétique</strong> à {T} K, avec un rapport de vitesses exp(ΔΔE‡/RT). On néglige les termes entropiques et le rôle du solvant.</li>
    <li>HBr s'additionne par un mécanisme <strong>ionique</strong> (sans peroxydes). En présence de peroxydes ou de lumière, un mécanisme radicalaire donnerait le produit anti-Markovnikov.</li>
    <li>On ne considère pas les <strong>transpositions</strong> de carbocation (migration d'un H ou d'un CH₃), qui peuvent se produire pour certains substrats.</li>
    <li>Les produits des deux voies sont supposés avoir la même énergie (−{Math.abs(E_PRODUIT)} kJ/mol) : la sélectivité est ici d'origine cinétique.</li>
  </ul>
);

export function SimulationRegioselectiviteHBr() {
  const [mode, setMode] = useState(() => modeOuverture('regio-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('regio-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [alc, setAlc] = useState('propene');
  const [numC, setNumC] = useState(true);
  const [montrerE, setMontrerE] = useState(true);
  const [sel, setSel] = useState(null);
  const [df, setDf] = useState(() => defi());
  const [hypoOuv, setHypoOuv] = useState(false);
  const a = alcene(alc), [A, B] = voies(a), pr = proportions(a);
  const etapes = etapesGuide(alc, setAlc);
  const finParcours = guide.etape >= etapes.length;
  const juste = q => q.type === 'num' ? proche(lireNombre(df.reps[q.id] ?? ''), q.vrai, q.tol) : df.reps[q.id] === q.bonne;

  const visuel = (
    <div style={{ flex: '1 1 380px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {ALCENES.map(x => <button key={x.id} onClick={() => { setAlc(x.id); setSel(null); }} style={stylePetitBouton(alc === x.id, '#7c3aed')}>{x.nom}</button>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '6px 10px' }}>
        <div style={{ width: 190, flex: '0 0 auto' }}><Squelette a={a} mode="alcene" numC={numC} titre={`Formule topologique du ${a.nom}`} /></div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5 }}><strong>{a.nom}</strong> + HBr<br /><span style={{ color: KIT.txt2 }}>{a.semi}</span><br />Deux voies sont possibles : choisis une carte pour la suivre sur le profil.</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <CarteVoie a={a} v={A} p={pr.A} numC={numC} sel={sel} setSel={setSel} majeure={pr.majeure.cle === 'A' && !pr.egales} />
        <CarteVoie a={a} v={B} p={pr.B} numC={numC} sel={sel} setSel={setSel} majeure={pr.majeure.cle === 'B' && !pr.egales} />
      </div>
      <ProfilRegio a={a} sel={sel} setSel={setSel} montrerE={montrerE} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: KIT.txt }}>
        <label><input type="checkbox" checked={montrerE} onChange={e => setMontrerE(e.target.checked)} /> Montrer les énergies</label>
        <label><input type="checkbox" checked={numC} onChange={e => setNumC(e.target.checked)} /> Numéroter les carbones</label>
      </div>
    </div>
  );

  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Utilise les cartes et le profil d'énergie (carbocations, barrières) pour répondre. Change d'alcène avec les boutons si besoin.</div>
      {df.Q.map((q, k) => {
        const ok = juste(q);
        return (
          <div key={q.id} style={{ borderLeft: `3px solid ${df.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
            <IndiceDefi cache={df.verifie && ok}>{avecIndices(INDICE_Q[q.id])}</IndiceDefi>
            {q.type === 'qcm' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: i } }))}
                    style={{ textAlign: 'left', fontSize: 13.5, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${df.reps[q.id] === i ? '#0284c7' : KIT.bord}`, background: df.reps[q.id] === i ? '#e0f2fe' : 'white', color: KIT.txt }}>{o}</button>))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={df.reps[q.id] ?? ''} onChange={e => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: e.target.value } }))} inputMode="decimal" aria-label={q.q}
                  style={{ width: 90, padding: '6px 8px', fontSize: 14, borderRadius: 8, border: `1.5px solid ${KIT.bord}` }} />
                <span style={{ fontSize: 14, color: KIT.txt }}>{q.unite}</span>
              </div>)}
            {df.verifie && !ok && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>{q.type === 'num' && <>Réponse attendue : <strong>{fmt(q.vrai, 0)} {q.unite}</strong> — </>}{avecIndices(q.detail)}</div>}
          </div>);
      })}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { noterDefi(df.Q.every(juste)); setDf(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => setDf(defi())} style={styleBouton(false)}><Pic n="refresh" />Nouvelles données</button>
        {df.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{df.Q.filter(juste).length} / {df.Q.length} réponses justes</span>}
      </div>
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Régiosélectivité de l'addition de HBr</h2>
        <BoutonsModes mode={mode} setMode={setMode} />
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 10 }}>
        {visuel}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'guide' && <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />}
          {mode === 'explore' && <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Mesures sur le profil</div>
            <LigneMesure nom="ET₁ voie 1 (kJ/mol)" valeur={fmt(A.ET1, 0)} couleur={COUL.A} />
            <LigneMesure nom="ET₁ voie 2 (kJ/mol)" valeur={fmt(B.ET1, 0)} couleur={COUL.B} />
            <LigneMesure nom="Écart des barrières (kJ/mol)" valeur={fmt(pr.ecart, 0)} couleur="#475569" />
            <LigneMesure nom={`Produit majoritaire (${T} K)`} valeur={`${pct(Math.max(pr.A, pr.B))} %`} couleur="#16a34a" />
            <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 8, lineHeight: 1.55 }}>
              {pr.egales ? 'Les deux carbocations ont la même stabilité : on obtient un mélange équimolaire.'
                : <>Le carbocation <strong>{NOM_CLASSE[pr.majeure.classe]}</strong> (C{pr.majeure.c}⁺) est plus stable que le {NOM_CLASSE[pr.mineure.classe]} : sa barrière est plus basse de {pr.ecart} kJ/mol, il se forme environ <strong>{pr.rapport >= 1000 ? `${Math.round(pr.rapport / 100) * 100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : Math.round(pr.rapport)} fois plus vite</strong>. Produit majoritaire : <strong>{pr.majeure.produit}</strong>.</>}
            </div>
          </div>}
          {mode === 'defi' && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></div>}
        </div>
      </div>
      {finParcours && mode === 'guide' && <ARetenir titre="À RETENIR">Le produit majoritaire vient du carbocation le plus stable : tertiaire &gt; secondaire &gt; primaire.</ARetenir>}
      <div style={{ ...styleBoite, marginTop: 12 }}>
        <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
      </div>
    </div>
  );
}
