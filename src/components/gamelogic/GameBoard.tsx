import React from 'react';
import { type PlacedTile } from '../../types/dominoTypes';
import DominoTileComponent from './DominoTileComponent';

interface GameBoardProps {
  placedTiles: PlacedTile[];
  leftEnd: number;
  rightEnd: number;
}

interface AdvancedTilePosition {
  x: number;
  y: number;
  rotation: number;
  isInitial: boolean;
  direction: 'horizontal' | 'vertical';
  flowDirection: 'right' | 'left' | 'down' | 'up';
  connectedTo: string | null;
}

class AntiOverlapDominoLayout {
  private static readonly TILE_WIDTH = 48;
  private static readonly TILE_HEIGHT = 96;
  private static readonly SPACING = 16;
  private static readonly MAX_WIDTH = 480;

  static calculateAntiOverlapLayout(placedTiles: PlacedTile[]): Map<string, AdvancedTilePosition> {
    const positions = new Map<string, AdvancedTilePosition>();
    const occupiedPositions = new Set<string>();
    
    if (placedTiles.length === 0) return positions;

    const firstTile = placedTiles[0];
    
    positions.set(firstTile.id, {
      x: 0,
      y: 0,
      rotation: firstTile.isDouble ? 90 : 0,
      isInitial: true,
      direction: firstTile.isDouble ? 'vertical' : 'horizontal',
      flowDirection: 'right',
      connectedTo: null
    });
    
    occupiedPositions.add(this.positionKey(0, 0));

    let currentX = 0;
    let currentY = 0;
    let currentFlow: 'right' | 'left' | 'down' | 'up' = 'right';
    let leftmostX = 0;
    let rightmostX = 0;

    console.log('🎯 Iniciando layout anti-solapamiento...');

    for (let i = 1; i < placedTiles.length; i++) {
      const tile = placedTiles[i];
      const previousTile = placedTiles[i - 1];
      
      console.log(`🔧 Procesando ficha ${i}: ${tile.left}-${tile.right}, side: ${tile.connectedSide}`);

      const newPosition = this.calculateSafePosition(
        tile,
        currentX,
        currentY,
        currentFlow,
        leftmostX,
        rightmostX,
        occupiedPositions
      );

      const safePosition = this.ensureNoOverlap(newPosition, occupiedPositions, tile.id);

      positions.set(tile.id, {
        x: safePosition.x,
        y: safePosition.y,
        rotation: safePosition.rotation,
        isInitial: false,
        direction: safePosition.direction,
        flowDirection: safePosition.flowDirection,
        connectedTo: previousTile.id
      });

      occupiedPositions.add(this.positionKey(safePosition.x, safePosition.y));

      currentX = safePosition.x;
      currentY = safePosition.y;
      currentFlow = safePosition.flowDirection;
      
      if (safePosition.x < leftmostX) leftmostX = safePosition.x;
      if (safePosition.x > rightmostX) rightmostX = safePosition.x;

      console.log(`✅ Ficha ${i} colocada en:`, safePosition);
    }

    this.debugOverlaps(positions);

    return positions;
  }

