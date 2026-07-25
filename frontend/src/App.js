import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './pages/Auth';
import Main from './pages/Main';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [username, setUsername] = useState(localStorage.getItem('username'));

  const handleLogin = (token, userId, username) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    setToken(token);
    setUserId(userId);
    setUsername(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setToken(null);
    setUserId(null);
    setUsername(null);
  };

  return (
    <div className="App">
      {token ? (
        <Main
          token={token}
          userId={userId}
          username={username}
          onLogout={handleLogout}
        />
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
