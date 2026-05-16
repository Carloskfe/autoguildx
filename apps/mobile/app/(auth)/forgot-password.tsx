import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../lib/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      Alert.alert('Email sent', 'Check your inbox for a password reset link.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Reset password</Text>
        <Text style={s.subtitle}>Enter your email and we'll send a reset link.</Text>
        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f0f0f' },
  container: { flex: 1, padding: 24, gap: 12, paddingTop: 64 },
  back: { marginBottom: 8 },
  backText: { color: '#f97316', fontSize: 15 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitle: { color: '#6b7280', fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: '#1c1c1e', color: '#fff', borderRadius: 12, padding: 14,
    fontSize: 16, borderWidth: 1, borderColor: '#2a2a2e',
  },
  btn: { backgroundColor: '#f97316', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
