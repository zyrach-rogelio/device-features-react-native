import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'granted') return true;

    Alert.alert(
      'Camera Permission Required',
      'This app needs camera access to capture travel photos. Please enable it in your device settings.',
      [{ text: 'OK', style: 'default' }]
    );
    return false;
  } catch (error) {
    console.error('[Permissions] Camera permission error:', error);
    Alert.alert('Error', 'Failed to request camera permission.');
    return false;
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') return true;

    Alert.alert(
      'Location Permission Required',
      'This app needs location access to record where your photos were taken. Please enable it in your device settings.',
      [{ text: 'OK', style: 'default' }]
    );
    return false;
  } catch (error) {
    console.error('[Permissions] Location permission error:', error);
    Alert.alert('Error', 'Failed to request location permission.');
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('travel-diary', {
          name: 'Travel Diary',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#534AB7',
        });
      }
      return true;
    }

    console.warn('[Permissions] Notification permission denied.');
    return false;
  } catch (error) {
    console.error('[Permissions] Notification permission error:', error);
    return false;
  }
}