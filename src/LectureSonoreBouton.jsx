import { useEffect, useRef, useState } from "react";
import { useEtatPersistant } from "./commun";
import { compter } from "./stats";
import { prononcer, decouperPhrases, choisirVoix, creerLecteur, VITESSES } from "./lectureSonore";

// ═════════════════════════════════════════════════════════════════
//  LECTURE SONORE d'une étape de parcours guidé (voix locale du navigateur, voir lectureSonore.js).
//  Le composant lit les blocs marqués data-lecture dans la carte, dans l'ordre de l'écran. Les verdicts, boutons, champs, options de QCM
//  et le calcul pas à pas ne portent pas ce marquage : ils ne sont jamais lus (les verdicts sont annoncés par les lecteurs d'écran).
//  Surbrillance de la phrase lue : API CSS Custom Highlight (le texte affiché n'est pas modifié) ; sinon, bloc entier.
// ═════════════════════════════════════════════════════════════════

const NOM_SURBRILLANCE = 'lecture-sonore';
const FOND = '#dbeafe';
const BLOCS = new Set(['div', 'p', 'li', 'ul', 'ol', 'br', 'tr', 'td', 'details', 'summary', 'h1', 'h2', 'h3', 'h4']);

// Texte d'un bloc tel qu'à l'écran, avec la correspondance entre positions du texte et nœuds du DOM.
// Une formule (MathML) devient un caractère \uE000 ; les schémas et pictos sont ignorés.
function extraire(el) {
  let texte = '';
  const segs = [];
  const virtuel = c => { segs.push({ noeud: null, debut: texte.length }); texte += c; };
  const aller = n => {
    if (n.nodeType === 3) { segs.push({ noeud: n, debut: texte.length }); texte += n.nodeValue; return; }
    if (n.nodeType !== 1) return;
    const t = n.nodeName.toLowerCase();
    if (t === 'math') { virtuel('\uE000'); return; }
    if (['svg', 'script', 'style', 'button', 'input'].includes(t) || n.getAttribute('aria-hidden') === 'true') return;
    n.childNodes.forEach(aller);
    if (BLOCS.has(t)) virtuel(' ');
  };
  aller(el);
  return { texte, segs };
}

function longueur(s) { return s.noeud ? s.noeud.nodeValue.length : 1; }

// Plage DOM correspondant aux positions [debut, fin[ du texte extrait
function plage(segs, debut, fin) {
  let a = segs.findIndex(s => s.noeud && s.debut + longueur(s) > debut);
  let b = -1;
  for (let k = segs.length - 1; k >= 0; k--) if (segs[k].noeud && segs[k].debut < fin) { b = k; break; }
  if (a < 0 || b < 0 || a > b) return null;
  const r = document.createRange();
  r.setStart(segs[a].noeud, Math.max(0, debut - segs[a].debut));
  r.setEnd(segs[b].noeud, Math.min(longueur(segs[b]), fin - segs[b].debut));
  return r;
}

const aSurbrillance = () => typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';

export function LectureSonoreBouton({ racine, simId }) {
  const [voix, setVoix] = useState(null);
  const [etat, setEtat] = useState('arret');          // 'arret' | 'lecture' | 'pause'
  const [vitesse, setVitesse] = useEtatPersistant('lecture-sonore-vitesse-v1', 'normal');
  const lecteur = useRef(null);
  const contexte = useRef({ phrases: [], blocs: [], precedent: null });

  // Voix françaises locales : le chargement est asynchrone sur Chrome
  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) return undefined;
    const maj = () => setVoix(choisirVoix(synth.getVoices()));
    maj();
    synth.addEventListener?.('voiceschanged', maj);
    return () => synth.removeEventListener?.('voiceschanged', maj);
  }, []);

  const effacer = () => {
    if (aSurbrillance()) CSS.highlights.delete(NOM_SURBRILLANCE);
    const { precedent } = contexte.current;
    if (precedent) { precedent.style.backgroundColor = precedent.dataset.fondAvant || ''; delete precedent.dataset.fondAvant; contexte.current.precedent = null; }
  };

  const surligner = i => {
    effacer();
    if (i < 0) return;
    const p = contexte.current.phrases[i];
    if (!p) return;
    const r = aSurbrillance() ? plage(p.segs, p.debut, p.fin) : null;
    if (r) CSS.highlights.set(NOM_SURBRILLANCE, new Highlight(r));
    else if (p.bloc) { p.bloc.dataset.fondAvant = p.bloc.style.backgroundColor || ''; p.bloc.style.backgroundColor = FOND; contexte.current.precedent = p.bloc; }
  };

  const arreter = () => { if (lecteur.current) lecteur.current.arreter(); effacer(); setEtat('arret'); };

  // Arrêts automatiques : sortie de l'étape ou de la simulation (le parent remonte le composant à chaque étape), onglet masqué
  useEffect(() => {
    const masque = () => { if (document.hidden && lecteur.current && lecteur.current.etat() === 'lecture') { lecteur.current.pause(); setEtat('pause'); } };
    document.addEventListener('visibilitychange', masque);
    return () => {
      document.removeEventListener('visibilitychange', masque);
      if (lecteur.current) lecteur.current.arreter();
      effacer();
    };
  }, []);

  useEffect(() => { if (lecteur.current) lecteur.current.regler(VITESSES[vitesse] || VITESSES.normal); }, [vitesse]);

  if (!voix) return null;      // pas de voix française locale sur cet appareil : aucun bouton

  const preparer = () => {
    const blocs = Array.from(racine.current ? racine.current.querySelectorAll('[data-lecture]') : []);
    const phrases = [];
    blocs.forEach(bloc => {
      const { texte, segs } = extraire(bloc);
      decouperPhrases(texte).forEach(p => phrases.push({ ...p, bloc, segs, parle: prononcer(p.texte) }));
    });
    contexte.current = { phrases: phrases.filter(p => p.parle), blocs, precedent: null };
    return contexte.current.phrases;
  };

  const cliquer = () => {
    if (etat === 'lecture') { lecteur.current.pause(); setEtat('pause'); return; }
    if (etat === 'pause' && lecteur.current) { lecteur.current.reprendre(); setEtat('lecture'); return; }
    const phrases = preparer();
    if (!phrases.length) return;
    compter(`lecture-sonore:${simId}`, `Lecture sonore : simulation ${simId}`, true);    // une fois par lecture lancée, pas par phrase
    lecteur.current = creerLecteur({
      synth: window.speechSynthesis, Utterance: window.SpeechSynthesisUtterance, voix, vitesse: VITESSES[vitesse] || VITESSES.normal, phrases,
      onPhrase: surligner, onFin: () => setEtat('arret'), onErreur: () => { effacer(); setEtat('arret'); },
    });
    lecteur.current.demarrer();
    setEtat('lecture');
  };

  const bouton = (actif) => ({ padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13,
    border: `1.5px solid ${actif ? '#0284c7' : '#cbd5e1'}`, background: actif ? '#0284c7' : 'white', color: actif ? 'white' : '#334155' });
  // Le nom du bouton change avec l'état (Écouter / Pause / Reprendre) : pas d'aria-pressed en plus, il dirait deux choses à la fois
  return (
    <div data-lecture-sonore="1" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <button type="button" onClick={cliquer} style={bouton(etat === 'lecture')}>
        {etat === 'lecture' ? <><span aria-hidden="true">⏸</span> Pause</> : etat === 'pause' ? <><span aria-hidden="true">▶</span> Reprendre</> : <><span aria-hidden="true">🔊</span> Écouter</>}
      </button>
      {etat !== 'arret' && <button type="button" onClick={arreter} style={bouton(false)}>Arrêter</button>}
      <span role="group" aria-label="Vitesse de lecture" style={{ display: 'inline-flex', gap: 4, marginLeft: 4 }}>
        {[['lent', 'Lent'], ['normal', 'Normal'], ['rapide', 'Rapide']].map(([cle, nom]) => (
          <button key={cle} type="button" aria-pressed={vitesse === cle} onClick={() => setVitesse(cle)}
            style={{ ...bouton(vitesse === cle), padding: '3px 8px', fontSize: 12, fontWeight: 600 }}>{nom}</button>
        ))}
      </span>
    </div>
  );
}
