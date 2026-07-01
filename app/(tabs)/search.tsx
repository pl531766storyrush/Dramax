import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Play, Eye } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Category, VideoWithProfile } from '@/types/database';
import { useFocusEffect } from 'expo-router';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useFocusEffect(useCallback(() => {
    loadCategories();
  }, []));

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories((data as Category[]) || []);
  }

  async function handleSearch(q?: string, catId?: string | null) {
    const searchQuery = q !== undefined ? q : query;
    const catFilter = catId !== undefined ? catId : selectedCategory;
    if (!searchQuery.trim() && !catFilter) return;

    setLoading(true);
    setSearched(true);

    let req = supabase
      .from('videos')
      .select('*, profiles(*), categories(*)')
      .eq('is_published', true);

    if (searchQuery.trim()) {
      req = req.ilike('title', `%${searchQuery.trim()}%`);
    }
    if (catFilter) {
      req = req.eq('category_id', catFilter);
    }

    const { data } = await req.order('views_count', { ascending: false }).limit(30);
    setVideos((data as unknown as VideoWithProfile[]) || []);
    setLoading(false);
  }

  function handleCategoryPress(catId: string) {
    const newCat = selectedCategory === catId ? null : catId;
    setSelectedCategory(newCat);
    handleSearch(query, newCat);
  }

  function clearSearch() {
    setQuery('');
    setVideos([]);
    setSearched(false);
    setSelectedCategory(null);
  }

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dramas, genres..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={clearSearch}>
              <X size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesList}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
            ]}
            onPress={() => handleCategoryPress(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!searched && !selectedCategory ? (
        <View style={styles.promptContainer}>
          <View style={styles.promptGrid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { borderColor: cat.color + '44' }]}
                onPress={() => handleCategoryPress(cat.id)}
              >
                <Text style={styles.categoryCardIcon}>{cat.icon}</Text>
                <Text style={styles.categoryCardName}>{cat.name}</Text>
                <View style={[styles.categoryCardDot, { backgroundColor: cat.color }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.results}
          columnWrapperStyle={styles.columnWrap}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.videoCard}>
              <Image
                source={{ uri: item.thumbnail_url || `https://images.pexels.com/photos/${1200000 + (item.id.charCodeAt(0) * 111) % 400000}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=200&h=300` }}
                style={styles.videoThumb}
              />
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.videoMeta}>
                  <Eye size={11} color={COLORS.textMuted} />
                  <Text style={styles.videoMetaText}>{formatCount(item.views_count)}</Text>
                  <Play size={11} color={COLORS.textMuted} />
                  <Text style={styles.videoMetaText}>{item.duration}s</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No dramas found</Text>
              <Text style={styles.noResultsSub}>Try a different search or category</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: SPACING.md },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.text },
  searchRow: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 46,
  },
  searchInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 15, color: COLORS.text },
  categoriesScroll: { maxHeight: 48, marginBottom: SPACING.lg },
  categoriesList: { paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryIcon: { fontSize: 14 },
  categoryChipText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textSecondary },
  categoryChipActive: { color: COLORS.text },
  promptContainer: { flex: 1, paddingHorizontal: SPACING.xl },
  promptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  categoryCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryCardIcon: { fontSize: 32 },
  categoryCardName: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  categoryCardDot: { width: 6, height: 6, borderRadius: 3 },
  results: { paddingHorizontal: SPACING.xl, paddingBottom: 100 },
  columnWrap: { gap: SPACING.md, marginBottom: SPACING.md },
  videoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoThumb: { width: '100%', height: 160 },
  videoInfo: { padding: SPACING.sm },
  videoTitle: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginBottom: SPACING.xs },
  videoMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  videoMetaText: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted },
  noResults: { alignItems: 'center', padding: 60, gap: 8 },
  noResultsText: { fontFamily: FONTS.semiBold, fontSize: 18, color: COLORS.text },
  noResultsSub: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted },
});
