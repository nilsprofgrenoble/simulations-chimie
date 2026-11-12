// Transposition de carbocation (BTS) : migration 1,2 d'un hydrure ou d'un méthyle lors de l'addition de HBr.
import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, ARetenir, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { CAS, voie, energie, barriereMigration, gainStabilite } from "./transpoModele";

const SIM_ID = 97;
declarerDefis(SIM_ID, [['principal', 'Transposition de carbocation']]);
const NOIR = '#0f172a', BRUN = '#9a3412', ROUGE = '#dc2626', BLEU = '#1d4ed8', CA = '#0284c7', CB = '#ea580c';
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
const seg = (u, a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
const SMOOTH = t => (1 - Math.cos(Math.PI * t)) / 2;

// ── Molécule animée : squelette C1–C2–C3–C4 + groupe qui migre de C3 vers C2 ──
const C = { 1: [30, 95], 2: [80, 65], 3: [130, 95], 4: [180, 65] };
const ME_BAS = [130, 140];
function Mol({ cas, v, u }) {
  const K = CAS[cas], G = K.groupe;
  const trans = v === 'B';
  // migration : u de 0,10 à 0,32 sur la voie B
  const m = trans ? SMOOTH(seg(u, 0.1, 0.32)) : 0;
  const gx = lerp(130, 80, m), gy = lerp(72, 36, m) - 14 * Math.sin(Math.PI * m);
  const plusSur3 = trans && m > 0.5;
  // capture par Br⁻
  const capt = trans ? seg(u, 0.55, 0.95) : seg(u, 0.4, 0.9);
  const cible = trans ? C[3] : C[2];
  const brx = lerp(trans ? 215 : 20, trans ? cible[0] + 34 : cible[0] - 30, SMOOTH(capt)), bry = lerp(trans ? 135 : 25, trans ? cible[1] + 26 : cible[1] - 24, SMOOTH(capt));
  const liaisonBr = capt > 0.98;
  const trait = (a, b, col = NOIR, w = 2.6, dash) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />;
  const posPlus = plusSur3 ? [C[3][0] + 14, C[3][1] + 16] : [C[2][0] - 16, C[2][1] - 10];
  const montrerPlus = !liaisonBr;
  // flèche courbe (doublet de la liaison C3–G vers C2⁺)
  const flecheOp = trans && u > 0.04 && u < 0.4 ? 1 : 0;
  return (
    <svg viewBox="0 0 250 165" role="img" aria-label={`Animation de la transposition : migration de ${G} sur ${K.alcene}`} style={{ width: '100%', height: 200, display: 'block', background: '#fbfdff', borderRadius: 10 }}>
      {trait(C[1], C[2])}{trait(C[2], C[3])}{trait(C[3], C[4])}{trait(C[3], ME_BAS)}
      <text x={ME_BAS[0]} y={ME_BAS[1] + 14} fontSize={12} fontWeight="700" textAnchor="middle" fill={NOIR}>CH₃</text>
      {/* groupe qui migre (liaison pointillée pendant la migration) */}
      {trans && m > 0 && m < 1 ? <>{trait(C[3], [gx, gy], '#94a3b8', 1.8, '4 3')}{trait(C[2], [gx, gy], '#94a3b8', 1.8, '4 3')}</> : trans && m >= 1 ? trait(C[2], [80, 44], NOIR, 2.6) : trait(C[3], [130, 80], NOIR, 2.6)}
      <text x={gx} y={gy - 4} fontSize={13} fontWeight="800" textAnchor="middle" fill={BLEU}>{G}</text>
      {/* flèche courbe rouge : doublet de la liaison C3–G déplacé vers C2 */}
      {flecheOp > 0 && <g><path d="M 128,60 Q 105,28 88,44" fill="none" stroke={ROUGE} strokeWidth={2} /><polygon points="86,46 94,43 90,50" fill={ROUGE} /></g>}
      {/* charge */}
      {montrerPlus && <g><circle cx={posPlus[0]} cy={posPlus[1]} r={8} fill="white" stroke={ROUGE} /><text x={posPlus[0]} y={posPlus[1] + 4} fontSize={13} fontWeight="800" textAnchor="middle" fill={ROUGE}>+</text></g>}
      {/* Br⁻ */}
      <circle cx={brx} cy={bry} r={11} fill={liaisonBr ? '#fed7aa' : '#bfdbfe'} stroke={liaisonBr ? BRUN : BLEU} strokeWidth={2} />
      <text x={brx} y={bry + 4} fontSize={11} fontWeight="700" textAnchor="middle" fill={liaisonBr ? BRUN : BLEU}>{liaisonBr ? 'Br' : 'Br⁻'}</text>
      {liaisonBr && trait(cible, [brx, bry], BRUN, 2.6)}
      <text x={C[1][0]} y={C[1][1] + 16} fontSize={11} fill={KIT.txt2} textAnchor="middle">C1</text><text x={C[2][0] + 16} y={C[2][1] - 4} fontSize={11} fill={KIT.txt2} textAnchor="middle">C2</text>
      <text x={C[3][0] - 14} y={C[3][1] + 16} fontSize={11} fill={KIT.txt2} textAnchor="middle">C3</text><text x={C[4][0]} y={C[4][1] - 12} fontSize={11} fill={KIT.txt2} textAnchor="middle">C4</text>
    </svg>);
}

function texteEtat(cas, v, u) {
  const K = CAS[cas];
  if (v === 'A') {
    if (u < 0.35) return <>Le carbocation <strong>secondaire</strong> vient de se former (étape 1, addition de H⁺ sur C1). La charge + est portée par C2.</>;
    if (u < 0.7) return <><strong>Capture directe</strong> : Br⁻ s'approche du carbone positif C2.</>;
    return <>Br⁻ s'est lié à C2 : on obtient le <strong>{K.produitA}</strong> (produit « normal », sans transposition).</>;
  }
  if (u < 0.1) return <>Le carbocation secondaire est formé : la charge + est sur C2. Le carbone voisin C3 porte {K.groupe === 'H' ? 'un hydrogène' : 'un groupe méthyle'} et c'est un carbone très substitué.</>;
  if (u < 0.32) return <><strong>Transposition 1,2</strong> : le doublet de la liaison C3–{K.groupe} (flèche rouge) se déplace vers C2 : <strong>{K.migrant}</strong> migre de C3 vers C2. Le carbone C3 perd un doublet : la charge + passe sur C3.</>;
  if (u < 0.55) return <>Le <strong>carbocation tertiaire</strong> (charge sur C3, lié à trois carbones) est plus stable que le secondaire : il est environ {gainStabilite(cas)} kJ/mol plus bas.</>;
  if (u < 0.9) return <><strong>Capture</strong> : Br⁻ s'approche du carbone positif C3.</>;
  return <>Br⁻ s'est lié à C3 : on obtient le <strong>{K.produitB}</strong>, <strong>produit de transposition</strong>.</>;
}

// ── Profil des deux voies, avec bille sur la voie active ──
function Profil({ cas, v, u }) {
  const W = 360, H = 220, gx = 40, gy = 16, gw = W - gx - 12, gh = H - gy - 30, Emin = -100, Emax = 100;
  const X = x => gx + x * gw, Y = e => gy + (1 - (e - Emin) / (Emax - Emin)) * gh;
  const chemin = pts => { let d = ''; for (let i = 0; i <= 100; i++) { const x = i / 100; d += `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(energie(pts, x)).toFixed(1)} `; } return d; };
  const A = voie(cas, 'A'), B = voie(cas, 'B'), act = v === 'A' ? A : B;
  const E = CAS[cas].E;
  const etq = (x, e, txt, dy, col = KIT.txt, dx = 0, an = 'middle') => <text x={X(x) + dx} y={Y(e) + dy} fontSize={11} fontWeight="700" fill={col} textAnchor={an}>{txt}</text>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Profil d'énergie : capture directe ou après transposition" style={{ width: '100%', display: 'block', background: '#fbfdff', borderRadius: 10 }}>
      <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke="#64748b" /><line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke="#64748b" />
      <text x={6} y={gy + 8} fontSize={11} fill={KIT.txt2}>Énergie</text>
      <text x={gx + gw} y={H - 6} fontSize={11} fill={KIT.txt2} textAnchor="end">avancement (à partir du carbocation secondaire) →</text>
      <path d={chemin(A)} fill="none" stroke={CA} strokeWidth={v === 'A' ? 3.5 : 2} opacity={v === 'A' ? 1 : 0.45} strokeLinecap="round" />
      <path d={chemin(B)} fill="none" stroke={CB} strokeWidth={v === 'B' ? 3.5 : 2} opacity={v === 'B' ? 1 : 0.45} strokeLinecap="round" />
      {etq(0, E.cs, `secondaire ${E.cs}`, 18, KIT.txt, 4, 'start')}
      {etq(0.2, E.etS, `migration ${E.etS}`, -11, CB, 8, 'middle')}
      {etq(0.4, E.ct, `tertiaire ${E.ct}`, 18, CB)}
      {etq(0.35, E.et2a, `ET ${E.et2a}`, -9, CA, 36, 'start')}
      <text x={X(1)} y={Y(E.p) + 15} fontSize={11} fontWeight="700" fill={KIT.txt} textAnchor="end">produits {String(E.p).replace('-', '−')}</text>
      <circle cx={X(u)} cy={Y(energie(act, u))} r={7} fill="#f59e0b" stroke="white" strokeWidth={2} />
    </svg>);
}

