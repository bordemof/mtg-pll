import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

const BombasticResults = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    console.log('BombasticResults: Attempting to connect to Socket.IO server...');
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
      console.log('BombasticResults: Connected to server successfully!', newSocket.id);
      setConnectionStatus('connected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('BombasticResults: Socket connection error:', error);
      setConnectionStatus('error');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('BombasticResults: Disconnected from server:', reason);
      setConnectionStatus('disconnected');
    });

    newSocket.on('gameState', (state) => {
      setGameState(state);
    });

    newSocket.on('voteUpdate', (state) => {
      setGameState(state);
    });

    newSocket.on('gameReset', (state) => {
      setGameState(state);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const getResults = () => {
    if (!gameState) return { winners: [], losers: [] };

    const contestants = gameState.contestants.map(contestant => ({
      ...contestant,
      votes: gameState.votes[contestant.id] || 0
    }));

    const sortedContestants = [...contestants].sort((a, b) => b.votes - a.votes);
    
    // If no votes were cast at all, return empty results
    if (sortedContestants[0].votes === 0) {
      return { winners: [], losers: [] };
    }
    
    const maxVotes = sortedContestants[0].votes;
    const minVotes = sortedContestants[sortedContestants.length - 1].votes;
    
    const winners = sortedContestants.filter(c => c.votes === maxVotes);
    const losers = sortedContestants.filter(c => c.votes === minVotes && c.votes !== maxVotes);
    
    return { winners, losers };
  };

  const handleReset = () => {
    if (socket) {
      socket.emit('reset');
    }
  };

  if (!gameState) {
    return (
      <div className="page-container">
        <div className="mtg-title">Bombastic Results</div>
        <div className="mtg-subtitle">
          {connectionStatus === 'connecting' && 'Connecting to server...'}
          {connectionStatus === 'connected' && 'Loading results...'}
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

  const { winners, losers } = getResults();
  const totalVotes = Object.values(gameState.votes).reduce((sum, votes) => sum + votes, 0);
  const voterCount = gameState.userVotes ? Object.keys(gameState.userVotes).length : 0;
  const connectedUsers = gameState.connectedUserCount || 0;

  return (
    <div className="page-container">
      <h1 className="mtg-title">Bombastic Results</h1>
      <h2 className="mtg-subtitle">
        {gameState.roundActive ? "Battle in Progress..." : "The Battle Has Concluded"}
      </h2>
      
      {totalVotes === 0 ? (
        <div className="results-container">
          <div className="result-title" style={{ color: '#c0c0c0' }}>
            No votes have been cast yet...
          </div>
          <div style={{ fontSize: '1.2rem', color: '#c0c0c0', marginTop: '1rem' }}>
            Return to Party Time to cast your votes!
          </div>
        </div>
      ) : gameState.roundActive ? (
        <div className="results-container">
          <div className="voting-in-progress">
            <div className="result-title" style={{ color: '#4caf50' }}>
              🔥 Votes Are Being Cast! 🔥
            </div>
            <div className="flames-container">
              {gameState.contestants
                .filter(contestant => gameState.votes[contestant.id] > 0)
                .map((contestant, index) => (
                  <div key={contestant.id} className="flame-indicator" style={{animationDelay: `${index * 0.2}s`}}>
                    <div className="flame voted">🔥</div>
                  </div>
                ))}
            </div>
            <div className="voting-status">
              <p>Watching the magical votes flow in real-time...</p>
              <p>Results will be revealed when the round ends!</p>
            </div>
          </div>
          
          <div className="voting-statistics">
            <div className="stat-item">
              <span className="stat-label">Total Votes Cast:</span>
              <span className="stat-value">{totalVotes}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">People Who Voted:</span>
              <span className="stat-value">{voterCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Connected Users:</span>
              <span className="stat-value">{connectedUsers}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="results-container">
          {totalVotes === 0 ? (
            <div className="result-title" style={{ color: '#c0c0c0' }}>
              Round ended with no votes cast
            </div>
          ) : (
            <>
              {winners.length > 0 && (
            <div className="winner-section">
              <div className="result-title winner-title">
                🏆 {winners.length === 1 ? 'Champion' : 'Champions'} 🏆
              </div>
              <div className="multiple-results">
                {winners.map((winner) => (
                  <div key={winner.id} className="result-card winner-card">
                    <div className="result-character">{winner.emoji}</div>
                    <div className="result-name">{winner.name}</div>
                    <div className="result-votes">{winner.votes} votes</div>
                  </div>
                ))}
              </div>
              {winners.length > 1 && (
                <div className="tie-message">It's a tie! Multiple champions share the victory!</div>
              )}
            </div>
          )}
          
          {losers.length > 0 && (
            <div className="loser-section">
              <div className="result-title loser-title">
                💀 {losers.length === 1 ? 'Defeated' : 'Defeated'} 💀
              </div>
              <div className="multiple-results">
                {losers.map((loser) => (
                  <div key={loser.id} className="result-card loser-card">
                    <div className="result-character">{loser.emoji}</div>
                    <div className="result-name">{loser.name}</div>
                    <div className="result-votes">{loser.votes} votes</div>
                  </div>
                ))}
              </div>
              {losers.length > 1 && (
                <div className="tie-message">Multiple contestants share the defeat...</div>
              )}
            </div>
          )}
          
          {totalVotes > 0 && (
            <div className="voting-statistics">
              <div className="stat-item">
                <span className="stat-label">Total Votes Cast:</span>
                <span className="stat-value">{totalVotes}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">People Who Voted:</span>
                <span className="stat-value">{voterCount}</span>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      )}

      <div className="navigation-buttons">
        <Link to="/party-time" className="nav-button">
          Back to Voting
        </Link>
        <button className="reset-button" onClick={handleReset}>
          Reset Round
        </button>
      </div>
    </div>
  );
};

export default BombasticResults;