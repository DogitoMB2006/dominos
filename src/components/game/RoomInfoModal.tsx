import React, { useState } from 'react';

interface RoomInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

const RoomInfoModal: React.FC<RoomInfoModalProps> = ({ isOpen, onClose, roomCode }) => {
  const [copied, setCopied] = useState(false);
  
  const roomLink = `${window.location.origin}/join/${roomCode}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">¡Sala Creada! 🎉</h2>
          <p className="text-gray-300">Comparte el código o link con tus amigos</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Código de Sala:</label>
              <button
                onClick={() => copyToClipboard(roomCode)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <span className="text-white text-2xl font-mono tracking-wider">{roomCode}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Link de Invitación:</label>
              <button
                onClick={() => copyToClipboard(roomLink)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="bg-black/20 rounded-lg p-3 break-all">
              <span className="text-white text-sm">{roomLink}</span>
            </div>
          </div>

          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">ℹ️</span>
              <div className="text-blue-100 text-sm">
                <p className="font-medium mb-1">Modalidad 2v2:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Necesitas 4 jugadores para empezar</li>
                  <li>• Los equipos se balancean automáticamente</li>
                  <li>• Todos deben estar listos para comenzar</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition duration-200"
          >
            Entrar al Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomInfoModal;