#!/bin/bash

echo "Starting Magic Poll application..."

# Kill any existing processes
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

# Wait a moment for processes to fully stop
sleep 2

# Start server in background
echo "Starting server on port 3001..."
cd /Users/ima/xdev/magic_poll
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start client in background  
echo "Starting client on port 3000..."
cd /Users/ima/xdev/magic_poll/client
npm start &
CLIENT_PID=$!

echo "Server PID: $SERVER_PID"
echo "Client PID: $CLIENT_PID"
echo ""
echo "Application should be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both server and client"

# Wait for user to interrupt
trap "echo 'Stopping processes...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" SIGINT SIGTERM

# Keep script running
wait