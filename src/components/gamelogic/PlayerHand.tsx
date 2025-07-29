import React, { useState } from 'react';
import { type DominoTile } from '../../types/dominoTypes';
import DominoTileComponent from './DominoTileComponent';

interface PlayerHandProps {
  tiles: DominoTile[];
  isCurrentPlayer: boolean;
  availableMoves: { tile: DominoTile, sides: ('left' | 'right')[] }[];
  onTileSelect: (tile: DominoTile, side?: 'left' | 'right') => void;
  position: 'top' | 'right' | 'bottom' | 'left';
  playerName: string;
  tileCount?: number;
  showTiles?: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  tiles,
  isCurrentPlayer,
  availableMoves,
  onTileSelect,
  position,
  playerName,
  tileCount,
  showTiles = true
}) => {
  const [selectedTile, setSelectedTile] = useState<DominoTile | null>(null);
  const [animatingTile, setAnimatingTile] = useState<string | null>(null);

  const handleTileClick = (tile: DominoTile) => {
    if (!isCurrentPlayer) return;
    
    const move = availableMoves.find(m => m.tile.id === tile.id);
    if (!move) return;

    console.log('Tile clicked:', tile.id, 'Available sides:', move.sides);

    // Determinar automáticamente el lado correcto según las reglas del dominó
    const bestSide = determineBestSide(tile, move.sides);
    
    setAnimatingTile(tile.id);
    setTimeout(() => {
      onTileSelect(tile, bestSide);
      setAnimatingTile(null);
    }, 300);
  };

  const determineBestSide = (tile: DominoTile, availableSides: ('left' | 'right')[]): 'left' | 'right' => {
    // Si solo hay un lado disponible, usarlo
    if (availableSides.length === 1) {
      return availableSides[0];
    }

    // Si ambos lados están disponibles, elegir el que haga mejor conexión
    // Esto simula como un jugador real colocaría la ficha
    
    // Por simplicidad, si puede ir a ambos lados, preferir el lado derecho
    // para que el juego fluya naturalmente hacia la derecha
    if (availableSides.includes('right')) {
      return 'right';
    }
    
    return 'left';
  };

  const isPlayable = (tile: DominoTile) => {
    return isCurrentPlayer && availableMoves.some(m => m.tile.id === tile.id);
  };

  const getHandStyle = () => {
    switch (position) {
      case 'top':
        return 'flex-row justify-center items-start';
      case 'bottom':
        return 'flex-row justify-center items-end';
      case 'left':
        return 'flex-col justify-center items-start';
      case 'right':
        return 'flex-col justify-center items-end';
    }
  };

  const getContainerStyle = () => {
    switch (position) {
      case 'top':
        return 'absolute top-4 left-1/2 transform -translate-x-1/2 z-30';
      case 'bottom':
        return 'absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30';
      case 'left':
        return 'absolute left-4 top-1/2 transform -translate-y-1/2 z-30';
      case 'right':
        return 'absolute right-4 top-1/2 transform -translate-y-1/2 z-30';
    }
  };

  const displayedTiles = showTiles ? tiles : Array(tileCount || tiles.length).fill(null).map((_, index) => ({ 
    id: `back-${index}`, 
    left: 0, 
    right: 0, 
    isDouble: false, 
    rotation: 0 as const 
  }));

  const isPlayerBlocked = !showTiles && isCurrentPlayer && availableMoves.length === 0;

  return (
    <div className={getContainerStyle()}>
      <div className="text-center mb-2">
        <div className={`
          bg-white/20 backdrop-blur-lg rounded-lg px-3 py-1 border border-white/30
          ${isCurrentPlayer ? 'bg-yellow-500/30 border-yellow-400' : ''}
          ${isPlayerBlocked ? 'bg-red-500/30 border-red-400' : ''}
        `}>
          <span className="text-white font-semibold text-sm">{playerName}</span>
          <span className="text-gray-300 text-xs ml-2">({displayedTiles.length})</span>
          {isCurrentPlayer && (
            <span className="text-yellow-300 text-xs ml-2">Tu turno</span>
          )}
          {isPlayerBlocked && (
            <span className="text-red-300 text-xs ml-2">BLOQUEADO</span>
          )}
        </div>
      </div>

      <div className={`flex ${getHandStyle()} gap-1 max-w-96`}>
        {displayedTiles.map((tile, index) => (
          <div 
            key={tile.id || `tile-${index}`}
            className={`transition-all duration-300 ${
              animatingTile === tile.id ? 'scale-110 translate-y-2 opacity-70' : ''
            }`}
          >
            {showTiles ? (
              <DominoTileComponent
                tile={tile}
                isPlayable={isPlayable(tile)}
                isSelected={selectedTile?.id === tile.id}
                onClick={() => handleTileClick(tile)}
                size="medium"
                className={isPlayable(tile) ? 'hover:scale-105 hover:shadow-xl cursor-pointer' : ''}
              />
            ) : (
              <DominoTileComponent
                tile={tile}
                showBack={true}
                size="medium"
              />
            )}
          </div>
        ))}
      </div>

      {selectedTile && (
        <div className="absolute z-50 bg-black/80 backdrop-blur-lg rounded-lg p-4 border border-white/30 mt-2">
          <p className="text-white text-sm mb-3">¿En qué lado colocar la ficha?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAnimatingTile(selectedTile.id);
                setTimeout(() => {
                  onTileSelect(selectedTile, 'left');
                  setSelectedTile(null);
                  setAnimatingTile(null);
                }, 300);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              Izquierda
            </button>
            <button
              onClick={() => {
                setAnimatingTile(selectedTile.id);
                setTimeout(() => {
                  onTileSelect(selectedTile, 'right');
                  setSelectedTile(null);
                  setAnimatingTile(null);
                }, 300);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              Derecha
            </button>
            <button
              onClick={() => { setSelectedTile(null); }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerHand;