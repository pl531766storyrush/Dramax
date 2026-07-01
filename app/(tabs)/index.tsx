import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { VideoWithProfile } from '@/types/database';
import { VideoCard } from '@/components/VideoCard';
import { CommentsSheet } from '@/components/CommentsSheet';
import { AdBanner } from '@/components/AdBanner';
import { Play } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AD_INTERVAL = 5;

export default function FeedScreen() {
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentVideo, setCommentVideo] = useState<VideoWithProfile | null>(null);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const flatRef = useRef<FlatList>(null);

  async function loadVideos() {
    const { data } = await supabase
      .from('videos')
      .select('*, profiles(*), categories(*)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(30);
    setVideos((data as unknown as VideoWithProfile[]) || []);
    setLoading(false);
  }

  useFocusEffect(useCallback(() => {
    loadVideos();
  }, []));

  async function handleRefresh() {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  });

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

  function handleCommentPress(video: VideoWithProfile) {
    setCommentVideo(video);
    setCommentsVisible(true);
  }

  type FeedItem = VideoWithProfile | { __ad: true; key: string };

  function buildFeedItems(): FeedItem[] {
    const items: FeedItem[] = [];
    videos.forEach((v, i) => {
      items.push(v);
      if ((i + 1) % AD_INTERVAL === 0) {
        items.push({ __ad: true, key: `ad_${i}` });
      }
    });
    return items;
  }

  const feedItems = buildFeedItems();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Play size={64} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No videos yet</Text>
        <Text style={styles.emptySubtitle}>Check back soon for new dramas</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={feedItems}
        keyExtractor={(item) => ('__ad' in item ? item.key : item.id)}
        renderItem={({ item, index }) => {
          if ('__ad' in item) {
            return <AdBanner />;
          }
          return (
            <VideoCard
              video={item}
              isActive={index === activeIndex}
              onCommentPress={handleCommentPress}
            />
          );
        }}
        pagingEnabled
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      />

      <CommentsSheet
        video={commentVideo}
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text },
  emptySubtitle: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  refreshBtn: { marginTop: 8, backgroundColor: COLORS.primary, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 10 },
  refreshBtnText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
});
