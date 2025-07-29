import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { userData, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎯</span>
            <span className="text-xl font-bold text-white">Dominó</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-white">
              <span className="text-gray-300">Hola, </span>
              <span className="font-semibold">{userData?.username}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;