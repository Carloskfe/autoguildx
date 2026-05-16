import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import {
  useGoogleAuth, signInWithGoogle,
  useFacebookAuth, signInWithFacebook,
  signInWithApple,
} from '../../lib/socialAuth';

function Divider() {
  return (
    <View style={s.divider}>
      <View style={s.dividerLine} />
      <Text style={s.dividerText}>or continue with</Text>
      <View style={s.dividerLine} />
    </View>
  );
}

export default function LoginScreen() {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const [googleRequest, googleResponse, googlePrompt] = useGoogleAuth();
  const [fbRequest, fbResponse, fbPrompt] = useFacebookAuth();

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

  async function handleSocial(provider: 'google' | 'facebook' | 'apple') {
    setSocialLoading(provider);
    try {
      let result = null;
      if (provider === 'google') {
        const response = await googlePrompt();
        result = await signInWithGoogle(response);
      } else if (provider === 'facebook') {
        const response = await fbPrompt();
        result = await signInWithFacebook(response);
      } else {
        result = await signInWithApple();
      }
      if (result) {
        await login(result.accessToken, result.userId, result.role);
        router.replace('/(tabs)/feed');
      }
    } catch (e: any) {
      Alert.alert('Sign-in failed', e.message ?? 'Please try again.');
    } finally {
      setSocialLoading(null);
    }
  }

  const isBusy = loading || !!socialLoading;

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
          editable={!isBusy}
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          editable={!isBusy}
        />

        <Link href="/(auth)/forgot-password" style={s.forgotLink}>
          Forgot password?
        </Link>

        <TouchableOpacity style={s.btnPrimary} onPress={handleLogin} disabled={isBusy}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnPrimaryText}>Log In</Text>}
        </TouchableOpacity>

        <Divider />

        {/* Google */}
        <TouchableOpacity
          style={s.socialBtn}
          onPress={() => handleSocial('google')}
          disabled={isBusy || !googleRequest}
        >
          {socialLoading === 'google'
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.socialIcon}>G</Text>}
          <Text style={s.socialText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Facebook */}
        <TouchableOpacity
          style={[s.socialBtn, s.facebookBtn]}
          onPress={() => handleSocial('facebook')}
          disabled={isBusy}
        >
          {socialLoading === 'facebook'
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.socialIcon}>f</Text>}
          <Text style={s.socialText}>Continue with Facebook</Text>
        </TouchableOpacity>

        {/* Apple */}
        <TouchableOpacity
          style={[s.socialBtn, s.appleBtn]}
          onPress={() => handleSocial('apple')}
          disabled={isBusy}
        >
          {socialLoading === 'apple'
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={[s.socialIcon, { color: '#000' }]}></Text>}
          <Text style={[s.socialText, { color: '#000' }]}>Continue with Apple</Text>
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
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2a2a2e' },
  dividerText: { color: '#6b7280', fontSize: 12 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#1c1c1e', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#2a2a2e',
  },
  facebookBtn: { backgroundColor: '#1877f2', borderColor: '#1877f2' },
  appleBtn: { backgroundColor: '#fff', borderColor: '#fff' },
  socialIcon: { color: '#fff', fontWeight: '800', fontSize: 16, width: 20, textAlign: 'center' },
  socialText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  muted: { color: '#6b7280', fontSize: 14 },
  link: { color: '#f97316', fontSize: 14, fontWeight: '600' },
});
