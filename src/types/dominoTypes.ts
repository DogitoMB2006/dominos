export interface DominoTile {
  id: string;
  left: number;
  right: number;
  isDouble: boolean;
  rotation: 0 | 90 | 180 | 270;
}

export interface PlacedTile extends DominoTile {
  x: number;
  y: number;
  connectedSide: 'left' | 'right';
  placedBy: string;
}

export interface GameState {
  tiles: DominoTile[];
  playerHands: { [playerId: string]: DominoTile[] };
  placedTiles: PlacedTile[];
  currentPlayer: string;
  playerOrder: string[];
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  winnerTeam: 'A' | 'B' | null;
  leftEnd: number;
  rightEnd: number;
  passCount: number;
  gameLog: GameLogEntry[];
}

export interface GameLogEntry {
  playerId: string;
  action: 'place' | 'pass' | 'start' | 'win';
  tile?: DominoTile;
  timestamp: Date;
}

export interface PlayerPosition {
  playerId: string;
  username: string;
  team: 'A' | 'B';
  position: 'top' | 'right' | 'bottom' | 'left';
  handCount: number;
  isCurrentPlayer: boolean;
}