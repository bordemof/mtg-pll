const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);

// Configure CORS for production and development
const isDevelopment = process.env.NODE_ENV !== 'production';
const corsOrigin = isDevelopment ? "http://localhost:3000" : true;

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Check if build directory exists
const buildPath = path.join(__dirname, 'client/build');
const indexPath = path.join(buildPath, 'index.html');

console.log('Checking build directory:', buildPath);
console.log('Build directory exists:', fs.existsSync(buildPath));
console.log('Index.html exists:', fs.existsSync(indexPath));

if (fs.existsSync(buildPath)) {
  console.log('✅ Serving static files from:', buildPath);
  app.use(express.static(buildPath));
} else {
  console.error('❌ Build directory not found!');
  console.log('Current directory contents:', fs.readdirSync(__dirname));
  
  if (fs.existsSync(path.join(__dirname, 'client'))) {
    console.log('Client directory contents:', fs.readdirSync(path.join(__dirname, 'client')));
    
    // Attempt to build if in production and client exists
    if (process.env.NODE_ENV === 'production') {
      console.log('🔨 Attempting to build React app...');
      try {
        const clientDir = path.join(__dirname, 'client');
        console.log('Installing client dependencies...');
        execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
        
        console.log('Building React app...');
        execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
        
        if (fs.existsSync(buildPath)) {
          console.log('✅ Build successful! Serving static files.');
          app.use(express.static(buildPath));
        } else {
          console.error('❌ Build failed - directory still missing');
        }
      } catch (error) {
        console.error('❌ Build failed:', error.message);
      }
    }
  } else {
    console.log('❌ Client directory does not exist!');
  }
}

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
    
    console.log(`Vote received from ${userId} for contestant ${contestantId}`);
    
    if (!gameState.roundActive) {
      console.log(`Vote rejected: Round not active for user ${userId}`);
      socket.emit('error', 'Round has ended, votes are no longer accepted');
      return;
    }
    
    if (gameState.votes[contestantId] === undefined) {
      console.log(`Vote rejected: Invalid contestant ${contestantId} for user ${userId}`);
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
    
    console.log('Current votes:', gameState.votes);
    console.log('Current user votes:', gameState.userVotes);
    
    const cleanState = getCleanGameState();
    console.log('Emitting voteUpdate with state:', cleanState);
    io.emit('voteUpdate', cleanState);
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
  const indexFile = path.join(__dirname, 'client/build', 'index.html');
  
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    console.error('Index.html not found, serving error page');
    res.status(500).send(`
      <html>
        <head>
          <title>Magic Poll - Build Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 50px; text-align: center; background: #1a1a1a; color: #fff; }
            .error { background: #ff4444; padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 600px; }
            .code { background: #333; padding: 10px; border-radius: 5px; font-family: monospace; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>🔥 Magic Poll - Build Error</h1>
          <div class="error">
            <h2>Application Not Built</h2>
            <p>The React application hasn't been built properly for production.</p>
            <p><strong>Build path:</strong> <code>${buildPath}</code></p>
            <p><strong>Index file:</strong> <code>${indexFile}</code></p>
          </div>
          <div class="code">
            <p><strong>To fix this, run the build command:</strong></p>
            <code>npm run build</code>
          </div>
          <p>If you're deploying on Render, make sure your build command is:</p>
          <div class="code">
            <code>npm install && cd client && npm install && npm run build</code>
          </div>
        </body>
      </html>
    `);
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});