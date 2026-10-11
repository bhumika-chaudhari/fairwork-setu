import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Colors, Layout, Shadows } from '../constants/theme';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.page}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? Colors.page : Colors.background,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.appMaxWidth,
    backgroundColor: Colors.background,
    ...(Platform.OS === 'web' ? Shadows.cardLifted : null),
  },
});