  private static calculateSafePosition(
    tile: PlacedTile,
    currentX: number,
    currentY: number,
    currentFlow: 'right' | 'left' | 'down' | 'up',
    leftmostX: number,
    rightmostX: number,
    occupiedPositions: Set<string>
  ): {
    x: number,
    y: number,
    rotation: number,
    direction: 'horizontal' | 'vertical',
    flowDirection: 'right' | 'left' | 'down' | 'up'
  } {
    
    let newX = currentX;
    let newY = currentY;
    let rotation = 0;
    let direction: 'horizontal' | 'vertical' = 'horizontal';
    let newFlow = currentFlow;

    const side = tile.connectedSide;
    const spacing = this.SPACING;
    const tileLength = this.TILE_WIDTH;

    if (tile.isDouble) {
      rotation = 90;
      direction = 'vertical';
    }

    switch (currentFlow) {
      case 'right':
        if (side === 'right') {
          newX = currentX + tileLength + spacing;
        } else {
          newX = currentX - tileLength - spacing;
        }
        if (!tile.isDouble) {
          rotation = 0;
          direction = 'horizontal';
        }
        break;

      case 'left':
        if (side === 'left') {
          newX = currentX - tileLength - spacing;
        } else {
          newX = currentX + tileLength + spacing;
        }
        if (!tile.isDouble) {
          rotation = 0;
          direction = 'horizontal';
        }
        break;

      case 'down':
        newY = currentY + tileLength + spacing;
        if (!tile.isDouble) {
          rotation = 90;
          direction = 'vertical';
        }
        break;

      case 'up':
        newY = currentY - tileLength - spacing;
        if (!tile.isDouble) {
          rotation = 270;
          direction = 'vertical';
        }
        break;
    }

    if (Math.abs(newX) > this.MAX_WIDTH / 2) {
      console.log(`📐 Límite alcanzado en X: ${newX}, cambiando dirección...`);
      
      if (currentFlow === 'right') {
        newX = Math.min(rightmostX, this.MAX_WIDTH / 2 - 20);
        newY = currentY + this.TILE_HEIGHT + spacing * 2;
        newFlow = 'down';
        rotation = tile.isDouble ? 90 : 90;
        direction = 'vertical';
        console.log('🔄 Girando de RIGHT a DOWN');
      } else if (currentFlow === 'left') {
        newX = Math.max(leftmostX, -this.MAX_WIDTH / 2 + 20);
        newY = currentY - this.TILE_HEIGHT - spacing * 2;
        newFlow = 'up';
        rotation = tile.isDouble ? 90 : 270;
        direction = 'vertical';
        console.log('🔄 Girando de LEFT a UP');
      }
    }

    if (!tile.isDouble) {
      switch (newFlow) {
        case 'right':
        case 'left':
          rotation = 0;
          direction = 'horizontal';
          break;
        case 'down':
          rotation = 90;
          direction = 'vertical';
          break;
        case 'up':
          rotation = 270;
          direction = 'vertical';
          break;
      }
    }

    console.log(`🎯 Posición calculada: (${newX}, ${newY}), flujo: ${newFlow}, rotación: ${rotation}`);

    return {
      x: newX,
      y: newY,
      rotation,
      direction,
      flowDirection: newFlow
    };
  }


  private static ensureNoOverlap(
    position: { x: number, y: number, rotation: number, direction: 'horizontal' | 'vertical', flowDirection: 'right' | 'left' | 'down' | 'up' },
    occupiedPositions: Set<string>,
    tileId: string
  ): { x: number, y: number, rotation: number, direction: 'horizontal' | 'vertical', flowDirection: 'right' | 'left' | 'down' | 'up' } {
    
    let attempts = 0;
    let newX = position.x;
    let newY = position.y;
    const maxAttempts = 10;

    while (occupiedPositions.has(this.positionKey(newX, newY)) && attempts < maxAttempts) {
      attempts++;
      

      switch (position.flowDirection) {
        case 'right':
          newX += this.SPACING;
          break;
        case 'left':
          newX -= this.SPACING;
          break;
        case 'down':
          newY += this.SPACING;
          break;
        case 'up':
          newY -= this.SPACING;
          break;
      }

      console.log(`⚠️ Ajustando posición para evitar solapamiento (intento ${attempts}): (${newX}, ${newY})`);
    }

    if (attempts >= maxAttempts) {
      console.warn(`🚨 No se pudo evitar solapamiento para ficha ${tileId} después de ${maxAttempts} intentos`);
    }

    return {
      ...position,
      x: newX,
      y: newY
    };
  }


  private static positionKey(x: number, y: number): string {
   
    const gridX = Math.round(x / 20) * 20;
    const gridY = Math.round(y / 20) * 20;
    return `${gridX},${gridY}`;
  }


  private static debugOverlaps(positions: Map<string, AdvancedTilePosition>): void {
    const positionCounts = new Map<string, string[]>();
    
    for (const [tileId, pos] of positions) {
      const key = this.positionKey(pos.x, pos.y);
      if (!positionCounts.has(key)) {
        positionCounts.set(key, []);
      }
      positionCounts.get(key)!.push(tileId);
    }

   
    for (const [posKey, tileIds] of positionCounts) {
      if (tileIds.length > 1) {
        console.warn(`🚨 SOLAPAMIENTO detectado en posición ${posKey}:`, tileIds);
      }
    }

    console.log(`✅ Debug completado: ${positions.size} fichas, ${positionCounts.size} posiciones únicas`);
  }

