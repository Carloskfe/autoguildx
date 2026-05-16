import { useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { router } from 'expo-router';
import api from '../../lib/api';

const FILTERS = ['All', 'People', 'Listings', 'Events'] as const;
type Filter = (typeof FILTERS)[number];

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['search', search, filter],
    queryFn: () =>
      api.get('/search', { params: { q: search, type: filter === 'All' ? undefined : filter.toLowerCase() } }).then((r) => r.data),
    enabled: search.length > 0,
  });

  const results = data ?? { profiles: [], listings: [], events: [] };

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Discover</Text>
      </View>

      <View style={s.searchRow}>
        <Search size={16} color="#6b7280" style={{ marginLeft: 12 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search people, parts, events..."
          placeholderTextColor="#6b7280"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setSearch(query)}
          returnKeyType="search"
        />
      </View>

      <View style={s.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && <ActivityIndicator color="#f97316" style={{ marginTop: 32 }} />}

      {search.length > 0 && !isLoading && (
        <FlatList
          data={[
            ...results.profiles.map((p: any) => ({ ...p, _type: 'profile' })),
            ...results.listings.map((l: any) => ({ ...l, _type: 'listing' })),
            ...results.events.map((e: any) => ({ ...e, _type: 'event' })),
          ]}
          keyExtractor={(item) => `${item._type}-${item.id}`}
          renderItem={({ item }) => (
            <View style={s.resultCard}>
              <View style={s.resultBadge}>
                <Text style={s.resultBadgeText}>{item._type}</Text>
              </View>
              <Text style={s.resultTitle}>
                {item.name ?? item.title ?? 'Untitled'}
              </Text>
              {item.bio && <Text style={s.resultSub} numberOfLines={1}>{item.bio}</Text>}
              {item.description && <Text style={s.resultSub} numberOfLines={1}>{item.description}</Text>}
            </View>
          )}
          ListEmptyComponent={
            <Text style={s.empty}>No results for "{search}"</Text>
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      {search.length === 0 && (
        <View style={s.center}>
          <Text style={s.hint}>Search for people, listings, or events</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2e' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1c1c1e', margin: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#2a2a2e',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, padding: 12 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#2a2a2e' },
  chipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  chipText: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  resultCard: { marginHorizontal: 12, marginTop: 10, backgroundColor: '#1c1c1e', borderRadius: 12, padding: 14 },
  resultBadge: { alignSelf: 'flex-start', backgroundColor: '#f97316/20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  resultBadgeText: { color: '#f97316', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  resultTitle: { color: '#fff', fontWeight: '600', fontSize: 15 },
  resultSub: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 32, fontSize: 14 },
  hint: { color: '#6b7280', fontSize: 14 },
});
