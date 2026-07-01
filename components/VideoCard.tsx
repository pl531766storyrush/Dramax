import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  Share,
  Platform,
} from 'react-native';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '@/constants/theme';
import { VideoWithProfile } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoCardProps {
  video: VideoWithProfile;
  isActive: boolean;
  onCommentPress: (video: VideoWithProfile) => void;
}

export function VideoCard({ video, isActive, onCommentPress }: VideoCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(false);
  const heartScale = useSharedValue(1);

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLike = useCallback(async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(c => c + (newLiked ? 1 : -1));

    heartScale.value = withSequence(
      withSpring(1.4, { damping: 4 }),
      withSpring(1, { damping: 8 })
    );

    if (newLiked) {
      await supabase.from('likes').insert({ video_id: video.id });
      await supabase.from('videos').update({ likes_count: likesCount + 1 }).eq('id', video.id);
    } else {
      await supabase.from('likes').delete().eq('video_id', video.id).eq('user_id', user.id);
      await supabase.from('videos').update({ likes_count: Math.max(0, likesCount - 1) }).eq('id', video.id);
    }
  }, [liked, likesCount, user, video.id]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    const newSaved = !saved;
    setSaved(newSaved);
    if (newSaved) {
      await supabase.from('favorites').insert({ video_id: video.id });
    } else {
      await supabase.from('favorites').delete().eq('video_id', video.id).eq('user_id', user.id);
    }
  }, [saved, user, video.id]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Watch "${video.title}" on Dramax!`,
        title: video.title,
      });
      await supabase.from('videos').update({ shares_count: video.shares_count + 1 }).eq('id', video.id);
    } catch (_) {}
  }, [video]);

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  const thumbnail = video.thumbnail_url || `https://images.pexels.com/photos/${1000000 + (video.id.charCodeAt(0) * 137) % 500000}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400&h=700&dpr=1`;

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: thumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
        locations={[0.3, 0.6, 1]}
      />

      {video.is_featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>FEATURED</Text>
        </View>
      )}

      {video.categories && (
        <View style={[styles.categoryBadge, { backgroundColor: video.categories.color + '33' }]}>
          <Text style={styles.categoryText}>{video.categories.icon} {video.categories.name}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.muteBtn} onPress={() => setMuted(m => !m)}>
        {muted ? <VolumeX size={18} color={COLORS.text} /> : <Volume2 size={18} color={COLORS.text} />}
      </TouchableOpacity>

      <View style={styles.actions}>
        <View style={styles.authorSection}>
          <Image
            source={{ uri: video.profiles.avatar_url || `https://i.pravatar.cc/150?u=${video.user_id}` }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Animated.View style={heartAnimStyle}>
            <Heart size={28} color={liked ? COLORS.primary : COLORS.text} fill={liked ? COLORS.primary : 'transparent'} />
          </Animated.View>
          <Text style={styles.actionCount}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onCommentPress(video)}>
          <MessageCircle size={28} color={COLORS.text} />
          <Text style={styles.actionCount}>{formatCount(video.comments_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Share2 size={28} color={COLORS.text} />
          <Text style={styles.actionCount}>{formatCount(video.shares_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
          <Bookmark size={28} color={saved ? COLORS.accent : COLORS.text} fill={saved ? COLORS.accent : 'transparent'} />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.username}>@{video.profiles.username}</Text>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        {video.description ? (
          <Text style={styles.description} numberOfLines={2}>{video.description}</Text>
        ) : null}
        {video.tags?.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {video.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: COLORS.background,
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredBadge: {
    position: 'absolute',
    top: 56,
    left: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  featuredText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.text, letterSpacing: 1 },
  categoryBadge: {
    position: 'absolute',
    top: 56,
    right: SPACING.lg,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.text },
  muteBtn: {
    position: 'absolute',
    top: 56,
    right: SPACING.lg,
    bottom: undefined,
  },
  actions: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: 100,
    alignItems: 'center',
    gap: SPACING.xl,
  },
  authorSection: { alignItems: 'center', marginBottom: SPACING.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  followBtn: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  followText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.text },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionCount: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.text },
  info: {
    position: 'absolute',
    bottom: 90,
    left: SPACING.lg,
    right: 80,
  },
  username: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text, marginBottom: SPACING.xs },
  videoTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text, marginBottom: SPACING.xs },
  description: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: SPACING.xs },
  tags: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.primaryLight },
});
