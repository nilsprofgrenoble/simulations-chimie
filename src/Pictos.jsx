// ═══════════════════════════════════════════════════════════════════════════
//  PICTOGRAMMES : un jeu d'icônes dessinées (trait fin arrondi, une touche de jaune) qui remplace les emojis.
//  Usage : <Pic n="compass"/>  ou  <Emo e="🧪"/> (convertit un emoji connu, sinon l'affiche tel quel).
//  Le sprite (<PictosSprite/>) est monté une fois dans App.jsx. Couleur du trait = couleur du texte (currentColor) ;
//  la touche d'accent se change avec la variable CSS --ia.
//  Pour ajouter une icône : ajouter une entrée dans ICONES (viewBox 24×24, classe "a" = remplissage d'accent) et, si besoin, dans EMOJIS.
// ═══════════════════════════════════════════════════════════════════════════
const C = (t) => t; // (lisibilité) marqueur de contenu SVG
const ICONES = {
  compass: C('<circle cx="12" cy="12" r="9"/><path class="a" d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z"/><path d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z"/>'),
  search: C('<circle class="a" cx="10.5" cy="10.5" r="6.5"/><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>'),
  target: C('<circle cx="12" cy="12" r="9"/><circle class="a" cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'),
  star: C('<path class="a" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
  tree: C('<path class="a" d="M12 3l6 8h-3.5l4 6H5.5l4-6H6z"/><path d="M12 3l6 8h-3.5l4 6H5.5l4-6H6zM12 17v4"/>'),
  medal: C('<circle class="a" cx="12" cy="14.5" r="5.5"/><circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 3l2 7M15.5 3l-2 7"/>'),
  board: C('<rect class="a" x="3" y="4" width="18" height="12" rx="2"/><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 9h6M7 12h4M9 20l3-4 3 4"/>'),
  wagon: C('<rect class="a" x="3.5" y="5" width="17" height="11" rx="2.5"/><rect x="3.5" y="5" width="17" height="11" rx="2.5"/><path d="M3.5 11h17M9 5v6M15 5v6"/><circle cx="8" cy="19" r="1.6"/><circle cx="16" cy="19" r="1.6"/>'),
  bolt: C('<path class="a" d="M13 2L5 13.5h6L10 22l9-12h-6z"/><path d="M13 2L5 13.5h6L10 22l9-12h-6z"/>'),
  users: C('<circle class="a" cx="9" cy="8" r="3.2"/><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.3"/><path d="M16.5 14c2.8 0 4.5 2 4.5 5"/>'),
  mail: C('<rect class="a" x="3" y="5" width="18" height="14" rx="2.5"/><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7.5l8.5 6 8.5-6"/>'),
  flask: C('<path class="a" d="M7.3 15h9.4l2.7 4.2a1.4 1.4 0 0 1-1.2 2.1H5.8a1.4 1.4 0 0 1-1.2-2.1z"/><path d="M9 3h6M10 3v6.3L4.6 19a1.6 1.6 0 0 0 1.4 2.3h12a1.6 1.6 0 0 0 1.4-2.3L14 9.3V3"/>'),
  atom: C('<circle class="a" cx="12" cy="12" r="2.2"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)"/>'),
  drop: C('<path class="a" d="M12 3c4 5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2-6 6-11z"/><path d="M12 3c4 5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2-6 6-11z"/><path d="M9 15a3 3 0 0 0 3 3"/>'),
  hex: C('<path class="a" d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><circle cx="12" cy="12" r="3"/>'),
  bulb: C('<path class="a" d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3zM9.5 18.5h5M10.5 21h3"/>'),
  arrow: C('<path class="a" d="M4 9h11V6l6 6-6 6v-3H4z"/><path d="M4 9h11V6l6 6-6 6v-3H4z"/>'),
  globe: C('<circle class="a" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>'),
  rocket: C('<path class="a" d="M12 2c3 3 4 7 3 12H9c-1-5 0-9 3-12z"/><path d="M12 2c3 3 4 7 3 12H9c-1-5 0-9 3-12zM9 14l-3.5 3.5 3.5.7M15 14l3.5 3.5-3.5.7M12 17v4"/><circle cx="12" cy="8.5" r="1.4"/>'),
  gauge: C('<path class="a" d="M4 17a8 8 0 1 1 16 0z"/><path d="M4 17a8 8 0 1 1 16 0M12 17l4-5"/><circle cx="12" cy="17" r="1.2" fill="currentColor"/>'),
  thermo: C('<path class="a" d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0zM12 9v7"/>'),
  wave: C('<path class="a" d="M2 12q2.5-9 5 0t5 0 5 0 5 0v6H2z" opacity=".5"/><path d="M2 12q2.5-9 5 0t5 0 5 0 5 0"/>'),
  flame: C('<path class="a" d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>'),
  circuit: C('<path d="M2 12h5l2-5 3 10 3-10 2 5h5"/><circle class="a" cx="2.5" cy="12" r="1.6"/><circle class="a" cx="21.5" cy="12" r="1.6"/>'),
  user: C('<circle class="a" cx="12" cy="8" r="4"/><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
  spectrum: C('<path d="M3 20h18M6 20c.5-8 1-13 2-13s1.5 5 2 13M13 20c.5-5 .8-9 1.5-9s1 4 1.5 9"/>'),
  link: C('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  // ── autres
  testtube: C('<path class="a" d="M10 11h4v6a2 2 0 0 1-4 0z"/><path d="M8.5 3h7M10 3v14a2 2 0 0 0 4 0V3"/>'),
  pill: C('<g transform="rotate(-45 12 12)"><rect class="a" x="3" y="8" width="9" height="8" rx="4"/><rect x="3" y="8" width="18" height="8" rx="4"/><path d="M12 8v8"/></g>'),
  gear: C('<circle class="a" cx="12" cy="12" r="3.2"/><path d="M12 2.8l1.6 2.2 2.7-.6.9 2.6 2.6.9-.6 2.7L21.4 12l-2.2 1.6.6 2.7-2.6.9-.9 2.6-2.7-.6L12 21.2l-1.6-2.2-2.7.6-.9-2.6-2.6-.9.6-2.7L2.6 12l2.2-1.6-.6-2.7 2.6-.9.9-2.6 2.7.6z"/><circle cx="12" cy="12" r="3.2"/>'),
  chartup: C('<path d="M3 3v18h18"/><path class="a" d="M7 15l4-4 3 3 6-7v11H7z" opacity=".55"/><path d="M7 15l4-4 3 3 6-7"/>'),
  chartdown: C('<path d="M3 3v18h18"/><path class="a" d="M7 8l4 4 3-3 6 7v2H7z" opacity=".55"/><path d="M7 8l4 4 3-3 6 7"/>'),
  bars: C('<path d="M3 21h18"/><rect class="a" x="5" y="11" width="3.5" height="10"/><rect x="5" y="11" width="3.5" height="10"/><rect x="10.3" y="6" width="3.5" height="15"/><rect class="a" x="15.5" y="14" width="3.5" height="7"/><rect x="15.5" y="14" width="3.5" height="7"/>'),
  snow: C('<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9.5 4L12 6.5 14.5 4M9.5 20l2.5-2.5 2.5 2.5"/><circle class="a" cx="12" cy="12" r="2"/>'),
  ruler: C('<path class="a" d="M4 20V4l16 16z"/><path d="M4 20V4l16 16zM4 9h3M4 14h4M9 20v-3"/>'),
  syringe: C('<path class="a" d="M11.5 7.5l5 5-8 8H4v-4.5z"/><path d="M14 5l5 5M11.5 7.5l5 5-8 8H4v-4.5zM4 20l-1.5 1.5M16 3l5 5"/>'),
  magnet: C('<path class="a" d="M5 3h4.5v5H5zM14.5 3H19v5h-4.5z"/><path d="M5 3v9a7 7 0 0 0 14 0V3h-4.5v9a2.5 2.5 0 0 1-5 0V3z"/>'),
  palette: C('<path class="a" d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2.5 1.5-2.5H17a4 4 0 0 0 4-4C21 7 17 3 12 3z"/><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2.5 1.5-2.5H17a4 4 0 0 0 4-4C21 7 17 3 12 3z"/><circle cx="8" cy="11" r="1.1" fill="currentColor"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor"/><circle cx="16" cy="10" r="1.1" fill="currentColor"/>'),
  signal: C('<path d="M12 21v-9"/><circle class="a" cx="12" cy="10" r="2"/><path d="M7.5 14.5a6.4 6.4 0 0 1 0-9M16.5 5.5a6.4 6.4 0 0 1 0 9M4.5 17.5a10.6 10.6 0 0 1 0-15M19.5 2.5a10.6 10.6 0 0 1 0 15"/>'),
  tap: C('<path d="M3 9h9a4 4 0 0 1 4 4v1M7 9V6M4 6h6"/><path class="a" d="M16 17c1.5 2 2 3 2 4a2 2 0 0 1-4 0c0-1 .5-2 2-4z"/><path d="M16 17c1.5 2 2 3 2 4a2 2 0 0 1-4 0c0-1 .5-2 2-4z"/>'),
  scale: C('<path d="M12 4v16M7 20h10M3 8h18"/><path class="a" d="M5 8l-2.5 6a3 3 0 0 0 5 0z"/><path d="M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0z"/>'),
  drops: C('<path class="a" d="M8 4c2.3 3 3.5 4.3 3.5 6.3a3.5 3.5 0 0 1-7 0C4.5 8.3 5.7 7 8 4z"/><path d="M8 4c2.3 3 3.5 4.3 3.5 6.3a3.5 3.5 0 0 1-7 0C4.5 8.3 5.7 7 8 4zM16.5 10c2 2.6 3 3.7 3 5.4a3 3 0 0 1-6 0c0-1.7 1-2.8 3-5.4z"/>'),
  cube: C('<path class="a" d="M12 3l8 4.5-8 4.5-8-4.5z"/><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/>'),
  bricks: C('<rect class="a" x="3" y="5" width="18" height="14" rx="1.5" opacity=".6"/><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 9.7v4.6M9 14.3V19M15 14.3V19"/>'),
  kettle: C('<path class="a" d="M6 11h11v7a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z"/><path d="M6 11h11v7a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3zM9 11V8a3 3 0 0 1 6 0v3M17 13h1a2.5 2.5 0 0 1 0 5h-1M6 13H4"/>'),
  stopwatch: C('<circle class="a" cx="12" cy="13.5" r="7.5"/><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9M9.5 2.5h5M12 2.5v3M18.5 7l1.5-1.5"/>'),
  microscope: C('<path d="M7 21h11M10 21v-3M9 3l4 1.5-2 5-4-1.5z"/><path class="a" d="M9 3l4 1.5-2 5-4-1.5z"/><path d="M12.5 9.5a5.5 5.5 0 0 1 2 10.5"/>'),
  laptop: C('<rect class="a" x="5" y="5" width="14" height="10" rx="1.5"/><rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2.5 19h19"/>'),
  moon: C('<path class="a" d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
  hand: C('<path class="a" d="M8 21v-6l-3-3a1.5 1.5 0 0 1 2.2-2L9 11V5.5a1.4 1.4 0 0 1 2.8 0V9l.2-5a1.4 1.4 0 0 1 2.8 0v5.5l.3-3a1.4 1.4 0 0 1 2.8 0V13c0 4-2 8-5.5 8z" opacity=".55"/><path d="M8 21v-6l-3-3a1.5 1.5 0 0 1 2.2-2L9 11V5.5a1.4 1.4 0 0 1 2.8 0V9M11.8 4a1.4 1.4 0 0 1 2.8 0v5M14.6 5.5a1.4 1.4 0 0 1 2.8 0V13c0 4-2 8-5.5 8H8"/>'),
  puzzle: C('<path class="a" d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z" opacity=".6"/><path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z"/>'),
  salt: C('<path class="a" d="M7.5 10h9l1 9a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2z"/><path d="M7.5 10h9l1 9a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2zM9 10V8a3 3 0 0 1 6 0v2"/><circle cx="11" cy="6.5" r=".7" fill="currentColor"/><circle cx="13" cy="6.5" r=".7" fill="currentColor"/>'),
  bottle: C('<path d="M10 3h4v3l2 3v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9l2-3z"/><rect class="a" x="8.5" y="12" width="7" height="5"/>'),
  torch: C('<path class="a" d="M9 7h6l-1 3H10z"/><path d="M9 2h6v5l1.5 3H7.5L9 7zM10 10v11h4V10"/>'),
  satellite: C('<g transform="rotate(45 12 12)"><rect class="a" x="9.5" y="8" width="5" height="8" rx="1"/><rect x="9.5" y="8" width="5" height="8" rx="1"/><path d="M9.5 12H7M14.5 12H17"/><rect x="2.5" y="9" width="4.5" height="6"/><rect x="17" y="9" width="4.5" height="6"/></g>'),
  plug: C('<path d="M9 2v5M15 2v5"/><path class="a" d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>'),
  battery: C('<rect class="a" x="4" y="8" width="5" height="8"/><rect x="3" y="7" width="15" height="10" rx="2"/><path d="M18 10.5h3v3h-3"/>'),
  diamond: C('<path class="a" d="M12 3l8 9H4z"/><path d="M12 3l8 9-8 9-8-9zM4 12h16"/>'),
  dna: C('<path d="M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12"/><path class="a" d="M8.4 7h7.2M8.4 17h7.2" stroke="#ffc857" stroke-width="2.4"/>'),
  abacus: C('<rect class="a" x="3" y="4" width="18" height="16" rx="2" opacity=".5"/><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.3h18M3 14.7h18"/><circle cx="8" cy="6.6" r="1.1" fill="currentColor"/><circle cx="13" cy="12" r="1.1" fill="currentColor"/><circle cx="9" cy="17.3" r="1.1" fill="currentColor"/>'),
  dumbbell: C('<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/><rect class="a" x="6" y="7" width="1" height="10"/>'),
  info: C('<circle class="a" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".6" fill="currentColor"/>'),
  pin: C('<path class="a" d="M8.5 3h7l-1 6 3 4h-12l3-4z"/><path d="M8.5 3h7l-1 6 3 4h-12l3-4zM12 13v8"/>'),
  home: C('<path class="a" d="M5 10v10h5v-6h4v6h5V10l-7-6z" opacity=".6"/><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>'),
  key: C('<circle class="a" cx="8" cy="15" r="4"/><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>'),
  lock: C('<rect class="a" x="5" y="11" width="14" height="10" rx="2"/><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  clipboard: C('<rect class="a" x="6" y="4" width="12" height="17" rx="2"/><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>'),
  book: C('<path class="a" d="M12 7c-1.5-2-4-3-8-3v14c4 0 6.5 1 8 3z" opacity=".6"/><path d="M12 7c-1.5-2-4-3-8-3v14c4 0 6.5 1 8 3 1.5-2 4-3 8-3V4c-4 0-6.5 1-8 3zM12 7v14"/>'),
  trophy: C('<path class="a" d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8"/>'),
  ok: C('<circle class="a" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'),
  ko: C('<circle class="a" cx="12" cy="12" r="9" opacity=".6"/><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
  warn: C('<path class="a" d="M12 3.5L21.5 20h-19z"/><path d="M12 3.5L21.5 20h-19zM12 10v5"/><circle cx="12" cy="17.4" r=".6" fill="currentColor"/>'),
  party: C('<path class="a" d="M4 21l4-11 7 7z"/><path d="M4 21l4-11 7 7zM13 5v2M18 6l-1.5 1.5M20 12h-2M15 3l.5 1.5"/>'),
  refresh: C('<path d="M20 11a8 8 0 0 0-14-4M4 5v4h4M4 13a8 8 0 0 0 14 4M20 19v-4h-4"/>'),
  trash: C('<path d="M4 7h16M9 7V4h6v3"/><path class="a" d="M6 7l1 14h10l1-14z" opacity=".6"/><path d="M6 7l1 14h10l1-14M10 11v6M14 11v6"/>'),
  plus: C('<path d="M12 5v14M5 12h14"/>'),
  eye: C('<path class="a" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" opacity=".6"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  chevron: C('<path d="M6 9l6 6 6-6"/>'),
};
// Emoji → pictogramme. Les emojis absents de cette table restent affichés tels quels (migration progressive).
const EMOJIS = {
  '⚗': 'flask', '🧪': 'testtube', '💊': 'pill', '⚡': 'bolt', '🔵': 'drop', '⚙': 'gear', '📈': 'chartup', '❄': 'snow', '💡': 'bulb', '📊': 'bars',
  '🌈': 'spectrum', '📐': 'ruler', '💉': 'syringe', '🔥': 'flame', '🧲': 'magnet', '🎨': 'palette', '📡': 'signal', '🎯': 'target', '🚰': 'tap',
  '🌊': 'wave', '⚖': 'scale', '💦': 'drops', '🧊': 'cube', '🧱': 'bricks', '🫖': 'kettle', '⏱': 'stopwatch', '📉': 'chartdown', '🔬': 'microscope',
  '💻': 'laptop', '🧭': 'compass', '🌍': 'globe', '🌙': 'moon', '🧤': 'hand', '🚀': 'rocket', '🚃': 'wagon', '⚛': 'atom', '🧩': 'puzzle', '➡': 'arrow',
  '🧂': 'salt', '💧': 'drop', '🧴': 'bottle', '🔦': 'torch', '🔍': 'search', '🛰': 'satellite', '🔌': 'plug', '🌡': 'thermo', '🔋': 'battery',
  '🔷': 'diamond', '🧬': 'dna', '🧮': 'abacus', '🏋': 'dumbbell', '👧👦': 'users', 'ℹ': 'info', '📌': 'pin', '🔗': 'link', '🏠': 'home', '🔑': 'key',
  '🔒': 'lock', '📋': 'clipboard', '📘': 'book', '📚': 'book', '🏆': 'trophy', '✅': 'ok', '❌': 'ko', '⚠': 'warn', '🎉': 'party', '🔄': 'refresh',
  '🗑': 'trash', '➕': 'plus', '👁': 'eye', '🌳': 'tree', '🏅': 'medal', '👩‍🏫': 'board', '✉': 'mail', '🤝': 'users', '★': 'star',
};
const normaliser = (e) => String(e).replace(/️/g, '');

export function PictosSprite() {
  const html = '<style>.ic{fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none;--ia:#ffc857}'
    + '.ic-t{width:1.15em;height:1.15em;vertical-align:-.22em;margin-right:.3em}symbol .a{fill:var(--ia,#ffc857);stroke:none}</style><defs>'
    + Object.entries(ICONES).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') + '</defs>';
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: html }}/>;
}

// Pictogramme par nom. `t` : taille en pixels ; sans `t`, il s'adapte à la taille du texte (utile dans un libellé de bouton).
export function Pic({ n, t, style }) {
  if (!ICONES[n]) return null;
  return <svg className={t ? 'ic' : 'ic ic-t'} width={t} height={t} style={style} aria-hidden="true" focusable="false"><use href={`#i-${n}`}/></svg>;
}

// Pictogramme pour un emoji connu (sinon l'emoji lui-même).
export function Emo({ e, t, style }) {
  const nom = EMOJIS[normaliser(e)];
  return nom ? <Pic n={nom} t={t} style={style}/> : <>{e}</>;
}
export const nomPicto = (e) => EMOJIS[normaliser(e)] || null;

// Texte commençant par un emoji (ex. libellé de chapitre « ⚛️ Modéliser… ») : l'emoji connu devient un pictogramme.
export function AvecPicto({ texte }) {
  const m = /^([^\p{L}\p{N}\s]+)\s+([\s\S]+)$/u.exec(texte || '');
  return m && nomPicto(m[1]) ? <><Pic n={nomPicto(m[1])}/>{m[2]}</> : <>{texte}</>;
}
