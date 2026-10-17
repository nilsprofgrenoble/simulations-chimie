import { useMemo } from "react";
import { KIT, styleBoite } from "../commun";
import { catalogue } from "./catalogue";
import { ORDRE_DOMAINES } from "./ordreDomaines";
import { MAX_CHAPITRES } from "../chapitre";

// ═══════════════════════════════════════════════════════════════════════════
//  « CHAPITRE EN COURS » (suivi professeur) : de 0 à 3 thèmes que les élèves de la classe voient en tête de « Je m'entraîne ».
//  Réglage enregistré sur la classe (supabase/07-chapitre-et-ciblage.sql). Modifiable à tout moment, sans effet sur les résultats.
// ═══════════════════════════════════════════════════════════════════════════
const ROSE = '#e11d48';

export function ChapitreClasse({ classe, dispo, occupe, onChoix }) {
  const nb = useMemo(() => {
    const m = new Map();
    catalogue().forEach(i => { if (i.domaine && i.comp !== 'REA') m.set(i.domaine, (m.get(i.domaine) || 0) + 1); });
    return m;
  }, []);
  if (!dispo) {
    return <div style={{ ...styleBoite, margin: '0 0 10px', fontSize: 13.5 }}>📘 <b>Chapitre en cours</b> : disponible après avoir exécuté <code>supabase/07-chapitre-et-ciblage.sql</code> dans Supabase (SQL Editor → Run).</div>;
  }
  const cur = classe.chapitres || [];
  const bascule = d => onChoix(cur.includes(d) ? cur.filter(x => x !== d) : cur.length < MAX_CHAPITRES ? [...cur, d] : cur);
  return (
    <div style={{ ...styleBoite, margin: '0 0 10px', fontSize: 13.5 }}>
      <div><b>📘 Chapitre en cours</b> pour « {classe.nom} » : les élèves connectés voient ces thèmes en premier dans « Je m’entraîne », avec l’exercice conseillé (jusqu’à {MAX_CHAPITRES} thèmes). Les autres thèmes restent accessibles, repliés.</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }} role="group" aria-label="Chapitre en cours">
        {ORDRE_DOMAINES.map(d => {
          const n = nb.get(d) || 0, on = cur.includes(d), plein = !on && (cur.length >= MAX_CHAPITRES || n === 0);
          return (
            <button key={d} type="button" aria-pressed={on} disabled={occupe || plein} onClick={() => bascule(d)} title={n === 0 ? 'Aucun exercice sur ce thème pour l’instant' : undefined}
              style={{ cursor: plein ? 'default' : 'pointer', font: 'inherit', fontSize: 13.5, fontWeight: 700, padding: '5px 11px', borderRadius: 999, border: `1.5px solid ${on ? ROSE : KIT.bord}`, background: on ? ROSE : '#fff', color: on ? '#fff' : KIT.txt2, opacity: plein ? 0.5 : 1 }}>
              {on ? '✓ ' : ''}{d} <span style={{ fontWeight: 600, opacity: 0.85 }}>({n})</span>
            </button>);
        })}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>
        {cur.length === 0 ? 'Aucun chapitre choisi : les élèves voient la liste complète, comme avant.' : 'Le nombre entre parenthèses est le nombre d’exercices (S’APP et ANA) du thème. Les calculs (REA) sont proposés à part, pour tous les chapitres.'}
      </div>
    </div>);
}
