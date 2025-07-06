const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, 'client/build')));

let gameState = {
  votes: {},
  userVotes: {},
  contestants: [
    { id: 1, name: 'Sergio', emoji: '🧙‍♂️' },
    { id: 2, name: 'Iker', emoji: '🔥' },
    { id: 3, name: 'Luis', emoji: '🖤' },
    { id: 4, name: 'Pok', emoji: '🌿' },
    { id: 5, name: 'Victor', emoji: '⚔️' },
    { id: 6, name: 'Ima', emoji: '🌸' }
  ],
  roundActive: true,
  roundTimer: null,
  roundEndTime: null,
  connectedUsers: new Set()
};

gameState.contestants.forEach(contestant => {
  gameState.votes[contestant.id] = 0;
});

function startRoundTimer() {
  if (gameState.roundTimer) return; // Timer already started
  
  gameState.roundEndTime = Date.now() + 30000; // 30 seconds from now
  gameState.roundTimer = setTimeout(() => {
    finishRound();
  }, 30000);
  
  console.log('Round timer started - 30 seconds remaining');
  io.emit('roundTimer', { endTime: gameState.roundEndTime });
}

function finishRound() {
  gameState.roundActive = false;
  if (gameState.roundTimer) {
    clearTimeout(gameState.roundTimer);
    gameState.roundTimer = null;
  }
  
  console.log('Round finished');
  io.emit('roundFinished', getCleanGameState());
}

function getCleanGameState() {
  return {
    votes: gameState.votes,
    userVotes: gameState.userVotes,
    contestants: gameState.contestants,
    roundActive: gameState.roundActive,
    roundEndTime: gameState.roundEndTime,
    connectedUserCount: gameState.connectedUsers.size
  };
}

function checkRoundCompletion() {
  const totalUsers = gameState.connectedUsers.size;
  const votedUsers = Object.keys(gameState.userVotes).length;
  
  if (totalUsers > 0 && votedUsers >= totalUsers) {
    finishRound();
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  gameState.connectedUsers.add(socket.id);
  
  socket.emit('gameState', getCleanGameState());
  
  socket.on('vote', (data) => {
    const { contestantId } = data;
    const userId = socket.id;
    
    if (!gameState.roundActive) {
      socket.emit('error', 'Round has ended, votes are no longer accepted');
      return;
    }
    
    if (gameState.votes[contestantId] === undefined) {
      socket.emit('error', 'Invalid contestant');
      return;
    }
    
    // Handle vote change
    if (gameState.userVotes[userId]) {
      const previousVote = gameState.userVotes[userId];
      gameState.votes[previousVote]--;
      console.log(`Vote changed from contestant ${previousVote} to ${contestantId} by user ${userId}`);
    } else {
      // First vote in the round starts the timer
      if (Object.keys(gameState.userVotes).length === 0) {
        startRoundTimer();
      }
      console.log(`New vote registered for contestant ${contestantId} by user ${userId}`);
    }
    
    gameState.votes[contestantId]++;
    gameState.userVotes[userId] = contestantId;
    
    io.emit('voteUpdate', getCleanGameState());
    checkRoundCompletion();
  });
  
  socket.on('reset', () => {
    gameState.votes = {};
    gameState.userVotes = {};
    gameState.roundActive = true;
    gameState.roundEndTime = null;
    
    if (gameState.roundTimer) {
      clearTimeout(gameState.roundTimer);
      gameState.roundTimer = null;
    }
    
    gameState.contestants.forEach(contestant => {
      gameState.votes[contestant.id] = 0;
    });
    
    io.emit('gameReset', getCleanGameState());
    console.log('Game reset');
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameState.connectedUsers.delete(socket.id);
    
    // Remove user's vote if they had one
    if (gameState.userVotes[socket.id]) {
      const contestantId = gameState.userVotes[socket.id];
      gameState.votes[contestantId]--;
      delete gameState.userVotes[socket.id];
      
      io.emit('voteUpdate', getCleanGameState());
      checkRoundCompletion();
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});