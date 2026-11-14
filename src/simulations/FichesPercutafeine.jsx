// Documents du dossier « Percutaféine » : notice, fiches techniques des matières premières (reproductions simplifiées).
// Sources : résumé des caractéristiques du produit (ANSM), documentation du fabricant du Carbopol 980 NF (Lubrizol), pages d'usage courant.
import { Feuille, Tableau } from './Fiches';


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
          <>Teneur en groupes acide carboxylique (–COOH) : <b>de 56 à 68 % en masse</b> (spécification de la monographie des carbomères), la valeur exacte dépend du lot. Masse molaire du groupe –COOH : 45,02 g/mol.</>,
          'Exemples de formules du fabricant (gels hydroalcooliques) : de 0,5 % à 2,5 % de Carbopol 980 NF.',
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
      <Feuille key={id} ouvert={ouvert} entete="Mode opératoire · document 1" titre="Dosage de la caféine par CLHP, étalon interne" sous="Préparation des solutions" edition="reproduction simplifiée du sujet">
        <Liste items={[
          'Solution de référence : dans une fiole jaugée, introduire des volumes connus de solution étalon de caféine et d\'étalon interne, compléter au trait de jauge avec l\'éluant.',
          'Solution échantillon : peser avec précision une masse m de gel dans la fiole jaugée, ajouter le même volume d\'étalon interne, dissoudre dans l\'éluant, compléter au trait de jauge.',
          'Filtrer chaque solution sur filtre de 0,45 µm avant injection.',
          'Calculer la masse de gel à peser pour que la caféine soit au même niveau de concentration que dans la référence.',
        ]} />
      </Feuille>);
    if (id === 'mo2') return (
      <Feuille key={id} ouvert={ouvert} entete="Mode opératoire · document 2" titre="Injecter en CLHP" sous="Colonne C18, détection UV à 273 nm" edition="reproduction simplifiée du sujet">
        <Liste items={[
          'Mettre en route la pompe et laisser l\'éluant circuler jusqu\'à stabilisation de la ligne de base (environ 10 min).',
          'Rincer la seringue avec la solution à injecter, puis prélever sans bulle d\'air.',
          'Placer la vanne en position « charge », injecter dans la boucle, puis basculer en position « injection » : le chromatogramme démarre.',
          'Après chaque injection, rincer la boucle et la seringue. Ne jamais injecter une solution non filtrée.',
        ]} />
      </Feuille>);
    if (id === 'mo3') return (
      <Feuille key={id} ouvert={ouvert} entete="Mode opératoire · document 3" titre="Dosage de l'éthanol par CPG, étalon interne" sous="Colonne polaire, four à 70 °C, analyse de 3 minutes" edition="reproduction simplifiée du sujet">
        <div style={{ fontWeight: 700 }}>Solution de référence (fiole jaugée de 20 mL)</div>
        <Liste items={['Introduire à la micropipette 500 µL d\'étalon interne (propan-1-ol) et 250 µL d\'éthanol.', 'Compléter au trait de jauge avec de l\'eau distillée, homogénéiser.']} />
        <div style={{ fontWeight: 700 }}>Solution échantillon (fiole jaugée de 20 mL)</div>
        <Liste items={['Peser avec précision une masse m\' de gel, introduire 500 µL d\'étalon interne, compléter avec de l\'eau, homogénéiser.', 'Injecter environ 0,1 µL de chaque solution (microseringue, injecteur à 200 °C).']} />
        <div style={{ color: '#475569' }}>Exploitation : comparer les aires de l'éthanol et de l'étalon interne dans la référence puis dans l'échantillon.</div>
      </Feuille>);
    if (id === 'mo4') return (
      <Feuille key={id} ouvert={ouvert} entete="Mode opératoire · document 4" titre="Utiliser une micropipette" sous="Prélèvement de petits volumes" edition="reproduction simplifiée du sujet">
        <Liste items={[
          'Régler le volume avec la molette, dans la plage de la pipette (par exemple 100 à 1 000 µL) : ne jamais sortir de cette plage.',
          'Placer un embout neuf. Enfoncer le piston jusqu\'au premier cran, plonger l\'embout de quelques millimètres, relâcher lentement.',
          'Distribuer en enfonçant jusqu\'au premier cran, puis jusqu\'au second pour vider l\'embout. Changer d\'embout entre deux liquides.',
          'L\'erreur relative augmente quand le volume prélevé est petit devant le volume maximal de la pipette.',
        ]} />
      </Feuille>);
    return null; })}</div>);
}
