import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite,
  BoutonsModes, ORANGE_GUIDE, lireNombre } from "../commun";
import { ITEMS, COMPETENCES, nouvelItem, nb, fm } from "./AtelierVraisemblableBanque";
import { parDomaine } from "./ordreDomaines";

// ====================================================
//  SIM 36 — ATELIER « CE RÉSULTAT EST-IL VRAISEMBLABLE ? » (compétence Valider)
// ====================================================
// Démarche : 1. juger le résultat (ordre de grandeur, bornes physiques, écriture) ; 2. justifier avec un repère ;
// 3. diagnostiquer l'erreur probable ; 4. donner la valeur correcte.

const STAGES = ['verdict', 'arg', 'cause', 'val'];
const TITRES = { verdict: 'Que pensez-vous de ce résultat ?', arg: 'Quel argument justifie votre jugement ?', cause: 'Quelle erreur a probablement été commise ?', val: 'Quelle est la valeur correcte ?' };

const Verdict = ({ ok, children }) => (
  <div style={{ fontSize: 14, marginTop: 6, fontWeight: 700, color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✅ ' : '❌ '}{children}</div>
);
const Correction = ({ children }) => (
  <div style={{ fontSize: 13.5, marginTop: 6, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', color: KIT.txt }}>{children}</div>
);

function CarteItem({ it, repere }) {
  return (
    <div style={{ ...styleBoite, background: 'white' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{it.domaine} — {it.titre}</div>
      <div style={{ fontSize: 15.5, lineHeight: 1.6, color: KIT.txt }}>{it.enonce}</div>
      <div style={{ marginTop: 8, background: '#f1f5f9', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: KIT.txt2 }}>Calcul de l’élève</div>
        <div style={{ fontSize: 14.5, color: KIT.txt, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', lineHeight: 1.7, overflowWrap: 'anywhere' }}>{it.calc}</div>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', marginTop: 4 }} data-resultat="1">Résultat : {it.res}</div>
      </div>
      {repere && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 13.5, cursor: 'pointer', color: '#0369a1', fontWeight: 700 }}>Repères utiles</summary>
          <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 4 }}>{it.repere}</div>
        </details>)}
    </div>
  );
}

export function SimulationAtelierVraisemblable() {
  const [mode, setMode] = useState('explore');
  const [guide, setGuide] = useEtatPersistant('atelier-vraisemblable-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [bilan, setBilan] = useEtatPersistant('atelier-vraisemblable-bilan-v1', { defis: 0, cumul: [0, 0, 0, 0] });
  const [choix, setChoix] = useState('piscine');
  const [it, setIt] = useState(() => nouvelItem('piscine'));
  const [rep, setRep] = useState({});
  const [chk, setChk] = useState({});
  const [vu, setVu] = useState({});
  const [etp, setEtp] = useState(0);
  const [indice, setIndice] = useState({});
  const [defiFini, setDefiFini] = useState(false);
  const itG = useState(() => nouvelItem('piscine', 'conv', { h: 3 }))[0];
  const enDefi = mode === 'defi', enGuide = mode === 'guide';

  const charger = (id, v = null) => { setIt(nouvelItem(id, v)); setRep({}); setChk({}); setVu({}); setEtp(0); setIndice({}); setDefiFini(false); };
  const changerMode = m => {
    setMode(m);
    if (m === 'defi') { const i = ITEMS[Math.floor(Math.random() * ITEMS.length)]; setChoix(i.id); charger(i.id); }
    else if (m === 'explore') charger(choix);
  };

  const ok = {
    verdict: rep.verdict === it.verdict,
    arg: rep.arg === it.argBonne,
    cause: rep.cause === it.cause,
    val: (() => { const x = lireNombre(rep.val); return isFinite(x) && Math.abs(x - it.valeur.val) <= it.valeur.tol * Math.abs(it.valeur.val); })(),
  };
  const corriger = s => setChk(c => ({ ...c, [s]: true }));
  const choisir = (s, v) => { setRep(r => ({ ...r, [s]: v })); setChk(c => ({ ...c, [s]: false })); };
  const verifierDefi = () => {
    if (defiFini) return;
    setDefiFini(true);
    setBilan(b => ({ defis: b.defis + 1, cumul: b.cumul.map((v, i) => v + (ok[STAGES[i]] ? 1 : 0)) }));
  };
  const aideVerdict = it.verdict === 'ok'
    ? 'Comparez le résultat à ce que vous savez (voir « Repères utiles ») : est-il du bon ordre de grandeur, dans les bornes physiques, bien écrit ?'
    : it.verdict === 'forme' ? 'La valeur est-elle plausible ? Regardez aussi l’écriture : le nombre de chiffres significatifs est-il cohérent avec les données ?'
      : 'Comparez le résultat à ce que vous savez : unités, ordre de grandeur, limites physiques (une transmittance, un rendement, une concentration…).';
  const corrTxt = s => {
    if (s === 'verdict') return `Verdict attendu : ${it.verdictOpts.find(o => o.k === it.verdict).label}.`;
    if (s === 'arg') return `Argument : ${it.arg}`;
    if (s === 'cause') return `${it.causeOpts.find(o => o.k === it.cause).label}. ${it.cause === 'aucune' ? '' : 'Relisez la ligne de calcul de l’élève pour retrouver où l’erreur a été faite.'}`;
    return `Valeur correcte : ≈ ${fm(it.valeur.val)} ${it.valeur.u}.`;
  };
  const dsp = s => (enDefi ? defiFini : !!chk[s]);

  const carte = (s, i) => {
    const bon = ok[s], affichee = dsp(s);
    return (
      <div key={s} data-stage={s} style={styleBoite}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>{i + 1}. {TITRES[s]}</div>
        {s === 'val' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input aria-label="Valeur correcte" data-vrai={it.valeur.val} placeholder="?" value={rep.val ?? ''} disabled={enDefi && defiFini}
              onChange={e => choisir('val', e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !enDefi) corriger('val'); }}
              style={{ fontSize: 15, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 140, color: KIT.txt }}/>
            <span style={{ fontSize: 14, color: KIT.txt2 }}>{it.valeur.u}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(s === 'verdict' ? it.verdictOpts.map(o => ({ key: o.k, label: o.label, bonne: o.k === it.verdict }))
              : s === 'arg' ? it.argOpts.map((t, k) => ({ key: k, label: t, bonne: k === it.argBonne }))
                : it.causeOpts.map(o => ({ key: o.k, label: o.label, bonne: o.k === it.cause }))).map(o => (
              <button key={o.key} data-ok={o.bonne ? 'true' : 'false'} disabled={enDefi && defiFini} onClick={() => choisir(s, o.key)}
                style={{ ...styleBouton(rep[s] === o.key, '#0ea5e9'), textAlign: 'left', padding: '6px 10px' }}>{o.label}</button>))}
          </div>)}
        {indice[s] && <Correction>💡 {s === 'verdict' ? aideVerdict : s === 'arg' ? 'Cherchez une comparaison concrète : un repère connu, une limite physique, un ordre de grandeur.' : s === 'cause' ? 'Relisez la ligne de calcul de l’élève, étape par étape : unités, formule, signe, écriture.' : 'Refaites le calcul vous-même, avec les données de l’énoncé et en vérifiant les unités.'}</Correction>}
        {affichee && <Verdict ok={bon}>{bon ? 'Bravo !' : 'Pas encore.'}</Verdict>}
        {(vu[s] || (enDefi && defiFini)) && !bon && <Correction>{corrTxt(s)}</Correction>}
        {affichee && bon && !enDefi && s !== 'verdict' && <Correction>{corrTxt(s)}</Correction>}
        {!enDefi && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
            <button onClick={() => corriger(s)} style={styleBouton(true, '#16a34a')}>✓ Corriger</button>
            {!bon && <button onClick={() => { corriger(s); setVu(x => ({ ...x, [s]: true })); }}
              style={{ fontSize: 12.5, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer' }}>voir la correction</button>}
            {!indice[s] && <button onClick={() => setIndice(x => ({ ...x, [s]: true }))} style={stylePetitBouton(false)}>💡 Indice</button>}
            {(bon || vu[s]) && chk[s] && i === etp && i < STAGES.length - 1 && <button onClick={() => setEtp(e => e + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Étape suivante ▶</button>}
          </div>)}
      </div>);
  };
  const visibles = enDefi ? STAGES : STAGES.slice(0, etp + 1);

  // ── Parcours guidé : pression au fond d'une piscine, h non converti ──
  const O = (txts, bonne) => ({ options: txts, bonne });
  const ETAPES = [
    { id: 'intro', titre: 'Valider, c’est une compétence', texte: <>Un calcul peut être faux sans qu’aucune touche de la calculatrice ne soit mal tapée. <b>Avant de rendre un résultat, on se demande s’il est vraisemblable.</b> Exemple (à gauche) : le calcul d’un élève.</>,
      tache: { type: 'qcm', q: 'Que fait-on une fois le calcul terminé ?', ...O(['On se demande si le résultat est vraisemblable (ordre de grandeur, unités, limites physiques)', 'On passe directement à l’exercice suivant', 'On recommence le calcul à l’identique'], 0), expl: 'Valider, c’est confronter le résultat à ce que l’on sait déjà.' } },
    { id: 'repere', titre: 'Avoir des repères', texte: 'Pour juger un résultat, il faut quelques valeurs de référence en tête. En voici une, utile pour l’eau.',
      tache: { type: 'qcm', q: 'Quelle règle relie la profondeur d’eau et la pression ?', ...O(['10 m d’eau ≈ 1 bar', '1 m d’eau ≈ 1 bar', '100 m d’eau ≈ 1 bar'], 0), expl: '10 m d’eau ≈ 1 bar (soit 10⁵ Pa), en plus de la pression atmosphérique.' } },
    { id: 'verdict', titre: 'Juger le résultat', texte: 'L’élève trouve 2,94×10⁶ Pa pour 3 m d’eau. Comparez avec le repère.',
      tache: { type: 'qcm', q: 'Que pensez-vous de ce résultat ?', ...O(['Résultat invraisemblable (valeur absurde ou très improbable)', 'Résultat vraisemblable', 'Valeur plausible, mais mal écrite (chiffres significatifs)'], 0), expl: '2,94×10⁶ Pa ≈ 29 bar, soit l’équivalent de 300 m d’eau : impossible au fond d’une piscine de 3 m.' } },
    { id: 'arg', titre: 'Justifier', texte: 'Un jugement doit s’appuyer sur un argument chiffré.',
      tache: { type: 'qcm', q: 'Quel argument est le meilleur ?', ...O([itG.arg, 'Un résultat est toujours vraisemblable s’il est écrit avec une unité.', 'Le résultat est positif, donc il est forcément bon.', 'Rien ne permet de juger sans refaire entièrement le calcul.'], 0), expl: 'On compare à un repère : 29 bar ↔ 290 m d’eau.' } },
    { id: 'cause', titre: 'Diagnostiquer l’erreur', texte: <>Relisez le calcul de l’élève : « <b>{itG.calc}</b> ». Quelle valeur étonnante y apparaît ?</>,
      tache: { type: 'qcm', q: 'Quelle erreur a probablement été commise ?', ...O(['Oubli ou erreur de conversion d’unité (h en cm au lieu de m)', 'Formule fausse ou mal utilisée', 'Erreur de signe ou d’exposant', 'Aucune erreur : le calcul est correct'], 0), expl: 'h a été utilisée en centimètres (300) au lieu de mètres (3) : le résultat est 100 fois trop grand.' } },
    { id: 'val', titre: 'Corriger', texte: 'Refaites le calcul avec h = 3 m : P = ρ·g·h.',
      tache: { type: 'num', q: 'Quelle est la pression relative correcte ?', unite: 'Pa', vrai: 1000 * 9.81 * 3, tol: 0.02, pieges: [[1000 * 9.81 * 300, 'C’est la valeur de l’élève : il faut convertir h en mètres.']], affiche: v => nb(v), expl: 'P = 1000 × 9,81 × 3 ≈ 29 400 Pa ≈ 0,29 bar : cohérent avec le repère.' } },
    { id: 'bornes', titre: 'Les limites physiques', texte: 'Certains résultats sont invraisemblables quelles que soient les données : ils violent une loi ou une limite.',
      tache: { type: 'qcm', q: 'Lequel de ces résultats est impossible par nature ?', ...O(['Un rendement de 115 % pour une bouilloire', 'Une eau du robinet à 15 °C', 'Une vitesse de 2 m·s⁻¹ dans une conduite', 'Une pression de 1,2 bar au fond d’une piscine de 2 m'], 0), expl: 'Un rendement dépasse 100 % : l’énergie ne se crée pas. Même logique pour une transmittance > 100 % ou une concentration négative.' } },
    { id: 'bravo', titre: 'Bravo !', texte: <>La démarche : <b>1.</b> avoir des repères et des limites physiques en tête ; <b>2.</b> comparer le résultat ; <b>3.</b> relire le calcul pour trouver l’erreur (unité, formule, signe, °C/K) ; <b>4.</b> corriger et vérifier de nouveau ; <b>5.</b> écrire avec le bon nombre de chiffres significatifs. Entraînez-vous maintenant sur d’autres calculs.</> },
  ];
  const finParcours = <button onClick={() => changerMode('explore')} style={styleBouton(true, ORANGE_GUIDE)}>S’entraîner ▶</button>;

  const bil = defiFini ? STAGES.map(s => (ok[s] ? 1 : 0)) : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .atv-l1 { display: grid; align-items: start; gap: 12px; grid-template-columns: minmax(0, 1fr); }
        .atv-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (max-width: 960px) { .atv-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Atelier : ce résultat est-il vraisemblable ?</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10 }}>Compétence travaillée : <b>Valider</b> — juger un résultat, trouver l’erreur, corriger.</div>
      {enGuide ? (
        <div className="atv-l1 cote">
          <CarteItem it={itG} repere={false}/>
          <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
        </div>
      ) : (
        <div className="atv-l1">
          {!enDefi && (
            <div style={{ ...styleBoite, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: 14 }}>Calcul :{' '}
                <select aria-label="Choix du calcul" value={choix} onChange={e => { setChoix(e.target.value); charger(e.target.value); }}
                  style={{ fontSize: 14, padding: 4, borderRadius: 6, border: `1.5px solid ${KIT.bord}` }}>
                  {parDomaine(ITEMS).map(([d, l]) => <optgroup key={d} label={d}>{l.map(i => <option key={i.id} value={i.id}>{i.titre}</option>)}</optgroup>)}
                </select></label>
              <button onClick={() => charger(choix)} style={stylePetitBouton(false)}>🎲 Nouveau calcul</button>
            </div>)}
          <CarteItem it={it} repere={!enDefi}/>
          {visibles.map((s, i) => carte(s, i))}
          {enDefi && !defiFini && <div><button onClick={verifierDefi} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button></div>}
          {enDefi && defiFini && bil && (
            <div style={styleBoite}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Bilan par compétence</div>
              {COMPETENCES.map((c, i) => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ width: 250, fontSize: 14 }}>{c}</span>
                  <span style={{ fontSize: 15 }}>{bil[i] ? '✅' : '❌'}</span>
                </div>))}
              <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Défis faits sur cet appareil : {bilan.defis}.</div>
              <button onClick={() => { const i = ITEMS[Math.floor(Math.random() * ITEMS.length)]; setChoix(i.id); charger(i.id); }} style={{ ...styleBouton(true, '#0ea5e9'), marginTop: 8 }}>Nouveau calcul</button>
            </div>)}
        </div>)}
    </div>
  );
}
