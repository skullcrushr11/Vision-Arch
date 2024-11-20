// Toolbar.js
// This file defines a React component for rendering a toolbar with buttons for various actions like saving, loading, exporting, and resetting layouts.

import React from "react";
import {
  Save,
  Upload,
  Download,
  Grid,
  Ruler,
  RotateCcw,
  Home,
} from "lucide-react";
import "./Toolbar.css";

/**
 * Toolbar React component for rendering a set of buttons that trigger layout-related actions.
 *
 * @param {function} onSave - Callback function invoked when the "Save" button is clicked.
 * @param {function} onLoad - Callback function invoked when the "Load" button is clicked.
 * @param {function} onExport - Callback function invoked when the "Export" button is clicked.
 * @param {function} onHomeClick - Callback function invoked when the "Back Home" button is clicked.
 * @param {function} onReset - Callback function invoked when the "Reset Grid" button is clicked.
 * @param {boolean} showGrid - Determines whether the grid is shown (currently unused).
 * @param {string} unit - Represents the current unit of measurement (currently unused).
 * @returns {JSX.Element} A toolbar UI with multiple action buttons.
 */
const Toolbar = ({
  onSave,
  onLoad,
  onExport,
  onHomeClick,
  onReset,
  showGrid,
  unit,
}) => {
  return (
    <div className="toolbar">
      <button
        onClick={onHomeClick}
        className="toolbar-button"
        title="Back Home"
        aria-label="Back Home"
      >
        <Home size={20} color={"#4CAF50"} /> Back Home
      </button>
      <button
        onClick={onSave}
        className="toolbar-button"
        title="Save Layout"
        aria-label="Save Layout"
      >
        <Save size={20} /> Save
      </button>
      <button
        onClick={onExport}
        className="toolbar-button"
        title="Export Layout"
        aria-label="Export Layout"
      >
        <Upload size={20} /> Export
      </button>
      <button
        onClick={onLoad}
        className="toolbar-button"
        title="Load Layout"
        aria-label="Load Layout"
      >
        <Download size={20} /> Load
      </button>
      <button
        onClick={onReset}
        className="toolbar-button"
        title="Reset Grid"
        aria-label="Reset Grid"
      >
        <RotateCcw size={20} /> Reset
      </button>
    </div>
  );
};

export default Toolbar;
