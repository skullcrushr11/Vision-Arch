// Tutorial.js
// This file defines a React component that displays a tutorial overlay with instructions on how to use the Furniture Planner website.

import React from "react";
import { X } from "lucide-react";
import "./Tutorial.css";

/**
 * Tutorial React component for displaying a tutorial overlay with usage instructions.
 *
 * @param {function} onClose - Callback function invoked when the "Got it!" button is clicked to close the tutorial.
 * @returns {JSX.Element} A tutorial overlay with instructions and a close button.
 */
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
          <li>
            Use the remove button to remove any object added and the reset
            button to reset the grid.
          </li>
          <li>
            Ensure you leave at least two rows or columns from the edge of the
            grid empty to avoid collision with the wall.
          </li>
          <li>
            <strong style={{ color: "red" }}>
              Once satisfied with your layout, click "SAVE" first, then
              "Export", followed by "Back Home", and finally click the "Explore
              Your House" button to view your 3D layout.
            </strong>
          </li>
        </ol>
        <button onClick={onClose} className="close-button">
          Got it!
        </button>
      </div>
    </div>
  );
};

export default Tutorial;
