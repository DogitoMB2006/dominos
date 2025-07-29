import React from 'react';
import { type PlacedTile } from '../../types/dominoTypes';
import DominoTileComponent from './DominoTileComponent';

interface GameBoardProps {
  placedTiles: PlacedTile[];
  leftEnd: number;
  rightEnd: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ placedTiles, leftEnd, rightEnd }) => {
  if (placedTiles.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-lg">
        <span className="text-white/60 text-lg">Mesa vacía - Esperando primera ficha</span>
      </div>
    );
  }

  const calculateTilePositions = (): { tile: PlacedTile, x: number, y: number, rotation: number }[] => {
    if (placedTiles.length === 0) return [];
    
    const positions: { tile: PlacedTile, x: number, y: number, rotation: number }[] = [];
    let currentX = 0;
    let currentY = 0;
    let direction = 1; // 1 for right, -1 for left
    const maxWidth = 12; // Maximum tiles per row before wrapping
    
    placedTiles.forEach((tile: PlacedTile, index: number) => {
      positions.push({
        tile,
        x: currentX * 80 + (index > maxWidth ? 0 : 0),
        y: currentY * 40 + (Math.floor(index / maxWidth) * 100),
        rotation: tile.rotation
      });
      
      currentX += direction;
      
      // Wrap to next line if we reach max width
      if (Math.abs(currentX) >= maxWidth / 2) {
        currentY += direction;
        currentX = direction > 0 ? -maxWidth / 2 : maxWidth / 2;
        direction *= -1;
      }
    });
    
    return positions;
  };

  const tilePositions = calculateTilePositions();
  const boardWidth = Math.max(800, placedTiles.length * 80 + 200);
  const boardHeight = Math.max(200, Math.ceil(placedTiles.length / 12) * 120 + 200);

  return (
    <div className="relative w-full h-full min-h-96 bg-green-800/30 rounded-2xl border-2 border-green-600/50 overflow-auto">
      <div 
        className="relative mx-auto"
        style={{ 
          width: `${boardWidth}px`, 
          height: `${boardHeight}px`,
          minWidth: '100%',
          minHeight: '100%'
        }}
      >
        {/* Center reference point */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: '50%', top: '50%' }}
        >
          {tilePositions.map(({ tile, x, y, rotation }, index) => (
            <div
              key={tile.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                zIndex: placedTiles.length - index
              }}
            >
              <DominoTileComponent
                tile={{ ...tile, rotation: rotation as 0 | 90 | 180 | 270 }}
                size="medium"
                className="shadow-lg"
              />
            </div>
          ))}
        </div>

        {/* End indicators */}
        {placedTiles.length > 0 && (
          <>
            <div className="absolute top-4 left-4 bg-blue-600/80 text-white px-3 py-1 rounded-lg text-sm font-semibold">
              Extremo Izq: {leftEnd}
            </div>
            <div className="absolute top-4 right-4 bg-red-600/80 text-white px-3 py-1 rounded-lg text-sm font-semibold">
              Extremo Der: {rightEnd}
            </div>
          </>
        )}

        {/* Tile count */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
          Fichas jugadas: {placedTiles.length}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;