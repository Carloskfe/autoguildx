import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, LogOut, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { userId, logout } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/profiles/me').then((r) => r.data),
    enabled: !!userId,
  });

  const { data: posts } = useQuery({
    queryKey: ['my-posts'],
    queryFn: () => api.get(`/posts/user/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  if (isLoading) {
    return (
      <SafeAreaView style={s.flex} edges={['top']}>
        <View style={s.center}><ActivityIndicator color="#f97316" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Settings size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <LogOut size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Avatar + name */}
        <View style={s.profileSection}>
          {profile?.profileImageUrl ? (
            <Image source={{ uri: profile.profileImageUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>{profile?.name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <View style={s.nameRow}>
            <Text style={s.name}>{profile?.name ?? 'Your Name'}</Text>
            {profile?.isVerified && <CheckCircle size={16} color="#f97316" />}
          </View>
          {profile?.roleType && <Text style={s.role}>{profile.roleType}</Text>}
          {profile?.location && <Text style={s.meta}>{profile.location}</Text>}
          {profile?.bio && <Text style={s.bio}>{profile.bio}</Text>}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{profile?.followersCount ?? 0}</Text>
            <Text style={s.statLabel}>Followers</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{profile?.followingCount ?? 0}</Text>
            <Text style={s.statLabel}>Following</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{(posts as any[])?.length ?? 0}</Text>
            <Text style={s.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Tags */}
        {profile?.tags?.length > 0 && (
          <View style={s.tags}>
            {profile.tags.map((tag: string) => (
              <View key={tag} style={s.tag}>
                <Text style={s.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2e' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerActions: { flexDirection: 'row', gap: 16 },
  profileSection: { alignItems: 'center', padding: 24, gap: 6 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  avatarFallback: { backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  role: { color: '#f97316', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  meta: { color: '#6b7280', fontSize: 13 },
  bio: { color: '#e5e7eb', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 4, paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2a2a2e' },
  stat: { alignItems: 'center' },
  statNum: { color: '#fff', fontWeight: '800', fontSize: 20 },
  statLabel: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  tag: { backgroundColor: '#1c1c1e', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#2a2a2e' },
  tagText: { color: '#9ca3af', fontSize: 12 },
});
