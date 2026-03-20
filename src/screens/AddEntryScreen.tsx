import React, { useState, useCallback, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { useTheme } from '../context/ThemeContext';
import { addEntry } from '../storage/storage';
import {
  requestCameraPermission,
  requestLocationPermission,
  requestNotificationPermission,
} from '../utils/permissions';
import { sendEntrySavedNotification } from '../utils/notifications';
import { TravelEntry } from '../types';

type FormState = {
  imageUri: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

const initialForm: FormState = {
  imageUri: null,
  address: null,
  latitude: null,
  longitude: null,
};

export default function AddEntryScreen() {
  const navigation = useNavigation();
  const { colors, isDark, toggleTheme } = useTheme();

  const [form, setForm] = useState<FormState>(initialForm);
  const [fetchingLocation, setFetchingLocation] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Track whether the user saved. If true, do NOT clear on focus.
  const didSaveRef = useRef<boolean>(false);

  // Clear form whenever the screen gains focus, UNLESS the user just saved
  useFocusEffect(
    useCallback(() => {
      if (!didSaveRef.current) {
        setForm(initialForm);
        setFetchingLocation(false);
        setSaving(false);
      }
      didSaveRef.current = false;
    }, [])
  );

  // Header dark mode toggle
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.text,
      headerRight: () => (
        <TouchableOpacity
          onPress={toggleTheme}
          style={[
            styles.iconBtn,
            { backgroundColor: colors.inputBg, borderColor: colors.border },
          ]}
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Text style={styles.iconBtnText}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, isDark, toggleTheme]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const buildAddress = (geo: Location.LocationGeocodedAddress): string => {
    const parts = [
      geo.streetNumber,
      geo.street,
      geo.district,
      geo.city,
      geo.region,
      geo.country,
    ].filter((p): p is string => Boolean(p));
    return parts.join(', ') || 'Unknown location';
  };

  const generateId = (): string =>
    `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  // ─── Take Picture ────────────────────────────────────────────────────────────

  const handleTakePicture = async (): Promise<void> => {
    if (saving) return;

    const hasCam = await requestCameraPermission();
    if (!hasCam) return;

    const hasLoc = await requestLocationPermission();
    if (!hasLoc) return;

    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
        exif: false,
      });
    } catch (error) {
      console.error('[AddEntry] Camera error:', error);
      Alert.alert('Camera Error', 'Failed to open the camera. Please try again.');
      return;
    }

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const uri = result.assets[0].uri;
    if (!uri) {
      Alert.alert('Error', 'No image was captured.');
      return;
    }

    // Set image immediately, then fetch location
    setForm((prev) => ({ ...prev, imageUri: uri, address: null, latitude: null, longitude: null }));
    setFetchingLocation(true);

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      const { latitude, longitude } = location.coords;

      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });

      const address =
        geocoded.length > 0 ? buildAddress(geocoded[0]) : 'Address not found';

      setForm((prev) => ({ ...prev, address, latitude, longitude }));
    } catch (error) {
      console.error('[AddEntry] Location error:', error);
      setForm((prev) => ({ ...prev, address: 'Could not determine address' }));
      Alert.alert(
        'Location Error',
        'Your photo was captured but we could not determine your location. You can still save the entry.'
      );
    } finally {
      setFetchingLocation(false);
    }
  };

  // ─── Save Entry ──────────────────────────────────────────────────────────────

  const handleSave = async (): Promise<void> => {
    // Validations
    if (!form.imageUri) {
      Alert.alert('No Photo', 'Please take a photo before saving your entry.');
      return;
    }
    if (fetchingLocation) {
      Alert.alert('Please Wait', 'Still fetching your location. Please wait a moment.');
      return;
    }
    if (!form.address) {
      Alert.alert(
        'No Address',
        'Location information is unavailable. Please retake the photo to try again.'
      );
      return;
    }
    if (saving) return;

    setSaving(true);

    try {
      const entry: TravelEntry = {
        id: generateId(),
        imageUri: form.imageUri,
        address: form.address,
        latitude: form.latitude ?? 0,
        longitude: form.longitude ?? 0,
        createdAt: new Date().toISOString(),
      };

      await addEntry(entry);

      // Request notification permission and send notification
      const hasNotifPerm = await requestNotificationPermission();
      if (hasNotifPerm) {
        await sendEntrySavedNotification(form.address);
      }

      didSaveRef.current = true;

      Alert.alert(
        '✅ Entry Saved',
        `Your travel memory at "${form.address}" has been saved to your diary!`,
        [{ text: 'Back to Diary', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('[AddEntry] Save error:', error);
      Alert.alert('Save Failed', 'Something went wrong while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Derived state ───────────────────────────────────────────────────────────

  const canSave =
    !!form.imageUri &&
    !!form.address &&
    !fetchingLocation &&
    !saving;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Photo section ── */}
      <Text style={[styles.sectionLabel, { color: colors.subtext }]}>PHOTO</Text>

      <TouchableOpacity
        onPress={handleTakePicture}
        disabled={saving}
        activeOpacity={0.75}
        style={[
          styles.cameraBox,
          {
            borderColor: form.imageUri ? colors.primary + '66' : colors.border,
            backgroundColor: colors.surface,
          },
        ]}
        accessibilityLabel="Take a photo"
        accessibilityRole="button"
      >
        {form.imageUri ? (
          <Image
            source={{ uri: form.imageUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>📷</Text>
            <Text style={[styles.placeholderText, { color: colors.subtext }]}>
              Tap to take a photo
            </Text>
            <Text style={[styles.placeholderHint, { color: colors.subtext }]}>
              Camera & location access required
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Retake button ── */}
      {form.imageUri && !saving && (
        <TouchableOpacity
          onPress={handleTakePicture}
          style={[styles.retakeBtn, { borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.retakeBtnText, { color: colors.subtext }]}>
            🔄 Retake Photo
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Address section ── */}
      {form.imageUri && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>
            LOCATION
          </Text>

          <View
            style={[
              styles.addressBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {fetchingLocation ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.subtext }]}>
                  Getting your address…
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.addressLabel, { color: colors.subtext }]}>
                  📍 Detected Address
                </Text>
                <Text style={[styles.addressText, { color: colors.text }]}>
                  {form.address ?? '—'}
                </Text>
              </>
            )}
          </View>
        </>
      )}

      {/* ── Validation hint ── */}
      {!form.imageUri && (
        <View style={[styles.hintBox, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '33' }]}>
          <Text style={[styles.hintText, { color: colors.primary }]}>
            ℹ️  Take a photo first. Your current address will be detected automatically via reverse geocoding.
          </Text>
        </View>
      )}

      {/* ── Save button ── */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.8}
        style={[
          styles.saveBtn,
          {
            backgroundColor: canSave ? colors.primary : colors.border,
          },
        ]}
        accessibilityLabel="Save travel entry"
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={[styles.saveBtnText, { opacity: canSave ? 1 : 0.5 }]}>
            Save Entry 💾
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 48,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  cameraBox: {
    width: '100%',
    height: 240,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 15,
    fontWeight: '500',
  },
  placeholderHint: {
    fontSize: 12,
    opacity: 0.7,
  },
  retakeBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addressBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    minHeight: 70,
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 5,
    letterSpacing: 0.4,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  hintBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 20,
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 4,
  },
  iconBtnText: { fontSize: 16 },
});