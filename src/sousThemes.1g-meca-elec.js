// ═══════════════════════════════════════════════════════════════════════════
//  SOUS-THÈMES des chapitres de 1re spécialité « Mouvement et interactions » et « L'énergie : conversions et transferts » :
//  1g-champ, 1g-fluide, 1g-electricite, 1g-energie-meca, 1g-mouvement.
//  Même structure que SOUS_THEMES (voir sousThemes.js) ; à intégrer dans SOUS_THEMES.
//  Les chapitres 1g-energie-meca et 1g-mouvement partagent le thème « Mécanique » : chacun écarte par « hors » (chapitres.js) les exercices de l'autre.
//  Une capacité exigible du programme = un sous-thème (texte du programme reformulé au plus près).
// ═══════════════════════════════════════════════════════════════════════════
export default {
  // ── Interactions fondamentales et introduction à la notion de champ ──
  '1g-champ': [
    { id: 'electrostatique', nom: 'Charges et interaction électrostatique', capacite: 'Interpréter des expériences mettant en jeu l’interaction électrostatique : signe des charges, attraction, répulsion, influence électrostatique.',
      refs: ['37:prevoir:ch-signes', '37:prevoir:ch-influence-papier', '37:prevoir:ch-pendule-contact'] },
    { id: 'coulomb', nom: 'La loi de Coulomb', capacite: 'Utiliser la loi de Coulomb : F = k·|q₁·q₂| / d², pour calculer une force ou prévoir l’effet d’un changement de charge.',
      refs: ['34:electro.0', '37:relation:ch-coulomb', '37:prevoir:ch-q-double', '77:plausible:coulomb-cm', '36:interactions'] },
    { id: 'gravitation', nom: 'La loi de la gravitation universelle', capacite: 'Utiliser la loi de gravitation F = G·m₁·m₂ / d² et l’expression vectorielle de la force de gravitation ; interaction réciproque.',
      refs: ['34:gravi.0', '37:relation:ch-grav', '37:hypothese:ch-hyp-newton', '37:prevoir:ch-d-double', '37:prevoir:ch-m-double', '37:prevoir:ch-reaction', '77:plausible:gravitation-eleves'] },
    { id: 'analogie', nom: 'Coulomb et gravitation : des lois analogues', capacite: 'Citer les analogies entre la loi de Coulomb et la loi d’interaction gravitationnelle (et leurs différences).',
      refs: ['37:prevoir:ch-analogie-formes', '77:plausible:ch-val-grav-electrons'] },
    { id: 'champ-g', nom: 'Le champ de gravitation et le poids', capacite: 'Utiliser l’expression du champ de gravitation g = G·M / d² : valeur du champ à une distance donnée, poids d’un objet sur un astre.',
      refs: ['34:gravi.1', '37:relation:ch-champ-g', '37:prevoir:ch-altitude', '37:prevoir:ch-masse-poids', '35:poids-planete', '77:plausible:poids-lune'] },
    { id: 'champ-e', nom: 'Le champ électrostatique et la force électrique', capacite: 'Utiliser l’expression de la force électrostatique dans un champ, F = q·E : valeur et sens selon le signe de la charge.',
      refs: ['34:electro.1', '37:relation:ch-force-champ', '35:force-champ', '37:champ:champ-force-neg', '37:champ:champ-force-pos'] },
    { id: 'lignes', nom: 'Les lignes de champ', capacite: 'Caractériser localement une ligne de champ électrostatique ou de champ de gravitation : sens, forme, champ uniforme, lignes resserrées là où le champ est intense.',
      refs: ['37:champ:lignes-sortantes', '37:champ:lignes-entrantes', '37:champ:champ-uniforme', '37:champ:champ-intensite'] },
  ],
  // ── Description d'un fluide au repos ──
  '1g-fluide': [
    { id: 'micro', nom: 'Du microscopique au macroscopique', capacite: 'Expliquer qualitativement le lien entre les grandeurs macroscopiques de description d’un fluide (masse volumique, pression, température) et le comportement microscopique de ses entités.',
      refs: ['37:prevoir:fl1g-pression-ana-chauffe', '37:prevoir:fl1g-pression-ana-pneu', '37:prevoir:fl1g-micro-masse-volumique', '37:prevoir:fl1g-micro-temperature', '77:plausible:fl1g-micro-val-masse-volumique-air'] },
    { id: 'force-pressante', nom: 'La force pressante F = P × S', capacite: 'Exploiter la relation F = P·S pour déterminer la force pressante exercée par un fluide sur une surface plane.',
      refs: ['34:fl1g-pression-sapp-piston', '37:prevoir:fl1g-pression-ana-surface', '37:prevoir:fl1g-pression-ana-laterale', '77:plausible:fl1g-pression-val-force-ongle', '77:plausible:fl1g-pression-val-force-pompe', '77:plausible:fl1g-pression-val-pneu-vtt', '36:fl1g-pression-calcul'] },
    { id: 'mariotte', nom: 'La loi de Mariotte', capacite: 'Utiliser la loi de Mariotte, P × V = constante, à température et quantité de gaz constantes ; discuter les conditions de validité.',
      refs: ['34:fl1g-pression-sapp-mariotte', '37:prevoir:fl1g-pression-ana-compresse', '37:prevoir:fl1g-pression-ana-conditions', '77:plausible:fl1g-pression-val-mariotte-inverse', '77:plausible:fl1g-pression-val-produit-pv', '77:plausible:fl1g-pression-val-ballon'] },
    { id: 'statique-profondeur', nom: 'La pression augmente avec la profondeur', capacite: 'Prévoir, pour un fluide incompressible au repos, comment la pression dépend de la profondeur, de la masse volumique et (pas) de la forme du récipient.',
      refs: ['37:algorithme:fl1g-statique-profondeur-double', '37:algorithme:fl1g-statique-forme-bidon', '37:algorithme:fl1g-statique-mercure', '77:plausible:fl1g-statique-val-ordre'] },
    { id: 'statique-relation', nom: 'Utiliser P₂ − P₁ = ρ·g·(z₁ − z₂)', capacite: 'Dans le cas d’un fluide incompressible au repos, utiliser la relation fournie P₂ − P₁ = ρ·g·(z₁ − z₂) : signe, pression absolue ou relative, profondeur.',
      refs: ['34:fl1g-statique-sapp-piscine', '37:algorithme:fl1g-statique-axe-signe', '37:algorithme:fl1g-statique-relative-surface', '77:plausible:fl1g-statique-val-signe', '77:plausible:fl1g-statique-val-unite', '77:plausible:fl1g-statique-val-profondeur', '36:fl1g-statique-calcul'] },
  ],
  // ── Aspects énergétiques des phénomènes électriques ──
  '1g-electricite': [
    { id: 'charge', nom: 'Intensité du courant et débit de charges', capacite: 'Relier l’intensité d’un courant continu et le débit de charges : Δq = I × Δt ; porteurs de charge (électrons).',
      refs: ['34:ene-charge-sapp', '37:prevoir:ene-charge-debit', '77:plausible:ene-charge-val'] },
    { id: 'source', nom: 'Une pile réelle : tension et résistance interne', capacite: 'Expliquer les conséquences pratiques de la résistance interne d’une source réelle de tension (U = E − r·I) ; déterminer sa caractéristique (E et r) à partir de mesures.',
      refs: ['37:prevoir:ene-pile-reelle', '37:prevoir:ene-pile-a-vide', '37:prevoir:ene-pile-usee', '77:plausible:ene-pile-val', '34:ene-pile-sapp'] },
    { id: 'puissance-energie', nom: 'Puissance et énergie électriques', capacite: 'Relier puissance et énergie, E = P × Δt (en joules ou en kilowattheures) ; faire le bilan d’énergie d’un appareil.',
      refs: ['34:ener2.0', '37:prevoir:ene-puissance-double', '37:prevoir:ene-duree-triple', '37:prevoir:ene-kwh', '77:plausible:ene-kwh-val', '77:plausible:ene-kwh-ok'] },
    { id: 'joule', nom: 'L’effet Joule', capacite: 'Utiliser l’effet Joule dans un dipôle ohmique, P = R × I² : influence de l’intensité et de la résistance, pertes en ligne.',
      refs: ['34:ener2.1', '37:prevoir:ene-joule-intensite', '37:prevoir:ene-joule-resistance', '37:prevoir:ene-haute-tension', '77:plausible:ene-joule-val'] },
    { id: 'rendement', nom: 'Le rendement d’un convertisseur', capacite: 'Définir le rendement d’un convertisseur (η = P_utile / P_reçue) et l’évaluer pour un dispositif.',
      refs: ['37:prevoir:ene-rendement', '37:prevoir:ene-rendement-chaine', '77:plausible:ene-rendement-val', '77:plausible:ene-rendement-chauffage'] },
    { id: 'ordres', nom: 'Ordres de grandeur de puissances', capacite: 'Citer quelques ordres de grandeur de puissances fournies ou consommées par des dispositifs courants.',
      refs: ['77:plausible:cir-puissance-lampe', '77:plausible:ene-batterie-smartphone', '77:plausible:ene-puissance-ordres', '37:prevoir:ene-ordres-comparer'] },
  ],
  // ── Aspects énergétiques des phénomènes mécaniques ──
  '1g-energie-meca': [
    { id: 'energie-cinetique', nom: 'L’énergie cinétique', capacite: 'Utiliser l’expression de l’énergie cinétique d’un système modélisé par un point matériel : Ec = ½·m·v².',
      refs: ['34:meca2.0', '37:prevoir:mec-ec-vitesse', '37:prevoir:mec-ec-masse', '77:plausible:mec-ec-kmh', '77:plausible:mec-ec-iss-ok'] },
    { id: 'travail', nom: 'Le travail d’une force', capacite: 'Utiliser l’expression du travail d’une force constante, W = F·AB = F·AB·cos α : signe selon l’angle entre la force et le déplacement.',
      refs: ['34:meca2.1', '37:prevoir:mec-travail-poids-horizontal', '37:prevoir:mec-travail-angle', '77:plausible:mec-travail-val'] },
    { id: 'theoreme-ec', nom: 'Le théorème de l’énergie cinétique', capacite: 'Énoncer et exploiter le théorème de l’énergie cinétique : ΔEc = somme des travaux des forces.',
      refs: ['37:prevoir:mec-theoreme-arret', '37:prevoir:mec-theoreme-bilan', '77:plausible:mec-theoreme-val'] },
    { id: 'epp', nom: 'L’énergie potentielle de pesanteur', capacite: 'Établir et utiliser l’expression de l’énergie potentielle de pesanteur au voisinage de la Terre : Epp = m·g·z (choix de l’origine).',
      refs: ['37:prevoir:mec-epp-hauteur', '37:prevoir:mec-epp-origine', '77:plausible:mec-epp-val'] },
    { id: 'frottement', nom: 'Le travail d’une force de frottement', capacite: 'Calculer le travail d’une force de frottement d’intensité constante sur une trajectoire rectiligne : W = − f·d.',
      refs: ['37:prevoir:mec-travail-frottement', '37:prevoir:mec-frottement-distance', '77:plausible:mec-frottement-val'] },
    { id: 'conservation', nom: 'Conservation de l’énergie mécanique', capacite: 'Identifier des situations de conservation et de non-conservation de l’énergie mécanique ; l’exploiter dans des cas simples (chute libre, pendule sans frottement).',
      refs: ['37:prevoir:mec-chute-energie', '37:prevoir:mec-em-conservation', '37:prevoir:mec-em-identifier', '77:plausible:mec-em-val'] },
    { id: 'non-conservation', nom: 'Quand l’énergie mécanique diminue', capacite: 'Utiliser la variation de l’énergie mécanique pour déterminer le travail des forces non conservatives ; gain ou dissipation d’énergie.',
      refs: ['37:prevoir:mec-em-frottement', '37:prevoir:mec-em-travail-nc', '77:plausible:mec-em-perte-val'] },
    { id: 'pointage', nom: 'Étudier les énergies d’un mouvement filmé', capacite: 'Utiliser une vidéo ou un pointage pour étudier l’évolution des énergies cinétique, potentielle et mécanique d’un système (chute, pendule…).',
      refs: ['37:prevoir:mec-pointage-compat', '37:prevoir:mec-pointage-energies', '77:plausible:mec-pointage-val'] },
  ],
  // ── Mouvement d'un système ──
  '1g-mouvement': [
    { id: 'variation-vitesse', nom: 'Le vecteur variation de vitesse', capacite: 'Construire et interpréter le vecteur variation de vitesse Δv entre deux instants voisins (sens, direction, soustraction de vecteurs).',
      refs: ['37:prevoir:mec-vitesse-virage', '37:prevoir:mec-deltav-sens', '37:prevoir:mec-deltav-virage', '37:prevoir:mec-chrono-deltav', '36:vecteur-difference'] },
    { id: 'deltav-forces', nom: 'De la somme des forces à Δv ; rôle de la masse', capacite: 'Utiliser la relation approchée entre Δv et la somme des forces, Δv ≈ (ΣF / m)·Δt, pour estimer une variation de vitesse ; rôle de la masse.',
      refs: ['37:prevoir:mec-force-deltav', '37:prevoir:mec-masse-deltav', '34:mec-deltav-sapp', '77:plausible:mec-deltav-val', '36:vecteur-somme'] },
    { id: 'forces-depuis-mouvement', nom: 'Estimer les forces à partir du mouvement', capacite: 'Utiliser la relation approchée entre Δv et la somme des forces pour estimer les forces appliquées au système, le comportement cinématique étant connu.',
      refs: ['37:prevoir:mec-deltav-forces', '34:mec-force-sapp', '77:plausible:mec-force-val'] },
    { id: 'chronophotographie', nom: 'Exploiter une chronophotographie', capacite: 'Exploiter une vidéo ou une chronophotographie d’un système modélisé par un point matériel : échelle, vitesse, variation de vitesse.',
      refs: ['37:prevoir:mec-pointage-echelle', '37:prevoir:mec-pointage-vitesse', '37:prevoir:mec-pointage-sens', '77:plausible:mec-barriere-val'] },
  ],
};
