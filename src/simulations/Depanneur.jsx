import { useState } from "react";
import { KIT, stylePetitBouton, styleBoite } from "../commun";
import { NB } from "./Distillation";
import { nbf, ROUGE, VERT, BLEU, ORANGE } from "./Travail";
import { Plaque, Kofler } from "./Ccm";
import * as T from "./tpModele";
import * as C from "./ccmModele";

// ====================================================
//  « Dépanneur de TP » (exploration du TP chalcone) : un TP a mal tourné, l'élève mène l'enquête
//  (tests supplémentaires), trouve la cause puis le geste correctif, et voit le avant/après.
// ====================================================
const BASE = { m1: 3.40, m2: 3.35, nLav: 3, tSec: 20, vEtOH: 30 };
const PANNES = {
  humide: { cause: 'humide', p: { ...BASE, tSec: 3 }, action: 'etuve', corrige: { ...BASE },
    dit: m => `« J’ai pesé ${m} de solide et je n’ai pas l’impression d’avoir raté quelque chose, mais il colle un peu à la spatule. »` },
  soude: { cause: 'soude', p: { ...BASE, nLav: 0 }, action: 'laver', corrige: { ...BASE },
    dit: m => `« Mon solide pèse ${m}. Il est un peu savonneux au toucher. »` },
  exces: { cause: 'exces', p: { ...BASE, m1: 4.20, m2: 3.00, vEtOH: 0 }, action: 'stoechio', corrige: { ...BASE },
    dit: m => `« J’ai obtenu ${m} de solide brut, que je n’ai pas recristallisé. Mon binôme dit que la température de fusion n’est pas bonne. »` },
  solvant: { cause: 'solvant', p: { ...BASE, vEtOH: 120 }, action: 'evaporer', corrige: { ...BASE },
    dit: m => `« Après la recristallisation, il ne me reste que ${m} de cristaux. Pourtant ils ont l’air propres. »` },
};
const CAUSES = [
  ['humide', 'Le solide est encore humide (séchage trop court)', 'Un solide humide perdrait de la masse en repassant à l’étuve.'],
  ['soude', 'Il reste de la soude (lavage insuffisant)', 'Des eaux de lavage encore basiques (pH nettement supérieur à 7).'],
  ['exces', 'Un réactif était en excès (pesées non stœchiométriques)', 'Des pesées éloignées du rapport 1 : 1, et une tache de réactif en CCM.'],
  ['solvant', 'Trop d’éthanol à la recristallisation', 'Un très gros volume d’éthanol, et un rendement très faible.'],
  ['peu', 'Pas assez d’éthanol à la recristallisation', 'Très peu d’éthanol, et des impuretés piégées dans les cristaux.'],
];
const ACTIONS = [
  ['etuve', 'Remettre à l’étuve et repeser jusqu’à masse constante'],
  ['laver', 'Relaver à l’eau glacée jusqu’à des eaux de lavage proches de la neutralité'],
  ['stoechio', 'Refaire la synthèse en pesant les réactifs en proportions stœchiométriques, puis recristalliser'],
  ['evaporer', 'Recristalliser à nouveau avec le volume d’éthanol chaud minimal (ajouté mL par mL)'],
  ['plus', 'Recristalliser à nouveau avec nettement plus d’éthanol chaud'],
];
const TESTS = [
  ['repeser', 'Repeser après 10 min d’étuve'], ['ph', 'pH de la dernière eau de lavage'], ['ccm', 'CCM du produit'],
  ['kofler', 'Banc Kofler'], ['pesees', 'Cahier : pesées des réactifs'], ['ethanol', 'Cahier : éthanol utilisé'],
];
const tirer = excl => { const ks = Object.keys(PANNES).filter(k => k !== excl); return ks[Math.floor(Math.random() * ks.length)]; };

