// Énoncé « présenté » : contexte, données en liste, question isolée, et visuel(s) éventuel(s).
// presenter() renvoie { enonce, presentation, schema } : enonce (texte continu) sert aux descriptions du catalogue et aux anciens affichages ;
// presentation et schema sont utilisés par EnonceLisible et Visuel (SchemasC1.jsx).
export const presenter = ({ contexte, liste = [], question = '', schema = null }) => ({
  enonce: [contexte, liste.length ? liste.map(([a, b]) => (a ? `${a} : ${b}` : b)).join(' ; ') + '.' : '', question].filter(Boolean).join(' '),
  presentation: { contexte, liste, question },
  schema,
});
