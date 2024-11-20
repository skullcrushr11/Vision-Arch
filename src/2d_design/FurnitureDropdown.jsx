// FurnitureDropdown.js
// This file defines a dropdown component for selecting furniture models from a list.
// It includes a search feature to filter the models by name.

import React, { useState } from "react";
import "./FurnitureDropdown.css";

/**
 * Dropdown component for selecting furniture models with search functionality.
 *
 * @param {Object} props - The props for the component.
 * @param {Object} props.models - The collection of furniture models.
 * @param {Function} props.onSelect - Callback function when a model is selected.
 *
 * @returns {JSX.Element} The furniture selection dropdown UI.
 */
export default function FurnitureDropdown({ models, onSelect }) {
  const [searchText, setSearchText] = useState("");

  /**
   * Filters the list of models based on the search text.
   *
   * @returns {Array} The list of filtered model names.
   */
  const filteredModels = Object.keys(models).filter((modelName) =>
    modelName.toLowerCase().includes(searchText.toLowerCase())
  );

  /**
   * Handles changes in the search input field.
   *
   * @param {Object} e - The event object from the input field.
   */
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  return (
    <div className="furniture-dropdown">
      <input
        type="text"
        placeholder="Search furniture..."
        value={searchText}
        onChange={handleSearchChange}
        className="furniture-search"
      />
      <div className="furniture-list">
        {filteredModels.map((modelName, index) => (
          <button
            key={index}
            className="furniture-item"
            onClick={() => onSelect(modelName)}
          >
            <img
              src={models[modelName].model_picture}
              alt={modelName}
              className="furniture-image"
            />
            <span className="furniture-name">{modelName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
