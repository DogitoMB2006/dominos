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
}

const DominoTileComponent: React.FC<DominoTileProps> = ({
  tile,
  isPlayable = false,
  isSelected = false,
  showBack = false,
  size = 'medium',
  onClick,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-8 h-16',
    medium: 'w-12 h-24',
    large: 'w-16 h-32'
  };

  const baseClasses = `
    ${sizeClasses[size]}
    border-2 border-gray-800 rounded-lg
    bg-gradient-to-b from-gray-100 to-gray-200
    shadow-lg transition-all duration-200 relative
    ${isPlayable ? 'hover:scale-105 hover:shadow-xl border-green-500 cursor-pointer' : ''}
    ${isSelected ? 'ring-4 ring-blue-500 scale-105' : ''}
    ${onClick ? 'hover:brightness-110' : ''}
    ${className}
  `;

  const rotationClass = {
    0: '',
    90: 'rotate-90',
    180: 'rotate-180',
    270: '-rotate-90'
  }[tile.rotation];

  if (showBack) {
    return (
      <div 
        className={`${baseClasses} bg-gradient-to-b from-blue-900 to-blue-800`}
        onClick={onClick}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-xs font-bold">🎯</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${baseClasses} ${rotationClass}`}
      onClick={onClick}
    >
      {/* Fallback if image doesn't load */}
      <div className="w-full h-full flex flex-col justify-between p-1 bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg">
        <div className="text-lg font-bold text-center text-gray-800 bg-white/70 rounded px-1">
          {tile.left}
        </div>
        <div className="border-t border-gray-400 my-1"></div>
        <div className="text-lg font-bold text-center text-gray-800 bg-white/70 rounded px-1">
          {tile.right}
        </div>
      </div>
      
      {/* Image overlay */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          backgroundImage: `url(/domino-tiles/${tile.id}.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
    </div>
  );
};

export default DominoTileComponent;