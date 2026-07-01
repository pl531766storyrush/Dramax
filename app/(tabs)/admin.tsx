import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Video, Users, Star, Trash2, Plus, Eye, EyeOff, ChevronRight, BarChart3 } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Profile, VideoWithProfile } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type AdminTab = 'overview' | 'videos' | 'users' | 'add';

export default function AdminScreen() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [videos, setVideos] = useState<VideoWithProfile[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [stats, setStats] = useState({ totalVideos: 0, totalUsers: 0, totalLikes: 0, totalViews: 0 });
  const [loading, setLoading] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration: '',
    tags: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  if (!profile?.is_admin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.accessDenied}>
          <ShieldCheck size={64} color={COLORS.textMuted} />
          <Text style={styles.accessTitle}>Admin Only</Text>
          <Text style={styles.accessSub}>You don't have access to this area</Text>
        </View>
      </SafeAreaView>
    );
  }

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  async function loadData() {
    setLoading(true);
    const [videosRes, usersRes] = await Promise.all([
      supabase.from('videos').select('*, profiles(*), categories(*)').order('created_at', { ascending: false }).limit(50) as any,
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50) as any,
    ]);
    const vids = (videosRes.data as unknown as VideoWithProfile[]) || [];
    const usrs = (usersRes.data as Profile[]) || [];
    setVideos(vids);
    setUsers(usrs);
    setStats({
      totalVideos: vids.length,
      totalUsers: usrs.length,
      totalLikes: vids.reduce((a, v) => a + v.likes_count, 0),
      totalViews: vids.reduce((a, v) => a + v.views_count, 0),
    });
    setLoading(false);
  }

  async function togglePublished(video: VideoWithProfile) {
    await supabase.from('videos').update({ is_published: !video.is_published }).eq('id', video.id);
    setVideos(vs => vs.map(v => v.id === video.id ? { ...v, is_published: !v.is_published } : v));
  }

  async function toggleFeatured(video: VideoWithProfile) {
    await supabase.from('videos').update({ is_featured: !video.is_featured }).eq('id', video.id);
    setVideos(vs => vs.map(v => v.id === video.id ? { ...v, is_featured: !v.is_featured } : v));
  }

  async function deleteVideo(id: string) {
    Alert.alert('Delete Video', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('videos').delete().eq('id', id);
          setVideos(vs => vs.filter(v => v.id !== id));
        }
      },
    ]);
  }

  async function toggleAdmin(u: Profile) {
    await supabase.from('profiles').update({ is_admin: !u.is_admin }).eq('id', u.id);
    setUsers(us => us.map(usr => usr.id === u.id ? { ...usr, is_admin: !usr.is_admin } : usr));
  }

  async function handleAddVideo() {
    if (!newVideo.title.trim() || !newVideo.video_url.trim()) {
      setAddError('Title and Video URL are required');
      return;
    }
    setAddLoading(true);
    setAddError('');
    const { error } = await supabase.from('videos').insert({
      title: newVideo.title.trim(),
      description: newVideo.description.trim(),
      video_url: newVideo.video_url.trim(),
      thumbnail_url: newVideo.thumbnail_url.trim(),
      duration: parseInt(newVideo.duration) || 0,
      tags: newVideo.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    if (error) {
      setAddError(error.message);
    } else {
      setNewVideo({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '', tags: '' });
      Alert.alert('Success', 'Video added successfully');
      await loadData();
    }
    setAddLoading(false);
  }

  const statCards = [
    { label: 'Total Videos', value: stats.totalVideos, icon: Video, color: COLORS.primary },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: COLORS.success },
    { label: 'Total Likes', value: stats.totalLikes, icon: Star, color: COLORS.accent },
    { label: 'Total Views', value: stats.totalViews, icon: BarChart3, color: '#457b9d' },
  ];

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'videos', label: 'Videos' },
    { key: 'users', label: 'Users' },
    { key: 'add', label: 'Add Video' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShieldCheck size={22} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabList}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabChip, activeTab === t.key && styles.tabChipActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabChipText, activeTab === t.key && styles.tabChipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && (
            <View style={styles.section}>
              <View style={styles.statsGrid}>
                {statCards.map(s => (
                  <View key={s.label} style={[styles.statCard, { borderColor: s.color + '33' }]}>
                    <LinearGradient colors={[s.color + '22', 'transparent']} style={styles.statCardGrad}>
                      <s.icon size={22} color={s.color} />
                      <Text style={[styles.statCardValue, { color: s.color }]}>
                        {s.value >= 1000 ? `${(s.value / 1000).toFixed(1)}K` : s.value}
                      </Text>
                      <Text style={styles.statCardLabel}>{s.label}</Text>
                    </LinearGradient>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Recent Videos</Text>
              {videos.slice(0, 5).map(v => (
                <View key={v.id} style={styles.miniRow}>
                  <View style={styles.miniInfo}>
                    <Text style={styles.miniTitle} numberOfLines={1}>{v.title}</Text>
                    <Text style={styles.miniMeta}>{v.likes_count} likes · {v.views_count} views</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: v.is_published ? COLORS.success : COLORS.textMuted }]} />
                </View>
              ))}
            </View>
          )}

          {activeTab === 'videos' && (
            <View style={styles.section}>
              {videos.map(v => (
                <View key={v.id} style={styles.videoRow}>
                  <View style={styles.videoRowInfo}>
                    <Text style={styles.videoRowTitle} numberOfLines={1}>{v.title}</Text>
                    <Text style={styles.videoRowMeta}>@{v.profiles?.username} · {v.likes_count} likes</Text>
                  </View>
                  <View style={styles.videoRowActions}>
                    <TouchableOpacity onPress={() => toggleFeatured(v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Star size={18} color={v.is_featured ? COLORS.accent : COLORS.textMuted} fill={v.is_featured ? COLORS.accent : 'transparent'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => togglePublished(v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      {v.is_published ? <Eye size={18} color={COLORS.success} /> : <EyeOff size={18} color={COLORS.textMuted} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteVideo(v.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Trash2 size={18} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'users' && (
            <View style={styles.section}>
              {users.map(u => (
                <View key={u.id} style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userUsername}>@{u.username}</Text>
                    <Text style={styles.userDisplay}>{u.display_name || '—'}</Text>
                  </View>
                  <View style={styles.userActions}>
                    <Text style={styles.adminLabel}>{u.is_admin ? 'Admin' : 'User'}</Text>
                    <Switch
                      value={u.is_admin}
                      onValueChange={() => toggleAdmin(u)}
                      trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
                      thumbColor={u.is_admin ? COLORS.primary : COLORS.textMuted}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'add' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add New Video</Text>
              {addError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{addError}</Text>
                </View>
              ) : null}
              {[
                { key: 'title', label: 'Title *', placeholder: 'Video title' },
                { key: 'description', label: 'Description', placeholder: 'Brief description' },
                { key: 'video_url', label: 'Video URL *', placeholder: 'https://...' },
                { key: 'thumbnail_url', label: 'Thumbnail URL', placeholder: 'https://...' },
                { key: 'duration', label: 'Duration (seconds)', placeholder: '90', keyboardType: 'numeric' },
                { key: 'tags', label: 'Tags (comma separated)', placeholder: 'romance, drama, love' },
              ].map(field => (
                <View key={field.key} style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={(newVideo as any)[field.key]}
                    onChangeText={v => setNewVideo(prev => ({ ...prev, [field.key]: v }))}
                    keyboardType={(field as any).keyboardType || 'default'}
                  />
                </View>
              ))}
              <TouchableOpacity
                style={[styles.addBtn, addLoading && styles.addBtnDisabled]}
                onPress={handleAddVideo}
                disabled={addLoading}
              >
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtnGrad}>
                  <Plus size={18} color={COLORS.text} />
                  <Text style={styles.addBtnText}>{addLoading ? 'Adding...' : 'Add Video'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  accessDenied: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  accessTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text },
  accessSub: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text },
  tabScroll: { maxHeight: 44, marginBottom: SPACING.md },
  tabList: { paddingHorizontal: SPACING.xl, gap: SPACING.sm, alignItems: 'center' },
  tabChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabChipText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textSecondary },
  tabChipTextActive: { color: COLORS.text },
  content: { flex: 1 },
  section: { padding: SPACING.xl, paddingBottom: 120 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xxl },
  statCard: {
    width: '47%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  statCardGrad: { padding: SPACING.lg, gap: SPACING.sm, alignItems: 'center' },
  statCardValue: { fontFamily: FONTS.bold, fontSize: 24 },
  statCardLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSecondary },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text, marginBottom: SPACING.md },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  miniInfo: { flex: 1 },
  miniTitle: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
  miniMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoRowInfo: { flex: 1 },
  videoRowTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  videoRowMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  videoRowActions: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfo: { flex: 1 },
  userUsername: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  userDisplay: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted },
  userActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  adminLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textSecondary },
  fieldWrap: { marginBottom: SPACING.md },
  fieldLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  fieldInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text,
  },
  addBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  addBtnDisabled: { opacity: 0.6 },
  addBtnGrad: { flexDirection: 'row', height: 52, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  addBtnText: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text },
  errorBox: {
    backgroundColor: 'rgba(230,57,70,0.15)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.3)',
  },
  errorText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.error },
});
