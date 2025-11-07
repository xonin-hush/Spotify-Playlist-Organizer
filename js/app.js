import { REDIRECT_URI } from './config.js';
import { redirectToSpotifyAuth, getAccessToken } from './auth.js';
import { getUserProfile, getLikedSongsCount, getAllPlaylists } from './api.js';
import { renderPlaylistTree, handlePlaylistClick } from './ui.js';
import { syncArtistsToPlaylists } from './sync.js';

// --- Global State ---
let clientId = '';
let accessToken = '';
let currentUser = null;

// --- DOM Elements ---
const loginView = document.getElementById('login-view');
const contentView = document.getElementById('content-view');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const syncButton = document.getElementById('sync-button');
const clientIdInput = document.getElementById('client-id');
const userHeader = document.getElementById('user-header');
const loader = document.getElementById('loader');
const playlistTreeContainer = document.getElementById('playlist-tree');
const syncStatus = document.getElementById('sync-status');
const syncProgress = document.getElementById('sync-progress');

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    loginButton.addEventListener('click', handleLogin);
    logoutButton.addEventListener('click', logout);
    syncButton.addEventListener('click', handleSync);
    playlistTreeContainer.addEventListener('click', (event) => {
        handlePlaylistClick(event, accessToken, handleSessionExpired);
    });

    // Check if we are coming back from the Spotify redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Restore Client ID from local storage if it exists
    const storedClientId = localStorage.getItem('spotify_client_id');
    if (storedClientId) {
        clientIdInput.value = storedClientId;
        clientId = storedClientId;
    }

    if (code) {
        // We have a code, so we are in the redirect phase.
        // Hide login view, show content view, and fetch the token.
        loginView.classList.add('hidden');
        contentView.classList.remove('hidden');
        handleRedirect(code);
    }
});

/**
 * Handle login button click
 */
async function handleLogin() {
    clientId = clientIdInput.value;
    await redirectToSpotifyAuth(clientId);
}

/**
 * Step 2: Handle the redirect back from Spotify.
 * The user has logged in, and Spotify sent us a 'code'.
 */
async function handleRedirect(code) {
    // Get the verifier we stored in Step 1
    const codeVerifier = localStorage.getItem('code_verifier');
    if (!codeVerifier) {
        console.error('No code verifier found.');
        logout();
        return;
    }
    
    // Get the Client ID we stored
    clientId = localStorage.getItem('spotify_client_id');
    if (!clientId) {
        console.error('No client ID found.');
        logout();
        return;
    }

    // Now, exchange the 'code' for an 'access token'
    try {
        accessToken = await getAccessToken(code, codeVerifier, clientId);
        if (accessToken) {
            // Success! Clean up the URL (remove the ?code=...)
            window.history.replaceState({}, document.title, REDIRECT_URI);
            // Remove the verifier, we don't need it anymore
            localStorage.removeItem('code_verifier');
            // Load the app data
            await loadApp();
        } else {
            throw new Error('Failed to get access token.');
        }
    } catch (error) {
        console.error('Error during token exchange:', error);
        logout();
    }
}

/**
 * Step 4: Load the user's data (profile and playlists).
 */
async function loadApp() {
    try {
        loader.classList.remove('hidden');
        playlistTreeContainer.classList.add('hidden');

        // Fetch user profile, liked songs count, and playlists at the same time
        const [user, likedSongsCount, playlists] = await Promise.all([
            getUserProfile(accessToken),
            getLikedSongsCount(accessToken),
            getAllPlaylists(accessToken)
        ]);

        // Store user info globally for sync feature
        currentUser = user;

        // Display user info
        userHeader.textContent = `${user.display_name}'s Playlists`;

        // Render the playlist tree with liked songs at the top
        renderPlaylistTree(playlists, likedSongsCount, playlistTreeContainer);

    } catch (error) {
        console.error('Error loading app:', error);
        // Handle token expiration or other errors
        if (error.message.includes('401')) {
            handleSessionExpired();
        }
    } finally {
        // Hide loader and show content
        loader.classList.add('hidden');
        playlistTreeContainer.classList.remove('hidden');
    }
}

/**
 * Handle session expiration
 */
function handleSessionExpired() {
    alert('Your session expired. Please log in again.');
    logout();
}

/**
 * Handle sync button click
 */
async function handleSync() {
    if (!accessToken) {
        alert('You need to be logged in to sync.');
        return;
    }

    if (!currentUser) {
        alert('User information not loaded. Please refresh the page.');
        return;
    }

    // Disable button and show loading state
    syncButton.disabled = true;
    syncButton.innerHTML = '<span class="text-lg">⏳</span> <span>Syncing...</span>';
    syncButton.classList.add('opacity-50', 'cursor-not-allowed');
    
    // Hide previous status and show progress
    syncStatus.classList.add('hidden');
    syncProgress.classList.remove('hidden');

    try {
        const results = await syncArtistsToPlaylists(accessToken, currentUser.id);
        
        // Show success message
        showSyncStatus(results, 'success');
        
        // Reload playlists to show updated counts (with a small delay for better UX)
        setTimeout(async () => {
            await loadApp();
        }, 1000);

    } catch (error) {
        console.error('Sync error:', error);
        
        if (error.message.includes('401')) {
            handleSessionExpired();
        } else {
            showSyncStatus({ error: error.message }, 'error');
        }
    } finally {
        // Re-enable button
        syncProgress.classList.add('hidden');
        syncButton.disabled = false;
        syncButton.innerHTML = '<span class="text-lg">🔄</span> <span>Sync Artists</span>';
        syncButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

/**
 * Display sync status message
 */
function showSyncStatus(results, type) {
    const isSuccess = type === 'success';
    
    syncStatus.className = `mb-4 p-4 rounded-lg status-message border-2 ${
        isSuccess ? 'bg-green-900 bg-opacity-50 border-green-600' : 'bg-red-900 bg-opacity-50 border-red-600'
    }`;
    
    if (results.error) {
        syncStatus.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-3xl">❌</span>
                <div class="flex-1">
                    <p class="text-red-200 font-semibold text-lg">Sync Failed</p>
                    <p class="text-red-300 text-sm mt-1">${results.error}</p>
                </div>
            </div>
        `;
    } else if (results.message) {
        syncStatus.className = 'mb-4 p-4 rounded-lg status-message border-2 bg-yellow-900 bg-opacity-50 border-yellow-600';
        syncStatus.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-3xl">ℹ️</span>
                <div class="flex-1">
                    <p class="text-yellow-200 font-semibold text-lg">${results.message}</p>
                </div>
            </div>
        `;
    } else {
        let html = `
            <div class="flex items-start gap-3">
                <span class="text-3xl">✅</span>
                <div class="flex-1">
                    <p class="text-green-200 font-semibold text-lg mb-3">Sync Complete!</p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div class="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                            <div class="text-2xl font-bold text-green-400">${results.artistsFound.length}</div>
                            <div class="text-xs text-gray-300">Artists Found</div>
                        </div>
                        <div class="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                            <div class="text-2xl font-bold text-blue-400">${results.playlistsMatched.length}</div>
                            <div class="text-xs text-gray-300">Playlists Matched</div>
                        </div>
                        <div class="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                            <div class="text-2xl font-bold text-purple-400">${results.songsAdded}</div>
                            <div class="text-xs text-gray-300">Songs Added</div>
                        </div>
                    </div>
        `;
        
        if (results.playlistsMatched.length > 0) {
            html += `<div class="mt-3 text-sm text-green-300">
                <strong>Matched playlists:</strong> ${results.playlistsMatched.join(', ')}
            </div>`;
        }
        
        if (results.errors.length > 0) {
            html += `
                <details class="mt-3 text-sm bg-red-900 bg-opacity-30 rounded p-2">
                    <summary class="cursor-pointer text-yellow-300 font-semibold">⚠️ ${results.errors.length} error(s) occurred</summary>
                    <ul class="mt-2 text-red-300 space-y-1 list-disc list-inside">
                        ${results.errors.map(err => `<li>${err}</li>`).join('')}
                    </ul>
                </details>
            `;
        }
        
        html += `</div></div>`;
        syncStatus.innerHTML = html;
    }
    
    syncStatus.classList.remove('hidden');
}

/**
 * Logs the user out by clearing credentials and resetting the UI.
 */
function logout() {
    accessToken = '';
    // Don't clear client ID, as it's annoying to re-paste
    // localStorage.removeItem('spotify_client_id');
    localStorage.removeItem('code_verifier');
    
    // Clear the auth code from the URL
    window.history.replaceState({}, document.title, REDIRECT_URI);
    
    // Reset UI
    loginView.classList.remove('hidden');
    contentView.classList.add('hidden');
    playlistTreeContainer.innerHTML = ''; // Clear the old tree
    userHeader.textContent = 'Your Playlists';
}
