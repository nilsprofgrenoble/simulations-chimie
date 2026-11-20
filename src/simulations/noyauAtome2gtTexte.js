// Texte SVG avec exposants nets : les chiffres en exposant Unicode (10⁻¹⁰) sont remplacés par un « 10 » suivi d'un petit texte décalé vers le haut
// (le zéro en exposant Unicode ressemble trop au signe « º »). À employer dans un élément <text> : {exp('≈ 10⁻¹⁰ m')}.
import { createElement as h } from 'react';
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '−' };
export function exp(s) {
  const parts = String(s).split(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/);
  return parts.map((p, i) => {
    if (i % 2 === 0) return p === '' ? null : p;
    return h('tspan', { key: i }, h('tspan', { dy: '-0.6em', fontSize: '70%' }, [...p].map(c => SUP[c]).join('')), h('tspan', { dy: '0.42em', fontSize: '100%' }, '​'));
  });
}
