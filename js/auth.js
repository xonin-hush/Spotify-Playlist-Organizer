import { REDIRECT_URI, SCOPES } from './config.js';
import { generateRandomString, sha256 } from './crypto.js';

/**
 * Step 1: Redirect user to Spotify to get their permission.
 * This is where the secure OAuth PKCE flow begins.
 */
export async function redirectToSpotifyAuth(clientId) {
    if (!clientId) {
        alert('Please enter a Client ID.');
        return false;
    }
    
    // Save Client ID for when we are redirected back
    localStorage.setItem('spotify_client_id', clientId);

    // Generate a random string for the "code verifier"
    const codeVerifier = generateRandomString(64);
    // Hash the verifier to create the "code challenge"
    const codeChallenge = await sha256(codeVerifier);
    
    // Store the verifier locally to use it in Step 3
    localStorage.setItem('code_verifier', codeVerifier);

    // Build the Spotify authorization URL
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.search = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    }).toString();

    // Send the user to Spotify's login page
    window.location.href = authUrl.toString();
    return true;
}

/**
 * Step 3: Exchange the 'code' for an 'access token'.
 * This is a secure, direct request to Spotify's token API.
 */
export async function getAccessToken(code, codeVerifier, clientId) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token request failed: ${errorData.error_description}`);
    }

    const data = await response.json();
    return data.access_token;
}
