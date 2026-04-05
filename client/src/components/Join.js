import React, { useState } from 'react';

function Join({ onJoin }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onJoin(username.trim());
    }
  };

  return (
    <div className="join-container">
      <h1>💬 Chat App</h1>
      <p>Enter your name to join the conversation</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="join-input"
          placeholder="Enter your name..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
          autoFocus
        />
        <button 
          type="submit" 
          className="join-button"
          disabled={!username.trim()}
        >
          Join Chat
        </button>
      </form>
    </div>
  );
}

export default Join;
