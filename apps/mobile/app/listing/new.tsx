import { useState } from 'react';
import { router } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import api from '../../lib/api';

const TYPES = ['part', 'service'] as const;
const CATEGORIES = [
  'Engine & Drivetrain', 'Suspension & Steering', 'Brakes', 'Body & Exterior',
  'Interior', 'Electrical', 'Wheels & Tires', 'Tools & Equipment',
  'Accessories', 'Motorcycle', 'Off-Road', 'Other',
];

export default function NewListingScreen() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<'part' | 'service'>('part');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      api.post('/listings', {
        title: title.trim(),
        price: price ? parseFloat(price) : undefined,
        type,
        category,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      router.back();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create listing.';
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const canSubmit = title.trim().length > 0 && !create.isPending;

  return (
    <SafeAreaView style={s.flex} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Listing</Text>
        <TouchableOpacity
          onPress={() => create.mutate()}
          disabled={!canSubmit}
        >
          {create.isPending
            ? <ActivityIndicator size="small" color="#f97316" />
            : <Text style={[s.postBtn, !canSubmit && s.postBtnDisabled]}>Post</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Title *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. LS3 Short Block, Low Miles"
          placeholderTextColor="#6b7280"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        <Text style={s.label}>Price</Text>
        <TextInput
          style={s.input}
          placeholder="Leave blank to show 'Contact for price'"
          placeholderTextColor="#6b7280"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        <Text style={s.label}>Type</Text>
        <View style={s.typeRow}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.typeBtn, type === t && s.typeBtnActive]}
              onPress={() => setType(t)}
            >
              <Text style={[s.typeBtnText, type === t && s.typeBtnTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Category</Text>
        <TouchableOpacity
          style={s.selector}
          onPress={() => setShowCategories((v) => !v)}
        >
          <Text style={s.selectorText}>{category}</Text>
          <ChevronDown size={16} color="#6b7280" />
        </TouchableOpacity>
        {showCategories && (
          <View style={s.dropdown}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={s.dropdownItem}
                onPress={() => { setCategory(c); setShowCategories(false); }}
              >
                <Text style={[s.dropdownText, category === c && s.dropdownTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={s.label}>Description</Text>
        <TextInput
          style={[s.input, s.textarea]}
          placeholder="Describe the item or service…"
          placeholderTextColor="#6b7280"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={2000}
        />

        <Text style={s.label}>Location</Text>
        <TextInput
          style={s.input}
          placeholder="City, State"
          placeholderTextColor="#6b7280"
          value={location}
          onChangeText={setLocation}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f0f0f' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2a2a2e',
  },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  postBtn: { color: '#f97316', fontWeight: '700', fontSize: 16 },
  postBtnDisabled: { opacity: 0.4 },
  form: { padding: 16, gap: 6, paddingBottom: 40 },
  label: { color: '#9ca3af', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12 },
  input: {
    backgroundColor: '#1c1c1e', borderRadius: 12, borderWidth: 1,
    borderColor: '#2a2a2e', color: '#fff', fontSize: 15, padding: 12, marginTop: 6,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  typeBtn: {
    flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#1c1c1e',
    borderWidth: 1, borderColor: '#2a2a2e', alignItems: 'center',
  },
  typeBtnActive: { borderColor: '#f97316', backgroundColor: '#f97316/10' },
  typeBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  typeBtnTextActive: { color: '#f97316' },
  selector: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1c1c1e', borderRadius: 12, borderWidth: 1,
    borderColor: '#2a2a2e', padding: 12, marginTop: 6,
  },
  selectorText: { color: '#fff', fontSize: 15 },
  dropdown: {
    backgroundColor: '#1c1c1e', borderRadius: 12, borderWidth: 1,
    borderColor: '#2a2a2e', marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2e' },
  dropdownText: { color: '#9ca3af', fontSize: 14 },
  dropdownTextActive: { color: '#f97316', fontWeight: '600' },
});
