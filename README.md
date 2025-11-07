# 🎵 Spotify Playlist Explorer

A beautiful, client-side web application to explore your Spotify playlists and automatically sync artist songs from your Liked Songs to matching artist playlists.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Spotify API](https://img.shields.io/badge/Spotify-API-1DB954?logo=spotify)

## ✨ Features

- 🌲 **Tree View**: Browse all your playlists and liked songs in an intuitive tree structure
- 💚 **Liked Songs**: View your entire Liked Songs collection
- 🔄 **Auto Sync**: Automatically sync songs by artist from Liked Songs to matching artist playlists
- 🔒 **Secure**: Uses OAuth 2.0 PKCE flow - no secrets exposed, everything runs in your browser
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 📱 **Mobile Friendly**: Works great on all devices

## 🚀 Quick Start

### Option 1: Use Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/spotify-playlist-explorer.git
   cd spotify-playlist-explorer
   ```

2. **Create a Spotify App**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create an App"
   - Fill in the app name and description
   - Copy your **Client ID**
   - Click "Edit Settings"
   - Add `http://127.0.0.1:5500/` to **Redirect URIs** (adjust port if needed)
   - Click "Save"

3. **Run the app**
   - Open `index.html` in your browser, or
   - Use a local server (recommended):
     ```bash
     # Python 3
     python -m http.server 5500
     
     # Node.js (if you have http-server)
     npx http-server -p 5500
     
     # VS Code Live Server extension
     # Right-click index.html → "Open with Live Server"
     ```

4. **Login**
   - Paste your Client ID
   - Click "Log in with Spotify"
   - Authorize the app

### Option 2: Deploy to GitHub Pages

1. **Fork this repository**
2. **Go to Settings → Pages**
3. **Select `main` branch as source**
4. **Update your Spotify App Redirect URI** to `https://yourusername.github.io/spotify-playlist-explorer/`
5. **Visit your deployed app**

## 🎯 How to Use

### Viewing Playlists

1. After logging in, you'll see all your playlists
2. Click on any playlist to expand and see its tracks
3. Your Liked Songs appear at the top with a 💚 icon
4. Click again to collapse

### Syncing Artists

The sync feature automatically adds songs from your Liked Songs to matching artist playlists:

1. **Create playlists** named after artists (e.g., "Drake", "Taylor Swift")
2. Click the **"Sync Artists"** button
3. The app will:
   - Scan your Liked Songs for all artists
   - Find playlists matching those artist names (case-insensitive)
   - Add missing songs to the matching playlists
   - Skip songs already in the playlist
   - Keep all songs in your Liked Songs

**Example:**
```
Liked Songs contains:
  - "God's Plan" by Drake
  - "Hotline Bling" by Drake
  - "Anti-Hero" by Taylor Swift

You have playlists named:
  - "drake" (empty)
  - "Taylor Swift" (has "Anti-Hero")

After sync:
  - "drake" → "God's Plan", "Hotline Bling" added
  - "Taylor Swift" → No changes (already has the song)
```

**Important:** Only playlists YOU own can be synced. Collaborative or followed playlists are skipped.

## 🔐 Security & Privacy

### Is it safe?

**YES!** This app is designed with security in mind:

- ✅ **No backend server** - Everything runs in your browser
- ✅ **No data collection** - We don't store or transmit your data anywhere
- ✅ **OAuth PKCE flow** - Industry-standard secure authentication
- ✅ **No Client Secret** - Only a public Client ID is used
- ✅ **Read your code** - All source code is visible and auditable

### Can I host it publicly?

**YES!** You can safely host this on:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

**Two deployment options:**

1. **User-provided Client ID** (current setup)
   - Each user creates their own Spotify app
   - Most secure and scalable
   - Requires user to do initial setup

2. **Shared Client ID** (requires modification)
   - You provide a single Client ID
   - Users can login immediately
   - You're responsible for rate limits
   - See [Deployment Guide](#deployment-with-shared-client-id)

### Permissions Requested

This app requests these Spotify permissions:

- `playlist-read-private` - Read your private playlists
- `playlist-read-collaborative` - Read collaborative playlists
- `user-read-private` - Get your profile information
- `user-library-read` - Read your Liked Songs
- `playlist-modify-public` - Add songs to your public playlists (for sync feature)
- `playlist-modify-private` - Add songs to your private playlists (for sync feature)

## 📁 Project Structure

```
spotify-playlist-explorer/
├── index.html          # Main HTML file
├── styles.css          # All styles and animations
├── js/
│   ├── app.js         # Main application logic
│   ├── auth.js        # OAuth authentication
│   ├── api.js         # Spotify API calls
│   ├── ui.js          # UI rendering
│   ├── sync.js        # Artist sync functionality
│   ├── config.js      # Configuration
│   └── crypto.js      # PKCE crypto functions
└── README.md          # This file
```

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **Styling**: Tailwind CSS + Custom CSS
- **Authentication**: OAuth 2.0 PKCE
- **API**: Spotify Web API
- **Fonts**: Inter (Google Fonts)

## 🔧 Configuration

### Deployment with Shared Client ID

To deploy with a pre-configured Client ID:

1. Edit `js/config.js`:
   ```javascript
   // Add this line at the top
   export const DEFAULT_CLIENT_ID = 'your_client_id_here';
   ```

2. Edit `js/app.js` to auto-populate the Client ID:
   ```javascript
   import { DEFAULT_CLIENT_ID } from './config.js';
   
   // In DOMContentLoaded:
   if (DEFAULT_CLIENT_ID) {
       clientIdInput.value = DEFAULT_CLIENT_ID;
       clientId = DEFAULT_CLIENT_ID;
   }
   ```

3. Update your Spotify App Redirect URI to your deployed URL

## 🐛 Troubleshooting

### "Invalid Redirect URI" error
- Make sure the Redirect URI in your Spotify app settings exactly matches your app's URL
- Include the trailing slash if your URL has one

### "403 Forbidden" when syncing
- You can only modify playlists you own
- Make sure the playlists were created by you, not followed/collaborative playlists

### Playlists not showing after login
- Check browser console for errors
- Ensure you have playlists in your Spotify account
- Try logging out and back in

### Client ID not saving
- Check if your browser allows localStorage
- Try a different browser or disable strict privacy settings

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) for the awesome API
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Inter Font](https://fonts.google.com/specimen/Inter) by Rasmus Andersson

## 📧 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Open an issue on GitHub
3. Check [Spotify API Documentation](https://developer.spotify.com/documentation/web-api/)

---

**Made with ❤️ and ☕ by music lovers, for music lovers**

🌟 Star this repo if you find it useful!
