import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import Router from './router/Router';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <Router />
      </GameProvider>
    </AuthProvider>
  );
}

export default App;