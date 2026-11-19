// Cartes « À retenir » de la simulation « Régulation du niveau d'un château d'eau » (sim 5, TSTL).
// Chaque carte est posée une étape APRÈS la question qu'elle conclut, avec d'autres valeurs que celles demandées.
// Schémas dessinés dans un cadre de 300 de large (textes ≥ 12,5) : ≥ 9 px rendus sur téléphone, sans grossir sur ordinateur (maxWidth 320).
import { Formule } from "../commun";

const GRIS = '#475569', EAU = '#2563eb', POMPE = '#16a34a', PUISAGE = '#dc2626', CONSIGNE = '#ea580c', SEUIL = '#7c3aed', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };

// ── Carte 1 : grandeur réglée, réglante, perturbatrice ──
const Ligne = ({ y, couleur, fond, titre, sous1, sous2, icone }) => (
  <g>
    <rect x="4" y={y} width="292" height="62" rx="12" fill={fond} stroke={couleur} strokeWidth="2.5"/>
    {icone}
    <text x="64" y={y + 22} fontSize="13.5" fontWeight="800" fill={couleur}>{titre}</text>
    <text x="64" y={y + 40} fontSize="12.5" fill={ENCRE}>{sous1}</text>
    <text x="64" y={y + 55} fontSize="12.5" fill={GRIS}>{sous2}</text>
  </g>
);
export function FicheBoucle() {
  const reservoir = (
    <g><rect x="14" y="14" width="32" height="38" rx="4" fill="#fff" stroke={ENCRE} strokeWidth="2"/>
      <rect x="15" y="30" width="30" height="21" fill="#93c5fd"/>
      <line x1="10" y1="22" x2="50" y2="22" stroke={CONSIGNE} strokeWidth="2" strokeDasharray="4 3"/></g>);
  const pompe = (
    <g transform="translate(0 68)"><circle cx="30" cy="31" r="17" fill="#fff" stroke={ENCRE} strokeWidth="2"/>
      <polygon points="24,22 24,40 39,31" fill={POMPE}/><line x1="6" y1="31" x2="13" y2="31" stroke={ENCRE} strokeWidth="3"/><line x1="47" y1="31" x2="54" y2="31" stroke={ENCRE} strokeWidth="3"/></g>);
  const robinet = (
    <g transform="translate(0 136)"><path d="M12,18 H34 a8,8 0 0 1 8,8 V30" fill="none" stroke={ENCRE} strokeWidth="4" strokeLinecap="round"/>
      <circle cx="42" cy="39" r="3.5" fill={PUISAGE}/><circle cx="42" cy="50" r="3" fill={PUISAGE}/></g>);
  return (
    <div>
      <svg viewBox="0 0 300 204" style={svgStyle} role="img" aria-label="Trois grandeurs d’une boucle de régulation : la grandeur réglée est la hauteur d’eau, ce que l’on veut maintenir ; la grandeur réglante est le débit de la pompe, ce qui permet d’agir ; la grandeur perturbatrice est le débit de puisage, subi par le régulateur">
        <Ligne y={4} couleur={EAU} fond="#eff6ff" titre="réglée : hauteur d’eau H" sous1="ce qu’on veut maintenir" sous2="(proche de la consigne)" icone={reservoir}/>
        <Ligne y={70} couleur={POMPE} fond="#f0fdf4" titre="réglante : débit de la pompe" sous1="ce sur quoi le régulateur agit" sous2="(via l’actionneur)" icone={pompe}/>
        <Ligne y={136} couleur={PUISAGE} fond="#fef2f2" titre="perturbatrice : puisage" sous1="décidée par les abonnés" sous2="(le régulateur la subit)" icone={robinet}/>
      </svg>
      <ul style={liste}>
        <li><em>Réglée = ce qu’on règle ; réglante = ce qui règle ; perturbatrice = ce qui dérange.</em></li>
        <li>Le <strong>capteur</strong> mesure H, le <strong>régulateur</strong> compare à la consigne et commande la pompe (<strong>actionneur</strong>).</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : régulation TOR à deux seuils ──
export function FicheTOR() {
  return (
    <div>
      <svg viewBox="0 0 300 206" style={svgStyle} role="img" aria-label="Régulation tout-ou-rien à deux seuils : le niveau d’eau monte quand la pompe marche jusqu’au seuil haut, puis descend pompe arrêtée jusqu’au seuil bas, et ainsi de suite ; la commande ne prend que les valeurs 0 et 100 pour cent">
        <line x1="66" y1="26" x2="296" y2="26" stroke={SEUIL} strokeWidth="2" strokeDasharray="6 4"/>
        <line x1="66" y1="96" x2="296" y2="96" stroke={SEUIL} strokeWidth="2" strokeDasharray="6 4"/>
        <text x="62" y="30" textAnchor="end" fontSize="12.5" fontWeight="700" fill={SEUIL}>haut</text>
        <text x="62" y="100" textAnchor="end" fontSize="12.5" fontWeight="700" fill={SEUIL}>bas</text>
        <polyline points="76,96 131,26 198,96 253,26 296,62" fill="none" stroke={EAU} strokeWidth="3.5" strokeLinejoin="round"/>
        <text x="10" y="64" fontSize="12.5" fontWeight="700" fill={EAU}>H</text>
        <rect x="76" y="116" width="55" height="22" rx="4" fill="#bbf7d0" stroke={POMPE} strokeWidth="2"/><rect x="131" y="116" width="67" height="22" rx="4" fill="#e5e7eb" stroke={GRIS} strokeWidth="2"/>
        <rect x="198" y="116" width="55" height="22" rx="4" fill="#bbf7d0" stroke={POMPE} strokeWidth="2"/><rect x="253" y="116" width="43" height="22" rx="4" fill="#e5e7eb" stroke={GRIS} strokeWidth="2"/>
        <text x="103" y="132" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#14532d">100 %</text><text x="164" y="132" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={GRIS}>0 %</text>
        <text x="225" y="132" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#14532d">100 %</text>
        <text x="10" y="132" fontSize="12.5" fontWeight="700" fill={POMPE}>pompe</text>
        <text x="150" y="162" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>seuil haut atteint : la pompe s’arrête</text>
        <text x="150" y="180" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>seuil bas atteint : la pompe démarre</text>
        <text x="150" y="198" textAnchor="middle" fontSize="12.5" fill={GRIS}>entre les deux : l’état précédent est conservé</text>
      </svg>
      <ul style={liste}>
        <li><em>Deux valeurs seulement : 0 % ou 100 %.</em> Le niveau fait des <strong>cycles</strong> entre les deux seuils.</li>
        <li>Pour une pompe qui n’a que deux états (marche / arrêt), c’est la régulation adaptée.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : cycle et taux d'utilisation ──
export function FicheCycle() {
  return (
    <div>
      <svg viewBox="0 0 300 156" style={svgStyle} role="img" aria-label="Un cycle de pompe : elle marche pendant une durée t marche puis s’arrête ; le taux d’utilisation est la durée de marche divisée par la durée du cycle ; pour une consommation de 30 mètres cubes par heure et une pompe de 100, la pompe marche 30 pour cent du temps">
        <rect x="14" y="40" width="84" height="30" rx="5" fill="#bbf7d0" stroke={POMPE} strokeWidth="2.5"/>
        <rect x="98" y="40" width="188" height="30" rx="5" fill="#e5e7eb" stroke={GRIS} strokeWidth="2.5"/>
        <text x="56" y="60" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#14532d">marche</text><text x="192" y="60" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={GRIS}>arrêt</text>
        <line x1="14" y1="30" x2="98" y2="30" stroke={POMPE} strokeWidth="2.5"/><text x="56" y="22" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={POMPE}>t marche</text>
        <line x1="14" y1="86" x2="286" y2="86" stroke={ENCRE} strokeWidth="2.5"/><polygon points="14,86 24,81 24,91" fill={ENCRE}/><polygon points="286,86 276,81 276,91" fill={ENCRE}/>
        <text x="150" y="106" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>durée d’un cycle</text>
        <rect x="14" y="116" width="272" height="34" rx="17" fill="#f0fdf4" stroke={POMPE} strokeWidth="2.5"/>
        <text x="150" y="138" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#14532d">30 m³/h ÷ 100 m³/h = 30 %</text>
      </svg>
      <Formule><mtext>taux</mtext><mo>=</mo><mfrac><msub><mi>t</mi><mtext>marche</mtext></msub><mi>T</mi></mfrac><mo>=</mo><mfrac><msub><mi>Q</mi><mtext>puisage</mtext></msub><msub><mi>Q</mi><mtext>max</mtext></msub></mfrac></Formule>
      <ul style={liste}>
        <li>T = durée d’un cycle ; Q<sub>max</sub> = débit maximal de la pompe. Sur un cycle complet, le niveau revient au même point : <strong>volume pompé = volume consommé</strong>.</li>
        <li>Le taux ne dépend donc pas des seuils, seulement du puisage et de la pompe (hypothèse : consommation constante).</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : régulation proportionnelle, écart statique ──
export function FicheP() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Régulation proportionnelle : le niveau d’eau monte puis se stabilise en dessous de la consigne ; la différence entre la consigne et le niveau stabilisé est l’écart statique ; pour que la pompe fournisse un débit non nul, il faut un écart non nul">
        <line x1="46" y1="22" x2="296" y2="22" stroke={CONSIGNE} strokeWidth="2.5" strokeDasharray="7 4"/>
        <text x="296" y="14" textAnchor="end" fontSize="12.5" fontWeight="700" fill={CONSIGNE}>consigne</text>
        <path d="M46,150 C 80,100 110,78 150,72 C 200,66 240,64 296,64" fill="none" stroke={EAU} strokeWidth="3.5"/>
        <text x="190" y="92" fontSize="12.5" fontWeight="700" fill={EAU}>niveau stabilisé</text>
        <line x1="268" y1="26" x2="268" y2="60" stroke={ENCRE} strokeWidth="2.5"/><polygon points="268,22 263,32 273,32" fill={ENCRE}/><polygon points="268,64 263,54 273,54" fill={ENCRE}/>
        <text x="260" y="46" textAnchor="end" fontSize="12.5" fontWeight="800" fill={ENCRE}>écart statique</text>
        <line x1="46" y1="16" x2="46" y2="160" stroke={ENCRE} strokeWidth="2"/><line x1="46" y1="160" x2="296" y2="160" stroke={ENCRE} strokeWidth="2"/>
        <text x="38" y="26" textAnchor="end" fontSize="12.5" fontWeight="700" fill={EAU}>H</text><text x="296" y="178" textAnchor="end" fontSize="12.5" fontWeight="700" fill={ENCRE}>temps</text>
        <text x="150" y="194" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>débit ≠ 0 ⇒ écart ≠ 0</text>
      </svg>
      <ul style={liste}>
        <li>En P, la commande est <strong>proportionnelle à l’écart</strong> : plus le niveau est loin de la consigne, plus la pompe tourne vite.</li>
        <li>À l’équilibre, la pompe doit fournir le débit de puisage : il faut donc <strong>un écart qui ne s’annule pas</strong>.</li>
        <li>Augmenter le gain <strong>réduit</strong> l’écart statique sans l’annuler ; trop fort, avec un retard de mesure, le niveau oscille.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : TOR, P, PI et critères de performance ──
const Mini = ({ y, titre, l1, l2, trace, seuils = false }) => (
  <g>
    <rect x="4" y={y} width="292" height="52" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"/>
    {seuils ? <><line x1="10" y1={y + 12} x2="100" y2={y + 12} stroke={SEUIL} strokeWidth="1.5" strokeDasharray="4 3"/><line x1="10" y1={y + 42} x2="100" y2={y + 42} stroke={SEUIL} strokeWidth="1.5" strokeDasharray="4 3"/></>
      : <line x1="10" y1={y + 14} x2="100" y2={y + 14} stroke={CONSIGNE} strokeWidth="1.5" strokeDasharray="4 3"/>}
    {trace}
    <text x="108" y={y + 20} fontSize="13.5" fontWeight="800" fill={ENCRE}>{titre}</text>
    <text x="108" y={y + 36} fontSize="12.5" fill={ENCRE}>{l1}</text>
    <text x="108" y={y + 49} fontSize="12.5" fill={GRIS}>{l2}</text>
  </g>
);
export function FicheComparaison() {
  return (
    <div>
      <svg viewBox="0 0 300 272" style={svgStyle} role="img" aria-label="Comparaison de trois régulations : le tout-ou-rien fait des cycles, la proportionnelle se stabilise avec un écart statique, la proportionnelle intégrale annule l’écart statique ; trois critères de performance : précision, rapidité, stabilité">
        <Mini y={4} titre="TOR" l1="cycles entre deux seuils" l2="simple, robuste" seuils trace={<polyline points="12,42 30,16 48,42 66,16 84,42 98,28" fill="none" stroke={EAU} strokeWidth="2.5" strokeLinejoin="round"/>}/>
        <Mini y={62} titre="P" l1="se stabilise… en dessous" l2="écart statique non nul" trace={<path d="M12,106 C 30,96 50,90 98,88" fill="none" stroke={EAU} strokeWidth="2.5"/>}/>
        <Mini y={120} titre="PI" l1="écart statique nul" l2="à bien régler (oscillations)" trace={<path d="M12,166 C 30,140 44,128 56,134 C 66,140 74,138 98,136" fill="none" stroke={EAU} strokeWidth="2.5"/>}/>
        <rect x="4" y="182" width="292" height="86" rx="12" fill="#eff6ff" stroke={EAU} strokeWidth="2.5"/>
        <text x="150" y="202" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={EAU}>3 critères de performance</text>
        <text x="14" y="221" fontSize="12.5" fill={ENCRE}><tspan fontWeight="800">précision</tspan> : l’écart statique</text>
        <text x="14" y="237" fontSize="12.5" fill={ENCRE}><tspan fontWeight="800">rapidité</tspan> : le temps de réponse</text>
        <text x="14" y="256" fontSize="12.5" fill={ENCRE}><tspan fontWeight="800">stabilité</tspan> : le dépassement, les oscillations</text>
      </svg>
      <ul style={liste}>
        <li><em>TOR : des cycles. P : un écart. PI : plus d’écart… s’il est bien réglé.</em></li>
        <li>Choisir une régulation, c’est trouver le meilleur compromis entre précision, rapidité et stabilité.</li>
      </ul>
    </div>
  );
}
