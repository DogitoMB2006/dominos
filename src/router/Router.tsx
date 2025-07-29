import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import GameLobby from '../pages/GameLobby';
import GameTable from '../pages/GameTable';

const Router: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentRoom, isGameStarted } = useGame();
  const [currentPage, setCurrentPage] = React.useState<'login' | 'register' | 'home' | 'lobby' | 'game'>(() => {
    if (currentUser) {
      if (currentRoom) {
        return isGameStarted ? 'game' : 'lobby';
      }
      return 'home';
    }
    return 'login';
  });

  React.useEffect(() => {
    if (currentUser) {
      if (currentRoom) {
        if (isGameStarted) {
          setCurrentPage('game');
        } else {
          setCurrentPage('lobby');
        }
      } else {
        setCurrentPage('home');
      }
    } else {
      setCurrentPage('login');
    }
  }, [currentUser, currentRoom, isGameStarted]);

  const navigateTo = (page: 'login' | 'register' | 'home' | 'lobby' | 'game') => {
    setCurrentPage(page);
  };

  const handleJoinLobby = () => {
    setCurrentPage('lobby');
  };

  const handleLeaveLobby = () => {
    setCurrentPage('home');
  };

  switch (currentPage) {
    case 'register':
      return <Register onNavigate={navigateTo} />;
    case 'game':
      return <GameTable />;
    case 'lobby':
      return <GameLobby onLeave={handleLeaveLobby} />;
    case 'home':
      return <Home onJoinLobby={handleJoinLobby} />;
    default:
      return <Login onNavigate={navigateTo} />;
  }
};

export default Router;