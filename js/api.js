/**
 * A wrapper for 'fetch' that automatically adds the Auth header
 * and handles basic error checking.
 */
export async function fetchSpotifyAPI(url, accessToken) {
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        // Handle errors, especially 401 (Unauthorized) which
        // means the token has expired.
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message}`);
    }

    return await response.json();
}

/**
 * Fetches the user's profile information.
 */
export async function getUserProfile(accessToken) {
    return await fetchSpotifyAPI('https://api.spotify.com/v1/me', accessToken);
}

/**
 * Fetches the count of user's liked songs (saved tracks).
 */
export async function getLikedSongsCount(accessToken) {
    const data = await fetchSpotifyAPI('https://api.spotify.com/v1/me/tracks?limit=1', accessToken);
    return data.total;
}

/**
 * Fetches ALL of the user's playlists, handling pagination.
 * Spotify's API sends data in "pages," so we must keep
 * fetching the 'next' URL until all items are loaded.
 */
export async function getAllPlaylists(accessToken) {
    let playlists = [];
    let url = 'https://api.spotify.com/v1/me/playlists?limit=50'; // Start with 50 per page

    while (url) {
        const data = await fetchSpotifyAPI(url, accessToken);
        playlists = playlists.concat(data.items);
        url = data.next; // Get the URL for the next page, or null if this is the last page
    }
    return playlists;
}

/**
 * Fetches ALL tracks for a playlist, handling pagination.
 */
export async function getPlaylistTracks(playlistId, accessToken, isLikedSongs = false) {
    let tracks = [];
    let url;
    
    if (isLikedSongs) {
        // Use the saved tracks endpoint for Liked Songs
        url = 'https://api.spotify.com/v1/me/tracks?limit=50';
    } else {
        // Use the regular playlist tracks endpoint
        url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    }

    // Fetch all pages of tracks
    while (url) {
        const data = await fetchSpotifyAPI(url, accessToken);
        tracks = tracks.concat(data.items);
        url = data.next;
    }
    
    return tracks;
}
