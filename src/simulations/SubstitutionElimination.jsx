// Substitution ou élimination ? (BTS) : SN1, SN2, E1, E2 sur des halogénoalcanes en C4.
import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, ARetenir, FormuleEnLigne, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { SUBSTRATS, REACTIFS, MECA, proportions, profil, energieEn, barriere } from "./snModele";

const SIM_ID = 95;
declarerDefis(SIM_ID, [['principal', 'Substitution ou élimination']]);

const COUL = { SN2: '#0284c7', SN1: '#0891b2', E2: '#ea580c', E1: '#c2410c' };
const NOIR = '#0f172a', BRUN = '#9a3412';

// ── Formule topologique du substrat ──
const SQUELETTES = {
  prim: { c: [[8, 40], [44, 20], [80, 40], [116, 20]], br: [116, 20, 150, 40], lab: [[116, 20, 150, 40]] },
  sec: { c: [[8, 40], [44, 20], [80, 40], [116, 20]], br: [44, 20, 44, -2] },
  tert: { c: [[70, 36], [30, 14], [110, 14], [30, 58]], br: [70, 36, 110, 58] },
};
function Substrat({ cle }) {
  const s = SQUELETTES[cle];
  const lien = (a, b) => <line key={`${a}${b}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={NOIR} strokeWidth={2.4} strokeLinecap="round" />;
  const C = s.c, L = [];
  if (cle === 'tert') { for (let i = 1; i < 4; i++) L.push(lien(C[0], C[i])); }
  else { for (let i = 0; i < 3; i++) L.push(lien(C[i], C[i + 1])); }
  const [x1, y1, x2, y2] = s.br;
  const ex = x2 - x1, ey = y2 - y1, n = Math.hypot(ex, ey), ux = ex / n, uy = ey / n, cut = 11;
  return (
    <svg viewBox="-6 -12 190 82" role="img" aria-label={`Formule topologique du ${SUBSTRATS[cle].nom}`} style={{ width: '100%', maxWidth: 230, height: 90, display: 'block', margin: '0 auto' }}>
      {L}
      <line x1={x1} y1={y1} x2={x2 - ux * cut} y2={y2 - uy * cut} stroke={BRUN} strokeWidth={2.4} strokeLinecap="round" />
      <text x={x2} y={y2 + 5} fontSize={15} fontWeight="800" fill={BRUN} textAnchor="middle">Br</text>
    </svg>);
}

// ── Profil d'énergie du mécanisme examiné, avec une bille ──
function Profil({ meca, sub, re, u }) {
  const { pts } = profil(meca, sub, re);
  const W = 360, H = 220, gx = 40, gy = 14, gw = W - gx - 12, gh = H - gy - 34, Emin = -50, Emax = 180;
  const X = x => gx + x * gw, Y = e => gy + (1 - (e - Emin) / (Emax - Emin)) * gh;
  let d = '';
  for (let i = 0; i <= 120; i++) { const x = i / 120; d += `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(energieEn(pts, x)).toFixed(1)} `; }
  const n = pts.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Profil d'énergie du mécanisme ${meca}`} style={{ width: '100%', display: 'block', background: '#fbfdff', borderRadius: 10 }}>
      <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke="#64748b" /><line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke="#64748b" />
      <line x1={gx} y1={Y(0)} x2={gx + gw} y2={Y(0)} stroke="#cbd5e1" strokeDasharray="4 3" />
      <text x={6} y={gy + 8} fontSize={11} fill={KIT.txt2}>Énergie</text>
      <text x={gx + gw} y={H - 6} fontSize={11} fill={KIT.txt2} textAnchor="end">avancement de la réaction →</text>
      <path d={d} fill="none" stroke={COUL[meca]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([nom, e], i) => {
        const x = i / n, haut = nom.startsWith('ET');
        return (<g key={nom}>
          <text x={X(x)} y={haut ? Y(e) - 22 : Y(e) + 16} fontSize={11} fill={KIT.txt2} textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'}>{nom}</text>
          <text x={X(x)} y={haut ? Y(e) - 9 : Y(e) + 29} fontSize={11} fontWeight="700" fill={KIT.txt} textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'}>{String(e).replace('-', '−')}</text>
        </g>);
      })}
      <circle cx={X(u)} cy={Y(energieEn(pts, u))} r={7} fill="#f59e0b" stroke="white" strokeWidth={2} />
    </svg>);
}

