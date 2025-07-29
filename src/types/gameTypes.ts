export interface Player {
  uid: string;
  username: string;
  isHost: boolean;
  team: 'A' | 'B';
  isReady: boolean;
}

export interface GameRoom {
  id: string;
  code: string;
  host: string;
  players: Player[];
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  createdAt: Date;
  maxPlayers: number;
  teams: {
    A: Player[];
    B: Player[];
  };
}

export interface GameSettings {
  maxPoints: number;
  timeLimit: number;
  allowSpectators: boolean;
}