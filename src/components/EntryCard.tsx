import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { TravelEntry } from '../types';
import { useTheme } from '../context/ThemeContext';

interface EntryCardProps {
  entry: TravelEntry;
  onRemove: (id: string) => void;
}

export default function EntryCard({ entry, onRemove }: EntryCardProps) {
  const { colors } = useTheme();

  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleRemovePress = () => {
    Alert.alert(
      'Remove Entry',
      `Are you sure you want to remove this entry?\n\n"${entry.address}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(entry.id),
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Image
        source={{ uri: entry.imageUri }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel={`Photo taken at ${entry.address}`}
      />

      <View style={styles.body}>
        <View style={styles.addressRow}>
          <Text style={styles.pinEmoji}>📍</Text>
          <Text
            style={[styles.address, { color: colors.text }]}
            numberOfLines={2}
          >
            {entry.address}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.subtext }]}>
          {formattedDate}
        </Text>
      </View>

      <View
        style={[styles.divider, { backgroundColor: colors.border }]}
      />

      <TouchableOpacity
        onPress={handleRemovePress}
        style={[styles.removeBtn, { backgroundColor: colors.danger + '15' }]}
        activeOpacity={0.7}
        accessibilityLabel="Remove this travel entry"
        accessibilityRole="button"
      >
        <Text style={[styles.removeBtnText, { color: colors.danger }]}>
          🗑 Remove
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 210,
  },
  body: {
    padding: 14,
    paddingBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  pinEmoji: {
    fontSize: 15,
    marginTop: 1,
  },
  address: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  date: {
    fontSize: 12,
    marginLeft: 21,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  removeBtn: {
    marginHorizontal: 14,
    marginVertical: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});