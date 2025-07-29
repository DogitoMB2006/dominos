import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { type GameRoom, type Player } from '../types/gameTypes';
import { type GameState, type DominoTile, type PlayerPosition } from '../types/dominoTypes';
import { DominoGameLogic } from '../components/gamelogic/DominoLogic';

interface GameContextType {
  currentRoom: GameRoom | null;
  gameState: GameState | null;
  playerPositions: PlayerPosition[];
  isGameStarted: boolean;
  createRoom: () => Promise<string>;
  joinRoom: (roomCode: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  switchTeam: (team: 'A' | 'B') => Promise<void>;
  toggleReady: () => Promise<void>;
  startGame: () => Promise<void>;
  placeTile: (tile: DominoTile, side?: 'left' | 'right') => Promise<void>;
  passMove: () => Promise<void>;
  loading: boolean;
  error: string;
}

const GameContext = createContext<GameContextType>({} as GameContextType);

export const useGame = () => useContext(GameContext);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { userData } = useAuth();

  const generateRoomCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async (): Promise<string> => {
    if (!userData) throw new Error('Usuario no autenticado');

    try {
      setLoading(true);
      setError('');

      const roomCode = generateRoomCode();
      const roomId = `room_${roomCode}`;

      const hostPlayer: Player = {
        uid: userData.uid,
        username: userData.username,
        isHost: true,
        team: 'A',
        isReady: false
      };

      const newRoom: GameRoom = {
        id: roomId,
        code: roomCode,
        host: userData.uid,
        players: [hostPlayer],
        status: 'waiting',
        createdAt: new Date(),
        maxPlayers: 4,
        teams: {
          A: [hostPlayer],
          B: []
        }
      };

      await setDoc(doc(db, 'gameRooms', roomId), newRoom);

      // Set up room listener
      onSnapshot(doc(db, 'gameRooms', roomId), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const roomData = docSnapshot.data() as GameRoom;
          setCurrentRoom(roomData);
        } else {
          setCurrentRoom(null);
        }
      });

