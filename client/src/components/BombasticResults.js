import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

const BombasticResults = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

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
    if (!gameState) return { winner: null, loser: null };

    const contestants = gameState.contestants.map(contestant => ({
      ...contestant,
      votes: gameState.votes[contestant.id]
    }));

    const sortedContestants = [...contestants].sort((a, b) => b.votes - a.votes);
    
    const maxVotes = sortedContestants[0].votes;
    const minVotes = sortedContestants[sortedContestants.length - 1].votes;
    
    const winners = sortedContestants.filter(c => c.votes === maxVotes);
    const losers = sortedContestants.filter(c => c.votes === minVotes);
    
    return {
      winner: winners[Math.floor(Math.random() * winners.length)],
      loser: losers[Math.floor(Math.random() * losers.length)]
    };
  };

  const handleReset = () => {
    if (socket) {
      socket.emit('reset');
    }
  };

  if (!gameState) {
    return (
      <div className="page-container">
        <div className="mtg-title">Loading...</div>
      </div>
    );
  }

  const { winner, loser } = getResults();
  const totalVotes = Object.values(gameState.votes).reduce((sum, votes) => sum + votes, 0);
  const voterCount = gameState.userVotes ? Object.keys(gameState.userVotes).length : 0;
  const connectedUsers = gameState.connectedUserCount || 0;

  return (
    <div className="page-container">
      <h1 className="mtg-title">Bombastic Results</h1>
      <h2 className="mtg-subtitle">The Battle Has Concluded</h2>
      
      {totalVotes === 0 ? (
        <div className="results-container">
          <div className="result-title" style={{ color: '#c0c0c0' }}>
            No votes have been cast yet...
          </div>
          <div style={{ fontSize: '1.2rem', color: '#c0c0c0', marginTop: '1rem' }}>
            Return to Party Time to cast your votes!
          </div>
        </div>
      ) : (
        <div className="results-container">
          {winner && (
            <div className="winner-section">
              <div className="result-title winner-title">🏆 Champion</div>
              <div className="result-character">{winner.emoji}</div>
              <div className="result-name">{winner.name}</div>
              <div className="result-votes">{winner.votes} votes</div>
            </div>
          )}
          
          {loser && winner && winner.id !== loser.id && (
            <div className="loser-section">
              <div className="result-title loser-title">💀 Defeated</div>
              <div className="result-character">{loser.emoji}</div>
              <div className="result-name">{loser.name}</div>
              <div className="result-votes">{loser.votes} votes</div>
            </div>
          )}
          
          <div className="voting-statistics">
            <div className="stat-item">
              <span className="stat-label">Total Votes Cast:</span>
              <span className="stat-value">{totalVotes}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">People Who Voted:</span>
              <span className="stat-value">{voterCount}</span>
            </div>
            {gameState.roundActive && (
              <div className="stat-item">
                <span className="stat-label">Connected Users:</span>
                <span className="stat-value">{connectedUsers}</span>
              </div>
            )}
          </div>
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