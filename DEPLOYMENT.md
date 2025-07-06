# Deployment Guide for Magic Poll

## Deploying to Render.com

### Step 1: Prepare Your Repository
1. Make sure all your code is committed to a Git repository (GitHub, GitLab, etc.)
2. Ensure the repository is public or you have connected Render to your Git provider

### Step 2: Create a New Web Service on Render
1. Go to [Render.com](https://render.com) and sign in
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Fill in the following settings:

#### Basic Configuration
- **Name**: `magic-poll` (or your preferred name)
- **Region**: Choose your preferred region
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (uses project root)

#### Build & Deploy Settings
- **Runtime**: `Node`
- **Build Command** (try these in order):
  
  **Option 1** (Recommended):
  ```bash
  npm run build
  ```
  
  **Option 2** (If Option 1 fails):
  ```bash
  npm run build-simple
  ```
  
  **Option 3** (If scripts don't work):
  ```bash
  npm install && cd client && npm install && npm run build
  ```

- **Start Command**: 
  ```bash
  npm start
  ```

**⚠️ TROUBLESHOOTING**: If the build command fails:
1. Try each build command option above in order
2. Check the build logs for specific error messages
3. The app now has runtime build recovery - it will attempt to build on startup if files are missing

#### Environment Variables
Add these environment variables in Render:
- **NODE_ENV**: `production`

### Step 3: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Wait for the build to complete (this may take a few minutes)

### Step 4: Access Your Application
Once deployed, Render will provide you with a URL like:
`https://magic-poll-xxxx.onrender.com`

The application will automatically redirect to `/party-time` when you visit the root URL.

## Troubleshooting Common Issues

### Build Fails with "ENOENT: no such file or directory"
- **Cause**: React app not built or build files missing
- **Solution**: 
  1. Use the exact build command: `npm run build`
  2. Check build logs for errors during the React build process
  3. Ensure `client/package.json` has all required dependencies
  4. Verify the build command completes successfully before starting the server

### Build Command Shows Success But Files Missing
- **Cause**: Build process exited early or didn't complete
- **Solution**:
  1. Check the full build log in Render dashboard
  2. Look for npm errors or warnings during client dependency installation
  3. Verify that `client/build/index.html` is created during build
  4. Use `npm run verify` locally to test the build process

### Socket.IO Connection Issues
- **Cause**: CORS or WebSocket configuration
- **Solution**: The app automatically detects production environment and adjusts CORS settings

### App Shows "Loading..." Forever
- **Cause**: Client can't connect to server
- **Solution**: Check browser console for errors. In production, Socket.IO should connect to the same domain

### Build Takes Too Long
- **Cause**: Installing dependencies can be slow
- **Solution**: This is normal for first deployment. Subsequent deployments will be faster

## Alternative Deployment Options

### Manual Build (for other platforms)
If deploying to other platforms, build the app first:

```bash
# Install dependencies
npm install
cd client && npm install

# Build the React app
npm run build

# Start the server
npm start
```

### Environment Variables for Other Platforms
Set these environment variables:
- `NODE_ENV=production`
- `PORT` (usually set automatically by the platform)

## Testing Production Build Locally

To test the production build locally:

```bash
# Build the app
./build.sh

# Set environment variable
export NODE_ENV=production

# Start the server
npm start
```

Then visit `http://localhost:3001` (note: port 3001, not 3000 in production)

## Notes

- In production, the React app is served by the Express server
- Socket.IO automatically adjusts CORS settings for production
- The app uses WebSocket with polling fallback for maximum compatibility
- All client files are served as static assets from the `/client/build` directory