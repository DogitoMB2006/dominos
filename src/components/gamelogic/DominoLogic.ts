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
      return { canPlace: true, sides: ['left'] };
    }

    const sides: ('left' | 'right')[] = [];
    const { leftEnd, rightEnd } = gameState;

    console.log('🔍 VALIDACIÓN ESTRICTA:', {
      tile: `${tile.left}-${tile.right}`,
      leftEnd,
      rightEnd,
      isDouble: tile.isDouble
    });


    if (tile.left === leftEnd || tile.right === leftEnd) {
      sides.push('left');
      console.log('✅ VÁLIDA para extremo IZQUIERDO');
    }
    

    if (tile.left === rightEnd || tile.right === rightEnd) {
      sides.push('right');
      console.log('✅ VÁLIDA para extremo DERECHO');
    }

    const canPlace = sides.length > 0;
    
    if (!canPlace) {
      console.log('❌ FICHA NO VÁLIDA - No conecta con ningún extremo');
    }

    console.log('📋 Resultado validación:', { canPlace, sides, leftEnd, rightEnd });
    return { canPlace, sides };
  }


  static placeTile(
    tile: DominoTile, 
    side: 'left' | 'right', 
    gameState: GameState, 
    playerId: string
  ): { success: boolean, newGameState?: GameState, error?: string } {
    console.log('🎲 INTENTANDO COLOCAR FICHA:', {
      tile: `${tile.left}-${tile.right}`,
      tileId: tile.id,
      side,
      player: playerId.substring(0, 8),
      leftEnd: gameState.leftEnd,
      rightEnd: gameState.rightEnd,
      placedTilesCount: gameState.placedTiles.length,
      currentPlayer: gameState.currentPlayer,
      gameStarted: gameState.gameStarted
    });

    if (gameState.currentPlayer !== playerId) {
      console.log('❌ No es el turno del jugador');
      return { success: false, error: 'No es tu turno' };
    }


    const playerHand = gameState.playerHands[playerId];
    if (!playerHand.some((t: DominoTile) => t.id === tile.id)) {
      console.log('❌ Jugador no tiene la ficha');
      return { success: false, error: 'No tienes esta ficha' };
    }


    const canPlace = this.canPlaceTile(tile, gameState);
    if (!canPlace.canPlace) {
      console.log('❌ Ficha no puede colocarse - No conecta');
      return { success: false, error: 'Esta ficha no conecta con ningún extremo' };
    }

    if (!canPlace.sides.includes(side)) {
      console.log('❌ Lado específico no válido');
      return { success: false, error: `No puedes colocar esta ficha en el lado ${side}` };
    }


    const { leftEnd, rightEnd } = gameState;
    const targetEnd = side === 'left' ? leftEnd : rightEnd;
    
    if (tile.left !== targetEnd && tile.right !== targetEnd) {
      console.log('❌ Números no coinciden exactamente');
      return { success: false, error: 'Los números deben coincidir exactamente' };
    }

    const newGameState = { ...gameState };
    
 
    const placementResult = this.calculateProfessionalPlacement(tile, side, gameState);
    
   
    const placedTile: PlacedTile = {
      ...tile,
      rotation: placementResult.rotation,
      x: placementResult.x,
      y: placementResult.y,
      connectedSide: side,
      placedBy: playerId
    };

    console.log('✨ FICHA VÁLIDA COLOCADA:', {
      id: placedTile.id,
      rotation: placedTile.rotation,
      position: { x: placedTile.x, y: placedTile.y },
      newEnds: { left: placementResult.newLeftEnd, right: placementResult.newRightEnd }
    });

   
    if (side === 'left') {
      newGameState.placedTiles = [placedTile, ...gameState.placedTiles];
    } else {
      newGameState.placedTiles = [...gameState.placedTiles, placedTile];
    }
  
    newGameState.playerHands[playerId] = gameState.playerHands[playerId].filter(
      (t: DominoTile) => t.id !== tile.id
    );

    newGameState.leftEnd = placementResult.newLeftEnd;
    newGameState.rightEnd = placementResult.newRightEnd;
    newGameState.passCount = 0;

 
    const logEntry: GameLogEntry = {
      playerId,
      action: 'place',
      tile: { ...tile, rotation: placementResult.rotation },
      timestamp: new Date()
    };
    newGameState.gameLog = [...gameState.gameLog, logEntry];

    const currentPlayerIndex = gameState.playerOrder.indexOf(playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.playerOrder.length;
    newGameState.currentPlayer = gameState.playerOrder[nextPlayerIndex];


    if (newGameState.playerHands[playerId].length === 0) {
      newGameState.gameEnded = true;
      newGameState.winner = playerId;
      console.log('🏆 ¡VICTORIA! Jugador sin fichas');
    }

    console.log('✅ FICHA COLOCADA EXITOSAMENTE');
    return { success: true, newGameState };
  }


  private static calculateProfessionalPlacement(
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
    const targetEnd = side === 'left' ? leftEnd : rightEnd;
    
    let rotation: 0 | 90 | 180 | 270 = 0;
    let oppositeValue: number;

  
    if (placedTiles.length === 0) {
      rotation = tile.isDouble ? 90 : 0;
      return {
        rotation,
        newLeftEnd: tile.left,
        newRightEnd: tile.right,
        x: 0,
        y: 0
      };
    }


    if (tile.isDouble) {
      rotation = 90;
      oppositeValue = tile.left;
    } else {
  
      if (tile.left === targetEnd) {
        rotation = side === 'left' ? 180 : 0;
        oppositeValue = tile.right;
      } else if (tile.right === targetEnd) {
        rotation = side === 'left' ? 0 : 180;
        oppositeValue = tile.left;
      } else {
       
        console.warn('⚠️ Conexión inesperada en calculateProfessionalPlacement');
        rotation = 0;
        oppositeValue = tile.right;
      }
    }


    let newLeftEnd = leftEnd;
    let newRightEnd = rightEnd;
    
    if (side === 'left') {
      newLeftEnd = oppositeValue;
    } else {
      newRightEnd = oppositeValue;
    }


    const position = this.calculateIntelligentPosition(tile, side, placedTiles.length, rotation);

    return { 
      rotation, 
      newLeftEnd, 
      newRightEnd,
      x: position.x,
      y: position.y 
    };
  }


  private static calculateIntelligentPosition(
    tile: DominoTile, 
    side: 'left' | 'right', 
    tileCount: number, 
    rotation: number
  ): { x: number, y: number } {
    
    const TILE_SPACING = 70;
    const ROW_HEIGHT = 130; 
    const MAX_WIDTH = 450; 

    let baseX = 0;
    let baseY = 0;


    if (side === 'left') {
      baseX = -(tileCount * TILE_SPACING) / 2;
    } else {
      baseX = (tileCount * TILE_SPACING) / 2;
    }

    if (Math.abs(baseX) > MAX_WIDTH) {
      const row = Math.floor(Math.abs(baseX) / MAX_WIDTH);
      baseY = row * ROW_HEIGHT * (side === 'left' ? -1 : 1);
      baseX = (baseX % MAX_WIDTH) * (baseX < 0 ? -1 : 1);
    }

 
    const naturalVariation = tile.isDouble ? 3 : 8;
    const randomOffset = (Math.random() - 0.5) * naturalVariation;
    
    if (rotation === 90 || rotation === 270) {
      baseY += randomOffset * 0.3;
    } else {
      baseX += randomOffset;
    }

    console.log('📍 Posición calculada:', { 
      side, 
      tileCount, 
      position: { x: baseX, y: baseY },
      rotation 
    });

    return { x: baseX, y: baseY };
  }


  static playerCanPlay(playerId: string, gameState: GameState): boolean {
    const hand = gameState.playerHands[playerId];
    
    if (gameState.placedTiles.length === 0) return true;
   
    const canPlay = hand.some((tile: DominoTile) => {
      const canPlace = this.canPlaceTile(tile, gameState);
      return canPlace.canPlace;
    });

    console.log(`🎮 Jugador ${playerId.substring(0, 8)} puede jugar:`, canPlay);
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
    
    console.log(`🎯 Movimientos VÁLIDOS para ${playerId.substring(0, 8)}:`, moves.length);
    

    moves.forEach(move => {
      console.log(`  - ${move.tile.left}-${move.tile.right} en lados: ${move.sides.join(', ')}`);
    });
    
    return moves;
  }

  static passPlayer(playerId: string, gameState: GameState): GameState {
    console.log(`🚫 Jugador ${playerId.substring(0, 8)} pasa turno`);
    
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
      console.log('🚫 JUEGO BLOQUEADO - Determinando ganador');
    }

    return newGameState;
  }

  static calculateBlockedGameWinner(gameState: GameState): string {
    let minPoints = Infinity;
    let winner = '';
    
    Object.entries(gameState.playerHands).forEach(([playerId, hand]) => {
      const points = hand.reduce((sum: number, tile: DominoTile) => sum + tile.left + tile.right, 0);
      console.log(`🔢 Jugador ${playerId.substring(0, 8)}: ${points} puntos`);
      
      if (points < minPoints) {
        minPoints = points;
        winner = playerId;
      }
    });
    
    console.log(`🏆 Ganador por bloqueo: ${winner.substring(0, 8)} con ${minPoints} puntos`);
    return winner;
  }
}