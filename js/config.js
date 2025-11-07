// --- Configuration ---
// IMPORTANT: The Redirect URI MUST be one of the URLs you added to your
// app's settings in the Spotify Developer Dashboard.
export const REDIRECT_URI = window.location.origin + window.location.pathname;

// These are the permissions we ask for.
// Now includes write permissions for syncing songs to playlists
export const SCOPES = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-private',
    'user-library-read',
    'playlist-modify-public',
    'playlist-modify-private'
].join(' ');
