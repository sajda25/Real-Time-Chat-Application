import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

function Chat({ username }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Emit user join event
    newSocket.emit('user_join', username);

    // Fetch message history
    fetch(`${SOCKET_URL}/api/messages`)
      .then((res) => res.json())
      .then((data) => {
        const formattedMessages = data.map((msg) => ({
          username: msg.username,
          message: msg.message,
          timestamp: new Date(msg.timestamp),
          type: 'message'
        }));
        setMessages(formattedMessages);
      })
      .catch((err) => console.error('Error fetching messages:', err));

    // Listen for incoming messages
    newSocket.on('receive_message', (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          username: data.username,
          message: data.message,
          timestamp: new Date(data.timestamp),
          type: 'message'
        }
      ]);
    });

    // Listen for user connected events
    newSocket.on('user_connected', (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          message: data.message,
          type: 'system'
        }
      ]);
      setUserCount(data.userCount);
    });

    // Listen for user disconnected events
    newSocket.on('user_disconnected', (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          message: data.message,
          type: 'system'
        }
      ]);
      setUserCount(data.userCount);
    });

    // Listen for active users count
    newSocket.on('active_users', (count) => {
      setUserCount(count);
    });

    // Listen for typing indicators
    newSocket.on('user_typing', (user) => {
      setIsTyping(true);
      setTypingUser(user);
    });

    newSocket.on('user_stop_typing', () => {
      setIsTyping(false);
      setTypingUser('');
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [username]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (inputMessage.trim() && socket) {
      const messageData = {
        username,
        message: inputMessage.trim(),
        timestamp: new Date()
      };

      socket.emit('send_message', messageData);
      setInputMessage('');
      
      // Stop typing indicator
      socket.emit('stop_typing');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (socket && e.target.value.trim()) {
      socket.emit('typing', username);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing');
      }, 2000);
    } else if (socket) {
      socket.emit('stop_typing');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>💬 Chat Room</h1>
        <div className="user-info">
          <span>Welcome, <strong>{username}</strong></span>
          <div className="user-count">
            <span className="online-indicator"></span>
            <span>{userCount} online</span>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => {
          if (msg.type === 'system') {
            return (
              <div key={index} className="system-message">
                {msg.message}
              </div>
            );
          }

          const isOwnMessage = msg.username === username;
          
          return (
            <div 
              key={index} 
              className={`message ${isOwnMessage ? 'own' : 'other'}`}
            >
              <div className="message-header">
                <span className="username">{msg.username}</span>
                <span className="timestamp">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-bubble">
                {msg.message}
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="typing-indicator">
            <span style={{ marginRight: '8px', fontSize: '13px', color: '#64748b' }}>
              {typingUser} is typing
            </span>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={handleInputChange}
          autoFocus
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!inputMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
