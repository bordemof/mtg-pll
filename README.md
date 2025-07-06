# Magic Poll

A real-time voting application inspired by Magic: The Gathering card game aesthetics.

## Features

- **Party Time** (`/party-time`): Vote for your favorite Magic: The Gathering inspired characters
- **Bombastic Results** (`/bombastic-results`): View real-time voting results
- One vote per user per round
- Anonymous voting
- Real-time updates using Socket.IO
- Responsive design for mobile and desktop
- Magic: The Gathering inspired styling

## Setup & Installation

1. Install server dependencies:
   ```bash
   npm install
   ```

2. Install client dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

## Running the Application

Start both server and client in development mode:
```bash
npm run dev
```

Or run them separately:

1. Start the server:
   ```bash
   npm run server
   ```

2. Start the client (in a new terminal):
   ```bash
   npm run client
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## How to Use

1. Navigate to `/party-time` to cast your vote
2. Click on one of the 6 character cards to vote
3. Each user can only vote once per round
4. Navigate to `/bombastic-results` to see the current results
5. Use the "Reset Round" button to start a new voting round

## Characters

The app features 6 Magic: The Gathering inspired characters:
- Jace (🧙‍♂️)
- Chandra (🔥)
- Liliana (🖤)
- Garruk (🌿)
- Gideon (⚔️)
- Nissa (🌸)

## Technical Details

- **Frontend**: React with Socket.IO client
- **Backend**: Node.js with Express and Socket.IO
- **Styling**: Custom CSS with Magic: The Gathering inspired theme
- **Real-time**: Socket.IO for live updates
- **Routing**: React Router for navigation
- **State Management**: In-memory (no persistence)

## Project Structure

```
magic_poll/
├── server.js              # Backend server
├── package.json           # Server dependencies
├── client/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── PartyTime.js
│   │   │   └── BombasticResults.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json       # Client dependencies
└── README.md
```