// Grid.js
/**
Grid Component for Interactive Furniture Placement

This component creates an interactive grid system for designing room layouts.
It allows users to add, move, rotate, and remove furniture items on a grid-based canvas.

Features:
- Dynamic grid generation based on width and height
- Furniture placement with collision detection
- Drag and drop functionality for furniture positioning
- Rotation and removal of furniture items
- Optional grid overlay for precise placement

The component manages furniture positions, handles user interactions,
and provides callbacks for furniture manipulation events.
*/

import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import { FlipHorizontal, RotateCw, X } from "lucide-react";
import "./grid.css";
import { bleach } from "three/webgpu";

/**
 * Grid component for placing and managing furniture items in a room layout.
 *
 * @param {Object} props - Component properties
 * @param {number} props.width - Total width of the grid
 * @param {number} props.height - Total height of the grid
 * @param {Object} props.selectedFurniture - Currently selected furniture item
 * @param {Array} props.furniturePositions - List of furniture items placed on the grid
 * @param {Function} props.onFurnitureAdd - Callback when furniture is added to the grid
 * @param {Function} props.onFurnitureMove - Callback when furniture is moved or modified
 * @param {Function} props.onFurnitureRemove - Callback when furniture is removed
 * @param {Function} props.onFurnitureRotate - Callback when furniture is rotated
 * @param {boolean} props.showGrid - Flag to show/hide grid overlay
 * @returns {React.Element} Rendered grid component with furniture placement capabilities
 */
export default function Grid({
  width,
  height,
  selectedFurniture,
  furniturePositions,
  onFurnitureAdd,
  onFurnitureMove,
  onFurnitureRemove,
  onFurnitureRotate,
  showGrid,
}) {
  const [rows, setRows] = useState(Math.floor(height / 50));
  const [columns, setColumns] = useState(Math.floor(width / 50));
  const CELL_SIZE = 60;

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

    if (
      startRow < 2 ||
      startRow >= rows - 2 ||
      startCol < 2 ||
      startCol >= columns - 2
    ) {
      alert("Cannot place furniture here.");
      return;
    }

    const { model_name, model_size, model_picture, initial_rotation } =
      selectedFurniture;
    const [furnitureWidth, furnitureHeight] = model_size;

    if (
      startRow + furnitureHeight > rows ||
      startCol + furnitureWidth > columns
    ) {
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
      rotation: initial_rotation || 0,
      initial_rotation: initial_rotation || 0,
    };

    onFurnitureAdd(newFurniture);
  };

  const isAreaOccupied = (
    startRow,
    startCol,
    width,
    height,
    excludeId = null
  ) => {
    return furniturePositions.some((furniture) => {
      if (furniture.id === excludeId) return false;

      const furnitureStartRow = Math.floor(rows / 2) - furniture.y;
      const furnitureStartCol = furniture.x + Math.floor(columns / 2);
      const furnitureEndRow = furnitureStartRow + furniture.height;
      const furnitureEndCol = furnitureStartCol + furniture.width;
      const newFurnitureEndRow = startRow + height;
      const newFurnitureEndCol = startCol + width;

      return (
        startRow < furnitureEndRow &&
        newFurnitureEndRow > furnitureStartRow &&
        startCol < furnitureEndCol &&
        newFurnitureEndCol > furnitureStartCol
      );
    });
  };

  const handleDragStop = (furnitureId, e, data) => {
    const { x, y } = convertGridToActual(
      Math.round(data.x / CELL_SIZE),
      Math.round(data.y / CELL_SIZE)
    );
    const furniture = furniturePositions.find((f) => f.id === furnitureId);

    if (
      x < -Math.floor(columns / 2) ||
      y < -Math.floor(rows / 2) ||
      x + furniture.width > Math.floor(columns / 2) ||
      y - furniture.height < -Math.floor(rows / 2) ||
      isAreaOccupied(
        Math.floor(rows / 2) - y,
        x + Math.floor(columns / 2),
        furniture.width,
        furniture.height,
        furnitureId
      )
    ) {
      return;
    }

    onFurnitureMove(furnitureId, { x, y });
  };

  const handleFlip = (furnitureId, e) => {
    e.stopPropagation();
    const furniture = furniturePositions.find((f) => f.id === furnitureId);
    const newFlipped = !furniture.flipped;
    onFurnitureMove(furnitureId, { flipped: newFlipped });
  };

  const handleRotate = (furnitureId, e) => {
    e.stopPropagation();
    const furniture = furniturePositions.find((f) => f.id === furnitureId);
    const currentRotation = furniture.rotation || 0;
    const initialRotation = furniture.initial_rotation || 0;
    const newRotation =
      ((currentRotation - initialRotation + 90) % 360) + initialRotation;
    onFurnitureMove(furnitureId, { rotation: newRotation });
  };

  const handleRemove = (furnitureId, e) => {
    e.stopPropagation();
    onFurnitureRemove(furnitureId);
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
              const isRedCell =
                rowIndex < 2 ||
                rowIndex >= rows - 2 ||
                colIndex < 2 ||
                colIndex >= columns - 2;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`grid-cell ${isRedCell ? "red-cell" : ""}`}
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
          position={{
            x: (furniture.x + Math.floor(columns / 2)) * CELL_SIZE,
            y: (Math.floor(rows / 2) - furniture.y) * CELL_SIZE,
          }}
          onStop={(e, data) => handleDragStop(furniture.id, e, data)}
        >
          <div
            className="furniture-item"
            style={{
              width: `${furniture.width * CELL_SIZE}px`,
              height: `${furniture.height * CELL_SIZE}px`,
              position: "absolute",
              cursor: "move",
            }}
          >
            {/* Furniture Image Container */}
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                backgroundImage: `url(${furniture.model_picture})`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transform: `rotate(${furniture.rotation || 0}deg) scaleX(${
                  furniture.flipped ? -1 : 1
                })`,
                transformOrigin: "center center",
              }}
            />

            {/* Control Buttons */}
            <div
              style={{
                position: "absolute",
                top: "-30px",
                right: 0,
                display: "flex",
                gap: "4px",
                zIndex: 1000,
                transform: "rotate(0deg)", // Keep controls unrotated
              }}
            >
              {/* <button
                onClick={(e) => handleFlip(furniture.id, e)}
                style={{
                  width: "24px",
                  height: "24px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "50%",
                  cursor: "pointer",
                  color: "black",
                }}
              >
                <FlipHorizontal size={14} />
              </button> */}
              <button
                onClick={(e) => handleRotate(furniture.id, e)}
                style={{
                  width: "24px",
                  height: "24px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "50%",
                  cursor: "pointer",
                  color: "black",
                }}
              >
                <RotateCw size={14} />
              </button>
              <button
                onClick={(e) => handleRemove(furniture.id, e)}
                style={{
                  width: "24px",
                  height: "24px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ff4444",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              >
                <X size={14} color="black" />
              </button>
            </div>
          </div>
        </Draggable>
      ))}
    </div>
  );
}
