// Cartes « À retenir » de la simulation « Référentiel et mouvement » (sim 56, 2GT).
// Chaque carte est posée UNE ÉTAPE APRÈS la question qu'elle conclut, avec d'autres exemples que ceux de l'étape (aucune réponse donnée d'avance).
// Schémas dans un cadre de 300 de large, textes ≥ 12,5 (≥ 9 px sur téléphone), maxWidth 320 pour ne pas grossir sur ordinateur.
import { Formule } from "../commun";
import { TV } from "./Travail";

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const Pts = ({ xs, ys, c }) => <>{xs.map((x, i) => <circle key={i} cx={x} cy={Array.isArray(ys) ? ys[i] : ys} r="5" fill={c}/>)}</>;

// ── Carte 1 : la trajectoire ──
export function FicheTrajectoire() {
  const bx = [20, 58, 96, 134, 172, 210, 248, 286], by = bx.map(x => Math.round(176 - 66 * (1 - ((x - 153) / 133) ** 2)));
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="Deux chronophotographies : une voiture sur une route droite, dont les points sont alignés, donc trajectoire rectiligne ; un ballon lancé en l’air, dont les points dessinent une cloche, donc trajectoire courbe">
        <text x="8" y="16" fontSize="13" fontWeight="700" fill={BLEU}>Voiture sur une route droite</text>
        <line x1="12" y1="40" x2="290" y2="40" stroke={GRIS} strokeWidth="1.5" strokeDasharray="4 4"/>
        <Pts xs={[20, 58, 96, 134, 172, 210, 248, 286]} ys={40} c={BLEU}/>
        <text x="8" y="64" fontSize="12.5" fill={VERT} fontWeight="800">points alignés : trajectoire rectiligne</text>
        <text x="8" y="94" fontSize="13" fontWeight="700" fill={ORANGE}>Ballon lancé en l’air</text>
        <polyline points={bx.map((x, i) => `${x},${by[i]}`).join(' ')} fill="none" stroke={GRIS} strokeWidth="1.5" strokeDasharray="4 4"/>
        <Pts xs={bx} ys={by} c={ORANGE}/>
        <text x="8" y="196" fontSize="12.5" fill={VERT} fontWeight="800">points sur une courbe : trajectoire courbe</text>
      </svg>
      <ul style={liste}>
        <li><em>Un point = une photo</em>, prise à intervalles de temps égaux (chronophotographie).</li>
        <li>La <strong>trajectoire</strong> est le <strong>chemin dessiné par les points</strong> : une droite (mouvement <strong>rectiligne</strong>) ou une courbe (mouvement <strong>curviligne</strong>).</li>
        <li>Pour la trouver : je <strong>relie les points</strong> et je regarde la forme.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : écarts entre les points ──
export function FicheEcarts() {
  return (
    <div>
      <svg viewBox="0 0 300 200" style={svgStyle} role="img" aria-label="Trois chronophotographies d’un cycliste vers la droite : écarts égaux, il va à vitesse constante ; écarts qui grandissent, il accélère ; écarts qui diminuent, il ralentit">
        <text x="8" y="16" fontSize="12.5" fontWeight="800" fill={VERT}>écarts égaux ⇒ vitesse constante</text>
        <Pts xs={[16, 62, 108, 154, 200, 246]} ys={34} c={VERT}/>
        <text x="8" y="76" fontSize="12.5" fontWeight="800" fill={ORANGE}>écarts qui grandissent ⇒ il accélère</text>
        <Pts xs={[16, 34, 62, 104, 160, 232]} ys={94} c={ORANGE}/>
        <text x="8" y="136" fontSize="12.5" fontWeight="800" fill={ROUGE}>écarts qui diminuent ⇒ il ralentit</text>
        <Pts xs={[16, 88, 144, 186, 214, 232]} ys={154} c={ROUGE}/>
        <text x="8" y="190" fontSize="12.5" fill={GRIS}>même durée entre deux photos · vers la droite</text>
      </svg>
      <ul style={liste}>
        <li>Durées égales entre les points : ce sont les <strong>écarts</strong> qui renseignent sur la vitesse.</li>
        <li><strong>Écarts égaux ⇒ vitesse constante</strong>. Écarts croissants ⇒ le mobile accélère. Écarts décroissants ⇒ il ralentit.</li>
        <li>Exemple : un cycliste parcourt toujours 6 m entre deux photos : sa vitesse est constante.</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : le référentiel ──
export function FicheRef() {
  const cx = [30, 52, 74, 96, 118], cy = [24, 27, 40, 62, 94];
  return (
    <div>
      <svg viewBox="0 0 300 210" style={svgStyle} role="img" aria-label="Une même pomme lâchée dans un bus : vue depuis le trottoir, sa trajectoire est une courbe ; vue depuis le bus, c’est une droite verticale ; le référentiel est l’objet de référence que l’on considère comme immobile">
        <text x="8" y="16" fontSize="13" fontWeight="800" fill={BLEU}>vue du trottoir</text>
        <line x1="8" y1="120" x2="140" y2="120" stroke={GRIS} strokeWidth="3"/>
        <polyline points={cx.map((x, i) => `${x},${cy[i]}`).join(' ')} fill="none" stroke={GRIS} strokeWidth="1.5" strokeDasharray="4 4"/>
        <Pts xs={cx} ys={cy} c={ORANGE}/>
        <text x="8" y="142" fontSize="12.5" fill={GRIS}>trottoir : immobile</text>
        <text x="158" y="16" fontSize="13" fontWeight="800" fill={BLEU}>vue du bus</text>
        <line x1="158" y1="120" x2="292" y2="120" stroke={GRIS} strokeWidth="3"/>
        <polyline points="225,24 225,27 225,40 225,62 225,94" fill="none" stroke={GRIS} strokeWidth="1.5" strokeDasharray="4 4"/>
        <Pts xs={[225, 225, 225, 225, 225]} ys={[24, 27, 40, 62, 94]} c={ORANGE}/>
        <text x="158" y="142" fontSize="12.5" fill={GRIS}>sol du bus : immobile</text>
        <text x="8" y="170" fontSize="12.5" fontWeight="800" fill={VERT}>courbe</text>
        <text x="158" y="170" fontSize="12.5" fontWeight="800" fill={VERT}>droite verticale</text>
        <text x="150" y="198" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>un mouvement, deux trajectoires</text>
      </svg>
      <ul style={liste}>
        <li>Le <strong>référentiel</strong> est l’objet de référence que l’on considère comme <strong>immobile</strong> (le trottoir, le bus, le sol…).</li>
        <li><strong>Trajectoire et vitesse dépendent du référentiel.</strong></li>
        <li>Toujours se demander : « <strong>par rapport à quoi ?</strong> ».</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : la vitesse et sa dépendance au référentiel ──
export function FicheVitesse() {
  return (
    <div>
      <svg viewBox="0 0 300 196" style={svgStyle} role="img" aria-label="Deux photos successives M et M prime d’une moto séparées de 30 mètres en 3 secondes : le vecteur vitesse part de M prime, dirigé comme le déplacement ; en dessous, un camion à 20 mètres par seconde et une moto à 30 : vue du camion, la moto avance à 10 mètres par seconde">
        <text x="8" y="16" fontSize="12.5" fontWeight="700" fill={BLEU}>deux photos successives</text>
        <circle cx="34" cy="64" r="5.5" fill={BLEU}/><circle cx="170" cy="64" r="5.5" fill={BLEU}/>
        <text x="34" y="46" textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>M</text>
        <text x="170" y="46" textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>M′</text>
        <text x="102" y="56" textAnchor="middle" fontSize="12.5" fill={GRIS}>Δt = 3 s</text>
        <line x1="34" y1="82" x2="170" y2="82" stroke={GRIS} strokeWidth="1.5"/><line x1="34" y1="77" x2="34" y2="87" stroke={GRIS} strokeWidth="1.5"/><line x1="170" y1="77" x2="170" y2="87" stroke={GRIS} strokeWidth="1.5"/>
        <text x="102" y="101" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ENCRE}>MM′ = 30 m</text>
        <line x1="170" y1="64" x2="244" y2="64" stroke={ORANGE} strokeWidth="3"/><polygon points="254,64 243,59 243,69" fill={ORANGE}/>
        <TV x={208} y={54} c={ORANGE} s={14}>v</TV>
        <text x="8" y="128" fontSize="12.5" fontWeight="800" fill={ORANGE}>v = MM′ / Δt = 10 m/s = 36 km/h</text>
        <rect x="6" y="140" width="288" height="50" rx="12" fill="#fff7ed" stroke={ORANGE} strokeWidth="2.5"/>
        <text x="16" y="158" fontSize="12.5" fill={ENCRE}>camion 20 m/s · moto 30 m/s (route)</text>
        <text x="16" y="178" fontSize="12.5" fontWeight="800" fill={ORANGE}>vue du camion : 30 − 20 = 10 m/s</text>
      </svg>
      <Formule><mi>v</mi><mo>=</mo><mfrac><mrow><mi>M</mi><msup><mi>M</mi><mo>′</mo></msup></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac></Formule>
      <ul style={liste}>
        <li><em>Vitesse = distance parcourue ÷ durée.</em> Le vecteur vitesse a la direction et le sens du déplacement ; sa longueur représente la valeur.</li>
        <li><strong>× 3,6</strong> : de m/s à km/h ; <strong>÷ 3,6</strong> : de km/h à m/s.</li>
        <li>Dans le référentiel d’un véhicule A, on retranche sa vitesse : v<sub>B/A</sub> = v<sub>B</sub> − v<sub>A</sub>. En sens inverses, il faut tenir compte du signe.</li>
      </ul>
    </div>
  );
}
