import React from 'react';
import { Undo, Redo, Save, Upload, Download, Grid, Ruler } from 'lucide-react';
import './Toolbar.css';

const Toolbar = ({ onUndo, onRedo, onSave, onLoad, onExport, onToggleGrid, onToggleUnit, showGrid, unit }) => {
  return (
    <div className="toolbar">
      <button onClick={onSave} title="Save Layout" className="toolbar-button">
        <Save size={20} />
        <span className="button-text">Save</span>
      </button>
      <button onClick={onLoad} title="Load Layout" className="toolbar-button">
        <Upload size={20} />
        <span className="button-text">Load</span>
      </button>
      <button onClick={onExport} title="Export Layout" className="toolbar-button">
        <Download size={20} />
        <span className="button-text">Export</span>
      </button>
      <button onClick={onToggleGrid} title="Toggle Grid" className="toolbar-button">
        <Grid size={20} />
        <span className="button-text">{showGrid ? 'Hide Grid' : 'Show Grid'}</span>
      </button>
      {/* <button onClick={onToggleUnit} title="Toggle Unit" className="toolbar-button">
        <Ruler size={20} />
        <span className="button-text">{unit === 'cm' ? 'To Inches' : 'To CM'}</span>
      </button> */}
    </div>
  );
};

export default Toolbar;