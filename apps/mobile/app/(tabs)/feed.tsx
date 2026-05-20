import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Image, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Share2, Plus, X, Send } from 'lucide-react-native';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const REACTIONS = ['🔥', '❤️', '🔧', '😮', '👍'] as const;
const REACTION_KEYS = ['fire', 'love', 'respect', 'wild', 'like'] as const;

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  reactionsCount: number;
  commentsCount: number;
  createdAt: string;
  user: { id: string; profile?: { name?: string; profileImageUrl?: string } };
}

function PostCard({ post, currentUserId }: { post: Post; currentUserId: string | null }) {
  const qc = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);

  const react = useMutation({
    mutationFn: (reactionType: string) =>
      api.post(`/posts/${post.id}/react`, { type: reactionType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      setShowReactions(false);
    },
  });

  const name = post.user?.profile?.name ?? 'Unknown';
  const avatar = post.user?.profile?.profileImageUrl;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Text style={s.avatarText}>{name[0]?.toUpperCase()}</Text>
          </View>
        )}
        <Text style={s.authorName}>{name}</Text>
      </View>

      <Text style={s.content}>{post.content}</Text>

      {post.mediaUrls?.[0] && (
        <Image source={{ uri: post.mediaUrls[0] }} style={s.media} resizeMode="cover" />
      )}

      {showReactions && (
        <View style={s.reactionPicker}>
          {REACTIONS.map((emoji, i) => (
            <TouchableOpacity
              key={REACTION_KEYS[i]}
              style={s.reactionBtn}
              onPress={() => react.mutate(REACTION_KEYS[i])}
            >
              <Text style={s.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={s.actions}>
        <TouchableOpacity
          style={s.action}
          onPress={() => setShowReactions((v) => !v)}
        >
          <Text style={s.reactionIcon}>🔥</Text>
          <Text style={s.actionCount}>{post.reactionsCount ?? 0}</Text>
        </TouchableOpacity>
        <View style={s.action}>
          <MessageCircle size={16} color="#6b7280" />
          <Text style={s.actionCount}>{post.commentsCount}</Text>
        </View>
      </View>
    </View>
  );
}

function ComposeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [text, setText] = useState('');

  const post = useMutation({
    mutationFn: () => api.post('/posts', { content: text.trim(), visibility: 'public' }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['feed'] });
      onClose();
    },
  });

  function handleClose() { setText(''); onClose(); }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={s.composeContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.composeHeader}>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <X size={22} color="#9ca3af" />
          </TouchableOpacity>
          <Text style={s.composeTitle}>New Post</Text>
          <TouchableOpacity
            onPress={() => post.mutate()}
            disabled={!text.trim() || post.isPending}
          >
            {post.isPending
              ? <ActivityIndicator size="small" color="#f97316" />
              : <Text style={[s.postBtn, !text.trim() && s.postBtnDisabled]}>Post</Text>}
          </TouchableOpacity>
        </View>
        <TextInput
          style={s.composeInput}
          placeholder="Share what you're working on…"
          placeholderTextColor="#6b7280"
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          maxLength={2000}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function FeedScreen() {
  const { userId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading } =
    useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: ({ pageParam = 1 }) =>
        api.get(`/posts/feed?page=${pageParam}&limit=20`).then((r) => r.data),
      getNextPageParam: (last, all) =>
        last.posts?.length === 20 ? all.length + 1 : undefined,
      initialPageParam: 1,
    });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const posts = data?.pages.flatMap((p) => p.posts ?? []) ?? [];

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Feed</Text>
        <TouchableOpacity style={s.composeBtn} onPress={() => setShowCompose(true)}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} currentUserId={userId} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage
            ? <ActivityIndicator color="#f97316" style={{ padding: 16 }} />
            : null}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={s.empty}>Nothing in your feed yet.</Text>
              <Text style={s.emptyHint}>Follow people to see their posts here.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
        />
      )}

      <ComposeModal visible={showCompose} onClose={() => setShowCompose(false)} />
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  composeBtn: { backgroundColor: '#f97316', borderRadius: 8, padding: 6 },
  card: { backgroundColor: '#1c1c1e', marginHorizontal: 12, marginTop: 12, borderRadius: 16, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  authorName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  content: { color: '#e5e7eb', fontSize: 14, lineHeight: 20 },
  media: { width: '100%', height: 200, borderRadius: 10, marginTop: 10 },
  reactionPicker: {
    flexDirection: 'row', gap: 6, marginTop: 10,
    backgroundColor: '#2a2a2e', borderRadius: 20, padding: 8, alignSelf: 'flex-start',
  },
  reactionBtn: { padding: 4 },
  reactionEmoji: { fontSize: 20 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reactionIcon: { fontSize: 16 },
  actionCount: { color: '#6b7280', fontSize: 13 },
  empty: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
  emptyHint: { color: '#4b5563', fontSize: 13, marginTop: 6 },
  // Compose modal
  composeContainer: { flex: 1, backgroundColor: '#0f0f0f' },
  composeHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2e',
  },
  composeTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  postBtn: { color: '#f97316', fontWeight: '700', fontSize: 16 },
  postBtnDisabled: { opacity: 0.4 },
  composeInput: {
    flex: 1, color: '#fff', fontSize: 16, padding: 16,
    lineHeight: 24, textAlignVertical: 'top',
  },
});
