import React, { useState } from 'react';
import './App.css';
import Chat from './components/Chat';
import Join from './components/Join';

function App() {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = (name) => {
    setUsername(name);
    setJoined(true);
  };

  return (
    <div className="App">
      {!joined ? (
        <Join onJoin={handleJoin} />
      ) : (
        <Chat username={username} />
      )}
    </div>
  );
}

export default App;
