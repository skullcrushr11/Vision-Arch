import React from 'react';
import { X } from 'lucide-react';
import './Tutorial.css';

const Tutorial = ({ onClose }) => {
  return (
    <div className="tutorial-overlay">
      <div className="tutorial-content">
        <h2>Welcome to Furniture Planner</h2>
        <p>Here's how to use the website</p>
        <ol>
          <li>Browse and select furniture from the left sidebar.</li>
          <li>Click on the grid to place your chosen furniture.</li>
          <li>Drag furniture items to rearrange them on the grid.</li>
          <li>Use the flip button on each piece to mirror its orientation.</li>
          <li>Adjust room dimensions using the panel on the right.</li>
        </ol>
        <button onClick={onClose} className="close-button">
          Got it!
        </button>
        <button onClick={onClose} className="tutorial-close" aria-label="Close tutorial">
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

export default Tutorial;