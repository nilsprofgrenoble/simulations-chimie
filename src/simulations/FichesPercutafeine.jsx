// Documents du dossier « Percutaféine » : notice, fiches techniques des matières premières (reproductions simplifiées).
// Sources : résumé des caractéristiques du produit (ANSM), documentation du fabricant du Synthalen K (3V), pages d'usage courant.
import { Feuille, Tableau } from './Fiches';
import SchemaFiolesClhp from './SchemaFiolesClhp';


const Liste = ({ items }) => <ul style={{ margin: '4px 0 6px', paddingLeft: 20 }}>{items.map((t, i) => <li key={i} style={{ marginBottom: 3 }}>{t}</li>)}</ul>;

// Motif du polymère de l'acide acrylique (Synthalen K : chaînes réticulées entre elles) ; le groupe acide carboxylique –COOH est en orange.
export function FormuleCarbomere() {
  return (<figure data-carbomere style={{ margin: '10px 0', textAlign: 'center' }}>
    <svg viewBox="0 0 360 215" role="img" aria-label="Formule du motif du carbomère : chaîne carbonée portant un groupe acide carboxylique COOH sur un carbone sur deux" style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10 }}>
      <polyline points="10,100 80,66 150,100 220,66 290,100 350,70" fill="none" stroke="#1e293b" strokeWidth="2.4" strokeLinejoin="round" />
      {[150, 290].map(x => <g key={x}>
        <line x1={x} y1="100" x2={x} y2="134" stroke="#ea580c" strokeWidth="2.4" />
        <line x1={x - 3} y1="134" x2={x - 22} y2="152" stroke="#ea580c" strokeWidth="2.4" /><line x1={x - 8} y1="128" x2={x - 27} y2="146" stroke="#ea580c" strokeWidth="2.4" />
        <line x1={x + 3} y1="134" x2={x + 22} y2="152" stroke="#ea580c" strokeWidth="2.4" />
        <text x={x - 27} y="170" fontSize="17" fontWeight="700" fill="#ea580c" textAnchor="middle">O</text>
        <text x={x + 22} y="170" fontSize="17" fontWeight="700" fill="#ea580c" textAnchor="middle">OH</text></g>)}
      <path d="M62 50 H54 V178 H62" fill="none" stroke="#1e293b" strokeWidth="2" /><path d="M192 50 H200 V178 H192" fill="none" stroke="#1e293b" strokeWidth="2" />
      <text x="208" y="190" fontSize="15" fontStyle="italic" fill="#1e293b">n</text>
      <text x="150" y="200" fontSize="12" textAnchor="middle" fill="#9a3412">groupe –COOH</text>
      <text x="340" y="118" fontSize="11" textAnchor="end" fill="#475569">chaîne –CH₂–CH–</text>
    </svg>
    <figcaption style={{ fontSize: 13.5, color: '#475569' }}>Motif de l'acide polyacrylique : un groupe acide carboxylique (–COOH) sur un carbone de la chaîne sur deux. Dans le Synthalen K, ces chaînes sont réticulées entre elles ; neutraliser les COOH par une base les charge négativement : les chaînes se repoussent, se déroulent et le milieu épaissit.</figcaption>
  </figure>);
}
export default function FichesPercutafeine({ ids, ouvert = false }) {
  return (<div data-fiches>{ids.map(id => {
    if (id === 'notice') return (
      <Feuille key={id} ouvert={ouvert} entete="Notice ANSM" titre="PERCUTAFEINE, gel" sous="Résumé des caractéristiques du produit (extraits)" edition="Laboratoires Pierre Fabre">
        <Tableau lignes={[
          ['Forme', 'Gel lisse, légèrement opalescent'],
          ['Indication', 'Traitement symptomatique des surcharges adipeuses sous-cutanées localisées'],
          ['Substance active', 'Caféine : 5,000 g pour 100 g de gel'],
          ['Excipients', 'Carbomère (Synthalène K), trolamine, cocoate de macrogol 7 glycérol (Cethiol HE), éthanol à 96 pour cent, eau purifiée'],
          ['Éthanol (mise en garde)', '4 g d\'éthanol à 96 % pour une application de 10 g de gel'],
        ]} />
        <div style={{ fontWeight: 700, marginTop: 6 }}>Éthanol à 96 % contenu dans un tube (rubrique 4.4)</div>
        <Tableau tetes={['Tube', 'Éthanol à 96 %']} lignes={[['20 g', 'environ 8 g'], ['96 g', 'environ 38,5 g'], ['192 g', 'environ 77 g']]} />
        <div style={{ color: '#475569' }}>Les quantités des autres excipients ne sont pas indiquées.</div>
      </Feuille>);
    if (id === 'synthalen') return (
      <Feuille key={id} ouvert={ouvert} entete="Fiche technique" titre="Synthalen K" sous="Carbomère : polymère carboxyvinylique, agent épaississant" edition="fabricant 3V, valeurs typiques">
        <Tableau lignes={[
          ['pH d\'une dispersion à 0,5 % dans l\'eau', '2,7 à 3,5'],
          ['Teneur en groupes carboxyliques (COOH)', '56 à 68 % en masse (produit sec)'],
          ['Masse équivalente moyenne', 'environ 76 (en g de polymère par mole de groupes acide)'],
          ['Viscosité après neutralisation (Brookfield, 20 tr/min, 25 °C)', '0,2 % : 20 000 à 30 000 mPa·s ; 0,5 % : 40 000 à 60 000 mPa·s'],
          ['Taux d\'emploi habituel', '0,1 à 1,5 %, selon la formule et la viscosité voulue'],
        ]} />
        <FormuleCarbomere />
        <Liste items={[
          'Poudre blanche, très légère. Disperser par addition lente de la poudre, sous agitation, pour éviter les grumeaux, jusqu\'à ce que toutes les particules soient hydratées. Éviter l\'agitation turbulente, qui piège de l\'air difficile à éliminer ensuite.',
          'En milieu acide le polymère est enroulé et la dispersion est fluide ; la neutralisation par une base déroule les chaînes et forme le gel. D\'après la courbe viscosité en fonction du pH (figure 1 de la fiche), la viscosité monte fortement entre pH 3 et 6, puis reste sur un large plateau jusqu\'à pH 11 environ.',
          'Neutralisation : pour amener 1 g de polymère à pH 7, il faut environ 0,01 équivalent de base (0,4 g de soude ou 1,5 g de trolamine).',
          'Éviter un fort cisaillement prolongé pendant et après la neutralisation : la perte de viscosité peut être définitive. L\'ajout d\'électrolytes (sels, surtout de cations bi- ou trivalents) fait chuter la viscosité. Les UV dégradent le gel. Une base forte s\'ajoute pré-diluée dans l\'eau (10 % au maximum).',
        ]} />
      </Feuille>);
    if (id === 'trolamine') return (
      <Feuille key={id} ouvert={ouvert} entete="Fiche technique" titre="Trolamine (triéthanolamine)" sous="Amine tertiaire, base faible, liquide visqueux" edition="neutralisant du carbomère">
        <Tableau lignes={[['Rôle', 'Neutralise les groupes acide carboxylique du carbomère pour former le gel'], ['Couple acide/base', 'TEAH⁺ / TEA, pKa d\'environ 7,8'], ['Volatilité', 'Peu volatile (ébullition vers 335 °C) : reste dans l\'extrait sec'], ['Utilisation', 'À ajouter progressivement, sous agitation lente, en suivant le pH']]} />
      </Feuille>);
    if (id === 'cocoate') return (
      <Feuille key={id} ouvert={ouvert} entete="Fiche technique" titre="Cocoate de macrogol 7 glycérol (Cethiol HE)" sous="Ester d'acides gras de coco et de glycérol polyéthoxylé" edition="émollient, solubilisant">
        <Tableau lignes={[['Aspect', 'Liquide limpide à légèrement trouble, peu coloré'], ['Rôle', 'Émollient et agent solubilisant, adoucit le toucher du gel'], ['Solubilité', 'Soluble dans l\'eau et dans l\'éthanol'], ['Volatilité', 'Non volatil : reste dans l\'extrait sec'], ['Remarque du sujet', 'S\'il manque au laboratoire, il peut être remplacé par du glycérol']]} />
      </Feuille>);
    if (id === 'mo1') return (
      <Feuille key={id} ouvert={ouvert} entete="Mode opératoire · document 1" titre="Dosage de la caféine par CLHP" sous="Préparation des solutions · éluant acétonitrile / eau acidifiée 70/30, détection UV à 273 nm" edition="reproduction du sujet">
        <Liste items={[
          'Solution de référence (fiole 3) : prélever 100 µL de la fiole 1 (caféine ≈ 50 mg dans 50 mL d\'éluant) et 200 µL de la fiole 2 (benzoïne ≈ 100 mg dans 50 mL d\'éluant), compléter à 20 mL avec l\'éluant.',
          'Solution échantillon : dissoudre environ exactement m g de gel dans environ 30 mL d\'éluant, filtrer sur papier plissé dans une fiole jaugée de 50 mL, rincer le filtre avec 10 mL d\'éluant et compléter au trait : c\'est la fiole 4.',
          'Fiole 5 : prélever 100 µL de la fiole 4 et 200 µL de la fiole 2, compléter à 20 mL avec l\'éluant. C\'est la solution échantillon injectée.',
          'Exploitation, étalon interne : relever les aires des pics des fioles 3 et 5, puis calculer la concentration en caféine de l\'échantillon avec le rapport des aires caféine / benzoïne.',
          'Exploitation, étalonnage externe : seule l\'aire de la caféine est utilisée ; la benzoïne ajoutée ne gêne pas. On compare l\'aire de la fiole 5 à celles d\'une gamme de solutions de caféine préparées par dilution de la fiole 1.',
        ]} />
        <SchemaFiolesClhp />
      </Feuille>);
    if (id === 'mo3') return (
      <Feuille key={id} ouvert={ouvert} entete="Mode opératoire · document 3" titre="Dosage de l'éthanol par CPG, étalon interne" sous="Préparation des solutions de référence et d'échantillon" edition="reproduction du sujet">
        <div style={{ fontWeight: 700 }}>Solution de référence (fiole jaugée de 20 mL)</div>
        <Liste items={['Introduire à la micropipette 500 µL d\'étalon interne et 250 µL d\'éthanol (étalon interne mis à disposition : propan-1-ol ; s\'il ne convient pas, un autre alcool primaire peut le remplacer, avec le même mode opératoire).', 'Compléter au trait de jauge avec de l\'eau, homogénéiser, injecter en CPG.']} />
        <div style={{ fontWeight: 700 }}>Solution échantillon (fiole jaugée de 20 mL)</div>
        <Liste items={['Dissoudre environ exactement m\' g de gel avec un peu d\'eau (peser directement dans la fiole), ajouter 500 µL d\'étalon interne, compléter au trait avec de l\'eau.', 'Facultatif, selon l\'allure de l\'échantillon : filtrer avant injection. Injecter en CPG.']} />
        <div style={{ color: '#475569' }}>Exploitation : relever les aires de pics de la référence et de l\'échantillon, puis calculer le volume d\'éthanol de l\'échantillon avec le rapport des aires éthanol / étalon interne.</div>
      </Feuille>);
    return null; })}</div>);
}

