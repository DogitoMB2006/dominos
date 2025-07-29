import React from 'react';
import { type Player } from '../../types/gameTypes';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';

interface TeamDisplayProps {
  team: 'A' | 'B';
  players: Player[];
  teamName: string;
  color: string;
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({ team, players, teamName, color }) => {
  const { userData } = useAuth();
  const { switchTeam, currentRoom } = useGame();
  
  const canJoinTeam = players.length < 2 && currentRoom?.status === 'waiting';
  const isUserInThisTeam = players.some(p => p.uid === userData?.uid);

  const handleJoinTeam = () => {
    if (canJoinTeam && !isUserInThisTeam) {
      switchTeam(team);
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 ${color}`}>
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white mb-2">
          {teamName} ({players.length}/2)
        </h3>
      </div>

      <div className="space-y-3 min-h-[120px]">
        {players.map((player, index) => (
          <div
            key={player.uid}
            className={`bg-white/10 rounded-lg p-3 border ${
              player.uid === userData?.uid ? 'border-yellow-400/50 bg-yellow-400/10' : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">{player.username}</span>
                {player.isHost && (
                  <span className="bg-yellow-600/80 text-yellow-100 text-xs px-2 py-1 rounded-full">
                    HOST
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {player.isReady ? (
                  <span className="bg-green-600/80 text-green-100 text-xs px-2 py-1 rounded-full">
                    ✓ LISTO
                  </span>
                ) : (
                  <span className="bg-gray-600/80 text-gray-100 text-xs px-2 py-1 rounded-full">
                    ESPERANDO
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {Array.from({ length: 2 - players.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-white/5 rounded-lg p-3 border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10 transition duration-200"
            onClick={handleJoinTeam}
          >
            {canJoinTeam && !isUserInThisTeam ? (
              <span className="text-gray-400 text-sm">+ Unirse al equipo</span>
            ) : (
              <span className="text-gray-500 text-sm">Esperando jugador...</span>
            )}
          </div>
        ))}
      </div>

      {isUserInThisTeam && canJoinTeam && (
        <div className="mt-4 text-center">
          <p className="text-yellow-300 text-sm">
            Estás en este equipo
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamDisplay;