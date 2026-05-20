import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, MessageCircle, Tag } from 'lucide-react-native';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId, isAuthenticated } = useAuth();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then((r) => r.data),
  });

  const startConvo = useMutation({
    mutationFn: (recipientId: string) =>
      api.post('/messages/conversations', { recipientId }).then((r) => r.data),
    onSuccess: (data) => router.push(`/conversation/${data.id}`),
    onError: () => Alert.alert('Error', 'Could not start conversation.'),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={s.flex} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.center}><ActivityIndicator color="#f97316" /></View>
      </SafeAreaView>
    );
  }

  const isOwn = listing?.userId === userId;
  const sellerUserId = listing?.user?.id ?? listing?.userId;

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{listing?.title ?? 'Listing'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {listing?.mediaUrls?.[0] ? (
          <Image source={{ uri: listing.mediaUrls[0] }} style={s.heroImage} resizeMode="cover" />
        ) : (
          <View style={s.heroPlaceholder} />
        )}

        <View style={s.body}>
          <Text style={s.title}>{listing?.title}</Text>
          <Text style={s.price}>
            {listing?.price ? `$${Number(listing.price).toLocaleString()}` : 'Contact for price'}
          </Text>

          <View style={s.metaRow}>
            <Tag size={13} color="#6b7280" />
            <Text style={s.metaText}>{listing?.category} · {listing?.type}</Text>
          </View>
          {listing?.location && (
            <View style={s.metaRow}>
              <MapPin size={13} color="#6b7280" />
              <Text style={s.metaText}>{listing.location}</Text>
            </View>
          )}

          {listing?.description ? (
            <>
              <Text style={s.sectionLabel}>Description</Text>
              <Text style={s.description}>{listing.description}</Text>
            </>
          ) : null}

          {listing?.user?.profile && (
            <>
              <Text style={s.sectionLabel}>Seller</Text>
              <Text style={s.sellerName}>
                {listing.user.profile.name ?? listing.user.email ?? 'Unknown'}
              </Text>
            </>
          )}

          {!isOwn && isAuthenticated && sellerUserId && (
            <TouchableOpacity
              style={[s.cta, startConvo.isPending && s.ctaDisabled]}
              onPress={() => startConvo.mutate(sellerUserId)}
              disabled={startConvo.isPending}
            >
              <MessageCircle size={18} color="#fff" />
              <Text style={s.ctaText}>
                {startConvo.isPending ? 'Opening…' : 'Message Seller'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2a2a2e',
  },
  headerTitle: {
    flex: 1, textAlign: 'center', color: '#fff',
    fontWeight: '700', fontSize: 15, marginHorizontal: 8,
  },
  heroImage: { width: '100%', height: 260 },
  heroPlaceholder: { width: '100%', height: 200, backgroundColor: '#1c1c1e' },
  body: { padding: 16, gap: 8 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 26 },
  price: { color: '#f97316', fontSize: 22, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#6b7280', fontSize: 13 },
  sectionLabel: {
    color: '#9ca3af', fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8,
  },
  description: { color: '#e5e7eb', fontSize: 14, lineHeight: 22 },
  sellerName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#f97316', borderRadius: 12, padding: 14, marginTop: 8,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
