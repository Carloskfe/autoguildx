import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function LoginScreen() {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await login(data.accessToken, data.userId, data.role ?? 'enthusiast');
      router.replace('/(tabs)/feed');
    } catch (e: any) {
      Alert.alert('Login failed', e.response?.data?.message ?? 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>AutoGuildX</Text>
        <Text style={s.title}>Welcome back</Text>

        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          editable={!loading}
        />

        <Link href="/(auth)/forgot-password" style={s.forgotLink}>
          Forgot password?
        </Link>

        <TouchableOpacity style={s.btnPrimary} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnPrimaryText}>Log In</Text>}
        </TouchableOpacity>

        <View style={s.row}>
          <Text style={s.muted}>Don't have an account? </Text>
          <Link href="/(auth)/signup" style={s.link}>Sign up</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f0f0f' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
  logo: { fontSize: 28, fontWeight: '900', color: '#f97316', textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 16 },
  input: {
    backgroundColor: '#1c1c1e', color: '#fff', borderRadius: 12, padding: 14,
    fontSize: 16, borderWidth: 1, borderColor: '#2a2a2e',
  },
  forgotLink: { color: '#f97316', fontSize: 13, textAlign: 'right', marginTop: -4 },
  btnPrimary: {
    backgroundColor: '#f97316', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 4,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  muted: { color: '#6b7280', fontSize: 14 },
  link: { color: '#f97316', fontSize: 14, fontWeight: '600' },
});
