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
    console.log('🎯 CLICK EN FICHA:', {
      tile: `${tile.left}-${tile.right}`,
      isCurrentPlayer,
      availableMovesCount: availableMoves.length
    });

    if (!isCurrentPlayer) {
      console.log('❌ No es tu turno, click ignorado');
      return;
    }
    
    // VALIDACIÓN ESTRICTA: Solo fichas jugables
    const move = availableMoves.find(m => m.tile.id === tile.id);
    if (!move) {
      console.log('❌ Ficha no jugable, click ignorado');
      return;
    }

    console.log('✅ Ficha válida encontrada:', move);

    // Auto-determinar lado si solo hay uno disponible
    if (move.sides.length === 1) {
      const side = move.sides[0];
      console.log(`🎯 Auto-seleccionando lado: ${side}`);
      
      setAnimatingTile(tile.id);
      setTimeout(() => {
        onTileSelect(tile, side);
        setAnimatingTile(null);
      }, 300);
    } else {
      // Mostrar selector de lado
      console.log('🤔 Múltiples lados disponibles, mostrando selector');
      setSelectedTile(tile);
    }
  };

  // CORREGIDO: Verificar si una ficha específica es jugable
  const isPlayable = (tile: DominoTile) => {
    if (!isCurrentPlayer) return false;
    return availableMoves.some(m => m.tile.id === tile.id);
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

  // CORREGIDO: Determinar si el jugador está bloqueado
  const isPlayerBlocked = isCurrentPlayer && availableMoves.length === 0;
  const hasPlayableTiles = isCurrentPlayer && availableMoves.length > 0;

  return (
    <div className={getContainerStyle()}>
      {/* Información del jugador mejorada */}
      <div className="text-center mb-2">
        <div className={`
          bg-white/20 backdrop-blur-lg rounded-lg px-3 py-2 border transition-all duration-300
          ${isCurrentPlayer && hasPlayableTiles ? 'bg-green-500/30 border-green-400 animate-pulse' : ''}
          ${isPlayerBlocked ? 'bg-red-500/30 border-red-400' : 'border-white/30'}
        `}>
          <div className="flex items-center space-x-2">
            <span className="text-white font-semibold text-sm">{playerName}</span>
            <span className="text-gray-300 text-xs">({displayedTiles.length})</span>
          </div>
          
          {/* Estado del jugador */}
          <div className="text-xs mt-1">
            {isCurrentPlayer && hasPlayableTiles && (
              <span className="text-green-300 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                Tu turno - {availableMoves.length} jugada{availableMoves.length !== 1 ? 's' : ''}
              </span>
            )}
            {isPlayerBlocked && (
              <span className="text-red-300 flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
                BLOQUEADO
              </span>
            )}
            {!isCurrentPlayer && (
              <span className="text-gray-400">Esperando turno</span>
            )}
          </div>
        </div>
      </div>

      {/* Contenedor de fichas con espaciado mejorado */}
      <div className={`flex ${getHandStyle()} gap-2 max-w-96 p-2`}>
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
                className={`
                  ${isPlayable(tile) ? 'hover:scale-105 hover:shadow-xl' : ''}
                  ${!isPlayable(tile) && isCurrentPlayer ? 'opacity-50' : ''}
                  transition-all duration-200
                `}
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

      {/* CORREGIDO: Selector de lado mejorado */}
      {selectedTile && (
        <div className="absolute z-50 bg-black/90 backdrop-blur-lg rounded-lg p-4 border border-white/30 mt-2 shadow-2xl">
          <p className="text-white text-sm mb-3 text-center">
            Ficha {selectedTile.isDouble ? `Doble ${selectedTile.left}` : `${selectedTile.left}-${selectedTile.right}`}
            <br />
            <span className="text-gray-300">¿En qué extremo colocar?</span>
          </p>
          
          <div className="flex gap-3 justify-center">
            {availableMoves.find(m => m.tile.id === selectedTile.id)?.sides.map(side => (
              <button
                key={side}
                onClick={() => {
                  setAnimatingTile(selectedTile.id);
                  setTimeout(() => {
                    onTileSelect(selectedTile, side);
                    setSelectedTile(null);
                    setAnimatingTile(null);
                  }, 300);
                }}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${side === 'left' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  }
                  hover:scale-105 shadow-lg
                `}
              >
                {side === 'left' ? '← Izquierda' : 'Derecha →'}
              </button>
            ))}
            
            <button
              onClick={() => setSelectedTile(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Debug de movimientos disponibles */}
      {process.env.NODE_ENV === 'development' && isCurrentPlayer && (
        <div className="absolute -bottom-20 left-0 bg-black/80 text-white p-2 rounded text-xs max-w-xs">
          <div className="font-bold">Debug - Movimientos:</div>
          {availableMoves.length === 0 ? (
            <div className="text-red-300">❌ Sin movimientos válidos</div>
          ) : (
            availableMoves.map((move, i) => (
              <div key={i} className="text-green-300">
                ✅ {move.tile.left}-{move.tile.right} → {move.sides.join(', ')}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerHand;