import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function SignupScreen() {
  const login = useAuth((s) => s.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      await api.post('/auth/signup', { name, email, password });
      Alert.alert('Check your inbox', 'We sent you a verification email. Verify then log in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      Alert.alert('Signup failed', e.response?.data?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>AutoGuildX</Text>
        <Text style={s.title}>Create your account</Text>

        <TextInput
          style={s.input}
          placeholder="Full name"
          placeholderTextColor="#6b7280"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleSignup}
        />

        <TouchableOpacity style={s.btnPrimary} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>Create Account</Text>}
        </TouchableOpacity>

        <View style={s.row}>
          <Text style={s.muted}>Already have an account? </Text>
          <Link href="/(auth)/login" style={s.link}>Log in</Link>
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
  btnPrimary: {
    backgroundColor: '#f97316', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  muted: { color: '#6b7280', fontSize: 14 },
  link: { color: '#f97316', fontSize: 14, fontWeight: '600' },
});
