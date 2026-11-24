import { useMemo, useState } from "react";
import { cardStyle, stylePetitBouton, lireProgression } from "../commun";
import { CHAPITRES } from "../chapitres";
import { ParcoursCompetence, FilAriane } from "../ParcoursCompetence";
import { lireSelection, ecrireSelection, SEL_VIDE } from "../selectionParcours";
import { sanitiser, filtrer } from "../parcoursCommun";
import { ENONCES } from "./AtelierDonneesBanque";
import { SITUATIONS } from "./AtelierSituationsBanque";
import { SCENARIOS } from "./AtelierGraphiqueBanque";
import { ExerciceDonnees, ExerciceSituation } from "./AtelierDonnees";
import { ExerciceGraphique } from "./AtelierGraphique";
import { TYPES_SAPP, construireItemsSapp } from "./sappParcours";

// ====================================================
//  S'APP : S'APPROPRIER — porte d'entrée commune des ateliers 34 (énoncés, situations) et 35 (graphiques)
// ====================================================
// Types d'exercices → (niveau → enseignement → chapitre) → liste → exercice. Les trois lecteurs d'exercice sont ceux des anciens ateliers.
const COULEUR_SAPP = '#3f78a8';
const INTRO_SAPP = 'S’approprier, c’est comprendre ce qu’on te demande et trouver l’information utile avant de calculer. Choisis d’abord ce que tu veux travailler.';

export function SimulationAtelierSapp() {
  const items = useMemo(() => construireItemsSapp({ enonces: ENONCES, situations: SITUATIONS, scenarios: SCENARIOS }), []);
  const [sel, setSelBrut] = useState(() => {
    const s0 = lireSelection();   // anciens liens : ?ex=reservoir (première question de l'énoncé)
    if (s0.ex && !items.some(i => i.id === s0.ex) && items.some(i => i.id === `${s0.ex}.0`)) s0.ex = `${s0.ex}.0`;
    return sanitiser(s0, items, TYPES_SAPP);
  });
  const setSel = x => {
    const net = { ...SEL_VIDE, ...x }; setSelBrut(net); ecrireSelection(net);
    try { document.getElementById('zone-simulation')?.scrollIntoView({ block: 'start' }); } catch { /* sans effet */ }
  };
  const ouvrir = (it, ctx) => setSel({ ...(ctx || sel), type: it.type, ex: it.id });
  const prog = lireProgression();
  if (!sel.ex) {
    return (
      <div style={{ ...cardStyle, textAlign: 'left' }}>
        <ParcoursCompetence code="S'APP" titre="S’APP : s’approprier un énoncé" intro={INTRO_SAPP} couleur={COULEUR_SAPP} types={TYPES_SAPP} items={items} chapitres={CHAPITRES} prog={prog} sel={sel} setSel={setSel} ouvrir={ouvrir} />
      </div>);
  }
  const item = items.find(i => i.id === sel.ex);
  const ctx = { type: item.type, niv: sel.niv, ens: sel.ens, ch: sel.ch };
  const liste = filtrer(items, ctx);
  const pos = liste.findIndex(i => i.id === item.id);
  const aller = i => setSel({ ...ctx, ex: liste[i].id });
  const hasard = () => { const n = liste.length; let j = pos; if (n > 1) while (j === pos) j = Math.floor(Math.random() * n); aller(j); };
  const navigation = (
    <>
      <button onClick={() => setSel({ ...ctx, ex: '' })} style={stylePetitBouton(false)}>☰ Retour à la liste</button>
      {pos > 0 && <button onClick={() => aller(pos - 1)} style={stylePetitBouton(false)}>◀ Précédent</button>}
      {pos >= 0 && pos < liste.length - 1 && <button onClick={() => aller(pos + 1)} style={stylePetitBouton(false)}>Suivant ▶</button>}
      {liste.length > 1 && <button onClick={hasard} style={stylePetitBouton(false)}>🎲 Au hasard</button>}
    </>);
  const entete = <FilAriane code="S'APP" couleur={COULEUR_SAPP} types={TYPES_SAPP} chapitres={CHAPITRES} sel={ctx} setSel={setSel} dansExercice />;
  if (item.type === 'situation') return <ExerciceSituation key={item.id} id={item.brut} entete={entete} navigation={navigation} />;
  if (item.type === 'graphique') return <ExerciceGraphique key={item.id} id={item.brut} entete={entete} navigation={navigation} />;
  return <ExerciceDonnees key={item.id} id={item.brut} q={item.q} entete={entete} navigation={navigation} />;
}
