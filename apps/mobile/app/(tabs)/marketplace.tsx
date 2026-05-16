import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, TextInput,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import api from '../../lib/api';

interface Listing {
  id: string;
  title: string;
  price: number;
  type: string;
  category: string;
  mediaUrls: string[];
  location?: string;
  user?: { profile?: { name?: string } };
}

function ListingCard({ item }: { item: Listing }) {
  return (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/listing/${item.id}`)}>
      {item.mediaUrls?.[0] ? (
        <Image source={{ uri: item.mediaUrls[0] }} style={s.thumb} resizeMode="cover" />
      ) : (
        <View style={[s.thumb, s.thumbFallback]} />
      )}
      <View style={s.cardBody}>
        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        <Text style={s.price}>${Number(item.price).toLocaleString()}</Text>
        <Text style={s.meta}>{item.category} · {item.location ?? 'USA'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MarketplaceScreen() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['listings', search],
      queryFn: ({ pageParam = 1 }) =>
        api.get('/listings', { params: { page: pageParam, limit: 20, search: search || undefined } }).then((r) => r.data),
      getNextPageParam: (last, all) =>
        last.listings?.length === 20 ? all.length + 1 : undefined,
      initialPageParam: 1,
    });

  const listings = data?.pages.flatMap((p) => p.listings ?? []) ?? [];

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Marketplace</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/listing/new')}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.searchRow}>
        <Search size={16} color="#6b7280" style={{ marginLeft: 12 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search parts, services..."
          placeholderTextColor="#6b7280"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setSearch(query)}
          returnKeyType="search"
        />
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color="#f97316" /></View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListingCard item={item} />}
          numColumns={2}
          columnWrapperStyle={{ gap: 8, paddingHorizontal: 12 }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color="#f97316" style={{ padding: 16 }} /> : null}
          ListEmptyComponent={<Text style={s.empty}>No listings found</Text>}
          contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2e' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  addBtn: { backgroundColor: '#f97316', borderRadius: 8, padding: 6 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e', margin: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2e' },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, padding: 12 },
  card: { flex: 1, backgroundColor: '#1c1c1e', borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  thumb: { width: '100%', aspectRatio: 1 },
  thumbFallback: { backgroundColor: '#2a2a2e' },
  cardBody: { padding: 10, gap: 3 },
  title: { color: '#fff', fontWeight: '600', fontSize: 13, lineHeight: 18 },
  price: { color: '#f97316', fontWeight: '700', fontSize: 14 },
  meta: { color: '#6b7280', fontSize: 11 },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 48, fontSize: 14 },
});
