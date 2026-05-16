import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: { id: string; profile?: { name?: string; profileImageUrl?: string } };
}

function PostCard({ post, currentUserId }: { post: Post; currentUserId: string | null }) {
  const qc = useQueryClient();
  const like = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
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

      <View style={s.actions}>
        <TouchableOpacity style={s.action} onPress={() => like.mutate()}>
          <Heart size={18} color="#6b7280" />
          <Text style={s.actionCount}>{post.likesCount}</Text>
        </TouchableOpacity>
        <View style={s.action}>
          <MessageCircle size={18} color="#6b7280" />
          <Text style={s.actionCount}>{post.commentsCount}</Text>
        </View>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { userId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

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
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color="#f97316" style={{ padding: 16 }} /> : null}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2e' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: '#1c1c1e', marginHorizontal: 12, marginTop: 12, borderRadius: 16, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  authorName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  content: { color: '#e5e7eb', fontSize: 14, lineHeight: 20 },
  media: { width: '100%', height: 200, borderRadius: 10, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { color: '#6b7280', fontSize: 13 },
});
