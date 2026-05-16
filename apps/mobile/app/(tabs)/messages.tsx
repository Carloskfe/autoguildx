import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface Conversation {
  id: string;
  participantAId: string;
  participantBId: string;
  lastMessageAt: string;
  otherUser?: { id: string; profile?: { name?: string } };
  lastMessage?: { content: string };
  unreadCount?: number;
}

export default function MessagesScreen() {
  const { userId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations').then((r) => r.data),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const conversations: Conversation[] = data ?? [];

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Messages</Text>
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color="#f97316" /></View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
          renderItem={({ item }) => {
            const name = item.otherUser?.profile?.name ?? 'Unknown';
            const initials = name[0]?.toUpperCase() ?? '?';
            return (
              <TouchableOpacity
                style={s.row}
                onPress={() => router.push(`/conversation/${item.id}`)}
              >
                <View style={s.avatarCircle}>
                  <Text style={s.avatarText}>{initials}</Text>
                </View>
                <View style={s.rowBody}>
                  <Text style={s.name}>{name}</Text>
                  <Text style={s.preview} numberOfLines={1}>
                    {item.lastMessage?.content ?? 'Start a conversation'}
                  </Text>
                </View>
                {item.lastMessageAt && (
                  <Text style={s.time}>
                    {formatDistanceToNow(new Date(item.lastMessageAt), { addSuffix: false })}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={s.empty}>No conversations yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 48 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2e' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1c1c1e', gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  rowBody: { flex: 1 },
  name: { color: '#fff', fontWeight: '600', fontSize: 15 },
  preview: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  time: { color: '#6b7280', fontSize: 11 },
  empty: { color: '#6b7280', fontSize: 14 },
});
