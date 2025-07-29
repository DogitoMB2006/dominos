import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomCode: string) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onRoomCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { createRoom } = useGame();

  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      setError('');
      const roomCode = await createRoom();
      onRoomCreated(roomCode);
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Crear Nueva Sala</h2>
          <p className="text-gray-300">Se creará una sala para 4 jugadores (2v2)</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-2">Configuración de la Sala:</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Modalidad: 2 vs 2 (Equipos)</li>
              <li>• Máximo 4 jugadores</li>
              <li>• Código de sala único</li>
              <li>• Link para compartir</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600/80 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Sala'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;