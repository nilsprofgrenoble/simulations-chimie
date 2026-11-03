// Énoncé « présenté » : contexte, données en liste, question isolée, et visuel(s) éventuel(s).
// presenter() renvoie { enonce, presentation, schema } : enonce (texte continu) sert aux descriptions du catalogue et aux anciens affichages ;
// presentation et schema sont utilisés par EnonceLisible et Visuel (SchemasC1.jsx).
// contexte et suite : un texte ou une liste de paragraphes ; suite s'affiche après les données (ex. raisonnement d'un élève).
const txt = t => (Array.isArray(t) ? t.join(' ') : t || '');
export const presenter = ({ contexte, liste = [], suite = '', question = '', schema = null }) => ({
  enonce: [txt(contexte), liste.length ? liste.map(([a, b]) => (a ? `${a} : ${b}` : b)).join(' ; ') + '.' : '', txt(suite), question].filter(Boolean).join(' '),
  presentation: { contexte, liste, suite, question },
  schema,
});
