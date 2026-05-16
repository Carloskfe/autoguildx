import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'agx_token';
const USER_ID_KEY = 'agx_user_id';
const ROLE_KEY = 'agx_role';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
  await SecureStore.deleteItemAsync(ROLE_KEY);
}

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_ID_KEY);
}

export async function setUserId(id: string): Promise<void> {
  await SecureStore.setItemAsync(USER_ID_KEY, id);
}

export async function getRole(): Promise<string | null> {
  return SecureStore.getItemAsync(ROLE_KEY);
}

export async function setRole(role: string): Promise<void> {
  await SecureStore.setItemAsync(ROLE_KEY, role);
}
