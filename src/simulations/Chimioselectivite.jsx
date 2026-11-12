// Chimiosélectivité (BTS) : un réactif transforme un groupe fonctionnel en laissant l'autre intact.
import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, LigneMesure, ARetenir, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { SUBSTRATS, COUPLES, bilan, nomGroupe } from "./chimioModele";

const SIM_ID = 99;
declarerDefis(SIM_ID, [['principal', 'Chimiosélectivité']]);
const COUL = { A: '#1d4ed8', B: '#ea580c' };
const FOND = { A: '#dbeafe', B: '#ffedd5' };
const seg = (u, a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));

// ── Visuel : le réactif s'approche, puis chaque groupe réagit ou non ──
function Reaction({ sub, re, u }) {
  const { S, R, touches, apres } = bilan(sub, re);
  const t1 = seg(u, 0, 0.45), apresReaction = u >= 0.55;
  const pieces = apresReaction ? apres : S.avant;
  const piece = (p, i) => {
    const g = p.g, coul = g ? COUL[g] : KIT.txt, actif = g && touches.includes(g);
    return <span key={i} style={{ color: coul, fontWeight: g ? 800 : 600, background: g ? FOND[g] : 'transparent', borderRadius: 6, padding: g ? '2px 5px' : 0,
      outline: g && apresReaction && actif ? `2px solid ${coul}` : 'none', transition: 'all .2s' }}>{p.t}</span>;
  };
  return (
    <div style={{ background: '#fbfdff', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ height: 34, width: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', left: `${50 - (1 - t1) * 38}%`, top: `${(1 - t1) * 2}px`, transform: 'translateX(-50%)', opacity: apresReaction ? 0.35 : 1,
          background: '#ede9fe', border: '2px solid #7c3aed', color: '#5b21b6', fontWeight: 800, fontSize: 14, padding: '3px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>{R.court}</div>
      </div>
      <div style={{ fontSize: 20, letterSpacing: 0.2, lineHeight: 1.6, whiteSpace: 'nowrap', overflowX: 'auto', maxWidth: '100%' }} aria-label={`Formule : ${pieces.map(p => p.t).join('')}`}>{pieces.map(piece)}</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', minHeight: 54 }}>
        {['A', 'B'].map(g => {
          const reag = touches.includes(g);
          return <div key={g} style={{ border: `2px solid ${COUL[g]}`, background: FOND[g], borderRadius: 10, padding: '6px 10px', textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: COUL[g] }}>{nomGroupe(sub, g)}</div>
            <div style={{ fontSize: 13, color: KIT.txt, fontWeight: 700 }}>{apresReaction ? (reag ? '✓ transformé' : '✕ inchangé') : 'en attente'}</div>
          </div>;
        })}
      </div>
    </div>);
}

function texteEtat(sub, re, u) {
  const { S, R, touches, nb } = bilan(sub, re);
  if (u < 0.55) return <>Le réactif <strong>{R.court}</strong> s'approche de la molécule {S.nom}, qui porte deux groupes : <span style={{ color: COUL.A, fontWeight: 700 }}>{S.gA}</span> et <span style={{ color: COUL.B, fontWeight: 700 }}>{S.gB}</span>.</>;
  const qui = touches.map(g => nomGroupe(sub, g)).join(' et ');
  return <>{nb === 0 ? <strong>Aucun des deux groupes ne réagit. </strong> : nb === 1 ? <><strong>Seul le groupe {qui} est transformé</strong> : la réaction est <strong>chimiosélective</strong>. </> : <><strong>Les deux groupes sont transformés</strong> : pas de chimiosélectivité. </>}{R.pourquoi}</>;
}

// ── Parcours guidé ──
function etapesGuide(st, regler) {
  const { sub, re } = st;
  const ici = (s, r, consigne) => ({ type: 'action', ok: sub === s && re === r, faire: () => regler(s, r), label: 'Le faire pour moi', consigne, indice: 'Utilise les menus « Molécule » et « Réactif ».' });
  return [
    { titre: 'Deux groupes, un réactif',
      retenirTitre: 'À RETENIR : TROIS SÉLECTIVITÉS',
      retenir: <>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Sélectivité</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Le réactif choisit…</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Exemple</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>chimiosélectivité</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>un groupe fonctionnel parmi plusieurs</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>cétone plutôt qu’ester</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>régiosélectivité</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>une position parmi plusieurs</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>Markovnikov (HBr)</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>stéréosélectivité</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>un stéréoisomère parmi plusieurs</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>R plutôt que S</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Une molécule polyfonctionnelle porte <strong>plusieurs groupes fonctionnels</strong> ; un réactif <strong>chimiosélectif</strong> n’en transforme qu’un, l’autre reste intact.</li>
          <li>Pour la prévoir, on compare la <strong>réactivité</strong> de chaque groupe vis-à-vis du réactif (électrophilie, nucléophilie) et le <strong>pouvoir</strong> du réactif (doux ou puissant).</li>
        </ul>
      </>,
      texte: <>Une molécule porte souvent <strong>plusieurs groupes fonctionnels</strong>. Quand un réactif en transforme un seul en laissant l'autre intact, la réaction est dite <strong>chimiosélective</strong>.</>,
      tache: { type: 'qcm', q: 'Une réaction est chimiosélective lorsque …', options: ['le réactif attaque un groupe fonctionnel de préférence à un autre', 'le réactif attaque une position précise d’un même groupe', 'la réaction donne un seul stéréoisomère'], bonne: 0, indice: 'Pense aux deux groupes différents de la molécule.', expl: <>Chimiosélective : le réactif choisit <strong>un groupe fonctionnel</strong> parmi plusieurs. (Régiosélectivité : choix d'une <em>position</em> ; stéréosélectivité : choix d'un <em>stéréoisomère</em>.)</> } },
    { titre: 'Une cétone et un ester', texte: <>Le <strong>4-oxopentanoate d'éthyle</strong> porte une cétone et un ester. On le traite par NaBH₄, un réducteur doux.</>, tache: ici('cetoester', 'NaBH4', 'Choisis le 4-oxopentanoate d’éthyle et NaBH₄.') },
    { titre: 'Qui réagit ?',
      retenirTitre: 'À RETENIR : POURQUOI LA CÉTONE ?',
      retenir: <>
        <Formule><mtext>CH₃–C(=O)–CH₂CH₂–C(=O)OEt</mtext><mover><mo>→</mo><mtext>NaBH₄, éthanol, 0 °C</mtext></mover><mtext>CH₃–CH(OH)–CH₂CH₂–C(=O)OEt</mtext></Formule>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>NaBH₄</strong> est un réducteur <strong>doux</strong> : source d’ion <strong>hydrure H⁻</strong> (nucléophile), qui réduit aldéhydes et cétones.</li>
          <li>Le <strong>4-oxopentanoate d’éthyle</strong> donne le <strong>4-hydroxypentanoate d’éthyle</strong> : cétone → alcool secondaire, <strong>ester intact</strong>.</li>
          <li>L’hydrure attaque le <strong>carbone le plus électrophile</strong>. <strong>Cétone</strong> : C=O polarisé (C δ+, O δ–), carbone très électrophile. <strong>Ester</strong> : un doublet de l’<strong>oxygène voisin</strong> (O–Et) est <strong>délocalisé</strong> vers le C=O, le carbone est <strong>moins électrophile</strong>.</li>
          <li><strong>Réactivité vis-à-vis des hydrures :</strong> aldéhyde &gt; cétone &gt; ester.</li>
        </ul>
      </>,
      texte: <>Lance la lecture et observe quel groupe est transformé.</>,
      tache: { type: 'qcm', q: 'Avec NaBH₄, quel groupe est réduit ?', options: ['La cétone seulement', 'L’ester seulement', 'Les deux'], bonne: 0, indice: 'Regarde les badges sous la formule.', expl: <>NaBH₄ réduit la <strong>cétone</strong> en alcool secondaire et laisse l'<strong>ester</strong> intact : la réaction est chimiosélective.</> } },
    { titre: 'Pourquoi la cétone ?', texte: <>Dans un ester, un doublet de l'oxygène voisin est délocalisé vers le C=O : le carbone est <strong>moins électrophile</strong> que celui d'une cétone.</>,
      tache: { type: 'qcm', q: 'Pourquoi NaBH₄ attaque-t-il la cétone plutôt que l’ester ?', options: ['Le carbone de la cétone est plus électrophile', 'L’ester est plus encombré', 'NaBH₄ ne peut pas attaquer un groupe C=O'], bonne: 0, indice: 'L’ion hydrure H⁻ attaque un carbone déficitaire en électrons.', expl: <>L'hydrure attaque le carbone le plus <strong>électrophile</strong>. Celui de l'ester l'est moins, à cause de la délocalisation du doublet de O–Et.</> } },
    { titre: 'Un réducteur plus puissant', texte: <>Remplace NaBH₄ par <strong>LiAlH₄</strong>, bien plus réactif.</>, tache: ici('cetoester', 'LiAlH4', 'Choisis le 4-oxopentanoate d’éthyle et LiAlH₄.') },
    { titre: 'La sélectivité disparaît',
      retenirTitre: 'À RETENIR : CHOISIR LE RÉDUCTEUR',
      retenir: <>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Réactif</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Cétone réduite ?</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Ester réduit ?</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Produit</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>NaBH₄ (éthanol, 0 °C)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>oui</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>non</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>4-hydroxypentanoate d’éthyle</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>LiAlH₄ (éther, puis hydrolyse)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>oui</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>oui</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>pentane-1,4-diol</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>H₂/Pd (1 bar, 25 °C)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>non</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>non</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>aucune réaction notable</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>NaBH₄ : <strong>chimiosélective</strong> ; LiAlH₄ : <strong>non sélective</strong>.</li>
          <li>Pour réduire <strong>seulement la cétone</strong>, on choisit le réducteur <strong>doux</strong> NaBH₄.</li>
          <li>Un réactif <strong>trop puissant</strong> (LiAlH₄) fait perdre la sélectivité : le choix du réactif fait la chimiosélectivité.</li>
        </ul>
      </>,
      texte: <>Avec LiAlH₄, les deux groupes sont réduits. Pour réduire <em>seulement</em> la cétone, il faut donc choisir le réactif adapté.</>,
      tache: { type: 'qcm', q: 'Pour réduire uniquement la cétone du 4-oxopentanoate d’éthyle, on choisit …', options: ['NaBH₄, réducteur doux', 'LiAlH₄, réducteur puissant', 'Un des deux, c’est équivalent'], bonne: 0, indice: 'Rappelle-toi quel réactif laisse l’ester intact.', expl: <>On choisit <strong>NaBH₄</strong> : plus doux, il laisse l'ester. Le choix du réactif fait la chimiosélectivité.</> } },
    { titre: 'Un alcène et une cétone', texte: <>Passe à la <strong>hex-5-én-2-one</strong> (une cétone et une double liaison C=C) et utilise H₂ sur palladium.</>, tache: ici('alcenone', 'H2Pd', 'Choisis l’hex-5-én-2-one et H₂/Pd.') },
    { titre: 'La sélectivité s’inverse',
      retenirTitre: 'À RETENIR : LE RÉACTIF CHOISIT LE GROUPE',
      retenir: <>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Réactif sur l’hex-5-én-2-one</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>C=O réduit ?</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>C=C réduit ?</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Produit</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>NaBH₄</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>oui (alcool)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>non</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>hex-5-én-2-ol</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>LiAlH₄</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>oui (alcool)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>non</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>hex-5-én-2-ol</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>H₂/Pd (1 bar, 25 °C)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>non</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>oui (alcane)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>hexan-2-one</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Hydrures</strong> : l’ion H⁻ attaque le carbone électrophile du C=O ; la liaison C=C isolée, non polarisée, n’est pas attaquée.</li>
          <li><strong>H₂/Pd</strong> : H₂ est activé à la surface du métal et s’additionne sur C=C ; le C=O n’est pas réduit dans ces conditions.</li>
          <li>La sélectivité est <strong>inversée</strong> : deux réactifs, deux produits différents à partir de la même molécule.</li>
        </ul>
      </>,
      texte: <>Avec NaBH₄, c'était la cétone qui était réduite. Avec H₂/Pd, c'est l'<strong>alcène</strong>.</>,
      tache: { type: 'qcm', q: 'Pour obtenir l’hex-5-én-2-ol (alcool, C=C intact), quel réactif faut-il utiliser ?', options: ['NaBH₄ (ou LiAlH₄)', 'H₂/Pd', 'Aucun des deux'], bonne: 0, indice: 'Quel réactif réduit le C=O sans toucher à C=C ?', expl: <>Les hydrures (<strong>NaBH₄</strong>) réduisent le C=O sans toucher la C=C isolée ; H₂/Pd fait l'inverse. Deux réactifs, deux groupes, deux produits différents.</> } },
    { titre: 'Le paracétamol', texte: <>Le <strong>4-aminophénol</strong> porte un groupe –OH (phénol) et un groupe –NH₂ (amine). Traité par un équivalent d'anhydride éthanoïque, il donne le paracétamol.</>, tache: ici('aminophenol', 'Ac2O', 'Choisis le 4-aminophénol et Ac₂O (1 éq.).') },
    { titre: 'N ou O ?',
      retenirTitre: 'À RETENIR : LE PARACÉTAMOL',
      retenir: <>
                <table style={{ borderCollapse: 'collapse', margin: '6px 0 2px', fontSize: 13.5 }}>
          <thead><tr><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Conditions</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Groupe acylé</th><th style={{ padding: '2px 8px', whiteSpace: 'nowrap', textAlign: 'left', borderBottom: '1px solid #7aa6d6' }}>Produit</th></tr></thead>
          <tbody>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>Ac₂O, 1 éq., eau, 25 °C</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>amine –NH₂ (amide)</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>paracétamol</td></tr>
            <tr><td style={{ padding: '2px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>Ac₂O en excès, pyridine, 80 °C</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>amine et phénol</td><td style={{ padding: '2px 8px', verticalAlign: 'top' }}>éthanoate de 4-acétamidophényle</td></tr>
          </tbody>
        </table>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Avec 1 éq. : <strong>chimiosélective</strong> (paracétamol = N-(4-hydroxyphényl)éthanamide) ; avec excès et chauffage : non sélective.</li>
          <li>Le doublet de l’<strong>azote</strong> est plus <strong>nucléophile</strong> que celui de l’oxygène du phénol : l’amine attaque en premier le C=O de l’anhydride.</li>
          <li>Un <strong>excès</strong> de réactif et le <strong>chauffage</strong> permettent d’acyler aussi le phénol : la sélectivité est perdue.</li>
          <li><strong>Piège :</strong> la sélectivité dépend aussi des <strong>conditions</strong> (quantité, température), pas seulement du réactif.</li>
        </ul>
      </>,
      texte: <>L'azote de l'amine et l'oxygène du phénol portent chacun un doublet.</>,
      tache: { type: 'qcm', q: 'Quel groupe est acylé par un équivalent d’anhydride éthanoïque ?', options: ['L’amine –NH₂ (formation de l’amide)', 'Le phénol –OH (formation de l’ester)', 'Les deux en parts égales'], bonne: 0, indice: 'Le doublet le plus disponible attaque le carbone du C=O de l’anhydride.', expl: <>Le doublet de l'<strong>azote</strong> est plus nucléophile : on obtient l'<strong>amide</strong>, le paracétamol. C'est une réaction chimiosélective.</> } },
    { titre: 'Bilan', texte: <>Tu sais prévoir quel groupe réagit.</>,
      retenir: <>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
          <li><strong>Repérer</strong> les groupes fonctionnels de la molécule.</li>
          <li><strong>Comparer</strong> leur réactivité vis-à-vis du réactif : électrophilie (C=O) ou nucléophilie (N, O).</li>
          <li><strong>Tenir compte du pouvoir du réactif</strong> et des conditions : doux ou puissant, 1 éq. ou excès, froid ou chauffé.</li>
          <li><strong>Conclure</strong> : quel groupe est transformé, lequel est intact, et quel est le produit.</li>
        </ol>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Hypothèses :</strong> résultats classiques de cours, valables dans les conditions indiquées ; une autre température ou un autre solvant peut changer le bilan.</li>
        </ul>
      </> },
  ];
}

// ── Défi ──
function alea(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function defi(seed = Math.floor(Math.random() * 1e9)) {
  const r = alea(seed), [sub, re] = COUPLES[Math.floor(r() * COUPLES.length)], b = bilan(sub, re), S = b.S;
  const opts = [`Seulement le groupe ${S.gA}`, `Seulement le groupe ${S.gB}`, 'Les deux groupes', 'Aucun des deux groupes'];
  const bonne = b.nb === 0 ? 3 : b.nb === 2 ? 2 : b.touches[0] === 'A' ? 0 : 1;
  const Q = [
    { id: 'qui', type: 'qcm', q: `${S.nom} est traité par ${b.R.nom}. Quel(s) groupe(s) réagit(ent) ?`, options: opts, bonne, detail: b.R.pourquoi },
    { id: 'chimio', type: 'qcm', q: 'La réaction est-elle chimiosélective ?', options: ['Oui', 'Non : les deux groupes réagissent', 'Non : aucun groupe ne réagit'], bonne: b.nb === 1 ? 0 : b.nb === 2 ? 1 : 2, detail: b.nb === 1 ? 'Un seul groupe sur deux est transformé : chimiosélective.' : b.nb === 2 ? 'Les deux groupes sont transformés : pas de sélectivité.' : 'Il n\'y a pas de transformation.' },
    { id: 'nb', type: 'num', q: 'Combien de groupes fonctionnels sont transformés ?', unite: '', vrai: b.nb, tol: 0.02, detail: `${b.nb} : ${b.touches.map(g => nomGroupe(sub, g)).join(' et ') || 'aucun'}.` },
    { id: 'prod', type: 'qcm', q: 'Quel est le produit obtenu ?', options: [...new Set([b.R.produit, ...Object.values(S.reactifs).map(x => x.produit)])].sort(), bonne: [...new Set([b.R.produit, ...Object.values(S.reactifs).map(x => x.produit)])].sort().indexOf(b.R.produit), detail: `Produit : ${b.R.produit}.` },
  ];
  return { Q, reps: {}, verifie: false, scen: { sub, re } };
}
const INDICE_Q = { qui: 'Compare l’électrophilie ou la nucléophilie des deux groupes et le pouvoir du réactif.', chimio: 'Chimiosélective : un seul groupe sur deux réagit.', nb: 'Compte les groupes transformés.', prod: 'Applique la transformation du ou des groupes concernés.' };

const hypotheses = (
  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
    <li>Les résultats sont ceux des <strong>conditions classiques</strong> de cours (température, solvant, quantité de réactif indiqués). Dans d'autres conditions, la sélectivité peut changer.</li>
    <li>Seules les <strong>transformations principales</strong> sont représentées : on ne traite ni les rendements, ni les réactions secondaires.</li>
    <li>Pour H₂/Pd on suppose des conditions douces (1 bar, 25 °C), où les groupes C=O ne sont pas réduits.</li>
    <li>Dans la dernière étape de la synthèse du paracétamol, l'hydrolyse éventuelle de l'ester n'est pas considérée.</li>
    <li>L'animation est <strong>schématique</strong> : elle montre quel groupe est transformé, pas le mécanisme.</li>
  </ul>
);

export function SimulationChimioselectivite() {
  const [mode, setMode] = useState(() => modeOuverture('chimio-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('chimio-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [sub, setSub] = useState('cetoester');
  const [re, setRe] = useState('NaBH4');
  const [u, setU] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [df, setDf] = useState(() => defi());
  const [hypoOuv, setHypoOuv] = useState(false);
  const regler = (s, r) => { setSub(s); setRe(r); setU(0); setLecture(false); };
  const b = bilan(sub, re), S = SUBSTRATS[sub];

  useEffect(() => {
    if (!lecture) return;
    let raf, t0 = null, u0 = u >= 0.999 ? 0 : u;
    const pas = ts => { if (t0 === null) t0 = ts; const nv = Math.min(1, u0 + (ts - t0) / 4000); setU(nv); if (nv >= 1) { setLecture(false); return; } raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [lecture]);   // eslint-disable-line react-hooks/exhaustive-deps

  const etapes = etapesGuide({ sub, re }, regler);
  const finParcours = guide.etape >= etapes.length;
  const juste = k => k.type === 'num' ? proche(lireNombre(df.reps[k.id] ?? ''), k.vrai, k.tol) : df.reps[k.id] === k.bonne;
  const menu = { fontSize: 14, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, background: 'white', color: KIT.txt, width: '100%' };

  const visuel = (
    <div style={{ flex: '1 1 380px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Molécule
          <select value={sub} onChange={e => regler(e.target.value, Object.keys(SUBSTRATS[e.target.value].reactifs)[0])} style={menu} aria-label="Molécule">
            {Object.values(SUBSTRATS).map(s => <option key={s.cle} value={s.cle}>{s.nom}</option>)}</select></label>
        <label style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Réactif
          <select value={re} onChange={e => regler(sub, e.target.value)} style={menu} aria-label="Réactif">
            {Object.values(S.reactifs).map(r => <option key={r.cle} value={r.cle}>{r.nom}</option>)}</select></label>
      </div>
      <Reaction sub={sub} re={re} u={u} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => { if (u >= 0.999) setU(0); setLecture(l => !l); }} style={styleBouton(true, '#16a34a')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
        <input type="range" min={0} max={1000} step={1} value={Math.round(u * 1000)} onChange={e => { setLecture(false); setU(+e.target.value / 1000); }} aria-label="Avancement de la réaction" style={{ flex: 1 }} />
      </div>
      <div style={{ ...styleBoite, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }} aria-live="polite">{texteEtat(sub, re, u)}</div>
    </div>
  );

  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>Situation : <strong>{SUBSTRATS[df.scen.sub].nom}</strong> + <strong>{SUBSTRATS[df.scen.sub].reactifs[df.scen.re].nom}</strong>. <button onClick={() => regler(df.scen.sub, df.scen.re)} style={stylePetitBouton(false, '#b45309')}>Régler la simulation</button></div>
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
              </div>)}
            {df.verifie && !ok && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>{k.type === 'num' && <>Réponse attendue : <strong>{fmt(k.vrai, 0)}</strong> — </>}{avecIndices(k.detail)}</div>}
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
        <h2 style={{ margin: 0, fontSize: 21 }}>Chimiosélectivité</h2>
        <BoutonsModes mode={mode} setMode={setMode} />
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 10 }}>
        {visuel}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'guide' && <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />}
          {mode === 'explore' && <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Bilan</div>
            <div style={{ fontSize: 14, color: KIT.txt, padding: '4px 0', borderBottom: `1px dashed ${KIT.bord}` }}>Produit : <strong>{b.R.produit}</strong></div>
            <LigneMesure nom="Groupes transformés" valeur={b.touches.length ? b.touches.map(g => nomGroupe(sub, g)).join(' + ') : 'aucun'} couleur="#7c3aed" />
            <LigneMesure nom="Chimiosélective ?" valeur={b.nb === 1 ? 'oui' : b.nb === 2 ? 'non (2 groupes)' : 'pas de réaction'} couleur="#16a34a" />
            <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 8, lineHeight: 1.55 }}>{b.R.pourquoi}</div>
          </div>}
          {mode === 'defi' && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></div>}
        </div>
      </div>
      {finParcours && mode === 'guide' && <ARetenir titre="À RETENIR">Chimiosélectivité : le réactif transforme un groupe fonctionnel de préférence à un autre, selon leur réactivité et le pouvoir du réactif.</ARetenir>}
      <div style={{ ...styleBoite, marginTop: 12 }}>
        <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
      </div>
    </div>
  );
}