// ── Description du mécanisme, qui suit la position de la bille ──
function etatMeca(meca, u, sub) {
  const n = MECA[meca].etapes === 1 ? [0.25, 0.75] : [0.12, 0.38, 0.62, 0.88];
  if (MECA[meca].etapes === 1) {
    const rel = u < n[0] ? 0 : u < n[1] ? 1 : 2;
    if (meca === 'SN2') return [
      <>Le nucléophile HO⁻ s'approche du carbone <strong>par l'arrière</strong>, du côté opposé à Br.</>,
      <><strong>État de transition</strong> : HO se forme pendant que C–Br se rompt. Le carbone, entouré de cinq groupes, est très encombré : c'est pourquoi la barrière augmente avec la classe du substrat.</>,
      <>Br⁻ est parti. La configuration du carbone est <strong>inversée</strong>{SUBSTRATS[sub].chiral ? ' : le 2-bromobutane (R) donne le butan-2-ol (S)' : ''}.</>][rel];
    return [
      <>La base B⁻ s'approche d'un atome d'hydrogène porté par le carbone <strong>voisin</strong> de C–Br (carbone β).</>,
      <><strong>État de transition</strong> : B–H se forme, C–H et C–Br se rompent et la liaison C=C commence à se former, tout cela <strong>en même temps</strong>.</>,
      <>On obtient un <strong>alcène</strong>, la base protonée BH et Br⁻.</>][rel];
  }
  const r = u < n[0] ? 0 : u < n[1] ? 1 : u < n[2] ? 2 : u < n[3] ? 3 : 4;
  return [
    <>Le substrat est seul : la liaison C–Br commence à se polariser.</>,
    <><strong>Étape 1 (lente)</strong> : la liaison C–Br se rompt toute seule, Br⁻ part avec son doublet.</>,
    <><strong>Carbocation</strong> : intermédiaire plan, très réactif. Plus il est substitué, plus il est stable (donc plus la barrière ET₁ est basse).</>,
    meca === 'SN1'
      ? <><strong>Étape 2 (rapide)</strong> : le nucléophile (l'eau) attaque le carbone positif, <strong>sur l'une ou l'autre face</strong> du plan.</>
      : <><strong>Étape 2 (rapide)</strong> : une base (l'eau) arrache un H du carbone voisin ; le doublet de C–H forme la double liaison C=C.</>,
    meca === 'SN1'
      ? <>Après perte de H⁺, on obtient l'alcool. Si le carbone est asymétrique, les deux faces donnent un mélange <strong>racémique</strong>.</>
      : <>On obtient l'<strong>alcène</strong> et H⁺ est capté par le solvant.</>][r];
}

// ── Parcours guidé ──
function etapesGuide(st, regler) {
  const { sub, re, chaud } = st;
  const ici = (s, r, c) => sub === s && re === r && (c === undefined || chaud === c);
  const le_faire = (s, r, c, consigne) => ({ type: 'action', ok: ici(s, r, c), faire: () => regler(s, r, c), label: 'Le faire pour moi', consigne, indice: 'Utilise les menus « Halogénoalcane » et « Réactif », ou le bouton « Le faire pour moi ».' });
  return [
    { titre: 'Un halogénoalcane et un réactif',
      retenirTitre: 'À RETENIR : DEUX VOIES POSSIBLES',
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Dans R–Br, le carbone lié à Br est <strong>δ+</strong> (Br est plus électronégatif que C).</li>
        <li><strong>Substitution (S)</strong> : le réactif remplace Br sur le carbone. Avec HO⁻ : R–Br + HO⁻ → R–OH + Br⁻ (un <strong>alcool</strong>).</li>
        <li><strong>Élimination (E)</strong> : le réactif arrache un H voisin et Br part. Avec HO⁻ : R–Br + HO⁻ → alcène + H₂O + Br⁻ (un <strong>alcène</strong>).</li>
        <li>Un réactif est <strong>nucléophile</strong> s’il attaque un carbone, <strong>base</strong> s’il arrache un H. Le même réactif peut jouer les deux rôles : tout l’enjeu est de savoir lequel l’emporte.</li>
        <li>Dans SN2, E1… : S ou E donne le type de réaction ; <strong>1</strong> ou <strong>2</strong> indique combien d’espèces interviennent dans l’étape lente.</li>
      </ul>,
      texte: <>Un halogénoalcane R–Br a un carbone <strong>positivement polarisé</strong> (δ+) lié à Br. Un réactif riche en électrons peut deux choses : <strong>attaquer ce carbone</strong> (substitution) ou <strong>arracher un H voisin</strong> (élimination d'un H et de Br : on forme un alcène). Premier cas : un halogénoalcane <strong>primaire</strong> avec la base forte HO⁻.</>,
      tache: le_faire('prim', 'HO', false, 'Choisis le 1-bromobutane et HO⁻ à 25 °C.') },
    { titre: 'Une seule étape', texte: <>Fais glisser la bille sur le profil. Il n'y a qu'<strong>un état de transition</strong> : la réaction se fait en une seule étape. Le nucléophile attaque en même temps que Br⁻ part : c'est une <strong>SN2</strong>.</>,
      tache: { type: 'qcm', q: 'Pour une SN2, comment varie la vitesse si on double la concentration en HO⁻ ?', options: ['Elle ne change pas', 'Elle double : v = k·[RBr]·[HO⁻]', 'Elle est multipliée par quatre'], bonne: 1, indice: 'Dans une réaction en une seule étape, les deux réactifs interviennent dans l’état de transition.', expl: <>L'état de transition contient à la fois RBr et HO⁻ : la vitesse dépend des deux concentrations (ordre global 2). On dit <strong>bimoléculaire</strong>, d'où le « 2 » de SN2.</> } },
    { titre: 'Le substrat tertiaire',
      retenirTitre: 'À RETENIR : LA CLASSE DU SUBSTRAT',
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>La <strong>classe</strong> d’un halogénoalcane est le nombre de groupes alkyle portés par le carbone lié à Br : <strong>primaire</strong> (1), <strong>secondaire</strong> (2), <strong>tertiaire</strong> (3).</li>
        <li>Plus la classe monte, plus ce carbone est <strong>encombré</strong> : l’attaque par l’arrière (SN2) devient difficile.</li>
        <li>Plus la classe monte, plus le carbocation formé est <strong>stable</strong> : SN1 et E1 deviennent possibles.</li>
        <li>Barrière de la SN2 dans le modèle (ordres de grandeur schématiques) : <strong>85</strong> kJ·mol⁻¹ (primaire), <strong>100</strong> (secondaire), <strong>125</strong> (tertiaire).</li>
        <li>Les trois substrats de la simulation : 1-bromobutane (primaire), 2-bromobutane (secondaire), 2-bromo-2-méthylpropane (tertiaire).</li>
      </ul>,
      texte: <>Remplace maintenant le substrat par un halogénoalcane <strong>tertiaire</strong> (le carbone lié à Br porte trois groupes alkyle), toujours avec HO⁻.</>,
      tache: le_faire('tert', 'HO', false, 'Choisis le 2-bromo-2-méthylpropane et HO⁻ à 25 °C.') },
    { titre: 'Pourquoi pas de SN2 ?', texte: <>Compare la barrière de la SN2 et celle de l'E2 pour ce substrat (boutons « Mécanisme examiné » du profil).</>,
      tache: { type: 'qcm', q: 'Pourquoi la SN2 est-elle quasi impossible sur un substrat tertiaire ?', options: ['HO⁻ est trop faible comme nucléophile', 'Le carbone est encombré par les trois groupes alkyle : l’attaque par l’arrière est bloquée', 'Br⁻ est un mauvais groupe partant'], bonne: 1, indice: 'La SN2 demande une approche du nucléophile du côté opposé à Br.', expl: <>Trois groupes alkyle entourent le carbone : HO⁻ ne peut pas approcher par l'arrière (barrière SN2 ≈ 125 kJ/mol). L'<strong>E2</strong> est bien plus facile : HO⁻ attaque un H périphérique, plus accessible. HO⁻ est ici une <strong>base</strong> plutôt qu’un nucléophile.</> } },
    { titre: 'Sans base forte : le solvant seul', texte: <>Garde le substrat tertiaire, mais remplace HO⁻ par <strong>l'eau</strong> (nucléophile faible, base faible).</>,
      tache: le_faire('tert', 'H2O', false, 'Choisis le 2-bromo-2-méthylpropane et l’eau à 25 °C.') },
    { titre: 'Deux étapes et un carbocation',
      retenirTitre: 'À RETENIR : UNE ÉTAPE OU DEUX ?',
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li><strong>SN2 et E2</strong> : une seule étape, un seul état de transition ; les deux réactifs y participent.</li>
        <li><strong>SN1 et E1</strong> : deux étapes, avec un <strong>carbocation</strong> entre les deux. C’est un <strong>intermédiaire</strong> (un creux du profil), pas un état de transition (un sommet).</li>
        <li>Étape 1 : rupture de C–Br, sans aucun réactif. C’est l’étape <strong>lente</strong>, elle fixe la vitesse. Étape 2 : le nucléophile ou la base arrive sur le carbocation, étape rapide.</li>
        <li>Stabilité du carbocation : <strong>tertiaire &gt; secondaire &gt; primaire</strong>. Énergie du carbocation dans le modèle : 55 (tertiaire), 85 (secondaire), 160 kJ·mol⁻¹ (primaire). Ces valeurs sont <strong>illustratives, propres à cette simulation</strong> : seul le classement est à retenir.</li>
        <li>Un carbocation peut se réarranger : voir la simulation « Transposition de carbocation ».</li>
      </ul>,
      texte: <>Le profil montre maintenant <strong>deux états de transition</strong> séparés par un minimum : le <strong>carbocation</strong>. Anime-le avec la bille. L'étape 1 est la rupture de C–Br, sans aucun réactif : c'est l'étape lente.</>,
      tache: { type: 'num', q: 'Quelle est l’énergie d’activation de l’étape 1 (ET₁ − réactifs) pour ce substrat ?', unite: 'kJ/mol', vrai: barriere('SN1', 'tert', 'H2O'), tol: 0.02, cs: 2, indice: 'Lis l’énergie de ET₁ sur le profil ; les réactifs sont à 0.', calcul: () => [`E(ET₁) − E(réactifs) = ${barriere('SN1', 'tert', 'H2O')} − 0 = ${barriere('SN1', 'tert', 'H2O')} kJ/mol`] } },
    { titre: 'La loi de vitesse de la SN1', texte: <>L'étape lente ne fait intervenir que le substrat. Le nucléophile arrive après, dans une étape rapide.</>,
      tache: { type: 'qcm', q: 'Si on double la concentration du nucléophile, la vitesse d’une SN1 …', options: ['est doublée', 'ne change pas : v = k·[RBr]', 'est divisée par deux'], bonne: 1, indice: 'La vitesse est fixée par l’étape lente.', expl: <>La vitesse est celle de l'étape lente (ET₁), qui ne dépend que de [RBr] : ordre 1, réaction <strong>monomoléculaire</strong>, d'où le « 1 » de SN1.</> } },
    { titre: 'Le substrat secondaire et la stéréochimie', texte: <>Le 2-bromobutane est <strong>chiral</strong> (le carbone lié à Br est asymétrique). Place-toi sur ce substrat avec l'eau et observe l'étape 2 du mécanisme : le nucléophile arrive sur le carbocation <strong>plan</strong>.</>,
      tache: { ...le_faire('sec', 'H2O', false, 'Choisis le 2-bromobutane et l’eau à 25 °C.'), } },
    { titre: 'SN1 ou SN2 : conséquence sur la configuration',
      retenirTitre: 'À RETENIR : LES MARQUEURS DES MÉCANISMES',
      retenir: <>
        <svg viewBox="0 0 300 124" style={{ width: '100%', maxWidth: 300, display: 'block', margin: '0 auto' }} role="img" aria-label="SN2 : le nucléophile attaque par l’arrière, la configuration s’inverse. SN1 : le carbocation est plan, le nucléophile peut attaquer sur les deux faces, on obtient un mélange racémique.">
          <text x="70" y="14" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0284c7">SN2 : inversion</text>
          <text x="228" y="14" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0891b2">SN1 : racémique</text>
          <line x1="150" y1="6" x2="150" y2="118" stroke="#cbd5e1" strokeDasharray="3,3"/>
          <g stroke="#0f172a" strokeWidth="2" strokeLinecap="round">
            <line x1="70" y1="66" x2="70" y2="36"/><line x1="70" y1="66" x2="46" y2="94"/><line x1="70" y1="66" x2="94" y2="94"/>
          </g>
          <circle cx="70" cy="66" r="4" fill="#0f172a"/>
          <text x="70" y="32" textAnchor="middle" fontSize="10" fill="#0f172a">R</text><text x="40" y="104" textAnchor="middle" fontSize="10" fill="#0f172a">R</text><text x="100" y="104" textAnchor="middle" fontSize="10" fill="#0f172a">R</text>
          <text x="14" y="70" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0284c7">Nu⁻</text>
          <line x1="26" y1="66" x2="60" y2="66" stroke="#0284c7" strokeWidth="2"/><polygon points="64,66 56,62 56,70" fill="#0284c7"/>
          <text x="126" y="70" textAnchor="middle" fontSize="11" fontWeight="700" fill="#b45309">Br⁻</text>
          <line x1="78" y1="66" x2="112" y2="66" stroke="#b45309" strokeWidth="1.5" strokeDasharray="3,2"/>
          <text x="70" y="120" textAnchor="middle" fontSize="9" fill="#475569">attaque par l’arrière</text>
          <polygon points="188,78 268,78 254,56 202,56" fill="#e0f2fe" stroke="#7dd3fc"/>
          <g stroke="#0f172a" strokeWidth="2" strokeLinecap="round">
            <line x1="228" y1="67" x2="208" y2="70"/><line x1="228" y1="67" x2="248" y2="70"/><line x1="228" y1="67" x2="228" y2="58"/>
          </g>
          <circle cx="228" cy="67" r="3.5" fill="#0f172a"/><text x="238" y="64" fontSize="11" fontWeight="700" fill="#0f172a">+</text>
          <text x="202" y="76" textAnchor="middle" fontSize="9.5" fill="#0f172a">R</text><text x="254" y="76" textAnchor="middle" fontSize="9.5" fill="#0f172a">R</text><text x="228" y="54" textAnchor="middle" fontSize="9.5" fill="#0f172a">R</text>
          <text x="228" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0891b2">Nu⁻</text>
          <line x1="228" y1="31" x2="228" y2="44" stroke="#0891b2" strokeWidth="2"/><polygon points="228,50 223,42 233,42" fill="#0891b2"/>
          <text x="228" y="108" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0891b2">Nu⁻</text>
          <line x1="228" y1="96" x2="228" y2="88" stroke="#0891b2" strokeWidth="2"/><polygon points="228,82 223,90 233,90" fill="#0891b2"/>
          <text x="228" y="121" textAnchor="middle" fontSize="9" fill="#475569">carbocation plan : deux faces</text>
        </svg>
        <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5, width: '100%' }}>
          <thead><tr><th style={{ padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Mécanisme</th><th style={{ padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Étapes</th><th style={{ padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Loi de vitesse</th><th style={{ padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Marqueur</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><strong>SN2</strong></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>1</td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><FormuleEnLigne><mi>v</mi><mo>=</mo><mi>k</mi><mo>·</mo><mo stretchy="false">[</mo><mi>RBr</mi><mo stretchy="false">]</mo><mo>·</mo><mo stretchy="false">[</mo><mi>Nu</mi><mo stretchy="false">]</mo></FormuleEnLigne></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}>inversion de configuration</td></tr>
            <tr><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><strong>SN1</strong></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>2</td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><FormuleEnLigne><mi>v</mi><mo>=</mo><mi>k</mi><mo>·</mo><mo stretchy="false">[</mo><mi>RBr</mi><mo stretchy="false">]</mo></FormuleEnLigne></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}>racémique (si C asymétrique)</td></tr>
            <tr><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><strong>E2</strong></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>1</td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><FormuleEnLigne><mi>v</mi><mo>=</mo><mi>k</mi><mo>·</mo><mo stretchy="false">[</mo><mi>RBr</mi><mo stretchy="false">]</mo><mo>·</mo><mo stretchy="false">[</mo><mi>B</mi><mo stretchy="false">]</mo></FormuleEnLigne></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}>alcène, en une étape</td></tr>
            <tr><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><strong>E1</strong></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>2</td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><FormuleEnLigne><mi>v</mi><mo>=</mo><mi>k</mi><mo>·</mo><mo stretchy="false">[</mo><mi>RBr</mi><mo stretchy="false">]</mo></FormuleEnLigne></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}>alcène, par le carbocation</td></tr>
          </tbody>
        </table>
        <div style={{ fontSize: 13.5 }}>Ordre global 2 : les deux réactifs dans l’étape déterminante. Ordre 1 : seul le substrat.</div>
      </>,
      texte: <>Rappel : en SN2, le nucléophile attaque par l'arrière (inversion). En SN1, le carbocation est plan.</>,
      tache: { type: 'qcm', q: 'Partant du (R)-2-bromobutane pur, quel est le produit d’une SN1 ?', options: ['Le (S)-butan-2-ol pur (inversion)', 'Le (R)-butan-2-ol pur (rétention)', 'Un mélange racémique de butan-2-ol (R et S)'], bonne: 2, indice: 'Le nucléophile peut attaquer le carbocation plan sur ses deux faces.', expl: <>Le carbocation est plan, achiral : l'attaque est possible sur les deux faces avec la même probabilité. On obtient un <strong>racémique</strong>, alors qu'une SN2 donnerait l'énantiomère inversé (S), pur.</> } },
    { titre: 'L\'effet de la température', texte: <>Reste sur le même substrat et chauffe à <strong>80 °C</strong>. Observe la barre de composition.</>,
      tache: le_faire('sec', 'H2O', true, 'Passe à 80 °C avec le 2-bromobutane et l’eau.') },
    { titre: 'Chauffer favorise l’élimination', texte: <>La proportion d'alcène a augmenté. L'élimination forme <strong>plus de molécules</strong> (alcène + HBr, à partir d'une seule molécule d'halogénoalcane) : le désordre augmente, ΔS {">"} 0. Or ΔG = ΔH − TΔS : plus T est grand, plus le terme −TΔS favorise l'élimination.</>,
      tache: { type: 'qcm', q: 'Pour limiter l’élimination et obtenir surtout l’alcool, on opère plutôt …', options: ['à température élevée', 'à température modérée ou basse', 'la température n’a aucun effet'], bonne: 1, indice: 'L’élimination est favorisée par l’élévation de température.', expl: <>L'élimination est favorisée par la température (variation d'entropie positive). Pour obtenir l'alcool, on reste à température modérée.</> } },
    { titre: 'Une base encombrée', texte: <>Dernier cas : la base <strong>tBuO⁻</strong> est très encombrée. Essaie-la avec un substrat <strong>primaire</strong>, qui donnait de la SN2 avec HO⁻.</>,
      tache: le_faire('prim', 'tBuO', false, 'Choisis le 1-bromobutane et tBuO⁻ à 25 °C.') },
    { titre: 'Nucléophile ou base ?',
      retenirTitre: 'À RETENIR : PRÉVOIR LE MÉCANISME DOMINANT',
      retenir: <>
        <table style={{ borderCollapse: 'collapse', margin: '2px 0 6px', fontSize: 13.5, width: '100%' }}>
          <thead><tr><th style={{ padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>à 25 °C</th><th style={{ padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>HO⁻<br/><span style={{ fontWeight: 400 }}>base forte</span></th><th style={{ padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>tBuO⁻<br/><span style={{ fontWeight: 400 }}>base encombrée</span></th><th style={{ padding: '3px 8px', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>eau, éthanol<br/><span style={{ fontWeight: 400 }}>sans base</span></th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><strong>primaire</strong></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>SN2 (90 %)</td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>E2 (85 %)</td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>pas de réaction</td></tr>
            <tr><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><strong>secondaire</strong></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>E2 (70 %)</td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>E2 (95 %)</td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>SN1 (75 %)</td></tr>
            <tr><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', verticalAlign: 'top' }}><strong>tertiaire</strong></td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>E2 (90 %)</td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>E2 (100 %)</td><td style={{ padding: '3px 8px', borderTop: '1px solid #c5d9f0', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>SN1 (80 %)</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Une <strong>base encombrée</strong> donne surtout l’élimination (E2), même sur un substrat primaire.</li>
          <li><strong>Primaire + bon nucléophile</strong> : SN2. <strong>Secondaire ou tertiaire + base forte</strong> : E2.</li>
          <li><strong>Sans base forte</strong>, sur un substrat secondaire ou tertiaire : SN1 (avec un peu de E1). Un primaire ne réagit pratiquement pas.</li>
          <li><strong>Chauffer</strong> augmente la part d’élimination : 2-bromobutane dans l’eau, 25 % d’alcène à 25 °C, 45 % à 80 °C.</li>
          <li>Pourcentages = ordres de grandeur arrondis à 5 % (modèle de la simulation), pas des mesures. Seuls les solvants protiques sont traités.</li>
        </ul>
      </>,
      texte: <>tBuO⁻ est volumineux : attaquer un carbone est difficile, arracher un H périphérique est facile.</>,
      tache: { type: 'qcm', q: 'Quel est le produit majoritaire avec tBuO⁻ sur un substrat primaire ?', options: ['L’éther (substitution)', 'L’alcène (élimination E2)', 'L’alcool'], bonne: 1, indice: 'Une base encombrée attaque plus facilement un H qu’un carbone.', expl: <>L'encombrement fait monter la barrière de la SN2 (≈ 110 kJ/mol) au-dessus de celle de l'E2 (≈ 95 kJ/mol) : on obtient surtout l'<strong>alcène</strong>. C'est la méthode classique pour favoriser l'élimination.</> } },
    { titre: 'Bilan', texte: <>Tu sais prévoir le mécanisme dominant.</>,
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li><strong>Substrat primaire</strong> : SN2 avec un bon nucléophile ; E2 avec une base encombrée.</li>
        <li><strong>Substrat tertiaire</strong> : pas de SN2 ; E2 avec une base forte, SN1/E1 sans base (carbocation stable).</li>
        <li><strong>Substrat secondaire</strong> : tous les cas se disputent ; la base forte oriente vers E2.</li>
        <li>SN2 et E2 : <strong>une étape</strong>, ordre 2. SN1 et E1 : <strong>deux étapes</strong> par un carbocation, ordre 1.</li>
        <li>SN1 donne un racémique, SN2 une inversion. <strong>Chauffer</strong> favorise l'élimination.</li>
      </ul> },
  ];
}

// ── Défi ──
function alea(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const COMBOS = [];
for (const s of Object.keys(SUBSTRATS)) for (const r of Object.keys(REACTIFS)) for (const c of [false, true]) if (proportions(s, r, c).reaction) COMBOS.push([s, r, c]);
function defi(seed = Math.floor(Math.random() * 1e9)) {
  const r = alea(seed), [s, re, chaud] = COMBOS[Math.floor(r() * COMBOS.length)];
  const q = proportions(s, re, chaud), S = SUBSTRATS[s], R = REACTIFS[re];
  const dom = q.dominant, ord = MECA[dom].ordre;
  const typeDom = dom.startsWith('S') ? 'alcool' : 'alcène';
  const pct = Math.max(q.substitution, q.elimination);
  const situation = `${S.nom} (halogénoalcane ${S.classe}) réagit avec ${R.nom} à ${chaud ? '80' : '25'} °C.`;
  const optMeca = ['SN1', 'SN2', 'E1', 'E2'];
  const Q = [
    { id: 'meca', type: 'qcm', q: `${situation} Quel est le mécanisme dominant ?`, options: optMeca.map(m => `${m} (${MECA[m].long})`), bonne: optMeca.indexOf(dom),
      detail: `Le mécanisme dominant est ${dom} : ${dom === 'SN2' ? 'substrat peu encombré et bon nucléophile' : dom === 'E2' ? 'base forte ou encombrée, ou substrat très encombré' : dom === 'SN1' ? 'carbocation stable et réactif non basique' : 'carbocation stable, élimination en compétition'}.` },
    { id: 'ordre', type: 'qcm', q: 'Quel est l’ordre global de la loi de vitesse de ce mécanisme ?', options: ['Ordre 1', 'Ordre 2', 'Ordre 0'], bonne: ord === 1 ? 0 : 1,
      detail: `${dom} a ${MECA[dom].etapes === 1 ? 'une seule étape à laquelle participent les deux réactifs' : 'une étape lente qui ne fait intervenir que le substrat'} : ${MECA[dom].loi}, ordre ${ord}.` },
    { id: 'produit', type: 'qcm', q: 'Quel est le produit organique majoritaire ?', options: [S.alcool, S.alcene.replace(' (majoritaire) et but-1-ène', ''), 'Aucune réaction n’a lieu'], bonne: typeDom === 'alcool' ? 0 : 1,
      detail: `Le mécanisme dominant est ${dom} : on forme ${typeDom === 'alcool' ? 'l’alcool (substitution)' : 'l’alcène (élimination)'}.` },
    { id: 'pct', type: 'num', q: 'Quel est le pourcentage du produit majoritaire dans le mélange ? (Reproduis la situation dans la simulation et lis la barre de composition.)', unite: '%', vrai: pct, tol: 0.1,
      detail: `La simulation donne ${pct} % (ordre de grandeur).` },
  ];
  return { Q, reps: {}, verifie: false, scen: { s, re, chaud } };
}
const INDICE_Q = {
  meca: 'Tertiaire : pas de SN2. Base forte : mécanisme bimoléculaire. Sans base : carbocation.',
  ordre: 'Une étape avec deux réactifs : ordre 2. Étape lente sans le nucléophile : ordre 1.',
  produit: 'Substitution : alcool. Élimination : alcène.',
  pct: 'Règle la simulation sur la situation, puis lis la barre de composition.',
};

const hypotheses = (
  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
    <li>Les <strong>proportions</strong> de produits sont des <strong>ordres de grandeur arrondis à 5 %</strong>, choisis pour traduire les tendances connues. Dans une vraie expérience elles dépendent du solvant, de la concentration, de la nature du groupe partant, etc.</li>
    <li>Les <strong>énergies</strong> du profil (kJ/mol) sont schématiques : elles servent à comparer les barrières, pas à prédire une vitesse.</li>
    <li>Le groupe partant est toujours Br⁻ ; les solvants sont ceux du tableau (éthanol, tert-butanol, eau-éthanol). On ne traite pas les solvants aprotiques polaires.</li>
    <li>Les réarrangements de carbocation (transposition) ne sont pas traités ici.</li>
    <li>Avec l'eau comme seul réactif, le substrat <strong>primaire</strong> ne réagit pratiquement pas : l'absence de carbocation stable et la faiblesse du nucléophile ferment les deux voies.</li>
  </ul>
);

export function SimulationSubstitutionElimination() {
  const [mode, setMode] = useState(() => modeOuverture('sn-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('sn-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [sub, setSub] = useState('prim');
  const [re, setRe] = useState('HO');
  const [chaud, setChaud] = useState(false);
  const [exam, setExam] = useState(null);
  const [u, setU] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [df, setDf] = useState(() => defi());
  const [hypoOuv, setHypoOuv] = useState(false);

  const q = proportions(sub, re, chaud);
  const mecas = q.reaction ? Object.keys(q.p).filter(m => q.p[m] > 0) : [];
  const examine = q.reaction ? (exam && mecas.includes(exam) ? exam : q.dominant) : null;
  const regler = (s, r, c) => { setSub(s); setRe(r); if (c !== undefined) setChaud(c); setExam(null); setU(0); setLecture(false); };
  const S = SUBSTRATS[sub], R = REACTIFS[re];

  useEffect(() => {
    if (!lecture) return;
    let raf, t0 = null, u0 = u >= 0.999 ? 0 : u;
    const pas = ts => {
      if (t0 === null) t0 = ts;
      const nv = Math.min(1, u0 + (ts - t0) / 5000);
      setU(nv);
      if (nv >= 1) { setLecture(false); return; }
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [lecture]);   // eslint-disable-line react-hooks/exhaustive-deps

  const etapes = etapesGuide({ sub, re, chaud }, regler);
  const finParcours = guide.etape >= etapes.length;
  const juste = k => k.type === 'num' ? proche(lireNombre(df.reps[k.id] ?? ''), k.vrai, k.tol) : df.reps[k.id] === k.bonne;
  const menu = { fontSize: 14, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, background: 'white', color: KIT.txt, width: '100%' };

  const visuel = (
    <div style={{ flex: '1 1 380px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Halogénoalcane
          <select value={sub} onChange={e => regler(e.target.value, re)} style={menu} aria-label="Halogénoalcane">
            {Object.values(SUBSTRATS).map(s => <option key={s.cle} value={s.cle}>{s.nom} ({s.classe})</option>)}</select></label>
        <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Réactif
          <select value={re} onChange={e => regler(sub, e.target.value)} style={menu} aria-label="Réactif">
            {Object.values(REACTIFS).map(r => <option key={r.cle} value={r.cle}>{r.nom}</option>)}</select></label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Température :</span>
          <button onClick={() => setChaud(false)} style={stylePetitBouton(!chaud, '#0284c7')}>25 °C</button>
          <button onClick={() => setChaud(true)} style={stylePetitBouton(chaud, '#ea580c')}>80 °C</button>
        </div>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>{R.court} : {R.description}.</div>
      </div>
      <Substrat cle={sub} />
      {q.reaction ? (<>
        <div>
          <div style={{ display: 'flex', height: 30, borderRadius: 8, overflow: 'hidden', border: `1px solid ${KIT.bord}` }} role="img" aria-label={`Composition : ${mecas.map(m => `${q.p[m]} % par ${m}`).join(', ')}`}>
            {mecas.map(m => <div key={m} style={{ width: `${q.p[m]}%`, background: COUL[m] }} />)}
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13.5, color: KIT.txt, marginTop: 4 }}>
            {mecas.map(m => <span key={m}><span style={{ color: COUL[m], fontWeight: 700 }}>■</span> {m} {m.startsWith('S') ? `(${S.alcool})` : '(alcène)'} <strong>≈ {q.p[m]} %</strong></span>)}
          </div>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}>Ordres de grandeur arrondis à 5 %.</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Mécanisme examiné :</span>
          {mecas.map(m => <button key={m} onClick={() => { setExam(m); setU(0); setLecture(false); }} style={stylePetitBouton(m === examine, COUL[m])}>{m}</button>)}
        </div>
        <Profil meca={examine} sub={sub} re={re} u={u} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { if (u >= 0.999) setU(0); setLecture(l => !l); }} style={styleBouton(true, '#16a34a')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
          <input type="range" min={0} max={1000} step={1} value={Math.round(u * 1000)} onChange={e => { setLecture(false); setU(+e.target.value / 1000); }} aria-label="Avancement de la réaction" style={{ flex: 1 }} />
        </div>
        <div style={{ ...styleBoite, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }} aria-live="polite">{etatMeca(examine, u, sub)}</div>
      </>) : (
        <div style={{ ...styleBoite, fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}><strong>Pratiquement aucune réaction.</strong> Le substrat primaire ne forme pas de carbocation stable, et l'eau est un trop faible nucléophile pour une SN2 : il faut une base ou un nucléophile plus fort.</div>
      )}
    </div>
  );

  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Règle les menus sur la situation indiquée et réponds.
        <div><button onClick={() => regler(df.scen.s, df.scen.re, df.scen.chaud)} style={{ ...stylePetitBouton(false, '#b45309'), marginTop: 4 }}>Régler la simulation sur la situation</button></div></div>
      {df.Q.map((k, i) => {
        const ok = juste(k);
        return (
          <div key={k.id} style={{ borderLeft: `3px solid ${df.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{i + 1}. {avecIndices(k.q)}</div>
            <IndiceDefi cache={df.verifie && ok}>{avecIndices(INDICE_Q[k.id])}</IndiceDefi>
            {k.type === 'qcm' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {k.options.map((o, j) => (
                  <button key={j} onClick={() => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [k.id]: j } }))}
                    style={{ textAlign: 'left', fontSize: 13.5, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${df.reps[k.id] === j ? '#0284c7' : KIT.bord}`, background: df.reps[k.id] === j ? '#e0f2fe' : 'white', color: KIT.txt }}>{o}</button>))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={df.reps[k.id] ?? ''} onChange={e => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [k.id]: e.target.value } }))} inputMode="decimal" aria-label={k.q}
                  style={{ width: 90, padding: '6px 8px', fontSize: 14, borderRadius: 8, border: `1.5px solid ${KIT.bord}` }} />
                <span style={{ fontSize: 14, color: KIT.txt }}>{k.unite}</span>
              </div>)}
            {df.verifie && !ok && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>{k.type === 'num' && <>Réponse attendue : <strong>{fmt(k.vrai, 0)} {k.unite}</strong> — </>}{avecIndices(k.detail)}</div>}
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
        <h2 style={{ margin: 0, fontSize: 21 }}>Substitution ou élimination ?</h2>
        <BoutonsModes mode={mode} setMode={setMode} />
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 10 }}>
        {visuel}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'guide' && <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />}
          {mode === 'explore' && <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Mesures</div>
            {q.reaction ? <>
              <LigneMesure nom="Substitution (%)" valeur={fmt(q.substitution, 0)} couleur={COUL.SN2} />
              <LigneMesure nom="Élimination (%)" valeur={fmt(q.elimination, 0)} couleur={COUL.E2} />
              <LigneMesure nom="Mécanisme dominant" valeur={q.dominant} couleur={COUL[q.dominant]} />
              <LigneMesure nom="Barrière du mécanisme examiné (kJ/mol)" valeur={fmt(barriere(examine, sub, re), 0)} couleur="#475569" />
              <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 8, lineHeight: 1.55 }}><strong>{MECA[examine].nom}</strong> : {MECA[examine].long}, en {MECA[examine].etapes === 1 ? 'une étape' : 'deux étapes'}. Loi de vitesse : {MECA[examine].loi} (ordre {MECA[examine].ordre}).</div>
              <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>Vitesse globale : <strong>{q.vitesse}</strong>.</div>
            </> : <div style={{ fontSize: 14, color: KIT.txt }}>Aucune réaction notable dans ces conditions.</div>}
          </div>}
          {mode === 'defi' && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></div>}
        </div>
      </div>
      {finParcours && mode === 'guide' && <ARetenir titre="À RETENIR">Primaire : SN2 (ou E2 avec une base encombrée). Tertiaire : E2 avec une base forte, SN1/E1 sans base. Chauffer favorise l'élimination.</ARetenir>}
      <div style={{ ...styleBoite, marginTop: 12 }}>
        <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
      </div>
    </div>
  );
}
