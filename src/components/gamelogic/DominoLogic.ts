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

    console.log('Checking tile placement:', tile.id, 'Left end:', leftEnd, 'Right end:', rightEnd);

    // Verificar lado izquierdo
    if (tile.left === leftEnd || tile.right === leftEnd) {
      sides.push('left');
      console.log('Can place on LEFT side');
    }
    
    // Verificar lado derecho
    if (tile.left === rightEnd || tile.right === rightEnd) {
      sides.push('right');
      console.log('Can place on RIGHT side');
    }

    console.log('Available sides for tile', tile.id, ':', sides);
    return { canPlace: sides.length > 0, sides };
  }

  static placeTile(
    tile: DominoTile, 
    side: 'left' | 'right', 
    gameState: GameState, 
    playerId: string
  ): { success: boolean, newGameState?: GameState, error?: string } {
    // Verificar que es el turno del jugador
    if (gameState.currentPlayer !== playerId) {
      return { success: false, error: 'No es tu turno' };
    }

    // Verificar que el jugador tiene la ficha
    const playerHand = gameState.playerHands[playerId];
    if (!playerHand.some((t: DominoTile) => t.id === tile.id)) {
      return { success: false, error: 'No tienes esta ficha' };
    }

    const canPlace = this.canPlaceTile(tile, gameState);
    
    if (!canPlace.canPlace || !canPlace.sides.includes(side)) {
      return { success: false, error: 'No se puede colocar esta ficha en ese lado' };
    }

    const newGameState = { ...gameState };
    const { leftEnd, rightEnd } = gameState;
    
    let rotation = 0;
    let newLeftEnd = leftEnd;
    let newRightEnd = rightEnd;
    
    if (gameState.placedTiles.length === 0) {
      // Primera ficha
      newLeftEnd = tile.left;
      newRightEnd = tile.right;
    } else if (side === 'left') {
      if (tile.right === leftEnd) {
        newLeftEnd = tile.left;
        rotation = 0;
      } else if (tile.left === leftEnd) {
        newLeftEnd = tile.right;
        rotation = 180;
      }
    } else { // side === 'right'
      if (tile.left === rightEnd) {
        newRightEnd = tile.right;
        rotation = 0;
      } else if (tile.right === rightEnd) {
        newRightEnd = tile.left;
        rotation = 180;
      }
    }

    const placedTile: PlacedTile = {
      ...tile,
      rotation: rotation as 0 | 90 | 180 | 270,
      x: side === 'left' ? -1 : gameState.placedTiles.length,
      y: 0,
      connectedSide: side,
      placedBy: playerId
    };

    // Actualizar fichas colocadas
    newGameState.placedTiles = side === 'left' 
      ? [placedTile, ...gameState.placedTiles.map((t: PlacedTile) => ({ ...t, x: t.x + 1 }))]
      : [...gameState.placedTiles, placedTile];
    
    // Remover ficha de la mano del jugador
    newGameState.playerHands[playerId] = gameState.playerHands[playerId].filter((t: DominoTile) => t.id !== tile.id);
    
    // Actualizar extremos
    newGameState.leftEnd = newLeftEnd;
    newGameState.rightEnd = newRightEnd;
    newGameState.passCount = 0;

    // Agregar al log
    const logEntry: GameLogEntry = {
      playerId,
      action: 'place',
      tile,
      timestamp: new Date()
    };
    newGameState.gameLog = [...gameState.gameLog, logEntry];

    // Cambiar al siguiente jugador
    const currentPlayerIndex = gameState.playerOrder.indexOf(playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.playerOrder.length;
    newGameState.currentPlayer = gameState.playerOrder[nextPlayerIndex];

    // Verificar victoria
    if (newGameState.playerHands[playerId].length === 0) {
      newGameState.gameEnded = true;
      newGameState.winner = playerId;
      
      // Determinar equipo ganador
      // Necesitamos obtener la información del equipo desde el contexto del juego
      newGameState.winnerTeam = null; // Se asignará en el contexto
    }

    return { success: true, newGameState };
  }

  static playerCanPlay(playerId: string, gameState: GameState): boolean {
    const hand = gameState.playerHands[playerId];
    const { leftEnd, rightEnd } = gameState;
    
    if (gameState.placedTiles.length === 0) return true;
    
    return hand.some((tile: DominoTile) => 
      tile.left === leftEnd || tile.right === leftEnd ||
      tile.left === rightEnd || tile.right === rightEnd
    );
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

    if (newGameState.passCount >= 4) {
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

  static getAvailableMoves(playerId: string, gameState: GameState): { tile: DominoTile, sides: ('left' | 'right')[] }[] {
    const hand = gameState.playerHands[playerId];
    const moves: { tile: DominoTile, sides: ('left' | 'right')[] }[] = [];
    
    hand.forEach((tile: DominoTile) => {
      const canPlace = this.canPlaceTile(tile, gameState);
      if (canPlace.canPlace) {
        moves.push({ tile, sides: canPlace.sides });
      }
    });
    
    return moves;
  }
}