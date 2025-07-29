import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import TeamDisplay from '../components/game/TeamDisplay';
import Navbar from '../components/ui/Navbar';

interface GameLobbyProps {
  onLeave: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onLeave }) => {
  const { currentRoom, leaveRoom, toggleReady, startGame, loading } = useGame();
  const { userData } = useAuth();
  const [copied, setCopied] = useState(false);

  const currentPlayer = currentRoom?.players.find(p => p.uid === userData?.uid);
  const allPlayersReady = currentRoom?.players.every(p => p.isReady) && currentRoom?.players.length === 4;
  const canStartGame = allPlayersReady && currentPlayer?.isHost;

  const copyRoomCode = async () => {
    if (currentRoom?.code) {
      try {
        await navigator.clipboard.writeText(currentRoom.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error al copiar:', error);
      }
    }
  };

  const copyRoomLink = async () => {
    if (currentRoom?.code) {
      try {
        const link = `${window.location.origin}/join/${currentRoom.code}`;
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error al copiar:', error);
      }
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      onLeave();
    } catch (error) {
      console.error('Error al salir de la sala:', error);
    }
  };

  const handleToggleReady = async () => {
    try {
      await toggleReady();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando sala...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎯 Lobby de Dominó</h1>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-2xl mx-auto mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-gray-300 mb-2">Código de Sala:</p>
                <div className="bg-black/20 rounded-lg p-3 flex items-center justify-center space-x-2">
                  <span className="text-white text-2xl font-mono tracking-wider">{currentRoom.code}</span>
                  <button
                    onClick={copyRoomCode}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 mb-2">Jugadores:</p>
                <div className="text-white text-xl font-semibold">
                  {currentRoom.players.length}/4
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={copyRoomLink}
                className="bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200 text-sm"
              >
                {copied ? '✓ Copiado' : 'Copiar Link'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-8">
          <TeamDisplay
            team="A"
            players={currentRoom.teams.A}
            teamName="Equipo A"
            color="border-l-4 border-l-blue-500"
          />
          
          <TeamDisplay
            team="B"
            players={currentRoom.teams.B}
            teamName="Equipo B"
            color="border-l-4 border-l-red-500"
          />
        </div>

        <div className="text-center space-y-4">
          {currentRoom.players.length < 4 && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-100 px-6 py-3 rounded-lg inline-block">
              Esperando más jugadores para comenzar ({currentRoom.players.length}/4)
            </div>
          )}

          {currentRoom.players.length === 4 && !allPlayersReady && (
            <div className="bg-blue-500/20 border border-blue-500/50 text-blue-100 px-6 py-3 rounded-lg inline-block">
              Esperando que todos los jugadores estén listos
            </div>
          )}

          {allPlayersReady && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-6 py-3 rounded-lg inline-block">
              ¡Todos listos! {currentPlayer?.isHost ? 'Puedes iniciar el juego' : 'Esperando al host'}
            </div>
          )}

          <div className="flex justify-center space-x-4">
            {currentRoom.players.length === 4 && currentPlayer && (
              <button
                onClick={handleToggleReady}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentPlayer.isReady
                    ? 'bg-yellow-600/80 hover:bg-yellow-600 text-white'
                    : 'bg-green-600/80 hover:bg-green-600 text-white'
                }`}
              >
                {loading ? 'Cambiando...' : currentPlayer.isReady ? 'No Estoy Listo' : 'Estoy Listo'}
              </button>
            )}

            {canStartGame && (
              <button
                onClick={async () => {
                  try {
                    await startGame();
                  } catch (error) {
                    console.error('Error al iniciar juego:', error);
                  }
                }}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200"
              >
                🎮 Iniciar Juego
              </button>
            )}

            <button
              onClick={handleLeaveRoom}
              className="bg-red-600/80 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition duration-200"
            >
              Salir de la Sala
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Reglas del Juego</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">Modalidad 2v2:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Equipos de 2 jugadores cada uno</li>
                <li>• Los compañeros se sientan opuestos</li>
                <li>• Estrategia en equipo</li>
                <li>• Comunicación permitida</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Objetivo:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Ser el primer equipo en quedarse sin fichas</li>
                <li>• Bloquear al equipo contrario</li>
                <li>• Sumar menos puntos al final</li>
                <li>• Trabajar en equipo para ganar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;