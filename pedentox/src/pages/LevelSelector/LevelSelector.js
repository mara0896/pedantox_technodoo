import { lireNiveauxCompletes } from '../../services/storageService';
import './LevelSelector.css';

function LevelSelector({ levels, onSelectLevel }) {
  const completedLevels = lireNiveauxCompletes();

  const handleRandom = () => {
    const randomIndex = Math.floor(Math.random() * levels.length);
    onSelectLevel(levels[randomIndex].id);
  };

  return (
    <div className="selector-container">
      <div className="selector-header">
        <h2>Sélection du niveau</h2>
        <button 
          onClick={handleRandom}
          className="random-btn"
        >
          Aléatoire 🎲
        </button>
      </div>
      <div className="levels-grid">
        {levels.map((lvl) => {
          const isCompleted = completedLevels.includes(lvl.id);
          return (
            <div 
              key={lvl.id}
              onClick={() => onSelectLevel(lvl.id)}
              className="level-card"
            >
              <div className="level-card-header">
                <span className="level-number">Niveau {lvl.id}</span>
                {isCompleted && <span className="level-completed-icon">✅</span>}
              </div>
              <div className="level-skeleton-line"></div>
              <div className="level-skeleton-line short"></div>
              <div className="level-play-hint">
                Jouer →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LevelSelector;
