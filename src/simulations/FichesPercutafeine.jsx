// Documents du dossier « Percutaféine » : notice, fiches techniques des matières premières (reproductions simplifiées).
// Sources : résumé des caractéristiques du produit (ANSM), documentation du fabricant du Carbopol 980 NF (Lubrizol), pages d'usage courant.
import { Feuille, Tableau } from './Fiches';
import SchemaFiolesClhp from './SchemaFiolesClhp';


const Liste = ({ items }) => <ul style={{ margin: '4px 0 6px', paddingLeft: 20 }}>{items.map((t, i) => <li key={i} style={{ marginBottom: 3 }}>{t}</li>)}</ul>;

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
    if (id === 'carbopol') return (
      <Feuille key={id} ouvert={ouvert} entete="Fiche technique" titre="Carbopol 980 NF" sous="Carbomère : polymère de l'acide acrylique réticulé" edition="remplace le Synthalène K du produit commercial">
        <Liste items={[
          'Poudre blanche, très légère. Gélifiant très efficace, donne des gels limpides, y compris hydroalcooliques.',
          <>Dispersion : verser la poudre <b>en pluie</b> dans le liquide en agitation (vortex), sans former de grumeaux. La dispersion est lente : prévoir 30 min à 1 h. Une légère élévation de température aide à la dissoudre.</>,
          <>Épaississement : en milieu acide le polymère est enroulé et la dispersion est fluide. La <b>neutralisation par une base</b> (amine, soude…) déroule les chaînes : le gel se forme. La viscosité est maximale pour un pH d'environ <b>6 à 7</b>.</>,
          'Après neutralisation, éviter une agitation forte et prolongée (perte de viscosité) et la formation de bulles : utiliser une agitation lente.',
          <>Spécification du fabricant (Lubrizol, édition du 27 octobre 2017) : <b>teneur en acide carboxylique de 58,0 à 63,0 %</b> (la valeur exacte dépend du lot ; masse molaire du groupe –COOH : 45,02 g/mol) ; perte à la dessiccation 7,0 % au plus ; pH d'une dispersion à 0,2 % compris entre 2,5 et 4,0 ; viscosité d'un mucilage à 0,2 %, neutralisé à pH 7,0 – 7,5 : de 1 500 à 50 000 cP.</>,
          'Exemples de formules du fabricant (gels hydroalcooliques) : de 0,5 % à 2,5 % de Carbopol 980 NF.',
        ]} />
      </Feuille>);
    if (id === 'synthalen') return (
      <Feuille key={id} ouvert={ouvert} entete="Fiche technique" titre="Synthalen K" sous="Carbomère du produit commercial : polymère carboxyvinylique, agent épaississant" edition="fabricant 3V, valeurs typiques">
        <Tableau lignes={[
          ['pH d\'une dispersion à 0,5 % dans l\'eau', '2,7 à 3,5'],
          ['Masse équivalente moyenne', 'environ 76 (en g de polymère par mole de groupes acide)'],
          ['Viscosité après neutralisation (Brookfield, 20 tr/min, 25 °C)', '0,2 % : 20 000 à 30 000 mPa·s ; 0,5 % : 40 000 à 60 000 mPa·s'],
          ['Taux d\'emploi habituel', '0,1 à 1,5 %, selon la formule et la viscosité voulue'],
        ]} />
        <Liste items={[
          'Disperser par addition lente de la poudre, sous agitation, jusqu\'à hydratation complète. Éviter l\'agitation turbulente, qui piège de l\'air.',
          'Neutralisation : pour amener 1 g de polymère à pH 7, il faut environ 0,01 équivalent de base (0,4 g de soude ou 1,5 g de trolamine).',
          'Éviter un fort cisaillement prolongé pendant et après la neutralisation : la perte de viscosité peut être définitive.',
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
      <Feuille key={id} ouvert={ouvert} entete="Mode opératoire · document 1" titre="Dosage de la caféine par CLHP, étalon interne" sous="Préparation des solutions · éluant acétonitrile / eau acidifiée 70/30, détection UV à 273 nm" edition="reproduction du sujet">
        <Liste items={[
          'Solution de référence (fiole 3) : prélever 100 µL de la fiole 1 (caféine ≈ 50 mg dans 50 mL d\'éluant) et 200 µL de la fiole 2 (benzoïne ≈ 100 mg dans 50 mL d\'éluant), compléter à 20 mL avec l\'éluant.',
          'Solution échantillon : dissoudre environ exactement m g de gel dans environ 30 mL d\'éluant, filtrer sur papier plissé dans une fiole jaugée de 50 mL, rincer le filtre avec 10 mL d\'éluant et compléter au trait : c\'est la fiole 4.',
          'Fiole 5 : prélever 100 µL de la fiole 4 et 200 µL de la fiole 2, compléter à 20 mL avec l\'éluant. C\'est la solution échantillon injectée.',
          'Exploitation : relever les aires des pics des fioles 3 et 5, puis calculer la concentration en caféine de l\'échantillon avec le rapport des aires caféine / benzoïne.',
        ]} />
        <SchemaFiolesClhp />
      </Feuille>);
    if (id === 'mo3') return (
      <Feuille key={id} ouvert={ouvert} entete="Mode opératoire · document 3" titre="Dosage de l'éthanol par CPG, étalon interne" sous="Préparation des solutions de référence et d'échantillon" edition="reproduction du sujet">
        <div style={{ fontWeight: 700 }}>Solution de référence (fiole jaugée de 20 mL)</div>
        <Liste items={['Introduire à la micropipette 500 µL d\'étalon interne et 250 µL d\'éthanol (étalon interne mis à disposition : propan-1-ol).', 'Compléter au trait de jauge avec de l\'eau, homogénéiser, injecter en CPG.']} />
        <div style={{ fontWeight: 700 }}>Solution échantillon (fiole jaugée de 20 mL)</div>
        <Liste items={['Dissoudre environ exactement m\' g de gel avec un peu d\'eau (peser directement dans la fiole), ajouter 500 µL d\'étalon interne, compléter au trait avec de l\'eau.', 'Facultatif, selon l\'allure de l\'échantillon : filtrer avant injection. Injecter en CPG.']} />
        <div style={{ color: '#475569' }}>Exploitation : relever les aires de pics de la référence et de l\'échantillon, puis calculer le volume d\'éthanol de l\'échantillon avec le rapport des aires éthanol / étalon interne.</div>
      </Feuille>);
    return null; })}</div>);
}
