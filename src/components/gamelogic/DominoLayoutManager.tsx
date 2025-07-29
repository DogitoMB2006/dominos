import { type PlacedTile } from '../../types/dominoTypes';

export interface Position {
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
}

export interface LayoutPoint {
  x: number;
  y: number;
  isOccupied: boolean;
  connectedSides: ('top' | 'right' | 'bottom' | 'left')[];
}

export class DominoLayoutManager {
  private static readonly TILE_WIDTH = 60;
  private static readonly TILE_HEIGHT = 120;
  private static readonly TILE_SPACING = 4;

  static calculateTilePositions(placedTiles: PlacedTile[]): Map<string, Position> {
    const positions = new Map<string, Position>();
    
    if (placedTiles.length === 0) return positions;

    const firstTile = placedTiles[0];
    positions.set(firstTile.id, {
      x: 0,
      y: 0,
      rotation: firstTile.rotation
    });

    for (let i = 1; i < placedTiles.length; i++) {
      const tile = placedTiles[i];
      const position = this.calculateNextPosition(tile, placedTiles.slice(0, i), positions);
      positions.set(tile.id, position);
    }

    return positions;
  }

  private static calculateNextPosition(
    tile: PlacedTile, 
    previousTiles: PlacedTile[],
    existingPositions: Map<string, Position>
  ): Position {
    const connectionSide = tile.connectedSide;
    const layoutEnds = this.findLayoutEnds(previousTiles, existingPositions);
    const targetEnd = connectionSide === 'left' ? layoutEnds.leftEnd : layoutEnds.rightEnd;
    
    if (!targetEnd) {
      return { x: 0, y: 0, rotation: tile.rotation };
    }

    return this.positionTileNextTo(tile, targetEnd, connectionSide, existingPositions);
  }

  private static findLayoutEnds(
    tiles: PlacedTile[],
    positions: Map<string, Position>
  ): { leftEnd: PlacedTile | null, rightEnd: PlacedTile | null } {
    if (tiles.length === 0) return { leftEnd: null, rightEnd: null };

    let leftmostTile = tiles[0];
    let rightmostTile = tiles[0];
    let leftmostX = positions.get(tiles[0].id)?.x || 0;
    let rightmostX = positions.get(tiles[0].id)?.x || 0;

    for (const tile of tiles) {
      const pos = positions.get(tile.id);
      if (pos) {
        if (pos.x < leftmostX) {
          leftmostX = pos.x;
          leftmostTile = tile;
        }
        if (pos.x > rightmostX) {
          rightmostX = pos.x;
          rightmostTile = tile;
        }
      }
    }

    return { leftEnd: leftmostTile, rightEnd: rightmostTile };
  }

  private static positionTileNextTo(
    newTile: PlacedTile,
    targetTile: PlacedTile,
    side: 'left' | 'right',
    existingPositions: Map<string, Position>
  ): Position {
    const targetPos = existingPositions.get(targetTile.id);
    if (!targetPos) {
      return { x: 0, y: 0, rotation: newTile.rotation };
    }

    const isTargetDouble = targetTile.isDouble;
    const isNewDouble = newTile.isDouble;
    
    let offsetX = 0;
    let offsetY = 0;
    let rotation = newTile.rotation;

    if (side === 'left') {
      if (isTargetDouble) {
        offsetX = -(this.TILE_WIDTH + this.TILE_SPACING);
        offsetY = isNewDouble ? -30 : 0;
        rotation = isNewDouble ? 90 : 0;
      } else {
        offsetX = -(this.TILE_WIDTH + this.TILE_SPACING);
        offsetY = this.calculateYOffset(targetPos.rotation, rotation);
      }
    } else {
      if (isTargetDouble) {
        offsetX = this.TILE_WIDTH + this.TILE_SPACING;
        offsetY = isNewDouble ? -30 : 0;
        rotation = isNewDouble ? 90 : 0;
      } else {
        offsetX = this.TILE_WIDTH + this.TILE_SPACING;
        offsetY = this.calculateYOffset(targetPos.rotation, rotation);
      }
    }

    const proposedPos = {
      x: targetPos.x + offsetX,
      y: targetPos.y + offsetY,
      rotation: rotation as 0 | 90 | 180 | 270
    };

    return this.avoidCollisions(proposedPos, existingPositions);
  }

  private static calculateYOffset(targetRotation: number, newRotation: number): number {
    if (targetRotation === 90 || targetRotation === 270) {
      return newRotation === 90 || newRotation === 270 ? 0 : -30;
    }
    return 0;
  }

  private static avoidCollisions(
    proposedPos: Position,
    existingPositions: Map<string, Position>
  ): Position {
    const minDistance = this.TILE_WIDTH * 0.8;
    
    for (const [_, existingPos] of existingPositions) {
      const distance = Math.sqrt(
        Math.pow(proposedPos.x - existingPos.x, 2) + 
        Math.pow(proposedPos.y - existingPos.y, 2)
      );
      
      if (distance < minDistance) {
        const angle = Math.atan2(
          proposedPos.y - existingPos.y, 
          proposedPos.x - existingPos.x
        );
        proposedPos.x = existingPos.x + Math.cos(angle) * minDistance;
        proposedPos.y = existingPos.y + Math.sin(angle) * minDistance;
      }
    }
    
    return proposedPos;
  }

  static calculateLayoutBounds(positions: Map<string, Position>): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  } {
    if (positions.size === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const pos of positions.values()) {
      const tileWidth = pos.rotation === 90 || pos.rotation === 270 ? 
        this.TILE_HEIGHT : this.TILE_WIDTH;
      const tileHeight = pos.rotation === 90 || pos.rotation === 270 ? 
        this.TILE_WIDTH : this.TILE_HEIGHT;

      minX = Math.min(minX, pos.x - tileWidth/2);
      maxX = Math.max(maxX, pos.x + tileWidth/2);
      minY = Math.min(minY, pos.y - tileHeight/2);
      maxY = Math.max(maxY, pos.y + tileHeight/2);
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  static addNaturalCurve(
    positions: Map<string, Position>,
    maxTableWidth: number = 800
  ): Map<string, Position> {
    const adjustedPositions = new Map(positions);
    const bounds = this.calculateLayoutBounds(positions);
    
    if (bounds.width > maxTableWidth) {
      // Implementar lógica de curvas aquí
    }
    
    return adjustedPositions;
  }

  static detectCollisions(
    newPosition: Position,
    existingPositions: Map<string, Position>,
    tileId: string
  ): boolean {
    const buffer = 10;
    
    for (const [id, pos] of existingPositions) {
      if (id === tileId) continue;
      
      const distance = Math.sqrt(
        Math.pow(newPosition.x - pos.x, 2) + 
        Math.pow(newPosition.y - pos.y, 2)
      );
      
      if (distance < this.TILE_WIDTH + buffer) {
        return true;
      }
    }
    
    return false;
  }

  static generateAlternativePosition(
    basePosition: Position,
    attempt: number = 1
  ): Position {
    const angle = (attempt * 45) * (Math.PI / 180);
    const distance = 20 * attempt;
    
    return {
      x: basePosition.x + Math.cos(angle) * distance,
      y: basePosition.y + Math.sin(angle) * distance,
      rotation: basePosition.rotation
    };
  }
}