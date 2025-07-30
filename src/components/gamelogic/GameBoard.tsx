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
      <div className="flex items-center justify-center w-full h-full min-h-96 border-2 border-dashed border-white/30 rounded-2xl bg-gradient-to-br from-green-800/20 to-green-900/30">
        <div className="text-center p-8">
          <div className="text-6xl mb-4 animate-bounce">🎯</div>
          <h3 className="text-white text-xl font-semibold mb-2">Mesa de Dominó</h3>
          <p className="text-white/70 text-sm">Esperando la primera ficha del juego...</p>
          <div className="mt-4 flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 bg-white/50 rounded-full animate-pulse" 
                style={{animationDelay: `${i * 0.3}s`}}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const calculateBounds = () => {
    if (placedTiles.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    placedTiles.forEach(tile => {
      const tileWidth = (tile.rotation === 90 || tile.rotation === 270) ? 96 : 48;
      const tileHeight = (tile.rotation === 90 || tile.rotation === 270) ? 48 : 96;

      minX = Math.min(minX, tile.x - tileWidth/2);
      maxX = Math.max(maxX, tile.x + tileWidth/2);
      minY = Math.min(minY, tile.y - tileHeight/2);
      maxY = Math.max(maxY, tile.y + tileHeight/2);
    });

    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  };

  const bounds = calculateBounds();
  const containerWidth = Math.max(800, bounds.width + 200);
  const containerHeight = Math.max(500, bounds.height + 200);
  
  const centerOffsetX = -bounds.minX - bounds.width / 2;
  const centerOffsetY = -bounds.minY - bounds.height / 2;

  const getRotationClass = (rotation: number): string => {
    switch (rotation) {
      case 90: return 'rotate-90';
      case 180: return 'rotate-180';
      case 270: return '-rotate-90';
      default: return 'rotate-0';
    }
  };

  return (
    <div className="relative w-full h-full min-h-96 bg-gradient-to-br from-green-800/30 via-green-700/20 to-emerald-900/30 rounded-2xl border-2 border-green-600/50 overflow-hidden shadow-2xl">
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-green-700/30 via-green-600/15 to-green-800/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:50px_50px]"></div>
      </div>
      
      <div 
        className="relative w-full h-full overflow-auto"
        style={{ 
          minWidth: `${Math.min(containerWidth, window.innerWidth - 50)}px`, 
          minHeight: `${Math.min(containerHeight, window.innerHeight - 200)}px`
        }}
      >
        <div 
          className="absolute"
          style={{ 
            left: '50%', 
            top: '50%',
            transform: `translate(${centerOffsetX}px, ${centerOffsetY}px)`
          }}
        >
          {placedTiles.length > 1 && (
            <svg
              className="absolute pointer-events-none"
              style={{
                left: `${-bounds.width/2 - 100}px`,
                top: `${-bounds.height/2 - 100}px`,
                width: `${bounds.width + 200}px`,
                height: `${bounds.height + 200}px`,
                zIndex: 1
              }}
            >
              {placedTiles.slice(1).map((tile, index) => {
                const prevTile = placedTiles[index];
                return (
                  <line
                    key={`connection-${index}`}
                    x1={prevTile.x + bounds.width/2 + 100}
                    y1={prevTile.y + bounds.height/2 + 100}
                    x2={tile.x + bounds.width/2 + 100}
                    y2={tile.y + bounds.height/2 + 100}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                );
              })}
            </svg>
          )}

          {placedTiles.map((tile, index) => {
            const rotationClass = getRotationClass(tile.rotation);
            const isInitial = index === 0;

            return (
              <div
                key={`domino-${tile.id}-${index}`}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  left: `${tile.x}px`,
                  top: `${tile.y}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isInitial ? 20 : 10 + index,
                }}
              >
                <div 
                  className={`${rotationClass} transition-all duration-300`}
                  style={{
                    filter: isInitial 
                      ? 'drop-shadow(0 4px 8px rgba(255,215,0,0.4))' 
                      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}
                >
                  <DominoTileComponent
                    tile={{ ...tile, rotation: 0 }}
                    size="medium"
                    isInitial={isInitial}
                    className={`
                      ${isInitial ? 'ring-2 ring-yellow-400 ring-opacity-60' : ''}
                      ${tile.isDouble ? 'border border-red-300/40' : ''}
                    `}
                  />
                </div>
                
                <div className="absolute -top-3 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10">
                  {index + 1}
                </div>

                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {tile.placedBy.substring(0, 3)}
                </div>

                {isInitial && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                    INICIO
                  </div>
                )}

                {tile.isDouble && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute top-3 left-3 bg-black/80 text-white p-3 rounded-lg">
        <h3 className="font-bold mb-2 text-sm">Estado del Juego</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-blue-500/20 rounded border border-blue-400/30">
            <span>Extremo Izq:</span>
            <span className="font-bold text-blue-300">{leftEnd}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-red-500/20 rounded border border-red-400/30">
            <span>Extremo Der:</span>
            <span className="font-bold text-red-300">{rightEnd}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Fichas:</span>
            <span className="font-bold text-green-300">{placedTiles.length}/28</span>
          </div>
        </div>
      </div>

      {placedTiles.length > 0 && (
        <div className="absolute top-3 right-3 space-y-2">
          <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold">
            ← {leftEnd}
          </div>
          <div className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold">
            {rightEnd} →
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-3 text-sm">
          <span className="text-2xl">🎲</span>
          <div>
            <div className="font-bold">Dominó Lineal</div>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(placedTiles.length / 28) * 100}%` }}
                ></div>
              </div>
              <span className="text-white/90 font-mono">{placedTiles.length}/28</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;