import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { DominoGameLogic } from '../components/gamelogic/DominoLogic';
import GameBoard from '../components/gamelogic/GameBoard';
import PlayerHand from '../components/gamelogic/PlayerHand';
import { type DominoTile, type PlayerPosition } from '../types/dominoTypes';

const GameTable: React.FC = () => {
  const { gameState, playerPositions, placeTile, passMove, leaveRoom } = useGame();
  const { userData } = useAuth();
  const [error, setError] = useState('');

  if (!gameState || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando juego...</div>
      </div>
    );
  }

  const currentPlayerPosition = playerPositions.find(p => p.playerId === userData.uid);
  const currentPlayerHand = gameState.playerHands[userData.uid] || [];
  const isCurrentPlayer = gameState.currentPlayer === userData.uid;
  
  const availableMoves = isCurrentPlayer 
    ? DominoGameLogic.getAvailableMoves(userData.uid, gameState)
    : [];

  const canPlay = isCurrentPlayer && DominoGameLogic.playerCanPlay(userData.uid, gameState);
  const canPass = isCurrentPlayer && !canPlay;

  const handleTilePlace = async (tile: DominoTile, side?: 'left' | 'right') => {
    console.log('=== HANDLE TILE PLACE ===');
    console.log('Tile:', tile.id, 'Side:', side);
    console.log('Is current player:', isCurrentPlayer);
    console.log('Current player ID:', gameState.currentPlayer);
    console.log('User ID:', userData.uid);
    
    if (!isCurrentPlayer) {
      console.log('❌ Not current player, ignoring click');
      setError('No es tu turno');
      return;
    }
    
    try {
      setError('');
      console.log('✅ Attempting to place tile...');
      await placeTile(tile, side);
      console.log('✅ Tile placement completed');
    } catch (error: any) {
      console.error('❌ Error placing tile:', error);
      setError(error.message);
    }
  };

  const handlePass = async () => {
    try {
      setError('');
      await passMove();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleLeaveGame = async () => {
    if (window.confirm('¿Estás seguro de que quieres salir del juego?')) {
      await leaveRoom();
    }
  };

  const getPlayerTeamColor = (team: 'A' | 'B') => {
    return team === 'A' ? 'text-blue-400' : 'text-red-400';
  };

  const getWinnerMessage = () => {
    if (!gameState.gameEnded || !gameState.winner) return null;
    
    const winnerPlayer = playerPositions.find((p: PlayerPosition) => p.playerId === gameState.winner);
    const isWinner = gameState.winner === userData.uid;
    const winnerTeam = winnerPlayer?.team;
    const userTeam = currentPlayerPosition?.team;
    const teamWon = winnerTeam === userTeam;

    return (
      <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50`}>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center max-w-md">
          <div className="text-6xl mb-4">
            {teamWon ? '🎉' : '😞'}
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            {isWinner ? '¡Ganaste!' : teamWon ? '¡Tu equipo ganó!' : 'Perdiste'}
          </h2>
          <p className="text-xl text-gray-300 mb-6">
            {isWinner 
              ? '¡Felicidades! Te quedaste sin fichas'
              : `${winnerPlayer?.username} ganó la partida`
            }
          </p>
          <button
            onClick={handleLeaveGame}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-200"
          >
            Volver al Lobby
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 relative overflow-hidden">
      {/* Game Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/30 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">🎯 Mesa de Dominó</h1>
            <div className="text-sm text-gray-300">
              Fichas restantes: {Object.values(gameState.playerHands).reduce((sum, hand) => sum + hand.length, 0)}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-3 py-1 rounded text-sm">
                {error}
              </div>
            )}
            
            {canPass && (
              <button
                onClick={handlePass}
                className="bg-yellow-600/80 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition duration-200 animate-pulse"
              >
                🚫 Bloqueado - Pasar
              </button>
            )}
            
            <button
              onClick={handleLeaveGame}
              className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="absolute inset-0 pt-16">
        {/* Current Player Turn Indicator */}
        {isCurrentPlayer && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
            <div className="bg-green-600/90 text-white px-6 py-3 rounded-lg text-lg font-bold animate-pulse">
              ¡Es tu turno! Selecciona una ficha
            </div>
          </div>
        )}

        {/* All Player Hands */}
        {playerPositions.map((position: PlayerPosition) => {
          const isCurrentUserHand = position.playerId === userData.uid;
          return (
            <PlayerHand
              key={position.playerId}
              tiles={isCurrentUserHand ? currentPlayerHand : []}
              isCurrentPlayer={position.isCurrentPlayer}
              availableMoves={isCurrentUserHand ? availableMoves : []}
              onTileSelect={handleTilePlace}
              position={position.position}
              playerName={position.username}
              tileCount={position.handCount}
              showTiles={isCurrentUserHand}
            />
          );
        })}

        {/* Debug Info for All Players */}
        <div className="absolute top-4 left-4 bg-black/60 text-white p-3 rounded-lg text-xs z-30 max-w-xs">
          <div className="mb-2 font-bold">Estado del Juego:</div>
          <div>Jugador actual: {playerPositions.find((p: PlayerPosition) => p.isCurrentPlayer)?.username || 'N/A'}</div>
          <div>Tu ID: {userData.uid.substring(0, 8)}...</div>
          <div>ID actual: {gameState.currentPlayer.substring(0, 8)}...</div>
          <div>Es tu turno: {isCurrentPlayer ? 'SÍ' : 'NO'}</div>
          <div>Fichas en mesa: {gameState.placedTiles.length}</div>
          <div>Extremos: {gameState.leftEnd} | {gameState.rightEnd}</div>
          <div>Orden de jugadores:</div>
          {gameState.playerOrder.map((playerId: string, index: number) => {
            const player = playerPositions.find((p: PlayerPosition) => p.playerId === playerId);
            return (
              <div key={playerId} className="text-xs ml-2">
                {index + 1}. {player?.username} {playerId === gameState.currentPlayer ? '← ACTUAL' : ''}
              </div>
            );
          })}
          {isCurrentPlayer && (
            <>
              <div>Movimientos: {availableMoves.length}</div>
              <div>Puede pasar: {canPass ? 'SÍ' : 'NO'}</div>
            </>
          )}
        </div>

        {/* Team Score Display */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black/50 backdrop-blur-lg rounded-lg px-6 py-3 border border-white/20">
            <div className="flex items-center space-x-8 text-white">
              <div className="text-center">
                <div className="text-blue-400 font-bold">Equipo A</div>
                <div className="text-xs">
                  {playerPositions.filter((p: PlayerPosition) => p.team === 'A').map((p: PlayerPosition) => p.username).join(', ')}
                </div>
              </div>
              <div className="text-xl">VS</div>
              <div className="text-center">
                <div className="text-red-400 font-bold">Equipo B</div>
                <div className="text-xs">
                  {playerPositions.filter((p: PlayerPosition) => p.team === 'B').map((p: PlayerPosition) => p.username).join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Board in Center */}
        <div className="absolute inset-0 flex items-center justify-center p-32">
          <div className="w-full max-w-4xl h-full max-h-96">
            <GameBoard
              placedTiles={gameState.placedTiles}
              leftEnd={gameState.leftEnd}
              rightEnd={gameState.rightEnd}
            />
          </div>
        </div>

        {/* Current Player Indicator */}
        {!isCurrentPlayer && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-yellow-600/80 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              Turno de: {playerPositions.find((p: PlayerPosition) => p.isCurrentPlayer)?.username}
            </div>
          </div>
        )}

        {/* Game Log */}
        <div className="absolute top-20 right-4 w-64 max-h-96 overflow-y-auto bg-black/40 backdrop-blur-lg rounded-lg border border-white/20 p-3 z-20">
          <h3 className="text-white font-semibold mb-2 text-sm">Historial del Juego</h3>
          <div className="space-y-1">
            {gameState.gameLog.slice(-10).map((entry: any, index: number) => {
              const player = playerPositions.find((p: PlayerPosition) => p.playerId === entry.playerId);
              return (
                <div key={index} className="text-xs text-gray-300">
                  <span className={getPlayerTeamColor(player?.team || 'A')}>
                    {player?.username}
                  </span>
                  {entry.action === 'place' && entry.tile && (
                    <span> jugó {entry.tile.left}-{entry.tile.right}</span>
                  )}
                  {entry.action === 'pass' && <span> pasó turno</span>}
                  {entry.action === 'start' && <span> inició el juego</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      {getWinnerMessage()}
    </div>
  );
};

export default GameTable;