import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { X, Send, Heart } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { CommentWithProfile, VideoWithProfile } from '@/types/database';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  video: VideoWithProfile | null;
  visible: boolean;
  onClose: () => void;
}

export function CommentsSheet({ video, visible, onClose }: Props) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : SCREEN_HEIGHT, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    if (visible && video) {
      loadComments();
    }
  }, [visible, video]);

  async function loadComments() {
    if (!video) return;
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('video_id', video.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setComments((data as unknown as CommentWithProfile[]) || []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!content.trim() || !user || !video) return;
    setSubmitting(true);
    const { data } = await supabase
      .from('comments')
      .insert({ video_id: video.id, content: content.trim() })
      .select('*, profiles(*)')
      .single();
    if (data) {
      setComments(c => [data as unknown as CommentWithProfile, ...c]);
      await supabase.from('videos').update({ comments_count: (video.comments_count || 0) + 1 }).eq('id', video.id);
    }
    setContent('');
    setSubmitting(false);
  }

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && translateY.value === SCREEN_HEIGHT) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comments {comments.length > 0 ? `(${comments.length})` : ''}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={{ padding: SPACING.lg }}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Image
                  source={{ uri: item.profiles.avatar_url || `https://i.pravatar.cc/150?u=${item.user_id}` }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentBody}>
                  <Text style={styles.commentUsername}>@{item.profiles.username}</Text>
                  <Text style={styles.commentContent}>{item.content}</Text>
                  <Text style={styles.commentTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
              </View>
            }
          />
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.inputRow}>
            <Image
              source={{ uri: profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}` }}
              style={styles.inputAvatar}
            />
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!content.trim() || submitting) && styles.sendDisabled]}
              onPress={handleSubmit}
              disabled={!content.trim() || submitting}
            >
              <Send size={18} color={content.trim() ? COLORS.primary : COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: SCREEN_HEIGHT * 0.75,
    minHeight: 300,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text },
  list: { flex: 1 },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentBody: { flex: 1 },
  commentUsername: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginBottom: 2 },
  commentContent: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  commentTime: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  emptyComments: { alignItems: 'center', padding: SPACING.huge },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  inputAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 80,
  },
  sendBtn: { padding: SPACING.sm },
  sendDisabled: { opacity: 0.4 },
});
