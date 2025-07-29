import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomJoined: () => void;
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onClose, onRoomJoined }) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { joinRoom } = useGame();

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      setError('Por favor ingresa un código de sala');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const success = await joinRoom(roomCode.trim());
      if (success) {
        onRoomJoined();
        onClose();
        setRoomCode('');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRoomCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Unirse a Sala</h2>
          <p className="text-gray-300">Ingresa el código de la sala para unirte</p>
        </div>

        <form onSubmit={handleJoinRoom} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Código de Sala
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
              placeholder="ABC123"
              maxLength={6}
            />
            <p className="text-xs text-gray-400 mt-1">
              El código tiene 6 caracteres (letras y números)
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-600/80 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !roomCode.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Conectando...' : 'Unirse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinRoomModal;