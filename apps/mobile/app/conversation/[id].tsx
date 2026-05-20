import { useState, useRef, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface ConversationData {
  messages: Message[];
  total: number;
  otherUser?: { id: string; profile?: { name?: string } };
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data, isLoading } = useQuery<ConversationData>({
    queryKey: ['messages', id],
    queryFn: () => api.get(`/messages/conversations/${id}?limit=50`).then((r) => r.data),
    refetchInterval: 10_000,
  });

  const messages = data?.messages ?? [];
  const otherName = data?.otherUser?.profile?.name ?? 'Conversation';

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 150);
    }
  }, [messages.length]);

  const send = useMutation({
    mutationFn: (content: string) =>
      api.post(`/messages/conversations/${id}/messages`, { content }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['messages', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    },
  });

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    send.mutate(trimmed);
  }

  return (
    <SafeAreaView style={s.flex} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{otherName}</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <View style={s.center}><ActivityIndicator color="#f97316" /></View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={s.messageList}
            renderItem={({ item }) => {
              const isMine = item.senderId === userId;
              return (
                <View style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
                  <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}>
                    <Text style={[s.bubbleText, isMine && s.bubbleTextMine]}>
                      {item.content}
                    </Text>
                  </View>
                  <Text style={[s.time, isMine && s.timeMine]}>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={s.empty}>No messages yet — say hello!</Text>
              </View>
            }
          />
        )}

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Type a message…"
            placeholderTextColor="#6b7280"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!text.trim() || send.isPending) && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || send.isPending}
          >
            {send.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Send size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 48 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2a2a2e',
  },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 16, marginHorizontal: 8 },
  messageList: { padding: 12, gap: 10, flexGrow: 1 },
  bubbleWrap: { gap: 3 },
  bubbleWrapMine: { alignItems: 'flex-end' },
  bubbleWrapTheirs: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMine: { backgroundColor: '#f97316' },
  bubbleTheirs: { backgroundColor: '#1c1c1e' },
  bubbleText: { color: '#e5e7eb', fontSize: 15, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  time: { color: '#6b7280', fontSize: 10 },
  timeMine: { color: '#9ca3af' },
  empty: { color: '#6b7280', fontSize: 14 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: '#2a2a2e',
  },
  input: {
    flex: 1, backgroundColor: '#1c1c1e', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 15,
    maxHeight: 100, borderWidth: 1, borderColor: '#2a2a2e',
  },
  sendBtn: {
    backgroundColor: '#f97316', borderRadius: 20,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
