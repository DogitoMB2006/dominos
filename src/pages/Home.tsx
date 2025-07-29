import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/ui/Navbar';
import CreateRoomModal from '../components/game/CreateRoomModal';
import JoinRoomModal from '../components/game/JoinRoomModal';
import RoomInfoModal from '../components/game/RoomInfoModal';

interface HomeProps {
  onJoinLobby: () => void;
}

const Home: React.FC<HomeProps> = ({ onJoinLobby }) => {
  const { userData } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRoomInfoModal, setShowRoomInfoModal] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState('');

  const handleRoomCreated = (roomCode: string) => {
    setCreatedRoomCode(roomCode);
    setShowRoomInfoModal(true);
  };

  const handleEnterLobby = () => {
    setShowRoomInfoModal(false);
    onJoinLobby();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            ¡Bienvenido, {userData?.username}! 🎯
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Prepárate para la mejor experiencia de dominó online
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <div 
            onClick={() => setShowCreateModal(true)}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition duration-300 cursor-pointer group"
          >
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition duration-300">🎮</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Crear Sala</h3>
              <p className="text-gray-300 mb-4">Crea una nueva sala para jugar con tus amigos</p>
              <div className="bg-white/10 rounded-lg p-3 text-sm text-gray-400">
                <p>• Modalidad 2v2</p>
                <p>• Hasta 4 jugadores</p>
                <p>• Código único</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setShowJoinModal(true)}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition duration-300 cursor-pointer group"
          >
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition duration-300">👥</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Unirse a Sala</h3>
              <p className="text-gray-300 mb-4">Únete a una sala existente con el código</p>
              <div className="bg-white/10 rounded-lg p-3 text-sm text-gray-400">
                <p>• Ingresa el código</p>
                <p>• Elige tu equipo</p>
                <p>• ¡Listo para jugar!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-white mb-2">Ranking</h3>
              <p className="text-gray-300">Ve tu posición en el leaderboard</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">Estadísticas</h3>
              <p className="text-gray-300">Revisa tu progreso y logros</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-white mb-2">Configuración</h3>
              <p className="text-gray-300">Personaliza tu experiencia</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-white mb-2">Tutorial</h3>
              <p className="text-gray-300">Aprende las reglas del dominó</p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Actividad Reciente</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/20">
              <span className="text-gray-300">No hay partidas recientes</span>
              <span className="text-sm text-gray-400">¡Empieza a jugar!</span>
            </div>
          </div>
        </div>
      </div>

      <CreateRoomModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />
      
      <JoinRoomModal 
        isOpen={showJoinModal} 
        onClose={() => setShowJoinModal(false)}
        onRoomJoined={onJoinLobby}
      />

      <RoomInfoModal 
        isOpen={showRoomInfoModal}
        onClose={handleEnterLobby}
        roomCode={createdRoomCode}
      />
    </div>
  );
};

export default Home;