import { CODES } from './codes';

// Code court d'un exercice (ANA12, VAL7, SAPP3…), le même que dans le catalogue : à citer pour retrouver l'exercice vite.
const PAR_CLE = Object.fromEntries(Object.entries(CODES).map(([code, [atelier, ex]]) => [`${atelier}:${ex}`, code]));
const codeDe = cle => PAR_CLE[cle] || null;

export default function CodeExo({ cle }) {
  const code = codeDe(cle);
  if (!code) return null;
  return <span data-code-exo title="Code de l’exercice (identique à celui du catalogue)" style={{ display: 'inline-block', marginLeft: 8, padding: '1px 7px', borderRadius: 6, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, verticalAlign: 'middle' }}>{code}</span>;
}
