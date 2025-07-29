import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
  onNavigate: (page: 'login' | 'register' | 'home') => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const { register, checkUsernameAvailable } = useAuth();

  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    const checkUsername = async () => {
      setUsernameStatus('checking');
      const isAvailable = await checkUsernameAvailable(username);
      setUsernameStatus(isAvailable ? 'available' : 'taken');
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username, checkUsernameAvailable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (usernameStatus !== 'available') {
      setError('El nombre de usuario no está disponible');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await register(email, password, username);
    } catch (error: any) {
      setError('Error al registrarse: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUsernameIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full"></div>;
      case 'available':
        return <div className="text-green-400">✓</div>;
      case 'taken':
        return <div className="text-red-400">✗</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Dominó</h1>
          <p className="text-gray-300">Crea tu cuenta para empezar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de Usuario
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="usuario123"
                maxLength={20}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getUsernameIcon()}
              </div>
            </div>
            {username.length > 0 && username.length < 3 && (
              <p className="text-yellow-400 text-sm mt-1">Mínimo 3 caracteres</p>
            )}
            {usernameStatus === 'taken' && (
              <p className="text-red-400 text-sm mt-1">Este nombre de usuario ya está tomado</p>
            )}
            {usernameStatus === 'available' && (
              <p className="text-green-400 text-sm mt-1">¡Nombre de usuario disponible!</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || usernameStatus !== 'available'}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-300">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;