// ── Parcours guidé ──
function etapesGuide(st, regler) {
  const { cas } = st;
  const K = CAS[cas];
  const ici = (k, consigne) => ({ type: 'action', ok: cas === k, faire: () => regler(k, 'B'), label: 'Le faire pour moi', consigne, indice: 'Utilise le menu « Alcène ».' });
  return [
    { titre: 'Un carbocation secondaire se forme', texte: <>On additionne HBr sur le <strong>3-méthylbut-1-ène</strong>. H⁺ se fixe sur C1 : c'est une <strong>addition électrophile</strong> qui forme un carbocation <strong>secondaire</strong>, charge + sur C2. Ce carbocation est un <strong>intermédiaire de réaction</strong>.</>,
      tache: { type: 'qcm', q: 'Quel type de réaction est la fixation de H⁺ sur C1 ?', options: ['Une addition', 'Une substitution', 'Une élimination'], bonne: 0, indice: 'Un doublet π de C=C est utilisé pour former une liaison C–H ; rien ne part.', expl: <>Le doublet π de la double liaison forme la liaison C1–H : c'est une <strong>addition</strong> (électrophile).</> } },
    { titre: 'Un voisin plus substitué',
      retenirTitre: 'À RETENIR : POURQUOI UNE TRANSPOSITION ?',
      retenir: <>
        <Formule><mtext>(CH₃)₂CH–CH=CH₂</mtext><mo>+</mo><mtext>H⁺</mtext><mo>→</mo><mtext>(CH₃)₂CH–C⁺H–CH₃</mtext></Formule>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>H⁺ se fixe sur C1 du 3-méthylbut-1-ène : le carbocation formé, en C2, est <strong>secondaire</strong> (lié à 2 carbones).</li>
          <li>Son voisin C3 porte un H et 2 groupes CH₃ : si la charge + passait en C3, le carbocation serait <strong>tertiaire</strong> (lié à 3 carbones), donc <strong>plus stable</strong> (effet inductif donneur et hyperconjugaison des groupes alkyle).</li>
        </ul>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Carbocation</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Énergie (kJ·mol⁻¹)</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>secondaire (en C2)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>60</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>tertiaire (en C3)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>50</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Critère :</strong> une transposition a lieu quand le voisin <strong>permet un carbocation plus stable</strong> ; le gain est ici de 10 kJ·mol⁻¹.</li>
        </ul>
      </>,
      texte: <>À côté du carbone positif C2 se trouve C3, un carbone lié à <strong>trois autres carbones</strong> (ou à deux, plus un H). Si la charge + pouvait s'y placer, le carbocation serait <strong>tertiaire</strong>.</>,
      tache: { type: 'qcm', q: 'Pourquoi un carbocation tertiaire est-il plus stable qu’un secondaire ?', options: ['Les groupes alkyle voisins donnent de la densité électronique au carbone positif (effet inductif donneur et hyperconjugaison)', 'Parce qu’il possède plus d’hydrogènes', 'Parce qu’il est plus petit'], bonne: 0, indice: 'Rappelle-toi la régiosélectivité de l’addition de HBr.', expl: <>Chaque groupe alkyle voisin <strong>donne</strong> de la densité électronique au carbone positif et disperse la charge : plus il y en a, plus le carbocation est stable.</> } },
    { titre: 'La transposition 1,2',
      retenirTitre: 'À RETENIR : LA TRANSPOSITION 1,2',
      retenir: <>
        <Formule><mtext>CH₃–C⁺H–CH(CH₃)₂</mtext><mo>→</mo><mtext>CH₃–CH₂–C⁺(CH₃)₂</mtext><mspace width="1em"/><mtext>(H migre de C3 vers C2)</mtext></Formule>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Un atome ou un groupe <strong>migre</strong> d’un carbone à son voisin <strong>avec le doublet de sa liaison</strong> : on parle de migration <strong>1,2</strong>.</li>
          <li><strong>Flèche courbe :</strong> elle part du <strong>doublet de la liaison C3–H</strong> et pointe vers le <strong>carbone positif C2</strong>. Ce doublet forme la nouvelle liaison C2–H.</li>
          <li>La charge + « saute » de C2 à C3 : C3 devient le carbone déficitaire.</li>
          <li>Rien n’est ajouté ni retiré : <strong>même formule brute</strong>, le squelette se réorganise. L’intermédiaire reste un carbocation.</li>
          <li><strong>Piège :</strong> la flèche ne part pas du carbone positif ; elle part de la liaison qui migre.</li>
        </ul>
      </>,
      texte: <>Lance l'animation de la voie <strong>« après transposition »</strong>. Un atome H (ou un groupe) migre de C3 vers C2, avec le doublet de sa liaison. La charge + « saute » de C2 à C3. C'est une <strong>transposition</strong> (ou réarrangement).</>,
      tache: { type: 'qcm', q: 'D’où part la flèche courbe qui représente la migration de H ?', options: ['Du doublet de la liaison C3–H, vers le carbone positif C2', 'Du carbone positif C2, vers l’atome H', 'De l’ion Br⁻, vers C3'], bonne: 0, indice: 'Une flèche courbe part toujours d’un doublet (liaison ou doublet non liant) vers un site pauvre en électrons.', expl: <>La flèche part du <strong>doublet de la liaison C3–H</strong> et pointe vers <strong>C2⁺</strong> : ce doublet forme la nouvelle liaison C2–H. C3 devient alors déficitaire en électrons.</> } },
    { titre: 'Reconnaître une transposition',
      retenirTitre: 'À RETENIR : RECONNAÎTRE LE TYPE D’ÉTAPE',
      retenir: <>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Type</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Ce qui se passe</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>addition</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>deux molécules s’unissent, une liaison π disparaît</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>substitution</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>un groupe en remplace un autre</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>élimination</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>une liaison π se forme, deux groupes partent</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>transposition</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>un groupe migre au voisin, rien n’est ajouté ni retiré</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Pour trancher, <strong>compare les formules</strong> avant et après l’étape : une transposition conserve les atomes et change leur <strong>enchaînement</strong>.</li>
        </ul>
      </>,
      texte: <>Dans cette étape, aucun atome n'est ajouté ni retiré : le squelette <strong>se réorganise</strong> et l'intermédiaire reste un carbocation.</>,
      tache: { type: 'qcm', q: 'Comment reconnaît-on une transposition dans un mécanisme ?', options: ['Un atome ou un groupe migre d’un atome vers l’atome voisin, sans que rien ne soit ajouté ni éliminé', 'Un groupe est remplacé par un autre', 'Une double liaison apparaît avec départ d’un H et d’un groupe partant'], bonne: 0, indice: 'Compare avec substitution (un groupe en remplace un autre) et élimination (une double liaison se forme).', expl: <>Transposition : un groupe <strong>migre</strong> d'un atome à son voisin. Une substitution remplace un groupe ; une élimination forme une double liaison en expulsant deux groupes.</> } },
    { titre: 'La barrière de la migration',
      retenirTitre: 'À RETENIR : BARRIÈRE DE MIGRATION',
      retenir: <>
        <Formule><msub><mi>E</mi><mi>a</mi></msub><mo>=</mo><mi>E</mi><mo>(</mo><mtext>ET migration</mtext><mo>)</mo><mo>−</mo><mi>E</mi><mo>(</mo><mtext>carbocation secondaire</mtext><mo>)</mo></Formule>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Groupe qui migre</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Eₐ migration (kJ·mol⁻¹)</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Gain de stabilité (kJ·mol⁻¹)</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>H (3-méthylbut-1-ène)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>75 − 60 = 15</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>60 − 50 = 10</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>CH₃ (3,3-diméthylbut-1-ène)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>80 − 60 = 20</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>60 − 48 = 12</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>La barrière de migration (15 à 20 kJ·mol⁻¹) est <strong>très inférieure</strong> à celle de formation du carbocation (≈ 100 kJ·mol⁻¹) : la transposition est <strong>très rapide</strong>.</li>
          <li>Le groupe méthyle migre un peu plus difficilement que H (barrière plus haute).</li>
          <li>Le départ est le <strong>carbocation secondaire</strong>, pas les réactifs.</li>
          <li>Énergies : ordres de grandeur de la simulation (réactifs : 0).</li>
        </ul>
      </>,
      texte: <>Lis sur le profil l'énergie du carbocation secondaire et celle de l'état de transition de la migration. Elle est bien plus basse que la barrière de formation du carbocation (≈ 100 kJ/mol) : la transposition est <strong>très rapide</strong>.</>,
      tache: { type: 'num', q: 'Quelle est l’énergie d’activation de la migration (ET migration − cation secondaire) ?', unite: 'kJ/mol', vrai: barriereMigration(cas), tol: 0.02, cs: 2, indice: 'Énergie de ET migration moins énergie du cation secondaire.', calcul: () => [`E(ET) − E(cation secondaire) = ${K.E.etS} − ${K.E.cs} = ${barriereMigration(cas)} kJ/mol`] } },
    { titre: 'Deux produits',
      retenirTitre: 'À RETENIR : DEUX PRODUITS',
      retenir: <>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Voie directe</strong> : Br⁻ capture le carbocation secondaire → produit <strong>sans transposition</strong> (sous-produit).</li>
          <li><strong>Voie avec transposition</strong> : le carbocation tertiaire, plus stable et plus abondant, est capturé → produit <strong>transposé</strong> (majoritaire).</li>
        </ul>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Alcène</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Sans transposition</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}></th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Avec transposition</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}></th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>3-méthylbut-1-ène</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>2-bromo-3-méthylbutane</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>≈ 40 %</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>2-bromo-2-méthylbutane</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>≈ 60 %</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>3,3-diméthylbut-1-ène</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>2-bromo-3,3-diméthylbutane</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>≈ 20 %</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>2-bromo-2,3-diméthylbutane</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>≈ 80 %</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Les pourcentages sont des <strong>ordres de grandeur</strong> expérimentaux, pas des résultats de calcul.</li>
          <li>Un produit « inattendu » peut s’expliquer par un carbocation voisin plus stable : on cherche une <strong>transposition</strong>.</li>
        </ul>
      </>,
      texte: <>Br⁻ peut attaquer le carbocation secondaire (voie <strong>directe</strong>) ou le carbocation tertiaire apparu après la transposition. Compare les deux voies sur le profil.</>,
      tache: { type: 'qcm', q: 'Quel est le produit majoritaire de l’addition de HBr sur le 3-méthylbut-1-ène ?', options: ['Le 2-bromo-2-méthylbutane (produit de transposition, ≈ 60 %)', 'Le 2-bromo-3-méthylbutane (sans transposition, ≈ 40 %)', 'Le 1-bromo-3-méthylbutane'], bonne: 0, indice: 'Le carbocation tertiaire est plus stable ; la transposition est rapide.', expl: <>Le carbocation tertiaire, plus stable, est le plus abondant : le <strong>2-bromo-2-méthylbutane</strong> domine (ordre de grandeur 60 %). Le <strong>2-bromo-3-méthylbutane</strong> est le <strong>sous-produit</strong> formé par capture directe.</> } },
    { titre: 'Un groupe méthyle qui migre', texte: <>Le groupe qui migre n'est pas forcément un H. Place-toi sur le <strong>3,3-diméthylbut-1-ène</strong> : après addition de H⁺, le carbone voisin n'a plus d'hydrogène, mais porte un groupe méthyle.</>,
      tache: ici('methyle', 'Choisis le 3,3-diméthylbut-1-ène.') },
    { titre: 'Observer la migration du méthyle', texte: <>Lance l'animation. Le groupe CH₃ migre avec le doublet de sa liaison C–C ; la charge + passe sur C3, qui devient tertiaire.</>,
      tache: { type: 'qcm', q: 'Pour le 3,3-diméthylbut-1-ène + HBr, quel produit est majoritaire (ordre de grandeur 80 %) ?', options: ['Le 2-bromo-2,3-diméthylbutane (après migration de CH₃)', 'Le 2-bromo-3,3-diméthylbutane (sans transposition)', 'Le 1-bromo-3,3-diméthylbutane'], bonne: 0, indice: 'Après migration, la charge est portée par un carbone tertiaire, plus stable.', expl: <>La migration de CH₃ donne le carbocation tertiaire, favorisé : le <strong>2-bromo-2,3-diméthylbutane</strong> est majoritaire. Le produit sans transposition est le <strong>sous-produit</strong>.</> } },
    { titre: 'Pourquoi ce sous-produit ?', texte: <>Une transposition permet d'<strong>expliquer la formation d'un produit inattendu</strong> : si un composé inattendu apparaît lors d'une addition sur un alcène, on cherche si un carbocation voisin plus stable pouvait se former.</>,
      tache: { type: 'qcm', q: 'Un chimiste obtient le 2-bromo-2-méthylbutane alors qu’il visait le 2-bromo-3-méthylbutane. Quelle est l’explication la plus probable ?', options: ['Une transposition de carbocation (migration d’un H)', 'Une élimination', 'Une réaction acide-base'], bonne: 0, indice: 'Quel intermédiaire est impliqué ? Comment devient-il plus stable ?', expl: <>Le carbocation secondaire s'est <strong>transposé</strong> en carbocation tertiaire avant d'être capturé. Les transpositions sont une source classique de produits inattendus.</> } },
    { titre: 'Bilan', texte: <>Tu sais repérer et expliquer une transposition de carbocation.</>,
      retenir: <>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
          <li><strong>Écrire</strong> le carbocation formé et le <strong>classer</strong> (primaire, secondaire, tertiaire).</li>
          <li><strong>Regarder le voisin</strong> : porte-t-il un H ou un CH₃ qui permettrait un carbocation <strong>plus stable</strong> ?</li>
          <li>Si oui, dessiner la <strong>flèche courbe</strong> : du doublet de la liaison C–H (ou C–CH₃) vers C⁺.</li>
          <li><strong>Placer Br</strong> sur chaque carbocation : produit direct et produit transposé.</li>
        </ol>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>La transposition est rapide (Eₐ ≈ 15 à 20 kJ·mol⁻¹), mais le produit sans transposition subsiste en faible quantité.</li>
          <li><strong>Hypothèses :</strong> énergies arrondies, proportions indicatives, migration 1,2 uniquement.</li>
        </ul>
      </> },
  ];
}

// ── Défi ──
function alea(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function defi(seed = Math.floor(Math.random() * 1e9)) {
  const r = alea(seed), cle = r() < 0.5 ? 'hydrure' : 'methyle', K = CAS[cle];
  const Q = [
    { id: 'cat', type: 'qcm', q: `Le ${K.alcene} réagit avec HBr. Que devient le carbocation secondaire formé en premier ?`, options: [`Il se transpose en ${K.cationT}`, 'Il perd un H⁺ pour donner un alcène', 'Il reste inchangé, toujours capturé directement'], bonne: 0, detail: `Le groupe ${K.groupe} migre de C3 vers C2 et donne le carbocation tertiaire, plus stable.` },
    { id: 'maj', type: 'qcm', q: 'Quel est le produit majoritaire ?', options: [K.produitB, K.produitA, 'Un produit d’élimination'], bonne: 0, detail: `Le produit de transposition (${K.produitB}) est majoritaire, environ ${K.pctB} %.` },
    { id: 'ea', type: 'num', q: 'Quelle est l’énergie d’activation de la migration (kJ/mol) ?', unite: 'kJ/mol', vrai: barriereMigration(cle), tol: 0.02, detail: `E(ET) − E(cation secondaire) = ${K.E.etS} − ${K.E.cs} = ${barriereMigration(cle)} kJ/mol.` },
    { id: 'pct', type: 'num', q: 'Quel pourcentage environ de produit de transposition obtient-on (ordre de grandeur) ?', unite: '%', vrai: K.pctB, tol: 0.1, detail: `Ordre de grandeur expérimental : environ ${K.pctB} %.` },
  ];
  return { Q, reps: {}, verifie: false, cle };
}
const INDICE_Q = { cat: 'Un carbocation voisin plus stable peut se former par migration.', maj: 'Le produit issu du carbocation le plus stable domine.', ea: 'Sommet de l’état de transition de la migration moins carbocation secondaire.', pct: 'Compare les deux voies dans la simulation.' };

const hypotheses = (
  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
    <li>Les <strong>énergies</strong> sont des ordres de grandeur arrondis (kJ/mol) choisis pour traduire les tendances connues : migration très facile (≈ 15 à 20 kJ/mol), carbocation tertiaire plus stable de 10 à 12 kJ/mol que le secondaire.</li>
    <li>Les <strong>proportions</strong> (≈ 60 / 40 pour le méthyl-butène, ≈ 80 / 20 pour le diméthyl-butène) sont des ordres de grandeur d'expériences de laboratoire ; elles dépendent du solvant, de la température et du nucléophile.</li>
    <li>L'animation est <strong>schématique</strong> : la molécule est dessinée à plat et la migration est interpolée (pas de dynamique moléculaire).</li>
    <li>Le profil part du carbocation secondaire ; l'étape 1 (addition de H⁺ sur C1) est commune aux deux voies et n'est pas dessinée.</li>
    <li>On suppose une capture de Br⁻ irréversible et non sélective entre les deux carbocations ; la proportion finale est donnée par l'expérience, pas calculée.</li>
  </ul>
);

export function SimulationTranspositionCarbocation() {
  const [mode, setMode] = useState(() => modeOuverture('transpo-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('transpo-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [cas, setCas] = useState('hydrure');
  const [v, setV] = useState('B');
  const [u, setU] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [df, setDf] = useState(() => defi());
  const [hypoOuv, setHypoOuv] = useState(false);
  const K = CAS[cas];
  const regler = (c, voieChoisie) => { setCas(c); if (voieChoisie) setV(voieChoisie); setU(0); setLecture(false); };

  useEffect(() => {
    if (!lecture) return;
    let raf, t0 = null, u0 = u >= 0.999 ? 0 : u;
    const pas = ts => {
      if (t0 === null) t0 = ts;
      const nv = Math.min(1, u0 + (ts - t0) / 7000);
      setU(nv);
      if (nv >= 1) { setLecture(false); return; }
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [lecture]);   // eslint-disable-line react-hooks/exhaustive-deps

  const etapes = etapesGuide({ cas }, regler);
  const finParcours = guide.etape >= etapes.length;
  const juste = k => k.type === 'num' ? proche(lireNombre(df.reps[k.id] ?? ''), k.vrai, k.tol) : df.reps[k.id] === k.bonne;
  const menu = { fontSize: 14, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, background: 'white', color: KIT.txt, width: '100%' };

  const visuel = (
    <div style={{ flex: '1 1 380px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Alcène (addition de HBr)
          <select value={cas} onChange={e => regler(e.target.value)} style={menu} aria-label="Alcène">
            {Object.values(CAS).map(c => <option key={c.cle} value={c.cle}>{c.alcene}</option>)}</select></label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Voie :</span>
          <button onClick={() => { setV('A'); setU(0); setLecture(false); }} style={stylePetitBouton(v === 'A', CA)}>capture directe</button>
          <button onClick={() => { setV('B'); setU(0); setLecture(false); }} style={stylePetitBouton(v === 'B', CB)}>après transposition</button>
        </div>
      </div>
      <Mol cas={cas} v={v} u={u} />
      <Profil cas={cas} v={v} u={u} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => { if (u >= 0.999) setU(0); setLecture(l => !l); }} style={styleBouton(true, '#16a34a')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
        <input type="range" min={0} max={1000} step={1} value={Math.round(u * 1000)} onChange={e => { setLecture(false); setU(+e.target.value / 1000); }} aria-label="Avancement de la réaction" style={{ flex: 1 }} />
      </div>
      <div style={{ ...styleBoite, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }} aria-live="polite">{texteEtat(cas, v, u)}</div>
    </div>
  );

  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Alcène de ce défi : <strong>{CAS[df.cle].alcene}</strong>. <button onClick={() => regler(df.cle, 'B')} style={stylePetitBouton(false, '#b45309')}>Choisir cet alcène</button></div>
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
        <h2 style={{ margin: 0, fontSize: 21 }}>Transposition de carbocation</h2>
        <BoutonsModes mode={mode} setMode={setMode} />
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 10 }}>
        {visuel}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'guide' && <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />}
          {mode === 'explore' && <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Mesures</div>
            <LigneMesure nom="Produit majoritaire" valeur={K.produitB} couleur={CB} />
            <LigneMesure nom="Proportion (ordre de grandeur)" valeur={`≈ ${K.pctB} %`} couleur={CB} />
            <LigneMesure nom="Sous-produit" valeur={K.produitA} couleur={CA} />
            <LigneMesure nom="Barrière de migration (kJ/mol)" valeur={fmt(barriereMigration(cas), 0)} couleur="#475569" />
            <LigneMesure nom="Gain de stabilité (kJ/mol)" valeur={fmt(gainStabilite(cas), 0)} couleur="#475569" />
            <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 8, lineHeight: 1.55 }}>Intermédiaires : {K.cationS} → {K.cationT}. Le groupe qui migre est {K.migrant}.</div>
          </div>}
          {mode === 'defi' && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></div>}
        </div>
      </div>
      {finParcours && mode === 'guide' && <ARetenir titre="À RETENIR">Un carbocation secondaire se transpose en carbocation tertiaire (migration 1,2 d'un H ou d'un alkyle) : cela explique les produits « inattendus ».</ARetenir>}
      <div style={{ ...styleBoite, marginTop: 12 }}>
        <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
      </div>
    </div>
  );
}
