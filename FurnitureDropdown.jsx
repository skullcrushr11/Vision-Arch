import React, { useState } from 'react';
import './FurnitureDropdown.css';

export default function FurnitureDropdown({ models, onSelect }) {
  const [searchText, setSearchText] = useState('');

  const filteredModels = Object.keys(models).filter((modelName) =>
    modelName.toLowerCase().includes(searchText.toLowerCase())
  );

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