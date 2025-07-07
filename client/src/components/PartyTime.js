import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

const PartyTime = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState(null);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [roundFinished, setRoundFinished] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    console.log('Attempting to connect to Socket.IO server...');
    // Use relative URL in production, localhost in development
    const serverUrl = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3001';
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server successfully!', newSocket.id);
      setConnectionStatus('connected');
      // Tell server we're on the party-time page
      newSocket.emit('joinPage', { page: 'party-time' });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('error');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setConnectionStatus('disconnected');
    });

    newSocket.on('gameState', (state) => {
      console.log('Received initial gameState:', state);
      console.log('My socket ID:', newSocket.id);
      console.log('User votes in initial state:', state.userVotes);
      
      setGameState(state);
      setRoundFinished(!state.roundActive);
      
      // Check if we have already voted
      if (state.userVotes && state.userVotes[newSocket.id]) {
        console.log('Initial state: I have voted for:', state.userVotes[newSocket.id]);
        setHasVoted(true);
        setVotedFor(state.userVotes[newSocket.id]);
      } else {
        console.log('Initial state: I have not voted yet');
        setHasVoted(false);
        setVotedFor(null);
      }
    });

    newSocket.on('voteUpdate', (state) => {
      console.log('Received voteUpdate:', state);
      console.log('My socket ID:', newSocket.id);
      console.log('User votes:', state.userVotes);
      
      setGameState(state);
      setRoundFinished(!state.roundActive);
      
      // Update voting state when receiving vote updates
      if (state.userVotes && state.userVotes[newSocket.id]) {
        console.log('I have voted for:', state.userVotes[newSocket.id]);
        setHasVoted(true);
        setVotedFor(state.userVotes[newSocket.id]);
      } else {
        console.log('I have not voted yet');
        setHasVoted(false);
        setVotedFor(null);
      }
    });

    newSocket.on('roundTimer', (data) => {
      setTimeRemaining(data.endTime);
    });

    newSocket.on('roundFinished', (state) => {
      setGameState(state);
      setRoundFinished(true);
      setTimeRemaining(null);
    });

    newSocket.on('gameReset', (state) => {
      setGameState(state);
      setHasVoted(false);
      setVotedFor(null);
      setError('');
      setTimeRemaining(null);
      setRoundFinished(false);
    });

    newSocket.on('error', (errorMsg) => {
      setError(errorMsg);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!timeRemaining) return;

    const interval = setInterval(() => {
      // Force re-render to update timer display
      setGameState(prev => ({ ...prev }));
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleVote = (contestantId) => {
    if (roundFinished) {
      setError('Round has ended, votes are no longer accepted');
      return;
    }

    if (!socket || !socket.connected) {
      setError('Not connected to server. Please refresh the page.');
      return;
    }

    // Only emit vote, don't set local state until server confirms
    console.log('Emitting vote for contestant:', contestantId);
    socket.emit('vote', { contestantId });
    setError('');
  };

  const handleReset = () => {
    if (socket) {
      socket.emit('reset');
    }
  };

  const formatTime = (timeMs) => {
    const seconds = Math.ceil(timeMs / 1000);
    return `${seconds}s`;
  };

  const getCurrentRemainingTime = () => {
    if (!timeRemaining) return 0;
    return Math.max(0, timeRemaining - Date.now());
  };

  const getManaColor = (contestantId) => {
    const colors = {
      1: 'white',    // Sergio
      2: 'red',      // Iker  
      3: 'black',    // Luis
      4: 'green',    // Pok
      5: 'blue',     // Victor
      6: 'multicolor' // Ima
    };
    return colors[contestantId] || 'generic';
  };

  const getManaSymbol = (contestantId) => {
    const symbols = {
      1: 'W',  // White
      2: 'R',  // Red
      3: 'B',  // Black
      4: 'G',  // Green
      5: 'U',  // Blue (U is used for blue in MTG)
      6: 'X'   // Variable/Multicolor
    };
    return symbols[contestantId] || '3';
  };

  if (!gameState) {
    return (
      <div className="page-container">
        <div className="mtg-title">Magic Poll</div>
        <div className="mtg-subtitle">
          {connectionStatus === 'connecting' && 'Connecting to server...'}
          {connectionStatus === 'connected' && 'Loading game state...'}
          {connectionStatus === 'error' && 'Connection failed. Please refresh the page.'}
          {connectionStatus === 'disconnected' && 'Disconnected from server. Reconnecting...'}
        </div>
        {connectionStatus === 'error' && (
          <div className="error-message">
            Make sure the server is running on port 3001
          </div>
        )}
      </div>
    );
  }

  const remainingTime = getCurrentRemainingTime();

  return (
    <div className="page-container">
      <h1 className="mtg-title">Party Time</h1>
      <h2 className="mtg-subtitle">Choose Your Champion</h2>
      
      {timeRemaining && remainingTime > 0 && (
        <div className="round-timer">
          Round ends in: {formatTime(remainingTime)}
        </div>
      )}
      
      {roundFinished && (
        <div className="round-status finished">
          Round Finished! Check results or reset to start a new round.
        </div>
      )}
      
      {!roundFinished && hasVoted && (
        <div className="round-status active">
          You can change your vote until the round ends!
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="contestants-grid">
        {gameState.contestants.map((contestant) => (
          <div
            key={contestant.id}
            className={`mtg-card ${roundFinished ? 'disabled' : ''} ${votedFor === contestant.id ? 'selected' : ''}`}
            onClick={() => handleVote(contestant.id)}
          >
            <div className="mtg-card-border">
              <div className="mtg-card-inner">
                <div className="mtg-card-header">
                  <div className="mtg-card-name">{contestant.name}</div>
                  <div className="mtg-card-cost">
                    <div className={`mana-symbol ${getManaColor(contestant.id)}`}>
                      {getManaSymbol(contestant.id)}
                    </div>
                  </div>
                </div>
                
                <div className="mtg-card-art">
                  <span className="contestant-emoji">{contestant.emoji}</span>
                </div>
                
                <div className="mtg-card-type-line">
                  <div className="type-text">Legendary Creature — Champion</div>
                </div>
                
                <div className="mtg-card-textbox">
                  <div className="ability-text">
                    <strong>Rally</strong> — When {contestant.name} enters the battlefield, gain control of the vote.
                  </div>
                  <div className="flavor-text">
                    <em>"In the arena of champions, only one voice matters."</em>
                  </div>
                </div>
                
                <div className="mtg-card-pt-box">
                  <div className="power-toughness">
                    {gameState.votes ? gameState.votes[contestant.id] || 0 : 0}/{gameState.votes ? gameState.votes[contestant.id] || 0 : 0}
                  </div>
                </div>
                
                {votedFor === contestant.id && (
                  <div className="vote-indicator">✓</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="navigation-buttons">
        <Link to="/bombastic-results" className="nav-button">
          View Results
        </Link>
        <button className="reset-button" onClick={handleReset}>
          Reset Round
        </button>
      </div>
    </div>
  );
};

export default PartyTime;