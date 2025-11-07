import { getPlaylistTracks } from './api.js';

/**
 * Renders the initial "tree" of playlists.
 */
export function renderPlaylistTree(playlists, likedSongsCount, container) {
    let treeHtml = '';

    // Add Liked Songs as the first item if there are any
    if (likedSongsCount > 0) {
        treeHtml += `
            <li class="playlist-container">
                <div class="playlist-item" data-playlist-id="liked-songs" data-is-liked-songs="true">
                    <span class="toggle"></span>
                    <span class="playlist-name font-semibold">💚 Liked Songs</span>
                    <span class="text-gray-400 text-sm ml-2">(${likedSongsCount} tracks)</span>
                </div>
                <!-- Tracks will be loaded into this <ul> on click -->
                <ul class="tracks-list"></ul>
            </li>
        `;
    }

    if (!playlists || playlists.length === 0) {
        if (likedSongsCount === 0) {
            container.innerHTML = '<p class="text-gray-400">No playlists found.</p>';
            return;
        }
    } else {
        treeHtml += playlists.map(playlist => `
            <li class="playlist-container">
                <div class="playlist-item" data-playlist-id="${playlist.id}" data-tracks-url="${playlist.tracks.href}">
                    <span class="toggle"></span>
                    <span class="playlist-name font-semibold">${playlist.name}</span>
                    <span class="text-gray-400 text-sm ml-2">(${playlist.tracks.total} tracks)</span>
                </div>
                <!-- Tracks will be loaded into this <ul> on click -->
                <ul class="tracks-list"></ul>
            </li>
        `).join('');
    }

    container.innerHTML = `<ul class="root-list">${treeHtml}</ul>`;
}

/**
 * Handles clicking on a playlist to expand/collapse it.
 * This is where "lazy loading" happens.
 */
export async function handlePlaylistClick(event, accessToken, onError) {
    const playlistItem = event.target.closest('.playlist-item');
    if (!playlistItem) return; // Didn't click on a playlist

    const tracksList = playlistItem.nextElementSibling;
    const playlistId = playlistItem.dataset.playlistId;
    const isLoaded = playlistItem.dataset.loaded === 'true';
    const isExpanded = playlistItem.classList.contains('expanded');

    if (isExpanded) {
        // It's already open. Close it.
        tracksList.style.display = 'none';
        playlistItem.classList.remove('expanded');
    } else {
        // It's closed. Open it.
        tracksList.style.display = 'block';
        playlistItem.classList.add('expanded');
        
        // Check if we've already loaded the tracks. If not, fetch them.
        if (!isLoaded) {
            await loadTracksForPlaylist(playlistItem, tracksList, playlistId, accessToken, onError);
        }
    }
}

/**
 * Fetches and renders the tracks for a single playlist.
 * This also handles pagination for playlists with > 100 tracks.
 */
async function loadTracksForPlaylist(playlistItem, tracksList, playlistId, accessToken, onError) {
    try {
        // Add a temporary loading message
        tracksList.innerHTML = '<li class="text-gray-400 italic py-2">Loading tracks...</li>';

        // Check if this is the Liked Songs special playlist
        const isLikedSongs = playlistItem.dataset.isLikedSongs === 'true';
        
        const tracks = await getPlaylistTracks(playlistId, accessToken, isLikedSongs);

        // Render the tracks
        if (tracks.length === 0) {
            tracksList.innerHTML = '<li class="track-item text-gray-500">This playlist is empty.</li>';
        } else {
            tracksList.innerHTML = tracks.map(item => {
                if (!item.track) return ''; // Handle potential null track items
                const artistNames = item.track.artists.map(a => a.name).join(', ');
                return `<li class="track-item">
                    <strong>${item.track.name}</strong> - <span class="text-gray-400">${artistNames}</span>
                </li>`;
            }).join('');
        }
        
        // Mark this playlist as "loaded" so we don't fetch again
        playlistItem.dataset.loaded = 'true';

    } catch (error) {
        console.error(`Error loading tracks for ${playlistId}:`, error);
        tracksList.innerHTML = '<li class="text-red-400">Error loading tracks.</li>';
        // Handle token expiration
        if (error.message.includes('401') && onError) {
            onError();
        }
    }
}
