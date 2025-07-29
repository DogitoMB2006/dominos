import React from 'react';
import { type DominoTile } from '../../types/dominoTypes';

interface DominoTileProps {
  tile: DominoTile;
  isPlayable?: boolean;
  isSelected?: boolean;
  showBack?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
  visualRotation?: number;
  isDouble?: boolean;
  isInitial?: boolean;
}

const DominoTileComponent: React.FC<DominoTileProps> = ({
  tile,
  isPlayable = false,
  isSelected = false,
  showBack = false,
  size = 'medium',
  onClick,
  className = '',
  visualRotation = 0,
  isDouble = false,
  isInitial = false
}) => {
  const sizeClasses = {
    small: { width: 32, height: 64, pipSize: 4 },
    medium: { width: 48, height: 96, pipSize: 6 },
    large: { width: 64, height: 128, pipSize: 8 }
  };

  const { width, height, pipSize } = sizeClasses[size];

  // CORREGIDO: Clases base que respetan isPlayable
  const baseClasses = `
    relative rounded-lg transition-all duration-500 ease-out
    ${isPlayable ? 'cursor-pointer hover:scale-110 hover:shadow-2xl animate-pulse ring-2 ring-green-400 ring-opacity-60' : 'cursor-not-allowed opacity-60'}
    ${isSelected ? 'ring-4 ring-blue-400 scale-110 shadow-2xl' : ''}
    ${isInitial ? 'ring-4 ring-yellow-400 ring-opacity-80' : ''}
    ${tile.isDouble ? 'border-2 border-red-300/40' : ''}
    ${className}
  `;

  // CORREGIDO: Solo permitir click si es jugable
  const handleClick = () => {
    if (isPlayable && onClick) {
      onClick();
    } else if (!isPlayable) {
      console.log('🚫 Ficha no jugable - click bloqueado');
    }
  };

  if (showBack) {
    return (
      <div 
        className={baseClasses}
        onClick={handleClick}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-900 rounded-lg border-2 border-blue-700 shadow-lg relative overflow-hidden">
          <div className="absolute inset-2 border border-blue-300/30 rounded"></div>
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-blue-200 opacity-70" style={{ fontSize: `${pipSize * 2}px` }}>🎯</div>
          </div>
          {[
            { top: '4px', left: '4px' },
            { top: '4px', right: '4px' },
            { bottom: '4px', left: '4px' },
            { bottom: '4px', right: '4px' }
          ].map((pos, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-blue-300/50 rounded-full"
              style={pos}
            />
          ))}
        </div>
      </div>
    );
  }

  const getPipPositions = (value: number): Array<{ x: number; y: number }> => {
    const positions = {
      0: [],
      1: [{ x: 50, y: 50 }],
      2: [{ x: 30, y: 30 }, { x: 70, y: 70 }],
      3: [{ x: 30, y: 30 }, { x: 50, y: 50 }, { x: 70, y: 70 }],
      4: [
        { x: 30, y: 30 }, { x: 70, y: 30 },
        { x: 30, y: 70 }, { x: 70, y: 70 }
      ],
      5: [
        { x: 30, y: 30 }, { x: 70, y: 30 },
        { x: 50, y: 50 },
        { x: 30, y: 70 }, { x: 70, y: 70 }
      ],
      6: [
        { x: 30, y: 25 }, { x: 30, y: 50 }, { x: 30, y: 75 },
        { x: 70, y: 25 }, { x: 70, y: 50 }, { x: 70, y: 75 }
      ]
    };
    return positions[value as keyof typeof positions] || [];
  };

  const renderPips = (value: number) => {
    const pips = getPipPositions(value);
    const sectionHeight = (height - 8) / 2;
    
    return (
      <div 
        className="relative flex-1 flex items-center justify-center"
        style={{ height: `${sectionHeight}px` }}
      >
        {pips.map((pip, index) => (
          <div
            key={index}
            className={`
              absolute rounded-full shadow-inner transition-all duration-300
              ${isPlayable ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-600'}
            `}
            style={{
              width: `${pipSize}px`,
              height: `${pipSize}px`,
              left: `${pip.x}%`,
              top: `${pip.y}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: isPlayable 
                ? 'inset 0 1px 3px rgba(0,0,0,0.6), 0 1px 2px rgba(255,255,255,0.1)'
                : 'inset 0 1px 2px rgba(0,0,0,0.4)'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div 
      className={baseClasses}
      onClick={handleClick}
      style={{ width: `${width}px`, height: `${height}px` }}
      title={!isPlayable ? 'Esta ficha no se puede jugar' : undefined}
    >
      {/* CORREGIDO: Contenedor principal que respeta isPlayable */}
      <div className={`
        w-full h-full rounded-lg border-2 shadow-lg relative overflow-hidden transition-all duration-300
        ${isPlayable ? 'bg-gradient-to-br from-gray-50 via-white to-gray-100 border-gray-800' : 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 border-gray-600'}
      `}>
        {/* Sombra interior */}
        <div className={`
          absolute inset-0 rounded-lg shadow-inner
          ${isPlayable ? 'bg-gradient-to-br from-white/60 to-gray-100/20' : 'bg-gradient-to-br from-gray-300/40 to-gray-400/20'}
        `}></div>
        
        {/* Borde interior */}
        <div className={`
          absolute inset-1 border rounded-md bg-gradient-to-br from-white/30 to-transparent
          ${isPlayable ? 'border-gray-200/90' : 'border-gray-400/60'}
        `}></div>
        
        <div className="relative w-full h-full flex flex-col p-1">
          {renderPips(tile.left)}
          
          {/* Línea divisoria central */}
          <div className="relative h-1 mx-2 my-1">
            <div className={`
              w-full h-full rounded-full shadow-sm
              ${isPlayable ? 'bg-gradient-to-r from-gray-300 via-gray-600 to-gray-300' : 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400'}
            `}></div>
            <div className={`
              absolute left-0 top-1/2 w-1.5 h-1.5 rounded-full transform -translate-y-1/2 shadow-sm
              ${isPlayable ? 'bg-gray-500' : 'bg-gray-400'}
            `}></div>
            <div className={`
              absolute right-0 top-1/2 w-1.5 h-1.5 rounded-full transform -translate-y-1/2 shadow-sm
              ${isPlayable ? 'bg-gray-500' : 'bg-gray-400'}
            `}></div>
            {/* Punto central para dobles */}
            {tile.isDouble && (
              <div className={`
                absolute left-1/2 top-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg border border-white
                ${isPlayable ? 'bg-red-500' : 'bg-red-400'}
              `}></div>
            )}
          </div>
          
          {renderPips(tile.right)}
        </div>

        {/* CORREGIDO: Efectos especiales solo para fichas jugables */}
        {isPlayable && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 via-green-300/20 to-green-500/30 rounded-lg animate-pulse"></div>
            <div className="absolute inset-0 border-2 border-green-400/80 rounded-lg animate-pulse shadow-lg"></div>
            <div className="absolute -inset-1 bg-gradient-to-br from-green-300/40 to-green-500/40 rounded-lg blur-sm -z-10 animate-pulse"></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-green-300 rounded-full animate-ping"></div>
            <div className="absolute bottom-1 left-1 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
          </>
        )}

        {/* Efecto de ficha NO jugable */}
        {!isPlayable && !isInitial && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 via-gray-400/10 to-gray-600/20 rounded-lg"></div>
            <div className="absolute inset-0 border-2 border-gray-500/40 rounded-lg"></div>
            {/* Icono de prohibido */}
            <div className="absolute top-1 right-1 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center text-white text-xs">
              ✕
            </div>
          </>
        )}

        {isSelected && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 via-blue-300/30 to-blue-500/40 rounded-lg"></div>
            <div className="absolute inset-0 border-4 border-blue-400 rounded-lg shadow-2xl"></div>
            <div className="absolute -inset-2 bg-blue-400/50 rounded-lg blur-md -z-10 animate-pulse"></div>
          </>
        )}

        {isInitial && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 via-yellow-200/20 to-yellow-400/30 rounded-lg animate-pulse"></div>
            <div className="absolute inset-0 border-3 border-yellow-400 rounded-lg shadow-xl"></div>
            <div className="absolute -inset-2 bg-yellow-400/40 rounded-lg blur-lg -z-10 animate-pulse"></div>
            <div className="absolute -top-1 -right-1 text-yellow-400 text-xs animate-spin" style={{animationDuration: '3s'}}>⭐</div>
          </>
        )}

        <div className="absolute top-1 left-1 w-6 h-6 bg-gradient-to-br from-white/80 to-transparent rounded-full blur-sm"></div>
        
        {process.env.NODE_ENV === 'development' && (
          <>
            <div className="absolute top-0.5 left-0.5 text-xs text-gray-600 leading-none font-mono bg-white/70 px-1 rounded">
              {tile.left}
            </div>
            <div className="absolute bottom-0.5 right-0.5 text-xs text-gray-600 leading-none font-mono bg-white/70 px-1 rounded">
              {tile.right}
            </div>
          </>
        )}
        
        {/* Indicador mejorado de ficha doble */}
        {tile.isDouble && (
          <div className={`
            absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-lg
            ${isPlayable ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-red-300 to-red-500'}
          `}>
            <div className="w-full h-full rounded-full bg-white/40 animate-pulse"></div>
          </div>
        )}

        {/* Efecto de rotación visual */}
        {visualRotation !== 0 && (
          <div className="absolute top-0 left-0 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
        )}
      </div>

      {/* CORREGIDO: Tooltip que indica si es jugable o no */}
      {(isPlayable || isSelected || !isPlayable) && (
        <div className={`
          absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none shadow-lg border
          ${isPlayable ? 'bg-black/90 text-white border-gray-600' : 'bg-red-900/90 text-red-100 border-red-600'}
        `}>
          {tile.isDouble ? `Doble ${tile.left}` : `${tile.left}-${tile.right}`}
          {isPlayable && <div className="text-green-300">¡Jugable!</div>}
          {!isPlayable && !isInitial && <div className="text-red-300">No se puede jugar</div>}
        </div>
      )}

      {/* Indicador de conexión para ficha inicial */}
      {isInitial && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold shadow-lg">
          INICIO
        </div>
      )}
    </div>
  );
};

export default DominoTileComponent;