// ═══════════════════════════════════════════════════════════════════════════
//  Fiche « BTS MDC / IUT » de l'accueil : les chapitres sont regroupés par rubrique (Analyse, Synthèse, Formulation),
//  avec quelques chapitres en exemple ; les autres se déplient. La rubrique vient de chapitres.js (champ « rubrique »),
//  rien n'est à tenir à jour ici sauf, au besoin, le choix des exemples (« exemples » : identifiants de chapitres).
// ═══════════════════════════════════════════════════════════════════════════
const RUBRIQUES = {
  Analyse: { sous: 'Mesurer, doser et identifier une substance', exemples: ['bts-titrages', 'bts-chromatographie', 'bts-rmn'] },
  Synthèse: { sous: 'Comprendre et orienter une réaction de synthèse', exemples: ['bts-selectivites', 'bts-mecanismes', 'bts-cinetique'] },
  Formulation: { sous: 'Concevoir un mélange et en maîtriser les propriétés', exemples: ['bts-tensioactifs', 'bts-rheologie', 'bts-couleur-produire'] },
};
const NB_EXEMPLES = 3;

const css = `
  .ab-rub { margin: 0; padding: 12px 0 0; border-top: 1px solid rgba(255,255,255,.28); }
  .ab-rub + .ab-rub { margin-top: 12px; }
  .ab-rub:first-of-type { border-top: none; padding-top: 0; }
  .ab-rub h4 { margin: 0; font: 800 17px/1.2 Outfit, Inter, system-ui, sans-serif; letter-spacing: -.01em; }
  .ab-rub h4 small { font: 600 12.5px Inter, system-ui, sans-serif; opacity: .85; letter-spacing: 0; margin-left: 8px; white-space: nowrap; }
  .ab-rub-sous { margin: 3px 0 9px; font-size: 13.5px; opacity: .92; }
  .ab-rub details { margin-top: 9px; }
  .ab-rub summary { cursor: pointer; font: 700 13.5px Inter, system-ui, sans-serif; text-decoration: underline; width: fit-content; padding: 2px 0; }
  .ab-rub summary:focus-visible { outline: 3px solid #0c1a2e; outline-offset: 2px; }
  .ab-rub details .ab-puces { margin-top: 8px; }
`;

function Puces({ chaps, sansEmoji, onStart }) {
  return (
    <ul className="ab-puces">
      {chaps.map(c => <li key={c.id}><button type="button" onClick={() => onStart(c.sims[0])}>{sansEmoji(c.label)}</button></li>)}
    </ul>);
}

export function RubriquesBTS({ chaps, sansEmoji, onStart }) {
  const noms = [];
  chaps.forEach(c => { const r = c.rubrique || 'Autres chapitres'; if (!noms.includes(r)) noms.push(r); });
  return (
    <div>
      <style>{css}</style>
      {noms.map(nom => {
        const liste = chaps.filter(c => (c.rubrique || 'Autres chapitres') === nom);
        const nbSims = liste.reduce((t, c) => t + c.sims.length, 0);
        const voulus = (RUBRIQUES[nom]?.exemples || []).map(id => liste.find(c => c.id === id)).filter(Boolean);
        const exemples = [...voulus, ...liste.filter(c => !voulus.includes(c))].slice(0, NB_EXEMPLES);
        const autres = liste.filter(c => !exemples.includes(c));
        return (
          <section key={nom} className="ab-rub" aria-label={nom}>
            <h4>{nom}<small>{liste.length} chapitre{liste.length > 1 ? 's' : ''} · {nbSims} simulation{nbSims > 1 ? 's' : ''}</small></h4>
            {RUBRIQUES[nom] && <p className="ab-rub-sous">{RUBRIQUES[nom].sous}</p>}
            <Puces chaps={exemples} sansEmoji={sansEmoji} onStart={onStart} />
            {autres.length > 0 && (
              <details>
                <summary>{autres.length === 1 ? 'Voir l’autre chapitre' : `Voir les ${autres.length} autres chapitres`}</summary>
                <Puces chaps={autres} sansEmoji={sansEmoji} onStart={onStart} />
              </details>)}
          </section>);
      })}
    </div>);
}
