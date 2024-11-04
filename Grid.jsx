import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { FlipHorizontal } from 'lucide-react';
import './grid.css';

const Grid = ({ width, height, selectedFurniture, furniturePositions, onFurnitureAdd, onFurnitureMove, showGrid }) => {
  const [rows, setRows] = useState(Math.floor(height / 50));
  const [columns, setColumns] = useState(Math.floor(width / 50));
  const CELL_SIZE = 50;

  useEffect(() => {
    const newRows = Math.floor(height / CELL_SIZE);
    const newColumns = Math.floor(width / CELL_SIZE);
    setRows(newRows);
    setColumns(newColumns);
  }, [width, height]);

  function convertGridToActual(gridX, gridY) {
    const actualX = gridX - Math.floor(columns / 2);
    const actualY = Math.floor(rows / 2) - gridY;
    return { x: actualX, y: actualY };
  }

  const handleCellClick = (startRow, startCol) => {
    if (!selectedFurniture) return;

    const { model_name, model_size, model_picture } = selectedFurniture;
    const [furnitureWidth, furnitureHeight] = model_size;

    if (startRow + furnitureHeight > rows || startCol + furnitureWidth > columns) {
      alert("This item can't be placed here as it exceeds grid bounds.");
      return;
    }

    if (isAreaOccupied(startRow, startCol, furnitureWidth, furnitureHeight)) {
      alert("Some of these cells are already occupied!");
      return;
    }

    const { x, y } = convertGridToActual(startCol, startRow);
    const newFurniture = {
      id: Date.now(),
      model_name,
      model_picture,
      x,
      y,
      width: furnitureWidth,
      height: furnitureHeight,
      flipped: false,
    };

    onFurnitureAdd(newFurniture);
  };

  const isAreaOccupied = (startRow, startCol, width, height, excludeId = null) => {
    return furniturePositions.some(furniture => {
      if (furniture.id === excludeId) return false;

      const furnitureEndRow = furniture.row + furniture.height;
      const furnitureEndCol = furniture.col + furniture.width;
      const newFurnitureEndRow = startRow + height;
      const newFurnitureEndCol = startCol + width;

      return (
        startRow < furnitureEndRow &&
        newFurnitureEndRow > furniture.row &&
        startCol < furnitureEndCol &&
        newFurnitureEndCol > furniture.col
      );
    });
  };

  const handleDragStop = (furnitureId, e, data) => {
    const { x, y } = convertGridToActual(Math.round(data.x / CELL_SIZE), Math.round(data.y / CELL_SIZE));
    const furniture = furniturePositions.find(f => f.id === furnitureId);

    if (
      x < -Math.floor(columns / 2) ||
      y < -Math.floor(rows / 2) ||
      x + furniture.width > Math.floor(columns / 2) ||
      y - furniture.height < -Math.floor(rows / 2) ||
      isAreaOccupied(Math.round(data.y / CELL_SIZE), Math.round(data.x / CELL_SIZE), furniture.width, furniture.height, furnitureId)
    ) {
      return;
    }

    onFurnitureMove(furnitureId, { x, y });
  };

  const handleFlip = (furnitureId) => {
    const furniture = furniturePositions.find(f => f.id === furnitureId);
    const newFlipped = !furniture.flipped;
    onFurnitureMove(furnitureId, { flipped: newFlipped });
  };

  return (
    <div 
      className="grid-container"
      style={{ 
        width: `${columns * CELL_SIZE}px`, 
        height: `${rows * CELL_SIZE}px`,
      }}
    >
      {showGrid && (
        <div className="grid-overlay">
          <div 
            className="grid"
            style={{ 
              gridTemplateColumns: `repeat(${columns}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
            }}
          >
            {Array.from({ length: rows * columns }).map((_, index) => {
              const rowIndex = Math.floor(index / columns);
              const colIndex = index % columns;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="grid-cell"
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                />
              );
            })}
          </div>
        </div>
      )}
      {furniturePositions.map((furniture) => (
        <Draggable
          key={furniture.id}
          bounds="parent"
          grid={[CELL_SIZE, CELL_SIZE]}
          position={{ x: (furniture.x + Math.floor(columns / 2)) * CELL_SIZE, y: (Math.floor(rows / 2) - furniture.y) * CELL_SIZE }}
          onStop={(e, data) => handleDragStop(furniture.id, e, data)}
        >
          <div
            className="furniture-item"
            style={{
              width: `${furniture.width * CELL_SIZE}px`,
              height: `${furniture.height * CELL_SIZE}px`,
              position: 'absolute',
              zIndex: 10,
              cursor: 'move',
              display: 'grid',
              gridTemplateColumns: `repeat(${furniture.width}, 1fr)`,
              gridTemplateRows: `repeat(${furniture.height}, 1fr)`,
            }}
          >
            <div 
              className="furniture-image-container"
              style={{
                gridColumn: `1 / span ${furniture.width}`,
                gridRow: `1 / span ${furniture.height}`,
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            >
              <img
                src={furniture.model_picture}
                alt={furniture.model_name}
                className="furniture-image"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: furniture.flipped ? 'scaleX(-1)' : 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              />
              <button
                className="flip-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip(furniture.id);
                }}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-2px',
                  zIndex: 15,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '50%',
                }}
              >
                <FlipHorizontal size={16} />
              </button>
            </div>
          </div>
        </Draggable>
      ))}
    </div>
  );
};

export default Grid;
