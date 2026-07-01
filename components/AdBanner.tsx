import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

export function AdBanner() {
  return (
    <View style={styles.container}>
      <View style={styles.adLabel}>
        <Text style={styles.adLabelText}>Ad</Text>
      </View>
      <Text style={styles.adText}>Advertisement</Text>
      <Text style={styles.adSubText}>AdMob banner will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  adLabel: {
    backgroundColor: COLORS.border,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adLabelText: { fontFamily: FONTS.bold, fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.5 },
  adText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.textSecondary },
  adSubText: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted },
});
