import { useState } from 'react';
import './Navbar.css';

function Navbar({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div 
        className="navbar-logo"
        onClick={() => { onNavigate('home'); setIsOpen(false); }}
      >
        Technodoo
      </div>
      <div className="navbar-menu-container">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="navbar-toggle-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        {isOpen && (
          <div className="navbar-dropdown">
            <button 
              onClick={() => { onNavigate('home'); setIsOpen(false); }}
              className="navbar-dropdown-item"
            >
              Accueil Technodoo
            </button>
            <button 
              onClick={() => { onNavigate('selector'); setIsOpen(false); }}
              className="navbar-dropdown-item"
            >
              Pedentox : Niveaux
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
