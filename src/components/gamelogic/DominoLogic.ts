import { type DominoTile, type GameState, type PlacedTile, type GameLogEntry } from '../../types/dominoTypes';

export class DominoGameLogic {
  static createFullSet(): DominoTile[] {
    const tiles: DominoTile[] = [];
    
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        tiles.push({
          id: `${i}_${j}`,
          left: i,
          right: j,
          isDouble: i === j,
          rotation: 0
        });
      }
    }
    
    return this.shuffleTiles(tiles);
  }

  static shuffleTiles(tiles: DominoTile[]): DominoTile[] {
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static distributeHands(tiles: DominoTile[], playerIds: string[]): { [playerId: string]: DominoTile[] } {
    const hands: { [playerId: string]: DominoTile[] } = {};
    const tilesPerPlayer = 7;
    
    playerIds.forEach((playerId: string, index: number) => {
      hands[playerId] = tiles.slice(index * tilesPerPlayer, (index + 1) * tilesPerPlayer);
    });
    
    return hands;
  }

  static findPlayerWithHighestDouble(hands: { [playerId: string]: DominoTile[] }): string {
    let highestDouble = -1;
    let startingPlayer = '';
    
    Object.entries(hands).forEach(([playerId, hand]) => {
      hand.forEach((tile: DominoTile) => {
        if (tile.isDouble && tile.left > highestDouble) {
          highestDouble = tile.left;
          startingPlayer = playerId;
        }
      });
    });
    
    return startingPlayer;
  }

  static createPlayerOrder(startingPlayer: string, allPlayers: string[]): string[] {
    const startIndex = allPlayers.indexOf(startingPlayer);
    const order = [];
    
    for (let i = 0; i < allPlayers.length; i++) {
      order.push(allPlayers[(startIndex + i) % allPlayers.length]);
    }
    
    return order;
  }

  static canPlaceTile(tile: DominoTile, gameState: GameState): { canPlace: boolean, sides: ('left' | 'right')[] } {
    if (gameState.placedTiles.length === 0) {
      console.log('🎯 PRIMERA FICHA - siempre permitida');
      return { canPlace: true, sides: ['left'] };
    }

    const sides: ('left' | 'right')[] = [];
    const { leftEnd, rightEnd } = gameState;

    console.log('🔍 VALIDACIÓN:', {
      tile: `${tile.left}-${tile.right}`,
      leftEnd,
      rightEnd
    });

    if (tile.left === leftEnd || tile.right === leftEnd) {
      sides.push('left');
      console.log('✅ PUEDE IR EN LADO IZQUIERDO');
    }
    
    if (tile.left === rightEnd || tile.right === rightEnd) {
      sides.push('right');
      console.log('✅ PUEDE IR EN LADO DERECHO');
    }

    const canPlace = sides.length > 0;
    console.log('📋 RESULTADO:', { canPlace, sides });
    return { canPlace, sides };
  }

  static placeTile(
    tile: DominoTile, 
    side: 'left' | 'right', 
    gameState: GameState, 
    playerId: string
  ): { success: boolean, newGameState?: GameState, error?: string } {
    console.log('🎲 PLACE TILE DEBUG:', {
      tile: `${tile.left}-${tile.right}`,
      side,
      leftEnd: gameState.leftEnd,
      rightEnd: gameState.rightEnd,
      placedTilesCount: gameState.placedTiles.length
    });

    if (gameState.currentPlayer !== playerId) {
      return { success: false, error: 'No es tu turno' };
    }

    const playerHand = gameState.playerHands[playerId];
    if (!playerHand.some((t: DominoTile) => t.id === tile.id)) {
      return { success: false, error: 'No tienes esta ficha' };
    }

    if (gameState.placedTiles.length === 0) {
      console.log('✅ PRIMERA FICHA - permitiendo colocación');
    } else {
      const canPlace = this.canPlaceTile(tile, gameState);
      console.log('🔍 CAN PLACE RESULT:', canPlace);
      
      if (!canPlace.canPlace) {
        return { success: false, error: 'Esta ficha no conecta con ningún extremo' };
      }

      if (!canPlace.sides.includes(side)) {
        return { success: false, error: `No puedes colocar esta ficha en el lado ${side}` };
      }
    }

    const newGameState = { ...gameState };
    
    const placement = this.calculateDominoPlacement(tile, side, gameState);
    
    const placedTile: PlacedTile = {
      ...tile,
      rotation: placement.rotation,
      x: placement.x,
      y: placement.y,
      connectedSide: side,
      placedBy: playerId
    };

    if (side === 'left') {
      newGameState.placedTiles = [placedTile, ...gameState.placedTiles];
    } else {
      newGameState.placedTiles = [...gameState.placedTiles, placedTile];
    }
    
    newGameState.playerHands[playerId] = gameState.playerHands[playerId].filter(
      (t: DominoTile) => t.id !== tile.id
    );
    
    newGameState.leftEnd = placement.newLeftEnd;
    newGameState.rightEnd = placement.newRightEnd;
    newGameState.passCount = 0;

    const logEntry: GameLogEntry = {
      playerId,
      action: 'place',
      tile: { ...tile, rotation: placement.rotation },
      timestamp: new Date()
    };
    newGameState.gameLog = [...gameState.gameLog, logEntry];

    const currentPlayerIndex = gameState.playerOrder.indexOf(playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.playerOrder.length;
    newGameState.currentPlayer = gameState.playerOrder[nextPlayerIndex];

    if (newGameState.playerHands[playerId].length === 0) {
      newGameState.gameEnded = true;
      newGameState.winner = playerId;
    }

    return { success: true, newGameState };
  }

  private static calculateDominoPlacement(
    tile: DominoTile, 
    side: 'left' | 'right', 
    gameState: GameState
  ): { 
    rotation: 0 | 90 | 180 | 270, 
    newLeftEnd: number, 
    newRightEnd: number,
    x: number,
    y: number 
  } {
    const { leftEnd, rightEnd, placedTiles } = gameState;
    
    if (placedTiles.length === 0) {
      console.log('🎯 PRIMERA FICHA:', {
        tile: `${tile.left}-${tile.right}`,
        rotation: tile.isDouble ? 90 : 0
      });
      return {
        rotation: tile.isDouble ? 90 : 0,
        newLeftEnd: tile.left,
        newRightEnd: tile.right,
        x: 0,
        y: 0
      };
    }

    const targetEnd = side === 'left' ? leftEnd : rightEnd;
    let rotation: 0 | 90 | 180 | 270 = 0;
    let freeValue: number;

    console.log('🔧 CALCULANDO POSICIÓN:', {
      tile: `${tile.left}-${tile.right}`,
      side,
      targetEnd,
      isDouble: tile.isDouble
    });

    if (tile.isDouble) {
      rotation = 90;
      freeValue = tile.left;
      console.log('🔄 FICHA DOBLE - rotación 90°');
    } else {
      if (tile.left === targetEnd) {
        freeValue = tile.right;
        rotation = side === 'left' ? 180 : 0;
        console.log(`🔄 CONECTA POR IZQUIERDA (${tile.left}) - extremo libre: ${freeValue}`);
      } else if (tile.right === targetEnd) {
        freeValue = tile.left;
        rotation = side === 'left' ? 0 : 180;
        console.log(`🔄 CONECTA POR DERECHA (${tile.right}) - extremo libre: ${freeValue}`);
      } else {
        console.log('⚠️ NO HAY CONEXIÓN VÁLIDA');
        freeValue = tile.right;
        rotation = 0;
      }
    }

    const layout = this.calculateLinearLayout(placedTiles, side, tile.isDouble);

    let newLeftEnd = leftEnd;
    let newRightEnd = rightEnd;
    
    if (side === 'left') {
      newLeftEnd = freeValue;
    } else {
      newRightEnd = freeValue;
    }

    console.log('📍 RESULTADO POSICIÓN:', {
      position: { x: layout.x, y: layout.y },
      rotation,
      newEnds: { left: newLeftEnd, right: newRightEnd }
    });

    return { 
      rotation, 
      newLeftEnd, 
      newRightEnd,
      x: layout.x,
      y: layout.y 
    };
  }

  private static calculateLinearLayout(
    placedTiles: PlacedTile[],
    side: 'left' | 'right',
    isDouble: boolean
  ): { x: number, y: number } {
    const TILE_WIDTH = 48;
    const TILE_HEIGHT = 96;
    const SPACING = 8;
    const MAX_ROW_WIDTH = 500;

    if (placedTiles.length === 0) {
      return { x: 0, y: 0 };
    }

    let currentX = 0;
    let currentY = 0;
    let currentRowWidth = 0;

    if (side === 'left') {
      currentX = -(placedTiles.length * (TILE_WIDTH + SPACING));
      currentRowWidth = Math.abs(currentX);
    } else {
      currentX = placedTiles.length * (TILE_WIDTH + SPACING);
      currentRowWidth = currentX;
    }

    if (currentRowWidth > MAX_ROW_WIDTH) {
      const rowNumber = Math.floor(currentRowWidth / MAX_ROW_WIDTH);
      currentY = rowNumber * (TILE_HEIGHT + SPACING * 2) * (side === 'left' ? -1 : 1);
      currentX = (currentX % MAX_ROW_WIDTH) * (side === 'left' ? -1 : 1);
    }

    if (isDouble) {
      currentY += side === 'left' ? -20 : 20;
    }

    return { x: currentX, y: currentY };
  }

  static playerCanPlay(playerId: string, gameState: GameState): boolean {
    const hand = gameState.playerHands[playerId];
    
    if (gameState.placedTiles.length === 0) return true;
    
    const canPlay = hand.some((tile: DominoTile) => {
      const canPlace = this.canPlaceTile(tile, gameState);
      return canPlace.canPlace;
    });

    return canPlay;
  }

  static getAvailableMoves(playerId: string, gameState: GameState): { tile: DominoTile, sides: ('left' | 'right')[] }[] {
    const hand = gameState.playerHands[playerId];
    const moves: { tile: DominoTile, sides: ('left' | 'right')[] }[] = [];
    
    hand.forEach((tile: DominoTile) => {
      const canPlace = this.canPlaceTile(tile, gameState);
      if (canPlace.canPlace && canPlace.sides.length > 0) {
        moves.push({ tile, sides: canPlace.sides });
      }
    });
    
    return moves;
  }

  static passPlayer(playerId: string, gameState: GameState): GameState {
    const newGameState = { ...gameState };
    newGameState.passCount += 1;
    
    const logEntry: GameLogEntry = {
      playerId,
      action: 'pass',
      timestamp: new Date()
    };
    newGameState.gameLog = [...gameState.gameLog, logEntry];

    const nextPlayerIndex = (gameState.playerOrder.indexOf(playerId) + 1) % gameState.playerOrder.length;
    newGameState.currentPlayer = gameState.playerOrder[nextPlayerIndex];

    if (newGameState.passCount >= gameState.playerOrder.length) {
      newGameState.gameEnded = true;
      newGameState.winner = this.calculateBlockedGameWinner(newGameState);
    }

    return newGameState;
  }

  static calculateBlockedGameWinner(gameState: GameState): string {
    let minPoints = Infinity;
    let winner = '';
    
    Object.entries(gameState.playerHands).forEach(([playerId, hand]) => {
      const points = hand.reduce((sum: number, tile: DominoTile) => sum + tile.left + tile.right, 0);
      
      if (points < minPoints) {
        minPoints = points;
        winner = playerId;
      }
    });
    
    return winner;
  }
}