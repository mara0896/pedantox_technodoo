import { useEffect, useMemo, useRef, useState } from 'react';
import { decouperTexte, normaliserMot } from '../../utils/textUtils';
import { sauvegarderNiveauComplete } from '../../services/storageService';
import './Game.css';

function WordToken({ item, revealed, isSimilar, motTapeParUtilisateur, tokenId, countVisible, onClick }) {
  const tokenLength = item.texteOriginal.length;
  const hiddenClass = isSimilar ? 'similar-word' : 'hidden-word';

  return (
    <span
      className={`word-block ${revealed ? 'revealed-word' : hiddenClass} ${countVisible ? 'count-visible' : ''}`}
      data-count={tokenLength}
      style={{ minWidth: `${tokenLength}ch` }}
      onClick={onClick}
    >
      {revealed ? item.texteOriginal : isSimilar ? motTapeParUtilisateur : '■'.repeat(tokenLength)}
    </span>
  );
}

function Game({ levelData, onNextLevel }) {
  const delaisCompteursRef = useRef(new Map());
  const [motsTrouves, setMotsTrouves] = useState(new Set());
  const [motsSimilairesTrouves, setMotsSimilairesTrouves] = useState(new Map());
  const [compteursVisibles, setCompteursVisibles] = useState(new Set());
  const [historiqueEssais, setHistoriqueEssais] = useState([]);
  const [jeuGagne, setJeuGagne] = useState(false);
  const [saisieMot, setSaisieMot] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let timeoutId;
    if (toast) {
      timeoutId = setTimeout(() => setToast(null), 3200);
    }
    return () => clearTimeout(timeoutId);
  }, [toast]);

  const motsDuTitre = useMemo(() => (levelData ? decouperTexte(levelData.titre) : []), [levelData]);
  const motsDuTexte = useMemo(() => (levelData ? decouperTexte(levelData.texte) : []), [levelData]);
  const motsClesDuTitreSolution = useMemo(() => {
    if (!levelData) return [];
    return (levelData.titre.match(/[a-zA-Z0-9À-ÿ]+/g) || []).map(normaliserMot).filter((m) => m.length > 0);
  }, [levelData]);

  useEffect(() => {
    setMotsTrouves(new Set());
    setMotsSimilairesTrouves(new Map());
    setCompteursVisibles(new Set());
    delaisCompteursRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    delaisCompteursRef.current.clear();
    setHistoriqueEssais([]);
    setJeuGagne(false);
    setSaisieMot('');
  }, [levelData]);

  useEffect(() => {
    const aTrouveToutLeTitre = motsClesDuTitreSolution.every((motCle) => motsTrouves.has(motCle));
    if (aTrouveToutLeTitre && !jeuGagne && levelData) {
      setJeuGagne(true);
      sauvegarderNiveauComplete(levelData.id);
      if (typeof window.confetti === 'function') {
        const fin = Date.now() + 5 * 1000;
        (function frame() {
          window.confetti({ particleCount: 6, spread: 60, angle: 60, origin: { x: 0, y: 0.6 } });
          window.confetti({ particleCount: 6, spread: 60, angle: 120, origin: { x: 1, y: 0.6 } });
          if (Date.now() < fin) requestAnimationFrame(frame);
        })();
      }
    }
  }, [jeuGagne, motsClesDuTitreSolution, motsTrouves, levelData]);

  function notifier(message, type = 'error') {
    setToast({ message, type });
  }

  function verifierMot(event) {
    event.preventDefault();
    if (jeuGagne || !levelData) return;
    const motSaisi = saisieMot.trim();
    if (!motSaisi) return;
    const motNormalise = normaliserMot(motSaisi);
    setSaisieMot('');

    if (historiqueEssais.some((e) => e.mot === motNormalise)) {
      notifier('Vous avez déjà testé ce mot !');
      return;
    }

    const listeMotsAValider = new Set([motNormalise]);
    if (levelData.variantes) {
      if (levelData.variantes[motNormalise]) {
        levelData.variantes[motNormalise].map(normaliserMot).forEach((mot) => listeMotsAValider.add(mot));
      }
    }

    const similarities = levelData.similarities || {};
    let cibleSimilaire = null;
    for (const [cible, synonymes] of Object.entries(similarities)) {
      if (synonymes.map(normaliserMot).includes(motNormalise)) {
        cibleSimilaire = normaliserMot(cible);
        break;
      }
    }

    if (cibleSimilaire) {
      setMotsSimilairesTrouves((prev) => new Map(prev).set(motNormalise, cibleSimilaire));
    }

    let occurrencesTotales = 0;
    const motsTrouvesDansCetteSaisie = new Set();

    listeMotsAValider.forEach((motDeLaListe) => {
      let trouveDansTitre = false;
      let trouveDansTexte = false;

      motsDuTitre.forEach((item) => {
        if (item.type === 'word' && item.motNettoye === motDeLaListe) {
          occurrencesTotales += 1;
          trouveDansTitre = true;
        }
      });

      motsDuTexte.forEach((item) => {
        if (item.type === 'word' && item.motNettoye === motDeLaListe) {
          occurrencesTotales += 1;
          trouveDansTexte = true;
        }
      });

      if (trouveDansTitre || trouveDansTexte || motsClesDuTitreSolution.includes(motDeLaListe)) {
        motsTrouvesDansCetteSaisie.add(motDeLaListe);
      }
    });

    setMotsTrouves((prev) => {
      const next = new Set(prev);
      motsTrouvesDansCetteSaisie.forEach((mot) => next.add(mot));
      return next;
    });

    setHistoriqueEssais((prev) => [{ mot: motSaisi, occurrences: occurrencesTotales }, ...prev]);
  }

  function donnerIndices() {
    if (!levelData) return;
    const indicesDisponibles = levelData.indices.map(normaliserMot).filter((mot) => !motsTrouves.has(mot));
    if (indicesDisponibles.length === 0) {
      notifier("Plus d'indices disponibles pour cette session !");
      return;
    }
    const motIndice = indicesDisponibles[Math.floor(Math.random() * indicesDisponibles.length)];
    setMotsTrouves((prev) => new Set(prev).add(motIndice));
    setHistoriqueEssais((prev) => [{ mot: `💡 Indice: ${motIndice}`, occurrences: 'Bonus' }, ...prev]);
    notifier(`Indice révélé : ${motIndice}`, 'info');
  }

  function renderTokens(tokens, prefix) {
    return tokens.map((item, index) => {
      const tokenId = `${prefix}-${index}`;
      if (item.type === 'space' || item.type === 'punctuation') {
        return <span key={tokenId}>{item.texte}</span>;
      }

      const revealed = motsTrouves.has(item.motNettoye) || jeuGagne;
      let motTapeParUtilisateur = null;
      if (!revealed) {
        for (const [input, cible] of motsSimilairesTrouves.entries()) {
          if (cible === item.motNettoye) {
            motTapeParUtilisateur = input;
            break;
          }
        }
      }

      const isSimilar = !revealed && Boolean(motTapeParUtilisateur);

      return (
        <WordToken
          key={tokenId}
          item={item}
          revealed={revealed}
          isSimilar={isSimilar}
          motTapeParUtilisateur={motTapeParUtilisateur}
          tokenId={tokenId}
          countVisible={compteursVisibles.has(tokenId)}
          onClick={() => {
            if (!revealed && !isSimilar) {
              setCompteursVisibles((prev) => new Set(prev).add(tokenId));
              setTimeout(() => {
                setCompteursVisibles((prev) => {
                  const next = new Set(prev);
                  next.delete(tokenId);
                  return next;
                });
              }, 2500);
            }
          }}
        />
      );
    });
  }

  return (
    <div className="game-container">
      <div className={`toast-notification ${toast ? 'show' : ''} bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700`}>
        <span>{toast?.type === 'error' ? '⚠️' : '💡'}</span>
        <span className="text-sm font-medium">{toast?.message || 'Message de notification'}</span>
      </div>

      <header className="game-header">
        <h1 className="game-title">
          🕵️‍♂️ Technodoo <span className="text-sky-600">Pedentox</span>
        </h1>
        <p className="game-subtitle">Trouvez les concepts clés de notre formation en décodant le texte!</p>
      </header>

      <main className="game-layout">
        <div className="main-content">
          <div className={`${jeuGagne ? '' : 'hidden'} win-banner`}>
            <h2 className="text-2xl font-bold mb-2"> Niveau Réussi !</h2>
            <p className="text-emerald-100 mb-4 font-medium">🎉 VICTOIRE ! La solution était bien : "{levelData.titre}"</p>
            <button onClick={onNextLevel} className="bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-xl font-bold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0">
              Niveau Suivant ➡️
            </button>
          </div>

          <div className="input-section">
            <form onSubmit={verifierMot} className="input-form">
              <input
                type="text"
                placeholder="Proposez un mot..."
                autoComplete="off"
                autoFocus
                value={saisieMot}
                disabled={jeuGagne}
                onChange={(e) => setSaisieMot(e.target.value)}
                className="game-input"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={jeuGagne} className="btn-primary">Tester</button>
                <button type="button" onClick={donnerIndices} className="btn-secondary">Indice</button>
              </div>
            </form>
          </div>

          <div className="text-area">
            <div className="title-zone">{renderTokens(motsDuTitre, 'title')}</div>
            <div className="text-base md:text-lg leading-relaxed text-slate-700">{renderTokens(motsDuTexte, 'body')}</div>
          </div>
        </div>

        <div className="sidebar">
          <div className="stats-grid">
            <div className="stat-card">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Découvertes</p>
              <span className="text-2xl font-black text-slate-700">{motsTrouves.size}</span>
            </div>
            <div className="stat-card">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Essais</p>
              <span className="text-2xl font-black text-slate-700">{historiqueEssais.length}</span>
            </div>
          </div>

          <div className="history-card">
            <h3 className="font-bold text-slate-800 mb-4">Historique des tentatives</h3>
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th className="pb-2">N°</th>
                    <th className="pb-2">Mot</th>
                    <th className="pb-2 text-right">Occurrences</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-slate-600 divide-y divide-slate-50">
                  {historiqueEssais.map((essai, index) => {
                    const colorClass = essai.occurrences > 0 || essai.occurrences === 'Bonus' ? 'text-emerald-600' : 'text-rose-500';
                    return (
                      <tr key={`${essai.mot}-${index}`} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="py-3 px-2 text-slate-400 font-mono">{historiqueEssais.length - index}</td>
                        <td className="py-3 px-2 font-semibold text-slate-700">{essai.mot}</td>
                        <td className={`py-3 px-2 text-right font-bold ${colorClass}`}>{essai.occurrences}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Game;
