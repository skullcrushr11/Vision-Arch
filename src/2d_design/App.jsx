// App.js
// This file defines the main React component for the Furniture Planner application.
// It handles the application's state, user interactions, and layout rendering.

import React, { useState, useEffect, useCallback } from "react";
import models from "../json/models.json";
import FurnitureDropdown from "./FurnitureDropdown.jsx";
import Toolbar from "./Toolbar.jsx";
import Tutorial from "./Tutorial.jsx";
import Grid from "./Grid.jsx";
import "./App.css";

/**
 * Main application component for managing furniture planning, user interactions, and layout state.
 *
 * @returns {JSX.Element} The main application UI.
 */
export default function App() {
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [roomWidth, setRoomWidth] = useState(1000);
  const [roomHeight, setRoomHeight] = useState(1000);
  const [furniturePositions, setFurniturePositions] = useState([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [unit, setUnit] = useState("cm");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  /**
   * Automatically saves the current layout to local storage.
   */
  const autoSave = useCallback(() => {
    const layout = {
      furniturePositions,
      roomWidth,
      roomHeight,
    };
    localStorage.setItem("autoSavedLayout", JSON.stringify(layout));
  }, [furniturePositions, roomWidth, roomHeight]);

  useEffect(() => {
    const savedLayout = localStorage.getItem("autoSavedLayout");
    if (savedLayout) {
      const layout = JSON.parse(savedLayout);
      setFurniturePositions(layout.furniturePositions);
      setRoomWidth(layout.roomWidth);
      setRoomHeight(layout.roomHeight);
      addToHistory(layout);
    }
  }, []);

  useEffect(() => {
    autoSave();
  }, [furniturePositions, roomWidth, roomHeight, autoSave]);

  /**
   * Updates the selected furniture model.
   *
   * @param {string} modelName - The name of the selected furniture model.
   */
  const handleFurnitureSelect = (modelName) => {
    const furnitureData = models[modelName];
    if (furnitureData) {
      setSelectedFurniture({
        model_name: modelName,
        ...furnitureData,
      });
    }
  };

  /**
   * Updates room dimensions and logs changes to history.
   *
   * @param {string} dimension - The dimension being updated ('width' or 'height').
   * @param {number} value - The new dimension value.
   */
  const handleRoomDimensionChange = (dimension, value) => {
    if (dimension === "width") {
      setRoomWidth(value);
    } else if (dimension === "height") {
      setRoomHeight(value);
    }
    addToHistory();
  };

  /**
   * Adds new furniture to the grid and logs the change.
   *
   * @param {object} newFurniture - The new furniture object to add.
   */
  const handleFurnitureAdd = (newFurniture) => {
    setFurniturePositions((prevPositions) => [
      ...prevPositions,
      { ...newFurniture, rotation: 0 },
    ]);
    addToHistory();
  };

  /**
   * Moves existing furniture to a new position and updates its state.
   *
   * @param {number} id - The ID of the furniture to move.
   * @param {object} newPosition - The new position of the furniture.
   */
  const handleFurnitureMove = (id, newPosition) => {
    setFurniturePositions((prevPositions) => {
      return prevPositions.map((furniture) =>
        furniture.id === id ? { ...furniture, ...newPosition } : furniture
      );
    });
    addToHistory();
  };

  /**
   * Rotates furniture by 90 degrees clockwise and logs the change.
   *
   * @param {number} id - The ID of the furniture to rotate.
   */
  const handleFurnitureRotate = (id) => {
    setFurniturePositions((prevPositions) =>
      prevPositions.map((furniture) =>
        furniture.id === id
          ? { ...furniture, rotation: ((furniture.rotation || 0) + 90) % 360 }
          : furniture
      )
    );
    addToHistory();
  };

  /**
   * Removes furniture from the grid by ID and logs the change.
   *
   * @param {number} id - The ID of the furniture to remove.
   */
  const handleFurnitureRemove = (id) => {
    setFurniturePositions((prevPositions) =>
      prevPositions.filter((furniture) => furniture.id !== id)
    );
    addToHistory();
  };

  /**
   * Closes the tutorial overlay.
   */
  const closeTutorial = () => {
    setShowTutorial(false);
  };

  /**
   * Adds the current state to the history stack.
   *
   * @param {object} [state] - Optional state to add to history.
   */
  const addToHistory = (state = null) => {
    const newState = state || {
      furniturePositions,
      roomWidth,
      roomHeight,
    };
    setHistory((prevHistory) => [
      ...prevHistory.slice(0, historyIndex + 1),
      newState,
    ]);
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };

  /**
   * Toggles the visibility of the grid overlay.
   */
  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  /**
   * Saves the current layout to local storage and shows a confirmation alert.
   */
  const saveLayout = () => {
    const layout = { furniturePositions, roomWidth, roomHeight };
    localStorage.setItem("savedLayout", JSON.stringify(layout));
    alert("Layout saved successfully!");
  };

  /**
   * Loads a saved layout from local storage and applies it to the state.
   */
  const loadLayout = () => {
    const savedLayout = localStorage.getItem("savedLayout");
    if (savedLayout) {
      const layout = JSON.parse(savedLayout);
      setFurniturePositions(layout.furniturePositions);
      setRoomWidth(layout.roomWidth);
      setRoomHeight(layout.roomHeight);
      addToHistory(layout);
    } else {
      alert("No saved layout found.");
    }
  };

  /**
   * Converts grid positions to export format.
   *
   * @param {Array} furniturePositions - The list of furniture positions.
   * @returns {Array} The converted positions.
   */
  const convertGridToExport = (furniturePositions) => {
    return furniturePositions.map((furniture) => ({
      ...furniture,
      x: furniture.x,
      y: -furniture.y,
    }));
  };

  /**
   * Exports the current layout to local storage in a 3D-ready format.
   */
  const exportLayout = () => {
    const furnitureWithLocation = convertGridToExport(furniturePositions).map(
      (furniture) => {
        const modelData = models[furniture.model_name] || {};
        return {
          ...furniture,
          file_location: modelData.file_location || "",
          scaling_factor: modelData.scaling_factor || 1,
          upwards: modelData.upwards || 0.01,
        };
      }
    );

    const layout = {
      furniturePositions: furnitureWithLocation,
      roomWidth,
      roomHeight,
    };
    try {
      localStorage.setItem("layoutData", JSON.stringify(layout));
      alert("Layout saved to localStorage successfully!");
    } catch (error) {
      console.error("Error saving layout to localStorage:", error);
    }
  };

  /**
   * Resets the grid and room dimensions to their default state.
   */
  const resetGrid = () => {
    setFurniturePositions([]);
    setRoomWidth(1000);
    setRoomHeight(1000);
    addToHistory({ furniturePositions: [], roomWidth: 1000, roomHeight: 1000 });
    localStorage.removeItem("autoSavedLayout");
  };

  /**
   * Reloads the page to reset the application state.
   */
  const onHomeClick = () => {
    window.location.reload();
  };

  return (
    <div className="app-wrapper">
      {showTutorial && <Tutorial onClose={closeTutorial} />}
      <Toolbar
        onSave={saveLayout}
        onLoad={loadLayout}
        onExport={exportLayout}
        onToggleGrid={toggleGrid}
        onReset={resetGrid}
        onHomeClick={onHomeClick}
        unit={unit}
      />
      <div className="app-container">
        <aside className="sidebar wide-sidebar">
          <h2 className="sidebar-title">Furniture Planner</h2>
          <FurnitureDropdown models={models} onSelect={handleFurnitureSelect} />
        </aside>

        <main className="main-content">
          <Grid
            width={1.2 * roomWidth}
            height={1.2 * roomHeight}
            selectedFurniture={selectedFurniture}
            furniturePositions={furniturePositions}
            onFurnitureAdd={handleFurnitureAdd}
            onFurnitureMove={handleFurnitureMove}
            onFurnitureRemove={handleFurnitureRemove}
            onFurnitureRotate={handleFurnitureRotate}
            showGrid={showGrid}
          />
        </main>
      </div>
    </div>
  );
}
