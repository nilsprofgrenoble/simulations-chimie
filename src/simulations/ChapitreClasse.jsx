import { useMemo } from "react";
import { KIT, styleBoite } from "../commun";
import { catalogue } from "./catalogue";
import { NIVEAUX_CHAPITRES, chapitresDuNiveau, MAX_CHAPITRES } from "../chapitres";

// ═══════════════════════════════════════════════════════════════════════════
//  « CHAPITRE EN COURS » (suivi professeur) : de 0 à 3 chapitres, groupés par niveau (2GT, 1G, TSTL, BTS) comme dans le menu.
//  Les élèves de la classe les voient en tête de « Je m'entraîne », avec leurs simulations et les exercices du thème correspondant.
//  Réglage enregistré sur la classe (supabase/07-chapitre-et-ciblage.sql). Modifiable à tout moment, sans effet sur les résultats.
// ═══════════════════════════════════════════════════════════════════════════
const ROSE = '#e11d48';

export function ChapitreClasse({ classe, dispo, occupe, onChoix }) {
  const nbExos = useMemo(() => {
    const m = new Map();
    catalogue().forEach(i => { if (i.domaine && i.comp !== 'REA') m.set(i.domaine, (m.get(i.domaine) || 0) + 1); });
    return m;
  }, []);
  if (!dispo) {
    return <div style={{ ...styleBoite, margin: '0 0 10px', fontSize: 13.5 }}>📘 <b>Chapitre en cours</b> : disponible après avoir exécuté <code>supabase/07-chapitre-et-ciblage.sql</code> dans Supabase (SQL Editor → Run).</div>;
  }
  const cur = classe.chapitres || [];
  const bascule = id => onChoix(cur.includes(id) ? cur.filter(x => x !== id) : cur.length < MAX_CHAPITRES ? [...cur, id] : cur);
  return (
    <div style={{ ...styleBoite, margin: '0 0 10px', fontSize: 13.5 }}>
      <div><b>📘 Chapitre en cours</b> pour « {classe.nom} » : les élèves connectés voient ces chapitres en premier dans « Je m’entraîne », avec leurs simulations et l’exercice conseillé (jusqu’à {MAX_CHAPITRES} chapitres). Le reste reste accessible, replié.</div>
      {NIVEAUX_CHAPITRES.map(n => (
        <div key={n.key} role="group" aria-label={`Chapitres ${n.label}`} data-niveau={n.key} style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: KIT.txt2, letterSpacing: 0.5, marginBottom: 4 }}>{n.label.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {chapitresDuNiveau(n.key).map(c => {
              const on = cur.includes(c.id), plein = !on && cur.length >= MAX_CHAPITRES;
              const ne = c.domaines.reduce((s, d) => s + (nbExos.get(d) || 0), 0);
              return (
                <button key={c.id} type="button" aria-pressed={on} disabled={occupe || plein} onClick={() => bascule(c.id)} data-chapitre-id={c.id}
                  title={`${c.sims.length} simulation${c.sims.length > 1 ? 's' : ''} · ${ne} exercice${ne > 1 ? 's' : ''} de remédiation`}
                  style={{ cursor: plein ? 'default' : 'pointer', font: 'inherit', fontSize: 13.5, fontWeight: 700, padding: '5px 11px', borderRadius: 999, border: `1.5px solid ${on ? ROSE : KIT.bord}`, background: on ? ROSE : '#fff', color: on ? '#fff' : KIT.txt2, opacity: plein ? 0.5 : 1, textAlign: 'left' }}>
                  {on ? '✓ ' : ''}{c.label} <span style={{ fontWeight: 600, opacity: 0.85 }}>({c.sims.length} sim. · {ne} exo.)</span>
                </button>);
            })}
          </div>
        </div>))}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 8 }}>
        {cur.length === 0 ? 'Aucun chapitre choisi : les élèves voient la liste complète, comme avant.' : 'Entre parenthèses : le nombre de simulations du chapitre et d’exercices de remédiation (S’APP et ANA) du thème rattaché. Les calculs (REA) sont proposés à part, pour tous les chapitres.'}
      </div>
    </div>);
}
