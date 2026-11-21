// Tests de la couche pure de la lecture sonore : node src/lectureSonore.test.mjs
import { prononcer, decouperPhrases, choisirVoix, creerLecteur, lectureActivee } from './lectureSonore.js';

let echecs = 0;
const verifier = (nom, obtenu, attendu) => {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (!ok) { echecs++; console.log(`✗ ${nom}\n   obtenu : ${JSON.stringify(obtenu)}\n   attendu: ${JSON.stringify(attendu)}`); }
};
const contient = (nom, texte, morceau) => { if (!texte.includes(morceau)) { echecs++; console.log(`✗ ${nom}\n   « ${texte} » ne contient pas « ${morceau} »`); } };

// Puissances de dix et unités
contient('puissance de dix', prononcer('1,26 × 10⁻³ mol'), '1,26 fois dix puissance moins 3 mole');
verifier('mol·L⁻¹', prononcer('0,10 mol·L⁻¹'), '0,10 mole par litre');
verifier('g·mol⁻¹', prononcer('M = 249,68 g·mol⁻¹'), 'M égale 249,68 gramme par mole');
verifier('g/mol', prononcer('249,68 g/mol'), '249,68 gramme par mole');
verifier('J·g⁻¹·°C⁻¹', prononcer('4,18 J·g⁻¹·°C⁻¹'), '4,18 joule par gramme et par degré Celsius');
verifier('pluriel après un nombre', prononcer('Un bécher contient 100 mL, soit 5,0 mmol.'), 'Un bécher contient 100 millilitres, soit 5,0 millimoles.');
verifier('singulier sous 2', prononcer('on verse 1,0 mL'), 'on verse 1,0 millilitre');
verifier('°C et %', prononcer('à 25 °C, soit 12 %'), 'à 25 degrés Celsius, soit 12 pour cent');
verifier('m/s', prononcer('v = 3 m/s'), 'v égale 3 mètre par seconde');
// Formules
verifier('H2O', prononcer('de l’eau H2O'), "de l'eau H 2 O");
verifier('CO2', prononcer('le CO2 dissous'), 'le C O 2 dissous');
verifier('H₃O⁺', prononcer('les ions H₃O⁺ réagissent'), 'les ions H 3 O plus réagissent');
verifier('C₂H₅COOH', prononcer('l’acide C₂H₅COOH'), "l'acide C 2 H 5 C O O H");
verifier('charge double', prononcer('SO₄²⁻'), 'S O 4 2 moins');
verifier('Cu²⁺', prononcer('ions Cu²⁺ en solution'), 'ions C u 2 plus en solution');
verifier('formule entre parenthèses', prononcer('n(C₂H₅COO⁻) = 4,0 mmol'), 'n, C 2 H 5 C O O moins, égale 4,0 millimoles');
verifier('Ca(OH)₂', prononcer('Ca(OH)₂'), 'C a O H 2');
verifier('mots ordinaires intacts', prononcer('Le tampon On ajoute Si possible'), 'Le tampon On ajoute Si possible');
verifier('pH et pKa', prononcer('pH = 4,9 et pKa = 4,9'), 'p H égale 4,9 et p K a égale 4,9');
// Flèches de réaction
verifier('flèche', prononcer('H₃O⁺ + C₂H₅COO⁻ → C₂H₅COOH + H₂O'), 'H 3 O plus plus C 2 H 5 C O O moins donne C 2 H 5 C O O H plus H 2 O');
verifier('équilibre', prononcer('A ⇌ B'), 'A en équilibre avec B');
// Formule MathML remplacée
verifier('formule affichée', prononcer('On utilise \uE000 pour calculer.'), "On utilise formule affichée à l'écran pour calculer.");
// Découpage
const texte = 'Un bécher contient 100 mL d’eau pure, de pH égal à 7,0. On y verse 1,0 mL d’acide ! Quelle valeur ?';
const ph = decouperPhrases(texte);
verifier('3 phrases', ph.length, 3);
verifier('position fidèle', ph.map(p => texte.slice(p.debut, p.fin) === p.texte), [true, true, true]);
verifier('décimale non coupée', ph[0].texte.endsWith('7,0.'), true);
const long = 'Mot, '.repeat(120).trim();
const morceaux = decouperPhrases(long, 200);
verifier('texte long coupé', morceaux.length > 1 && morceaux.every(m => m.texte.length <= 200), true);
verifier('formule seule gardée', decouperPhrases('Avant. \uE000').length, 2);
// Voix : seules les voix françaises LOCALES comptent
const voix = [
  { name: 'Microsoft Denise Online (Natural) - French (France)', lang: 'fr-FR', localService: false },
  { name: 'Google français', lang: 'fr-FR', localService: false },
  { name: 'Microsoft Hortense - French (France)', lang: 'fr-FR', localService: true },
  { name: 'Thomas', lang: 'fr-FR', localService: true },
  { name: 'Alex', lang: 'en-US', localService: true },
];
verifier('voix locale choisie', choisirVoix(voix).name, 'Thomas');
verifier('aucune voix locale', choisirVoix(voix.filter(v => !v.localService)), null);
// Niveaux
verifier('TSTL activé (phase test)', lectureActivee(141, { 141: 'TSTL' }, [141]), true);
verifier('autre sim TSTL hors test', lectureActivee(5, { 5: 'TSTL' }, [141]), false);
verifier('phase test terminée', lectureActivee(5, { 5: 'TSTL' }, null), true);
verifier('BTS', lectureActivee(7, { 7: 'BTS ' }, null), true);
verifier('1G jamais', lectureActivee(10, { 10: '1G' }, null), false);
verifier('2GT jamais', lectureActivee(56, { 56: '2GT' }, null), false);

// File d'attente : le bogue classique (cancel() déclenche « end » et relance la lecture)
class FauxUtterance { constructor(t) { this.text = t; } }
const journal = [];
let courante = null;
const synth = {
  speak(u) { courante = u; journal.push(u.text); },
  cancel() { const u = courante; courante = null; if (u && u.onend) u.onend(); },   // comportement réel : « end » après cancel
};
const finir = () => { const u = courante; courante = null; if (u && u.onend) u.onend(); };
let phrases = [], fin = false;
const l = creerLecteur({ synth, Utterance: FauxUtterance, phrases: ['un', 'deux', 'trois'].map(parle => ({ parle })), onFin: () => { fin = true; }, attendre: fn => fn() });
l.demarrer();
verifier('lecture démarrée', journal, ['un']);
finir();
verifier('phrase suivante', journal, ['un', 'deux']);
l.pause();
verifier('pause : rien ne repart seul', journal, ['un', 'deux']);
l.reprendre();
verifier('reprise sur la même phrase', journal, ['un', 'deux', 'deux']);
l.arreter();
verifier('arrêt : rien ne repart seul', [journal.length, l.etat()], [3, 'arret']);
l.demarrer(); finir(); finir(); finir();
verifier('lecture jusqu’au bout', [fin, l.etat()], [true, 'arret']);

if (echecs) { console.log(`${echecs} échec(s)`); process.exit(1); }
console.log('lectureSonore : tous les tests passent');
