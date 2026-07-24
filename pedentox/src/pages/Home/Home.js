import React from 'react';
import './Home.css';

function Home({ onSelectGame }) {
  const games = [
    {
      id: 'pedentox',
      name: 'Pedentox',
      description: 'Le jeu de décodage de texte inspiré de la formation Odoo.',
      icon: '🕵️‍♂️'
    }
  ];

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Technodoo</h1>
        <p>Sélectionnez un jeu pour commencer</p>
      </header>
      
      <div className="games-grid">
        {games.map(game => (
          <div 
            key={game.id} 
            className="game-card"
            onClick={() => onSelectGame(game.id)}
          >
            <div className="game-icon">{game.icon}</div>
            <div className="game-info">
              <h3>{game.name}</h3>
              <p>{game.description}</p>
            </div>
            <div className="game-action">
              Jouer maintenant →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
