import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { TravelEntry, RootStackParamList } from '../types';
import { getEntries, removeEntryById } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';
import EntryCard from '../components/EntryCard';
import EmptyState from '../components/EmptyState';

type NavProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors, isDark, toggleTheme } = useTheme();

  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Reload entries every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setLoading(true);

      getEntries()
        .then((data) => {
          if (isActive) setEntries(data);
        })
        .catch((err) => {
          console.error('[HomeScreen] Failed to load entries:', err);
          if (isActive)
            Alert.alert('Error', 'Failed to load your travel entries.');
        })
        .finally(() => {
          if (isActive) setLoading(false);
        });

      return () => {
        isActive = false;
      };
    }, [])
  );

  // Set header buttons
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.text,
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
            ]}
            accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            accessibilityRole="button"
          >
            <Text style={styles.iconBtnText}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('AddEntry')}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            accessibilityLabel="Add new travel entry"
            accessibilityRole="button"
          >
            <Text style={styles.addBtnText}>＋ Add Entry</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, colors, isDark, toggleTheme]);

  const handleRemove = useCallback(
    async (id: string) => {
      if (removingId) return; // Prevent double-tap
      setRemovingId(id);
      try {
        const updated = await removeEntryById(id);
        setEntries(updated);
      } catch (error) {
        console.error('[HomeScreen] Failed to remove entry:', error);
        Alert.alert('Error', 'Failed to remove the entry. Please try again.');
      } finally {
        setRemovingId(null);
      }
    },
    [removingId]
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onRemove={handleRemove}
          />
        )}
        contentContainerStyle={
          entries.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconBtnText: { fontSize: 16 },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});