export function Depanneur() {
  const [cle, setCle] = useState(() => tirer(null));
  const [tests, setTests] = useState([]), [cause, setCause] = useState(null), [action, setAction] = useState(null), [fin, setFin] = useState(false);
  const pan = PANNES[cle], r = T.simuler(pan.p), r10 = T.simuler({ ...pan.p, tSec: pan.p.tSec + 10 }), apres = T.simuler(pan.corrige);
  const autre = () => { setCle(tirer(cle)); setTests([]); setCause(null); setAction(null); setFin(false); };
  const lance = k => setTests(t => t.includes(k) ? t : [...t, k]);
  const g = (x, d = 2) => `${nbf(x, d)}${NB}g`, fus = r.fusion, tf = fus.fin - fus.largeur / 2;
  const resultat = k => {
    const bloc = (titre, contenu) => <div key={k} style={{ border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 10, background: '#fff' }}><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{titre}</div>{contenu}</div>;
    const txt = c => <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5 }}>{c}</div>;
    if (k === 'repeser') return bloc('Repesée après 10 min d’étuve', txt(<>Avant : <strong>{g(r.m)}</strong>. Après : <strong>{g(r10.m)}</strong>.</>));
    if (k === 'ph') return bloc('pH de la dernière eau de lavage', txt(<>Papier pH : <strong>{nbf(r.ph, 1)}</strong>{r.ph > 10 ? '' : ' (eau pratiquement neutre)'}.</>));
    if (k === 'ccm') return bloc('CCM du produit (élué)', <Plaque p={T.plaqueTP(r)} etat="eluee" titre="Plaque de CCM du produit"/>);
    if (k === 'kofler') return bloc('Banc Kofler', <><Kofler tf={tf} largeur={fus.largeur > 1.5 ? 1 : 0}/>{txt(<>Fusion de <strong>{nbf(fus.debut, 0)}</strong> à <strong>{nbf(fus.fin, 0)}{NB}°C</strong> (littérature : {C.TF_LIT}{NB}°C, u = {C.U_TF}{NB}°C).</>)}</>);
    if (k === 'pesees') return bloc('Cahier : pesées', txt(<>Anisaldéhyde : <strong>{g(pan.p.m1)}</strong> ; 4’-méthylacétophénone : <strong>{g(pan.p.m2)}</strong>. Masse théorique de chalcone : <strong>{g(r.b.mth)}</strong>.</>));
    return bloc('Cahier : recristallisation', txt(pan.p.vEtOH > 0 ? <>Éthanol utilisé : <strong>{nbf(pan.p.vEtOH, 0)}{NB}mL</strong>. À chaud, 1{NB}g de chalcone se dissout dans environ 4{NB}mL d’éthanol.</> : <>Aucune recristallisation n’a été faite (produit brut).</>));
  };
  const causeOk = cause === pan.cause, actionOk = action === pan.action;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Dépanneur de TP</div>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>Un camarade a un problème avec son TP de la chalcone. À vous de mener l’enquête : choisissez les tests utiles, trouvez la cause, puis le geste qui répare.</div>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6, background: '#fff7ed', border: `1px solid ${ORANGE}`, borderRadius: 8, padding: 10 }}>
          {pan.dit(`${nbf(r.m, 2)}${NB}g (rendement apparent : ${nbf(100 * r.rApp, 0)}${NB}%)`)}</div>
      </div>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>1. Les tests : lesquels faire ?</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: tests.length ? 10 : 0 }} role="group" aria-label="Tests disponibles">
          {TESTS.map(([k, nom]) => <button key={k} onClick={() => lance(k)} aria-pressed={tests.includes(k)} style={stylePetitBouton(tests.includes(k), BLEU)}>{nom}</button>)}</div>
        {tests.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{tests.map(resultat)}</div>}
        {tests.length > 0 && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>{tests.length} test{tests.length > 1 ? 's' : ''} sur {TESTS.length} : un bon dépanneur ne fait que les tests utiles.</div>}
      </div>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>2. Quelle est la cause ?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} role="group" aria-label="Causes possibles">
          {CAUSES.map(([k, nom]) => <button key={k} onClick={() => { setCause(k); setFin(false); }} aria-pressed={cause === k} style={{ ...stylePetitBouton(cause === k, causeOk && cause === k ? VERT : cause === k ? ROUGE : BLEU), textAlign: 'left', whiteSpace: 'normal' }}>{nom}</button>)}</div>
        {cause && <div role="status" aria-live="polite" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5, color: causeOk ? VERT : ROUGE, fontWeight: 600 }}>
          {causeOk ? '✓ Bonne piste, les mesures le confirment.' : `✗ Si c’était la cause, on observerait : ${CAUSES.find(c => c[0] === cause)[2].toLowerCase()} Vérifiez avec les tests.`}</div>}
      </div>
      {causeOk && <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>3. Quel geste pour réparer ?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} role="group" aria-label="Gestes correctifs">
          {ACTIONS.map(([k, nom]) => <button key={k} onClick={() => { setAction(k); setFin(k === pan.action); }} aria-pressed={action === k} style={{ ...stylePetitBouton(action === k, k === pan.action && action === k ? VERT : action === k ? ROUGE : BLEU), textAlign: 'left', whiteSpace: 'normal' }}>{nom}</button>)}</div>
        {action && !actionOk && <div role="status" style={{ fontSize: 14, marginTop: 8, color: ROUGE, fontWeight: 600, lineHeight: 1.5 }}>✗ Ce geste ne traite pas la cause trouvée. Reprenez : que faut-il retirer, ajouter ou refaire ?</div>}
      </div>}
      {fin && <div style={styleBoite} role="status">
        <div style={{ fontSize: 15, fontWeight: 700, color: VERT, marginBottom: 6 }}>✓ Dépannage réussi : avant / après</div>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead><tr><th style={{ border: `1px solid ${KIT.bord}`, padding: '3px 8px' }}></th><th style={{ border: `1px solid ${KIT.bord}`, padding: '3px 8px' }}>Avant</th><th style={{ border: `1px solid ${KIT.bord}`, padding: '3px 8px' }}>Après</th></tr></thead>
          <tbody>{[['Masse pesée', g(r.m), g(apres.m)], ['Rendement apparent', `${nbf(100 * r.rApp, 0)}${NB}%`, `${nbf(100 * apres.rApp, 0)}${NB}%`],
            ['Fusion', `${nbf(fus.debut, 0)}–${nbf(fus.fin, 0)}${NB}°C`, `${nbf(apres.fusion.debut, 0)}–${nbf(apres.fusion.fin, 0)}${NB}°C`], ['pH de lavage', nbf(r.ph, 1), nbf(apres.ph, 1)]]
            .map(([a, b, c]) => <tr key={a}><td style={{ border: `1px solid ${KIT.bord}`, padding: '3px 8px' }}>{a}</td><td style={{ border: `1px solid ${KIT.bord}`, padding: '3px 8px' }}>{b}</td><td style={{ border: `1px solid ${KIT.bord}`, padding: '3px 8px', fontWeight: 700 }}>{c}</td></tr>)}</tbody></table></div>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>Valeurs issues du modèle qualitatif du TP (voir « Paillasse libre » pour les hypothèses). Le « après » suppose le geste correctif bien réalisé.</div>
        <button onClick={autre} style={{ ...stylePetitBouton(false, BLEU), marginTop: 10 }}>Une autre panne</button>
      </div>}
      {!fin && <button onClick={autre} style={{ ...stylePetitBouton(false, BLEU), alignSelf: 'flex-start' }}>Changer de panne</button>}
    </div>);
}