      setCurrentRoom(newRoom);
      return roomCode;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomCode: string): Promise<boolean> => {
    if (!userData) throw new Error('Usuario no autenticado');

    try {
      setLoading(true);
      setError('');

      const roomId = `room_${roomCode.toUpperCase()}`;
      const roomDoc = await getDoc(doc(db, 'gameRooms', roomId));

      if (!roomDoc.exists()) {
        setError('Sala no encontrada');
        return false;
      }

      const roomData = roomDoc.data() as GameRoom;

      if (roomData.players.length >= 4) {
        setError('La sala está llena');
        return false;
      }

      if (roomData.players.some((p: Player) => p.uid === userData.uid)) {
        setError('Ya estás en esta sala');
        return false;
      }

      const newPlayer: Player = {
        uid: userData.uid,
        username: userData.username,
        isHost: false,
        team: roomData.teams.A.length <= roomData.teams.B.length ? 'A' : 'B',
        isReady: false
      };

      const updatedPlayers = [...roomData.players, newPlayer];
      const updatedTeams = {
        A: updatedPlayers.filter((p: Player) => p.team === 'A'),
        B: updatedPlayers.filter((p: Player) => p.team === 'B')
      };

      await updateDoc(doc(db, 'gameRooms', roomId), {
        players: updatedPlayers,
        teams: updatedTeams
      });

      // Set up room listener after joining
      onSnapshot(doc(db, 'gameRooms', roomId), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const roomData = docSnapshot.data() as GameRoom;
          setCurrentRoom(roomData);
        } else {
          setCurrentRoom(null);
        }
      });

      return true;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async (): Promise<void> => {
    if (!currentRoom || !userData) return;

    try {
      setLoading(true);

      const updatedPlayers = currentRoom.players.filter((p: Player) => p.uid !== userData.uid);

      if (updatedPlayers.length === 0) {
        // Delete room if empty
        await deleteDoc(doc(db, 'gameRooms', currentRoom.id));
        if (gameState) {
          await deleteDoc(doc(db, 'gameStates', currentRoom.id));
        }
      } else {
        // Update room with remaining players
        let newHost = currentRoom.host;
        if (currentRoom.host === userData.uid && updatedPlayers.length > 0) {
          newHost = updatedPlayers[0].uid;
          updatedPlayers[0].isHost = true;
        }

        const updatedTeams = {
          A: updatedPlayers.filter((p: Player) => p.team === 'A'),
          B: updatedPlayers.filter((p: Player) => p.team === 'B')
        };

        await updateDoc(doc(db, 'gameRooms', currentRoom.id), {
          players: updatedPlayers,
          teams: updatedTeams,
          host: newHost
        });
      }

      setCurrentRoom(null);
      setGameState(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchTeam = async (team: 'A' | 'B'): Promise<void> => {
    if (!currentRoom || !userData) return;

    try {
      const targetTeam = currentRoom.teams[team];
      if (targetTeam.length >= 2) {
        setError('El equipo está lleno');
        return;
      }

      const updatedPlayers = currentRoom.players.map((p: Player) =>
        p.uid === userData.uid ? { ...p, team, isReady: false } : p
      );

      const updatedTeams = {
        A: updatedPlayers.filter((p: Player) => p.team === 'A'),
        B: updatedPlayers.filter((p: Player) => p.team === 'B')
      };

      await updateDoc(doc(db, 'gameRooms', currentRoom.id), {
        players: updatedPlayers,
        teams: updatedTeams
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const toggleReady = async (): Promise<void> => {
    if (!currentRoom || !userData) return;

    try {
      const updatedPlayers = currentRoom.players.map((p: Player) =>
        p.uid === userData.uid ? { ...p, isReady: !p.isReady } : p
      );

      const updatedTeams = {
        A: updatedPlayers.filter((p: Player) => p.team === 'A'),
        B: updatedPlayers.filter((p: Player) => p.team === 'B')
      };

      await updateDoc(doc(db, 'gameRooms', currentRoom.id), {
        players: updatedPlayers,
        teams: updatedTeams
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const startGame = async (): Promise<void> => {
    if (!currentRoom || !userData) return;

    try {
      setLoading(true);

      // Update room status to playing
      await updateDoc(doc(db, 'gameRooms', currentRoom.id), {
        status: 'playing'
      });

      // Create initial game state
      const allTiles = DominoGameLogic.createFullSet();
      const playerIds = currentRoom.players.map((p: Player) => p.uid);
      const hands = DominoGameLogic.distributeHands(allTiles, playerIds);
      const startingPlayer = DominoGameLogic.findPlayerWithHighestDouble(hands);
      const playerOrder = DominoGameLogic.createPlayerOrder(startingPlayer, playerIds);

      const initialGameState = {
        tiles: allTiles,
        playerHands: hands,
        placedTiles: [],
        currentPlayer: startingPlayer,
        playerOrder,
        gameStarted: true,
        gameEnded: false,
        winner: null,
        winnerTeam: null,
        leftEnd: -1,
        rightEnd: -1,
        passCount: 0,
        gameLog: [{
          playerId: startingPlayer,
          action: 'start' as const,
          timestamp: new Date()
        }]
      };

      await setDoc(doc(db, 'gameStates', currentRoom.id), initialGameState);
      setGameState(initialGameState as GameState);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const placeTile = async (tile: DominoTile, side: 'left' | 'right' = 'left'): Promise<void> => {
    if (!gameState || !userData || !currentRoom) {
      console.log('Missing requirements:', { gameState: !!gameState, userData: !!userData, currentRoom: !!currentRoom });
      return;
    }

    if (gameState.currentPlayer !== userData.uid) {
      setError('No es tu turno');
      console.log('Not your turn. Current player:', gameState.currentPlayer, 'Your ID:', userData.uid);
      return;
    }

    // Verificar si el jugador puede jugar
    if (!DominoGameLogic.playerCanPlay(userData.uid, gameState)) {
      console.log('Player cannot play, auto-passing...');
      await passMove();
      return;
    }

    try {
      setError('');
      console.log('Placing tile:', tile.id, 'on side:', side, 'by player:', userData.uid);
      
      const result = DominoGameLogic.placeTile(tile, side, gameState, userData.uid);
      
      if (!result.success || !result.newGameState) {
        setError(result.error || 'No se puede colocar la ficha');
        console.error('Failed to place tile:', result.error);
        return;
      }

      // Determinar equipo ganador si hay victoria
      if (result.newGameState && result.newGameState.gameEnded && result.newGameState.winner && currentRoom) {
        const winnerPlayer = currentRoom.players.find((p: Player) => p.uid === result.newGameState!.winner);
        if (winnerPlayer) {
          result.newGameState.winnerTeam = winnerPlayer.team;
        }
      }

      console.log('Updating game state in Firebase...');
      await updateDoc(doc(db, 'gameStates', currentRoom.id), result.newGameState as { [x: string]: any });
      console.log('Game state updated successfully');
      
    } catch (error: any) {
      console.error('Error placing tile:', error);
      setError(error.message);
    }
  };

  const passMove = async (): Promise<void> => {
    if (!gameState || !userData || !currentRoom) {
      console.log('Missing requirements for pass:', { gameState: !!gameState, userData: !!userData, currentRoom: !!currentRoom });
      return;
    }

    if (gameState.currentPlayer !== userData.uid) {
      setError('No es tu turno');
      console.log('Not your turn to pass. Current player:', gameState.currentPlayer, 'Your ID:', userData.uid);
      return;
    }

    try {
      setError('');
      console.log('Player passing turn:', userData.uid);
      
      const newGameState = DominoGameLogic.passPlayer(userData.uid, gameState);
      
      console.log('Updating pass in Firebase...');
      await updateDoc(doc(db, 'gameStates', currentRoom.id), newGameState as { [x: string]: any });
      console.log('Pass updated successfully');
      
    } catch (error: any) {
      console.error('Error passing turn:', error);
      setError(error.message);
    }
  };

  const calculatePlayerPositions = (): PlayerPosition[] => {
    if (!currentRoom || !userData) return [];

    const positions: PlayerPosition[] = [];
    const currentUserIndex = currentRoom.players.findIndex((p: Player) => p.uid === userData.uid);
    
    if (currentUserIndex === -1) return [];

    const positionMap = ['bottom', 'left', 'top', 'right'] as const;
    
    currentRoom.players.forEach((player: Player, index: number) => {
      const relativeIndex = (index - currentUserIndex + 4) % 4;
      positions.push({
        playerId: player.uid,
        username: player.username,
        team: player.team,
        position: positionMap[relativeIndex],
        handCount: gameState?.playerHands[player.uid]?.length || 7,
        isCurrentPlayer: gameState?.currentPlayer === player.uid
      });
    });

    return positions;
  };

  // Set up game state listener when room status changes to playing
  useEffect(() => {
    if (currentRoom?.status === 'playing' && currentRoom.id) {
      const gameUnsubscribe = onSnapshot(doc(db, 'gameStates', currentRoom.id), (gameDoc) => {
        if (gameDoc.exists()) {
          setGameState(gameDoc.data() as GameState);
        }
      });

      return () => gameUnsubscribe();
    } else {
      setGameState(null);
    }
  }, [currentRoom?.status, currentRoom?.id]);

  const playerPositions = calculatePlayerPositions();
  const isGameStarted = currentRoom?.status === 'playing' && gameState?.gameStarted;

  const value: GameContextType = {
    currentRoom,
    gameState,
    playerPositions,
    isGameStarted: isGameStarted || false,
    createRoom,
    joinRoom,
    leaveRoom,
    switchTeam,
    toggleReady,
    startGame,
    placeTile,
    passMove,
    loading,
    error
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};