import { fetchSpotifyAPI } from './api.js';

/**
 * Syncs liked songs by artist to matching artist playlists
 * @param {string} accessToken - Spotify access token
 * @param {string} userId - Current user's Spotify ID
 * @returns {Object} - Summary of sync operations
 */
export async function syncArtistsToPlaylists(accessToken, userId) {
    const results = {
        artistsFound: [],
        playlistsMatched: [],
        songsAdded: 0,
        errors: [],
        skippedPlaylists: []
    };

    try {
        // Step 1: Get all liked songs
        console.log('Fetching liked songs...');
        const likedTracks = await getAllLikedSongs(accessToken);
        
        if (likedTracks.length === 0) {
            return { ...results, message: 'No liked songs found.' };
        }

        // Step 2: Extract unique artists from liked songs
        console.log('Extracting artists...');
        const artistsMap = extractArtistsFromTracks(likedTracks);
        results.artistsFound = Array.from(artistsMap.keys());
        
        // Step 3: Get all user playlists
        console.log('Fetching playlists...');
        const playlists = await getAllUserPlaylists(accessToken);
        
        // Step 4: Match playlists to artists (only user-owned playlists)
        const matchedPlaylists = matchPlaylistsToArtists(playlists, artistsMap, userId);
        results.playlistsMatched = matchedPlaylists.map(p => p.playlistName);
        
        if (matchedPlaylists.length === 0) {
            return { ...results, message: 'No playlists match artist names from your liked songs. Make sure the playlists are owned by you.' };
        }

        // Step 5: For each matched playlist, add missing songs
        for (const match of matchedPlaylists) {
            try {
                console.log(`Processing playlist: ${match.playlistName}`);
                const added = await addMissingSongsToPlaylist(
                    match.playlist,
                    match.artistSongs,
                    accessToken
                );
                results.songsAdded += added;
            } catch (error) {
                results.errors.push(`Error syncing ${match.playlistName}: ${error.message}`);
                console.error(`Error syncing ${match.playlistName}:`, error);
            }
        }

        return results;

    } catch (error) {
        console.error('Error in syncArtistsToPlaylists:', error);
        throw error;
    }
}

/**
 * Fetches all liked songs with pagination
 */
async function getAllLikedSongs(accessToken) {
    let tracks = [];
    let url = 'https://api.spotify.com/v1/me/tracks?limit=50';

    while (url) {
        const data = await fetchSpotifyAPI(url, accessToken);
        tracks = tracks.concat(data.items);
        url = data.next;
    }

    return tracks;
}

/**
 * Fetches all user playlists with pagination
 */
async function getAllUserPlaylists(accessToken) {
    let playlists = [];
    let url = 'https://api.spotify.com/v1/me/playlists?limit=50';

    while (url) {
        const data = await fetchSpotifyAPI(url, accessToken);
        playlists = playlists.concat(data.items);
        url = data.next;
    }

    return playlists;
}

/**
 * Extracts unique artists and their songs from liked tracks
 * Returns a Map<artistName, Set<{trackUri, trackName}>>
 */
function extractArtistsFromTracks(likedTracks) {
    const artistsMap = new Map();

    for (const item of likedTracks) {
        if (!item.track || !item.track.artists) continue;

        const trackUri = item.track.uri;
        const trackName = item.track.name;

        // A song can have multiple artists
        for (const artist of item.track.artists) {
            const artistName = artist.name.toLowerCase().trim();
            
            if (!artistsMap.has(artistName)) {
                artistsMap.set(artistName, []);
            }
            
            artistsMap.get(artistName).push({
                uri: trackUri,
                name: trackName,
                artists: item.track.artists.map(a => a.name).join(', ')
            });
        }
    }

    return artistsMap;
}

/**
 * Matches playlists to artists by name
 * Only matches playlists owned by the user
 * Returns array of {playlist, artistName, artistSongs}
 */
function matchPlaylistsToArtists(playlists, artistsMap, userId) {
    const matches = [];

    for (const playlist of playlists) {
        // Skip playlists not owned by the user
        if (playlist.owner.id !== userId) {
            console.log(`Skipping playlist "${playlist.name}" - not owned by you (owner: ${playlist.owner.id})`);
            continue;
        }

        const playlistName = playlist.name.toLowerCase().trim();
        
        // Check if playlist name matches any artist name
        if (artistsMap.has(playlistName)) {
            matches.push({
                playlist: playlist,
                playlistName: playlist.name,
                artistName: playlistName,
                artistSongs: artistsMap.get(playlistName)
            });
        }
    }

    return matches;
}

/**
 * Adds missing songs to a playlist
 * @returns {number} - Number of songs added
 */
async function addMissingSongsToPlaylist(playlist, artistSongs, accessToken) {
    // Step 1: Get all tracks currently in the playlist
    const existingTracks = await getPlaylistTracks(playlist.id, accessToken);
    const existingUris = new Set(existingTracks.map(track => track.uri));

    // Step 2: Filter out songs that are already in the playlist
    const songsToAdd = artistSongs.filter(song => !existingUris.has(song.uri));

    if (songsToAdd.length === 0) {
        console.log(`No new songs to add to ${playlist.name}`);
        return 0;
    }

    // Step 3: Add songs in batches (Spotify allows max 100 per request)
    const batchSize = 100;
    let totalAdded = 0;

    for (let i = 0; i < songsToAdd.length; i += batchSize) {
        const batch = songsToAdd.slice(i, i + batchSize);
        const uris = batch.map(song => song.uri);

        try {
            await addTracksToPlaylist(playlist.id, uris, accessToken);
            totalAdded += batch.length;
            console.log(`Added ${batch.length} songs to ${playlist.name}`);
        } catch (error) {
            console.error(`Failed to add batch to ${playlist.name}:`, error);
            throw error;
        }
    }

    return totalAdded;
}

/**
 * Gets all tracks in a playlist
 */
async function getPlaylistTracks(playlistId, accessToken) {
    let tracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(uri))`;

    while (url) {
        const data = await fetchSpotifyAPI(url, accessToken);
        tracks = tracks.concat(data.items.map(item => item.track).filter(track => track));
        url = data.next;
    }

    return tracks;
}

/**
 * Adds tracks to a playlist
 */
async function addTracksToPlaylist(playlistId, uris, accessToken) {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uris: uris
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add tracks: ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
}
