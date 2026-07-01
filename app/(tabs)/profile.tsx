import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Grid3x3, Heart, Users, LogOut, Edit3 } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { VideoWithProfile } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [likedVideos, setLikedVideos] = useState<VideoWithProfile[]>([]);
  const [tab, setTab] = useState<'videos' | 'liked'>('videos');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (user) loadUserContent();
  }, [user]));

  async function loadUserContent() {
    setLoading(true);
    const [videosRes, likesRes] = await Promise.all([
      supabase
        .from('videos')
        .select('*, profiles(*), categories(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('likes')
        .select('videos(*, profiles(*), categories(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    setVideos((videosRes.data as unknown as VideoWithProfile[]) || []);
    const liked = (likesRes.data || []).map((l: any) => l.videos).filter(Boolean);
    setLikedVideos(liked as VideoWithProfile[]);
    setLoading(false);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const displayVideos = tab === 'videos' ? videos : likedVideos;

  const stats = [
    { label: 'Videos', value: videos.length },
    { label: 'Followers', value: profile?.followers_count || 0 },
    { label: 'Following', value: profile?.following_count || 0 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1a0a0a', COLORS.background]} style={styles.headerGrad}>
          <View style={styles.headerRow}>
            <Text style={styles.screenTitle}>Profile</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.iconBtn}>
              <LogOut size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}` }}
                style={styles.avatar}
              />
              {profile?.is_admin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              )}
            </View>
            <Text style={styles.displayName}>{profile?.display_name || profile?.username || 'User'}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            <View style={styles.statsRow}>
              {stats.map(s => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value >= 1000 ? `${(s.value / 1000).toFixed(1)}K` : s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.editBtn}>
              <Edit3 size={16} color={COLORS.text} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'videos' && styles.tabActive]}
            onPress={() => setTab('videos')}
          >
            <Grid3x3 size={18} color={tab === 'videos' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, tab === 'videos' && styles.tabTextActive]}>Videos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'liked' && styles.tabActive]}
            onPress={() => setTab('liked')}
          >
            <Heart size={18} color={tab === 'liked' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, tab === 'liked' && styles.tabTextActive]}>Liked</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : displayVideos.length === 0 ? (
          <View style={styles.emptyTab}>
            <Text style={styles.emptyText}>
              {tab === 'videos' ? 'No videos yet' : 'No liked videos'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {displayVideos.map(video => (
              <TouchableOpacity key={video.id} style={styles.gridItem}>
                <Image
                  source={{ uri: video.thumbnail_url || `https://images.pexels.com/photos/${1050000 + (video.id.charCodeAt(0) * 229) % 550000}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=150&h=200` }}
                  style={styles.gridThumb}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.gridOverlay}
                >
                  <Text style={styles.gridTitle} numberOfLines={1}>{video.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerGrad: { paddingBottom: SPACING.xl },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  screenTitle: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.text },
  iconBtn: { padding: SPACING.xs },
  profileSection: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.md },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  adminBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminBadgeText: { fontFamily: FONTS.bold, fontSize: 9, color: COLORS.text, letterSpacing: 0.5 },
  displayName: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text },
  username: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.xs },
  bio: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 20, marginBottom: SPACING.md },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.xxl,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
  statLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editBtnText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginHorizontal: SPACING.xl,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  emptyTab: { padding: 60, alignItems: 'center' },
  emptyText: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.textMuted },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  gridItem: {
    width: '31.5%',
    aspectRatio: 0.75,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  gridThumb: { ...StyleSheet.absoluteFillObject },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.xs,
  },
  gridTitle: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.text },
});