  static calculateLayoutBounds(positions: Map<string, AdvancedTilePosition>) {
    if (positions.size === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const pos of positions.values()) {
      const tileWidth = pos.direction === 'vertical' ? this.TILE_HEIGHT : this.TILE_WIDTH;
      const tileHeight = pos.direction === 'vertical' ? this.TILE_WIDTH : this.TILE_HEIGHT;

      minX = Math.min(minX, pos.x - tileWidth/2);
      maxX = Math.max(maxX, pos.x + tileWidth/2);
      minY = Math.min(minY, pos.y - tileHeight/2);
      maxY = Math.max(maxY, pos.y + tileHeight/2);
    }

    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }
}

const GameBoard: React.FC<GameBoardProps> = ({ placedTiles, leftEnd, rightEnd }) => {
  if (placedTiles.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-96 border-2 border-dashed border-white/30 rounded-2xl bg-gradient-to-br from-green-800/20 to-green-900/30">
        <div className="text-center p-8">
          <div className="text-6xl mb-4 animate-bounce">🎯</div>
          <h3 className="text-white text-xl font-semibold mb-2">Mesa de Dominó Profesional</h3>
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

  const tilePositions = AntiOverlapDominoLayout.calculateAntiOverlapLayout(placedTiles);
  const bounds = AntiOverlapDominoLayout.calculateLayoutBounds(tilePositions);
  

  const containerWidth = Math.max(900, bounds.width + 400);
  const containerHeight = Math.max(600, bounds.height + 400);
  

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
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.02)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.02)_75%)] bg-[length:100px_100px]"></div>
      </div>
      

      <div 
        className="relative w-full h-full overflow-auto scrollbar-thin scrollbar-track-green-800/20 scrollbar-thumb-green-600/40"
        style={{ 
          minWidth: `${Math.min(containerWidth, window.innerWidth - 50)}px`, 
          minHeight: `${Math.min(containerHeight, window.innerHeight - 250)}px`
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
                zIndex: 50
              }}
            >
              {placedTiles.slice(1).map((tile, tileIndex) => {
                const currentPos = tilePositions.get(tile.id);
                const connectedId = currentPos?.connectedTo;
                const connectedPos = connectedId ? tilePositions.get(connectedId) : null;
                
                if (!currentPos || !connectedPos) return null;
                
                return (
                  <g key={`connection-${tileIndex}`}>
                  
                    <line
                      x1={connectedPos.x + bounds.width/2 + 100}
                      y1={connectedPos.y + bounds.height/2 + 100}
                      x2={currentPos.x + bounds.width/2 + 100}
                      y2={currentPos.y + bounds.height/2 + 100}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      className="animate-pulse"
                    />
                
                    <line
                      x1={connectedPos.x + bounds.width/2 + 101}
                      y1={connectedPos.y + bounds.height/2 + 101}
                      x2={currentPos.x + bounds.width/2 + 101}
                      y2={currentPos.y + bounds.height/2 + 101}
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          
          {placedTiles.map((tile, tileIndex) => {
            const position = tilePositions.get(tile.id);
            if (!position) return null;

            const rotationClass = getRotationClass(position.rotation);

            return (
              <div
                key={`no-overlap-domino-${tile.id}-${tileIndex}`}
                className="absolute transition-all duration-700 ease-out hover:z-50 group"
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: position.isInitial ? 300 : 200 + tileIndex,
                }}
              >
              
                <div 
                  className={`
                    ${rotationClass} transition-all duration-500 ease-out mx-2
                    ${position.isInitial ? 'animate-pulse' : ''}
                    hover:scale-110 hover:shadow-2xl group-hover:z-50
                  `}
                  style={{
                    filter: position.isInitial 
                      ? 'drop-shadow(0 8px 16px rgba(255,215,0,0.5)) drop-shadow(0 4px 8px rgba(0,0,0,0.4))' 
                      : 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))'
                  }}
                >
           
                  {position.isInitial && (
                    <div className="absolute inset-0 border-4 border-yellow-400 rounded-lg animate-pulse shadow-xl -z-10"></div>
                  )}

                  <DominoTileComponent
                    tile={{ ...tile, rotation: 0 }}
                    size="medium"
                    isInitial={position.isInitial}
                    className={`
                      transition-all duration-300
                      ${position.isInitial ? 'ring-3 ring-yellow-300 ring-opacity-70' : ''}
                      ${tile.isDouble ? 'border-2 border-red-300/60' : ''}
                    `}
                  />
                </div>
                
               
                <div className="absolute -top-4 -right-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-lg border-2 border-white z-20">
                  {tileIndex + 1}
                </div>

             
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-full shadow-lg z-20">
                  {tile.placedBy.substring(0, 3)}
                </div>

           
                {position.isInitial && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs px-3 py-1 rounded-full font-bold shadow-lg animate-bounce z-20">
                    ⭐ INICIO
                  </div>
                )}

               
                {tile.isDouble && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-gradient-to-br from-red-400 to-red-600 rounded-full border-2 border-white shadow-lg z-20">
                    <div className="w-full h-full rounded-full bg-white/30 animate-pulse"></div>
                  </div>
                )}

                
                {process.env.NODE_ENV === 'development' && (
                  <div className={`
                    absolute -top-1 -left-1 w-2 h-2 rounded-full z-20 border border-white shadow-sm
                    ${position.flowDirection === 'right' ? 'bg-green-400' : ''}
                    ${position.flowDirection === 'left' ? 'bg-blue-400' : ''}
                    ${position.flowDirection === 'down' ? 'bg-purple-400' : ''}
                    ${position.flowDirection === 'up' ? 'bg-orange-400' : ''}
                  `}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

 
      <div className="absolute top-3 left-3 lg:top-4 lg:left-4 bg-black/80 backdrop-blur-lg text-white p-4 rounded-xl border border-white/30 shadow-2xl max-w-64">
        <h3 className="font-bold mb-3 text-sm lg:text-base flex items-center">
          <span className="mr-2 text-lg">📊</span>
          Estado Sin Solapamientos
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-400/30">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Extremo Izq:
            </span>
            <span className="font-bold text-blue-300 text-lg">{leftEnd}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg border border-red-400/30">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              Extremo Der:
            </span>
            <span className="font-bold text-red-300 text-lg">{rightEnd}</span>
          </div>
          <div className="border-t border-white/30 pt-3 flex items-center justify-between">
            <span className="flex items-center">
              <span className="mr-2">🎯</span>
              Progreso:
            </span>
            <span className="font-bold text-green-300">{placedTiles.length}/28</span>
          </div>
        </div>
      </div>

   
      {placedTiles.length > 0 && (
        <div className="absolute top-3 right-3 lg:top-4 lg:right-4 space-y-2">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg border border-blue-400/50 animate-pulse">
            ← {leftEnd}
          </div>
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg border border-red-400/50 animate-pulse">
            {rightEnd} →
          </div>
        </div>
      )}

   
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 lg:bottom-4 bg-black/80 backdrop-blur-lg text-white px-6 py-4 rounded-xl border border-white/30 shadow-2xl">
        <div className="flex items-center space-x-4 text-sm lg:text-base">
          <span className="text-3xl">🎲</span>
          <div className="flex-1">
            <div className="font-bold mb-1">Dominó Sin Solapamientos</div>
            <div className="flex items-center space-x-3">
              <div className="w-40 bg-white/20 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(placedTiles.length / 28) * 100}%` }}
                ></div>
              </div>
              <span className="text-white/90 font-mono">{placedTiles.length}/28</span>
            </div>
          </div>
        </div>
      </div>

 
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .scrollbar-track-green-800\\/20::-webkit-scrollbar-track {
          background: rgba(22, 101, 52, 0.2);
          border-radius: 4px;
        }
        
        .scrollbar-thumb-green-600\\/40::-webkit-scrollbar-thumb {
          background: rgba(22, 163, 74, 0.4);
          border-radius: 4px;
        }
        
        .scrollbar-thumb-green-600\\/40::-webkit-scrollbar-thumb:hover {
          background: rgba(22, 163, 74, 0.6);
        }
      `}</style>
    </div>
  );
};

export default GameBoard;