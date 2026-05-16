import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Alert } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import api from './api';

WebBrowser.maybeCompleteAuthSession();

// ── Firebase JS SDK init (separate from native SDK) ──────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyBPIThmzdeFWuDcgSDA0C5gwUZNJEsqvcE',
  authDomain: 'autoguildx.firebaseapp.com',
  projectId: 'autoguildx',
  storageBucket: 'autoguildx.firebasestorage.app',
  messagingSenderId: '252834809264',
  appId: '1:252834809264:android:78844315e9c4150b14c275',
};

function getFirebase() {
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

// ── Exchange Firebase ID token with our backend ───────────────────────────────
async function exchangeWithBackend(idToken: string) {
  const { data } = await api.post('/auth/firebase', { idToken });
  return { accessToken: data.accessToken, userId: data.userId, role: data.role ?? 'enthusiast' };
}

// ── Google ────────────────────────────────────────────────────────────────────
// Replace with your Web Client ID from Firebase Console →
// Authentication → Sign-in method → Google → Web client ID
export const GOOGLE_WEB_CLIENT_ID = '252834809264-eo1nbf0i80t2996luiqvqdluokvucbrd.apps.googleusercontent.com';

export function useGoogleAuth() {
  return Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    selectAccount: true,
  });
}

export async function signInWithGoogle(response: any) {
  if (response?.type !== 'success') return null;

  const { id_token } = response.params;
  const credential = GoogleAuthProvider.credential(id_token);
  const auth = getAuth(getFirebase());
  const result = await signInWithCredential(auth, credential);
  const idToken = await result.user.getIdToken();
  return exchangeWithBackend(idToken);
}

// ── Facebook ──────────────────────────────────────────────────────────────────
// Replace with your Facebook App ID from Facebook Developer Console
export const FACEBOOK_APP_ID = 'REPLACE_WITH_FACEBOOK_APP_ID';

export function useFacebookAuth() {
  return Facebook.useAuthRequest({ clientId: FACEBOOK_APP_ID });
}

export async function signInWithFacebook(response: any) {
  if (FACEBOOK_APP_ID === 'REPLACE_WITH_FACEBOOK_APP_ID') {
    Alert.alert('Facebook Sign-In', 'Facebook login is not configured yet. Set up a Facebook App first.');
    return null;
  }
  if (response?.type !== 'success') return null;

  const { access_token } = response.params;
  const credential = FacebookAuthProvider.credential(access_token);
  const auth = getAuth(getFirebase());
  const result = await signInWithCredential(auth, credential);
  const idToken = await result.user.getIdToken();
  return exchangeWithBackend(idToken);
}

// ── Apple (iOS only) ──────────────────────────────────────────────────────────
export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    Alert.alert('Apple Sign-In', 'Apple login is only available on iOS.');
    return null;
  }
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    Alert.alert('Apple Sign-In', 'Apple Sign-In is not available on this device.');
    return null;
  }

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const { identityToken } = appleCredential;
  if (!identityToken) return null;

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken });
  const auth = getAuth(getFirebase());
  const result = await signInWithCredential(auth, credential);
  const idToken = await result.user.getIdToken();
  return exchangeWithBackend(idToken);
}