// Schéma de la méthode des ajouts dosés (d'après la fiche mémo : fioles de même volume total, même prise d'échantillon, étalon croissant)
export function SchemaAjouts() {
  const fiole = (x, k, vet) => <g key={k}>
    <path d={`M${x + 10} 70 L${x + 10} 90 L${x - 6} 128 Q${x - 8} 140 ${x + 6} 140 L${x + 34} 140 Q${x + 48} 140 ${x + 46} 128 L${x + 30} 90 L${x + 30} 70`} fill="#e0f2fe" stroke="#475569" strokeWidth="1.5" />
    <rect x={x + 8} y="66" width="24" height="6" fill="#fff" stroke="#475569" />
    <path d={`M${x - 3} 118 L${x + 43} 118 L${x + 46} 128 Q${x + 48} 140 ${x + 34} 140 L${x + 6} 140 Q${x - 8} 140 ${x - 6} 128 Z`} fill="#bae6fd" />
    <line x1={x + 10} y1="82" x2={x + 30} y2="82" stroke="#475569" strokeWidth="1.5" /><text x={x + 20} y="78" textAnchor="middle" fontSize="9" fill="#475569">V<tspan fontSize="7" dy="2">tot</tspan></text>
    <text x={x + 20} y="156" textAnchor="middle" fontSize="10" fill="#0f172a">{k + 1}</text>
    <text x={x + 20} y="170" textAnchor="middle" fontSize="10" fill="#c2410c">V<tspan fontSize="8" dy="2">ét</tspan><tspan dy="-2"> = {vet}</tspan></text></g>;
  return (<svg viewBox="0 0 360 250" role="img" aria-label="Méthode des ajouts dosés : chaque fiole reçoit la même prise de solution d'échantillon et un volume croissant de solution étalon, puis est complétée au trait ; on trace I en fonction de la concentration ajoutée et on lit C échantillon = b / a." style={{ width: '100%', maxWidth: 520, display: 'block', margin: '8px auto', background: '#fff', borderRadius: 12, border: '1.5px solid #cbd5e1' }}>
    <text x="180" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">Méthode des ajouts dosés</text>
    <rect x="14" y="28" width="150" height="26" rx="6" fill="#dcfce7" stroke="#16a34a" /><text x="89" y="45" textAnchor="middle" fontSize="10.5" fill="#14532d">prise V<tspan fontSize="8" dy="2">éch</tspan><tspan dy="-2"> d'échantillon</tspan></text>
    <rect x="196" y="28" width="150" height="26" rx="6" fill="#ffedd5" stroke="#ea580c" /><text x="271" y="45" textAnchor="middle" fontSize="10.5" fill="#7c2d12">V<tspan fontSize="8" dy="2">ét</tspan><tspan dy="-2"> croissant d'étalon</tspan></text>
    {fiole(40, 0, '0')}{fiole(150, 1, 'Δ')}{fiole(260, 2, '2Δ')}
    <text x="180" y="196" textAnchor="middle" fontSize="10.5" fill="#0f172a">C<tspan fontSize="8" dy="2">étalon</tspan><tspan dy="-2"> = C</tspan><tspan fontSize="8" dy="2">ét</tspan><tspan dy="-2"> × V</tspan><tspan fontSize="8" dy="2">ét</tspan><tspan dy="-2"> / V</tspan><tspan fontSize="8" dy="2">tot</tspan><tspan dy="-2">     C</tspan><tspan fontSize="8" dy="2">éch</tspan><tspan dy="-2"> = C</tspan><tspan fontSize="8" dy="2">X</tspan><tspan dy="-2"> × V</tspan><tspan fontSize="8" dy="2">éch</tspan><tspan dy="-2"> / V</tspan><tspan fontSize="8" dy="2">tot</tspan></text>
    <text x="180" y="216" textAnchor="middle" fontSize="10.5" fill="#0f172a">On mesure I (ici l'absorbance A) : I = a × C<tspan fontSize="8" dy="2">étalon</tspan><tspan dy="-2"> + b</tspan></text>
    <text x="180" y="238" textAnchor="middle" fontSize="11" fontWeight="700" fill="#b45309">a = k et b = k × C<tspan fontSize="8" dy="2">éch</tspan><tspan dy="-2">, donc C</tspan><tspan fontSize="8" dy="2">éch</tspan><tspan dy="-2"> = b / a (ordonnée à l'origine ÷ pente)</tspan></text>
  </svg>);
}
