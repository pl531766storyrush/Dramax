import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, Trash2, Play } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { VideoWithProfile } from '@/types/database';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface FavoriteItem {
  id: string;
  video_id: string;
  created_at: string;
  videos: VideoWithProfile;
}

export default function FavoritesScreen() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    loadFavorites();
  }, [user]));

  async function loadFavorites() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('*, videos(*, profiles(*), categories(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setFavorites((data as unknown as FavoriteItem[]) || []);
    setLoading(false);
  }

  async function removeFavorite(favoriteId: string) {
    await supabase.from('favorites').delete().eq('id', favoriteId);
    setFavorites(prev => prev.filter(f => f.id !== favoriteId));
  }

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        <Text style={styles.headerCount}>{favorites.length} videos</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const video = item.videos;
            if (!video) return null;
            return (
              <TouchableOpacity style={styles.card} activeOpacity={0.8}>
                <Image
                  source={{ uri: video.thumbnail_url || `https://images.pexels.com/photos/${1100000 + (video.id.charCodeAt(0) * 193) % 600000}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=120&h=180` }}
                  style={styles.thumb}
                />
                <View style={styles.playOverlay}>
                  <Play size={18} color={COLORS.text} fill={COLORS.text} />
                </View>
                <View style={styles.info}>
                  {video.categories && (
                    <Text style={[styles.category, { color: video.categories.color }]}>
                      {video.categories.icon} {video.categories.name}
                    </Text>
                  )}
                  <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
                  <Text style={styles.meta}>@{video.profiles?.username}</Text>
                  <View style={styles.stats}>
                    <Text style={styles.statText}>{formatCount(video.likes_count)} likes</Text>
                    <Text style={styles.statDot}>·</Text>
                    <Text style={styles.statText}>{video.duration}s</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeFavorite(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={18} color={COLORS.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bookmark size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No saved videos</Text>
              <Text style={styles.emptySub}>Tap the bookmark icon on any video to save it here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.text },
  headerCount: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumb: { width: 90, height: 120 },
  playOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 90,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, padding: SPACING.md, justifyContent: 'center', gap: SPACING.xs },
  category: { fontFamily: FONTS.medium, fontSize: 11 },
  title: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  meta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSecondary },
  stats: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  statText: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted },
  statDot: { color: COLORS.textMuted, fontSize: 11 },
  removeBtn: { padding: SPACING.md, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
  emptySub: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
});
